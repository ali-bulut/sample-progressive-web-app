importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const STATIC_CACHE_VERSION = "static-v7"; // if we change anything in our project, we just need to update its version from here to update caches.
const DYNAMIC_CACHE_VERSION = "dynamic-v4";
const STATIC_FILES = [
  "/", // => when the user visits domain.com/ it redirects to index.html but in offline case it won't be redirected. So we have to write / url also. Because it store urls as keys.
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/idb.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "/favicon.ico",
  "https://fonts.googleapis.com/css?family=Roboto:400,700", // we can also cache files that loaded from other servers.
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];
// const MAX_CACHE_ITEM_COUNT = 20;

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName).then(function (cache) {
//     return cache.keys().then(function (keys) {
//       if (keys.length > maxItems) {
//         cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//       }
//     });
//   });
// }

self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing Service Worker...", event);
  event.waitUntil(
    caches.open(STATIC_CACHE_VERSION).then(function (cache) {
      console.log("[Service Worker] Precaching App Shell");
      cache.addAll(STATIC_FILES);
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

// cache with network fallback strategy
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     caches.match(event.request).then(function (response) {
//       // if response is null, that means there is no cached version for the request. So use default fetch func.
//       // cache mechanism => key-value pair. Key is always request object and value is always the response. That's why
//       // we are using caches.match(event.request) that, if there is a key value pair in caches.
//       if (response) {
//         return response;
//       } else {
//         return fetch(event.request)
//           .then(function (res) {
//             return caches.open(DYNAMIC_CACHE_VERSION).then(function (cache) {
//               // difference between add and put is that, put doesn't send any request, it just stores data we already have.
//               // here we have to use res.clone() because res object can only be consumed/used once. So if we want to use more
//               // than once, we have to use clone method of it. It doesn't matter which part we use clone. We may return res.clone()
//               // and use only res in put method also.
//               cache.put(event.request.url, res.clone());
//               return res;
//             });
//           })
//           .catch(function (err) {
//             return caches.open(STATIC_CACHE_VERSION).then(function (cache) {
//               return cache.match("/offline.html");
//             });
//           });
//       }
//     })
//   );
// });

// cache-only strategy
// self.addEventListener("fetch", function (event) {
//   event.respondWith(caches.match(event.request));
// });

// network-only strategy
// self.addEventListener("fetch", function (event) {
//   event.respondWith(fetch(event.request));
// });

// network with cache fallback strategy
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     fetch(event.request)
//       // we can improve it by using dynamic caching
//       //   .then(function (res) {
//       //     return caches.open(DYNAMIC_CACHE_VERSION).then(function (cache) {
//       //       cache.put(event.request.url, res.clone());
//       //       return res;
//       //     });
//       //   })
//       .catch(function (err) {
//         return caches.match(event.request);
//       })
//   );
// });

function isInArray(string, array) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === string) {
      return true;
    }
  }
  return false;
}

self.addEventListener("fetch", function (event) {
  var url = "https://u-pwagram-default-rtdb.firebaseio.com/posts";

  // by using that, we use cache then network strategy just for the request that has specified url. For other requests we use our old strategy that is cache with network fallback.
  // we need to use that approach because if we don't use that, we won't be able to reach our some part of apps offline.
  // Because in cache then network strategy we only get data via fetch(from network). We don't reach any data directly from the cache.

  // cache then network strategy
  // after fetch operation that we used feed.js, it goes here and it adds updated data that comes from network to the cache.
  // In other words, we are re-caching data -that has already cached- in every request.
  if (event.request.url.indexOf(url) > -1) {
    // commented out after started to use IndexedDB.
    // event.respondWith(
    //   caches.open(DYNAMIC_CACHE_VERSION).then(function (cache) {
    //     return fetch(event.request).then(function (res) {
    //       //   trimCache(DYNAMIC_CACHE_VERSION, MAX_CACHE_ITEM_COUNT);
    //       cache.put(event.request, res.clone());
    //       return res;
    //     });
    //   })
    // );

    event.respondWith(
      fetch(event.request).then(function (res) {
        var clonedRes = res.clone();
        clearAllData("posts")
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData("posts", data[key]);
            }
          });
        return res;
      })
    );
  }
  // cache-only strategy
  // we use it only for static files. We don't need to fetch these static files from network all the time.
  else if (isInArray(event.request.url, STATIC_FILES)) {
    self.addEventListener("fetch", function (event) {
      event.respondWith(caches.match(event.request));
    });
  }
  // cache with network fallback strategy
  else {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(DYNAMIC_CACHE_VERSION).then(function (cache) {
                // trimCache(DYNAMIC_CACHE_VERSION, MAX_CACHE_ITEM_COUNT);
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(function (err) {
              return caches.open(STATIC_CACHE_VERSION).then(function (cache) {
                // we just show offline.html if accept header is text/html.
                // in other words if the request is fetching html file.
                if (event.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
                // we can return anything we want here. For example instead of unloaded image,
                // we can show default image. But for using it, we need to add this default image
                // to STATIC_FILES like we did in offline.html file.
              });
            });
        }
      })
    );
  }
});

self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Background Syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("[Service Worker] Syncing New Post");
    event.waitUntil(
      readAllData("sync-posts").then(function (data) {
        for (var dt of data) {
          fetch("https://u-pwagram-default-rtdb.firebaseio.com/posts.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              id: dt.id,
              title: dt.title,
              location: dt.location,
              image:
                "https://firebasestorage.googleapis.com/v0/b/u-pwagram.appspot.com/o/sf-boat.jpg?alt=media&token=a2d8343b-7bff-4bcf-ae9b-da2e000127c7",
            }),
          })
            .then(function (res) {
              console.log("Sent Data", res);
              if (res.ok) {
                deleteItemFromData("sync-posts", dt.id);
              }
            })
            .catch(function (err) {
              console.log("Error while sending data", err);
            });
        }
      })
    );
  }
});
