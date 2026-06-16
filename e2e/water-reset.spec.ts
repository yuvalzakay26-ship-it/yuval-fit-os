import { test, expect, type Page } from "@playwright/test";

// QA for the Water Reset UX (docs/WATER_TRACKING.md, docs/WATER_GOAL_GLOBAL_CELEBRATION.md).
// Runs against the :3939 server, where the beta access gate is bypassed
// (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed today's water log + a clean 2000ml
// goal in localStorage before load, then assert the reset action is reachable
// near the top of the detail screen and on the Today/home card, that it is
// confirm-gated, and that it clears only today's entries while leaving the goal,
// presets and settings untouched.

const GOAL_ML = 2000;
const CONFIRM_TITLE = "לאפס את שתיית המים של היום?";
const CELEBRATION = '[data-water-celebration="active"]';

async function seedWater(page: Page, totalMl: number) {
  await page.addInitScript(
    ({ goal, total }) => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
        localStorage.setItem(
          "yfos:settings",
          JSON.stringify({ waterGoalMl: goal }),
        );
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        localStorage.setItem(
          "yfos:water-logs:v1",
          JSON.stringify([
            {
              date,
              totalMl: total,
              entries: [
                { id: "seed-1", amountMl: total, createdAt: d.toISOString() },
              ],
            },
          ]),
        );
      } catch {
        /* ignore */
      }
    },
    { goal: GOAL_ML, total: totalMl },
  );
}

// ===== /nutrition/water detail screen =====

test("water detail shows the reset action near the top when water is logged", async ({
  page,
}) => {
  await seedWater(page, 1000); // 50%
  await page.goto("/nutrition/water");
  // The reset button sits in the page header, above today's entries — it is in
  // the DOM before the first entry card, so it is reachable without scrolling.
  const reset = page.getByRole("button", { name: "אפס את היום" });
  await expect(reset).toBeVisible();
});

test("reset action is hidden when no water has been logged", async ({ page }) => {
  await seedWater(page, 0);
  await page.goto("/nutrition/water");
  await expect(page.getByRole("heading", { name: "מעקב מים" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "אפס את היום" }),
  ).toHaveCount(0);
});

test("clicking reset opens a confirmation dialog", async ({ page }) => {
  await seedWater(page, 1000);
  await page.goto("/nutrition/water");
  await page.getByRole("button", { name: "אפס את היום" }).click();
  await expect(page.getByRole("dialog", { name: CONFIRM_TITLE })).toBeVisible();
});

test("cancelling the reset keeps today's entries unchanged", async ({ page }) => {
  await seedWater(page, 1000);
  await page.goto("/nutrition/water");
  await page.getByRole("button", { name: "אפס את היום" }).click();
  const dialog = page.getByRole("dialog", { name: CONFIRM_TITLE });
  await dialog.getByRole("button", { name: "ביטול" }).click();
  await expect(dialog).toHaveCount(0);
  // 1000ml of 2000ml goal still shown on the gauge.
  await expect(page.getByText("50%", { exact: true }).first()).toBeVisible();
});

test("confirming the reset clears today's water and returns to 0%", async ({
  page,
}) => {
  await seedWater(page, 1000);
  await page.goto("/nutrition/water");
  await page.getByRole("button", { name: "אפס את היום" }).click();
  await page
    .getByRole("dialog", { name: CONFIRM_TITLE })
    .getByRole("button", { name: "אפס", exact: true })
    .click();
  // Back to the empty/under-goal state: gauge reads 0% and the action is gone.
  await expect(page.getByText("0%", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("עדיין לא נרשמו מים היום"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "אפס את היום" }),
  ).toHaveCount(0);
});

test("reset over-goal water removes the amber attention state", async ({
  page,
}) => {
  await seedWater(page, 2500); // 125% → attention
  await page.goto("/nutrition/water");
  await expect(page.locator('[data-water-status="attention"]')).toBeVisible();
  await page.getByRole("button", { name: "אפס את היום" }).click();
  await page
    .getByRole("dialog", { name: CONFIRM_TITLE })
    .getByRole("button", { name: "אפס", exact: true })
    .click();
  await expect(page.locator("[data-water-status]")).toHaveCount(0);
  await expect(page.getByText("0%", { exact: true }).first()).toBeVisible();
});

test("reset keeps the water goal and presets intact", async ({ page }) => {
  await seedWater(page, 1000);
  await page.goto("/nutrition/water");
  await page.getByRole("button", { name: "אפס את היום" }).click();
  await page
    .getByRole("dialog", { name: CONFIRM_TITLE })
    .getByRole("button", { name: "אפס", exact: true })
    .click();
  await expect(page.getByText("0%", { exact: true }).first()).toBeVisible();
  // The goal still reads 2 ליטר and the quick-add presets are still rendered.
  await expect(page.getByText("/ 2 ליטר")).toBeVisible();
  await expect(page.getByText("הוספה מהירה")).toBeVisible();
  // Settings (incl. the goal) are untouched in storage.
  const goal = await page.evaluate(() => {
    const raw = localStorage.getItem("yfos:settings");
    return raw ? JSON.parse(raw).waterGoalMl : null;
  });
  expect(goal).toBe(GOAL_ML);
});

// ===== Today/home card =====

test("Today water card shows the reset action when water > 0", async ({
  page,
}) => {
  await seedWater(page, 1000);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "אפס את שתיית המים של היום" }),
  ).toBeVisible();
});

test("Today reset clears today's water and drops the rose caution state", async ({
  page,
}) => {
  await seedWater(page, 3000); // 150% → caution
  await page.goto("/");
  await expect(page.locator('[data-water-status="caution"]')).toBeVisible();
  await page
    .getByRole("button", { name: "אפס את שתיית המים של היום" })
    .click();
  await page
    .getByRole("dialog", { name: CONFIRM_TITLE })
    .getByRole("button", { name: "אפס", exact: true })
    .click();
  await expect(page.locator("[data-water-status]")).toHaveCount(0);
  // The reset control disappears once intake is back to 0.
  await expect(
    page.getByRole("button", { name: "אפס את שתיית המים של היום" }),
  ).toHaveCount(0);
});

test("goal celebration still fires after a reset when re-crossing the goal", async ({
  page,
}) => {
  await seedWater(page, 1800); // 90%
  await page.goto("/nutrition/water");
  // Reset clears the day (and re-arms the celebration flag).
  await page.getByRole("button", { name: "אפס את היום" }).click();
  await page
    .getByRole("dialog", { name: CONFIRM_TITLE })
    .getByRole("button", { name: "אפס", exact: true })
    .click();
  await expect(page.getByText("0%", { exact: true }).first()).toBeVisible();
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  // Logging water that crosses the goal again still celebrates.
  await page.getByLabel('כמות מותאמת במ"ל').fill("2000");
  await page.getByLabel("הוסף כמות מותאמת").click();
  await expect(page.locator(CELEBRATION)).toBeVisible();
});
