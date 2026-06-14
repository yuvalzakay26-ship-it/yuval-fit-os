# Active Workout — Auto-Save Draft (Phase 3.xx)

> The in-progress **active workout** is now auto-saved to a local draft, so a
> user who leaves the builder before pressing **`סיים ושמור אימון`** never loses
> what they entered. On return they are offered a premium **restore** prompt.
>
> This is a UX/safety addition that is **non-invasive to the data model**. It
> does **not** change the workout-history schema, the history storage key, the
> saved payload, routes, the final-save semantics, reorder behaviour, the
> no-duplicate rule, or RTL/dark behaviour. No backend / auth / AI / API /
> database / cloud / native work was added.

Owner module: [`lib/active-workout-draft.ts`](../lib/active-workout-draft.ts)
UI: [`components/workouts/WorkoutBuilder.tsx`](../components/workouts/WorkoutBuilder.tsx),
[`components/workouts/WorkoutsView.tsx`](../components/workouts/WorkoutsView.tsx),
[`components/workouts/DraftRestoreCard.tsx`](../components/workouts/DraftRestoreCard.tsx),
[`components/ui/ConfirmDialog.tsx`](../components/ui/ConfirmDialog.tsx)
QA: [`scripts/qa-workout-draft.mjs`](../scripts/qa-workout-draft.mjs)

---

## Draft vs. completed workout — the core distinction

| | Auto-save draft | Final save (`סיים ושמור אימון`) |
|---|---|---|
| Purpose | Protect the **in-progress** session from loss | Officially record the workout |
| Storage key | `yfos:active-workout-draft:v1` | `yfos:workouts` (unchanged) |
| How many | At most **one** (a single recoverable slot) | Appends one `WorkoutSession` to history |
| When written | Automatically, on every change | Only when the user presses the CTA |
| Cleared | After final save, or explicit discard | n/a |

The draft is **never** written into workout history. Final save still does
exactly what it always did (`addWorkout` → `onSaved`), and additionally clears
the draft. There are **no** per-change history records and **no** duplicate
auto-saved copies.

## Storage key & shape

Key: **`yfos:active-workout-draft:v1`** — deliberately distinct from
`yfos:workouts`. It is owned solely by `lib/active-workout-draft.ts` (not part of
`STORAGE_KEYS`), so the workout-history storage is completely untouched.

```ts
interface ActiveWorkoutDraft {
  version: 1;
  updatedAt: string;          // full ISO timestamp
  title: string;
  entries: WorkoutExerciseEntry[]; // same in-memory session shape as the builder
}
```

`entries` is the exact builder session shape, so a restore is a direct hydrate —
exercise **order**, **sets**, **kg**, **reps** and **completed** flags all travel
together with no transform. All reads/writes are fail-safe: a corrupt/partial
blob is ignored, and a blocked/full `localStorage` write never throws into the
workout screen.

Helpers: `getActiveWorkoutDraft()`, `saveActiveWorkoutDraft(draft)`,
`clearActiveWorkoutDraft()`, `hasMeaningfulWorkoutDraft(draft)`,
`toActiveWorkoutDraft(state)`, `fromActiveWorkoutDraft(draft)`. A small
`useSyncExternalStore` layer (`useActiveWorkoutDraft()`, `useIsClient()`) mirrors
`lib/welcome.ts` so components observe the draft SSR-safely (server snapshot is
`null`; the real value swaps in after hydration) and stay in sync when it is
written or cleared anywhere in the tab.

## What triggers an auto-save

Any change to the active session, via the existing builder handlers:

- workout **title** change
- **add** / **remove** exercise
- **reorder** exercise (array order)
- **add** / **remove** set
- edit **kg** / **reps**
- **mark / unmark** completed

The builder watches `title` + `entries` and writes a debounced (~400ms) draft.
Writes happen inside the debounce timer (never synchronously in an effect body,
satisfying the `react-hooks` rules). A `pagehide` + unmount **flush** persists
the last edit so a fast tab-switch / route change can't drop a final keystroke.

> Drafting is **session-only** — nutrition/water/etc. are out of scope.

## Avoiding empty / stale draft noise (`hasMeaningfulWorkoutDraft`)

A draft is "meaningful" only when it has **at least one exercise entry** OR a
**non-empty title** (the builder's default title is empty). So a freshly opened,
untouched builder never writes a draft and never produces a restore prompt. When
the in-progress session becomes non-meaningful again (everything removed), the
auto-save clears the slot rather than leaving an empty draft behind.

## Restore / discard flow

**On the hub** (`WorkoutsView`, builder closed): if a meaningful draft exists, a
premium `DraftRestoreCard` appears at the top — `נמצא אימון שלא נשמר`, with
**`המשך אימון`** (resume) and **`מחק טיוטה`** (discard, behind a confirm). The
card paints in the draft's own muscle-group identity and shows a compact summary
(title · groups · exercises · sets · last-saved time) plus
`הטיוטה נשמרת במכשיר הזה בלבד.`

**Resuming** opens the builder seeded from the draft in `resumed` mode, which
re-adopts the same draft slot and keeps auto-saving.

**Inside the builder** a calm status line — `נשמר אוטומטית` (+ last-saved time)
— reassures without being noisy.

## Template / new-workout conflict — never silently destroyed

When a **new** or **template/duplicate** session opens while a meaningful draft
already exists, the builder captures that draft once (post-hydration) and shows
the same restore card as a **conflict prompt**, holding auto-save so the new
session can't overwrite the found draft:

- **`המשך אימון`** → loads the found draft (discards the just-loaded blank/template
  content) and resumes.
- **`מחק טיוטה`** → discards the found draft and keeps the new/template session,
  which then auto-saves fresh.

This satisfies "preserve the template-loaded content once in progress" **and**
"don't silently overwrite an existing draft".

## Clearing the draft

- **Final save** (`סיים ושמור אימון`): after `addWorkout`, the draft is cleared
  (guarded so an unrelated, still-unresolved conflict draft is left intact).
- **Explicit discard**: from the hub restore card (`מחק טיוטה`, confirmed), the
  in-builder conflict card, or the leave-confirm's `מחק טיוטה וצא`.
- **Cancel** (`ביטול`) with meaningful content shows a confirm; the **default**
  is a safe exit that **keeps** the draft (recoverable from the hub). Only an
  explicit discard clears it — cancelling never destroys data.

## Navigation / safety

The draft lives in `localStorage`, so it survives a full page reload and route
changes. Reads are SSR-safe (no hydration errors), and every storage access is
wrapped so a storage failure never crashes the workout screen.

## What stayed exactly the same

- `WorkoutSession` / `WorkoutExerciseEntry` / `SetEntry` schema and the saved
  payload (`addWorkout` → `onSaved`).
- The workout-history key `yfos:workouts` and all of `lib/storage.ts`.
- Routes, final-save semantics, reorder behaviour, the exercise picker, the
  no-duplicate rule, kg/reps/completed semantics, and Hebrew RTL / dark mode.
- No backend / auth / AI / external API / database / cloud sync / native work,
  and no heavy dependencies (the restore card + confirm dialog reuse existing UI
  primitives).

## QA

`node scripts/qa-workout-draft.mjs` (server on `:3331`) drives the real flow at
360px and 390px in light and dark: an untouched builder leaves **no** prompt; a
real session (title + 3 exercises + kg/reps + a completed set + reorder B to the
top) is auto-saved, survives a **full reload**, is offered back, and
**`המשך אימון`** restores the title, the reordered order and B's kg/completed
exactly; the final save lands the workout in history **once** and clears the
prompt; **`מחק טיוטה`** (with confirm) clears the draft — all with zero
horizontal overflow and no console / hydration errors.
