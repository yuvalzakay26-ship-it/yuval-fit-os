# Phone Install QA — Yuval Fit OS (PWA)

Manual checklist for verifying the installed PWA on a real Android phone after
deploying to an HTTPS URL (e.g. Vercel). This is **web-based PWA only** — no
Capacitor, no native project, no APK.

> **Prerequisite:** Chrome on Android only installs a PWA and runs the service
> worker over **HTTPS** (or `http://localhost`). A plain LAN `http://` address
> will not offer install. Deploy first — see [PWA.md](PWA.md).

---

## Deploy to Vercel

1. Push this repo to GitHub (`git push`).
2. Import it at [vercel.com/new](https://vercel.com/new) — framework auto-detects
   as **Next.js**, no settings to change. Or run `npx vercel` then `npx vercel --prod`.
3. Copy the resulting `https://<project>.vercel.app` URL.

Every `git push` redeploys; just reopen/refresh the app on the phone to update.

---

## On the phone (Android Chrome)

Tick each item. Use a real device, not just DevTools emulation.

### Install
- [ ] Open the `https://…vercel.app` URL in **Chrome on Android**.
- [ ] Page loads with no console errors (optional: remote-debug via `chrome://inspect`).
- [ ] Open **⋮ menu → Install app** (or **Add to Home screen**) is offered.
- [ ] Confirm install; the **Fit OS** icon appears on the home screen.

### Launch & display
- [ ] Launch from the **home-screen icon** (not from the browser).
- [ ] App opens **standalone** — no browser address bar / tabs visible.
- [ ] App icon is the correct **Y** icon (not a generic screenshot/globe).
- [ ] Splash/launch screen shows the app icon on the dark background
      (`background_color #06080c`); no white flash of the wrong theme.
- [ ] Status bar / theme color matches the app (dark `#06080c` / light `#f4f6f9`).

### Layout & safe areas
- [ ] **Bottom navigation** is fixed, fully visible, and tappable.
- [ ] Bottom nav clears the **home indicator** (extra `safe-area-inset-bottom` padding).
- [ ] Header clears the **notch / status bar** (`safe-area-inset-top` padding).
- [ ] RTL Hebrew layout renders correctly (content right-aligned).
- [ ] Scroll-to-top button appears on scroll and sits clear of the bottom nav.

### Theming
- [ ] Switch system to **dark mode** → app is dark, no flash of light on launch.
- [ ] Switch system to **light mode** → app is light, no flash of dark on launch.
- [ ] Changing theme in **Settings** persists after relaunch.

### Core data flows
- [ ] **Add a workout** → it appears in the Workouts list.
- [ ] **Add food** (Nutrition) → entry and macros/totals update.
- [ ] Fully **close the app** (swipe from recents) and **relaunch**.
- [ ] Previously added workout **and** food are **still there** (localStorage persisted).

### Updates (network-first, no reinstall)
- [ ] Make a visible change, `git push`, wait for Vercel deploy to finish.
- [ ] **Reopen/refresh** the installed app — the change appears **without reinstalling**.
- [ ] (Optional) Toggle **airplane mode** → last-visited screens still load from cache;
      back **online** → latest version loads again.

---

## Pass criteria

All boxes checked. Specifically: installs from Chrome, launches standalone with
correct icon/splash, safe-area spacing is respected top and bottom, light/dark
both work without flash, workouts + food persist across a full close/reopen, and
a redeploy is picked up by refresh alone (no reinstall).

---

## Notes / known constraints

- **iOS Safari** install is possible (Share → Add to Home Screen) but is not the
  primary target of this checklist; behavior (splash, standalone) differs from Android.
- The service worker is **production-only**; it is unregistered in dev. Test only
  against the deployed HTTPS build, never `next dev`.
- Service worker is **network-first**: online users always get the latest deploy.
  Offline is best-effort fallback of last-visited screens only — not full offline.
