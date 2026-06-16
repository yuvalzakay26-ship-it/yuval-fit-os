"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isPublicInfoPath } from "@/lib/public-paths";
import {
  markBetaWelcomeSeen,
  useBetaWelcomeSeen,
} from "@/lib/beta-welcome";
import { useAppAccessGranted } from "@/lib/app-access";
import {
  BrandMark,
  ChatIcon,
  HeartIcon,
  PhoneIcon,
  SparkIcon,
} from "@/components/ui/icons";

/**
 * Friendly beta welcome notice — the warm "thanks for testing" greeting shown
 * AFTER the real beta access gate (components/access/BetaAuthGate.tsx) has let
 * the user in. It replaced the old "private system / do not share the link"
 * notice: access is now controlled by Google login + an approved-email gate, so
 * the onboarding message is no longer about security — it welcomes testers, sets
 * expectations that the app is still evolving, and shows how to reach Yuval.
 *
 * Behaviour:
 *  - Shows once PER SESSION (sessionStorage: yfos:beta-welcome-seen-session:v1),
 *    as part of every app entry — for admins, approved testers, and guests alike —
 *    and only once the user has actually passed the access gate (approved real
 *    user OR local guest). It does not re-appear while navigating between routes
 *    in the same session, but a fresh entry (new tab / launch / session) greets
 *    again. It NEVER appears for denied/blocked users or before auth/access has
 *    resolved — see useAppAccessGranted below.
 *  - The app shell is always mounted underneath so acknowledging is instant (no
 *    remount). The overlay sits above the welcome gate (z-100) and below the beta
 *    auth gate (z-108) so the gate's own screens always win while access is
 *    unresolved/denied.
 *
 * No auth/approval/fitness data is read or written here beyond a read-only check
 * of whether the current user is already allowed in (so we never greet someone
 * the gate is still blocking).
 */
export function BetaWelcomeNotice({ children }: { children: React.ReactNode }) {
  const seen = useBetaWelcomeSeen();
  const granted = useAppAccessGranted();
  const pathname = usePathname();
  // The public info pages stay readable from the welcome notice's own links: the
  // greeting steps aside on those routes (it still reappears on app routes until
  // acknowledged). See lib/public-paths.ts.
  const isPublic = isPublicInfoPath(pathname);
  return (
    <>
      {children}
      {granted && !seen && !isPublic && <NoticeScreen />}
    </>
  );
}

/** WhatsApp deep link to Yuval (international format, no plus). */
const WHATSAPP_URL = "https://wa.me/972533339341";
/** Tel link mirrors the displayed local number. */
const PHONE_TEL = "tel:+972533339341";
const PHONE_DISPLAY = "053-333-9341";

function NoticeScreen() {
  const titleId = useId();
  const descId = useId();

  // Lock background scroll while the welcome notice is up.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      data-beta-welcome-gate
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-[104] flex min-h-dvh items-center justify-center overflow-y-auto px-6 py-10 text-foreground animate-fade-in"
      style={{
        // A warm, premium backdrop that reads in both themes — an adaptive
        // surface wash layered with two soft accent glows.
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
        {/* Friendly welcome pill */}
        <div className="mb-7 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-[12px] font-semibold text-muted shadow-soft backdrop-blur-sm">
            <SparkIcon className="h-3.5 w-3.5 text-accent" />
            ברוכים הבאים לבטא
          </span>
        </div>

        {/* Glass card */}
        <div className="rounded-[1.75rem] border border-border bg-surface/80 p-6 shadow-float backdrop-blur-xl">
          {/* Brand mark with a small friendly heart accent. */}
          <div className="relative mx-auto mb-6 h-20 w-20">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[1.6rem] brand-logo opacity-30 blur-xl"
            />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.6rem] brand-logo text-white shadow-glow">
              <BrandMark className="h-10 w-10" />
            </span>
            <span className="absolute -bottom-1.5 -left-1.5 flex h-8 w-8 items-center justify-center rounded-2xl border border-border bg-surface text-accent shadow-soft">
              <HeartIcon className="h-[16px] w-[16px]" />
            </span>
          </div>

          <h1
            id={titleId}
            className="text-center text-[24px] font-bold tracking-tight"
          >
            ברוכים הבאים ל־Fit OS
          </h1>
          <p className="mx-auto mt-2.5 text-center text-[14px] font-semibold leading-relaxed text-foreground">
            שמחים שהצטרפתם לבדוק את המערכת 🙌
          </p>

          <div id={descId} className="mt-4 space-y-3 text-right">
            <p className="text-[13px] leading-relaxed text-muted">
              Fit OS נמצאת כרגע בשלבי פיתוח ובדיקת בטא, ולכן ייתכן שתיתקלו בדברים
              שעדיין משתנים, באגים קטנים, חוסרים או אזורים שעדיין לא הושלמו.
            </p>
            <p className="text-[13px] leading-relaxed text-muted">
              אם נתקלתם בבעיה, משהו לא ברור, או שיש לכם רעיון לשיפור — אפשר לפנות
              אליי ישירות.
            </p>
          </div>

          {/* Contact card — Yuval's number, calm and inviting. */}
          <a
            href={PHONE_TEL}
            className="tap mt-5 flex items-center gap-3 rounded-2xl border border-border bg-surface-2/70 px-4 py-3 text-right outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
              <PhoneIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-bold text-foreground">
                יובל
              </span>
              <span dir="ltr" className="block text-[13px] font-semibold text-muted">
                {PHONE_DISPLAY}
              </span>
            </span>
          </a>

          <button
            type="button"
            onClick={() => markBetaWelcomeSeen()}
            className="tap mt-6 h-14 w-full rounded-2xl brand-gradient text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]"
          >
            הבנתי, המשך למערכת
          </button>

          {/* Optional secondary action — open a WhatsApp chat with Yuval. */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tap mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border-strong bg-surface text-[14px] font-semibold text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          >
            <ChatIcon className="h-[18px] w-[18px] text-accent" />
            שלח הודעה ליובל
          </a>

          <p className="mt-5 text-center text-[12px] leading-relaxed text-faint">
            תודה שאתם עוזרים לשפר את המערכת.
          </p>

          {/* Quiet links to the public info pages — kept minimal so the welcome
              screen stays uncluttered. */}
          <nav className="mt-3 flex items-center justify-center gap-2 text-[11.5px] font-semibold text-muted">
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
    </div>
  );
}
