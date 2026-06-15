"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useBetaAdmin } from "@/lib/beta-access";
import { exitGuestSession, useGuestSession } from "@/lib/guest-session";
import {
  resetAll,
  useFoodLogs,
  useSupplements,
  useWaterLogs,
  useWorkouts,
} from "@/lib/fitness-store";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ChevronIcon,
  DoorEnterIcon,
  DoorExitIcon,
  ShieldIcon,
} from "@/components/ui/icons";

/**
 * Settings → "חשבון בטא": shows the signed-in beta identity, an admin link (only
 * for admins), and sign-out. Sign-out NEVER deletes local data silently — if any
 * personal data exists on this device the user is asked whether to keep or clear
 * it (a shared-device safeguard). Authentication identifies who may use the beta;
 * the personal data still lives only on this device (no cloud sync this phase).
 */
export function BetaAccountSection() {
  const { isAdmin, email, configured, loading } = useBetaAdmin();
  const guest = useGuestSession();
  const workouts = useWorkouts();
  const foodLogs = useFoodLogs();
  const water = useWaterLogs();
  const supplements = useSupplements();

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasLocalData =
    workouts.length > 0 ||
    foodLogs.length > 0 ||
    water.length > 0 ||
    supplements.length > 0;

  // Guest mode: a real Supabase session always wins, so only treat this as guest
  // when there is no authenticated email. Exiting drops the local guest flag,
  // which sends the user back to the sign-in screen via the gate.
  const isGuest = guest && !email;

  const doExitGuest = (clearData: boolean) => {
    setConfirming(false);
    setBusy(true);
    if (clearData) resetAll();
    exitGuestSession();
    // The gate re-renders to the sign-in screen; no manual navigation needed.
  };

  if (isGuest) {
    return (
      <GuestAccountCard
        busy={busy}
        confirming={confirming}
        onExitClick={() =>
          hasLocalData ? setConfirming(true) : doExitGuest(false)
        }
        onKeep={() => doExitGuest(false)}
        onClear={() => doExitGuest(true)}
        onCancel={() => setConfirming(false)}
      />
    );
  }

  // When Supabase isn't configured the gate is in its setup/fail-closed state;
  // there is no real session to manage here, so keep this section quiet.
  if (!configured) return null;

  const handleSignOutClick = () => {
    if (hasLocalData) {
      setConfirming(true);
    } else {
      void doSignOut(false);
    }
  };

  const doSignOut = async (clearData: boolean) => {
    setConfirming(false);
    setBusy(true);
    if (clearData) resetAll();
    await signOut();
    // The auth listener flips the gate back to the sign-in screen.
  };

  return (
    <section>
      <SectionHeader title="חשבון בטא" accent="var(--accent)" />
      <Card className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
            <ShieldIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-foreground">
              מחובר לבטא
            </p>
            {email ? (
              <p dir="ltr" className="truncate text-right text-[12.5px] text-muted">
                {email}
              </p>
            ) : (
              <p className="text-[12.5px] text-muted">
                {loading ? "טוען…" : "לא מחובר"}
              </p>
            )}
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-muted">
          הכניסה מזהה מי רשאי להשתמש בבטא. הנתונים האישיים עדיין נשמרים במכשיר הזה
          בלבד, אלא אם נוסיף סנכרון ענן בעתיד.
        </p>

        {isAdmin && (
          <Link
            href="/admin/beta"
            className="tap flex items-center justify-between rounded-2xl border border-border bg-surface-2 px-3.5 py-3 text-[13px] font-semibold text-foreground hover:bg-surface"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
                <ShieldIcon className="h-[16px] w-[16px]" />
              </span>
              ניהול בטא
            </span>
            <ChevronIcon className="h-4 w-4 rotate-180 text-faint" />
          </Link>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleSignOutClick}
          disabled={busy || !email}
        >
          <DoorExitIcon className="h-[16px] w-[16px]" /> התנתק
        </Button>
      </Card>

      <ConfirmDialog
        open={confirming}
        title="התנתקות מהבטא"
        description="הנתונים נשמרים במכשיר הזה. להתנתק בלי למחוק נתונים?"
        confirmLabel="התנתק והשאר נתונים"
        cancelLabel="ביטול"
        onConfirm={() => doSignOut(false)}
        onCancel={() => setConfirming(false)}
        extraAction={{
          label: "התנתק ונקה נתונים",
          onClick: () => doSignOut(true),
        }}
      />
    </section>
  );
}

/* ----------------------------- Guest account ---------------------------- */

/**
 * Settings card shown while a local guest session is active. It makes the guest
 * state explicit, reminds that data is device-only, and offers an exit that
 * returns to the sign-in screen. No admin link is ever shown for a guest.
 */
function GuestAccountCard({
  busy,
  confirming,
  onExitClick,
  onKeep,
  onClear,
  onCancel,
}: {
  busy: boolean;
  confirming: boolean;
  onExitClick: () => void;
  onKeep: () => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  return (
    <section>
      <SectionHeader title="חשבון" accent="var(--accent)" />
      <Card className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
            <DoorEnterIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-foreground">
              גישה כאורח
            </p>
            <p className="text-[12.5px] text-muted">
              לא מחובר לחשבון
            </p>
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-muted">
          כניסה כאורח שומרת נתונים במכשיר הזה בלבד. כדי להיכנס עם חשבון מאושר, צא
          ממצב אורח והתחבר.
        </p>

        <Button
          variant="secondary"
          size="sm"
          onClick={onExitClick}
          disabled={busy}
        >
          <DoorExitIcon className="h-[16px] w-[16px]" /> צא ממצב אורח
        </Button>
      </Card>

      <ConfirmDialog
        open={confirming}
        title="יציאה ממצב אורח"
        description="הנתונים נשמרים במכשיר הזה. לצאת בלי למחוק נתונים?"
        confirmLabel="צא והשאר נתונים"
        cancelLabel="ביטול"
        onConfirm={onKeep}
        onCancel={onCancel}
        extraAction={{ label: "צא ונקה נתונים", onClick: onClear }}
      />
    </section>
  );
}
