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
(originally `~/Desktop/ביצים וארוחות בוקר — Eggs & Breakfast/`, **20 PNGs**,
~1.8–2.6 MB each, 1254×1254). It was copied untouched into the repo as the
in-repo source of truth:

```
public/food source/breakfast/   ← 20 PNG originals (gitignored)
```

> **Phase 3.7.1 completion pass.** Phase 3.7 originally imported only **15**
> of the breakfast items, because the in-repo `public/food source/breakfast/`
> snapshot was taken before the user added the final 5 PNGs to the Desktop
> source folder. Phase 3.7.1 re-scanned the original Desktop folder
> (`~/Desktop/ביצים וארוחות בוקר — Eggs & Breakfast/`, confirmed 20 files),
> copied the 5 missing PNGs into the in-repo source, re-ran the importer, and
> added the 5 matching library entries. The 5 items missing before were:
> **Bagel with Cheese and Vegetables**, **Cereal with Milk**,
> **Cheese and Vegetable Sandwich**, **Fruit Bowl with Yogurt**, and
> **Whole Wheat Bread with Peanut Butter**. No naming mismatch was involved —
> the files simply hadn't been present in the snapshot the first importer ran
> against. Breakfast is now complete at **20 items / 20 images, 0 skipped**.

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

- `public/food/breakfast/` — 20 images (15 in Phase 3.7, +5 in Phase 3.7.1)
- `public/food/proteins/` — 19 images (Phase 3.12)
- `public/food/carbs/` — 19 images (Phase 3.13)

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

Breakfast (20): avocado-and-egg-toast, bagel-with-cheese-and-vegetables,
boiled-eggs, cereal-with-milk, cheese-and-vegetable-sandwich,
cottage-cheese-with-vegetables, fried-egg, fruit-bowl-with-yogurt, oatmeal,
omelet, omelet-sandwich, omelet-toast, protein-pancakes, shakshuka,
tuna-sandwich, vegetable-omelet, white-cheese-with-vegetables,
whole-wheat-bread-with-peanut-butter, yellow-cheese-toast,
yogurt-with-granola-and-fruit.

The bold 5 added in Phase 3.7.1: bagel-with-cheese-and-vegetables,
cereal-with-milk, cheese-and-vegetable-sandwich, fruit-bowl-with-yogurt,
whole-wheat-bread-with-peanut-butter.

Skipped: none.

## Phase 3.12 — Proteins import

The user added a second category folder containing main-protein images.

- **Source folder inspected:** `public/food source/חלבונים עיקריים — Main Proteins/`
  (in-repo, gitignored). Actual folder name on disk: `חלבונים עיקריים — Main Proteins`.
- **Images found:** **19**, all `.png`, ~1.5–2.4 MB each. No unsupported
  formats, no duplicates, no oversized outliers, and **no** generic/unclear
  names (no `ChatGPT Image …`, no bare timestamps) — every filename maps
  cleanly to a known food, so nothing had to be skipped or guessed.
- **Converted / skipped:** 19 converted PNG → WebP q80; **0 skipped**. The set
  shrank from ~38 MB to ~2.4 MB (~30–196 KB per image).
- **Destination created:** `public/food/proteins/` (19 `.webp`).
- **Category:** key `proteins`, Hebrew label `חלבונים` (both already existed in
  `FoodCategory` / `FOOD_CATEGORY_LABELS` — no model change needed).
- **Library items added:** **19** entries appended to `FOOD_LIBRARY`.

### Importer change

The source folder name is Hebrew + English (`חלבונים עיקריים — Main Proteins`).
`slugify()` strips the Hebrew to `main-proteins`, which is not a `FoodCategory`,
so without help it would fall back to `other`. Three `FOLDER_ALIASES` entries
were added to map it to `proteins`: `"main proteins"`, the full
`"חלבונים עיקריים — main proteins"`, and `"חלבונים עיקריים"`.

### Mapping decisions

- `id` mirrors the image slug for stability, **except** `boiled-eggs`, which
  already exists as a breakfast `id`. To keep ids globally unique (they are the
  React key and `sourceFoodId`), the protein egg item uses
  `id: "boiled-eggs-proteins"` while its image stays
  `/food/proteins/boiled-eggs.webp`. Its Hebrew name is still `ביצים קשות`.
- `cottage-cheese` / `white-cheese` (proteins) are distinct slugs from the
  breakfast `cottage-cheese-with-vegetables` / `white-cheese-with-vegetables`,
  so no collision there.
- Filename → Hebrew name choices: `grilled-chicken-thighs` → `ירכי עוף בגריל`,
  `seared-tofu` → `טופו צרוב`, `homemade-burger-patty` → `קציצת המבורגר ביתית`,
  `cooked-chickpeas` → `חומוס מבושל`, `white-fish-fillet` → `פילה דג לבן`.

### Proteins imported (19)

baked-salmon, beef-meatballs, beef-steak, boiled-eggs, chicken-meatballs,
chicken-schnitzel, cooked-chickpeas, cooked-lentils, cooked-white-beans,
cottage-cheese, grilled-chicken-breast, grilled-chicken-thighs,
homemade-burger-patty, seared-tofu, tuna-plate, tuna-salad,
turkey-breast-slices, white-cheese, white-fish-fillet.

Skipped: none.

> **No nutrition inferred.** As with breakfast, all protein items leave
> `protein` / `carbs` / `fat` / `calories` **undefined** — the user enters
> macros manually per portion. The quick-add flow remains prefill-only for
> name / image / category / `sourceFoodId`.

## Phase 3.13 — Carbs & side-dishes import

The user added a third category folder containing carbs / side-dish images.

- **Source folder inspected:** `public/food source/פחמימות ותוספות — Carbs & Side Dishes/`
  (in-repo, gitignored). Actual folder name on disk:
  `פחמימות ותוספות — Carbs & Side Dishes`.
- **Images found:** **19**, all `.png`, ~1.5–2.6 MB each (1254×1254). No
  unsupported formats, no duplicates/suspicious names, no oversized outliers,
  and **no** generic/unclear names (no `ChatGPT Image …`, no bare timestamps) —
  every filename maps cleanly to a known food, so nothing had to be skipped or
  guessed.
- **Converted / skipped:** 19 converted PNG → WebP q80; **0 skipped**. The set
  shrank from ~37 MB to ~1.9 MB (~30–247 KB per image).
- **Destination created:** `public/food/carbs/` (19 `.webp`).
- **Category:** key `carbs` (already existed in `FoodCategory`). The Hebrew
  label `FOOD_CATEGORY_LABELS.carbs` was updated from `פחמימות` to
  **`פחמימות ותוספות`** to match the folder's intent (carbs *and side dishes*).
  This is a display-only string used by the library chips — safe, nothing keys
  off it. (The `פחמימות` macro-field label in `MacroSummary`/`FoodLogForm` is a
  separate string and was left unchanged.)
- **Library items added:** **19** entries appended to `FOOD_LIBRARY`.

### Importer change

The source folder name is Hebrew + English
(`פחמימות ותוספות — Carbs & Side Dishes`). `slugify()` strips the Hebrew to
`carbs-side-dishes`, which is not a `FoodCategory`, so without help it would
fall back to `other`. Four `FOLDER_ALIASES` entries were added to map it to
`carbs`: `"carbs & side dishes"`, `"carbs and side dishes"`, the full
`"פחמימות ותוספות — carbs & side dishes"`, and `"פחמימות ותוספות"`.

### Mapping decisions

- `id` mirrors the image slug for stability. None of the 19 carbs slugs collide
  with existing breakfast/proteins ids (e.g. carbs `whole-wheat-bread` is
  distinct from breakfast `whole-wheat-bread-with-peanut-butter`; `oats` is
  distinct from breakfast `oatmeal`), so no category-qualified ids were needed.
- Filename → Hebrew name choices: `brown-rice` → `אורז מלא`,
  `white-rice` → `אורז לבן`, `roasted-sweet-potato` → `בטטה צלויה`,
  `mashed-potatoes` → `פירה`, `ptitim` → `פתיתים`, `laffa-bread` → `לאפה`,
  `pita-bread` → `פיתה`, `rice-cakes` → `פריכיות אורז`,
  `whole-wheat-pasta` → `פסטה מלאה`, `oats` → `שיבולת שועל`.

### Carbs imported (19)

baked-potato, brown-rice, corn, couscous, crackers, granola, laffa-bread,
mashed-potatoes, oats, pasta, pita-bread, ptitim, quinoa, rice-cakes,
roasted-sweet-potato, tortilla, white-rice, whole-wheat-bread,
whole-wheat-pasta.

Skipped: none.

> **No nutrition inferred.** As with breakfast and proteins, all carbs items
> leave `protein` / `carbs` / `fat` / `calories` **undefined** — the user enters
> macros manually per portion. The quick-add flow remains prefill-only for
> name / image / category / `sourceFoodId`.

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
`yfos:access-granted:v1 = "1"`) passes with **0 issues**: library renders all
20 loadable food images (15 in Phase 3.7 + 5 in Phase 3.7.1), search narrows to
1 for "שקשוקה", picking prefills the
form + thumbnail banner, saving writes a `FoodLog` with
`imagePath`/`category=breakfast`/`sourceFoodId=shakshuka`, the diary row shows a
thumbnail, manual logging still creates an image-less log, totals reflect the
manually-entered macros, and there is no horizontal overflow or console error in
light **or** dark mode.

**Phase 3.13** adds `qa/carbs-food-check.mjs` (Playwright, pre-seeds
`yfos:welcome-seen:v1 = "1"`), which passes with **0 issues**: the
`פחמימות ותוספות` chip exists, filtering to it shows exactly **19** carbs items
with all images loaded, search for `אורז מלא` narrows to 1, picking it prefills
the form + thumbnail banner, saving writes a `FoodLog` with
`imagePath=/food/carbs/brown-rice.webp` / `category=carbs` /
`sourceFoodId=brown-rice` and the user-entered macros, and breakfast + proteins
filters still work — no overflow or console error in light **or** dark mode. The
existing `qa/food-library-check.mjs` and `qa/welcome-check.mjs` still pass, and
the exercise library still renders all **133** images (0 broken).

## Scope note

This phase added only a visual food library + quick-add prefill. No backend,
auth, database, AI/image-recognition, native/Capacitor, video, or chart work was
involved, and no nutrition values are inferred from images.
