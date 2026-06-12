# Exercise images

Real exercise images live here, organized by muscle group:

```
public/exercises/<muscle-group>/<imageKey>.png
```

Examples:

- `public/exercises/back/lat-pulldown.png`
- `public/exercises/back/pull-ups.png`
- `public/exercises/chest/bench-press.png`

## Naming rules

- `<muscle-group>` is the exercise's primary `muscleGroup` from
  `lib/fitness-types.ts`: `back`, `chest`, `shoulders`, `legs`, `glutes`,
  `biceps`, `triceps`, `core`.
- `<imageKey>` is the exercise's `imageKey` from `lib/seed-exercises.ts`
  (kebab-case, matches the exercise `id`).
- Prefer `.png` (or `.webp`/`.jpg`); landscape ~16:10, at least 832px wide
  (2x the 416px content width) so both the 72px card thumbnail and the large
  expanded image stay sharp.

## Wiring an image to an exercise

Adding the file alone is not enough — set `imagePath` on the exercise in
`lib/seed-exercises.ts`:

```ts
{
  id: "lat-pulldown",
  // ...
  imageKey: "lat-pulldown",
  imagePath: "/exercises/back/lat-pulldown.png",
}
```

Rendering is handled by `components/exercises/ExerciseImage.tsx`:

- `imagePath` set and file loads → real image (card thumbnail + larger image
  in the expanded card).
- `imagePath` missing, or the file fails to load → graceful fallback to the
  gradient `ExercisePlaceholder`. Nothing breaks.

Use only owned or properly licensed media — no copyrighted internet images.
