// Visual food library for the Nutrition area.
//
// IMPORTANT: This is an image catalog, not a nutrition database. Macros and
// calories are intentionally left undefined here — the app never infers
// nutrition values from a photo. When a user adds a library food to their
// diary, they fill in protein/carbs/fat/calories manually (see FoodLogForm).
// A field like `protein` should only ever be set here if a *known, verified*
// value exists for that exact item — none do today.
//
// Images live under `public/food/<category>/<slug>.webp`, produced by
// `scripts/import-food-images.mjs`. See `docs/FOOD_MEDIA_IMPORT.md`.

export type FoodCategory =
  | "proteins"
  | "carbs"
  | "vegetables"
  | "salads"
  | "israeli-food"
  | "full-meals"
  | "snacks"
  | "drinks"
  | "breakfast"
  | "dairy"
  | "other";

export interface FoodLibraryItem {
  id: string;
  nameHe: string;
  nameEn?: string;
  category: FoodCategory;
  /** Public path to the food image, e.g. `/food/breakfast/shakshuka.webp`. */
  imagePath: string;
  /** Optional neutral quantity hint (e.g. "מנה"). Never a nutrition value. */
  defaultQuantityText?: string;
  /** Macros stay undefined unless a verified value is known for this item. */
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
}

/** Hebrew labels for each category, used by the library UI. */
export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  proteins: "חלבונים",
  carbs: "פחמימות",
  vegetables: "ירקות",
  salads: "סלטים",
  "israeli-food": "אוכל ישראלי",
  "full-meals": "ארוחות מלאות",
  snacks: "חטיפים",
  drinks: "שתייה",
  breakfast: "ארוחת בוקר",
  dairy: "מוצרי חלב",
  other: "אחר",
};

// Breakfast set imported in Phase 3.7. Macros are deliberately omitted — the
// user enters them per portion. Add new items below as more images are
// imported (keep `id` === the image slug for stability).
export const FOOD_LIBRARY: FoodLibraryItem[] = [
  {
    id: "avocado-and-egg-toast",
    nameHe: "טוסט אבוקדו וביצה",
    nameEn: "Avocado and Egg Toast",
    category: "breakfast",
    imagePath: "/food/breakfast/avocado-and-egg-toast.webp",
  },
  {
    id: "boiled-eggs",
    nameHe: "ביצים קשות",
    nameEn: "Boiled Eggs",
    category: "breakfast",
    imagePath: "/food/breakfast/boiled-eggs.webp",
  },
  {
    id: "cottage-cheese-with-vegetables",
    nameHe: "קוטג׳ עם ירקות",
    nameEn: "Cottage Cheese with Vegetables",
    category: "breakfast",
    imagePath: "/food/breakfast/cottage-cheese-with-vegetables.webp",
  },
  {
    id: "fried-egg",
    nameHe: "ביצת עין",
    nameEn: "Fried Egg",
    category: "breakfast",
    imagePath: "/food/breakfast/fried-egg.webp",
  },
  {
    id: "oatmeal",
    nameHe: "דייסת שיבולת שועל",
    nameEn: "Oatmeal",
    category: "breakfast",
    imagePath: "/food/breakfast/oatmeal.webp",
  },
  {
    id: "omelet",
    nameHe: "חביתה",
    nameEn: "Omelet",
    category: "breakfast",
    imagePath: "/food/breakfast/omelet.webp",
  },
  {
    id: "omelet-sandwich",
    nameHe: "כריך חביתה",
    nameEn: "Omelet Sandwich",
    category: "breakfast",
    imagePath: "/food/breakfast/omelet-sandwich.webp",
  },
  {
    id: "omelet-toast",
    nameHe: "טוסט חביתה",
    nameEn: "Omelet Toast",
    category: "breakfast",
    imagePath: "/food/breakfast/omelet-toast.webp",
  },
  {
    id: "protein-pancakes",
    nameHe: "פנקייק חלבון",
    nameEn: "Protein Pancakes",
    category: "breakfast",
    imagePath: "/food/breakfast/protein-pancakes.webp",
  },
  {
    id: "shakshuka",
    nameHe: "שקשוקה",
    nameEn: "Shakshuka",
    category: "breakfast",
    imagePath: "/food/breakfast/shakshuka.webp",
  },
  {
    id: "tuna-sandwich",
    nameHe: "כריך טונה",
    nameEn: "Tuna Sandwich",
    category: "breakfast",
    imagePath: "/food/breakfast/tuna-sandwich.webp",
  },
  {
    id: "vegetable-omelet",
    nameHe: "חביתת ירקות",
    nameEn: "Vegetable Omelet",
    category: "breakfast",
    imagePath: "/food/breakfast/vegetable-omelet.webp",
  },
  {
    id: "white-cheese-with-vegetables",
    nameHe: "גבינה לבנה עם ירקות",
    nameEn: "White Cheese with Vegetables",
    category: "breakfast",
    imagePath: "/food/breakfast/white-cheese-with-vegetables.webp",
  },
  {
    id: "yellow-cheese-toast",
    nameHe: "טוסט גבינה צהובה",
    nameEn: "Yellow Cheese Toast",
    category: "breakfast",
    imagePath: "/food/breakfast/yellow-cheese-toast.webp",
  },
  {
    id: "yogurt-with-granola-and-fruit",
    nameHe: "יוגורט עם גרנולה ופירות",
    nameEn: "Yogurt with Granola and Fruit",
    category: "breakfast",
    imagePath: "/food/breakfast/yogurt-with-granola-and-fruit.webp",
  },
];

/**
 * Categories that actually have items in the library, in a stable display
 * order. Used to build the filter chips so empty categories never show.
 */
export function foodCategoriesInLibrary(): FoodCategory[] {
  const order: FoodCategory[] = [
    "breakfast",
    "full-meals",
    "proteins",
    "carbs",
    "salads",
    "vegetables",
    "israeli-food",
    "dairy",
    "snacks",
    "drinks",
    "other",
  ];
  const present = new Set(FOOD_LIBRARY.map((f) => f.category));
  return order.filter((c) => present.has(c));
}

/**
 * Filter the library by category ("all" = no category filter) and a free-text
 * query matched against Hebrew + English names. Both are optional.
 */
export function filterFoods(
  category: FoodCategory | "all" = "all",
  query = "",
): FoodLibraryItem[] {
  const q = query.trim().toLowerCase();
  return FOOD_LIBRARY.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return (
      item.nameHe.toLowerCase().includes(q) ||
      (item.nameEn?.toLowerCase().includes(q) ?? false)
    );
  });
}
