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
  // Pre-seed the access gate (Phase 3.5) so QA lands directly on the app.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:access-granted:v1", "1");
    } catch {}
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

  // Legs filter (Phase 3.6 — now has real images).
  await page.getByRole("button", { name: "רגליים", exact: true }).click();
  await page.waitForTimeout(600);
  const legCards = await page.locator('img[src*="legs%2F"]').count();
  console.log(`[${scheme}] legs filter: ${legCards} leg images visible`);
  await page.screenshot({ path: `${OUT}/exercises-${scheme}-legs.png` });

  // Shoulders filter.
  await page.getByRole("button", { name: "כתפיים", exact: true }).click();
  await page.waitForTimeout(600);
  const shoulderCards = await page.locator('img[src*="shoulders%2F"]').count();
  console.log(`[${scheme}] shoulders filter: ${shoulderCards} shoulder images visible`);
  await page.screenshot({ path: `${OUT}/exercises-${scheme}-shoulders.png` });

  // Biceps filter (Phase 3.8 — now has real images).
  await page.getByRole("button", { name: "יד קדמית", exact: true }).click();
  await page.waitForTimeout(600);
  const bicepsCards = await page.locator('img[src*="biceps%2F"]').count();
  console.log(`[${scheme}] biceps filter: ${bicepsCards} biceps images visible`);

  // Triceps filter (Phase 3.9 — now has real images) + expand for the large image.
  await page.getByRole("button", { name: "יד אחורית", exact: true }).click();
  await page.waitForTimeout(600);
  const tricepsCards = await page.locator('img[src*="triceps%2F"]').count();
  console.log(`[${scheme}] triceps filter: ${tricepsCards} triceps images visible`);
  await page.locator('button[aria-expanded="false"]').first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/exercises-${scheme}-triceps-expanded.png` });

  await page.context().close();
}

// Fallback check: an exercise without imagePath (plank) must render the
// placeholder. Core ("ליבה") has no wired images yet.
const page = await makePage("dark");
await page.goto(`${BASE}/exercises`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "ליבה", exact: true }).click();
await page.waitForTimeout(400);
const coreImgs = await page.locator('img[src*="exercises%2F"]').count();
console.log(`core filter (no images wired): ${coreImgs} real images (expect 0, placeholder used)`);
await page.screenshot({ path: `${OUT}/exercises-fallback-core.png` });
await page.context().close();

await browser.close();
console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join("\n")}` : "No console errors.");
