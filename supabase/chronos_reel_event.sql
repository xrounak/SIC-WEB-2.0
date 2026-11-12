-- Chronos 2026: the reel contest, "Spectator Mode". One person per entry: film all three
-- days of the festival, edit it into a reel, submit by 2:00 pm on 14 Dec; judged, with prizes.
-- Run once in the Supabase SQL editor. Safe to run again (an existing event gets the latest wording).
--
-- Registration opens 15 Nov 2026 and closes 10 Dec, like the other Chronos events.
-- Edit the wording, dates and prizes in the portal (Manage > Events).

insert into public.events (
  slug, title, summary, description, event_type, is_major, status, visibility, venue,
  starts_at, ends_at, reg_opens_at, reg_closes_at, participation,
  owner_team_id, created_by, published_at, festival
)
select
  'spectator-mode',
  'Spectator Mode',
  'Reel contest: film all three days of Chronos, edit one reel, submit by 2:00 pm on 14 December. Solo entry.',
  $md$
**Spectator Mode** is the Chronos reel contest. You don't compete in the arena: you film it.
Shoot the whole festival across all three days, cut it into one reel, and send it in by **2:00 pm on 14 December**, the day after the festival ends.

## How it works

1. **Register** here before the festival. Entry is **solo**: one person, one reel.
2. **Shoot** at Chronos on all three days, **11 to 13 December 2026**. Any phone or camera.
3. **Edit** your footage into a single reel after the festival.
4. **Submit** it before **2:00 pm on Monday, 14 December 2026**. Registered participants get the submission link by email and on this page. **Late reels are not accepted**, so edit as you shoot.
5. We **verify and score** every entry, then announce the winners and prizes.

## The reel

- **Vertical 9:16**, 30 to 90 seconds.
- It should cover **all three days**: at least one moment from each day.
- Only footage **you shot yourself at Chronos 2026**. No clips from other people or other events.
- Editing apps, effects, text and music are all fine. Use music you're allowed to use (Instagram's own library is the easy choice).
- Add "Chronos 2026" somewhere in the reel or caption.

## Rules

1. One entry per person. Team reels aren't accepted.
2. Film respectfully: don't block events, judges or safety areas, and stop if someone asks not to be filmed.
3. No offensive, misleading or unsafe content. The organisers can disqualify an entry.
4. Reels submitted after 2:00 pm on 14 December are not scored.
5. By submitting, you let the Science & Innovation Club share your reel on its pages, with credit to you.

## Judging (100 points)

| What | Points |
|---|---|
| Story: does it feel like Chronos, start to finish? | 30 |
| Editing: cuts, pacing, sound | 30 |
| Coverage: all three days, a range of events | 20 |
| Creativity | 20 |

Results are announced by SIC after judging.
$md$,
  'competition',
  true,
  'published',
  'public',
  'Across the campus, GEC Palamu',
  timestamptz '2026-12-11 09:00+05:30',
  timestamptz '2026-12-13 18:00+05:30',
  timestamptz '2026-11-15 00:00+05:30',
  timestamptz '2026-12-10 23:59+05:30',
  'individual',
  coalesce(
    (select id from public.teams where slug = 'software'),
    (select id from public.teams order by created_at limit 1)
  ),
  coalesce(
    (select id from public.profiles where email = 'rounakkumar13005@gmail.com'),
    (select user_id from public.user_roles where role = 'admin' limit 1),
    (select id from public.profiles order by created_at limit 1)
  ),
  now(),
  'chronos'
on conflict (slug) do update
  set summary = excluded.summary, description = excluded.description;

select slug, title, participation, starts_at, ends_at, reg_opens_at, reg_closes_at
from public.events
where slug = 'spectator-mode';
