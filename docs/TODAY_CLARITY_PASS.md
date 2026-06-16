# Today — Product Clarity Pass

## Part 3 — sharpen the command-area hierarchy

Parts 1–2 fixed the `סיכום היום` duplication and made its toggle obviously
interactive. Real-UI feedback was that the Today screen still read as a long
stack of similar-weight cards — the **top of the page** didn't clearly answer, in
order: *what's my status? → what's active? → what should I do next? → what can I
tap now? → what's secondary?* Part 3 is a **hierarchy/copy pass only** (no schema,
key, route, logic, or save-behaviour change) that makes the top feel like one
command area and gives the two "quick" sections distinct roles.

### What was clarified

**1. What is LIVE now leads the command area.** The active-state cards (a live
gym visit with its running timer, and/or an in-progress workout draft) were
rendered *under* the suggested next-action card. They are now reordered to sit
**directly under the daily-progress hero and above `הפעולה הבאה`**, so a session
already in progress is the most prominent thing — never buried under a generic
prompt. Each card still self-hides when nothing is active, so a calm day shows
only the hero + next-action. Gym check-in/out and draft logic are untouched —
this is placement only.

**2. `הפעולה הבאה` reads as "do this to move forward".** The card keeps its
`הפעולה הבאה שלך` label and gains a small clarifying line, `· כדי להתקדם היום`,
so the card's *purpose* is explicit, not just its title. The CTA copy is already
direct and driven by the existing next-action ladder (`הוסף מים`, `הוסף אוכל`,
`התחל אימון`, `סמן תוספים`, `פתח התקדמות`) — unchanged. Because water is only ever
suggested when **no** water is logged yet today, an over-goal day never prompts
"add more water". The label row now uses `flex-wrap` so the label + "why" line +
optional `אופציונלי` badge can never overflow at 360 px.

**3. `מבט מהיר` and `פעולות מהירות` are given distinct roles.** Both sections
looked similar. They now carry a short helper under the title, via a new optional
`hint` prop on `SectionHeader`:

| Section | Helper | Role |
|---|---|---|
| `מבט מהיר` | `סטטוס קצר של היום` | **status snapshot** — read-only at-a-glance |
| `פעולות מהירות` | `פעולות שאפשר לבצע עכשיו` | **actions** — tappable shortcuts |

The visual treatment already differs (quiet `bg-surface-2` status cells vs.
premium sheen action tiles with gradient icons); the helper copy makes the
status-vs-action split unmistakable without adding clutter.

### Secondary sections (unchanged behaviour, confirmed priority)

`נוכחות במכון` stays an idle entry point low on the page **only when no visit is
live** (a live visit is promoted to the command area above; a saved historical
visit keeps the lower, clear `צפה בביקור היום` state from Part 1). `סיכום היום`
remains the collapsible, closed-by-default details section from Part 1/2. `עוד`
(Learn + Progress) stays at the bottom as quiet secondary links — it never
competes with the core daily actions.

### What stayed unchanged (Part 3)

- `lib/today.ts` next-action ladder + completion logic, `lib/gym-attendance.ts`
  check-in/out/re-entry/stats — byte-for-byte unchanged.
- Part 1/2 work preserved: `סיכום היום` collapsed-by-default card-like toggle with
  `פתח`/`סגור`, state-aware gym copy, the active-workout resume flow.
- Water work preserved: global celebration, app-wide colours, uncapped
  percentage, reset from Today, over-goal caution state.
- No storage keys, schemas, backup format, routes, bottom nav, gates, auth,
  Supabase, AI routes, or save behaviour changed. No new dependencies. Existing
  soft-premium visual style kept.

### Manual QA — 360 px / 390 px (Part 3)

- 360 px & 390 px, light + dark, RTL: no horizontal overflow. The next-action
  label row wraps (`flex-wrap`) so `הפעולה הבאה שלך · כדי להתקדם היום` (+ optional
  badge) never pushes past the card; the section helpers sit on their own line
  under the title and wrap cleanly.
- With a live workout draft and/or gym visit seeded, the active card renders
  above the next-action card (asserted in `today-command-center.spec.ts`); all
  cards remain comfortable touch targets and the bottom nav + scroll-to-top
  button still clear them.

---

## Part 2 — make the summary control obviously interactive

Part 1 collapsed `סיכום היום` by default, but real-UI feedback was that the
collapsed row read like a static heading with a chevron — users couldn't tell it
was tappable. Part 2 turns it into an **unmistakable expandable control** and is
otherwise copy/affordance only (no schema, key, route, or logic changes).

### What was clarified

The bare heading-row toggle became a **full card-like button** with layered
affordances, so interactivity never depends on the chevron (or colour) alone:

| Element | Collapsed | Expanded |
|---|---|---|
| Leading icon | `ListIcon` in a nutrition-gradient tile | same |
| Title | `סיכום היום` | `סיכום היום` |
| Subtitle | `הצג פירוט תזונה ואימון` | `פירוט תזונה ואימון` |
| Protein hint pill | e.g. `נותרו 150 ג׳ חלבון` | same |
| Action chip | `פתח` + down chevron | `סגור` + chevron rotated 180° |

- The **whole card is one `<button>`** (`text-start`, full width), so the entire
  row is the tap target — not just the chevron.
- The protein hint stays (the one fact `מבט מהיר` omits) but is now a small pill,
  no longer the most prominent thing in the row — the `פתח`/`סגור` chip and the
  "show details" subtitle lead instead.
- The chevron is a real up/down `ChevronDownIcon` that rotates 180° when open,
  reinforcing — but never solely carrying — the expand/collapse meaning.

### Accessibility

- The control is a native `<button type="button">`.
- `aria-expanded` reflects open/closed; `aria-controls="today-summary-panel"`
  points at the revealed panel, which carries the matching `id`.
- The button's accessible name includes the title, the show/hide subtitle, and
  the `פתח`/`סגור` label, so a screen reader announces a meaningful, stateful
  control — not just an icon.

### Section hierarchy

The existing section titles already read clearly and were kept stable to keep the
diff focused and reviewable: `מבט מהיר` (compact status overview), `פעולות מהירות`
(actions to take now), `נוכחות במכון` (gym presence), `סיכום היום` (expandable
details), `עוד` (secondary links). Only the `סיכום היום` control was redesigned.

### What stayed unchanged (Part 2)

- Daily summary still **collapsed by default**; the expanded nutrition + workout
  cards are byte-for-byte the same content.
- Active gym / active-workout promotion under Next Action, state-aware gym copy,
  water reset + over-goal states, and quick actions are all untouched.
- No `lib/today.ts` / `lib/gym-attendance.ts` logic, storage keys, schemas,
  backup format, routes, gates, or save behaviour changed.

### Manual QA — 360 px / 390 px (Part 2)

- 360 px & 390 px, light + dark, RTL: no horizontal overflow. The middle column
  (`min-w-0`) truncates its subtitle first; the protein pill is capped
  (`max-w-[8.5rem] truncate`) and the `פתח`/`סגור` chip + chevron stay visible.
- The whole card is a comfortable touch target (≥ 44 px tall); the chip and
  chevron never clip. Bottom nav and the scroll-to-top button still clear the
  toggle and the major actions.

---

# Today — Product Clarity Pass (Part 1)

A focused **UX clarity** pass on the Today / home screen. Today already had the
right ingredients (greeting, daily progress, next action, active-state cards,
status strip, quick actions, gym card, summaries) but read as a long stack of
similar-weight cards. This pass sharpens the hierarchy so the screen answers, in
order: **what is my status today? → what is the next best action? → what is
active now? → what can I quickly do? → where do I see details?**

It is a clarity/spacing/copy pass — **not** a new-feature or redesign pass.
**No schemas, localStorage keys, backup format, routes, gates, or business logic
changed.** Everything here is presentation: which card renders, in what order,
how compact it is, and the gym card's wording.

## Hierarchy chosen

1. **Greeting / date** — unchanged (kept RTL/Hebrew/mobile-first).
2. **Primary command area** (top, strongest):
   - Daily progress ring (`התקדמות היום`) — "what is my status today?"
   - Next Action card (`הפעולה הבאה שלך`) — "what is the next best action?"
   - **Active right now** (only when genuinely live): a live gym visit is
     promoted to a strong `אתה במכון עכשיו` card directly under Next Action, and
     an in-progress workout draft shows as `אימון בתהליך`. These stay visually
     prioritized — what is happening *now* is never buried.
3. **`מבט מהיר`** — the compact 2×2 status overview (workout / nutrition / water /
   supplements). This is the single at-a-glance status surface.
4. **`פעולות מהירות`** — the compact four-up shortcut row (start workout / add
   food / add water / mark supplements).
5. **Gym attendance (idle)** — only when no visit is live.
6. **`הרגלים יומיים`** — water + supplements cards (conditional, as before).
7. **`סיכום היום`** — now a **collapsible, lower-priority** section (see below).
8. **`עוד`** — Learn + Progress links.

## Duplication reduced: `מבט מהיר` vs `סיכום היום`

Both sections were communicating daily status at the **same visual weight** —
`מבט מהיר` as a compact strip and `סיכום היום` as two full glow cards (nutrition
+ workout) that largely repeated the strip.

**Fix:** `סיכום היום` is demoted to a **collapsible section, closed by default**.

- `מבט מהיר` remains the compact status overview (unchanged).
- The `סיכום היום` toggle header carries the one fact the strip can't show —
  **protein progress toward the goal** (e.g. `נותרו 80 ג׳ חלבון`,
  `יעד החלבון הושלם 🎯`, or `טרם נרשמה תזונה`) — so the key number stays visible
  without expanding.
- Tapping the header (`aria-expanded`) reveals the richer nutrition + workout
  cards exactly as before. Nothing is lost; it is simply one tap away and no
  longer a second full-weight wall of cards.

Net effect: the same information is no longer shown twice at the same weight, and
the page is markedly shorter on first load.

## Gym attendance card — clearer copy/action

Before, when a visit was **already saved today** the card said
`כבר נשמר ביקור במכון היום` but the primary button still read `נכנסתי למכון`,
which sounded like starting a duplicate visit.

Now the idle gym card adapts to state (logic unchanged):

| State | Primary action | Secondary |
|---|---|---|
| No visit today | `נכנסתי למכון` (check in) | — |
| Visit already saved today | **`צפה בביקור היום`** (link to `/gym`) | quiet `נכנסתי שוב למכון` |
| Active visit in progress | `סיים שהייה במכון` (check out) | — |

The same-day **re-entry guard is untouched**: the quiet `נכנסתי שוב למכון` still
routes through the existing confirmation dialog (`כבר נשמר ביקור במכון היום` →
`כן, התחל ביקור נוסף`), so a stray tap can't pile up duplicate visits. No gym
data model or visit logic changed — only the copy/placement of the actions.

## What stayed unchanged

- **`lib/today.ts`** — Next Action priority ladder and daily-completion logic.
- **`lib/gym-attendance.ts`** — all check-in / check-out / re-entry / stats logic.
- **Water improvements preserved** — global celebration, app-wide water colours,
  uncapped percentage display, reset from Today and `/nutrition/water`, and the
  over-goal caution state all still work (covered by the water e2e specs).
- **Active workout preserved** — the draft, `המשך אימון` resume flow, the workout
  card action, and history are untouched.
- **No** storage keys, schemas, backup format, routes, bottom nav, access gates,
  auth, Supabase, AI routes, or save behaviour changed. No new dependencies.
- Visual style is the existing soft-card design — no theme/brand change.

## Files

- **Modified:** `components/today/TodayView.tsx` (collapsible `סיכום היום`
  section + compact protein hint), `components/gym/GymTodayCard.tsx`
  (state-aware idle copy/action), `docs/PROJECT_STATE.md`.
- **Added:** `e2e/today-command-center.spec.ts`, this doc.

## Validation

- `npm run lint` — 0 errors (1 pre-existing warning in `scripts/qa-settings.mjs`).
- `npm run build` — succeeds; all routes present, `/` still static.
- `npm run test:e2e` — **47 passed**, including 5 new Today specs (command area
  renders, active workout surfaced, `סיכום היום` collapsed-by-default + expands,
  gym check-in vs saved-visit copy) and **no regression** in the water specs
  (reset + over-goal states).

## Manual QA notes — 360 px / 390 px

- **360 px & 390 px, light + dark, RTL Hebrew:** no horizontal overflow. The
  `סיכום היום` toggle row keeps the title on the start side and the protein hint
  truncates on the end side, so a long hint never pushes the chevron off-screen.
- The collapsed summary, the gym primary/secondary buttons, and the quick-action
  tiles all remain comfortably tappable (≥ 40 px targets).
- Bottom navigation and the scroll-to-top button still clear the primary command
  area and the gym action buttons.
