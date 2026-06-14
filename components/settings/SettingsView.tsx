"use client";

import { useState } from "react";
import { DEFAULT_WATER_GOAL_ML, type ThemePreference } from "@/lib/fitness-types";
import {
  clearAllFavoriteFoods,
  clearAllFoodValues,
  clearAllSupplementLogs,
  clearAllSupplements,
  resetAll,
  updateSettings,
  useFavoriteFoods,
  useFoodLogs,
  useSavedFoodValues,
  useSettings,
  useSupplementLogs,
  useSupplements,
  useWorkouts,
} from "@/lib/fitness-store";
import { cn, formatLiters, parseOptionalNumber } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import {
  CheckCircleIcon,
  ChevronIcon,
  DatabaseIcon,
  DropletIcon,
  LockIcon,
  MoonIcon,
  PencilIcon,
  PillIcon,
  ShieldIcon,
  SparkIcon,
  SunIcon,
  SettingsIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { resetWelcome } from "@/lib/welcome";
import { resetPrivateAccess } from "@/lib/private-access";
import { resetAdminAccess } from "@/lib/admin-access";
import Link from "next/link";

type IconCmp = (p: { className?: string }) => React.ReactElement;

/**
 * The two — and only two — appearance modes. The previous "system" option was
 * removed in Phase 3.xx so the user has full, predictable control. Each option
 * shows a theme-independent mini preview (literal colours, not CSS variables) so
 * the swatch always reflects the mode it represents, not the current theme.
 */
const APPEARANCE_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  hint: string;
  icon: IconCmp;
  preview: { bg: string; border: string; line: string; icon: string };
}> = [
  {
    value: "light",
    label: "בהיר",
    hint: "רקע בהיר ונקי",
    icon: SunIcon,
    preview: { bg: "#ffffff", border: "#e6e9ef", line: "#dfe3ea", icon: "#e8902a" },
  },
  {
    value: "dark",
    label: "כהה",
    hint: "רקע כהה ונוח לעיניים",
    icon: MoonIcon,
    preview: { bg: "#0f141b", border: "#2a3543", line: "#283442", icon: "#9fb0c4" },
  },
];

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

/** A small, calm status pill for the hero strip. */
function StatusChip({ icon: Icon, label }: { icon: IconCmp; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11.5px] font-semibold text-muted">
      <Icon className="h-3.5 w-3.5 text-accent" />
      {label}
    </span>
  );
}

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const settings = useSettings();
  const workouts = useWorkouts();
  const foodLogs = useFoodLogs();
  const savedFoodValues = useSavedFoodValues();
  const savedFoodCount = Object.keys(savedFoodValues).length;
  const favoriteFoods = useFavoriteFoods();
  const favoriteCount = Object.keys(favoriteFoods).length;
  const supplements = useSupplements();
  const supplementLogs = useSupplementLogs();
  const waterGoalMl = settings.waterGoalMl ?? DEFAULT_WATER_GOAL_ML;
  const [waterLitersInput, setWaterLitersInput] = useState(
    formatLiters(waterGoalMl),
  );
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingClearFoods, setConfirmingClearFoods] = useState(false);
  const [confirmingClearFavs, setConfirmingClearFavs] = useState(false);
  const [confirmingClearSupps, setConfirmingClearSupps] = useState(false);
  const [confirmingClearSuppLogs, setConfirmingClearSuppLogs] = useState(false);

  const approxKb =
    ((JSON.stringify(workouts).length +
      JSON.stringify(foodLogs).length +
      JSON.stringify(settings).length) *
      2) /
    1024;

  const updateGoal = (patch: Partial<typeof settings>) => {
    updateSettings({ ...settings, ...patch });
  };

  const handleWaterGoalChange = (raw: string) => {
    setWaterLitersInput(raw);
    const liters = parseOptionalNumber(raw);
    if (liters !== undefined && liters > 0) {
      updateGoal({ waterGoalMl: Math.round(liters * 1000) });
    }
  };

  const handleReset = () => {
    resetAll();
    setConfirmingReset(false);
  };

  const handleClearFoods = () => {
    clearAllFoodValues();
    setConfirmingClearFoods(false);
  };

  const handleClearFavs = () => {
    clearAllFavoriteFoods();
    setConfirmingClearFavs(false);
  };

  const handleClearSupps = () => {
    clearAllSupplements();
    setConfirmingClearSupps(false);
  };

  const handleClearSuppLogs = () => {
    clearAllSupplementLogs();
    setConfirmingClearSuppLogs(false);
  };

  const hasScopedData =
    savedFoodCount > 0 ||
    favoriteCount > 0 ||
    supplements.length > 0 ||
    supplementLogs.length > 0;

  return (
    <div className="space-y-8 pb-4">
      {/* ---------------------------- Hero strip ---------------------------- */}
      <Card variant="raised" className="sheen space-y-3">
        <div className="flex items-center gap-3">
          <span className="brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow">
            <SettingsIcon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-foreground">
              מרכז הבקרה שלך
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
              העדפות, יעדים וניהול הנתונים — הכול במקום אחד.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip icon={DatabaseIcon} label="שמירה מקומית" />
          <StatusChip icon={LockIcon} label="גישה פרטית" />
          <StatusChip icon={ShieldIcon} label="ללא שרת" />
        </div>
      </Card>

      {/* --------------------------- Appearance ----------------------------- */}
      <section>
        <SectionHeader title="מצב תצוגה" accent="var(--accent)" />
        <Card className="space-y-3">
          <p className="text-[12.5px] leading-relaxed text-muted">
            בחר את מראה האפליקציה. אתה בשליטה מלאה — בהיר או כהה, ללא מצב אוטומטי.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {APPEARANCE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "tap relative flex flex-col rounded-2xl border p-3 text-right",
                    active
                      ? "border-accent bg-[color:var(--accent-soft)] ring-2 ring-[color:var(--accent-soft)]"
                      : "border-border bg-surface-2 hover:bg-surface",
                  )}
                >
                  {active && (
                    <span className="absolute left-2.5 top-2.5 text-accent">
                      <CheckCircleIcon className="h-5 w-5" filled />
                    </span>
                  )}
                  <span
                    className="mb-3 flex h-[60px] w-full items-center gap-2.5 rounded-xl border px-3"
                    style={{
                      background: option.preview.bg,
                      borderColor: option.preview.border,
                    }}
                  >
                    <span style={{ color: option.preview.icon }}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="flex-1 space-y-1.5">
                      <span
                        className="block h-1.5 w-full rounded-full"
                        style={{ background: option.preview.line }}
                      />
                      <span
                        className="block h-1.5 w-2/3 rounded-full"
                        style={{ background: option.preview.line }}
                      />
                    </span>
                  </span>
                  <span className="text-[14px] font-bold text-foreground">
                    {option.label}
                  </span>
                  <span className="mt-0.5 text-[11.5px] text-muted">
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </section>

      {/* ------------------------- Daily goals ------------------------------ */}
      <section>
        <SectionHeader title="יעדים יומיים" accent="var(--accent-nutrition)" />
        <Card className="space-y-3.5">
          <p className="text-[12.5px] leading-relaxed text-muted">
            היעדים עוזרים לדף היום ולמעקב התזונה לחשב את ההתקדמות שלך.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="protein-goal">יעד חלבון (ג)</Label>
              <Input
                id="protein-goal"
                type="number"
                inputMode="numeric"
                min={0}
                className="text-center font-semibold"
                value={settings.proteinGoal ?? ""}
                onChange={(e) =>
                  updateGoal({ proteinGoal: parseOptionalNumber(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="calorie-goal">יעד קלוריות</Label>
              <Input
                id="calorie-goal"
                type="number"
                inputMode="numeric"
                min={0}
                className="text-center font-semibold"
                value={settings.calorieGoal ?? ""}
                onChange={(e) =>
                  updateGoal({ calorieGoal: parseOptionalNumber(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="water-goal">יעד מים יומי (ליטר)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="water-goal"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                className="text-center font-semibold"
                value={waterLitersInput}
                onChange={(e) => handleWaterGoalChange(e.target.value)}
              />
              <span className="shrink-0 text-[13px] font-semibold text-muted">
                ≈ {waterGoalMl} {`מ"ל`}
              </span>
            </div>
          </div>
          <p className="text-[12px] text-faint">יחידת משקל: קילוגרם (ק&quot;ג)</p>
          <Link
            href="/nutrition"
            className="tap block text-[12.5px] font-semibold text-accent"
          >
            אפשר גם לחשב יעד חלבון מותאם לפי משקל גוף ←
          </Link>
        </Card>
      </section>

      {/* ------------------------ Water shortcuts --------------------------- */}
      <section>
        <SectionHeader title="קיצורי מים" accent="var(--accent-water)" />
        <Card className="module-water sheen space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]">
              <DropletIcon className="h-[18px] w-[18px]" />
            </span>
            <p className="text-[12.5px] leading-relaxed text-muted">
              ערוך את הכוסות והבקבוקים שאתה משתמש בהם ביום־יום.
            </p>
          </div>
          <Link
            href="/nutrition/water/presets"
            className="tap flex items-center justify-between rounded-2xl border border-border bg-surface-2 px-3.5 py-3 text-[13px] font-semibold text-foreground hover:bg-surface"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]">
                <PencilIcon className="h-[16px] w-[16px]" />
              </span>
              ערוך קיצורי מים
            </span>
            <ChevronIcon className="h-4 w-4 rotate-180 text-faint" />
          </Link>
        </Card>
      </section>

      {/* ------------------------ Data & storage ---------------------------- */}
      <section>
        <SectionHeader title="נתונים ואחסון" accent="var(--muted)" />
        <Card>
          <div className="mb-1 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
              <DatabaseIcon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-[13.5px] font-bold text-foreground">אחסון מקומי</p>
              <p className="text-[12px] text-muted">פעיל במכשיר זה</p>
            </div>
          </div>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">
            המידע שלך נשמר מקומית במכשיר הזה. אין שרת, אין חשבון, ואין סנכרון ענן.
          </p>
          <div className="mt-2 divide-y divide-border">
            <StatusRow
              label="סטטוס"
              value={<span className="text-accent">פעיל</span>}
            />
            <StatusRow label="אימונים שמורים" value={workouts.length} />
            <StatusRow label="רשומות תזונה" value={foodLogs.length} />
            <StatusRow label="נפח מוערך" value={`${approxKb.toFixed(1)} KB`} />
          </div>
        </Card>

        {/* Backup & restore — opens the dedicated /backup screen. */}
        <Link
          href="/backup"
          className="tap mt-2.5 block"
          aria-label="גיבוי ושחזור — ייצא או שחזר את נתוני Fit OS מהמכשיר הזה"
        >
          <Card className="flex items-center gap-3.5 hover:bg-surface-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
              <DatabaseIcon className="h-[22px] w-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-foreground">גיבוי ושחזור</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                ייצא או שחזר את נתוני Fit OS מהמכשיר הזה
              </p>
            </div>
            <ChevronIcon className="h-4 w-4 shrink-0 rotate-180 text-faint" />
          </Card>
        </Link>
      </section>

      {/* ------------------------ Access & privacy -------------------------- */}
      <section>
        <SectionHeader title="גישה ופרטיות" accent="var(--muted)" />
        <Card className="space-y-3">
          <p className="text-[12.5px] leading-relaxed text-muted">
            מסכי הגישה מיועדים להזכיר שהמערכת פרטית ושמורה לשימוש מורשה בלבד.
            הנתונים נשמרים במכשיר זה בלבד.
          </p>
          <div className="space-y-2.5">
            <div className="rounded-2xl border border-border bg-surface-2 p-3.5">
              <p className="text-[13.5px] font-bold text-foreground">מסך פתיחה</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                הצגת מסך הפתיחה של המערכת מחדש. הנתונים שלך נשמרים ולא יימחקו.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2.5"
                onClick={() => resetWelcome()}
              >
                <SparkIcon className="h-[16px] w-[16px]" /> הצג מסך פתיחה
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-3.5">
              <p className="text-[13.5px] font-bold text-foreground">
                מסך גישה פרטית
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                הצגת הודעת הגישה הפרטית מחדש. זוהי הודעה בלבד ללא סיסמה — היא תופיע
                שוב ממילא בפתיחה הבאה של המערכת.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2.5"
                onClick={() => resetPrivateAccess()}
              >
                <LockIcon className="h-[16px] w-[16px]" /> הצג מסך גישה פרטית
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ------------------------ Sensitive actions ------------------------- */}
      <section>
        <SectionHeader title="פעולות רגישות" accent="#ef4444" />
        <Card className="space-y-4 border-red-500/30 bg-red-500/[0.04]">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <TrashIcon className="h-[18px] w-[18px]" />
            </span>
            <p className="text-[12.5px] leading-relaxed text-muted">
              הפעולות כאן הן בלתי הפיכות או משנות גישה. הן מופרדות בכוונה משאר
              ההגדרות — קרא היטב לפני שתמשיך.
            </p>
          </div>

          {/* Reset ALL data — the most destructive action. */}
          <div className="rounded-2xl border border-red-500/25 bg-surface p-3.5">
            <p className="text-[13.5px] font-bold text-foreground">איפוס כל הנתונים</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
              פעולה זו תמחק לצמיתות את כל האימונים, רשומות התזונה, המים, התוספים
              וההגדרות מהמכשיר. לא ניתן לשחזר.
            </p>
            {confirmingReset ? (
              <div className="mt-3 flex gap-2.5">
                <Button variant="danger" onClick={handleReset} className="flex-1">
                  <TrashIcon className="h-[18px] w-[18px]" /> כן, מחק הכל
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmingReset(false)}
                >
                  ביטול
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                className="mt-3"
                onClick={() => setConfirmingReset(true)}
              >
                איפוס כל הנתונים
              </Button>
            )}
          </div>

          {/* Lock the system — clears the admin access-code grant, data preserved. */}
          <div className="rounded-2xl border border-red-500/25 bg-surface p-3.5">
            <p className="text-[13.5px] font-bold text-foreground">נעילת מערכת</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
              נעילת המערכת תדרוש קוד גישה מחדש בכניסה הבאה. זהו קוד גישה בצד הלקוח
              בלבד, לא אימות שרת. הנתונים שלך נשמרים ולא יימחקו.
            </p>
            <Button
              variant="danger"
              className="mt-3"
              onClick={() => resetAdminAccess()}
            >
              <LockIcon className="h-[18px] w-[18px]" /> נעל מערכת
            </Button>
          </div>

          {/* Scoped resets — only surfaced once the user actually has such data. */}
          {hasScopedData && (
            <div className="space-y-2.5">
              {savedFoodCount > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-3.5">
                  <p className="text-[13px] font-bold text-foreground">
                    ערכי מאכלים שמורים
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                    שמרת ערכים אישיים ל-{savedFoodCount} מאכלים. פעולה זו תאפס את
                    כל הערכים השמורים. רשומות התזונה שלך לא יושפעו.
                  </p>
                  {confirmingClearFoods ? (
                    <div className="mt-2.5 flex gap-2.5">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleClearFoods}
                        className="flex-1"
                      >
                        <TrashIcon className="h-[16px] w-[16px]" /> כן, אפס הכל
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmingClearFoods(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2.5"
                      onClick={() => setConfirmingClearFoods(true)}
                    >
                      <TrashIcon className="h-[16px] w-[16px]" /> אפס ערכי מאכלים
                    </Button>
                  )}
                </div>
              )}

              {favoriteCount > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-3.5">
                  <p className="text-[13px] font-bold text-foreground">
                    מאכלים מועדפים
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                    סימנת {favoriteCount} מאכלים כמועדפים. פעולה זו תסיר את כולם.
                    רשומות התזונה והערכים השמורים שלך לא יושפעו.
                  </p>
                  {confirmingClearFavs ? (
                    <div className="mt-2.5 flex gap-2.5">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleClearFavs}
                        className="flex-1"
                      >
                        <TrashIcon className="h-[16px] w-[16px]" /> כן, אפס הכל
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmingClearFavs(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2.5"
                      onClick={() => setConfirmingClearFavs(true)}
                    >
                      <TrashIcon className="h-[16px] w-[16px]" /> אפס מועדפים
                    </Button>
                  )}
                </div>
              )}

              {(supplements.length > 0 || supplementLogs.length > 0) && (
                <div className="rounded-2xl border border-border bg-surface p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
                      <PillIcon className="h-[16px] w-[16px]" />
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-foreground">
                        נתוני תוספים
                      </p>
                      <p className="text-[12px] text-muted">
                        {supplements.length} תוספים · {supplementLogs.length} סימוני
                        ימים
                      </p>
                    </div>
                  </div>

                  {supplements.length > 0 &&
                    (confirmingClearSupps ? (
                      <div className="mt-2.5 flex gap-2.5">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleClearSupps}
                          className="flex-1"
                        >
                          <TrashIcon className="h-[16px] w-[16px]" /> כן, אפס תוספים
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmingClearSupps(false)}
                        >
                          ביטול
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2.5"
                        onClick={() => setConfirmingClearSupps(true)}
                      >
                        <TrashIcon className="h-[16px] w-[16px]" /> אפס תוספים
                      </Button>
                    ))}

                  {supplementLogs.length > 0 &&
                    (confirmingClearSuppLogs ? (
                      <div className="mt-2.5 flex gap-2.5">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleClearSuppLogs}
                          className="flex-1"
                        >
                          <TrashIcon className="h-[16px] w-[16px]" /> כן, אפס יומן
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmingClearSuppLogs(false)}
                        >
                          ביטול
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2.5"
                        onClick={() => setConfirmingClearSuppLogs(true)}
                      >
                        <TrashIcon className="h-[16px] w-[16px]" /> אפס יומן תוספים
                      </Button>
                    ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* --------------------------- System info ---------------------------- */}
      <section>
        <SectionHeader title="מידע מערכת" accent="var(--muted)" />
        <Card>
          <div className="divide-y divide-border">
            <StatusRow label="שם המערכת" value="Yuval Fit OS" />
            <StatusRow label="גרסה" value="0.1" />
            <StatusRow label="אחסון" value="מקומי (ללא שרת)" />
            <StatusRow label="התקנה" value="אפליקציית PWA" />
          </div>
          <p className="mt-3 text-center text-[12px] text-faint">
            המערכת האישית שלך · נשמרת במכשיר זה בלבד
          </p>
        </Card>
      </section>
    </div>
  );
}
