import type { Exercise, MuscleGroup } from "./fitness-types";

// Initial exercise library. To give an exercise a real image, drop the file
// under `public/exercises/<muscle-group>/<imageKey>.png` and set `imagePath`
// on the exercise (see public/exercises/README.md). Exercises without an
// `imagePath` render the gradient placeholder derived from `muscleGroup`.
export const SEED_EXERCISES: Exercise[] = [
  {
    id: "lat-pulldown",
    nameEn: "Lat Pulldown",
    nameHe: "פולי עליון",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    equipment: "cable",
    difficulty: "beginner",
    imageKey: "lat-pulldown",
    instructions: [
      "אחזו במוט באחיזה רחבה מעט מרוחב הכתפיים.",
      "משכו את המוט אל בית החזה תוך כיווץ השכמות.",
      "החזירו בשליטה למצב התחלתי עם מתיחה מלאה.",
    ],
    notes: "שמרו על חזה פתוח והימנעו מתנופה.",
  },
  {
    id: "pull-ups",
    nameEn: "Pull Ups",
    nameHe: "מתח",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "core"],
    equipment: "bodyweight",
    difficulty: "advanced",
    imageKey: "pull-ups",
    instructions: [
      "תלו על המוט באחיזה רחבה מרוחב הכתפיים.",
      "משכו את הגוף כלפי מעלה עד שהסנטר מעל המוט.",
      "רדו בשליטה ליישור מלא של המרפקים.",
    ],
  },
  {
    id: "bent-over-row",
    nameEn: "Bent Over Row",
    nameHe: "חתירה בהרכנה",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "core"],
    equipment: "barbell",
    difficulty: "intermediate",
    imageKey: "bent-over-row",
    instructions: [
      "הרכינו את פלג הגוף העליון כ-45 מעלות עם גב ישר.",
      "משכו את המוט אל הבטן התחתונה.",
      "הורידו בשליטה ושמרו על ליבה אקטיבית.",
    ],
  },
  {
    id: "landmine-row",
    nameEn: "Landmine Row",
    nameHe: "חתירת לנדמיין",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    equipment: "barbell",
    difficulty: "intermediate",
    imageKey: "landmine-row",
    instructions: [
      "הציבו את קצה המוט בעוגן לנדמיין.",
      "אחזו בקצה הפנוי ומשכו אל החזה.",
      "שמרו על גב ניטרלי לאורך התנועה.",
    ],
  },
  {
    id: "romanian-deadlift",
    nameEn: "Romanian Deadlift",
    nameHe: "דדליפט רומני",
    muscleGroup: "glutes",
    secondaryMuscles: ["legs", "back"],
    equipment: "barbell",
    difficulty: "intermediate",
    imageKey: "romanian-deadlift",
    instructions: [
      "החזיקו את המוט קרוב לרגליים עם ברכיים מעט כפופות.",
      "דחפו את הירכיים אחורה תוך שמירה על גב ישר.",
      "הרגישו מתיחה בירך האחורית וחזרו למעלה.",
    ],
    notes: "התנועה מגיעה מהירכיים ולא מהגב התחתון.",
  },
  {
    id: "rack-pull",
    nameEn: "Rack Pull",
    nameHe: "ראק פול",
    muscleGroup: "back",
    secondaryMuscles: ["glutes", "legs"],
    equipment: "barbell",
    difficulty: "advanced",
    imageKey: "rack-pull",
    instructions: [
      "הציבו את המוט על נקודות בטיחות מתחת לגובה הברך.",
      "אחזו במוט ומשכו עד יישור מלא של הירכיים.",
      "הורידו בשליטה אל נקודות הבטיחות.",
    ],
  },
  {
    id: "bench-press",
    nameEn: "Bench Press",
    nameHe: "לחיצת חזה",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    equipment: "barbell",
    difficulty: "intermediate",
    imageKey: "bench-press",
    instructions: [
      "שכבו על הספסל עם אחיזה מעט רחבה מהכתפיים.",
      "הורידו את המוט אל אמצע החזה בשליטה.",
      "דחפו כלפי מעלה עד יישור המרפקים.",
    ],
  },
  {
    id: "shoulder-press",
    nameEn: "Shoulder Press",
    nameHe: "לחיצת כתפיים",
    muscleGroup: "shoulders",
    secondaryMuscles: ["triceps"],
    equipment: "dumbbell",
    difficulty: "beginner",
    imageKey: "shoulder-press",
    instructions: [
      "אחזו משקולות בגובה הכתפיים.",
      "דחפו כלפי מעלה עד יישור הזרועות.",
      "הורידו בשליטה לגובה הכתפיים.",
    ],
  },
  {
    id: "squat",
    nameEn: "Squat",
    nameHe: "סקוואט",
    muscleGroup: "legs",
    secondaryMuscles: ["glutes", "core"],
    equipment: "barbell",
    difficulty: "intermediate",
    imageKey: "squat",
    instructions: [
      "הניחו את המוט על הטרפזים העליונים.",
      "רדו תוך דחיפת ירכיים אחורה עד עומק מקביל.",
      "דחפו דרך העקבים בחזרה למעלה.",
    ],
    notes: "שמרו על ברכיים בכיוון האצבעות.",
  },
  {
    id: "biceps-curl",
    nameEn: "Biceps Curl",
    nameHe: "כפיפת מרפקים",
    muscleGroup: "biceps",
    secondaryMuscles: [],
    equipment: "dumbbell",
    difficulty: "beginner",
    imageKey: "biceps-curl",
    instructions: [
      "עמדו עם משקולות לצד הגוף.",
      "כפפו את המרפקים והרימו את המשקולות.",
      "הורידו בשליטה מלאה.",
    ],
  },
  {
    id: "triceps-pushdown",
    nameEn: "Triceps Pushdown",
    nameHe: "פשיטת מרפקים בפולי",
    muscleGroup: "triceps",
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner",
    imageKey: "triceps-pushdown",
    instructions: [
      "אחזו בידית הפולי בגובה החזה.",
      "פשטו את המרפקים כלפי מטה עד יישור מלא.",
      "החזירו בשליטה תוך שמירה על מרפקים צמודים.",
    ],
  },
  {
    id: "plank",
    nameEn: "Plank",
    nameHe: "פלאנק",
    muscleGroup: "core",
    secondaryMuscles: ["shoulders"],
    equipment: "bodyweight",
    difficulty: "beginner",
    imageKey: "plank",
    instructions: [
      "התמקמו על האמות וקצות האצבעות.",
      "שמרו על קו ישר מהראש ועד העקבים.",
      "כווצו ליבה ועכוז והחזיקו את הזמן הנדרש.",
    ],
  },
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  back: "גב",
  chest: "חזה",
  shoulders: "כתפיים",
  legs: "רגליים",
  glutes: "עכוז",
  biceps: "יד קדמית",
  triceps: "יד אחורית",
  core: "ליבה",
};

export const EQUIPMENT_LABELS: Record<Exercise["equipment"], string> = {
  barbell: "מוט",
  dumbbell: "משקולות",
  machine: "מכונה",
  cable: "פולי",
  bodyweight: "משקל גוף",
  kettlebell: "קטלבל",
};

export const DIFFICULTY_LABELS: Record<Exercise["difficulty"], string> = {
  beginner: "מתחיל",
  intermediate: "מתקדם",
  advanced: "מומחה",
};

export function getExerciseById(id: string): Exercise | undefined {
  return SEED_EXERCISES.find((exercise) => exercise.id === id);
}
