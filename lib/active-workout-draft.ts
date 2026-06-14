"use client";

// Local, in-progress draft of the *active workout session* (Phase 3.xx).
//
// This protects data the user has entered into the Active Workout / Workout
// Builder before they press the final `סיים ושמור אימון`. It is deliberately
// SEPARATE from the saved workout history:
//
//   • Auto-save draft  → a single recoverable slot for the in-progress session.
//   • `סיים ושמור אימון` → officially appends a WorkoutSession to history.
//
// The draft lives under its own localStorage key and never touches the workout
// history key (`yfos:workouts`) or its payload shape. There is at most ONE
// draft at a time. Reading/writing is fail-safe: a corrupt or partial draft is
// ignored, and a failed write never throws into the workout screen.
//
// A small reactive layer (useSyncExternalStore) mirrors `lib/welcome.ts` /
// `lib/fitness-store.ts` so components observe the draft SSR-safely (server
// snapshot is null; the real value swaps in after hydration) and stay in sync
// when it is written or cleared from anywhere in the same tab.
//
// See `docs/ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md`.

import { useSyncExternalStore } from "react";
import type { WorkoutExerciseEntry } from "./fitness-types";

/** Dedicated draft key — intentionally distinct from `yfos:workouts`. */
export const ACTIVE_WORKOUT_DRAFT_KEY = "yfos:active-workout-draft:v1";

const DRAFT_VERSION = 1;

/**
 * The persisted draft. Shape mirrors the builder's in-memory session state
 * (`title` + `entries`) so restoring is a direct hydrate — no transform of the
 * kg/reps/completed/order data. `updatedAt` is a full ISO timestamp.
 */
export interface ActiveWorkoutDraft {
  version: number;
  updatedAt: string;
  title: string;
  entries: WorkoutExerciseEntry[];
}

/** The slice of builder state the draft captures (and restores). */
export interface ActiveWorkoutSessionState {
  title: string;
  entries: WorkoutExerciseEntry[];
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

/** Minimal structural validation so a corrupt/legacy blob is ignored, not trusted. */
function isValidDraft(value: unknown): value is ActiveWorkoutDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.title === "string" &&
    typeof d.updatedAt === "string" &&
    Array.isArray(d.entries)
  );
}

/** Read the current draft, or null when absent/unreadable/invalid. Never throws. */
export function getActiveWorkoutDraft(): ActiveWorkoutDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_WORKOUT_DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidDraft(parsed)) return null;
    return {
      version:
        typeof parsed.version === "number" ? parsed.version : DRAFT_VERSION,
      updatedAt: parsed.updatedAt,
      title: parsed.title,
      entries: parsed.entries as WorkoutExerciseEntry[],
    };
  } catch {
    // Malformed JSON / unavailable storage — treat as "no draft".
    return null;
  }
}

/** Persist the draft. Fail-safe: a full/blocked storage never crashes the screen. */
export function saveActiveWorkoutDraft(draft: ActiveWorkoutDraft): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(
        ACTIVE_WORKOUT_DRAFT_KEY,
        JSON.stringify(draft),
      );
    } catch {
      // Storage full / unavailable — fail silently, matching `lib/storage.ts`.
    }
  }
  invalidate();
  notify();
}

/** Delete the draft slot. Used after a successful final save or explicit discard. */
export function clearActiveWorkoutDraft(): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
    } catch {
      // Ignore — nothing meaningful to recover from here.
    }
  }
  invalidate();
  notify();
}

/**
 * Is this draft worth surfacing? Prevents empty/stale-draft noise: a freshly
 * opened blank builder (no title, no exercises) is NOT meaningful, so it never
 * creates a draft or a restore prompt. A draft becomes meaningful once it holds
 * at least one exercise entry OR a non-empty (non-default) title.
 */
export function hasMeaningfulWorkoutDraft(
  draft: ActiveWorkoutDraft | null,
): boolean {
  if (!draft) return false;
  if (Array.isArray(draft.entries) && draft.entries.length > 0) return true;
  if (typeof draft.title === "string" && draft.title.trim().length > 0)
    return true;
  return false;
}

/** Build a draft from the builder's current session state (stamps `updatedAt`). */
export function toActiveWorkoutDraft(
  state: ActiveWorkoutSessionState,
): ActiveWorkoutDraft {
  return {
    version: DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
    title: state.title,
    entries: state.entries,
  };
}

/** Reduce a stored draft back to the builder's session-state slice for restore. */
export function fromActiveWorkoutDraft(
  draft: ActiveWorkoutDraft,
): ActiveWorkoutSessionState {
  return {
    title: typeof draft.title === "string" ? draft.title : "",
    entries: Array.isArray(draft.entries) ? draft.entries : [],
  };
}

/* ---------------------------- Reactive layer ---------------------------- */
// Mirrors `lib/welcome.ts`: a cached snapshot (so useSyncExternalStore gets a
// stable reference until the draft actually changes) plus a listener set that
// save/clear notify. Same-tab writes notify directly; other tabs come in via
// the `storage` event.

let cache: ActiveWorkoutDraft | null = null;
let cacheValid = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function invalidate(): void {
  cacheValid = false;
}

function snapshot(): ActiveWorkoutDraft | null {
  if (!cacheValid) {
    cache = getActiveWorkoutDraft();
    cacheValid = true;
  }
  return cache;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === ACTIVE_WORKOUT_DRAFT_KEY || event.key === null) {
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

/**
 * Reactive current draft. SSR / first-hydration snapshot is `null` (matching the
 * server HTML); the real client value swaps in right after mount, and updates
 * whenever the draft is saved or cleared anywhere in this tab.
 */
export function useActiveWorkoutDraft(): ActiveWorkoutDraft | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

const NOOP_SUBSCRIBE = () => () => {};

/**
 * Whether we are running on the client (post-hydration). `false` during SSR and
 * the hydration render, `true` afterwards — without any setState-in-effect, so
 * it is safe to use as a one-time gate before reading localStorage in render.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    NOOP_SUBSCRIBE,
    () => true,
    () => false,
  );
}
