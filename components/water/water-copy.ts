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

/**
 * Shared colour treatment per water status, so every surface (Today card,
 * Nutrition card, water detail) shifts together: blue while on track / completed,
 * amber once meaningfully over the goal, rose for a significant over-goal. Pure
 * class tokens + a couple of inline CSS vars to retint the gauge fill — no logic.
 *
 * The progression the user asked for: normal/completed reads blue/water-like;
 * attention warms to amber; caution clearly becomes rose/red.
 */
export interface WaterStatusTheme {
  /** Card background wash class (module tint or amber/rose fill). */
  module: string;
  /** Accent text colour for the small label + status line. */
  accentText: string;
  /** "Open" chip background + text. */
  chip: string;
  /** Soft colour for the decorative glow blob behind the card. */
  glowBg: string;
  /** Emphasis shadow (used to make the completed state feel premium). */
  glow: string;
  /** Inline vars that retint the gauge fill; undefined keeps the default blue. */
  gaugeVars?: Record<string, string>;
}

export function waterStatusTheme(status: WaterStatus): WaterStatusTheme {
  switch (status) {
    case "attention":
      return {
        module: "bg-amber-50 dark:bg-amber-400/10",
        accentText: "text-amber-700 dark:text-amber-300",
        chip: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
        glowBg: "rgba(245, 158, 11, 0.14)",
        glow: "",
        gaugeVars: { "--water-from": "#fbbf24", "--water-to": "#f59e0b" },
      };
    case "caution":
      return {
        module: "bg-rose-50 dark:bg-rose-500/10",
        accentText: "text-rose-700 dark:text-rose-300",
        chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
        glowBg: "rgba(244, 63, 94, 0.14)",
        glow: "",
        gaugeVars: { "--water-from": "#fb7185", "--water-to": "#e11d48" },
      };
    case "completed":
      // Celebratory blue — same water hue, but lifted with a glow.
      return {
        module: "module-water",
        accentText: "text-[color:var(--accent-water)]",
        chip: "bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]",
        glowBg: "var(--accent-water-soft)",
        glow: "shadow-glow-water",
      };
    case "soft_over":
    case "under_goal":
    default:
      return {
        module: "module-water",
        accentText: "text-[color:var(--accent-water)]",
        chip: "bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]",
        glowBg: "var(--accent-water-soft)",
        glow: "",
      };
  }
}

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
