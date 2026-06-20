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

Every recipe supports an optional `imageUrl` field; when absent the UI renders a
safe per-category gradient placeholder (`RecipePlaceholder` / `RecipeImage`,
mirroring the nutrition `FoodPlaceholder`). **No original PDF imagery is used** —
not pages, layout, branding, stamps, or watermarks.

**V1 shipped no images.** **V1.1 added Yuval's own food photos** for most recipes
(see the V1.1 section below). Images are served via `next/image` and the optimizer
is locked to `/recipes/**` (alongside `/exercises/**` and `/food/**`) in
`next.config.ts` (`images.localPatterns`).

## V1.1 — Recipe images

Yuval supplied standalone food photos (one per recipe, square ~600px PNG) in a
Hebrew-named folder `public/מתכוני פרו`. These are plain food photos he created —
**not** screenshots of PDF pages, PDF layout, branding, stamps, or watermarks
(each was visually inspected to confirm this before use).

### Asset pipeline

- **Raw source** (kept locally, git-ignored like `food source/` and
  `training exercises/`): `public/מתכוני פרו/` — added to `.gitignore` as
  `/public/מתכוני פרו/`. The Hebrew/space path is never used at runtime.
- **Production assets** (committed): optimized WebP under the stable ASCII path
  **`public/recipes/protein-sweets/`**, one file per recipe using the recipe's
  slug id (e.g. `pancake-pro.webp`, `carrot-cake.webp`). Conversion: `sharp`,
  resized to fit ≤ 800×800, quality 80 — total ≈ 1.1 MB for 15 images. The
  reproducible one-off script is `scripts/convert-recipe-images.mjs`.
- **Wiring**: each recipe's `imageUrl` in `lib/recipes.ts` points to
  `/recipes/protein-sweets/<slug>.webp`. `RecipeImage` already renders the photo
  when `imageUrl` is set and falls back to the placeholder otherwise (and on a
  runtime load error), so no component changes were needed.

### Mapping (image → recipe)

15 of the 17 recipes now have a photo, matched by the Hebrew title in each source
filename → the recipe `id`:

| Recipe (id) | Asset |
| --- | --- |
| `pancake-pro` | `pancake-pro.webp` |
| `quick-souffle` | `quick-souffle.webp` |
| `snickers-milkshake` | `snickers-milkshake.webp` |
| `mm-milkshake` | `mm-milkshake.webp` |
| `oreo-donuts` | `oreo-donuts.webp` |
| `pancake-pro-light-plus` | `pancake-pro-light-plus.webp` |
| `fluffy-muffins` | `fluffy-muffins.webp` |
| `lotus-biscoff` | `lotus-biscoff.webp` |
| `cinnamon-cinnabon` | `cinnamon-cinnabon.webp` |
| `carrot-cake` | `carrot-cake.webp` |
| `brownie-cake` | `brownie-cake.webp` |
| `oreo-cake` | `oreo-cake.webp` |
| `blueberry-cheesecake` | `blueberry-cheesecake.webp` |
| `vanilla-pro-icecream` | `vanilla-pro-icecream.webp` |
| `fruit-muesli` | `fruit-muesli.webp` |

### Recipes still without an image (placeholder)

Yuval's folder included no photo for these two, so they keep the gradient
placeholder:

- `protein-shakshuka` — שקשוקה חלבונית
- `light-bourekas` — בורקס לייט

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

V1 (data seed):

- `npm run lint` — ✓ 0 errors (1 pre-existing warning in `scripts/qa-settings.mjs`,
  unrelated).
- `npm run build` — ✓ TypeScript clean; `/recipes` static, `/recipes/[id]` SSG for
  all 17 recipes.

V1.1 (images), re-validated:

- `npm run lint` — ✓ 0 errors (same single pre-existing unrelated warning).
- `npm run build` — ✓ TypeScript clean; `/recipes` static, all 17 `/recipes/[id]`
  pages SSG.
- `npm run test:e2e` — ✓ **156 passed** (`e2e/recipes.spec.ts` now covers: list
  loads, list renders real `<img>`s, an imaged detail shows a photo from a safe
  path — asserting the src contains `protein-sweets` and **not** `private-input`
  or `pdf` — an imageless detail still shows the placeholder with no `<img>`,
  search/filter, the nutrition entry point, "הוסף ליומן התזונה" writes a today
  entry, and no horizontal overflow at 360/390).

## Manual QA notes (360px / 390px)

Captured with `qa/recipe-images-check.mjs` (production build) at both widths:

- `/recipes` — 15 real thumbnails render in the list cards; document horizontal
  overflow = **0px** at 360 and 390. Thumbnails are crisp 64×64 `object-cover`,
  long titles truncate, the category chips scroll inside a contained row, RTL
  layout correct.
- `/recipes/pancake-pro`, `/recipes/carrot-cake` (imaged) — the hero photo renders
  at the top (16/10 `object-cover`, no layout shift), 1 `<img>`, overflow = 0px.
- `/recipes/protein-shakshuka` (no image) — gradient placeholder renders the title,
  0 `<img>`, overflow = 0px.

Also verified via the e2e overflow assertion (`document.scrollWidth - clientWidth
≤ 1`) on the list and detail pages at both widths.

## Number of recipes

**17** recipes seeded.
