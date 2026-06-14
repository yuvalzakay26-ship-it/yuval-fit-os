"use client";

import { useMemo, useRef, useState } from "react";
import type {
  MuscleGroup,
  SetEntry,
  WorkoutExerciseEntry,
  WorkoutSession,
} from "@/lib/fitness-types";
import {
  MUSCLE_GROUP_LABELS,
  getExerciseById,
  muscleGroupsForExercises,
} from "@/lib/seed-exercises";
import { addWorkout, useWorkouts } from "@/lib/fitness-store";
import { lastPerformance } from "@/lib/analytics";
import { cn, createId, formatSetsSummary, todayISO } from "@/lib/utils";
import { identityLabel, workoutIdentity } from "@/lib/workout-theme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import {
  CheckIcon,
  GripIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import { MuscleChips } from "./MuscleChips";
import { ExercisePicker } from "./ExercisePicker";

function emptySet(setNumber: number): SetEntry {
  return { setNumber, weightKg: 0, reps: 0, completed: false };
}

/**
 * Move one exercise entry from `fromIndex` to `toIndex`, returning a new array.
 *
 * The active-workout order is stored purely as the order of the `entries`
 * array, so reordering is just relocating an entry inside it. The *entire*
 * entry object is preserved — its sets, kg/reps, completed flags, exercise id,
 * everything — so no set data is ever lost or reset when reordering. Out-of-range
 * indices and no-op moves return the original array unchanged.
 */
export function moveWorkoutEntry<T>(
  entries: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= entries.length ||
    toIndex >= entries.length
  ) {
    return entries;
  }
  const next = entries.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** Prefill data for the builder (from a template or a duplicated workout). */
export interface BuilderSeed {
  title: string;
  entries: WorkoutExerciseEntry[];
}

export function WorkoutBuilder({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: BuilderSeed | null;
  onSaved: (session: WorkoutSession) => void;
  onCancel: () => void;
}) {
  const workouts = useWorkouts();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [entries, setEntries] = useState<WorkoutExerciseEntry[]>(
    initial?.entries ?? [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  // Reorder mode is a deliberate, explicit state (not always-on dragging) so
  // normal scrolling and set-input interactions never fight a drag gesture on
  // mobile. Entered via the "סדר תרגילים" pill, exited via "סיום סידור".
  const [reordering, setReordering] = useState(false);

  const usedIds = useMemo(() => new Set(entries.map((e) => e.exerciseId)), [entries]);

  // Recently-performed exercises, derived purely from history (newest-first),
  // de-duplicated. Surfaced as a quick "recently used" rail in the picker — no
  // new data model, nothing inferred.
  const recentIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const session of workouts) {
      for (const entry of session.exercises) {
        if (seen.has(entry.exerciseId)) continue;
        if (!getExerciseById(entry.exerciseId)) continue;
        seen.add(entry.exerciseId);
        ids.push(entry.exerciseId);
      }
    }
    return ids;
  }, [workouts]);

  const addExercise = (exerciseId: string) => {
    // Guard against duplicates so re-tapping in the picker can't add an
    // exercise twice — matches the builder's long-standing one-of-each rule.
    if (!exerciseId || usedIds.has(exerciseId)) return;
    setEntries((prev) => [...prev, { exerciseId, sets: [emptySet(1)] }]);
  };

  const removeExercise = (exerciseId: string) =>
    setEntries((prev) => prev.filter((e) => e.exerciseId !== exerciseId));

  // Reorder by array position. The whole entry object travels with the move, so
  // its sets / kg / reps / completed values stay attached to the right exercise.
  const moveEntry = (fromIndex: number, toIndex: number) =>
    setEntries((prev) => moveWorkoutEntry(prev, fromIndex, toIndex));

  const addSet = (exerciseId: string) =>
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: [...e.sets, emptySet(e.sets.length + 1)] }
          : e,
      ),
    );

  const removeSet = (exerciseId: string, setNumber: number) =>
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: e.sets
                .filter((s) => s.setNumber !== setNumber)
                .map((s, i) => ({ ...s, setNumber: i + 1 })),
            }
          : e,
      ),
    );

  const updateSet = (
    exerciseId: string,
    setNumber: number,
    patch: Partial<SetEntry>,
  ) =>
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.setNumber === setNumber ? { ...s, ...patch } : s,
              ),
            }
          : e,
      ),
    );

  const muscleGroups = useMemo<MuscleGroup[]>(
    () => muscleGroupsForExercises(entries.map((e) => e.exerciseId)),
    [entries],
  );

  // The whole session takes on one dominant muscle identity, so its hero,
  // progress bar and finish CTA all paint in the same hue instead of the old
  // uniform strength blue. Presentation only — derived, never stored.
  const identity = useMemo(() => workoutIdentity(muscleGroups), [muscleGroups]);
  const eyebrow = identityLabel(identity, MUSCLE_GROUP_LABELS);

  const totalSets = entries.reduce((n, e) => n + e.sets.length, 0);
  const completedSets = entries.reduce(
    (n, e) => n + e.sets.filter((s) => s.completed).length,
    0,
  );
  const progressPct = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  const canSave = entries.length > 0;

  // The "current" exercise is the first one still carrying an unfinished set —
  // it gets the live highlight + "עכשיו" badge. Once everything's ticked there
  // is no current exercise, so no misleading badge appears.
  const currentExerciseId = entries.find(
    (e) => e.sets.length === 0 || e.sets.some((s) => !s.completed),
  )?.exerciseId;

  const handleSave = () => {
    if (!canSave) return;
    const session: WorkoutSession = {
      id: createId("wk"),
      date: todayISO(),
      title: title.trim() || "אימון",
      muscleGroups,
      exercises: entries,
    };
    addWorkout(session);
    onSaved(session);
  };

  return (
    <div className="space-y-4">
      {/* ===== Active session hero ===== */}
      <Card
        variant="raised"
        style={identity.style}
        className="module-mg-duo sheen relative overflow-hidden p-5"
      >
        {/* Twin corner glows in the session's identity hue. */}
        <div
          className="pointer-events-none absolute -end-12 -top-14 h-40 w-40 rounded-full opacity-60 blur-2xl"
          style={{ background: "var(--mg-soft)" }}
        />
        <div
          className="pointer-events-none absolute -start-12 -bottom-12 h-36 w-36 rounded-full opacity-45 blur-2xl"
          style={{ background: "var(--mg-2-soft)" }}
        />

        <div className="relative space-y-4">
          {/* Eyebrow: a live pulse dot says "you're now training". */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: "var(--mg)" }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--mg)" }}
              />
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: "var(--mg)" }}
            >
              אימון פעיל
            </span>
            {muscleGroups.length > 0 && (
              <span className="truncate text-[11px] font-semibold text-faint">
                · {eyebrow}
              </span>
            )}
          </div>

          {/* Editable workout title — the headline of the session. */}
          <div>
            <Label htmlFor="workout-title">כותרת האימון</Label>
            <Input
              id="workout-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: אימון גב ויד אחורית"
              className="text-[17px] font-bold"
            />
          </div>

          {muscleGroups.length > 0 && <MuscleChips groups={muscleGroups} />}

          {/* At-a-glance session stats. */}
          <div className="grid grid-cols-3 gap-2.5">
            <SessionStat value={entries.length} label="תרגילים" />
            <SessionStat value={totalSets} label="סטים" />
            <SessionStat
              value={completedSets}
              label="בוצעו"
              accent
            />
          </div>

          {/* Workout progress. */}
          {totalSets > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wide text-muted">
                  התקדמות האימון
                </span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: "var(--mg)" }}
                >
                  {progressPct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="mg-gradient h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(progressPct, completedSets > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ===== Reorder control =====
          A small secondary pill above the exercise list, sitting next to the
          exercise count — never competing with the main finish CTA. Only useful
          with 2+ exercises. Toggles a dedicated reorder mode (see below) rather
          than making every card draggable all the time, so normal scrolling and
          set-input taps are never hijacked by a stray drag on mobile. */}
      {entries.length >= 2 && (
        <div className="flex items-center justify-between gap-2 px-0.5 pt-1">
          <span className="text-[12.5px] font-bold text-muted">
            <span className="tabular-nums">{entries.length}</span> תרגילים
          </span>
          <button
            type="button"
            onClick={() => setReordering((v) => !v)}
            aria-pressed={reordering}
            className={cn(
              "tap inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition-colors",
              reordering
                ? "border-transparent bg-foreground text-background shadow-soft"
                : "border-border-strong bg-surface-2 text-foreground hover:bg-surface",
            )}
          >
            <GripIcon className="h-4 w-4" />
            {reordering ? "סיום סידור" : "סדר תרגילים"}
          </button>
        </div>
      )}

      {/* ===== Exercise list =====
          In reorder mode the full editing cards are swapped for a calm, compact
          drag-only sortable list (grip handle + lightweight pointer/touch drag;
          arrow keys on the handle for accessibility — no visible up/down
          buttons). All data lives in `entries`, so reordering the array never
          touches a single kg/reps/completed value; the cards return in the new
          order with everything intact. */}
      {reordering && entries.length >= 2 ? (
        <ReorderList entries={entries} onMove={moveEntry} />
      ) : (
        entries.map((entry) => {
        const exercise = getExerciseById(entry.exerciseId);
        if (!exercise) return null;
        const previous = lastPerformance(workouts, entry.exerciseId);
        // Each card paints in its own muscle group's colour identity.
        const exIdentity = workoutIdentity([exercise.muscleGroup]);
        const doneSets = entry.sets.filter((s) => s.completed).length;
        const allDone = entry.sets.length > 0 && doneSets === entry.sets.length;
        const isCurrent = entry.exerciseId === currentExerciseId;

        return (
          <div
            key={entry.exerciseId}
            style={{
              ...exIdentity.style,
              ...(isCurrent ? { borderColor: "var(--mg)" } : {}),
            }}
            className={cn(
              "module-mg sheen relative overflow-hidden rounded-2xl border border-border bg-surface-2 p-3.5 transition-shadow",
              isCurrent && "shadow-glow-mg",
            )}
          >
            {/* Soft identity glow in the top corner. */}
            <div
              className="pointer-events-none absolute -end-8 -top-10 h-24 w-24 rounded-full opacity-50 blur-2xl"
              style={{ background: "var(--mg-soft)" }}
            />

            <div className="relative">
              {/* Header: image · title · status · delete. */}
              <div className="flex items-start gap-3">
                <ExerciseImage
                  imagePath={exercise.imagePath}
                  alt={exercise.nameHe}
                  muscleGroup={exercise.muscleGroup}
                  imageKey={exercise.imageKey}
                  sizes="56px"
                  className="h-14 w-14 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: "var(--mg)" }}
                    >
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                    </span>
                    {isCurrent && (
                      <span className="mg-gradient inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-[color:var(--accent-contrast)]">
                        עכשיו
                      </span>
                    )}
                    {allDone && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        <CheckIcon className="h-3 w-3" /> הושלם
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[15px] font-bold leading-tight text-foreground">
                    {exercise.nameHe}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted">
                    {previous ? (
                      <>
                        פעם קודמת:{" "}
                        <span dir="ltr" className="font-semibold tabular-nums">
                          {formatSetsSummary(previous.sets)}
                        </span>
                      </>
                    ) : (
                      "אין ביצוע קודם עדיין"
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeExercise(entry.exerciseId)}
                  className="tap -m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint/70 hover:bg-red-500/10 hover:text-red-500"
                  aria-label="הסרת תרגיל"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Sets header. */}
              <div className="mt-3 grid grid-cols-[1.5rem_1fr_1fr_2.25rem_1.5rem] items-center gap-2 px-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">
                <span className="text-center">סט</span>
                <span className="text-center">ק&quot;ג</span>
                <span className="text-center">חזרות</span>
                <span className="text-center">בוצע</span>
                <span />
              </div>

              {/* Set rows. */}
              <div className="mt-1 space-y-1">
                {entry.sets.map((set) => (
                  <div
                    key={set.setNumber}
                    className={cn(
                      "grid grid-cols-[1.5rem_1fr_1fr_2.25rem_1.5rem] items-center gap-2 rounded-xl py-1 transition-colors",
                      set.completed && "bg-[color:var(--mg-soft)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center justify-self-center rounded-lg text-[12px] font-bold tabular-nums transition-colors",
                        set.completed
                          ? "text-[color:var(--mg)]"
                          : "bg-surface text-muted",
                      )}
                    >
                      {set.setNumber}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      className="h-10 bg-surface px-2 text-center text-[15px] font-semibold"
                      value={set.weightKg || ""}
                      onChange={(e) =>
                        updateSet(entry.exerciseId, set.setNumber, {
                          weightKg: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="h-10 bg-surface px-2 text-center text-[15px] font-semibold"
                      value={set.reps || ""}
                      onChange={(e) =>
                        updateSet(entry.exerciseId, set.setNumber, {
                          reps: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        updateSet(entry.exerciseId, set.setNumber, {
                          completed: !set.completed,
                        })
                      }
                      aria-label="סימון סט כבוצע"
                      aria-pressed={set.completed}
                      className={cn(
                        "tap flex h-9 w-9 items-center justify-center justify-self-center rounded-xl border transition-all",
                        set.completed
                          ? "mg-gradient shadow-glow-mg border-transparent text-[color:var(--accent-contrast)]"
                          : "border-border bg-surface text-faint",
                      )}
                    >
                      <CheckIcon className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      onClick={() => removeSet(entry.exerciseId, set.setNumber)}
                      className="tap flex h-8 w-full items-center justify-center rounded-lg text-faint/60 hover:text-red-500"
                      aria-label="הסרת סט"
                    >
                      <TrashIcon className="h-[15px] w-[15px]" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(entry.exerciseId)}
                className="tap mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong/70 py-2 text-[12.5px] font-bold transition-colors hover:bg-[color:var(--mg-soft)]"
                style={{ color: "var(--mg)" }}
              >
                <PlusIcon className="h-4 w-4" /> הוספת סט
              </button>
            </div>
          </div>
        );
        })
      )}

      {/* ===== Add exercise — opens the full-screen visual picker. =====
          Hidden while reordering to keep that mode focused and calm; it returns
          the moment the user taps "סיום סידור". */}
      {!reordering && (
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="tap flex w-full items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface-2/60 px-4 py-3.5 text-right hover:border-[color:var(--accent-strength)] hover:bg-surface-2"
      >
        <span className="strength-gradient shadow-glow-strength flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)]">
          <PlusIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-bold text-foreground">
            {entries.length === 0 ? "בחר תרגיל ראשון" : "הוסף עוד תרגיל"}
          </span>
          <span className="block text-[12px] text-muted">
            דפדף עם תמונות, חפש או סנן לפי קבוצת שריר
          </span>
        </span>
        <SearchIcon className="h-[18px] w-[18px] shrink-0 text-faint" />
      </button>
      )}

      {/* ===== Finish / save =====
          The identity custom properties (--mg*) only exist where they are
          spread inline, and this block is a sibling of the hero — so it carries
          its own `identity.style`. Without it, the enabled gradient and the
          disabled tint would both resolve against an *undefined* --mg and wash
          out to invisible. Each state is styled explicitly (never relying on the
          base Button's faded `disabled:opacity-50`) so the CTA always reads
          clearly in both themes. */}
      <div style={identity.style} className="space-y-2.5 pt-1">
        {canSave ? (
          <p className="text-center text-[12.5px] font-semibold text-muted">
            <span
              className="tabular-nums"
              style={completedSets > 0 ? { color: "var(--mg)" } : undefined}
            >
              {completedSets}
            </span>{" "}
            מתוך <span className="tabular-nums">{totalSets}</span> סטים בוצעו
          </p>
        ) : (
          <p className="text-center text-[12.5px] font-semibold text-muted">
            הוסף תרגיל אחד כדי להפעיל את שמירת האימון
          </p>
        )}
        <div className="flex gap-2.5">
          {canSave ? (
            <Button
              onClick={handleSave}
              size="lg"
              className="mg-gradient shadow-glow-mg sheen flex-1"
            >
              <CheckIcon className="h-5 w-5" /> סיים ושמור אימון
            </Button>
          ) : (
            // Disabled, but deliberately *visible*: a solid surface fill, a
            // strong border and readable muted text — clearly "temporarily
            // unavailable", never white-on-white. No opacity wash.
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex h-12 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-border-strong bg-surface px-5 text-[15px] font-bold text-muted shadow-soft"
            >
              <CheckIcon className="h-5 w-5 text-faint" /> סיים ושמור אימון
            </button>
          )}
          <Button variant="secondary" size="lg" onClick={onCancel}>
            ביטול
          </Button>
        </div>
      </div>

      {pickerOpen && (
        <ExercisePicker
          onClose={() => setPickerOpen(false)}
          onAdd={addExercise}
          selectedIds={usedIds}
          recentIds={recentIds}
        />
      )}
    </div>
  );
}

/**
 * The active-workout reorder mode: a compact, calm, **drag-only** sortable list
 * of the exercises — no visible up/down buttons, no delete, no inputs.
 *
 * Reordering uses a lightweight, dependency-free **Pointer Events** drag (works
 * for mouse *and* touch, unlike native HTML5 DnD which is unreliable on mobile):
 * pressing the grip handle captures the pointer and the list reorders live as
 * the finger/cursor passes other rows. The grip is also a real focusable button
 * so keyboard users can move a row with ArrowUp / ArrowDown — accessible without
 * cluttering the UI with arrow controls.
 *
 * It renders order only; every kg/reps/completed value stays in `entries` and is
 * never touched here — moving a row just relocates its entry in the array via
 * `moveWorkoutEntry`.
 */
function ReorderList({
  entries,
  onMove,
}: {
  entries: WorkoutExerciseEntry[];
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  // One ref per row, so a pointer Y coordinate can be mapped to a target index.
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);
  // The row being dragged (drives the lifted/active visual). Mirrored in a ref so
  // the pointer-move handler always reads the latest index after a live reorder.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeRef = useRef<number | null>(null);
  const setActive = (index: number | null) => {
    activeRef.current = index;
    setActiveIndex(index);
  };

  // The insertion index for a given client-Y: the first row whose vertical
  // midpoint sits below the pointer, else the last row (clamped to the ends).
  const indexAtY = (y: number): number => {
    const rows = rowRefs.current;
    for (let i = 0; i < rows.length; i++) {
      const el = rows[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return rows.length - 1;
  };

  const startDrag = (index: number, e: React.PointerEvent<HTMLButtonElement>) => {
    // Primary button / touch / pen only.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Capture so every subsequent move/up for this pointer lands on the handle —
    // the key to reliable touch dragging without native HTML5 DnD.
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(index);
  };

  const onDragMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const from = activeRef.current;
    if (from === null) return;
    e.preventDefault(); // stop the page from scrolling under the drag
    const to = indexAtY(e.clientY);
    if (to >= 0 && to !== from) {
      onMove(from, to);
      setActive(to);
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (activeRef.current === null) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    setActive(null);
  };

  // Keyboard fallback on the handle — accessible reordering with no visible
  // arrow buttons. Home/End jump to the ends.
  const onHandleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    let to = index;
    if (e.key === "ArrowUp") to = index - 1;
    else if (e.key === "ArrowDown") to = index + 1;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = entries.length - 1;
    else return;
    e.preventDefault();
    onMove(index, to);
  };

  return (
    <div className="space-y-2">
      <p className="px-0.5 text-[12px] font-medium text-muted">
        גרור כדי לשנות את סדר התרגילים
      </p>
      <ul className="space-y-2">
        {entries.map((entry, index) => {
          const exercise = getExerciseById(entry.exerciseId);
          if (!exercise) return null;
          const exIdentity = workoutIdentity([exercise.muscleGroup]);
          const doneSets = entry.sets.filter((s) => s.completed).length;
          const dragging = activeIndex === index;

          return (
            <li
              key={entry.exerciseId}
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              style={exIdentity.style}
              className={cn(
                "module-mg flex select-none items-center gap-2 rounded-2xl border bg-surface-2 p-2.5 transition-[transform,box-shadow]",
                dragging
                  ? "relative z-10 scale-[1.02] border-[color:var(--mg)] shadow-glow-mg"
                  : "border-border",
              )}
            >
              {/* Grip handle — the *only* reorder control: drag (pointer/touch)
                  or ArrowUp/ArrowDown when focused. `touch-none` stops the page
                  scrolling when a touch drag starts on the handle. */}
              <button
                type="button"
                onPointerDown={(e) => startDrag(index, e)}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={(e) => onHandleKeyDown(index, e)}
                aria-label={`שינוי מיקום: ${exercise.nameHe}. גרור או השתמש בחיצים למעלה ולמטה`}
                className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-faint transition-colors hover:bg-[color:var(--mg-soft)] hover:text-[color:var(--mg)] active:cursor-grabbing"
              >
                <GripIcon className="h-5 w-5" />
              </button>

              <ExerciseImage
                imagePath={exercise.imagePath}
                alt={exercise.nameHe}
                muscleGroup={exercise.muscleGroup}
                imageKey={exercise.imageKey}
                sizes="44px"
                className="h-11 w-11 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <span
                  className="block text-[9.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: "var(--mg)" }}
                >
                  {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                </span>
                <p className="truncate text-[14px] font-bold leading-tight text-foreground">
                  {exercise.nameHe}
                </p>
                <p className="mt-0.5 text-[11px] text-faint">
                  <span className="tabular-nums">{entry.sets.length}</span> סטים
                  {doneSets > 0 && (
                    <>
                      {" · "}
                      <span className="tabular-nums">{doneSets}</span> בוצעו
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A single compact session-summary stat tile in the active-workout hero. */
function SessionStat({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-3 py-2.5">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-1 rounded-full"
        style={{ background: "var(--mg)" }}
      />
      <p
        className="text-[20px] font-extrabold leading-none tabular-nums"
        style={accent ? { color: "var(--mg)" } : undefined}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-faint">{label}</p>
    </div>
  );
}
