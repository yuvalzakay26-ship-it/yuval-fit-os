"use client";

import { useMemo, useState } from "react";
import type {
  MuscleGroup,
  SetEntry,
  WorkoutExerciseEntry,
  WorkoutSession,
} from "@/lib/fitness-types";
import {
  MUSCLE_GROUP_LABELS,
  SEED_EXERCISES,
  getExerciseById,
  muscleGroupsForExercises,
} from "@/lib/seed-exercises";
import { addWorkout, useWorkouts } from "@/lib/fitness-store";
import { lastPerformance } from "@/lib/analytics";
import { cn, createId, formatSetsSummary, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Select } from "@/components/ui/Field";
import { CheckIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";

function emptySet(setNumber: number): SetEntry {
  return { setNumber, weightKg: 0, reps: 0, completed: false };
}

/** Prefill data for the builder (from a template or a duplicated workout). */
export interface BuilderSeed {
  title: string;
  entries: WorkoutExerciseEntry[];
}

export function WorkoutBuilder({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: BuilderSeed | null;
  onSaved: (session: WorkoutSession) => void;
  onCancel: () => void;
}) {
  const workouts = useWorkouts();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [entries, setEntries] = useState<WorkoutExerciseEntry[]>(
    initial?.entries ?? [],
  );
  const [pickerValue, setPickerValue] = useState("");

  const usedIds = useMemo(() => new Set(entries.map((e) => e.exerciseId)), [entries]);
  const available = SEED_EXERCISES.filter((e) => !usedIds.has(e.id));

  const addExercise = (exerciseId: string) => {
    if (!exerciseId) return;
    setEntries((prev) => [...prev, { exerciseId, sets: [emptySet(1)] }]);
    setPickerValue("");
  };

  const removeExercise = (exerciseId: string) =>
    setEntries((prev) => prev.filter((e) => e.exerciseId !== exerciseId));

  const addSet = (exerciseId: string) =>
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: [...e.sets, emptySet(e.sets.length + 1)] }
          : e,
      ),
    );

  const removeSet = (exerciseId: string, setNumber: number) =>
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: e.sets
                .filter((s) => s.setNumber !== setNumber)
                .map((s, i) => ({ ...s, setNumber: i + 1 })),
            }
          : e,
      ),
    );

  const updateSet = (
    exerciseId: string,
    setNumber: number,
    patch: Partial<SetEntry>,
  ) =>
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.setNumber === setNumber ? { ...s, ...patch } : s,
              ),
            }
          : e,
      ),
    );

  const muscleGroups = useMemo<MuscleGroup[]>(
    () => muscleGroupsForExercises(entries.map((e) => e.exerciseId)),
    [entries],
  );

  const totalSets = entries.reduce((n, e) => n + e.sets.length, 0);
  const canSave = entries.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const session: WorkoutSession = {
      id: createId("wk"),
      date: todayISO(),
      title: title.trim() || "אימון",
      muscleGroups,
      exercises: entries,
    };
    addWorkout(session);
    onSaved(session);
  };

  return (
    <Card variant="raised" className="space-y-5 p-4">
      {/* Title */}
      <div>
        <Label htmlFor="workout-title">כותרת האימון</Label>
        <Input
          id="workout-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="לדוגמה: אימון גב ויד אחורית"
        />
        {muscleGroups.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {muscleGroups.map((m) => (
              <Badge key={m} tone="strength">
                {MUSCLE_GROUP_LABELS[m]}
              </Badge>
            ))}
            <span className="text-[11px] text-faint">· {totalSets} סטים</span>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {entries.map((entry) => {
          const exercise = getExerciseById(entry.exerciseId);
          if (!exercise) return null;
          const previous = lastPerformance(workouts, entry.exerciseId);
          return (
            <div
              key={entry.exerciseId}
              className="rounded-2xl border border-border bg-surface-2/60 p-3"
            >
              <div className="mb-3 flex items-center gap-3">
                <ExerciseImage
                  imagePath={exercise.imagePath}
                  alt={exercise.nameHe}
                  muscleGroup={exercise.muscleGroup}
                  imageKey={exercise.imageKey}
                  sizes="40px"
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-foreground">
                    {exercise.nameHe}
                  </p>
                  <p className="truncate text-[11.5px] text-muted">
                    {previous ? (
                      <>
                        פעם קודמת:{" "}
                        <span dir="ltr" className="font-semibold tabular-nums">
                          {formatSetsSummary(previous.sets)}
                        </span>
                      </>
                    ) : (
                      "אין ביצוע קודם עדיין"
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeExercise(entry.exerciseId)}
                  className="tap -m-1.5 flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface hover:text-red-500"
                  aria-label="הסרת תרגיל"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="grid grid-cols-[1.75rem_1fr_1fr_2.25rem_1.75rem] items-center gap-2 px-0.5 text-[10.5px] font-bold uppercase tracking-wide text-faint">
                <span>סט</span>
                <span className="text-center">ק&quot;ג</span>
                <span className="text-center">חזרות</span>
                <span className="text-center">בוצע</span>
                <span />
              </div>

              <div className="mt-1.5 space-y-1.5">
                {entry.sets.map((set) => (
                  <div
                    key={set.setNumber}
                    className={cn(
                      "grid grid-cols-[1.75rem_1fr_1fr_2.25rem_1.75rem] items-center gap-2 rounded-xl py-1 transition-colors",
                      set.completed && "bg-[color:var(--accent-strength-soft)]",
                    )}
                  >
                    <span className="flex h-6 w-6 items-center justify-center justify-self-center rounded-lg bg-surface text-[12px] font-bold text-muted">
                      {set.setNumber}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      className="h-10 bg-surface px-2 text-center text-[15px] font-semibold"
                      value={set.weightKg || ""}
                      onChange={(e) =>
                        updateSet(entry.exerciseId, set.setNumber, {
                          weightKg: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="h-10 bg-surface px-2 text-center text-[15px] font-semibold"
                      value={set.reps || ""}
                      onChange={(e) =>
                        updateSet(entry.exerciseId, set.setNumber, {
                          reps: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        updateSet(entry.exerciseId, set.setNumber, {
                          completed: !set.completed,
                        })
                      }
                      aria-label="סימון סט כבוצע"
                      className={cn(
                        "tap flex h-9 w-9 items-center justify-center justify-self-center rounded-xl border transition-colors",
                        set.completed
                          ? "strength-gradient border-transparent text-[color:var(--accent-contrast)]"
                          : "border-border bg-surface text-faint",
                      )}
                    >
                      <CheckIcon className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      onClick={() => removeSet(entry.exerciseId, set.setNumber)}
                      className="tap flex h-9 w-full items-center justify-center rounded-xl text-faint hover:text-red-500"
                      aria-label="הסרת סט"
                    >
                      <TrashIcon className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(entry.exerciseId)}
                className="tap mt-2.5 inline-flex items-center gap-1 rounded-lg px-1 py-1 text-[12.5px] font-bold text-[color:var(--accent-strength)]"
              >
                <PlusIcon className="h-4 w-4" /> הוספת סט
              </button>
            </div>
          );
        })}
      </div>

      {/* Add exercise */}
      <div>
        <Label htmlFor="exercise-picker">הוספת תרגיל מהספרייה</Label>
        <Select
          id="exercise-picker"
          value={pickerValue}
          onChange={(e) => addExercise(e.target.value)}
          disabled={available.length === 0}
        >
          <option value="">בחר תרגיל…</option>
          {available.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.nameHe} · {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
            </option>
          ))}
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        <Button onClick={handleSave} disabled={!canSave} size="lg" className="flex-1">
          {canSave ? `שמירת אימון · ${totalSets} סטים` : "שמירת אימון"}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </Card>
  );
}
