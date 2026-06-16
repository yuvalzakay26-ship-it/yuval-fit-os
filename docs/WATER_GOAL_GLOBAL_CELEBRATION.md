# Water Goal — Global Celebration & Shared Status (Phase 3.xx)

A follow-up to [`WATER_GOAL_UX_UPGRADE.md`](WATER_GOAL_UX_UPGRADE.md). The first
pass added graduated water states but they were too local (mostly the
`/nutrition/water` detail screen) and the 100% moment was too subtle. This pass
makes the celebration **app-wide** and makes the status **colour every water
surface** — blue while on track, amber when meaningfully over, rose for a
significant over-goal. Still a UX feature, not medical: no schema/backup change.

## What changed

- **App-wide celebration overlay** — `components/water/WaterGoalCelebrationOverlay.tsx`,
  mounted once high in the app shell (`components/layout/AppShell.tsx`). When the
  user crosses into 100% of the daily goal it plays a short (~1.5s) water-themed
  moment: a blue glow wash, a diagonal liquid sweep, a popped badge
  (`יעד המים הושלם`), and a few rising bubbles / falling drops. It is **not a
  modal** — `pointer-events-none`, `aria-hidden`, no focus trap, nothing to close,
  self-dismissing.
- **Centralized trigger** — `lib/water-goal-events.ts`. The water add flow lives
  in one place (`logWater` in `lib/fitness-store.ts`), so the crossing is detected
  there and broadcast as the custom event **`yfos:water-goal-reached`**. Every add
  surface (detail screen, Today card, any quick-add) goes through `logWater`, so
  the celebration fires no matter where water was added — no per-button logic.
- **Shared status colours** — `waterStatusTheme(status)` in
  `components/water/water-copy.ts` returns the card wash, accent text, chip, glow
  and gauge-tint vars per status. Applied to the Today/Nutrition card
  (`WaterCard`), the detail hero (`WaterTracker`), and the gauge (`WaterGauge`
  gained a `tintVars` prop). The compact `WaterGoalBanner` (now with a `compact`
  prop) is embedded in `WaterCard` for the attention/caution states, so the
  careful copy — including the non-medical line — is visible on Today without
  opening `/nutrition/water`.

## How the global celebration is triggered

1. Any surface adds water → `logWater(date, ml)` (the single mutation entry point).
2. `logWater` compares the pre-add total and post-add total against the configured
   goal and calls `maybeCelebrateWaterGoalCrossing`.
3. That helper emits `yfos:water-goal-reached` **only** when crossing from below
   the goal to at/above it, and at most **once per day** (guarded by a tiny,
   isolated flag `yfos:water-goal-celebration-seen:v1`).
4. The overlay listens for the event, re-keys its animations, shows for ~1.5s, and
   unmounts. It never replays on a plain re-render (the trigger is the mutation,
   not render).

**Re-arming:** resetting the day (`resetWaterDay`) or removing entries until the
total drops back below the goal clears the flag for that day, so reaching the goal
again celebrates again. "Reset all data" clears the flag outright. The flag is
**not** part of water data and **not** in Backup & Restore.

## Surfaces now using the shared status

| Surface | Component | Treatment |
| --- | --- | --- |
| Today "הרגלים יומיים" water card | `WaterCard` | Card wash + gauge + status line recolour; embedded compact banner for attention/caution |
| Nutrition "מעקב מים" card | `WaterCard` (same) | Same |
| Water detail hero | `WaterTracker` | Hero wash + gauge tint; full `WaterGoalBanner` below |
| Global | `WaterGoalCelebrationOverlay` | One-shot 100% celebration, any route |

Progress (`/progress`) keeps its neutral blue water **stat** cards — they are
historical/aggregate figures, not a live goal-progress widget, so a red stat there
would read as an error rather than a hydration status. Left intentionally unchanged.

## Colour / status rules

Derived from `lib/water-status.ts` (`getWaterStatus`), unchanged thresholds:

| Status | Range | Colour |
| --- | --- | --- |
| `under_goal` | `< 100%` | Blue (normal water) |
| `completed` | `100% – <105%` | Celebratory blue (water + glow) + global overlay on crossing |
| `soft_over` | `105% – <120%` | Calm blue/cyan |
| `attention` | `120% – <150%` | Amber / orange |
| `caution` | `≥ 150%` | Rose / red |

The gauge fill itself retints via `--water-from` / `--water-to` overrides (amber
for attention, rose for caution), so the water "becomes more reddish" as the user
exceeds the goal.

## Safety wording

Unchanged from the first pass and still deliberately non-medical. Copy is framed
against the user's **own configured goal**, never a universal health claim. We do
**not** say "מסוכן", "אסור לשתות", or "אתה בסכנה". Caution copy:
`חריגה משמעותית מיעד המים היומי` · `כדאי לעצור ולבדוק אם המשך שתייה באמת נחוץ.` ·
`האפליקציה אינה מהווה ייעוץ רפואי.` The celebration badge reads
`יעד המים הושלם`; the screen-reader announcement is `כל הכבוד, הגעת ליעד המים היומי`.

## Accessibility / performance

- Overlay is `pointer-events-none` + `aria-hidden`; a separate visually-hidden
  `role="status"` announces the moment to screen readers.
- All motion is CSS (no canvas/WebGL, no new packages). Under
  `prefers-reduced-motion` the overlay shows only a brief static blue glow (sweep,
  bubbles, drops and badge pop are disabled); inline banners keep `role="status"`.
- Mobile-first; verified at 390px (e2e) and designed to avoid horizontal overflow
  (overlay is `overflow-hidden`, decorative elements are absolutely positioned).

## What stayed unchanged

- Water localStorage keys/schema (`yfos:water-logs:v1`, `WaterLog`/`WaterEntry`,
  `Settings.waterGoalMl`/`waterPresets`) — untouched.
- Backup/Restore schema — untouched (the celebration flag is isolated bookkeeping,
  never exported/imported).
- Auth / beta access / guest mode / admin / Supabase — untouched.
- Nutrition / workout / supplement / gym schemas, AI routes, Privacy/Terms/AI
  disclaimer pages — untouched.
- `lib/water-status.ts` thresholds and the existing detail-screen banner behaviour.
- No new dependencies.

## Tests

`e2e/water-goal-states.spec.ts` (Playwright, mobile-390) now also covers:

- No overlay under goal.
- Crossing the goal from the **water page** triggers the overlay (and it
  self-dismisses).
- Crossing the goal from **Today/home** triggers the overlay.
- Today water card shows the amber **attention** copy/colour.
- Today water card shows the rose **caution** copy + the non-medical disclaimer,
  outside `/nutrition/water`.

## Manual QA notes (360px / light / dark)

- Verified copy/structure at 390px via e2e. For a device pass: open Today at 360px
  in both light and dark, log water across the cup presets to cross the goal, and
  confirm: the overlay plays once and clears on its own; the card turns
  amber at 120% and rose at 150%; the gauge fill follows; no horizontal scroll;
  taps pass through the overlay while it is on screen. With OS "reduce motion" on,
  confirm only a brief static glow appears (no sweep/bubbles).
