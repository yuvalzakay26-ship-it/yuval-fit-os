# Nutrition Clarity Pass

> **Superseded in part by the Nutrition IA Reset.** The durable rules now live in
> [`NUTRITION_SYSTEM_CONTRACT.md`](NUTRITION_SYSTEM_CONTRACT.md); the current screen
> hierarchy and copy are in [`NUTRITION_IA_RESET.md`](NUTRITION_IA_RESET.md). In
> particular the "הוספת אוכל" command area is now **"הוספה ליומן"** with three
> actions (manual / from recipe / value extractor), and the catalog "בחר מהמאגר"
> was lowered + renamed **"הוסף מפריט קיים"**. This doc is kept for history.

A focused **UX clarity / layout / copy** pass on `/nutrition`
(`components/nutrition/NutritionView.tsx`). The goal: make Nutrition read as a
clear **food-logging command center**, not a stack of equal-weight cards. Both
parts are **presentation only** — no feature, schema, storage, AI, or calculation
behaviour changed.

- **Part 1** (commit `7065331`) — de-duplicated the empty journal and fixed the
  disabled scan card's helper line.
- **Part 2** (this pass) — grouped all add actions into one **`הוספת אוכל`**
  command area, set an explicit primary→secondary→shortcut hierarchy, renamed the
  journal to **`יומן האוכל של היום`**, and moved favorites below the journal so
  water/supplements read as clearly secondary.

## Final hierarchy (after Part 2)

`/nutrition` reads strictly top-down, primary → secondary → tertiary:

A. **Page header** — `תזונה` + subtitle (`app/nutrition/page.tsx`).
B. **Daily summary** — `MacroSummary` (calories, protein, carbs, fat, goal
   progress). Calculations untouched; padding lightly tightened (`p-5`→`p-4`).
C. **`הוספת אוכל` command area** (helper: `בחר איך לרשום את הארוחה שלך`):
   - **Primary** — photo-first **`סרוק צלחת`** (`PhotoScanCard`) when AI is on, or
     the inert **`בקרוב`** card (`PhotoScanCardDisabled`) when off. The
     **`איך עובד ניתוח AI?`** helper link sits directly beneath it (attached).
   - **Secondary** — two-up **`הוסף ידנית`** (`/nutrition/add`) + **`בחר מהמאגר`**
     (`/nutrition/library`), quieter than the scan card.
   - **Shortcut** — full-width **`הוסף שוב`** revealing recent foods; visible but
     disabled with `אין עדיין ארוחות אחרונות` when there are none yet.
D. **`יומן האוכל של היום`** — source-of-truth food journal. Calm, button-free empty
   state. Logged rows unchanged (`הוסף שוב` + delete per row).
E. **Food shortcuts** — compact **`מועדפים`** chips, only when any exist.
F. **`מעקבים נוספים`** — water + supplements, clearly subordinate.
G. **Tools** — protein calculator + full catalog link.

## Part 1 — empty journal & disabled helper

Two rough edges from the real screenshots were tightened; everything else was
already in place from the photo-first work.

### 1. Empty journal — removed duplication, calmer copy

The empty `היומן של היום` state previously repeated **`הוסף ידנית`** (already a
quick action directly above) alongside **`בחר מהמאגר`**. Since the add actions are
visible above, the empty state is now simpler:

- Title (unchanged, asserted by e2e): `עדיין לא נרשם אוכל היום`
- Description: `הוסף ארוחה כדי להתחיל לעקוב — פעולות ההוספה נמצאות למעלה.`
- A **single** distinct CTA: **`בחר מהמאגר`** (the catalog entry point — *not*
  duplicated elsewhere on the page; QA `openPicker` also relies on it).

The duplicate `הוסף ידנית` button was dropped from the empty journal.

### 2. Disabled scan card — always-true helper line

`PhotoScanCardDisabled`'s helper line named **`הוסף שוב`**, which only works when
the user already has recent meals — misleading on a fresh device. It now names an
**always-available** fallback:

- Before: `בינתיים אפשר להוסיף ידנית או להשתמש ב־הוסף שוב`
- After: `בינתיים אפשר להוסיף ידנית או לבחור מהמאגר`

## Part 2 — screen hierarchy & command area

The pieces were all present but competed visually. Part 2 makes the intent
explicit with grouping, weight, and copy — no new behaviour.

### 1. One `הוספת אוכל` command area

The scan card and the manual/catalog/add-again actions were two separate
sections. They are now a **single section** with a `SectionHeader`
(`הוספת אוכל` + helper `בחר איך לרשום את הארוחה שלך`) and a clear internal order:

- **Primary:** the `סרוק צלחת` card (active or `בקרוב`) + attached AI helper link.
- **Secondary:** two-up `הוסף ידנית` + `בחר מהמאגר`. `בחר מהמאגר` is now a
  first-class action here (previously only in the empty journal); QA `openPicker`
  clicks the first `בחר מהמאגר`, which is this one.
- **Shortcut:** `הוסף שוב` moved out of the two-up grid into a quieter full-width
  control so it no longer reads as equal-weight to manual add. When there are no
  recents it stays visible but **disabled** and says `אין עדיין ארוחות אחרונות`
  (was a static `מהארוחות האחרונות שלך`).

Manual-add copy clarified to `הזנה חופשית של ערכים` (it no longer mentions the
catalog, now its own button); catalog copy is `מאכלים עם תמונה מהמאגר`.

### 2. Journal renamed to `יומן האוכל של היום`

Clarifies the section is specifically about food (was `היומן של היום`). The QA
heading assertion (`qa/food-library-check.mjs`) was updated to match. The empty
state is now **button-free** — since the command area above already exposes every
add action, the single `בחר מהמאגר` CTA Part 1 kept here would just re-duplicate
it. Copy is unchanged: `עדיין לא נרשם אוכל היום` /
`הוסף ארוחה כדי להתחיל לעקוב — פעולות ההוספה נמצאות למעלה.`

### 3. Favorites moved below the journal

`מועדפים` chips moved out of the add area to their own compact section **after**
the journal, so they read as a shortcut rather than main content. Still hidden
entirely when there are no favorites; behaviour and the `הצג הכל` link unchanged.

### 4. Water/supplements clearly secondary

`מעקבים נוספים` (water + supplements) stays below the journal and favorites,
visually subordinate to food logging. All water features preserved (global
celebration, app-wide colors, uncapped percentage, reset from Today + water page,
over-goal states); supplement behaviour preserved.

### 5. Summary weight

`MacroSummary` padding tightened `p-5`→`p-4` so the summary no longer dominates the
add area. No layout, copy, or calculation change inside it.

## AI-disabled behaviour (unchanged, verified)

When AI is not configured, `/nutrition` renders `PhotoScanCardDisabled` — an inert
`<div>`:

- Still visible, titled `סרוק צלחת`, subtitle `ניתוח ארוחה מתמונה יופעל בקרוב`,
  with a `בקרוב` badge and a disabled `לא פעיל כרגע` button.
- Mounts **no** file input, has **no** click handler/overlay, and **never** calls
  `POST /api/nutrition/analyze-photo` — it cannot open camera/upload.
- Manual add, `בחר מהמאגר`, and `הוסף שוב` stay usable below.
- `/nutrition` is `force-dynamic`, so wiring an AI key later flips it to the active
  card with no rebuild.

## What stayed unchanged

- `FoodLog` schema, all localStorage keys, Backup/Restore format.
- AI route, AI activation/gating, photo storage policy (photos never stored), and
  no-auto-save of AI drafts.
- Macro calculations, water schemas/behaviour (global celebration, colors,
  uncapped percentage, reset, over-goal warnings), supplement behaviour.
- Auth, beta access, guest mode, admin, Supabase.
- All add destinations (`/nutrition/add`, `/nutrition/library`) and `הוסף שוב`
  duplication logic, recents, favorites behaviour, and the AI draft review flow.
- QA flows that click `בחר מהמאגר` / `הוסף ידנית` (helper resolves to the new
  command-area buttons).

> Note: Part 1 kept a single `בחר מהמאגר` CTA in the empty journal; Part 2 removed
> it (the command area above now owns every add action). The journal title changed
> from `היומן של היום` to `יומן האוכל של היום`.

## Manual QA notes (360 px / 390 px)

- No horizontal overflow at 360 px or 390 px; the disabled card's helper line
  truncates beside the disabled button (existing behaviour).
- The `הוספת אוכל` command area — scan card, two-up manual/catalog, and the
  full-width `הוסף שוב` — is visible with minimal scroll; the two-up grid and the
  full-width shortcut fit cleanly at 360 px.
- Bottom nav and the scroll-to-top button do not cover the add actions; the
  transient confirmation toast is offset above the bottom nav.
- Favorites/water/supplements sit below the journal and do not compete with the
  command area.
- RTL alignment correct; cards remain tappable; dark mode readable.

## Tests

`e2e/nutrition-photo-disabled.spec.ts` (runs against the no-AI `:3940` server):

- **Part 2:** the `הוספת אוכל` command area shows its title + helper and each add
  option exactly once (scan, manual, catalog, add-again); `בחר מהמאגר` navigates to
  the library. Daily summary leads and `מעקבים נוספים` renders lower. Empty journal
  uses the renamed `יומן האוכל של היום` title and is calm + button-free.
- **Part 1:** the disabled card's helper line names the catalog fallback.

Existing photo (`e2e/nutrition-photo.spec.ts`), water, and today specs are
unaffected (53 passed).
