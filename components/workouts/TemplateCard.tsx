"use client";

import { useState } from "react";
import type { WorkoutTemplate } from "@/lib/fitness-types";
import { MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PencilIcon, PlayIcon, TrashIcon } from "@/components/ui/icons";

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

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold text-foreground">
            {template.title}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {template.exerciseIds.length} תרגילים
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            onClick={onEdit}
            className="tap flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-foreground"
            aria-label="עריכת תבנית"
          >
            <PencilIcon className="h-[17px] w-[17px]" />
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="tap flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-red-500"
            aria-label="מחיקת תבנית"
          >
            <TrashIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {template.muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {template.muscleGroups.map((m) => (
            <Badge key={m} tone="strength">
              {MUSCLE_GROUP_LABELS[m]}
            </Badge>
          ))}
        </div>
      )}

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
          size="sm"
          className="strength-gradient shadow-glow-strength w-full"
          onClick={onStart}
        >
          <PlayIcon className="h-4 w-4" /> התחל אימון
        </Button>
      )}
    </Card>
  );
}
