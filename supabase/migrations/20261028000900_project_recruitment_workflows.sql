-- Workflow RPCs: projects, recruitment, announcements.

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create function public.submit_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_project public.projects;
begin
  select * into v_project from public.projects where id = p_project_id for update;
  if v_project.id is null or v_project.created_by <> v_uid then
    raise exception 'PROJECT_NOT_FOUND';
  end if;
  if v_project.status not in ('draft', 'changes_requested') then
    raise exception 'INVALID_STATUS';
  end if;
  if not public.is_member() then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_project.summary is null or v_project.problem is null or v_project.solution is null then
    raise exception 'PROJECT_INCOMPLETE';
  end if;

  -- The author is always a confirmed contributor.
  insert into public.project_contributors (project_id, member_id, confirmed_at)
  values (p_project_id, v_uid, now())
  on conflict (project_id, member_id) do update set confirmed_at = coalesce(public.project_contributors.confirmed_at, now());

  update public.projects set status = 'submitted' where id = p_project_id;

  insert into public.notifications (user_id, kind, title, target_url)
  select c.member_id, 'contribution_confirm', 'Confirm your credit on "' || v_project.title || '"', '/portal/projects'
  from public.project_contributors c
  where c.project_id = p_project_id and c.confirmed_at is null;

  insert into public.notifications (user_id, kind, title, target_url)
  select tm.member_id, 'project_review', 'New project to review: ' || v_project.title, '/manage/projects/' || p_project_id
  from public.team_members tm
  where tm.team_id = v_project.owner_team_id and tm.team_role = 'lead' and tm.status = 'active'
    and tm.member_id <> v_uid;

  perform private.audit('project.submitted', 'project', p_project_id);
end;
$$;

create function public.start_project_review(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_project public.projects;
begin
  select * into v_project from public.projects where id = p_project_id for update;
  if v_project.id is null or not public.can_review_project(p_project_id) or v_project.created_by = v_uid then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_project.status <> 'submitted' then
    raise exception 'INVALID_STATUS';
  end if;
  update public.projects set status = 'in_review' where id = p_project_id;
end;
$$;

create function public.review_project(p_project_id uuid, p_decision text, p_notes text default null)
returns public.project_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_project public.projects;
  v_new_status public.project_status;
  v_slug text;
begin
  if p_decision not in ('approved', 'changes_requested', 'rejected') then
    raise exception 'INVALID_DECISION';
  end if;
  if p_decision <> 'approved' and char_length(trim(coalesce(p_notes, ''))) < 5 then
    raise exception 'NOTES_REQUIRED';
  end if;

  select * into v_project from public.projects where id = p_project_id for update;
  if v_project.id is null or not public.can_review_project(p_project_id) then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_project.created_by = v_uid then
    raise exception 'CANNOT_REVIEW_OWN';
  end if;
  if v_project.status not in ('submitted', 'in_review') then
    raise exception 'INVALID_STATUS';
  end if;

  v_new_status := case p_decision
    when 'approved' then 'published'::public.project_status
    when 'changes_requested' then 'changes_requested'::public.project_status
    else 'rejected'::public.project_status
  end;

  if v_new_status = 'published' then
    v_slug := coalesce(
      v_project.slug,
      trim(both '-' from coalesce(nullif(left(public.slugify(v_project.title), 60), ''), 'project'))
        || '-' || left(replace(v_project.id::text, '-', ''), 6)
    );
  end if;

  update public.projects
  set status = v_new_status,
      slug = coalesce(v_slug, slug),
      published_at = case when v_new_status = 'published' then now() else published_at end
  where id = p_project_id;

  insert into public.project_reviews (project_id, reviewer_id, decision, notes)
  values (p_project_id, v_uid, p_decision, nullif(trim(coalesce(p_notes, '')), ''));

  perform private.notify(v_project.created_by, 'project_decision',
    case p_decision
      when 'approved' then '"' || v_project.title || '" is published'
      when 'changes_requested' then 'Changes requested on "' || v_project.title || '"'
      else '"' || v_project.title || '" was not approved'
    end,
    p_notes,
    case when v_new_status = 'published' then '/projects/' || v_slug else '/portal/projects' end);
  perform private.audit('project.reviewed', 'project', p_project_id, jsonb_build_object('decision', p_decision));
  return v_new_status;
end;
$$;

create function public.confirm_contribution(p_project_id uuid, p_accept boolean, p_is_public boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_project public.projects;
begin
  select * into v_project from public.projects where id = p_project_id;
  if not exists (
    select 1 from public.project_contributors where project_id = p_project_id and member_id = v_uid
  ) then
    raise exception 'NOT_A_CONTRIBUTOR';
  end if;

  if p_accept then
    update public.project_contributors
    set confirmed_at = coalesce(confirmed_at, now()), is_public = coalesce(p_is_public, true)
    where project_id = p_project_id and member_id = v_uid;
  else
    delete from public.project_contributors where project_id = p_project_id and member_id = v_uid;
    perform private.notify(v_project.created_by, 'contribution_declined',
      'A contributor declined credit on "' || v_project.title || '"', null, '/portal/projects');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Recruitment
-- ---------------------------------------------------------------------------

create function public.submit_application(
  p_cycle_id uuid,
  p_domain_prefs uuid[],
  p_team_prefs uuid[],
  p_motivation text,
  p_experience text default null,
  p_portfolio_url text default null,
  p_answers jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_profile public.profiles := private.require_onboarded(v_uid);
  v_cycle public.recruitment_cycles;
  v_domains uuid[] := array(select distinct unnest(coalesce(p_domain_prefs, '{}')));
  v_teams uuid[] := array(select distinct unnest(coalesce(p_team_prefs, '{}')));
  v_application_id uuid;
begin
  if v_profile.member_status = 'member' then
    raise exception 'ALREADY_MEMBER';
  end if;
  if v_profile.member_status = 'suspended' or v_profile.student_status not in ('pending', 'verified') then
    raise exception 'NOT_ELIGIBLE';
  end if;

  select * into v_cycle from public.recruitment_cycles where id = p_cycle_id for share;
  if v_cycle.id is null or v_cycle.status <> 'open' or now() not between v_cycle.opens_at and v_cycle.closes_at then
    raise exception 'CYCLE_CLOSED';
  end if;
  if cardinality(v_domains) = 0 then
    raise exception 'DOMAIN_REQUIRED';
  end if;
  if (select count(*) from public.domains where id = any (v_domains) and is_active) <> cardinality(v_domains)
     or (select count(*) from public.teams where id = any (v_teams) and is_active) <> cardinality(v_teams) then
    raise exception 'INVALID_PREFERENCE';
  end if;

  begin
    insert into public.recruitment_applications (
      cycle_id, user_id, domain_prefs, team_prefs, motivation, experience, portfolio_url, answers
    )
    values (
      p_cycle_id, v_uid, v_domains, v_teams, trim(p_motivation),
      nullif(trim(coalesce(p_experience, '')), ''), nullif(trim(coalesce(p_portfolio_url, '')), ''),
      coalesce(p_answers, '{}'::jsonb)
    )
    returning id into v_application_id;
  exception when unique_violation then
    raise exception 'ALREADY_APPLIED';
  end;

  update public.profiles set member_status = 'applicant' where id = v_uid and member_status = 'none';

  perform private.enqueue_email(v_profile.email, 'application-received',
    jsonb_build_object('cycle_name', v_cycle.name, 'full_name', v_profile.full_name),
    'application-received:' || v_application_id);
  perform private.enqueue_telegram('application-submitted',
    jsonb_build_object('cycle_name', v_cycle.name, 'full_name', v_profile.full_name),
    'application-submitted:' || v_application_id);
  return v_application_id;
end;
$$;

-- Applicant who no longer has an open application goes back to member_status 'none'.
create function private.reset_applicant_status(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set member_status = 'none'
  where id = p_user_id
    and member_status = 'applicant'
    and not exists (
      select 1 from public.recruitment_applications
      where user_id = p_user_id and status in ('submitted', 'screening', 'shortlisted', 'interview', 'waitlisted')
    );
$$;

create function public.withdraw_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_app public.recruitment_applications;
begin
  select * into v_app from public.recruitment_applications where id = p_application_id for update;
  if v_app.id is null or v_app.user_id <> v_uid then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;
  if v_app.status in ('selected', 'rejected', 'withdrawn') then
    raise exception 'INVALID_STATUS';
  end if;
  update public.recruitment_applications set status = 'withdrawn' where id = p_application_id;
  perform private.reset_applicant_status(v_uid);
end;
$$;

-- Reviewer pipeline moves. Final outcomes after interview belong to decide_application.
create function public.move_application(p_application_id uuid, p_status public.application_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_app public.recruitment_applications;
  v_email text;
  v_cycle_name text;
begin
  select * into v_app from public.recruitment_applications where id = p_application_id for update;
  if v_app.id is null or not public.reviews_cycle(v_app.cycle_id) or v_app.user_id = v_uid then
    raise exception 'NOT_ALLOWED';
  end if;
  if not (
    (v_app.status = 'submitted' and p_status = 'screening')
    or (v_app.status = 'screening' and p_status in ('shortlisted', 'rejected'))
    or (v_app.status = 'shortlisted' and p_status in ('interview', 'rejected'))
  ) then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.recruitment_applications
  set status = p_status,
      decided_at = case when p_status = 'rejected' then now() else decided_at end,
      decided_by = case when p_status = 'rejected' then v_uid else decided_by end
  where id = p_application_id;

  select email into v_email from public.profiles where id = v_app.user_id;
  select name into v_cycle_name from public.recruitment_cycles where id = v_app.cycle_id;

  if p_status = 'rejected' then
    perform private.reset_applicant_status(v_app.user_id);
    perform private.enqueue_email(v_email, 'application-outcome',
      jsonb_build_object('cycle_name', v_cycle_name, 'outcome', 'rejected'),
      'application-outcome:' || p_application_id);
  elsif p_status = 'interview' then
    perform private.enqueue_email(v_email, 'application-interview',
      jsonb_build_object('cycle_name', v_cycle_name),
      'application-interview:' || p_application_id);
  end if;
  perform private.notify(v_app.user_id, 'application', 'Your application was updated', null, '/portal/applications');
  perform private.audit('application.moved', 'recruitment_application', p_application_id,
    jsonb_build_object('from', v_app.status, 'to', p_status));
end;
$$;

create function public.evaluate_application(
  p_application_id uuid,
  p_stage text,
  p_score numeric,
  p_private_notes text,
  p_recommendation text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_app public.recruitment_applications;
begin
  select * into v_app from public.recruitment_applications where id = p_application_id;
  if v_app.id is null or not public.reviews_cycle(v_app.cycle_id) or v_app.user_id = v_uid then
    raise exception 'NOT_ALLOWED';
  end if;

  insert into public.recruitment_evaluations (application_id, evaluator_id, stage, score, private_notes, recommendation)
  values (p_application_id, v_uid, p_stage, p_score, p_private_notes, p_recommendation)
  on conflict (application_id, evaluator_id, stage) do update
  set score = excluded.score,
      private_notes = excluded.private_notes,
      recommendation = excluded.recommendation;
end;
$$;

create function public.decide_application(
  p_application_id uuid,
  p_decision public.application_status,
  p_domain_ids uuid[] default null,
  p_team_ids uuid[] default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_app public.recruitment_applications;
  v_profile public.profiles;
  v_cycle_name text;
begin
  if not public.is_exec() then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_decision not in ('selected', 'waitlisted', 'rejected') then
    raise exception 'INVALID_DECISION';
  end if;

  select * into v_app from public.recruitment_applications where id = p_application_id for update;
  if v_app.id is null then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;
  if v_app.user_id = v_uid then
    raise exception 'CANNOT_REVIEW_OWN';
  end if;
  if v_app.status not in ('shortlisted', 'interview', 'waitlisted') then
    raise exception 'INVALID_STATUS';
  end if;

  select * into v_profile from public.profiles where id = v_app.user_id for update;
  select name into v_cycle_name from public.recruitment_cycles where id = v_app.cycle_id;

  if p_decision = 'selected' then
    if v_profile.student_status <> 'verified' then
      raise exception 'STUDENT_NOT_VERIFIED';
    end if;

    update public.profiles set member_status = 'member' where id = v_profile.id;

    insert into public.member_domains (member_id, domain_id)
    select v_profile.id, d from unnest(coalesce(p_domain_ids, v_app.domain_prefs)) d
    on conflict do nothing;

    insert into public.team_members (team_id, member_id, team_role, status)
    select t, v_profile.id, 'member', 'active' from unnest(coalesce(p_team_ids, v_app.team_prefs)) t
    on conflict (team_id, member_id) do update set status = 'active';
  end if;

  update public.recruitment_applications
  set status = p_decision, decided_at = now(), decided_by = v_uid
  where id = p_application_id;

  if p_decision = 'rejected' then
    perform private.reset_applicant_status(v_profile.id);
  end if;

  perform private.notify(v_profile.id, 'application',
    case p_decision
      when 'selected' then 'Welcome to SIC!'
      when 'waitlisted' then 'You are on the waitlist'
      else 'Your application outcome is ready'
    end,
    null, case when p_decision = 'selected' then '/portal' else '/portal/applications' end);
  perform private.enqueue_email(v_profile.email, 'application-outcome',
    jsonb_build_object('cycle_name', v_cycle_name, 'outcome', p_decision, 'full_name', v_profile.full_name),
    'application-outcome:' || p_application_id || ':' || p_decision);
  perform private.audit('application.decided', 'recruitment_application', p_application_id,
    jsonb_build_object('decision', p_decision));
end;
$$;

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------

create function public.publish_announcement(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_row public.announcements;
begin
  select * into v_row from public.announcements where id = p_announcement_id for update;
  if v_row.id is null or not (v_row.created_by = v_uid or public.is_exec()) then
    raise exception 'NOT_ALLOWED';
  end if;
  if not public.can_announce(v_row.audience, v_row.team_id) then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_row.status <> 'draft' then
    raise exception 'INVALID_STATUS';
  end if;

  update public.announcements set status = 'published', published_at = now() where id = p_announcement_id;

  insert into public.notifications (user_id, kind, title, target_url)
  select p.id, 'announcement', v_row.title, '/portal/notices'
  from public.profiles p
  where p.id <> v_uid
    and (
      (v_row.audience = 'members' and p.member_status = 'member')
      or (v_row.audience = 'team' and exists (
        select 1 from public.team_members tm
        where tm.team_id = v_row.team_id and tm.member_id = p.id and tm.status = 'active'
      ))
    );

  perform private.audit('announcement.published', 'announcement', p_announcement_id,
    jsonb_build_object('audience', v_row.audience));
end;
$$;

create function public.archive_announcement(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_row public.announcements;
begin
  select * into v_row from public.announcements where id = p_announcement_id for update;
  if v_row.id is null or not (v_row.created_by = v_uid or public.is_exec()) then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_row.status <> 'published' then
    raise exception 'INVALID_STATUS';
  end if;
  update public.announcements set status = 'archived' where id = p_announcement_id;
end;
$$;
