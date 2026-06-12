import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const ROUTES = ["/", "/workouts", "/exercises", "/nutrition", "/progress", "/settings"];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

const msgs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") msgs.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => msgs.push(`[pageerror] ${e.message}`));

for (const r of ROUTES) {
  await page.goto(BASE + r, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}
// Also toggle theme to surface any theme-related warnings.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.locator('button[aria-label="החלפת מצב תצוגה"]').click();
await page.waitForTimeout(300);

await browser.close();
console.log("===== CONSOLE ERRORS/WARNINGS (" + msgs.length + ") =====");
msgs.forEach((m) => console.log(m));
if (!msgs.length) console.log("none");
