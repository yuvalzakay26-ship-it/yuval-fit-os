// Starter supplement library — a small catalogue of *common, recognizable*
// supplements offered purely as quick-add templates for the add/edit flow and
// the tracker's "browse common" rail.
//
// HARD PRODUCT BOUNDARY (restated here so it travels with the data):
//   • These are quick-add suggestions / starter templates ONLY.
//   • NO dosage values, NO medical claims, NO inferred advice, NO "good/bad"
//     framing. A template carries at most a name + a neutral category, and (only
//     where it is literally definitional, e.g. a "pre-workout" item) a timing
//     tag the user can freely change.
//   • The user still owns the real entry: tapping a template only PREFILLS the
//     form — name, category, dosage and timing all stay fully editable before
//     saving, and the manual add path is always available.
//
// localStorage-only, no backend / API. See `docs/SUPPLEMENTS_TRACKER.md`.

import type { SupplementCategory, SupplementTiming } from "@/lib/fitness-types";

/** Icon identity for a catalogue item — mapped to an SVG in `SupplementGlyph`. */
export type SupplementGlyphName =
  | "sun"
  | "spark"
  | "bolt"
  | "dumbbell"
  | "droplet"
  | "flame"
  | "leaf"
  | "heart"
  | "pill";

export interface CatalogSupplement {
  /** Stable key, used in the `?preset=` deep link. Never user-facing. */
  key: string;
  /** Hebrew display name (prefilled into the name field). */
  nameHe: string;
  /** English name, shown as a recognition subtitle (like the exercise picker). */
  nameEn: string;
  /** The neutral category saved with the item. Classification only — not advice. */
  category: SupplementCategory;
  icon: SupplementGlyphName;
  /**
   * Optional timing tag prefilled with the template. Used ONLY where it is
   * literally part of the item's identity (a "pre-workout" product) — never as a
   * recommendation. The user can change or clear it.
   */
  timesOfDay?: SupplementTiming[];
}

/**
 * The catalogue, ordered for browsing. Grouping is defined separately
 * (`SUPPLEMENT_CATALOG_GROUPS`) so an item can sit in a browse group that differs
 * from its saved category (e.g. whey protein browses under "training" but saves
 * with the neutral `protein` category).
 */
export const SUPPLEMENT_CATALOG: CatalogSupplement[] = [
  // Performance / Training
  { key: "creatine", nameHe: "קריאטין", nameEn: "Creatine", category: "performance", icon: "bolt" },
  { key: "whey", nameHe: "אבקת חלבון", nameEn: "Whey Protein", category: "protein", icon: "dumbbell" },
  { key: "electrolytes", nameHe: "אלקטרוליטים", nameEn: "Electrolytes", category: "performance", icon: "droplet" },
  { key: "pre-workout", nameHe: "פרה-אימון", nameEn: "Pre-Workout", category: "performance", icon: "flame", timesOfDay: ["pre-workout"] },

  // Vitamins
  { key: "vitamin-d", nameHe: "ויטמין D", nameEn: "Vitamin D", category: "vitamin", icon: "sun" },
  { key: "vitamin-c", nameHe: "ויטמין C", nameEn: "Vitamin C", category: "vitamin", icon: "sun" },
  { key: "vitamin-b12", nameHe: "ויטמין B12", nameEn: "Vitamin B12", category: "vitamin", icon: "sun" },
  { key: "vitamin-b-complex", nameHe: "ויטמין B קומפלקס", nameEn: "Vitamin B Complex", category: "vitamin", icon: "spark" },
  { key: "multivitamin", nameHe: "מולטי-ויטמין", nameEn: "Multivitamin", category: "vitamin", icon: "spark" },

  // Minerals
  { key: "magnesium", nameHe: "מגנזיום", nameEn: "Magnesium", category: "mineral", icon: "spark" },
  { key: "zinc", nameHe: "אבץ", nameEn: "Zinc", category: "mineral", icon: "spark" },
  { key: "iron", nameHe: "ברזל", nameEn: "Iron", category: "mineral", icon: "spark" },
  { key: "calcium", nameHe: "סידן", nameEn: "Calcium", category: "mineral", icon: "spark" },
  { key: "potassium", nameHe: "אשלגן", nameEn: "Potassium", category: "mineral", icon: "spark" },

  // General Health
  { key: "omega-3", nameHe: "אומגה 3", nameEn: "Omega 3", category: "general-health", icon: "heart" },
  { key: "probiotics", nameHe: "פרוביוטיקה", nameEn: "Probiotics", category: "general-health", icon: "leaf" },
];

/** A browse group for the library — a filter tab + the items it contains. */
export interface CatalogGroup {
  id: string;
  /** Neutral Hebrew label. */
  label: string;
  /** Catalogue keys belonging to this group, in display order. */
  keys: string[];
}

export const SUPPLEMENT_CATALOG_GROUPS: CatalogGroup[] = [
  {
    id: "performance",
    label: "ביצועים ואימון",
    keys: ["creatine", "whey", "electrolytes", "pre-workout"],
  },
  {
    id: "vitamin",
    label: "ויטמינים",
    keys: ["vitamin-d", "vitamin-c", "vitamin-b12", "vitamin-b-complex", "multivitamin"],
  },
  {
    id: "mineral",
    label: "מינרלים",
    keys: ["magnesium", "zinc", "iron", "calcium", "potassium"],
  },
  {
    id: "general-health",
    label: "בריאות כללית",
    keys: ["omega-3", "probiotics"],
  },
];

const BY_KEY: Record<string, CatalogSupplement> = Object.fromEntries(
  SUPPLEMENT_CATALOG.map((s) => [s.key, s]),
);

/** Look up a catalogue template by its stable key (e.g. from `?preset=`). */
export function getCatalogSupplement(key: string | undefined): CatalogSupplement | undefined {
  return key ? BY_KEY[key] : undefined;
}

/** Items of a browse group, resolved + ordered. */
export function groupItems(group: CatalogGroup): CatalogSupplement[] {
  return group.keys
    .map((k) => BY_KEY[k])
    .filter((s): s is CatalogSupplement => Boolean(s));
}

/**
 * A short, popular subset used for the tracker's compact "common supplements"
 * rail — Creatine first, then a vitamin / mineral / general-health spread so the
 * starter library reads as broad at a glance.
 */
export const POPULAR_SUPPLEMENT_KEYS: string[] = [
  "creatine",
  "vitamin-d",
  "magnesium",
  "omega-3",
  "whey",
  "zinc",
  "multivitamin",
  "vitamin-c",
];

export function popularSupplements(): CatalogSupplement[] {
  return POPULAR_SUPPLEMENT_KEYS
    .map((k) => BY_KEY[k])
    .filter((s): s is CatalogSupplement => Boolean(s));
}
