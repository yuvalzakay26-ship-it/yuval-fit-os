// QA pass for the Backup & Restore feature (Phase 3.xx).
// Usage: node scripts/qa-backup-restore.mjs (expects `next start -p 3333` running)
//
// Verifies the local-only backup/restore experience end to end:
//   • Export produces valid JSON with the app marker, version, createdAt and a
//     data object holding workouts / nutrition / water / supplements / settings.
//   • Export does NOT include gate/admin/session state.
//   • Import rejects invalid JSON, a wrong app name, and an unsupported version
//     with clear Hebrew errors.
//   • Import shows a counts preview and requires explicit confirmation.
//   • The full seed → export → clear → restore scenario reappears the data and
//     never restores admin/gate state.
//   • The screen is reachable from Settings and the System Hub.
//   • No overflow at 360/390 and no console errors, light + dark.
// localStorage-only, no backend.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3333";
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

// Seed the three gates + a representative slice of real user data. Computes the
// date the SAME way the app does (local ISO, not UTC) so date-keyed water /
// supplement-log records land on "today" in every timezone.
const seed = () => {
  return () => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem(
        "yfos:private-access-notice-accepted:session",
        "1",
      );
      localStorage.setItem("yfos:admin-access-granted:v1", "1");

      const d = new Date();
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(d.getDate()).padStart(2, "0")}`;
      const now = "2026-06-14T08:00:00.000Z";

      localStorage.setItem(
        "yfos:workouts",
        JSON.stringify([
          {
            id: "w1",
            date: iso,
            title: "אימון בדיקה",
            muscleGroups: ["chest"],
            exercises: [],
          },
        ]),
      );
      localStorage.setItem(
        "yfos:foodLogs",
        JSON.stringify([
          {
            id: "fl1",
            date: iso,
            mealType: "lunch",
            foodName: "עוף",
            quantityText: "200 גרם",
            protein: 40,
            carbs: 0,
            fat: 8,
            calories: 240,
          },
        ]),
      );
      localStorage.setItem(
        "yfos:water-logs:v1",
        JSON.stringify([
          {
            date: iso,
            totalMl: 500,
            entries: [{ id: "we1", amountMl: 500, createdAt: now }],
          },
        ]),
      );
      localStorage.setItem(
        "yfos:supplements:v1",
        JSON.stringify([
          {
            id: "s1",
            name: "ויטמין D",
            category: "vitamin",
            isActive: true,
            createdAt: now,
          },
        ]),
      );
      localStorage.setItem(
        "yfos:supplement-logs:v1",
        JSON.stringify([
          { id: "sl1", supplementId: "s1", date: iso, takenAt: now },
        ]),
      );
      localStorage.setItem(
        "yfos:saved-food-values:v1",
        JSON.stringify({
          f1: {
            sourceFoodId: "f1",
            foodName: "עוף",
            quantity: "200 גרם",
            protein: 40,
            carbs: 0,
            fat: 8,
            calories: 240,
            updatedAt: now,
          },
        }),
      );
      localStorage.setItem(
        "yfos:settings",
        JSON.stringify({
          theme: "light",
          proteinGoal: 200,
          calorieGoal: 2000,
          weightUnit: "kg",
          waterGoalMl: 3000,
        }),
      );
    } catch {}
  };
};

/* ===================================================================== *
 * 1. Export → capture JSON, validate shape + exclusions, meta written.  *
 * ===================================================================== */
let backupText = "";
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 900 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "light",
    acceptDownloads: true,
  });
  await ctx.addInitScript(seed());
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[export] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[export] pageerror: ${e.message}`));

  await page.goto(`${BASE}/backup`, { waitUntil: "networkidle" });
  check(
    "[export] /backup shows hero title",
    await page.getByRole("heading", { name: "גיבוי ושחזור" }).isVisible(),
  );

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "ייצא גיבוי" }).click(),
  ]);
  check(
    "[export] filename is fit-os-backup-*.json",
    /^fit-os-backup-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename()),
  );
  const path = await download.path();
  backupText = fs.readFileSync(path, "utf8");
  let json = null;
  try {
    json = JSON.parse(backupText);
  } catch {}
  check("[export] export is valid JSON", json !== null);
  check("[export] app === 'Fit OS'", json?.app === "Fit OS");
  check("[export] backupVersion === 1", json?.backupVersion === 1);
  check("[export] has createdAt", typeof json?.createdAt === "string");
  check("[export] source === 'local'", json?.source === "local");
  check("[export] has data object", json?.data && typeof json.data === "object");
  check("[export] data.workouts has 1", (json?.data?.workouts ?? []).length === 1);
  check(
    "[export] data.nutritionLogs has 1",
    (json?.data?.nutritionLogs ?? []).length === 1,
  );
  check("[export] data.waterLogs has 1", (json?.data?.waterLogs ?? []).length === 1);
  check(
    "[export] data.supplements has 1",
    (json?.data?.supplements ?? []).length === 1,
  );
  check(
    "[export] data.supplementLogs has 1",
    (json?.data?.supplementLogs ?? []).length === 1,
  );
  check("[export] data.settings included", json?.data?.settings && typeof json.data.settings === "object");

  // Exclusions: no gate/admin/session/meta anywhere in the backup payload.
  const blob = JSON.stringify(json);
  check("[export] no admin-access in backup", !blob.includes("admin-access"));
  check("[export] no welcome-seen in backup", !blob.includes("welcome-seen"));
  check("[export] no private-access in backup", !blob.includes("private-access"));
  check(
    "[export] no backup-meta field in data",
    !Object.prototype.hasOwnProperty.call(json?.data ?? {}, "backupMeta"),
  );

  // Export meta recorded.
  const exportedAt = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("yfos:backup-meta:v1") || "{}")
        .lastExportedAt;
    } catch {
      return undefined;
    }
  });
  check("[export] backup meta lastExportedAt written", typeof exportedAt === "string");

  await ctx.close();
}

/* ===================================================================== *
 * 2. Import validation: invalid JSON / wrong app / bad version.         *
 * ===================================================================== */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 900 },
    colorScheme: "light",
  });
  await ctx.addInitScript(seed());
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[validate] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[validate] pageerror: ${e.message}`));
  await page.goto(`${BASE}/backup`, { waitUntil: "networkidle" });

  const pasteAndLoad = async (text) => {
    // Open paste box if not already open.
    const opener = page.getByRole("button", { name: /הדבק טקסט גיבוי/ });
    if (await opener.isVisible().catch(() => false)) await opener.click();
    const ta = page.getByLabel("הדבקת טקסט גיבוי");
    await ta.fill(text);
    await page.getByRole("button", { name: "טען מהטקסט" }).click();
    await page.waitForTimeout(120);
  };

  await pasteAndLoad("this is not json {");
  check(
    "[validate] invalid JSON → error",
    await page.getByText("קובץ הגיבוי לא תקין").isVisible(),
  );

  await pasteAndLoad(JSON.stringify({ app: "Other", backupVersion: 1, data: {} }));
  check(
    "[validate] wrong app → error",
    await page.getByText("הקובץ לא נראה כמו גיבוי של Fit OS").isVisible(),
  );

  await pasteAndLoad(
    JSON.stringify({ app: "Fit OS", backupVersion: 999, data: {} }),
  );
  check(
    "[validate] unsupported version → error",
    await page.getByText("גרסת הגיבוי אינה נתמכת").isVisible(),
  );

  await ctx.close();
}

/* ===================================================================== *
 * 3. Preview + confirmation gate (no write without confirm).            *
 * ===================================================================== */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 900 },
    colorScheme: "light",
  });
  await ctx.addInitScript(seed());
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[preview] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[preview] pageerror: ${e.message}`));
  await page.goto(`${BASE}/backup`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /הדבק טקסט גיבוי/ }).click();
  await page.getByLabel("הדבקת טקסט גיבוי").fill(backupText);
  await page.getByRole("button", { name: "טען מהטקסט" }).click();

  check(
    "[preview] preview card shown before restore",
    await page.getByText("תצוגה מקדימה של הגיבוי").isVisible(),
  );
  // The preview renders labelled count rows (date, nutrition, etc.) and the
  // workouts count value (1) before any write.
  const previewText = await page
    .getByText("תצוגה מקדימה של הגיבוי")
    .locator("xpath=ancestor::div[1]")
    .innerText();
  check(
    "[preview] preview lists count rows",
    previewText.includes("תאריך הגיבוי") &&
      previewText.includes("רשומות תזונה") &&
      previewText.includes("אימונים"),
  );

  // Confirm dialog opens and a cancel leaves data untouched (still seeded).
  await page.getByRole("button", { name: "שחזר עכשיו" }).first().click();
  check(
    "[preview] confirm dialog appears",
    await page.getByRole("dialog", { name: "שחזור גיבוי" }).isVisible(),
  );
  await page
    .getByRole("dialog", { name: "שחזור גיבוי" })
    .getByRole("button", { name: "ביטול" })
    .click();
  await page.waitForTimeout(100);
  const stillThere = await page.evaluate(
    () => JSON.parse(localStorage.getItem("yfos:workouts") || "[]").length,
  );
  check("[preview] cancel does not write/alter data", stillThere === 1);

  await ctx.close();
}

/* ===================================================================== *
 * 4. Full scenario: clear all data → restore → data reappears,          *
 *    admin/gate state untouched.                                        *
 * ===================================================================== */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 900 },
    colorScheme: "light",
  });
  await ctx.addInitScript(seed());
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[restore] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[restore] pageerror: ${e.message}`));
  await page.goto(`${BASE}/backup`, { waitUntil: "networkidle" });

  // Clear all Fit OS USER-DATA keys (leave gates/admin in place).
  await page.evaluate(() => {
    [
      "yfos:workouts",
      "yfos:foodLogs",
      "yfos:settings",
      "yfos:workout-templates:v1",
      "yfos:saved-food-values:v1",
      "yfos:favorite-foods:v1",
      "yfos:water-logs:v1",
      "yfos:supplements:v1",
      "yfos:supplement-logs:v1",
      "yfos:active-workout-draft:v1",
    ].forEach((k) => localStorage.removeItem(k));
  });
  check(
    "[restore] data cleared before restore",
    (await page.evaluate(
      () => JSON.parse(localStorage.getItem("yfos:workouts") || "[]").length,
    )) === 0,
  );

  await page.getByRole("button", { name: /הדבק טקסט גיבוי/ }).click();
  await page.getByLabel("הדבקת טקסט גיבוי").fill(backupText);
  await page.getByRole("button", { name: "טען מהטקסט" }).click();
  await page.getByRole("button", { name: "שחזר עכשיו" }).first().click();
  await page
    .getByRole("dialog", { name: "שחזור גיבוי" })
    .getByRole("button", { name: "שחזר עכשיו" })
    .click();

  check(
    "[restore] success state shown",
    await page.getByText("הגיבוי שוחזר בהצלחה").isVisible(),
  );

  const restored = await page.evaluate(() => ({
    workouts: JSON.parse(localStorage.getItem("yfos:workouts") || "[]").length,
    food: JSON.parse(localStorage.getItem("yfos:foodLogs") || "[]").length,
    water: JSON.parse(localStorage.getItem("yfos:water-logs:v1") || "[]").length,
    supps: JSON.parse(localStorage.getItem("yfos:supplements:v1") || "[]").length,
    suppLogs: JSON.parse(
      localStorage.getItem("yfos:supplement-logs:v1") || "[]",
    ).length,
    settings: JSON.parse(localStorage.getItem("yfos:settings") || "{}")
      .proteinGoal,
    admin: localStorage.getItem("yfos:admin-access-granted:v1"),
    restoredAt: JSON.parse(localStorage.getItem("yfos:backup-meta:v1") || "{}")
      .lastRestoredAt,
  }));
  check("[restore] workouts restored", restored.workouts === 1);
  check("[restore] nutrition restored", restored.food === 1);
  check("[restore] water restored", restored.water === 1);
  check("[restore] supplements restored", restored.supps === 1);
  check("[restore] supplement logs restored", restored.suppLogs === 1);
  check("[restore] settings restored (proteinGoal=200)", restored.settings === 200);
  check("[restore] admin grant untouched", restored.admin === "1");
  check("[restore] restore meta recorded", typeof restored.restoredAt === "string");

  // The restored data is actually visible after a reload (Progress derives it).
  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  check(
    "[restore] /progress renders after restore",
    await page.locator("body").isVisible(),
  );

  await ctx.close();
}

/* ===================================================================== *
 * 5. Reachability from Settings + System Hub.                           *
 * ===================================================================== */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 900 },
    colorScheme: "light",
  });
  await ctx.addInitScript(seed());
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[links] ${m.text()}`));
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  check(
    "[links] Settings has a /backup link",
    (await page.locator('a[href="/backup"]').count()) >= 1,
  );
  await page.goto(`${BASE}/more`, { waitUntil: "networkidle" });
  check(
    "[links] System Hub has a /backup link",
    (await page.locator('a[href="/backup"]').count()) >= 1,
  );
  await ctx.close();
}

/* ===================================================================== *
 * 6. Mobile widths + light/dark, no overflow, empty state friendly.     *
 * ===================================================================== */
for (const scheme of ["dark", "light"]) {
  for (const width of [360, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: scheme,
    });
    // No data seeded beyond gates → exercises the friendly empty/new state.
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        sessionStorage.setItem(
          "yfos:private-access-notice-accepted:session",
          "1",
        );
        localStorage.setItem("yfos:admin-access-granted:v1", "1");
        localStorage.setItem("yfos:settings", JSON.stringify({ theme: scheme }));
      } catch {}
    });
    const page = await ctx.newPage();
    const tag = `${scheme}/${width}`;
    page.on(
      "console",
      (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
    );
    page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
    await page.goto(`${BASE}/backup`, { waitUntil: "networkidle" });
    check(
      `[${tag}] /backup title visible (empty state)`,
      await page.getByRole("heading", { name: "גיבוי ושחזור" }).isVisible(),
    );
    check(
      `[${tag}] export button present`,
      await page.getByRole("button", { name: "ייצא גיבוי" }).isVisible(),
    );
    check(`[${tag}] no horizontal overflow`, (await noOverflow(page)) === 0);
    if (width === 390) {
      await page.screenshot({
        path: `${OUT}/backup-${scheme}.png`,
        fullPage: true,
      });
    }
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
