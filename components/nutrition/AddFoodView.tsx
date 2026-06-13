"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FOOD_LIBRARY } from "@/lib/food-library";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChevronIcon } from "@/components/ui/icons";
import { FoodLogForm, type FoodPrefill } from "./FoodLogForm";

/**
 * Full-screen add-food flow. Reached from the food library (with a `foodId`),
 * from a recent food (with a `foodId` or a free `name`), or as a blank manual
 * entry (no params). Saving writes the log and returns to the Nutrition screen.
 *
 * Macros are never inferred — the form starts empty and the user enters them.
 */
export function AddFoodView({
  foodId,
  name,
}: {
  foodId?: string;
  name?: string;
}) {
  const router = useRouter();

  const libraryItem = foodId
    ? FOOD_LIBRARY.find((item) => item.id === foodId)
    : undefined;

  let prefill: FoodPrefill | null = null;
  if (libraryItem) {
    prefill = {
      foodName: libraryItem.nameHe,
      category: libraryItem.category,
      imagePath: libraryItem.imagePath,
      sourceFoodId: libraryItem.id,
      quantityText: libraryItem.defaultQuantityText,
    };
  } else if (name) {
    prefill = { foodName: name };
  }

  const fromLibrary = Boolean(libraryItem);
  const title = fromLibrary ? "הוספת מאכל ליומן" : "הוספה ידנית";
  const subtitle = fromLibrary
    ? "מלא כמות וערכים תזונתיים, ואז שמור ליומן."
    : "רשום מאכל וערכים תזונתיים, ואז שמור ליומן.";

  return (
    <div>
      <Link
        href={fromLibrary ? "/nutrition/library" : "/nutrition"}
        className="tap mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent-nutrition)]"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        {fromLibrary ? "מאגר האוכל" : "תזונה"}
      </Link>

      <PageHeader title={title} subtitle={subtitle} className="mb-4" />

      <FoodLogForm prefill={prefill} onSaved={() => router.push("/nutrition")} />
    </div>
  );
}
