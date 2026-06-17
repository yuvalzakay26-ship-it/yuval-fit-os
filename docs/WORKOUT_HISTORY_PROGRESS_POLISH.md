# Workout History / Progress Polish — Phase 1

A **UX / copy / presentation** pass that makes saved workout history and the
Progress screen read as clearer, more useful, and quietly motivating once a user
has saved workouts. **No** schema, storage-key, calculation, backup/restore, or
behaviour change — everything is derived **read-only** from already-stored
sessions.

## Goal

After a user saves workouts they should understand, at a glance:

- **what** workouts were completed (history list),
- **what happened in the last workout** (a clear snapshot),
- **basic progress signals** (honest lifetime roll-ups),
- **where to continue next** (coherent links from the completion card).

This is presentation only. It does **not** add AI, generate plans, add
medical/body/weight logic, or use any transformation / appearance-pressure
language.

## What was polished

### 1. Workout history card clarity (`components/workouts/WorkoutHistory.tsx`)

Each saved session card already showed a muscle-group identity eyebrow, the
workout title, the date, muscle chips, a 3-up stat row (תרגילים · סטים · נפח),
and a per-exercise breakdown. Two honesty fixes were made:

- **Volume tile hides at 0.** Bodyweight-only sessions (`Σ weightKg×reps === 0`)
  no longer show a misleading **"0 נפח"** — the stat grid balances to two columns
  (תרגילים · סטים). This matches the completion card's existing behaviour.
- **Per-exercise line** no longer reads **"× עד 0 ק״ג"** for bodyweight sets; it
  falls back to **"{n} סטים"** when the top weight is 0.

The section header on `/workouts` now carries a clarifying hint once history
exists: **"כל האימונים ששמרת, מהאחרון לראשון."**, so the `#workout-history`
anchor (where the completion card scrolls to) lands on an obviously-labelled
section.

### 2. Last workout summary + Progress polish (`components/workouts/LastWorkoutSummary.tsx`, `components/progress/ProgressView.tsx`)

A new presentational **`LastWorkoutSummary`** component renders a compact
snapshot of the most recent saved session, plus an honest lifetime roll-up. It is
placed at the **top of `/progress`** (right under the weekly hero) in a new
**"האימון האחרון שלך"** section (hint: **"זה הסיכום האחרון שנשמר בהיסטוריה."**):

- **Last workout:** identity eyebrow, title, date, and compact stats
  (תרגילים · סטים · נפח, with נפח hidden at 0).
- **Lifetime roll-up:** **"סטים שנשמרו"** (total sets across all sessions) and
  **"נפח כולל"** (lifetime `Σ weightKg×reps`, hidden when 0). These are honest
  cumulative counts — never a "you improved" / "you got stronger" claim.
- **Early-data nudge:** when exactly one workout exists, a calm line
  **"ככל שתשמור יותר אימונים, התמונה תהיה ברורה יותר."**
- **Empty state:** when no workout exists yet (e.g. only water/food logged so the
  page still has data), it stays calm — **"עדיין אין אימון אחרון"** /
  **"כאן תופיע ההיסטוריה אחרי שתסיים אימון ראשון."**

The "נתונים עיקריים" section header on `/progress` gained the careful copy
**"נתוני ההתקדמות מבוססים על האימונים ששמרת במכשיר."** so the user understands
the data is device-local and derived from what they saved.

### Supporting helper (`lib/analytics.ts`)

A new pure, SSR-safe `workoutTotals(workouts)` returns
`{ totalWorkouts, totalSets, totalVolumeKg, latest }`. It only **sums what is
already stored** (the same `weightKg×reps` figure shown elsewhere) — no new
persisted data, no schema field, no new kind of calculation.

## What summary data is shown

- Last workout: exercise count, set count, volume (kg) when > 0, date, identity.
- Lifetime: total sets, total volume (kg) when > 0.
- The existing Progress screen continues to show its weekly hero, key stats
  (incl. "סה״כ אימונים" + "אימון אחרון"), weekly insights, trends, water,
  supplements, gym, and personal records — unchanged.

## What is intentionally NOT shown

- **No** improvement / comparison / "got stronger" claims (no comparison logic
  exists, so none is implied).
- **No** body / weight / appearance / BMI / transformation language.
- **No** duration metric on history cards — workout duration is **not** stored on
  `WorkoutSession`, so it is not invented. (Gym *visit* time stays on its own gym
  card, unchanged.)
- **No** "התאמנת לפי / source template" badge on history cards — the session
  schema does not persist a source template id, and the saved `title` already
  carries the template name. Surfacing a real per-session source is a possible
  follow-up **only** if the schema ever stores it (out of scope here).

## What stayed unchanged

`WorkoutSession` / `WorkoutExerciseEntry` / `SetEntry` / `WorkoutTemplate`
schemas; the active-draft schema/key `yfos:active-workout-draft:v1`; `yfos:workouts`;
`saveWorkout` / `addWorkout` payloads; backup/restore; the personal-profile
schema; workout recommendation logic; the active workout builder; the workout
completion card behaviour (its links/anchor were already correct); nutrition /
FoodLog / water / supplement / protein / gym schemas; auth / beta / guest / admin
/ Supabase; AI routes; legal pages; Google-only auth entry; the locked guest
entry; the beta/profile onboarding sequence. No new dependencies; localStorage-only.

## Post-completion continuity

The completion card's three destinations now feel coherent:

- **"צפה בהיסטוריית אימונים"** smooth-scrolls to `#workout-history`, which now has
  a clarifying hint.
- **"עבור להתקדמות"** → `/progress`, which now opens with a clear
  **"האימון האחרון שלך"** snapshot instead of burying the last workout in a stat
  tile.
- **"התחל אימון נוסף"** reopens the builder (unchanged).

## Mobile QA notes (360px / 390px)

- History stat grid and the last-workout stat grid both adapt 3→2 columns when
  volume hides, so tiles never crowd.
- The lifetime roll-up row uses `flex-wrap`, so "סטים שנשמרו" / "נפח כולל" wrap
  cleanly on the narrowest width.
- RTL is correct (leading identity bar on the inline-start edge; `ps-*` padding).
- No horizontal overflow at 360px or 390px on `/workouts` or `/progress`
  (asserted in e2e).

## Validation

- `npm run lint` ✓ (0 errors; 1 pre-existing unrelated warning in
  `scripts/qa-settings.mjs`).
- `npm run build` ✓ (TypeScript clean; route table unchanged).
- `npm run test:e2e` ✓ **138 green**, including the new
  [`e2e/workout-history-progress.spec.ts`](../e2e/workout-history-progress.spec.ts):
  calm empty states (history + `/progress`); a saved workout appears in history
  with its counts; a bodyweight-only session hides the volume tile; `/progress`
  shows the last-workout snapshot + lifetime roll-ups + the device-local copy once
  a workout exists; the snapshot stays calm when only other data exists; and no
  horizontal overflow at 360px / 390px on both screens.
