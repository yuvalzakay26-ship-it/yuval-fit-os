import type { FoodCategory } from "@/lib/food-library";
import { FOOD_CATEGORY_LABELS } from "@/lib/food-library";
import { cn } from "@/lib/utils";
import { AppleIcon } from "@/components/ui/icons";

// Calm gradient per food category. Rendered by FoodImage as the fallback
// whenever a food has no `imagePath` (or its image fails to load). Mirrors the
// exercise ExercisePlaceholder approach so the layout can never break.
const GRADIENTS: Record<FoodCategory, string> = {
  breakfast: "from-amber-400/30 via-amber-500/15 to-orange-600/20",
  "full-meals": "from-orange-400/30 via-orange-500/15 to-red-600/20",
  proteins: "from-rose-400/30 via-rose-500/15 to-red-600/20",
  carbs: "from-yellow-400/30 via-amber-500/15 to-orange-600/20",
  salads: "from-emerald-400/30 via-emerald-500/15 to-green-600/20",
  vegetables: "from-lime-400/30 via-green-500/15 to-emerald-600/20",
  "israeli-food": "from-sky-400/30 via-sky-500/15 to-blue-600/20",
  dairy: "from-slate-300/30 via-slate-400/15 to-slate-500/20",
  snacks: "from-fuchsia-400/30 via-fuchsia-500/15 to-pink-600/20",
  drinks: "from-cyan-400/30 via-cyan-500/15 to-blue-600/20",
  other: "from-violet-400/30 via-violet-500/15 to-purple-600/20",
};

const SOLID: Record<FoodCategory, string> = {
  breakfast: "bg-amber-500",
  "full-meals": "bg-orange-500",
  proteins: "bg-rose-500",
  carbs: "bg-amber-500",
  salads: "bg-emerald-500",
  vegetables: "bg-green-500",
  "israeli-food": "bg-sky-500",
  dairy: "bg-slate-400",
  snacks: "bg-fuchsia-500",
  drinks: "bg-cyan-500",
  other: "bg-violet-500",
};

export function FoodPlaceholder({
  category,
  label,
  className,
}: {
  category: FoodCategory;
  /** Optional short label override (defaults to the category name). */
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl",
        SOLID[category],
        className,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", GRADIENTS[category])} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      <AppleIcon className="absolute -bottom-2 -left-2 h-12 w-12 rotate-[-12deg] text-white/20" />
      <span className="relative z-10 px-2 text-center text-[12px] font-extrabold tracking-tight text-white drop-shadow-sm">
        {label ?? FOOD_CATEGORY_LABELS[category]}
      </span>
    </div>
  );
}
