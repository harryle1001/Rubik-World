// Rubik World multiplayer server: Express serves the client, Socket.io syncs players in real time.
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { ZONES, CATALOG, CROPS, PLOT_PRICE, PLOT_COUNT } = require('../client/js/shared.js');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');   // Railway/Fly: gắn volume vào đây để dữ liệu không mất khi deploy lại
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
const DATA = path.join(DATA_DIR, 'players.json');
const WORLD_FILE = path.join(DATA_DIR, 'world.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const app = express();
app.set('trust proxy', 1);   // Render/Railway/Fly đứng sau proxy HTTPS → lấy đúng IP cho giới hạn tốc độ
app.disable('x-powered-by');
// tiêu đề bảo mật (CSP tắt vì game dùng importmap + script nội tuyến; vẫn có HSTS, nosniff, chống nhúng iframe lạ…)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
if (process.env.FORCE_HTTPS === '1') app.use((req, res, next) => (req.secure || req.path === '/api/health' ? next() : res.redirect(301, 'https://' + req.headers.host + req.originalUrl)));
app.get('/teacher', (req, res) => res.sendFile(path.join(ROOT, 'client', 'teacher.html')));
app.get('/parent', (req, res) => res.sendFile(path.join(ROOT, 'client', 'parent.html')));   // Gói Phụ huynh: đăng ký, liên kết con, mua gói, báo cáo học tập
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'client', 'admin.html')));     // chủ game: doanh thu, đối soát, mã giảm giá, giấy phép trường
app.get(['/privacy', '/terms'], (req, res) => {   // văn bản pháp lý: docs/*.md → HTML gọn (tiêu đề, danh sách, đậm, liên kết)
  const md = fs.readFileSync(path.join(ROOT, 'docs', req.path === '/terms' ? 'terms.md' : 'privacy-policy.md'), 'utf8'), e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const il = s => e(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/_(.+?)_/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\[(.+?)\]\((\/[\w/]*)\)/g, '<a href="$2">$1</a>');
  const body = md.replace(/^(#+ .*)$/gm, '\n$1\n').trim().split(/\n{2,}/).map(b => /^#+ /.test(b) ? `<h${b.match(/^#+/)[0].length}>${il(b.replace(/^#+ /, ''))}</h${b.match(/^#+/)[0].length}>` : /^- /m.test(b) ? b.replace(/^(?!- )(.+)$/m, '<p>$1</p>').replace(/(^- .+\n?)+/m, m => '<ul>' + m.trim().split('\n').map(l => `<li>${il(l.slice(2))}</li>`).join('') + '</ul>').replace(/<p>(.+?)<\/p>/, (m, t) => `<p>${il(t)}</p>`) : `<p>${il(b)}</p>`).join('\n');
  res.type('html').send(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trường Rubik</title><style>body{margin:0;background:#f6f0e4;color:#2e2418;font:16px/1.618 system-ui,sans-serif}main{max-width:720px;margin:0 auto;padding:34px 16px 55px}h1{font-size:34px;line-height:1.236}h2{font-size:21px;margin-top:34px}a{color:#2c8f82}code{background:#efe3cc;padding:0 5px;border-radius:5px}</style><main>${body}<p><a href="/parent">← Trang Phụ huynh</a></p></main></html>`);
});
app.get('/lib/chart.js', (req, res) => { res.set('Cache-Control', 'public, max-age=604800'); res.sendFile(path.join(ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.min.js')); });
app.get('/sw.js', (req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(path.join(ROOT, 'client', 'sw.js')); });
// Trang gốc mở thẳng Đảo Rubik 3D (game duy nhất; game 2D client/school/ chỉ còn lưu trữ, không liên kết)
const site = require('./site')(app, { ROOT });   // trang người lớn: /gioi-thieu, /blog, sitemap, robots (không bao giờ có quảng cáo trong game)
app.get(['/', '/index.html'], (req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(path.join(ROOT, 'client', 'ocean.html')); });
app.get('/manifest.webmanifest', (req, res) => { res.type('application/manifest+json'); res.sendFile(path.join(ROOT, 'client', 'manifest.webmanifest')); });
// Nén brotli/gzip (zlib có sẵn của Node, không thêm thư viện): JS, HTML, model .glb (meshopt được thiết kế để nén tiếp),
// wasm… Nén 1 lần rồi giữ trong bộ nhớ (theo thời điểm sửa file). three.module.js 1,27 MB → ~0,25 MB qua mạng.
const zlib = require('zlib');
const ZIP_EXT = /\.(js|mjs|json|html|css|glb|wasm|svg|txt|webmanifest)$/i, zipCache = new Map();
function compressed(dir, prefix = '') {
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const rel = decodeURIComponent(req.path); if (!ZIP_EXT.test(rel) || rel.includes('..')) return next();
    const ae = req.headers['accept-encoding'] || '', enc = /\bbr\b/.test(ae) ? 'br' : /\bgzip\b/.test(ae) ? 'gzip' : null; if (!enc) return next();
    const file = path.join(dir, rel); let st; try { st = fs.statSync(file); } catch (e) { return next(); }
    if (!st.isFile() || st.size < 1024) return next();
    const key = enc + ':' + file, tag = `W/"${st.size.toString(36)}-${st.mtimeMs.toString(36)}-${enc}"`;
    let c = zipCache.get(key);
    if (!c || c.tag !== tag) {
      const raw = fs.readFileSync(file);
      const body = enc === 'br' ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }) : zlib.gzipSync(raw, { level: 9 });
      if (body.length > raw.length * 0.95) return next();   // nén không lợi (ảnh đã nén…) → gửi nguyên
      c = { tag, body }; zipCache.set(key, c);
    }
    res.set({ 'Content-Encoding': enc, 'Vary': 'Accept-Encoding', 'ETag': c.tag, 'Last-Modified': st.mtime.toUTCString(), 'Cache-Control': 'public, max-age=0' });
    res.type(path.extname(file));
    if (req.headers['if-none-match'] === c.tag) return res.status(304).end();
    res.set('Content-Length', c.body.length); res.end(req.method === 'HEAD' ? undefined : c.body);
  };
}
app.use(compressed(path.join(ROOT, 'client')));
const LONG = /\.(glb|gltf|png|jpe?g|webp|ktx2|mp3|ogg|wav|m4a|hdr|woff2?)$/i;
const setCache = (res, f) => res.setHeader('Cache-Control', LONG.test(f) ? 'public, max-age=604800' : 'public, max-age=0, must-revalidate');
app.use(express.static(path.join(ROOT, 'client'), { setHeaders: setCache }));
app.use('/assets', express.static(path.join(ROOT, 'public', 'assets')));
app.get('/lib/phaser.min.js', (req, res, next) => { req.url = '/phaser.min.js'; compressed(path.join(ROOT, 'node_modules', 'phaser', 'dist'))(req, res, () => res.sendFile(path.join(ROOT, 'node_modules', 'phaser', 'dist', 'phaser.min.js'))); });
app.use('/lib/three', compressed(path.join(ROOT, 'node_modules', 'three')));
app.use('/lib/three', express.static(path.join(ROOT, 'node_modules', 'three'), { maxAge: '7d' }));
app.get('/lib/chess.js', (req, res) => res.sendFile(path.join(ROOT, 'node_modules', 'chess.js', 'chess.js')));
const server = http.createServer(app);
// cho phép app Capacitor (iOS: capacitor://localhost, Android: https://localhost) kết nối multiplayer
const io = new Server(server, { cors: { origin: (o, cb) => cb(null, !o || /^(capacitor|https?):\/\/localhost(:\d+)?$/.test(o) || o === process.env.PUBLIC_ORIGIN) } });

// ---------- persistence (by player name) ----------
let saved = {};
try { saved = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) { saved = {}; }
let dirty = false;

// ---------- game owner (admin) key + world edits made in edit mode ----------
let ADMIN_KEY = process.env.ADMIN_KEY || '';
if (!ADMIN_KEY) { try { ADMIN_KEY = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8')).key; } catch (e) {} }
if (!ADMIN_KEY) { ADMIN_KEY = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join(''); try { fs.mkdirSync(path.dirname(ADMIN_FILE), { recursive: true }); fs.writeFileSync(ADMIN_FILE, JSON.stringify({ key: ADMIN_KEY }, null, 1)); } catch (e) {} }
let WORLD = { props: {}, signs: {}, zoneNames: {}, prices: {} };
try { WORLD = Object.assign(WORLD, JSON.parse(fs.readFileSync(WORLD_FILE, 'utf8'))); } catch (e) {}
let worldDirty = false, propSeq = Date.now() % 100000;
setInterval(() => { if (!worldDirty) return; worldDirty = false; fs.writeFile(WORLD_FILE, JSON.stringify(WORLD, null, 1), () => {}); }, 2000);
const PROP_KINDS = ['oak', 'pine', 'sakura', 'palm', 'flowers', 'bush', 'rock', 'bench', 'lamp', 'statue', 'fountain', 'sign', 'chest', 'balloon'];
const priceOf = it => (WORLD.prices[it.id] != null ? WORLD.prices[it.id] : it.price);
const worldMeta = () => ({ signs: WORLD.signs, zoneNames: WORLD.zoneNames, prices: WORLD.prices });
setInterval(() => { if (!dirty) return; dirty = false; fs.writeFile(DATA, JSON.stringify(saved, null, 1), () => {}); }, 4000);

// ---------- world state ----------
const players = new Map();              // socket.id -> player
const stars = {};                        // zone -> Map(id -> {id,x,y})
const plots = Array.from({ length: PLOT_COUNT }, (_, i) => ({ i, owner: null, crop: null, plantedAt: 0, water: 0 }));
if (saved.__plots) saved.__plots.forEach((p, i) => { if (plots[i]) Object.assign(plots[i], p); });
let starSeq = 1;
function spawnStar(zone) {
  const Z = ZONES[zone]; if (!Z) return;
  const [x0, y0, x1, y1] = Z.walk;
  const s = { id: starSeq++, x: Math.round(x0 + 30 + Math.random() * (x1 - x0 - 60)), y: Math.round(y0 + 30 + Math.random() * (y1 - y0 - 60)) };
  stars[zone].set(s.id, s); return s;
}
Object.keys(ZONES).forEach(z => { stars[z] = new Map(); const n = ZONES[z].theme === 'interior' ? 2 : 6; for (let i = 0; i < n; i++) spawnStar(z); });

const clean = (s, n) => String(s || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);
const pub = p => ({ id: p.id, name: p.name, style: p.style, zone: p.zone, x: p.x, y: p.y, dir: p.dir, moving: p.moving, ride: p.ride, score: p.score });
function cleanStyle(s) {
  s = s || {}; const col = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#3d7bff');
  return { skin: col(s.skin), hair: col(s.hair), shirt: col(s.shirt), pants: col(s.pants), hairStyle: ['short', 'long', 'bun', 'spiky', 'pony'].includes(s.hairStyle) ? s.hairStyle : 'short', look: clean(s.look, 24) };
}
function leaderboard() {
  const all = {};
  Object.entries(saved).forEach(([n, v]) => { if (n !== '__plots') all[n] = v.score || 0; });
  players.forEach(p => { all[p.name] = p.score; });
  const on = new Map([...players.values()].map(p => [p.name, p]));
  return Object.entries(all).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, score]) => { const p = on.get(name); return { name, score, online: !!p, zone: p ? ZONES[p.zone].name : null }; });
}
function persist(p) { saved[p.name] = { style: p.style, coins: p.coins, score: p.score, inv: p.inv, equip: p.equip }; dirty = true; }
function zoneState(zone) { return { zone, players: [...players.values()].filter(p => p.zone === zone).map(pub), stars: [...stars[zone].values()], plots: zone === 'vuon' ? plots : null, props: WORLD.props[zone] || [] }; }
function me(p) { return { id: p.id, name: p.name, coins: p.coins, score: p.score, inv: p.inv, equip: p.equip, style: p.style, admin: !!p.admin }; }

io.on('connection', socket => {
  let p = null;
  let lastChat = 0, lastHit = 0;
  socket.on('join', data => {
    if (p) return;
    let name = clean(data && data.name, 18) || 'Bạn mới';
    const online = new Set([...players.values()].map(x => x.name));
    let base = name, k = 2; while (online.has(name)) name = `${base} ${k++}`;
    const prev = saved[name] || {};
    const z = 'lophoc', Z = ZONES[z];
    p = { id: socket.id, name, style: cleanStyle(data && data.style || prev.style), zone: z, x: Z.spawn[0] + Math.round(Math.random() * 60 - 30), y: Z.spawn[1], dir: 1, moving: false, ride: null,
          coins: prev.coins != null ? prev.coins : 100, score: prev.score || 0, inv: prev.inv || { 'bike_city|#3d7bff': 1 }, equip: prev.equip || {} };
    p.ride = p.equip.bike || null;
    p.admin = !!(data && typeof data.adminKey === 'string' && data.adminKey.trim().toUpperCase() === ADMIN_KEY.toUpperCase());
    players.set(socket.id, p); socket.join(z); persist(p);
    socket.emit('welcome', { me: me(p), state: zoneState(z), leaderboard: leaderboard(), meta: worldMeta() });
    if (data && data.adminKey && !p.admin) socket.emit('toast', 'Mã chủ game không đúng, bạn vào game như người chơi thường.');
    socket.to(z).emit('joined', pub(p));
    io.emit('system', `${name} vừa vào thế giới Trường Rubik!`);
  });
  socket.on('move', d => {
    if (!p || !d) return; const Z = ZONES[p.zone];
    p.x = Math.max(0, Math.min(Z.w, +d.x || 0)); p.y = Math.max(0, Math.min(Z.h, +d.y || 0)); p.dir = d.dir < 0 ? -1 : 1; p.moving = !!d.moving;
    socket.to(p.zone).volatile.emit('moved', { id: p.id, x: p.x, y: p.y, dir: p.dir, moving: p.moving, ride: p.ride });
  });
  socket.on('zone', d => {
    if (!p || !d || !ZONES[d.to]) return;
    const ok = ZONES[p.zone].exits.some(e => e.to === d.to); if (!ok) return;
    socket.to(p.zone).emit('left', p.id); socket.leave(p.zone);
    p.zone = d.to; const ex = ZONES[p.zone];
    p.x = Math.max(0, Math.min(ex.w, +d.x || ex.spawn[0])); p.y = Math.max(0, Math.min(ex.h, +d.y || ex.spawn[1]));
    socket.join(p.zone); socket.emit('zoneState', zoneState(p.zone)); socket.to(p.zone).emit('joined', pub(p));
  });
  socket.on('collect', id => {
    if (!p) return; const m = stars[p.zone], s = m && m.get(+id); if (!s) return;
    if (Math.hypot(s.x - p.x, s.y - p.y) > 90) return;
    m.delete(s.id); p.coins += 5; p.score += 10; persist(p);
    io.to(p.zone).emit('starGone', s.id); socket.emit('me', me(p));
    setTimeout(() => { const n = spawnStar(p.zone); if (n) io.to(p.zone).emit('starNew', n); }, 6000 + Math.random() * 6000);
  });
  socket.on('reward', d => {
    // small, rate-limited rewards for client-side activities (missile hit, punching bag, telescope tour...)
    if (!p || !d) return; const now = Date.now(); if (now - lastHit < 8000) return; lastHit = now;
    const amt = { pirate: 40, gym: 10, planet: 15, chess: 30, music: 8, goal: 15, lesson: 10, paint: 8, rubik: 12, herd: 25, feed: 6 }[d.kind]; if (!amt) return;
    p.coins += amt; p.score += amt; persist(p); socket.emit('me', me(p)); socket.emit('toast', `+${amt} xu · ${clean(d.label, 40)}`);
  });
  socket.on('chat', t => {
    if (!p) return; const now = Date.now(); if (now - lastChat < 700) return; lastChat = now;
    const text = clean(t, 120); if (!text) return;
    io.emit('chat', { id: p.id, name: p.name, zone: ZONES[p.zone].name, text });
  });
  socket.on('buy', d => {
    if (!p || !d) return; const it = CATALOG.find(c => c.id === d.id); if (!it) return;
    const color = /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : '#3d7bff';
    if (p.coins < priceOf(it)) { socket.emit('toast', 'Chưa đủ xu. Hãy nhặt sao, làm vườn, chơi mini game để kiếm thêm!'); return; }
    p.coins -= priceOf(it); const key = it.kind === 'seed' ? it.id : `${it.id}|${color}`;
    p.inv[key] = (p.inv[key] || 0) + (it.kind === 'seed' ? 5 : 1);
    if (it.kind === 'bike' || it.kind === 'hat') { p.equip[it.kind] = key; if (it.kind === 'bike') p.ride = key; io.to(p.zone).emit('restyle', { id: p.id, equip: p.equip, ride: p.ride }); }
    persist(p); socket.emit('me', me(p)); socket.emit('toast', `Đã mua ${it.name}${it.kind === 'seed' ? ' (5 hạt)' : ''}!`);
  });
  socket.on('equip', d => {
    if (!p || !d || !['bike', 'hat'].includes(d.kind)) return; const key = d.key ? String(d.key) : null;
    if (key && !p.inv[key]) return; p.equip[d.kind] = key; if (d.kind === 'bike') p.ride = key;
    persist(p); socket.emit('me', me(p)); io.to(p.zone).emit('restyle', { id: p.id, equip: p.equip, ride: p.ride });
  });
  // ---------- gardens ----------
  socket.on('garden', d => {
    if (!p || !d || p.zone !== 'vuon') return; const pl = plots[+d.plot]; if (!pl) return; const now = Date.now();
    if (d.act === 'buy') { if (pl.owner) return; if (p.coins < PLOT_PRICE) { socket.emit('toast', `Cần ${PLOT_PRICE} xu để mua mảnh vườn.`); return; } p.coins -= PLOT_PRICE; pl.owner = p.name; socket.emit('toast', 'Bạn đã sở hữu một mảnh vườn!'); }
    else if (pl.owner !== p.name) { socket.emit('toast', 'Mảnh vườn này của ' + (pl.owner || 'chưa ai') + '.'); return; }
    else if (d.act === 'plant') { const seed = String(d.seed || ''); const it = CATALOG.find(c => c.id === seed && c.kind === 'seed'); if (!it || !(p.inv[seed] > 0) || pl.crop) return; p.inv[seed]--; pl.crop = it.crop; pl.plantedAt = now; pl.water = 0; }
    else if (d.act === 'water') { if (!pl.crop) return; pl.water = Math.min(3, pl.water + 1); }
    else if (d.act === 'harvest') { if (!pl.crop) return; const C = CROPS[pl.crop]; const need = C.grow * 1000 / (1 + pl.water * 0.5); if (now - pl.plantedAt < need) { socket.emit('toast', 'Cây chưa chín, tưới thêm nước nhé!'); return; } p.coins += C.sell; p.score += C.sell; socket.emit('toast', `Thu hoạch ${C.name}: +${C.sell} xu`); pl.crop = null; pl.water = 0; }
    saved.__plots = plots; persist(p); socket.emit('me', me(p)); io.to('vuon').emit('plots', plots);
  });
  // ---------- chess challenges (server relays moves between two players) ----------
  socket.on('challenge', d => { if (!p || !d) return; const t = players.get(d.to); if (!t) return; if (!Object.keys(p.inv).some(k => k.startsWith('chess_'))) { socket.emit('toast', 'Bạn cần có bộ cờ vua (mua ở Trung tâm mua sắm) để mời thách đấu.'); return; } io.to(t.id).emit('challenged', { from: p.id, name: p.name }); });
  socket.on('challengeReply', d => { if (!p || !d) return; const t = players.get(d.to); if (!t) return; if (d.ok) { const game = `g${Date.now()}`; io.to(t.id).emit('chessStart', { game, color: 'w', opp: p.name, oppId: p.id }); socket.emit('chessStart', { game, color: 'b', opp: t.name, oppId: t.id }); } else io.to(t.id).emit('toast', `${p.name} từ chối lời mời.`); });
  socket.on('chessMove', d => { if (!p || !d) return; const t = players.get(d.to); if (t) io.to(t.id).emit('chessMove', { from: d.from, to: d.toSq, promotion: d.promotion }); });
  socket.on('chessEnd', d => { if (!p || !d) return; if (d.won) { p.score += 30; p.coins += 30; persist(p); socket.emit('me', me(p)); } });
  // ---------- edit mode: only the game owner (admin) may change the world ----------
  socket.on('refresh', () => { if (p) socket.emit('zoneState', zoneState(p.zone)); });
  socket.on('edit', d => {
    if (!p || !p.admin || !d) { socket.emit('toast', 'Chỉ chủ game mới được sửa.'); return; }
    const Z = Object.prototype.hasOwnProperty.call(ZONES, d.zone) ? ZONES[d.zone] : null; const txt = v => clean(v, 40);
    if (d.op === 'addProp' && Z && PROP_KINDS.includes(d.kind)) {
      const list = WORLD.props[d.zone] = WORLD.props[d.zone] || []; if (list.length >= 200) { socket.emit('toast', 'Khu này đã có quá nhiều đồ trang trí.'); return; }
      list.push({ id: 'p' + (propSeq++), kind: d.kind, x: Math.max(0, Math.min(Z.w, Math.round(+d.x || 0))), y: Math.max(0, Math.min(Z.h, Math.round(+d.y || 0))), text: txt(d.text), color: /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : null });
    } else if (d.op === 'moveProp' && Z) {
      const it = (WORLD.props[d.zone] || []).find(o => o.id === d.id); if (!it) return; it.x = Math.max(0, Math.min(Z.w, Math.round(+d.x || 0))); it.y = Math.max(0, Math.min(Z.h, Math.round(+d.y || 0)));
    } else if (d.op === 'delProp' && Z) {
      WORLD.props[d.zone] = (WORLD.props[d.zone] || []).filter(o => o.id !== d.id);
    } else if (d.op === 'sign' && Z && Z.exits[+d.idx]) {
      const t = txt(d.label); if (t) WORLD.signs[d.zone + '|' + (+d.idx)] = t; else delete WORLD.signs[d.zone + '|' + (+d.idx)];
    } else if (d.op === 'zoneName' && Z) {
      const t = txt(d.name); if (t) WORLD.zoneNames[d.zone] = t; else delete WORLD.zoneNames[d.zone];
    } else if (d.op === 'price') {
      const it = CATALOG.find(c => c.id === d.id); const v = Math.round(+d.price); if (!it) return; if (v > 0 && v <= 100000 && v !== it.price) WORLD.prices[it.id] = v; else delete WORLD.prices[it.id];
    } else return;
    worldDirty = true;
    if (['addProp', 'moveProp', 'delProp'].includes(d.op)) io.to(d.zone).emit('props', { zone: d.zone, props: WORLD.props[d.zone] || [] });
    else io.emit('worldMeta', worldMeta());
  });
  socket.on('disconnect', () => {
    if (!p) return; persist(p); players.delete(socket.id); io.to(p.zone).emit('left', p.id); io.emit('system', `${p.name} đã rời game.`);
  });
});
// ---------- Đảo Rubik 3D (ocean.html): namespace /island + API tài khoản/lớp/sự kiện → server/online.js ----------
const ready = require('./online')(app, io, { ADMIN_KEY, express, rateLimit });
// phần bổ sung trên cùng namespace: phép thuật, Làng Phù Thuỷ (nhà), Săn Cầu Vàng — trạng thái riêng `fx` theo socket
const island = io.of('/island'), islanders = new Map();
const HOUSES_FILE = path.join(ROOT, 'data', 'houses.json'); let HOUSES = {}, housesDirty = false;
try { HOUSES = JSON.parse(fs.readFileSync(HOUSES_FILE, 'utf8')) || {}; } catch (e) {}
setInterval(() => { if (!housesDirty) return; housesDirty = false; fs.mkdir(path.dirname(HOUSES_FILE), { recursive: true }, () => fs.writeFile(HOUSES_FILE, JSON.stringify(HOUSES), () => {})); }, 3000);
const num = (v, lo, hi) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : 0);
island.on('connection', socket => {
  let me = null, last = 0;
  socket.on('join', d => {   // online.js lo danh sách người chơi; ở đây chỉ giữ tên + vị trí cho phép thuật
    if (me) return;
    me = { id: socket.id, name: clean(d && d.name, 18) || 'Bạn mới', x: 0, z: 10, cloak: false, liftOk: false };
    islanders.set(socket.id, me);
  });
  socket.on('m', d => {
    const now = Date.now(); if (!me || !d || now - last < 50) return; last = now;
    me.x = num(d.x, -3000, 3000); me.z = num(d.z, -3000, 3000);
  });
  // ---------- phép thuật (spellbook.js): chỉ chuyển tiếp hiệu ứng, kiểm tra dữ liệu; không có phép gây hại ----------
  let spT = 0; const pub = () => island.emit('pstate', { id: me.id, cloak: !!me.cloak, liftOk: !!me.liftOk });
  socket.on('spell', d => {
    const now = Date.now(); if (!me || !d || now - spT < 250 || !/^[a-z0-9_-]{1,20}$/.test(d.s) || !Array.isArray(d.a) || d.a.length !== 3) return; spT = now;
    const x = d.x && typeof d.x === 'object' && JSON.stringify(d.x).length <= 300 ? d.x : undefined;
    socket.broadcast.emit('spell', { id: me.id, s: d.s, a: d.a.map(v => num(v, -2000, 2000)), c: /^#[0-9a-f]{6}$/i.test(d.c) ? d.c : '#ffe3a0', x });
  });
  socket.on('perm', d => { if (!me || !d) return; me.liftOk = !!d.liftOk; pub(); });
  socket.on('liftReq', d => {   // Nâng Bạn: chỉ khi người được nâng đã bật cho phép; 1 lần / 5 giây
    const t = d && islanders.get(d.to), now = Date.now(); if (!me || !t || !t.liftOk || t.cloak || now - (me.liftT || 0) < 5000) return; me.liftT = now;
    if (Math.hypot(t.x - me.x, t.z - me.z) > 34) return; island.to(t.id).emit('lifted', { by: me.id, name: me.name });
  });
  socket.on('admin', d => { if (!me || !d || typeof d.key !== 'string') return; me.admin = typeof d.key === 'string' && d.key.trim().toUpperCase() === ADMIN_KEY.toUpperCase(); socket.emit('admin', { ok: me.admin, quiet: !!d.quiet }); if (!me.admin && me.cloak) { me.cloak = false; pub(); } });
  socket.on('cloak', d => { if (!me || !me.admin || !d) return; me.cloak = !!d.on; pub(); });   // áo choàng tàng hình: chỉ chủ game
  socket.on('disconnect', () => { if (!me) return; islanders.delete(socket.id); });
  // Làng Phù Thuỷ Nhỏ (academy/village.js): mỗi tên 1 ngôi nhà; lần lưu đầu "giữ chỗ" bằng mã máy (token) → người khác không ghi đè được
  socket.on('house:save', (d, ack) => {
    const cb = typeof ack === 'function' ? ack : () => {};
    if (!d || typeof d.name !== 'string' || typeof d.token !== 'string' || !Array.isArray(d.pieces)) return cb({ err: 'Dữ liệu nhà không hợp lệ.' });
    const name = d.name.trim().slice(0, 20), tok = d.token.slice(0, 64); if (!name) return cb({ err: 'Thiếu tên.' });
    const old = HOUSES[name]; if (old && old.token !== tok) return cb({ err: 'Tên này đã có nhà của một bạn khác trên máy khác — nhà em chỉ lưu trên máy này.' });
    const pieces = d.pieces.slice(0, 377).filter(p => Array.isArray(p) && p.length === 6 && typeof p[0] === 'string' && p[0].length < 13 && p.slice(1).every(n => Number.isInteger(n) && n >= 0 && n < 13));
    HOUSES[name] = { token: tok, pieces, at: Date.now() }; housesDirty = true; cb({ ok: true });
  });
  socket.on('house:get', (name, ack) => { if (typeof ack !== 'function') return; const h = HOUSES[String(name || '')]; ack(h ? { name, pieces: h.pieces, at: h.at } : null); });
  socket.on('house:list', (_, ack) => { if (typeof ack !== 'function') return; ack(Object.entries(HOUSES).map(([name, h]) => ({ name, n: h.pieces.length, at: h.at })).sort((a, b) => b.at - a.at).slice(0, 55)); });
  // Săn Cầu Vàng (academy/pitch.js): phòng 'sky' — người vào trước làm chủ trận (mô phỏng NPC + bóng), server chỉ chuyển tiếp
  socket.on('skJoin', () => { if (!me || sky.has(socket.id)) return; sky.add(socket.id); socket.join('sky'); skyRoom(); });
  socket.on('skLeave', () => { if (sky.delete(socket.id)) { socket.leave('sky'); skyRoom(); } });
  let skT = 0;
  socket.on('skState', d => { const now = Date.now(); if ([...sky][0] !== socket.id || now - skT < 60) return; skT = now; if (JSON.stringify(d || 0).length < 4096) socket.to('sky').volatile.emit('skState', d); });
  socket.on('skAct', d => { const host = [...sky][0]; if (!sky.has(socket.id) || !host || host === socket.id || !d || typeof d.a !== 'string') return; island.to(host).emit('skAct', { id: socket.id, a: d.a.slice(0, 8), d: Array.isArray(d.d) ? d.d.slice(0, 3).map(v => num(v, -1, 1)) : null }); });
  socket.on('disconnect', () => { if (sky.delete(socket.id)) skyRoom(); });
});
const sky = new Set();
const skyRoom = () => island.to('sky').emit('skRoom', { host: [...sky][0] || null, ids: [...sky].slice(0, 8) });
setInterval(() => io.emit('leaderboard', leaderboard()), 3000);
setInterval(() => io.to('vuon').emit('plots', plots), 5000);
ready.then(() => server.listen(PORT, () => { console.log(`Server game đang chạy tại http://localhost:${PORT}`); console.log(`Mã chủ game (để bật chế độ Sửa): ${ADMIN_KEY}  ·  lưu ở data/admin.json hoặc đặt biến môi trường ADMIN_KEY`); })).catch(e => { console.error('Không mở được kho dữ liệu:', e); process.exit(1); });
