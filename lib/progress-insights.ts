// Progress screen insight derivations. Pure, SSR-safe, no storage access —
// callers pass the store data in (same convention as `lib/analytics.ts` and
// `lib/today.ts`). This powers the Progress "weekly hero", the rule-based weekly
// insight cards, the 7-day activity trends, and the personal-records list.
//
// Deliberately simple and deterministic: NO AI, NO personalization engine, NO
// recommendations, NO medical/diet logic, NO new data model. It only inspects
// what the user has already logged and reflects it back with calm, motivating
// copy. Empty data becomes a friendly, human empty state — never a misleading
// zero or a lonely dash. See `docs/PROGRESS_INSIGHTS_UPGRADE.md`.

import type {
  FoodLog,
  WaterLog,
  WorkoutSession,
} from "./fitness-types";
import { startOfWeekISO, toISODate, todayISO } from "./utils";

/* ------------------------------- Shared ------------------------------- */

/** Module accent tone reused for gradients/glows on the Progress screen. */
export type InsightTone = "strength" | "water" | "nutrition" | "energy";

/** Icon identity key — resolved to an SVG in the view (keeps this lib React-free). */
export type InsightIcon =
  | "workout"
  | "water"
  | "nutrition"
  | "trophy"
  | "calendar"
  | "spark"
  | "flame";

/** Add `days` to a local ISO date without timezone drift. */
function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Short Hebrew weekday letters, Sunday-first (matches `startOfWeekISO`). */
const WEEKDAY_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"] as const;

/** Distinct days in the current week (date >= weekStart) with any matching log. */
function daysThisWeek(dates: Iterable<string>): Set<string> {
  const weekStart = startOfWeekISO();
  const set = new Set<string>();
  for (const date of dates) {
    if (date >= weekStart) set.add(date);
  }
  return set;
}

/* ----------------------------- Weekly hero ----------------------------- */

export interface WeeklyHero {
  workoutsThisWeek: number;
  totalWorkouts: number;
  waterTodayMl: number;
  /** Distinct days this week with any water logged. */
  waterDaysThisWeek: number;
  /** Average daily protein across logged days, or null when not enough data. */
  proteinDailyAverage: number | null;
  /** Distinct days this week with any nutrition logged. */
  nutritionDaysThisWeek: number;
  /** A single calm, motivating insight line driven by the data. */
  message: string;
}

/**
 * Build the premium weekly summary shown at the top of Progress. The `message`
 * is chosen by a deterministic priority so the screen "tells a story": it leads
 * with the most useful next nudge (start a workout, build momentum, add more
 * nutrition data) and falls back to calm positive reinforcement.
 */
export function weeklyHero(
  workouts: WorkoutSession[],
  foodLogs: FoodLog[],
  waterLogs: WaterLog[],
): WeeklyHero {
  const weekStart = startOfWeekISO();
  const workoutsThisWeek = workouts.filter((w) => w.date >= weekStart).length;

  const waterTodayMl =
    waterLogs.find((l) => l.date === todayISO())?.totalMl ?? 0;
  const waterDaysThisWeek = [
    ...daysThisWeek(waterLogs.filter((l) => l.totalMl > 0).map((l) => l.date)),
  ].length;

  // Average protein per logged day (any food log on that day).
  const byDay = new Map<string, number>();
  for (const log of foodLogs) {
    byDay.set(log.date, (byDay.get(log.date) ?? 0) + log.protein);
  }
  const proteinDailyAverage =
    byDay.size === 0
      ? null
      : Math.round([...byDay.values()].reduce((a, b) => a + b, 0) / byDay.size);
  const nutritionDaysThisWeek = [...daysThisWeek(byDay.keys())].length;

  return {
    workoutsThisWeek,
    totalWorkouts: workouts.length,
    waterTodayMl,
    waterDaysThisWeek,
    proteinDailyAverage,
    nutritionDaysThisWeek,
    message: heroMessage({
      workoutsThisWeek,
      proteinDailyAverage,
      nutritionDaysThisWeek,
      waterTodayMl,
    }),
  };
}

function heroMessage(state: {
  workoutsThisWeek: number;
  proteinDailyAverage: number | null;
  nutritionDaysThisWeek: number;
  waterTodayMl: number;
}): string {
  if (state.workoutsThisWeek === 0) {
    return "עדיין לא נרשמו אימונים השבוע — התחל אימון ראשון כדי לבנות רצף.";
  }
  if (state.workoutsThisWeek === 1) {
    return "ביצעת אימון אחד השבוע — עוד אימון אחד ייתן תמונה טובה יותר על ההתקדמות שלך.";
  }
  if (state.proteinDailyAverage == null || state.nutritionDaysThisWeek < 2) {
    return "עדיין אין מספיק נתוני תזונה — הוסף עוד כמה ימי תזונה כדי לראות ממוצעים מדויקים.";
  }
  return `שבוע חזק — ${state.workoutsThisWeek} אימונים השבוע. שמור על המומנטום.`;
}

/* --------------------------- Weekly insights --------------------------- */
// Simple rule-based cards. Supportive and practical — no advice, no pressure.

export interface InsightCard {
  id: string;
  tone: InsightTone;
  icon: InsightIcon;
  title: string;
  text: string;
}

interface InsightInputs {
  workouts: WorkoutSession[];
  foodLogs: FoodLog[];
  waterLogs: WaterLog[];
}

/**
 * Derive the "תובנות השבוע" cards. Each is a small, honest reflection of the
 * user's existing data — never generated advice. The cards are returned in a
 * stable, meaningful order; the view caps how many it shows.
 */
export function weeklyInsights(input: InsightInputs): InsightCard[] {
  const hero = weeklyHero(input.workouts, input.foodLogs, input.waterLogs);
  const cards: InsightCard[] = [];

  // Workouts — momentum or a gentle start nudge.
  if (hero.workoutsThisWeek > 0) {
    cards.push({
      id: "workouts-started",
      tone: "strength",
      icon: "workout",
      title: "יש לך התחלה טובה השבוע",
      text:
        hero.workoutsThisWeek === 1
          ? "אימון אחד נרשם השבוע — כל אימון נוסף בונה את הרצף."
          : `${hero.workoutsThisWeek} אימונים השבוע — אתה שומר על רצף יפה.`,
    });
  } else {
    cards.push({
      id: "workouts-none",
      tone: "strength",
      icon: "workout",
      title: "עדיין לא התחלת אימון השבוע",
      text: "התחל אימון ראשון כדי לבנות רצף לשבוע הזה.",
    });
  }

  // Last workout context — what you trained most recently.
  const lastWorkout = input.workouts[0] ?? null;
  if (lastWorkout) {
    cards.push({
      id: "last-workout",
      tone: "energy",
      icon: "calendar",
      title: "האימון האחרון שלך",
      text: lastWorkout.title,
    });
  }

  // Water — only flag when today is still empty (a useful, timely nudge).
  if (hero.waterTodayMl === 0) {
    cards.push({
      id: "water-today",
      tone: "water",
      icon: "water",
      title: "עדיין לא נרשמו מים היום",
      text: "רשום את הכוס הראשונה כדי להתחיל לעקוב אחרי השתייה.",
    });
  }

  // Nutrition — not enough data to compute a meaningful average yet.
  if (hero.proteinDailyAverage == null || hero.nutritionDaysThisWeek < 2) {
    cards.push({
      id: "nutrition-data",
      tone: "nutrition",
      icon: "nutrition",
      title: "צריך עוד נתוני תזונה",
      text: "הוסף עוד כמה ימי תזונה כדי לחשב ממוצע חלבון מדויק.",
    });
  }

  // Personal records — strength is starting to show.
  if (personalRecords(input.workouts).length > 0) {
    cards.push({
      id: "records",
      tone: "energy",
      icon: "trophy",
      title: "יש לך שיאים שמתחילים להיבנות",
      text: "השיאים האישיים שלך מופיעים למטה — נסה לשפר אותם בהדרגה.",
    });
  }

  return cards;
}

/* ----------------------------- Weekly trends --------------------------- */
// A compact 7-day (Sun→Sat) activity grid per pillar. Visual motivation, not a
// chart — each day is simply "logged something" / "nothing" / "still ahead".

export type DayState = "done" | "empty" | "future";

export interface ActivityDay {
  iso: string;
  /** Short Hebrew weekday letter (א…ש). */
  label: string;
  state: DayState;
  isToday: boolean;
}

export interface ActivityRow {
  key: "workouts" | "water" | "nutrition";
  label: string;
  tone: InsightTone;
  icon: InsightIcon;
  days: ActivityDay[];
  /** How many days this week were active. */
  count: number;
}

function buildRow(
  key: ActivityRow["key"],
  label: string,
  tone: InsightTone,
  icon: InsightIcon,
  activeDates: Set<string>,
): ActivityRow {
  const weekStart = startOfWeekISO();
  const today = todayISO();
  let count = 0;
  const days: ActivityDay[] = WEEKDAY_LETTERS.map((letter, i) => {
    const iso = addDaysISO(weekStart, i);
    const done = activeDates.has(iso);
    if (done) count++;
    const state: DayState = done ? "done" : iso > today ? "future" : "empty";
    return { iso, label: letter, state, isToday: iso === today };
  });
  return { key, label, tone, icon, days, count };
}

/**
 * Build the three weekly trend rows (workouts / water / nutrition) for the
 * current Sunday-first week. A day is "done" when the user logged any activity
 * for that pillar on that date; days after today read as "future" (neutral),
 * never as missed.
 */
export function weeklyActivity(
  workouts: WorkoutSession[],
  foodLogs: FoodLog[],
  waterLogs: WaterLog[],
): ActivityRow[] {
  const workoutDates = new Set(workouts.map((w) => w.date));
  const waterDates = new Set(
    waterLogs.filter((l) => l.totalMl > 0).map((l) => l.date),
  );
  const nutritionDates = new Set(foodLogs.map((l) => l.date));

  return [
    buildRow("workouts", "אימונים", "strength", "workout", workoutDates),
    buildRow("water", "מים", "water", "water", waterDates),
    buildRow("nutrition", "תזונה", "nutrition", "nutrition", nutritionDates),
  ];
}

/* --------------------------- Personal records -------------------------- */

export interface PersonalRecord {
  exerciseId: string;
  /** Heaviest single set ever logged for this exercise. */
  topWeightKg: number;
  /** Reps performed on that heaviest set. */
  reps: number;
  /** Date the record was set (ISO). */
  date: string;
}

/**
 * Heaviest single set ever logged per exercise, with the reps + date of that
 * set for context. Derived purely from saved workout history (no schema change).
 * Returned sorted by weight (heaviest first) and capped to `limit`.
 */
export function personalRecords(
  workouts: WorkoutSession[],
  limit = 6,
): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const session of workouts) {
    for (const entry of session.exercises) {
      for (const set of entry.sets) {
        if (set.weightKg <= 0) continue;
        const current = best.get(entry.exerciseId);
        if (!current || set.weightKg > current.topWeightKg) {
          best.set(entry.exerciseId, {
            exerciseId: entry.exerciseId,
            topWeightKg: set.weightKg,
            reps: set.reps,
            date: session.date,
          });
        }
      }
    }
  }
  return [...best.values()]
    .sort((a, b) => b.topWeightKg - a.topWeightKg)
    .slice(0, limit);
}
