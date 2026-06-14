# Settings — Control Center

The Settings screen (`/settings`, `components/settings/SettingsView.tsx`) is the
app's **system control center**: a premium, calm, mobile-first, Hebrew-RTL place
to manage preferences, goals and data. It is presentational + storage only — no
backend, no new product logic.

## Structure

Each section is a `SectionHeader` (with a calm leading accent dot) followed by
premium cards:

1. **Hero strip** — a raised card with the brand mark, a one-line intro, and
   three trust chips: `שמירה מקומית`, `גישה פרטית`, `ללא שרת`. The page title
   (`הגדרות` / `העדפות, יעדים וניהול נתונים`) is the route `PageHeader`.
2. **מצב תצוגה (Appearance)** — two large selectable cards, `בהיר` / `כהה`, each
   with a theme-independent mini preview and an icon. The selected card is
   obvious (accent border + ring + filled check). **There is no third option.**
3. **יעדים יומיים (Daily goals)** — protein goal, calorie goal, daily water goal
   (liters → ml), and the weight unit (ק"ג). Explains that goals feed the Today
   dashboard and nutrition tracking. User-defined tracking only — no diet plans
   or medical recommendations.
4. **קיצורי מים (Water shortcuts)** — links to the existing water-presets editor
   (`/nutrition/water/presets`). Preset logic is unchanged.
5. **נתונים ואחסון (Data & local storage)** — a trust card: "המידע שלך נשמר
   מקומית במכשיר הזה. אין שרת, אין חשבון, ואין סנכרון ענן." plus the local
   storage status (active, saved workouts, nutrition entries, approx size).
6. **גישה ופרטיות (Access & privacy)** — re-show the welcome screen and re-show
   the private-access notice. Wording stays within the boundaries below.
7. **פעולות רגישות (Sensitive actions)** — visually separated in a red-tinted
   container: **reset all data** (two-step confirm), **lock system**, and the
   scoped resets (saved values, favorites, supplements) which only appear when
   such data exists. Destructive actions are never placed beside harmless ones.
8. **מידע מערכת (System info)** — app name, version, local-storage note, PWA note.

## Appearance: only Light / Dark

`ThemePreference` is `"light" | "dark"` (`lib/fitness-types.ts`). The previous
`"system"` mode was removed in Phase 3.xx — the user wanted full, predictable
control over the app's appearance.

- The header moon/sun button toggles `light`↔`dark` only.
- `ThemeProvider` no longer reads `matchMedia`; `resolved === theme`.
- The pre-paint `THEME_INIT_SCRIPT` applies `dark` only when the stored theme is
  exactly `"dark"`, falling back to `light` otherwise.

### Migration of the old "system" value

Old installs may still have `theme: "system"` (or any unexpected value) in
`yfos:settings`. We **sanitize on read**, never wiping the rest of settings:

```ts
// lib/storage.ts
function sanitizeTheme(theme: unknown): ThemePreference {
  return theme === "dark" ? "dark" : "light";
}
// getSettings() returns { ...merged, theme: sanitizeTheme(merged.theme) }
```

So:

- A legacy `system` becomes `light`. The app never crashes and the UI is never
  left in an impossible state.
- `system` is **never written back**: the next settings write persists the clean
  value, and every read sanitizes a stale one.
- The init script uses the **same fallback**, so the pre-paint `<html>` class and
  React's first render always agree — no hydration mismatch, no content flash.
- No user data is touched by the migration.

The default theme (`DEFAULT_SETTINGS.theme`, and the value after `resetAll`) is
`light`.

## Data behavior

All data is `localStorage`-only on this device (see `PROJECT_STATE.md §4`). The
control center never adds a server, account, sync, auth, AI, or API.

## Access / privacy wording boundaries

The access screens are reminders that the system is private and for authorized
use only. The copy must **not** claim device detection, tracking, monitoring,
identity awareness, or real backend security. Allowed framing: client-side
access gate, local access code, private notice, authorized use only, data stays
on this device. See `docs/ADMIN_ACCESS_GATE.md`.

## QA

`scripts/qa-settings.mjs` (expects `next start -p 3332`) asserts: `/settings`
loads, exactly two appearance options exist (`בהיר` / `כהה`), `מערכת` is absent,
the header theme button toggles only light/dark, a stored legacy `theme:"system"`
is sanitized, the danger section is present and separated, and there is no
horizontal overflow or console error at 360px and 390px in both schemes.
