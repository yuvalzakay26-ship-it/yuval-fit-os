"use client";

// Lightweight event seam for the app-wide "protein goal reached" celebration.
// Every surface that logs food — manual add, the food library/catalog, the
// add-again / recent-food shortcut, and an AI draft that saves through the
// normal flow — routes through one mutation, `addFoodLog` in
// lib/fitness-store.ts. So we detect the "today's protein crossed the
// configured goal" transition there and broadcast a single custom event. The
// overlay listens once, high in the app shell, and plays the moment no matter
// where the food was logged.
//
// This is a UX-only feedback seam. It does NOT touch the FoodLog schema, the
// nutrition localStorage keys, the macro/summary calculations, or the
// backup/restore schema. It persists NOTHING of its own: the crossing detector
// runs over the real food-log totals at mutation time, so the edge itself is the
// anti-spam guard —
//   * a plain re-render / hydration never calls it (it fires only from the add
//     mutation), so a page reload with the goal already met never celebrates;
//   * backup restore writes localStorage directly (not via `addFoodLog`), so a
//     restore that already meets the goal never celebrates;
//   * adding more food once the goal is already met does not re-fire, because the
//     pre-add total is no longer below the goal;
//   * removing food back below the goal and then logging enough again is a fresh
//     below→at-or-above crossing, so it can celebrate again.
//
// It is intentionally distinct from the water-goal celebration (a hydration
// moment) and the supplement-taken celebration (a single item logged): this one
// marks reaching the user's *own configured* daily protein target. The copy is
// neutral encouragement only — it never implies a medical need, a recommended
// amount, a body-image goal, or any diet advice. See
// docs/PROTEIN_GOAL_CELEBRATION.md.

/** Custom event dispatched on `window` when the daily protein goal is crossed. */
export const PROTEIN_GOAL_REACHED_EVENT = "yfos:protein-goal-reached";

export interface ProteinGoalReachedDetail {
  /** Local ISO date (YYYY-MM-DD) the goal was reached for. */
  date: string;
  /** Today's total logged protein at the crossing (grams). */
  proteinTotalGrams: number;
  /** The user's configured daily protein goal (grams). */
  proteinGoalGrams: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Dispatch the celebration event (exported for tests / manual triggers). */
export function emitProteinGoalReached(detail: ProteinGoalReachedDetail): void {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent<ProteinGoalReachedDetail>(PROTEIN_GOAL_REACHED_EVENT, {
      detail,
    }),
  );
}

/**
 * Fire the global celebration when today's logged protein crosses from *below*
 * the configured goal to *at or above* it. Called only from the food-log add
 * mutation, so it never fires on render, hydration, loading existing logs, or a
 * backup restore. Re-adding after dropping below the goal is a fresh crossing and
 * may celebrate again. Returns true when it emitted.
 *
 * Handles a missing / zero / invalid goal safely: with no valid goal there is
 * nothing to reach, so it never fires.
 */
export function maybeCelebrateProteinGoalCrossing(args: {
  date: string;
  prevProteinGrams: number;
  nextProteinGrams: number;
  goalGrams: number;
}): boolean {
  const { date, prevProteinGrams, nextProteinGrams, goalGrams } = args;
  if (!Number.isFinite(goalGrams) || goalGrams <= 0) return false;

  const crossed = prevProteinGrams < goalGrams && nextProteinGrams >= goalGrams;
  if (!crossed) return false;

  emitProteinGoalReached({
    date,
    proteinTotalGrams: nextProteinGrams,
    proteinGoalGrams: goalGrams,
  });
  return true;
}
