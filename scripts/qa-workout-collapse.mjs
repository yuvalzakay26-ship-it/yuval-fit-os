// QA pass for Active Workout COLLAPSIBLE exercise cards (Phase 3.xx).
// Usage: node scripts/qa-workout-collapse.mjs (expects `next start -p 3331` running)
//
// Each exercise card in the active workout can be minimised to a premium compact
// summary (image / name / muscle / set-count / completed-count / previous
// performance / badges) and expanded back to the full editing card. Collapse is
// VISUAL ONLY — it lives in component-local state, never enters `entries`, the
// auto-save draft, or saved history, and never touches a kg/reps/completed value.
//
// This pass drives the real flow at 360px and 390px in light and dark:
//   • default = all expanded (per-card collapse toggle on every card);
//   • collapse one card → its kg/reps inputs disappear, a compact summary with
//     the set + completed counts shows, the rest stay editable;
//   • expand it back → kg/reps/completed values are all still there;
//   • complete a set, collapse again → the summary + "הושלם" badge reflect it;
//   • "מזער הכל" / "פתח הכל" collapse/expand every card at once;
//   • reorder mode hides the collapse controls and keeps its own compact list;
//   • the IMPORTANT scenario: enter kg, collapse, reorder to first, expand —
//     the data stayed with the right exercise;
//   • collapse state does NOT leak into the auto-save draft (restore comes back
//     fully expanded) nor into saved history;
// asserting zero horizontal overflow and no console / hydration errors throughout.
// Pure UI over localStorage — no backend, schema, routes, or save-payload changes.
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

    const spinbuttons = page.getByRole("spinbutton");
    const hideToggles = page.getByRole("button", { name: /^הסתר סטים/ });
    const cardByName = (name) =>
      page.locator("div.module-mg.sheen").filter({ hasText: name }).first();

    /* 1. Open the builder and add three exercises (A, B, C). */
    await page.goto(`${BASE}/workouts?new=1`, { waitUntil: "networkidle" });
    const names = await addThreeExercises(page);
    const [, nameB] = names; // B is the card we collapse / expand / move

    // kg/reps: A=11, B=22 (reps 8), C=33. Inputs are [Akg,Areps,Bkg,Breps,Ckg,Creps].
    await spinbuttons.nth(0).fill("11");
    await spinbuttons.nth(2).fill("22");
    await spinbuttons.nth(3).fill("8");
    await spinbuttons.nth(4).fill("33");

    /* 2. Default state: every card is expanded + editable. */
    check(
      `[${tag}] all three cards start expanded (6 kg/reps inputs)`,
      (await spinbuttons.count()) === 6,
    );
    check(
      `[${tag}] a collapse toggle on every card`,
      (await hideToggles.count()) === 3,
    );
    check(
      `[${tag}] "מזער הכל" control present`,
      await page.getByRole("button", { name: "מזער הכל" }).isVisible(),
    );

    /* 3. Collapse the SECOND exercise (B). */
    await page
      .getByRole("button", { name: new RegExp(`^הסתר סטים: ${esc(nameB)}`) })
      .click();
    const cardB = cardByName(nameB);
    check(
      `[${tag}] collapsing B hides its kg/reps inputs (now 4)`,
      (await spinbuttons.count()) === 4,
    );
    check(
      `[${tag}] B card has no inputs while collapsed`,
      (await cardB.getByRole("spinbutton").count()) === 0,
    );
    check(
      `[${tag}] B card shows a compact summary (סטים … בוצעו)`,
      (await cardB.innerText()).includes("בוצעו"),
    );
    check(
      `[${tag}] B card now offers an expand affordance`,
      (await cardB
        .getByRole("button", { name: new RegExp(`^הצג סטים: ${esc(nameB)}`) })
        .count()) === 1,
    );
    check(
      `[${tag}] B toggle reflects aria-expanded=false`,
      (await cardB
        .getByRole("button", { name: new RegExp(`^הצג סטים: ${esc(nameB)}`) })
        .getAttribute("aria-expanded")) === "false",
    );
    // A and C stay fully editable while B is collapsed.
    check(
      `[${tag}] A + C remain expanded (still 4 inputs, 2 toggles)`,
      (await hideToggles.count()) === 2,
    );
    check(`[${tag}] no overflow — one card collapsed`, (await noOverflow(page)) === 0);

    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/workout-collapse-one-${scheme}.png`,
        fullPage: true,
      });
    }

    /* 4. Expand B again — its kg/reps survived the collapse untouched. */
    await page
      .getByRole("button", { name: new RegExp(`^הצג סטים: ${esc(nameB)}`) })
      .click();
    check(
      `[${tag}] expanding B restores its inputs (6 again)`,
      (await spinbuttons.count()) === 6,
    );
    // B is the 2nd card → its kg is input index 2.
    check(
      `[${tag}] B kept its kg (22) across collapse/expand`,
      (await spinbuttons.nth(2).inputValue()) === "22",
    );
    check(
      `[${tag}] B kept its reps (8) across collapse/expand`,
      (await spinbuttons.nth(3).inputValue()) === "8",
    );

    /* 5. Complete B's set, collapse again → summary + "הושלם" badge reflect it. */
    await page.getByRole("button", { name: "סימון סט כבוצע" }).nth(1).click();
    await page
      .getByRole("button", { name: new RegExp(`^הסתר סטים: ${esc(nameB)}`) })
      .click();
    check(
      `[${tag}] completed B card shows "הושלם" while collapsed`,
      (await cardB.getByText("הושלם", { exact: true }).count()) === 1,
    );
    check(
      `[${tag}] completed B card still shows a summary, no inputs`,
      (await cardB.getByRole("spinbutton").count()) === 0 &&
        (await cardB.innerText()).includes("בוצעו"),
    );

    /* 6. Collapse all / expand all. */
    await page.getByRole("button", { name: "מזער הכל" }).click();
    check(
      `[${tag}] "מזער הכל" collapses every card (0 inputs)`,
      (await spinbuttons.count()) === 0,
    );
    check(
      `[${tag}] control flips to "פתח הכל"`,
      await page.getByRole("button", { name: "פתח הכל" }).isVisible(),
    );
    check(`[${tag}] no overflow — all collapsed`, (await noOverflow(page)) === 0);
    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/workout-collapse-all-${scheme}.png`,
        fullPage: true,
      });
    }
    await page.getByRole("button", { name: "פתח הכל" }).click();
    check(
      `[${tag}] "פתח הכל" expands every card (6 inputs)`,
      (await spinbuttons.count()) === 6,
    );

    /* 7. Reorder mode ignores collapse + hides the collapse controls.
          Collapse B, then enter reorder and confirm the controls are gone and the
          compact drag list still lists all three. */
    await page
      .getByRole("button", { name: new RegExp(`^הסתר סטים: ${esc(nameB)}`) })
      .click();
    await page.getByRole("button", { name: "סדר תרגילים" }).click();
    check(
      `[${tag}] collapse controls hidden in reorder mode`,
      (await page.getByRole("button", { name: "מזער הכל" }).count()) === 0 &&
        (await page.getByRole("button", { name: "פתח הכל" }).count()) === 0,
    );
    const grips = page.getByRole("button", { name: /^שינוי מיקום/ });
    check(
      `[${tag}] reorder list still shows all three rows`,
      (await grips.count()) === 3,
    );

    /* 8. IMPORTANT scenario: B was collapsed with kg=22 + completed; move it to
          the top via the keyboard handle, exit, expand → data stayed with B. */
    await page
      .getByRole("button", { name: new RegExp(`^שינוי מיקום: ${esc(nameB)}`) })
      .focus();
    await page.keyboard.press("ArrowUp"); // B (index 1) → index 0
    await page.getByRole("button", { name: "סיום סידור" }).click();
    check(
      `[${tag}] B is first after reorder`,
      (await page.locator("p.leading-tight.font-bold").first().innerText()) ===
        nameB,
    );
    check(
      `[${tag}] B stayed collapsed across reorder (UI state respected)`,
      (await cardByName(nameB)
        .getByRole("button", { name: new RegExp(`^הצג סטים: ${esc(nameB)}`) })
        .count()) === 1,
    );
    check(
      `[${tag}] only A + C editable after reorder (4 inputs)`,
      (await spinbuttons.count()) === 4,
    );
    // Expand B (now the first card) and confirm its values travelled with it.
    await page
      .getByRole("button", { name: new RegExp(`^הצג סטים: ${esc(nameB)}`) })
      .click();
    check(
      `[${tag}] B (now first) kept kg=22 after collapse+reorder+expand`,
      (await spinbuttons.nth(0).inputValue()) === "22",
    );
    check(
      `[${tag}] B kept its completed set after collapse+reorder+expand`,
      (await page
        .getByRole("button", { name: "סימון סט כבוצע" })
        .first()
        .getAttribute("aria-pressed")) === "true",
    );
    check(`[${tag}] no overflow — after reorder`, (await noOverflow(page)) === 0);

    /* 9. Collapse state must NOT leak into the auto-save draft. Title it, collapse
          a card, leave, return and restore → it comes back fully expanded but
          with every value intact. */
    await page.locator("#workout-title").fill("אימון מזעור");
    await page
      .getByRole("button", { name: new RegExp(`^הסתר סטים: ${esc(nameB)}`) })
      .click();
    await page.waitForTimeout(700); // let the draft persist
    await page.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
    await page.goto(`${BASE}/workouts`, { waitUntil: "networkidle" });
    const restoreCard = page.getByText("נמצא אימון שלא נשמר", { exact: true });
    check(
      `[${tag}] restore prompt appears on return`,
      await becomesVisible(restoreCard),
    );
    await page.getByRole("button", { name: "המשך אימון" }).click();
    await page.getByText("אימון פעיל", { exact: true }).waitFor();
    check(
      `[${tag}] restored session is fully expanded (collapse not in draft)`,
      (await hideToggles.count()) === 3 && (await spinbuttons.count()) === 6,
    );
    check(
      `[${tag}] restored B still first with kg=22`,
      (await page.locator("p.leading-tight.font-bold").first().innerText()) ===
        nameB && (await spinbuttons.nth(0).inputValue()) === "22",
    );

    /* 10. Final save → history is just data; no collapse UI leaks in. */
    await page.getByRole("button", { name: "סיים ושמור אימון" }).click();
    await page.waitForURL(/\/workouts/);
    await page.getByText("היסטוריית אימונים", { exact: true }).waitFor();
    const firstHistory = page.locator("ul.border-t li").first();
    check(
      `[${tag}] saved once with B first`,
      (await page.getByText("אימון מזעור", { exact: true }).count()) === 1 &&
        (await firstHistory.innerText()).includes(nameB),
    );
    check(
      `[${tag}] history preserves B's weight (22)`,
      (await firstHistory.innerText()).includes("22"),
    );
    check(`[${tag}] no overflow — history after save`, (await noOverflow(page)) === 0);

    // Sanity: the two collapse Hebrew labels never appear in saved history.
    check(
      `[${tag}] no collapse UI labels leaked into the hub`,
      (await page.getByText("מזער הכל", { exact: true }).count()) === 0 &&
        (await page.getByRole("button", { name: /^הצג סטים/ }).count()) === 0,
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
