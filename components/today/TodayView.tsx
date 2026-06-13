"use client";

import { sumNutrition, todaysFoodLogs, todaysWorkout } from "@/lib/analytics";
import { useFoodLogs, useSettings, useWorkouts } from "@/lib/fitness-store";
import { formatHebrewDate, hebrewGreeting, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/PageHeader";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  BookOpenIcon,
  CheckIcon,
  ChevronIcon,
  DumbbellIcon,
  FlameIcon,
  ListIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { WaterCard } from "@/components/water/WaterCard";
import { SupplementsCard } from "@/components/supplements/SupplementsCard";
import Link from "next/link";

function MiniStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-faint">{label}</p>
        <p className="truncate text-[15px] font-bold leading-tight text-foreground">
          {value}
        </p>
        {sub && <p className="truncate text-[11px] text-muted">{sub}</p>}
      </div>
    </div>
  );
}

/* Per-feature tint for quick actions: workouts = strength blue,
   nutrition = fresh green, browsing = brand teal. Identical in dark mode. */
const QUICK_ACTION_TINTS = {
  brand: "brand-gradient shadow-glow",
  strength: "strength-gradient shadow-glow-strength",
  nutrition: "nutrition-gradient shadow-glow-nutrition",
} as const;

function QuickAction({
  href,
  label,
  icon,
  tint = "brand",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tint?: keyof typeof QUICK_ACTION_TINTS;
}) {
  return (
    <Link href={href} className="tap block">
      <Card className="sheen flex h-full flex-col gap-3 p-3.5">
        <span
          className={`${QUICK_ACTION_TINTS[tint]} sheen flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--accent-contrast)]`}
        >
          {icon}
        </span>
        <span className="text-[12.5px] font-bold leading-tight text-foreground">
          {label}
        </span>
      </Card>
    </Link>
  );
}

export function TodayView() {
  const workouts = useWorkouts();
  const foodLogs = useFoodLogs();
  const settings = useSettings();

  const today = todayISO();
  const workoutToday = todaysWorkout(workouts);
  const totals = sumNutrition(todaysFoodLogs(foodLogs));
  const lastWorkout = workouts.find((w) => w.date !== today) ?? null;
  const proteinGoal = settings.proteinGoal ?? 0;

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div suppressHydrationWarning>
        <p className="text-[13px] font-medium text-muted">{formatHebrewDate(today)}</p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
          {hebrewGreeting()}, יובל{" "}
          <span className="inline-block">👋</span>
        </h1>
      </div>

      {/* Hero snapshot */}
      <Card variant="raised" className="sheen relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full opacity-60 blur-2xl"
          style={{ background: "var(--accent-soft)" }}
        />
        <div className="relative flex items-center gap-5">
          <ProgressRing value={totals.protein} goal={proteinGoal} size={92} stroke={9}>
            <span className="text-[22px] font-extrabold leading-none text-foreground">
              {Math.round(totals.protein)}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-faint">
              {proteinGoal ? `מתוך ${proteinGoal}` : "גרם"}
            </span>
          </ProgressRing>

          <div className="min-w-0 flex-1 space-y-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                חלבון היום
              </p>
              <p className="text-[13px] text-muted">
                {proteinGoal
                  ? totals.protein >= proteinGoal
                    ? "הגעת ליעד! 🎯"
                    : `נותרו ${Math.max(0, Math.round(proteinGoal - totals.protein))} גרם`
                  : "מעקב חלבון"}
              </p>
            </div>
            <div className="h-px bg-border" />
            <div className="grid grid-cols-1 gap-3">
              <MiniStat
                icon={
                  workoutToday ? (
                    <CheckIcon className="h-[18px] w-[18px]" />
                  ) : (
                    <DumbbellIcon className="h-[18px] w-[18px]" />
                  )
                }
                label="אימון היום"
                value={workoutToday ? "הושלם" : "טרם בוצע"}
                sub={workoutToday?.title}
              />
              <MiniStat
                icon={<FlameIcon className="h-[18px] w-[18px]" />}
                label="קלוריות היום"
                value={totals.calories > 0 ? Math.round(totals.calories) : "—"}
                sub={settings.calorieGoal ? `יעד ${settings.calorieGoal}` : undefined}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <section>
        <SectionHeader title="פעולות מהירות" accent="var(--accent)" />
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            href="/workouts?new=1"
            label="התחל אימון"
            icon={<DumbbellIcon className="h-5 w-5" />}
            tint="strength"
          />
          <QuickAction
            href="/nutrition"
            label="הוסף אוכל"
            icon={<PlusIcon className="h-5 w-5" />}
            tint="nutrition"
          />
          <QuickAction
            href="/exercises"
            label="עיון בתרגילים"
            icon={<ListIcon className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* Hydration */}
      <section>
        <SectionHeader title="הידרציה" accent="var(--accent-water)" />
        <WaterCard />
      </section>

      {/* Supplements */}
      <section>
        <SectionHeader title="תוספים" accent="var(--accent-supplement)" />
        <SupplementsCard />
      </section>

      {/* Knowledge center */}
      <section>
        <SectionHeader title="ללמוד ולהתחזק" accent="var(--accent-learn)" />
        <Link href="/learn" className="tap block">
          <Card className="sheen relative flex items-center gap-3 overflow-hidden">
            <div
              className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl"
              style={{ background: "var(--accent-learn-soft)" }}
            />
            <span className="learn-gradient relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow-learn">
              <BookOpenIcon className="h-5 w-5" />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="text-[15px] font-bold text-foreground">מרכז ידע</p>
              <p className="text-[12px] text-muted">
                טיפים קצרים על אימון, חלבון, התקדמות והתאוששות
              </p>
            </div>
            <ChevronIcon className="relative h-4 w-4 shrink-0 text-faint" />
          </Card>
        </Link>
      </section>

      {/* Last workout */}
      <section>
        <SectionHeader title="אימון אחרון" accent="var(--accent-strength)" />
        {lastWorkout ? (
          <Link href="/workouts" className="tap block">
            <Card className="sheen flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-strength-soft)] text-[color:var(--accent-strength)]">
                <DumbbellIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-foreground">
                  {lastWorkout.title}
                </p>
                <p className="text-[12px] text-muted">
                  {formatHebrewDate(lastWorkout.date)}
                </p>
              </div>
              <ChevronIcon className="h-4 w-4 shrink-0 text-faint" />
            </Card>
          </Link>
        ) : (
          <Card className="text-center text-[13px] text-muted">
            עדיין אין אימונים קודמים — הזמן להתחיל 💪
          </Card>
        )}
      </section>
    </div>
  );
}
