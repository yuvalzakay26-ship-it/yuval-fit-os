"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveWaterPresets } from "@/lib/analytics";
import { resetWaterPresets, saveWaterPresets, useSettings } from "@/lib/fitness-store";
import {
  MAX_WATER_PRESET_ML,
  MIN_WATER_PRESET_ML,
  type WaterPreset,
  type WaterPresetIcon,
} from "@/lib/fitness-types";
import { cn, createId, parseOptionalNumber } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { ChevronIcon, TrashIcon } from "@/components/ui/icons";
import { WATER_PRESET_ICON_OPTIONS, waterPresetIcon } from "./water-presets";

/** Editable draft of one preset — amount is kept as text so it stays editable. */
type Draft = {
  id: string;
  label: string;
  amountText: string;
  icon: WaterPresetIcon;
  isDefault?: boolean;
};

function toDraft(preset: WaterPreset): Draft {
  return {
    id: preset.id,
    label: preset.label,
    amountText: String(preset.amountMl),
    icon: preset.icon,
    isDefault: preset.isDefault,
  };
}

function draftAmount(text: string): number | null {
  const parsed = parseOptionalNumber(text);
  if (parsed === undefined) return null;
  const rounded = Math.round(parsed);
  if (rounded < MIN_WATER_PRESET_ML || rounded > MAX_WATER_PRESET_ML) return null;
  return rounded;
}

/**
 * Premium editor for the personal water presets (route `/nutrition/water/presets`).
 * Edit label, amount (ml) and icon per preset; reset to defaults; save. Presets
 * live inside settings, so saving just writes settings — water logs are never
 * touched. Reorder is intentionally deferred (see `docs/WATER_PRESETS.md`).
 */
export function WaterPresetsEditor() {
  const router = useRouter();
  const settings = useSettings();
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    resolveWaterPresets(settings).map(toDraft),
  );
  const [confirmingReset, setConfirmingReset] = useState(false);

  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const valid =
    drafts.length > 0 &&
    drafts.every((d) => d.label.trim().length > 0 && draftAmount(d.amountText) !== null);

  const handleSave = () => {
    if (!valid) return;
    const presets: WaterPreset[] = drafts.map((d) => ({
      id: d.id || createId("preset"),
      label: d.label.trim(),
      amountMl: draftAmount(d.amountText) ?? MIN_WATER_PRESET_ML,
      icon: d.icon,
      ...(d.isDefault ? { isDefault: true } : {}),
    }));
    saveWaterPresets(presets);
    router.push("/nutrition/water");
  };

  const handleReset = () => {
    resetWaterPresets();
    setDrafts(resolveWaterPresets({ ...settings, waterPresets: undefined }).map(toDraft));
    setConfirmingReset(false);
  };

  return (
    <div>
      <Link
        href="/nutrition/water"
        className="tap mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent-water)]"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        מעקב מים
      </Link>

      <PageHeader
        title="קיצורי מים"
        subtitle="ערוך את הכוסות והבקבוקים שלך"
        className="mb-4"
      />

      <SectionHeader title={`הקיצורים שלך · ${drafts.length}`} />
      <div className="space-y-3">
        {drafts.map((d) => {
          const amountOk = draftAmount(d.amountText) !== null;
          const labelOk = d.label.trim().length > 0;
          const Preview = waterPresetIcon(d.icon);
          return (
            <Card key={d.id} className="space-y-3.5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]">
                  <Preview className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`label-${d.id}`}>שם הקיצור</Label>
                  <Input
                    id={`label-${d.id}`}
                    value={d.label}
                    maxLength={20}
                    placeholder="כוס"
                    aria-label="שם הקיצור"
                    onChange={(e) => update(d.id, { label: e.target.value })}
                    className={cn(!labelOk && "border-red-400 focus:border-red-400")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`amount-${d.id}`}>{`כמות (מ"ל)`}</Label>
                <Input
                  id={`amount-${d.id}`}
                  type="number"
                  inputMode="numeric"
                  min={MIN_WATER_PRESET_ML}
                  max={MAX_WATER_PRESET_ML}
                  value={d.amountText}
                  aria-label={`כמות במ"ל עבור ${d.label || "קיצור"}`}
                  onChange={(e) => update(d.id, { amountText: e.target.value })}
                  className={cn(
                    "text-center font-semibold",
                    !amountOk && "border-red-400 focus:border-red-400",
                  )}
                />
                {!amountOk && (
                  <p className="mt-1 text-[12px] text-red-500">
                    {`כמות חייבת להיות בין ${MIN_WATER_PRESET_ML} ל-${MAX_WATER_PRESET_ML} מ"ל.`}
                  </p>
                )}
              </div>

              <div>
                <Label>אייקון</Label>
                <div className="flex flex-wrap gap-2">
                  {WATER_PRESET_ICON_OPTIONS.map((opt) => {
                    const Icon = waterPresetIcon(opt.id);
                    const selected = d.icon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => update(d.id, { icon: opt.id })}
                        aria-label={opt.label}
                        aria-pressed={selected}
                        className={cn(
                          "tap flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors",
                          selected
                            ? "border-[color:var(--accent-water)] bg-[color:var(--accent-water-soft)] text-[color:var(--accent-water)]"
                            : "border-border bg-surface-2 text-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Save */}
      <div className="mt-6">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!valid}
          className="water-gradient w-full shadow-glow-water"
        >
          שמור קיצורים
        </Button>
      </div>

      {/* Reset to defaults — confirm-gated */}
      <div className="mt-4">
        {confirmingReset ? (
          <Card className="space-y-3 p-4">
            <p className="text-[13px] leading-relaxed text-muted">
              לאפס את כל הקיצורים לברירת המחדל? השינויים שביצעת לא יישמרו.
            </p>
            <div className="flex gap-2.5">
              <Button variant="danger" onClick={handleReset} className="flex-1">
                <TrashIcon className="h-[18px] w-[18px]" /> כן, אפס
              </Button>
              <Button variant="secondary" onClick={() => setConfirmingReset(false)}>
                ביטול
              </Button>
            </div>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="tap mx-auto block text-[13px] font-semibold text-faint hover:text-[color:var(--accent-water)]"
          >
            איפוס לברירת מחדל
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-[12px] leading-relaxed text-faint">
        הקיצורים הם דרך מהירה להוסיף מים. הם לא משנים את ההיסטוריה שלך — כל הקשה
        מוסיפה רשומה רגילה.
      </p>
    </div>
  );
}
