"use client";

import { usePathname } from "next/navigation";

/**
 * Re-keys on route change so each page content gently fades up on navigation —
 * a small, native-feeling transition.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-up">
      {children}
    </div>
  );
}
