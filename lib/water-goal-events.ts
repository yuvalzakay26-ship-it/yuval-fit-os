"use client";

// Lightweight event seam for the app-wide water-goal celebration. The water
// add/update flow lives in one place (`logWater` in lib/fitness-store.ts), so we
// detect the "crossed into the daily goal" transition there and broadcast a
// single custom event. Any surface that adds water (the detail screen, Today,
// quick-add cards) goes through `logWater`, so the celebration fires no matter
// where the drink was logged — without each button duplicating the logic.
//
// This is a UX-only seam. It does NOT touch the water data schema or the backup
// schema. The only persisted state is a tiny, isolated bookkeeping flag
// (`yfos:water-goal-celebration-seen:v1`) that prevents the celebration from
// replaying for a day it already played for. It is intentionally outside
// STORAGE_KEYS and is never exported/imported by Backup & Restore.

/** Custom event dispatched on `window` when the daily water goal is crossed. */
export const WATER_GOAL_REACHED_EVENT = "yfos:water-goal-reached";

/** Isolated anti-spam flag — stores the last date the celebration played. */
const CELEBRATION_SEEN_KEY = "yfos:water-goal-celebration-seen:v1";

export interface WaterGoalReachedDetail {
  /** Local ISO date (YYYY-MM-DD) the goal was reached for. */
  date: string;
  totalMl: number;
  goalMl: number;
  /** Rounded percentage of the goal at the moment it was crossed. */
  percent: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function celebrationSeenDate(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(CELEBRATION_SEEN_KEY);
  } catch {
    return null;
  }
}

function markCelebrationSeen(date: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CELEBRATION_SEEN_KEY, date);
  } catch {
    /* ignore — best-effort bookkeeping only */
  }
}

/**
 * Re-arm the celebration for `date` when intake drops back below the goal (reset
 * day / removed entries), so reaching the goal again replays the moment. No-op if
 * a different day's flag is stored.
 */
export function rearmWaterCelebration(date: string): void {
  if (!isBrowser()) return;
  if (celebrationSeenDate() !== date) return;
  try {
    window.localStorage.removeItem(CELEBRATION_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Unconditionally clear the celebration flag — used by "reset all data" so a
 * fresh start can celebrate again the same day.
 */
export function clearWaterCelebrationFlag(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(CELEBRATION_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Dispatch the celebration event (exported for tests / manual triggers). */
export function emitWaterGoalReached(detail: WaterGoalReachedDetail): void {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent<WaterGoalReachedDetail>(WATER_GOAL_REACHED_EVENT, {
      detail,
    }),
  );
}

/**
 * Fire the global celebration when today's intake crosses from *below* the goal
 * to *at or above* it — at most once per day (guarded by the seen flag), and
 * never on a plain re-render (this is called only from the add mutation).
 * Returns true when it emitted.
 */
export function maybeCelebrateWaterGoalCrossing(args: {
  date: string;
  prevTotalMl: number;
  nextTotalMl: number;
  goalMl: number;
}): boolean {
  const { date, prevTotalMl, nextTotalMl, goalMl } = args;
  if (goalMl <= 0) return false;

  const crossed = prevTotalMl < goalMl && nextTotalMl >= goalMl;
  if (!crossed) return false;
  if (celebrationSeenDate() === date) return false; // already celebrated today

  markCelebrationSeen(date);
  emitWaterGoalReached({
    date,
    totalMl: nextTotalMl,
    goalMl,
    percent: Math.round((nextTotalMl / goalMl) * 100),
  });
  return true;
}
