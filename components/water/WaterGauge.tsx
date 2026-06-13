"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, DropletIcon } from "@/components/ui/icons";

/**
 * Premium hydration gauge — a circular vessel that fills from the bottom with a
 * living, drifting water surface. Used at multiple sizes (compact cards and the
 * full water screen). The fill height tracks `value / goal`; reaching the goal
 * swaps the centre droplet for a check and the surface settles at the top.
 *
 * Pure visual: no data access, no chart. Wave motion respects reduced-motion
 * (the animation is disabled via CSS).
 */
export function WaterGauge({
  value,
  goal,
  size = 132,
  showLabel = true,
  className,
}: {
  value: number;
  goal: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[:]/g, "");
  const clipId = `water-clip-${uid}`;
  const gradId = `water-grad-${uid}`;

  const pct = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
  const percentLabel = Math.round(pct * 100);
  const reached = goal > 0 && value >= goal;

  // Water level inside the 0–100 viewBox: 100 = empty (surface at bottom),
  // a little headroom kept at the top so a full gauge still shows a meniscus.
  const levelY = 100 - pct * 96 - 2;

  // Wave crest path: mean line at y=0, period 50, width 200 (4 periods) so the
  // horizontal scroll loops seamlessly. Extends well below to fill the body.
  const wave =
    "M0,0 Q12.5,-4 25,0 T50,0 T75,0 T100,0 T125,0 T150,0 T175,0 T200,0 L200,200 L0,200 Z";

  const iconSize = Math.round(size * 0.2);
  const numberSize = Math.round(size * 0.18);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="block"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="47" />
          </clipPath>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--water-from)" />
            <stop offset="100%" stopColor="var(--water-to)" />
          </linearGradient>
        </defs>

        {/* Empty vessel tint */}
        <circle cx="50" cy="50" r="47" className="fill-surface-2" />

        {/* Water body — translated to the current level, with a smooth rise. */}
        <g
          clipPath={`url(#${clipId})`}
          style={{
            transform: `translateY(${levelY}px)`,
            transition: "transform 800ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Back layer — softer, slower, for depth */}
          <g className="water-wave-slow" opacity={0.55}>
            <path d={wave} fill={`url(#${gradId})`} />
          </g>
          {/* Front layer */}
          <g className="water-wave">
            <path d={wave} fill={`url(#${gradId})`} />
          </g>
        </g>

        {/* Rim */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          strokeWidth="2"
          className="stroke-border"
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "flex items-center justify-center",
              pct > 0.45 ? "text-white" : "text-[color:var(--accent-water)]",
            )}
            style={{ width: iconSize, height: iconSize }}
          >
            {reached ? (
              <CheckIcon className="h-full w-full" />
            ) : (
              <DropletIcon className="h-full w-full" />
            )}
          </span>
          <span
            className={cn(
              "mt-0.5 font-extrabold leading-none tabular-nums",
              pct > 0.55 ? "text-white" : "text-foreground",
            )}
            style={{ fontSize: numberSize }}
          >
            {percentLabel}%
          </span>
        </div>
      )}
    </div>
  );
}
