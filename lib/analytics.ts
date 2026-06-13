// Pure derivations over stored data. No localStorage access here — callers
// pass in the data so these stay testable and SSR-safe.

import type {
  FoodLog,
  SetEntry,
  Supplement,
  SupplementLog,
  WaterLog,
  WorkoutSession,
} from "./fitness-types";
import { startOfWeekISO, todayISO } from "./utils";

export interface ExercisePerformance {
  date: string;
  /** Heaviest set in that session for the exercise. */
  topWeightKg: number;
  reps: number;
  totalSets: number;
  /** All sets logged in that session, in order. */
  sets: SetEntry[];
}

/** Most recent logged performance for an exercise, if any. */
export function lastPerformance(
  workouts: WorkoutSession[],
  exerciseId: string,
): ExercisePerformance | null {
  // workouts are expected newest-first.
  for (const session of workouts) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    // Ignore unfilled sets (0 kg × 0 reps) so skipped exercises don't count.
    const sets = entry.sets.filter((s) => s.weightKg > 0 || s.reps > 0);
    if (sets.length === 0) continue;
    const top = sets.reduce((best, set) =>
      set.weightKg > best.weightKg ? set : best,
    );
    return {
      date: session.date,
      topWeightKg: top.weightKg,
      reps: top.reps,
      totalSets: sets.length,
      sets,
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

/** A previously-logged food surfaced for one-tap re-logging ("אחרונים"). */
export interface RecentFood {
  foodName: string;
  category?: string;
  imagePath?: string;
  sourceFoodId?: string;
  quantityText?: string;
}

/**
 * Most-recently logged foods, de-duplicated. Derived purely from existing food
 * logs — no new data model. Macros are intentionally NOT carried over: the user
 * re-enters portion values each time, so nothing is ever inferred.
 */
export function recentFoods(foodLogs: FoodLog[], limit = 8): RecentFood[] {
  // foodLogs arrive newest-date-first from storage. Dedupe by library id when
  // present, otherwise by food name, keeping the first (most recent) seen.
  const seen = new Set<string>();
  const recents: RecentFood[] = [];
  for (const log of foodLogs) {
    const key = log.sourceFoodId ?? log.foodName.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    recents.push({
      foodName: log.foodName,
      category: log.category,
      imagePath: log.imagePath,
      sourceFoodId: log.sourceFoodId,
      quantityText: log.quantityText || undefined,
    });
    if (recents.length >= limit) break;
  }
  return recents;
}

export function todaysWorkout(workouts: WorkoutSession[]): WorkoutSession | null {
  const today = todayISO();
  return workouts.find((w) => w.date === today) ?? null;
}

/* ------------------------------- Water ------------------------------- */
// Pure derivations over water logs. Quick-add presets live here so every entry
// point (Today, Nutrition, the detail screen) stays consistent.

/** Quick-add presets in millilitres, shared across all water UIs. */
export const WATER_QUICK_ADD_ML = [250, 500, 750] as const;

/** The full water log for a given date, if any drinks were logged that day. */
export function waterForDate(logs: WaterLog[], date: string): WaterLog | null {
  return logs.find((log) => log.date === date) ?? null;
}

/** Total millilitres logged today (0 when nothing is logged). */
export function todaysWaterMl(logs: WaterLog[]): number {
  return waterForDate(logs, todayISO())?.totalMl ?? 0;
}

/**
 * Average daily water (ml) across days in the current week that have any entry.
 * Returns null when no day this week has water logged, so callers can show a
 * neutral placeholder rather than a misleading zero.
 */
export function weeklyWaterAverageMl(logs: WaterLog[]): number | null {
  const weekStart = startOfWeekISO();
  const days = logs.filter((log) => log.date >= weekStart && log.totalMl > 0);
  if (days.length === 0) return null;
  const sum = days.reduce((total, log) => total + log.totalMl, 0);
  return Math.round(sum / days.length);
}

/* ---------------------------- Supplements --------------------------- */
// Pure derivations over the supplement catalogue + date-based taken-logs. No
// recommendations, no medical logic — only counting what the user already
// tracks. See `docs/SUPPLEMENTS_TRACKER.md`.

/** Active (non-archived) supplements only — these make up the daily list. */
export function activeSupplements(supplements: Supplement[]): Supplement[] {
  return supplements.filter((s) => s.isActive);
}

/** Set of supplement ids marked taken on a given date. */
export function takenSupplementIds(
  logs: SupplementLog[],
  date: string,
): Set<string> {
  const taken = new Set<string>();
  for (const log of logs) {
    if (log.date === date) taken.add(log.supplementId);
  }
  return taken;
}

export interface SupplementDaySummary {
  /** Number of active supplements. */
  active: number;
  /** How many active supplements are marked taken on the date. */
  taken: number;
  /** Active items still unmarked. */
  remaining: number;
  /** True when there is at least one active item and all are taken. */
  allDone: boolean;
}

/** Today-style completion summary for a single date. */
export function supplementDaySummary(
  supplements: Supplement[],
  logs: SupplementLog[],
  date: string,
): SupplementDaySummary {
  const active = activeSupplements(supplements);
  const taken = takenSupplementIds(logs, date);
  const takenCount = active.reduce(
    (count, s) => (taken.has(s.id) ? count + 1 : count),
    0,
  );
  return {
    active: active.length,
    taken: takenCount,
    remaining: Math.max(0, active.length - takenCount),
    allDone: active.length > 0 && takenCount === active.length,
  };
}

/**
 * Number of distinct days in the current week with at least one supplement
 * marked taken. A simple, honest adherence signal — not a chart.
 */
export function supplementDaysLoggedThisWeek(logs: SupplementLog[]): number {
  const weekStart = startOfWeekISO();
  const days = new Set<string>();
  for (const log of logs) {
    if (log.date >= weekStart) days.add(log.date);
  }
  return days.size;
}
