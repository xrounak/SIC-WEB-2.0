-- Team invites work inside the site, like a game party invite: the leader invites
-- people who already have an account (signed in at least once), the invitee gets a
-- notification and an entry in Portal > Invites, and accepts or declines there. No
-- email link is needed (email sending is off); the old link flow keeps working.

-- Every invite now needs an account and a free seat, and tells the invitee in-app.
create or replace function private.create_team_invite(p_team_id uuid, p_email text, p_inviter uuid)
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
  v_invitee uuid;
begin
  select * into v_team from public.event_teams where id = p_team_id;
  select * into v_event from public.events where id = v_team.event_id;
  select full_name into v_leader_name from public.profiles where id = v_team.leader_id;

  select id into v_invitee from public.profiles where email = p_email;
  if v_invitee is null then
    raise exception 'NO_ACCOUNT';
  end if;
  if exists (
    select 1 from public.event_registrations
    where event_id = v_event.id and user_id = v_invitee and status <> 'cancelled'
  ) then
    raise exception 'INVITEE_REGISTERED';
  end if;

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

  perform private.notify(
    v_invitee,
    'team_invite',
    coalesce(nullif(v_leader_name, ''), 'A team leader') || ' invited you to team ' || v_team.name,
    'For ' || v_event.title || '. Accept or decline in your portal.',
    '/portal/invites'
  );
  -- Kept for when email sending is switched on again; harmless while it is off.
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
end;
$$;

-- The invites waiting for the signed-in user, with what they need to decide.
create function public.my_team_invites()
returns table (
  id uuid,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  team_name text,
  team_size bigint,
  leader_name text,
  leader_avatar text,
  event_title text,
  event_slug text,
  event_starts_at timestamptz,
  event_venue text,
  team_min smallint,
  team_max smallint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.id,
    case when i.status = 'pending' and i.expires_at <= now() then 'expired' else i.status end,
    i.expires_at,
    i.created_at,
    t.name,
    (select count(*) from public.event_registrations r where r.event_team_id = t.id and r.status <> 'cancelled'),
    lp.full_name,
    lp.avatar_url,
    e.title,
    e.slug,
    e.starts_at,
    e.venue,
    e.team_min,
    e.team_max
  from public.team_invites i
  join public.event_teams t on t.id = i.event_team_id
  join public.events e on e.id = t.event_id
  join public.profiles lp on lp.id = t.leader_id
  where i.email = (select p.email from public.profiles p where p.id = auth.uid())
    and t.status <> 'withdrawn'
    and (i.status = 'pending' or i.responded_at > now() - interval '14 days')
  order by (i.status = 'pending' and i.expires_at > now()) desc, i.created_at desc
  limit 50;
$$;

-- Accept or decline from the portal (no link token): the invite must be addressed to you.
create function public.respond_team_invite(p_invite_id uuid, p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_profile public.profiles;
  v_invite public.team_invites;
  v_team public.event_teams;
  v_event public.events;
  v_registration_id uuid;
begin
  select * into v_profile from public.profiles where id = v_uid;
  select * into v_invite from public.team_invites where id = p_invite_id for update;
  if v_invite.id is null or v_invite.email <> v_profile.email then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'INVITE_%', upper(v_invite.status);
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'INVITE_EXPIRED';
  end if;
  select * into v_team from public.event_teams where id = v_invite.event_team_id for update;

  if not p_accept then
    update public.team_invites set status = 'declined', responded_at = now() where id = v_invite.id;
    perform private.notify(v_team.leader_id, 'team_invite_declined',
      coalesce(nullif(v_profile.full_name, ''), v_profile.email) || ' declined your invite to ' || v_team.name,
      null, '/portal/registrations');
    return null;
  end if;

  v_profile := private.require_onboarded(v_uid);
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

  -- Joining one team cancels your other open invites for the same event.
  update public.team_invites i
  set status = 'revoked', responded_at = now()
  from public.event_teams t
  where t.id = i.event_team_id and t.event_id = v_event.id
    and i.email = v_profile.email and i.status = 'pending' and i.id <> v_invite.id;

  perform private.refresh_team_status(v_team.id);
  perform private.notify(v_team.leader_id, 'team_invite_accepted',
    v_profile.full_name || ' joined ' || v_team.name, v_event.title, '/portal/registrations');
  return v_registration_id;
end;
$$;

-- For the leader's invite picker: people with an account who can still join this
-- event, matched by name or full email. Emails are shown masked.
create function public.find_invitees(p_team_id uuid, p_query text)
returns table (id uuid, full_name text, avatar_url text, email_hint text, college text)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := private.require_user();
  v_team public.event_teams;
  v_q text := lower(trim(coalesce(p_query, '')));
begin
  select * into v_team from public.event_teams where id = p_team_id;
  if v_team.id is null or v_team.leader_id <> v_uid then
    raise exception 'NOT_ALLOWED';
  end if;
  if char_length(v_q) < 2 then
    return;
  end if;
  v_q := replace(replace(v_q, '%', ''), '_', '');

  return query
    select p.id, p.full_name, p.avatar_url,
      left(p.email, 2) || '***@' || split_part(p.email, '@', 2),
      coalesce(nullif(p.college_name, ''), case when p.branch is not null then 'GEC Palamu · ' || p.branch end)
    from public.profiles p
    where p.id <> v_uid
      and p.onboarded_at is not null
      and (p.full_name ilike '%' || v_q || '%' or p.email = v_q)
      and not exists (
        select 1 from public.event_registrations r
        where r.event_id = v_team.event_id and r.user_id = p.id and r.status <> 'cancelled'
      )
      and not exists (
        select 1 from public.team_invites i
        where i.event_team_id = p_team_id and i.email = p.email and i.status = 'pending'
      )
    order by (p.email = v_q) desc, p.full_name
    limit 8;
end;
$$;

-- Invite picked people by account id (the leader never needs their email).
create function public.invite_to_team(p_team_id uuid, p_user_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_emails text[];
begin
  select coalesce(array_agg(p.email), '{}') into v_emails
  from public.profiles p
  where p.id = any (coalesce(p_user_ids, '{}'));
  if cardinality(v_emails) = 0 then
    raise exception 'NO_ACCOUNT';
  end if;
  perform public.add_team_invites(p_team_id, v_emails);
end;
$$;

revoke all on function public.my_team_invites() from public, anon;
revoke all on function public.respond_team_invite(uuid, boolean) from public, anon;
revoke all on function public.find_invitees(uuid, text) from public, anon;
revoke all on function public.invite_to_team(uuid, uuid[]) from public, anon;
grant execute on function public.my_team_invites() to authenticated;
grant execute on function public.respond_team_invite(uuid, boolean) to authenticated;
grant execute on function public.find_invitees(uuid, text) to authenticated;
grant execute on function public.invite_to_team(uuid, uuid[]) to authenticated;
