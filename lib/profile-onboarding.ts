"use client";

// Profile-onboarding prompt dismissal state (Personal Profile Onboarding V2).
//
// This is NOT auth, a gate, or fitness data. It governs a one-time, OPTIONAL
// invitation shown after the access/welcome flow is complete, asking whether the
// user wants to fill the short personal training profile so the app can later
// tailor the experience. The invitation never blocks the app and is purely a
// nudge — the user can always reach /training-profile from More and Workouts.
//
// Only the dismissal choice is persisted here (the profile itself lives in
// lib/personal-profile.ts under its own key). State is funneled through this
// module — mirroring lib/welcome.ts — so the prompt component and any future
// "show the invitation again" action stay in sync via useSyncExternalStore.

import { useSyncExternalStore } from "react";

/** localStorage key holding the dismissal flag (value "1" once dismissed). */
export const PROFILE_ONBOARDING_DISMISSED_KEY =
  "yfos:profile-onboarding-dismissed:v1";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

/**
 * Whether the profile-onboarding prompt has already been dismissed. Fails
 * "dismissed" (true) when storage is unavailable or throws, so a storage hiccup
 * never re-nags the user — there is nothing to protect here and the profile
 * stays reachable from its entry points regardless.
 */
export function readProfileOnboardingDismissed(): boolean {
  if (!isBrowser()) return false;
  try {
    return (
      window.localStorage.getItem(PROFILE_ONBOARDING_DISMISSED_KEY) === "1"
    );
  } catch {
    return true;
  }
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Remember that the user answered the prompt (started OR chose "not now"). */
export function dismissProfileOnboarding(): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(PROFILE_ONBOARDING_DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable — the in-memory notify still hides it for this
      // session; it may reappear on next load, which is harmless.
    }
  }
  notify();
}

/** Clear the flag so the prompt can appear again (optional future action). */
export function resetProfileOnboarding(): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(PROFILE_ONBOARDING_DISMISSED_KEY);
    } catch {
      // Ignore — worst case the prompt simply doesn't reappear.
    }
  }
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === PROFILE_ONBOARDING_DISMISSED_KEY ||
      event.key === null
    ) {
      callback();
    }
  };
  if (isBrowser()) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    if (isBrowser()) window.removeEventListener("storage", onStorage);
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
