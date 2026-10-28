# SIC Nexus — Technical Documentation

Version: 1.0  
Status: Proposed specification  
Product: Science and Innovation Club website + member/admin portal

## Purpose
SIC Nexus is the public website and internal management platform for an interdisciplinary college club. It supports engineering and science domains (mechanical, civil, electrical, electronics, robotics, IoT, AI/ML, software, and other disciplines) as well as operational teams such as Media, Management, and PR.

## Product surfaces
1. Public website: pages, events, projects, achievements, news, resources, recruitment, contact.
2. Member portal: profile, domain/team memberships, project proposals, event proposals, registrations, attendance, notices.
3. Leadership/admin portal: member approvals, event approvals, recruitment, attendance, competitions, content publishing, reports and audit history.

## Technology baseline
- React + TypeScript + Vite
- Tailwind CSS, React Router
- Supabase PostgreSQL, Auth, Storage, Edge Functions
- Zod + React Hook Form
- Vercel or equivalent static hosting
- Optional PWA via `vite-plugin-pwa`

## Important implementation boundary
Supabase's auto-generated REST API is available for database tables, but this document also defines logical application endpoints. Use Edge Functions or a small server API for sensitive workflows. Never expose the Supabase `service_role` key in the browser.

## MVP scope
Build first: public pages, authentication, role-aware portal, member/team/domain management, event proposal/approval/publication, public event registration, project showcase, announcements, and basic recruitment.
Build next: QR attendance, competition leaderboards, certificates, email automation, analytics and richer news aggregation.

## Related documents
- `01-PROJECT-OVERVIEW.md`
- `02-FEATURES.md`
- `03-PAGES-AND-ROUTES.md`
- `04-USER-ROLES-AND-PERMISSIONS.md`
- `05-DATABASE-SCHEMA.md`
- `06-API-SPECIFICATION.md`
- `07-WORKFLOWS.md`
- `08-SECURITY.md`
- `09-UI-UX-DESIGN.md`
- `10-NOTIFICATIONS.md`
- `11-TESTING.md`
- `12-DEPLOYMENT.md`
- `13-IMPLEMENTATION-PLAN.md`
