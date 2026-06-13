# Nutrition — Saved Food Values (Phase 3.18)

The Nutrition system can remember the **quantity + macros a user entered for a
food-library item**, so the next time they add that same food the form prefills
those values. This makes logging frequently-eaten foods fast without typing the
same numbers over and over.

## What saved food values are (and are not)

- They are **personal defaults**, captured from what the user typed — the exact
  quantity text and the protein / carbs / fat / calories they entered.
- They are **NOT** official nutrition facts. The app never infers nutrition from
  an image, never calls an external nutrition database, and never derives values
  from the food photo or name.
- They are keyed by the library item's `sourceFoodId`. Manual foods (typed by
  name, no `sourceFoodId`) are **not** saved — there is no clean manual-save flow
  for them in this phase.

## Storage

- **localStorage key:** `yfos:saved-food-values:v1`
- **Shape:** a JSON object mapping `sourceFoodId → SavedFoodValue`.

```ts
// lib/fitness-types.ts
interface SavedFoodValue {
  sourceFoodId: string;
  foodName: string;
  imagePath?: string;
  category?: string;
  quantity: string;   // exact text, e.g. "200 גרם"
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  updatedAt: string;  // ISO timestamp of the last save
}
```

All access goes through `lib/storage.ts`
(`getSavedFoodValues`, `getSavedFoodValue`, `saveSavedFoodValue`,
`deleteSavedFoodValue`, `clearSavedFoodValues`) and the reactive layer in
`lib/fitness-store.ts` (`useSavedFoodValues`, `saveFoodValue`,
`removeFoodValue`, `clearAllFoodValues`), mirroring the existing FoodLog
pattern.

## How values are saved

On the add screen (`/nutrition/add?foodId=<id>`), `FoodLogForm` shows a checkbox
**“שמור ערכים לפעם הבאה”** for library foods. When it is checked and the user
saves, the entered quantity + macros are written to the saved-values store under
that `sourceFoodId` (creating or updating the entry). The FoodLog itself is
written exactly as before — saving values is an additional, opt-in side effect.

When a saved value already exists for the food, the checkbox defaults to checked
so re-editing keeps it in sync.

## How values are loaded

When the add screen opens for a food that has a saved value, `FoodLogForm`
prefills the quantity and macros from it (once, after localStorage hydrates) and
shows a small note **“נטען מהערכים ששמרת”**. The user can freely edit the values
before saving.

## How reset works

- **Per-food:** when a saved value exists, a secondary action
  **“אפס ערכים שמורים”** appears next to the note. It removes only that food's
  saved value and leaves the form fields as-is (so an in-progress edit isn't
  lost).
- **All foods (Settings):** when at least one saved value exists, Settings shows
  **“אפס ערכי מאכלים שמורים”** with a confirmation step, clearing every saved
  food value. FoodLogs are untouched.
- The global **“איפוס כל הנתונים”** reset also clears saved values, since the key
  is part of `STORAGE_KEYS`.

## Backward compatibility

- Existing FoodLog data is unchanged. Saved values live under a separate key.
- Totals are still computed only from FoodLog entries — saved values never feed
  into any total.

## Intentionally NOT done in this phase

- No per-100g / per-gram scaling — the exact saved quantity + macros are reloaded
  verbatim (no recalculation).
- No AI / image recognition, no external nutrition lookups.
- No backend / auth / database / cloud sync — localStorage only.
- Recent foods remain a shortcut to food identity; they do **not** auto-fill
  macros unless backed by a saved value via the normal load path.

## Future direction

- Per-100g scaling so a saved value can adapt to a different quantity.
- Favorites / pinned foods.
- Meal templates (groups of foods logged together).
