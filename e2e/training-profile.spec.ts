import { test, expect, type Page } from "@playwright/test";

// QA for the Personal Training Profile (docs/PERSONAL_PROFILE_V1.md). As of V3 the
// onboarding is a step-by-step WIZARD: an intro, one question per screen with
// next/back + a progress indicator, and a final summary/confirm before saving.
// Runs against the :3939 server (beta gate bypassed via
// NEXT_PUBLIC_BETA_DISABLE_GATE=1). The profile is localStorage-only under
// `yfos:personal-profile:v1`; we seed the welcome flags so the screen is reachable
// without the gates, and assert: intro, one-question-at-a-time + next/back,
// complete + save → summary, optional fields, edit, skip, reset, and the
// More/Workouts entry points.

async function seedBase(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      // Mark the beta welcome seen for this session so no overlay covers the page.
      sessionStorage.setItem("yfos:beta-welcome-seen-session:v1", "1");
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

// Click "הבא" / "לסיכום" until the wizard reaches the summary (the save button).
async function advanceToSummary(page: Page) {
  for (let i = 0; i < 15; i++) {
    if (await page.getByRole("button", { name: "שמור פרופיל" }).count()) return;
    const next = page.getByRole("button", { name: "הבא", exact: true });
    const toSummary = page.getByRole("button", { name: "לסיכום" });
    if (await next.count()) await next.click();
    else if (await toSummary.count()) await toSummary.click();
    else break;
  }
}

test("the profile page shows the header and the wizard intro when none is saved", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await expect(
    page.getByRole("heading", { name: "פרופיל אימון אישי" }),
  ).toBeVisible();
  // Intro step — a clear start CTA and an optional skip, not a long form.
  await expect(page.getByRole("button", { name: "התחל" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "דלג בינתיים" }),
  ).toBeVisible();
  // The first question is not shown until the user starts.
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toHaveCount(0);
});

test("the wizard shows one question at a time with working next/back", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();

  // Step 1 — goal only; the progress indicator shows the position.
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();
  await expect(page.getByText("שלב 1 מתוך 11")).toBeVisible();
  // The next question is NOT on screen — one focused decision at a time.
  await expect(page.getByText("איפה אתה מתאמן בדרך כלל?")).toHaveCount(0);

  await page.getByRole("button", { name: "לבנות מסת שריר" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();

  // Step 2 — location; the goal question is gone.
  await expect(page.getByText("איפה אתה מתאמן בדרך כלל?")).toBeVisible();
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toHaveCount(0);

  // Back returns to the goal step with the previous selection preserved.
  await page.getByRole("button", { name: "חזור", exact: true }).click();
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "לבנות מסת שריר" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("a user can complete the wizard and save, then see the summary", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();

  await page.getByRole("button", { name: "לבנות מסת שריר" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "בית", exact: true }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "4 פעמים" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  // Duration step — left unanswered (every step is optional).
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "מתחיל" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();

  // Equipment step — multi-select keeps two options selected together.
  const weights = page.getByRole("button", { name: "משקולות" });
  const bands = page.getByRole("button", { name: "גומיות" });
  await weights.click();
  await bands.click();
  await expect(weights).toHaveAttribute("aria-pressed", "true");
  await expect(bands).toHaveAttribute("aria-pressed", "true");

  await advanceToSummary(page);

  // The confirm step summarises the answers before saving.
  await expect(page.getByText("סיכום הפרופיל")).toBeVisible();
  await page.getByRole("button", { name: "שמור פרופיל" }).click();

  // Saved summary appears with the chosen values.
  await expect(page.getByText("הפרופיל נשמר במכשיר")).toBeVisible();
  await expect(page.getByText("לבנות מסת שריר")).toBeVisible();
  await expect(page.getByText("משקולות · גומיות")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "ערוך פרופיל" }),
  ).toBeVisible();
  // Empty optional fields never render a "התאמה אישית" summary section.
  await expect(page.getByText("התאמה אישית")).toHaveCount(0);
});

test("optional personalization fields can be saved and shown in the summary", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();

  // A core answer, then walk to the optional personalization step (index 6).
  await page.getByRole("button", { name: "להתחזק" }).click();
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "הבא", exact: true }).click();
  }
  await expect(page.getByText("התאמה אישית — אופציונלי")).toBeVisible();

  await page.getByRole("button", { name: "מעדיף/ה לא לענות" }).click();
  await page.locator("#profile-age").fill("30");
  await page.locator("#profile-height").fill("180");
  await page.locator("#profile-weight").fill("78");
  await page.getByRole("button", { name: "הבא", exact: true }).click();

  await page.getByRole("button", { name: "מאוזן" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "תכנית פשוטה וברורה" }).click();

  await advanceToSummary(page);
  await page.getByRole("button", { name: "שמור פרופיל" }).click();

  // The optional personalization summary section appears with the filled values.
  await expect(page.getByText("התאמה אישית")).toBeVisible();
  await expect(page.getByText("מעדיף/ה לא לענות")).toBeVisible();
  await expect(page.getByText("180 ס״מ")).toBeVisible();
  await expect(page.getByText("78 ק״ג")).toBeVisible();
  await expect(page.getByText("מאוזן")).toBeVisible();
  await expect(page.getByText("תכנית פשוטה וברורה")).toBeVisible();
});

test("a saved profile shows the summary and can be edited via the wizard", async ({
  page,
}) => {
  await seedBase(page);
  await seedProfile(page);
  await page.goto("/training-profile");

  await expect(page.getByText("הפרופיל נשמר במכשיר")).toBeVisible();
  await expect(page.getByText("ברך רגישה")).toBeVisible();

  // Edit opens the wizard directly at the first question, pre-filled.
  await page.getByRole("button", { name: "ערוך פרופיל" }).click();
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "להתחזק" }),
  ).toHaveAttribute("aria-pressed", "true");

  // Change the goal, walk to the summary, and save → the change is reflected.
  await page.getByRole("button", { name: "לשפר טכניקה" }).click();
  await advanceToSummary(page);
  await page.getByRole("button", { name: "שמור פרופיל" }).click();
  await expect(page.getByText("לשפר טכניקה")).toBeVisible();
});

test("skipping from the intro returns to Today without breaking the app", async ({
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

test("an existing profile can be reset with confirmation", async ({ page }) => {
  await seedBase(page);
  await seedProfile(page);
  await page.goto("/training-profile");

  await page.getByRole("button", { name: "אפס פרופיל" }).click();
  await expect(page.getByText("לאפס את הפרופיל?")).toBeVisible();
  // Confirm inside the dialog (the quiet trigger shares the same label).
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "אפס פרופיל" })
    .click();

  // Profile cleared → the wizard intro returns.
  await expect(page.getByRole("button", { name: "התחל" })).toBeVisible();
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
