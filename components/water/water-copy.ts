// Calm, non-medical motivational copy for the water feature. Centralized so the
// tone stays consistent across the Today card, Nutrition card, and the detail
// screen — and so QA can assert on stable strings.

/** Short progress line shown under the litres-of-goal figure. */
export function waterStatusLine(totalMl: number, goalMl: number): string {
  if (goalMl <= 0) return "אפשר להגדיר יעד מים בהגדרות.";
  if (totalMl <= 0) return "כל כוס נחשבת — קדימה ליום ראשון 💧";
  if (totalMl >= goalMl) return "הגעת ליעד המים היום 🎉";
  const pct = totalMl / goalMl;
  if (pct >= 0.75) return "עוד קצת ליעד היומי";
  if (pct >= 0.4) return "בקצב טוב, ממשיכים לשתות";
  return "התחלה יפה, נמשיך לאורך היום";
}

/** Neutral, non-medical framing shown on the detail screen. */
export const WATER_HELPER_COPY =
  "המעקב נועד לעזור לך לשמור על מודעות לאורך היום.";
export const WATER_GOAL_HINT =
  "אפשר לעדכן את היעד לפי ההרגשה והשגרה שלך.";
