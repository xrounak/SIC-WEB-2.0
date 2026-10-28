-- Removes everything demo_seed.sql created. Real users and their data are untouched.
-- Paste into Supabase → SQL Editor → Run.

begin;

-- Rows owned by demo people that don't cascade from their profile.
delete from public.events where id::text like 'e0000000-%' or created_by::text like 'd0000000-%';
delete from public.projects where id::text like 'a0000000-%' or created_by::text like 'd0000000-%';
delete from public.announcements where created_by::text like 'd0000000-%';
delete from public.recruitment_cycles where id::text like 'c0000000-%';
delete from public.audit_logs where actor_id::text like 'd0000000-%' or entity_id::text like 'd0000000-%' or entity_id::text like 'e0000000-%';

-- Deleting the auth users cascades to profiles, roles, team seats, domains,
-- registrations, teams, invites, notifications and applications.
delete from auth.users where id::text like 'd0000000-%';

commit;
