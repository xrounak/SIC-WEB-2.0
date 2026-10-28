# 11 — Testing Strategy

## Unit tests
- Zod schemas for events, projects, recruitment and registration.
- Date/time window validation.
- Status transition rules.
- Utility functions: slug generation, email normalization, permission checks.

## Integration tests
- Public reads return published public content only.
- Registration rejects closed events, duplicates and invalid fields.
- Capacity and waitlist behavior under concurrent submissions.
- Member can edit only permitted profile fields.
- Leads can only review assigned scope.
- President/VP approval gates are enforced.
- Recruitment evaluations are private.
- Storage policies prevent unauthorized file access.

## End-to-end scenarios
1. Visitor opens event page and registers successfully.
2. Duplicate registration is rejected safely.
3. Member logs in and submits an event proposal.
4. Lead requests changes; proposer updates and resubmits.
5. VP/President approves; event is published.
6. Member submits project; reviewer publishes it.
7. Recruitment applicant submits form; reviewer evaluates privately.
8. Authorized staff records QR/manual attendance.
9. Unauthorized member attempts admin action and is denied.
10. Mobile navigation and key forms work on narrow screens.

## Release gates
- TypeScript build passes.
- Lint passes.
- No secrets in repository or browser bundle.
- RLS test matrix passes.
- Keyboard navigation and form labels checked.
- Production environment variables set.
- Database migration and rollback/forward-fix plan documented.
- Mobile smoke test completed.
