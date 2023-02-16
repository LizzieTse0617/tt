const version = 2;
const cacheName = `The website is on version ${version}`;
const cacheItems = [
  //css
  './css/main.css',
  //TODO: add the css, fonts, html, and js links to the cache array
  //fonts
  'https://fonts.googleapis.com/css2?family=Raleway:wght@200;400;700&display=swap',

  //html
  '/',
  './index.html',

  //js
  './js/app.js',

  //all images and fetched json are to be dynamically be added to this array
];
self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(cacheList)));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key != cacheName).map((name) => caches.delete(name)));
    })
  );
});

self.addEventListener('fetch', (ev) => {
  let mode = ev.request.mode;
  let url = new URL(ev.request.url);
  let method = ev.request.method;
  let isOnline = navigator.onLine;
  let isImage =
    url.pathname.includes('.jpg') ||
    url.pathname.includes('.jpeg') ||
    url.hostname.includes('picsum.photo');
  let selfLocation = new URL(self.location);
  let isRemote = selfLocation.origin !== url.origin;


  if (!isOnline) {
    ev.respondWith(cacheOnly(ev));
  } else {
    //we fetch image only here
    if (isRemote && isImage) {
      ev.respondWith(staleWhileRevalidate(ev));
    } else {

      ev.respondWith(fetchFirst(ev))
      //in here, the return response should go to cacheItem. if not, then do the network

      ev.respondWith(networkOnly)
      //request JSON file here
      //we will try fetch first
      //if the file is JSON file i.e. url.pathname.include('jsonplaceholders'
  

    }

  }

   
});

function cacheFirst(ev) {
  //try cache then fetch
  return caches.match(ev.request).then((cacheResponse) => {
    return cacheResponse || fetch(ev.request);
  });
}
function cacheOnly(ev) {
  //only the response from the cache
  return caches.match(ev.request);
}
function networkFirst(ev) {
  //try fetch then cache
  return fetch(ev.request).then((response) => {
    if (!response.ok) return caches.match(ev.request);
    return response;
  });
}

function staleWhileRevalidate(ev) {
  //return cache then fetch and save latest fetch
  return caches.match(ev.request).then((cacheResponse) => {
    let fetchResponse = fetch(ev.request).then((response) => {
      caches.open(cacheName).then((cache) => {
        cache.put(ev.request, response.clone());
        return response;
      });
    });
    return cacheResponse || fetchResult;
  });
}
function networkFirstAndRevalidate(ev) {
  //attempt fetch and cache result too
  return fetch(ev.request).then((response) => {
    if (!response.ok) return caches.match(ev.request);
    return response;
  });
}
