// Calm, non-medical motivational copy for the water feature. Centralized so the
// tone stays consistent across the Today card, Nutrition card, and the detail
// screen — and so QA can assert on stable strings.

import { getWaterStatus, type WaterStatus } from "@/lib/water-status";

/**
 * Short progress line shown under the litres-of-goal figure on the compact
 * cards. Below the goal it stays purely motivating; at/over the goal it mirrors
 * the graduated, non-medical states from `getWaterStatus` so the compact card
 * and the detail-screen banner agree.
 */
export function waterStatusLine(totalMl: number, goalMl: number): string {
  if (goalMl <= 0) return "אפשר להגדיר יעד מים בהגדרות.";
  if (totalMl <= 0) return "כל כוס נחשבת — קדימה ליום ראשון 💧";

  const { status } = getWaterStatus(totalMl, goalMl);
  switch (status) {
    case "completed":
      return "הגעת ליעד המים היום 🎉";
    case "soft_over":
      return "עברת מעט את היעד שהגדרת";
    case "attention":
      return "שתית יותר מהיעד שהגדרת להיום";
    case "caution":
      return "חריגה משמעותית מהיעד שהגדרת";
    case "under_goal":
    default: {
      const pct = totalMl / goalMl;
      if (pct >= 0.75) return "עוד קצת ליעד היומי";
      if (pct >= 0.4) return "בקצב טוב, ממשיכים לשתות";
      return "התחלה יפה, נמשיך לאורך היום";
    }
  }
}

/** Neutral, non-medical framing shown on the detail screen. */
export const WATER_HELPER_COPY =
  "המעקב נועד לעזור לך לשמור על מודעות לאורך היום.";
export const WATER_GOAL_HINT =
  "אפשר לעדכן את היעד לפי ההרגשה והשגרה שלך.";

/**
 * Visual tone for the goal-completion / over-goal banner. Drives colours only —
 * the wording carries the meaning. Kept separate from `WaterStatus` so the copy
 * layer owns presentation decisions.
 */
export type WaterBannerTone = "celebrate" | "calm" | "attention" | "caution";

export interface WaterStatusCopy {
  tone: WaterBannerTone;
  /** Primary line. */
  title: string;
  /** Optional supporting line(s), shown smaller under the title. */
  lines: string[];
  /** Short label used inside the gauge area / chips (kept very short). */
  badge: string;
}

/**
 * Centralized, deliberately non-medical copy for each over-goal state. Wording
 * is framed against the user's *own configured goal* — never a universal health
 * claim, never "dangerous", "forbidden", or "you are at risk". The caution state
 * adds an explicit "this is not medical advice" line. See
 * docs/WATER_GOAL_UX_UPGRADE.md for the safety rationale.
 *
 * Returns `null` for `under_goal` so callers render the normal tracker with no
 * extra banner.
 */
export function waterStatusCopy(status: WaterStatus): WaterStatusCopy | null {
  switch (status) {
    case "completed":
      return {
        tone: "celebrate",
        title: "כל הכבוד! הגעת ליעד המים היומי שלך",
        lines: ["100% הושלם"],
        badge: "יעד הושלם",
      };
    case "soft_over":
      return {
        tone: "calm",
        title: "עברת מעט את יעד המים היומי שהגדרת",
        lines: ["שתייה לאורך היום זה דבר טוב — פשוט להמשיך להקשיב לגוף."],
        badge: "מעל היעד",
      };
    case "attention":
      return {
        tone: "attention",
        title: "שתית יותר מהיעד שהגדרת להיום",
        lines: ["שים לב לא לשתות מעבר לצורך."],
        badge: "מעל היעד",
      };
    case "caution":
      return {
        tone: "caution",
        title: "חריגה משמעותית מיעד המים היומי",
        lines: [
          "כדאי לעצור ולבדוק אם המשך שתייה באמת נחוץ.",
          "האפליקציה אינה מהווה ייעוץ רפואי.",
        ],
        badge: "חריגה מהיעד",
      };
    case "under_goal":
    default:
      return null;
  }
}
