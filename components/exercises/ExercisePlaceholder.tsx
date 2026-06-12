import type { Equipment, MuscleGroup } from "@/lib/fitness-types";
import { MUSCLE_GROUP_LABELS } from "@/lib/seed-exercises";
import { cn } from "@/lib/utils";
import { DumbbellIcon } from "@/components/ui/icons";

// Calm, distinct gradient per muscle group. Swap this whole component for a
// real <Image src=`/exercises/${imageKey}.jpg` /> later — the API is stable.
const GRADIENTS: Record<MuscleGroup, string> = {
  back: "from-sky-400/30 via-sky-500/15 to-blue-600/20 text-sky-50",
  chest: "from-rose-400/30 via-rose-500/15 to-red-600/20 text-rose-50",
  shoulders: "from-amber-400/30 via-amber-500/15 to-orange-600/20 text-amber-50",
  legs: "from-violet-400/30 via-violet-500/15 to-purple-600/20 text-violet-50",
  glutes: "from-fuchsia-400/30 via-fuchsia-500/15 to-pink-600/20 text-fuchsia-50",
  biceps: "from-emerald-400/30 via-emerald-500/15 to-green-600/20 text-emerald-50",
  triceps: "from-teal-400/30 via-teal-500/15 to-cyan-600/20 text-teal-50",
  core: "from-orange-400/30 via-orange-500/15 to-amber-600/20 text-orange-50",
};

const SOLID: Record<MuscleGroup, string> = {
  back: "bg-sky-500",
  chest: "bg-rose-500",
  shoulders: "bg-amber-500",
  legs: "bg-violet-500",
  glutes: "bg-fuchsia-500",
  biceps: "bg-emerald-500",
  triceps: "bg-teal-500",
  core: "bg-orange-500",
};

export function ExercisePlaceholder({
  muscleGroup,
  imageKey,
  className,
}: {
  muscleGroup: MuscleGroup;
  imageKey: string;
  equipment?: Equipment;
  className?: string;
}) {
  return (
    <div
      data-image-key={imageKey}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl",
        SOLID[muscleGroup],
        className,
      )}
    >
      {/* Layered gradient + soft sheen on top of the solid base. */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", GRADIENTS[muscleGroup])} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      {/* Faint oversized glyph for texture. */}
      <DumbbellIcon className="absolute -bottom-2 -left-2 h-12 w-12 rotate-[-20deg] text-white/20" />
      <span className="relative z-10 text-[13px] font-extrabold tracking-tight text-white drop-shadow-sm">
        {MUSCLE_GROUP_LABELS[muscleGroup]}
      </span>
    </div>
  );
}
