"use client";

import type { WaterPreset } from "@/lib/fitness-types";
import { cn } from "@/lib/utils";
import { waterPresetIcon } from "./water-presets";

/**
 * The premium quick-add row driven by the user's personal water presets. Each
 * chip shows a cup/bottle icon, the Hebrew label, and the configured amount;
 * tapping it calls `onAdd(amountMl)` which logs a normal `WaterEntry`. Shared by
 * the compact Today / Nutrition card (3 presets) and the full water screen (all
 * presets). `columns` keeps the grid tidy and overflow-free at phone widths.
 */
export function WaterPresetChips({
  presets,
  onAdd,
  columns = 3,
  className,
}: {
  presets: WaterPreset[];
  onAdd: (ml: number) => void;
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 ? "grid-cols-2" : "grid-cols-3",
        className,
      )}
    >
      {presets.map((preset) => {
        const Icon = waterPresetIcon(preset.icon);
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onAdd(preset.amountMl)}
            aria-label={`הוסף ${preset.label}, ${preset.amountMl} מ"ל`}
            className="tap group flex flex-col items-center gap-1.5 rounded-2xl border border-[color:var(--accent-water-soft)] bg-[color:var(--accent-water-soft)] px-2 py-3 text-[color:var(--accent-water)] hover:border-[color:var(--accent-water)] hover:brightness-[1.02]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-[color:var(--accent-water)] shadow-soft transition-transform group-active:scale-90">
              <Icon className="h-[20px] w-[20px]" />
            </span>
            <span className="max-w-full truncate text-[13px] font-bold leading-tight text-foreground">
              {preset.label}
            </span>
            <span className="text-[11px] font-semibold text-muted">
              {preset.amountMl} {`מ"ל`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
