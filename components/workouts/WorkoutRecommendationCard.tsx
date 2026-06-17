"use client";

import Link from "next/link";
import type { WorkoutTemplate } from "@/lib/fitness-types";
import type {
  WorkoutRecommendation,
  WorkoutRecommendationResult,
} from "@/lib/workout-recommendation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CheckIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SparkIcon,
  TargetIcon,
} from "@/components/ui/icons";

// Presentational layer for Workout Recommendation V1. All decisions are made in
// lib/workout-recommendation.ts; this component only renders the resulting state
// and wires the CTAs to behaviour the parent owns (start-from-template / create
// template). It mounts on /workouts between the command center and the templates
// list. Calm, premium, RTL, mobile-first — it never competes with the active
// draft restore card above it.

interface WorkoutRecommendationCardProps {
  result: WorkoutRecommendationResult;
  /** Existing templates, used to resolve the recommended one for "התחל אימון". */
  templates: WorkoutTemplate[];
  /** Start the recommended existing template (current start-from-template flow). */
  onStartTemplate: (template: WorkoutTemplate) => void;
  /** Open the template editor to create a new template. */
  onCreateTemplate: () => void;
}

/** Anchor used by the optional "ראה תבניות נוספות" link to reach the list below. */
const TEMPLATES_ANCHOR = "#workout-templates";

/** Shared muted shell for the quiet CTA states (1–3). */
function QuietCta({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <Card
      className="flex items-start gap-3"
      data-testid="workout-recommendation"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
        <TargetIcon className="h-[22px] w-[22px]" />
      </span>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div>
          <p className="text-[15px] font-bold leading-tight text-foreground">
            {title}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{body}</p>
        </div>
        {action}
      </div>
    </Card>
  );
}

const CONFIDENCE_LABEL: Record<WorkoutRecommendation["confidence"], string> = {
  high: "התאמה טובה",
  medium: "המלצה ראשונית",
  low: "נקודת התחלה",
};

export function WorkoutRecommendationCard({
  result,
  templates,
  onStartTemplate,
  onCreateTemplate,
}: WorkoutRecommendationCardProps) {
  // State 1 — no profile yet: quiet invitation, never blocking.
  if (result.status === "no-profile") {
    return (
      <QuietCta
        title="המלצת אימון אישית"
        body="מלא פרופיל אימון קצר כדי לקבל המלצת התחלה."
        action={
          <Link
            href="/training-profile"
            className="tap inline-flex h-9 items-center gap-1.5 rounded-xl bg-surface px-3.5 text-[13px] font-semibold text-foreground border border-border-strong hover:bg-surface-2"
          >
            <SparkIcon className="h-4 w-4 text-accent" /> מלא פרופיל אימון
          </Link>
        }
      />
    );
  }

  // State 2 — older/incomplete profile: ask to complete the basics.
  if (result.status === "incomplete-profile") {
    return (
      <QuietCta
        title="השלם פרופיל כדי לקבל המלצה"
        body="חסרות כמה תשובות בסיסיות כדי להציע תבנית מתאימה."
        action={
          <Link
            href="/training-profile"
            className="tap inline-flex h-9 items-center gap-1.5 rounded-xl bg-surface px-3.5 text-[13px] font-semibold text-foreground border border-border-strong hover:bg-surface-2"
          >
            <PencilIcon className="h-4 w-4 text-accent" /> השלם פרופיל
          </Link>
        }
      />
    );
  }

  // State 3 — profile ready, but no templates to recommend from.
  if (result.status === "no-templates") {
    return (
      <QuietCta
        title="אין עדיין תבניות להמלצה"
        body="אין עדיין תבניות שאפשר להמליץ עליהן. צור תבנית ראשונה ונמליץ על המתאימה לפרופיל שלך."
        action={
          <Button size="sm" variant="secondary" onClick={onCreateTemplate}>
            <PlusIcon className="h-4 w-4" /> צור תבנית חדשה
          </Button>
        }
      />
    );
  }

  // State 4 — a concrete recommendation for one existing template.
  const { recommendation } = result;
  const template = templates.find((t) => t.id === recommendation.templateId);
  // Defensive: if the template vanished between scoring and render, fall back to
  // the create-template fallback rather than showing a dead "start" button.
  if (!template) {
    return (
      <QuietCta
        title="אין עדיין תבניות להמלצה"
        body="אין עדיין תבניות שאפשר להמליץ עליהן. צור תבנית ראשונה ונמליץ על המתאימה לפרופיל שלך."
        action={
          <Button size="sm" variant="secondary" onClick={onCreateTemplate}>
            <PlusIcon className="h-4 w-4" /> צור תבנית חדשה
          </Button>
        }
      />
    );
  }

  return (
    <Card
      variant="raised"
      className="sheen relative overflow-hidden p-5"
      data-testid="workout-recommendation"
    >
      <div
        className="pointer-events-none absolute -start-12 -top-14 h-40 w-40 rounded-full opacity-50 blur-2xl"
        style={{ background: "var(--accent-soft)" }}
      />
      <div className="relative space-y-4">
        <div className="flex items-start gap-3">
          <span className="brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow">
            <SparkIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                המלצת התחלה לפי הפרופיל שלך
              </p>
              <span className="shrink-0 rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold text-accent">
                {CONFIDENCE_LABEL[recommendation.confidence]}
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
              מצאנו תבנית שיכולה להתאים להתחלה שלך.
            </p>
          </div>
        </div>

        {/* The recommended EXISTING template — name + careful explanation. */}
        <div className="rounded-2xl border border-border bg-surface-2 p-3.5">
          <p className="text-[11px] font-semibold text-faint">
            התבנית המומלצת
          </p>
          <p className="mt-0.5 text-[16px] font-extrabold leading-tight text-foreground">
            {template.title}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            {recommendation.explanation}
          </p>
        </div>

        {/* "Why this one?" — the existing reason signals, framed as a section so
            the match feels explained rather than asserted. */}
        {recommendation.reasons.length > 0 && (
          <div>
            <p className="text-[13px] font-bold text-foreground">למה דווקא זו?</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {recommendation.reasons.map((reason) => (
                <li
                  key={reason}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-foreground"
                >
                  <CheckIcon className="h-3 w-3 text-accent" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* "Your next step" — turn the suggestion into a clear, low-pressure
            action, and make explicit that it can be changed at any time. */}
        <div className="rounded-2xl border border-border bg-surface px-3.5 py-3">
          <p className="text-[13px] font-bold text-foreground">הצעד הבא שלך</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            התחל אימון ראשון מהתבנית הזאת, ואז תוכל לעדכן את הפרופיל או לבחור תבנית
            אחרת בכל רגע.
          </p>
        </div>

        <div className="space-y-2.5">
          <Button
            onClick={() => onStartTemplate(template)}
            size="lg"
            className="w-full"
          >
            <PlayIcon className="h-5 w-5" /> התחל אימון
          </Button>
          <Link
            href="/training-profile"
            className={cn(
              "tap inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl",
              "border border-border-strong bg-surface text-sm font-semibold text-foreground hover:bg-surface-2",
            )}
          >
            <PencilIcon className="h-[18px] w-[18px]" /> ערוך פרופיל
          </Link>
          <a
            href={TEMPLATES_ANCHOR}
            className="tap mx-auto block w-fit px-2 py-1 text-center text-[12.5px] font-semibold text-muted hover:text-foreground"
          >
            ראה תבניות נוספות
          </a>
        </div>
      </div>
    </Card>
  );
}
