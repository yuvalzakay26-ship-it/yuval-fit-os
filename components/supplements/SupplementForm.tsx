"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  removeSupplement,
  saveSupplement,
  useSupplements,
} from "@/lib/fitness-store";
import type {
  Supplement,
  SupplementCategory,
  SupplementTiming,
} from "@/lib/fitness-types";
import { cn, createId } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { ChevronIcon, ShieldIcon, TrashIcon, XIcon } from "@/components/ui/icons";
import { SupplementLibrary } from "./SupplementLibrary";
import { SupplementGlyph } from "./SupplementGlyph";
import {
  getCatalogSupplement,
  trackedCatalogMap,
  type CatalogSupplement,
} from "./supplement-catalog";
import {
  SUPPLEMENT_CATEGORY_LABELS,
  SUPPLEMENT_CATEGORY_ORDER,
  SUPPLEMENT_DOSAGE_HINT,
  SUPPLEMENT_SAFETY_PRIMARY,
  SUPPLEMENT_SAFETY_SECONDARY,
  SUPPLEMENT_TEMPLATE_CLEAR,
  SUPPLEMENT_TEMPLATE_EDITABLE,
  SUPPLEMENT_TEMPLATE_SELECTED_LABEL,
  SUPPLEMENT_TIMING_LABELS,
  SUPPLEMENT_TIMING_ORDER,
} from "./supplement-copy";

interface FormState {
  name: string;
  category: SupplementCategory;
  dosageText: string;
  timesOfDay: SupplementTiming[];
  isActive: boolean;
}

const EMPTY: FormState = {
  name: "",
  category: "vitamin",
  dosageText: "",
  timesOfDay: [],
  isActive: true,
};

/** Build the initial form state from a `?preset=` template (add mode only). */
function presetForm(preset?: string): FormState {
  const item = getCatalogSupplement(preset);
  if (!item) return EMPTY;
  return {
    name: item.nameHe,
    category: item.category,
    dosageText: "",
    timesOfDay: item.timesOfDay ?? [],
    isActive: true,
  };
}

/**
 * Premium add/edit flow for a single supplement (route
 * `/nutrition/supplements/add`, with `?id=` for edit and `?preset=` for a
 * quick-add template). When adding, a searchable "common supplements" library
 * sits above the manual form: tapping a template prefills the fields (and shows
 * a clear selected-template summary), which the user can still edit freely
 * before saving. Templates already in the tracker route to the existing entry
 * instead of creating a duplicate.
 *
 * Boundary: every saved value is user-owned. Templates carry only a name + a
 * neutral category (and, where definitional, a timing tag). The dosage is free
 * text only and the app never suggests values.
 */
export function SupplementForm({
  supplementId,
  preset,
}: {
  supplementId?: string;
  preset?: string;
}) {
  const router = useRouter();
  const supplements = useSupplements();
  const editing = supplementId
    ? supplements.find((s) => s.id === supplementId)
    : undefined;
  const isEdit = Boolean(editing);
  // The library is an add-only affordance. Gate on the stable `supplementId`
  // prop (not the store-derived `editing`) so an edit page never flashes it.
  const showLibrary = !supplementId;

  const [form, setForm] = useState<FormState>(() => presetForm(preset));
  const [pickedKey, setPickedKey] = useState<string | undefined>(
    supplementId ? undefined : getCatalogSupplement(preset)?.key,
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Which catalogue templates the user already tracks → key→existing id. Used to
  // badge the library and to route a tap to the existing entry (no duplicates).
  const trackedMap = useMemo(() => trackedCatalogMap(supplements), [supplements]);
  const trackedKeys = useMemo(() => new Set(trackedMap.keys()), [trackedMap]);
  const pickedItem = getCatalogSupplement(pickedKey);

  // localStorage hydrates after first paint, so fill the form from the existing
  // supplement the moment it resolves — once only, so later edits stick.
  const appliedRef = useRef(false);
  useEffect(() => {
    if (appliedRef.current || !editing) return;
    appliedRef.current = true;
    setForm({
      name: editing.name,
      category: editing.category,
      dosageText: editing.dosageText ?? "",
      timesOfDay: editing.schedule?.timesOfDay ?? [],
      isActive: editing.isActive,
    });
  }, [editing]);

  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  // Picking a template prefills name + category (+ a definitional timing tag).
  // Existing manual timing is preserved when the template carries none. If the
  // template is already tracked, open that entry to edit instead of duplicating.
  const pickTemplate = (item: CatalogSupplement) => {
    const existingId = trackedMap.get(item.key);
    if (existingId) {
      router.push(
        `/nutrition/supplements/add?id=${encodeURIComponent(existingId)}`,
      );
      return;
    }
    setPickedKey(item.key);
    setForm((prev) => ({
      ...prev,
      name: item.nameHe,
      category: item.category,
      timesOfDay: item.timesOfDay ?? prev.timesOfDay,
    }));
  };

  // Clear the chosen template back to a blank manual entry.
  const clearTemplate = () => {
    setPickedKey(undefined);
    setForm(EMPTY);
  };

  const toggleTiming = (t: SupplementTiming) =>
    setForm((prev) => ({
      ...prev,
      timesOfDay: prev.timesOfDay.includes(t)
        ? prev.timesOfDay.filter((x) => x !== t)
        : [...prev.timesOfDay, t],
    }));

  const canSave = form.name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const now = new Date().toISOString();
    const dosage = form.dosageText.trim();
    const supplement: Supplement = {
      id: editing?.id ?? createId("supp"),
      name: form.name.trim(),
      category: form.category,
      ...(dosage ? { dosageText: dosage } : {}),
      schedule: {
        frequency: "daily",
        ...(form.timesOfDay.length ? { timesOfDay: form.timesOfDay } : {}),
      },
      isActive: form.isActive,
      createdAt: editing?.createdAt ?? now,
      ...(editing ? { updatedAt: now } : {}),
    };
    saveSupplement(supplement);
    router.push("/nutrition/supplements");
  };

  const handleDelete = () => {
    if (editing) removeSupplement(editing.id);
    router.push("/nutrition/supplements");
  };

  const formSectionTitle = !showLibrary
    ? "פרטי התוסף"
    : pickedItem
      ? "פרטים אישיים"
      : "או הוספה ידנית";

  return (
    <div>
      <Link
        href="/nutrition/supplements"
        className="tap mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent-supplement)]"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        מעקב תוספים
      </Link>

      <PageHeader
        title={isEdit ? "עריכת תוסף" : "הוספת תוסף"}
        subtitle="כל הפרטים נכתבים על ידך — למעקב אישי בלבד."
        className="mb-4"
      />

      {/* Common-supplements starter library — add mode only. */}
      {showLibrary && (
        <Card
          variant="raised"
          className="module-supplement sheen relative mb-5 overflow-hidden p-4"
        >
          <div
            className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full opacity-50 blur-2xl"
            style={{ background: "var(--accent-supplement-soft)" }}
          />
          <div className="relative">
            <SupplementLibrary
              onPick={pickTemplate}
              selectedKey={pickedKey}
              trackedKeys={trackedKeys}
            />
          </div>
        </Card>
      )}

      {/* Selected-template summary — clear confirmation of what was picked, with
          a reminder that everything stays editable before saving. */}
      {showLibrary && pickedItem && (
        <Card
          variant="raised"
          className="relative mb-5 flex items-center gap-3 border-[color:var(--accent-supplement)]/30 p-4"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl supplement-gradient text-[color:var(--accent-contrast)] shadow-glow-supplement">
            <SupplementGlyph icon={pickedItem.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-[color:var(--accent-supplement)]">
              {SUPPLEMENT_TEMPLATE_SELECTED_LABEL}
            </p>
            <p className="truncate text-[16px] font-extrabold leading-tight text-foreground">
              {pickedItem.nameHe}
            </p>
            <p className="truncate text-[11.5px] text-faint">
              {pickedItem.nameEn} · {SUPPLEMENT_CATEGORY_LABELS[pickedItem.category]}
            </p>
            <p className="mt-1 text-[11.5px] font-medium text-muted">
              {SUPPLEMENT_TEMPLATE_EDITABLE}
            </p>
          </div>
          <button
            type="button"
            onClick={clearTemplate}
            aria-label={SUPPLEMENT_TEMPLATE_CLEAR}
            className="tap absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-faint hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </Card>
      )}

      <SectionHeader
        title={formSectionTitle}
        accent="var(--accent-supplement)"
      />

      <form onSubmit={handleSubmit}>
        <Card className="sheen p-4">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="supp-name">שם התוסף</Label>
              <Input
                id="supp-name"
                value={form.name}
                onChange={(e) => {
                  update({ name: e.target.value });
                  // A manual rename detaches from the picked template highlight.
                  if (pickedKey) setPickedKey(undefined);
                }}
                placeholder="לדוגמה: ויטמין D, אומגה 3, מגנזיום"
                autoComplete="off"
              />
            </div>

            {/* Category */}
            <div>
              <Label>קטגוריה</Label>
              <div className="flex flex-wrap gap-1.5">
                {SUPPLEMENT_CATEGORY_ORDER.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => update({ category: cat })}
                    className={cn(
                      "tap rounded-full px-3 py-1.5 text-[12.5px] font-semibold",
                      form.category === cat
                        ? "supplement-gradient text-[color:var(--accent-contrast)] shadow-glow-supplement"
                        : "border border-border bg-surface-2 text-muted hover:text-foreground",
                    )}
                  >
                    {SUPPLEMENT_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Dosage / personal note (free text only) */}
            <div>
              <Label htmlFor="supp-dosage">מינון / הערה אישית</Label>
              <Input
                id="supp-dosage"
                value={form.dosageText}
                onChange={(e) => update({ dosageText: e.target.value })}
                placeholder="לדוגמה: כמוסה אחת עם ארוחת בוקר"
                autoComplete="off"
              />
              <p className="mt-1.5 text-[11.5px] text-faint">
                {SUPPLEMENT_DOSAGE_HINT}
              </p>
            </div>

            {/* Timing */}
            <div>
              <Label>מתי לקחת?</Label>
              <div className="flex flex-wrap gap-1.5">
                {SUPPLEMENT_TIMING_ORDER.map((t) => {
                  const on = form.timesOfDay.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTiming(t)}
                      aria-pressed={on}
                      className={cn(
                        "tap rounded-full px-3 py-1.5 text-[12.5px] font-semibold",
                        on
                          ? "bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)] ring-1 ring-[color:var(--accent-supplement)]"
                          : "border border-border bg-surface-2 text-muted hover:text-foreground",
                      )}
                    >
                      {SUPPLEMENT_TIMING_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active toggle */}
            <label className="tap flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-surface-2 p-3">
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-foreground">
                  פעיל
                </span>
                <span className="block text-[11.5px] text-muted">
                  מופיע ברשימת היום לסימון. כבה כדי לשמור בארכיון.
                </span>
              </span>
              <span className="relative inline-flex shrink-0">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => update({ isActive: e.target.checked })}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-border-strong transition-colors peer-checked:bg-[color:var(--accent-supplement)]" />
                {/* App is RTL globally: start = right, so the knob slides left
                    (physical -x) when checked. */}
                <span className="absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5" />
              </span>
            </label>
          </div>
        </Card>

        {/* Delete (edit only) — confirm-gated. */}
        {isEdit && (
          <div className="mt-4">
            {confirmingDelete ? (
              <Card className="space-y-3 p-4">
                <p className="text-[13px] leading-relaxed text-muted">
                  למחוק את התוסף הזה? גם סימוני הימים שלו יוסרו. פעולה זו אינה
                  הפיכה.
                </p>
                <div className="flex gap-2.5">
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    type="button"
                    className="flex-1"
                  >
                    <TrashIcon className="h-[18px] w-[18px]" /> כן, מחק
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </Card>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="tap mx-auto flex items-center gap-1.5 text-[13px] font-semibold text-faint hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" /> מחק תוסף
              </button>
            )}
          </div>
        )}

        {/* Safety copy */}
        <Card variant="flat" className="mt-5 flex items-start gap-3 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-supplement-soft)] text-[color:var(--accent-supplement)]">
            <ShieldIcon className="h-[18px] w-[18px]" />
          </span>
          <p className="text-[12px] leading-relaxed text-muted">
            {SUPPLEMENT_SAFETY_PRIMARY}
            <br />
            {SUPPLEMENT_SAFETY_SECONDARY}
          </p>
        </Card>

        {/* Save CTA — full-width and prominent at the end of the flow. The app
            shell's generous bottom padding (`pb-32`, ~128px) keeps it clear of
            the fixed bottom nav (~79px) with room to spare, and the extra
            safe-area inset below guards notched devices. Inside the <form> so it
            (and Enter) submit. */}
        <div
          className="mt-6"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <Button
            type="submit"
            disabled={!canSave}
            size="lg"
            className="w-full supplement-gradient shadow-glow-supplement"
          >
            שמור תוסף
          </Button>
        </div>
      </form>
    </div>
  );
}
