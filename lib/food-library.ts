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
  | "fruits"
  | "fats"
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
  carbs: "פחמימות ותוספות",
  vegetables: "ירקות",
  fruits: "פירות",
  fats: "שומנים ותוספות בריאות",
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

  // Carbs & side dishes set imported in Phase 3.13. Macros are deliberately
  // omitted — the user enters them per portion. `id` mirrors the image slug;
  // none of these slugs collide with existing breakfast/proteins ids. See
  // docs/FOOD_MEDIA_IMPORT.md.
  {
    id: "baked-potato",
    nameHe: "תפוח אדמה אפוי",
    nameEn: "Baked Potato",
    category: "carbs",
    imagePath: "/food/carbs/baked-potato.webp",
  },
  {
    id: "brown-rice",
    nameHe: "אורז מלא",
    nameEn: "Brown Rice",
    category: "carbs",
    imagePath: "/food/carbs/brown-rice.webp",
  },
  {
    id: "corn",
    nameHe: "תירס",
    nameEn: "Corn",
    category: "carbs",
    imagePath: "/food/carbs/corn.webp",
  },
  {
    id: "couscous",
    nameHe: "קוסקוס",
    nameEn: "Couscous",
    category: "carbs",
    imagePath: "/food/carbs/couscous.webp",
  },
  {
    id: "crackers",
    nameHe: "קרקרים",
    nameEn: "Crackers",
    category: "carbs",
    imagePath: "/food/carbs/crackers.webp",
  },
  {
    id: "granola",
    nameHe: "גרנולה",
    nameEn: "Granola",
    category: "carbs",
    imagePath: "/food/carbs/granola.webp",
  },
  {
    id: "laffa-bread",
    nameHe: "לאפה",
    nameEn: "Laffa Bread",
    category: "carbs",
    imagePath: "/food/carbs/laffa-bread.webp",
  },
  {
    id: "mashed-potatoes",
    nameHe: "פירה",
    nameEn: "Mashed Potatoes",
    category: "carbs",
    imagePath: "/food/carbs/mashed-potatoes.webp",
  },
  {
    id: "oats",
    nameHe: "שיבולת שועל",
    nameEn: "Oats",
    category: "carbs",
    imagePath: "/food/carbs/oats.webp",
  },
  {
    id: "pasta",
    nameHe: "פסטה",
    nameEn: "Pasta",
    category: "carbs",
    imagePath: "/food/carbs/pasta.webp",
  },
  {
    id: "pita-bread",
    nameHe: "פיתה",
    nameEn: "Pita Bread",
    category: "carbs",
    imagePath: "/food/carbs/pita-bread.webp",
  },
  {
    id: "ptitim",
    nameHe: "פתיתים",
    nameEn: "Ptitim",
    category: "carbs",
    imagePath: "/food/carbs/ptitim.webp",
  },
  {
    id: "quinoa",
    nameHe: "קינואה",
    nameEn: "Quinoa",
    category: "carbs",
    imagePath: "/food/carbs/quinoa.webp",
  },
  {
    id: "rice-cakes",
    nameHe: "פריכיות אורז",
    nameEn: "Rice Cakes",
    category: "carbs",
    imagePath: "/food/carbs/rice-cakes.webp",
  },
  {
    id: "roasted-sweet-potato",
    nameHe: "בטטה צלויה",
    nameEn: "Roasted Sweet Potato",
    category: "carbs",
    imagePath: "/food/carbs/roasted-sweet-potato.webp",
  },
  {
    id: "tortilla",
    nameHe: "טורטייה",
    nameEn: "Tortilla",
    category: "carbs",
    imagePath: "/food/carbs/tortilla.webp",
  },
  {
    id: "white-rice",
    nameHe: "אורז לבן",
    nameEn: "White Rice",
    category: "carbs",
    imagePath: "/food/carbs/white-rice.webp",
  },
  {
    id: "whole-wheat-bread",
    nameHe: "לחם מלא",
    nameEn: "Whole Wheat Bread",
    category: "carbs",
    imagePath: "/food/carbs/whole-wheat-bread.webp",
  },
  {
    id: "whole-wheat-pasta",
    nameHe: "פסטה מלאה",
    nameEn: "Whole Wheat Pasta",
    category: "carbs",
    imagePath: "/food/carbs/whole-wheat-pasta.webp",
  },

  // Vegetables set imported in Phase 3.14. Macros are deliberately omitted —
  // the user enters them per portion. `id` mirrors the image slug; none of
  // these slugs collide with existing breakfast/proteins/carbs ids. See
  // docs/FOOD_MEDIA_IMPORT.md.
  {
    id: "avocado",
    nameHe: "אבוקדו",
    nameEn: "Avocado",
    category: "vegetables",
    imagePath: "/food/vegetables/avocado.webp",
  },
  {
    id: "beetroot",
    nameHe: "סלק",
    nameEn: "Beetroot",
    category: "vegetables",
    imagePath: "/food/vegetables/beetroot.webp",
  },
  {
    id: "broccoli",
    nameHe: "ברוקולי",
    nameEn: "Broccoli",
    category: "vegetables",
    imagePath: "/food/vegetables/broccoli.webp",
  },
  {
    id: "cabbage",
    nameHe: "כרוב",
    nameEn: "Cabbage",
    category: "vegetables",
    imagePath: "/food/vegetables/cabbage.webp",
  },
  {
    id: "carrot",
    nameHe: "גזר",
    nameEn: "Carrot",
    category: "vegetables",
    imagePath: "/food/vegetables/carrot.webp",
  },
  {
    id: "cauliflower",
    nameHe: "כרובית",
    nameEn: "Cauliflower",
    category: "vegetables",
    imagePath: "/food/vegetables/cauliflower.webp",
  },
  {
    id: "cucumber",
    nameHe: "מלפפון",
    nameEn: "Cucumber",
    category: "vegetables",
    imagePath: "/food/vegetables/cucumber.webp",
  },
  {
    id: "eggplant",
    nameHe: "חציל",
    nameEn: "Eggplant",
    category: "vegetables",
    imagePath: "/food/vegetables/eggplant.webp",
  },
  {
    id: "green-beans",
    nameHe: "שעועית ירוקה",
    nameEn: "Green Beans",
    category: "vegetables",
    imagePath: "/food/vegetables/green-beans.webp",
  },
  {
    id: "lettuce",
    nameHe: "חסה",
    nameEn: "Lettuce",
    category: "vegetables",
    imagePath: "/food/vegetables/lettuce.webp",
  },
  {
    id: "mixed-vegetables",
    nameHe: "ירקות מעורבים",
    nameEn: "Mixed Vegetables",
    category: "vegetables",
    imagePath: "/food/vegetables/mixed-vegetables.webp",
  },
  {
    id: "mushrooms",
    nameHe: "פטריות",
    nameEn: "Mushrooms",
    category: "vegetables",
    imagePath: "/food/vegetables/mushrooms.webp",
  },
  {
    id: "onion",
    nameHe: "בצל",
    nameEn: "Onion",
    category: "vegetables",
    imagePath: "/food/vegetables/onion.webp",
  },
  {
    id: "peas",
    nameHe: "אפונה",
    nameEn: "Peas",
    category: "vegetables",
    imagePath: "/food/vegetables/peas.webp",
  },
  {
    id: "red-bell-pepper",
    nameHe: "פלפל אדום",
    nameEn: "Red Bell Pepper",
    category: "vegetables",
    imagePath: "/food/vegetables/red-bell-pepper.webp",
  },
  {
    id: "red-cabbage",
    nameHe: "כרוב אדום",
    nameEn: "Red Cabbage",
    category: "vegetables",
    imagePath: "/food/vegetables/red-cabbage.webp",
  },
  {
    id: "spinach",
    nameHe: "תרד",
    nameEn: "Spinach",
    category: "vegetables",
    imagePath: "/food/vegetables/spinach.webp",
  },
  {
    id: "tomato",
    nameHe: "עגבנייה",
    nameEn: "Tomato",
    category: "vegetables",
    imagePath: "/food/vegetables/tomato.webp",
  },
  {
    id: "yellow-bell-pepper",
    nameHe: "פלפל צהוב",
    nameEn: "Yellow Bell Pepper",
    category: "vegetables",
    imagePath: "/food/vegetables/yellow-bell-pepper.webp",
  },
  {
    id: "zucchini",
    nameHe: "קישוא",
    nameEn: "Zucchini",
    category: "vegetables",
    imagePath: "/food/vegetables/zucchini.webp",
  },

  // Fruits set imported in Phase 3.15. Macros are deliberately omitted — the
  // user enters them per portion. `id` mirrors the image slug; none of these
  // slugs collide with existing breakfast/proteins/carbs/vegetables ids. See
  // docs/FOOD_MEDIA_IMPORT.md.
  {
    id: "apple",
    nameHe: "תפוח",
    nameEn: "Apple",
    category: "fruits",
    imagePath: "/food/fruits/apple.webp",
  },
  {
    id: "banana",
    nameHe: "בננה",
    nameEn: "Banana",
    category: "fruits",
    imagePath: "/food/fruits/banana.webp",
  },
  {
    id: "blueberries",
    nameHe: "אוכמניות",
    nameEn: "Blueberries",
    category: "fruits",
    imagePath: "/food/fruits/blueberries.webp",
  },
  {
    id: "cherry",
    nameHe: "דובדבן",
    nameEn: "Cherry",
    category: "fruits",
    imagePath: "/food/fruits/cherry.webp",
  },
  {
    id: "grapefruit",
    nameHe: "אשכולית",
    nameEn: "Grapefruit",
    category: "fruits",
    imagePath: "/food/fruits/grapefruit.webp",
  },
  {
    id: "grapes",
    nameHe: "ענבים",
    nameEn: "Grapes",
    category: "fruits",
    imagePath: "/food/fruits/grapes.webp",
  },
  {
    id: "kiwi",
    nameHe: "קיווי",
    nameEn: "Kiwi",
    category: "fruits",
    imagePath: "/food/fruits/kiwi.webp",
  },
  {
    id: "mango",
    nameHe: "מנגו",
    nameEn: "Mango",
    category: "fruits",
    imagePath: "/food/fruits/mango.webp",
  },
  {
    id: "melon",
    nameHe: "מלון",
    nameEn: "Melon",
    category: "fruits",
    imagePath: "/food/fruits/melon.webp",
  },
  {
    id: "nectarine",
    nameHe: "נקטרינה",
    nameEn: "Nectarine",
    category: "fruits",
    imagePath: "/food/fruits/nectarine.webp",
  },
  {
    id: "orange",
    nameHe: "תפוז",
    nameEn: "Orange",
    category: "fruits",
    imagePath: "/food/fruits/orange.webp",
  },
  {
    id: "peach",
    nameHe: "אפרסק",
    nameEn: "Peach",
    category: "fruits",
    imagePath: "/food/fruits/peach.webp",
  },
  {
    id: "pear",
    nameHe: "אגס",
    nameEn: "Pear",
    category: "fruits",
    imagePath: "/food/fruits/pear.webp",
  },
  {
    id: "pineapple",
    nameHe: "אננס",
    nameEn: "Pineapple",
    category: "fruits",
    imagePath: "/food/fruits/pineapple.webp",
  },
  {
    id: "plum",
    nameHe: "שזיף",
    nameEn: "Plum",
    category: "fruits",
    imagePath: "/food/fruits/plum.webp",
  },
  {
    id: "pomegranate",
    nameHe: "רימון",
    nameEn: "Pomegranate",
    category: "fruits",
    imagePath: "/food/fruits/pomegranate.webp",
  },
  {
    id: "raspberry",
    nameHe: "פטל",
    nameEn: "Raspberry",
    category: "fruits",
    imagePath: "/food/fruits/raspberry.webp",
  },
  {
    id: "strawberry",
    nameHe: "תות שדה",
    nameEn: "Strawberry",
    category: "fruits",
    imagePath: "/food/fruits/strawberry.webp",
  },
  {
    id: "watermelon",
    nameHe: "אבטיח",
    nameEn: "Watermelon",
    category: "fruits",
    imagePath: "/food/fruits/watermelon.webp",
  },

  // Fats & add-ons set imported in Phase 3.16. Macros are deliberately omitted —
  // the user enters them per portion. `id` mirrors the image slug, except
  // `avocado` which already exists as a vegetables `id`; the fats item uses
  // `id: "avocado-fats"` while its image stays `/food/fats/avocado.webp`. See
  // docs/FOOD_MEDIA_IMPORT.md.
  {
    id: "almond-butter",
    nameHe: "חמאת שקדים",
    nameEn: "Almond Butter",
    category: "fats",
    imagePath: "/food/fats/almond-butter.webp",
  },
  {
    id: "almonds",
    nameHe: "שקדים",
    nameEn: "Almonds",
    category: "fats",
    imagePath: "/food/fats/almonds.webp",
  },
  {
    id: "avocado-fats",
    nameHe: "אבוקדו",
    nameEn: "Avocado",
    category: "fats",
    imagePath: "/food/fats/avocado.webp",
  },
  {
    id: "black-olives",
    nameHe: "זיתים שחורים",
    nameEn: "Black Olives",
    category: "fats",
    imagePath: "/food/fats/black-olives.webp",
  },
  {
    id: "cashews",
    nameHe: "קשיו",
    nameEn: "Cashews",
    category: "fats",
    imagePath: "/food/fats/cashews.webp",
  },
  {
    id: "chia-seeds",
    nameHe: "זרעי צ׳יה",
    nameEn: "Chia Seeds",
    category: "fats",
    imagePath: "/food/fats/chia-seeds.webp",
  },
  {
    id: "dried-coconut",
    nameHe: "קוקוס מיובש",
    nameEn: "Dried Coconut",
    category: "fats",
    imagePath: "/food/fats/dried-coconut.webp",
  },
  {
    id: "feta-cheese",
    nameHe: "גבינת פטה",
    nameEn: "Feta Cheese",
    category: "fats",
    imagePath: "/food/fats/feta-cheese.webp",
  },
  {
    id: "flax-seeds",
    nameHe: "זרעי פשתן",
    nameEn: "Flax Seeds",
    category: "fats",
    imagePath: "/food/fats/flax-seeds.webp",
  },
  {
    id: "green-olives",
    nameHe: "זיתים ירוקים",
    nameEn: "Green Olives",
    category: "fats",
    imagePath: "/food/fats/green-olives.webp",
  },
  {
    id: "halloumi-cheese",
    nameHe: "גבינת חלומי",
    nameEn: "Halloumi Cheese",
    category: "fats",
    imagePath: "/food/fats/halloumi-cheese.webp",
  },
  {
    id: "mixed-nuts-and-seeds",
    nameHe: "אגוזים וזרעים מעורבים",
    nameEn: "Mixed Nuts and Seeds",
    category: "fats",
    imagePath: "/food/fats/mixed-nuts-and-seeds.webp",
  },
  {
    id: "olive-oil",
    nameHe: "שמן זית",
    nameEn: "Olive Oil",
    category: "fats",
    imagePath: "/food/fats/olive-oil.webp",
  },
  {
    id: "peanut-butter",
    nameHe: "חמאת בוטנים",
    nameEn: "Peanut Butter",
    category: "fats",
    imagePath: "/food/fats/peanut-butter.webp",
  },
  {
    id: "pesto-sauce",
    nameHe: "רוטב פסטו",
    nameEn: "Pesto Sauce",
    category: "fats",
    imagePath: "/food/fats/pesto-sauce.webp",
  },
  {
    id: "pistachios",
    nameHe: "פיסטוקים",
    nameEn: "Pistachios",
    category: "fats",
    imagePath: "/food/fats/pistachios.webp",
  },
  {
    id: "pumpkin-seeds",
    nameHe: "גרעיני דלעת",
    nameEn: "Pumpkin Seeds",
    category: "fats",
    imagePath: "/food/fats/pumpkin-seeds.webp",
  },
  {
    id: "sunflower-seeds",
    nameHe: "גרעיני חמנייה",
    nameEn: "Sunflower Seeds",
    category: "fats",
    imagePath: "/food/fats/sunflower-seeds.webp",
  },
  {
    id: "tahini",
    nameHe: "טחינה",
    nameEn: "Tahini",
    category: "fats",
    imagePath: "/food/fats/tahini.webp",
  },
  {
    id: "walnuts",
    nameHe: "אגוזי מלך",
    nameEn: "Walnuts",
    category: "fats",
    imagePath: "/food/fats/walnuts.webp",
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
    "fruits",
    "fats",
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
