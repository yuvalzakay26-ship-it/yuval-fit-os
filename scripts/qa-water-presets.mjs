// QA pass for Personal Water Presets (Phase 3.26).
// Usage: node scripts/qa-water-presets.mjs (expects `next start -p 3326` running)
//
// Covers: the default presets appear, a preset tap creates a WaterEntry with the
// configured amount, the compact Today card shows only the 3 leading presets,
// the full /nutrition/water screen shows the full set + custom + edit shortcut,
// editing a preset amount changes future entries, and reset-to-defaults restores
// the originals — all with no horizontal overflow and no console errors.
// localStorage-only; no backend.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3326";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const WATER = `${BASE}/nutrition/water`;
const PRESETS = `${BASE}/nutrition/water/presets`;

const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};

const noOverflow = (page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

// Default preset chips, by accessible name.
const CUP = 'הוסף כוס, 250 מ"ל';
const BOTTLE = 'הוסף בקבוק, 500 מ"ל';
const MY_BOTTLE = 'הוסף הבקבוק שלי, 750 מ"ל';
const LARGE = 'הוסף בקבוק גדול, 1500 מ"ל';

for (const scheme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${scheme}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${scheme}] pageerror: ${e.message}`));

  /* 1. Full water screen shows the full default preset set + custom + edit link. */
  await page.goto(WATER, { waitUntil: "networkidle" });
  check(`[${scheme}] full screen shows כוס preset`, await page.getByRole("button", { name: CUP, exact: true }).isVisible());
  check(`[${scheme}] full screen shows בקבוק preset`, await page.getByRole("button", { name: BOTTLE, exact: true }).isVisible());
  check(`[${scheme}] full screen shows הבקבוק שלי preset`, await page.getByRole("button", { name: MY_BOTTLE, exact: true }).isVisible());
  check(`[${scheme}] full screen shows בקבוק גדול preset`, await page.getByRole("button", { name: LARGE, exact: true }).isVisible());
  check(`[${scheme}] full screen has custom amount input`, await page.getByLabel('כמות מותאמת במ"ל').isVisible());
  check(`[${scheme}] full screen has עריכת קיצורים link`, await page.getByRole("link", { name: "עריכת קיצורים" }).isVisible());

  /* 2. Tapping a preset creates a WaterEntry with the configured amount. */
  await page.getByRole("button", { name: CUP, exact: true }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] כוס tap logs a 250 entry`, await page.getByText('250 מ"ל', { exact: true }).first().isVisible());
  await page.getByRole("button", { name: LARGE, exact: true }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] בקבוק גדול tap logs a 1500 entry`, await page.getByText('1500 מ"ל', { exact: true }).first().isVisible());

  /* 3. Custom amount still works. */
  await page.getByLabel('כמות מותאמת במ"ל').fill("333");
  await page.getByRole("button", { name: "הוסף כמות מותאמת" }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] custom 333 entry appears`, await page.getByText('333 מ"ל', { exact: true }).first().isVisible());
  check(`[${scheme}] no horizontal overflow on full water screen`, (await noOverflow(page)) === 0);
  await page.screenshot({ path: `${OUT}/water-presets-${scheme}-full.png` });

  /* 4. Today stays compact: only the 3 leading presets (no בקבוק גדול). */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check(`[${scheme}] Today shows כוס preset`, await page.getByRole("button", { name: CUP, exact: true }).isVisible());
  check(`[${scheme}] Today shows בקבוק preset`, await page.getByRole("button", { name: BOTTLE, exact: true }).isVisible());
  check(`[${scheme}] Today shows הבקבוק שלי preset`, await page.getByRole("button", { name: MY_BOTTLE, exact: true }).isVisible());
  check(`[${scheme}] Today hides בקבוק גדול (compact)`, (await page.getByRole("button", { name: LARGE, exact: true }).count()) === 0);
  check(`[${scheme}] no horizontal overflow on Today`, (await noOverflow(page)) === 0);

  /* 5. Editing a preset amount changes future entries. */
  await page.goto(PRESETS, { waitUntil: "networkidle" });
  check(`[${scheme}] editor heading קיצורי מים`, await page.getByRole("heading", { name: "קיצורי מים" }).isVisible());
  await page.getByLabel('כמות במ"ל עבור כוס').fill("400");
  await page.getByRole("button", { name: "שמור קיצורים" }).click();
  await page.waitForURL(/\/nutrition\/water$/);
  await page.waitForTimeout(150);
  const CUP_400 = 'הוסף כוס, 400 מ"ל';
  check(`[${scheme}] כוס chip reflects edited 400 amount`, await page.getByRole("button", { name: CUP_400, exact: true }).isVisible());
  await page.getByRole("button", { name: CUP_400, exact: true }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] edited כוס logs a 400 entry`, await page.getByText('400 מ"ל', { exact: true }).first().isVisible());
  await page.screenshot({ path: `${OUT}/water-presets-${scheme}-editor.png` });

  /* 6. Reset to defaults restores the originals. */
  await page.goto(PRESETS, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "איפוס לברירת מחדל" }).click();
  await page.getByRole("button", { name: "כן, אפס" }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] reset restores כוס amount to 250`, (await page.getByLabel('כמות במ"ל עבור כוס').inputValue()) === "250");
  check(`[${scheme}] no horizontal overflow on editor`, (await noOverflow(page)) === 0);
  await page.goto(WATER, { waitUntil: "networkidle" });
  check(`[${scheme}] full screen shows restored כוס 250 preset`, await page.getByRole("button", { name: CUP, exact: true }).isVisible());

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
