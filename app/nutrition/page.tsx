import { PageHeader } from "@/components/ui/PageHeader";
import { NutritionView } from "@/components/nutrition/NutritionView";
import { isNutritionAiConfigured } from "@/lib/nutrition-ai";

// Photo-first nutrition is gated on a server-side capability check. When no AI is
// configured, `aiEnabled` is false and the page hides the scan card entirely,
// degrading cleanly to manual + "add again". The secret key never reaches the
// client — only this boolean does. See `docs/NUTRITION_PHOTO_ASSIST.md`.
//
// Rendered per request so the capability reflects the live env (a key added
// after the build still gates correctly) rather than being baked at build time.
export const dynamic = "force-dynamic";

export default function NutritionPage() {
  const aiEnabled = isNutritionAiConfigured();
  return (
    <div>
      <PageHeader title="תזונה" subtitle="מעקב פשוט אחר מאקרו וקלוריות" />
      <NutritionView aiEnabled={aiEnabled} />
    </div>
  );
}
