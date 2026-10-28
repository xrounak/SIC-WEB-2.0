# 10 — Notifications

## Channels
- In-app notifications: database-backed `notifications` table.
- Email: provider integrated through a server-side Edge Function.
- Website announcements: public/member content lists.

## Trigger matrix
| Trigger | Recipient | Channel |
|---|---|---|
| Public event registration accepted | Registrant | Email, if configured |
| Registration waitlisted | Registrant | Email |
| Event date/venue changed | Registrants | Email + in-app for members |
| Event proposal needs changes | Proposer | In-app/email |
| Proposal approved/rejected | Proposer | In-app/email |
| Recruitment status changes | Applicant | Email, only if configured |
| Member receives a notice | Relevant audience | In-app |
| Competition results published | Entrants/members | In-app/email as configured |
| Certificate issued | Recipient | Email or portal link |

## Implementation
- Keep email API keys on the server only.
- Use templates with club branding and plain-text fallback.
- Queue/retry delivery where possible; notification failure must not undo a committed approval or registration.
- Use idempotency keys to prevent duplicate sends.
- Do not send internal evaluation notes or private rosters.
- Respect unsubscribe/preferences for non-essential mail; essential transactional email should follow applicable policy.
- Log delivery status, provider message ID and safe error details.
