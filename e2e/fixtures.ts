import { expect, type Page } from "@playwright/test";

// Shared E2E setup helpers (System Optimization Phase 2B). These extract the
// high-confidence, byte-identical setup that was copy-pasted across the suite —
// welcome/beta/guest seeding, the water-day seed, the wizard "advance to summary"
// loop, and the today-date string. Each helper is deliberately small, explicit,
// and named after the product state it sets up, so a spec still reads like the
// behaviour it pins. No runtime app code, schemas, storage keys, copy, or
// assertions are changed by this file — it only relocates duplicated test setup.
//
// All seeds run BEFORE app scripts (page.addInitScript), matching the originals.
// Specs that are *testing* a given key keep their own local constant for the
// assertion; the helpers only reproduce the exact literals the originals used.

/**
 * Today's date as YYYY-MM-DD in local time — the key format the app stores its
 * per-day logs (food / water / supplements / gym) under. Was copied verbatim
 * across the celebration and Today specs.
 */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Mark the one-time first-visit welcome and the legacy persistent beta-welcome
 * flag as already seen, so neither overlay intercepts clicks. For specs that are
 * NOT exercising onboarding and just need to land on a working app surface. No
 * guest session is seeded, so under the gate-bypass seam (`:3939`/`:3940`,
 * `NEXT_PUBLIC_BETA_DISABLE_GATE=1`) the beta welcome and profile prompt never
 * mount anyway — only the first-visit welcome needs clearing.
 */
export async function seedWelcomeSeen(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
    } catch {
      /* ignore */
    }
  });
}

/**
 * Seed a granted (guest) user who has cleared the first-visit welcome: under the
 * gate-bypass seam an active guest session is what marks the user as "let into the
 * app" (lib/app-access.ts). The beta-welcome SESSION flag is left clean, so the
 * beta welcome notice (step one of app entry) is the surface under test.
 * `withLegacyBetaFlag` additionally sets the OLD persistent localStorage key to
 * prove it no longer suppresses the notice.
 */
export async function seedGranted(
  page: Page,
  { withLegacyBetaFlag = false }: { withLegacyBetaFlag?: boolean } = {},
) {
  await page.addInitScript((useLegacy) => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yuval-fit-os:guest-session:v1", "1");
      if (useLegacy) localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
    } catch {
      /* ignore */
    }
  }, withLegacyBetaFlag);
}

/**
 * Like {@link seedGranted} but also marks the beta welcome as seen for THIS
 * session (sessionStorage), so the app is in the "fully entered, beta welcome
 * already done this session, no profile yet" state — i.e. the profile onboarding
 * prompt (step two of app entry) is the surface under test.
 */
export async function seedGrantedEntered(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:beta-welcome-seen-session:v1", "1");
      localStorage.setItem("yuval-fit-os:guest-session:v1", "1");
    } catch {
      /* ignore */
    }
  });
}

/**
 * Seed today's water log + a clean goal in localStorage before load. The seeded
 * total maps directly to a percentage against the goal (default 2000ml). Was
 * byte-identical in water-goal-states and water-reset.
 */
export async function seedWater(page: Page, totalMl: number, goalMl = 2000) {
  await page.addInitScript(
    ({ goal, total, date }) => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
        localStorage.setItem(
          "yfos:settings",
          JSON.stringify({ waterGoalMl: goal }),
        );
        localStorage.setItem(
          "yfos:water-logs:v1",
          JSON.stringify([
            {
              date,
              totalMl: total,
              entries: [
                {
                  id: "seed-1",
                  amountMl: total,
                  createdAt: new Date(`${date}T08:00:00.000Z`).toISOString(),
                },
              ],
            },
          ]),
        );
      } catch {
        /* ignore */
      }
    },
    { goal: goalMl, total: totalMl, date: todayISO() },
  );
}

/**
 * Click "הבא" / "לסיכום" until the training-profile wizard reaches the summary
 * (the "שמור פרופיל" save button), or stops at a required step whose advance
 * button is still disabled (a missing answer). Bounded so a stuck wizard fails
 * loudly rather than hanging. Shared by training-profile and scroll-lock, which
 * both walked this same loop.
 */
export async function advanceWizardToSummary(page: Page) {
  for (let i = 0; i < 15; i++) {
    if (await page.getByRole("button", { name: "שמור פרופיל" }).count()) return;
    const next = page.getByRole("button", { name: "הבא", exact: true });
    const toSummary = page.getByRole("button", { name: "לסיכום" });
    if (await next.count()) {
      if (await next.isDisabled()) return; // gated on a required answer
      await next.click();
    } else if (await toSummary.count()) {
      if (await toSummary.isDisabled()) return;
      await toSummary.click();
    } else break;
  }
}

/**
 * Wait until the page is either genuinely scrolled past the top or simply fits
 * the viewport — a deterministic replacement for a fixed `waitForTimeout` after
 * an instant scroll-to-bottom (the app uses CSS `scroll-behavior: smooth`, so the
 * scroll position settles asynchronously). Polls instead of sleeping a fixed
 * duration.
 */
export async function expectScrolledOrFits(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.scrollY > 0 ||
          document.documentElement.scrollHeight <= window.innerHeight,
      ),
    )
    .toBe(true);
}
