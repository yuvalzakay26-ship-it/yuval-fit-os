// Phase 3.16 / 3.17 QA — fats & add-ons food library (new sheet flow).
//
// Drives the Nutrition screen at phone width and verifies the `fats` category:
//  - the "שומנים ותוספות בריאות" category chip exists in the picker
//  - filtering to it shows all fats items, and all images load
//  - searching a fats item (שמן זית / olive oil) narrows the grid
//  - picking a fats item opens the add sheet prefilled (name + banner)
//  - saving writes a FoodLog with imagePath + category=fats + sourceFoodId
//  - breakfast + proteins + carbs + vegetables + fruits filters still work
//  - no horizontal overflow, no console errors (light + dark)
//
// Pre-seeds the welcome flag so the welcome screen doesn't block QA.
import { chromium } from "@playwright/test";
import {
  clickChip,
  openPicker,
  pickFood,
  pickerCardCount,
  saveLog,
  seedAndResetNutrition,
} from "./nutrition-helpers.mjs";

const BASE = process.env.QA_BASE ?? "http://localhost:3100";
const FATS_LABEL = "שומנים ותוספות בריאות";
const EXPECTED = 20;

const issues = [];
const fail = (m) => issues.push(m);

function chipExists(page, label) {
  return page.evaluate(
    (lbl) => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === lbl),
    label,
  );
}

function noOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  await seedAndResetNutrition(page, BASE);
  await openPicker(page);

  /* ---------------------- fats chip exists & filters --------------------- */
  if (!(await chipExists(page, FATS_LABEL)))
    fail(`[fats] category chip "${FATS_LABEL}" not found`);

  await clickChip(page, FATS_LABEL);
  const fatsAll = await pickerCardCount(page);
  if (fatsAll !== EXPECTED) fail(`[fats] expected ${EXPECTED} fats items, got ${fatsAll}`);
  console.log("fats cards visible:", fatsAll);

  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => {
    let broken = 0, total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/fats/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[fats] ${broken.broken} fats images failed to load`);
  if (!(await noOverflow(page))) fail("[fats] horizontal overflow with fats filter");

  /* ------------------------------ Search -------------------------------- */
  await clickChip(page, "הכל");
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "שמן זית");
  await page.waitForTimeout(400);
  const searchCount = await pickerCardCount(page);
  if (searchCount !== 1) fail(`[search] expected 1 result for 'שמן זית', got ${searchCount}`);

  /* ----------------------- Pick a fats food -> add sheet ----------------- */
  await pickFood(page, "שמן זית");
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "שמן זית") fail(`[prefill] form name expected 'שמן זית', got '${nameVal}'`);
  const banner = await page.evaluate(() => document.body.textContent.includes("נבחר מהמאגר"));
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  await page.fill("#protein", "0");
  await page.fill("#carbs", "0");
  await page.fill("#fat", "14");
  await page.fill("#calories", "120");
  await page.fill("#quantity", "כף");
  await saveLog(page);

  const saved = await page.evaluate(() => {
    const logs = JSON.parse(localStorage.getItem("yfos:foodLogs") || "[]");
    const fat = logs.find((l) => l.foodName === "שמן זית");
    return {
      count: logs.length,
      hasImage: !!fat?.imagePath,
      imagePath: fat?.imagePath,
      category: fat?.category,
      sourceFoodId: fat?.sourceFoodId,
      fat: fat?.fat,
    };
  });
  if (saved.count !== 1) fail(`[save] expected 1 log, got ${saved.count}`);
  if (!saved.hasImage) fail("[save] saved fats log missing imagePath");
  if (saved.category !== "fats") fail(`[save] category expected 'fats', got '${saved.category}'`);
  if (saved.sourceFoodId !== "olive-oil")
    fail(`[save] sourceFoodId expected 'olive-oil', got '${saved.sourceFoodId}'`);
  if (saved.imagePath !== "/food/fats/olive-oil.webp")
    fail(`[save] imagePath expected '/food/fats/olive-oil.webp', got '${saved.imagePath}'`);
  if (saved.fat !== 14) fail(`[save] fat macro expected 14, got ${saved.fat}`);

  /* --- breakfast + proteins + carbs + vegetables + fruits still work ----- */
  await openPicker(page);
  await clickChip(page, "ארוחת בוקר");
  if ((await pickerCardCount(page)) < 1) fail("[breakfast] filter showed 0 cards");
  await clickChip(page, "חלבונים");
  if ((await pickerCardCount(page)) < 1) fail("[proteins] filter showed 0 cards");
  await clickChip(page, "פחמימות ותוספות");
  if ((await pickerCardCount(page)) < 1) fail("[carbs] filter showed 0 cards");
  await clickChip(page, "ירקות");
  if ((await pickerCardCount(page)) < 1) fail("[vegetables] filter showed 0 cards");
  await clickChip(page, "פירות");
  if ((await pickerCardCount(page)) < 1) fail("[fruits] filter showed 0 cards");

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await openPicker(page);
  await clickChip(page, FATS_LABEL);
  if (!(await noOverflow(page))) fail("[fats] horizontal overflow in dark mode");

  await browser.close();

  if (consoleErrors.length) consoleErrors.forEach((e) => fail("[console] " + e));

  console.log("\n===== FATS FOOD QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("QA RUN FAILED:", e);
  process.exit(1);
});
