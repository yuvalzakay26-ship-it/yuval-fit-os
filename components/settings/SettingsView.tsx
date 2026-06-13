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
import { Card, CardLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import {
  AutoThemeIcon,
  BookOpenIcon,
  ChevronIcon,
  DatabaseIcon,
  DropletIcon,
  LockIcon,
  MoonIcon,
  PillIcon,
  SparkIcon,
  SunIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { resetWelcome } from "@/lib/welcome";
import { resetPrivateAccess } from "@/lib/private-access";
import Link from "next/link";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
}> = [
  { value: "light", label: "בהיר", icon: SunIcon },
  { value: "dark", label: "כהה", icon: MoonIcon },
  { value: "system", label: "מערכת", icon: AutoThemeIcon },
];

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
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

  return (
    <div className="space-y-4">
      {/* Theme */}
      <Card className="space-y-3 p-4">
        <CardLabel>מצב תצוגה</CardLabel>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "tap flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-[13px] font-semibold",
                  active
                    ? "border-transparent brand-gradient text-[color:var(--accent-contrast)] shadow-glow"
                    : "border-border bg-surface-2 text-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Goals */}
      <Card className="space-y-3 p-4">
        <CardLabel>יעדים יומיים</CardLabel>
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
        <p className="text-[12px] text-faint">יחידת משקל: קילוגרם (ק&quot;ג)</p>
        <Link
          href="/nutrition"
          className="tap block text-[12.5px] font-semibold text-accent"
        >
          אפשר גם לחשב יעד חלבון מותאם לפי משקל גוף ←
        </Link>
      </Card>

      {/* Daily water goal */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]">
            <DropletIcon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <CardLabel>יעד מים יומי</CardLabel>
            <p className="text-[12px] text-muted">כמה מים תרצה לשתות ביום?</p>
          </div>
        </div>
        <div>
          <Label htmlFor="water-goal">יעד (ליטר)</Label>
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
        <p className="text-[12px] text-faint">
          אפשר לעדכן את היעד לפי ההרגשה והשגרה שלך.
        </p>
      </Card>

      {/* Knowledge center */}
      <Link href="/learn" className="tap block">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-learn-soft)] text-[color:var(--accent-learn)]">
            <BookOpenIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <CardLabel>מרכז ידע</CardLabel>
            <p className="mt-0.5 text-[13px] text-muted">
              יסודות אימון, חלבון, התקדמות והתאוששות
            </p>
          </div>
          <ChevronIcon className="h-4 w-4 shrink-0 text-faint" />
        </Card>
      </Link>

      {/* Storage status */}
      <Card className="p-4">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
            <DatabaseIcon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <CardLabel>אחסון מקומי</CardLabel>
            <p className="text-[12px] text-muted">הנתונים נשמרים במכשיר זה בלבד</p>
          </div>
        </div>
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

      {/* Reset */}
      <Card className="space-y-3 p-4">
        <CardLabel>איפוס נתונים</CardLabel>
        <p className="text-[13px] leading-relaxed text-muted">
          פעולה זו תמחק לצמיתות את כל האימונים, רשומות התזונה וההגדרות מהמכשיר.
        </p>
        {confirmingReset ? (
          <div className="flex gap-2.5">
            <Button variant="danger" onClick={handleReset} className="flex-1">
              <TrashIcon className="h-[18px] w-[18px]" /> כן, מחק הכל
            </Button>
            <Button variant="secondary" onClick={() => setConfirmingReset(false)}>
              ביטול
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmingReset(true)}>
            איפוס כל הנתונים
          </Button>
        )}
      </Card>

      {/* Saved food values — only surfaced once the user has some */}
      {savedFoodCount > 0 && (
        <Card className="space-y-3 p-4">
          <CardLabel>ערכי מאכלים שמורים</CardLabel>
          <p className="text-[13px] leading-relaxed text-muted">
            שמרת ערכים אישיים ל-{savedFoodCount} מאכלים. פעולה זו תאפס את כל
            הערכים השמורים. רשומות התזונה שלך לא יושפעו.
          </p>
          {confirmingClearFoods ? (
            <div className="flex gap-2.5">
              <Button variant="danger" onClick={handleClearFoods} className="flex-1">
                <TrashIcon className="h-[18px] w-[18px]" /> כן, אפס הכל
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmingClearFoods(false)}
              >
                ביטול
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setConfirmingClearFoods(true)}
            >
              <TrashIcon className="h-[18px] w-[18px]" /> אפס ערכי מאכלים שמורים
            </Button>
          )}
        </Card>
      )}

      {/* Favorite foods — only surfaced once the user has some */}
      {favoriteCount > 0 && (
        <Card className="space-y-3 p-4">
          <CardLabel>מאכלים מועדפים</CardLabel>
          <p className="text-[13px] leading-relaxed text-muted">
            סימנת {favoriteCount} מאכלים כמועדפים. פעולה זו תסיר את כולם. רשומות
            התזונה והערכים השמורים שלך לא יושפעו.
          </p>
          {confirmingClearFavs ? (
            <div className="flex gap-2.5">
              <Button variant="danger" onClick={handleClearFavs} className="flex-1">
                <TrashIcon className="h-[18px] w-[18px]" /> כן, אפס הכל
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmingClearFavs(false)}
              >
                ביטול
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setConfirmingClearFavs(true)}
            >
              <TrashIcon className="h-[18px] w-[18px]" /> אפס מאכלים מועדפים
            </Button>
          )}
        </Card>
      )}

      {/* Supplement data — only surfaced once the user has some */}
      {(supplements.length > 0 || supplementLogs.length > 0) && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
              <PillIcon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <CardLabel>נתוני תוספים</CardLabel>
              <p className="text-[12px] text-muted">
                {supplements.length} תוספים · {supplementLogs.length} סימוני ימים
              </p>
            </div>
          </div>

          {/* Reset the supplement list itself */}
          {supplements.length > 0 &&
            (confirmingClearSupps ? (
              <div className="flex gap-2.5">
                <Button variant="danger" onClick={handleClearSupps} className="flex-1">
                  <TrashIcon className="h-[18px] w-[18px]" /> כן, אפס תוספים
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmingClearSupps(false)}
                >
                  ביטול
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setConfirmingClearSupps(true)}
              >
                <TrashIcon className="h-[18px] w-[18px]" /> אפס תוספים
              </Button>
            ))}

          {/* Reset only the daily taken-logs, keeping the supplement list */}
          {supplementLogs.length > 0 &&
            (confirmingClearSuppLogs ? (
              <div className="flex gap-2.5">
                <Button
                  variant="danger"
                  onClick={handleClearSuppLogs}
                  className="flex-1"
                >
                  <TrashIcon className="h-[18px] w-[18px]" /> כן, אפס יומן
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmingClearSuppLogs(false)}
                >
                  ביטול
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setConfirmingClearSuppLogs(true)}
              >
                <TrashIcon className="h-[18px] w-[18px]" /> אפס יומן תוספים
              </Button>
            ))}
        </Card>
      )}

      {/* Welcome screen */}
      <Card className="space-y-3 p-4">
        <CardLabel>מסך פתיחה</CardLabel>
        <p className="text-[13px] leading-relaxed text-muted">
          הצגת מסך הפתיחה של המערכת מחדש. הנתונים שלך נשמרים ולא יימחקו.
        </p>
        <Button variant="secondary" onClick={() => resetWelcome()}>
          <SparkIcon className="h-[18px] w-[18px]" /> הצג מסך פתיחה
        </Button>
      </Card>

      {/* Private-access notice */}
      <Card className="space-y-3 p-4">
        <CardLabel>מסך גישה פרטית</CardLabel>
        <p className="text-[13px] leading-relaxed text-muted">
          הצגת הודעת הגישה הפרטית מחדש. זוהי הודעה בלבד ללא סיסמה — היא תופיע שוב
          ממילא בפתיחה הבאה של המערכת.
        </p>
        <Button variant="secondary" onClick={() => resetPrivateAccess()}>
          <LockIcon className="h-[18px] w-[18px]" /> הצג מסך גישה פרטית
        </Button>
      </Card>

      <p className="pt-1 text-center text-[12px] text-faint">
        Yuval Fit OS · גרסה 0.1
      </p>
    </div>
  );
}
