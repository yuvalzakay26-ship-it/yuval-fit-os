# Recipe Library V1 — Protein Sweets / Personal Recipes

A local-first, no-AI recipe library: a browsable list of protein-focused sweet
recipes (plus two savory ones), each with factual nutrition, ingredients, optional
toppings, and clean app-voice preparation steps — with a one-tap "add to the food
log" action that reuses the existing nutrition flow.

Route: **`/recipes`** (list) → **`/recipes/[id]`** (detail).
Screen title **"ספריית מתכונים"**, subtitle
**"מתכוני חלבון ומתוקים שאפשר לשמור ליומן התזונה."**

## Scope (V1)

- Recipe **list** with search (title / tag / ingredient) and category filter chips.
- Recipe **detail view** (`/recipes/[id]`): hero placeholder, category + serving +
  tag badges, nutrition card, "הוסף ליומן התזונה" button, ingredients, optional
  toppings, and numbered preparation steps.
- **Categories** (Hebrew): "פנקייקים", "שייקים", "מאפים", "קינוחים", "ארוחת בוקר",
  "נשנוש" (the spec also defines "מתוקים"; no V1 recipe maps to it, so its chip is
  simply not shown — `recipeCategoriesInLibrary()` only surfaces non-empty
  categories).
- **Nutrition integration**: "הוסף ליומן התזונה" writes a real `FoodLog` for today
  using the recipe's macros (see below).
- **No** AI, **no** recipe generation, **no** meal-plan generation, **no** diet /
  medical / body claims.

## Private PDF handling — copyright-safe

The source was a private recipe-book PDF supplied as reference only.

- The PDF was found in `public/` on entry and **immediately moved** to
  `private-input/recipes-source.pdf` (a private, git-ignored folder).
- **`/private-input/**` was added to `.gitignore` before any commit.** A
  `git check-ignore` confirms the file is ignored; `git status` never lists it.
- The PDF was **never committed**, **never placed in public assets**, and is
  **never referenced or shown by the app**.
- A temporary text extraction (`private-input/recipes-text.txt`, via `pdftotext`)
  was used only to read the factual data; it lives in the same ignored folder and
  is not committed.
- **No** original images, layout, branding, stamps, marketing lines, or visual
  design were copied.

### What data was extracted (factual only)

Per recipe: name, ingredients, **exact** ingredient quantities, nutrition values
(calories / protein / carbs / fat / fiber), serving scope (per recipe / per serving
/ per unit / without toppings), optional toppings, oven temperature & cooking time
where present.

### What was rewritten

- **Preparation steps were rewritten from scratch** into clean, concise app-style
  Hebrew. The functional steps, their order, temperatures (e.g. 180°C) and times
  (e.g. 15 דקות) are preserved exactly; **no wording is copied verbatim**.
- Ingredient lines were lightly normalized for formatting (units like "מ״ל",
  en-dash ranges) while keeping every quantity unchanged.

### What was intentionally **not** changed

Ingredient quantities, nutrition values, cooking temperatures, cooking times, and
the functional cooking order are reproduced **exactly** as in the source. (Two
recipes — עוגת גזר and עוגת בראוניז — carry identical macro figures in the source;
this was preserved as-is rather than "corrected", per the no-change rule.)

## Image policy

No images are shipped in V1. Every recipe supports an optional `imageUrl` field;
when absent (the default) the UI renders a safe per-category gradient placeholder
(`RecipePlaceholder` / `RecipeImage`, mirroring the nutrition `FoodPlaceholder`).
**No original PDF imagery is used.** Yuval will upload/generate images separately
later by populating `imageUrl`.

## Data model

`lib/recipes.ts` (static seed, local-first — no storage key, no backend):

```ts
type RecipeNutritionScope = "per_recipe" | "per_serving" | "per_unit" | "without_toppings";

type RecipeNutrition = {
  calories?: number; proteinGrams?: number; carbsGrams?: number;
  fatGrams?: number; fiberGrams?: number;
  scope: RecipeNutritionScope; note?: string;
};
type RecipeIngredient = { text: string };
type RecipeStep = { text: string };
type RecipeCategory = "מתוקים" | "שייקים" | "פנקייקים" | "מאפים" | "קינוחים" | "ארוחת בוקר" | "נשנוש";

type Recipe = {
  id: string; title: string; category: RecipeCategory; tags: string[];
  servings?: string; imageUrl?: string;
  nutrition: RecipeNutrition;
  ingredients: RecipeIngredient[];
  optionalToppings?: RecipeIngredient[];
  steps: RecipeStep[];
  sourceType: "private_reference_rewritten";
};
```

Helpers: `recipeById`, `recipeCategoriesInLibrary`, `filterRecipes`,
`recipeServingText`, `foodLogFromRecipe`.

## Nutrition integration status — IMPLEMENTED

`foodLogFromRecipe(recipe)` builds a normal `FoodLog` (today's date, a new id) from
the recipe's macros and the existing `addFoodLog` store mutation writes it — so the
protein-goal celebration and today's journal behave identically to any other add.

- `quantityText` reflects the scope ("מנה שלמה", "יחידה אחת", "חתיכה (…)",
  "מנה שלמה (ללא תוספות)").
- `mealType` defaults to `breakfast` for the "ארוחת בוקר" category, else `snack`
  (editable later in the normal nutrition flow).
- **Fiber is dropped** — `FoodLog` has no fiber field and the schema was **not**
  changed. Optional toppings are **not** added (their values are excluded by scope).

## Navigation entry points

- **Nutrition screen** (`/nutrition`) → "כלים נוספים" → "ספריית מתכונים".
- **System Hub** (`/more`) → תזונה group → "ספריית מתכונים".
- The Nutrition bottom-nav tab stays active on `/recipes` (added to its `match`).
- Today (`/`) was intentionally left untouched.

## What stayed unchanged

No backend, no Supabase tables, no auth/beta/admin/guest changes. No changes to the
nutrition schema, `FoodLog` schema, food library, water/supplement/protein/workout
modules, or backup/restore. Recipes are a static seed (read-only), so there is no
user-data to back up. No new dependencies.

## Validation results

- `npm run lint` — ✓ 0 errors (1 pre-existing warning in `scripts/qa-settings.mjs`,
  unrelated).
- `npm run build` — ✓ TypeScript clean; `/recipes` static, `/recipes/[id]` SSG for
  all 17 recipes.
- `npm run test:e2e` — ✓ **154 passed** (146 prior + 8 new in
  `e2e/recipes.spec.ts`).

## Manual QA notes (360px / 390px)

Verified via the e2e overflow assertion on `/recipes` and recipe detail pages at
both widths (`document.scrollWidth - clientWidth ≤ 1`). The list cards truncate long
titles, chips scroll horizontally inside a contained row, and the macro grid is a
4-column layout that fits 360px. No horizontal overflow at either width.

## Number of recipes

**17** recipes seeded.
