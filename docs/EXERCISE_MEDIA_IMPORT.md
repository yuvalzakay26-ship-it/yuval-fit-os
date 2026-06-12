# Exercise media import (chest + back)

Phase 3.4 imported the real chest/back exercise images into the production
asset structure and wired them into the exercise library.

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
