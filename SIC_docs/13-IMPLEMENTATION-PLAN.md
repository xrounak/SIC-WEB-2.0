# 13 — Implementation Plan (Deadline: under one week)

## Day 1 — Foundation
- Create React + TypeScript + Vite app.
- Configure Tailwind, React Router, Supabase client and linting.
- Create initial SQL migrations and development seed data.
- Implement auth and role model.
- Write and test RLS before building admin features.

## Day 2 — Public website
- Header/footer, home, about, domains, events list/detail, projects, join, contact.
- Responsive layout and realistic content.
- Public reads restricted to published records.

## Day 3 — Auth and portal
- Login/reset flows.
- Profile page, member dashboard, teams/domains.
- Role-aware navigation.
- Test private profile and membership access.

## Day 4 — Event workflow
- Proposal form, lead review, final approval and publication.
- Public registration Edge Function.
- Registration confirmation and organizer roster.
- Test duplicates, closed event and capacity race conditions.

## Day 5 — Projects and recruitment
- Project submission/review/gallery.
- Recruitment cycle/application form.
- Private reviewer queue and decisions.
- Add announcements and basic notifications if time permits.

## Day 6 — QA and deployment
- Complete RLS matrix tests.
- Test forms, mobile, loading/error/empty states.
- Deploy production site and configure domain.
- Verify auth redirects, HTTPS and production functions.
- Run smoke tests using anonymous, member, lead and President/VP accounts.

## Day 7 — Buffer
- Fix critical bugs, content, accessibility and mobile issues.
- Add PWA basics if core flows are stable.
- Document handover and account ownership.

## Defer if behind schedule
- Automated external news feed, QR scanning UI, certificate generation, advanced analytics and complex contribution scoring.

## Never defer
- RLS policies, server-side validation, secret management, role authorization, privacy controls and testing of public registration.
