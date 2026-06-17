# Workout Recommendation V1

> A deterministic, local-first layer that uses the saved **Personal Training
> Profile** to recommend **one existing workout template** as a good place to
> start. It is **not** a workout-plan generator, **not** AI, and **never** creates
> templates or exercises.

> **V1.1 — Recommendation Guidance Polish** (see the dedicated section at the end)
> is a UX/copy pass on top of V1. The scoring logic in
> `lib/workout-recommendation.ts` is **unchanged**; only the presentation and copy
> were refined to explain _why_ a template fits, show the user's _next step_, and
> keep the framing honest and non-coercive.

## Scope

After the user fills the personal profile, the Workouts page should feel smarter:

> "Based on your goal, frequency, experience, location, duration and equipment,
> here is a good existing template to start with."

This pass adds:

- **`lib/workout-recommendation.ts`** — pure, deterministic recommendation logic.
- **`components/workouts/WorkoutRecommendationCard.tsx`** — presentational card
  for the Workouts page covering all four behaviour states.
- Wiring in **`components/workouts/WorkoutsView.tsx`** — the card renders below
  the command center and above the templates list (and never above the active
  draft restore card).
- A **compact recommendation block** in
  **`components/profile/TrainingProfileView.tsx`** saved-summary state, linking to
  `/workouts`.
- e2e coverage in **`e2e/workout-recommendation.spec.ts`**.

## Deterministic / local-only behaviour

`getWorkoutRecommendation(profile, templates)` is a **pure function**:

- No network, no server, no AI, no persisted state — it derives a result purely
  from its inputs.
- Same inputs → same output. Ties are broken by a **stable rule**: highest score,
  then prefer a broad/full-body template (a safe general start), then the earliest
  template in the original order.

### Result states

```ts
type WorkoutRecommendationResult =
  | { status: "no-profile" }          // State 1 — quiet "fill profile" CTA
  | { status: "incomplete-profile" }  // State 2 — quiet "complete profile" CTA
  | { status: "no-templates" }        // State 3 — create-template fallback
  | { status: "ok"; recommendation: WorkoutRecommendation };

interface WorkoutRecommendation {
  templateId: string;
  templateName: string;
  confidence: "high" | "medium" | "low";
  reasons: string[];     // 2–4 short, neutral chips
  explanation: string;   // one careful sentence, graded by confidence
}
```

## Fields used (safe signals only)

Scoring reads ONLY these profile answers:

| Field               | How it is used                                                        |
| ------------------- | --------------------------------------------------------------------- |
| `goal`              | strength / general / habit / technique → broad; muscle → split if freq supports |
| `experience`        | beginner / returning → prefer broad, full-body; penalize narrow splits |
| `weeklyFrequency`   | 2–3 → prefer full-body; 4+ → splits acceptable / slightly favoured     |
| `workoutDuration`   | "עד 30 דקות" → prefer simpler/shorter templates                       |
| `location`          | "בית" → avoid gym-machine templates; "חדר כושר" → machine work is fine |
| `equipment`         | bodyweight-only → home-friendly templates; gym kit → gym templates ok  |
| `trainingPreference`| "רגוע והדרגתי" enriches the beginner "gradual start" reason            |
| `guidanceStyle`     | (reserved enrichment signal; not body/medical)                        |

Template signals are derived from **existing template fields only**: `title`,
`muscleGroups` (breadth / full-body detection), and `exerciseIds` (equipment
needs are read from the seed exercise library — read-only, unknown ids ignored).
**No template field is added or mutated.**

## Fields intentionally NOT used

`age`, `heightCm`, `weightKg`, `adaptation` (sex) — these may be **displayed** in
the profile summary, but they are **never** used for scoring. No BMI, no
body-shape labels, no weight/medical/diet judgment is ever computed. This is
enforced by the logic simply never referencing those fields.

## Confidence + copy

Confidence is graded honestly because template metadata is limited:

- **high** — ≥3 matching signal categories AND a clear margin over the runner-up.
  _"לפי המטרה, הרמה והתדירות שבחרת — זו נראית כמו תבנית טובה להתחלה."_
- **medium** — at least one matching signal.
  _"זו המלצה ראשונית לפי הפרופיל והתבניות שקיימות אצלך."_
- **low** — no clear signal / a tie.
  _"עדיין אין מספיק מידע להתאמה חזקה, אבל זו יכולה להיות נקודת התחלה טובה."_

Reason chips are neutral and supportive, e.g. "מתאים לרמת מתחיל", "מתאים ל־3
אימונים בשבוע", "מתאים למכון", "מתאים למטרה שבחרת", "תבנית רחבה שמתאימה לבניית
בסיס". Forbidden framing is avoided entirely: no "חובה", "התוכנית הכי טובה",
"יביא אותך לתוצאות", "שורף שומן", "חיטוב", "מבנה גוף", "BMI", or medical claims.

## Behaviour states (UI)

1. **No profile** → quiet card "המלצת אימון אישית" + CTA "מלא פרופיל אימון" →
   `/training-profile`. Never blocks.
2. **Profile exists but required answers missing** (older data) → "השלם פרופיל
   כדי לקבל המלצה" + CTA "השלם פרופיל" → `/training-profile`.
3. **Profile ready but no templates** → "אין עדיין תבניות להמלצה" + CTA "צור תבנית
   חדשה" (opens the template editor).
4. **Profile + templates** → "המלצת התחלה לפי הפרופיל שלך": recommended **existing**
   template name, careful explanation, 2–4 reason chips, primary **"התחל אימון"**
   (existing start-from-template flow — never auto-starts), secondary **"ערוך
   פרופיל"** → `/training-profile`.

"Required answers" for a recommendation = `goal · location · weeklyFrequency ·
workoutDuration · experience · equipment(≥1)`. These are exactly the fields a V1
profile already had, so **older profiles still qualify**; the newer
`trainingPreference` / `guidanceStyle` answers only enrich scoring.

## Fallback behaviour

- On a tie or low confidence, the deterministic tiebreak prefers a broad/full-body
  template (e.g. "Full Body"), else the first reasonable existing template, and the
  copy stays careful ("נקודת התחלה ראשונית").
- If the recommended template disappears between scoring and render, the card
  degrades to the create-template fallback rather than showing a dead start button.
- The profile-page block renders only the "ok" / "no-templates" states (the page
  already invites editing for an incomplete profile).

## Safety limitations

- Recommendation honesty: template metadata is limited (muscle groups + title +
  derived equipment), so confidence is graded and never overclaims.
- Display-only suggestion: it **maps** the profile to an existing template; it
  does not design a program, prescribe sets/reps, or make any health claim.
- The profile-page block is **link-only** (start lives on `/workouts`, where the
  start flow is owned) to avoid risky cross-store wiring.

## What stayed unchanged

- `yfos:personal-profile:v1`, the profile schema/fields, the sanitizer, and the
  training-profile wizard validation.
- Workout / template schema (`WorkoutTemplate`), the start-from-template flow, and
  active-workout draft behaviour (the draft restore card stays the strongest
  first action when a draft exists).
- Backup/restore, beta welcome flow, profile onboarding gating, gym / nutrition /
  water / supplement / protein schemas and celebrations, auth/beta/guest/admin/
  Supabase, AI routes, and public legal pages.
- No new dependencies; localStorage-only.

## Manual QA notes

- `/workouts` with **no profile**: shows "המלצת אימון אישית" CTA; app fully usable.
- Fill the profile (beginner, 3×/week, gym, strength) → reload `/workouts`: the
  card recommends a broad full-body template with "התאם" reasons; "התחל אימון"
  opens the builder seeded with that template's title; "ערוך פרופיל" → wizard.
- Delete all templates (or seed an empty list) with a profile present → the
  create-template fallback appears.
- `/training-profile` saved summary shows the compact block linking to `/workouts`.
- Verified `age/height/weight/sex` changes never alter the recommendation.

## Tests

- e2e: `e2e/workout-recommendation.spec.ts` — no-profile CTA; incomplete-profile
  CTA; recommendation names an existing template **and shows the "למה דווקא זו?" /
  "הצעד הבא שלך" sections**; "התחל אימון" starts it **and surfaces the V1.1
  confirmation banner**; "ערוך פרופיל" links to `/training-profile`; no-templates
  fallback; profile-summary compact block. Full suite **117 green**.
- No unit-test framework exists in the repo (Playwright-only), so the
  deterministic logic is pinned through the e2e cases above (beginner → full-body
  preference, no-templates fallback, deterministic winner, existing-template-only,
  no body-field influence).

---

## V1.1 — Recommendation Guidance Polish

A **UX / copy / presentation** pass that makes the recommendation feel useful,
understandable and action-oriented — without changing any logic, schema or flow.
It answers three questions for the user: **why** this template fits, **what to do
next**, and that this is a **safe, changeable starting point** — not a forced plan.

### What changed

**Recommendation card (`components/workouts/WorkoutRecommendationCard.tsx`)** — a
clearer hierarchy:

- Header **"המלצת התחלה לפי הפרופיל שלך"** + subtitle _"מצאנו תבנית שיכולה להתאים
  להתחלה שלך."_ + the graded confidence badge (unchanged source).
- A labelled **"התבנית המומלצת"** block: the existing template name (emphasised)
  + the careful, confidence-graded explanation.
- A new **"למה דווקא זו?"** section rendering the existing 2–4 reason chips
  (wrap-clean, no overflow).
- A new **"הצעד הבא שלך"** section: _"התחל אימון ראשון מהתבנית הזאת, ואז תוכל
  לעדכן את הפרופיל או לבחור תבנית אחרת בכל רגע."_
- CTA hierarchy: primary **"התחל אימון"**, secondary **"ערוך פרופיל"**, and a
  quiet optional link **"ראה תבניות נוספות"** that anchors to the templates list
  (`#workout-templates`) on the same page.

**Recommended-start confirmation (`components/workouts/WorkoutsView.tsx`)** — when
the user starts from the recommendation card, a **non-invasive, dismissible
banner** appears above the builder: _"מעולה, התחלת מהתבנית שהומלצה לפי הפרופיל
שלך."_ It is **pure local UI state** (`startedFromRecommendation`): it touches no
active-workout draft field, persists nothing, and clears when the builder closes.
The start path itself is the unchanged start-from-template flow.

**Profile summary block (`components/profile/TrainingProfileView.tsx`)** — the
compact block is now titled **"המלצת אימון מחכה לך"** with body _"על בסיס הפרופיל
שמילאת, אפשר לראות במסך האימונים תבנית התחלה מומלצת."_ and CTA **"עבור להמלצה"**.
Still **link-only** to `/workouts` (start stays where the flow is owned); the
`aria-label` keeps naming the template for clarity/determinism.

**Fallback copy** — each state keeps exactly one CTA, with clearer copy:

- No profile → _"מלא פרופיל אימון קצר כדי לקבל המלצת התחלה."_
- Incomplete profile → _"חסרות כמה תשובות בסיסיות כדי להציע תבנית מתאימה."_
- No templates → _"אין עדיין תבניות שאפשר להמליץ עליהן…"_

### Honest framing (kept)

Confidence stays graded by the **unchanged** logic and the copy never overclaims
— no "חובה", "הכי טוב", "יבטיח תוצאות", "שורף שומן", "חיטוב", "מבנה גוף" or
medical claims. High/medium/low explanations are the existing graded sentences
(see *Confidence + copy* above); the card uses careful wording throughout
("יכולה להתאים", "נקודת התחלה", "אפשר לשנות בכל רגע").

### What stayed unchanged (V1.1)

- `lib/workout-recommendation.ts` scoring, signals, confidence grading and
  explanations — **no logic change** (display metadata only via existing fields).
- `yfos:personal-profile:v1`, profile schema, workout/template schema, the
  active-workout **draft schema** and the start-from-template flow.
- Backup/restore, beta welcome flow, auth/beta/guest/admin/Supabase, onboarding,
  nutrition/water/supplement/protein/gym schemas, AI routes and legal pages.
- No new dependencies; localStorage-only.

### Manual QA notes (V1.1 — 360px / 390px)

- `/workouts` with a complete profile + templates at **360px and 390px**: card
  shows the labelled template block, the "למה דווקא זו?" chips wrap cleanly with
  **no horizontal overflow**, and the "הצעד הבא שלך" section reads clearly.
- CTA hierarchy holds: "התחל אימון" leads, "ערוך פרופיל" is secondary, "ראה
  תבניות נוספות" is a quiet tertiary link that scrolls to the templates list.
- The card never outranks the draft-restore card and never overpowers the command
  center hero.
- Tapping "התחל אימון" opens the builder seeded with the template title and shows
  the dismissible confirmation banner; dismissing it or closing the builder
  clears it; starting a *non-recommended* workout never shows it.
- `/training-profile` saved summary shows the "המלצת אימון מחכה לך" block linking
  to `/workouts`.
- Re-verified `age/height/weight/sex` changes never alter the recommendation.
