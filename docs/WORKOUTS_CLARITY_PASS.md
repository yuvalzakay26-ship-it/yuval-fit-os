# Workouts Clarity Pass — Part 1

A UX **clarity / layout / copy** pass on the `/workouts` hub. No new features, no
schema changes, no localStorage key changes, no behavior changes. The goal was to
turn a stack of equal-weight cards into a clear **training command center** where
the user instantly knows _what to do now_.

All edits are in **`components/workouts/WorkoutsView.tsx`** (plus one new e2e
spec). No other component, store, type, or storage key was touched.

## Problem

The hub showed too many actions competing at equal weight — "אימון חדש",
"התחל אימון", "תכנית/תבנית חדשה", gym attendance, "התחל אימון ראשון",
"צור תבנית" — so the primary path ("how do I train now?") was not obvious, and
the gym card + a large empty-history card duplicated the top CTA.

## Hierarchy chosen

Top-down weighting, strongest first:

1. **Active draft (if any)** — `DraftRestoreCard` with **"המשך אימון"** stays at
   the very top. An in-progress workout is never buried.
2. **Command center hero** — "מרכז האימונים" / "בנה את האימון הבא שלך", the
   stats, and the primary action.
3. **Templates** — the **main content** of the hub, directly under the command
   area, so the page guides you toward picking a ready plan.
4. **Gym attendance** — a quiet **secondary** link, moved **below** templates so
   it no longer competes with starting a workout.
5. **Workout history** — secondary; calm, compact empty state.

## What changed in the top command area

- The single, vague CTA **"אימון חדש"** was replaced with two clearly-ranked
  actions:
  - **Primary: "התחל אימון"** (`PlayIcon`) — starts a free workout
    (`openBuilder(null)`), unchanged flow.
  - **Secondary: "צור תבנית חדשה"** — opens the template editor
    (`setEditingTemplate("new")`), unchanged flow.
- This disambiguates _start a workout now_ vs. _save a reusable plan for later_.
- **Draft-aware emphasis:** when a meaningful draft exists
  (`hasMeaningfulWorkoutDraft`), the restore card's **"המשך אימון"** owns the
  primary weight, so the hero's "התחל אימון" steps **down** to the `secondary`
  Button variant (off the strength gradient). Two strong primaries never compete.

## What changed in the templates section

- Kept the title **"תבניות אימון"** and the secondary **"תבנית חדשה"** header
  action (unchanged).
- Added a one-line helper via the existing `SectionHeader` `hint` prop —
  **"בחר תבנית מוכנה והתחל להתאמן"** — shown only when templates exist, so the
  section's role ("saved plans you start from") is explicit.
- Template cards, their per-card **"התחל אימון"** button, and edit/delete are all
  unchanged.

### Terminology note

The product brief suggested "תכנית". The whole app already uses **"תבנית"**
consistently (section title, header action, empty states, history's
"שמירת האימון כתבנית"). Switching one surface to "תכנית" would read as a
_different_ concept and hurt clarity. We kept **"תבנית"** everywhere; the clarity
win comes from hierarchy + helper copy + clearer button labels, not a renamed
noun.

## What changed in gym / history placement & copy

- **Gym attendance** card moved from _between hero and templates_ to **below the
  templates section**. It stays a quiet `module-energy` link to `/gym`. Subtitle
  sharpened to **"כניסה, יציאה וזמן שהייה — בנפרד מהאימון"** to distinguish
  entering the gym from logging a workout. No gym logic / schema / same-day
  behavior touched. (Live-visit promotion was intentionally _not_ added here — it
  would require gym state logic this pass must not change.)
- **Empty workout history** was a large `raised` card with two prominent CTAs
  ("התחל אימון ראשון" gradient + "צור תבנית") that duplicated the command center.
  It is now a **calm, compact dashed empty state** (matching the empty-templates
  treatment) with the message **"כאן ייבנה סיפור הכוח שלך"** and a short
  explanation — **no competing CTA**. The command center is the single home for
  starting a workout / creating a template.

## What stayed unchanged

- Workout, template, draft, gym, nutrition, water, supplement schemas.
- All localStorage keys (`yfos:workouts`, `yfos:workout-templates:v1`,
  `yfos:active-workout-draft:v1`, `yfos:gym-visits:v1`, …).
- Backup/restore format; auth / beta / guest / admin / Supabase / AI routes;
  privacy/terms.
- Active draft recovery, start-from-template (with last-performance prefill),
  create/edit/delete template, workout history, gym check-in/out, exercise
  reorder, save-as-template, "שכפל אימון אחרון".
- Water / supplement / protein / Today / Nutrition clarity work, bottom nav,
  scroll-to-top.
- No new dependencies.

## Validation

- `npm run lint` — clean (one pre-existing unrelated warning in
  `scripts/qa-settings.mjs`).
- `npm run build` — succeeds; `/workouts` still prerendered static.
- `npm run test:e2e` — **70 passed**, including the new
  `workouts-command-hierarchy.spec.ts` and all existing
  water/supplement/protein/today/nutrition specs.

## Manual QA notes — 360px / 390px

- No horizontal overflow at 360px or 390px. The two stacked hero buttons and the
  gym/template/history cards are full-width and wrap cleanly.
- Primary CTA ("התחל אימון") is visible near the top without scrolling.
- Template cards remain readable; edit/delete buttons do not overlap.
- Bottom nav does not cover history actions; scroll-to-top button does not block
  the command-area CTAs.
- RTL text stays right-aligned; dark mode remains readable (calm dashed empty
  states use the same tokens as the existing empty-templates state).
