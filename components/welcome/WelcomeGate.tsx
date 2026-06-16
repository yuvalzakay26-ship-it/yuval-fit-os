"use client";

import { useId } from "react";
import { usePathname } from "next/navigation";
import { isPublicInfoPath } from "@/lib/public-paths";
import { markWelcomeSeen, useWelcomeSeen } from "@/lib/welcome";
import {
  AppleIcon,
  BrandMark,
  ChartIcon,
  DumbbellIcon,
  ListIcon,
} from "@/components/ui/icons";

/**
 * App-level welcome gate. Renders the app and, until the welcome screen has been
 * seen, a premium full-screen intro overlay on top of it.
 *
 * The app shell is always mounted underneath so entering is instant (no remount)
 * and existing functionality / PWA / service-worker behaviour is untouched. The
 * overlay is server-rendered and hidden before first paint for returning users
 * via the `.welcome-seen` class set by WELCOME_INIT_SCRIPT.
 */
export function WelcomeGate({ children }: { children: React.ReactNode }) {
  const seen = useWelcomeSeen();
  const pathname = usePathname();
  // The public info pages (privacy / terms / AI disclaimer) are readable before
  // login, so the first-visit intro must not cover them for a brand-new visitor.
  // See lib/public-paths.ts — every other route keeps the intro as before.
  const isPublic = isPublicInfoPath(pathname);
  return (
    <>
      {children}
      {!seen && !isPublic && <WelcomeScreen />}
    </>
  );
}

const FEATURES: Array<{
  icon: (p: { className?: string }) => React.ReactElement;
  label: string;
}> = [
  { icon: DumbbellIcon, label: "תיעוד אימונים ותרגילים" },
  { icon: AppleIcon, label: "מעקב תזונה וחלבון" },
  { icon: ListIcon, label: "מאגר תרגילים ומאכלים ויזואלי" },
  { icon: ChartIcon, label: "התקדמות אישית לאורך זמן" },
];

function WelcomeScreen() {
  const titleId = useId();

  return (
    <div
      data-welcome-gate
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-background px-6 py-10 text-foreground animate-fade-in"
      style={{
        backgroundImage:
          "radial-gradient(120% 75% at 50% -10%, var(--accent-soft) 0%, transparent 55%)," +
          "radial-gradient(100% 55% at 50% 115%, var(--accent-soft) 0%, transparent 60%)",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[1.6rem] brand-logo text-white shadow-glow">
          <BrandMark className="h-11 w-11" />
        </div>

        <h1
          id={titleId}
          className="text-center text-[26px] font-bold tracking-tight"
        >
          ברוך הבא ל־Fit OS
        </h1>
        <p className="mx-auto mt-2.5 max-w-[19rem] text-center text-[14px] leading-relaxed text-muted">
          מערכת אישית לאימונים, תזונה והתקדמות — במקום אחד.
        </p>

        <ul className="mt-8 space-y-2.5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface/70 px-4 py-3 shadow-soft"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[14px] font-semibold text-foreground">
                {label}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => markWelcomeSeen()}
          className="tap mt-8 h-14 w-full rounded-2xl brand-gradient text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]"
        >
          כניסה למערכת
        </button>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-faint">
          הנתונים נשמרים מקומית במכשיר שלך.
        </p>
      </div>
    </div>
  );
}
