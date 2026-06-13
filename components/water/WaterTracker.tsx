"use client";

import { useState } from "react";
import Link from "next/link";
import { waterForDate } from "@/lib/analytics";
import {
  logWater,
  removeWaterEntry,
  resetWaterDay,
  useSettings,
  useWaterLogs,
} from "@/lib/fitness-store";
import { DEFAULT_WATER_GOAL_ML } from "@/lib/fitness-types";
import { formatLiters, parseOptionalNumber, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState, PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import {
  ChevronIcon,
  DropletIcon,
  PlusWaterIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { WaterGauge } from "./WaterGauge";
import { WaterQuickAdd } from "./WaterQuickAdd";
import { WATER_HELPER_COPY, waterStatusLine } from "./water-copy";

const TIME_FORMAT = new Intl.DateTimeFormat("he-IL", {
  hour: "2-digit",
  minute: "2-digit",
});

function entryTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : TIME_FORMAT.format(date);
}

/**
 * Full-screen water tracking detail (route `/nutrition/water`). Premium gauge,
 * quick-add + custom amount, today's entries with per-entry delete, and a
 * confirm-gated "reset today". localStorage-only via the store.
 */
export function WaterTracker() {
  const logs = useWaterLogs();
  const settings = useSettings();
  const [customMl, setCustomMl] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);

  const today = todayISO();
  const goal = settings.waterGoalMl ?? DEFAULT_WATER_GOAL_ML;
  const log = waterForDate(logs, today);
  const total = log?.totalMl ?? 0;
  const entries = log ? [...log.entries].reverse() : []; // newest first
  const reached = goal > 0 && total >= goal;
  const remaining = Math.max(0, goal - total);

  const handleAdd = (ml: number) => logWater(today, ml);

  const handleCustomAdd = () => {
    const ml = parseOptionalNumber(customMl);
    if (ml && ml > 0) {
      logWater(today, Math.round(ml));
      setCustomMl("");
    }
  };

  const handleReset = () => {
    resetWaterDay(today);
    setConfirmingReset(false);
  };

  return (
    <div>
      <Link
        href="/nutrition"
        className="tap mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent-water)]"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        תזונה
      </Link>

      <PageHeader title="מעקב מים" subtitle="כמה מים שתית היום" className="mb-4" />

      {/* Hero gauge */}
      <Card variant="raised" className="relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full opacity-50 blur-2xl"
          style={{ background: "var(--accent-water-soft)" }}
        />
        <div className="relative flex flex-col items-center text-center">
          <WaterGauge value={total} goal={goal} size={168} />
          <p className="mt-4 text-[26px] font-extrabold leading-none tabular-nums text-foreground">
            {formatLiters(total)}
            <span className="text-[15px] font-semibold text-muted">
              {" "}
              / {formatLiters(goal)} ליטר
            </span>
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-muted">
            {reached
              ? "הגעת ליעד המים היום 🎉"
              : `נותרו ${formatLiters(remaining)} ליטר · ${waterStatusLine(total, goal)}`}
          </p>
        </div>
      </Card>

      {/* Quick add */}
      <section className="mt-6">
        <SectionHeader title="הוספה מהירה" />
        <WaterQuickAdd onAdd={handleAdd} />

        {/* Custom amount */}
        <div className="mt-2.5 flex items-stretch gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder='כמות אחרת (מ"ל)'
            aria-label='כמות מותאמת במ"ל'
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomAdd();
            }}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleCustomAdd}
            disabled={!(parseOptionalNumber(customMl) ?? 0)}
            className="water-gradient shrink-0 shadow-glow-water"
            aria-label="הוסף כמות מותאמת"
          >
            <PlusWaterIcon className="h-5 w-5" />
            הוסף
          </Button>
        </div>
      </section>

      {/* Today's entries */}
      <section className="mt-6">
        <SectionHeader
          title={`רשומות היום${entries.length ? ` · ${entries.length}` : ""}`}
        />
        {entries.length === 0 ? (
          <EmptyState
            icon={<DropletIcon className="h-7 w-7" />}
            title="עדיין לא נרשמו מים היום"
            description={WATER_HELPER_COPY}
          />
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry) => (
              <Card key={entry.id} className="flex items-center gap-3 p-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]">
                  <DropletIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-foreground">
                    {entry.amountMl} {`מ"ל`}
                  </p>
                  {entryTime(entry.createdAt) && (
                    <p className="text-[12px] text-muted">
                      {entryTime(entry.createdAt)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeWaterEntry(today, entry.id)}
                  className="tap -m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-red-500"
                  aria-label="מחיקת רשומה"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Reset today — only offered when there is something to reset. */}
      {entries.length > 0 && (
        <section className="mt-6">
          {confirmingReset ? (
            <Card className="space-y-3 p-4">
              <p className="text-[13px] leading-relaxed text-muted">
                לאפס את כל רשומות המים של היום? פעולה זו לא משפיעה על ימים קודמים.
              </p>
              <div className="flex gap-2.5">
                <Button variant="danger" onClick={handleReset} className="flex-1">
                  <TrashIcon className="h-[18px] w-[18px]" /> כן, אפס את היום
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmingReset(false)}
                >
                  ביטול
                </Button>
              </div>
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="tap mx-auto block text-[13px] font-semibold text-faint hover:text-red-500"
            >
              אפס את היום
            </button>
          )}
        </section>
      )}

      <p className="mt-6 text-center text-[12px] leading-relaxed text-faint">
        {WATER_HELPER_COPY}
      </p>
    </div>
  );
}
