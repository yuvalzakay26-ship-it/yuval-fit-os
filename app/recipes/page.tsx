import { PageHeader } from "@/components/ui/PageHeader";
import { RecipeLibraryView } from "@/components/recipes/RecipeLibraryView";

export default function RecipesPage() {
  return (
    <div>
      <PageHeader
        title="ספריית מתכונים"
        subtitle="מתכוני חלבון ומתוקים שאפשר לשמור ליומן התזונה."
        className="mb-4"
      />
      <RecipeLibraryView />
    </div>
  );
}
