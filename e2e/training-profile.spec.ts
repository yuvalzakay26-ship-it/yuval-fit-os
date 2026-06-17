import { test, expect, type Page } from "@playwright/test";
import { advanceWizardToSummary as advanceToSummary } from "./fixtures";

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

// Answer all required core steps from the goal step (0) up to and including the
// equipment step (5), leaving the wizard on the optional personal step (6). Used
// by tests that need a valid core profile without re-typing every selection.
async function answerRequiredCoreToPersonal(page: Page) {
  await page.getByRole("button", { name: "להתחזק" }).click(); // 0 goal
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "חדר כושר" }).click(); // 1 location
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "3 פעמים" }).click(); // 2 frequency
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "45–60 דקות" }).click(); // 3 duration
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "בינוני" }).click(); // 4 experience
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "משקולות" }).click(); // 5 equipment (≥1)
  await page.getByRole("button", { name: "הבא", exact: true }).click();
}

// advanceToSummary (shared advanceWizardToSummary fixture): click "הבא" / "לסיכום"
// until the wizard reaches the summary (the save button), or stops at a required
// step whose advance button is still disabled (a missing answer).

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

test("a required core step does not advance until an answer is selected", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();

  // Goal is a required core step: "הבא" is disabled and a calm hint is shown.
  const next = page.getByRole("button", { name: "הבא", exact: true });
  await expect(next).toBeDisabled();
  await expect(page.getByText("בחר תשובה כדי להמשיך")).toBeVisible();
  // Still on the goal step — nothing advanced.
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();

  // Choosing an answer enables "הבא" and clears the hint, then advances.
  await page.getByRole("button", { name: "להתחזק" }).click();
  await expect(next).toBeEnabled();
  await expect(page.getByText("בחר תשובה כדי להמשיך")).toHaveCount(0);
  await next.click();
  await expect(page.getByText("איפה אתה מתאמן בדרך כלל?")).toBeVisible();
  // The next required step (location) is again gated until answered.
  await expect(
    page.getByRole("button", { name: "הבא", exact: true }),
  ).toBeDisabled();
});

test("the equipment step requires at least one option, and 'לא בטוח' counts", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();
  await answerRequiredCoreToPersonal(page);

  // Walk back from the personal step to the equipment step (index 5).
  await page.getByRole("button", { name: "חזור", exact: true }).click();
  await expect(page.getByText("איזה ציוד זמין לך?")).toBeVisible();

  // Deselect the seeded "משקולות" → no equipment → "הבא" is gated again.
  await page.getByRole("button", { name: "משקולות" }).click();
  await expect(
    page.getByRole("button", { name: "הבא", exact: true }),
  ).toBeDisabled();

  // "לא בטוח" is a valid answer and unblocks the step.
  await page.getByRole("button", { name: "לא בטוח", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "הבא", exact: true }),
  ).toBeEnabled();
});

test("optional personal and notes steps can be passed without filling anything", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();
  await answerRequiredCoreToPersonal(page);

  // Personal adaptation (index 6) is optional: a reassuring hint, "הבא" enabled.
  await expect(page.getByText("התאמה אישית — אופציונלי")).toBeVisible();
  await expect(
    page.getByText("השלב הזה אופציונלי ואפשר להמשיך גם בלי למלא."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "הבא", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "הבא", exact: true }).click();

  // Training preference + guidance style are required, then notes is optional.
  await page.getByRole("button", { name: "מאוזן" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "המלצה לפי המטרה שלי" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();

  // Notes (index 9) is optional and reaches the summary while empty.
  await expect(page.getByText("יש משהו שכדאי לקחת בחשבון?")).toBeVisible();
  await page.getByRole("button", { name: "לסיכום" }).click();
  await expect(page.getByText("סיכום הפרופיל")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "שמור פרופיל" }),
  ).toBeVisible();
});

test("a user can complete the wizard and save, then see the summary", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();

  // Goal (required)
  await page.getByRole("button", { name: "לבנות מסת שריר" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  // Location (required)
  await page.getByRole("button", { name: "בית", exact: true }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  // Frequency (required)
  await page.getByRole("button", { name: "4 פעמים" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  // Duration (required) — must now be answered before advancing.
  await page.getByRole("button", { name: "45–60 דקות" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  // Experience (required)
  await page.getByRole("button", { name: "מתחיל" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();

  // Equipment step (required, multi-select) — keeps two options selected.
  const weights = page.getByRole("button", { name: "משקולות" });
  const bands = page.getByRole("button", { name: "גומיות" });
  await weights.click();
  await bands.click();
  await expect(weights).toHaveAttribute("aria-pressed", "true");
  await expect(bands).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "הבא", exact: true }).click();

  // Personal adaptation (optional) — passed empty.
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  // Training preference (required)
  await page.getByRole("button", { name: "מאוזן" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  // Guidance style (required)
  await page.getByRole("button", { name: "המלצה לפי המטרה שלי" }).click();

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
});

test("optional personalization fields can be saved and shown in the summary", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();

  // Answer every required core step, then reach the optional personal step (6).
  await answerRequiredCoreToPersonal(page);
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

  // Change the goal, then walk forward. The seeded profile predates the
  // now-required style/guidance steps, so the wizard guides the user through
  // them before the summary is reachable.
  await page.getByRole("button", { name: "לשפר טכניקה" }).click();
  await advanceToSummary(page);
  // Still not at the summary — a required answer (training preference) is missing.
  await expect(page.getByText("איזה סגנון אימון מתאים לך יותר?")).toBeVisible();
  await page.getByRole("button", { name: "מאוזן" }).click();
  await page.getByRole("button", { name: "הבא", exact: true }).click();
  await page.getByRole("button", { name: "המלצה לפי המטרה שלי" }).click();
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
