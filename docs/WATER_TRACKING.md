# Water Tracking (Phase 3.20)

A premium, mobile-first daily hydration tracker. localStorage-only — no backend,
auth, database, sync, AI, or external APIs. Hebrew RTL, light + dark.

## What was added

- **Daily water logging** by date: quick-add presets, custom amount, per-entry
  delete, and a confirm-gated "reset today".
- **A premium hydration gauge** (`WaterGauge`) — a circular vessel that fills from
  the bottom with a living, drifting water surface. Reused at multiple sizes.
- **An editable daily goal** in Settings (in litres; stored as millilitres).
- **Integration points** on Today, Nutrition, and Progress.

## Where water appears

| Surface | What's shown | Component |
| --- | --- | --- |
| **Today** (`/`) | "הידרציה" section with the compact card (gauge + litres-of-goal + status + quick-add + "פתח") | `components/water/WaterCard.tsx` |
| **Nutrition** (`/nutrition`) | "מעקב מים" compact card (same component, different title) | `components/water/WaterCard.tsx` |
| **Water detail** (`/nutrition/water`) | Full screen: hero gauge, preset quick-add, custom amount, "עריכת קיצורים", today's entries, delete, reset, empty/success states | `components/water/WaterTracker.tsx` |
| **Water presets** (`/nutrition/water/presets`) | Edit personal cup/bottle presets (Phase 3.26) | `components/water/WaterPresetsEditor.tsx`, [`WATER_PRESETS.md`](WATER_PRESETS.md) |
| **Settings** (`/settings`) | "יעד מים יומי" — edit the daily goal in litres, plus a "ערוך קיצורי מים" shortcut | `components/settings/SettingsView.tsx` |
| **Progress** (`/progress`) | "מים היום" + "ממוצע מים השבוע" stat cards | `components/progress/ProgressView.tsx` |

## Storage keys

- `yfos:water-logs:v1` — array of `WaterLog`, one per day with entries.
- `waterGoalMl` — a field on the existing `yfos:settings` object (default `2500`).
- `waterPresets` — personal quick-add presets, also a field on `yfos:settings`
  (Phase 3.26; falls back to defaults when absent). See
  [`WATER_PRESETS.md`](WATER_PRESETS.md).

No new top-level settings key was introduced; the goal lives in the existing
`Settings` model. The water-logs key is included in `STORAGE_KEYS`, so the
existing "reset all data" maintenance path clears it automatically.

## Data model

```ts
type WaterEntry = {
  id: string;
  amountMl: number;
  createdAt: string; // full ISO timestamp
};

type WaterLog = {
  date: string;   // YYYY-MM-DD (local)
  totalMl: number;
  entries: WaterEntry[];
};
```

`totalMl` is **always recomputed from `entries`** on every mutation
(`recomputeTotal` in `lib/storage.ts`), so it can never drift out of sync.

## How daily tracking works

- All reads/writes go through `lib/storage.ts` → exposed reactively via
  `lib/fitness-store.ts` (`useWaterLogs`, `logWater`, `removeWaterEntry`,
  `resetWaterDay`) using the same `useSyncExternalStore` pattern as the rest of
  the app. SSR-safe; cross-tab updates handled via the `storage` event.
- **Today** derives from today's local ISO date only (`todaysWaterMl`). A refresh
  keeps today's entries; tomorrow starts fresh automatically (a new date key).
- **Previous days are never auto-deleted** — they stay stored for future history.
  "Reset today" only removes the current day's record; past days are untouched.
- Adding a drink appends a `WaterEntry`; deleting the last entry of a day removes
  the whole day record.

## How the goal works

- Default `2500` ml (`DEFAULT_WATER_GOAL_ML`). A neutral starting point, **not a
  medical recommendation** — no body-weight formula, no health claims.
- Edited in Settings in **litres** (step 0.1) and stored as **millilitres**
  (`Math.round(liters * 1000)`). The card and detail screen read it live.
- Copy is deliberately neutral: "אפשר לעדכן את היעד לפי ההרגשה והשגרה שלך."

## Quick-add, delete, reset

- **Quick-add** is driven by personal **water presets** (Phase 3.26) — cups and
  bottles the user can rename/resize. The shared `WaterPresetChips` renders them
  on the Today/Nutrition card (3 leading presets) and the detail screen (full
  set). See [`WATER_PRESETS.md`](WATER_PRESETS.md). The legacy fixed
  `WATER_QUICK_ADD_ML = [250, 500, 750]` constant is retained for reference but is
  no longer the source of the chips.
- **Custom amount** (detail screen only): a numeric ml input + add button.
- **Delete** removes a single entry (trash icon per row).
- **Reset today** is confirm-gated and only offered when entries exist; it clears
  the day and never touches other days.

## Visual progress treatment

`WaterGauge` is a self-contained SVG: a circle clip, a vertical fill gradient
(`--water-from` → `--water-to`), and two stacked wave paths (front + slower back
layer) translated to the current water level with a smooth 800 ms rise. The wave
drifts sideways via the `water-wave` CSS keyframe (period-aligned for a seamless
loop), and the centre shows the percentage plus a droplet that swaps to a check
at goal. Motion is disabled under `prefers-reduced-motion`. Unique gradient/clip
ids come from React `useId`, so multiple gauges render safely on one screen.

Colour: a calm cyan-blue water palette (`--accent-water`, `--gradient-water`,
`--shadow-water`) added alongside the existing feature accents — adjacent to the
teal brand so it reads as part of the family, not a flat generic blue block.
Unlike the other feature accents (which alias to emerald in dark mode), water
keeps a true brighter blue in dark mode so "water reads as water".

## UI / UX decisions

- One reusable gauge across all sizes keeps the visual language consistent.
- The same compact `WaterCard` serves Today and Nutrition (title prop only),
  avoiding divergence and keeping Nutrition uncompacted.
- Status copy is centralized (`water-copy.ts`) and calm/motivating, never
  childish or medical.
- Quick-add chips use generous touch targets; the custom-add button uses the
  water gradient for a clear primary affordance.

## Intentionally deferred (future work)

- Hydration **history** view (per-day list / calendar).
- **Reminders / notifications** to drink.
- **Weekly water insights** beyond the simple Progress average.
- Deeper **Today dashboard** integration (e.g. combined daily ring).
- Goal suggestions from body weight / activity (explicitly out of scope this
  phase — no medical logic).

## QA

`scripts/qa-water.mjs` (Playwright, mobile viewport, dark + light) covers: Today
card render + quick-add + total update, Nutrition card + persistence, detail
screen header/helper/entry/gauge %, quick-add, custom amount, delete, reload
persistence, reset + reset-persistence, per-day separation, Settings goal update
reflecting on the detail screen, no horizontal overflow, and no console errors.
Run with a server on `:3320` (`npx next start -p 3320`).

Regression suites confirmed green: `qa/welcome-check.mjs`, `qa/console-check.mjs`,
`scripts/qa-nutrition-smoke.mjs`, `scripts/qa-favorites.mjs`,
`scripts/qa-saved-values.mjs`.
