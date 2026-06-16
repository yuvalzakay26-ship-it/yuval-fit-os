"use client";

import { useEffect, useRef, useState } from "react";
import {
  SUPPLEMENT_TAKEN_EVENT,
  type SupplementTakenDetail,
} from "@/lib/supplement-events";
import { CapsuleIcon, CheckIcon, SparkIcon } from "@/components/ui/icons";

/**
 * App-wide, one-shot success moment that plays when a supplement is marked as
 * taken for today — no matter which surface logged it (the trigger is
 * centralized in `toggleSupplementTaken`, which dispatches
 * `yfos:supplement-taken` only on the not-taken → taken edge).
 *
 * Deliberately distinct from the blue water-goal celebration: a calm
 * mint/emerald + violet wash with a warm-gold sparkle accent and a check glow —
 * premium, not childish, and never clinical. It is **not** a modal: it is
 * `pointer-events-none` and `aria-hidden`, never traps focus, never needs
 * dismissing, and tears itself down after ~1.3s. A separate visually-hidden
 * `role="status"` announces the success to screen readers. All motion is CSS and
 * fully disabled under `prefers-reduced-motion` (then it shows a brief, static
 * glow instead — see globals.css).
 *
 * Copy is a neutral "logged successfully" confirmation only — no recommendation,
 * dosage, or health claim.
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
  const [active, setActive] = useState(false);
  const [name, setName] = useState("");
  // Re-keyed each time so the CSS animations restart on repeat celebrations.
  const [runId, setRunId] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onTaken = (event: Event) => {
      const detail = (event as CustomEvent<SupplementTakenDetail>).detail;
      setName(detail?.supplementName ?? "");
      setRunId((n) => n + 1);
      setActive(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), DURATION_MS);
    };
    window.addEventListener(SUPPLEMENT_TAKEN_EVENT, onTaken);
    return () => {
      window.removeEventListener(SUPPLEMENT_TAKEN_EVENT, onTaken);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;

  const message = name ? `${name} הוזן בהצלחה` : "התוסף הוזן בהצלחה";

  return (
    <>
      <div
        key={runId}
        aria-hidden="true"
        data-supplement-celebration="active"
        className="supplement-celebrate pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      >
        {/* Soft mint/violet glow wash + a gentle diagonal sweep. */}
        <div className="supplement-celebrate-glow absolute inset-0" />
        <div className="supplement-celebrate-sweep absolute inset-0" />

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

        {/* Center badge — premium, calm, not childish. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="supplement-celebrate-badge flex flex-col items-center gap-2.5">
            <span className="supplement-gradient shadow-glow-supplement flex h-20 w-20 items-center justify-center rounded-full text-[color:var(--accent-contrast)]">
              <CheckIcon className="h-10 w-10" />
            </span>
            <span className="flex max-w-[78vw] items-center gap-1.5 rounded-full bg-[color:var(--accent-supplement-soft)] px-3.5 py-1.5 text-center text-[14px] font-extrabold text-[color:var(--accent-supplement)] shadow-glow-supplement">
              <SparkIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{message}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Screen-reader announcement (not inside the aria-hidden visual layer). */}
      <p key={`sr${runId}`} role="status" className="sr-only">
        {message}
      </p>
    </>
  );
}
