// Visual QA for the premium "Add Food to Journal" flow (Phase 3.22).
//
// Captures the add-food screen at 360px and 390px, in light and dark, for both
// a library food (image context + save-for-next-time) and a blank manual add.
// Also asserts no horizontal overflow at the narrow width.
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = "qa/screens";
const FOOD_ID = "boiled-eggs"; // a known library item from lib/food-library.ts

const browser = await chromium.launch();

async function seed(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem(
        "yfos:private-access-notice-accepted:session",
        "1",
      );
      localStorage.setItem("yfos:admin-access-granted:v1", "1");
    } catch {}
  });
}

async function shoot(width, theme) {
  const ctx = await browser.newContext({
    viewport: { width, height: 860 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  await seed(page);

  // Library food: image context, quantity presets, editable macros, save card.
  await page.goto(`${BASE}/nutrition/add?foodId=${FOOD_ID}`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("#food-name", { timeout: 6000 });
  await page.fill("#protein", "13");
  await page.fill("#carbs", "1");
  await page.fill("#fat", "11");
  await page.fill("#calories", "155");
  await page.waitForTimeout(150);
  await page.screenshot({
    path: `${OUT}/add-food-library-${width}-${theme}.png`,
    fullPage: true,
  });

  // Overflow guard at the narrow widths.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) {
    console.error(`OVERFLOW @${width}/${theme}: ${overflow}px`);
    process.exitCode = 1;
  }

  // Manual add: blank, no save card.
  await page.goto(`${BASE}/nutrition/add`, { waitUntil: "networkidle" });
  await page.waitForSelector("#food-name", { timeout: 6000 });
  await page.fill("#food-name", "שייק חלבון");
  await page.waitForTimeout(150);
  await page.screenshot({
    path: `${OUT}/add-food-manual-${width}-${theme}.png`,
    fullPage: true,
  });

  await ctx.close();
}

for (const width of [360, 390]) {
  for (const theme of ["light", "dark"]) {
    await shoot(width, theme);
  }
}

await browser.close();
console.log("add-food flow captures done");
