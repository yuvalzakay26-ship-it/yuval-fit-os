# Active Workout — Collapsible Exercise Cards

> Phase 3.xx. Each exercise card in the active workout (the `WorkoutBuilder`)
> can be **minimised to a compact summary** and expanded back to the full
> editing card, so a long session (4–6 exercises × several sets) stops being an
> endless scroll. **Collapse is visual only** — it changes nothing about the
> data, schema, storage, draft, or saved history.

Code: [`components/workouts/WorkoutBuilder.tsx`](../components/workouts/WorkoutBuilder.tsx).
Icon: `ChevronDownIcon` in [`components/ui/icons.tsx`](../components/ui/icons.tsx).
QA: [`scripts/qa-workout-collapse.mjs`](../scripts/qa-workout-collapse.mjs).

## What it adds

- A small **chevron toggle** in every exercise card header (`aria-expanded`,
  accessible label `הצג סטים: <name>` / `הסתר סטים: <name>`). It is a dedicated
  button, so tapping kg/reps/completed never collapses the card.
- A **collapsed summary** state — a premium, muscle-tinted compact card.
- A single **"מזער הכל" / "פתח הכל"** control next to the exercise count, to
  collapse or expand every card at once (outside reorder mode only).

## Expanded vs collapsed

The card **header is identical** in both states — exercise image, muscle-group
label, `עכשיו` (current) / `הושלם` (all sets done) badges, exercise name, and
the previous-performance line (`פעם קודמת: …`). Only the body below it changes:

| State | Body |
| --- | --- |
| **Expanded** (default) | Full sets table: per-set kg / reps inputs, the completed checkbox, delete-set, add-set, and the delete-exercise button. Unchanged from before. |
| **Collapsed** | A compact summary chip: `X סטים · Y מתוך X בוצעו`, tinted in the card's muscle colour. No inputs render; the delete-exercise button is hidden to keep the summary clean. |

Because the image / name / muscle / badges / previous performance live in the
shared header, the collapsed card still shows everything the spec asks for
(image, name, muscle identity, set count, completed count, previous performance,
current/completed badge) — just without the editable rows.

## Smart defaults (kept deliberately simple)

- **New exercises start expanded** — a freshly added exercise is simply absent
  from the collapsed set.
- **Nothing auto-collapses.** The current exercise stays expanded by default
  because nothing ever collapses it for you.
- The user's **manual** collapse/expand choices are respected for the rest of
  the session.
- Removing an exercise **prunes** its collapse flag, so re-adding the same
  exercise later starts expanded again.

There is no preference persistence and no clever heuristics — collapse is
ephemeral per-session UI.

## Interaction with reorder mode

Reorder mode is unchanged. While reordering:

- The collapse controls (the per-card chevrons and the "מזער הכל" / "פתח הכל"
  pill) are **hidden** — reorder uses its own focused, compact drag-only list.
- That list always shows **all** exercises regardless of collapse state.

On exit, the editing cards return in the new order and **each card's collapse
state is preserved** (it is keyed by `exerciseId`, which travels with the entry
when the array is reordered). Reordering never touches a kg/reps/completed value.

## Interaction with the auto-save draft

Collapse state is **component-local React state** (`collapsedIds: Set<string>`),
completely separate from `entries` / `title`. Consequences:

- Toggling collapse **does not** trigger a draft write — the auto-save effect
  depends only on `[title, entries, …]`, so collapsing/expanding changes nothing
  it watches. No unnecessary draft writes.
- Collapse state is **not** stored in the draft and **not** restored. A restored
  draft comes back **fully expanded**, with every kg/reps/completed value intact.
- Saved workout **history** is pure data — no collapse UI state leaks into it.

## Hard boundaries (unchanged)

No change to the workout/session or history **schema**, the save **payload**,
any **localStorage keys**, the draft **data shape**, **routes**, kg/reps/completed
semantics, add/remove exercise, add/remove set, reorder logic, the exercise
picker, the no-duplicate rule, previous-performance logic, or Hebrew RTL
behaviour. No backend / auth / AI / API / database / cloud sync / native work and
no new dependencies (the chevron is a local inline SVG icon).
