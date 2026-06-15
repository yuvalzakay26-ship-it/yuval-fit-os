# Yuval Fit OS — Developer Guide

> How to run, test, and safely extend the app. Read
> [`PROJECT_STATE.md`](PROJECT_STATE.md) first for the high-level map and the
> hard product boundaries.

---

## 1. Run

```bash
npm install        # first time
npm run dev        # dev server (opens the browser via scripts/dev.mjs)
npm run dev:no-open # dev server without opening a browser
npm run build      # production build — also typechecks
npm run start      # serve the production build
npm run lint       # eslint
```

Requirements: Node 20+. The app's **fitness data** is client-only — nothing to
configure for it. The **beta access system** (Phase 3.xx) adds Supabase Auth: it
reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public anon
key only — never the service-role key). The app **builds and runs with no env
vars** — missing config fails closed in production and shows a dev setup screen
locally. For local work without Supabase, set `NEXT_PUBLIC_BETA_DISABLE_GATE=1`
(testing-only) to open the app. Unapproved users can self-serve via the **access
request** flow (`בקש גישה` on the denied screen → `beta_access_requests` queue →
admin approves in `/admin/beta`); the queue never grants access on its own —
`beta_allowed_users` stays the source of truth. See
[`BETA_ACCESS_SYSTEM.md`](BETA_ACCESS_SYSTEM.md) and `.env.local.example`.

> ⚠️ **This is not a stock Next.js.** APIs/conventions may differ from what you
> remember. Before writing framework code, read the relevant guide under
> `node_modules/next/dist/docs/` (see `AGENTS.md`).

## 2. Project layout

```
app/                    route segments (one folder per screen) + layout, manifest
components/
  access/               BetaAuthGate/BetaAccessDenied/BetaAccountSection (Supabase
                        beta gate) + BetaWelcomeNotice (friendly beta greeting) +
                        legacy PrivateAccessNotice & AdminAccessCodeGate (kept as
                        references, NOT in the gate chain)
  admin/                BetaAdminView (the /admin/beta panel — admin-only, RLS-guarded)
  welcome/              WelcomeGate
  layout/               AppShell, Header, BottomNav, ScrollToTop, nav-items
  today/ workouts/ exercises/ nutrition/ water/ supplements/ progress/ settings/
  ui/                   primitives (Card, Button, Field, Badge, icons, ProgressRing…)
  ThemeProvider.tsx     light/dark theme (no "system" mode)
lib/
  fitness-types.ts      all domain types + DEFAULT_SETTINGS
  storage.ts            the ONLY localStorage access for app data (STORAGE_KEYS)
  fitness-store.ts      reactive hooks over storage (useSyncExternalStore)
  analytics.ts          pure derivations (totals, summaries, PRs) — no storage
  nutrition-reuse.ts    recent foods + add-again helpers (pure, derived from food logs)
  today.ts              Today daily-completion + deterministic next-action (pure)
  progress-insights.ts  Progress weekly hero / insight cards / 7-day activity / PRs (pure)
  backup.ts             Local JSON backup/restore: build/validate/preview/restore + meta (mostly pure)
  welcome.ts            welcome gate state + init script
  beta-welcome.ts       beta welcome notice state + init script
  private-access.ts     legacy private-access gate state (unused in chain)
  admin-access.ts       legacy admin access-code gate state (dev fallback, unused in chain)
  supabase/client.ts    browser Supabase client + isSupabaseConfigured() (anon key only)
  beta-access.ts        beta auth/session hooks + approved-email + admin checks + admin CRUD
                        + access-request queue (submit/list/approve/reject)
  seed-exercises.ts     133-exercise library + Hebrew labels
  seed-templates.ts     starter workout templates
  food-library.ts       static food catalogue
  knowledge-content.ts  Learn articles (Hebrew)
  protein.ts            protein goal calculation
  utils.ts              date / id / formatting helpers (dependency-free)
public/                 exercise + food images, PWA icons, sw.js
qa/                     Playwright QA harnesses (mobile-first)
scripts/                dev launcher, icon/image import, per-feature QA scripts
docs/                   feature docs + this guide + PROJECT_STATE.md
```

## 3. Data & storage patterns

- **Read/write app data only through `lib/fitness-store.ts` hooks** (`useWorkouts`,
  `useFoodLogs`, `useSupplements`, …) in components, and the matching mutation
  functions (`addWorkout`, `logWater`, `toggleSupplementTaken`, …).
- Those wrap `lib/storage.ts`, which is the single owner of `localStorage` for app
  data. Add new persisted data by:
  1. Adding a key to `KEYS` in `storage.ts` (keep the `yfos:` prefix; version with
     `:v1` if the shape may evolve).
  2. Adding typed `get*/save*/clear*` helpers there.
  3. Adding a cache slot + snapshot + hook + mutations in `fitness-store.ts`.
  4. Documenting the key in [`PROJECT_STATE.md` §4](PROJECT_STATE.md) and wiring a
     reset path (it is cleared automatically by `resetAll` if it is in `KEYS`).
- **Ephemeral / single-slot state can own its own module** (outside `STORAGE_KEYS`)
  when it is not "saved data" — e.g. the gates (`lib/welcome.ts`) and the
  active-workout **draft** (`lib/active-workout-draft.ts`, key
  `yfos:active-workout-draft:v1`). The draft is a recoverable in-progress slot,
  deliberately separate from workout history (`yfos:workouts`); it auto-saves on
  change, restores on return, and clears on final save / discard. See
  [`ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md`](ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md).
  **Gym attendance** (`lib/gym-attendance.ts`, keys `yfos:gym-visits:v1` +
  `yfos:active-gym-visit:v1`) follows this same self-contained pattern: it owns
  both keys, exposes its own `useSyncExternalStore` hooks + pure stats, and is
  separate from workout history. Because it lives outside `STORAGE_KEYS`, it is
  wired into backups (`BACKUP_MODULES`) and into `resetAll` explicitly. At
  check-out it reads workout history **read-only** to snapshot any same-day
  workout onto the visit (`GymVisit.workouts?`, a display-only copy — it never
  writes workout history); `hasCompletedVisitToday` drives the same-day re-entry
  guard. See [`GYM_CHECK_IN.md`](GYM_CHECK_IN.md).
- **Pure logic goes in `lib/analytics.ts`** (data passed in, nothing read from
  storage) so it stays SSR-safe and testable.
- **Cross-cutting data tools read every key from one table.** `lib/backup.ts`
  drives export/restore from `BACKUP_MODULES`, which maps friendly fields to the
  real `STORAGE_KEYS` (imported, never re-typed) so it can't drift. It adds **one**
  new key, `yfos:backup-meta:v1` (status only), and never touches existing keys'
  shapes; gate/admin keys are explicitly excluded. See `docs/BACKUP_RESTORE.md`.
- **Never read `localStorage` during render without the `isBrowser()` guard** and a
  stable server snapshot — this is what keeps hydration clean.

## 4. Gate / welcome behavior

The gates wrap the app in `app/layout.tsx`, highest z-index seen first
(`BetaAuthGate → BetaWelcomeNotice → WelcomeGate → AppShell`):

- **Beta Auth Gate** — the REAL access boundary (Supabase login + approved-email
  gate, or a local guest session). See `docs/BETA_ACCESS_SYSTEM.md`.
- **Beta Welcome Notice** — `localStorage` key `yfos:beta-welcome-seen:v1`. A
  warm one-time "welcome to the beta" greeting shown only AFTER the access gate
  lets a user (approved or guest) in. Informational only (no password/auth);
  fails open. Replaced the old `PrivateAccessNotice` (kept in the repo as a
  reference, no longer mounted). See `docs/BETA_WELCOME_NOTICE.md`.
- **Welcome screen** — `localStorage` key `yfos:welcome-seen:v1`. Shown once, then
  re-showable from Settings. Fails open.

Each exposes a pre-paint init script injected in `<head>` that toggles a class on
`<html>` so returning users never flash the overlay.

## 5. Theme

`ThemeProvider` reads `settings.theme` — only `light` or `dark` (the "system"
mode was removed in Phase 3.xx so the user has full control) — and toggles
`.dark` on `<html>`. `THEME_INIT_SCRIPT` applies the saved theme before paint.
There is no separate theme key — it lives inside `yfos:settings`.

A legacy `theme: "system"` (or any unexpected value) is **sanitized to `light`**
on read by `sanitizeTheme` in `lib/storage.ts`, so the rest of the app only ever
sees a valid mode. The sanitizer and the pre-paint init script use the same
fallback, so the migration is flash-free and never re-writes `system`. The
header moon/sun button toggles `light`↔`dark` only. The Settings appearance
control offers exactly two cards (בהיר / כהה) — see
[`SETTINGS_CONTROL_CENTER.md`](SETTINGS_CONTROL_CENTER.md).

## 6. Testing & QA

There is no unit-test runner; QA is **Playwright-driven mobile smoke/visual
checks** plus static data audits. Two families of scripts:

- `qa/*.mjs` — broader harnesses. Most default to `http://localhost:3000`
  (`qa/qa.mjs` honors `QA_BASE`). Start the app first (`npm run dev` or
  `npm run build && npm run start`), then `node qa/<script>.mjs`.
- `scripts/qa-*.mjs` — per-feature checks. Each script's header comment names the
  port it expects (e.g. `next start -p 3321` for supplements). Run that server,
  then `node scripts/qa-<feature>.mjs`.

Useful entry points:

| Script | Covers |
| --- | --- |
| `qa/qa.mjs` | Broad mobile sweep: overflow, bottom-nav clearance, real flows, light+dark shots |
| `qa/check360.mjs` | 360px-width pass across routes |
| `qa/console-check.mjs` | Asserts no console errors across routes |
| `qa/beta-welcome-check.mjs` | Beta Welcome Notice: granted user sees it once, copy/contact/WhatsApp, persistence, reset, non-granted never sees it |
| `qa/admin-access-check.mjs` | Admin access-code gate: wrong/correct code, persistence, Settings lock |
| `qa/welcome-check.mjs` | Welcome screen + persistence + reset |
| `qa/today-dashboard-check.mjs` | Today dashboard: completion ratio (`0/3` empty, `3/4` rich), next-action card, optional supplements, 360/390 + dark |
| `scripts/qa-today-command-center.mjs` | Today **command-center polish**: fresh user is short/non-repetitive (water is the only Next Action, no duplicate full water card, no dominating supplements empty state), active-workout draft `אימון בתהליך` resume card and a **live gym visit** both sit above the `מבט מהיר` strip (live gym suppresses the idle `נוכחות במכון` section), engaged-user water+supplements cards return, quick actions navigate; 360/390 × light/dark, no overflow/console errors (`:3100`) |
| `scripts/qa-progress-insights.mjs` | Progress insights: empty / one-workout / rich-week states — weekly hero (`השבוע שלך`), human empty states (no cold dashes), `תובנות השבוע` / `מגמות שבועיות` / `שיאים אישיים` sections, heaviest record value, 360/390 overflow, no console errors, light+dark (`:3331`) |
| `qa/food-library-check.mjs`, `qa/*-food-check.mjs` | Food library + per-category data |
| `qa/templates-check.mjs` | Workout templates |
| `qa/learn-check.mjs` | Knowledge Center |
| `qa/pwa-check.mjs` | PWA manifest / install basics |
| `scripts/qa-exercises.mjs`, `scripts/audit-exercises.mjs` | Exercise data + image coverage |
| `scripts/qa-exercise-videos.mjs` | Exercise video links |
| `scripts/qa-image-viewer.mjs` | Exercise image viewer |
| `scripts/qa-nutrition-smoke.mjs` | Nutrition add/log flow |
| `scripts/qa-saved-values.mjs`, `scripts/qa-favorites.mjs` | Saved values, favorites |
| `scripts/qa-nutrition-reuse.mjs` | Nutrition quick reuse (`:3338`): `אכלת לאחרונה` empty state, recent de-dupe + 8-item limit, `הוסף שוב` from the recent row and from the journal (new id, today's date, values match the original, original untouched, totals + `נוסף ליומן של היום` toast), 360/390 overflow, light/dark, no console errors |
| `scripts/qa-water.mjs`, `scripts/qa-supplements.mjs` | Water, supplements |
| `scripts/qa-water-presets.mjs` | Personal water presets (`:3326`) |
| `scripts/qa-navigation.mjs` | Bottom nav shape, `/more` System Hub links, active-tab state, 360/390 overflow (`:3331`) |
| `scripts/qa-workout-session.mjs` | Active workout session: builder opens, picker add, kg/reps entry, set complete, add/delete set, finish CTA, save, hero/progress, light+dark, 360/390 overflow (`:3331`) |
| `scripts/qa-workout-reorder.mjs` | Active workout exercise reorder (drag-only UI): assert no up/down buttons + a grip handle per row, **drag** the third exercise to first (real pointer drag) — asserting the **floating overlay clone appears mid-drag, follows the pointer in X *and* Y, and is removed after drop** — + keyboard ArrowUp/Down handle reorder, verify kg/reps/completed travel with it, `עכשיו` badge recalculates, save preserves order in history, add/delete still work, light+dark, 360/390 overflow (`:3331`) |
| `scripts/qa-workout-collapse.mjs` | Active workout **collapsible cards**: default all-expanded, collapse one card (its kg/reps inputs hide, a compact `סטים … בוצעו` summary + `aria-expanded` show, the rest stay editable), expand it back (values intact), complete a set + collapse (`הושלם` in summary), `מזער הכל`/`פתח הכל` toggle every card, collapse controls hidden in reorder mode, the important **collapse → reorder-to-first → expand** data-stays scenario, collapse state **not** in the restored draft (comes back expanded) nor in saved history, light+dark, 360/390 overflow (`:3331`) |
| `scripts/qa-workout-draft.mjs` | Active workout **auto-save draft**: empty builder leaves no prompt, a real session (title + exercises + kg/reps + completed + reorder) auto-saves, survives a **full reload**, restores via `המשך אימון` (order + values intact), final save lands it in history **once** and clears the prompt, `מחק טיוטה` (confirmed) discards, light+dark, 360/390 overflow (`:3331`) |
| `scripts/qa-settings.mjs` | Settings control center: two appearance modes only (no "מערכת"), header toggle, legacy `system` migration, separated danger section, 360/390 overflow (`:3332`) |
| `scripts/qa-gym-check-in.mjs` | Gym check-in/out (`:3334`): empty state, check-in + live timer + reload persistence, check-out (saves visit, clears active, worded duration + entry/exit labels + no-linked-workout copy), confirm-gated delete of open/saved visits, long-open forgot warning (no auto-close), prominent Today card (idle status + live `אתה במכון עכשיו`) → `/gym` history, **same-day re-entry guard** (confirm; cancel does nothing; confirm → 2nd visit), **active-visit guard** (no check-in while open), **workout linking** (same-day workout snapshotted; history intact), **old-data compat** (no `workouts` field → no-linked copy, no crash), Progress gym stats, backup export+restore of `gymVisits`/`activeGymVisit` without altering workouts, 360/390 + light/dark, no console errors |
| `scripts/qa-backup-restore.mjs` | Backup & Restore: export JSON shape + gate/admin exclusions + `lastExportedAt`, invalid/wrong-app/unsupported-version rejection, counts preview + confirm gate, full seed→clear→restore (data reappears, admin/gate untouched), Settings + System Hub `/backup` links, friendly empty state, 360/390 overflow, light+dark, no console errors (`:3333`) |

### Seeding the gates in QA

QA runs against a server built with `NEXT_PUBLIC_BETA_DISABLE_GATE=1` (the
documented testing seam) so the **Beta Auth Gate** is bypassed and app screens
are reachable without a live Supabase project. In that mode the **Beta Welcome
Notice** greets only when a local guest session is seeded, so feature-test
scripts reach app screens unobstructed. Scripts should still pre-seed the
welcome flag before asserting inner UI, via an init script:

```js
await page.addInitScript(() => {
  try {
    localStorage.setItem("yfos:welcome-seen:v1", "1");
    localStorage.setItem("yfos:admin-access-granted:v1", "1");
    // (legacy no-op, harmless to leave in older scripts:)
    // sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
  } catch {}
});
```

`qa/nutrition-helpers.mjs` (`seedAndResetNutrition`) already seeds the welcome
flag and is the reference pattern. Reuse the exact key strings — they are the
contract from `lib/welcome.ts` / `lib/admin-access.ts`. The dedicated
`qa/beta-welcome-check.mjs` deliberately leaves `yfos:beta-welcome-seen:v1`
**clean** and seeds a guest session so it can exercise the notice itself; the
dedicated `qa/admin-access-check.mjs` likewise does NOT seed the admin key.

**Seed date-keyed data with the LOCAL ISO date, not UTC.** Water logs and
supplement-logs are keyed/filtered by `lib/utils` `toISODate` (local
`getFullYear/Month/Date`). Seeding with `new Date().toISOString().slice(0,10)`
(UTC) silently lands the data on "yesterday" in any timezone ahead of UTC during
the early-UTC window, so the marks never count for "today". Compute the seed date
the same way the app does — this was the long-standing `today-dashboard-check`
"gate-seeding quirk", fixed in Phase 3.28.

## 7. Adding a feature module safely

1. **Types first** — add domain types to `lib/fitness-types.ts`.
2. **Persist** through `storage.ts` + `fitness-store.ts` (see §3); never add a
   second place that touches `localStorage`.
3. **Pure logic** in `analytics.ts`.
4. **UI** in a new `components/<feature>/` folder; reuse `components/ui/`
   primitives and existing CSS utilities in `app/globals.css` rather than new
   global styles.
5. **Route** under `app/` if it needs its own screen. The bottom nav
   (`components/layout/nav-items.ts`) is reserved for the five daily tabs — do
   **not** grow it. Surface secondary tools as a card in the System Hub
   (`components/more/SystemHubView.tsx`) instead, linking to an existing route.
   See [`NAVIGATION_SYSTEM_HUB.md`](NAVIGATION_SYSTEM_HUB.md).
6. **Reset & docs** — wire a reset path, document the new key in
   `PROJECT_STATE.md §4`, and add a feature doc under `docs/`.
7. **Respect the boundaries** in `PROJECT_STATE.md §8` — no backend/auth/AI, no
   medical advice, no inferred nutrition, no supplement recommendations.
8. **QA** — add a Playwright check that seeds the gates (§6) and asserts no
   console errors and no horizontal overflow at phone widths.

## 8. Conventions

- Hebrew for user-facing strings, English for code and comments.
- RTL-aware layout — prefer logical CSS; the bottom nav order is handled by CSS.
- Keep `lib/utils.ts` dependency-free; reuse its helpers (`cn`, `toISODate`,
  `todayISO`, `formatLiters`, `formatSetsSummary`, `parseOptionalNumber`, …)
  instead of re-implementing locally.
- Fail silently/open on storage errors — a storage hiccup must never trap the user.
