// Nutrition quick reuse — pure helpers for "אכלת לאחרונה" (recent foods) and
// "הוסף שוב" (add again). Everything here is derived from the existing
// `FoodLog[]` history — there is NO new storage key and NO new data model. A
// recent food is just a previously logged entry surfaced for one-tap re-logging,
// and "add again" simply creates a brand-new `FoodLog` from an existing one.
//
// Macros are carried over verbatim from what the user already entered — nothing
// is inferred. Re-logging a food never reads an external database or image.
//
// These functions are pure (no storage access) so they stay SSR-safe and
// testable; callers pass the logs in and persist the result via the store
// (`addFoodLog`). See `docs/NUTRITION_QUICK_REUSE.md`.

import type { FoodLog } from "@/lib/fitness-types";
import { createId, todayISO } from "@/lib/utils";

/**
 * Stable identity for a logged food so the recent list never repeats the same
 * food + portion + macros back-to-back. Prefers the library `sourceFoodId` when
 * present, otherwise the normalized food name, then folds in the quantity and
 * the macro values so two genuinely different portions of the same food can both
 * appear. Deterministic — same entry always yields the same key.
 */
export function normalizeRecentFoodKey(entry: FoodLog): string {
  const identity =
    entry.sourceFoodId?.trim() || entry.foodName.trim().toLowerCase();
  const quantity = (entry.quantityText || "").trim().toLowerCase();
  const macros = `${entry.protein}|${entry.carbs}|${entry.fat}|${entry.calories ?? ""}`;
  return `${identity}@@${quantity}@@${macros}`;
}

/**
 * Most-recently logged foods, de-duplicated, newest first. `logs` arrive
 * newest-date-first from storage; we keep the first (most recent) entry seen per
 * unique key and cap the list so the section stays light. The returned entries
 * are the real (most recent) `FoodLog`s — callers must never mutate them; use
 * `createFoodLogFromExistingEntry` to re-log.
 */
export function getRecentFoodEntries(logs: FoodLog[], limit = 8): FoodLog[] {
  const seen = new Set<string>();
  const recents: FoodLog[] = [];
  for (const log of logs) {
    const key = normalizeRecentFoodKey(log);
    if (seen.has(key)) continue;
    seen.add(key);
    recents.push(log);
    if (recents.length >= limit) break;
  }
  return recents;
}

/**
 * Build a brand-new `FoodLog` for today from an existing entry, preserving the
 * food's identity and the user's previously entered values. The original entry
 * is never mutated: a fresh `id` and today's local date are assigned, and only
 * the fields present on the source are copied (so optional fields stay optional
 * and old logs without them produce clean new logs). This is what powers
 * "הוסף שוב".
 */
export function createFoodLogFromExistingEntry(entry: FoodLog): FoodLog {
  return {
    id: createId("food"),
    date: todayISO(),
    mealType: entry.mealType,
    foodName: entry.foodName,
    quantityText: entry.quantityText,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    ...(entry.calories !== undefined ? { calories: entry.calories } : {}),
    ...(entry.notes ? { notes: entry.notes } : {}),
    ...(entry.imagePath ? { imagePath: entry.imagePath } : {}),
    ...(entry.category ? { category: entry.category } : {}),
    ...(entry.sourceFoodId ? { sourceFoodId: entry.sourceFoodId } : {}),
  };
}

/** Alias that reads naturally at call sites. Same behavior as above. */
export const duplicateFoodLogForToday = createFoodLogFromExistingEntry;
