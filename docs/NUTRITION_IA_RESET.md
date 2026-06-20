# Nutrition IA Reset — Phase 1

A focused **information-architecture / copy / docs** pass on `/nutrition`. The
nutrition area had grown several overlapping food concepts (manual entry, image
catalog, recipe library, recipe-to-log, photo AI) competing for attention. This
pass re-anchors the whole area on **three clear concepts** and frames the future
AI strictly as a **value extractor**, not advice.

> The durable rules live in [`NUTRITION_SYSTEM_CONTRACT.md`](NUTRITION_SYSTEM_CONTRACT.md).
> This file records *what changed in this pass*. It builds on
> [`NUTRITION_CLARITY_PASS.md`](NUTRITION_CLARITY_PASS.md) and
> [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md).

**Presentation only** — no `FoodLog`/recipe schema, storage key, calculation, AI
route, or save-semantics change.

## The three concepts

1. **Nutrition Log** — what the user actually ate (`FoodLog`).
2. **Recipe Library** — a ready source with known values (`/recipes`).
3. **Nutrition Value Extractor** — extraction only, user confirms before save
   (dormant photo route → "בקרוב" placeholder until a key is wired).

The generic food catalog is **not** a fourth concept — it is a quiet quick-add
helper with no stored values.

## New screen hierarchy (`NutritionView.tsx`)

| # | Section | Notes |
|---|---------|-------|
| 1 | **תזונה היום** | `MacroSummary`, now under its own labelled section. |
| 2 | **הוספה ליומן** | Command area with exactly three actions (below). |
| 3 | **יומן האוכל של היום** | Source-of-truth log; "הוסף שוב" recents moved here, shown only when recents exist. |
| 4 | **ספריית מתכונים** | Single calm entry card → `/recipes` ("פתח ספריית מתכונים"). |
| — | Lower | favorites, "מעקבים נוספים" (water + supplements), "כלים נוספים" (protein calc + lowered catalog). |

### Section 2 — the three actions

- **הוסף ידנית** → `/nutrition/add` — "הזנה חופשית של שם וערכים".
- **הוסף ממתכון** → `/recipes` — "מתכון עם ערכים מוכנים מראש".
- **חלץ ערכים מתמונה או טקסט** — the extractor: the active `PhotoScanCard` when
  AI is configured, otherwise the inert `PhotoScanCardDisabled` ("בקרוב").

A quiet reassurance line closes the section:
*"יומן התזונה הוא המקום שבו נשמר מה שאכלת בפועל. הנתונים נשמרים במכשיר שלך."*

## What changed

- **Reframed the AI cards as a value extractor** (`PhotoScanCard.tsx`):
  - Active card: title **"חלץ ערכים מתמונה"**, subtitle *"צלם או העלה תמונה —
    נציע ערכים לבדיקה ועריכה לפני שמירה"*, CTA **"חלץ ערכים"** (was "סרוק צלחת" /
    "סרוק עכשיו"). The capture → review → confirm flow and its privacy/estimate
    notes are unchanged; nothing is ever saved without confirmation.
  - Disabled card: the future-extractor placeholder — title **"חלץ ערכים מתמונה
    או טקסט"**, body *"בעתיד תוכל להעלות תמונה של תווית או להדביק טקסט, והמערכת
    תציע ערכים לבדיקה לפני שמירה."*, a real **disabled** "בקרוב" button. Still
    fully inert (no input, no overlay, no fetch).
  - The helper link reads **"איך עובד חילוץ הערכים?"** (was "איך עובד ניתוח AI?")
    and is shown only when the extractor is live → `/ai-disclaimer`.
- **Recipes promoted** from a buried "כלים נוספים" link to a first-class action
  ("הוסף ממתכון") **and** a dedicated Section 4 entry card. The recipe list is
  **not** duplicated inside Nutrition.
- **Catalog lowered + clarified.** "בחר מהמאגר" was removed from the command area
  and renamed **"הוסף מפריט קיים"**, kept as a quiet card under "כלים נוספים"
  with honest copy: *"מאכלים מוכרים עם תמונה — בוחרים פריט, ממלאים כמות וערכים,
  ושומרים."* The catalog screen header (`FoodLibraryScreen`) was updated to match
  and to state plainly there are no preset values. No catalog data changed.
- **Recents shortcut** ("הוסף שוב") moved next to the journal it draws from and is
  shown only when recents exist (the empty journal stays calm, button-free).

## What was implemented vs. placeholder

- The **value extractor is a placeholder by default** (production has no AI key →
  "בקרוב"). The pre-existing dormant route stays dormant and safe; **no live AI
  was added**, no external API/provider/keys/prompt logic introduced. When a key
  is present (dev/QA mock), the existing capture-and-review flow runs as before.

## Files touched

- `components/nutrition/NutritionView.tsx` — the 4-section hierarchy.
- `components/nutrition/PhotoScanCard.tsx` — extractor framing (active + disabled).
- `components/nutrition/FoodLibraryScreen.tsx` / `AddFoodView.tsx` — catalog copy.
- `docs/NUTRITION_SYSTEM_CONTRACT.md` (new), `docs/NUTRITION_IA_RESET.md` (new),
  `docs/PROJECT_STATE.md`.
- e2e: `nutrition-photo-disabled.spec.ts`, `nutrition-photo.spec.ts`,
  `legal-pages.spec.ts`; manual QA helpers `qa/nutrition-helpers.mjs`,
  `qa/food-library-check.mjs`.

## What stayed unchanged

`FoodLog` schema + nutrition storage keys, recipe IDs/values/ingredients/steps,
`addFoodLog`, `foodLogFromRecipe`, the photo/AI route + gating + no-auto-save
policy + photo-never-stored, backup/restore, auth/beta/admin/guest/Supabase, and
the workouts/profile/water/supplement/protein/gym schemas. No new dependencies;
localStorage-only.

## Manual QA (360px / 390px)

- No horizontal overflow at 360px or 390px. The two-up "הוסף ידנית" / "הוסף
  ממתכון" grid and the full-width extractor card fit cleanly; the recipe entry
  card and lowered catalog card wrap without clipping.
- "תזונה היום" leads; the three add actions read as one calm group; the journal,
  recipe card, and secondary trackers follow in clear descending priority.
- RTL alignment correct; dark mode readable; bottom nav clears the content.
