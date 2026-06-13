// Phase 3.24 private-access-notice QA. Drives Chromium at phone width through
// the private-access notice gate: a fresh session shows it, tapping
// "הבנתי, כניסה למערכת" enters the app, a refresh in the same session does NOT
// show it again (sessionStorage flag), a brand-new session shows it again, and
// the Settings "הצג מסך גישה פרטית" action brings it back. Also confirms there
// is NO password input and no false-security copy, watches the console, and
// checks for horizontal overflow at 360 + 390. Assumes a dev/prod server on
// :3000 (override with QA_BASE, e.g. QA_BASE=http://localhost:3199).
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const GATE = "[data-private-access-gate]";

// Copy that would imply real auth / device tracking — must NOT appear. (The
// "no password" concern is covered by the input-count assertions below; the
// notice legitimately mentions "ללא סיסמה בשלב זה", so the word itself is fine.)
const FORBIDDEN_COPY = [
  "אנחנו מזהים מכשירים אחרים",
  "השימוש שלך מנוטר",
  "המערכת מנטרת אותך",
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
  const context = await browser.newContext({
    viewport: { width, height: 844 },
  });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      consoleMsgs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleMsgs.push(`[pageerror] ${e.message}`));
  // Seed the welcome flag so the welcome screen never confounds this script —
  // we are testing the private-access notice in isolation.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
    } catch {}
  });
  return { context, page };
}

// 1. Fresh session shows the notice.
let { context, page } = await newSession(390);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("fresh session shows private-access notice", await page.locator(GATE).isVisible());
check(
  "notice shows title מערכת פרטית",
  (await page.locator(GATE).innerText()).includes("מערכת פרטית"),
);

// No password / code / text input anywhere on the notice.
check(
  "no password input on notice",
  (await page.locator(`${GATE} input[type=password]`).count()) === 0,
);
check("no text input on notice", (await page.locator(`${GATE} input`).count()) === 0);

// No false-security or password/code copy.
const noticeText = await page.locator(GATE).innerText();
for (const phrase of FORBIDDEN_COPY) {
  check(`notice does not claim "${phrase}"`, !noticeText.includes(phrase));
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
  check(`no horizontal overflow on notice @${width}`, !overflow);
}

// 2. Tapping the CTA enters the app — no code required.
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "הבנתי, כניסה למערכת" }).click();
await page.waitForTimeout(300);
check("accepting removes the notice", (await page.locator(GATE).count()) === 0);
check(
  "session flag persisted",
  (await page.evaluate(() =>
    sessionStorage.getItem("yfos:private-access-notice-accepted:session"),
  )) === "1",
);
check("app chrome visible after accept", await page.locator("nav[aria-label]").isVisible());

// 3. Refresh in the SAME session does NOT show the notice again (and no flash).
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("refresh in same session does not show notice", (await page.locator(GATE).count()) === 0);

// 4. Settings "הצג מסך גישה פרטית" brings the notice back.
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(200);
await page.getByRole("button", { name: "הצג מסך גישה פרטית" }).click();
await page.waitForTimeout(300);
check("settings action shows notice again", await page.locator(GATE).isVisible());
check(
  "session flag cleared after reset",
  (await page.evaluate(() =>
    sessionStorage.getItem("yfos:private-access-notice-accepted:session"),
  )) === null,
);
await context.close();

// 5. A brand-new session shows the notice again (sessionStorage is per-session).
({ context, page } = await newSession(390));
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("new session shows the notice again", await page.locator(GATE).isVisible());
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
console.log("All private-access-notice checks passed.");
