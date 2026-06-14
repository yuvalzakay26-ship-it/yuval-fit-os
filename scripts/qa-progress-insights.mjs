// QA pass for the Progress Insights upgrade (Phase 3.xx).
// Usage: node scripts/qa-progress-insights.mjs (expects `next start -p 3331` running)
//
// Verifies the premium Progress screen: the weekly hero ("השבוע שלך"), human
// empty states (no cold dashes), rule-based weekly insights ("תובנות השבוע"),
// the 7-day weekly trends ("מגמות שבועיות"), and the personal-records section
// ("שיאים אישיים"). Exercises three data states (empty / one workout / rich
// week) and asserts no horizontal overflow + no console errors at 360/390 in
// light and dark. localStorage-only — no backend, no AI, no data-model change.
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

// Seed the three access gates + a chosen data scenario before the app loads.
// Dates are computed in-browser (local ISO, week-start = Sunday) so the seeded
// data lands inside "this week" regardless of timezone — see the DEVELOPER_GUIDE
// note about local vs UTC seeding.
function seedScript() {
  return (s) => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
      localStorage.setItem("yfos:admin-access-granted:v1", "1");

      const iso = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      };
      const now = new Date();
      const today = iso(now);
      const ws = new Date(now);
      ws.setDate(now.getDate() - now.getDay()); // Sunday
      const weekStart = iso(ws);
      const weekStartPlus1 = iso(
        new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 1),
      );

      const workouts = [];
      const foodLogs = [];
      const waterLogs = [];

      const makeWorkout = (id, date, title, exId, kg, reps) => ({
        id,
        date,
        title,
        muscleGroups: ["back"],
        exercises: [
          {
            exerciseId: exId,
            sets: [{ setNumber: 1, weightKg: kg, reps, completed: true }],
          },
        ],
      });

      if (s === "one") {
        // Exactly one workout this week, with weight → personal record. No
        // nutrition, no water → friendly empty states must appear.
        workouts.push(
          makeWorkout("w1", today, "אימון גב", "lat-pulldown", 55, 10),
        );
      } else if (s === "rich") {
        // A real week: two workouts (weights), two nutrition days, water today.
        workouts.push(
          makeWorkout("w1", today, "אימון גב", "lat-pulldown", 55, 10),
          makeWorkout("w2", weekStart, "חתירה", "bent-over-row", 80, 8),
        );
        foodLogs.push(
          { id: "f1", date: today, mealType: "lunch", foodName: "עוף", quantityText: "200 גרם", protein: 40, carbs: 0, fat: 6, calories: 300 },
          { id: "f2", date: weekStart, mealType: "dinner", foodName: "טונה", quantityText: "100 גרם", protein: 25, carbs: 0, fat: 3, calories: 150 },
          { id: "f3", date: weekStartPlus1, mealType: "breakfast", foodName: "ביצים", quantityText: "3 יחידות", protein: 18, carbs: 1, fat: 15, calories: 220 },
        );
        waterLogs.push(
          { date: today, totalMl: 1500, entries: [{ id: "e1", amountMl: 1500, createdAt: now.toISOString() }] },
          { date: weekStart, totalMl: 2000, entries: [{ id: "e2", amountMl: 2000, createdAt: now.toISOString() }] },
        );
      }

      localStorage.setItem("yfos:workouts", JSON.stringify(workouts));
      localStorage.setItem("yfos:foodLogs", JSON.stringify(foodLogs));
      localStorage.setItem("yfos:water-logs:v1", JSON.stringify(waterLogs));
    } catch {}
  };
}

async function openProgress(scenario, scheme, width) {
  const ctx = await browser.newContext({
    viewport: { width, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  await ctx.addInitScript(seedScript(), scenario);
  const page = await ctx.newPage();
  const tag = `${scenario}/${scheme}/${width}`;
  page.on(
    "console",
    (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
  );
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  return { ctx, page, tag };
}

const visible = (page, text, exact = true) =>
  page.getByText(text, { exact }).first().isVisible();

// Whitespace-tolerant body-text check — inline number+unit spans render with no
// space between them (e.g. `55ק"ג`), so normalise before matching.
const bodyHas = async (page, needle) => {
  const text = await page.evaluate(() =>
    document.body.innerText.replace(/\s+/g, ""),
  );
  return text.includes(needle.replace(/\s+/g, ""));
};

for (const scheme of ["dark", "light"]) {
  for (const width of [360, 390]) {
    /* 1. Empty / new user — friendly full empty state, no fake data, no crash. */
    {
      const { ctx, page, tag } = await openProgress("empty", scheme, width);
      check(
        `[${tag}] empty: shows friendly empty state`,
        await visible(page, "אין עדיין נתונים להצגה"),
      );
      check(`[${tag}] empty: no horizontal overflow`, (await noOverflow(page)) === 0);
      await ctx.close();
    }

    /* 2. One workout — hero counts it, last workout shows, friendly empty
          states for protein + weekly water, a personal record appears. */
    {
      const { ctx, page, tag } = await openProgress("one", scheme, width);
      check(`[${tag}] one: weekly hero "השבוע שלך"`, await visible(page, "השבוע שלך"));
      check(
        `[${tag}] one: hero one-workout message`,
        await visible(page, "ביצעת אימון אחד השבוע", false),
      );
      check(
        `[${tag}] one: friendly protein empty state`,
        await visible(page, "אין מספיק נתונים", false),
      );
      check(
        `[${tag}] one: friendly weekly-water empty state`,
        await visible(page, "אין מספיק נתוני מים השבוע"),
      );
      check(`[${tag}] one: weekly trends section`, await visible(page, "מגמות שבועיות"));
      check(`[${tag}] one: weekly insights section`, await visible(page, "תובנות השבוע"));
      check(`[${tag}] one: personal records section`, await visible(page, "שיאים אישיים"));
      check(
        `[${tag}] one: record weight shown`,
        await bodyHas(page, '55 ק"ג'),
      );
      check(`[${tag}] one: no horizontal overflow`, (await noOverflow(page)) === 0);
      await ctx.close();
    }

    /* 3. Rich week — protein average + water values display, top record shown. */
    {
      const { ctx, page, tag } = await openProgress("rich", scheme, width);
      check(`[${tag}] rich: weekly hero`, await visible(page, "השבוע שלך"));
      check(
        `[${tag}] rich: protein average label present`,
        await visible(page, "ממוצע חלבון יומי"),
      );
      // No "not enough data" protein copy when we have ≥2 nutrition days.
      check(
        `[${tag}] rich: protein has a real average (no empty copy)`,
        (await page.getByText("אין מספיק נתונים", { exact: false }).count()) === 0,
      );
      check(
        `[${tag}] rich: weekly water average shows`,
        await visible(page, "ממוצע מים השבוע"),
      );
      check(
        `[${tag}] rich: heaviest record (80 ק"ג) shown`,
        await bodyHas(page, '80 ק"ג'),
      );
      check(`[${tag}] rich: no horizontal overflow`, (await noOverflow(page)) === 0);
      if (width === 390) {
        await page.screenshot({
          path: `${OUT}/progress-insights-${scheme}.png`,
          fullPage: true,
        });
      }
      await ctx.close();
    }
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
