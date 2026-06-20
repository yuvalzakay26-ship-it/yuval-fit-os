"use client";

// Premium visual onboarding pieces for the Personal Training Profile wizard
// (Personal Profile V5). Two ORIGINAL, dependency-free SVG visuals:
//
//   • BodyFocusFigure — a front + back stylized body map. Each muscle region is
//     a soft overlay on a muted silhouette; selecting a focus area lights up the
//     matching region(s) in the brand accent so the user immediately *sees* what
//     they chose. "גוף מלא" lights every region.
//   • AdaptationCardGroup — a visual gender/adaptation picker: three cards with
//     original, abstract silhouettes (broad-shoulder / hourglass / neutral) and a
//     clear selected highlight. "מעדיף/ה לא לענות" is always offered.
//
// These are PRESENTATIONAL and self-contained. The figures are aria-hidden (the
// accessible controls are the labelled chips/cards), so no third-party asset,
// illustration, or competitor layout is copied — everything here is drawn from
// primitive shapes. No motion beyond a calm colour fade. Reads cleanly at 360px.

import { cn } from "@/lib/utils";

/* --------------------------- Focus-area body map ------------------------- */

/** Internal region keys the figure can light up. */
type Region = "chest" | "abs" | "shoulders" | "arms" | "back" | "glutes" | "legs";

/** Map each focus-area option (Hebrew label) to the body region(s) it lights up.
 *  "גוף מלא" is handled separately (it lights every region). Kept here next to the
 *  figure that consumes it; the option list itself lives in lib/personal-profile. */
const FOCUS_AREA_REGIONS: Record<string, Region[]> = {
  חזה: ["chest"],
  גב: ["back"],
  כתפיים: ["shoulders"],
  ידיים: ["arms"],
  "בטן / ליבה": ["abs"],
  רגליים: ["legs"],
  ישבן: ["glutes"],
};

const ALL_REGIONS: Region[] = [
  "chest",
  "abs",
  "shoulders",
  "arms",
  "back",
  "glutes",
  "legs",
];

/** Resolve the selected focus-area labels into the set of active regions. */
function activeRegions(selected: string[]): Set<Region> {
  if (selected.includes("גוף מלא")) return new Set(ALL_REGIONS);
  const set = new Set<Region>();
  for (const label of selected) {
    for (const region of FOCUS_AREA_REGIONS[label] ?? []) set.add(region);
  }
  return set;
}

const BODY_FILL = "var(--muted)";
const ACTIVE_FILL = "var(--accent)";

/** Shared overlay shape styling: invisible when inactive (the muted base shows
 *  through), strong accent when active, with a calm colour fade between. */
function overlayProps(active: boolean) {
  return {
    fill: ACTIVE_FILL,
    "data-active": active ? "true" : "false",
    style: {
      opacity: active ? 0.95 : 0,
      transition: "opacity .2s ease",
    } as React.CSSProperties,
  };
}

/** The muted silhouette shared by both the front and back figure — a group of
 *  overlapping primitives in one soft fill so it reads as a single body. */
function Silhouette() {
  return (
    <g fill={BODY_FILL} fillOpacity={0.2}>
      <ellipse cx="55" cy="20" rx="12" ry="14" />
      <rect x="49" y="30" width="12" height="9" rx="3" />
      <path d="M33 48 Q55 39 77 48 L71 112 Q55 120 39 112 Z" />
      <rect x="25" y="50" width="11" height="64" rx="5.5" />
      <rect x="74" y="50" width="11" height="64" rx="5.5" />
      <rect x="39" y="108" width="32" height="18" rx="9" />
      <rect x="40" y="122" width="14" height="96" rx="7" />
      <rect x="56" y="122" width="14" height="96" rx="7" />
    </g>
  );
}

/** Front body: chest, abs, shoulders, arms (biceps), legs (quads). */
function FrontFigure({ active }: { active: Set<Region> }) {
  return (
    <svg viewBox="0 0 110 240" className="h-auto w-full" aria-hidden="true">
      <Silhouette />
      {/* shoulders */}
      <g {...overlayProps(active.has("shoulders"))}>
        <ellipse cx="35" cy="53" rx="8.5" ry="7.5" />
        <ellipse cx="75" cy="53" rx="8.5" ry="7.5" />
      </g>
      {/* arms */}
      <g {...overlayProps(active.has("arms"))}>
        <rect x="25" y="58" width="11" height="30" rx="5.5" />
        <rect x="74" y="58" width="11" height="30" rx="5.5" />
      </g>
      {/* chest */}
      <g {...overlayProps(active.has("chest"))}>
        <ellipse cx="46" cy="60" rx="10" ry="8" />
        <ellipse cx="64" cy="60" rx="10" ry="8" />
      </g>
      {/* abs / core */}
      <g {...overlayProps(active.has("abs"))}>
        <rect x="46" y="72" width="18" height="34" rx="6" />
      </g>
      {/* legs / quads */}
      <g {...overlayProps(active.has("legs"))}>
        <rect x="40.5" y="124" width="13" height="52" rx="6.5" />
        <rect x="56.5" y="124" width="13" height="52" rx="6.5" />
      </g>
    </svg>
  );
}

/** Back body: upper/mid back, shoulders (rear), arms (triceps), glutes, legs. */
function BackFigure({ active }: { active: Set<Region> }) {
  return (
    <svg viewBox="0 0 110 240" className="h-auto w-full" aria-hidden="true">
      <Silhouette />
      {/* shoulders */}
      <g {...overlayProps(active.has("shoulders"))}>
        <ellipse cx="35" cy="53" rx="8.5" ry="7.5" />
        <ellipse cx="75" cy="53" rx="8.5" ry="7.5" />
      </g>
      {/* arms */}
      <g {...overlayProps(active.has("arms"))}>
        <rect x="25" y="58" width="11" height="30" rx="5.5" />
        <rect x="74" y="58" width="11" height="30" rx="5.5" />
      </g>
      {/* back */}
      <g {...overlayProps(active.has("back"))}>
        <path d="M41 54 Q55 50 69 54 L66 104 Q55 109 44 104 Z" />
      </g>
      {/* glutes */}
      <g {...overlayProps(active.has("glutes"))}>
        <ellipse cx="48" cy="118" rx="9" ry="8" />
        <ellipse cx="62" cy="118" rx="9" ry="8" />
      </g>
      {/* legs / hamstrings */}
      <g {...overlayProps(active.has("legs"))}>
        <rect x="40.5" y="126" width="13" height="50" rx="6.5" />
        <rect x="56.5" y="126" width="13" height="50" rx="6.5" />
      </g>
    </svg>
  );
}

/** Front + back body map that lights up the muscle regions the user selected. */
export function BodyFocusFigure({ selected }: { selected: string[] }) {
  const active = activeRegions(selected);
  return (
    <div
      data-testid="body-focus-figure"
      className="flex items-end justify-center gap-5"
    >
      {[
        { label: "חזית", node: <FrontFigure active={active} /> },
        { label: "גב", node: <BackFigure active={active} /> },
      ].map((fig) => (
        <div key={fig.label} className="w-[42%] max-w-[140px]">
          {fig.node}
          <p className="mt-1 text-center text-[11px] font-semibold text-faint">
            {fig.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ----------------------- Visual gender / adaptation --------------------- */

/** Abstract, original silhouettes — head + torso only, no detail, no judgment. */
function MaleGlyph() {
  return (
    <svg viewBox="0 0 48 64" className="h-12 w-12" aria-hidden="true">
      <circle cx="24" cy="12" r="7.5" fill="currentColor" />
      <path
        d="M12 27 Q24 21 36 27 L33 47 Q24 50 15 47 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FemaleGlyph() {
  return (
    <svg viewBox="0 0 48 64" className="h-12 w-12" aria-hidden="true">
      <circle cx="24" cy="12" r="7" fill="currentColor" />
      <path
        d="M16 25 C16 30 14 33 19 35 C14 37 16 43 18 47 Q24 50 30 47 C32 43 34 37 29 35 C34 33 32 30 32 25 Q24 22 16 25 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function NeutralGlyph() {
  return (
    <svg viewBox="0 0 48 64" className="h-12 w-12" aria-hidden="true">
      <circle cx="24" cy="12" r="7" fill="currentColor" />
      <rect x="16" y="24" width="16" height="23" rx="7.5" fill="currentColor" />
    </svg>
  );
}

const ADAPTATION_GLYPHS: Record<string, () => React.ReactElement> = {
  גבר: MaleGlyph,
  אישה: FemaleGlyph,
  "מעדיף/ה לא לענות": NeutralGlyph,
};

/** Visual gender/adaptation picker — three highlight cards. The option labels
 *  come from the schema (ADAPTATION_OPTIONS) so storage stays identical. */
export function AdaptationCardGroup({
  options,
  value,
  onSelect,
}: {
  options: readonly string[];
  value: string | undefined;
  onSelect: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {options.map((option) => {
        const active = value === option;
        const Glyph = ADAPTATION_GLYPHS[option] ?? NeutralGlyph;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option)}
            className={cn(
              "tap flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition-colors",
              active
                ? "border-accent bg-[color:var(--accent-soft)] text-accent shadow-glow"
                : "border-border bg-surface-2 text-muted hover:bg-surface",
            )}
          >
            <Glyph />
            <span
              className={cn(
                "text-[12px] font-semibold leading-tight",
                active ? "text-accent" : "text-foreground",
              )}
            >
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
