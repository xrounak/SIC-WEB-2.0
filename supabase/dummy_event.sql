-- A dummy event for testing registration: "Don't Register", 1 Dec 2026.
-- Run in the Supabase SQL editor. Safe to run twice (it replaces itself).
-- Remove it with the DELETE at the bottom when you're done.

delete from public.events where slug = 'dont-register';

insert into public.events (
  slug, title, summary, description, event_type, is_major, status, visibility, venue,
  starts_at, ends_at, reg_opens_at, reg_closes_at, capacity, participation,
  owner_team_id, created_by, published_at
)
values (
  'dont-register',
  'Don''t Register',
  'A dummy event for testing sign-ups. Not a real event.',
  $md$
> **This is a dummy event** for testing the website. Please don't register unless you're testing.
$md$,
  'workshop',
  false,
  'published',
  'public',
  'GEC Palamu',
  timestamptz '2026-12-01 10:00:00+05:30',
  timestamptz '2026-12-01 12:00:00+05:30',
  now(),
  timestamptz '2026-11-30 23:59:00+05:30',
  50,
  'individual',
  coalesce(
    (select id from public.teams where slug = 'software'),
    (select id from public.teams order by created_at limit 1)
  ),
  coalesce(
    (select id from public.profiles where email = 'rounakkumar13005@gmail.com'),
    (select user_id from public.user_roles where role in ('admin', 'president') order by role limit 1),
    (select id from public.profiles order by created_at limit 1)
  ),
  now()
);

select id, slug, title, status, starts_at from public.events where slug = 'dont-register';

-- When you're done testing (its registrations go with it):
-- delete from public.events where slug = 'dont-register';
