# Personal Profile V1 — Personal Training Profile

> The first **safe personalization layer** for Yuval Fit OS: a small, optional,
> fully editable profile that captures the user's workout preferences and goals.
> This phase only **collects and displays** the profile. It does **not**
> auto-generate a training program and makes **no** medical, diet, or fitness
> prescriptions.

## What it is

A standalone screen at **`/training-profile`** ("פרופיל אימון אישי") with a few
short, supportive questions. The profile is stored locally on the device and can
be created, edited, saved, and reset at any time. The app works completely
normally if the user never fills it — it is never a gate and never forces
onboarding.

Later phases may use the profile to tailor workout recommendations, the Personal
Path, "Better Today" guidance, and template suggestions. None of that is built
here.

## Fields

All preference fields are **optional**. The stored value of each single/multi
select is the Hebrew label itself (the record is self-describing, which keeps
backups portable and avoids a key→label map).

| Field | Label | Type | Options |
| --- | --- | --- | --- |
| `goal` | מה המטרה המרכזית שלך? | single | להתחזק · לבנות מסת שריר · לשפר כושר כללי · להתמיד בשגרה · להתחיל מאפס · לשפר טכניקה |
| `location` | איפה אתה מתאמן בדרך כלל? | single | חדר כושר · בית · גם וגם · עדיין לא קבוע |
| `weeklyFrequency` | כמה פעמים בשבוע תרצה להתאמן? | single | 2 פעמים · 3 פעמים · 4 פעמים · 5+ פעמים · לא בטוח עדיין |
| `experience` | מה רמת הניסיון שלך? | single | מתחיל · חוזר אחרי הפסקה · בינוני · מתקדם |
| `workoutDuration` | כמה זמן יש לך לאימון? | single | עד 30 דקות · 30–45 דקות · 45–60 דקות · יותר משעה |
| `equipment` | איזה ציוד זמין לך? | **multi** | מכון מלא · מכונות · משקולות · גומיות · משקל גוף בלבד · לא בטוח |
| `notes` | יש משהו שכדאי לקחת בחשבון? | free text | — |
| `updatedAt` | — | stamp | ISO timestamp, set on every save |

**Optional body fields (age / height / weight / gender) were intentionally NOT
added in V1.** The existing app does not collect them, and the product direction
is to avoid weight/body-shape pressure. They can be added later as clearly
optional, neutrally-labelled fields if a future phase needs them.

### Notes field

`notes` is free text only. If the user writes about pain or an injury, it is
stored **verbatim** as a note — the app never diagnoses, never advises, and never
turns a note into a recommendation. Input is trimmed and capped at
`NOTES_MAX_LENGTH` (2000 chars) defensively; it is never rejected.

## Storage

- **Key:** `yfos:personal-profile:v1` (new, additive).
- **Owner:** `lib/personal-profile.ts` — the single owner of the key. It mirrors
  `lib/gym-attendance.ts`: a fail-safe + SSR-safe storage layer, a defensive
  parser (`sanitizeProfile` — unknown fields ignored, invalid values dropped,
  never throws), and a small `useSyncExternalStore` reactive layer
  (`usePersonalProfile()`; server / first-hydration snapshot is `null`).
- **No existing key or schema was changed.** This is purely additive.

## Backup & Restore

The profile **is** included in Backup & Restore, consistent with the existing
centralized backup schema:

- Added one additive `BACKUP_MODULES` entry
  (`field: "personalProfile"`, label "פרופיל אימון אישי"). Export and restore are
  both table-driven off `BACKUP_MODULES`, so the profile is exported and restored
  automatically with no per-field code.
- `backupVersion` stays **1** — the module list grew additively; older backups
  (which simply omit `personalProfile`) restore unchanged, and the absent field
  is left untouched on restore.
- Restore writes the raw value; **reads sanitize defensively** (`getPersonalProfile`),
  so a malformed imported profile can never crash a screen.
- The backup preview gained a `personalProfileIncluded` flag and a
  "כולל פרופיל אימון אישי" row, and it counts toward the "empty backup" check.

## Entry points

The profile is reachable but never intrusive:

1. **More / System Hub** (`/more`, "מערכת" group) — a real card
   "פרופיל אימון אישי" → `/training-profile`, placed just above the existing
   "מסלול אישי · בקרוב" placeholder.
2. **Workouts** (`/workouts`) — a quiet secondary card
   "התאם את חוויית האימונים" below the gym-attendance link → `/training-profile`.
3. **Today** — intentionally **not** added. Today is already a dense command
   center; adding a card there would clutter it.

The bottom-nav "עוד" (More) tab also lights up on `/training-profile`
(`nav-items.ts` `match`).

## UI

Hebrew, RTL, mobile-first, soft-premium cards consistent with the app; verified
to read well at 360 px and 390 px. Single-selects and the equipment multi-select
are accessible pill toggles (`aria-pressed`). The screen has three states:

- **Create / edit form** — grouped sections (מטרה · שגרה · ניסיון · ציוד · הערות),
  a primary **"שמור פרופיל"**, and a **"דלג בינתיים"** skip (create) /
  **"ביטול"** (edit).
- **Saved summary** — מטרה · מקום אימון · תדירות · רמה · זמן אימון · ציוד · הערות
  (when present), a **"ערוך פרופיל"** button, a calm secondary **"אפס פרופיל"**
  (confirm-gated `ConfirmDialog`), and the safe future-facing note:
  _"בהמשך הפרופיל יעזור להתאים תבניות והמלצות. כרגע הוא נשמר אצלך במכשיר וניתן
  לעריכה בכל רגע."_

## Safety wording decisions

- **No body-shaming labels** ("שמן", "רזה", "מלא", "חטוב") and **no comparisons**
  to other people anywhere.
- **No weight-loss / fast-fat-loss / extreme-cutting goals** — goal options are
  framed around capability, consistency, and technique. Phrasings like
  "להיות רזה", "להוריד שומן מהר", "חיטוב קיצוני" were explicitly avoided.
- **No body-type / body-shape question.** No before/after goals.
- **No medical or diet advice.** Pain/injury notes are stored, never acted on.
- All copy is supportive and emphasises that the profile is optional, editable,
  and stored only on the device.

## What stayed unchanged

No change to: workout / template / active-draft schemas or behaviour, FoodLog /
nutrition keys, water / supplement / protein schemas and celebrations, gym
schemas, auth / beta / guest / admin / Supabase, AI routes, privacy / terms
pages, or existing Backup/Restore behaviour (the only backup change is the
additive profile module). No existing localStorage keys were renamed or
repurposed. No new dependencies.

## Reset behavior

- The dedicated **"אפס פרופיל"** action (confirm-gated) clears only
  `yfos:personal-profile:v1`; other data is untouched.
- **Reset all data** (`resetAll`) clears the profile too — it lives outside
  `STORAGE_KEYS`, so `fitness-store.resetAll` calls `clearPersonalProfile()`
  explicitly (mirroring `clearAllGymData()`).

## Files

**Added**
- `lib/personal-profile.ts` — types, options, defensive parsing, reactive store.
- `app/training-profile/page.tsx` — route + header.
- `components/profile/TrainingProfileView.tsx` — form / summary / reset UI.
- `e2e/training-profile.spec.ts` — render, create+save, edit, skip, entry points.
- `docs/PERSONAL_PROFILE_V1.md` — this document.

**Modified**
- `lib/backup.ts` — additive `personalProfile` backup module + preview flag.
- `components/backup/BackupView.tsx` — preview row for the profile.
- `lib/fitness-store.ts` — `resetAll` clears the profile.
- `components/more/SystemHubView.tsx` — More entry-point card.
- `components/workouts/WorkoutsView.tsx` — Workouts entry-point card.
- `components/layout/nav-items.ts` — More tab matches `/training-profile`.
- `docs/PROJECT_STATE.md` — module / route / storage / reset / backup updates.

## Manual QA notes (360 px / 390 px)

- Form, pill groups, and the equipment multi-select wrap cleanly at 360 px and
  390 px; no horizontal overflow; tap targets stay comfortable.
- Create → save → summary → edit → save round-trips correctly; values persist
  across reload (localStorage).
- "דלג בינתיים" returns to Today and the app behaves normally with no profile.
- "אפס פרופיל" asks for confirmation, then returns the screen to the empty form.
- Equipment multi-select keeps multiple selections; summary joins them with " · ".
- `npm run lint`, `npm run build`, and `npm run test:e2e` all pass (76 e2e specs).
