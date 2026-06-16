"use client";

// Personal Training Profile — Personal Profile V1.
//
// A small, OPTIONAL, fully editable profile that captures the user's workout
// preferences and goals so the app can later (NOT yet) tailor recommendations,
// templates and "Better Today" guidance. This phase only *collects and displays*
// the profile — it does NOT auto-generate a training program, and it makes NO
// medical, diet or fitness prescriptions.
//
// Safety boundaries (see docs/PERSONAL_PROFILE_V1.md):
//   • No body-shape / weight-judgment fields, no body-shaming labels, no
//     before/after goals, no comparisons to other people. All copy is supportive.
//   • `notes` is free text only — if the user writes about pain/injury it is
//     stored verbatim as a note; the app never diagnoses or advises on it.
//   • Profile is optional: the whole app works normally if it is never filled.
//
// Design mirrors `lib/gym-attendance.ts`: this module is the SINGLE owner of its
// one localStorage key, wraps it in a fail-safe + SSR-safe storage layer, parses
// defensively (unknown/invalid fields are dropped, never crash), and exposes a
// small `useSyncExternalStore` reactive layer so components observe it SSR-safely
// (server snapshot is `null`; the real value swaps in after hydration) and stay
// in sync across the same tab and other tabs. Local-only; no backend, no auth.

import { useSyncExternalStore } from "react";

/** The single localStorage key holding the personal training profile. */
export const PERSONAL_PROFILE_KEY = "yfos:personal-profile:v1";

/** Max length we keep for the free-text notes — defensive, never a hard limit a
 *  normal user hits. Longer input is truncated on save/parse, never rejected. */
export const NOTES_MAX_LENGTH = 2000;

/* ------------------------------- Options -------------------------------- */
// Canonical option values are the Hebrew labels themselves: the profile is a
// single-user, Hebrew, display-only record, so storing the label keeps the data
// self-describing (good for backup) and the summary needs no key→label map.
// Deliberately supportive wording — no "רזה", "להוריד שומן מהר", "חיטוב קיצוני"
// or any body-pressure phrasing.

export const GOAL_OPTIONS = [
  "להתחזק",
  "לבנות מסת שריר",
  "לשפר כושר כללי",
  "להתמיד בשגרה",
  "להתחיל מאפס",
  "לשפר טכניקה",
] as const;

export const LOCATION_OPTIONS = [
  "חדר כושר",
  "בית",
  "גם וגם",
  "עדיין לא קבוע",
] as const;

export const FREQUENCY_OPTIONS = [
  "2 פעמים",
  "3 פעמים",
  "4 פעמים",
  "5+ פעמים",
  "לא בטוח עדיין",
] as const;

export const EXPERIENCE_OPTIONS = [
  "מתחיל",
  "חוזר אחרי הפסקה",
  "בינוני",
  "מתקדם",
] as const;

export const DURATION_OPTIONS = [
  "עד 30 דקות",
  "30–45 דקות",
  "45–60 דקות",
  "יותר משעה",
] as const;

export const EQUIPMENT_OPTIONS = [
  "מכון מלא",
  "מכונות",
  "משקולות",
  "גומיות",
  "משקל גוף בלבד",
  "לא בטוח",
] as const;

/* -------------------------------- Types --------------------------------- */

/**
 * The personal training profile. Every preference field is OPTIONAL — a fresh
 * profile may have only some answers (or, transiently, none). `updatedAt` is the
 * one always-present field, stamped on each save.
 */
export interface TrainingProfile {
  goal?: string;
  location?: string;
  weeklyFrequency?: string;
  experience?: string;
  workoutDuration?: string;
  equipment?: string[];
  notes?: string;
  updatedAt: string;
}

/** The editable shape the form works with (no `updatedAt`; equipment always an array). */
export interface TrainingProfileInput {
  goal?: string;
  location?: string;
  weeklyFrequency?: string;
  experience?: string;
  workoutDuration?: string;
  equipment?: string[];
  notes?: string;
}

/* ----------------------------- Storage layer ---------------------------- */

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readRaw(): unknown {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PERSONAL_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeProfile(profile: TrainingProfile): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PERSONAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full / unavailable — fail silently, matching `lib/storage.ts`.
  }
}

function removeProfile(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(PERSONAL_PROFILE_KEY);
  } catch {
    // Ignore — nothing meaningful to recover from here.
  }
}

/* ------------------------------ Validation ------------------------------ */

/** Keep a single-select value only when it is a known option for that field. */
function pickOption(value: unknown, options: readonly string[]): string | undefined {
  return typeof value === "string" && options.includes(value) ? value : undefined;
}

/** Keep only the recognised equipment options, de-duped and order-preserved. */
function pickEquipment(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const item of value) {
    if (
      typeof item === "string" &&
      (EQUIPMENT_OPTIONS as readonly string[]).includes(item) &&
      !seen.has(item)
    ) {
      seen.add(item);
      kept.push(item);
    }
  }
  return kept.length > 0 ? kept : undefined;
}

/** Trim + cap free-text notes; empty becomes undefined. Never diagnoses. */
function pickNotes(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  return trimmed.slice(0, NOTES_MAX_LENGTH);
}

/**
 * Defensively turn any raw stored/imported value into a clean TrainingProfile,
 * or `null` when there is nothing usable. Unknown fields are ignored; invalid
 * field values are dropped (never throw). A record with `updatedAt` only (no
 * answers) still parses — it is simply an "empty" profile.
 */
export function sanitizeProfile(value: unknown): TrainingProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const profile: TrainingProfile = {
    goal: pickOption(v.goal, GOAL_OPTIONS),
    location: pickOption(v.location, LOCATION_OPTIONS),
    weeklyFrequency: pickOption(v.weeklyFrequency, FREQUENCY_OPTIONS),
    experience: pickOption(v.experience, EXPERIENCE_OPTIONS),
    workoutDuration: pickOption(v.workoutDuration, DURATION_OPTIONS),
    equipment: pickEquipment(v.equipment),
    notes: pickNotes(v.notes),
    updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : "",
  };
  // Drop keys that came back undefined so the stored object stays tidy.
  if (profile.goal === undefined) delete profile.goal;
  if (profile.location === undefined) delete profile.location;
  if (profile.weeklyFrequency === undefined) delete profile.weeklyFrequency;
  if (profile.experience === undefined) delete profile.experience;
  if (profile.workoutDuration === undefined) delete profile.workoutDuration;
  if (profile.equipment === undefined) delete profile.equipment;
  if (profile.notes === undefined) delete profile.notes;
  return profile;
}

/** True when a profile carries no actual answers (only the `updatedAt` stamp). */
export function isProfileEmpty(profile: TrainingProfile | null): boolean {
  if (!profile) return true;
  return (
    !profile.goal &&
    !profile.location &&
    !profile.weeklyFrequency &&
    !profile.experience &&
    !profile.workoutDuration &&
    !(profile.equipment && profile.equipment.length > 0) &&
    !profile.notes
  );
}

/* -------------------------------- Reads --------------------------------- */

/** The saved profile, defensively parsed, or `null` when none/unusable. */
export function getPersonalProfile(): TrainingProfile | null {
  return sanitizeProfile(readRaw());
}

/** True when a non-empty profile is saved on this device. */
export function hasPersonalProfile(): boolean {
  const profile = getPersonalProfile();
  return profile !== null && !isProfileEmpty(profile);
}

/* ------------------------------ Mutations ------------------------------- */

/**
 * Save the profile from the form input, stamping `updatedAt`. The input is run
 * through the same sanitizer so only valid answers are persisted. Returns the
 * stored profile.
 */
export function savePersonalProfile(
  input: TrainingProfileInput,
  now: Date = new Date(),
): TrainingProfile {
  const cleaned = sanitizeProfile({ ...input, updatedAt: now.toISOString() }) ?? {
    updatedAt: now.toISOString(),
  };
  const profile: TrainingProfile = { ...cleaned, updatedAt: now.toISOString() };
  writeProfile(profile);
  invalidate();
  notify();
  return profile;
}

/** Delete the profile entirely (the reset/delete action, confirm-gated in UI). */
export function clearPersonalProfile(): void {
  removeProfile();
  invalidate();
  notify();
}

/* ---------------------------- Reactive layer ---------------------------- */
// Mirrors `lib/gym-attendance.ts`: a cached snapshot (stable reference until the
// data actually changes) + a listener set that mutations notify. Same-tab writes
// notify directly; other tabs come in via the `storage` event.

let cache: TrainingProfile | null = null;
let cacheValid = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function invalidate(): void {
  cacheValid = false;
}

function snapshot(): TrainingProfile | null {
  if (!cacheValid) {
    cache = getPersonalProfile();
    cacheValid = true;
  }
  return cache;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PERSONAL_PROFILE_KEY || event.key === null) {
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

/** Reactive saved profile. SSR / first-hydration snapshot is `null`. */
export function usePersonalProfile(): TrainingProfile | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
