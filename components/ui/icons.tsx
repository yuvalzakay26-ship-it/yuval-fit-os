// Minimal inline icon set (stroke-based) to avoid an icon dependency.
// Each icon inherits `currentColor` and sizes via the `className` prop.

type IconProps = { className?: string };

function base(path: React.ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) =>
  base(<path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />, p);

export const DumbbellIcon = (p: IconProps) =>
  base(
    <>
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </>,
    p,
  );

export const ListIcon = (p: IconProps) =>
  base(
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>,
    p,
  );

export const AppleIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 7c-1.5-2.5-5-2.5-6.5 0S5 16 8 18c1.5 1 2.5 1 4 0 1.5 1 2.5 1 4 0 3-2 2.5-8 1-11s-4.5-1.5-5 0Z" />
      <path d="M12 7c0-1.5.5-3 2-4" />
    </>,
    p,
  );

export const ChartIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 20V4M20 20H4" />
      <path d="M8 16v-3M12 16V8M16 16v-5" />
    </>,
    p,
  );

export const SettingsIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    p,
  );

export const ArrowUpIcon = (p: IconProps) =>
  base(<path d="M12 19V5M6 11l6-6 6 6" />, p);

// Drag handle — two stacked rows of dots, the universal "grab to reorder" grip.
// Used only inside the active-workout reorder mode.
export const GripIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </>,
    p,
  );

export const PlusIcon = (p: IconProps) => base(<path d="M12 5v14M5 12h14" />, p);

export const TrashIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>,
    p,
  );

export const CheckIcon = (p: IconProps) => base(<path d="M5 12l5 5L20 6" />, p);

export const SunIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>,
    p,
  );

export const MoonIcon = (p: IconProps) =>
  base(<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" />, p);

export const FlameIcon = (p: IconProps) =>
  base(
    <path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .4-2 1-2.6C8.5 9.5 9 6 12 3Zm0 0c-.2 3 1.5 4 1.5 6a1.5 1.5 0 0 1-3 0c0-1 .8-1.8 1.5-2" />,
    p,
  );

export const BoltIcon = (p: IconProps) =>
  base(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />, p);

export const TargetIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>,
    p,
  );

export const TrophyIcon = (p: IconProps) =>
  base(
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 13v3M9 20h6M10 20v-1.5h4V20" />
    </>,
    p,
  );

export const CalendarIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>,
    p,
  );

export const ClockIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>,
    p,
  );

export const ChevronIcon = (p: IconProps) => base(<path d="m9 6 6 6-6 6" />, p);

// Down-pointing chevron — the collapse / expand affordance for active-workout
// exercise cards. Rotated 180° via a className (e.g. `rotate-180`) when the card
// is expanded so it points up ("tap to minimise").
export const ChevronDownIcon = (p: IconProps) =>
  base(<path d="m6 9 6 6 6-6" />, p);

// Four rounded tiles — the "more / system hub" affordance for the bottom nav.
// Reads as an app grid / launcher rather than a generic menu.
export const GridIcon = (p: IconProps) =>
  base(
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.9" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.9" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.9" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.9" />
    </>,
    p,
  );

export const AutoThemeIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" />
    </>,
    p,
  );

export const DatabaseIcon = (p: IconProps) =>
  base(
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
    </>,
    p,
  );

export const PlayIcon = (p: IconProps) =>
  base(<path d="M8 5.5v13l10-6.5-10-6.5Z" />, p);

export const PencilIcon = (p: IconProps) =>
  base(
    <path d="M16.5 3.7a2.1 2.1 0 0 1 3 3L7.8 18.4 4 20l1.6-3.8L17.3 4.5M14.5 5.7l3 3" />,
    p,
  );

// Download to device — used by the backup "ייצא גיבוי" action.
export const DownloadIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
    </>,
    p,
  );

// Upload from device — used by the backup "ייבא גיבוי" restore action.
export const UploadIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 21V9M7 14l5-5 5 5" />
      <path d="M4 7V4.5A1.5 1.5 0 0 1 5.5 3h13A1.5 1.5 0 0 1 20 4.5V7" />
    </>,
    p,
  );

// Circular arrows — "refresh / reload" prompt after a restore.
export const RefreshIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6M20.5 12a8.5 8.5 0 0 1-14.5 6" />
      <path d="M18 3v3.5h-3.5M6 21v-3.5h3.5" />
    </>,
    p,
  );

export const CopyIcon = (p: IconProps) =>
  base(
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </>,
    p,
  );

export const BookmarkIcon = (p: IconProps) =>
  base(<path d="M6.5 4h11v17L12 17.5 6.5 21V4Z" />, p);

// Star with an optional solid fill, used for the favorite-food toggle so the
// active state reads clearly. Renders its own svg (the shared `base` forces
// fill="none", which would defeat the filled state).
export const StarIcon = ({
  className,
  filled = false,
}: IconProps & { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "h-5 w-5"}
    aria-hidden="true"
  >
    <path d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.77l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85L12 3.5Z" />
  </svg>
);

// Brand mark — the Fit OS identity glyph: a minimalist broad-shoulders /
// upper-back V-taper silhouette (broad deltoids tapering to a narrow waist) with
// a subtle centred spine groove. The body inherits `currentColor`; the groove is
// a faint dark overlay that reads on the white-on-gradient logo tile. This is the
// single source the app/PWA/favicon rasters are generated from — keep it in sync
// with scripts/brand/generate-brand.mjs. viewBox 0 0 512 512.
export const BrandMark = (p: IconProps) => (
  <svg
    viewBox="0 0 512 512"
    fill="none"
    className={p.className ?? "h-6 w-6"}
    aria-hidden="true"
  >
    <path
      d="M256 96 C266 96 274 98 281 104 C286 116 288 128 289 142 C317 148 347 158 375 176 C395 188 407 203 408 226 C409 250 400 272 383 296 C357 344 320 398 286 430 C278 437 268 441 256 442 C244 441 234 437 226 430 C192 398 155 344 129 296 C112 272 103 250 104 226 C105 203 117 188 137 176 C165 158 195 148 223 142 C224 128 226 116 231 104 C238 98 246 96 256 96 Z"
      fill="currentColor"
    />
    <path
      d="M256 190 C248 208 245 234 245 276 C245 322 248 360 251 396 L256 404 L261 396 C264 360 267 322 267 276 C267 234 264 208 256 190 Z"
      fill="#04111f"
      fillOpacity="0.16"
    />
  </svg>
);

export const SparkIcon = (p: IconProps) =>
  base(
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
    p,
  );

export const XIcon = (p: IconProps) =>
  base(<path d="M6 6l12 12M18 6 6 18" />, p);

export const SearchIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>,
    p,
  );

export const ExpandIcon = (p: IconProps) =>
  base(
    <path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" />,
    p,
  );

export const BookOpenIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 6.5C10.4 4.9 8 4.2 4.5 4.2v14c3.5 0 5.9.7 7.5 2.3 1.6-1.6 4-2.3 7.5-2.3v-14c-3.5 0-5.9.7-7.5 2.3Z" />
      <path d="M12 6.5v14" />
    </>,
    p,
  );

export const DropletIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3.2c3.4 3.9 6 7.1 6 10.2a6 6 0 0 1-12 0c0-3.1 2.6-6.3 6-10.2Z" />
      <path d="M9.2 13.6a2.8 2.8 0 0 0 2.3 2.6" />
    </>,
    p,
  );

export const GlassIcon = (p: IconProps) =>
  base(
    <>
      <path d="M6 4h12l-1.1 15.2a1.8 1.8 0 0 1-1.8 1.6H8.9a1.8 1.8 0 0 1-1.8-1.6L6 4Z" />
      <path d="M6.6 10.5h10.8" />
    </>,
    p,
  );

export const BottleIcon = (p: IconProps) =>
  base(
    <>
      <path d="M10 2.5h4v2.2c0 .7.3 1.3.8 1.8l.9.9c.5.5.8 1.2.8 2V19a2.5 2.5 0 0 1-2.5 2.5h-3.6A2.5 2.5 0 0 1 7.5 19V9.4c0-.8.3-1.5.8-2l.9-.9c.5-.5.8-1.1.8-1.8V2.5Z" />
      <path d="M7.5 12.5h9" />
    </>,
    p,
  );

// A drinking cup / tumbler — slightly tapered with a rim line. Used for the
// "כוס" water preset.
export const CupIcon = (p: IconProps) =>
  base(
    <>
      <path d="M6.5 5h11l-1 13.4a1.8 1.8 0 0 1-1.8 1.6H9.3a1.8 1.8 0 0 1-1.8-1.6L6.5 5Z" />
      <path d="M7 9.5h10" />
    </>,
    p,
  );

// A sport / gym bottle — a narrow neck with a flip cap, the "הבקבוק שלי" preset.
export const SportBottleIcon = (p: IconProps) =>
  base(
    <>
      <path d="M10.2 2.5h3.6v1.4c0 .5.2 1 .6 1.4l.7.7c.6.6.9 1.4.9 2.2V19a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8.2c0-.8.3-1.6.9-2.2l.7-.7c.4-.4.6-.9.6-1.4V2.5Z" />
      <path d="M9.5 2.5h5" />
      <path d="M8.7 11h6.6" />
    </>,
    p,
  );

// A large bottle / jug — wider body with a carry shoulder, the "בקבוק גדול" preset.
export const LargeBottleIcon = (p: IconProps) =>
  base(
    <>
      <path d="M10.5 2.5h3v1.6c0 .6.3 1.1.8 1.5C16 6.7 17 8.1 17 9.9V19a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 19V9.9c0-1.8 1-3.2 2.7-4.3.5-.4.8-.9.8-1.5V2.5Z" />
      <path d="M7 11.5h10" />
    </>,
    p,
  );

// Droplet carrying a plus sign — the signature "add water" affordance.
export const PlusWaterIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3.2c3.4 3.9 6 7.1 6 10.2a6 6 0 0 1-12 0c0-3.1 2.6-6.3 6-10.2Z" />
      <path d="M12 11v5M9.5 13.5h5" />
    </>,
    p,
  );

export const LockIcon = (p: IconProps) =>
  base(
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.4" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2.5" />
    </>,
    p,
  );

// Capsule pill — the signature supplements affordance. A rounded capsule on a
// diagonal with a divider line across its middle.
export const PillIcon = (p: IconProps) =>
  base(
    <>
      <rect
        x="2.8"
        y="8.4"
        width="18.4"
        height="7.2"
        rx="3.6"
        transform="rotate(-45 12 12)"
      />
      <path d="m9.5 9.5 5 5" />
    </>,
    p,
  );

// Horizontal two-tone capsule — a cleaner, more "supplement-like" mark than the
// diagonal PillIcon, used for the premium empty-state hero composition. The
// divider sits across the middle so the capsule reads as two joined halves.
export const CapsuleIcon = (p: IconProps) =>
  base(
    <>
      <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" />
      <path d="M12 7.5v9" />
    </>,
    p,
  );

// Heart — calm "general health" category glyph (outline only, never clinical).
export const HeartIcon = (p: IconProps) =>
  base(
    <path d="M12 20.5S4 16 4 9.8A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 20 9.8c0 6.2-8 10.7-8 10.7Z" />,
    p,
  );

// Leaf — used for plant/biome-style items (e.g. probiotics, omega).
export const LeafIcon = (p: IconProps) =>
  base(
    <>
      <path d="M5 20c-1-9 5-16 15-16 1 9-5 16-15 16Z" />
      <path d="M9 16c2.2-2.4 4.6-4.2 8-5.6" />
    </>,
    p,
  );

// Archive box — for the "archived supplements" affordance.
export const ArchiveIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3.5" y="4" width="17" height="4.2" rx="1.4" />
      <path d="M5.2 8.2V19a1.5 1.5 0 0 0 1.5 1.5h10.6A1.5 1.5 0 0 0 18.8 19V8.2" />
      <path d="M10 12h4" />
    </>,
    p,
  );

// Alert triangle with an exclamation — used for the admin access-code gate's
// warning composition. Serious, not clinical.
export const WarningIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 4.2 21 19.5H3L12 4.2Z" />
      <path d="M12 10v4M12 16.8v.01" />
    </>,
    p,
  );

// Eye / eye-off pair for the optional show/hide code toggle on the gate input.
export const EyeIcon = (p: IconProps) =>
  base(
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    p,
  );

export const EyeOffIcon = (p: IconProps) =>
  base(
    <>
      <path d="M9.9 5.7A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.4 4M6.2 7.8A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 3.9-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </>,
    p,
  );

// Shield with a check — used for the calm, non-alarming safety note.
export const ShieldIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 11.5 2 2 4-4.5" />
    </>,
    p,
  );

// Circular check. Supports a solid fill (like StarIcon) so the "taken" habit
// state can read as a confident, filled badge.
export const CheckCircleIcon = ({
  className,
  filled = false,
}: IconProps & { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "h-5 w-5"}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.5" />
    <path
      d="m8.4 12 2.6 2.6 4.6-5.2"
      fill="none"
      stroke={filled ? "var(--accent-contrast)" : "currentColor"}
    />
  </svg>
);
