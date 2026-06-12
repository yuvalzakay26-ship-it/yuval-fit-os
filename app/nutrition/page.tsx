import { PageHeader } from "@/components/ui/PageHeader";
import { NutritionView } from "@/components/nutrition/NutritionView";

export default function NutritionPage() {
  return (
    <div>
      <PageHeader title="תזונה" subtitle="מעקב פשוט אחר מאקרו וקלוריות" />
      <NutritionView />
    </div>
  );
}
