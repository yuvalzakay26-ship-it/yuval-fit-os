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

export const SparkIcon = (p: IconProps) =>
  base(
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
    p,
  );

export const XIcon = (p: IconProps) =>
  base(<path d="M6 6l12 12M18 6 6 18" />, p);

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
