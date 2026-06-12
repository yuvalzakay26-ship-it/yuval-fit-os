import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { WorkoutsView } from "@/components/workouts/WorkoutsView";

export default function WorkoutsPage() {
  return (
    <div>
      <PageHeader title="אימונים" subtitle="תיעוד וניהול אימוני הכוח שלך" />
      <Suspense fallback={null}>
        <WorkoutsView />
      </Suspense>
    </div>
  );
}
