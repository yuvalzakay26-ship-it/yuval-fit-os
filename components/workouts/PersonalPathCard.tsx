"use client";

import Link from "next/link";
import type { PersonalPathState } from "@/lib/personal-path";
import { formatHebrewDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  BoltIcon,
  ChartIcon,
  CheckIcon,
  PlayIcon,
  SparkIcon,
} from "@/components/ui/icons";

// Presentational layer for Personal Path V1. Every decision is made in
// lib/personal-path.ts; this card only renders the resulting state and wires its
// CTAs to behaviour the parent (WorkoutsView) owns — start a free workout, start
// from the recommended template, or scroll back to the recommendation card. It
// is deliberately CALM and COMPACT (a default Card, not the raised hero/recommend
// treatment) so it never overpowers the active-draft restore card, the command
// center, or the recommendation card. Hebrew, RTL, mobile-first.

interface PersonalPathCardProps {
  state: PersonalPathState;
  /** Start a free workout (the existing `openBuilder(null)` behaviour). */
  onStartAnother: () => void;
  /** Start from the recommended existing template (existing start flow). */
  onStartRecommendation: (templateId: string) => void;
  /** Smooth-scroll up to the recommendation card on the same page. */
  onBackToRecommendation: () => void;
}

/** Shared compact shell: a leading badge + title + the state's body/actions. */
function PathShell({
  children,
  eyebrow = "המסלול האישי שלך",
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <Card className="relative space-y-3 p-4" data-testid="personal-path">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
          <BoltIcon className="h-[22px] w-[22px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            הצעד הבא שלך
          </p>
          <p className="mt-0.5 text-[15px] font-bold leading-tight text-foreground">
            {eyebrow}
          </p>
        </div>
      </div>
      {children}
    </Card>
  );
}

/** A small status chip used in the in-progress state. */
function PathChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11.5px] font-semibold text-foreground">
      {children}
    </span>
  );
}

export function PersonalPathCard({
  state,
  onStartAnother,
  onStartRecommendation,
  onBackToRecommendation,
}: PersonalPathCardProps) {
  // State 1 — no usable profile yet: a quiet invitation, never blocking.
  if (state.kind === "no-profile") {
    return (
      <PathShell>
        <p className="text-[12.5px] leading-relaxed text-muted">
          מלא פרופיל אימון קצר כדי שנוכל להציג לך כיוון אישי להמשך.
        </p>
        <Link
          href="/training-profile"
          className="tap inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl border border-border-strong bg-surface text-[13.5px] font-semibold text-foreground hover:bg-surface-2"
        >
          <SparkIcon className="h-4 w-4 text-accent" /> מלא פרופיל אימון
        </Link>
      </PathShell>
    );
  }

  // State 2 — profile exists but no concrete recommendation is possible yet
  // (missing core answers, or — rarely — no templates). The recommendation card
  // adjacent owns the precise fix; here we point at completing the profile, the
  // dominant cause. (The card lives on /workouts, so a "go to workouts" CTA would
  // be a no-op — we route to the profile instead; see docs.)
  if (state.kind === "incomplete-profile") {
    return (
      <PathShell>
        <p className="text-[12.5px] leading-relaxed text-muted">
          נשלים עוד כמה פרטים או תבניות כדי להציג לך כיוון אישי ברור יותר.
        </p>
        <Link
          href="/training-profile"
          className="tap inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl border border-border-strong bg-surface text-[13.5px] font-semibold text-foreground hover:bg-surface-2"
        >
          <SparkIcon className="h-4 w-4 text-accent" /> השלם פרופיל אימון
        </Link>
      </PathShell>
    );
  }

  // State 3 — profile + recommendation, but nothing saved yet: the first step is
  // to start from the recommended template.
  if (state.kind === "ready-to-start") {
    return (
      <PathShell>
        <div className="rounded-2xl border border-border bg-surface-2 px-3.5 py-3">
          <p className="text-[13px] font-bold text-foreground">
            הצעד הראשון שלך: להתחיל מהתבנית המומלצת.
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            זו נקודת התחלה לפי הפרופיל והתבניות שקיימות אצלך.
          </p>
        </div>
        <Button
          onClick={() => onStartRecommendation(state.recommendation.templateId)}
          size="lg"
          className="w-full"
        >
          <PlayIcon className="h-5 w-5" /> התחל מההמלצה
        </Button>
        <p className="text-center text-[11px] font-medium text-faint">
          אפשר לשנות בכל רגע.
        </p>
      </PathShell>
    );
  }

  // State 4 — at least one workout saved: keep the streak going.
  const { workoutCount, lastWorkoutDate, profileComplete, recommendation } = state;
  return (
    <PathShell>
      <p className="text-[12.5px] leading-relaxed text-muted">
        התחלת לבנות רצף. הצעד הבא הוא להמשיך באימון נוסף או לחזור לתבנית שמתאימה
        לך.
      </p>

      <div className="flex flex-wrap gap-2">
        {profileComplete && (
          <PathChip>
            <CheckIcon className="h-3 w-3 text-accent" /> פרופיל הושלם
          </PathChip>
        )}
        <PathChip>אימונים שנשמרו: {workoutCount}</PathChip>
        {lastWorkoutDate && (
          <PathChip>אימון אחרון: {formatHebrewDate(lastWorkoutDate)}</PathChip>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button onClick={onStartAnother} size="lg">
          <PlayIcon className="h-[18px] w-[18px]" /> התחל אימון נוסף
        </Button>
        <Link
          href="/progress"
          className="tap inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border-strong bg-surface px-4 text-[15px] font-semibold text-foreground hover:bg-surface-2"
        >
          <ChartIcon className="h-[18px] w-[18px]" /> צפה בהתקדמות
        </Link>
      </div>

      {recommendation && (
        <button
          type="button"
          onClick={onBackToRecommendation}
          className="tap mx-auto block w-fit px-2 py-1 text-center text-[12.5px] font-semibold text-muted hover:text-foreground"
        >
          חזור להמלצה
        </button>
      )}

      <p className="text-center text-[11px] font-medium text-faint">
        ככל שתשמור יותר אימונים, הכיוון יהיה ברור יותר.
      </p>
    </PathShell>
  );
}
