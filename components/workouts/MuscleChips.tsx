import type { CSSProperties } from "react";
import type { MuscleGroup } from "@/lib/fitness-types";
import { MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";
import { muscleGroupColor } from "@/lib/workout-theme";

/**
 * Refined muscle-group chips shared by template cards and workout history. Each
 * chip now paints itself in its own muscle group's identity colour (soft fill +
 * matching dot + text), so a card's muscle mix reads at a glance while the card's
 * dominant identity still leads. Colours resolve per-theme in CSS, so chips stay
 * tasteful in both light and dark — not a noisy rainbow.
 */
export function MuscleChips({ groups }: { groups: MuscleGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((m) => {
        const { accent, soft } = muscleGroupColor(m);
        return (
          <span
            key={m}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
            style={
              { background: soft, color: accent } as CSSProperties
            }
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent }}
            />
            {MUSCLE_GROUP_LABELS[m]}
          </span>
        );
      })}
    </div>
  );
}
