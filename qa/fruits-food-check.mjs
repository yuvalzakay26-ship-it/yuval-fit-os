// Phase 3.15 / 3.17 QA — fruits food library (new sheet flow).
//
// Drives the Nutrition screen at phone width and verifies the `fruits` category:
//  - the "פירות" category chip exists in the picker
//  - filtering to it shows all fruits items, and all images load
//  - searching a fruits item (אבטיח / watermelon) narrows the grid
//  - picking a fruits item opens the add sheet prefilled (name + banner)
//  - saving writes a FoodLog with imagePath + category=fruits + sourceFoodId
//  - breakfast + proteins + carbs + vegetables filters still work
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
const FRUITS_LABEL = "פירות";
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

  /* --------------------- fruits chip exists & filters -------------------- */
  if (!(await chipExists(page, FRUITS_LABEL)))
    fail(`[fruits] category chip "${FRUITS_LABEL}" not found`);

  await clickChip(page, FRUITS_LABEL);
  const fruitsAll = await pickerCardCount(page);
  if (fruitsAll !== EXPECTED) fail(`[fruits] expected ${EXPECTED} fruits items, got ${fruitsAll}`);
  console.log("fruits cards visible:", fruitsAll);

  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => {
    let broken = 0, total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/fruits/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[fruits] ${broken.broken} fruits images failed to load`);
  if (!(await noOverflow(page))) fail("[fruits] horizontal overflow with fruits filter");

  /* ------------------------------ Search -------------------------------- */
  await clickChip(page, "הכל");
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "אבטיח");
  await page.waitForTimeout(400);
  const searchCount = await pickerCardCount(page);
  if (searchCount !== 1) fail(`[search] expected 1 result for 'אבטיח', got ${searchCount}`);

  /* --------------------- Pick a fruits food -> add sheet ----------------- */
  await pickFood(page, "אבטיח");
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "אבטיח") fail(`[prefill] form name expected 'אבטיח', got '${nameVal}'`);
  const banner = await page.evaluate(() => document.body.textContent.includes("נבחר מהמאגר"));
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  await page.fill("#protein", "1");
  await page.fill("#carbs", "8");
  await page.fill("#fat", "0");
  await page.fill("#calories", "30");
  await page.fill("#quantity", "מנה");
  await saveLog(page);

  const saved = await page.evaluate(() => {
    const logs = JSON.parse(localStorage.getItem("yfos:foodLogs") || "[]");
    const fruit = logs.find((l) => l.foodName === "אבטיח");
    return {
      count: logs.length,
      hasImage: !!fruit?.imagePath,
      imagePath: fruit?.imagePath,
      category: fruit?.category,
      sourceFoodId: fruit?.sourceFoodId,
      carbs: fruit?.carbs,
    };
  });
  if (saved.count !== 1) fail(`[save] expected 1 log, got ${saved.count}`);
  if (!saved.hasImage) fail("[save] saved fruits log missing imagePath");
  if (saved.category !== "fruits")
    fail(`[save] category expected 'fruits', got '${saved.category}'`);
  if (saved.sourceFoodId !== "watermelon")
    fail(`[save] sourceFoodId expected 'watermelon', got '${saved.sourceFoodId}'`);
  if (saved.imagePath !== "/food/fruits/watermelon.webp")
    fail(`[save] imagePath expected '/food/fruits/watermelon.webp', got '${saved.imagePath}'`);
  if (saved.carbs !== 8) fail(`[save] carbs macro expected 8, got ${saved.carbs}`);

  /* ------ breakfast + proteins + carbs + vegetables filters still work ---- */
  await openPicker(page);
  await clickChip(page, "ארוחת בוקר");
  if ((await pickerCardCount(page)) < 1) fail("[breakfast] filter showed 0 cards");
  await clickChip(page, "חלבונים");
  if ((await pickerCardCount(page)) < 1) fail("[proteins] filter showed 0 cards");
  await clickChip(page, "פחמימות ותוספות");
  if ((await pickerCardCount(page)) < 1) fail("[carbs] filter showed 0 cards");
  await clickChip(page, "ירקות");
  if ((await pickerCardCount(page)) < 1) fail("[vegetables] filter showed 0 cards");

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await openPicker(page);
  await clickChip(page, FRUITS_LABEL);
  if (!(await noOverflow(page))) fail("[fruits] horizontal overflow in dark mode");

  await browser.close();

  if (consoleErrors.length) consoleErrors.forEach((e) => fail("[console] " + e));

  console.log("\n===== FRUITS FOOD QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("QA RUN FAILED:", e);
  process.exit(1);
});
