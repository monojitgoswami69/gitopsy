// GITOPSY Service Worker — Offline-First Cache & PWA Support
const CACHE_NAME = "gitopsy-v1.0.0";

const PRECACHE_ASSETS = [
  "/",
  "/autopsy",
  "/favicon/site.webmanifest",
  "/favicon/favicon.ico",
  "/favicon/favicon-16x16.png",
  "/favicon/favicon-32x32.png",
  "/favicon/apple-touch-icon.png",
  "/favicon/android-chrome-192x192.png",
  "/favicon/android-chrome-512x512.png",
  "/gitopsy-logo.png",
  "/og.png",
];

// Install: Cache core static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up previous cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for static assets, network-first with cache fallback for navigations
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and API/auth endpoints
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: Network-first, fallback to cache for offline viewing
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          // For autopsy detail routes (/autopsy/[id]), fallback to /autopsy shell
          if (url.pathname.startsWith("/autopsy/")) {
            const autopsyShell = await caches.match("/autopsy");
            if (autopsyShell) return autopsyShell;
          }

          const fallback = await caches.match("/");
          return fallback || new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  // Static assets (images, fonts, scripts, styles): Cache-first with background revalidation
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/favicon/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});
