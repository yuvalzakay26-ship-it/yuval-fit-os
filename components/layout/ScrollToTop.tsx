"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Floating scroll-to-top button. Appears only after scrolling down and sits
 * above the bottom navigation (offset accounts for nav height + safe area).
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollToTop}
      aria-label="גלילה למעלה"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "tap fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface/90 text-foreground shadow-float backdrop-blur-xl",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
      // Sit clear of the bottom nav plus the safe-area inset.
      style={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}
    >
      <ArrowUpIcon className="h-5 w-5" />
    </button>
  );
}
