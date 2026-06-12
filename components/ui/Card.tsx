import { cn } from "@/lib/utils";

type CardVariant = "default" | "raised" | "flat";

const VARIANTS: Record<CardVariant, string> = {
  // Standard surface card with soft layered shadow.
  default: "bg-surface border border-border shadow-soft",
  // More elevated, for hero / featured content.
  raised: "bg-surface-raised border border-border shadow-float",
  // Quiet inset, no shadow — for nested groupings.
  flat: "bg-surface-2 border border-border",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn("rounded-2xl p-4", VARIANTS[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[15px] font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardLabel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.08em] text-faint",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
