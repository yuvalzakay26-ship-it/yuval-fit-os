"use client";

// Lightweight event seam for the app-wide "supplement taken" celebration. Every
// surface that marks a supplement as taken (Today's compact card, the full
// Supplements screen, any quick-action) routes through one mutation —
// `toggleSupplementTaken` in lib/fitness-store.ts — so we detect the
// not-taken-today → taken-today transition there and broadcast a single custom
// event. The overlay listens once, high in the app shell, and plays the moment.
//
// This is purely a UX feedback seam. It does NOT touch the supplement schema, the
// supplement-log schema, the localStorage keys, or the backup/restore schema. It
// persists nothing of its own: the toggle's own state IS the anti-replay guard —
// the celebration only fires on a real false→true transition, so re-tapping an
// already-taken supplement does nothing, while un-marking and re-marking can
// celebrate again. It is intentionally distinct from the water-goal celebration
// (a daily-goal moment); this one confirms a single supplement was logged today.
//
// Product/safety note: the copy is a neutral "logged successfully" confirmation
// only. It never implies a recommendation, dosage, health benefit, or any medical
// claim — see docs/SUPPLEMENT_TAKEN_CELEBRATION.md.

/** Custom event dispatched on `window` when a supplement is marked taken today. */
export const SUPPLEMENT_TAKEN_EVENT = "yfos:supplement-taken";

export interface SupplementTakenDetail {
  /** The supplement's display name, woven into the success message. */
  supplementName: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Dispatch the celebration event (exported for tests / manual triggers). */
export function emitSupplementTaken(detail: SupplementTakenDetail): void {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent<SupplementTakenDetail>(SUPPLEMENT_TAKEN_EVENT, { detail }),
  );
}

/**
 * Fire the global celebration only when a supplement transitions from
 * *not-taken-today* to *taken-today*. Called from the toggle mutation, so it
 * never fires on render, hydration, loading existing logs, backup restore, or
 * settings changes — and never when un-marking. Re-marking after an un-mark is a
 * fresh false→true transition, so it may celebrate again. Returns true when it
 * emitted.
 */
export function maybeCelebrateSupplementTaken(args: {
  wasTaken: boolean;
  isTaken: boolean;
  supplementName: string;
}): boolean {
  const { wasTaken, isTaken, supplementName } = args;
  const name = supplementName.trim();
  if (wasTaken || !isTaken) return false; // only the not-taken → taken edge
  if (!name) return false;

  emitSupplementTaken({ supplementName: name });
  return true;
}
