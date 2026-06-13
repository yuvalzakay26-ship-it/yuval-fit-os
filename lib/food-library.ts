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
    id: "bagel-with-cheese-and-vegetables",
    nameHe: "בייגל עם גבינה וירקות",
    nameEn: "Bagel with Cheese and Vegetables",
    category: "breakfast",
    imagePath: "/food/breakfast/bagel-with-cheese-and-vegetables.webp",
  },
  {
    id: "boiled-eggs",
    nameHe: "ביצים קשות",
    nameEn: "Boiled Eggs",
    category: "breakfast",
    imagePath: "/food/breakfast/boiled-eggs.webp",
  },
  {
    id: "cereal-with-milk",
    nameHe: "דגני בוקר עם חלב",
    nameEn: "Cereal with Milk",
    category: "breakfast",
    imagePath: "/food/breakfast/cereal-with-milk.webp",
  },
  {
    id: "cheese-and-vegetable-sandwich",
    nameHe: "כריך גבינה וירקות",
    nameEn: "Cheese and Vegetable Sandwich",
    category: "breakfast",
    imagePath: "/food/breakfast/cheese-and-vegetable-sandwich.webp",
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
    id: "fruit-bowl-with-yogurt",
    nameHe: "קערת פירות עם יוגורט",
    nameEn: "Fruit Bowl with Yogurt",
    category: "breakfast",
    imagePath: "/food/breakfast/fruit-bowl-with-yogurt.webp",
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
    id: "whole-wheat-bread-with-peanut-butter",
    nameHe: "לחם מלא עם חמאת בוטנים",
    nameEn: "Whole Wheat Bread with Peanut Butter",
    category: "breakfast",
    imagePath: "/food/breakfast/whole-wheat-bread-with-peanut-butter.webp",
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

  // Proteins set imported in Phase 3.12. Macros are deliberately omitted — the
  // user enters them per portion. `id` mirrors the image slug, except where a
  // slug already exists in another category (boiled-eggs also lives under
  // breakfast), in which case the id is category-qualified to stay globally
  // unique. See docs/FOOD_MEDIA_IMPORT.md.
  {
    id: "baked-salmon",
    nameHe: "סלמון אפוי",
    nameEn: "Baked Salmon",
    category: "proteins",
    imagePath: "/food/proteins/baked-salmon.webp",
  },
  {
    id: "beef-meatballs",
    nameHe: "קציצות בקר",
    nameEn: "Beef Meatballs",
    category: "proteins",
    imagePath: "/food/proteins/beef-meatballs.webp",
  },
  {
    id: "beef-steak",
    nameHe: "סטייק בקר",
    nameEn: "Beef Steak",
    category: "proteins",
    imagePath: "/food/proteins/beef-steak.webp",
  },
  {
    id: "boiled-eggs-proteins",
    nameHe: "ביצים קשות",
    nameEn: "Boiled Eggs",
    category: "proteins",
    imagePath: "/food/proteins/boiled-eggs.webp",
  },
  {
    id: "chicken-meatballs",
    nameHe: "קציצות עוף",
    nameEn: "Chicken Meatballs",
    category: "proteins",
    imagePath: "/food/proteins/chicken-meatballs.webp",
  },
  {
    id: "chicken-schnitzel",
    nameHe: "שניצל עוף",
    nameEn: "Chicken Schnitzel",
    category: "proteins",
    imagePath: "/food/proteins/chicken-schnitzel.webp",
  },
  {
    id: "cooked-chickpeas",
    nameHe: "חומוס מבושל",
    nameEn: "Cooked Chickpeas",
    category: "proteins",
    imagePath: "/food/proteins/cooked-chickpeas.webp",
  },
  {
    id: "cooked-lentils",
    nameHe: "עדשים מבושלות",
    nameEn: "Cooked Lentils",
    category: "proteins",
    imagePath: "/food/proteins/cooked-lentils.webp",
  },
  {
    id: "cooked-white-beans",
    nameHe: "שעועית לבנה מבושלת",
    nameEn: "Cooked White Beans",
    category: "proteins",
    imagePath: "/food/proteins/cooked-white-beans.webp",
  },
  {
    id: "cottage-cheese",
    nameHe: "גבינת קוטג׳",
    nameEn: "Cottage Cheese",
    category: "proteins",
    imagePath: "/food/proteins/cottage-cheese.webp",
  },
  {
    id: "grilled-chicken-breast",
    nameHe: "חזה עוף בגריל",
    nameEn: "Grilled Chicken Breast",
    category: "proteins",
    imagePath: "/food/proteins/grilled-chicken-breast.webp",
  },
  {
    id: "grilled-chicken-thighs",
    nameHe: "ירכי עוף בגריל",
    nameEn: "Grilled Chicken Thighs",
    category: "proteins",
    imagePath: "/food/proteins/grilled-chicken-thighs.webp",
  },
  {
    id: "homemade-burger-patty",
    nameHe: "קציצת המבורגר ביתית",
    nameEn: "Homemade Burger Patty",
    category: "proteins",
    imagePath: "/food/proteins/homemade-burger-patty.webp",
  },
  {
    id: "seared-tofu",
    nameHe: "טופו צרוב",
    nameEn: "Seared Tofu",
    category: "proteins",
    imagePath: "/food/proteins/seared-tofu.webp",
  },
  {
    id: "tuna-plate",
    nameHe: "צלחת טונה",
    nameEn: "Tuna Plate",
    category: "proteins",
    imagePath: "/food/proteins/tuna-plate.webp",
  },
  {
    id: "tuna-salad",
    nameHe: "סלט טונה",
    nameEn: "Tuna Salad",
    category: "proteins",
    imagePath: "/food/proteins/tuna-salad.webp",
  },
  {
    id: "turkey-breast-slices",
    nameHe: "פרוסות חזה הודו",
    nameEn: "Turkey Breast Slices",
    category: "proteins",
    imagePath: "/food/proteins/turkey-breast-slices.webp",
  },
  {
    id: "white-cheese",
    nameHe: "גבינה לבנה",
    nameEn: "White Cheese",
    category: "proteins",
    imagePath: "/food/proteins/white-cheese.webp",
  },
  {
    id: "white-fish-fillet",
    nameHe: "פילה דג לבן",
    nameEn: "White Fish Fillet",
    category: "proteins",
    imagePath: "/food/proteins/white-fish-fillet.webp",
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
