import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen as seedBase, seedWater } from "./fixtures";

// QA for Workout History / Progress Polish — Phase 1
// (docs/WORKOUT_HISTORY_PROGRESS_POLISH.md). Runs against the :3939 server, where
// the beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed
// saved workouts into localStorage before load and assert the clarity pass over
// the workout history cards and the Progress screen's last-workout snapshot,
// WITHOUT touching workout/template/draft schemas, storage keys, save semantics,
// or any calculation beyond the weight×reps volume already shown elsewhere:
//   • no workouts → calm history empty state + calm /progress empty state;
//   • saved workouts appear in history with their counts;
//   • a bodyweight-only session hides the misleading "0 נפח" tile;
//   • /progress shows a clear "האימון האחרון שלך" snapshot once a workout exists;
//   • /progress last-workout snapshot stays calm when only other data exists;
//   • no horizontal overflow at 360px / 390px.

const WORKOUTS_KEY = "yfos:workouts";

const WEIGHTED_SESSION = {
  id: "w-weighted",
  date: "2026-06-15",
  title: "אימון גב",
  muscleGroups: ["back"],
  exercises: [
    {
      exerciseId: "lat-pulldown",
      sets: [
        { setNumber: 1, weightKg: 40, reps: 10, completed: true },
        { setNumber: 2, weightKg: 45, reps: 8, completed: true },
      ],
    },
  ],
};

const BODYWEIGHT_SESSION = {
  id: "w-bodyweight",
  date: "2026-06-16",
  title: "אימון ליבה",
  muscleGroups: ["core"],
  exercises: [
    {
      exerciseId: "plank",
      sets: [
        { setNumber: 1, weightKg: 0, reps: 0, completed: true },
        { setNumber: 2, weightKg: 0, reps: 0, completed: true },
      ],
    },
  ],
};

const VOLUME_LABEL = 'נפח (ק"ג)';

async function seedWorkouts(page: Page, sessions: unknown[]) {
  await page.addInitScript(
    ({ key, value }) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* ignore */
      }
    },
    { key: WORKOUTS_KEY, value: sessions },
  );
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test("with no workouts, the history empty state stays calm and clear", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/workouts");

  const history = page.locator("#workout-history");
  await expect(history.getByText("כאן ייבנה סיפור הכוח שלך")).toBeVisible();
  // No history cards, and no misleading numbers.
  await expect(history.getByTestId("last-workout-summary")).toHaveCount(0);
});

test("with no data at all, /progress shows a calm empty state", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/progress");

  await expect(page.getByText("אין עדיין נתונים להצגה")).toBeVisible();
});

test("a saved workout appears in history with its counts", async ({ page }) => {
  await seedBase(page);
  await seedWorkouts(page, [WEIGHTED_SESSION]);
  await page.goto("/workouts");

  const history = page.locator("#workout-history");
  await expect(history.getByText("אימון גב").first()).toBeVisible();
  await expect(history.getByText("תרגילים").first()).toBeVisible();
  await expect(history.getByText("סטים", { exact: true }).first()).toBeVisible();
  // A weighted session DOES surface its volume tile.
  await expect(history.getByText(VOLUME_LABEL).first()).toBeVisible();
  // Clarifying hint under the section title once history exists.
  await expect(page.getByText("כל האימונים ששמרת, מהאחרון לראשון.")).toBeVisible();
});

test("a bodyweight-only session hides the misleading volume tile", async ({
  page,
}) => {
  await seedBase(page);
  await seedWorkouts(page, [BODYWEIGHT_SESSION]);
  await page.goto("/workouts");

  const history = page.locator("#workout-history");
  await expect(history.getByText("אימון ליבה").first()).toBeVisible();
  await expect(history.getByText("תרגילים").first()).toBeVisible();
  // No "0 נפח" anywhere on the bodyweight card.
  await expect(history.getByText(VOLUME_LABEL)).toHaveCount(0);
});

test("/progress shows a clear last-workout snapshot once a workout exists", async ({
  page,
}) => {
  await seedBase(page);
  await seedWorkouts(page, [WEIGHTED_SESSION]);
  await page.goto("/progress");

  await expect(
    page.getByRole("heading", { name: "האימון האחרון שלך" }),
  ).toBeVisible();
  const summary = page.getByTestId("last-workout-summary");
  await expect(summary).toBeVisible();
  await expect(summary.getByText("אימון גב")).toBeVisible();
  // Honest lifetime roll-ups, no comparison claims.
  await expect(summary.getByText("סטים שנשמרו")).toBeVisible();
  await expect(summary.getByText("נפח כולל")).toBeVisible();
  // The careful "based on workouts saved on this device" copy is present.
  await expect(
    page.getByText("נתוני ההתקדמות מבוססים על האימונים ששמרת במכשיר."),
  ).toBeVisible();
});

test("/progress last-workout snapshot stays calm when only other data exists", async ({
  page,
}) => {
  // Water logged but no workouts: the page has data, but the last-workout
  // snapshot explains what will appear here instead of inventing numbers.
  await seedWater(page, 750);
  await page.goto("/progress");

  const summary = page.getByTestId("last-workout-summary");
  await expect(summary).toBeVisible();
  await expect(
    summary.getByText("כאן תופיע ההיסטוריה אחרי שתסיים אימון ראשון."),
  ).toBeVisible();
});

for (const width of [360, 390]) {
  test(`no horizontal overflow on /progress at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await seedBase(page);
    await seedWorkouts(page, [WEIGHTED_SESSION, BODYWEIGHT_SESSION]);
    await page.goto("/progress");

    await expect(page.getByTestId("last-workout-summary")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test(`no horizontal overflow on /workouts history at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    await seedBase(page);
    await seedWorkouts(page, [WEIGHTED_SESSION, BODYWEIGHT_SESSION]);
    await page.goto("/workouts");

    await expect(page.locator("#workout-history").getByText("אימון גב").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
