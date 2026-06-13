// Shared Playwright helpers for the Nutrition screen.
//
// Phase 3.17 turned the food library and the add-food form into focused bottom
// sheets (instead of one long inline page). These helpers open those sheets so
// QA scripts can keep asserting the same behaviors against the new flow.

/** Pre-seed the welcome flag and start from a clean (but welcome-seen) state. */
export async function seedAndResetNutrition(page, base) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
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

/** Click the first button whose visible text contains `text`. */
async function clickButtonByText(page, text) {
  const clicked = await page.evaluate((t) => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      (b.textContent || "").includes(t),
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, text);
  await page.waitForTimeout(350);
  return clicked;
}

/** Open the food library picker sheet (waits for the search input). */
export async function openPicker(page) {
  await clickButtonByText(page, "בחר מהמאגר");
  await page.waitForSelector('input[aria-label="חיפוש במאגר האוכל"]', { timeout: 4000 });
  await page.waitForTimeout(200);
}

/** Open the blank manual add sheet (waits for the name field). */
export async function openManualAdd(page) {
  await clickButtonByText(page, "הוסף ידנית");
  await page.waitForSelector("#food-name", { timeout: 4000 });
  await page.waitForTimeout(200);
}

/**
 * Pick a food from the (already open) picker by its card aria-label
 * ("הוספת <name> ליומן"). The picker closes and the add sheet opens.
 */
export async function pickFood(page, name) {
  await page.click(`button[aria-label="הוספת ${name} ליומן"]`);
  await page.waitForSelector("#food-name", { timeout: 4000 });
  await page.waitForTimeout(250);
}

/** Count food cards currently shown in the open picker sheet. */
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
