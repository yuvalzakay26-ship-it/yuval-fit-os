import type { WorkoutTemplate } from "./fitness-types";
import { muscleGroupsForExercises } from "./seed-exercises";

// Starter workout templates built from the seed exercise library. They are
// shown only while the templates storage key has never been written, so they
// never duplicate or resurrect themselves after the user edits/deletes them
// (see `getWorkoutTemplates` in storage.ts).

const SEED_CREATED_AT = "2026-06-12T00:00:00.000Z";

function template(id: string, title: string, exerciseIds: string[]): WorkoutTemplate {
  return {
    id,
    title,
    muscleGroups: muscleGroupsForExercises(exerciseIds),
    exerciseIds,
    defaultSetCount: 3,
    createdAt: SEED_CREATED_AT,
  };
}

export const DEFAULT_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  template("tpl-back-biceps", "גב + יד קדמית", [
    "lat-pulldown",
    "bent-over-row",
    "landmine-row",
    "biceps-curl",
  ]),
  template("tpl-chest-shoulders", "חזה + כתפיים", [
    "bench-press",
    "shoulder-press",
    "triceps-pushdown",
  ]),
  template("tpl-legs", "רגליים", ["squat", "romanian-deadlift", "plank"]),
  template("tpl-full-body", "Full Body", [
    "squat",
    "bench-press",
    "bent-over-row",
    "shoulder-press",
    "plank",
  ]),
];
