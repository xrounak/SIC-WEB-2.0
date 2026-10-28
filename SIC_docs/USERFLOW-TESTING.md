# SIC-WEB 2.0 — User flow test plan

Manual test script for every role. Work top to bottom: later sections depend on
data created in earlier ones (an event proposed by the member is reviewed by the
lead, then the president, then registered for by a student).

Mark each step `[x]` pass or write what went wrong next to it.

---

## 0. Setup (once)

### 0.1 Test accounts

Gmail ignores everything after `+`, so one inbox gives you many accounts.
Replace `yourname` with your Gmail name.

| # | Account | Email | Role to give it |
|---|---|---|---|
| A | Admin | `yourname+admin@gmail.com` | app role `admin` |
| B | President | `yourname+president@gmail.com` | app role `president` + member |
| C | Vice president | `yourname+vp@gmail.com` | app role `vice_president` + member |
| D | Faculty coordinator | `yourname+faculty@gmail.com` | app role `faculty_coordinator` |
| E | Team lead | `yourname+lead@gmail.com` | member, **lead** of Robotics |
| F | Member | `yourname+member@gmail.com` | member of Robotics |
| G | Member 2 | `yourname+member2@gmail.com` | member of Software |
| H | Student | `yourname+student@gmail.com` | none (just signs up) |
| I | Outsider | `yourname+outside@gmail.com` | none, not a GEC student |
| — | Guest | not signed in | — |

**Create them without email confirmation** (Supabase's free mailer sends only a
few emails per hour):

1. Supabase dashboard → **Authentication → Users → Add user → Create new user**.
2. Enter the email and a test password, tick **Auto Confirm User**, then click **Create user**.
3. Repeat for A–I.

Use a separate browser profile or a private window per account, so you can stay
signed in as several people at once.

### 0.2 Onboard everyone once

Sign in as each of A–I at `/login` (email + password) and finish `/onboarding`.
Answer "GEC student: yes" with a roll number for everyone except **I**, who
answers "no".

### 0.3 Give roles (Supabase → SQL Editor)

Run after step 0.2 (the profiles must exist). Replace `yourname`.

```sql
-- Members + verified students
update public.profiles
set member_status = 'member', student_status = 'verified'
where email in (
  'yourname+president@gmail.com', 'yourname+vp@gmail.com',
  'yourname+lead@gmail.com', 'yourname+member@gmail.com', 'yourname+member2@gmail.com'
);

-- App roles
insert into public.user_roles (user_id, role)
select p.id, v.role::public.app_role
from (values
  ('yourname+admin@gmail.com', 'admin'),
  ('yourname+president@gmail.com', 'president'),
  ('yourname+vp@gmail.com', 'vice_president'),
  ('yourname+faculty@gmail.com', 'faculty_coordinator')
) as v (email, role)
join public.profiles p on p.email = v.email
on conflict do nothing;

-- Teams
insert into public.team_members (team_id, member_id, team_role)
select t.id, p.id, v.team_role
from (values
  ('robotics', 'yourname+lead@gmail.com', 'lead'),
  ('robotics', 'yourname+member@gmail.com', 'member'),
  ('software', 'yourname+member2@gmail.com', 'member')
) as v (team, email, team_role)
join public.teams t on t.slug = v.team
join public.profiles p on p.email = v.email
on conflict do nothing;

-- Check
select p.email, p.member_status, p.student_status,
       array_agg(distinct r.role) filter (where r.role is not null) as roles,
       array_agg(distinct t.slug || ':' || tm.team_role) filter (where tm.team_id is not null) as teams
from public.profiles p
left join public.user_roles r on r.user_id = p.id
left join public.team_members tm on tm.member_id = p.id
left join public.teams t on t.id = tm.team_id
where p.email like 'yourname+%'
group by p.email, p.member_status, p.student_status
order by p.email;
```

Sign out and back in on every account after this so the new roles load.

---

## 1. Permission matrix (what each role should see)

| Area | Guest | Student H | Outsider I | Member F/G | Lead E | VP C | President B | Faculty D | Admin A |
|---|---|---|---|---|---|---|---|---|---|
| Public pages (`/`, `/events`, `/projects`, `/domains`, `/about`, `/join`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/portal` | → login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register for a public event | → login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Members-only event / notices / teams | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | — | — |
| Propose event / submit project | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Apply in recruitment (`/join/apply`) | → login | ✅ | ✅ | ❌ already member | ❌ | ❌ | ❌ | — | — |
| `/manage` | → login | ❌ no-access | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lead-stage event review (own team) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Final-stage review (major events) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Publish / cancel event | ❌ | ❌ | ❌ | ❌ | ✅ own team | ✅ | ✅ | ❌ | ✅ |
| Review projects | ❌ | ❌ | ❌ | ❌ | ✅ own team | ✅ | ✅ | ❌ | ✅ |
| Verify students | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Recruitment final decision | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Teams & domains (`/manage/teams`) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Roles (`/manage/roles`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit log (`/manage/audit`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

Nobody can approve their **own** event or project, or review their **own**
recruitment application.

---

## 2. Guest (signed out)

- [ ] `/` loads: hero art for the active theme, domains scroll horizontally with the mouse wheel and on a phone.
- [ ] Theme switcher in the header changes the theme instantly and remembers it after reload.
- [ ] `/events`, `/projects`, `/domains`, `/domains/robotics`, `/about`, `/contact`, `/privacy`, `/terms` all load.
- [ ] Open a published event → **Register** says you'll sign in first; clicking it goes to `/login?next=…`.
- [ ] `/portal`, `/manage`, `/join/apply` each redirect to `/login`.
- [ ] Mobile menu opens full screen and every link works.

## 3. Sign-in and onboarding (use account H)

- [ ] `/login` with password works and lands on `/onboarding` the first time.
- [ ] Wrong password shows a clear error.
- [ ] Magic link / OTP: sends a code (Supabase mailer, may be rate-limited).
- [ ] `/forgot-password` → reset email → `/reset-password` sets a new password.
- [ ] Onboarding requires name and roll number; after saving you land on `/portal`.
- [ ] `/portal/profile` edits save; roll number is locked once verified.
- [ ] Sign out from the header returns to the public site.

## 4. Student H (not a member)

- [ ] `/portal` shows registrations, applications and notifications only (no team tools).
- [ ] Register for a published **individual** event → seats left drops by 1 → appears in `/portal/registrations`.
- [ ] Withdraw that registration → status becomes cancelled and the seat returns.
- [ ] Members-only event is not listed and its URL returns 404.
- [ ] `/portal/proposals/new` and `/portal/projects/new` are refused (members only).
- [ ] `/manage` redirects to `/portal` with a "no access" notice.
- [ ] Apply at `/join/apply` (when a cycle is open) → application appears in `/portal/applications` as **submitted**. Keep it for section 9.

## 5. Outsider I (not a GEC student)

- [ ] Can register for public events.
- [ ] Profile shows **external**; cannot be verified as a student.
- [ ] Recruitment apply: allowed or blocked as per club rule — note what happens.

## 6. Member F

- [ ] `/portal` now shows teams and notices; `/portal/teams` lists Robotics.
- [ ] Members-only events and notices are visible.
- [ ] **Propose an event:** `/portal/proposals/new` → owner team Robotics, fill everything → save draft → submit → status **pending review**. Keep it for section 7.
- [ ] While pending, editing is locked.
- [ ] **Submit a project:** `/portal/projects/new` → add F and G as contributors → submit → status **submitted**.
- [ ] Member directory search (portal) finds other members, but not private details like phone.
- [ ] `/manage` is refused.

## 7. Team lead E (Robotics)

- [ ] `/manage` opens; nav shows Inbox, Events, Projects, Recruitment, Members, Announcements; **no** Teams, Roles or Audit.
- [ ] Inbox lists F's event proposal.
- [ ] **Request changes** with a note → F sees **changes requested** with the note, edits, resubmits.
- [ ] **Approve at lead stage** without "major" → status **lead approved** → **Publish** works → the event is live on `/events`.
- [ ] Repeat with a second proposal from F, this time tick **major** → status **lead approved**, Publish is **not** allowed yet (goes to the president/VP).
- [ ] An event owned by Software (G's team) cannot be reviewed by E.
- [ ] E's own proposal cannot be approved by E (try it: E proposes, opens it in manage, approve is refused).
- [ ] **Projects:** start review on F's project → approve → it appears on `/projects`; contributors F and G confirm their credit in `/portal/projects`.
- [ ] **Members:** verify student H → H's profile shows verified.
- [ ] **Announcements:** post a Robotics team notice → F sees it, G does not.

## 8. Vice president C / President B

- [ ] Nav also shows **Teams & domains**; B also sees **Audit log**.
- [ ] Final-review the **major** event from section 7 → approve → **final approved** → publish → live.
- [ ] Reject another proposal with a note → F sees **rejected**.
- [ ] Cancel a published event with a reason (≥ 5 characters) → page shows "This event was cancelled", registrations closed.
- [ ] `/manage/teams`: add G to Robotics as deputy, then remove.
- [ ] Club-wide announcement → visible to all members.
- [ ] Cannot open `/manage/roles` (admin only).

## 9. Recruitment (B or C, plus a reviewer)

- [ ] `/manage/recruitment`: create a cycle (open now, closes next week), assign E as reviewer.
- [ ] H applies (section 4).
- [ ] As E: move H's application **submitted → screening → shortlisted → interview**, add a score and private notes.
- [ ] H sees the status change in `/portal/applications` but **never** the private notes or scores.
- [ ] As B: **select** H → H's member status becomes member (sign H out and in: team tools appear).
- [ ] Try a skipped transition (e.g. submitted → interview) → refused.
- [ ] H can withdraw an application before a decision.

## 10. Faculty coordinator D

- [ ] `/manage` opens with read access to events, projects, recruitment, members.
- [ ] Approve/publish buttons are refused (read-only role).
- [ ] No Teams, Roles or Audit links.

## 11. Admin A

- [ ] `/manage/roles`: give G the `vice_president` role → G (after re-login) sees VP tools. Revoke it → gone.
- [ ] `/manage/audit` lists the actions done above (reviews, publish, verify, role change) with actor and time.
- [ ] Admin can publish/cancel events and review projects.
- [ ] Admin is **not** a member: proposing an event or project is refused unless you also make A a member.

## 12. Team events (leader + teammates)

> **Blocked for now.** Teammates join through an invite link that was only sent by
> email, and email sending is turned off. Test this after Telegram or a
> "copy invite link" button is added.

- [ ] (later) F registers a team event, invites G and H by email.
- [ ] (later) G accepts the invite → team grows; team below minimum shows "incomplete".
- [ ] (later) Leader withdraws → whole team withdrawn, pending invites cancelled.

## 13. Direct-database security checks (optional)

The UI hides things, but the database is the real guard. In Supabase
**SQL Editor**, act as member F and try things F must not do:

```sql
begin;
select set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where email = 'yourname+member@gmail.com'), 'role', 'authenticated')::text, true);
set local role authenticated;

select count(*) from public.recruitment_evaluations;   -- expect 0 (private to reviewers)
select count(*) from public.audit_logs;                -- expect 0
insert into public.user_roles (user_id, role)          -- expect permission error
  select id, 'admin' from public.profiles where email = 'yourname+member@gmail.com';
rollback;
```

The `rollback` makes sure nothing sticks. After an error, run `rollback;` alone.

## 14. Themes and devices

- [ ] Each theme (Diwali, Christmas, Independence Day, Regular): cursor + trail, artifacts fly by, hero art (Diwali, Regular) or text title.
- [ ] Regular: robot arms in the corners (screens ≥ 1360 px), car drives along the bottom.
- [ ] Windows "reduce motion" on → decorations stop moving, site still usable.
- [ ] Phone width (375 px): no horizontal scroll, menu works, forms usable.
- [ ] 2560×1440 monitor: text and layout scale up, nothing tiny.

---

## Clean up after testing

```sql
-- Removes the test accounts and everything they own (cascades).
delete from auth.users where email like 'yourname+%@gmail.com';
```

Check the result before running it on a project that has real users.
