import { PageHeader } from "@/components/ui/PageHeader";
import { BackupView } from "@/components/backup/BackupView";

export default function BackupPage() {
  return (
    <div>
      <PageHeader
        title="גיבוי ושחזור"
        subtitle="שמור עותק פרטי של נתוני Fit OS במכשיר שלך"
      />
      <BackupView />
    </div>
  );
}
