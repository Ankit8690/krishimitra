// KrishiMitra service worker — minimal offline shell.
// Cache-first for static assets, network-first with fallback for pages.

const CACHE = "km-v1";
const OFFLINE_URL = "/offline";
const STATIC_ASSETS = ["/", "/offline", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never intercept the auth or chat routes — they are dynamic and use cookies.
  if (
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/api/chat") ||
    url.pathname.startsWith("/api/stt") ||
    url.pathname.startsWith("/api/ml/")
  ) {
    return;
  }

  // For navigations: network first, cache fallback, offline shell as last resort
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // For static assets: cache first, network fallback
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webmanifest") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            if (res.ok)
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // For weather + mandi + schemes: network-first with cache fallback
  if (
    url.pathname.startsWith("/api/weather") ||
    url.pathname.startsWith("/api/mandi") ||
    url.pathname.startsWith("/api/schemes") ||
    url.pathname.startsWith("/api/tasks/")
  ) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});
