"use client";

import { useMemo, useState } from "react";
import type { FoodCategory, FoodLibraryItem } from "@/lib/food-library";
import {
  FOOD_CATEGORY_LABELS,
  filterFoods,
  foodCategoriesInLibrary,
} from "@/lib/food-library";
import { toggleFavoriteFood, useFavoriteFoods } from "@/lib/fitness-store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Field";
import { PlusIcon, StarIcon } from "@/components/ui/icons";
import { FoodImage } from "./FoodImage";

const INITIAL_VISIBLE = 6;

/** A category filter, plus the synthetic "favorites" view. */
export type FoodFilter = FoodCategory | "all" | "favorites";

export function FoodLibrary({
  onSelect,
  selectedId,
  expandable = true,
  initialFilter = "all",
}: {
  onSelect: (item: FoodLibraryItem) => void;
  /** Id of the currently-selected food, for a subtle "selected" highlight. */
  selectedId?: string;
  /**
   * When true (default, inline preview), only the first few foods show with a
   * "show all" toggle. Set false inside the scrollable picker sheet to render
   * every result directly — the sheet handles scrolling.
   */
  expandable?: boolean;
  /** Initial filter chip — e.g. "favorites" when deep-linked from Nutrition. */
  initialFilter?: FoodFilter;
}) {
  const categories = useMemo(() => foodCategoriesInLibrary(), []);
  const favorites = useFavoriteFoods();
  const [filter, setFilter] = useState<FoodFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const hasFavorites = Object.keys(favorites).length > 0;
  const showingFavorites = filter === "favorites";

  const results = useMemo(() => {
    // The favorites view reuses the same text search, then keeps only favorited
    // items. Macros are never involved — this is pure identity filtering.
    if (filter === "favorites") {
      return filterFoods("all", query).filter((item) => favorites[item.id]);
    }
    return filterFoods(filter, query);
  }, [filter, query, favorites]);
  const collapsed = expandable && !expanded;
  const visible = collapsed ? results.slice(0, INITIAL_VISIBLE) : results;
  const hasMore = expandable && results.length > INITIAL_VISIBLE;

  // Show the chip row when there are real categories to pick, or when the
  // favorites chip is relevant. Keep the favorites chip while it is the active
  // filter so it never vanishes mid-view after unfavoriting the last item.
  const showFavChip = hasFavorites || showingFavorites;
  const showChips = categories.length > 1 || showFavChip;

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
          {showFavChip && (
            <button
              type="button"
              onClick={() => setFilter("favorites")}
              className={cn(
                "tap inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold",
                showingFavorites
                  ? "nutrition-gradient text-[color:var(--accent-contrast)] shadow-glow-nutrition"
                  : "border border-border bg-surface text-muted hover:text-foreground",
              )}
            >
              <StarIcon filled={showingFavorites} className="h-3.5 w-3.5" />
              מועדפים
            </button>
          )}
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
        showingFavorites ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface/40 px-4 py-8 text-center">
            <StarIcon className="mx-auto mb-2 h-7 w-7 text-faint" />
            <p className="text-[13.5px] font-semibold text-foreground">
              עדיין אין מאכלים מועדפים
            </p>
            <p className="mt-1 text-[12.5px] text-muted">
              סמן מאכלים בכוכב כדי למצוא אותם מהר יותר.
            </p>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface/40 px-4 py-8 text-center text-[13px] text-muted">
            לא נמצאו מאכלים תואמים.
          </p>
        )
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {visible.map((item) => {
              const isSelected = item.id === selectedId;
              const isFav = Boolean(favorites[item.id]);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface text-right shadow-soft transition-[border-color,box-shadow]",
                    isSelected
                      ? "border-[color:var(--accent-nutrition)] ring-2 ring-[color:var(--accent-nutrition)]/30"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="tap flex flex-1 flex-col text-right"
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
                  <button
                    type="button"
                    onClick={() => toggleFavoriteFood(item.id)}
                    aria-label={isFav ? "הסר מהמועדפים" : "הוסף למועדפים"}
                    aria-pressed={isFav}
                    className="tap absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
                  >
                    <StarIcon
                      filled={isFav}
                      className={cn("h-[18px] w-[18px]", isFav && "text-amber-300")}
                    />
                  </button>
                </div>
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
