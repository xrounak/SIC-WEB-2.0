-- Recruitment cycles, applications, private evaluations; announcements.

create table public.recruitment_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 100),
  description text check (char_length(description) <= 4000),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'archived')),
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at > opens_at)
);

create trigger recruitment_cycles_set_updated_at
  before update on public.recruitment_cycles
  for each row execute function public.set_updated_at();

-- Reviewers assigned to a cycle (besides VP / President, who see everything).
create table public.recruitment_reviewers (
  cycle_id uuid not null references public.recruitment_cycles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (cycle_id, user_id)
);

create table public.recruitment_applications (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.recruitment_cycles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_prefs uuid[] not null default '{}' check (cardinality(domain_prefs) <= 5),
  team_prefs uuid[] not null default '{}' check (cardinality(team_prefs) <= 5),
  motivation text not null check (char_length(motivation) between 20 and 4000),
  experience text check (char_length(experience) <= 4000),
  portfolio_url text check (portfolio_url ~ '^https://' and char_length(portfolio_url) <= 500),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  status public.application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (cycle_id, user_id)
);

create index recruitment_applications_cycle_status_idx on public.recruitment_applications (cycle_id, status);
create index recruitment_applications_user_idx on public.recruitment_applications (user_id);

create trigger recruitment_applications_set_updated_at
  before update on public.recruitment_applications
  for each row execute function public.set_updated_at();

create table public.recruitment_evaluations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.recruitment_applications (id) on delete cascade,
  evaluator_id uuid references public.profiles (id) on delete set null,
  stage text not null check (stage in ('screening', 'interview')),
  score numeric(4, 1) check (score between 0 and 10),
  private_notes text check (char_length(private_notes) <= 4000),
  recommendation text check (recommendation in ('advance', 'hold', 'reject', 'select')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, evaluator_id, stage)
);

create trigger recruitment_evaluations_set_updated_at
  before update on public.recruitment_evaluations
  for each row execute function public.set_updated_at();

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) <= 20000),
  audience text not null check (audience in ('public', 'members', 'team')),
  team_id uuid references public.teams (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((audience = 'team') = (team_id is not null))
);

create index announcements_status_published_at_idx on public.announcements (status, published_at desc);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.reviews_cycle(check_cycle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_exec() or exists (
    select 1 from public.recruitment_reviewers
    where cycle_id = check_cycle_id and user_id = (select auth.uid())
  );
$$;

-- May this user write announcements for that audience?
create function public.can_announce(p_audience text, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_exec() or (p_audience = 'team' and public.leads_team(p_team_id));
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.recruitment_cycles enable row level security;
alter table public.recruitment_reviewers enable row level security;
alter table public.recruitment_applications enable row level security;
alter table public.recruitment_evaluations enable row level security;
alter table public.announcements enable row level security;

create policy "Anyone reads announced cycles"
  on public.recruitment_cycles for select to anon, authenticated
  using (status in ('open', 'closed') or public.is_staff() or public.reviews_cycle(id));
create policy "Execs manage cycles"
  on public.recruitment_cycles for all to authenticated
  using (public.is_exec())
  with check (public.is_exec());

create policy "Reviewers see assignments"
  on public.recruitment_reviewers for select to authenticated
  using (user_id = (select auth.uid()) or public.is_exec());
create policy "Execs assign reviewers"
  on public.recruitment_reviewers for all to authenticated
  using (public.is_exec())
  with check (public.is_exec());

-- Applicants read their own application. Writes go through RPCs.
create policy "Applicants and reviewers read applications"
  on public.recruitment_applications for select to authenticated
  using (user_id = (select auth.uid()) or public.reviews_cycle(cycle_id));
revoke insert, update, delete on public.recruitment_applications from anon, authenticated;

-- Never visible to applicants.
create policy "Reviewers read evaluations"
  on public.recruitment_evaluations for select to authenticated
  using (exists (
    select 1 from public.recruitment_applications a
    where a.id = application_id
      and public.reviews_cycle(a.cycle_id)
      and a.user_id <> (select auth.uid())
  ));
revoke insert, update, delete on public.recruitment_evaluations from anon, authenticated;

create policy "Read announcements for my audience"
  on public.announcements for select to anon, authenticated
  using (
    (status = 'published' and (
      audience = 'public'
      or (audience = 'members' and public.is_member())
      or (audience = 'team' and public.in_team(team_id))
    ))
    or created_by = (select auth.uid())
    or public.is_staff()
  );
create policy "Authorised authors write drafts"
  on public.announcements for insert to authenticated
  with check (created_by = (select auth.uid()) and status = 'draft' and public.can_announce(audience, team_id));
create policy "Authors edit drafts"
  on public.announcements for update to authenticated
  using (created_by = (select auth.uid()) and status = 'draft')
  with check (created_by = (select auth.uid()) and status = 'draft' and public.can_announce(audience, team_id));
create policy "Authors delete drafts"
  on public.announcements for delete to authenticated
  using (created_by = (select auth.uid()) and status = 'draft');
revoke insert, update on public.announcements from anon, authenticated;
revoke delete on public.announcements from anon;
grant insert (title, body, audience, team_id, created_by) on public.announcements to authenticated;
grant update (title, body, audience, team_id) on public.announcements to authenticated;
