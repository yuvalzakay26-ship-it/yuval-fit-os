# Nutrition Quick Reuse — "אכלת לאחרונה" + "הוסף שוב"

> Phase 3.xx. Makes daily nutrition logging fast: re-log a food you already ate
> in **one tap**, with no searching and no re-typing values. This is **quick
> reuse**, not a meal-template system.

## What it does

Daily users eat the same foods repeatedly. Instead of re-finding a food and
re-entering its quantity + macros every time, the Nutrition screen now offers:

1. **`אכלת לאחרונה`** — a compact, horizontally-scrolling row of the foods you
   logged most recently. Each card shows the food name, meal-type badge,
   quantity, calories and protein/carbs/fat, plus a **`הוסף שוב`** button.
2. **`הוסף שוב` on every journal entry** — each row in *יומן האוכל של היום* has a
   small `הוסף שוב` action that duplicates that entry into today's journal.

Tapping `הוסף שוב` creates a **new** food-log entry for today using the previous
entry's values, and shows a calm, auto-dismissing confirmation:
**`נוסף ליומן של היום`**.

## Where it lives

- **Nutrition screen** (`/nutrition`, `components/nutrition/NutritionView.tsx`) —
  the primary place. A new `אכלת לאחרונה` section sits between *הוספה מהירה* and
  *היומן של היום*; the journal rows gained a `הוסף שוב` button next to delete.
- Today and the Add-Food screen were intentionally **not** cluttered — Nutrition
  is the single home for this feature.

## How it works (data)

Recent foods are **derived purely from the existing food-log history**
(`yfos:foodLogs`). There is **no new storage key** and **no new data model** —
`FoodLog` is unchanged. The pure helpers live in `lib/nutrition-reuse.ts`:

| Function | Purpose |
| --- | --- |
| `normalizeRecentFoodKey(entry)` | Stable de-dupe key: `sourceFoodId` (or normalized name) + quantity + macros. |
| `getRecentFoodEntries(logs, limit = 8)` | Newest-first, de-duplicated recent entries; capped at 8. |
| `createFoodLogFromExistingEntry(entry)` | Builds a **new** `FoodLog` for today from an existing one. |
| `duplicateFoodLogForToday(entry)` | Alias of the above, reads naturally at call sites. |

All four are pure (no storage access). The component persists a duplicate via the
existing `addFoodLog` mutation in `lib/fitness-store.ts`.

### De-duplication

Logs arrive newest-date-first from storage. `getRecentFoodEntries` keeps the
first (most recent) entry per `normalizeRecentFoodKey` and stops at 8, so the
same food + portion never appears twice in a row. Two genuinely different
portions of the same food (different quantity/macros) can both appear.

### Duplicating an entry

`createFoodLogFromExistingEntry` assigns a fresh `createId("food")` and today's
local date (`todayISO()`), copies `foodName`, `mealType`, `quantityText`, macros,
and the optional `calories`/`notes`/`imagePath`/`category`/`sourceFoodId` when
present. The **original entry is never mutated** and the new entry counts exactly
like any normal food log — today's totals, Today's nutrition status and Progress
all update from it automatically.

It is fine to `הוסף שוב` a food that was already logged today — the user may eat
the same thing twice; the action is explicit, so there is no confirmation.

## Empty state

When there are no food logs yet, the section shows friendly copy instead of an
empty box:

> **עדיין אין מאכלים אחרונים**
> אחרי שתוסיף אוכל ליומן, תוכל להוסיף אותו שוב בלחיצה אחת.

## Relationship to favorites / saved values

These stay **separate concepts** and are untouched:

- **Favorites** (`yfos:favorite-foods:v1`) — foods the user intentionally starred.
  Identity only, no macros.
- **Saved values** (`yfos:saved-food-values:v1`) — the user's remembered per-food
  default macros, prefilled in the add flow.
- **Recent foods** — foods *actually logged* recently (derived, no storage).
- **Add again** — duplicate a previous log entry verbatim.

## Backup behavior

Because recent foods are **derived from `yfos:foodLogs`** and no new key was
added, **Backup & Restore is unchanged**. After a restore, the food logs come
back and the recent list re-derives automatically. No backup schema change.

## Boundaries

No backend, auth, AI, API, database, cloud sync, or native work. No diet advice,
calorie targets, or recommendations. Macros are always the user's own entered
values — nothing is inferred.

## QA

`scripts/qa-nutrition-reuse.mjs` (expects `next start -p 3338`): empty state,
recent de-dupe + 8-item limit, add-again from the recent section and from the
journal (new id, today's date, values match, original untouched, totals update),
360/390 no-overflow, light/dark, no console errors. The headline scenario seeds an
older `טוסט אבוקדו` and confirms one tap re-logs it for today.
