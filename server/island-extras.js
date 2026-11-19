// server/island-extras.js — phần /island ngoài tài khoản/bạn bè (server/online.js): phép thuật, Làng Phù Thuỷ (nhà),
// Săn Cầu Vàng (phòng 'sky'), trang phục, mini game (xếp hạng + chuyển tin 2 người), Tàu Pha Lê, Đồng Pha Lê.
// (Khôi phục từ server/index.js trước khi tách online.js — lần ghép trước gọi require('./island-extras') nhưng thiếu file → server sập lúc khởi động.)
const fs = require('fs');
const path = require('path');

module.exports = function islandExtras({ island, islanders, hooks }, { clean, ADMIN_KEY, DATA }) {
  const DIR = path.dirname(DATA);
  const num = (v, lo, hi) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : 0);
  const lid = v => (typeof v === 'string' && /^[a-z0-9-]{1,21}$/.test(v) ? v : null);
  // trạng thái thêm của mỗi người chơi hiện cho người khác (áo choàng tàng hình, cho phép Nâng Bạn, trang phục, mini game đang chơi)
  hooks.pub = m => ({ cloak: !!m.cloak, liftOk: !!m.liftOk, look: m.look || null, mg: m.mg || null });
  // trên Tàu Pha Lê: toạ độ cục bộ của toa (c = chỉ số toa, lx/lz m, st = id ghế hoặc −1) → người khác thấy đứng vững trên tàu đang chạy
  hooks.m = (sid, d, pk) => { if (Number.isInteger(d.c) && d.c >= 0 && d.c < 16 && TR.aboard.has(sid)) pk.push(d.c, +num(d.lx, -3, 3).toFixed(2), +num(d.lz, -8, 8).toFixed(2), Number.isInteger(d.st) ? Math.max(-1, Math.min(1023, d.st)) : -1); };

  const HOUSES_FILE = path.join(DIR, 'houses.json'); let HOUSES = {}, housesDirty = false;
  try { HOUSES = JSON.parse(fs.readFileSync(HOUSES_FILE, 'utf8')) || {}; } catch (e) {}
  setInterval(() => { if (!housesDirty) return; housesDirty = false; fs.writeFile(HOUSES_FILE, JSON.stringify(HOUSES), () => {}); }, 3000).unref();
  const MGTOP_FILE = path.join(DIR, 'mg-top.json'); let mgTop = {}; try { mgTop = JSON.parse(fs.readFileSync(MGTOP_FILE, 'utf8')) || {}; } catch (e) {}
  let mgSaveT = null; const mgSave = () => { clearTimeout(mgSaveT); mgSaveT = setTimeout(() => fs.writeFile(MGTOP_FILE, JSON.stringify(mgTop), () => {}), 3000); };

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
  }, 250).unref();

  // Đồng Pha Lê: lô 21 × 21 ô × cao 34 tầng; chỉ chủ lô (mã thiết bị) được đặt/phá; tối đa 2584 khối/lô, 34 thao tác/giây
  const BUILD_FILE = path.join(DIR, 'builds.json'), BPLOTS = 10, BW = 21, BH = 34, BMAX = 2584, BCOL = 8;
  const BUILD = { plots: Array.from({ length: BPLOTS }, () => ({ key: null, name: null, blocks: {} })) };
  try { const b = JSON.parse(fs.readFileSync(BUILD_FILE, 'utf8')); if (Array.isArray(b.plots)) b.plots.slice(0, BPLOTS).forEach((p, i) => { BUILD.plots[i] = { key: p.key || null, name: p.name || null, blocks: p.blocks || {} }; }); } catch (e) {}
  let buildDirty = false;
  setInterval(() => { if (!buildDirty) return; buildDirty = false; fs.writeFile(BUILD_FILE, JSON.stringify(BUILD), () => {}); }, 5000).unref();
  const bPublic = () => BUILD.plots.map(p => ({ name: p.name, blocks: p.blocks }));

  island.on('connection', socket => {
    const M = () => islanders.get(socket.id);   // online.js tạo người chơi khi 'join'
    const pstate = m => island.emit('pstate', { id: m.id, cloak: !!m.cloak, liftOk: !!m.liftOk });
    // ---------- phép thuật (spellbook.js): chỉ chuyển tiếp hiệu ứng; không có phép gây hại ----------
    let spT = 0;
    socket.on('spell', d => {
      const me = M(), now = Date.now(); if (!me || !d || now - spT < 250 || !/^[a-z0-9_-]{1,20}$/.test(d.s) || !Array.isArray(d.a) || d.a.length !== 3) return; spT = now;
      const x = d.x && typeof d.x === 'object' && JSON.stringify(d.x).length <= 300 ? d.x : undefined;
      socket.broadcast.emit('spell', { id: me.id, s: d.s, a: d.a.map(v => num(v, -2000, 2000)), c: /^#[0-9a-f]{6}$/i.test(d.c) ? d.c : '#ffe3a0', x });
    });
    socket.on('perm', d => { const me = M(); if (!me || !d) return; me.liftOk = !!d.liftOk; pstate(me); });
    socket.on('liftReq', d => {   // Nâng Bạn: chỉ khi người được nâng đã bật cho phép; 1 lần / 5 giây
      const me = M(), t = d && islanders.get(d.to), now = Date.now(); if (!me || !t || !t.liftOk || t.cloak || now - (me.liftT || 0) < 5000) return; me.liftT = now;
      if (Math.hypot(t.x - me.x, t.z - me.z) > 34) return; island.to(t.id).emit('lifted', { by: me.id, name: me.name });
    });
    // đăng nhập chủ game bằng mã (spellbook.js gửi { key }); các lệnh { op } do online.js xử lý
    socket.on('admin', d => {
      const me = M(); if (!me || !d || typeof d.key !== 'string') return;
      me.admin = !!ADMIN_KEY && d.key.trim().toUpperCase() === ADMIN_KEY.toUpperCase(); socket.emit('admin', { ok: me.admin, quiet: !!d.quiet });
      if (!me.admin && me.cloak) { me.cloak = false; pstate(me); }
    });
    socket.on('cloak', d => { const me = M(); if (!me || !me.admin || !d) return; me.cloak = !!d.on; pstate(me); });
    // Làng Phù Thuỷ Nhỏ: mỗi tên 1 ngôi nhà; lần lưu đầu "giữ chỗ" bằng mã máy (token)
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
    // Săn Cầu Vàng: phòng 'sky' — người vào trước làm chủ trận, server chỉ chuyển tiếp
    socket.on('skJoin', () => { if (!M() || sky.has(socket.id)) return; sky.add(socket.id); socket.join('sky'); skyRoom(); });
    socket.on('skLeave', () => { if (sky.delete(socket.id)) { socket.leave('sky'); skyRoom(); } });
    let skT = 0;
    socket.on('skState', d => { const now = Date.now(); if ([...sky][0] !== socket.id || now - skT < 60) return; skT = now; if (JSON.stringify(d || 0).length < 4096) socket.to('sky').volatile.emit('skState', d); });
    socket.on('skAct', d => { const host = [...sky][0]; if (!sky.has(socket.id) || !host || host === socket.id || !d || typeof d.a !== 'string') return; island.to(host).emit('skAct', { id: socket.id, a: d.a.slice(0, 8), d: Array.isArray(d.d) ? d.d.slice(0, 3).map(v => num(v, -1, 1)) : null }); });
    // trang phục (mũ, áo choàng) · mini game đang chơi
    socket.on('look', d => { const me = M(); if (!me || !d) return; me.look = { cape: lid(d.cape), hat: lid(d.hat) }; socket.broadcast.emit('look', [me.id, me.look]); });
    socket.on('mg', d => { const me = M(); if (!me) return; me.mg = d && d.k ? { k: clean(d.k, 24), t: clean(d.t, 40) } : null; socket.broadcast.emit('mg', [me.id, me.mg]); });
    let mgWin = 0, mgN = 0;   // tối đa 21 tin / giây mỗi người
    socket.on('mgTo', d => { const me = M(), now = Date.now(); if (now - mgWin > 1000) { mgWin = now; mgN = 0; } if (!me || !d || ++mgN > 21 || !islanders.has(d.to)) return; let x = null; try { x = d.d && JSON.stringify(d.d).length < 800 ? d.d : null; } catch (e) {}
      island.to(d.to).emit('mgFrom', { from: me.id, name: me.name, type: clean(d.type, 12), d: x }); });
    socket.on('mgScore', d => { const me = M(); if (!me || !d) return; const k = clean(d.k, 24), s = +d.s, lb = !!d.lb; if (!k || !Number.isFinite(s)) return;
      const L = mgTop[k] = mgTop[k] || [], old = L.find(e => e.n === me.name); if (old) { if (lb ? s < old.s : s > old.s) { old.s = s; old.t = Date.now(); } } else L.push({ n: me.name, s, t: Date.now() });
      L.sort((a, b) => lb ? a.s - b.s : b.s - a.s); L.length = Math.min(L.length, 13); mgSave(); socket.emit('mgTop', { k, list: L }); });
    socket.on('mgTop', k => { k = clean(k, 24); socket.emit('mgTop', { k, list: mgTop[k] || [] }); });
    // Tàu Pha Lê: 1 đoàn tàu chung, lịch theo GIỜ SERVER; ghế ngồi giữ chỗ trên server
    socket.on('tr', d => {
      if (!M() || !d) return; const now = Date.now();
      if (d.op === 'board') { if (TR.phase === 'run') return; TR.aboard.add(socket.id); if (TR.phase === 'wait') { TR.phase = 'board'; TR.dep = now + TR_BOARD; } }
      else if (d.op === 'leave') { TR.aboard.delete(socket.id); freeSeat(socket.id); if (!TR.aboard.size && TR.phase === 'board') TR.phase = 'wait'; }
      else if (d.op === 'sit') { const id = num(d.id, 0, 1023) | 0, who = TR.seats.get(id); if (!TR.aboard.has(socket.id) || (who && who !== socket.id)) { socket.emit('trSeat', { ok: false, id }); return; } freeSeat(socket.id); TR.seats.set(id, socket.id); socket.emit('trSeat', { ok: true, id }); }
      else if (d.op === 'stand') freeSeat(socket.id);
      else if (d.op === 'skip') { if (TR.phase !== 'run' || !TR.aboard.has(socket.id)) return; if (TR.aboard.size > 1) { socket.emit('toast', '🚂 Có bạn khác cùng chuyến — mình cùng ngắm cảnh tới ga nhé!'); return; } TR.t0 = now - TR_DUR; }
      else if (d.op === 'reloc') { if (TR.phase !== 'wait' || TR.aboard.size || (d.at !== 'A' && d.at !== 'B')) return; TR.at = d.at; TR.dir = d.at === 'A' ? 1 : -1; }
      else return;
      trSend();
    });
    socket.emit('tr', trPub());
    // Đồng Pha Lê
    let key = null, tick = 0, n = 0;
    const mine = () => BUILD.plots.findIndex(p => p.key && p.key === key);
    socket.on('build:hello', d => { if (!d || typeof d.key !== 'string' || !/^[a-z0-9]{13,34}$/.test(d.key)) return; key = d.key; socket.emit('build:all', { plots: bPublic(), mine: mine() }); });
    socket.on('build:claim', d => {
      if (!key || mine() >= 0) return; const i = +(d && d.p);
      if (!(i >= 0 && i < BPLOTS) || BUILD.plots[i].key) return;
      BUILD.plots[i] = { key, name: clean(d.name, 18) || 'Bạn nhỏ', blocks: {} }; buildDirty = true;
      island.emit('build:plot', [i, BUILD.plots[i].name]); socket.emit('build:mine', i);
    });
    socket.on('build:set', list => {
      const i = mine(); if (i < 0 || !Array.isArray(list)) return;
      const P = BUILD.plots[i], out = [], now = Date.now(); if (now - tick > 1000) { tick = now; n = 0; }
      if ((n += list.length) > 34) return socket.emit('build:fix', [i, P.blocks]);
      for (const it of list.slice(0, 21)) {
        const idx = +(it && it[0]), c = +(it && it[1]);
        if (!Number.isInteger(idx) || idx < 0 || idx >= BW * BW * BH || !Number.isInteger(c) || c < 0 || c > BCOL) continue;
        if (c === 0) delete P.blocks[idx]; else { if (!(idx in P.blocks) && Object.keys(P.blocks).length >= BMAX) continue; P.blocks[idx] = c; }
        out.push([idx, c]);
      }
      if (out.length) { buildDirty = true; island.emit('build:set', [i, out]); }
    });
    socket.on('disconnect', () => {
      if (sky.delete(socket.id)) skyRoom();
      if (TR.aboard.delete(socket.id) || freeSeat(socket.id)) { if (!TR.aboard.size && TR.phase === 'board') TR.phase = 'wait'; trSend(); }
    });
  });
};
