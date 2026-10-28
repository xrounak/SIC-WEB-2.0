-- Read-only views for public pages that need names without exposing profiles.
-- Each view filters to rows the person agreed to show.

-- Credited contributors on published projects (contributor confirmed and chose public credit).
create view public.public_project_contributors
with (security_barrier = true)
as
  select c.project_id, c.member_id, c.contribution, p.full_name, p.avatar_url
  from public.project_contributors c
  join public.profiles p on p.id = c.member_id
  join public.projects pr on pr.id = c.project_id
  where c.confirmed_at is not null
    and c.is_public
    and pr.status = 'published'
    and pr.visibility = 'public';

-- Office bearers who opted into a public profile.
create view public.public_leadership
with (security_barrier = true)
as
  select ur.role, p.id as member_id, p.full_name, p.avatar_url, p.bio, p.branch
  from public.user_roles ur
  join public.profiles p on p.id = ur.user_id
  where ur.role in ('president', 'vice_president', 'faculty_coordinator')
    and p.public_profile;

-- Names of fellow members, for members and staff only. No contact details.
create view public.member_directory
with (security_barrier = true)
as
  select id, full_name, avatar_url, branch, academic_year
  from public.profiles
  where member_status = 'member'
    and (public.is_member() or public.is_staff());

revoke all on public.public_project_contributors, public.public_leadership, public.member_directory from anon, authenticated;
grant select on public.public_project_contributors, public.public_leadership to anon, authenticated;
grant select on public.member_directory to authenticated;
