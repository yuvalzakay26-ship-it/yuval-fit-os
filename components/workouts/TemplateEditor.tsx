"use client";

import { useState } from "react";
import type { WorkoutTemplate } from "@/lib/fitness-types";
import {
  MUSCLE_GROUP_LABELS,
  SEED_EXERCISES,
  getExerciseById,
  muscleGroupsForExercises,
} from "@/lib/seed-exercises";
import { saveTemplate } from "@/lib/fitness-store";
import { createId } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Select } from "@/components/ui/Field";
import { TrashIcon } from "@/components/ui/icons";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";

export function TemplateEditor({
  template,
  onClose,
}: {
  /** Existing template to edit, or null to create a new one. */
  template: WorkoutTemplate | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(template?.title ?? "");
  const [exerciseIds, setExerciseIds] = useState<string[]>(
    template?.exerciseIds ?? [],
  );
  const [pickerValue, setPickerValue] = useState("");

  const available = SEED_EXERCISES.filter((e) => !exerciseIds.includes(e.id));
  const muscleGroups = muscleGroupsForExercises(exerciseIds);
  const canSave = title.trim().length > 0 && exerciseIds.length > 0;

  const addExercise = (id: string) => {
    if (!id) return;
    setExerciseIds((prev) => [...prev, id]);
    setPickerValue("");
  };

  const handleSave = () => {
    if (!canSave) return;
    const now = new Date().toISOString();
    saveTemplate({
      ...(template ?? { defaultSetCount: 3 }),
      id: template?.id ?? createId("tpl"),
      title: title.trim(),
      muscleGroups,
      exerciseIds,
      createdAt: template?.createdAt ?? now,
      updatedAt: template ? now : undefined,
    });
    onClose();
  };

  return (
    <Card variant="raised" className="space-y-5 p-4">
      <div>
        <Label htmlFor="template-title">שם התבנית</Label>
        <Input
          id="template-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="לדוגמה: גב + יד קדמית"
        />
        {muscleGroups.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {muscleGroups.map((m) => (
              <Badge key={m} tone="accent">
                {MUSCLE_GROUP_LABELS[m]}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {exerciseIds.length > 0 && (
        <ul className="space-y-2">
          {exerciseIds.map((id) => {
            const exercise = getExerciseById(id);
            if (!exercise) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-2.5"
              >
                <ExerciseImage
                  imagePath={exercise.imagePath}
                  alt={exercise.nameHe}
                  muscleGroup={exercise.muscleGroup}
                  imageKey={exercise.imageKey}
                  sizes="40px"
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {exercise.nameHe}
                  </p>
                  <p className="text-[11.5px] text-faint">
                    {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setExerciseIds((prev) => prev.filter((e) => e !== id))
                  }
                  className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-surface hover:text-red-500"
                  aria-label="הסרת תרגיל מהתבנית"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <Label htmlFor="template-exercise-picker">הוספת תרגיל מהספרייה</Label>
        <Select
          id="template-exercise-picker"
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

      <div className="flex gap-2.5">
        <Button onClick={handleSave} disabled={!canSave} size="lg" className="flex-1">
          {template ? "שמירת שינויים" : "שמירת תבנית"}
        </Button>
        <Button variant="secondary" size="lg" onClick={onClose}>
          ביטול
        </Button>
      </div>
    </Card>
  );
}
