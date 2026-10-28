-- Recruitment reviewers need to read the profile (name, branch, roll number) of
-- applicants in cycles they are assigned to. Same rules as before, plus that clause.

create or replace function public.can_view_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target = (select auth.uid())
    or public.is_staff()
    or exists (
      select 1 from public.team_members tm
      join public.team_members me on me.team_id = tm.team_id
      where tm.member_id = target
        and me.member_id = (select auth.uid()) and me.team_role = 'lead' and me.status = 'active'
    )
    or exists (
      select 1 from public.event_registrations r
      join public.events e on e.id = r.event_id
      where r.user_id = target and public.leads_team(e.owner_team_id)
    )
    or (public.is_any_lead() and exists (
      select 1 from public.profiles p where p.id = target and p.student_status = 'pending'
    ))
    or exists (
      select 1 from public.event_registrations theirs
      where theirs.user_id = target
        and theirs.event_team_id is not null
        and theirs.status <> 'cancelled'
        and public.is_on_event_team(theirs.event_team_id)
    )
    or exists (
      select 1 from public.recruitment_applications a
      where a.user_id = target and public.reviews_cycle(a.cycle_id)
    );
$$;

revoke execute on function public.can_view_profile(uuid) from public;
grant execute on function public.can_view_profile(uuid) to anon, authenticated;
