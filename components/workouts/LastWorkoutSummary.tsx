import type { WorkoutSession } from "@/lib/fitness-types";
import type { WorkoutTotals } from "@/lib/analytics";
import { MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";
import { identityLabel, workoutIdentity } from "@/lib/workout-theme";
import { cn, formatHebrewDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { DumbbellIcon } from "@/components/ui/icons";

/**
 * Sum of weight×reps across every set — the SAME simple volume figure the
 * workout history and completion cards already show. Derived read-only from the
 * session object; it adds no persisted data, no schema field, and no new
 * "calculation". Bodyweight-only sessions sum to 0, in which case the volume
 * tile is hidden rather than showing a misleading "0".
 */
function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, entry) =>
      total + entry.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
    0,
  );
}

/**
 * "Your last workout" snapshot for the Progress screen. Presentation only: it
 * reads the most recent saved {@link WorkoutSession} plus lifetime totals that
 * are already summed read-only from stored data ({@link WorkoutTotals}). It adds
 * no new persisted data, no schema field, and makes no comparison/improvement
 * claims — only an honest snapshot of what the user already saved on this device.
 * When there is no last workout it stays calm and tells the user what will
 * appear here.
 */
export function LastWorkoutSummary({
  session,
  lifetime,
}: {
  session: WorkoutSession | null;
  lifetime: WorkoutTotals;
}) {
  if (!session) {
    return (
      <Card
        data-testid="last-workout-summary"
        className="flex items-start gap-3 p-4"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-strength-soft)] text-[color:var(--accent-strength)]">
          <DumbbellIcon className="h-[22px] w-[22px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-foreground">
            עדיין אין אימון אחרון
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            כאן תופיע ההיסטוריה אחרי שתסיים אימון ראשון.
          </p>
        </div>
      </Card>
    );
  }

  const exerciseCount = session.exercises.length;
  const setCount = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const volume = Math.round(sessionVolume(session));
  const identity = workoutIdentity(session.muscleGroups);
  const eyebrow =
    session.muscleGroups.length > 0
      ? identityLabel(identity, MUSCLE_GROUP_LABELS)
      : "אימון";

  return (
    <Card
      data-testid="last-workout-summary"
      style={identity.style}
      className="module-mg sheen relative space-y-3 overflow-hidden p-4 ps-5"
    >
      {/* Leading identity bar — the same quiet colour cue the history cards use,
          so the summary reads as one family with the list below it. */}
      <div
        aria-hidden="true"
        className="mg-gradient pointer-events-none absolute inset-y-0 start-0 w-1.5"
      />
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

      {/* At-a-glance counts from the saved session. Volume hides at 0. */}
      <div
        className={cn("grid gap-2", volume > 0 ? "grid-cols-3" : "grid-cols-2")}
      >
        <SummaryTile value={exerciseCount} label="תרגילים" />
        <SummaryTile value={setCount} label="סטים" />
        {volume > 0 && (
          <SummaryTile value={volume.toLocaleString()} label={'נפח (ק"ג)'} tinted />
        )}
      </div>

      {/* Honest lifetime roll-up — cumulative signals only, never a "you
          improved" claim. Wraps cleanly on narrow screens. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[11.5px] text-muted">
        <span>
          סטים שנשמרו{" "}
          <span className="font-bold tabular-nums text-foreground">
            {lifetime.totalSets.toLocaleString()}
          </span>
        </span>
        {lifetime.totalVolumeKg > 0 && (
          <span>
            נפח כולל{" "}
            <span className="font-bold tabular-nums text-foreground">
              {lifetime.totalVolumeKg.toLocaleString()} ק&quot;ג
            </span>
          </span>
        )}
      </div>

      {lifetime.totalWorkouts === 1 && (
        <p className="text-[11.5px] leading-relaxed text-faint">
          ככל שתשמור יותר אימונים, התמונה תהיה ברורה יותר.
        </p>
      )}
    </Card>
  );
}

/** A single compact summary tile. Tinted variant paints in the workout's
 *  muscle-group identity colour; the default sits on the neutral surface. */
function SummaryTile({
  value,
  label,
  tinted,
}: {
  value: number | string;
  label: string;
  tinted?: boolean;
}) {
  return (
    <div
      className={cn("rounded-xl px-3 py-2 text-center", !tinted && "bg-surface-2")}
      style={tinted ? { background: "var(--mg-soft)" } : undefined}
    >
      <p
        className={cn(
          "text-[17px] font-extrabold tabular-nums",
          !tinted && "text-foreground",
        )}
        style={tinted ? { color: "var(--mg)" } : undefined}
      >
        {value}
      </p>
      <p className="text-[10.5px] font-medium text-faint">{label}</p>
    </div>
  );
}
