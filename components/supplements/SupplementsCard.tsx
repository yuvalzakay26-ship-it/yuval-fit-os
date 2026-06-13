"use client";

import Link from "next/link";
import {
  activeSupplements,
  supplementDaySummary,
  takenSupplementIds,
} from "@/lib/analytics";
import {
  toggleSupplementTaken,
  useSupplementLogs,
  useSupplements,
} from "@/lib/fitness-store";
import type { Supplement } from "@/lib/fitness-types";
import { todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ChevronIcon, PillIcon, PlusIcon } from "@/components/ui/icons";
import { SupplementCheck } from "./SupplementCheck";
import {
  SUPPLEMENT_CATEGORY_LABELS,
  SUPPLEMENT_TIMING_LABELS,
  supplementStatusLine,
} from "./supplement-copy";

const COMPACT_LIMIT = 3;

/** A short "morning · evening" timing line, falling back to the category label. */
function metaLine(s: Supplement): string {
  const times = s.schedule?.timesOfDay ?? [];
  if (times.length > 0) {
    return times.map((t) => SUPPLEMENT_TIMING_LABELS[t]).join(" · ");
  }
  return SUPPLEMENT_CATEGORY_LABELS[s.category];
}

/**
 * Compact supplements section for Today (and reusable elsewhere). Shows a
 * violet completion ring, a "X מתוך Y סומנו" summary, the first few active
 * items with their premium taken-toggles, and a link into the full screen.
 * When nothing is defined yet it shows a calm prompt to add a first item.
 * Reads/writes today's logs directly through the store. localStorage-only.
 */
export function SupplementsCard() {
  const supplements = useSupplements();
  const logs = useSupplementLogs();
  const today = todayISO();

  const active = activeSupplements(supplements);
  const taken = takenSupplementIds(logs, today);
  const summary = supplementDaySummary(supplements, logs, today);

  if (active.length === 0) {
    return (
      <Card className="relative overflow-hidden p-4">
        <div
          className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-50 blur-2xl"
          style={{ background: "var(--accent-supplement-soft)" }}
        />
        <div className="relative flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
            <PillIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-foreground">
              עדיין לא הוגדרו תוספים
            </p>
            <p className="text-[12.5px] text-muted">
              אפשר להוסיף פריטים למעקב אישי.
            </p>
          </div>
        </div>
        <Link href="/nutrition/supplements/add" className="tap mt-3.5 block">
          <Button className="w-full supplement-gradient shadow-glow-supplement">
            <PlusIcon className="h-5 w-5" /> הוסף תוסף
          </Button>
        </Link>
      </Card>
    );
  }

  const shown = active.slice(0, COMPACT_LIMIT);
  const more = active.length - shown.length;

  return (
    <Card className="relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-50 blur-2xl"
        style={{ background: "var(--accent-supplement-soft)" }}
      />
      <div className="relative flex items-center gap-4">
        <ProgressRing
          value={summary.taken}
          goal={summary.active}
          size={64}
          stroke={7}
          gradientId="supplements-today-ring"
          from="var(--accent-supplement)"
          to="var(--accent-supplement)"
        >
          <span className="text-[15px] font-extrabold leading-none tabular-nums text-foreground">
            {summary.taken}/{summary.active}
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              תוספים היום
            </p>
            <Link
              href="/nutrition/supplements"
              aria-label="פתח מעקב תוספים"
              className="tap -m-1 flex items-center gap-0.5 p-1 text-[12px] font-semibold text-[color:var(--accent-supplement)]"
            >
              פתח
              <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
          <p className="mt-0.5 text-[15px] font-bold leading-tight text-foreground">
            {summary.taken} מתוך {summary.active} סומנו
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {supplementStatusLine(summary.taken, summary.active)}
          </p>
        </div>
      </div>

      <div className="relative mt-3.5 space-y-2">
        {shown.map((s) => {
          const isTaken = taken.has(s.id);
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
                <PillIcon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-foreground">
                  {s.name}
                </p>
                <p className="truncate text-[11.5px] text-muted">{metaLine(s)}</p>
              </div>
              <SupplementCheck
                size="sm"
                taken={isTaken}
                name={s.name}
                onToggle={() => toggleSupplementTaken(s.id, today)}
              />
            </div>
          );
        })}
        {more > 0 && (
          <Link
            href="/nutrition/supplements"
            className="tap block py-1 text-center text-[12px] font-semibold text-[color:var(--accent-supplement)]"
          >
            ועוד {more} ›
          </Link>
        )}
      </div>
    </Card>
  );
}
