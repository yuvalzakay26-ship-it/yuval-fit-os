/*
 * Minimal, update-safe service worker for Yuval Fit OS.
 *
 * Strategy: NETWORK-FIRST. When online, the network response is always used
 * (so web updates show up immediately — no stale app), and a copy is cached
 * only as an offline fallback. New SW versions activate right away.
 *
 * This is intentionally simple: it enables installability + basic offline
 * without the staleness headaches of aggressive precaching.
 */
const CACHE = "yfos-cache-v1";
const APP_SHELL = [
  "/",
  "/workouts",
  "/exercises",
  "/nutrition",
  "/progress",
  "/settings",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // only handle same-origin

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    // Cache successful same-origin responses as an offline fallback.
    if (fresh && fresh.status === 200 && fresh.type === "basic") {
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const shell = await cache.match("/");
      if (shell) return shell;
    }
    throw new Error("offline and resource not cached");
  }
}
