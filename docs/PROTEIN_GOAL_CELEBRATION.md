# Protein Goal — Reached Celebration

A short, app-wide moment that plays when today's logged protein crosses into the
user's **configured daily protein goal**. It mirrors the architecture of the
[water-goal celebration](WATER_GOAL_GLOBAL_CELEBRATION.md) and the
[supplement-taken celebration](SUPPLEMENT_TAKEN_CELEBRATION.md), but is a
**distinct moment with a distinct meaning**:

- **Water celebration** = reaching the daily *water* goal (cross into 100%).
- **Supplement celebration** = confirming a single supplement was *logged / taken*
  today.
- **Protein celebration** = reaching the user's *own configured* daily protein
  goal through food logs.

It is purely UX feedback. It gives **no** medical advice, diet advice, body-image
language, or any claim about what the user "needs" to eat.

## Files

- `lib/protein-goal-events.ts` — the event seam. Defines
  `PROTEIN_GOAL_REACHED_EVENT = "yfos:protein-goal-reached"`, the
  `ProteinGoalReachedDetail { date, proteinTotalGrams, proteinGoalGrams }`
  payload, `emitProteinGoalReached`, and
  `maybeCelebrateProteinGoalCrossing({ date, prevProteinGrams, nextProteinGrams, goalGrams })`
  which fires **only** on the below→at-or-above crossing of the configured goal.
- `components/nutrition/ProteinGoalCelebrationOverlay.tsx` — the one-shot overlay.
  Mounted once in `components/layout/AppShell.tsx`. Listens for the event, shows
  the themed visuals + the success message, self-dismisses after ~1.4s.
  `pointer-events-none`, `aria-hidden` visuals + a separate `role="status"`
  announcement.
- `app/globals.css` — `--accent-protein*` / `--gradient-protein` /
  `--shadow-protein` design tokens (light + dark), the `.protein-gradient` /
  `.shadow-glow-protein` consumers, the `protein-celebrate-*` keyframes/classes,
  and the `prefers-reduced-motion` fallback.
- Trigger: `lib/fitness-store.ts` → `addFoodLog` (the single food-log mutation
  every add surface already routes through).

## What triggers it

The celebration fires when **today's total logged protein** transitions **from
below the configured goal to at or above it**, through the existing `addFoodLog`
flow. Because the trigger is centralized in the store mutation, it fires
identically from every surface that logs food:

- Manual add (`/nutrition/add` → `FoodLogForm`)
- Catalog / food library add (`/nutrition/library` → the same `FoodLogForm`)
- Add-again / recent food (`NutritionView`'s `הוסף שוב`, journal rows and the
  recent-foods row → `duplicateFoodLogForToday` → `addFoodLog`)
- An AI photo draft, **only** if/when it is confirmed and saved through the normal
  `addFoodLog` flow (AI drafts are never auto-saved; photos are never stored)
- Any future food-add path that uses the same `addFoodLog` mutation

Worked examples (goal = 120g):

| Before | After  | Celebrate? | Why |
| ------ | ------ | ---------- | --- |
| 70g    | 95g    | No         | Still below the goal |
| 110g   | 125g   | **Yes**    | Crossed below → at/above |
| 130g   | 150g   | No         | Was already at/above the goal |
| 130g (page reload) | 130g | No | No add mutation runs on load |
| 130g (backup restore) | 130g | No | Restore writes localStorage directly, not via `addFoodLog` |
| remove to 90g, then add to 125g | — | **Yes** | A fresh below → at/above crossing |

## What does NOT trigger it

- Page render or hydration (a load with the goal already met)
- Loading existing logs
- Adding more food once the goal is already met (the pre-add total is no longer
  below the goal)
- Removing food (removal never crosses *into* the goal)
- Backup restore (writes localStorage directly, bypassing `addFoodLog`)
- A missing / zero / invalid protein goal (`goalGrams <= 0` → never fires)

There is **no per-day "seen" flag**. The crossing is computed from the real
food-log totals at mutation time, so the edge itself is the anti-spam guard — and
**no new persisted state was introduced** (nothing to add to Backup & Restore).
If the user removes food back below the goal and then logs enough again, that is a
fresh crossing, so it **may** celebrate again.

## Protein goal source

The goal is read from the existing `Settings.proteinGoal` (`yfos:settings`) — the
same field used by the nutrition `MacroSummary` and the Today protein hint. No new
settings field was invented. A zero / missing / non-finite goal is handled safely
(no celebration).

## Visual theme

Deliberately **not** the blue water theme or the mint/violet supplement theme. A
warm, premium amber/gold palette (new `--accent-protein` tokens, gold-leaning so
it is distinct from the green nutrition module and the orange energy accent):

- Warm **amber/gold + cream** glow wash.
- A gentle diagonal sweep.
- A popped **target** badge on the protein gradient with `shadow-glow-protein`.
- A few **macro rings** drifting gently upward.
- A scatter of **warm-gold** sparkles (`#f5b942`).

No water-blue waves, no supplement capsule visuals, no aggressive red warning, no
body/fitness-pressure or medical imagery. CSS-only — no canvas/WebGL, no new
dependencies.

## Message copy (Hebrew, RTL)

Primary on-screen: **`יעד החלבון הושלם`**. The screen-reader `role="status"`
announcement reads **`כל הכבוד, יעד החלבון של היום הושלם`**.

### Safety wording decision

The copy is neutral encouragement tied to the user's **own configured target**.
It never implies a medical need, a recommended amount, weight-loss/muscle-gain
promises, or any body ideal. Explicitly avoided: `חובה`, `צריך`, `אסור`,
`מסוכן`, `מומלץ לאכול`, `הגעת לכמות שאתה צריך`, `כדי לרדת במשקל`, `כדי להיראות…`,
and any medical/diet promise. This keeps the feature consistent with the rest of
the nutrition module ("personal tracking only — not medical or diet advice").

## Accessibility / reduced motion

- The decorative layer is `aria-hidden`; a separate visually-hidden `role="status"`
  paragraph announces the success text to screen readers.
- The overlay is `pointer-events-none` and never traps focus or requires
  dismissal — the app stays fully usable underneath, and it self-dismisses.
- Under `prefers-reduced-motion: reduce`, all travel (sweep, rings, sparkles) is
  hidden and the badge animation is disabled; only a brief, static warm
  amber/gold glow remains.

## What stayed unchanged

- `FoodLog` schema and the nutrition localStorage keys (`yfos:foodLogs`,
  `yfos:settings`, saved values, favorites).
- Macro calculations and the nutrition summary calculations (`sumNutrition`,
  `todaysFoodLogs`) — the celebration only *reads* protein totals around the
  existing mutation.
- The `addFoodLog` storage path — no parallel food-logging path was added.
- The nutrition AI draft flow (no auto-save; photos never stored).
- Backup / restore schema (no new persisted state to back up).
- Water / supplement celebrations, workout / gym / water / supplement schemas,
  auth / beta / guest / admin / Supabase, AI routes, privacy / terms / AI
  disclaimer pages.
- No new dependencies.

## Manual QA notes

- **360px & 390px**: the badge + message pill stay centered; the short Hebrew
  copy (`יעד החלבון הושלם`) never overflows the viewport. Nothing blocks the add
  form or the rest of the screen underneath.
- **Reduced motion** (OS "reduce motion" on): crossing the goal shows a brief
  static warm amber/gold glow + the badge, no drifting rings/sparkles, and the
  `role="status"` text still announces.
- **Repeat behavior**: cross the goal → celebrate; add more while over → no
  celebration; remove back below then cross again → celebrates again.
- **Cross-surface**: verified from the manual add form (`/nutrition/add`) and the
  journal's `הוסף שוב`. The food library uses the same `FoodLogForm` →
  `addFoodLog`, so it behaves identically.
- **Already-met-on-load**: reloading `/nutrition` with the goal already reached
  shows no overlay.
