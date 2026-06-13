// All localStorage access for Yuval Fit OS lives here so the rest of the app
// stays storage-agnostic (easy to swap for IndexedDB / a backend later).

import {
  DEFAULT_SETTINGS,
  type FavoriteFood,
  type FoodLog,
  type SavedFoodValue,
  type Settings,
  type WaterEntry,
  type WaterLog,
  type WorkoutSession,
  type WorkoutTemplate,
} from "./fitness-types";
import { DEFAULT_WORKOUT_TEMPLATES } from "./seed-templates";
import { createId } from "./utils";

const KEYS = {
  workouts: "yfos:workouts",
  foodLogs: "yfos:foodLogs",
  settings: "yfos:settings",
  workoutTemplates: "yfos:workout-templates:v1",
  savedFoodValues: "yfos:saved-food-values:v1",
  favoriteFoods: "yfos:favorite-foods:v1",
  waterLogs: "yfos:water-logs:v1",
} as const;

/** Map of `sourceFoodId` → the user's saved default values for that food. */
type SavedFoodValuesMap = Record<string, SavedFoodValue>;

/** Map of `sourceFoodId` → the favorite record for that food. */
type FavoriteFoodsMap = Record<string, FavoriteFood>;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently for MVP.
  }
}

/* ----------------------------- Workouts ----------------------------- */

export function getWorkouts(): WorkoutSession[] {
  const workouts = readJSON<WorkoutSession[]>(KEYS.workouts, []);
  // Newest first.
  return [...workouts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function saveWorkout(session: WorkoutSession): WorkoutSession[] {
  const existing = readJSON<WorkoutSession[]>(KEYS.workouts, []);
  const index = existing.findIndex((w) => w.id === session.id);
  if (index >= 0) {
    existing[index] = session;
  } else {
    existing.push(session);
  }
  writeJSON(KEYS.workouts, existing);
  return getWorkouts();
}

export function deleteWorkout(id: string): WorkoutSession[] {
  const remaining = readJSON<WorkoutSession[]>(KEYS.workouts, []).filter(
    (w) => w.id !== id,
  );
  writeJSON(KEYS.workouts, remaining);
  return getWorkouts();
}

/* ------------------------- Workout templates ------------------------ */

export function getWorkoutTemplates(): WorkoutTemplate[] {
  // The starter templates are only surfaced while the key has never been
  // written. The first mutation materializes the full list, so deleting or
  // editing a default template can never be undone by a re-seed.
  if (!isBrowser()) return [...DEFAULT_WORKOUT_TEMPLATES];
  if (window.localStorage.getItem(KEYS.workoutTemplates) === null) {
    return [...DEFAULT_WORKOUT_TEMPLATES];
  }
  return readJSON<WorkoutTemplate[]>(KEYS.workoutTemplates, []);
}

export function saveWorkoutTemplate(template: WorkoutTemplate): WorkoutTemplate[] {
  const existing = getWorkoutTemplates();
  const index = existing.findIndex((t) => t.id === template.id);
  if (index >= 0) {
    existing[index] = template;
  } else {
    existing.push(template);
  }
  writeJSON(KEYS.workoutTemplates, existing);
  return getWorkoutTemplates();
}

export function deleteWorkoutTemplate(id: string): WorkoutTemplate[] {
  const remaining = getWorkoutTemplates().filter((t) => t.id !== id);
  writeJSON(KEYS.workoutTemplates, remaining);
  return getWorkoutTemplates();
}

/** Build (but do not persist) a template from a logged workout session. */
export function templateFromSession(session: WorkoutSession): WorkoutTemplate {
  return {
    id: createId("tpl"),
    title: session.title,
    muscleGroups: [...session.muscleGroups],
    exerciseIds: session.exercises.map((e) => e.exerciseId),
    createdAt: new Date().toISOString(),
  };
}

/* ----------------------------- Food logs ---------------------------- */

export function getFoodLogs(): FoodLog[] {
  const logs = readJSON<FoodLog[]>(KEYS.foodLogs, []);
  return [...logs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getFoodLogsByDate(date: string): FoodLog[] {
  return getFoodLogs().filter((log) => log.date === date);
}

export function saveFoodLog(log: FoodLog): FoodLog[] {
  const existing = readJSON<FoodLog[]>(KEYS.foodLogs, []);
  const index = existing.findIndex((l) => l.id === log.id);
  if (index >= 0) {
    existing[index] = log;
  } else {
    existing.push(log);
  }
  writeJSON(KEYS.foodLogs, existing);
  return getFoodLogs();
}

export function deleteFoodLog(id: string): FoodLog[] {
  const remaining = readJSON<FoodLog[]>(KEYS.foodLogs, []).filter((l) => l.id !== id);
  writeJSON(KEYS.foodLogs, remaining);
  return getFoodLogs();
}

/* ------------------------ Saved food values ------------------------- */
// Personal, user-entered nutrition defaults for food-library items, keyed by
// `sourceFoodId`. Never inferred from images or external databases — see
// `docs/NUTRITION_SAVED_VALUES.md`. Kept separate from FoodLog so existing logs
// stay untouched and backward-compatible.

export function getSavedFoodValues(): SavedFoodValuesMap {
  return readJSON<SavedFoodValuesMap>(KEYS.savedFoodValues, {});
}

export function getSavedFoodValue(sourceFoodId: string): SavedFoodValue | undefined {
  if (!sourceFoodId) return undefined;
  return getSavedFoodValues()[sourceFoodId];
}

export function saveSavedFoodValue(value: SavedFoodValue): SavedFoodValuesMap {
  const existing = getSavedFoodValues();
  existing[value.sourceFoodId] = value;
  writeJSON(KEYS.savedFoodValues, existing);
  return getSavedFoodValues();
}

export function deleteSavedFoodValue(sourceFoodId: string): SavedFoodValuesMap {
  const existing = getSavedFoodValues();
  delete existing[sourceFoodId];
  writeJSON(KEYS.savedFoodValues, existing);
  return getSavedFoodValues();
}

export function clearSavedFoodValues(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEYS.savedFoodValues);
}

/* -------------------------- Favorite foods -------------------------- */
// Quick-access favorites for food-library items, keyed by `sourceFoodId`. This
// is favorite identity only — no nutrition values live here. Only library items
// can be favorited (manual logs have no stable id). See
// `docs/NUTRITION_FAVORITES.md`.

export function getFavoriteFoods(): FavoriteFoodsMap {
  return readJSON<FavoriteFoodsMap>(KEYS.favoriteFoods, {});
}

export function isFavoriteFood(sourceFoodId: string): boolean {
  if (!sourceFoodId) return false;
  return Boolean(getFavoriteFoods()[sourceFoodId]);
}

/** Toggle a food's favorite state, returning the updated map. */
export function toggleFavoriteFood(sourceFoodId: string): FavoriteFoodsMap {
  if (!sourceFoodId) return getFavoriteFoods();
  const existing = getFavoriteFoods();
  if (existing[sourceFoodId]) {
    delete existing[sourceFoodId];
  } else {
    existing[sourceFoodId] = {
      sourceFoodId,
      addedAt: new Date().toISOString(),
    };
  }
  writeJSON(KEYS.favoriteFoods, existing);
  return getFavoriteFoods();
}

export function clearFavoriteFoods(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEYS.favoriteFoods);
}

/* ------------------------------ Water ------------------------------- */
// Daily hydration logs keyed by local ISO date. localStorage-only, no backend.
// `totalMl` is always recomputed from `entries`, so it can never drift out of
// sync. Days are independent — today reads today's date only and past days stay
// stored for future history. See `docs/WATER_TRACKING.md`.

function recomputeTotal(entries: WaterEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amountMl, 0);
}

export function getWaterLogs(): WaterLog[] {
  const logs = readJSON<WaterLog[]>(KEYS.waterLogs, []);
  // Newest day first.
  return [...logs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getWaterLogByDate(date: string): WaterLog | undefined {
  return readJSON<WaterLog[]>(KEYS.waterLogs, []).find((log) => log.date === date);
}

/** Append a drink to the given day, creating the day's record if needed. */
export function addWaterEntry(date: string, amountMl: number): WaterLog[] {
  const all = readJSON<WaterLog[]>(KEYS.waterLogs, []);
  const entry: WaterEntry = {
    id: createId("water"),
    amountMl,
    createdAt: new Date().toISOString(),
  };
  const index = all.findIndex((log) => log.date === date);
  if (index >= 0) {
    const entries = [...all[index].entries, entry];
    all[index] = { date, entries, totalMl: recomputeTotal(entries) };
  } else {
    all.push({ date, entries: [entry], totalMl: amountMl });
  }
  writeJSON(KEYS.waterLogs, all);
  return getWaterLogs();
}

/** Remove a single drink. Drops the whole day record once it has no entries. */
export function deleteWaterEntry(date: string, entryId: string): WaterLog[] {
  const all = readJSON<WaterLog[]>(KEYS.waterLogs, []);
  const index = all.findIndex((log) => log.date === date);
  if (index >= 0) {
    const entries = all[index].entries.filter((e) => e.id !== entryId);
    if (entries.length === 0) {
      all.splice(index, 1);
    } else {
      all[index] = { date, entries, totalMl: recomputeTotal(entries) };
    }
    writeJSON(KEYS.waterLogs, all);
  }
  return getWaterLogs();
}

/** Clear a single day entirely (used by the "reset today" action). */
export function resetWaterDay(date: string): WaterLog[] {
  const remaining = readJSON<WaterLog[]>(KEYS.waterLogs, []).filter(
    (log) => log.date !== date,
  );
  writeJSON(KEYS.waterLogs, remaining);
  return getWaterLogs();
}

/* ------------------------------ Settings ---------------------------- */

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>(KEYS.settings, {}) };
}

export function saveSettings(settings: Settings): Settings {
  writeJSON(KEYS.settings, settings);
  return settings;
}

/* -------------------------- Maintenance ----------------------------- */

export function resetAllData(): void {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}

export interface StorageStatus {
  available: boolean;
  workoutCount: number;
  foodLogCount: number;
  approxBytes: number;
}

export function getStorageStatus(): StorageStatus {
  if (!isBrowser()) {
    return { available: false, workoutCount: 0, foodLogCount: 0, approxBytes: 0 };
  }
  let approxBytes = 0;
  Object.values(KEYS).forEach((key) => {
    approxBytes += (window.localStorage.getItem(key)?.length ?? 0) * 2; // UTF-16
  });
  return {
    available: true,
    workoutCount: getWorkouts().length,
    foodLogCount: getFoodLogs().length,
    approxBytes,
  };
}

export { KEYS as STORAGE_KEYS };
