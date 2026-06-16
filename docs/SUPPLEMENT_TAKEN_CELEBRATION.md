# Supplement Taken — Success Celebration

A short, app-wide success moment that plays when the user marks a supplement as
**taken today**. It mirrors the architecture of the
[water-goal celebration](WATER_GOAL_GLOBAL_CELEBRATION.md) but is a **distinct
moment with a distinct meaning**:

- **Water celebration** = reaching a daily *goal* (cross into 100%).
- **Supplement celebration** = confirming that a single supplement was *logged /
  taken* today.

It is purely UX feedback. It gives **no** medical advice, recommendation, dosage
guidance, or health claim.

## Files

- `lib/supplement-events.ts` — the event seam. Defines
  `SUPPLEMENT_TAKEN_EVENT = "yfos:supplement-taken"`, the
  `SupplementTakenDetail { supplementName }` payload, `emitSupplementTaken`, and
  `maybeCelebrateSupplementTaken({ wasTaken, isTaken, supplementName })` which
  fires **only** on the not-taken → taken edge.
- `components/supplements/SupplementTakenCelebrationOverlay.tsx` — the one-shot
  overlay. Mounted once in `components/layout/AppShell.tsx`. Listens for the
  event, shows the themed visuals + the success message, self-dismisses after
  ~1.3s. `pointer-events-none`, `aria-hidden` visuals + a separate
  `role="status"` announcement.
- `app/globals.css` — `supplement-celebrate-*` keyframes/classes and the
  `prefers-reduced-motion` fallback.
- Trigger: `lib/fitness-store.ts` → `toggleSupplementTaken` (the single mutation
  every surface already routes through).

## What triggers it

The celebration fires when a supplement transitions **from not-taken-today to
taken-today**, through the existing `toggleSupplementTaken` flow. Because the
trigger is centralized in the store mutation, it fires identically from every
surface:

- Today / home (`SupplementsCard` quick toggle)
- The Supplements screen (`SupplementsTracker`)
- Any supplement quick-action card that calls `toggleSupplementTaken`

## What does NOT trigger it

- Page render or hydration
- Loading existing logs (an already-taken supplement on load)
- Re-tapping an already-taken supplement without a real new taken transition
  (un-marking is taken → not-taken, so it never celebrates)
- Backup restore
- Settings changes

If the user un-marks today's supplement and then marks it as taken again, that is
a fresh not-taken → taken edge, so it **may** celebrate again. There is no
per-day "seen" flag — the toggle's own state is the anti-replay guard, so no new
persisted state was introduced.

## Visual theme

Deliberately **not** the blue water theme. A calm, premium supplement palette:

- Soft **mint / emerald** + **violet** glow wash (reuses
  `--accent-supplement` / `--accent-supplement-soft`).
- A gentle diagonal sweep.
- A popped **check** badge on the supplement gradient with `shadow-glow-supplement`.
- A few **capsules** drifting gently upward.
- A scatter of **warm-gold** sparkles (`#f5b942`).

No clinical/medical imagery, no aggressive flying pills, no warning colors, no
unrelated confetti. CSS-only — no canvas/WebGL, no new dependencies.

## Message copy (Hebrew, RTL)

Primary: **`{supplementName} הוזן בהצלחה`** (e.g. `קריאטין הוזן בהצלחה`,
`ויטמין D הוזן בהצלחה`). If the name is somehow empty, it falls back to
`התוסף הוזן בהצלחה`. The same string drives the screen-reader `role="status"`
announcement.

### Safety wording decision

The copy is a **neutral "logged successfully" confirmation only**. It never
implies the supplement is recommended, healthy, required, or good for the body,
and never mentions dosage. Explicitly avoided: `מומלץ לקחת`, `בריא`, `חובה`,
`טוב לגוף`, and any dosage/medical claim. This keeps the feature consistent with
the rest of the supplements module, which is "for personal tracking only — not a
medical recommendation".

## Accessibility / reduced motion

- Decorative layer is `aria-hidden`; a separate visually-hidden `role="status"`
  paragraph announces the success text to screen readers.
- The overlay is `pointer-events-none` and never traps focus or requires
  dismissal — the app stays fully usable underneath.
- Under `prefers-reduced-motion: reduce`, all travel (sweep, capsules, sparkles)
  is hidden and the badge animation is disabled; only a brief, static
  mint/violet glow remains.

## What stayed unchanged

- Supplement / supplement-log schema and localStorage keys
  (`yfos:supplements:v1`, `yfos:supplement-logs:v1`).
- The `toggleSupplementTaken` storage path — no parallel write path was added;
  the celebration only *reads* state around the existing mutation.
- Backup / restore schema (no new persisted state to back up).
- Water / nutrition / workout / gym schemas, the water celebration, auth / beta
  / guest / admin / Supabase, AI routes, privacy / terms.
- No new dependencies; no dosage logic, recommendations, or medical rules.

## Manual QA notes

- **360px & 390px**: overlay badge + message stay centered; the message pill is
  `max-w-[78vw]` with `truncate`, so long names (`ויטמין D`, `מגנזיום`) never
  overflow the viewport. Nothing blocks the toggle or the rest of the screen.
- **Reduced motion** (OS "reduce motion" on): marking a supplement shows a brief
  static mint/violet glow + the badge, no drifting capsules/sparkles, and the
  `role="status"` text still announces.
- **Repeat behavior**: tap to mark → celebrate; tap again to un-mark → no
  celebration; tap to re-mark → celebrates again.
- **Cross-surface**: verified from Today's `SupplementsCard` and from
  `/nutrition/supplements`.
