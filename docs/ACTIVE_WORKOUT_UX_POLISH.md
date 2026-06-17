# Active Workout UX Polish — Phase 1

> A **UX / copy / layout clarity pass** on the active-workout builder, so that
> after a user starts a workout (free, from a template, from a recommended
> template, or by restoring a draft) the screen reads as *"you are now inside an
> active workout — here are your exercises, log your sets, finish when ready, and
> your draft is safe."*
>
> This is **presentation only**. It does **not** change the
> `WorkoutSession` / `WorkoutExerciseEntry` / `SetEntry` schema, the
> `WorkoutTemplate` schema, the active-draft schema
> (`yfos:active-workout-draft:v1`), any `localStorage` key, the start-from-template
> flow, the recommendation logic/scoring, the auto-save/restore behaviour, workout
> calculations, or save semantics. No AI, no workout generation, no backend.

Files touched:

- [`components/workouts/WorkoutBuilder.tsx`](../components/workouts/WorkoutBuilder.tsx)
  — hero header, origin context, action-oriented helper, exercise-list section
  label, set-input clarity, draft-safety copy.
- [`components/workouts/WorkoutsView.tsx`](../components/workouts/WorkoutsView.tsx)
  — threads a **display-only** `sourceLabel` (the template name) into the builder
  when a session is started from a template / recommendation.
- [`e2e/active-workout-ux.spec.ts`](../e2e/active-workout-ux.spec.ts) — new spec.

---

## What was polished

### 1. Active-workout header / hero (Part 1)

The hero already led with a pulsing **"אימון פעיל"** eyebrow; this pass made the
context explicit and action-oriented:

- **Origin line** — when the session was started from a saved or recommended
  template, the hero shows **"מתאמן לפי: {templateName}"** directly under the
  "אימון פעיל" eyebrow. It is driven by a new **display-only** `sourceLabel` prop
  (see below) — *not* the editable title, which the user may freely rename — and
  is absent for a free workout or a restored draft (which has no single source
  template).
- **Action-oriented helper** under the title input:
  - no exercises yet → *"התחל בבחירת תרגיל, ואז הוסף סטים ומשקלים."*
  - one or more exercises → *"הוסף סטים, עדכן משקלים וסיים כשאתה מוכן."*

The hero stays calm: the pulsing dot, stats, and progress bar are unchanged; only
two short lines were added.

### 2. Exercise list clarity (Part 2)

The exercise list now opens with a clear **"תרגילי האימון ({count})"** section
heading. Previously a bare `{n} תרגילים` line only appeared with **2+** exercises
(it shared a row with the collapse/reorder controls). Now the heading appears from
the **first** exercise, and the collapse-all / reorder controls remain gated to
**2+** exercises (they are useless with one). Card spacing, the muscle/equipment
labels, previous-performance line, set rows, and the **"הוספת סט"** button are
unchanged.

### 3. Set logging clarity (Part 3)

The set table keeps its clear **סט / ק"ג / חזרות / בוצע** column headers. Two
small clarity touches:

- the weight and reps inputs now show a faint **`0`** placeholder so an empty
  field reads as "enter a number" rather than blank;
- each numeric input gained an `aria-label` (`משקל (ק"ג), סט N` / `חזרות, סט N`)
  for assistive tech — the visible compact header row is unchanged.

No data meaning changed: an empty field still means `0`, as before.

### 4. Finish / save CTA hierarchy (Part 4)

Unchanged — it was already correct. The primary final action is
**"סיים ושמור אימון"** (disabled-but-visible until at least one exercise exists),
with **"ביטול"** clearly secondary. Cancelling a meaningful session still goes
through the confirm dialog, whose default safe choice keeps the auto-saved draft
and whose explicit destructive choice (**"מחק טיוטה וצא"**) discards it. No
confirmation was removed and ending a workout was not made easier.

### 5. Draft safety / persistence copy (Part 5)

The calm in-hero auto-save line now reads **"נשמר אוטומטית כטיוטה"** (+ the
last-saved time), making it explicit that the in-progress session is held as a
recoverable **draft** until the user finishes it. The leave-confirm dialog and the
hub `DraftRestoreCard` reassurance (*"הטיוטה נשמרת במכשיר הזה בלבד."*) are
unchanged.

### 6. Recommendation start context (Part 6)

**Preserved exactly.** Starting from the recommendation card still shows the
dismissible, local-only banner *"מעולה, התחלת מהתבנית שהומלצה לפי הפרופיל שלך."*
(`data-testid="recommendation-start-notice"` in `WorkoutsView`). It still carries
no draft field and clears with the builder. Because a recommended start *is* a
template start, the new **"מתאמן לפי: {templateName}"** origin line in the hero now
complements the banner — the banner explains *why* this template, the origin line
states *what* the user is training by. The banner does **not** appear for a plain
template start.

### 7. Mobile UX (Part 7)

Verified at **360px** and **390px**: no horizontal overflow, action buttons wrap
cleanly, inputs stay tappable, the finish/save CTA is never hidden by the bottom
nav, and RTL stays correct.

### 8. Empty / edge states (Part 8)

- **No exercises** → the hero helper guides *"התחל בבחירת תרגיל…"*, the
  add-exercise CTA reads **"בחר תרגיל ראשון"**, and there is no exercise-list
  header yet (nothing to label).
- **Template with exercises** → origin line + section header + seeded set rows.
- **Restored draft** → active header + section header; no origin line (the draft
  has no single source template); title comes from the draft.
- **Recommended-template start** → confirmation banner + origin line.

## The `sourceLabel` prop (why it does not touch the schema)

`WorkoutBuilder` gained an optional `sourceLabel?: string | null`. `WorkoutsView`
sets it to the template title in `startFromTemplate` (which the recommendation
start also calls) and to `null` for a free workout (`openBuilder(null)`) or a
resumed draft. It is **pure presentation**: it is rendered in the hero, never
written into `entries`, the draft, or saved history, and never read back. The
editable workout title is still the single persisted headline.

## What stayed unchanged

- `WorkoutSession` / `WorkoutExerciseEntry` / `SetEntry` schema + the saved payload
  (`addWorkout`), the `WorkoutTemplate` schema, the active-draft schema/key
  `yfos:active-workout-draft:v1`, and `yfos:workouts`.
- Start-from-template flow, auto-save/restore, the conflict prompt, reorder, the
  collapsible cards, the exercise picker, the no-duplicate rule, kg/reps/completed
  semantics, and the finish-save / cancel confirmations.
- `lib/workout-recommendation.ts` scoring/signals and the recommendation card.
- Profile / nutrition / water / supplement / protein / gym schemas, backup/restore,
  auth/beta/guest/admin/Supabase, AI routes, legal pages. No new dependencies;
  localStorage-only.

## Validation

- `npm run lint` ✓ (0 errors, 1 pre-existing warning in `scripts/qa-settings.mjs`).
- `npm run build` ✓ (TypeScript clean, unchanged route table).
- `npm run test:e2e` ✓ **122 green**, including the new
  `active-workout-ux.spec.ts` (template start shows "אימון פעיל" + "מתאמן לפי" +
  "תרגילי האימון"; free workout shows the active header but no origin line; add-set
  works; finish/save records and returns to the hub; draft restore works; no
  horizontal overflow at 360px) and the existing
  `workout-recommendation.spec.ts` / `workouts-command-hierarchy.spec.ts`.

## Manual QA notes (360px / 390px)

At both widths the active workout reads top-down as: **אימון פעיל** → (optional)
**מתאמן לפי: …** → editable title + action helper → auto-save-as-draft line →
muscle chips + stats + progress → **תרגילי האימון** section → exercise cards with
set rows (faint `0` placeholders) and **הוספת סט** → primary **סיים ושמור אימון**
+ secondary **ביטול**. No element overflows horizontally, the set inputs are
comfortably tappable, and the finish CTA clears the bottom nav.
