import { test, expect, type Page } from "@playwright/test";

// QA for the Water Goal Completion & Over-Goal UX (docs/WATER_GOAL_UX_UPGRADE.md).
// Runs against the :3939 server, where the beta access gate is bypassed
// (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed today's water log + a clean 2000ml
// goal in localStorage before load, then assert the graduated, non-medical copy
// on the water detail screen (/nutrition/water).
//
// Goal is 2000ml, so the seeded total maps directly to a percentage:
//   1000 → 50%  under_goal (no banner)
//   2000 → 100% completed   (celebration)
//   2200 → 110% soft_over   (calm)
//   2500 → 125% attention   (amber)
//   3000 → 150% caution     (rose, non-medical)

const GOAL_ML = 2000;

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

test("under goal shows no completion/over-goal banner", async ({ page }) => {
  await seedWater(page, 1000); // 50%
  await page.goto("/nutrition/water");
  await expect(page.getByRole("heading", { name: "מעקב מים" })).toBeVisible();
  await expect(page.locator("[data-water-status]")).toHaveCount(0);
  // Add-water controls remain present.
  await expect(page.getByLabel("הוסף כמות מותאמת")).toBeVisible();
});

test("exactly 100% shows the celebration state", async ({ page }) => {
  await seedWater(page, 2000); // 100%
  await page.goto("/nutrition/water");
  const banner = page.locator('[data-water-status="completed"]');
  await expect(banner).toBeVisible();
  await expect(
    page.getByText("כל הכבוד! הגעת ליעד המים היומי שלך"),
  ).toBeVisible();
  await expect(page.getByText("100% הושלם")).toBeVisible();
  // Celebration must not block normal usage — controls still here.
  await expect(page.getByLabel("הוסף כמות מותאמת")).toBeVisible();
});

test("soft over-goal shows a calm, positive message", async ({ page }) => {
  await seedWater(page, 2200); // 110%
  await page.goto("/nutrition/water");
  await expect(page.locator('[data-water-status="soft_over"]')).toBeVisible();
  await expect(
    page.getByText("עברת מעט את יעד המים היומי שהגדרת"),
  ).toBeVisible();
});

test("120% shows the calm amber attention message", async ({ page }) => {
  await seedWater(page, 2500); // 125%
  await page.goto("/nutrition/water");
  const banner = page.locator('[data-water-status="attention"]');
  await expect(banner).toBeVisible();
  // Scope to the banner — the same line also appears as the hero subtitle.
  await expect(
    banner.getByText("שתית יותר מהיעד שהגדרת להיום"),
  ).toBeVisible();
  await expect(banner.getByText("שים לב לא לשתות מעבר לצורך.")).toBeVisible();
});

test("150% shows the non-medical caution state", async ({ page }) => {
  await seedWater(page, 3000); // 150%
  await page.goto("/nutrition/water");
  await expect(page.locator('[data-water-status="caution"]')).toBeVisible();
  await expect(page.getByText("חריגה משמעותית מיעד המים היומי")).toBeVisible();
  await expect(
    page.getByText("כדאי לעצור ולבדוק אם המשך שתייה באמת נחוץ."),
  ).toBeVisible();
  // The explicit non-medical disclaimer is present.
  await expect(page.getByText("האפליקציה אינה מהווה ייעוץ רפואי.")).toBeVisible();
});

// ===== Follow-up: app-wide celebration + shared status on Today/home =====
// (docs/WATER_GOAL_GLOBAL_CELEBRATION.md)

const CELEBRATION = '[data-water-celebration="active"]';

test("no celebration overlay renders while under goal", async ({ page }) => {
  await seedWater(page, 1000); // 50%
  await page.goto("/");
  await expect(page.locator(CELEBRATION)).toHaveCount(0);
});

test("crossing the goal from the water page triggers the global celebration", async ({
  page,
}) => {
  await seedWater(page, 1800); // 90% — one add will cross.
  await page.goto("/nutrition/water");
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  // Add a custom amount that crosses 2000ml.
  await page.getByLabel('כמות מותאמת במ"ל').fill("300");
  await page.getByLabel("הוסף כמות מותאמת").click();

  await expect(page.locator(CELEBRATION)).toBeVisible();
  // It self-dismisses (no modal, nothing to close).
  await expect(page.locator(CELEBRATION)).toHaveCount(0, { timeout: 4000 });
});

test("crossing the goal from Today/home triggers the global celebration", async ({
  page,
}) => {
  await seedWater(page, 1800); // 90% — water is already started, so the card shows.
  await page.goto("/");
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  // The compact Today water card's quick-add cup (250ml) crosses the goal.
  await page.getByRole("button", { name: /הוסף כוס/ }).first().click();

  await expect(page.locator(CELEBRATION)).toBeVisible();
});

test("Today water card shows the amber attention status (not plain blue)", async ({
  page,
}) => {
  await seedWater(page, 2500); // 125%
  await page.goto("/");
  // The over-goal copy is visible on Today without opening /nutrition/water.
  const card = page.locator('[data-water-status="attention"]');
  await expect(card).toBeVisible();
  await expect(card.getByText("שתית יותר מהיעד שהגדרת להיום")).toBeVisible();
});

test("Today water card shows the rose caution status outside /nutrition/water", async ({
  page,
}) => {
  await seedWater(page, 3000); // 150%
  await page.goto("/");
  const card = page.locator('[data-water-status="caution"]');
  await expect(card).toBeVisible();
  await expect(card.getByText("חריגה משמעותית מיעד המים היומי")).toBeVisible();
  // The non-medical disclaimer reaches Today too.
  await expect(
    card.getByText("האפליקציה אינה מהווה ייעוץ רפואי."),
  ).toBeVisible();
});

// ===== Uncapped over-goal percentage display =====
// The displayed percentage must reflect the *real* ratio (intake / goal), even
// far over the goal — only the gauge's visual fill is capped at 100%. With the
// 2000ml goal: 2000→100%, 2200→110%, 2400→120%, 3000→150%, 6000→300%.
// The gauge centre label is an exact "<n>%" span, so an exact-text match finds
// only the gauge (the banner's "<n>% מהיעד שהגדרת" carries extra text).

const PERCENT_CASES: Array<{ totalMl: number; label: string }> = [
  { totalMl: 2000, label: "100%" },
  { totalMl: 2200, label: "110%" },
  { totalMl: 2400, label: "120%" },
  { totalMl: 3000, label: "150%" },
  { totalMl: 6000, label: "300%" },
];

for (const { totalMl, label } of PERCENT_CASES) {
  test(`water gauge shows ${label} for ${totalMl}ml against a 2000ml goal`, async ({
    page,
  }) => {
    await seedWater(page, totalMl);
    await page.goto("/nutrition/water");
    // The gauge centre label shows the real (uncapped) percentage.
    await expect(
      page.getByText(label, { exact: true }).first(),
    ).toBeVisible();
    // It must NOT be clamped down to 100% when over goal.
    if (label !== "100%") {
      await expect(page.getByText("100%", { exact: true })).toHaveCount(0);
    }
  });
}

test("over-goal gauge fill stays capped while its label is uncapped", async ({
  page,
}) => {
  // 300% over goal: the water body translate (visual fill) is capped at the
  // full level (levelY = 2), identical to exactly 100%, so it never overflows —
  // while the centre label still reads the true 300%.
  await seedWater(page, 6000); // 300%
  await page.goto("/nutrition/water");
  await expect(page.getByText("300%", { exact: true }).first()).toBeVisible();
  const fill = page.locator("svg g[clip-path]").first();
  await expect(fill).toHaveAttribute("style", /translateY\(2px\)/);
});

test("Today status strip shows the real over-goal water percentage", async ({
  page,
}) => {
  await seedWater(page, 6000); // 300%
  await page.goto("/");
  // The four-pillar status strip surfaces the uncapped percentage as text.
  await expect(page.getByText("300%", { exact: true }).first()).toBeVisible();
});
