# Personal Profile — Personal Training Profile (V1 + V2)

> The **safe personalization layer** for Yuval Fit OS: a small, optional, fully
> editable profile that captures the user's workout preferences and goals. It
> only **collects and displays** the profile. It does **not** auto-generate a
> training program and makes **no** medical, diet, or fitness prescriptions.
>
> **V2 (Personal Profile Onboarding)** added: (1) an optional one-time first-entry
> prompt inviting the user to fill the profile, and (2) additive optional
> personalization fields. See the **"V2 — Onboarding & expanded fields"** section
> at the end. The V1 content below still describes the core screen and storage.

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
- `npm run lint`, `npm run build`, and `npm run test:e2e` all pass.

---

# V2 — Onboarding & expanded fields (Personal Profile Onboarding)

V2 keeps everything in V1 unchanged and adds two things: an **optional one-time
first-entry prompt** that gently invites the user to fill the profile, and a set
of **additive optional personalization fields**. The profile is still
collect-and-display only — no auto-program, no medical/diet/body-pressure logic.

## Part 1 — Optional first-entry onboarding prompt

A calm, one-time invitation (`components/profile/ProfileOnboardingPrompt.tsx`),
mounted once in `app/layout.tsx` as the **last** step of the onboarding sequence
(inside `WelcomeGate`, next to `AppShell`).

- **Copy:** title "נכיר אותך כדי להתאים את החוויה?", body "כמה שאלות קצרות יעזרו
  למערכת להבין את המטרה, השגרה והאימון שמתאים לך. אפשר לדלג ולמלא אחר כך.",
  primary CTA **"בוא נתחיל"**, secondary CTA **"לא עכשיו"** (the backdrop is also a
  "not now" tap, labelled "סגירה" so it doesn't duplicate the button name).
- **"בוא נתחיל"** → records the dismissal and navigates to `/training-profile`.
- **"לא עכשיו"** (or backdrop) → records the dismissal only. Both choices are
  one-time; the profile stays reachable from More / Workouts either way.
- **Appears only when ALL hold** (so it never stacks on another modal and never
  shows before access resolves):
  1. the user has truly passed the access boundary — `useAppAccessGranted()`
     (`lib/app-access.ts`), never while auth/approval is loading, never for a
     denied/blocked user;
  2. the first-visit welcome screen **and** the beta welcome notice are both done
     (`useWelcomeSeen()` + `useBetaWelcomeSeen()`);
  3. no personal profile exists yet (`usePersonalProfile()` + `isProfileEmpty`);
  4. it hasn't been dismissed before (`yfos:profile-onboarding-dismissed:v1`);
  5. the route is not a public info page (`/privacy`, `/terms`, `/ai-disclaimer`)
     and not `/training-profile` itself.
- **Never blocks the app.** It's an overlay (`z-95`, below all the real gates at
  `z-100/104/108`); the app shell stays mounted underneath and is fully usable
  the moment the prompt is dismissed.
- **Shared access signal.** `useAppAccessGranted` was extracted verbatim from
  `BetaWelcomeNotice` into `lib/app-access.ts` so the beta welcome notice and this
  prompt share one source of truth (no duplicated, drifting auth logic).
  `BetaWelcomeNotice` now imports it — behaviour is identical.

### Dismissal key

`yfos:profile-onboarding-dismissed:v1` (new, additive), owned by
`lib/profile-onboarding.ts` (mirrors `lib/welcome.ts`: `useSyncExternalStore`
reactive flag, fail-"dismissed" on storage errors so a hiccup never re-nags).
This is a **gate/preference flag, not data** — like the welcome flags it is **not**
part of Backup/Restore and is **not** cleared by `resetAll` (a `resetProfileOnboarding`
reset is exported for any future "show again" action). After a full reset the
profile is cleared but the prompt does not re-nag, matching welcome-flag semantics.

## Part 2 — Expanded optional fields (additive)

All V1 fields are unchanged. Six **optional** fields were added to
`TrainingProfile` (and `TrainingProfileInput`), each sanitized defensively in
`sanitizeProfile`; older profiles (which simply omit them) load unchanged.

| Field | Label | Type | Options / notes |
| --- | --- | --- | --- |
| `adaptation` | מין / התאמה — אופציונלי | single | גבר · אישה · מעדיף/ה לא לענות. Optional, respectful; never a medical claim, never forced. |
| `age` | גיל | short numeric string | Optional; gentle digits-only input, no scary errors. |
| `heightCm` | גובה · ס״מ | short numeric string | Optional; neutral. |
| `weightKg` | משקל · ק״ג | short numeric string | Optional. **No BMI, no body categories, no "תקין/לא תקין", no labels.** |
| `trainingPreference` | איזה סגנון אימון מתאים לך יותר? | single | רגוע והדרגתי · מאוזן · מאתגר · לא בטוח עדיין |
| `guidanceStyle` | איך תרצה להתחיל? | single | תכנית פשוטה וברורה · יותר חופש לבחור תרגילים · המלצה לפי המטרה שלי · לא בטוח עדיין |

- `age` / `heightCm` / `weightKg` are stored as short strings (`pickMeasure`
  accepts a number or numeric string, trims, caps at `MEASURE_MAX_LENGTH = 8`).
  The form input strips non-digits as you type — lenient, never a blocking error.
- The three new selects are validated against their option lists on read
  (`pickOption`), so an unknown value is dropped rather than shown.
- The `notes` helper copy was improved to invite constraints/sensitivities
  ("אם יש משהו שחשוב לזכור — זמן מוגבל, תרגילים שפחות מתאימים לך, חוסר ניסיון או
  העדפה מסוימת — אפשר לכתוב כאן."). Notes are still stored verbatim — pain/injury
  text is never diagnosed or acted on.

## Part 3 — Profile screen UX

`/training-profile` works both as a normal editable page and as the onboarding
destination. Sections were regrouped to stay short and mobile-first: **מטרה ·
שגרת אימון · ניסיון וציוד · התאמה אישית — אופציונלי · הערות**. The new
"התאמה אישית — אופציונלי" section carries a helper making the optionality and the
"no judgment / no medical calc" intent explicit. The **saved summary** shows the
optional fields in their own "התאמה אישית" card **only when at least one is
filled**, so empty optional fields never read as missing/required. Save / skip /
edit / reset behave exactly as in V1.

## Part 4 — Entry-point copy

Unchanged placement; copy refreshed:
- **More / System Hub:** "פרופיל אימון אישי" — "המטרה, השגרה וההעדפות שלך".
- **Workouts:** "התאם את חוויית האימונים" — "ענה על כמה שאלות כדי שנוכל להציע
  כיוון מתאים בהמשך".
- **Today:** still intentionally left untouched (already dense).

## Part 5 — Backup / Restore

The profile module (`personalProfile`) was already in `BACKUP_MODULES` in V1, and
it stores the **whole profile object**, so the new optional fields are included
in export/restore **automatically — no backup-code change was needed**.
`backupVersion` stays **1**. Older backups (without the new fields, or without
`personalProfile` at all) restore unchanged; restore writes raw and reads
sanitize, so a malformed/older profile can never crash a screen. The preview still
shows `personalProfileIncluded`.

## V2 safety wording decisions

- The adaptation field is framed as "מין / התאמה — אופציונלי", with
  "מעדיף/ה לא לענות" always available — never required, never a medical claim.
- Weight/height/age are neutral, optional, and used for **nothing** automated:
  **no BMI, no body-fat, no categories, no "normal/abnormal", no comparisons.**
- No body-shape question and no body-shaming labels ("שמן/רזה/מלא/חטוב") anywhere.
- The personalization section explicitly states it is optional and not for
  judgment or medical calculation.

## V2 — what stayed unchanged

No change to workout/template/active-draft, FoodLog/nutrition, water/supplement/
protein, gym schemas or celebrations; auth/beta/guest/admin/Supabase behaviour
(the access logic was only **extracted**, not changed); AI routes; privacy/terms;
the existing backup modules (profile object is additive only); Today's command
center; the gate order (`BetaAuthGate → BetaWelcomeNotice → WelcomeGate →
AppShell`, with the prompt as a non-blocking sibling of `AppShell`). No new
dependencies.

## V2 files

**Added:** `lib/app-access.ts` (shared access-granted hook),
`lib/profile-onboarding.ts` (dismissal flag), `components/profile/ProfileOnboardingPrompt.tsx`,
`e2e/profile-onboarding.spec.ts`.
**Modified:** `lib/personal-profile.ts` (6 optional fields + sanitizers),
`components/profile/TrainingProfileView.tsx` (new section + summary + notes copy),
`components/access/BetaWelcomeNotice.tsx` (import shared hook), `app/layout.tsx`
(mount prompt), `components/more/SystemHubView.tsx` + `components/workouts/WorkoutsView.tsx`
(copy), `e2e/training-profile.spec.ts` (optional-fields test), docs.

## V2 manual QA notes (360 px / 390 px)

- The onboarding prompt is centered/bottom-anchored, fits within 360 px and
  390 px, and never traps the user — "לא עכשיו", the backdrop, and "בוא נתחיל" all
  resolve it; the app is usable immediately after.
- The new "התאמה אישית — אופציונלי" section (adaptation chips, a 3-column
  age/height/weight grid, and two more chip groups) wraps cleanly with no overflow
  at 360/390 px; the 3-up numeric inputs stay tappable.
- Saving with only core fields shows no "התאמה אישית" summary card; saving with
  optional fields shows it with only the filled rows.
- Prompt verified to NOT appear on `/privacy`, `/terms`, `/ai-disclaimer`, on
  `/training-profile`, once a profile exists, or once dismissed (persists across
  reload). It only appears after welcome + beta-welcome are done and access is
  granted.
- `npm run lint`, `npm run build`, and `npm run test:e2e` all pass (82 e2e specs).
