# Beta Access System (Phase 3.xx)

> Real access control for the Fit OS beta: a user must authenticate (Supabase
> Auth) **and** be on an approved-email list to enter — even if someone shares
> the public Vercel link. Admins manage the approved list from inside the app.
>
> **This phase is access control only — NOT cloud sync.** Every piece of personal
> fitness data (workouts, active workout draft, nutrition logs, saved food
> values, favorites, water, supplements, gym visits, progress, backup/restore)
> still lives **only in this device's `localStorage`** (see `lib/storage.ts`).
> After login, the data is still on this device unless a future phase adds
> per-user cloud sync.

---

## 1. How it works

```
PrivateAccessNotice  (z-110)  → existing per-session private notice
  BetaAuthGate       (z-108)  → NEW: Supabase auth + approved-email gate (REAL gate)
    WelcomeGate      (z-100)  → existing first-run intro
      AppShell                → the app
```

`BetaAuthGate` (`components/access/BetaAuthGate.tsx`) resolves, top-down:

1. **Not configured** (no Supabase env vars): production **fails closed** with an
   "access system not configured" screen — the app is never opened publicly.
   Development shows the same screen with a **"continue anyway (dev)"** button so
   local work isn't blocked.
2. **Loading**: the session (then the approval check) is resolving — a calm
   branded loader.
3. **Signed out**: the Fit OS sign-in screen — **Continue with Google** and an
   **email magic-link** option.
4. **Signed in + approved + active**: the overlay disappears, the app is revealed.
5. **Signed in but not approved / blocked / errored**: `BetaAccessDenied`.

Like the other gates, the app shell is always mounted underneath (instant entry,
no remount); overlays are `fixed` + scroll-locked and ordered by z-index.

### Approved users vs access requests
There are two separate concepts — don't conflate them:

- **`beta_allowed_users`** is the **source of truth** for entering the app. The
  gate reads *only* this table. `active` → in, `blocked` → blocked, absent → denied.
- **`beta_access_requests`** is a **request queue**. An unapproved user files a
  request here so the admin can see them; a row here **never grants access by
  itself**. Approving a request is what writes the `active` row into
  `beta_allowed_users`.

### Request-access flow (denied screen)
When a signed-in user is **not approved** (the `denied` variant only — never
`blocked`, never `error`), `BetaAccessDenied` shows a request panel:

- **No request yet** → a **`בקש גישה`** button. Clicking it files a `pending`
  request for the authenticated email (taken from the live session, never typed)
  and shows **`הבקשה נשלחה`** / "האדמין יוכל לאשר אותך מתוך מערכת הניהול."
- **A request already exists** (loaded on mount) → **`כבר נשלחה בקשת גישה`** /
  "נעדכן אותך לאחר אישור האדמין."
- **Rejected** → **`הבקשה נדחתה`** / "אפשר לפנות ליובל אם לדעתך זו טעות." (no
  auto re-request — calm, no spam).
- **Blocked** users see the **blocked** screen, which has **no** request button,
  so they cannot bypass a block by repeatedly requesting access.

### The legacy admin code gate
The old client-side admin access-code gate (`yuvalzakay123`,
`components/access/AdminAccessCodeGate.tsx` + `lib/admin-access.ts`) is **no
longer in the production gate chain**. The files are kept in the repo as a
development-only fallback reference, but the Supabase beta gate is now the real
boundary. Nothing in production depends on the old code.

---

## 2. Auth provider & env vars

**Provider:** Supabase Auth (Google OAuth + email magic link), Supabase Postgres
for the approved list, and Row Level Security for enforcement. Only the public
**anon** key is used in the browser.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL (Settings → API). Public. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key. Safe to ship — RLS protects data. |
| `NEXT_PUBLIC_BETA_DISABLE_GATE` | no | **Testing/local only.** `"1"` fully disables the gate so the local QA harness can reach app screens without a live Supabase project. **Never set in production** — unset means the gate fails closed by default. |

> ⛔ **Never** put the Supabase **service-role** key in the client or in any
> `NEXT_PUBLIC_*` variable. The app needs no privileged server key — RLS handles
> admin actions safely.

`.env.local.example` documents these. Copy it to `.env.local` (gitignored) for
local work, and add the two public vars in **Vercel → Settings → Environment
Variables** for Production + Preview + Development.

The app **builds and runs with no Supabase env vars** — it just shows the
not-configured state instead of crashing.

---

## 3. Database: tables, policies, RPC

Run [`supabase/beta-access.sql`](../supabase/beta-access.sql) once in the
Supabase SQL editor. It creates:

- **`beta_allowed_users`** — `id, email (unique), status ('active'|'blocked'),
  display_name, notes, added_by, created_at, updated_at, last_seen_at`. A unique
  index on `email`; a trigger normalizes email/`added_by` (trim + lowercase) and
  maintains `updated_at`.
- **`beta_admins`** — `id, email (unique), created_at`. Trigger normalizes email.
- **RLS** (enabled on both tables):
  - A user can read **only their own** `beta_allowed_users` row (the access check)
    and **only their own** `beta_admins` row (to confirm admin status).
  - An **admin** (`is_beta_admin()`) can `select / insert / update / delete` every
    `beta_allowed_users` row.
  - Regular users have **no** update/delete policy — they cannot un-block or
    self-approve themselves. The authenticated email comes from the JWT
    (`auth.jwt() ->> 'email'`), so it can't be spoofed.
- **`touch_beta_last_seen()`** — a `SECURITY DEFINER` RPC that updates only the
  caller's `last_seen_at`, so tracking works without granting a broad UPDATE.
- **`beta_access_requests`** — the access-request queue: `id, email (unique),
  status ('pending'|'approved'|'rejected'), display_name, provider, notes,
  requested_at, updated_at, reviewed_at, reviewed_by`. Indexes on `email`
  (unique) and `status`; a trigger normalizes `email`/`reviewed_by` and maintains
  `updated_at`.
  - **RLS** (enabled): a user can read **only their own** request and may
    **insert only** a request for their own email **and only with status
    `pending`** — they have **no** update/delete policy, so they can never flip
    their own request to `approved` (and even if they could, the gate ignores this
    table). Admins can **read all** requests and **delete** them.
  - **`approve_beta_request(p_request_id)`** — `SECURITY DEFINER`, admin-only
    (re-checks `is_beta_admin()`). Atomically upserts the user into
    `beta_allowed_users` as `active` (reactivating a previously-blocked user,
    `added_by` = admin, notes "Approved from access request") **and** marks the
    request `approved` with `reviewed_at`/`reviewed_by`.
  - **`reject_beta_request(p_request_id)`** — `SECURITY DEFINER`, admin-only.
    Marks the request `rejected`; does **not** add the user to
    `beta_allowed_users`.
  - Because status changes go only through these admin-only RPCs, a non-admin
    **cannot approve anyone — including themselves.**

### Email normalization
Emails are always compared and stored **trimmed + lowercased** — in the client
(`normalizeEmail` in `lib/beta-access.ts`) and again by the DB triggers.

---

## 4. Setup steps (for Yuval)

1. **Create a Supabase project** (supabase.com).
2. **Enable providers**: Authentication → Providers →
   - **Google**: turn on, add the Google OAuth Client ID/Secret (Google Cloud
     console), and add your site + Vercel URLs to Supabase's redirect allow-list.
   - **Email**: enable "Email" (magic link / OTP) if you want the email option.
   - Authentication → URL Configuration: set **Site URL** to your app URL and add
     preview/localhost URLs to **Redirect URLs**.
3. **Add env vars** to local `.env.local` and to Vercel (the two `NEXT_PUBLIC_*`
   values above).
4. **Run the SQL**: paste `supabase/beta-access.sql` into the SQL editor and run.
   It is **idempotent** — safe to rerun to upgrade an existing project (it uses
   `create table if not exists` + `drop policy if exists` / `create policy`), so
   installs that predate the access-request queue just need a rerun.
5. **Insert the first admin** (SQL editor — see the bottom of the SQL file):
   ```sql
   insert into public.beta_admins (email)
   values ('your-admin@example.com') on conflict (email) do nothing;
   insert into public.beta_allowed_users (email, status, display_name, added_by)
   values ('your-admin@example.com', 'active', 'Admin', 'system')
   on conflict (email) do nothing;
   ```
6. **Approve beta users** from the in-app admin panel at **`/admin/beta`** (the
   "ניהול בטא" card appears in Settings → "חשבון בטא" and in the System Hub only
   for admins).

---

## 5. Admin panel (`/admin/beta`)

Reachable only after the gate (so the viewer is signed in + approved) and only
renders for admins (verified against `beta_admins`); every operation is **also**
RLS-guarded, so a non-admin who reaches the route sees no data and can mutate
nothing. Capabilities:

- Summary chips: **מאושרים** / **ממתינים** / **חסומים** counts.
- **`בקשות גישה ממתינות`** — pending access requests (email, display name,
  request date, provider) with **אשר** (approve → adds/reactivates the user as
  active and marks the request approved), **דחה** (reject), and **מחק** (delete,
  inline confirm).
- View approved + blocked users (with `created_at` and `last_seen_at`).
- **Add** an email manually (with optional display name / notes) → approves it.
- **Block** / **Reactivate** a user.
- **Remove** a user (with inline confirm).

> Approving a request whose email was previously **blocked** reactivates them to
> `active` (the admin's explicit click is the intent). Existing display name on
> the allowed row is preserved.

---

## 6. Sign-out & shared-device safety

Sign-out lives in **Settings → "חשבון בטא"**. Because personal data is still
local, signing out **never deletes data silently**. If any local data exists, a
confirm offers:

- **`התנתק והשאר נתונים`** — sign out, keep the device's data (default).
- **`התנתק ונקה נתונים`** — sign out **and** clear local fitness data
  (`resetAll()` — workouts, nutrition, water, supplements, gym).
- **`ביטול`** — cancel.

This guards against two people on one phone/browser seeing each other's local
data — identity is server-side, but the data is not.

---

## 7. What stayed unchanged

- All fitness **schemas / storage keys / save behaviour** — untouched. No data
  was migrated to the cloud.
- **Backup & Restore** still exports/imports only the device's local data. Beta
  permissions live in Supabase and are **not** part of the local backup.
- Routes, bottom nav, and feature behaviour — unchanged except the **added**
  `/admin/beta` route and the admin-only entry points.

---

## 8. QA

`npm run build` and `npm run lint` both pass **with no Supabase env vars**.
Targeted QA: [`scripts/qa-beta-access.mjs`](../scripts/qa-beta-access.mjs) runs in
layers (it spawns its own `next start` with controlled env):

- **No env** (production build): the not-configured screen **fails closed** (the
  app is not reachable), no crash, no overflow at 360/390 in light + dark.
- **Dummy env** (`configured`): the **sign-in screen** renders (Google + email),
  Hebrew RTL, mobile-safe, no overflow, no console errors.
- **Gate disabled** (`NEXT_PUBLIC_BETA_DISABLE_GATE=1`): the app shell is
  reachable — confirming the testing seam that lets the rest of the QA harness
  run.
- **Signed-in unapproved → request access**: with a seeded session + a mocked
  Supabase backend (no row in `beta_allowed_users` / no request), the **denied
  screen** shows the **`בקש גישה`** CTA, and filing a request shows the
  **`הבקשה נשלחה`** success state — verified at 360/390 in light + dark with no
  overflow and no console errors.

> Running the **other** QA scripts (`qa-settings.mjs`, etc.) against a build
> without Supabase now requires `NEXT_PUBLIC_BETA_DISABLE_GATE=1` so they can
> reach app screens past the real gate.

### Manual QA with a real Supabase project
1. Configure env + **rerun** `supabase/beta-access.sql` + insert the first admin
   (above). The rerun adds the `beta_access_requests` table/policies/RPCs.
2. Sign in as the admin → you reach the app and see "ניהול בטא".
3. **Request flow**: sign in with a **never-approved** Google account → denied
   screen → tap **`בקש גישה`** → **`הבקשה נשלחה`**. Reload → **`כבר נשלחה בקשת
   גישה`** (no duplicate row).
4. Sign in as the admin → `/admin/beta` shows the request under **בקשות גישה
   ממתינות** with a `ממתינים` count.
5. Tap **אשר** → the user appears under approved users; sign in again as that user
   (or refresh) → they enter the app.
6. Repeat with another account and tap **דחה** → the user stays denied and (on
   their denied screen) sees **`הבקשה נדחתה`**.
7. **Block bypass**: block a user, then as that user confirm the **blocked**
   screen has **no** `בקש גישה` button.
8. Add a test email manually in the panel; sign in as that user → app.
9. Confirm local data (a workout, a water log) persists across sign-out (keep) and
   that "sign out and clear" wipes local fitness data only.

---

## 9. Future phase

**User Data Cloud Sync** — per-user cloud storage for the fitness data itself.
Not part of this phase; this phase is access control only.
