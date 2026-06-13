"use client";

// Client-side-only admin access-code gate for Yuval Fit OS.
//
// This is a lightweight, CLIENT-SIDE access code gate — NOT real authentication
// or backend access control. The code is checked in the browser only; there is
// no server, no database, no session token, and no device detection or usage
// tracking. Anyone reading the bundle can see the code. Its purpose is a
// deliberate, premium "authorized use only" barrier in front of a private
// personal app, not a security boundary.
//
// State lives in localStorage (persistent) on purpose: once the correct code is
// entered, the same browser/device is remembered and is not asked again until
// the user explicitly locks the system (Settings → "נעל מערכת"). This mirrors
// lib/welcome.ts / lib/private-access.ts so the gate component and the Settings
// lock action stay in sync via useSyncExternalStore.

import { useSyncExternalStore } from "react";

/** localStorage key holding the granted flag (value "1" once unlocked). */
export const ADMIN_ACCESS_KEY = "yfos:admin-access-granted:v1";

/**
 * The access code that unlocks the app. This lives in the client bundle on
 * purpose — see the file header. It is NOT a secret in any cryptographic sense.
 */
export const ADMIN_ACCESS_CODE = "yuvalzakay123";

/** Whether a typed code matches the access code (trimmed, case-sensitive). */
export function isAdminCodeValid(code: string): boolean {
  return code.trim() === ADMIN_ACCESS_CODE;
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

/**
 * Whether admin access has already been granted on this browser/device.
 *
 * Fails CLOSED: if storage is unavailable or throws we treat access as NOT
 * granted and show the gate. Unlike the welcome / private-access notices (which
 * fail open because there is nothing to protect), this screen is an intentional
 * barrier, so a storage hiccup should keep the gate up rather than wave the user
 * through. Re-entering the code still works in-memory for the session.
 */
export function readAdminAccessGranted(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(ADMIN_ACCESS_KEY) === "1";
  } catch {
    return false;
  }
}

// Keep the pre-paint `.admin-access-granted` class on <html> in sync with state
// at runtime so the flash-avoidance CSS rule (see globals.css) never hides the
// gate after a lock, and never reveals it after a grant.
function setHtmlFlag(granted: boolean): void {
  if (!isBrowser()) return;
  document.documentElement.classList.toggle("admin-access-granted", granted);
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Persist the granted state and enter the app. Call only after verifying the code. */
export function grantAdminAccess(): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(ADMIN_ACCESS_KEY, "1");
    } catch {
      // Storage unavailable — the in-memory notify still lets this session in;
      // the gate may reappear on next load, which is acceptable for a gate.
    }
  }
  setHtmlFlag(true);
  notify();
}

/** Clear the flag so the gate shows again (Settings "נעל מערכת" / lock action). */
export function resetAdminAccess(): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(ADMIN_ACCESS_KEY);
    } catch {
      // Ignore — worst case the gate simply doesn't reappear.
    }
  }
  setHtmlFlag(false);
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Reflect a grant/lock performed in another tab (localStorage is shared).
  const onStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_ACCESS_KEY || event.key === null) {
      setHtmlFlag(readAdminAccessGranted());
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
 * Reactive granted state. SSR / first hydration snapshot is `false`, matching
 * the server HTML (gate present); the real client value swaps in right after
 * mount.
 */
export function useAdminAccessGranted(): boolean {
  return useSyncExternalStore(subscribe, readAdminAccessGranted, () => false);
}

/**
 * Inline script string run in <head> before paint. When access was already
 * granted on this device it adds `.admin-access-granted` to <html>, which CSS
 * uses to hide the server-rendered gate overlay before first paint — so returning
 * users never see a flash of the gate. Mirrors PRIVATE_ACCESS_INIT_SCRIPT.
 */
export const ADMIN_ACCESS_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('${ADMIN_ACCESS_KEY}')==='1')document.documentElement.classList.add('admin-access-granted');}catch(e){}})();`;
