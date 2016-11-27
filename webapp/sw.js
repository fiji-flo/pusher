const CACHE = 'pusher-cache';

self.addEventListener('install', evt => {
  console.log('The service worker is being installed.');
  precache();
  evt.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', evt =>
  evt.waitUntil(self.clients.claim()));

self.addEventListener('push', function (event) {
  const obj = event.data.json();
  messageClients(obj);
  fireNotification(obj, event);
});

self.addEventListener('fetch', evt => {
  console.log('The service worker is serving the asset.');
  evt.respondWith(fromCache(evt.request).catch(() => update(evt.request)));
});

function fireNotification(obj, event) {
  const title = obj.title;
  const body =  obj.body;
  const icon = 'images/pusher-icon-192.png';
  const tag = 'push';

  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: icon,
    tag: tag
  }));
}

function precache() {
  return caches.open(CACHE).then(
    cache => cache.addAll([
      './index.html',
      './style.css',
      './index.js',
      './notify.js',
      './manifest.json',
      './images/pusher-icon-192.png'
    ]));
}

function fromCache(request) {
  return caches.open(CACHE).then(
    cache => cache.match(request).then(
      matching => matching || Promise.reject('no-match')));
}

function update(request) {
  return caches.open(CACHE).then(
    cache => fetch(request).then(
      response => {
        cache.put(request, response.clone());
        return response;
      }));
}

function messageClients(data) {
  clients.matchAll({type: 'window'}).then(
    list => list.map(client => client.postMessage(data)));
}
