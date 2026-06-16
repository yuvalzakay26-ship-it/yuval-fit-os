import { test, expect, type Page } from "@playwright/test";

// Disabled / "coming soon" photo-scan QA (Phase 3.xx). This project runs against
// the :3940 dev server, started WITHOUT any AI env (see playwright.config.ts), so
// `isNutritionAiConfigured()` is false and `/nutrition` renders the inert
// `PhotoScanCardDisabled` instead of the active capture flow.
//
// Hard guarantees verified here: the card is still visible, it never mounts a
// file input or opens upload, it never calls POST /api/nutrition/analyze-photo,
// it logs no console errors, and the manual / "add again" fallbacks stay usable.

async function gotoNutrition(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/nutrition");
}

test("scan card still appears in a 'בקרוב' state when AI is disabled", async ({
  page,
}) => {
  await gotoNutrition(page);
  await expect(page.getByText("סרוק צלחת", { exact: true })).toBeVisible();
  await expect(page.getByText("ניתוח ארוחה מתמונה יופעל בקרוב")).toBeVisible();
  await expect(page.getByText("בקרוב", { exact: true })).toBeVisible();
});

test("disabled card shows a non-interactive 'לא פעיל כרגע' button", async ({
  page,
}) => {
  await gotoNutrition(page);
  const cta = page.getByRole("button", { name: /לא פעיל כרגע/ });
  await expect(cta).toBeVisible();
  await expect(cta).toBeDisabled();
});

test("disabled card never mounts a file input or opens upload", async ({ page }) => {
  await gotoNutrition(page);
  // The active flow mounts two hidden <input type=file>; the disabled card must not.
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  // Tapping the inert card never reveals the pre-capture sheet.
  await page.getByText("סרוק צלחת", { exact: true }).click();
  await expect(
    page.getByText(/התמונה משמשת ליצירת טיוטת תזונה בלבד/),
  ).toHaveCount(0);
});

test("disabled card makes no call to the analyze route and logs no errors", async ({
  page,
}) => {
  const analyzeCalls: string[] = [];
  page.on("request", (req) => {
    if (
      req.method() === "POST" &&
      req.url().includes("/api/nutrition/analyze-photo")
    ) {
      analyzeCalls.push(req.url());
    }
  });
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await gotoNutrition(page);
  await page.getByText("סרוק צלחת", { exact: true }).click();
  await expect(page.getByText("בקרוב", { exact: true })).toBeVisible();

  expect(analyzeCalls).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("disabled card points to the always-available catalog fallback", async ({
  page,
}) => {
  await gotoNutrition(page);
  // The helper line names a fallback that is always reachable (unlike "הוסף שוב",
  // which needs prior meals). Catalog is always available.
  await expect(
    page.getByText("בינתיים אפשר להוסיף ידנית או לבחור מהמאגר"),
  ).toBeVisible();
});

test("empty food journal renders calm, non-duplicative copy", async ({ page }) => {
  await gotoNutrition(page);
  // Source of truth for today's food. On a fresh device it is empty.
  await expect(page.getByText("היומן של היום", { exact: true })).toBeVisible();
  await expect(page.getByText("עדיין לא נרשם אוכל היום")).toBeVisible();
  await expect(
    page.getByText("הוסף ארוחה כדי להתחיל לעקוב — פעולות ההוספה נמצאות למעלה."),
  ).toBeVisible();
  // The empty journal no longer repeats "הוסף ידנית" (already in the quick
  // actions above); it keeps a single, distinct catalog CTA instead.
  await expect(page.getByText("הוסף ידנית", { exact: true })).toHaveCount(1);
  await expect(page.getByText("בחר מהמאגר", { exact: true })).toBeVisible();
});

test("manual add and add-again fallbacks stay available", async ({ page }) => {
  await gotoNutrition(page);
  // "הוסף ידנית" is always present and navigates to the manual flow.
  await expect(page.getByText("הוסף ידנית", { exact: true }).first()).toBeVisible();
  // "הוסף שוב" is rendered (it just has no recents to reveal on a fresh device).
  await expect(page.getByText("הוסף שוב", { exact: true }).first()).toBeVisible();

  await page.getByText("הוסף ידנית", { exact: true }).first().click();
  await expect(page).toHaveURL(/\/nutrition\/add/);
});
