import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "muted" | "solid";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-foreground border border-border",
  accent: "bg-[color:var(--accent-soft)] text-accent border border-transparent",
  muted: "bg-surface-2 text-muted border border-border",
  solid: "brand-gradient text-[color:var(--accent-contrast)] border border-transparent",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
