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

/* ----------------------- Starter library (copy) ----------------------- */
// The common-supplements library is a set of quick-add *templates* only. Copy
// here never recommends taking anything — it only describes a faster way to fill
// the form. The user still owns and edits the actual entry.

export const SUPPLEMENT_LIBRARY_TITLE = "תוספים נפוצים";
export const SUPPLEMENT_LIBRARY_HELPER =
  "בחר פריט להתחלה מהירה — השם והקטגוריה ימולאו עבורך, ותמיד אפשר לערוך לפני שמירה.";
/** Tiny reassurance under the library — reinforces that this is not advice. */
export const SUPPLEMENT_LIBRARY_NOTE =
  "המאגר נועד למילוי מהיר בלבד ואינו המלצה רפואית.";
/** Label for the all-categories tab in the library browser. */
export const SUPPLEMENT_LIBRARY_ALL = "הכל";

/** Search box placeholder for the starter library. */
export const SUPPLEMENT_LIBRARY_SEARCH_PLACEHOLDER =
  "חיפוש תוסף — בעברית או באנגלית";
/** Empty-search state for the library (title + calm hint). */
export const SUPPLEMENT_LIBRARY_EMPTY_TITLE = "לא נמצאו תוספים תואמים";
export const SUPPLEMENT_LIBRARY_EMPTY_HINT = "אפשר להוסיף ידנית בכל רגע.";

/** Badge shown on a library card whose template is already in the tracker. */
export const SUPPLEMENT_ALREADY_TRACKED = "כבר במעקב";
/** Tiny line on a tracked card inviting the user to open the existing entry. */
export const SUPPLEMENT_TRACKED_OPEN = "פתח לעריכה";

/* ----------------------- Selected template summary ---------------------- */

/** Eyebrow label above the chosen-template summary on the add screen. */
export const SUPPLEMENT_TEMPLATE_SELECTED_LABEL = "תבנית נבחרה";
/** Reassurance that the chosen template is still fully editable before saving. */
export const SUPPLEMENT_TEMPLATE_EDITABLE = "אפשר לערוך הכול לפני שמירה.";
/** Action that clears the chosen template back to a blank manual entry. */
export const SUPPLEMENT_TEMPLATE_CLEAR = "נקה בחירה";

/** Short progress line shown under the daily completion figure. */
export function supplementStatusLine(taken: number, active: number): string {
  if (active === 0) return "אפשר להוסיף פריטים למעקב אישי.";
  if (taken >= active) return "כל הכבוד! סימנת את כל התוספים להיום 🎉";
  if (taken === 0) return "עוד לא סימנת תוסף היום";
  return `נותרו ${active - taken} לסימון היום`;
}
