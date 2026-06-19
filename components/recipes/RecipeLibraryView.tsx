"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type Recipe,
  type RecipeCategory,
  filterRecipes,
  recipeCategoriesInLibrary,
} from "@/lib/recipes";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Field";
import { ChevronIcon, FlameIcon, SparkIcon } from "@/components/ui/icons";
import { RecipeImage } from "./RecipeImage";

type Filter = RecipeCategory | "all";

/** Compact macro summary line, e.g. "52ג חלבון · 46ג פחמ׳ · 9ג שומן". */
function macroLine(recipe: Recipe): string {
  const n = recipe.nutrition;
  return `${n.proteinGrams ?? 0}ג חלבון · ${n.carbsGrams ?? 0}ג פחמ׳ · ${n.fatGrams ?? 0}ג שומן`;
}

export function RecipeLibraryView() {
  const categories = useMemo(() => recipeCategoriesInLibrary(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const results = useMemo(() => filterRecipes(filter, query), [filter, query]);

  const chips: { value: Filter; label: string }[] = [
    { value: "all", label: "הכל" },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש מתכון או רכיב…"
        aria-label="חיפוש בספריית המתכונים"
        className="mb-3"
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setFilter(chip.value)}
            aria-pressed={filter === chip.value}
            className={cn(
              "tap shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold",
              filter === chip.value
                ? "nutrition-gradient text-[color:var(--accent-contrast)] shadow-glow-nutrition"
                : "border border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          accent="var(--accent-nutrition)"
          accentSoft="var(--accent-nutrition-soft)"
          icon={<SparkIcon className="h-7 w-7" />}
          title="לא נמצאו מתכונים תואמים"
          description="נסה מילת חיפוש אחרת או בחר קטגוריה אחרת."
        />
      ) : (
        <ul className="space-y-2.5" data-testid="recipe-list">
          {results.map((recipe) => (
            <li key={recipe.id}>
              <Link
                href={`/recipes/${encodeURIComponent(recipe.id)}`}
                className="tap flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft transition-[border-color] hover:border-border-strong"
                aria-label={`פתח את המתכון ${recipe.title}`}
              >
                <RecipeImage
                  imageUrl={recipe.imageUrl}
                  alt={recipe.title}
                  category={recipe.category}
                  label={recipe.title}
                  sizes="64px"
                  className="h-16 w-16 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-bold text-foreground">
                      {recipe.title}
                    </p>
                    <Badge tone="muted" className="shrink-0">
                      {recipe.category}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[12px] text-muted">
                    {recipe.nutrition.calories !== undefined && (
                      <>
                        <FlameIcon className="h-3.5 w-3.5 text-[color:var(--accent-nutrition)]" />
                        <span className="font-semibold text-[color:var(--accent-nutrition)]">
                          {recipe.nutrition.calories} קל׳
                        </span>
                        <span className="text-faint"> · </span>
                      </>
                    )}
                    <span className="truncate">{macroLine(recipe)}</span>
                  </p>
                </div>
                <ChevronIcon className="h-4 w-4 shrink-0 rotate-180 text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
