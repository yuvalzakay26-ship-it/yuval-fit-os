// Protein goal calculation using the professional g/kg/day method
// (grams of protein per kg of body weight per day). The ranges are general
// educational references from sports nutrition — not medical advice.
// Kept as pure, structured data so it can later be surfaced in Yuval Life OS.

export interface ProteinActivityLevel {
  id: "basic" | "light" | "strength" | "intense";
  label: string;
  description: string;
  /** Grams of protein per kg of body weight per day. */
  minPerKg: number;
  maxPerKg: number;
}

export const PROTEIN_ACTIVITY_LEVELS: ProteinActivityLevel[] = [
  {
    id: "basic",
    label: "בסיסי",
    description: "פעילות יומיומית מועטה",
    minPerKg: 0.8,
    maxPerKg: 0.8,
  },
  {
    id: "light",
    label: "פעילות קלה",
    description: "הליכות או אימונים קלים",
    minPerKg: 1.0,
    maxPerKg: 1.2,
  },
  {
    id: "strength",
    label: "אימוני כוח רגילים",
    description: "2–4 אימוני כוח בשבוע",
    minPerKg: 1.4,
    maxPerKg: 1.8,
  },
  {
    id: "intense",
    label: "אימונים אינטנסיביים",
    description: "עומס אימונים גבוה",
    minPerKg: 1.6,
    maxPerKg: 2.0,
  },
];

export function getProteinActivityLevel(
  id: string | undefined,
): ProteinActivityLevel | undefined {
  return PROTEIN_ACTIVITY_LEVELS.find((level) => level.id === id);
}

export interface ProteinRange {
  minGrams: number;
  maxGrams: number;
  /** Rounded midpoint of the range — the value offered as a daily goal. */
  midpointGrams: number;
}

export function calcProteinRange(
  weightKg: number,
  level: ProteinActivityLevel,
): ProteinRange {
  const minGrams = Math.round(weightKg * level.minPerKg);
  const maxGrams = Math.round(weightKg * level.maxPerKg);
  return {
    minGrams,
    maxGrams,
    midpointGrams: Math.round((minGrams + maxGrams) / 2),
  };
}

/** True when the weight input is a sensible value for the calculator. */
export function isValidBodyWeight(weightKg: number | undefined): weightKg is number {
  return typeof weightKg === "number" && weightKg >= 30 && weightKg <= 250;
}
