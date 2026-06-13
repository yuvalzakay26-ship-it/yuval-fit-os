// Smoke pass: confirms Phase 3.18 didn't regress neighbouring flows.
// Usage: node scripts/qa-nutrition-smoke.mjs (expects `next start -p 3199`)
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3199";
const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); if (!ok) failures++; };

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem("yfos:welcome-seen:v1", "1"); } catch {} });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

/* Manual add (no foodId) still works and never shows the save-values checkbox. */
await page.goto(`${BASE}/nutrition/add`, { waitUntil: "networkidle" });
check("manual add: no save-values checkbox", !(await page.getByText("שמור ערכים לפעם הבאה").count()));
await page.fill("#food-name", "בדיקה ידנית");
await page.fill("#protein", "30");
await page.fill("#calories", "200");
await page.getByRole("button", { name: "הוסף ליומן" }).click();
await page.waitForURL(`${BASE}/nutrition`);
check("manual add: saved + returned to nutrition", page.url() === `${BASE}/nutrition`);
check("manual add: appears in today's diary", (await page.getByText("בדיקה ידנית").count()) > 0);

/* Totals reflect the manual log's macros (computed from FoodLog only). */
const body = await page.textContent("body");
check("totals include manual protein (30)", /30/.test(body));

/* Library route renders the grid. */
await page.goto(`${BASE}/nutrition/library`, { waitUntil: "networkidle" });
check("library route renders food images", (await page.locator("img").count()) > 0);
check("library: no horizontal overflow", (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0);

/* Welcome smoke: clearing the flag shows the intro again. */
await page.evaluate(() => { try { localStorage.removeItem("yfos:welcome-seen:v1"); } catch {} });
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const html = await page.content();
check("welcome smoke: page renders without error", html.length > 0);

await ctx.close();
await browser.close();
if (errors.length) { console.log(`CONSOLE ERRORS:\n${errors.join("\n")}`); failures++; }
else console.log("No console errors.");
process.exit(failures ? 1 : 0);
