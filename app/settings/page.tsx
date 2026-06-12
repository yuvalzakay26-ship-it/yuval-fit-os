import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsView } from "@/components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="הגדרות" subtitle="העדפות, יעדים וניהול נתונים" />
      <SettingsView />
    </div>
  );
}
