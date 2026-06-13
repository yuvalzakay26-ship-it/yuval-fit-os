// Phase 3.14 / 3.17 QA — vegetables food library (new sheet flow).
//
// Drives the Nutrition screen at phone width and verifies the `vegetables`
// category:
//  - the "ירקות" category chip exists in the picker
//  - filtering to it shows all vegetables items, and all images load
//  - searching a vegetables item (כרובית / cauliflower) narrows the grid
//  - picking a vegetables item opens the add sheet prefilled (name + banner)
//  - saving writes a FoodLog with imagePath + category=vegetables + sourceFoodId
//  - breakfast + proteins + carbs filters still work
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
const VEG_LABEL = "ירקות";
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

  /* -------------------- vegetables chip exists & filters ------------------ */
  if (!(await chipExists(page, VEG_LABEL)))
    fail(`[vegetables] category chip "${VEG_LABEL}" not found`);

  await clickChip(page, VEG_LABEL);
  const vegAll = await pickerCardCount(page);
  if (vegAll !== EXPECTED) fail(`[vegetables] expected ${EXPECTED} vegetables items, got ${vegAll}`);
  console.log("vegetables cards visible:", vegAll);

  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => {
    let broken = 0, total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/vegetables/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[vegetables] ${broken.broken} vegetables images failed to load`);
  if (!(await noOverflow(page))) fail("[vegetables] horizontal overflow with vegetables filter");

  /* ------------------------------ Search -------------------------------- */
  await clickChip(page, "הכל");
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "כרובית");
  await page.waitForTimeout(400);
  const searchCount = await pickerCardCount(page);
  if (searchCount !== 1) fail(`[search] expected 1 result for 'כרובית', got ${searchCount}`);

  /* ------------------ Pick a vegetables food -> add sheet ---------------- */
  await pickFood(page, "כרובית");
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "כרובית") fail(`[prefill] form name expected 'כרובית', got '${nameVal}'`);
  const banner = await page.evaluate(() => document.body.textContent.includes("נבחר מהמאגר"));
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  await page.fill("#protein", "2");
  await page.fill("#carbs", "5");
  await page.fill("#fat", "0");
  await page.fill("#calories", "25");
  await page.fill("#quantity", "מנה");
  await saveLog(page);

  const saved = await page.evaluate(() => {
    const logs = JSON.parse(localStorage.getItem("yfos:foodLogs") || "[]");
    const veg = logs.find((l) => l.foodName === "כרובית");
    return {
      count: logs.length,
      hasImage: !!veg?.imagePath,
      imagePath: veg?.imagePath,
      category: veg?.category,
      sourceFoodId: veg?.sourceFoodId,
      carbs: veg?.carbs,
    };
  });
  if (saved.count !== 1) fail(`[save] expected 1 log, got ${saved.count}`);
  if (!saved.hasImage) fail("[save] saved vegetables log missing imagePath");
  if (saved.category !== "vegetables")
    fail(`[save] category expected 'vegetables', got '${saved.category}'`);
  if (saved.sourceFoodId !== "cauliflower")
    fail(`[save] sourceFoodId expected 'cauliflower', got '${saved.sourceFoodId}'`);
  if (saved.imagePath !== "/food/vegetables/cauliflower.webp")
    fail(`[save] imagePath expected '/food/vegetables/cauliflower.webp', got '${saved.imagePath}'`);
  if (saved.carbs !== 5) fail(`[save] carbs macro expected 5, got ${saved.carbs}`);

  /* ----------- breakfast + proteins + carbs filters still work ----------- */
  await openPicker(page);
  await clickChip(page, "ארוחת בוקר");
  if ((await pickerCardCount(page)) < 1) fail("[breakfast] filter showed 0 cards");
  await clickChip(page, "חלבונים");
  if ((await pickerCardCount(page)) < 1) fail("[proteins] filter showed 0 cards");
  await clickChip(page, "פחמימות ותוספות");
  if ((await pickerCardCount(page)) < 1) fail("[carbs] filter showed 0 cards");

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await openPicker(page);
  await clickChip(page, VEG_LABEL);
  if (!(await noOverflow(page))) fail("[vegetables] horizontal overflow in dark mode");

  await browser.close();

  if (consoleErrors.length) consoleErrors.forEach((e) => fail("[console] " + e));

  console.log("\n===== VEGETABLES FOOD QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("QA RUN FAILED:", e);
  process.exit(1);
});
