// QA pass for Nutrition favorite foods (Phase 3.19).
// Usage: node scripts/qa-favorites.mjs (expects `next start -p 3199` running)
//
// Covers toggle + persistence + filter + search, the Nutrition quick section,
// and the interaction with saved values. Favorites are identity-only — this
// script asserts that favoriting never fills in macros.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3199";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); if (!ok) failures++; };

const LIB = `${BASE}/nutrition/library`;
const FAV_VIEW = `${LIB}?view=favorites`;
const FAV_CHIP = "מועדפים";
const ADD_FAV = "הוסף למועדפים";
const REMOVE_FAV = "הסר מהמועדפים";
const EMPTY = "עדיין אין מאכלים מועדפים";

const noOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const scheme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  // Pre-seed the welcome flag + a saved value for boiled-eggs (Phase 3.18) so we
  // can confirm favorites and saved values compose.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem(
        "yfos:saved-food-values:v1",
        JSON.stringify({
          "boiled-eggs": {
            sourceFoodId: "boiled-eggs",
            foodName: "ביצים קשות",
            quantity: "2 יחידות",
            protein: 13,
            carbs: 1,
            fat: 11,
            calories: 155,
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        }),
      );
    } catch {}
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${scheme}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${scheme}] pageerror: ${e.message}`));

  /* 1. Library opens; no favorites yet → no favorites chip. */
  await page.goto(LIB, { waitUntil: "networkidle" });
  check(`[${scheme}] favorites chip absent initially`, !(await page.getByRole("button", { name: FAV_CHIP, exact: true }).count()));

  /* 2. Favorite the first card; chip appears; star flips to active. */
  await page.getByRole("button", { name: ADD_FAV, exact: true }).first().click();
  check(`[${scheme}] favorites chip appears after favoriting`, await page.getByRole("button", { name: FAV_CHIP, exact: true }).isVisible());
  check(`[${scheme}] a card now shows active (remove) star`, (await page.getByRole("button", { name: REMOVE_FAV, exact: true }).count()) >= 1);
  await page.screenshot({ path: `${OUT}/fav-${scheme}-library.png` });

  /* 3. Persists across reload. */
  await page.reload({ waitUntil: "networkidle" });
  check(`[${scheme}] favorite persists after reload`, (await page.getByRole("button", { name: REMOVE_FAV, exact: true }).count()) >= 1);

  /* 4. Favorites filter shows only favorites; search still works inside it. */
  await page.getByRole("button", { name: FAV_CHIP, exact: true }).click();
  const favCount = await page.getByRole("button", { name: REMOVE_FAV, exact: true }).count();
  check(`[${scheme}] favorites view shows favorited item(s)`, favCount >= 1);
  await page.fill('input[placeholder="חיפוש מאכל…"]', "zzzqqq");
  check(`[${scheme}] favorites empty state on no match`, await page.getByText(EMPTY).isVisible());
  await page.fill('input[placeholder="חיפוש מאכל…"]', "");
  check(`[${scheme}] favorites return after clearing search`, (await page.getByRole("button", { name: REMOVE_FAV, exact: true }).count()) >= 1);

  /* 5. Add screen: favorite indicator + toggle, and saved values still prefill. */
  await page.goto(`${BASE}/nutrition/add?foodId=boiled-eggs`, { waitUntil: "networkidle" });
  await page.getByText("נטען מהערכים ששמרת").waitFor({ state: "visible" });
  check(`[${scheme}] saved value prefills a favoritable food`, (await page.inputValue("#protein")) === "13");
  check(`[${scheme}] add screen offers favorite toggle`, await page.getByRole("button", { name: ADD_FAV, exact: true }).isVisible());
  await page.getByRole("button", { name: ADD_FAV, exact: true }).click();
  check(`[${scheme}] add screen shows מועדף indicator`, await page.getByText("מועדף", { exact: true }).isVisible());

  /* 6. Favoriting never invents macros (food with no saved value stays empty). */
  await page.goto(`${BASE}/nutrition/add?foodId=apple`, { waitUntil: "networkidle" });
  check(`[${scheme}] unsaved food starts empty`, (await page.inputValue("#protein")) === "");
  await page.getByRole("button", { name: ADD_FAV, exact: true }).click();
  await page.goto(`${BASE}/nutrition/add?foodId=apple`, { waitUntil: "networkidle" });
  check(`[${scheme}] favorited food still has empty macros`, (await page.inputValue("#protein")) === "");

  /* 7. Nutrition main shows a compact favorites section; tapping opens add. */
  await page.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
  check(`[${scheme}] Nutrition shows מועדפים section`, await page.getByText(FAV_CHIP, { exact: true }).isVisible());
  check(`[${scheme}] no horizontal overflow on Nutrition`, (await noOverflow(page)) === 0);
  await page.getByRole("link", { name: "הצג הכל" }).click();
  await page.waitForURL(/view=favorites/);
  check(`[${scheme}] "הצג הכל" opens favorites view`, page.url().includes("view=favorites"));
  check(`[${scheme}] favorites view active shows items`, (await page.getByRole("button", { name: REMOVE_FAV, exact: true }).count()) >= 1);

  /* 8. Removing a favorite drops it from the view. */
  const before = await page.getByRole("button", { name: REMOVE_FAV, exact: true }).count();
  await page.getByRole("button", { name: REMOVE_FAV, exact: true }).first().click();
  await page.waitForTimeout(150);
  const after = await page.getByRole("button", { name: REMOVE_FAV, exact: true }).count();
  check(`[${scheme}] removing a favorite reduces the count`, after === before - 1);
  check(`[${scheme}] no horizontal overflow in favorites view`, (await noOverflow(page)) === 0);

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
