# System Optimization Phase 2C — Docs Archive / Merge Pass

> **Documentation-only change.** No runtime app code, components, lib, schemas,
> storage/session keys, backup/restore, auth/beta/guest/admin/Supabase, AI routes,
> or product behaviour changed. No tests changed. This applies the docs P1 item
> from [`SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md`](SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md)
> §1 / §9 ("archive completed/superseded docs + mark deprecated").
>
> Date: 2026-06-17 · Branch: `main` · Baseline: `eca6b4c`

---

## Goal

Make the docs easier to navigate and less duplicated without losing history.
[`PROJECT_STATE.md`](PROJECT_STATE.md) is the single source of truth; older,
completed/superseded docs should not compete with it. The approach: **move over
delete**, fix links, and add a clear documentation map.

## What was archived

A new `docs/archive/` folder was created with an index
([`archive/README.md`](archive/README.md)). Four docs were moved with `git mv`
(history preserved); each got a short "archived / historical" header and its
internal links were repointed for the new depth.

| Moved file | Why | Current source of truth |
|---|---|---|
| `archive/NUTRITION_PHOTO_ASSIST_PLAN.md` | Original photo-first planning/spec; MVP shipped | [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md) |
| `archive/NUTRITION_UX.md` | Earlier `/nutrition` UX pass (Phase 3.17.1); superseded | [`NUTRITION_CLARITY_PASS.md`](NUTRITION_CLARITY_PASS.md) |
| `archive/TODAY_DASHBOARD_UPGRADE.md` | Original Today "command center" concept (Phase 3.23); superseded | [`TODAY_COMMAND_CENTER_POLISH.md`](TODAY_COMMAND_CENTER_POLISH.md), [`TODAY_CLARITY_PASS.md`](TODAY_CLARITY_PASS.md) |
| `archive/PRIVATE_ACCESS_NOTICE.md` | Deprecated; removed from the active gate chain | [`BETA_WELCOME_NOTICE.md`](BETA_WELCOME_NOTICE.md) |

## What was intentionally left active

- **`EXERCISE_MEDIA_IMPORT.md`, `FOOD_MEDIA_IMPORT.md`** — completed one-time
  import processes, but `.gitignore` and `lib/food-library.ts` comments point at
  them. Moving them would require editing code/config (out of scope for a
  docs-only pass), and they remain the canonical reference for the import scripts.
- **`EXERCISE_VIDEO_LINKS_AUDIT.md`** — a verification record cross-linked from
  the active `EXERCISE_VIDEO_LINKS.md`; supports a re-audit cadence, so it stays a
  living reference.
- **`ADMIN_ACCESS_GATE.md`** — legacy gate, but still cross-linked from
  `README.md`, `PROJECT_STATE.md` §8, and `SETTINGS_CONTROL_CENTER.md`. The audit
  marked it "update needed", not "archive"; left untouched to avoid touching the
  access-surface docs.
- All other active feature, technical/contract, legal, and optimization docs.

## What was intentionally not touched

- No doc was **deleted** (move over delete).
- No doc was **merged/rewritten** — the audit suggested folding the overlapping
  Today / Nutrition-UX docs into one, but that risks losing history; archiving the
  superseded copy with a pointer header achieves the same de-duplication safely.
- No runtime code, component, lib, schema, storage/session key, backup format,
  auth/beta/guest/admin/Supabase behaviour, AI route, or legal/privacy content.
- No tests, package files, or build config.

## Links updated

- Inbound: `BETA_WELCOME_NOTICE.md` → `archive/PRIVATE_ACCESS_NOTICE.md`.
- Internal (within moved docs, now one level deeper): `NUTRITION_PHOTO_ASSIST_PLAN`
  → `../NUTRITION_PHOTO_ASSIST.md`; `PRIVATE_ACCESS_NOTICE` → `../BETA_WELCOME_NOTICE.md`;
  `NUTRITION_UX` → `../NUTRITION_QUICK_REUSE.md` (×3), plus new header links.
- `PROJECT_STATE.md` and `archive/README.md` link into the archive with relative
  paths.

## For future agents

1. Read [`PROJECT_STATE.md`](PROJECT_STATE.md) first — it is the source of truth,
   and §11 is the documentation map (current vs technical vs audit vs archive).
2. Treat anything under `docs/archive/` as **historical** — possibly outdated,
   never overriding `PROJECT_STATE.md` or an active feature doc.
3. Before using an older doc as a requirement, confirm against `PROJECT_STATE.md`.

## Validation

| Command | Result |
|---|---|
| `npm run lint` | ✓ 0 errors, 1 pre-existing warning (`scripts/qa-settings.mjs`) |
| `npm run build` | ✓ TypeScript clean; route table unchanged |
| `npm run test:e2e` | ✓ **100 passed** — full suite, both prod servers |

Docs-only change; validation reflects the unchanged runtime baseline.

## Files

- **Added:** `docs/archive/README.md`, this doc.
- **Moved (git mv):** the four docs in the table above into `docs/archive/`.
- **Modified:** `PROJECT_STATE.md` (Phase 2C entry + §11 documentation map),
  `SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md` (§1 / §9 / §10 marked applied),
  `BETA_WELCOME_NOTICE.md` (one link), and the four moved docs (headers + links).
