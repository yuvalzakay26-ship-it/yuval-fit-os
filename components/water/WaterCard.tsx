"use client";

import Link from "next/link";
import {
  resolveWaterPresets,
  TODAY_WATER_PRESET_COUNT,
  todaysWaterMl,
} from "@/lib/analytics";
import { logWater, useSettings, useWaterLogs } from "@/lib/fitness-store";
import { DEFAULT_WATER_GOAL_ML } from "@/lib/fitness-types";
import { getWaterStatus } from "@/lib/water-status";
import { cn, formatLiters, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { ChevronIcon } from "@/components/ui/icons";
import { WaterGauge } from "./WaterGauge";
import { WaterGoalBanner } from "./WaterGoalBanner";
import { WaterPresetChips } from "./WaterPresetChips";
import { waterStatusLine, waterStatusTheme } from "./water-copy";

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
  // Keep Today compact: only the leading "most useful" presets.
  const presets = resolveWaterPresets(settings).slice(0, TODAY_WATER_PRESET_COUNT);

  // Shared status drives the colour of the whole card so Today/Nutrition shift
  // from blue → amber → rose alongside the detail screen (no longer always blue
  // once the user is over the goal). See lib/water-status.ts.
  const { status } = getWaterStatus(total, goal);
  const theme = waterStatusTheme(status);
  // Surface the careful over-goal copy (incl. the non-medical caution line) right
  // here, so the warning is visible without opening /nutrition/water.
  const showBanner = status === "attention" || status === "caution";
  const lineEmphasised = status === "attention" || status === "caution";

  const handleAdd = (ml: number) => logWater(todayISO(), ml);

  return (
    <Card className={cn(theme.module, theme.glow, "sheen relative overflow-hidden p-4")}>
      <div
        className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full opacity-60 blur-2xl"
        style={{ background: theme.glowBg }}
      />
      <div className="relative flex items-center gap-4">
        <WaterGauge value={total} goal={goal} size={78} tintVars={theme.gaugeVars} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cn("text-[11px] font-semibold uppercase tracking-wide", theme.accentText)}>
              {title}
            </p>
            <Link
              href="/nutrition/water"
              aria-label="פתח מעקב מים"
              className={cn(
                "tap -m-1 flex items-center gap-0.5 rounded-full px-2 py-1 text-[12px] font-semibold",
                theme.chip,
              )}
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
          <p className={cn("mt-0.5 text-[12px]", lineEmphasised ? cn("font-semibold", theme.accentText) : "text-muted")}>
            {waterStatusLine(total, goal)}
          </p>
        </div>
      </div>

      {showBanner && (
        <WaterGoalBanner totalMl={total} goalMl={goal} compact className="relative mt-3.5" />
      )}

      <WaterPresetChips
        presets={presets}
        onAdd={handleAdd}
        className="relative mt-3.5"
      />
    </Card>
  );
}
