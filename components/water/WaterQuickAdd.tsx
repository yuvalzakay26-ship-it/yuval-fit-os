"use client";

import { WATER_QUICK_ADD_ML } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { GlassIcon } from "@/components/ui/icons";

/**
 * The shared +250 / +500 / +750 quick-add row used everywhere water can be
 * logged (Today, Nutrition, the detail screen). Each tap calls `onAdd(ml)`.
 */
export function WaterQuickAdd({
  onAdd,
  className,
}: {
  onAdd: (ml: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {WATER_QUICK_ADD_ML.map((ml) => (
        <button
          key={ml}
          type="button"
          onClick={() => onAdd(ml)}
          aria-label={`הוסף ${ml} מ"ל`}
          className="tap flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface-2 py-2.5 text-[color:var(--accent-water)] hover:border-[color:var(--accent-water)] hover:bg-[color:var(--accent-water-soft)]"
        >
          <GlassIcon className="h-[18px] w-[18px]" />
          <span className="text-[13px] font-bold text-foreground">
            +{ml} <span className="text-[11px] font-semibold text-muted">{`מ"ל`}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
