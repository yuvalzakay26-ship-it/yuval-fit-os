"use client";

import {
  progressSummary,
  supplementDaySummary,
  supplementDaysLoggedThisWeek,
  todaysWaterMl,
  weeklyWaterAverageMl,
} from "@/lib/analytics";
import {
  personalRecords,
  weeklyActivity,
  weeklyHero,
  weeklyInsights,
  type ActivityDay,
  type ActivityRow,
  type InsightCard,
  type InsightIcon,
  type InsightTone,
} from "@/lib/progress-insights";
import { getExerciseById, MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";
import {
  formatDuration,
  getGymVisitStats,
  useGymVisits,
} from "@/lib/gym-attendance";
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
  AppleIcon,
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  DoorEnterIcon,
  DropletIcon,
  DumbbellIcon,
  FlameIcon,
  PillIcon,
  SparkIcon,
  StopwatchIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { StatCard } from "./StatCard";

/* ----------------------------- Tone helpers ---------------------------- */
// Map an insight tone to its CSS accent variables + gradient/glow utilities so
// the Progress screen keeps the same module-coloured identity as the rest of
// the app (presentational only — no data is derived here).

const TONE_ACCENT: Record<InsightTone, { accent: string; soft: string }> = {
  strength: { accent: "var(--accent-strength)", soft: "var(--accent-strength-soft)" },
  water: { accent: "var(--accent-water)", soft: "var(--accent-water-soft)" },
  nutrition: { accent: "var(--accent-nutrition)", soft: "var(--accent-nutrition-soft)" },
  energy: { accent: "var(--accent-energy)", soft: "var(--accent-energy-soft)" },
};

const INSIGHT_ICON: Record<InsightIcon, React.ReactNode> = {
  workout: <DumbbellIcon className="h-[18px] w-[18px]" />,
  water: <DropletIcon className="h-[18px] w-[18px]" />,
  nutrition: <AppleIcon className="h-[18px] w-[18px]" />,
  trophy: <TrophyIcon className="h-[18px] w-[18px]" />,
  calendar: <CalendarIcon className="h-[18px] w-[18px]" />,
  spark: <SparkIcon className="h-[18px] w-[18px]" />,
  flame: <FlameIcon className="h-[18px] w-[18px]" />,
};

/* ------------------------------- Pieces -------------------------------- */

function HeroMetric({
  value,
  unit,
  label,
  tone,
}: {
  value: React.ReactNode;
  unit?: string;
  label: string;
  tone: InsightTone;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-3">
      <p className="text-[22px] font-extrabold leading-none tabular-nums text-foreground">
        {value}
        {unit && <span className="text-[12px] font-semibold text-muted"> {unit}</span>}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: TONE_ACCENT[tone].accent }}
        />
        {label}
      </p>
    </div>
  );
}

function InsightRow({ card }: { card: InsightCard }) {
  const { accent, soft } = TONE_ACCENT[card.tone];
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: soft, color: accent }}
      >
        {INSIGHT_ICON[card.icon]}
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold leading-tight text-foreground">
          {card.title}
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{card.text}</p>
      </div>
    </div>
  );
}

function TrendDay({ day, accent }: { day: ActivityDay; accent: string }) {
  const base = "h-8 w-full rounded-lg border transition-colors duration-300";
  const tone =
    day.state === "done"
      ? base
      : day.state === "future"
        ? `${base} border-dashed border-border bg-surface/40`
        : `${base} border-border bg-surface-2`;
  // "Done" paints the accent fill; today gets a soft accent outline so the
  // current day reads clearly without relying on Tailwind ring utilities.
  const style: React.CSSProperties = {};
  if (day.state === "done") {
    style.background = accent;
    style.borderColor = accent;
  }
  if (day.isToday) {
    style.boxShadow = `0 0 0 2px var(--surface), 0 0 0 3.5px ${accent}`;
  }
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className={tone} style={style} aria-hidden="true" />
      <span
        className={
          day.isToday
            ? "text-[10px] font-bold text-foreground"
            : "text-[10px] font-medium text-faint"
        }
      >
        {day.label}
      </span>
    </div>
  );
}

function TrendRow({ row }: { row: ActivityRow }) {
  const { accent, soft } = TONE_ACCENT[row.tone];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: soft, color: accent }}
          >
            {INSIGHT_ICON[row.icon]}
          </span>
          <span className="text-[13px] font-bold text-foreground">{row.label}</span>
        </span>
        <span className="text-[12px] font-semibold tabular-nums text-muted">
          {row.count}/7 ימים
        </span>
      </div>
      <div className="flex gap-1.5">
        {row.days.map((day) => (
          <TrendDay key={day.iso} day={day} accent={accent} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- View -------------------------------- */

export function ProgressView() {
  const workouts = useWorkouts();
  const foodLogs = useFoodLogs();
  const waterLogs = useWaterLogs();
  const supplements = useSupplements();
  const supplementLogs = useSupplementLogs();
  const gymVisits = useGymVisits();

  const gymStats = getGymVisitStats(gymVisits);
  const summary = progressSummary(workouts, foodLogs);
  const hero = weeklyHero(workouts, foodLogs, waterLogs);
  const insights = weeklyInsights({ workouts, foodLogs, waterLogs });
  const trends = weeklyActivity(workouts, foodLogs, waterLogs);
  const records = personalRecords(workouts);
  const waterToday = todaysWaterMl(waterLogs);
  const waterWeekAvg = weeklyWaterAverageMl(waterLogs);
  const suppToday = supplementDaySummary(supplements, supplementLogs, todayISO());
  const suppWeekDays = supplementDaysLoggedThisWeek(supplementLogs);
  const hasData =
    workouts.length > 0 ||
    foodLogs.length > 0 ||
    waterLogs.length > 0 ||
    supplements.length > 0 ||
    gymVisits.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        accent="var(--accent-energy)"
        accentSoft="var(--accent-energy-soft)"
        icon={<ChartIcon className="h-7 w-7" />}
        title="אין עדיין נתונים להצגה"
        description="תעד אימונים וארוחות וההתקדמות שלך תופיע כאן — שבוע אחרי שבוע."
      />
    );
  }

  const maxRecord = records[0]?.topWeightKg ?? 0;

  return (
    <div className="space-y-6">
      {/* Weekly hero — the premium "what happened this week" summary. */}
      <Card variant="raised" className="sheen relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -left-12 -top-14 h-40 w-40 rounded-full opacity-50 blur-2xl"
          style={{ background: "var(--accent-energy-soft)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
              <SparkIcon className="h-3 w-3" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              השבוע שלך
            </p>
          </div>
          <p className="mt-3 text-[15px] font-semibold leading-relaxed text-foreground">
            {hero.message}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <HeroMetric
              value={hero.workoutsThisWeek}
              label="אימונים"
              tone="strength"
            />
            <HeroMetric
              value={waterToday > 0 ? formatLiters(waterToday) : "0"}
              unit="ליטר"
              label="מים היום"
              tone="water"
            />
            <HeroMetric
              value={
                hero.proteinDailyAverage != null ? (
                  hero.proteinDailyAverage
                ) : (
                  <span className="text-[13px] font-bold text-muted">אין נתונים</span>
                )
              }
              unit={hero.proteinDailyAverage != null ? "ג׳" : undefined}
              label="ממוצע חלבון"
              tone="nutrition"
            />
          </div>
        </div>
      </Card>

      {/* Key stats — with human empty states instead of cold dashes. */}
      <section>
        <SectionHeader title="נתונים עיקריים" accent="var(--accent-energy)" />
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
            icon={<FlameIcon className="h-[18px] w-[18px]" />}
            label="ממוצע חלבון יומי"
            value={
              summary.proteinDailyAverage != null ? (
                summary.proteinDailyAverage
              ) : (
                <span className="text-[15px] leading-snug">אין מספיק נתונים</span>
              )
            }
            hint={
              summary.proteinDailyAverage != null
                ? "גרם לכל יום מתועד"
                : "הוסף עוד יומיים של תזונה כדי לראות ממוצע"
            }
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
                <span className="text-[15px] leading-snug">עדיין אין אימונים</span>
              )
            }
            hint={
              summary.latestWorkout?.title ??
              "התחל אימון ראשון כדי לבנות רצף"
            }
          />
        </div>
      </section>

      {/* Weekly insights — simple rule-based reflections. */}
      {insights.length > 0 && (
        <section>
          <SectionHeader title="תובנות השבוע" accent="var(--accent-energy)" />
          <div className="space-y-2.5">
            {insights.map((card) => (
              <InsightRow key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {/* Weekly trends — compact 7-day activity grid per pillar. */}
      <section>
        <SectionHeader title="מגמות שבועיות" accent="var(--accent-strength)" />
        <Card className="space-y-4 p-4">
          {trends.map((row) => (
            <TrendRow key={row.key} row={row} />
          ))}
        </Card>
      </section>

      {/* Water + supplements — kept from the existing stats screen. */}
      <section>
        <SectionHeader title="מים" accent="var(--accent-water)" />
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
            {waterWeekAvg != null ? (
              <div>
                <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                  {formatLiters(waterWeekAvg)}
                  <span className="text-[14px] font-semibold text-muted"> ליטר</span>
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-muted">
                  ממוצע מים השבוע
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[14px] font-bold leading-snug text-foreground">
                  אין מספיק נתוני מים השבוע
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  רשום שתייה לאורך השבוע כדי לראות מגמה
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {supplements.length > 0 && (
        <section>
          <SectionHeader title="תוספים" accent="var(--accent-supplement)" />
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

      {/* Gym attendance — visits + time at the gym (separate from workouts). */}
      {gymVisits.length > 0 && (
        <section>
          <SectionHeader title="נוכחות במכון" accent="var(--accent-energy)" />
          <div className="grid grid-cols-2 gap-3">
            <Card className="space-y-2 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
                <DoorEnterIcon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                  {gymStats.visitsThisWeek}
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-muted">
                  ביקורים השבוע
                </p>
              </div>
            </Card>
            <Card className="space-y-2 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
                <StopwatchIcon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                  {formatDuration(gymStats.totalMsThisWeek)}
                  <span className="text-[14px] font-semibold text-muted"> שעות</span>
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-muted">
                  זמן במכון השבוע
                </p>
              </div>
            </Card>
            <Card className="space-y-2 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
                <ClockIcon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                  {gymStats.averageMs != null
                    ? formatDuration(gymStats.averageMs)
                    : "—"}
                  {gymStats.averageMs != null && (
                    <span className="text-[14px] font-semibold text-muted"> שעות</span>
                  )}
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-muted">
                  משך ממוצע
                </p>
              </div>
            </Card>
            <Card className="space-y-2 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]">
                <CalendarIcon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[17px] font-extrabold leading-tight text-foreground">
                  {gymStats.lastVisit
                    ? formatHebrewDate(gymStats.lastVisit.startedAt.slice(0, 10))
                    : "—"}
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-muted">
                  ביקור אחרון
                </p>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Personal records — premium top weights by exercise. */}
      <section>
        <SectionHeader title="שיאים אישיים" accent="var(--accent-energy)" />
        {records.length === 0 ? (
          <EmptyState
            accent="var(--accent-energy)"
            accentSoft="var(--accent-energy-soft)"
            icon={<TrophyIcon className="h-7 w-7" />}
            title="עדיין אין שיאים"
            description="השיאים יופיעו כאן אחרי שתשמור אימונים עם ק״ג וחזרות."
          />
        ) : (
          <Card className="space-y-3.5 p-4">
            {records.map((record, i) => {
              const exercise = getExerciseById(record.exerciseId);
              const pct =
                maxRecord > 0
                  ? Math.round((record.topWeightKg / maxRecord) * 100)
                  : 0;
              return (
                <div key={record.exerciseId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={
                          i === 0
                            ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent-energy-soft)] text-[color:var(--accent-energy)]"
                            : "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-faint"
                        }
                      >
                        {i === 0 ? (
                          <TrophyIcon className="h-4 w-4" />
                        ) : (
                          <span className="text-[12px] font-bold tabular-nums">
                            {i + 1}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-foreground">
                          {exercise?.nameHe ?? record.exerciseId}
                        </p>
                        {exercise && (
                          <p className="text-[11px] text-faint">
                            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                            {record.reps > 0 ? ` · ${record.reps} חזרות` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-[color:var(--accent-energy)]">
                      {record.topWeightKg} ק&quot;ג
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
