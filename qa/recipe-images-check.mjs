// Manual QA capture for Recipe Library V1.1 images. Shoots the list + an imaged
// detail page + a placeholder detail page at 360px and 390px, and logs whether a
// real <img> rendered and the document horizontal overflow at each width.
import { chromium } from "@playwright/test";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = "qa/screens";
const browser = await chromium.launch();

async function shoot(width, path, file) {
  const ctx = await browser.newContext({
    viewport: { width, height: 860 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
      localStorage.setItem("yfos:admin-access-granted:v1", "1");
    } catch {}
  });
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const imgCount = await page.locator("img").count();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: false });
  console.log(`@${width} ${path} → imgs=${imgCount} overflow=${overflow}px → ${file}`);
  await ctx.close();
}

await shoot(390, "/recipes", "recipes-list-390.png");
await shoot(360, "/recipes", "recipes-list-360.png");
await shoot(390, "/recipes/pancake-pro", "recipe-detail-imaged-390.png");
await shoot(360, "/recipes/carrot-cake", "recipe-detail-imaged-360.png");
await shoot(390, "/recipes/protein-shakshuka", "recipe-detail-placeholder-390.png");

await browser.close();
console.log("recipe image QA captures done");
