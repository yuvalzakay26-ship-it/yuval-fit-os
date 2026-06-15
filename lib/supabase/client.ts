"use client";

// Browser-only Supabase client for Yuval Fit OS beta access control.
//
// SCOPE: this client powers ONLY the beta access system (authentication +
// approved-email gate + admin panel). It does NOT touch any fitness data —
// workouts, nutrition, water, supplements and gym all remain localStorage-only
// (see lib/storage.ts). This phase is access control, not cloud sync.
//
// SECURITY: only the PUBLIC anon key is ever used here. It is safe to ship in
// the client bundle — real protection comes from Supabase Row Level Security
// (see supabase/beta-access.sql), not from hiding the key. The service-role key
// must NEVER appear in client code or in any NEXT_PUBLIC_* variable.
//
// CONFIGURATION: env vars are read at module load. When they are missing the
// client is simply absent (isSupabaseConfigured() === false) and the gate shows
// a clear "access system not configured" state instead of crashing or opening
// the app — see components/access/BetaAuthGate.tsx. The app must build and run
// even with no Supabase env vars present.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Public project URL. Safe to expose — paired with RLS, not a secret. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Public anon key. Safe to expose — paired with RLS, not a secret. */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Whether both public Supabase env vars are present. When false the beta gate
 * fails closed in production (no app access) and shows a setup screen in
 * development — it never crashes and never silently opens the app.
 */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

let cached: SupabaseClient | null = null;

/**
 * Lazily create (and memoize) the browser Supabase client. Returns null when
 * configuration is missing or when called on the server, so callers must always
 * null-check. The client persists its session in localStorage and detects the
 * OAuth/magic-link callback in the URL automatically (default behaviour).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;
  cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return cached;
}
