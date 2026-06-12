"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { WorkoutTemplate, WorkoutExerciseEntry } from "@/lib/fitness-types";
import {
  addTemplateFromSession,
  removeTemplate,
  removeWorkout,
  useWorkoutTemplates,
  useWorkouts,
} from "@/lib/fitness-store";
import { lastPerformance } from "@/lib/analytics";
import { getExerciseById } from "@/lib/seed-exercises";
import { Button } from "@/components/ui/Button";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import { CopyIcon, DumbbellIcon, PlusIcon } from "@/components/ui/icons";
import { WorkoutBuilder, type BuilderSeed } from "./WorkoutBuilder";
import { WorkoutHistory } from "./WorkoutHistory";
import { TemplateCard } from "./TemplateCard";
import { TemplateEditor } from "./TemplateEditor";

function emptySets(count: number): WorkoutExerciseEntry["sets"] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    weightKg: 0,
    reps: 0,
    completed: false,
  }));
}

export function WorkoutsView() {
  const searchParams = useSearchParams();
  const workouts = useWorkouts();
  const templates = useWorkoutTemplates();
  const [building, setBuilding] = useState(
    () => searchParams.get("new") === "1",
  );
  const [builderSeed, setBuilderSeed] = useState<BuilderSeed | null>(null);
  // null = closed, "new" = creating, otherwise the template being edited.
  const [editingTemplate, setEditingTemplate] = useState<
    WorkoutTemplate | "new" | null
  >(null);

  const openBuilder = (seed: BuilderSeed | null) => {
    setBuilderSeed(seed);
    setEditingTemplate(null);
    setBuilding(true);
  };

  const closeBuilder = () => {
    setBuilding(false);
    setBuilderSeed(null);
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    const entries: WorkoutExerciseEntry[] = template.exerciseIds
      .filter((id) => getExerciseById(id))
      .map((exerciseId) => {
        // Prefill from the last logged performance so the user only adjusts;
        // fall back to empty sets when the exercise was never logged.
        const previous = lastPerformance(workouts, exerciseId);
        const sets = previous
          ? previous.sets.map((s, i) => ({
              setNumber: i + 1,
              weightKg: s.weightKg,
              reps: s.reps,
              completed: false,
            }))
          : emptySets(template.defaultSetCount ?? 3);
        return { exerciseId, sets };
      });
    openBuilder({ title: template.title, entries });
  };

  const duplicateLastWorkout = () => {
    const latest = workouts[0];
    if (!latest) return;
    openBuilder({
      title: latest.title,
      entries: latest.exercises.map((entry) => ({
        exerciseId: entry.exerciseId,
        sets: entry.sets.map((s, i) => ({
          setNumber: i + 1,
          weightKg: s.weightKg,
          reps: s.reps,
          completed: false,
        })),
      })),
    });
  };

  return (
    <div className="space-y-6">
      {building ? (
        <WorkoutBuilder
          initial={builderSeed}
          onSaved={closeBuilder}
          onCancel={closeBuilder}
        />
      ) : editingTemplate ? (
        <TemplateEditor
          template={editingTemplate === "new" ? null : editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      ) : (
        <>
          <Button onClick={() => openBuilder(null)} size="lg" className="w-full">
            <PlusIcon className="h-5 w-5" /> אימון חדש
          </Button>

          <section>
            <SectionHeader
              title="תבניות אימון"
              action={
                <button
                  onClick={() => setEditingTemplate("new")}
                  className="tap inline-flex items-center gap-1 rounded-lg px-1 py-1 text-[12.5px] font-bold text-[color:var(--accent-strength)]"
                >
                  <PlusIcon className="h-4 w-4" /> תבנית חדשה
                </button>
              }
            />
            {templates.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border-strong bg-surface/40 px-4 py-5 text-center text-[13px] text-muted">
                אין תבניות עדיין — צרו תבנית כדי להתחיל אימונים חוזרים בלחיצה אחת.
              </p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onStart={() => startFromTemplate(template)}
                    onEdit={() => setEditingTemplate(template)}
                    onDelete={() => removeTemplate(template.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section>
        <SectionHeader
          title="היסטוריית אימונים"
          action={
            !building && !editingTemplate && workouts.length > 0 ? (
              <button
                onClick={duplicateLastWorkout}
                className="tap inline-flex items-center gap-1 rounded-lg px-1 py-1 text-[12.5px] font-bold text-[color:var(--accent-strength)]"
              >
                <CopyIcon className="h-4 w-4" /> שכפל אימון אחרון
              </button>
            ) : undefined
          }
        />
        {workouts.length === 0 ? (
          <EmptyState
            icon={<DumbbellIcon className="h-7 w-7" />}
            title="עדיין אין אימונים"
            description="התחל אימון חדש כדי לתעד סטים, משקלים וחזרות — ולראות את ההתקדמות מצטברת."
          />
        ) : (
          <WorkoutHistory
            workouts={workouts}
            onDelete={(id) => removeWorkout(id)}
            onSaveAsTemplate={(session) => addTemplateFromSession(session)}
          />
        )}
      </section>
    </div>
  );
}
