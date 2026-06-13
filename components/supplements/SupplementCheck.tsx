"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/ui/icons";

/**
 * The premium "mark as taken" habit toggle. A circular target that reads clearly
 * in both states: a quiet outlined ring when unmarked, and a confident, glowing
 * supplement-gradient disc with a check when taken. Sized generously for touch.
 *
 * Pure presentational button — the parent owns the taken state and the toggle
 * handler (date-based, via the store).
 */
export function SupplementCheck({
  taken,
  onToggle,
  name,
  size = "md",
}: {
  taken: boolean;
  onToggle: () => void;
  /** Supplement name, woven into the accessible label. */
  name: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={taken}
      aria-label={taken ? `בטל סימון ל${name}` : `סמן ש${name} נלקח`}
      className={cn(
        "tap relative flex shrink-0 items-center justify-center rounded-full border-2",
        box,
        taken
          ? "supplement-gradient border-transparent text-[color:var(--accent-contrast)] shadow-glow-supplement"
          : "border-border-strong bg-surface-2 text-faint hover:border-[color:var(--accent-supplement)] hover:text-[color:var(--accent-supplement)] hover:bg-[color:var(--accent-supplement-soft)]",
      )}
    >
      {taken && (
        <>
          {/* One-shot glow ring as the mark lands. */}
          <span
            aria-hidden="true"
            className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-full bg-[color:var(--accent-supplement)]"
          />
          {/* Re-keyed so the springy stamp replays on every fresh mark. */}
          <CheckIcon key="taken" className={cn(icon, "relative animate-check-pop")} />
        </>
      )}
    </button>
  );
}
