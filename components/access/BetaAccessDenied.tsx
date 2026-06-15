"use client";

import { useEffect, useId, useState } from "react";
import {
  type AccessRequest,
  fetchMyAccessRequest,
  signOut,
  submitAccessRequest,
} from "@/lib/beta-access";
import {
  CheckCircleIcon,
  ClockIcon,
  DoorEnterIcon,
  LockIcon,
  ShieldIcon,
  WarningIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Full-screen "no beta access" overlay. Shown to a signed-in user whose email
 * is not approved (`denied`), is blocked (`blocked`), or when the access check
 * itself failed (`error`). Calm, non-alarming wording — this is a closed beta,
 * not a security incident. The only actions are to sign out (and optionally
 * retry with another email, which is just sign-out under a friendlier label).
 *
 * The app shell is mounted underneath every gate, so this overlay simply sits
 * on top (fixed, scroll-locked); signing out returns the user to the sign-in
 * screen. No fitness data is touched.
 */
export function BetaAccessDenied({
  variant,
  email,
}: {
  variant: "denied" | "blocked" | "error";
  email: string | null;
}) {
  const titleId = useId();
  const descId = useId();
  const [busy, setBusy] = useState(false);

  const copy = COPY[variant];

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    // The auth listener flips the session to signed-out and the gate re-renders
    // to the sign-in screen; no manual navigation needed.
  };

  return (
    <div
      data-beta-access-denied
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
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
        <div className="mb-7 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-[12px] font-semibold text-muted shadow-soft backdrop-blur-sm">
            <LockIcon className="h-3.5 w-3.5 text-accent" />
            גישת בטא
          </span>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-surface/80 p-6 shadow-float backdrop-blur-xl">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[1.65rem] brand-gradient opacity-25 blur-xl"
            />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-[1.65rem] brand-gradient text-[color:var(--accent-contrast)] shadow-glow">
              <ShieldIcon className="h-11 w-11" />
            </span>
            <span className="absolute -bottom-1.5 -left-1.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-accent shadow-soft">
              <LockIcon className="h-[18px] w-[18px]" />
            </span>
          </div>

          <h1
            id={titleId}
            className="text-center text-[24px] font-bold tracking-tight"
          >
            {copy.title}
          </h1>
          <p
            id={descId}
            className="mx-auto mt-3 max-w-[20rem] text-center text-[13.5px] leading-relaxed text-muted"
          >
            {copy.body}
          </p>

          {email && (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2/70 px-4 py-2.5">
              <span className="text-[12px] text-faint">מחובר כ־</span>
              <span dir="ltr" className="truncate text-[13px] font-semibold text-foreground">
                {email}
              </span>
            </div>
          )}

          {variant === "error" && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-right">
              <WarningIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-amber-500" />
              <p className="text-[12.5px] leading-relaxed text-muted">
                לא הצלחנו לאמת את הגישה כרגע. בדוק את החיבור לאינטרנט ונסה שוב.
              </p>
            </div>
          )}

          {/* Request access — only for plain "not approved" (never for blocked,
              which must not be bypassable, nor for a transient error). */}
          {variant === "denied" && <RequestAccessPanel email={email} />}

          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="tap mt-6 h-14 w-full rounded-2xl brand-gradient text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)] disabled:opacity-60"
          >
            התנתק
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="tap mt-3 h-11 w-full rounded-2xl border border-border bg-surface-2 text-[13.5px] font-semibold text-foreground outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:opacity-60"
          >
            נסה אימייל אחר
          </button>

          <p className="mt-5 text-center text-[12px] leading-relaxed text-faint">
            אם קיבלת הזמנה, ודא שהתחברת עם האימייל שאושר.
          </p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Request access panel ----------------------- */
// Shown under the "not approved" screen. Loads the user's existing request (if
// any) then offers a single "בקש גישה" CTA, or a calm status when a request
// already exists / was just sent / was rejected. The submitted email is taken
// from the live session inside submitAccessRequest, never from this component.

type RequestView =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "sent" } // just submitted in this session
  | { kind: "pending" } // a request already existed on load
  | { kind: "approved" }
  | { kind: "rejected" };

function RequestAccessPanel({ email }: { email: string | null }) {
  const [view, setView] = useState<RequestView>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing request for this email once. The denied screen only mounts
  // for a signed-in user, so `email` is present; state is set only inside the
  // async callback so nothing renders synchronously from the effect body.
  useEffect(() => {
    if (!email) return;
    let active = true;
    void fetchMyAccessRequest(email).then((req) => {
      if (!active) return;
      setView(viewForRequest(req));
    });
    return () => {
      active = false;
    };
  }, [email]);

  const handleRequest = async () => {
    setError(null);
    setBusy(true);
    const result = await submitAccessRequest();
    setBusy(false);
    if (!result.ok) {
      setError(
        result.error === "not-configured"
          ? "מערכת הגישה אינה מוקנפגת."
          : "שליחת הבקשה נכשלה. נסה שוב בעוד רגע.",
      );
      return;
    }
    setView({ kind: result.alreadyExists ? "pending" : "sent" });
  };

  if (view.kind === "loading") {
    return (
      <div className="mt-6 flex items-center justify-center">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"
        />
      </div>
    );
  }

  // No request yet → the call-to-action button.
  if (view.kind === "none") {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={handleRequest}
          disabled={busy}
          className="tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl brand-gradient text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)] disabled:opacity-60"
        >
          <DoorEnterIcon className="h-[18px] w-[18px]" />
          {busy ? "שולח…" : "בקש גישה"}
        </button>
        {error && (
          <p
            role="alert"
            className="mt-3 flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-red-500"
          >
            <WarningIcon className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }

  // A request exists (or was just sent) → calm status box.
  const status = REQUEST_STATUS_COPY[view.kind];
  return (
    <div
      className="mt-6 flex items-start gap-2.5 rounded-2xl border border-border bg-surface-2/70 px-4 py-3.5 text-right"
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl",
          status.tone === "rejected"
            ? "bg-red-500/10 text-red-500"
            : "bg-[color:var(--accent-soft)] text-accent",
        )}
      >
        {status.tone === "rejected" ? (
          <WarningIcon className="h-[16px] w-[16px]" />
        ) : view.kind === "pending" ? (
          <ClockIcon className="h-[16px] w-[16px]" />
        ) : (
          <CheckCircleIcon className="h-[16px] w-[16px]" filled />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold text-foreground">{status.title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
          {status.body}
        </p>
      </div>
    </div>
  );
}

function viewForRequest(req: AccessRequest | null): RequestView {
  if (!req) return { kind: "none" };
  if (req.status === "rejected") return { kind: "rejected" };
  if (req.status === "approved") return { kind: "approved" };
  return { kind: "pending" };
}

const REQUEST_STATUS_COPY: Record<
  "sent" | "pending" | "approved" | "rejected",
  { title: string; body: string; tone: "accent" | "rejected" }
> = {
  sent: {
    title: "הבקשה נשלחה",
    body: "האדמין יוכל לאשר אותך מתוך מערכת הניהול.",
    tone: "accent",
  },
  pending: {
    title: "כבר נשלחה בקשת גישה",
    body: "נעדכן אותך לאחר אישור האדמין.",
    tone: "accent",
  },
  approved: {
    title: "הבקשה אושרה",
    body: "התחבר מחדש או רענן את הדף כדי להיכנס.",
    tone: "accent",
  },
  rejected: {
    title: "הבקשה נדחתה",
    body: "אפשר לפנות ליובל אם לדעתך זו טעות.",
    tone: "rejected",
  },
};

const COPY: Record<
  "denied" | "blocked" | "error",
  { title: string; body: string }
> = {
  denied: {
    title: "אין לך גישה לבטא כרגע",
    body: "המערכת פתוחה כרגע רק למשתמשים שאושרו מראש. אפשר לשלוח בקשת גישה לאדמין.",
  },
  blocked: {
    title: "הגישה שלך לבטא הושהתה",
    body: "החשבון הזה אינו פעיל כרגע בבטא. אם לדעתך מדובר בטעות, פנה למנהל המערכת.",
  },
  error: {
    title: "לא ניתן לאמת את הגישה",
    body: "אירעה תקלה בבדיקת ההרשאות לבטא. נסה להתחבר מחדש בעוד רגע.",
  },
};
