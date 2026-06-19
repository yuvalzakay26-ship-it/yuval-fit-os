import { notFound } from "next/navigation";
import { RECIPES, recipeById } from "@/lib/recipes";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";

export function generateStaticParams() {
  return RECIPES.map((recipe) => ({ id: recipe.id }));
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = recipeById(id);
  if (!recipe) notFound();

  return <RecipeDetailView recipe={recipe} />;
}
