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
  ArchiveIcon,
  CapsuleIcon,
  CheckIcon,
  ChevronIcon,
  PencilIcon,
  PillIcon,
  PlusIcon,
  ShieldIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { SupplementCheck } from "./SupplementCheck";
import { SupplementGlyph } from "./SupplementGlyph";
import { popularSupplements, trackedCatalogMap } from "./supplement-catalog";
import {
  SUPPLEMENT_ALREADY_TRACKED,
  SUPPLEMENT_CATEGORY_LABELS,
  SUPPLEMENT_HELPER_COPY,
  SUPPLEMENT_LIBRARY_NOTE,
  SUPPLEMENT_LIBRARY_TITLE,
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

/** A compact stat tile for the hero summary (count + label). */
function StatTile({
  value,
  label,
  emphasis = false,
}: {
  value: number;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-2.5 text-center",
        emphasis
          ? "border-[color:var(--accent-supplement)]/30 bg-[color:var(--accent-supplement-soft)]"
          : "border-border bg-surface-2",
      )}
    >
      <p
        className={cn(
          "text-[20px] font-extrabold leading-none tabular-nums",
          emphasis ? "text-[color:var(--accent-supplement)]" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-muted">{label}</p>
    </div>
  );
}

/** A quick-action button (icon tile + label). Accepts a route or an in-page anchor. */
function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="tap flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center shadow-soft transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
        {icon}
      </span>
      <span className="text-[12px] font-bold leading-tight text-foreground">
        {label}
      </span>
    </Link>
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
 * The compact "common supplements" starter rail on the tracker. Each card deep
 * links into the add form with `?preset=`, which prefills (but never auto-saves)
 * the template — the user still owns and edits the entry. Templates only;
 * no dosages, no advice. See `supplement-catalog.ts`.
 */
function StarterLibraryRail({
  supplements,
}: {
  supplements: Supplement[];
}) {
  const popular = popularSupplements();
  // Templates the user already tracks → route to that entry, badge it "tracked".
  const trackedMap = trackedCatalogMap(supplements);
  return (
    <section id="supp-library" className="mt-7 scroll-mt-24">
      <SectionHeader
        title={SUPPLEMENT_LIBRARY_TITLE}
        accent="var(--accent-supplement)"
        action={
          <Link
            href="/nutrition/supplements/add"
            className="tap flex items-center gap-1 text-[12px] font-semibold text-[color:var(--accent-supplement)]"
          >
            לכל הספרייה
            <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
          </Link>
        }
      />
      {/* Make the rail read as a safe starter template library, not advice. */}
      <p className="-mt-1 mb-3 text-[12px] leading-relaxed text-muted">
        {SUPPLEMENT_LIBRARY_NOTE}
      </p>
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {popular.map((item) => {
          const trackedId = trackedMap.get(item.key);
          const tracked = Boolean(trackedId);
          const href = trackedId
            ? `/nutrition/supplements/add?id=${encodeURIComponent(trackedId)}`
            : `/nutrition/supplements/add?preset=${encodeURIComponent(item.key)}`;
          return (
            <Link
              key={item.key}
              href={href}
              aria-label={
                tracked
                  ? `${item.nameHe} — ${SUPPLEMENT_ALREADY_TRACKED}`
                  : `הוספת ${item.nameHe} מהספרייה`
              }
              className={cn(
                "tap group flex w-[116px] shrink-0 flex-col gap-2 rounded-2xl border bg-surface p-3 text-right shadow-soft transition-colors",
                tracked
                  ? "border-[color:var(--accent-supplement)]/40"
                  : "border-border hover:border-border-strong",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  tracked
                    ? "supplement-gradient text-[color:var(--accent-contrast)] shadow-glow-supplement"
                    : "bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]",
                )}
              >
                <SupplementGlyph icon={item.icon} className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold leading-tight text-foreground">
                  {item.nameHe}
                </p>
                <p className="truncate text-[10.5px] text-faint">{item.nameEn}</p>
              </div>
              {tracked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[color:var(--accent-supplement)]">
                  <CheckIcon className="h-3 w-3" /> {SUPPLEMENT_ALREADY_TRACKED}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[color:var(--accent-supplement)]">
                  <PlusIcon className="h-3 w-3" /> הוסף
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Full-screen supplements tracker (route `/nutrition/supplements`). A premium,
 * safety-first daily habit screen: a violet completion hero with summary stats,
 * a quick-actions row, the active supplement list with per-item taken-toggles, a
 * "common supplements" starter rail, archived items with a one-tap reactivate,
 * and clear empty states. localStorage-only via the store.
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
  const hasArchive = inactive.length > 0;

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
          className="module-supplement sheen relative overflow-hidden p-5"
        >
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full opacity-60 blur-2xl"
            style={{ background: "var(--accent-supplement-soft)" }}
          />
          <div className="relative flex items-center gap-5">
            <span className="relative shrink-0">
              <ProgressRing
                value={summary.taken}
                goal={summary.active}
                size={112}
                stroke={10}
                gradientId="supplements-hero-ring"
                from="var(--accent-supplement)"
                to="var(--accent-supplement)"
              >
                <span className="text-[26px] font-extrabold leading-none tabular-nums text-foreground">
                  {summary.taken}/{summary.active}
                </span>
                <span className="mt-1 text-[10.5px] font-semibold text-faint">
                  סומנו היום
                </span>
              </ProgressRing>
              {allDone && (
                <span className="absolute end-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-raised bg-[color:var(--accent-supplement)] text-[color:var(--accent-contrast)] shadow-glow-supplement">
                  <CheckIcon className="h-4 w-4" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-supplement)]">
                תוספים היום
              </p>
              <p className="mt-1 text-[18px] font-extrabold leading-tight text-foreground">
                {summary.taken} מתוך {summary.active} תוספים
              </p>
              <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">
                {supplementStatusLine(summary.taken, summary.active)}
              </p>
            </div>
          </div>

          {/* Summary stats — active / taken / remaining at a glance. */}
          <div className="relative mt-4 grid grid-cols-3 gap-2.5">
            <StatTile value={summary.active} label="פעילים" />
            <StatTile value={summary.taken} label="סומנו" emphasis />
            <StatTile value={summary.remaining} label="נותרו" />
          </div>
        </Card>
      )}

      {/* Quick actions — add, browse the library, jump to the archive. */}
      <div
        className={cn(
          "mt-5 grid gap-2.5",
          hasArchive ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        <QuickAction
          href="/nutrition/supplements/add"
          icon={<PlusIcon className="h-5 w-5" />}
          label="תוסף חדש"
        />
        <QuickAction
          href="#supp-library"
          icon={<SparkIcon className="h-5 w-5" />}
          label="תוספים נפוצים"
        />
        {hasArchive && (
          <QuickAction
            href="#supp-archive"
            icon={<ArchiveIcon className="h-5 w-5" />}
            label="ארכיון"
          />
        )}
      </div>

      {/* Active supplements */}
      <section className="mt-7">
        <SectionHeader
          title="התוספים שלי"
          accent="var(--accent-supplement)"
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
            accent="var(--accent-supplement)"
            accentSoft="var(--accent-supplement-soft)"
            icon={<CapsuleIcon className="h-7 w-7" />}
            title="עדיין לא הוגדרו תוספים"
            description="אפשר להוסיף פריטים למעקב אישי — או להתחיל מהר מתוך ספריית התוספים הנפוצים למטה."
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

      {/* Common supplements / starter library. */}
      <StarterLibraryRail supplements={supplements} />

      {/* Archived supplements — kept with history, out of the daily list. */}
      {hasArchive && (
        <section id="supp-archive" className="mt-7 scroll-mt-24">
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

      <p className="mt-7 text-center text-[12px] leading-relaxed text-faint">
        {SUPPLEMENT_SAFETY_PRIMARY}
      </p>
    </div>
  );
}
