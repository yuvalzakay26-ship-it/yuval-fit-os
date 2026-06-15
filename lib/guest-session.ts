"use client";

// Local "continue as guest" session for Yuval Fit OS.
//
// This is NOT authentication and NOT beta access. It is a purely local,
// device-only flag that lets someone use the app without a Supabase account.
// A guest:
//   * creates NO Supabase user, NO beta_allowed_users row, NO access request,
//   * gets NO admin rights (admin still requires a real Supabase admin session),
//   * keeps all fitness/nutrition/water/supplement/gym data in localStorage,
//     exactly like every other user of the app today.
//
// The beta auth gate (components/access/BetaAuthGate.tsx) treats an active guest
// session as "allowed for the normal app shell only". The admin panel
// (components/admin/BetaAdminView.tsx) is unaffected — it independently requires
// a real authenticated admin via Supabase RLS, so a guest can never reach it.
//
// State is funneled through here (mirroring lib/welcome.ts) so the gate, the
// greeting and the Settings account section stay in sync via useSyncExternalStore.

import { useSyncExternalStore } from "react";

/** localStorage key holding the guest-session flag (value "1" while active). */
export const GUEST_SESSION_KEY = "yuval-fit-os:guest-session:v1";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

/**
 * Whether a local guest session is active. Fails CLOSED: if storage is
 * unavailable or throws, we report "not a guest" so a storage hiccup can never
 * silently open the app — the user simply lands on the real sign-in screen.
 */
export function readGuestSession(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(GUEST_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Enter a local guest session (the "המשך כאורח" action). */
export function enterGuestSession(): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(GUEST_SESSION_KEY, "1");
    } catch {
      // Storage unavailable — the in-memory notify still lets this session in;
      // the guest flag may not survive a reload, which is harmless.
    }
  }
  notify();
}

/** Leave guest mode (exiting guest, or when a real Supabase user signs in). */
export function exitGuestSession(): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(GUEST_SESSION_KEY);
    } catch {
      // Ignore — worst case the flag lingers until storage works again.
    }
  }
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Reflect an enter/exit performed in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key === GUEST_SESSION_KEY || event.key === null) callback();
  };
  if (isBrowser()) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    if (isBrowser()) window.removeEventListener("storage", onStorage);
  };
}

/**
 * Reactive guest-session flag. SSR / first-hydration snapshot is `false`,
 * matching the server HTML; the real client value swaps in right after mount.
 */
export function useGuestSession(): boolean {
  return useSyncExternalStore(subscribe, readGuestSession, () => false);
}
