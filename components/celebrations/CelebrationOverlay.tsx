"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shared primitive behind the three app-wide celebration overlays
 * (water goal, protein goal, supplement taken). Extracted in System
 * Optimization Phase 2A — it consolidates the ~85%-identical skeleton the three
 * overlays previously copy-pasted, with **no change** to behaviour, copy,
 * timing, triggers, storage keys, or event names.
 *
 * The shared pieces it owns:
 *
 * - {@link useCelebrationTrigger}: the one-shot state machine — a window event
 *   listener that, on fire, bumps a `runId` (so CSS animations restart), shows
 *   the overlay, and tears it down after a per-overlay `durationMs`. Cleans up
 *   the listener and the pending timeout on unmount.
 * - {@link CelebrationOverlay}: the non-modal visual shell — a
 *   `pointer-events-none`, `aria-hidden`, high-z-index fixed layer that never
 *   traps focus and never needs dismissing, plus a separate visually-hidden
 *   `role="status"` announcement for screen readers. All motion is CSS and is
 *   disabled under `prefers-reduced-motion` (see globals.css).
 *
 * Everything that actually differs between the three celebrations — the event
 * name, duration, decorative particles, center icon, badge pill, colour
 * `variant`, data attribute, and SR copy — stays in the thin wrapper components
 * and is passed in as props. The CSS class convention is fixed:
 * `{variant}` on the root, with `{variant}-glow`, `{variant}-sweep`, and
 * `{variant}-badge` derived from it (e.g. `water-celebrate` →
 * `water-celebrate-glow`).
 */

/**
 * The one-shot celebration state machine. Subscribes to `eventName` on `window`
 * and, on each fire, restarts the animation (`runId`) and shows the overlay for
 * `durationMs` before hiding it again.
 *
 * `eventName` and `durationMs` are module constants in every caller, so the
 * effect subscribes exactly once for the component's lifetime (matching the
 * original `[]`-dependency behaviour). `onTrigger` — used by the supplement
 * overlay to read the event detail — is read through a ref so passing a fresh
 * closure each render never re-subscribes or clears the active timer.
 */
export function useCelebrationTrigger(
  eventName: string,
  durationMs: number,
  onTrigger?: (event: Event) => void,
): { visible: boolean; runId: number } {
  const [active, setActive] = useState(false);
  // Re-keyed each time so the CSS animations restart on repeat celebrations.
  const [runId, setRunId] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTriggerRef = useRef(onTrigger);
  // Keep the latest callback without re-subscribing the listener below. The
  // celebration event only fires on user interaction, long after this commits.
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    const handler = (event: Event) => {
      onTriggerRef.current?.(event);
      setRunId((n) => n + 1);
      setActive(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), durationMs);
    };
    window.addEventListener(eventName, handler);
    return () => {
      window.removeEventListener(eventName, handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [eventName, durationMs]);

  return { visible: active, runId };
}

type CelebrationOverlayProps = {
  /** Bumped on each trigger; keys the overlay so CSS animations restart. */
  runKey: number;
  /** Base CSS class on the root (e.g. `"water-celebrate"`); the glow, sweep, and
   *  badge classes are derived from it. */
  variant: string;
  /** Marker attribute the e2e specs key on (e.g. `"data-water-celebration"`),
   *  rendered with the value `"active"`. */
  dataAttribute: string;
  /** Decorative particle layer (bubbles, capsules, rings, sparks, …). */
  decorations: ReactNode;
  /** Center icon element (already sized). */
  icon: ReactNode;
  /** Class string for the round gradient/glow chip wrapping {@link icon}. */
  iconClassName: string;
  /** The full badge pill element (kept per-overlay to preserve exact markup). */
  pill: ReactNode;
  /** Visually-hidden `role="status"` copy announced to screen readers. */
  statusMessage: ReactNode;
};

/**
 * Non-modal celebration shell. Renders the fixed `pointer-events-none` visual
 * layer (glow + sweep + decorations + center badge) plus a separate
 * visually-hidden live-region announcement. Stateless: callers gate it with
 * {@link useCelebrationTrigger} and render nothing when not visible.
 */
export function CelebrationOverlay({
  runKey,
  variant,
  dataAttribute,
  decorations,
  icon,
  iconClassName,
  pill,
  statusMessage,
}: CelebrationOverlayProps) {
  return (
    <>
      <div
        key={runKey}
        aria-hidden="true"
        {...{ [dataAttribute]: "active" }}
        className={`${variant} pointer-events-none fixed inset-0 z-[120] overflow-hidden`}
      >
        {/* Glow wash + a diagonal sweep. */}
        <div className={`${variant}-glow absolute inset-0`} />
        <div className={`${variant}-sweep absolute inset-0`} />

        {/* Per-overlay decorative particles. */}
        {decorations}

        {/* Center badge — premium, calm, not childish. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${variant}-badge flex flex-col items-center gap-2.5`}>
            <span className={iconClassName}>{icon}</span>
            {pill}
          </div>
        </div>
      </div>

      {/* Screen-reader announcement (not inside the aria-hidden visual layer). */}
      <p key={`sr${runKey}`} role="status" className="sr-only">
        {statusMessage}
      </p>
    </>
  );
}
