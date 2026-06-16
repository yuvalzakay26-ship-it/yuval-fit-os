// Pure, deterministic derivation of the daily water "goal completion" state from
// today's intake and the user's configured daily goal. No storage, no React, no
// medical logic — callers pass the numbers in, so this stays trivially testable
// and SSR-safe (mirrors lib/today.ts / lib/progress-insights.ts).
//
// IMPORTANT product framing: this is a UX-polish derivation, NOT medical advice.
// The states are expressed relative to the *user's own configured goal* ("more
// than the goal you set for today"), never as universal health claims. See
// docs/WATER_GOAL_UX_UPGRADE.md.

/**
 * Where today's intake sits relative to the configured goal.
 *
 * - `under_goal` — below 100%: keep the normal tracker behaviour, no warnings.
 * - `completed`  — the celebration band right at goal (100%–<105%): rewarding.
 * - `soft_over`  — a little past the goal (105%–<120%): calm, positive nudge.
 * - `attention`  — meaningfully over (120%–<150%): calm amber attention.
 * - `caution`    — significantly over (≥150%): careful, non-medical rose caution.
 *
 * The completion band has real width (not a single exact point) so logging one
 * more sip right after hitting the goal does not instantly wipe the celebration.
 */
export type WaterStatus =
  | "under_goal"
  | "completed"
  | "soft_over"
  | "attention"
  | "caution";

/**
 * Over-goal thresholds as a fraction of the daily goal. Centralized so the bands
 * are defined in exactly one place. Defaults: completion at 100%, attention at
 * 120%, caution at 150%.
 */
export const WATER_THRESHOLDS = {
  /** Goal reached — start of the celebration band. */
  completed: 1.0,
  /** End of the celebration band / start of the calm "soft over" nudge. */
  softOver: 1.05,
  /** "Pay attention" band starts here. */
  attention: 1.2,
  /** Stronger "caution" band starts here. */
  caution: 1.5,
} as const;

export interface WaterStatusInfo {
  status: WaterStatus;
  /** total / goal, clamped to ≥ 0. 0 when the goal is not set (goal ≤ 0). */
  ratio: number;
  /** Rounded percentage of the goal (e.g. 100, 134). 0 when goal ≤ 0. */
  percent: number;
  /** Millilitres still needed to reach the goal (0 once reached). */
  remainingMl: number;
  /** Millilitres logged beyond the goal (0 until the goal is passed). */
  overMl: number;
  /** True once intake is at or above the goal (status is not `under_goal`). */
  reached: boolean;
}

/**
 * Derive the water status object from raw millilitre figures.
 *
 * Guards: a non-positive or missing goal can never produce an over-goal state
 * (we cannot reason about "over" without a target), so it always reads as
 * `under_goal`. Negative intake is clamped to 0.
 */
export function getWaterStatus(totalMl: number, goalMl: number): WaterStatusInfo {
  const total = Number.isFinite(totalMl) && totalMl > 0 ? totalMl : 0;
  const goal = Number.isFinite(goalMl) && goalMl > 0 ? goalMl : 0;

  if (goal <= 0) {
    return {
      status: "under_goal",
      ratio: 0,
      percent: 0,
      remainingMl: 0,
      overMl: 0,
      reached: false,
    };
  }

  const ratio = total / goal;
  const percent = Math.round(ratio * 100);
  const remainingMl = Math.max(0, goal - total);
  const overMl = Math.max(0, total - goal);

  let status: WaterStatus;
  if (ratio < WATER_THRESHOLDS.completed) {
    status = "under_goal";
  } else if (ratio >= WATER_THRESHOLDS.caution) {
    status = "caution";
  } else if (ratio >= WATER_THRESHOLDS.attention) {
    status = "attention";
  } else if (ratio >= WATER_THRESHOLDS.softOver) {
    status = "soft_over";
  } else {
    // Inside the celebration band (100% .. <105%).
    status = "completed";
  }

  return {
    status,
    ratio,
    percent,
    remainingMl,
    overMl,
    reached: ratio >= WATER_THRESHOLDS.completed,
  };
}

/** True for any state at or beyond the goal (used to switch on the rich banner). */
export function isWaterGoalReached(info: WaterStatusInfo): boolean {
  return info.status !== "under_goal";
}
