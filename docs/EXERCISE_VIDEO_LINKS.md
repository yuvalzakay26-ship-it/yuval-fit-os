# Exercise Video Links (Phase 3.22)

Yuval Fit OS links selected exercises to an external **YouTube demonstration
video**. This document explains why, the source policy, the data model, and the
safety boundaries. For the per-exercise breakdown see
[EXERCISE_VIDEO_LINKS_AUDIT.md](./EXERCISE_VIDEO_LINKS_AUDIT.md).

## Why

Static images and written instructions already cover every exercise. A short,
trustworthy "watch a demonstration" option helps users who learn a movement
better by seeing it performed. We keep this as **external links only** — no
embedding, no hosting, no player dependency.

## Source policy

To keep the app coherent and trustworthy, videos come from **one primary
channel** as much as possible, with a small set of approved fallbacks used only
when the primary channel has no clearly-matching video.

- **Primary:** **ScottHermanFitness** — his "How To:" tutorial series covers a
  large share of common gym movements with a consistent style.
- **Approved fallbacks (only when no good primary match exists):**
  - Renaissance Periodization
  - Jeff Nippard
  - Muscle & Strength

Rules applied while curating:

1. Try the primary source first; use a fallback only when no accurate primary
   match exists.
2. Don't mix creators unnecessarily; don't add a video just because it's "close."
3. If a video doesn't clearly match the exercise, the exercise is left without a
   video — **quality over coverage**.
4. Prefer stable normal `youtube.com/watch` URLs (no Shorts unless it is the
   only excellent match).
5. Every link is manually verified by title/movement match.

### How links were verified

Each candidate was discovered via a channel-scoped web search, then its watch
URL was fetched to confirm two things: the link resolves to a live video, and
the title describes the same movement as the exercise. All added links passed
both checks on the verification date recorded in the data (`verifiedAt`).

## Data model

`lib/fitness-types.ts` adds an optional `video` field to `Exercise`:

```ts
export interface ExerciseVideo {
  provider: "youtube";
  url: string;           // https://www.youtube.com/watch?v=...
  title: string;         // verbatim video title (accessible context)
  channelName: string;   // e.g. "ScottHermanFitness"
  source: "primary" | "fallback";
  language: "en" | "he" | "other";
  verifiedAt: string;    // YYYY-MM-DD
}

export interface Exercise {
  // ...existing fields
  video?: ExerciseVideo; // present ONLY on verified exercises
}
```

The field is **optional and absent** on exercises without a verified video —
there are no `null` placeholders. The legacy `videoUrl?: string` field is left
untouched for backward compatibility.

## How the video button works

`components/exercises/ExerciseVideoButton.tsx` renders a compact, premium pill:

- A play icon + the Hebrew label **"צפה בהדגמה"**.
- Opens the video in a new tab:
  `<a href target="_blank" rel="noopener noreferrer">` — never an iframe.
- Accessible label includes the video title, channel, and a "opens in a new
  tab" hint.
- Two variants: `default` (matches the card surface, light/dark aware) and
  `overlay` (for the dark fullscreen image viewer).

It appears in two places, and **only when the exercise has a verified video**:

- **Exercise Library** — inside the expanded exercise card detail.
- **Fullscreen image viewer** — in the top bar next to the close button.

Compact list rows are intentionally left uncluttered; the button shows only on
expanded/detail surfaces. Exercises without a video show no button and no
"coming soon" affordance.

## Safety boundaries

- Videos are third-party content for **general demonstration only**. The app
  does not provide medical, physical-therapy, or personalized training advice.
- Users should perform exercises according to their own ability and technique.
- Nothing is downloaded, hosted, embedded, or played inside the app — these are
  plain outbound links to YouTube.

## Coverage summary

| Metric | Count |
| --- | --- |
| Total exercises | 133 |
| With video | 102 |
| Without video | 31 |
| Primary source (ScottHermanFitness) | 98 |
| Fallback source | 4 |

Fallback breakdown: Muscle & Strength ×3, Jeff Nippard ×1.

## QA

`scripts/qa-exercise-videos.mjs` is a static, dependency-free validator that
asserts, for every `exercise.video`:

- `provider === "youtube"` and a valid `youtube.com/watch?v=` URL,
- non-empty `title` and `channelName`,
- `channelName` is within the approved source list,
- `source` is `primary`/`fallback` and is consistent with the channel,
- valid `language` and `verifiedAt` (YYYY-MM-DD),
- no `video: null` placeholders,
- duplicate URLs are flagged as warnings (one shared video is expected — see the
  audit note on `hanging-leg-raise`/`knee-raise`).

Run it with `node scripts/qa-exercise-videos.mjs`. The exercise-library and
image-viewer Playwright smokes (`scripts/qa-exercises.mjs`,
`scripts/qa-image-viewer.mjs`) confirm the button renders correctly and that the
viewer still opens/closes as expected.

## Future direction

- Increase coverage for the currently-skipped exercises as good primary-source
  videos are found.
- Optional per-exercise technique cues / notes alongside the video.
- If a single high-quality, consistent **Hebrew** demonstration source is found,
  add localized videos (the data model already carries a `language` field).
