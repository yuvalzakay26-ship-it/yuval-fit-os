# Nutrition UX

> 📁 **Archived — historical record.** This is the earlier `/nutrition` UX pass
> (Phase 3.17.1). It has been superseded by
> [`NUTRITION_CLARITY_PASS.md`](../NUTRITION_CLARITY_PASS.md) and the current
> nutrition state in [`PROJECT_STATE.md`](../PROJECT_STATE.md). Kept for history;
> do not treat as current requirements without checking `PROJECT_STATE.md`.

A pass focused on flow, not features. The Nutrition screen had grown into one
long scroll — daily summary, protein calculator, the full food library grid, the
add-food form, and today's diary all stacked together. As the food library
keeps growing this became crowded and the add-food form was easy to lose. The
screen was reorganized into a short, action-based flow, and the heavy pieces
(library + add form) were moved out of the main page.

No nutrition data is invented, no images are imported, and the existing
`yfos:foodLogs` localStorage data continues to work unchanged.

## Update — Phase 3.17.1: full-screen routes instead of sheets

Phase 3.17 moved the library and add-food form into **bottom sheets**. That felt
cramped, temporary, and non-premium — a "sheet on top of sheet" stack with a
dimmed page behind. Phase 3.17.1 replaces the sheets with **dedicated
full-screen routes** that behave like real app screens (rendered inside the
normal app shell — header + bottom nav — with no overlay and no dimming):

- **`/nutrition/library`** — the full food library screen (`FoodLibraryScreen`).
- **`/nutrition/add`** — the add-food screen (`AddFoodView`), which reads
  optional `?foodId=` / `?name=` search params to prefill.

The reusable bottom-sheet component (`components/ui/Sheet.tsx`) and its
`sheet-up` animation were removed — nothing else used them.

## Main screen structure (after the change)

1. **Daily nutrition summary** (`MacroSummary`) — protein ring, calories, carbs/fat pills, goal bars.
2. **Protein goal** (`ProteinCalculator`) — collapsed g/kg calculator.
3. **Quick actions** — the compact entry points:
   - `בחר מהמאגר` — opens the full-screen food library (`/nutrition/library`).
   - `הוסף ידנית` — opens the full-screen add-food screen (`/nutrition/add`).
   - `מועדפים` — quick chips for starred library foods (shown only when any exist).
4. **`אכלת לאחרונה`** — quick reuse: a horizontal row of recently logged foods,
   each with a one-tap `הוסף שוב` that re-logs it for today. Replaced the old
   deep-link "אחרונים" chips (which forced re-entering values). See
   [`NUTRITION_QUICK_REUSE.md`](../NUTRITION_QUICK_REUSE.md).
5. **Today's diary** — logged foods with thumbnails (each with `הוסף שוב`), or an
   action-oriented empty state.

The full food library grid and the add-food form are **no longer inline**; they
open on demand. This keeps the main page short regardless of how big the library
gets.

## How food selection works now

- Tapping **`בחר מהמאגר`** navigates to **`/nutrition/library`** — a full-screen
  library with a back link, header, search, category chips, and the full
  food-card grid (`FoodLibrary` is passed `expandable={false}`, so every match
  shows and the page itself scrolls).
- Selecting a food navigates to **`/nutrition/add?foodId=<id>`**, prefilled with
  the food's name, image, and category. The add screen's back link returns to
  the library.
- Tapping **`הוסף ידנית`** navigates to **`/nutrition/add`** with a blank form
  (back link to Nutrition).
- Tapping **`הוסף שוב`** (under `אכלת לאחרונה` or on a diary row) does **not**
  navigate — it duplicates that log into today's journal in place and confirms
  with a calm `נוסף ליומן של היום` toast. See
  [`NUTRITION_QUICK_REUSE.md`](../NUTRITION_QUICK_REUSE.md).

Each step is a real route, so the browser/hardware **back** button works
naturally (library → add → back → library), and there is never a stacked-overlay
feeling.

## Selected-food add flow

The add screen (`AddFoodView` → `FoodLogForm`) shows, in order:

- A "נבחר מהמאגר" card with the food image, name, and **category label** (when
  the food came from the library).
- Food name, meal-type selector, quantity.
- Protein / carbs / fat / calories fields.
- Primary button: **`הוסף ליומן`**.

Macros are never pre-filled from the library — the user enters portion values
each time. Saving writes a `FoodLog` and returns to the Nutrition screen; the
diary and totals update from the user-entered values only.

## Update — Phase 3.22: premium guided "Add to Journal" flow

The add screen was reworked from one long generic form into a **guided,
card-grouped logging flow**, so a user immediately understands the sequence:
selected food → meal → quantity → nutrition values → optional save → add. The
data model is unchanged — `FoodLog`, `SavedFoodValue`, the localStorage keys, and
the "add to journal" behavior all work exactly as before. The form is no longer
wrapped in a single `Card`; each step is its own surface (`FoodLogForm`’s
internal `bare`/`Card` switch was removed since the form now styles its own
sections).

What changed, by section:

1. **Selected food context** — a more prominent accent-tinted card (larger
   thumbnail, `נבחר מהמאגר` eyebrow with a check, favorite star + clear).
2. **Quantity** — clearer label **`כמה אכלת?`**, an example-rich placeholder
   (`200 גרם, מנה אחת, 2 פרוסות`), and tappable **quick presets**
   (`100 גרם / מנה / כוס / פרוסה / יחידה`) that fill the free-text field in one
   tap. The data model stays a single `quantityText` string — presets are pure
   UI sugar.
3. **Nutrition values** — calories is shown as an emphasized headline field with
   a flame icon and a **`קק״ל`** unit; protein / carbs / fat sit in a labelled
   row each with a **`גרם`** unit. A **`ניתן לעריכה`** pill plus a contextual
   hint make it unmistakable that these are editable inputs, not passive stats.
   Native number spinners are hidden for a cleaner look.
4. **Empty-value clarity** — instead of bare `0 / 0 / 0 / 0`, the hint explains
   the state: for a library food with no saved values, *"אין עדיין ערכים שמורים
   למאכל הזה — הזן אותם פעם אחת ושמור לפעם הבאה"*; when saved values were loaded,
   *"הערכים נטענו מהפעם הקודמת…"*; for manual entry, *"הזן את הערכים… (לא חובה)"*.
5. **Save for next time** — promoted to a labelled card with a bookmark icon, a
   plain-language description of what it does, and a **toggle switch** (RTL-aware)
   instead of a bare checkbox. The reset-saved affordance is unchanged.
6. **CTA** — the **`הוסף ליומן`** button stays full-width and prominent; a helper
   line appears while the food name is empty. The page’s `pb-32` keeps it clear
   of the fixed bottom nav.

No AI, estimation, recommendations, backend, or auth were added. QA:
`qa/add-food-flow-check.mjs` captures the library + manual variants at 360px and
390px in light and dark and asserts no horizontal overflow.

## Macro / progress text clarity

Goal bars previously read like `0 / 150` which, in an RTL line, could visually
flip to `150 / 0`. They now use the unambiguous Hebrew form **`0 מתוך 150 גרם`**
and **`0 מתוך 2200 קלוריות`**. Calculations are unchanged.

## Data model

**No data model changes.** `FoodLog` is unchanged and existing logs keep working
(image and image-less logs both render). The `אכלת לאחרונה` list is a pure
derivation over existing logs (`getRecentFoodEntries()` in
`lib/nutrition-reuse.ts`) — it stores nothing new. Unlike the old "אחרונים" chips,
it carries the user's previously entered macros so `הוסף שוב` can re-log in one
tap (`createFoodLogFromExistingEntry()`); nothing is ever inferred. See
[`NUTRITION_QUICK_REUSE.md`](../NUTRITION_QUICK_REUSE.md).

## Intentionally not implemented yet

These were left as future work to avoid shipping empty/broken features:

- **Saved food values** — remembering a user's per-food macro values so a
  repeated food can prefill its numbers.
- **Favorites** — there is no favorites store today, so no favorites action was
  added (only data-backed "אחרונים").
- **Meal templates** — saving a group of foods as a reusable meal.

The structure is ready for these: the quick-actions row and the library/add
screens are the natural homes for favorites, saved values, and templates when a
backing data model exists.
