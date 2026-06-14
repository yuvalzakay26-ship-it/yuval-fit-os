// QA pass for Active Workout exercise reorder — drag-only UI (Phase 3.xx.2).
// Usage: node scripts/qa-workout-reorder.mjs (expects `next start -p 3331` running)
//
// Reorder mode is drag-only: a grip handle per row, a lightweight pointer drag
// (mouse/touch), and ArrowUp/ArrowDown on the focused handle for keyboard
// accessibility — NO visible up/down buttons. Phase 3.xx.2 polishes the drag
// FEEL: the dragged item is now a floating overlay clone (portaled, fixed) that
// follows the pointer in BOTH X and Y while the original row stays as a faded
// ghost placeholder; order is still computed from the pointer's Y / row
// midpoints. This pass drives the real flow at 360px and 390px in light and
// dark: add three exercises, put distinct kg into each and complete the third
// one's set, enter reorder mode, assert there are no up/down buttons but a grip
// handle per row, DRAG the third exercise to the top (asserting the floating
// overlay clone appears mid-drag), verify the keyboard handle also reorders,
// exit, and confirm the new order AND that every kg/reps/completed value
// travelled with the right exercise. Then confirm the current "עכשיו" badge
// recalculates, that saving preserves the new order into history, that
// add/delete still work, and zero horizontal overflow. Pure UI over
// localStorage — no backend, schema, routes, or save-payload changes.
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
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const noOverflow = (page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

// Drive a real pointer drag of `handle` onto the vertical centre of `targetBox`.
// Playwright's mouse input emits pointer events in Chromium, exercising the same
// onPointerDown/Move/Up path real touch/mouse uses. Returns whether the floating
// drag overlay clone (which follows the pointer in X *and* Y) was present and
// actually tracked the pointer horizontally + vertically while mid-drag.
async function dragHandleTo(page, handle, targetY) {
  const overlay = page.getByTestId("reorder-drag-overlay");
  const hb = await handle.boundingBox();
  const cx = hb.x + hb.width / 2;
  const cy = hb.y + hb.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 6, { steps: 3 }); // nudge to begin the drag
  // Sample the floating overlay's position partway through the drag. waitFor lets
  // React flush the drag-state update before we read the box (isVisible alone
  // does not auto-wait).
  await page.mouse.move(cx - 30, cy - 40, { steps: 8 });
  const overlayVisible = await overlay
    .waitFor({ state: "visible", timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  const boxA = overlayVisible ? await overlay.boundingBox() : null;
  // ...then again after moving further in BOTH axes — it must have followed.
  await page.mouse.move(cx + 20, targetY, { steps: 12 });
  const boxB = (await overlay.isVisible().catch(() => false))
    ? await overlay.boundingBox()
    : null;
  const followedXY =
    !!boxA &&
    !!boxB &&
    Math.abs(boxB.x - boxA.x) > 4 && // moved horizontally with the pointer
    Math.abs(boxB.y - boxA.y) > 4; // and vertically
  await page.mouse.up();
  // Overlay must be gone once the drag is released (ghost row settles back).
  const overlayGoneAfterDrop = !(await overlay
    .isVisible()
    .catch(() => false));
  return { overlayVisible, followedXY, overlayGoneAfterDrop };
}

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

    const nameRows = page.locator("p.leading-tight.font-bold");
    check(`[${tag}] three exercise cards`, (await nameRows.count()) === 3);
    const names = await nameRows.allInnerTexts();
    const nameC = names[2]; // the third exercise we will drag to the top

    /* 2. Distinct kg per exercise + complete the THIRD one's set. */
    const kg = page.getByRole("spinbutton");
    await kg.nth(0).fill("11"); // A
    await kg.nth(2).fill("22"); // B
    await kg.nth(4).fill("33"); // C
    await kg.nth(5).fill("10"); // C reps
    const complete = page.getByRole("button", { name: "סימון סט כבוצע" });
    await complete.nth(2).click(); // complete C's set
    check(
      `[${tag}] C set marked completed`,
      (await complete.nth(2).getAttribute("aria-pressed")) === "true",
    );

    /* 3. Enter reorder mode — drag-only UI. */
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
    // The whole point of this phase: NO visible up/down buttons.
    check(
      `[${tag}] no visible up/down ("העבר") buttons`,
      (await page.getByRole("button", { name: /העבר/ }).count()) === 0,
    );
    // ...but a grip handle on every row (accessible name "שינוי מיקום: …").
    const grips = page.getByRole("button", { name: /^שינוי מיקום/ });
    check(`[${tag}] a grip handle per row`, (await grips.count()) === 3);
    check(
      `[${tag}] kg inputs hidden during reorder`,
      (await page.getByRole("spinbutton").count()) === 0,
    );

    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/workout-reorder-drag-${scheme}.png`,
        fullPage: true,
      });
    }

    /* 4. DRAG the third exercise (C) to the first position. */
    const topRowBox = await grips.first().boundingBox();
    const dragResult = await dragHandleTo(
      page,
      grips.nth(2), // C's handle (3rd row)
      topRowBox.y + 4, // just above the first row's midpoint → insert at index 0
    );
    check(
      `[${tag}] floating drag overlay appears mid-drag`,
      dragResult.overlayVisible,
    );
    check(
      `[${tag}] dragged overlay follows the pointer in X and Y`,
      dragResult.followedXY,
    );
    check(
      `[${tag}] drag overlay is removed after drop`,
      dragResult.overlayGoneAfterDrop,
    );
    const orderAfterDrag = await page
      .locator("p.leading-tight.font-bold")
      .allInnerTexts();
    check(`[${tag}] drag moved C to first`, orderAfterDrag[0] === nameC);
    check(`[${tag}] no overflow — reorder mode`, (await noOverflow(page)) === 0);

    /* 5. Keyboard handle also reorders (accessible, no visible arrows).
          C is first; ArrowDown on its focused handle moves it to 2nd, ArrowUp
          back to 1st — leaving the order we want for the save assertions. */
    const cGrip = page.getByRole("button", { name: new RegExp(`^שינוי מיקום: ${esc(nameC)}`) });
    await cGrip.focus();
    await page.keyboard.press("ArrowDown");
    check(
      `[${tag}] keyboard ArrowDown moves C off the top`,
      (await page.locator("p.leading-tight.font-bold").first().innerText()) !==
        nameC,
    );
    await page.getByRole("button", { name: new RegExp(`^שינוי מיקום: ${esc(nameC)}`) }).focus();
    await page.keyboard.press("ArrowUp");
    check(
      `[${tag}] keyboard ArrowUp restores C to the top`,
      (await page.locator("p.leading-tight.font-bold").first().innerText()) ===
        nameC,
    );

    /* 6. Exit reorder mode and verify the new order + preserved data. */
    await page.getByRole("button", { name: "סיום סידור" }).click();
    check(
      `[${tag}] C is first after exit`,
      (await page.locator("p.leading-tight.font-bold").first().innerText()) ===
        nameC,
    );
    check(
      `[${tag}] C kept its kg (33) after move`,
      (await page.getByRole("spinbutton").nth(0).inputValue()) === "33",
    );
    check(
      `[${tag}] C kept its completed set after move`,
      (await page
        .getByRole("button", { name: "סימון סט כבוצע" })
        .first()
        .getAttribute("aria-pressed")) === "true",
    );
    // Current-exercise badge recalculated: C (now first) is fully done → "הושלם",
    // and a still-unfinished exercise is now the current "עכשיו" one.
    const firstCard = page
      .locator("div.module-mg.sheen")
      .filter({ hasText: nameC })
      .first();
    check(
      `[${tag}] C card shows "הושלם" (not current) after move`,
      (await firstCard.getByText("הושלם", { exact: true }).count()) === 1 &&
        (await firstCard.getByText("עכשיו", { exact: true }).count()) === 0,
    );
    check(
      `[${tag}] a current "עכשיו" badge still exists`,
      (await page.getByText("עכשיו", { exact: true }).count()) === 1,
    );
    check(`[${tag}] no overflow — after reorder`, (await noOverflow(page)) === 0);

    /* 7. Add + delete still work after a reorder. */
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

    /* 8. Save and confirm history preserves the reordered order + data. */
    await page.getByRole("button", { name: "סיים ושמור אימון" }).click();
    await page.waitForURL(/\/workouts/);
    check(
      `[${tag}] history visible after save`,
      await page.getByText("היסטוריית אימונים", { exact: true }).isVisible(),
    );
    const firstHistoryRow = page.locator("ul.border-t li").first();
    check(
      `[${tag}] history shows C first`,
      (await firstHistoryRow.innerText()).includes(nameC),
    );
    check(
      `[${tag}] history first row preserves C's top weight (33)`,
      (await firstHistoryRow.innerText()).includes("33"),
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
