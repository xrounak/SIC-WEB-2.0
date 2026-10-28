-- System tables: in-app notifications, outbound message queue, audit log.
-- Internal write helpers live in the "private" schema, which the Data API does not expose
-- and client roles cannot use. Workflow RPCs call them inside their own transaction.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null check (char_length(title) <= 200),
  body text check (char_length(body) <= 2000),
  target_url text check (char_length(target_url) <= 500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Messages are written in the same transaction as the change that caused them and
-- delivered later by a server worker (service role). Failed sends never roll back work.
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'email' check (channel in ('email', 'telegram')),
  to_address text,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  attempts int not null default 0,
  last_error text,
  provider_message_id text,
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  check (channel = 'telegram' or to_address is not null)
);

create index email_outbox_queue_idx on public.email_outbox (send_after) where status = 'queued';

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.notifications enable row level security;
alter table public.email_outbox enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users read own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users mark own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- email_outbox: no policies. Service role only.
revoke all on public.email_outbox from anon, authenticated;

create policy "President and admin read audit log"
  on public.audit_logs for select to authenticated
  using (public.is_admin() or public.has_role('president'));
revoke insert, update, delete on public.audit_logs from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------

create function private.audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;

create function private.notify(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text default null,
  p_target_url text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, title, body, target_url)
  values (p_user_id, p_kind, left(p_title, 200), left(p_body, 2000), p_target_url);
$$;

-- Queue an email. The idempotency key makes retries of the same workflow step harmless.
create function private.enqueue_email(
  p_to text,
  p_template text,
  p_payload jsonb,
  p_idempotency_key text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.email_outbox (channel, to_address, template, payload, idempotency_key)
  values ('email', lower(p_to), p_template, coalesce(p_payload, '{}'::jsonb), p_idempotency_key)
  on conflict (idempotency_key) do nothing;
$$;

-- Admin alert to the club's Telegram chat (bot token stays in server env).
create function private.enqueue_telegram(p_template text, p_payload jsonb, p_idempotency_key text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.email_outbox (channel, template, payload, idempotency_key)
  values ('telegram', p_template, coalesce(p_payload, '{}'::jsonb), p_idempotency_key)
  on conflict (idempotency_key) do nothing;
$$;

-- Random URL token: raw value goes to the recipient, only the hash is stored.
create function private.new_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select encode(extensions.gen_random_bytes(24), 'hex');
$$;

create function private.hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

-- Common guard used by every workflow RPC.
create function private.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;
  return v_uid;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
