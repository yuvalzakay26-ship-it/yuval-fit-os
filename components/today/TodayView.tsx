"use client";

import Link from "next/link";
import {
  activeSupplements,
  sumNutrition,
  supplementDaySummary,
  todaysFoodLogs,
  todaysWaterMl,
  todaysWorkout,
} from "@/lib/analytics";
import {
  useFoodLogs,
  useSettings,
  useSupplementLogs,
  useSupplements,
  useWaterLogs,
  useWorkouts,
} from "@/lib/fitness-store";
import { DEFAULT_WATER_GOAL_ML } from "@/lib/fitness-types";
import { dailyOverview, type NextAction } from "@/lib/today";
import { formatHebrewDate, hebrewGreeting, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/PageHeader";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  AppleIcon,
  BookOpenIcon,
  ChartIcon,
  CheckIcon,
  ChevronIcon,
  DropletIcon,
  DumbbellIcon,
  FlameIcon,
  PillIcon,
  PlayIcon,
  PlusIcon,
  PlusWaterIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { WaterCard } from "@/components/water/WaterCard";
import { SupplementsCard } from "@/components/supplements/SupplementsCard";

/* ----------------------------- Daily copy ----------------------------- */
// Calm, motivating, non-medical. Drives the hero's headline from how many of
// the required daily actions are already complete today.

function dayHeadline(completed: number, total: number): string {
  if (completed >= total) return "כל הפעולות הושלמו היום 🎉";
  if (completed === 0) return "היום מתחיל — בחר פעולה אחת כדי להתחיל";
  if (completed === total - 1) return "כמעט שם — נשארה פעולה אחת להשלים";
  return "התחלה טובה — בוא נשמור על המומנטום";
}

/** Module gradient + glow utility per action tone. */
const TONE_TINTS = {
  strength: "strength-gradient shadow-glow-strength",
  nutrition: "nutrition-gradient shadow-glow-nutrition",
  water: "water-gradient shadow-glow-water",
  supplement: "supplement-gradient shadow-glow-supplement",
  energy: "energy-gradient shadow-glow-energy",
} as const;

/* ----------------------------- Status strip ---------------------------- */

interface HabitStat {
  key: string;
  label: string;
  value: string;
  done: boolean;
  href: string;
  icon: React.ReactNode;
  /** Feature-accent css var name, e.g. "strength" → var(--accent-strength). */
  tone: "strength" | "nutrition" | "water" | "supplement";
}

function StatusCell({ stat }: { stat: HabitStat }) {
  const color = `var(--accent-${stat.tone})`;
  const soft = `var(--accent-${stat.tone}-soft)`;
  return (
    <Link
      href={stat.href}
      aria-label={`${stat.label}: ${stat.value}`}
      className="tap flex items-center gap-2.5 rounded-2xl border border-border bg-surface-2 p-2.5"
    >
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: soft, color }}
      >
        {stat.icon}
        {stat.done && (
          <span
            className="absolute -end-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-surface-2"
            style={{ background: color }}
          >
            <CheckIcon className="h-2 w-2 text-[color:var(--accent-contrast)]" />
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-faint">{stat.label}</p>
        <p className="truncate text-[13.5px] font-bold leading-tight text-foreground">
          {stat.value}
        </p>
      </div>
    </Link>
  );
}

/* ----------------------------- Next action ----------------------------- */
// The single, most-prominent "do this next" card. Driven entirely by the
// deterministic `dailyOverview` helper — no AI, no personalization, no advice.

const NEXT_ACTION_ICON: Record<NextAction["key"], React.ReactNode> = {
  water: <DropletIcon className="h-6 w-6" />,
  nutrition: <AppleIcon className="h-6 w-6" />,
  workout: <DumbbellIcon className="h-6 w-6" />,
  supplement: <PillIcon className="h-6 w-6" />,
  progress: <ChartIcon className="h-6 w-6" />,
};

function NextActionCard({ action }: { action: NextAction }) {
  return (
    <Card variant="raised" className="sheen relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -left-12 -top-14 h-40 w-40 rounded-full opacity-50 blur-2xl"
        style={{ background: `var(--accent-${action.tone}-soft)` }}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{
              background: `var(--accent-${action.tone}-soft)`,
              color: `var(--accent-${action.tone})`,
            }}
          >
            <SparkIcon className="h-3 w-3" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
            הפעולה הבאה שלך
          </p>
          {action.optional && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-faint">
              אופציונלי
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4">
          <span
            className={`${TONE_TINTS[action.tone]} sheen flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)]`}
          >
            {NEXT_ACTION_ICON[action.key]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-extrabold leading-tight text-foreground">
              {action.title}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {action.description}
            </p>
          </div>
        </div>

        <Link href={action.href} className="tap mt-4 block">
          <div
            className={`${TONE_TINTS[action.tone]} sheen flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[15px] font-bold text-[color:var(--accent-contrast)]`}
          >
            {action.ctaLabel}
            <ChevronIcon className="h-4 w-4 rotate-180" />
          </div>
        </Link>
      </div>
    </Card>
  );
}

/* ----------------------------- Quick action ---------------------------- */

function QuickAction({
  href,
  label,
  icon,
  tint,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tint: keyof typeof TONE_TINTS;
}) {
  return (
    <Link href={href} className="tap block">
      <Card className="sheen flex h-full flex-col items-center gap-2 p-3 text-center">
        <span
          className={`${TONE_TINTS[tint]} sheen flex h-11 w-11 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)]`}
        >
          {icon}
        </span>
        <span className="text-[11.5px] font-bold leading-tight text-foreground">
          {label}
        </span>
      </Card>
    </Link>
  );
}

/* -------------------------------- View -------------------------------- */

export function TodayView() {
  const workouts = useWorkouts();
  const foodLogs = useFoodLogs();
  const settings = useSettings();
  const waterLogs = useWaterLogs();
  const supplements = useSupplements();
  const supplementLogs = useSupplementLogs();

  const today = todayISO();

  // Workout
  const workoutToday = todaysWorkout(workouts);
  const lastWorkout = workouts.find((w) => w.date !== today) ?? null;

  // Nutrition
  const todayLogs = todaysFoodLogs(foodLogs);
  const totals = sumNutrition(todayLogs);
  const mealCount = todayLogs.length;
  const proteinGoal = settings.proteinGoal ?? 0;
  const calorieGoal = settings.calorieGoal ?? 0;

  // Water
  const waterGoal = settings.waterGoalMl ?? DEFAULT_WATER_GOAL_ML;
  const waterMl = todaysWaterMl(waterLogs);
  const waterPct =
    waterGoal > 0 ? Math.min(100, Math.round((waterMl / waterGoal) * 100)) : 0;

  // Supplements
  const supp = supplementDaySummary(supplements, supplementLogs, today);
  const hasSupplements = activeSupplements(supplements).length > 0;

  // Daily completion + next action — deterministic, supplements treated as
  // optional (they never count toward the required total when not configured).
  const { completion, nextAction } = dailyOverview({
    workouts,
    foodLogs,
    waterLogs,
    supplements,
    supplementLogs,
    settings,
  });
  const completed = completion.completed;
  const total = completion.total;
  const allDone = completion.allDone;

  // Status strip — the four pillars at a glance. Supplements stay visible but
  // read as "אופציונלי" (not incomplete) when nothing is configured.
  const suppDone = hasSupplements && supp.allDone;
  const habits: HabitStat[] = [
    {
      key: "workout",
      label: "אימון",
      value: workoutToday ? "הושלם" : "טרם בוצע",
      done: !!workoutToday,
      href: "/workouts",
      icon: <DumbbellIcon className="h-[18px] w-[18px]" />,
      tone: "strength",
    },
    {
      key: "nutrition",
      label: "תזונה",
      value:
        mealCount > 0
          ? mealCount === 1
            ? "רישום אחד"
            : `${mealCount} רישומים`
          : "אין עדיין",
      done: mealCount > 0,
      href: "/nutrition",
      icon: <AppleIcon className="h-[18px] w-[18px]" />,
      tone: "nutrition",
    },
    {
      key: "water",
      label: "מים",
      value: waterMl > 0 ? `${waterPct}%` : "טרם",
      done: waterMl > 0,
      href: "/nutrition/water",
      icon: <DropletIcon className="h-[18px] w-[18px]" />,
      tone: "water",
    },
    {
      key: "supplements",
      label: "תוספים",
      value: hasSupplements ? `${supp.taken}/${supp.active}` : "אופציונלי",
      done: suppDone,
      href: "/nutrition/supplements",
      icon: <PillIcon className="h-[18px] w-[18px]" />,
      tone: "supplement",
    },
  ];

  // The hero bar reflects only the required pillars (3, or 4 when supplements
  // are configured) so an unconfigured supplement never reads as "missing".
  const barTones: Record<string, HabitStat["tone"]> = {
    water: "water",
    nutrition: "nutrition",
    workout: "strength",
    supplement: "supplement",
  };
  const barPillars = completion.pillars.filter((p) => !p.optional);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div suppressHydrationWarning>
        <p className="text-[13px] font-medium text-muted">
          {formatHebrewDate(today)}
        </p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
          {hebrewGreeting()}, יובל <span className="inline-block">👋</span>
        </h1>
      </div>

      {/* Hero — daily status summary */}
      <Card variant="raised" className="sheen relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full opacity-60 blur-2xl"
          style={{ background: "var(--accent-soft)" }}
        />
        <div className="relative flex items-center gap-5">
          <span className="relative shrink-0">
            <ProgressRing value={completed} goal={total} size={92} stroke={9}>
              <span className="text-[24px] font-extrabold leading-none text-foreground">
                {completed}
                <span className="text-[15px] font-bold text-faint">/{total}</span>
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-faint">
                הושלמו
              </span>
            </ProgressRing>
            {allDone && (
              <span
                aria-hidden="true"
                className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-full"
                style={{ background: "var(--accent-soft)" }}
              />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              התקדמות היום
            </p>
            <p className="mt-1 text-[17px] font-extrabold leading-tight text-foreground">
              {completed} מתוך {total} פעולות הושלמו
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              {dayHeadline(completed, total)}
            </p>
            {/* Segment bar — one segment per required pillar. */}
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {barPillars.map((p) => (
                <span
                  key={p.key}
                  className="h-1.5 flex-1 rounded-full transition-colors duration-500"
                  style={{
                    background: p.done
                      ? `var(--accent-${barTones[p.key]})`
                      : "var(--border-strong)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Next action — the single most important step right now */}
      <NextActionCard action={nextAction} />

      {/* Daily status strip */}
      <section>
        <SectionHeader title="מבט מהיר" accent="var(--accent)" />
        <div className="grid grid-cols-2 gap-2.5">
          {habits.map((stat) => (
            <StatusCell key={stat.key} stat={stat} />
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <SectionHeader title="פעולות מהירות" accent="var(--accent)" />
        <div className="grid grid-cols-4 gap-2.5">
          <QuickAction
            href="/workouts?new=1"
            label="התחל אימון"
            icon={<DumbbellIcon className="h-5 w-5" />}
            tint="strength"
          />
          <QuickAction
            href="/nutrition/add"
            label="הוסף אוכל"
            icon={<PlusIcon className="h-5 w-5" />}
            tint="nutrition"
          />
          <QuickAction
            href="/nutrition/water"
            label="הוסף מים"
            icon={<PlusWaterIcon className="h-5 w-5" />}
            tint="water"
          />
          <QuickAction
            href="/nutrition/supplements"
            label="סמן תוספים"
            icon={<PillIcon className="h-5 w-5" />}
            tint="supplement"
          />
        </div>
      </section>

      {/* Daily habits — water + supplements */}
      <section className="space-y-4">
        <SectionHeader title="הרגלים יומיים" accent="var(--accent-water)" />
        <WaterCard />
        <SupplementsCard />
      </section>

      {/* Daily summary — nutrition + workout */}
      <section className="space-y-4">
        <SectionHeader title="סיכום היום" accent="var(--accent-nutrition)" />

        {/* Nutrition */}
        <Card className="module-nutrition sheen relative overflow-hidden p-4">
          <div
            className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-60 blur-2xl"
            style={{ background: "var(--accent-nutrition-soft)" }}
          />
          <div className="relative flex items-center gap-4">
            <ProgressRing
              value={totals.protein}
              goal={proteinGoal}
              size={68}
              stroke={7}
              gradientId="today-nutrition-ring"
              from="var(--accent-nutrition)"
              to="var(--accent-nutrition)"
            >
              <span className="text-[15px] font-extrabold leading-none tabular-nums text-foreground">
                {Math.round(totals.protein)}
              </span>
              <span className="mt-0.5 text-[9px] font-semibold text-faint">
                {proteinGoal ? `מ-${proteinGoal}` : "חלבון"}
              </span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-nutrition)]">
                  תזונה היום
                </p>
                <Link
                  href="/nutrition"
                  aria-label="פתח תזונה"
                  className="tap -m-1 flex items-center gap-0.5 rounded-full p-1 text-[12px] font-semibold text-[color:var(--accent-nutrition)]"
                >
                  פתח
                  <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
                </Link>
              </div>
              <p className="mt-0.5 text-[15px] font-bold leading-tight text-foreground">
                {proteinGoal
                  ? totals.protein >= proteinGoal
                    ? "הגעת ליעד החלבון 🎯"
                    : `נותרו ${Math.max(0, Math.round(proteinGoal - totals.protein))} גרם חלבון`
                  : `${Math.round(totals.protein)} גרם חלבון`}
              </p>
              <div className="mt-2 flex items-center gap-4 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <FlameIcon className="h-3.5 w-3.5 text-[color:var(--accent-energy)]" />
                  {totals.calories > 0 ? Math.round(totals.calories) : "—"}
                  {calorieGoal ? ` / ${calorieGoal}` : ""} קל׳
                </span>
                <span className="inline-flex items-center gap-1">
                  <AppleIcon className="h-3.5 w-3.5" />
                  {mealCount > 0 ? `${mealCount} רישומים` : "אין רישום"}
                </span>
              </div>
            </div>
          </div>
          <div className="relative mt-3.5 grid grid-cols-2 gap-2.5">
            <Link href="/nutrition/add" className="tap block">
              <div className="nutrition-gradient sheen flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-[color:var(--accent-contrast)] shadow-glow-nutrition">
                <PlusIcon className="h-4 w-4" /> הוסף אוכל
              </div>
            </Link>
            <Link href="/nutrition/library?view=favorites" className="tap block">
              <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface-2 px-3 py-2.5 text-[13px] font-bold text-foreground">
                מועדפים
                <ChevronIcon className="h-3.5 w-3.5 rotate-180 text-faint" />
              </div>
            </Link>
          </div>
        </Card>

        {/* Workout */}
        <Card className="module-strength sheen relative overflow-hidden p-4">
          <div
            className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-60 blur-2xl"
            style={{ background: "var(--accent-strength-soft)" }}
          />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-strength-soft)] text-[color:var(--accent-strength)]">
              {workoutToday ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <DumbbellIcon className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-strength)]">
                אימון
              </p>
              {workoutToday ? (
                <>
                  <p className="truncate text-[15px] font-bold leading-tight text-foreground">
                    {workoutToday.title}
                  </p>
                  <p className="text-[12px] text-muted">הושלם היום 💪</p>
                </>
              ) : lastWorkout ? (
                <>
                  <p className="truncate text-[15px] font-bold leading-tight text-foreground">
                    {lastWorkout.title}
                  </p>
                  <p className="text-[12px] text-muted">
                    אחרון · {formatHebrewDate(lastWorkout.date)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-bold leading-tight text-foreground">
                    עוד לא תיעדת אימון
                  </p>
                  <p className="text-[12px] text-muted">הזמן להתחיל את הראשון</p>
                </>
              )}
            </div>
            <Link
              href={workoutToday ? "/workouts" : "/workouts?new=1"}
              aria-label={workoutToday ? "פתח אימונים" : "התחל אימון"}
              className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full strength-gradient text-[color:var(--accent-contrast)] shadow-glow-strength"
            >
              {workoutToday ? (
                <ChevronIcon className="h-4 w-4 rotate-180" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Link>
          </div>
        </Card>
      </section>

      {/* Secondary — learn + progress */}
      <section>
        <SectionHeader title="עוד" accent="var(--accent-learn)" />
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/learn" className="tap block">
            <Card className="module-learn sheen flex h-full flex-col gap-2.5 p-4">
              <span className="learn-gradient sheen flex h-10 w-10 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow-learn">
                <BookOpenIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[14px] font-bold text-foreground">מרכז ידע</p>
                <p className="text-[11.5px] leading-snug text-muted">
                  טיפים קצרים לאימון ולתזונה
                </p>
              </div>
            </Card>
          </Link>
          <Link href="/progress" className="tap block">
            <Card className="module-energy sheen flex h-full flex-col gap-2.5 p-4">
              <span className="energy-gradient sheen flex h-10 w-10 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow-energy">
                <ChartIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[14px] font-bold text-foreground">התקדמות</p>
                <p className="text-[11.5px] leading-snug text-muted">
                  סיכום אימונים ומגמות
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
