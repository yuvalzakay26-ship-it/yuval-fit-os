// Phase 3.2 QA: Knowledge Center routes + protein calculator flow.
// Checks overflow on /learn pages (light+dark, 3 widths), drives the
// calculator on /nutrition, and verifies the saved goal reaches Today.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "qa/screens";
mkdirSync(OUT, { recursive: true });

const ARTICLE_IDS = [
  "training-basics",
  "progressive-overload",
  "protein-per-kg",
  "recovery-and-rest",
  "reading-your-progress",
];
const ROUTES = ["/learn", ...ARTICLE_IDS.map((id) => `/learn/${id}`)];
const WIDTHS = [360, 390, 430];

const issues = [];

async function checkOverflow(page, label) {
  const data = await page.evaluate(() => {
    const de = document.documentElement;
    return { scrollW: de.scrollWidth, clientW: de.clientWidth };
  });
  if (data.scrollW > data.clientW + 1) {
    issues.push(`[overflow] ${label}: scrollW=${data.scrollW} clientW=${data.clientW}`);
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
const page = await context.newPage();
page.on("pageerror", (e) => issues.push(`[pageerror] ${e.message}`));

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

/* -------------------- Overflow: learn routes, both themes -------------------- */
for (const theme of ["light", "dark"]) {
  await page.emulateMedia({ colorScheme: theme });
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(150);
      await checkOverflow(page, `${route} @${width} ${theme}`);
    }
  }
}

/* ------------------------------ Screenshots ------------------------------ */
await page.emulateMedia({ colorScheme: "light" });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/learn", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/learn-index-390-light.png`, fullPage: true });
await page.goto(BASE + "/learn/protein-per-kg", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/learn-protein-390-light.png`, fullPage: true });
await page.emulateMedia({ colorScheme: "dark" });
await page.goto(BASE + "/learn", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/learn-index-390-dark.png`, fullPage: true });
await page.emulateMedia({ colorScheme: "light" });

/* --------------------- Today → Knowledge Center entry --------------------- */
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const todayBody = await page.textContent("body");
if (!todayBody.includes("מרכז ידע")) issues.push("[entry] Today card missing מרכז ידע");
await page.getByText("מרכז ידע").first().click();
await page.waitForURL("**/learn");

/* ----------------- Calculator flow on /nutrition (save goal) ----------------- */
await page.goto(BASE + "/nutrition", { waitUntil: "networkidle" });
// Collapsed CTA should be visible.
const cta = page.getByText("חשב יעד חלבון", { exact: true });
if (!(await cta.isVisible())) issues.push("[calc] collapsed CTA not visible on /nutrition");
await cta.click();
await page.fill("#body-weight", "70");
await page.getByText("אימונים אינטנסיביים").click();
await page.waitForTimeout(200);
const calcText = await page.textContent("body");
// 70kg × 1.6–2.0 → 112–140, midpoint 126.
if (!calcText.includes("112–140")) issues.push("[calc] expected range 112–140 not shown");
await page.screenshot({ path: `${OUT}/learn-calculator-390-light.png`, fullPage: true });
await page.getByRole("button", { name: /שמור 126 גרם כיעד יומי/ }).click();
await page.waitForTimeout(300);

const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("yfos:settings")));
if (stored?.proteinGoal !== 126) issues.push(`[calc] proteinGoal=${stored?.proteinGoal}, expected 126`);
if (stored?.bodyWeightKg !== 70) issues.push(`[calc] bodyWeightKg=${stored?.bodyWeightKg}, expected 70`);
if (stored?.proteinActivityLevel !== "intense")
  issues.push(`[calc] proteinActivityLevel=${stored?.proteinActivityLevel}, expected intense`);

// Nutrition goal bar should now reflect 126.
const nutritionText = await page.textContent("body");
if (!nutritionText.includes("126")) issues.push("[calc] nutrition screen does not show new goal 126");

// Today hero should use the saved goal.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(200);
const todayAfter = await page.textContent("body");
if (!todayAfter.includes("מתוך 126")) issues.push("[calc] Today ring does not show מתוך 126");

/* -------------------- Settings: manual override still works -------------------- */
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
const settingsBody = await page.textContent("body");
if (!settingsBody.includes("מרכז ידע")) issues.push("[entry] Settings missing מרכז ידע link");
await page.fill("#protein-goal", "150");
await page.waitForTimeout(200);
const overridden = await page.evaluate(() => JSON.parse(localStorage.getItem("yfos:settings")));
if (overridden?.proteinGoal !== 150) issues.push(`[override] proteinGoal=${overridden?.proteinGoal}, expected 150`);

/* ----------------------- Templates still render fine ----------------------- */
await page.goto(BASE + "/workouts", { waitUntil: "networkidle" });
const workoutsBody = await page.textContent("body");
if (!workoutsBody.includes("תבניות")) issues.push("[templates] templates section missing on /workouts");

await browser.close();

console.log("\n===== LEARN QA ISSUES (" + issues.length + ") =====");
issues.forEach((i) => console.log(" - " + i));
if (issues.length === 0) console.log(" none 🎉");
process.exit(issues.length ? 1 : 0);
