import { PageHeader } from "@/components/ui/PageHeader";
import { GymView } from "@/components/gym/GymView";

export default function GymPage() {
  return (
    <div>
      <PageHeader
        title="נוכחות במכון"
        subtitle="מדוד כניסה, יציאה וזמן שהייה במכון"
      />
      <GymView />
    </div>
  );
}
