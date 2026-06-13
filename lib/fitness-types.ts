// Core domain types for Yuval Fit OS.
// Internal naming is English; UI strings may be Hebrew.

export type MuscleGroup =
  | "back"
  | "chest"
  | "shoulders"
  | "legs"
  | "glutes"
  | "biceps"
  | "triceps"
  | "core";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  nameEn: string;
  nameHe: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  difficulty: Difficulty;
  /** Stable key used to map to a local image/SVG/video later. */
  imageKey: string;
  /**
   * Public path to a real exercise image, e.g. `/exercises/back/lat-pulldown.png`.
   * When absent (or the file fails to load), the UI falls back to the gradient
   * placeholder. See `public/exercises/README.md` for naming conventions.
   */
  imagePath?: string;
  /** Optional video URL reserved for a future phase. */
  videoUrl?: string;
  instructions: string[];
  notes?: string;
}

export interface SetEntry {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  note?: string;
}

export interface WorkoutExerciseEntry {
  exerciseId: string;
  sets: SetEntry[];
}

export interface WorkoutSession {
  id: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  title: string;
  muscleGroups: MuscleGroup[];
  exercises: WorkoutExerciseEntry[];
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  muscleGroups: MuscleGroup[];
  exerciseIds: string[];
  /** Sets pre-created per exercise when starting from the template. */
  defaultSetCount?: number;
  notes?: string;
  /** Full ISO timestamp. */
  createdAt: string;
  updatedAt?: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodLog {
  id: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  mealType: MealType;
  foodName: string;
  quantityText: string;
  calories?: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  /**
   * Optional publicRoute to a food image, e.g. `/food/breakfast/shakshuka.webp`,
   * set when the log was created from the visual food library. Existing logs
   * predate this field and are unaffected. See `lib/food-library.ts`.
   */
  imagePath?: string;
  /** Optional food-library category id (see `FoodCategory`). */
  category?: string;
  /** Id of the source `FoodLibraryItem`, when added from the library. */
  sourceFoodId?: string;
}

/**
 * A user's personal default nutrition values for one food-library item, keyed by
 * `sourceFoodId`. These are NOT official nutrition facts and are never inferred —
 * they are simply the exact quantity + macros the user last chose to remember for
 * that food, so the add form can prefill them next time. See `lib/saved-values`
 * usage in `storage.ts` and `docs/NUTRITION_SAVED_VALUES.md`.
 */
export interface SavedFoodValue {
  sourceFoodId: string;
  foodName: string;
  imagePath?: string;
  category?: string;
  quantity: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  /** Full ISO timestamp of the last save. */
  updatedAt: string;
}

/**
 * A food-library item the user marked as a favorite for quick access, keyed by
 * `sourceFoodId`. This is favorite *identity* only — it carries no nutrition
 * values and never infers macros. See `docs/NUTRITION_FAVORITES.md`.
 */
export interface FavoriteFood {
  sourceFoodId: string;
  /** Full ISO timestamp of when it was favorited. */
  addedAt: string;
}

/** A single drink logged during a day. */
export interface WaterEntry {
  id: string;
  amountMl: number;
  /** Full ISO timestamp of when it was logged. */
  createdAt: string;
}

/**
 * A day's hydration record, keyed by local ISO date. `totalMl` is always the
 * sum of `entries` — it is recomputed on every mutation so it can never drift.
 * Days never roll over: today's total derives from today's date only, and past
 * days stay stored for future history. See `docs/WATER_TRACKING.md`.
 */
export interface WaterLog {
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  totalMl: number;
  entries: WaterEntry[];
}

/* ----------------------------- Supplements ---------------------------- */
// Personal supplement/medication tracking. This is a tracking tool ONLY: the app
// never recommends supplements, never suggests dosages, and carries no medical
// advice. The user records items they have already decided to track. All
// strings are neutral and safety-first. localStorage-only. See
// `docs/SUPPLEMENTS_TRACKER.md`.

/** Neutral, non-judgemental categories — no "natural/unnatural", no drug framing. */
export type SupplementCategory =
  | "vitamin"
  | "mineral"
  | "protein"
  | "performance"
  | "general-health"
  | "doctor-recommended"
  | "other";

/** Optional time-of-day tags for when the user takes an item. */
export type SupplementTiming =
  | "morning"
  | "noon"
  | "evening"
  | "pre-workout"
  | "post-workout"
  | "other";

export interface SupplementSchedule {
  frequency: "daily" | "weekly" | "custom";
  /** When in the day the user plans to take it (display/grouping only). */
  timesOfDay?: SupplementTiming[];
  notes?: string;
}

export interface Supplement {
  id: string;
  name: string;
  category: SupplementCategory;
  /** Free text typed by the user only — never generated or suggested. */
  dosageText?: string;
  schedule?: SupplementSchedule;
  /** Inactive items are archived: kept (with history) but out of the daily list. */
  isActive: boolean;
  /** Full ISO timestamp. */
  createdAt: string;
  updatedAt?: string;
}

/**
 * A single "taken" mark for one supplement on one day. Date-based: today reads
 * today's date only, tomorrow starts fresh, and past marks stay stored for
 * future history. There is at most one log per (supplementId, date).
 */
export interface SupplementLog {
  id: string;
  supplementId: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** Full ISO timestamp of when it was marked taken. */
  takenAt: string;
}

export type ThemePreference = "light" | "dark" | "system";

export interface Settings {
  theme: ThemePreference;
  proteinGoal?: number;
  calorieGoal?: number;
  weightUnit: "kg";
  /** Body weight used by the protein goal calculator (not medical data). */
  bodyWeightKg?: number;
  /** Selected activity level id from `lib/protein.ts`. */
  proteinActivityLevel?: string;
  /**
   * Daily water goal in millilitres. A personal preference, not a medical
   * recommendation — the user can edit it freely (see `docs/WATER_TRACKING.md`).
   */
  waterGoalMl?: number;
}

/** Default daily water goal (ml). A neutral starting point, not medical advice. */
export const DEFAULT_WATER_GOAL_ML = 2500;

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  proteinGoal: 150,
  calorieGoal: 2200,
  weightUnit: "kg",
  waterGoalMl: DEFAULT_WATER_GOAL_ML,
};
