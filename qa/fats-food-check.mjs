// Phase 3.16 QA — fats & add-ons food library.
//
// Drives the Nutrition screen at phone width and verifies the new `fats`
// category specifically:
//  - the "שומנים ותוספות בריאות" category chip exists
//  - filtering to it shows exactly 20 fats items, and all images load
//  - searching a fats item (שמן זית / olive oil) narrows the grid
//  - picking a fats item prefills the log form (name + thumbnail banner)
//  - saving writes a FoodLog with imagePath + category=fats + sourceFoodId
//  - breakfast + proteins + carbs + vegetables + fruits filters still work
//  - no horizontal overflow, no console errors (light + dark)
//
// Pre-seeds the welcome flag so the welcome screen doesn't block QA.
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3100";
const FATS_LABEL = "שומנים ותוספות בריאות";

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

  /* ---------------------- fats chip exists & filters --------------------- */
  const chipExists = await page.evaluate(
    (lbl) => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === lbl),
    FATS_LABEL,
  );
  if (!chipExists) fail(`[fats] category chip "${FATS_LABEL}" not found`);

  await clickChip(page, FATS_LABEL);
  const fatsCount = await sectionCardCount(page);
  if (fatsCount < 1) fail(`[fats] filtering to fats showed ${fatsCount} cards`);
  console.log("fats cards visible (first page):", fatsCount);

  // Expand and confirm exactly 20 fats items, all images load.
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
  const fatsAll = await sectionCardCount(page);
  if (fatsAll !== 20) fail(`[fats] expected 20 fats items, got ${fatsAll}`);

  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => {
    let broken = 0,
      total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/fats/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[fats] ${broken.broken} fats images failed to load`);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) fail("[fats] horizontal overflow with fats filter");

  /* ------------------------------ Search -------------------------------- */
  // Reset to "all", search a fats-only term (olive oil / שמן זית).
  await clickChip(page, "הכל");
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "שמן זית");
  await page.waitForTimeout(400);
  const searchCount = await sectionCardCount(page);
  if (searchCount !== 1) fail(`[search] expected 1 result for 'שמן זית', got ${searchCount}`);

  /* ----------------------- Pick a fats food -> prefill ------------------- */
  await page.click('button[aria-label="הוספת שמן זית ליומן"]');
  await page.waitForTimeout(400);
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "");
  await page.waitForTimeout(200);
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "שמן זית") fail(`[prefill] form name expected 'שמן זית', got '${nameVal}'`);
  const banner = await page.evaluate(() => document.body.textContent.includes("נבחר מהמאגר"));
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  await page.fill("#protein", "0");
  await page.fill("#carbs", "0");
  await page.fill("#fat", "14");
  await page.fill("#calories", "120");
  await page.fill("#quantity", "כף");
  await page.getByRole("button", { name: "הוספה ליומן" }).click();
  await page.waitForTimeout(500);

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
  if (saved.category !== "fats")
    fail(`[save] category expected 'fats', got '${saved.category}'`);
  if (saved.sourceFoodId !== "olive-oil")
    fail(`[save] sourceFoodId expected 'olive-oil', got '${saved.sourceFoodId}'`);
  if (saved.imagePath !== "/food/fats/olive-oil.webp")
    fail(`[save] imagePath expected '/food/fats/olive-oil.webp', got '${saved.imagePath}'`);
  if (saved.fat !== 14) fail(`[save] fat macro expected 14, got ${saved.fat}`);

  /* --- breakfast + proteins + carbs + vegetables + fruits still work ----- */
  await clickChip(page, "ארוחת בוקר");
  const bCount = await sectionCardCount(page);
  if (bCount < 1) fail(`[breakfast] filter showed ${bCount} cards`);
  await clickChip(page, "חלבונים");
  const pCount = await sectionCardCount(page);
  if (pCount < 1) fail(`[proteins] filter showed ${pCount} cards`);
  await clickChip(page, "פחמימות ותוספות");
  const cCount = await sectionCardCount(page);
  if (cCount < 1) fail(`[carbs] filter showed ${cCount} cards`);
  await clickChip(page, "ירקות");
  const vCount = await sectionCardCount(page);
  if (vCount < 1) fail(`[vegetables] filter showed ${vCount} cards`);
  await clickChip(page, "פירות");
  const frCount = await sectionCardCount(page);
  if (frCount < 1) fail(`[fruits] filter showed ${frCount} cards`);

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await clickChip(page, FATS_LABEL);
  const darkOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (darkOverflow) fail("[fats] horizontal overflow in dark mode");

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
