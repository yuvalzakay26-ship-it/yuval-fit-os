# Yuval Fit OS — Project State

> Central, always-current snapshot of what the app is, how it is wired, and what
> must not be broken. **New agents should read this first**, then
> [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) for how to run, test and extend it.
>
> Last reviewed: **Lint ignores the gate-enabled e2e build output (`.next-auth`)**.
> A **tooling-only** fix: `eslint.config.mjs` `globalIgnores` now also lists
> **`.next-auth/**`** alongside `.next/**`/`out/**`/`build/**`. `.next-auth` is the
> **generated, minified build output of the gate-enabled e2e build** (`scripts/e2e.mjs`
> builds with dummy Supabase config into `.next-auth` via `NEXT_DIST_DIR`); it is
> **gitignored and not source code**. Before this, `npm run lint` walked into that
> folder after an e2e run and exited 1 with hundreds of errors from generated files
> even though tracked source was clean — now it is ignored exactly like `.next`. **No
> runtime app code, tests, or e2e build behaviour changed.** Validation (run in order):
> `npm run test:e2e` ✓ (creates `.next-auth`), `npm run lint` ✓ exit 0 with `.next-auth`
> present, `npm run build` ✓, `npm run test:e2e` ✓.
>
> Prior: **Creator trust card on the signed-out entry screen**. A small,
> static **creator trust card** (`data-creator-card`, titled `יוצר המערכת`) was
> added to `BetaSignInScreen`
> ([`components/access/BetaAuthGate.tsx`](../components/access/BetaAuthGate.tsx)),
> placed **below the privacy/security note and above the privacy/terms links**. It
> introduces who built the system to build trust on the public entry screen:
> *"Fit OS פותחה ומנוהלת על ידי יובל זכאי — מרצה במכללת אורט ומיישם בינה מלאכותית."* +
> *"המערכת נבנתה כדי לעזור לנהל אימונים, תזונה והרגלים בצורה מסודרת, אישית ופרטית."* +
> a faint *"פרטי יצירת קשר יתווספו בהמשך למשתמשים מאושרים בלבד."* It is styled like
> the privacy note (calm `SparkIcon`, `bg-surface-2/60`) so it never competes with
> the Google sign-in card. **PRODUCT DECISION: this public screen shows NO phone
> number, address, WhatsApp link, or contact action** — only name + role + a short
> trust statement; contact details, if ever needed, belong inside the approved-user
> app experience. The card is information-only (no buttons/links). **Unchanged:**
> Google OAuth, guest-disabled/email-hidden states, beta access flow, admin/
> allowed-users/request logic, `BetaWelcomeNotice`, `WelcomeGate`, profile
> onboarding, public pages, schemas/storage/backup. e2e: `auth-entry.spec.ts`
> gained a check that the card is visible with `יובל זכאי` / `מרצה במכללת אורט` /
> `מיישם … בינה מלאכותית` and **no phone number / `tel:` / `wa.me` / whatsapp link**,
> running at both 360px and 390px alongside the existing logo/Google/email/guest/
> legal checks. Validation: `npm run lint` ✓ (changed files clean), `npm run build`
> ✓, `npm run test:e2e` ✓.
>
> Prior: **Auth Entry Polish — Google-only access, locked guest, no top
> clipping**. A **UI-level** change to the signed-out sign-in screen
> ([`components/access/BetaAuthGate.tsx`](../components/access/BetaAuthGate.tsx) →
> `BetaSignInScreen`) that makes the entry cleaner and more intentional, with **no
> change to any auth/gate logic, Supabase config, RLS, the approved-email gate, the
> request-access flow, admin, or guest internals**. Three things changed: (1) the
> **top-clipping** on short mobile heights is fixed — the screen is now an
> `overflow-y-auto` scroll container wrapping a `min-h-full items-center` flex box
> (the standard non-clipping centered-modal pattern), so the brand logo is fully
> visible at **360px and 390px**, content stays centered when it fits and scrolls
> from the very top when taller, with safe-area top/bottom padding and no
> horizontal overflow (the config-notice screen got the same fix). (2) **Google is
> now the only active sign-in method** (`המשך עם Google`); the **email magic-link
> UI is removed from the screen** (no email input, no "שלח קישור כניסה" button) —
> the subtitle is now *"התחבר עם Google כדי להמשיך."* `signInWithEmailLink` stays in
> `lib/beta-access.ts` (unused by the UI, not deleted). (3) **Guest entry is visible
> but LOCKED** — the `המשך כאורח` button renders `disabled` + `aria-disabled` with a
> **`בקרוב`** badge and helper *"כניסה כאורח תהיה זמינה בהמשך. בינתיים אפשר להתחבר
> עם Google."*; it has **no click handler**, so it creates no guest session, writes
> no `localStorage` key, and enters nothing. **Guest infrastructure is untouched and
> dormant**: `lib/guest-session.ts`, `useAppIdentity` guest support, the guest
> banner, the Settings "צא ממצב אורח" action, and the gate's "already a guest →
> open app" branch all remain, so guest entry can be re-enabled by restoring the
> handler. **Unchanged:** Google OAuth behaviour, beta approval/denied/blocked
> flow, `BetaWelcomeNotice`, `WelcomeGate`, profile onboarding, public legal pages
> (`/privacy`, `/terms`, `/ai-disclaimer`), all fitness schemas + storage keys.
> e2e: the suite gained a **gate-ENABLED** second build — `scripts/e2e.mjs` now also
> builds with dummy Supabase config into `.next-auth` (`next.config.ts` reads
> `NEXT_DIST_DIR`), served on **:3941**, so the real sign-in screen can be tested.
> New [`e2e/auth-entry.spec.ts`](../e2e/auth-entry.spec.ts) (logo not clipped; no
> horizontal overflow; Google visible+enabled; no email input/button; guest visible
> but disabled/`aria-disabled` with `בקרוב`; clicking guest writes no key + stays on
> the screen; legal links work) runs at **both 360px and 390px** (`auth-360` /
> `auth-390` projects). Validation: `npm run lint` ✓ (0 errors, 1 pre-existing
> warning), `npm run build` ✓ (TypeScript clean), `npm run test:e2e` **115 green**.
> Earlier: **Workout Recommendation V1 — recommend an existing template
> from the profile**. The first time the saved Personal Training Profile is used
> to *guide* the user (it was previously collect-and-display only). A new
> **deterministic, local-first, NO-AI** layer maps the profile onto **one existing
> workout template** as a good starting point — it is **not** a plan generator,
> **never** creates a template or exercises, and **never** mutates anything. New
> pure logic [`lib/workout-recommendation.ts`](../lib/workout-recommendation.ts)
> (`getWorkoutRecommendation(profile, templates)`) returns a discriminated result:
> `no-profile` / `incomplete-profile` / `no-templates` / `ok` (with
> `templateId · templateName · confidence · reasons · explanation`). It scores
> existing templates on **safe signals only** — goal · location · weeklyFrequency ·
> workoutDuration · experience · equipment · trainingPreference — using only
> existing template fields (`title`, `muscleGroups` breadth/full-body, and
> equipment derived read-only from the seed exercise library). **`age` / `heightCm`
> / `weightKg` / `adaptation`(sex) are never read for scoring** — no BMI, no
> body-shape labels, no medical/diet judgment. Ties resolve deterministically
> (highest score → prefer a broad/full-body template → earliest in order);
> confidence is graded honestly (high needs ≥3 matching signals + a clear margin)
> with careful Hebrew copy (no "חובה"/"הכי טובה"/"שורף שומן"/"חיטוב"/"BMI"/medical
> claims). New presentational card
> [`components/workouts/WorkoutRecommendationCard.tsx`](../components/workouts/WorkoutRecommendationCard.tsx)
> renders all four states on `/workouts` **below the command center and above the
> templates list** (and never above the active-draft restore card, which stays the
> strongest first action): State 1 quiet "מלא פרופיל אימון" CTA, State 2 "השלם
> פרופיל" CTA, State 3 "צור תבנית חדשה" fallback, State 4 the recommendation —
> existing template name + explanation + 2–4 reason chips + primary **"התחל אימון"**
> (existing start-from-template flow, never auto-starts) + secondary **"ערוך
> פרופיל"**. [`WorkoutsView`](../components/workouts/WorkoutsView.tsx) reads the
> profile + templates and renders the card; a **compact, link-only** block was
> added to the [`TrainingProfileView`](../components/profile/TrainingProfileView.tsx)
> saved summary (reads templates via the existing workouts store hook — no new
> cross-store wiring — and links to `/workouts` where the start flow lives).
> **No** change to `yfos:personal-profile:v1` / profile schema / sanitizer / wizard
> validation, the `WorkoutTemplate` schema, start-from-template, active-draft
> behaviour, backup/restore, beta welcome, profile onboarding gating, gym /
> nutrition / water / supplement / protein schemas + celebrations,
> auth/beta/guest/admin/Supabase, AI routes, or public legal pages; no new
> dependencies; localStorage-only. e2e: new `e2e/workout-recommendation.spec.ts`
> (no-profile CTA; incomplete-profile CTA; recommendation names an existing
> template; "התחל אימון" starts it; "ערוך פרופיל" → `/training-profile`;
> no-templates fallback; profile-summary compact block) — full suite **107 green**.
> Validation: `npm run lint` ✓ (0 errors, 1 pre-existing warning), `npm run build`
> ✓ (TypeScript clean), `npm run test:e2e` **107 green**. See
> [`WORKOUT_RECOMMENDATION_V1.md`](WORKOUT_RECOMMENDATION_V1.md).
> Prior: **System Optimization Phase 2C — Docs archive / merge pass**
> (a **documentation-only** change — **no** change to runtime app code, components,
> lib, schemas, storage/session keys, backup/restore, auth/beta/guest/admin/
> Supabase, AI routes, or any product behaviour; **no** tests changed). Four
> completed/superseded docs were moved into a new [`archive/`](archive/) folder
> with `git mv` (history preserved): the original photo-first plan
> ([`NUTRITION_PHOTO_ASSIST_PLAN.md`](archive/NUTRITION_PHOTO_ASSIST_PLAN.md) →
> superseded by [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md)), the
> earlier nutrition UX pass ([`NUTRITION_UX.md`](archive/NUTRITION_UX.md) →
> [`NUTRITION_CLARITY_PASS.md`](NUTRITION_CLARITY_PASS.md)), the original Today
> "command center" concept ([`TODAY_DASHBOARD_UPGRADE.md`](archive/TODAY_DASHBOARD_UPGRADE.md)
> → [`TODAY_COMMAND_CENTER_POLISH.md`](TODAY_COMMAND_CENTER_POLISH.md) +
> [`TODAY_CLARITY_PASS.md`](TODAY_CLARITY_PASS.md)), and the deprecated
> [`PRIVATE_ACCESS_NOTICE.md`](archive/PRIVATE_ACCESS_NOTICE.md) (removed from the
> gate chain → [`BETA_WELCOME_NOTICE.md`](BETA_WELCOME_NOTICE.md)). Each moved doc
> got a short "archived / historical" header and its internal links were fixed for
> the new depth; the one inbound link (`BETA_WELCOME_NOTICE.md`) was repointed.
> A new [`archive/README.md`](archive/README.md) explains that **`PROJECT_STATE.md`
> is the source of truth** and archived docs may be outdated. The two completed
> media-import docs ([`EXERCISE_MEDIA_IMPORT.md`](EXERCISE_MEDIA_IMPORT.md),
> [`FOOD_MEDIA_IMPORT.md`](FOOD_MEDIA_IMPORT.md)) were **left active in place** —
> `.gitignore` and `lib/food-library.ts` comments point at them, so moving would
> mean editing code/config (out of scope). `EXERCISE_VIDEO_LINKS_AUDIT.md` and
> `ADMIN_ACCESS_GATE.md` were also left active (still cross-linked from living
> docs). See the new documentation map (§11) and
> [`SYSTEM_OPTIMIZATION_PHASE_2C.md`](SYSTEM_OPTIMIZATION_PHASE_2C.md). Validation:
> `npm run lint` ✓ (0 errors, 1 pre-existing warning), `npm run build` ✓
> (TypeScript clean, unchanged route table), `npm run test:e2e` **100 green**.
> Prior: **System Optimization Phase 2B — E2E fixtures cleanup**
> (a **test-maintenance refactor only** — **no** change to runtime app code,
> schemas, storage/session keys, copy, onboarding order, or product behaviour).
> The Playwright suite had byte-identical setup copy-pasted across specs: welcome/
> beta-welcome/guest seeding, the today-date string, the water-day seed, and the
> training-profile wizard's "advance to summary" loop. These now live in one
> [`e2e/fixtures.ts`](../e2e/fixtures.ts): `seedWelcomeSeen` (one-time welcome +
> legacy beta flag), `seedGranted` (granted guest, optional legacy flag),
> `seedGrantedEntered` (granted guest with beta welcome seen this session),
> `seedWater(totalMl, goalMl?)`, `todayISO`, `advanceWizardToSummary`, and
> `expectScrolledOrFits`. Twelve specs were migrated to import them; each helper is
> small and named after the product state it sets up, so specs still read like the
> behaviour they pin. The one remaining hard wait — `waitForTimeout(150)` in
> `scroll-lock.spec.ts` — is now a deterministic `expect.poll`. **Deliberately left
> local:** the Today/Workouts `seedWorkoutDraft` copies (different set schemas) and
> the two `seedProfile` variants (minimal vs full) are *not* identical, so unifying
> them would change seeded data — out of scope. No assertions weakened, no tests
> skipped, no Hebrew text assertions hidden. Validation: `npm run lint` ✓ (0 errors,
> 1 pre-existing warning), `npm run build` ✓ (TypeScript clean, unchanged route
> table), `npm run test:e2e` **100 green**. See
> [`SYSTEM_OPTIMIZATION_PHASE_2B.md`](SYSTEM_OPTIMIZATION_PHASE_2B.md) and
> [`SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md`](SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md)
> §6.1 / §9 (P1, marked applied).
> Prior: **System Optimization Phase 2A — CelebrationOverlay extraction**
> (a **safe refactor only** — **no** change to runtime behaviour, copy, triggers,
> timing, storage/session keys, event names, or celebration business logic). The
> three near-identical celebration overlays (water goal, protein goal, supplement
> taken) shared an ~85% copy-pasted skeleton: the one-shot `active`/`runId`
> state machine, a `window` event listener + `setTimeout` teardown, the
> `pointer-events-none`/`aria-hidden`/high-z-index fixed shell, the glow/sweep/
> center-badge layout, and a separate `role="status"` SR announcement. That
> shared skeleton now lives in one primitive,
> [`components/celebrations/CelebrationOverlay.tsx`](../components/celebrations/CelebrationOverlay.tsx),
> which exports `useCelebrationTrigger(eventName, durationMs, onTrigger?)` (the
> state machine) and `<CelebrationOverlay>` (the non-modal visual shell; CSS
> classes derived from one `variant` prop — `water-celebrate` →
> `water-celebrate-{glow,sweep,badge}`). The three components
> (`WaterGoalCelebrationOverlay`, `ProteinGoalCelebrationOverlay`,
> `SupplementTakenCelebrationOverlay`) stay as thin wrappers, each keeping its own
> event subscription, exact duration (1.5s / 1.4s / 1.3s), decorative particles,
> icon, badge pill, Hebrew copy, `data-*-celebration` attribute (the e2e hooks),
> and — for supplements — the per-event name read from the event detail. Their
> public exports and `AppShell` mount points are unchanged; `lib/water-goal-events.ts`,
> `lib/protein-goal-events.ts`, and `lib/supplement-events.ts` were **not** touched.
> Net ~150 fewer lines and a single source for the timer + a11y behaviour.
> Validation: `npm run lint` ✓ (0 errors, 1 pre-existing warning), `npm run build`
> ✓ (TypeScript clean, unchanged route table), `npm run test:e2e` **100 green** —
> including all water/protein/supplement celebration specs. See
> [`SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md`](SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md)
> §2.1 (P1, marked applied).
> Prior: Phase 4.5 (**Scroll-lock cleanup bugfix** — a **bugfix-only**
> change: **no** change to the profile schema/fields, `yfos:personal-profile:v1`,
> localStorage/sessionStorage keys, backup/restore, the beta/profile onboarding
> order, the centered-modal/wizard UX, or required-answer validation. **Root
> cause:** every full-screen overlay (beta auth gate, beta welcome notice,
> profile onboarding prompt, exercise picker, exercise image viewer, legacy admin
> gate) independently captured/restored `document.body.style.overflow`. When two
> overlapped — e.g. the beta welcome notice handing off to the profile onboarding
> prompt, or the prompt's "בוא נתחיל" dismissing **and** routing in one action —
> the later overlay captured the earlier one's `"hidden"` as its baseline and
> restored **that** on unmount, leaving `<body>` permanently `overflow: hidden`.
> The app still tapped and routed but **could not scroll on any page**. **Fix:** a
> single shared **counter-based** lock in
> [`lib/use-body-scroll-lock.ts`](../lib/use-body-scroll-lock.ts) (`useBodyScrollLock(active?)`):
> the first lock captures the true baseline and sets `hidden`, only the last
> release restores it — so no overlay can leak another's `"hidden"`, and cleanup
> runs on unmount even when navigation fires immediately after a CTA. All six
> overlays now use this hook (the per-component capture/restore effects were
> removed). New e2e `scroll-lock.spec.ts` covers: "לא עכשיו" restores scroll,
> "בוא נתחיל" → `/training-profile` restores scroll, and completing+saving the
> wizard then navigating to long pages (`/nutrition`, `/workouts`, `/more`) keeps
> the body scrollable on a 390px phone. Full suite **100 green**.)
> Prior: Phase 4.4 (**Profile Wizard V4 — required core answers**: a
> **validation/UX-only** change to `components/profile/TrainingProfileView.tsx` —
> **no** change to the profile schema/fields/meanings, `yfos:personal-profile:v1`,
> the sanitizer, backup/restore, the onboarding session gating, sessionStorage keys,
> or the beta-welcome ordering. Fixes the V3 hole where pressing **"הבא"** repeatedly
> with no answers reached the summary and saved an empty profile. The onboarding
> stays optional at app-entry (modal "לא עכשיו"; intro "דלג בינתיים"), but **once
> inside the wizard the core training questions are required**: **"הבא"** is disabled
> until an answer is selected on goal · location · frequency · duration · experience ·
> equipment(**≥1**) · training-preference · guidance, with a calm muted hint
> **"בחר תשובה כדי להמשיך"**; "לא בטוח"/"לא בטוח עדיין" count as valid answers. The
> **personal-adaptation** step (sex/adaptation · age · height · weight) and the
> **notes** step stay **optional** (hint "השלב הזה אופציונלי…") — body-related fields
> remain optional by design (sensitive, not needed for recommendations; **no BMI, no
> body-shape labels, no medical/diet logic**). The summary is reachable only when all
> required answers exist; `handleSave` defensively runs `firstMissingRequiredStep`
> and, if anything is missing (e.g. an older profile lacking the now-required
> trainingPreference/guidanceStyle), shows **"חסרות כמה תשובות בסיסיות לפני שמירת
> הפרופיל."** and jumps back to the first missing step — an empty profile can never be
> saved. Per-step and summary "דלג בינתיים" were removed (skip stays only at the
> intro); inside the wizard it's back/next only. Editing an older profile guides the
> user to complete missing required fields with no crash / no data loss. e2e:
> `training-profile.spec.ts` gained required-gate, equipment-≥1, "לא בטוח",
> optional-pass, and edit-missing-fields tests; existing flows updated to answer
> required steps — full suite **96 green**. See
> [`PERSONAL_PROFILE_V1.md`](PERSONAL_PROFILE_V1.md) ("V4 — Required core wizard
> answers").)
> Prior: Phase 4.3 (**Profile Onboarding V3 (UX) — premium modal + step
> wizard**: a presentation-only upgrade of the onboarding — **no** change to the
> profile schema/fields/meanings, `yfos:personal-profile:v1`, the sanitizer,
> backup/restore, the onboarding **session** gating, or the beta-welcome ordering.
> (1) The entry prompt (`components/profile/ProfileOnboardingPrompt.tsx`) became a
> **true centered modal** — centered both axes, dimmed+blurred backdrop
> (`bg-black/60 backdrop-blur-sm`), premium `rounded-[1.9rem]` card, `p-7`,
> `shadow-float`, `animate-zoom-in`, gradient icon badge; never a bottom sheet
> (scrolls on short screens but stays centered). Same behaviour: after beta welcome,
> not on public pages, not if a profile exists, "לא עכשיו" hides for the session,
> "בוא נתחיל" → `/training-profile`. (2) `/training-profile`
> (`components/profile/TrainingProfileView.tsx`) was rebuilt from one long form into
> a **step-by-step wizard**: intro → 10 one-question screens (goal · location ·
> frequency · duration · experience · equipment(multi) · personal-optional ·
> training-preference · guidance · notes) → summary/confirm, with a "שלב X מתוך 11"
> readout + gradient progress bar, **"הבא"/"חזור"** (last question reads "לסיכום"),
> every step optional, smooth scroll-to-top + `animate-fade-up` per step (no anim
> libs). Answers live in component state (`ProfileDraft`) and are written to storage
> **only** on final "שמור פרופיל" (`savePersonalProfile`) — an abandoned wizard never
> mutates the stored profile. **Edit (Option B):** an existing profile opens on the
> compact saved summary (hero + rows + optional "התאמה אישית"), "ערוך פרופיל" opens
> the same wizard pre-filled at step 1, "אפס פרופיל" stays confirm-gated. `app/
> training-profile/page.tsx` unchanged (its `PageHeader` still supplies the screen
> title). e2e: `training-profile.spec.ts` rewritten to drive the wizard (intro,
> one-question-at-a-time, next/back, complete+save, optional fields, edit, skip,
> reset, entry points); also hardened one latent race in `nutrition-photo.spec.ts`
> (wait for the review heading before reading draft inputs) surfaced by the heavier
> parallel suite — full suite **93 green**. See
> [`PERSONAL_PROFILE_V1.md`](PERSONAL_PROFILE_V1.md)
> ("V3 (UX) — Premium modal + step wizard").)
> Prior: Phase 4.2 (**Entry Flow V3 — beta welcome + profile prompt on
> every app entry**: changes only the *cadence/ordering* of the two onboarding
> surfaces — no schema, profile, backup, or auth/access change. The **beta welcome**
> is now gated **per session** (`lib/beta-welcome.ts` → sessionStorage
> **`yfos:beta-welcome-seen-session:v1`**, replacing the permanent localStorage
> `yfos:beta-welcome-seen:v1`, which is retained but **no longer read**), so it
> greets on **every app entry** — admins, approved testers, and guests alike (all
> via `useAppAccessGranted`) — without re-stacking on in-session route navigation; a
> new tab / fresh launch / new session greets again. The **profile onboarding
> prompt** dismissal is likewise **per session** (`lib/profile-onboarding.ts` →
> sessionStorage **`yfos:profile-onboarding-dismissed-session:v1`**, replacing the
> permanent `yfos:profile-onboarding-dismissed:v1`, retained but **no longer
> read**): "לא עכשיו" hides it for the session, and it may return on a later entry
> **while no profile exists** (once a profile exists it never shows). **Ordering** is
> enforced by the prompt already requiring `useBetaWelcomeSeen()`, so the beta
> welcome is always step one and the two never show at once. `BETA_WELCOME_INIT_SCRIPT`
> now checks the session key (no within-session flash). Settings "הצג הודעת בטא שוב"
> still works (reset clears the session flag, re-showing immediately); `WelcomeGate`
> stays persistent (out of V3 scope). **No** change to personal-profile schema /
> `yfos:personal-profile:v1` / profile form / backup-restore / workout / nutrition /
> water / supplement / protein / gym schemas / auth-beta-guest-admin-Supabase / AI
> routes / privacy-terms-ai-disclaimer / Today-Nutrition-Workouts layouts; no profile
> data cleared, no dismissal flag backed up, no new dependencies. e2e: new
> `e2e/beta-welcome.spec.ts` (beta welcome on entry, even with the legacy flag set;
> before the profile prompt; session flag set on ack; within-session reload doesn't
> re-show; fresh session re-greets; public pages show neither; non-granted sees
> nothing) + updated `e2e/profile-onboarding.spec.ts` (session keys, beta-open
> ordering, fresh-session re-show). See
> [`PERSONAL_PROFILE_V1.md`](PERSONAL_PROFILE_V1.md) ("V3 — Entry flow") and
> [`BETA_WELCOME_NOTICE.md`](BETA_WELCOME_NOTICE.md).)
> Prior: Phase 4.1 (**Personal Profile Onboarding V2**: makes the personal
> training profile an active first-entry experience instead of only a passive page,
> and expands it additively. (1) **Optional one-time onboarding prompt**
> (`components/profile/ProfileOnboardingPrompt.tsx`, mounted once in `app/layout.tsx`
> as the LAST step inside `WelcomeGate`, next to `AppShell`): a calm invitation
> "נכיר אותך כדי להתאים את החוויה?" with **"בוא נתחיל"** (→ `/training-profile`) and
> **"לא עכשיו"**; both record a dismissal in the new flag
> **`yfos:profile-onboarding-dismissed:v1`** (`lib/profile-onboarding.ts`, mirrors
> `lib/welcome.ts`). It appears ONLY when access is granted
> (`useAppAccessGranted`), the welcome screen AND beta welcome are both done, no
> profile exists, it wasn't dismissed, and the route isn't a public info page or
> `/training-profile` — so it never stacks on another modal, never shows before
> gates resolve, and **never blocks the app** (`z-95`, below the real gates). The
> `useAppAccessGranted` hook was **extracted verbatim** from `BetaWelcomeNotice`
> into the shared **`lib/app-access.ts`** (behaviour identical; single source of
> truth). (2) **Six additive OPTIONAL fields** on `TrainingProfile`
> (`adaptation`, `age`, `heightCm`, `weightKg`, `trainingPreference`,
> `guidanceStyle`) — all defensively sanitized, older profiles load unchanged.
> Measures are short strings, lenient digits-only input, **no BMI / body categories
> / "תקין·לא תקין" / labels / comparisons**; the adaptation field is
> "מין / התאמה — אופציונלי" with "מעדיף/ה לא לענות", never forced, never a medical
> claim. The `/training-profile` screen regrouped to **מטרה · שגרת אימון · ניסיון
> וציוד · התאמה אישית — אופציונלי · הערות** (improved notes helper), and the saved
> summary shows the optional "התאמה אישית" card **only when a field is filled** (no
> empty-field "missing" look). Entry-point copy refreshed (More: "המטרה, השגרה
> וההעדפות שלך"; Workouts: "ענה על כמה שאלות כדי שנוכל להציע כיוון מתאים בהמשך");
> Today still untouched. **Backup unchanged in code** — the `personalProfile`
> module already stores the whole profile object, so the new fields export/restore
> automatically; `backupVersion` stays **1**. **No** auto-program / AI plan / BMI /
> medical-diet logic; **no** change to workout/template/draft/FoodLog/nutrition/
> water/supplement/protein/gym schemas or celebrations, auth/beta/guest/admin/
> Supabase behaviour (access logic only extracted), AI routes, privacy/terms, the
> existing backup modules, the gate order, or Today's command center; no new
> dependencies. e2e: new `profile-onboarding.spec.ts` (prompt shows on first entry;
> "לא עכשיו" dismisses + persists across reload; "בוא נתחיל" opens the profile;
> never on public info pages; never once a profile exists) + an expanded
> `training-profile.spec.ts` (optional fields save + summary; empty optional fields
> show no section) — full suite **82 passed**. See
> [`PERSONAL_PROFILE_V1.md`](PERSONAL_PROFILE_V1.md) (V2 section).)
> Prior: Phase 4.0 (**Personal Profile V1 — Personal Training Profile**:
> the first **safe personalization layer**. A new optional, fully editable
> profile screen at **`/training-profile`** ("פרופיל אימון אישי") collects a few
> short, supportive questions — `goal` (מטרה), `location` (מקום אימון),
> `weeklyFrequency` (תדירות), `experience` (רמת ניסיון), `workoutDuration`
> (זמן אימון), `equipment` (**multi-select**), and free-text `notes` — and shows a
> saved summary with **"ערוך פרופיל"** / confirm-gated **"אפס פרופיל"** and a safe
> future-facing note. It only **collects and displays**: **no** auto-generated
> program, **no** medical/diet/fitness prescription, **no** body-shape/weight/
> body-shaming fields or comparisons (age/height/weight/gender deliberately
> **omitted** in V1). Stored under a new additive key
> **`yfos:personal-profile:v1`**, owned by `lib/personal-profile.ts` (own
> fail-safe + SSR-safe storage, defensive `sanitizeProfile` parser, and a
> `useSyncExternalStore` reactive layer — mirrors `lib/gym-attendance.ts`).
> **Included in Backup & Restore** as an additive `BACKUP_MODULES` entry
> (`personalProfile`, label "פרופיל אימון אישי"); `backupVersion` stays **1**
> (older backups omit the field and restore unchanged), restore writes raw while
> reads sanitize, and the preview gained a `personalProfileIncluded` flag/row.
> Cleared by `resetAll` (outside `STORAGE_KEYS`, so `fitness-store.resetAll` calls
> `clearPersonalProfile()` explicitly, like gym). Entry points: a real card in the
> System Hub **מערכת** group and a quiet **"התאם את חוויית האימונים"** card on
> `/workouts`; **Today was intentionally left untouched** (already dense). The
> "עוד" tab also lights up on `/training-profile`. The profile is **optional and
> non-blocking** — no forced onboarding, the app works normally without it. **No**
> change to workout/template/active-draft/FoodLog/nutrition/water/supplement/
> protein/gym schemas, localStorage keys, existing backup behaviour (beyond the
> additive module), auth/beta/guest/admin/Supabase, AI routes, or privacy/terms;
> no new dependencies. e2e: new `training-profile.spec.ts` (renders form; fill +
> save → summary; saved profile edits; skip returns to Today without breaking the
> app; More + Workouts entry-point links) — full suite **76 passed**. See
> [`PERSONAL_PROFILE_V1.md`](PERSONAL_PROFILE_V1.md).)
> Prior: Phase 3.xx (**Workouts Clarity Pass — Part 1**: a UX
> clarity/layout/copy pass on the `/workouts` hub — no new features, no schema /
> localStorage-key / backup-format / behavior changes. All edits are in
> `components/workouts/WorkoutsView.tsx`. The hub now reads as a training
> **command center** weighted top-down: an in-progress draft
> (`DraftRestoreCard`, **"המשך אימון"**) leads; the hero replaces the single vague
> **"אימון חדש"** with a clear **primary "התחל אימון"** (free workout,
> `openBuilder(null)`) + **secondary "צור תבנית חדשה"** (`setEditingTemplate("new")`);
> when a meaningful draft exists the hero's start steps **down** to the secondary
> Button variant (off the strength gradient) so "המשך אימון" alone owns the
> primary weight. Templates are the **main content** directly under the command
> area, with a new `SectionHeader` `hint` — **"בחר תבנית מוכנה והתחל להתאמן"**
> (shown only when templates exist); title **"תבניות אימון"** and the
> **"תבנית חדשה"** action are unchanged, and the app keeps **"תבנית"** terminology
> everywhere (no switch to "תכנית"). The **gym attendance** card moved from above
> the templates to **below** them (still a quiet `/gym` link; subtitle sharpened to
> **"כניסה, יציאה וזמן שהייה — בנפרד מהאימון"**) — no gym logic/schema/same-day
> change. The large empty **workout-history** card (which duplicated the top CTA)
> is now a **calm, compact dashed** empty state — **"כאן ייבנה סיפור הכוח שלך"**
> with no competing CTA. **No** change to workout/template/draft/gym/nutrition/
> water/supplement schemas, localStorage keys, backup format, auth/beta/guest/
> admin/Supabase/AI routes, privacy/terms, active-draft recovery,
> start-from-template, create/edit/delete template, history, gym check-in/out,
> exercise reorder, save-as-template, or the water/supplement/protein/Today/
> Nutrition clarity work; no new dependencies. e2e: new
> `workouts-command-hierarchy.spec.ts` (command center primary/secondary; draft
> leads above the hero and softens it; templates render their own "התחל אימון";
> gym link stays secondary; empty history is calm with no duplicate CTA) — full
> suite **70 passed**. See [`WORKOUTS_CLARITY_PASS.md`](WORKOUTS_CLARITY_PASS.md).)
> Prior: Phase 3.xx (**Protein Goal Celebration**: a new app-wide,
> one-shot moment that plays when today's logged protein crosses into the user's
> **configured** daily protein goal (`Settings.proteinGoal`) — distinct in
> meaning and theme from the water-goal (water goal) and supplement-taken (single
> item logged) celebrations. New event seam `lib/protein-goal-events.ts`
> (`yfos:protein-goal-reached`, `maybeCelebrateProteinGoalCrossing` fires **only**
> on the below→at-or-above edge, safe on zero/missing goal), a
> `ProteinGoalCelebrationOverlay` mounted once in `AppShell`
> (`pointer-events-none`, `aria-hidden` visuals + a `role="status"` SR
> announcement, self-dismisses ~1.4s), and `protein-celebrate-*` CSS in
> `globals.css` (new warm amber/gold `--accent-protein*` tokens) with a
> `prefers-reduced-motion` static-glow fallback. The trigger is centralized in the
> existing `addFoodLog` store mutation, so every add surface (manual add, food
> library, `הוסף שוב` recents/journal, and AI drafts confirmed through the normal
> flow) celebrates identically — **no parallel food-logging path**. Theme is a
> warm amber/gold + cream glow, a **target** badge on the protein gradient,
> drifting macro rings, and warm-gold sparkles (no water-blue, no capsules, no red
> warning, no body/medical imagery). On-screen copy **`יעד החלבון הושלם`**;
> SR copy **`כל הכבוד, יעד החלבון של היום הושלם`** — neutral, tied to the user's
> own target, **no** medical/diet claim (`חובה`/`צריך`/`מומלץ לאכול`/
> `הגעת לכמות שאתה צריך`/`כדי לרדת במשקל` explicitly avoided). It does **NOT** fire
> on render, hydration, loading existing logs, adding more once already met,
> removing food, backup restore, or a zero/missing goal; remove-below → re-cross
> may fire again (**no per-day flag** — the crossing edge over real food-log
> totals is the guard, so **no new persisted state / no backup-schema change**).
> **No** change to `FoodLog` schema, nutrition localStorage keys, macro/summary
> calculations, the AI draft flow (no auto-save, no photo storage), backup format,
> water/supplement celebrations, workout/gym schemas, auth/beta/guest/admin/
> Supabase, AI routes, or privacy/terms; no new dependencies. e2e: new
> `protein-celebration.spec.ts` (load with goal met = no overlay; below-goal add
> no-op; manual add crossing shows `יעד החלבון הושלם`; add while over no-op;
> `הוסף שוב` crossing fires; remove-below then re-add fires again). See
> [`PROTEIN_GOAL_CELEBRATION.md`](PROTEIN_GOAL_CELEBRATION.md).)
> Prior: Phase 3.xx (**Supplement Taken Celebration**: a new app-wide,
> one-shot success moment that plays when a supplement is marked **taken today**
> — distinct in meaning and theme from the water-goal celebration (water =
> reaching a daily goal; supplement = confirming a single item was logged). New
> event seam `lib/supplement-events.ts` (`yfos:supplement-taken`,
> `maybeCelebrateSupplementTaken` fires **only** on the not-taken → taken edge),
> a `SupplementTakenCelebrationOverlay` mounted once in `AppShell`
> (`pointer-events-none`, `aria-hidden` visuals + a `role="status"` SR
> announcement, self-dismisses ~1.3s), and `supplement-celebrate-*` CSS in
> `globals.css` with a `prefers-reduced-motion` static-glow fallback. The trigger
> is centralized in the existing `toggleSupplementTaken` store mutation, so every
> surface (Today's `SupplementsCard`, the `SupplementsTracker` screen, any
> quick-action) celebrates identically — **no parallel storage path**. Theme is a
> calm mint/emerald + violet glow, a check badge on the supplement gradient,
> drifting capsules, and warm-gold sparkles (no clinical imagery, no water-blue).
> Copy is neutral: **`{name} הוזן בהצלחה`** — a "logged successfully"
> confirmation only, **no** recommendation/dosage/health claim
> (`מומלץ`/`בריא`/`חובה`/`טוב לגוף` explicitly avoided). It does **NOT** fire on
> render, hydration, loading existing logs, re-tapping an already-taken item,
> un-marking, backup restore, or settings changes; un-mark → re-mark may fire
> again (no per-day flag — the toggle state is the guard, so no new persisted
> state / no backup-schema change). **No** change to supplement/log schema,
> localStorage keys, backup format, water/nutrition/workout/gym schemas, the
> water celebration, auth/beta/guest/admin/Supabase, AI routes, or privacy/terms;
> no new dependencies. e2e: new `supplement-celebration.spec.ts` (load = no
> overlay; mark on Today shows `קריאטין הוזן בהצלחה`; mark on the Supplements
> screen shows `ויטמין D הוזן בהצלחה`; re-tap/un-mark no-ops; un-mark → re-mark
> fires again). See [`SUPPLEMENT_TAKEN_CELEBRATION.md`](SUPPLEMENT_TAKEN_CELEBRATION.md).)
> Prior: Phase 3.xx (**Nutrition Clarity Pass — Part 2**: a
> presentation/copy-only hierarchy pass on `/nutrition` (`NutritionView`) that
> makes the screen read as a food-logging command center. The add actions are now
> grouped into a single **`הוספת אוכל`** section (helper `בחר איך לרשום את הארוחה
> שלך`) with an explicit order: **primary** `סרוק צלחת` card (active or inert
> `בקרוב`) + attached `איך עובד ניתוח AI?` link → **secondary** two-up `הוסף ידנית`
> (`/nutrition/add`) + `בחר מהמאגר` (`/nutrition/library`) → **shortcut** full-width
> `הוסף שוב` (disabled with `אין עדיין ארוחות אחרונות` when no recents). `בחר מהמאגר`
> is now a first-class command-area action (QA `openPicker` clicks the first match).
> The journal was renamed **`היומן של היום` → `יומן האוכל של היום`** (its empty state
> is now calm + button-free, since the command area owns every add action); the QA
> heading assertion in `qa/food-library-check.mjs` was updated to match. **`מועדפים`**
> chips moved to their own compact section **below** the journal; **`מעקבים נוספים`**
> (water + supplements) stays lower and clearly secondary; `MacroSummary` padding
> tightened `p-5`→`p-4`. **No** change to `FoodLog` schema, localStorage keys, backup
> format, AI route/activation, photo storage, macro/water/supplement logic, or save
> behaviour; food photos still never stored; AI results never auto-saved. e2e: two
> new Part-2 assertions (command area + summary/secondary-trackers) and the renamed
> empty-journal test (53 passed). See [`NUTRITION_CLARITY_PASS.md`](NUTRITION_CLARITY_PASS.md).)
> Prior: Phase 3.xx (**Nutrition Clarity Pass — Part 1**: a
> presentation/copy-only hierarchy pass on `/nutrition` (`NutritionView`). The
> screen reads top-down as a food-logging command center — (1) `MacroSummary`,
> (2) photo-first **`סרוק צלחת`** primary (or inert **`בקרוב`**
> `PhotoScanCardDisabled` when AI is off) with the `איך עובד ניתוח AI?` helper
> link directly beneath it, (3) fast fallbacks `הוסף שוב` + `הוסף ידנית` with
> recents/favorites secondary, (4) **`היומן של היום`** source-of-truth diary,
> (5) **`מעקבים נוספים`** (water + supplements), (6) tools. This pass tightened
> two rough edges: the **empty journal** no longer repeats `הוסף ידנית` (already
> a quick action above) — it shows calm copy `עדיין לא נרשם אוכל היום` /
> `הוסף ארוחה כדי להתחיל לעקוב — פעולות ההוספה נמצאות למעלה.` plus a single
> distinct **`בחר מהמאגר`** catalog CTA; and the disabled scan card's helper line
> now names an always-available fallback
> (`בינתיים אפשר להוסיף ידנית או לבחור מהמאגר`, was `…או להשתמש ב־הוסף שוב`, which
> needs prior meals). **No** change to `FoodLog` schema, localStorage keys, backup
> format, AI route/activation, water/supplement/auth/gate behaviour, or macro
> calculations; food photos still never stored; AI results never auto-saved. e2e:
> two new disabled-page assertions (empty-journal copy + catalog fallback). See
> [`NUTRITION_CLARITY_PASS.md`](NUTRITION_CLARITY_PASS.md).)
> Prior: Phase 3.xx (**Beta Access Requests**: the Beta Access System
> gained a self-service request + approval loop. An unapproved signed-in user now
> sees a **`בקש גישה`** CTA on the denied screen (`BetaAccessDenied`) that files a
> row in a new **`beta_access_requests`** queue (status `pending`); the screen
> then shows a calm pending / already-sent / rejected state. Admins see a
> **`בקשות גישה ממתינות`** section and a `ממתינים` count in `/admin/beta`
> (`BetaAdminView`) and can **אשר** (approve — atomically writes/reactivates an
> active `beta_allowed_users` row via the SECURITY DEFINER `approve_beta_request`
> RPC, marks the request approved), **דחה** (reject — `reject_beta_request` RPC,
> no access granted), or **מחק**. The request table is a **queue only** —
> `beta_allowed_users` stays the single source of truth for entry, so a forged
> request row grants nothing. RLS: a user reads/inserts only their OWN request and
> only as `pending` (no update/delete), and **cannot self-approve** (status
> changes are admin-only RPCs that re-check `is_beta_admin()` server-side). Blocked
> users still see the blocked screen (no request CTA), so they cannot bypass by
> re-requesting. Enforcement is Row Level Security (`supabase/beta-access.sql`);
> browser uses only the public anon key; no service-role key. **No fitness data
> moved to the cloud** — only request/access metadata lives in Supabase. Rerun the
> SQL to upgrade existing installs (`create table if not exists` + safe
> `drop/create policy`). See [`BETA_ACCESS_SYSTEM.md`](BETA_ACCESS_SYSTEM.md).)
> Prior: Phase 3.xx (**Today Product Clarity Pass — Part 3**: a hierarchy
> pass on the Today command area, presentation/copy only. (1) **What is live now
> leads** — an active gym visit and/or in-progress workout draft are reordered
> ABOVE the suggested next-action card so a session already in progress is never
> buried under a generic prompt. (2) **`הפעולה הבאה`** keeps its `הפעולה הבאה שלך`
> label but gains a clarifying `· כדי להתקדם היום` "why" line; the label row now
> wraps so it can't overflow at 360 px. (3) **`מבט מהיר` vs `פעולות מהירות`** are
> given distinct one-line helpers (`סטטוס קצר של היום` vs `פעולות שאפשר לבצע עכשיו`)
> via a new optional `hint` on `SectionHeader`, making the status-vs-actions split
> explicit; the quiet status cells already read differently from the premium action
> tiles. **No** `lib/today.ts` next-action logic, `lib/gym-attendance.ts` logic,
> storage keys, schemas, backup format, routes, gates, or save behaviour changed;
> all Part 1/2 + water + active-workout + gym-copy behaviour preserved. Today e2e
> spec extended (49 passed). See [`TODAY_CLARITY_PASS.md`](TODAY_CLARITY_PASS.md).)
> Prior: Phase 3.xx (**Today Product Clarity Pass — Part 2**: a follow-up
> affordance/copy pass after real-UI feedback that the Part 1 collapsible
> `סיכום היום` row looked static (users couldn't tell it was tappable). The bare
> heading-row toggle is now a **full card-like `<button>`** that unmistakably
> reads as an expandable control: a leading `ListIcon` tile, a `הצג פירוט תזונה
> ואימון` → `פירוט תזונה ואימון` subtitle, the protein hint demoted to a small
> pill, and an explicit `פתח`/`סגור` action chip with an up/down `ChevronDownIcon`
> that rotates 180° when open. The whole card is the tap target; affordance never
> relies on the chevron or colour alone. Wired for a11y: native button,
> `aria-expanded`, and `aria-controls="today-summary-panel"` (matching `id` on the
> revealed panel). Presentation only — summary still collapsed by default, the
> expanded nutrition + workout cards unchanged, and active gym/workout promotion,
> state-aware gym copy, water reset + over-goal states, and quick actions all
> preserved. **No** `lib/today.ts` / `lib/gym-attendance.ts` logic, storage keys,
> schemas, backup format, routes, gates, or save behaviour changed. The Today
> e2e spec was extended (still 47 passed). See
> [`TODAY_CLARITY_PASS.md`](TODAY_CLARITY_PASS.md).)
> Prior: Phase 3.xx (**Today Product Clarity Pass — Part 1**: a UX
> clarity/hierarchy pass on the Today screen so it reads as a daily command
> center, not a stack of same-weight cards. Two changes, presentation only:
> (1) **`סיכום היום` is demoted to a collapsible section, closed by default** —
> it duplicated the compact `מבט מהיר` status strip at full visual weight, so the
> detailed nutrition + workout cards now hide behind a toggle (`aria-expanded`)
> whose header still surfaces the one fact the strip lacks (protein-toward-goal,
> e.g. `נותרו 80 ג׳ חלבון`). (2) **Gym card copy is state-aware**: when a visit
> was already saved today the primary action is now **`צפה בביקור היום`**
> (link to `/gym`) with a quiet `נכנסתי שוב למכון` re-entry path, instead of a
> bold `נכנסתי למכון` that sounded like a duplicate check-in — the same-day
> re-entry confirmation dialog is unchanged. The active gym visit and in-progress
> workout draft stay promoted directly under Next Action. **No** `lib/today.ts` /
> `lib/gym-attendance.ts` logic, storage keys, schemas, backup format, routes,
> gates, or save behaviour changed; water + active-workout behaviour preserved.
> `e2e/today-command-center.spec.ts` added (5 specs); full e2e 47 passed. See
> [`TODAY_CLARITY_PASS.md`](TODAY_CLARITY_PASS.md).)
> Prior: Phase 3.xx (**Disabled nutrition scan card**: when AI is **not**
> configured, `/nutrition` no longer hides the scan slot — it shows a calm,
> inert **`בקרוב`** "coming soon" card (`PhotoScanCardDisabled` in
> `components/nutrition/PhotoScanCard.tsx`) so users see the feature exists.
> Active vs disabled is chosen by `aiEnabled` in `NutritionView`; the disabled
> card mounts **no** file input, has **no** click handler/overlay, and **never**
> calls `POST /api/nutrition/analyze-photo` — manual add + `הוסף שוב` stay visible
> and usable directly below. Copy: title `סרוק צלחת`, subtitle
> `ניתוח ארוחה מתמונה יופעל בקרוב`, trust line
> `בינתיים אפשר להוסיף ידנית או לבחור מהמאגר`, `בקרוב` badge, disabled
> `לא פעיל כרגע` button; a non-prod-only dev/admin helper
> (`showSetupHint` from `app/nutrition/page.tsx`) adds
> `הפיצ׳ר מוכן, אבל עדיין לא חובר מפתח AI בסביבת הפרודקשן.`. `/nutrition` stays
> `force-dynamic`, so adding a key later flips the card to active with no rebuild.
> **No** AI provider/route/server-env/`FoodLog`/localStorage/backup/Supabase/auth
> change. e2e now builds once then runs two `next start` servers — :3939 (mock,
> active) + :3940 (no AI, disabled, `e2e/nutrition-photo-disabled.spec.ts`) via
> `scripts/e2e.mjs`. See [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md).)
> Prior: Phase 3.xx (**Nutrition Photo Assist — photo-first logging**: `/nutrition`
> is now **scan-first**. When AI is configured a large **`סרוק צלחת`** card is the
> primary action (under `MacroSummary`); the user photographs a meal, a server
> route returns an **editable draft**, and only on **`נראה טוב, הוסף ליומן`** is the
> entry saved. Manual add + **`הוסף שוב`** (recents folded in) stay as always-visible
> fallbacks; water/supplements/protein/library move into lower `מעקבים נוספים` /
> `כלים נוספים` bands. New: `app/api/nutrition/analyze-photo/route.ts` (GET
> capability + POST analyze, `nodejs`/`force-dynamic`), `lib/nutrition-ai.ts`
> (**server-only** adapter, `fetch` to a vision model, mock seam), `lib/nutrition-photo.ts`
> (client-safe types/validation/mapping), `components/nutrition/PhotoScanCard.tsx`
> + `PhotoDraftReview.tsx`. Hard rules enforced: **estimate-only** (`הערכה בלבד`,
> per-item confidence), **no auto-save**, **no image storage**, **no AI key in the
> client** (server-only `NUTRITION_AI_API_KEY`/`ANTHROPIC_API_KEY`; `NUTRITION_AI_MODEL`;
> `NUTRITION_AI_MOCK=1` dev seam). **No key → scan card shows an inert `בקרוב`
> state** (see the Latest entry; `isNutritionAiConfigured` gates active vs
> disabled via `aiEnabled`), no dead CTA, manual/recent work normally. A
> confirmed draft maps onto the existing `FoodLog` and is written via the existing
> `addFoodLog` → `yfos:foodLogs`: **no new storage key, no schema change, no
> Supabase/DB change, no backup change**; photo entries appear in the summary,
> diary, recents and export like any other. `BetaAuthGate`/guest/admin rules
> unchanged. Added devDependency usage: Playwright e2e (`e2e/nutrition-photo.spec.ts`,
> `playwright.config.ts`). See [`NUTRITION_PHOTO_ASSIST.md`](NUTRITION_PHOTO_ASSIST.md).)
> Prior: Phase 3.xx (**Beta Welcome Notice**: the old `PrivateAccessNotice`
> ("מערכת פרטית / do not share the link") was removed from the active gate chain
> and replaced by a warm, friendly `BetaWelcomeNotice`
> (`components/access/BetaWelcomeNotice.tsx`, z-104, `lib/beta-welcome.ts`,
> `yfos:beta-welcome-seen:v1`) shown once AFTER the real access gate lets a user
> (approved or guest) in. Access is now controlled by login + approved emails, so
> the onboarding message welcomes testers and shares Yuval's contact
> (053-333-9341 / wa.me/972533339341) instead of warning about sharing links. No
> auth/security/database/user-data schema changed. See
> [`BETA_WELCOME_NOTICE.md`](BETA_WELCOME_NOTICE.md).)
> Prior: Phase 3.xx (**Beta Access System**: real access control. A new
> Supabase-Auth gate (`components/access/BetaAuthGate.tsx`, z-108) is now the REAL
> beta boundary — a user must sign in (Google / email magic link) **and** be on the
> approved-email list (`beta_allowed_users`, status `active`) to enter; not
> approved → `BetaAccessDenied`, blocked → blocked screen. Admins
> (`beta_admins`) manage the list from an in-app panel at **`/admin/beta`**
> (`components/admin/BetaAdminView.tsx`); the entry point appears only for admins
> in Settings → "חשבון בטא" and the System Hub. Enforcement is Row Level Security
> (`supabase/beta-access.sql`); the browser uses only the public anon key; no
> service-role key, no custom passwords. The app **builds/runs with no env vars**
> — missing config fails **closed** in production (and shows a dev setup screen
> with a continue button locally); `NEXT_PUBLIC_BETA_DISABLE_GATE=1` is a
> testing-only seam. Sign-out (Settings) offers keep-or-clear local data. The
> legacy client-side admin code gate (`yuvalzakay123`) was removed from the
> production chain (files kept as a dev fallback). **No fitness data moved to the
> cloud** — workouts/nutrition/water/supplements/gym/backup all stay
> localStorage-only; no schema/storage/route/nav regressions. Added dependency:
> `@supabase/supabase-js`. See [`BETA_ACCESS_SYSTEM.md`](BETA_ACCESS_SYSTEM.md).)
> Prior: Phase 3.xx (Today **command-center polish**: a UI/UX hierarchy +
> compactness pass that de-duplicates Today's CTAs and sharpens the top-down
> order. A new **active-state slot** sits directly under the Next Action card: a
> **live gym visit** is promoted there (`GymTodayCard`'s `אתה במכון עכשיו` live
> state — and the lower `נוכחות במכון` idle section is then suppressed so it never
> shows twice), alongside a read-only `ActiveWorkoutResumeCard` (`אימון בתהליך`)
> for an in-progress workout draft. The full water card is hidden while water is
> the current Next Action (status stays in the `מבט מהיר` strip; the compact card
> returns once water is logged); the supplements card mounts only when supplements
> are configured (no dominating empty state); the nutrition summary lost its
> duplicate `הוסף אוכל` CTA grid; quick actions are compacted. TodayView only
> *reads* `useActiveGymVisit()` for placement — gym check-in/out logic, and
> `lib/today.ts` (Next Action + completion), are unchanged. No storage keys /
> schemas / routes / save behaviour / nav / gates changed; no
> backend/auth/AI/API/database/cloud/GPS/native and no new dependencies. All
> actions remain reachable. See
> [`TODAY_COMMAND_CENTER_POLISH.md`](TODAY_COMMAND_CENTER_POLISH.md).
> Prior: Phase 3.xx (**Nutrition Quick Reuse**: the Nutrition screen
> (`components/nutrition/NutritionView.tsx`) now makes daily logging fast with
> one-tap reuse. A new **`אכלת לאחרונה`** section shows a compact, scrollable row
> of recently-logged foods (name, meal-type, quantity, calories, P/C/F) each with
> a **`הוסף שוב`** button, and every *היומן של היום* row gained its own `הוסף שוב`
> action. Tapping it duplicates that entry into today's journal — a **new id** +
> today's local date, all other values preserved, the **original never mutated** —
> and shows a calm auto-dismissing **`נוסף ליומן של היום`** toast. Recent foods are
> derived **purely from the existing `yfos:foodLogs` history** via the new pure
> `lib/nutrition-reuse.ts` (`getRecentFoodEntries` / `createFoodLogFromExistingEntry`
> / `normalizeRecentFoodKey`, de-duped by source-id-or-name + quantity + macros,
> capped at 8) — **no new storage key, no `FoodLog` schema change**. The old
> "אחרונים" deep-link chips (which forced re-entering values) were replaced by this
> richer reuse section; the previous `recentFoods()` helper moved out of
> `lib/analytics.ts`. Favorites and saved values stay separate and untouched;
> Backup & Restore is unchanged (recent list re-derives after a restore). Today and
> the Add-Food screen were intentionally not cluttered. localStorage-only, no
> backend/auth/AI/API/cloud/native. See
> [`NUTRITION_QUICK_REUSE.md`](NUTRITION_QUICK_REUSE.md).
> Prior: Phase 3.xx (**Gym Check-In polish**: the Today gym card
> (`GymTodayCard`) is now a **prominent primary-routine card** — idle shows the
> day status (`עדיין לא נכנסת למכון היום` / `כבר נשמר ביקור במכון היום`) with
> `נכנסתי למכון`; active shows a strong live state (`אתה במכון עכשיו`, entry time
> + live `HH:MM:SS` `משך שהייה`, `סיים שהייה במכון`). Saved visits on `/gym` now
> show richer details (check-in date, `כניסה`/`יציאה` times, worded duration, and
> a **linked-workout** summary). At check-out, workouts saved **during the visit's
> local-day window** are snapshotted onto the visit as a display-only
> `GymVisit.workouts?` (workout history is never read back or altered; a workout is
> never required to finish a visit). A **same-day re-entry guard** prevents
> accidental duplicates: while a visit is open there is no check-in path, and after
> a visit was already completed today a check-in asks
> `כבר נשמר ביקור במכון היום` before starting another. The optional `workouts`
> field is additive — old visits load and restore unchanged (`backupVersion` stays
> `1`); the linked-workout line shows `לא קושר אימון לביקור הזה`. No workout/
> nutrition schema, save-behavior, backup-format, or bottom-nav changes;
> localStorage-only, no backend/auth/AI/API/cloud/GPS/native. See
> [`GYM_CHECK_IN.md`](GYM_CHECK_IN.md).
> Prior: Phase 3.xx (**Gym Check-In / Check-Out**: a new `/gym` screen
> (`components/gym/GymView.tsx`, `lib/gym-attendance.ts`) tracks **gym
> attendance** — manual check-in when you enter the gym and check-out when you
> leave — kept fully **separate from workout logging**. A *workout session* is
> exercises/sets/kg/reps; a *gym visit* is only being at the gym: entry time,
> exit time, date, duration. Check-in creates a single active visit
> (`אתה במכון` + entry time + a live `HH:MM:SS` timer); check-out saves a
> `GymVisit` to history (`השהייה נשמרה`). The active visit persists in
> localStorage and the timer is **derived from `startedAt`**, so it survives
> refresh / app close. A visit open ≥ 6h shows a calm "forgot to check out?"
> prompt — it is **never auto-closed** and an exit time is **never guessed**;
> **no GPS / no location** is ever used. Deleting the open visit or a saved
> visit are both confirm-gated. Two new additive keys
> (`yfos:gym-visits:v1`, `yfos:active-gym-visit:v1`) are owned by
> `lib/gym-attendance.ts` (own `useSyncExternalStore` layer, mirroring the
> active-workout draft) — outside `STORAGE_KEYS`, but **included in Backup &
> Restore** (`gymVisits` / `activeGymVisit`) and cleared by "reset all data".
> Surfaced on Today (compact quick card), the System Hub *כושר* group, the
> Workouts screen, and Progress (compact attendance stats). No workout/nutrition/
> water/supplement schema, save-behavior, draft, or bottom-nav changes;
> localStorage-only, no backend/auth/AI/API/cloud/native. See
> [`GYM_CHECK_IN.md`](GYM_CHECK_IN.md).
> Prior: Phase 3.xx (**Backup & Restore**: a new `/backup` screen
> (`components/backup/BackupView.tsx`, `lib/backup.ts`) lets the user export all
> their Fit OS data to a private `fit-os-backup-YYYY-MM-DD.json` file and import
> it back. Local JSON export/import only — **no backend, no auth, no cloud, no
> encryption**. Export uses a Blob download with a copy-text / show-text fallback
> for download-blocking WebViews; restore validates the whole file first, shows a
> counts **preview**, requires an explicit `ConfirmDialog`, then writes to
> `localStorage` and prompts a reload. Backup includes the nine user-data keys +
> the active-workout draft (driven by `BACKUP_MODULES`, mapped to the real
> `STORAGE_KEYS`); it **excludes** the welcome/private/admin gate flags and its
> own bookkeeping key. One new additive key `yfos:backup-meta:v1`
> (`lastExportedAt` / `lastRestoredAt`) surfaces last-backup status via a
> `useSyncExternalStore` layer. Reachable from Settings (*נתונים ואחסון*) and the
> System Hub *מערכת* group; not in the bottom nav. No schema / existing
> storage-key / route (beyond adding `/backup`) / save-behavior changes;
> localStorage-only. See [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md).
> Prior: Phase 3.xx (**Progress Insights upgrade**: the Progress screen
> (`/progress`) is no longer a static stats grid — it now leads with a premium
> weekly hero (`השבוע שלך`: one calm motivating line + compact
> אימונים/מים/חלבון metrics), then rule-based weekly insight cards
> (`תובנות השבוע`), a compact 7-day Sun→Sat activity grid (`מגמות שבועיות`,
> CSS-only — filled/empty/future per day), and a stronger personal-records
> section (`שיאים אישיים`: ranked, trophy on #1, muscle group + reps context).
> Cold `—` placeholders were replaced with short human empty states (e.g.
> `אין מספיק נתוני מים השבוע`, `הוסף עוד יומיים של תזונה כדי לראות ממוצע`). All
> insights are deterministic derivations over existing local data in the new pure
> `lib/progress-insights.ts` (`weeklyHero` / `weeklyInsights` / `weeklyActivity` /
> `personalRecords`) — NO AI, NO advice, NO new data model. No schema /
> storage-key / route / navigation / Today / save-behavior changes;
> localStorage-only, no backend/auth/AI/API. See
> [`PROGRESS_INSIGHTS_UPGRADE.md`](PROGRESS_INSIGHTS_UPGRADE.md).
> Prior: Phase 3.xx (Active workout **collapsible exercise cards**: each
> exercise card in the builder now has a small chevron toggle (`הצג סטים` /
> `הסתר סטים`, `aria-expanded`) that minimises it to a premium muscle-tinted
> compact summary (`X סטים · Y מתוך X בוצעו`, plus the shared header image / name
> / muscle / previous-performance / `עכשיו`·`הושלם` badges) and expands it back
> to the full kg/reps/completed editing card — so a 4–6 exercise session stops
> being an endless scroll. A single `מזער הכל` / `פתח הכל` control collapses or
> expands everything at once. **Collapse is visual only**: it lives in
> component-local state keyed by `exerciseId`, never enters `entries`, the draft,
> or saved history, never triggers a draft write, and never touches a
> kg/reps/completed value. New exercises start expanded; nothing auto-collapses;
> reorder mode hides the collapse controls and preserves each card's state on
> exit; a restored draft comes back fully expanded with all values intact. No
> schema / storage-key / payload / routes / draft-shape changes; localStorage-only,
> no backend/auth/AI/API. See
> [`ACTIVE_WORKOUT_COLLAPSIBLE_CARDS.md`](ACTIVE_WORKOUT_COLLAPSIBLE_CARDS.md).
> Prior: Phase 3.xx (Active workout **auto-save draft**: the in-progress
> session is auto-saved locally under a new key `yfos:active-workout-draft:v1` so
> leaving the builder before `סיים ושמור אימון` no longer loses data. On return a
> premium restore card (`נמצא אימון שלא נשמר`) offers `המשך אימון` / `מחק טיוטה`;
> a calm `נשמר אוטומטית` status shows in the session hero. The draft is separate
> from history — final save clears it and still appends exactly one
> `WorkoutSession`; empty/untouched builders never create a prompt; a
> new/template session that meets an existing draft shows a conflict choice
> instead of silently overwriting it. No history schema / storage-key / payload /
> routes / final-save changes; localStorage-only, no backend/auth/AI/API.
> See [`ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md`](ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md).
> Prior: Phase 3.xx.2 (Active workout reorder — **drag motion polish**:
> the dragged exercise now lifts into a **floating overlay clone** that follows
> the pointer in **both X and Y** (`scale(1.03)` + identity glow) while the source
> row stays as a faded, dashed **ghost placeholder**; order is still computed from
> the pointer's Y / row midpoints, so the floating card can roam horizontally for
> a natural, physical feel without changing where the entry lands. The overlay is
> portaled with `position: fixed` and positioned from the live pointer
> coordinates, so it never jumps when the array reorders and ignores transformed
> ancestors. Still dependency-free Pointer Events — no new libraries, no visible
> up/down buttons, keyboard ArrowUp/ArrowDown/Home/End still works. Behaviour is
> unchanged: order is just the `entries` array order; reordering relocates the
> whole entry, so kg/reps/completed stay attached and the `עכשיו`
> current-exercise badge recalculates. No schema / storage / save-payload /
> routes changes. See [`ACTIVE_WORKOUT_REORDER.md`](ACTIVE_WORKOUT_REORDER.md).
> Prior: Phase 3.xx.1 reorder drag-only UI polish — the on-row up/down arrow
> buttons were removed for a clean drag-only list (grip handle + Pointer-Events
> drag, ArrowUp/ArrowDown on the focused handle for keyboard accessibility).
> Prior: active workout exercise reorder shipped (the reorder mode itself).
> Prior: Today quick start & priority-action upgrade: Today
> now leads with a deterministic `הפעולה הבאה שלך` next-action card and an
> optional-aware daily completion summary — supplements no longer make the day
> feel incomplete when none are configured. Pure read-only derivation in the new
> `lib/today.ts`; no storage/data-model/routes/logic changes, no AI, no
> recommendations, not Personal Path. See [`TODAY_QUICK_START.md`](TODAY_QUICK_START.md).
> Earlier: active workout session premium UX upgrade — the workout builder is now a
> focused "live" session (identity-coloured hero, muscle-aware exercise cards,
> "עכשיו" highlight, premium "סיים ושמור אימון" CTA; presentation only). See
> [`ACTIVE_WORKOUT_SESSION_UX.md`](ACTIVE_WORKOUT_SESSION_UX.md). Earlier:
> navigation & System Hub upgrade — Exercises moved into the premium `/more`
> "מרכז מערכת" hub; bottom nav is Today / Workouts / Nutrition / Progress / More.)

---

## 1. What it is

A personal, mobile-first fitness operating system for one user (Hebrew RTL UI,
English code). It tracks workouts, exercises, nutrition, water and supplements,
plus a small knowledge center. It is a Next.js (App Router) PWA with **no
backend** — all data lives in the browser under `yfos:*` storage keys.

- **UI language:** Hebrew, right-to-left (`<html lang="he" dir="rtl">`).
- **Code language:** English (types, functions, comments).
- **Persistence:** `localStorage` + one `sessionStorage` key. No server, no auth,
  no database, no cloud sync, no AI, no external runtime APIs.
- **Theme:** light / dark only (the old "system" mode was removed in Phase 3.xx
  — the user has full control), applied pre-paint to avoid flashes. See
  [`SETTINGS_CONTROL_CENTER.md`](SETTINGS_CONTROL_CENTER.md).
- **Future direction:** can later be wrapped with Capacitor for a native app and
  surfaced inside a larger "Life OS"; data models are kept clean for that.

## 2. App modules

| Module | Purpose | Key code |
| --- | --- | --- |
| Today dashboard | Daily command center: greeting, completion ring, deterministic next-action card, status strip, module cards (workout, macros, water, supplements). Optional-aware (supplements never block the day) | `components/today/TodayView.tsx`, `lib/today.ts`, `docs/TODAY_QUICK_START.md` |
| System Hub ("מרכז מערכת") | Premium `/more` hub gathering all secondary tools into module-coloured categories (pure navigation) | `components/more/SystemHubView.tsx`, `docs/NAVIGATION_SYSTEM_HUB.md` |
| Workouts | Log sessions, build from templates, view history; the active session (builder) is a premium muscle-aware "live workout" experience with an explicit drag-only exercise reorder mode (Pointer-Events drag + keyboard, no data loss) and **collapsible exercise cards** (per-card chevron + `מזער הכל`/`פתח הכל`, visual-only) to tame long sessions | `components/workouts/*`, `docs/ACTIVE_WORKOUT_SESSION_UX.md`, `docs/ACTIVE_WORKOUT_REORDER.md`, `docs/ACTIVE_WORKOUT_COLLAPSIBLE_CARDS.md` |
| Exercise Library | 133 exercises, images, instructions, external demo videos | `components/exercises/*`, `lib/seed-exercises.ts` |
| Nutrition | Daily food logs + macro totals, plus **quick reuse**: an `אכלת לאחרונה` row and per-entry `הוסף שוב` that re-log a previous food in one tap (derived from logs, no new storage). Crossing the **configured protein goal** via any add surface fires an app-wide celebration overlay | `components/nutrition/NutritionView.tsx`, `lib/nutrition-reuse.ts`, `lib/protein-goal-events.ts`, `docs/NUTRITION_QUICK_REUSE.md`, `docs/PROTEIN_GOAL_CELEBRATION.md` |
| Food Library | Visual catalogue of foods to log from | `components/nutrition/FoodLibrary*`, `lib/food-library.ts` |
| Saved Food Values | User's remembered per-food default macros | `docs/NUTRITION_SAVED_VALUES.md` |
| Favorite Foods | Quick-access favorites (identity only, no macros) | `docs/NUTRITION_FAVORITES.md` |
| Water Tracking | Daily hydration log + goal + personal cup/bottle presets, plus a graduated goal-completion / over-goal banner (celebration at 100%, calm amber/rose over-goal states, non-medical wording). Status now colours **every** water surface (Today/Nutrition card, detail hero, gauge) and crossing 100% fires an app-wide celebration overlay from any add surface | `components/water/*`, `lib/water-status.ts`, `lib/water-goal-events.ts`, `docs/WATER_TRACKING.md`, `docs/WATER_PRESETS.md`, `docs/WATER_GOAL_UX_UPGRADE.md`, `docs/WATER_GOAL_GLOBAL_CELEBRATION.md` |
| Supplements Tracker | Personal supplement/medication tracking (no advice); searchable starter-template library with already-tracked state | `components/supplements/*`, `docs/SUPPLEMENTS_TRACKER.md`, `docs/SUPPLEMENTS_LIBRARY_UX.md` |
| Progress | Premium weekly insights screen: weekly hero, rule-based insight cards, 7-day activity trends, human empty states, and personal records — derived purely from existing local data (no AI) | `components/progress/*`, `lib/analytics.ts`, `lib/progress-insights.ts`, `docs/PROGRESS_INSIGHTS_UPGRADE.md` |
| Gym Attendance | Local gym check-in / check-out: prominent Today card, live visit timer, weekly stats (visits, time, avg, last), rich visit history (entry/exit/duration + display-only linked-workout snapshot matched by local day), same-day re-entry guard. Tracks *being at the gym* — separate from workout logging. No GPS | `components/gym/*`, `lib/gym-attendance.ts`, `docs/GYM_CHECK_IN.md` |
| Personal Training Profile | Optional, editable personal profile (goal, location, frequency, experience, duration, equipment multi-select, notes + V2 optional adaptation/age/height/weight/training-preference/guidance-style). Collect + display only — no auto-program, no medical/diet/BMI/body-shape logic. **V3 (UX): the entry prompt is a centered modal and `/training-profile` is a step-by-step wizard** (intro → one question per screen → summary/confirm, progress bar, next/back, save once on finish); an existing profile shows the saved summary and "ערוך פרופיל" reopens the wizard pre-filled. Never blocks the app. localStorage-only; included in Backup/Restore | `components/profile/TrainingProfileView.tsx`, `components/profile/ProfileOnboardingPrompt.tsx`, `lib/personal-profile.ts`, `lib/profile-onboarding.ts`, `lib/app-access.ts`, `docs/PERSONAL_PROFILE_V1.md` |
| Workout Recommendation | Deterministic, local-first, NO-AI layer mapping the personal profile onto **one existing** workout template as a starting point. Scores existing templates on safe signals (goal/location/frequency/duration/experience/equipment/training-preference) using only existing fields; never reads body fields, never creates/mutates a template. Four states (no-profile / incomplete / no-templates / recommendation) on `/workouts` below the command center + a compact link block on the profile summary | `lib/workout-recommendation.ts`, `components/workouts/WorkoutRecommendationCard.tsx`, `docs/WORKOUT_RECOMMENDATION_V1.md` |
| Settings | Premium "control center": appearance (light/dark only), daily goals, water shortcuts, data & storage (incl. a Backup & Restore card), access & privacy, separated sensitive actions, system info | `components/settings/SettingsView.tsx`, `docs/SETTINGS_CONTROL_CENTER.md` |
| Backup & Restore | Local JSON export/import of all Fit OS data: Blob download (+ copy/paste fallback), validated import with counts preview + confirm, last-backup status. No backend/auth/cloud/encryption | `components/backup/BackupView.tsx`, `lib/backup.ts`, `docs/BACKUP_RESTORE.md` |
| Learn (Knowledge Center) | Card-based Hebrew articles + protein calculator | `app/learn/*`, `lib/knowledge-content.ts`, `lib/protein.ts` |
| Welcome screen | First-visit intro (gate) | `components/welcome/WelcomeGate.tsx`, `lib/welcome.ts` |
| Beta Welcome Notice | Per-session friendly beta greeting after the access gate — shown on every app entry, before the profile prompt (gate) | `components/access/BetaWelcomeNotice.tsx`, `lib/beta-welcome.ts`, `docs/BETA_WELCOME_NOTICE.md` |
| Private Access Notice | _Removed from the active flow_ — superseded by the Beta Welcome Notice; files kept only as a reference | `components/access/PrivateAccessNotice.tsx`, `lib/private-access.ts` |
| Admin Access Code Gate | Client-side access-code gate (not real auth) | `components/access/AdminAccessCodeGate.tsx`, `lib/admin-access.ts`, `docs/ADMIN_ACCESS_GATE.md` |
| PWA | Installable app shell + service worker | `app/manifest.ts`, `components/ServiceWorkerRegister.tsx`, `public/sw.js` |

## 3. Main routes

Generated by the App Router (`app/`). Rendering mode noted from the build:

| Route | Screen | Render |
| --- | --- | --- |
| `/` | Today | Static |
| `/workouts` | Workouts | Static |
| `/more` | System Hub ("מרכז מערכת") | Static |
| `/exercises` | Exercise Library | Static |
| `/nutrition` | Nutrition | Static |
| `/nutrition/add` | Add / edit food log | Dynamic |
| `/nutrition/library` | Food Library | Dynamic |
| `/nutrition/water` | Water detail | Static |
| `/nutrition/water/presets` | Edit personal water presets | Static |
| `/nutrition/supplements` | Supplements | Static |
| `/nutrition/supplements/add` | Add / edit supplement | Dynamic |
| `/progress` | Progress | Static |
| `/gym` | Gym Attendance | Static |
| `/training-profile` | Personal Training Profile (step wizard) | Static |
| `/settings` | Settings | Static |
| `/backup` | Backup & Restore | Static |
| `/learn` | Knowledge Center index | Static |
| `/learn/[id]` | Knowledge article | SSG (per article) |
| `/manifest.webmanifest` | PWA manifest | Generated (`app/manifest.ts`) |
| `/icon.png`, `/apple-icon.png` | App icons | Generated |

The bottom navigation (`components/layout/nav-items.ts`) is for daily use and
surfaces five destinations: **Today, Workouts, Nutrition, Progress, More**.
Exercises moved out of the bottom nav into the **System Hub** (`/more`), which
gathers every secondary tool (Exercises, Food Library, Add Food, Water,
Supplements, Learn, Settings, Backup, Lock) into module-coloured categories.
Settings, Learn, Water, Supplements and the add/library routes remain reachable
contextually too. The More tab also lights up on `/exercises`, `/settings`, `/learn`,
and `/gym`. See [`NAVIGATION_SYSTEM_HUB.md`](NAVIGATION_SYSTEM_HUB.md).

## 4. Storage / session keys

All keys are prefixed `yfos:`. **Do not rename or repurpose these keys** —
existing user data is bound to them. See §5 for reset behavior.

### Data keys (localStorage) — owned by `lib/storage.ts` (`STORAGE_KEYS`)

| Key | Purpose | Owner module |
| --- | --- | --- |
| `yfos:workouts` | Logged workout sessions | Workouts |
| `yfos:foodLogs` | Food logs (all days) | Nutrition |
| `yfos:settings` | App settings **including the theme** (`settings.theme`), the water goal (`waterGoalMl`) and the personal water presets (`waterPresets`) | Settings / Theme / Water |
| `yfos:workout-templates:v1` | Workout templates (starter set shown until first write) | Workouts |
| `yfos:saved-food-values:v1` | Per-food remembered default macros (map by `sourceFoodId`) | Saved Food Values |
| `yfos:favorite-foods:v1` | Favorite food identities (map by `sourceFoodId`) | Favorite Foods |
| `yfos:water-logs:v1` | Daily hydration logs (one record per date) | Water |
| `yfos:supplements:v1` | Supplement catalogue (active + archived) | Supplements |
| `yfos:supplement-logs:v1` | Date-based "taken" marks (≤1 per supplement/day) | Supplements |

### Gate keys (owned outside `STORAGE_KEYS`)

| Key | Type | Purpose | Owner |
| --- | --- | --- | --- |
| `yfos:welcome-seen:v1` | localStorage | First-visit welcome screen seen flag (`"1"`) | `lib/welcome.ts` |
| `yfos:beta-welcome-seen-session:v1` | **sessionStorage** | Beta welcome notice seen **this session** (`"1"`) — V3 per-session gate; greets on every app entry after the access gate | `lib/beta-welcome.ts` |
| `yfos:beta-welcome-seen:v1` | localStorage | _Legacy_ permanent beta-welcome flag — retained, **no longer read** (superseded by the session key above in V3) | `lib/beta-welcome.ts` |
| `yfos:private-access-notice-accepted:session` | **sessionStorage** | _Defunct_ — old private-access notice flag, no longer read (notice removed from the flow) | `lib/private-access.ts` |
| `yfos:admin-access-granted:v1` | localStorage | Admin access-code gate unlocked on this device (`"1"`) | `lib/admin-access.ts` |
| `yfos:active-workout-draft:v1` | localStorage | **Single** in-progress active-workout draft (auto-saved). NOT history — separate from `yfos:workouts`; cleared on final save / explicit discard | `lib/active-workout-draft.ts` |
| `yfos:gym-visits:v1` | localStorage | Gym **attendance** history (`GymVisit[]`). Separate from `yfos:workouts` — being at the gym, not training. Each visit may carry an optional, additive `workouts?` display-only snapshot (no format/version change). Included in backups; cleared by `resetAll` | `lib/gym-attendance.ts` |
| `yfos:active-gym-visit:v1` | localStorage | **Single** open gym visit (`startedAt` only; the timer is derived). Closed into history on check-out, removed on discard. Included in backups; cleared by `resetAll` | `lib/gym-attendance.ts` |
| `yfos:personal-profile:v1` | localStorage | **Single** optional personal training profile (`TrainingProfile`: goal/location/frequency/experience/duration/equipment/notes + V2 optional `adaptation`/`age`/`heightCm`/`weightKg`/`trainingPreference`/`guidanceStyle` + `updatedAt`). Owned by `lib/personal-profile.ts` (own reactive layer + defensive parser). Included in backups (`personalProfile`, whole object — V2 fields additive); cleared by `resetAll` | `lib/personal-profile.ts` |
| `yfos:profile-onboarding-dismissed-session:v1` | **sessionStorage** | Profile-onboarding prompt dismissed **this session** (`"1"`) — V3 per-session gate; may re-show on a later entry while no profile exists. Gate/preference flag, **not** data — never backed up, **not** cleared by `resetAll`. Owned by `lib/profile-onboarding.ts` | `lib/profile-onboarding.ts` |
| `yfos:profile-onboarding-dismissed:v1` | localStorage | _Legacy_ permanent profile-prompt dismissed flag — retained, **no longer read** (superseded by the session key above in V3) | `lib/profile-onboarding.ts` |
| `yfos:backup-meta:v1` | localStorage | Backup bookkeeping only (`lastExportedAt` / `lastRestoredAt` / `lastRestoredBackupCreatedAt`). Best-effort status; **never** part of a backup and not "data" | `lib/backup.ts` |
| `yfos:water-goal-celebration-seen:v1` | localStorage | Anti-spam flag for the app-wide water-goal celebration (stores the last date it played). Isolated bookkeeping; **never** part of a backup and not "data". Re-armed when intake drops below the goal; cleared by `resetAll` | `lib/water-goal-events.ts` |

> The active-workout **draft** is intentionally outside `STORAGE_KEYS` and the
> history key (`yfos:workouts`): it is a recoverable in-progress slot, not a
> saved workout. See [`ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md`](ACTIVE_WORKOUT_DRAFT_AUTOSAVE.md).
>
> The theme has **no separate key** — it is a field inside `yfos:settings`. The
> pre-paint `THEME_INIT_SCRIPT` reads `yfos:settings` directly. The three gates
> use pre-paint init scripts that toggle `.welcome-seen` /
> `.beta-welcome-seen` / `.admin-access-granted` on `<html>` so returning
> users never see a flash.

## 5. Reset behavior

| Action (Settings) | What it clears | What it preserves |
| --- | --- | --- |
| **Reset all data** (`resetAll`) | All 9 `STORAGE_KEYS` data keys, incl. `yfos:settings` (theme returns to the default `light`), **plus** the gym keys (`yfos:gym-visits:v1`, `yfos:active-gym-visit:v1`) via `clearAllGymData()` **and** the personal profile (`yfos:personal-profile:v1`) via `clearPersonalProfile()` | All gate flags (`welcome-seen`, `beta-welcome-seen`, `admin-access`) — gates are not "data" |
| Reset personal profile (`clearPersonalProfile`) | `yfos:personal-profile:v1` only | All other modules |
| Reset saved food values | `yfos:saved-food-values:v1` only | Food logs, favorites |
| Reset favorite foods | `yfos:favorite-foods:v1` only | Food logs, saved values |
| Reset supplements | `yfos:supplements:v1` (deleting a supplement also drops its logs) | Other modules |
| Reset supplement log | `yfos:supplement-logs:v1` only | The supplement catalogue |
| Reset water day | One date inside `yfos:water-logs:v1` | All other days |
| Show welcome again (`resetWelcome`) | `yfos:welcome-seen:v1` only | All real data |
| Show beta notice again (`resetBetaWelcome`) | `yfos:beta-welcome-seen-session:v1` only (session flag) | All real data |
| Lock system — "נעל מערכת" (`resetAdminAccess`) | `yfos:admin-access-granted:v1` only — re-shows the access-code gate | All real data |

`resetAll` deliberately does **not** clear the gate flags, and the gate resets
deliberately do **not** touch user data. Keep these concerns separate.

## 6. Data domains

- **Workouts & templates** — `WorkoutSession`, `WorkoutTemplate` (`lib/fitness-types.ts`).
- **Exercises** — static seed of 133 items (`lib/seed-exercises.ts`); images under
  `public/exercises/`, optional verified YouTube demo links (`ExerciseVideo`).
- **Nutrition** — `FoodLog` entries; macros are **always user-entered**.
- **Food library** — static catalogue (`lib/food-library.ts`); images under `public/food/`.
- **Saved food values / favorites** — personal overlays keyed by `sourceFoodId`.
- **Water** — `WaterLog`/`WaterEntry`; `totalMl` is always recomputed from entries.
  Personal quick-add presets (`WaterPreset`) live in settings and default safely.
- **Supplements** — `Supplement` catalogue + `SupplementLog` taken-marks.
- **Settings** — `Settings` (theme, goals, water goal, water presets, protein calc inputs).
- **Knowledge** — static articles (`lib/knowledge-content.ts`) + protein calc (`lib/protein.ts`).

## 7. Architecture notes

- **Storage layer (`lib/storage.ts`)** is the *only* place that touches
  `localStorage` for app data. Everything is funneled through `readJSON`/`writeJSON`
  helpers that fail silently and are SSR-safe (`isBrowser()` guard).
- **Reactive layer (`lib/fitness-store.ts`)** wraps storage with
  `useSyncExternalStore`, caching snapshots and invalidating on mutation — no
  `setState`-in-effect, no hydration mismatch (server snapshots are stable
  constants; the real client value swaps in after mount).
- **Pure derivations (`lib/analytics.ts`, `lib/today.ts`,
  `lib/progress-insights.ts`)** never touch storage — callers pass data in, so they
  stay testable and SSR-safe. `lib/today.ts` adds the Today daily-completion +
  deterministic next-action logic; `lib/progress-insights.ts` adds the Progress
  weekly hero / insight cards / 7-day activity / personal records. Both are
  deterministic, no AI, no advice.
- **Gates (`lib/welcome.ts`, `lib/beta-welcome.ts`, `lib/admin-access.ts`)**
  mirror that same `useSyncExternalStore` shape and expose pre-paint init
  scripts. The admin gate fails **closed** (storage hiccup keeps it up); the
  other two fail open.
- **Theme (`components/ThemeProvider.tsx`)** supports only `light`/`dark` and
  toggles `.dark` on `<html>`; the saved value lives in settings. A legacy
  `theme: "system"` (or any unknown value) is sanitized to `light` on read
  (`sanitizeTheme` in `lib/storage.ts`) — never crashing, never re-persisting
  `system`, and matching the pre-paint `THEME_INIT_SCRIPT` so there is no flash.
- The `<head>` init scripts (theme + welcome + beta-welcome) run before paint to
  prevent flashes; `RootLayout` nests
  `BetaAuthGate → BetaWelcomeNotice → WelcomeGate → AppShell`.

## 8. Product boundaries — what must NOT be broken

- **No medical advice.** The app never diagnoses, prescribes, or recommends.
- **No supplement recommendations or dosages.** The supplements tracker only
  records what the user already decided to take; dosage text is free-form user
  input, never generated. Neutral category names only.
- **Nutrition values are user-entered only** — never inferred from images or
  external databases. Saved values and favorites never auto-fill macros.
- **Exercise videos are external demonstrations** (YouTube links, never embedded
  or hosted) — not medical or physical-therapy advice.
- **The Private Access Notice is informational only** — not authentication, no
  password, no backend check, no tracking. Fails open if storage is unavailable.
- **The Admin Access Code Gate is a client-side code gate** — not real auth, no
  backend check, no device detection, no tracking. The code lives in the bundle
  and is not a secret. Fails closed if storage is unavailable. See
  `docs/ADMIN_ACCESS_GATE.md`.
- **The Welcome screen is a first-visit intro** — not a gate that protects data.
- **No backend / auth / database / cloud sync / AI / external APIs** currently.
- Storage keys, exercise ids, exercise images, food data/images and supplement
  safety copy are stable contracts — do not change them in breaking ways.

## 9. Known future directions

- Optional Capacitor wrapper for a native Android/iOS build (no native code yet).
- Possible surfacing of structured data (templates, progress, knowledge, protein
  goal) inside a larger "Life OS" — data models are intentionally clean for this.
- `Exercise.videoUrl` and richer video metadata are reserved for future phases.
- **Personal Path / Smart Setup** — an optional future personal-setup flow. Not
  implemented; the System Hub shows a non-interactive "מסלול אישי · בקרוב" card
  as its placeholder entry point. No onboarding flow is forced now.

These are directions, **not** current scope — none of the hard boundaries in §8
change without an explicit new phase.

## 10. Optimization Audit Phase 1

- **Audit-only, no behaviour change.** Phase 1 of the System Optimization Audit ran
  on baseline commit `2830e40`. It produced a report
  ([`SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md`](SYSTEM_OPTIMIZATION_AUDIT_PHASE_1.md))
  and **did not** touch runtime code, UI/UX, schemas, storage keys, auth, backup,
  or data formats. Validation at baseline: `build` ✓, `lint` ✓ (0 errors, 1
  pre-existing QA-script warning), `test:e2e` ✓ (**100 passed**).
- **Headline findings:** **no P0/bug/safety issues.** Best safe wins (P1): extract a
  shared `CelebrationOverlay` primitive (3 overlays ~85% identical), extract
  `e2e/fixtures.ts` for duplicated test setup, and replace one `waitForTimeout` in
  `scroll-lock.spec.ts`. Medium (P2): `ModuleCard`/`OverlayDialog` consolidation and
  de-`force-dynamic`-ing the nutrition routes (`app/nutrition/page.tsx` reads the AI
  gate at request time). Deferred (P3, needs sign-off): the unmounted
  `AdminAccessCodeGate` / `PrivateAccessNotice` + their lib modules are confirmed
  dead but left in place.
- **Clarifications confirmed by the audit:** the nutrition photo AI is *feature-
  flagged*, not dead code (server-only key gate; UI shows "בקרוב" with no fetch when
  unconfigured); storage discipline is excellent (no raw `localStorage` in
  components except the pre-paint theme script); the `yuval-fit-os:`-prefixed
  guest-session key and the retained legacy access keys are intentional and must not
  be renamed.
- See the audit report for the full prioritised Phase-2 plan and the §8-aligned
  "do not touch" map.

## 11. Documentation map

Where to look, and in what order. **Start here, then the developer guide.**

- **Current source of truth**
  - **`PROJECT_STATE.md`** (this file) — always current; read first.
  - **`DEVELOPER_GUIDE.md`** — how to run, test, and extend.
  - **`README.md`** (repo root) — external intro; links to the two above.

- **Active product / feature docs** (`docs/`) — current per-feature specs:
  Today (`TODAY_QUICK_START`, `TODAY_COMMAND_CENTER_POLISH`, `TODAY_CLARITY_PASS`),
  Nutrition (`NUTRITION_CLARITY_PASS`, `NUTRITION_QUICK_REUSE`,
  `NUTRITION_FAVORITES`, `NUTRITION_SAVED_VALUES`, `NUTRITION_PHOTO_ASSIST`),
  Water (`WATER_TRACKING`, `WATER_PRESETS`, `WATER_GOAL_UX_UPGRADE`,
  `WATER_GOAL_GLOBAL_CELEBRATION`), Supplements (`SUPPLEMENTS_TRACKER`,
  `SUPPLEMENTS_LIBRARY_UX`, `SUPPLEMENT_TAKEN_CELEBRATION`),
  `PROTEIN_GOAL_CELEBRATION`, Workouts (`WORKOUTS_CLARITY_PASS`,
  `ACTIVE_WORKOUT_*`), `GYM_CHECK_IN`, `PROGRESS_INSIGHTS_UPGRADE`,
  `PERSONAL_PROFILE_V1`, `NAVIGATION_SYSTEM_HUB`, `SETTINGS_CONTROL_CENTER`,
  `BETA_WELCOME_NOTICE`, `PWA`, `UI_POLISH_PHASE_3_21_1`.

- **Technical / contract docs** — must stay accurate; some are referenced by code:
  `BACKUP_RESTORE` (export/import contract), `BETA_ACCESS_SYSTEM` (Supabase + RLS),
  `PRIVACY_TERMS_AI_DISCLAIMER` (legal pages), `ADMIN_ACCESS_GATE` (legacy gate),
  `EXERCISE_VIDEO_LINKS` (+ `EXERCISE_VIDEO_LINKS_AUDIT`),
  `EXERCISE_MEDIA_IMPORT` & `FOOD_MEDIA_IMPORT` (one-time import processes —
  still pointed at by `.gitignore` / `lib/food-library.ts`), `PHONE_INSTALL_QA`.

- **Optimization / audit docs** — the optimization trail:
  `SYSTEM_OPTIMIZATION_AUDIT_PHASE_1` (the audit), `SYSTEM_OPTIMIZATION_PHASE_2A`
  (CelebrationOverlay), `SYSTEM_OPTIMIZATION_PHASE_2B` (E2E fixtures),
  `SYSTEM_OPTIMIZATION_PHASE_2C` (this docs archive pass).

- **Archive** — [`docs/archive/`](archive/) holds superseded / removed-from-flow
  historical records (see [`archive/README.md`](archive/README.md)). These may be
  outdated and **do not override** `PROJECT_STATE.md`.
