-- Workflow RPCs: onboarding, student verification, roles, club team seats, member search.
-- Errors are raised with a stable UPPER_SNAKE code as the message; the app maps codes to copy.

create function public.complete_onboarding(
  p_full_name text,
  p_phone text,
  p_is_our_student boolean,
  p_college_name text default null,
  p_branch text default null,
  p_academic_year smallint default null,
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
        academic_year = coalesce(p_academic_year, academic_year),
        onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid
    returning * into v_profile;
  elsif p_is_our_student then
    if p_branch is null or p_academic_year is null or char_length(trim(coalesce(p_roll_number, ''))) < 3 then
      raise exception 'STUDENT_DETAILS_REQUIRED';
    end if;
    update public.profiles
    set full_name = trim(p_full_name),
        phone = trim(p_phone),
        college_name = null,
        branch = trim(p_branch),
        academic_year = p_academic_year,
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
        academic_year = p_academic_year,
        roll_number = null,
        student_status = 'external',
        onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid
    returning * into v_profile;
  end if;

  return v_profile;
end;
$$;

create function public.verify_student(p_user_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_status public.student_status;
begin
  if not (public.is_any_lead() or public.is_exec()) then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_user_id = v_uid then
    raise exception 'CANNOT_VERIFY_SELF';
  end if;

  select student_status into v_status from public.profiles where id = p_user_id for update;
  if v_status is distinct from 'pending' then
    raise exception 'INVALID_STATUS';
  end if;

  begin
    update public.profiles
    set student_status = case when p_approve then 'verified'::public.student_status else 'rejected'::public.student_status end
    where id = p_user_id;
  exception when unique_violation then
    raise exception 'ROLL_NUMBER_TAKEN';
  end;

  perform private.notify(
    p_user_id,
    'student_verification',
    case when p_approve then 'Your student status is verified' else 'We could not verify your student status' end,
    case when p_approve then null else 'Check your roll number in your profile and contact the club if it is correct.' end,
    '/portal/profile'
  );
  perform private.audit(
    case when p_approve then 'student.verified' else 'student.rejected' end,
    'profile', p_user_id
  );
end;
$$;

create function public.assign_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'USER_NOT_FOUND';
  end if;

  insert into public.user_roles (user_id, role, assigned_by)
  values (p_user_id, p_role, v_uid)
  on conflict (user_id, role) do nothing;

  if found then
    perform private.audit('role.assigned', 'profile', p_user_id, jsonb_build_object('role', p_role));
    perform private.notify(p_user_id, 'role', 'You have a new role: ' || replace(p_role::text, '_', ' '), null, '/manage');
  end if;
end;
$$;

create function public.revoke_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_user();
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_role = 'admin' and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'LAST_ADMIN';
  end if;

  delete from public.user_roles where user_id = p_user_id and role = p_role;
  if found then
    perform private.audit('role.revoked', 'profile', p_user_id, jsonb_build_object('role', p_role));
  end if;
end;
$$;

-- Add, change or remove (p_team_role null) a member's seat on a club team.
create function public.set_team_member(p_team_id uuid, p_user_id uuid, p_team_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_name text;
begin
  perform private.require_user();
  if not (public.is_exec() or public.is_admin()) then
    raise exception 'NOT_ALLOWED';
  end if;
  select name into v_team_name from public.teams where id = p_team_id;
  if v_team_name is null then
    raise exception 'TEAM_NOT_FOUND';
  end if;

  if p_team_role is null then
    update public.team_members set status = 'inactive'
    where team_id = p_team_id and member_id = p_user_id;
    perform private.audit('team_member.removed', 'team', p_team_id, jsonb_build_object('user_id', p_user_id));
    return;
  end if;

  if p_team_role not in ('member', 'deputy', 'lead') then
    raise exception 'INVALID_TEAM_ROLE';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id and member_status = 'member') then
    raise exception 'NOT_A_MEMBER';
  end if;

  insert into public.team_members (team_id, member_id, team_role, status)
  values (p_team_id, p_user_id, p_team_role, 'active')
  on conflict (team_id, member_id) do update set team_role = excluded.team_role, status = 'active';

  perform private.audit('team_member.set', 'team', p_team_id,
    jsonb_build_object('user_id', p_user_id, 'team_role', p_team_role));
  perform private.notify(p_user_id, 'team', 'You are now ' || p_team_role || ' of ' || v_team_name, null, '/portal/teams');
end;
$$;

-- Member picker for project contributors and team management.
create function public.search_members(p_query text)
returns table (id uuid, full_name text, avatar_url text, branch text, academic_year smallint)
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
    select p.id, p.full_name, p.avatar_url, p.branch, p.academic_year
    from public.profiles p
    where p.member_status = 'member'
      and p.full_name ilike '%' || replace(replace(trim(p_query), '%', ''), '_', '') || '%'
    order by p.full_name
    limit 10;
end;
$$;
