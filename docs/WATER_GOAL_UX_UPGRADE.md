# Water Goal Completion & Over-Goal UX (Phase 3.xx)

A UX-polish upgrade to the water tracker: a rewarding completion state at 100% of
the daily goal, and a calm, **graduated** over-goal treatment beyond it. This is
**presentation only** — no medical logic, no new storage, no schema change.

## What changed

- **New pure helper `lib/water-status.ts`** — derives a `WaterStatusInfo`
  (`status`, `ratio`, `percent`, `remainingMl`, `overMl`, `reached`) from today's
  intake and the configured goal. No storage, no React (mirrors `lib/today.ts` /
  `lib/progress-insights.ts`), so it is trivially testable and SSR-safe.
- **Centralized copy in `components/water/water-copy.ts`** — `waterStatusCopy()`
  maps each status to deliberately non-medical Hebrew wording + a visual `tone`.
  The compact `waterStatusLine()` now mirrors the same graduated states so the
  Today / Nutrition cards agree with the detail screen.
- **New banner `components/water/WaterGoalBanner.tsx`** — a calm, inline (never
  modal) banner shown on the water detail screen (`/nutrition/water`) once the
  goal is reached. Returns `null` below the goal, so normal tracking is untouched,
  and it renders **above** the add-water controls without hiding them.
- **CSS treatments in `app/globals.css`** — a gentle `water-shimmer` light sweep
  and small drifting `water-bubble`s for the celebration state. Both are CSS-light
  and **disabled under `prefers-reduced-motion`** (alongside the existing
  `water-wave` rules).
- The detail-screen hero subtitle now reflects the graduated state instead of a
  blanket "🎉 goal reached", so it can never contradict the banner (e.g. at 150%).

## Status thresholds

Derived from `ratio = totalMl / goalMl`. Centralized in `WATER_THRESHOLDS`.

| Status | Range (of goal) | Treatment |
| --- | --- | --- |
| `under_goal` | `< 100%` | No banner — normal tracker |
| `completed` | `100% – <105%` | Celebration (soft blue gradient, glow, shimmer, bubbles) |
| `soft_over` | `105% – <120%` | Calm, positive (water tint) |
| `attention` | `120% – <150%` | Amber/orange attention — calm, not red |
| `caution` | `≥ 150%` | Rose caution — careful, explicitly non-medical |

The completion band has real width (100–105%, the `softOver` threshold) so logging
one more sip right after reaching the goal does not instantly wipe the celebration.
A non-positive / unset goal can never produce an over-goal state (always reads as
`under_goal`); negative intake is clamped to 0.

## Hebrew copy

| Status | Title | Supporting lines |
| --- | --- | --- |
| `completed` | `כל הכבוד! הגעת ליעד המים היומי שלך` | `100% הושלם` |
| `soft_over` | `עברת מעט את יעד המים היומי שהגדרת` | `שתייה לאורך היום זה דבר טוב — פשוט להמשיך להקשיב לגוף.` |
| `attention` | `שתית יותר מהיעד שהגדרת להיום` | `שים לב לא לשתות מעבר לצורך.` |
| `caution` | `חריגה משמעותית מיעד המים היומי` | `כדאי לעצור ולבדוק אם המשך שתייה באמת נחוץ.` · `האפליקציה אינה מהווה ייעוץ רפואי.` |

Each banner also shows `{percent}% מהיעד שהגדרת`.

## Safety wording decision

This is a **UX feature, not a medical feature**. The wording is framed entirely
against the **user's own configured goal** ("more than the goal you set for
today"), never as a universal health claim. We deliberately **do not** say
"זה מסוכן לגוף", "אסור לשתות יותר", or "אתה בסכנה", and we never claim a specific
amount of water is dangerous for everyone. The strongest state (`caution`) adds an
explicit `האפליקציה אינה מהווה ייעוץ רפואי.` line and uses rose — noticeable but
not frightening. This keeps the feature within the app's product boundaries
(`docs/PROJECT_STATE.md` §8: no medical advice).

## UI / accessibility

- Hebrew, RTL, mobile-first; verified readable at 360px and 390px.
- Reuses the existing design language (`module-water`, `sheen`, `water-gradient`,
  `shadow-glow-water`, accent tokens) plus Tailwind amber/rose for the over-goal
  tones (with dark-mode variants).
- The banner is `role="status"` / `aria-live="polite"` and carries a
  `data-water-status` hook for QA.
- Animations are CSS-light and fully respect `prefers-reduced-motion`.

## What stayed unchanged

- **No water localStorage keys / schema change** (`yfos:water-logs:v1`,
  `WaterLog`/`WaterEntry`, `Settings.waterGoalMl`/`waterPresets` untouched).
- **Backup/Restore** schema unchanged.
- **Auth, beta access, guest mode, admin, Supabase** behavior unchanged.
- **Nutrition / workout / supplement / gym** schemas, AI routes, and
  Privacy/Terms pages untouched.
- The add-water controls (presets, custom amount), entries list, and reset flow
  are unchanged and never hidden by the banner.

## Tests

- `e2e/water-goal-states.spec.ts` (Playwright, mobile-390): seeds a 2000ml goal +
  today's log and asserts the copy/tone for under-goal (no banner), exactly 100%,
  110% soft-over, 125% attention, and 150% caution states, and that the add-water
  controls remain visible.
- Validation: `npm run lint` (clean), `npm run build` (clean), `npm run test:e2e`
  (20 passed).
