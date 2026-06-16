"use client";

import { useEffect, useId } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isPublicInfoPath } from "@/lib/public-paths";
import { useAppAccessGranted } from "@/lib/app-access";
import { useWelcomeSeen } from "@/lib/welcome";
import { useBetaWelcomeSeen } from "@/lib/beta-welcome";
import {
  dismissProfileOnboarding,
  useProfileOnboardingDismissed,
} from "@/lib/profile-onboarding";
import {
  isProfileEmpty,
  usePersonalProfile,
} from "@/lib/personal-profile";
import { SparkIcon, TargetIcon } from "@/components/ui/icons";

/** The profile route — the prompt invites the user here, and steps aside on it. */
const PROFILE_PATH = "/training-profile";

/**
 * Optional profile onboarding prompt (Personal Profile Onboarding V2) — the
 * SECOND step of every app entry, shown right after the beta welcome.
 *
 * A calm invitation to fill the short personal training profile so the app can
 * later tailor the experience. It is NOT a gate and NEVER blocks the app: the user
 * can start, choose "not now", or simply ignore it — and can always fill or edit
 * the profile later from More / Workouts.
 *
 * It appears ONLY when ALL of the following hold, so it never stacks on top of
 * another modal and never shows before access is resolved:
 *   • the user has truly passed the access boundary (useAppAccessGranted) — never
 *     while auth/approval is loading and never for a denied/blocked user;
 *   • the first-visit welcome screen AND the beta welcome notice are both done for
 *     this session (so the beta welcome is always seen FIRST and the two prompts
 *     never show at once — when the beta welcome is open this renders null);
 *   • no personal profile exists yet;
 *   • the prompt has not been dismissed THIS SESSION (sessionStorage flag — a
 *     future entry can show it again while no profile exists);
 *   • the route is not a public info page (privacy / terms / AI disclaimer) and
 *     not the profile page itself.
 *
 * All gating hooks are SSR-safe (server / first-hydration snapshots are
 * false/null), so the server renders nothing and the prompt only appears after
 * the client resolves state — no flash, no hydration mismatch.
 */
export function ProfileOnboardingPrompt() {
  const granted = useAppAccessGranted();
  const welcomeSeen = useWelcomeSeen();
  const betaWelcomeSeen = useBetaWelcomeSeen();
  const dismissed = useProfileOnboardingDismissed();
  const profile = usePersonalProfile();
  const pathname = usePathname();

  const hasProfile = profile !== null && !isProfileEmpty(profile);
  const onExcludedRoute =
    isPublicInfoPath(pathname) || pathname === PROFILE_PATH;

  const show =
    granted &&
    welcomeSeen &&
    betaWelcomeSeen &&
    !dismissed &&
    !hasProfile &&
    !onExcludedRoute;

  if (!show) return null;
  return <PromptScreen />;
}

function PromptScreen() {
  const router = useRouter();
  const titleId = useId();
  const descId = useId();

  // Lock background scroll while the prompt is up (mirrors the welcome notice).
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Both actions remember the choice for this session so the prompt steps aside;
  // it may return on a future app entry while no profile exists, and the profile
  // stays reachable from its entry points either way.
  const handleStart = () => {
    dismissProfileOnboarding();
    router.push(PROFILE_PATH);
  };
  const handleNotNow = () => {
    dismissProfileOnboarding();
  };

  return (
    <div
      data-profile-onboarding
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      // A true centered modal: the overlay centers the card both axes and only
      // scrolls if the viewport is shorter than the card (small phones). It is
      // never a bottom sheet — the card stays a focused, floating dialog.
      className="fixed inset-0 z-[95] flex min-h-dvh items-center justify-center overflow-y-auto px-5 py-8 text-foreground animate-fade-in"
    >
      {/* Dimmed + blurred backdrop — tapping it is the calm "not now" choice. */}
      <button
        type="button"
        aria-label="סגירה"
        onClick={handleNotNow}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative my-auto w-full max-w-sm animate-zoom-in rounded-[1.9rem] border border-border bg-surface-raised p-7 shadow-float">
        {/* Premium icon treatment — gradient badge with a soft glow halo. */}
        <div className="relative mx-auto mb-6 h-[4.5rem] w-[4.5rem]">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[1.5rem] brand-gradient opacity-40 blur-xl"
          />
          <span className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.5rem] brand-gradient text-[color:var(--accent-contrast)] shadow-glow ring-1 ring-white/15">
            <TargetIcon className="h-9 w-9" />
          </span>
        </div>

        <h2
          id={titleId}
          className="text-center text-[21px] font-extrabold leading-tight tracking-tight text-foreground"
        >
          נכיר אותך כדי להתאים את החוויה?
        </h2>
        <p
          id={descId}
          className="mx-auto mt-3 max-w-[20rem] text-center text-[13.5px] leading-relaxed text-muted"
        >
          כמה שאלות קצרות יעזרו למערכת להבין את המטרה, השגרה והאימון שמתאים לך.
          אפשר לדלג ולמלא אחר כך.
        </p>

        <button
          type="button"
          onClick={handleStart}
          className="tap mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl brand-gradient text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]"
        >
          <SparkIcon className="h-[18px] w-[18px]" /> בוא נתחיל
        </button>
        <button
          type="button"
          onClick={handleNotNow}
          className="tap mt-2.5 flex h-12 w-full items-center justify-center rounded-2xl border border-border-strong bg-surface text-[14px] font-semibold text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
        >
          לא עכשיו
        </button>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-faint">
          אפשר תמיד למלא או לערוך מאוחר יותר מתוך &quot;עוד&quot; או מסך האימונים.
        </p>
      </div>
    </div>
  );
}
