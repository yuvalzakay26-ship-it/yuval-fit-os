// QA pass for the Premium Supplements Tracker (Phase 3.21).
// Usage: node scripts/qa-supplements.mjs (expects `next start -p 3321` running)
//
// Covers the Today card (empty + populated), the full /nutrition/supplements
// screen (safety note, empty state, hero ring), the add/edit flow, mark-taken +
// undo, archive + reactivate, persistence across reload, day separation, and the
// Settings resets — asserting no console errors and no horizontal overflow, in
// both dark and light. localStorage-only; no backend.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3321";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};

const SUPPS = `${BASE}/nutrition/supplements`;
const EMPTY = "עדיין לא הוגדרו תוספים";
const SAFETY = "המעקב הוא אישי בלבד ואינו מהווה המלצה רפואית.";

const noOverflow = (page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

for (const scheme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  // Seed welcome flag + a past-day supplement log to verify day separation.
  // Guard the logs key so per-navigation init never wipes mid-test changes.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
      if (!localStorage.getItem("yfos:supplement-logs:v1")) {
        localStorage.setItem(
          "yfos:supplement-logs:v1",
          JSON.stringify([
            {
              id: "seedlog",
              supplementId: "seed-old",
              date: "2020-01-01",
              takenAt: "2020-01-01T08:00:00.000Z",
            },
          ]),
        );
      }
    } catch {}
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${scheme}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${scheme}] pageerror: ${e.message}`));

  /* 1. Today shows the supplements section with the empty prompt. */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check(`[${scheme}] Today shows תוספים section`, await page.getByText("תוספים", { exact: true }).first().isVisible());
  check(`[${scheme}] Today shows empty prompt`, await page.getByText(EMPTY).first().isVisible());
  check(`[${scheme}] no horizontal overflow on Today`, (await noOverflow(page)) === 0);

  /* 2. Full screen: header, helper, safety note, empty state. */
  await page.goto(SUPPS, { waitUntil: "networkidle" });
  check(`[${scheme}] header מעקב תוספים`, await page.getByRole("heading", { name: "מעקב תוספים" }).isVisible());
  check(`[${scheme}] helper text`, await page.getByText("סמן מה לקחת היום ושמור על שגרה מסודרת.").isVisible());
  check(`[${scheme}] safety note present`, await page.getByText(SAFETY).first().isVisible());
  check(`[${scheme}] empty state present`, await page.getByText(EMPTY).first().isVisible());

  /* 2b. Starter library: preset deep-link prefills, and tapping a template card
     prefills the manual form — quick-add templates only, fully editable. */
  await page.goto(`${SUPPS}/add?preset=creatine`, { waitUntil: "networkidle" });
  check(`[${scheme}] common library present on add`, await page.getByText("תוספים נפוצים").first().isVisible());
  check(`[${scheme}] preset prefilled name`, (await page.inputValue("#supp-name")) === "קריאטין");
  await page.getByRole("button", { name: "מילוי מהיר: מגנזיום" }).click();
  check(`[${scheme}] template pick prefills name`, (await page.inputValue("#supp-name")) === "מגנזיום");
  check(`[${scheme}] no horizontal overflow on library`, (await noOverflow(page)) === 0);
  // Return to the empty tracker to continue the canonical add flow below.
  await page.goto(SUPPS, { waitUntil: "networkidle" });

  /* 3. Add a supplement (name + category + timing). */
  await page.getByRole("link", { name: "הוסף תוסף ראשון" }).click();
  await page.waitForURL(/\/nutrition\/supplements\/add/);
  check(`[${scheme}] add header`, await page.getByRole("heading", { name: "הוספת תוסף" }).isVisible());
  check(`[${scheme}] dosage hint shown`, await page.getByText("האפליקציה לא מציעה מינונים", { exact: false }).isVisible());
  await page.fill("#supp-name", "ויטמין D");
  await page.getByRole("button", { name: "ויטמינים", exact: true }).click();
  await page.getByRole("button", { name: "בוקר", exact: true }).click();
  await page.fill("#supp-dosage", "כמוסה אחת בבוקר");
  check(`[${scheme}] no horizontal overflow on add`, (await noOverflow(page)) === 0);
  await page.getByRole("button", { name: "שמור תוסף" }).click();
  await page.waitForURL(SUPPS);
  check(`[${scheme}] item appears after save`, await page.getByText("ויטמין D", { exact: true }).first().isVisible());
  check(`[${scheme}] hero shows 0/1`, await page.getByText("0/1").first().isVisible());

  /* 4. Mark as taken → 1/1, then undo → 0/1. */
  await page.getByRole("button", { name: "סמן שויטמין D נלקח" }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] taken updates hero to 1/1`, await page.getByText("1/1").first().isVisible());
  check(`[${scheme}] summary shows 1 מתוך 1`, await page.getByText("1 מתוך 1 תוספים").isVisible());
  await page.screenshot({ path: `${OUT}/supplements-${scheme}-screen.png` });
  await page.getByRole("button", { name: "בטל סימון לויטמין D" }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] undo returns to 0/1`, await page.getByText("0/1").first().isVisible());

  /* 5. Persistence across reload (item + mark it taken again first). */
  await page.getByRole("button", { name: "סמן שויטמין D נלקח" }).click();
  await page.waitForTimeout(150);
  await page.reload({ waitUntil: "networkidle" });
  check(`[${scheme}] item persists after reload`, await page.getByText("ויטמין D", { exact: true }).first().isVisible());
  check(`[${scheme}] taken state persists after reload`, await page.getByText("1/1").first().isVisible());

  /* 6. Edit: open via the item, rename, save. */
  await page.getByRole("link", { name: "ערוך ויטמין D" }).click();
  await page.waitForURL(/\/nutrition\/supplements\/add\?id=/);
  check(`[${scheme}] edit header`, await page.getByRole("heading", { name: "עריכת תוסף" }).isVisible());
  check(`[${scheme}] edit prefilled name`, (await page.inputValue("#supp-name")) === "ויטמין D");
  await page.fill("#supp-name", "ויטמין D3");
  await page.getByRole("button", { name: "שמור תוסף" }).click();
  await page.waitForURL(SUPPS);
  check(`[${scheme}] renamed item shows`, await page.getByText("ויטמין D3", { exact: true }).first().isVisible());

  /* 7. Archive via edit (turn off active) → appears in archive, then reactivate. */
  await page.getByRole("link", { name: "ערוך ויטמין D3" }).click();
  await page.waitForURL(/\/nutrition\/supplements\/add\?id=/);
  // The active toggle uses an sr-only checkbox styled as a switch — toggled by
  // tapping its label (as a real user does), not the hidden input directly.
  await page.getByText("פעיל", { exact: true }).click();
  await page.getByRole("button", { name: "שמור תוסף" }).click();
  await page.waitForURL(SUPPS);
  check(`[${scheme}] archive section appears`, await page.getByText("בארכיון", { exact: false }).first().isVisible());
  check(`[${scheme}] archived item now empty active state`, await page.getByText(EMPTY).first().isVisible());
  await page.getByRole("button", { name: "הפעל מחדש" }).click();
  await page.waitForTimeout(150);
  check(`[${scheme}] reactivated item back in list`, await page.getByText("1/1").first().isVisible() || (await page.getByText("0/1").first().isVisible()));

  /* 8. Today card now shows a populated summary. */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check(`[${scheme}] Today card shows תוספים היום`, await page.getByText("תוספים היום").isVisible());

  /* 9. Day separation: the seeded 2020 log stays stored, untouched. */
  const hasPastDay = await page.evaluate(() => {
    try {
      const logs = JSON.parse(localStorage.getItem("yfos:supplement-logs:v1") || "[]");
      return logs.some((l) => l.date === "2020-01-01");
    } catch {
      return false;
    }
  });
  check(`[${scheme}] past-day log persists separately`, hasPastDay);

  /* 10. Settings shows the supplement reset card and it clears the data. */
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  check(`[${scheme}] Settings shows נתוני תוספים`, await page.getByText("נתוני תוספים").isVisible());
  await page.getByRole("button", { name: "אפס תוספים", exact: true }).click();
  await page.getByRole("button", { name: "כן, אפס תוספים" }).click();
  await page.waitForTimeout(150);
  await page.goto(SUPPS, { waitUntil: "networkidle" });
  check(`[${scheme}] supplements cleared → empty state`, await page.getByText(EMPTY).first().isVisible());
  check(`[${scheme}] no horizontal overflow on screen`, (await noOverflow(page)) === 0);

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
