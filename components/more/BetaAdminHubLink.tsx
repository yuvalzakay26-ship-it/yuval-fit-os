"use client";

import Link from "next/link";
import { useBetaAdmin } from "@/lib/beta-access";
import { Card, CardTitle } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/PageHeader";
import { ChevronIcon, ShieldIcon } from "@/components/ui/icons";

/**
 * Admin-only entry point to the beta admin panel, surfaced in the System Hub.
 * Renders nothing unless the database confirms the current user is a beta admin,
 * so the link never appears for regular beta users. The panel route is still
 * RLS-guarded regardless of this link being shown.
 */
export function BetaAdminHubLink() {
  const { isAdmin } = useBetaAdmin();
  if (!isAdmin) return null;

  return (
    <section>
      <SectionHeader title="ניהול" accent="var(--muted)" />
      <Link
        href="/admin/beta"
        className="tap block"
        aria-label="ניהול בטא — נהל מי יכול להיכנס למערכת"
      >
        <Card className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
            <ShieldIcon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">ניהול בטא</CardTitle>
            <p className="mt-0.5 truncate text-[12.5px] text-muted">
              נהל מי יכול להיכנס למערכת
            </p>
          </div>
          <ChevronIcon className="h-4 w-4 shrink-0 rotate-180 text-faint" />
        </Card>
      </Link>
    </section>
  );
}
