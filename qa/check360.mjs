import { chromium } from "@playwright/test";
import { openManualAdd } from "./nutrition-helpers.mjs";
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = "qa/screens";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => {
  try {
    localStorage.setItem("yfos:welcome-seen:v1", "1");
  } catch {}
});

// Workout builder @360 with two exercises + multi-set.
await page.goto(BASE + "/workouts?new=1", { waitUntil: "networkidle" });
await page.fill("#workout-title", "אימון בדיקה 360");
await page.selectOption("#exercise-picker", "romanian-deadlift");
await page.waitForTimeout(120);
await page.getByText("הוספת סט").first().click();
await page.waitForTimeout(120);
const inputs = page.locator(".rounded-xl input[type=number]");
const vals = [100, 8, 110, 6];
for (let i = 0; i < Math.min(await inputs.count(), vals.length); i++) await inputs.nth(i).fill(String(vals[i]));
await page.screenshot({ path: `${OUT}/check-builder-360.png`, fullPage: false });

// Nutrition form @360 (manual add sheet).
await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
await openManualAdd(page);
await page.fill("#food-name", "יוגורט יווני");
await page.fill("#protein", "18");
await page.fill("#carbs", "9");
await page.fill("#fat", "4");
await page.fill("#calories", "150");
await page.screenshot({ path: `${OUT}/check-nutrition-360.png`, fullPage: false });

await browser.close();
console.log("360 captures done");
