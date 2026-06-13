// Phase 1.1 mobile QA harness. Drives Chromium at phone widths, checks for
// horizontal overflow + content hidden behind the bottom nav, runs the real
// workout/food flows, and captures light+dark screenshots.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { openManualAdd, saveLog } from "./nutrition-helpers.mjs";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = "qa/screens";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { path: "/", name: "today" },
  { path: "/workouts", name: "workouts" },
  { path: "/exercises", name: "exercises" },
  { path: "/nutrition", name: "nutrition" },
  { path: "/progress", name: "progress" },
  { path: "/settings", name: "settings" },
];
const WIDTHS = [360, 390, 430];

const issues = [];

async function measure(page, route, width, theme) {
  const data = await page.evaluate(() => {
    const de = document.documentElement;
    const nav = document.querySelector("nav[aria-label]");
    const navTop = nav ? nav.getBoundingClientRect().top : null;
    // Find elements that extend past the right/left edges (horizontal overflow).
    let overflowers = 0;
    let maxRight = 0;
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > window.innerWidth + 1) overflowers++;
      if (r.right > maxRight) maxRight = r.right;
    });
    return {
      scrollW: de.scrollWidth,
      clientW: de.clientWidth,
      innerW: window.innerWidth,
      navTop,
      overflowers,
      maxRight: Math.round(maxRight),
    };
  });
  const horizontalOverflow = data.scrollW > data.clientW + 1;
  if (horizontalOverflow) {
    issues.push(
      `[overflow] ${route} @${width} ${theme}: scrollW=${data.scrollW} clientW=${data.clientW} maxRight=${data.maxRight} overflowers=${data.overflowers}`,
    );
  }
  return data;
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const page = await context.newPage();

  // Keep the welcome screen out of the way on every navigation.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
    } catch {}
  });

  // Start clean (but the init script re-seeds the welcome flag on next load).
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());

  /* ---------- Pass 1: empty states, overflow checks, all widths ---------- */
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(BASE + route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);
      await measure(page, route.name, width, "light-empty");
    }
    // One empty-state screenshot at 390.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + route.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT}/empty-${route.name}-390-light.png`, fullPage: true });
  }

  /* ---------------------------- Flow: workout ---------------------------- */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/workouts?new=1", { waitUntil: "networkidle" });
  await page.fill("#workout-title", "אימון גב וחזה - בדיקה");
  await page.selectOption("#exercise-picker", "lat-pulldown");
  await page.waitForTimeout(150);
  await page.selectOption("#exercise-picker", "bench-press");
  await page.waitForTimeout(150);
  // Add a 2nd set to the first exercise.
  await page.getByText("הוספת סט").first().click();
  await page.waitForTimeout(150);
  const numInputs = page.locator(".rounded-xl input[type=number]");
  const count = await numInputs.count();
  // Expected order: ex1 set1 (w,r), ex1 set2 (w,r), ex2 set1 (w,r)
  const fills = [60, 12, 65, 10, 70, 8];
  for (let i = 0; i < Math.min(count, fills.length); i++) {
    await numInputs.nth(i).fill(String(fills[i]));
  }
  // Mark first set completed.
  await page.locator('button[aria-label="סימון סט כבוצע"]').first().click();
  await page.screenshot({ path: `${OUT}/flow-workout-builder-390-light.png`, fullPage: true });
  await page.getByRole("button", { name: "שמירת אימון" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/flow-workout-history-390-light.png`, fullPage: true });
  const historyText = await page.textContent("body");
  if (!historyText.includes("אימון גב וחזה - בדיקה")) {
    issues.push("[flow] workout not visible in history after save");
  }

  /* ----------------------------- Flow: food ------------------------------ */
  // Manual add now opens a focused sheet via the "הוסף ידנית" quick action.
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await openManualAdd(page);
  await page.fill("#food-name", "חזה עוף בגריל");
  await page.fill("#quantity", "200 גרם");
  await page.getByRole("button", { name: "ארוחת צהריים" }).click();
  await page.fill("#protein", "45");
  await page.fill("#carbs", "0");
  await page.fill("#fat", "6");
  await page.fill("#calories", "250");
  await saveLog(page);
  // Add a second item.
  await openManualAdd(page);
  await page.fill("#food-name", "אורז מלא");
  await page.fill("#protein", "8");
  await page.fill("#carbs", "60");
  await page.fill("#fat", "2");
  await page.fill("#calories", "300");
  await saveLog(page);
  await page.screenshot({ path: `${OUT}/flow-nutrition-390-light.png`, fullPage: true });
  const nutText = await page.textContent("body");
  if (!nutText.includes("חזה עוף בגריל")) issues.push("[flow] food log not visible after save");

  /* ------------------- Pass 2: with data, light + dark ------------------- */
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    for (const route of ROUTES) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(BASE + route.path, { waitUntil: "networkidle" });
        await page.waitForTimeout(200);
        await measure(page, route.name, width, `${theme}-data`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(BASE + route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${OUT}/data-${route.name}-390-${theme}.png`, fullPage: true });
    }
  }

  /* ------- Scroll-to-top button position vs bottom nav (exercises) ------- */
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/exercises", { waitUntil: "networkidle" });
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(500);
  const stt = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="גלילה למעלה"]');
    const nav = document.querySelector("nav[aria-label]");
    if (!btn || !nav) return null;
    const b = btn.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    return {
      visible: getComputedStyle(btn).opacity,
      btnBottom: Math.round(b.bottom),
      navTop: Math.round(n.top),
      gap: Math.round(n.top - b.bottom),
      btnRight: Math.round(window.innerWidth - b.right),
    };
  });
  if (stt) {
    if (stt.gap < 4) issues.push(`[scroll-top] overlaps bottom nav (gap=${stt.gap}px)`);
    console.log("scroll-to-top:", JSON.stringify(stt));
  } else {
    issues.push("[scroll-top] button not found after scroll");
  }
  await page.screenshot({ path: `${OUT}/scroll-top-390-light.png` });

  await browser.close();

  console.log("\n===== QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
}

run().catch((e) => {
  console.error("QA RUN FAILED:", e);
  process.exit(1);
});
