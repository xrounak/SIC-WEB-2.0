-- One published demo event for testing team invites, the rule book and Chronos.
-- Run in the Supabase SQL editor. Safe to run twice (it replaces the demo event).
-- Remove it with the DELETE at the bottom when you're done.
--
-- What it is: a team event (2 to 4 people) on Chronos Day 2, 12 Dec 2026, so it also
-- shows on chronos.sic.gecp.in. Registration is open now and closes on 10 Dec.

delete from public.events where slug = 'demo-event';

insert into public.events (
  slug, title, summary, description, event_type, is_major, status, visibility, venue,
  starts_at, ends_at, reg_opens_at, reg_closes_at, capacity, participation, team_min, team_max,
  owner_team_id, created_by, published_at, festival
)
values (
  'demo-event',
  'Demo Event',
  'A test event for trying team invites and the rule book. Not a real event.',
  $md$
> **This is a demo event** for testing the website. It is not a real event.

## About

Form a team, invite your friends from the portal, and see how the rule book looks on an event page.

## Team rules

1. Teams of **2 to 4** people.
2. One person creates the team and becomes the **team leader**.
3. The leader invites teammates from the registration page. Teammates **accept or decline** in *Portal → Team invites*.
4. You can be in only **one team** for this event.

## Schedule

| Time | What happens |
|---|---|
| 2:00 pm | Check-in at the venue |
| 2:30 pm | Problem statement revealed |
| 5:30 pm | Demos and judging |
| 6:00 pm | Results |

## Judging

- **Idea** (30 points): how original and useful it is
- **Build** (40 points): does it work?
- **Demo** (30 points): how well you explain it

### What to bring

- A laptop and charger
- Your college ID card

## Questions?

Ask the organisers on the [SIC website](https://sic.gecp.in/contact).
$md$,
  'competition',
  false,
  'published',
  'public',
  'Seminar Hall 1, GEC Palamu',
  timestamptz '2026-12-12 14:00:00+05:30',
  timestamptz '2026-12-12 18:00:00+05:30',
  now(),
  timestamptz '2026-12-10 23:59:00+05:30',
  40,
  'team',
  2,
  4,
  coalesce(
    (select id from public.teams where slug = 'software'),
    (select id from public.teams order by created_at limit 1)
  ),
  coalesce(
    (select id from public.profiles where email = 'rounakkumar13005@gmail.com'),
    (select user_id from public.user_roles where role in ('admin', 'president') order by role limit 1),
    (select id from public.profiles order by created_at limit 1)
  ),
  now(),
  'chronos'
);

select id, slug, title, status, starts_at from public.events where slug = 'demo-event';

-- When you're done testing, remove the event (its teams, invites and registrations go with it):
-- delete from public.events where slug = 'demo-event';
