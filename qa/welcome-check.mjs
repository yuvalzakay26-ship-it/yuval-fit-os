// Phase 3.12.1 welcome-screen QA. Drives Chromium at phone width through the
// welcome gate: a clean first visit shows it, tapping "כניסה למערכת" enters the
// app, a refresh does not show it again (flag persisted), and the Settings
// "הצג מסך פתיחה" action brings it back. Also confirms there is NO password
// input and watches the console + checks for horizontal overflow. Assumes a
// dev/prod server on :3000 (override with QA_BASE, e.g.
// QA_BASE=http://localhost:3199).
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const GATE = "[data-welcome-gate]";

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

// 1. First visit (clean storage) shows the welcome screen.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("first visit shows welcome screen", await page.locator(GATE).isVisible());
check(
  "welcome shows title ברוך הבא ל־Fit OS",
  (await page.locator(GATE).innerText()).includes("ברוך הבא"),
);

// No password / code input anywhere on the welcome screen.
check(
  "no password input on welcome screen",
  (await page.locator(`${GATE} input[type=password]`).count()) === 0,
);
check(
  "no text input on welcome screen",
  (await page.locator(`${GATE} input`).count()) === 0,
);

// No horizontal overflow while the welcome screen is up.
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
check("no horizontal overflow on welcome screen", !overflow);

// 2. Tapping "כניסה למערכת" enters the app — no code required.
await page.getByRole("button", { name: "כניסה למערכת" }).click();
await page.waitForTimeout(300);
check("entering removes welcome screen", (await page.locator(GATE).count()) === 0);
check(
  "welcome-seen flag persisted",
  (await page.evaluate(() => localStorage.getItem("yfos:welcome-seen:v1"))) === "1",
);
check("app chrome visible after entry", await page.locator("nav[aria-label]").isVisible());

// 3. Refresh does NOT show the welcome screen again (flag remembered, no flash).
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("refresh does not show welcome again", (await page.locator(GATE).count()) === 0);

// 4. Settings "הצג מסך פתיחה" brings the welcome screen back.
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(200);
check(
  "settings has no security/lock copy",
  !(await page.locator("body").innerText()).includes("נעל מערכת"),
);
await page.getByRole("button", { name: "הצג מסך פתיחה" }).click();
await page.waitForTimeout(300);
check("settings action shows welcome again", await page.locator(GATE).isVisible());
check(
  "welcome-seen flag cleared after reset",
  (await page.evaluate(() => localStorage.getItem("yfos:welcome-seen:v1"))) === null,
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
console.log("All welcome-screen checks passed.");
