"use client";

// Lightweight, client-side-only access gate for Yuval Fit OS.
//
// This is a privacy / casual-access control — NOT real security. The code and
// the granted flag live in the browser; anyone with the bundle can read them.
// Its only job is to keep casual visitors who get a shared link out of the UI.
//
// All access state is funneled through here (mirroring storage.ts) so the gate
// component and the Settings "lock" action stay in sync via useSyncExternalStore.

import { useSyncExternalStore } from "react";

/** The code that unlocks the app. */
export const ACCESS_CODE = "yuvalzakay123";

/** localStorage key holding the granted flag (value "1" when granted). */
export const ACCESS_KEY = "yfos:access-granted:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Whether access has been granted. Fails closed: if storage is unavailable or
 * throws (private mode, blocked cookies, quota errors), we treat the user as
 * not granted and show the gate.
 */
export function readAccessGranted(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(ACCESS_KEY) === "1";
  } catch {
    return false;
  }
}

// Keep the pre-paint `.access-granted` class on <html> in sync with state at
// runtime so the flash-avoidance CSS rule (see globals.css) never hides the
// gate after a lock, and never reveals it after an unlock.
function setHtmlFlag(granted: boolean): void {
  if (!isBrowser()) return;
  document.documentElement.classList.toggle("access-granted", granted);
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Unlock the app and persist the grant. */
export function grantAccess(): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(ACCESS_KEY, "1");
    } catch {
      // Storage unavailable — the in-memory notify still lets this session in,
      // but the gate will reappear on next load (fail-closed).
    }
  }
  setHtmlFlag(true);
  notify();
}

/** Lock the app: clear the grant and return the user to the access screen. */
export function revokeAccess(): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(ACCESS_KEY);
    } catch {
      // Ignore — fail-closed means the gate shows regardless.
    }
  }
  setHtmlFlag(false);
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Reflect lock/unlock performed in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key === ACCESS_KEY || event.key === null) {
      setHtmlFlag(readAccessGranted());
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
 * Reactive access state. SSR / first hydration snapshot is `false` (fail-closed),
 * matching the server HTML; the real client value swaps in right after mount.
 */
export function useAccessGranted(): boolean {
  return useSyncExternalStore(subscribe, readAccessGranted, () => false);
}

/**
 * Inline script string run in <head> before paint. When access was already
 * granted it adds `.access-granted` to <html>, which CSS uses to hide the
 * server-rendered gate overlay before first paint — so returning users never
 * see a flash of the access screen. Mirrors THEME_INIT_SCRIPT.
 */
export const ACCESS_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('${ACCESS_KEY}')==='1')document.documentElement.classList.add('access-granted');}catch(e){}})();`;
