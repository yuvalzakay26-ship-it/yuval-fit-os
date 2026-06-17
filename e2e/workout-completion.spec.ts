import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen as seedBase } from "./fixtures";

// QA for the First Workout Completion Experience — Phase 1
// (docs/WORKOUT_COMPLETION_EXPERIENCE.md). Runs against the :3939 server, where
// the beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed
// localStorage before load and assert the calm, non-blocking success card shown
// on /workouts right after a save, WITHOUT touching workout/template/draft
// schemas, storage keys, the start-from-template flow, recommendation logic, or
// save semantics:
//   • saving shows "אימון נשמר בהצלחה" + a summary + next actions;
//   • the saved workout still appears in history;
//   • a recommended start adds "השלמת את האימון שהומלץ…"; a plain template start
//     does NOT (it shows the neutral "התאמנת לפי: …" origin instead);
//   • next-action buttons map to existing routes/behaviours;
//   • no horizontal overflow at 360px / 390px.

const PROFILE_KEY = "yfos:personal-profile:v1";
const TEMPLATES_KEY = "yfos:workout-templates:v1";

const COMPLETE_PROFILE = {
  goal: "להתחזק",
  location: "חדר כושר",
  weeklyFrequency: "3 פעמים",
  workoutDuration: "45–60 דקות",
  experience: "מתחיל",
  equipment: ["מכון מלא"],
  trainingPreference: "מאוזן",
  guidanceStyle: "המלצה לפי המטרה שלי",
  updatedAt: "2026-06-10T00:00:00.000Z",
};

const TWO_TEMPLATES = [
  {
    id: "tpl-full",
    title: "Full Body",
    muscleGroups: ["legs", "chest", "back", "shoulders", "core"],
    exerciseIds: ["squat", "bench-press", "bent-over-row", "shoulder-press", "plank"],
    defaultSetCount: 3,
    createdAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "tpl-split",
    title: "גב בלבד",
    muscleGroups: ["back"],
    exerciseIds: ["lat-pulldown"],
    defaultSetCount: 3,
    createdAt: "2026-06-01T08:00:00.000Z",
  },
];

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

async function seed(page: Page, key: string, value: unknown) {
  await page.addInitScript(
    ({ k, v }) => {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
    { k: key, v: value },
  );
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test("saving a template workout shows the completion confirmation + summary", async ({
  page,
}) => {
  await seedBase(page);
  await seedTemplate(page);
  await page.goto("/workouts");

  // Start the template (its own start button is last with one template seeded).
  await page.getByRole("button", { name: "התחל אימון", exact: true }).last().click();
  await page.getByRole("button", { name: "סיים ושמור אימון" }).click();

  const card = page.getByTestId("workout-completion");
  await expect(card).toBeVisible();
  await expect(card.getByText("אימון נשמר בהצלחה")).toBeVisible();
  await expect(card.getByText("כל הכבוד — האימון נוסף להיסטוריה שלך.")).toBeVisible();
  // Neutral origin context for a plain template start — NOT the recommendation copy.
  await expect(card.getByText("התאמנת לפי:")).toBeVisible();
  await expect(
    card.getByText("השלמת את האימון שהומלץ לפי הפרופיל שלך."),
  ).toHaveCount(0);
  // Simple summary counts from the saved session.
  await expect(card.getByText("תרגילים")).toBeVisible();
  await expect(card.getByText("סטים", { exact: true })).toBeVisible();

  await expectNoHorizontalOverflow(page);
});

test("the saved workout still appears in history with a reassurance line", async ({
  page,
}) => {
  await seedBase(page);
  await seedTemplate(page);
  await page.goto("/workouts");

  await page.getByRole("button", { name: "התחל אימון", exact: true }).last().click();
  await page.getByRole("button", { name: "סיים ושמור אימון" }).click();

  await expect(page.getByTestId("workout-completion")).toBeVisible();
  await expect(page.getByText("האימון האחרון שלך נשמר כאן.")).toBeVisible();
  // The history section renders the saved session card (title from the template).
  const history = page.locator("#workout-history");
  await expect(history.getByText("אימון גב").first()).toBeVisible();
});

test("a recommended start adds the profile-recommendation completion copy", async ({
  page,
}) => {
  await seedBase(page);
  await seed(page, PROFILE_KEY, COMPLETE_PROFILE);
  await seed(page, TEMPLATES_KEY, TWO_TEMPLATES);
  await page.goto("/workouts");

  await page
    .getByTestId("workout-recommendation")
    .getByRole("button", { name: "התחל אימון", exact: true })
    .click();
  await page.getByRole("button", { name: "סיים ושמור אימון" }).click();

  const card = page.getByTestId("workout-completion");
  await expect(card.getByText("אימון נשמר בהצלחה")).toBeVisible();
  await expect(
    card.getByText("השלמת את האימון שהומלץ לפי הפרופיל שלך."),
  ).toBeVisible();
  await expect(card.getByText("Full Body")).toBeVisible();
});

test("a free / resumed-draft save shows completion without any origin copy", async ({
  page,
}) => {
  await seedBase(page);
  await seedWorkoutDraft(page);
  await page.goto("/workouts");

  await page.getByRole("button", { name: /המשך אימון/ }).click();
  await page.getByRole("button", { name: "סיים ושמור אימון" }).click();

  const card = page.getByTestId("workout-completion");
  await expect(card.getByText("אימון נשמר בהצלחה")).toBeVisible();
  // No template / recommendation origin for a free or resumed session.
  await expect(card.getByText("התאמנת לפי:")).toHaveCount(0);
  await expect(
    card.getByText("השלמת את האימון שהומלץ לפי הפרופיל שלך."),
  ).toHaveCount(0);
});

test("completion next actions map to existing routes / behaviours", async ({
  page,
}) => {
  await seedBase(page);
  await seedTemplate(page);
  await page.goto("/workouts");

  await page.getByRole("button", { name: "התחל אימון", exact: true }).last().click();
  await page.getByRole("button", { name: "סיים ושמור אימון" }).click();

  const card = page.getByTestId("workout-completion");
  // "עבור להתקדמות" links to the existing progress route.
  await expect(card.getByRole("link", { name: /עבור להתקדמות/ })).toHaveAttribute(
    "href",
    "/progress",
  );
  // "התחל אימון נוסף" reopens the builder (and clears the completion card).
  await card.getByRole("button", { name: /התחל אימון נוסף/ }).click();
  await expect(page.getByText("אימון פעיל", { exact: true })).toBeVisible();
  await expect(page.getByTestId("workout-completion")).toHaveCount(0);
});

test("no horizontal overflow on the completion card at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seedBase(page);
  await seedTemplate(page);
  await page.goto("/workouts");

  await page.getByRole("button", { name: "התחל אימון", exact: true }).last().click();
  await page.getByRole("button", { name: "סיים ושמור אימון" }).click();
  await expect(page.getByTestId("workout-completion")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
