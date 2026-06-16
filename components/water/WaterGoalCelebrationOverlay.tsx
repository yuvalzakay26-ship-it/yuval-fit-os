"use client";

import { useEffect, useRef, useState } from "react";
import { WATER_GOAL_REACHED_EVENT } from "@/lib/water-goal-events";
import { DropletIcon, SparkIcon } from "@/components/ui/icons";

/**
 * App-wide, one-shot celebration that plays when the user crosses into 100% of
 * the daily water goal — no matter which surface logged the drink (the trigger
 * is centralized in `logWater`, which dispatches `yfos:water-goal-reached`).
 *
 * It is mounted once, high in the app shell. It is **not** a modal: it is
 * `pointer-events-none` and `aria-hidden`, never traps focus, never needs
 * dismissing, and tears itself down after ~1.5s. A separate visually-hidden
 * `role="status"` announces the moment to screen readers. All motion is CSS and
 * fully disabled under `prefers-reduced-motion` (then it shows a brief, static
 * glow instead — see globals.css).
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
  const [active, setActive] = useState(false);
  // Re-keyed each time so the CSS animations restart on repeat celebrations.
  const [runId, setRunId] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onReached = () => {
      setRunId((n) => n + 1);
      setActive(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), DURATION_MS);
    };
    window.addEventListener(WATER_GOAL_REACHED_EVENT, onReached);
    return () => {
      window.removeEventListener(WATER_GOAL_REACHED_EVENT, onReached);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <>
      <div
        key={runId}
        aria-hidden="true"
        data-water-celebration="active"
        className="water-celebrate pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      >
        {/* Soft blue glow wash + a diagonal liquid sweep. */}
        <div className="water-celebrate-glow absolute inset-0" />
        <div className="water-celebrate-sweep absolute inset-0" />

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

        {/* Center badge — premium, calm, not childish. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="water-celebrate-badge flex flex-col items-center gap-2.5">
            <span className="water-gradient shadow-glow-water flex h-20 w-20 items-center justify-center rounded-full text-white">
              <DropletIcon className="h-10 w-10" />
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--accent-water-soft)] px-3.5 py-1.5 text-[14px] font-extrabold text-[color:var(--accent-water)] shadow-glow-water">
              <SparkIcon className="h-4 w-4" />
              יעד המים הושלם
            </span>
          </div>
        </div>
      </div>

      {/* Screen-reader announcement (not inside the aria-hidden visual layer). */}
      <p key={`sr${runId}`} role="status" className="sr-only">
        כל הכבוד, הגעת ליעד המים היומי
      </p>
    </>
  );
}
