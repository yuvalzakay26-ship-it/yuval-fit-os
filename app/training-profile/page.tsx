import { PageHeader } from "@/components/ui/PageHeader";
import { TrainingProfileView } from "@/components/profile/TrainingProfileView";

export const metadata = {
  title: "פרופיל אימון אישי · Fit OS",
};

export default function TrainingProfilePage() {
  return (
    <div>
      <PageHeader
        title="פרופיל אימון אישי"
        subtitle="כמה שאלות קצרות שיעזרו להתאים את החוויה אליך"
      />
      <TrainingProfileView />
    </div>
  );
}
