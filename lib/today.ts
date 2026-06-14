// Today screen daily-guidance derivations. Pure, SSR-safe, no storage access —
// callers pass the store data in (same convention as `lib/analytics.ts`). This
// powers the Today "next action" card and the daily completion summary.
//
// Deliberately simple and deterministic: NO AI, NO personalization engine, NO
// recommendations, NO medical/diet logic. It only inspects what the user has
// already logged today and points at the next obvious step. Supplements are
// treated as OPTIONAL — they never make the day feel incomplete when none are
// configured. See `docs/TODAY_QUICK_START.md`.

import {
  activeSupplements,
  supplementDaySummary,
  todaysFoodLogs,
  todaysWaterMl,
  todaysWorkout,
} from "./analytics";
import type {
  FoodLog,
  Settings,
  Supplement,
  SupplementLog,
  WaterLog,
  WorkoutSession,
} from "./fitness-types";
import { todayISO } from "./utils";

/** The four daily pillars Today tracks. */
export type PillarKey = "water" | "nutrition" | "workout" | "supplement";

/** Module accent tone reused for gradients/glows (`<tone>-gradient`, etc.). */
export type ActionTone =
  | "water"
  | "nutrition"
  | "strength"
  | "supplement"
  | "energy";

export interface PillarStatus {
  key: PillarKey;
  /** Any activity logged today for this pillar. */
  done: boolean;
  /** True for supplements when none are configured — optional, not required. */
  optional: boolean;
}

export interface DailyCompletion {
  /** Required pillars completed today. */
  completed: number;
  /** Required pillars total — 3, or 4 when supplements are configured. */
  total: number;
  /** All required pillars are done. */
  allDone: boolean;
  /** Nothing logged across any required pillar yet (fresh day / new user). */
  fresh: boolean;
  /** All four pillars, in display order. Optional ones don't count toward total. */
  pillars: PillarStatus[];
}

/** The single next step suggested to the user. */
export interface NextAction {
  /** Which pillar (or "progress" when the day is mostly complete). */
  key: PillarKey | "progress";
  title: string;
  description: string;
  /** Where the primary CTA navigates. */
  href: string;
  /** Strong, short button label. */
  ctaLabel: string;
  tone: ActionTone;
  /** Suggested step is optional (e.g. supplements) rather than a core habit. */
  optional: boolean;
}

export interface DailyOverview {
  completion: DailyCompletion;
  nextAction: NextAction;
}

interface DailyInputs {
  workouts: WorkoutSession[];
  foodLogs: FoodLog[];
  waterLogs: WaterLog[];
  supplements: Supplement[];
  supplementLogs: SupplementLog[];
  settings: Settings;
}

/**
 * Derive the daily completion summary + next action from existing store data.
 *
 * Next-action priority (deterministic):
 *   1. No water today      → drink the first cup
 *   2. No nutrition today  → log the first food
 *   3. No workout today    → start the first workout
 *   4. Supplements configured but not all marked → mark them (OPTIONAL)
 *   5. Otherwise           → review progress / wrap up the day
 *
 * Supplements only enter the required count when the user has configured at
 * least one; with none configured they are surfaced as optional and never drag
 * the completion ratio down.
 */
export function dailyOverview(input: DailyInputs): DailyOverview {
  const today = todayISO();

  const waterDone = todaysWaterMl(input.waterLogs) > 0;
  const nutritionDone = todaysFoodLogs(input.foodLogs).length > 0;
  const workoutDone = todaysWorkout(input.workouts) !== null;

  const hasSupplements = activeSupplements(input.supplements).length > 0;
  const supp = supplementDaySummary(input.supplements, input.supplementLogs, today);
  // "Done" for supplements means every configured item is marked taken.
  const supplementsDone = hasSupplements && supp.allDone;

  const pillars: PillarStatus[] = [
    { key: "water", done: waterDone, optional: false },
    { key: "nutrition", done: nutritionDone, optional: false },
    { key: "workout", done: workoutDone, optional: false },
    { key: "supplement", done: supplementsDone, optional: !hasSupplements },
  ];

  const required = pillars.filter((p) => !p.optional);
  const completed = required.filter((p) => p.done).length;
  const total = required.length;

  const completion: DailyCompletion = {
    completed,
    total,
    allDone: completed === total,
    fresh: completed === 0,
    pillars,
  };

  return { completion, nextAction: pickNextAction({ waterDone, nutritionDone, workoutDone, hasSupplements, supplementsDone }) };
}

function pickNextAction(state: {
  waterDone: boolean;
  nutritionDone: boolean;
  workoutDone: boolean;
  hasSupplements: boolean;
  supplementsDone: boolean;
}): NextAction {
  if (!state.waterDone) {
    return {
      key: "water",
      title: "שתה כוס מים ראשונה",
      description: "שתה כוס מים ראשונה כדי לפתוח את היום.",
      href: "/nutrition/water",
      ctaLabel: "הוסף מים",
      tone: "water",
      optional: false,
    };
  }
  if (!state.nutritionDone) {
    return {
      key: "nutrition",
      title: "הוסף אוכל ראשון",
      description: "הוסף אוכל ראשון כדי להתחיל מעקב תזונה.",
      href: "/nutrition/add",
      ctaLabel: "הוסף אוכל",
      tone: "nutrition",
      optional: false,
    };
  }
  if (!state.workoutDone) {
    return {
      key: "workout",
      title: "התחל אימון ראשון",
      description: "התחל אימון ראשון כשאתה מוכן.",
      href: "/workouts?new=1",
      ctaLabel: "התחל אימון",
      tone: "strength",
      optional: false,
    };
  }
  // Supplements are optional — only suggested once the core habits are in motion
  // and only when the user actually tracks them.
  if (state.hasSupplements && !state.supplementsDone) {
    return {
      key: "supplement",
      title: "סמן את התוספים של היום",
      description: "סמן את התוספים שכבר לקחת — אופציונלי, רק אם רלוונטי לך.",
      href: "/nutrition/supplements",
      ctaLabel: "סמן תוספים",
      tone: "supplement",
      optional: true,
    };
  }
  return {
    key: "progress",
    title: "בדוק את ההתקדמות שלך",
    description: "בדוק את ההתקדמות שלך וסכם את היום.",
    href: "/progress",
    ctaLabel: "פתח התקדמות",
    tone: "energy",
    optional: false,
  };
}
