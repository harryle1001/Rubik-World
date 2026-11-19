// v61l · service worker do tools/build/build.js tạo ra từ sw.template.js — đừng sửa tay file sw.js.
// Chỉ cache file KHÔNG BAO GIỜ đổi nội dung: dist/*.<hash>.*, js/vendor/, three.js bản cố định trên cdnjs.
// index.html, css, ảnh… vẫn đi mạng như thường → bản mới (hash mới) luôn được tải; cache cũ bị xoá khi SW mới kích hoạt.
const VER = 'v61l-75ae35461c';
const IMMUTABLE = [/\/dist\/[\w-]+\.[0-9a-f]{8,}\.(js|json)$/, /\/js\/vendor\//, /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\//];
const PRE = ["dist/game.48b0ef9389.js"];   // bản gói hiện tại: nạp sẵn khi cài (thường lấy từ cache HTTP, không tải lại)
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(VER).then(c => c.addAll(PRE)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('v61l-') && k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const q = e.request; if(q.method !== 'GET' || !IMMUTABLE.some(r => r.test(q.url))) return;
  e.respondWith(caches.open(VER).then(c => c.match(q).then(hit => hit || fetch(q).then(r => { if(r.ok || r.type === 'opaque') c.put(q, r.clone()); return r; }))));
});
