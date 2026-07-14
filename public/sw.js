// Service Worker para Umami PWA
const CACHE_NAME = "umami-cache-v4";

const ASSETS = ["/", "/favicon.svg", "/favicon.ico", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
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

  // Evitar cachear peticiones a la API o de autenticación de Appwrite/Google LLM
  if (url.pathname.startsWith("/api") || url.hostname.includes("appwrite")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          // Guardar recursos estáticos del mismo origen en caché de forma dinámica
          if (
            response.status === 200 &&
            url.origin === self.location.origin &&
            (url.pathname.endsWith(".css") ||
              url.pathname.endsWith(".js") ||
              url.pathname.includes("/fonts/"))
          ) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // En caso de fallo total de red para navegación, mostrar la home
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    }),
  );
});
