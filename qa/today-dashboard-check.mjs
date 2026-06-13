import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3100";
const OUT = "qa/screens";
const browser = await chromium.launch();

const errors = [];

async function capture(name, viewport, state, colorScheme = "light") {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${name}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  const pairs = Object.entries(state);
  await page.addInitScript((pairs) => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      for (const [k, v] of pairs) localStorage.setItem(k, v);
    } catch {}
  }, pairs);
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  if (name === "rich-360") {
    const text = await page.evaluate(() => document.body.innerText);
    // All four habits active → hero should report 4/4 in motion.
    if (!text.includes("4 מתוך 4 הרגלים בתנועה")) {
      errors.push(`[${name}] expected 4/4 habits in motion`);
    }
    if (!text.includes("1.5 ליטר")) {
      errors.push(`[${name}] water total not reflected`);
    }
    if (!text.includes("1 מתוך 2 סומנו")) {
      errors.push(`[${name}] supplement taken count not reflected`);
    }
  }
  // Horizontal overflow check.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) errors.push(`[${name}] horizontal overflow: ${overflow}px`);
  await page.screenshot({ path: `${OUT}/today-${name}.png`, fullPage: true });
  await ctx.close();
}

const today = new Date().toISOString().slice(0, 10);

// Rich data: workout today, food logs, water, supplements (one taken).
const rich = {
  "yfos:workouts": JSON.stringify([
    {
      id: "w1",
      date: today,
      title: "אימון גב וביצפס",
      muscleGroups: ["back", "biceps"],
      exercises: [
        { exerciseId: "lat-pulldown", sets: [{ setNumber: 1, weightKg: 60, reps: 10, completed: true }] },
      ],
    },
  ]),
  "yfos:foodLogs": JSON.stringify([
    { id: "f1", date: today, mealType: "breakfast", foodName: "שייק חלבון", quantityText: "1", protein: 30, carbs: 20, fat: 5, calories: 250 },
    { id: "f2", date: today, mealType: "lunch", foodName: "חזה עוף ואורז", quantityText: "1", protein: 45, carbs: 60, fat: 10, calories: 520 },
  ]),
  "yfos:water-logs:v1": JSON.stringify([
    { date: today, totalMl: 1500, entries: [{ id: "e1", amountMl: 1500, createdAt: new Date().toISOString() }] },
  ]),
  "yfos:supplements:v1": JSON.stringify([
    { id: "s1", name: "ויטמין D", category: "vitamin", isActive: true, createdAt: new Date().toISOString(), schedule: { frequency: "daily", timesOfDay: ["morning"] } },
    { id: "s2", name: "אומגה 3", category: "general-health", isActive: true, createdAt: new Date().toISOString(), schedule: { frequency: "daily", timesOfDay: ["noon"] } },
  ]),
  "yfos:supplement-logs:v1": JSON.stringify([
    { id: "l1", supplementId: "s1", date: today, takenAt: new Date().toISOString() },
  ]),
};

await capture("empty-360", { width: 360, height: 800 }, {});
await capture("rich-360", { width: 360, height: 800 }, rich);
await capture("rich-390", { width: 390, height: 844 }, rich);
await capture("rich-dark-390", { width: 390, height: 844 }, rich, "dark");

await browser.close();

if (errors.length) {
  console.error("QA ISSUES:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("today dashboard QA passed — no console errors, no overflow");
