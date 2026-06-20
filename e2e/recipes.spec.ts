import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen } from "./fixtures";

// QA for Recipe Library V1 / V1.1 (docs/RECIPE_LIBRARY_V1.md). Runs against the
// :3939 server where the beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1).
// The recipe data is a static local-first seed (lib/recipes.ts) — no backend, no
// new storage key. We assert the screen loads, the list renders, a detail view
// shows nutrition + ingredients + steps, search/filter works, the Nutrition entry
// point links here, "add to food log" writes a real today entry, V1.1 recipe
// images render (Yuval's own food photos under /recipes/protein-sweets/, never
// sourced from the private reference PDF), recipes with no image show the safe
// placeholder (no <img>), and no horizontal overflow at narrow widths.

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
  // Click the recipe link and wait for the client navigation. Under heavy
  // parallel load the Next.js <Link> can briefly swallow a click that lands in
  // the hydration window (preventDefault attached before the router can push),
  // so retry the click until the URL actually changes.
  await expect(async () => {
    if (!/\/recipes\/pancake-pro$/.test(page.url())) {
      await page
        .getByRole("link", { name: "פתח את המתכון פנקייק פרו", exact: true })
        .click({ timeout: 2000 });
    }
    expect(page.url()).toMatch(/\/recipes\/pancake-pro$/);
  }).toPass({ timeout: 15000, intervals: [400, 800, 1500] });
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

test("the recipe list shows real recipe images (V1.1)", async ({ page }) => {
  await seedWelcomeSeen(page);
  await page.goto("/recipes");
  // V1.1 ships Yuval's food photos for most recipes, served via next/image.
  const images = page.getByTestId("recipe-list").locator("img");
  expect(await images.count()).toBeGreaterThan(0);
  await expect(images.first()).toBeVisible();
});

test("a recipe with an image shows it (not the placeholder), from a safe path", async ({
  page,
}) => {
  await seedWelcomeSeen(page);
  await page.goto("/recipes/pancake-pro");
  // pancake-pro has a V1.1 image, so a real <img> renders on the detail view.
  const img = page.locator("img").first();
  await expect(img).toBeVisible();
  // The optimized next/image src must reference Yuval's recipe folder and must
  // never point at the private reference inputs or any PDF.
  const src = (await img.getAttribute("src")) ?? "";
  expect(src).toContain("protein-sweets");
  expect(src.toLowerCase()).not.toContain("private-input");
  expect(src.toLowerCase()).not.toContain("pdf");
  await expect(page.getByText("פנקייק פרו").first()).toBeVisible();
});

test("recipes with no image show a safe placeholder (no <img>)", async ({
  page,
}) => {
  await seedWelcomeSeen(page);
  // protein-shakshuka has no V1.1 image, so the gradient placeholder renders the
  // title and no real <img> element is present on the detail view.
  await page.goto("/recipes/protein-shakshuka");
  await expect(page.locator("img")).toHaveCount(0);
  await expect(page.getByText("שקשוקה חלבונית").first()).toBeVisible();
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
