"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkoutSession } from "@/lib/fitness-types";
import { getExerciseById } from "@/lib/seed-exercises";
import { formatHebrewDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { BookmarkIcon, CheckIcon, TrashIcon } from "@/components/ui/icons";
import { MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";
import { identityLabel, workoutIdentity } from "@/lib/workout-theme";
import { MuscleChips } from "./MuscleChips";

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
  onSaveAsTemplate,
}: {
  workouts: WorkoutSession[];
  onDelete: (id: string) => void;
  onSaveAsTemplate?: (session: WorkoutSession) => void;
}) {
  // Briefly swap the bookmark for a check after saving a template.
  const [savedTemplateFor, setSavedTemplateFor] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleSaveAsTemplate = (session: WorkoutSession) => {
    onSaveAsTemplate?.(session);
    setSavedTemplateFor(session.id);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setSavedTemplateFor(null), 2000);
  };

  return (
    <div className="space-y-3">
      {workouts.map((session) => {
        const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
        const volume = Math.round(sessionVolume(session));
        // History stays connected to the upgraded workouts system: each session
        // carries the same muscle-group identity as its template would, applied
        // here as a subtle leading accent bar + tinted volume tile (lighter than
        // the bolder template cards, so the two sections read as one family).
        const identity = workoutIdentity(session.muscleGroups);
        const eyebrow = identityLabel(identity, MUSCLE_GROUP_LABELS);
        return (
          <Card
            key={session.id}
            style={identity.style}
            className="module-mg sheen relative space-y-3 overflow-hidden p-4 ps-5"
          >
            {/* Leading identity bar gives the row a quiet colour cue at a glance. */}
            <div
              aria-hidden="true"
              className="mg-gradient pointer-events-none absolute inset-y-0 start-0 w-1.5"
            />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-[10.5px] font-bold uppercase tracking-wide"
                  style={{ color: "var(--mg)" }}
                >
                  {eyebrow}
                </p>
                <p className="mt-0.5 truncate text-[16px] font-bold text-foreground">
                  {session.title}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {formatHebrewDate(session.date)}
                </p>
              </div>
              <div className="-m-1.5 flex shrink-0 items-center">
                {onSaveAsTemplate && (
                  <button
                    onClick={() => handleSaveAsTemplate(session)}
                    className="tap flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-[color:var(--mg)]"
                    aria-label="שמירת האימון כתבנית"
                  >
                    {savedTemplateFor === session.id ? (
                      <CheckIcon className="h-[18px] w-[18px] text-[color:var(--mg)]" />
                    ) : (
                      <BookmarkIcon className="h-[17px] w-[17px]" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => onDelete(session.id)}
                  className="tap flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-red-500"
                  aria-label="מחיקת אימון"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>

            <MuscleChips groups={session.muscleGroups} />

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
              <div
                className="rounded-xl px-3 py-2 text-center"
                style={{ background: "var(--mg-soft)" }}
              >
                <p
                  className="text-[17px] font-extrabold tabular-nums"
                  style={{ color: "var(--mg)" }}
                >
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
