# Nutrition UX (Phase 3.17)

A pass focused on flow, not features. The Nutrition screen had grown into one
long scroll — daily summary, protein calculator, the full food library grid, the
add-food form, and today's diary all stacked together. As the food library
keeps growing this became crowded and the add-food form was easy to lose. This
phase reorganizes the screen into a short, action-based flow and moves the heavy
pieces into focused bottom sheets.

No nutrition data is invented, no images are imported, and the existing
`yfos:foodLogs` localStorage data continues to work unchanged.

## Main screen structure (after the change)

1. **Daily nutrition summary** (`MacroSummary`) — protein ring, calories, carbs/fat pills, goal bars.
2. **Protein goal** (`ProteinCalculator`) — collapsed g/kg calculator.
3. **Quick actions** — the compact entry points:
   - `בחר מהמאגר` — opens the food library picker sheet.
   - `הוסף ידנית` — opens a blank add-food sheet.
   - `אחרונים` — a horizontal row of recently logged foods (shown only when such data exists).
4. **Today's diary** — logged foods with thumbnails, or an action-oriented empty state.

The full food library grid and the add-food form are **no longer inline**; they
open on demand. This keeps the main page short regardless of how big the library
gets.

## How food selection works now

- Tapping **`בחר מהמאגר`** opens the **food library picker** — a bottom sheet
  (`components/ui/Sheet.tsx`) containing search, category chips, and the full
  food-card grid. The grid renders all results inside the scrollable sheet
  (`FoodLibrary` is passed `expandable={false}`); the sheet handles scrolling, so
  there's no "show more" toggle there.
- Selecting a food **closes the picker and opens the add-food sheet**, prefilled
  with the food's name, image, and category.
- Tapping **`הוסף ידנית`** opens the same add-food sheet with an empty form.
- Tapping a chip under **`אחרונים`** opens the add-food sheet prefilled from a
  previously logged food.

## Selected-food add flow

The add sheet (`FoodLogForm`, rendered with `bare`) shows, in order:

- A "נבחר מהמאגר" card with the food image, name, and **category label** (when
  the food came from the library).
- Food name, meal-type selector, quantity.
- Protein / carbs / fat / calories fields.
- Primary button: **`הוסף ליומן`**.

Macros are never pre-filled from the library — the user enters portion values
each time. Saving writes a `FoodLog` and closes the sheet; the diary and totals
update from the user-entered values only.

## Macro / progress text clarity

Goal bars previously read like `0 / 150` which, in an RTL line, could visually
flip to `150 / 0`. They now use the unambiguous Hebrew form **`0 מתוך 150 גרם`**
and **`0 מתוך 2200 קלוריות`**. Calculations are unchanged.

## Data model

**No data model changes.** `FoodLog` is unchanged and existing logs keep working
(image and image-less logs both render). The "אחרונים" list is a pure derivation
over existing logs (`recentFoods()` in `lib/analytics.ts`) — it stores nothing
new and carries no macros.

## Intentionally not implemented yet

These were left as future work to avoid shipping empty/broken features:

- **Saved food values** — remembering a user's per-food macro values so a
  repeated food can prefill its numbers.
- **Favorites** — there is no favorites store today, so no favorites action was
  added (only data-backed "אחרונים").
- **Meal templates** — saving a group of foods as a reusable meal.

The structure is ready for these: the quick-actions row and the picker/add
sheets are the natural homes for favorites, saved values, and templates when a
backing data model exists.
