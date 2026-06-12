// Phase 3.1 QA: workout templates + last performance. Drives the real flows:
// default templates render, start-from-template prefills the builder, saving
// lands in history, last performance shows up on the next run, template
// create/edit/delete work, and duplicate-last-workout prefills correctly.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "qa/screens";
mkdirSync(OUT, { recursive: true });

const issues = [];
const ok = (label) => console.log(" ✓ " + label);
const fail = (label) => issues.push(label);
const check = (cond, label) => (cond ? ok(label) : fail(label));

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(BASE + "/workouts", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  /* ------------------ Default templates render once ------------------ */
  let body = await page.textContent("body");
  check(
    ["גב + יד קדמית", "חזה + כתפיים", "רגליים", "Full Body"].every((t) =>
      body.includes(t),
    ),
    "default templates render",
  );
  await page.reload({ waitUntil: "networkidle" });
  const startButtons = await page.getByRole("button", { name: "התחל אימון" }).count();
  check(startButtons === 4, `no duplicate seeding after reload (${startButtons} templates)`);

  /* --------------- Start from template → save workout ---------------- */
  await page
    .locator("div", { hasText: "גב + יד קדמית" })
    .getByRole("button", { name: "התחל אימון" })
    .first()
    .click();
  await page.waitForTimeout(200);
  const builderTitle = await page.inputValue("#workout-title");
  check(builderTitle === "גב + יד קדמית", "builder title prefilled from template");
  body = await page.textContent("body");
  check(
    body.includes("פולי עליון") && body.includes("כפיפת מרפקים"),
    "template exercises added to builder",
  );
  check(body.includes("אין ביצוע קודם עדיין"), "empty last-performance note shown");
  await page.screenshot({ path: `${OUT}/tpl-builder-from-template.png`, fullPage: true });

  // Fill the first exercise's sets and save.
  const numInputs = page.locator('input[type="number"]');
  const fills = [45, 12, 50, 10, 50, 8];
  for (let i = 0; i < fills.length; i++) await numInputs.nth(i).fill(String(fills[i]));
  await page.getByRole("button", { name: "שמירת אימון" }).click();
  await page.waitForTimeout(400);
  body = await page.textContent("body");
  check(body.includes("גב + יד קדמית"), "saved workout appears in history");

  /* ------------- Last performance appears on the next run ------------ */
  await page
    .locator("div", { hasText: "גב + יד קדמית" })
    .getByRole("button", { name: "התחל אימון" })
    .first()
    .click();
  await page.waitForTimeout(200);
  body = await page.textContent("body");
  check(body.includes("פעם קודמת:"), "last-performance hint shown in builder");
  check(body.includes("45×12, 50×10, 50×8"), "last-performance sets summary correct");
  const prefilledWeight = await numInputs.first().inputValue();
  check(prefilledWeight === "45", "sets prefilled from last performance");
  await page.screenshot({ path: `${OUT}/tpl-builder-last-performance.png`, fullPage: true });
  await page.getByRole("button", { name: "ביטול" }).click();

  /* ------------------ Last performance in exercise lib ---------------- */
  await page.goto(BASE + "/exercises", { waitUntil: "networkidle" });
  await page.getByText("פולי עליון").first().click();
  await page.waitForTimeout(300);
  body = await page.textContent("body");
  check(body.includes("45×12, 50×10, 50×8"), "exercise card shows last-performance sets");

  /* --------------------- Create / edit / delete ----------------------- */
  await page.goto(BASE + "/workouts", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "תבנית חדשה" }).click();
  await page.fill("#template-title", "תבנית בדיקה");
  await page.selectOption("#template-exercise-picker", "squat");
  await page.waitForTimeout(150);
  await page.selectOption("#template-exercise-picker", "plank");
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "שמירת תבנית" }).click();
  await page.waitForTimeout(300);
  body = await page.textContent("body");
  check(body.includes("תבנית בדיקה"), "new template created");

  const testCard = page.locator("div.rounded-2xl", { hasText: "תבנית בדיקה" }).last();
  await testCard.getByRole("button", { name: "עריכת תבנית" }).click();
  await page.fill("#template-title", "תבנית בדיקה 2");
  await page.getByRole("button", { name: "שמירת שינויים" }).click();
  await page.waitForTimeout(300);
  body = await page.textContent("body");
  check(body.includes("תבנית בדיקה 2"), "template title edited");

  const editedCard = page.locator("div.rounded-2xl", { hasText: "תבנית בדיקה 2" }).last();
  await editedCard.getByRole("button", { name: "מחיקת תבנית" }).click();
  await page.getByRole("button", { name: "מחיקה", exact: true }).click();
  await page.waitForTimeout(300);
  body = await page.textContent("body");
  check(!body.includes("תבנית בדיקה 2"), "template deleted after confirmation");
  await page.reload({ waitUntil: "networkidle" });
  body = await page.textContent("body");
  check(!body.includes("תבנית בדיקה 2"), "deleted template does not reappear after reload");

  /* --------------------- Duplicate last workout ----------------------- */
  await page.getByRole("button", { name: "שכפל אימון אחרון" }).click();
  await page.waitForTimeout(200);
  const dupTitle = await page.inputValue("#workout-title");
  check(dupTitle === "גב + יד קדמית", "duplicate prefills last workout title");
  const dupWeight = await page.locator('input[type="number"]').first().inputValue();
  check(dupWeight === "45", "duplicate copies sets from last workout");
  await page.getByRole("button", { name: "ביטול" }).click();

  /* --------------------- Save history as template --------------------- */
  await page.locator('button[aria-label="שמירת האימון כתבנית"]').first().click();
  await page.waitForTimeout(300);
  const startCount = await page.getByRole("button", { name: "התחל אימון" }).count();
  check(startCount === 5, `workout saved as template (${startCount} templates)`);

  /* ----------------------------- Dark mode ---------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/workouts", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/tpl-workouts-dark.png`, fullPage: true });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  check(!overflow, "no horizontal overflow on workouts (dark, 390px)");

  await browser.close();
  console.log("\n===== TEMPLATE QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("TEMPLATE QA RUN FAILED:", e);
  process.exit(1);
});
