"use client";

import { useState } from "react";
import {
  SUPPLEMENT_TAKEN_EVENT,
  type SupplementTakenDetail,
} from "@/lib/supplement-events";
import { CapsuleIcon, CheckIcon, SparkIcon } from "@/components/ui/icons";
import {
  CelebrationOverlay,
  useCelebrationTrigger,
} from "@/components/celebrations/CelebrationOverlay";

/**
 * App-wide, one-shot success moment that plays when a supplement is marked as
 * taken for today — no matter which surface logged it (the trigger is
 * centralized in `toggleSupplementTaken`, which dispatches
 * `yfos:supplement-taken` only on the not-taken → taken edge).
 *
 * A thin wrapper over the shared {@link CelebrationOverlay} primitive, owning
 * only the supplement-specific event, duration, decorations, icon, copy, and
 * mint/violet variant — plus the per-event supplement name read from the event
 * detail. Deliberately distinct from the blue water moment and the amber
 * protein moment. Copy is a neutral "logged successfully" confirmation only —
 * no recommendation, dosage, or health claim. Motion is CSS and fully disabled
 * under `prefers-reduced-motion` (see globals.css).
 */
const DURATION_MS = 1300;

// Fixed decorative positions (no Math.random — deterministic and sandbox-safe).
// Floating capsules drifting up + a scatter of sparkles.
const CAPSULES = [
  { left: "16%", size: 16, delay: "0s", rotate: "-18deg" },
  { left: "37%", size: 12, delay: "0.18s", rotate: "12deg" },
  { left: "63%", size: 18, delay: "0.06s", rotate: "22deg" },
  { left: "82%", size: 13, delay: "0.26s", rotate: "-10deg" },
];
const SPARKS = [
  { left: "24%", top: "32%", size: 14, delay: "0.05s" },
  { left: "70%", top: "28%", size: 11, delay: "0.22s" },
  { left: "58%", top: "60%", size: 13, delay: "0.12s" },
  { left: "33%", top: "64%", size: 10, delay: "0.3s" },
];

export function SupplementTakenCelebrationOverlay() {
  const [name, setName] = useState("");
  const { visible, runId } = useCelebrationTrigger(
    SUPPLEMENT_TAKEN_EVENT,
    DURATION_MS,
    (event) => {
      const detail = (event as CustomEvent<SupplementTakenDetail>).detail;
      setName(detail?.supplementName ?? "");
    },
  );

  if (!visible) return null;

  const message = name ? `${name} הוזן בהצלחה` : "התוסף הוזן בהצלחה";

  return (
    <CelebrationOverlay
      runKey={runId}
      variant="supplement-celebrate"
      dataAttribute="data-supplement-celebration"
      decorations={
        <>
          {/* Capsules drifting gently upward. */}
          {CAPSULES.map((c, i) => (
            <span
              key={`c${i}`}
              className="supplement-celebrate-capsule absolute"
              style={{ left: c.left, bottom: "-20px", animationDelay: c.delay }}
            >
              <span
                className="block"
                style={{
                  width: c.size,
                  height: c.size,
                  transform: `rotate(${c.rotate})`,
                }}
              >
                <CapsuleIcon className="block h-full w-full" />
              </span>
            </span>
          ))}

          {/* A scatter of warm-gold sparkles. */}
          {SPARKS.map((s, i) => (
            <span
              key={`s${i}`}
              className="supplement-celebrate-spark absolute"
              style={{ left: s.left, top: s.top, animationDelay: s.delay }}
            >
              <span className="block" style={{ width: s.size, height: s.size }}>
                <SparkIcon className="block h-full w-full" />
              </span>
            </span>
          ))}
        </>
      }
      iconClassName="supplement-gradient shadow-glow-supplement flex h-20 w-20 items-center justify-center rounded-full text-[color:var(--accent-contrast)]"
      icon={<CheckIcon className="h-10 w-10" />}
      pill={
        <span className="flex max-w-[78vw] items-center gap-1.5 rounded-full bg-[color:var(--accent-supplement-soft)] px-3.5 py-1.5 text-center text-[14px] font-extrabold text-[color:var(--accent-supplement)] shadow-glow-supplement">
          <SparkIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{message}</span>
        </span>
      }
      statusMessage={message}
    />
  );
}
