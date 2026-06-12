"use client";

import { useMemo, useState } from "react";
import type { FoodCategory, FoodLibraryItem } from "@/lib/food-library";
import {
  FOOD_CATEGORY_LABELS,
  filterFoods,
  foodCategoriesInLibrary,
} from "@/lib/food-library";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Field";
import { PlusIcon } from "@/components/ui/icons";
import { FoodImage } from "./FoodImage";

const INITIAL_VISIBLE = 6;

export function FoodLibrary({
  onSelect,
  selectedId,
}: {
  onSelect: (item: FoodLibraryItem) => void;
  /** Id of the currently-selected food, for a subtle "selected" highlight. */
  selectedId?: string;
}) {
  const categories = useMemo(() => foodCategoriesInLibrary(), []);
  const [filter, setFilter] = useState<FoodCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const results = useMemo(() => filterFoods(filter, query), [filter, query]);
  const visible = expanded ? results : results.slice(0, INITIAL_VISIBLE);
  const hasMore = results.length > INITIAL_VISIBLE;

  // Only show the category row when there is more than one category to pick.
  const showChips = categories.length > 1;

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש מאכל…"
        aria-label="חיפוש במאגר האוכל"
        className="mb-3"
      />

      {showChips && (
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {[{ value: "all" as const, label: "הכל" }, ...categories.map((c) => ({ value: c, label: FOOD_CATEGORY_LABELS[c] }))].map(
            (chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setFilter(chip.value)}
                className={cn(
                  "tap shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold",
                  filter === chip.value
                    ? "nutrition-gradient text-[color:var(--accent-contrast)] shadow-glow-nutrition"
                    : "border border-border bg-surface text-muted hover:text-foreground",
                )}
              >
                {chip.label}
              </button>
            ),
          )}
        </div>
      )}

      {results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong bg-surface/40 px-4 py-8 text-center text-[13px] text-muted">
          לא נמצאו מאכלים תואמים.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {visible.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    "tap group flex flex-col overflow-hidden rounded-2xl border bg-surface text-right shadow-soft transition-[border-color,box-shadow]",
                    isSelected
                      ? "border-[color:var(--accent-nutrition)] ring-2 ring-[color:var(--accent-nutrition)]/30"
                      : "border-border hover:border-border-strong",
                  )}
                  aria-label={`הוספת ${item.nameHe} ליומן`}
                >
                  <FoodImage
                    imagePath={item.imagePath}
                    alt={item.nameHe}
                    category={item.category}
                    label={item.nameHe}
                    sizes="(max-width: 448px) 45vw, 200px"
                    className="aspect-square w-full rounded-none"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5">
                    <p className="truncate text-[13.5px] font-bold leading-tight text-foreground">
                      {item.nameHe}
                    </p>
                    <span className="mt-auto inline-flex items-center justify-center gap-1 rounded-xl bg-[color:var(--accent-nutrition-soft)] px-2 py-1.5 text-[11.5px] font-bold text-[color:var(--accent-nutrition)] group-hover:brightness-95">
                      <PlusIcon className="h-3.5 w-3.5" />
                      הוסף ליומן
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="tap mt-3 w-full rounded-2xl border border-border bg-surface-2 py-2.5 text-[13px] font-semibold text-muted hover:text-foreground"
            >
              {expanded ? "הצג פחות" : `הצג את כל המאכלים (${results.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
