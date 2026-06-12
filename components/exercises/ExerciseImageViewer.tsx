"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { XIcon } from "@/components/ui/icons";

// Fullscreen lightbox for exercise images. Unlike the in-card image (which
// crops with object-cover), this shows the complete image with object-contain.
// Closes on the X button, a backdrop tap, or Escape; locks background scroll
// while open. Rendered in a portal above the bottom nav (z-50 > nav's z-40).
export function ExerciseImageViewer({
  imagePath,
  title,
  subtitle,
  open,
  onClose,
}: {
  imagePath: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Top bar: exercise name + close. stopPropagation keeps taps on the
          bar (e.g. missing the X slightly) from closing via the backdrop. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between gap-3 px-4 py-3"
      >
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight text-white">
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-[12px] text-white/60">{subtitle}</p>
          )}
        </div>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="סגור תמונה"
          className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Image area — full image, centered, never cropped or stretched.
          Tapping anywhere here (image included) closes the viewer, since the
          contained image is surrounded by letterbox space that is visually
          indistinguishable from the backdrop. */}
      <div className="relative min-h-0 flex-1 px-3 pb-6">
        <div className="animate-zoom-in relative h-full w-full overflow-hidden rounded-3xl">
          <Image
            src={imagePath}
            alt={title}
            fill
            sizes="100vw"
            className="object-contain"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
