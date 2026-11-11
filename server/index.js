// Rubik World multiplayer server: Express serves the client, Socket.io syncs players in real time.
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { ZONES, CATALOG, CROPS, PLOT_PRICE, PLOT_COUNT } = require('../client/js/shared.js');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'players.json');
const app = express();
app.use(express.static(path.join(ROOT, 'client')));
app.use('/assets', express.static(path.join(ROOT, 'public', 'assets')));
app.get('/lib/phaser.min.js', (req, res) => res.sendFile(path.join(ROOT, 'node_modules', 'phaser', 'dist', 'phaser.min.js')));
app.get('/lib/chess.js', (req, res) => res.sendFile(path.join(ROOT, 'node_modules', 'chess.js', 'chess.js')));
const server = http.createServer(app);
const io = new Server(server);

// ---------- persistence (by player name) ----------
let saved = {};
try { saved = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) { saved = {}; }
let dirty = false;
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
  return Object.entries(all).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, score]) => ({ name, score, online: [...players.values()].some(p => p.name === name) }));
}
function persist(p) { saved[p.name] = { style: p.style, coins: p.coins, score: p.score, inv: p.inv, equip: p.equip }; dirty = true; }
function zoneState(zone) { return { zone, players: [...players.values()].filter(p => p.zone === zone).map(pub), stars: [...stars[zone].values()], plots: zone === 'vuon' ? plots : null }; }
function me(p) { return { id: p.id, name: p.name, coins: p.coins, score: p.score, inv: p.inv, equip: p.equip, style: p.style }; }

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
    players.set(socket.id, p); socket.join(z); persist(p);
    socket.emit('welcome', { me: me(p), state: zoneState(z), leaderboard: leaderboard() });
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
    if (p.coins < it.price) { socket.emit('toast', 'Chưa đủ xu. Hãy nhặt sao, làm vườn, chơi mini game để kiếm thêm!'); return; }
    p.coins -= it.price; const key = it.kind === 'seed' ? it.id : `${it.id}|${color}`;
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
  socket.on('disconnect', () => {
    if (!p) return; persist(p); players.delete(socket.id); io.to(p.zone).emit('left', p.id); io.emit('system', `${p.name} đã rời game.`);
  });
});
setInterval(() => io.emit('leaderboard', leaderboard()), 3000);
setInterval(() => io.to('vuon').emit('plots', plots), 5000);
server.listen(PORT, () => console.log(`Server game đang chạy tại http://localhost:${PORT}`));
