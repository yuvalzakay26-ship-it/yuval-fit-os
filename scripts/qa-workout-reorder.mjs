// QA pass for Active Workout exercise reorder (Phase 3.xx).
// Usage: node scripts/qa-workout-reorder.mjs (expects `next start -p 3331` running)
//
// Drives the real reorder flow end to end: open the builder, add three
// exercises, type distinct kg into each + complete one set of the middle
// exercise, enter reorder mode, move that exercise to the first position, exit,
// and confirm the new order AND that every kg/reps/completed value travelled
// with the right exercise. Also confirms the current-exercise ("עכשיו") badge
// recalculates, that saving preserves the new order into history, that add/
// delete still work afterwards, and that there is no horizontal overflow at
// 360px and 390px in light and dark. Pure UI over localStorage — no backend,
// schema, routes, or save-payload changes.
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

for (const scheme of ["dark", "light"]) {
  for (const width of [360, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 820 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: scheme,
    });
    await ctx.addInitScript((appTheme) => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        sessionStorage.setItem(
          "yfos:private-access-notice-accepted:session",
          "1",
        );
        localStorage.setItem("yfos:admin-access-granted:v1", "1");
        localStorage.setItem("yfos:settings", JSON.stringify({ theme: appTheme }));
      } catch {}
    }, scheme);
    const page = await ctx.newPage();
    const tag = `${scheme}/${width}`;
    page.on(
      "console",
      (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
    );
    page.on("pageerror", (e) =>
      errors.push(`[${tag}] pageerror: ${e.message}`),
    );

    /* 1. Open the builder and add three exercises (A, B, C). */
    await page.goto(`${BASE}/workouts?new=1`, { waitUntil: "networkidle" });
    await page.getByText("בחר תרגיל ראשון", { exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "בחירת תרגיל" });
    for (let i = 0; i < 3; i++) {
      await page.locator('[aria-label^="הוספת"]').first().click();
    }
    await page.getByRole("button", { name: /^סיום/ }).click();
    await dialog.waitFor({ state: "hidden" });

    // The exercise card names, in their current (add) order. Card name <p>s are
    // the only `leading-tight font-bold` paragraphs in the builder.
    const cardNames = page.locator("p.leading-tight.font-bold");
    check(`[${tag}] three exercise cards`, (await cardNames.count()) === 3);
    const names = await cardNames.allInnerTexts();
    const [, nameB] = names; // the middle exercise we will promote to first

    /* 2. Enter distinct kg into each exercise + complete the middle one's set. */
    const kg = page.getByRole("spinbutton");
    await kg.nth(0).fill("11"); // A
    await kg.nth(2).fill("22"); // B
    await kg.nth(4).fill("33"); // C
    await kg.nth(3).fill("12"); // B reps
    const complete = page.getByRole("button", { name: "סימון סט כבוצע" });
    await complete.nth(1).click(); // complete B's set
    check(
      `[${tag}] B set marked completed`,
      (await complete.nth(1).getAttribute("aria-pressed")) === "true",
    );
    // Before reorder, B (the 2nd, fully done) is NOT current; A (1st, unfinished)
    // is — so the first card carries the "עכשיו" badge.
    check(
      `[${tag}] "עכשיו" present before reorder`,
      await page.getByText("עכשיו", { exact: true }).first().isVisible(),
    );

    /* 3. Enter reorder mode. */
    await page.getByRole("button", { name: "סדר תרגילים" }).click();
    check(
      `[${tag}] reorder instruction shows`,
      await page
        .getByText("גרור כדי לשנות את סדר התרגילים", { exact: true })
        .isVisible(),
    );
    check(
      `[${tag}] finish-reorder pill ("סיום סידור") shows`,
      await page.getByRole("button", { name: "סיום סידור" }).isVisible(),
    );
    // Three up + three down accessibility buttons (one pair per exercise).
    check(
      `[${tag}] up/down controls present`,
      (await page.getByRole("button", { name: /העבר את .* למעלה/ }).count()) === 3 &&
        (await page.getByRole("button", { name: /העבר את .* למטה/ }).count()) === 3,
    );
    // Editing surfaces are hidden in reorder mode (no kg inputs, no add card).
    check(
      `[${tag}] kg inputs hidden during reorder`,
      (await page.getByRole("spinbutton").count()) === 0,
    );

    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/workout-reorder-mode-${scheme}.png`,
        fullPage: true,
      });
    }

    /* 4. Move B up one position: A,B,C -> B,A,C. */
    await page
      .getByRole("button", { name: `העבר את ${nameB} למעלה` })
      .click();
    check(`[${tag}] no overflow — reorder mode`, (await noOverflow(page)) === 0);

    /* 5. Exit reorder mode and verify the new order + preserved data. */
    await page.getByRole("button", { name: "סיום סידור" }).click();
    const cardsAfter = page.locator("p.leading-tight.font-bold");
    check(
      `[${tag}] B moved to first position`,
      (await cardsAfter.first().innerText()) === nameB,
    );
    // The first card's kg input now reads B's value — data travelled with it.
    check(
      `[${tag}] B kept its kg (22) after move`,
      (await page.getByRole("spinbutton").nth(0).inputValue()) === "22",
    );
    check(
      `[${tag}] B kept its completed set after move`,
      (await page
        .getByRole("button", { name: "סימון סט כבוצע" })
        .first()
        .getAttribute("aria-pressed")) === "true",
    );
    // Current-exercise badge recalculated: B (now first) is fully done → "הושלם",
    // and the still-unfinished A is now the current "עכשיו" exercise.
    const firstCard = page
      .locator("div.module-mg.sheen")
      .filter({ hasText: nameB })
      .first();
    check(
      `[${tag}] B card shows "הושלם" (not current) after move`,
      (await firstCard.getByText("הושלם", { exact: true }).count()) === 1 &&
        (await firstCard.getByText("עכשיו", { exact: true }).count()) === 0,
    );
    check(
      `[${tag}] a current "עכשיו" badge still exists`,
      (await page.getByText("עכשיו", { exact: true }).count()) === 1,
    );
    check(`[${tag}] no overflow — after reorder`, (await noOverflow(page)) === 0);

    /* 6. Add + delete still work after a reorder. */
    const beforeAdd = await page.locator("p.leading-tight.font-bold").count();
    await page.getByText("הוסף עוד תרגיל", { exact: true }).click();
    await dialog.waitFor({ state: "visible" });
    await page.locator('[aria-label^="הוספת"]').first().click();
    await page.getByRole("button", { name: /^סיום/ }).click();
    await dialog.waitFor({ state: "hidden" });
    check(
      `[${tag}] add exercise works after reorder`,
      (await page.locator("p.leading-tight.font-bold").count()) === beforeAdd + 1,
    );
    await page.getByRole("button", { name: "הסרת תרגיל" }).last().click();
    check(
      `[${tag}] delete exercise works after reorder`,
      (await page.locator("p.leading-tight.font-bold").count()) === beforeAdd,
    );

    /* 7. Save and confirm history preserves the reordered order + data. */
    await page.getByRole("button", { name: "סיים ושמור אימון" }).click();
    await page.waitForURL(/\/workouts/);
    check(
      `[${tag}] history visible after save`,
      await page.getByText("היסטוריית אימונים", { exact: true }).isVisible(),
    );
    // The exercise breakdown lists exercises in saved (array) order — B first.
    const firstHistoryRow = page.locator("ul.border-t li").first();
    check(
      `[${tag}] history shows B first`,
      (await firstHistoryRow.innerText()).includes(nameB),
    );
    check(
      `[${tag}] history first row preserves B's top weight (22)`,
      (await firstHistoryRow.innerText()).includes("22"),
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
