import { Card } from "@/components/ui/Card";

export function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="space-y-2 p-4">
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
          {icon}
        </span>
      )}
      <div>
        <p className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
          {value}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-muted">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-faint">{hint}</p>}
      </div>
    </Card>
  );
}
