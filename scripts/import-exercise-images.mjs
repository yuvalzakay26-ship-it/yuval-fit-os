// One-shot importer: normalizes exercise images from `public/training exercises/`
// into `public/exercises/<muscle-group>/<slug>.webp`.
//
// Usage: node scripts/import-exercise-images.mjs
//
// - Slugs are lowercase kebab-case English (stable exercise slugs).
// - PNG/JPG sources are converted to WebP (q80) via sharp to keep the PWA light;
//   sources already in webp are copied as-is.
// - The source folder is never modified or deleted.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE_ROOT = "public/training exercises";
const DEST_ROOT = "public/exercises";

// Source subfolder -> default destination muscle group.
const CATEGORIES = {
  "Chest exercises": "chest",
  "back exercises": "back",
  "leg exercises": "legs",
  "Shoulder exercises": "shoulders",
};

// File-name slug overrides so images land on existing seed-exercise imageKeys.
const SLUG_OVERRIDES = {
  "pull-up": "pull-ups", // existing exercise id "pull-ups"
  "barbell-row": "bent-over-row", // existing exercise id "bent-over-row"
  "barbell-squat": "squat", // existing exercise id "squat"
  "seated-dumbbell-shoulder-press": "shoulder-press", // existing exercise id "shoulder-press"
};

// Per-slug destination overrides (exercise's primary muscleGroup wins over
// the source folder, per public/exercises/README.md).
const DEST_OVERRIDES = {
  "romanian-deadlift": "glutes", // seeded under glutes
  "cable-kickback": "glutes", // glute isolation movement
  "glute-bridge": "glutes", // glute isolation movement
  "hip-thrust": "glutes", // glute isolation movement
};

// Skip specific "<sourceGroup>/<rawSlug>" entries that duplicate an image
// already imported from another folder (keyed by the source folder's default
// group, before SLUG/DEST overrides).
const SKIP = new Set([
  "legs/romanian-deadlift", // already imported from the back folder -> glutes/romanian-deadlift.webp
  "shoulders/face-pull", // already imported from the back folder -> back/face-pull.webp
]);

const SUPPORTED = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const imported = [];
const skipped = [];

for (const [srcDir, defaultGroup] of Object.entries(CATEGORIES)) {
  const dir = path.join(SOURCE_ROOT, srcDir);
  if (!fs.existsSync(dir)) {
    console.warn(`Missing source folder: ${dir}`);
    continue;
  }
  for (const file of fs.readdirSync(dir).sort()) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);
    if (!SUPPORTED.has(ext)) {
      skipped.push({ file: path.join(srcDir, file), reason: `unsupported format ${ext}` });
      continue;
    }
    const rawSlug = slugify(base);
    if (SKIP.has(`${defaultGroup}/${rawSlug}`)) {
      skipped.push({ file: path.join(srcDir, file), reason: "duplicate of an image already imported from another folder" });
      continue;
    }
    const slug = SLUG_OVERRIDES[rawSlug] ?? rawSlug;
    const group = DEST_OVERRIDES[slug] ?? defaultGroup;
    const destDir = path.join(DEST_ROOT, group);
    fs.mkdirSync(destDir, { recursive: true });

    const src = path.join(dir, file);
    if (ext === ".webp") {
      const dest = path.join(destDir, `${slug}.webp`);
      fs.copyFileSync(src, dest);
      imported.push({ slug, group, dest, note: "copied as-is" });
    } else {
      const dest = path.join(destDir, `${slug}.webp`);
      await sharp(src).webp({ quality: 80 }).toFile(dest);
      imported.push({ slug, group, dest, note: `converted ${ext} -> .webp` });
    }
  }
}

for (const item of imported) {
  const kb = Math.round(fs.statSync(item.dest).size / 1024);
  console.log(`OK  ${item.group}/${item.slug}.webp  ${kb}KB  (${item.note})`);
}
for (const item of skipped) {
  console.log(`SKIP ${item.file}  (${item.reason})`);
}
console.log(`\nImported: ${imported.length}, skipped: ${skipped.length}`);
