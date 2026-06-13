import { SupplementForm } from "@/components/supplements/SupplementForm";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NutritionSupplementAddPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <SupplementForm supplementId={first(sp.id)} preset={first(sp.preset)} />;
}
