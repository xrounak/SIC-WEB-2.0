-- An admin can approve their own event proposal. Before, "cannot review your own proposal"
-- applied to everyone, so a proposal written by an admin waited for someone else.
-- Same function and signature; only that one rule changed.

create or replace function public.review_event(
  p_event_id uuid,
  p_decision text,
  p_notes text default null,
  p_mark_major boolean default false
)
returns public.event_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_event public.events;
  v_stage text;
  v_new_status public.event_status;
  v_creator_email text;
begin
  if p_decision not in ('approved', 'changes_requested', 'rejected') then
    raise exception 'INVALID_DECISION';
  end if;
  if p_decision <> 'approved' and char_length(trim(coalesce(p_notes, ''))) < 5 then
    raise exception 'NOTES_REQUIRED';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  -- Nobody approves their own proposal, except an admin (who can do everything).
  if v_event.created_by = v_uid and not public.is_admin() then
    raise exception 'CANNOT_REVIEW_OWN';
  end if;

  if v_event.status = 'pending_review' then
    v_stage := 'lead';
    if not (public.leads_team(v_event.owner_team_id) or public.is_exec()) then
      raise exception 'NOT_ALLOWED';
    end if;
  elsif v_event.status = 'lead_approved' and v_event.is_major then
    v_stage := 'final';
    if not public.is_exec() then
      raise exception 'NOT_ALLOWED';
    end if;
  else
    raise exception 'INVALID_STATUS';
  end if;

  v_new_status := case p_decision
    when 'changes_requested' then 'changes_requested'::public.event_status
    when 'rejected' then 'rejected'::public.event_status
    else case v_stage when 'lead' then 'lead_approved'::public.event_status else 'final_approved'::public.event_status end
  end;

  update public.events
  set status = v_new_status,
      is_major = is_major or (v_stage = 'lead' and coalesce(p_mark_major, false))
  where id = p_event_id
  returning * into v_event;

  insert into public.event_reviews (event_id, stage, reviewer_id, decision, notes)
  values (p_event_id, v_stage, v_uid, p_decision, nullif(trim(coalesce(p_notes, '')), ''));

  perform private.notify(v_event.created_by, 'event_decision',
    case p_decision
      when 'approved' then 'Your proposal "' || v_event.title || '" was approved'
      when 'changes_requested' then 'Changes requested on "' || v_event.title || '"'
      else 'Your proposal "' || v_event.title || '" was not approved'
    end,
    p_notes, '/portal/proposals/' || p_event_id);

  select email into v_creator_email from public.profiles where id = v_event.created_by;
  perform private.enqueue_email(v_creator_email, 'event-decision',
    jsonb_build_object('event_id', p_event_id, 'title', v_event.title, 'stage', v_stage,
                       'decision', p_decision, 'notes', p_notes),
    'event-decision:' || p_event_id || ':' || v_stage || ':' || extract(epoch from now())::bigint);

  -- Major events now wait on VP / President.
  if v_new_status = 'lead_approved' and v_event.is_major then
    insert into public.notifications (user_id, kind, title, target_url)
    select distinct ur.user_id, 'event_review', 'Final approval needed: ' || v_event.title, '/manage/events/' || p_event_id
    from public.user_roles ur
    where ur.role in ('vice_president', 'president') and ur.user_id <> v_event.created_by;
  end if;

  perform private.audit('event.reviewed', 'event', p_event_id,
    jsonb_build_object('stage', v_stage, 'decision', p_decision));
  return v_new_status;
end;
$$;
