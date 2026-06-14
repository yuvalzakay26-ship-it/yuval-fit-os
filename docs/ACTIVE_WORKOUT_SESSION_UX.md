# Active Workout Session UX (Phase 3.xx)

> The screen that opens after **"התחל אימון" / "אימון חדש"** — the workout
> builder — was upgraded from a plain form/table into a focused, premium **live
> workout session**. This is a **presentation-only** change: the workout engine,
> storage schema, save payload, draft state, routes and RTL behaviour are all
> unchanged.

Owner component: [`components/workouts/WorkoutBuilder.tsx`](../components/workouts/WorkoutBuilder.tsx)
Host: `components/workouts/WorkoutsView.tsx` (renders the builder when `building`).
QA: [`scripts/qa-workout-session.mjs`](../scripts/qa-workout-session.mjs).

---

## What it should communicate

When the user starts a workout, the screen says **"you are now inside an active
workout"** — clear, fast to use mid-set, colourful but controlled, muscle-aware,
mobile-first, and premium in both light and dark.

## The upgrade, section by section

### 1. Active session hero
A raised, identity-tinted header card (`module-mg-duo sheen`) that leads the
screen:
- A live **`אימון פעיל`** eyebrow with a pulsing dot (the only animation), plus
  the session's identity label (e.g. `גב · יד אחורית` / `אימון מלא`).
- The editable **workout title** (unchanged field, larger/bolder).
- **Muscle chips** (`MuscleChips`) — each in its own muscle colour.
- Three at-a-glance **stat tiles**: `תרגילים`, `סטים`, `בוצעו` (completed
  highlighted in the identity hue).
- A **progress bar** + `התקדמות האימון` label with a live percentage, painted
  with the session's `mg-gradient`.

The whole hero (and the finish CTA + progress) derives **one dominant muscle
identity** from the session's groups via `workoutIdentity()` in
[`lib/workout-theme.ts`](../lib/workout-theme.ts) — so it stops being "the same
blue card" and matches the rest of the workouts module. Identity is **derived at
render time, never stored**.

### 2. Exercise cards
Each exercise is its own card that paints in **its own muscle group's colour**
(`workoutIdentity([exercise.muscleGroup])`):
- Larger image treatment (56px, was 40px) and clearer title hierarchy.
- A muscle-colour eyebrow (the group label) above the name.
- "פעם קודמת" last-performance summary (unchanged data via `lastPerformance`).
- Soft corner glow + sheen + `module-mg` tint in the card's hue.

### 3. Current-exercise highlight
The first exercise still carrying an unfinished set is the **current** one and
gets a subtle live treatment: a coloured border (`--mg`), an identity glow
(`shadow-glow-mg`), and a small **`עכשיו`** badge. When every set is ticked there
is no current exercise, so no misleading badge appears.

### 4. Set tracker (was a dry table)
Same fields and meaning (`set number`, `kg`, `reps`, `completed`, `delete`),
cleaner presentation:
- Touch-friendly `h-10` kg/reps inputs (fast entry preserved).
- Completed rows get a soft `--mg-soft` tint and the **completed toggle fills
  with the card's `mg-gradient`** (a satisfying, muscle-coloured confirmation,
  not noisy).
- **Delete is now secondary** — a smaller, calmer, fainter trash control, no
  longer competing visually with the inputs or the complete action.
- **`הוספת סט`** is a clear full-width dashed button in the card's hue.

### 5. Completed state
- Per set: tinted row + gradient check.
- Per exercise: a green **`הושלם`** badge when all of its sets are done.

### 6. Finish / save
- Progress context line: **`{done} מתוך {total} סטים בוצעו`**.
- Primary CTA renamed to **`סיים ושמור אימון`** (identity gradient + glow),
  with `ביטול` beside it. Disabled until at least one exercise exists.
- Save behaviour is byte-for-byte the same `WorkoutSession` payload as before
  (`addWorkout` → `onSaved`). The page keeps `pb-32`, so the CTA always sits
  safely above the bottom nav.

### 7. Add exercise
The "add exercise" entry keeps the strength-gradient affordance and opens the
existing full-screen `ExercisePicker` unchanged (add-only, no duplicates).

## What stayed exactly the same

- `WorkoutSession` / `SetEntry` / `WorkoutExerciseEntry` schema and the saved
  payload.
- Draft/session state and all handlers: `addExercise`, `removeExercise`,
  `addSet`, `removeSet`, `updateSet`, `handleSave`, `canSave`, `totalSets`.
- kg / reps / completed semantics and fast data entry.
- Exercise-picker integration, recent-exercises derivation, one-of-each rule.
- Workout history creation, `localStorage` keys (`yfos:workouts`), routes, RTL.
- No backend / auth / AI / API / native / new dependencies / timer logic added.

## QA

`node scripts/qa-workout-session.mjs` (server on `:3331`) drives the real flow at
360px and 390px in **light and dark**: open builder → add two exercises via the
picker → type kg/reps → complete a set → add a set → delete it → confirm the
finish CTA → save → land back in history. It also asserts the hero, the `עכשיו`
badge, the progress label, and **zero horizontal overflow**, with no console
errors. Companion passes: `qa-navigation.mjs`, `qa-exercises.mjs`.
