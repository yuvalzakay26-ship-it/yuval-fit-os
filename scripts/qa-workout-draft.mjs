// QA pass for the Active Workout auto-save DRAFT (Phase 3.xx).
// Usage: node scripts/qa-workout-draft.mjs (expects `next start -p 3331` running)
//
// Verifies the in-progress active-workout session is protected against loss
// before the final `סיים ושמור אימון`, WITHOUT touching workout history:
//   • an untouched/empty builder never leaves an annoying restore prompt;
//   • a real session (title + exercises + kg/reps + completed + reorder) is
//     auto-saved locally, survives a FULL page reload, and is offered back via a
//     premium restore card;
//   • "המשך אימון" restores every value AND the reordered order exactly;
//   • the final save lands the workout in history ONCE and clears the draft (no
//     restore prompt lingers, no duplicate auto-saved copies);
//   • "מחק טיוטה" (with confirm) clears the draft.
// Runs at 360px and 390px in light and dark, asserting zero horizontal overflow
// and no console / hydration errors. Pure UI over localStorage — no backend,
// schema, history-storage, routes, or save-payload changes.
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
const becomesVisible = (locator) =>
  locator
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);

// Add three exercises via the visual picker; returns their names in order.
async function addThreeExercises(page) {
  await page.getByText("בחר תרגיל ראשון", { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "בחירת תרגיל" });
  await dialog.waitFor({ state: "visible" });
  for (let i = 0; i < 3; i++) {
    await page.locator('[aria-label^="הוספת"]').first().click();
  }
  await page.getByRole("button", { name: /^סיום/ }).click();
  await dialog.waitFor({ state: "hidden" });
  return page.locator("p.leading-tight.font-bold").allInnerTexts();
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

    const restoreCard = page.getByText("נמצא אימון שלא נשמר", { exact: true });

    /* ===== A. An untouched/empty builder must NOT create a restore prompt. */
    await page.goto(`${BASE}/workouts?new=1`, { waitUntil: "networkidle" });
    await page.getByText("אימון פעיל", { exact: true }).waitFor();
    await page.waitForTimeout(700); // let the (no-op) auto-save settle
    await page.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
    await page.goto(`${BASE}/workouts`, { waitUntil: "networkidle" });
    await page.getByText("מרכז האימונים", { exact: true }).waitFor();
    await page.waitForTimeout(400);
    check(
      `[${tag}] empty builder leaves NO restore prompt`,
      (await restoreCard.count()) === 0,
    );

    /* ===== B. A real session is drafted, survives reload, and restores. */
    await page.goto(`${BASE}/workouts?new=1`, { waitUntil: "networkidle" });
    const names = await addThreeExercises(page);
    const [, nameB] = names; // the exercise we'll edit + move to the top

    await page.locator("#workout-title").fill("אימון בדיקה");

    // kg/reps: A=11, B=22 (reps 8), C=33. Inputs are [Akg,Areps,Bkg,Breps,Ckg,Creps].
    const kg = page.getByRole("spinbutton");
    await kg.nth(0).fill("11");
    await kg.nth(2).fill("22");
    await kg.nth(3).fill("8");
    await kg.nth(4).fill("33");
    // Complete B's set (2nd complete button).
    const complete = page.getByRole("button", { name: "סימון סט כבוצע" });
    await complete.nth(1).click();
    check(
      `[${tag}] B set marked completed`,
      (await complete.nth(1).getAttribute("aria-pressed")) === "true",
    );

    // The calm auto-save status appears.
    check(
      `[${tag}] auto-save status "נשמר אוטומטית" shows`,
      await becomesVisible(page.getByText("נשמר אוטומטית", { exact: false })),
    );

    // Reorder B to the top (keyboard handle — reliable + accessible).
    await page.getByRole("button", { name: "סדר תרגילים" }).click();
    const bGrip = page.getByRole("button", {
      name: new RegExp(`^שינוי מיקום: ${esc(nameB)}`),
    });
    await bGrip.focus();
    await page.keyboard.press("ArrowUp");
    await page.getByRole("button", { name: "סיום סידור" }).click();
    check(
      `[${tag}] B is first after reorder`,
      (await page.locator("p.leading-tight.font-bold").first().innerText()) ===
        nameB,
    );
    await page.waitForTimeout(700); // ensure the latest draft is persisted

    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/workout-draft-builder-${scheme}.png`,
        fullPage: true,
      });
    }

    /* Leave WITHOUT final save (full reload via another route, then back). */
    await page.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
    await page.goto(`${BASE}/workouts`, { waitUntil: "networkidle" });

    check(
      `[${tag}] restore prompt appears on return`,
      await becomesVisible(restoreCard),
    );
    check(
      `[${tag}] restore summary shows the draft title`,
      await becomesVisible(page.getByText("אימון בדיקה", { exact: true })),
    );
    check(`[${tag}] no overflow — restore prompt`, (await noOverflow(page)) === 0);

    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/workout-draft-restore-${scheme}.png`,
        fullPage: true,
      });
    }

    /* Continue → everything restores, including the reordered order. */
    await page.getByRole("button", { name: "המשך אימון" }).click();
    await page.getByText("אימון פעיל", { exact: true }).waitFor();
    check(
      `[${tag}] title restored`,
      (await page.locator("#workout-title").inputValue()) === "אימון בדיקה",
    );
    check(
      `[${tag}] reordered B still first after restore`,
      (await page.locator("p.leading-tight.font-bold").first().innerText()) ===
        nameB,
    );
    // B is first, so the first kg input is B's (22) and the first complete is B's.
    check(
      `[${tag}] B kept its kg (22) after restore`,
      (await page.getByRole("spinbutton").nth(0).inputValue()) === "22",
    );
    check(
      `[${tag}] B kept its completed set after restore`,
      (await page
        .getByRole("button", { name: "סימון סט כבוצע" })
        .first()
        .getAttribute("aria-pressed")) === "true",
    );

    /* Final save → history gets it ONCE; the draft prompt is gone. */
    await page.getByRole("button", { name: "סיים ושמור אימון" }).click();
    await page.waitForURL(/\/workouts/);
    await page.getByText("היסטוריית אימונים", { exact: true }).waitFor();
    await page.waitForTimeout(300);
    check(
      `[${tag}] NO restore prompt after final save`,
      (await restoreCard.count()) === 0,
    );
    // The draft must land in history exactly once (no duplicate auto-saved copies).
    check(
      `[${tag}] saved workout appears in history exactly once`,
      (await page.getByText("אימון בדיקה", { exact: true }).count()) === 1,
    );
    const firstHistory = page.locator("ul.border-t li").first();
    check(
      `[${tag}] history first row shows B first`,
      (await firstHistory.innerText()).includes(nameB),
    );
    check(
      `[${tag}] history preserves B's weight (22)`,
      (await firstHistory.innerText()).includes("22"),
    );

    /* ===== C. Discard flow: create a quick draft, then delete it from the hub. */
    await page.goto(`${BASE}/workouts?new=1`, { waitUntil: "networkidle" });
    await addThreeExercises(page);
    await page.locator("#workout-title").fill("טיוטה למחיקה");
    await page.waitForTimeout(700);
    await page.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
    await page.goto(`${BASE}/workouts`, { waitUntil: "networkidle" });
    check(
      `[${tag}] restore prompt appears for the new draft`,
      await becomesVisible(restoreCard),
    );
    await page.getByRole("button", { name: "מחק טיוטה" }).first().click();
    const confirm = page.getByRole("dialog", { name: "למחוק את הטיוטה?" });
    check(`[${tag}] discard confirm dialog opens`, await becomesVisible(confirm));
    await confirm.getByRole("button", { name: "מחק טיוטה" }).click();
    await page.waitForTimeout(300);
    check(
      `[${tag}] draft prompt gone after discard`,
      (await restoreCard.count()) === 0,
    );
    check(`[${tag}] no overflow — hub after discard`, (await noOverflow(page)) === 0);

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
