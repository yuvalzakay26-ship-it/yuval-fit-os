# Supplements Tracker (Phase 3.21)

A premium, safety-first daily supplements habit tracker. localStorage-only — no
backend, auth, database, sync, AI, or external APIs. Hebrew RTL, light + dark.

> **Boundary, restated everywhere:** this is a personal *tracking* tool. The app
> never recommends supplements, never suggests dosages, and carries no medical
> advice. It only records items the user already decided to track.

## What was added

- **Supplement catalogue + daily "taken" tracking** by date: add/edit/delete
  items, mark each as taken for today, undo, and archive (deactivate) items.
- **A premium habit-check toggle** (`SupplementCheck`) — a quiet outlined ring
  that becomes a glowing, gradient-filled disc with a check when taken.
- **A violet completion ring** reusing the shared `ProgressRing` (now accepting
  custom gradient colours + a unique gradient id).
- **Calm safety copy** on the full screen and the add/edit form.
- **Integration points** on Today, Nutrition, Settings, and Progress.

## Where supplements appear

| Surface | What's shown | Component |
| --- | --- | --- |
| **Today** (`/`) | "תוספים" section: compact card with completion ring, "X מתוך Y סומנו", first few items + toggles, or an add prompt when empty | `components/supplements/SupplementsCard.tsx` |
| **Nutrition** (`/nutrition`) | Same compact card under a "תוספים" section | `components/supplements/SupplementsCard.tsx` |
| **Supplements screen** (`/nutrition/supplements`) | Full screen: safety note, today's hero ring, active list with toggles + edit, archived list with reactivate, empty state | `components/supplements/SupplementsTracker.tsx` |
| **Add / edit** (`/nutrition/supplements/add`, `?id=` to edit) | Name, category, free-text dosage/note, timing, active toggle, delete | `components/supplements/SupplementForm.tsx` |
| **Settings** (`/settings`) | "נתוני תוספים" — confirm-gated "אפס תוספים" + "אפס יומן תוספים" (shown only when data exists) | `components/settings/SettingsView.tsx` |
| **Progress** (`/progress`) | "תוספים היום" + "ימים עם תיעוד השבוע" stat cards (shown only when supplements exist) | `components/progress/ProgressView.tsx` |

## Storage keys

- `yfos:supplements:v1` — array of `Supplement` (the catalogue, active + archived).
- `yfos:supplement-logs:v1` — array of `SupplementLog` (date-based taken marks).

Both keys are registered in `STORAGE_KEYS` (`lib/storage.ts`), so the global
"reset all data" maintenance path clears them automatically. No new settings key
was introduced.

## Data model

```ts
type SupplementCategory =
  | "vitamin" | "mineral" | "protein" | "performance"
  | "general-health" | "doctor-recommended" | "other";

type SupplementTiming =
  | "morning" | "noon" | "evening"
  | "pre-workout" | "post-workout" | "other";

type SupplementSchedule = {
  frequency: "daily" | "weekly" | "custom"; // currently always "daily"
  timesOfDay?: SupplementTiming[];           // display/grouping only
  notes?: string;
};

type Supplement = {
  id: string;
  name: string;
  category: SupplementCategory;
  dosageText?: string; // free text typed by the user — never generated
  schedule?: SupplementSchedule;
  isActive: boolean;   // archived items are inactive
  createdAt: string;
  updatedAt?: string;
};

type SupplementLog = {
  id: string;
  supplementId: string;
  date: string;   // YYYY-MM-DD (local)
  takenAt: string; // full ISO timestamp
};
```

Categories use neutral Hebrew labels (`ויטמינים`, `מינרלים`, `חלבון / תזונה`,
`ביצועים ואימון`, `בריאות כללית`, `בהמלצת איש מקצוע`, `אחר`) — no
natural/unnatural framing, no substance or drug-use language.

## How daily tracking works

- All reads/writes go through `lib/storage.ts` → exposed reactively via
  `lib/fitness-store.ts` (`useSupplements`, `useSupplementLogs`, `saveSupplement`,
  `removeSupplement`, `toggleSupplementTaken`) using the same
  `useSyncExternalStore` pattern as the rest of the app. SSR-safe; cross-tab
  updates handled via the `storage` event.
- **Date-based, one mark per (supplement, day).** "Taken today" derives from
  today's local ISO date only. Tomorrow starts fresh automatically (a new date),
  and a refresh keeps today's marks.
- **Previous days are never auto-deleted** — they stay stored for future history.
- **Add / edit**: `SupplementForm` builds a `Supplement` and `saveSupplement`s it
  (create or update by id), then returns to the tracker. Edit prefills once the
  store hydrates (ref-guarded effect, mirroring the saved-food-values pattern).
- **Mark / undo**: `toggleSupplementTaken(id, date)` adds a single log when
  unmarked and removes it when already marked — only for that day.
- **Archive**: turning off "פעיל" keeps the item (and its history) but removes it
  from the daily list; the tracker shows a "בארכיון" section with one-tap
  "הפעל מחדש".
- **Delete**: `removeSupplement` removes the item *and* its taken-logs so history
  stays consistent.

## How reset works

Two confirm-gated resets in Settings, surfaced only when data exists:

- **אפס תוספים** → `clearAllSupplements()` clears the catalogue key.
- **אפס יומן תוספים** → `clearAllSupplementLogs()` clears the taken-logs key.

The global "איפוס כל הנתונים" (reset all) also clears both keys via
`STORAGE_KEYS`.

## Premium UI/UX treatment

- **Dedicated violet accent** (`--accent-supplement` + gradient + soft + shadow)
  added to `globals.css` — the one hue not yet used by a feature area (strength
  blue, energy amber, nutrition green, learn indigo, water cyan). Following the
  established convention, it aliases to the emerald brand accent in dark mode so
  the dark theme keeps its single identity. No global tokens were changed.
- **Habit-check toggle** that reads instantly in both states and uses generous
  (44px / 36px) touch targets.
- **Completion ring** (`ProgressRing`) shown compactly on the cards and as a hero
  on the full screen. `ProgressRing` gained optional `from` / `to` / `gradientId`
  props (default to the brand colours) so multiple rings can render on one screen
  without SVG def-id collisions.
- **New SVG icons**: `PillIcon` (capsule), `ShieldIcon` (safety), and a
  fill-capable `CheckCircleIcon` — consistent with the existing stroke icon set,
  no emoji as primary visual language.
- Card-based lists, chips for category + timing, calm empty states, and refined
  light-mode colours (no flat gray blocks). No table-like UI, no plain checklist.

> **Phase 3.21.1 polish.** A presentation-only pass refined the Today card
> (premium empty-state composition with `CapsuleIcon` + shield badge, a calm
> progress bar, a completion check badge), the full-screen hero (violet glass +
> sheen, taken-item highlight), and the toggle's springy completion animation.
> See [`UI_POLISH_PHASE_3_21_1.md`](./UI_POLISH_PHASE_3_21_1.md). No logic, data
> model, storage keys, or safety boundaries changed.

## Safety copy / boundaries

Surfaced on the full screen and the add/edit form (centralized in
`components/supplements/supplement-copy.ts`):

- `המעקב הוא אישי בלבד ואינו מהווה המלצה רפואית.`
- `בתוספים או תרופות, כדאי להתייעץ עם הורה, רופא או איש מקצוע מתאים.`
- Next to the dosage field: `טקסט חופשי שאתה כותב — האפליקציה לא מציעה מינונים.`

Dosage is **free text only**. The app never generates or suggests dosage values,
never recommends what to take, and never frames substances as good/bad.

## Intentionally not done (this phase)

- No backend / auth / database / cloud sync.
- No AI, no external APIs, no medical recommendations, no dosage suggestions.
- No reminders / notifications.
- No native / Capacitor / APK work, no video.
- No charts-heavy work (the Progress stats are two simple counters).
- No `weekly` / `custom` schedule UI yet — the model supports it; the form
  currently always saves `frequency: "daily"`.

## Future direction

- Reminders / notifications to take items.
- Weekly adherence insights (streaks, per-item completion).
- A richer health dashboard and deeper Today-dashboard integration (e.g. a
  combined daily ring across water + supplements).
- Honoring `weekly` / `custom` schedules in the daily list.

## QA

`scripts/qa-supplements.mjs` (Playwright, mobile viewport, dark + light) covers:
Today card (empty + populated), full-screen header/helper/safety/empty, the
add flow (name + category + timing + dosage hint), mark-taken + undo, reload
persistence, edit (prefill + rename), archive + reactivate, per-day separation,
and the Settings resets — asserting no horizontal overflow and no console errors.
Run with a server on `:3321` (`npx next start -p 3321`).

Regression suites confirmed green (exit 0, 0 failures): `qa/welcome-check.mjs`,
`qa/console-check.mjs`, `scripts/qa-nutrition-smoke.mjs`,
`scripts/qa-favorites.mjs`, `scripts/qa-saved-values.mjs`, `scripts/qa-water.mjs`.
