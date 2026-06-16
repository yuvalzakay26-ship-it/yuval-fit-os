"use client";

// Shared "is the user actually inside the app?" signal.
//
// Several post-gate, non-blocking surfaces (the friendly beta welcome notice and
// the optional profile-onboarding prompt) must appear ONLY once the user has
// truly passed the access boundary — never while auth/approval is still
// resolving and never for a denied/blocked user. The access boundary itself
// lives in components/access/BetaAuthGate.tsx; this hook MIRRORS its "allowed"
// logic as a read-only derivation so those surfaces share one source of truth
// instead of each re-implementing it. It reads no fitness data and changes no
// auth behaviour — it only answers "is the gate currently letting us in?".

import { useEffect, useState } from "react";
import {
  type AccessDecision,
  fetchAccessDecision,
  useBetaSession,
} from "./beta-access";
import { isSupabaseConfigured } from "./supabase/client";
import { useGuestSession } from "./guest-session";

/**
 * Whether the user has actually been let into the app shell — i.e. the beta auth
 * gate is currently rendering nothing on top of the app:
 *  - active guest with no real user → granted (guests are welcomed too);
 *  - signed-in + approved ("allowed") → granted;
 *  - everything else (loading, signed out, denied, blocked, unconfigured) → not.
 *
 * This re-reads the user's OWN approval row (RLS-restricted); it is a single
 * read-only SELECT and changes no auth behaviour. The decision is stored with the
 * email it was computed for, so a stale result after the email changes is treated
 * as "still resolving" by derivation, never by a synchronous reset.
 */
export function useAppAccessGranted(): boolean {
  const testingOpen = process.env.NEXT_PUBLIC_BETA_DISABLE_GATE === "1";
  const configured = isSupabaseConfigured();
  const { loading: sessionLoading, email } = useBetaSession();
  const guest = useGuestSession();
  const [resolved, setResolved] = useState<{
    email: string;
    decision: AccessDecision;
  } | null>(null);

  useEffect(() => {
    if (testingOpen || !configured || sessionLoading || !email) return;
    let active = true;
    void fetchAccessDecision(email).then((result) => {
      if (active) setResolved({ email, decision: result });
    });
    return () => {
      active = false;
    };
  }, [testingOpen, configured, sessionLoading, email]);

  // Testing seam (NEXT_PUBLIC_BETA_DISABLE_GATE=1): the gate is bypassed so the
  // app is fully open for automated QA. We treat access as granted only when a
  // guest session is explicitly seeded, so the many feature-test scripts reach
  // app screens unobstructed while a dedicated test can still exercise the
  // post-gate surfaces. (This branch is dead in production, where the flag is
  // never set.)
  if (testingOpen) return guest;
  if (!configured || sessionLoading) return false;
  if (!email) return guest; // guest session opens the app shell only
  const decision = resolved && resolved.email === email ? resolved.decision : null;
  return decision?.state === "allowed";
}
