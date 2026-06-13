# Admin Access Code Gate

A premium, full-screen red/black warning gate shown after the Private Access
Notice. It requires an access code before the app (or the welcome screen) is
revealed.

## What it is

- A **client-side access code gate** — a deliberate "authorized use only"
  barrier in front of a private personal app.
- A dramatic, premium screen: dark glass card on a red/black backdrop, a
  shield + warning + lock icon composition, a subtle danger glow, a single code
  field (with show/hide toggle), and a clear CTA.
- The second gate in the order: it sits **below** the private-access notice
  (seen first) and **above** the welcome screen (revealed only after a correct
  code).

## What it is NOT

- **Not real authentication or backend access control.** The code is checked in
  the browser only. There is no server, no database, no session token, no JWT.
- **Not a secret.** The access code lives in the client bundle; anyone reading
  the JavaScript can find it. It is a barrier, not a cryptographic boundary.
- **Not tracking.** The gate does **not** detect devices, monitor usage, or know
  who entered. No backend, no auth, no analytics were added.

This is a deliberate product decision: the copy stays honest about being an
access-code gate, not a security mechanism.

## Access code

```
yuvalzakay123
```

Checked with a trimmed, case-sensitive comparison (`isAdminCodeValid`).

## Storage

| | |
|---|---|
| Key | `yfos:admin-access-granted:v1` |
| Storage | **localStorage** (persistent, per browser/device) |
| Value | `"1"` once unlocked |

### Behavior

- **Fresh browser/device (no grant)** → the gate appears (after the private
  notice is accepted).
- **Wrong code** → an inline error (`קוד שגוי — אין הרשאת כניסה למערכת.`) shows;
  the gate stays up; nothing is persisted. Typing again clears the error.
- **Correct code (`אימות וכניסה` / Enter)** → the grant flag is set, the gate is
  hidden, and the app (or welcome screen) is revealed.
- **Navigation / refresh / new session on the same device** → the gate does
  **not** reappear (the grant persists in localStorage, and a pre-paint inline
  script hides the overlay before first paint so there is no flash).
- **Settings → "נעל מערכת"** → clears the grant and re-shows the gate
  immediately.

localStorage (not sessionStorage) is intentional: once the code is entered, the
same device is trusted until the user explicitly locks the system. This differs
from the private-access notice, which is per-session.

### Fail-closed

If storage is unavailable or throws (private mode, blocked cookies, quota), the
grant is treated as **not** granted and the gate is shown. Unlike the welcome /
private-access notices (which fail open because there is nothing to protect),
this screen is an intentional barrier, so a storage hiccup keeps the gate up
rather than waving the user through. Re-entering the code still works in-memory
for the session.

## Gate order

```
PrivateAccessNotice   (z-110, seen first — per-session notice)
  └ AdminAccessCodeGate  (z-105 — code required)
      └ WelcomeGate        (z-100 — first-visit intro, shown only after grant)
          └ AppShell         (app content, behind all gates)
```

The init scripts in `<head>` (theme + 3 gates) run before paint to prevent
flashes; `RootLayout` nests
`PrivateAccessNotice → AdminAccessCodeGate → WelcomeGate → AppShell`.

## Copy & safety boundaries

Allowed (used in the UI):

- Badge: `גישת מנהל`
- Title: `כניסה מוגבלת`
- Subtitle: `המערכת פתוחה רק למי שקיבל הרשאת כניסה.`
- Warning: `אם אינך מנהל המערכת או לא קיבלת אישור מפורש, אין להמשיך לשימוש במערכת.`
- Input label: `קוד גישה` · placeholder: `הכנס קוד`
- Wrong code: `קוד שגוי — אין הרשאת כניסה למערכת.`
- CTA: `אימות וכניסה`
- Footer: `הגישה מיועדת לשימוש מורשה בלבד.`

Not allowed (would be technically misleading without a backend):

- `זיהינו שאתה לא מנהל`
- `אנחנו מזהים מכשירים`
- `השימוש שלך מנוטר`
- `אנחנו יודעים מי נכנס`
- `המכשיר שלך זוהה`

The gate never claims a capability (device detection, monitoring, identity
awareness) that does not exist today.

## UI / UX

- Mobile-first, Hebrew RTL; verified with no horizontal overflow at 360px and
  390px.
- A **controlled dark/red palette in both light and dark themes** — the gate
  uses fixed colors (not theme tokens) so it always reads as serious and
  powerful, by design.
- Body scroll is locked while the gate is visible (restored on grant).
- The code field auto-focuses, submits on Enter, has a show/hide toggle, and
  clears its error as you type.

## Implementation

- `lib/admin-access.ts` — localStorage-backed store via `useSyncExternalStore`,
  the `ADMIN_ACCESS_CODE` + `isAdminCodeValid` helper, `grantAdminAccess` /
  `resetAdminAccess`, and `ADMIN_ACCESS_INIT_SCRIPT` (pre-paint flash
  avoidance). Mirrors `lib/private-access.ts`.
- `components/access/AdminAccessCodeGate.tsx` — the gate component and overlay.
- `app/layout.tsx` — mounts `<AdminAccessCodeGate>` between `<PrivateAccessNotice>`
  and `<WelcomeGate>` and injects the init script in `<head>`.
- `app/globals.css` — `.admin-access-granted [data-admin-access-gate] { display: none }`
  hides the server-rendered overlay before paint for granted devices.
- `components/settings/SettingsView.tsx` — "נעל מערכת" clears the grant to
  re-show the gate. It lives alongside (does not replace) the welcome and
  private-access reset actions.

## QA

`qa/admin-access-check.mjs` validates: fresh session shows the gate, it has a
code input, no false detection/monitoring copy, no horizontal overflow at
360/390, a wrong code shows the error and grants nothing, typing clears the
error, the correct code enters the app and persists the grant, a refresh does
not re-show, and the Settings "נעל מערכת" action clears the grant and re-shows
the gate. The welcome, private-access and broad QA scripts seed
`yfos:admin-access-granted:v1` so they are unaffected by the gate.

## Future direction

If a backend is ever introduced, this gate could become the entry point for
**real** access control:

- server-verified codes / invitations,
- real authentication (sign-in, magic links),
- per-user roles and audit logs.

Until then it remains a client-side gate only — no false claims.
