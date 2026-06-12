"use client";

import { bestWeightPerExercise, progressSummary } from "@/lib/analytics";
import { getExerciseById } from "@/lib/seed-exercises";
import { useFoodLogs, useWorkouts } from "@/lib/fitness-store";
import { formatHebrewDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import {
  BoltIcon,
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  DumbbellIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { StatCard } from "./StatCard";

export function ProgressView() {
  const workouts = useWorkouts();
  const foodLogs = useFoodLogs();

  const summary = progressSummary(workouts, foodLogs);
  const bestWeights = bestWeightPerExercise(workouts);
  const hasData = workouts.length > 0 || foodLogs.length > 0;

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
