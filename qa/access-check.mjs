// Phase 3.5 access-gate QA. Drives Chromium at phone width through the gate:
// fresh visit shows it, wrong code errors, correct code enters, refresh keeps
// access, Settings "lock" returns to the gate. Also watches the console and
// checks for horizontal overflow on the gate. Assumes a dev/prod server on
// :3000 (override with QA_BASE, e.g. QA_BASE=http://localhost:3199).
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const GATE = "[data-access-gate]";

const failures = [];
const consoleMsgs = [];

function check(label, condition) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
  if (!condition) failures.push(label);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") consoleMsgs.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => consoleMsgs.push(`[pageerror] ${e.message}`));

// 1. First visit (clean storage) shows the gate.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("first visit shows access gate", await page.locator(GATE).isVisible());
check(
  "gate shows title גישה מוגבלת",
  (await page.locator(GATE).innerText()).includes("גישה מוגבלת"),
);

// No horizontal overflow while the gate is up.
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
check("no horizontal overflow on gate", !overflow);

// 2. Wrong code — including the retired old code "yuval" — shows the error and
//    keeps the gate.
await page.fill(`${GATE} input`, "wrong-code");
await page.click(`${GATE} button[type=submit]`);
await page.waitForTimeout(200);
check("wrong code shows קוד שגוי", await page.getByText("קוד שגוי").isVisible());
check("gate still present after wrong code", await page.locator(GATE).isVisible());

await page.fill(`${GATE} input`, "yuval");
await page.click(`${GATE} button[type=submit]`);
await page.waitForTimeout(200);
check("retired code yuval is rejected", await page.locator(GATE).isVisible());
check(
  "retired code yuval does not grant access",
  (await page.evaluate(() => localStorage.getItem("yfos:access-granted:v1"))) === null,
);

// 3. Correct code enters the app.
await page.fill(`${GATE} input`, "yuvalzakay123");
await page.click(`${GATE} button[type=submit]`);
await page.waitForTimeout(300);
check("correct code removes gate", (await page.locator(GATE).count()) === 0);
check(
  "access flag persisted",
  (await page.evaluate(() => localStorage.getItem("yfos:access-granted:v1"))) === "1",
);
check("app chrome visible after entry", await page.locator("nav[aria-label]").isVisible());

// 4. Refresh keeps access (no gate flash that stays).
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("refresh keeps access", (await page.locator(GATE).count()) === 0);

// 5. Settings "lock" returns to the gate.
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(200);
await page.getByRole("button", { name: "נעל מערכת" }).click();
await page.waitForTimeout(300);
check("lock returns to gate", await page.locator(GATE).isVisible());
check(
  "access flag cleared after lock",
  (await page.evaluate(() => localStorage.getItem("yfos:access-granted:v1"))) === null,
);

await browser.close();

console.log(`\n===== CONSOLE ERRORS/WARNINGS (${consoleMsgs.length}) =====`);
consoleMsgs.forEach((m) => console.log(m));
if (!consoleMsgs.length) console.log("none");

console.log(`\n===== RESULT =====`);
if (failures.length || consoleMsgs.length) {
  console.log(`FAILED: ${failures.length} assertion(s), ${consoleMsgs.length} console msg(s)`);
  process.exit(1);
}
console.log("All access-gate checks passed.");
