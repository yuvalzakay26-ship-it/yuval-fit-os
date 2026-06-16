"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Label, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  ClockIcon,
  DumbbellIcon,
  ListIcon,
  PencilIcon,
  SparkIcon,
  TargetIcon,
  TrashIcon,
} from "@/components/ui/icons";
import {
  DURATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  FREQUENCY_OPTIONS,
  GOAL_OPTIONS,
  LOCATION_OPTIONS,
  NOTES_MAX_LENGTH,
  clearPersonalProfile,
  isProfileEmpty,
  savePersonalProfile,
  usePersonalProfile,
  type TrainingProfile,
  type TrainingProfileInput,
} from "@/lib/personal-profile";

type IconCmp = (p: { className?: string }) => React.ReactElement;

/* ---------------------------- Draft helpers ----------------------------- */

interface ProfileDraft {
  goal?: string;
  location?: string;
  weeklyFrequency?: string;
  experience?: string;
  workoutDuration?: string;
  equipment: string[];
  notes: string;
}

const EMPTY_DRAFT: ProfileDraft = { equipment: [], notes: "" };

function profileToDraft(profile: TrainingProfile): ProfileDraft {
  return {
    goal: profile.goal,
    location: profile.location,
    weeklyFrequency: profile.weeklyFrequency,
    experience: profile.experience,
    workoutDuration: profile.workoutDuration,
    equipment: profile.equipment ? [...profile.equipment] : [],
    notes: profile.notes ?? "",
  };
}

function draftToInput(draft: ProfileDraft): TrainingProfileInput {
  return {
    goal: draft.goal,
    location: draft.location,
    weeklyFrequency: draft.weeklyFrequency,
    experience: draft.experience,
    workoutDuration: draft.workoutDuration,
    equipment: draft.equipment,
    notes: draft.notes,
  };
}

/* ----------------------------- Choice chips ----------------------------- */

/** A single-select group rendered as accessible pill toggles. */
function ChoiceGroup({
  options,
  value,
  onSelect,
}: {
  options: readonly string[];
  value: string | undefined;
  onSelect: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option)}
            className={cn(
              "tap rounded-2xl border px-3.5 py-2 text-[13px] font-semibold transition-colors",
              active
                ? "border-accent bg-[color:var(--accent-soft)] text-accent"
                : "border-border bg-surface-2 text-foreground hover:bg-surface",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** A multi-select group (equipment) — same pill look, toggles membership. */
function MultiChoiceGroup({
  options,
  values,
  onToggle,
}: {
  options: readonly string[];
  values: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            className={cn(
              "tap inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-[13px] font-semibold transition-colors",
              active
                ? "border-accent bg-[color:var(--accent-soft)] text-accent"
                : "border-border bg-surface-2 text-foreground hover:bg-surface",
            )}
          >
            {active && <CheckIcon className="h-3.5 w-3.5" />}
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** A titled form section with a leading icon badge. */
function FormSection({
  icon: Icon,
  title,
  label,
  helper,
  children,
}: {
  icon: IconCmp;
  title: string;
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeader title={title} accent="var(--accent)" />
      <Card className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold leading-tight text-foreground">
              {label}
            </p>
            {helper && (
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                {helper}
              </p>
            )}
          </div>
        </div>
        {children}
      </Card>
    </section>
  );
}

/* --------------------------- Saved summary ------------------------------ */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-[13px]">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-end font-semibold text-foreground">{value}</span>
    </div>
  );
}

const NONE = <span className="text-faint">לא נבחר</span>;

function SavedSummary({
  profile,
  onEdit,
}: {
  profile: TrainingProfile;
  onEdit: () => void;
}) {
  const equipment =
    profile.equipment && profile.equipment.length > 0
      ? profile.equipment.join(" · ")
      : NONE;
  return (
    <div className="space-y-6">
      <Card variant="raised" className="sheen relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -left-12 -top-14 h-40 w-40 rounded-full opacity-50 blur-2xl"
          style={{ background: "var(--accent-soft)" }}
        />
        <div className="relative flex items-center gap-3">
          <span className="brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow">
            <SparkIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              הפרופיל שלך
            </p>
            <p className="mt-0.5 text-[17px] font-extrabold leading-tight text-foreground">
              הפרופיל נשמר במכשיר
            </p>
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader title="סיכום הפרופיל" accent="var(--accent)" />
        <Card>
          <div className="divide-y divide-border">
            <SummaryRow label="מטרה" value={profile.goal ?? NONE} />
            <SummaryRow label="מקום אימון" value={profile.location ?? NONE} />
            <SummaryRow
              label="תדירות"
              value={profile.weeklyFrequency ?? NONE}
            />
            <SummaryRow label="רמה" value={profile.experience ?? NONE} />
            <SummaryRow
              label="זמן אימון"
              value={profile.workoutDuration ?? NONE}
            />
            <SummaryRow label="ציוד" value={equipment} />
            {profile.notes && (
              <SummaryRow
                label="הערות"
                value={
                  <span className="whitespace-pre-wrap break-words font-normal text-foreground">
                    {profile.notes}
                  </span>
                }
              />
            )}
          </div>
        </Card>
      </section>

      <Button onClick={onEdit} className="w-full">
        <PencilIcon className="h-[18px] w-[18px]" /> ערוך פרופיל
      </Button>

      {/* Safe future-facing note — sets expectations without any prescription. */}
      <Card className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
          <SparkIcon className="h-[18px] w-[18px]" />
        </span>
        <p className="text-[12.5px] leading-relaxed text-muted">
          בהמשך הפרופיל יעזור להתאים תבניות והמלצות. כרגע הוא נשמר אצלך במכשיר
          וניתן לעריכה בכל רגע.
        </p>
      </Card>
    </div>
  );
}

/* -------------------------------- View ---------------------------------- */

export function TrainingProfileView() {
  const router = useRouter();
  const profile = usePersonalProfile();
  const hasProfile = profile !== null && !isProfileEmpty(profile);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Show the form when creating (no saved profile) or when explicitly editing.
  const showForm = isEditing || !hasProfile;

  const startEditing = () => {
    setDraft(profile ? profileToDraft(profile) : EMPTY_DRAFT);
    setIsEditing(true);
  };

  const setField = <K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K],
  ) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const toggleEquipment = (option: string) => {
    setDraft((d) => ({
      ...d,
      equipment: d.equipment.includes(option)
        ? d.equipment.filter((e) => e !== option)
        : [...d.equipment, option],
    }));
  };

  const handleSave = () => {
    savePersonalProfile(draftToInput(draft));
    setIsEditing(false);
  };

  const handleSkip = () => {
    // Optional + non-blocking: leaving without saving simply returns to Today.
    router.push("/");
  };

  const handleReset = () => {
    clearPersonalProfile();
    setConfirmingReset(false);
    setIsEditing(false);
    setDraft(EMPTY_DRAFT);
  };

  if (!showForm && profile) {
    return (
      <>
        <SavedSummary profile={profile} onEdit={startEditing} />
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="tap mx-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-faint hover:text-red-500"
          >
            <TrashIcon className="h-4 w-4" /> אפס פרופיל
          </button>
        </div>
        <ConfirmDialog
          open={confirmingReset}
          title="לאפס את הפרופיל?"
          description="הפרופיל האישי יימחק מהמכשיר הזה. שאר הנתונים שלך לא יושפעו."
          confirmLabel="אפס פרופיל"
          cancelLabel="ביטול"
          tone="danger"
          onConfirm={handleReset}
          onCancel={() => setConfirmingReset(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro — supportive, sets the "optional + on-device" expectation. */}
      <Card className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
          <SparkIcon className="h-[18px] w-[18px]" />
        </span>
        <p className="text-[12.5px] leading-relaxed text-muted">
          כל השאלות אופציונליות. אפשר לענות על מה שמתאים, לדלג על השאר, ולערוך
          בכל רגע. הפרופיל נשמר אצלך במכשיר בלבד.
        </p>
      </Card>

      {/* מטרה */}
      <FormSection
        icon={TargetIcon}
        title="מטרה"
        label="מה המטרה המרכזית שלך?"
      >
        <ChoiceGroup
          options={GOAL_OPTIONS}
          value={draft.goal}
          onSelect={(v) => setField("goal", v)}
        />
      </FormSection>

      {/* שגרה */}
      <FormSection
        icon={ClockIcon}
        title="שגרה"
        label="איפה אתה מתאמן בדרך כלל?"
      >
        <ChoiceGroup
          options={LOCATION_OPTIONS}
          value={draft.location}
          onSelect={(v) => setField("location", v)}
        />
        <div className="pt-1">
          <Label>כמה פעמים בשבוע תרצה להתאמן?</Label>
          <ChoiceGroup
            options={FREQUENCY_OPTIONS}
            value={draft.weeklyFrequency}
            onSelect={(v) => setField("weeklyFrequency", v)}
          />
        </div>
        <div className="pt-1">
          <Label>כמה זמן יש לך לאימון?</Label>
          <ChoiceGroup
            options={DURATION_OPTIONS}
            value={draft.workoutDuration}
            onSelect={(v) => setField("workoutDuration", v)}
          />
        </div>
      </FormSection>

      {/* ניסיון */}
      <FormSection
        icon={ListIcon}
        title="ניסיון"
        label="מה רמת הניסיון שלך?"
      >
        <ChoiceGroup
          options={EXPERIENCE_OPTIONS}
          value={draft.experience}
          onSelect={(v) => setField("experience", v)}
        />
      </FormSection>

      {/* ציוד */}
      <FormSection
        icon={DumbbellIcon}
        title="ציוד"
        label="איזה ציוד זמין לך?"
        helper="אפשר לבחור כמה אפשרויות."
      >
        <MultiChoiceGroup
          options={EQUIPMENT_OPTIONS}
          values={draft.equipment}
          onToggle={toggleEquipment}
        />
      </FormSection>

      {/* הערות */}
      <FormSection
        icon={PencilIcon}
        title="הערות"
        label="יש משהו שכדאי לקחת בחשבון?"
        helper="לדוגמה: תרגילים שאתה מעדיף להימנע מהם, זמן מוגבל, חוסר ניסיון או משהו שחשוב לך לזכור."
      >
        <Textarea
          value={draft.notes}
          maxLength={NOTES_MAX_LENGTH}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="כתוב כאן בחופשיות…"
          aria-label="הערות לפרופיל"
        />
      </FormSection>

      {/* Save area */}
      <div className="space-y-2.5 pt-1">
        <Button onClick={handleSave} size="lg" className="w-full">
          <CheckIcon className="h-5 w-5" /> שמור פרופיל
        </Button>
        {hasProfile ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setIsEditing(false)}
          >
            ביטול
          </Button>
        ) : (
          <Button variant="ghost" className="w-full" onClick={handleSkip}>
            דלג בינתיים
          </Button>
        )}
        {!hasProfile && (
          <p className="text-center text-[12px] text-faint">
            אפשר לדלג ולמלא אחר כך — האפליקציה עובדת רגיל גם בלי הפרופיל.
          </p>
        )}
      </div>
    </div>
  );
}
