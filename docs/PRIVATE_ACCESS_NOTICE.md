# Private Access Notice

A premium, full-screen notice shown when entering Yuval Fit OS. It tells the
user the app is private and intended only for people who received a direct link.

## What it is

- An **informational / deterrent notice**, shown once per browser session.
- A premium, app-like screen: glass card, shield + lock + spark icon cluster,
  adaptive gradient backdrop, trust chips, and a single clear CTA.
- Rendered above the welcome screen (higher z-index) so it is the first thing
  seen on entry. Accepting it reveals the welcome screen for new users, then the
  app.

## What it is NOT

- **Not** a password gate. There is no password or code input.
- **Not** authentication or access control. Nothing is checked server-side.
- **Not** tracking. The app does **not** detect other devices, monitor usage,
  or know who entered. No backend, no auth, no analytics were added.

This is a deliberate product decision: the copy stays honest about being a
notice, not a security mechanism.

## Storage

| | |
|---|---|
| Key | `yfos:private-access-notice-accepted:session` |
| Storage | **sessionStorage** (per-tab, per-session) |
| Value | `"1"` once accepted |

### Session behavior

- **Fresh browser/app session** → notice appears.
- **Accept ("הבנתי, כניסה למערכת")** → flag set, notice hidden, app revealed.
- **Navigation / refresh in the same session** → notice does **not** reappear
  (the flag is still present, and a pre-paint inline script hides the overlay
  before first paint so there is no flash).
- **New session / cleared sessionStorage** → notice appears again.

sessionStorage (not localStorage) is intentional so the notice re-surfaces each
new session as a gentle reminder, without permanently trapping anyone.

### Fail-open

If storage is unavailable or throws (private mode, blocked cookies, quota), the
notice is treated as accepted. There is nothing to protect, so a storage hiccup
must never trap the user behind the screen.

## Copy & safety boundaries

Allowed (used in the UI):

- `מערכת פרטית`
- `הגישה ל־Fit OS מיועדת רק למי שקיבל קישור ישיר.`
- `אין להעביר את הקישור לגורמים אחרים. השימוש במערכת מיועד לצפייה ותפעול אישי בלבד.`
- `שימוש לא מורשה או העברת הקישור לאחרים אינם חלק מהשימוש המיועד במערכת. בעתיד ניתן יהיה להוסיף בקרת גישה.`
- Chips: `קישור אישי` · `שימוש פרטי` · `ללא סיסמה בשלב זה`
- CTA: `הבנתי, כניסה למערכת`
- Footer: `המשך השימוש מהווה אישור שהגישה נועדה עבורך בלבד.`

Not allowed (would be technically misleading without a backend):

- `אנחנו מזהים מכשירים אחרים`
- `השימוש שלך מנוטר` / `המערכת מנטרת אותך`
- `אנחנו יודעים מי נכנס`
- `המכשיר שלך זוהה`

The deterrent copy is framed in the future tense ("בעתיד ניתן יהיה להוסיף בקרת
גישה") so it never claims a capability that does not exist today.

## Implementation

- `lib/private-access.ts` — sessionStorage-backed store via `useSyncExternalStore`,
  plus `PRIVATE_ACCESS_INIT_SCRIPT` (pre-paint flash avoidance). Mirrors
  `lib/welcome.ts`.
- `components/access/PrivateAccessNotice.tsx` — the gate component and overlay.
- `app/layout.tsx` — mounts `<PrivateAccessNotice>` outside `<WelcomeGate>` and
  injects the init script in `<head>`.
- `app/globals.css` — `.private-access-accepted [data-private-access-gate] { display: none }`
  hides the server-rendered overlay before paint for accepted sessions.
- `components/settings/SettingsView.tsx` — "הצג מסך גישה פרטית" clears the
  session flag to re-show the notice.

## QA

`qa/private-access-check.mjs` validates: fresh session shows the notice, no
password/text input, no false-security copy, no horizontal overflow at 360/390,
CTA enters the app, refresh in the same session does not re-show, a new session
re-shows, and the Settings action re-shows. The welcome and broad QA scripts
seed the session flag so they are unaffected by the notice.

## Future direction

If a backend is ever introduced, this notice could become the entry point for:

- real authentication (sign-in, magic links),
- device/session awareness,
- audit logs of access.

Until then it remains a notice only — no false claims.
