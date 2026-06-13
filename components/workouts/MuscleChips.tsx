import type { MuscleGroup } from "@/lib/fitness-types";
import { MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";

/**
 * Refined muscle-group chips shared by template cards and workout history, so
 * the same readable, dotted strength chips render everywhere on the workouts
 * screen. A leading dot gives the chip a clearer at-a-glance identity than the
 * flat soft fill alone.
 */
export function MuscleChips({ groups }: { groups: MuscleGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((m) => (
        <span
          key={m}
          className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--accent-strength-soft)] px-2.5 py-1 text-[11px] font-semibold leading-none text-[color:var(--accent-strength)]"
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--accent-strength)" }}
          />
          {MUSCLE_GROUP_LABELS[m]}
        </span>
      ))}
    </div>
  );
}
