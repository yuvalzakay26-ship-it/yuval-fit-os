"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { WorkoutTemplate, WorkoutExerciseEntry } from "@/lib/fitness-types";
import { usePersonalProfile } from "@/lib/personal-profile";
import { getWorkoutRecommendation } from "@/lib/workout-recommendation";
import {
  addTemplateFromSession,
  removeTemplate,
  removeWorkout,
  useWorkoutTemplates,
  useWorkouts,
} from "@/lib/fitness-store";
import {
  clearActiveWorkoutDraft,
  fromActiveWorkoutDraft,
  getActiveWorkoutDraft,
  hasMeaningfulWorkoutDraft,
  useActiveWorkoutDraft,
} from "@/lib/active-workout-draft";
import { lastPerformance } from "@/lib/analytics";
import { getExerciseById } from "@/lib/seed-exercises";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SectionHeader } from "@/components/ui/PageHeader";
import {
  ChevronIcon,
  CopyIcon,
  DoorEnterIcon,
  DumbbellIcon,
  ListIcon,
  PlayIcon,
  PlusIcon,
  TargetIcon,
} from "@/components/ui/icons";
import { WorkoutBuilder, type BuilderSeed } from "./WorkoutBuilder";
import { WorkoutHistory } from "./WorkoutHistory";
import { TemplateCard } from "./TemplateCard";
import { TemplateEditor } from "./TemplateEditor";
import { DraftRestoreCard } from "./DraftRestoreCard";
import { WorkoutRecommendationCard } from "./WorkoutRecommendationCard";

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
  // True only when the builder was opened by *restoring* the auto-saved draft,
  // so it can resume the existing draft slot instead of treating it as a
  // conflict. Reset on every other open and on close.
  const [resumingDraft, setResumingDraft] = useState(false);
  // null = closed, "new" = creating, otherwise the template being edited.
  const [editingTemplate, setEditingTemplate] = useState<
    WorkoutTemplate | "new" | null
  >(null);

  // The current local active-workout draft, surfaced as a restore prompt on the
  // hub so returning users see "you have an unsaved workout". Reactive + SSR-safe
  // (null on the server, real value after hydration). See `lib/active-workout-draft.ts`.
  const draft = useActiveWorkoutDraft();
  const [discardOpen, setDiscardOpen] = useState(false);

  // Workout Recommendation V1 — deterministic, local-only mapping of the saved
  // personal profile onto one existing template. Reactive + SSR-safe (profile is
  // null on the server / first hydration, so the card renders the no-profile CTA
  // until the real value swaps in). See lib/workout-recommendation.ts.
  const profile = usePersonalProfile();
  const recommendation = useMemo(
    () => getWorkoutRecommendation(profile, templates),
    [profile, templates],
  );

  // When a meaningful draft exists, the restore card up top is the primary path
  // ("המשך אימון"). The hero's start action then steps down to a secondary weight
  // so two strong primaries never compete for "what do I do now?".
  const hasActiveDraft = hasMeaningfulWorkoutDraft(draft);

  const openBuilder = (seed: BuilderSeed | null) => {
    setBuilderSeed(seed);
    setResumingDraft(false);
    setEditingTemplate(null);
    setBuilding(true);
  };

  const closeBuilder = () => {
    setBuilding(false);
    setBuilderSeed(null);
    setResumingDraft(false);
  };

  // Resume the auto-saved draft: open the builder seeded from it, in resume mode.
  const continueDraft = () => {
    const current = getActiveWorkoutDraft();
    if (!current) return;
    setBuilderSeed(fromActiveWorkoutDraft(current));
    setResumingDraft(true);
    setEditingTemplate(null);
    setBuilding(true);
  };

  // Explicit discard from the hub (after a confirm) — clears the draft slot. The
  // draft store notifies, so the banner disappears on its own.
  const discardDraft = () => {
    clearActiveWorkoutDraft();
    setDiscardOpen(false);
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
          resumed={resumingDraft}
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
          {/* Returning to an unsaved session — premium restore prompt. Only
              shown for a meaningful draft, so an untouched builder never nags. */}
          {hasActiveDraft && draft && (
            <DraftRestoreCard
              draft={draft}
              onContinue={continueDraft}
              onDiscard={() => setDiscardOpen(true)}
              description="המערכת שמרה טיוטה מקומית כדי שלא תאבד את מה שהזנת."
              discardLabel="מחק טיוטה"
            />
          )}

          {/* Command center — the workouts hub at a glance + the primary CTA.
              Layered glows (strength blue lead + a warm energy counter-glow) and
              a deeper gradient wash give the hero richer, more alive depth while
              it still clearly belongs to the workouts module. */}
          <Card
            variant="raised"
            className="module-strength sheen relative overflow-hidden p-5"
          >
            <div
              className="pointer-events-none absolute -start-10 -top-14 h-40 w-40 rounded-full opacity-70 blur-2xl"
              style={{ background: "var(--accent-strength-soft)" }}
            />
            <div
              className="pointer-events-none absolute -end-12 -bottom-12 h-36 w-36 rounded-full opacity-50 blur-2xl"
              style={{ background: "var(--accent-energy-soft)" }}
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
                <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2 px-3.5 py-2.5">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 start-0 w-1 rounded-full"
                    style={{ background: "var(--gradient-strength)" }}
                  />
                  <p className="text-[18px] font-extrabold tabular-nums leading-none text-[color:var(--accent-strength)]">
                    {templates.length}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-faint">
                    תבניות מוכנות
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2 px-3.5 py-2.5">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 start-0 w-1 rounded-full"
                    style={{ background: "var(--gradient-energy)" }}
                  />
                  <p className="text-[18px] font-extrabold tabular-nums leading-none text-[color:var(--accent-energy)]">
                    {workouts.length}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-faint">
                    אימונים תועדו
                  </p>
                </div>
              </div>

              {/* Two clearly-ranked actions: start a workout now (primary) vs.
                  save a reusable plan for later (secondary). When a draft is
                  live, "המשך אימון" up top owns the primary weight, so the start
                  button here steps down to secondary. */}
              <div className="mt-4 space-y-2.5">
                <Button
                  onClick={() => openBuilder(null)}
                  size="lg"
                  variant={hasActiveDraft ? "secondary" : "primary"}
                  className={cn(
                    "w-full",
                    !hasActiveDraft &&
                      "strength-gradient shadow-glow-strength sheen",
                  )}
                >
                  <PlayIcon className="h-5 w-5" /> התחל אימון
                </Button>
                <Button
                  onClick={() => setEditingTemplate("new")}
                  variant="secondary"
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4" /> צור תבנית חדשה
                </Button>
              </div>
            </div>
          </Card>

          {/* Workout recommendation — sits below the command area and above the
              templates list, so a returning user with a profile is guided to a
              good starting template. It never outranks the draft restore card
              above (which stays the strongest action when a draft exists). */}
          <WorkoutRecommendationCard
            result={recommendation}
            templates={templates}
            onStartTemplate={startFromTemplate}
            onCreateTemplate={() => setEditingTemplate("new")}
          />

          {/* Templates are the main content of the hub — saved plans you start
              from in one tap. Kept directly under the command area so the page
              guides you toward picking one. */}
          <section>
            <SectionHeader
              title="תבניות אימון"
              hint={
                templates.length > 0
                  ? "בחר תבנית מוכנה והתחל להתאמן"
                  : undefined
              }
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
              <div className="module-strength sheen relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border border-dashed border-border-strong bg-surface/50 px-6 py-8 text-center">
                <div
                  className="pointer-events-none absolute -end-10 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl"
                  style={{ background: "var(--accent-strength-soft)" }}
                />
                <span className="strength-gradient shadow-glow-strength sheen relative flex h-12 w-12 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)]">
                  <ListIcon className="h-6 w-6" />
                </span>
                <div className="relative">
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
                  className="relative"
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

          {/* Gym attendance — a quiet, secondary link to the separate "time at
              the gym" tracker. Distinct from logging a workout, so it sits below
              the templates rather than competing with starting one. */}
          <Link href="/gym" className="tap block" aria-label="נוכחות במכון">
            <Card className="module-energy sheen flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
                <DoorEnterIcon className="h-[22px] w-[22px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-tight text-foreground">
                  נוכחות במכון
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-muted">
                  כניסה, יציאה וזמן שהייה — בנפרד מהאימון
                </p>
              </div>
              <ChevronIcon className="h-4 w-4 shrink-0 rotate-180 text-faint" />
            </Card>
          </Link>

          {/* Personal training profile — a quiet, optional entry point to tailor
              the workouts experience. Never blocks anything; the profile is
              localStorage-only and editable any time. */}
          <Link
            href="/training-profile"
            className="tap block"
            aria-label="התאם את חוויית האימונים — פרופיל אימון אישי"
          >
            <Card className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
                <TargetIcon className="h-[22px] w-[22px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-tight text-foreground">
                  התאם את חוויית האימונים
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-muted">
                  ענה על כמה שאלות כדי שנוכל להציע כיוון מתאים בהמשך
                </p>
              </div>
              <ChevronIcon className="h-4 w-4 shrink-0 rotate-180 text-faint" />
            </Card>
          </Link>
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
          // Calm, compact empty state. The command center above already offers
          // "התחל אימון", so history stays secondary and doesn't re-duplicate the
          // primary CTA — it just explains what will appear here.
          <div className="module-strength sheen relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border border-dashed border-border-strong bg-surface/50 px-6 py-8 text-center">
            <div
              className="pointer-events-none absolute -end-10 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl"
              style={{ background: "var(--accent-strength-soft)" }}
            />
            <span className="strength-gradient shadow-glow-strength sheen relative flex h-12 w-12 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)]">
              <DumbbellIcon className="h-6 w-6" />
            </span>
            <div className="relative">
              <p className="text-[14.5px] font-bold text-foreground">
                כאן ייבנה סיפור הכוח שלך
              </p>
              <p className="mt-1 max-w-[17rem] text-[12.5px] leading-relaxed text-muted">
                אימונים שתתעד יופיעו כאן — סטים, משקלים ונפח מצטבר, שבוע אחרי
                שבוע.
              </p>
            </div>
          </div>
        ) : (
          <WorkoutHistory
            workouts={workouts}
            onDelete={(id) => removeWorkout(id)}
            onSaveAsTemplate={(session) => addTemplateFromSession(session)}
          />
        )}
      </section>

      <ConfirmDialog
        open={discardOpen}
        title="למחוק את הטיוטה?"
        description="הטיוטה השמורה של האימון תימחק מהמכשיר הזה. לא ניתן לשחזר אותה."
        confirmLabel="מחק טיוטה"
        cancelLabel="ביטול"
        tone="danger"
        onConfirm={discardDraft}
        onCancel={() => setDiscardOpen(false)}
      />
    </div>
  );
}
