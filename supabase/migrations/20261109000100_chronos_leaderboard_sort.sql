-- Chronos leaderboard, sortable: by time (fastest first) or by nitro cans collected (most
-- first, then fastest). Same closed table and the same rules as before; this only adds a
-- second way to read it.

create index if not exists chronos_runs_nitro_idx on public.chronos_runs (gears desc, seconds, created_at);

create or replace function public.chronos_leaderboard_by(p_sort text default 'time', p_limit integer default 10)
returns table (place bigint, name text, seconds numeric, gears smallint, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    row_number() over (
      order by
        case when p_sort = 'nitro' then -r.gears else 0 end,
        r.seconds,
        r.created_at
    ),
    r.name,
    r.seconds,
    r.gears,
    r.created_at
  from public.chronos_runs r
  order by
    case when p_sort = 'nitro' then -r.gears else 0 end,
    r.seconds,
    r.created_at
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

revoke all on function public.chronos_leaderboard_by(text, integer) from public;
grant execute on function public.chronos_leaderboard_by(text, integer) to anon, authenticated;
