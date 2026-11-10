-- Admin can do everything: an admin counts as President, Vice President and Faculty
-- Coordinator, as a club member, and as the lead (and a member) of every team.
-- Every policy and function checks permissions through these helpers, so changing them
-- here gives admins every power without touching each rule.

-- Any role check passes for an admin
create or replace function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and (role = check_role or role = 'admin')
  );
$$;

-- Vice President, President, or admin
create or replace function public.is_exec()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role in ('vice_president', 'president', 'admin')
  );
$$;

-- Club members, and admins
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and member_status = 'member'
  ) or public.is_admin();
$$;

-- Lead of this team, or an admin (leads every team)
create or replace function public.leads_team(check_team_id uuid)
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
  ) or public.is_admin();
$$;

create or replace function public.is_any_lead()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where member_id = (select auth.uid()) and team_role = 'lead' and status = 'active'
  ) or public.is_admin();
$$;

-- In this team, or an admin
create or replace function public.in_team(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and member_id = (select auth.uid()) and status = 'active'
  ) or public.is_admin();
$$;
