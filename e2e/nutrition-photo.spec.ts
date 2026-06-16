import { test, expect, type Page } from "@playwright/test";

// End-to-end QA for photo-first nutrition logging (Phase 3.xx). Relies on the
// dev-server seams set in playwright.config.ts:
//   NUTRITION_AI_MOCK=1  → /api/nutrition/analyze-photo returns a fixture draft
//   NEXT_PUBLIC_BETA_DISABLE_GATE=1 → the access gate is open
//
// A 1x1 PNG is enough — the mock ignores image content but the route still
// validates type + size, exactly like production.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function uploadPlate(page: Page) {
  // The two hidden inputs are always mounted; the second is the plain uploader.
  await page.locator('input[type="file"]').nth(1).setInputFiles({
    name: "plate.png",
    mimeType: "image/png",
    buffer: PNG_1x1,
  });
}

/** Values of the editable food-name inputs on the review screen. */
function draftNames(page: Page) {
  return page
    .locator('input[placeholder="שם המאכל"]')
    .evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
}

test.beforeEach(async ({ page }) => {
  // Mark the one-time welcome overlays as seen so they don't intercept clicks.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/nutrition");
});

test("scan card is the primary action when AI is enabled", async ({ page }) => {
  await expect(page.getByText("סרוק צלחת", { exact: true })).toBeVisible();
  await expect(page.getByText("צלם את הארוחה ונבנה לך טיוטת תזונה לעריכה")).toBeVisible();
  await expect(page.getByRole("button", { name: /סרוק עכשיו/ })).toBeVisible();
  // Fallback actions stay visible underneath.
  await expect(page.getByText("הוסף ידנית", { exact: true }).first()).toBeVisible();
});

test("pre-capture sheet shows the privacy + estimate note", async ({ page }) => {
  await page.getByRole("button", { name: /סרוק עכשיו/ }).click();
  await expect(
    page.getByText(/התמונה משמשת ליצירת טיוטת תזונה בלבד/),
  ).toBeVisible();
  await expect(page.getByText(/התמונה נשלחת לניתוח בלבד ואינה נשמרת/)).toBeVisible();
});

test("upload → editable draft → confirm saves to today's journal", async ({ page }) => {
  await uploadPlate(page);

  // Review screen with the mocked items.
  await expect(page.getByRole("heading", { name: "טיוטה מהתמונה" })).toBeVisible();
  await expect(page.getByText("הערכה בלבד · כדאי לבדוק לפני הוספה ליומן")).toBeVisible();
  expect(await draftNames(page)).toEqual(
    expect.arrayContaining(["חזה עוף בגריל", "אורז לבן"]),
  );

  // No auto-save: the diary is still empty before confirmation.
  await expect(page.getByText("עדיין לא נרשם אוכל היום")).toBeVisible();

  // Confirm.
  await page.getByRole("button", { name: /נראה טוב, הוסף ליומן/ }).click();

  // Both items now appear in today's diary (and in recents) — the empty state
  // is gone. They show twice (diary + "add again"), so scope to the first.
  await expect(page.getByText("עדיין לא נרשם אוכל היום")).toHaveCount(0);
  await expect(page.getByText("חזה עוף בגריל").first()).toBeVisible();
  await expect(page.getByText("אורז לבן").first()).toBeVisible();
});

test("user can remove an item before saving", async ({ page }) => {
  await uploadPlate(page);
  // Wait for the review screen to render before reading the draft inputs — the
  // analyze-photo round-trip is async, so reading immediately can race it.
  await expect(page.getByRole("heading", { name: "טיוטה מהתמונה" })).toBeVisible();
  expect(await draftNames(page)).toContain("אורז לבן");
  await page.getByRole("button", { name: /הסר מאכל מהטיוטה — אורז לבן/ }).click();
  await expect
    .poll(async () => (await draftNames(page)).includes("אורז לבן"))
    .toBe(false);
  expect(await draftNames(page)).toContain("חזה עוף בגריל");

  await page.getByRole("button", { name: /נראה טוב, הוסף ליומן/ }).click();
  await expect(page.getByText("חזה עוף בגריל").first()).toBeVisible();
  // The removed item was never saved.
  await expect(page.getByText("אורז לבן")).toHaveCount(0);
});

test("retry returns to the capture sheet", async ({ page }) => {
  await uploadPlate(page);
  await expect(page.getByRole("heading", { name: "טיוטה מהתמונה" })).toBeVisible();
  await page.getByRole("button", { name: /נסה שוב/ }).click();
  await expect(
    page.getByText(/התמונה משמשת ליצירת טיוטת תזונה בלבד/),
  ).toBeVisible();
});
