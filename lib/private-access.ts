"use client";

// Client-side-only private-access notice gate for Yuval Fit OS.
//
// This is NOT authentication, a password, or access control. There is no
// password input, no backend check, and no device/usage tracking. It is a
// premium informational notice that communicates the app is private and meant
// only for people who received a direct link, shown once per browser session.
//
// State lives in sessionStorage (not localStorage) on purpose: the notice
// re-appears on a fresh browser/app session, but stays out of the way for the
// rest of the current session (including page navigations and refreshes).
//
// Mirrors lib/welcome.ts so the gate component and the Settings "show notice
// again" action stay in sync via useSyncExternalStore.

import { useSyncExternalStore } from "react";

/** sessionStorage key holding the accepted flag (value "1" once accepted). */
export const PRIVATE_ACCESS_KEY = "yfos:private-access-notice-accepted:session";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

/**
 * Whether the private-access notice has already been accepted this session.
 * Fails open: if storage is unavailable or throws (private mode, blocked
 * cookies, quota errors) we treat the notice as accepted so a storage hiccup
 * never traps the user behind it — there is nothing to protect here.
 */
export function readPrivateAccessAccepted(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.sessionStorage.getItem(PRIVATE_ACCESS_KEY) === "1";
  } catch {
    return true;
  }
}

// Keep the pre-paint `.private-access-accepted` class on <html> in sync with
// state at runtime so the flash-avoidance CSS rule (see globals.css) never
// hides the notice after a reset, and never reveals it after acceptance.
function setHtmlFlag(accepted: boolean): void {
  if (!isBrowser()) return;
  document.documentElement.classList.toggle("private-access-accepted", accepted);
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Enter the app and remember the notice was accepted for this session. */
export function acceptPrivateAccess(): void {
  if (isBrowser()) {
    try {
      window.sessionStorage.setItem(PRIVATE_ACCESS_KEY, "1");
    } catch {
      // Storage unavailable — the in-memory notify still lets this session in;
      // the notice may reappear on next load, which is harmless.
    }
  }
  setHtmlFlag(true);
  notify();
}

/** Clear the flag so the notice shows again (Settings action). */
export function resetPrivateAccess(): void {
  if (isBrowser()) {
    try {
      window.sessionStorage.removeItem(PRIVATE_ACCESS_KEY);
    } catch {
      // Ignore — worst case the notice simply doesn't reappear.
    }
  }
  setHtmlFlag(false);
  notify();
}

// sessionStorage is per-tab and not shared across tabs, so there is no
// cross-tab "storage" event to mirror (unlike the welcome gate's localStorage).
// The in-memory listener set is sufficient.
function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Reactive accepted state. SSR / first hydration snapshot is `false`, matching
 * the server HTML (notice present); the real client value swaps in right after
 * mount.
 */
export function usePrivateAccessAccepted(): boolean {
  return useSyncExternalStore(
    subscribe,
    readPrivateAccessAccepted,
    () => false,
  );
}

/**
 * Inline script string run in <head> before paint. When the notice was already
 * accepted this session it adds `.private-access-accepted` to <html>, which CSS
 * uses to hide the server-rendered notice overlay before first paint — so users
 * never see a flash of the notice on same-session navigations/refreshes.
 * Mirrors WELCOME_INIT_SCRIPT.
 */
export const PRIVATE_ACCESS_INIT_SCRIPT = `(function(){try{if(sessionStorage.getItem('${PRIVATE_ACCESS_KEY}')==='1')document.documentElement.classList.add('private-access-accepted');}catch(e){}})();`;
