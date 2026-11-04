# Sign-in and roles

The site signs people in with **Google only**. There are no passwords, magic
links or email codes. A person's account is created the first time they sign
in. Roles (admin, president, member, team lead…) are given **in Supabase**, not
on the site.

Your Supabase project: `zybpkaqyolzmihqojzyo`
(`https://zybpkaqyolzmihqojzyo.supabase.co`).

---

## 1. Google sign-in setup

### 1.1 Google Cloud: create the OAuth client

1. Open <https://console.cloud.google.com/> and create a project (for example "SIC Website").
2. **APIs & Services → OAuth consent screen**
   - User type: **External**.
   - App name `SIC — GEC Palamu`, support email, developer email.
   - Scopes: keep the defaults (`openid`, `email`, `profile`).
   - While testing, add your own Gmail addresses under **Test users**. When the
     site is ready for everyone, click **Publish app** so any Google account can
     sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - your live site, e.g. `https://sic-gecpalamu.vercel.app`
   - **Authorized redirect URIs** (exactly this, it is Supabase's callback):
     - `https://zybpkaqyolzmihqojzyo.supabase.co/auth/v1/callback`
   - Click **Create** and copy the **Client ID** and **Client secret**.

### 1.2 Supabase: turn Google on

1. Supabase dashboard → **Authentication → Sign In / Providers → Google**.
2. Turn it **on**, paste the Client ID and Client secret, then click **Save**.
3. **Email provider → turn off** (same page). That stops anyone creating a
   password or email-code account through the API.

### 1.3 Supabase: allowed return URLs

**Authentication → URL Configuration**

- **Site URL**: your live site (use `http://localhost:3000` until you deploy).
- **Redirect URLs**, add:
  - `http://localhost:3000/auth/callback`
  - `https://<your-live-domain>/auth/callback`

### 1.4 The app

`.env.local` (and the same in Vercel → Project → Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://zybpkaqyolzmihqojzyo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon / publishable key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # your live URL in Vercel
```

Restart `npm run dev`, open `/login`, click **Continue with Google**. The first
sign-in creates the account and sends the person to `/onboarding` (name, phone,
branch, roll number).

**If it fails:**

| What you see | Fix |
|---|---|
| Google says `redirect_uri_mismatch` | The redirect URI in Google must be exactly `https://zybpkaqyolzmihqojzyo.supabase.co/auth/v1/callback`. |
| Back on `/login` with "Google sign-in didn't complete" | Add `…/auth/callback` for that domain to Supabase **Redirect URLs**, and check `NEXT_PUBLIC_SITE_URL`. |
| "Access blocked: app not verified / not a test user" | Add the Gmail under **Test users**, or publish the consent screen. |

---

## 2. Giving roles in Supabase

The person must **sign in once** first (that creates their row in
`public.profiles`). Then open Supabase → **SQL Editor**, paste one block, put in
their email and click **Run**.

The SQL Editor runs as the database owner, so these work even though the site's
own rules would block them. They do not write the site's audit log.

### What the roles mean

| Who | What to set | Can do |
|---|---|---|
| Member | `profiles.member_status = 'member'` | Members-only events and notices, propose events, submit projects |
| Team lead | member + `team_members.team_role = 'lead'` | Review and publish their team's events and projects, verify students |
| Vice president / President | app role `vice_president` / `president` (+ member) | Final approval for major events, recruitment decisions, teams |
| Faculty coordinator | app role `faculty_coordinator` | Read access to the manage area |
| Admin | app role `admin` | Everything in the manage area, including the audit log |

### Make someone a member (verified student)

```sql
update public.profiles
set member_status = 'member', student_status = 'verified'
where email = 'someone@gmail.com';
```

### Give an app role

Roles: `admin`, `president`, `vice_president`, `faculty_coordinator`.

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where email = 'someone@gmail.com'
on conflict do nothing;
```

### Remove an app role

```sql
delete from public.user_roles
where role = 'admin'
  and user_id = (select id from public.profiles where email = 'someone@gmail.com');
```

### Put someone in a team (or make them lead)

Team slugs: `mechanical`, `civil`, `iot-robotics`, `software`, `media`, `management`,
`pr-outreach` (see `public.teams`).
`team_role` is `member`, `deputy` or `lead`.

```sql
insert into public.team_members (team_id, member_id, team_role)
select t.id, p.id, 'lead'
from public.teams t, public.profiles p
where t.slug = 'iot-robotics' and p.email = 'someone@gmail.com'
on conflict (team_id, member_id) do update set team_role = excluded.team_role;
```

Remove from a team:

```sql
delete from public.team_members
where team_id = (select id from public.teams where slug = 'iot-robotics')
  and member_id = (select id from public.profiles where email = 'someone@gmail.com');
```

### See who has what

```sql
select p.email, p.full_name, p.member_status, p.student_status,
       array_agg(distinct r.role) filter (where r.role is not null) as roles,
       array_agg(distinct t.slug || ':' || tm.team_role) filter (where tm.team_id is not null) as teams
from public.profiles p
left join public.user_roles r on r.user_id = p.id
left join public.team_members tm on tm.member_id = p.id
left join public.teams t on t.id = tm.team_id
group by p.email, p.full_name, p.member_status, p.student_status
order by p.email;
```

After a change, the person should **sign out and back in** (or reload) to see
their new menus.

### First admin (you)

1. Sign in on the site with your Google account and finish onboarding.
2. Run, with your email:

```sql
update public.profiles set member_status = 'member', student_status = 'verified'
where email = 'you@gmail.com';

insert into public.user_roles (user_id, role)
select id, r::public.app_role from public.profiles, unnest(array['admin', 'president']) r
where email = 'you@gmail.com'
on conflict do nothing;
```

3. Reload the site: **Manage** appears in your menu.

---

## 3. Later: your own developer console

You plan a separate admin web app connected to the same Supabase project. Keep
in mind:

- **Server side only** for the secret key (`SUPABASE_SECRET_KEY` /
  service-role). It skips every security rule, so it must never reach a browser.
- Or sign in to that console with Google as yourself and call the existing
  functions `assign_role`, `revoke_role` and `set_team_member`. They check that
  the caller is an admin (or president/VP for teams) and write the audit log.
- A dedicated `developer` role is a small migration (add the value to
  `public.app_role` and allow it in `is_admin()`), when you want one.
