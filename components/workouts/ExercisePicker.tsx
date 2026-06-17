"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Exercise, MuscleGroup } from "@/lib/fitness-types";
import {
  EQUIPMENT_LABELS,
  MUSCLE_GROUP_LABELS,
  SEED_EXERCISES,
  getExerciseById,
} from "@/lib/seed-exercises";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { Input } from "@/components/ui/Field";
import {
  CheckIcon,
  ChevronIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";

type Filter = MuscleGroup | "all";

// Counts derive from the data so chip labels stay correct as the library grows
// — never hardcoded. Mirrors the approach in ExerciseLibrary.
const GROUP_COUNTS = SEED_EXERCISES.reduce<Record<string, number>>((acc, e) => {
  acc[e.muscleGroup] = (acc[e.muscleGroup] ?? 0) + 1;
  return acc;
}, {});

const FILTERS: Array<{ value: Filter; label: string; count: number }> = [
  { value: "all", label: "הכל", count: SEED_EXERCISES.length },
  ...([...new Set(SEED_EXERCISES.map((e) => e.muscleGroup))] as MuscleGroup[]).map(
    (m) => ({ value: m, label: MUSCLE_GROUP_LABELS[m], count: GROUP_COUNTS[m] }),
  ),
];

function matchesQuery(exercise: Exercise, q: string): boolean {
  if (!q) return true;
  const haystack = [
    exercise.nameHe,
    exercise.nameEn,
    MUSCLE_GROUP_LABELS[exercise.muscleGroup],
    EQUIPMENT_LABELS[exercise.equipment],
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Premium, full-screen exercise picker for the workout builder (Phase 3.xx).
 *
 * Rendered as a portal overlay rather than its own route on purpose: the
 * builder holds the in-progress draft (title + sets) in React state, so a real
 * route navigation would discard unsaved work. This overlay takes over the
 * whole viewport — it reads as a proper app screen, not a dropdown or a weak
 * sheet — while the builder stays mounted underneath, fully intact.
 *
 * The picker is add-only: tapping an exercise adds it to the draft and the card
 * flips to a clear "added" state. This preserves the builder's existing
 * no-duplicate behavior exactly (an exercise can be in the draft at most once);
 * removal stays where it always was — the trash button on each builder row.
 * Users can add several exercises in one visit, then tap "סיום" to return.
 */
export function ExercisePicker({
  onClose,
  onAdd,
  selectedIds,
  recentIds = [],
}: {
  onClose: () => void;
  onAdd: (exerciseId: string) => void;
  /** Exercise ids already in the draft — shown as "added". */
  selectedIds: Set<string>;
  /** Recently-performed exercise ids, derived from history (newest first). */
  recentIds?: string[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // The picker is mounted only while open (see WorkoutBuilder), so every open
  // is a fresh mount with default filter/query — no stale state to reset.
  // Background scroll lock goes through the shared counter-based hook; this
  // effect only wires Escape-to-close.
  useBodyScrollLock();
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(
    () =>
      SEED_EXERCISES.filter(
        (e) =>
          (filter === "all" || e.muscleGroup === filter) &&
          matchesQuery(e, normalizedQuery),
      ),
    [filter, normalizedQuery],
  );

  // "Recently used" only makes sense on the unfiltered, unsearched browse view.
  // Exclude exercises already in the draft so the rail stays actionable.
  const recents = useMemo(() => {
    if (filter !== "all" || normalizedQuery) return [];
    return recentIds
      .filter((id) => !selectedIds.has(id))
      .map(getExerciseById)
      .filter((e): e is Exercise => Boolean(e))
      .slice(0, 6);
  }, [filter, normalizedQuery, recentIds, selectedIds]);

  const addedCount = selectedIds.size;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="בחירת תרגיל"
      // Pinned below the global app header (top offset) and down to the bottom
      // edge — so the real sticky header stays visible and usable while the
      // picker still owns the full content area (covering page + bottom nav, as
      // before). z-50 sits above page content/nav but never overlaps the
      // header, which lives in the gap above `top`.
      className="animate-fade-in fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background"
      style={{ top: "var(--app-header-height)" }}
    >
      {/* ---------- Header: back, title, helper, search, chips ---------- */}
      <div className="module-strength shrink-0 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="px-4 pb-3 pt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="חזרה לבונה האימון"
              className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-foreground hover:bg-surface-2"
            >
              {/* Chevron points to the start edge (right, in RTL) = "back". */}
              <ChevronIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] font-extrabold leading-tight text-foreground">
                בחר תרגיל
              </h2>
              <p className="truncate text-[12.5px] text-muted">
                חפש או דפדף לפי קבוצת שריר — ולחץ כדי להוסיף לאימון.
              </p>
            </div>
          </div>

          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute end-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש תרגיל…"
              aria-label="חיפוש תרגיל בספרייה"
              className="pe-11"
            />
          </div>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "tap shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold",
                filter === f.value
                  ? "strength-gradient text-[color:var(--accent-contrast)] shadow-glow-strength"
                  : "border border-border bg-surface text-muted hover:text-foreground",
              )}
            >
              {f.label}
              <span
                aria-hidden="true"
                className={cn(
                  "ms-1.5 tabular-nums text-[11px] font-bold",
                  filter === f.value ? "opacity-75" : "text-faint",
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ----------------------- Scrollable body ------------------------ */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4"
        style={{
          paddingBottom: "calc(7rem + env(safe-area-inset-bottom))",
        }}
      >
        {recents.length > 0 && (
          <section className="mb-5">
            <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-faint">
              בשימוש לאחרונה
            </p>
            <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
              {recents.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => onAdd(exercise.id)}
                  className="tap group flex w-[120px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface text-right shadow-soft hover:border-border-strong"
                  aria-label={`הוספת ${exercise.nameHe} לאימון`}
                >
                  <ExerciseImage
                    imagePath={exercise.imagePath}
                    alt={exercise.nameHe}
                    muscleGroup={exercise.muscleGroup}
                    imageKey={exercise.imageKey}
                    sizes="120px"
                    className="aspect-square w-full rounded-none"
                  />
                  <div className="flex items-center gap-1 p-2.5">
                    <PlusIcon className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent-strength)]" />
                    <span className="truncate text-[12.5px] font-bold text-foreground">
                      {exercise.nameHe}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {results.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border-strong bg-surface/40 px-6 py-12 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-strength-soft)] text-[color:var(--accent-strength)]">
              <SearchIcon className="h-6 w-6" />
            </span>
            <p className="text-[14.5px] font-bold text-foreground">
              לא נמצאו תרגילים תואמים
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              נסה מונח חיפוש אחר או בחר קבוצת שריר אחרת.
            </p>
          </div>
        ) : (
          <>
            {(normalizedQuery || filter !== "all") && (
              <p className="mb-2.5 text-[12px] font-medium text-faint">
                {results.length} תרגילים
              </p>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              {results.map((exercise) => (
                <PickerCard
                  key={exercise.id}
                  exercise={exercise}
                  added={selectedIds.has(exercise.id)}
                  onAdd={() => onAdd(exercise.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ----------------------- Sticky footer -------------------------- */}
      <div
        className="absolute inset-x-0 bottom-0 border-t border-border bg-surface/85 px-4 pt-3 backdrop-blur-md"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="tap strength-gradient shadow-glow-strength flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-[color:var(--accent-contrast)]"
        >
          {addedCount > 0
            ? `סיום · ${addedCount} תרגילים באימון`
            : "סיום"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

function PickerCard({
  exercise,
  added,
  onAdd,
}: {
  exercise: Exercise;
  added: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        // Add-only: re-tapping an added card is a no-op so we never create a
        // duplicate entry or surprise-remove the user's filled sets.
        if (!added) onAdd();
      }}
      aria-label={
        added ? `${exercise.nameHe} כבר באימון` : `הוספת ${exercise.nameHe} לאימון`
      }
      aria-pressed={added}
      className={cn(
        "tap group relative flex flex-col overflow-hidden rounded-2xl border bg-surface text-right shadow-soft transition-[border-color,box-shadow]",
        added
          ? "border-[color:var(--accent-strength)] ring-2 ring-[color:var(--accent-strength)]/35"
          : "border-border hover:border-border-strong",
      )}
    >
      <div className="relative">
        <ExerciseImage
          imagePath={exercise.imagePath}
          alt={exercise.nameHe}
          muscleGroup={exercise.muscleGroup}
          imageKey={exercise.imageKey}
          sizes="(max-width: 448px) 45vw, 200px"
          className="aspect-square w-full rounded-none"
        />

        {/* Subtle "has a demo video" indicator — never a player, just a hint. */}
        {exercise.video && (
          <span
            className="absolute start-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            aria-label="קיימת הדגמת וידאו"
            title="קיימת הדגמת וידאו"
          >
            <PlayIcon className="h-3 w-3" />
          </span>
        )}

        {added && (
          <span className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--accent-strength)] text-[color:var(--accent-contrast)] shadow-glow-strength">
            <CheckIcon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-bold leading-tight text-foreground">
            {exercise.nameHe}
          </p>
          <p className="truncate text-[11px] text-faint">{exercise.nameEn}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center rounded-full bg-[color:var(--accent-strength-soft)] px-2 py-0.5 text-[10.5px] font-bold text-[color:var(--accent-strength)]">
            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-semibold text-muted">
            {EQUIPMENT_LABELS[exercise.equipment]}
          </span>
        </div>

        <span
          className={cn(
            "mt-auto inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11.5px] font-bold",
            added
              ? "strength-gradient text-[color:var(--accent-contrast)]"
              : "bg-[color:var(--accent-strength-soft)] text-[color:var(--accent-strength)] group-hover:brightness-95",
          )}
        >
          {added ? (
            <>
              <CheckIcon className="h-3.5 w-3.5" />
              נוסף לאימון
            </>
          ) : (
            <>
              <PlusIcon className="h-3.5 w-3.5" />
              הוסף לאימון
            </>
          )}
        </span>
      </div>
    </button>
  );
}
