-- Function privileges and storage buckets.

-- Supabase grants EXECUTE on new public functions to anon and authenticated by default.
-- Start from nothing, then grant deliberately.
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

-- RLS helpers: policies on tables readable by anon call these, so anon needs them too.
grant execute on function
  public.has_role(public.app_role),
  public.is_exec(),
  public.is_admin(),
  public.is_staff(),
  public.is_member(),
  public.leads_team(uuid),
  public.is_any_lead(),
  public.in_team(uuid),
  public.can_manage_event(uuid),
  public.is_on_event_team(uuid),
  public.can_view_profile(uuid),
  public.can_review_project(uuid),
  public.can_edit_project(uuid),
  public.can_view_project(uuid),
  public.reviews_cycle(uuid),
  public.can_announce(text, uuid),
  public.slugify(text)
to anon, authenticated;

-- Invite preview works before sign-in.
grant execute on function public.get_invite(text) to anon, authenticated;

-- Workflow RPCs: signed-in users only. Each function checks its own permissions.
grant execute on function
  public.complete_onboarding(text, text, boolean, text, text, smallint, text),
  public.verify_student(uuid, boolean),
  public.assign_role(uuid, public.app_role),
  public.revoke_role(uuid, public.app_role),
  public.set_team_member(uuid, uuid, text),
  public.search_members(text),
  public.submit_event(uuid),
  public.review_event(uuid, text, text, boolean),
  public.publish_event(uuid),
  public.cancel_event(uuid, text),
  public.register_individual(uuid),
  public.create_event_team(uuid, text, text[]),
  public.accept_invite(text),
  public.decline_invite(text),
  public.add_team_invites(uuid, text[]),
  public.revoke_team_invite(uuid),
  public.resend_team_invite(uuid),
  public.withdraw_registration(uuid),
  public.submit_project(uuid),
  public.start_project_review(uuid),
  public.review_project(uuid, text, text),
  public.confirm_contribution(uuid, boolean, boolean),
  public.submit_application(uuid, uuid[], uuid[], text, text, text, jsonb),
  public.withdraw_application(uuid),
  public.move_application(uuid, public.application_status),
  public.evaluate_application(uuid, text, numeric, text, text),
  public.decide_application(uuid, public.application_status, uuid[], uuid[]),
  public.publish_announcement(uuid),
  public.archive_announcement(uuid)
to authenticated;

-- Cron only.
grant execute on function public.run_scheduled_maintenance() to service_role;

-- Future functions start locked as well.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage
--   avatars       public read; users write inside "<uid>/"
--   public-media  public read; members write inside "<uid>/" (event covers, project media)
--   private-docs  no public read; owner and staff read via signed URLs
-- Store random file names; never trust the uploaded filename.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('public-media', 'public-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']),
  ('private-docs', 'private-docs', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users replace own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Members upload media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_member()
  );
create policy "Members delete own media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners and staff read private docs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'private-docs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_staff())
  );
create policy "Users upload own private docs"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'private-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete own private docs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'private-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
