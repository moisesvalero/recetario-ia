// Service Worker para Umami PWA
const CACHE_NAME = "umami-cache-v5";

const STATIC_ASSETS = [
  "/favicon.svg",
  "/favicon.ico",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/pwa-192.png",
  "/pwa-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Evitar interceptar peticiones a la API o de autenticación de Appwrite/Google LLM
  if (url.pathname.startsWith("/api") || url.hostname.includes("appwrite")) {
    return;
  }

  // 1. ESTRATEGIA NETWORK-FIRST PARA NAVEGACIÓN (HTML)
  // Garantiza que Safari y todos los navegadores reciban SIEMPRE la versión más reciente si hay conexión.
  // Solo usa la caché si el usuario está completamente offline.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches
            .match(event.request)
            .then((cached) => cached || caches.match("/"));
        }),
    );
    return;
  }

  // 2. ESTRATEGIA STALE-WHILE-REVALIDATE / CACHE-FIRST PARA RECURSOS ESTÁTICOS
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano revalida si es recurso propio
        if (url.origin === self.location.origin) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (
          response.status === 200 &&
          url.origin === self.location.origin &&
          (url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".js") ||
            url.pathname.startsWith("/images/") ||
            url.pathname.includes("/fonts/"))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    }),
  );
});
