"use client";

import Link from "next/link";
import { recentFoods, sumNutrition, todaysFoodLogs } from "@/lib/analytics";
import { removeFoodLog, useFoodLogs, useSettings } from "@/lib/fitness-store";
import type { FoodCategory } from "@/lib/food-library";
import type { RecentFood } from "@/lib/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import { AppleIcon, DatabaseIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { FoodImage } from "./FoodImage";
import { MacroSummary } from "./MacroSummary";
import { ProteinCalculator } from "./ProteinCalculator";
import { MEAL_TYPE_LABELS } from "./nutrition-labels";

/** Deep-link into the add-food flow for a previously logged food. */
function recentHref(food: RecentFood): string {
  if (food.sourceFoodId) {
    return `/nutrition/add?foodId=${encodeURIComponent(food.sourceFoodId)}`;
  }
  return `/nutrition/add?name=${encodeURIComponent(food.foodName)}`;
}

export function NutritionView() {
  const logs = useFoodLogs();
  const settings = useSettings();

  const today = todaysFoodLogs(logs);
  const totals = sumNutrition(today);
  const recents = recentFoods(logs);

  const handleDelete = (id: string) => removeFoodLog(id);

  return (
    <div className="space-y-6">
      {/* 1 — Today's nutrition summary */}
      <MacroSummary
        totals={totals}
        proteinGoal={settings.proteinGoal}
        calorieGoal={settings.calorieGoal}
      />

      {/* 2 — Protein goal */}
      <section>
        <SectionHeader title="יעד חלבון מותאם" />
        <ProteinCalculator defaultOpen={false} showArticleLink />
      </section>

      {/* 3 — Quick actions (entry points into the full-screen flows) */}
      <section>
        <SectionHeader title="הוספה מהירה" />
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/nutrition/library"
            className="tap flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-right shadow-soft transition-[border-color] hover:border-border-strong"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
              <DatabaseIcon className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-foreground">בחר מהמאגר</span>
            <span className="text-[11.5px] leading-snug text-muted">
              בחר מאכל עם תמונה והוסף ליומן
            </span>
          </Link>

          <Link
            href="/nutrition/add"
            className="tap flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-right shadow-soft transition-[border-color] hover:border-border-strong"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
              <PlusIcon className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-foreground">הוסף ידנית</span>
            <span className="text-[11.5px] leading-snug text-muted">
              רשום מאכל וערכים תזונתיים בעצמך
            </span>
          </Link>
        </div>

        {/* "אחרונים" — backed by real log data; shown only when it exists.
            Favorites and saved macro values are intentionally not built yet
            (see docs/NUTRITION_UX.md). */}
        {recents.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[12px] font-semibold text-muted">אחרונים</p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {recents.map((food) => (
                <Link
                  key={food.sourceFoodId ?? food.foodName}
                  href={recentHref(food)}
                  className="tap flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface py-1.5 pe-3 ps-1.5 text-[12.5px] font-semibold text-foreground hover:border-border-strong"
                >
                  <FoodImage
                    imagePath={food.imagePath}
                    alt={food.foodName}
                    category={(food.category || "other") as FoodCategory}
                    label={food.foodName}
                    sizes="28px"
                    className="h-7 w-7 shrink-0 rounded-full"
                  />
                  <span className="max-w-[8rem] truncate">{food.foodName}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4 — Today's diary */}
      <section>
        <SectionHeader title={`היומן של היום${today.length ? ` · ${today.length}` : ""}`} />
        {today.length === 0 ? (
          <EmptyState
            icon={<AppleIcon className="h-7 w-7" />}
            title="עדיין לא נרשם אוכל היום"
            description="בחר מאכל מהמאגר או הוסף ידנית כדי להתחיל לעקוב."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link href="/nutrition/library">
                  <Button size="sm">
                    <DatabaseIcon className="h-4 w-4" /> בחר מהמאגר
                  </Button>
                </Link>
                <Link href="/nutrition/add">
                  <Button size="sm" variant="secondary">
                    <PlusIcon className="h-4 w-4" /> הוסף ידנית
                  </Button>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {today.map((log) => (
              <Card key={log.id} className="flex items-center gap-3 p-3.5">
                {log.imagePath && (
                  <FoodImage
                    imagePath={log.imagePath}
                    alt={log.foodName}
                    category={(log.category || "other") as FoodCategory}
                    label={log.foodName}
                    sizes="44px"
                    className="h-11 w-11 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-bold text-foreground">
                      {log.foodName}
                    </p>
                    <Badge tone="muted">{MEAL_TYPE_LABELS[log.mealType]}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">
                    {log.quantityText && (
                      <span className="text-faint">{log.quantityText} · </span>
                    )}
                    <span className="font-semibold text-[color:var(--accent-nutrition)]">
                      {Math.round(log.protein)}ג
                    </span>{" "}
                    חלבון · {Math.round(log.carbs)}ג פחמ׳ · {Math.round(log.fat)}ג שומן
                    {log.calories ? ` · ${Math.round(log.calories)} קל׳` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="tap -m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-red-500"
                  aria-label="מחיקת פריט"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
