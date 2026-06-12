import { PageHeader } from "@/components/ui/PageHeader";
import { ExerciseLibrary } from "@/components/exercises/ExerciseLibrary";

export default function ExercisesPage() {
  return (
    <div>
      <PageHeader title="תרגילים" subtitle="ספריית התרגילים שלך" />
      <ExerciseLibrary />
    </div>
  );
}
