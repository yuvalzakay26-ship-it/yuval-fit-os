import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { RouteTransition } from "./RouteTransition";
import { ScrollToTop } from "./ScrollToTop";
import { GuestModeBanner } from "@/components/access/GuestModeBanner";
import { WaterGoalCelebrationOverlay } from "@/components/water/WaterGoalCelebrationOverlay";
import { SupplementTakenCelebrationOverlay } from "@/components/supplements/SupplementTakenCelebrationOverlay";

/**
 * App-wide chrome: sticky header, scrollable content area, fixed bottom nav,
 * and the floating scroll-to-top button. Content is width-capped for a
 * phone-like feel even on desktop.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Header />
      <GuestModeBanner />
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <ScrollToTop />
      <BottomNav />
      {/* App-wide water-goal celebration (pointer-events-none, self-dismissing). */}
      <WaterGoalCelebrationOverlay />
      {/* App-wide supplement-taken success celebration (distinct theme, same pattern). */}
      <SupplementTakenCelebrationOverlay />
    </div>
  );
}
