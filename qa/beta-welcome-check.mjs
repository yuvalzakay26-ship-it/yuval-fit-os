// Phase 3.xx beta-welcome-notice QA. Drives Chromium at phone width through the
// friendly beta welcome notice that replaced the old private-access gate.
//
// The notice only appears AFTER the real beta access gate has let the user in.
// This script assumes the STANDARD QA server (built/served with
// NEXT_PUBLIC_BETA_DISABLE_GATE=1, like every other feature-test script). In that
// testing seam the welcome greets only when a local guest session is seeded —
// which lets the feature-test scripts reach app screens unobstructed while this
// dedicated script can still exercise the notice. It checks:
//   - a granted (guest) user with a clean flag sees the welcome once;
//   - the welcoming Hebrew copy, contact number + WhatsApp link are present;
//   - there is NO password / text input and NO harsh "private/forbidden" copy;
//   - acknowledging enters the app and persists the flag; a refresh does not
//     re-show it; Settings "הצג הודעת בטא שוב" brings it back and clears the flag;
//   - a NON-granted visitor (no guest session) never sees the notice.
// Watches the console and checks for horizontal overflow at 360 + 390. Assumes a
// dev/prod server on :3000 (override with QA_BASE, e.g.
// QA_BASE=http://localhost:3199).
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const GATE = "[data-beta-welcome-gate]";

// Wording that would belong to the OLD private-access notice — the welcome must
// never read like a security warning.
const FORBIDDEN_COPY = [
  "מערכת פרטית",
  "גישה פרטית",
  "אין להעביר",
  "אסור להעביר",
  "אזהרה",
  "הפרת תנאים",
];

const failures = [];
const consoleMsgs = [];

function check(label, condition) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
  if (!condition) failures.push(label);
}

const browser = await chromium.launch();

async function newSession({ width = 390, guest = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      consoleMsgs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleMsgs.push(`[pageerror] ${e.message}`));
  // Seed the first-visit welcome flag (so the welcome screen never confounds
  // this run) and, when requested, a local guest session so the access gate
  // counts the visitor as "in" and the welcome is eligible to show. The
  // beta-welcome flag itself is left CLEAN so the notice still appears.
  await page.addInitScript((isGuest) => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yfos:admin-access-granted:v1", "1");
      if (isGuest) localStorage.setItem("yuval-fit-os:guest-session:v1", "1");
    } catch {}
  }, guest);
  return { context, page };
}

// 1. Granted (guest) user with a clean flag sees the welcome notice.
let { context, page } = await newSession({ width: 390, guest: true });
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
check("granted user sees beta welcome notice", await page.locator(GATE).isVisible());

const noticeText = await page.locator(GATE).innerText();
check(
  "notice shows title ברוכים הבאים ל־Fit OS",
  noticeText.includes("ברוכים הבאים ל־Fit OS"),
);
check(
  "notice shows the friendly opener",
  noticeText.includes("שמחים שהצטרפתם"),
);
check("notice shows Yuval's phone number", noticeText.includes("053-333-9341"));
check(
  "notice has a WhatsApp link to Yuval",
  (await page.locator(`${GATE} a[href="https://wa.me/972533339341"]`).count()) === 1,
);
check(
  "notice has the primary CTA",
  noticeText.includes("הבנתי, המשך למערכת"),
);

// No password / code / text input anywhere on the notice.
check(
  "no password input on notice",
  (await page.locator(`${GATE} input[type=password]`).count()) === 0,
);
check("no text input on notice", (await page.locator(`${GATE} input`).count()) === 0);

// No harsh private-access / security wording.
for (const phrase of FORBIDDEN_COPY) {
  check(`notice does not use harsh copy "${phrase}"`, !noticeText.includes(phrase));
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

// 2. Acknowledging enters the app and persists the flag.
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "הבנתי, המשך למערכת" }).click();
await page.waitForTimeout(300);
check("acknowledging removes the notice", (await page.locator(GATE).count()) === 0);
check(
  "beta-welcome flag persisted",
  (await page.evaluate(() => localStorage.getItem("yfos:beta-welcome-seen:v1"))) === "1",
);
check("app chrome visible after entry", await page.locator("nav[aria-label]").isVisible());

// 3. Refresh does NOT show the notice again (flag remembered, no flash).
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("refresh does not show notice again", (await page.locator(GATE).count()) === 0);

// 4. Settings "הצג הודעת בטא שוב" brings the notice back and clears the flag.
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(200);
await page.getByRole("button", { name: "הצג הודעת בטא שוב" }).click();
await page.waitForTimeout(300);
check("settings action shows notice again", await page.locator(GATE).isVisible());
check(
  "beta-welcome flag cleared after reset",
  (await page.evaluate(() => localStorage.getItem("yfos:beta-welcome-seen:v1"))) === null,
);
await context.close();

// 5. A NON-granted visitor (no guest session) never sees the notice.
({ context, page } = await newSession({ width: 390, guest: false }));
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
check(
  "non-granted visitor does not see the notice",
  (await page.locator(GATE).count()) === 0,
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
console.log("All beta-welcome-notice checks passed.");
