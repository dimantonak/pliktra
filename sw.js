// Offline support. Network first: when online you always get the latest version
// (and it is saved); when offline, or the network is very slow, the saved copy is used.
'use strict';

var CACHE = 'pliktra';
var FILES = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest',
  'js/app.js', 'js/i18n.js', 'js/notation.js', 'js/midifile.js', 'js/sheet.js',
  'vendor/vexflow/vexflow-bravura.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];
var SLOW_MS = 4000;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(new Promise(function (resolve, reject) {
    var done = false;
    function finish(res) { if (!done) { done = true; resolve(res); } }
    function saved() {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('index.html') : null);
      });
    }
    // Slow network: use the saved copy if there is one, otherwise keep waiting.
    var timer = setTimeout(function () { saved().then(function (hit) { if (hit) finish(hit); }); }, SLOW_MS);
    // "no-cache" asks the server whether the file changed, so updates show up right away.
    fetch(req, { cache: 'no-cache' }).then(function (res) {
      clearTimeout(timer);
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { return c.put(req, copy); });
      }
      finish(res);
    }, function (err) {   // offline
      clearTimeout(timer);
      saved().then(function (hit) { if (hit) finish(hit); else if (!done) { done = true; reject(err); } });
    });
  }));
});
