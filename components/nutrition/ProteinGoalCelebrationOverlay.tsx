"use client";

import { useEffect, useRef, useState } from "react";
import { PROTEIN_GOAL_REACHED_EVENT } from "@/lib/protein-goal-events";
import { TargetIcon, SparkIcon } from "@/components/ui/icons";

/**
 * App-wide, one-shot celebration that plays when today's logged protein crosses
 * into the user's *configured* daily protein goal — no matter which surface
 * logged the food (the trigger is centralized in `addFoodLog`, which dispatches
 * `yfos:protein-goal-reached` only on the below→at-or-above edge).
 *
 * Deliberately distinct from the blue water-goal moment and the mint/violet
 * supplement moment: a warm amber/gold wash with a soft cream glow, drifting
 * macro rings, and a scatter of gold sparkles around a popped target badge —
 * premium and calm, never childish, never clinical. It is **not** a modal: it is
 * `pointer-events-none` and `aria-hidden`, never traps focus, never needs
 * dismissing, and tears itself down after ~1.4s. A separate visually-hidden
 * `role="status"` announces the moment to screen readers. All motion is CSS and
 * fully disabled under `prefers-reduced-motion` (then it shows a brief, static
 * warm glow instead — see globals.css).
 *
 * Copy is neutral encouragement tied to the user's own target — no medical need,
 * recommended amount, diet advice, or body-image language.
 */
const DURATION_MS = 1400;

// Fixed decorative positions (no Math.random — deterministic and sandbox-safe).
// Gold sparkles scattered around the badge + a few macro rings drifting up.
const SPARKS = [
  { left: "22%", top: "34%", size: 14, delay: "0.04s" },
  { left: "72%", top: "30%", size: 11, delay: "0.2s" },
  { left: "61%", top: "62%", size: 13, delay: "0.12s" },
  { left: "31%", top: "60%", size: 10, delay: "0.28s" },
  { left: "46%", top: "24%", size: 9, delay: "0.34s" },
];
const RINGS = [
  { left: "18%", size: 22, delay: "0s" },
  { left: "40%", size: 16, delay: "0.22s" },
  { left: "66%", size: 26, delay: "0.08s" },
  { left: "84%", size: 18, delay: "0.3s" },
];

export function ProteinGoalCelebrationOverlay() {
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
    window.addEventListener(PROTEIN_GOAL_REACHED_EVENT, onReached);
    return () => {
      window.removeEventListener(PROTEIN_GOAL_REACHED_EVENT, onReached);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <>
      <div
        key={runId}
        aria-hidden="true"
        data-protein-celebration="active"
        className="protein-celebrate pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      >
        {/* Warm amber/cream glow wash + a gentle diagonal sweep. */}
        <div className="protein-celebrate-glow absolute inset-0" />
        <div className="protein-celebrate-sweep absolute inset-0" />

        {/* Macro rings drifting gently upward. */}
        {RINGS.map((r, i) => (
          <span
            key={`r${i}`}
            className="protein-celebrate-ring absolute rounded-full"
            style={{
              left: r.left,
              bottom: "-28px",
              width: r.size,
              height: r.size,
              animationDelay: r.delay,
            }}
          />
        ))}

        {/* A scatter of warm-gold sparkles. */}
        {SPARKS.map((s, i) => (
          <span
            key={`s${i}`}
            className="protein-celebrate-spark absolute"
            style={{ left: s.left, top: s.top, animationDelay: s.delay }}
          >
            <span className="block" style={{ width: s.size, height: s.size }}>
              <SparkIcon className="block h-full w-full" />
            </span>
          </span>
        ))}

        {/* Center badge — premium, calm, not childish. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="protein-celebrate-badge flex flex-col items-center gap-2.5">
            <span className="protein-gradient shadow-glow-protein flex h-20 w-20 items-center justify-center rounded-full text-[color:var(--accent-contrast)]">
              <TargetIcon className="h-10 w-10" />
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--accent-protein-soft)] px-3.5 py-1.5 text-[14px] font-extrabold text-[color:var(--accent-protein)] shadow-glow-protein">
              <SparkIcon className="h-4 w-4 shrink-0" />
              יעד החלבון הושלם
            </span>
          </div>
        </div>
      </div>

      {/* Screen-reader announcement (not inside the aria-hidden visual layer). */}
      <p key={`sr${runId}`} role="status" className="sr-only">
        כל הכבוד, יעד החלבון של היום הושלם
      </p>
    </>
  );
}
