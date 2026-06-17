import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen as seedBase } from "./fixtures";

// QA for the Active Workout UX Polish — Phase 1
// (docs/ACTIVE_WORKOUT_UX_POLISH.md). Runs against the :3939 server, where the
// beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed
// localStorage before load and assert the clarity pass on the active-workout
// builder, WITHOUT touching workout/template/draft schemas, storage keys, the
// start-from-template flow, recommendation logic, or save semantics:
//   • starting a template opens a clear "אימון פעיל" area with "מתאמן לפי: …"
//     origin context and the exercises visible under a "תרגילי האימון" label;
//   • a free workout shows the active header but no "מתאמן לפי" origin line;
//   • add-set still works and finish/save still records + returns to the hub;
//   • an auto-saved draft still restores via "המשך אימון";
//   • no horizontal overflow at 360px / 390px.

// A saved template using a real seed exercise id (back / lat-pulldown).
async function seedTemplate(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "yfos:workout-templates:v1",
        JSON.stringify([
          {
            id: "tpl-1",
            title: "אימון גב",
            muscleGroups: ["back"],
            exerciseIds: ["lat-pulldown"],
            defaultSetCount: 3,
            createdAt: "2026-06-01T08:00:00.000Z",
          },
        ]),
      );
    } catch {
      /* ignore */
    }
  });
}

// A meaningful in-progress active-workout draft, so the hub offers a restore.
async function seedWorkoutDraft(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "yfos:active-workout-draft:v1",
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          title: "אימון בוקר",
          entries: [
            {
              exerciseId: "lat-pulldown",
              sets: [{ setNumber: 1, weightKg: 40, reps: 10, completed: false }],
            },
          ],
        }),
      );
    } catch {
      /* ignore */
    }
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  // Allow a 1px rounding slack; anything larger is a real horizontal scrollbar.
  expect(overflow).toBeLessThanOrEqual(1);
}

test("starting a template opens a clear active-workout area with origin context", async ({
  page,
}) => {
  await seedBase(page);
  await seedTemplate(page);
  await page.goto("/workouts");

  // The hub's first "התחל אימון" starts a free workout; the template card's own
  // start (last on the page with one template) is the start-from-template flow.
  await page.getByRole("button", { name: "התחל אימון", exact: true }).last().click();

  // The active-workout hero reads "אימון פעיל" and names what we're training by.
  await expect(page.getByText("אימון פעיל", { exact: true })).toBeVisible();
  await expect(page.getByText("מתאמן לפי:")).toBeVisible();
  await expect(page.getByText("אימון גב", { exact: false }).first()).toBeVisible();
  // The editable title is still seeded from the template (start flow untouched).
  await expect(page.locator("#workout-title")).toHaveValue("אימון גב");
  // The exercises appear under a clear section label.
  await expect(page.getByRole("heading", { name: /תרגילי האימון/ })).toBeVisible();
  // The recommendation-start banner is NOT shown for a plain template start.
  await expect(
    page.getByTestId("recommendation-start-notice"),
  ).toHaveCount(0);

  await expectNoHorizontalOverflow(page);
});

test("a free workout shows the active header but no template origin line", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/workouts");

  await page.getByRole("button", { name: "התחל אימון", exact: true }).first().click();

  await expect(page.getByText("אימון פעיל", { exact: true })).toBeVisible();
  // No template → no "מתאמן לפי" origin line; the empty-state helper guides first.
  await expect(page.getByText("מתאמן לפי:")).toHaveCount(0);
  await expect(
    page.getByText("התחל בבחירת תרגיל, ואז הוסף סטים ומשקלים."),
  ).toBeVisible();
  await expect(page.getByText("בחר תרגיל ראשון", { exact: true })).toBeVisible();
});

test("add-set works and finish/save records the workout and returns to the hub", async ({
  page,
}) => {
  await seedBase(page);
  await seedTemplate(page);
  await page.goto("/workouts");

  await page.getByRole("button", { name: "התחל אימון", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: /תרגילי האימון/ })).toBeVisible();

  // The template seeds 3 sets (no prior performance) → 6 numeric inputs.
  const numbers = page.getByRole("spinbutton");
  await expect(numbers).toHaveCount(6);
  // Adding a set adds one more row (2 more inputs).
  await page.getByRole("button", { name: "הוספת סט" }).click();
  await expect(numbers).toHaveCount(8);

  // Finish/save still records the workout and returns to the hub.
  await page.getByRole("button", { name: "סיים ושמור אימון" }).click();
  await expect(page.getByText("מרכז האימונים")).toBeVisible();
  await expect(page.getByText("אימון פעיל", { exact: true })).toHaveCount(0);
});

test("an auto-saved draft still restores via 'המשך אימון'", async ({ page }) => {
  await seedBase(page);
  await seedWorkoutDraft(page);
  await page.goto("/workouts");

  await page.getByRole("button", { name: /המשך אימון/ }).click();
  // The builder reopens seeded from the draft (title + active header intact).
  await expect(page.getByText("אימון פעיל", { exact: true })).toBeVisible();
  await expect(page.locator("#workout-title")).toHaveValue("אימון בוקר");
  await expect(page.getByRole("heading", { name: /תרגילי האימון/ })).toBeVisible();
});

test("no horizontal overflow inside the active workout at 360px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seedBase(page);
  await seedTemplate(page);
  await page.goto("/workouts");

  // Start from the template (last start button) so the richer hero — origin line,
  // section label, set rows — is what we measure for overflow.
  await page.getByRole("button", { name: "התחל אימון", exact: true }).last().click();
  await expect(page.getByText("אימון פעיל", { exact: true })).toBeVisible();
  await expect(page.getByText("מתאמן לפי:")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
