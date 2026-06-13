import { chromium } from "@playwright/test";
import { openManualAdd, saveLog } from "./nutrition-helpers.mjs";
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = "qa/screens";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => {
  try {
    localStorage.setItem("yfos:welcome-seen:v1", "1");
    sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
  } catch {}
});

// Build a workout (creates history) + builder view with new tap targets.
await page.goto(BASE + "/workouts?new=1", { waitUntil: "networkidle" });
await page.fill("#workout-title", "בדיקת מטרות מגע");
// Add an exercise via the full-screen visual picker (replaced the old select).
await page.getByRole("button", { name: "בחר תרגיל ראשון" }).click();
await page.waitForTimeout(200);
await page.getByLabel("הוספת סקוואט לאימון").click();
await page.waitForTimeout(120);
await page.getByRole("button", { name: /^סיום/ }).click();
await page.waitForTimeout(200);
await page.getByText("הוספת סט").first().click();
await page.waitForTimeout(120);
const inputs = page.locator(".rounded-xl input[type=number]");
const vals = [80, 10, 90, 8];
for (let i = 0; i < Math.min(await inputs.count(), vals.length); i++) await inputs.nth(i).fill(String(vals[i]));
await page.screenshot({ path: `${OUT}/verify-builder.png`, fullPage: false });
await page.getByRole("button", { name: "שמירת אימון" }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/verify-history.png`, fullPage: false });

// Nutrition delete tap target (add via the manual add sheet first).
await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
await openManualAdd(page);
await page.fill("#food-name", "ביצים");
await page.fill("#protein", "12");
await saveLog(page);
await page.screenshot({ path: `${OUT}/verify-nutrition.png`, fullPage: false });

await browser.close();
console.log("verify captures done");
