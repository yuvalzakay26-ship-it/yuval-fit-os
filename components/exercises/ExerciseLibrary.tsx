"use client";

import { useMemo, useState } from "react";
import type { MuscleGroup } from "@/lib/fitness-types";
import { MUSCLE_GROUP_LABELS, SEED_EXERCISES } from "@/lib/seed-exercises";
import { lastPerformance } from "@/lib/analytics";
import { useWorkouts } from "@/lib/fitness-store";
import { cn } from "@/lib/utils";
import { ExerciseCard } from "./ExerciseCard";

const FILTERS: Array<{ value: MuscleGroup | "all"; label: string }> = [
  { value: "all", label: "הכל" },
  ...(
    [...new Set(SEED_EXERCISES.map((e) => e.muscleGroup))] as MuscleGroup[]
  ).map((m) => ({ value: m, label: MUSCLE_GROUP_LABELS[m] })),
];

export function ExerciseLibrary() {
  const [filter, setFilter] = useState<MuscleGroup | "all">("all");
  const workouts = useWorkouts();

  const exercises = useMemo(
    () =>
      filter === "all"
        ? SEED_EXERCISES
        : SEED_EXERCISES.filter((e) => e.muscleGroup === filter),
    [filter],
  );

  return (
    <div>
      {/* Horizontally scrollable filter chips. */}
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "tap shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold",
              filter === f.value
                ? "brand-gradient text-[color:var(--accent-contrast)] shadow-glow"
                : "border border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            performance={lastPerformance(workouts, exercise.id)}
          />
        ))}
      </div>
    </div>
  );
}
