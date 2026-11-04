-- Study "year" becomes the batch session (for example 2024-28), and onboarding keeps
-- the registration number in the existing roll_number column. academic_year stays as
-- an unused legacy column so older rows and views keep working.

alter table public.profiles
  add column academic_session text check (academic_session ~ '^[0-9]{4}-[0-9]{2}$');

grant update (academic_session) on public.profiles to authenticated;

-- Views: append the new column (create or replace may only add columns at the end).
create or replace view public.public_profiles
with (security_barrier = true)
as
  select id, full_name, avatar_url, bio, branch, academic_year, academic_session
  from public.profiles
  where public_profile and member_status in ('member', 'alumni');

create or replace view public.member_directory
with (security_barrier = true)
as
  select id, full_name, avatar_url, branch, academic_year, academic_session
  from public.profiles
  where member_status = 'member'
    and (public.is_member() or public.is_staff());

-- Member picker returns the session instead of the year.
drop function public.search_members(text);
create function public.search_members(p_query text)
returns table (id uuid, full_name text, avatar_url text, branch text, academic_session text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_user();
  if not (public.is_member() or public.is_staff()) then
    raise exception 'NOT_ALLOWED';
  end if;
  if char_length(trim(coalesce(p_query, ''))) < 2 then
    return;
  end if;

  return query
    select p.id, p.full_name, p.avatar_url, p.branch, p.academic_session
    from public.profiles p
    where p.member_status = 'member'
      and p.full_name ilike '%' || replace(replace(trim(p_query), '%', ''), '_', '') || '%'
    order by p.full_name
    limit 10;
end;
$$;

revoke all on function public.search_members(text) from public, anon;
grant execute on function public.search_members(text) to authenticated;

-- Onboarding takes the session in place of the year.
drop function public.complete_onboarding(text, text, boolean, text, text, smallint, text);
create function public.complete_onboarding(
  p_full_name text,
  p_phone text,
  p_is_our_student boolean,
  p_college_name text default null,
  p_branch text default null,
  p_academic_session text default null,
  p_roll_number text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = v_uid for update;
  if v_profile.id is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;
  if char_length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'NAME_REQUIRED';
  end if;
  if coalesce(p_phone, '') !~ '^\+?[0-9 ]{8,16}$' then
    raise exception 'PHONE_INVALID';
  end if;

  if v_profile.student_status = 'verified' then
    -- Verified identity fields are locked; only contact and study details change.
    update public.profiles
    set full_name = trim(p_full_name),
        phone = trim(p_phone),
        branch = coalesce(p_branch, branch),
        academic_session = coalesce(p_academic_session, academic_session),
        onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid
    returning * into v_profile;
  elsif p_is_our_student then
    if p_branch is null or p_academic_session is null or char_length(trim(coalesce(p_roll_number, ''))) < 3 then
      raise exception 'STUDENT_DETAILS_REQUIRED';
    end if;
    update public.profiles
    set full_name = trim(p_full_name),
        phone = trim(p_phone),
        college_name = null,
        branch = trim(p_branch),
        academic_session = p_academic_session,
        roll_number = upper(trim(p_roll_number)),
        student_status = 'pending',
        onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid
    returning * into v_profile;
  else
    if v_profile.member_status in ('member', 'applicant') then
      raise exception 'MEMBERS_MUST_BE_STUDENTS';
    end if;
    if char_length(trim(coalesce(p_college_name, ''))) < 2 then
      raise exception 'COLLEGE_REQUIRED';
    end if;
    update public.profiles
    set full_name = trim(p_full_name),
        phone = trim(p_phone),
        college_name = trim(p_college_name),
        branch = nullif(trim(coalesce(p_branch, '')), ''),
        academic_session = p_academic_session,
        roll_number = null,
        student_status = 'external',
        onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid
    returning * into v_profile;
  end if;

  return v_profile;
end;
$$;

revoke all on function public.complete_onboarding(text, text, boolean, text, text, text, text) from public, anon;
grant execute on function public.complete_onboarding(text, text, boolean, text, text, text, text) to authenticated;
