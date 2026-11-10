-- Chronos 2026: remove the demo event and add the eight festival events (11 to 13 Dec 2026).
-- Run once in the Supabase SQL editor. Safe to run again: events that already exist (same slug)
-- are left as they are, so nobody's registrations are touched.
--
-- Times are placeholders (IST); change them, the team sizes and the rule books in the portal.
-- The events show from now; registration opens 15 Nov 2026, 12:00 am and closes 10 Dec, 11:59 pm.
-- (Before 15 Nov the event page says registration isn't open yet, and the database refuses sign-ups.)

begin;

-- The demo event goes, with its teams, invites and registrations
delete from public.events where slug = 'demo-event';

with
  owner as (
    select coalesce(
      (select id from public.teams where slug = 'software'),
      (select id from public.teams order by created_at limit 1)
    ) as team_id
  ),
  author as (
    select coalesce(
      (select id from public.profiles where email = 'rounakkumar13005@gmail.com'),
      (select user_id from public.user_roles where role in ('admin', 'president') order by role limit 1),
      (select id from public.profiles order by created_at limit 1)
    ) as profile_id
  ),
  e (slug, title, summary, event_type, venue, starts_at, ends_at, participation, team_min, team_max) as (
    values
      -- Day 1 · Friday 11 Dec
      ('expert-talks-inauguration', 'Expert Talks + Inauguration',
       'The opening of Chronos 2026, with talks from invited experts.',
       'seminar', 'Auditorium, GEC Palamu',
       timestamptz '2026-12-11 10:00+05:30', timestamptz '2026-12-11 12:30+05:30', 'individual', null::smallint, null::smallint),
      ('working-model-exhibition', 'Working Model Exhibition',
       'Working prototypes, project demos and research applications on show.',
       'competition', 'Parking Lot, GEC Palamu',
       timestamptz '2026-12-11 13:00+05:30', timestamptz '2026-12-11 17:00+05:30', 'team', 1, 4),
      ('robo-soccer', 'Elytra Kick',
       'Radio-controlled bots play soccer: agility, speed and control.',
       'competition', 'Ground, GEC Palamu',
       timestamptz '2026-12-11 14:00+05:30', timestamptz '2026-12-11 17:30+05:30', 'team', 2, 5),
      -- Day 2 · Saturday 12 Dec
      ('12-hour-hackathon', 'Trial Chambers',
       'Build overnight-style for 12 hours on real hardware and software problems.',
       'hackathon', 'Seminar Hall 1, GEC Palamu',
       timestamptz '2026-12-12 09:00+05:30', timestamptz '2026-12-12 21:00+05:30', 'team', 2, 4),
      ('rc-car-hurdle-race', 'Pillager''s Parkour',
       'Custom RC cars race off-road through obstacles and elevation hurdles.',
       'competition', 'Ground, GEC Palamu',
       timestamptz '2026-12-12 10:00+05:30', timestamptz '2026-12-12 14:00+05:30', 'team', 2, 4),
      -- Day 3 · Sunday 13 Dec
      ('build-beyond-limits', 'Creative Mode',
       'Design and build a structure within plot limits, with a fixed set of materials.',
       'competition', '1st Floor Open Area, GEC Palamu',
       timestamptz '2026-12-13 10:00+05:30', timestamptz '2026-12-13 14:00+05:30', 'team', 2, 4),
      ('boat-race', 'Marine Rush',
       'Radio-controlled boats race in a water tank: hull design, propulsion and stability.',
       'competition', 'Ground, GEC Palamu',
       timestamptz '2026-12-13 10:00+05:30', timestamptz '2026-12-13 13:00+05:30', 'team', 2, 4),
      ('robo-war', 'Nether Clash',
       'Armoured combat robots fight in the arena: build strength, drive power, weapons and control.',
       'competition', 'Ground, GEC Palamu',
       timestamptz '2026-12-13 14:00+05:30', timestamptz '2026-12-13 18:00+05:30', 'team', 2, 5)
  )
insert into public.events (
  slug, title, summary, description, event_type, is_major, status, visibility, venue,
  starts_at, ends_at, reg_opens_at, reg_closes_at, participation, team_min, team_max,
  owner_team_id, created_by, published_at, festival
)
select
  e.slug, e.title, e.summary,
  e.summary || E'\n\n## Rule book\n\nThe full rules will be posted here soon.',
  e.event_type, true, 'published', 'public', e.venue,
  e.starts_at, e.ends_at, timestamptz '2026-11-15 00:00+05:30', timestamptz '2026-12-10 23:59+05:30',
  e.participation, e.team_min, e.team_max,
  owner.team_id, author.profile_id, now(), 'chronos'
from e, owner, author
on conflict (slug) do nothing;

commit;

select slug, title, participation, team_min, team_max, venue, starts_at
from public.events
where festival = 'chronos'
order by starts_at;
