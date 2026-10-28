# 12 — Deployment and Operations

## Environment variables
Frontend `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```
These frontend values are public by design; database RLS must be correct. Do not add service-role keys, SMTP secrets or private API keys to `VITE_*` variables.

Server/Edge Function secrets are configured in the Supabase project secret manager, not committed to Git.

## First deployment
1. Create a GitHub repository and commit the scaffold.
2. Create a Supabase project.
3. Add SQL migrations to `supabase/migrations/`.
4. Apply migrations in a development project first.
5. Enable RLS and review policies table by table.
6. Configure storage buckets and storage policies.
7. Configure Auth site URL and redirect URLs for localhost and production domain.
8. Create the first trusted administrator through a secure one-time process.
9. Deploy the frontend to Vercel or equivalent.
10. Add the purchased domain using the hosting provider's current DNS instructions.
11. Verify HTTPS, redirects, favicon, PWA manifest and mobile layout.
12. Run the authorization and registration smoke tests against production.
13. Record who owns the domain, hosting, database and recovery email.

## Suggested scripts
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run test`

## Backups and maintenance
- Confirm database backup availability and recovery process.
- Export migrations to Git; never rely on dashboard-only schema changes.
- Rotate exposed secrets immediately.
- Review privileged accounts each term.
- Archive old events and recruitment cycles.
- Monitor storage usage, Edge Function errors and email failures.
- Keep dependencies updated and test before deploying.
