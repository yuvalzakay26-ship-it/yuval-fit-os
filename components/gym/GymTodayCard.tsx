"use client";

// Compact gym-attendance quick action for the Today dashboard. Idle → a quick
// "נכנסתי למכון" check-in with the last visit / weekly count; active → "אתה
// במכון" with a live timer and a "סיים שהייה" check-out. A useful quick action,
// not a screen-dominating block. The full experience lives at `/gym`.

import Link from "next/link";
import {
  finishGymVisit,
  formatDuration,
  formatTimer,
  getGymVisitStats,
  startGymVisit,
  useActiveGymVisit,
  useGymVisits,
} from "@/lib/gym-attendance";
import { Card } from "@/components/ui/Card";
import {
  DoorEnterIcon,
  DoorExitIcon,
  StopwatchIcon,
} from "@/components/ui/icons";
import { useNow } from "./useNow";

function ActiveCard({ startedAt }: { startedAt: string }) {
  const now = useNow(1000);
  const elapsed = Math.max(0, now - new Date(startedAt).getTime());
  return (
    <Card className="module-energy sheen relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-60 blur-2xl"
        style={{ background: "var(--accent-energy-soft)" }}
      />
      <div className="relative flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
          <StopwatchIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-energy)]">
            אתה במכון
          </p>
          <p className="text-[20px] font-extrabold leading-tight tabular-nums text-foreground">
            {formatTimer(elapsed)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => finishGymVisit()}
          className="tap energy-gradient flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold text-[color:var(--accent-contrast)] shadow-glow-energy"
        >
          <DoorExitIcon className="h-4 w-4" /> סיים שהייה
        </button>
      </div>
    </Card>
  );
}

export function GymTodayCard() {
  const active = useActiveGymVisit();
  const visits = useGymVisits();

  if (active) return <ActiveCard startedAt={active.startedAt} />;

  const stats = getGymVisitStats(visits);
  const subtitle =
    stats.visitsThisWeek > 0
      ? `${stats.visitsThisWeek} ביקורים השבוע`
      : stats.lastVisit
        ? `ביקור אחרון · ${formatDuration(stats.lastVisit.durationMs)} שעות`
        : "מדידת זמן שהייה במכון";

  return (
    <Card className="module-energy sheen relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-60 blur-2xl"
        style={{ background: "var(--accent-energy-soft)" }}
      />
      <div className="relative flex items-center gap-3">
        <Link
          href="/gym"
          aria-label="נוכחות במכון"
          className="tap flex min-w-0 flex-1 items-center gap-3"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
            <DoorEnterIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-energy)]">
              מכון
            </p>
            <p className="truncate text-[15px] font-bold leading-tight text-foreground">
              {subtitle}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => startGymVisit()}
          className="tap energy-gradient flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold text-[color:var(--accent-contrast)] shadow-glow-energy"
        >
          <DoorEnterIcon className="h-4 w-4" /> נכנסתי
        </button>
      </div>
    </Card>
  );
}
