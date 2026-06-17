"use client";

import { useEffect } from "react";

/**
 * Centralized, counter-based background scroll lock.
 *
 * The app shows several full-screen overlays — the beta auth gate, the beta
 * welcome notice, the welcome screen, the profile onboarding prompt, the
 * exercise image viewer, the exercise picker — and any of them may be mounted
 * at overlapping times (e.g. the beta welcome notice handing off to the profile
 * onboarding prompt in a single commit, or an image viewer opened on top of a
 * page). Previously each overlay captured and restored
 * `document.body.style.overflow` on its own. When two overlapped, the second
 * one captured the first one's `"hidden"` as its baseline and restored *that*
 * on unmount — leaving the body permanently `overflow: hidden`. The whole app
 * could then no longer scroll, even though tapping and routing still worked.
 *
 * A single shared counter fixes this for good: the body is locked while *any*
 * overlay holds a lock, and restored to its true original value only when the
 * last one releases. No overlay can ever capture another overlay's `"hidden"`
 * as its baseline, so the lock cannot leak across mounts, route changes, or
 * navigation that unmounts an overlay mid-interaction (e.g. clicking
 * "בוא נתחיל" which dismisses the prompt and immediately routes away).
 */

let lockCount = 0;
let savedOverflow: string | null = null;

function applyLock(): void {
  if (typeof document === "undefined") return;
  // Only the first lock captures the real baseline and flips the body; later
  // locks just bump the counter so the lock survives until every overlay is
  // gone.
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function releaseLock(): void {
  if (typeof document === "undefined") return;
  // Guard against an unbalanced release (e.g. a stray double cleanup) so the
  // counter can never go negative and wedge the next lock.
  if (lockCount === 0) return;
  lockCount -= 1;
  // Only the last release restores the original value the first lock captured,
  // never another overlay's "hidden".
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow ?? "";
    savedOverflow = null;
  }
}

/**
 * Lock background scroll while the calling component is mounted (and `active`).
 *
 * Pass `active` for overlays that render their lock-holder unconditionally but
 * are only visually open some of the time (e.g. `<ExerciseImageViewer open>`);
 * leave it as the default `true` for overlays that mount only while shown.
 */
export function useBodyScrollLock(active: boolean = true): void {
  useEffect(() => {
    if (!active) return;
    applyLock();
    return releaseLock;
  }, [active]);
}
