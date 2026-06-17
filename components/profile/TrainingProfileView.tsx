"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  BoltIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  DumbbellIcon,
  HeartIcon,
  HomeIcon,
  PencilIcon,
  SparkIcon,
  TargetIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useWorkoutTemplates } from "@/lib/fitness-store";
import { getWorkoutRecommendation } from "@/lib/workout-recommendation";
import {
  ADAPTATION_OPTIONS,
  DURATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  FREQUENCY_OPTIONS,
  GOAL_OPTIONS,
  GUIDANCE_STYLE_OPTIONS,
  LOCATION_OPTIONS,
  MEASURE_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  TRAINING_PREFERENCE_OPTIONS,
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
  adaptation?: string;
  age: string;
  heightCm: string;
  weightKg: string;
  trainingPreference?: string;
  guidanceStyle?: string;
}

const EMPTY_DRAFT: ProfileDraft = {
  equipment: [],
  notes: "",
  age: "",
  heightCm: "",
  weightKg: "",
};

function profileToDraft(profile: TrainingProfile): ProfileDraft {
  return {
    goal: profile.goal,
    location: profile.location,
    weeklyFrequency: profile.weeklyFrequency,
    experience: profile.experience,
    workoutDuration: profile.workoutDuration,
    equipment: profile.equipment ? [...profile.equipment] : [],
    notes: profile.notes ?? "",
    adaptation: profile.adaptation,
    age: profile.age ?? "",
    heightCm: profile.heightCm ?? "",
    weightKg: profile.weightKg ?? "",
    trainingPreference: profile.trainingPreference,
    guidanceStyle: profile.guidanceStyle,
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
    adaptation: draft.adaptation,
    age: draft.age,
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
    trainingPreference: draft.trainingPreference,
    guidanceStyle: draft.guidanceStyle,
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
              "tap rounded-2xl border px-4 py-2.5 text-[13.5px] font-semibold transition-colors",
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
              "tap inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-[13.5px] font-semibold transition-colors",
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

/* ------------------------------ Wizard model ---------------------------- */
// The onboarding is a guided, one-question-per-screen flow. STEPS holds the ten
// question screens (indices 0–9) plus a final summary/confirm screen (index 10),
// so the progress indicator and navigation are data-driven.
//
// Required vs optional: the profile onboarding stays optional at the app-entry
// level (the first modal still offers "לא עכשיו" and the intro still offers
// "דלג בינתיים"). But once the user is INSIDE the questionnaire, the core
// training questions are REQUIRED so we never store an empty / useless profile.
// `required: true` steps gate "הבא" until an answer is chosen; the personal
// adaptation step (6) and the notes step (9) stay optional and never block.
// Body-related fields (sex/adaptation, age, height, weight) remain optional by
// design — they are personal/sensitive and are not needed for recommendations;
// no BMI, no body-shape labels, no medical/diet logic.

interface StepMeta {
  icon: IconCmp;
  title: string;
  helper?: string;
  /** Core training questions that must be answered before advancing. */
  required?: boolean;
}

const STEPS: readonly StepMeta[] = [
  { icon: TargetIcon, title: "מה המטרה המרכזית שלך?", required: true }, // 0 goal
  { icon: HomeIcon, title: "איפה אתה מתאמן בדרך כלל?", required: true }, // 1 location
  { icon: CalendarIcon, title: "כמה פעמים בשבוע תרצה להתאמן?", required: true }, // 2 frequency
  { icon: ClockIcon, title: "כמה זמן יש לך לאימון?", required: true }, // 3 duration
  { icon: ChartIcon, title: "מה רמת הניסיון שלך?", required: true }, // 4 experience
  {
    icon: DumbbellIcon,
    title: "איזה ציוד זמין לך?",
    helper: "אפשר לבחור כמה אפשרויות.",
    required: true,
  }, // 5 equipment (multi-select, ≥1)
  {
    icon: HeartIcon,
    title: "התאמה אישית — אופציונלי",
    helper:
      "כל השדות כאן אופציונליים לגמרי. נועדו רק כדי להתאים את החוויה — לא לשיפוט ולא לשום חישוב רפואי.",
  }, // 6 personal (optional)
  { icon: BoltIcon, title: "איזה סגנון אימון מתאים לך יותר?", required: true }, // 7 trainingPreference
  { icon: SparkIcon, title: "איך תרצה להתחיל?", required: true }, // 8 guidanceStyle
  {
    icon: PencilIcon,
    title: "יש משהו שכדאי לקחת בחשבון?",
    helper:
      "לדוגמה: זמן מוגבל, תרגילים שפחות מתאימים לך, חוסר ניסיון או העדפה מסוימת.",
  }, // 9 notes (optional)
  { icon: CheckIcon, title: "סיכום" }, // 10 summary
] as const;

const TOTAL_STEPS = STEPS.length; // 11
const LAST_QUESTION_INDEX = STEPS.length - 2; // 9 (notes)
const SUMMARY_INDEX = STEPS.length - 1; // 10

/** Indices of the required core steps, in order — used to gate navigation and to
 *  defensively validate before saving / find the first still-missing answer. */
const REQUIRED_STEP_INDICES: readonly number[] = STEPS.reduce<number[]>(
  (acc, step, index) => (step.required ? [...acc, index] : acc),
  [],
);

/** Whether a given question step has a usable answer in the draft. Optional
 *  steps (and the summary) are always "answered" so they never block. */
function isStepAnswered(index: number, draft: ProfileDraft): boolean {
  switch (index) {
    case 0:
      return Boolean(draft.goal);
    case 1:
      return Boolean(draft.location);
    case 2:
      return Boolean(draft.weeklyFrequency);
    case 3:
      return Boolean(draft.workoutDuration);
    case 4:
      return Boolean(draft.experience);
    case 5:
      return draft.equipment.length > 0; // "לא בטוח" counts as a valid choice
    case 7:
      return Boolean(draft.trainingPreference);
    case 8:
      return Boolean(draft.guidanceStyle);
    default:
      return true; // optional steps (6 personal, 9 notes) + summary
  }
}

/** The first required step still missing an answer, or -1 when all are answered.
 *  Drives the disabled "הבא" gate and the defensive pre-save check. */
function firstMissingRequiredStep(draft: ProfileDraft): number {
  for (const index of REQUIRED_STEP_INDICES) {
    if (!isStepAnswered(index, draft)) return index;
  }
  return -1;
}

/** Progress bar + "step X of Y" readout shown above every wizard screen. */
function WizardProgress({ stepIndex }: { stepIndex: number }) {
  const current = stepIndex + 1;
  const pct = Math.round((current / TOTAL_STEPS) * 100);
  const isSummary = stepIndex === SUMMARY_INDEX;
  return (
    <div aria-hidden={false}>
      <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
        <span className="text-muted">
          {isSummary ? "סיכום" : `שלב ${current} מתוך ${TOTAL_STEPS}`}
        </span>
        <span className="text-faint">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="brand-gradient h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** The focused card that frames a single question — icon badge + title + body. */
function StepCard({
  icon: Icon,
  title,
  helper,
  children,
}: {
  icon: IconCmp;
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="raised" className="space-y-5 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-[18px] font-extrabold leading-snug tracking-tight text-foreground">
            {title}
          </h2>
          {helper && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              {helper}
            </p>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

/** A calm one-line hint under the question. For required-but-unanswered steps it
 *  nudges the user to choose; for optional steps it reassures they can move on.
 *  Deliberately muted — no harsh red, no scary validation language. */
function StepHint({ kind }: { kind: "required" | "optional" }) {
  return (
    <p
      className={cn(
        "text-[12px] font-medium leading-relaxed",
        kind === "required" ? "text-muted" : "text-faint",
      )}
    >
      {kind === "required"
        ? "בחר תשובה כדי להמשיך"
        : "השלב הזה אופציונלי ואפשר להמשיך גם בלי למלא."}
    </p>
  );
}

/* --------------------------- Saved / draft summary ---------------------- */

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

/** Core + optional rows shared by the confirm step and the saved summary. */
function ProfileRows({
  goal,
  location,
  weeklyFrequency,
  experience,
  workoutDuration,
  equipment,
  notes,
  adaptation,
  age,
  heightCm,
  weightKg,
  trainingPreference,
  guidanceStyle,
}: {
  goal?: string;
  location?: string;
  weeklyFrequency?: string;
  experience?: string;
  workoutDuration?: string;
  equipment: string[];
  notes?: string;
  adaptation?: string;
  age?: string;
  heightCm?: string;
  weightKg?: string;
  trainingPreference?: string;
  guidanceStyle?: string;
}) {
  const equipmentValue =
    equipment.length > 0 ? equipment.join(" · ") : NONE;
  // Optional rows render ONLY when filled, so empty optional fields never read
  // like missing/required errors.
  const hasPersonalization =
    adaptation || age || heightCm || weightKg || trainingPreference || guidanceStyle;
  return (
    <div className="space-y-5">
      <section>
        <SectionHeader title="סיכום הפרופיל" accent="var(--accent)" />
        <Card>
          <div className="divide-y divide-border">
            <SummaryRow label="מטרה" value={goal ?? NONE} />
            <SummaryRow label="מקום אימון" value={location ?? NONE} />
            <SummaryRow label="תדירות" value={weeklyFrequency ?? NONE} />
            <SummaryRow label="זמן אימון" value={workoutDuration ?? NONE} />
            <SummaryRow label="רמה" value={experience ?? NONE} />
            <SummaryRow label="ציוד" value={equipmentValue} />
            {notes && notes.trim() && (
              <SummaryRow
                label="הערות"
                value={
                  <span className="whitespace-pre-wrap break-words font-normal text-foreground">
                    {notes}
                  </span>
                }
              />
            )}
          </div>
        </Card>
      </section>

      {hasPersonalization && (
        <section>
          <SectionHeader title="התאמה אישית" accent="var(--accent)" />
          <Card>
            <div className="divide-y divide-border">
              {adaptation && (
                <SummaryRow label="מין / התאמה" value={adaptation} />
              )}
              {age && <SummaryRow label="גיל" value={age} />}
              {heightCm && (
                <SummaryRow label="גובה" value={`${heightCm} ס״מ`} />
              )}
              {weightKg && (
                <SummaryRow label="משקל" value={`${weightKg} ק״ג`} />
              )}
              {trainingPreference && (
                <SummaryRow label="סגנון אימון" value={trainingPreference} />
              )}
              {guidanceStyle && (
                <SummaryRow label="איך להתחיל" value={guidanceStyle} />
              )}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

/**
 * Compact recommendation block shown below the saved profile summary. Reuses the
 * shared deterministic logic (lib/workout-recommendation.ts) but renders a small,
 * link-only surface: starting a template lives on /workouts (where the start flow
 * is owned), so here we only name the suggested template and link across. Reading
 * templates via the existing workouts store hook is safe + reactive — no new
 * cross-store wiring or mutation. Renders only the "ok" / "no-templates" states;
 * an incomplete profile is already invited to edit by the page itself.
 */
function ProfileRecommendationBlock({ profile }: { profile: TrainingProfile }) {
  const templates = useWorkoutTemplates();
  const result = useMemo(
    () => getWorkoutRecommendation(profile, templates),
    [profile, templates],
  );

  if (result.status === "ok") {
    const { recommendation } = result;
    return (
      <Link
        href="/workouts"
        className="tap block"
        aria-label={`המלצת התחלה: ${recommendation.templateName} — פתח באימונים`}
      >
        <Card className="sheen relative flex items-start gap-3 overflow-hidden">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
            <SparkIcon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
              המלצת התחלה לפי הפרופיל שלך
            </p>
            <p className="mt-0.5 text-[15px] font-extrabold leading-tight text-foreground">
              {recommendation.templateName}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {recommendation.explanation}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold text-accent">
              פתח באימונים
              <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
            </span>
          </div>
        </Card>
      </Link>
    );
  }

  if (result.status === "no-templates") {
    return (
      <Link href="/workouts" className="tap block" aria-label="צור תבנית אימון">
        <Card className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
            <TargetIcon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight text-foreground">
              אין עדיין תבניות להמלצה
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              צור תבנית אימון, ובהמשך נוכל להמליץ על התבנית שהכי מתאימה לפרופיל
              שלך.
            </p>
          </div>
          <ChevronIcon className="h-4 w-4 shrink-0 rotate-180 text-faint" />
        </Card>
      </Link>
    );
  }

  return null;
}

function SavedSummary({
  profile,
  onEdit,
}: {
  profile: TrainingProfile;
  onEdit: () => void;
}) {
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

      <ProfileRows
        goal={profile.goal}
        location={profile.location}
        weeklyFrequency={profile.weeklyFrequency}
        experience={profile.experience}
        workoutDuration={profile.workoutDuration}
        equipment={profile.equipment ?? []}
        notes={profile.notes}
        adaptation={profile.adaptation}
        age={profile.age}
        heightCm={profile.heightCm}
        weightKg={profile.weightKg}
        trainingPreference={profile.trainingPreference}
        guidanceStyle={profile.guidanceStyle}
      />

      <ProfileRecommendationBlock profile={profile} />

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
  // Wizard position: 'intro' is the brief start screen; 'steps' walks the
  // questions and the final confirm. Edit mode jumps straight into 'steps'.
  const [phase, setPhase] = useState<"intro" | "steps">("intro");
  const [stepIndex, setStepIndex] = useState(0);
  // Set when a defensive save is blocked by a missing required answer: shows a
  // calm notice and the wizard jumps back to that step. Cleared on any move.
  const [missingNotice, setMissingNotice] = useState(false);

  // Show the wizard when creating (no saved profile) or when explicitly editing.
  const showWizard = isEditing || !hasProfile;

  // Gently bring each new step into view from the top — one focused screen at a
  // time, never landing the user mid-scroll.
  useEffect(() => {
    if (showWizard && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [phase, stepIndex, showWizard]);

  const startEditing = () => {
    setDraft(profile ? profileToDraft(profile) : EMPTY_DRAFT);
    setIsEditing(true);
    setPhase("steps");
    setStepIndex(0);
    setMissingNotice(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setPhase("intro");
    setStepIndex(0);
    setMissingNotice(false);
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

  // Keep measure inputs lenient + calm: digits only, no scary validation, just
  // quietly ignore other characters as the user types.
  const setMeasure = (key: "age" | "heightCm" | "weightKg", raw: string) => {
    const digitsOnly = raw.replace(/[^\d]/g, "").slice(0, MEASURE_MAX_LENGTH);
    setField(key, digitsOnly);
  };

  const goNext = () => {
    setMissingNotice(false);
    // Defensive: required steps gate advancing even if the button slips through.
    if (STEPS[stepIndex].required && !isStepAnswered(stepIndex, draft)) return;
    setStepIndex((i) => Math.min(i + 1, SUMMARY_INDEX));
  };

  const goBack = () => {
    setMissingNotice(false);
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      return;
    }
    // At the first question: leave the steps. Editing returns to the summary;
    // a fresh onboarding returns to the intro screen.
    if (isEditing) cancelEditing();
    else setPhase("intro");
  };

  const handleSave = () => {
    // Defensive backstop: never save an empty/incomplete core profile, even if
    // the user reached the summary with stale data (e.g. an older saved profile
    // missing newly-required fields). Send them to the first missing step.
    const missing = firstMissingRequiredStep(draft);
    if (missing !== -1) {
      setStepIndex(missing);
      setMissingNotice(true);
      return;
    }
    savePersonalProfile(draftToInput(draft));
    setIsEditing(false);
    setPhase("intro");
    setStepIndex(0);
    setMissingNotice(false);
  };

  const handleSkip = () => {
    // Optional + non-blocking: leaving without saving simply returns to Today.
    router.push("/");
  };

  const handleReset = () => {
    clearPersonalProfile();
    setConfirmingReset(false);
    setIsEditing(false);
    setPhase("intro");
    setStepIndex(0);
    setDraft(EMPTY_DRAFT);
  };

  /* ----------------------------- Saved view ----------------------------- */

  if (!showWizard && profile) {
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

  /* ------------------------------- Intro -------------------------------- */

  if (phase === "intro") {
    return (
      <div className="space-y-5">
        <Card variant="raised" className="sheen relative overflow-hidden p-6 text-center">
          <div
            className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full opacity-50 blur-2xl"
            style={{ background: "var(--accent-soft)" }}
          />
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] brand-gradient text-[color:var(--accent-contrast)] shadow-glow">
            <SparkIcon className="h-8 w-8" />
          </div>
          <h2 className="relative text-[19px] font-extrabold leading-tight tracking-tight text-foreground">
            כמה שאלות, חוויה מותאמת
          </h2>
          <p className="relative mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-muted">
            נעבור יחד על כמה שאלות קצרות, אחת בכל פעם, כדי להתאים את החוויה אליך.
            כל שאלה אופציונלית — אפשר לדלג בכל שלב ולערוך אחר כך.
          </p>
        </Card>

        <Button size="lg" className="w-full" onClick={() => { setPhase("steps"); setStepIndex(0); }}>
          <SparkIcon className="h-[18px] w-[18px]" /> התחל
        </Button>
        <Button variant="ghost" className="w-full" onClick={handleSkip}>
          דלג בינתיים
        </Button>
        <p className="text-center text-[12px] text-faint">
          אפשר לדלג ולמלא אחר כך — האפליקציה עובדת רגיל גם בלי הפרופיל.
        </p>
      </div>
    );
  }

  /* ------------------------------- Steps -------------------------------- */

  const meta = STEPS[stepIndex];
  const isSummary = stepIndex === SUMMARY_INDEX;
  // An optional question step (not the summary) that the user can pass empty.
  const isOptionalStep = !isSummary && !meta.required;
  // A required step whose answer is still missing — gates "הבא" and shows a hint.
  const requiredUnanswered =
    Boolean(meta.required) && !isStepAnswered(stepIndex, draft);

  const renderBody = () => {
    switch (stepIndex) {
      case 0:
        return (
          <ChoiceGroup
            options={GOAL_OPTIONS}
            value={draft.goal}
            onSelect={(v) => setField("goal", v)}
          />
        );
      case 1:
        return (
          <ChoiceGroup
            options={LOCATION_OPTIONS}
            value={draft.location}
            onSelect={(v) => setField("location", v)}
          />
        );
      case 2:
        return (
          <ChoiceGroup
            options={FREQUENCY_OPTIONS}
            value={draft.weeklyFrequency}
            onSelect={(v) => setField("weeklyFrequency", v)}
          />
        );
      case 3:
        return (
          <ChoiceGroup
            options={DURATION_OPTIONS}
            value={draft.workoutDuration}
            onSelect={(v) => setField("workoutDuration", v)}
          />
        );
      case 4:
        return (
          <ChoiceGroup
            options={EXPERIENCE_OPTIONS}
            value={draft.experience}
            onSelect={(v) => setField("experience", v)}
          />
        );
      case 5:
        return (
          <MultiChoiceGroup
            options={EQUIPMENT_OPTIONS}
            values={draft.equipment}
            onToggle={toggleEquipment}
          />
        );
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <Label>מין / התאמה — אופציונלי</Label>
              <ChoiceGroup
                options={ADAPTATION_OPTIONS}
                value={draft.adaptation}
                onSelect={(v) => setField("adaptation", v)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label htmlFor="profile-age">גיל</Label>
                <Input
                  id="profile-age"
                  inputMode="numeric"
                  maxLength={MEASURE_MAX_LENGTH}
                  className="text-center font-semibold"
                  value={draft.age}
                  onChange={(e) => setMeasure("age", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="profile-height">גובה · ס״מ</Label>
                <Input
                  id="profile-height"
                  inputMode="numeric"
                  maxLength={MEASURE_MAX_LENGTH}
                  className="text-center font-semibold"
                  value={draft.heightCm}
                  onChange={(e) => setMeasure("heightCm", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="profile-weight">משקל · ק״ג</Label>
                <Input
                  id="profile-weight"
                  inputMode="numeric"
                  maxLength={MEASURE_MAX_LENGTH}
                  className="text-center font-semibold"
                  value={draft.weightKg}
                  onChange={(e) => setMeasure("weightKg", e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <ChoiceGroup
            options={TRAINING_PREFERENCE_OPTIONS}
            value={draft.trainingPreference}
            onSelect={(v) => setField("trainingPreference", v)}
          />
        );
      case 8:
        return (
          <ChoiceGroup
            options={GUIDANCE_STYLE_OPTIONS}
            value={draft.guidanceStyle}
            onSelect={(v) => setField("guidanceStyle", v)}
          />
        );
      case 9:
        return (
          <Textarea
            value={draft.notes}
            maxLength={NOTES_MAX_LENGTH}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="כתוב כאן בחופשיות…"
            aria-label="הערות לפרופיל"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <WizardProgress stepIndex={stepIndex} />

      {/* Calm fallback shown when a save was blocked by a missing core answer. */}
      {missingNotice && !isSummary && (
        <Card className="flex items-start gap-3 border-accent/30 bg-[color:var(--accent-soft)]">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-accent">
            <SparkIcon className="h-4 w-4" />
          </span>
          <p className="text-[12.5px] font-medium leading-relaxed text-foreground">
            חסרות כמה תשובות בסיסיות לפני שמירת הפרופיל.
          </p>
        </Card>
      )}

      {/* Re-keying on the step makes each screen settle in with a soft fade. */}
      <div key={stepIndex} className="animate-fade-up">
        {isSummary ? (
          <ProfileRows
            goal={draft.goal}
            location={draft.location}
            weeklyFrequency={draft.weeklyFrequency}
            experience={draft.experience}
            workoutDuration={draft.workoutDuration}
            equipment={draft.equipment}
            notes={draft.notes}
            adaptation={draft.adaptation}
            age={draft.age}
            heightCm={draft.heightCm}
            weightKg={draft.weightKg}
            trainingPreference={draft.trainingPreference}
            guidanceStyle={draft.guidanceStyle}
          />
        ) : (
          <StepCard icon={meta.icon} title={meta.title} helper={meta.helper}>
            {renderBody()}
            {requiredUnanswered && <StepHint kind="required" />}
            {isOptionalStep && <StepHint kind="optional" />}
          </StepCard>
        )}
      </div>

      {/* Action area */}
      {isSummary ? (
        <div className="space-y-2.5 pt-1">
          <Button size="lg" className="w-full" onClick={handleSave}>
            <CheckIcon className="h-5 w-5" /> שמור פרופיל
          </Button>
          <Button variant="secondary" className="w-full" onClick={goBack}>
            חזור לעריכה
          </Button>
        </div>
      ) : (
        <div className="flex gap-2.5 pt-1">
          <Button variant="secondary" className="px-6" onClick={goBack}>
            חזור
          </Button>
          <Button
            className="flex-1"
            onClick={goNext}
            disabled={requiredUnanswered}
          >
            {stepIndex === LAST_QUESTION_INDEX ? "לסיכום" : "הבא"}
          </Button>
        </div>
      )}
    </div>
  );
}
