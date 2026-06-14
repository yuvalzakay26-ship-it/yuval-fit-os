// Brand asset generator — Fit OS premium identity.
//
// Single source of truth for the logo/app-icon. Defines one master SVG (a
// minimalist broad-shoulders / upper-back V-taper silhouette on a premium
// navy→teal→cyan gradient) and rasterises every PNG the app/PWA needs from it
// via sharp. Re-run with `node scripts/brand/generate-brand.mjs` after editing
// the silhouette or palette below.

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// ── Palette ──────────────────────────────────────────────────────────────
// Premium dark base with a teal→cyan accent. Deliberately not the old flat
// green. Shared by every raster export so the identity stays consistent.
const NAVY = "#0a2a52";
const TEAL = "#0e7e90";
const CYAN = "#17c0d4";

// The athletic broad-shoulders / upper-back silhouette. Authored as the RIGHT
// half only (centre axis x=256) then mirrored in code so it is perfectly
// symmetric. Read top→bottom: narrow neck, trapezius sloping out to broad
// deltoid caps (the widest point, kept high), then a strong inward lat taper to
// a narrow waist — the classic strength-training "V". Smooth cubics so it stays
// crisp down to favicon sizes.
const AXIS = 256;
const mx = (x) => 2 * AXIS - x; // mirror an x across the centre axis

// Right-half outline as cubic segments [c1x,c1y, c2x,c2y, x,y], from the
// neck-top centre down to the waist-bottom centre. A raised neck reads the mark
// as a body; the trapezius yoke flares from the neck out to rounded deltoid
// caps (the widest point), then the lats sweep inward to a narrow waist.
const HALF_START = [AXIS, 96];
const HALF = [
  [266, 96, 274, 98, 281, 104], // rounded neck-top corner
  [286, 116, 288, 128, 289, 142], // down the side of the neck
  [317, 148, 347, 158, 375, 176], // trapezius flaring out to the shoulder
  [395, 188, 407, 203, 408, 226], // deltoid cap — rounded, widest point (high)
  [409, 250, 400, 272, 383, 296], // deltoid lower edge, turning sharply inward
  [357, 344, 320, 398, 286, 430], // lat sweeping concave-in to a narrow waist (the V)
  [278, 437, 268, 441, AXIS, 442], // round in to a narrow waist base
];

function buildSilhouette() {
  const fwd = HALF.map((s) => ({
    c1: [s[0], s[1]],
    c2: [s[2], s[3]],
    to: [s[4], s[5]],
  }));
  // Walking back up the mirrored side: segments in reverse, control points swap.
  const back = [];
  for (let i = fwd.length - 1; i >= 0; i--) {
    const from = i === 0 ? HALF_START : fwd[i - 1].to;
    const { c1, c2 } = fwd[i];
    back.push(
      `C${mx(c2[0])} ${c2[1]} ${mx(c1[0])} ${c1[1]} ${mx(from[0])} ${from[1]}`,
    );
  }
  return (
    `M${HALF_START[0]} ${HALF_START[1]} ` +
    fwd.map((f) => `C${f.c1[0]} ${f.c1[1]} ${f.c2[0]} ${f.c2[1]} ${f.to[0]} ${f.to[1]}`).join(" ") +
    " " +
    back.join(" ") +
    " Z"
  );
}

const SILHOUETTE = buildSilhouette();

// Negative-space spine groove — thin centred vesica, just enough anatomy to
// read "upper back" without extra detail. Symmetric about the axis already.
const SPINE = `
M256 190
C248 208 245 234 245 276
C245 322 248 360 251 396
L256 404
L261 396
C264 360 267 322 267 276
C267 234 264 208 256 190
Z`
  .replace(/\s+/g, " ")
  .trim();

function iconSvg({ size = 512, radius = 0.225, bleed = false } = {}) {
  // Everything is authored in a fixed 0..512 space; sharp scales the whole SVG
  // to `size`. `bleed` renders the gradient edge-to-edge (for maskable icons a
  // launcher crops); otherwise a rounded "squircle" app-icon tile.
  const r = bleed ? 0 : Math.round(512 * radius);
  const rect = (fill) =>
    `<rect width="512" height="512" rx="${r}" ry="${r}" fill="${fill}"/>`;
  // Maskable safe zone: shrink the mark a touch so nothing important is clipped.
  const markScale = bleed ? 0.78 : 0.9;
  const t = (512 - 512 * markScale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="0.52" stop-color="${TEAL}"/>
      <stop offset="1" stop-color="${CYAN}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.32" cy="0.26" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mark" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#dff4f8"/>
    </linearGradient>
    <filter id="lift" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#04111f" flood-opacity="0.32"/>
    </filter>
  </defs>
  ${rect("url(#bg)")}
  ${rect("url(#glow)")}
  <g transform="translate(${t} ${t}) scale(${markScale})" filter="url(#lift)">
    <path d="${SILHOUETTE}" fill="url(#mark)"/>
    <path d="${SPINE}" fill="${NAVY}" fill-opacity="0.9"/>
  </g>
</svg>`;
}

// Master, resolution-independent logo (rounded app tile).
const masterSvg = iconSvg({ size: 512, radius: 0.225, bleed: false });

// Glyph-only mark (silhouette + spine, no tile) for inline in-app use where the
// surrounding element already supplies the gradient tile. White, inherits
// nothing — coloured by the parent via the fills below.
const glyphSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path d="${SILHOUETTE}" fill="currentColor"/>
  <path d="${SPINE}" fill="#000000" fill-opacity="0.14"/>
</svg>`;

const OUT = {
  master: resolve(ROOT, "public/brand/logo.svg"),
  glyph: resolve(ROOT, "public/brand/mark.svg"),
};

const RASTERS = [
  { svg: iconSvg({ size: 512 }), file: "app/icon.png" },
  { svg: iconSvg({ size: 180 }), file: "app/apple-icon.png" },
  { svg: iconSvg({ size: 192 }), file: "public/icons/icon-192.png" },
  { svg: iconSvg({ size: 512 }), file: "public/icons/icon-512.png" },
  { svg: iconSvg({ size: 192, bleed: true }), file: "public/icons/icon-maskable-192.png" },
  { svg: iconSvg({ size: 512, bleed: true }), file: "public/icons/icon-maskable-512.png" },
  // Preview only — handy to eyeball, not referenced by the app.
  { svg: iconSvg({ size: 256 }), file: "scripts/brand/preview.png" },
];

async function main() {
  await mkdir(resolve(ROOT, "public/brand"), { recursive: true });
  await writeFile(OUT.master, masterSvg, "utf8");
  await writeFile(OUT.glyph, glyphSvg, "utf8");

  for (const { svg, file } of RASTERS) {
    const out = resolve(ROOT, file);
    await mkdir(dirname(out), { recursive: true });
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log("wrote", file);
  }
  console.log("wrote public/brand/logo.svg + public/brand/mark.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
