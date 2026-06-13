// QA for exercise demonstration video links (Phase 3.22).
// Static, dependency-free validator: strips TS-only syntax from
// lib/seed-exercises.ts, imports the data, and asserts every `exercise.video`
// is well-formed and sourced from an approved channel. Exercises without a
// verified video must simply omit the field (no placeholders, no `video: null`).
// Usage: node scripts/qa-exercise-videos.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const src = fs.readFileSync(path.join(root, "lib/seed-exercises.ts"), "utf8");

const js = src
  .replace(/^import type .*$/m, "")
  .replace(/export const (\w+): [^=]+=/g, "export const $1 =")
  .replace(/export function getExerciseById[\s\S]*$/m, "");

const tmp = path.join(root, "scripts", ".seed-exercises.videos.mjs");
fs.writeFileSync(tmp, js);
const { SEED_EXERCISES } = await import(
  pathToFileURL(tmp).href + `?t=${fs.statSync(tmp).mtimeMs}`
);
fs.unlinkSync(tmp);

// Source policy (see docs/EXERCISE_VIDEO_LINKS.md).
const PRIMARY_CHANNEL = "ScottHermanFitness";
const FALLBACK_CHANNELS = [
  "Renaissance Periodization",
  "Jeff Nippard",
  "Muscle & Strength",
];
const ALL_CHANNELS = [PRIMARY_CHANNEL, ...FALLBACK_CHANNELS];
const WATCH_RE = /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

let failures = 0;
let warnings = 0;
const fail = (msg) => {
  console.log(`FAIL  ${msg}`);
  failures++;
};
const warn = (msg) => {
  console.log(`WARN  ${msg}`);
  warnings++;
};

const ex = SEED_EXERCISES;
const withVideo = ex.filter((e) => e.video !== undefined);
const seenUrls = new Map();

for (const e of ex) {
  // No placeholders: the field is either a valid object or absent.
  if ("video" in e && e.video == null) {
    fail(`${e.id}: has \`video\` set to null/undefined (use no field instead)`);
    continue;
  }
  if (!e.video) continue;
  const v = e.video;
  const where = `${e.id}.video`;

  if (v.provider !== "youtube") fail(`${where}.provider must be "youtube" (got ${JSON.stringify(v.provider)})`);
  if (typeof v.url !== "string" || !WATCH_RE.test(v.url))
    fail(`${where}.url is not a valid YouTube watch URL: ${JSON.stringify(v.url)}`);
  if (typeof v.title !== "string" || v.title.trim() === "") fail(`${where}.title is missing/empty`);
  if (typeof v.channelName !== "string" || v.channelName.trim() === "") fail(`${where}.channelName is missing/empty`);
  else if (!ALL_CHANNELS.includes(v.channelName)) fail(`${where}.channelName "${v.channelName}" is not in the approved source list`);
  if (v.source !== "primary" && v.source !== "fallback") fail(`${where}.source must be "primary" | "fallback" (got ${JSON.stringify(v.source)})`);
  // Channel/source consistency.
  if (v.source === "primary" && v.channelName !== PRIMARY_CHANNEL)
    fail(`${where}: source "primary" requires channel "${PRIMARY_CHANNEL}" (got "${v.channelName}")`);
  if (v.source === "fallback" && !FALLBACK_CHANNELS.includes(v.channelName))
    fail(`${where}: source "fallback" requires an approved fallback channel (got "${v.channelName}")`);
  if (!["en", "he", "other"].includes(v.language)) fail(`${where}.language must be en|he|other (got ${JSON.stringify(v.language)})`);
  if (typeof v.verifiedAt !== "string" || !DATE_RE.test(v.verifiedAt)) fail(`${where}.verifiedAt must be YYYY-MM-DD (got ${JSON.stringify(v.verifiedAt)})`);

  if (v.url) {
    const prev = seenUrls.get(v.url);
    if (prev) warn(`duplicate URL: ${e.id} and ${prev} share ${v.url} (acceptable only if one video genuinely covers both movements)`);
    else seenUrls.set(v.url, e.id);
  }
}

// Summary.
const primary = withVideo.filter((e) => e.video.source === "primary").length;
const fallback = withVideo.filter((e) => e.video.source === "fallback").length;
console.log("");
console.log("SUMMARY");
console.log(`  total exercises:    ${ex.length}`);
console.log(`  with video:         ${withVideo.length}`);
console.log(`  without video:      ${ex.length - withVideo.length}`);
console.log(`  primary source:     ${primary} (${PRIMARY_CHANNEL})`);
console.log(`  fallback source:    ${fallback} (${FALLBACK_CHANNELS.join(", ")})`);
console.log(`  unique video URLs:  ${seenUrls.size}`);
console.log("");
console.log(`${failures === 0 ? "PASS" : "FAIL"}  video data integrity  (${failures} failures, ${warnings} warnings)`);

process.exit(failures === 0 ? 0 : 1);
