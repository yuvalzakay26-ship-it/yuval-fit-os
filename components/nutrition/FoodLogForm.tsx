"use client";

import { useState } from "react";
import type { FoodLog, MealType } from "@/lib/fitness-types";
import { addFoodLog } from "@/lib/fitness-store";
import { cn, createId, parseOptionalNumber, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { PlusIcon } from "@/components/ui/icons";
import { MEAL_ORDER, MEAL_TYPE_LABELS } from "./nutrition-labels";

const EMPTY = {
  foodName: "",
  quantityText: "",
  mealType: "breakfast" as MealType,
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};

export function FoodLogForm({ onSaved }: { onSaved?: () => void }) {
  const [form, setForm] = useState(EMPTY);

  const update = (patch: Partial<typeof EMPTY>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const canSave = form.foodName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const log: FoodLog = {
      id: createId("food"),
      date: todayISO(),
      mealType: form.mealType,
      foodName: form.foodName.trim(),
      quantityText: form.quantityText.trim(),
      calories: parseOptionalNumber(form.calories),
      protein: parseOptionalNumber(form.protein) ?? 0,
      carbs: parseOptionalNumber(form.carbs) ?? 0,
      fat: parseOptionalNumber(form.fat) ?? 0,
    };
    addFoodLog(log);
    setForm(EMPTY);
    onSaved?.();
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="food-name">מה אכלת?</Label>
          <Input
            id="food-name"
            value={form.foodName}
            onChange={(e) => update({ foodName: e.target.value })}
            placeholder="לדוגמה: חזה עוף בגריל"
          />
        </div>

        {/* Meal type as friendly segmented chips */}
        <div>
          <Label>ארוחה</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_ORDER.map((meal) => (
              <button
                key={meal}
                type="button"
                onClick={() => update({ mealType: meal })}
                className={cn(
                  "tap rounded-xl px-1 py-2 text-[12px] font-semibold",
                  form.mealType === meal
                    ? "nutrition-gradient text-[color:var(--accent-contrast)] shadow-glow-nutrition"
                    : "border border-border bg-surface-2 text-muted",
                )}
              >
                {MEAL_TYPE_LABELS[meal]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="quantity">כמות</Label>
          <Input
            id="quantity"
            value={form.quantityText}
            onChange={(e) => update({ quantityText: e.target.value })}
            placeholder="200 גרם / מנה"
          />
        </div>

        <div>
          <Label>ערכים תזונתיים</Label>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { key: "protein", label: "חלבון" },
                { key: "carbs", label: "פחמימות" },
                { key: "fat", label: "שומן" },
                { key: "calories", label: "קלוריות" },
              ] as const
            ).map((f) => (
              <div key={f.key}>
                <Input
                  id={f.key}
                  type="number"
                  inputMode={f.key === "calories" ? "numeric" : "decimal"}
                  min={0}
                  placeholder="0"
                  className="px-1 text-center text-[15px] font-semibold"
                  value={form[f.key]}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                />
                <p className="mt-1 text-center text-[10.5px] font-medium text-faint">
                  {f.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={!canSave} size="lg" className="w-full">
          <PlusIcon className="h-5 w-5" /> הוספה ליומן
        </Button>
      </form>
    </Card>
  );
}
