"use client";

import { getWaterStatus } from "@/lib/water-status";
import { waterStatusCopy, type WaterBannerTone } from "./water-copy";
import { cn } from "@/lib/utils";
import {
  DropletIcon,
  SparkIcon,
  TrophyIcon,
  WarningIcon,
} from "@/components/ui/icons";

/**
 * Calm, non-intrusive banner shown once today's water intake reaches or exceeds
 * the configured goal. It is a graduated treatment — celebration at goal, then a
 * progressively more noticeable (but never frightening, never red-before-its-due)
 * over-goal message. Returns `null` below the goal so the normal tracker is
 * untouched, and it never blocks the add-water controls (it renders inline).
 *
 * Visual treatment is CSS-light and respects `prefers-reduced-motion` (the
 * shimmer/float keyframes are disabled via globals.css). All copy comes from
 * `waterStatusCopy` so the wording stays centralized and non-medical.
 */
const TONE: Record<
  WaterBannerTone,
  {
    container: string;
    iconWrap: string;
    title: string;
    line: string;
    Icon: typeof DropletIcon;
    /** Celebration-only decorative layer flag. */
    celebrate?: boolean;
  }
> = {
  celebrate: {
    container:
      "module-water border-[color:var(--accent-water)]/30 bg-[color:var(--accent-water-soft)]",
    iconWrap:
      "water-gradient text-white shadow-glow-water",
    title: "text-foreground",
    line: "text-[color:var(--accent-water)]",
    Icon: TrophyIcon,
    celebrate: true,
  },
  calm: {
    container:
      "border-[color:var(--accent-water)]/25 bg-[color:var(--accent-water-soft)]",
    iconWrap: "bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]",
    title: "text-foreground",
    line: "text-muted",
    Icon: DropletIcon,
  },
  attention: {
    container:
      "border-amber-400/40 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-400/10",
    iconWrap:
      "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
    title: "text-amber-800 dark:text-amber-200",
    line: "text-amber-700/90 dark:text-amber-200/80",
    Icon: WarningIcon,
  },
  caution: {
    container:
      "border-rose-400/45 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-500/10",
    iconWrap: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    title: "text-rose-800 dark:text-rose-200",
    line: "text-rose-700/90 dark:text-rose-200/80",
    Icon: WarningIcon,
  },
};

export function WaterGoalBanner({
  totalMl,
  goalMl,
  className,
}: {
  totalMl: number;
  goalMl: number;
  className?: string;
}) {
  const info = getWaterStatus(totalMl, goalMl);
  const copy = waterStatusCopy(info.status);
  if (!copy) return null; // under_goal → no banner.

  const tone = TONE[copy.tone];
  const { Icon } = tone;

  return (
    <div
      role="status"
      aria-live="polite"
      data-water-status={info.status}
      className={cn(
        "sheen relative overflow-hidden rounded-2xl border p-4",
        tone.container,
        className,
      )}
    >
      {tone.celebrate && (
        <>
          {/* Soft glow blob, matching the water card treatment. */}
          <div
            className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-60 blur-2xl"
            style={{ background: "var(--accent-water-soft)" }}
          />
          {/* A gentle shimmer sweep + a few drifting bubbles. CSS-light, and
              fully disabled under prefers-reduced-motion (see globals.css). */}
          <div className="water-shimmer pointer-events-none absolute inset-0" />
          <span className="water-bubble pointer-events-none absolute bottom-2 left-6 h-2 w-2 rounded-full bg-white/50" />
          <span
            className="water-bubble pointer-events-none absolute bottom-3 left-14 h-1.5 w-1.5 rounded-full bg-white/40"
            style={{ animationDelay: "1.2s" }}
          />
          <span
            className="water-bubble pointer-events-none absolute bottom-1 left-24 h-1 w-1 rounded-full bg-white/40"
            style={{ animationDelay: "2.1s" }}
          />
        </>
      )}

      <div className="relative flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            tone.iconWrap,
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("flex items-center gap-1.5 text-[15px] font-extrabold leading-snug", tone.title)}>
            {tone.celebrate && <SparkIcon className="h-4 w-4 text-[color:var(--accent-water)]" />}
            {copy.title}
          </p>
          {copy.lines.map((line) => (
            <p key={line} className={cn("mt-1 text-[13px] font-medium leading-relaxed", tone.line)}>
              {line}
            </p>
          ))}
          <p className={cn("mt-1.5 text-[12px] font-semibold tabular-nums", tone.line)}>
            {info.percent}% מהיעד שהגדרת
          </p>
        </div>
      </div>
    </div>
  );
}
