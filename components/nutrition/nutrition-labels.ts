import type { MealType } from "@/lib/fitness-types";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "ארוחת בוקר",
  lunch: "ארוחת צהריים",
  dinner: "ארוחת ערב",
  snack: "נשנוש",
};

export const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
