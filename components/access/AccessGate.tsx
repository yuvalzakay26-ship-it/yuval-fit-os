"use client";

import { useId, useState } from "react";
import { ACCESS_CODE, grantAccess, useAccessGranted } from "@/lib/access";
import { LockIcon } from "@/components/ui/icons";

/**
 * App-level access gate. Renders the app and, while access has not been granted,
 * an opaque full-screen "restricted access" overlay on top of it.
 *
 * The app shell is always mounted underneath so unlocking is instant (no remount)
 * and existing functionality / PWA / service-worker behaviour is untouched. The
 * overlay is server-rendered (fail-closed) and hidden before first paint for
 * returning users via the `.access-granted` class set by ACCESS_INIT_SCRIPT.
 */
export function AccessGate({ children }: { children: React.ReactNode }) {
  const granted = useAccessGranted();
  return (
    <>
      {children}
      {!granted && <AccessScreen />}
    </>
  );
}

function AccessScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const inputId = useId();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.trim().toLowerCase() === ACCESS_CODE) {
      grantAccess();
    } else {
      setError(true);
    }
  };

  return (
    <div
      data-access-gate
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${inputId}-title`}
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto px-6 py-10 text-white animate-fade-in"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, rgba(220,38,38,0.30) 0%, transparent 55%)," +
          "radial-gradient(100% 60% at 50% 115%, rgba(127,29,29,0.40) 0%, transparent 60%)," +
          "#0a0608",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-red-500/30 bg-red-500/10 shadow-[0_8px_40px_rgba(220,38,38,0.35)]">
          <LockIcon className="h-9 w-9 text-red-400" />
        </div>

        <h1
          id={`${inputId}-title`}
          className="text-center text-[26px] font-bold tracking-tight"
        >
          גישה מוגבלת
        </h1>
        <p className="mx-auto mt-2.5 max-w-[17rem] text-center text-[14px] leading-relaxed text-red-50/65">
          המערכת פרטית. הזן קוד גישה כדי להמשיך.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3" noValidate>
          <input
            id={inputId}
            type="password"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            aria-label="קוד גישה"
            aria-invalid={error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            placeholder="קוד גישה"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              if (error) setError(false);
            }}
            className="h-14 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-center text-[17px] font-semibold tracking-wide text-white outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-white/40 focus:border-red-400/70 focus:bg-white/[0.09] focus:ring-4 focus:ring-red-500/25"
          />

          {error && (
            <p
              id={`${inputId}-error`}
              role="alert"
              className="text-center text-[13.5px] font-semibold text-red-400"
            >
              קוד שגוי
            </p>
          )}

          <button
            type="submit"
            className="tap h-14 w-full rounded-2xl bg-red-600 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(220,38,38,0.4)] outline-none hover:bg-red-500 focus-visible:ring-4 focus-visible:ring-red-500/40"
          >
            כניסה למערכת
          </button>
        </form>

        <p className="mt-7 text-center text-[12px] tracking-wide text-white/30">
          מערכת פרטית · Yuval Fit OS
        </p>
      </div>
    </div>
  );
}
