"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * A small, premium confirm dialog (portaled, RTL, light/dark aware). Used for
 * decisions that should not be one mis-tap away — e.g. discarding an unsaved
 * workout draft. Two primary actions (confirm / cancel) plus an optional
 * tertiary destructive action rendered as a quiet text button, so a single
 * dialog can offer "stay / leave-and-keep / discard" without a third big button.
 *
 * Escape and a backdrop tap both resolve to `onCancel` (the safe choice).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "ביטול",
  tone = "default",
  onConfirm,
  onCancel,
  extraAction,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional quiet destructive action (e.g. "מחק טיוטה וצא"). */
  extraAction?: { label: string; onClick: () => void };
}) {
  // Escape always resolves to the safe (cancel) choice while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:items-center"
    >
      {/* Backdrop — tap to cancel. */}
      <button
        type="button"
        aria-label="סגירה"
        onClick={onCancel}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-[22rem] rounded-3xl border border-border bg-surface-raised p-5 shadow-float">
        <h2 className="text-[17px] font-extrabold leading-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            {description}
          </p>
        )}

        <div className="mt-4 flex gap-2.5">
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="md"
            className={cn("flex-1", tone === "danger" && "shadow-none")}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>

        {extraAction && (
          <button
            type="button"
            onClick={extraAction.onClick}
            className="tap mt-3 w-full rounded-xl py-1.5 text-center text-[12.5px] font-bold text-red-500 hover:bg-red-500/10"
          >
            {extraAction.label}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
