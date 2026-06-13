# UI/UX Polish — Phase 3.21.1 (Today + Supplements)

A visual-quality pass over the **Today** dashboard, the **Supplements** experience,
and the **Water** card. This phase changed **presentation only** — no logic, data
model, storage keys, safety boundaries, or feature scope were touched.

> Goal: make the daily dashboard feel like a premium mobile wellness OS
> (`היום שלי`), not a stack of identical white cards.

## Visual issues addressed

- **"Flat white stack" problem.** Cards on Today looked like separate generic
  blocks with no module identity, especially in light mode.
- **Plain Supplements empty state.** A lone pill icon + one button felt unfinished.
- **Generic completion feedback.** The taken-toggle and completion rings were
  functional but not satisfying or celebratory.
- **Water card felt standard** inside the full dashboard.
- **Light mode lacked depth** — washed-out gray, weak hierarchy.

## New shared building blocks (`app/globals.css`)

- **`.sheen`** — a 1px gradient hairline drawn only on a card's rounded edge
  (masked), giving a "lit-from-above" glass depth. Subtle in light, barely-there
  in dark. Pointer-safe, clipped to the card radius, composes with any card.
- **`.module-water` / `.module-supplement`** — a whisper of the feature hue
  washed diagonally across a card so light mode reads as distinct modules. In
  dark mode the supplement soft aliases to the emerald brand; water keeps cyan.
- **`@keyframes check-pop`** (`.animate-check-pop`) — a springy overshoot as a
  habit mark lands, re-keyed so it replays on every fresh mark.
- **`@keyframes glow-pulse`** (`.animate-glow-pulse`) — a one-shot glow ring
  behind the toggle when an item is marked taken.
- All new animations are disabled under `prefers-reduced-motion: reduce`.

## Today dashboard (`components/today/TodayView.tsx`)

- Section headers now carry an optional **module-identity accent dot**
  (`SectionHeader` gained an `accent` prop): brand teal for quick actions, cyan
  for hydration, violet for supplements, indigo for the knowledge center, blue
  for the last workout.
- Hero snapshot, quick-action tiles, knowledge card, and last-workout card all
  gained the `.sheen` edge highlight for premium depth.
- Spacing/rhythm preserved (`space-y-7`); no extra page length, bottom-nav
  clearance unchanged (`AppShell` keeps `pb-32`).

## Supplements card on Today (`components/supplements/SupplementsCard.tsx`)

- **Redesigned empty state** — a centered premium composition:
  - A gradient capsule tile (`CapsuleIcon`) with a small floating shield-check
    badge and a soft glow → reads as a health-habit module.
  - Hierarchy: `תוספים היום` label → `עדיין לא הוגדרו תוספים` →
    benefit line `אפשר להוסיף פריטים למעקב אישי ולסמן מה נלקח היום.` →
    premium CTA `הוסף תוסף ראשון` → calm safety microcopy.
- **Populated state** — `module-supplement` tint + `.sheen`, a calm **progress
  track bar** under "X מתוך Y סומנו", and a small **completion check badge** on
  the ring corner when everything is marked (the numeric `X/Y` stays visible).
- Item rows get press feedback; the violet pill tiles and toggles are unchanged
  in behaviour.

## Supplements full screen (`components/supplements/SupplementsTracker.tsx`)

- **Hero completion card** now uses the violet `module-supplement` glass + sheen
  treatment, with a celebratory check badge on the ring when complete.
- **Active item cards** highlight when taken: violet-tinted card background and a
  gradient-filled pill tile, so taken/untaken read at a glance.
- **Safety note** kept calm and integrated (soft violet border, shield icon).
- **Archived items** restyled as quiet `flat` cards.
- Empty-state icon upgraded to the cleaner `CapsuleIcon`.

## Add / edit supplement (`components/supplements/SupplementForm.tsx`)

- The form card gained the `.sheen` depth treatment. Category chips, timing
  chips, the active switch, dosage hint, and safety copy are unchanged — dosage
  remains **free text only**, no dosages or recommendations are ever suggested.

## Water card (`components/water/*`)

- `WaterCard`: `module-water` tint + `.sheen`; the `פתח` action is now an elegant
  cyan pill; the title uses the water accent.
- `WaterQuickAdd`: stronger buttons — soft cyan field, a raised circular glass
  icon with an active-press scale, clearer hierarchy.
- `WaterTracker` hero: matching `module-water` glass + sheen treatment.
- Water gauge logic and the wave animation are untouched.

## Icons (`components/ui/icons.tsx`)

- Added **`CapsuleIcon`** — a clean horizontal two-tone capsule for the premium
  supplements hero composition. Consistent with the stroke-based icon set; no
  emoji as primary UI. Existing icons unchanged.

## Light + dark validation

- Light mode: module tints, sheen, and stronger module identity remove the
  washed-out gray feel; depth and contrast improved.
- Dark mode: keeps its single emerald identity (feature accents alias to brand,
  water stays cyan); sheen is intentionally faint; gradients/shadows verified.
- Verified at 390px (and the existing 360px capture) in both schemes — no
  horizontal overflow, no console errors, bottom nav never covers content.

## What was explicitly NOT changed

No backend / auth / database / cloud sync, no AI, no medical recommendations, no
dosage suggestions, no native/Capacitor/APK, no video, no heavy charts, no
food/exercise image imports. Storage keys, data models, and the supplement
safety boundaries are byte-for-byte unchanged. All existing localStorage keys
remain backward-compatible.

## QA

Green (exit 0, no console errors), both light + dark, mobile viewport:
`scripts/qa-supplements.mjs`, `scripts/qa-water.mjs`,
`scripts/qa-nutrition-smoke.mjs`, `scripts/qa-favorites.mjs`,
`scripts/qa-saved-values.mjs`, `qa/welcome-check.mjs`, `qa/console-check.mjs`,
`qa/check360.mjs`. `npm run lint` (0 errors) and `npm run build` pass.
