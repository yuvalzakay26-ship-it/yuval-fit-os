import { cn } from "@/lib/utils";

/**
 * Lightweight circular progress indicator (SVG). Used for goal completion —
 * a calm, motivating visual, not a data chart.
 */
export function ProgressRing({
  value,
  goal,
  size = 72,
  stroke = 7,
  children,
  className,
  gradientId = "ringGradient",
  from = "var(--progress-from)",
  to = "var(--progress-to)",
}: {
  value: number;
  goal: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  className?: string;
  /**
   * Unique id for this ring's gradient def. Pass a distinct id when more than
   * one ring renders on the same screen, so the SVG defs never collide.
   */
  gradientId?: string;
  /** Gradient stops — default to the brand progress colours. */
  from?: string;
  to?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
  const dash = circumference * pct;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
