"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  type Recipe,
  RECIPE_SCOPE_LABELS,
  foodLogFromRecipe,
} from "@/lib/recipes";
import { addFoodLog } from "@/lib/fitness-store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import {
  CheckIcon,
  ChevronIcon,
  FlameIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { RecipeImage } from "./RecipeImage";

/** The three macros rendered as a labelled grid (calories sits apart). */
const MACROS = [
  { key: "proteinGrams", label: "חלבון" },
  { key: "carbsGrams", label: "פחמימה" },
  { key: "fatGrams", label: "שומן" },
  { key: "fiberGrams", label: "סיבים" },
] as const;

export function RecipeDetailView({ recipe }: { recipe: Recipe }) {
  const { nutrition } = recipe;

  // Calm, transient confirmation after "add to food log". Component-local only.
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const handleAddToLog = useCallback(() => {
    addFoodLog(foodLogFromRecipe(recipe));
    setFlash("נוסף ליומן התזונה של היום");
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2600);
  }, [recipe]);

  return (
    <div>
      <Link
        href="/recipes"
        className="tap mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent-nutrition)]"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        ספריית מתכונים
      </Link>

      <RecipeImage
        imageUrl={recipe.imageUrl}
        alt={recipe.title}
        category={recipe.category}
        label={recipe.title}
        sizes="(max-width: 448px) 100vw, 416px"
        className="mb-4 aspect-[16/10] w-full"
      />

      <PageHeader title={recipe.title} className="mb-3" />

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <Badge tone="accent">{recipe.category}</Badge>
        {recipe.servings && <Badge tone="muted">{recipe.servings}</Badge>}
        {recipe.tags.map((tag) => (
          <Badge key={tag} tone="muted">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Nutrition */}
      <section className="mb-6">
        <SectionHeader
          title="ערכים תזונתיים"
          hint={RECIPE_SCOPE_LABELS[nutrition.scope]}
          accent="var(--accent-nutrition)"
        />
        <Card className="space-y-3">
          {nutrition.calories !== undefined && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-2.5">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                <FlameIcon className="h-3.5 w-3.5 text-[color:var(--accent-nutrition)]" />
                קלוריות
              </span>
              <span className="text-[20px] font-extrabold tabular-nums text-foreground">
                {nutrition.calories}
                <span className="ms-1 text-[11px] font-medium text-faint">קק״ל</span>
              </span>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {MACROS.map((m) => {
              const value = nutrition[m.key];
              return (
                <div
                  key={m.key}
                  className="rounded-xl border border-border bg-surface-2 px-2 py-2 text-center"
                >
                  <p className="text-[11px] font-semibold text-muted">{m.label}</p>
                  <p className="mt-0.5 text-[15px] font-bold tabular-nums text-foreground">
                    {value ?? 0}
                    <span className="text-[10px] font-medium text-faint">ג</span>
                  </p>
                </div>
              );
            })}
          </div>
          {nutrition.note && (
            <p className="text-[11.5px] leading-relaxed text-faint">{nutrition.note}</p>
          )}
        </Card>
      </section>

      {/* Add to food log — recipe macros become a today entry. */}
      <section className="mb-6">
        <Button onClick={handleAddToLog} size="lg" className="w-full">
          <PlusIcon className="h-5 w-5" /> הוסף ליומן התזונה
        </Button>
        <p className="mt-2 text-center text-[11.5px] leading-relaxed text-faint">
          הוספת רשומה ליומן של היום לפי הערכים התזונתיים של המתכון ({RECIPE_SCOPE_LABELS[nutrition.scope]}). אפשר לערוך אחר כך ביומן התזונה.
        </p>
      </section>

      {/* Ingredients */}
      <section className="mb-6">
        <SectionHeader title="מצרכים" accent="var(--accent-nutrition)" />
        <Card>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[14px] text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-nutrition)]" />
                <span className="leading-relaxed">{ing.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Optional toppings */}
      {recipe.optionalToppings && recipe.optionalToppings.length > 0 && (
        <section className="mb-6">
          <SectionHeader
            title="תוספות לבחירה"
            hint="לא נכללות בערכים התזונתיים שלמעלה"
            accent="var(--accent-nutrition)"
          />
          <Card variant="flat">
            <ul className="space-y-2">
              {recipe.optionalToppings.map((top, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[13.5px] text-muted"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong" />
                  <span className="leading-relaxed">{top.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Steps */}
      <section className="mb-6">
        <SectionHeader title="אופן הכנה" accent="var(--accent-nutrition)" />
        <ol className="space-y-2.5">
          {recipe.steps.map((step, i) => (
            <li key={i}>
              <Card className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-nutrition-soft)] text-[13px] font-bold text-[color:var(--accent-nutrition)]">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[14px] leading-relaxed text-foreground">
                  {step.text}
                </span>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Calm transient confirmation, fixed above the bottom nav. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }}
      >
        {flash && (
          <div className="animate-fade-up flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-foreground shadow-soft">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
              <CheckIcon className="h-3 w-3" />
            </span>
            {flash}
          </div>
        )}
      </div>
    </div>
  );
}
