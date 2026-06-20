// Recipe Library V1 — protein sweets & personal recipes.
//
// PRIVACY / SOURCE POLICY (see docs/RECIPE_LIBRARY_V1.md):
// The factual recipe data below (names, ingredients, exact quantities, nutrition
// values, cooking temperatures/times, functional step order) was extracted from a
// PRIVATE reference PDF that is NEVER committed, never placed in public assets, and
// never shown in the app. No original images, layout, branding, stamps, or
// marketing copy were copied. Preparation steps were REWRITTEN from scratch into
// clean app-style Hebrew — the meaning and functional order are preserved, but no
// wording is copied verbatim. Quantities, nutrition values, temperatures and times
// are reproduced exactly as in the source and must not be altered.
//
// This is a static, local-first seed — no backend, no Supabase, no new auth. Every
// recipe supports an optional `imageUrl`; the UI shows a safe gradient placeholder
// when none exists. V1.1 added Yuval's own standalone food photos (optimized WebP
// under /recipes/protein-sweets/) for 15 of the 17 recipes — these are NOT PDF
// pages, layout, or branding. Two recipes still have no photo and keep the
// placeholder. See docs/RECIPE_LIBRARY_V1.md.

import type { FoodLog } from "./fitness-types";
import { createId, todayISO } from "./utils";

/** How a recipe's nutrition figures should be read. */
export type RecipeNutritionScope =
  | "per_recipe"
  | "per_serving"
  | "per_unit"
  | "without_toppings";

export type RecipeNutrition = {
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  scope: RecipeNutritionScope;
  /** Optional free-text clarification (e.g. "הערכים אינם כוללים תוספות"). */
  note?: string;
};

export type RecipeIngredient = {
  text: string;
};

export type RecipeStep = {
  text: string;
};

/** Hebrew recipe categories surfaced as filter chips. */
export type RecipeCategory =
  | "מתוקים"
  | "שייקים"
  | "פנקייקים"
  | "מאפים"
  | "קינוחים"
  | "ארוחת בוקר"
  | "נשנוש";

export type Recipe = {
  id: string;
  title: string;
  category: RecipeCategory;
  tags: string[];
  /** Free-text serving scope hint, e.g. "6 יחידות" / "כ-1/8 עוגה". */
  servings?: string;
  /** Optional image; absent in V1 — UI falls back to a safe placeholder. */
  imageUrl?: string;
  nutrition: RecipeNutrition;
  ingredients: RecipeIngredient[];
  optionalToppings?: RecipeIngredient[];
  steps: RecipeStep[];
  /** Provenance marker — all V1 data is rewritten from a private reference. */
  sourceType: "private_reference_rewritten";
};

/** Short Hebrew label for a nutrition scope, shown next to the macro grid. */
export const RECIPE_SCOPE_LABELS: Record<RecipeNutritionScope, string> = {
  per_recipe: "ערכים לכל המנה",
  per_serving: "ערכים למנה",
  per_unit: "ערכים ליחידה",
  without_toppings: "ערכים ללא תוספות",
};

/** Stable display order for the category filter chips. */
const CATEGORY_ORDER: RecipeCategory[] = [
  "פנקייקים",
  "שייקים",
  "מאפים",
  "קינוחים",
  "מתוקים",
  "ארוחת בוקר",
  "נשנוש",
];

const ie = (text: string): RecipeIngredient => ({ text });
const st = (text: string): RecipeStep => ({ text });

export const RECIPES: Recipe[] = [
  {
    id: "pancake-pro",
    title: "פנקייק פרו",
    category: "פנקייקים",
    tags: ["מחבת"],
    imageUrl: "/recipes/protein-sweets/pancake-pro.webp",
    nutrition: {
      calories: 485,
      proteinGrams: 52,
      carbsGrams: 46,
      fatGrams: 9,
      fiberGrams: 13,
      scope: "without_toppings",
      note: "הערכים אינם כוללים תוספות.",
    },
    ingredients: [
      ie("40 גרם אבקת חלבון"),
      ie("5 גרם אבקת אפייה"),
      ie("ביצה L"),
      ie("90 גרם בננה (בננה רגילה)"),
      ie("50 מ״ל חלב 3%"),
      ie("10 גרם סיבים תזונתיים"),
    ],
    optionalToppings: [
      ie("13 גרם אבקת חמאת בוטנים דלת שומן (PB2)"),
      ie("סירופ מייפל 0 קלוריות (Walden Farms)"),
      ie("50–80 גרם אוכמניות קפואות"),
      ie("חצי בננה פרוסה"),
    ],
    steps: [
      st("מועכים את הבננה היטב ומוסיפים אליה את שאר הרכיבים בקערה."),
      st("מחממים מחבת על אש קטנה ומרססים קלות בספריי שמן."),
      st("יוצקים את הבלילה, מכסים וממתינים בסבלנות עד שהחלק העליון כבר אינו נוזלי."),
      st("הופכים את הפנקייק וממתינים כדקה נוספת — בשלב הזה כבר אין צורך במכסה."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "quick-souffle",
    title: "סופלה מהיר",
    category: "קינוחים",
    tags: ["מיקרוגל", "מהיר"],
    imageUrl: "/recipes/protein-sweets/quick-souffle.webp",
    nutrition: {
      calories: 422,
      proteinGrams: 54,
      carbsGrams: 26,
      fatGrams: 11,
      fiberGrams: 7,
      scope: "without_toppings",
      note: "הערכים אינם כוללים תוספות.",
    },
    ingredients: [
      ie("סקופ אבקת חלבון"),
      ie("18 גרם קקאו דל שומן"),
      ie("2 כפיות סוכרזית"),
      ie("מעדן GO שוקולד"),
      ie("ביצה"),
    ],
    optionalToppings: [
      ie("כ-100 קלוריות של שברי עוגיות, או כל תוספת אהובה אחרת"),
    ],
    steps: [
      st("מערבבים יחד את הרכיבים היבשים."),
      st("מוסיפים את הביצה והמעדן ומערבבים לתערובת אחידה."),
      st(
        "מכניסים למיקרוגל לכ-2 דקות (תלוי בעוצמת המכשיר); המרכז צריך להישאר מעט נוזלי והשוליים אפויים.",
      ),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "snickers-milkshake",
    title: "מילקשייק סניקרס",
    category: "שייקים",
    tags: ["בלנדר", "ללא אפייה", "משביע"],
    imageUrl: "/recipes/protein-sweets/snickers-milkshake.webp",
    nutrition: {
      calories: 354,
      proteinGrams: 44,
      carbsGrams: 22,
      fatGrams: 10,
      fiberGrams: 2,
      scope: "per_recipe",
      note: "משביע במיוחד.",
    },
    ingredients: [
      ie("120 מ״ל חלב (1% או שקדים)"),
      ie("13 גרם אבקת PB2 (או כפית חמאת בוטנים)"),
      ie("סקופ אבקת חלבון בטעם קרמל מלוח או וניל"),
      ie("20 מ״ל סירופ מייפל 0 קלוריות"),
      ie("חצי כפית קסנטן גאם למרקם סמיך (לא חובה)"),
    ],
    optionalToppings: [
      ie("קצפת מתוקה"),
      ie("שליש חטיף סניקרס חתוך לקוביות"),
      ie("סירופ שוקולד 0 קלוריות על דפנות הכוס"),
    ],
    steps: [
      st(
        "מכניסים את כל הרכיבים לבלנדר (קודם החלב ואז השאר) עם כוס גדולה של קוביות קרח, וטוחנים היטב.",
      ),
      st(
        "מוסיפים את התוספות מלמעלה — אפשר להיות יצירתיים עם כל תוספת של בוטנים, קרמל או שוקולד.",
      ),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "mm-milkshake",
    title: "מילקשייק M&M",
    category: "שייקים",
    tags: ["בלנדר", "ללא אפייה"],
    imageUrl: "/recipes/protein-sweets/mm-milkshake.webp",
    nutrition: {
      calories: 409,
      proteinGrams: 51,
      carbsGrams: 26,
      fatGrams: 11,
      fiberGrams: 2,
      scope: "per_recipe",
    },
    ingredients: [
      ie("120 מ״ל חלב קוקוס/שקדים או חלב 1%"),
      ie("סקופ אבקת חלבון שוקולד"),
      ie("50 גרם גלידה"),
      ie("100 גרם יוגורט לייט בטעם וניל"),
      ie("חצי חטיף חלבון (Trust)"),
      ie("הרבה קרח"),
    ],
    optionalToppings: [
      ie("קצפת מתוקה"),
      ie("סירופ שוקולד 0 קלוריות (Walden Farms)"),
    ],
    steps: [
      st(
        "מכניסים את כל הרכיבים לבלנדר (קודם החלב ואז השאר) עם כוס גדולה של קוביות קרח, וטוחנים היטב.",
      ),
      st(
        "מוסיפים את התוספות מלמעלה. אפשר לקצוץ את החצי השני של חטיף החלבון ולפזר אותו מעל.",
      ),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "oreo-donuts",
    title: "אוריאו דונאטס",
    category: "מאפים",
    tags: ["תנור"],
    servings: "6 יחידות",
    imageUrl: "/recipes/protein-sweets/oreo-donuts.webp",
    nutrition: {
      calories: 82,
      proteinGrams: 7,
      carbsGrams: 9,
      fatGrams: 2,
      fiberGrams: 1,
      scope: "per_unit",
      note: "המתכון הוא ל-6 יחידות.",
    },
    ingredients: [
      ie("חצי כף קקאו דל שומן"),
      ie("ביצה"),
      ie("90 גרם יוגורט חלבון במתיקות מעודנת"),
      ie("10 גרם סטיביה"),
      ie("40 גרם קמח שיבולת שועל (אפשר לטחון שיבולת שועל)"),
      ie("חצי כף אבקת אפייה"),
      ie("מלח"),
    ],
    optionalToppings: [
      ie("2 עוגיות אוריאו מפוררות"),
      ie("חצי סקופ אבקת חלבון בטעם קרם עוגיות"),
      ie("50 גרם יוגורט וניל"),
    ],
    steps: [
      st("מערבבים את כל הרכיבים בקערה."),
      st("מפזרים את הבלילה לתבנית דונאטס ל-6 יחידות."),
      st("אופים בתנור שחומם ל-180°C למשך 15 דקות."),
      st(
        "מפוררים את האוריאו בצלחת אחת; בצלחת נפרדת מערבבים את 50 גרם יוגורט הווניל עם חצי סקופ החלבון.",
      ),
      st("טובלים כל דונאט בקרם ואז בפירורי האוריאו."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "pancake-pro-light-plus",
    title: "פנקייק פרו לייט+",
    category: "פנקייקים",
    tags: ["מחבת", "משביע"],
    imageUrl: "/recipes/protein-sweets/pancake-pro-light-plus.webp",
    nutrition: {
      calories: 317,
      proteinGrams: 66,
      carbsGrams: 8,
      fatGrams: 2,
      fiberGrams: 2,
      scope: "without_toppings",
      note: "משביע במיוחד. הערכים אינם כוללים תוספות.",
    },
    ingredients: [
      ie("50 גרם אבקת חלבון"),
      ie("5 גרם אבקת אפייה"),
      ie("3 חלבוני ביצה"),
      ie("100 גרם יופלה בננה־קרמל"),
      ie("50 מ״ל חלב 1%"),
      ie("15 גרם סוויטנגו (או 3 שקיות ממתיק)"),
    ],
    optionalToppings: [
      ie("13 גרם אבקת חמאת בוטנים דלת שומן (PB2)"),
      ie("סירופ מייפל 0 קלוריות (Walden Farms)"),
      ie("50–80 גרם אוכמניות קפואות"),
    ],
    steps: [
      st("מערבבים את כל הרכיבים בקערה."),
      st("מחממים מחבת על אש קטנה ומרססים קלות בספריי שמן."),
      st("יוצקים את הבלילה, מכסים וממתינים בסבלנות עד שהחלק העליון כבר אינו נוזלי."),
      st("הופכים וממתינים כדקה נוספת — בשלב הזה כבר אין צורך במכסה."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "fluffy-muffins",
    title: "פלאפי מאפינס",
    category: "מאפים",
    tags: ["תנור"],
    servings: "16 יחידות",
    imageUrl: "/recipes/protein-sweets/fluffy-muffins.webp",
    nutrition: {
      calories: 59,
      proteinGrams: 6,
      carbsGrams: 8,
      fatGrams: 0.5,
      fiberGrams: 2,
      scope: "per_unit",
      note: "המתכון הוא ל-16 יחידות.",
    },
    ingredients: [
      ie("2 בננות בינוניות (180 גרם)"),
      ie("70 גרם אבקת חלבון וניל / בננה / קרמל מלוח"),
      ie("45 גרם קמח תופח"),
      ie("5 גרם סודה לשתייה"),
      ie("5 יחידות ממתיק"),
      ie("2 כפות גדושות דנונה פרו (כ-70 גרם)"),
      ie("3 חלבוני ביצה"),
    ],
    optionalToppings: [
      ie("שוקולד צ׳יפס, אוכמניות, נוטלה או כל תוספת אחרת לבחירה"),
    ],
    steps: [
      st("מועכים את הבננות היטב."),
      st("מוסיפים את שאר הרכיבים ומערבבים עד למרקם אחיד."),
      st(
        "מפזרים את הבלילה ל-16 שקעי מאפינס (מרססים בספריי שמן בפנים כדי שהמאפינס לא יידבק).",
      ),
      st("מוסיפים את התוספות לבחירה."),
      st("אופים ב-170°C למשך 10–15 דקות; בודקים עם קיסם שהמרכז אפוי."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "lotus-biscoff",
    title: "ביסקוף לוטוס",
    category: "קינוחים",
    tags: ["תנור"],
    servings: "3 יחידות",
    imageUrl: "/recipes/protein-sweets/lotus-biscoff.webp",
    nutrition: {
      calories: 130,
      proteinGrams: 12.6,
      carbsGrams: 8,
      fatGrams: 5.3,
      fiberGrams: 2,
      scope: "per_unit",
      note: "המתכון הוא ל-3 יחידות.",
    },
    ingredients: [
      ie("6 חלבוני ביצה"),
      ie("15 גרם אבקת חלבון וניל"),
      ie("קרם טרטר"),
      ie("10 גרם סטיביה או סוויטנגו"),
      ie("תמצית וניל"),
    ],
    optionalToppings: [
      ie("קצפת מתוקה"),
      ie("ביסקוויט לוטוס"),
      ie("כפית ממרח לוטוס"),
    ],
    steps: [
      st("מפרידים 6 ביצים, שומרים רק את החלבונים ומקציפים אותם במערבל."),
      st(
        "בקערה נפרדת מערבבים את הרכיבים היבשים — אבקת חלבון, קרם טרטר וממתיק.",
      ),
      st(
        "מפזרים על החלבונים המוקצפים כמה טיפות תמצית וניל, ומקפלים פנימה בעדינות את תערובת היבשים בכמה פעימות — בלי לערבב יתר על המידה.",
      ),
      st("יוצקים את התערובת ל-3 כוסות אפייה שונות."),
      st("אופים בתנור שחומם מראש ל-180°C למשך 15–20 דקות."),
      st(
        "לתוספת: מערבבים כפית גדושה של ממרח לוטוס עם כמה טיפות חלב עד למרקם רוטב, ומזלפים מעל הביסקוף מיד עם היציאה מהתנור. מוסיפים קצפת ופירורי ביסקוויט לוטוס מעוך.",
      ),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "cinnamon-cinnabon",
    title: "סינבון קינמון",
    category: "מאפים",
    tags: ["תנור"],
    servings: "6 יחידות",
    imageUrl: "/recipes/protein-sweets/cinnamon-cinnabon.webp",
    nutrition: {
      calories: 76,
      proteinGrams: 6,
      carbsGrams: 4,
      fatGrams: 0.6,
      fiberGrams: 3,
      scope: "per_unit",
      note: "המתכון הוא ל-6 יחידות.",
    },
    ingredients: [
      ie("115 גרם קמח תופח"),
      ie("130 גרם יוגורט חלבון"),
      ie("35 גרם סירופ מייפל 0 קלוריות"),
      ie("30 גרם סוכר חום סטיביה או סוויטנגו"),
      ie("2 כפיות קינמון"),
      ie("מעדן GO תנובה (12 גרם חלבון, וניל)"),
    ],
    steps: [
      st("מנפים את הקמח התופח דרך מסננת."),
      st("מוסיפים את היוגורט ומערבבים עד שמתחיל להיווצר בצק."),
      st("על משטח עבודה מקומח מרדדים את הבצק למלבן גדול."),
      st("מורחים את המייפל ומפזרים אחיד את הסוכר והקינמון על כל השטח."),
      st("מגלגלים את הבצק לרולדה וחותכים ל-6 חתיכות שוות."),
      st("אופים ב-180°C למשך 20 דקות."),
      st("מורחים מעל כל חתיכה כפית ממעדן GO וניל."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "carrot-cake",
    title: "עוגת גזר",
    category: "קינוחים",
    tags: ["תנור"],
    servings: "כ-1/8 עוגה",
    imageUrl: "/recipes/protein-sweets/carrot-cake.webp",
    nutrition: {
      calories: 103,
      proteinGrams: 10,
      carbsGrams: 13.5,
      fatGrams: 1,
      fiberGrams: 7,
      scope: "per_serving",
      note: "ערכים לחתיכה (כ-1/8 עוגה).",
    },
    ingredients: [
      ie("2–3 גזרים בינוניים"),
      ie("120 גרם קמח"),
      ie("60 גרם אבקת חלבון וניל"),
      ie("15 גרם סוכרלוז"),
      ie("חצי כפית אבקת אפייה"),
      ie("כפית קינמון"),
      ie("מעט מלח"),
      ie("חצי כפית ג׳ינג׳ר"),
      ie(
        "נוזלים: 120 מ״ל מיץ תפוחים, 60 מ״ל חלב שקדים, 60 מ״ל סירופ מייפל 0 קלוריות, ביצה שלמה + 3 חלבוני ביצה, כפית תמצית וניל",
      ),
      ie(
        "ציפוי: 120 גרם יוגורט 0%, 120 גרם גבינת שמנת 5%, גרידת לימון, 30 גרם סוויטנגו",
      ),
    ],
    steps: [
      st("מגררים את הגזר בפומפייה וסופגים היטב את הנוזלים בעזרת נייר סופג."),
      st("מערבבים את הגזר עם כל הרכיבים היבשים."),
      st("בנפרד מערבבים את כל הרכיבים הרטובים, ורק אז משלבים אותם עם היבשים."),
      st("מפזרים בתבנית ואופים בתנור שחומם ל-170°C למשך 25 דקות."),
      st("נותנים לעוגה להתקרר ובינתיים מכינים את הקרם."),
      st("כשהעוגה קרה, מורחים מעליה את הקרם."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "brownie-cake",
    title: "עוגת בראוניז",
    category: "קינוחים",
    tags: ["תנור"],
    imageUrl: "/recipes/protein-sweets/brownie-cake.webp",
    nutrition: {
      calories: 103,
      proteinGrams: 10,
      carbsGrams: 13.5,
      fatGrams: 1,
      fiberGrams: 7,
      scope: "per_recipe",
      note: "ערכים לכל העוגה.",
    },
    ingredients: [
      ie("21 גרם אבקת קקאו דל שומן"),
      ie("12 גרם אבקת חלבון שוקולד"),
      ie("15 גרם קמח"),
      ie("45 גרם סוויטנגו"),
      ie("מלח"),
      ie("120 גרם קולה זירו"),
    ],
    steps: [
      st("מערבבים את הרכיבים היבשים ואז מוסיפים את שאר הרכיבים."),
      st("יוצקים הכול לתבנית ואופים 30 דקות ב-200°C."),
      st("בודקים כל 10 דקות שמרכז העוגה לח אך לא נוזלי."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "oreo-cake",
    title: "עוגת אוריאו",
    category: "קינוחים",
    tags: ["תנור", "מקפיא"],
    servings: "6 יחידות",
    imageUrl: "/recipes/protein-sweets/oreo-cake.webp",
    nutrition: {
      calories: 193,
      proteinGrams: 24.5,
      carbsGrams: 11,
      fatGrams: 5.6,
      fiberGrams: 3,
      scope: "per_unit",
      note: "המתכון הוא ל-6 יחידות.",
    },
    ingredients: [
      ie("150 גרם שמנת לייט (פילדלפיה)"),
      ie("400 גרם יוגורט חלבון במתיקות מעודנת"),
      ie("2 סקופים אבקת חלבון בטעם קרם עוגיות"),
      ie("ביצה אחת"),
      ie("100 גרם קוטג׳ 3%"),
    ],
    optionalToppings: [
      ie("סקופ אבקת חלבון שוקולד"),
      ie("10 גרם קקאו דל שומן"),
      ie("60 מ״ל חלב 1%"),
      ie("3 עוגיות אוריאו מפוררות"),
    ],
    steps: [
      st("טוחנים בבלנדר את כל רכיבי העוגה עד למרקם חלק."),
      st("מפזרים בתבנית עוגה ואופים 20–30 דקות ב-200°C."),
      st("מעבירים למקפיא למשך שעה."),
      st(
        "בקערה מערבבים את סקופ החלבון שוקולד עם 5 גרם קקאו ו-60 מ״ל חלב עד למרקם סמיך, ואז מוסיפים עוד 5 גרם קקאו ומערבבים שוב.",
      ),
      st("מורחים את הקרם על העוגה ומפזרים מעל את האוריאו."),
      st("מקררים במקפיא חצי שעה נוספת ומגישים."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "blueberry-cheesecake",
    title: "עוגת גבינה אוכמניות",
    category: "קינוחים",
    tags: ["תנור", "מקפיא"],
    servings: "6 יחידות",
    imageUrl: "/recipes/protein-sweets/blueberry-cheesecake.webp",
    nutrition: {
      calories: 166,
      proteinGrams: 16.3,
      carbsGrams: 13.4,
      fatGrams: 5.3,
      fiberGrams: 3,
      scope: "per_unit",
      note: "המתכון הוא ל-6 יחידות.",
    },
    ingredients: [
      ie("150 גרם שמנת לייט (פילדלפיה)"),
      ie("400 גרם יוגורט חלבון במתיקות מעודנת"),
      ie("2 סקופים אבקת חלבון בטעם קרם עוגיות"),
      ie("ביצה אחת"),
      ie("כפית תמצית וניל"),
      ie("15 גרם סטיביה"),
      ie("40 גרם אבקת חלבון וניל"),
    ],
    optionalToppings: [
      ie("200 גרם אוכמניות קפואות"),
      ie("10 גרם קורנפלור"),
      ie("2 ביסקוויטים מעוכים"),
      ie("20 גרם שוקולד לבן"),
    ],
    steps: [
      st("טוחנים בבלנדר את כל רכיבי העוגה עד למרקם חלק."),
      st(
        "מפזרים בתבנית עוגה, מוסיפים 50 גרם אוכמניות לבלילה ואופים 20–30 דקות ב-200°C.",
      ),
      st("מעבירים למקפיא למשך שעה."),
      st(
        "במחבת מפזרים את שאר האוכמניות (150 גרם) ומוסיפים 10 גרם קורנפלור שעורבב מראש עם חצי כוס מים.",
      ),
      st("מערבבים עד שהתערובת סמיכה."),
      st("מורחים את האוכמניות על כל העוגה ומפזרים מעל ביסקוויט מפורר."),
      st("ממיסים את השוקולד הלבן במיקרוגל ומזלפים מעל העוגה."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "vanilla-pro-icecream",
    title: "גלידת וניל פרו",
    category: "קינוחים",
    tags: ["מקפיא", "ללא אפייה"],
    imageUrl: "/recipes/protein-sweets/vanilla-pro-icecream.webp",
    nutrition: {
      calories: 604,
      proteinGrams: 68,
      carbsGrams: 62,
      fatGrams: 9,
      fiberGrams: 2,
      scope: "without_toppings",
      note: "הערכים אינם כוללים תוספות.",
    },
    ingredients: [
      ie("200 גרם דנונה פרו 1.5% וניל"),
      ie("150 מ״ל חלב או שמנת מתוקה 10%"),
      ie("תמצית וניל"),
      ie("50 גרם פודינג וניל ללא סוכר"),
      ie("50 גרם אבקת חלבון וניל"),
      ie("כפית קסנטן גאם (לא חובה)"),
    ],
    optionalToppings: [
      ie("אבקת חמאת בוטנים (PB2) מעורבבת עם סירופ שוקולד 0 קלוריות (Walden Farms)"),
      ie("בננה פרוסה"),
    ],
    steps: [
      st("טוחנים את כל הרכיבים בבלנדר עד למרקם אחיד."),
      st("מכניסים למקפיא למשך 3–4 שעות."),
      st(
        "לתוספת: מזלפים מעל הגלידה אבקת PB2 מעורבבת בסירופ שוקולד 0 קלוריות, ומניחים מעל פרוסות בננה.",
      ),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "fruit-muesli",
    title: "מוזלי פירות",
    category: "ארוחת בוקר",
    tags: ["ללא אפייה", "משביע"],
    imageUrl: "/recipes/protein-sweets/fruit-muesli.webp",
    nutrition: {
      calories: 294,
      proteinGrams: 42,
      carbsGrams: 33,
      fatGrams: 1,
      fiberGrams: 9,
      scope: "without_toppings",
      note: "משביע במיוחד. הערכים אינם כוללים תוספות.",
    },
    ingredients: [
      ie("2 מעדני פרו לייט (יופלה)"),
      ie("50 גרם אוכמניות"),
      ie("150 גרם תותים"),
      ie("100 גרם מלון"),
      ie("15 גרם סוויטנגו"),
      ie("שליש כפית קינמון"),
    ],
    steps: [
      st("מערבבים את המעדנים עם הקינמון והסוויטנגו, ואז מוסיפים את הפירות."),
      st("אפשר להחליף אחד מהמעדנים ביוגורט יופרו 0% אם המרקם סמיך מדי."),
      st("מומלץ לבחור מעדן פרו בטעם בננה־קרמל, תות או אפרסק."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "protein-shakshuka",
    title: "שקשוקה חלבונית",
    category: "ארוחת בוקר",
    tags: ["מחבת", "משביע"],
    nutrition: {
      calories: 468,
      proteinGrams: 53,
      carbsGrams: 48,
      fatGrams: 7,
      fiberGrams: 4,
      scope: "per_recipe",
      note: "משביע במיוחד.",
    },
    ingredients: [
      ie("5 חלבוני ביצה"),
      ie("400 גרם עגבניות מרוסקות"),
      ie("בצל שלם"),
      ie("3 שיני שום"),
      ie("צרור גדול פטרוזיליה וכוסברה"),
      ie("תבלינים: פפריקה, מלח ופלפל"),
      ie("פיתה כוסמין 99 קלוריות"),
      ie("גביע קוטג׳ 1%"),
    ],
    steps: [
      st("מחממים מחבת על אש בינונית ומרססים קלות בספריי שמן."),
      st("מטגנים את הבצל והשום עד הזהבה."),
      st("מוסיפים את העגבניות המרוסקות, התבלינים והעשבים ומכסים."),
      st(
        "כשהרוטב מבעבע, יוצרים שקעים ומוסיפים את החלבונים למרכז; מנמיכים את האש ומכסים שוב.",
      ),
      st("חוצים את הפיתה לשניים ומחממים בטוסטר. מגישים."),
    ],
    sourceType: "private_reference_rewritten",
  },
  {
    id: "light-bourekas",
    title: "בורקס לייט",
    category: "נשנוש",
    tags: ["תנור"],
    nutrition: {
      calories: 66,
      proteinGrams: 6,
      carbsGrams: 5.5,
      fatGrams: 2,
      fiberGrams: 1,
      scope: "per_unit",
    },
    ingredients: [
      ie("דפי אורז"),
      ie("קורנפלור"),
      ie("2 ביצים"),
      ie("טריאקי"),
      ie("שומשום"),
      ie(
        "גבינות 5%: שמנת 100 גרם, גבינה לבנה 50 גרם, בולגרית למריחה 200 גרם, צפתית 100 גרם, 5 פרוסות גבינה צהובה 9%",
      ),
    ],
    steps: [
      st(
        "מועכים את כל הגבינות בקערה, מוסיפים 2 כפות קורנפלור (לא חובה), ביצה אחת ומעט מלח.",
      ),
      st("בצלחת שטוחה נפרדת מערבבים חצי כוס מים, ביצה אחת וכף טריאקי."),
      st("טובלים דף אורז משני הצדדים, ומניחים מעליו דף אורז נוסף טבול."),
      st(
        "מניחים כף מתערובת הגבינות במרכז שני דפי האורז ומקפלים את הבורקס בצורה סימטרית.",
      ),
      st(
        "מסדרים את היחידות על תבנית עם נייר אפייה וספריי שמן זית, ומפזרים מעט שומשום מעל.",
      ),
      st("אופים בתנור שחומם ל-170°C למשך 15 דקות. נותנים להתקרר ומגישים."),
    ],
    sourceType: "private_reference_rewritten",
  },
];

const RECIPE_BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

/** Look up a recipe by its stable `id`. */
export function recipeById(id: string): Recipe | undefined {
  return RECIPE_BY_ID.get(id);
}

/** Categories that actually have recipes, in a stable display order. */
export function recipeCategoriesInLibrary(): RecipeCategory[] {
  const present = new Set(RECIPES.map((r) => r.category));
  return CATEGORY_ORDER.filter((c) => present.has(c));
}

/**
 * Filter recipes by category ("all" = no category filter) and a free-text query
 * matched against the title, tags and ingredient text. Both are optional.
 */
export function filterRecipes(
  category: RecipeCategory | "all" = "all",
  query = "",
): Recipe[] {
  const q = query.trim().toLowerCase();
  return RECIPES.filter((recipe) => {
    if (category !== "all" && recipe.category !== category) return false;
    if (!q) return true;
    if (recipe.title.toLowerCase().includes(q)) return true;
    if (recipe.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (recipe.ingredients.some((i) => i.text.toLowerCase().includes(q))) {
      return true;
    }
    return false;
  });
}

/** Human-friendly quantity text for a food-log entry built from a recipe. */
export function recipeServingText(recipe: Recipe): string {
  switch (recipe.nutrition.scope) {
    case "per_unit":
      return "יחידה אחת";
    case "per_serving":
      return recipe.servings ? `חתיכה (${recipe.servings})` : "חתיכה אחת";
    case "without_toppings":
      return "מנה שלמה (ללא תוספות)";
    case "per_recipe":
    default:
      return "מנה שלמה";
  }
}

/**
 * Build (but do not persist) a FoodLog from a recipe's nutrition values. The
 * scope decides the quantity label; macros map directly. Fiber has no FoodLog
 * field (schema unchanged) and is intentionally dropped. mealType defaults to
 * breakfast for breakfast recipes, otherwise snack — both editable later in the
 * normal nutrition flow.
 */
export function foodLogFromRecipe(recipe: Recipe): FoodLog {
  const { nutrition } = recipe;
  return {
    id: createId("food"),
    date: todayISO(),
    mealType: recipe.category === "ארוחת בוקר" ? "breakfast" : "snack",
    foodName: recipe.title,
    quantityText: recipeServingText(recipe),
    ...(nutrition.calories !== undefined ? { calories: nutrition.calories } : {}),
    protein: nutrition.proteinGrams ?? 0,
    carbs: nutrition.carbsGrams ?? 0,
    fat: nutrition.fatGrams ?? 0,
  };
}
