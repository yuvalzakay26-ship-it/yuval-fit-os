// Phase 3.13 QA — carbs / side-dishes food library.
//
// Drives the Nutrition screen at phone width and verifies the new `carbs`
// category specifically:
//  - the "פחמימות ותוספות" category chip exists
//  - filtering to it shows only carbs items, and all their images load
//  - searching a carbs item (אורז מלא / brown rice) narrows the grid
//  - picking a carbs item prefills the log form (name + thumbnail banner)
//  - saving writes a FoodLog with imagePath + category=carbs + sourceFoodId
//  - breakfast + proteins filters still work
//  - no horizontal overflow, no console errors (light + dark)
//
// Pre-seeds the welcome flag so the welcome screen doesn't block QA.
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3100";
const CARBS_LABEL = "פחמימות ותוספות";

const issues = [];
const fail = (m) => issues.push(m);

function sectionCardCount(page) {
  return page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent.includes("מאגר אוכל"),
    );
    const section = heading?.closest("section");
    if (!section) return -1;
    return section.querySelectorAll('button[aria-label^="הוספת"]').length;
  });
}

async function clickChip(page, label) {
  await page.evaluate((lbl) => {
    const btns = [...document.querySelectorAll("button")];
    const chip = btns.find((b) => b.textContent.trim() === lbl);
    if (chip) chip.click();
  }, label);
  await page.waitForTimeout(300);
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

  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
    } catch {}
  });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const keep = localStorage.getItem("yfos:welcome-seen:v1");
    localStorage.clear();
    if (keep) localStorage.setItem("yfos:welcome-seen:v1", keep);
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  /* ---------------------- carbs chip exists & filters --------------------- */
  const chipExists = await page.evaluate(
    (lbl) => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === lbl),
    CARBS_LABEL,
  );
  if (!chipExists) fail(`[carbs] category chip "${CARBS_LABEL}" not found`);

  await clickChip(page, CARBS_LABEL);
  const carbsCount = await sectionCardCount(page);
  // The library ships 19 carbs items; the grid shows them (expand to confirm all).
  if (carbsCount < 1) fail(`[carbs] filtering to carbs showed ${carbsCount} cards`);
  console.log("carbs cards visible (first page):", carbsCount);

  // Expand and confirm exactly 19 carbs items, all images load.
  await page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent.includes("מאגר אוכל"),
    );
    const section = heading?.closest("section");
    const more = [...section.querySelectorAll("button")].find((b) =>
      b.textContent.includes("הצג את כל המאכלים"),
    );
    if (more) more.click();
  });
  await page.waitForTimeout(500);
  const carbsAll = await sectionCardCount(page);
  if (carbsAll !== 19) fail(`[carbs] expected 19 carbs items, got ${carbsAll}`);

  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => {
    let broken = 0,
      total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/carbs/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[carbs] ${broken.broken} carbs images failed to load`);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) fail("[carbs] horizontal overflow with carbs filter");

  /* ------------------------------ Search -------------------------------- */
  // Reset to "all", search a carbs-only term (brown rice / אורז מלא).
  await clickChip(page, "הכל");
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "אורז מלא");
  await page.waitForTimeout(400);
  const searchCount = await sectionCardCount(page);
  if (searchCount !== 1) fail(`[search] expected 1 result for 'אורז מלא', got ${searchCount}`);

  /* -------------------- Pick a carbs food -> prefill --------------------- */
  await page.click('button[aria-label="הוספת אורז מלא ליומן"]');
  await page.waitForTimeout(400);
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "");
  await page.waitForTimeout(200);
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "אורז מלא") fail(`[prefill] form name expected 'אורז מלא', got '${nameVal}'`);
  const banner = await page.evaluate(() => document.body.textContent.includes("נבחר מהמאגר"));
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  await page.fill("#protein", "5");
  await page.fill("#carbs", "45");
  await page.fill("#fat", "1");
  await page.fill("#calories", "215");
  await page.fill("#quantity", "מנה");
  await page.getByRole("button", { name: "הוספה ליומן" }).click();
  await page.waitForTimeout(500);

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
  await clickChip(page, "ארוחת בוקר");
  const bCount = await sectionCardCount(page);
  if (bCount < 1) fail(`[breakfast] filter showed ${bCount} cards`);
  await clickChip(page, "חלבונים");
  const pCount = await sectionCardCount(page);
  if (pCount < 1) fail(`[proteins] filter showed ${pCount} cards`);

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await clickChip(page, CARBS_LABEL);
  const darkOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (darkOverflow) fail("[carbs] horizontal overflow in dark mode");

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
