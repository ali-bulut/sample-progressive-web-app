self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing Service Worker...", event);
  event.waitUntil(
    caches.open("static").then(function (cache) {
      console.log("[Service Worker] Precaching App Shell");
      cache.add("/src/js/app.js");
    })
  );
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating Service Worker...", event);
  return self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // if response is null, that means there is no cached version for the request. So use default fetch func.
      // cache mechanism => key-value pair. Key is always request object and value is always the response. That's why
      // we are using caches.match(event.request) that, if there is a key value pair in caches.
      if (response) {
        return response;
      } else {
        return fetch(event.request);
      }
    })
  );
});
