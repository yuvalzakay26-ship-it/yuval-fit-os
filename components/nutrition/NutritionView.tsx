"use client";

import { sumNutrition, todaysFoodLogs } from "@/lib/analytics";
import { removeFoodLog, useFoodLogs, useSettings } from "@/lib/fitness-store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import { AppleIcon, TrashIcon } from "@/components/ui/icons";
import { FoodLogForm } from "./FoodLogForm";
import { MacroSummary } from "./MacroSummary";
import { MEAL_TYPE_LABELS } from "./nutrition-labels";

export function NutritionView() {
  const logs = useFoodLogs();
  const settings = useSettings();

  const today = todaysFoodLogs(logs);
  const totals = sumNutrition(today);

  const handleDelete = (id: string) => removeFoodLog(id);

  return (
    <div className="space-y-6">
      <MacroSummary
        totals={totals}
        proteinGoal={settings.proteinGoal}
        calorieGoal={settings.calorieGoal}
      />

      <section>
        <SectionHeader title="הוספה ליומן" />
        <FoodLogForm />
      </section>

      <section>
        <SectionHeader title={`היומן של היום${today.length ? ` · ${today.length}` : ""}`} />
        {today.length === 0 ? (
          <EmptyState
            icon={<AppleIcon className="h-7 w-7" />}
            title="עדיין לא נרשם אוכל היום"
            description="הוסף פריט כדי לעקוב בעדינות אחר חלבון, פחמימות ושומן — בלי כפייתיות."
          />
        ) : (
          <div className="space-y-2.5">
            {today.map((log) => (
              <Card key={log.id} className="flex items-center gap-3 p-3.5">
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
                    <span className="font-semibold text-accent">
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
