"use client";

import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "@/components/ui/icons";

/**
 * Mobile-first bottom sheet used for focused flows (food picker, add-food form)
 * so the Nutrition page stays short instead of stacking everything in one
 * scroll. Renders nothing when closed. While open it locks body scroll and
 * closes on Escape or backdrop tap. RTL-aware and respects the safe-area inset.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end" dir="rtl">
      <button
        type="button"
        aria-label="סגירה"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/45 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col",
          "animate-sheet-up rounded-t-3xl border-t border-border bg-background shadow-float",
        )}
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 pb-3.5 pt-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[17px] font-extrabold leading-tight tracking-tight text-foreground"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="tap -m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-foreground"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
