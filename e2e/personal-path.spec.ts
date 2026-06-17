import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen as seedBase } from "./fixtures";

// QA for Personal Path V1 — a small, local-first guidance card on /workouts that
// connects the saved profile, the workout recommendation, and saved history into
// one "where am I / what's my next step" card. Runs against the :3939 server
// (beta gate bypassed). We seed localStorage before load and assert the four
// behaviour states, that the card never sits above the active-draft restore card,
// and that there is no horizontal overflow at 360px / 390px. It touches NO schema,
// storage key, recommendation scoring, or builder behaviour.

const PROFILE_KEY = "yfos:personal-profile:v1";
const TEMPLATES_KEY = "yfos:workout-templates:v1";
const WORKOUTS_KEY = "yfos:workouts";

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

const TEMPLATES = [
  {
    id: "tpl-full",
    title: "Full Body",
    muscleGroups: ["legs", "chest", "back", "shoulders", "core"],
    exerciseIds: ["squat", "bench-press", "bent-over-row", "shoulder-press", "plank"],
    defaultSetCount: 3,
    createdAt: "2026-06-01T08:00:00.000Z",
  },
];

const WORKOUT = {
  id: "w-1",
  date: "2026-06-15",
  title: "אימון גב",
  muscleGroups: ["back"],
  exercises: [
    {
      exerciseId: "lat-pulldown",
      sets: [{ setNumber: 1, weightKg: 40, reps: 10, completed: true }],
    },
  ],
};

const DRAFT = {
  version: 1,
  updatedAt: "2026-06-16T08:00:00.000Z",
  title: "אימון בוקר",
  entries: [
    {
      exerciseId: "lat-pulldown",
      sets: [{ setNumber: 1, weightKg: 40, reps: 10, completed: false }],
    },
  ],
};

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

test("no profile → personal path defers to the recommendation card", async ({
  page,
}) => {
  // On /workouts the no-profile state is owned by the recommendation card (which
  // already shows the "fill profile" prompt), so the personal-path card is NOT
  // shown — the hub never stacks two near-identical profile cards. The
  // recommendation card's own CTA still points to /training-profile.
  await seedBase(page);
  await page.goto("/workouts");

  await expect(page.getByTestId("personal-path")).toHaveCount(0);
  await expect(
    page
      .getByTestId("workout-recommendation")
      .getByRole("link", { name: "מלא פרופיל אימון" }),
  ).toHaveAttribute("href", "/training-profile");
});

test("profile + recommendation + no workouts → first-step guidance", async ({
  page,
}) => {
  await seedBase(page);
  await seed(page, PROFILE_KEY, COMPLETE_PROFILE);
  await seed(page, TEMPLATES_KEY, TEMPLATES);
  await page.goto("/workouts");

  const card = page.getByTestId("personal-path");
  await expect(card).toBeVisible();
  await expect(
    card.getByText("הצעד הראשון שלך: להתחיל מהתבנית המומלצת."),
  ).toBeVisible();
  await expect(card.getByRole("button", { name: /התחל מההמלצה/ })).toBeVisible();
});

test("at least one workout → shows count + next step", async ({ page }) => {
  await seedBase(page);
  await seed(page, PROFILE_KEY, COMPLETE_PROFILE);
  await seed(page, TEMPLATES_KEY, TEMPLATES);
  await seed(page, WORKOUTS_KEY, [WORKOUT]);
  await page.goto("/workouts");

  const card = page.getByTestId("personal-path");
  await expect(card).toBeVisible();
  await expect(card.getByText("אימונים שנשמרו: 1")).toBeVisible();
  await expect(card.getByText("אימון אחרון:")).toBeVisible();
  await expect(card.getByText("פרופיל הושלם")).toBeVisible();
  await expect(card.getByRole("button", { name: /התחל אימון נוסף/ })).toBeVisible();
});

test("'התחל אימון נוסף' opens the free workout builder", async ({ page }) => {
  await seedBase(page);
  await seed(page, PROFILE_KEY, COMPLETE_PROFILE);
  await seed(page, WORKOUTS_KEY, [WORKOUT]);
  await page.goto("/workouts");

  await page
    .getByTestId("personal-path")
    .getByRole("button", { name: /התחל אימון נוסף/ })
    .click();
  await expect(page.getByText("אימון פעיל", { exact: true })).toBeVisible();
});

test("'צפה בהתקדמות' links to /progress", async ({ page }) => {
  await seedBase(page);
  await seed(page, PROFILE_KEY, COMPLETE_PROFILE);
  await seed(page, WORKOUTS_KEY, [WORKOUT]);
  await page.goto("/workouts");

  await expect(
    page.getByTestId("personal-path").getByRole("link", { name: /צפה בהתקדמות/ }),
  ).toHaveAttribute("href", "/progress");
});

test("the personal path card never sits above the active-draft restore card", async ({
  page,
}) => {
  await seedBase(page);
  await seed(page, "yfos:active-workout-draft:v1", DRAFT);
  await seed(page, WORKOUTS_KEY, [WORKOUT]);
  await page.goto("/workouts");

  const restore = page.getByRole("button", { name: /המשך אימון/ });
  const card = page.getByTestId("personal-path");
  await expect(restore).toBeVisible();
  await expect(card).toBeVisible();

  const restoreBox = await restore.boundingBox();
  const cardBox = await card.boundingBox();
  expect(restoreBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  // Restore card (its CTA) is higher on the page than the personal path card.
  expect(restoreBox!.y).toBeLessThan(cardBox!.y);
});

for (const width of [360, 390]) {
  test(`no horizontal overflow with the personal path card at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    await seedBase(page);
    await seed(page, PROFILE_KEY, COMPLETE_PROFILE);
    await seed(page, TEMPLATES_KEY, TEMPLATES);
    await seed(page, WORKOUTS_KEY, [WORKOUT]);
    await page.goto("/workouts");

    await expect(page.getByTestId("personal-path")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
