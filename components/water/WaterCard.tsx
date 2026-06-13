"use client";

import Link from "next/link";
import { todaysWaterMl } from "@/lib/analytics";
import { logWater, useSettings, useWaterLogs } from "@/lib/fitness-store";
import { DEFAULT_WATER_GOAL_ML } from "@/lib/fitness-types";
import { formatLiters, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { ChevronIcon } from "@/components/ui/icons";
import { WaterGauge } from "./WaterGauge";
import { WaterQuickAdd } from "./WaterQuickAdd";
import { waterStatusLine } from "./water-copy";

/**
 * Compact hydration card shared by Today and Nutrition. Shows the gauge, a
 * litres-of-goal line, a calm status copy, the quick-add row, and a link into
 * the full water screen. Reads/writes today's log directly through the store.
 */
export function WaterCard({ title = "מים היום" }: { title?: string }) {
  const logs = useWaterLogs();
  const settings = useSettings();

  const goal = settings.waterGoalMl ?? DEFAULT_WATER_GOAL_ML;
  const total = todaysWaterMl(logs);

  const handleAdd = (ml: number) => logWater(todayISO(), ml);

  return (
    <Card className="module-water sheen relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-60 blur-2xl"
        style={{ background: "var(--accent-water-soft)" }}
      />
      <div className="relative flex items-center gap-4">
        <WaterGauge value={total} goal={goal} size={78} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-water)]">
              {title}
            </p>
            <Link
              href="/nutrition/water"
              aria-label="פתח מעקב מים"
              className="tap -m-1 flex items-center gap-0.5 rounded-full bg-[color:var(--accent-water-soft)] px-2 py-1 text-[12px] font-semibold text-[color:var(--accent-water)]"
            >
              פתח
              <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
          <p className="mt-0.5 text-[15px] font-bold leading-tight text-foreground">
            {formatLiters(total)} ליטר{" "}
            <span className="text-[13px] font-medium text-muted">
              מתוך {formatLiters(goal)} ליטר
            </span>
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {waterStatusLine(total, goal)}
          </p>
        </div>
      </div>

      <WaterQuickAdd onAdd={handleAdd} className="relative mt-3.5" />
    </Card>
  );
}
