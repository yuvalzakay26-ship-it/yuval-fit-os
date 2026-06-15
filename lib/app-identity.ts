"use client";

// A single helper that answers "who is using the app right now?" so the UI has
// one place to resolve greetings and identity badges. It unifies two sources:
//   * the real Supabase beta session (lib/beta-access.ts), and
//   * the local guest session (lib/guest-session.ts).
//
// A REAL authenticated user always wins over a guest flag — guest mode is only
// ever in effect when there is no Supabase session. This helper never grants any
// privilege (admin is resolved separately via useBetaAdmin); it is purely for
// display.

import { useBetaSession } from "./beta-access";
import { useGuestSession } from "./guest-session";

export type AppIdentity =
  | { kind: "guest"; displayName: "אורח" }
  | { kind: "authenticated"; email: string; displayName: string }
  // Still resolving the session, or signed out with no guest flag (a gate is
  // showing). Callers can treat this as "no greeting yet".
  | { kind: "none" };

/**
 * Reactive app identity. Resolves to:
 *   - `authenticated` when a Supabase session exists (real sign-in wins),
 *   - `guest` when a local guest session is active and there is no real session,
 *   - `none` while loading or when fully signed out.
 */
export function useAppIdentity(): AppIdentity {
  const { loading, email, displayName } = useBetaSession();
  const guest = useGuestSession();

  if (email) {
    return { kind: "authenticated", email, displayName: displayName ?? email };
  }
  // Don't claim "guest" until the real session has finished resolving, so we
  // never flash a guest greeting over an authenticated user mid-load.
  if (!loading && guest) return { kind: "guest", displayName: "אורח" };
  return { kind: "none" };
}

/**
 * The greeting line for the current identity:
 *   - guest          → "שלום אורח"
 *   - authenticated  → "שלום, {displayName}"
 *   - none           → null (caller decides the fallback).
 */
export function greetingFor(identity: AppIdentity): string | null {
  if (identity.kind === "guest") return "שלום אורח";
  if (identity.kind === "authenticated") return `שלום, ${identity.displayName}`;
  return null;
}
