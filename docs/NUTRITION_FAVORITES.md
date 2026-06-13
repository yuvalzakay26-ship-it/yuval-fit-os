# Nutrition — Favorite Foods (Phase 3.19)

Users can mark food-library items as **favorites** for quick access from the
Nutrition workflow. Favorites are about *food identity* only — which foods the
user reaches for often — so they make logging faster without storing or
inferring any nutrition values.

## What favorite foods are (and are not)

- A favorite is a pointer to a food-library item by its `sourceFoodId`.
- Favorites carry **no macros / calories** and never infer nutrition. The app
  still never reads nutrition from an image, an external database, or a name.
- Only **food-library items** can be favorited. Arbitrary manual food logs (no
  stable `sourceFoodId`) cannot be favorited in this phase.

## Storage

- **localStorage key:** `yfos:favorite-foods:v1`
- **Shape:** a JSON object mapping `sourceFoodId → FavoriteFood`.

```ts
// lib/fitness-types.ts
interface FavoriteFood {
  sourceFoodId: string;
  addedAt: string; // ISO timestamp
}
```

Access goes through `lib/storage.ts`
(`getFavoriteFoods`, `isFavoriteFood`, `toggleFavoriteFood`,
`clearFavoriteFoods`) and the reactive layer in `lib/fitness-store.ts`
(`useFavoriteFoods`, `toggleFavoriteFood`, `clearAllFavoriteFoods`), mirroring
the saved-values pattern from Phase 3.18.

## How favorites are toggled

A subtle star control appears in three places, all calling the same
`toggleFavoriteFood(sourceFoodId)`:

1. **Food Library cards** — a frosted star button in the corner of each card.
   Labels: `הוסף למועדפים` (inactive) / `הסר מהמועדפים` (active). The star fills
   amber when active.
2. **Add Food screen** — when a library food is selected, its card shows a
   `מועדף` indicator and a star toggle next to the clear (×) button.

Favorites persist in localStorage and survive refresh.

## Where favorites appear

- **Nutrition main screen** — a compact `מועדפים` row of chips (up to 6, newest
  first) appears in the quick-actions area **only when favorites exist**. Each
  chip deep-links to `/nutrition/add?foodId=<id>`. A `הצג הכל` action opens the
  library's favorites view (`/nutrition/library?view=favorites`).
- **Food Library** — a `מועדפים` filter chip appears when at least one favorite
  exists (or while the favorites filter is active). Selecting it shows only
  favorited items; text search still works within them. Empty state:
  `עדיין אין מאכלים מועדפים` / `סמן מאכלים בכוכב כדי למצוא אותם מהר יותר.`

## Interaction with Saved Food Values (Phase 3.18)

Favorites and saved values are independent stores that compose cleanly:

- Tapping a favorite opens the normal add flow.
- If the food has **saved values**, they prefill exactly as in Phase 3.18.
- If it has **no saved values**, the form stays empty as before.
- Favoriting never creates, edits, or infers macros.

## Settings

A `אפס מאכלים מועדפים` action (with a confirmation step) appears in Settings
**only when favorites exist**, clearing all favorites. FoodLogs and saved values
are untouched. The global "איפוס כל הנתונים" reset also clears favorites, since
the key is part of `STORAGE_KEYS`.

## Intentionally NOT done in this phase

- No favoriting of manual (non-library) food logs.
- No macros / nutrition stored on favorites — identity only.
- No AI / image recognition, no external nutrition lookups.
- No backend / auth / database / cloud sync — localStorage only.
- No reordering or manual sorting of favorites (sorted by recency).

## Future direction

- **Meal templates** — save a group of foods logged together.
- **Smart meal builder** — assemble a meal from favorites + saved values and log
  it in one step.
