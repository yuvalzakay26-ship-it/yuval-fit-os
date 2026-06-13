"use client";

import { useId } from "react";
import {
  acceptPrivateAccess,
  usePrivateAccessAccepted,
} from "@/lib/private-access";
import { LockIcon, ShieldIcon, SparkIcon } from "@/components/ui/icons";

/**
 * Premium private-access notice gate.
 *
 * This is NOT auth or a password — there is no input and no backend check. It
 * is an informational, deterrent notice telling the user the app is private and
 * intended only for whoever received a direct link. It shows once per browser
 * session (sessionStorage; see lib/private-access.ts) and then gets out of the
 * way.
 *
 * The app shell is always mounted underneath so entering is instant (no remount)
 * and PWA / service-worker / welcome behaviour is untouched. The overlay is
 * server-rendered and hidden before first paint for accepted sessions via the
 * `.private-access-accepted` class set by PRIVATE_ACCESS_INIT_SCRIPT. It sits
 * above the welcome gate (z-index) so it is the first thing seen on entry.
 */
export function PrivateAccessNotice({
  children,
}: {
  children: React.ReactNode;
}) {
  const accepted = usePrivateAccessAccepted();
  return (
    <>
      {children}
      {!accepted && <NoticeScreen />}
    </>
  );
}

/** Small chips communicating the nature of access — calm, not alarming. */
const CHIPS = ["קישור אישי", "שימוש פרטי", "ללא סיסמה בשלב זה"];

function NoticeScreen() {
  const titleId = useId();
  const descId = useId();

  return (
    <div
      data-private-access-gate
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-[110] flex min-h-dvh items-center justify-center overflow-y-auto px-6 py-10 text-foreground animate-fade-in"
      style={{
        // A deep, premium "private system" backdrop that reads consistently in
        // both themes — an adaptive surface wash layered with two accent glows.
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
        {/* Top badge */}
        <div className="mb-7 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-[12px] font-semibold text-muted shadow-soft backdrop-blur-sm">
            <LockIcon className="h-3.5 w-3.5 text-accent" />
            גישה פרטית
          </span>
        </div>

        {/* Glass card */}
        <div className="rounded-[1.75rem] border border-border bg-surface/80 p-6 shadow-float backdrop-blur-xl">
          {/* Icon cluster: shield hero with an orbiting lock + spark accents. */}
          <div className="relative mx-auto mb-6 h-24 w-24">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[1.65rem] brand-gradient opacity-30 blur-xl"
            />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-[1.65rem] brand-gradient text-[color:var(--accent-contrast)] shadow-glow">
              <ShieldIcon className="h-11 w-11" />
            </span>
            <span className="absolute -bottom-1.5 -left-1.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-accent shadow-soft">
              <LockIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl border border-border bg-surface text-accent shadow-soft">
              <SparkIcon className="h-3.5 w-3.5" />
            </span>
          </div>

          <h1
            id={titleId}
            className="text-center text-[26px] font-bold tracking-tight"
          >
            מערכת פרטית
          </h1>
          <p className="mx-auto mt-2.5 max-w-[20rem] text-center text-[14px] leading-relaxed text-muted">
            הגישה ל־Fit OS מיועדת רק למי שקיבל קישור ישיר.
          </p>

          <p
            id={descId}
            className="mx-auto mt-3 max-w-[20rem] text-center text-[13px] leading-relaxed text-faint"
          >
            אין להעביר את הקישור לגורמים אחרים. השימוש במערכת מיועד לצפייה
            ותפעול אישי בלבד.
          </p>

          {/* Trust / notice chips */}
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {CHIPS.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-semibold text-muted"
              >
                {chip}
              </li>
            ))}
          </ul>

          {/* Calm, future-facing deterrent note — no false security claims. */}
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-border bg-surface-2/60 px-4 py-3 text-right">
            <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent" />
            <p className="text-[12.5px] leading-relaxed text-muted">
              שימוש לא מורשה או העברת הקישור לאחרים אינם חלק מהשימוש המיועד
              במערכת. בעתיד ניתן יהיה להוסיף בקרת גישה.
            </p>
          </div>

          <button
            type="button"
            onClick={() => acceptPrivateAccess()}
            className="tap mt-6 h-14 w-full rounded-2xl brand-gradient text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]"
          >
            הבנתי, כניסה למערכת
          </button>

          <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">
            המשך השימוש מהווה אישור שהגישה נועדה עבורך בלבד.
          </p>
        </div>
      </div>
    </div>
  );
}
