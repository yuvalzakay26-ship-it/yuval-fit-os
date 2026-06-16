import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-start justify-between gap-3", className)}>
      <div>
        <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  hint,
  action,
  accent,
  className,
}: {
  title: string;
  /** Optional one-line helper under the title, clarifying the section's role
   *  (e.g. status snapshot vs. actions). Kept short to avoid clutter. */
  hint?: string;
  action?: React.ReactNode;
  /** Optional CSS color for a small leading dot, giving sections module identity. */
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-2", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-faint">
          {accent && (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent }}
            />
          )}
          {title}
        </h2>
        {hint && (
          <p className="mt-1 text-[11.5px] font-medium leading-tight text-faint">
            {hint}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  accent,
  accentSoft,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Optional module accent for the icon badge so an empty state keeps its
   *  module identity (e.g. water cyan, supplement violet) instead of always
   *  rendering the brand accent — which read as repeated green in dark mode. */
  accent?: string;
  accentSoft?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border-strong bg-surface/40 px-6 py-12 text-center">
      {icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent"
          style={
            accent
              ? { background: accentSoft ?? accent, color: accent }
              : undefined
          }
        >
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[15rem] text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
