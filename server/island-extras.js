// server/island-extras.js — Các tính năng thời gian thực của Đảo Rubik 3D chạy chung namespace /island với server/online.js
// (online.js lo tài khoản, vào/ra, vị trí, bạn bè, sự kiện). Ở đây: phép thuật, Làng Phù Thuỷ Nhỏ, Săn Cầu Vàng, trang phục,
// mini game (bảng xếp hạng + 2 người), Tàu Pha Lê (giờ server, giữ ghế), Đồng Pha Lê. `me` = người chơi trong islanders (do online.js tạo lúc 'join').
const fs = require('fs'), path = require('path');
module.exports = function islandExtras({ island, islanders, hooks }, { clean, ADMIN_KEY, ROOT, DATA }) {
const num = (v, lo, hi) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : 0);
const HOUSES_FILE = path.join(ROOT, 'data', 'houses.json'); let HOUSES = {}, housesDirty = false;
try { HOUSES = JSON.parse(fs.readFileSync(HOUSES_FILE, 'utf8')) || {}; } catch (e) {}
setInterval(() => { if (!housesDirty) return; housesDirty = false; fs.mkdir(path.dirname(HOUSES_FILE), { recursive: true }, () => fs.writeFile(HOUSES_FILE, JSON.stringify(HOUSES), () => {})); }, 3000);
// Mini game đảo 3D: bảng xếp hạng toàn trường (top 13 mỗi game, lưu data/mg-top.json) + chuyển tin 2 người chơi cùng
const MGTOP_FILE = path.join(ROOT, 'data', 'mg-top.json'); let mgTop = {}; try { mgTop = JSON.parse(fs.readFileSync(MGTOP_FILE, 'utf8')) || {}; } catch (e) {}
let mgSaveT = null; const mgSave = () => { clearTimeout(mgSaveT); mgSaveT = setTimeout(() => fs.writeFile(MGTOP_FILE, JSON.stringify(mgTop), () => {}), 3000); };
// gói vị trí: trên Tàu Pha Lê gửi kèm toa + toạ độ cục bộ + ghế; thông tin công khai thêm áo choàng tàng hình / trang phục / mini game đang chơi
hooks.m = (sid, d, pk) => { if (Number.isInteger(d.c) && d.c >= 0 && d.c < 16 && TR.aboard.has(sid)) pk.push(d.c, +num(d.lx, -3, 3).toFixed(2), +num(d.lz, -8, 8).toFixed(2), Number.isInteger(d.st) ? Math.max(-1, Math.min(1023, d.st)) : -1); };
hooks.pub = m => ({ cloak: !!m.cloak, liftOk: !!m.liftOk, look: m.look || undefined, mg: m.mg || undefined });
island.on('connection', socket => {
  // ---------- phép thuật (spellbook.js): chỉ chuyển tiếp hiệu ứng, kiểm tra dữ liệu; không có phép gây hại ----------
  let spT = 0; const pub = me => island.emit('pstate', { id: me.id, cloak: !!me.cloak, liftOk: !!me.liftOk });
  socket.on('spell', d => { const me = islanders.get(socket.id);
    const now = Date.now(); if (!me || !d || now - spT < 250 || !/^[a-z0-9_-]{1,20}$/.test(d.s) || !Array.isArray(d.a) || d.a.length !== 3) return; spT = now;
    const x = d.x && typeof d.x === 'object' && JSON.stringify(d.x).length <= 300 ? d.x : undefined;
    socket.broadcast.emit('spell', { id: me.id, s: d.s, a: d.a.map(v => num(v, -2000, 2000)), c: /^#[0-9a-f]{6}$/i.test(d.c) ? d.c : '#ffe3a0', x });
  });
  socket.on('perm', d => { const me = islanders.get(socket.id); if (!me || !d) return; me.liftOk = !!d.liftOk; pub(me); });
  socket.on('liftReq', d => { const me = islanders.get(socket.id);   // Nâng Bạn: chỉ khi người được nâng đã bật cho phép; 1 lần / 5 giây
    const t = d && islanders.get(d.to), now = Date.now(); if (!me || !t || !t.liftOk || t.cloak || now - (me.liftT || 0) < 5000) return; me.liftT = now;
    if (Math.hypot(t.x - me.x, t.z - me.z) > 34) return; island.to(t.id).emit('lifted', { by: me.id, name: me.name });
  });
  socket.on('admin', d => { const me = islanders.get(socket.id); if (!me || !d || typeof d.key !== 'string') return;   // {op} là công cụ chủ game của online.js
    me.admin = typeof d.key === 'string' && d.key.trim().toUpperCase() === ADMIN_KEY.toUpperCase(); socket.emit('admin', { ok: me.admin, quiet: !!d.quiet }); if (!me.admin && me.cloak) { me.cloak = false; pub(me); } });
  socket.on('cloak', d => { const me = islanders.get(socket.id); if (!me || !me.admin || !d) return; me.cloak = !!d.on; pub(me); });   // áo choàng tàng hình: chỉ chủ game
  // Làng Phù Thuỷ Nhỏ (academy/village.js): mỗi tên 1 ngôi nhà; lần lưu đầu "giữ chỗ" bằng mã máy (token) → người khác không ghi đè được
  socket.on('house:save', (d, ack) => { const me = islanders.get(socket.id);
    const cb = typeof ack === 'function' ? ack : () => {};
    if (!d || typeof d.name !== 'string' || typeof d.token !== 'string' || !Array.isArray(d.pieces)) return cb({ err: 'Dữ liệu nhà không hợp lệ.' });
    const name = d.name.trim().slice(0, 20), tok = d.token.slice(0, 64); if (!name) return cb({ err: 'Thiếu tên.' });
    const old = HOUSES[name]; if (old && old.token !== tok) return cb({ err: 'Tên này đã có nhà của một bạn khác trên máy khác — nhà em chỉ lưu trên máy này.' });
    const pieces = d.pieces.slice(0, 377).filter(p => Array.isArray(p) && p.length === 6 && typeof p[0] === 'string' && p[0].length < 13 && p.slice(1).every(n => Number.isInteger(n) && n >= 0 && n < 13));
    HOUSES[name] = { token: tok, pieces, at: Date.now() }; housesDirty = true; cb({ ok: true });
  });
  socket.on('house:get', (name, ack) => { const me = islanders.get(socket.id); if (typeof ack !== 'function') return; const h = HOUSES[String(name || '')]; ack(h ? { name, pieces: h.pieces, at: h.at } : null); });
  socket.on('house:list', (_, ack) => { const me = islanders.get(socket.id); if (typeof ack !== 'function') return; ack(Object.entries(HOUSES).map(([name, h]) => ({ name, n: h.pieces.length, at: h.at })).sort((a, b) => b.at - a.at).slice(0, 55)); });
  // Săn Cầu Vàng (academy/pitch.js): phòng 'sky' — người vào trước làm chủ trận (mô phỏng NPC + bóng), server chỉ chuyển tiếp
  socket.on('skJoin', () => { const me = islanders.get(socket.id); if (!me || sky.has(socket.id)) return; sky.add(socket.id); socket.join('sky'); skyRoom(); });
  socket.on('skLeave', () => { const me = islanders.get(socket.id); if (sky.delete(socket.id)) { socket.leave('sky'); skyRoom(); } });
  let skT = 0;
  socket.on('skState', d => { const me = islanders.get(socket.id); const now = Date.now(); if ([...sky][0] !== socket.id || now - skT < 60) return; skT = now; if (JSON.stringify(d || 0).length < 4096) socket.to('sky').volatile.emit('skState', d); });
  socket.on('skAct', d => { const me = islanders.get(socket.id); const host = [...sky][0]; if (!sky.has(socket.id) || !host || host === socket.id || !d || typeof d.a !== 'string') return; island.to(host).emit('skAct', { id: socket.id, a: d.a.slice(0, 8), d: Array.isArray(d.d) ? d.d.slice(0, 3).map(v => num(v, -1, 1)) : null }); });
  socket.on('disconnect', () => { if (sky.delete(socket.id)) skyRoom(); });
  // trang phục mua ở Phố Phép Thuật (mũ, áo choàng) — chỉ nhận mã ngắn chữ thường
  const lid = v => (typeof v === 'string' && /^[a-z0-9-]{1,21}$/.test(v) ? v : null);
  socket.on('look', d => { const me = islanders.get(socket.id); if (!me || !d) return; me.look = { cape: lid(d.cape), hat: lid(d.hat) }; socket.broadcast.emit('look', [me.id, me.look]); });
  socket.on('mg', d => { const me = islanders.get(socket.id); if (!me) return; me.mg = d && d.k ? { k: clean(d.k, 24), t: clean(d.t, 40) } : null; socket.broadcast.emit('mg', [me.id, me.mg]); });
  let mgWin = 0, mgN = 0;   // tối đa 21 tin / giây mỗi người
  socket.on('mgTo', d => { const me = islanders.get(socket.id); const now = Date.now(); if (now - mgWin > 1000) { mgWin = now; mgN = 0; } if (!me || !d || ++mgN > 21 || !islanders.has(d.to)) return; let x = null; try { x = d.d && JSON.stringify(d.d).length < 800 ? d.d : null; } catch (e) {}
    island.to(d.to).emit('mgFrom', { from: me.id, name: me.name, type: clean(d.type, 12), d: x }); });
  socket.on('mgScore', d => { const me = islanders.get(socket.id); if (!me || !d) return; const k = clean(d.k, 24), s = +d.s, lb = !!d.lb; if (!k || !Number.isFinite(s)) return;
    const L = mgTop[k] = mgTop[k] || [], old = L.find(e => e.n === me.name); if (old) { if (lb ? s < old.s : s > old.s) { old.s = s; old.t = Date.now(); } } else L.push({ n: me.name, s, t: Date.now() });
    L.sort((a, b) => lb ? a.s - b.s : b.s - a.s); L.length = Math.min(L.length, 13); mgSave(); socket.emit('mgTop', { k, list: L }); });
  socket.on('mgTop', k => { const me = islanders.get(socket.id); k = clean(k, 24); socket.emit('mgTop', { k, list: mgTop[k] || [] }); });
  // ---------- Tàu Pha Lê: 1 đoàn tàu chung, lịch theo GIỜ SERVER; ghế ngồi giữ chỗ trên server ----------
  socket.on('tr', d => { const me = islanders.get(socket.id);
    if (!me || !d) return; const now = Date.now();
    if (d.op === 'board') { if (TR.phase === 'run') return; TR.aboard.add(socket.id); if (TR.phase === 'wait') { TR.phase = 'board'; TR.dep = now + TR_BOARD; } }
    else if (d.op === 'leave') { TR.aboard.delete(socket.id); freeSeat(socket.id); if (!TR.aboard.size && TR.phase === 'board') TR.phase = 'wait'; }
    else if (d.op === 'sit') { const id = num(d.id, 0, 1023) | 0, who = TR.seats.get(id); if (!TR.aboard.has(socket.id) || (who && who !== socket.id)) { socket.emit('trSeat', { ok: false, id }); return; } freeSeat(socket.id); TR.seats.set(id, socket.id); socket.emit('trSeat', { ok: true, id }); }
    else if (d.op === 'stand') freeSeat(socket.id);
    else if (d.op === 'skip') { if (TR.phase !== 'run' || !TR.aboard.has(socket.id)) return; if (TR.aboard.size > 1) { socket.emit('toast', '🚂 Có bạn khác cùng chuyến — mình cùng ngắm cảnh tới ga nhé!'); return; } TR.t0 = now - TR_DUR; }
    else if (d.op === 'reloc') { if (TR.phase !== 'wait' || TR.aboard.size || (d.at !== 'A' && d.at !== 'B')) return; TR.at = d.at; TR.dir = d.at === 'A' ? 1 : -1; }
    else return;
    trSend();
  });
  socket.on('disconnect', () => { if (TR.aboard.delete(socket.id) || freeSeat(socket.id)) { if (!TR.aboard.size && TR.phase === 'board') TR.phase = 'wait'; trSend(); } });
  socket.emit('tr', trPub());
});
const sky = new Set();
const skyRoom = () => island.to('sky').emit('skRoom', { host: [...sky][0] || null, ids: [...sky].slice(0, 8) });
const TR = { at: 'A', dir: 1, phase: 'wait', dep: 0, t0: 0, aboard: new Set(), seats: new Map() }, TR_DUR = 144000, TR_BOARD = 21000;   // chạy 144 s, chờ khách 21 s (Fibonacci)
const trPub = () => ({ at: TR.at, dir: TR.dir, phase: TR.phase, dep: TR.dep, t0: TR.t0, n: TR.aboard.size, now: Date.now(), seats: [...TR.seats] });
const trSend = () => island.emit('tr', trPub());
function freeSeat(sid) { let hit = false; for (const [k, v] of TR.seats) if (v === sid) { TR.seats.delete(k); hit = true; } if (hit) trSend(); return hit; }
setInterval(() => {   // máy trạng thái: chờ khách → khởi hành đúng giờ → tới ga (đổi chiều) → xuống hết → chờ
  const now = Date.now();
  if (TR.phase === 'board' && now >= TR.dep) { TR.phase = 'run'; TR.t0 = now; trSend(); }
  else if (TR.phase === 'run' && now >= TR.t0 + TR_DUR) { TR.at = TR.at === 'A' ? 'B' : 'A'; TR.phase = 'arrive'; TR.dep = now + 3000; trSend(); }
  else if (TR.phase === 'arrive' && now >= TR.dep) { TR.dir = -TR.dir; TR.phase = 'wait'; TR.aboard.clear(); TR.seats.clear(); trSend(); }
}, 250);
// ---------- Đồng Pha Lê (đảo Học viện): mỗi người 1 lô đất, xếp khối pha lê; lưu data/builds.json, mọi người cùng thấy ----------
// lô 21 × 21 ô × cao 34 tầng; chỉ chủ lô (mã thiết bị ngẫu nhiên, không phải tên) được đặt/phá; tối đa 2584 khối/lô, 34 thao tác/giây
const BUILD_FILE = path.join(path.dirname(DATA), 'builds.json'), BPLOTS = 10, BW = 21, BH = 34, BMAX = 2584, BCOL = 8;
let BUILD = { plots: Array.from({ length: BPLOTS }, () => ({ key: null, name: null, blocks: {} })) };
try { const b = JSON.parse(fs.readFileSync(BUILD_FILE, 'utf8')); if (Array.isArray(b.plots)) b.plots.slice(0, BPLOTS).forEach((p, i) => { BUILD.plots[i] = { key: p.key || null, name: p.name || null, blocks: p.blocks || {} }; }); } catch (e) {}
let buildDirty = false;
setInterval(() => { if (!buildDirty) return; buildDirty = false; fs.writeFile(BUILD_FILE, JSON.stringify(BUILD), () => {}); }, 5000);
const bPublic = () => BUILD.plots.map(p => ({ name: p.name, blocks: p.blocks }));
island.on('connection', socket => {
  let key = null, tick = 0, n = 0;
  const mine = () => BUILD.plots.findIndex(p => p.key && p.key === key);
  socket.on('build:hello', d => {
    if (!d || typeof d.key !== 'string' || !/^[a-z0-9]{13,34}$/.test(d.key)) return; key = d.key;
    socket.emit('build:all', { plots: bPublic(), mine: mine() });
  });
  socket.on('build:claim', d => {
    if (!key || mine() >= 0) return; const i = +(d && d.p);
    if (!(i >= 0 && i < BPLOTS) || BUILD.plots[i].key) return;
    BUILD.plots[i] = { key, name: clean(d.name, 18) || 'Bạn nhỏ', blocks: {} }; buildDirty = true;
    island.emit('build:plot', [i, BUILD.plots[i].name]); socket.emit('build:mine', i);
  });
  socket.on('build:set', list => {
    const i = mine(); if (i < 0 || !Array.isArray(list)) return;
    const P = BUILD.plots[i], out = [], now = Date.now(); if (now - tick > 1000) { tick = now; n = 0; }
    if ((n += list.length) > 34) return socket.emit('build:fix', [i, P.blocks]);   // quá nhanh: không nhận, gửi lại trạng thái thật để máy khách khớp
    for (const it of list.slice(0, 21)) {
      const idx = +(it && it[0]), c = +(it && it[1]);
      if (!Number.isInteger(idx) || idx < 0 || idx >= BW * BW * BH || !Number.isInteger(c) || c < 0 || c > BCOL) continue;
      if (c === 0) delete P.blocks[idx]; else { if (!(idx in P.blocks) && Object.keys(P.blocks).length >= BMAX) continue; P.blocks[idx] = c; }
      out.push([idx, c]);
    }
    if (out.length) { buildDirty = true; island.emit('build:set', [i, out]); }
  });
});
};
