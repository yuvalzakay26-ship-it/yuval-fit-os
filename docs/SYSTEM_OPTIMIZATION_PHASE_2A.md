# System Optimization Phase 2A — CelebrationOverlay extraction

> **Safe refactor only.** No change to runtime behaviour, user-facing copy,
> triggers, timing, storage/session keys, event names, or celebration business
> logic. This is the first applied item from
> [`SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md`](SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md)
> §2.1 (P1, "highest-ROI consolidation").
>
> Date: 2026-06-17 · Branch: `main` · Baseline: `0ebda6c`

---

## What & why

The three app-wide celebration overlays — water goal, protein goal, supplement
taken — shared an ~85% copy-pasted skeleton (~70 boilerplate lines × 3):

- the one-shot `active` + `runId` state machine;
- a `window.addEventListener(<EVENT>, handler)` effect with `setTimeout`
  teardown + cleanup;
- the `pointer-events-none` / `aria-hidden` / high-z-index fixed shell;
- the glow + sweep + center-badge (icon chip + pill) layout;
- a separate visually-hidden `role="status"` announcement;
- CSS-driven motion that respects `prefers-reduced-motion`.

Only the event name, duration (1.3–1.5s), copy, colour `variant`, and decorative
particle shapes ever differed. That shared skeleton is now one primitive.

## New primitive

`components/celebrations/CelebrationOverlay.tsx` exports:

- **`useCelebrationTrigger(eventName, durationMs, onTrigger?)`** — the one-shot
  state machine. Subscribes once (event name + duration are module constants),
  bumps `runId` on each fire so CSS animations restart, shows the overlay, and
  hides it after `durationMs`; cleans up the listener and any pending timeout on
  unmount. `onTrigger` (used by the supplement overlay to read the event detail)
  is held in a ref so a fresh closure each render never re-subscribes or clears
  the active timer. Returns `{ visible, runId }`.
- **`<CelebrationOverlay>`** — the stateless, non-modal visual shell. Renders the
  glow + sweep + decorations + center badge plus the separate `role="status"` SR
  announcement. CSS classes are derived from a single `variant` prop
  (`water-celebrate` → `water-celebrate-{glow,sweep,badge}`), matching the
  existing class convention in `globals.css` exactly (no CSS changed).

## Thin wrappers (unchanged behaviour)

`WaterGoalCelebrationOverlay`, `ProteinGoalCelebrationOverlay`, and
`SupplementTakenCelebrationOverlay` keep their public exports and their
`AppShell` mount points. Each wrapper still owns, byte-for-byte:

- its own event subscription (`yfos:water-goal-reached` /
  `…protein-goal-reached` / `…supplement-taken`);
- its exact duration (1500 / 1400 / 1300 ms);
- its fixed (non-random, sandbox-safe) decorative particles;
- its icon, badge pill markup, and Hebrew copy;
- its `data-*-celebration="active"` attribute (the e2e hooks);
- for supplements, the per-event supplement name read from the event detail.

## Explicitly unchanged

- `lib/water-goal-events.ts`, `lib/protein-goal-events.ts`,
  `lib/supplement-events.ts` — **not touched**.
- All event names, localStorage/sessionStorage keys, triggers, timings, copy.
- `globals.css` celebration styles and the `prefers-reduced-motion` handling.
- The non-modal / `pointer-events-none` / no-focus-trap / `role="status"`
  accessibility contract.

## Validation

| Command | Result |
|---|---|
| `npm run lint` | ✓ 0 errors, 1 pre-existing warning (`scripts/qa-settings.mjs`) |
| `npm run build` | ✓ TypeScript clean; route table unchanged |
| `npm run test:e2e` | ✓ **100 passed** — incl. `water-goal-states`, `water-reset`, `protein-celebration`, `supplement-celebration` |

## Files

- **Added:** `components/celebrations/CelebrationOverlay.tsx`
- **Modified:** `components/water/WaterGoalCelebrationOverlay.tsx`,
  `components/nutrition/ProteinGoalCelebrationOverlay.tsx`,
  `components/supplements/SupplementTakenCelebrationOverlay.tsx`
- **Docs:** this file, `SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md` (§2.1 marked
  applied), `PROJECT_STATE.md` (Phase 2A entry)
