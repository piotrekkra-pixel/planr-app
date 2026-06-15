const CACHE = "planr-v1";
const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Nigdy nie cache'ujemy zapytań do API modelu
  if (url.hostname.includes("anthropic.com")) return;
  // App shell: cache-first, z aktualizacją w tle
  if (e.request.method === "GET" && (url.origin === self.location.origin || url.hostname.includes("tailwindcss") || url.hostname.includes("fonts."))) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const live = fetch(e.request).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || live;
      })
    );
  }
});
