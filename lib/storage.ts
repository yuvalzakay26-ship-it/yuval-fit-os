// All localStorage access for Yuval Fit OS lives here so the rest of the app
// stays storage-agnostic (easy to swap for IndexedDB / a backend later).

import {
  DEFAULT_SETTINGS,
  type FoodLog,
  type Settings,
  type WorkoutSession,
} from "./fitness-types";

const KEYS = {
  workouts: "yfos:workouts",
  foodLogs: "yfos:foodLogs",
  settings: "yfos:settings",
} as const;

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
