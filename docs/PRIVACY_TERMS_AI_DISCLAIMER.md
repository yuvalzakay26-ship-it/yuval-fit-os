# Privacy / Terms / AI Disclaimer pass

A set of plain-language, Hebrew, RTL, mobile-first informational pages that
explain how Fit OS works today (local-first, beta) and how it handles data. They
are **not** lawyer-reviewed legal documents — every page opens with a note to
that effect.

## Pages added

| Route            | Title (he)         | Purpose |
| ---------------- | ------------------ | ------- |
| `/privacy`       | מדיניות פרטיות      | Local-first storage model, what lives in `localStorage`, backup/export, Google/Supabase beta-auth data, guest mode (device-only), food-photo scan privacy, contact info. |
| `/terms`         | תנאי שימוש ובטא     | Beta/dev product, bugs & change possible, keep backups, personal-tracking only (not medical/nutrition/fitness advice), beta access can be approved/blocked/removed. |
| `/ai-disclaimer` | הבהרת AI ותזונה     | Photo AI is an **estimate only**, a **draft for review**, the **user confirms before saving** (never auto-saved); not medical advice; calm, non-shaming tone. |

Shared presentation components live in
`components/legal/InfoSection.tsx` (`InfoSection`, `InfoList`,
`PlainLanguageNote`) — pure UI, no storage/API/behaviour.

## Where links were added

1. **System Hub** (`components/more/SystemHubView.tsx`) — a new
   **"מידע ומסמכים"** section linking to all three pages.
2. **Login / auth screen** (`components/access/BetaAuthGate.tsx`, sign-in
   screen) — a small footer: `מדיניות פרטיות · תנאי שימוש`.
3. **Nutrition scan UI** (`components/nutrition/NutritionView.tsx`) — a small
   `איך עובד ניתוח AI?` link under the scan card (shown in both the active and
   "בקרוב" states), linking to `/ai-disclaimer`.
4. **Beta Welcome Notice** (`components/access/BetaWelcomeNotice.tsx`) — a quiet
   `מדיניות פרטיות · תנאי שימוש` line, kept minimal so the welcome stays clean.

## Public-route access (pre-login)

The three info pages must be readable **before** login / guest entry / beta
approval. A small, explicit allowlist (`lib/public-paths.ts`,
`PUBLIC_INFO_PATHS` — no wildcards) lets **only** `/privacy`, `/terms`,
`/ai-disclaimer` render without the pre-login overlays:

- `BetaAuthGate` — skips the access overlay for these paths.
- `WelcomeGate` — skips the first-visit intro for these paths.
- `BetaWelcomeNotice` — steps aside on these paths (still reappears on app
  routes until acknowledged) so its own privacy/terms links work.

This grants **no app access**: it creates no Supabase session, no guest session,
and no beta access request, and exposes no app/admin routes. Every other route
stays gated exactly as before.

## Intentionally careful claims

- Storage is described as "currently / mainly / לפי מצב המערכת הנוכחי" — not
  permanent guarantees.
- Food photos: "not stored **intentionally**" + an explicit statement that we
  **cannot** promise an absolute "never stored anywhere by any third party".
- No GDPR / Israeli-law compliance claims (the app has not been legally
  reviewed).
- AI output is always "הערכה בלבד" / "טיוטה לעריכה" / "המשתמש מאשר לפני שמירה",
  never presented as accurate or as medical/nutrition advice.
- Soft wording throughout: "אנחנו משתדלים", "המערכת בנויה כך ש…".

## Unchanged

No schemas, `localStorage` keys, Supabase tables, auth/approval logic, guest
behaviour, admin behaviour, backup behaviour, or nutrition-logging behaviour
were changed. No new packages, no new env vars, no `NEXT_PUBLIC` AI keys. The
only gate code touched is the additive public-path allowlist described above.

## Remaining for future legal review

- These pages are explanatory, not legally vetted — a qualified review is still
  needed before any public/production launch.
- If/when cloud sync, third-party AI providers, or analytics are added, the
  privacy page must be revisited (data leaves the device).
- Consider a "last updated" date and versioning once content stabilises.
