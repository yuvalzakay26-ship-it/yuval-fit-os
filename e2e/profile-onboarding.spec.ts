import { test, expect, type Page } from "@playwright/test";

// QA for Personal Profile Onboarding V2 — the optional profile prompt that is now
// the SECOND step of every app entry, shown right after the beta welcome
// (docs/PERSONAL_PROFILE_V1.md, V2 section). Runs against the :3939 server (beta
// gate bypassed via NEXT_PUBLIC_BETA_DISABLE_GATE=1). Under that seam the "access
// granted" signal is the local guest session, so we seed it alongside the welcome
// flag to put the app in the post-gate state where the prompt is allowed to
// appear. The prompt is never a gate: it never blocks the app, appears only after
// the beta welcome is done for the session, never alongside it, and never on
// public info pages.

const PROMPT_TITLE = "נכיר אותך כדי להתאים את החוויה?";
// Dismissal is now SESSION-level (sessionStorage), not a permanent device flag.
const DISMISS_KEY = "yfos:profile-onboarding-dismissed-session:v1";
const BETA_WELCOME_SESSION_KEY = "yfos:beta-welcome-seen-session:v1";
const BETA_WELCOME_GATE = "[data-beta-welcome-gate]";

// Put the app in the "fully entered, beta welcome already seen THIS session, no
// profile yet, not dismissed" state — i.e. the profile prompt is the surface
// under test.
async function seedEntered(page: Page) {
  await page.addInitScript(
    ({ betaKey }) => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        // Beta welcome is per-session now: mark it seen for THIS session so the
        // profile prompt (step two) is what shows, not the beta welcome (step one).
        sessionStorage.setItem(betaKey, "1");
        // Under the test gate-bypass seam, an active guest session is what marks
        // the user as "let into the app" (lib/app-access.ts).
        localStorage.setItem("yuval-fit-os:guest-session:v1", "1");
      } catch {
        /* ignore */
      }
    },
    { betaKey: BETA_WELCOME_SESSION_KEY },
  );
}

// Same as seedEntered but WITHOUT marking the beta welcome seen — so the beta
// welcome (step one) is still open and the profile prompt must stay hidden.
async function seedEnteredBetaOpen(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yuval-fit-os:guest-session:v1", "1");
    } catch {
      /* ignore */
    }
  });
}

async function seedProfile(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "yfos:personal-profile:v1",
        JSON.stringify({ goal: "להתחזק", updatedAt: "2026-06-01T08:00:00.000Z" }),
      );
    } catch {
      /* ignore */
    }
  });
}

test("first entry without a profile shows the optional onboarding prompt", async ({
  page,
}) => {
  await seedEntered(page);
  await page.goto("/");
  await expect(page.getByText(PROMPT_TITLE)).toBeVisible();
  await expect(page.getByRole("button", { name: "בוא נתחיל" })).toBeVisible();
  await expect(page.getByRole("button", { name: "לא עכשיו" })).toBeVisible();
  // Underlying app is still mounted (not blocked) — Today is there behind it.
  await expect(
    page.getByRole("heading", { name: "פעולות מהירות" }),
  ).toBeVisible();
});

test("the profile prompt never shows while the beta welcome is still open", async ({
  page,
}) => {
  await seedEnteredBetaOpen(page);
  await page.goto("/");
  // The beta welcome (step one) is up...
  await expect(page.locator(BETA_WELCOME_GATE)).toBeVisible();
  // ...and the profile prompt (step two) must not stack on top of it.
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
  // After acknowledging the beta welcome, the profile prompt becomes the surface.
  await page.getByRole("button", { name: "הבנתי, המשך למערכת" }).click();
  await expect(page.getByText(PROMPT_TITLE)).toBeVisible();
});

test("'לא עכשיו' dismisses the prompt for the session (no return on reload)", async ({
  page,
}) => {
  await seedEntered(page);
  await page.goto("/");
  await page.getByRole("button", { name: "לא עכשיו" }).click();
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
  // The dismissal is remembered for this session (sessionStorage, not a permanent
  // device flag).
  const flag = await page.evaluate(
    (key) => sessionStorage.getItem(key),
    DISMISS_KEY,
  );
  expect(flag).toBe("1");
  // It stays gone after a reload (the session, and its sessionStorage, survive).
  await page.reload();
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
});

test("a fresh session can show the prompt again after a previous 'לא עכשיו'", async ({
  browser,
}) => {
  // Session one: dismiss the prompt.
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await seedEntered(page1);
  await page1.goto("/");
  await page1.getByRole("button", { name: "לא עכשיו" }).click();
  await expect(page1.getByText(PROMPT_TITLE)).toHaveCount(0);
  await ctx1.close();

  // Session two (a fresh context = a new app entry / session): the prompt may
  // appear again because the dismissal was only session-level and no profile
  // exists yet.
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await seedEntered(page2);
  await page2.goto("/");
  await expect(page2.getByText(PROMPT_TITLE)).toBeVisible();
  await ctx2.close();
});

test("'בוא נתחיל' opens the personal training profile", async ({ page }) => {
  await seedEntered(page);
  await page.goto("/");
  await page.getByRole("button", { name: "בוא נתחיל" }).click();
  await expect(page).toHaveURL("http://localhost:3939/training-profile");
  await expect(
    page.getByRole("heading", { name: "פרופיל אימון אישי" }),
  ).toBeVisible();
  // The prompt does not also overlay the profile page.
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
});

test("the prompt never appears on public info pages", async ({ page }) => {
  await seedEntered(page);
  await page.goto("/privacy");
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
});

test("the prompt does not appear once a profile already exists", async ({
  page,
}) => {
  await seedEntered(page);
  await seedProfile(page);
  await page.goto("/");
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
});
