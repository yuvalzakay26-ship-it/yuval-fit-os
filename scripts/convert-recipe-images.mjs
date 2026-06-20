// One-off: convert Yuval's recipe photos (public/מתכוני פרו, raw PNG source kept
// locally + gitignored) into optimized WebP under the stable ASCII production
// path public/recipes/protein-sweets/. Mirrors the food/exercise media pipeline.
// No PDF imagery is involved — these are standalone food photos Yuval provided.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC_DIR = path.join(process.cwd(), "public", "מתכוני פרו");
const OUT_DIR = path.join(process.cwd(), "public", "recipes", "protein-sweets");

// Source filename → recipe slug (matches lib/recipes.ts ids).
const MAP = {
  "Quick Chocolate Souffleסופלה מהיר —.png": "quick-souffle",
  "אוריאו דונטס — Oreo Donuts.png": "oreo-donuts",
  "ביסקוף לוטוס — Lotus Biscoff Dessert.png": "lotus-biscoff",
  "גלידת וניל פרו — Pro Vanilla Ice Cream.png": "vanilla-pro-icecream",
  "מוזלי פירות — Fruit Muesli Bowl.png": "fruit-muesli",
  "מילשייק m&m — M&M Milkshake.png": "mm-milkshake",
  "מילשייק סניקרס — Snickers Milkshake.png": "snickers-milkshake",
  "סינבון קינמון — Cinnamon Roll  Cinnabon.png": "cinnamon-cinnabon",
  "עוגת אוריאו — Oreo Cake.png": "oreo-cake",
  "עוגת בראוניז — Brownie Cake.png": "brownie-cake",
  "עוגת גבינה אוכמניות — Blueberry Cheesecake.png": "blueberry-cheesecake",
  "עוגת גזר — Carrot Cake.png": "carrot-cake",
  "פלאפי מאפינס — Fluffy Muffins.png": "fluffy-muffins",
  "פנקייק פרו — Pro Pancakes.png": "pancake-pro",
  "פנקייק פרו לייט+ — Pro Light+ Pancakes.png": "pancake-pro-light-plus",
};

await mkdir(OUT_DIR, { recursive: true });

for (const [file, slug] of Object.entries(MAP)) {
  const src = path.join(SRC_DIR, file);
  const out = path.join(OUT_DIR, `${slug}.webp`);
  const info = await sharp(src)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out);
  console.log(`${slug}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
}

console.log(`\nDone: ${Object.keys(MAP).length} images → ${OUT_DIR}`);
