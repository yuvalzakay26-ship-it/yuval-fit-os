import { test, expect } from "@playwright/test";
import { seedWelcomeSeen } from "./fixtures";

// QA for the informational / legal-style pages (privacy / terms / AI disclaimer)
// and the entry points that link to them. Runs against the :3939 server, where
// the beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1) and the
// photo-scan AI is mocked (NUTRITION_AI_MOCK=1), so the nutrition scan card —
// and its "איך עובד ניתוח AI?" link — render in their active state.

test.beforeEach(async ({ page }) => {
  // Dismiss the one-time welcome overlays so they don't intercept clicks.
  await seedWelcomeSeen(page);
});

test("/privacy loads with its heading and careful wording", async ({ page }) => {
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "מדיניות פרטיות", level: 1 }),
  ).toBeVisible();
  // The plain-language, not-legal-advice note is present.
  await expect(page.getByText(/אינו מהווה ייעוץ משפטי/)).toBeVisible();
  // Local-first claim is stated.
  await expect(page.getByText(/local-first/i)).toBeVisible();
});

test("/terms loads with its heading", async ({ page }) => {
  await page.goto("/terms");
  await expect(
    page.getByRole("heading", { name: "תנאי שימוש ובטא", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(/מוצר בבטא ובפיתוח/)).toBeVisible();
});

test("/ai-disclaimer loads and frames AI as an estimate-only draft", async ({
  page,
}) => {
  await page.goto("/ai-disclaimer");
  await expect(
    page.getByRole("heading", { name: "הבהרת AI ותזונה", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(/הערכה בלבד/).first()).toBeVisible();
  await expect(page.getByText(/המשתמש מאשר לפני שמירה/)).toBeVisible();
});

test("System Hub links to all three info pages", async ({ page }) => {
  await page.goto("/more");
  await expect(page.getByRole("link", { name: /מדיניות פרטיות/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /תנאי שימוש ובטא/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /הבהרת AI ותזונה/ })).toBeVisible();

  // The privacy card actually navigates to /privacy.
  await page.getByRole("link", { name: /מדיניות פרטיות/ }).click();
  await expect(page).toHaveURL(/\/privacy$/);
});

test("nutrition scan card shows the AI disclaimer link", async ({ page }) => {
  await page.goto("/nutrition");
  const link = page.getByRole("link", { name: "איך עובד ניתוח AI?" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/ai-disclaimer$/);
  await expect(
    page.getByRole("heading", { name: "הבהרת AI ותזונה", level: 1 }),
  ).toBeVisible();
});
