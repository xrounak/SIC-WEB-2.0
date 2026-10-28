# 03 — Pages and Routes

Route names are proposals. Implement guards in the frontend for UX, but rely on RLS/server checks for actual authorization.

## Public routes
| Route | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/about` | About SIC, mission, governance | Public |
| `/domains` | Domains and disciplines | Public |
| `/teams` | Teams overview | Public |
| `/leadership` | Leadership profiles | Public; only approved fields |
| `/events` | Published events | Public |
| `/events/:slug` | Event detail and registration | Public |
| `/projects` | Project gallery | Public |
| `/projects/:slug` | Project detail | Public |
| `/achievements` | Achievements and gallery | Public |
| `/news` | SIC articles and curated links | Public |
| `/news/:slug` | Article detail | Public |
| `/resources` | Public learning resources | Public |
| `/join` | Recruitment overview/application | Public |
| `/contact` | Contact/social links | Public |
| `/privacy` | Privacy policy | Public |
| `/terms` | Terms of use | Public |

## Authentication routes
| Route | Page |
|---|---|
| `/login` | Sign in |
| `/forgot-password` | Request reset |
| `/reset-password` | Set new password |
| `/auth/callback` | Authentication callback, if needed |

## Member portal
| Route | Page |
|---|---|
| `/portal` | Member dashboard |
| `/portal/profile` | Edit own profile |
| `/portal/teams` | My teams |
| `/portal/domains` | My domains |
| `/portal/events` | My registrations and event participation |
| `/portal/proposals/events/new` | Submit event proposal |
| `/portal/projects` | My projects |
| `/portal/projects/new` | Submit project |
| `/portal/announcements` | Internal notices |
| `/portal/notifications` | Notifications |
| `/portal/resources` | Member resources |
| `/portal/attendance` | Own attendance summary |

## Leadership/admin portal
| Route | Page |
|---|---|
| `/manage` | Operations dashboard |
| `/manage/members` | Member directory and status |
| `/manage/members/:id` | Member details, limited by role |
| `/manage/roles` | Role assignment (restricted) |
| `/manage/teams` | Team management |
| `/manage/domains` | Domain management |
| `/manage/events` | Event queue and event management |
| `/manage/events/:id` | Event details, approvals, registrations |
| `/manage/attendance` | Attendance sessions and records |
| `/manage/projects` | Project review and publishing |
| `/manage/recruitment` | Application pipeline |
| `/manage/recruitment/:id` | Private application review |
| `/manage/competitions` | Competition setup and results |
| `/manage/announcements` | Publish public/internal notices |
| `/manage/news` | Article and source management |
| `/manage/resources` | Resource management |
| `/manage/reports` | Operational reports |
| `/manage/audit-log` | Audit events; restricted |

## Page requirements
- Every list needs loading, empty, error and pagination states.
- Every mutation needs success/failure feedback.
- Forms need inline validation and server error handling.
- Use slugs for public-facing URLs and UUIDs internally.
- Hide unavailable actions in the UI, but never treat hidden buttons as authorization.
- Avoid putting personal email, phone, recruitment notes or attendance details in public pages.
