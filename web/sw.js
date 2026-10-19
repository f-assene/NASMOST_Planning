/*
 * NASMOST Planning (web) — service worker : l'application installée sur l'écran d'accueil s'ouvre
 * même sans connexion, avec les derniers emplois du temps, annonces et flux consultés.
 *  - l'interface (HTML, CSS, scripts, images) est gardée en cache dès l'installation ;
 *  - les données (dépôt GitHub, flux) : réseau d'abord, copie en cache si le réseau manque ;
 *  - les bibliothèques de la carte (cdn.jsdelivr.net) : cache d'abord.
 * Changer VERSION à chaque modification de l'interface pour que les téléphones la rechargent.
 */
const VERSION = "nasmost-web-1.3.1";
const SHELL = [
  "./", "index.html", "style.css", "app.js", "admin.js", "manifest.webmanifest",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "welcome.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.hostname === "gc.zgo.at" || url.hostname.endsWith("goatcounter.com")) return; // statistiques : jamais en cache
  if (url.hostname === "cdn.jsdelivr.net") return event.respondWith(cacheFirst(request));
  if (url.origin === self.location.origin || url.hostname === "raw.githubusercontent.com") {
    return event.respondWith(networkFirst(request));
  }
});
