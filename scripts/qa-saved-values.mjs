// QA pass for Nutrition saved food values (Phase 3.18).
// Usage: node scripts/qa-saved-values.mjs (expects `next start -p 3199` running)
//
// Verifies the full save → reload → update → reset lifecycle for a library
// food, plus that nothing is loaded before the user opts in. Macros are always
// user-entered — this script never asserts any inferred nutrition value.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3199";
const OUT = ".qa-shots";
const FOOD_ID = "boiled-eggs"; // a real FOOD_LIBRARY id
const ADD_URL = `${BASE}/nutrition/add?foodId=${FOOD_ID}`;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;

function check(name, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
}

const NOTE = "נטען מהערכים ששמרת";
const SAVE_LABEL = "שמור ערכים לפעם הבאה";
const RESET_LABEL = "אפס ערכים שמורים";
const SUBMIT_LABEL = "הוסף ליומן";

async function fillMacros(page, { quantity, protein, carbs, fat, calories }) {
  await page.fill("#quantity", quantity);
  await page.fill("#protein", protein);
  await page.fill("#carbs", carbs);
  await page.fill("#fat", fat);
  await page.fill("#calories", calories);
}

async function noOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

for (const scheme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  // Pre-seed the welcome flag so QA lands directly on the app.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${scheme}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${scheme}] pageerror: ${e.message}`));

  /* 1. First open — nothing saved yet. */
  await page.goto(ADD_URL, { waitUntil: "networkidle" });
  check(`[${scheme}] saved note absent on first open`, !(await page.getByText(NOTE).count()));
  check(`[${scheme}] protein empty on first open`, (await page.inputValue("#protein")) === "");
  check(`[${scheme}] save checkbox present (library food)`, await page.getByText(SAVE_LABEL).isVisible());
  check(`[${scheme}] reset action absent before any save`, !(await page.getByText(RESET_LABEL).count()));

  /* 2. Fill macros, opt in, save. */
  await fillMacros(page, { quantity: "200 גרם", protein: "60", carbs: "0", fat: "6", calories: "330" });
  await page.getByText(SAVE_LABEL).click(); // toggles the checkbox via its label
  await page.screenshot({ path: `${OUT}/saved-${scheme}-fill.png` });
  await page.getByRole("button", { name: SUBMIT_LABEL }).click();
  await page.waitForURL(`${BASE}/nutrition`);
  check(`[${scheme}] returns to nutrition after save`, page.url() === `${BASE}/nutrition`);

  /* 3. Reopen — values prefilled from saved. */
  await page.goto(ADD_URL, { waitUntil: "networkidle" });
  await page.getByText(NOTE).waitFor({ state: "visible" });
  check(`[${scheme}] saved note shown on reopen`, await page.getByText(NOTE).isVisible());
  check(`[${scheme}] protein prefilled`, (await page.inputValue("#protein")) === "60");
  check(`[${scheme}] calories prefilled`, (await page.inputValue("#calories")) === "330");
  check(`[${scheme}] quantity prefilled`, (await page.inputValue("#quantity")) === "200 גרם");
  check(`[${scheme}] reset action now visible`, await page.getByText(RESET_LABEL).isVisible());
  check(`[${scheme}] no horizontal overflow`, (await noOverflow(page)) === 0);
  await page.screenshot({ path: `${OUT}/saved-${scheme}-reloaded.png` });

  /* 4. Edit + update saved values. */
  await page.fill("#protein", "62");
  await page.getByRole("button", { name: SUBMIT_LABEL }).click();
  await page.waitForURL(`${BASE}/nutrition`);
  await page.goto(ADD_URL, { waitUntil: "networkidle" });
  await page.getByText(NOTE).waitFor({ state: "visible" });
  check(`[${scheme}] updated value reloaded`, (await page.inputValue("#protein")) === "62");

  /* 5. Reset saved values for this food. */
  await page.getByText(RESET_LABEL).click();
  check(`[${scheme}] note hidden after reset`, !(await page.getByText(NOTE).count()));
  await page.goto(ADD_URL, { waitUntil: "networkidle" });
  check(`[${scheme}] note absent after reset + reopen`, !(await page.getByText(NOTE).count()));
  check(`[${scheme}] macros empty after reset`, (await page.inputValue("#protein")) === "");

  await ctx.close();
}

await browser.close();
if (errors.length) {
  console.log(`CONSOLE ERRORS:\n${errors.join("\n")}`);
  failures++;
} else {
  console.log("No console errors.");
}
process.exit(failures ? 1 : 0);
