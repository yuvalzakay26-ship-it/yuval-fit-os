"use client";

// Reactive layer over `storage.ts` using useSyncExternalStore. This keeps
// localStorage as the source of truth while letting components subscribe
// without setState-in-effect, and stays SSR-safe (server snapshots are stable
// constants, the client snapshot swaps in after hydration).

import { useSyncExternalStore } from "react";
import {
  DEFAULT_SETTINGS,
  type FoodLog,
  type SavedFoodValue,
  type Settings,
  type WorkoutSession,
  type WorkoutTemplate,
} from "./fitness-types";
import * as storage from "./storage";

const EMPTY_WORKOUTS: WorkoutSession[] = [];
const EMPTY_FOODLOGS: FoodLog[] = [];
const EMPTY_TEMPLATES: WorkoutTemplate[] = [];
const EMPTY_SAVED_VALUES: Record<string, SavedFoodValue> = {};

let workoutsCache: WorkoutSession[] | null = null;
let foodLogsCache: FoodLog[] | null = null;
let settingsCache: Settings | null = null;
let templatesCache: WorkoutTemplate[] | null = null;
let savedValuesCache: Record<string, SavedFoodValue> | null = null;

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function invalidate(): void {
  workoutsCache = null;
  foodLogsCache = null;
  settingsCache = null;
  templatesCache = null;
  savedValuesCache = null;
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

function templatesSnapshot(): WorkoutTemplate[] {
  if (!templatesCache) templatesCache = storage.getWorkoutTemplates();
  return templatesCache;
}

function savedValuesSnapshot(): Record<string, SavedFoodValue> {
  if (!savedValuesCache) savedValuesCache = storage.getSavedFoodValues();
  return savedValuesCache;
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

export function useWorkoutTemplates(): WorkoutTemplate[] {
  return useSyncExternalStore(subscribe, templatesSnapshot, () => EMPTY_TEMPLATES);
}

/** Map of `sourceFoodId` → the user's saved default nutrition values. */
export function useSavedFoodValues(): Record<string, SavedFoodValue> {
  return useSyncExternalStore(
    subscribe,
    savedValuesSnapshot,
    () => EMPTY_SAVED_VALUES,
  );
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

export function saveTemplate(template: WorkoutTemplate): void {
  storage.saveWorkoutTemplate(template);
  templatesCache = storage.getWorkoutTemplates();
  notify();
}

export function removeTemplate(id: string): void {
  storage.deleteWorkoutTemplate(id);
  templatesCache = storage.getWorkoutTemplates();
  notify();
}

export function addTemplateFromSession(session: WorkoutSession): WorkoutTemplate {
  const template = storage.templateFromSession(session);
  storage.saveWorkoutTemplate(template);
  templatesCache = storage.getWorkoutTemplates();
  notify();
  return template;
}

export function saveFoodValue(value: SavedFoodValue): void {
  storage.saveSavedFoodValue(value);
  savedValuesCache = storage.getSavedFoodValues();
  notify();
}

export function removeFoodValue(sourceFoodId: string): void {
  storage.deleteSavedFoodValue(sourceFoodId);
  savedValuesCache = storage.getSavedFoodValues();
  notify();
}

export function clearAllFoodValues(): void {
  storage.clearSavedFoodValues();
  savedValuesCache = storage.getSavedFoodValues();
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
