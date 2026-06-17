// Workout Recommendation V1 — deterministic, local-first, NO AI.
//
// Maps the saved Personal Training Profile (lib/personal-profile.ts) onto ONE
// existing workout template (lib/fitness-types.ts → WorkoutTemplate) as a "good
// place to start". This is a thin recommendation LAYER, not a program generator:
//   • It NEVER creates a template, generates exercises, or mutates anything.
//   • It NEVER fetches the network or touches a server — pure function of its
//     inputs (profile + existing templates).
//   • It ONLY reads template fields that already exist (title, muscleGroups,
//     exerciseIds) and the profile's training-preference answers.
//   • It deliberately does NOT read age / height / weight / sex / adaptation —
//     no body, weight, BMI, body-shape, or medical/diet judgment is ever made.
//
// Honesty over confidence: template metadata is limited (muscle groups + title),
// so the copy is careful and the confidence is graded. When signals are weak we
// say so ("נקודת התחלה ראשונית") rather than overclaiming.
//
// See docs/WORKOUT_RECOMMENDATION_V1.md.

import type { MuscleGroup, WorkoutTemplate } from "./fitness-types";
import type { TrainingProfile } from "./personal-profile";
import { isProfileEmpty } from "./personal-profile";
import { getExerciseById } from "./seed-exercises";

/* ------------------------------- Public API ----------------------------- */

export type WorkoutRecommendationConfidence = "high" | "medium" | "low";

/** The recommendation itself — references an EXISTING template by id/name only. */
export interface WorkoutRecommendation {
  templateId: string;
  templateName: string;
  confidence: WorkoutRecommendationConfidence;
  /** 2–4 short, neutral reason chips. Never a promise of results. */
  reasons: string[];
  /** One careful sentence framing the match, graded by confidence. */
  explanation: string;
}

/**
 * Discriminated result so the UI can render the right behaviour state without
 * re-deriving anything:
 *   • no-profile        — no usable profile saved yet (quiet CTA to fill one)
 *   • incomplete-profile — a profile exists but core answers are missing
 *   • no-templates      — profile is ready but there are no templates to pick
 *   • ok                — a concrete recommendation for one existing template
 */
export type WorkoutRecommendationResult =
  | { status: "no-profile" }
  | { status: "incomplete-profile" }
  | { status: "no-templates" }
  | { status: "ok"; recommendation: WorkoutRecommendation };

/**
 * Core answers a profile needs before we will recommend a template. Kept to the
 * fields the V1 profile already had (goal · location · frequency · duration ·
 * experience · equipment), so older profiles still qualify; the newer
 * trainingPreference / guidanceStyle answers only ENRICH scoring, they are not
 * required. Body-related fields are intentionally NOT here.
 */
function hasRequiredAnswers(profile: TrainingProfile): boolean {
  return Boolean(
    profile.goal &&
      profile.location &&
      profile.weeklyFrequency &&
      profile.workoutDuration &&
      profile.experience &&
      profile.equipment &&
      profile.equipment.length > 0,
  );
}

/**
 * The single entry point. Returns the discriminated state for the given profile
 * and the templates currently available. Pure and deterministic — same inputs
 * always yield the same output (ties resolved by a stable rule below).
 */
export function getWorkoutRecommendation(
  profile: TrainingProfile | null,
  templates: WorkoutTemplate[],
): WorkoutRecommendationResult {
  if (!profile || isProfileEmpty(profile)) return { status: "no-profile" };
  if (!hasRequiredAnswers(profile)) return { status: "incomplete-profile" };
  if (!templates || templates.length === 0) return { status: "no-templates" };

  const scored = templates.map((template, index) => ({
    template,
    index,
    ...scoreTemplate(profile, template),
  }));

  // Deterministic winner: highest score, then prefer a broad/full-body template
  // (a safe general starting point), then the earliest in the original order.
  const ranked = [...scored].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aBroad = classifyTemplate(a.template).isFullBody ? 1 : 0;
    const bBroad = classifyTemplate(b.template).isFullBody ? 1 : 0;
    if (bBroad !== aBroad) return bBroad - aBroad;
    return a.index - b.index;
  });

  const winner = ranked[0];
  const runnerUpScore = ranked.length > 1 ? ranked[1].score : -Infinity;

  const reasons = finalizeReasons(winner.reasons, winner.template);
  const confidence = gradeConfidence(winner.signals, winner.score, runnerUpScore);

  return {
    status: "ok",
    recommendation: {
      templateId: winner.template.id,
      templateName: winner.template.title,
      confidence,
      reasons,
      explanation: EXPLANATIONS[confidence],
    },
  };
}

/* ----------------------------- Profile signals -------------------------- */
// All values below are the canonical Hebrew option labels stored on the profile
// (lib/personal-profile.ts). We match against them directly.

const BEGINNER_EXPERIENCES = ["מתחיל", "חוזר אחרי הפסקה"];
const GYM_EQUIPMENT = ["מכון מלא", "מכונות", "משקולות"];

/** Beginner OR returning-after-a-break OR an explicit "start from zero" goal. */
function isBeginnerProfile(profile: TrainingProfile): boolean {
  return (
    (profile.experience !== undefined &&
      BEGINNER_EXPERIENCES.includes(profile.experience)) ||
    profile.goal === "להתחיל מאפס"
  );
}

/** Planned weekly sessions as a number, or null when "לא בטוח עדיין". */
function weeklyCount(frequency?: string): number | null {
  switch (frequency) {
    case "2 פעמים":
      return 2;
    case "3 פעמים":
      return 3;
    case "4 פעמים":
      return 4;
    case "5+ פעמים":
      return 5;
    default:
      return null;
  }
}

function frequencyReason(count: number): string {
  return `מתאים ל־${count >= 5 ? "5+" : count} אימונים בשבוע`;
}

/** True when the user trains only at home / with bodyweight (no gym kit). */
function isHomeOnly(profile: TrainingProfile): boolean {
  const equip = profile.equipment ?? [];
  const onlyBodyweight =
    equip.includes("משקל גוף בלבד") &&
    !equip.some((e) => GYM_EQUIPMENT.includes(e));
  return profile.location === "בית" || onlyBodyweight;
}

/** True when the user has gym access (location or owned equipment implies it). */
function hasGymAccess(profile: TrainingProfile): boolean {
  const equip = profile.equipment ?? [];
  return (
    profile.location === "חדר כושר" ||
    equip.some((e) => GYM_EQUIPMENT.includes(e))
  );
}

/* ---------------------------- Template signals -------------------------- */
// We only read fields the template already has. Equipment needs are derived from
// the seed exercise library (read-only); unknown ids are simply ignored.

interface TemplateTraits {
  breadth: number;
  isFullBody: boolean;
  isSplit: boolean;
  isBodyweightFriendly: boolean;
  usesGymEquipment: boolean;
  exerciseCount: number;
}

const FULL_BODY_TITLE = /full\s*body|גוף מלא|כללי/i;

function classifyTemplate(template: WorkoutTemplate): TemplateTraits {
  const groups: MuscleGroup[] = template.muscleGroups ?? [];
  const breadth = groups.length;
  const titleFullBody = FULL_BODY_TITLE.test(template.title ?? "");

  const equipments = (template.exerciseIds ?? [])
    .map((id) => getExerciseById(id)?.equipment)
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const usesGymEquipment = equipments.some(
    (e) => e === "machine" || e === "cable",
  );
  const isBodyweightFriendly =
    equipments.length > 0 && equipments.every((e) => e === "bodyweight");

  return {
    breadth,
    isFullBody: titleFullBody || breadth >= 4,
    isSplit: breadth <= 2 && !titleFullBody,
    isBodyweightFriendly,
    usesGymEquipment,
    exerciseCount: (template.exerciseIds ?? []).length,
  };
}

/* -------------------------------- Scoring ------------------------------- */

interface ScoreResult {
  score: number;
  /** Distinct positive signal categories that matched — drives confidence. */
  signals: number;
  reasons: string[];
}

/**
 * Score one template against the profile. Higher is a better start. Each
 * positive category contributes at most one reason chip; mismatches gently
 * subtract so an obviously-wrong template (e.g. a 1-group split for a beginner
 * training twice a week) loses to a broad one.
 */
function scoreTemplate(
  profile: TrainingProfile,
  template: WorkoutTemplate,
): ScoreResult {
  const t = classifyTemplate(template);
  let score = 0;
  let signals = 0;
  const reasons: string[] = [];

  // 1) Experience / starting from zero → prefer broad, full-body templates.
  if (isBeginnerProfile(profile)) {
    if (t.isFullBody) {
      score += 4;
      signals += 1;
      reasons.push("מתאים לרמת מתחיל");
      if (profile.trainingPreference === "רגוע והדרגתי") {
        reasons.push("מתאים להתחלה הדרגתית");
      }
    } else if (t.isSplit) {
      score -= 2;
    }
  }

  // 2) Weekly frequency → low frequency favours broad; high frequency tolerates
  //    (and slightly favours) splits.
  const count = weeklyCount(profile.weeklyFrequency);
  if (count !== null) {
    if (count <= 3) {
      if (t.isFullBody) {
        score += 3;
        signals += 1;
        reasons.push(frequencyReason(count));
        if (t.breadth >= 4) reasons.push("תבנית רחבה שמתאימה לבניית בסיס");
      } else if (t.isSplit) {
        score -= 1;
      }
    } else {
      if (t.isSplit) {
        score += 2;
        signals += 1;
        reasons.push(frequencyReason(count));
      } else if (t.isFullBody) {
        score += 1;
      }
    }
  }

  // 3) Goal → strength / general / habit / technique like broad work; muscle
  //    building can take a split when the frequency supports it.
  if (profile.goal === "לבנות מסת שריר") {
    if (count !== null && count >= 4 && t.isSplit) {
      score += 2;
      signals += 1;
      reasons.push("מתאים למטרה שבחרת");
    } else if (t.isFullBody) {
      score += 1;
      signals += 1;
      reasons.push("מתאים למטרה שבחרת");
    }
  } else if (profile.goal && t.isFullBody) {
    // strength / general fitness / habit / start-from-zero / technique
    score += 2;
    signals += 1;
    reasons.push("מתאים למטרה שבחרת");
  }

  // 4) Location / equipment → home-only avoids gym-machine templates; gym access
  //    is fine with machine work.
  if (isHomeOnly(profile)) {
    if (t.isBodyweightFriendly) {
      score += 2;
      signals += 1;
      reasons.push("מתאים לאימון בבית");
    } else if (t.usesGymEquipment) {
      score -= 2;
    }
  } else if (hasGymAccess(profile)) {
    if (t.usesGymEquipment) {
      score += 1;
      signals += 1;
      reasons.push("מתאים למכון");
    }
  }

  // 5) Duration → a short session prefers a simpler/shorter template.
  if (profile.workoutDuration === "עד 30 דקות") {
    if (t.exerciseCount > 0 && t.exerciseCount <= 4) {
      score += 1;
      signals += 1;
      reasons.push("מתאים לאימון קצר");
    } else if (t.exerciseCount > 5) {
      score -= 1;
    }
  }

  return { score, signals, reasons };
}

/* ------------------------------ Finalisers ------------------------------ */

const EXPLANATIONS: Record<WorkoutRecommendationConfidence, string> = {
  high: "לפי המטרה, הרמה והתדירות שבחרת — זו נראית כמו תבנית טובה להתחלה.",
  medium: "זו המלצה ראשונית לפי הפרופיל והתבניות שקיימות אצלך.",
  low: "עדיין אין מספיק מידע להתאמה חזקה, אבל זו יכולה להיות נקודת התחלה טובה.",
};

/** Dedupe, cap at 4 chips, and guarantee at least one honest reason. */
function finalizeReasons(reasons: string[], template: WorkoutTemplate): string[] {
  const out: string[] = [];
  for (const reason of reasons) {
    if (!out.includes(reason)) out.push(reason);
    if (out.length === 4) break;
  }
  if (out.length === 0) {
    out.push(
      classifyTemplate(template).isFullBody
        ? "תבנית רחבה שמתאימה לבניית בסיס"
        : "נקודת התחלה ראשונית מהתבניות שלך",
    );
  }
  return out;
}

/**
 * Grade confidence honestly: "high" needs several matching signals AND a clear
 * margin over the runner-up; a tie or no matched signal stays "low".
 */
function gradeConfidence(
  signals: number,
  score: number,
  runnerUpScore: number,
): WorkoutRecommendationConfidence {
  if (signals >= 3 && score > runnerUpScore && score > 0) return "high";
  if (signals >= 1 && score > 0) return "medium";
  return "low";
}
