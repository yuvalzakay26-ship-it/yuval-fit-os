import {
  AppleIcon,
  ChartIcon,
  DumbbellIcon,
  HomeIcon,
  ListIcon,
} from "@/components/ui/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

// Primary destinations shown in the bottom navigation (RTL order handled by CSS).
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "היום", icon: HomeIcon },
  { href: "/workouts", label: "אימונים", icon: DumbbellIcon },
  { href: "/exercises", label: "תרגילים", icon: ListIcon },
  { href: "/nutrition", label: "תזונה", icon: AppleIcon },
  { href: "/progress", label: "התקדמות", icon: ChartIcon },
];
