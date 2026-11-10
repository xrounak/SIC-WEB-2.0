-- Team names and join links.
-- 1. The site shows a team as "Team <name>", so a leading "Team" typed by the leader is
--    dropped when saved ("Team Phoenix" is stored as "Phoenix", shown as "Team Phoenix").
-- 2. A leader can share one link (WhatsApp, anywhere). Anyone signed in who opens it can
--    join the team while it has room; the leader can switch the link off or make a new one.

-- ---------------------------------------------------------------------------
-- 1. Team names
-- ---------------------------------------------------------------------------

create function private.strip_team_word()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_short text := regexp_replace(trim(new.name), '^team[\s:\-_]+', '', 'i');
begin
  -- keep it when nothing sensible would be left ("Team", "Team X")
  if char_length(v_short) >= 2 then
    new.name := v_short;
  end if;
  return new;
end;
$$;

create trigger event_teams_strip_team_word
  before insert or update of name on public.event_teams
  for each row execute function private.strip_team_word();

-- Existing teams: only where the shorter name isn't already taken in that event
update public.event_teams t
set name = regexp_replace(trim(t.name), '^team[\s:\-_]+', '', 'i')
where t.name ~* '^team[\s:\-_]+'
  and char_length(regexp_replace(trim(t.name), '^team[\s:\-_]+', '', 'i')) >= 2
  and not exists (
    select 1 from public.event_teams o
    where o.event_id = t.event_id and o.id <> t.id and o.status <> 'withdrawn'
      and lower(o.name) = lower(regexp_replace(trim(t.name), '^team[\s:\-_]+', '', 'i'))
  );

-- ---------------------------------------------------------------------------
-- 2. Join links
-- ---------------------------------------------------------------------------

alter table public.event_teams add column join_code text unique
  check (join_code ~ '^[A-Za-z0-9_-]{10,40}$');

-- Clients never read the code from the table; the leader gets it through team_join_link().
revoke select on public.event_teams from anon, authenticated;
grant select (id, event_id, name, leader_id, status, created_at, updated_at) on public.event_teams to authenticated;

/** The leader's link code for their team, made on first use. p_new swaps in a fresh code
    (old links stop working); p_off switches the link off. */
create function public.team_join_link(p_team_id uuid, p_new boolean default false, p_off boolean default false)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_team public.event_teams;
  v_code text;
begin
  select * into v_team from public.event_teams where id = p_team_id for update;
  if v_team.id is null or (v_team.leader_id <> v_uid and not public.can_manage_event(v_team.event_id)) then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_off then
    update public.event_teams set join_code = null where id = v_team.id;
    return null;
  end if;
  if v_team.join_code is not null and not p_new then
    return v_team.join_code;
  end if;
  v_code := translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/', '-_');
  update public.event_teams set join_code = v_code where id = v_team.id;
  return v_code;
end;
$$;

/** What the join page shows before anyone joins. Works signed out, so the link preview
    makes sense; it reveals only the team and event names and how full the team is. */
create function public.team_join_preview(p_code text)
returns table (
  team_name text, team_status text, event_title text, event_slug text, starts_at timestamptz,
  reg_closes_at timestamptz, leader_name text, members int, team_max int, already_in boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.name, t.status, e.title, e.slug, e.starts_at, e.reg_closes_at,
         p.full_name,
         (select count(*)::int from public.event_registrations r where r.event_team_id = t.id and r.status <> 'cancelled'),
         e.team_max::int,
         exists (
           select 1 from public.event_registrations r
           where r.event_id = e.id and r.user_id = (select auth.uid()) and r.status <> 'cancelled'
         )
  from public.event_teams t
  join public.events e on e.id = t.event_id
  left join public.profiles p on p.id = t.leader_id
  where t.join_code = p_code and e.status = 'published';
$$;

/** Join a team from its link. The same checks as accepting an invite. */
create function public.join_team_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_profile public.profiles;
  v_team public.event_teams;
  v_event public.events;
  v_registration_id uuid;
begin
  select * into v_team from public.event_teams where join_code = p_code for update;
  if v_team.id is null then
    raise exception 'JOIN_LINK_INVALID';
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

  -- Any invite to this team counts as accepted; other open invites for the event go.
  update public.team_invites
  set status = 'accepted', accepted_by = v_uid, responded_at = now()
  where event_team_id = v_team.id and email = v_profile.email and status = 'pending';
  update public.team_invites i
  set status = 'revoked', responded_at = now()
  from public.event_teams t
  where t.id = i.event_team_id and t.event_id = v_event.id and t.id <> v_team.id
    and i.email = v_profile.email and i.status = 'pending';

  perform private.refresh_team_status(v_team.id);
  perform private.notify(v_team.leader_id, 'team_invite_accepted',
    v_profile.full_name || ' joined Team ' || v_team.name || ' with your link', v_event.title, '/portal/registrations');
  return v_registration_id;
end;
$$;

revoke all on function public.team_join_link(uuid, boolean, boolean) from public, anon;
revoke all on function public.team_join_preview(text) from public;
revoke all on function public.join_team_by_code(text) from public, anon;
grant execute on function public.team_join_link(uuid, boolean, boolean) to authenticated;
grant execute on function public.team_join_preview(text) to anon, authenticated;
grant execute on function public.join_team_by_code(text) to authenticated;
