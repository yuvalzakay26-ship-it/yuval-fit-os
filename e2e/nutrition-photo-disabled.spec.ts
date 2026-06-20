import { test, expect, type Page } from "@playwright/test";
import { seedWelcomeSeen } from "./fixtures";

// Dormant value-extractor QA (Nutrition IA Reset). This project runs against the
// :3940 dev server, started WITHOUT any AI env (see playwright.config.ts), so
// `isNutritionAiConfigured()` is false and `/nutrition` renders the inert
// `PhotoScanCardDisabled` (the "חלץ ערכים מתמונה או טקסט · בקרוב" placeholder)
// instead of the active capture flow.
//
// Hard guarantees verified here: the placeholder is still visible, it never
// mounts a file input or opens upload, it never calls POST
// /api/nutrition/analyze-photo, it logs no console errors, and the manual / from
// recipe / add-again alternatives stay usable.

async function gotoNutrition(page: Page) {
  await seedWelcomeSeen(page);
  await page.goto("/nutrition");
}

test("extractor placeholder appears in a 'בקרוב' state when AI is disabled", async ({
  page,
}) => {
  await gotoNutrition(page);
  await expect(
    page.getByText("חלץ ערכים מתמונה או טקסט", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/בעתיד תוכל להעלות תמונה של תווית או להדביק טקסט/),
  ).toBeVisible();
  // "בקרוב" appears twice on the placeholder (the badge + the disabled button).
  await expect(page.getByText("בקרוב", { exact: true }).first()).toBeVisible();
});

test("dormant extractor shows a non-interactive 'בקרוב' button", async ({
  page,
}) => {
  await gotoNutrition(page);
  const cta = page.getByRole("button", { name: /בקרוב/ });
  await expect(cta).toBeVisible();
  await expect(cta).toBeDisabled();
});

test("dormant extractor never mounts a file input or opens upload", async ({ page }) => {
  await gotoNutrition(page);
  // The active flow mounts two hidden <input type=file>; the placeholder must not.
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  // Tapping the inert card never reveals the pre-capture sheet.
  await page.getByText("חלץ ערכים מתמונה או טקסט", { exact: true }).click();
  await expect(
    page.getByText(/התמונה משמשת ליצירת טיוטת תזונה בלבד/),
  ).toHaveCount(0);
});

test("dormant extractor makes no call to the analyze route and logs no errors", async ({
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
  await page.getByText("חלץ ערכים מתמונה או טקסט", { exact: true }).click();
  await expect(page.getByText("בקרוב", { exact: true }).first()).toBeVisible();

  expect(analyzeCalls).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("dormant extractor points to always-available alternatives", async ({
  page,
}) => {
  await gotoNutrition(page);
  // The helper line names alternatives that are always reachable (unlike
  // "הוסף שוב", which needs prior meals): manual, from recipe, from an item.
  await expect(
    page.getByText("בינתיים אפשר להוסיף ידנית, ממתכון או מפריט קיים"),
  ).toBeVisible();
});

test("'הוספה ליומן' command area presents the three add actions", async ({
  page,
}) => {
  await gotoNutrition(page);
  // One clearly-titled command area with its helper line.
  await expect(page.getByText("הוספה ליומן", { exact: true })).toBeVisible();
  await expect(page.getByText("בחר איך לרשום מה שאכלת בפועל")).toBeVisible();
  // The three actions: manual, from recipe, and the (dormant) value extractor —
  // each present exactly once. The generic catalog is NOT one of them; it lives
  // lower as a quiet helper.
  await expect(page.getByText("הוסף ידנית", { exact: true })).toHaveCount(1);
  await expect(page.getByText("הוסף ממתכון", { exact: true })).toHaveCount(1);
  await expect(
    page.getByText("חלץ ערכים מתמונה או טקסט", { exact: true }),
  ).toHaveCount(1);
  // "בחר מהמאגר" (the old catalog CTA) is gone from the command area entirely.
  await expect(page.getByText("בחר מהמאגר", { exact: true })).toHaveCount(0);
  // "הוסף ממתכון" navigates to the recipe library.
  await page.getByText("הוסף ממתכון", { exact: true }).click();
  await expect(page).toHaveURL(/\/recipes$/);
});

test("daily summary leads and secondary trackers sit lower", async ({ page }) => {
  await gotoNutrition(page);
  // "תזונה היום" daily nutrition summary renders near the top.
  await expect(page.getByText("תזונה היום", { exact: true })).toBeVisible();
  await expect(page.getByText("קלוריות היום")).toBeVisible();
  // Water + supplements stay available but framed as secondary tracking.
  await expect(page.getByText("מעקבים נוספים", { exact: true })).toBeVisible();
});

test("recipe library has its own entry card to /recipes", async ({ page }) => {
  await gotoNutrition(page);
  const cta = page.getByRole("link", { name: /פתח ספריית מתכונים/ });
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/recipes$/);
});

test("the lowered food catalog is renamed and clarified", async ({ page }) => {
  await gotoNutrition(page);
  // The generic catalog is kept but quiet, under "כלים נוספים", honestly framed
  // (no preset values — the user fills them).
  const cta = page.getByRole("link", { name: /הוסף מפריט קיים/ });
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/nutrition\/library/);
});

test("empty food journal renders calm, button-free copy", async ({ page }) => {
  await gotoNutrition(page);
  // Source-of-truth title; empty on a fresh device.
  await expect(page.getByText("יומן האוכל של היום", { exact: true })).toBeVisible();
  await expect(page.getByText("עדיין לא נרשם אוכל היום")).toBeVisible();
  await expect(
    page.getByText("הוסף ארוחה כדי להתחיל לעקוב — פעולות ההוספה נמצאות למעלה."),
  ).toBeVisible();
  // Add actions live in the "הוספה ליומן" area above, so the empty journal carries
  // no button of its own. "הוסף שוב" is hidden on a fresh device (no recents).
  await expect(page.getByText("הוסף ידנית", { exact: true })).toHaveCount(1);
  await expect(page.getByText("הוסף שוב", { exact: true })).toHaveCount(0);
});

test("manual add stays available and navigates to the manual flow", async ({ page }) => {
  await gotoNutrition(page);
  await expect(page.getByText("הוסף ידנית", { exact: true }).first()).toBeVisible();
  await page.getByText("הוסף ידנית", { exact: true }).first().click();
  await expect(page).toHaveURL(/\/nutrition\/add/);
});
