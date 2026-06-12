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
}

export type ThemePreference = "light" | "dark" | "system";

export interface Settings {
  theme: ThemePreference;
  proteinGoal?: number;
  calorieGoal?: number;
  weightUnit: "kg";
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  proteinGoal: 150,
  calorieGoal: 2200,
  weightUnit: "kg",
};
