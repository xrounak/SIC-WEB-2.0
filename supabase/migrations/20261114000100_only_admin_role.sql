-- Three kinds of account: user, member, admin. The Vice President, President and Faculty
-- Coordinator roles are gone: an admin does everything they did (final event approval,
-- recruitment cycles, teams, notices to everyone, the audit log).
-- Team leads are not a site role; they stay as a seat inside a team.
--
-- The three old role names stay in the enum type (Postgres can't drop enum values), but a
-- constraint now allows only 'admin' in user_roles, and assign_role refuses the others.

-- People who held the old roles lose them. Give them 'admin' again if they need it.
delete from public.user_roles where role <> 'admin';

alter table public.user_roles
  add constraint user_roles_admin_only check (role = 'admin');

-- "Exec" now means admin. Policies and functions that call is_exec() follow automatically.
create or replace function public.is_exec()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

drop policy if exists "President and admin read audit log" on public.audit_logs;
create policy "Admins read audit log"
  on public.audit_logs for select to authenticated
  using (public.is_admin());

create or replace function public.assign_role(p_user_id uuid, p_role public.app_role)
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
  if p_role <> 'admin' then
    raise exception 'ROLE_NOT_SUPPORTED';
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

create or replace function public.review_event(
  p_event_id uuid,
  p_decision text,
  p_notes text default null,
  p_mark_major boolean default false
)
returns public.event_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_event public.events;
  v_stage text;
  v_new_status public.event_status;
  v_creator_email text;
begin
  if p_decision not in ('approved', 'changes_requested', 'rejected') then
    raise exception 'INVALID_DECISION';
  end if;
  if p_decision <> 'approved' and char_length(trim(coalesce(p_notes, ''))) < 5 then
    raise exception 'NOTES_REQUIRED';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  -- Nobody approves their own proposal, except an admin (who can do everything).
  if v_event.created_by = v_uid and not public.is_admin() then
    raise exception 'CANNOT_REVIEW_OWN';
  end if;

  if v_event.status = 'pending_review' then
    v_stage := 'lead';
    if not (public.leads_team(v_event.owner_team_id) or public.is_exec()) then
      raise exception 'NOT_ALLOWED';
    end if;
  elsif v_event.status = 'lead_approved' and v_event.is_major then
    v_stage := 'final';
    if not public.is_exec() then
      raise exception 'NOT_ALLOWED';
    end if;
  else
    raise exception 'INVALID_STATUS';
  end if;

  v_new_status := case p_decision
    when 'changes_requested' then 'changes_requested'::public.event_status
    when 'rejected' then 'rejected'::public.event_status
    else case v_stage when 'lead' then 'lead_approved'::public.event_status else 'final_approved'::public.event_status end
  end;

  update public.events
  set status = v_new_status,
      is_major = is_major or (v_stage = 'lead' and coalesce(p_mark_major, false))
  where id = p_event_id
  returning * into v_event;

  insert into public.event_reviews (event_id, stage, reviewer_id, decision, notes)
  values (p_event_id, v_stage, v_uid, p_decision, nullif(trim(coalesce(p_notes, '')), ''));

  perform private.notify(v_event.created_by, 'event_decision',
    case p_decision
      when 'approved' then 'Your proposal "' || v_event.title || '" was approved'
      when 'changes_requested' then 'Changes requested on "' || v_event.title || '"'
      else 'Your proposal "' || v_event.title || '" was not approved'
    end,
    p_notes, '/portal/proposals/' || p_event_id);

  select email into v_creator_email from public.profiles where id = v_event.created_by;
  perform private.enqueue_email(v_creator_email, 'event-decision',
    jsonb_build_object('event_id', p_event_id, 'title', v_event.title, 'stage', v_stage,
                       'decision', p_decision, 'notes', p_notes),
    'event-decision:' || p_event_id || ':' || v_stage || ':' || extract(epoch from now())::bigint);

  -- Major events now wait on an admin.
  if v_new_status = 'lead_approved' and v_event.is_major then
    insert into public.notifications (user_id, kind, title, target_url)
    select distinct ur.user_id, 'event_review', 'Final approval needed: ' || v_event.title, '/manage/events/' || p_event_id
    from public.user_roles ur
    where ur.role = 'admin' and ur.user_id <> v_event.created_by;
  end if;

  perform private.audit('event.reviewed', 'event', p_event_id,
    jsonb_build_object('stage', v_stage, 'decision', p_decision));
  return v_new_status;
end;
$$;
