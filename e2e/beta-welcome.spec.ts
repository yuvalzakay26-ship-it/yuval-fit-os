import { test, expect, type Page, type BrowserContext } from "@playwright/test";

// QA for the Beta Welcome notice as the FIRST step of every app entry
// (docs/BETA_WELCOME_NOTICE.md). Runs against the :3939 server (beta gate bypassed
// via NEXT_PUBLIC_BETA_DISABLE_GATE=1). Under that seam the "access granted"
// signal is the local guest session, so we seed it to reach the post-gate state.
//
// The product rule changed: the beta welcome is now gated PER SESSION
// (sessionStorage), not once-per-device-forever. So it greets on every fresh app
// entry — for admins, approved testers, and guests alike — even when the OLD
// persistent localStorage flag is present. It does not re-stack on route
// navigation within a session, and it always shows BEFORE the profile prompt.

const BETA_GATE = "[data-beta-welcome-gate]";
const BETA_TITLE = "ברוכים הבאים ל־Fit OS";
const PROFILE_PROMPT_TITLE = "נכיר אותך כדי להתאים את החוויה?";
const LEGACY_PERSISTENT_KEY = "yfos:beta-welcome-seen:v1";
const SESSION_KEY = "yfos:beta-welcome-seen-session:v1";

// Seed a granted (guest) user who has cleared the first-visit welcome screen, so
// the beta welcome is the surface under test. The beta-welcome SESSION flag is
// left clean so the notice appears. `withLegacyFlag` additionally sets the OLD
// persistent localStorage key to prove it no longer suppresses the notice.
async function seedGranted(page: Page, { withLegacyFlag = false } = {}) {
  await page.addInitScript(
    ({ legacyKey, useLegacy }) => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        localStorage.setItem("yuval-fit-os:guest-session:v1", "1");
        if (useLegacy) localStorage.setItem(legacyKey, "1");
      } catch {
        /* ignore */
      }
    },
    { legacyKey: LEGACY_PERSISTENT_KEY, useLegacy: withLegacyFlag },
  );
}

async function freshGrantedPage(
  context: BrowserContext,
  opts?: { withLegacyFlag?: boolean },
) {
  const page = await context.newPage();
  await seedGranted(page, opts);
  return page;
}

test("a granted user sees the beta welcome on app entry", async ({ page }) => {
  await seedGranted(page);
  await page.goto("/");
  await expect(page.locator(BETA_GATE)).toBeVisible();
  await expect(page.getByText(BETA_TITLE)).toBeVisible();
});

test("the beta welcome shows even when the OLD persistent flag is set", async ({
  page,
}) => {
  // A tester who acknowledged the notice under the previous "once per device,
  // forever" behaviour still gets greeted on their next entry — the legacy
  // localStorage flag is no longer read as a suppressor.
  await seedGranted(page, { withLegacyFlag: true });
  await page.goto("/");
  await expect(page.locator(BETA_GATE)).toBeVisible();
  await expect(page.getByText(BETA_TITLE)).toBeVisible();
});

test("the beta welcome comes BEFORE the profile prompt (no stacking)", async ({
  page,
}) => {
  await seedGranted(page);
  await page.goto("/");
  // Beta welcome up; profile prompt must not be visible yet.
  await expect(page.locator(BETA_GATE)).toBeVisible();
  await expect(page.getByText(PROFILE_PROMPT_TITLE)).toHaveCount(0);
  // Acknowledge → the profile prompt becomes the next step.
  await page.getByRole("button", { name: "הבנתי, המשך למערכת" }).click();
  await expect(page.locator(BETA_GATE)).toHaveCount(0);
  await expect(page.getByText(PROFILE_PROMPT_TITLE)).toBeVisible();
});

test("acknowledging sets the session flag and a reload does not re-show it", async ({
  page,
}) => {
  await seedGranted(page);
  await page.goto("/");
  await page.getByRole("button", { name: "הבנתי, המשך למערכת" }).click();
  await expect(page.locator(BETA_GATE)).toHaveCount(0);
  // Session-level flag set (not the legacy persistent localStorage key).
  const sessionFlag = await page.evaluate(
    (key) => sessionStorage.getItem(key),
    SESSION_KEY,
  );
  expect(sessionFlag).toBe("1");
  // Within the same session a reload keeps it dismissed (no nag on navigation).
  await page.reload();
  await expect(page.locator(BETA_GATE)).toHaveCount(0);
});

test("a fresh session greets again (beta welcome is per app entry)", async ({
  browser,
}) => {
  // Session one: acknowledge.
  const ctx1 = await browser.newContext();
  const page1 = await freshGrantedPage(ctx1);
  await page1.goto("/");
  await page1.getByRole("button", { name: "הבנתי, המשך למערכת" }).click();
  await expect(page1.locator(BETA_GATE)).toHaveCount(0);
  await ctx1.close();

  // Session two (fresh context = new app entry): the notice greets again.
  const ctx2 = await browser.newContext();
  const page2 = await freshGrantedPage(ctx2);
  await page2.goto("/");
  await expect(page2.locator(BETA_GATE)).toBeVisible();
  await ctx2.close();
});

test("public info pages never show the beta welcome or profile prompt", async ({
  page,
}) => {
  await seedGranted(page);
  for (const path of ["/privacy", "/terms", "/ai-disclaimer"]) {
    await page.goto(path);
    await expect(page.locator(BETA_GATE)).toHaveCount(0);
    await expect(page.getByText(PROFILE_PROMPT_TITLE)).toHaveCount(0);
  }
});

test("a non-granted visitor never sees the beta welcome", async ({ page }) => {
  // No guest session seeded → under the bypass seam the user is not "in", so the
  // notice never mounts (mirrors a denied/blocked or still-resolving user).
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/");
  await expect(page.locator(BETA_GATE)).toHaveCount(0);
});
