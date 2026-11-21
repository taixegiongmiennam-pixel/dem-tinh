// Lưu app + mô hình + thư viện vào máy để lần sau dùng không cần mạng.
// Đổi VERSION mỗi khi cập nhật mô hình hoặc app.
const VERSION = 'dem-tinh-v6';
const CDN = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
const PARTS = 3;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  CDN + 'ort.wasm.min.js', CDN + 'ort-wasm-simd-threaded.mjs', CDN + 'ort-wasm-simd-threaded.wasm']
  .concat(Array.from({ length: PARTS }, (_, i) => 'model/best.onnx.part' + i));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Trang chính: ưu tiên bản mới trên mạng, mất mạng thì dùng bản đã lưu
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request.url, { cache: 'no-cache' }).then(resp => {
      const cp = resp.clone(); caches.open(VERSION).then(c => c.put('index.html', cp)); return resp;
    }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(resp => {
    if (resp.ok) { const cp = resp.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); }
    return resp;
  })));
});
