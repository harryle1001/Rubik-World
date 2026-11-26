// academy/village.js — LÀNG PHÙ THUỶ NHỎ: 5 lô đất ở góc đông nam đảo Học viện (giữa hồ và mép đảo), xây nhà bằng phép "Dựng Lên!".
// - Lô 0 = lô CỦA EM (chỉ em xây được ở đây — chống phá); lô 1–4 = nhà các bạn khác (server) hoặc "nhà mẫu" khi chơi một mình (chỉ xem).
// - Mỗi lô 6 × 10 ô (ô 3,4 m), 5 tầng. Mảnh tĩnh của 1 lô gộp thành 1 lưới (village-pieces.js) → mỗi lô 1–3 draw call.
// - Lưu: localStorage 'village.house.<tên>'; có server thì lưu server (Socket.io /island: house:save/get/list), khoá bằng mã máy (token).
// - Khung cắm (index.js): create(ctx, magic, { toWorld }) → { build(), unbuild(), update(dt, t) }.
import * as THREE from 'three';
import { matV } from '../sample/palette.js';
import { Batch } from './geo.js';
import { VILLAGE as V, QUAY, toWorld as tw } from './plan.js';
import { S, BY_ID, pieceGeo, loadAll, mergeLot, edgeDir, MAX_PIECES } from './village-pieces.js';
import { TEMPLATES } from './village-data.js';
import { createBuilder } from './village-build.js';
import { freeTex, freeAll } from '../free.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const token = () => { let t = load('village.token', null); if (!t) { t = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join(''); save('village.token', t); } return t; };
const valid = P => Array.isArray(P) ? P.filter(p => Array.isArray(p) && BY_ID[p[0]] && p.slice(1, 6).every(n => Number.isInteger(n)) && p[1] >= 0 && p[1] < V.ni && p[2] >= 0 && p[2] < V.nj && p[3] >= 0 && p[3] < 5).slice(0, MAX_PIECES) : [];

function signTex(text, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const k = c.getContext('2d');
  k.fillStyle = 'rgba(27,22,38,.82)'; k.beginPath(); k.roundRect(12, 10, 488, 108, 34); k.fill(); k.strokeStyle = '#ffe3a088'; k.lineWidth = 3; k.stroke();
  k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillStyle = '#ffe3a0'; k.font = 'bold 40px system-ui'; k.fillText(text, 256, sub ? 48 : 64, 470);
  if (sub) { k.fillStyle = '#e8dcc0'; k.font = '600 26px system-ui'; k.fillText(sub, 256, 92, 470); }
  return new THREE.CanvasTexture(c);
}

export function create(ctx, magic, { toWorld = tw } = {}) {
  const geos = {}; let ready = false, built = null;
  const myName = () => (ctx.account && ctx.account.profile && !ctx.account.guest ? ctx.account.name : ctx.playerName) || 'Khách';
  const myKey = () => 'village.house.' + myName();
  const lots = [...Array(V.n)].map((_, n) => {
    const [x, z] = toWorld(V.u0, V.v0 + n * (V.lw + V.gap));   // góc lô: x = v, z = u (thế giới thẳng trục)
    return { n, x, z, y: V.y, pieces: [], owner: n ? null : myName(), title: '', mesh: null, boxes: [], cellMap: new Map(), sign: null, dirty: true };
  });
  const mine = lots[0];
  mine.pieces = valid(load(myKey(), []));

  // ---------- mạng: lưu / tải / danh sách nhà ----------
  const sock = () => { const s = ctx.net && ctx.net.sock; return s && s.connected ? s : null; };
  let saveT = 0;
  function persist() { save(myKey(), mine.pieces); saveT = 1.6; }
  function pushServer() { const s = sock(); if (!s) return; s.emit('house:save', { name: myName(), token: token(), pieces: mine.pieces }, r => { if (r && r.err) ctx.toast('🏡 ' + r.err, 4000); }); }
  function fetchList(cb) { const s = sock(); if (!s) return cb(null); s.timeout(5000).emit('house:list', null, (e, list) => cb(e ? null : list)); }
  function fetchHouse(name, cb) { const s = sock(); if (!s) return cb(null); s.timeout(5000).emit('house:get', name, (e, d) => cb(e || !d ? null : valid(d.pieces))); }
  function setLot(L, owner, pieces, title) { L.owner = owner; L.pieces = pieces; L.title = title || ''; L.dirty = true; if (built) refreshSign(L); }
  function fillOthers() {   // lô 1–4: nhà mới nhất của các bạn (server) → còn trống thì nhà mẫu
    const tpl = () => lots.slice(1).forEach((L, k) => { if (!L.owner || L.tpl) { const T = TEMPLATES[k % TEMPLATES.length]; setLot(L, null, T.make(), T.icon + ' Nhà mẫu: ' + T.name); L.tpl = true; } });
    tpl();
    fetchList(list => {
      if (!list) return; const others = list.filter(h => h.name !== myName() && h.n > 0).slice(0, V.n - 1);
      others.forEach((h, k) => fetchHouse(h.name, P => { if (P) { const L = lots[k + 1]; L.tpl = false; setLot(L, h.name, P, '🏠 Nhà của ' + h.name); } }));
    });
  }

  // ---------- dựng lưới lô ----------
  function rebuildLot(L) {
    L.dirty = false; if (!built) return;
    if (L.mesh) { built.g.remove(L.mesh); L.mesh.geometry.dispose(); L.mesh = null; }
    const g = ready ? mergeLot(L.flying && L.flying.size ? L.pieces.filter(p => !L.flying.has(p)) : L.pieces, geos) : null;
    if (g) { const m = new THREE.Mesh(g, matV()); m.position.set(L.x, L.y, L.z); m.castShadow = m.receiveShadow = true; m.updateMatrix(); m.matrixAutoUpdate = false; m.name = 'village-lot-' + L.n; built.g.add(m); L.mesh = m; }
    // va chạm: tường/khối = hộp (đứng lên được nếu thấp); nền/cầu thang/khối = mặt đi (groundExtra)
    for (const b of L.boxes) { const k = ctx.boxes.indexOf(b); if (k >= 0) ctx.boxes.splice(k, 1); }
    L.boxes = []; L.cellMap = new Map();
    for (const pc of L.pieces) {
      const [id, i, j, k, r] = pc, p = BY_ID[id], cx = L.x + (i + 0.5) * S, cz = L.z + (j + 0.5) * S, y0 = L.y + k * S;
      if (p.solid === 'wall') { const [dx, dz] = edgeDir(r), ex = cx + dx * S / 2, ez = cz + dz * S / 2, hx = dx ? 0.2 : S / 2, hz = dz ? 0.2 : S / 2; L.boxes.push({ x0: ex - hx, x1: ex + hx, z0: ez - hz, z1: ez + hz, top: y0 + S }); }
      else if (p.solid === 'block') { const h = id === 'tower' ? S * 0.31 : S * 0.48; L.boxes.push({ x0: cx - h, x1: cx + h, z0: cz - h, z1: cz + h, top: y0 + S * (id === 'tower' ? 1 : 0.96) }); }
      if (p.solid === 'floor' || p.solid === 'ramp' || p.solid === 'block') { const key = i + ',' + j; if (!L.cellMap.has(key)) L.cellMap.set(key, []); L.cellMap.get(key).push(pc); }
    }
    ctx.boxes.push(...L.boxes);
  }
  const lotAt = (x, z) => { for (const L of lots) if (x >= L.x && x < L.x + V.lw && z >= L.z && z < L.z + V.ll) return L; return null; };
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    let h = prevExtra ? prevExtra(x, z, y) : -99; if (!built) return h;
    const L = lotAt(x, z); if (!L) return h;
    const lx = x - L.x, lz = z - L.z, list = L.cellMap.get(Math.floor(lx / S) + ',' + Math.floor(lz / S)); if (!list) return h;
    for (const [id, , , k, r] of list) {
      const y0 = L.y + k * S; let top;
      if (id === 'floor') top = y0 + 0.21;
      else if (id === 'stairs') { const fx = lx / S % 1 - 0.5, fz = lz / S % 1 - 0.5, a = -r * Math.PI / 2 + Math.PI, t = fx * Math.sin(a) + fz * Math.cos(a); top = y0 + S * Math.min(1, Math.max(0, t + 0.5)); }
      else top = y0 + S * (id === 'tower' ? 1 : 0.96);
      if (y === undefined || top <= y + 0.9) h = Math.max(h, top);
    }
    return h;
  };

  // ---------- biển tên, nền lô, bảng tin ----------
  function refreshSign(L) {
    if (!built) return; if (L.sign) { built.g.remove(L.sign); L.sign.material.map.dispose(); L.sign.material.dispose(); }
    const t = L.n === 0 ? signTex('🏡 Lô đất của ' + myName(), 'Phép “Dựng Lên!” — chỉ em xây được ở đây') : signTex(L.title || 'Lô trống', L.owner ? 'Đến thăm (chỉ xem)' : 'Nhà mẫu — chỉ xem');
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false })); sp.scale.set(6.5, 1.6, 1); sp.position.set(L.x + V.lw / 2, L.y + 4.2, L.z - 1.3); sp.name = 'village-sign';
    built.g.add(sp); L.sign = sp;
  }
  const [bx, bz] = toWorld(V.u0 - 3.4, V.v0 - 2.8), board = new THREE.Vector3(bx, V.y, bz);   // bảng tin đầu làng
  const [qx, qz] = toWorld(QUAY.u0 + 3, 18);                                                   // chân bến lâu đài → bay chổi tới làng
  function build() {
    if (built) return; const g = new THREE.Group(); g.name = 'academy-village'; ctx.scene.add(g); built = { g };
    const b = new Batch(), stone = '#9a948a', path = '#c9b894', soil = '#7a6a4a';
    for (const L of lots) {   // nền lô: đất + viền đá (Fibonacci: viền 0,34 m)
      b.box(L.x, L.x + V.lw, L.y - 0.3, L.y + 0.04, L.z, L.z + V.ll, L.n === 0 ? '#8aa05a' : soil);
      for (const [x0, x1, z0, z1] of [[0, V.lw, -0.34, 0], [0, V.lw, V.ll, V.ll + 0.34], [-0.34, 0, 0, V.ll], [V.lw, V.lw + 0.34, 0, V.ll]]) b.box(L.x + x0, L.x + x1, L.y - 0.3, L.y + 0.2, L.z + z0, L.z + z1, stone);
    }
    const [px0, pz0] = toWorld(V.u0 - 5.6, V.v0 - 3.4), [px1] = toWorld(V.u0, V.v1 + 3.4);
    b.box(px0, px1, V.y - 0.3, V.y + 0.06, pz0, pz0 + 4.2, path);                               // đường làng dọc mặt tiền các lô
    b.box(bx - 0.12, bx + 0.12, V.y, V.y + 2.1, bz - 0.12, bz + 0.12, '#6e4a30'); b.box(bx - 1.1, bx + 1.1, V.y + 1.2, V.y + 2.3, bz - 0.08, bz + 0.08, '#a8744a');   // bảng tin
    const m = new THREE.Mesh(b.build(), matV()); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'village-ground'; g.add(m);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex('🧙 Làng Phù Thuỷ Nhỏ', 'Xây nhà bằng phép thuật · 📮 thăm nhà bạn'), depthWrite: false })); sp.scale.set(8.1, 2, 1); sp.position.set(bx, V.y + 4.4, bz); g.add(sp);
    lots.forEach(L => { refreshSign(L); L.dirty = true; });
    ctx.colliders.push(built.col = { x: bx, z: bz, r: 0.4 });
    if (!ready) loadAll().then(list => { list.forEach((G, k) => { if (G) geos[Object.keys(BY_ID)[k]] = G; }); ready = true; lots.forEach(L => L.dirty = true); });
    fillOthers();
  }
  function unbuild() {
    if (!built) return; builder.close();
    for (const L of lots) { for (const b of L.boxes) { const k = ctx.boxes.indexOf(b); if (k >= 0) ctx.boxes.splice(k, 1); } L.boxes = []; L.cellMap = new Map(); if (L.mesh) L.mesh.geometry.dispose(); L.mesh = null; if (L.sign) { L.sign.material.map.dispose(); L.sign.material.dispose(); } L.sign = null; }
    const k = ctx.colliders.indexOf(built.col); if (k >= 0) ctx.colliders.splice(k, 1);
    ctx.scene.remove(built.g); built.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); freeAll(built.g); built = null;
  }

  // ---------- thăm nhà bạn (chỉ xem) ----------
  function visitBoard() {
    const show = list => {
      const items = (list || []).filter(h => h.name !== myName()).slice(0, 13);
      const rows = items.length ? items.map((h, k) => `<button data-k="${k}">🏠 ${h.name.replace(/</g, '&lt;')} <small>· ${h.n} mảnh</small></button>`).join('') : `<p>${sock() ? 'Chưa có bạn nào xây nhà. Hãy là người đầu tiên!' : '⚪ Đang chơi một mình — các lô bên cạnh là <b>nhà mẫu</b>. Khi có mạng, nhà của các bạn sẽ hiện ở đây.'}</p>`;
      const el = document.createElement('div'); el.id = 'mgCard'; el.addEventListener('pointerdown', e => e.stopPropagation()); el.innerHTML = `<h4>📮 Bảng tin Làng Phù Thuỷ Nhỏ</h4><div class="ch" style="grid-template-columns:1fr">${rows}</div><div class="ch" style="grid-template-columns:1fr"><button class="no" data-x>Đóng</button></div>`;
      document.getElementById('mgCard')?.remove(); document.body.appendChild(el);
      el.onclick = e => {
        const bt = e.target.closest('button'); if (!bt) return; if (bt.dataset.x !== undefined) return el.remove();
        const h = items[+bt.dataset.k]; el.remove();
        fetchHouse(h.name, P => { if (!P) return ctx.toast('📮 Không tải được nhà này, thử lại sau nhé.', 3000); const L = lots[1]; L.tpl = false; setLot(L, h.name, P, '🏠 Nhà của ' + h.name); ctx.player.teleport(L.x + V.lw / 2, L.z - 3, L.y + 0.3); ctx.player.cam.yaw = Math.PI; ctx.toast(`🏠 Đang thăm <b>nhà của ${h.name}</b> — chỉ xem, không sửa được. Đẹp không nào?`, 4000); });
      };
    };
    fetchList(show);
  }

  // ---------- phép "Dựng Lên!" + chế độ xây ----------
  const builder = createBuilder(ctx, magic, {
    lot: mine, geos, get ready() { return ready; }, S,
    changed(landed) { mine.dirty = true; if (!landed) persist(); },
    templates: TEMPLATES,
  });
  const inMine = (p = ctx.player.pos) => p.x > mine.x - 3 && p.x < mine.x + V.lw + 3 && p.z > mine.z - 5 && p.z < mine.z + V.ll + 3 && Math.abs(p.y - mine.y) < 21;
  function castBuild(api) {   // gọi từ phép (magic) hoặc nút tạm
    if (!built) return ctx.toast('🧙 Phép <b>Dựng Lên!</b> chỉ dùng được ở <b>Làng Phù Thuỷ Nhỏ</b> (góc đông nam đảo Học viện).', 4000);
    if (!inMine()) return ctx.toast('🏡 Hãy đứng trong <b>lô đất của em</b> (lô có biển tên em, cỏ xanh) rồi niệm <b>Dựng Lên!</b>', 4000);
    builder.open(api);
  }
  const spell = { id: 'build', name: 'Dựng Lên', icon: '🏗️', subjects: ['toan'], learn: 'xây nhà bằng phép thuật ở Làng Phù Thuỷ Nhỏ (diện tích, chu vi, đối xứng, tỷ lệ vàng).', hint: 'Tới lô đất của em ở Làng Phù Thuỷ Nhỏ.', cast: castBuild };
  if (ctx.spells && ctx.spells.register) ctx.spells.register(spell); else magic.addSpell(spell);   // vòng phép mới (claude/spells-core) nếu có

  function update(dt) {
    if (saveT > 0 && (saveT -= dt) <= 0) pushServer();
    if (!built) {   // chưa dựng: chỉ còn lối bay chổi từ bến
      return;
    }
    for (const L of lots) if (L.dirty && (ready || !L.mesh)) rebuildLot(L);
    builder.update(dt);
    const p = ctx.player.pos; if (ctx.player.vehicle || builder.active) return;
    if (Math.hypot(p.x - qx, p.z - qz) < 5 && Math.abs(p.y - QUAY.y) < 3) ctx.offer('🧹 Bay chổi tới Làng Phù Thuỷ Nhỏ', () => goVillage(), 7);
    if (Math.hypot(p.x - bx, p.z - bz) < 3.4) ctx.offer('📮 Thăm nhà các bạn', visitBoard, 8);
    else if (inMine()) ctx.offer('🏗️ Dựng Lên! (xây nhà)', () => castBuild(), 7);
    else if (Math.hypot(p.x - bx, p.z - bz) < 34 && Math.abs(p.y - V.y) < 8) ctx.offer('⛵ Về bến thuyền lâu đài', () => { ctx.player.teleport(qx, qz, QUAY.y + 0.3); }, 2);
  }
  function goVillage() { const [x, z] = toWorld(V.u0 - 3, V.v0 + V.lw / 2); magic.burst && magic.burst(ctx.player.pos.clone().setY(ctx.player.pos.y + 1), new THREE.Vector3(0, 1, 0), '#ffe3a0', 21, 4, 1); ctx.player.teleport(x, z, V.y + 0.3); ctx.player.cam.yaw = Math.PI; ctx.toast('🧙 Chào mừng tới <b>Làng Phù Thuỷ Nhỏ</b>! Lô cỏ xanh có biển tên em là đất của em — niệm phép <b>Dựng Lên!</b> để xây nhà.', 5000); }
  ctx.village = { build, unbuild, update, lots, mine, builder, castBuild, goVillage, visitBoard, get built() { return built; }, get ready() { return ready; }, pushServer };
  return ctx.village;
}
