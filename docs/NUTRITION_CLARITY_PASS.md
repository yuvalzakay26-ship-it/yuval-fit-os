# Nutrition Clarity Pass — Part 1

A focused **UX clarity / layout / copy** pass on `/nutrition` (`components/nutrition/NutritionView.tsx`).
The goal: make Nutrition read as a clear **food-logging command center**, not a stack
of equal-weight cards. This pass is **presentation only** — no feature, schema,
storage, AI, or calculation behaviour changed.

## Chosen hierarchy

`/nutrition` reads strictly top-down, primary → secondary → tertiary:

1. **Daily summary** — `MacroSummary` (calories, protein, carbs, fat, goal
   progress). Calculations untouched.
2. **Add food — primary.** Photo-first **`סרוק צלחת`** (`PhotoScanCard`) is the
   default action when AI is configured. When AI is **off**, the slot shows the
   inert **`בקרוב`** card (`PhotoScanCardDisabled`) so the feature still reads as
   real. The **`איך עובד ניתוח AI?`** helper link sits directly beneath the scan
   card (attached, not detached) and does not interrupt the flow.
3. **Add food — fast fallbacks.** A two-up row: **`הוסף שוב`** (reveals recent
   foods, only when recents exist) and **`הוסף ידנית`** (manual / catalog). Recent
   foods and **`מועדפים`** chips render underneath as **secondary** shortcuts, and
   only when they have content (no large empty sections).
4. **`היומן של היום`** — the source-of-truth diary of what was logged today.
   Title kept (consistent with existing docs + QA). Logged rows unchanged
   (`הוסף שוב` + delete per row).
5. **`מעקבים נוספים`** — water + supplements, clearly subordinate to food logging.
6. **Tools** — protein calculator + full catalog link.

## What changed in this pass

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
- Section title `היומן של היום` (kept for consistency with docs + `qa/` scripts).

## Manual QA notes (360 px / 390 px)

- No horizontal overflow at 360 px or 390 px; the disabled card's helper line
  truncates beside the disabled button (existing behaviour).
- Primary action (`סרוק צלחת`) visible near the top with minimal scroll.
- Bottom nav and the scroll-to-top button do not cover the add actions; the
  transient confirmation toast is offset above the bottom nav.
- RTL alignment correct; cards remain tappable; dark mode readable.

## Tests

`e2e/nutrition-photo-disabled.spec.ts` (runs against the no-AI `:3940` server) adds:

- Empty food journal renders the calm copy and the single `בחר מהמאגר` CTA, with
  `הוסף ידנית` appearing exactly once (in the quick actions, not duplicated).
- The disabled card's helper line names the catalog fallback.

Existing photo (`e2e/nutrition-photo.spec.ts`), water, and today specs are
unaffected.
