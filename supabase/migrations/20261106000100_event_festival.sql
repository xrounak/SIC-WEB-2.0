-- Events can belong to a festival (for example "chronos"), so a festival microsite
-- such as chronos.sic.gecp.in can list exactly its own events. Plain text, so next
-- year's festival needs no schema change.

alter table public.events
  add column festival text check (festival ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(festival) <= 40);

create index events_festival_idx on public.events (festival) where festival is not null;

grant insert (festival), update (festival) on public.events to authenticated;
