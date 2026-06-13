// Phase 3.14 QA — vegetables food library.
//
// Drives the Nutrition screen at phone width and verifies the new `vegetables`
// category specifically:
//  - the "ירקות" category chip exists
//  - filtering to it shows exactly 20 vegetables items, and all images load
//  - searching a vegetables item (כרובית / cauliflower) narrows the grid
//  - picking a vegetables item prefills the log form (name + thumbnail banner)
//  - saving writes a FoodLog with imagePath + category=vegetables + sourceFoodId
//  - breakfast + proteins + carbs filters still work
//  - no horizontal overflow, no console errors (light + dark)
//
// Pre-seeds the welcome flag so the welcome screen doesn't block QA.
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3100";
const VEG_LABEL = "ירקות";

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

  /* -------------------- vegetables chip exists & filters ------------------ */
  const chipExists = await page.evaluate(
    (lbl) => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === lbl),
    VEG_LABEL,
  );
  if (!chipExists) fail(`[vegetables] category chip "${VEG_LABEL}" not found`);

  await clickChip(page, VEG_LABEL);
  const vegCount = await sectionCardCount(page);
  if (vegCount < 1) fail(`[vegetables] filtering to vegetables showed ${vegCount} cards`);
  console.log("vegetables cards visible (first page):", vegCount);

  // Expand and confirm exactly 20 vegetables items, all images load.
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
  const vegAll = await sectionCardCount(page);
  if (vegAll !== 20) fail(`[vegetables] expected 20 vegetables items, got ${vegAll}`);

  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => {
    let broken = 0,
      total = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.src.includes("/food/vegetables/") && !img.src.includes("_next/image")) return;
      total++;
      if (img.complete && img.naturalWidth === 0) broken++;
    });
    return { broken, total };
  });
  if (broken.broken > 0) fail(`[vegetables] ${broken.broken} vegetables images failed to load`);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) fail("[vegetables] horizontal overflow with vegetables filter");

  /* ------------------------------ Search -------------------------------- */
  // Reset to "all", search a vegetables-only term (cauliflower / כרובית).
  await clickChip(page, "הכל");
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "כרובית");
  await page.waitForTimeout(400);
  const searchCount = await sectionCardCount(page);
  if (searchCount !== 1) fail(`[search] expected 1 result for 'כרובית', got ${searchCount}`);

  /* ------------------ Pick a vegetables food -> prefill ------------------ */
  await page.click('button[aria-label="הוספת כרובית ליומן"]');
  await page.waitForTimeout(400);
  await page.fill('input[aria-label="חיפוש במאגר האוכל"]', "");
  await page.waitForTimeout(200);
  const nameVal = await page.inputValue("#food-name");
  if (nameVal !== "כרובית") fail(`[prefill] form name expected 'כרובית', got '${nameVal}'`);
  const banner = await page.evaluate(() => document.body.textContent.includes("נבחר מהמאגר"));
  if (!banner) fail("[prefill] 'נבחר מהמאגר' thumbnail banner not shown");

  await page.fill("#protein", "2");
  await page.fill("#carbs", "5");
  await page.fill("#fat", "0");
  await page.fill("#calories", "25");
  await page.fill("#quantity", "מנה");
  await page.getByRole("button", { name: "הוספה ליומן" }).click();
  await page.waitForTimeout(500);

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
  await clickChip(page, "ארוחת בוקר");
  const bCount = await sectionCardCount(page);
  if (bCount < 1) fail(`[breakfast] filter showed ${bCount} cards`);
  await clickChip(page, "חלבונים");
  const pCount = await sectionCardCount(page);
  if (pCount < 1) fail(`[proteins] filter showed ${pCount} cards`);
  await clickChip(page, "פחמימות ותוספות");
  const cCount = await sectionCardCount(page);
  if (cCount < 1) fail(`[carbs] filter showed ${cCount} cards`);

  /* ------------------------------- Dark mode ----------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await clickChip(page, VEG_LABEL);
  const darkOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (darkOverflow) fail("[vegetables] horizontal overflow in dark mode");

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
