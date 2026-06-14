# Progress Insights Upgrade

> Phase 3.xx — turns the Progress screen from a static stats grid into a premium
> weekly **insights** screen that tells a small story: what you did this week, how
> your consistency looks, what data is still missing, and what strengths are
> showing. Pure UI + derived insights over the **existing** local data — no schema,
> storage, route, backend, AI, or API changes.

## What changed on Progress

The screen (`components/progress/ProgressView.tsx`, route `/progress`) is now
ordered as:

1. **Weekly hero — `השבוע שלך`.** A premium raised card with a single calm,
   motivating insight line plus three compact metrics (אימונים השבוע · מים היום ·
   ממוצע חלבון). The headline is chosen by a deterministic priority so the screen
   always leads with the most useful nudge.
2. **Key stats — `נתונים עיקריים`.** The original four tiles (workouts this week,
   total workouts, daily-protein average, last workout) — now with **human empty
   states** instead of a cold `—` (see below).
3. **Weekly insights — `תובנות השבוע`.** Simple rule-based cards reflecting the
   data back (momentum, last workout, missing water/nutrition, records building).
4. **Weekly trends — `מגמות שבועיות`.** A compact 7-day (Sun→Sat) activity grid
   for אימונים / מים / תזונה. Each day is a small bar: filled = logged something,
   empty = nothing, dashed = still ahead this week. Today is outlined. CSS only,
   no chart library.
5. **Water + תוספים.** The existing water/supplement tiles, with a friendly empty
   state for the weekly-water average.
6. **Personal records — `שיאים אישיים`.** A stronger top-weights section: ranked
   rows with a trophy on #1, exercise name, muscle group + reps context, the kg
   value, and a relative-strength bar.

## Insights — what is rule-based (no AI)

Every insight is a deterministic reflection of existing data — never generated
advice, never medical, never body-shaming. From `lib/progress-insights.ts`:

| Rule | Card |
| --- | --- |
| `workoutsThisWeek > 0` | `יש לך התחלה טובה השבוע` (momentum copy scales with count) |
| `workoutsThisWeek === 0` | `עדיין לא התחלת אימון השבוע` |
| last workout exists | `האימון האחרון שלך` → its title |
| `waterToday === 0` | `עדיין לא נרשמו מים היום` |
| protein average missing / `<2` nutrition days this week | `צריך עוד נתוני תזונה` |
| any personal record exists | `יש לך שיאים שמתחילים להיבנות` |

The weekly-hero headline uses the same inputs with a priority order:
no workouts → one workout → not enough nutrition data → positive momentum.

## Data sources (all existing, read-only)

- `yfos:workouts` — workouts this/total, last workout, weekly activity, records.
- `yfos:foodLogs` — daily protein average, weekly nutrition activity.
- `yfos:water-logs:v1` — water today, weekly water average + activity.
- `yfos:supplements:v1` / `yfos:supplement-logs:v1` — the existing תוספים tiles.

All derivations live in **`lib/progress-insights.ts`** (pure, SSR-safe, no storage
access — data is passed in, same convention as `lib/analytics.ts` / `lib/today.ts`).
Exports: `weeklyHero`, `weeklyInsights`, `weeklyActivity`, `personalRecords`.

## What happens when data is missing

No lonely `—`. Empty states are short, human, and useful:

- **No data at all** → the full-screen friendly empty state (unchanged).
- **Protein average** missing → `אין מספיק נתונים` + hint
  `הוסף עוד יומיים של תזונה כדי לראות ממוצע`.
- **Weekly water average** missing → `אין מספיק נתוני מים השבוע` +
  `רשום שתייה לאורך השבוע כדי לראות מגמה`.
- **No last workout** → `עדיין אין אימונים` + `התחל אימון ראשון כדי לבנות רצף`.
- **No records** → `השיאים יופיעו כאן אחרי שתשמור אימונים עם ק״ג וחזרות.`
- **Weekly trends** days after today read as neutral "future", never as missed.

## What stayed unchanged

No changes to the workout/nutrition/water/supplement schemas, the localStorage
keys, routes, navigation, Today logic, or any save behavior. No backend, auth,
AI, API, database, cloud sync, or native/Capacitor work was added. This is a
UI/UX + derived-insights upgrade only.

## QA

`scripts/qa-progress-insights.mjs` (expects `next start -p 3331`). Covers three
data states — empty / one workout / a rich week — and asserts the weekly hero,
human empty states, insights/trends/records sections, the heaviest record value,
no horizontal overflow at 360/390, and no console errors in light + dark.
