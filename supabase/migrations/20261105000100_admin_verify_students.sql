-- Admins can verify students too. Until now only team leads and the president / vice
-- president could, so an account that is "admin" alone got NOT_ALLOWED on Verify.

create or replace function public.verify_student(p_user_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_status public.student_status;
begin
  if not (public.is_any_lead() or public.is_exec() or public.is_admin()) then
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
    case when p_approve then null else 'Check your registration number in your profile and contact the club if it is correct.' end,
    '/portal/profile'
  );
  perform private.audit(
    case when p_approve then 'student.verified' else 'student.rejected' end,
    'profile', p_user_id
  );
end;
$$;
