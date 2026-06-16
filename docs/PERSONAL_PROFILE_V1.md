# Personal Profile — Personal Training Profile (V1 + V2)

> The **safe personalization layer** for Yuval Fit OS: a small, optional, fully
> editable profile that captures the user's workout preferences and goals. It
> only **collects and displays** the profile. It does **not** auto-generate a
> training program and makes **no** medical, diet, or fitness prescriptions.
>
> **V2 (Personal Profile Onboarding)** added: (1) an optional first-entry prompt
> inviting the user to fill the profile, and (2) additive optional personalization
> fields. See the **"V2 — Onboarding & expanded fields"** section. **V3** then
> upgraded the onboarding in two parts: **V3 (Flow)** changed the *cadence* so the
> beta welcome and this prompt appear on **every app entry / session** (beta
> welcome first, profile prompt second) instead of once-per-device-forever; and
> **V3 (UX)** turned the entry prompt into a **true centered modal** and converted
> `/training-profile` from one long form into a **step-by-step wizard** (one
> question per screen, progress + next/back, summary/confirm before saving). See
> the **"V3 (Flow) — Entry flow"** and **"V3 (UX) — Premium modal + step wizard"**
> sections at the very end. The V1 content below still describes the core fields
> and storage, which are unchanged.

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

A calm invitation (`components/profile/ProfileOnboardingPrompt.tsx`), mounted once
in `app/layout.tsx` as the **second** step of the entry sequence — right after the
beta welcome (inside `WelcomeGate`, next to `AppShell`). **As of V3 its dismissal
is session-level**, so it returns on a future app entry while no profile exists —
see the "V3 — Entry flow" section; the points below describe the original V2
wiring with the V3 cadence noted inline.

- **Copy:** title "נכיר אותך כדי להתאים את החוויה?", body "כמה שאלות קצרות יעזרו
  למערכת להבין את המטרה, השגרה והאימון שמתאים לך. אפשר לדלג ולמלא אחר כך.",
  primary CTA **"בוא נתחיל"**, secondary CTA **"לא עכשיו"** (the backdrop is also a
  "not now" tap, labelled "סגירה" so it doesn't duplicate the button name).
- **"בוא נתחיל"** → records the dismissal and navigates to `/training-profile`.
- **"לא עכשיו"** (or backdrop) → records the dismissal only. Both choices dismiss
  for the **current session** (V3); the profile stays reachable from More /
  Workouts either way, and the prompt may return on a later entry while no profile
  exists.
- **Appears only when ALL hold** (so it never stacks on another modal and never
  shows before access resolves):
  1. the user has truly passed the access boundary — `useAppAccessGranted()`
     (`lib/app-access.ts`), never while auth/approval is loading, never for a
     denied/blocked user;
  2. the first-visit welcome screen **and** the beta welcome notice are both done
     (`useWelcomeSeen()` + `useBetaWelcomeSeen()` — in V3 the beta welcome is a
     per-session flag, so this guarantees the beta welcome is always seen FIRST and
     the two never show at once);
  3. no personal profile exists yet (`usePersonalProfile()` + `isProfileEmpty`);
  4. it hasn't been dismissed **this session** (V3 session flag
     `yfos:profile-onboarding-dismissed-session:v1`; the legacy permanent key
     `yfos:profile-onboarding-dismissed:v1` is no longer read as a suppressor);
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

**V3:** `yfos:profile-onboarding-dismissed-session:v1` in **sessionStorage**, owned
by `lib/profile-onboarding.ts` (`useSyncExternalStore` reactive flag,
fail-"dismissed" on storage errors so a hiccup never re-nags mid-session). The
legacy permanent localStorage key `yfos:profile-onboarding-dismissed:v1` is left in
place but **no longer read** as a suppressor. This is a **gate/preference flag, not
data** — it is **not** part of Backup/Restore and is **not** cleared by `resetAll`
(a `resetProfileOnboarding` reset is exported for any "show again" action). After a
full reset the profile is cleared but the prompt does not re-nag within the
session, matching welcome-flag semantics.

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

---

# V3 (Flow) — Entry flow (beta welcome + profile prompt on every app entry)

V3 changes **only the cadence and ordering** of the two onboarding surfaces — it
touches no schema, no profile fields, no backup, and no auth/access logic. The
profile screen, the profile data key (`yfos:personal-profile:v1`), the profile
form, and everything in V1/V2 above are unchanged.

## Why

The previous behaviour gated both surfaces with **permanent localStorage flags**,
so once a user had seen them on a device they never appeared again. The desired
product flow is: every time a user enters the system they should see the **beta
welcome first**, then the **profile onboarding prompt** (while no profile exists),
then the app.

## What changed

1. **Beta welcome is now per session.** `lib/beta-welcome.ts` reads/writes
   `yfos:beta-welcome-seen-session:v1` in **sessionStorage** (was the permanent
   `yfos:beta-welcome-seen:v1` in localStorage). It greets on every fresh app entry
   — for **admins, approved testers, and guests** alike (all funnel through
   `useAppAccessGranted`) — and does **not** re-stack while navigating between
   routes in the same session. A new tab / fresh PWA launch / new session greets
   again. The pre-paint `BETA_WELCOME_INIT_SCRIPT` now checks the session key, so a
   within-session reload still doesn't flash the greeting.

2. **Profile prompt dismissal is now per session.** `lib/profile-onboarding.ts`
   reads/writes `yfos:profile-onboarding-dismissed-session:v1` in **sessionStorage**
   (was the permanent `yfos:profile-onboarding-dismissed:v1`). "לא עכשיו" hides it
   for the current session only; it may return on a future entry **while no profile
   exists**. Once a profile exists it never shows (unchanged). It still never shows
   on `/training-profile` or the public info pages.

3. **Ordering is enforced via the per-session beta-welcome flag.** The profile
   prompt already requires `useBetaWelcomeSeen()` to be true, so while the beta
   welcome is open the prompt renders `null` — the two are never visible at once,
   and the beta welcome is always step one.

The legacy permanent keys are intentionally **left in place** (no data churn) but
are **no longer read** as suppressors. The Settings "הצג מסך פתיחה" /
"הצג הודעת בטא שוב" actions still work (reset now clears the session flag, showing
the notice again immediately).

## Storage keys (V3)

| Surface | Key | Storage | Cadence |
| --- | --- | --- | --- |
| Beta welcome | `yfos:beta-welcome-seen-session:v1` | sessionStorage | once per session/entry |
| Beta welcome (legacy) | `yfos:beta-welcome-seen:v1` | localStorage | retained, **no longer read** |
| Profile prompt | `yfos:profile-onboarding-dismissed-session:v1` | sessionStorage | dismissed per session, until a profile exists |
| Profile prompt (legacy) | `yfos:profile-onboarding-dismissed:v1` | localStorage | retained, **no longer read** |
| First-visit welcome | `yfos:welcome-seen:v1` | localStorage | **unchanged** (still once per device) |
| Personal profile | `yfos:personal-profile:v1` | localStorage | **unchanged** |

The first-visit `WelcomeGate` was deliberately **left persistent** — V3 scope was
only the beta welcome and the profile prompt.

## V3 — what stayed unchanged

Personal-profile schema, `yfos:personal-profile:v1`, profile form fields,
backup/restore, workout/template/draft schemas, FoodLog/nutrition schemas,
water/supplement/protein celebrations, gym schemas,
auth/beta/guest/admin/Supabase access logic, AI routes, privacy/terms/AI-disclaimer
pages, and the Today/Nutrition/Workouts clarity layouts. No new dependencies. No
profile data is cleared and no dismissal flag is backed up.

## V3 files

**Modified:** `lib/beta-welcome.ts` (sessionStorage gating + init script),
`lib/profile-onboarding.ts` (sessionStorage dismissal),
`components/access/BetaWelcomeNotice.tsx` + `components/profile/ProfileOnboardingPrompt.tsx`
+ `app/layout.tsx` (doc-comment updates only — gating logic flows through the libs),
`e2e/profile-onboarding.spec.ts` (session keys + ordering/fresh-session tests),
`qa/beta-welcome-check.mjs` (session-flag assertions), `docs/BETA_WELCOME_NOTICE.md`,
`docs/PERSONAL_PROFILE_V1.md`, `docs/PROJECT_STATE.md`.
**Added:** `e2e/beta-welcome.spec.ts` (beta welcome on every entry, before the
profile prompt, with the legacy persistent flag present).

## V3 manual QA notes

- Guest and approved entries both show the beta welcome first on a fresh session,
  then the profile prompt (no profile) — never both at once.
- The beta welcome appears even when the old `yfos:beta-welcome-seen:v1`
  localStorage flag is present (legacy flag no longer suppresses).
- Within a session, route navigation and a reload do **not** re-show the beta
  welcome; a new session/tab does.
- "לא עכשיו" hides the profile prompt for the session; a new session with no
  profile shows it again; once a profile exists it never shows.
- Neither surface appears on `/privacy`, `/terms`, `/ai-disclaimer`, before access
  is granted, or for a non-granted visitor.

---

# V3 (UX) — Premium modal + step wizard

V3 (UX) is a **presentation-only** upgrade of the onboarding. It changes how the
entry prompt and the profile screen *look and flow* — it does **not** touch the
profile schema, the stored fields, their meanings, backup/restore, the onboarding
session gating, or the beta-welcome ordering. Everything in V1/V2/V3(Flow) above
still holds.

## Part 1 — The entry prompt is now a true centered modal

`components/profile/ProfileOnboardingPrompt.tsx` previously rendered as a
bottom-anchored sheet on mobile (`items-end`). It is now a **centered dialog**:

- Centered on **both** axes (`items-center justify-center`); the card floats in the
  middle of the screen, not low or inline.
- **Dimmed + blurred backdrop** (`bg-black/60 backdrop-blur-sm`); tapping it is the
  calm "not now" choice (unchanged).
- Premium card: large rounded corners (`rounded-[1.9rem]`), generous padding
  (`p-7`), `shadow-float`, and an `animate-zoom-in` entrance.
- Clear icon treatment (gradient badge with a soft glow halo + subtle ring), title,
  short body, strong primary CTA **"בוא נתחיל"**, clear secondary **"לא עכשיו"**, and
  the helper note ("אפשר תמיד למלא או לערוך מאוחר יותר…").
- Responsive: on short screens the overlay scrolls (`overflow-y-auto` + `py-8` +
  `my-auto`) while the card stays a centered modal — never a bottom sheet.
- **Behaviour is unchanged**: shown after the beta welcome, not on public info
  pages, not if a profile exists; "לא עכשיו" hides it for the session; "בוא נתחיל"
  records the dismissal and navigates to `/training-profile`.

## Part 2 — `/training-profile` is now a step-by-step wizard

`components/profile/TrainingProfileView.tsx` was rebuilt from one long stacked form
into a guided wizard — **one focused decision per screen**, driven by a data
`STEPS` array so the progress indicator and navigation stay in sync.

### Step structure

| # | Screen | Field(s) | Control |
| --- | --- | --- | --- |
| Intro | "כמה שאלות, חוויה מותאמת" + **"התחל"** / **"דלג בינתיים"** | — | start |
| 1 | "מה המטרה המרכזית שלך?" | `goal` | single-select chips |
| 2 | "איפה אתה מתאמן בדרך כלל?" | `location` | single-select |
| 3 | "כמה פעמים בשבוע תרצה להתאמן?" | `weeklyFrequency` | single-select |
| 4 | "כמה זמן יש לך לאימון?" | `workoutDuration` | single-select |
| 5 | "מה רמת הניסיון שלך?" | `experience` | single-select |
| 6 | "איזה ציוד זמין לך?" | `equipment` | **multi-select** |
| 7 | "התאמה אישית — אופציונלי" | `adaptation`, `age`, `heightCm`, `weightKg` | chips + 3 numeric inputs |
| 8 | "איזה סגנון אימון מתאים לך יותר?" | `trainingPreference` | single-select |
| 9 | "איך תרצה להתחיל?" | `guidanceStyle` | single-select |
| 10 | "יש משהו שכדאי לקחת בחשבון?" | `notes` | free-text area |
| 11 | "סיכום" — clean summary + **"שמור פרופיל"** / **"חזור לעריכה"** (+ "דלג בינתיים" in create) | all | confirm |

- **Progress indicator:** a "שלב X מתוך 11" readout **and** a gradient progress bar
  at the top of every step.
- **Navigation:** a clear **"הבא"** (→ **"לסיכום"** on the last question) and
  **"חזור"**. Back from the first question returns to the intro (create) or to the
  saved summary (edit). The summary's "חזור לעריכה" steps back into the answers.
- **Every step is optional** — "הבא" is always enabled; the user can advance without
  answering, keeping cognitive load minimal.
- **Draft model:** answers live in **component state** (`ProfileDraft`) and are
  persisted to `yfos:personal-profile:v1` **only** on the final "שמור פרופיל"
  (`savePersonalProfile`). This is the simplest robust approach — no partial writes,
  so an abandoned wizard never mutates the stored profile. (Chosen over saving
  per-step.)
- **Transitions:** each step is re-keyed and uses the existing lightweight
  `animate-fade-up`; the view smooth-scrolls to top on step change. No animation
  libraries were added.
- **Visual language:** soft raised cards, one big question per screen, high-contrast
  primary CTA, subtle per-step iconography, elegant progress bar. Verified clean at
  360 px and 390 px.

## Part 3 — Edit mode (Option B)

When a profile already exists, `/training-profile` opens on the **saved summary**
(hero + "סיכום הפרופיל" rows + optional "התאמה אישית" card), with **"ערוך פרופיל"**
and a confirm-gated **"אפס פרופיל"**. "ערוך פרופיל" opens the **same wizard**
pre-filled, jumping straight to the first question (no intro). So viewing stays a
compact summary while editing is the identical guided experience as onboarding —
combining the clarity of Option B (summary-first) with the consistency of Option A
(wizard for editing). Reset still clears only `yfos:personal-profile:v1` behind a
`ConfirmDialog`.

## V3 (UX) — what stayed unchanged

Profile **schema and fields**, `yfos:personal-profile:v1`, the sanitizer/validation,
`savePersonalProfile`/`getPersonalProfile`/`clearPersonalProfile`, backup/restore
(`personalProfile` module, `backupVersion` 1), the onboarding **session** gating and
beta-welcome **ordering**, the More/Workouts entry points, auth/guest/admin/Supabase,
and all Today/Nutrition/Workouts/Water/Supplement/Protein features. No field meaning
changed, no field was removed, no new dependency was added. `app/training-profile/page.tsx`
is unchanged (its `PageHeader` still supplies the "פרופיל אימון אישי" screen title).

## V3 (UX) files

**Modified:** `components/profile/ProfileOnboardingPrompt.tsx` (centered modal),
`components/profile/TrainingProfileView.tsx` (rebuilt as the step wizard),
`e2e/training-profile.spec.ts` (drives the wizard: intro, one-question-at-a-time,
next/back, complete+save, optional fields, edit, skip, reset, entry points),
`e2e/nutrition-photo.spec.ts` (hardened one latent race — wait for the review
heading before reading draft inputs; unrelated to the profile, surfaced by the
heavier parallel suite), `docs/PERSONAL_PROFILE_V1.md`, `docs/PROJECT_STATE.md`.

## V3 (UX) manual QA notes (360 px / 390 px)

- The entry prompt is centered both axes with a dimmed/blurred backdrop, reads as a
  focused modal (not a card/sheet), and fits within 360/390 px; the three actions
  (בוא נתחיל / לא עכשיו / backdrop) all resolve it.
- The wizard shows exactly one question per screen with a visible "שלב X מתוך 11" +
  progress bar; "הבא"/"חזור" move between steps and the last question's button reads
  "לסיכום".
- Selections persist across back/next; the summary lists answered fields (optional
  "התאמה אישית" rows only when filled); "שמור פרופיל" writes once and returns to the
  saved summary.
- Editing an existing profile opens the wizard pre-filled at step 1; "אפס פרופיל"
  confirms then returns the wizard intro.
- "דלג בינתיים" (intro + summary in create mode) returns to Today; the app works
  normally with no profile.
- `npm run lint`, `npm run build`, and `npm run test:e2e` all pass — **93 e2e specs
  green** (a latent race in `nutrition-photo.spec.ts`, surfaced by the heavier
  parallel suite, was hardened in the same change).

---

# V4 — Required core wizard answers (prevent empty profiles)

V4 is a **validation / UX change only**. It does **not** touch the profile schema,
the stored fields, their meanings, `yfos:personal-profile:v1`, backup/restore, the
onboarding session gating, or the beta-welcome ordering. Everything in
V1/V2/V3 above still holds. It fixes one problem: in the V3 wizard a user could
press **"הבא"** repeatedly without answering anything, reach the summary, and save
an empty / almost-empty profile that carries no useful detail for future
recommendations.

## The product rule

The profile onboarding stays **optional at the app-entry level** — the first modal
still offers **"לא עכשיו"**, and the wizard intro still offers **"דלג בינתיים"**.
But **once the user clicks "בוא נתחיל" / "התחל" and is inside the questionnaire**,
the **core training questions are required** before they can advance, so we never
store a useless profile. Personal / sensitive fields stay optional.

## Required vs optional

**Required core steps** — **"הבא"** is disabled until an answer is selected:

| # (code index) | Field | Question |
| --- | --- | --- |
| 0 | `goal` | מה המטרה המרכזית שלך? |
| 1 | `location` | איפה אתה מתאמן בדרך כלל? |
| 2 | `weeklyFrequency` | כמה פעמים בשבוע תרצה להתאמן? |
| 3 | `workoutDuration` | כמה זמן יש לך לאימון? |
| 4 | `experience` | מה רמת הניסיון שלך? |
| 5 | `equipment` | איזה ציוד זמין לך? (**multi-select — at least one option**) |
| 7 | `trainingPreference` | איזה סגנון אימון מתאים לך יותר? |
| 8 | `guidanceStyle` | איך תרצה להתחיל? |

**Optional steps** — never block; **"הבא"** stays enabled and they can be passed
empty:

- **Step 6 — Personal adaptation:** `adaptation` (מין / התאמה), `age` (גיל),
  `heightCm` (גובה), `weightKg` (משקל).
- **Step 9 — Notes:** "יש משהו שכדאי לקחת בחשבון?" (`notes`).

### Why body-related fields stay optional

Sex/adaptation, age, height, and weight are **personal and sensitive**, and they
are **not needed** to build a workout direction or recommendation — goal, location,
frequency, duration, experience, equipment, style, and guidance preference are. The
product direction explicitly avoids body pressure: **no BMI, no body-shape labels,
no "תקין/לא תקין", no medical/diet logic, no judgmental copy.** Requiring weight or
age would add pressure for zero personalization benefit, so they remain optional by
design. Notes also stay optional (free text, stored verbatim, never acted on).

### "לא בטוח" / "לא בטוח עדיין" count as answers

Where an option list offers an "unsure" choice — `equipment` → "לא בטוח",
`weeklyFrequency` / `trainingPreference` / `guidanceStyle` → "לא בטוח עדיין" — that
choice is a **valid answer** and unblocks the step. The goal is a meaningful
response, not pressure: the user is never stuck.

## Validation behaviour (preferred UX)

- **Disabled "הבא".** On a required step, the primary button is **disabled** (using
  the design system's existing `disabled:opacity-50` state — no harsh red) until an
  answer is selected. Multi-select equipment needs **≥ 1** option.
- **Calm helper under the question.** Required-but-unanswered shows a muted
  **"בחר תשובה כדי להמשיך"**; optional steps show
  **"השלב הזה אופציונלי ואפשר להמשיך גם בלי למלא."** No scary validation language.
- **Defensive guard in `goNext`.** Even if the disabled state is bypassed, a
  required step with no answer will not advance.
- **Summary reachable only when complete.** Because each required step gates
  advancing, the summary is only reachable once all required core answers exist.
- **Defensive pre-save check.** `handleSave` runs `firstMissingRequiredStep(draft)`
  before writing. If anything is missing (e.g. an **older saved profile** lacking the
  now-required `trainingPreference` / `guidanceStyle`), it shows the calm notice
  **"חסרות כמה תשובות בסיסיות לפני שמירת הפרופיל."** and **jumps the user back to the
  first missing required step** instead of saving. An empty profile can never be
  saved.

## Skip / navigation

- **"דלג בינתיים" stays only at the intro / create-mode entry point** (and the
  app-entry modal's "לא עכשיו"). Skipping before starting leaves the app fully usable
  with no profile.
- **Inside the questionnaire there is no per-step skip** — navigation is **back /
  next only** (the previous per-step and summary "דלג בינתיים" buttons were removed),
  so required steps actually gate progress. Optional steps are simply passed with
  "הבא".

## Edit behaviour (older data)

A saved profile that predates the newly-required fields still **renders its summary
as usual** (the saved view shows whatever it has — never crashes, never erases). When
the user taps **"ערוך פרופיל"**, the wizard guides them to complete the missing
required fields: they cannot advance past a now-required step that has no answer, and
the defensive pre-save check backstops the summary. Existing data is preserved.

## V4 — what stayed unchanged

`yfos:personal-profile:v1`, the profile schema / field names / field meanings, the
sanitizer and `savePersonalProfile`/`getPersonalProfile`/`clearPersonalProfile`,
backup/restore (`personalProfile` module, `backupVersion` 1), the onboarding session
gating, the beta-welcome ordering/flow, the profile onboarding modal gating,
sessionStorage keys, the More/Workouts entry points, auth/beta/guest/admin/Supabase,
AI routes, public info pages, and all Today/Nutrition/Workouts/Water/Supplement/
Protein layouts and celebrations. **No schema, storage, or backup change** — this is
purely a validation/UX layer in `TrainingProfileView.tsx`. No new dependencies. No
BMI, no body-shape labels, no medical/diet logic were added.

## V4 files

**Modified:** `components/profile/TrainingProfileView.tsx` (required-step model,
disabled "הבא", calm hints, defensive `goNext` + `handleSave`, removed per-step /
summary skip), `e2e/training-profile.spec.ts` (new required-gate / equipment-≥1 /
"לא בטוח" / optional-pass / edit-missing-fields tests; existing flows updated to
answer required steps), `docs/PERSONAL_PROFILE_V1.md`, `docs/PROJECT_STATE.md`.

## V4 manual QA notes (360 px / 390 px)

- On every required step (goal, location, frequency, duration, experience, equipment,
  training preference, guidance style) **"הבא"** is clearly disabled with a muted
  **"בחר תשובה כדי להמשיך"** until an answer is chosen; selecting one enables it and
  clears the hint. Verified with no overflow at 360 px and 390 px.
- Equipment requires at least one option; deselecting the last option re-disables
  "הבא"; choosing **"לא בטוח"** counts and unblocks. "לא בטוח עדיין" likewise counts
  on the frequency / style / guidance steps.
- The optional personal step and notes step show the calm optional hint and advance
  while empty.
- The summary is only reachable after all required answers exist; **"שמור פרופיל"**
  on an incomplete draft shows the calm fallback and returns to the first missing
  step. An empty profile cannot be saved.
- An existing saved profile still renders its summary; editing an older profile
  missing the now-required style/guidance steps guides the user to fill them before
  saving, with no crash and no data loss.
- **"דלג בינתיים"** appears only at the intro; inside the wizard navigation is
  back/next only.
- `npm run lint`, `npm run build`, and `npm run test:e2e` all pass — **96 e2e specs
  green**.
