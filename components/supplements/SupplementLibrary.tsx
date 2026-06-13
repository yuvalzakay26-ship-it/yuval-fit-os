"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, PlusIcon, SearchIcon, SparkIcon, XIcon } from "@/components/ui/icons";
import {
  SUPPLEMENT_CATALOG,
  SUPPLEMENT_CATALOG_GROUPS,
  groupItems,
  supplementMatchesQuery,
  type CatalogSupplement,
} from "./supplement-catalog";
import { SupplementGlyph } from "./SupplementGlyph";
import {
  SUPPLEMENT_ALREADY_TRACKED,
  SUPPLEMENT_CATEGORY_LABELS,
  SUPPLEMENT_LIBRARY_ALL,
  SUPPLEMENT_LIBRARY_EMPTY_HINT,
  SUPPLEMENT_LIBRARY_EMPTY_TITLE,
  SUPPLEMENT_LIBRARY_HELPER,
  SUPPLEMENT_LIBRARY_NOTE,
  SUPPLEMENT_LIBRARY_SEARCH_PLACEHOLDER,
  SUPPLEMENT_LIBRARY_TITLE,
  SUPPLEMENT_TRACKED_OPEN,
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
 * The browsable "common supplements" starter library — a searchable,
 * category-filtered grid of quick-add templates. Tapping a card calls `onPick`,
 * which prefills the parent form; the picked card flips to a clear "selected"
 * state. Templates the user already tracks (`trackedKeys`) show a calm "already
 * tracked" badge so the catalogue never reads as new for an item that exists.
 * Reusable and presentational — it never writes to storage itself.
 *
 * Boundary: these are templates only. No dosages, no advice — see
 * `supplement-catalog.ts`.
 */
export function SupplementLibrary({
  onPick,
  selectedKey,
  trackedKeys,
}: {
  onPick: (item: CatalogSupplement) => void;
  /** Key of the currently-picked template, shown as selected. */
  selectedKey?: string;
  /** Catalogue keys already present in the user's tracker. */
  trackedKeys?: ReadonlySet<string>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // Category tab + search compose (AND): the tab narrows the set, the query
  // filters within it. Searching never silently leaves the chosen tab.
  const items = useMemo<CatalogSupplement[]>(() => {
    const base =
      filter === "all"
        ? SUPPLEMENT_CATALOG
        : (() => {
            const group = SUPPLEMENT_CATALOG_GROUPS.find((g) => g.id === filter);
            return group ? groupItems(group) : SUPPLEMENT_CATALOG;
          })();
    const q = query.trim();
    if (!q) return base;
    return base.filter((item) =>
      supplementMatchesQuery(item, q, SUPPLEMENT_CATEGORY_LABELS[item.category]),
    );
  }, [filter, query]);

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

      {/* Search field — local, dependency-free matching (name / subtitle /
          category / aliases). See `supplementMatchesQuery`. */}
      <div className="relative mb-3">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-faint">
          <SearchIcon className="h-[18px] w-[18px]" />
        </span>
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={SUPPLEMENT_LIBRARY_SEARCH_PLACEHOLDER}
          aria-label={SUPPLEMENT_LIBRARY_SEARCH_PLACEHOLDER}
          autoComplete="off"
          className="h-11 w-full rounded-2xl border border-border bg-surface-2 ps-11 pe-10 text-[14px] text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-faint focus:border-[color:var(--accent-supplement)] focus:bg-surface focus:ring-4 focus:ring-[color:var(--accent-supplement-soft)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="נקה חיפוש"
            className="tap absolute inset-y-0 end-0 flex items-center pe-3 text-faint hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
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

      {items.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border-strong bg-surface/40 px-6 py-9 text-center">
          <p className="text-[14px] font-semibold text-foreground">
            {SUPPLEMENT_LIBRARY_EMPTY_TITLE}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            {SUPPLEMENT_LIBRARY_EMPTY_HINT}
          </p>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {items.map((item) => (
            <LibraryCard
              key={item.key}
              item={item}
              selected={selectedKey === item.key}
              tracked={trackedKeys?.has(item.key) ?? false}
              onPick={() => onPick(item)}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-[11px] leading-relaxed text-faint">
        {SUPPLEMENT_LIBRARY_NOTE}
      </p>
    </section>
  );
}

function LibraryCard({
  item,
  selected,
  tracked,
  onPick,
}: {
  item: CatalogSupplement;
  selected: boolean;
  tracked: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      aria-label={
        tracked
          ? `${item.nameHe} — ${SUPPLEMENT_ALREADY_TRACKED}, ${SUPPLEMENT_TRACKED_OPEN}`
          : `מילוי מהיר: ${item.nameHe}`
      }
      className={cn(
        "tap group relative flex flex-col gap-2 rounded-2xl border bg-surface p-3 text-right shadow-soft transition-[border-color,box-shadow]",
        selected
          ? "border-[color:var(--accent-supplement)] ring-2 ring-[color:var(--accent-supplement)]/35"
          : tracked
            ? "border-[color:var(--accent-supplement)]/40"
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
            selected || tracked
              ? "bg-[color:var(--accent-supplement)] text-[color:var(--accent-contrast)]"
              : "bg-surface-2 text-faint group-hover:text-[color:var(--accent-supplement)]",
          )}
        >
          {selected || tracked ? (
            <CheckIcon className="h-3.5 w-3.5" />
          ) : (
            <PlusIcon className="h-3.5 w-3.5" />
          )}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold leading-tight text-foreground">
          {item.nameHe}
        </p>
        <p className="truncate text-[11px] text-faint">{item.nameEn}</p>
      </div>
      {tracked ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[color:var(--accent-supplement)] px-2 py-0.5 text-[10.5px] font-bold text-[color:var(--accent-contrast)]">
          <CheckIcon className="h-3 w-3" />
          {SUPPLEMENT_ALREADY_TRACKED}
        </span>
      ) : (
        <span className="inline-flex w-fit items-center rounded-full bg-[color:var(--accent-supplement-soft)] px-2 py-0.5 text-[10.5px] font-bold text-[color:var(--accent-supplement)]">
          {SUPPLEMENT_CATEGORY_LABELS[item.category]}
        </span>
      )}
    </button>
  );
}
