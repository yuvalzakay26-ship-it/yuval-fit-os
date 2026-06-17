// Personal Path V1 — a small, deterministic, LOCAL-ONLY guidance layer.
//
// This is NOT a plan generator and NOT AI. It creates no exercises, no weekly
// programs, and no templates; it prescribes nothing medical/diet/body-related.
// It only *connects* three things the app already has — the saved personal
// profile (via the existing recommendation result), the existing workout
// recommendation, and the saved workout history — into a single "where am I /
// what's my next step" state the UI can render.
//
// It is a pure function of its inputs: same inputs always yield the same state.
// It reads NO new data and adds NO new storage key. It deliberately derives
// everything from the recommendation RESULT (which already encodes whether a
// usable profile exists) plus the saved workouts, so it never touches
// age / height / weight / sex / adaptation for path logic.
//
// See docs/PERSONAL_PATH_V1.md.

import type { WorkoutSession } from "./fitness-types";
import type {
  WorkoutRecommendation,
  WorkoutRecommendationResult,
} from "./workout-recommendation";

/**
 * The personal-path state, discriminated so the card renders the right behaviour
 * without re-deriving anything:
 *   • no-profile         — no usable profile yet → invite to fill one.
 *   • incomplete-profile — a profile exists but no recommendation is possible yet
 *                          (missing core answers, or no templates to pick from).
 *   • ready-to-start     — profile + a concrete recommendation, but no workouts
 *                          saved yet → the first step is to start from it.
 *   • in-progress        — at least one workout saved → keep the streak going;
 *                          carries the count, the last date, whether the profile
 *                          is complete (for a status chip), and the recommendation
 *                          when one still exists (for the optional "back to it").
 */
export type PersonalPathState =
  | { kind: "no-profile" }
  | { kind: "incomplete-profile" }
  | { kind: "ready-to-start"; recommendation: WorkoutRecommendation }
  | {
      kind: "in-progress";
      workoutCount: number;
      lastWorkoutDate?: string;
      profileComplete: boolean;
      recommendation?: WorkoutRecommendation;
    };

/**
 * Derive the personal-path state. `workouts` is expected newest-first (as
 * `getWorkouts` / `useWorkouts` return it), so `workouts[0]` is the latest.
 *
 * Precedence is intentional: once ANY workout is saved the user is "in progress"
 * — telling them to go fill a profile would be the wrong headline — so that state
 * wins. Profile-completeness for the in-progress chip is read from the
 * recommendation result (which is "ok"/"no-templates" only when the core profile
 * answers exist), never from body fields.
 */
export function personalPathState(
  recommendation: WorkoutRecommendationResult,
  workouts: WorkoutSession[],
): PersonalPathState {
  if (workouts.length > 0) {
    const latest = workouts[0];
    return {
      kind: "in-progress",
      workoutCount: workouts.length,
      lastWorkoutDate: latest?.date,
      profileComplete:
        recommendation.status === "ok" ||
        recommendation.status === "no-templates",
      recommendation:
        recommendation.status === "ok"
          ? recommendation.recommendation
          : undefined,
    };
  }

  if (recommendation.status === "no-profile") return { kind: "no-profile" };
  if (recommendation.status === "ok") {
    return { kind: "ready-to-start", recommendation: recommendation.recommendation };
  }
  // "incomplete-profile" or "no-templates": a profile exists but we cannot yet
  // offer a concrete starting point.
  return { kind: "incomplete-profile" };
}
