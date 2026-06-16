"use client";

// Profile-onboarding prompt dismissal state (Personal Profile Onboarding V2).
//
// This is NOT auth, a gate, or fitness data. It governs an OPTIONAL invitation
// shown after the access/welcome flow is complete, asking whether the user wants
// to fill the short personal training profile so the app can later tailor the
// experience. The invitation never blocks the app and is purely a nudge — the
// user can always reach /training-profile from More and Workouts.
//
// Product rule (updated): the prompt is now the SECOND step of every app entry
// (right after the beta welcome), as long as no profile exists yet. Dismissal is
// therefore SESSION-level, not permanent: choosing "לא עכשיו" (or "בוא נתחיל")
// hides it for the current session only, and it may appear again on a future app
// entry while the user still has no profile. Once a profile exists it never shows.
// State lives in sessionStorage and is funneled through this module — mirroring
// lib/beta-welcome.ts — so the prompt component and any future "show the
// invitation again" action stay in sync via useSyncExternalStore.

import { useSyncExternalStore } from "react";

/**
 * Legacy localStorage key from the old "dismissed once, forever" behaviour. Left
 * untouched (we don't churn existing data) but NO LONGER read as a permanent
 * suppressor — the active gate is the session key below, so a user who dismissed
 * the prompt on an earlier visit still sees it again on their next app entry while
 * they have no profile.
 */
export const PROFILE_ONBOARDING_DISMISSED_KEY =
  "yfos:profile-onboarding-dismissed:v1";

/** sessionStorage key holding the per-session dismissal flag (value "1"). */
export const PROFILE_ONBOARDING_DISMISSED_SESSION_KEY =
  "yfos:profile-onboarding-dismissed-session:v1";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
  );
}

/**
 * Whether the profile-onboarding prompt has already been dismissed IN THIS
 * SESSION. Fails "dismissed" (true) when storage is unavailable or throws, so a
 * storage hiccup never re-nags the user mid-session — there is nothing to protect
 * here and the profile stays reachable from its entry points regardless.
 */
export function readProfileOnboardingDismissed(): boolean {
  if (!isBrowser()) return false;
  try {
    return (
      window.sessionStorage.getItem(PROFILE_ONBOARDING_DISMISSED_SESSION_KEY) ===
      "1"
    );
  } catch {
    return true;
  }
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Remember that the user answered the prompt (started OR chose "not now") for the
 * rest of this session. It may appear again on a future app entry while no profile
 * exists.
 */
export function dismissProfileOnboarding(): void {
  if (isBrowser()) {
    try {
      window.sessionStorage.setItem(
        PROFILE_ONBOARDING_DISMISSED_SESSION_KEY,
        "1",
      );
    } catch {
      // Storage unavailable — the in-memory notify still hides it for this
      // render; it may reappear on next navigation, which is harmless.
    }
  }
  notify();
}

/** Clear the session flag so the prompt can appear again (optional future action). */
export function resetProfileOnboarding(): void {
  if (isBrowser()) {
    try {
      window.sessionStorage.removeItem(PROFILE_ONBOARDING_DISMISSED_SESSION_KEY);
    } catch {
      // Ignore — worst case the prompt simply doesn't reappear.
    }
  }
  notify();
}

function subscribe(callback: () => void): () => void {
  // Session state is per-tab; there is no cross-tab `storage` event to mirror.
  // Same-tab updates flow through the in-memory listener set via notify().
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Reactive dismissal flag. SSR / first-hydration snapshot is `false`, matching
 * the server HTML; the real client value swaps in right after mount.
 */
export function useProfileOnboardingDismissed(): boolean {
  return useSyncExternalStore(
    subscribe,
    readProfileOnboardingDismissed,
    () => false,
  );
}
