# 06 — API Specification

## 1. API conventions
Base URLs:
- Supabase REST: `https://<project-ref>.supabase.co/rest/v1`
- Edge Functions: `https://<project-ref>.supabase.co/functions/v1/<function-name>`

Authentication:
- Public endpoints require no user session.
- Authenticated requests send the Supabase access token using `Authorization: Bearer <access_token>`.
- Browser uses only the publishable/anon key; RLS protects database access.
- Sensitive workflows must use Edge Functions with server-side validation and authorization.

Format: JSON. Use ISO-8601 timestamps in UTC. Use UUIDs for IDs.

Standard error shape:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "details": { "email": "Enter a valid email address." },
    "request_id": "optional-correlation-id"
  }
}
```
Do not return stack traces, service keys, private notes or internal database details.

## 2. Authentication
Supabase Auth SDK handles these flows; do not create custom password endpoints:
- `signUp({ email, password })` — only if self-registration is enabled; otherwise admin/invite flow.
- `signInWithPassword({ email, password })`
- `signOut()`
- `resetPasswordForEmail(email, { redirectTo })`
- `updateUser({ password })` after validated reset.
- `getSession()` / `onAuthStateChange()` for session handling.

Profile APIs:
- `GET /rest/v1/profiles?id=eq.<current-user-id>&select=*` — own profile only under RLS.
- `PATCH /rest/v1/profiles?id=eq.<current-user-id>` — allow-listed profile fields only under RLS.
Do not let clients patch role fields or arbitrary profile IDs.

## 3. Public read endpoints
These may be implemented with Supabase REST queries protected by public-read RLS policies, or through read-only Edge Functions.

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/rest/v1/domains?is_active=eq.true&order=sort_order.asc` | List active domains | Public |
| GET | `/rest/v1/teams?is_active=eq.true` | List public teams | Public |
| GET | `/rest/v1/events?status=eq.published&visibility=eq.public&order=starts_at.asc` | List public events | Public |
| GET | `/rest/v1/events?id=eq.<id>&status=eq.published` | Event detail | Public |
| GET | `/rest/v1/projects?status=eq.published&visibility=eq.public` | Public project list | Public |
| GET | `/rest/v1/news_articles?status=eq.published&order=published_at.desc` | Published articles | Public |
| GET | `/rest/v1/announcements?status=eq.published&audience=eq.public` | Public announcements | Public |
| GET | `/rest/v1/resources?status=eq.published&audience=eq.public` | Public resources | Public |
| GET | `/rest/v1/project_media?project_id=eq.<id>` | Project media metadata | Public only for published projects |

Use explicit `select` columns. Avoid `select=*` on public queries if the table includes private or operational columns. For public-facing projects, consider a view containing only safe published fields.

## 4. Public write endpoints (Edge Functions)
These must validate inputs server-side, rate-limit abuse, and avoid broad anonymous insert policies.

### `POST /functions/v1/register-event`
Request:
```json
{
  "event_id": "uuid",
  "full_name": "Student Name",
  "email": "student@example.edu",
  "phone": "optional",
  "college": "College Name",
  "academic_year": 2,
  "branch": "Mechanical Engineering",
  "domain_interest": "Robotics",
  "participation_type": "team",
  "team_name": "optional",
  "team_details": { "members": ["Name 1", "Name 2"] }
}
```
Success `201`:
```json
{
  "registration_id": "uuid",
  "status": "registered",
  "message": "Registration received."
}
```
Errors: `400 VALIDATION_ERROR`, `404 EVENT_NOT_FOUND`, `409 REGISTRATION_CLOSED_OR_DUPLICATE`, `429 RATE_LIMITED`.

Rules: event must be published and public; registration window must be open; capacity must be checked transactionally; normalize email; protect against duplicates; do not reveal other registrants.

### `POST /functions/v1/submit-recruitment`
Request includes cycle ID, name, email, phone, branch/year, domain/team preferences, motivation and optional portfolio URL.
Success: `201` with application confirmation/reference. Do not return evaluation data.
Rules: recruitment cycle must be open; rate-limit; validate URLs and lengths; prevent duplicate applications per cycle/email; store private data.

### `POST /functions/v1/submit-contact`
Optional contact form. Validate length, rate-limit, protect against spam and store only necessary information.

## 5. Authenticated member endpoints
| Method | Path | Purpose | Authorization |
|---|---|---|---|
| GET | `/rest/v1/profiles?id=eq.<self>` | Own profile | Member |
| PATCH | `/rest/v1/profiles?id=eq.<self>` | Edit allowed own fields | Member |
| GET | `/rest/v1/member_domains?member_id=eq.<self>` | Own domain memberships | Member |
| GET | `/rest/v1/team_members?member_id=eq.<self>` | Own team memberships | Member |
| POST | `/functions/v1/submit-event-proposal` | Submit event proposal | Member |
| POST | `/functions/v1/submit-project` | Submit project | Member |
| GET | `/rest/v1/event_registrations?email=eq.<verified-email>` | Own public registration, only with safe verification design | Do not expose via email filter alone |
| GET | `/rest/v1/notifications?user_id=eq.<self>` | Own notifications | Member |
| PATCH | `/rest/v1/notifications?id=eq.<id>` | Mark own notification read | Member |

Avoid allowing members to enumerate profiles or registrations by changing query parameters.

## 6. Leadership and admin workflows
Implement sensitive operations as Edge Functions or tightly protected database RPCs. Do not expose unrestricted updates of status columns.

| Method | Logical endpoint | Purpose | Authorization |
|---|---|---|---|
| GET | `manage/members` | Search member directory | Lead scope / VP / President |
| PATCH | `manage/members/:id/status` | Activate/deactivate membership | Authorized leadership |
| POST | `manage/roles` | Assign/remove global role | Trusted role manager |
| POST | `manage/events/:id/lead-decision` | Lead approve/reject/request changes | Assigned lead |
| POST | `manage/events/:id/final-decision` | Final decision | President/VP as policy defines |
| POST | `manage/events/:id/publish` | Publish approved event | Authorized publisher |
| POST | `manage/events/:id/cancel` | Cancel event and notify registrants | Authorized organizer |
| GET | `manage/events/:id/registrations` | Registration roster | Assigned organizers/leadership |
| POST | `manage/attendance/check-in` | Manual/QR check-in | Authorized event staff |
| POST | `manage/projects/:id/review` | Approve/reject project | Assigned reviewer/leadership |
| GET | `manage/recruitment/applications` | Application queue | Assigned recruitment reviewers |
| POST | `manage/recruitment/:id/decision` | Record decision | Authorized reviewer/leadership |
| POST | `manage/competitions/:id/results` | Enter results | Competition organizer |
| POST | `manage/competitions/:id/publish-results` | Publish leaderboard | Authorized leadership |
| POST | `manage/announcements` | Create/publish notice | Based on audience and role |
| GET | `manage/reports/attendance` | Attendance report | Authorized leadership |
| GET | `manage/audit-logs` | Audit history | Restricted |

The logical paths above are an application contract, not built-in Supabase routes. Name deployed Edge Functions consistently, validate every request, and document the actual deployed URLs in the frontend API client.

## 7. Event proposal payload
```json
{
  "title": "Intro to Robotics Workshop",
  "summary": "A hands-on introduction to sensors and control.",
  "description": "Full event plan...",
  "event_type": "workshop",
  "venue": "Innovation Lab",
  "starts_at": "2026-11-10T09:00:00Z",
  "ends_at": "2026-11-10T12:00:00Z",
  "capacity": 60,
  "assigned_team_id": "uuid"
}
```
The server sets `created_by` from the session. The browser must not choose the proposer ID or mark its own event approved/published.

## 8. Project submission payload
```json
{
  "title": "Low-Cost Smart Irrigation",
  "summary": "Prototype that measures soil moisture.",
  "description": "Project details...",
  "hardware_details": "Sensor, microcontroller, pump",
  "software_details": "Firmware and dashboard",
  "repository_url": "https://example.com/repository",
  "demo_url": "https://example.com/demo",
  "domain_ids": ["uuid"],
  "contributors": [{ "member_id": "uuid", "contribution_role": "Hardware" }]
}
```
Validate that the submitter is permitted to add each contributor, or require contributor acceptance. Review before public publication.

## 9. Status codes
- `200 OK`: successful read/update
- `201 Created`: successful creation
- `204 No Content`: successful deletion/archive with no body
- `400 Bad Request`: malformed or invalid input
- `401 Unauthorized`: missing/invalid session where required
- `403 Forbidden`: authenticated but not permitted
- `404 Not Found`: record absent or not visible
- `409 Conflict`: duplicate or invalid state transition
- `422 Unprocessable Entity`: semantically invalid data, if used consistently
- `429 Too Many Requests`: rate limit
- `500 Internal Server Error`: generic failure, details logged privately

## 10. API implementation checklist
- Define schemas with Zod on both client and server.
- Enforce authorization in RLS and Edge Functions.
- Use transactions/RPC for capacity checks, duplicate prevention and state transitions.
- Add pagination and filters to list endpoints.
- Return minimal data; never leak internal notes.
- Log correlation IDs and sensitive decisions.
- Add integration tests for anonymous, member, lead, VP and President access.
