-- Chronos 2026: remove the "Expert Talks + Inauguration" event from the SIC website.
-- (It also disappears from the Chronos site, which reads its events from here.)
-- Run in the Supabase SQL editor. Safe to run again. Any registrations for it go with it.

delete from public.events where slug = 'expert-talks-inauguration';

select slug, title from public.events where festival = 'chronos' order by starts_at;
