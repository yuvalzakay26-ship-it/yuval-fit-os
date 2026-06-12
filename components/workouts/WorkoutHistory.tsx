"use client";

import type { WorkoutSession } from "@/lib/fitness-types";
import { MUSCLE_GROUP_LABELS, getExerciseById } from "@/lib/seed-exercises";
import { formatHebrewDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrashIcon } from "@/components/ui/icons";

function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, entry) =>
      total + entry.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
    0,
  );
}

export function WorkoutHistory({
  workouts,
  onDelete,
}: {
  workouts: WorkoutSession[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {workouts.map((session) => {
        const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
        const volume = Math.round(sessionVolume(session));
        return (
          <Card key={session.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[16px] font-bold text-foreground">
                  {session.title}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {formatHebrewDate(session.date)}
                </p>
              </div>
              <button
                onClick={() => onDelete(session.id)}
                className="tap -m-1.5 flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-red-500"
                aria-label="מחיקת אימון"
              >
                <TrashIcon className="h-[18px] w-[18px]" />
              </button>
            </div>

            {session.muscleGroups.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {session.muscleGroups.map((m) => (
                  <Badge key={m} tone="accent">
                    {MUSCLE_GROUP_LABELS[m]}
                  </Badge>
                ))}
              </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-surface-2 px-3 py-2 text-center">
                <p className="text-[17px] font-extrabold tabular-nums text-foreground">
                  {session.exercises.length}
                </p>
                <p className="text-[10.5px] font-medium text-faint">תרגילים</p>
              </div>
              <div className="rounded-xl bg-surface-2 px-3 py-2 text-center">
                <p className="text-[17px] font-extrabold tabular-nums text-foreground">
                  {totalSets}
                </p>
                <p className="text-[10.5px] font-medium text-faint">סטים</p>
              </div>
              <div className="rounded-xl bg-[color:var(--accent-soft)] px-3 py-2 text-center">
                <p className="text-[17px] font-extrabold tabular-nums text-accent">
                  {volume.toLocaleString()}
                </p>
                <p className="text-[10.5px] font-medium text-faint">נפח (ק&quot;ג)</p>
              </div>
            </div>

            {/* Exercise breakdown */}
            <ul className="space-y-1.5 border-t border-border pt-3">
              {session.exercises.map((entry) => {
                const exercise = getExerciseById(entry.exerciseId);
                const top = entry.sets.reduce(
                  (best, s) => (s.weightKg > best ? s.weightKg : best),
                  0,
                );
                return (
                  <li
                    key={entry.exerciseId}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="font-medium text-foreground">
                      {exercise?.nameHe ?? entry.exerciseId}
                    </span>
                    <span className="text-[12px] text-muted">
                      {entry.sets.length} × עד {top} ק&quot;ג
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
