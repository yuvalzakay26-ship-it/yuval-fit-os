import type { NutritionTotals } from "@/lib/analytics";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { FlameIcon } from "@/components/ui/icons";

function MacroPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface-2 px-2 py-2.5 text-center">
      <p
        className={`text-[17px] font-extrabold tabular-nums leading-none ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {Math.round(value)}
        <span className="text-[11px] font-semibold text-faint">ג</span>
      </p>
      <p className="mt-1 text-[11px] font-medium text-faint">{label}</p>
    </div>
  );
}

function GoalBar({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="font-medium text-muted">{label}</span>
        <span className="font-bold tabular-nums text-foreground">
          {Math.round(value)} <span className="text-faint">/ {goal} {unit}</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="nutrition-gradient h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MacroSummary({
  totals,
  proteinGoal,
  calorieGoal,
}: {
  totals: NutritionTotals;
  proteinGoal?: number;
  calorieGoal?: number;
}) {
  return (
    <Card variant="raised" className="space-y-4 p-5">
      <div className="flex items-center gap-5">
        <ProgressRing value={totals.protein} goal={proteinGoal ?? 0} size={88} stroke={9}>
          <span className="text-[21px] font-extrabold leading-none text-foreground">
            {Math.round(totals.protein)}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold text-faint">חלבון</span>
        </ProgressRing>

        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
              <FlameIcon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-[20px] font-extrabold leading-none text-foreground">
                {Math.round(totals.calories)}
              </p>
              <p className="text-[11px] font-medium text-faint">קלוריות היום</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MacroPill label="פחמימות" value={totals.carbs} />
            <MacroPill label="שומן" value={totals.fat} />
          </div>
        </div>
      </div>

      {(proteinGoal || calorieGoal) && (
        <div className="space-y-3 border-t border-border pt-4">
          {proteinGoal ? (
            <GoalBar label="יעד חלבון" value={totals.protein} goal={proteinGoal} unit="ג" />
          ) : null}
          {calorieGoal ? (
            <GoalBar label="יעד קלוריות" value={totals.calories} goal={calorieGoal} unit="" />
          ) : null}
        </div>
      )}
    </Card>
  );
}
