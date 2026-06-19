"use client";

import { useState } from "react";
import Image from "next/image";
import type { RecipeCategory } from "@/lib/recipes";
import { cn } from "@/lib/utils";
import { RecipePlaceholder } from "./RecipePlaceholder";

// Renders a recipe's image when `imageUrl` is set, and falls back to the gradient
// RecipePlaceholder when it isn't (the V1 default — no images yet) or if the file
// 404s at runtime. Mirrors FoodImage so a missing/bad path can never break layout.
// No original PDF imagery is ever used; images are uploaded by Yuval separately.
export function RecipeImage({
  imageUrl,
  alt,
  category,
  label,
  sizes,
  className,
}: {
  imageUrl?: string;
  alt: string;
  category: RecipeCategory;
  /** Optional label shown on the placeholder fallback. */
  label?: string;
  /** Rendered-width hint for `next/image`, e.g. "160px" or "100vw". */
  sizes: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!imageUrl || errored) {
    return <RecipePlaceholder category={category} label={label} className={className} />;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-surface-2", className)}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
