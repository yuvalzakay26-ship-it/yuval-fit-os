"use client";

// Prominent gym-attendance card for the Today dashboard. This is a *primary
// routine* card, not a small secondary action:
//   • Active visit → a strong live state: "אתה במכון עכשיו", entry time and a
//     live HH:MM:SS stay timer, with a "סיים שהייה במכון" check-out.
//   • Idle, no visit today → a clear "נכנסתי למכון" entry action with context
//     (last visit duration / weekly count).
//   • Idle, a visit already completed today → same card, but check-in first asks
//     for confirmation (the same-day re-entry guard) before opening another visit.
// The full experience still lives at `/gym`. Local-only, no GPS.

import { useState } from "react";
import Link from "next/link";
import {
  finishGymVisit,
  formatClock,
  formatDuration,
  formatTimer,
  getGymVisitStats,
  hasCompletedVisitToday,
  startGymVisit,
  useActiveGymVisit,
  useGymVisits,
} from "@/lib/gym-attendance";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ChevronIcon,
  DoorEnterIcon,
  DoorExitIcon,
  StopwatchIcon,
} from "@/components/ui/icons";
import { useNow } from "./useNow";

/* --------------------------------- Active -------------------------------- */

function ActiveCard({ startedAt }: { startedAt: string }) {
  const now = useNow(1000);
  const elapsed = Math.max(0, now - new Date(startedAt).getTime());

  return (
    <Card
      variant="raised"
      className="module-energy sheen relative overflow-hidden p-5"
    >
      <div
        className="pointer-events-none absolute -left-12 -top-14 h-40 w-40 rounded-full opacity-50 blur-2xl"
        style={{ background: "var(--accent-energy-soft)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="energy-gradient sheen flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[color:var(--accent-contrast)] shadow-glow-energy">
            <StopwatchIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-energy)]">
              אתה במכון עכשיו
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 animate-glow-pulse rounded-full"
                style={{ background: "var(--accent-energy)" }}
              />
            </p>
            <p className="text-[12.5px] text-muted">
              נכנסת בשעה{" "}
              <span dir="ltr" className="font-bold tabular-nums text-foreground">
                {formatClock(startedAt)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-3.5 text-center">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">
            משך שהייה
          </p>
          <p className="mt-1 text-[34px] font-extrabold leading-none tabular-nums tracking-tight text-foreground">
            {formatTimer(elapsed)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => finishGymVisit()}
          className="tap energy-gradient mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow-energy"
        >
          <DoorExitIcon className="h-[18px] w-[18px]" /> סיים שהייה במכון
        </button>
      </div>
    </Card>
  );
}

/* ---------------------------------- Idle --------------------------------- */

function IdleCard({
  subtitle,
  context,
  visitedToday,
  onCheckIn,
}: {
  subtitle: string;
  context: string;
  /** A visit was already completed today — show "view" as primary, not check-in. */
  visitedToday: boolean;
  onCheckIn: () => void;
}) {
  return (
    <Card
      variant="raised"
      className="module-energy sheen relative overflow-hidden p-5"
    >
      <div
        className="pointer-events-none absolute -left-12 -top-14 h-40 w-40 rounded-full opacity-50 blur-2xl"
        style={{ background: "var(--accent-energy-soft)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <Link
            href="/gym"
            aria-label="נוכחות במכון"
            className="energy-gradient sheen flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow-energy"
          >
            <DoorEnterIcon className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[16.5px] font-extrabold leading-tight text-foreground">
              {subtitle}
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted">{context}</p>
          </div>
          <Link
            href="/gym"
            aria-label="פתח נוכחות במכון"
            className="tap -m-1 shrink-0 rounded-full p-1 text-faint"
          >
            <ChevronIcon className="h-5 w-5 rotate-180" />
          </Link>
        </div>

        {/* When a visit is already saved today the primary action must NOT read
            like starting a duplicate visit. Promote "view today's visit" instead,
            and keep a quiet "checked in again" path (still guarded by the same-day
            re-entry confirmation in the parent). Logic is unchanged. */}
        {visitedToday ? (
          <>
            <Link
              href="/gym"
              className="tap energy-gradient mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow-energy"
            >
              <ChevronIcon className="h-[18px] w-[18px] rotate-180" /> צפה בביקור היום
            </Link>
            <button
              type="button"
              onClick={onCheckIn}
              className="tap mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-muted"
            >
              <DoorEnterIcon className="h-4 w-4" /> נכנסתי שוב למכון
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onCheckIn}
            className="tap energy-gradient mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[15px] font-bold text-[color:var(--accent-contrast)] shadow-glow-energy"
          >
            <DoorEnterIcon className="h-[18px] w-[18px]" /> נכנסתי למכון
          </button>
        )}
      </div>
    </Card>
  );
}

/* --------------------------------- View ---------------------------------- */

export function GymTodayCard() {
  const active = useActiveGymVisit();
  const visits = useGymVisits();
  const [confirmReentry, setConfirmReentry] = useState(false);

  // Active-visit guard: while a visit is open there is never a check-in path —
  // only the live state with a check-out.
  if (active) return <ActiveCard startedAt={active.startedAt} />;

  const stats = getGymVisitStats(visits);
  const visitedToday = hasCompletedVisitToday(visits);

  const subtitle = visitedToday
    ? "כבר נשמר ביקור במכון היום"
    : "עדיין לא נכנסת למכון היום";
  const context =
    stats.visitsThisWeek > 0
      ? `${stats.visitsThisWeek} ביקורים השבוע`
      : stats.lastVisit
        ? `ביקור אחרון · ${formatDuration(stats.lastVisit.durationMs)} שעות`
        : "מדידת זמן שהייה במכון";

  // Same-day re-entry guard: a fresh visit today is fine, but only after a calm
  // confirmation so a stray tap can't pile up duplicate visits.
  const handleCheckIn = () => {
    if (visitedToday) {
      setConfirmReentry(true);
    } else {
      startGymVisit();
    }
  };

  return (
    <>
      <IdleCard
        subtitle={subtitle}
        context={context}
        visitedToday={visitedToday}
        onCheckIn={handleCheckIn}
      />
      <ConfirmDialog
        open={confirmReentry}
        title="כבר נשמר ביקור במכון היום"
        description="נראה שכבר נכנסת ויצאת מהמכון היום. האם אתה רוצה להתחיל ביקור נוסף?"
        confirmLabel="כן, התחל ביקור נוסף"
        cancelLabel="ביטול"
        onConfirm={() => {
          startGymVisit();
          setConfirmReentry(false);
        }}
        onCancel={() => setConfirmReentry(false)}
      />
    </>
  );
}
