// Local backup & restore for Yuval Fit OS (Phase 3.xx).
//
// Fit OS is a localStorage-first PWA with NO backend, NO auth and NO cloud. The
// honest promise of this module is therefore narrow and explicit: export the
// user's *own* data into a private JSON file they keep, and import that file
// back later. This is NOT cloud sync, NOT a server backup and NOT encryption.
//
// Design rules that keep restore SAFE:
//   • Validate the WHOLE backup before writing anything — never partially apply.
//   • Restore is a full "replace device state" for the included modules: a field
//     present with a value overwrites; a field present as `null` clears that key;
//     a field that is absent entirely is left untouched.
//   • Only Fit OS *user-data* keys are ever touched. The session/admin/welcome
//     gate flags and the backup-meta key itself are deliberately excluded — a
//     restore can never grant access or silently re-show gates.
//
// The helpers here are written to be pure/SSR-safe where possible; everything
// that touches `localStorage` is guarded by `isBrowser()` and fails safely.
//
// See `docs/BACKUP_RESTORE.md`.

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "./storage";
import { ACTIVE_WORKOUT_DRAFT_KEY } from "./active-workout-draft";
import { ACTIVE_GYM_VISIT_KEY, GYM_VISITS_KEY } from "./gym-attendance";
import { toISODate } from "./utils";

/** App marker stored in every backup so a foreign file is rejected on import. */
export const BACKUP_APP_NAME = "Fit OS";

/** The only backup schema version this build can read/write. */
export const BACKUP_VERSION = 1;

/** New, additive key holding lightweight backup bookkeeping (never user data). */
export const BACKUP_META_KEY = "yfos:backup-meta:v1";

/**
 * The data modules included in a backup. `field` is the friendly key inside
 * `backup.data`; `storageKey` is the real `localStorage` key it maps to. Driving
 * both export and restore from one table keeps them in lockstep and means the
 * storage keys stay the single source of truth (imported from `lib/storage.ts`
 * and `lib/active-workout-draft.ts`, never re-typed here).
 */
export interface BackupModule {
  field: string;
  storageKey: string;
  /** Friendly Hebrew label for the "what's included" UI. */
  label: string;
}

export const BACKUP_MODULES: BackupModule[] = [
  { field: "settings", storageKey: STORAGE_KEYS.settings, label: "הגדרות ויעדים" },
  { field: "workouts", storageKey: STORAGE_KEYS.workouts, label: "אימונים" },
  {
    field: "workoutTemplates",
    storageKey: STORAGE_KEYS.workoutTemplates,
    label: "תבניות אימון",
  },
  { field: "nutritionLogs", storageKey: STORAGE_KEYS.foodLogs, label: "רשומות תזונה" },
  {
    field: "savedFoodValues",
    storageKey: STORAGE_KEYS.savedFoodValues,
    label: "ערכי מאכלים שמורים",
  },
  {
    field: "favoriteFoods",
    storageKey: STORAGE_KEYS.favoriteFoods,
    label: "מאכלים מועדפים",
  },
  { field: "waterLogs", storageKey: STORAGE_KEYS.waterLogs, label: "יומני מים" },
  { field: "supplements", storageKey: STORAGE_KEYS.supplements, label: "תוספים" },
  {
    field: "supplementLogs",
    storageKey: STORAGE_KEYS.supplementLogs,
    label: "יומן תוספים",
  },
  { field: "gymVisits", storageKey: GYM_VISITS_KEY, label: "ביקורים במכון" },
  {
    field: "activeGymVisit",
    storageKey: ACTIVE_GYM_VISIT_KEY,
    label: "שהייה פעילה במכון",
  },
  {
    field: "activeWorkoutDraft",
    storageKey: ACTIVE_WORKOUT_DRAFT_KEY,
    label: "טיוטת אימון פעיל",
  },
];

/**
 * Keys that must NEVER enter a backup or be touched by a restore. Listed
 * explicitly (rather than "everything not in BACKUP_MODULES") so the exclusion
 * is a deliberate, documented contract — gate/access state is not "data".
 */
export const EXCLUDED_KEYS: readonly string[] = [
  "yfos:welcome-seen:v1",
  "yfos:private-access-notice-accepted:session",
  "yfos:admin-access-granted:v1",
  BACKUP_META_KEY,
];

export interface Backup {
  app: typeof BACKUP_APP_NAME;
  backupVersion: number;
  createdAt: string;
  source: "local";
  /** Map of `BackupModule.field` → parsed stored value (or `null` when empty). */
  data: Record<string, unknown>;
}

export interface BackupMeta {
  lastExportedAt?: string;
  lastRestoredAt?: string;
  lastRestoredBackupCreatedAt?: string;
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

/** Read + parse one storage key, returning `null` when absent/unreadable. */
function readKey(storageKey: string): unknown {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/**
 * Is an active-workout draft worth keeping in a backup? Mirrors
 * `hasMeaningfulWorkoutDraft` without importing the whole reactive module: a
 * blank builder (no title, no exercises) is noise and is stored as `null`.
 */
function isMeaningfulDraft(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  if (Array.isArray(d.entries) && d.entries.length > 0) return true;
  if (typeof d.title === "string" && d.title.trim().length > 0) return true;
  return false;
}

/**
 * Build a full snapshot Backup from the current device. Every known module is
 * always represented (with `null` when its key is empty), so a restore is an
 * unambiguous "make the device look like this backup" — including clearing
 * modules that were empty when the backup was taken.
 */
export function createBackup(now: Date = new Date()): Backup {
  const data: Record<string, unknown> = {};
  for (const mod of BACKUP_MODULES) {
    const value = readKey(mod.storageKey);
    if (mod.field === "activeWorkoutDraft") {
      data[mod.field] = isMeaningfulDraft(value) ? value : null;
    } else {
      data[mod.field] = value;
    }
  }
  return {
    app: BACKUP_APP_NAME,
    backupVersion: BACKUP_VERSION,
    createdAt: now.toISOString(),
    source: "local",
    data,
  };
}

/** Pretty-print a backup as the exact JSON text that gets downloaded/copied. */
export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

/** Suggested download filename, e.g. `fit-os-backup-2026-06-14.json`. */
export function backupFilename(now: Date = new Date()): string {
  return `fit-os-backup-${toISODate(now)}.json`;
}

/* ------------------------------ Validation ------------------------------ */

export type BackupErrorCode =
  | "invalid-json"
  | "not-fit-os"
  | "unsupported-version"
  | "missing-data";

export type ParseResult =
  | { ok: true; backup: Backup }
  | { ok: false; error: BackupErrorCode };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate an already-parsed value as a Fit OS backup. Checks, in order: shape,
 * app marker, supported version, and presence of the `data` object. Returns a
 * typed error code (mapped to a Hebrew message in the UI) and never throws.
 */
export function validateBackup(value: unknown): ParseResult {
  if (!isObject(value)) return { ok: false, error: "not-fit-os" };
  if (value.app !== BACKUP_APP_NAME) return { ok: false, error: "not-fit-os" };
  const version = value.backupVersion;
  if (typeof version !== "number" || version > BACKUP_VERSION) {
    return { ok: false, error: "unsupported-version" };
  }
  if (!isObject(value.data)) return { ok: false, error: "missing-data" };
  return {
    ok: true,
    backup: {
      app: BACKUP_APP_NAME,
      backupVersion: version,
      createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
      source: "local",
      data: value.data,
    },
  };
}

/** Parse raw JSON text and validate it as a backup in one safe step. */
export function parseBackupJson(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalid-json" };
  }
  return validateBackup(parsed);
}

/* ------------------------------- Preview -------------------------------- */

export interface BackupPreview {
  createdAt: string;
  backupVersion: number;
  workouts: number;
  workoutTemplates: number;
  nutritionEntries: number;
  waterDays: number;
  supplements: number;
  supplementLogs: number;
  savedFoodValues: number;
  favoriteFoods: number;
  gymVisits: number;
  settingsIncluded: boolean;
  activeDraftIncluded: boolean;
  activeGymVisitIncluded: boolean;
  /** True when no module carries any user data — a friendly "empty backup" hint. */
  isEmpty: boolean;
}

function arrayLen(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function recordCount(value: unknown): number {
  return isObject(value) ? Object.keys(value).length : 0;
}

/**
 * Summarize a validated backup for the confirm-before-restore preview. Missing
 * or malformed fields degrade to `0` / `false` rather than throwing, so even a
 * partial third-party backup previews cleanly.
 */
export function previewBackup(backup: Backup): BackupPreview {
  const d = backup.data ?? {};
  const workouts = arrayLen(d.workouts);
  const workoutTemplates = arrayLen(d.workoutTemplates);
  const nutritionEntries = arrayLen(d.nutritionLogs);
  const waterDays = arrayLen(d.waterLogs);
  const supplements = arrayLen(d.supplements);
  const supplementLogs = arrayLen(d.supplementLogs);
  const savedFoodValues = recordCount(d.savedFoodValues);
  const favoriteFoods = recordCount(d.favoriteFoods);
  const gymVisits = arrayLen(d.gymVisits);
  const settingsIncluded = isObject(d.settings);
  const activeDraftIncluded = isMeaningfulDraft(d.activeWorkoutDraft);
  const activeGymVisitIncluded = isObject(d.activeGymVisit);
  const isEmpty =
    workouts +
      workoutTemplates +
      nutritionEntries +
      waterDays +
      supplements +
      supplementLogs +
      savedFoodValues +
      favoriteFoods +
      gymVisits ===
      0 &&
    !settingsIncluded &&
    !activeDraftIncluded &&
    !activeGymVisitIncluded;
  return {
    createdAt: backup.createdAt,
    backupVersion: backup.backupVersion,
    workouts,
    workoutTemplates,
    nutritionEntries,
    waterDays,
    supplements,
    supplementLogs,
    savedFoodValues,
    favoriteFoods,
    gymVisits,
    settingsIncluded,
    activeDraftIncluded,
    activeGymVisitIncluded,
    isEmpty,
  };
}

/* ------------------------------- Restore -------------------------------- */

export type RestoreResult = { ok: true } | { ok: false; error: "write-failed" };

/**
 * Apply a validated backup to `localStorage`. For each known module the backup
 * *includes* (the field is present in `data`): a non-null value is written, a
 * `null` clears the key. Modules absent from the backup are left untouched, as
 * are all excluded gate/meta keys. Writes are attempted only after validation,
 * so a rejected backup never mutates anything.
 */
export function restoreBackup(backup: Backup): RestoreResult {
  if (!isBrowser()) return { ok: false, error: "write-failed" };
  const data = backup.data ?? {};
  try {
    for (const mod of BACKUP_MODULES) {
      if (!Object.prototype.hasOwnProperty.call(data, mod.field)) continue;
      const value = data[mod.field];
      if (value === null || value === undefined) {
        window.localStorage.removeItem(mod.storageKey);
      } else {
        window.localStorage.setItem(mod.storageKey, JSON.stringify(value));
      }
    }
  } catch {
    return { ok: false, error: "write-failed" };
  }
  updateBackupMeta({
    lastRestoredAt: new Date().toISOString(),
    lastRestoredBackupCreatedAt: backup.createdAt || undefined,
  });
  return { ok: true };
}

/* ----------------------------- Backup meta ------------------------------ */

/** Read the small backup bookkeeping record. Never throws; `{}` when absent. */
export function getBackupMeta(): BackupMeta {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(BACKUP_META_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isObject(parsed) ? (parsed as BackupMeta) : {};
  } catch {
    return {};
  }
}

/** Merge a patch into the backup meta. Fail-safe: a blocked write is ignored. */
export function updateBackupMeta(patch: Partial<BackupMeta>): BackupMeta {
  const next = { ...getBackupMeta(), ...patch };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(BACKUP_META_KEY, JSON.stringify(next));
    } catch {
      // Storage full / unavailable — meta is best-effort, never required.
    }
  }
  invalidateMeta();
  notifyMeta();
  return next;
}

/** Record that an export just happened (used for the "last backup" status). */
export function markExported(now: Date = new Date()): void {
  updateBackupMeta({ lastExportedAt: now.toISOString() });
}

/* --------------------------- Reactive meta layer ------------------------ */
// Mirrors `lib/active-workout-draft.ts`: a cached snapshot (so
// useSyncExternalStore gets a stable reference until the meta actually changes)
// plus a listener set that meta writes notify. Keeps the "last export / restore"
// status reading SSR-safe (server snapshot is `{}`) without setState-in-effect.

const EMPTY_META: BackupMeta = {};
let metaCache: BackupMeta = EMPTY_META;
let metaCacheValid = false;
const metaListeners = new Set<() => void>();

function notifyMeta(): void {
  metaListeners.forEach((listener) => listener());
}

function invalidateMeta(): void {
  metaCacheValid = false;
}

function metaSnapshot(): BackupMeta {
  if (!metaCacheValid) {
    metaCache = getBackupMeta();
    metaCacheValid = true;
  }
  return metaCache;
}

function subscribeMeta(callback: () => void): () => void {
  metaListeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === BACKUP_META_KEY || event.key === null) {
      invalidateMeta();
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    metaListeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Reactive backup meta. SSR / first-hydration snapshot is `{}` (matching the
 * server HTML); the real client value swaps in after mount and updates whenever
 * an export or restore writes the meta.
 */
export function useBackupMeta(): BackupMeta {
  return useSyncExternalStore(subscribeMeta, metaSnapshot, () => EMPTY_META);
}
