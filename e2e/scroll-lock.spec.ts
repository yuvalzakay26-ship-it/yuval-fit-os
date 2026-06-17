import { test, expect, type Page } from "@playwright/test";

// QA for the background scroll-lock cleanup (lib/use-body-scroll-lock.ts). The
// app's full-screen overlays (beta welcome notice, profile onboarding prompt,
// the training-profile wizard's host page) used to each capture/restore
// document.body.style.overflow on their own; when two overlapped, the body
// could be left permanently at overflow:hidden — tapping and routing still
// worked, but nothing scrolled. These tests pin the regression: after every
// onboarding exit the body must be scrollable again, and a real page must
// actually scroll on a small phone.
//
// Runs against the :3939 server (beta gate bypassed via
// NEXT_PUBLIC_BETA_DISABLE_GATE=1). Seeding mirrors profile-onboarding.spec.ts.

const PROMPT_TITLE = "נכיר אותך כדי להתאים את החוויה?";
const BETA_WELCOME_SESSION_KEY = "yfos:beta-welcome-seen-session:v1";

// Put the app in the "fully entered, beta welcome already seen THIS session, no
// profile yet, not dismissed" state — the profile prompt is the surface shown.
async function seedEntered(page: Page) {
  await page.addInitScript(
    ({ betaKey }) => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        sessionStorage.setItem(betaKey, "1");
        localStorage.setItem("yuval-fit-os:guest-session:v1", "1");
      } catch {
        /* ignore */
      }
    },
    { betaKey: BETA_WELCOME_SESSION_KEY },
  );
}

// The precise signal: with no overlay open the shared lock must have restored
// the body to a non-hidden overflow so the page can scroll again.
async function expectBodyScrollable(page: Page) {
  const overflow = await page.evaluate(() => document.body.style.overflow);
  expect(overflow).not.toBe("hidden");
}

// Walk the wizard end to end and save, leaving the saved summary on screen.
async function completeAndSaveWizard(page: Page) {
  await page.getByRole("button", { name: "התחל" }).click();
  await page.getByRole("button", { name: "לבנות מסת שריר" }).click(); // goal
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "בית", exact: true }).click(); // location
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "4 פעמים" }).click(); // frequency
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "45–60 דקות" }).click(); // duration
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "מתחיל" }).click(); // experience
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "משקולות" }).click(); // equipment (≥1)
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click(); // personal (optional)
  await page.getByRole("button", { name: "מאוזן" }).click(); // training preference
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "המלצה לפי המטרה שלי" }).click(); // guidance

  // Advance to the summary (notes is optional), then save.
  for (let i = 0; i < 15; i++) {
    if (await page.getByRole("button", { name: "שמור פרופיל" }).count()) break;
    const next = page.getByRole("button", { name: "הבא", exact: true });
    const toSummary = page.getByRole("button", { name: "לסיכום" });
    if (await next.count()) {
      if (await next.isDisabled()) break;
      await next.click();
    } else if (await toSummary.count()) {
      await toSummary.click();
    } else break;
  }
  await page.getByRole("button", { name: "שמור פרופיל" }).click();
  await expect(page.getByText("הפרופיל נשמר במכשיר")).toBeVisible();
}

test("closing the profile prompt with 'לא עכשיו' restores body scroll", async ({
  page,
}) => {
  await seedEntered(page);
  await page.goto("/");
  // While the prompt is up the body is locked.
  await expect(page.getByText(PROMPT_TITLE)).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.getByRole("button", { name: "לא עכשיו" }).click();
  await expect(page.getByText(PROMPT_TITLE)).toHaveCount(0);
  // ...and released the moment it closes.
  await expectBodyScrollable(page);
});

test("'בוא נתחיל' navigates to the profile page with scroll restored", async ({
  page,
}) => {
  await seedEntered(page);
  await page.goto("/");
  await expect(page.getByText(PROMPT_TITLE)).toBeVisible();

  await page.getByRole("button", { name: "בוא נתחיל" }).click();
  await expect(page).toHaveURL("http://localhost:3939/training-profile");
  await expect(
    page.getByRole("heading", { name: "פרופיל אימון אישי" }),
  ).toBeVisible();
  // The prompt dismissed and routed away in one action — no lock left behind.
  await expectBodyScrollable(page);
});

test("completing the wizard and navigating to a long page leaves scroll working", async ({
  page,
}) => {
  await seedEntered(page);
  await page.goto("/");
  await page.getByRole("button", { name: "בוא נתחיל" }).click();
  await expect(page).toHaveURL("http://localhost:3939/training-profile");

  await completeAndSaveWizard(page);
  await expectBodyScrollable(page);

  // Navigate to a real app page and confirm the body is not wedged.
  await page.goto("/nutrition");
  await expectBodyScrollable(page);

  // And it genuinely scrolls when content exceeds the viewport. The app uses
  // CSS scroll-behavior: smooth, so force an instant jump and let it settle
  // before reading scrollY.
  await page.evaluate(() =>
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "instant" as ScrollBehavior,
    }),
  );
  await page.waitForTimeout(150);
  const scrolled = await page.evaluate(
    () =>
      // Either the page actually scrolled, or it simply fits the viewport.
      window.scrollY > 0 ||
      document.documentElement.scrollHeight <= window.innerHeight,
  );
  expect(scrolled).toBe(true);
});

test("scrolling still works after navigating between pages post-completion", async ({
  page,
}) => {
  await seedEntered(page);
  await page.goto("/");
  await page.getByRole("button", { name: "בוא נתחיל" }).click();
  await completeAndSaveWizard(page);

  for (const path of ["/", "/workouts", "/more", "/nutrition"]) {
    await page.goto(path);
    await expectBodyScrollable(page);
  }
});
