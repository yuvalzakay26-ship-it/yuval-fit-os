# Food media import (visual food library)

Phase 3.7 added a **visual food library** to the Nutrition area. The user
browses food images by category, picks one, and the existing food-log form is
prefilled with the food's name (plus its image + category). Quantity and all
nutrition values (protein / carbs / fat / calories) are still entered manually.

> **No nutrition is inferred from images.** This pipeline only produces
> optimized images and stable slugs. Macros in `lib/food-library.ts` are left
> `undefined` unless a verified value is known for that exact item — none are
> known today, so all are `undefined`.

## Source

The raw source for this phase was a single category folder the user provided
(originally `~/Desktop/ביצים וארוחות בוקר — Eggs & Breakfast/`, 15 PNGs,
~1.8–2.6 MB each, 1254×1254). It was copied untouched into the repo as the
in-repo source of truth:

```
public/food source/breakfast/   ← 15 PNG originals (gitignored)
```

The source folder is **gitignored** (`/public/food source/`) — like the
exercise sources — so ~32 MB of raw PNGs are never committed or served from
`public/` on Vercel. Only the optimized `public/food/` copies are committed.

The phase brief listed many possible categories (Drinks, Israeli Food, Snacks,
Full Meals, Salads, Vegetables, Carbs, Proteins, Dairy, Other…). On disk only
the breakfast set existed, so only `breakfast` was imported. The importer and
data model are generic and ready for the rest — see "Adding more" below.

## Destination structure

```
public/food/<category>/<slug>.webp
```

- `public/food/breakfast/` — 15 images (created this phase)

`<category>` is a `FoodCategory` from `lib/food-library.ts`:
`proteins`, `carbs`, `vegetables`, `salads`, `israeli-food`, `full-meals`,
`snacks`, `drinks`, `breakfast`, `dairy`, `other`.

## Naming rules

- English only, lowercase, kebab-case; no spaces, Hebrew, or special
  characters. Stable food slugs.
- Examples:
  - `Avocado and Egg Toast.png` → `avocado-and-egg-toast.webp`
  - `Shakshuka.png` → `shakshuka.webp`
  - `Yogurt with Granola and Fruit.png` → `yogurt-with-granola-and-fruit.webp`
- The slug also becomes the `FoodLibraryItem.id`, so keep it stable once
  shipped (logged entries reference it via `sourceFoodId`).

## Format handling

- Accepted source formats: `png`, `jpg`/`jpeg`, `webp`.
- PNG/JPG are converted to WebP (quality 80) with `sharp` (already present as a
  Next.js dependency). This cut the set from ~32 MB to ~2.0 MB (~58–240 KB per
  image) with no visible quality loss at app sizes.
- `webp` sources are copied as-is.
- Unsupported formats (HEIC/BMP/TIFF/AVIF…) and names that slugify to empty are
  skipped and reported — never fatal. This import had **0 skipped**.

## Imported images

Breakfast (15): avocado-and-egg-toast, boiled-eggs,
cottage-cheese-with-vegetables, fried-egg, oatmeal, omelet, omelet-sandwich,
omelet-toast, protein-pancakes, shakshuka, tuna-sandwich, vegetable-omelet,
white-cheese-with-vegetables, yellow-cheese-toast, yogurt-with-granola-and-fruit.

Skipped: none.

## Data model & UI

- `lib/food-library.ts` — `FoodCategory`, `FoodLibraryItem`,
  `FOOD_CATEGORY_LABELS` (Hebrew), the `FOOD_LIBRARY` array, and helpers
  `foodCategoriesInLibrary()` / `filterFoods(category, query)`.
- `FoodLog` (in `lib/fitness-types.ts`) gained three **optional** fields:
  `imagePath?`, `category?`, `sourceFoodId?`. Existing stored logs without them
  keep working unchanged.
- `components/nutrition/FoodImage.tsx` + `FoodPlaceholder.tsx` — render the real
  image, falling back to a category gradient placeholder if it's missing or
  404s (mirrors the exercise `ExerciseImage`/`ExercisePlaceholder` pattern).
- `components/nutrition/FoodLibrary.tsx` — search box, category chips (only
  categories that actually have items), a 2-column card grid (image + name +
  "הוסף ליומן"), and a "show all" toggle (first 6 shown by default).
- `components/nutrition/FoodLogForm.tsx` — accepts an optional `prefill`; when a
  food is picked it shows a "נבחר מהמאגר" thumbnail banner and carries
  `imagePath`/`category`/`sourceFoodId` onto the saved `FoodLog`.
- `components/nutrition/NutritionView.tsx` — hosts the new "מאגר אוכל" section,
  prefills the form on pick (and scrolls to it), and shows a small thumbnail on
  today's log rows that have an `imagePath`.
- `next.config.ts` — `images.localPatterns` now allows `/food/**` (Next 16
  guardrail) in addition to `/exercises/**`.

## Adding more food images later

1. Drop image(s) into a category folder under `public/food source/`. Folder
   names are matched case-insensitively via the importer's `FOLDER_ALIASES`
   (e.g. `Israeli Food` → `israeli-food`, `Drinks` → `drinks`); unknown folders
   normalize to a valid category slug or fall back to `other` with a warning.
2. Run `node scripts/import-food-images.mjs`. It normalizes names, converts to
   WebP q80, and writes to `public/food/<category>/`. Re-running is idempotent.
3. Add matching entries to `FOOD_LIBRARY` in `lib/food-library.ts`
   (`id` = the slug, `imagePath: "/food/<category>/<slug>.webp"`, a `nameHe`,
   optional `nameEn`). Leave macros `undefined` unless a value is verified.

That's it — the chips, search, and grid pick up new categories/items
automatically.

## Validation

`npm run lint` clean; `npm run build` succeeds (TypeScript passes).
`qa/food-library-check.mjs` (Playwright, pre-seeds the access flag
`yfos:access-granted:v1 = "1"`) passes with **0 issues**: library renders 15
loadable food images, search narrows to 1 for "שקשוקה", picking prefills the
form + thumbnail banner, saving writes a `FoodLog` with
`imagePath`/`category=breakfast`/`sourceFoodId=shakshuka`, the diary row shows a
thumbnail, manual logging still creates an image-less log, totals reflect the
manually-entered macros, and there is no horizontal overflow or console error in
light **or** dark mode.

## Scope note

This phase added only a visual food library + quick-add prefill. No backend,
auth, database, AI/image-recognition, native/Capacitor, video, or chart work was
involved, and no nutrition values are inferred from images.
