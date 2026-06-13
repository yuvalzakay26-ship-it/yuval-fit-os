"use client";

import { useState } from "react";
import type { FoodLog, MealType } from "@/lib/fitness-types";
import { FOOD_CATEGORY_LABELS, type FoodCategory } from "@/lib/food-library";
import { addFoodLog } from "@/lib/fitness-store";
import { cn, createId, parseOptionalNumber, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { PlusIcon, XIcon } from "@/components/ui/icons";
import { MEAL_ORDER, MEAL_TYPE_LABELS } from "./nutrition-labels";
import { FoodImage } from "./FoodImage";

/** Optional values used to prefill the form from the visual food library. */
export interface FoodPrefill {
  foodName: string;
  category?: string;
  imagePath?: string;
  sourceFoodId?: string;
  quantityText?: string;
  mealType?: MealType;
}

const EMPTY = {
  foodName: "",
  quantityText: "",
  mealType: "breakfast" as MealType,
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  // Carried from the food library when a food was picked there; saved onto the
  // FoodLog so today's rows can show a thumbnail. Never holds nutrition values.
  imagePath: "",
  category: "",
  sourceFoodId: "",
};

type FormState = typeof EMPTY;

function buildInitial(prefill?: FoodPrefill | null): FormState {
  if (!prefill) return EMPTY;
  return {
    ...EMPTY,
    foodName: prefill.foodName,
    quantityText: prefill.quantityText ?? "",
    mealType: prefill.mealType ?? "breakfast",
    imagePath: prefill.imagePath ?? "",
    category: prefill.category ?? "",
    sourceFoodId: prefill.sourceFoodId ?? "",
  };
}

export function FoodLogForm({
  prefill,
  onSaved,
  onClearPrefill,
  bare = false,
}: {
  prefill?: FoodPrefill | null;
  onSaved?: () => void;
  /** Called when the user clears the picked food (or after a save). */
  onClearPrefill?: () => void;
  /** Drop the Card wrapper when the form already lives inside a sheet/panel. */
  bare?: boolean;
}) {
  // Parent remounts this form (via `key`) whenever a new food is picked, so the
  // initializer reliably reflects the latest prefill.
  const [form, setForm] = useState<FormState>(() => buildInitial(prefill));

  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const canSave = form.foodName.trim().length > 0;

  const clearLibraryLink = () => {
    update({ imagePath: "", category: "", sourceFoodId: "" });
    onClearPrefill?.();
  };

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
      ...(form.imagePath ? { imagePath: form.imagePath } : {}),
      ...(form.category ? { category: form.category } : {}),
      ...(form.sourceFoodId ? { sourceFoodId: form.sourceFoodId } : {}),
    };
    addFoodLog(log);
    setForm(EMPTY);
    onSaved?.();
    onClearPrefill?.();
  };

  const formEl = (
    <form onSubmit={handleSubmit} className="space-y-4">
        {form.imagePath && (
          <div className="flex items-center gap-3 rounded-2xl bg-[color:var(--accent-nutrition-soft)] p-2.5">
            <FoodImage
              imagePath={form.imagePath}
              alt={form.foodName}
              category={(form.category || "other") as FoodCategory}
              label={form.foodName}
              sizes="56px"
              className="h-14 w-14 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[color:var(--accent-nutrition)]">
                נבחר מהמאגר
              </p>
              <p className="truncate text-[14px] font-bold text-foreground">
                {form.foodName}
              </p>
              {form.category && FOOD_CATEGORY_LABELS[form.category as FoodCategory] && (
                <p className="truncate text-[11.5px] text-muted">
                  {FOOD_CATEGORY_LABELS[form.category as FoodCategory]}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={clearLibraryLink}
              className="tap -m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-foreground"
              aria-label="ניקוי הבחירה מהמאגר"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

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
          <PlusIcon className="h-5 w-5" /> הוסף ליומן
        </Button>
      </form>
  );

  if (bare) return formEl;
  return <Card className="p-4">{formEl}</Card>;
}
