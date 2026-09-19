/* Carnet de notes MIL — cache de la coquille de l'application.
   Les notes ne passent pas par ici : elles vont au service Google en POST,
   que ce fichier laisse toujours filer vers le réseau. */
const VERSION = "carnet-mil-v1";
const COQUILLE = ["./", "./index.html", "./manifest.webmanifest", "./icone-192.png", "./icone-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                       // les envois de notes passent directement
  if (new URL(req.url).origin !== self.location.origin) return;  // polices, service Google : pas de cache
  e.respondWith(
    fetch(req)
      .then(rep => {
        const copie = rep.clone();
        caches.open(VERSION).then(c => c.put(req, copie)).catch(() => {});
        return rep;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
