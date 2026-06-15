"use client";

// Editable review screen for an AI photo draft (Phase 3.xx).
//
// The draft is ALWAYS editable and is NEVER saved until the user taps
// "נראה טוב, הוסף ליומן". Every value is presented as an estimate. On confirm we
// build ordinary `FoodLog`s (via `buildFoodLogFromConfirmedItem`) and hand them
// to the parent, which persists them through the existing `addFoodLog` path —
// so there is no new storage and no schema change.

import { useMemo, useState } from "react";
import type { FoodLog, MealType } from "@/lib/fitness-types";
import type { FoodCategory } from "@/lib/food-library";
import {
  buildFoodLogFromConfirmedItem,
  CONFIDENCE_LABELS_HE,
  matchLibraryItem,
  PORTION_LABELS_HE,
  type ConfidenceLevel,
  type PhotoDraft,
  type PortionSize,
} from "@/lib/nutrition-photo";
import { cn, parseOptionalNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";
import { MEAL_ORDER, MEAL_TYPE_LABELS } from "./nutrition-labels";
import { FoodImage } from "./FoodImage";

interface ReviewRow {
  key: string;
  foodName: string;
  quantityText: string;
  portionSize: PortionSize;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  confidence: ConfidenceLevel;
  sourceFoodId?: string;
  imagePath?: string;
  category?: string;
}

const PORTION_ORDER: PortionSize[] = ["small", "regular", "large"];

const CONFIDENCE_TONE: Record<ConfidenceLevel, string> = {
  high: "bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]",
  medium: "bg-amber-400/15 text-amber-600 dark:text-amber-400",
  low: "bg-red-500/12 text-red-600 dark:text-red-400",
};

const MACRO_FIELDS = [
  { key: "protein", label: "חלבון" },
  { key: "carbs", label: "פחמ׳" },
  { key: "fat", label: "שומן" },
] as const;

function toRow(
  item: PhotoDraft["items"][number],
  index: number,
): ReviewRow {
  const match = matchLibraryItem(item.nameHe, item.matchedSourceFoodId);
  return {
    key: `row-${index}-${item.nameHe}`,
    foodName: item.nameHe,
    quantityText: item.estPortion,
    portionSize: item.portionSize,
    calories: String(item.calories),
    protein: String(item.protein),
    carbs: String(item.carbs),
    fat: String(item.fat),
    confidence: item.confidence,
    sourceFoodId: match?.id,
    imagePath: match?.imagePath,
    category: match?.category,
  };
}

export function PhotoDraftReview({
  draft,
  initialMealType,
  onConfirm,
  onRetry,
  onManual,
  onCancel,
}: {
  draft: PhotoDraft;
  initialMealType: MealType;
  /** Receives the confirmed entries — parent persists via `addFoodLog`. */
  onConfirm: (logs: FoodLog[]) => void;
  onRetry: () => void;
  onManual: () => void;
  onCancel: () => void;
}) {
  const initialRows = useMemo(() => draft.items.map(toRow), [draft]);
  const [rows, setRows] = useState<ReviewRow[]>(initialRows);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [addedCount, setAddedCount] = useState(0);

  const namedRows = rows.filter((r) => r.foodName.trim().length > 0);
  const canConfirm = namedRows.length > 0;

  const updateRow = (key: string, patch: Partial<ReviewRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const removeRow = (key: string) =>
    setRows((prev) => prev.filter((r) => r.key !== key));

  const addBlankRow = () => {
    setAddedCount((n) => n + 1);
    setRows((prev) => [
      ...prev,
      {
        key: `manual-${addedCount}`,
        foodName: "",
        quantityText: "",
        portionSize: "regular",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        confidence: "medium",
      },
    ]);
  };

  const handleConfirm = () => {
    const logs = namedRows.map((r) =>
      buildFoodLogFromConfirmedItem(
        {
          foodName: r.foodName,
          quantityText: r.quantityText,
          calories: parseOptionalNumber(r.calories),
          protein: parseOptionalNumber(r.protein) ?? 0,
          carbs: parseOptionalNumber(r.carbs) ?? 0,
          fat: parseOptionalNumber(r.fat) ?? 0,
          sourceFoodId: r.sourceFoodId,
          imagePath: r.imagePath,
          category: r.category,
        },
        mealType,
      ),
    );
    onConfirm(logs);
  };

  return (
    <div className="space-y-3.5">
      {/* Header + disclaimer */}
      <div>
        <h2 className="text-[19px] font-extrabold text-foreground">טיוטה מהתמונה</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-muted">
          <PencilIcon className="h-3.5 w-3.5 text-[color:var(--accent-nutrition)]" />
          הערכה בלבד · כדאי לבדוק לפני הוספה ליומן
        </p>
      </div>

      {/* Overall confidence + optional notes */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3 py-2.5">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold",
            CONFIDENCE_TONE[draft.overallConfidence],
          )}
        >
          {CONFIDENCE_LABELS_HE[draft.overallConfidence]}
        </span>
        {draft.notes && (
          <p className="min-w-0 flex-1 text-[11.5px] leading-snug text-muted">
            {draft.notes}
          </p>
        )}
      </div>

      {/* Meal selector */}
      <div>
        <p className="mb-1.5 text-[12px] font-semibold text-muted">לאיזו ארוחה?</p>
        <div className="grid grid-cols-4 gap-1.5">
          {MEAL_ORDER.map((meal) => (
            <button
              key={meal}
              type="button"
              onClick={() => setMealType(meal)}
              aria-pressed={mealType === meal}
              className={cn(
                "tap rounded-xl px-1 py-2 text-[12px] font-semibold transition-colors",
                mealType === meal
                  ? "nutrition-gradient text-[color:var(--accent-contrast)] shadow-glow-nutrition"
                  : "border border-border bg-surface-2 text-muted hover:text-foreground",
              )}
            >
              {MEAL_TYPE_LABELS[meal]}
            </button>
          ))}
        </div>
      </div>

      {/* Detected items */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface/40 px-4 py-6 text-center">
          <p className="text-[13px] font-semibold text-foreground">
            אין פריטים בטיוטה
          </p>
          <p className="mt-1 text-[12px] text-muted">
            אפשר להוסיף מאכל ידנית או לנסות תמונה אחרת.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="space-y-3 rounded-2xl border border-border bg-surface p-3.5 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <FoodImage
                  imagePath={row.imagePath}
                  alt={row.foodName || "מאכל"}
                  category={(row.category || "other") as FoodCategory}
                  label={row.foodName || "?"}
                  sizes="44px"
                  className="h-11 w-11 shrink-0 rounded-xl"
                />
                <input
                  value={row.foodName}
                  onChange={(e) => updateRow(row.key, { foodName: e.target.value })}
                  placeholder="שם המאכל"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-bold text-foreground outline-none placeholder:text-faint"
                />
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[10.5px] font-bold",
                    CONFIDENCE_TONE[row.confidence],
                  )}
                >
                  {CONFIDENCE_LABELS_HE[row.confidence]}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="tap -m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-red-500"
                  aria-label={`הסר מאכל מהטיוטה — ${row.foodName || "מאכל"}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Portion chips */}
              <div className="flex flex-wrap gap-1.5">
                {PORTION_ORDER.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      updateRow(row.key, {
                        portionSize: size,
                        quantityText: PORTION_LABELS_HE[size],
                      })
                    }
                    aria-pressed={row.portionSize === size}
                    className={cn(
                      "tap rounded-full px-3 py-1 text-[12px] font-semibold transition-colors",
                      row.portionSize === size
                        ? "border border-[color:var(--accent-nutrition)] bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]"
                        : "border border-border bg-surface-2 text-muted hover:text-foreground",
                    )}
                  >
                    {PORTION_LABELS_HE[size]}
                  </button>
                ))}
              </div>

              {/* Quantity */}
              <input
                value={row.quantityText}
                onChange={(e) => updateRow(row.key, { quantityText: e.target.value })}
                placeholder="כמות, לדוגמה: 200 גרם"
                className="h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-[13.5px] text-foreground outline-none placeholder:text-faint focus:border-[color:var(--accent-nutrition)]"
              />

              {/* Calories + macros */}
              <div className="grid grid-cols-4 gap-2">
                <label className="rounded-xl border border-border bg-surface-2 px-2.5 py-1.5">
                  <span className="block text-[10.5px] font-semibold text-muted">קלוריות</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={row.calories}
                    onChange={(e) => updateRow(row.key, { calories: e.target.value })}
                    className="w-full bg-transparent text-[15px] font-bold tabular-nums text-foreground outline-none placeholder:text-faint/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </label>
                {MACRO_FIELDS.map((m) => (
                  <label
                    key={m.key}
                    className="rounded-xl border border-border bg-surface-2 px-2.5 py-1.5"
                  >
                    <span className="block text-[10.5px] font-semibold text-muted">
                      {m.label}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="0"
                      value={row[m.key]}
                      onChange={(e) => updateRow(row.key, { [m.key]: e.target.value })}
                      className="w-full bg-transparent text-[15px] font-bold tabular-nums text-foreground outline-none placeholder:text-faint/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add missing food */}
      <button
        type="button"
        onClick={addBlankRow}
        className="tap flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border-strong bg-surface/40 py-2.5 text-[13px] font-semibold text-muted hover:text-foreground"
      >
        <PlusIcon className="h-4 w-4" /> הוסף מאכל שלא זוהה
      </button>

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          <CheckIcon className="h-5 w-5" /> נראה טוב, הוסף ליומן
        </Button>
        {!canConfirm && (
          <p className="text-center text-[11.5px] text-faint">
            הזן שם לפחות למאכל אחד כדי להוסיף ליומן
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            <RefreshIcon className="h-4 w-4" /> נסה שוב
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <XIcon className="h-4 w-4" /> ביטול
          </Button>
        </div>
        <button
          type="button"
          onClick={onManual}
          className="tap flex w-full items-center justify-center gap-1.5 py-1.5 text-[12.5px] font-semibold text-muted hover:text-foreground"
        >
          <PencilIcon className="h-4 w-4" /> הוסף ידנית במקום
        </button>
      </div>
    </div>
  );
}
