# Gym Check-In / Check-Out

> Local-only **gym attendance** tracking: manually clock in when you enter the
> gym and out when you leave. **No backend, no auth, no cloud, no GPS / no
> location data** — entry and exit are manual taps. Added in Phase 3.xx.

## Gym visit vs workout session — the product distinction

These are two different things and the app keeps them fully separate:

- A **workout session** (`yfos:workouts`) is about *training*: exercises, sets,
  kg, reps, completed sets. Owned by the Workouts module.
- A **gym visit** (`yfos:gym-visits:v1`) is about *being physically at the gym*:
  entry time, exit time, date, and total duration. Owned by this feature.

A gym visit never reads or writes workout history, the active-workout draft, or
any nutrition/water/supplement data. You can have a gym visit with no logged
workout, and a logged workout with no gym visit. They are intentionally
independent so each answers its own question ("how much did I lift?" vs "how
often / how long am I at the gym?").

## Route & entry points

- **Route:** `/gym` (`app/gym/page.tsx` → `components/gym/GymView.tsx`) — the
  full Gym Attendance screen: active-visit card + check-in/out, weekly stats, and
  visit history.
- **From Today** (`/`): a compact "נוכחות במכון" card (`GymTodayCard`) — a quick
  check-in when idle, or a live timer + "סיים שהייה" when a visit is active.
- **From the System Hub** (`/more`): a "נוכחות במכון" card in the *כושר* group.
- **From Workouts** (`/workouts`): a quiet link card to `/gym`.
- **Not** added to the bottom navigation (reserved for the five daily tabs). The
  More tab lights up on `/gym`.

## Storage keys

This feature adds **two** new additive keys (both `yfos:`-prefixed). They live in
their own module, `lib/gym-attendance.ts`, which is their single owner — mirroring
the `lib/active-workout-draft.ts` pattern.

| Key | Shape | Purpose |
| --- | --- | --- |
| `yfos:gym-visits:v1` | `GymVisit[]` | Saved visit history (newest first) |
| `yfos:active-gym-visit:v1` | `ActiveGymVisit \| absent` | The single in-progress (open) visit, or absent when not checked in |

```ts
type GymVisit = {
  id: string;
  startedAt: string;   // ISO check-in time
  endedAt: string;     // ISO check-out time
  durationMs: number;  // endedAt - startedAt, clamped ≥ 0
  createdAt: string;
  updatedAt?: string;
};

type ActiveGymVisit = {
  id: string;
  startedAt: string;
  createdAt: string;
};
```

All reads/writes are `isBrowser()`-guarded and fail safely (corrupt/partial
records are ignored, never trusted). A small `useSyncExternalStore` reactive layer
(`useGymVisits`, `useActiveGymVisit`) keeps components in sync SSR-safely (server
snapshot is `[]` / `null`; the real value swaps in after hydration).

## Check-in / check-out behavior

1. **Check in** (`נכנסתי למכון`) → `startGymVisit()` creates the single active
   visit stamped with `startedAt`. The active card shows `אתה במכון`, the entry
   time (`נכנסת בשעה 18:42`) and a live `HH:MM:SS` timer (`משך זמן נוכחי`).
2. **Check out** (`סיים שהייה במכון`, confirmed on `/gym`) → `finishGymVisit()`
   stamps `endedAt`, computes `durationMs`, prepends a `GymVisit` to history,
   clears the active slot, and shows success feedback (`השהייה נשמרה` ·
   `היית במכון 1:24 שעות`). On the Today quick card the check-out is immediate.

## Active visit persistence

The active visit lives in `localStorage`, and the timer is **derived** from
`startedAt` (`now − startedAt`). So closing the app, refreshing, navigating away
and returning all keep the visit open and the timer correct — there is no
in-memory timer that resets.

## Forgot-to-check-out handling

If an active visit has been open for **6 hours or more** (`FORGOT_CHECKOUT_MS`),
a calm warning appears: `נראה שהשהייה פתוחה הרבה זמן` with `סיים עכשיו` /
`מחק כניסה פתוחה`. The app **never auto-closes** the visit and **never guesses**
an exit time — the user decides. (No GPS is ever used to detect leaving.)

## Delete / cancel

- **Delete the open visit** (`מחק כניסה פתוחה`) → confirm
  (`למחוק את הכניסה הפתוחה?`) → clears the active slot, writes nothing to history.
- **Delete a saved visit** (trash on a history row) → confirm (`למחוק את הביקור?`)
  → removes that visit from history only.

## Today / Progress integration

- **Today** shows the compact gym card (quick check-in or live timer) — a useful
  quick action that does not dominate the screen.
- **Progress** (`/progress`) shows a compact "נוכחות במכון" stats block (visits
  this week, time at the gym this week, average duration, last visit) — rendered
  only when at least one visit exists. Derived purely by `getGymVisitStats`.

## Backup & Restore integration

Both keys are part of the backup system via `BACKUP_MODULES` in `lib/backup.ts`:

| `data` field | Storage key |
| --- | --- |
| `gymVisits` | `yfos:gym-visits:v1` |
| `activeGymVisit` | `yfos:active-gym-visit:v1` |

The restore preview shows the **ביקורים במכון** count and a
**כולל שהייה פעילה במכון** yes/no. Restore brings gym history and any open visit
back exactly like the rest of the modules (a value overwrites the key, `null`
clears it). See [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md).

## Reset behavior

"Reset all data" (Settings) clears gym attendance too — `fitness-store.resetAll()`
calls `clearAllGymData()` after the standard `STORAGE_KEYS` wipe. Gate/admin state
is never touched.

## Derived stats & helpers (`lib/gym-attendance.ts`)

- `getGymVisits()` / `getActiveGymVisit()` — fail-safe reads.
- `startGymVisit()` / `finishGymVisit()` / `deleteActiveGymVisit()` /
  `deleteGymVisit(id)` / `clearAllGymData()` — mutations.
- `getGymVisitStats(visits, now?)` — pure: totals, visits-this-week,
  time-this-week, average duration, last visit (Sunday-based week).
- `formatDuration(ms)` → `H:MM` (e.g. `1:24`); `formatTimer(ms)` → `HH:MM:SS`
  live timer; `formatClock(iso)` → `HH:MM`.

## What this is NOT

No backend, no auth, no database, no cloud sync, no AI, no API, no
native/Capacitor work, **no GPS/geolocation and no stored location**. Local
manual check-in/out only.

## QA

`scripts/qa-gym-check-in.mjs` (expects `next start -p 3334`): empty state,
check-in + live timer + reload persistence, check-out (saves visit, clears active,
success + history row), delete open visit / saved visit (both confirm-gated),
long-open forgot warning (no auto-close), Today check-in/out landing in `/gym`
history, Progress gym stats, backup export includes `gymVisits` + `activeGymVisit`
and restore brings them back without altering workout history, and 360/390 +
light/dark with no console errors.
