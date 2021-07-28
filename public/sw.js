const STATIC_CACHE_VERSION = "static-v5"; // if we change anything in our project, we just need to update its version from here to update caches.
const DYNAMIC_CACHE_VERSION = "dynamic-v3";

self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing Service Worker...", event);
  event.waitUntil(
    caches.open(STATIC_CACHE_VERSION).then(function (cache) {
      console.log("[Service Worker] Precaching App Shell");
      cache.addAll([
        "/", // => when the user visits domain.com/ it redirects to index.html but in offline case it won't be redirected. So we have to write / url also. Because it store urls as keys.
        "/index.html",
        "/offline.html",
        "/src/js/app.js",
        "/src/js/feed.js",
        "/src/js/material.min.js",
        "/src/css/app.css",
        "/src/css/feed.css",
        "/src/images/main-image.jpg",
        "/favicon.ico",
        "https://fonts.googleapis.com/css?family=Roboto:400,700", // we can also cache files that loaded from other servers.
        "https://fonts.googleapis.com/icon?family=Material+Icons",
        "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
      ]);
    })
  );
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating Service Worker...", event);
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== STATIC_CACHE_VERSION && key !== DYNAMIC_CACHE_VERSION) {
            console.log("[Service Worker] Removing old cache.", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
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
        return fetch(event.request)
          .then(function (res) {
            return caches.open(DYNAMIC_CACHE_VERSION).then(function (cache) {
              // difference between add and put is that, put doesn't send any request, it just stores data we already have.
              // here we have to use res.clone() because res object can only be consumed/used once. So if we want to use more
              // than once, we have to use clone method of it. It doesn't matter which part we use clone. We may return res.clone()
              // and use only res in put method also.
              cache.put(event.request.url, res.clone());
              return res;
            });
          })
          .catch(function (err) {
            return caches.open(STATIC_CACHE_VERSION).then(function (cache) {
              return cache.match("/offline.html");
            });
          });
      }
    })
  );
});
