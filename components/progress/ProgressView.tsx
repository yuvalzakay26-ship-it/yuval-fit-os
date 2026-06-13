"use client";

import {
  bestWeightPerExercise,
  progressSummary,
  supplementDaySummary,
  supplementDaysLoggedThisWeek,
  todaysWaterMl,
  weeklyWaterAverageMl,
} from "@/lib/analytics";
import { getExerciseById } from "@/lib/seed-exercises";
import {
  useFoodLogs,
  useSupplementLogs,
  useSupplements,
  useWaterLogs,
  useWorkouts,
} from "@/lib/fitness-store";
import { formatHebrewDate, formatLiters, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import {
  BoltIcon,
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  DropletIcon,
  DumbbellIcon,
  PillIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { StatCard } from "./StatCard";

export function ProgressView() {
  const workouts = useWorkouts();
  const foodLogs = useFoodLogs();
  const waterLogs = useWaterLogs();
  const supplements = useSupplements();
  const supplementLogs = useSupplementLogs();

  const summary = progressSummary(workouts, foodLogs);
  const bestWeights = bestWeightPerExercise(workouts);
  const waterToday = todaysWaterMl(waterLogs);
  const waterWeekAvg = weeklyWaterAverageMl(waterLogs);
  const suppToday = supplementDaySummary(supplements, supplementLogs, todayISO());
  const suppWeekDays = supplementDaysLoggedThisWeek(supplementLogs);
  const hasData =
    workouts.length > 0 ||
    foodLogs.length > 0 ||
    waterLogs.length > 0 ||
    supplements.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={<ChartIcon className="h-7 w-7" />}
        title="אין עדיין נתונים להצגה"
        description="תעד אימונים וארוחות וההתקדמות שלך תופיע כאן — שבוע אחרי שבוע."
      />
    );
  }

  const bestEntries = [...bestWeights.entries()].sort((a, b) => b[1] - a[1]);
  const maxWeight = bestEntries[0]?.[1] ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<CalendarIcon className="h-[18px] w-[18px]" />}
          label="אימונים השבוע"
          value={summary.workoutsThisWeek}
        />
        <StatCard
          icon={<DumbbellIcon className="h-[18px] w-[18px]" />}
          label="סה״כ אימונים"
          value={summary.totalWorkouts}
        />
        <StatCard
          icon={<BoltIcon className="h-[18px] w-[18px]" />}
          label="ממוצע חלבון יומי"
          value={summary.proteinDailyAverage ?? "—"}
          hint={summary.proteinDailyAverage != null ? "גרם לכל יום מתועד" : undefined}
        />
        <StatCard
          icon={<ClockIcon className="h-[18px] w-[18px]" />}
          label="אימון אחרון"
          value={
            summary.latestWorkout ? (
              <span className="text-[17px]">
                {formatHebrewDate(summary.latestWorkout.date)}
              </span>
            ) : (
              "—"
            )
          }
          hint={summary.latestWorkout?.title}
        />
      </div>

      <section>
        <SectionHeader title="מים" />
        <div className="grid grid-cols-2 gap-3">
          <Card className="space-y-2 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]">
              <DropletIcon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                {formatLiters(waterToday)}
                <span className="text-[14px] font-semibold text-muted"> ליטר</span>
              </p>
              <p className="mt-1.5 text-[12px] font-medium text-muted">מים היום</p>
            </div>
          </Card>
          <Card className="space-y-2 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]">
              <DropletIcon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                {waterWeekAvg != null ? formatLiters(waterWeekAvg) : "—"}
                {waterWeekAvg != null && (
                  <span className="text-[14px] font-semibold text-muted"> ליטר</span>
                )}
              </p>
              <p className="mt-1.5 text-[12px] font-medium text-muted">
                ממוצע מים השבוע
              </p>
            </div>
          </Card>
        </div>
      </section>

      {supplements.length > 0 && (
        <section>
          <SectionHeader title="תוספים" />
          <div className="grid grid-cols-2 gap-3">
            <Card className="space-y-2 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
                <PillIcon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                  {suppToday.taken}
                  <span className="text-[14px] font-semibold text-muted">
                    /{suppToday.active}
                  </span>
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-muted">
                  תוספים היום
                </p>
              </div>
            </Card>
            <Card className="space-y-2 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
                <PillIcon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                  {suppWeekDays}
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-muted">
                  ימים עם תיעוד השבוע
                </p>
              </div>
            </Card>
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="שיא משקל לפי תרגיל" />
        {bestEntries.length === 0 ? (
          <EmptyState
            icon={<TrophyIcon className="h-7 w-7" />}
            title="אין עדיין נתוני משקל"
            description="תעד סטים עם משקל כדי לראות שיאים אישיים."
          />
        ) : (
          <Card className="space-y-3.5 p-4">
            {bestEntries.map(([exerciseId, weight], i) => {
              const exercise = getExerciseById(exerciseId);
              const pct = maxWeight > 0 ? Math.round((weight / maxWeight) * 100) : 0;
              return (
                <div key={exerciseId} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {i === 0 && (
                        <TrophyIcon className="h-4 w-4 text-[color:var(--accent-energy)]" />
                      )}
                      <span className="text-[14px] font-semibold text-foreground">
                        {exercise?.nameHe ?? exerciseId}
                      </span>
                    </div>
                    <span className="text-[14px] font-extrabold tabular-nums text-[color:var(--accent-energy)]">
                      {weight} ק&quot;ג
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="energy-gradient h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
