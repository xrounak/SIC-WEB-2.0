-- Chronos 2026: the festival names for six events. Run once in the Supabase SQL editor.
-- Only the titles change; slugs (and so every link and registration) stay the same.

update public.events as e
set title = n.title
from (values
  ('robo-war',            'Nether Clash'),
  ('robo-soccer',         'Elytra Kick'),
  ('boat-race',           'Marine Rush'),
  ('rc-car-hurdle-race',  'Pillager''s Parkour'),
  ('build-beyond-limits', 'Creative Mode'),
  ('12-hour-hackathon',   'Trial Chambers')
) as n (slug, title)
where e.slug = n.slug;

select slug, title from public.events where festival = 'chronos' order by starts_at;
