# Today Quick Start & Priority Action (Phase 3.xx)

Turns the **Today** screen from "here are all your modules" into "here is your
day, and here is the next thing to do." It adds a deterministic **next-action**
card and an **optional-aware daily completion** summary on top of the existing
Today dashboard — no new domains, storage, routes, backend, AI, or
recommendations. Everything is derived read-only from existing local store data.

> This is **not** the Personal Path / Smart Setup feature. There are no goal
> questionnaires, generated plans, meal plans, diet/medical advice, or AI. It is
> a focused Today UX/product-clarity upgrade.

Today now answers, top to bottom:

1. **What is my status today?** → hero (`התקדמות היום`, the completion ring)
2. **What should I do next?** → the `הפעולה הבאה שלך` card
3. **Where do I start as a new user?** → the next-action card always points at
   the first sensible step (water)
4. **What have I already completed?** → completion ring + status strip + cards
5. **What is optional vs important?** → supplements read as `אופציונלי`

## Priority-action logic

All logic lives in **`lib/today.ts`** — pure, SSR-safe, no storage access
(callers pass store data in, same convention as `lib/analytics.ts`). The single
entry point is `dailyOverview(input)`, returning `{ completion, nextAction }`.

`nextAction` is chosen by a simple, deterministic priority ladder over what is
logged **today** — no rules engine, no personalization:

| # | Condition | Action (`title`) | CTA | Module |
|---|-----------|------------------|-----|--------|
| 1 | No water logged today | `שתה כוס מים ראשונה` | `הוסף מים` → `/nutrition/water` | water |
| 2 | No food logged today | `הוסף אוכל ראשון` | `הוסף אוכל` → `/nutrition/add` | nutrition |
| 3 | No workout logged today | `התחל אימון ראשון` | `התחל אימון` → `/workouts?new=1` | strength |
| 4 | Supplements **configured** but not all marked | `סמן את התוספים של היום` *(optional)* | `סמן תוספים` → `/nutrition/supplements` | supplement |
| 5 | Otherwise (day mostly complete) | `בדוק את ההתקדמות שלך` | `פתח התקדמות` → `/progress` | energy |

Supplements are intentionally **step 4, and only when configured** — they are
never the main action for a fresh/new user, and never block the day.

The `NextAction` object the card renders:

```ts
interface NextAction {
  key: "water" | "nutrition" | "workout" | "supplement" | "progress";
  title: string;        // headline
  description: string;  // calm one-liner
  href: string;         // where the primary CTA navigates
  ctaLabel: string;     // strong button text
  tone: "water" | "nutrition" | "strength" | "supplement" | "energy";
  optional: boolean;    // true → shows an "אופציונלי" badge
}
```

The card (`NextActionCard` in `TodayView.tsx`) renders a single, visually strong
CTA so there is always exactly one obvious primary action near the top of Today.

## Daily completion summary

`dailyOverview` also returns a `DailyCompletion`:

```ts
interface DailyCompletion {
  completed: number;       // required pillars done today
  total: number;           // 3, or 4 when supplements are configured
  allDone: boolean;
  fresh: boolean;          // nothing logged yet
  pillars: PillarStatus[]; // all four, in display order
}
```

A pillar counts as **done** when it has activity logged today:

| Pillar | Done when | Required? |
|--------|-----------|-----------|
| מים | any ml logged today | always |
| תזונה | ≥1 food log today | always |
| אימון | a workout logged today | always |
| תוספים | **all** configured supplements marked taken | **only when ≥1 is configured** |

The hero ring and headline read from `completed / total` (`X מתוך Y פעולות
הושלמו`). The segment bar renders one segment **per required pillar**, so an
unconfigured supplement never appears as a missing/grey segment.

## Optional supplements behaviour

Supplements are treated as optional throughout so the day never feels incomplete
because of them:

- **Completion total** excludes supplements unless the user has configured at
  least one (`total` is `3` for a new user, `4` once supplements exist).
- **Status strip** shows the supplements cell value as `אופציונלי` (not `—` /
  "missing") when nothing is configured.
- **Supplements card** empty state carries an `אופציונלי` badge and the copy
  `תוספים הם אופציונליים — אפשר להגדיר רק אם זה רלוונטי לך.`
- The next-action card only suggests supplements after the three core habits are
  in motion, and tags the suggestion `optional: true`.

No recommendations, no dosages, no medical advice — the existing supplement
safety boundaries (`docs/SUPPLEMENTS_TRACKER.md`) are untouched.

## Empty-state improvements

To reduce the "you have done nothing" feeling for a new/empty user:

- The **next-action card** takes responsibility for guidance, so the lower cards
  no longer have to each shout an empty state.
- **Supplements feel optional**, not mandatory (above).
- The hero frames progress as `0 מתוך 3 פעולות הושלמו` with a calm headline
  (`היום מתחיל — בחר פעולה אחת כדי להתחיל`) rather than four separate "nothing
  yet" signals.

The existing module cards (water, supplements, nutrition, workout, learn,
progress) and all their actions are unchanged in behaviour.

## What stayed unchanged

- No storage keys, data models, routes, or store logic changed.
- No nutrition / water / workout / supplement / progress logic changed.
- No access gates, welcome/onboarding, bottom nav, System Hub, or settings
  changed.
- No backend, auth, AI, external APIs, database, native/Capacitor work, new
  heavy dependencies, or personal-plan/recommendation logic was added.

## Validation

- `npm run lint` — 0 errors (1 pre-existing warning in `scripts/qa-settings.mjs`).
- `npm run build` — succeeds; all routes present.
- `qa/today-dashboard-check.mjs` — asserts the empty (`0 מתוך 3`, water next
  action, supplements optional) and rich (`3 מתוך 4`, supplement next action)
  states, water/supplement totals, no console errors, no overflow at 360/390,
  plus dark. **Passes.**
- `qa/console-check.mjs`, `qa/check360.mjs`, `qa/dark-mode-identity-check.mjs`,
  `scripts/qa-navigation.mjs`, `scripts/qa-supplements.mjs`,
  `scripts/qa-water.mjs`, `scripts/qa-nutrition-smoke.mjs` — all pass.
