// Data-driven audit of the exercise library (Phase 3.11 polish).
// Strips TS-only syntax from lib/seed-exercises.ts, imports the data, and
// reports counts, image coverage, duplicates, and broken imagePath refs.
// Usage: node scripts/audit-exercises.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const src = fs.readFileSync(path.join(root, "lib/seed-exercises.ts"), "utf8");

// Strip TS-only constructs so Node can import the data as plain JS.
const js = src
  .replace(/^import type .*$/m, "")
  .replace(/export const (\w+): [^=]+=/g, "export const $1 =")
  .replace(/export function getExerciseById[\s\S]*$/m, ""); // drop typed helpers

const tmp = path.join(root, "scripts", ".seed-exercises.audit.mjs");
fs.writeFileSync(tmp, js);
const { SEED_EXERCISES, MUSCLE_GROUP_LABELS } = await import(
  pathToFileURL(tmp).href + `?t=${fs.statSync(tmp).mtimeMs}`
);
fs.unlinkSync(tmp);

const ex = SEED_EXERCISES;
const line = (s = "") => console.log(s);

line(`TOTAL EXERCISES: ${ex.length}`);
line();

// Per muscle group (primary).
const byGroup = {};
for (const e of ex) byGroup[e.muscleGroup] = (byGroup[e.muscleGroup] || 0) + 1;
line("PER MUSCLE GROUP (primary):");
for (const [g, n] of Object.entries(byGroup).sort((a, b) => b[1] - a[1])) {
  line(`  ${g.padEnd(10)} ${MUSCLE_GROUP_LABELS[g] || "?"}  -> ${n}`);
}
line();

// Image coverage.
const withImg = ex.filter((e) => e.imagePath);
const noImg = ex.filter((e) => !e.imagePath);
line(`WITH imagePath: ${withImg.length}`);
line(`WITHOUT imagePath (fallback): ${noImg.length}`);
if (noImg.length) {
  for (const e of noImg) line(`  - ${e.id} (${e.muscleGroup})`);
}
line();

// Duplicate ids.
const idCounts = {};
for (const e of ex) idCounts[e.id] = (idCounts[e.id] || 0) + 1;
const dupIds = Object.entries(idCounts).filter(([, n]) => n > 1);
line(`DUPLICATE ids: ${dupIds.length ? dupIds.map(([k, n]) => `${k}(${n})`).join(", ") : "none"}`);

// Duplicate imageKeys.
const keyCounts = {};
for (const e of ex) keyCounts[e.imageKey] = (keyCounts[e.imageKey] || 0) + 1;
const dupKeys = Object.entries(keyCounts).filter(([, n]) => n > 1);
line(`DUPLICATE imageKeys: ${dupKeys.length ? dupKeys.map(([k, n]) => `${k}(${n})`).join(", ") : "none"}`);

// Duplicate Hebrew / English names.
const heCounts = {};
const enCounts = {};
for (const e of ex) {
  heCounts[e.nameHe] = (heCounts[e.nameHe] || 0) + 1;
  enCounts[e.nameEn] = (enCounts[e.nameEn] || 0) + 1;
}
const dupHe = Object.entries(heCounts).filter(([, n]) => n > 1);
const dupEn = Object.entries(enCounts).filter(([, n]) => n > 1);
line(`DUPLICATE Hebrew names: ${dupHe.length ? dupHe.map(([k, n]) => `${k}(${n})`).join(", ") : "none"}`);
line(`DUPLICATE English names: ${dupEn.length ? dupEn.map(([k, n]) => `${k}(${n})`).join(", ") : "none"}`);
line();

// imagePath integrity: file exists on disk + path convention.
let missingFiles = 0;
let convMismatch = 0;
for (const e of withImg) {
  const rel = e.imagePath.replace(/^\//, "");
  const abs = path.join(root, "public", rel);
  if (!fs.existsSync(abs)) {
    missingFiles++;
    line(`  MISSING FILE: ${e.id} -> ${e.imagePath}`);
  }
  const expected = `/exercises/${e.muscleGroup}/${e.imageKey}.webp`;
  if (e.imagePath !== expected) {
    convMismatch++;
    line(`  CONVENTION MISMATCH: ${e.id} has ${e.imagePath}, expected ${expected}`);
  }
}
line(`IMAGE FILES MISSING ON DISK: ${missingFiles}`);
line(`PATH CONVENTION MISMATCHES: ${convMismatch}`);
line();

// Orphan image files on disk not referenced by any exercise.
const referenced = new Set(withImg.map((e) => e.imagePath.replace(/^\//, "")));
const exDir = path.join(root, "public", "exercises");
const orphans = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(webp|png|jpg|jpeg)$/i.test(name)) {
      const rel = path.relative(path.join(root, "public"), p).replace(/\\/g, "/");
      if (!referenced.has(rel)) orphans.push(rel);
    }
  }
}
walk(exDir);
line(`ORPHAN IMAGE FILES (on disk, unreferenced): ${orphans.length}`);
for (const o of orphans) line(`  - ${o}`);

line();
line("CATEGORY CHIP COUNTS (label + count, UI order):");
const order = [...new Set(ex.map((e) => e.muscleGroup))];
for (const g of order) line(`  ${MUSCLE_GROUP_LABELS[g]} ${byGroup[g]}`);
