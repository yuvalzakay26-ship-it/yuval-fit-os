"use client";

import { useEffect, useState } from "react";

/**
 * A ticking "now" in epoch milliseconds, re-rendering on each interval. Used to
 * drive the live gym-visit timer. The subtree that reads it only ever mounts
 * *after* hydration (the active visit comes from a `useSyncExternalStore` whose
 * server snapshot is `null`), so the lazy `Date.now()` initializer is safe and
 * never causes a hydration mismatch.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
