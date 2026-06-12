// One-off QA pass for the Exercises screen after the image import.
// Usage: node scripts/qa-exercises.mjs (expects `next start -p 3199` running)
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3199";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];

async function makePage(colorScheme) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme,
  });
  const page = await ctx.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${colorScheme}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[${colorScheme}] pageerror: ${err.message}`));
  return page;
}

for (const scheme of ["dark", "light"]) {
  const page = await makePage(scheme);
  await page.goto(`${BASE}/exercises`, { waitUntil: "networkidle" });

  // No horizontal overflow.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`[${scheme}] horizontal overflow px: ${overflow}`);

  // Count real images vs placeholders on "all".
  const imgCount = await page.locator('img[src*="exercises%2F"]').count();
  console.log(`[${scheme}] real exercise <img> tags: ${imgCount}`);

  await page.screenshot({ path: `${OUT}/exercises-${scheme}-all.png` });

  // Chest filter.
  await page.getByRole("button", { name: "חזה", exact: true }).click();
  await page.waitForTimeout(600);
  const chestCards = await page.locator('img[src*="chest%2F"]').count();
  console.log(`[${scheme}] chest filter: ${chestCards} chest images visible`);
  await page.screenshot({ path: `${OUT}/exercises-${scheme}-chest.png` });

  // Back filter + expand first card for the large image.
  await page.getByRole("button", { name: "גב", exact: true }).click();
  await page.waitForTimeout(600);
  const backCards = await page.locator('img[src*="back%2F"]').count();
  console.log(`[${scheme}] back filter: ${backCards} back images visible`);
  await page.locator('button[aria-expanded="false"]').first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/exercises-${scheme}-back-expanded.png` });

  await page.context().close();
}

// Fallback check: an exercise without imagePath (e.g. squat) must render the placeholder.
const page = await makePage("dark");
await page.goto(`${BASE}/exercises`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "רגליים", exact: true }).click();
await page.waitForTimeout(400);
const legsImgs = await page.locator('img[src*="exercises%2F"]').count();
console.log(`legs filter (no images wired): ${legsImgs} real images (expect 0, placeholder used)`);
await page.screenshot({ path: `${OUT}/exercises-fallback-legs.png` });
await page.context().close();

await browser.close();
console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join("\n")}` : "No console errors.");
