"use client";

import Link from "next/link";
import {
  activeSupplements,
  supplementDaySummary,
  takenSupplementIds,
} from "@/lib/analytics";
import {
  saveSupplement,
  toggleSupplementTaken,
  useSupplementLogs,
  useSupplements,
} from "@/lib/fitness-store";
import type { Supplement } from "@/lib/fitness-types";
import { cn, todayISO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { EmptyState, PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import {
  CapsuleIcon,
  CheckIcon,
  ChevronIcon,
  PencilIcon,
  PillIcon,
  PlusIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { SupplementCheck } from "./SupplementCheck";
import {
  SUPPLEMENT_CATEGORY_LABELS,
  SUPPLEMENT_HELPER_COPY,
  SUPPLEMENT_SAFETY_PRIMARY,
  SUPPLEMENT_SAFETY_SECONDARY,
  SUPPLEMENT_TIMING_LABELS,
  supplementStatusLine,
} from "./supplement-copy";

/** Small pill-shaped tag used for category + timing chips. */
function Chip({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "supplement";
}) {
  return (
    <span
      className={
        tone === "supplement"
          ? "inline-flex items-center rounded-full bg-[color:var(--accent-supplement-soft)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--accent-supplement)]"
          : "inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted"
      }
    >
      {children}
    </span>
  );
}

function SupplementListItem({
  supplement,
  taken,
  onToggle,
}: {
  supplement: Supplement;
  taken: boolean;
  onToggle: () => void;
}) {
  const times = supplement.schedule?.timesOfDay ?? [];
  return (
    <Card
      className={cn(
        "sheen flex items-center gap-3 p-3.5 transition-colors",
        taken && "bg-[color:var(--accent-supplement-soft)]",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
          taken
            ? "supplement-gradient text-[color:var(--accent-contrast)] shadow-glow-supplement"
            : "bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]",
        )}
      >
        <PillIcon className="h-5 w-5" />
      </span>
      <Link
        href={`/nutrition/supplements/add?id=${encodeURIComponent(supplement.id)}`}
        className="tap min-w-0 flex-1"
        aria-label={`ערוך ${supplement.name}`}
      >
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[15px] font-bold text-foreground">
            {supplement.name}
          </p>
          <PencilIcon className="h-3.5 w-3.5 shrink-0 text-faint" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Chip tone="supplement">
            {SUPPLEMENT_CATEGORY_LABELS[supplement.category]}
          </Chip>
          {times.map((t) => (
            <Chip key={t}>{SUPPLEMENT_TIMING_LABELS[t]}</Chip>
          ))}
        </div>
        {supplement.dosageText && (
          <p className="mt-1 truncate text-[12px] text-muted">
            {supplement.dosageText}
          </p>
        )}
      </Link>
      <SupplementCheck taken={taken} name={supplement.name} onToggle={onToggle} />
    </Card>
  );
}

/**
 * Full-screen supplements tracker (route `/nutrition/supplements`). A premium,
 * safety-first daily habit screen: a violet completion ring, a calm safety note,
 * the active supplement list with per-item taken-toggles, archived items with a
 * one-tap reactivate, and a clear empty state. localStorage-only via the store.
 *
 * Boundary: never recommends supplements or dosages — only tracks what the user
 * already chose to add.
 */
export function SupplementsTracker() {
  const supplements = useSupplements();
  const logs = useSupplementLogs();
  const today = todayISO();

  const active = activeSupplements(supplements);
  const inactive = supplements.filter((s) => !s.isActive);
  const taken = takenSupplementIds(logs, today);
  const summary = supplementDaySummary(supplements, logs, today);
  const allDone = summary.active > 0 && summary.taken >= summary.active;

  const reactivate = (s: Supplement) =>
    saveSupplement({ ...s, isActive: true, updatedAt: new Date().toISOString() });

  return (
    <div>
      <Link
        href="/nutrition"
        className="tap mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent-supplement)]"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        תזונה
      </Link>

      <PageHeader
        title="מעקב תוספים"
        subtitle={SUPPLEMENT_HELPER_COPY}
        className="mb-4"
      />

      {/* Safety note — calm and responsible, never alarming. */}
      <Card
        variant="flat"
        className="mb-5 flex items-start gap-3 border-[color:var(--accent-supplement-soft)] p-3.5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
          <ShieldIcon className="h-[18px] w-[18px]" />
        </span>
        <p className="text-[12.5px] leading-relaxed text-muted">
          {SUPPLEMENT_SAFETY_PRIMARY}
          <br />
          {SUPPLEMENT_SAFETY_SECONDARY}
        </p>
      </Card>

      {/* Today progress hero — only meaningful once there are active items. */}
      {active.length > 0 && (
        <Card
          variant="raised"
          className="module-supplement sheen relative overflow-hidden p-6"
        >
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full opacity-60 blur-2xl"
            style={{ background: "var(--accent-supplement-soft)" }}
          />
          <div className="relative flex flex-col items-center text-center">
            <span className="relative">
              <ProgressRing
                value={summary.taken}
                goal={summary.active}
                size={132}
                stroke={11}
                gradientId="supplements-hero-ring"
                from="var(--accent-supplement)"
                to="var(--accent-supplement)"
              >
                <span className="text-[30px] font-extrabold leading-none tabular-nums text-foreground">
                  {summary.taken}/{summary.active}
                </span>
                <span className="mt-1 text-[11px] font-semibold text-faint">
                  סומנו היום
                </span>
              </ProgressRing>
              {allDone && (
                <span className="absolute end-1 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-raised bg-[color:var(--accent-supplement)] text-[color:var(--accent-contrast)] shadow-glow-supplement">
                  <CheckIcon className="h-4 w-4" />
                </span>
              )}
            </span>
            <p className="mt-4 text-[18px] font-extrabold leading-none text-foreground">
              {summary.taken} מתוך {summary.active} תוספים
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-muted">
              {supplementStatusLine(summary.taken, summary.active)}
            </p>
          </div>
        </Card>
      )}

      {/* Active supplements */}
      <section className="mt-6">
        <SectionHeader
          title="התוספים שלי"
          action={
            <Link
              href="/nutrition/supplements/add"
              className="tap flex items-center gap-1 text-[12px] font-semibold text-[color:var(--accent-supplement)]"
            >
              <PlusIcon className="h-4 w-4" /> הוסף
            </Link>
          }
        />
        {active.length === 0 ? (
          <EmptyState
            icon={<CapsuleIcon className="h-7 w-7" />}
            title="עדיין לא הוגדרו תוספים"
            description="אפשר להוסיף פריטים למעקב אישי — סמן אותם כל יום ושמור על שגרה."
            action={
              <Link href="/nutrition/supplements/add">
                <Button className="supplement-gradient shadow-glow-supplement">
                  <PlusIcon className="h-5 w-5" /> הוסף תוסף ראשון
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {active.map((s) => (
              <SupplementListItem
                key={s.id}
                supplement={s}
                taken={taken.has(s.id)}
                onToggle={() => toggleSupplementTaken(s.id, today)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Archived supplements — kept with history, out of the daily list. */}
      {inactive.length > 0 && (
        <section className="mt-6">
          <SectionHeader title={`בארכיון · ${inactive.length}`} />
          <div className="space-y-2.5">
            {inactive.map((s) => (
              <Card
                key={s.id}
                variant="flat"
                className="flex items-center gap-3 p-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface text-faint">
                  <PillIcon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-foreground">
                    {s.name}
                  </p>
                  <p className="truncate text-[11.5px] text-muted">
                    {SUPPLEMENT_CATEGORY_LABELS[s.category]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => reactivate(s)}
                  className="tap shrink-0 rounded-xl border border-border-strong px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-surface-2"
                >
                  הפעל מחדש
                </button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-center text-[12px] leading-relaxed text-faint">
        {SUPPLEMENT_SAFETY_PRIMARY}
      </p>
    </div>
  );
}
