/**
 * Public informational routes that are intentionally readable BEFORE login,
 * guest entry, or beta approval — so a visitor can read how the system works and
 * what it does with data before deciding to use it.
 *
 * This is a small, explicit allowlist (no wildcards). It only lets these static,
 * read-only info pages render without the pre-login overlays sitting on top of
 * them — it grants NO app access: it creates no Supabase session, no guest
 * session, and no beta access request, and it never exposes app/admin routes.
 * Every other route stays gated exactly as before.
 *
 * Consumed by the two pre-login gates (BetaAuthGate, WelcomeGate). Keep it in
 * sync with the actual pages under app/{privacy,terms,ai-disclaimer}.
 */
export const PUBLIC_INFO_PATHS = [
  "/privacy",
  "/terms",
  "/ai-disclaimer",
] as const;

/** Whether `pathname` is one of the public, pre-login info pages (exact match). */
export function isPublicInfoPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (PUBLIC_INFO_PATHS as readonly string[]).includes(pathname);
}
