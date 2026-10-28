# SIC Nexus

Website and member/admin portal for the Science & Innovation Club.
Next.js 16 (App Router) on Vercel, Supabase (Postgres, Auth, Storage).

Design blueprint (schema, routes, flows): [`SIC_docs/00-BLUEPRINT.html`](SIC_docs/00-BLUEPRINT.html)

## How it fits together

- **Reads** run in Server Components through `@supabase/ssr` as the signed-in user. Row Level Security decides what comes back.
- **Writes that matter** (registration, approvals, roles, recruitment decisions) are Postgres functions in `supabase/migrations/*_workflows.sql`, called with `supabase.rpc(...)` from Server Actions. Each checks permissions, validates the state change, and writes the audit log and outgoing emails in the same transaction.
- **Errors** from those functions are stable codes such as `EVENT_FULL`. `src/lib/rpc-errors.ts` maps them to user-facing copy.
- **Emails and Telegram alerts** are queued in `email_outbox` and sent by a server worker using the secret key. A failed send never undoes a registration or approval.
- `src/proxy.ts` refreshes the session and redirects signed-out visitors away from `/portal`, `/manage`, `/onboarding` and `/join/apply`. That is only UX; the database enforces access.

## Setup

1. `npm install`
2. Create a Supabase project. Copy `.env.example` to `.env.local` and fill in the URL and keys.
3. Link and apply migrations:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npm run db:push
   ```
4. Load reference data: run `supabase/seed.sql` in the Supabase SQL editor.
5. Generate types: `npm run db:types`
6. Auth settings in the Supabase dashboard:
   - Site URL: your production URL. Redirect URLs: `http://localhost:3000/**` and the production URL.
   - Enable Google, Email (magic link / OTP) and Email + password.
   - Email templates: point links at `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...`
7. Make the first admin. After signing in once, run in the SQL editor:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from public.profiles where email = 'you@gmail.com';
   ```
   Then assign President / VP from `/manage/roles`.
8. `npm run dev`

## Frontend: two layers

**Layer 1, base UI (permanent).** Semantic tokens in `src/app/globals.css` (`--color-bg`, `--color-primary`, …), UI kit in `src/components/ui`, shells in `src/components/layout`. Shared components never use seasonal colours. Inter for body text, 1200px content width, breakpoints 480/768/1024/1280. Route groups:

| Area | Folder | Who |
|---|---|---|
| Public site | `src/app/(site)` | Everyone |
| Sign-in, onboarding | `src/app/(auth)` | Everyone |
| Portal | `src/app/portal` | Any signed-in account; member sections unlock for members |
| Manage | `src/app/manage` | Team leads, VP, President, faculty, admin |

**Layer 2, seasonal themes (interchangeable).** Each theme has its own folder in `src/seasonal/themes/` with `theme.json` (colours, fonts, motion), `overlay.tsx` (decorations), `artifacts.ts` (objects that fly across the screen) and `assets/` (their SVGs). Visitors switch themes from the header; the choice is kept in `localStorage` (`sic-active-theme`). See [`src/seasonal/README.md`](src/seasonal/README.md) for the folder layout, how to swap in your own artifact SVGs, and how to add a theme.

**Landing page.** A bold text-only hero, a pinned horizontal scroll through the domains (driven by the mouse wheel or touch), and scroll-linked reveals. A blurred ambient light layer (`src/components/layout/ambient-backdrop.tsx`) drifts behind every page in the active theme's colours. All motion is CSS transforms plus one passive scroll listener, and turns off for reduced-motion users.

## Background jobs

`vercel.json` schedules `/api/cron/outbox` (sends queued email/Telegram, every 5 min) and `/api/cron/maintenance` (team reminders and auto-withdrawal, invite expiry, completing past events, hourly). Both need `CRON_SECRET`, `SUPABASE_SECRET_KEY` and `RESEND_API_KEY` in Vercel. Vercel's Hobby plan only runs crons once a day; on Hobby, call both URLs from Supabase `pg_cron` + `pg_net` (or any external scheduler) with the `Authorization: Bearer $CRON_SECRET` header instead.

## Before launch

- Replace the placeholder contact handles in `src/app/(site)/contact/page.tsx`.
- Review the privacy and terms copy with the club and college.
- Add the club's domain to Resend and set `EMAIL_FROM`.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:test` | Runs every migration in PGlite with stubbed Supabase auth, then checks workflows and RLS as different users. No Docker needed. |
| `npm run db:push` | Apply migrations to the linked Supabase project |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` |

## Rules

- Never put the secret key, email API key or bot token in a `NEXT_PUBLIC_` variable.
- Every schema change is a new file in `supabase/migrations/`. Never change the schema only in the dashboard.
- Status columns change only through workflow functions. Do not grant clients `update` on them.
