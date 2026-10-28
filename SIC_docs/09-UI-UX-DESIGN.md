# 09 — UI/UX and Design System

## Design goals
Minimal, professional, engineering-focused and approachable. The visual language should represent science, making, research and interdisciplinary collaboration rather than only software.

## Navigation
Public desktop navigation: Home, About, Domains, Events, Projects, News, Resources, Join SIC, Contact.
Member navigation: Dashboard, My Teams, Projects, Events, Attendance, Announcements, Resources, Profile.
Admin navigation: Overview, Members, Teams/Domains, Event Queue, Projects, Recruitment, Competitions, Content, Reports, Audit.

On mobile, use a compact menu and clear primary action. Do not cram every admin link into the top bar.

## Reusable components
- `AppShell`, `PublicHeader`, `PublicFooter`
- `PortalSidebar`, `MobileNavigation`
- `Button`, `Input`, `Textarea`, `Select`, `Checkbox`
- `FormField`, `FormError`, `ConfirmDialog`
- `Badge`, `StatusBadge`, `Avatar`
- `EventCard`, `ProjectCard`, `NewsCard`, `AchievementCard`
- `DataTable`, `Pagination`, `SearchFilterBar`
- `EmptyState`, `LoadingSkeleton`, `ErrorState`, `Toast`
- `ApprovalTimeline`, `FileUploader`, `QRScanner` (later)

## UX rules
- Responsive at 320px width and above.
- Use semantic HTML, keyboard support and visible focus.
- Label every form input; don't rely on placeholder text alone.
- Confirm destructive actions and offer undo where feasible.
- Show status and next action clearly.
- Preserve form values after validation errors.
- Display dates in the user's locale but store timestamps in UTC.
- Compress images and provide alt text.
- Avoid animation that harms accessibility.
- Public pages should remain useful if optional news or analytics services fail.
- Include loading, empty, error, success and offline states where appropriate.

## Content rules
- Avoid fake statistics, invented partners and placeholder achievements on production.
- Mark sample data clearly in development.
- Every external news story should link to the original source and use a short summary rather than republishing the full article.
- Add photo consent and attribution fields where needed.
