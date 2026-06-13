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
          className="tap group flex flex-col items-center gap-1.5 rounded-2xl border border-[color:var(--accent-water-soft)] bg-[color:var(--accent-water-soft)] py-3 text-[color:var(--accent-water)] hover:border-[color:var(--accent-water)] hover:brightness-[1.02]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[color:var(--accent-water)] shadow-soft transition-transform group-active:scale-90">
            <GlassIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[13px] font-bold text-foreground">
            +{ml} <span className="text-[11px] font-semibold text-muted">{`מ"ל`}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
