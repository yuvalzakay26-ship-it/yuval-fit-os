"use client";

// Lightweight, client-side-only welcome gate for Yuval Fit OS.
//
// This is NOT auth or access control — there is no password. It simply shows a
// premium intro screen on the first visit and then gets out of the way. The
// "seen" flag lives in the browser so returning users go straight into the app.
//
// All welcome state is funneled through here (mirroring storage.ts) so the gate
// component and the Settings "show welcome again" action stay in sync via
// useSyncExternalStore.

import { useSyncExternalStore } from "react";

/** localStorage key holding the welcome-seen flag (value "1" once seen). */
export const WELCOME_KEY = "yfos:welcome-seen:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Whether the welcome screen has already been seen. Fails open: if storage is
 * unavailable or throws (private mode, blocked cookies, quota errors), we treat
 * the user as having seen it so a storage hiccup never traps them behind the
 * intro — there is nothing to protect here.
 */
export function readWelcomeSeen(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    return true;
  }
}

// Keep the pre-paint `.welcome-seen` class on <html> in sync with state at
// runtime so the flash-avoidance CSS rule (see globals.css) never hides the
// welcome screen after a reset, and never reveals it after entry.
function setHtmlFlag(seen: boolean): void {
  if (!isBrowser()) return;
  document.documentElement.classList.toggle("welcome-seen", seen);
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Enter the app and remember that the welcome screen has been seen. */
export function markWelcomeSeen(): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      // Storage unavailable — the in-memory notify still lets this session in;
      // the welcome screen may reappear on next load, which is harmless.
    }
  }
  setHtmlFlag(true);
  notify();
}

/** Clear the flag so the welcome screen shows again (Settings action). */
export function resetWelcome(): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(WELCOME_KEY);
    } catch {
      // Ignore — worst case the screen simply doesn't reappear.
    }
  }
  setHtmlFlag(false);
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Reflect a reset/entry performed in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key === WELCOME_KEY || event.key === null) {
      setHtmlFlag(readWelcomeSeen());
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Reactive welcome state. SSR / first hydration snapshot is `false`, matching
 * the server HTML; the real client value swaps in right after mount.
 */
export function useWelcomeSeen(): boolean {
  return useSyncExternalStore(subscribe, readWelcomeSeen, () => false);
}

/**
 * Inline script string run in <head> before paint. When the welcome screen was
 * already seen it adds `.welcome-seen` to <html>, which CSS uses to hide the
 * server-rendered welcome overlay before first paint — so returning users never
 * see a flash of the intro. Mirrors THEME_INIT_SCRIPT.
 */
export const WELCOME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('${WELCOME_KEY}')==='1')document.documentElement.classList.add('welcome-seen');}catch(e){}})();`;
