// QA pass for the Active Workout Session premium UX upgrade (Phase 3.xx).
// Usage: node scripts/qa-workout-session.mjs (expects `next start -p 3331` running)
//
// Exercises the real active-workout flow end to end: open the builder, add
// exercises via the visual picker, type kg/reps, complete a set, add and delete
// a set, confirm the finish CTA, and save. Also asserts the new session hero
// (live "אימון פעיל" header, stats, progress) renders and that there is no
// horizontal overflow at 360px and 390px in both colour schemes. Pure UI over
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
    // Clear the access gates so the app chrome and builder render, and pin the
    // app's saved appearance (it reads `yfos:settings`, not prefers-color-scheme)
    // so dark runs actually render dark.
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

    /* 1. The builder opens straight into the active-session view. */
    await page.goto(`${BASE}/workouts?new=1`, { waitUntil: "networkidle" });
    check(
      `[${tag}] session hero shows אימון פעיל`,
      await page.getByText("אימון פעיל", { exact: true }).isVisible(),
    );
    check(
      `[${tag}] title field is present`,
      await page.locator("#workout-title").isVisible(),
    );
    check(
      `[${tag}] empty-state CTA "בחר תרגיל ראשון"`,
      await page.getByText("בחר תרגיל ראשון", { exact: true }).isVisible(),
    );
    check(`[${tag}] no overflow — empty builder`, (await noOverflow(page)) === 0);

    /* 2. Add two exercises through the visual picker. */
    await page.getByText("בחר תרגיל ראשון", { exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "בחירת תרגיל" });
    check(`[${tag}] exercise picker opens`, await dialog.isVisible());
    for (let i = 0; i < 2; i++) {
      // After each add the chosen card flips to "כבר באימון", so re-querying
      // the add-labelled cards and taking the first keeps adding new ones.
      await page.locator('[aria-label^="הוספת"]').first().click();
    }
    await page.getByRole("button", { name: /^סיום/ }).click();
    await dialog.waitFor({ state: "hidden" });

    /* 3. Back in the builder: exercise cards + usable kg/reps inputs. */
    const deleteSetButtons = page.getByRole("button", { name: "הסרת סט" });
    check(
      `[${tag}] two exercises added (≥2 set rows)`,
      (await deleteSetButtons.count()) >= 2,
    );
    const numberInputs = page.getByRole("spinbutton");
    check(
      `[${tag}] kg/reps inputs visible`,
      (await numberInputs.count()) >= 4 &&
        (await numberInputs.first().isVisible()),
    );
    check(
      `[${tag}] "עכשיו" current-exercise badge shows`,
      await page.getByText("עכשיו", { exact: true }).first().isVisible(),
    );

    // Type into the first set's kg + reps.
    await numberInputs.nth(0).fill("40");
    await numberInputs.nth(1).fill("12");
    check(
      `[${tag}] kg input keeps typed value`,
      (await numberInputs.nth(0).inputValue()) === "40",
    );

    /* 4. Completing a set updates progress. */
    const completeButtons = page.getByRole("button", {
      name: "סימון סט כבוצע",
    });
    await completeButtons.first().click();
    check(
      `[${tag}] set marked completed (aria-pressed)`,
      (await completeButtons.first().getAttribute("aria-pressed")) === "true",
    );
    check(
      `[${tag}] progress label "התקדמות האימון" shows`,
      await page.getByText("התקדמות האימון", { exact: true }).isVisible(),
    );
    check(
      `[${tag}] finish progress context "מתוך" shows`,
      await page.getByText(/מתוך/).first().isVisible(),
    );

    /* 5. Add set then delete it — counts move both ways. */
    const before = await deleteSetButtons.count();
    await page.getByRole("button", { name: "הוספת סט" }).first().click();
    check(
      `[${tag}] add set increases rows`,
      (await deleteSetButtons.count()) === before + 1,
    );
    await deleteSetButtons.last().click();
    check(
      `[${tag}] delete set restores rows`,
      (await deleteSetButtons.count()) === before,
    );

    /* 6. Finish CTA present and the builder fits the viewport. */
    const finish = page.getByRole("button", { name: "סיים ושמור אימון" });
    check(`[${tag}] finish CTA visible`, await finish.isVisible());
    check(`[${tag}] finish CTA enabled`, await finish.isEnabled());
    check(`[${tag}] no overflow — active builder`, (await noOverflow(page)) === 0);

    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/workout-session-${scheme}.png`,
        fullPage: true,
      });
    }

    /* 7. Saving closes the builder and the session lands in history. */
    await finish.click();
    await page.waitForURL(/\/workouts/);
    check(
      `[${tag}] builder closed after save (hero gone)`,
      (await page.getByText("אימון פעיל", { exact: true }).count()) === 0,
    );
    check(
      `[${tag}] history section visible after save`,
      await page
        .getByText("היסטוריית אימונים", { exact: true })
        .isVisible(),
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
