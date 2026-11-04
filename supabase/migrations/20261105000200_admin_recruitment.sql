-- Admins run recruitment too: create and edit cycles, assign reviewers, review and
-- evaluate applications, and make the final decision (select / waitlist / reject).
-- Until now only the president and vice president could.

-- Reviewing: execs, admins, or reviewers assigned to the cycle.
create or replace function public.reviews_cycle(check_cycle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_exec() or public.is_admin() or exists (
    select 1 from public.recruitment_reviewers
    where cycle_id = check_cycle_id and user_id = (select auth.uid())
  );
$$;

-- Managing cycles and reviewers.
drop policy "Execs manage cycles" on public.recruitment_cycles;
create policy "Execs and admins manage cycles"
  on public.recruitment_cycles for all to authenticated
  using (public.is_exec() or public.is_admin())
  with check (public.is_exec() or public.is_admin());

drop policy "Reviewers see assignments" on public.recruitment_reviewers;
create policy "Reviewers see assignments"
  on public.recruitment_reviewers for select to authenticated
  using (user_id = (select auth.uid()) or public.is_exec() or public.is_admin());

drop policy "Execs assign reviewers" on public.recruitment_reviewers;
create policy "Execs and admins assign reviewers"
  on public.recruitment_reviewers for all to authenticated
  using (public.is_exec() or public.is_admin())
  with check (public.is_exec() or public.is_admin());

-- Final decision: the same function with one check widened. Patched in place so the
-- rest of the body (team seats, notifications, audit) stays exactly as it was.
do $$
declare
  def text;
begin
  select pg_get_functiondef('public.decide_application(uuid, public.application_status, uuid[], uuid[])'::regprocedure) into def;
  if position('if not public.is_exec() then' in def) = 0 then
    raise exception 'decide_application changed; update this migration';
  end if;
  def := replace(def, 'if not public.is_exec() then', 'if not (public.is_exec() or public.is_admin()) then');
  execute def;
end;
$$;
