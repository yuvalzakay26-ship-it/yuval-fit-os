# Workout Recommendation V1

> A deterministic, local-first layer that uses the saved **Personal Training
> Profile** to recommend **one existing workout template** as a good place to
> start. It is **not** a workout-plan generator, **not** AI, and **never** creates
> templates or exercises.

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
  CTA; recommendation names an existing template; "התחל אימון" starts it; "ערוך
  פרופיל" links to `/training-profile`; no-templates fallback; profile-summary
  compact block. Full suite **107 green**.
- No unit-test framework exists in the repo (Playwright-only), so the
  deterministic logic is pinned through the e2e cases above (beginner → full-body
  preference, no-templates fallback, deterministic winner, existing-template-only,
  no body-field influence).
