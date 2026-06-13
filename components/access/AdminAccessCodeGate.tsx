"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  grantAdminAccess,
  isAdminCodeValid,
  useAdminAccessGranted,
} from "@/lib/admin-access";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  ShieldIcon,
  WarningIcon,
} from "@/components/ui/icons";

/**
 * Admin access-code gate.
 *
 * A CLIENT-SIDE access code barrier — NOT real authentication. The code is
 * checked in the browser only (see lib/admin-access.ts); there is no backend,
 * no token, and no device detection or tracking. It sits between the
 * private-access notice and the welcome screen: once the private notice is
 * accepted, this gate requires the access code before the app (or welcome
 * screen) is revealed. Granting is remembered per browser/device (localStorage)
 * so it is not asked again until the user locks the system in Settings.
 *
 * The app shell is always mounted underneath so entering is instant (no
 * remount). The overlay is server-rendered and hidden before first paint for
 * already-granted devices via the `.admin-access-granted` class set by
 * ADMIN_ACCESS_INIT_SCRIPT. Its z-index sits below the private notice (seen
 * first) and above the welcome gate (revealed only after a correct code).
 */
export function AdminAccessCodeGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const granted = useAdminAccessGranted();
  return (
    <>
      {children}
      {!granted && <GateScreen />}
    </>
  );
}

function GateScreen() {
  const titleId = useId();
  const descId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [reveal, setReveal] = useState(false);

  // Lock body scroll while the gate is visible; restore on unmount (grant).
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Auto-focus the code field once mounted (safe — no layout shift on mobile
  // since the gate already owns the full viewport).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isAdminCodeValid(code)) {
      grantAdminAccess();
    } else {
      setError(true);
    }
  };

  return (
    <div
      data-admin-access-gate
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-[105] flex min-h-dvh items-center justify-center overflow-y-auto px-6 py-10 text-white animate-fade-in"
      style={{
        // A controlled red/black warning backdrop — intentionally the same in
        // light and dark themes so the gate always reads as serious and powerful.
        backgroundColor: "#07060a",
        backgroundImage:
          "radial-gradient(135% 80% at 50% -10%, rgba(220,38,38,0.34) 0%, transparent 52%)," +
          "radial-gradient(120% 60% at 50% 116%, rgba(127,29,29,0.40) 0%, transparent 58%)," +
          "linear-gradient(180deg, #120708 0%, #07060a 60%, #050407 100%)",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="w-full max-w-sm animate-fade-up">
        {/* Top badge */}
        <div className="mb-7 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/40 px-3.5 py-1.5 text-[12px] font-semibold text-red-200 shadow-[0_8px_30px_-12px_rgba(220,38,38,0.7)] backdrop-blur-sm">
            <ShieldIcon className="h-3.5 w-3.5 text-red-400" />
            גישת מנהל
          </span>
        </div>

        {/* Dark glass card with a subtle danger glow */}
        <div className="relative rounded-[1.75rem] border border-red-500/25 bg-white/[0.04] p-6 shadow-[0_30px_80px_-30px_rgba(220,38,38,0.55)] backdrop-blur-xl">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-[1.75rem] bg-gradient-to-b from-red-500/10 to-transparent"
          />

          {/* Icon composition: shield hero with an exclamation glow + orbiting lock */}
          <div className="relative mx-auto mb-6 h-24 w-24">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[1.65rem] bg-red-600 opacity-40 blur-2xl"
            />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-[1.65rem] bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_18px_45px_-12px_rgba(220,38,38,0.9)]">
              <WarningIcon className="h-11 w-11" />
            </span>
            <span className="absolute -bottom-1.5 -left-1.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-red-500/40 bg-[#0c0a0d] text-red-300 shadow-soft">
              <LockIcon className="h-[18px] w-[18px]" />
            </span>
          </div>

          <h1
            id={titleId}
            className="text-center text-[26px] font-bold tracking-tight text-white"
          >
            כניסה מוגבלת
          </h1>
          <p className="mx-auto mt-2.5 max-w-[20rem] text-center text-[14px] leading-relaxed text-white/70">
            המערכת פתוחה רק למי שקיבל הרשאת כניסה.
          </p>

          {/* Warning copy — honest framing, no false tracking/detection claims. */}
          <div
            id={descId}
            className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-950/30 px-4 py-3 text-right"
          >
            <WarningIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-400" />
            <p className="text-[12.5px] leading-relaxed text-red-100/80">
              אם אינך מנהל המערכת או לא קיבלת אישור מפורש, אין להמשיך לשימוש
              במערכת.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <label
              htmlFor="admin-access-code"
              className="mb-1.5 block text-[12.5px] font-semibold text-white/80"
            >
              קוד גישה
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="admin-access-code"
                name="admin-access-code"
                type={reveal ? "text" : "password"}
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                dir="ltr"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  if (error) setError(false);
                }}
                aria-invalid={error}
                aria-describedby={error ? errorId : undefined}
                placeholder="הכנס קוד"
                className="h-14 w-full rounded-2xl border border-white/15 bg-black/40 px-4 pe-12 text-center text-[16px] font-semibold tracking-[0.2em] text-white outline-none transition placeholder:tracking-normal placeholder:text-white/35 focus:border-red-500/70 focus:ring-4 focus:ring-red-500/25"
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? "הסתר קוד" : "הצג קוד"}
                aria-pressed={reveal}
                className="tap absolute inset-y-0 left-2 my-auto flex h-9 w-9 items-center justify-center rounded-xl text-white/55 hover:text-white"
              >
                {reveal ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-red-300"
              >
                <WarningIcon className="h-4 w-4 shrink-0" />
                קוד שגוי — אין הרשאת כניסה למערכת.
              </p>
            )}

            <button
              type="submit"
              className="tap mt-5 h-14 w-full rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-[15px] font-bold text-white shadow-[0_18px_45px_-14px_rgba(220,38,38,0.9)] outline-none focus-visible:ring-4 focus-visible:ring-red-400/40"
            >
              אימות וכניסה
            </button>
          </form>

          <p className="mt-4 text-center text-[12px] leading-relaxed text-white/45">
            הגישה מיועדת לשימוש מורשה בלבד.
          </p>
        </div>
      </div>
    </div>
  );
}
