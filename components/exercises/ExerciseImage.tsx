"use client";

import { useState } from "react";
import Image from "next/image";
import type { MuscleGroup } from "@/lib/fitness-types";
import { cn } from "@/lib/utils";
import { ExercisePlaceholder } from "./ExercisePlaceholder";

// Renders the real exercise image when `imagePath` is set, and falls back to
// the gradient ExercisePlaceholder when it isn't — or if the file 404s at
// runtime — so a bad/missing path can never break the layout.
export function ExerciseImage({
  imagePath,
  alt,
  muscleGroup,
  imageKey,
  sizes,
  className,
}: {
  imagePath?: string;
  alt: string;
  muscleGroup: MuscleGroup;
  imageKey: string;
  /** Rendered-width hint for `next/image`, e.g. "72px" or "100vw". */
  sizes: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!imagePath || errored) {
    return (
      <ExercisePlaceholder
        muscleGroup={muscleGroup}
        imageKey={imageKey}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface-2",
        className,
      )}
    >
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
