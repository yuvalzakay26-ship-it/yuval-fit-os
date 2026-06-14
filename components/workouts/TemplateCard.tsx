"use client";

import { useState } from "react";
import type { WorkoutTemplate } from "@/lib/fitness-types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DumbbellIcon, ListIcon, PencilIcon, PlayIcon, TrashIcon } from "@/components/ui/icons";
import { MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";
import { identityLabel, workoutIdentity } from "@/lib/workout-theme";
import { MuscleChips } from "./MuscleChips";

export function TemplateCard({
  template,
  onStart,
  onEdit,
  onDelete,
}: {
  template: WorkoutTemplate;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // The card's whole visual identity (icon, glow, tint, CTA) derives from the
  // template's dominant muscle groups — no two muscle mixes look alike.
  const identity = workoutIdentity(template.muscleGroups);
  const eyebrow = identityLabel(identity, MUSCLE_GROUP_LABELS);

  return (
    <Card
      style={identity.style}
      className="module-mg-duo sheen relative overflow-hidden p-4"
    >
      {/* Twin corner glows give the card depth and its blended identity. */}
      <div
        className="pointer-events-none absolute -end-10 -top-12 h-28 w-28 rounded-full opacity-60 blur-2xl"
        style={{ background: "var(--mg-soft)" }}
      />
      <div
        className="pointer-events-none absolute -start-12 bottom-0 h-24 w-24 rounded-full opacity-50 blur-2xl"
        style={{ background: "var(--mg-2-soft)" }}
      />
      <div className="relative space-y-3.5">
        <div className="flex items-start gap-3">
          <span className="mg-gradient shadow-glow-mg sheen flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)]">
            <DumbbellIcon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10.5px] font-bold uppercase tracking-wide"
              style={{ color: "var(--mg)" }}
            >
              {eyebrow}
            </p>
            <p className="mt-0.5 truncate text-[16px] font-bold leading-tight text-foreground">
              {template.title}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted">
              <ListIcon className="h-3.5 w-3.5 text-faint" />
              {template.exerciseIds.length} תרגילים
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={onEdit}
              className="tap flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-muted hover:bg-surface-2 hover:text-foreground"
              aria-label="עריכת תבנית"
            >
              <PencilIcon className="h-[17px] w-[17px]" />
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="tap flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-faint hover:bg-red-500/10 hover:text-red-500"
              aria-label="מחיקת תבנית"
            >
              <TrashIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        <MuscleChips groups={template.muscleGroups} />

        {confirmingDelete ? (
          <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5 py-2.5">
            <p className="flex-1 text-[12.5px] font-semibold text-foreground">
              למחוק את התבנית?
            </p>
            <Button variant="danger" size="sm" onClick={onDelete}>
              מחיקה
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
            >
              ביטול
            </Button>
          </div>
        ) : (
          <Button
            size="md"
            className="mg-gradient shadow-glow-mg sheen w-full text-[15px]"
            onClick={onStart}
          >
            <PlayIcon className="h-[18px] w-[18px]" /> התחל אימון
          </Button>
        )}
      </div>
    </Card>
  );
}
