"use client";

import { useState } from "react";
import Image from "next/image";
import type { FoodCategory } from "@/lib/food-library";
import { cn } from "@/lib/utils";
import { FoodPlaceholder } from "./FoodPlaceholder";

// Renders the real food image when `imagePath` is set, and falls back to the
// gradient FoodPlaceholder when it isn't — or if the file 404s at runtime — so
// a missing/bad path can never break the layout. Mirrors ExerciseImage.
export function FoodImage({
  imagePath,
  alt,
  category,
  label,
  sizes,
  className,
}: {
  imagePath?: string;
  alt: string;
  category: FoodCategory;
  /** Optional label shown on the placeholder fallback. */
  label?: string;
  /** Rendered-width hint for `next/image`, e.g. "160px" or "100vw". */
  sizes: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!imagePath || errored) {
    return <FoodPlaceholder category={category} label={label} className={className} />;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-surface-2", className)}>
      <Image
        src={imagePath}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
