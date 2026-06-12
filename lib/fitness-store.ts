"use client";

// Reactive layer over `storage.ts` using useSyncExternalStore. This keeps
// localStorage as the source of truth while letting components subscribe
// without setState-in-effect, and stays SSR-safe (server snapshots are stable
// constants, the client snapshot swaps in after hydration).

import { useSyncExternalStore } from "react";
import {
  DEFAULT_SETTINGS,
  type FoodLog,
  type Settings,
  type WorkoutSession,
} from "./fitness-types";
import * as storage from "./storage";

const EMPTY_WORKOUTS: WorkoutSession[] = [];
const EMPTY_FOODLOGS: FoodLog[] = [];

let workoutsCache: WorkoutSession[] | null = null;
let foodLogsCache: FoodLog[] | null = null;
let settingsCache: Settings | null = null;

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function invalidate(): void {
  workoutsCache = null;
  foodLogsCache = null;
  settingsCache = null;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Reflect changes made in other tabs.
  const onStorage = () => {
    invalidate();
    callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/* ------------------------------ Snapshots ------------------------------ */

function workoutsSnapshot(): WorkoutSession[] {
  if (!workoutsCache) workoutsCache = storage.getWorkouts();
  return workoutsCache;
}

function foodLogsSnapshot(): FoodLog[] {
  if (!foodLogsCache) foodLogsCache = storage.getFoodLogs();
  return foodLogsCache;
}

function settingsSnapshot(): Settings {
  if (!settingsCache) settingsCache = storage.getSettings();
  return settingsCache;
}

/* -------------------------------- Hooks -------------------------------- */

export function useWorkouts(): WorkoutSession[] {
  return useSyncExternalStore(subscribe, workoutsSnapshot, () => EMPTY_WORKOUTS);
}

export function useFoodLogs(): FoodLog[] {
  return useSyncExternalStore(subscribe, foodLogsSnapshot, () => EMPTY_FOODLOGS);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, settingsSnapshot, () => DEFAULT_SETTINGS);
}

/* ------------------------------ Mutations ------------------------------ */

export function addWorkout(session: WorkoutSession): void {
  storage.saveWorkout(session);
  workoutsCache = storage.getWorkouts();
  notify();
}

export function removeWorkout(id: string): void {
  storage.deleteWorkout(id);
  workoutsCache = storage.getWorkouts();
  notify();
}

export function addFoodLog(log: FoodLog): void {
  storage.saveFoodLog(log);
  foodLogsCache = storage.getFoodLogs();
  notify();
}

export function removeFoodLog(id: string): void {
  storage.deleteFoodLog(id);
  foodLogsCache = storage.getFoodLogs();
  notify();
}

export function updateSettings(settings: Settings): void {
  storage.saveSettings(settings);
  settingsCache = settings;
  notify();
}

export function resetAll(): void {
  storage.resetAllData();
  invalidate();
  notify();
}
