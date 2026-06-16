"use client";

// Beta welcome notice state for Yuval Fit OS.
//
// This is NOT auth or access control — there is no password and nothing to
// protect here. It governs the friendly welcome shown AFTER the real beta access
// gate (components/access/BetaAuthGate.tsx) has let the user in. It thanks beta
// testers, sets expectations that the app is still evolving, and shows how to
// reach Yuval. The access boundary lives entirely in BetaAuthGate; this module
// never reads or writes any auth/approval/fitness data.
//
// Product rule (updated): the beta welcome is part of EVERY app entry, not a
// one-time-per-device greeting. It is now gated PER SESSION instead of with a
// permanent localStorage flag, so an admin, approved tester, or guest sees it the
// first time they enter the app in a given browser session and not again while
// navigating between routes within that same session. Re-entering the app (a new
// tab, a fresh PWA launch, a new browser session) shows it again. State therefore
// lives in sessionStorage. All state is funneled through here (mirroring
// lib/welcome.ts) so the notice component and the Settings "show beta notice
// again" action stay in sync via useSyncExternalStore.

import { useSyncExternalStore } from "react";

/**
 * Legacy localStorage key from the old "seen once per device, forever" behaviour.
 * It is intentionally left untouched (we don't churn existing data) but is NO
 * LONGER read as a permanent suppressor — the active gate is the session key
 * below, so testers who acknowledged the notice on an earlier device-level visit
 * still see it again on their next app entry.
 */
export const BETA_WELCOME_KEY = "yfos:beta-welcome-seen:v1";

/** sessionStorage key holding the per-session seen flag (value "1" once seen). */
export const BETA_WELCOME_SESSION_KEY = "yfos:beta-welcome-seen-session:v1";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
  );
}

/**
 * Whether the beta welcome notice has already been seen IN THIS SESSION. Fails
 * open: if storage is unavailable or throws (private mode, blocked cookies, quota
 * errors), we treat it as seen so a storage hiccup never traps an approved tester
 * behind the notice — there is nothing to protect here.
 */
export function readBetaWelcomeSeen(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.sessionStorage.getItem(BETA_WELCOME_SESSION_KEY) === "1";
  } catch {
    return true;
  }
}

// Keep the pre-paint `.beta-welcome-seen` class on <html> in sync with state at
// runtime so the flash-avoidance CSS rule (see globals.css) never hides the
// notice after a reset, and never reveals it after acknowledgement.
function setHtmlFlag(seen: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("beta-welcome-seen", seen);
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Acknowledge the notice ("הבנתי, המשך למערכת") and remember it was seen for the
 * rest of this session (it will greet again on the next app entry).
 */
export function markBetaWelcomeSeen(): void {
  if (isBrowser()) {
    try {
      window.sessionStorage.setItem(BETA_WELCOME_SESSION_KEY, "1");
    } catch {
      // Storage unavailable — the in-memory notify still dismisses it for this
      // render; the notice may reappear on next navigation, which is harmless.
    }
  }
  setHtmlFlag(true);
  notify();
}

/**
 * Clear the session flag so the notice shows again right now (the Settings
 * "הצג הודעת בטא שוב" action). Since the gate is already per-session, this simply
 * brings the greeting back immediately in the current session.
 */
export function resetBetaWelcome(): void {
  if (isBrowser()) {
    try {
      window.sessionStorage.removeItem(BETA_WELCOME_SESSION_KEY);
    } catch {
      // Ignore — worst case the notice simply doesn't reappear.
    }
  }
  setHtmlFlag(false);
  notify();
}

function subscribe(callback: () => void): () => void {
  // Session state is per-tab, so there is no cross-tab `storage` event to mirror
  // (sessionStorage changes never fire one). Same-tab updates flow through the
  // in-memory listener set via notify().
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Reactive beta-welcome state. SSR / first hydration snapshot is `false`,
 * matching the server HTML; the real client value swaps in right after mount.
 */
export function useBetaWelcomeSeen(): boolean {
  return useSyncExternalStore(subscribe, readBetaWelcomeSeen, () => false);
}

/**
 * Inline script string run in <head> before paint. When the notice was already
 * seen THIS SESSION it adds `.beta-welcome-seen` to <html>, which CSS uses to hide
 * the notice overlay before first paint — so a within-session reload doesn't flash
 * the greeting again. On a fresh session the key is absent, the class is not
 * added, and the notice shows as intended. Mirrors WELCOME_INIT_SCRIPT.
 */
export const BETA_WELCOME_INIT_SCRIPT = `(function(){try{if(sessionStorage.getItem('${BETA_WELCOME_SESSION_KEY}')==='1')document.documentElement.classList.add('beta-welcome-seen');}catch(e){}})();`;
