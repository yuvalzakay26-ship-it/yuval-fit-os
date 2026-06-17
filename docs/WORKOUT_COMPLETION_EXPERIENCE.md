# First Workout Completion Experience — Phase 1

> A **UX / copy / presentation** pass on the moment **after** a user finishes and
> saves a workout. Saving already worked functionally (the session is appended to
> history and the draft cleared); this pass makes the user *feel* the completion —
> *"I completed something · my workout was saved · here's a quick summary · here's
> what I can do next."*
>
> **Presentation only.** It does **not** change the `WorkoutSession` /
> `WorkoutExerciseEntry` / `SetEntry` schema, the saved payload, the
> `WorkoutTemplate` schema, the active-draft schema/key
> (`yfos:active-workout-draft:v1`), `yfos:workouts`, backup/restore, workout
> calculations, or save semantics. No AI, no plan generation, no medical/body
> /weight logic.

Files:

- **New** [`components/workouts/WorkoutCompletionCard.tsx`](../components/workouts/WorkoutCompletionCard.tsx)
  — the success card.
- [`components/workouts/WorkoutsView.tsx`](../components/workouts/WorkoutsView.tsx)
  — captures the saved session + builder context and renders the card on the hub.
- **New** [`e2e/workout-completion.spec.ts`](../e2e/workout-completion.spec.ts).

---

## What happens after save

1. The builder's **"סיים ושמור אימון"** runs unchanged: `addWorkout(session)` then
   it clears the active draft (`onSaved(session)`).
2. `WorkoutsView.handleWorkoutSaved(session)` now **captures** the returned
   session plus two pieces of builder-local UI state — the template name it was
   started from (`builderSource` → `sourceLabel`) and whether that start came from
   the profile recommendation (`startedFromRecommendation`) — into a local
   `completed` state, **before** `closeBuilder()` resets those values.
3. The hub re-renders (builder closed) and shows a **non-blocking success card**
   (`WorkoutCompletionCard`) at the very top — **Option A** from the brief (a
   dismissible card, **no** modal/backdrop, so it never traps scrolling or the
   bottom nav).
4. The card is cleared when dismissed (✕) or when a new session is started
   (`openBuilder` / `continueDraft` call `setCompleted(null)`), so it never stacks
   with the draft-restore card or a new active workout.

It is **pure local UI**: nothing about completion is persisted, no new
draft/schema field is added, and the session shown is the one already in history.

## Confirmation content

- **Eyebrow:** `אימון הושלם` (+ the session's muscle-group identity label when
  available).
- **Title:** `אימון נשמר בהצלחה`.
- **Body:** `כל הכבוד — האימון נוסף להיסטוריה שלך.`

### Summary fields shown

All derived **read-only** from the just-saved session object — simple counts, no
new persisted calculation:

| Field | Source |
| --- | --- |
| תרגילים | `session.exercises.length` |
| סטים | sum of `entry.sets.length` |
| ק"ג נפח (volume) | `Σ weightKg × reps` — the **same** figure `WorkoutHistory` already shows. **Only shown when > 0**, so a bodyweight-only session never shows a misleading "0". |
| template name | `התאמנת לפי: {sourceLabel}` — only when started from a saved/recommended template |

### Recommended-start completion context — **included**

Because the builder's recommendation flag (`startedFromRecommendation`) is still
in local state at save time, it is captured into `completed.fromRecommendation`
**without any new persisted field**. When true, the card adds:

> השלמת את האימון שהומלץ לפי הפרופיל שלך.

A **plain** template start shows only the neutral `התאמנת לפי: {name}` origin and
**not** this recommendation line. A free workout / resumed draft shows neither.
*(The brief allowed deferring this if local state were unavailable after save — it
was available, so it is included, not deferred.)*

## Next actions (Part 4)

All map to **existing** routes / behaviours — no new pages:

- **Primary:** `צפה בהיסטוריית אימונים` — smooth-scrolls to the `#workout-history`
  section on the same page (the saved session is the newest card there).
- **Secondary:** `התחל אימון נוסף` — `openBuilder(null)` (a fresh free workout).
- **Optional:** `עבור להתקדמות` — a `Link` to the existing `/progress` route.

## History clarity (Part 5)

While the completion card is showing, a brief reassurance line —
**`האימון האחרון שלך נשמר כאן.`** — appears under the history section header, and
the history section gained `id="workout-history"` (+ `scroll-mt-4`) so the primary
action can scroll to it. The history list itself was **not** redesigned.

## Edge / empty states (Part 6)

- **Free workout saved** → completion card, no origin line.
- **Template workout saved** → `התאמנת לפי: {name}`, no recommendation line.
- **Recommended template saved** → `התאמנת לפי: {name}` **and** the recommendation
  line.
- **No-set exercise** (an exercise whose sets were all removed) → `סטים` reads 0,
  the volume tile is hidden; no error. Saving an **empty** workout remains
  impossible (the finish button stays disabled until ≥1 exercise), so the existing
  validation is preserved — no harsh error path was added.

## Mobile QA notes (360px / 390px)

At both widths the card reads: success badge + **אימון נשמר בהצלחה** + ✕ → body →
optional origin/recommendation lines → a 2- or 3-up summary grid → full-width
**צפה בהיסטוריית אימונים** → a 2-up **התחל אימון נוסף** / **עבור להתקדמות** row.
No horizontal overflow, the action buttons wrap cleanly into the grid, the card
never covers the bottom nav (it sits at the top of normal page scroll), and RTL is
correct. Verified by the e2e overflow assertion at 360px and the 390px project.

## What stayed unchanged

`WorkoutSession` / `WorkoutExerciseEntry` / `SetEntry` + the `addWorkout` payload,
`WorkoutTemplate`, the active-draft schema/key `yfos:active-workout-draft:v1` +
`yfos:workouts`, draft auto-save/restore + cleanup, the finish-save / cancel
confirmations, `lib/workout-recommendation.ts` scoring, the recommendation card +
its start banner, profile / nutrition / water / supplement / protein / gym
schemas, backup/restore, auth/beta/guest/admin/Supabase, AI routes, legal pages.
No new dependencies; localStorage-only.

## Validation

- `npm run lint` ✓ (0 errors, 1 pre-existing warning in `scripts/qa-settings.mjs`).
- `npm run build` ✓ (TypeScript clean, unchanged route table).
- `npm run test:e2e` ✓ **128 green**, including the new `workout-completion.spec.ts`
  (save shows `אימון נשמר בהצלחה` + summary; saved workout in history + reassurance
  line; recommended start adds the recommendation line; plain template start does
  not; free/resumed save shows no origin copy; next actions map to `/progress` and
  reopen the builder; no overflow at 360px) and the existing active-workout /
  recommendation / profile / auth / nutrition / water / protein / supplement specs.
