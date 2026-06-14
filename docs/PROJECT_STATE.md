# Yuval Fit OS — Project State

> Central, always-current snapshot of what the app is, how it is wired, and what
> must not be broken. **New agents should read this first**, then
> [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) for how to run, test and extend it.
>
> Last reviewed: Phase 3.xx (Active workout exercise reorder: the workout builder
> can now reorder its exercises via an explicit **reorder mode** — drag handle +
> up/down buttons — without losing any set data. Order is just the `entries`
> array order; reordering relocates the whole entry, so kg/reps/completed stay
> attached and the `עכשיו` current-exercise badge recalculates. No schema /
> storage / save-payload / routes changes. See
> [`ACTIVE_WORKOUT_REORDER.md`](ACTIVE_WORKOUT_REORDER.md).
> Prior: Today quick start & priority-action upgrade: Today
> now leads with a deterministic `הפעולה הבאה שלך` next-action card and an
> optional-aware daily completion summary — supplements no longer make the day
> feel incomplete when none are configured. Pure read-only derivation in the new
> `lib/today.ts`; no storage/data-model/routes/logic changes, no AI, no
> recommendations, not Personal Path. See [`TODAY_QUICK_START.md`](TODAY_QUICK_START.md).
> Earlier: active workout session premium UX upgrade — the workout builder is now a
> focused "live" session (identity-coloured hero, muscle-aware exercise cards,
> "עכשיו" highlight, premium "סיים ושמור אימון" CTA; presentation only). See
> [`ACTIVE_WORKOUT_SESSION_UX.md`](ACTIVE_WORKOUT_SESSION_UX.md). Earlier:
> navigation & System Hub upgrade — Exercises moved into the premium `/more`
> "מרכז מערכת" hub; bottom nav is Today / Workouts / Nutrition / Progress / More.)

---

## 1. What it is

A personal, mobile-first fitness operating system for one user (Hebrew RTL UI,
English code). It tracks workouts, exercises, nutrition, water and supplements,
plus a small knowledge center. It is a Next.js (App Router) PWA with **no
backend** — all data lives in the browser under `yfos:*` storage keys.

- **UI language:** Hebrew, right-to-left (`<html lang="he" dir="rtl">`).
- **Code language:** English (types, functions, comments).
- **Persistence:** `localStorage` + one `sessionStorage` key. No server, no auth,
  no database, no cloud sync, no AI, no external runtime APIs.
- **Theme:** light / dark only (the old "system" mode was removed in Phase 3.xx
  — the user has full control), applied pre-paint to avoid flashes. See
  [`SETTINGS_CONTROL_CENTER.md`](SETTINGS_CONTROL_CENTER.md).
- **Future direction:** can later be wrapped with Capacitor for a native app and
  surfaced inside a larger "Life OS"; data models are kept clean for that.

## 2. App modules

| Module | Purpose | Key code |
| --- | --- | --- |
| Today dashboard | Daily command center: greeting, completion ring, deterministic next-action card, status strip, module cards (workout, macros, water, supplements). Optional-aware (supplements never block the day) | `components/today/TodayView.tsx`, `lib/today.ts`, `docs/TODAY_QUICK_START.md` |
| System Hub ("מרכז מערכת") | Premium `/more` hub gathering all secondary tools into module-coloured categories (pure navigation) | `components/more/SystemHubView.tsx`, `docs/NAVIGATION_SYSTEM_HUB.md` |
| Workouts | Log sessions, build from templates, view history; the active session (builder) is a premium muscle-aware "live workout" experience with an explicit exercise reorder mode (drag + up/down, no data loss) | `components/workouts/*`, `docs/ACTIVE_WORKOUT_SESSION_UX.md`, `docs/ACTIVE_WORKOUT_REORDER.md` |
| Exercise Library | 133 exercises, images, instructions, external demo videos | `components/exercises/*`, `lib/seed-exercises.ts` |
| Nutrition | Daily food logs + macro totals | `components/nutrition/NutritionView.tsx` |
| Food Library | Visual catalogue of foods to log from | `components/nutrition/FoodLibrary*`, `lib/food-library.ts` |
| Saved Food Values | User's remembered per-food default macros | `docs/NUTRITION_SAVED_VALUES.md` |
| Favorite Foods | Quick-access favorites (identity only, no macros) | `docs/NUTRITION_FAVORITES.md` |
| Water Tracking | Daily hydration log + goal + personal cup/bottle presets | `components/water/*`, `docs/WATER_TRACKING.md`, `docs/WATER_PRESETS.md` |
| Supplements Tracker | Personal supplement/medication tracking (no advice); searchable starter-template library with already-tracked state | `components/supplements/*`, `docs/SUPPLEMENTS_TRACKER.md`, `docs/SUPPLEMENTS_LIBRARY_UX.md` |
| Progress | Totals, weekly counts, protein average, PRs | `components/progress/*`, `lib/analytics.ts` |
| Settings | Premium "control center": appearance (light/dark only), daily goals, water shortcuts, data & storage, access & privacy, separated sensitive actions, system info | `components/settings/SettingsView.tsx`, `docs/SETTINGS_CONTROL_CENTER.md` |
| Learn (Knowledge Center) | Card-based Hebrew articles + protein calculator | `app/learn/*`, `lib/knowledge-content.ts`, `lib/protein.ts` |
| Welcome screen | First-visit intro (gate) | `components/welcome/WelcomeGate.tsx`, `lib/welcome.ts` |
| Private Access Notice | Per-session informational notice (gate) | `components/access/PrivateAccessNotice.tsx`, `lib/private-access.ts` |
| Admin Access Code Gate | Client-side access-code gate (not real auth) | `components/access/AdminAccessCodeGate.tsx`, `lib/admin-access.ts`, `docs/ADMIN_ACCESS_GATE.md` |
| PWA | Installable app shell + service worker | `app/manifest.ts`, `components/ServiceWorkerRegister.tsx`, `public/sw.js` |

## 3. Main routes

Generated by the App Router (`app/`). Rendering mode noted from the build:

| Route | Screen | Render |
| --- | --- | --- |
| `/` | Today | Static |
| `/workouts` | Workouts | Static |
| `/more` | System Hub ("מרכז מערכת") | Static |
| `/exercises` | Exercise Library | Static |
| `/nutrition` | Nutrition | Static |
| `/nutrition/add` | Add / edit food log | Dynamic |
| `/nutrition/library` | Food Library | Dynamic |
| `/nutrition/water` | Water detail | Static |
| `/nutrition/water/presets` | Edit personal water presets | Static |
| `/nutrition/supplements` | Supplements | Static |
| `/nutrition/supplements/add` | Add / edit supplement | Dynamic |
| `/progress` | Progress | Static |
| `/settings` | Settings | Static |
| `/learn` | Knowledge Center index | Static |
| `/learn/[id]` | Knowledge article | SSG (per article) |
| `/manifest.webmanifest` | PWA manifest | Generated (`app/manifest.ts`) |
| `/icon.png`, `/apple-icon.png` | App icons | Generated |

The bottom navigation (`components/layout/nav-items.ts`) is for daily use and
surfaces five destinations: **Today, Workouts, Nutrition, Progress, More**.
Exercises moved out of the bottom nav into the **System Hub** (`/more`), which
gathers every secondary tool (Exercises, Food Library, Add Food, Water,
Supplements, Learn, Settings, Backup, Lock) into module-coloured categories.
Settings, Learn, Water, Supplements and the add/library routes remain reachable
contextually too. The More tab also lights up on `/exercises`, `/settings`, and
`/learn`. See [`NAVIGATION_SYSTEM_HUB.md`](NAVIGATION_SYSTEM_HUB.md).

## 4. Storage / session keys

All keys are prefixed `yfos:`. **Do not rename or repurpose these keys** —
existing user data is bound to them. See §5 for reset behavior.

### Data keys (localStorage) — owned by `lib/storage.ts` (`STORAGE_KEYS`)

| Key | Purpose | Owner module |
| --- | --- | --- |
| `yfos:workouts` | Logged workout sessions | Workouts |
| `yfos:foodLogs` | Food logs (all days) | Nutrition |
| `yfos:settings` | App settings **including the theme** (`settings.theme`), the water goal (`waterGoalMl`) and the personal water presets (`waterPresets`) | Settings / Theme / Water |
| `yfos:workout-templates:v1` | Workout templates (starter set shown until first write) | Workouts |
| `yfos:saved-food-values:v1` | Per-food remembered default macros (map by `sourceFoodId`) | Saved Food Values |
| `yfos:favorite-foods:v1` | Favorite food identities (map by `sourceFoodId`) | Favorite Foods |
| `yfos:water-logs:v1` | Daily hydration logs (one record per date) | Water |
| `yfos:supplements:v1` | Supplement catalogue (active + archived) | Supplements |
| `yfos:supplement-logs:v1` | Date-based "taken" marks (≤1 per supplement/day) | Supplements |

### Gate keys (owned outside `STORAGE_KEYS`)

| Key | Type | Purpose | Owner |
| --- | --- | --- | --- |
| `yfos:welcome-seen:v1` | localStorage | First-visit welcome screen seen flag (`"1"`) | `lib/welcome.ts` |
| `yfos:private-access-notice-accepted:session` | **sessionStorage** | Private-access notice accepted **this session** (`"1"`) | `lib/private-access.ts` |
| `yfos:admin-access-granted:v1` | localStorage | Admin access-code gate unlocked on this device (`"1"`) | `lib/admin-access.ts` |

> The theme has **no separate key** — it is a field inside `yfos:settings`. The
> pre-paint `THEME_INIT_SCRIPT` reads `yfos:settings` directly. The three gates
> use pre-paint init scripts that toggle `.welcome-seen` /
> `.private-access-accepted` / `.admin-access-granted` on `<html>` so returning
> users never see a flash.

## 5. Reset behavior

| Action (Settings) | What it clears | What it preserves |
| --- | --- | --- |
| **Reset all data** (`resetAll`) | All 9 `STORAGE_KEYS` data keys, incl. `yfos:settings` (theme returns to the default `light`) | All gate flags (`welcome-seen`, `private-access`, `admin-access`) — gates are not "data" |
| Reset saved food values | `yfos:saved-food-values:v1` only | Food logs, favorites |
| Reset favorite foods | `yfos:favorite-foods:v1` only | Food logs, saved values |
| Reset supplements | `yfos:supplements:v1` (deleting a supplement also drops its logs) | Other modules |
| Reset supplement log | `yfos:supplement-logs:v1` only | The supplement catalogue |
| Reset water day | One date inside `yfos:water-logs:v1` | All other days |
| Show welcome again (`resetWelcome`) | `yfos:welcome-seen:v1` only | All real data |
| Show private notice again (`resetPrivateAccess`) | `yfos:private-access-notice-accepted:session` only | All real data |
| Lock system — "נעל מערכת" (`resetAdminAccess`) | `yfos:admin-access-granted:v1` only — re-shows the access-code gate | All real data |

`resetAll` deliberately does **not** clear the gate flags, and the gate resets
deliberately do **not** touch user data. Keep these concerns separate.

## 6. Data domains

- **Workouts & templates** — `WorkoutSession`, `WorkoutTemplate` (`lib/fitness-types.ts`).
- **Exercises** — static seed of 133 items (`lib/seed-exercises.ts`); images under
  `public/exercises/`, optional verified YouTube demo links (`ExerciseVideo`).
- **Nutrition** — `FoodLog` entries; macros are **always user-entered**.
- **Food library** — static catalogue (`lib/food-library.ts`); images under `public/food/`.
- **Saved food values / favorites** — personal overlays keyed by `sourceFoodId`.
- **Water** — `WaterLog`/`WaterEntry`; `totalMl` is always recomputed from entries.
  Personal quick-add presets (`WaterPreset`) live in settings and default safely.
- **Supplements** — `Supplement` catalogue + `SupplementLog` taken-marks.
- **Settings** — `Settings` (theme, goals, water goal, water presets, protein calc inputs).
- **Knowledge** — static articles (`lib/knowledge-content.ts`) + protein calc (`lib/protein.ts`).

## 7. Architecture notes

- **Storage layer (`lib/storage.ts`)** is the *only* place that touches
  `localStorage` for app data. Everything is funneled through `readJSON`/`writeJSON`
  helpers that fail silently and are SSR-safe (`isBrowser()` guard).
- **Reactive layer (`lib/fitness-store.ts`)** wraps storage with
  `useSyncExternalStore`, caching snapshots and invalidating on mutation — no
  `setState`-in-effect, no hydration mismatch (server snapshots are stable
  constants; the real client value swaps in after mount).
- **Pure derivations (`lib/analytics.ts`, `lib/today.ts`)** never touch storage —
  callers pass data in, so they stay testable and SSR-safe. `lib/today.ts` adds
  the Today daily-completion + deterministic next-action logic (no AI/advice).
- **Gates (`lib/welcome.ts`, `lib/private-access.ts`, `lib/admin-access.ts`)**
  mirror that same `useSyncExternalStore` shape and expose pre-paint init
  scripts. The admin gate fails **closed** (storage hiccup keeps it up); the
  other two fail open.
- **Theme (`components/ThemeProvider.tsx`)** supports only `light`/`dark` and
  toggles `.dark` on `<html>`; the saved value lives in settings. A legacy
  `theme: "system"` (or any unknown value) is sanitized to `light` on read
  (`sanitizeTheme` in `lib/storage.ts`) — never crashing, never re-persisting
  `system`, and matching the pre-paint `THEME_INIT_SCRIPT` so there is no flash.
- All four `<head>` init scripts (theme + 3 gates) run before paint to prevent
  flashes; `RootLayout` nests
  `PrivateAccessNotice → AdminAccessCodeGate → WelcomeGate → AppShell`.

## 8. Product boundaries — what must NOT be broken

- **No medical advice.** The app never diagnoses, prescribes, or recommends.
- **No supplement recommendations or dosages.** The supplements tracker only
  records what the user already decided to take; dosage text is free-form user
  input, never generated. Neutral category names only.
- **Nutrition values are user-entered only** — never inferred from images or
  external databases. Saved values and favorites never auto-fill macros.
- **Exercise videos are external demonstrations** (YouTube links, never embedded
  or hosted) — not medical or physical-therapy advice.
- **The Private Access Notice is informational only** — not authentication, no
  password, no backend check, no tracking. Fails open if storage is unavailable.
- **The Admin Access Code Gate is a client-side code gate** — not real auth, no
  backend check, no device detection, no tracking. The code lives in the bundle
  and is not a secret. Fails closed if storage is unavailable. See
  `docs/ADMIN_ACCESS_GATE.md`.
- **The Welcome screen is a first-visit intro** — not a gate that protects data.
- **No backend / auth / database / cloud sync / AI / external APIs** currently.
- Storage keys, exercise ids, exercise images, food data/images and supplement
  safety copy are stable contracts — do not change them in breaking ways.

## 9. Known future directions

- Optional Capacitor wrapper for a native Android/iOS build (no native code yet).
- Possible surfacing of structured data (templates, progress, knowledge, protein
  goal) inside a larger "Life OS" — data models are intentionally clean for this.
- `Exercise.videoUrl` and richer video metadata are reserved for future phases.
- **Personal Path / Smart Setup** — an optional future personal-setup flow. Not
  implemented; the System Hub shows a non-interactive "מסלול אישי · בקרוב" card
  as its placeholder entry point. No onboarding flow is forced now.

These are directions, **not** current scope — none of the hard boundaries in §8
change without an explicit new phase.
