# Navigation & System Hub

> Phase 3.xx — the navigation architecture upgrade. This is about **structure
> and information hierarchy**, not new features. No data, storage, logic,
> backend, auth, AI, or native changes were introduced.

## 1. Bottom-nav philosophy

The bottom navigation is for **daily, primary use only**. It stays at five
comfortable, thumb-reachable tabs and never grows as the product grows. Every
secondary tool moves into the System Hub (`/more`) instead of crowding the bar.

Current tabs (RTL order handled by CSS):

| href | Label | Icon |
| --- | --- | --- |
| `/` | היום | `HomeIcon` |
| `/workouts` | אימונים | `DumbbellIcon` |
| `/nutrition` | תזונה | `AppleIcon` |
| `/progress` | התקדמות | `ChartIcon` |
| `/more` | עוד | `GridIcon` |

Defined in [`components/layout/nav-items.ts`](../components/layout/nav-items.ts),
rendered by [`components/layout/BottomNav.tsx`](../components/layout/BottomNav.tsx).

### Why Exercises moved to More

Exercises (`/exercises`, "תרגילים") used to be the third bottom-nav tab. The
library is important, but it is a **reference tool**, not a daily destination
like Today, Workouts, Nutrition, and Progress. Keeping it in the bar made the
nav feel like a pile of modules. It now lives as the first card in the System
Hub's **כושר** section. `/exercises` itself is **unchanged** and still works
when navigated to directly — only its entry point moved.

### Active-tab behavior

`isActive` in `BottomNav.tsx`:

- `/` is active only on an exact `/` match.
- Other tabs are active on their `href` **or** any sub-path
  (`pathname.startsWith("${href}/")`). So Nutrition stays lit on
  `/nutrition/water`, `/nutrition/supplements`, `/nutrition/library`, etc.
- The **More** tab also owns a small `match` list of secondary/system routes
  that have no primary tab — `/exercises`, `/settings`, `/learn`. On those
  routes "עוד" lights up, so the user is never left with no active tab.

## 2. The `/more` route — מרכז מערכת

A new static route ([`app/more/page.tsx`](../app/more/page.tsx)) renders
[`components/more/SystemHubView.tsx`](../components/more/SystemHubView.tsx). It is
a premium, RTL, mobile-first dashboard ("a mini operating-system"), not a plain
settings list. It works at 360px and 390px, in light and dark, with no
horizontal overflow.

It is **pure navigation**: every card is a `Link` to an **existing** route. No
data is read or written, no logic runs. It renders inside the normal `AppShell`
(header, bottom nav, scroll-to-top, safe-area spacing all preserved) and behind
the existing access gates — nothing about the PWA or gates changed.

### Hero

- Title: **מרכז מערכת**
- Subtitle: **כל הכלים של Fit OS במקום אחד**
- Copy: **בחר לאן להמשיך — כושר, תזונה, התקדמות או ניהול מערכת.**

### Category structure

Each section uses the app-wide module color identity (`--accent-*` + `.module-*`
washes from `app/globals.css`), so the hub reads as distinct modules rather than
one green block.

| Section | Card | Links to | Module color |
| --- | --- | --- | --- |
| **כושר** | ספריית תרגילים | `/exercises` | strength blue |
| | תבניות אימון | `/workouts` | strength blue |
| **תזונה** | מעקב תזונה | `/nutrition` | nutrition green |
| | מאגר אוכל | `/nutrition/library` | nutrition green |
| | הוספת אוכל | `/nutrition/add` | nutrition green |
| | מים | `/nutrition/water` | water cyan |
| | תוספים | `/nutrition/supplements` | supplement violet |
| **התקדמות ולמידה** | התקדמות | `/progress` | energy amber |
| | מרכז ידע | `/learn` | learn indigo |
| | מחשבון חלבון | `/nutrition` | nutrition green |
| **מערכת** | הגדרות | `/settings` | neutral premium |
| | גיבוי ושחזור | `/settings` | neutral premium |
| | נעילת מערכת | `/settings` | neutral premium |
| | מסלול אישי | — (future, "בקרוב") | neutral premium |

Routing notes:

- **מחשבון חלבון** has no standalone route — the interactive calculator lives in
  the Nutrition screen, so its card links to the closest existing route,
  `/nutrition`.
- **גיבוי ושחזור** and **נעילת מערכת** are sections inside Settings (the app has
  no separate backup/lock route and lock is a confirm-gated action, not a link),
  so both link to `/settings` for discoverability rather than inventing routes
  or triggering an action from the hub.

## 3. Future: Personal Path / Smart Setup (not built here)

The user wants an **optional** future personal-setup / "מסלול אישי" flow. It is
**intentionally not implemented in this phase** and there is **no onboarding or
plan-builder flow**. The hub shows a single non-interactive **מסלול אישי** card
with a subtle **"בקרוב"** badge to mark the direction — it is rendered as a plain
`div` (never a `Link`), so it creates no fake route and no blocking flow. When
the feature is built later, that card becomes its entry point.

## 4. QA

[`scripts/qa-navigation.mjs`](../scripts/qa-navigation.mjs) (expects
`next start -p 3331`) asserts, in light + dark at 360px and 390px:

- the bottom nav contains היום / אימונים / תזונה / התקדמות / עוד and **not** תרגילים;
- `/more` loads with its hero and all four sections;
- the hub links to Exercises, Workouts, Nutrition, Food Library, Add Food, Water,
  Supplements, Progress, Learn, and Settings;
- active-tab state works (More on `/more` and `/exercises`; Nutrition on
  `/nutrition` and `/nutrition/water`);
- no horizontal overflow; no console errors.
