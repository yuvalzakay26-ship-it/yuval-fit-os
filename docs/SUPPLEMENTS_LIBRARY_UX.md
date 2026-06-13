# Supplements Library UX (Phase 3.28)

A focused UX-flow polish over the supplements **add flow** and the
**common-supplements starter library**. This phase changed presentation,
hierarchy, copy, search, and duplicate handling only. It did **not** touch
storage keys, the supplement data model, tracking logic, or the safety
boundaries. See [`SUPPLEMENTS_TRACKER.md`](./SUPPLEMENTS_TRACKER.md) for the
feature as a whole.

> **The starter library is not a recommendation engine.** Every catalogue item is
> a *quick-add template* — a name + a neutral category (+ a single definitional
> timing tag for Pre-Workout). The app never recommends what to take, never
> suggests a dosage, and never infers anything from age, gender, goals, condition,
> or workout. The user still owns and edits every saved value.

## Add-flow hierarchy

In **add** mode (`/nutrition/supplements/add`) the screen reads top-to-bottom as:

1. Back link + page header.
2. **Common-supplements library card** — search field, category tabs, template
   grid, "not a recommendation" note.
3. **Selected-template summary** (only after a template is picked) — icon, Hebrew
   name, English subtitle, category, and `אפשר לערוך הכול לפני שמירה.` with a
   one-tap `נקה בחירה`.
4. **Manual details form** — name, category, free-text dosage/note, timing,
   active toggle. The section header is `פרטים אישיים` once a template is chosen,
   `או הוספה ידנית` otherwise.
5. **Safety note.**
6. **Save CTA** (`שמור תוסף`).

In **edit** mode (`?id=`) the library and summary are hidden; the screen is just
the details form, delete, safety, and the save CTA.

## Search behavior

Implemented locally in `supplement-catalog.ts` (`supplementMatchesQuery`) — no
external data, no network. A query matches against, case-insensitively:

- the Hebrew name (`nameHe`),
- the English subtitle (`nameEn`),
- the neutral category label (passed in by the component), and
- a set of search-only `aliases` per item (common spellings/synonyms).

Multi-word queries match when **every** whitespace-separated token is found
somewhere in that haystack (AND). Search **composes** with the category tabs: the
tab narrows the set first, then the query filters within it. Examples that
resolve correctly:

| Query | Resolves to |
| --- | --- |
| `קריאטין` / `creatine` / `creatin` | Creatine |
| `ויטמין` | all Vitamin D/C/B12/B-Complex/Multivitamin |
| `mag` / `מגנזיום` | Magnesium |
| `אומגה` / `omega3` / `fish oil` | Omega 3 |
| `b12` | Vitamin B12 |

An empty result renders a calm state: `לא נמצאו תוספים תואמים` /
`אפשר להוסיף ידנית בכל רגע.` — the manual form below stays fully usable.

## Already-tracked behavior

`trackedCatalogMap(supplements)` builds a `Map<catalogKey, existingId>` by
matching each catalogue template's normalized Hebrew **or** English name against
the user's supplements (active **or** archived; first/oldest match wins).

- In the **full library** and the **tracker rail**, a matched card shows a calm
  `כבר במעקב` badge (a filled check instead of the `+` affordance) and an accent
  border.
- **Tapping a tracked template opens the existing entry for editing**
  (`?id=<existingId>`) instead of prefilling a new add — chosen as the safest
  option because it prevents a duplicate while still being a useful action.
- Picking any template only ever *prefills* the form — it never auto-saves — so
  the catalogue can never silently create a duplicate on its own.

Manual duplicate behavior is unchanged: the app did not previously block two
manually-named identical supplements, and this phase does not add such a block.
Duplicate *prevention* is applied to catalogue templates only, via the
open-the-existing-entry routing above.

## Catalogue template behavior

- A template prefills **name + category** and, only where definitional (Pre-
  Workout), a **timing** tag. Nothing else is filled.
- **Dosage is never prefilled** — it is free text the user types, and the app
  states `האפליקציה לא מציעה מינונים.` next to the field.
- A manual rename detaches the picked-template highlight.
- The `?preset=<key>` deep link (used by the tracker rail) prefills the same way.

## CTA / bottom-nav clearance

The `שמור תוסף` CTA is a full-width, prominent gradient button at the end of the
flow. The app shell (`components/layout/AppShell.tsx`) gives the scroll area
`pb-32` (~128px) of bottom padding; the fixed bottom nav is ~79px tall, so the
CTA rests ~50px clear of the nav at both 360px and 390px widths, and the form
scrolls naturally. A safe-area inset is added below for notched devices.

A viewport-pinned sticky bar was intentionally **not** used: the page-wrapping
`RouteTransition` applies `.animate-fade-up`, whose `animation-fill-mode: both`
leaves a `transform` on the ancestor — which breaks viewport-relative
`position: sticky` and would float the CTA incorrectly.

## Safety boundaries (unchanged, restated)

- `המעקב הוא אישי בלבד ואינו מהווה המלצה רפואית.`
- `בתוספים או תרופות, כדאי להתייעץ עם הורה, רופא או איש מקצוע מתאים.`
- Library note: `המאגר נועד למילוי מהיר בלבד ואינו המלצה רפואית.`
- Copy avoids `מומלץ` / `המלצה` / `כדאי לקחת`; it uses neutral, template-framed
  language (`תוספים נפוצים`, `בחר פריט להתחלה מהירה`, `אפשר לערוך לפני שמירה`).

## Intentionally not done

- **No** dosage recommendations or any generated dosage values.
- **No** AI, no external supplement database, no network calls.
- **No** medical suggestions, and no inference from condition/age/gender/goal/
  workout.
- **No** backend, auth, or cloud sync.
- **No** changes to supplement storage keys (`yfos:supplements:v1`,
  `yfos:supplement-logs:v1`) or the `Supplement` / `SupplementLog` data model.
