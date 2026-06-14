// Phase 3.xx QA: Workouts premium colour identity. Verifies the visual upgrade
// without touching logic — every template card derives a *distinct* colour
// identity from its dominant muscle groups (no more "same blue card again"),
// muscle chips paint in their own group hues, and the screen stays overflow-free
// and premium in both light and dark at mobile widths. Captures light/dark
// screenshots for the record.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "qa/screens";
mkdirSync(OUT, { recursive: true });

const issues = [];
const ok = (label) => console.log(" ✓ " + label);
const fail = (label) => issues.push(label);
const check = (cond, label) => (cond ? ok(label) : fail(label));

// Computed background-image of every "start workout" CTA — one per template card.
async function ctaGradients(page) {
  return page.$$eval('button', (btns) =>
    btns
      .filter((b) => b.textContent && b.textContent.includes("התחל אימון"))
      .map((b) => getComputedStyle(b).backgroundImage),
  );
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(BASE + "/workouts", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("yfos:welcome-seen:v1", "1");
    sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
    localStorage.setItem("yfos:admin-access-granted:v1", "1");
  });
  await page.reload({ waitUntil: "networkidle" });

  /* ----------- Per-card identity: distinct CTA gradients (light) ----------- */
  let grads = await ctaGradients(page);
  check(grads.length >= 4, `found template CTAs (${grads.length})`);
  let distinct = new Set(grads);
  check(
    distinct.size >= 4,
    `template cards have distinct colour identities — light (${distinct.size} of ${grads.length})`,
  );
  // The seed "back+biceps" card must lead blue, "chest+shoulders" must lead red —
  // proves the muscle→hue mapping actually reaches the card, not just any spread.
  const backBlue = grads.some((g) => g.includes("36, 86, 168"));
  const chestRed = grads.some((g) => g.includes("210, 63, 52"));
  check(backBlue, "back-led card paints its blue identity (light)");
  check(chestRed, "chest-led card paints its red identity (light)");

  /* ---------------- Muscle chips carry their own group hue ----------------- */
  const chipColors = await page.$$eval(
    "span",
    (spans) =>
      spans
        .filter((s) => {
          const t = (s.textContent || "").trim();
          return ["גב", "חזה", "כתפיים", "רגליים", "ליבה", "עכוז"].includes(t);
        })
        .map((s) => getComputedStyle(s).color),
  );
  check(
    new Set(chipColors).size >= 2,
    `muscle chips render multiple distinct hues (${new Set(chipColors).size})`,
  );

  let overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  check(!overflow, "no horizontal overflow — light, 390px");
  await page.screenshot({ path: `${OUT}/color-identity-light.png`, fullPage: true });

  /* ------------------------ Dark mode: still colourful --------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/workouts", { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  grads = await ctaGradients(page);
  distinct = new Set(grads);
  check(
    distinct.size >= 4,
    `template cards keep distinct identities — dark (${distinct.size} of ${grads.length})`,
  );
  overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  check(!overflow, "no horizontal overflow — dark, 390px");
  await page.screenshot({ path: `${OUT}/color-identity-dark.png`, fullPage: true });

  /* --------------------------- Narrow width (360) -------------------------- */
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(BASE + "/workouts", { waitUntil: "networkidle" });
  overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  check(!overflow, "no horizontal overflow — dark, 360px");

  await browser.close();
  console.log("\n===== WORKOUTS COLOUR IDENTITY QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("WORKOUTS COLOUR IDENTITY QA RUN FAILED:", e);
  process.exit(1);
});
