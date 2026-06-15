"use client";

import { useAppIdentity } from "@/lib/app-identity";
import { LockIcon } from "@/components/ui/icons";

/**
 * Thin, calm strip shown under the header ONLY while a local guest session is
 * active, so guest mode is always clearly identified. Renders nothing for a real
 * authenticated user (or while the session is still resolving). No data here —
 * it just reflects identity from useAppIdentity.
 */
export function GuestModeBanner() {
  const identity = useAppIdentity();
  if (identity.kind !== "guest") return null;

  return (
    <div
      data-guest-banner
      dir="rtl"
      className="border-b border-border/70 bg-surface-2/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-md items-center justify-center gap-1.5 px-4 py-1.5 text-[11.5px] font-semibold text-muted">
        <LockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
        גישה כאורח · הנתונים נשמרים במכשיר בלבד
      </div>
    </div>
  );
}
