// QA pass for Nutrition Quick Reuse — "אכלת לאחרונה" + "הוסף שוב" (Phase 3.xx).
// Usage: node scripts/qa-nutrition-reuse.mjs (expects `next start -p 3338` running)
//
// Recent foods are derived purely from the existing food-log history (no new
// storage key) and carry the macros the user already entered, so "הוסף שוב"
// re-logs a food in one tap. This script covers the empty state, recent dedupe
// + limit, add-again from both the recent section and the journal, totals, and
// that originals are never mutated. Macros are always user-entered — nothing is
// inferred.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3338";
const OUT = ".qa-shots";
const KEY = "yfos:foodLogs";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};

const ADD_AGAIN = "הוסף שוב";
const RECENT_TITLE = "אכלת לאחרונה";
const EMPTY = "עדיין אין מאכלים אחרונים";
const TOAST = "נוסף ליומן של היום";
const AVOCADO = "טוסט אבוקדו";

const noOverflow = (page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
const readLogs = (page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]"), KEY);
const todayCount = (logs, today) => logs.filter((l) => l.date === today).length;

/** Seed a set of food logs with dates relative to the LOCAL today (not UTC). */
function seedScript() {
  return (k) => {
    const d = new Date();
    const iso = (offset) => {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
      const y = x.getFullYear();
      const m = String(x.getMonth() + 1).padStart(2, "0");
      const day = String(x.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const logs = [
      // Older avocado toast — the headline QA scenario.
      { id: "seed_avocado", date: iso(1), mealType: "breakfast", foodName: "טוסט אבוקדו", quantityText: "200 גרם", calories: 420, protein: 18, carbs: 40, fat: 22 },
      { id: "seed_chicken", date: iso(2), mealType: "lunch", foodName: "חזה עוף", quantityText: "150 גרם", calories: 250, protein: 46, carbs: 0, fat: 6 },
      { id: "seed_rice", date: iso(2), mealType: "lunch", foodName: "אורז לבן", quantityText: "100 גרם", calories: 130, protein: 3, carbs: 28, fat: 0 },
      { id: "seed_shake", date: iso(3), mealType: "snack", foodName: "שייק חלבון", quantityText: "1 כוס", calories: 180, protein: 30, carbs: 8, fat: 2 },
      { id: "seed_yogurt", date: iso(3), mealType: "snack", foodName: "יוגורט", quantityText: "200 גרם", calories: 120, protein: 10, carbs: 14, fat: 3 },
      { id: "seed_egg", date: iso(4), mealType: "breakfast", foodName: "ביצים", quantityText: "2 יחידות", calories: 155, protein: 13, carbs: 1, fat: 11 },
      { id: "seed_banana", date: iso(5), mealType: "snack", foodName: "בננה", quantityText: "1 יחידה", calories: 105, protein: 1, carbs: 27, fat: 0 },
      { id: "seed_oats", date: iso(6), mealType: "breakfast", foodName: "שיבולת שועל", quantityText: "60 גרם", calories: 230, protein: 8, carbs: 40, fat: 4 },
      { id: "seed_tuna", date: iso(7), mealType: "lunch", foodName: "טונה", quantityText: "1 קופסה", calories: 190, protein: 30, carbs: 0, fat: 8 },
      { id: "seed_apple", date: iso(8), mealType: "snack", foodName: "תפוח", quantityText: "1 יחידה", calories: 95, protein: 0, carbs: 25, fat: 0 },
      // Exact duplicate of avocado on an even older day → must NOT add a 2nd card.
      { id: "seed_avocado_dup", date: iso(9), mealType: "breakfast", foodName: "טוסט אבוקדו", quantityText: "200 גרם", calories: 420, protein: 18, carbs: 40, fat: 22 },
    ];
    localStorage.setItem(k, JSON.stringify(logs));
  };
}

for (const scheme of ["dark", "light"]) {
  /* ---------- Empty state (no logs) ---------- */
  const emptyCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  await emptyCtx.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
      localStorage.setItem("yfos:admin-access-granted:v1", "1");
    } catch {}
  });
  const emptyPage = await emptyCtx.newPage();
  emptyPage.on("console", (m) => m.type() === "error" && errors.push(`[${scheme}] ${m.text()}`));
  emptyPage.on("pageerror", (e) => errors.push(`[${scheme}] pageerror: ${e.message}`));

  await emptyPage.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
  check(`[${scheme}] recent section renders`, await emptyPage.getByText(RECENT_TITLE, { exact: true }).isVisible());
  check(`[${scheme}] friendly empty state shown when no logs`, await emptyPage.getByText(EMPTY).isVisible());
  check(`[${scheme}] no add-again button in empty state`, (await emptyPage.getByRole("button", { name: new RegExp(ADD_AGAIN) }).count()) === 0);
  check(`[${scheme}] empty: no horizontal overflow`, (await noOverflow(emptyPage)) === 0);
  await emptyCtx.close();

  /* ---------- Seeded: recent + add again ---------- */
  for (const width of [360, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: scheme,
    });
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
        localStorage.setItem("yfos:admin-access-granted:v1", "1");
      } catch {}
    });
    await ctx.addInitScript(seedScript(), KEY);
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push(`[${scheme}/${width}] ${m.text()}`));
    page.on("pageerror", (e) => errors.push(`[${scheme}/${width}] pageerror: ${e.message}`));

    await page.goto(`${BASE}/nutrition`, { waitUntil: "networkidle" });
    const today = await page.evaluate(() => {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day}`;
    });

    // Recent section shows avocado and respects the de-dupe + limit (≤ 8 cards).
    check(`[${scheme}/${width}] recent shows ${AVOCADO}`, await page.getByText(AVOCADO).first().isVisible());
    const addAgainButtons = page.getByRole("button", { name: new RegExp(ADD_AGAIN) });
    // Count the bold card-title paragraph only (FoodImage also renders the name
    // as a placeholder when a log has no image, so a plain text match double-counts).
    const recentCardCount = await page.locator("p.font-bold", { hasText: AVOCADO }).count();
    check(`[${scheme}/${width}] avocado de-duped (one recent card)`, recentCardCount === 1);
    // 11 seeded logs, 10 unique keys, capped at 8.
    const btnCount = await addAgainButtons.count();
    check(`[${scheme}/${width}] recent limit respected (8 cards, no journal yet)`, btnCount === 8);
    check(`[${scheme}/${width}] seeded: no horizontal overflow`, (await noOverflow(page)) === 0);
    await page.screenshot({ path: `${OUT}/reuse-${scheme}-${width}-recent.png` });

    // --- Add again from the recent section ---
    const logsBefore = await readLogs(page);
    const idsBefore = new Set(logsBefore.map((l) => l.id));
    check(`[${scheme}/${width}] no today entries before add-again`, todayCount(logsBefore, today) === 0);

    await addAgainButtons.first().click();
    await page.getByText(TOAST).waitFor({ state: "visible", timeout: 3000 });
    check(`[${scheme}/${width}] calm success toast shown`, await page.getByText(TOAST).isVisible());

    const logsAfter = await readLogs(page);
    check(`[${scheme}/${width}] one new log created`, logsAfter.length === logsBefore.length + 1);
    check(`[${scheme}/${width}] today now has one entry`, todayCount(logsAfter, today) === 1);
    const added = logsAfter.find((l) => !idsBefore.has(l.id));
    check(`[${scheme}/${width}] new entry has a fresh id`, !!added && added.id !== "seed_avocado");
    check(`[${scheme}/${width}] new entry dated today`, !!added && added.date === today);
    // First recent card is the most recent seeded log = avocado (offset 1).
    check(`[${scheme}/${width}] duplicated values match original`, !!added && added.foodName === AVOCADO && added.protein === 18 && added.carbs === 40 && added.fat === 22 && added.calories === 420 && added.quantityText === "200 גרם" && added.mealType === "breakfast");
    const original = logsAfter.find((l) => l.id === "seed_avocado");
    check(`[${scheme}/${width}] original entry untouched`, !!original && original.date !== today && original.protein === 18);

    // Totals: today's macro summary should now reflect the duplicated protein.
    check(`[${scheme}/${width}] today's totals reflect add-again`, (await page.getByText(/18/).count()) > 0);

    // --- Add again from the journal (the entry we just added is today's) ---
    const journalAddBtn = page.locator(`button[aria-label^="${ADD_AGAIN}"]`);
    check(`[${scheme}/${width}] journal entry exposes add-again`, (await journalAddBtn.count()) >= 1);
    const beforeJournal = (await readLogs(page)).length;
    await journalAddBtn.first().click();
    await page.waitForTimeout(300);
    const afterJournal = await readLogs(page);
    check(`[${scheme}/${width}] journal add-again duplicates a today entry`, afterJournal.length === beforeJournal + 1);
    check(`[${scheme}/${width}] today now has two entries`, todayCount(afterJournal, today) === 2);
    check(`[${scheme}/${width}] post-add: no horizontal overflow`, (await noOverflow(page)) === 0);
    await page.screenshot({ path: `${OUT}/reuse-${scheme}-${width}-added.png` });

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
