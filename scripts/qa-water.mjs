// QA pass for Premium Water Tracking (Phase 3.20).
// Usage: node scripts/qa-water.mjs (expects `next start -p 3320` running)
//
// Covers the Today card, the Nutrition card, the full /nutrition/water screen
// (quick-add, custom amount, delete, reset, persistence), the Settings goal,
// per-day separation, and both color schemes — asserting no console errors and
// no horizontal overflow throughout. localStorage-only; no backend.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3320";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};

const WATER = `${BASE}/nutrition/water`;
const ADD_500 = 'הוסף 500 מ"ל';
const ADD_750 = 'הוסף 750 מ"ל';
const EMPTY = "עדיין לא נרשמו מים היום";

const noOverflow = (page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

for (const scheme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  // Pre-seed the welcome flag + a past day's water log to verify day separation
  // (the past day must stay stored but never leak into today's view).
  // Seed ONCE: addInitScript runs on every navigation, so guard the water key
  // or each page load would wipe changes made on the previous screen.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      if (!localStorage.getItem("yfos:water-logs:v1")) {
        localStorage.setItem(
          "yfos:water-logs:v1",
          JSON.stringify([
            {
              date: "2020-01-01",
              totalMl: 1000,
              entries: [
                { id: "seed1", amountMl: 1000, createdAt: "2020-01-01T08:00:00.000Z" },
              ],
            },
          ]),
        );
      }
    } catch {}
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${scheme}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${scheme}] pageerror: ${e.message}`));

  /* 1. Today shows the hydration card with the default goal; quick-add works. */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check(`[${scheme}] Today shows הידרציה section`, await page.getByText("הידרציה", { exact: true }).isVisible());
  check(`[${scheme}] Today water card shows default goal`, await page.getByText("מתוך 2.5 ליטר").first().isVisible());
  await page.getByRole("button", { name: ADD_500, exact: true }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] Today total updates to 0.5 ליטר after +500`, await page.getByText("0.5 ליטר").first().isVisible());
  check(`[${scheme}] no horizontal overflow on Today`, (await noOverflow(page)) === 0);
  await page.screenshot({ path: `${OUT}/water-${scheme}-today.png` });

  /* 2. Nutrition shows a compact water card; the +500 persisted across nav. */
  await page.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
  check(`[${scheme}] Nutrition shows מעקב מים card`, await page.getByText("מעקב מים").first().isVisible());
  check(`[${scheme}] Nutrition water total persisted (0.5 ליטר)`, await page.getByText("0.5 ליטר").first().isVisible());
  check(`[${scheme}] no horizontal overflow on Nutrition`, (await noOverflow(page)) === 0);

  /* 3. Detail screen opens via the card link; header + entry + gauge present. */
  await page.getByRole("link", { name: "פתח מעקב מים" }).click();
  await page.waitForURL(/\/nutrition\/water/);
  check(`[${scheme}] detail header מעקב מים`, await page.getByRole("heading", { name: "מעקב מים" }).isVisible());
  check(`[${scheme}] detail helper text`, await page.getByText("כמה מים שתית היום").isVisible());
  check(`[${scheme}] detail lists the 500 entry`, await page.getByText('500 מ"ל', { exact: true }).first().isVisible());
  check(`[${scheme}] gauge shows 20%`, await page.getByText("20%").isVisible());

  /* 4. Quick-add on the detail screen updates the total. */
  await page.getByRole("button", { name: ADD_750, exact: true }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] total updates to 1.3 ליטר after +750`, await page.getByText("1.3").first().isVisible());

  /* 5. Custom amount adds a precise entry. */
  await page.getByLabel('כמות מותאמת במ"ל').fill("300");
  await page.getByRole("button", { name: "הוסף כמות מותאמת" }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] custom 300 entry appears`, await page.getByText('300 מ"ל', { exact: true }).first().isVisible());
  await page.screenshot({ path: `${OUT}/water-${scheme}-detail.png` });

  /* 6. Delete an entry. */
  const beforeDelete = await page.getByRole("button", { name: "מחיקת רשומה" }).count();
  await page.getByRole("button", { name: "מחיקת רשומה" }).first().click();
  await page.waitForTimeout(150);
  const afterDelete = await page.getByRole("button", { name: "מחיקת רשומה" }).count();
  check(`[${scheme}] deleting an entry reduces the count`, afterDelete === beforeDelete - 1);

  /* 7. Persistence across reload. */
  await page.reload({ waitUntil: "networkidle" });
  check(`[${scheme}] entries persist after reload`, (await page.getByRole("button", { name: "מחיקת רשומה" }).count()) >= 1);

  /* 8. Reset today (confirm-gated) → empty state, and it persists. */
  await page.getByRole("button", { name: "אפס את היום" }).click();
  await page.getByRole("button", { name: "כן, אפס את היום" }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] reset shows empty state`, await page.getByText(EMPTY).isVisible());
  await page.reload({ waitUntil: "networkidle" });
  check(`[${scheme}] reset persists after reload`, await page.getByText(EMPTY).isVisible());
  check(`[${scheme}] no horizontal overflow on detail`, (await noOverflow(page)) === 0);

  /* 9. Day separation: the seeded 2020 day stays in storage, untouched. */
  const hasPastDay = await page.evaluate(() => {
    try {
      const logs = JSON.parse(localStorage.getItem("yfos:water-logs:v1") || "[]");
      return logs.some((l) => l.date === "2020-01-01" && l.totalMl === 1000);
    } catch {
      return false;
    }
  });
  check(`[${scheme}] past day persists separately from today`, hasPastDay);

  /* 10. Settings goal update reflects on the detail screen. */
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  check(`[${scheme}] Settings shows יעד מים יומי`, await page.getByText("יעד מים יומי").isVisible());
  await page.fill("#water-goal", "3");
  await page.waitForTimeout(150);
  await page.goto(WATER, { waitUntil: "networkidle" });
  check(`[${scheme}] detail reflects new 3 ליטר goal`, await page.getByText("/ 3 ליטר").isVisible());

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
