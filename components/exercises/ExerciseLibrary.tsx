"use client";

import { useMemo, useState } from "react";
import type { MuscleGroup } from "@/lib/fitness-types";
import { MUSCLE_GROUP_LABELS, SEED_EXERCISES } from "@/lib/seed-exercises";
import { lastPerformance } from "@/lib/analytics";
import { useWorkouts } from "@/lib/fitness-store";
import { cn } from "@/lib/utils";
import { ExerciseCard } from "./ExerciseCard";

// Exercise count per primary muscle group, derived from the data so the chip
// labels stay correct as the library grows (no hardcoded numbers).
const GROUP_COUNTS = SEED_EXERCISES.reduce<Record<string, number>>((acc, e) => {
  acc[e.muscleGroup] = (acc[e.muscleGroup] ?? 0) + 1;
  return acc;
}, {});

const FILTERS: Array<{ value: MuscleGroup | "all"; label: string; count: number }> = [
  { value: "all", label: "הכל", count: SEED_EXERCISES.length },
  ...(
    [...new Set(SEED_EXERCISES.map((e) => e.muscleGroup))] as MuscleGroup[]
  ).map((m) => ({ value: m, label: MUSCLE_GROUP_LABELS[m], count: GROUP_COUNTS[m] })),
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
            {/* Decorative count — aria-hidden keeps the button's accessible
                name the plain category label (e.g. "גב"), not "גב 19". */}
            <span
              aria-hidden="true"
              className={cn(
                "ms-1.5 tabular-nums text-[11px] font-bold",
                filter === f.value ? "opacity-75" : "text-faint",
              )}
            >
              {f.count}
            </span>
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
