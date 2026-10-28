# 07 — Business Workflows

## Event lifecycle
`draft → pending_review → lead_approved → final_approved → published → completed → archived`
Alternative outcomes: `changes_requested`, `rejected`, `cancelled`.

1. Member creates a proposal.
2. Assigned lead reviews scope, feasibility, schedule, venue, budget/resources if applicable.
3. Lead approves, rejects or requests changes.
4. Important events proceed to VP/President final review.
5. Authorized publisher publishes only after required approvals.
6. Public event page and registration open according to configured dates.
7. Organizers monitor registrations and capacity.
8. Attendance is recorded by QR or authorized manual entry.
9. Event is completed; results, photos and achievements may be published after consent/review.
10. Event is archived, retaining operational records.

Use a server-side state transition function. Never accept arbitrary `status` updates from the browser.

## Public registration
1. Validate required fields and consent.
2. Verify event exists, is public/published and registration is open.
3. Normalize email and enforce duplicate rules.
4. Check capacity in a transaction; place registration or waitlist appropriately.
5. Return a confirmation reference.
6. Send confirmation email when configured.
7. Never return the complete roster to the public.

## Recruitment lifecycle
`submitted → screening → shortlisted → interview → selected/rejected/waitlisted`
- Applications are private.
- Evaluators have assigned access only.
- Record evaluation stage, reviewer, decision and timestamp.
- Store internal notes separately from applicant-visible status.
- Publish a privacy notice and a retention/deletion policy.
- Send only appropriate status updates; never email private reviewer notes.

## Project lifecycle
`draft → submitted → in_review → published/rejected → archived`
- Submitter lists contributors and domains.
- Reviewer checks claims, media rights, safety and public information.
- Contributors should confirm their association if profiles are public.
- Public page includes only approved fields and media.

## Attendance
- Create a session for an event and a short-lived/event-scoped QR token.
- QR scan sends token and registration/member reference to a trusted function.
- Server validates token, event/session window, duplicate status and staff permission.
- Manual check-in requires a staff identity and audit record.
- Do not put private participant data inside the QR code.
- Allow authorized correction with audit trail.

## Competition results
1. Organizer defines rules/scoring.
2. Entries are accepted and validated.
3. Judges submit scores.
4. Authorized staff review ties and corrections.
5. Leadership approves publication if required.
6. Publish only intended fields (rank, public name/team, score if appropriate).
7. Issue certificates and retain certificate codes.

## Announcements
- Author chooses public, all members or a specific team audience.
- Server checks publish permission for that audience.
- Save the announcement first; notification delivery may retry separately.
- Track notification delivery failures without duplicating announcements.
