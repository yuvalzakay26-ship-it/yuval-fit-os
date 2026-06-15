"use client";

// Photo-first nutrition — the primary "סרוק צלחת" card + capture flow (Phase 3.xx).
//
// This is the DEFAULT logging action on /nutrition. When AI is configured the
// active `PhotoScanCard` owns the whole client flow as a small state machine:
//   idle → precapture → analyzing → review | error
// Nothing is ever saved automatically: the journal is written only after the
// user confirms on the review screen. The image is sent to the server route for
// analysis and is never stored. Manual add and "add again" stay reachable from
// every error state so the user is never stuck.
//
// When AI is NOT configured the page renders `PhotoScanCardDisabled` instead — a
// calm "coming soon" (`בקרוב`) card so users still see the feature exists. It is
// inert: no inputs, no overlay, no fetch — it never opens upload or calls the
// analyze route. Manual add and "add again" remain the working fallbacks below.
// Because /nutrition is force-dynamic, adding a key later flips the page to the
// active card automatically with no rebuild. See `docs/NUTRITION_PHOTO_ASSIST.md`.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FoodLog } from "@/lib/fitness-types";
import { addFoodLog } from "@/lib/fitness-store";
import {
  ERROR_COPY_HE,
  guessMealType,
  PHOTO_ACCEPT_ATTR,
  validatePhotoFile,
  type PhotoAnalyzeResponse,
  type PhotoDraft,
} from "@/lib/nutrition-photo";
import { Button } from "@/components/ui/Button";
import {
  CameraIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  ShieldIcon,
  UploadIcon,
  XIcon,
} from "@/components/ui/icons";
import { PhotoDraftReview } from "./PhotoDraftReview";

type Stage =
  | { name: "idle" }
  | { name: "precapture" }
  | { name: "analyzing" }
  | { name: "review"; draft: PhotoDraft }
  | { name: "error"; message: string };

export function PhotoScanCard({
  hasRecents,
  onSaved,
}: {
  /** Whether the page has recent foods, so error states can offer "הוסף שוב". */
  hasRecents: boolean;
  /** Called after a confirmed save, with how many entries were added. */
  onSaved: (count: number) => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const open = stage.name !== "idle";
  const close = () => setStage({ name: "idle" });

  const pickCamera = () => cameraInputRef.current?.click();
  const pickUpload = () => uploadInputRef.current?.click();

  const analyze = async (file: File) => {
    const check = validatePhotoFile(file);
    if (!check.ok) {
      setStage({ name: "error", message: ERROR_COPY_HE[check.error] });
      return;
    }
    setStage({ name: "analyzing" });
    try {
      const body = new FormData();
      body.append("image", file);
      body.append("mealTypeHint", guessMealType());
      const res = await fetch("/api/nutrition/analyze-photo", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as PhotoAnalyzeResponse;
      if (data.ok) {
        setStage({ name: "review", draft: data });
      } else {
        setStage({ name: "error", message: data.messageHe });
      }
    } catch {
      // No response body — a connectivity failure.
      setStage({ name: "error", message: ERROR_COPY_HE.network });
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so re-picking the same file fires change again.
    e.target.value = "";
    if (file) void analyze(file);
  };

  const handleConfirm = (logs: FoodLog[]) => {
    logs.forEach((log) => addFoodLog(log));
    close();
    onSaved(logs.length);
  };

  const goManual = () => {
    close();
    router.push("/nutrition/add");
  };

  return (
    <>
      {/* Hidden inputs: one prefers the camera, one is a plain file picker. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={PHOTO_ACCEPT_ATTR}
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept={PHOTO_ACCEPT_ATTR}
        className="hidden"
        onChange={onFileChange}
      />

      {/* The primary scan card */}
      <button
        type="button"
        onClick={() => setStage({ name: "precapture" })}
        className="tap relative w-full overflow-hidden rounded-3xl border border-[color:var(--accent-nutrition-soft)] bg-surface-raised p-4 text-right shadow-float transition-[border-color] hover:border-[color:var(--accent-nutrition)]"
      >
        <div className="flex items-center gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl nutrition-gradient text-[color:var(--accent-contrast)] shadow-glow-nutrition">
            <CameraIcon className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-extrabold text-foreground">סרוק צלחת</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
              צלם את הארוחה ונבנה לך טיוטת תזונה לעריכה
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-faint">
            <ShieldIcon className="h-3.5 w-3.5" />
            הערכה בלבד · אפשר לערוך לפני שמירה
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl nutrition-gradient px-3.5 py-2 text-[13px] font-bold text-[color:var(--accent-contrast)] shadow-glow-nutrition">
            <CameraIcon className="h-4 w-4" /> סרוק עכשיו
          </span>
        </div>
      </button>

      {/* Flow overlay */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="סריקת צלחת"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-background p-4 shadow-float sm:rounded-3xl">
            {/* Close */}
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-faint">
                סריקת צלחת
              </p>
              <button
                type="button"
                onClick={close}
                className="tap -m-1.5 flex h-9 w-9 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-foreground"
                aria-label="סגירה"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {stage.name === "precapture" && (
              <div className="space-y-4 pb-2">
                <div className="flex flex-col items-center px-2 text-center">
                  <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
                    <CameraIcon className="h-7 w-7" />
                  </span>
                  <p className="text-[13.5px] leading-relaxed text-muted">
                    התמונה משמשת ליצירת טיוטת תזונה בלבד. הערכים הם הערכה וניתן לערוך
                    אותם לפני שמירה.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" size="lg" onClick={pickCamera}>
                    <CameraIcon className="h-5 w-5" /> צלם תמונה
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    onClick={pickUpload}
                  >
                    <UploadIcon className="h-5 w-5" /> העלה תמונה
                  </Button>
                </div>
                <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-faint">
                  <ShieldIcon className="h-3.5 w-3.5" />
                  התמונה נשלחת לניתוח בלבד ואינה נשמרת.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={close}
                >
                  ביטול
                </Button>
              </div>
            )}

            {stage.name === "analyzing" && (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
                <span
                  className="h-10 w-10 animate-spin rounded-full border-[3px] border-[color:var(--accent-nutrition-soft)] border-t-[color:var(--accent-nutrition)]"
                  aria-hidden="true"
                />
                <p className="text-[15px] font-bold text-foreground">מנתח את הארוחה…</p>
                <p className="text-[12.5px] text-muted">
                  רגע אחד, בונים לך טיוטה מהתמונה
                </p>
              </div>
            )}

            {stage.name === "review" && (
              <PhotoDraftReview
                draft={stage.draft}
                initialMealType={guessMealType()}
                onConfirm={handleConfirm}
                onRetry={() => setStage({ name: "precapture" })}
                onManual={goManual}
                onCancel={close}
              />
            )}

            {stage.name === "error" && (
              <div className="space-y-4 pb-2">
                <div className="flex flex-col items-center px-2 py-4 text-center">
                  <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-500">
                    <RefreshIcon className="h-7 w-7" />
                  </span>
                  <p className="text-[14px] font-semibold leading-relaxed text-foreground">
                    {stage.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={() => setStage({ name: "precapture" })}
                  >
                    <RefreshIcon className="h-5 w-5" /> נסה שוב
                  </Button>
                  <div
                    className={hasRecents ? "grid grid-cols-2 gap-2" : "grid grid-cols-1"}
                  >
                    <Link href="/nutrition/add" onClick={close}>
                      <Button type="button" variant="secondary" size="md" className="w-full">
                        <PencilIcon className="h-4 w-4" /> הוסף ידנית
                      </Button>
                    </Link>
                    {hasRecents && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className="w-full"
                        onClick={close}
                      >
                        <PlusIcon className="h-4 w-4" /> הוסף שוב
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The "coming soon" scan card shown when AI is NOT configured. It mirrors the
 * active card's shape so the feature reads as a real, polished part of the app,
 * but it is fully inert — a plain `<div>` with no inputs, no overlay, no click
 * handler, and no fetch. It can never open upload or call the analyze route, and
 * it never blocks the manual / "add again" fallbacks that sit directly below it.
 *
 * `showSetupHint` is a dev/admin-only helper (off for normal users): in
 * non-production it explains that the feature is built but no AI key is wired in
 * the production environment yet. Normal users only ever see the clean `בקרוב`.
 */
export function PhotoScanCardDisabled({
  showSetupHint = false,
}: {
  /** Show the dev/admin "feature ready, no key yet" helper line. Off by default. */
  showSetupHint?: boolean;
}) {
  return (
    <div
      aria-disabled="true"
      className="w-full overflow-hidden rounded-3xl border border-border bg-surface-raised p-4 text-right shadow-soft"
    >
      <div className="flex items-center gap-3.5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-faint">
          <CameraIcon className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-extrabold text-foreground">סרוק צלחת</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
            ניתוח ארוחה מתמונה יופעל בקרוב
          </p>
        </div>
        {/* "בקרוב" badge — sits at the row's end, clear of the icon and text. */}
        <span className="inline-flex shrink-0 items-center self-start rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted">
          בקרוב
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-faint">
          <ShieldIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">בינתיים אפשר להוסיף ידנית או להשתמש ב־הוסף שוב</span>
        </span>
        {/* A real disabled button: never fires, shows the not-interactive cursor. */}
        <button
          type="button"
          disabled
          className="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-[13px] font-bold text-faint"
        >
          <LockIcon className="h-4 w-4" /> לא פעיל כרגע
        </button>
      </div>

      {showSetupHint && (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 px-3 py-2 text-[11.5px] leading-snug text-faint">
          הפיצ׳ר מוכן, אבל עדיין לא חובר מפתח AI בסביבת הפרודקשן.
        </p>
      )}
    </div>
  );
}
