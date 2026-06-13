// Shared Playwright helpers for the Nutrition screen.
//
// Phase 3.17.1 turned the food library and the add-food form into full-screen
// routes (/nutrition/library and /nutrition/add) instead of bottom sheets.
// These helpers drive that route flow so QA scripts can keep asserting the same
// behaviors (open library, pick a food, add manually, save a log).

/** Pre-seed the welcome flag and start from a clean (but welcome-seen) state. */
export async function seedAndResetNutrition(page, base) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
    } catch {}
  });
  await page.goto(base + "/nutrition", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const keep = localStorage.getItem("yfos:welcome-seen:v1");
    localStorage.clear();
    if (keep) localStorage.setItem("yfos:welcome-seen:v1", keep);
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}

/** Click the first link/button whose visible text contains `text`. */
async function clickByText(page, text) {
  const clicked = await page.evaluate((t) => {
    const el = [...document.querySelectorAll("a, button")].find((b) =>
      (b.textContent || "").includes(t),
    );
    if (el) {
      el.click();
      return true;
    }
    return false;
  }, text);
  await page.waitForTimeout(350);
  return clicked;
}

/** Navigate into the full-screen food library (waits for the search input). */
export async function openPicker(page) {
  await clickByText(page, "בחר מהמאגר");
  await page.waitForSelector('input[aria-label="חיפוש במאגר האוכל"]', { timeout: 6000 });
  await page.waitForTimeout(250);
}

/** Navigate into the blank manual add flow (waits for the name field). */
export async function openManualAdd(page) {
  await clickByText(page, "הוסף ידנית");
  await page.waitForSelector("#food-name", { timeout: 6000 });
  await page.waitForTimeout(250);
}

/**
 * Pick a food from the (already open) library by its card aria-label
 * ("הוספת <name> ליומן"). Navigates to the add-food route, prefilled.
 */
export async function pickFood(page, name) {
  await page.click(`button[aria-label="הוספת ${name} ליומן"]`);
  await page.waitForSelector("#food-name", { timeout: 6000 });
  await page.waitForTimeout(300);
}

/** Count food cards currently shown on the open library screen. */
export function pickerCardCount(page) {
  return page.evaluate(
    () => document.querySelectorAll('button[aria-label^="הוספת"]').length,
  );
}

/** Click a category chip in the open picker by its label. */
export async function clickChip(page, label) {
  await page.evaluate((lbl) => {
    const chip = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === lbl,
    );
    if (chip) chip.click();
  }, label);
  await page.waitForTimeout(300);
}

/** Submit the add-food form (the sheet's primary button). */
export async function saveLog(page) {
  await page.click('form button[type="submit"]');
  await page.waitForTimeout(450);
}
