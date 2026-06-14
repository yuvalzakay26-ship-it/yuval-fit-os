"use client";

import type { ActiveWorkoutDraft } from "@/lib/active-workout-draft";
import {
  MUSCLE_GROUP_LABELS,
  muscleGroupsForExercises,
} from "@/lib/seed-exercises";
import { identityLabel, workoutIdentity } from "@/lib/workout-theme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClockIcon, PlayIcon, TrashIcon } from "@/components/ui/icons";

/** Time-of-day label (HH:MM) for when the draft was last auto-saved. */
function savedTimeLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/**
 * Premium "we found an unsaved workout" prompt. Used in two places:
 *   • the workouts hub, when a meaningful draft exists and the builder is closed;
 *   • inside the builder, when a new/template session opens while a draft exists
 *     (the conflict case) — so a draft is never silently overwritten.
 *
 * It paints in the draft's own muscle-group identity (derived, never stored) so
 * it reads in context rather than as a generic alert. Light/dark + RTL come for
 * free from the shared `--mg*` custom-property system. Local-only by design.
 */
export function DraftRestoreCard({
  draft,
  onContinue,
  onDiscard,
  description = "אפשר להמשיך מאיפה שעצרת או למחוק את הטיוטה ולהתחיל מחדש.",
  discardLabel = "מחק טיוטה",
}: {
  draft: ActiveWorkoutDraft;
  onContinue: () => void;
  onDiscard: () => void;
  description?: string;
  discardLabel?: string;
}) {
  const muscleGroups = muscleGroupsForExercises(
    draft.entries.map((e) => e.exerciseId),
  );
  const identity = workoutIdentity(muscleGroups);
  const exerciseCount = draft.entries.length;
  const setCount = draft.entries.reduce((n, e) => n + e.sets.length, 0);
  const time = savedTimeLabel(draft.updatedAt);
  const title = draft.title.trim();

  return (
    <Card
      variant="raised"
      style={identity.style}
      className="module-mg-duo sheen relative overflow-hidden p-5"
    >
      <div
        className="pointer-events-none absolute -end-12 -top-14 h-40 w-40 rounded-full opacity-55 blur-2xl"
        style={{ background: "var(--mg-soft)" }}
      />

      <div className="relative space-y-3.5">
        <div className="flex items-start gap-3">
          <span
            className="mg-gradient shadow-glow-mg flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)]"
            aria-hidden="true"
          >
            <ClockIcon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ color: "var(--mg)" }}
            >
              אימון שלא נשמר
            </p>
            <p className="mt-0.5 text-[16px] font-extrabold leading-tight text-foreground">
              נמצא אימון שלא נשמר
            </p>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-muted">{description}</p>

        {/* Compact summary so the user recognises which session this is. */}
        <div className="rounded-2xl border border-border bg-surface-2 px-3.5 py-2.5">
          <p className="truncate text-[13.5px] font-bold text-foreground">
            {title || "אימון ללא כותרת"}
          </p>
          <p className="mt-0.5 text-[11.5px] font-medium text-faint">
            {muscleGroups.length > 0 && (
              <span style={{ color: "var(--mg)" }}>
                {identityLabel(identity, MUSCLE_GROUP_LABELS)} ·{" "}
              </span>
            )}
            <span className="tabular-nums">{exerciseCount}</span> תרגילים ·{" "}
            <span className="tabular-nums">{setCount}</span> סטים
            {time && (
              <>
                {" · נשמר "}
                <span className="tabular-nums">{time}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button
            onClick={onContinue}
            size="lg"
            className="mg-gradient shadow-glow-mg sheen flex-1"
          >
            <PlayIcon className="h-5 w-5" /> המשך אימון
          </Button>
          <Button variant="secondary" size="lg" onClick={onDiscard}>
            <TrashIcon className="h-[18px] w-[18px]" /> {discardLabel}
          </Button>
        </div>

        <p className="text-center text-[11px] font-medium text-faint">
          הטיוטה נשמרת במכשיר הזה בלבד.
        </p>
      </div>
    </Card>
  );
}
