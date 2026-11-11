-- Onboarding: every field is needed. Students of other colleges now also give their branch
-- and session (they were optional). Students of our college already needed branch, session
-- and a registration number; that can be a roll number with letters in it.
-- Same signature as before, so existing callers keep working.

create or replace function public.complete_onboarding(
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
    if char_length(trim(coalesce(p_branch, ''))) = 0
       or char_length(trim(coalesce(p_academic_session, ''))) = 0
       or char_length(trim(coalesce(p_roll_number, ''))) < 3 then
      raise exception 'STUDENT_DETAILS_REQUIRED';
    end if;
    update public.profiles
    set full_name = trim(p_full_name),
        phone = trim(p_phone),
        college_name = null,
        branch = trim(p_branch),
        academic_session = trim(p_academic_session),
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
    if char_length(trim(coalesce(p_branch, ''))) = 0 or char_length(trim(coalesce(p_academic_session, ''))) = 0 then
      raise exception 'BRANCH_SESSION_REQUIRED';
    end if;
    update public.profiles
    set full_name = trim(p_full_name),
        phone = trim(p_phone),
        college_name = trim(p_college_name),
        branch = trim(p_branch),
        academic_session = trim(p_academic_session),
        roll_number = null,
        student_status = 'external',
        onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid
    returning * into v_profile;
  end if;

  return v_profile;
end;
$$;
