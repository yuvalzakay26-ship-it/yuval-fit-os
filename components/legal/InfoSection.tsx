import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the informational / "legal-style" pages
 * (/privacy, /terms, /ai-disclaimer). These are plain, RTL, mobile-first
 * presentation components — they read no storage, call no API, and change no
 * app behaviour. They exist only so the three info pages share one calm, card
 * based visual language that feels like part of Fit OS rather than an external
 * legal PDF.
 */

/** A titled card section. Body content is rendered as relaxed muted text. */
export function InfoSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="raised" className={cn("space-y-2.5", className)}>
      <h2 className="text-[16px] font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-2.5 text-[13.5px] leading-relaxed text-muted">
        {children}
      </div>
    </Card>
  );
}

/** A simple RTL bullet list — markers sit on the right automatically. */
export function InfoList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--faint)]"
          />
          <span className="min-w-0 flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The calm "this is not legal advice" callout shown at the top of each info
 * page. Intentionally soft, not a scary banner.
 */
export function PlainLanguageNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/60 px-4 py-3 text-[12.5px] leading-relaxed text-muted">
      {children}
    </div>
  );
}
