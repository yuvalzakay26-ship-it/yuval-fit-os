"use client";

import Link from "next/link";
import type { WorkoutSession } from "@/lib/fitness-types";
import { MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";
import { identityLabel, workoutIdentity } from "@/lib/workout-theme";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ChartIcon,
  ListIcon,
  PlayIcon,
  TrophyIcon,
  XIcon,
} from "@/components/ui/icons";

/**
 * Sum of weight×reps across every set — the SAME simple volume figure the
 * workout history already shows (`WorkoutHistory.sessionVolume`). It is derived
 * read-only from the just-saved session object; it adds no new persisted data,
 * no schema field, and no new "calculation" beyond the count already on screen
 * elsewhere. Bodyweight-only sessions sum to 0, in which case the volume tile is
 * hidden rather than showing a misleading "0".
 */
function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, entry) =>
      total + entry.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
    0,
  );
}

/**
 * Non-blocking "you finished a workout" confirmation, shown at the top of the
 * workouts hub right after a successful save. Presentation only: it reads the
 * returned `WorkoutSession` (already in history) plus two pieces of local UI
 * state from the builder session — the template name it was started from
 * (`sourceLabel`) and whether that start came from the profile recommendation
 * (`fromRecommendation`). Nothing here is persisted; dismissing it just clears
 * local state. It never blocks scrolling and carries no modal/backdrop.
 */
export function WorkoutCompletionCard({
  session,
  sourceLabel,
  fromRecommendation,
  onStartAnother,
  onViewHistory,
  onDismiss,
}: {
  session: WorkoutSession;
  sourceLabel: string | null;
  fromRecommendation: boolean;
  onStartAnother: () => void;
  onViewHistory: () => void;
  onDismiss: () => void;
}) {
  const exerciseCount = session.exercises.length;
  const setCount = session.exercises.reduce(
    (n, e) => n + e.sets.length,
    0,
  );
  const volume = Math.round(sessionVolume(session));
  const identity = workoutIdentity(session.muscleGroups);
  const eyebrow =
    session.muscleGroups.length > 0
      ? identityLabel(identity, MUSCLE_GROUP_LABELS)
      : null;

  return (
    <Card
      variant="raised"
      data-testid="workout-completion"
      className="sheen relative overflow-hidden border-emerald-500/30 p-5"
    >
      {/* Soft success glow — calm, not a celebration overlay. */}
      <div className="pointer-events-none absolute -end-12 -top-14 h-40 w-40 rounded-full bg-emerald-500/15 opacity-70 blur-2xl" />

      <div className="relative space-y-4">
        {/* Header: success badge + title + dismiss. */}
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-glow-strength">
            <TrophyIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">
              אימון הושלם
              {eyebrow && (
                <span className="font-semibold text-faint"> · {eyebrow}</span>
              )}
            </p>
            <p className="mt-0.5 text-[18px] font-extrabold leading-tight text-foreground">
              אימון נשמר בהצלחה
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="סגור הודעה"
            className="tap -me-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-faint hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[13px] leading-relaxed text-muted">
          כל הכבוד — האימון נוסף להיסטוריה שלך.
        </p>

        {/* Optional origin / recommendation context. */}
        {(sourceLabel || fromRecommendation) && (
          <div className="space-y-1">
            {sourceLabel && (
              <p className="text-[12.5px] leading-snug text-muted">
                התאמנת לפי:{" "}
                <span className="font-bold text-foreground">{sourceLabel}</span>
              </p>
            )}
            {fromRecommendation && (
              <p className="text-[12.5px] font-semibold leading-snug text-emerald-700 dark:text-emerald-300">
                השלמת את האימון שהומלץ לפי הפרופיל שלך.
              </p>
            )}
          </div>
        )}

        {/* At-a-glance summary — simple counts from the saved session object. */}
        <div
          className={cn(
            "grid gap-2.5",
            volume > 0 ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          <CompletionStat value={exerciseCount} label="תרגילים" />
          <CompletionStat value={setCount} label="סטים" />
          {volume > 0 && (
            <CompletionStat value={volume.toLocaleString()} label="ק&quot;ג נפח" />
          )}
        </div>

        {/* Next actions — all map to existing routes / behaviours. */}
        <div className="space-y-2.5">
          <Button
            onClick={onViewHistory}
            size="lg"
            className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-glow-strength hover:brightness-[1.04]"
          >
            <ListIcon className="h-5 w-5" /> צפה בהיסטוריית אימונים
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" onClick={onStartAnother}>
              <PlayIcon className="h-[18px] w-[18px]" /> התחל אימון נוסף
            </Button>
            <Link
              href="/progress"
              className="tap inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border-strong bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-2"
            >
              <ChartIcon className="h-[18px] w-[18px]" /> עבור להתקדמות
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** A single compact summary stat tile in the completion card. */
function CompletionStat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-3 py-2.5">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-1 rounded-full bg-emerald-500"
      />
      <p className="text-[19px] font-extrabold leading-none tabular-nums text-emerald-600 dark:text-emerald-400">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-faint">{label}</p>
    </div>
  );
}
