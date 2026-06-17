# Today Dashboard Upgrade (Phase 3.23)

> 📁 **Archived — historical record.** This is the original "command center"
> concept for the Today screen (Phase 3.23). It has been superseded by
> [`TODAY_COMMAND_CENTER_POLISH.md`](../TODAY_COMMAND_CENTER_POLISH.md),
> [`TODAY_CLARITY_PASS.md`](../TODAY_CLARITY_PASS.md), and the current Today state
> in [`PROJECT_STATE.md`](../PROJECT_STATE.md). Kept for history; do not treat as
> current requirements without checking `PROJECT_STATE.md`.

Turns the **Today** screen from a stack of feature cards into a unified daily
command center for Yuval Fit OS — a premium, mobile-first wellness dashboard that
answers four questions at a glance:

- **What is my status today?** → hero daily summary + status strip
- **What should I do next?** → quick actions
- **What have I already completed?** → habit ring, status strip, completion states
- **Where do I need to take action?** → empty/partial states, next-action CTAs

This is a **dashboard / UI-UX / integration** phase. No new domains, no new
storage, no backend/auth/AI/native/video/charts. It reuses the existing modules
(workouts, nutrition, water, supplements, learn, progress) and existing store
values only — nothing is invented or inferred.

## Dashboard structure

The new `components/today/TodayView.tsx` renders, top to bottom:

1. **Greeting** — Hebrew date + time-based greeting (`בוקר טוב`, `יובל`).
2. **Hero — daily status summary** (`סטטוס יומי`)
   - A brand `ProgressRing` showing **habits in motion** (e.g. `2/4`).
   - Headline `X מתוך 4 הרגלים בתנועה` + a calm motivational line.
   - A four-segment bar, each segment tinted with its module accent when active.
   - A soft completion glow (`animate-glow-pulse`) when all four are in motion.
3. **Daily status strip** (`מבט מהיר`) — a 2×2 grid of compact, tappable status
   cells for the four daily habits, each with a tinted icon, label, current
   value, and a small ✓ badge when active.
4. **Quick actions** (`פעולות מהירות`) — four gradient action tiles:
   `התחל אימון`, `הוסף אוכל`, `הוסף מים`, `סמן תוספים`.
5. **Daily habits** (`הרגלים יומיים`) — the existing premium `WaterCard` and
   `SupplementsCard`, unchanged in behavior.
6. **Daily summary** (`סיכום היום`) — a nutrition summary card (protein ring +
   calories + log count + add/favorites CTAs) and a workout card (today / last /
   first-time states with a start-or-open CTA).
7. **Secondary** (`עוד`) — a 2-column row linking to `מרכז ידע` (Learn) and
   `התקדמות` (Progress).

## What data each status uses

All derivations come from existing pure helpers in `lib/analytics.ts` over
existing localStorage-backed store hooks. A habit counts as **"in motion"** when
it has any activity logged **today**:

| Module      | Source hook            | Derivation                              | "In motion" when |
|-------------|------------------------|-----------------------------------------|------------------|
| אימון       | `useWorkouts`          | `todaysWorkout(workouts)`               | a workout is logged today |
| תזונה       | `useFoodLogs`          | `todaysFoodLogs` → count + `sumNutrition` | ≥1 food log today |
| מים         | `useWaterLogs`         | `todaysWaterMl` vs `settings.waterGoalMl` | any ml logged today |
| תוספים      | `useSupplements` + `useSupplementLogs` | `supplementDaySummary(...)`  | ≥1 supplement marked taken today |

The hero ratio is simply how many of the four are in motion. Protein/calorie
figures and goals come from `settings` (no defaults invented for display).

## Quick actions added/changed

| Tile         | Route                          | Tint        |
|--------------|--------------------------------|-------------|
| התחל אימון   | `/workouts?new=1`              | strength    |
| הוסף אוכל    | `/nutrition/add`               | nutrition   |
| הוסף מים     | `/nutrition/water`             | water       |
| סמן תוספים   | `/nutrition/supplements`       | supplement  |

Previously Today had three actions (workout / nutrition / exercises). Exercises
remains reachable from the bottom nav; the quick-action set now mirrors the four
daily habits so the next action is always obvious. The status-strip cells and
card "פתח" links provide the deeper navigation into each module.

## UI/UX decisions

- **One status bar, many modules.** The hero ring is the at-a-glance signal; the
  status strip is the compact detail; the cards are the interactive surfaces —
  mirroring Apple-Fitness-style "rings + detail cards" rather than a flat list.
- **Module identity through tint, not noise.** Added lightweight `.module-*`
  background-tint primitives so light mode reads as distinct modules (strength
  blue, nutrition green, water cyan, supplement violet, learn indigo, energy
  amber) instead of a stack of identical white cards. In dark mode every feature
  accent aliases to the single emerald brand identity (existing convention).
- **Strong SVG icons, no emoji as primary UI.** Reused the existing stroke-icon
  set (`DumbbellIcon`, `AppleIcon`, `DropletIcon`, `PillIcon`, `FlameIcon`,
  `PlayIcon`, `PlusWaterIcon`, `ChartIcon`, `BookOpenIcon`). Emoji appear only as
  light accents in motivational copy.
- **Reused primitives.** `.sheen` glass edge, feature gradients
  (`strength/nutrition/water/supplement/learn/energy-gradient`), `shadow-glow-*`,
  `ProgressRing`, `Card`, `SectionHeader`, and the `.tap` press feedback.
- **Micro-interactions** are subtle and respect `prefers-reduced-motion`: `.tap`
  pressed scale, ring stroke transitions, the segment-bar color transition, and a
  one-shot completion glow. No new animation dependencies.
- **Empty states stay premium.** With no data the hero shows `0/4` with a
  guiding line (`היום מתחיל — בחר פעולה אחת כדי להתחיל`), the strip shows calm
  placeholders, the supplements card keeps its delightful empty composition, and
  the workout card invites a first session.

## Visual primitives added / reused

- **Added** (additive, in `app/globals.css`): `.module-strength`,
  `.module-nutrition`, `.module-learn`, `.module-energy` tint classes (matching
  the existing `.module-water` / `.module-supplement`).
- **Reused**: everything else — no component primitives were modified.

## What was intentionally NOT added

- No backend, auth, database, or cloud sync.
- No AI, recommendations, or "smart" suggestions.
- No external APIs, video hosting/player/iframe work.
- No charts or chart-heavy visuals.
- No food/exercise image imports; no changes to exercise ids/images/video links.
- No changes to nutrition/water/supplement **storage** logic or localStorage
  keys. All data-model usage is backward-compatible (read-only derivations).
- No new domains or features — strictly dashboard integration of existing ones.

## Safety boundaries (unchanged)

- **Fitness**: no injury/medical claims, no training prescriptions.
- **Supplements**: copy and boundaries are untouched — the card still never
  recommends, never doses, and keeps the neutral "למעקב אישי בלבד — לא המלצה
  רפואית" framing.
- **Nutrition**: only user-entered values are shown; no restrictive or
  body-image language; no intake is framed as mandatory.

## Validation

- `npm run lint` — 0 errors (2 pre-existing warnings in unrelated QA scripts).
- `npm run build` — succeeds; all routes present.
- `qa/today-dashboard-check.mjs` — captures empty/rich at 360 & 390 plus dark
  mode, asserts the hero ratio (4/4), water total, and supplement count, and
  fails on any console error or horizontal overflow. **Passes.**
- `qa/console-check.mjs` — 0 errors/warnings across all routes + theme toggle.
- Interactive smoke — water quick-add and supplement toggle still work directly
  from Today.

## Future direction

- A deeper **daily readiness score** beyond the binary "in motion" count.
- **Weekly insights** (calm summaries, not charts).
- Smarter **next-action** suggestions based on the day's gaps.
- User **customization / reordering** of Today modules.
