import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressView } from "@/components/progress/ProgressView";

export default function ProgressPage() {
  return (
    <div>
      <PageHeader title="התקדמות" subtitle="סיכום הנתונים והשיאים שלך" />
      <ProgressView />
    </div>
  );
}
