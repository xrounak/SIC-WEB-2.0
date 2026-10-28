-- Workflow RPCs: event proposals, two-stage review, publication, registration and event teams.

-- ---------------------------------------------------------------------------
-- Internal guards
-- ---------------------------------------------------------------------------

create function private.require_onboarded(p_uid uuid)
returns public.profiles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = p_uid;
  if v_profile.onboarded_at is null then
    raise exception 'ONBOARDING_REQUIRED';
  end if;
  return v_profile;
end;
$$;

-- Locks the event row so seat counts are checked one registration at a time.
create function private.lock_open_event(p_event_id uuid)
returns public.events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null or v_event.status <> 'published'
     or (v_event.visibility = 'members' and not public.is_member()) then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if v_event.reg_opens_at is not null and now() < v_event.reg_opens_at then
    raise exception 'REGISTRATION_NOT_OPEN';
  end if;
  if now() >= coalesce(v_event.reg_closes_at, v_event.starts_at, 'infinity'::timestamptz) then
    raise exception 'REGISTRATION_CLOSED';
  end if;
  return v_event;
end;
$$;

create function private.assert_can_take_seat(p_event public.events, p_uid uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.event_registrations
    where event_id = p_event.id and user_id = p_uid and status <> 'cancelled'
  ) then
    raise exception 'ALREADY_REGISTERED';
  end if;
  if p_event.capacity is not null and (
    select count(*) from public.event_registrations
    where event_id = p_event.id and status in ('registered', 'attended')
  ) >= p_event.capacity then
    raise exception 'EVENT_FULL';
  end if;
end;
$$;

create function private.normalize_emails(p_emails text[])
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_result text[];
begin
  select coalesce(array_agg(distinct e), '{}')
  into v_result
  from (select lower(trim(x)) as e from unnest(coalesce(p_emails, '{}')) as x) s
  where e <> '';

  if exists (select 1 from unnest(v_result) e where e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'INVITE_EMAIL_INVALID';
  end if;
  return v_result;
end;
$$;

create function private.create_team_invite(p_team_id uuid, p_email text, p_inviter uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := private.new_token();
  v_invite_id uuid;
  v_team public.event_teams;
  v_event public.events;
  v_leader_name text;
begin
  select * into v_team from public.event_teams where id = p_team_id;
  select * into v_event from public.events where id = v_team.event_id;
  select full_name into v_leader_name from public.profiles where id = v_team.leader_id;

  begin
    insert into public.team_invites (event_team_id, email, invited_by, token_hash, expires_at)
    values (
      p_team_id, p_email, p_inviter, private.hash_token(v_token),
      coalesce(v_event.reg_closes_at, v_event.starts_at, now() + interval '14 days')
    )
    returning id into v_invite_id;
  exception when unique_violation then
    raise exception 'ALREADY_INVITED';
  end;

  perform private.enqueue_email(
    p_email,
    'team-invite',
    jsonb_build_object(
      'token', v_token,
      'event_title', v_event.title,
      'event_slug', v_event.slug,
      'event_starts_at', v_event.starts_at,
      'team_name', v_team.name,
      'leader_name', v_leader_name
    ),
    'team-invite:' || v_invite_id || ':' || private.hash_token(v_token)
  );

  -- Invitee may already have an account.
  insert into public.notifications (user_id, kind, title, body, target_url)
  select p.id, 'team_invite', v_leader_name || ' invited you to team ' || v_team.name,
         v_event.title, '/invite/' || v_token
  from public.profiles p
  where p.email = p_email;
end;
$$;

create function private.refresh_team_status(p_team_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team public.event_teams;
  v_min smallint;
  v_count int;
  v_new_status text;
begin
  select * into v_team from public.event_teams where id = p_team_id for update;
  if v_team.status = 'withdrawn' then
    return v_team.status;
  end if;

  select team_min into v_min from public.events where id = v_team.event_id;
  select count(*) into v_count
  from public.event_registrations
  where event_team_id = p_team_id and status <> 'cancelled';

  v_new_status := case when v_count >= v_min then 'complete' else 'forming' end;
  if v_new_status <> v_team.status then
    update public.event_teams set status = v_new_status where id = p_team_id;
    if v_new_status = 'complete' then
      perform private.notify(v_team.leader_id, 'team_complete', 'Team ' || v_team.name || ' is complete',
        'Your team has enough members to take part.', '/portal/registrations');
    end if;
  end if;
  return v_new_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Proposals and review
-- ---------------------------------------------------------------------------

create function public.submit_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_event public.events;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null or v_event.created_by <> v_uid then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if v_event.status not in ('draft', 'changes_requested') then
    raise exception 'INVALID_STATUS';
  end if;
  if not public.is_member() then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_event.summary is null or v_event.description is null or v_event.venue is null
     or v_event.starts_at is null then
    raise exception 'EVENT_INCOMPLETE';
  end if;
  if v_event.starts_at <= now() then
    raise exception 'EVENT_IN_PAST';
  end if;

  update public.events
  set status = 'pending_review',
      is_major = is_major
        or event_type in ('hackathon', 'competition', 'external')
        or coalesce(capacity, 0) > 100
  where id = p_event_id;

  insert into public.notifications (user_id, kind, title, body, target_url)
  select tm.member_id, 'event_review', 'New event proposal: ' || v_event.title, null, '/manage/events/' || p_event_id
  from public.team_members tm
  where tm.team_id = v_event.owner_team_id and tm.team_role = 'lead' and tm.status = 'active'
    and tm.member_id <> v_uid;

  perform private.enqueue_telegram('event-submitted',
    jsonb_build_object('event_id', p_event_id, 'title', v_event.title),
    'event-submitted:' || p_event_id || ':' || extract(epoch from now())::bigint);
  perform private.audit('event.submitted', 'event', p_event_id);
end;
$$;

create function public.review_event(
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
  if v_event.created_by = v_uid then
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

  -- Major events now wait on VP / President.
  if v_new_status = 'lead_approved' and v_event.is_major then
    insert into public.notifications (user_id, kind, title, target_url)
    select distinct ur.user_id, 'event_review', 'Final approval needed: ' || v_event.title, '/manage/events/' || p_event_id
    from public.user_roles ur
    where ur.role in ('vice_president', 'president') and ur.user_id <> v_event.created_by;
  end if;

  perform private.audit('event.reviewed', 'event', p_event_id,
    jsonb_build_object('stage', v_stage, 'decision', p_decision));
  return v_new_status;
end;
$$;

create function public.publish_event(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_slug text;
begin
  perform private.require_user();
  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if not public.can_manage_event(p_event_id) then
    raise exception 'NOT_ALLOWED';
  end if;
  if not ((v_event.status = 'lead_approved' and not v_event.is_major) or v_event.status = 'final_approved') then
    raise exception 'NOT_READY';
  end if;
  if v_event.starts_at is null or v_event.starts_at <= now() then
    raise exception 'EVENT_IN_PAST';
  end if;

  v_slug := coalesce(
    v_event.slug,
    coalesce(nullif(left(public.slugify(v_event.title), 60), ''), 'event')
      || '-' || left(replace(v_event.id::text, '-', ''), 6)
  );

  update public.events
  set status = 'published',
      slug = trim(both '-' from v_slug),
      published_at = now(),
      reg_closes_at = coalesce(reg_closes_at, starts_at)
  where id = p_event_id;

  perform private.notify(v_event.created_by, 'event_published', '"' || v_event.title || '" is live', null, '/events/' || v_slug);
  perform private.audit('event.published', 'event', p_event_id);
  return v_slug;
end;
$$;

create function public.cancel_event(p_event_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  perform private.require_user();
  if char_length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'REASON_REQUIRED';
  end if;
  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null or not public.can_manage_event(p_event_id) then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_event.status <> 'published' then
    raise exception 'INVALID_STATUS';
  end if;

  update public.events set status = 'cancelled' where id = p_event_id;

  insert into public.notifications (user_id, kind, title, body, target_url)
  select r.user_id, 'event_cancelled', v_event.title || ' is cancelled', p_reason, '/events/' || v_event.slug
  from public.event_registrations r
  where r.event_id = p_event_id and r.status = 'registered';

  insert into public.email_outbox (channel, to_address, template, payload, idempotency_key)
  select 'email', p.email, 'event-cancelled',
         jsonb_build_object('title', v_event.title, 'reason', p_reason, 'starts_at', v_event.starts_at),
         'event-cancelled:' || r.id
  from public.event_registrations r
  join public.profiles p on p.id = r.user_id
  where r.event_id = p_event_id and r.status = 'registered'
  on conflict (idempotency_key) do nothing;

  perform private.audit('event.cancelled', 'event', p_event_id, jsonb_build_object('reason', p_reason));
end;
$$;

-- ---------------------------------------------------------------------------
-- Registration
-- ---------------------------------------------------------------------------

create function public.register_individual(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_profile public.profiles := private.require_onboarded(v_uid);
  v_event public.events := private.lock_open_event(p_event_id);
  v_registration_id uuid;
begin
  if v_event.participation <> 'individual' then
    raise exception 'TEAM_EVENT';
  end if;
  perform private.assert_can_take_seat(v_event, v_uid);

  insert into public.event_registrations (event_id, user_id)
  values (p_event_id, v_uid)
  returning id into v_registration_id;

  perform private.notify(v_uid, 'registration', 'You are registered for ' || v_event.title, null, '/portal/registrations');
  perform private.enqueue_email(v_profile.email, 'registration-confirmed',
    jsonb_build_object('title', v_event.title, 'slug', v_event.slug, 'starts_at', v_event.starts_at,
                       'venue', v_event.venue, 'registration_id', v_registration_id),
    'registration:' || v_registration_id);
  return v_registration_id;
end;
$$;

create function public.create_event_team(p_event_id uuid, p_team_name text, p_invite_emails text[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_profile public.profiles := private.require_onboarded(v_uid);
  v_event public.events := private.lock_open_event(p_event_id);
  v_emails text[] := private.normalize_emails(p_invite_emails);
  v_team_id uuid;
  v_email text;
begin
  if v_event.participation <> 'team' then
    raise exception 'INDIVIDUAL_EVENT';
  end if;
  if char_length(trim(coalesce(p_team_name, ''))) < 2 then
    raise exception 'TEAM_NAME_REQUIRED';
  end if;
  if v_profile.email = any (v_emails) then
    raise exception 'CANNOT_INVITE_SELF';
  end if;
  if cardinality(v_emails) > v_event.team_max - 1 then
    raise exception 'TOO_MANY_INVITES';
  end if;
  perform private.assert_can_take_seat(v_event, v_uid);

  begin
    insert into public.event_teams (event_id, name, leader_id)
    values (p_event_id, trim(p_team_name), v_uid)
    returning id into v_team_id;
  exception when unique_violation then
    raise exception 'TEAM_NAME_TAKEN';
  end;

  insert into public.event_registrations (event_id, user_id, event_team_id, team_role)
  values (p_event_id, v_uid, v_team_id, 'leader');

  foreach v_email in array v_emails loop
    perform private.create_team_invite(v_team_id, v_email, v_uid);
  end loop;

  perform private.refresh_team_status(v_team_id);
  perform private.enqueue_email(v_profile.email, 'team-created',
    jsonb_build_object('title', v_event.title, 'slug', v_event.slug, 'team_name', trim(p_team_name),
                       'team_min', v_event.team_min, 'invited', to_jsonb(v_emails)),
    'team-created:' || v_team_id);
  return v_team_id;
end;
$$;

-- Read-only preview for /invite/[token]; works before sign-in.
create function public.get_invite(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'status', case when i.status = 'pending' and i.expires_at <= now() then 'expired' else i.status end,
    'email_hint', left(i.email, 1) || '***@' || split_part(i.email, '@', 2),
    'expires_at', i.expires_at,
    'team_name', t.name,
    'team_status', t.status,
    'leader_name', lp.full_name,
    'event_title', e.title,
    'event_slug', e.slug,
    'event_starts_at', e.starts_at,
    'event_venue', e.venue
  )
  from public.team_invites i
  join public.event_teams t on t.id = i.event_team_id
  join public.events e on e.id = t.event_id
  join public.profiles lp on lp.id = t.leader_id
  where i.token_hash = private.hash_token(p_token);
$$;

create function private.lock_invite_for_user(p_token text, p_email text)
returns public.team_invites
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.team_invites;
begin
  select * into v_invite from public.team_invites where token_hash = private.hash_token(p_token) for update;
  if v_invite.id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'INVITE_%', upper(v_invite.status);
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'INVITE_EXPIRED';
  end if;
  if v_invite.email <> p_email then
    raise exception 'INVITE_EMAIL_MISMATCH';
  end if;
  return v_invite;
end;
$$;

create function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_profile public.profiles := private.require_onboarded(v_uid);
  v_invite public.team_invites := private.lock_invite_for_user(p_token, v_profile.email);
  v_team public.event_teams;
  v_event public.events;
  v_registration_id uuid;
begin
  select * into v_team from public.event_teams where id = v_invite.event_team_id for update;
  if v_team.status = 'withdrawn' then
    raise exception 'TEAM_WITHDRAWN';
  end if;
  v_event := private.lock_open_event(v_team.event_id);
  perform private.assert_can_take_seat(v_event, v_uid);
  if (select count(*) from public.event_registrations
      where event_team_id = v_team.id and status <> 'cancelled') >= v_event.team_max then
    raise exception 'TEAM_FULL';
  end if;

  insert into public.event_registrations (event_id, user_id, event_team_id, team_role)
  values (v_event.id, v_uid, v_team.id, 'member')
  returning id into v_registration_id;

  update public.team_invites
  set status = 'accepted', accepted_by = v_uid, responded_at = now()
  where id = v_invite.id;

  perform private.refresh_team_status(v_team.id);
  perform private.notify(v_team.leader_id, 'team_invite_accepted',
    v_profile.full_name || ' joined ' || v_team.name, v_event.title, '/portal/registrations');
  perform private.enqueue_email(v_profile.email, 'registration-confirmed',
    jsonb_build_object('title', v_event.title, 'slug', v_event.slug, 'starts_at', v_event.starts_at,
                       'venue', v_event.venue, 'team_name', v_team.name, 'registration_id', v_registration_id),
    'registration:' || v_registration_id);
  return v_registration_id;
end;
$$;

create function public.decline_invite(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_profile public.profiles;
  v_invite public.team_invites;
  v_team public.event_teams;
begin
  select * into v_profile from public.profiles where id = v_uid;
  v_invite := private.lock_invite_for_user(p_token, v_profile.email);
  select * into v_team from public.event_teams where id = v_invite.event_team_id;

  update public.team_invites set status = 'declined', responded_at = now() where id = v_invite.id;
  perform private.notify(v_team.leader_id, 'team_invite_declined',
    coalesce(nullif(v_profile.full_name, ''), v_profile.email) || ' declined your invite to ' || v_team.name,
    null, '/portal/registrations');
end;
$$;

create function private.require_team_leader(p_team_id uuid, p_uid uuid)
returns public.event_teams
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team public.event_teams;
begin
  select * into v_team from public.event_teams where id = p_team_id for update;
  if v_team.id is null or v_team.leader_id <> p_uid then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_team.status = 'withdrawn' then
    raise exception 'TEAM_WITHDRAWN';
  end if;
  return v_team;
end;
$$;

create function public.add_team_invites(p_team_id uuid, p_emails text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_team public.event_teams := private.require_team_leader(p_team_id, v_uid);
  v_event public.events := private.lock_open_event(v_team.event_id);
  v_emails text[] := private.normalize_emails(p_emails);
  v_email text;
  v_used int;
begin
  if (select email from public.profiles where id = v_uid) = any (v_emails) then
    raise exception 'CANNOT_INVITE_SELF';
  end if;
  select
    (select count(*) from public.event_registrations where event_team_id = p_team_id and status <> 'cancelled')
    + (select count(*) from public.team_invites where event_team_id = p_team_id and status = 'pending' and expires_at > now())
  into v_used;
  if v_used + cardinality(v_emails) > v_event.team_max then
    raise exception 'TOO_MANY_INVITES';
  end if;

  foreach v_email in array v_emails loop
    perform private.create_team_invite(p_team_id, v_email, v_uid);
  end loop;
end;
$$;

create function public.revoke_team_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_invite public.team_invites;
begin
  select * into v_invite from public.team_invites where id = p_invite_id for update;
  if v_invite.id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  perform private.require_team_leader(v_invite.event_team_id, v_uid);
  if v_invite.status <> 'pending' then
    raise exception 'INVALID_STATUS';
  end if;
  update public.team_invites set status = 'revoked', responded_at = now() where id = p_invite_id;
end;
$$;

-- New token, new email. The old link stops working.
create function public.resend_team_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_invite public.team_invites;
begin
  select * into v_invite from public.team_invites where id = p_invite_id for update;
  if v_invite.id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  perform private.require_team_leader(v_invite.event_team_id, v_uid);
  if v_invite.status not in ('pending', 'expired', 'declined') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.team_invites set status = 'revoked', responded_at = now() where id = p_invite_id;
  perform private.create_team_invite(v_invite.event_team_id, v_invite.email, v_uid);
end;
$$;

create function public.withdraw_registration(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_reg public.event_registrations;
  v_event public.events;
  v_team public.event_teams;
begin
  select * into v_reg from public.event_registrations where id = p_registration_id for update;
  if v_reg.id is null or v_reg.user_id <> v_uid then
    raise exception 'REGISTRATION_NOT_FOUND';
  end if;
  if v_reg.status <> 'registered' then
    raise exception 'INVALID_STATUS';
  end if;
  select * into v_event from public.events where id = v_reg.event_id;
  if v_event.starts_at <= now() then
    raise exception 'EVENT_STARTED';
  end if;

  if v_reg.team_role = 'leader' then
    -- Leader leaving withdraws the whole team.
    select * into v_team from public.event_teams where id = v_reg.event_team_id for update;
    update public.event_teams set status = 'withdrawn' where id = v_team.id;
    update public.team_invites set status = 'revoked', responded_at = now()
    where event_team_id = v_team.id and status = 'pending';

    insert into public.notifications (user_id, kind, title, body, target_url)
    select r.user_id, 'team_withdrawn', 'Team ' || v_team.name || ' withdrew', v_event.title, '/portal/registrations'
    from public.event_registrations r
    where r.event_team_id = v_team.id and r.status = 'registered' and r.user_id <> v_uid;

    update public.event_registrations set status = 'cancelled'
    where event_team_id = v_team.id and status = 'registered';
  else
    update public.event_registrations set status = 'cancelled' where id = p_registration_id;
    if v_reg.event_team_id is not null then
      select * into v_team from public.event_teams where id = v_reg.event_team_id;
      perform private.refresh_team_status(v_team.id);
      perform private.notify(v_team.leader_id, 'team_member_left',
        'A member left ' || v_team.name, v_event.title, '/portal/registrations');
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Scheduled maintenance (Vercel cron calls this with the service role, e.g. hourly)
-- ---------------------------------------------------------------------------

create function public.run_scheduled_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reminded int;
  v_withdrawn int;
  v_expired int;
  v_completed int;
begin
  -- 1. Remind leaders of incomplete teams 24 hours before registration closes.
  insert into public.email_outbox (channel, to_address, template, payload, idempotency_key)
  select 'email', p.email, 'team-incomplete-reminder',
         jsonb_build_object('title', e.title, 'slug', e.slug, 'team_name', t.name,
                            'team_min', e.team_min, 'closes_at', coalesce(e.reg_closes_at, e.starts_at)),
         'team-reminder:' || t.id
  from public.event_teams t
  join public.events e on e.id = t.event_id
  join public.profiles p on p.id = t.leader_id
  where t.status = 'forming'
    and e.status = 'published'
    and coalesce(e.reg_closes_at, e.starts_at) between now() and now() + interval '24 hours'
  on conflict (idempotency_key) do nothing;
  get diagnostics v_reminded = row_count;

  -- 2. Withdraw teams still incomplete after registration closed.
  with closed as (
    update public.event_teams t
    set status = 'withdrawn'
    from public.events e
    where e.id = t.event_id
      and t.status = 'forming'
      and coalesce(e.reg_closes_at, e.starts_at) <= now()
    returning t.id, t.name, t.leader_id, e.title
  ), cancelled as (
    update public.event_registrations r
    set status = 'cancelled'
    from closed
    where r.event_team_id = closed.id and r.status = 'registered'
    returning r.user_id, closed.name, closed.title
  )
  insert into public.notifications (user_id, kind, title, body, target_url)
  select user_id, 'team_withdrawn', 'Team ' || name || ' did not reach the minimum size',
         'Registration for ' || title || ' has closed, so the team was withdrawn.', '/portal/registrations'
  from cancelled;
  get diagnostics v_withdrawn = row_count;

  -- 3. Expire stale invites.
  update public.team_invites set status = 'expired'
  where status = 'pending' and expires_at <= now();
  get diagnostics v_expired = row_count;

  -- 4. Mark finished events completed.
  update public.events set status = 'completed'
  where status = 'published' and coalesce(ends_at, starts_at + interval '1 day') <= now();
  get diagnostics v_completed = row_count;

  return jsonb_build_object('reminded', v_reminded, 'withdrawn_members', v_withdrawn,
                            'expired_invites', v_expired, 'completed_events', v_completed);
end;
$$;
