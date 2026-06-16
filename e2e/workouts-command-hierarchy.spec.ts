import { test, expect, type Page } from "@playwright/test";

// QA for the Workouts "command hierarchy" clarity pass
// (docs/WORKOUTS_CLARITY_PASS.md). Runs against the :3939 server, where the
// beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed
// localStorage before load and assert the new hierarchy:
//   • the command center renders a clear primary "התחל אימון" + secondary
//     "צור תבנית חדשה" (no vague "אימון חדש");
//   • when a meaningful draft exists, "המשך אימון" leads above the command
//     center, and the hero's start action steps down to a non-gradient weight;
//   • saved templates render their own "התחל אימון" start button;
//   • the gym attendance card still renders (secondary, links to /gym);
//   • the empty workout-history state stays visible but calm — it no longer
//     re-duplicates the primary CTA.
// No schemas / storage keys / business logic are touched by this pass.

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

// Seed a single saved workout template using a real seed exercise id.
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

// Seed a meaningful in-progress active-workout draft.
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

test("the command center offers a clear primary start + secondary template action", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/workouts");
  // Hub framing remains.
  await expect(page.getByText("מרכז האימונים")).toBeVisible();
  // Primary path reads "התחל אימון" — not the old vague "אימון חדש". (The hero
  // is the first such button; template cards add their own below it.)
  await expect(
    page.getByRole("button", { name: "התחל אימון", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "אימון חדש", exact: true }),
  ).toHaveCount(0);
  // Creating a reusable plan is offered as a clearly-distinct secondary action.
  await expect(
    page.getByRole("button", { name: "צור תבנית חדשה" }),
  ).toBeVisible();
});

test("a live draft leads with 'המשך אימון' above the command center", async ({
  page,
}) => {
  await seedBase(page);
  await seedWorkoutDraft(page);
  await page.goto("/workouts");
  const resume = page.getByRole("button", { name: /המשך אימון/ });
  // The hero start action is the first "התחל אימון" on the page (the draft card
  // above uses "המשך אימון"; template cards sit below the hero).
  const start = page
    .getByRole("button", { name: "התחל אימון", exact: true })
    .first();
  await expect(resume).toBeVisible();
  await expect(page.getByText("אימון בוקר")).toBeVisible();
  await expect(start).toBeVisible();
  // The resume action sits above the hero's start action.
  const resumeBox = await resume.boundingBox();
  const startBox = await start.boundingBox();
  expect(resumeBox && startBox && resumeBox.y < startBox.y).toBeTruthy();
  // With a draft live, the hero's start steps down off the strength gradient.
  await expect(start).not.toHaveClass(/strength-gradient/);
});

test("saved templates render with their own 'התחל אימון' start button", async ({
  page,
}) => {
  await seedBase(page);
  await seedTemplate(page);
  await page.goto("/workouts");
  await expect(page.getByRole("heading", { name: "תבניות אימון" })).toBeVisible();
  // The clarifying helper guides the user toward picking a ready plan.
  await expect(page.getByText("בחר תבנית מוכנה והתחל להתאמן")).toBeVisible();
  await expect(page.getByText("אימון גב")).toBeVisible();
  // Both the template card and the command center expose "התחל אימון".
  await expect(
    page.getByRole("button", { name: "התחל אימון", exact: true }),
  ).toHaveCount(2);
});

test("the gym attendance card stays available as a secondary link", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/workouts");
  const gym = page.getByRole("link", { name: "נוכחות במכון" });
  await expect(gym).toBeVisible();
  await expect(gym).toHaveAttribute("href", "/gym");
});

test("empty workout history stays visible but calm (no duplicate primary CTA)", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/workouts");
  await expect(
    page.getByRole("heading", { name: "היסטוריית אימונים" }),
  ).toBeVisible();
  await expect(page.getByText("כאן ייבנה סיפור הכוח שלך")).toBeVisible();
  // The old competing CTAs inside the empty state are gone — the command
  // center is the single home for starting a workout / creating a template.
  await expect(
    page.getByRole("button", { name: "התחל אימון ראשון" }),
  ).toHaveCount(0);
});
