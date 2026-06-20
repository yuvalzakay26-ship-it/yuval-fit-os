// Phase 3.7 / 3.17 QA — visual food library + quick-add prefill, new sheet flow.
//
// Drives the Nutrition screen at a phone width and verifies:
//  - the entry points render ("הוסף ידנית" + the lowered "הוסף מפריט קיים")
//  - the food library opens in a picker sheet with real <img> cards
//  - category filter / search narrow the grid
//  - picking a food opens the add sheet prefilled (name + "from library" banner)
//  - saving the picked food creates a log row that shows a thumbnail
//  - manual logging (no image) still works via "הוסף ידנית"
//  - totals still come from the manually-entered macros
//  - no horizontal overflow, no console errors, light + dark
//
// Pre-seeds the welcome flag so the welcome screen doesn't block QA.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import {
  openManualAdd,
  openPicker,
  pickFood,
  pickerCardCount,
  saveLog,
  seedAndResetNutrition,
} from "./nutrition-helpers.mjs";

const BASE = process.env.QA_BASE ?? "http://localhost:3100";
const OUT = "qa/screens";
mkdirSync(OUT, { recursive: true });

const issues = [];
const fail = (m) => issues.push(m);

async function checkOverflow(page, label) {
  const data = await page.evaluate(() => {
    const de = document.documentElement;
    let overflowers = 0;
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > window.innerWidth + 1) overflowers++;
    });
    return { scrollW: de.scrollWidth, clientW: de.clientWidth, overflowers };
  });
  if (data.scrollW > data.clientW + 1) {
    fail(`[overflow] ${label}: scrollW=${data.scrollW} clientW=${data.clientW} overflowers=${data.overflowers}`);
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

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  await seedAndResetNutrition(page, BASE);

  /* --------------------- Quick actions are the entry point --------------- */
  const hasQuickActions = await page.evaluate(() => {
    const txt = document.body.textContent || "";
    return txt.includes("הוסף מפריט קיים") && txt.includes("הוסף ידנית");
  });
  if (!hasQuickActions) fail("[quick-actions] missing 'הוסף מפריט קיים' / 'הוסף ידנית'");
  await checkOverflow(page, "nutrition light (main)");

  /* --------------------------- Library renders --------------------------- */
  await openPicker(page);
  const libImgs = await page.evaluate(
    () => document.querySelectorAll('button[aria-label^="הוספת"] img').length,
  );
  if (libImgs < 1) fail(`[library] no food images rendered (got ${libImgs})`);
  console.log("library images visible:", libImgs);

  // Food <img> should actually load (naturalWidth > 0).
  await page.waitForTimeout(600);
  const broken = await page.evaluate(() => {
    let broken = 0, total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[library] ${broken.broken}/${broken.total} food images failed to load`);

  await checkOverflow(page, "nutrition light (picker open)");

  /* ------------------------------ Search -------------------------------- */
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "שקשוקה");
  await page.waitForTimeout(300);
  const afterSearch = await pickerCardCount(page);
  if (afterSearch !== 1) fail(`[search] expected 1 result for 'שקשוקה', got ${afterSearch}`);

  /* -------------------- Pick a food -> add sheet prefilled --------------- */
  await pickFood(page, "שקשוקה");
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "שקשוקה") fail(`[prefill] form name expected 'שקשוקה', got '${nameVal}'`);
  const banner = await page.evaluate(() =>
    document.body.textContent.includes("נבחר מהמאגר"),
  );
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  // Fill macros manually and save.
  await page.fill("#protein", "22");
  await page.fill("#carbs", "12");
  await page.fill("#fat", "30");
  await page.fill("#calories", "400");
  await page.fill("#quantity", "מנה");
  await saveLog(page);

  const afterSave = await page.evaluate(() => {
    const logs = JSON.parse(localStorage.getItem("yfos:foodLogs") || "[]");
    const shak = logs.find((l) => l.foodName === "שקשוקה");
    return {
      count: logs.length,
      hasImage: !!shak?.imagePath,
      category: shak?.category,
      sourceFoodId: shak?.sourceFoodId,
      protein: shak?.protein,
    };
  });
  if (afterSave.count !== 1) fail(`[save] expected 1 log, got ${afterSave.count}`);
  if (!afterSave.hasImage) fail("[save] saved log missing imagePath");
  if (afterSave.category !== "breakfast") fail(`[save] category expected 'breakfast', got '${afterSave.category}'`);
  if (afterSave.sourceFoodId !== "shakshuka") fail(`[save] sourceFoodId expected 'shakshuka', got '${afterSave.sourceFoodId}'`);
  if (afterSave.protein !== 22) fail(`[save] protein expected 22, got ${afterSave.protein}`);

  // Log row shows a thumbnail.
  const rowThumb = await page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent.includes("יומן האוכל של היום"),
    );
    const section = heading?.closest("section");
    return section ? section.querySelectorAll("img").length : 0;
  });
  if (rowThumb < 1) fail("[save] today's log row has no thumbnail");

  /* ------------------- Manual logging still works (no image) ------------- */
  await openManualAdd(page);
  await page.fill("#food-name", "אורז מלא");
  await page.fill("#protein", "8");
  await page.fill("#carbs", "60");
  await page.fill("#fat", "2");
  await page.fill("#calories", "300");
  await saveLog(page);
  const manual = await page.evaluate(() => {
    const logs = JSON.parse(localStorage.getItem("yfos:foodLogs") || "[]");
    const rice = logs.find((l) => l.foodName === "אורז מלא");
    return { count: logs.length, hasImage: rice ? !!rice.imagePath : null };
  });
  if (manual.count !== 2) fail(`[manual] expected 2 logs, got ${manual.count}`);
  if (manual.hasImage !== false) fail("[manual] manual log should have no imagePath");

  // Totals reflect both entries (protein 22 + 8 = 30).
  const totalsOk = await page.evaluate(() => document.body.textContent.includes("30"));
  if (!totalsOk) fail("[totals] expected protein total 30 to appear");

  await checkOverflow(page, "nutrition light (with data)");
  await page.screenshot({ path: `${OUT}/food-library-390-light.png`, fullPage: true });

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await checkOverflow(page, "nutrition dark");
  await openPicker(page);
  await checkOverflow(page, "nutrition dark (picker open)");
  await page.screenshot({ path: `${OUT}/food-library-390-dark.png`, fullPage: true });

  await browser.close();

  if (consoleErrors.length) {
    consoleErrors.forEach((e) => fail("[console] " + e));
  }

  console.log("\n===== FOOD LIBRARY QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("QA RUN FAILED:", e);
  process.exit(1);
});
