# System Optimization Audit — Phase 1

> **Audit-first, behaviour-preserving.** This document is a *report*. It does not
> change runtime behaviour, UI/UX, schemas, storage keys, auth, backup, or data
> formats. It identifies where Yuval Fit OS can be made faster, cleaner, smaller,
> and less duplicated — and proposes a prioritised Phase-2 plan. **Nothing here is
> applied yet** beyond documentation. Read [`PROJECT_STATE.md`](PROJECT_STATE.md)
> first for canonical state.
>
> Date: 2026-06-17 · Branch: `main` · Baseline commit: `2830e40`

---

## 0. Executive summary

The codebase is in **good health**. It already does the hard things well:
centralised, SSR-safe storage (`lib/storage.ts` + `useSyncExternalStore` stores),
shared UI primitives (`Card`, `Button`, `Badge`, `PageHeader`, `ConfirmDialog`,
`ProgressRing`), a single counter-based scroll-lock hook, and an explicit
backup/restore contract with documented exclusions.

The audit found **no P0 (safety/bug) issues that block anything**. The
opportunities are *surgical, not systemic*:

| Theme | Headline finding | Best opportunity |
|---|---|---|
| Docs | 48 markdown files; well-maintained but cluttered with completed plan/process docs and a few deprecated ones | Archive 3–4 large completed docs; remove 1–2 deprecated; merge "Today" / "Nutrition UX" phase docs |
| Code duplication | Three near-identical celebration overlays (~85% shared); repeated module-card chrome | Extract a `CelebrationOverlay` primitive (highest ROI) |
| Dead code | `AdminAccessCodeGate` + `PrivateAccessNotice` (and their lib modules) are fully unreachable | Candidate removal (deferred — needs explicit sign-off; touches access surface) |
| Performance | `/nutrition` is `force-dynamic` because it reads an env gate at request time | Move the AI-enabled flag to the client (low risk, defer) |
| Storage | Excellent discipline; one undocumented key in reset/backup commentary | Documentation only |
| E2E | 13 specs / 106 tests, all green; setup code duplicated across 8 specs; 1 hard wait | Extract `e2e/fixtures.ts`; replace one `waitForTimeout` |

**Validation:** `npm run build` ✓ (exit 0), `npm run lint` ✓ (0 errors, 1
pre-existing warning), `npm run test:e2e` — see [§11](#11-validation--test-results).

---

## 1. Docs / Markdown audit

> **Applied in Phase 2C (2026-06-17):** the archive/merge pass below was carried
> out. A new `docs/archive/` folder now holds four completed/superseded docs —
> `NUTRITION_PHOTO_ASSIST_PLAN.md`, `NUTRITION_UX.md`, `TODAY_DASHBOARD_UPGRADE.md`,
> and `PRIVATE_ACCESS_NOTICE.md` (all moved with `git mv`, history preserved). The
> media-import docs and `EXERCISE_VIDEO_LINKS_AUDIT.md` / `ADMIN_ACCESS_GATE.md`
> were **left active** (live code/config/doc cross-links). See
> [`SYSTEM_OPTIMIZATION_PHASE_2C.md`](SYSTEM_OPTIMIZATION_PHASE_2C.md) and the
> documentation map in [`PROJECT_STATE.md`](PROJECT_STATE.md) §11. The original
> recommendations are retained below for reference.

**Scope:** 45 files in `docs/` + `README.md`, `AGENTS.md`, `CLAUDE.md` (48 total,
~12,000 lines). **No docs are deleted in this phase** — recommendations only.

### 1.1 Per-file table

| File | Purpose | Status | Reason | Risk |
|---|---|---|---|---|
| `PROJECT_STATE.md` | Canonical state snapshot | **keep** (essential) | Source of truth, current to Phase 4.5 | low |
| `DEVELOPER_GUIDE.md` | How to run/test/extend | **keep** (essential) | Contributor onboarding | low |
| `README.md` | External project intro | **keep** | Entry point; links to the two above | low |
| `AGENTS.md` | Agent safety note (Next.js breaking changes) | **keep** | One-liner, cheap | low |
| `CLAUDE.md` | Redirect to AGENTS.md only | **merge** → inline into/keep pointing at AGENTS.md | No unique content | low |
| `PERSONAL_PROFILE_V1.md` | Profile design + V1–V4 wizard | **keep** | Large but current; encodes "no medical logic" boundary | low |
| `BETA_ACCESS_SYSTEM.md` | Supabase auth gate + admin/approval | **keep** | Real access control; RLS workflow | low |
| `NUTRITION_PHOTO_ASSIST.md` | Shipped photo-assist implementation | **keep** | Current feature spec | low |
| `NUTRITION_PHOTO_ASSIST_PLAN.md` | Original planning doc (superseded) | **archive candidate** | Header marks it as plan-only; implementation shipped | med |
| `EXERCISE_MEDIA_IMPORT.md` | One-time image import pipeline (28 KB) | **archive candidate / shrink** | Completed process; dense how-to | med |
| `FOOD_MEDIA_IMPORT.md` | One-time food image import (27 KB) | **archive candidate / shrink** | Completed process; dense how-to | med |
| `EXERCISE_VIDEO_LINKS_AUDIT.md` | Static verification record (25 KB) | **keep / archive** | Depends on re-audit cadence | low |
| `EXERCISE_VIDEO_LINKS.md` | Video link policy + sources | **keep** | Relevant for future link updates | low |
| `PRIVATE_ACCESS_NOTICE.md` | Deprecated notice (removed from flow) | **archive candidate** | Header says removed from gate chain | low |
| `ADMIN_ACCESS_GATE.md` | Legacy client-side code gate | **update needed** | Mounted only in comments; clarify "legacy/unused" | med |
| `NUTRITION_UX.md` | Earlier `/nutrition` UX pass (3.17.1) | **merge / update** | Overlaps `NUTRITION_CLARITY_PASS.md` | med |
| `NUTRITION_CLARITY_PASS.md` | Later `/nutrition` hierarchy pass | **keep** | Authoritative nutrition layout | low |
| `NUTRITION_QUICK_REUSE.md` | "Recently eaten" / re-log | **keep** | Distinct feature | low |
| `NUTRITION_FAVORITES.md` | Favorite foods | **keep** | Distinct feature | low |
| `NUTRITION_SAVED_VALUES.md` | Per-food remembered defaults | **keep** | Distinct feature | low |
| `WATER_TRACKING.md` | Water module | **keep** | Core module | low |
| `WATER_PRESETS.md` | Quick-add presets | **keep** | Distinct feature | low |
| `WATER_GOAL_UX_UPGRADE.md` | Goal banner + over-goal states | **keep** | UX polish spec | low |
| `WATER_GOAL_GLOBAL_CELEBRATION.md` | App-wide water celebration | **update / clarify** | Title vs scope ambiguity (also references protein) | med |
| `SUPPLEMENTS_TRACKER.md` | Supplement tracking | **keep** | Core module + safety boundary | low |
| `SUPPLEMENTS_LIBRARY_UX.md` | Supplements add/library polish | **keep** | Later polish pass | low |
| `SUPPLEMENT_TAKEN_CELEBRATION.md` | Supplement celebration | **keep** | Distinct event seam | low |
| `PROTEIN_GOAL_CELEBRATION.md` | Protein celebration | **keep** | Distinct event seam | low |
| `TODAY_QUICK_START.md` | Next-action + completion logic | **keep** | Documents `lib/today.ts` | low |
| `TODAY_DASHBOARD_UPGRADE.md` | "Command center" concept (3.23) | **merge** | Overlaps the two Today docs below | med |
| `TODAY_COMMAND_CENTER_POLISH.md` | Hierarchy + promotion polish | **keep** | Recent, describes promotion logic | low |
| `TODAY_CLARITY_PASS.md` | 3-part Today polish | **keep** | Comprehensive, current | low |
| `ACTIVE_WORKOUT_SESSION_UX.md` | Live-session builder identity | **keep** | Builder visual spec | low |
| `ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md` | Draft autosave + restore | **keep** | Core feature | low |
| `ACTIVE_WORKOUT_REORDER.md` | Drag-reorder polish | **keep** | Current feature | low |
| `ACTIVE_WORKOUT_COLLAPSIBLE_CARDS.md` | Collapsible cards (visual) | **keep** | No schema impact | low |
| `WORKOUTS_CLARITY_PASS.md` | `/workouts` hub hierarchy | **keep** | Layout spec | low |
| `PROGRESS_INSIGHTS_UPGRADE.md` | Progress hero/insights (no AI) | **keep** | Documents `lib/progress-insights.ts` | low |
| `BACKUP_RESTORE.md` | Local export/import | **keep** | Core UX feature | low |
| `GYM_CHECK_IN.md` | Gym check-in/out tracking | **keep** | Core feature | low |
| `NAVIGATION_SYSTEM_HUB.md` | `/more` hub structure | **keep** | Nav architecture | low |
| `SETTINGS_CONTROL_CENTER.md` | Settings layout | **keep** | Settings spec | low |
| `BETA_WELCOME_NOTICE.md` | Post-gate welcome (session) | **keep** | Current (Phase 4.2) | low |
| `PRIVACY_TERMS_AI_DISCLAIMER.md` | Legal/info pages | **keep** | Describes legal pages | low |
| `PHONE_INSTALL_QA.md` | Manual PWA install checklist | **keep** (consider move to `qa/`) | QA reference | low |
| `PWA.md` | User-facing install instructions | **keep** | User docs | low |
| `UI_POLISH_PHASE_3_21_1.md` | Visual-quality pass | **keep** | Documents shared visual blocks | low |

### 1.2 Grouped recommendations

- **Deprecated / removed-from-flow:** `PRIVATE_ACCESS_NOTICE.md` (explicitly
  removed), `ADMIN_ACCESS_GATE.md` (legacy, comment-only mount). → Add a clear
  "DEPRECATED / legacy" banner; consider a `docs/archive/` folder in Phase 2.
- **Completed plan/process docs (large, rarely read):**
  `NUTRITION_PHOTO_ASSIST_PLAN.md`, `EXERCISE_MEDIA_IMPORT.md`,
  `FOOD_MEDIA_IMPORT.md` (~83 KB combined). → Move to `docs/archive/` and leave a
  10-line summary + pointer in the active doc.
- **Overlapping phase docs to merge/cross-link:**
  - *Today:* `TODAY_QUICK_START` · `TODAY_DASHBOARD_UPGRADE` · `TODAY_COMMAND_CENTER_POLISH` · `TODAY_CLARITY_PASS` → one "Today screen evolution" doc with a phase timeline (or fold `DASHBOARD_UPGRADE` into `CLARITY_PASS`).
  - *Nutrition UX:* `NUTRITION_UX` (3.17.1) + `NUTRITION_CLARITY_PASS` → consolidate with explicit version order.
- **Must NOT be removed:** `PROJECT_STATE.md`, `DEVELOPER_GUIDE.md`, `README.md`,
  `PERSONAL_PROFILE_V1.md`, `BETA_ACCESS_SYSTEM.md`, `BACKUP_RESTORE.md`, and all
  core feature specs (water/supplement/workout/gym/nutrition/legal).

---

## 2. Code duplication audit

### 2.1 Celebration overlays — **highest-ROI consolidation** ✅ APPLIED (Phase 2A)

> **Status: COMPLETED in System Optimization Phase 2A (2026-06-17).** Extracted
> `components/celebrations/CelebrationOverlay.tsx` — exporting the
> `useCelebrationTrigger(eventName, durationMs, onTrigger?)` state-machine hook
> and the `<CelebrationOverlay>` non-modal shell (CSS classes derived from one
> `variant` prop). The three overlay files are now thin wrappers that keep their
> exact events, durations, decorations, copy, `data-*-celebration` hooks, and the
> supplement's per-event name. **No** behaviour/copy/timing/trigger/key/event
> changes; `lib/*-events.ts` untouched. Validation: lint ✓, build ✓, e2e **100
> green** (all celebration specs included). See
> [`SYSTEM_OPTIMIZATION_PHASE_2A.md`](SYSTEM_OPTIMIZATION_PHASE_2A.md). The
> original analysis is retained below for reference.

`WaterGoalCelebrationOverlay.tsx`, `ProteinGoalCelebrationOverlay.tsx`, and
`SupplementTakenCelebrationOverlay.tsx` are ~80–85% identical. All three share the
same skeleton:

- `useState` for `active` + `runId`, a `setTimeout` teardown ref;
- a `window.addEventListener(<EVENT>, handler)` effect with cleanup;
- re-keyed (`key={runId}`) decorative markup, `pointer-events-none`, high z-index;
- a separate `role="status"` SR announcement;
- CSS-driven animation respecting `prefers-reduced-motion`;
- fixed (non-random) decorative positions (sandbox-safe).

Only the event name, duration (1.3–1.5s), copy, and decorative shapes differ.

| Field | Detail |
|---|---|
| Files | `components/water/WaterGoalCelebrationOverlay.tsx`, `components/nutrition/ProteinGoalCelebrationOverlay.tsx`, `components/supplements/SupplementTakenCelebrationOverlay.tsx` |
| Duplication type | Structural copy-paste (~70 boilerplate lines × 3) |
| Suggested helper | `components/ui/CelebrationOverlay.tsx` accepting `{ eventName, durationMs, parseDetail?, renderContent(runId) }` *(as built in Phase 2A: `components/celebrations/CelebrationOverlay.tsx` — a `useCelebrationTrigger(eventName, durationMs, onTrigger?)` hook + a presentational `<CelebrationOverlay>` shell)* |
| Risk | **low** — independent, never co-mounted; behaviour identical if event dispatch/teardown preserved |
| Benefit | ~150 fewer lines; one place for timer/a11y; trivial to add a 4th celebration |

### 2.2 Module card chrome

10 feature cards build on the shared `Card` but each re-implements the same
"module identity" chrome: a blurred corner glow (`var(--accent-*-soft)`), the
`sheen` class, and an icon badge (`*-gradient … shadow-glow-*`). Repeated across
`WaterCard`, `SupplementsCard`, `GymTodayCard`, `ActiveWorkoutResumeCard`,
`DraftRestoreCard`, `TemplateCard` (glow ×6, sheen ×4, icon badge ×6).

| Field | Detail |
|---|---|
| Suggested helper | `ModuleCard` wrapper + `IconBadge` keyed by `module` ('water'\|'supplement'\|'strength'\|'energy'\|'mg') |
| Risk | **medium** — cards have subtle padding/layout differences; needs careful prop design + visual check |
| Benefit | ~200 fewer lines; one place to tune module color/glow system |

### 2.3 Onboarding / welcome overlays

`WelcomeGate`, `BetaWelcomeNotice`, and `ProfileOnboardingPrompt` share the same
RTL dialog skeleton (`role="dialog"`, `aria-modal`, backdrop, fade/zoom entrance,
fixed z-index) with different content.

| Field | Detail |
|---|---|
| Suggested helper | `components/ui/OverlayDialog.tsx` (`open`, `zIndex`, `onBackdropClick`, animation classes, `titleId`/`descId`) |
| Risk | **low** — independent, different z-indices, never co-mounted |
| Benefit | ~100 fewer lines; unified a11y + backdrop behaviour; all already use the shared `useBodyScrollLock` |

### 2.4 Patterns that are already good (no action)

- **localStorage parsing:** components never touch `localStorage` directly (sole
  exception is the intentional pre-paint `THEME_INIT_SCRIPT`). All reads/writes go
  through `lib/storage.ts` or domain stores. ✓
- **Empty states:** `PageHeader.EmptyState` exists and is used; `SupplementsCard`'s
  inline empty state is a deliberate card-context variant. ✓
- **Chips:** `MuscleChips` (display) and `WaterPresetChips` (interactive) are
  already shared, single-purpose components. ✓
- **Progress indicators:** `ProgressRing` (ring) and `WaterGauge` (themed vessel)
  serve different visual purposes — not duplicates. ✓
- **Forms/wizards:** `FoodLogForm`, `SupplementForm`, `TrainingProfileView` differ
  by schema; no safe consolidation. ✓

---

## 3. Performance audit

`npm run build` succeeded (Turbopack, Next 16.2.9). Turbopack's build output does
**not** print per-route JS sizes, so bundle-byte signals are unavailable from the
build alone; findings below are from static review of the route table + code.

| # | Finding | Location | Why it matters | Safe fix idea | Risk | Priority |
|---|---|---|---|---|---|---|
| P-1 | `/nutrition`, `/nutrition/add`, `/nutrition/library`, `/nutrition/supplements/add` render **dynamic (`ƒ`)** | `app/nutrition/page.tsx:17` (`export const dynamic = "force-dynamic"`) reading `isNutritionAiConfigured()` at request time | Forces server render on every request for pages that are otherwise local-first/static; loses prerender benefits | Expose the AI-enabled flag to the client (e.g. a small `/api` capability check the `PhotoScanCard` already understands, or a build-time `NEXT_PUBLIC_*` flag) so the page can be static again | **medium** (changes how the AI gate is read — verify disabled/enabled UX + the two e2e servers still behave) | P2 |
| P-2 | Three celebration overlays mount app-wide in the layout/shell | overlays in `components/*` | Three permanent event listeners + render trees regardless of route | Already cheap (listeners only); consolidating (§2.1) reduces mounted code. No behavioural change needed | low | P3 |
| P-3 | `useNow`-style live timers (gym visit / active session) | `components/gym/useNow.ts` + consumers | `setInterval` re-render cadence; fine today, watch if more live timers are added | Confirm interval is cleared on unmount (it is) and shared where possible | low | P3 |
| P-4 | Large view components | `TrainingProfileView.tsx`, `water-goal-states`/cards, `NutritionView` | Bigger client components = bigger route chunks | Optional: split wizard steps / heavy views; defer until a real size signal exists | low | P3 |
| P-5 | No measured bundle signal | build tooling | Can't currently see route JS sizes to target the biggest wins | Optional dev-only `@next/bundle-analyzer` run (do **not** add as a shipped dep) to get numbers before any splitting | low | P3 |

**Net:** the only concrete, worthwhile performance item is **P-1** (force-dynamic
nutrition routes). It is deferred to Phase 2 because it changes how the AI gate is
read and must be verified against the disabled/enabled UX and the two e2e servers.

---

## 4. Bundle / import / dead-code audit

All "unused" claims below were confirmed by grep (0 external imports). **Nothing is
removed in this phase.**

| Candidate | Evidence | Safe removal/refactor path | Risk |
|---|---|---|---|
| `components/access/AdminAccessCodeGate.tsx` | Imported **0×**; referenced only in `app/layout.tsx` **comments** (lines 73–77) | Remove component **and** its sole consumer-less lib `lib/admin-access.ts` together; update `PROJECT_STATE.md` §8 + `ADMIN_ACCESS_GATE.md` | **medium** (touches access surface — needs explicit sign-off; see §8) |
| `components/access/PrivateAccessNotice.tsx` | Imported **0×**; explicitly "removed from this chain" comment in `app/layout.tsx` | Remove component + `lib/private-access.ts`; update docs | **medium** (access surface; sign-off) |
| `lib/admin-access.ts` (entire module) | All exports used only by `AdminAccessCodeGate` | Remove with the component above | medium |
| `lib/private-access.ts` (entire module) | All exports used only by `PrivateAccessNotice` | Remove with the component above | medium |
| Legacy key `yfos:admin-access-granted:v1` / `…private-access…:session` | Never written now (gates unmounted); harmless leftovers | Leave as-is (fail-closed/open); no migration needed | low |
| Legacy key `yfos:private-access-notice-accepted:v1` | Intentionally preserved per `lib/beta-welcome.ts` comment ("don't churn existing data") | Keep; documented intentional retention | low |

**NOT dead (verified active):** `lib/welcome.ts` + `WelcomeGate`,
`lib/beta-welcome.ts` + `BetaWelcomeNotice`, `lib/profile-onboarding.ts` +
`ProfileOnboardingPrompt`, `BetaAuthGate`, and the entire nutrition-AI surface.

**"Dormant AI" clarification:** the photo-assist AI is **not dead code** — it is
**feature-flagged at the server**. `isNutritionAiConfigured()` gates it on
`NUTRITION_AI_API_KEY` / `NUTRITION_AI_MOCK`; with no key configured the UI shows a
calm "בקרוב" card and makes **no** fetch. The route, client UI, and review screen
are fully wired and reachable the moment a key is set. No dead/unreachable AI code
ships, and the API key is server-only (never `NEXT_PUBLIC`).

**Import hygiene:** no `e2e/`, `qa/`, or `scripts/` modules are imported by app
code; no duplicate imports detected. ✓

---

## 5. Data / storage safety audit

**Verdict: excellent.** Every storage area reads/writes through safe helpers
(`readJSON`/`writeJSON` with `isBrowser()` + try/catch), validates/sanitises on
read, and exposes SSR-safe `useSyncExternalStore` hooks. No raw `localStorage`
access in components (except the intentional pre-paint theme script).

### 5.1 Key inventory (exact strings — DO NOT CHANGE)

| Area | Key | In `STORAGE_KEYS`? | In backup? |
|---|---|---|---|
| Workouts | `yfos:workouts` | yes | yes |
| Food logs | `yfos:foodLogs` | yes | yes |
| Settings | `yfos:settings` | yes | yes |
| Templates | `yfos:workout-templates:v1` | yes | yes |
| Saved food values | `yfos:saved-food-values:v1` | yes | yes |
| Favorite foods | `yfos:favorite-foods:v1` | yes | yes |
| Water logs | `yfos:water-logs:v1` | yes | yes |
| Supplements | `yfos:supplements:v1` | yes | yes |
| Supplement logs | `yfos:supplement-logs:v1` | yes | yes |
| Gym visits | `yfos:gym-visits:v1` | no (named export) | yes |
| Active gym visit | `yfos:active-gym-visit:v1` | no | yes |
| Active workout draft | `yfos:active-workout-draft:v1` | no | yes |
| Personal profile | `yfos:personal-profile:v1` | no | yes |
| Backup meta | `yfos:backup-meta:v1` | no | **excluded** |
| Welcome seen | `yfos:welcome-seen:v1` | no | **excluded** |
| Admin access granted | `yfos:admin-access-granted:v1` | no | **excluded** |
| Guest session | `yuval-fit-os:guest-session:v1` *(different prefix)* | no | **excluded** |
| Water celebration seen | `yfos:water-goal-celebration-seen:v1` | no | **excluded** |
| Profile onboarding dismissed | `yfos:profile-onboarding-dismissed:v1` | no | not in backup module |
| Private notice (session) | `yfos:private-access-notice-accepted:session` | no | **excluded** |
| Beta welcome (session) | `yfos:beta-welcome-seen-session:v1` | no | **excluded** |
| Profile onboarding (session) | `yfos:profile-onboarding-dismissed-session:v1` | no | **excluded** |

### 5.2 Findings

| Storage area | Pattern | Risk / inconsistency | Recommendation |
|---|---|---|---|
| All user-data areas | Safe helpers + validation + `useSyncExternalStore` | None | No change |
| Guest session key | Uses prefix `yuval-fit-os:` while everything else uses `yfos:` | Cosmetic inconsistency only; **DO NOT rename** (would orphan existing sessions) | Document the intentional prefix difference |
| `yfos:profile-onboarding-dismissed:v1` | Read/written by `lib/profile-onboarding.ts` | Not explicitly listed in the backup module's excluded set — by design (a UX flag, not data), but undocumented | Add a one-line code comment / doc note clarifying it is an intentional non-backup UX flag |
| `BACKUP_VERSION = 1` | Validated on restore; missing fields untouched, `null` clears | None | **DO NOT change** version/module mapping without an explicit migration |
| `resetAll` | Clears all data keys + gym/profile/draft + water-celebration flag; deliberately keeps welcome/admin/private/backup-meta gate flags | Consistent with "gates are not data" | No change |

---

## 6. E2E / QA audit

**Suite:** 13 Playwright specs, **100 tests (all green, 46.6s), ~2,211 lines.** Runs via
`scripts/e2e.mjs`: one build with `NEXT_PUBLIC_BETA_DISABLE_GATE=1`, then two
production servers — `:3939` (`NUTRITION_AI_MOCK=1`, 12 specs) and `:3940` (no AI,
the `nutrition-photo-disabled` spec). `fullyParallel: false`, `retries: 0`, Pixel-5
/ he-IL.

| Spec | Role | Issue / opportunity | Recommendation | Risk |
|---|---|---|---|---|
| `beta-welcome.spec.ts` | Gate #1 (session beta notice) | Solid; legacy-flag suppression covered | Keep | low |
| `legal-pages.spec.ts` | `/privacy` `/terms` `/ai-disclaimer` render + entry points | Adequate | Keep | low |
| `nutrition-photo.spec.ts` | AI-enabled scan→review→save | Async upload relies on `expect` patience (safe) | Optional explicit heading wait | low |
| `nutrition-photo-disabled.spec.ts` | AI-disabled "בקרוב" guarantees (no input, no POST, no errors) | Duplicates `seedSeen` setup | Use shared fixture | low |
| `profile-onboarding.spec.ts` | Gate #2 (profile prompt) + ordering | Duplicates `seedEntered` with scroll-lock | Shared fixture | low |
| `protein-celebration.spec.ts` | Protein crossing/one-shot | Edge-crossing well covered | Keep | low |
| `scroll-lock.spec.ts` | Scroll restored after overlays (regression for `2830e40`) | **One `page.waitForTimeout(150)`** after `scrollTo` | Replace with a poll on `scrollY` | **med** |
| `supplement-celebration.spec.ts` | Supplement taken crossing | Mirrors protein pattern | Keep | low |
| `today-command-center.spec.ts` | Today hierarchy | `seedWorkoutDraft` duplicated | Shared fixture | med |
| `training-profile.spec.ts` | Wizard V3/V4 (381 lines, 13 tests) | Longest; `advanceToSummary()` helper loops up to 15× and is button-name-fragile | Consider splitting happy-path vs edit/reset; harden helper | med |
| `water-goal-states.spec.ts` | Goal state matrix + uncapped % (19 tests) | Necessary complexity; many serial navigations | Keep | low |
| `water-reset.spec.ts` | Reset UX + re-arm celebration | Focused | Keep | low |
| `workouts-command-hierarchy.spec.ts` | Workouts hub hierarchy | `seedWorkoutDraft` duplicated with Today | Shared fixture | med |

### 6.1 Cross-cutting

- **Duplicated setup (highest ROI):** welcome/beta-welcome/guest seeding +
  `seedWorkoutDraft` appear in ~24 places across 8 specs with no shared layer.
  → Extract `e2e/fixtures.ts` (`seedWelcomeSeen`, `seedGrantedEntered`,
  `seedWater`, `todayISO`, `advanceWizardToSummary`). Maintainability + schema
  resilience; **does not change test behaviour**.
  → ✅ **Applied (Phase 2B)** — see
  [`SYSTEM_OPTIMIZATION_PHASE_2B.md`](SYSTEM_OPTIMIZATION_PHASE_2B.md).
  `seedWorkoutDraft` was **deliberately left local**: the Today and Workouts
  copies are *not* identical (`{id, kg}` vs `{setNumber, weightKg}` set shapes,
  different `exerciseId`s), so unifying them would alter seeded data — out of
  scope for a behaviour-preserving refactor. The two `seedProfile` variants
  (minimal vs full) likewise stay local.
- **Flaky pattern:** single hard wait in `scroll-lock.spec.ts` — replace with a
  poll. No `networkidle` waits, no other arbitrary sleeps.
  → ✅ **Applied (Phase 2B)** — now an `expect.poll` (`expectScrolledOrFits`).
- **`retries: 0`:** consider `retries: 1` for CI robustness (optional).
- **Coverage gap (optional):** no single end-to-end *flow* test of
  beta-welcome → profile-onboarding → wizard → home → scroll. Per-spec coverage
  exists; a ~50-line smoke flow would guard gate orchestration.
- **Remove nothing.** All 13 specs cover essential paths.

---

## 7. UI consistency audit

| Surface | State | Note |
|---|---|---|
| Modals/dialogs | Mostly consistent; 3 onboarding overlays + `ConfirmDialog` | §2.3 `OverlayDialog` would unify a11y/backdrop |
| Cards | Strong shared base (`Card`) + per-module chrome | §2.2 `ModuleCard` would unify glow/badge/status-line |
| CTA hierarchy | Consistent primary/secondary across Today/Workouts clarity passes | Documented in clarity-pass docs |
| Empty states | `PageHeader.EmptyState` shared; one intentional inline variant | OK |
| Section titles | `PageHeader` used widely | OK |
| Chips / selected states | `MuscleChips`, `WaterPresetChips` shared | OK |
| Confirmation dialogs | Single `ConfirmDialog` reused | OK |
| Progress indicators | `ProgressRing` + `WaterGauge` (distinct by design) | OK |
| Celebration overlays | 3 near-identical (§2.1) | Consolidate |

No visual changes in this phase — recommendations only.

---

## 8. Architecture safety map — **do not touch without explicit approval**

> Changing anything below can corrupt user data, break restore, or breach the
> product's safety boundaries. Treat as frozen contracts.

- **localStorage / sessionStorage keys** — every exact string in [§5.1](#51-key-inventory-exact-strings--do-not-change), including the
  intentional `yuval-fit-os:` prefix on the guest-session key. Renaming orphans
  user data.
- **Backup/restore schema** — `BACKUP_VERSION = 1`, the 13-module field↔key
  mapping, `EXCLUDED_KEYS`, and the present/`null`/absent restore semantics
  (`lib/backup.ts`).
- **Auth / access** — `BetaAuthGate` + `lib/beta-access.ts` (Supabase + RLS) is the
  **real** boundary; `lib/guest-session.ts`, `lib/welcome.ts` are client-only,
  non-security. The legacy `admin-access` / `private-access` modules are unmounted
  (§4) — any removal needs explicit sign-off and doc updates.
- **Profile schema** — `TrainingProfile` in `lib/fitness-types.ts` /
  `lib/personal-profile.ts` (sanitiser drops unknown fields; collect-only, no
  medical logic).
- **Nutrition schema** — `FoodLog`, saved-values/favorites maps; values are
  user-entered only, never inferred.
- **Workout schemas** — `WorkoutSession`, `WorkoutTemplate`, `ActiveWorkoutDraft`
  (`version: 1`); `date` is `YYYY-MM-DD`.
- **Water / supplement / protein / gym schemas** — `WaterLog` (`totalMl` always
  recomputed), `Supplement`/`SupplementLog`, `GymVisit`/`ActiveGymVisit`, and the
  goal-crossing event seams (`yfos:water-goal-reached`, `…protein-goal-reached`,
  `…supplement-taken`).
- **AI routes** — `app/api/nutrition/analyze-photo` (GET capability, POST analyze);
  key server-only; photos never stored.
- **Legal pages** — `/privacy`, `/terms`, `/ai-disclaimer` (public).
- **Onboarding order** — `BetaAuthGate → BetaWelcomeNotice → WelcomeGate → AppShell`
  + profile prompt ordering; covered by e2e and must stay stable.
- **Body scroll-lock** — `lib/use-body-scroll-lock.ts` counter-based hook; the
  Phase 4.5 fix. All six overlays must keep using it (no per-component
  capture/restore).

---

## 9. Prioritised action plan (Phase 2)

### P0 — Bug risk / safety
**None.** No dangerous or app-breaking issues found. Build, lint, and e2e all pass.

### P1 — Safe cleanup, high value

| Title | Files | Benefit | Risk | Test requirements |
|---|---|---|---|---|
| ✅ **DONE (Phase 2A)** — Extract `CelebrationOverlay` primitive | new `components/celebrations/CelebrationOverlay.tsx`; 3 overlay files | −~150 LOC; single a11y/timer source | low | Re-run `protein-`/`supplement-`/`water-` celebration specs; verify each event still fires + animates → **100 green** |
| ✅ **DONE (Phase 2B)** — Extract `e2e/fixtures.ts` | new `e2e/fixtures.ts`; 12 specs | Test maintainability + schema resilience | low | Full e2e suite green (no behaviour change) → **100 green** |
| ✅ **DONE (Phase 2B)** — Replace `waitForTimeout(150)` with a poll | `e2e/scroll-lock.spec.ts` | De-flake | low | Scroll-lock spec green → **100 green** |
| ✅ **DONE (Phase 2C)** — Docs: archive completed/superseded docs + mark deprecated | `docs/archive/` (new); 4 docs moved; `PROJECT_STATE.md` doc map | Less clutter; clearer canon | low | None (docs only) — lint/build/e2e re-run **100 green** |

### P2 — Medium refactor (needs caution)

| Title | Files | Benefit | Risk | Test requirements |
|---|---|---|---|---|
| `ModuleCard` + `IconBadge` consolidation | `components/ui/*`; 6 card files | −~200 LOC; unified module identity | medium | Visual check of all cards; e2e for Today/Workouts/Water/Supplements |
| `OverlayDialog` for onboarding overlays | `components/ui/*`; 3 overlays | −~100 LOC; unified a11y/backdrop | low–med | beta-welcome / profile-onboarding / scroll-lock specs |
| De-`force-dynamic` nutrition routes (P-1) | `app/nutrition/page.tsx` + AI-flag plumbing | Restores static prerender | medium | Both e2e servers (AI on/off); disabled "בקרוב" + enabled scan flows |
| Merge overlapping Today / Nutrition-UX docs | `docs/` | Single source per screen | low | None |

### P3 — Later / optional

| Title | Files | Benefit | Risk |
|---|---|---|---|
| Remove `AdminAccessCodeGate` + `PrivateAccessNotice` + their lib modules | `components/access/*`, `lib/admin-access.ts`, `lib/private-access.ts`, docs | −dead code; smaller access surface | medium (explicit sign-off — §8) |
| Enable `retries: 1` in Playwright | `playwright.config.ts` | CI robustness | low |
| Optional full first-entry e2e flow spec | `e2e/` | Guards gate orchestration | low |
| Dev-only bundle-analyzer pass to get route sizes | tooling (not shipped) | Data to target splitting | low |

---

## 10. Things explicitly left unchanged

- All runtime code (no behaviour, UI/UX, schema, key, auth, backup, or data-format
  changes).
- All docs (no deletions/merges performed — recommendations only). *(Update: the
  docs archive/merge pass was later applied in Phase 2C — see §1; no doc deleted,
  four moved to `docs/archive/`.)*
- The dead `AdminAccessCodeGate` / `PrivateAccessNotice` code (documented, not
  removed — deferred to P3 with sign-off).
- The `force-dynamic` nutrition routes (documented, not changed — P2).
- The guest-session key prefix and the legacy retained keys (intentional).
- The pre-existing lint warning in `scripts/qa-settings.mjs` (out of scope; unused
  `theme` var in a QA helper).

---

## 11. Validation & test results

| Command | Result |
|---|---|
| `npm run build` | ✓ **exit 0** — compiled in ~1.5s, TypeScript clean, 30 static pages generated; nutrition routes `ƒ` (dynamic, see P-1) |
| `npm run lint` | ✓ **exit 0** — 0 errors, **1 pre-existing warning** (`scripts/qa-settings.mjs:34` unused `theme`) |
| `npm run test:e2e` | ✓ **exit 0** — **100 passed** in 46.6s (clean build + two prod servers, Pixel-5 / he-IL) |

This audit added **only documentation**; the validation above reflects the
unchanged baseline at commit `2830e40`.
