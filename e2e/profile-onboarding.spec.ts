import { test, expect, type Page } from "@playwright/test";

// QA for Personal Profile Onboarding V2 — the optional, one-time first-entry
// prompt (docs/PERSONAL_PROFILE_V1.md, V2 section). Runs against the :3939 server
// (beta gate bypassed via NEXT_PUBLIC_BETA_DISABLE_GATE=1). Under that seam the
// "access granted" signal is the local guest session, so we seed it alongside the
// welcome + beta-welcome flags to put the app in the post-gate state where the
// prompt is allowed to appear. The prompt is never a gate: it never blocks the
// app, appears only after the welcome flow, and never on public info pages.

const PROMPT_TITLE = "נכיר אותך כדי להתאים את החוויה?";
const DISMISS_KEY = "yfos:profile-onboarding-dismissed:v1";

// Put the app in the "fully entered, no profile yet, not dismissed" state.
async function seedEntered(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
      // Under the test gate-bypass seam, an active guest session is what marks
      // the user as "let into the app" (lib/app-access.ts).
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

test("'לא עכשיו' dismisses the prompt and it does not return on reload", async ({
  page,
}) => {
  await seedEntered(page);
  await page.goto("/");
  await page.getByRole("button", { name: "לא עכשיו" }).click();
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
  // The dismissal is persisted locally.
  const flag = await page.evaluate((key) => localStorage.getItem(key), DISMISS_KEY);
  expect(flag).toBe("1");
  // It stays gone after a reload.
  await page.reload();
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
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
