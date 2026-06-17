import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen, todayISO } from "./fixtures";

// QA for the app-wide "protein goal reached" celebration
// (docs/PROTEIN_GOAL_CELEBRATION.md). Runs against the :3939 server, where the
// beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed a
// configured protein goal + some of today's food logs into localStorage before
// load, then drive the real add paths (manual add form + the journal's
// "הוסף שוב") and assert the one-shot overlay.
//
// The celebration fires only on the below→at-or-above crossing of the configured
// goal, computed from the real food-log totals at add time — so it must NOT play
// on render / loading existing logs, nor when the goal was already met before the
// add. There is no persistent flag: the crossing edge itself is the guard.

const CELEBRATION = '[data-protein-celebration="active"]';
const GOAL_G = 120;

type SeedLog = {
  id: string;
  foodName: string;
  protein: number;
  carbs?: number;
  fat?: number;
};

async function seed(page: Page, logs: SeedLog[] = [], goal: number = GOAL_G) {
  await seedWelcomeSeen(page);
  await page.addInitScript(
    ({ logs, date, goal }) => {
      try {
        localStorage.setItem(
          "yfos:settings",
          JSON.stringify({ proteinGoal: goal }),
        );
        localStorage.setItem(
          "yfos:foodLogs",
          JSON.stringify(
            logs.map((l) => ({
              id: l.id,
              date,
              mealType: "lunch",
              foodName: l.foodName,
              quantityText: "מנה",
              protein: l.protein,
              carbs: l.carbs ?? 0,
              fat: l.fat ?? 0,
            })),
          ),
        );
      } catch {
        /* ignore */
      }
    },
    { logs, date: todayISO(), goal },
  );
}

/** Fill the manual add form (/nutrition/add) with a protein amount and submit. */
async function manualAdd(page: Page, foodName: string, protein: number) {
  // "מה אכלת?" is a substring of "כמה אכלת?" (quantity), so match the name exactly.
  await page.getByLabel("מה אכלת?", { exact: true }).fill(foodName);
  await page.locator("#protein").fill(String(protein));
  await page.getByRole("button", { name: "הוסף ליומן" }).click();
}

test("no celebration on load when the goal is already reached", async ({
  page,
}) => {
  // 130g / 120g already logged — a plain page load must never celebrate.
  await seed(page, [{ id: "f1", foodName: "עוף", protein: 130 }]);
  await page.goto("/nutrition");
  await expect(page.getByRole("heading", { name: "יומן האוכל של היום · 1" })).toBeVisible();
  await expect(page.locator(CELEBRATION)).toHaveCount(0);
});

test("adding food below the goal does not celebrate", async ({ page }) => {
  // 70g logged, goal 120 — adding 30g reaches only 100g (still below).
  await seed(page, [{ id: "f1", foodName: "יוגורט", protein: 70 }]);
  await page.goto("/nutrition/add");
  await manualAdd(page, "ביצים", 30);
  await expect(page.locator(CELEBRATION)).toHaveCount(0);
});

test("manual add that crosses the protein goal triggers the overlay", async ({
  page,
}) => {
  // 100g logged, goal 120 — adding 30g crosses to 130g.
  await seed(page, [{ id: "f1", foodName: "טונה", protein: 100 }]);
  await page.goto("/nutrition/add");
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  await manualAdd(page, "גבינה", 30);

  const overlay = page.locator(CELEBRATION);
  await expect(overlay).toBeVisible();
  await expect(overlay.getByText("יעד החלבון הושלם")).toBeVisible();
  // One-shot — it self-dismisses with no modal to close.
  await expect(overlay).toHaveCount(0, { timeout: 4000 });
});

test("adding another food after the goal is already reached does not re-trigger", async ({
  page,
}) => {
  // 130g already logged (over the 120g goal). Another add stays over — no edge.
  await seed(page, [{ id: "f1", foodName: "סטייק", protein: 130 }]);
  await page.goto("/nutrition/add");
  await manualAdd(page, "אגוזים", 20);
  await expect(page.locator(CELEBRATION)).toHaveCount(0);
});

test("the journal add-again (recent food) path can trigger the celebration", async ({
  page,
}) => {
  // 90g logged, goal 120 — re-adding the same 90g item crosses to 180g.
  await seed(page, [{ id: "f1", foodName: "חזה עוף", protein: 90 }]);
  await page.goto("/nutrition");
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  await page.getByRole("button", { name: "הוסף שוב — חזה עוף" }).click();

  await expect(page.locator(CELEBRATION)).toBeVisible();
});

test("removing food below the goal then re-adding can celebrate again", async ({
  page,
}) => {
  // Start at 130g (90 + 40), over the 120g goal. Remove the 40g item → 90g
  // (below), then re-add the 90g item via "הוסף שוב" → 180g, a fresh crossing.
  await seed(page, [
    { id: "f1", foodName: "חזה עוף", protein: 90 },
    { id: "f2", foodName: "גבינה", protein: 40 },
  ]);
  await page.goto("/nutrition");

  // Removing an item never crosses *into* the goal, so it must not celebrate.
  // Logs render in seed order (sorted by date only), so the 2nd row is "גבינה".
  await page
    .locator('[aria-label="מחיקת פריט"]')
    .nth(1)
    .click();
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  // Back below the goal at 90g — re-adding the 90g item crosses again.
  await page.getByRole("button", { name: "הוסף שוב — חזה עוף" }).click();
  await expect(page.locator(CELEBRATION)).toBeVisible();
});
