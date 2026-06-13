"use client";

import { useState } from "react";
import { recentFoods, sumNutrition, todaysFoodLogs } from "@/lib/analytics";
import { removeFoodLog, useFoodLogs, useSettings } from "@/lib/fitness-store";
import type { FoodCategory, FoodLibraryItem } from "@/lib/food-library";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import { Sheet } from "@/components/ui/Sheet";
import { AppleIcon, DatabaseIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { FoodLogForm, type FoodPrefill } from "./FoodLogForm";
import { FoodLibrary } from "./FoodLibrary";
import { FoodImage } from "./FoodImage";
import { MacroSummary } from "./MacroSummary";
import { ProteinCalculator } from "./ProteinCalculator";
import { MEAL_TYPE_LABELS } from "./nutrition-labels";

type ActiveSheet = "none" | "picker" | "add";

export function NutritionView() {
  const logs = useFoodLogs();
  const settings = useSettings();

  const today = todaysFoodLogs(logs);
  const totals = sumNutrition(today);
  const recents = recentFoods(logs);

  // The add flow opens in a focused bottom sheet so the main page stays short.
  // `prefill` carries the picked/recent food into the form; `formNonce` forces
  // the form to remount fresh each time the sheet opens.
  const [sheet, setSheet] = useState<ActiveSheet>("none");
  const [prefill, setPrefill] = useState<FoodPrefill | null>(null);
  const [formNonce, setFormNonce] = useState(0);

  const openAdd = (next: FoodPrefill | null) => {
    setPrefill(next);
    setFormNonce((n) => n + 1);
    setSheet("add");
  };

  const handleSelectFromLibrary = (item: FoodLibraryItem) => {
    openAdd({
      foodName: item.nameHe,
      category: item.category,
      imagePath: item.imagePath,
      sourceFoodId: item.id,
      quantityText: item.defaultQuantityText,
    });
  };

  const closeSheet = () => setSheet("none");
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

      {/* 3 — Quick actions (the compact entry point into the food library) */}
      <section>
        <SectionHeader title="הוספה מהירה" />
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSheet("picker")}
            className="tap flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-right shadow-soft transition-[border-color] hover:border-border-strong"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
              <DatabaseIcon className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-foreground">בחר מהמאגר</span>
            <span className="text-[11.5px] leading-snug text-muted">
              בחר מאכל עם תמונה והוסף ליומן
            </span>
          </button>

          <button
            type="button"
            onClick={() => openAdd(null)}
            className="tap flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-right shadow-soft transition-[border-color] hover:border-border-strong"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
              <PlusIcon className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-foreground">הוסף ידנית</span>
            <span className="text-[11.5px] leading-snug text-muted">
              רשום מאכל וערכים תזונתיים בעצמך
            </span>
          </button>
        </div>

        {/* "אחרונים" — backed by real log data; shown only when it exists.
            Favorites and saved macro values are intentionally not built yet
            (see docs/NUTRITION_UX.md). */}
        {recents.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[12px] font-semibold text-muted">אחרונים</p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {recents.map((food) => (
                <button
                  key={food.sourceFoodId ?? food.foodName}
                  type="button"
                  onClick={() => openAdd(food)}
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
                </button>
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
                <Button size="sm" onClick={() => setSheet("picker")}>
                  <DatabaseIcon className="h-4 w-4" /> בחר מהמאגר
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openAdd(null)}>
                  <PlusIcon className="h-4 w-4" /> הוסף ידנית
                </Button>
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

      {/* Food library picker — opens on demand instead of filling the page. */}
      <Sheet
        open={sheet === "picker"}
        onClose={closeSheet}
        title="מאגר האוכל"
        description="בחר מאכל כדי למלא את היומן — ואז הוסף כמות וערכים תזונתיים."
      >
        <FoodLibrary onSelect={handleSelectFromLibrary} expandable={false} />
      </Sheet>

      {/* Focused add flow — selected food (or a blank manual entry). */}
      <Sheet
        open={sheet === "add"}
        onClose={closeSheet}
        title={prefill ? "הוספת מאכל ליומן" : "הוספה ידנית"}
        description="מלא כמות וערכים תזונתיים, ואז שמור ליומן."
      >
        <FoodLogForm
          key={formNonce}
          bare
          prefill={prefill}
          onSaved={closeSheet}
        />
      </Sheet>
    </div>
  );
}
