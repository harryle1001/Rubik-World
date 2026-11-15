// physics.js — Vật lý nhẹ tự viết (không thư viện, chạy tốt trên điện thoại).
// - Lưới tra cứu va chạm ctx.grid: near(x, z) → { cols, boxes } (cây/đá ctx.colliders + nhà/tường ctx.boxes), player.js dùng chung.
// - Đồ vật đẩy/lăn được: bóng đá, bóng bãi biển, thùng gỗ, hòn đá nhỏ — trọng lực, nảy, ma sát, lăn theo dốc, nổi/chìm trong nước.
// - Chỉ mô phỏng vật trong bán kính SIM quanh người chơi, vật xa/đứng yên thì "ngủ". Số vật và bán kính giảm theo ctx.qualityLevel.
// - Thêm vật: ctx.physics.add('ball' | 'beach' | 'crate' | 'stone', x, z)
import * as THREE from 'three';
import { CFG } from './config.js';
import { toon } from './style.js';
import { SPAWN, to3, TOWN_Y } from './layout.js';

const G = CFG.player.gravity, W = CFG.island.waterLevel, CELL = 8;
// r: bán kính va chạm · m: khối lượng (kg) · e: độ nảy · f: ma sát lăn/trượt (1/giây) · rho: khối lượng riêng so với nước (<1 thì nổi)
const KIND = {
  ball:  { r: 0.22, m: 0.45, e: 0.62, f: 0.5, rho: 0.15, roll: true },
  beach: { r: 0.4,  m: 0.15, e: 0.75, f: 0.7, rho: 0.03, roll: true, drag: 0.6 },
  crate: { r: 0.42, m: 25,   e: 0.12, f: 7,   rho: 0.6,  roll: false, half: 0.4 },
  stone: { r: 0.2,  m: 4,    e: 0.25, f: 2.2, rho: 2.6,  roll: true },
};
const SIM = [40, 34, 26, 18], MAXN = [48, 36, 24, 14]; // theo mức chất lượng 0..3
const FACTS = {
  ball: '⚽ Sút càng mạnh, bóng bay càng xa — lực càng lớn thì gia tốc càng lớn (F = m·a).',
  crate: '📦 Thùng gỗ nặng nên khó đẩy hơn bóng: vật càng nặng, quán tính càng lớn.',
  float: '🏖️ Vật nhẹ hơn nước thì nổi — nước đẩy vật lên (lực đẩy Ác-si-mét).',
  sink: '🪨 Đá nặng hơn nước (khối lượng riêng lớn hơn) nên chìm xuống đáy.',
  slope: '⛰️ Trên dốc, trọng lực kéo vật lăn xuống — dốc càng đứng, lăn càng nhanh.',
};

// ---------- Lưới va chạm: chia ô 8 m, tự dựng lại khi có thêm cây/nhà ----------
function makeGrid(ctx) {
  const cells = new Map(); let nc = -1, nb = -1; const EMPTY = { cols: [], boxes: [] };
  const key = (i, j) => i * 73856 + j;
  const cell = (i, j) => { const k = key(i, j); let c = cells.get(k); if (!c) cells.set(k, c = { cols: [], boxes: [] }); return c; };
  function rebuild() {
    cells.clear(); const cols = ctx.colliders, boxes = ctx.boxes || []; nc = cols.length; nb = boxes.length;
    for (const c of cols) { const pad = c.r + 1.5; for (let i = Math.floor((c.x - pad) / CELL); i <= Math.floor((c.x + pad) / CELL); i++) for (let j = Math.floor((c.z - pad) / CELL); j <= Math.floor((c.z + pad) / CELL); j++) cell(i, j).cols.push(c); }
    for (const b of boxes) for (let i = Math.floor((b.x0 - 1.5) / CELL); i <= Math.floor((b.x1 + 1.5) / CELL); i++) for (let j = Math.floor((b.z0 - 1.5) / CELL); j <= Math.floor((b.z1 + 1.5) / CELL); j++) cell(i, j).boxes.push(b);
  }
  // near(): mọi vật cản có thể chạm trong bán kính ~1.5 m quanh (x, z)
  const near = (x, z) => { if (ctx.colliders.length !== nc || (ctx.boxes || []).length !== nb) rebuild(); return cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) || EMPTY; };
  return { near, rebuild };
}

export function createPhysics(ctx) {
  const { scene, terrain } = ctx;
  const grid = ctx.grid = makeGrid(ctx);
  const sup = (x, z, y) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, y) : -99);

  // ---------- Hình greybox (mỗi loại 1 InstancedMesh → 4 draw call) ----------
  const paint = (geo, fn) => { geo = geo.toNonIndexed(); const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(); for (let i = 0; i < p.count; i += 3) { fn(c, p.getX(i) + p.getX(i + 1) + p.getX(i + 2), p.getY(i) + p.getY(i + 1) + p.getY(i + 2), p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2), i / 3); for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3); } geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo; };
  const geos = {
    ball: paint(new THREE.IcosahedronGeometry(KIND.ball.r, 1), (c, x, y, z, f) => c.set(f % 4 === 0 ? '#222222' : '#ffffff')),
    beach: paint(new THREE.SphereGeometry(KIND.beach.r, 12, 8), (c, x, y, z) => c.set(Math.abs(y) > KIND.beach.r * 2.6 ? '#ffffff' : ['#ff4d4d', '#ffd23f', '#3fa7ff', '#ffffff', '#52d273', '#ff8c3f'][Math.floor((Math.atan2(z, x) / Math.PI + 1) * 3) % 6])),
    crate: paint(new THREE.BoxGeometry(0.8, 0.8, 0.8), (c, x, y, z, f) => c.set(f % 4 < 2 ? '#b07a45' : '#9a6638')),
    stone: paint(new THREE.DodecahedronGeometry(KIND.stone.r, 0), (c, x, y, z, f) => c.set(f % 3 ? '#8d8f94' : '#a3a5aa')),
  };
  const mat = toon('#ffffff', { vertexColors: true });
  const meshes = {};
  for (const k in KIND) { const m = new THREE.InstancedMesh(geos[k], mat, 24); m.count = 0; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); meshes[k] = m; }

  const bodies = [], o = new THREE.Object3D(), tmpQ = new THREE.Quaternion(), ax = new THREE.Vector3();
  function add(kind, x, z, y) {
    const K = KIND[kind], m = meshes[kind]; if (!K || m.count >= 24) return null;
    const p = new THREE.Vector3(x, (y ?? sup(x, z, 99)) + K.r + 0.05, z);
    const b = { kind, K, pos: p, vel: new THREE.Vector3(), q: new THREE.Quaternion(), home: p.clone(), idx: m.count++, sleep: false, still: 0, ground: false, yaw: Math.random() * 6.28 };
    
    bodies.push(b); draw(b); return b;
  }
  function draw(b) { o.position.copy(b.pos); if (b.kind === 'crate') o.position.y -= b.K.r - b.K.half; o.quaternion.copy(b.q); o.updateMatrix(); const m = meshes[b.kind]; m.setMatrixAt(b.idx, o.matrix); m.instanceMatrix.needsUpdate = true; }
  const told = new Set(); const fact = k => { if (told.has(k) || !ctx.toast) return; told.add(k); ctx.toast(FACTS[k], 4200); };
  const nrm = new THREE.Vector3();
  const normalAt = (x, z, y) => { // pháp tuyến mặt đất (dốc địa hình); sàn phẳng của thị trấn → thẳng đứng
    if (ctx.groundExtra && ctx.groundExtra(x, z, y) >= terrain.heightAt(x, z) - 0.01) return nrm.set(0, 1, 0);
    const e = 0.4; return nrm.set(terrain.heightAt(x - e, z) - terrain.heightAt(x + e, z), 2 * e, terrain.heightAt(x, z - e) - terrain.heightAt(x, z + e)).normalize();
  };

  // ---------- Một bước mô phỏng cho 1 vật ----------
  function step(b, dt) {
    const K = b.K, p = b.pos, v = b.vel, r = K.r, px = p.x, pz = p.z;
    v.y -= G * dt;
    // nước: lực đẩy Ác-si-mét + cản nước
    const sub = Math.min(1, Math.max(0, (W - (p.y - r)) / (2 * r)));
    if (sub > 0) { v.y += Math.min(G * sub / K.rho, G * 2.5) * dt; v.multiplyScalar(Math.exp(-dt * 2.2 * sub)); fact(K.rho < 1 ? 'float' : 'sink'); }
    if (K.drag) v.multiplyScalar(Math.exp(-dt * K.drag * 0.2)); // bóng bãi biển nhẹ: cản không khí
    p.addScaledVector(v, dt);
    // vật cản: cây/đá (trụ tròn) và nhà/tường (hộp)
    const N = grid.near(p.x, p.z);
    for (const c of N.cols) {
      const dx = p.x - c.x, dz = p.z - c.z, rr = c.r + r, d2 = dx * dx + dz * dz; if (d2 >= rr * rr) continue;
      if (p.y - r > terrain.heightAt(c.x, c.z) + 4) continue;
      const d = Math.sqrt(d2) || 1e-3, nx = dx / d, nz = dz / d; p.x = c.x + nx * rr; p.z = c.z + nz * rr;
      const vn = v.x * nx + v.z * nz; if (vn < 0) { v.x -= (1 + K.e) * vn * nx; v.z -= (1 + K.e) * vn * nz; }
    }
    let top = -99;
    for (const B of N.boxes) {
      if (p.x < B.x0 - r || p.x > B.x1 + r || p.z < B.z0 - r || p.z > B.z1 + r || p.y - r >= B.top) continue;
      if (p.y - r > B.top - 0.35 && v.y <= 0) { top = Math.max(top, B.top); continue; } // rơi lên nóc/mặt hộp
      // đẩy ra phía vật đến (theo vị trí trước) → không xuyên tường mỏng
      const inX = px > B.x0 - r && px < B.x1 + r, inZ = pz > B.z0 - r && pz < B.z1 + r;
      let side;
      if (!inX) side = px < B.x0 ? 0 : 1; else if (!inZ) side = pz < B.z0 ? 2 : 3;
      else { const a = [p.x - (B.x0 - r), (B.x1 + r) - p.x, p.z - (B.z0 - r), (B.z1 + r) - p.z]; side = a.indexOf(Math.min(...a)); }
      if (side === 0) { p.x = B.x0 - r; if (v.x > 0) v.x *= -K.e; } else if (side === 1) { p.x = B.x1 + r; if (v.x < 0) v.x *= -K.e; }
      else if (side === 2) { p.z = B.z0 - r; if (v.z > 0) v.z *= -K.e; } else { p.z = B.z1 + r; if (v.z < 0) v.z *= -K.e; }
    }
    // mặt đất (địa hình, sàn thị trấn, nóc hộp)
    const s = Math.max(sup(p.x, p.z, p.y), top);
    b.ground = false;
    if (p.y - r <= s + 0.02) {
      const n = top > sup(p.x, p.z, p.y) ? nrm.set(0, 1, 0) : normalAt(p.x, p.z, p.y);
      if (p.y - r < s) p.y = s + r;
      const vn = v.dot(n);
      if (vn < 0) { const bounce = vn < -1.5 ? K.e : 0; v.addScaledVector(n, -(1 + bounce) * vn); }
      // ma sát: bóng lăn đi xa, thùng trượt dừng nhanh
      const k = Math.exp(-dt * K.f); const vy = v.y; v.multiplyScalar(k); v.y = vy * (n.y > 0.99 ? 1 : k);
      if (n.y < 0.93 && v.lengthSq() > 4) fact('slope');
      b.ground = true;
    }
    // lăn: quay quanh trục vuông góc với hướng chạy
    if (K.roll) { const sp = Math.hypot(v.x, v.z); if (sp > 0.02) { tmpQ.setFromAxisAngle(ax.set(v.z / sp, 0, -v.x / sp), sp * dt / r); b.q.premultiply(tmpQ); } }
  }

  // ---------- Va chạm vật–vật (cầu–cầu) và người chơi–vật ----------
  const PM = 50, PR = 0.38; // người chơi: 50 kg, bán kính 0.38 m, cao 1.6 m
  function pair(a, b) {
    const d = tmp.subVectors(b.pos, a.pos), L2 = d.lengthSq(), rr = a.K.r + b.K.r; if (L2 >= rr * rr || L2 < 1e-8) return;
    const L = Math.sqrt(L2); d.divideScalar(L); const ia = 1 / a.K.m, ib = 1 / b.K.m, pen = rr - L;
    a.pos.addScaledVector(d, -pen * ia / (ia + ib)); b.pos.addScaledVector(d, pen * ib / (ia + ib));
    const vn = tmp2.subVectors(b.vel, a.vel).dot(d); if (vn >= 0) return;
    const j = -(1 + Math.min(a.K.e, b.K.e)) * vn / (ia + ib); a.vel.addScaledVector(d, -j * ia); b.vel.addScaledVector(d, j * ib);
    a.sleep = b.sleep = false; a.still = b.still = 0;
  }
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  // thùng gỗ: người chơi va chạm trong từng bước nhỏ của player.js (không xuyên qua), gọi push() để đẩy thùng
  const solid = [];
  function push(b, nx, nz, pen, pv) {
    const ib = 1 / b.K.m, w = ib / (ib + 1 / PM);
    b.pos.x += nx * pen * w; b.pos.z += nz * pen * w; b.sleep = false; b.still = 0;
    const vn = pv.x * nx + pv.z * nz; if (vn > 0) { b.vel.x += (nx * vn * w - b.vel.x) * 0.5; b.vel.z += (nz * vn * w - b.vel.z) * 0.5; fact('crate'); }
    return w;
  }
  function hitPlayer(b, pl) {
    if (b.kind === 'crate') return false;
    const P = pl.pos, r = b.K.r; if (b.pos.y + r < P.y || b.pos.y - r > P.y + 1.6) return false;
    const dx = b.pos.x - P.x, dz = b.pos.z - P.z, rr = r + PR, d2 = dx * dx + dz * dz; if (d2 >= rr * rr) return false;
    // vật nhỏ nằm thấp dưới chân: người chơi bước lên được (đá, bóng) → bị đá văng nhẹ
    const d = Math.sqrt(d2) || 1e-3, nx = dx / d, nz = dz / d, pen = rr - d, ib = 1 / b.K.m, ip = 1 / PM, wb = ib / (ib + ip);
    b.pos.x += nx * pen * wb; b.pos.z += nz * pen * wb; P.x -= nx * pen * (1 - wb); P.z -= nz * pen * (1 - wb);
    const pv = pl.vel, vn = (b.vel.x - pv.x) * nx + (b.vel.z - pv.z) * nz;
    if (vn < 0) {
      const j = -(1 + b.K.e) * vn / (ib + ip);
      b.vel.x += nx * j * ib; b.vel.z += nz * j * ib; pv.x -= nx * j * ip; pv.z -= nz * j * ip;
      if (b.K.m < 1) b.vel.y += Math.min(4, -vn * 0.35); // chạm bóng: bóng nảy lên một chút
      fact(b.kind === 'crate' ? 'crate' : 'ball');
    }
    b.sleep = false; b.still = 0; return true;
  }

  // ---------- Đặt đồ vật ----------
  const free = (x, z) => { const N = grid.near(x, z); return !N.boxes.some(B => x > B.x0 - 0.8 && x < B.x1 + 0.8 && z > B.z0 - 0.8 && z < B.z1 + 0.8) && !N.cols.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 0.8); };
  const tryAdd = (kind, x, z) => free(x, z) && sup(x, z, 99) > W - 0.2 ? add(kind, x, z) : null;
  { // bãi xuất phát trước cổng trường: thùng gỗ xếp chồng, vài quả bóng, đá nhỏ
    const [sx, sz] = SPAWN;
    tryAdd('ball', sx - 3, sz + 3);
    for (const [dx, dz] of [[-4, -4], [-4.85, -4], [-4.4, -4.85]]) tryAdd('crate', sx + dx, sz + dz);
    const c = bodies.filter(b => b.kind === 'crate'); if (c.length >= 3) { c[2].pos.set(c[0].pos.x - 0.42, c[0].pos.y + 0.82, c[0].pos.z - 0.1); }
    tryAdd('beach', sx - 6, sz + 1.5);
    for (let i = 0; i < 6; i++) { const a = i * 1.1, rr = 5 + i * 0.7; tryAdd('stone', sx + Math.cos(a) * rr, sz + Math.sin(a) * rr); }
  }
  { // bãi cát quanh đảo cũ: bóng bãi biển, đá cuội, thùng trôi dạt
    let nb = 0, ns = 0, nc = 0;
    for (let i = 0; i < 300 && (nb < 4 || ns < 8 || nc < 3); i++) {
      const a = (i * 2.399) % 6.283, r = 45 + (i * 7.3) % 40, x = Math.cos(a) * r, z = Math.sin(a) * r, h = terrain.heightAt(x, z);
      if (h < 0.3 || h > 1.3 || terrain.slopeAt(x, z) > 0.5) continue;
      if (nb < 4 && i % 3 === 0) nb += !!tryAdd('beach', x, z); else if (ns < 8 && i % 3 === 1) ns += !!tryAdd('stone', x, z); else if (nc < 3) nc += !!tryAdd('crate', x, z);
    }
  }
  // sân bóng đá: chờ dữ liệu trường (iframe) rồi đặt bóng giữa sân
  const waitField = setInterval(() => {
    const RS = document.querySelector('iframe[title="Trường Rubik"]')?.contentWindow?.RS, f = RS && RS.R && RS.R.field; if (!RS || !RS.R) return; clearInterval(waitField); if (!f) return;
    const [x, z] = to3(f.x + f.w / 2, f.y + f.h / 2); add('ball', x, z, TOWN_Y); add('ball', x + 4, z + 2, TOWN_Y);
    ctx.fieldCenter = [x, z];
  }, 500);

  // ---------- Mỗi khung hình ----------
  let simT = 0;
  function update(dt) {
    const pl = ctx.player, P = pl.pos, L = ctx.qualityLevel || 0, R2 = SIM[L] ** 2, flying = pl.vehicle && pl.vehicle.fly;
    // chọn vật đang thức (gần người chơi, tối đa MAXN)
    const act = []; let near = null, nd = 2.2;
    for (const b of bodies) {
      const d2 = (b.pos.x - P.x) ** 2 + (b.pos.z - P.z) ** 2;
      if (d2 > R2 || act.length >= MAXN[L]) { if (!b.sleep) { b.sleep = true; if (b.home.distanceToSquared(b.pos) > 9 && d2 > R2) { b.pos.copy(b.home); b.vel.set(0, 0, 0); draw(b); } } continue; } // vật xa: ngủ, về chỗ cũ
      if (b.sleep && d2 > 9) continue; // vật đứng yên chỉ thức khi người chơi lại gần
      b.sleep = false; act.push(b);
      if (b.kind !== 'crate' && d2 < nd * nd) { nd = Math.sqrt(d2); near = b; }
    }
    solid.length = 0; for (const b of act) if (b.kind === 'crate') solid.push(b);
    const sub = L === 0 ? 2 : 1, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (const b of act) step(b, h);
      for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) pair(act[i], act[j]);
      if (!flying && !pl.frozen) for (const b of act) hitPlayer(b, pl);
    }
    for (const b of act) {
      draw(b);
      if (b.ground && b.vel.lengthSq() < 0.004) { b.vel.set(0, 0, 0); if ((b.still += dt) > 1.2) b.sleep = true; } else b.still = 0;
      if (b.pos.y < -12) { b.pos.copy(b.home); b.vel.set(0, 0, 0); }
    }
    // nút hành động: sút bóng (E)
    if (near && !pl.vehicle && !flying) ctx.offer && ctx.offer(near.kind === 'stone' ? '🪨 Ném đá' : '⚽ Sút bóng', () => kick(near), 1);
    simT = act.length;
  }
  function kick(b) {
    const pl = ctx.player, f = Math.atan2(b.pos.x - pl.pos.x, b.pos.z - pl.pos.z), a = Number.isFinite(f) ? f : pl.rot, pw = b.kind === 'stone' ? 8 : b.kind === 'beach' ? 9 : 14;
    b.vel.set(Math.sin(a) * pw, pw * 0.45, Math.cos(a) * pw); b.sleep = false; b.still = 0; ctx.sfx && ctx.sfx('jump'); pl.emote && pl.emote('kick'); if (b.kind !== 'stone') fact('ball');
  }
  return { update, add, bodies, kick, grid, solid, push, get active() { return simT; } };
}
