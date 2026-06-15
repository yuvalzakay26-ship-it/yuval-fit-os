"use client";

import Link from "next/link";
import {
  hasMeaningfulWorkoutDraft,
  useActiveWorkoutDraft,
} from "@/lib/active-workout-draft";
import { Card } from "@/components/ui/Card";
import { ChevronIcon, PlayIcon } from "@/components/ui/icons";

/**
 * Compact "you have a workout in progress" strip for Today's active-state slot.
 *
 * Surfaces the locally auto-saved active-workout draft high on the page (right
 * under the Next Action) so a session the user already started is the obvious
 * thing to resume — the command-center "what is active right now?" answer.
 *
 * Strictly presentational and read-only: it observes the draft reactively
 * (SSR-safe — null on the server, real value after hydration) and links into
 * the workouts hub, where the existing `DraftRestoreCard` owns continue/discard.
 * No storage writes, no schema, no new business logic. Renders nothing when no
 * meaningful draft exists, so it never nags an empty/untouched builder.
 *
 * See `lib/active-workout-draft.ts` and `docs/ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md`.
 */
export function ActiveWorkoutResumeCard() {
  const draft = useActiveWorkoutDraft();
  if (!hasMeaningfulWorkoutDraft(draft) || !draft) return null;

  const exerciseCount = draft.entries.length;
  const setCount = draft.entries.reduce((n, e) => n + e.sets.length, 0);
  const title = draft.title.trim() || "אימון ללא כותרת";

  return (
    <Link href="/workouts" aria-label={`המשך אימון: ${title}`} className="tap block">
      <Card
        variant="raised"
        className="module-strength sheen relative overflow-hidden p-4"
      >
        <div
          className="pointer-events-none absolute -start-10 -top-12 h-32 w-32 rounded-full opacity-60 blur-2xl"
          style={{ background: "var(--accent-strength-soft)" }}
        />
        <div className="relative flex items-center gap-3">
          <span className="strength-gradient sheen flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow-strength">
            <PlayIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--accent-strength)]"
              />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-strength)]">
                אימון בתהליך
              </p>
            </div>
            <p className="mt-0.5 truncate text-[15px] font-bold leading-tight text-foreground">
              {title}
            </p>
            <p className="text-[12px] text-muted">
              <span className="tabular-nums">{exerciseCount}</span> תרגילים ·{" "}
              <span className="tabular-nums">{setCount}</span> סטים · ממשיכים
              מאיפה שעצרת
            </p>
          </div>
          <span className="strength-gradient sheen flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--accent-contrast)] shadow-glow-strength">
            <ChevronIcon className="h-4 w-4 rotate-180" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
