-- Foundation: extensions, enums, shared trigger functions.
-- Conventions: uuid keys, timestamptz, RLS on every table, deny by default.
-- Status columns change only through SECURITY DEFINER functions (see *_workflows migrations).

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('vice_president', 'president', 'faculty_coordinator', 'admin');

create type public.student_status as enum ('unverified', 'pending', 'verified', 'rejected', 'external');

create type public.member_status as enum ('none', 'applicant', 'member', 'alumni', 'suspended');

create type public.event_status as enum (
  'draft', 'pending_review', 'changes_requested', 'lead_approved', 'final_approved',
  'published', 'completed', 'cancelled', 'rejected', 'archived'
);

create type public.registration_status as enum ('registered', 'cancelled', 'attended', 'no_show');

create type public.project_status as enum (
  'draft', 'submitted', 'in_review', 'changes_requested', 'published', 'rejected', 'archived'
);

create type public.application_status as enum (
  'submitted', 'screening', 'shortlisted', 'interview', 'selected', 'waitlisted', 'rejected', 'withdrawn'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Lowercase URL-safe slug from free text. Callers append a suffix for uniqueness.
create function public.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'));
$$;
