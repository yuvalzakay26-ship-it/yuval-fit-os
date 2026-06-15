"use client";

// Beta access control for Yuval Fit OS — authentication + approved-email gate +
// admin management. This is the REAL access boundary (unlike the legacy
// client-side admin code gate): a user must hold a valid Supabase session AND
// have an active row in `beta_allowed_users` to enter the app.
//
// This module ONLY governs who may use the beta. It never reads or writes any
// fitness data — workouts, nutrition, water, supplements and gym stay
// localStorage-only on the device (see lib/storage.ts). After login the
// personal data is still on this device unless a future phase adds cloud sync.
//
// Trust model:
//  - The email is taken from the authenticated Supabase session, never from
//    user input, so it cannot be spoofed by the client.
//  - Approval/blocked status and admin rights are enforced by Row Level
//    Security in the database (see supabase/beta-access.sql). The client checks
//    are for UX only; the database is the source of truth.

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";

/* ----------------------------- Email helpers ---------------------------- */

/** Normalize an email for comparison/storage: trimmed + lowercased. */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/* --------------------------- Allowed-user model ------------------------- */

export type AllowedUserStatus = "active" | "blocked";

export interface AllowedUser {
  id: string;
  email: string;
  status: AllowedUserStatus;
  display_name: string | null;
  notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
}

/* ------------------------------ Session store --------------------------- */
// A single shared subscription to Supabase auth so every consumer (the gate,
// Settings, the admin link) reflects the same session without each mounting its
// own listener. The email is the authenticated user's email (or null).

interface SessionSnapshot {
  /** True until the first session read resolves. */
  loading: boolean;
  /** Authenticated email (already lowercased by the provider) or null. */
  email: string | null;
}

// Stable references so useSyncExternalStore never loops.
const SERVER_SNAPSHOT: SessionSnapshot = { loading: true, email: null };
const UNCONFIGURED_SNAPSHOT: SessionSnapshot = { loading: false, email: null };

let snapshot: SessionSnapshot = SERVER_SNAPSHOT;
let initialized = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next: SessionSnapshot): void {
  snapshot = next;
  emit();
}

function ensureInit(): void {
  if (initialized) return;
  initialized = true;

  const supabase = getSupabaseClient();
  if (!supabase) {
    // Not configured (or SSR) — resolve immediately to "signed out, not loading"
    // so the gate can render its setup/fail-closed state instead of spinning.
    snapshot = UNCONFIGURED_SNAPSHOT;
    return;
  }

  supabase.auth
    .getSession()
    .then(({ data }) => {
      setSnapshot({
        loading: false,
        email: normalizeEmail(data.session?.user?.email) || null,
      });
    })
    .catch(() => setSnapshot(UNCONFIGURED_SNAPSHOT));

  // Reflect later sign-in / sign-out / token-refresh / OAuth-callback events.
  supabase.auth.onAuthStateChange((_event, session) => {
    setSnapshot({
      loading: false,
      email: normalizeEmail(session?.user?.email) || null,
    });
  });
}

function subscribe(callback: () => void): () => void {
  ensureInit();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): SessionSnapshot {
  return snapshot;
}

function getServerSnapshot(): SessionSnapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Reactive auth session: `{ loading, email }`. SSR/first-hydration snapshot is
 * `{ loading: true, email: null }`, matching the server HTML where the gate
 * shows a calm loading state.
 */
export function useBetaSession(): SessionSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ------------------------------ Auth actions ---------------------------- */

/** Begin Google OAuth. Redirects away and back to the app origin on success. */
export async function signInWithGoogle(): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "not-configured" };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  return error ? { error: error.message } : {};
}

/** Send a magic-link / OTP sign-in email to the given address. */
export async function signInWithEmailLink(
  email: string,
): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "not-configured" };
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: { emailRedirectTo: window.location.origin },
  });
  return error ? { error: error.message } : {};
}

/** Sign the current user out. Does NOT touch any local fitness data. */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Best-effort — the auth listener will still drop the local session.
  }
}

/* --------------------------- Access decisions --------------------------- */

export type AccessState = "allowed" | "denied" | "blocked" | "error";

export interface AccessDecision {
  state: AccessState;
  message?: string;
}

/**
 * Pure mapping from an approved-users row to an access decision. Separated out so
 * it can be unit-tested without a network/Supabase: no row → denied; status
 * "blocked" → blocked; status "active" → allowed; anything else → denied.
 */
export function decideAccess(
  row: { status?: string | null } | null | undefined,
): AccessDecision {
  if (!row) return { state: "denied" };
  if (row.status === "blocked") return { state: "blocked" };
  if (row.status === "active") return { state: "allowed" };
  return { state: "denied" };
}

/**
 * Resolve whether the authenticated email may enter the beta. Reads the user's
 * OWN row in `beta_allowed_users` (RLS restricts the result to that row), then
 * maps it via decideAccess.
 */
export async function fetchAccessDecision(
  email: string,
): Promise<AccessDecision> {
  const supabase = getSupabaseClient();
  if (!supabase) return { state: "error", message: "not-configured" };
  const { data, error } = await supabase
    .from("beta_allowed_users")
    .select("status")
    .eq("email", normalizeEmail(email))
    .maybeSingle();
  if (error) return { state: "error", message: error.message };
  return decideAccess(data);
}

/** Whether the authenticated email is listed in `beta_admins`. */
export async function fetchIsAdmin(email: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("beta_admins")
    .select("email")
    .eq("email", normalizeEmail(email))
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/** Best-effort "I'm here" stamp. Calls a SECURITY DEFINER RPC; never throws. */
export async function touchLastSeen(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.rpc("touch_beta_last_seen");
  } catch {
    // Tracking is optional — ignore failures silently.
  }
}

/* ------------------------- Admin management (RLS) ----------------------- */
// All of these are additionally guarded by RLS: only an authenticated user
// whose email is in `beta_admins` can read the full list or mutate rows. A
// non-admin calling these gets an empty result or a permission error.

export async function listAllowedUsers(): Promise<AllowedUser[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("beta_allowed_users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as AllowedUser[]) ?? [];
}

export async function addAllowedUser(input: {
  email: string;
  displayName?: string;
  notes?: string;
  addedBy?: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("not-configured");
  const { error } = await supabase.from("beta_allowed_users").insert({
    email: normalizeEmail(input.email),
    display_name: input.displayName?.trim() || null,
    notes: input.notes?.trim() || null,
    added_by: input.addedBy ? normalizeEmail(input.addedBy) : null,
    status: "active",
  });
  if (error) throw new Error(error.message);
}

export async function setAllowedUserStatus(
  id: string,
  status: AllowedUserStatus,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("not-configured");
  const { error } = await supabase
    .from("beta_allowed_users")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAllowedUser(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("not-configured");
  const { error } = await supabase
    .from("beta_allowed_users")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------ Admin hook ------------------------------ */

export interface BetaAdminState {
  /** True while the session or the admin check is still resolving. */
  loading: boolean;
  /** Whether the current user is a beta admin (false when signed out). */
  isAdmin: boolean;
  /** The authenticated email, or null. */
  email: string | null;
  /** Whether Supabase is configured at all. */
  configured: boolean;
}

/**
 * Reactive admin state for UI that should appear only to admins (the Settings
 * link and the System Hub card). Never reveals the admin entry point unless the
 * database confirms admin rights — and the panel itself is still RLS-guarded.
 */
export function useBetaAdmin(): BetaAdminState {
  const configured = isSupabaseConfigured();
  const { loading: sessionLoading, email } = useBetaSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    let active = true;
    // All state updates happen inside the async resolution below (never
    // synchronously in the effect body) so a re-render is never triggered
    // mid-effect. `checking` defaults to true and is cleared once resolved.
    const resolve = !configured || !email
      ? Promise.resolve(false)
      : fetchIsAdmin(email).catch(() => false);
    void resolve.then((value) => {
      if (!active) return;
      setIsAdmin(value);
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [configured, email, sessionLoading]);

  return {
    loading: sessionLoading || (configured && Boolean(email) && checking),
    isAdmin,
    email,
    configured,
  };
}
