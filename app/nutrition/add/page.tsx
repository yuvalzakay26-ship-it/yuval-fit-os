import { AddFoodView } from "@/components/nutrition/AddFoodView";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NutritionAddPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <AddFoodView foodId={first(sp.foodId)} name={first(sp.name)} />;
}
