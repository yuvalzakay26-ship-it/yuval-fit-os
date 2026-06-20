import { test, expect, type Page } from "@playwright/test";
import { advanceWizardToSummary as advanceToSummary } from "./fixtures";

// QA for the Personal Training Profile (docs/PERSONAL_PROFILE_V1.md). The
// onboarding is a step-by-step WIZARD: an intro, one question per screen with
// next/back + a progress indicator, and a final summary/confirm before saving.
// V5 adds two PREMIUM VISUAL steps — a visual gender/adaptation picker (step 2)
// and a visual muscle focus-areas map (step 3) — so the flow now has 13 steps
// (12 questions + summary). Runs against the :3939 server (beta gate bypassed via
// NEXT_PUBLIC_BETA_DISABLE_GATE=1). The profile is localStorage-only under
// `yfos:personal-profile:v1`; we seed the welcome flags so the screen is reachable
// without the gates, and assert: intro, one-question-at-a-time + next/back,
// required gating, the visual gender + focus-area steps (incl. highlight),
// complete + save, optional fields, edit, skip, reset, no overflow, and the
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

// Seed a complete, modern saved profile so the summary/edit states can be
// exercised. Includes the V5 adaptation + focusAreas fields.
async function seedProfile(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "yfos:personal-profile:v1",
        JSON.stringify({
          goal: "להתחזק",
          adaptation: "גבר",
          focusAreas: ["חזה", "גב"],
          location: "חדר כושר",
          weeklyFrequency: "3 פעמים",
          experience: "בינוני",
          workoutDuration: "45–60 דקות",
          equipment: ["משקולות", "מכונות"],
          trainingPreference: "מאוזן",
          guidanceStyle: "המלצה לפי המטרה שלי",
          notes: "ברך רגישה",
          updatedAt: "2026-06-01T08:00:00.000Z",
        }),
      );
    } catch {
      /* ignore */
    }
  });
}

// Seed an OLD profile that predates the now-required V5 fields (no adaptation /
// focusAreas / trainingPreference / guidanceStyle). Used to prove editing guides
// the user through the missing required steps.
async function seedOldProfile(page: Page) {
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
          equipment: ["משקולות"],
          updatedAt: "2026-06-01T08:00:00.000Z",
        }),
      );
    } catch {
      /* ignore */
    }
  });
}

const nextButton = (page: Page) =>
  page.getByRole("button", { name: "הבא", exact: true });

// Answer every required core step from goal (0) through equipment (7), leaving
// the wizard on the training-preference step (8). Walks the visual gender and
// focus-area steps too.
async function answerCoreThroughEquipment(page: Page) {
  await page.getByRole("button", { name: "להתחזק" }).click(); // 0 goal
  await nextButton(page).click();
  await page.getByRole("button", { name: "גבר", exact: true }).click(); // 1 adaptation
  await nextButton(page).click();
  await page.getByRole("button", { name: "חזה", exact: true }).click(); // 2 focusAreas
  await nextButton(page).click();
  await page.getByRole("button", { name: "חדר כושר" }).click(); // 3 location
  await nextButton(page).click();
  await page.getByRole("button", { name: "3 פעמים" }).click(); // 4 frequency
  await nextButton(page).click();
  await page.getByRole("button", { name: "45–60 דקות" }).click(); // 5 duration
  await nextButton(page).click();
  await page.getByRole("button", { name: "בינוני" }).click(); // 6 experience
  await nextButton(page).click();
  await page.getByRole("button", { name: "משקולות" }).click(); // 7 equipment (≥1)
  await nextButton(page).click();
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

  // Step 1 — goal only; the progress indicator shows the position (now 13 steps).
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();
  await expect(page.getByText("שלב 1 מתוך 13")).toBeVisible();
  // The next question (the visual adaptation step) is NOT on screen yet.
  await expect(page.getByText("איך נתאים את החוויה אליך?")).toHaveCount(0);

  await page.getByRole("button", { name: "לבנות מסת שריר" }).click();
  await nextButton(page).click();

  // Step 2 — the visual gender/adaptation step; the goal question is gone.
  await expect(page.getByText("איך נתאים את החוויה אליך?")).toBeVisible();
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
  await expect(nextButton(page)).toBeDisabled();
  await expect(page.getByText("בחר תשובה כדי להמשיך")).toBeVisible();
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();

  // Choosing an answer enables "הבא" and clears the hint, then advances.
  await page.getByRole("button", { name: "להתחזק" }).click();
  await expect(nextButton(page)).toBeEnabled();
  await expect(page.getByText("בחר תשובה כדי להמשיך")).toHaveCount(0);
  await nextButton(page).click();
  // The next required step (the visual adaptation step) is again gated.
  await expect(page.getByText("איך נתאים את החוויה אליך?")).toBeVisible();
  await expect(nextButton(page)).toBeDisabled();
});

test("the visual gender/adaptation step selects and counts as an answer", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();
  await page.getByRole("button", { name: "להתחזק" }).click();
  await nextButton(page).click();

  // On the adaptation step "הבא" is gated until a card is chosen.
  await expect(page.getByText("איך נתאים את החוויה אליך?")).toBeVisible();
  await expect(nextButton(page)).toBeDisabled();

  // Selecting a card highlights it (aria-pressed) and unblocks the step.
  const female = page.getByRole("button", { name: "אישה", exact: true });
  await female.click();
  await expect(female).toHaveAttribute("aria-pressed", "true");
  await expect(nextButton(page)).toBeEnabled();

  // "מעדיף/ה לא לענות" is always available and is also a valid answer.
  const decline = page.getByRole("button", { name: "מעדיף/ה לא לענות" });
  await decline.click();
  await expect(decline).toHaveAttribute("aria-pressed", "true");
  await expect(female).toHaveAttribute("aria-pressed", "false");
  await expect(nextButton(page)).toBeEnabled();
});

test("the visual focus-areas step requires one area and highlights the body map", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();
  await page.getByRole("button", { name: "להתחזק" }).click();
  await nextButton(page).click();
  await page.getByRole("button", { name: "גבר", exact: true }).click();
  await nextButton(page).click();

  // Focus-areas step — required multi-select with a live body map.
  await expect(page.getByText("על אילו שרירים נרצה להתמקד?")).toBeVisible();
  await expect(page.getByTestId("body-focus-figure")).toBeVisible();
  // Nothing selected → no region is highlighted and "הבא" is gated.
  await expect(nextButton(page)).toBeDisabled();
  await expect(
    page.locator('[data-testid="body-focus-figure"] [data-active="true"]'),
  ).toHaveCount(0);

  // Selecting "חזה" highlights at least one region on the map and unblocks.
  await page.getByRole("button", { name: "חזה", exact: true }).click();
  await expect(
    page.locator('[data-testid="body-focus-figure"] [data-active="true"]'),
  ).not.toHaveCount(0);
  await expect(nextButton(page)).toBeEnabled();

  // "גוף מלא" lights up every region (more highlighted groups than a single area).
  await page.getByRole("button", { name: "גוף מלא", exact: true }).click();
  const highlighted = page.locator(
    '[data-testid="body-focus-figure"] [data-active="true"]',
  );
  expect(await highlighted.count()).toBeGreaterThan(2);
});

test("the equipment step requires at least one option, and 'לא בטוח' counts", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();
  await answerCoreThroughEquipment(page);

  // Walk back from the training-preference step to the equipment step.
  await page.getByRole("button", { name: "חזור", exact: true }).click();
  await expect(page.getByText("איזה ציוד זמין לך?")).toBeVisible();

  // Deselect the seeded "משקולות" → no equipment → "הבא" is gated again.
  await page.getByRole("button", { name: "משקולות" }).click();
  await expect(nextButton(page)).toBeDisabled();

  // "לא בטוח" is a valid answer and unblocks the step.
  await page.getByRole("button", { name: "לא בטוח", exact: true }).click();
  await expect(nextButton(page)).toBeEnabled();
});

test("optional personal and notes steps can be passed without filling anything", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/training-profile");
  await page.getByRole("button", { name: "התחל" }).click();
  await answerCoreThroughEquipment(page);

  // Training preference + guidance style are required.
  await page.getByRole("button", { name: "מאוזן" }).click();
  await nextButton(page).click();
  await page.getByRole("button", { name: "המלצה לפי המטרה שלי" }).click();
  await nextButton(page).click();

  // Personal stats step is optional: a reassuring hint, "הבא" enabled.
  await expect(page.getByText("פרטים אישיים — אופציונלי")).toBeVisible();
  await expect(
    page.getByText("השלב הזה אופציונלי ואפשר להמשיך גם בלי למלא."),
  ).toBeVisible();
  await expect(nextButton(page)).toBeEnabled();
  await nextButton(page).click();

  // Notes is optional and reaches the summary while empty.
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
  await nextButton(page).click();
  // Adaptation — visual gender (required)
  await page.getByRole("button", { name: "אישה", exact: true }).click();
  await nextButton(page).click();
  // Focus areas — visual body map (required, ≥1); keep two areas selected.
  await page.getByRole("button", { name: "חזה", exact: true }).click();
  await page.getByRole("button", { name: "רגליים", exact: true }).click();
  await nextButton(page).click();
  // Location (required)
  await page.getByRole("button", { name: "בית", exact: true }).click();
  await nextButton(page).click();
  // Frequency (required)
  await page.getByRole("button", { name: "4 פעמים" }).click();
  await nextButton(page).click();
  // Duration (required)
  await page.getByRole("button", { name: "45–60 דקות" }).click();
  await nextButton(page).click();
  // Experience (required)
  await page.getByRole("button", { name: "מתחיל" }).click();
  await nextButton(page).click();
  // Equipment (required, multi-select) — keeps two options selected.
  const weights = page.getByRole("button", { name: "משקולות" });
  const bands = page.getByRole("button", { name: "גומיות" });
  await weights.click();
  await bands.click();
  await expect(weights).toHaveAttribute("aria-pressed", "true");
  await expect(bands).toHaveAttribute("aria-pressed", "true");
  await nextButton(page).click();
  // Training preference (required)
  await page.getByRole("button", { name: "מאוזן" }).click();
  await nextButton(page).click();
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
  await expect(page.getByText("חזה · רגליים")).toBeVisible();
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

  // Answer every required core step, then reach training preference / guidance.
  await answerCoreThroughEquipment(page);
  await page.getByRole("button", { name: "מאוזן" }).click();
  await nextButton(page).click();
  await page.getByRole("button", { name: "תכנית פשוטה וברורה" }).click();
  await nextButton(page).click();

  // Optional personal stats step (age / height / weight only).
  await expect(page.getByText("פרטים אישיים — אופציונלי")).toBeVisible();
  await page.locator("#profile-age").fill("30");
  await page.locator("#profile-height").fill("180");
  await page.locator("#profile-weight").fill("78");

  await advanceToSummary(page);
  await page.getByRole("button", { name: "שמור פרופיל" }).click();

  // The "פרטים נוספים" summary section appears with the filled values.
  await expect(page.getByText("פרטים נוספים")).toBeVisible();
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
  await expect(page.getByText("חזה · גב")).toBeVisible();

  // Edit opens the wizard directly at the first question, pre-filled.
  await page.getByRole("button", { name: "ערוך פרופיל" }).click();
  await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "להתחזק" }),
  ).toHaveAttribute("aria-pressed", "true");

  // Change the goal, then walk forward; all required answers already exist, so
  // the summary is reachable and the new value is saved.
  await page.getByRole("button", { name: "לשפר טכניקה" }).click();
  await advanceToSummary(page);
  await expect(page.getByText("סיכום הפרופיל")).toBeVisible();
  await page.getByRole("button", { name: "שמור פרופיל" }).click();
  await expect(page.getByText("לשפר טכניקה")).toBeVisible();
});

test("editing an older profile is guided through the now-required visual steps", async ({
  page,
}) => {
  await seedBase(page);
  await seedOldProfile(page);
  await page.goto("/training-profile");

  await page.getByRole("button", { name: "ערוך פרופיל" }).click();
  // Old profile lacks adaptation → advancing stops at the visual gender step.
  await advanceToSummary(page);
  await expect(page.getByText("איך נתאים את החוויה אליך?")).toBeVisible();
  await page.getByRole("button", { name: "מעדיף/ה לא לענות" }).click();

  // Next missing required: the focus-areas step.
  await advanceToSummary(page);
  await expect(page.getByText("על אילו שרירים נרצה להתמקד?")).toBeVisible();
  await page.getByRole("button", { name: "גוף מלא", exact: true }).click();

  // Then training preference + guidance style.
  await advanceToSummary(page);
  await expect(page.getByText("איזה סגנון אימון מתאים לך יותר?")).toBeVisible();
  await page.getByRole("button", { name: "מאוזן" }).click();
  await nextButton(page).click();
  await page.getByRole("button", { name: "המלצה לפי המטרה שלי" }).click();

  await advanceToSummary(page);
  await page.getByRole("button", { name: "שמור פרופיל" }).click();
  await expect(page.getByText("הפרופיל נשמר במכשיר")).toBeVisible();
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

for (const width of [360, 390]) {
  test(`the visual wizard has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await seedBase(page);
    await page.setViewportSize({ width, height: 780 });
    await page.goto("/training-profile");
    await page.getByRole("button", { name: "התחל" }).click();

    const noOverflow = () =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      );

    // Goal step.
    await expect(page.getByText("מה המטרה המרכזית שלך?")).toBeVisible();
    expect(await noOverflow()).toBe(true);

    // Visual gender step.
    await page.getByRole("button", { name: "להתחזק" }).click();
    await nextButton(page).click();
    await expect(page.getByText("איך נתאים את החוויה אליך?")).toBeVisible();
    expect(await noOverflow()).toBe(true);

    // Visual focus-areas step (the widest visual content — two body figures).
    await page.getByRole("button", { name: "גבר", exact: true }).click();
    await nextButton(page).click();
    await page.getByRole("button", { name: "גוף מלא", exact: true }).click();
    await expect(page.getByTestId("body-focus-figure")).toBeVisible();
    expect(await noOverflow()).toBe(true);
  });
}

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
