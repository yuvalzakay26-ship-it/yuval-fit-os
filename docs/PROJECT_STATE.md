# Yuval Fit OS — Project State

> Central, always-current snapshot of what the app is, how it is wired, and what
> must not be broken. **New agents should read this first**, then
> [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) for how to run, test and extend it.
>
> Last reviewed: Phase 3.xx (**Backup & Restore**: a new `/backup` screen
> (`components/backup/BackupView.tsx`, `lib/backup.ts`) lets the user export all
> their Fit OS data to a private `fit-os-backup-YYYY-MM-DD.json` file and import
> it back. Local JSON export/import only — **no backend, no auth, no cloud, no
> encryption**. Export uses a Blob download with a copy-text / show-text fallback
> for download-blocking WebViews; restore validates the whole file first, shows a
> counts **preview**, requires an explicit `ConfirmDialog`, then writes to
> `localStorage` and prompts a reload. Backup includes the nine user-data keys +
> the active-workout draft (driven by `BACKUP_MODULES`, mapped to the real
> `STORAGE_KEYS`); it **excludes** the welcome/private/admin gate flags and its
> own bookkeeping key. One new additive key `yfos:backup-meta:v1`
> (`lastExportedAt` / `lastRestoredAt`) surfaces last-backup status via a
> `useSyncExternalStore` layer. Reachable from Settings (*נתונים ואחסון*) and the
> System Hub *מערכת* group; not in the bottom nav. No schema / existing
> storage-key / route (beyond adding `/backup`) / save-behavior changes;
> localStorage-only. See [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md).
> Prior: Phase 3.xx (**Progress Insights upgrade**: the Progress screen
> (`/progress`) is no longer a static stats grid — it now leads with a premium
> weekly hero (`השבוע שלך`: one calm motivating line + compact
> אימונים/מים/חלבון metrics), then rule-based weekly insight cards
> (`תובנות השבוע`), a compact 7-day Sun→Sat activity grid (`מגמות שבועיות`,
> CSS-only — filled/empty/future per day), and a stronger personal-records
> section (`שיאים אישיים`: ranked, trophy on #1, muscle group + reps context).
> Cold `—` placeholders were replaced with short human empty states (e.g.
> `אין מספיק נתוני מים השבוע`, `הוסף עוד יומיים של תזונה כדי לראות ממוצע`). All
> insights are deterministic derivations over existing local data in the new pure
> `lib/progress-insights.ts` (`weeklyHero` / `weeklyInsights` / `weeklyActivity` /
> `personalRecords`) — NO AI, NO advice, NO new data model. No schema /
> storage-key / route / navigation / Today / save-behavior changes;
> localStorage-only, no backend/auth/AI/API. See
> [`PROGRESS_INSIGHTS_UPGRADE.md`](PROGRESS_INSIGHTS_UPGRADE.md).
> Prior: Phase 3.xx (Active workout **collapsible exercise cards**: each
> exercise card in the builder now has a small chevron toggle (`הצג סטים` /
> `הסתר סטים`, `aria-expanded`) that minimises it to a premium muscle-tinted
> compact summary (`X סטים · Y מתוך X בוצעו`, plus the shared header image / name
> / muscle / previous-performance / `עכשיו`·`הושלם` badges) and expands it back
> to the full kg/reps/completed editing card — so a 4–6 exercise session stops
> being an endless scroll. A single `מזער הכל` / `פתח הכל` control collapses or
> expands everything at once. **Collapse is visual only**: it lives in
> component-local state keyed by `exerciseId`, never enters `entries`, the draft,
> or saved history, never triggers a draft write, and never touches a
> kg/reps/completed value. New exercises start expanded; nothing auto-collapses;
> reorder mode hides the collapse controls and preserves each card's state on
> exit; a restored draft comes back fully expanded with all values intact. No
> schema / storage-key / payload / routes / draft-shape changes; localStorage-only,
> no backend/auth/AI/API. See
> [`ACTIVE_WORKOUT_COLLAPSIBLE_CARDS.md`](ACTIVE_WORKOUT_COLLAPSIBLE_CARDS.md).
> Prior: Phase 3.xx (Active workout **auto-save draft**: the in-progress
> session is auto-saved locally under a new key `yfos:active-workout-draft:v1` so
> leaving the builder before `סיים ושמור אימון` no longer loses data. On return a
> premium restore card (`נמצא אימון שלא נשמר`) offers `המשך אימון` / `מחק טיוטה`;
> a calm `נשמר אוטומטית` status shows in the session hero. The draft is separate
> from history — final save clears it and still appends exactly one
> `WorkoutSession`; empty/untouched builders never create a prompt; a
> new/template session that meets an existing draft shows a conflict choice
> instead of silently overwriting it. No history schema / storage-key / payload /
> routes / final-save changes; localStorage-only, no backend/auth/AI/API.
> See [`ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md`](ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md).
> Prior: Phase 3.xx.2 (Active workout reorder — **drag motion polish**:
> the dragged exercise now lifts into a **floating overlay clone** that follows
> the pointer in **both X and Y** (`scale(1.03)` + identity glow) while the source
> row stays as a faded, dashed **ghost placeholder**; order is still computed from
> the pointer's Y / row midpoints, so the floating card can roam horizontally for
> a natural, physical feel without changing where the entry lands. The overlay is
> portaled with `position: fixed` and positioned from the live pointer
> coordinates, so it never jumps when the array reorders and ignores transformed
> ancestors. Still dependency-free Pointer Events — no new libraries, no visible
> up/down buttons, keyboard ArrowUp/ArrowDown/Home/End still works. Behaviour is
> unchanged: order is just the `entries` array order; reordering relocates the
> whole entry, so kg/reps/completed stay attached and the `עכשיו`
> current-exercise badge recalculates. No schema / storage / save-payload /
> routes changes. See [`ACTIVE_WORKOUT_REORDER.md`](ACTIVE_WORKOUT_REORDER.md).
> Prior: Phase 3.xx.1 reorder drag-only UI polish — the on-row up/down arrow
> buttons were removed for a clean drag-only list (grip handle + Pointer-Events
> drag, ArrowUp/ArrowDown on the focused handle for keyboard accessibility).
> Prior: active workout exercise reorder shipped (the reorder mode itself).
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
| Workouts | Log sessions, build from templates, view history; the active session (builder) is a premium muscle-aware "live workout" experience with an explicit drag-only exercise reorder mode (Pointer-Events drag + keyboard, no data loss) and **collapsible exercise cards** (per-card chevron + `מזער הכל`/`פתח הכל`, visual-only) to tame long sessions | `components/workouts/*`, `docs/ACTIVE_WORKOUT_SESSION_UX.md`, `docs/ACTIVE_WORKOUT_REORDER.md`, `docs/ACTIVE_WORKOUT_COLLAPSIBLE_CARDS.md` |
| Exercise Library | 133 exercises, images, instructions, external demo videos | `components/exercises/*`, `lib/seed-exercises.ts` |
| Nutrition | Daily food logs + macro totals | `components/nutrition/NutritionView.tsx` |
| Food Library | Visual catalogue of foods to log from | `components/nutrition/FoodLibrary*`, `lib/food-library.ts` |
| Saved Food Values | User's remembered per-food default macros | `docs/NUTRITION_SAVED_VALUES.md` |
| Favorite Foods | Quick-access favorites (identity only, no macros) | `docs/NUTRITION_FAVORITES.md` |
| Water Tracking | Daily hydration log + goal + personal cup/bottle presets | `components/water/*`, `docs/WATER_TRACKING.md`, `docs/WATER_PRESETS.md` |
| Supplements Tracker | Personal supplement/medication tracking (no advice); searchable starter-template library with already-tracked state | `components/supplements/*`, `docs/SUPPLEMENTS_TRACKER.md`, `docs/SUPPLEMENTS_LIBRARY_UX.md` |
| Progress | Premium weekly insights screen: weekly hero, rule-based insight cards, 7-day activity trends, human empty states, and personal records — derived purely from existing local data (no AI) | `components/progress/*`, `lib/analytics.ts`, `lib/progress-insights.ts`, `docs/PROGRESS_INSIGHTS_UPGRADE.md` |
| Settings | Premium "control center": appearance (light/dark only), daily goals, water shortcuts, data & storage (incl. a Backup & Restore card), access & privacy, separated sensitive actions, system info | `components/settings/SettingsView.tsx`, `docs/SETTINGS_CONTROL_CENTER.md` |
| Backup & Restore | Local JSON export/import of all Fit OS data: Blob download (+ copy/paste fallback), validated import with counts preview + confirm, last-backup status. No backend/auth/cloud/encryption | `components/backup/BackupView.tsx`, `lib/backup.ts`, `docs/BACKUP_RESTORE.md` |
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
| `/backup` | Backup & Restore | Static |
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
| `yfos:active-workout-draft:v1` | localStorage | **Single** in-progress active-workout draft (auto-saved). NOT history — separate from `yfos:workouts`; cleared on final save / explicit discard | `lib/active-workout-draft.ts` |
| `yfos:backup-meta:v1` | localStorage | Backup bookkeeping only (`lastExportedAt` / `lastRestoredAt` / `lastRestoredBackupCreatedAt`). Best-effort status; **never** part of a backup and not "data" | `lib/backup.ts` |

> The active-workout **draft** is intentionally outside `STORAGE_KEYS` and the
> history key (`yfos:workouts`): it is a recoverable in-progress slot, not a
> saved workout. See [`ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md`](ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md).
>
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
- **Pure derivations (`lib/analytics.ts`, `lib/today.ts`,
  `lib/progress-insights.ts`)** never touch storage — callers pass data in, so they
  stay testable and SSR-safe. `lib/today.ts` adds the Today daily-completion +
  deterministic next-action logic; `lib/progress-insights.ts` adds the Progress
  weekly hero / insight cards / 7-day activity / personal records. Both are
  deterministic, no AI, no advice.
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
