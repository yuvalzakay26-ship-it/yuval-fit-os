"use client";

import { PROTEIN_GOAL_REACHED_EVENT } from "@/lib/protein-goal-events";
import { TargetIcon, SparkIcon } from "@/components/ui/icons";
import {
  CelebrationOverlay,
  useCelebrationTrigger,
} from "@/components/celebrations/CelebrationOverlay";

/**
 * App-wide, one-shot celebration that plays when today's logged protein crosses
 * into the user's *configured* daily protein goal — no matter which surface
 * logged the food (the trigger is centralized in `addFoodLog`, which dispatches
 * `yfos:protein-goal-reached` only on the below→at-or-above edge).
 *
 * A thin wrapper over the shared {@link CelebrationOverlay} primitive, owning
 * only the protein-specific event, duration, decorations, icon, copy, and warm
 * amber/gold variant. Deliberately distinct from the blue water moment and the
 * mint/violet supplement moment. Copy is neutral encouragement tied to the
 * user's own target — no medical need, recommended amount, diet advice, or
 * body-image language. Motion is CSS and fully disabled under
 * `prefers-reduced-motion` (see globals.css).
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
  const { visible, runId } = useCelebrationTrigger(
    PROTEIN_GOAL_REACHED_EVENT,
    DURATION_MS,
  );

  if (!visible) return null;

  return (
    <CelebrationOverlay
      runKey={runId}
      variant="protein-celebrate"
      dataAttribute="data-protein-celebration"
      decorations={
        <>
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
        </>
      }
      iconClassName="protein-gradient shadow-glow-protein flex h-20 w-20 items-center justify-center rounded-full text-[color:var(--accent-contrast)]"
      icon={<TargetIcon className="h-10 w-10" />}
      pill={
        <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--accent-protein-soft)] px-3.5 py-1.5 text-[14px] font-extrabold text-[color:var(--accent-protein)] shadow-glow-protein">
          <SparkIcon className="h-4 w-4 shrink-0" />
          יעד החלבון הושלם
        </span>
      }
      statusMessage="כל הכבוד, יעד החלבון של היום הושלם"
    />
  );
}
