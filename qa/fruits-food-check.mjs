// Phase 3.15 QA — fruits food library.
//
// Drives the Nutrition screen at phone width and verifies the new `fruits`
// category specifically:
//  - the "פירות" category chip exists
//  - filtering to it shows exactly 19 fruits items, and all images load
//  - searching a fruits item (אבטיח / watermelon) narrows the grid
//  - picking a fruits item prefills the log form (name + thumbnail banner)
//  - saving writes a FoodLog with imagePath + category=fruits + sourceFoodId
//  - breakfast + proteins + carbs + vegetables filters still work
//  - no horizontal overflow, no console errors (light + dark)
//
// Pre-seeds the welcome flag so the welcome screen doesn't block QA.
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3100";
const FRUITS_LABEL = "פירות";

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

  /* --------------------- fruits chip exists & filters -------------------- */
  const chipExists = await page.evaluate(
    (lbl) => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === lbl),
    FRUITS_LABEL,
  );
  if (!chipExists) fail(`[fruits] category chip "${FRUITS_LABEL}" not found`);

  await clickChip(page, FRUITS_LABEL);
  const fruitsCount = await sectionCardCount(page);
  if (fruitsCount < 1) fail(`[fruits] filtering to fruits showed ${fruitsCount} cards`);
  console.log("fruits cards visible (first page):", fruitsCount);

  // Expand and confirm exactly 19 fruits items, all images load.
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
  const fruitsAll = await sectionCardCount(page);
  if (fruitsAll !== 19) fail(`[fruits] expected 19 fruits items, got ${fruitsAll}`);

  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => {
    let broken = 0,
      total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/fruits/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[fruits] ${broken.broken} fruits images failed to load`);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) fail("[fruits] horizontal overflow with fruits filter");

  /* ------------------------------ Search -------------------------------- */
  // Reset to "all", search a fruits-only term (watermelon / אבטיח).
  await clickChip(page, "הכל");
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "אבטיח");
  await page.waitForTimeout(400);
  const searchCount = await sectionCardCount(page);
  if (searchCount !== 1) fail(`[search] expected 1 result for 'אבטיח', got ${searchCount}`);

  /* --------------------- Pick a fruits food -> prefill ------------------- */
  await page.click('button[aria-label="הוספת אבטיח ליומן"]');
  await page.waitForTimeout(400);
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "");
  await page.waitForTimeout(200);
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "אבטיח") fail(`[prefill] form name expected 'אבטיח', got '${nameVal}'`);
  const banner = await page.evaluate(() => document.body.textContent.includes("נבחר מהמאגר"));
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  await page.fill("#protein", "1");
  await page.fill("#carbs", "8");
  await page.fill("#fat", "0");
  await page.fill("#calories", "30");
  await page.fill("#quantity", "מנה");
  await page.getByRole("button", { name: "הוספה ליומן" }).click();
  await page.waitForTimeout(500);

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

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await clickChip(page, FRUITS_LABEL);
  const darkOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (darkOverflow) fail("[fruits] horizontal overflow in dark mode");

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
