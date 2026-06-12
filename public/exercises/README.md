# Exercise media

Drop real exercise images/SVGs/short videos here later, named by the
exercise `imageKey` (see `lib/seed-exercises.ts`), e.g. `lat-pulldown.jpg`.

Until then, `components/exercises/ExercisePlaceholder.tsx` renders a clean
gradient placeholder per muscle group. To switch to real media, swap that
component's body for an `<Image src={`/exercises/${imageKey}.jpg`} />`.

Use only owned or properly licensed media — no copyrighted internet images.
