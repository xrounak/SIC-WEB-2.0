-- Chronos 2026: new start times (IST) for four events. Each keeps its day and its length;
-- the end time moves with the start. Run in the Supabase SQL editor. Safe to run again.
--
--   Elytra Kick         Fri 11 Dec  4:00 pm
--   Pillager's Parkour  Sat 12 Dec  5:00 pm
--   Marine Rush         Sun 13 Dec  3:00 pm
--   Nether Clash        Sun 13 Dec  5:00 pm

with t (slug, at) as (
  values
    ('robo-soccer', time '16:00'),
    ('rc-car-hurdle-race', time '17:00'),
    ('boat-race', time '15:00'),
    ('robo-war', time '17:00')
)
update public.events e
set starts_at = ((e.starts_at at time zone 'Asia/Kolkata')::date + t.at) at time zone 'Asia/Kolkata',
    ends_at = ((e.starts_at at time zone 'Asia/Kolkata')::date + t.at) at time zone 'Asia/Kolkata'
              + coalesce(e.ends_at - e.starts_at, interval '2 hours')
from t
where e.slug = t.slug;

select title,
       to_char(starts_at at time zone 'Asia/Kolkata', 'Dy DD Mon, HH12:MI am') as starts,
       to_char(ends_at at time zone 'Asia/Kolkata', 'HH12:MI am') as ends
from public.events
where slug in ('robo-soccer', 'rc-car-hurdle-race', 'boat-race', 'robo-war')
order by starts_at;
