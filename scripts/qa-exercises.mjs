// QA pass for the Exercises screen after the image imports (Phase 3.11).
// The library is now complete (every seeded exercise has a real image), so the
// checks are data-driven: rather than hardcoding "biceps has no image" style
// assumptions, each muscle-group filter asserts that the rendered cards carry
// real <img> tags and that no gradient placeholders ([data-image-key]) remain.
// Usage: node scripts/qa-exercises.mjs (expects `next start -p 3199` running)
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.QA_BASE ?? "http://localhost:3199";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

// Muscle-group chips to exercise per run. Labels mirror MUSCLE_GROUP_LABELS;
// the counts are not hardcoded — we assert coverage by comparing rendered
// cards to rendered images, so this list only drives which filters to visit.
const GROUPS = [
  "גב",
  "עכוז",
  "חזה",
  "כתפיים",
  "רגליים",
  "יד קדמית",
  "יד אחורית",
  "ליבה",
];

const browser = await chromium.launch();
const errors = [];
let failures = 0;

function check(name, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failures++;
}

async function makePage(colorScheme) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme,
  });
  // Pre-seed both gate flags so QA lands directly on the app.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1"); localStorage.setItem("yfos:admin-access-granted:v1", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${colorScheme}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[${colorScheme}] pageerror: ${err.message}`));
  return page;
}

// Counts cards (expand buttons), real exercise images, and gradient
// placeholders currently in the DOM — the basis for the coverage assertion.
async function snapshot(page) {
  return page.evaluate(() => ({
    cards: document.querySelectorAll('button[aria-expanded]').length,
    images: document.querySelectorAll('img[src*="exercises"]').length,
    placeholders: document.querySelectorAll("[data-image-key]").length,
  }));
}

for (const scheme of ["dark", "light"]) {
  const page = await makePage(scheme);
  await page.goto(`${BASE}/exercises`, { waitUntil: "networkidle" });

  // No horizontal overflow.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`[${scheme}] no horizontal overflow on /exercises`, overflow === 0, `${overflow}px`);

  // "All" view: every card must carry a real image, none a placeholder.
  const all = await snapshot(page);
  check(
    `[${scheme}] all cards have a real image (no fallbacks)`,
    all.cards > 0 && all.images === all.cards && all.placeholders === 0,
    `${all.images}/${all.cards} images, ${all.placeholders} placeholders`,
  );
  await page.screenshot({ path: `${OUT}/exercises-${scheme}-all.png` });

  // Each muscle-group filter: cards render and all of them have real images.
  for (const label of GROUPS) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(450);
    const s = await snapshot(page);
    check(
      `[${scheme}] "${label}" filter fully imaged`,
      s.cards > 0 && s.images === s.cards && s.placeholders === 0,
      `${s.images}/${s.cards}`,
    );
  }

  // Expand the last visited group's first card for a viewer smoke screenshot.
  await page.locator('button[aria-expanded="false"]').first().click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/exercises-${scheme}-expanded.png` });

  await page.context().close();
}

await browser.close();
if (errors.length) {
  console.log(`CONSOLE ERRORS:\n${errors.join("\n")}`);
  failures++;
} else {
  console.log("No console errors.");
}
console.log(failures ? `\n${failures} check(s) FAILED.` : "\nAll exercise QA checks passed.");
process.exit(failures ? 1 : 0);
