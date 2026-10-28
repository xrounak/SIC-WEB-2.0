-- Projects: showcase entries with contributors, domains, media and a review log.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 140),
  summary text check (char_length(summary) <= 300),
  problem text check (char_length(problem) <= 8000),
  solution text check (char_length(solution) <= 8000),
  outcomes text check (char_length(outcomes) <= 8000),
  hardware_details text check (char_length(hardware_details) <= 8000),
  software_details text check (char_length(software_details) <= 8000),
  repo_url text check (repo_url ~ '^https://' and char_length(repo_url) <= 500),
  demo_url text check (demo_url ~ '^https://' and char_length(demo_url) <= 500),
  status public.project_status not null default 'draft',
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  owner_team_id uuid not null references public.teams (id),
  cover_path text check (char_length(cover_path) <= 500),
  created_by uuid not null references public.profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_published_has_slug check (status <> 'published' or slug is not null)
);

create index projects_status_published_at_idx on public.projects (status, published_at desc);
create index projects_owner_team_id_idx on public.projects (owner_team_id);
create index projects_created_by_idx on public.projects (created_by);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_contributors (
  project_id uuid not null references public.projects (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  contribution text check (char_length(contribution) <= 200),
  confirmed_at timestamptz,
  is_public boolean not null default true,
  primary key (project_id, member_id)
);

create index project_contributors_member_id_idx on public.project_contributors (member_id);

create table public.project_domains (
  project_id uuid not null references public.projects (id) on delete cascade,
  domain_id uuid not null references public.domains (id) on delete cascade,
  primary key (project_id, domain_id)
);

create index project_domains_domain_id_idx on public.project_domains (domain_id);

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) <= 500),
  media_type text not null check (media_type in ('image', 'video', 'document')),
  caption text check (char_length(caption) <= 300),
  sort_order int not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_media_project_idx on public.project_media (project_id, sort_order);

create table public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision text not null check (decision in ('approved', 'changes_requested', 'rejected')),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now()
);

create index project_reviews_project_idx on public.project_reviews (project_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.can_review_project(check_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_exec() or public.is_admin() or exists (
    select 1 from public.projects p
    where p.id = check_project_id and public.leads_team(p.owner_team_id)
  );
$$;

create function public.can_edit_project(check_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = check_project_id
      and p.created_by = (select auth.uid())
      and p.status in ('draft', 'changes_requested')
  );
$$;

create function public.can_view_project(check_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = check_project_id
      and (
        (p.status = 'published' and (p.visibility = 'public' or public.is_member()))
        or p.created_by = (select auth.uid())
        or exists (
          select 1 from public.project_contributors c
          where c.project_id = p.id and c.member_id = (select auth.uid())
        )
        or public.can_review_project(p.id)
        or public.is_staff()
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_contributors enable row level security;
alter table public.project_domains enable row level security;
alter table public.project_media enable row level security;
alter table public.project_reviews enable row level security;

-- Author check is inline: a helper querying projects cannot see a row being inserted,
-- which would break INSERT ... RETURNING.
create policy "Read visible projects"
  on public.projects for select to anon, authenticated
  using (created_by = (select auth.uid()) or public.can_view_project(id));

create policy "Members create draft projects"
  on public.projects for insert to authenticated
  with check (created_by = (select auth.uid()) and public.is_member() and status = 'draft');

create policy "Edit projects within scope"
  on public.projects for update to authenticated
  using (public.can_edit_project(id) or (public.can_review_project(id) and status <> 'archived'))
  with check (
    (created_by = (select auth.uid()) and status in ('draft', 'changes_requested'))
    or public.can_review_project(id)
  );

create policy "Authors delete own drafts"
  on public.projects for delete to authenticated
  using (created_by = (select auth.uid()) and status = 'draft');

revoke insert, update on public.projects from anon, authenticated;
revoke delete on public.projects from anon;
grant insert (
  title, summary, problem, solution, outcomes, hardware_details, software_details,
  repo_url, demo_url, visibility, owner_team_id, cover_path, created_by
) on public.projects to authenticated;
grant update (
  title, summary, problem, solution, outcomes, hardware_details, software_details,
  repo_url, demo_url, visibility, owner_team_id, cover_path
) on public.projects to authenticated;

-- Public pages see only confirmed, public credits; collaborators see everything.
create policy "Read contributors"
  on public.project_contributors for select to anon, authenticated
  using (
    (confirmed_at is not null and is_public and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'published' and (p.visibility = 'public' or public.is_member())
    ))
    or member_id = (select auth.uid())
    or public.can_edit_project(project_id)
    or public.can_review_project(project_id)
    or public.is_staff()
  );
create policy "Authors add contributors to editable projects"
  on public.project_contributors for insert to authenticated
  with check (public.can_edit_project(project_id) and confirmed_at is null);
create policy "Authors remove contributors from editable projects"
  on public.project_contributors for delete to authenticated
  using (public.can_edit_project(project_id));
revoke update on public.project_contributors from anon, authenticated;
revoke insert on public.project_contributors from anon, authenticated;
grant insert (project_id, member_id, contribution) on public.project_contributors to authenticated;

create policy "Read project domains"
  on public.project_domains for select to anon, authenticated
  using (public.can_view_project(project_id));
create policy "Authors tag editable projects"
  on public.project_domains for insert to authenticated
  with check (public.can_edit_project(project_id));
create policy "Authors untag editable projects"
  on public.project_domains for delete to authenticated
  using (public.can_edit_project(project_id));
revoke update on public.project_domains from anon, authenticated;

create policy "Read project media"
  on public.project_media for select to anon, authenticated
  using (public.can_view_project(project_id));
create policy "Authors add media to editable projects"
  on public.project_media for insert to authenticated
  with check (public.can_edit_project(project_id) and uploaded_by = (select auth.uid()));
create policy "Authors edit media on editable projects"
  on public.project_media for update to authenticated
  using (public.can_edit_project(project_id))
  with check (public.can_edit_project(project_id));
create policy "Authors remove media from editable projects"
  on public.project_media for delete to authenticated
  using (public.can_edit_project(project_id));

create policy "Read reviews of visible projects"
  on public.project_reviews for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id
      and (p.created_by = (select auth.uid()) or public.can_review_project(p.id) or public.is_staff())
  ));
revoke insert, update, delete on public.project_reviews from anon, authenticated;
