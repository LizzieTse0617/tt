# Service Worker Review

## Review Handling Fetch Events

This review is specifically about how to handle fetch requests in a Service Worker.

## Caching Strategies

There are a number of basic strategies that are fairly standard for any website. You can also create your own more specific ones for any app that you build.

Regardless of which strategy that you like to use, there will never be a single strategy that you use for every request on any website.

You can create a single function for each strategy for easy reuse.

### Cache Only

This strategy is used when you only want to send a response from a Cache, no network requests involved.

```js
function cacheOnly(ev) {
  //only the response from the cache
  return caches.match(ev.request);
}
```

### Cache First

This strategy is used when you want to check the cache first and then only make a network request if the cache request fails.

```js
function cacheFirst(ev) {
  //try cache then fetch
  return caches.match(ev.request).then((cacheResponse) => {
    return cacheResponse || fetch(ev.request);
  });
}
```

### Network Only

This strategy is used when you only want to make fetch requests and you want to ignore the cache entirely.

```js
function networkOnly(ev) {
  //only the result of a fetch
  return fetch(ev.request);
}
```

### Network First

This strategy is used when you want to make fetch requests but fall back on the cache if that fails.

```js
function networkFirst(ev) {
  //try fetch then cache
  return fetch(ev.request).then((response) => {
    if (!response.ok) return caches.match(ev.request);
    return response;
  });
}
```

### Stale While Revalidate

This strategy involves using both the cache and the network. The user is sent the copy in the cache if it exists. Then, regardless of whether or not the request exists in the cache, a fetch request is
made. The new fetch response is saved in the cache to be ready for the next request.

```js
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
```

### Network First And Revalidate

This strategy is similar to the Stale While Revalidate strategy except it prioritizes the fetch request over the current value in the cache.

```js
function networkFirstAndRevalidate(ev) {
  //attempt fetch and cache result too
  return fetch(ev.request).then((response) => {
    if (!response.ok) return caches.match(ev.request);

    //still save a copy
    return cache.put(ev.request, response.clone()).then(() => {
      return response;
    });
  });
}
```

## Request Object Properties

When you want to select a different strategy for each file you need to have information about each Request in order to make those decisions.

The `ev.request` object that we get from the Fetch Event contains lots of information that we can use for decision making.

```js
let mode = ev.request.mode; // navigate, cors, no-cors
let method = ev.request.method; //get the HTTP method
let url = new URL(ev.request.url); //turn the url string into a URL object
let queryString = new URLSearchParams(url.search); //turn query string into an Object
let isOnline = navigator.onLine; //determine if the browser is currently offline
let isImage =
  url.pathname.includes('.png') ||
  url.pathname.includes('.jpg') ||
  url.pathname.includes('.svg') ||
  url.pathname.includes('.gif') ||
  url.pathname.includes('.webp') ||
  url.pathname.includes('.jpeg') ||
  url.hostname.includes('some.external.image.site'); //check file extension or location
let selfLocation = new URL(self.location);
//determine if the requested file is from the same origin as your website
let isRemote = selfLocation.origin !== url.origin;
```

## Fetch Event Handling

Inside the fetch event listener function you will likely have many if statements, switch case statements, nested if statements, and logical short-circuiting.

Treat the `respondWith()` method calls like function `return` statements. The first one that is encountered will send back the Response. However, the code in your function will continue to run after
it is called. So, always have an `else{ }` block. Don't make two `respondWith` calls in the same block.

```js
self.addEventListener('fetch', (ev) => {
  let isOnline = navigator.onLine;
  if (isOnline) {
    respondWith(fetchOnly(ev));
  } else {
    respondWith(cacheOnly(ev));
  }
});
```

## Response Objects

There will also be times where you want to look at the `Response` object. You might want to check its headers and return different things depending on those values.

```js
fetch(ev.request).then((response) => {
  let hasType = response.headers.has('content-type');
  let type = response.headers.get('content-type');
  let size = response.headers.get('content-size');
  console.log(type, size);
});
```

[MDN Headers Object reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/has)

## Security Issues

Sometimes, when you are making fetch calls you will get an `Opaque` response. This is a valid response but one that cannot be read by JavaScript. You cannot use JavaScript to get the values of the headers or call `.text()` or `.json()` or `.blob()` on. This happens when you are making a cross-origin request. Eg: trying to get an image file from a website that is not your own.

The way to avoid some of the security issues is to stop credentials and identifying information from being passed to the external web server. We do this by setting the `credentials` setting on the request to `omit`. This will prevent the information being sent and solve some of the errors that you see with external requests.

```js
self.addEventListener('fetch', (ev)=>{
  //ev.request is the request coming from the web page
  //we can change its settings when making a fetch( ) call
  ev.respondWith(
    fetch(ev.request, {
      credentials: 'omit'
    })
  );
})
```

You can also change other settings like `Headers` in the Request before it is sent to the server.

