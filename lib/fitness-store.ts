"use client";

// Reactive layer over `storage.ts` using useSyncExternalStore. This keeps
// localStorage as the source of truth while letting components subscribe
// without setState-in-effect, and stays SSR-safe (server snapshots are stable
// constants, the client snapshot swaps in after hydration).

import { useSyncExternalStore } from "react";
import {
  DEFAULT_SETTINGS,
  type FavoriteFood,
  type FoodLog,
  type SavedFoodValue,
  type Settings,
  type Supplement,
  type SupplementLog,
  type WaterLog,
  type WorkoutSession,
  type WorkoutTemplate,
} from "./fitness-types";
import * as storage from "./storage";

const EMPTY_WORKOUTS: WorkoutSession[] = [];
const EMPTY_FOODLOGS: FoodLog[] = [];
const EMPTY_TEMPLATES: WorkoutTemplate[] = [];
const EMPTY_SAVED_VALUES: Record<string, SavedFoodValue> = {};
const EMPTY_FAVORITES: Record<string, FavoriteFood> = {};
const EMPTY_WATER_LOGS: WaterLog[] = [];
const EMPTY_SUPPLEMENTS: Supplement[] = [];
const EMPTY_SUPPLEMENT_LOGS: SupplementLog[] = [];

let workoutsCache: WorkoutSession[] | null = null;
let foodLogsCache: FoodLog[] | null = null;
let settingsCache: Settings | null = null;
let templatesCache: WorkoutTemplate[] | null = null;
let savedValuesCache: Record<string, SavedFoodValue> | null = null;
let favoritesCache: Record<string, FavoriteFood> | null = null;
let waterLogsCache: WaterLog[] | null = null;
let supplementsCache: Supplement[] | null = null;
let supplementLogsCache: SupplementLog[] | null = null;

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
  favoritesCache = null;
  waterLogsCache = null;
  supplementsCache = null;
  supplementLogsCache = null;
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

function favoritesSnapshot(): Record<string, FavoriteFood> {
  if (!favoritesCache) favoritesCache = storage.getFavoriteFoods();
  return favoritesCache;
}

function waterLogsSnapshot(): WaterLog[] {
  if (!waterLogsCache) waterLogsCache = storage.getWaterLogs();
  return waterLogsCache;
}

function supplementsSnapshot(): Supplement[] {
  if (!supplementsCache) supplementsCache = storage.getSupplements();
  return supplementsCache;
}

function supplementLogsSnapshot(): SupplementLog[] {
  if (!supplementLogsCache) supplementLogsCache = storage.getSupplementLogs();
  return supplementLogsCache;
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

/** Map of `sourceFoodId` → the user's favorite-food records. */
export function useFavoriteFoods(): Record<string, FavoriteFood> {
  return useSyncExternalStore(subscribe, favoritesSnapshot, () => EMPTY_FAVORITES);
}

/** All daily water logs, newest day first. */
export function useWaterLogs(): WaterLog[] {
  return useSyncExternalStore(subscribe, waterLogsSnapshot, () => EMPTY_WATER_LOGS);
}

/** The user's supplement catalogue (active + archived). */
export function useSupplements(): Supplement[] {
  return useSyncExternalStore(
    subscribe,
    supplementsSnapshot,
    () => EMPTY_SUPPLEMENTS,
  );
}

/** All date-based supplement "taken" logs. */
export function useSupplementLogs(): SupplementLog[] {
  return useSyncExternalStore(
    subscribe,
    supplementLogsSnapshot,
    () => EMPTY_SUPPLEMENT_LOGS,
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

export function toggleFavoriteFood(sourceFoodId: string): void {
  storage.toggleFavoriteFood(sourceFoodId);
  favoritesCache = storage.getFavoriteFoods();
  notify();
}

export function clearAllFavoriteFoods(): void {
  storage.clearFavoriteFoods();
  favoritesCache = storage.getFavoriteFoods();
  notify();
}

export function logWater(date: string, amountMl: number): void {
  storage.addWaterEntry(date, amountMl);
  waterLogsCache = storage.getWaterLogs();
  notify();
}

export function removeWaterEntry(date: string, entryId: string): void {
  storage.deleteWaterEntry(date, entryId);
  waterLogsCache = storage.getWaterLogs();
  notify();
}

export function resetWaterDay(date: string): void {
  storage.resetWaterDay(date);
  waterLogsCache = storage.getWaterLogs();
  notify();
}

export function saveSupplement(supplement: Supplement): void {
  storage.saveSupplement(supplement);
  supplementsCache = storage.getSupplements();
  notify();
}

export function removeSupplement(id: string): void {
  storage.deleteSupplement(id);
  supplementsCache = storage.getSupplements();
  supplementLogsCache = storage.getSupplementLogs();
  notify();
}

export function toggleSupplementTaken(supplementId: string, date: string): void {
  storage.toggleSupplementTaken(supplementId, date);
  supplementLogsCache = storage.getSupplementLogs();
  notify();
}

export function clearAllSupplements(): void {
  storage.clearSupplements();
  supplementsCache = storage.getSupplements();
  notify();
}

export function clearAllSupplementLogs(): void {
  storage.clearSupplementLogs();
  supplementLogsCache = storage.getSupplementLogs();
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
