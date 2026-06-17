# System Optimization Phase 2B — E2E fixtures cleanup

> **Test-maintenance refactor only.** No change to runtime app code, schemas,
> storage/session keys, copy, onboarding order, auth/backup, or product
> behaviour. Coverage and assertions are unchanged. This applies the E2E P1 items
> from [`SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md`](SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md)
> §6.1 / §9 ("Extract `e2e/fixtures.ts`" + "Replace `waitForTimeout(150)` with a
> poll").
>
> Date: 2026-06-17 · Branch: `main` · Baseline: `f0bcf7d`

---

## What & why

The Playwright suite (13 specs / 100 tests) repeated the same setup across
files: the welcome / beta-welcome / guest-session seeds, the `todayISO()` date
string, an identical `seedWater()` block, and the training-profile wizard's
"click הבא/לסיכום until the summary" loop. That duplication is now a single
`e2e/fixtures.ts`. The helpers are small and named after the product state they
set up, so each spec still reads like the behaviour it pins — no generic
framework, no hidden meaning.

## New file — `e2e/fixtures.ts`

| Helper | What it seeds / does |
|---|---|
| `todayISO()` | Today's date as `YYYY-MM-DD` (local) — the per-day log key format |
| `seedWelcomeSeen(page)` | One-time welcome + legacy beta-welcome flags seen; no guest session. For specs not exercising onboarding |
| `seedGranted(page, { withLegacyBetaFlag? })` | Granted guest past the first-visit welcome, beta-welcome session flag left clean → beta notice is the surface under test; optional legacy persistent flag |
| `seedGrantedEntered(page)` | As `seedGranted` + beta welcome marked seen this session → the profile onboarding prompt is the surface under test |
| `seedWater(page, totalMl, goalMl = 2000)` | Today's water log + clean goal (the identical block from the two water specs) |
| `advanceWizardToSummary(page)` | Click `הבא` / `לסיכום` until the wizard reaches `שמור פרופיל`, or stops at a gated required step (bounded to 15 iterations) |
| `expectScrolledOrFits(page)` | `expect.poll` until the page scrolled past the top or simply fits the viewport — deterministic replacement for the fixed scroll wait |

## Duplicated setup extracted

- **Welcome/beta/guest seeding** — `seedWelcomeSeen` (7 specs), `seedGranted`
  (beta-welcome, profile-onboarding), `seedGrantedEntered` (profile-onboarding,
  scroll-lock). The blocks were byte-identical per variant.
- **`todayISO()`** — was copied verbatim into 3 specs (+ inlined in 2 water specs
  via `seedWater`).
- **`seedWater()`** — byte-identical in `water-goal-states` and `water-reset`.
- **Wizard advance loop** — `training-profile` had it as `advanceToSummary`;
  `scroll-lock` had the same loop inlined in `completeAndSaveWizard`. Both now use
  `advanceWizardToSummary` (the strict superset that also guards a disabled
  `לסיכום`).

## Specs migrated (12)

`beta-welcome`, `profile-onboarding`, `scroll-lock`, `training-profile`,
`water-goal-states`, `water-reset`, `protein-celebration`,
`supplement-celebration`, `today-command-center`,
`workouts-command-hierarchy`, `nutrition-photo`, `nutrition-photo-disabled`,
`legal-pages`.

(Specs that are *testing* a specific key keep their own local constant for the
assertion — e.g. `profile-onboarding`'s `DISMISS_KEY`, `beta-welcome`'s
`SESSION_KEY` — so the contract under test stays visible in the spec.)

## Scroll-lock de-flake

`scroll-lock.spec.ts` forced an instant scroll-to-bottom then `waitForTimeout(150)`
before reading `scrollY` (the app uses CSS `scroll-behavior: smooth`). That fixed
wait is now `expectScrolledOrFits(page)`, an `expect.poll` that retries until the
position settles — deterministic, no sleep, same assertion.

## Deliberately left unchanged

- **`seedWorkoutDraft`** — the Today and Workouts copies differ (`{id, kg}` vs
  `{setNumber, weightKg}` set shapes, different `exerciseId`s). Unifying them
  would change seeded data, so they stay local. The audit's "duplicated" note
  overstated this — they are similar, not identical.
- **The two `seedProfile` variants** — `profile-onboarding`'s is minimal
  (`{goal, updatedAt}`); `training-profile`'s is a full profile. Different intent,
  kept local.
- **`training-profile`'s `seedBase` / `answerRequiredCoreToPersonal`** — used in
  one file only; relocating a single-file helper to a shared module reduces no
  cross-file duplication.
- All storage/session keys, schemas, copy, assertions, the onboarding order, and
  every spec's scenario list. No test removed, no assertion weakened, no
  `test.skip`, no retries enabled.

## Validation

| Command | Result |
|---|---|
| `npm run lint` | ✓ 0 errors, 1 pre-existing warning (`scripts/qa-settings.mjs`) |
| `npm run build` | ✓ TypeScript clean; route table unchanged |
| `npm run test:e2e` | ✓ **100 passed** (45.9s) — full suite, both prod servers |

No flakes observed across the run.

## Files

- **Added:** `e2e/fixtures.ts`, this doc.
- **Modified (specs):** the 12 specs listed above.
- **Docs:** `SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md` (§6.1 + §9 marked applied),
  `PROJECT_STATE.md` (Phase 2B entry).
