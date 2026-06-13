// Phase 3.xx QA: premium full-screen exercise picker in the workout builder.
// Drives the real flow: open builder → open picker → search → filter by muscle
// → add an exercise → see it land in the builder → "added" state → close →
// add a second from a chip → save. Verifies RTL/dark and no horizontal overflow.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "qa/screens";
mkdirSync(OUT, { recursive: true });

const issues = [];
const ok = (label) => console.log(" ✓ " + label);
const fail = (label) => issues.push(label);
const check = (cond, label) => (cond ? ok(label) : fail(label));

const noOverflow = (page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth + 1,
  );

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(BASE + "/workouts", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    // Bypass the welcome screen + private-access notice for the smoke run.
    localStorage.setItem("yfos:welcome-seen:v1", "1");
    sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
  });
  await page.reload({ waitUntil: "networkidle" });

  /* ----------------------- Open builder + picker ---------------------- */
  await page.getByRole("button", { name: "אימון חדש" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "בחר תרגיל ראשון" }).click();
  await page.waitForTimeout(250);
  let body = await page.textContent("body");
  check(body.includes("בחר תרגיל"), "picker opens with Hebrew title");
  check(
    body.includes("דפדף לפי קבוצת שריר") || body.includes("חפש או דפדף"),
    "picker shows helper text",
  );
  check(await noOverflow(page), "no horizontal overflow — picker open (390px)");

  /* -------- Global app header stays visible above the picker --------- */
  // The real header (Fit OS title, theme toggle, settings) must remain visible
  // and uncovered — the picker sits below it, not over it.
  const settingsLink = page.locator('a[aria-label="הגדרות"]');
  const themeBtn = page.locator('button[aria-label="החלפת מצב תצוגה"]');
  check(await settingsLink.isVisible(), "global header settings button visible with picker open");
  check(await themeBtn.isVisible(), "global header theme toggle visible with picker open");
  check(
    await page.getByText("Fit OS", { exact: true }).first().isVisible(),
    "global header 'Fit OS' title visible with picker open",
  );
  // Geometry: the picker's top edge must sit at/below the header's bottom edge.
  const headerBox = await page.locator("header").first().boundingBox();
  const dialogBox = await page.locator('[role="dialog"][aria-label="בחירת תרגיל"]').boundingBox();
  check(
    headerBox && dialogBox && dialogBox.y >= headerBox.y + headerBox.height - 1,
    "picker top bar sits below the global header (no overlap)",
  );
  // The settings control must be clickable (not covered by the picker overlay).
  check(
    await settingsLink.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return el.contains(top) || el === top;
    }),
    "global header settings button is not covered by the picker",
  );

  await page.screenshot({ path: `${OUT}/picker-open-390-light.png`, fullPage: true });

  /* ----------------------------- Search ------------------------------- */
  await page.getByPlaceholder("חיפוש תרגיל…").fill("סקוואט");
  await page.waitForTimeout(200);
  body = await page.textContent("body");
  check(body.includes("סקוואט"), "search surfaces matching exercise");
  await page.getByPlaceholder("חיפוש תרגיל…").fill("");
  await page.waitForTimeout(150);

  /* --------------------------- Filter chip ---------------------------- */
  await page.getByRole("button", { name: /^חזה/ }).click();
  await page.waitForTimeout(200);
  body = await page.textContent("body");
  check(body.includes("לחיצת חזה"), "muscle filter chip narrows the grid");

  /* -------------------------- Add an exercise ------------------------- */
  await page.getByLabel("הוספת לחיצת חזה לאימון").click();
  await page.waitForTimeout(200);
  body = await page.textContent("body");
  check(body.includes("נוסף לאימון"), "added card flips to 'added' state");
  check(
    body.includes("תרגילים באימון"),
    "footer reflects added count",
  );
  await page.screenshot({ path: `${OUT}/picker-added-390-light.png`, fullPage: true });

  /* ----------------------- Close → back in builder -------------------- */
  await page.getByRole("button", { name: /^סיום/ }).click();
  await page.waitForTimeout(250);
  body = await page.textContent("body");
  check(body.includes("לחיצת חזה"), "added exercise appears in the builder");
  check(body.includes("הוסף עוד תרגיל"), "builder shows add-more affordance");

  /* ----------------------- Re-open: shows added ----------------------- */
  await page.getByRole("button", { name: "הוסף עוד תרגיל" }).click();
  await page.waitForTimeout(250);
  const benchAdded = await page
    .getByLabel("לחיצת חזה כבר באימון")
    .count();
  check(benchAdded > 0, "already-added exercise marked on re-open");

  // Add a second, different exercise.
  await page.getByRole("button", { name: /^גב/ }).click();
  await page.waitForTimeout(200);
  await page.getByLabel("הוספת פולי עליון לאימון").click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: /^סיום/ }).click();
  await page.waitForTimeout(250);
  body = await page.textContent("body");
  check(
    body.includes("לחיצת חזה") && body.includes("פולי עליון"),
    "second exercise added; both present in builder",
  );

  /* ------------------------------- Save ------------------------------- */
  await page.fill("#workout-title", "אימון בדיקת בורר");
  await page.getByRole("button", { name: "שמירת אימון" }).click();
  await page.waitForTimeout(400);
  body = await page.textContent("body");
  check(body.includes("אימון בדיקת בורר"), "workout with picked exercises saved to history");

  /* ----------------------------- Dark mode ---------------------------- */
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("button", { name: "אימון חדש" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "בחר תרגיל ראשון" }).click();
  await page.waitForTimeout(250);
  check(await noOverflow(page), "no horizontal overflow — picker open (dark, 390px)");
  // Header still visible in dark mode with the picker open.
  check(
    await page.locator('a[aria-label="הגדרות"]').isVisible(),
    "global header visible with picker open (dark)",
  );
  await page.screenshot({ path: `${OUT}/picker-open-390-dark.png`, fullPage: true });

  /* --------------------------- 360px width ---------------------------- */
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.getByRole("button", { name: /^סיום/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "בחר תרגיל ראשון" }).click();
  await page.waitForTimeout(250);
  check(await noOverflow(page), "no horizontal overflow — picker open (360px)");
  check(
    await page.locator('a[aria-label="הגדרות"]').isVisible(),
    "global header visible with picker open (360px)",
  );
  {
    const h = await page.locator("header").first().boundingBox();
    const d = await page.locator('[role="dialog"][aria-label="בחירת תרגיל"]').boundingBox();
    check(h && d && d.y >= h.y + h.height - 1, "picker below header at 360px");
  }
  check(
    await page.getByRole("button", { name: /^סיום/ }).isVisible(),
    "sticky footer 'סיום' visible at 360px",
  );
  await page.screenshot({ path: `${OUT}/picker-open-360-light.png`, fullPage: true });

  await browser.close();
  console.log("\n===== EXERCISE PICKER QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("EXERCISE PICKER QA RUN FAILED:", e);
  process.exit(1);
});
