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
 * Optional first-entry profile onboarding prompt (Personal Profile Onboarding V2).
 *
 * A calm, one-time invitation to fill the short personal training profile so the
 * app can later tailor the experience. It is NOT a gate and NEVER blocks the app:
 * the user can start, choose "not now", or simply ignore it — and can always fill
 * or edit the profile later from More / Workouts.
 *
 * It appears ONLY when ALL of the following hold, so it never stacks on top of
 * another modal and never shows before access is resolved:
 *   • the user has truly passed the access boundary (useAppAccessGranted) — never
 *     while auth/approval is loading and never for a denied/blocked user;
 *   • the first-visit welcome screen AND the beta welcome notice are both done
 *     (so this is the LAST thing in the onboarding sequence, no stacking);
 *   • no personal profile exists yet;
 *   • the prompt has not been dismissed before (localStorage flag);
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

  // Both actions remember the choice so the prompt is truly one-time; the profile
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
      className="fixed inset-0 z-[95] flex min-h-dvh items-end justify-center overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 text-foreground animate-fade-in sm:items-center"
    >
      {/* Backdrop — tapping it is the calm "not now" choice. */}
      <button
        type="button"
        aria-label="סגירה"
        onClick={handleNotNow}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-sm animate-fade-up rounded-[1.75rem] border border-border bg-surface-raised p-6 shadow-float">
        {/* Friendly icon */}
        <div className="relative mx-auto mb-5 h-16 w-16">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[1.4rem] brand-gradient opacity-30 blur-xl"
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-[1.4rem] brand-gradient text-[color:var(--accent-contrast)] shadow-glow">
            <TargetIcon className="h-8 w-8" />
          </span>
        </div>

        <h2
          id={titleId}
          className="text-center text-[20px] font-extrabold leading-tight tracking-tight text-foreground"
        >
          נכיר אותך כדי להתאים את החוויה?
        </h2>
        <p
          id={descId}
          className="mx-auto mt-2.5 max-w-[20rem] text-center text-[13.5px] leading-relaxed text-muted"
        >
          כמה שאלות קצרות יעזרו למערכת להבין את המטרה, השגרה והאימון שמתאים לך.
          אפשר לדלג ולמלא אחר כך.
        </p>

        <button
          type="button"
          onClick={handleStart}
          className="tap mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl brand-gradient text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]"
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

        <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">
          אפשר תמיד למלא או לערוך מאוחר יותר מתוך &quot;עוד&quot; או מסך האימונים.
        </p>
      </div>
    </div>
  );
}
