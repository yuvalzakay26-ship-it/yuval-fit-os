# Nutrition System Contract

> The single source of truth for **what the nutrition area is** and **what it is
> allowed to do**. Read this before touching anything under `/nutrition`,
> `components/nutrition/`, `lib/food-library.ts`, `lib/recipes.ts`, or the
> photo/AI route. It complements (does not replace)
> [`NUTRITION_CLARITY_PASS.md`](NUTRITION_CLARITY_PASS.md) and
> [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md).

## Product principle

**The app helps the user log what they ate — it never tells them what to eat.**

The nutrition area is a *journal*, not a coach. Everything is framed around
accurate, honest, device-local logging. There is no "recommended", "healthy for
you", "correct nutrition", diet, or meal-plan language anywhere in the nutrition
UI, and there must never be.

## The three concepts (and only three)

The nutrition area is organised around exactly three first-class concepts. Any
new feature must map onto one of them or it does not belong here.

### 1. Nutrition Log — what the user actually ate

- **Type:** `FoodLog` (`lib/fitness-types.ts`), stored in `localStorage` via the
  `foodLogs` module of `lib/fitness-store.ts`. **This schema is frozen** — see
  "What stayed unchanged".
- The screen section **"יומן האוכל של היום"** is the source of truth for today.
  The **"תזונה היום"** summary (`MacroSummary`) is a read-only roll-up of it.
- Written only through `addFoodLog`. Every add path ends here.

### 2. Recipe Library — a ready source with known values

- **Type:** `Recipe` / `RecipeNutrition` (`lib/recipes.ts`), a **static,
  read-only, local seed**. No backend, no user-authored recipes, no schema in
  `localStorage`.
- Lives at `/recipes` (list) → `/recipes/[id]` (detail). The Nutrition screen
  **links** to it; it never duplicates the recipe list.
- "הוסף ליומן התזונה" builds a normal `FoodLog` via `foodLogFromRecipe` and
  writes it through the same `addFoodLog`. A recipe is a *convenient, pre-filled
  source* for a log entry — its values are known in advance, unlike the catalog.

### 3. Nutrition Value Extractor — extraction only, user confirms before save

- A tool that reads **values** from an image (a label/plate) or, in future,
  pasted text, and proposes them for the user to **review and edit before
  saving**. Titled **"חלץ ערכים מתמונה או טקסט"**.
- **Today:** the photo flow exists as a real but **dormant** server route
  (`/api/nutrition/analyze-photo`, gated by `isNutritionAiConfigured()`). With no
  key configured (the production default) the UI shows an inert **"בקרוב"**
  placeholder (`PhotoScanCardDisabled`) — no inputs, no overlay, no fetch. With a
  key/mock it becomes the active `PhotoScanCard` capture → review → confirm flow.
- It is **extraction, not advice** (see below).

### Supporting helper (NOT a fourth concept)

**Food catalog / sample food** (`lib/food-library.ts`, "הוסף מפריט קיים"): a
quick-add **image** list of known foods. It is a *helper*, deliberately lowered
under "כלים נוספים". **It carries NO stored macros** — macros/calories are left
`undefined` on purpose; the user fills quantity and values themselves before
saving. It is never presented as authoritative nutrition truth.

## Screen hierarchy (`components/nutrition/NutritionView.tsx`)

1. **תזונה היום** — daily summary (`MacroSummary`).
2. **הוספה ליומן** — the command area, exactly **three** actions:
   - **הוסף ידנית** → `/nutrition/add` (free entry of name + values).
   - **הוסף ממתכון** → `/recipes` (ready values).
   - **חלץ ערכים מתמונה או טקסט** → the extractor (active card or "בקרוב").
3. **יומן האוכל של היום** — today's log; "הוסף שוב" recents shortcut lives here.
4. **ספריית מתכונים** — a single calm entry card to `/recipes`.
5. Lower / quieter: favorites, water + supplements ("מעקבים נוספים"), and tools
   ("כלים נוספים": protein calculator + the lowered "הוסף מפריט קיים" catalog).

## What AI is and is NOT allowed to do

AI in the nutrition area is **only** for value **extraction**. It:

- ✅ reads values from an image/text and proposes a **draft for review**;
- ✅ saves **only** after explicit user confirmation (no auto-save, ever);
- ✅ runs server-side only; the image is used for the request and **never stored**.

It must **never**:

- ❌ recommend foods or what to eat;
- ❌ create diets, meal plans, or programs;
- ❌ generate recipes;
- ❌ make medical / body / weight / "healthy for you" claims;
- ❌ save anything without the user confirming first.

All AI-facing copy is framed as estimate/extraction ("הערכת ערכים בלבד · אפשר
לערוך לפני שמירה"), never as advice.

## What data is stored, and where

- **Everything is local-first** — `localStorage` on the user's device. The
  reassurance line on the screen ("הנתונים נשמרים במכשיר שלך.") is literally true.
- `FoodLog` entries, favorites, water, supplements, protein goal — all local.
- Recipes and the food catalog are **static seeds shipped with the app** (no user
  data, nothing to back up).
- The extractor sends an image to the server **only** for the duration of the
  analyze request and stores **nothing** server-side.

## What stayed unchanged (frozen by this contract)

- `FoodLog` schema and all nutrition storage keys.
- Recipe IDs, recipe nutrition values, ingredients, and steps; `foodLogFromRecipe`.
- `addFoodLog` behaviour and the food catalog data (no macros added).
- The photo/AI route, provider configuration, gating, and no-auto-save policy.
- Backup/restore, auth/beta/admin/guest/Supabase, and the workouts / profile /
  water / supplement / protein / gym schemas.

This pass changed **information architecture, copy, and docs only** — no schema,
storage, calculation, or AI behaviour changed.

## Future steps

- Extend the extractor to **pasted text / nutrition labels** (still review-first).
- Optionally attach *known, verified* values to specific catalog items (only when
  a real source exists) — never inferred.
- Keep every addition mapped to one of the three concepts above.
