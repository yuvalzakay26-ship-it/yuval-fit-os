# Exercise media import (chest + back + legs + shoulders)

Phase 3.4 imported the real chest/back exercise images into the production
asset structure and wired them into the exercise library. Phase 3.6 extended
the same pipeline to the legs and shoulders folders (see the dedicated section
at the end of this file).

## Source

Raw images live in `public/training exercises/` (kept untouched as the
source of truth for originals):

- `public/training exercises/Chest exercises/` — 20 PNG images
- `public/training exercises/back exercises/` — 20 PNG images

All sources are 1122×1402 PNG, ~1.3–1.7 MB each (~60 MB total) — too heavy to
serve to a mobile PWA, so they are converted on import (see below).

The source folder is **gitignored** (it would otherwise be committed and
publicly served from `public/` on Vercel at ~60 MB). It stays on disk as the
local originals; only the optimized `public/exercises/` copies are committed.

## Destination structure

```
public/exercises/<muscle-group>/<imageKey>.webp
```

- `public/exercises/chest/` — 20 images
- `public/exercises/back/` — 19 images
- `public/exercises/glutes/` — 1 image (`romanian-deadlift.webp`; the source
  file sits in the back folder, but the exercise's primary `muscleGroup` is
  `glutes`, and the folder convention follows the muscle group — see
  `public/exercises/README.md`)

## Naming rules

- English only, lowercase, kebab-case; no spaces, Hebrew, or special
  characters. Example: `Incline Dumbbell Press.png` → `incline-dumbbell-press.webp`.
- The file name must equal the exercise's `imageKey` in
  `lib/seed-exercises.ts` (which matches its `id`).
- Two sources were renamed to match existing exercise ids:
  - `Pull Up.png` → `pull-ups.webp` (existing id `pull-ups`)
  - `Barbell Row.png` → `bent-over-row.webp` (existing id `bent-over-row` —
    same exercise)

## Format handling

- Accepted source formats: `png`, `jpg`/`jpeg`, `webp`.
- PNG/JPG are converted to WebP (quality 80) with `sharp` (already present as
  a Next.js dependency). This cut the asset set from ~60 MB to ~4 MB
  (~90–120 KB per image) with no visible quality loss at app sizes.
- Unsupported formats (HEIC/BMP/TIFF/AVIF…) are skipped and reported, never
  fatal. This import had none — all 40 files imported, 0 skipped, 0 converted
  formats other than PNG→WebP.

## How to add more images later

1. Drop the new image(s) into a category folder under
   `public/training exercises/` (or add a new category and map it in the
   script's `CATEGORIES`).
2. Run `node scripts/import-exercise-images.mjs`. It normalizes names,
   converts to WebP, and writes to `public/exercises/<group>/`. Re-running is
   idempotent (existing outputs are overwritten).
   - If a file name should map to a different existing exercise id, add an
     entry to `SLUG_OVERRIDES`.
   - If an exercise's primary muscle group differs from its source folder,
     add an entry to `DEST_OVERRIDES`.
3. Wire the exercise in `lib/seed-exercises.ts`: set
   `imagePath: "/exercises/<group>/<imageKey>.webp"` on the matching entry,
   or add a new entry for a new exercise.

## Imported images

Chest (20): bench-press, cable-chest-fly, chest-fly, decline-bench-press,
decline-push-up, dips-chest-focus, dumbbell-bench-press, dumbbell-pullover,
high-cable-fly, incline-bench-press, incline-dumbbell-fly,
incline-dumbbell-press, incline-push-up, landmine-chest-press, low-cable-fly,
machine-chest-press, pec-deck-fly, push-up, smith-machine-bench-press,
svend-press.

Back (19): bent-over-row, chest-supported-row, chin-up,
close-grip-lat-pulldown, face-pull, landmine-row, lat-pulldown,
neutral-grip-pull-up, pull-ups, rack-pull, reverse-grip-barbell-row,
reverse-grip-lat-pulldown, seated-cable-row, single-arm-dumbbell-row,
single-arm-lat-pulldown, straight-arm-pulldown, t-bar-row,
wide-grip-lat-pulldown, wide-grip-seated-row.

Glutes (1): romanian-deadlift.

Skipped: none.

## Wiring result

- 7 existing exercises received `imagePath`: lat-pulldown, pull-ups,
  bent-over-row, landmine-row, romanian-deadlift, rack-pull, bench-press.
- 33 new exercises were added (14 back, 19 chest) with Hebrew names, inferred
  equipment/difficulty, and short conservative form instructions. Entries
  with non-obvious equipment carry a review note (e.g. `svend-press` is
  usually done with a weight plate, which isn't in the `Equipment` enum).
- Exercises without an image (shoulder-press, squat, biceps-curl,
  triceps-pushdown, plank) still render the gradient placeholder.

## Fallback behavior

`components/exercises/ExerciseImage.tsx` renders the real image only when
`imagePath` is set; if it's missing or the file 404s at runtime, it falls back
to the gradient `ExercisePlaceholder`. Images render with `object-cover`
inside fixed-aspect containers (72px card thumbnail, 16:10 expanded image),
so portrait sources crop without stretching.

---

# Phase 3.6 — legs + shoulders import

Phase 3.6 imported the legs and shoulders folders through the same
`scripts/import-exercise-images.mjs` pipeline (PNG → WebP q80 via `sharp`).
No app, theme, backend, auth, AI, native, video, or chart work was involved —
this was purely an asset import plus seed-data wiring.

## Source folders inspected

Raw images live in `public/training exercises/` (gitignored, kept untouched):

- `public/training exercises/leg exercises/` — 20 PNG images
- `public/training exercises/Shoulder exercises/` — 20 PNG images

All sources are 1122×1402 PNG, ~1.4–1.8 MB each. File extensions: `.png` only.
No unsupported formats, no Hebrew/special-character names, no zero-byte or
corrupt files. Two names collide with images already imported in Phase 3.4
(see "Skipped" below).

## Categories found

- **legs** — squats, lunges, leg press/extension/curl, calf raises, wall sit.
- **glutes** — three clear glute-isolation movements that ship in the leg
  folder but whose primary `muscleGroup` is `glutes` (cable kickback, glute
  bridge, hip thrust). Per the folder convention (muscle group wins over
  source folder, see `public/exercises/README.md`), these land in
  `public/exercises/glutes/` via `DEST_OVERRIDES` — joining the existing
  `romanian-deadlift.webp`. No new folder was needed; `glutes/` already existed.
- **shoulders** — overhead presses, lateral/front/rear raises, shrugs,
  upright row, pike push-up.

## Destination folders

- `public/exercises/legs/` — 16 images (created this phase)
- `public/exercises/shoulders/` — 19 images (created this phase)
- `public/exercises/glutes/` — +3 images (now 4 total)

## Imported images

Legs (16): squat, bulgarian-split-squat, dumbbell-goblet-squat, hack-squat,
leg-curl-machine, leg-extension, leg-press, reverse-lunges, seated-calf-raise,
seated-leg-curl, smith-machine-squat, standing-calf-raise, step-up, sumo-squat,
walking-lunges, wall-sit.

Glutes (+3): cable-kickback, glute-bridge, hip-thrust.

Shoulders (19): arnold-press, barbell-overhead-press, barbell-shrug,
bent-over-lateral-raise, cable-lateral-raise, cable-rear-delt-fly,
dumbbell-lateral-raise, dumbbell-shrug, front-raise, landmine-shoulder-press,
machine-lateral-raise, machine-shoulder-press, pike-push-up, plate-front-raise,
rear-delt-fly, reverse-pec-deck-fly, shoulder-press, smith-machine-shoulder-press,
upright-row.

Total imported this phase: 38 images (0 unsupported, 0 conversion errors).

## Skipped files and why

- `leg exercises/Romanian Deadlift.png` — duplicate. `romanian-deadlift` was
  already imported from the back folder in Phase 3.4 and seeded under
  `glutes/`. Skipped to avoid overwriting the existing asset.
- `Shoulder exercises/Face Pull.png` — duplicate. `face-pull` was already
  imported from the back folder and is seeded with `muscleGroup: "back"`.
  Skipped to keep a single canonical image.

Both skips are handled by the `SKIP` set in
`scripts/import-exercise-images.mjs` (keyed by `<sourceGroup>/<rawSlug>`).

## Special mapping decisions

- `Barbell Squat.png` → `squat.webp` via `SLUG_OVERRIDES` — wired onto the
  existing `squat` seed exercise (barbell, legs) rather than creating a
  duplicate.
- `Seated Dumbbell Shoulder Press.png` → `shoulder-press.webp` via
  `SLUG_OVERRIDES` — wired onto the existing `shoulder-press` seed exercise
  (dumbbell, shoulders). A note on that entry records that the image depicts a
  seated dumbbell press.
- `plate-front-raise` is performed with a weight plate, which isn't in the
  `Equipment` enum; it's marked `dumbbell` with a review note (same convention
  as `svend-press` from Phase 3.4).
- Calf raises, leg curls, and leg extensions use the `legs` group (the app has
  no separate quads/hamstrings/calves groups).

## Wiring result

- 2 existing exercises received `imagePath`: `squat`
  (`/exercises/legs/squat.webp`) and `shoulder-press`
  (`/exercises/shoulders/shoulder-press.webp`).
- 36 new exercises were added to `lib/seed-exercises.ts`: 15 legs, 3 glutes,
  18 shoulders — each with a Hebrew name, inferred equipment/difficulty, short
  conservative form instructions, and `imagePath`.
- Exercises still using the gradient placeholder (no image): `biceps-curl`,
  `triceps-pushdown`, `plank`.

## Validation

`npm run lint` clean; `npm run build` succeeds. The QA harnesses
(`scripts/qa-exercises.mjs`, `scripts/qa-image-viewer.mjs`) were updated to
pre-seed the Phase 3.5 access flag (`yfos:access-granted:v1 = "1"`) and to use
biceps (`יד קדמית`) — not legs — as the placeholder-only group, since legs now
has real images. Both passed in dark and light: 78 real `<img>` tags on "all",
16 legs / 19 shoulders / 20 chest per filter, 0 horizontal overflow, 0 console
errors, viewer open/close + fallback all green.
