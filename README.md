# Yuval Fit OS

A clean, mobile-first personal fitness operating system for tracking workouts,
exercises, sets/reps/weights, nutrition and basic macros. Built as a PWA-style
web app that can later become a native app via Capacitor.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Client-side `localStorage` for persistence (no backend, no auth)
- RTL Hebrew UI, English code/naming

## Screens

`Today` · `Workouts` · `Exercises` · `Nutrition` · `Progress` · `Settings`

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
  seed-exercises.ts       initial exercise library + Hebrew labels
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
