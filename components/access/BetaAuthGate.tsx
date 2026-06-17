"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isPublicInfoPath } from "@/lib/public-paths";
import {
  type AccessDecision,
  fetchAccessDecision,
  signInWithEmailLink,
  signInWithGoogle,
  touchLastSeen,
  useBetaSession,
} from "@/lib/beta-access";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import {
  enterGuestSession,
  exitGuestSession,
  useGuestSession,
} from "@/lib/guest-session";
import { BetaAccessDenied } from "./BetaAccessDenied";
import { Input, Label } from "@/components/ui/Field";
import {
  BrandMark,
  CheckCircleIcon,
  DoorEnterIcon,
  LockIcon,
  ShieldIcon,
  SparkIcon,
  WarningIcon,
} from "@/components/ui/icons";

/**
 * Beta authentication + approved-email gate — the REAL access boundary.
 *
 * Order of states (highest priority first):
 *  1. Not configured (no Supabase env): production fails CLOSED with a setup
 *     notice; development shows the notice with a "continue anyway" escape so
 *     local work isn't blocked. Never silently opens the app in production.
 *  2. Loading: the session (and then the approval check) is resolving.
 *  3. Signed out: the Fit OS sign-in screen (Google + email magic link + a
 *     "continue as guest" escape that opens the app locally only).
 *  4. Signed in + approved + active: overlay disappears, the app is revealed.
 *  5. Signed in but not approved / blocked / errored: the BetaAccessDenied screen.
 *
 * GUEST MODE: a purely local "continue as guest" flag (lib/guest-session.ts)
 * opens the normal app shell ONLY — it creates no Supabase user / approved row /
 * access request and grants no admin rights. A real Supabase sign-in always wins
 * (and clears the guest flag); the admin panel still requires a real admin via
 * RLS, so a guest can never reach /admin/beta.
 *
 * Like the other gates, the app shell is always mounted underneath so entering
 * is instant (no remount). Overlays are fixed and scroll-locked; z-index sits
 * below the private-access notice (110) and above the welcome gate (100).
 *
 * No fitness data is read or written here. After login, all workouts / nutrition
 * / water / supplements / gym data still lives only in this device's
 * localStorage (see lib/storage.ts) until a future cloud-sync phase.
 */
export function BetaAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Testing/local escape hatch — OFF by default; never set in production.
  if (isGateDisabledForTesting()) return <>{children}</>;
  // Public, pre-login info pages (privacy / terms / AI disclaimer) render without
  // the access overlay so visitors can read them before deciding to use the app.
  // This grants NO app access — see lib/public-paths.ts. Every other route stays
  // gated exactly as before.
  if (isPublicInfoPath(pathname)) return <>{children}</>;
  return (
    <>
      {children}
      <BetaGateOverlay />
    </>
  );
}

/**
 * Operator-only escape hatch for LOCAL DEVELOPMENT and AUTOMATED QA. When
 * `NEXT_PUBLIC_BETA_DISABLE_GATE === "1"` the gate renders nothing and the app
 * is open. It is OFF by default, so a real deployment that simply never sets the
 * variable always keeps the gate (fail-closed). NEVER set this in production —
 * it is documented as a testing seam only (see docs/BETA_ACCESS_SYSTEM.md). It
 * lets the rest of the QA harness reach app screens without a live Supabase
 * project, and is an env var (not a runtime toggle) so end users cannot flip it.
 */
function isGateDisabledForTesting(): boolean {
  return process.env.NEXT_PUBLIC_BETA_DISABLE_GATE === "1";
}

function BetaGateOverlay() {
  const configured = isSupabaseConfigured();
  const { loading: sessionLoading, email } = useBetaSession();
  const guest = useGuestSession();
  // The decision is stored together with the email it was computed for, so a
  // stale result (after the email changed) is treated as "still checking"
  // purely by derivation — no synchronous reset/setState inside the effect.
  const [resolved, setResolved] = useState<{
    email: string;
    decision: AccessDecision;
  } | null>(null);
  const [devBypass, setDevBypass] = useState(false);

  // Resolve the approval decision whenever we have an authenticated email. All
  // state updates happen inside the async callback (never synchronously in the
  // effect body) to avoid cascading renders.
  useEffect(() => {
    if (!configured || sessionLoading || !email) return;
    let active = true;
    void fetchAccessDecision(email).then((result) => {
      if (!active) return;
      setResolved({ email, decision: result });
      if (result.state === "allowed") void touchLastSeen();
    });
    return () => {
      active = false;
    };
  }, [configured, email, sessionLoading]);

  // A real Supabase sign-in always wins over guest mode: once an authenticated
  // email appears, drop the local guest flag so the user is governed purely by
  // their real approval status (and so admin checks aren't shadowed by guest).
  useEffect(() => {
    if (email && guest) exitGuestSession();
  }, [email, guest]);

  // Only trust a decision that belongs to the currently authenticated email.
  const decision =
    resolved && resolved.email === email ? resolved.decision : null;

  // Each concrete overlay screen below locks body scroll while mounted (see
  // useLockBodyScroll); the "allowed" branch renders nothing and leaves the app
  // scrollable. Resolve the concrete screen top-down by priority.

  // --- Not configured -------------------------------------------------------
  if (!configured) {
    if (devBypass) return null;
    return <BetaConfigNotice onDevContinue={() => setDevBypass(true)} />;
  }

  // --- Loading session ------------------------------------------------------
  if (sessionLoading) return <BetaGateLoading />;

  // --- Guest session (no real user) ----------------------------------------
  // An active guest flag opens the normal app shell only. This is checked before
  // the signed-out screen so a returning guest goes straight in, and it never
  // applies once a real email is present (handled below + cleared by the effect).
  if (!email && guest) return null;

  // --- Signed out -----------------------------------------------------------
  if (!email) return <BetaSignInScreen onGuest={enterGuestSession} />;

  // --- Signed in, checking approval ----------------------------------------
  if (decision === null) return <BetaGateLoading label="בודק הרשאות גישה…" />;

  // --- Approved -------------------------------------------------------------
  if (decision.state === "allowed") return null;

  // --- Denied / blocked / error --------------------------------------------
  return <BetaAccessDenied variant={decision.state} email={email} />;
}

/* ------------------------------ Scroll lock ----------------------------- */
// A tiny helper so each overlay screen locks the body while mounted. Kept as a
// hook used by the overlay screens (not the always-null "allowed" branch). It
// delegates to the shared counter-based lock so stacking with the beta welcome
// notice / profile prompt can never leave the body wedged at overflow: hidden.
function useLockBodyScroll() {
  useBodyScrollLock();
}

/* ------------------------------ Loading screen -------------------------- */

function BetaGateLoading({ label = "טוען את Fit OS…" }: { label?: string }) {
  useLockBodyScroll();
  return (
    <div
      data-beta-gate
      dir="rtl"
      className="fixed inset-0 z-[108] flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-foreground animate-fade-in"
      style={{
        backgroundImage:
          "radial-gradient(120% 75% at 50% -10%, var(--accent-soft) 0%, transparent 55%)," +
          "radial-gradient(100% 55% at 50% 115%, var(--accent-soft) 0%, transparent 60%)",
      }}
    >
      <span className="brand-logo flex h-16 w-16 items-center justify-center rounded-[1.3rem] text-white shadow-glow">
        <BrandMark className="h-9 w-9" />
      </span>
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent"
      />
      <p className="text-[13px] font-medium text-muted">{label}</p>
    </div>
  );
}

/* ------------------------------ Sign-in screen -------------------------- */

function BetaSignInScreen({ onGuest }: { onGuest: () => void }) {
  useLockBodyScroll();
  const titleId = useId();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setBusy("google");
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(
        err === "not-configured"
          ? "מערכת הגישה אינה מוקנפגת."
          : "ההתחברות עם Google נכשלה. נסה שוב.",
      );
      setBusy(null);
    }
    // On success the browser redirects to Google, so we stay "busy".
  };

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      setError("הזן כתובת אימייל תקינה.");
      return;
    }
    setBusy("email");
    const { error: err } = await signInWithEmailLink(email);
    setBusy(null);
    if (err) {
      setError("שליחת קישור הכניסה נכשלה. נסה שוב בעוד רגע.");
      return;
    }
    setSent(true);
  };

  return (
    <div
      data-beta-gate
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[108] flex min-h-dvh items-center justify-center overflow-y-auto px-6 py-10 text-foreground animate-fade-in"
      style={{
        backgroundColor: "var(--background)",
        backgroundImage:
          "radial-gradient(125% 80% at 50% -12%, var(--accent-soft) 0%, transparent 52%)," +
          "radial-gradient(110% 55% at 50% 118%, var(--accent-soft) 0%, transparent 58%)," +
          "linear-gradient(180deg, var(--surface) 0%, var(--background) 100%)",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[1.6rem] brand-logo text-white shadow-glow">
          <BrandMark className="h-11 w-11" />
        </div>

        <h1
          id={titleId}
          className="text-center text-[25px] font-bold tracking-tight"
        >
          כניסה לבטא של Fit OS
        </h1>
        <p className="mx-auto mt-2.5 max-w-[20rem] text-center text-[14px] leading-relaxed text-muted">
          התחבר עם האימייל שאושר כדי להמשיך.
        </p>

        <div className="mt-7 rounded-[1.75rem] border border-border bg-surface/80 p-6 shadow-float backdrop-blur-xl">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
                <CheckCircleIcon className="h-8 w-8" filled />
              </span>
              <p className="text-[15px] font-bold text-foreground">
                הקישור נשלח לאימייל
              </p>
              <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-muted">
                שלחנו קישור כניסה אל{" "}
                <span dir="ltr" className="font-semibold text-foreground">
                  {email.trim()}
                </span>
                . פתח אותו מאותו מכשיר כדי להיכנס.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError(null);
                }}
                className="tap mt-5 text-[13px] font-semibold text-accent"
              >
                שלח לאימייל אחר
              </button>
            </div>
          ) : (
            <>
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy !== null}
                className="tap flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-border-strong bg-surface px-4 text-[15px] font-bold text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:opacity-60"
              >
                <GoogleGlyph className="h-5 w-5" />
                {busy === "google" ? "מתחבר…" : "המשך עם Google"}
              </button>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11.5px] font-semibold text-faint">או</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {/* Email magic link */}
              <form onSubmit={handleEmail}>
                <Label htmlFor="beta-email">אימייל</Label>
                <Input
                  id="beta-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="text-center"
                />
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="tap mt-3 h-14 w-full rounded-2xl brand-gradient text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)] disabled:opacity-60"
                >
                  {busy === "email" ? "שולח…" : "שלח קישור כניסה לאימייל"}
                </button>
              </form>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-red-500"
            >
              <WarningIcon className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {/* Divider before the local guest escape. */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11.5px] font-semibold text-faint">או</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Continue as guest — a purely local session (no Supabase account). */}
          <button
            type="button"
            data-guest-continue
            onClick={onGuest}
            disabled={busy !== null}
            className="tap flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-border-strong bg-surface px-4 text-[15px] font-bold text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:opacity-60"
          >
            <DoorEnterIcon className="h-[18px] w-[18px] text-accent" />
            המשך כאורח
          </button>
          <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
            כניסה כאורח שומרת נתונים במכשיר הזה בלבד.
          </p>
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-border bg-surface-2/60 px-4 py-3 text-right">
          <LockIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent" />
          <p className="text-[12.5px] leading-relaxed text-muted">
            הכניסה מזהה מי רשאי להשתמש בבטא. הנתונים האישיים עדיין נשמרים במכשיר
            הזה בלבד, אלא אם נוסיף סנכרון ענן בעתיד.
          </p>
        </div>

        {/* Public info links — readable before signing in (see lib/public-paths). */}
        <nav className="mt-5 flex items-center justify-center gap-2 text-[12.5px] font-semibold text-muted">
          <Link
            href="/privacy"
            className="tap underline outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          >
            מדיניות פרטיות
          </Link>
          <span aria-hidden="true" className="text-faint">
            ·
          </span>
          <Link
            href="/terms"
            className="tap underline outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          >
            תנאי שימוש
          </Link>
        </nav>
      </div>
    </div>
  );
}

/* --------------------------- Config-needed screen ----------------------- */

function BetaConfigNotice({ onDevContinue }: { onDevContinue: () => void }) {
  useLockBodyScroll();
  const titleId = useId();
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div
      data-beta-gate
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[108] flex min-h-dvh items-center justify-center overflow-y-auto px-6 py-10 text-foreground animate-fade-in"
      style={{
        backgroundColor: "var(--background)",
        backgroundImage:
          "radial-gradient(125% 80% at 50% -12%, var(--accent-soft) 0%, transparent 52%)," +
          "linear-gradient(180deg, var(--surface) 0%, var(--background) 100%)",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="w-full max-w-sm animate-fade-up">
        <div className="rounded-[1.75rem] border border-border bg-surface/80 p-6 shadow-float backdrop-blur-xl">
          <div className="relative mx-auto mb-6 h-20 w-20">
            <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-surface-2 text-muted shadow-soft">
              <ShieldIcon className="h-10 w-10" />
            </span>
          </div>

          <h1
            id={titleId}
            className="text-center text-[22px] font-bold tracking-tight"
          >
            מערכת הגישה אינה מוקנפגת
          </h1>
          <p className="mx-auto mt-3 max-w-[21rem] text-center text-[13.5px] leading-relaxed text-muted">
            {isDev
              ? "לא הוגדרו משתני הסביבה של Supabase. הגדר אותם כדי להפעיל את בקרת הגישה לבטא."
              : "בקרת הגישה לבטא אינה זמינה כרגע. נסה שוב מאוחר יותר."}
          </p>

          {isDev && (
            <div className="mt-5 rounded-2xl border border-border bg-surface-2/70 px-4 py-3 text-right">
              <p className="text-[12px] font-semibold text-foreground">
                להגדרה (פיתוח):
              </p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-[12px] leading-relaxed text-muted">
                <li dir="ltr" className="text-left">
                  NEXT_PUBLIC_SUPABASE_URL
                </li>
                <li dir="ltr" className="text-left">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </li>
              </ul>
              <p className="mt-2 text-[11.5px] leading-relaxed text-faint">
                ראה docs/BETA_ACCESS_SYSTEM.md ו־.env.local.example.
              </p>
            </div>
          )}

          {isDev && (
            <button
              type="button"
              onClick={onDevContinue}
              className="tap mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border-strong bg-surface text-[14px] font-semibold text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
            >
              <SparkIcon className="h-[18px] w-[18px] text-accent" />
              המשך בכל זאת (פיתוח בלבד)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Glyphs --------------------------------- */

/** The multicolor Google "G". Inline so no asset/network dependency is added. */
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.21 7.21 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
