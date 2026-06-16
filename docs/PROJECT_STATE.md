# Yuval Fit OS — Project State

> Central, always-current snapshot of what the app is, how it is wired, and what
> must not be broken. **New agents should read this first**, then
> [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) for how to run, test and extend it.
>
> Last reviewed: Phase 3.xx (**Beta Access Requests**: the Beta Access System
> gained a self-service request + approval loop. An unapproved signed-in user now
> sees a **`בקש גישה`** CTA on the denied screen (`BetaAccessDenied`) that files a
> row in a new **`beta_access_requests`** queue (status `pending`); the screen
> then shows a calm pending / already-sent / rejected state. Admins see a
> **`בקשות גישה ממתינות`** section and a `ממתינים` count in `/admin/beta`
> (`BetaAdminView`) and can **אשר** (approve — atomically writes/reactivates an
> active `beta_allowed_users` row via the SECURITY DEFINER `approve_beta_request`
> RPC, marks the request approved), **דחה** (reject — `reject_beta_request` RPC,
> no access granted), or **מחק**. The request table is a **queue only** —
> `beta_allowed_users` stays the single source of truth for entry, so a forged
> request row grants nothing. RLS: a user reads/inserts only their OWN request and
> only as `pending` (no update/delete), and **cannot self-approve** (status
> changes are admin-only RPCs that re-check `is_beta_admin()` server-side). Blocked
> users still see the blocked screen (no request CTA), so they cannot bypass by
> re-requesting. Enforcement is Row Level Security (`supabase/beta-access.sql`);
> browser uses only the public anon key; no service-role key. **No fitness data
> moved to the cloud** — only request/access metadata lives in Supabase. Rerun the
> SQL to upgrade existing installs (`create table if not exists` + safe
> `drop/create policy`). See [`BETA_ACCESS_SYSTEM.md`](BETA_ACCESS_SYSTEM.md).)
> Latest: Phase 3.xx (**Today Product Clarity Pass — Part 2**: a follow-up
> affordance/copy pass after real-UI feedback that the Part 1 collapsible
> `סיכום היום` row looked static (users couldn't tell it was tappable). The bare
> heading-row toggle is now a **full card-like `<button>`** that unmistakably
> reads as an expandable control: a leading `ListIcon` tile, a `הצג פירוט תזונה
> ואימון` → `פירוט תזונה ואימון` subtitle, the protein hint demoted to a small
> pill, and an explicit `פתח`/`סגור` action chip with an up/down `ChevronDownIcon`
> that rotates 180° when open. The whole card is the tap target; affordance never
> relies on the chevron or colour alone. Wired for a11y: native button,
> `aria-expanded`, and `aria-controls="today-summary-panel"` (matching `id` on the
> revealed panel). Presentation only — summary still collapsed by default, the
> expanded nutrition + workout cards unchanged, and active gym/workout promotion,
> state-aware gym copy, water reset + over-goal states, and quick actions all
> preserved. **No** `lib/today.ts` / `lib/gym-attendance.ts` logic, storage keys,
> schemas, backup format, routes, gates, or save behaviour changed. The Today
> e2e spec was extended (still 47 passed). See
> [`TODAY_CLARITY_PASS.md`](TODAY_CLARITY_PASS.md).)
> Prior: Phase 3.xx (**Today Product Clarity Pass — Part 1**: a UX
> clarity/hierarchy pass on the Today screen so it reads as a daily command
> center, not a stack of same-weight cards. Two changes, presentation only:
> (1) **`סיכום היום` is demoted to a collapsible section, closed by default** —
> it duplicated the compact `מבט מהיר` status strip at full visual weight, so the
> detailed nutrition + workout cards now hide behind a toggle (`aria-expanded`)
> whose header still surfaces the one fact the strip lacks (protein-toward-goal,
> e.g. `נותרו 80 ג׳ חלבון`). (2) **Gym card copy is state-aware**: when a visit
> was already saved today the primary action is now **`צפה בביקור היום`**
> (link to `/gym`) with a quiet `נכנסתי שוב למכון` re-entry path, instead of a
> bold `נכנסתי למכון` that sounded like a duplicate check-in — the same-day
> re-entry confirmation dialog is unchanged. The active gym visit and in-progress
> workout draft stay promoted directly under Next Action. **No** `lib/today.ts` /
> `lib/gym-attendance.ts` logic, storage keys, schemas, backup format, routes,
> gates, or save behaviour changed; water + active-workout behaviour preserved.
> `e2e/today-command-center.spec.ts` added (5 specs); full e2e 47 passed. See
> [`TODAY_CLARITY_PASS.md`](TODAY_CLARITY_PASS.md).)
> Prior: Phase 3.xx (**Disabled nutrition scan card**: when AI is **not**
> configured, `/nutrition` no longer hides the scan slot — it shows a calm,
> inert **`בקרוב`** "coming soon" card (`PhotoScanCardDisabled` in
> `components/nutrition/PhotoScanCard.tsx`) so users see the feature exists.
> Active vs disabled is chosen by `aiEnabled` in `NutritionView`; the disabled
> card mounts **no** file input, has **no** click handler/overlay, and **never**
> calls `POST /api/nutrition/analyze-photo` — manual add + `הוסף שוב` stay visible
> and usable directly below. Copy: title `סרוק צלחת`, subtitle
> `ניתוח ארוחה מתמונה יופעל בקרוב`, trust line
> `בינתיים אפשר להוסיף ידנית או להשתמש ב־הוסף שוב`, `בקרוב` badge, disabled
> `לא פעיל כרגע` button; a non-prod-only dev/admin helper
> (`showSetupHint` from `app/nutrition/page.tsx`) adds
> `הפיצ׳ר מוכן, אבל עדיין לא חובר מפתח AI בסביבת הפרודקשן.`. `/nutrition` stays
> `force-dynamic`, so adding a key later flips the card to active with no rebuild.
> **No** AI provider/route/server-env/`FoodLog`/localStorage/backup/Supabase/auth
> change. e2e now builds once then runs two `next start` servers — :3939 (mock,
> active) + :3940 (no AI, disabled, `e2e/nutrition-photo-disabled.spec.ts`) via
> `scripts/e2e.mjs`. See [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md).)
> Prior: Phase 3.xx (**Nutrition Photo Assist — photo-first logging**: `/nutrition`
> is now **scan-first**. When AI is configured a large **`סרוק צלחת`** card is the
> primary action (under `MacroSummary`); the user photographs a meal, a server
> route returns an **editable draft**, and only on **`נראה טוב, הוסף ליומן`** is the
> entry saved. Manual add + **`הוסף שוב`** (recents folded in) stay as always-visible
> fallbacks; water/supplements/protein/library move into lower `מעקבים נוספים` /
> `כלים נוספים` bands. New: `app/api/nutrition/analyze-photo/route.ts` (GET
> capability + POST analyze, `nodejs`/`force-dynamic`), `lib/nutrition-ai.ts`
> (**server-only** adapter, `fetch` to a vision model, mock seam), `lib/nutrition-photo.ts`
> (client-safe types/validation/mapping), `components/nutrition/PhotoScanCard.tsx`
> + `PhotoDraftReview.tsx`. Hard rules enforced: **estimate-only** (`הערכה בלבד`,
> per-item confidence), **no auto-save**, **no image storage**, **no AI key in the
> client** (server-only `NUTRITION_AI_API_KEY`/`ANTHROPIC_API_KEY`; `NUTRITION_AI_MODEL`;
> `NUTRITION_AI_MOCK=1` dev seam). **No key → scan card shows an inert `בקרוב`
> state** (see the Latest entry; `isNutritionAiConfigured` gates active vs
> disabled via `aiEnabled`), no dead CTA, manual/recent work normally. A
> confirmed draft maps onto the existing `FoodLog` and is written via the existing
> `addFoodLog` → `yfos:foodLogs`: **no new storage key, no schema change, no
> Supabase/DB change, no backup change**; photo entries appear in the summary,
> diary, recents and export like any other. `BetaAuthGate`/guest/admin rules
> unchanged. Added devDependency usage: Playwright e2e (`e2e/nutrition-photo.spec.ts`,
> `playwright.config.ts`). See [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md).)
> Prior: Phase 3.xx (**Beta Welcome Notice**: the old `PrivateAccessNotice`
> ("מערכת פרטית / do not share the link") was removed from the active gate chain
> and replaced by a warm, friendly `BetaWelcomeNotice`
> (`components/access/BetaWelcomeNotice.tsx`, z-104, `lib/beta-welcome.ts`,
> `yfos:beta-welcome-seen:v1`) shown once AFTER the real access gate lets a user
> (approved or guest) in. Access is now controlled by login + approved emails, so
> the onboarding message welcomes testers and shares Yuval's contact
> (053-333-9341 / wa.me/972533339341) instead of warning about sharing links. No
> auth/security/database/user-data schema changed. See
> [`BETA_WELCOME_NOTICE.md`](BETA_WELCOME_NOTICE.md).)
> Prior: Phase 3.xx (**Beta Access System**: real access control. A new
> Supabase-Auth gate (`components/access/BetaAuthGate.tsx`, z-108) is now the REAL
> beta boundary — a user must sign in (Google / email magic link) **and** be on the
> approved-email list (`beta_allowed_users`, status `active`) to enter; not
> approved → `BetaAccessDenied`, blocked → blocked screen. Admins
> (`beta_admins`) manage the list from an in-app panel at **`/admin/beta`**
> (`components/admin/BetaAdminView.tsx`); the entry point appears only for admins
> in Settings → "חשבון בטא" and the System Hub. Enforcement is Row Level Security
> (`supabase/beta-access.sql`); the browser uses only the public anon key; no
> service-role key, no custom passwords. The app **builds/runs with no env vars**
> — missing config fails **closed** in production (and shows a dev setup screen
> with a continue button locally); `NEXT_PUBLIC_BETA_DISABLE_GATE=1` is a
> testing-only seam. Sign-out (Settings) offers keep-or-clear local data. The
> legacy client-side admin code gate (`yuvalzakay123`) was removed from the
> production chain (files kept as a dev fallback). **No fitness data moved to the
> cloud** — workouts/nutrition/water/supplements/gym/backup all stay
> localStorage-only; no schema/storage/route/nav regressions. Added dependency:
> `@supabase/supabase-js`. See [`BETA_ACCESS_SYSTEM.md`](BETA_ACCESS_SYSTEM.md).)
> Prior: Phase 3.xx (Today **command-center polish**: a UI/UX hierarchy +
> compactness pass that de-duplicates Today's CTAs and sharpens the top-down
> order. A new **active-state slot** sits directly under the Next Action card: a
> **live gym visit** is promoted there (`GymTodayCard`'s `אתה במכון עכשיו` live
> state — and the lower `נוכחות במכון` idle section is then suppressed so it never
> shows twice), alongside a read-only `ActiveWorkoutResumeCard` (`אימון בתהליך`)
> for an in-progress workout draft. The full water card is hidden while water is
> the current Next Action (status stays in the `מבט מהיר` strip; the compact card
> returns once water is logged); the supplements card mounts only when supplements
> are configured (no dominating empty state); the nutrition summary lost its
> duplicate `הוסף אוכל` CTA grid; quick actions are compacted. TodayView only
> *reads* `useActiveGymVisit()` for placement — gym check-in/out logic, and
> `lib/today.ts` (Next Action + completion), are unchanged. No storage keys /
> schemas / routes / save behaviour / nav / gates changed; no
> backend/auth/AI/API/database/cloud/GPS/native and no new dependencies. All
> actions remain reachable. See
> [`TODAY_COMMAND_CENTER_POLISH.md`](TODAY_COMMAND_CENTER_POLISH.md).
> Prior: Phase 3.xx (**Nutrition Quick Reuse**: the Nutrition screen
> (`components/nutrition/NutritionView.tsx`) now makes daily logging fast with
> one-tap reuse. A new **`אכלת לאחרונה`** section shows a compact, scrollable row
> of recently-logged foods (name, meal-type, quantity, calories, P/C/F) each with
> a **`הוסף שוב`** button, and every *היומן של היום* row gained its own `הוסף שוב`
> action. Tapping it duplicates that entry into today's journal — a **new id** +
> today's local date, all other values preserved, the **original never mutated** —
> and shows a calm auto-dismissing **`נוסף ליומן של היום`** toast. Recent foods are
> derived **purely from the existing `yfos:foodLogs` history** via the new pure
> `lib/nutrition-reuse.ts` (`getRecentFoodEntries` / `createFoodLogFromExistingEntry`
> / `normalizeRecentFoodKey`, de-duped by source-id-or-name + quantity + macros,
> capped at 8) — **no new storage key, no `FoodLog` schema change**. The old
> "אחרונים" deep-link chips (which forced re-entering values) were replaced by this
> richer reuse section; the previous `recentFoods()` helper moved out of
> `lib/analytics.ts`. Favorites and saved values stay separate and untouched;
> Backup & Restore is unchanged (recent list re-derives after a restore). Today and
> the Add-Food screen were intentionally not cluttered. localStorage-only, no
> backend/auth/AI/API/cloud/native. See
> [`NUTRITION_QUICK_REUSE.md`](NUTRITION_QUICK_REUSE.md).
> Prior: Phase 3.xx (**Gym Check-In polish**: the Today gym card
> (`GymTodayCard`) is now a **prominent primary-routine card** — idle shows the
> day status (`עדיין לא נכנסת למכון היום` / `כבר נשמר ביקור במכון היום`) with
> `נכנסתי למכון`; active shows a strong live state (`אתה במכון עכשיו`, entry time
> + live `HH:MM:SS` `משך שהייה`, `סיים שהייה במכון`). Saved visits on `/gym` now
> show richer details (check-in date, `כניסה`/`יציאה` times, worded duration, and
> a **linked-workout** summary). At check-out, workouts saved **during the visit's
> local-day window** are snapshotted onto the visit as a display-only
> `GymVisit.workouts?` (workout history is never read back or altered; a workout is
> never required to finish a visit). A **same-day re-entry guard** prevents
> accidental duplicates: while a visit is open there is no check-in path, and after
> a visit was already completed today a check-in asks
> `כבר נשמר ביקור במכון היום` before starting another. The optional `workouts`
> field is additive — old visits load and restore unchanged (`backupVersion` stays
> `1`); the linked-workout line shows `לא קושר אימון לביקור הזה`. No workout/
> nutrition schema, save-behavior, backup-format, or bottom-nav changes;
> localStorage-only, no backend/auth/AI/API/cloud/GPS/native. See
> [`GYM_CHECK_IN.md`](GYM_CHECK_IN.md).
> Prior: Phase 3.xx (**Gym Check-In / Check-Out**: a new `/gym` screen
> (`components/gym/GymView.tsx`, `lib/gym-attendance.ts`) tracks **gym
> attendance** — manual check-in when you enter the gym and check-out when you
> leave — kept fully **separate from workout logging**. A *workout session* is
> exercises/sets/kg/reps; a *gym visit* is only being at the gym: entry time,
> exit time, date, duration. Check-in creates a single active visit
> (`אתה במכון` + entry time + a live `HH:MM:SS` timer); check-out saves a
> `GymVisit` to history (`השהייה נשמרה`). The active visit persists in
> localStorage and the timer is **derived from `startedAt`**, so it survives
> refresh / app close. A visit open ≥ 6h shows a calm "forgot to check out?"
> prompt — it is **never auto-closed** and an exit time is **never guessed**;
> **no GPS / no location** is ever used. Deleting the open visit or a saved
> visit are both confirm-gated. Two new additive keys
> (`yfos:gym-visits:v1`, `yfos:active-gym-visit:v1`) are owned by
> `lib/gym-attendance.ts` (own `useSyncExternalStore` layer, mirroring the
> active-workout draft) — outside `STORAGE_KEYS`, but **included in Backup &
> Restore** (`gymVisits` / `activeGymVisit`) and cleared by "reset all data".
> Surfaced on Today (compact quick card), the System Hub *כושר* group, the
> Workouts screen, and Progress (compact attendance stats). No workout/nutrition/
> water/supplement schema, save-behavior, draft, or bottom-nav changes;
> localStorage-only, no backend/auth/AI/API/cloud/native. See
> [`GYM_CHECK_IN.md`](GYM_CHECK_IN.md).
> Prior: Phase 3.xx (**Backup & Restore**: a new `/backup` screen
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
| Nutrition | Daily food logs + macro totals, plus **quick reuse**: an `אכלת לאחרונה` row and per-entry `הוסף שוב` that re-log a previous food in one tap (derived from logs, no new storage) | `components/nutrition/NutritionView.tsx`, `lib/nutrition-reuse.ts`, `docs/NUTRITION_QUICK_REUSE.md` |
| Food Library | Visual catalogue of foods to log from | `components/nutrition/FoodLibrary*`, `lib/food-library.ts` |
| Saved Food Values | User's remembered per-food default macros | `docs/NUTRITION_SAVED_VALUES.md` |
| Favorite Foods | Quick-access favorites (identity only, no macros) | `docs/NUTRITION_FAVORITES.md` |
| Water Tracking | Daily hydration log + goal + personal cup/bottle presets, plus a graduated goal-completion / over-goal banner (celebration at 100%, calm amber/rose over-goal states, non-medical wording). Status now colours **every** water surface (Today/Nutrition card, detail hero, gauge) and crossing 100% fires an app-wide celebration overlay from any add surface | `components/water/*`, `lib/water-status.ts`, `lib/water-goal-events.ts`, `docs/WATER_TRACKING.md`, `docs/WATER_PRESETS.md`, `docs/WATER_GOAL_UX_UPGRADE.md`, `docs/WATER_GOAL_GLOBAL_CELEBRATION.md` |
| Supplements Tracker | Personal supplement/medication tracking (no advice); searchable starter-template library with already-tracked state | `components/supplements/*`, `docs/SUPPLEMENTS_TRACKER.md`, `docs/SUPPLEMENTS_LIBRARY_UX.md` |
| Progress | Premium weekly insights screen: weekly hero, rule-based insight cards, 7-day activity trends, human empty states, and personal records — derived purely from existing local data (no AI) | `components/progress/*`, `lib/analytics.ts`, `lib/progress-insights.ts`, `docs/PROGRESS_INSIGHTS_UPGRADE.md` |
| Gym Attendance | Local gym check-in / check-out: prominent Today card, live visit timer, weekly stats (visits, time, avg, last), rich visit history (entry/exit/duration + display-only linked-workout snapshot matched by local day), same-day re-entry guard. Tracks *being at the gym* — separate from workout logging. No GPS | `components/gym/*`, `lib/gym-attendance.ts`, `docs/GYM_CHECK_IN.md` |
| Settings | Premium "control center": appearance (light/dark only), daily goals, water shortcuts, data & storage (incl. a Backup & Restore card), access & privacy, separated sensitive actions, system info | `components/settings/SettingsView.tsx`, `docs/SETTINGS_CONTROL_CENTER.md` |
| Backup & Restore | Local JSON export/import of all Fit OS data: Blob download (+ copy/paste fallback), validated import with counts preview + confirm, last-backup status. No backend/auth/cloud/encryption | `components/backup/BackupView.tsx`, `lib/backup.ts`, `docs/BACKUP_RESTORE.md` |
| Learn (Knowledge Center) | Card-based Hebrew articles + protein calculator | `app/learn/*`, `lib/knowledge-content.ts`, `lib/protein.ts` |
| Welcome screen | First-visit intro (gate) | `components/welcome/WelcomeGate.tsx`, `lib/welcome.ts` |
| Beta Welcome Notice | One-time friendly beta greeting after the access gate (gate) | `components/access/BetaWelcomeNotice.tsx`, `lib/beta-welcome.ts`, `docs/BETA_WELCOME_NOTICE.md` |
| Private Access Notice | _Removed from the active flow_ — superseded by the Beta Welcome Notice; files kept only as a reference | `components/access/PrivateAccessNotice.tsx`, `lib/private-access.ts` |
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
| `/gym` | Gym Attendance | Static |
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
contextually too. The More tab also lights up on `/exercises`, `/settings`, `/learn`,
and `/gym`. See [`NAVIGATION_SYSTEM_HUB.md`](NAVIGATION_SYSTEM_HUB.md).

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
| `yfos:beta-welcome-seen:v1` | localStorage | Friendly beta welcome notice acknowledged (`"1"`) — shown once after the access gate | `lib/beta-welcome.ts` |
| `yfos:private-access-notice-accepted:session` | **sessionStorage** | _Defunct_ — old private-access notice flag, no longer read (notice removed from the flow) | `lib/private-access.ts` |
| `yfos:admin-access-granted:v1` | localStorage | Admin access-code gate unlocked on this device (`"1"`) | `lib/admin-access.ts` |
| `yfos:active-workout-draft:v1` | localStorage | **Single** in-progress active-workout draft (auto-saved). NOT history — separate from `yfos:workouts`; cleared on final save / explicit discard | `lib/active-workout-draft.ts` |
| `yfos:gym-visits:v1` | localStorage | Gym **attendance** history (`GymVisit[]`). Separate from `yfos:workouts` — being at the gym, not training. Each visit may carry an optional, additive `workouts?` display-only snapshot (no format/version change). Included in backups; cleared by `resetAll` | `lib/gym-attendance.ts` |
| `yfos:active-gym-visit:v1` | localStorage | **Single** open gym visit (`startedAt` only; the timer is derived). Closed into history on check-out, removed on discard. Included in backups; cleared by `resetAll` | `lib/gym-attendance.ts` |
| `yfos:backup-meta:v1` | localStorage | Backup bookkeeping only (`lastExportedAt` / `lastRestoredAt` / `lastRestoredBackupCreatedAt`). Best-effort status; **never** part of a backup and not "data" | `lib/backup.ts` |
| `yfos:water-goal-celebration-seen:v1` | localStorage | Anti-spam flag for the app-wide water-goal celebration (stores the last date it played). Isolated bookkeeping; **never** part of a backup and not "data". Re-armed when intake drops below the goal; cleared by `resetAll` | `lib/water-goal-events.ts` |

> The active-workout **draft** is intentionally outside `STORAGE_KEYS` and the
> history key (`yfos:workouts`): it is a recoverable in-progress slot, not a
> saved workout. See [`ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md`](ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md).
>
> The theme has **no separate key** — it is a field inside `yfos:settings`. The
> pre-paint `THEME_INIT_SCRIPT` reads `yfos:settings` directly. The three gates
> use pre-paint init scripts that toggle `.welcome-seen` /
> `.beta-welcome-seen` / `.admin-access-granted` on `<html>` so returning
> users never see a flash.

## 5. Reset behavior

| Action (Settings) | What it clears | What it preserves |
| --- | --- | --- |
| **Reset all data** (`resetAll`) | All 9 `STORAGE_KEYS` data keys, incl. `yfos:settings` (theme returns to the default `light`), **plus** the gym keys (`yfos:gym-visits:v1`, `yfos:active-gym-visit:v1`) via `clearAllGymData()` | All gate flags (`welcome-seen`, `beta-welcome-seen`, `admin-access`) — gates are not "data" |
| Reset saved food values | `yfos:saved-food-values:v1` only | Food logs, favorites |
| Reset favorite foods | `yfos:favorite-foods:v1` only | Food logs, saved values |
| Reset supplements | `yfos:supplements:v1` (deleting a supplement also drops its logs) | Other modules |
| Reset supplement log | `yfos:supplement-logs:v1` only | The supplement catalogue |
| Reset water day | One date inside `yfos:water-logs:v1` | All other days |
| Show welcome again (`resetWelcome`) | `yfos:welcome-seen:v1` only | All real data |
| Show beta notice again (`resetBetaWelcome`) | `yfos:beta-welcome-seen:v1` only | All real data |
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
- **Gates (`lib/welcome.ts`, `lib/beta-welcome.ts`, `lib/admin-access.ts`)**
  mirror that same `useSyncExternalStore` shape and expose pre-paint init
  scripts. The admin gate fails **closed** (storage hiccup keeps it up); the
  other two fail open.
- **Theme (`components/ThemeProvider.tsx`)** supports only `light`/`dark` and
  toggles `.dark` on `<html>`; the saved value lives in settings. A legacy
  `theme: "system"` (or any unknown value) is sanitized to `light` on read
  (`sanitizeTheme` in `lib/storage.ts`) — never crashing, never re-persisting
  `system`, and matching the pre-paint `THEME_INIT_SCRIPT` so there is no flash.
- The `<head>` init scripts (theme + welcome + beta-welcome) run before paint to
  prevent flashes; `RootLayout` nests
  `BetaAuthGate → BetaWelcomeNotice → WelcomeGate → AppShell`.

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
