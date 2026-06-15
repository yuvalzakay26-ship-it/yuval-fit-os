# Nutrition System Rework — Photo-First Logging (Planning)

> **Update (Phase 3.xx):** the MVP described here has been **implemented**. For the
> shipped behavior, files, env vars, API shapes and QA, see
> [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md). This document is kept as
> the original product/architecture plan.

> **Status:** Planning / spec only. No code, no dependencies, no DB tables, no schema
> changes, no localStorage changes, no Supabase, no AI integration in this document.
>
> **Direction change (this revision):** The chosen direction is **photo-first logging**,
> not equal hybrid. `סרוק צלחת` becomes the default nutrition action. Manual logging,
> the food library, saved values, favorites, recent foods, and the journal all stay —
> as the **reliable fallback and editing backbone** behind the scan flow.

---

## 1. Executive recommendation (photo-first default)

**Make Photo / Plate Scan the default nutrition logging flow.** When a user opens
`/nutrition`, the page should guide them first to `סרוק צלחת`. Manual add and "add
again" remain present and one tap away, but **secondary** — fallbacks, not co-equals.

The product should feel like:

> **`תצלם — אנחנו נכין טיוטה — אתה רק מאשר`**

…not "fill a long nutrition form."

The existing nutrition system is **not** removed. It is repositioned: the food library,
manual add form, saved values, favorites, recent foods, and journal become the trusted
machinery the scan flow drafts _into_. Every confirmed photo draft is written through the
**existing `addFoodLog` path** as an ordinary `FoodLog`, so there are **no storage, DB,
schema, or Supabase changes**, and existing nutrition data stays fully compatible.

**Recommended next phase: Option 3 (combined, scan-first redesign + AI route gated on
key, fallback preserved).** See §16 for the full comparison and rationale.

This supersedes the earlier "Option C equal hybrid" recommendation. See §2 for why
photo-first now wins over both equal-hybrid and the original manual-primary options.

---

## 2. Why scan should be the default

Comparison against the previously considered options:

| Option | Primary action | Feel | Fallback | Verdict |
|---|---|---|---|---|
| A — manual primary | manual form | form-heavy | n/a | rejected: keeps friction |
| C — equal hybrid | 3 equal actions | neutral | excellent | superseded |
| **Photo-first** | **`סרוק צלחת`** | **automatic** | **manual/recent as safety net** | **chosen** |

Why photo-first is now the chosen direction:

- **Easier and more automatic.** The default path is "snap → review → confirm," which
  removes the ~6-field manual entry burden for the common case.
- **Less manual form friction.** A new user logs a meal without understanding the
  library/manual distinction or typing macros.
- **Matches the desired UX.** The mental model becomes "the app drafts, I approve" — the
  stated product goal — instead of "I fill a nutrition form."
- **Keeps the old system as a safety net.** Manual add, library, saved values, favorites,
  recent, and journal all remain; they are the fallback and the editing surface, so the
  app is never stuck when AI is wrong or unavailable.
- **Still honest and user-controlled.** Every estimate is labeled an estimate, every value
  is editable, and **nothing is saved without an explicit confirm tap**.

Why not equal hybrid (C): three equal-weight actions don't express a default, so they
don't deliver the "automatic-first" feeling. Photo-first makes the easy path obvious while
keeping the manual paths as clearly-available fallbacks.

The one real cost of photo-first — dependence on AI accuracy and availability — is fully
contained by keeping manual/recent always reachable and never auto-saving (see §8, §13,
§17).

---

## 3. How manual add becomes a fallback without feeling hidden

Manual logging must be **secondary in hierarchy but never buried**. Rules:

- `הוסף ידנית` and `הוסף שוב` sit **directly under** the scan card as smaller, always-
  visible actions — not behind a menu, not on another screen.
- **Every scan failure surfaces manual paths inline** (`נסה שוב` / `הוסף ידנית` / and
  `הוסף שוב` when recent foods exist). The user can switch to manual in one tap from any
  error.
- The **review screen itself offers `הוסף ידנית במקום`**, so even mid-scan the user can
  bail to full manual control.
- When **no AI key is configured**, the scan card is not rendered at all and the page
  degrades to a clean manual-first layout — manual is then automatically primary, no
  broken "coming soon" CTA.

Net effect: scan is the _default_, manual is the _fallback_, and manual is always exactly
one tap away.

---

## 4. How "add again" stays fast for repeat meals

`הוסף שוב` is already the fastest path in the app and is **fully offline / no-AI**. It is
derived purely from log history (`getRecentFoodEntries` in `lib/nutrition-reuse.ts`),
deduplicated, with macros carried verbatim, written via `duplicateFoodLogForToday` →
`addFoodLog`.

In the photo-first layout it remains a top-tier fallback action directly under the scan
card:

- `הוסף שוב` → subtitle `מהארוחות האחרונות שלך`.
- Tapping it opens the recent picker (the former `אכלת לאחרונה` content), so re-logging a
  known meal stays **one tap** and never touches the AI route.
- Repeat meals are usually better served by `הוסף שוב` than by re-scanning — so for
  habitual eaters the fast, deterministic path is always present even though scan is the
  visual default.

---

## 5. Updated `/nutrition` page hierarchy

```
┌─ /nutrition ────────────────────────────────────────────┐
│ 1. TODAY SUMMARY  (MacroSummary — unchanged)             │
│    protein ring · calories · carbs/fat · goal bars       │
├──────────────────────────────────────────────────────────┤
│ 2. PRIMARY DEFAULT ACTION — large featured card          │
│    ┌────────────────────────────────────────────────┐    │
│    │ 📷  סרוק צלחת                                    │    │
│    │ צלם את הארוחה ונבנה לך טיוטה אוטומטית             │    │
│    │ הערכה בלבד · אפשר לערוך לפני שמירה   (trust line) │    │
│    │                       [  סרוק עכשיו  ]           │    │
│    └────────────────────────────────────────────────┘    │
│    (entire card hidden when no AI key — see §10/§13)      │
├──────────────────────────────────────────────────────────┤
│ 3. FAST FALLBACK ACTIONS — smaller, secondary, visible    │
│    ┌───────────────┐  ┌───────────────────────────┐       │
│    │ ↺ הוסף שוב     │  │ ✎ הוסף ידנית               │       │
│    │ מהארוחות       │  │ בחירה מהמאגר או הזנה חופשית │       │
│    │ האחרונות שלך   │  │                            │       │
│    └───────────────┘  └───────────────────────────┘       │
│    [ ⭐ מועדפים chips … ]  (compact, only if any)          │
├──────────────────────────────────────────────────────────┤
│ 4. TODAY'S JOURNAL  (היומן של היום)                       │
│    diary rows with add-again + delete                    │
├──────────────────────────────────────────────────────────┤
│ 5. OTHER NUTRITION TOOLS  (lower / compact)               │
│    מעקב מים · תוספים · יעד חלבון · עיון במאגר המלא         │
└──────────────────────────────────────────────────────────┘
```

Changes vs. today's actual page (`components/nutrition/NutritionView.tsx`, which currently
stacks 7 equal-weight sections: summary → water → supplements → protein calc → quick
actions+favorites → recent → diary):

- **Scan becomes the single visual default** directly under the summary.
- `אכלת לאחרונה` folds into the `הוסף שוב` fallback action (same data, fewer peer
  sections).
- **Water, supplements, protein calculator, and full library browse move down** into a
  compact "other tools" band below the diary — they stop competing with the act of
  logging food.
- When AI is off, section 2 disappears and section 3 becomes the top action band → clean
  manual-first page.

---

## 6. Updated scan-first user flow

```
Open /nutrition  →  see large סרוק צלחת card (default)
   │
   ▼
[סרוק עכשיו]
   │
   ▼
[1] Pre-capture sheet
    - privacy + estimate note (§7)
    - צלם תמונה / העלה תמונה  (web file input, capture=camera) · ביטול
   │
   ▼
[2] Local checks (client, before upload)
    - allowed type? size ≤ limit? → if not, friendly failure (§8), no upload
   │
   ▼
[3] Analyzing
    - "מנתח את הארוחה…" / "רגע אחד, בונים לך טיוטה מהתמונה"
    - image POSTed to server route; never stored (§9/§10)
   │
   ├─ success ─▶ [4] DRAFT REVIEW  (title: טיוטה מהתמונה)
   │               - detected foods: name · est. portion · kcal · P/C/F · confidence
   │               - overall confidence banner + disclaimer
   │               - per item: ערוך ערכים · portion chips (קטנה/רגילה/גדולה) · remove
   │               - add missing food (drops into existing manual fields)
   │               - meal selector (defaults by time of day)
   │               actions:
   │                 ▸ נראה טוב, הוסף ליומן  → confirm → addFoodLog (§12)
   │                 ▸ ערוך ערכים            → inline edit
   │                 ▸ הוסף ידנית במקום       → switch to manual form
   │                 ▸ נסה שוב / ביטול
   │
   └─ failure ─▶ friendly error (§8) ALWAYS offering:
                   נסה שוב · הוסף ידנית · (הוסף שוב if recent foods exist)
   │
   ▼
[5] On confirm ONLY → ordinary FoodLog written to yfos:foodLogs → /nutrition updates
```

Enforced principle: **AI drafts → user confirms → existing journal stores the entry.**
Nothing is written before the explicit confirm tap, on any path.

---

## 7. Exact Hebrew UX copy

> Tone: warm, simple, non-legalistic. Tracking assistant, not a diet coach. No
> shame/guilt/diet language. No medical or restrictive advice.

### Main scan card (default action)
- Title: `סרוק צלחת`
- Subtitle: `צלם את הארוחה ונבנה לך טיוטת תזונה לעריכה`
- Trust line: `הערכה בלבד · אפשר לערוך לפני שמירה`
- Primary CTA: `סרוק עכשיו`

### Secondary / fallback actions
- `הוסף שוב` — subtitle `מהארוחות האחרונות שלך`
- `הוסף ידנית` — subtitle `בחירה מהמאגר או הזנה חופשית`

### Before upload
- `התמונה משמשת ליצירת טיוטת תזונה בלבד. הערכים הם הערכה וניתן לערוך אותם לפני שמירה.`
- Buttons: `צלם תמונה` · `העלה תמונה` · `ביטול`

### While analyzing
- `מנתח את הארוחה…`
- `רגע אחד, בונים לך טיוטה מהתמונה`

### Review screen
- Title: `טיוטה מהתמונה`
- Disclaimer (persistent): `הערכה בלבד · כדאי לבדוק לפני הוספה ליומן`
- Main confirm: `נראה טוב, הוסף ליומן`
- Edit: `ערוך ערכים`
- Fallback: `הוסף ידנית במקום`
- Add missing item: `הוסף מאכל שלא זוהה`
- Remove item (aria): `הסר מאכל מהטיוטה`

### Confidence labels
- High: `נראה די בטוח`
- Medium: `כדאי לבדוק`
- Low / partial: `קשה לזהות חלק מהמנה`

### Portion chips
- `מנה קטנה` · `מנה רגילה` · `מנה גדולה`

### Scan failed
- `לא הצלחנו לזהות את הארוחה בצורה מספיק טובה. אפשר לנסות שוב או להוסיף ידנית.`
- Buttons: `נסה שוב` · `הוסף ידנית`

### Privacy note (short, near upload)
- `התמונה נשלחת לניתוח בלבד ואינה נשמרת.`

### Success toast (reuses existing string)
- `נוסף ליומן של היום`

---

## 8. Failure states with manual fallback

**Hard rule:** the user must never get stuck. Every scan error offers, at minimum,
`נסה שוב` and `הוסף ידנית`; when recent foods exist it also offers `הוסף שוב`.

| State | Trigger | Hebrew copy | Recovery actions |
|---|---|---|---|
| Loading | analyzing | `מנתח את הארוחה…` / `רגע אחד, בונים לך טיוטה מהתמונה` | — |
| Scan failed (generic) | low overall signal | `לא הצלחנו לזהות את הארוחה בצורה מספיק טובה. אפשר לנסות שוב או להוסיף ידנית.` | נסה שוב · הוסף ידנית · (הוסף שוב) |
| Blurry image | model low signal | `התמונה קצת מטושטשת. אפשר לצלם שוב באור טוב יותר?` | נסה שוב · הוסף ידנית |
| No food detected | empty result | `לא זיהינו אוכל בתמונה. אפשר לנסות תמונה אחרת או להוסיף ידנית.` | נסה שוב · הוסף ידנית |
| AI unavailable | timeout / 5xx | `הניתוח לא זמין כרגע. אפשר לנסות שוב או להוסיף ידנית.` | נסה שוב · הוסף ידנית · (הוסף שוב) |
| Network error | offline / fetch fail | `אין חיבור כרגע. בדוק את האינטרנט ונסה שוב.` | נסה שוב · הוסף ידנית |
| Low confidence (partial) | overall = low | `קשה לזהות חלק מהמנה — כדאי לבדוק ולתקן את הערכים.` | edit · confirm · הוסף ידנית |
| Too large | size > limit | `התמונה גדולה מדי. נסה תמונה קטנה יותר.` | pick another · הוסף ידנית |
| Unsupported type | bad mime | `סוג הקובץ לא נתמך. צלם תמונה או בחר JPG/PNG.` | pick another · הוסף ידנית |
| Partial result | some items missing | `זיהינו חלק מהמנה. אפשר להוסיף ידנית מה שחסר.` | הוסף מאכל שלא זוהה · confirm |
| User cancels | tap ביטול | (silent → back to /nutrition) | — |

---

## 9. Privacy rules

1. **No AI key in the client.** All model calls are server-side only.
2. **No image storage by default.** The image lives only for the request's duration —
   never written to disk, Blob, DB, or Supabase. The response carries data only, never an
   image URL or stored reference.
3. **No auto-save.** Nothing is written to the journal until the user taps
   `נראה טוב, הוסף ליומן`.
4. **Always editable before save.** Every estimated value is editable; items can be
   removed and missing items added.
5. **Estimates labeled as estimates.** Persistent `הערכה בלבד` + per-item confidence;
   never present calories/macros as exact.
6. **No medical/diet advice, no shame language.** No "should eat/avoid," no health
   prescriptions — consistent with the existing supplements module's "no recommendations"
   stance.
7. **Clean disable.** No configured AI → scan card hidden, app fully functional via
   manual + add-again.
8. **Reset coverage.** Confirmed entries are ordinary `FoodLog`s, so the existing
   `resetAllData` already clears them — no new key escapes the reset path.

---

## 10. Technical architecture (proposal only)

A thin client capture/review UI + one server route + a mapping function that ends in the
existing `addFoodLog`. **No new storage, no DB, no Supabase, no image retention.**

```
client                          server (Next.js route handler)        existing app
──────                          ──────────────────────────────        ────────────
capture/upload  ──image──▶  POST /api/nutrition/analyze-photo
  (local validation)             - validate size/type
                                 - call vision model (server-side key)
                                 - normalize → strict JSON
review draft   ◀──JSON────       - DO NOT persist the image
  (edit/confirm)
confirm  ───────────────────────────────────────────────▶  addFoodLog() → yfos:foodLogs
```

### Feature availability / clean disable
- Gate on a server-side env flag, e.g. `NUTRITION_AI_ENABLED`, derived from whether a
  vision provider key is configured. **No key in the client, ever.**
- A server component passes an `aiEnabled` boolean into the page so the UI knows whether
  to render the `סרוק צלחת` card. **No key → card not rendered → manual-first page.**

### AI provider (high level — no integration, no keys)
- Needed: a multimodal **vision LLM** that takes an image + structured prompt and returns
  strict JSON (foods, portion bucket, macro estimates, per-item + overall confidence).
  Not a specialized nutrition API.
- Per the session's Vercel knowledge-update, prefer routing via **Vercel AI Gateway** with
  a `"provider/model"` string rather than wiring a provider SDK directly. Anthropic or
  OpenAI vision models both fit; default to the latest Claude vision model for this stack.
- Limitations to set expectations honestly: portion from a 2D photo is uncertain (no
  scale), hidden oils/sauces skew macros, similar dishes are confusable, Israeli/ethnic
  recipes vary. → **always a draft, always editable, always an estimate.**

---

## 11. API route design

> Naming, shapes, and limits are a proposal for a future implementation.

**Route:** `POST /api/nutrition/analyze-photo` (App Router route handler, Node runtime via
Fluid Compute; server-side only).

### Input
- `multipart/form-data` with one `image` file (preferred — avoids base64 bloat), or JSON
  `{ imageBase64, mimeType }` fallback.
- Optional `mealTypeHint?: "breakfast"|"lunch"|"dinner"|"snack"` (from time of day).

### Limits
- Max file size ~6 MB (reject larger before the model call).
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/heic` (down-convert or
  reject HEIC with a friendly message if unsupported).
- One image per request; per-session rate limiting to control cost.

### Output JSON (draft — all values are estimates, nothing saved server-side)
```jsonc
{
  "ok": true,
  "overallConfidence": "high" | "medium" | "low",
  "items": [
    {
      "nameHe": "שקשוקה",
      "matchedSourceFoodId": "shakshuka",   // optional — when matched to library
      "estPortion": "מנה רגילה",
      "portionSize": "regular",             // small | regular | large
      "calories": 320,                      // estimate
      "protein": 18, "carbs": 22, "fat": 17,// grams, estimates
      "confidence": "high" | "medium" | "low"
    }
  ],
  "notes": "חלק מהמנה מוסתר בתמונה"          // optional
}
```

### Error shape
```jsonc
{ "ok": false,
  "error": "blurry" | "no_food" | "too_large" | "bad_type" |
           "ai_unavailable" | "rate_limited" | "server_error",
  "messageHe": "..." }
```

### Error handling
- Validate size/type **before** invoking the model (cheap rejects).
- Timeout-wrap the model call; on timeout/5xx → `ai_unavailable`.
- If the model returns prose instead of JSON, strict-reparse once, else `server_error`.
  Never return half-validated macros as if confirmed.
- Always include `messageHe` so the client renders copy without mapping logic.

---

## 12. Data mapping to existing FoodLog journal

Each **kept, confirmed** draft item maps 1:1 onto the existing `FoodLog`
(`lib/fitness-types.ts`), written via `addFoodLog` (`lib/fitness-store.ts` →
`saveFoodLog` in `lib/storage.ts`, key `yfos:foodLogs`). **No field added or removed.**

| Draft item field | `FoodLog` field | Notes |
|---|---|---|
| — | `id` | `createId("food")` at confirm time |
| — | `date` | `todayISO()` |
| meal selector | `mealType` | defaulted by time of day, user-editable |
| `nameHe` | `foodName` | editable on review |
| `estPortion` | `quantityText` | free text, same as today |
| `calories` | `calories?` | estimate, editable |
| `protein` | `protein` | estimate, editable, default 0 |
| `carbs` | `carbs` | estimate, editable, default 0 |
| `fat` | `fat` | estimate, editable, default 0 |
| `matchedSourceFoodId` | `sourceFoodId?` | only when confidently matched to library |
| matched item image | `imagePath?` | only if matched |
| matched category | `category?` | only if matched |
| — | `notes?` | optional "נוצר מתמונה" marker |

**Backward compatibility:** because the result is an ordinary `FoodLog`, it flows into
today's summary, the diary, recent foods, and `הוסף שוב` with no special-casing. A
photo-originated entry can later be re-logged in one tap like any other. Existing
localStorage nutrition data is untouched and fully compatible.

---

## 13. AI-unavailable behavior

Three distinct cases, all graceful:

1. **No AI key configured at all** → `aiEnabled = false` → scan card is **not rendered**.
   The page is the clean manual-first layout (fallback actions become the top band). No
   dead/"coming soon" CTA.
2. **Key configured but call fails** (timeout, 5xx, network) → friendly error (§8) that
   always offers `נסה שוב` + `הוסף ידנית` (+ `הוסף שוב` if recent foods exist). The user
   completes the log manually without leaving the flow.
3. **Key configured, low-confidence result** → still returns a draft, flagged
   `קשה לזהות חלק מהמנה`, with editing encouraged before confirm.

In every case the user can reach the journal; the AI is an accelerator, never a gate.

---

## 14. What existing nutrition features stay

All of them — repositioned, none removed:

- **Journal** (`yfos:foodLogs`) — unchanged; the single source of truth and the
  destination for confirmed drafts.
- **Daily summaries** (`MacroSummary`, `sumNutrition`) — unchanged; stays at the top.
- **Manual add flow** (`FoodLogForm`) — kept; the fallback path **and** the editing surface
  behind the review screen ("add missing food" reuses these fields).
- **Food library** (`lib/food-library.ts`) — kept; it powers `sourceFoodId`, gives the
  always-correct offline path, and lets scan results link back to saved values by name.
- **Saved values** (`yfos:saved-food-values:v1`) — kept; still auto-fills, and a
  matched scan item can reuse them.
- **Favorites** (`yfos:favorite-foods:v1`) — kept; compact chip row under the fallback
  actions.
- **Recent foods / add-again** (`lib/nutrition-reuse.ts`) — kept; the fast, no-AI repeat
  path under the scan card.

---

## 15. What becomes secondary

- **Manual add + library browse** → secondary action band under the scan card (visible,
  one tap, never buried — see §3).
- **`אכלת לאחרונה` section** → folded into the `הוסף שוב` fallback action.
- **Water, supplements, protein calculator, full library browse** → moved into a lower,
  compact "other tools" band below the diary; they stop competing with food logging.
- **Saved values** → remain invisible plumbing (auto-fill), unchanged.

---

## 16. MVP options and recommended next implementation

| Option | What it builds | Risk | Gap |
|---|---|---|---|
| 1 — redesign only, scan "coming soon" | scan-first layout, scan disabled until AI ready | low | ships a prominent **dead CTA**; no real value yet |
| 2 — full scan MVP now | server route + capture + review + save | higher | redesigns the page anyway; takes AI risk before IA is validated |
| **3 — combined** | scan-first redesign **+** route only when key set **+** scan card hidden when no key **+** manual/recent fallback intact | **low–moderate** | **none significant** |

**Recommended: Option 3.** It is the safest *and* most useful next phase because:

- **No dead CTA.** With no key, the scan card is simply absent and the page is a clean
  manual-first layout — Option 1's "coming soon" featured card is avoided entirely.
- **Real value when enabled.** With a key, the full draft→confirm flow works — Option 1
  never delivers this.
- **One cohesive redesign.** Avoids redesigning `/nutrition` twice (Option 2 would
  redesign now; Option 1 would redesign again later when AI lands).
- **Contained AI risk.** The route is gated on the key, validated server-side, and every
  failure falls back to manual/recent — so turning AI on is low-stakes.

**De-risking sequence inside Option 3 (build order, single release):**
1. Ship the scan-first **layout** + the **fallback paths complete** (manual + add-again
   fully working with the new hierarchy, scan card gated on `aiEnabled`). The page is
   fully usable even before the route is wired.
2. Build the **review screen** against a stub/fixture draft (no network), proving the
   edit/confirm → `addFoodLog` mapping end-to-end.
3. Wire the **`/api/nutrition/analyze-photo`** route and flip `aiEnabled` on where the key
   exists.

This keeps every intermediate state shippable and the manual experience never regresses.

---

## 17. Risks of photo-first and how to reduce them

| Risk | Mitigation |
|---|---|
| **AI accuracy variance** makes the default path feel unreliable | Always a draft; per-item + overall confidence labels; forced edit-then-confirm; manual/recent always one tap away |
| **Over-trust of estimates** (users treat numbers as exact) | Persistent `הערכה בלבד`, confidence labels, no auto-save, editable everything |
| **AI downtime blocks the default action** | `aiEnabled` gate hides the card with no key; runtime failures fall back to manual/recent inline (§8, §13) |
| **Cost / abuse** of the vision route | Size limit, one image/request, per-session rate limiting |
| **Privacy perception** (photos may include surroundings/people) | No-storage policy + clear pre-capture and near-upload notes |
| **HEIC / huge phone photos** (default iOS) | Client down-convert or friendly `bad_type`/`too_large` messages |
| **Scope creep into a diet coach** | Hard line: no recommendations, no health-framed targets, no shame language |
| **Redesign regression** (folding recent into add-again) | Treat layout as pure IA reorganization; preserve existing recent-derivation and `addFoodLog` behavior; keep each build step shippable (§16) |
| **Default no longer fits power users** who repeat meals | `הוסף שוב` stays a prominent fallback and is faster than re-scanning for known meals (§4) |
| **RTL / mixed numerals** on the review screen | Follow the existing `MacroSummary` "מתוך" RTL pattern |

---

### Hard constraints honored throughout
No auto-save without confirmation · no exact calorie promises · no medical/diet advice ·
no image storage by default · no AI key in client · no Supabase/DB changes · existing
localStorage nutrition data stays compatible · existing manual logging keeps working.
