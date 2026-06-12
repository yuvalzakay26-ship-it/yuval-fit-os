"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/fitness-types";
import {
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  MUSCLE_GROUP_LABELS,
} from "@/lib/seed-exercises";
import type { ExercisePerformance } from "@/lib/analytics";
import { formatHebrewDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronIcon, TrophyIcon } from "@/components/ui/icons";
import { ExerciseImage } from "./ExerciseImage";

export function ExerciseCard({
  exercise,
  performance,
}: {
  exercise: Exercise;
  performance?: ExercisePerformance | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden p-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tap flex w-full items-center gap-3.5 p-3 text-right"
        aria-expanded={open}
      >
        <ExerciseImage
          imagePath={exercise.imagePath}
          alt={exercise.nameHe}
          muscleGroup={exercise.muscleGroup}
          imageKey={exercise.imageKey}
          sizes="72px"
          className="h-[72px] w-[72px] shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold leading-tight text-foreground">
            {exercise.nameHe}
          </p>
          <p className="truncate text-[12px] text-faint">{exercise.nameEn}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="accent">{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</Badge>
            <Badge tone="muted">{EQUIPMENT_LABELS[exercise.equipment]}</Badge>
            <Badge tone="muted">{DIFFICULTY_LABELS[exercise.difficulty]}</Badge>
          </div>
        </div>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 rotate-90 text-faint transition-transform duration-200 ${
            open ? "-rotate-90" : ""
          }`}
        />
      </button>

      {open && (
        <div className="animate-fade-up border-t border-border px-4 pb-4 pt-3.5">
          {exercise.imagePath && (
            <ExerciseImage
              imagePath={exercise.imagePath}
              alt={exercise.nameHe}
              muscleGroup={exercise.muscleGroup}
              imageKey={exercise.imageKey}
              sizes="(max-width: 448px) 100vw, 416px"
              className="mb-3.5 aspect-[16/10] w-full"
            />
          )}
          {performance ? (
            <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl bg-[color:var(--accent-soft)] px-3.5 py-2.5">
              <TrophyIcon className="h-5 w-5 shrink-0 text-accent" />
              <div className="text-[12px] leading-tight">
                <p className="font-bold text-accent">
                  {performance.topWeightKg} ק&quot;ג × {performance.reps} ·{" "}
                  {performance.totalSets} סטים
                </p>
                <p className="text-muted">ביצוע אחרון · {formatHebrewDate(performance.date)}</p>
              </div>
            </div>
          ) : (
            <p className="mb-3.5 text-[12.5px] text-muted">
              עדיין לא תועד ביצוע לתרגיל זה.
            </p>
          )}

          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-faint">
            הוראות ביצוע
          </p>
          <ol className="space-y-2">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-muted">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[11px] font-bold text-accent">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {exercise.secondaryMuscles.length > 0 && (
            <p className="mt-3.5 text-[12px] text-muted">
              <span className="font-semibold text-foreground">שרירים משניים: </span>
              {exercise.secondaryMuscles.map((m) => MUSCLE_GROUP_LABELS[m]).join(", ")}
            </p>
          )}

          {exercise.notes && (
            <div className="mt-2.5 rounded-2xl bg-surface-2 px-3.5 py-2.5 text-[12.5px] italic leading-relaxed text-muted">
              💡 {exercise.notes}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
