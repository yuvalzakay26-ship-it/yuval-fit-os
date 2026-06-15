// Photo-first nutrition logging — shared, CLIENT-SAFE module (Phase 3.xx).
//
// This file holds the types, constants, copy, and pure helpers used by BOTH the
// browser UI and the server route. It contains NO secrets and NO provider code —
// the AI key and the model call live only in `lib/nutrition-ai.ts` (server-only).
//
// Product rules encoded here:
//   • An AI photo result is always an ESTIMATE — never presented as exact.
//   • Nothing is saved without explicit user confirmation (see the review screen).
//   • A confirmed draft maps onto the EXISTING `FoodLog` shape and is written via
//     the existing `addFoodLog` path — no new storage key, no schema change.
//   • The image is used only for analysis and is never stored.
//
// See `docs/NUTRITION_PHOTO_ASSIST.md`.

import type { FoodLog, MealType } from "@/lib/fitness-types";
import {
  foodById,
  FOOD_LIBRARY,
  type FoodLibraryItem,
} from "@/lib/food-library";
import { createId, todayISO } from "@/lib/utils";

/* ------------------------------ Types ------------------------------ */

export type ConfidenceLevel = "high" | "medium" | "low";
export type PortionSize = "small" | "regular" | "large";

/** One detected food in an AI draft. All numbers are estimates. */
export interface PhotoDraftItem {
  nameHe: string;
  /** Set only when the detected food maps to a known library item. */
  matchedSourceFoodId?: string;
  estPortion: string;
  portionSize: PortionSize;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: ConfidenceLevel;
}

/** A successful, normalized AI draft. Never auto-saved. */
export interface PhotoDraft {
  ok: true;
  overallConfidence: ConfidenceLevel;
  items: PhotoDraftItem[];
  notes?: string;
}

/** Recoverable failure codes the route may return. */
export type PhotoErrorCode =
  | "disabled"
  | "too_large"
  | "bad_type"
  | "no_food"
  | "blurry"
  | "ai_unavailable"
  | "rate_limited"
  | "server_error";

export interface PhotoError {
  ok: false;
  error: PhotoErrorCode;
  messageHe: string;
}

/** The discriminated union returned by `POST /api/nutrition/analyze-photo`. */
export type PhotoAnalyzeResponse = PhotoDraft | PhotoError;

/** Capability payload returned by `GET /api/nutrition/analyze-photo`. */
export interface PhotoCapability {
  enabled: boolean;
}

/* ---------------------------- Constants ---------------------------- */

/** Reject anything larger before we ever touch the network. */
export const MAX_PHOTO_BYTES = 6 * 1024 * 1024; // ~6MB

/**
 * Accepted MIME types. HEIC is intentionally excluded: the vision provider does
 * not accept it and a client-side conversion is not trivial — we show a friendly
 * "unsupported type" message instead (see the requirements).
 */
export const ACCEPTED_PHOTO_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** `accept` attribute for the file input. */
export const PHOTO_ACCEPT_ATTR = ACCEPTED_PHOTO_MIME.join(",");

/* ------------------------------ Copy ------------------------------- */

/** Hebrew confidence labels shown on the review screen. */
export const CONFIDENCE_LABELS_HE: Record<ConfidenceLevel, string> = {
  high: "נראה די בטוח",
  medium: "כדאי לבדוק",
  low: "קשה לזהות חלק מהמנה",
};

export const PORTION_LABELS_HE: Record<PortionSize, string> = {
  small: "מנה קטנה",
  regular: "מנה רגילה",
  large: "מנה גדולה",
};

/**
 * Friendly Hebrew copy for every failure. `network` is a client-only pseudo-code
 * for a failed fetch (no response body); the rest mirror `PhotoErrorCode`.
 */
export const ERROR_COPY_HE: Record<PhotoErrorCode | "network", string> = {
  disabled: "ניתוח התמונה אינו זמין כרגע.",
  too_large: "התמונה גדולה מדי. נסה תמונה קטנה יותר.",
  bad_type: "סוג הקובץ לא נתמך. צלם תמונה או בחר JPG/PNG.",
  no_food: "לא זיהינו אוכל בתמונה. אפשר לנסות תמונה אחרת או להוסיף ידנית.",
  blurry: "התמונה קצת מטושטשת. אפשר לצלם שוב באור טוב יותר?",
  ai_unavailable: "הניתוח לא זמין כרגע. אפשר לנסות שוב או להוסיף ידנית.",
  rate_limited: "יותר מדי ניסיונות כרגע. נסה שוב עוד רגע.",
  server_error: "משהו השתבש בניתוח. אפשר לנסות שוב או להוסיף ידנית.",
  network: "אין חיבור כרגע. בדוק את האינטרנט ונסה שוב.",
};

/* --------------------------- Validation ---------------------------- */

/** Client-side guard run before any upload. Mirrors the server checks. */
export function validatePhotoFile(
  file: File,
): { ok: true } | { ok: false; error: PhotoErrorCode } {
  const type = (file.type || "").toLowerCase();
  if (!ACCEPTED_PHOTO_MIME.includes(type as (typeof ACCEPTED_PHOTO_MIME)[number])) {
    return { ok: false, error: "bad_type" };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: "too_large" };
  }
  return { ok: true };
}

/* --------------------------- Pure helpers -------------------------- */

/** Best-effort default meal by local time of day (user can always change it). */
export function guessMealType(hour: number = new Date().getHours()): MealType {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "snack";
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Try to link a detected food to a known library item so the review screen can
 * show a real thumbnail and the saved log can reuse the user's saved values.
 * Conservative on purpose: prefers an explicit id, then an exact name match,
 * then a contained-name match guarded by length so short words don't mis-match.
 */
export function matchLibraryItem(
  nameHe: string,
  matchedSourceFoodId?: string,
): FoodLibraryItem | undefined {
  if (matchedSourceFoodId) {
    const byId = foodById(matchedSourceFoodId);
    if (byId) return byId;
  }
  const q = normalizeName(nameHe);
  if (q.length < 2) return undefined;
  const exact = FOOD_LIBRARY.find((item) => normalizeName(item.nameHe) === q);
  if (exact) return exact;
  return FOOD_LIBRARY.find((item) => {
    const name = normalizeName(item.nameHe);
    if (name.length < 3) return false;
    return name.includes(q) || q.includes(name);
  });
}

/** Fields a confirmed review row contributes to a new journal entry. */
export interface ConfirmedDraftItem {
  foodName: string;
  quantityText: string;
  calories?: number;
  protein: number;
  carbs: number;
  fat: number;
  sourceFoodId?: string;
  imagePath?: string;
  category?: string;
}

/**
 * Build a brand-new `FoodLog` for today from a confirmed review row. Identical in
 * shape to what the manual form and "add again" produce — so a photo-originated
 * entry flows into the summary, diary, recent foods and backup with no special
 * casing. Optional fields are only included when present.
 */
export function buildFoodLogFromConfirmedItem(
  item: ConfirmedDraftItem,
  mealType: MealType,
): FoodLog {
  return {
    id: createId("food"),
    date: todayISO(),
    mealType,
    foodName: item.foodName.trim(),
    quantityText: item.quantityText.trim(),
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    ...(item.calories !== undefined ? { calories: item.calories } : {}),
    ...(item.imagePath ? { imagePath: item.imagePath } : {}),
    ...(item.category ? { category: item.category } : {}),
    ...(item.sourceFoodId ? { sourceFoodId: item.sourceFoodId } : {}),
  };
}
