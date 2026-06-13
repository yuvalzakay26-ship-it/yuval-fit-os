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

Requirements: Node 20+. The app is client-data only — there is nothing to
configure, no `.env`, no services to start.

> ⚠️ **This is not a stock Next.js.** APIs/conventions may differ from what you
> remember. Before writing framework code, read the relevant guide under
> `node_modules/next/dist/docs/` (see `AGENTS.md`).

## 2. Project layout

```
app/                    route segments (one folder per screen) + layout, manifest
components/
  access/               PrivateAccessNotice gate
  welcome/              WelcomeGate
  layout/               AppShell, Header, BottomNav, ScrollToTop, nav-items
  today/ workouts/ exercises/ nutrition/ water/ supplements/ progress/ settings/
  ui/                   primitives (Card, Button, Field, Badge, icons, ProgressRing…)
  ThemeProvider.tsx     light/dark/system theme
lib/
  fitness-types.ts      all domain types + DEFAULT_SETTINGS
  storage.ts            the ONLY localStorage access for app data (STORAGE_KEYS)
  fitness-store.ts      reactive hooks over storage (useSyncExternalStore)
  analytics.ts          pure derivations (totals, summaries, PRs) — no storage
  welcome.ts            welcome gate state + init script
  private-access.ts     private-access gate state + init script
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
- **Pure logic goes in `lib/analytics.ts`** (data passed in, nothing read from
  storage) so it stays SSR-safe and testable.
- **Never read `localStorage` during render without the `isBrowser()` guard** and a
  stable server snapshot — this is what keeps hydration clean.

## 4. Gate / welcome behavior

Two independent, fail-open gates wrap the app in `app/layout.tsx`
(`PrivateAccessNotice → WelcomeGate → AppShell`):

- **Private Access Notice** — `sessionStorage` key
  `yfos:private-access-notice-accepted:session`. Re-appears every fresh session.
  Informational only (no password/auth).
- **Welcome screen** — `localStorage` key `yfos:welcome-seen:v1`. Shown once, then
  re-showable from Settings.

Both expose a pre-paint init script injected in `<head>` that toggles a class on
`<html>` so returning users never flash the overlay. Both fail open: if storage
throws, the user is let through.

## 5. Theme

`ThemeProvider` reads `settings.theme` (`light`/`dark`/`system`), resolves
`system` via `matchMedia`, and toggles `.dark` on `<html>`. `THEME_INIT_SCRIPT`
applies the saved theme before paint. There is no separate theme key — it lives
inside `yfos:settings`.

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
| `qa/private-access-check.mjs` | Private Access Notice gate behavior |
| `qa/welcome-check.mjs` | Welcome screen + persistence + reset |
| `qa/today-dashboard-check.mjs` | Today dashboard |
| `qa/food-library-check.mjs`, `qa/*-food-check.mjs` | Food library + per-category data |
| `qa/templates-check.mjs` | Workout templates |
| `qa/learn-check.mjs` | Knowledge Center |
| `qa/pwa-check.mjs` | PWA manifest / install basics |
| `scripts/qa-exercises.mjs`, `scripts/audit-exercises.mjs` | Exercise data + image coverage |
| `scripts/qa-exercise-videos.mjs` | Exercise video links |
| `scripts/qa-image-viewer.mjs` | Exercise image viewer |
| `scripts/qa-nutrition-smoke.mjs` | Nutrition add/log flow |
| `scripts/qa-saved-values.mjs`, `scripts/qa-favorites.mjs` | Saved values, favorites |
| `scripts/qa-water.mjs`, `scripts/qa-supplements.mjs` | Water, supplements |
| `scripts/qa-water-presets.mjs` | Personal water presets (`:3326`) |

### Seeding the gates in QA

Because both gates wrap the app, QA scripts must pre-seed them before asserting
inner UI, via an init script:

```js
await page.addInitScript(() => {
  try {
    localStorage.setItem("yfos:welcome-seen:v1", "1");
    sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
  } catch {}
});
```

`qa/nutrition-helpers.mjs` (`seedAndResetNutrition`) already does this for the
nutrition flow and is the reference pattern. Reuse those exact key strings —
they are the contract from `lib/welcome.ts` / `lib/private-access.ts`.

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
5. **Route** under `app/` if it needs its own screen; add to
   `components/layout/nav-items.ts` only if it belongs in the bottom nav.
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
