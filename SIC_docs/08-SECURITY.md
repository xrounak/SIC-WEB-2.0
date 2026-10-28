# 08 — Security, Privacy and Data Governance

## Non-negotiable rules
- Enable RLS on every table exposed through Supabase APIs.
- Default to deny; add narrow policies only for required operations.
- Never put `service_role`, SMTP passwords or other server secrets in `VITE_*` variables.
- Never trust user ID, role, reviewer ID, approval state or ownership supplied by the browser.
- Never expose recruitment evaluations, private contact details, attendance rosters or audit logs publicly.
- Public registration must use a validated server-side function; avoid permissive anonymous insert policies.

## RLS policy design
For each table, define separately:
1. SELECT policy
2. INSERT policy
3. UPDATE policy
4. DELETE policy (prefer archive instead)

Typical patterns:
- Public may SELECT only published public content.
- Members may SELECT/update their own profile, with an allow-list of editable columns enforced by server/database design.
- Members may SELECT their own memberships and notifications.
- Leads may access records only within assigned teams.
- VP/President access follows club policy.
- Role changes are performed only by a trusted role manager.
- Recruitment tables are visible only to authorized reviewers.
- Audit logs are append-only and inaccessible to ordinary members.

Do not assume a frontend route guard or a hidden button is security.

## Public registration abuse controls
- Rate limit by IP and event where possible.
- Validate all fields and cap string lengths.
- Normalize email.
- Use bot mitigation/CAPTCHA if abuse occurs.
- Use idempotency/duplicate protection.
- Check event capacity transactionally.
- Avoid exposing whether a specific person has registered, unless verified.
- Store only the personal data required to run the event.

## File storage
- Use separate buckets/prefixes for public assets and private documents.
- Validate file type and size.
- Use random storage names; do not trust user filenames.
- Public bucket only for explicitly approved public media.
- Private documents should use signed URLs with short expiry.
- Do not upload student IDs, applications or private spreadsheets into public buckets.
- Define deletion/retention policy.

## Privacy and consent
- Public member profiles are opt-in.
- Email, phone, student ID and private notes remain hidden.
- Obtain permission before publishing photos/videos where required by college policy.
- Recruitment forms explain purpose, access, retention and contact for correction/deletion requests.
- Restrict exports and log them.
- Keep an incident response contact and backup plan.

## Audit events
Log at minimum: role changes, event decisions, publication/cancellation, recruitment decisions, attendance corrections, result changes, data exports and destructive actions.

## Security launch tests
- Anonymous cannot read unpublished events/projects.
- Anonymous cannot query profiles or registrations.
- Member A cannot read Member B's private data.
- A lead cannot manage an unassigned team.
- Member cannot approve/publish own proposal.
- Recruitment reviewer cannot access applications outside their assignment.
- Browser cannot set global role or final approval status.
- Service secrets are absent from frontend bundles and Git history.
