# Beta Welcome Notice

A warm, friendly full-screen notice that greets testers **after** they pass the
real beta access gate. It thanks them for trying Fit OS, sets the expectation
that the app is still under active development, and shows how to reach Yuval.

It **replaced** the old [`PrivateAccessNotice`](PRIVATE_ACCESS_NOTICE.md)
("מערכת פרטית / do not share the link"). That message made sense when access was
link/code based; now access is controlled by **Google login + an approved-email
gate** (see [`BETA_ACCESS_SYSTEM.md`](BETA_ACCESS_SYSTEM.md)), so onboarding is no
longer about security — it is about welcoming beta testers.

## Why the change

- Access is now real: `BetaAuthGate` (Supabase auth + `beta_allowed_users`) is
  the boundary. Users can no longer "enter just by having a link."
- A "do not share / private system" warning is therefore the wrong message — it
  reads as bureaucratic and slightly scary for invited testers.
- The new notice is warm, friendly, premium, and clear: thanks + expectations +
  a direct line to Yuval.

## What it is / is NOT

- **Is** an informational, per-session greeting (shown on every app entry). No
  password, no input, no backend check, no tracking. Fails open (a storage hiccup
  never traps anyone).
- **Is NOT** auth or access control. The access decision lives entirely in
  `BetaAuthGate`. This notice never reads/writes auth, approval or fitness data
  beyond a single read-only check of whether the current user is already allowed
  in (so it never greets someone the gate is still blocking).

## Gate order

```
BetaAuthGate         (z-108)  → REAL access boundary (login + approved email / guest)
  BetaWelcomeNotice  (z-104)  → this notice — shown once PER SESSION after access
    WelcomeGate      (z-100)  → first-visit intro
      AppShell                → the app
        ProfileOnboardingPrompt (z-95) → step two, after this notice is dismissed
```

(Previously: `PrivateAccessNotice (z-110) → BetaAuthGate → WelcomeGate → AppShell`.)

## When it shows

The notice is part of **every app entry**: it is gated **per session**, so it
greets each fresh entry once the user is inside the app shell and has not seen it
**this session** yet:

- **Approved real user** (signed in + `beta_allowed_users` status `active`) → shown
  once per session.
- **Admin** → same `useAppAccessGranted` ("allowed") path → shown once per session.
- **Guest** (local "המשך כאורח" session, no Supabase account) → shown once per
  session too.
- **Within a session** it does **not** re-stack on route navigation; a new tab /
  fresh PWA launch / new session greets again.
- **Never** for denied / blocked users, while auth/access is still resolving, or
  on the signed-out / not-configured screens (the gate's own z-108 screens win,
  and `useAppAccessGranted` returns false so the notice does not even mount).
- **Never** on the public info pages (`/privacy`, `/terms`, `/ai-disclaimer`).
- Always shown **before** the profile onboarding prompt (the prompt waits on
  `useBetaWelcomeSeen()`, so the two never overlap).
- **Testing seam** (`NEXT_PUBLIC_BETA_DISABLE_GATE=1`): the gate is bypassed for
  QA; the notice greets only when a local guest session is seeded, so feature
  tests reach app screens unobstructed.

## Storage

| | |
|---|---|
| Key | `yfos:beta-welcome-seen-session:v1` |
| Storage | **sessionStorage** (per session / per app entry) |
| Value | `"1"` once acknowledged this session |
| Legacy key | `yfos:beta-welcome-seen:v1` (localStorage) — retained, **no longer read** |

- **Fresh session + access granted** → notice appears (the legacy permanent
  localStorage flag, if present from before, is ignored).
- **Acknowledge ("הבנתי, המשך למערכת")** → session flag set, notice hidden, app
  revealed.
- **Within-session reload / route navigation** → does **not** reappear (a pre-paint
  inline script, `BETA_WELCOME_INIT_SCRIPT`, checks the session key and adds
  `.beta-welcome-seen` to `<html>` so there is no flash).
- **New session / fresh app entry** → shows again (this is the point of V3).
- **Reset from Settings** ("הצג הודעת בטא שוב") → session flag cleared, notice
  shows again immediately.

sessionStorage (not localStorage) is intentional **as of V3**: the beta welcome is
now part of every app entry, not a once-per-device greeting. See
[`PERSONAL_PROFILE_V1.md` → "V3 — Entry flow"](PERSONAL_PROFILE_V1.md).

## Copy

- Pill: `ברוכים הבאים לבטא`
- Title: `ברוכים הבאים ל־Fit OS`
- Opener: `שמחים שהצטרפתם לבדוק את המערכת 🙌`
- Body: `Fit OS נמצאת כרגע בשלבי פיתוח ובדיקת בטא, ולכן ייתכן שתיתקלו בדברים שעדיין משתנים, באגים קטנים, חוסרים או אזורים שעדיין לא הושלמו.`
- Body: `אם נתקלתם בבעיה, משהו לא ברור, או שיש לכם רעיון לשיפור — אפשר לפנות אליי ישירות.`
- Primary CTA: `הבנתי, המשך למערכת`
- Secondary CTA: `שלח הודעה ליובל`
- Footer: `תודה שאתם עוזרים לשפר את המערכת.`

Deliberately avoids harsh wording: no `אסור להעביר`, `גישה פרטית`, `מעקב`,
`אזהרה`, `הפרת תנאים`. This screen is not about security.

## Contact

- Name: **יובל**
- Phone (displayed + `tel:`): **053-333-9341** (`tel:+972533339341`)
- WhatsApp (secondary button): **https://wa.me/972533339341**

## Implementation

- `lib/beta-welcome.ts` — **sessionStorage**-backed store via `useSyncExternalStore`
  (per-session gating; session state is per-tab so there is no cross-tab `storage`
  sync), plus `BETA_WELCOME_INIT_SCRIPT` (pre-paint flash avoidance, checks the
  session key). The legacy localStorage key is retained but no longer read.
- `components/access/BetaWelcomeNotice.tsx` — the gate component, the
  access-aware `useAppAccessGranted` hook, and the overlay.
- `app/layout.tsx` — nests `<BetaWelcomeNotice>` inside `<BetaAuthGate>` and
  injects the init script in `<head>`. `PrivateAccessNotice` is no longer
  mounted.
- `app/globals.css` — `.beta-welcome-seen [data-beta-welcome-gate] { display: none }`
  hides the server-rendered overlay before paint for testers who saw it.
- `components/settings/SettingsView.tsx` — "הצג הודעת בטא שוב" (`resetBetaWelcome`)
  re-shows the notice. The hero trust chip reads `גרסת בטא`.

## QA

`e2e/beta-welcome.spec.ts` (part of `npm run test:e2e`) covers the V3 entry-flow
rules: a granted user sees the notice on entry; it still shows when the **legacy
persistent flag** is set; it comes **before** the profile prompt (no stacking);
acknowledging sets the **session** flag and a within-session reload does not
re-show; a **fresh session greets again**; the public info pages show neither
surface; and a non-granted visitor never sees it.

`qa/beta-welcome-check.mjs` (manual) additionally validates copy and layout
against the `NEXT_PUBLIC_BETA_DISABLE_GATE=1` QA server (seeding a guest session):
the welcoming copy, contact number and WhatsApp link are present; no password/text
input; no harsh private-access wording; no horizontal overflow at 360/390;
acknowledging sets the session flag; a within-session refresh does not re-show; the
Settings reset re-shows and clears the session flag; and a non-granted visitor
never sees the notice.

## No changes to

Supabase auth, approved-email logic, admin panel, guest-mode behavior,
localStorage data schemas (workout/nutrition/water/supplement/gym), backup
schema, bottom nav, or routes. No backend, tables, cloud sync, AI, API, or heavy
dependencies were added.
