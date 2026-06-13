// Shared mapping from a `WaterPresetIcon` id to its SVG component, plus the
// small icon palette offered in the preset editor. Centralized so every water
// surface (Today card, full screen, editor) renders presets consistently.

import type { WaterPresetIcon } from "@/lib/fitness-types";
import {
  BottleIcon,
  CupIcon,
  DropletIcon,
  LargeBottleIcon,
  SportBottleIcon,
} from "@/components/ui/icons";

type IconComponent = (props: { className?: string }) => React.ReactElement;

/** Resolve a preset's icon id to its SVG component (defaults to the cup). */
export const WATER_PRESET_ICONS: Record<WaterPresetIcon, IconComponent> = {
  cup: CupIcon,
  bottle: BottleIcon,
  "sport-bottle": SportBottleIcon,
  "large-bottle": LargeBottleIcon,
  drop: DropletIcon,
};

/** The icon choices offered in the editor, in display order, with Hebrew names. */
export const WATER_PRESET_ICON_OPTIONS: Array<{
  id: WaterPresetIcon;
  label: string;
}> = [
  { id: "cup", label: "כוס" },
  { id: "bottle", label: "בקבוק" },
  { id: "sport-bottle", label: "בקבוק ספורט" },
  { id: "large-bottle", label: "בקבוק גדול" },
  { id: "drop", label: "טיפה" },
];

export function waterPresetIcon(icon: WaterPresetIcon): IconComponent {
  return WATER_PRESET_ICONS[icon] ?? CupIcon;
}
