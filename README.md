# Yuval Fit OS

A clean, mobile-first personal fitness operating system for tracking workouts,
exercises, sets/reps/weights, nutrition, macros, water and supplements. Built as
a PWA-style web app that can later become a native app via Capacitor.

> **New here?** Start with **[docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)** (what
> the app is, routes, storage keys, product boundaries) and
> **[docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** (how to run, test and
> extend it safely).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Client-side `localStorage` for persistence (no backend, no auth)
- RTL Hebrew UI, English code/naming

## Screens

`Today` · `Workouts` · `Nutrition` (incl. Food Library, Water, Supplements) ·
`Progress` · `More` (System Hub) · `Exercises` · `Settings` · `Learn`

The bottom navigation keeps five daily tabs — **Today, Workouts, Nutrition,
Progress, More** — and the **More** tab opens the System Hub (`/more`, מרכז
מערכת), a premium hub that gathers all secondary tools (Exercises, Food Library,
Water, Supplements, Learn, Settings, Backup, Lock) into module-coloured
categories. See [docs/NAVIGATION_SYSTEM_HUB.md](docs/NAVIGATION_SYSTEM_HUB.md).

Three gates wrap the app, in order: a per-session `Private Access` notice
(informational only), an `Admin Access Code` gate (a **client-side** code gate —
not real auth, no backend, no tracking; see
[docs/ADMIN_ACCESS_GATE.md](docs/ADMIN_ACCESS_GATE.md)), and a first-visit
`Welcome` screen. See [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) for the full
module + route map.

The Learn screen (`/learn`, מרכז ידע) holds short card-based educational
articles and a daily protein goal calculator (g/kg/day). It is reachable from
Today, Nutrition, Settings and the System Hub rather than the bottom nav.

Fixed bottom navigation, light/dark/system themes (saved locally), and a
scroll-to-top button that appears on scroll and clears the bottom nav.

## Project structure

```
app/                      route segments (one folder per screen)
components/
  layout/                 Header, BottomNav, ScrollToTop, AppShell
  ui/                     reusable primitives (Card, Button, Field, Badge…)
  today/ exercises/ workouts/ nutrition/ progress/ settings/
lib/
  fitness-types.ts        domain types
  knowledge-content.ts    Knowledge Center articles (Hebrew, card-based)
  protein.ts              protein goal calculation (g/kg/day)
  seed-exercises.ts       initial exercise library + Hebrew labels
  seed-templates.ts       starter workout templates (shown until first edit)
  storage.ts              all localStorage access
  fitness-store.ts        reactive layer (useSyncExternalStore) over storage
  analytics.ts            pure derivations (totals, summaries, PRs)
  utils.ts                date/id/formatting helpers
public/exercises/         drop real exercise media here later
```

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build (typechecks)
npm run lint     # eslint
```

Data lives in the browser under the `yfos:*` localStorage keys. Reset it from
the Settings screen.

## Direction

Fitness OS is currently standalone, but workout templates and progress
summaries are kept as clean, structured data (`WorkoutTemplate`,
`WorkoutSession`) so they can later be surfaced inside Yuval Life OS.
The same applies to the Knowledge Center articles (`lib/knowledge-content.ts`)
and the calculated daily protein goal (`lib/protein.ts` + `Settings`): both are
plain structured data/derivations, ready to be exposed in Life OS later.

## Install on your phone (PWA)

This is an installable, mobile-first web app — add it to your Android home
screen and run it full-screen, with updates staying web-based (no reinstalls).
See **[docs/PWA.md](docs/PWA.md)** for step-by-step install/testing instructions.
