# Installing Yuval Fit OS on your phone (PWA)

Yuval Fit OS is a **mobile-first web app** with PWA installability. You can add
it to your Android home screen and run it full-screen like a native app — while
updates stay 100% web-based (no rebuilding/reinstalling).

> **Requirement:** Chrome on Android can only install a PWA when the app is
> served over **HTTPS** (or `http://localhost`). A plain `http://` address on
> your Wi-Fi/LAN will **not** offer install or run the service worker. So for
> phone testing you need an HTTPS URL — easiest is a quick deploy or a tunnel.

---

## Option A — Deploy (recommended, gives a stable HTTPS URL)

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) (framework auto-detected
   as Next.js — no config needed), or run `npx vercel` from the project root.
3. Open the resulting `https://…vercel.app` URL in **Chrome on Android**.

Every `git push` redeploys; just refresh the app on your phone to get the update.

## Option B — Quick tunnel to your local machine

Run a **production** build (the service worker is only active in production):

```bash
npm run build
npm start            # serves on http://localhost:3000
```

Then expose it over HTTPS with a tunnel, e.g.:

```bash
npx localtunnel --port 3000
# or: ngrok http 3000
```

Open the `https://…` tunnel URL in Chrome on Android.

---

## Add it to the home screen

1. Open the HTTPS URL in **Chrome on Android**.
2. Tap the **⋮** menu (top-right).
3. Tap **“Install app”** (or **“Add to Home screen”**).
4. Confirm. The **Y** icon appears on your home screen.
5. Launch it — it opens **standalone** (no browser chrome), respects light/dark,
   and uses the safe areas (notch / home indicator).

If you don’t see “Install app”, make sure you’re on HTTPS and reload once.

---

## How updates work

The service worker uses a **network-first** strategy:

- **Online:** you always get the latest deployed version — just reopen/refresh.
  No reinstall needed.
- **Offline:** the last-visited screens load from cache as a best-effort
  fallback.

New service-worker versions activate immediately (no “waiting” state), so you
never get stuck on a stale build.

To force a clean slate during development, open Chrome DevTools →
**Application → Service Workers → Unregister**, then reload.

---

## What’s included

- `app/manifest.ts` → served at `/manifest.webmanifest` (name, icons, colors,
  `display: standalone`, RTL).
- `public/icons/*` → 192/512 icons, plus **maskable** variants for Android’s
  adaptive icon shapes. Regenerate with `node scripts/gen-icons.mjs`.
- `app/icon.png` + `app/apple-icon.png` → favicon and iOS touch icon.
- `public/sw.js` + `components/ServiceWorkerRegister.tsx` → the update-safe
  service worker (registered in production only).

> Native packaging (Capacitor / APK) is intentionally **not** part of this phase.
> It can come later, once the product is stable.
