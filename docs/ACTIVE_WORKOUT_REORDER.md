# Active Workout — Exercise Reorder (Phase 3.xx)

> Inside an **active workout** the user can now change the **order of exercises**
> without losing any entered data. This is a UX/functionality addition that is
> deliberately **non-invasive to the data model**: order has always been encoded
> as the order of the session's `entries` array, so reordering is just moving an
> entry inside that array. No schema, storage key, save payload, route, history
> logic or RTL behaviour changed.

Owner component: [`components/workouts/WorkoutBuilder.tsx`](../components/workouts/WorkoutBuilder.tsx)
Helper: `moveWorkoutEntry(entries, fromIndex, toIndex)` (same file, exported).
Icons: `GripIcon`, `ArrowUpIcon`, `ArrowDownIcon` in [`components/ui/icons.tsx`](../components/ui/icons.tsx).
QA: [`scripts/qa-workout-reorder.mjs`](../scripts/qa-workout-reorder.mjs).

---

## Why

When a user adds several exercises they used to be stuck with that order unless
they deleted and re-added (which loses entered set data and flow). In a real gym
the order changes constantly — equipment is busy, a compound lift should come
first, an isolation move should drop later. Reordering had to be possible **and**
guaranteed never to lose a single kg/reps/completed value.

## The UX decision: an explicit reorder *mode*

Cards are **not** draggable all the time. On mobile, always-on dragging of full
cards fights normal scrolling and the set-input taps. Instead there is a small
secondary pill, **`סדר תרגילים`**, above the exercise list (next to the exercise
count, never competing with the main `סיים ושמור אימון` CTA). It only appears
with **2+ exercises**.

Tapping it enters **reorder mode**:

- The full editing cards are swapped for a **calm, compact sortable list** (image
  + muscle label + name + a small `{sets} סטים · {done} בוצעו` line). Editing
  surfaces (kg/reps inputs, the add-exercise card) are hidden, so nothing can be
  accidentally edited mid-reorder and there are **no destructive delete controls**
  on screen.
- A subtle instruction shows: **`גרור כדי לשנות את סדר התרגילים`**.
- Each row has a **grip handle** (`GripIcon`) and **up/down buttons**.
- The pill flips to **`סיום סידור`** to exit.

On exit the full cards return in the **new order**, with every value intact.

## How reordering works (drag **and** up/down — both)

Two mechanisms are provided so the experience is stable everywhere:

1. **Drag-and-drop** (pointer/mouse) — native HTML5 DnD, **no dependency**. The
   row is `draggable`; `onDragOver` reorders live as the pointer passes another
   row. Graceful and lightweight.
2. **Up / down buttons** — rock-solid on touch and fully keyboard / assistive-tech
   accessible, with named labels (`העבר את {name} למעלה` / `…למטה`). These are the
   primary, always-reliable path; drag is the enhancement on top.

Both call the same pure helper:

```ts
moveWorkoutEntry(entries, fromIndex, toIndex)
```

## Data preservation guarantee

- Order **is** `entries` array order — there is no separate "order" field to keep
  in sync, nothing to migrate, nothing new in the saved `WorkoutSession`.
- `moveWorkoutEntry` relocates the **entire entry object** (`{ exerciseId, sets }`)
  with `splice` — it never recreates entries or sets. So `sets`, `weightKg`,
  `reps`, `completed`, plus the derived exercise id/image/name/last-performance,
  all travel together. Out-of-range and no-op moves return the array unchanged.
- Set inputs are **controlled from `entries` state** (not the DOM), and each card
  is keyed by `exerciseId`, so React keeps the right values bound to the right
  exercise across a move. Reordering never resets a field.

## Current-exercise highlight recalculates

`currentExerciseId` is derived at render time as *the first entry still carrying
an unfinished set* (`entries.find(...)`). Because it reads the live array order,
moving exercises **automatically** re-evaluates which one is "current":

- A moved, already-completed exercise stays **`הושלם`** (never falsely "current").
- The first remaining exercise with unfinished sets gets the **`עכשיו`** badge.
- If every exercise is complete, **no** current badge shows.

Nothing about this logic changed — it simply follows the new order for free.

## What stayed exactly the same

- `WorkoutSession` / `WorkoutExerciseEntry` / `SetEntry` schema and the saved
  payload shape (`addWorkout` → `onSaved`).
- `localStorage` keys (`yfos:workouts`), routes, workout history logic, RTL.
- `addExercise`, `removeExercise`, `addSet`, `removeSet`, `updateSet`,
  `handleSave`, the no-duplicate rule, and the exercise picker behaviour.
- kg / reps / completed semantics and fast set entry.
- No backend / auth / AI / API / database / native / new dependencies.

## QA

`node scripts/qa-workout-reorder.mjs` (server on `:3331`) drives the real flow at
360px and 390px in **light and dark**: add three exercises → type distinct kg
into each and complete the middle one's set → enter reorder mode → move that
exercise to first → exit → assert the new order, that its kg/completed value
followed it, that the `עכשיו` badge recalculated, that add/delete still work, and
that saving lands the reordered order (and data) into history — all with **zero
horizontal overflow** and no console errors.
