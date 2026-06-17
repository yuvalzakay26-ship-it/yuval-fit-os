import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen as seedBase } from "./fixtures";

// QA for Workout Recommendation V1 (docs/WORKOUT_RECOMMENDATION_V1.md). Runs
// against the :3939 server, where the beta access gate is bypassed
// (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed localStorage before load and assert
// the deterministic, local-only recommendation layer that maps the saved
// personal profile onto ONE existing template:
//   • no profile           → quiet "fill profile" CTA;
//   • older/partial profile → quiet "complete profile" CTA;
//   • profile + templates   → a recommendation card naming an EXISTING template,
//     whose "התחל אימון" starts that template via the normal start flow and whose
//     "ערוך פרופיל" links to /training-profile;
//   • profile + no templates → a create-template fallback.
// No schema / storage key / profile / template behaviour is changed by this pass.

const PROFILE_KEY = "yfos:personal-profile:v1";
const TEMPLATES_KEY = "yfos:workout-templates:v1";

// A complete profile: beginner, 3×/week, gym, strength — maps strongly to a
// broad full-body template.
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

// A broad "Full Body" template + a narrow single-group split. The beginner /
// low-frequency / strength profile should deterministically prefer Full Body.
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

async function seedProfile(page: Page, profile: unknown) {
  await page.addInitScript(
    ({ key, value }) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* ignore */
      }
    },
    { key: PROFILE_KEY, value: profile },
  );
}

async function seedTemplates(page: Page, templates: unknown) {
  await page.addInitScript(
    ({ key, value }) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* ignore */
      }
    },
    { key: TEMPLATES_KEY, value: templates },
  );
}

test("no profile → Workouts shows the quiet 'fill profile' CTA", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/workouts");
  await expect(page.getByText("המלצת אימון אישית")).toBeVisible();
  const cta = page.getByRole("link", { name: "מלא פרופיל אימון" });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "/training-profile");
});

test("older/incomplete profile → 'complete profile' CTA appears", async ({
  page,
}) => {
  await seedBase(page);
  // Only two answers — not enough core fields for a recommendation.
  await seedProfile(page, {
    goal: "להתחזק",
    experience: "מתחיל",
    updatedAt: "2026-06-10T00:00:00.000Z",
  });
  await page.goto("/workouts");
  await expect(page.getByText("השלם פרופיל כדי לקבל המלצה")).toBeVisible();
  const cta = page.getByRole("link", { name: "השלם פרופיל" });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "/training-profile");
});

test("profile + templates → recommendation card names an existing template", async ({
  page,
}) => {
  await seedBase(page);
  await seedProfile(page, COMPLETE_PROFILE);
  await seedTemplates(page, TWO_TEMPLATES);
  await page.goto("/workouts");

  const card = page.getByTestId("workout-recommendation");
  await expect(card).toBeVisible();
  await expect(
    card.getByText("המלצת התחלה לפי הפרופיל שלך"),
  ).toBeVisible();
  // The recommended template is an EXISTING one — the broad Full Body, not the
  // narrow split — and it is named verbatim.
  await expect(card.getByText("Full Body")).toBeVisible();
  await expect(card.getByText("גב בלבד")).toHaveCount(0);
  // At least one reason chip is shown.
  await expect(card.getByText("מתאים לרמת מתחיל")).toBeVisible();
});

test("clicking 'התחל אימון' starts the recommended existing template", async ({
  page,
}) => {
  await seedBase(page);
  await seedProfile(page, COMPLETE_PROFILE);
  await seedTemplates(page, TWO_TEMPLATES);
  await page.goto("/workouts");

  const card = page.getByTestId("workout-recommendation");
  await card.getByRole("button", { name: "התחל אימון", exact: true }).click();
  // The normal start-from-template flow opens the builder seeded with the
  // recommended template's title.
  await expect(page.locator("#workout-title")).toHaveValue("Full Body");
});

test("'ערוך פרופיל' links to the training profile", async ({ page }) => {
  await seedBase(page);
  await seedProfile(page, COMPLETE_PROFILE);
  await seedTemplates(page, TWO_TEMPLATES);
  await page.goto("/workouts");

  const card = page.getByTestId("workout-recommendation");
  const edit = card.getByRole("link", { name: "ערוך פרופיל" });
  await expect(edit).toBeVisible();
  await expect(edit).toHaveAttribute("href", "/training-profile");
});

test("profile but no templates → create-template fallback appears", async ({
  page,
}) => {
  await seedBase(page);
  await seedProfile(page, COMPLETE_PROFILE);
  // Explicitly write an empty template list so the seed defaults don't appear.
  await seedTemplates(page, []);
  await page.goto("/workouts");
  const card = page.getByTestId("workout-recommendation");
  await expect(card.getByText("אין עדיין תבניות להמלצה")).toBeVisible();
  await expect(
    card.getByRole("button", { name: "צור תבנית חדשה" }),
  ).toBeVisible();
});

test("the profile saved summary shows a compact recommendation block", async ({
  page,
}) => {
  await seedBase(page);
  await seedProfile(page, COMPLETE_PROFILE);
  await seedTemplates(page, TWO_TEMPLATES);
  await page.goto("/training-profile");

  // Saved summary state renders the compact block linking to /workouts.
  await expect(
    page.getByText("המלצת התחלה לפי הפרופיל שלך"),
  ).toBeVisible();
  const open = page.getByRole("link", {
    name: /המלצת התחלה: Full Body/,
  });
  await expect(open).toBeVisible();
  await expect(open).toHaveAttribute("href", "/workouts");
});
