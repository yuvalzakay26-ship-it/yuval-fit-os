import {
  AppleIcon,
  ChartIcon,
  DumbbellIcon,
  GridIcon,
  HomeIcon,
} from "@/components/ui/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  /**
   * Extra route prefixes that should also light up this tab. Used by the "עוד"
   * (More) tab so secondary/system tools surfaced through the System Hub —
   * Exercises, Settings, Learn — keep a sensible active state even though they
   * have no primary tab of their own. Nutrition's sub-routes (water,
   * supplements, library, add) already match the Nutrition tab via its href.
   */
  match?: string[];
}

// Primary destinations shown in the bottom navigation (RTL order handled by CSS).
// Exercises lives in the System Hub (/more), not the bottom nav — see
// docs/NAVIGATION_SYSTEM_HUB.md for the bottom-nav philosophy.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "היום", icon: HomeIcon },
  { href: "/workouts", label: "אימונים", icon: DumbbellIcon },
  { href: "/nutrition", label: "תזונה", icon: AppleIcon, match: ["/recipes"] },
  { href: "/progress", label: "התקדמות", icon: ChartIcon },
  {
    href: "/more",
    label: "עוד",
    icon: GridIcon,
    match: ["/exercises", "/settings", "/learn", "/gym", "/training-profile"],
  },
];
