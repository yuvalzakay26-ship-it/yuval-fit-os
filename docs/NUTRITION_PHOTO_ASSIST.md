# Nutrition Photo Assist — Photo-First Logging (Phase 3.xx)

Photo-first nutrition logging. The user photographs a meal, the server returns an
**editable draft**, the user reviews/edits, and only on confirmation is the entry
written to the **existing** nutrition journal.

> **Mental model:** `תצלם → המערכת יוצרת טיוטה → המשתמש בודק/עורך → מוסיף ליומן`
>
> Photo scan is the **default** action; manual add and "add again" remain as
> always-available fallbacks. When AI is not configured the scan card stays
> **visible in a calm "coming soon" (`בקרוב`) state** — so users see the feature
> exists — but it is fully inert, and the page degrades cleanly to manual/recent
> logging.

---

## Product & safety rules (hard requirements)

- **Estimate, never exact.** Every value is labeled an estimate (`הערכה בלבד`) with
  per-item and overall confidence. No guaranteed calorie/macro claims.
- **No auto-save.** Nothing is written until the user taps `נראה טוב, הוסף ליומן`.
- **Always editable** before saving: edit name/quantity/calories/macros, change
  portion, remove an item, or add a missing one.
- **No image storage.** The photo is sent to the server only for analysis and is
  never written to disk, DB, Supabase, or localStorage. The response is data only.
- **No secret in the client.** The AI key lives only in a server-only env var; the
  browser talks exclusively to `/api/nutrition/analyze-photo`.
- **No medical/diet advice, no shame/guilt language.** This is a tracking
  assistant, not a diet coach. No recommendations about what to eat, no body/weight
  advice.
- **No schema/storage changes.** A confirmed draft maps onto the existing `FoodLog`
  shape and is saved via the existing `addFoodLog` path (`yfos:foodLogs`).

---

## `/nutrition` hierarchy (scan-first)

1. **Today summary** — `MacroSummary` (unchanged).
2. **Primary action** — large `סרוק צלחת` card. **Active** when AI is configured;
   **disabled / coming-soon** (`בקרוב`) when it is not. The slot is always present.
3. **Fallback actions** — `הוסף שוב` (reveals recent foods) + `הוסף ידנית`
   (`/nutrition/add`). Below: compact **favorites** chips when any exist.
4. **Today's journal** — `היומן של היום`.
5. **More tracking** (`מעקבים נוספים`) — water + supplements, subordinate.
6. **Tools** (`כלים נוספים`) — protein calculator + full food library.

The hierarchy is identical in both states — only section 2's card swaps between
the active flow and the inert `בקרוב` card. Nothing below it ever changes, and the
manual / recent fallbacks stay visible and usable in both states.

### Active vs disabled scan card

| | AI enabled | AI disabled / no key |
|---|---|---|
| Component | `PhotoScanCard` (full state machine) | `PhotoScanCardDisabled` (inert `<div>`) |
| Title | `סרוק צלחת` | `סרוק צלחת` |
| Subtitle | `צלם את הארוחה ונבנה לך טיוטת תזונה לעריכה` | `ניתוח ארוחה מתמונה יופעל בקרוב` |
| Trust line | `הערכה בלבד · אפשר לערוך לפני שמירה` | `בינתיים אפשר להוסיף ידנית או לבחור מהמאגר` |
| Badge / CTA | `סרוק עכשיו` (opens capture) | `בקרוב` badge + disabled `לא פעיל כרגע` button |
| File input | two hidden `<input type=file>` mounted | **none mounted** |
| On tap | opens the pre-capture sheet | **nothing** (no handler, no overlay) |
| Network | `POST /api/nutrition/analyze-photo` on analyze | **never called** |

The disabled card never opens upload, never calls the analyze route, never throws
a console error, and never blocks manual logging. Because `/nutrition` is
`force-dynamic`, adding an AI key later flips the page to the **active** card on
the next request with **no rebuild**.

**Dev/admin helper.** Outside production the disabled card shows one extra dashed
line — `הפיצ׳ר מוכן, אבל עדיין לא חובר מפתח AI בסביבת הפרודקשן.` — gated by
`showSetupHint` (`process.env.NODE_ENV !== "production"`, computed in
`app/nutrition/page.tsx`). Normal production users only ever see the clean `בקרוב`.

---

## Flow

```
סרוק עכשיו → pre-capture sheet (privacy + estimate note)
          → צלם תמונה / העלה תמונה (web file input; camera capture where supported)
          → client validates type + size
          → POST /api/nutrition/analyze-photo (image, mealTypeHint)
          → "מנתח את הארוחה…"
          → editable review (טיוטה מהתמונה)
              ▸ נראה טוב, הוסף ליומן  → addFoodLog per kept item → /nutrition updates
              ▸ ערוך ערכים / portion chips / remove / add missing
              ▸ נסה שוב / הוסף ידנית במקום / ביטול
```

Every failure state offers a way forward — `נסה שוב`, `הוסף ידנית`, and
`הוסף שוב` (when recent foods exist).

---

## Architecture

| Piece | File | Notes |
|---|---|---|
| Shared types/helpers (client-safe) | `lib/nutrition-photo.ts` | types, constants, copy, validation, library matching, `FoodLog` mapping. No secrets. |
| Server AI adapter (server-only) | `lib/nutrition-ai.ts` | capability check + `analyzePhoto()` via `fetch`; mock seam; provider isolated for easy swap. **Never import from a client component.** |
| API route | `app/api/nutrition/analyze-photo/route.ts` | `GET` capability + `POST` analyze. `nodejs` runtime, `force-dynamic`. |
| Scan card + flow | `components/nutrition/PhotoScanCard.tsx` | state machine: idle → precapture → analyzing → review/error. |
| Review screen | `components/nutrition/PhotoDraftReview.tsx` | editable rows, portion chips, confidence labels, confirm. |
| Disabled scan card | `components/nutrition/PhotoScanCard.tsx` (`PhotoScanCardDisabled`) | inert `בקרוב` card shown when AI is off — no inputs, no overlay, no fetch. |
| Page gating | `app/nutrition/page.tsx` | reads `isNutritionAiConfigured()` (server) → passes `aiEnabled`; also passes `showSetupHint` (non-prod dev/admin helper). |
| Hierarchy | `components/nutrition/NutritionView.tsx` | scan-first layout; renders active vs disabled card by `aiEnabled`; fallback actions, recents folded into `הוסף שוב`. |

### API: `POST /api/nutrition/analyze-photo`

- **Input:** `multipart/form-data` with `image` (File) + optional `mealTypeHint`.
- **Limits:** ≤ 6 MB; types `image/jpeg`, `image/png`, `image/webp` (HEIC shows a
  friendly unsupported message — not accepted). Validated on **both** client and
  server.
- **Success body:**
  ```jsonc
  { "ok": true, "overallConfidence": "high|medium|low",
    "items": [{ "nameHe", "matchedSourceFoodId?", "estPortion",
                "portionSize": "small|regular|large",
                "calories", "protein", "carbs", "fat",
                "confidence": "high|medium|low" }],
    "notes?": "..." }
  ```
- **Error body:**
  ```jsonc
  { "ok": false,
    "error": "disabled|too_large|bad_type|no_food|blurry|ai_unavailable|rate_limited|server_error",
    "messageHe": "..." }
  ```
- The body is always this discriminated union (HTTP 200), so the client reads
  `ok` + `messageHe` uniformly. A failed `fetch` (no body) is treated as a network
  error client-side.

### `GET /api/nutrition/analyze-photo`

Returns `{ "enabled": boolean }` — the same capability the page uses to gate the
scan card.

---

## Environment variables (server-only)

| Var | Purpose | Default |
|---|---|---|
| `NUTRITION_AI_API_KEY` | Secret vision key (falls back to `ANTHROPIC_API_KEY`). **Never** `NEXT_PUBLIC_*`. | — |
| `NUTRITION_AI_MODEL` | Vision model id. | `claude-sonnet-4-6` |
| `NUTRITION_AI_MOCK` | `"1"` → return a deterministic fixture draft, no network call (dev/QA seam). | unset |

**Provider:** a server-side vision-capable model, called with a plain `fetch`
(Anthropic Messages API by default) — zero extra dependencies. The provider is
isolated behind `analyzePhoto()` so it can later be swapped (e.g. to the Vercel AI
Gateway) without touching the route or UI. Results are always estimates; food-photo
macro/portion estimation is inherently approximate.

**No key configured →** `isNutritionAiConfigured()` is false → scan card shows the
inert `בקרוב` state (the feature stays **visible**, not hidden), route `POST`
returns `{ ok:false, error:"disabled" }`, manual/recent logging works normally.
**No broken CTA, no upload, no analyze call, no console errors.** Real scanning
still requires the server-only env vars below; a missing key is a disabled visual
state, never a hidden feature — and **no** schema/storage/auth change is involved.

---

## Data mapping to the existing journal

`buildFoodLogFromConfirmedItem()` (in `lib/nutrition-photo.ts`) turns a confirmed
review row into a standard `FoodLog`:

| Review field | `FoodLog` field |
|---|---|
| (generated) | `id` = `createId("food")`, `date` = `todayISO()` |
| meal selector | `mealType` (defaulted by time of day, editable) |
| name | `foodName` |
| quantity/portion | `quantityText` |
| calories | `calories?` |
| protein / carbs / fat | `protein` / `carbs` / `fat` |
| library match | `sourceFoodId?` / `imagePath?` / `category?` |

Because the result is an ordinary `FoodLog`, photo-originated entries appear in the
daily summary, the diary, recent foods / add-again, and backup/export with no
special casing. Existing nutrition data is untouched and fully compatible.

---

## Failure & loading copy

| State | Hebrew |
|---|---|
| Analyzing | `מנתח את הארוחה…` / `רגע אחד, בונים לך טיוטה מהתמונה` |
| Blurry | `התמונה קצת מטושטשת. אפשר לצלם שוב באור טוב יותר?` |
| No food | `לא זיהינו אוכל בתמונה. אפשר לנסות תמונה אחרת או להוסיף ידנית.` |
| AI unavailable | `הניתוח לא זמין כרגע. אפשר לנסות שוב או להוסיף ידנית.` |
| Network | `אין חיבור כרגע. בדוק את האינטרנט ונסה שוב.` |
| Low confidence | `קשה לזהות חלק מהמנה — כדאי לבדוק ולתקן את הערכים.` |
| Too large | `התמונה גדולה מדי. נסה תמונה קטנה יותר.` |
| Bad type | `סוג הקובץ לא נתמך. צלם תמונה או בחר JPG/PNG.` |

---

## Auth / guest behavior

This feature is available **inside the app only** and does not change
`BetaAuthGate`, guest access, or admin rules. A guest already inside the app can
use it when AI is configured. Final saved logs remain **localStorage-only on the
device**, exactly like all other nutrition data — the photo route stores nothing.

---

## QA seam

Run the app with `NUTRITION_AI_MOCK=1` (and `NEXT_PUBLIC_BETA_DISABLE_GATE=1` to
bypass the access gate locally) to exercise the entire flow — capture → analyzing →
review → confirm → journal — without a real key or network call. See
`e2e/nutrition-photo.spec.ts`.

`npm run test:e2e` builds once (with the gate seam baked in) then runs two
production servers from that build (`playwright.config.ts`): **:3939** with
`NUTRITION_AI_MOCK=1` exercises the **active** card, and **:3940** with no AI env
exercises the **disabled** `בקרוב` card (`e2e/nutrition-photo-disabled.spec.ts`),
asserting it never mounts a file input, never POSTs to the analyze route, logs no
console errors, and leaves the manual / add-again fallbacks usable.
