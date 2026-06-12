// QA pass for the exercise image viewer (lightbox).
// Usage: node scripts/qa-image-viewer.mjs (expects `next start -p 3199` running)
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3199";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;

function check(name, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
}

for (const scheme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  // Pre-seed the access gate (Phase 3.5) so QA lands directly on the app.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:access-granted:v1", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${scheme}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${scheme}] pageerror: ${e.message}`));

  await page.goto(`${BASE}/exercises`, { waitUntil: "networkidle" });

  // Expand the first back exercise and open the viewer via the image button.
  await page.getByRole("button", { name: "גב", exact: true }).click();
  await page.locator('button[aria-expanded="false"]').first().click();
  const openBtn = page.getByRole("button", { name: "פתח תמונה גדולה" }).first();
  check(`[${scheme}] expand affordance visible`, await openBtn.isVisible());
  await page.screenshot({ path: `${OUT}/viewer-${scheme}-expanded-card.png` });

  await openBtn.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  check(`[${scheme}] viewer dialog opens`, await dialog.isVisible());

  const contained = await dialog.locator("img.object-contain").count();
  check(`[${scheme}] viewer image uses object-contain`, contained === 1);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`[${scheme}] no horizontal overflow with viewer open`, overflow === 0);
  await page.waitForTimeout(700); // allow the full-size image to load
  await page.screenshot({ path: `${OUT}/viewer-${scheme}-open.png` });

  // Close via X button.
  await page.getByRole("button", { name: "סגור תמונה" }).click();
  check(`[${scheme}] closes via X button`, (await dialog.count()) === 0);

  // Reopen, close via backdrop tap (top-most pixel column, outside content).
  await openBtn.click();
  await dialog.waitFor({ state: "visible" });
  await page.mouse.click(195, 800);
  check(`[${scheme}] closes via backdrop tap`, (await dialog.count()) === 0);

  // Reopen, close via Escape.
  await openBtn.click();
  await dialog.waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  check(`[${scheme}] closes via Escape`, (await dialog.count()) === 0);

  // Body scroll restored after close.
  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  check(`[${scheme}] body scroll restored`, bodyOverflow !== "hidden");

  // Fallback: placeholder-only exercises must not offer a viewer. Biceps
  // ("יד קדמית") has no wired images yet (legs/shoulders now do).
  await page.getByRole("button", { name: "יד קדמית", exact: true }).click();
  await page.locator('button[aria-expanded="false"]').first().click();
  const fallbackBtns = await page.getByRole("button", { name: "פתח תמונה גדולה" }).count();
  check(`[${scheme}] no viewer affordance on placeholder exercises`, fallbackBtns === 0);

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
