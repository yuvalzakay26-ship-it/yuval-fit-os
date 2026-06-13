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
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/PageHeader";
import {
  CopyIcon,
  DumbbellIcon,
  ListIcon,
  PlayIcon,
  PlusIcon,
} from "@/components/ui/icons";
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
          {/* Command center — the workouts hub at a glance + the primary CTA. */}
          <Card
            variant="raised"
            className="module-strength sheen relative overflow-hidden p-5"
          >
            <div
              className="pointer-events-none absolute -start-10 -top-12 h-36 w-36 rounded-full opacity-60 blur-2xl"
              style={{ background: "var(--accent-strength-soft)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="strength-gradient sheen flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow-strength">
                  <DumbbellIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-strength)]">
                    מרכז האימונים
                  </p>
                  <p className="mt-0.5 text-[18px] font-extrabold leading-tight text-foreground">
                    בנה את האימון הבא שלך
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-border bg-surface-2 px-3.5 py-2.5">
                  <p className="text-[18px] font-extrabold tabular-nums leading-none text-foreground">
                    {templates.length}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-faint">
                    תבניות מוכנות
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-2 px-3.5 py-2.5">
                  <p className="text-[18px] font-extrabold tabular-nums leading-none text-foreground">
                    {workouts.length}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-faint">
                    אימונים תועדו
                  </p>
                </div>
              </div>

              <Button
                onClick={() => openBuilder(null)}
                size="lg"
                className="strength-gradient shadow-glow-strength sheen mt-4 w-full"
              >
                <PlusIcon className="h-5 w-5" /> אימון חדש
              </Button>
            </div>
          </Card>

          <section>
            <SectionHeader
              title="תבניות אימון"
              accent="var(--accent-strength)"
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
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-strong bg-surface/50 px-6 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-strength-soft)] text-[color:var(--accent-strength)]">
                  <ListIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[14.5px] font-bold text-foreground">
                    אין תבניות עדיין
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                    צור תבנית כדי להתחיל אימונים חוזרים בלחיצה אחת.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingTemplate("new")}
                >
                  <PlusIcon className="h-4 w-4" /> צור תבנית ראשונה
                </Button>
              </div>
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
          accent="var(--accent-strength)"
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
          <Card
            variant="raised"
            className="module-strength sheen relative overflow-hidden p-7 text-center"
          >
            <div
              className="pointer-events-none absolute -start-12 -top-16 h-44 w-44 rounded-full opacity-60 blur-2xl"
              style={{ background: "var(--accent-strength-soft)" }}
            />
            <div className="relative flex flex-col items-center">
              <span className="strength-gradient sheen flex h-16 w-16 items-center justify-center rounded-3xl text-[color:var(--accent-contrast)] shadow-glow-strength">
                <DumbbellIcon className="h-8 w-8" />
              </span>
              <p className="mt-4 text-[17px] font-extrabold leading-tight text-foreground">
                כאן ייבנה סיפור הכוח שלך
              </p>
              <p className="mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-muted">
                כל אימון שתתעד נשמר כאן — סטים, משקלים ונפח כולל. ככה תראה את
                ההתקדמות מצטברת שבוע אחרי שבוע.
              </p>
              <div className="mt-5 flex w-full max-w-[16rem] flex-col gap-2.5">
                <Button
                  onClick={() => openBuilder(null)}
                  className="strength-gradient shadow-glow-strength sheen w-full"
                >
                  <PlayIcon className="h-5 w-5" /> התחל אימון ראשון
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setEditingTemplate("new")}
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4" /> צור תבנית
                </Button>
              </div>
            </div>
          </Card>
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
