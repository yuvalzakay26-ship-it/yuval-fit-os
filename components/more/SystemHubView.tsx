import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/PageHeader";
import { BetaAdminHubLink } from "@/components/more/BetaAdminHubLink";
import { cn } from "@/lib/utils";
import {
  AppleIcon,
  BookmarkIcon,
  BookOpenIcon,
  ChartIcon,
  ChevronIcon,
  DatabaseIcon,
  DoorEnterIcon,
  DropletIcon,
  DumbbellIcon,
  GridIcon,
  ListIcon,
  LockIcon,
  PillIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
  SparkIcon,
  TargetIcon,
} from "@/components/ui/icons";

type IconCmp = (props: { className?: string }) => React.ReactElement;

/**
 * A module identity for a hub card. `wash` is a CSS class that paints a faint
 * feature-coloured gradient across the card (light + dark tuned); `accent` /
 * `soft` drive the icon badge. `system` cards stay neutral premium — no wash —
 * so the מערכת group reads as calm management rather than another colour block.
 */
type Tone =
  | "strength"
  | "nutrition"
  | "water"
  | "supplement"
  | "energy"
  | "learn"
  | "system";

const TONE: Record<Tone, { accent: string; soft: string; wash: string }> = {
  strength: {
    accent: "var(--accent-strength)",
    soft: "var(--accent-strength-soft)",
    wash: "module-strength",
  },
  nutrition: {
    accent: "var(--accent-nutrition)",
    soft: "var(--accent-nutrition-soft)",
    wash: "module-nutrition",
  },
  water: {
    accent: "var(--accent-water)",
    soft: "var(--accent-water-soft)",
    wash: "module-water",
  },
  supplement: {
    accent: "var(--accent-supplement)",
    soft: "var(--accent-supplement-soft)",
    wash: "module-supplement",
  },
  energy: {
    accent: "var(--accent-energy)",
    soft: "var(--accent-energy-soft)",
    wash: "module-energy",
  },
  learn: {
    accent: "var(--accent-learn)",
    soft: "var(--accent-learn-soft)",
    wash: "module-learn",
  },
  system: { accent: "", soft: "", wash: "" },
};

interface HubItem {
  href?: string;
  title: string;
  description: string;
  icon: IconCmp;
  tone: Tone;
  /** Optional "בקרוב" future card — rendered non-interactive, never a fake route. */
  soon?: boolean;
}

interface HubSection {
  title: string;
  /** Lead colour for the section's leading dot. */
  accent: string;
  items: HubItem[];
}

const SECTIONS: HubSection[] = [
  {
    title: "כושר",
    accent: "var(--accent-strength)",
    items: [
      {
        href: "/exercises",
        title: "ספריית תרגילים",
        description: "כל התרגילים, תמונות והדגמות",
        icon: ListIcon,
        tone: "strength",
      },
      {
        href: "/workouts",
        title: "תבניות אימון",
        description: "תוכניות האימון והסטים שלך",
        icon: DumbbellIcon,
        tone: "strength",
      },
      {
        href: "/gym",
        title: "נוכחות במכון",
        description: "כניסה, יציאה וזמן שהייה במכון",
        icon: DoorEnterIcon,
        tone: "energy",
      },
    ],
  },
  {
    title: "תזונה",
    accent: "var(--accent-nutrition)",
    items: [
      {
        href: "/nutrition",
        title: "מעקב תזונה",
        description: "יומן קלוריות ומאקרו יומי",
        icon: AppleIcon,
        tone: "nutrition",
      },
      {
        href: "/nutrition/library",
        title: "מאגר אוכל",
        description: "בחר מזונות ושמור ערכים אישיים",
        icon: BookmarkIcon,
        tone: "nutrition",
      },
      {
        href: "/nutrition/add",
        title: "הוספת אוכל",
        description: "רישום מהיר של ארוחה ליומן",
        icon: PlusIcon,
        tone: "nutrition",
      },
      {
        href: "/nutrition/water",
        title: "מים",
        description: "מעקב שתייה וקיצורי מים",
        icon: DropletIcon,
        tone: "water",
      },
      {
        href: "/nutrition/supplements",
        title: "תוספים",
        description: "מעקב אישי לתוספים שהגדרת",
        icon: PillIcon,
        tone: "supplement",
      },
    ],
  },
  {
    title: "התקדמות ולמידה",
    accent: "var(--accent-energy)",
    items: [
      {
        href: "/progress",
        title: "התקדמות",
        description: "סיכום אימונים ומגמות",
        icon: ChartIcon,
        tone: "energy",
      },
      {
        href: "/learn",
        title: "מרכז ידע",
        description: "מאמרים, טיפים ועקרונות אימון",
        icon: BookOpenIcon,
        tone: "learn",
      },
      {
        href: "/nutrition",
        title: "מחשבון חלבון",
        description: "כמה חלבון ביום מתאים לך",
        icon: TargetIcon,
        tone: "nutrition",
      },
    ],
  },
  {
    title: "מערכת",
    accent: "var(--muted)",
    items: [
      {
        href: "/settings",
        title: "הגדרות",
        description: "ניהול מערכת, ערכות נושא ואיפוסים",
        icon: SettingsIcon,
        tone: "system",
      },
      {
        href: "/backup",
        title: "גיבוי ושחזור",
        description: "ייצוא וייבוא הנתונים שלך",
        icon: DatabaseIcon,
        tone: "system",
      },
      {
        href: "/settings",
        title: "חשבון בטא",
        description: "התחברות, התנתקות וגישה",
        icon: LockIcon,
        tone: "system",
      },
      {
        href: "/training-profile",
        title: "פרופיל אימון אישי",
        description: "המטרה, השגרה וההעדפות שלך",
        icon: TargetIcon,
        tone: "system",
      },
      {
        title: "מסלול אישי",
        description: "התאמה אישית חכמה של המערכת",
        icon: SparkIcon,
        tone: "system",
        soon: true,
      },
    ],
  },
  {
    title: "מידע ומסמכים",
    accent: "var(--muted)",
    items: [
      {
        href: "/privacy",
        title: "מדיניות פרטיות",
        description: "איך הנתונים שלך נשמרים ומשמשים",
        icon: ShieldIcon,
        tone: "system",
      },
      {
        href: "/terms",
        title: "תנאי שימוש ובטא",
        description: "מה לדעת על השימוש במערכת",
        icon: BookOpenIcon,
        tone: "system",
      },
      {
        href: "/ai-disclaimer",
        title: "הבהרת AI ותזונה",
        description: "איך עובד ניתוח התמונה",
        icon: SparkIcon,
        tone: "system",
      },
    ],
  },
];

function IconBadge({ item }: { item: HubItem }) {
  const tone = TONE[item.tone];
  const Icon = item.icon;
  const neutral = item.tone === "system";
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
        neutral && "bg-surface-2 text-foreground",
      )}
      style={
        neutral ? undefined : { background: tone.soft, color: tone.accent }
      }
    >
      <Icon className="h-[22px] w-[22px]" />
    </span>
  );
}

function HubCardInner({ item }: { item: HubItem }) {
  return (
    <Card
      className={cn(
        "flex items-center gap-3.5",
        item.tone !== "system" && `${TONE[item.tone].wash} sheen`,
        item.soon && "opacity-65",
      )}
    >
      <IconBadge item={item} />
      <div className="min-w-0 flex-1">
        <CardTitle className="truncate">{item.title}</CardTitle>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {item.description}
        </p>
      </div>
      {item.soon ? (
        <Badge tone="neutral" className="shrink-0">
          בקרוב
        </Badge>
      ) : (
        <ChevronIcon className="h-4 w-4 shrink-0 rotate-180 text-faint" />
      )}
    </Card>
  );
}

function HubCard({ item }: { item: HubItem }) {
  // Future/placeholder cards never link anywhere — no fake routes.
  if (item.soon || !item.href) {
    return (
      <div aria-disabled="true">
        <HubCardInner item={item} />
      </div>
    );
  }
  return (
    <Link
      href={item.href}
      className="tap block"
      aria-label={`${item.title} — ${item.description}`}
    >
      <HubCardInner item={item} />
    </Link>
  );
}

/**
 * The System Hub ("מרכז מערכת"): a premium, RTL, mobile-first dashboard that
 * gathers every secondary tool of Fit OS into module-coloured categories. Pure
 * navigation — links to existing routes only. No data, storage, or logic; the
 * future "מסלול אישי" personal-path flow is shown as a non-blocking "בקרוב"
 * card and is intentionally not wired up in this phase.
 */
export function SystemHubView() {
  return (
    <div>
      <header className="mb-7">
        <div className="flex items-center gap-3">
          <span className="brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow">
            <GridIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-foreground">
              מרכז מערכת
            </h1>
            <p className="mt-0.5 text-[13px] text-muted">
              כל הכלים של Fit OS במקום אחד
            </p>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          בחר לאן להמשיך — כושר, תזונה, התקדמות או ניהול מערכת.
        </p>
      </header>

      <div className="space-y-7">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <SectionHeader title={section.title} accent={section.accent} />
            <div className="space-y-2.5">
              {section.items.map((item) => (
                <HubCard key={`${item.title}-${item.href ?? "soon"}`} item={item} />
              ))}
            </div>
          </section>
        ))}

        {/* Admin-only — renders only when the signed-in user is a beta admin. */}
        <BetaAdminHubLink />
      </div>
    </div>
  );
}
