"use client";

import { useEffect, useRef, useState } from "react";
import type { FoodLog, MealType } from "@/lib/fitness-types";
import { FOOD_CATEGORY_LABELS, type FoodCategory } from "@/lib/food-library";
import {
  addFoodLog,
  removeFoodValue,
  saveFoodValue,
  toggleFavoriteFood,
  useFavoriteFoods,
  useSavedFoodValues,
} from "@/lib/fitness-store";
import { cn, createId, parseOptionalNumber, todayISO } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import {
  BookmarkIcon,
  CheckIcon,
  FlameIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  XIcon,
} from "@/components/ui/icons";
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
  // When checked, the entered quantity + macros are remembered as this user's
  // personal default for the selected library food (keyed by sourceFoodId).
  saveValues: false,
};

type FormState = typeof EMPTY;

/** Quick, tappable quantity examples — set the free-text field in one tap. */
const QUANTITY_PRESETS = ["100 גרם", "מנה", "כוס", "פרוסה", "יחידה"];

/** The three macros rendered as a unit-labelled row (calories sits apart). */
const MACROS = [
  { key: "protein", label: "חלבון" },
  { key: "carbs", label: "פחמימות" },
  { key: "fat", label: "שומן" },
] as const;

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
}: {
  prefill?: FoodPrefill | null;
  onSaved?: () => void;
  /** Called when the user clears the picked food (or after a save). */
  onClearPrefill?: () => void;
}) {
  // Parent remounts this form (via `key`) whenever a new food is picked, so the
  // initializer reliably reflects the latest prefill.
  const [form, setForm] = useState<FormState>(() => buildInitial(prefill));

  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const canSave = form.foodName.trim().length > 0;

  // Personal saved defaults for the currently-selected library food (if any).
  // localStorage hydrates after first paint, so the macros are filled in via the
  // effect below rather than the (already-run) state initializer.
  const savedValues = useSavedFoodValues();
  const sourceFoodId = form.sourceFoodId;
  const saved = sourceFoodId ? savedValues[sourceFoodId] : undefined;

  const favorites = useFavoriteFoods();
  const isFavorite = sourceFoodId ? Boolean(favorites[sourceFoodId]) : false;

  // Prefill quantity + macros from the saved values exactly once, the moment
  // they become available. The ref guard keeps later edits (and a reset) from
  // being clobbered by a re-run.
  const savedAppliedRef = useRef(false);
  useEffect(() => {
    if (savedAppliedRef.current || !saved) return;
    savedAppliedRef.current = true;
    setForm((prev) => ({
      ...prev,
      quantityText: saved.quantity,
      protein: String(saved.protein),
      carbs: String(saved.carbs),
      fat: String(saved.fat),
      calories: String(saved.calories),
      // Re-saving a remembered food keeps it remembered by default.
      saveValues: true,
    }));
  }, [saved]);

  const clearLibraryLink = () => {
    update({ imagePath: "", category: "", sourceFoodId: "", saveValues: false });
    onClearPrefill?.();
  };

  // Forget this food's personal defaults. Form fields are left as-is so the user
  // doesn't lose what they were editing.
  const handleResetSaved = () => {
    if (!sourceFoodId) return;
    removeFoodValue(sourceFoodId);
    update({ saveValues: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const foodName = form.foodName.trim();
    const quantityText = form.quantityText.trim();
    const protein = parseOptionalNumber(form.protein) ?? 0;
    const carbs = parseOptionalNumber(form.carbs) ?? 0;
    const fat = parseOptionalNumber(form.fat) ?? 0;
    const calories = parseOptionalNumber(form.calories);

    const log: FoodLog = {
      id: createId("food"),
      date: todayISO(),
      mealType: form.mealType,
      foodName,
      quantityText,
      calories,
      protein,
      carbs,
      fat,
      ...(form.imagePath ? { imagePath: form.imagePath } : {}),
      ...(form.category ? { category: form.category } : {}),
      ...(form.sourceFoodId ? { sourceFoodId: form.sourceFoodId } : {}),
    };
    addFoodLog(log);

    // Remember these values as the user's personal default for this food. Only
    // for library foods (we have a stable sourceFoodId) and only when opted in.
    if (form.sourceFoodId && form.saveValues) {
      saveFoodValue({
        sourceFoodId: form.sourceFoodId,
        foodName,
        ...(form.imagePath ? { imagePath: form.imagePath } : {}),
        ...(form.category ? { category: form.category } : {}),
        quantity: quantityText,
        protein,
        carbs,
        fat,
        calories: calories ?? 0,
        updatedAt: new Date().toISOString(),
      });
    }

    setForm(EMPTY);
    onSaved?.();
    onClearPrefill?.();
  };

  const fromLibrary = Boolean(form.imagePath || sourceFoodId);
  const categoryLabel =
    form.category && FOOD_CATEGORY_LABELS[form.category as FoodCategory];

  // What to tell the user about the macro fields, depending on context.
  let nutritionHint: string;
  if (saved) {
    nutritionHint = "הערכים נטענו מהפעם הקודמת. אפשר לערוך אותם בכל רגע.";
  } else if (sourceFoodId) {
    nutritionHint =
      "אין עדיין ערכים שמורים למאכל הזה — הזן אותם פעם אחת ושמור לפעם הבאה.";
  } else {
    nutritionHint = "הזן את הערכים התזונתיים של הכמות שאכלת (לא חובה).";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* ── Selected food context ──────────────────────────────────────── */}
      {fromLibrary && form.imagePath && (
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--accent-nutrition-soft)] bg-[color:var(--accent-nutrition-soft)] p-3">
          <div className="flex items-center gap-3">
            <FoodImage
              imagePath={form.imagePath}
              alt={form.foodName}
              category={(form.category || "other") as FoodCategory}
              label={form.foodName}
              sizes="64px"
              className="h-16 w-16 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[color:var(--accent-nutrition)]">
                <CheckIcon className="h-3 w-3" />
                נבחר מהמאגר
                {isFavorite && (
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    <StarIcon filled className="h-3 w-3" />
                    מועדף
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate text-[15px] font-extrabold text-foreground">
                {form.foodName}
              </p>
              {categoryLabel && (
                <p className="truncate text-[12px] text-muted">{categoryLabel}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {sourceFoodId && (
                <button
                  type="button"
                  onClick={() => toggleFavoriteFood(sourceFoodId)}
                  className="tap flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface-2"
                  aria-label={isFavorite ? "הסר מהמועדפים" : "הוסף למועדפים"}
                  aria-pressed={isFavorite}
                >
                  <StarIcon
                    filled={isFavorite}
                    className={cn(
                      "h-[19px] w-[19px]",
                      isFavorite && "text-amber-400",
                    )}
                  />
                </button>
              )}
              <button
                type="button"
                onClick={clearLibraryLink}
                className="tap flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-foreground"
                aria-label="ניקוי הבחירה מהמאגר"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1 · Basics: name, meal, quantity ──────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-soft">
        <div>
          <Label htmlFor="food-name">מה אכלת?</Label>
          <Input
            id="food-name"
            value={form.foodName}
            onChange={(e) => update({ foodName: e.target.value })}
            placeholder="לדוגמה: חזה עוף בגריל"
          />
        </div>

        <div>
          <Label>לאיזו ארוחה?</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_ORDER.map((meal) => (
              <button
                key={meal}
                type="button"
                onClick={() => update({ mealType: meal })}
                aria-pressed={form.mealType === meal}
                className={cn(
                  "tap rounded-xl px-1 py-2 text-[12px] font-semibold transition-colors",
                  form.mealType === meal
                    ? "nutrition-gradient text-[color:var(--accent-contrast)] shadow-glow-nutrition"
                    : "border border-border bg-surface-2 text-muted hover:text-foreground",
                )}
              >
                {MEAL_TYPE_LABELS[meal]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="quantity">כמה אכלת?</Label>
          <Input
            id="quantity"
            value={form.quantityText}
            onChange={(e) => update({ quantityText: e.target.value })}
            placeholder="לדוגמה: 200 גרם, מנה אחת, 2 פרוסות"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUANTITY_PRESETS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => update({ quantityText: q })}
                aria-pressed={form.quantityText === q}
                className={cn(
                  "tap rounded-full px-3 py-1 text-[12px] font-semibold transition-colors",
                  form.quantityText === q
                    ? "border border-[color:var(--accent-nutrition)] bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]"
                    : "border border-border bg-surface-2 text-muted hover:text-foreground",
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Step 2 · Nutrition values (clearly editable) ───────────────── */}
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-foreground">
              ערכים תזונתיים
            </h3>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
              {nutritionHint}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[10.5px] font-semibold text-faint">
            <PencilIcon className="h-3 w-3" />
            ניתן לעריכה
          </span>
        </div>

        {/* Calories — the headline figure, emphasized. */}
        <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 transition-[border-color,box-shadow] focus-within:border-[color:var(--accent-nutrition)] focus-within:ring-4 focus-within:ring-[color:var(--accent-nutrition-soft)]">
          <div className="flex items-center justify-between">
            <label
              htmlFor="calories"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-muted"
            >
              <FlameIcon className="h-3.5 w-3.5 text-[color:var(--accent-nutrition)]" />
              קלוריות
            </label>
            <span className="text-[11px] font-medium text-faint">קק״ל</span>
          </div>
          <input
            id="calories"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            className="mt-0.5 w-full bg-transparent text-[22px] font-extrabold tabular-nums text-foreground outline-none placeholder:text-faint/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            value={form.calories}
            onChange={(e) => update({ calories: e.target.value })}
          />
        </div>

        {/* Macros — protein / carbs / fat, each a labelled, unit-suffixed field. */}
        <div className="grid grid-cols-3 gap-2">
          {MACROS.map((m) => (
            <div
              key={m.key}
              className="rounded-xl border border-border bg-surface-2 px-2.5 py-2 transition-[border-color,box-shadow] focus-within:border-[color:var(--accent-nutrition)] focus-within:ring-4 focus-within:ring-[color:var(--accent-nutrition-soft)]"
            >
              <label
                htmlFor={m.key}
                className="block text-[11.5px] font-semibold text-muted"
              >
                {m.label}
              </label>
              <div className="mt-0.5 flex items-baseline gap-1">
                <input
                  id={m.key}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="w-full min-w-0 bg-transparent text-[18px] font-bold tabular-nums text-foreground outline-none placeholder:text-faint/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={form[m.key]}
                  onChange={(e) => update({ [m.key]: e.target.value })}
                />
                <span className="shrink-0 text-[10.5px] font-medium text-faint">
                  גרם
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Step 3 · Save for next time (library foods only) ───────────── */}
      {sourceFoodId && (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
              <BookmarkIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-foreground">
                שמירת ערכים לפעם הבאה
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                נזכור את הכמות והערכים שהזנת למאכל הזה — בפעם הבאה שתוסיף אותו הכול
                ימולא אוטומטית.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.saveValues}
              aria-label="שמור ערכים לפעם הבאה"
              onClick={() => update({ saveValues: !form.saveValues })}
              className={cn(
                "tap relative h-6 w-11 shrink-0 rounded-full transition-colors",
                form.saveValues
                  ? "bg-[color:var(--accent-nutrition)]"
                  : "bg-border-strong",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[inset-inline-start]",
                  form.saveValues ? "start-[1.375rem]" : "start-0.5",
                )}
              />
            </button>
          </div>
          {saved && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[color:var(--accent-nutrition)]">
                <CheckIcon className="h-3.5 w-3.5" />
                נטען מהערכים ששמרת
              </p>
              <button
                type="button"
                onClick={handleResetSaved}
                className="tap shrink-0 text-[11.5px] font-semibold text-faint underline-offset-2 hover:text-foreground hover:underline"
              >
                אפס ערכים שמורים
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <Button type="submit" disabled={!canSave} size="lg" className="w-full">
        <PlusIcon className="h-5 w-5" /> הוסף ליומן
      </Button>
      {!canSave && (
        <p className="text-center text-[11.5px] text-faint">
          הזן שם מאכל כדי להוסיף ליומן
        </p>
      )}
    </form>
  );
}
