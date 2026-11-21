/* Flight Log service worker: works offline, always tries the network first for the page and data. */
const CACHE = 'flight-log-v1';
const CORE = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './favicon-32.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const networkFirst = async req => {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) c.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw e;
  }
};

const staleWhileRevalidate = async req => {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // live sheet data is never cached here (the page keeps its own copy)
  if (/script\.google(usercontent)?\.com$/.test(u.hostname)) return;
  if (req.mode === 'navigate' || (u.origin === location.origin && /\/(index\.html|snapshot\.json)?$/.test(u.pathname)) || u.pathname.endsWith('snapshot.json')) {
    e.respondWith(networkFirst(req));
    return;
  }
  if (u.origin === location.origin || /(^|\.)jsdelivr\.net$|fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(staleWhileRevalidate(req));
  }
});
