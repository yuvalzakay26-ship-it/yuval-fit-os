import type { CSSProperties } from "react";
import type { MuscleGroup } from "@/lib/fitness-types";

/**
 * Premium colour-identity system for the workouts screen (presentational only —
 * no data, storage, or logic is touched). Each muscle group maps to one hue, and
 * a workout template/session derives a single dominant identity from its muscle
 * groups so its card stops being "the same blue card again".
 *
 * The actual colour values (and their light/dark variants) live in
 * `app/globals.css` as `--mg-*` custom properties; here we only *name* them and
 * decide which one leads. A card spreads `identity.style` onto its root, which
 * sets the generic `--mg`, `--mg-soft`, `--mg-grad`, `--mg-shadow` (plus a
 * `--mg-2*` secondary) properties; the `.mg-gradient` / `.shadow-glow-mg` /
 * `.module-mg` consumer classes then paint from them. This keeps theming in one
 * place and gives correct light + dark behaviour for free.
 */

/** Identity keys: the eight muscle groups plus a blended "mixed" full-body one. */
export type IdentityKey = MuscleGroup | "mixed";

/** The custom-property name suffix for a given identity (matches globals.css). */
function vars(key: IdentityKey) {
  return {
    accent: `var(--mg-${key})`,
    soft: `var(--mg-${key}-soft)`,
    grad: `var(--mg-${key}-grad)`,
    shadow: `var(--mg-${key}-shadow)`,
  };
}

/**
 * The accent + soft CSS variable references for a single muscle group, so a chip
 * or dot can paint itself in its own group's colour. Light/dark resolve in CSS.
 */
export function muscleGroupColor(group: MuscleGroup): { accent: string; soft: string } {
  const v = vars(group);
  return { accent: v.accent, soft: v.soft };
}

export interface WorkoutIdentity {
  /** Which identity leads the card (a muscle group, or "mixed" for full-body). */
  key: IdentityKey;
  /** Dominant muscle group, or null for the blended mixed identity. */
  primary: MuscleGroup | null;
  /** Optional secondary muscle group used as a warm/cool counter-accent. */
  secondary: MuscleGroup | null;
  /** True when the workout spans enough groups to read as full-body. */
  isMixed: boolean;
  /**
   * Inline custom properties to spread onto the card root. Drives every
   * `.mg-*` consumer class plus the secondary-accent wash (`.module-mg-duo`).
   */
  style: CSSProperties;
}

/** Distinct muscle groups (4+) at which a workout reads as full-body / mixed. */
const MIXED_THRESHOLD = 4;

/**
 * Derive a single dominant visual identity from a template's or session's muscle
 * groups. The list is already ordered by first appearance of each group's
 * exercises (see `muscleGroupsForExercises`), so the first entry is the natural
 * lead. A spread of {@link MIXED_THRESHOLD}+ distinct groups becomes the blended
 * premium "mixed" identity; otherwise the first group leads with the next
 * distinct group as an optional secondary accent (e.g. back→blue + biceps→orange).
 */
export function workoutIdentity(groups: MuscleGroup[]): WorkoutIdentity {
  const distinct = [...new Set(groups)];
  const isMixed = distinct.length >= MIXED_THRESHOLD;

  const primary = isMixed ? null : (distinct[0] ?? null);
  const secondary = isMixed ? null : (distinct[1] ?? null);
  const key: IdentityKey = isMixed || !primary ? "mixed" : primary;

  const lead = vars(key);
  // Secondary wash: a real second group when present, otherwise fall back to the
  // lead hue so `.module-mg-duo` degrades to a clean single-hue tint.
  const accentTwo = secondary ? vars(secondary) : lead;

  const style = {
    "--mg": lead.accent,
    "--mg-soft": lead.soft,
    "--mg-grad": lead.grad,
    "--mg-shadow": lead.shadow,
    "--mg-2": accentTwo.accent,
    "--mg-2-soft": accentTwo.soft,
  } as CSSProperties;

  return { key, primary, secondary, isMixed, style };
}

/** Hebrew label for a workout's overall identity, used as a small card eyebrow. */
export function identityLabel(
  identity: WorkoutIdentity,
  labels: Record<MuscleGroup, string>,
): string {
  if (identity.isMixed || !identity.primary) return "אימון מלא";
  if (identity.secondary) {
    return `${labels[identity.primary]} · ${labels[identity.secondary]}`;
  }
  return labels[identity.primary];
}
