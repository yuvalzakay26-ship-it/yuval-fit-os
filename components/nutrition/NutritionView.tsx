"use client";

import { useRef, useState } from "react";
import { sumNutrition, todaysFoodLogs } from "@/lib/analytics";
import { removeFoodLog, useFoodLogs, useSettings } from "@/lib/fitness-store";
import type { FoodCategory, FoodLibraryItem } from "@/lib/food-library";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import { AppleIcon, TrashIcon } from "@/components/ui/icons";
import { FoodLogForm, type FoodPrefill } from "./FoodLogForm";
import { FoodLibrary } from "./FoodLibrary";
import { FoodImage } from "./FoodImage";
import { MacroSummary } from "./MacroSummary";
import { ProteinCalculator } from "./ProteinCalculator";
import { MEAL_TYPE_LABELS } from "./nutrition-labels";

export function NutritionView() {
  const logs = useFoodLogs();
  const settings = useSettings();

  const today = todaysFoodLogs(logs);
  const totals = sumNutrition(today);

  // The picked library food drives both the form prefill and the library
  // highlight. `prefillNonce` only changes when a *new* food is picked, so
  // remounting the form (to apply the prefill) never wipes in-progress manual
  // edits made after clearing or saving.
  const [selected, setSelected] = useState<FoodLibraryItem | null>(null);
  const [prefillNonce, setPrefillNonce] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const handleSelect = (item: FoodLibraryItem) => {
    setSelected(item);
    setPrefillNonce((n) => n + 1);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const prefill: FoodPrefill | null = selected
    ? {
        foodName: selected.nameHe,
        category: selected.category,
        imagePath: selected.imagePath,
        sourceFoodId: selected.id,
        quantityText: selected.defaultQuantityText,
      }
    : null;

  const handleDelete = (id: string) => removeFoodLog(id);

  return (
    <div className="space-y-6">
      <MacroSummary
        totals={totals}
        proteinGoal={settings.proteinGoal}
        calorieGoal={settings.calorieGoal}
      />

      <section>
        <SectionHeader title="יעד חלבון מותאם" />
        <ProteinCalculator defaultOpen={false} showArticleLink />
      </section>

      <section>
        <SectionHeader title="מאגר אוכל" />
        <Card variant="flat" className="p-3.5">
          <p className="mb-3 text-[12.5px] leading-relaxed text-muted">
            בחר מאכל כדי למלא את היומן אוטומטית בשם — ואז הוסף כמות וערכים תזונתיים.
          </p>
          <FoodLibrary onSelect={handleSelect} selectedId={selected?.id} />
        </Card>
      </section>

      <section ref={formRef} className="scroll-mt-4">
        <SectionHeader title="הוספה ליומן" />
        <FoodLogForm
          key={prefillNonce}
          prefill={prefill}
          onClearPrefill={() => setSelected(null)}
        />
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
