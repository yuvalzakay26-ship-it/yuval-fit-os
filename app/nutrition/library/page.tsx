import { FoodLibraryScreen } from "@/components/nutrition/FoodLibraryScreen";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NutritionLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Deep-link from the Nutrition "מועדפים → הצג הכל" action opens the favorites
  // view directly.
  const initialFilter = first(sp.view) === "favorites" ? "favorites" : "all";
  return <FoodLibraryScreen initialFilter={initialFilter} />;
}
