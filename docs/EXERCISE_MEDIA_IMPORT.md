# Exercise media import (chest + back + legs + shoulders + biceps + triceps + core)

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

# Phase 3.8 — biceps import

## Source folder inspected

- Path: `public/training exercises/Bicep training/`
- Folder name on disk: `Bicep training`
- Images found: **45**, all `.png` (no jpg/jpeg/webp, no unsupported formats).
- The raw source folder is gitignored (`/public/training exercises/` in
  `.gitignore`) and was left completely untouched.

Of the 45 PNGs:

- **20** have clear, English exercise-name file names (e.g. `Hammer Curl.png`,
  `Preacher Curl.png`).
- **25** are unlabeled generative exports named
  `ChatGPT Image Jun 12, 2026, HH_MM_SS PM (n).png`. By MD5 hash, **5** of these
  are byte-for-byte duplicates of named files (`Cable Curl`, `Cable Rope Hammer
  Curl`, `Machine Preacher Curl`, `High Cable Curl`, `Single Arm Cable Curl`);
  the other **20** are unique images with no identifiable exercise label.

No oversized files (all 1.3–2.3 MB PNGs), no Hebrew names, no other suspicious
names beyond the generative exports above.

## Destination folder

- Created: `public/exercises/biceps/` (muscle-group key `biceps`, matching
  `MuscleGroup` and `MUSCLE_GROUP_LABELS.biceps = "יד קדמית"`).
- 20 named PNGs converted to WebP q80 via the existing sharp pipeline in
  `scripts/import-exercise-images.mjs` (extended with a `"Bicep training":
  "biceps"` category). Output sizes 89–121 KB each.

## Imported images

Biceps (20): alternating-dumbbell-curl, barbell-curl, bayesian-cable-curl,
cable-curl, cable-rope-hammer-curl, chin-up-biceps-focus, concentration-curl,
cross-body-hammer-curl, biceps-curl (from `Dumbbell Curl.png`, see mapping),
ez-bar-curl, hammer-curl, high-cable-curl, incline-dumbbell-curl,
machine-preacher-curl, preacher-curl, reverse-curl, seated-dumbbell-curl,
single-arm-cable-curl, spider-curl, zottman-curl.

Total imported this phase: 20 images (0 unsupported, 0 conversion errors).

## Skipped files and why

- All **25** `ChatGPT Image …(n).png` files were skipped: 5 are exact
  duplicates of named images and 20 are unlabeled with no clear exercise name,
  so importing them would mean inventing exercise identities. Handled by the
  `UNCLEAR_NAME` (`/^chatgpt-image/`) guard in
  `scripts/import-exercise-images.mjs`.
- The importer also added a `SKIP_EXISTING` guard so re-running to import a new
  muscle group never rewrites previously-committed images — every chest / back /
  legs / glutes / shoulders file logged `already imported` and was untouched.

## Special mapping decisions

- `Dumbbell Curl.png` → `biceps-curl.webp` via `SLUG_OVERRIDES`
  (`"dumbbell-curl": "biceps-curl"`). The existing fallback seed exercise
  `biceps-curl` is a dumbbell biceps curl (`nameEn: "Biceps Curl"`, equipment
  `dumbbell`), so the dumbbell-curl image is the exact correct asset for it. No
  separate `dumbbell-curl` exercise was created — it would duplicate
  `biceps-curl`.
- Hammer/reverse/zottman curls also train the forearm/brachialis, but the app
  has no `forearms` muscle group, so `secondaryMuscles` is left empty for those
  rather than mislabeling.
- `chin-up-biceps-focus` is the only new entry with a secondary muscle
  (`["back"]`), since the chin-up is a compound pull.

## Wiring result

- 1 existing exercise received `imagePath`: `biceps-curl`
  (`/exercises/biceps/biceps-curl.webp`).
- 19 new biceps exercises were added to `lib/seed-exercises.ts`, each with a
  Hebrew name, inferred equipment/difficulty, short conservative form
  instructions, a note, and `imagePath`.
- Exercises still using the gradient placeholder (no image): `triceps-pushdown`
  (triceps), `plank` (core). Biceps is now fully covered.

## Validation

`npm run lint` clean; `npm run build` succeeds. The QA harnesses were updated:
the placeholder-only group used for fallback assertions moved from biceps
(`יד קדמית`) to triceps (`יד אחורית`), since biceps now has real images, and
`qa-exercises.mjs` gained a biceps coverage + expand check. Both passed in dark
and light: 98 real `<img>` tags on "all", 20 chest / 16 legs / 19 shoulders /
**20 biceps** per filter, triceps fallback = 0 real images (placeholder), 0
horizontal overflow, 0 console errors; image-viewer harness all-green
(object-contain, open/close via X/backdrop/Escape, body scroll restored, no
viewer affordance on placeholder-only exercises).

# Phase 3.9 — triceps import

## Source folder inspected

- Path: `public/training exercises/Triceps training/`
- Folder name on disk: `Triceps training`
- Images found: **20**, all `.png` (no jpg/jpeg/webp, no unsupported formats).
- File sizes 1.4–1.6 MB each (1122×1402 PNG) — none oversized.
- No Hebrew names, no special characters, **no `ChatGPT Image …` / generic /
  timestamp exports** — every file carries a clear English exercise name.
- No duplicate or suspicious names within the folder. One file name
  (`Cable Kickback.png`) collides with a name already used by the legs/glutes
  import — handled via a group-scoped slug override (see mapping below).
- The raw source folder is gitignored (`/public/training exercises/` in
  `.gitignore`) and was left completely untouched.

## Destination folder

- Created: `public/exercises/triceps/` (muscle-group key `triceps`, matching
  `MuscleGroup` and `MUSCLE_GROUP_LABELS.triceps = "יד אחורית"`).
- All 20 PNGs converted to WebP q80 via the existing sharp pipeline in
  `scripts/import-exercise-images.mjs` (extended with a `"Triceps training":
  "triceps"` category). Output sizes 95–122 KB each.

## Imported images

Triceps (20): bench-dips, cable-triceps-kickback (from `Cable Kickback.png`,
see mapping), close-grip-bench-press, close-grip-push-up, diamond-push-up,
dip-machine, dumbbell-kickback, dumbbell-lying-triceps-extension,
ez-bar-lying-triceps-extension, machine-triceps-extension,
overhead-cable-triceps-extension, parallel-bar-dips-triceps-focus,
reverse-grip-triceps-pushdown, rope-overhead-triceps-extension,
rope-triceps-pushdown, seated-overhead-dumbbell-extension,
single-arm-cable-pushdown, skull-crushers, standing-overhead-dumbbell-extension,
triceps-pushdown (from `Cable Triceps Pushdown.png`, see mapping).

Total imported this phase: 20 images (0 unsupported, 0 conversion errors, 0
skipped within the triceps folder). All prior chest / back / legs / glutes /
shoulders / biceps files logged `already imported` and were untouched
(`SKIP_EXISTING`).

## Skipped files and why

None from the triceps folder — all 20 images had clear exercise names and
imported cleanly.

## Special mapping decisions

- `Cable Triceps Pushdown.png` → `triceps-pushdown.webp` via `SLUG_OVERRIDES`
  (`"cable-triceps-pushdown": "triceps-pushdown"`). The existing fallback seed
  exercise `triceps-pushdown` is a cable pushdown (`equipment: "cable"`), so
  this image is the exact correct asset for it. No separate
  `cable-triceps-pushdown` exercise was created — it would duplicate
  `triceps-pushdown`.
- `Cable Kickback.png` → `cable-triceps-kickback.webp` via a **group-scoped**
  override (`"triceps/cable-kickback": "cable-triceps-kickback"`). The legs
  folder already shipped a `Cable Kickback.png` that seeds the glute-isolation
  `cable-kickback` under `glutes/`; this triceps version is a distinct movement,
  so it gets its own slug/id to avoid colliding with the glutes asset. The slug
  override map was extended to accept `"<group>/<rawSlug>"` keys for exactly
  this disambiguation.
- `Skull Crushers.png` and `EZ Bar Lying Triceps Extension.png` are kept as two
  separate entries (`skull-crushers` and `ez-bar-lying-triceps-extension`)
  because both clearly-named source images exist; they are near-synonyms but the
  filenames are explicit, so neither identity was invented.
- Push-up / dip variants (`close-grip-bench-press`, `close-grip-push-up`,
  `diamond-push-up`, `bench-dips`, `dip-machine`,
  `parallel-bar-dips-triceps-focus`) carry `secondaryMuscles: ["chest",
  "shoulders"]` since they are compound pressing movements; all isolation
  extensions/pushdowns/kickbacks leave `secondaryMuscles` empty.

## Wiring result

- 1 existing exercise received `imagePath`: `triceps-pushdown`
  (`/exercises/triceps/triceps-pushdown.webp`).
- 19 new triceps exercises were added to `lib/seed-exercises.ts`, each with a
  Hebrew name, inferred equipment/difficulty, short conservative form
  instructions, a note, and `imagePath`.
- Exercises still using the gradient placeholder (no image): `plank` (core) is
  now the only seeded exercise without a real image. Triceps is fully covered.

## Validation

`npm run lint` clean; `npm run build` succeeds. The QA harnesses were updated:
the placeholder-only group used for fallback assertions moved from triceps
(`יד אחורית`) to core (`ליבה`), since triceps now has real images, and
`qa-exercises.mjs` gained a triceps coverage + expand check.

# Phase 3.10 — abs / core import

Phase 3.10 imported the abs/core folder through the same one-shot pipeline and
wired the images into the exercise library. This phase also retires the **last**
seeded fallback exercise: `plank` now has a real image, so every exercise in
`lib/seed-exercises.ts` carries an `imagePath`.

## Source folder inspected

- Path: `public/training exercises/Abs training/`
- Folder name on disk: `Abs training`
- Images found: **15**, all `.png` (no jpg/jpeg/webp, no unsupported formats).
- File sizes 1.2–1.6 MB each — none oversized.
- **No `ChatGPT Image …` / generic / timestamp exports** — every file carries a
  clear exercise name.
- 14 files have clear English names; **1 file is Hebrew-named**
  (`— כפיפות בטן בכבל.png` = "ab crunch on cable" = Cable Crunch). It is
  cleanly mappable, so it was imported (see mapping) rather than skipped.
- No duplicate or suspicious names within the folder.
- The raw source folder is gitignored (`/public/training exercises/` in
  `.gitignore`) and was left completely untouched.

## Destination folder

- Used existing key `core` (matching `MuscleGroup` and
  `MUSCLE_GROUP_LABELS.core = "ליבה"`); created `public/exercises/core/`. No new
  muscle-group key was introduced — abs maps to the existing `core` group.
- All 15 PNGs converted to WebP q80 via the sharp pipeline in
  `scripts/import-exercise-images.mjs` (extended with an `"Abs training":
  "core"` category). Output sizes 87–120 KB each.

## Imported images

Core (15): bicycle-crunch, cable-crunch (from the Hebrew `— כפיפות בטן בכבל.png`,
see mapping), captain-chair-knee-raise, crunch, decline-bench-crunch,
hanging-leg-raise, knee-raise, leg-raise, machine-ab-crunch, mountain-climbers,
plank, reverse-crunch, russian-twist, side-plank, sit-up.

Total imported this phase: 15 images (0 unsupported, 0 conversion errors, 0
skipped within the Abs folder). All prior chest / back / legs / glutes /
shoulders / biceps / triceps files logged `already imported` and were untouched
(`SKIP_EXISTING`).

## Skipped files and why

None from the Abs folder — all 15 images mapped cleanly to a known exercise.

## Special mapping decisions

- `— כפיפות בטן בכבל.png` → `cable-crunch.webp`. The base name is Hebrew, so
  `slugify()` produces an empty string. A new `RAW_BASENAME_SLUGS` map in the
  importer maps this exact base name to the stable English slug `cable-crunch`
  ("ab crunch on cable" = Cable Crunch). The importer now also safely skips any
  file whose slug resolves to empty (logged as
  `non-English/unmappable filename`) instead of writing a `.webp`.
- `Plank.png` → wired to the existing seed exercise `plank` (no new exercise
  created). The remaining 14 files became new core exercises.
- Knee/leg-raise family kept as distinct entries because each clearly-named
  source image exists: `knee-raise` (hanging knee raise, bodyweight),
  `captain-chair-knee-raise` (machine station), `leg-raise` (lying),
  `hanging-leg-raise` (advanced, straight-leg). No identities were invented.
- Equipment inferred only when obvious from the name: `machine` for
  `machine-ab-crunch` and `captain-chair-knee-raise`, `cable` for `cable-crunch`;
  everything else is `bodyweight`. Difficulty kept conservative.
- `mountain-climbers` carries `secondaryMuscles: ["shoulders", "legs"]` and
  `side-plank` / `plank` carry `["shoulders"]`; the rest leave `secondaryMuscles`
  empty.

## Wiring result

- 1 existing exercise received `imagePath`: `plank`
  (`/exercises/core/plank.webp`).
- 14 new core exercises were added to `lib/seed-exercises.ts`, each with a
  Hebrew name, inferred equipment/difficulty, short conservative form
  instructions, a note where helpful, and `imagePath`: side-plank, crunch,
  reverse-crunch, bicycle-crunch, sit-up, leg-raise, hanging-leg-raise,
  knee-raise, captain-chair-knee-raise, mountain-climbers, russian-twist,
  decline-bench-crunch, machine-ab-crunch, cable-crunch.
- **No seeded exercise uses the gradient placeholder anymore** — all 133
  exercises in `lib/seed-exercises.ts` now have a real `imagePath`. The
  placeholder fallback path in the UI is retained as defensive behavior for any
  future image-less exercise, but no seed data triggers it.

## Validation

`npm run lint` clean; `npm run build` succeeds (17 static pages). QA on a
`next start -p 3199` prod server with the access flag pre-seeded:

- `qa-exercises.mjs`: 0 horizontal overflow (dark + light); core filter shows
  **15** real images; core expand renders the large image. A `core-expanded`
  check replaced the old "core has no images" fallback assertion.
- `qa-image-viewer.mjs`: all viewer checks pass; the old "no viewer on
  placeholder exercises" assertion (which relied on core being image-less)
  became a positive "core exercises offer the viewer" check, since no seeded
  placeholder exercise remains.
- `qa/access-check.mjs`: all pass — gate accepts `yuvalzakay123`, rejects the
  retired `yuval`, persists/locks correctly.
- `qa/food-library-check.mjs`: passes (0 issues) — food library untouched.
- Workout builder: core exercises (e.g. `plank`, `cable-crunch`,
  `russian-twist`) appear in the picker, a workout builds + saves to history, 0
  overflow, no console errors.

No backend / auth / AI / native / video / chart / theme / food-library /
access-code changes were made.

# Phase 3.11 — exercise library final polish

A QA + polish pass after all exercise image imports were complete. **No images
were imported in this phase** and no new exercises were added — it audits the
finished library, adds a small data-driven UI touch, fixes one Hebrew naming
inconsistency, and hardens the QA harnesses now that coverage is 100%.

## Precondition

Phase 3.10 (abs/core) was confirmed complete, validated, committed, and pushed
before starting: commit `619a5b8` ("feat: import core exercise images") was the
tip of both local `main` and `origin/main`, and all 15 core images exist on
disk and are wired.

## Final coverage (data-driven audit)

`node scripts/audit-exercises.mjs` parses `lib/seed-exercises.ts` and reports:

- **Total exercises: 133**
- Per primary muscle group: chest 20, biceps (יד קדמית) 20, triceps (יד אחורית)
  20, back (גב) 19, shoulders (כתפיים) 19, legs (רגליים) 16, core (ליבה) 15,
  glutes (עכוז) 4.
- **Image coverage: 133 / 133 (100%)** — **0 fallbacks remaining**.
- 0 duplicate ids, 0 duplicate imageKeys, 0 duplicate Hebrew/English names.
- 0 imagePaths missing on disk, 0 path-convention mismatches, 0 orphan image
  files in `public/exercises/`.

The only "odd" category count is **glutes (4)** — expected: glutes was always a
small satellite group seeded alongside legs (Phase 3.6), not a dedicated import.

## Polish changes

- **Category chip counts** (`components/exercises/ExerciseLibrary.tsx`): each
  filter chip now shows its exercise count (e.g. `חזה 20`, `הכל 133`), derived
  from `SEED_EXERCISES` at module load — **never hardcoded**. The count `<span>`
  is `aria-hidden` so the button's accessible name stays the plain category
  label (e.g. `גב`), which keeps screen-reader output clean and existing
  role-based selectors working.
- **Hebrew consistency** (`lib/seed-exercises.ts`): `cable-crunch` `nameHe` was
  the only cable exercise using "בכבל"; changed to "כפיפות בטן בפולי" to match
  the other 54 cable references (its own instructions already said "פולי").

No other UI changes were needed — the image viewer (safe-area insets,
object-contain, 40px close target, X/backdrop/Escape close, scroll lock), card
density, truncation, and placeholder fallback were already in good shape.

## Fallback cleanup

No seeded fallback exercises remain (coverage is 100%). The QA harnesses no
longer assume any specific placeholder-only group. The `ExercisePlaceholder`
component and the `ExerciseImage` fallback path are intentionally retained as
defensive behavior for any future image-less exercise.

## QA changes

- `scripts/qa-exercises.mjs` rewritten to be **data-driven**: instead of
  hardcoding per-group expectations, each view asserts `realImages === cardCount`
  and `placeholders === 0` (placeholders detected via the `[data-image-key]`
  attribute on `ExercisePlaceholder`). It iterates every muscle-group chip,
  tracks pass/fail, and exits non-zero on any failure or console error.
- Added `scripts/audit-exercises.mjs` — the standalone data audit above.

## Validation

`npm run lint` clean; `npm run build` succeeds (17 static pages, TypeScript
passes). QA on a `next start -p 3199` prod server with the access flag
pre-seeded:

- `qa-exercises.mjs`: all green dark + light — 133/133 real images on "all",
  every filter fully imaged (19 גב, 4 עכוז, 20 חזה, 19 כתפיים, 16 רגליים,
  20 יד קדמית, 20 יד אחורית, 15 ליבה), 0 placeholders, 0 overflow, 0 console
  errors.
- `qa-image-viewer.mjs`: all green dark + light (object-contain, open/close via
  X/backdrop/Escape, body scroll restored, core offers the viewer).
- `qa/access-check.mjs`: all pass — gate accepts `yuvalzakay123`, rejects the
  retired `yuval`, persists + locks correctly.
- `qa/food-library-check.mjs`: passes (0 issues) — food library untouched.
- Workout-builder smoke: full 133-exercise picker, selected exercises render
  real images, multi-set, 0 overflow, no console errors.

No backend / auth / AI / native / video / chart / theme / food-import /
access-code changes were made.
