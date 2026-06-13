# Water Presets (Phase 3.26)

Personal, user-customizable quick-add shortcuts for water — cups and bottles in
real-life terms — layered on top of the existing [Water Tracking](WATER_TRACKING.md)
feature **without changing its data model**. localStorage-only; no backend, auth,
AI, or external APIs. Hebrew RTL, light + dark.

## What presets are

A water preset is a named quick-add button. Tapping it logs a normal `WaterEntry`
of its configured amount — exactly as the old fixed `+250 / +500 / +750` chips did.
Presets are pure UI sugar: they let the user think in "כוס" / "בקבוק" / "הבקבוק
שלי" instead of raw millilitres. The water log, totals, goal, history, day
separation and Progress are all unchanged.

```ts
type WaterPresetIcon = "cup" | "bottle" | "sport-bottle" | "large-bottle" | "drop";

interface WaterPreset {
  id: string;
  label: string;       // "כוס", "בקבוק", …
  amountMl: number;    // 1 … MAX_WATER_PRESET_ML (3000)
  icon: WaterPresetIcon;
  isDefault?: boolean; // true for the seeded set; informational only
}
```

## Default presets

| Label | Amount | Icon |
| --- | --- | --- |
| כוס | 250 ml | cup |
| בקבוק | 500 ml | bottle |
| הבקבוק שלי | 750 ml | sport-bottle |
| בקבוק גדול | 1500 ml | large-bottle |

Defined in `DEFAULT_WATER_PRESETS` (`lib/fitness-types.ts`).

## Where they are stored

Presets are a **user preference**, so they live inside the existing settings
object as `Settings.waterPresets` — **no new storage key was added**. The water
goal already lives there (`waterGoalMl`), so presets sit naturally alongside it.

- `storage.getWaterPresets()` returns `settings.waterPresets`, falling back to
  `DEFAULT_WATER_PRESETS` when absent or empty.
- `storage.saveWaterPresets(presets)` writes them back onto settings.
- `analytics.resolveWaterPresets(settings)` is the pure resolver components use
  with `useSettings()` (SSR-safe, no storage read in render).
- Store mutations: `saveWaterPresets(presets)` and `resetWaterPresets()`
  (`lib/fitness-store.ts`).

### Safe defaults for existing users

Because the field is optional and the resolver falls back to defaults, **existing
users (whose settings predate this field) automatically get the four defaults**.
A customized set is **never silently overwritten** — defaults only apply when no
presets are stored.

## How presets interact with `WaterLog` entries

Tapping a preset calls `logWater(today, preset.amountMl)`, which appends a normal
`WaterEntry`. The preset id is **not** stored on the entry (out of scope this
phase), so:

- `totalMl` is still recomputed from `entries` and can never drift.
- All historical water logs remain valid and backward-compatible.
- Editing or deleting a preset never touches any logged entry — past and future
  entries are independent of the preset that created them.

## Where presets appear

| Surface | What's shown | Component |
| --- | --- | --- |
| **Today** (`/`) + **Nutrition** (`/nutrition`) | The **3 leading** presets only (כוס, בקבוק, הבקבוק שלי) — kept compact | `components/water/WaterCard.tsx` → `WaterPresetChips` |
| **Water detail** (`/nutrition/water`) | The **full** preset set (incl. בקבוק גדול) + custom amount + "עריכת קיצורים" | `components/water/WaterTracker.tsx` |
| **Edit presets** (`/nutrition/water/presets`) | Premium editor: label, amount (ml), icon, save, reset | `components/water/WaterPresetsEditor.tsx` |
| **Settings** (`/settings`) | "ערוך קיצורי מים" shortcut into the editor (inside the water-goal card) | `components/settings/SettingsView.tsx` |

`TODAY_WATER_PRESET_COUNT` (= 3) in `lib/analytics.ts` controls how many the
compact card surfaces.

## Editing

The editor (`/nutrition/water/presets`) edits a local draft of the presets and
persists on **save**:

- **Label** — free text, ≤ 20 chars, must be non-empty.
- **Amount** — millilitres, validated to `1 … 3000` (`MIN/MAX_WATER_PRESET_ML`);
  invalid amounts block save and show an inline hint.
- **Icon** — one of five SVG icons (`WATER_PRESET_ICON_OPTIONS`).
- **שמור קיצורים** — validates, writes settings, returns to the water screen.

## Reset to defaults

"איפוס לברירת מחדל" (confirm-gated) calls `resetWaterPresets()`, which writes
`DEFAULT_WATER_PRESETS` back onto settings and refreshes the draft. Because
presets live in settings, the global **Settings → reset all data** (`resetAll`)
also drops them — and the resolver falls straight back to the defaults, so the
app is always in a valid state.

## UI / UX decisions

- **SVG icons, not emoji** — `CupIcon`, `BottleIcon`, `SportBottleIcon`,
  `LargeBottleIcon`, `DropletIcon` in the existing stroke-based icon system, so
  presets match the rest of the app and theme cleanly in light + dark.
- **Calm water accent** reused (`--accent-water` / `--accent-water-soft`); chips
  get generous touch targets and an active-press scale for native feel.
- **Today stays compact** — 3 chips in a 3-column grid; the full screen uses a
  2-column grid so four chips never overflow at 360 px.
- A single shared `WaterPresetChips` renders presets everywhere, avoiding drift.

## Intentionally deferred (future work)

- **Reorder presets** — the editor keeps a fixed order; drag-to-reorder is future
  work (low value vs. risk this phase).
- **Add / remove presets** — this phase edits the existing set in place; the data
  model already supports arbitrary lists, so add/remove is a natural next step.
- **Per-bottle completion count** (e.g. "2 of 3 bottles done today").
- **Reusable hydration containers** shared with a future "Life OS".
- **Reminders / notifications** to drink.
- Storing the originating preset id on each `WaterEntry` (not needed now).

## QA

`scripts/qa-water-presets.mjs` (Playwright, mobile viewport, dark + light) covers:
default presets appear, a preset tap logs a `WaterEntry` with the configured
amount, the compact Today set (3) vs. the full screen set (4 + custom + edit
link), editing a preset amount changing future entries, reset-to-defaults
restoring the originals, no horizontal overflow, and no console errors. Run with a
server on `:3326` (`npx next start -p 3326`).

Regression suites confirmed green after this phase: `scripts/qa-water.mjs`,
`qa/today-dashboard-check.mjs`, `qa/console-check.mjs`, `qa/check360.mjs`,
`qa/welcome-check.mjs`, `qa/private-access-check.mjs`,
`scripts/qa-nutrition-smoke.mjs`, `scripts/qa-supplements.mjs`,
`scripts/qa-exercise-videos.mjs`.
