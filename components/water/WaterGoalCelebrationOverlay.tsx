"use client";

import { WATER_GOAL_REACHED_EVENT } from "@/lib/water-goal-events";
import { DropletIcon, SparkIcon } from "@/components/ui/icons";
import {
  CelebrationOverlay,
  useCelebrationTrigger,
} from "@/components/celebrations/CelebrationOverlay";

/**
 * App-wide, one-shot celebration that plays when the user crosses into 100% of
 * the daily water goal — no matter which surface logged the drink (the trigger
 * is centralized in `logWater`, which dispatches `yfos:water-goal-reached`).
 *
 * A thin wrapper over the shared {@link CelebrationOverlay} primitive: it owns
 * only the water-specific event, duration, decorations, icon, copy, and colour
 * variant. The non-modal/`pointer-events-none`/`aria-hidden`/`role="status"`
 * behaviour and the one-shot timer live in the primitive. Motion is CSS and
 * fully disabled under `prefers-reduced-motion` (see globals.css).
 */
const DURATION_MS = 1500;

// Fixed decorative positions (no Math.random — keeps it deterministic and avoids
// the sandbox's disabled RNG). Rising bubbles + a couple of falling drops.
const BUBBLES = [
  { left: "12%", size: 10, delay: "0s" },
  { left: "26%", size: 7, delay: "0.25s" },
  { left: "44%", size: 12, delay: "0.1s" },
  { left: "61%", size: 8, delay: "0.35s" },
  { left: "78%", size: 11, delay: "0.05s" },
  { left: "88%", size: 6, delay: "0.4s" },
];
const DROPS = [
  { left: "20%", size: 9, delay: "0.1s" },
  { left: "50%", size: 11, delay: "0.3s" },
  { left: "72%", size: 8, delay: "0.2s" },
];

export function WaterGoalCelebrationOverlay() {
  const { visible, runId } = useCelebrationTrigger(
    WATER_GOAL_REACHED_EVENT,
    DURATION_MS,
  );

  if (!visible) return null;

  return (
    <CelebrationOverlay
      runKey={runId}
      variant="water-celebrate"
      dataAttribute="data-water-celebration"
      decorations={
        <>
          {/* Rising bubbles from the bottom. */}
          {BUBBLES.map((b, i) => (
            <span
              key={`b${i}`}
              className="water-celebrate-bubble absolute rounded-full"
              style={{
                left: b.left,
                bottom: "-16px",
                width: b.size,
                height: b.size,
                animationDelay: b.delay,
              }}
            />
          ))}

          {/* A few drops falling from the top. */}
          {DROPS.map((d, i) => (
            <span
              key={`d${i}`}
              className="water-celebrate-drop absolute rounded-full"
              style={{
                left: d.left,
                top: "-16px",
                width: d.size,
                height: d.size,
                animationDelay: d.delay,
              }}
            />
          ))}
        </>
      }
      iconClassName="water-gradient shadow-glow-water flex h-20 w-20 items-center justify-center rounded-full text-white"
      icon={<DropletIcon className="h-10 w-10" />}
      pill={
        <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--accent-water-soft)] px-3.5 py-1.5 text-[14px] font-extrabold text-[color:var(--accent-water)] shadow-glow-water">
          <SparkIcon className="h-4 w-4" />
          יעד המים הושלם
        </span>
      }
      statusMessage="כל הכבוד, הגעת ליעד המים היומי"
    />
  );
}
