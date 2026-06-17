# Personal Path V1 — Small Safe Version

A small, **local-first, deterministic, NO-AI** guidance layer that helps the user
understand their next step by *connecting* three things the app already has: the
saved personal profile (read via the existing recommendation result), the workout
recommendation, and saved workout history.

> Product goal: the user should feel **"I know where I am, what I already did, and
> what the next step is."**

## Scope — lightweight guidance only

This is **not** a plan generator. It:

- does **not** generate exercises, weekly programs, or templates,
- does **not** create or mutate templates automatically,
- does **not** call any network / AI,
- does **not** prescribe anything medical / diet / body / weight related,
- adds **no** new localStorage key and **no** schema field — it is pure derived
  state.

## Data used

`personalPathState(recommendation, workouts)` in
[`lib/personal-path.ts`](../lib/personal-path.ts) is a pure function of:

- the existing **`WorkoutRecommendationResult`** (which already encodes whether a
  usable / complete profile exists and whether a concrete template recommendation
  is available), and
- the **saved workouts** (`useWorkouts()` → newest-first), for the count and last
  date.

That's it. It re-uses the recommendation's own profile gating, so it never reads
profile fields directly.

## Data intentionally NOT used

- **age / height / weight / sex / adaptation** — never used for path logic (the
  recommendation layer already excludes them, and the path layer only consumes the
  recommendation's status, not the profile body fields).
- No body / weight / appearance / BMI / "transformation" signals of any kind.

## States

`PersonalPathState` is discriminated:

| kind | when | headline guidance |
| --- | --- | --- |
| `no-profile` | no usable profile saved | invite to fill a short profile |
| `incomplete-profile` | profile exists but no recommendation possible yet (missing core answers, or — rare — no templates) | complete the profile |
| `ready-to-start` | profile + a concrete recommendation, but **no** workouts saved | "your first step: start from the recommended template" |
| `in-progress` | **≥ 1** workout saved | keep the streak going: continue / view progress |

Precedence is intentional: **once any workout is saved the user is "in progress"**
(carrying `workoutCount`, `lastWorkoutDate`, a `profileComplete` flag for the chip,
and the `recommendation` when one still exists), so the card never tells someone
who has already trained to go "fill a profile".

### Card UI ([`components/workouts/PersonalPathCard.tsx`](../components/workouts/PersonalPathCard.tsx))

Compact, calm `Card` (not the raised hero/recommendation treatment), Hebrew, RTL,
`data-testid="personal-path"`, eyebrow **"הצעד הבא שלך"** + title
**"המסלול האישי שלך"**:

- **ready-to-start** — highlighted step line **"הצעד הראשון שלך: להתחיל מהתבנית
  המומלצת."** + body **"זו נקודת התחלה לפי הפרופיל והתבניות שקיימות אצלך."** +
  primary **"התחל מההמלצה"** (runs the existing recommended-start flow) + a calm
  **"אפשר לשנות בכל רגע."**
- **in-progress** — body **"התחלת לבנות רצף. הצעד הבא הוא להמשיך באימון נוסף או
  לחזור לתבנית שמתאימה לך."** + 1–3 status chips (**"פרופיל הושלם"** when the
  profile is complete · **"אימונים שנשמרו: {count}"** · **"אימון אחרון: {date}"**
  when available) + primary **"התחל אימון נוסף"** (free workout) + secondary
  **"צפה בהתקדמות"** (→ `/progress`) + optional quiet **"חזור להמלצה"** (scrolls to
  the recommendation card) when a recommendation still exists + a calm footnote
  **"ככל שתשמור יותר אימונים, הכיוון יהיה ברור יותר."**
- **no-profile / incomplete-profile** — the card *implements* these (quiet
  "fill / complete profile" prompts to `/training-profile`) but they are **not
  rendered on `/workouts`** (see below).

## Where it appears

**`/workouts`** ([`WorkoutsView`](../components/workouts/WorkoutsView.tsx)), directly
**below the recommendation card** and the command center, and **below** the
active-draft restore card — so it guides without overpowering the stronger
actions.

On `/workouts` the **`no-profile` and `incomplete-profile` states are intentionally
deferred** to the recommendation card sitting directly above it, which already owns
the exact "fill / complete your profile" prompt. Rendering both would stack two
near-identical profile cards on the hub. So `WorkoutsView` only mounts the
personal-path card for **`ready-to-start`** and **`in-progress`**. The helper and
the card component still fully implement all four states, so a future placement
without a recommendation card can render them.

### CTA behaviour (reuses existing flows, nothing new)

- **"התחל מההמלצה"** → resolves the recommended template by id and runs the **same**
  `startFromRecommendation` flow the recommendation card uses (one-off
  "started from recommendation" hint included).
- **"התחל אימון נוסף"** → `openBuilder(null)` (the existing free-workout flow).
- **"צפה בהתקדמות"** → `Link` to `/progress`.
- **"חזור להמלצה"** → smooth-scroll to the recommendation card (`#workout-recommendation`).

## State 5 (post-completion "from recommendation") — already handled

The task's optional State 5 ("השלמת אימון מההמלצה…") is **already served** by the
existing [`WorkoutCompletionCard`](../components/workouts/WorkoutCompletionCard.tsx),
which shows **"השלמת את האימון שהומלץ לפי הפרופיל שלך."** right after a recommended
save — using builder-local state, **no persisted field**. We did **not** add a new
field or duplicate that copy; after the completion card, the personal-path card's
`in-progress` state takes over on the hub.

## `/progress` — deferred (follow-up)

`/progress` is already information-dense (weekly hero, last-workout snapshot, key
stats, insights, trends, water, supplements, gym, records). Adding the personal-path
card there risks clutter, and its **"צפה בהתקדמות"** CTA would be self-referential
on that page. So per the task's guidance we **only added it to `/workouts`** and
record `/progress` (and Today) as **follow-ups**.

## What stayed unchanged

`WorkoutSession` / `WorkoutExerciseEntry` / `SetEntry` / `WorkoutTemplate` schemas;
the active-draft schema/key `yfos:active-workout-draft:v1`; `yfos:workouts`;
`yfos:personal-profile:v1` + the profile schema; backup/restore; the workout
**recommendation scoring** (`lib/workout-recommendation.ts` untouched); the active
builder behaviour; the workout completion card behaviour; nutrition / water /
supplement / protein / gym schemas; auth / beta / guest / admin / Supabase; AI
routes; legal pages; Google-only auth entry; the locked guest entry; the
beta/profile onboarding sequence. No new dependencies; localStorage-only.

## Manual QA notes (360px / 390px)

- Card is compact; the in-progress status chips use `flex-wrap`, so
  "פרופיל הושלם" / "אימונים שנשמרו" / "אימון אחרון" wrap cleanly at 360px.
- The in-progress action row is a 2-col grid (`התחל אימון נוסף` / `צפה בהתקדמות`)
  that holds at 360px without overflow.
- RTL correct; the card sits below the draft-restore card and command center.
- No horizontal overflow at 360px / 390px (asserted in e2e).

## Follow-ups

- Optional `/progress` and/or Today placement (would render `no-profile` /
  `incomplete-profile` too, since there is no recommendation card there).
- A dedicated post-recommendation "continue the same template" quick action (State
  5) **if** the session ever persists its source template id (out of scope — no
  schema change in V1).

## Validation

- `npm run lint` ✓ (0 errors; 1 pre-existing unrelated warning).
- `npm run build` ✓ (TypeScript clean; route table unchanged).
- `npm run test:e2e` ✓ **146 green**, including the new
  [`e2e/personal-path.spec.ts`](../e2e/personal-path.spec.ts): no-profile defers to
  the recommendation card; ready-to-start first-step guidance; in-progress count +
  next step; "התחל אימון נוסף" opens the free builder; "צפה בהתקדמות" → `/progress`;
  the card never sits above the draft-restore card; no horizontal overflow at
  360px / 390px.
