"use client";

// Gym Check-In / Check-Out — local gym *attendance* tracking (Phase 3.xx).
//
// This is deliberately SEPARATE from workout logging. A *workout session*
// (`yfos:workouts`) is about exercises, sets, kg and reps. A *gym visit* is only
// about being physically at the gym: when you walked in, when you left, and how
// long you stayed. The two never mix — this module does not touch the workout
// history key, its payload, or the active-workout draft.
//
// Design mirrors `lib/active-workout-draft.ts`: this module is the single owner
// of its two localStorage keys, wraps them in a fail-safe storage layer, and
// exposes a small `useSyncExternalStore` reactive layer so components observe the
// data SSR-safely (server snapshot is empty; the real value swaps in after
// hydration) and stay in sync across the same tab and other tabs.
//
// Local-only. No backend, no auth, no GPS/geolocation, no location data — entry
// and exit are *manual* taps. See `docs/GYM_CHECK_IN.md`.

import { useSyncExternalStore } from "react";
import { createId, startOfWeekISO, toISODate } from "./utils";

/** Saved gym-visit history (newest first). */
export const GYM_VISITS_KEY = "yfos:gym-visits:v1";
/** The single in-progress visit (the user is currently at the gym), or absent. */
export const ACTIVE_GYM_VISIT_KEY = "yfos:active-gym-visit:v1";

/**
 * A visit becomes a "forgot to check out?" candidate once it has been open for
 * this long. We never auto-close it — we only show a calm prompt offering to
 * finish it now or delete the open entry. 6 hours.
 */
export const FORGOT_CHECKOUT_MS = 6 * 60 * 60 * 1000;

/** A finished, saved gym visit (lives in history). */
export interface GymVisit {
  id: string;
  /** ISO timestamp the user checked in. */
  startedAt: string;
  /** ISO timestamp the user checked out. */
  endedAt: string;
  /** Total time at the gym, in milliseconds (always `endedAt - startedAt`, ≥ 0). */
  durationMs: number;
  createdAt: string;
  updatedAt?: string;
}

/** The current open visit — only `startedAt`; the timer is derived from it. */
export interface ActiveGymVisit {
  id: string;
  startedAt: string;
  createdAt: string;
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
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
    // Storage full / unavailable — fail silently, matching `lib/storage.ts`.
  }
}

function removeKey(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore — nothing meaningful to recover from here.
  }
}

/* ------------------------------ Validation ------------------------------ */

function isValidVisit(value: unknown): value is GymVisit {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.startedAt === "string" &&
    typeof v.endedAt === "string" &&
    typeof v.durationMs === "number"
  );
}

function isValidActive(value: unknown): value is ActiveGymVisit {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.startedAt === "string";
}

/* ------------------------------- Reads ---------------------------------- */

/** All saved visits, newest first. Corrupt/partial records are dropped. */
export function getGymVisits(): GymVisit[] {
  const raw = readJSON<unknown[]>(GYM_VISITS_KEY, []);
  if (!Array.isArray(raw)) return [];
  const visits = raw.filter(isValidVisit) as GymVisit[];
  return [...visits].sort((a, b) =>
    a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0,
  );
}

/** The current open visit, or `null` when the user is not checked in. */
export function getActiveGymVisit(): ActiveGymVisit | null {
  const raw = readJSON<unknown>(ACTIVE_GYM_VISIT_KEY, null);
  return isValidActive(raw) ? raw : null;
}

/* ----------------------------- Mutations -------------------------------- */

/**
 * Check in. Creates the single active visit stamped with `startedAt`. If one is
 * already open it is returned unchanged (the UI never offers check-in while a
 * visit is active, but this keeps the contract safe).
 */
export function startGymVisit(now: Date = new Date()): ActiveGymVisit {
  const existing = getActiveGymVisit();
  if (existing) return existing;
  const iso = now.toISOString();
  const active: ActiveGymVisit = {
    id: createId("gym"),
    startedAt: iso,
    createdAt: iso,
  };
  writeJSON(ACTIVE_GYM_VISIT_KEY, active);
  invalidate();
  notify();
  return active;
}

/**
 * Check out. Closes the active visit into a saved {@link GymVisit} (carrying its
 * id and `startedAt`), clears the active slot, and returns the saved visit. A
 * no-op returning `null` when nothing is open. `durationMs` is clamped to ≥ 0 so
 * a clock skew can never store a negative stay.
 */
export function finishGymVisit(now: Date = new Date()): GymVisit | null {
  const active = getActiveGymVisit();
  if (!active) return null;
  const endedAt = now.toISOString();
  const durationMs = Math.max(0, now.getTime() - new Date(active.startedAt).getTime());
  const visit: GymVisit = {
    id: active.id,
    startedAt: active.startedAt,
    endedAt,
    durationMs,
    createdAt: active.createdAt ?? active.startedAt,
  };
  const visits = getGymVisits();
  visits.unshift(visit);
  writeJSON(GYM_VISITS_KEY, visits);
  removeKey(ACTIVE_GYM_VISIT_KEY);
  invalidate();
  notify();
  return visit;
}

/** Discard the open visit without saving it to history. */
export function deleteActiveGymVisit(): void {
  removeKey(ACTIVE_GYM_VISIT_KEY);
  invalidate();
  notify();
}

/** Remove one saved visit from history. */
export function deleteGymVisit(id: string): GymVisit[] {
  const remaining = getGymVisits().filter((v) => v.id !== id);
  writeJSON(GYM_VISITS_KEY, remaining);
  invalidate();
  notify();
  return remaining;
}

/** Clear all gym attendance data (history + any open visit). */
export function clearAllGymData(): void {
  removeKey(GYM_VISITS_KEY);
  removeKey(ACTIVE_GYM_VISIT_KEY);
  invalidate();
  notify();
}

/* ------------------------------ Derived stats --------------------------- */

export interface GymVisitStats {
  totalVisits: number;
  visitsThisWeek: number;
  /** Sum of `durationMs` for visits that started this week. */
  totalMsThisWeek: number;
  /** Mean `durationMs` across all saved visits, or `null` when there are none. */
  averageMs: number | null;
  /** The most recent saved visit, or `null`. */
  lastVisit: GymVisit | null;
}

/**
 * Pure derivation over a visit list (data passed in → SSR-safe, testable). A
 * visit counts toward "this week" by the local date of its `startedAt`, using a
 * Sunday-based week to match the rest of the app.
 */
export function getGymVisitStats(
  visits: GymVisit[],
  now: Date = new Date(),
): GymVisitStats {
  const weekStart = startOfWeekISO(now);
  let visitsThisWeek = 0;
  let totalMsThisWeek = 0;
  let totalMs = 0;
  for (const v of visits) {
    totalMs += v.durationMs;
    const day = toISODate(new Date(v.startedAt));
    if (day >= weekStart) {
      visitsThisWeek += 1;
      totalMsThisWeek += v.durationMs;
    }
  }
  return {
    totalVisits: visits.length,
    visitsThisWeek,
    totalMsThisWeek,
    averageMs: visits.length > 0 ? Math.round(totalMs / visits.length) : null,
    lastVisit: visits[0] ?? null,
  };
}

/* ------------------------------ Formatting ------------------------------ */

/**
 * Compact human duration in hours:minutes, e.g. 5_040_000 → "1:24" (used for the
 * "היית במכון 1:24 שעות" copy and history rows). Under a minute reads as "0:00";
 * stays under an hour read as "0:MM".
 */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Live stopwatch string HH:MM:SS for the active-visit timer, e.g. "00:37:12".
 * Hours are not capped, so a very long open visit still reads correctly.
 */
export function formatTimer(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

/** Local clock time HH:MM for an ISO timestamp, e.g. "18:42". "" when unparseable. */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

/* ---------------------------- Reactive layer ---------------------------- */
// Mirrors `lib/active-workout-draft.ts`: cached snapshots (stable references
// until the data actually changes) + a listener set that mutations notify.
// Same-tab writes notify directly; other tabs come in via the `storage` event.

const EMPTY_VISITS: GymVisit[] = [];
let visitsCache: GymVisit[] | null = null;
let activeCache: ActiveGymVisit | null = null;
let activeCacheValid = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function invalidate(): void {
  visitsCache = null;
  activeCacheValid = false;
}

function visitsSnapshot(): GymVisit[] {
  if (!visitsCache) visitsCache = getGymVisits();
  return visitsCache;
}

function activeSnapshot(): ActiveGymVisit | null {
  if (!activeCacheValid) {
    activeCache = getActiveGymVisit();
    activeCacheValid = true;
  }
  return activeCache;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === GYM_VISITS_KEY ||
      event.key === ACTIVE_GYM_VISIT_KEY ||
      event.key === null
    ) {
      invalidate();
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** Reactive saved-visit history. SSR/first-hydration snapshot is `[]`. */
export function useGymVisits(): GymVisit[] {
  return useSyncExternalStore(subscribe, visitsSnapshot, () => EMPTY_VISITS);
}

/** Reactive current open visit. SSR/first-hydration snapshot is `null`. */
export function useActiveGymVisit(): ActiveGymVisit | null {
  return useSyncExternalStore(subscribe, activeSnapshot, () => null);
}
