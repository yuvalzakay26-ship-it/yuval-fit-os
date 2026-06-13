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
  /**
   * Extra search-only terms (common spellings / synonyms) so the library search
   * finds the item from how people actually type. Purely a matching aid — never
   * shown in the UI, never advice.
   */
  aliases?: string[];
}

/**
 * The catalogue, ordered for browsing. Grouping is defined separately
 * (`SUPPLEMENT_CATALOG_GROUPS`) so an item can sit in a browse group that differs
 * from its saved category (e.g. whey protein browses under "training" but saves
 * with the neutral `protein` category).
 */
export const SUPPLEMENT_CATALOG: CatalogSupplement[] = [
  // Performance / Training
  { key: "creatine", nameHe: "קריאטין", nameEn: "Creatine", category: "performance", icon: "bolt", aliases: ["קראטין", "creatin", "monohydrate", "מונוהידראט"] },
  { key: "whey", nameHe: "אבקת חלבון", nameEn: "Whey Protein", category: "protein", icon: "dumbbell", aliases: ["whey", "protein", "חלבון", "וויי", "ווי", "פרוטאין", "isolate"] },
  { key: "electrolytes", nameHe: "אלקטרוליטים", nameEn: "Electrolytes", category: "performance", icon: "droplet", aliases: ["electrolyte", "מלחים", "אלקטרוליט"] },
  { key: "pre-workout", nameHe: "פרה-אימון", nameEn: "Pre-Workout", category: "performance", icon: "flame", timesOfDay: ["pre-workout"], aliases: ["preworkout", "pre workout", "פרה אימון", "לפני אימון"] },

  // Vitamins
  { key: "vitamin-d", nameHe: "ויטמין D", nameEn: "Vitamin D", category: "vitamin", icon: "sun", aliases: ["ויטמין די", "vitamin d3", "ויטמין d3", "d3"] },
  { key: "vitamin-c", nameHe: "ויטמין C", nameEn: "Vitamin C", category: "vitamin", icon: "sun", aliases: ["ויטמין סי", "vit c"] },
  { key: "vitamin-b12", nameHe: "ויטמין B12", nameEn: "Vitamin B12", category: "vitamin", icon: "sun", aliases: ["b12", "ויטמין בי 12", "cobalamin"] },
  { key: "vitamin-b-complex", nameHe: "ויטמין B קומפלקס", nameEn: "Vitamin B Complex", category: "vitamin", icon: "spark", aliases: ["b complex", "bcomplex", "בי קומפלקס", "ויטמין בי"] },
  { key: "multivitamin", nameHe: "מולטי-ויטמין", nameEn: "Multivitamin", category: "vitamin", icon: "spark", aliases: ["multi", "מולטי", "multi vitamin"] },

  // Minerals
  { key: "magnesium", nameHe: "מגנזיום", nameEn: "Magnesium", category: "mineral", icon: "spark", aliases: ["mag", "מגנזיום", "magnez"] },
  { key: "zinc", nameHe: "אבץ", nameEn: "Zinc", category: "mineral", icon: "spark", aliases: ["zinc", "אבץ"] },
  { key: "iron", nameHe: "ברזל", nameEn: "Iron", category: "mineral", icon: "spark", aliases: ["iron", "ferrum"] },
  { key: "calcium", nameHe: "סידן", nameEn: "Calcium", category: "mineral", icon: "spark", aliases: ["calcium", "סידן"] },
  { key: "potassium", nameHe: "אשלגן", nameEn: "Potassium", category: "mineral", icon: "spark", aliases: ["potassium", "אשלגן"] },

  // General Health
  { key: "omega-3", nameHe: "אומגה 3", nameEn: "Omega 3", category: "general-health", icon: "heart", aliases: ["omega3", "omega 3", "אומגה", "fish oil", "שמן דגים", "dha", "epa"] },
  { key: "probiotics", nameHe: "פרוביוטיקה", nameEn: "Probiotics", category: "general-health", icon: "leaf", aliases: ["probiotic", "פרוביוטיקה", "חיידקים"] },
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

/* ------------------------------- Search -------------------------------- */
// Local, dependency-free fuzzy-ish matching for the library search box. Matches
// the Hebrew name, English subtitle, an optional category label, and the
// search-only aliases. Multi-word queries match when EVERY token is found
// somewhere (AND), so "vitamin d" and "ויטמין די" both land on Vitamin D.

/** True if `item` matches the free-text `query` (case-insensitive, token-AND). */
export function supplementMatchesQuery(
  item: CatalogSupplement,
  query: string,
  categoryLabel?: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.nameHe,
    item.nameEn,
    categoryLabel ?? "",
    ...(item.aliases ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

/* --------------------------- Already-tracked --------------------------- */
// Helpers to tell whether a catalogue template is already in the user's tracker,
// so the library can show a clear "already tracked" state and the add flow can
// route to the existing entry instead of silently creating a duplicate.

/** Normalize a supplement name for duplicate / already-tracked comparison. */
export function normalizeSupplementName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Map of catalogue `key` → existing supplement `id` for every template the user
 * already tracks (matched on the normalized Hebrew or English name, active or
 * archived). Empty when nothing matches.
 */
export function trackedCatalogMap(
  supplements: ReadonlyArray<{ id: string; name: string }>,
): Map<string, string> {
  const byName = new Map<string, string>();
  for (const s of supplements) {
    const key = normalizeSupplementName(s.name);
    // First match wins so the oldest entry is the one we route to.
    if (!byName.has(key)) byName.set(key, s.id);
  }
  const map = new Map<string, string>();
  for (const item of SUPPLEMENT_CATALOG) {
    const id =
      byName.get(normalizeSupplementName(item.nameHe)) ??
      byName.get(normalizeSupplementName(item.nameEn));
    if (id) map.set(item.key, id);
  }
  return map;
}
