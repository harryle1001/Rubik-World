// academy/interior/build.js — dựng 1 tầng từ mặt bằng lưới 1 m (plan.js): sàn, trần, tường + cửa vòm + biển tên, lan can,
// cửa sổ kính màu, hàng cột vòm (hành lang chính), đèn tường, cầu thang thẳng, cửa ra thế giới, cửa bí mật.
// Gộp: đá/gỗ → 1 geometry tô màu đỉnh (1 draw call) · kính màu + lửa → 1 (MeshBasic) · biển tên → 1 (atlas canvas) · đồ đạc CC0 → instancing.
// Toạ độ: x, z mặt bằng (0..89, 0..55), y tuyệt đối; nhóm cha (index.js) dời về đúng chỗ trên thế giới.
import * as THREE from 'three';
import { Batch } from '../geo.js';
import { W, D, FH, OY, LV0, LV1, REG, FLOORS, TOWERS, EXITS, MIRROR } from './plan.js';

export const yOf = k => OY + k * FH;
export const CEIL = FH - 0.4, DOOR_H = 4.6, RAIL_TOP = 2.1;   // trần 7,6 m · cửa cao 4,6 m · lan can chặn tới 2,1 m (nhảy không qua)
const IDS = ['void', ...Object.keys(REG)], IDX = Object.fromEntries(IDS.map((k, i) => [k, i]));
export const kindOf = id => id === 'void' ? 'void' : REG[id].kind;
const grpOf = id => (REG[id] && REG[id].g) || id;
const OPEN = new Set(['room', 'corr', 'tower']);
const C = { wall: '#a39d94', wallD: '#7f7a73', trim: '#8a847a', wood: '#6e4a30', woodL: '#a8744a', ceil: '#5e5850', rail: '#8f897f', gold: '#c9a24a' };
const STAIN = ['#5a8fd8', '#d85a6a', '#e8c65a', '#5ad8a0', '#a05ad8', '#5ac8e8'];

const grids = {};
export function grid(k) {
  if (grids[k]) return grids[k];
  const f = FLOORS[k], g = new Uint8Array(W * D);
  if (f) for (const [id, x0, z0, x1, z1] of f.paint) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) g[z * W + x] = IDX[id];
  return grids[k] = g;
}
export const cellId = (k, x, z) => (x < 0 || z < 0 || x >= W || z >= D || k < LV0 || k > LV1) ? 'void' : IDS[grid(k)[z * W + x]];
export const towerOf = id => TOWERS.find(t => t.id === grpOf(id));
/** sàn có ở ô (x, z) tầng k? (phòng/hành lang; tháp chỉ ở tầng đáy tháp) */
export function hasSlab(k, x, z) { const id = cellId(k, x, z), kd = kindOf(id); if (kd === 'room' || kd === 'corr') return true; if (kd === 'tower') { const T = towerOf(id); return !!T && k === T.k0; } return false; }

// cửa / cửa bí mật trên đường lưới: khoá 'x:z:i' (đường z, ô i dọc x) | 'z:x:j'
function openings(k) {
  const f = FLOORS[k] || {}, m = new Map();
  const mark = ([x, z, ax, w], v) => { if (ax === 'x') { for (let i = Math.floor(x - w / 2); i < x + w / 2; i++) if (i + 0.5 > x - w / 2 && i + 0.5 < x + w / 2) m.set(`x:${z}:${i}`, v); } else for (let j = Math.floor(z - w / 2); j < z + w / 2; j++) if (j + 0.5 > z - w / 2 && j + 0.5 < z + w / 2) m.set(`z:${x}:${j}`, v); };
  for (const d of f.doors || []) mark(d, 'door');
  for (const s of f.secret || []) mark(s.line, s);
  return m;
}
export const doorsAt = k => openings(k);

// phân loại cạnh giữa 2 ô: 0 · 'wall' · 'rail'
function classify(a, b) {
  const ka = kindOf(a), kb = kindOf(b), oa = OPEN.has(ka), ob = OPEN.has(kb);
  if (oa && ob) return grpOf(a) === grpOf(b) ? 0 : 'wall';
  if (oa || ob) { const o = oa ? kb : ka; return o === 'hole' ? 'rail' : 'wall'; }
  if ((ka === 'hole') !== (kb === 'hole')) return 'wall';
  return 0;
}

/** Duyệt mọi đoạn tường/lan can/cửa của tầng k → gọi fn(run) với run = { ax, L, s0, s1, t, a, b, sec } */
export function runs(k, fn) {
  const op = openings(k);
  const line = (ax, L, n, pair) => {
    let cur = null;
    const flush = () => { if (cur) fn(cur); cur = null; };
    for (let i = 0; i < n; i++) {
      const [a, b] = pair(i); let t = classify(a, b); const o = op.get(`${ax}:${L}:${i}`);
      if (t && o) t = o === 'door' ? (t === 'wall' ? 'door' : 0) : 'secret';
      const key = t && `${t}|${a}|${b}`;
      if (cur && cur.key === key && cur.s1 === i) { cur.s1 = i + 1; continue; }
      flush(); if (t) cur = { key, ax, L, s0: i, s1: i + 1, t, a, b, sec: typeof o === 'object' ? o : null };
    }
    flush();
  };
  for (let z = 0; z <= D; z++) line('x', z, W, i => [cellId(k, i, z - 1), cellId(k, i, z)]);
  for (let x = 0; x <= W; x++) line('z', x, D, j => [cellId(k, x - 1, j), cellId(k, x, j)]);
}
const isTw = id => kindOf(id) === 'tower', isShaft = id => id === 'shaft';

// gộp ô thành hình chữ nhật (tham lam) theo khoá key(x, z) (null = bỏ)
function rects(key, fn) {
  const used = new Uint8Array(W * D);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const kk = key(x, z); if (kk == null || used[z * W + x]) continue;
    let x1 = x; while (x1 + 1 < W && !used[z * W + x1 + 1] && key(x1 + 1, z) === kk) x1++;
    let z1 = z; outer: while (z1 + 1 < D) { for (let i = x; i <= x1; i++) if (used[(z1 + 1) * W + i] || key(i, z1 + 1) !== kk) break outer; z1++; }
    for (let j = z; j <= z1; j++) for (let i = x; i <= x1; i++) used[j * W + i] = 1;
    fn(x, z, x1 + 1, z1 + 1, kk);
  }
}

// biển tên: atlas canvas, mỗi biển 512 × 128 px → 2,9 × 0,72 m
function signAtlas(list) {
  if (!list.length) return null;
  const cols = 2, rows = Math.ceil(list.length / cols), cv = document.createElement('canvas'); cv.width = 1024; cv.height = rows * 128;
  const g = cv.getContext('2d'), geo = [];
  list.forEach((s, i) => {
    const cx = (i % cols) * 512, cy = Math.floor(i / cols) * 128;
    g.fillStyle = '#2a2236'; g.fillRect(cx, cy, 512, 128); g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.strokeRect(cx + 8, cy + 8, 496, 112);
    g.fillStyle = '#ffe3a0'; g.font = 'bold 50px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s.text, cx + 256, cy + 66, 470);
    const p = new THREE.PlaneGeometry(2.9, 0.72), uv = p.attributes.uv;
    for (let v = 0; v < uv.count; v++) uv.setXY(v, (cx + uv.getX(v) * 512) / 1024, 1 - (cy + (1 - uv.getY(v)) * 128) / cv.height);
    p.rotateY(s.ry); p.translate(s.x, s.y, s.z); geo.push(p);
  });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const merged = geo.length > 1 ? mergeAll(geo) : geo[0];
  return new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ map: tex }));
}
function mergeAll(list) {   // gộp PlaneGeometry (cùng thuộc tính) không cần addon
  let n = 0; for (const g of list) n += g.index.count;
  const P = [], N = [], U = [], I = []; let vo = 0;
  for (const g of list) { P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); U.push(...g.attributes.uv.array); for (const i of g.index.array) I.push(i + vo); vo += g.attributes.position.count; }
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); o.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); o.setIndex(I); o.computeBoundingSphere(); return o;
}

/** Cầu thang thẳng: [x0, z0, x1, z1, hướng, tầng chân, ±tầng] → độ cao mặt bậc tại (x, z) hoặc null */
export function stairY(s, x, z) {
  const [x0, z0, x1, z1, dir, kb, dk] = s; if (x < x0 || x > x1 || z < z0 || z > z1) return null;
  const f = dir === '+x' ? (x - x0) / (x1 - x0) : dir === '-x' ? (x1 - x) / (x1 - x0) : dir === '+z' ? (z - z0) / (z1 - z0) : (z1 - z) / (z1 - z0);
  const n = 25; return yOf(kb) + (Math.min(n - 1, Math.floor(f * n)) + 1) * FH * dk / n;
}
function buildStair(b, s) {
  const [x0, z0, x1, z1, dir, kb, dk] = s, n = 25, y0 = yOf(kb), r = FH * dk / n, alongX = dir[1] === 'x', len = alongX ? x1 - x0 : z1 - z0, t = len / n;
  for (let i = 0; i < n; i++) {
    const a = dir[0] === '+' ? i * t : len - (i + 1) * t, top = y0 + (i + 1) * r;
    const yb = Math.max(y0, top - 0.55);   // bậc dạng tấm dày 0,55 m (gầm cầu thang thoáng, nhìn ngang thấy rõ bậc)
    if (alongX) b.box(x0 + a, x0 + a + t, yb, top, z0, z1, i % 2 ? C.trim : C.wall); else b.box(x0, x1, yb, top, z0 + a, z0 + a + t, i % 2 ? C.trim : C.wall);
    if (i % 3 === 1) for (const e of alongX ? [z0 + 0.15, z1 - 0.15] : [x0 + 0.15, x1 - 0.15]) { const c = alongX ? [x0 + a + t / 2, e] : [e, z0 + a + t / 2]; b.cyl(c[0], top, c[1], 0.07, 1.0, C.wood, 5); }
  }
  // dầm đỡ nghiêng 2 bên + trụ đỡ dưới gầm; tay vịn nghiêng 2 bên
  const ang = Math.atan2(FH, len), L = Math.hypot(FH, len), mid = y0 + FH / 2 + 1.0, sg = (dir[0] === '+' ? 1 : -1);
  for (const e of alongX ? [z0 + 0.3, z1 - 0.3] : [x0 + 0.3, x1 - 0.3]) {
    if (alongX) b.add(new THREE.BoxGeometry(L, 0.9, 0.6), C.wallD, (x0 + x1) / 2, y0 + FH / 2 - 0.55, e, 0, 0, sg * ang); else b.add(new THREE.BoxGeometry(0.6, 0.9, L), C.wallD, e, y0 + FH / 2 - 0.55, (z0 + z1) / 2, 0, -sg * ang, 0);
    for (const q of [0.45, 0.8]) { const f = dir[0] === '+' ? q : 1 - q, h = FH * q - 0.9, [px, pz] = alongX ? [x0 + (x1 - x0) * f, e] : [e, z0 + (z1 - z0) * f]; b.box(px - 0.35, px + 0.35, y0, y0 + h, pz - 0.35, pz + 0.35, C.trim); }
  }
  for (const e of alongX ? [z0 + 0.15, z1 - 0.15] : [x0 + 0.15, x1 - 0.15]) {
    if (alongX) b.add(new THREE.BoxGeometry(L, 0.12, 0.14), C.woodL, (x0 + x1) / 2, mid, e, 0, 0, sg * ang);
    else b.add(new THREE.BoxGeometry(0.14, 0.12, L), C.woodL, e, mid, (z0 + z1) / 2, 0, -sg * ang, 0);
  }
}

/** Dựng tầng k. Trả về { group, boxes: [{x0,x1,z0,z1,top}] (mặt bằng), secrets: [{def, mesh, box, pivot}], signs } */
export function buildFloor(k, opt = {}) {
  const y = yOf(k), f = FLOORS[k] || {}, stone = new Batch(), glow = new Batch(), boxes = [], signs = [], secrets = [];
  const solid = (x0, x1, z0, z1, top) => boxes.push({ x0, x1, z0, z1, top });
  const wallC = id => (kindOf(id) === 'room' ? C.wall : C.wallD);
  // --- sàn (theo vùng, màu riêng) + trần (dưới tầng trên không có sàn) ---
  rects((x, z) => { const id = cellId(k, x, z), kd = kindOf(id); return kd === 'room' || kd === 'corr' ? id : null; }, (x0, z0, x1, z1, id) => stone.box(x0, x1, y - 0.4, y, z0, z1, REG[id].c));
  // trần: tầng trên không có sàn → khối mái dày; có sàn → tấm trần mỏng ngay dưới sàn trên (tầng trên chưa tải vẫn kín, màu trần riêng)
  rects((x, z) => { const id = cellId(k, x, z), kd = kindOf(id); if (!(kd === 'room' || kd === 'corr' || kd === 'hole') || isShaft(id)) return null; const up = kindOf(cellId(k + 1, x, z)); return up === 'void' || up === 'solid' ? 2 : up === 'hole' || up === 'tower' ? null : 1; }, (x0, z0, x1, z1, t) => stone.box(x0, x1, y + CEIL - (t === 1 ? 0.06 : 0), t === 1 ? y + CEIL - 0.01 : y + FH, z0, z1, C.ceil));
  // --- tường / cửa / lan can ---
  runs(k, r => {
    const { ax, L, t, a, b } = r, tw = isTw(a) || isTw(b), sh = isShaft(a) || isShaft(b), s0 = r.s0, s1 = r.s1;
    const bx = (p0, p1, y0, y1, col, e = 0.25) => ax === 'x' ? stone.box(p0, p1, y0, y1, L - e, L + e, col) : stone.box(L - e, L + e, y0, y1, p0, p1, col);
    const col = (p0, p1, top, e = 0.25) => ax === 'x' ? solid(p0, p1, L - e, L + e, top) : solid(L - e, L + e, p0, p1, top);
    const openSide = OPEN.has(kindOf(a)) ? -1 : 1, roomSide = kindOf(a) === 'room' ? -1 : kindOf(b) === 'room' ? 1 : 0;
    if (t === 'wall') {
      col(s0 - 0.25, s1 + 0.25, y + CEIL);
      if (tw) return;
      bx(s0 - 0.25, s1 + 0.25, y, y + CEIL, OPEN.has(kindOf(a)) && OPEN.has(kindOf(b)) ? C.wall : wallC(openSide < 0 ? a : b));
      bx(s0 - 0.25, s1 + 0.25, y, y + 0.45, C.trim, 0.32);                                            // chân tường
      const outer = kindOf(a) === 'void' || kindOf(b) === 'void';
      if (outer && k >= 0) for (let p = s0 + 2.75; p < s1 - 1.2; p += 5.5) {                            // cửa sổ kính màu Gothic (mặt trong)
        const o = L + openSide * 0.27, cc = STAIN[(Math.round(p) + k) % STAIN.length];
        if (ax === 'x') { glow.box(p - 0.7, p + 0.7, y + 2.2, y + 5.6, o - 0.02, o + 0.02, cc); glow.add(new THREE.ConeGeometry(0.99, 1.1, 4).rotateY(Math.PI / 4).scale(1, 1, 0.03), cc, p, y + 6.15, o); stone.box(p - 0.08, p + 0.08, y + 2.2, y + 6.5, o - 0.05, o + 0.05, C.wallD); stone.box(p - 0.85, p + 0.85, y + 2.05, y + 2.2, o - 0.12, o + 0.12, C.wallD); }
        else { glow.box(o - 0.02, o + 0.02, y + 2.2, y + 5.6, p - 0.7, p + 0.7, cc); glow.add(new THREE.ConeGeometry(0.99, 1.1, 4).rotateY(Math.PI / 4).scale(0.03, 1, 1), cc, o, y + 6.15, p); stone.box(o - 0.05, o + 0.05, y + 2.2, y + 6.5, p - 0.08, p + 0.08, C.wallD); stone.box(o - 0.12, o + 0.12, y + 2.05, y + 2.2, p - 0.85, p + 0.85, C.wallD); }
      }
      if (!outer && (s1 - s0) > 6 && (kindOf(a) === 'corr' || kindOf(b) === 'corr')) for (let p = s0 + 4.2; p < s1 - 2; p += 8.4) {   // đèn tường hành lang
        for (const sd of [-1, 1]) { const id = sd < 0 ? a : b; if (kindOf(id) !== 'corr' || id === 'hall') continue; const o = L + sd * 0.4;
          if (ax === 'x') { stone.box(p - 0.15, p + 0.15, y + 3.1, y + 3.35, L + sd * 0.25, o + sd * 0.2, C.wood); glow.add(new THREE.ConeGeometry(0.13, 0.36, 5), '#ffc35a', p, y + 3.55, o + sd * 0.1); }
          else { stone.box(L + sd * 0.25, o + sd * 0.2, y + 3.1, y + 3.35, p - 0.15, p + 0.15, C.wood); glow.add(new THREE.ConeGeometry(0.13, 0.36, 5), '#ffc35a', o + sd * 0.1, y + 3.55, p); } }
      }
    } else if (t === 'door' || t === 'secret') {
      col(s0 - 0.25, s1 + 0.25, y + CEIL, 0.25); boxes.pop();   // (cửa: không chặn — giữ chỗ để cửa bí mật thêm hộp riêng)
      if (!tw) {
        bx(s0, s1, y + DOOR_H, y + CEIL, C.wall);                                                     // lanh tô
        bx(s0, s0 + 0.22, y, y + DOOR_H, C.wood, 0.34); bx(s1 - 0.22, s1, y, y + DOOR_H, C.wood, 0.34); bx(s0, s1, y + DOOR_H - 0.22, y + DOOR_H, C.wood, 0.34);
        const m = (s0 + s1) / 2; if (ax === 'x') glow.box(m - 0.18, m + 0.18, y + DOOR_H + 0.15, y + DOOR_H + 0.5, L - 0.3, L + 0.3, '#9fe6ff'); else glow.box(L - 0.3, L + 0.3, y + DOOR_H + 0.15, y + DOOR_H + 0.5, m - 0.18, m + 0.18, '#9fe6ff');
      }
      if (t === 'door') for (const sd of [-1, 1]) {   // biển tên phía bên kia, nhìn ra hành lang
        const here = sd < 0 ? a : b, there = sd < 0 ? b : a; if (!(kindOf(there) === 'room' || kindOf(there) === 'tower') || grpOf(here) === grpOf(there)) continue;
        if (!OPEN.has(kindOf(here))) continue;
        const nm = kindOf(there) === 'tower' ? `${REG[there].name} ⇅` : REG[there].name, m = (s0 + s1) / 2, o = L + sd * 0.3;
        signs.push(ax === 'x' ? { text: nm, x: m, y: y + DOOR_H + 1.2, z: o, ry: sd < 0 ? Math.PI : 0 } : { text: nm, x: o, y: y + DOOR_H + 1.2, z: m, ry: sd < 0 ? -Math.PI / 2 : Math.PI / 2 });
      }
      if (t === 'secret') secrets.push({ def: r.sec, ax, L, s0, s1 });
    } else if (t === 'rail' && !sh) {
      col(s0 - 0.15, s1 + 0.15, y + RAIL_TOP, 0.15);
      bx(s0 - 0.15, s1 + 0.15, y, y + 1.0, C.rail, 0.15); bx(s0 - 0.2, s1 + 0.2, y + 1.0, y + 1.12, C.woodL, 0.2);
    }
  });
  // --- hàng cột vòm + gân vòm hành lang chính (z 25..30) ---
  if (cellId(k, 12, 27) === 'hall') {
    const op = openings(k);
    for (const x of [11, 15, 23, 27, 62, 66, 74, 78]) {
      if (cellId(k, x, 27) !== 'hall') continue;
      let any = false;
      for (const [zl, zc, side] of [[25, 25.45, 24], [30, 29.55, 30]]) {
        const blocked = [-1, 0].some(d => op.get(`x:${zl}:${Math.floor(x + d * 0.9)}`) || op.get(`x:${zl}:${Math.floor(x + 0.9)}`)) || kindOf(cellId(k, x, side)) === 'hole';
        if (blocked) continue; any = true;
        stone.cyl(x, y, zc, 0.36, 5.0, C.trim, 8); stone.box(x - 0.45, x + 0.45, y, y + 0.4, zc - 0.45, zc + 0.45, C.wallD); stone.box(x - 0.42, x + 0.42, y + 4.9, y + 5.2, zc - 0.42, zc + 0.42, C.wallD);
        glow.add(new THREE.ConeGeometry(0.12, 0.34, 5), '#ffc35a', x, y + 3.6, zc + (zc < 27.5 ? 0.42 : -0.42)); stone.box(x - 0.14, x + 0.14, y + 3.3, y + 3.42, Math.min(zc, zc + (zc < 27.5 ? 0.5 : -0.5)), Math.max(zc, zc + (zc < 27.5 ? 0.5 : -0.5)), C.wood);
        solid(x - 0.4, x + 0.4, zc - 0.4, zc + 0.4, y + CEIL);
      }
      if (any) stone.add(new THREE.TorusGeometry(2.1, 0.17, 4, 12, Math.PI), C.trim, x, y + 5.2, 27.5, Math.PI / 2);   // gân vòm ngang hành lang
    }
    for (let x = 9.5; x < 80; x += 1) if (cellId(k, Math.floor(x), 27) === 'hall' && (x < 29 || x > 60)) stone.box(x - 0.5, x + 0.5, y + 0.01, y + 0.03, 26.4, 28.6, (Math.floor(x) % 2) ? '#7a3040' : '#8a3a4a');   // thảm đỏ dọc hành lang
  }
  // --- cầu thang thẳng ---
  for (const s of f.stairs || []) buildStair(stone, s);
  // --- cửa ra thế giới (cửa gỗ đôi + khung phát sáng) + gương phép ---
  for (const e of EXITS.filter(e => e.k === k)) {
    const [x, z] = e.at, g = new THREE.Group(), b = new Batch(), gl = new Batch();
    b.box(-1.6, 1.6, 0, DOOR_H + 0.3, -0.12, 0.05, C.wood); b.box(-0.05, 0.05, 0, DOOR_H, 0.05, 0.12, '#3a2a1a');
    for (const s of [-1, 1]) b.cyl(s * 0.6, 2.1, 0.14, 0.09, 0.1, C.gold, 6);
    gl.box(-1.85, -1.6, 0, DOOR_H + 0.55, -0.1, 0.1, '#9fe6ff'); gl.box(1.6, 1.85, 0, DOOR_H + 0.55, -0.1, 0.1, '#9fe6ff'); gl.box(-1.85, 1.85, DOOR_H + 0.3, DOOR_H + 0.55, -0.1, 0.1, '#9fe6ff');
    const geoB = b.build().rotateY(e.face).translate(x, y, z), geoG = gl.build().rotateY(e.face).translate(x, y, z);
    stone.list.push(geoB); glow.list.push(geoG);
    signs.push({ text: e.sign, x: x + Math.sin(e.face) * 0.2, y: y + DOOR_H + 1.25, z: z + Math.cos(e.face) * 0.2, ry: e.face });
  }
  if (MIRROR.k === k) { const [x, z] = MIRROR.at; stone.box(x - 1.3, x + 1.3, y, y + 4.4, z - 0.3, z - 0.1, C.gold); glow.box(x - 1.05, x + 1.05, y + 0.3, y + 4.1, z - 0.1, z - 0.05, '#cfe8ff'); }
  // --- cửa bí mật: mesh riêng (xoay / trượt) + hộp va chạm riêng ---
  const group = new THREE.Group(); group.name = 'academy-floor-' + k;
  for (const s of secrets) {
    const b = new Batch(), len = s.s1 - s.s0, shelf = s.def.type === 'shelf';
    if (shelf) { b.box(0, len, 0, DOOR_H - 0.05, -0.25, 0.25, C.wood); for (let yy = 0.35; yy < DOOR_H - 0.6; yy += 0.9) for (let p = 0.15; p < len - 0.2; p += 0.32) b.box(p, p + 0.26, yy, yy + 0.62 + ((p * 7) % 3) * 0.06, -0.3, 0.3, ['#7a3b2e', '#2e5a4a', '#3d4f7a', '#8a6a2e', '#5a2e6a'][Math.floor(p * 13 + yy * 3) % 5]); b.box(len * 0.55, len * 0.55 + 0.24, 2.15, 2.9, -0.36, 0.36, '#c9302c'); }
    else { for (let yy = 0; yy < DOOR_H - 0.1; yy += 0.5) for (let p = (yy * 2) % 1 ? -0.4 : 0; p < len; p += 0.8) b.box(Math.max(0, p), Math.min(len, p + 0.78), yy, yy + 0.48, -0.25, 0.25, (Math.floor(p * 3 + yy * 5) % 3) ? C.wall : C.wallD); b.box(len / 2 - 0.2, len / 2 + 0.2, 1.3, 1.6, -0.3, 0.3, '#b8a88a'); }
    const mesh = new THREE.Mesh(b.build(), opt.stoneMat), pivot = new THREE.Group();
    if (s.ax === 'z') { pivot.position.set(s.L, y, s.s0); pivot.rotation.y = -Math.PI / 2; } else pivot.position.set(s.s0, y, s.L);
    pivot.add(mesh); group.add(pivot);
    const box = s.ax === 'z' ? { x0: s.L - 0.3, x1: s.L + 0.3, z0: s.s0, z1: s.s1, top: y + CEIL } : { x0: s.s0, x1: s.s1, z0: s.L - 0.3, z1: s.L + 0.3, top: y + CEIL };
    boxes.push(box); s.mesh = mesh; s.pivot = pivot; s.box = box; s.top = box.top; s.k = k;
  }
  const m1 = new THREE.Mesh(stone.build(), opt.stoneMat); m1.name = 'academy-int-stone';
  const m2 = new THREE.Mesh(glow.build(), opt.glowMat); m2.name = 'academy-int-glow';
  for (const m of [m1, m2]) { m.matrixAutoUpdate = false; group.add(m); }
  const sg = signAtlas(signs); if (sg) { sg.matrixAutoUpdate = false; sg.name = 'academy-int-signs'; group.add(sg); }
  return { group, boxes, secrets, signs };
}
