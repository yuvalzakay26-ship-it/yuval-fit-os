// QA pass for the Navigation & System Hub upgrade (Phase 3.xx).
// Usage: node scripts/qa-navigation.mjs (expects `next start -p 3331` running)
//
// Verifies the new bottom-nav shape (Today / Workouts / Nutrition / Progress /
// More), that Exercises moved out of the bottom nav, that /more loads with all
// its category links, that the active-tab state works for both primary and
// secondary routes, and that there is no horizontal overflow at 360px and
// 390px in both colour schemes. Pure navigation — localStorage-only, no backend.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3331";
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

// The bottom nav, by Hebrew label.
const NAV_PRESENT = ["היום", "אימונים", "תזונה", "התקדמות", "עוד"];
const NAV_ABSENT = ["תרגילים"];

// System Hub destinations that must be reachable as links.
const HUB_LINKS = [
  "/exercises",
  "/workouts",
  "/nutrition",
  "/nutrition/library",
  "/nutrition/add",
  "/nutrition/water",
  "/nutrition/supplements",
  "/progress",
  "/learn",
  "/settings",
];

for (const scheme of ["dark", "light"]) {
  for (const width of [360, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 800 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: scheme,
    });
    // Clear the access gates so the app chrome (and bottom nav) render.
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        sessionStorage.setItem(
          "yfos:private-access-notice-accepted:session",
          "1",
        );
        localStorage.setItem("yfos:admin-access-granted:v1", "1");
      } catch {}
    });
    const page = await ctx.newPage();
    const tag = `${scheme}/${width}`;
    page.on(
      "console",
      (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
    );
    page.on("pageerror", (e) =>
      errors.push(`[${tag}] pageerror: ${e.message}`),
    );

    /* 1. Bottom nav shape on Today. */
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    const nav = page.getByRole("navigation", { name: "ניווט ראשי" });
    for (const label of NAV_PRESENT) {
      check(
        `[${tag}] bottom nav contains ${label}`,
        await nav.getByText(label, { exact: true }).isVisible(),
      );
    }
    for (const label of NAV_ABSENT) {
      check(
        `[${tag}] bottom nav does NOT contain ${label}`,
        (await nav.getByText(label, { exact: true }).count()) === 0,
      );
    }
    check(`[${tag}] no horizontal overflow on Today`, (await noOverflow(page)) === 0);

    /* 2. The More tab navigates to /more and the hub renders. */
    await nav.getByRole("link", { name: "עוד" }).click();
    await page.waitForURL(/\/more$/);
    check(
      `[${tag}] /more shows hub title`,
      await page.getByRole("heading", { name: "מרכז מערכת" }).isVisible(),
    );
    check(
      `[${tag}] /more shows subtitle`,
      await page.getByText("כל הכלים של Fit OS במקום אחד").isVisible(),
    );
    for (const title of ["כושר", "תזונה", "התקדמות ולמידה", "מערכת"]) {
      check(
        `[${tag}] hub has section ${title}`,
        await page.getByText(title, { exact: true }).first().isVisible(),
      );
    }
    for (const href of HUB_LINKS) {
      check(
        `[${tag}] hub links to ${href}`,
        (await page.locator(`a[href="${href}"]`).count()) >= 1,
      );
    }
    check(
      `[${tag}] no horizontal overflow on /more`,
      (await noOverflow(page)) === 0,
    );

    /* 3. Active-tab state: More is current on /more. */
    check(
      `[${tag}] More tab is active on /more`,
      (await nav
        .getByRole("link", { name: "עוד" })
        .getAttribute("aria-current")) === "page",
    );
    if (scheme === "dark" && width === 390) {
      await page.screenshot({ path: `${OUT}/more-${scheme}.png`, fullPage: true });
    }

    /* 4. Exercises is reachable from the hub and keeps More active there. */
    await page.locator('a[href="/exercises"]').first().click();
    await page.waitForURL(/\/exercises$/);
    check(
      `[${tag}] /exercises still loads (תרגילים)`,
      await page.getByRole("heading", { name: "תרגילים" }).isVisible(),
    );
    check(
      `[${tag}] More tab is active on /exercises`,
      (await nav
        .getByRole("link", { name: "עוד" })
        .getAttribute("aria-current")) === "page",
    );

    /* 5. A primary route keeps its own tab active. */
    await page.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
    check(
      `[${tag}] Nutrition tab is active on /nutrition`,
      (await nav
        .getByRole("link", { name: "תזונה" })
        .getAttribute("aria-current")) === "page",
    );
    // A nutrition sub-route keeps the Nutrition tab active (not More).
    await page.goto(`${BASE}/nutrition/water`, { waitUntil: "networkidle" });
    check(
      `[${tag}] Nutrition tab is active on /nutrition/water`,
      (await nav
        .getByRole("link", { name: "תזונה" })
        .getAttribute("aria-current")) === "page",
    );

    await ctx.close();
  }
}

await browser.close();
if (errors.length) {
  console.log(`CONSOLE ERRORS:\n${errors.join("\n")}`);
  failures++;
} else {
  console.log("No console errors.");
}
process.exit(failures ? 1 : 0);
