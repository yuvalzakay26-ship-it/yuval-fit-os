"use client";

import { useRef, useState } from "react";
import { updateSettings, useSettings } from "@/lib/fitness-store";
import {
  PROTEIN_ACTIVITY_LEVELS,
  calcProteinRange,
  getProteinActivityLevel,
  isValidBodyWeight,
} from "@/lib/protein";
import { NUTRITION_DISCLAIMER, PROTEIN_ARTICLE_ID } from "@/lib/knowledge-content";
import { cn, parseOptionalNumber } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { CheckIcon, ChevronIcon, TargetIcon } from "@/components/ui/icons";
import Link from "next/link";

/**
 * Daily protein goal calculator using the g/kg/day method.
 * A gentle helper, not a strict diet tool — the result is a range,
 * and saving uses the rounded midpoint as the daily goal.
 */
export function ProteinCalculator({
  defaultOpen = true,
  showArticleLink = false,
}: {
  /** Collapsed-with-CTA mode for busy screens like Nutrition. */
  defaultOpen?: boolean;
  /** Adds a contextual link to the protein article in the Knowledge Center. */
  showArticleLink?: boolean;
}) {
  const settings = useSettings();
  const [open, setOpen] = useState(defaultOpen);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weightKg = settings.bodyWeightKg;
  const level =
    getProteinActivityLevel(settings.proteinActivityLevel) ??
    PROTEIN_ACTIVITY_LEVELS[2];
  const range = isValidBodyWeight(weightKg) ? calcProteinRange(weightKg, level) : null;
  const singleValue = range !== null && range.minGrams === range.maxGrams;

  const saveGoal = () => {
    if (!range) return;
    updateSettings({ ...settings, proteinGoal: range.midpointGrams });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 2500);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="tap block w-full text-start">
        <Card className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
            <TargetIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-foreground">חשב יעד חלבון</p>
            <p className="text-[12px] text-muted">
              יעד יומי מותאם לפי משקל גוף ורמת פעילות
            </p>
          </div>
          <ChevronIcon className="h-4 w-4 shrink-0 text-faint" />
        </Card>
      </button>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
          <TargetIcon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <CardLabel>מחשבון יעד חלבון יומי</CardLabel>
          <p className="text-[12px] text-muted">לפי g/kg/day — גרם חלבון לק״ג גוף ליום</p>
        </div>
      </div>

      <div>
        <Label htmlFor="body-weight">משקל גוף (ק״ג)</Label>
        <Input
          id="body-weight"
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="לדוגמה: 70"
          className="text-center font-semibold"
          value={weightKg ?? ""}
          onChange={(e) =>
            updateSettings({
              ...settings,
              bodyWeightKg: parseOptionalNumber(e.target.value),
            })
          }
        />
      </div>

      <div>
        <Label>רמת פעילות</Label>
        <div className="grid grid-cols-2 gap-2">
          {PROTEIN_ACTIVITY_LEVELS.map((option) => {
            const active = option.id === level.id;
            return (
              <button
                key={option.id}
                onClick={() =>
                  updateSettings({ ...settings, proteinActivityLevel: option.id })
                }
                className={cn(
                  "tap flex flex-col items-start gap-0.5 rounded-2xl border px-3 py-2.5 text-start",
                  active
                    ? "border-[color:var(--accent-nutrition)] bg-[color:var(--accent-nutrition-soft)]"
                    : "border-border bg-surface-2 hover:border-border-strong",
                )}
              >
                <span
                  className={cn(
                    "text-[13px] font-bold",
                    active ? "text-[color:var(--accent-nutrition)]" : "text-foreground",
                  )}
                >
                  {option.label}
                </span>
                <span className="text-[11px] leading-snug text-muted">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {range ? (
        <div className="space-y-3 rounded-2xl bg-surface-2 p-3.5">
          <div className="text-center">
            <p className="text-[12px] font-medium text-muted">
              {singleValue ? "יעד משוער" : "טווח יעד משוער"}
            </p>
            <p className="mt-1 text-[22px] font-extrabold tabular-nums leading-none text-foreground">
              {singleValue ? range.minGrams : `${range.minGrams}–${range.maxGrams}`}
              <span className="ms-1 text-[13px] font-semibold text-faint">
                גרם חלבון ביום
              </span>
            </p>
            <p className="mt-1.5 text-[11px] text-faint">היעד הוא טווח, לא מבחן 🙂</p>
          </div>
          <Button onClick={saveGoal} className="w-full" size="md">
            {justSaved ? (
              <>
                <CheckIcon className="h-[18px] w-[18px]" /> נשמר! היעד היומי עודכן
              </>
            ) : (
              `שמור ${range.midpointGrams} גרם כיעד יומי`
            )}
          </Button>
        </div>
      ) : (
        <p className="rounded-2xl bg-surface-2 p-3.5 text-center text-[12.5px] text-muted">
          הזן משקל גוף כדי לראות טווח יעד מותאם
        </p>
      )}

      {showArticleLink && (
        <Link
          href={`/learn/${PROTEIN_ARTICLE_ID}`}
          className="tap block text-center text-[12.5px] font-semibold text-[color:var(--accent-learn)]"
        >
          למה דווקא g/kg/day? קרא במרכז הידע ←
        </Link>
      )}

      <p className="text-[11px] leading-relaxed text-faint">{NUTRITION_DISCLAIMER}</p>
    </Card>
  );
}
