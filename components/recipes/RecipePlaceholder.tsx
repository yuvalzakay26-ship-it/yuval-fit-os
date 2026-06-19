import type { RecipeCategory } from "@/lib/recipes";
import { cn } from "@/lib/utils";
import { AppleIcon } from "@/components/ui/icons";

// Calm gradient per recipe category. Rendered by RecipeImage as the fallback
// whenever a recipe has no `imageUrl` (the V1 default) or its image fails to
// load. Mirrors the nutrition FoodPlaceholder so the layout can never break and
// no original PDF imagery is ever required.
const GRADIENTS: Record<RecipeCategory, string> = {
  פנקייקים: "from-amber-400/30 via-amber-500/15 to-orange-600/20",
  שייקים: "from-fuchsia-400/30 via-pink-500/15 to-rose-600/20",
  מאפים: "from-yellow-400/30 via-amber-500/15 to-orange-600/20",
  קינוחים: "from-rose-400/30 via-rose-500/15 to-red-600/20",
  מתוקים: "from-pink-400/30 via-rose-500/15 to-red-600/20",
  "ארוחת בוקר": "from-orange-400/30 via-amber-500/15 to-orange-600/20",
  נשנוש: "from-violet-400/30 via-violet-500/15 to-purple-600/20",
};

const SOLID: Record<RecipeCategory, string> = {
  פנקייקים: "bg-amber-500",
  שייקים: "bg-fuchsia-500",
  מאפים: "bg-amber-500",
  קינוחים: "bg-rose-500",
  מתוקים: "bg-pink-500",
  "ארוחת בוקר": "bg-orange-500",
  נשנוש: "bg-violet-500",
};

export function RecipePlaceholder({
  category,
  label,
  className,
}: {
  category: RecipeCategory;
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
        {label ?? category}
      </span>
    </div>
  );
}
