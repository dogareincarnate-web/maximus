const CACHE = 'maximus-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { title: 'MAXIMUS', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'MAXIMUS';
  const body  = data.body  || 'Time to level up.';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: 'icon.svg',
      badge: 'icon.svg',
      tag: data.tag || 'maximus',
      renotify: true,
      data: { url: './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) if ('focus' in c) return c.focus();
      return self.clients.openWindow('./');
    })
  );
});
