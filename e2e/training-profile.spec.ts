import { test, expect, type Page } from "@playwright/test";

// QA for Personal Profile V1 — the optional, editable personal training profile
// (docs/PERSONAL_PROFILE_V1.md). Runs against the :3939 server (beta gate
// bypassed via NEXT_PUBLIC_BETA_DISABLE_GATE=1). The profile is localStorage-only
// under `yfos:personal-profile:v1`; we seed the welcome flags so the screen is
// reachable without the gates, and assert: create flow (select goal/location/
// frequency/experience/equipment multi-select), save → summary, edit, skip
// without breaking the app, plus the More + Workouts entry points.

async function seedBase(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
    } catch {
      /* ignore */
    }
  });
}

// Seed an already-saved profile so the summary/edit states can be exercised.
async function seedProfile(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "yfos:personal-profile:v1",
        JSON.stringify({
          goal: "להתחזק",
          location: "חדר כושר",
          weeklyFrequency: "3 פעמים",
          experience: "בינוני",
          workoutDuration: "45–60 דקות",
          equipment: ["משקולות", "מכונות"],
          notes: "ברך רגישה",
          updatedAt: "2026-06-01T08:00:00.000Z",
        }),
      );
    } catch {
      /* ignore */
    }
  });
}

test("the profile page renders the header and the form when none is saved", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await expect(
    page.getByRole("heading", { name: "פרופיל אימון אישי" }),
  ).toBeVisible();
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();
  // Optional → a skip path is offered and the app is not gated by it.
  await expect(
    page.getByRole("button", { name: "דלג בינתיים" }),
  ).toBeVisible();
});

test("a user can fill the profile and save it, then see the summary", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");

  // Single-selects across goal / location / frequency / experience.
  await page.getByRole("button", { name: "לבנות מסת שריר" }).click();
  await page.getByRole("button", { name: "בית", exact: true }).click();
  await page.getByRole("button", { name: "4 פעמים" }).click();
  await page.getByRole("button", { name: "מתחיל" }).click();

  // Equipment multi-select — two options stay selected together.
  const weights = page.getByRole("button", { name: "משקולות" });
  const bands = page.getByRole("button", { name: "גומיות" });
  await weights.click();
  await bands.click();
  await expect(weights).toHaveAttribute("aria-pressed", "true");
  await expect(bands).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "שמור פרופיל" }).click();

  // Saved summary appears with the chosen values.
  await expect(page.getByText("סיכום הפרופיל")).toBeVisible();
  await expect(page.getByText("לבנות מסת שריר")).toBeVisible();
  await expect(page.getByText("משקולות · גומיות")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "ערוך פרופיל" }),
  ).toBeVisible();
  // Empty optional fields never render a "התאמה אישית" summary section — so they
  // never read as missing/required.
  await expect(page.getByText("התאמה אישית")).toHaveCount(0);
});

test("optional personalization fields can be saved and shown in the summary", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");

  // A core answer plus the optional V2 fields.
  await page.getByRole("button", { name: "להתחזק" }).click();
  await page.getByRole("button", { name: "מעדיף/ה לא לענות" }).click();
  await page.locator("#profile-age").fill("30");
  await page.locator("#profile-height").fill("180");
  await page.locator("#profile-weight").fill("78");
  await page.getByRole("button", { name: "מאוזן" }).click();
  await page.getByRole("button", { name: "תכנית פשוטה וברורה" }).click();

  await page.getByRole("button", { name: "שמור פרופיל" }).click();

  // The optional personalization summary section appears with the filled values.
  await expect(page.getByText("התאמה אישית")).toBeVisible();
  await expect(page.getByText("מעדיף/ה לא לענות")).toBeVisible();
  await expect(page.getByText("180 ס״מ")).toBeVisible();
  await expect(page.getByText("78 ק״ג")).toBeVisible();
  await expect(page.getByText("מאוזן")).toBeVisible();
  await expect(page.getByText("תכנית פשוטה וברורה")).toBeVisible();
});

test("a saved profile shows the summary and can be edited", async ({ page }) => {
  await seedBase(page);
  await seedProfile(page);
  await page.goto("/training-profile");

  await expect(page.getByText("סיכום הפרופיל")).toBeVisible();
  await expect(page.getByText("ברך רגישה")).toBeVisible();

  // Edit opens the form pre-filled (the saved goal reads as selected).
  await page.getByRole("button", { name: "ערוך פרופיל" }).click();
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "להתחזק" }),
  ).toHaveAttribute("aria-pressed", "true");

  // Change the goal and save → summary reflects it.
  await page.getByRole("button", { name: "לשפר טכניקה" }).click();
  await page.getByRole("button", { name: "שמור פרופיל" }).click();
  await expect(page.getByText("לשפר טכניקה")).toBeVisible();
});

test("skipping the profile returns to Today without breaking the app", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "דלג בינתיים" }).click();
  await expect(page).toHaveURL("http://localhost:3939/");
  // Today still works — its quick-start action is present.
  await expect(
    page.getByRole("heading", { name: "פעולות מהירות" }),
  ).toBeVisible();
});

test("the More hub links to the personal training profile", async ({ page }) => {
  await seedBase(page);
  await page.goto("/more");
  const link = page.getByRole("link", { name: /פרופיל אימון אישי/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/training-profile");
});

test("the Workouts screen links to the personal training profile", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/workouts");
  const link = page.getByRole("link", {
    name: /התאם את חוויית האימונים/,
  });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/training-profile");
});
