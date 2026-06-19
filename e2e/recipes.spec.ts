import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen } from "./fixtures";

// QA for Recipe Library V1 (docs/RECIPE_LIBRARY_V1.md). Runs against the :3939
// server where the beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1).
// The recipe data is a static local-first seed (lib/recipes.ts) — no backend, no
// new storage key. We assert the screen loads, the list renders, a detail view
// shows nutrition + ingredients + steps, search/filter works, the Nutrition entry
// point links here, "add to food log" writes a real today entry, recipes with no
// image show the safe placeholder (no <img>), and no horizontal overflow at narrow
// widths.

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  // Allow a 1px rounding tolerance.
  expect(overflow).toBeLessThanOrEqual(1);
}

test("/recipes loads with its title and subtitle", async ({ page }) => {
  await seedWelcomeSeen(page);
  await page.goto("/recipes");
  await expect(
    page.getByRole("heading", { name: "ספריית מתכונים" }),
  ).toBeVisible();
  await expect(
    page.getByText("מתכוני חלבון ומתוקים שאפשר לשמור ליומן התזונה."),
  ).toBeVisible();
});

test("the recipe list shows recipes", async ({ page }) => {
  await seedWelcomeSeen(page);
  await page.goto("/recipes");
  const items = page.getByTestId("recipe-list").getByRole("listitem");
  expect(await items.count()).toBeGreaterThan(5);
  await expect(page.getByRole("link", { name: /פנקייק פרו/ }).first()).toBeVisible();
});

test("opening a recipe shows nutrition, ingredients and steps", async ({
  page,
}) => {
  await seedWelcomeSeen(page);
  await page.goto("/recipes");
  await page
    .getByRole("link", { name: "פתח את המתכון פנקייק פרו", exact: true })
    .click();
  await expect(page).toHaveURL(/\/recipes\/pancake-pro$/);
  await expect(page.getByRole("heading", { name: "פנקייק פרו" })).toBeVisible();
  // Nutrition section + a known value from the source (must not be altered).
  await expect(page.getByRole("heading", { name: "ערכים תזונתיים" })).toBeVisible();
  await expect(page.getByText("485", { exact: false }).first()).toBeVisible();
  // Ingredients + steps sections render.
  await expect(page.getByRole("heading", { name: "מצרכים" })).toBeVisible();
  await expect(page.getByText("40 גרם אבקת חלבון")).toBeVisible();
  await expect(page.getByRole("heading", { name: "אופן הכנה" })).toBeVisible();
});

test("search and category filter narrow the list", async ({ page }) => {
  await seedWelcomeSeen(page);
  await page.goto("/recipes");
  const list = page.getByTestId("recipe-list");

  // Free-text search.
  await page.getByLabel("חיפוש בספריית המתכונים").fill("שקשוקה");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /שקשוקה חלבונית/ })).toBeVisible();

  // Clearing search restores the full list, then a category chip filters it.
  await page.getByLabel("חיפוש בספריית המתכונים").fill("");
  await page.getByRole("button", { name: "שייקים" }).click();
  const titles = await list.getByRole("listitem").allInnerTexts();
  expect(titles.length).toBeGreaterThan(0);
  expect(titles.every((t) => t.includes("מילקשייק"))).toBeTruthy();
});

test("the Nutrition screen links to the recipe library", async ({ page }) => {
  await seedWelcomeSeen(page);
  await page.goto("/nutrition");
  const link = page.getByRole("link", { name: /ספריית מתכונים/ }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole("heading", { name: "ספריית מתכונים" })).toBeVisible();
});

test("'הוסף ליומן התזונה' creates a today food-log entry", async ({ page }) => {
  await seedWelcomeSeen(page);
  await page.goto("/recipes/snickers-milkshake");
  await page.getByRole("button", { name: "הוסף ליומן התזונה" }).click();
  await expect(page.getByText("נוסף ליומן התזונה של היום")).toBeVisible();

  // The entry is a real food log — it shows up in today's journal.
  await page.goto("/nutrition");
  await expect(page.getByText("יומן האוכל של היום", { exact: false })).toBeVisible();
  await expect(page.getByText("מילקשייק סניקרס").first()).toBeVisible();
});

test("recipes with no image show a safe placeholder (no <img>)", async ({
  page,
}) => {
  await seedWelcomeSeen(page);
  await page.goto("/recipes/pancake-pro");
  // V1 ships no recipe images, so the gradient placeholder renders the title
  // and no real <img> element is present on the detail view.
  await expect(page.locator("img")).toHaveCount(0);
  await expect(page.getByText("פנקייק פרו").first()).toBeVisible();
});

test("no horizontal overflow at 360px and 390px", async ({ page }) => {
  await seedWelcomeSeen(page);

  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/recipes");
  await expectNoHorizontalOverflow(page);
  await page.goto("/recipes/carrot-cake");
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/recipes");
  await expectNoHorizontalOverflow(page);
  await page.goto("/recipes/blueberry-cheesecake");
  await expectNoHorizontalOverflow(page);
});
