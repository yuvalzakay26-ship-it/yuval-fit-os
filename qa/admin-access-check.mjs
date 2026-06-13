// Phase 3.xx admin access-code gate QA. Drives Chromium at phone width through
// the admin access-code gate: a fresh session (private notice + welcome seeded
// away) shows it, a wrong code shows the error and keeps the gate up, the
// correct code `yuvalzakay123` enters the app, a refresh in the same context
// does NOT show it again (localStorage grant persists), and the Settings
// "נעל מערכת" action clears the grant and brings the gate back. Also confirms
// there is NO false tracking/detection copy, watches the console, and checks for
// horizontal overflow at 360 + 390. Assumes a dev/prod server on :3000 (override
// with QA_BASE, e.g. QA_BASE=http://localhost:3199).
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const GATE = "[data-admin-access-gate]";
const CODE = "yuvalzakay123";

// Copy that would imply real device detection / monitoring — must NOT appear.
const FORBIDDEN_COPY = [
  "זיהינו שאתה לא מנהל",
  "אנחנו מזהים מכשירים",
  "השימוש שלך מנוטר",
  "אנחנו יודעים מי נכנס",
  "המכשיר שלך זוהה",
];

const failures = [];
const consoleMsgs = [];

function check(label, condition) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
  if (!condition) failures.push(label);
}

const browser = await chromium.launch();

async function newSession(width = 390) {
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      consoleMsgs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleMsgs.push(`[pageerror] ${e.message}`));
  // Seed the welcome + private-access flags so neither gate confounds this
  // script — we are testing the admin access-code gate in isolation. The admin
  // grant is deliberately NOT seeded so the gate shows.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
    } catch {}
  });
  return { context, page };
}

// 1. Fresh session shows the admin gate.
let { context, page } = await newSession(390);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("fresh session shows admin gate", await page.locator(GATE).isVisible());
check(
  "gate shows title כניסה מוגבלת",
  (await page.locator(GATE).innerText()).includes("כניסה מוגבלת"),
);
check("gate shows badge גישת מנהל", (await page.locator(GATE).innerText()).includes("גישת מנהל"));

// The gate has a code input (unlike the welcome / private screens).
check("gate has a code input", (await page.locator(`${GATE} input`).count()) === 1);

// No false device-detection / monitoring copy.
const gateText = await page.locator(GATE).innerText();
for (const phrase of FORBIDDEN_COPY) {
  check(`gate does not claim "${phrase}"`, !gateText.includes(phrase));
}

// Overflow check at 390, then 360.
for (const width of [390, 360]) {
  await page.setViewportSize({ width, height: 844 });
  await page.waitForTimeout(150);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );
  check(`no horizontal overflow on gate @${width}`, !overflow);
}
await page.setViewportSize({ width: 390, height: 844 });

// 2. A wrong code shows the error and keeps the gate up — no entry granted.
await page.locator(`${GATE} input`).fill("not-the-code");
await page.getByRole("button", { name: "אימות וכניסה" }).click();
await page.waitForTimeout(250);
check("wrong code shows error", (await page.locator(GATE).innerText()).includes("קוד שגוי"));
check("wrong code keeps gate visible", await page.locator(GATE).isVisible());
check(
  "wrong code does not grant access",
  (await page.evaluate(() =>
    localStorage.getItem("yfos:admin-access-granted:v1"),
  )) === null,
);

// Editing the input clears the error.
await page.locator(`${GATE} input`).fill("");
await page.locator(`${GATE} input`).type("x");
await page.waitForTimeout(150);
check(
  "typing clears the error",
  !(await page.locator(GATE).innerText()).includes("קוד שגוי"),
);

// 3. The correct code enters the app.
await page.locator(`${GATE} input`).fill(CODE);
await page.getByRole("button", { name: "אימות וכניסה" }).click();
await page.waitForTimeout(300);
check("correct code removes the gate", (await page.locator(GATE).count()) === 0);
check(
  "grant flag persisted",
  (await page.evaluate(() =>
    localStorage.getItem("yfos:admin-access-granted:v1"),
  )) === "1",
);
check("app chrome visible after entry", await page.locator("nav[aria-label]").isVisible());

// 4. Refresh in the same context does NOT show the gate again (and no flash).
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("refresh does not show gate again", (await page.locator(GATE).count()) === 0);

// 5. Settings "נעל מערכת" clears the grant and brings the gate back.
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(200);
await page.getByRole("button", { name: "נעל מערכת" }).click();
await page.waitForTimeout(300);
check("settings lock shows gate again", await page.locator(GATE).isVisible());
check(
  "grant flag cleared after lock",
  (await page.evaluate(() =>
    localStorage.getItem("yfos:admin-access-granted:v1"),
  )) === null,
);
await context.close();

await browser.close();

console.log(`\n===== CONSOLE ERRORS/WARNINGS (${consoleMsgs.length}) =====`);
consoleMsgs.forEach((m) => console.log(m));
if (!consoleMsgs.length) console.log("none");

console.log(`\n===== RESULT =====`);
if (failures.length || consoleMsgs.length) {
  console.log(`FAILED: ${failures.length} assertion(s), ${consoleMsgs.length} console msg(s)`);
  process.exit(1);
}
console.log("All admin access-code gate checks passed.");
