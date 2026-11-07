-- Time-trial leaderboard for the Chronos 3D island (chronos.sic.gecp.in): how fast a
-- visitor drove to every event. Anyone may post a run and read the top runs, but only
-- through the two functions below; the table itself is closed to clients. Admins can
-- remove rows in the Supabase dashboard (for example a rude name).

create table public.chronos_runs (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 24),
  seconds numeric(8, 2) not null check (seconds between 20 and 7200),
  gears smallint not null default 0 check (gears between 0 and 100),
  created_at timestamptz not null default now()
);

create index chronos_runs_rank_idx on public.chronos_runs (seconds, created_at);
create index chronos_runs_recent_idx on public.chronos_runs (created_at);

alter table public.chronos_runs enable row level security;
revoke all on public.chronos_runs from anon, authenticated;

-- Post one run. Returns the run's place on the board.
create or replace function public.submit_chronos_run(p_name text, p_seconds numeric, p_gears integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_seconds numeric := round(p_seconds, 2);
begin
  if char_length(v_name) < 2 or char_length(v_name) > 24 then
    raise exception 'NAME_LENGTH';
  end if;
  if v_seconds is null or v_seconds < 20 or v_seconds > 7200 then
    raise exception 'TIME_OUT_OF_RANGE';
  end if;
  -- A light guard against floods: the whole board takes at most 30 runs a minute.
  if (select count(*) from public.chronos_runs where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'TOO_MANY_RUNS';
  end if;

  insert into public.chronos_runs (name, seconds, gears)
  values (v_name, v_seconds, greatest(0, least(coalesce(p_gears, 0), 100)));

  return (select count(*)::integer + 1 from public.chronos_runs where seconds < v_seconds);
end;
$$;

-- The fastest runs, best first.
create or replace function public.chronos_leaderboard(p_limit integer default 10)
returns table (place bigint, name text, seconds numeric, gears smallint, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select row_number() over (order by r.seconds, r.created_at), r.name, r.seconds, r.gears, r.created_at
  from public.chronos_runs r
  order by r.seconds, r.created_at
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

revoke all on function public.submit_chronos_run(text, numeric, integer) from public;
revoke all on function public.chronos_leaderboard(integer) from public;
grant execute on function public.submit_chronos_run(text, numeric, integer) to anon, authenticated;
grant execute on function public.chronos_leaderboard(integer) to anon, authenticated;
