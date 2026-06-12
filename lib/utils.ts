// Small shared helpers. Kept dependency-free.

/** Join class names, dropping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Local ISO date (YYYY-MM-DD) without timezone shifting. */
export function toISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date as a local ISO date string. */
export function todayISO(): string {
  return toISODate(new Date());
}

const HE_DATE_FORMAT = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Human-friendly Hebrew date label, e.g. "יום חמישי, 12 ביוני". */
export function formatHebrewDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return HE_DATE_FORMAT.format(new Date(year, month - 1, day));
}

/** Generate a reasonably unique id without external deps. */
export function createId(prefix = "id"): string {
  const random = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${random}`;
}

/** ISO date string for the Monday-based start of the current week. */
export function startOfWeekISO(reference: Date = new Date()): string {
  const date = new Date(reference);
  const day = date.getDay(); // 0 = Sunday
  // Treat Sunday as the first day of the week (common in Israel).
  const diff = day; // days since Sunday
  date.setDate(date.getDate() - diff);
  return toISODate(date);
}

/** Time-of-day Hebrew greeting. */
export function hebrewGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 6) return "לילה טוב";
  if (hour < 12) return "בוקר טוב";
  if (hour < 18) return "צהריים טובים";
  return "ערב טוב";
}

/** Compact "weight×reps" summary of a set list, e.g. "45×12, 50×10, 50×8". */
export function formatSetsSummary(
  sets: Array<{ weightKg: number; reps: number }>,
): string {
  return sets.map((s) => `${s.weightKg}×${s.reps}`).join(", ");
}

/** Parse a possibly-empty numeric input, returning undefined when blank. */
export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
