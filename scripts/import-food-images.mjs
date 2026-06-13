// One-shot importer: normalizes food images from `public/food source/<Folder>/`
// into `public/food/<category>/<slug>.webp`.
//
// Usage: node scripts/import-food-images.mjs
//
// - Slugs are lowercase kebab-case English (stable food slugs).
// - PNG/JPG sources are converted to WebP (q80) via sharp to keep the PWA light;
//   sources already in webp are copied as-is.
// - The source folder is never modified or deleted; it is gitignored.
// - Unlike the exercise importer, this script does NOT infer any nutrition
//   values from images. It only produces optimized images + reports slugs.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE_ROOT = "public/food source";
const DEST_ROOT = "public/food";

const SUPPORTED = new Set([".png", ".jpg", ".jpeg", ".webp"]);

// Valid destination categories (mirror FoodCategory in lib/food-library.ts).
const VALID_CATEGORIES = new Set([
  "proteins",
  "carbs",
  "vegetables",
  "salads",
  "israeli-food",
  "full-meals",
  "snacks",
  "drinks",
  "breakfast",
  "dairy",
  "other",
]);

// Map a raw source-folder name (any capitalization/spacing/Hebrew alias) to a
// normalized FoodCategory. Anything not matched here is slugified and, if it is
// a known category, used directly — otherwise it falls back to "other".
const FOLDER_ALIASES = {
  "eggs & breakfast": "breakfast",
  "eggs and breakfast": "breakfast",
  breakfast: "breakfast",
  drinks: "drinks",
  "israeli food": "israeli-food",
  snacks: "snacks",
  "full meals": "full-meals",
  lunch: "full-meals",
  dinner: "full-meals",
  salads: "salads",
  vegetables: "vegetables",
  // Hebrew "vegetables" folder shipped in Phase 3.14 ("ירקות — Vegetables").
  "ירקות — vegetables": "vegetables",
  ירקות: "vegetables",
  carbs: "carbs",
  "carbs & side dishes": "carbs",
  "carbs and side dishes": "carbs",
  // Hebrew "carbs & side dishes" folder shipped in Phase 3.13.
  "פחמימות ותוספות — carbs & side dishes": "carbs",
  "פחמימות ותוספות": "carbs",
  proteins: "proteins",
  "main proteins": "proteins",
  // Hebrew "main proteins" folder shipped in Phase 3.12 ("חלבונים עיקריים — Main Proteins").
  "חלבונים עיקריים — main proteins": "proteins",
  "חלבונים עיקריים": "proteins",
  dairy: "dairy",
  other: "other",
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveCategory(folderName) {
  const key = folderName.toLowerCase().trim();
  if (FOLDER_ALIASES[key]) return FOLDER_ALIASES[key];
  const slug = slugify(folderName);
  if (VALID_CATEGORIES.has(slug)) return slug;
  return "other";
}

if (!fs.existsSync(SOURCE_ROOT)) {
  console.error(`Missing source root: ${SOURCE_ROOT}`);
  process.exit(1);
}

const imported = [];
const skipped = [];

const subdirs = fs
  .readdirSync(SOURCE_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const folder of subdirs) {
  const category = resolveCategory(folder);
  if (category === "other" && !FOLDER_ALIASES[folder.toLowerCase().trim()]) {
    console.warn(`Folder "${folder}" did not match a known category -> "other"`);
  }
  const dir = path.join(SOURCE_ROOT, folder);
  const destDir = path.join(DEST_ROOT, category);

  for (const file of fs.readdirSync(dir).sort()) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);
    if (!SUPPORTED.has(ext)) {
      skipped.push({ file: path.join(folder, file), reason: `unsupported format ${ext}` });
      continue;
    }
    const slug = slugify(base);
    if (!slug) {
      skipped.push({ file: path.join(folder, file), reason: "name produced an empty slug" });
      continue;
    }
    fs.mkdirSync(destDir, { recursive: true });
    const src = path.join(dir, file);
    const dest = path.join(destDir, `${slug}.webp`);
    try {
      if (ext === ".webp") {
        fs.copyFileSync(src, dest);
        imported.push({ category, slug, dest, note: "copied as-is" });
      } else {
        await sharp(src).webp({ quality: 80 }).toFile(dest);
        imported.push({ category, slug, dest, note: `converted ${ext} -> .webp` });
      }
    } catch (err) {
      skipped.push({ file: path.join(folder, file), reason: `convert failed: ${err.message}` });
    }
  }
}

for (const item of imported) {
  const kb = Math.round(fs.statSync(item.dest).size / 1024);
  console.log(`OK  ${item.category}/${item.slug}.webp  ${kb}KB  (${item.note})`);
}
for (const item of skipped) {
  console.log(`SKIP ${item.file}  (${item.reason})`);
}
console.log(`\nImported: ${imported.length}, skipped: ${skipped.length}`);
