-- Identity and organisation: profiles, global roles, domains, club teams.
-- Every auth user gets a profile. Club membership is profiles.member_status, not "has an account".

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text not null,
  phone text check (char_length(phone) <= 20),
  avatar_url text check (char_length(avatar_url) <= 500),
  bio text check (char_length(bio) <= 1000),
  college_name text check (char_length(college_name) <= 200),
  branch text check (char_length(branch) <= 100),
  academic_year smallint check (academic_year between 1 and 6),
  roll_number text check (char_length(roll_number) <= 40),
  student_status public.student_status not null default 'unverified',
  member_status public.member_status not null default 'none',
  public_profile boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Two accounts can claim a roll number while pending; only one can be verified.
create unique index profiles_verified_roll_number_key
  on public.profiles (lower(roll_number))
  where student_status = 'verified';
create index profiles_student_status_idx on public.profiles (student_status) where student_status = 'pending';
create index profiles_member_status_idx on public.profiles (member_status);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 2000),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger domains_set_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 2000),
  team_type text not null default 'technical' check (team_type in ('technical', 'operations', 'media')),
  domain_id uuid references public.domains (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teams_domain_id_idx on public.teams (domain_id);

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

create table public.member_domains (
  member_id uuid not null references public.profiles (id) on delete cascade,
  domain_id uuid not null references public.domains (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (member_id, domain_id)
);

create index member_domains_domain_id_idx on public.member_domains (domain_id);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  team_role text not null default 'member' check (team_role in ('member', 'deputy', 'lead')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  joined_at timestamptz not null default now(),
  primary key (team_id, member_id)
);

create index team_members_member_id_idx on public.team_members (member_id);
create index team_members_leads_idx on public.team_members (team_id) where team_role = 'lead' and status = 'active';

-- ---------------------------------------------------------------------------
-- Authorization helpers. SECURITY DEFINER so policies can call them without
-- recursing through RLS on the tables they read.
-- ---------------------------------------------------------------------------

create function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = check_role
  );
$$;

-- Vice President or President: club decision makers.
create function public.is_exec()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role in ('vice_president', 'president')
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin');
$$;

-- Read access to operational data: execs, faculty coordinator, admin.
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()));
$$;

create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and member_status = 'member'
  );
$$;

create function public.leads_team(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id
      and member_id = (select auth.uid())
      and team_role = 'lead'
      and status = 'active'
  );
$$;

create function public.is_any_lead()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where member_id = (select auth.uid()) and team_role = 'lead' and status = 'active'
  );
$$;

create function public.in_team(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and member_id = (select auth.uid()) and status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- Profile lifecycle tied to auth.users
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    lower(new.email),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 120),
    left(new.raw_user_meta_data ->> 'avatar_url', 500)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.domains enable row level security;
alter table public.teams enable row level security;
alter table public.member_domains enable row level security;
alter table public.team_members enable row level security;

-- profiles: select policy is added in the events migration (needs can_view_profile).
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Only these columns are self-editable. Roll number, college and statuses go through RPCs.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url, bio, branch, academic_year, public_profile)
  on public.profiles to authenticated;

create policy "Users read own roles; staff read all"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
revoke insert, update, delete on public.user_roles from anon, authenticated;

create policy "Anyone reads active domains"
  on public.domains for select to anon, authenticated
  using (is_active or public.is_staff());
create policy "Execs manage domains"
  on public.domains for all to authenticated
  using (public.is_exec() or public.is_admin())
  with check (public.is_exec() or public.is_admin());

create policy "Anyone reads active teams"
  on public.teams for select to anon, authenticated
  using (is_active or public.is_staff());
create policy "Execs manage teams"
  on public.teams for all to authenticated
  using (public.is_exec() or public.is_admin())
  with check (public.is_exec() or public.is_admin());

create policy "Members read domain memberships"
  on public.member_domains for select to authenticated
  using (member_id = (select auth.uid()) or public.is_member() or public.is_staff());
create policy "Members add own domains"
  on public.member_domains for insert to authenticated
  with check (member_id = (select auth.uid()) and public.is_member());
create policy "Members remove own domains"
  on public.member_domains for delete to authenticated
  using (member_id = (select auth.uid()));
revoke update on public.member_domains from anon, authenticated;

create policy "Members read team rosters"
  on public.team_members for select to authenticated
  using (member_id = (select auth.uid()) or public.is_member() or public.is_staff());
revoke insert, update, delete on public.team_members from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public views: only opted-in members, only safe columns. Owned by postgres,
-- so they read through RLS deliberately.
-- ---------------------------------------------------------------------------

create view public.public_profiles
with (security_barrier = true)
as
  select id, full_name, avatar_url, bio, branch, academic_year
  from public.profiles
  where public_profile and member_status in ('member', 'alumni');

create view public.public_team_members
with (security_barrier = true)
as
  select tm.team_id, tm.team_role, p.id as member_id, p.full_name, p.avatar_url
  from public.team_members tm
  join public.profiles p on p.id = tm.member_id
  where tm.status = 'active' and p.public_profile and p.member_status = 'member';

revoke all on public.public_profiles, public.public_team_members from anon, authenticated;
grant select on public.public_profiles, public.public_team_members to anon, authenticated;
