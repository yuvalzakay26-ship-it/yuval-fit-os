"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, PlusIcon, SparkIcon } from "@/components/ui/icons";
import {
  SUPPLEMENT_CATALOG,
  SUPPLEMENT_CATALOG_GROUPS,
  groupItems,
  type CatalogSupplement,
} from "./supplement-catalog";
import { SupplementGlyph } from "./SupplementGlyph";
import {
  SUPPLEMENT_CATEGORY_LABELS,
  SUPPLEMENT_LIBRARY_ALL,
  SUPPLEMENT_LIBRARY_HELPER,
  SUPPLEMENT_LIBRARY_NOTE,
  SUPPLEMENT_LIBRARY_TITLE,
} from "./supplement-copy";

type Filter = string; // group id, or "all"

const FILTERS: Array<{ id: Filter; label: string; count: number }> = [
  { id: "all", label: SUPPLEMENT_LIBRARY_ALL, count: SUPPLEMENT_CATALOG.length },
  ...SUPPLEMENT_CATALOG_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    count: g.keys.length,
  })),
];

/**
 * The browsable "common supplements" starter library — a category-filtered grid
 * of quick-add templates. Tapping a card calls `onPick`, which prefills the
 * parent form; the picked card flips to a clear "selected" state. Reusable and
 * presentational — it never writes to storage itself.
 *
 * Boundary: these are templates only. No dosages, no advice — see
 * `supplement-catalog.ts`.
 */
export function SupplementLibrary({
  onPick,
  selectedKey,
}: {
  onPick: (item: CatalogSupplement) => void;
  /** Key of the currently-picked template, shown as selected. */
  selectedKey?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo<CatalogSupplement[]>(() => {
    if (filter === "all") return SUPPLEMENT_CATALOG;
    const group = SUPPLEMENT_CATALOG_GROUPS.find((g) => g.id === filter);
    return group ? groupItems(group) : SUPPLEMENT_CATALOG;
  }, [filter]);

  return (
    <section>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
          <SparkIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-extrabold leading-tight text-foreground">
            {SUPPLEMENT_LIBRARY_TITLE}
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
            {SUPPLEMENT_LIBRARY_HELPER}
          </p>
        </div>
      </div>

      {/* Category browse tabs. Counts keep the accessible name distinct from the
          form's category buttons (e.g. "ויטמינים 5" vs the exact "ויטמינים"). */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            // Explicit label (with the count) keeps the tab's accessible name
            // distinct from the form's exact category buttons (e.g. "ויטמינים").
            aria-label={`${f.label}, ${f.count}`}
            aria-pressed={filter === f.id}
            className={cn(
              "tap shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
              filter === f.id
                ? "supplement-gradient text-[color:var(--accent-contrast)] shadow-glow-supplement"
                : "border border-border bg-surface-2 text-muted hover:text-foreground",
            )}
          >
            {f.label}
            <span
              aria-hidden="true"
              className={cn(
                "ms-1.5 tabular-nums text-[11px] font-bold",
                filter === f.id ? "opacity-75" : "text-faint",
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <LibraryCard
            key={item.key}
            item={item}
            selected={selectedKey === item.key}
            onPick={() => onPick(item)}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-faint">
        {SUPPLEMENT_LIBRARY_NOTE}
      </p>
    </section>
  );
}

function LibraryCard({
  item,
  selected,
  onPick,
}: {
  item: CatalogSupplement;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`מילוי מהיר: ${item.nameHe}`}
      className={cn(
        "tap group relative flex flex-col gap-2 rounded-2xl border bg-surface p-3 text-right shadow-soft transition-[border-color,box-shadow]",
        selected
          ? "border-[color:var(--accent-supplement)] ring-2 ring-[color:var(--accent-supplement)]/35"
          : "border-border hover:border-border-strong",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            selected
              ? "supplement-gradient text-[color:var(--accent-contrast)] shadow-glow-supplement"
              : "bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]",
          )}
        >
          <SupplementGlyph icon={item.icon} className="h-[18px] w-[18px]" />
        </span>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
            selected
              ? "bg-[color:var(--accent-supplement)] text-[color:var(--accent-contrast)]"
              : "bg-surface-2 text-faint group-hover:text-[color:var(--accent-supplement)]",
          )}
        >
          {selected ? <CheckIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold leading-tight text-foreground">
          {item.nameHe}
        </p>
        <p className="truncate text-[11px] text-faint">{item.nameEn}</p>
      </div>
      <span className="inline-flex w-fit items-center rounded-full bg-[color:var(--accent-supplement-soft)] px-2 py-0.5 text-[10.5px] font-bold text-[color:var(--accent-supplement)]">
        {SUPPLEMENT_CATEGORY_LABELS[item.category]}
      </span>
    </button>
  );
}
