"use client";

// Beta welcome notice state for Yuval Fit OS.
//
// This is NOT auth or access control — there is no password and nothing to
// protect here. It governs a one-time friendly welcome shown AFTER the real beta
// access gate (components/access/BetaAuthGate.tsx) has let the user in. It thanks
// beta testers, sets expectations that the app is still evolving, and shows how
// to reach Yuval. The access boundary lives entirely in BetaAuthGate; this module
// never reads or writes any auth/approval/fitness data.
//
// State lives in localStorage (persisted across sessions, like the welcome gate)
// so an approved tester sees it once per browser/device and then never again.
// All state is funneled through here (mirroring lib/welcome.ts) so the notice
// component and the Settings "show beta notice again" action stay in sync via
// useSyncExternalStore.

import { useSyncExternalStore } from "react";

/** localStorage key holding the beta-welcome-seen flag (value "1" once seen). */
export const BETA_WELCOME_KEY = "yfos:beta-welcome-seen:v1";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

/**
 * Whether the beta welcome notice has already been seen. Fails open: if storage
 * is unavailable or throws (private mode, blocked cookies, quota errors), we
 * treat it as seen so a storage hiccup never traps an approved tester behind the
 * notice — there is nothing to protect here.
 */
export function readBetaWelcomeSeen(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(BETA_WELCOME_KEY) === "1";
  } catch {
    return true;
  }
}

// Keep the pre-paint `.beta-welcome-seen` class on <html> in sync with state at
// runtime so the flash-avoidance CSS rule (see globals.css) never hides the
// notice after a reset, and never reveals it after acknowledgement.
function setHtmlFlag(seen: boolean): void {
  if (!isBrowser()) return;
  document.documentElement.classList.toggle("beta-welcome-seen", seen);
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Acknowledge the notice ("הבנתי, המשך למערכת") and remember it was seen. */
export function markBetaWelcomeSeen(): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(BETA_WELCOME_KEY, "1");
    } catch {
      // Storage unavailable — the in-memory notify still dismisses it for this
      // session; the notice may reappear on next load, which is harmless.
    }
  }
  setHtmlFlag(true);
  notify();
}

/** Clear the flag so the notice shows again (optional Settings action). */
export function resetBetaWelcome(): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(BETA_WELCOME_KEY);
    } catch {
      // Ignore — worst case the notice simply doesn't reappear.
    }
  }
  setHtmlFlag(false);
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Reflect an acknowledge/reset performed in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key === BETA_WELCOME_KEY || event.key === null) {
      setHtmlFlag(readBetaWelcomeSeen());
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
 * Reactive beta-welcome state. SSR / first hydration snapshot is `false`,
 * matching the server HTML; the real client value swaps in right after mount.
 */
export function useBetaWelcomeSeen(): boolean {
  return useSyncExternalStore(subscribe, readBetaWelcomeSeen, () => false);
}

/**
 * Inline script string run in <head> before paint. When the notice was already
 * seen it adds `.beta-welcome-seen` to <html>, which CSS uses to hide the
 * server-rendered notice overlay before first paint — so approved testers never
 * see a flash of it on later loads. Mirrors WELCOME_INIT_SCRIPT.
 */
export const BETA_WELCOME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('${BETA_WELCOME_KEY}')==='1')document.documentElement.classList.add('beta-welcome-seen');}catch(e){}})();`;
