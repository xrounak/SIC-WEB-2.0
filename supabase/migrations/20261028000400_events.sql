-- Events, review log, registrations, event teams and invites.
-- "teams" are the club's standing units; "event_teams" are groups registering for one event.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 140),
  summary text check (char_length(summary) <= 300),
  description text check (char_length(description) <= 20000),
  event_type text not null check (event_type in ('workshop', 'hackathon', 'competition', 'seminar', 'external', 'meeting')),
  is_major boolean not null default false,
  status public.event_status not null default 'draft',
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  venue text check (char_length(venue) <= 200),
  starts_at timestamptz,
  ends_at timestamptz,
  reg_opens_at timestamptz,
  reg_closes_at timestamptz,
  capacity int check (capacity > 0),
  participation text not null default 'individual' check (participation in ('individual', 'team')),
  team_min smallint,
  team_max smallint,
  owner_team_id uuid not null references public.teams (id),
  domain_id uuid references public.domains (id) on delete set null,
  cover_path text check (char_length(cover_path) <= 500),
  created_by uuid not null references public.profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_window check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint events_reg_window check (reg_closes_at is null or reg_opens_at is null or reg_closes_at > reg_opens_at),
  constraint events_team_size check (
    (participation = 'individual' and team_min is null and team_max is null)
    or (participation = 'team' and team_min between 1 and team_max and team_max between 2 and 10)
  ),
  constraint events_published_has_slug check (status not in ('published', 'completed') or slug is not null)
);

create index events_status_starts_at_idx on public.events (status, starts_at);
create index events_owner_team_id_idx on public.events (owner_team_id);
create index events_created_by_idx on public.events (created_by);
create index events_domain_id_idx on public.events (domain_id);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create table public.event_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  stage text not null check (stage in ('lead', 'final')),
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision text not null check (decision in ('approved', 'changes_requested', 'rejected')),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now()
);

create index event_reviews_event_id_idx on public.event_reviews (event_id, created_at);

create table public.event_teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  leader_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'forming' check (status in ('forming', 'complete', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index event_teams_event_name_key on public.event_teams (event_id, lower(name)) where status <> 'withdrawn';
create index event_teams_leader_id_idx on public.event_teams (leader_id);

create trigger event_teams_set_updated_at
  before update on public.event_teams
  for each row execute function public.set_updated_at();

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_team_id uuid references public.event_teams (id) on delete cascade,
  team_role text check (team_role in ('leader', 'member')),
  status public.registration_status not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_team_role check ((event_team_id is null) = (team_role is null))
);

-- One active seat per person per event, alone or in a team.
create unique index event_registrations_one_seat_key
  on public.event_registrations (event_id, user_id)
  where status <> 'cancelled';
create index event_registrations_event_idx on public.event_registrations (event_id, created_at);
create index event_registrations_user_idx on public.event_registrations (user_id);
create index event_registrations_team_idx on public.event_registrations (event_team_id);

create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute function public.set_updated_at();

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  event_team_id uuid not null references public.event_teams (id) on delete cascade,
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  invited_by uuid references public.profiles (id) on delete set null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index team_invites_pending_email_key on public.team_invites (event_team_id, email) where status = 'pending';
create index team_invites_email_idx on public.team_invites (email) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Lead of the owning team, or exec/admin.
create function public.can_manage_event(check_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_exec() or public.is_admin() or exists (
    select 1 from public.events e
    where e.id = check_event_id and public.leads_team(e.owner_team_id)
  );
$$;

create function public.is_on_event_team(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_registrations
    where event_team_id = check_team_id
      and user_id = (select auth.uid())
      and status <> 'cancelled'
  ) or exists (
    select 1 from public.event_teams where id = check_team_id and leader_id = (select auth.uid())
  );
$$;

-- Who may read a full (private) profile row.
create function public.can_view_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target = (select auth.uid())
    or public.is_staff()
    -- leads: members of teams they lead
    or exists (
      select 1 from public.team_members tm
      join public.team_members me on me.team_id = tm.team_id
      where tm.member_id = target
        and me.member_id = (select auth.uid()) and me.team_role = 'lead' and me.status = 'active'
    )
    -- leads: registrants of events their teams own
    or exists (
      select 1 from public.event_registrations r
      join public.events e on e.id = r.event_id
      where r.user_id = target and public.leads_team(e.owner_team_id)
    )
    -- leads: students waiting for verification
    or (public.is_any_lead() and exists (
      select 1 from public.profiles p where p.id = target and p.student_status = 'pending'
    ))
    -- teammates in the same event team
    or exists (
      select 1 from public.event_registrations theirs
      where theirs.user_id = target
        and theirs.event_team_id is not null
        and theirs.status <> 'cancelled'
        and public.is_on_event_team(theirs.event_team_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

create policy "Read profiles within scope"
  on public.profiles for select to authenticated
  using (public.can_view_profile(id));

alter table public.events enable row level security;
alter table public.event_reviews enable row level security;
alter table public.event_teams enable row level security;
alter table public.event_registrations enable row level security;
alter table public.team_invites enable row level security;

create policy "Read published events or own scope"
  on public.events for select to anon, authenticated
  using (
    (status in ('published', 'completed') or (status = 'cancelled' and published_at is not null))
      and (visibility = 'public' or public.is_member())
    or created_by = (select auth.uid())
    or public.leads_team(owner_team_id)
    or public.is_staff()
  );

-- Members create drafts; status and review fields are not insertable.
create policy "Members create draft events"
  on public.events for insert to authenticated
  with check (created_by = (select auth.uid()) and public.is_member() and status = 'draft');

create policy "Edit events within scope"
  on public.events for update to authenticated
  using (
    (created_by = (select auth.uid()) and status in ('draft', 'changes_requested'))
    or (public.can_manage_event(id) and status not in ('archived', 'rejected'))
  )
  with check (
    (created_by = (select auth.uid()) and status in ('draft', 'changes_requested'))
    or (public.can_manage_event(id) and status not in ('archived', 'rejected'))
  );

create policy "Authors delete own drafts"
  on public.events for delete to authenticated
  using (created_by = (select auth.uid()) and status = 'draft');

revoke insert, update on public.events from anon, authenticated;
grant insert (
  title, summary, description, event_type, visibility, venue, starts_at, ends_at,
  reg_opens_at, reg_closes_at, capacity, participation, team_min, team_max,
  owner_team_id, domain_id, cover_path, created_by
) on public.events to authenticated;
grant update (
  title, summary, description, event_type, visibility, venue, starts_at, ends_at,
  reg_opens_at, reg_closes_at, capacity, participation, team_min, team_max,
  owner_team_id, domain_id, cover_path
) on public.events to authenticated;
revoke delete on public.events from anon;

create policy "Read reviews of visible proposals"
  on public.event_reviews for select to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id
      and (e.created_by = (select auth.uid()) or public.can_manage_event(e.id) or public.is_staff())
  ));
revoke insert, update, delete on public.event_reviews from anon, authenticated;

create policy "Read own, team, or managed registrations"
  on public.event_registrations for select to authenticated
  using (
    user_id = (select auth.uid())
    or (event_team_id is not null and public.is_on_event_team(event_team_id))
    or public.can_manage_event(event_id)
    or public.is_staff()
  );
revoke insert, update, delete on public.event_registrations from anon, authenticated;

create policy "Read own or managed event teams"
  on public.event_teams for select to authenticated
  using (public.is_on_event_team(id) or public.can_manage_event(event_id) or public.is_staff());
revoke insert, update, delete on public.event_teams from anon, authenticated;

create policy "Leaders and invitees read invites"
  on public.team_invites for select to authenticated
  using (
    public.is_on_event_team(event_team_id)
    or email = (select p.email from public.profiles p where p.id = (select auth.uid()))
    or exists (
      select 1 from public.event_teams t
      where t.id = event_team_id and public.can_manage_event(t.event_id)
    )
  );
revoke insert, update, delete on public.team_invites from anon, authenticated;
-- token_hash is never readable by clients.
revoke select on public.team_invites from anon, authenticated;
grant select (id, event_team_id, email, invited_by, status, expires_at, accepted_by, responded_at, created_at)
  on public.team_invites to authenticated;

-- Seat counts for public pages without exposing who registered.
create view public.event_seat_counts
with (security_barrier = true)
as
  select e.id as event_id,
         e.capacity,
         count(r.id) filter (where r.status in ('registered', 'attended')) as seats_taken
  from public.events e
  left join public.event_registrations r on r.event_id = e.id
  where e.status in ('published', 'completed', 'cancelled')
  group by e.id;

revoke all on public.event_seat_counts from anon, authenticated;
grant select on public.event_seat_counts to anon, authenticated;
