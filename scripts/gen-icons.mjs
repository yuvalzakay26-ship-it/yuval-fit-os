// Generates the PWA / favicon / apple-touch PNG icons from a single brand SVG
// (the gradient "Y" mark) by rasterizing with headless Chromium. Re-run after
// changing the brand mark: `node scripts/gen-icons.mjs`.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });

const GRADIENT = `
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1ad99b"/>
    <stop offset="50%" stop-color="#12c08a"/>
    <stop offset="100%" stop-color="#0fa874"/>
  </linearGradient>`;

/**
 * @param size pixel size
 * @param maskable full-bleed square with the glyph kept inside the safe zone
 */
function svg(size, maskable = false) {
  const radius = maskable ? 0 : Math.round(size * 0.22);
  // Maskable icons must keep content within the inner ~80% safe zone.
  const fontSize = Math.round(size * (maskable ? 0.46 : 0.6));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>${GRADIENT}</defs>
    <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#g)"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-weight="900"
      font-size="${fontSize}" fill="#ffffff">Y</text>
  </svg>`;
}

const TARGETS = [
  { path: "public/icons/icon-192.png", size: 192, maskable: false },
  { path: "public/icons/icon-512.png", size: 512, maskable: false },
  { path: "public/icons/icon-maskable-192.png", size: 192, maskable: true },
  { path: "public/icons/icon-maskable-512.png", size: 512, maskable: true },
  // Next.js file conventions (auto-linked):
  { path: "app/apple-icon.png", size: 180, maskable: true },
  { path: "app/icon.png", size: 512, maskable: false },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const t of TARGETS) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;padding:0">${svg(t.size, t.maskable)}</body></html>`,
    { waitUntil: "networkidle" },
  );
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: t.size, height: t.size },
    omitBackground: true,
  });
  writeFileSync(t.path, buf);
  console.log(`✓ ${t.path} (${t.size}x${t.size}${t.maskable ? ", maskable" : ""})`);
}

await browser.close();
console.log("Icons generated.");
