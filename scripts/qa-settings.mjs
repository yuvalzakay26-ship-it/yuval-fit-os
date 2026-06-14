// QA pass for the Settings Control Center upgrade (Phase 3.xx).
// Usage: node scripts/qa-settings.mjs (expects `next start -p 3332` running)
//
// Verifies the premium Settings "control center": the page loads at /settings,
// the appearance control offers EXACTLY two modes (בהיר / כהה) with no "מערכת"
// option, the header theme button toggles only light/dark, the sensitive-actions
// section is present and visually separated, a stored legacy `theme:"system"` is
// migrated/sanitized (not crashing, בהיר selected), and there is no horizontal
// overflow or console error at 360px and 390px in both colour schemes.
// localStorage-only, no backend.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3332";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};

const noOverflow = (page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

// Seed the three gates so the app chrome renders, optionally pinning the theme.
const seedGates = (theme) => {
  // Playwright serializes this function; `theme` is injected as an argument.
  return (t) => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem(
        "yfos:private-access-notice-accepted:session",
        "1",
      );
      localStorage.setItem("yfos:admin-access-granted:v1", "1");
      if (t) localStorage.setItem("yfos:settings", JSON.stringify({ theme: t }));
    } catch {}
  };
};

for (const scheme of ["dark", "light"]) {
  for (const width of [360, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: scheme,
    });
    // Pin the app theme to the scheme so both themes are genuinely exercised
    // (the app no longer follows the OS — it is light/dark only, user-chosen).
    await ctx.addInitScript(seedGates(scheme), scheme);
    const page = await ctx.newPage();
    const tag = `${scheme}/${width}`;
    page.on(
      "console",
      (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
    );
    page.on("pageerror", (e) =>
      errors.push(`[${tag}] pageerror: ${e.message}`),
    );

    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });

    /* 1. The page loads with its header. */
    check(
      `[${tag}] /settings shows title`,
      await page.getByRole("heading", { name: "הגדרות" }).isVisible(),
    );

    /* 2. Appearance: exactly two options, both present, no "מערכת". */
    check(
      `[${tag}] appearance has בהיר`,
      await page.getByRole("button", { name: /בהיר/ }).isVisible(),
    );
    check(
      `[${tag}] appearance has כהה`,
      await page.getByRole("button", { name: /כהה/ }).isVisible(),
    );
    // The removed appearance option's button had the accessible name exactly
    // "מערכת". Use exact matching so the unrelated "נעל מערכת" (lock) button and
    // the "מידע מערכת" heading do not produce a false positive.
    check(
      `[${tag}] no "מערכת" appearance option`,
      (await page.getByRole("button", { name: "מערכת", exact: true }).count()) ===
        0,
    );

    /* 3. Sensitive-actions section is present and separated. */
    check(
      `[${tag}] sensitive section present`,
      await page.getByText("פעולות רגישות", { exact: true }).isVisible(),
    );
    check(
      `[${tag}] reset-all action present`,
      await page.getByRole("button", { name: "איפוס כל הנתונים" }).isVisible(),
    );

    /* 4. The selected appearance reflects the pinned theme. */
    const selectedLabel = scheme === "dark" ? /כהה/ : /בהיר/;
    check(
      `[${tag}] ${scheme} card is selected (aria-pressed)`,
      (await page
        .getByRole("button", { name: selectedLabel })
        .getAttribute("aria-pressed")) === "true",
    );
    check(
      `[${tag}] html.dark matches theme=${scheme}`,
      (await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
      )) === (scheme === "dark"),
    );

    // Capture the pinned-theme render here, before the toggle test mutates it.
    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/settings-${scheme}.png`,
        fullPage: true,
      });
    }

    /* 5. Header theme button toggles ONLY light/dark. */
    const before = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    await page.getByRole("button", { name: "החלפת מצב תצוגה" }).click();
    await page.waitForTimeout(120);
    const after = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    check(`[${tag}] header toggle flips the theme`, before !== after);

    /* 6. No horizontal overflow. */
    check(
      `[${tag}] no horizontal overflow on /settings`,
      (await noOverflow(page)) === 0,
    );

    await ctx.close();
  }
}

/* 7. Migration: a legacy `theme:"system"` is sanitized to light (no crash,
      בהיר selected, no dark class), and "system" is never shown as an option. */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 900 },
    colorScheme: "dark",
  });
  await ctx.addInitScript(seedGates("system"), "system");
  const page = await ctx.newPage();
  page.on(
    "console",
    (m) => m.type() === "error" && errors.push(`[migration] ${m.text()}`),
  );
  page.on("pageerror", (e) =>
    errors.push(`[migration] pageerror: ${e.message}`),
  );
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  check(
    `[migration] legacy "system" loads without crash`,
    await page.getByRole("heading", { name: "הגדרות" }).isVisible(),
  );
  check(
    `[migration] legacy "system" → בהיר selected`,
    (await page
      .getByRole("button", { name: /בהיר/ })
      .getAttribute("aria-pressed")) === "true",
  );
  check(
    `[migration] legacy "system" → no dark class`,
    (await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    )) === false,
  );
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
