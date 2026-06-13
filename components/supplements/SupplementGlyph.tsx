import type { SupplementGlyphName } from "./supplement-catalog";
import {
  BoltIcon,
  DropletIcon,
  DumbbellIcon,
  FlameIcon,
  HeartIcon,
  LeafIcon,
  PillIcon,
  SparkIcon,
  SunIcon,
} from "@/components/ui/icons";

const GLYPHS: Record<SupplementGlyphName, (p: { className?: string }) => React.ReactElement> = {
  sun: SunIcon,
  spark: SparkIcon,
  bolt: BoltIcon,
  dumbbell: DumbbellIcon,
  droplet: DropletIcon,
  flame: FlameIcon,
  leaf: LeafIcon,
  heart: HeartIcon,
  pill: PillIcon,
};

/**
 * Renders the icon for a catalogue supplement. Pure presentational mapping from
 * the data-layer glyph name to a shared stroke icon — keeps the catalogue file
 * pure data while letting each common item carry an intentional, recognizable
 * mark (never an emoji).
 */
export function SupplementGlyph({
  icon,
  className,
}: {
  icon: SupplementGlyphName;
  className?: string;
}) {
  const Icon = GLYPHS[icon] ?? PillIcon;
  return <Icon className={className} />;
}
