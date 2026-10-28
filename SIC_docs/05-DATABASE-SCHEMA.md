# 05 — Database Schema

Use UUID primary keys, `timestamptz` timestamps and foreign keys. Add indexes for common filters. This is the logical schema specification; implement it through versioned SQL migrations and review all RLS policies before launch.

## Conventions
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` where records are editable
- Public-facing content uses `status` and optional unique `slug`.
- Use foreign keys with deliberate `on delete` behavior. Prefer archive/status changes for important records.

## Identity and access
### `profiles`
- `id uuid PK references auth.users(id) on delete cascade`
- `full_name text not null`
- `college_email text`
- `phone text` (private)
- `student_id text` (private; only if required)
- `branch text`
- `academic_year smallint`
- `bio text`
- `avatar_path text`
- `public_profile_enabled boolean not null default false`
- `created_at`, `updated_at`

### `user_roles`
- `id uuid PK`
- `user_id uuid FK -> profiles.id`
- `role app_role not null`
- `assigned_by uuid FK -> profiles.id`
- `created_at`
- Unique (`user_id`, `role`)

### `domains`
- `id uuid PK`
- `name text unique not null`
- `slug text unique not null`
- `description text`
- `is_active boolean default true`
- `sort_order int default 0`

### `member_domains`
- `member_id uuid FK -> profiles.id`
- `domain_id uuid FK -> domains.id`
- `membership_status text` (`active`, `pending`, `inactive`)
- `joined_at timestamptz`
- PK (`member_id`, `domain_id`)

### `teams`
- `id uuid PK`
- `name text not null`
- `slug text unique not null`
- `description text`
- `team_type text` (technical, operations, media, etc.)
- `is_active boolean default true`

### `team_members`
- `team_id uuid FK -> teams.id`
- `member_id uuid FK -> profiles.id`
- `team_role text` (member, lead, deputy, etc.)
- `membership_status text`
- `joined_at timestamptz`
- PK (`team_id`, `member_id`)

## Events and registration
### `events`
- `id uuid PK`
- `title text not null`
- `slug text unique`
- `summary text`
- `description text`
- `event_type text not null`
- `status event_status not null default 'draft'`
- `visibility text not null default 'public'` (`public`, `members`)
- `venue text`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `registration_opens_at timestamptz`
- `registration_closes_at timestamptz`
- `capacity int`
- `cover_image_path text`
- `created_by uuid FK -> profiles.id`
- `assigned_team_id uuid FK -> teams.id`
- `reviewed_by uuid FK -> profiles.id`
- `reviewed_at timestamptz`
- `published_at timestamptz`
- `rejection_reason text`
- `created_at`, `updated_at`

### `event_proposals` (optional if draft events themselves are used for proposals)
- `id uuid PK`
- `event_id uuid FK -> events.id`
- `submitted_by uuid FK -> profiles.id`
- `lead_reviewer_id uuid FK -> profiles.id`
- `lead_decision text` (`pending`, `approved`, `rejected`, `changes_requested`)
- `lead_notes text`
- `final_reviewer_id uuid FK -> profiles.id`
- `final_decision text`
- `final_notes text`
- `submitted_at`, `decided_at`

### `event_registrations`
- `id uuid PK`
- `event_id uuid FK -> events.id`
- `full_name text not null`
- `email text not null`
- `phone text`
- `college text`
- `academic_year smallint`
- `branch text`
- `domain_interest text`
- `participation_type text` (`individual`, `team`)
- `team_name text`
- `team_details jsonb`
- `status text` (`registered`, `waitlisted`, `cancelled`, `attended`, `no_show`)
- `confirmation_token_hash text` (optional, never store raw secret)
- `created_at`
- Unique policy should prevent duplicate registrations according to event rules; normalized email may be used with event ID.

### `attendance_sessions`
- `id uuid PK`
- `event_id uuid FK -> events.id`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `qr_token_hash text`
- `created_by uuid FK -> profiles.id`
- `is_active boolean default true`

### `attendance_records`
- `id uuid PK`
- `session_id uuid FK -> attendance_sessions.id`
- `member_id uuid FK -> profiles.id`
- `registration_id uuid FK -> event_registrations.id` (nullable)
- `checked_in_at timestamptz`
- `method text` (`qr`, `manual`)
- `recorded_by uuid FK -> profiles.id`
- `notes text`
- Unique (`session_id`, `member_id`) where applicable.

## Projects and media
### `projects`
- `id uuid PK`
- `title text not null`
- `slug text unique`
- `summary text`
- `description text`
- `problem_statement text`
- `solution text`
- `outcomes text`
- `hardware_details text`
- `software_details text`
- `repository_url text`
- `demo_url text`
- `status text` (`draft`, `submitted`, `in_review`, `published`, `rejected`, `archived`)
- `visibility text` (`public`, `members`)
- `created_by uuid FK -> profiles.id`
- `reviewed_by uuid FK -> profiles.id`
- `published_at timestamptz`
- `created_at`, `updated_at`

### `project_contributors`
- `project_id uuid FK -> projects.id`
- `member_id uuid FK -> profiles.id`
- `contribution_role text`
- `is_public boolean default true`
- PK (`project_id`, `member_id`)

### `project_domains`
- `project_id uuid FK -> projects.id`
- `domain_id uuid FK -> domains.id`
- PK (`project_id`, `domain_id`)

### `project_media`
- `id uuid PK`
- `project_id uuid FK -> projects.id`
- `storage_path text not null`
- `media_type text` (`image`, `video`, `document`)
- `caption text`
- `sort_order int default 0`
- `uploaded_by uuid FK -> profiles.id`

## Recruitment
### `recruitment_cycles`
- `id uuid PK`
- `name text not null`
- `opens_at timestamptz`
- `closes_at timestamptz`
- `status text` (`draft`, `open`, `closed`, `archived`)
- `created_by uuid FK -> profiles.id`

### `recruitment_applications`
- `id uuid PK`
- `cycle_id uuid FK -> recruitment_cycles.id`
- `full_name text not null`
- `email text not null`
- `phone text`
- `student_id text`
- `branch text`
- `academic_year smallint`
- `domain_preferences jsonb`
- `team_preferences jsonb`
- `motivation text`
- `experience text`
- `portfolio_url text`
- `status text` (`submitted`, `screening`, `shortlisted`, `interview`, `selected`, `rejected`, `waitlisted`, `withdrawn`)
- `submitted_at timestamptz`
- `updated_at`

### `recruitment_evaluations`
- `id uuid PK`
- `application_id uuid FK -> recruitment_applications.id`
- `evaluator_id uuid FK -> profiles.id`
- `stage text`
- `score numeric`
- `private_notes text`
- `decision text`
- `created_at`, `updated_at`
- Private to authorized reviewers; never public.

## Competitions
### `competitions`
- `id uuid PK`
- `event_id uuid FK -> events.id` (nullable)
- `title text not null`
- `description text`
- `rules text`
- `status text` (`draft`, `open`, `closed`, `results_published`)
- `scoring_method text`
- `created_at`, `updated_at`

### `competition_entries`
- `id uuid PK`
- `competition_id uuid FK -> competitions.id`
- `entry_type text` (`individual`, `team`)
- `participant_name text`
- `team_name text`
- `submitted_by uuid FK -> profiles.id` (nullable for public entrants)
- `details jsonb`
- `status text`
- `created_at`

### `competition_results`
- `id uuid PK`
- `entry_id uuid FK -> competition_entries.id`
- `rank int`
- `score numeric`
- `judge_notes text` (private unless intentionally published)
- `published boolean default false`
- `published_at timestamptz`

### `certificates`
- `id uuid PK`
- `recipient_name text not null`
- `recipient_email text`
- `event_id uuid FK -> events.id`
- `competition_result_id uuid FK -> competition_results.id`
- `certificate_code text unique`
- `storage_path text`
- `issued_by uuid FK -> profiles.id`
- `issued_at timestamptz`
- `revoked_at timestamptz`

## Content, communication and resources
### `announcements`
- `id uuid PK`
- `title text not null`
- `body text not null`
- `audience text` (`public`, `members`, `team`)
- `team_id uuid FK -> teams.id` (nullable)
- `status text` (`draft`, `published`, `archived`)
- `published_at timestamptz`
- `created_by uuid FK -> profiles.id`
- `created_at`, `updated_at`

### `news_articles`
- `id uuid PK`
- `title text not null`
- `slug text unique`
- `summary text`
- `body text`
- `source_name text`
- `source_url text`
- `author_id uuid FK -> profiles.id`
- `category text`
- `status text` (`draft`, `published`, `archived`)
- `published_at timestamptz`
- `created_at`, `updated_at`

### `resources`
- `id uuid PK`
- `title text not null`
- `description text`
- `resource_url text`
- `storage_path text`
- `audience text` (`public`, `members`)
- `domain_id uuid FK -> domains.id`
- `status text`
- `created_by uuid FK -> profiles.id`
- `created_at`, `updated_at`

### `notifications`
- `id uuid PK`
- `user_id uuid FK -> profiles.id`
- `title text not null`
- `body text`
- `notification_type text`
- `target_url text`
- `read_at timestamptz`
- `created_at`

### `audit_logs`
- `id uuid PK`
- `actor_id uuid FK -> profiles.id`
- `action text not null`
- `entity_type text not null`
- `entity_id uuid`
- `metadata jsonb`
- `created_at`
- Append-only to ordinary users; write through trusted server logic for sensitive events.

## Required indexes and constraints
- Index all foreign keys used in joins/filtering.
- Index `events(status, starts_at)`, `projects(status, published_at)`, `announcements(status, published_at)`, `news_articles(status, published_at)`.
- Index `event_registrations(event_id, created_at)` and recruitment status/cycle.
- Add checks for valid time windows, capacity > 0, score/rank bounds and valid academic year.
- Normalize email before duplicate checks.
- Add uniqueness rules for duplicate registration, membership and attendance.
- Keep enum/status transitions in server-side workflow logic; do not allow arbitrary status changes from the browser.
- Add `updated_at` triggers where appropriate.
- Use a separate migration for every schema change.
