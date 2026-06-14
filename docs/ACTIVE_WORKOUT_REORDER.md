# Active Workout — Exercise Reorder (Phase 3.xx)

> Inside an **active workout** the user can now change the **order of exercises**
> without losing any entered data. This is a UX/functionality addition that is
> deliberately **non-invasive to the data model**: order has always been encoded
> as the order of the session's `entries` array, so reordering is just moving an
> entry inside that array. No schema, storage key, save payload, route, history
> logic or RTL behaviour changed.
>
> **Phase 3.xx.1 update:** the reorder UI is now **drag-only** in the visible
> interface — the earlier on-row up/down arrow buttons were removed for a
> cleaner, more premium, modern-mobile feel. Reordering uses a lightweight,
> dependency-free **Pointer Events** drag (reliable on touch *and* mouse), with
> ArrowUp/ArrowDown on the focused grip handle kept purely for keyboard/AT
> accessibility — no visible arrow controls.

Owner component: [`components/workouts/WorkoutBuilder.tsx`](../components/workouts/WorkoutBuilder.tsx)
Helper: `moveWorkoutEntry(entries, fromIndex, toIndex)` (same file, exported).
Icons: `GripIcon` in [`components/ui/icons.tsx`](../components/ui/icons.tsx).
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

- The full editing cards are swapped for a **calm, compact, drag-only sortable
  list** (image + muscle label + name + a small `{sets} סטים · {done} בוצעו`
  line). Editing surfaces (kg/reps inputs, the add-exercise card) are hidden, so
  nothing can be accidentally edited mid-reorder and there are **no destructive
  delete controls** and **no up/down arrow buttons** on screen.
- A subtle instruction shows: **`גרור כדי לשנות את סדר התרגילים`**.
- Each row has a single **grip handle** (`GripIcon`) — the only reorder control.
- The pill flips to **`סיום סידור`** to exit.

On exit the full cards return in the **new order**, with every value intact.

## How reordering works (drag-only, with a keyboard fallback)

The visible interface is **drag-only** — the earlier up/down arrow buttons were
removed. One mechanism, two input paths, both calling the same pure helper
`moveWorkoutEntry(entries, fromIndex, toIndex)`:

1. **Pointer drag** (touch / mouse / pen) — a lightweight, **dependency-free**
   implementation built on **Pointer Events**, *not* native HTML5 drag-and-drop
   (which is unreliable on mobile). Pressing the grip handle calls
   `setPointerCapture`, so every subsequent move/up for that pointer is routed to
   the handle — the key to reliable touch dragging. As the pointer passes other
   rows, `indexAtY()` maps its Y coordinate to a target index and the list
   reorders **live**. `touch-action: none` on the handle stops the page scrolling
   under a touch drag. The dragged row lifts (subtle scale + identity glow).
2. **Keyboard** — the grip handle is a real focusable `<button>`; when focused,
   **ArrowUp / ArrowDown** move the row (Home/End jump to the ends). This keeps
   reordering fully accessible **without** showing any arrow buttons in the UI.

> Why not native HTML5 DnD? It does not fire reliably for touch on mobile, which
> is the primary target. The Pointer Events approach works identically for mouse
> and touch with no library and no heavy dependency.

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
into each and complete the **third** one's set → enter reorder mode → assert
there are **no visible up/down (`העבר`) buttons** but a grip handle per row →
**drag** the third exercise to the top (a real Playwright pointer drag, which
emits the same `pointerdown`/`pointermove`/`pointerup` the app handles) → verify
the **keyboard** handle (ArrowDown/ArrowUp on the focused grip) also reorders →
exit → assert the new order, that the moved exercise's kg/completed value
followed it, that the `עכשיו` badge recalculated, that add/delete still work, and
that saving lands the reordered order (and data) into history — all with **zero
horizontal overflow** and no console errors.

Playwright's `page.mouse` emits real pointer events in Chromium, so the pointer
drag **is** automated here (and passes in all four scheme×width runs). The
identical Pointer Events code path runs for real-finger touch on a device; that
final on-device feel (lift animation, scroll suppression) is the one aspect
verified by hand in mobile emulation rather than asserted programmatically.
