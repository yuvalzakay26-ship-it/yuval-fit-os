"use client";

// Gym Attendance screen (`/gym`). Manual check-in / check-out, a live timer for
// the open visit, calm "forgot to check out?" handling, weekly stats and a
// saved-visit history. This tracks *being at the gym* — it never reads or writes
// workout history. Local-only, no GPS. See `docs/GYM_CHECK_IN.md`.

import { useState } from "react";
import {
  FORGOT_CHECKOUT_MS,
  deleteActiveGymVisit,
  deleteGymVisit,
  finishGymVisit,
  formatClock,
  formatDuration,
  formatTimer,
  getGymVisitStats,
  startGymVisit,
  useActiveGymVisit,
  useGymVisits,
  type GymVisit,
} from "@/lib/gym-attendance";
import { formatHebrewDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DoorEnterIcon,
  DoorExitIcon,
  StopwatchIcon,
  TrashIcon,
  WarningIcon,
} from "@/components/ui/icons";
import { useNow } from "./useNow";

/* ------------------------------- Idle card ------------------------------ */

function IdleCard({
  lastVisit,
  visitsThisWeek,
  onCheckIn,
}: {
  lastVisit: GymVisit | null;
  visitsThisWeek: number;
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
          <span className="energy-gradient sheen flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow-energy">
            <DoorEnterIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[18px] font-extrabold leading-tight text-foreground">
              מוכן להתאמן?
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {visitsThisWeek > 0
                ? `${visitsThisWeek} ביקורים השבוע`
                : lastVisit
                  ? `ביקור אחרון · ${formatHebrewDate(
                      lastVisit.startedAt.slice(0, 10),
                    )}`
                  : "סמן כניסה כדי למדוד זמן שהייה במכון"}
            </p>
          </div>
        </div>
        <Button
          className="energy-gradient mt-4 w-full shadow-glow-energy"
          onClick={onCheckIn}
        >
          <DoorEnterIcon className="h-[18px] w-[18px]" /> נכנסתי למכון
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------- Stats ---------------------------------- */

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="space-y-2 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
        {icon}
      </span>
      <div>
        <p className="text-[24px] font-extrabold leading-none tabular-nums text-foreground">
          {value}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-muted">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-faint">{hint}</p>}
      </div>
    </Card>
  );
}

/* ------------------------------ History row ----------------------------- */

function VisitRow({
  visit,
  onDelete,
}: {
  visit: GymVisit;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
        <DoorEnterIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold leading-tight text-foreground">
          {formatHebrewDate(visit.startedAt.slice(0, 10))}
        </p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          <span dir="ltr" className="tabular-nums">
            {formatClock(visit.startedAt)}–{formatClock(visit.endedAt)}
          </span>
          {" · "}
          <span className="font-semibold text-foreground">
            {formatDuration(visit.durationMs)} שעות
          </span>
        </p>
      </div>
      <button
        type="button"
        aria-label="מחק ביקור"
        onClick={() => onDelete(visit.id)}
        className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-red-500/10 hover:text-red-500"
      >
        <TrashIcon className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

/* -------------------------------- View ---------------------------------- */

export function GymView() {
  const active = useActiveGymVisit();
  const visits = useGymVisits();
  const stats = getGymVisitStats(visits);

  const [saved, setSaved] = useState<GymVisit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCheckIn = () => {
    setSaved(null);
    startGymVisit();
  };

  const handleConfirmDeleteVisit = () => {
    if (deletingId) deleteGymVisit(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="space-y-7 pb-4">
      {/* Active or idle */}
      <ActiveOrIdle
        active={active}
        lastVisit={stats.lastVisit}
        visitsThisWeek={stats.visitsThisWeek}
        onCheckIn={handleCheckIn}
        onCheckedOut={(visit) => setSaved(visit)}
      />

      {/* Check-out success feedback */}
      {saved && !active && (
        <Card className="flex items-start gap-3 border-accent/30 bg-[color:var(--accent-soft)]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-accent">
            <CheckCircleIcon className="h-[18px] w-[18px]" filled />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-foreground">השהייה נשמרה</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
              היית במכון {formatDuration(saved.durationMs)} שעות
            </p>
          </div>
          <button
            type="button"
            aria-label="סגור"
            onClick={() => setSaved(null)}
            className="tap -m-1 ms-auto rounded-full p-1 text-[12px] font-semibold text-accent"
          >
            סגור
          </button>
        </Card>
      )}

      {/* Weekly stats */}
      <section>
        <SectionHeader title="סיכום שבועי" accent="var(--accent-energy)" />
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            icon={<CalendarIcon className="h-[18px] w-[18px]" />}
            label="ביקורים השבוע"
            value={stats.visitsThisWeek}
          />
          <StatTile
            icon={<ClockIcon className="h-[18px] w-[18px]" />}
            label="זמן במכון השבוע"
            value={
              <>
                {formatDuration(stats.totalMsThisWeek)}
                <span className="text-[13px] font-semibold text-muted"> שעות</span>
              </>
            }
          />
          <StatTile
            icon={<StopwatchIcon className="h-[18px] w-[18px]" />}
            label="משך ממוצע"
            value={
              stats.averageMs != null ? (
                <>
                  {formatDuration(stats.averageMs)}
                  <span className="text-[13px] font-semibold text-muted">
                    {" "}
                    שעות
                  </span>
                </>
              ) : (
                <span className="text-[15px] leading-snug">—</span>
              )
            }
            hint={stats.averageMs == null ? "עדיין אין מספיק נתונים" : undefined}
          />
          <StatTile
            icon={<DoorEnterIcon className="h-[18px] w-[18px]" />}
            label="ביקור אחרון"
            value={
              stats.lastVisit ? (
                <span className="text-[17px]">
                  {formatHebrewDate(stats.lastVisit.startedAt.slice(0, 10))}
                </span>
              ) : (
                <span className="text-[15px] leading-snug">—</span>
              )
            }
            hint={
              stats.lastVisit
                ? `${formatDuration(stats.lastVisit.durationMs)} שעות`
                : "סמן כניסה ראשונה"
            }
          />
        </div>
      </section>

      {/* History */}
      <section>
        <SectionHeader title="ביקורים אחרונים" accent="var(--accent-energy)" />
        {visits.length === 0 ? (
          <EmptyState
            accent="var(--accent-energy)"
            accentSoft="var(--accent-energy-soft)"
            icon={<DoorEnterIcon className="h-7 w-7" />}
            title="אין ביקורים עדיין"
            description="הביקורים שלך יופיעו כאן אחרי שתסיים שהייה במכון."
          />
        ) : (
          <div className="space-y-2.5">
            {visits.map((visit) => (
              <VisitRow key={visit.id} visit={visit} onDelete={setDeletingId} />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deletingId !== null}
        title="למחוק את הביקור?"
        description="הביקור יוסר מהיסטוריית הנוכחות במכון."
        confirmLabel="מחק"
        cancelLabel="ביטול"
        tone="danger"
        onConfirm={handleConfirmDeleteVisit}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}

/**
 * Renders the active-visit card or the idle check-in card. Split out so the
 * active card (with its ticking timer) only mounts when there is a live visit,
 * and so a check-out can bubble the saved visit up for the success banner.
 */
function ActiveOrIdle({
  active,
  lastVisit,
  visitsThisWeek,
  onCheckIn,
  onCheckedOut,
}: {
  active: ReturnType<typeof useActiveGymVisit>;
  lastVisit: GymVisit | null;
  visitsThisWeek: number;
  onCheckIn: () => void;
  onCheckedOut: (visit: GymVisit) => void;
}) {
  if (active) {
    return <ActiveVisitCardWithCallback startedAt={active.startedAt} onCheckedOut={onCheckedOut} />;
  }
  return (
    <IdleCard
      lastVisit={lastVisit}
      visitsThisWeek={visitsThisWeek}
      onCheckIn={onCheckIn}
    />
  );
}

/**
 * Thin wrapper that turns the active card's finish action into a callback so the
 * parent can show the "השהייה נשמרה" banner. Keeps the timer-bearing component
 * focused on rendering.
 */
function ActiveVisitCardWithCallback({
  startedAt,
  onCheckedOut,
}: {
  startedAt: string;
  onCheckedOut: (visit: GymVisit) => void;
}) {
  const now = useNow(1000);
  const elapsed = Math.max(0, now - new Date(startedAt).getTime());
  const forgot = elapsed >= FORGOT_CHECKOUT_MS;

  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const doFinish = () => {
    const visit = finishGymVisit();
    setConfirmFinish(false);
    if (visit) onCheckedOut(visit);
  };

  return (
    <>
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
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
              <StopwatchIcon className="h-3 w-3" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              שהייה פעילה
            </p>
            <span
              aria-hidden="true"
              className="ms-0.5 inline-block h-2 w-2 animate-glow-pulse rounded-full"
              style={{ background: "var(--accent-energy)" }}
            />
          </div>

          <p className="mt-3 text-[22px] font-extrabold leading-tight text-foreground">
            אתה במכון 💪
          </p>
          <p className="mt-1 text-[13px] text-muted">
            נכנסת בשעה{" "}
            <span className="font-bold text-foreground">
              {formatClock(startedAt)}
            </span>
          </p>

          <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              משך זמן נוכחי
            </p>
            <p className="mt-1 text-[40px] font-extrabold leading-none tabular-nums tracking-tight text-foreground">
              {formatTimer(elapsed)}
            </p>
          </div>

          <Button
            className="energy-gradient mt-4 w-full shadow-glow-energy"
            onClick={() => setConfirmFinish(true)}
          >
            <DoorExitIcon className="h-[18px] w-[18px]" /> סיים שהייה במכון
          </Button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="tap mt-2.5 w-full rounded-xl py-1.5 text-center text-[12.5px] font-bold text-red-500 hover:bg-red-500/10"
          >
            מחק כניסה פתוחה
          </button>
        </div>
      </Card>

      {forgot && (
        <Card className="flex items-start gap-3 border-amber-500/30 bg-amber-500/[0.06]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <WarningIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-foreground">
              נראה שהשהייה פתוחה הרבה זמן
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              אם שכחת לצאת מהמכון, אפשר לסיים אותה עכשיו או למחוק את הכניסה.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Button size="sm" onClick={() => setConfirmFinish(true)}>
                סיים עכשיו
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirmDelete(true)}
              >
                מחק כניסה פתוחה
              </Button>
            </div>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={confirmFinish}
        title="לסיים את השהייה במכון?"
        description="השהייה תישמר בהיסטוריית הביקורים עם שעת הכניסה והיציאה."
        confirmLabel="סיים שהייה"
        cancelLabel="ביטול"
        onConfirm={doFinish}
        onCancel={() => setConfirmFinish(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="למחוק את הכניסה הפתוחה?"
        description="הפעולה תמחק את השהייה הנוכחית ולא תשמור אותה בהיסטוריה."
        confirmLabel="מחק"
        cancelLabel="ביטול"
        tone="danger"
        onConfirm={() => {
          deleteActiveGymVisit();
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
