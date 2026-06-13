// Centralized labels + calm, safety-first copy for the supplements feature.
// Kept in one place so the tone stays consistent across Today, the full screen,
// and the add/edit form — and so QA can assert on stable strings.
//
// Hard product boundary: this is a personal tracking tool. Copy NEVER recommends
// a supplement, NEVER suggests a dosage, and NEVER frames substances as
// good/bad, natural/unnatural, or as drug use. It only helps the user record
// items they already decided to track.

import type {
  SupplementCategory,
  SupplementTiming,
} from "@/lib/fitness-types";

/** Neutral category labels (Hebrew). Display only — no judgement, no advice. */
export const SUPPLEMENT_CATEGORY_LABELS: Record<SupplementCategory, string> = {
  vitamin: "ויטמינים",
  mineral: "מינרלים",
  protein: "חלבון / תזונה",
  performance: "ביצועים ואימון",
  "general-health": "בריאות כללית",
  "doctor-recommended": "בהמלצת איש מקצוע",
  other: "אחר",
};

export const SUPPLEMENT_CATEGORY_ORDER: SupplementCategory[] = [
  "vitamin",
  "mineral",
  "protein",
  "performance",
  "general-health",
  "doctor-recommended",
  "other",
];

/** Time-of-day labels (Hebrew). */
export const SUPPLEMENT_TIMING_LABELS: Record<SupplementTiming, string> = {
  morning: "בוקר",
  noon: "צהריים",
  evening: "ערב",
  "pre-workout": "לפני אימון",
  "post-workout": "אחרי אימון",
  other: "אחר",
};

export const SUPPLEMENT_TIMING_ORDER: SupplementTiming[] = [
  "morning",
  "noon",
  "evening",
  "pre-workout",
  "post-workout",
  "other",
];

/* ------------------------------ Safety copy ------------------------------ */
// Calm and responsible, never scary. Surfaced on the full screen and the form.

export const SUPPLEMENT_SAFETY_PRIMARY =
  "המעקב הוא אישי בלבד ואינו מהווה המלצה רפואית.";
export const SUPPLEMENT_SAFETY_SECONDARY =
  "בתוספים או תרופות, כדאי להתייעץ עם הורה, רופא או איש מקצוע מתאים.";

/** Helper line under the full-screen header. */
export const SUPPLEMENT_HELPER_COPY =
  "סמן מה לקחת היום ושמור על שגרה מסודרת.";

/** Neutral note next to the free-text dosage field — it is a note, not advice. */
export const SUPPLEMENT_DOSAGE_HINT =
  "טקסט חופשי שאתה כותב — האפליקציה לא מציעה מינונים.";

/** Short progress line shown under the daily completion figure. */
export function supplementStatusLine(taken: number, active: number): string {
  if (active === 0) return "אפשר להוסיף פריטים למעקב אישי.";
  if (taken >= active) return "כל הכבוד! סימנת את כל התוספים להיום 🎉";
  if (taken === 0) return "עוד לא סימנת תוסף היום";
  return `נותרו ${active - taken} לסימון היום`;
}
