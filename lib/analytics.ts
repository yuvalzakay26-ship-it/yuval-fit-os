// Pure derivations over stored data. No localStorage access here — callers
// pass in the data so these stay testable and SSR-safe.

import type { FoodLog, WorkoutSession } from "./fitness-types";
import { startOfWeekISO, todayISO } from "./utils";

export interface ExercisePerformance {
  date: string;
  /** Heaviest set in that session for the exercise. */
  topWeightKg: number;
  reps: number;
  totalSets: number;
}

/** Most recent logged performance for an exercise, if any. */
export function lastPerformance(
  workouts: WorkoutSession[],
  exerciseId: string,
): ExercisePerformance | null {
  // workouts are expected newest-first.
  for (const session of workouts) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!entry || entry.sets.length === 0) continue;
    const top = entry.sets.reduce((best, set) =>
      set.weightKg > best.weightKg ? set : best,
    );
    return {
      date: session.date,
      topWeightKg: top.weightKg,
      reps: top.reps,
      totalSets: entry.sets.length,
    };
  }
  return null;
}

/** Best (heaviest single set) ever logged per exercise id. */
export function bestWeightPerExercise(
  workouts: WorkoutSession[],
): Map<string, number> {
  const best = new Map<string, number>();
  for (const session of workouts) {
    for (const entry of session.exercises) {
      for (const set of entry.sets) {
        const current = best.get(entry.exerciseId) ?? 0;
        if (set.weightKg > current) best.set(entry.exerciseId, set.weightKg);
      }
    }
  }
  return best;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function sumNutrition(logs: FoodLog[]): NutritionTotals {
  return logs.reduce<NutritionTotals>(
    (totals, log) => ({
      calories: totals.calories + (log.calories ?? 0),
      protein: totals.protein + log.protein,
      carbs: totals.carbs + log.carbs,
      fat: totals.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export interface ProgressSummary {
  totalWorkouts: number;
  workoutsThisWeek: number;
  latestWorkout: WorkoutSession | null;
  /** Average daily protein across days that have any food log. */
  proteinDailyAverage: number | null;
}

export function progressSummary(
  workouts: WorkoutSession[],
  foodLogs: FoodLog[],
): ProgressSummary {
  const weekStart = startOfWeekISO();
  const workoutsThisWeek = workouts.filter((w) => w.date >= weekStart).length;

  // Average protein per logged day.
  const byDay = new Map<string, number>();
  for (const log of foodLogs) {
    byDay.set(log.date, (byDay.get(log.date) ?? 0) + log.protein);
  }
  const proteinDailyAverage =
    byDay.size === 0
      ? null
      : Math.round(
          [...byDay.values()].reduce((a, b) => a + b, 0) / byDay.size,
        );

  return {
    totalWorkouts: workouts.length,
    workoutsThisWeek,
    latestWorkout: workouts[0] ?? null,
    proteinDailyAverage,
  };
}

export function todaysFoodLogs(foodLogs: FoodLog[]): FoodLog[] {
  const today = todayISO();
  return foodLogs.filter((log) => log.date === today);
}

export function todaysWorkout(workouts: WorkoutSession[]): WorkoutSession | null {
  const today = todayISO();
  return workouts.find((w) => w.date === today) ?? null;
}
