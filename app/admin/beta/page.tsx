import { PageHeader } from "@/components/ui/PageHeader";
import { BetaAdminView } from "@/components/admin/BetaAdminView";

/**
 * Beta admin route. The app-wide gate chain (layout) already requires a signed-in
 * + approved user to reach any route, and BetaAdminView additionally verifies
 * admin rights — with Row Level Security enforcing it server-side regardless of
 * what the client renders. Manages beta access only; no fitness data here.
 */
export default function BetaAdminPage() {
  return (
    <div>
      <PageHeader title="ניהול בטא" subtitle="נהל מי יכול להיכנס למערכת" />
      <BetaAdminView />
    </div>
  );
}
