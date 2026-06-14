# Backup & Restore

> Local-only export/import of the user's Fit OS data. **No backend, no auth, no
> cloud, no encryption** — just a private JSON file the user keeps on their own
> device. Added in Phase 3.xx.

Fit OS stores everything in the browser under `yfos:*` keys (see
[`PROJECT_STATE.md` §4](PROJECT_STATE.md)). As the user invests real personal
data, the app must be honest about local-only storage and give them a safe way
to protect it. Backup & Restore is that safety net — nothing more.

## Route & entry points

- **Route:** `/backup` (`app/backup/page.tsx` → `components/backup/BackupView.tsx`).
- **From Settings:** a "גיבוי ושחזור" card in the *נתונים ואחסון* section.
- **From the System Hub** (`/more`): the *מערכת* group's "גיבוי ושחזור" card now
  links here (previously pointed at `/settings`).
- **Not** added to the bottom navigation (reserved for the five daily tabs).

## Backup schema

`createBackup()` (in `lib/backup.ts`) produces a full snapshot:

```jsonc
{
  "app": "Fit OS",
  "backupVersion": 1,
  "createdAt": "2026-06-14T08:00:00.000Z",
  "source": "local",
  "data": {
    "settings": { /* … */ },
    "workouts": [ /* … */ ],
    "workoutTemplates": [ /* … */ ],
    "nutritionLogs": [ /* … */ ],
    "savedFoodValues": { /* … */ },
    "favoriteFoods": { /* … */ },
    "waterLogs": [ /* … */ ],
    "supplements": [ /* … */ ],
    "supplementLogs": [ /* … */ ],
    "activeWorkoutDraft": null
  }
}
```

Downloaded as `fit-os-backup-YYYY-MM-DD.json`. Every known module is always
present — `null` when its key is empty — so a restore is an unambiguous "make
the device look like this backup".

### Included storage keys (the data)

The single source of truth is `BACKUP_MODULES` in `lib/backup.ts`, which maps
each friendly field to a real storage key imported from `lib/storage.ts` /
`lib/active-workout-draft.ts` (never re-typed):

| `data` field | Storage key |
| --- | --- |
| `settings` | `yfos:settings` |
| `workouts` | `yfos:workouts` |
| `workoutTemplates` | `yfos:workout-templates:v1` |
| `nutritionLogs` | `yfos:foodLogs` |
| `savedFoodValues` | `yfos:saved-food-values:v1` |
| `favoriteFoods` | `yfos:favorite-foods:v1` |
| `waterLogs` | `yfos:water-logs:v1` |
| `supplements` | `yfos:supplements:v1` |
| `supplementLogs` | `yfos:supplement-logs:v1` |
| `activeWorkoutDraft` | `yfos:active-workout-draft:v1` (only when meaningful) |

### Excluded keys (never backed up, never restored)

`EXCLUDED_KEYS` in `lib/backup.ts` — gate/access state is **not** data:

- `yfos:welcome-seen:v1`
- `yfos:private-access-notice-accepted:session`
- `yfos:admin-access-granted:v1`
- `yfos:backup-meta:v1` (the backup's own bookkeeping — regenerable)

So a restore can never grant access, re-show gates, or carry session-only state.
Static app data (exercise library, food catalogue, knowledge articles) is code,
not user data, and is excluded by definition.

## Export behavior

`ייצא גיבוי` builds the snapshot, triggers a **Blob download**, and records
`lastExportedAt`. For installed PWAs / WebViews that block downloads there is a
fallback: **העתק טקסט גיבוי** copies the JSON to the clipboard, and **הצג טקסט**
reveals a read-only textarea to copy manually.

## Import / restore behavior

1. The user picks a JSON file (`<input type="file">`) **or** pastes backup text.
2. `parseBackupJson()` → `validateBackup()` runs first; nothing is written yet.
3. A **preview** card shows backup date, version, and counts (workouts,
   nutrition entries, water days, supplements, whether settings / active draft
   are included).
4. `שחזר עכשיו` opens a `ConfirmDialog`
   (`שחזור הגיבוי יחליף את הנתונים הקיימים במכשיר הזה. להמשיך?`).
5. **Only after confirmation** does `restoreBackup()` write to `localStorage`.
6. A success state prompts the user to **רענן עכשיו** (reload) so every screen
   re-reads the restored data.

### Restore semantics

For each module the backup *includes*: a value overwrites the key, `null` clears
it. Modules absent from the backup are left untouched, as are all excluded
gate/meta keys. This is a full "replace existing Fit OS data" — documented to the
user — not a silent merge.

## Validation & safety

`validateBackup()` returns a typed error code, mapped to calm Hebrew copy in
`BackupView`:

| Code | Message |
| --- | --- |
| `invalid-json` / `missing-data` | `קובץ הגיבוי לא תקין` |
| `not-fit-os` | `הקובץ לא נראה כמו גיבוי של Fit OS` |
| `unsupported-version` | `גרסת הגיבוי אינה נתמכת` |
| file-read error | `לא הצלחנו לקרוא את הקובץ` |

The whole backup is validated **before** any write, so a rejected file never
partially overwrites data. All `localStorage` access is `isBrowser()`-guarded
and fails safely. An empty backup is valid; the preview flags it so the user
knows restoring it will clear current data.

## Backup metadata

New additive key **`yfos:backup-meta:v1`** (the only key this feature adds):

```ts
{ lastExportedAt?: string; lastRestoredAt?: string; lastRestoredBackupCreatedAt?: string }
```

Best-effort status only — never required for restore. It is **excluded** from
backups and exposed reactively via `useBackupMeta()` (a `useSyncExternalStore`
layer mirroring `lib/active-workout-draft.ts`, so the status reads SSR-safely
with no setState-in-effect).

## What this is NOT

No backend, no auth, no database, no cloud sync, no external storage, no AI, no
API, no native/Capacitor work, no encryption. Local JSON export/import only.

## QA

`scripts/qa-backup-restore.mjs` (expects `next start -p 3333`): export JSON shape
+ exclusions, invalid/wrong-app/unsupported-version rejection, preview +
confirmation gate, the full seed → clear → restore scenario (data reappears,
admin/gate state untouched), Settings + System Hub links, and 360/390 + dark/light
with no console errors.
