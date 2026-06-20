"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FoodLibraryItem } from "@/lib/food-library";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChevronIcon } from "@/components/ui/icons";
import { FoodLibrary, type FoodFilter } from "./FoodLibrary";

/**
 * Full-screen food library. Replaces the old bottom-sheet picker: this is a
 * proper app screen (rendered inside the normal app shell, no overlay, no
 * dimmed page). Picking a food moves the user into the dedicated add-food
 * route, prefilled from the chosen item.
 */
export function FoodLibraryScreen({
  initialFilter = "all",
}: {
  initialFilter?: FoodFilter;
}) {
  const router = useRouter();

  const handleSelect = (item: FoodLibraryItem) => {
    router.push(`/nutrition/add?foodId=${encodeURIComponent(item.id)}`);
  };

  return (
    <div>
      <Link
        href="/nutrition"
        className="tap mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent-nutrition)]"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        תזונה
      </Link>

      <PageHeader
        title="הוסף מפריט קיים"
        subtitle="מאכלים מוכרים עם תמונה. אין כאן ערכים מוכנים — בוחרים פריט, ממלאים כמות וערכים, ושומרים ליומן."
        className="mb-4"
      />

      <FoodLibrary
        onSelect={handleSelect}
        expandable={false}
        initialFilter={initialFilter}
      />
    </div>
  );
}
