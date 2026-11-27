// v61l → v74l · service worker do tools/build/build.js tạo ra từ sw.template.js — đừng sửa tay file sw.js.
// Mục tiêu: lần mở thứ 2 gần như không cần mạng, đổi phiên bản vẫn cập nhật đúng.
//  • dist/*.<hash>.*, js/vendor/, three.js cố định, font trên fonts.gstatic.com: nội dung không bao giờ đổi → cache, dùng mãi.
//  • trang chính (index.html), css: lấy ngay từ cache rồi hỏi lại máy chủ ở nền (ETag → 304, rẻ); đổi thì cập nhật cache
//    và báo trang (trang tự tải lại nếu còn đang ở màn chờ, nếu không thì bản mới có hiệu lực lần mở sau).
//  • ảnh trong assets/: bảng băm nội dung dist/assets.<hash>.json (build.js tạo) → ảnh không đổi thì không bao giờ hỏi lại máy chủ,
//    ảnh đổi nội dung thì khoá cache đổi theo → tải bản mới. Ảnh lạ (không có trong bảng): dùng cache, hỏi lại ở nền.
//  • cài bản mới: nạp sẵn bản gói + trang + css; ảnh đã có trong cache HTTP thì chép sang (không tải lại).
const VER = 'v61l-225a23d1fe';
const PRE = ["dist/game.819ce899a5.js","dist/lazy.b695231910.json","dist/cat.3e417e9e52.json"];                 // bản gói hiện tại + dữ liệu nhỏ: nạp sẵn khi cài
const MAN = 'dist/assets.ec3513ae59.json';               // bảng băm ảnh/css (rỗng nếu thư mục không có assets/)
const DIST = ["dist/game.819ce899a5.js","dist/piano.666dfec6ba.json","dist/cat.3e417e9e52.json","dist/books.ac53496e42.json","dist/lazy.b695231910.json"];               // mọi file dist/ của phiên bản này (bản gói + dữ liệu tải lười)
const IMM = 'v74l-imm', RT = 'v74l-rt', META = 'v74l-meta';
const IMMUTABLE = [/\/dist\/[\w-]+\.[0-9a-f]{8,}\.(js|json)$/, /\/js\/vendor\//, /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\//, /^https:\/\/fonts\.gstatic\.com\//];
const SWR = [/^https:\/\/fonts\.googleapis\.com\/css2?\?/];
const BASE = new URL('./', self.location).href;
const rel = u => u.startsWith(BASE) ? u.slice(BASE.length).split(/[?#]/)[0] : null;
let manP = null;
const man = () => manP || (manP = !MAN ? Promise.resolve({}) : caches.open(IMM).then(c => c.match(MAN).then(r => r || fetch(MAN).then(n => { if(n.ok) c.put(MAN, n.clone()); return n; }))).then(r => r && r.ok ? r.json() : {}).catch(() => { manP = null; return {}; }));
const keyOf = (path, h) => BASE + path + '?v74l=' + h;
const isPage = q => q.mode === 'navigate' || /\/(index\.html)?$/.test(q.url.split(/[?#]/)[0]);
const PAGE = () => BASE + 'index.html';
async function put(cache, key, res){ try { if(res && (res.ok || res.type === 'opaque')) await cache.put(key, res); } catch(e){} }

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil((async () => {
  const c = await caches.open(IMM); await Promise.all(PRE.map(u => c.match(u).then(h => h || fetch(u).then(r => put(c, u, r)))).concat(MAN ? [fetch(MAN).then(r => put(c, MAN, r))] : [])).catch(() => {});
  const rt = await caches.open(RT);
  // trang + css mới (bỏ qua cache HTTP) → cùng phiên bản với bản gói vừa nạp
  await Promise.all(['index.html', 'css/style.css'].map(p => fetch(BASE + p, {cache:'no-cache'}).then(r => r.ok ? (p === 'index.html' ? put(rt, PAGE(), r) : man().then(m => put(rt, m[p] ? keyOf(p, m[p]) : BASE + p, r))) : 0).catch(() => {})));
  // ảnh lần đầu chơi đã tải (đang nằm trong cache HTTP): chép sang cache của SW, không tốn mạng
  const m = await man(), have = new Set((await rt.keys()).map(q => q.url));
  await Promise.all(Object.keys(m).filter(p => /\.png$/.test(p) && !have.has(keyOf(p, m[p]))).map(p => fetch(BASE + p, {cache:'only-if-cached', mode:'same-origin'}).then(r => r.ok && put(rt, keyOf(p, m[p]), r)).catch(() => {})));
})()); });

self.addEventListener('activate', e => e.waitUntil((async () => {
  // cache cũ của v61l (một cache mỗi phiên bản) → bỏ
  for(const k of await caches.keys()) if(k.startsWith('v61l-')) await caches.delete(k);
  // dist/: giữ bản hiện tại + bản ngay trước (trang cũ đang mở vẫn tải lười được sách/piano)
  const meta = await caches.open(META), prevR = await meta.match('pre'), prev = prevR ? await prevR.json() : {cur:[], old:[]};
  const cur = DIST.concat(MAN ? [MAN] : []).map(u => new URL(u, BASE).href); const keep = new Set(cur.concat(prev.cur || []));
  const imm = await caches.open(IMM);
  for(const q of await imm.keys()) if(/\/dist\//.test(q.url) && !keep.has(q.url)) await imm.delete(q);
  if((prev.cur || []).join() !== cur.join()) await meta.put('pre', new Response(JSON.stringify({cur})));
  // ảnh: bỏ bản có băm cũ (ảnh đã đổi nội dung / đã xoá)
  const m = await man(); if(Object.keys(m).length){ const rt = await caches.open(RT);
    for(const q of await rt.keys()){ const u = new URL(q.url), h = u.searchParams.get('v74l'); if(h){ const p = rel(q.url); if(m[p] !== h) await rt.delete(q); } } }
  await self.clients.claim();
})()));

async function swr(q, key, cache, tell){
  const hit = await cache.match(key), old = hit && tell ? hit.clone() : null;   // bản sao để so (hit trả về trang, thân sẽ bị đọc)
  const net = fetch(q.mode === 'navigate' ? new Request(q.url, {cache:'no-cache', credentials:'same-origin'}) : q).then(async r => {
    if(r && (r.ok || r.type === 'opaque')){
      if(old && r.ok){ try { const [a, b] = await Promise.all([old.text(), r.clone().text()]); if(a !== b) (await self.clients.matchAll()).forEach(c => c.postMessage({v74l:'new'})); } catch(e){} }
      await put(cache, key, r.clone()); }
    return r; }).catch(() => null);
  return hit || (await net) || Response.error();
}
self.addEventListener('fetch', e => {
  const q = e.request; if(q.method !== 'GET') return; const u = q.url;
  if(IMMUTABLE.some(r => r.test(u))){
    e.respondWith(caches.open(IMM).then(c => c.match(q).then(hit => hit || fetch(q).then(r => { put(c, q, r.clone()); return r; })))); return; }
  if(SWR.some(r => r.test(u))){ e.respondWith(caches.open(RT).then(c => swr(q, q, c))); return; }
  const p = rel(u); if(p == null || q.headers.has('range')) return;
  if(isPage(q) && !/[?&](nobundle|bundle|nosw)/.test(u)){ e.respondWith(caches.open(RT).then(c => swr(q, PAGE(), c, true))); return; }
  if(/^(assets|css)\/.*\.(png|gif|jpe?g|webp|svg|css)$/.test(p)) e.respondWith((async () => {
    const c = await caches.open(RT), m = await man(), h = m[p];
    if(h){ const k = keyOf(p, h), hit = await c.match(k); if(hit) return hit;
      const r = await fetch(q.url, {cache:'no-cache'}).catch(() => null); if(r && r.ok) await put(c, k, r.clone()); return r || Response.error(); }
    return swr(q, BASE + p, c);
  })());
});
