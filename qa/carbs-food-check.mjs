// Phase 3.13 / 3.17 QA — carbs / side-dishes food library (new sheet flow).
//
// Drives the Nutrition screen at phone width and verifies the `carbs` category:
//  - the "פחמימות ותוספות" category chip exists in the picker
//  - filtering to it shows all carbs items, and all their images load
//  - searching a carbs item (אורז מלא / brown rice) narrows the grid
//  - picking a carbs item opens the add sheet prefilled (name + banner)
//  - saving writes a FoodLog with imagePath + category=carbs + sourceFoodId
//  - breakfast + proteins filters still work
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
const CARBS_LABEL = "פחמימות ותוספות";
const EXPECTED = 19;

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

  /* ---------------------- carbs chip exists & filters --------------------- */
  if (!(await chipExists(page, CARBS_LABEL)))
    fail(`[carbs] category chip "${CARBS_LABEL}" not found`);

  await clickChip(page, CARBS_LABEL);
  const carbsAll = await pickerCardCount(page);
  if (carbsAll !== EXPECTED) fail(`[carbs] expected ${EXPECTED} carbs items, got ${carbsAll}`);
  console.log("carbs cards visible:", carbsAll);

  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => {
    let broken = 0, total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/carbs/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[carbs] ${broken.broken} carbs images failed to load`);
  if (!(await noOverflow(page))) fail("[carbs] horizontal overflow with carbs filter");

  /* ------------------------------ Search -------------------------------- */
  await clickChip(page, "הכל");
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "אורז מלא");
  await page.waitForTimeout(400);
  const searchCount = await pickerCardCount(page);
  if (searchCount !== 1) fail(`[search] expected 1 result for 'אורז מלא', got ${searchCount}`);

  /* -------------------- Pick a carbs food -> add sheet ------------------- */
  await pickFood(page, "אורז מלא");
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "אורז מלא") fail(`[prefill] form name expected 'אורז מלא', got '${nameVal}'`);
  const banner = await page.evaluate(() => document.body.textContent.includes("נבחר מהמאגר"));
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  await page.fill("#protein", "5");
  await page.fill("#carbs", "45");
  await page.fill("#fat", "1");
  await page.fill("#calories", "215");
  await page.fill("#quantity", "מנה");
  await saveLog(page);

  const saved = await page.evaluate(() => {
    const logs = JSON.parse(localStorage.getItem("yfos:foodLogs") || "[]");
    const rice = logs.find((l) => l.foodName === "אורז מלא");
    return {
      count: logs.length,
      hasImage: !!rice?.imagePath,
      imagePath: rice?.imagePath,
      category: rice?.category,
      sourceFoodId: rice?.sourceFoodId,
      carbs: rice?.carbs,
    };
  });
  if (saved.count !== 1) fail(`[save] expected 1 log, got ${saved.count}`);
  if (!saved.hasImage) fail("[save] saved carbs log missing imagePath");
  if (saved.category !== "carbs") fail(`[save] category expected 'carbs', got '${saved.category}'`);
  if (saved.sourceFoodId !== "brown-rice")
    fail(`[save] sourceFoodId expected 'brown-rice', got '${saved.sourceFoodId}'`);
  if (saved.imagePath !== "/food/carbs/brown-rice.webp")
    fail(`[save] imagePath expected '/food/carbs/brown-rice.webp', got '${saved.imagePath}'`);
  if (saved.carbs !== 45) fail(`[save] carbs macro expected 45, got ${saved.carbs}`);

  /* ----------------- breakfast + proteins filters still work ------------- */
  await openPicker(page);
  await clickChip(page, "ארוחת בוקר");
  if ((await pickerCardCount(page)) < 1) fail("[breakfast] filter showed 0 cards");
  await clickChip(page, "חלבונים");
  if ((await pickerCardCount(page)) < 1) fail("[proteins] filter showed 0 cards");

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await openPicker(page);
  await clickChip(page, CARBS_LABEL);
  if (!(await noOverflow(page))) fail("[carbs] horizontal overflow in dark mode");

  await browser.close();

  if (consoleErrors.length) consoleErrors.forEach((e) => fail("[console] " + e));

  console.log("\n===== CARBS FOOD QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("QA RUN FAILED:", e);
  process.exit(1);
});
