# Today — Command-Center Polish (Phase 3.xx)

A UI/UX **hierarchy + compactness** pass on the Today screen. After several
feature additions Today had begun to feel long and repetitive: the same five
actions (add water, add food, start workout, mark supplements, open a module)
appeared in the Next Action card, the quick-glance strip, the quick-actions row,
**and** in full module cards lower down. The page read as "the whole app stacked
on one screen" rather than a focused daily command center.

This pass removes the *duplicate CTAs* and sharpens the top-down hierarchy.
**No data models, storage keys, routes, schemas, or business logic changed.**
Everything here is presentation: which card renders, in what order, and how
compact it is. `lib/today.ts` (Next Action + completion) is untouched.

The "what is active right now?" slot is filled by the two real active-state
concepts the app has: a **live gym visit** (`GymTodayCard` /
`lib/gym-attendance.ts`) and the **in-progress active-workout draft**
(`lib/active-workout-draft.ts`).

## New layout order

Top (the strongest part — keep premium and clear):

1. **Greeting** — `היום שלך` (date + `בוקר/צהריים/ערב טוב, יובל`)
2. **Daily progress** — completion ring + `התקדמות היום` + segment bar
3. **Next Action** — the single primary CTA (`הפעולה הבאה שלך`)

Active right now (only renders when something is genuinely live):

4. **Live gym visit** — `GymTodayCard` is **promoted to this slot while a visit
   is in progress** (`אתה במכון עכשיו` + live timer + `סיים שהייה במכון`), so the
   one thing happening *now* is at the top. Idle, it stays in its lower section.
5. **Active workout** — `ActiveWorkoutResumeCard`: a compact `אימון בתהליך`
   strip shown **only** when a meaningful auto-saved workout draft exists. Links
   to `/workouts`, where the existing `DraftRestoreCard` owns continue/discard.
   Read-only.

Middle (compact, scannable):

6. **Quick glance** — `מבט מהיר`: the 2×2 status strip (workout / nutrition /
   water / supplements), each a compact status cell that links to its module.
7. **Quick actions** — `פעולות מהירות`: a compact row of four shortcut tiles
   (start workout / add food / add water / mark supplements). Tiles are smaller
   than before (36 px icon, tighter padding) so they read as shortcuts.

Lower (summaries + secondary):

8. **Gym attendance (idle)** — `נוכחות במכון`: the idle `GymTodayCard` (check-in
   + same-day status). Shown here **only when no visit is live** (when one is, it
   has been promoted to the active slot, so it never renders twice).
9. **Daily habits** — `הרגלים יומיים`: water + supplements cards, now
   **conditional** (see below). The whole section drops out when neither applies.
10. **Daily summary** — `סיכום היום`: compact nutrition + workout summary cards.
11. **More** — `עוד`: Learn (`מרכז ידע`) + Progress (`התקדמות`) links.

## How duplicate CTAs were reduced

The Next Action card is the one strong, primary CTA. The polish makes sure the
page never repeats that same action as a second *giant* card right below it:

| Source of duplication | Before | After |
|---|---|---|
| **Water** | Next Action `הוסף מים` **and** a full `WaterCard` (gauge + preset quick-add) | Full `WaterCard` is **hidden while water is the current Next Action** (`showWaterCard = nextAction.key !== "water"`). Water status stays visible in the quick-glance strip. Once water is logged (no longer the next action) the compact card returns. |
| **Supplements** | A large supplements card with a dominating empty state even when none configured | `SupplementsCard` mounts **only when supplements are configured** (`showSupplementsCard = hasSupplements`). Unconfigured users see the calm `אופציונלי` status in the strip instead of a big empty card. |
| **Nutrition** | Nutrition summary card had its own `הוסף אוכל` + `מועדפים` CTA grid, duplicating the quick action / Next Action | The duplicate CTA grid was removed; the card is now an informational status (protein ring, calories, meal count) with a single quiet `פתח` link. |
| **Quick actions** | Four tall tiles taking significant vertical space | Compacted into a tighter four-up shortcut row. |

Net effect for a **fresh/new user** (water is the next action, no supplements
configured): the entire `הרגלים יומיים` section disappears and Today becomes
markedly shorter — greeting → progress → one clear Next Action → compact status
→ compact shortcuts → compact summary → links.

## Active gym / active state priority

- **Live gym visit takes top priority.** TodayView reads `useActiveGymVisit()`
  (placement only — no gym logic touched). While a visit is open, `GymTodayCard`
  renders in the active-state slot **directly under Next Action** (its strong
  `אתה במכון עכשיו` live-timer state), and the lower `נוכחות במכון` section is
  suppressed so the card never appears twice. When no visit is live, the gym card
  renders only in its lower idle section (check-in + same-day status), which is
  already compact.
- **In-progress workout draft** is the second active-state signal:
  `ActiveWorkoutResumeCard` shows `אימון בתהליך`, the draft title, and an
  exercise/set count, and links to `/workouts`. It renders **nothing** when there
  is no meaningful draft, so it never nags an empty/untouched builder. Strictly
  read-only — it observes the draft reactively (SSR-safe) and changes no
  workout/draft logic.

## What stayed unchanged

- **`lib/today.ts`** — Next Action priority ladder and daily-completion logic are
  byte-for-byte unchanged. The new flags are derived in the view only.
- **All actions preserved** — add water, add food, start workout, mark
  supplements, enter the workout draft, open progress / learn, and navigate to
  every module are all still reachable (Next Action + quick actions + quick
  glance + the dedicated pages). The full water + supplements trackers still live
  on `/nutrition` and their dedicated screens, unchanged.
- **Gym check-in/out logic is untouched.** TodayView only reads
  `useActiveGymVisit()` to decide *where* `GymTodayCard` renders; the card owns
  all check-in / check-out / re-entry-guard behaviour exactly as before.
- **No storage keys, schemas, data models, routes, bottom nav, access gates, or
  save behaviour changed.** No backend, auth, AI, API, database, cloud sync,
  GPS, native/Capacitor, or new dependencies were added.
- Empty-state copy stays calm and supportive — no guilt, pressure, or medical /
  diet advice.

## Files

- **Added:** `components/today/ActiveWorkoutResumeCard.tsx`,
  `scripts/qa-today-command-center.mjs`, this doc.
- **Modified:** `components/today/TodayView.tsx` (reorder, active-state slot with
  gym-priority placement, conditional water/supplements cards, compact quick
  actions, trimmed nutrition CTA), `scripts/qa-water.mjs` (Today step updated for
  the new conditional water card), `docs/PROJECT_STATE.md`,
  `docs/DEVELOPER_GUIDE.md`.

## Mobile / themes

Excellent at 360 px and 390 px, light and dark, RTL Hebrew — no horizontal
overflow, bottom-nav clearance preserved, scroll-to-top button still clears
primary content.

## Validation

- `npm run lint` — 0 errors (1 pre-existing warning in `scripts/qa-settings.mjs`).
- `npm run build` — succeeds; all routes present.
- `scripts/qa-today-command-center.mjs` — fresh/short, water-next-action (no
  duplicate card), active-draft resume placement, **live-gym-visit promotion
  above the status strip (no duplicate idle section)**, engaged-user cards
  return, quick-action navigation; 360/390 × light/dark; no console errors, no
  overflow.
- Regression: `qa/today-dashboard-check.mjs`, `scripts/qa-water.mjs`,
  `scripts/qa-supplements.mjs`, `scripts/qa-nutrition-smoke.mjs`,
  `scripts/qa-navigation.mjs`, `scripts/qa-workout-draft.mjs`,
  `qa/console-check.mjs`, `qa/check360.mjs`, `qa/dark-mode-identity-check.mjs` —
  all pass.
