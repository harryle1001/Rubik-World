// zone-east.js — KHỐI C & D (phía đông): thư viện, vườn thiền, sân vận động, học viện, phố mua sắm, nhà game 2 người,
// quảng trường lễ hội, phố nhà người chơi, vườn bách thảo & đài thiên văn, hồ bơi, bắn cung, nhà thi đấu, đấu trường, Rubik Kart.
// Gọi 1 lần từ town-buildings.js (trước "XUẤT RA SCENE"). Dùng chung Batch của town-buildings (B.*) để gộp draw call:
//   B.eastC / B.eastD  công trình (có viền) · B.ground  nền, đường, vạch (không viền) · DG  chi tiết nhỏ gần người chơi
//   + 3 mesh riêng: mặt nước (hồ thiền, hồ bơi, hồ cá), khối phát sáng (màn hình, đèn, neon), bảng chữ (atlas riêng của khu đông)
//   + model kit nướng sẵn (karts), hàng rào kit (InstancedMesh).
// Toạ độ: P(x2, y2, gợi ý x) đổi 2D → 3D; mặt tiền công trình quay ra cửa (RS.doors) và đường đi; va chạm đẩy vào ctx.boxes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, addOutline } from './style.js';
import { Batch } from './decor.js';
import { loadModel } from './models.js';
import { KIT } from './kit.js';

// Bảng màu (docs/art-style.md)
const K = {
  sand: '#f3d6a8', grass: '#8fcf6a', grass2: '#6fb85a', grassD: '#4f9a4a', wood: '#b9824f', woodD: '#8a5a34',
  stone: '#d8cfbf', stoneD: '#a9a297', tile: '#d9683f', tileD: '#b9502f', cream: '#fbf1de', pink: '#f6c7c0', mint: '#bfe6d6',
  sky: '#c7def2', butter: '#f7e3a1', red: '#e8453c', yellow: '#f5c518', glass: '#9fd3e6', white: '#ffffff', ink: '#4a3b52', pave: '#e6dccb',
};
const PI = Math.PI, _o = new THREE.Object3D();

// ---------- Atlas chữ riêng của khu đông (512 px, 24 dòng) ----------
function eastAtlas() {
  const ROW = 64, rows = 40, c = document.createElement('canvas'); c.width = 512; c.height = ROW * rows;
  const k = c.getContext('2d'); let used = 0; const items = [], memo = new Map();
  return {
    sign(text, bg = '#3b2a1e', fg = '#fff', border = '#f2c14e') {
      const key = text + bg + fg + border; if (memo.has(key)) return memo.get(key);
      if (used >= rows) return null; const y = used++ * ROW;
      k.fillStyle = border; k.beginPath(); k.roundRect(2, y + 2, 508, ROW - 4, 12); k.fill();
      k.fillStyle = bg; k.beginPath(); k.roundRect(7, y + 7, 498, ROW - 14, 9); k.fill();
      k.fillStyle = fg; k.font = 'bold 34px system-ui, sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, y + ROW / 2 + 2, 480);
      const uv = [0, 1 - (y + ROW) / c.height, 1, 1 - y / c.height]; memo.set(key, uv); return uv;
    },
    add(uv, w, h, m4) { if (!uv) return; const g = new THREE.PlaneGeometry(w, h), a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, uv[0] + a.getX(i) * (uv[2] - uv[0]), uv[1] + a.getY(i) * (uv[3] - uv[1])); g.deleteAttribute('normal'); g.applyMatrix4(m4); items.push(g); },
    mesh() {
      if (!items.length) return null; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const m = new THREE.Mesh(mergeGeometries(items), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false })); m.name = 'east-signs'; return m;
    },
  };
}

// ---------- Nướng model kit thành 1 mesh / model (ít draw call hơn instancing khi ít bản sao) ----------
function deq(attr) {   // thuộc tính lượng tử hoá (meshopt) → Float32
  const n = attr.count, s = attr.itemSize, a = new Float32Array(n * s);
  const get = [attr.getX, attr.getY, attr.getZ, attr.getW];
  for (let i = 0; i < n; i++) for (let j = 0; j < s; j++) a[i * s + j] = get[j].call(attr, i);
  return new THREE.BufferAttribute(a, s);
}
async function bakeKit(scene, name, list, out, shadow = true, skip = null) {   // skip: regex tên phần bỏ đi
    // list: [x, y(mặt đất), z, scale, ry] hoặc hàm (kích thước) → danh sách
  const src = await loadModel(KIT + name); if (!src) return;
  src.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(src), lift = -box.min.y;
  if (typeof list === 'function') list = list(box.getSize(new THREE.Vector3())); if (!list.length) return;
  const byMat = new Map(), m4 = new THREE.Matrix4();
  if (skip) { const rm = []; src.traverse(o => o.isMesh && skip.test(o.name) && rm.push(o)); for (const o of rm) o.removeFromParent(); }
  src.updateMatrixWorld(true);
  src.traverse(o => {
    if (!o.isMesh) return;
    for (const [x, y, z, s, ry] of list) {
      const g = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'uv', 'color']) if (o.geometry.attributes[k]) g.setAttribute(k, deq(o.geometry.attributes[k]));
      if (o.geometry.index) g.setIndex(Array.from(o.geometry.index.array));
      _o.position.set(x, y + lift * s, z); _o.rotation.set(0, ry, 0); _o.scale.setScalar(s); _o.updateMatrix();
      g.applyMatrix4(m4.copy(_o.matrix).multiply(o.matrixWorld));
      const key = o.material.uuid; if (!byMat.has(key)) byMat.set(key, { mat: o.material, geos: [] }); byMat.get(key).geos.push(g);
    }
  });
  for (const { mat, geos } of byMat.values()) { const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = shadow; m.receiveShadow = true; m.name = 'east-kit-' + name; scene.add(m); out.push(m); }
}

export function buildZoneEast({ ctx, RS, env, B, DG, trees, lamp, measure, rnd, nearDoor }) {
  const { scene } = ctx, { P, S, Y } = env, R = RS.R;
  const need = ['library', 'zen', 'stadium', 'academy', 'shopst', 'hall2p', 'plaza', 'pstreet', 'botanic', 'pool', 'archery', 'gym', 'arena', 'kart'];
  if (!need.some(k => R[k])) return null;
  const out = [], atlas = eastAtlas();
  B.eastC = B.eastC || new Batch('eastC'); B.eastD = B.eastD || new Batch('eastD');
  const G = B.ground, W = new Batch('east-water'), L = new Batch('east-glow'), d = DG;
  const boxes = ctx.boxes, collide = (x0, z0, x1, z1, h = 6) => boxes.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), top: Y + h });
  // khung chữ nhật 3D của 1 khu
  const rect = id => { const r = R[id]; if (!r) return null; const hx = r.x + r.w / 2, [x0, z0] = P(r.x, r.y, hx), [x1, z1] = P(r.x + r.w, r.y + r.h, hx); return { x0, z0, x1, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 }; };
  const at = (x2, y2) => P(x2, y2);
  // bảng chữ theo nhóm cục bộ của batch b
  const sign = (b, text, w, h, x, y, z, ry = 0, bg, fg, bd) => { const uv = atlas.sign(text, bg, fg, bd); _o.position.set(x, y, z); _o.rotation.set(0, ry, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); const m = _o.matrix.clone(); if (b.pre) m.premultiply(b.pre); atlas.add(uv, w, h, m); };
  // khối phát sáng theo nhóm cục bộ của batch b (dùng chung ma trận)
  const glow = (b, fn) => { const o = L.pre; L.pre = b.pre; fn(L); L.pre = o; };
  const water = (b, fn) => { const o = W.pre; W.pre = b.pre; fn(W); W.pre = o; };
  const flat = (b, geo, col, x, y, z, ry = 0, sx = 1, sz = 1) => b.push(geo, col, x, y, z, ry, -PI / 2, 0, sx, 1, sz);
  const disc = (b, r, x, y, z, col, seg = 20, sx = 1, sz = 1) => flat(b, new THREE.CircleGeometry(r, seg), col, x, y, z, 0, sx, sz);
  const ring = (b, ri, ro, x, y, z, col, t0 = 0, tl = 2 * PI, seg = 24) => flat(b, new THREE.RingGeometry(ri, ro, seg, 1, t0, tl), col, x, y, z);
  const tree = (x, z, k = 'leaf', s = 1) => { if (!nearDoor(x, z, 3)) trees.push([x, z, k, s]); };

  // ---------- Bộ chi tiết kiến trúc (toạ độ cục bộ, +z = mặt tiền) ----------
  // thân nhà bo cạnh: chân đá, gờ mái, trụ góc
  const body = (b, w, h, dd, wall, trim = K.white, x = 0, z = 0) => {
    b.box(w + 0.3, 0.45, dd + 0.3, x, 0, z, K.stoneD); b.box(w, h, dd, x, 0, z, wall); b.box(w + 0.35, 0.28, dd + 0.35, x, h - 0.1, z, trim);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.38, h - 0.3, 0.38, x + sx * w / 2, 0.3, z + sz * dd / 2, trim);
  };
  const win = (b, x, y, z, w = 1.1, h = 1.3, col = K.glass) => { b.box(w + 0.22, h + 0.22, 0.08, x, y - 0.11, z, K.white); b.box(w, h, 0.12, x, y, z + 0.01, col); b.box(0.07, h, 0.15, x, y, z + 0.01, K.white); b.box(w + 0.4, 0.1, 0.25, x, y - 0.18, z + 0.08, K.white); };
  const doorF = (b, x, z, w = 1.4, h = 2.3, col = '#8a5a34') => { b.box(w + 0.3, h + 0.2, 0.1, x, 0.4, z, K.white); b.box(w, h, 0.16, x, 0.4, z + 0.01, col); b.box(0.08, 0.08, 0.2, x + w * 0.3, 1.5, z + 0.05, K.yellow); };
  const awning = (b, w, x, y, z, c1, c2 = K.white, deep = 1.3) => { const n = Math.max(3, Math.round(w / 0.55)), sw = w / n; for (let i = 0; i < n; i++) b.box(sw, 0.08, deep, x - w / 2 + sw * (i + 0.5), y, z + deep / 2 - 0.1, i % 2 ? c2 : c1, 0, 0.32); for (let i = 0; i < n; i++) b.box(sw, 0.28, 0.06, x - w / 2 + sw * (i + 0.5), y - 0.6, z + deep * 0.95 - 0.1, i % 2 ? c2 : c1); };
  const column = (b, x, z, h, col = K.white, r = 0.3) => { b.box(r * 2.6, 0.3, r * 2.6, x, 0, z, col); b.cyl(r * 0.88, r, h - 0.6, x, 0.3, z, col, 8); b.box(r * 2.6, 0.3, r * 2.6, x, h - 0.3, z, col); };
  const bench = (b, x, z, ry = 0) => b.group(x, Y, z, ry, () => { b.box(1.6, 0.1, 0.5, 0, 0.42, 0, K.wood); b.box(1.6, 0.4, 0.08, 0, 0.55, -0.22, K.wood, 0, -0.15); for (const s of [-1, 1]) b.box(0.1, 0.42, 0.45, s * 0.65, 0, 0, '#5a4a3a'); });
  const planter = (b, x, z, col = '#e85d8a') => { b.box(0.9, 0.5, 0.9, x, Y, z, K.stoneD); b.ball(0.45, x, Y + 0.7, z, K.grassD, 1, 0.7, 1); for (let i = 0; i < 3; i++) b.ball(0.12, x + (i - 1) * 0.25, Y + 1.0, z + 0.2, col); };
  const flowers = (x0, z0, x1, z1, n, cols = ['#e8453c', '#f5c518', '#ff8ac2', '#ffffff', '#b07ad8']) => { for (let i = 0; i < n; i++) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); d.cone(0.03, 0.35, x, Y, z, K.grass2, 3); d.ball(0.11, x, Y + 0.38, z, cols[i % cols.length]); } };
  const bush = (b, x, z, s = 1, col = K.grassD) => { b.ball(0.7 * s, x, Y + 0.4 * s, z, col, 1.2, 0.8, 1.1); b.ball(0.5 * s, x + 0.5 * s, Y + 0.3 * s, z + 0.2 * s, '#5aa04a', 1, 0.8, 1); };
  const streetLamp = (bb, x, z) => { if (nearDoor(x, z, 3)) return; lamp(bb, x, z); L.box(0.36, 0.46, 0.36, x + 0.58, Y + 1.98, z, '#ffe28a'); };
  const pave = (x0, z0, x1, z1, col = K.pave, y = 0.02) => G.box(x1 - x0, y, z1 - z0, (x0 + x1) / 2, Y, (z0 + z1) / 2, col);
  const lawn = (x0, z0, x1, z1, col = K.grass) => G.box(x1 - x0, 0.03, z1 - z0, (x0 + x1) / 2, Y, (z0 + z1) / 2, col);

  // ---------- Đường phố nối các khu (vỉa hè + lòng đường) ----------
  {
    const strip = (x0, x1, z0, z1) => { pave(x0, z0, x1, z1, '#d8cdb8', 0.025); G.box(x1 - x0, 0.06, 0.25, (x0 + x1) / 2, Y, z0 + 0.12, K.stoneD); G.box(x1 - x0, 0.06, 0.25, (x0 + x1) / 2, Y, z1 - 0.12, K.stoneD); for (let x = x0 + 1; x < x1; x += 2.2) d.box(1.1, 0.012, 0.12, x, Y + 0.03, (z0 + z1) / 2, '#f4efe4'); };
    const c = rect('library'), a = rect('academy'), p = rect('plaza'), k = rect('kart');
    if (c && a) { strip(c.x0 - 3, 270, a.z1 + 0.3, c.z0 - 0.3); strip(c.x0 - 3, 270, c.z1 + 0.6, c.z1 + 4.4); }
    if (p && k) { strip(214, 344, p.z1 + 0.3, k.z0 - 0.3); strip(214, 344, k.z1 + 0.6, k.z1 + 3.6); }
    // đèn đường + cây hai bên phố
    if (c && a) for (let x = 147; x < 268; x += 12) { streetLamp(B.eastC, x, a.z1 + 0.9); if (rnd() < 0.7) tree(x + 6, c.z1 + 4.9, 'leaf', 0.8); }
    if (p && k) for (let x = 218; x < 342; x += 12) streetLamp(B.eastD, x, p.z1 + 0.9);
  }

  // ================= KHỐI C — HÀNG BẮC: Học viện · Phố mua sắm · Nhà game 2 người =================
  const b = B.eastC;
  // --- Học viện trí tuệ: toà nhà cổ điển, tháp đồng hồ, trán tam giác, bậc thềm, vườn trước có tượng cú & Rubik ---
  const ac = rect('academy');
  if (ac) measure(b, 'academy', () => {
    const fx = ac.cx, fz = ac.z0 + 17;   // mặt tiền
    lawn(ac.x0 + 0.5, ac.z0 + 0.5, ac.x1 - 0.5, ac.z1 - 0.3, K.grass); pave(fx - 2, fz, fx + 2, ac.z1, K.pave);
    b.group(fx, Y, fz - 7, 0, () => {
      body(b, 24, 7, 14, K.cream, K.white);
      b.hip(25, 3.2, 15, 0, 7.1, 0, K.tile);
      // trán tam giác + 6 cột
      b.box(10, 0.5, 3, 0, 6.6, 8.3, K.white); b.prism(10.4, 2.0, 3.2, 0, 7.1, 8.3, K.white); b.prism(8.6, 1.4, 3.3, 0, 7.25, 8.4, K.tile);
      for (let i = 0; i < 6; i++) column(b, -4.5 + i * 1.8, 9.2, 6.6, K.white, 0.32);
      for (let i = 0; i < 3; i++) b.box(11 - i * 0.6, 0.18, 3.2 - i * 0.6, 0, i * 0.18, 8.8 - i * 0.3, K.stone);
      doorF(b, 0, 7.02, 2.0, 3.0, '#6b3f2a');
      for (const s of [-1, 1]) for (const i of [0, 1, 2]) { win(b, s * (7 + i * 2.1), 1.4, 7.02, 1.1, 1.6); win(b, s * (7 + i * 2.1), 4.4, 7.02, 1.1, 1.4); }
      // tháp đồng hồ
      b.box(4.2, 5, 4.2, 0, 7, 0, K.cream); b.box(4.6, 0.3, 4.6, 0, 11.9, 0, K.white); b.hip(4.8, 3.4, 4.8, 0, 12.1, 0, K.tileD); b.cyl(0.06, 0.06, 1.4, 0, 15.4, 0, K.ink, 4);
      b.cyl(1.3, 1.3, 0.2, 0, 9.4, 2.12, K.white, 16, 0, PI / 2); b.box(0.12, 0.9, 0.06, 0, 9.85, 2.25, K.ink); b.box(0.7, 0.12, 0.06, 0.3, 9.4, 2.25, K.ink);
      sign(b, 'HỌC VIỆN TRÍ TUỆ', 6, 0.75, 0, 6.15, 9.95, 0, '#1f3b63', '#fff', '#f2c14e');
    });
    collide(fx - 12.2, fz - 14.2, fx + 12.2, fz - 0.1, 8);
    for (let i = 0; i < 6; i++) { const x = fx - 4.5 + i * 1.8; collide(x - 0.4, fz + 1.8, x + 0.4, fz + 2.6, 6.6); }
    // tượng cú mèo trên chồng sách + 2 bồn hoa + hàng rào cây xén
    b.group(fx - 7, Y, fz + 3.5, 0, () => { b.box(1.8, 0.5, 1.4, 0, 0, 0, '#2b63d9'); b.box(1.7, 0.45, 1.3, 0.1, 0.5, 0, '#e8453c', 0.2); b.box(1.6, 0.45, 1.2, 0, 0.95, 0, '#2f9e44', -0.1); b.ball(0.75, 0, 2.05, 0, '#b07a48', 1, 1.2, 0.9); b.ball(0.26, -0.28, 2.55, 0.55, K.white); b.ball(0.26, 0.28, 2.55, 0.55, K.white); b.ball(0.12, -0.28, 2.55, 0.75, K.ink); b.ball(0.12, 0.28, 2.55, 0.75, K.ink); b.cone(0.12, 0.3, 0, 2.3, 0.75, K.yellow, 4); });
    b.group(fx + 7, Y, fz + 3.5, 0.4, () => { b.box(1.4, 0.5, 1.4, 0, 0, 0, K.stone); const C6 = ['#e8392f', '#2f9e44', '#2b63d9', '#f5c518', '#ff8a1f', '#ffffff']; for (let i = 0; i < 9; i++) b.box(0.58, 0.58, 0.04, -0.6 + (i % 3) * 0.6, 0.55 + Math.floor(i / 3) * 0.6, 0.92, C6[i % 6]); b.box(1.8, 1.8, 1.8, 0, 0.5, 0, '#2b2633'); });
    for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) bush(d, fx + s * (4 + i * 2.2), fz + 0.8, 0.8); planter(d, fx + s * 2.6, fz + 1.2, s > 0 ? '#ff8ac2' : K.yellow); }
    flowers(ac.x0 + 1, fz + 2, fx - 9, ac.z1 - 1, 30); flowers(fx + 9, fz + 2, ac.x1 - 1, ac.z1 - 1, 30);
    for (const [x, z] of [[ac.x0 + 2, ac.z0 + 2], [ac.x1 - 2, ac.z0 + 2], [ac.x0 + 1.5, fz - 4], [ac.x1 - 1.5, fz - 4]]) tree(x, z, 'leaf', 1.1);
    bench(d, fx - 4, fz + 4.5); bench(d, fx + 4, fz + 4.5);
  });

  // --- Phố mua sắm: 5 cửa hàng pastel, mái hiên sọc, biển hiệu, quầy hàng, dây đèn ---
  const sh = rect('shopst');
  if (sh) measure(b, 'shopst', () => {
    pave(sh.x0 + 0.5, sh.z0 + 0.5, sh.x1 - 0.5, sh.z1 - 0.3, '#eadfca');
    for (let x = sh.x0 + 1; x < sh.x1 - 1; x += 1.6) d.box(0.05, 0.012, sh.d - 2, x, Y + 0.03, sh.cz, '#d9ccb4');
    const SHOPS = [['SÁCH & BÚT', K.sky, '#2b63d9'], ['KEM MÁT', K.pink, '#e85d8a'], ['BÁNH NGỌT', K.butter, '#e8913c'], ['ĐỒ CHƠI', K.mint, '#2f9e44'], ['HOA TƯƠI', '#e9d5f2', '#9b59d0']];
    const n = SHOPS.length, sw = (sh.w - 2) / n, fz = sh.z0 + 10;
    SHOPS.forEach(([name, wall, acc], i) => {
      const x = sh.x0 + 1 + sw * (i + 0.5), w = sw - 0.6, h = 5 + (i % 2) * 1.2;
      b.group(x, Y, fz - 4.5, 0, () => {
        body(b, w, h, 8.5, wall, K.white);
        if (i % 2) b.prism(w + 0.4, 2.2, 9, 0, h + 0.1, 0, i === 3 ? K.tileD : K.tile, PI / 2); else { b.box(w + 0.5, 0.5, 9, 0, h + 0.1, 0, K.white); for (let j = 0; j < 5; j++) b.box(w * 0.18, 0.4, 0.4, -w / 2 + w * (j + 0.5) / 5, h + 0.6, 4.3, j % 2 ? wall : K.white); }
        b.box(w * 0.7, 2.2, 0.12, -w * 0.12, 0.6, 4.26, K.glass); b.box(w * 0.72, 0.12, 0.2, -w * 0.12, 2.8, 4.28, K.white);
        doorF(b, w * 0.36, 4.26, 1.1, 2.3, acc);
        win(b, -w * 0.2, 3.7, 4.26, 1.0, 1.0); win(b, w * 0.25, 3.7, 4.26, 1.0, 1.0);
        awning(b, w - 0.2, 0, 3.3, 4.25, acc, K.white, 1.6);
        b.box(w * 0.85, 0.75, 0.18, 0, h - 0.95, 4.3, acc);
        sign(b, name, w * 0.8, 0.6, 0, h - 0.57, 4.42);
      });
      // quầy hàng trước cửa
      d.group(x - w * 0.15, Y, fz + 1.4, 0, () => { d.box(1.6, 0.8, 0.7, 0, 0, 0, K.wood); for (let j = 0; j < 4; j++) d.ball(0.15, -0.55 + j * 0.37, 0.92, 0, ['#e8453c', '#f5c518', '#ff8ac2', '#7fd0ff'][(i + j) % 4]); });
      planter(d, x + w * 0.45, fz + 1.0, acc);
    });
    collide(sh.x0 + 1, fz - 8.8, sh.x1 - 1, fz - 0.2, 7);
    // dây đèn trang trí qua phố + ki-ốt giữa phố
    for (let i = 0; i <= 3; i++) { const x = sh.x0 + 2 + i * (sh.w - 4) / 3; b.cyl(0.08, 0.1, 4.6, x, Y, sh.z1 - 3, K.ink, 6); }
    { const seg = (sh.w - 4) / 3; let i = 0; for (let x = sh.x0 + 2.4; x < sh.x1 - 2; x += 1.3) { const t = ((x - sh.x0 - 2) % seg) / seg; glow(b, l => l.ball(0.14, x, Y + 4.35 - Math.sin(t * PI) * 0.7, sh.z1 - 3, ['#ffd23f', '#ff8ac2', '#7fd0ff', '#b6f09c'][i++ % 4])); } }
    b.box(sh.w - 4, 0.03, 0.03, sh.cx, Y + 4.4, sh.z1 - 3, K.ink);
    b.group(sh.cx, Y, fz + 6.5, 0, () => { b.cyl(1.4, 1.4, 0.9, 0, 0, 0, K.white, 10); b.cyl(0.08, 0.08, 2.4, 0, 0.9, 0, K.ink, 6); b.cone(2.2, 1.0, 0, 3.0, 0, K.red, 10); b.cone(1.0, 0.3, 0, 2.8, 0, K.white, 10); });
    for (const s of [-1, 1]) { bench(d, sh.cx + s * 6, fz + 6.5, s * PI / 2); tree(sh.cx + s * 12, fz + 7, 'leaf', 0.9); }
  });

  // --- Nhà game 2 người: mái vòm bán trụ, neon, tay cầm khổng lồ; bàn caro (Bạn Nhi) & bàn cờ vây (Ông Sáu) trước nhà ---
  const h2 = rect('hall2p');
  if (h2) measure(b, 'hall2p', () => {
    pave(h2.x0 + 0.5, h2.z0 + 0.5, h2.x1 - 0.5, h2.z1 - 0.3, '#dcd5e8');
    const fx = h2.cx, fz = h2.z0 + 15;
    b.group(fx, Y, fz - 6.5, 0, () => {
      body(b, 22, 5.5, 13, '#c9c3ef', K.white);
      b.push(new THREE.CylinderGeometry(6.6, 6.6, 22.4, 14, 1, false, 0, PI), '#7a6fd0', 0, 5.4, 0, 0, 0, PI / 2, 0.55, 1, 1);
      b.box(9, 4.2, 0.4, 0, 0.4, 6.6, '#3b3566'); doorF(b, 0, 6.82, 2.4, 2.6, '#2b2633');
      for (const s of [-1, 1]) { b.box(4.2, 2.4, 0.12, s * 7.5, 1.6, 6.56, K.glass); b.box(4.4, 0.12, 0.2, s * 7.5, 4.0, 6.6, K.white); }
      glow(b, l => { l.box(8.4, 0.12, 0.1, 0, 4.45, 6.86, '#ff6ad5'); l.box(8.4, 0.12, 0.1, 0, 0.75, 6.86, '#5af0ff'); l.box(0.9, 0.9, 0.1, -3, 2.9, 6.85, '#5af0ff'); l.box(0.9, 0.9, 0.1, 3, 2.9, 6.85, '#ff6ad5'); });
      sign(b, 'NHÀ GAME 2 NGƯỜI', 7.5, 0.95, 0, 5.2, 6.95, 0, '#2b2633', '#ffe28a', '#ff6ad5');
      // tay cầm game khổng lồ trên mái
      b.group(0, 9.4, 1, 0, () => { b.box(4.4, 1.4, 1.2, 0, 0, 0, '#2b2633'); for (const s of [-1, 1]) b.ball(1.0, s * 2.1, 0.7, 0, '#2b2633', 1, 1, 0.7); b.cyl(0.25, 0.25, 0.5, -1.8, 1.3, 0, K.ink, 8); b.ball(0.35, -1.8, 1.9, 0, K.red); [['#e8453c', 1.6, 1.0], ['#f5c518', 2.1, 0.6], ['#2f9e44', 1.6, 0.25], ['#2b63d9', 1.1, 0.6]].forEach(([c, x, y]) => b.cyl(0.22, 0.22, 0.3, x, 1.4, y - 0.6, c, 8)); });
    });
    collide(fx - 11.2, fz - 13.2, fx + 11.2, fz + 0.2, 7);
    // bàn caro (gần Bạn Nhi) và bàn cờ vây (gần Ông Sáu): bàn đá thấp, không chắn lối
    const [nx] = at(7150, -40), [sx] = at(7590, -40), tz = h2.z1 - 4.5;
    b.group(nx, Y, tz, 0, () => { b.box(2.6, 0.5, 2.6, 0, 0, 0, K.stone); b.box(2.4, 0.06, 2.4, 0, 0.5, 0, '#fff7e0'); for (let i = 1; i < 3; i++) { b.box(0.06, 0.04, 2.3, -1.2 + i * 0.8, 0.56, 0, K.ink); b.box(2.3, 0.04, 0.06, 0, 0.56, -1.2 + i * 0.8, K.ink); } [[-0.8, -0.8], [0, 0], [0.8, 0.8]].forEach(([x, z]) => { b.box(0.55, 0.08, 0.12, x, 0.6, z, K.red, PI / 4); b.box(0.55, 0.08, 0.12, x, 0.6, z, K.red, -PI / 4); }); b.cyl(0.25, 0.25, 0.08, 0.8, 0.6, -0.8, '#2b63d9', 10); b.cyl(0.25, 0.25, 0.08, -0.8, 0.6, 0.8, '#2b63d9', 10); });
    b.group(sx, Y, tz, 0, () => { b.box(2.6, 0.5, 2.6, 0, 0, 0, K.wood); b.box(2.4, 0.06, 2.4, 0, 0.5, 0, '#e3b26a'); for (let i = 0; i < 7; i++) { d.box(0.03, 0.02, 2.1, sx - 1.05 + i * 0.35, Y + 0.57, tz, K.ink); d.box(2.1, 0.02, 0.03, sx, Y + 0.57, tz - 1.05 + i * 0.35, K.ink); } for (let i = 0; i < 9; i++) b.ball(0.13, -0.9 + (i * 0.7) % 1.8, 0.62, -0.7 + Math.floor(i / 3) * 0.7, i % 2 ? K.white : '#2b2633', 1, 0.45, 1); });
    for (const x of [nx, sx]) for (const s of [-1, 1]) d.cyl(0.3, 0.3, 0.45, x + s * 1.8, Y, tz, K.stoneD, 8);
    for (const s of [-1, 1]) tree(fx + s * 15, h2.z0 + 2, 'leaf', 1.1);
  });

  // ================= KHỐI C — HÀNG NAM: Thư viện · Vườn thiền · Sân vận động =================
  // --- Thư viện Tri Thức: mái vòm kính, hàng cột, 2 cánh mái ngói, sân đọc sách ngoài trời có kệ sách ---
  const li = rect('library');
  if (li) measure(b, 'library', () => {
    const [dx, dz] = at(5800, 670), fz = li.z1 - 8;    // mặt tiền
    lawn(li.x0 + 0.5, li.z0 + 0.5, li.x1 - 0.5, li.z1 - 0.3); pave(dx - 7, fz, dx + 7, li.z1 + 0.5, K.pave);
    for (let z = fz + 1; z < li.z1; z += 1.2) d.box(13.6, 0.012, 0.05, dx, Y + 0.03, z, '#d4c6ad');
    b.group(dx, Y, fz - 8, 0, () => {
      body(b, 14, 7.5, 16, K.cream);                        // khối giữa
      for (const s of [-1, 1]) { b.group(s * 11.5, 0, 0.5, 0, () => { body(b, 9, 5.5, 13, '#f3e3c3'); b.hip(9.6, 2.6, 13.6, 0, 5.6, 0, K.tile); for (const i of [-1, 0, 1]) win(b, i * 2.7, 1.6, 6.52, 1.2, 2.2); }); }
      // mái vòm kính + gân trắng + đèn lồng đỉnh
      b.cyl(5.2, 5.4, 1.2, 0, 7.5, 0, K.white, 16);
      b.push(new THREE.SphereGeometry(5, 16, 6, 0, 2 * PI, 0, PI / 2), '#a8dcec', 0, 8.7, 0);
      for (let i = 0; i < 8; i++) b.push(new THREE.TorusGeometry(5.05, 0.09, 3, 10, PI / 2), K.white, 0, 8.7, 0, i * PI / 4, 0, PI / 2);
      b.cyl(0.7, 0.8, 1.1, 0, 13.6, 0, K.white, 8); b.cone(0.85, 0.9, 0, 14.7, 0, '#d9a441', 8);
      // hàng cột + trán + bậc thềm
      b.box(13, 0.5, 3.4, 0, 6.5, 9.6, K.white); b.prism(13.4, 1.8, 3.6, 0, 7.0, 9.6, K.white);
      for (let i = 0; i < 6; i++) column(b, -5.5 + i * 2.2, 10.6, 6.5, K.white, 0.34);
      for (let i = 0; i < 3; i++) b.box(14 - i * 0.5, 0.18, 3.8 - i * 0.6, 0, i * 0.18, 10.2 - i * 0.3, K.stone);
      doorF(b, 0, 8.02, 2.4, 3.4, '#6b3f2a'); for (const s of [-1, 1]) win(b, s * 4.4, 1.4, 8.02, 1.4, 3.0);
      sign(b, 'THƯ VIỆN TRI THỨC', 7.5, 0.85, 0, 6.15, 11.35, 0, '#2f5d3f', '#fff', '#e9b949');
    });
    collide(dx - 16.2, fz - 16.2, dx + 16.2, fz - 1.4, 9); collide(dx - 7.2, fz - 1.6, dx + 7.2, fz - 0.4, 9);
    // sân đọc sách ngoài trời: 2 giàn hoa + kệ sách nhiều màu + bàn ghế
    const BOOK = ['#e8453c', '#2b63d9', '#f5c518', '#2f9e44', '#ff8a1f', '#9b59d0', '#ffffff'];
    for (const s of [-1, 1]) b.group(dx + s * 15, Y, fz + 3.5, 0, () => { d.follow(b);
      for (const px of [-3, 3]) for (const pz of [-2, 2]) b.box(0.25, 3, 0.25, px, 0, pz, K.wood);
      for (let i = 0; i < 7; i++) b.box(0.18, 0.18, 4.6, -3 + i, 3, 0, K.woodD);
      b.box(6.6, 0.15, 0.25, 0, 2.85, -2, K.wood); b.box(6.6, 0.15, 0.25, 0, 2.85, 2, K.wood);
      b.box(5.4, 2.2, 0.6, 0, 0, -2.3, K.woodD);                                     // kệ sách
      for (let r = 0; r < 3; r++) { b.box(5.2, 0.06, 0.5, 0, 0.1 + r * 0.7, -2.15, K.wood); for (let i = 0; i < 12; i++) b.box(0.32, 0.5, 0.32, -2.3 + i * 0.42, 0.18 + r * 0.7, -2.05, BOOK[(i * 3 + r) % 7]); }
      for (const px of [-1.5, 1.5]) { d.cyl(0.6, 0.6, 0.06, px, 0.72, 0.6, K.white, 10); d.cyl(0.07, 0.07, 0.72, px, 0, 0.6, K.ink, 6); for (const q of [-1, 1]) d.cyl(0.22, 0.22, 0.45, px + q * 0.9, 0, 0.6, K.red, 8); d.box(0.3, 0.06, 0.4, px, 0.78, 0.6, BOOK[(px > 0 ? 1 : 3)]); }
      for (let i = -2; i <= 2; i++) d.ball(0.28, i * 1.2, 3.2, -1.9, '#6cb84f', 1, 0.6, 1);
      d.follow(null);
    });
    for (const s of [-1, 1]) collide(dx + s * 15 - 2.8, fz + 0.9, dx + s * 15 + 2.8, fz + 1.5, 2.4);
    for (let i = 0; i < 6; i++) { const x = dx - 5.5 + i * 2.2; collide(x - 0.4, fz + 2.2, x + 0.4, fz + 3.0, 6.5); }
    collide(dx - 1.4, fz + 2.8, dx + 1.4, fz + 5.6, 1.6);
    // tượng sách mở trên bệ + hàng rào xén + bồn hoa + cây
    b.group(dx, Y, fz + 4.2, 0, () => { b.cyl(1.4, 1.6, 0.6, 0, 0, 0, K.stone, 10); b.box(1.4, 0.18, 1.6, -0.72, 0.9, 0, K.white, 0, 0, 0.3); b.box(1.4, 0.18, 1.6, 0.72, 0.9, 0, K.white, 0, 0, -0.3); b.box(0.2, 0.3, 1.7, 0, 0.6, 0, '#e8453c'); });
    for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) bush(d, dx + s * (8.5 + i * 2), fz + 7, 0.75); tree(dx + s * 22, fz + 6, 'leaf', 1.15); tree(dx + s * 23.5, li.z0 + 3, 'leaf', 1.2); planter(d, dx + s * 3.6, fz + 3.6); bench(d, dx + s * 5.5, fz + 6.5, 0); }
    flowers(li.x0 + 1, li.z0 + 1, li.x1 - 1, li.z0 + 5, 40);
  });

  // --- Vườn thiền tĩnh tâm: cổng torii, cát cào, đá, hồ cá koi, cầu đỏ cong, tre, đèn đá, đình thiền (Người Thầy Ánh Sáng) ---
  const zn = rect('zen');
  if (zn) measure(b, 'zen', () => {
    const [dx, dz] = at(6640, 670), [mx, mz] = at(6680, 278);
    lawn(zn.x0 + 0.5, zn.z0 + 0.5, zn.x1 - 0.5, zn.z1 - 0.3, '#7fbf62');
    // lối đá bậc từ cổng vào đình
    for (let z = zn.z1 - 0.5; z > mz + 2; z -= 1.1) d.push(new THREE.CylinderGeometry(0.42, 0.45, 0.08, 7), K.stone, dx + Math.sin(z * 0.5) * 0.6, Y + 0.04, z, z);
    // cổng torii đỏ
    b.group(dx, Y, zn.z1 - 1.8, 0, () => { for (const s of [-1, 1]) { b.cyl(0.24, 0.28, 4.6, s * 2.3, 0, 0, '#d8402f', 8); b.box(0.7, 0.3, 0.7, s * 2.3, 0, 0, K.ink); } b.box(6.4, 0.32, 0.5, 0, 4.0, 0, '#d8402f'); b.box(7.2, 0.3, 0.6, 0, 4.6, 0, K.ink); b.box(7.6, 0.16, 0.7, 0, 4.86, 0, K.ink, 0, 0, 0); b.box(0.3, 0.6, 0.3, 0, 4.3, 0, '#d8402f'); });
    for (const s of [-1, 1]) collide(dx + s * 2.3 - 0.3, zn.z1 - 2.1, dx + s * 2.3 + 0.3, zn.z1 - 1.5, 4);
    // sân cát cào (phía tây) với 3 tảng đá
    const sx0 = zn.x0 + 1.5, sx1 = zn.x0 + 11, sz0 = zn.z0 + 2, sz1 = zn.z0 + 12;
    G.box(sx1 - sx0, 0.05, sz1 - sz0, (sx0 + sx1) / 2, Y, (sz0 + sz1) / 2, '#efe4cc');
    for (let z = sz0 + 0.4; z < sz1; z += 0.5) d.box(sx1 - sx0 - 0.6, 0.02, 0.06, (sx0 + sx1) / 2, Y + 0.05, z, '#d9cba9');
    for (const [x, z, s] of [[sx0 + 3, sz0 + 3.5, 1.3], [sx0 + 6.5, sz0 + 6, 0.9], [sx0 + 4, sz0 + 8, 0.7]]) { b.push(new THREE.DodecahedronGeometry(s, 0), '#9e978b', x, Y + s * 0.4, z, x, 0, 0, 1.2, 0.8, 1); ring(d, s * 1.3, s * 1.45, x, Y + 0.06, z, '#d9cba9', 0, 2 * PI, 14); ring(d, s * 1.7, s * 1.85, x, Y + 0.06, z, '#d9cba9', 0, 2 * PI, 14); }
    for (const [x, z] of [[sx0, sz0 - 0.2], [sx0, sz1 + 0.2]]) b.box(sx1 - sx0 + 0.4, 0.25, 0.25, (sx0 + sx1) / 2, Y, z, K.stoneD);
    for (const x of [sx0 - 0.2, sx1 + 0.2]) b.box(0.25, 0.25, sz1 - sz0 + 0.4, x, Y, (sz0 + sz1) / 2, K.stoneD);
    // hồ cá koi (phía đông) + cầu đỏ cong
    const px = zn.x1 - 6.5, pz = zn.z1 - 10.5, ra = 4.3, rb = 5.2, rt = 0.2;
    water(b, w => w.push(new THREE.CircleGeometry(1, 24), '#5fc4d8', px, Y + 0.06, pz, rt, -PI / 2, 0, ra, 1, rb));
    for (let i = 0; i < 18; i++) { const a = i / 18 * 2 * PI, u = Math.cos(a) * (ra + 0.2), v = Math.sin(a) * (rb + 0.2); b.push(new THREE.DodecahedronGeometry(0.45, 0), i % 2 ? '#a9a297' : '#bdb6aa', px + u * Math.cos(rt) + v * Math.sin(rt), Y + 0.15, pz - u * Math.sin(rt) + v * Math.cos(rt), a, 0, 0, 1.2, 0.6, 1); }
    for (let i = 0; i < 6; i++) d.box(0.5, 0.06, 0.18, px - 2 + (i * 1.3) % 4, Y + 0.1, pz - 3 + i * 1.1, ['#ff8a1f', '#ffffff', '#e8453c'][i % 3], i);
    for (let i = 0; i < 5; i++) d.cyl(0.38, 0.38, 0.03, px + 2.2 - (i % 2) * 3.6, Y + 0.09, pz + 3 - i * 1.2, '#4f9a4a', 7);
    b.group(px, Y, pz, PI / 2 + rt, () => {
      const N = 11; for (let i = 0; i < N; i++) { const t = (i + 0.5) / N - 0.5, x = t * 11, y = 0.25 + Math.cos(t * PI) * 1.1, a = -Math.sin(t * PI) * 0.4; b.box(0.95, 0.14, 1.8, x, y, 0, K.woodD, 0, 0, a); for (const s of [-1, 1]) b.box(0.95, 0.08, 0.1, x, y + 0.85, s * 0.85, '#d8402f', 0, 0, a); }
      for (let i = 0; i <= 4; i++) { const t = i / 4 - 0.5, x = t * 10, y = 0.25 + Math.cos(t * PI) * 1.1; for (const s of [-1, 1]) b.box(0.14, 0.95, 0.14, x, y, s * 0.85, '#d8402f'); }
    });
    // rừng tre dọc 2 mép + đèn đá
    for (let i = 0; i < 28; i++) { const side = i % 2, x = side ? zn.x1 - 1 - rnd() * 2 : zn.x0 + 0.8 + rnd() * 1.8, z = side ? zn.z0 + 3 + rnd() * (pz - rb - zn.z0 - 4) : sz1 + 1 + rnd() * (zn.z1 - sz1 - 7), h = 5 + rnd() * 3; b.cyl(0.09, 0.11, h, x, Y, z, i % 3 ? '#7cb84a' : '#9ccf5a', 5); b.ball(0.55, x, Y + h, z, '#5aa04a', 0.8, 1.6, 0.8); }
    for (let i = 0; i < 8; i++) { const x = zn.x0 + 2 + rnd() * (zn.w - 4), z = zn.z0 + 0.8 + rnd() * 1.2; b.cyl(0.08, 0.1, 6, x, Y, z, '#7cb84a', 5); b.ball(0.6, x, Y + 6, z, '#5aa04a', 0.8, 1.6, 0.8); }
    const toro = (x, z) => b.group(x, Y, z, 0, () => { b.box(0.5, 0.2, 0.5, 0, 0, 0, K.stoneD); b.cyl(0.12, 0.14, 0.9, 0, 0.2, 0, K.stone, 6); b.box(0.6, 0.5, 0.6, 0, 1.1, 0, K.stone); glow(b, l => l.box(0.3, 0.3, 0.62, 0, 1.2, 0, '#ffd27a')); b.hip(0.95, 0.45, 0.95, 0, 1.6, 0, K.stoneD); });
    toro(dx - 3.5, zn.z1 - 4); toro(dx + 3.5, zn.z1 - 4); toro(px + 3.5, pz - 7.5); toro(sx1 + 1.5, sz0 + 1);
    // đình thiền: sàn gỗ thấp + mái cong 4 cột (đứng được bên trong, cửa Người Thầy Ánh Sáng ở giữa)
    b.group(mx, Y, mz, 0, () => {
      b.box(5.2, 0.25, 5.2, 0, 0, 0, K.wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.14, 0.14, 3.0, sx * 2.3, 0.25, sz * 2.3, '#d8402f', 6);
      b.box(5.6, 0.3, 5.6, 0, 3.2, 0, K.woodD); b.hip(7.0, 1.6, 7.0, 0, 3.45, 0, '#5a4a52'); b.cone(0.3, 0.6, 0, 5.0, 0, K.yellow, 6);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.3, 0.2, 0.3, sx * 3.4, 3.4, sz * 3.4, '#5a4a52');
      d.follow(b); for (const s of [-1, 1]) d.cyl(0.4, 0.4, 0.1, s * 0.9, 0.25, 0.6, '#c94f3d', 10); d.follow(null);
    });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) collide(mx + sx * 2.3 - 0.2, mz + sz * 2.3 - 0.2, mx + sx * 2.3 + 0.2, mz + sz * 2.3 + 0.2, 3.5);
    for (const [x, z] of [[zn.x0 + 13, zn.z0 + 3], [zn.x1 - 1.5, zn.z1 - 2.5], [zn.x0 + 3, zn.z1 - 4]]) tree(x, z, 'phuong', 0.95);
    flowers(zn.x0 + 4, zn.z1 - 6, dx - 3, zn.z1 - 1, 14, ['#ff9ec4', '#ffffff', '#f6c7c0']);
  });

  // --- Sân vận động Olympic: đường chạy đỏ 6 làn, sân cỏ sọc + khung thành, khán đài bậc, 4 cột đèn, cổng vòng tròn Olympic ---
  const st = rect('stadium');
  if (st) measure(b, 'stadium', () => {
    const x1 = Math.min(st.x1, 269.5), cx = (st.x0 + x1) / 2, cz = st.z0 + 16.5, half = (x1 - st.x0) / 2 - 12.2, Ro = 11.6, Ri = 8.2;
    lawn(st.x0 + 0.3, st.z0 + 0.3, x1, st.z1 - 0.3, K.grass2);
    // đường chạy: 2 đoạn thẳng + 2 bán nguyệt
    for (const s of [-1, 1]) { G.box(half * 2, 0.04, Ro - Ri, cx, Y, cz + s * (Ri + Ro) / 2, '#c8553d'); ring(G, Ri, Ro, cx + s * half, Y + 0.042, cz, '#c8553d', s > 0 ? -PI / 2 : PI / 2, PI, 18); }
    for (let k = 1; k < 6; k++) { const r = Ri + (Ro - Ri) * k / 6; for (const s of [-1, 1]) { d.box(half * 2, 0.012, 0.06, cx, Y + 0.05, cz + s * r, K.white); ring(d, r - 0.03, r + 0.03, cx + s * half, Y + 0.056, cz, K.white, s > 0 ? -PI / 2 : PI / 2, PI, 16); } }
    // sân cỏ sọc + vạch + khung thành
    for (let i = 0; i < 8; i++) G.box(half * 2 / 8, 0.05, Ri * 1.6, cx - half + half * 2 / 8 * (i + 0.5), Y, cz, i % 2 ? '#5aa84a' : '#66b852');
    for (const z of [-Ri * 0.8, Ri * 0.8]) d.box(half * 2, 0.012, 0.1, cx, Y + 0.06, cz + z, K.white);
    d.box(0.1, 0.012, Ri * 1.6, cx, Y + 0.06, cz, K.white); ring(d, 2.2, 2.32, cx, Y + 0.06, cz, K.white, 0, 2 * PI, 20);
    for (const s of [-1, 1]) b.group(cx + s * (half + 1.2), Y, cz, s * PI / 2, () => { for (const q of [-1, 1]) b.box(0.15, 2.2, 0.15, q * 2.2, 0, 0, K.white); b.box(4.6, 0.15, 0.15, 0, 2.2, 0, K.white); for (const q of [-1, 1]) b.box(0.08, 0.08, 1.0, q * 2.2, 2.2, -0.5, K.white); b.box(4.4, 0.08, 0.08, 0, 0, -1.0, K.white); });
    // khán đài bậc phía bắc + mái che
    b.group(cx, Y, st.z0 + 2.6, 0, () => {
      const SEAT = ['#e8453c', '#2b63d9', '#f5c518', '#2f9e44'];
      for (let i = 0; i < 4; i++) { b.box(half * 2 + 10, 0.7 + i * 0.7, 1.0, 0, 0, 1.5 - i, K.stone); for (let j = 0; j < 8; j++) b.box((half * 2 + 9) / 8 - 0.2, 0.25, 0.5, -(half * 2 + 9) / 2 + (half * 2 + 9) / 8 * (j + 0.5), 0.7 + i * 0.7, 1.6 - i, SEAT[(j + i) % 4]); }
      for (const s of [-1, 0, 1]) b.box(0.25, 4.6, 0.25, s * (half + 4), 0, -2.2, K.white);
      b.box(half * 2 + 11, 0.25, 4.2, 0, 4.6, -0.2, K.white, 0, -0.12);
    });
    collide(cx - half - 5.5, st.z0 + 0.3, cx + half + 5.5, st.z0 + 4.6, 4.8);
    // 4 cột đèn chiếu sáng
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = cx + sx * (half + Ro + 0.2), z = cz + sz * (Ro + 0.6); b.cyl(0.2, 0.28, 10, x, Y, z, '#8a8f99', 6); b.box(2.2, 1.2, 0.3, x, Y + 10, z, '#5b5f66', sx * sz > 0 ? PI / 4 : -PI / 4); glow(b, l => l.box(1.9, 0.9, 0.12, x, Y + 10.15, z - sz * 0.12, '#fff6c8', sx * sz > 0 ? PI / 4 : -PI / 4)); collide(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 10); }
    // cổng vào phía nam với 5 vòng tròn
    const [hx] = at(7430, 640), gz = st.z1 - 1.2;
    b.group(hx, Y, gz, 0, () => { for (const s of [-1, 1]) { b.box(1.0, 5.2, 1.0, s * 4.2, 0, 0, K.white); b.box(1.3, 0.4, 1.3, s * 4.2, 0, 0, K.stoneD); } b.box(9.6, 1.0, 1.0, 0, 5.2, 0, K.white); sign(b, 'SÂN VẬN ĐỘNG OLYMPIC', 8, 0.8, 0, 5.7, 0.52, 0, '#1f3b63', '#fff', '#f2c14e');
      [['#2b63d9', -1.6, 7.3], ['#2b2633', 0, 7.3], ['#e8453c', 1.6, 7.3], ['#f5c518', -0.8, 6.65], ['#2f9e44', 0.8, 6.65]].forEach(([c, x, y]) => b.push(new THREE.TorusGeometry(0.7, 0.12, 4, 14), c, x, y, 0)); });
    for (const s of [-1, 1]) collide(hx + s * 4.2 - 0.55, gz - 0.55, hx + s * 4.2 + 0.55, gz + 0.55, 5.5);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) d.push(new THREE.CylinderGeometry(0.06, 0.06, 3.5, 4), K.white, hx + s * (6 + i * 1.5), Y + 1.75, gz + 0.5), glow(b, l => l.box(0.9, 0.6, 0.04, hx + s * (6 + i * 1.5) + 0.45, Y + 3.1, gz + 0.5, ['#e8453c', '#2b63d9', '#f5c518'][i]));
  });

  // ================= KHỐI D — HÀNG BẮC: Quảng trường lễ hội · Phố nhà người chơi · Vườn bách thảo & đài thiên văn =================
  const e = B.eastD;
  // --- Quảng trường lễ hội: 4 bàn cờ Ikigai, sân khấu, dây đèn lồng, đài phun nước, gian hàng ---
  const pl = rect('plaza');
  if (pl) measure(e, 'plaza', () => {
    const x0 = Math.max(pl.x0, 214.3);
    pave(x0, pl.z0 + 0.5, pl.x1 - 0.5, pl.z1 - 0.3, '#ecd9b8');
    for (let x = x0 + 1.5; x < pl.x1; x += 3) d.box(0.06, 0.012, pl.d - 1.5, x, Y + 0.03, pl.cz, '#dcc6a0');
    for (let z = pl.z0 + 1.5; z < pl.z1; z += 3) d.box(pl.x1 - x0 - 1, 0.012, 0.06, (x0 + pl.x1) / 2, Y + 0.03, z, '#dcc6a0');
    // 4 bàn cờ Ikigai (đúng chỗ cửa): mặt cờ phẳng + 4 vòng tròn giao nhau, ghế đẩu
    const IKI = ['#f6a5b5', '#a7d7f0', '#f7e3a1', '#b8e3b0'];
    for (const [x2, y2] of [[7870, -395], [8120, -395], [7870, -95], [8120, -95]]) {
      const [x, z] = at(x2, y2);
      e.box(4.4, 0.12, 4.4, x, Y, z, K.woodD); e.box(4.0, 0.06, 4.0, x, Y + 0.12, z, '#fff7e6');
      IKI.forEach((c, i) => disc(e, 1.05, x + (i % 2 ? 0.6 : -0.6), Y + 0.19 + i * 0.004, z + (i < 2 ? -0.6 : 0.6), c, 16));
      disc(e, 0.35, x, Y + 0.21, z, K.yellow, 10);
      for (const [sx, sz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) d.cyl(0.32, 0.36, 0.42, x + sx * 2.7, Y, z + sz * 2.7, ['#e8453c', '#2b63d9', '#f5c518', '#2f9e44'][(sx + 1 + sz * 2 + 4) % 4], 8);
    }
    // sân khấu lễ hội (phía đông) quay về tây
    const sx = pl.x1 - 6.5, sz = pl.z0 + 8;
    e.group(sx, Y, sz, -PI / 2, () => {
      e.box(12, 1.0, 7, 0, 0, 0, K.woodD); e.box(12.2, 0.12, 7.2, 0, 1.0, 0, K.wood);
      for (let i = 0; i < 3; i++) e.box(3, 0.33, 0.6, 0, i * 0.33, 3.8 + (2 - i) * 0.5 - 0.5, K.wood);
      for (const s of [-1, 1]) { e.box(0.6, 6.5, 0.6, s * 5.7, 1.0, -3.2, '#d8402f'); e.box(0.8, 0.5, 0.8, s * 5.7, 7.5, -3.2, K.yellow); }
      e.box(11.4, 4.6, 0.3, 0, 1.0, -3.3, '#7a3a8a'); e.box(12.4, 0.8, 0.8, 0, 6.6, -3.2, '#d8402f');
      for (let i = 0; i < 9; i++) e.box(1.3, 0.7, 0.1, -5.2 + i * 1.3, 5.85, -2.75, i % 2 ? K.yellow : K.red, 0, 0, 0);
      glow(e, l => { for (let i = 0; i < 7; i++) l.ball(0.18, -4.5 + i * 1.5, 6.55, -2.75, ['#ffd23f', '#ff8ac2', '#7fd0ff'][i % 3]); });
      sign(e, 'LỄ HỘI RUBIK', 5, 0.9, 0, 4.6, -3.1, 0, '#7a3a8a', '#ffe28a', '#ffd23f');
      for (const s of [-1, 1]) e.box(1.0, 1.4, 0.8, s * 4.8, 1.12, 2.5, '#2b2633');
    });
    collide(sx - 3.5, sz - 6, sx + 3.6, sz + 6, 1.1); collide(sx + 2.9, sz - 6.4, sx + 3.6, sz + 6.4, 7.5);
    // đài phun nước giữa (phía đông nam)
    const fx = sx - 10.5, fz = pl.z1 - 9;
    e.group(fx, Y, fz, 0, () => { e.cyl(2.9, 3.1, 0.6, 0, 0, 0, K.stone, 16); e.cyl(0.6, 0.8, 1.6, 0, 0.6, 0, K.stone, 8); e.cyl(1.2, 0.8, 0.3, 0, 2.0, 0, K.stone, 10); e.cyl(0.25, 0.3, 0.8, 0, 2.3, 0, K.stone, 8); });
    water(e, w => { w.push(new THREE.CircleGeometry(2.7, 16), '#6fd3e6', fx, Y + 0.56, fz, 0, -PI / 2); w.cone(0.5, 1.0, fx, Y + 2.3, fz, '#bff0ff', 8); w.cyl(0.2, 0.05, 1.2, fx, Y + 3.0, fz, '#dff8ff', 6); });
    collide(fx - 2.9, fz - 2.9, fx + 2.9, fz + 2.9, 0.6);
    // gian hàng lễ hội (dọc mép nam, phía đông)
    for (let i = 0; i < 3; i++) e.group(pl.x1 - 21 + i * 4.6, Y, pl.z1 - 2.6, 0, () => { d.follow(e);
      const c = [K.red, '#2b63d9', '#2f9e44'][i]; e.box(3.4, 0.9, 1.4, 0, 0, 0, K.wood); for (const s of [-1, 1]) for (const q of [-1, 1]) e.box(0.12, 2.6, 0.12, s * 1.6, 0, q * 0.6, K.woodD);
      for (let j = 0; j < 6; j++) e.box(0.6, 0.08, 1.8, -1.5 + j * 0.6, 2.75, 0, j % 2 ? K.white : c, 0, -0.18); e.box(3.4, 0.5, 0.1, 0, 2.2, 0.75, c);
      for (let j = 0; j < 4; j++) d.ball(0.16, -1.1 + j * 0.7, 1.0, 0, ['#ffd23f', '#ff8ac2', '#e8453c', '#7fd0ff'][(i + j) % 4]);
      d.follow(null);
    });
    for (let i = 0; i < 3; i++) collide(pl.x1 - 21 + i * 4.6 - 1.75, pl.z1 - 3.3, pl.x1 - 21 + i * 4.6 + 1.75, pl.z1 - 1.9, 1.0);
    // dây đèn lồng giăng qua quảng trường
    const mid = (at(7870, 0)[0] + at(8120, 0)[0]) / 2 + 0.3, poles = [[x0 + 1, pl.z0 + 1.2], [x0 + 1, pl.z1 - 1.2], [pl.x1 - 13, pl.z0 + 1.2], [pl.x1 - 13, pl.z1 - 1.2], [mid, pl.z0 + 1.2], [mid, pl.z1 - 1.2]];
    sign(e, 'CÔNG VIÊN CỜ IKIGAI', 4.4, 0.55, mid, Y + 2.6, pl.z0 + 1.42, 0, '#1b5e20', '#fff', '#f5c518');
    for (const [x, z] of poles) { e.cyl(0.1, 0.12, 5, x, Y, z, '#d8402f', 6); e.ball(0.2, x, Y + 5.05, z, K.yellow); }
    const strings = [[0, 3], [1, 2], [4, 5], [0, 4], [4, 2], [1, 5], [5, 3]];
    for (const [a, c] of strings) { const [ax, az] = poles[a], [cx2, cz2] = poles[c], L2 = Math.hypot(cx2 - ax, cz2 - az), n = Math.floor(L2 / 1.6), yy = t => Y + 4.95 - Math.sin(t * PI) * 1.1;
      for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, dy = yy(t1) - yy(t0), h = L2 / n; e.push(new THREE.BoxGeometry(Math.hypot(h, dy), 0.04, 0.04), K.ink, ax + (cx2 - ax) * (t0 + t1) / 2, (yy(t0) + yy(t1)) / 2, az + (cz2 - az) * (t0 + t1) / 2, -Math.atan2(cz2 - az, cx2 - ax), 0, Math.atan2(dy, h)); }
      for (let i = 1; i < n; i++) { const t = i / n, sag = Math.sin(t * PI) * 1.1; glow(e, l => l.push(new THREE.SphereGeometry(0.22, 6, 4), ['#e8453c', '#ffd23f', '#ff8a1f', '#ff6ad5'][i % 4], ax + (cx2 - ax) * t, Y + 4.7 - sag, az + (cz2 - az) * t, 0, 0, 0, 1, 1.3, 1)); } }
    for (const [x, z] of [[x0 + 2.5, pl.cz], [x0 + 18, pl.z0 + 2]]) tree(x, z, 'leaf', 1);
  });

  // --- Phố nhà & cửa hàng người chơi: 8 nhà nhỏ khác màu, đúng 8 cửa "Nhà của …" (lô 2D PLOTS) ---
  const ps = rect('pstreet');
  if (ps) measure(e, 'pstreet', () => {
    lawn(ps.x0 + 0.3, ps.z0 + 0.3, ps.x1 - 0.3, ps.z1 - 0.3, '#9bd47a');
    const WALL = [K.pink, K.sky, K.butter, K.mint, '#e9d5f2', '#fbe0c4', '#d4ecf7', '#f6d3e0'], ROOF = [K.tile, '#5b8fd0', K.tileD, '#3f9a6a', '#8a5ab0', '#d9683f', '#c0503a', '#4f7fbf'];
    const doorsP = RS.doors().filter(q => /^Nhà của/.test(q.n || '')).map(q => ({ n: q.n, p: at(q.x, q.y) }));
    for (let i = 0; i < 8; i++) {
      const X0 = 8760 + (i % 4) * 215, Y0 = i < 4 ? -500 : -265, [px0, pz0] = at(X0, Y0), pw = 195 * S, pd = 200 * S, cx = px0 + pw / 2;
      const dr = doorsP.find(q => Math.abs(q.p[0] - cx) < 2 && Math.abs(q.p[1] - (pz0 + pd)) < 1.5), fz = (dr ? dr.p[1] : pz0 + pd) - 1.2;   // mặt tiền ngay sau cửa
      const w = 6.2 + (i % 3) * 0.6, dd = 5.2, h = 3.4 + (i % 2) * 1.3, wall = WALL[i], roof = ROOF[i];
      pave(cx - 0.8, fz, cx + 0.8, pz0 + pd + 0.2, K.pave);
      e.group(cx, Y, fz - dd / 2, 0, () => {
        body(e, w, h, dd, wall, K.white);
        if (i % 2) e.prism(w + 0.6, 2.0, dd + 0.8, 0, h + 0.1, 0, roof, PI / 2); else e.hip(w + 0.8, 2.0, dd + 0.8, 0, h + 0.1, 0, roof);
        e.box(0.6, 1.4, 0.6, w * 0.28, h + 0.6, -0.8, K.stoneD);
        doorF(e, 0, dd / 2 + 0.02, 1.1, 2.1, ROOF[(i + 3) % 8]); for (const s of [-1, 1]) win(e, s * w * 0.3, 1.4, dd / 2 + 0.02, 1.0, 1.1);
        if (h > 4) win(e, 0, 3.4, dd / 2 + 0.02, 1.0, 0.9);
        e.box(1.8, 0.1, 0.9, 0, 2.6, dd / 2 + 0.4, roof, 0, -0.2);                 // mái hiên nhỏ trên cửa
        if (dr) sign(e, dr.n.replace('Nhà của ', 'Nhà '), 2.6, 0.42, 0, h - 0.55, dd / 2 + 0.06);
      });
      collide(cx - w / 2 - 0.2, fz - dd - 0.2, cx + w / 2 + 0.2, fz + 0.05, h + 1.5);
      // hàng rào gỗ thấp chừa lối vào, hộp thư, bồn hoa
      for (const s of [-1, 1]) { d.box(pw / 2 - 1.4, 0.5, 0.08, cx + s * (pw / 4 + 0.7), Y + 0.25, pz0 + pd - 0.4, K.white); for (let k = 0; k < 5; k++) d.box(0.1, 0.75, 0.1, cx + s * (1.2 + k * (pw / 2 - 1.4) / 4), Y, pz0 + pd - 0.4, K.white); }
      d.box(0.1, 1.0, 0.1, cx + 1.4, Y, pz0 + pd - 0.8, K.woodD); d.box(0.45, 0.32, 0.3, cx + 1.4, Y + 1.0, pz0 + pd - 0.8, ROOF[i]);
      bush(d, cx - w / 2 - 0.3, fz - 0.4, 0.6); flowers(cx + 1.2, fz + 0.1, cx + pw / 2 - 0.6, pz0 + pd - 0.8, 6); flowers(cx - pw / 2 + 0.6, fz + 0.1, cx - 1.2, pz0 + pd - 0.8, 6);
      if (i < 4) tree(px0 + 0.8, pz0 + 1.2, 'leaf', 0.8);
    }
  });

  // --- Vườn bách thảo (nhà kính kiểu cổ điển) & đài thiên văn (mái vòm + kính viễn vọng) ---
  const bo = rect('botanic');
  if (bo) measure(e, 'botanic', () => {
    lawn(bo.x0 + 0.3, bo.z0 + 0.3, bo.x1 - 0.3, bo.z1 - 0.3, '#86c968');
    const [tx, tz] = at(10240, -12);
    // nhà kính: thân kính + gân trắng + vòm giữa
    const gx = bo.x0 + 10, gz = bo.z0 + 10;
    e.group(gx, Y, gz, 0, () => {
      e.box(14.4, 0.4, 8.4, 0, 0, 0, K.white); e.box(14, 3.4, 8, 0, 0.4, 0, '#bfe7ee');
      e.push(new THREE.CylinderGeometry(4, 4, 14, 12, 1, false, 0, PI), '#cdeef3', 0, 3.8, 0, 0, 0, PI / 2, 0.55, 1, 1);
      for (let i = 0; i <= 7; i++) { const x = -7 + i * 2; e.box(0.14, 3.4, 8.1, x, 0.4, 0, K.white); e.push(new THREE.TorusGeometry(4.02, 0.08, 3, 10, PI), K.white, x, 3.8, 0, PI / 2, 0, 0, 1, 0.55, 1); }
      e.box(14.1, 0.14, 0.14, 0, 2.2, 4.0, K.white); e.box(14.1, 0.14, 0.14, 0, 2.2, -4.0, K.white);
      e.cyl(2.6, 2.6, 1.2, 0, 5.3, 0, '#cdeef3', 12); e.push(new THREE.SphereGeometry(2.6, 12, 5, 0, 2 * PI, 0, PI / 2), '#d9f3f6', 0, 6.5, 0); e.cone(0.3, 0.9, 0, 9.0, 0, K.white, 6);
      for (let i = 0; i < 9; i++) e.ball(0.9, -6 + i * 1.5, 1.2, (i % 2 ? 2.4 : -2.4), '#4f9a4a', 1, 1.3, 1);
      doorF(e, 0, 4.02, 1.6, 2.6, K.white); e.box(2.4, 0.18, 0.8, 0, 3.0, 4.4, K.white);
      sign(e, 'VƯỜN BÁCH THẢO', 5, 0.7, 0, 3.55, 4.25, 0, '#2f5d3f', '#fff', '#e9b949');
    });
    collide(gx - 7.2, gz - 4.2, gx + 7.2, gz + 4.2, 6);
    // luống hoa + hồ cá nhỏ + lối đi
    pave(gx - 0.8, gz + 4.2, gx + 0.8, bo.z1, K.pave);
    for (let r = 0; r < 3; r++) for (const s of [-1, 1]) { const x = gx + s * (3.5 + r * 2.4), z = gz + 6.4; G.box(1.6, 0.18, 4, x, Y, z, '#8a5a34'); for (let k = 0; k < 6; k++) d.ball(0.28, x + (k % 2 - 0.5) * 0.7, Y + 0.38, z - 1.5 + Math.floor(k / 2) * 1.4, ['#e8453c', '#f5c518', '#ff8ac2', '#b07ad8', '#ff8a1f', '#ffffff'][(r * 2 + k) % 6]); }
    water(e, w => w.push(new THREE.CircleGeometry(1, 18), '#5fc4d8', bo.x0 + 3.5, Y + 0.05, bo.z1 - 4, 0, -PI / 2, 0, 2.4, 1, 1.6));
    for (let i = 0; i < 4; i++) d.cyl(0.35, 0.35, 0.03, bo.x0 + 2.6 + i * 0.6, Y + 0.08, bo.z1 - 4.3 + (i % 2) * 0.6, '#4f9a4a', 7);
    // đài thiên văn: tháp trụ đá + mái vòm bạc có khe + ống kính
    const ox = tx, oz = tz - 9.5;
    e.group(ox, Y, oz, 0, () => {
      e.cyl(4.2, 4.4, 0.5, 0, 0, 0, K.stoneD, 14); e.cyl(3.8, 3.9, 4.6, 0, 0.5, 0, K.cream, 14); e.cyl(4.1, 4.1, 0.3, 0, 5.0, 0, K.white, 14);
      e.push(new THREE.SphereGeometry(3.9, 14, 6, 0, 2 * PI, 0, PI / 2), '#e3e8ef', 0, 5.3, 0);
      e.box(1.0, 0.1, 3.0, 0, 8.3, 1.6, '#3b3566', 0, -0.62);
      e.cyl(0.3, 0.4, 2.6, 0, 7.8, 1.6, '#5b6b8a', 8, 0, 0.75); e.cyl(0.42, 0.42, 0.35, 0, 8.6, 2.6, '#d9a441', 8, 0, 0.75);
      doorF(e, 0, 3.85, 1.4, 2.4, '#3b3566'); for (const a of [-0.8, 0.8]) win(e, Math.sin(a) * 3.86, 2.9, Math.cos(a) * 3.86 - 0.1, 0.6, 0.9);
      sign(e, 'ĐÀI THIÊN VĂN', 3.8, 0.6, 0, 3.4, 3.98, 0, '#1f2b4f', '#ffe28a', '#7fd0ff');
    });
    collide(ox - 3.9, oz - 3.9, ox + 3.9, oz + 3.9, 9);
    // kính viễn vọng ngoài trời trên chân 3 càng, đặt cạnh cửa (không che)
    e.group(tx + 1.8, Y, tz - 1.6, -0.6, () => { for (let i = 0; i < 3; i++) e.box(0.07, 1.5, 0.07, Math.cos(i * 2.1) * 0.35, 0, Math.sin(i * 2.1) * 0.35, K.ink, 0, Math.sin(i * 2.1) * 0.25, -Math.cos(i * 2.1) * 0.25); e.cyl(0.16, 0.22, 1.5, 0, 1.6, 0, '#d9a441', 8, 0, 1.0); e.cyl(0.24, 0.24, 0.2, 0, 2.1, 0.62, K.ink, 8, 0, 1.0); });
    // ăng-ten chảo vô tuyến
    e.group(bo.x1 - 3.5, Y, bo.z0 + 3, 0.6, () => { e.box(1.2, 2.2, 1.2, 0, 0, 0, K.white); e.cyl(0.2, 0.2, 1.2, 0, 2.2, 0, '#8a8f99', 6); e.push(new THREE.SphereGeometry(2.0, 10, 4, 0, 2 * PI, 0, PI / 3), K.white, 0, 5.4, 0.6, 0, PI - 0.7, 0); e.cyl(0.05, 0.05, 1.6, 0, 3.6, 0.6, K.ink, 4, 0, -0.7); });
    collide(bo.x1 - 4.2, bo.z0 + 2.3, bo.x1 - 2.8, bo.z0 + 3.7, 4);
    for (const [x, z, k] of [[bo.x0 + 2, bo.z0 + 2, 'pine'], [bo.x0 + 19, bo.z0 + 2, 'leaf'], [bo.x0 + 20, bo.z1 - 3, 'phuong'], [bo.x1 - 1.5, bo.z1 - 1.5, 'leaf'], [bo.x0 + 1.5, bo.z0 + 16, 'pine']]) tree(x, z, k, 1.1);
    flowers(bo.x0 + 1, bo.z1 - 2, bo.x0 + 19, bo.z1 - 0.6, 24);
  });

  // ================= KHỐI D — HÀNG NAM: Hồ bơi · Bắn cung · Nhà thi đấu · Đấu trường · Rubik Kart =================
  // --- Hồ bơi Olympic 5 làn: sàn gạch, bể, phao dây đỏ-trắng, bục xuất phát, khán đài nhỏ, ghế cứu hộ, dù ---
  const po = rect('pool');
  if (po) measure(e, 'pool', () => {
    pave(po.x0 + 0.3, po.z0 + 0.3, po.x1 - 0.3, po.z1 - 0.3, '#e9eef0');
    const L2 = 22, Wd = 9, cx = po.cx + 1, cz = po.cz + 1.2;
    for (const s of [-1, 1]) { e.box(L2 + 0.8, 0.16, 0.4, cx, Y, cz + s * (Wd / 2 + 0.2), K.white); e.box(0.4, 0.16, Wd, cx + s * (L2 / 2 + 0.2), Y, cz, K.white); }
    G.box(L2, 0.02, Wd, cx, Y + 0.01, cz, '#2a8fb0');
    water(e, w => w.box(L2, 0.02, Wd, cx, Y + 0.12, cz, '#46c8e0'));
    for (let k = 1; k < 5; k++) { const z = cz - Wd / 2 + Wd * k / 5; for (let i = 0; i < 11; i++) e.box(2.0, 0.12, 0.12, cx - L2 / 2 + 1 + i * 2, Y + 0.18, z, i % 2 ? K.white : (i < 2 || i > 8 ? K.red : '#2b63d9')); }
    for (let k = 0; k < 5; k++) { const z = cz - Wd / 2 + Wd * (k + 0.5) / 5; d.box(L2 - 2, 0.01, 0.2, cx, Y + 0.17, z, '#2a7fa0'); e.box(0.7, 0.6, 0.7, cx - L2 / 2 - 0.6, Y, z, K.white); e.box(0.75, 0.08, 0.75, cx - L2 / 2 - 0.6, Y + 0.6, z, '#2b63d9', 0, 0, -0.1); sign(e, String(k + 1), 0.45, 0.4, cx - L2 / 2 - 0.24, Y + 0.32, z, PI / 2); }
    // khán đài nhỏ phía bắc + ghế cứu hộ + dù
    for (let i = 0; i < 3; i++) e.box(L2, 0.45 + i * 0.45, 0.8, cx, Y, po.z0 + 1.0 + (2 - i) * 0.8, i % 2 ? '#7fd0ff' : K.white);
    collide(cx - L2 / 2, po.z0 + 0.6, cx + L2 / 2, po.z0 + 3.0, 1.4);
    e.group(cx + L2 / 2 + 1.6, Y, cz, -PI / 2, () => { for (const s of [-1, 1]) e.box(0.12, 2.4, 0.12, s * 0.5, 0, 0, K.white, 0, 0, s * 0.08); e.box(1.1, 0.12, 0.8, 0, 2.2, 0, K.red); e.box(1.1, 0.8, 0.1, 0, 2.3, -0.4, K.red); });
    for (const [x, z, c] of [[po.x0 + 2, po.z1 - 2, K.red], [po.x1 - 2, po.z1 - 2, '#2b63d9']]) { e.cyl(0.05, 0.05, 2.4, x, Y, z, K.white, 4); e.cone(1.5, 0.6, x, Y + 2.2, z, c, 8); d.box(0.7, 0.1, 1.8, x + 1.3, Y + 0.35, z, K.white); }
  });

  // --- Trường bắn cung: mái che vạch bắn, 5 bia trên giá, rơm, hàng rào gỗ (kit), cờ gió ---
  const ar = rect('archery');
  if (ar) measure(e, 'archery', () => {
    lawn(ar.x0 + 0.3, ar.z0 + 0.3, ar.x1 - 0.3, ar.z1 - 0.3, '#8fcf6a');
    for (let k = 0; k <= 5; k++) d.box(20, 0.012, 0.08, ar.cx + 1, Y + 0.04, ar.z0 + 2 + k * (ar.d - 4) / 5, K.white);
    d.box(0.12, 0.012, ar.d - 3, ar.x0 + 5, Y + 0.04, ar.cz, '#e8453c');
    e.group(ar.x0 + 2.6, Y, ar.cz, PI / 2, () => { for (const s of [-1, 1]) for (const q of [-1, 1]) e.box(0.18, 2.8, 0.18, s * 6, 0, q * 1.3, K.wood); e.box(13, 0.18, 3.4, 0, 2.8, 0, K.woodD, 0, 0.12); e.box(12, 0.9, 0.5, 0, 0, -1.3, K.wood); for (let i = 0; i < 5; i++) { e.box(0.06, 1.2, 0.06, -4 + i * 2, 0.9, -1.25, K.woodD, 0, 0, 0.3); e.box(0.6, 0.06, 0.06, -4 + i * 2, 1.5, -1.25, '#e8453c'); } sign(e, 'TRƯỜNG BẮN CUNG', 4.4, 0.55, 0, 2.45, 1.75, 0, '#3b2a1e', '#fff', '#f2c14e'); });
    for (const s of [-1, 1]) collide(ar.x0 + 1.3 - 0.15, ar.cz + s * 6 - 0.15, ar.x0 + 3.9 + 0.15, ar.cz + s * 6 + 0.15, 3);
    const RINGS = [[0.85, K.white], [0.68, '#2b2633'], [0.52, '#2b63d9'], [0.36, K.red], [0.2, K.yellow]];
    for (let k = 0; k < 5; k++) {
      const z = ar.z0 + 2 + (k + 0.5) * (ar.d - 4) / 5, x = ar.x1 - 3;
      e.group(x, Y, z, -PI / 2, () => { e.box(0.12, 1.7, 0.12, -0.6, 0, -0.5, K.woodD, 0, 0.3); e.box(0.12, 1.7, 0.12, 0.6, 0, -0.5, K.woodD, 0, 0.3); e.box(0.12, 1.6, 0.12, 0, 0, -0.9, K.woodD, 0, -0.4); e.cyl(0.95, 0.95, 0.35, 0, 1.25, 0, '#e6c55e', 14, 0, PI / 2 - 0.15); RINGS.forEach(([r, c], j) => e.cyl(r, r, 0.04, 0, 1.25 + 0.01 * j, 0.19 + j * 0.012, c, 14, 0, PI / 2 - 0.15)); });
      d.box(1.6, 0.8, 0.9, x + 1.6, Y, z, '#e6c55e'); d.box(1.6, 0.06, 0.92, x + 1.6, Y + 0.5, z, '#c9a640');
      collide(x - 0.4, z - 1, x + 0.4, z + 1, 2.2);
    }
    // cờ gió + hàng rào kit quanh sân (chừa lối vào phía tây)
    e.cyl(0.05, 0.05, 4, ar.cx, Y, ar.z0 + 1, K.white, 4); glow(e, l => l.cone(0.3, 1.2, ar.cx + 0.6, Y + 3.6, ar.z0 + 1, '#ff8a1f', 5));
    bakeKit(scene, 'fence', sz => {
      const s = 2.0 / Math.max(sz.x, 0.01), seg = sz.x * s * 0.98, list = [];
      for (let x = ar.x0 + 7 + seg / 2; x < ar.x1 - seg / 2; x += seg) { list.push([x, Y, ar.z0 + 0.4, s, 0]); list.push([x, Y, ar.z1 - 0.4, s, 0]); }
      for (let z = ar.z0 + 0.4 + seg / 2; z < ar.z1 - seg / 2; z += seg) list.push([ar.x1 - 0.4, Y, z, s, PI / 2]);
      return list;
    }, out, false);
  });

  // --- Nhà thi đấu thể dục dụng cụ: mái vòm cong, vách kính, vòng treo làm biểu tượng ---
  const gy = rect('gym');
  if (gy) measure(e, 'gym', () => {
    pave(gy.x0 + 0.3, gy.z0 + 0.3, gy.x1 - 0.3, gy.z1 - 0.3, '#e3dccd');
    const cx = gy.cx, cz = gy.cz + 0.6, w = 18, dd = 11;
    e.group(cx, Y, cz, PI, () => {   // mặt tiền quay ra phố phía bắc
      body(e, w, 4.2, dd, '#f2d4a0', K.white);
      e.push(new THREE.CylinderGeometry(6.0, 6.0, w + 0.4, 14, 1, false, 0, PI), '#e8913c', 0, 4.1, 0, 0, 0, PI / 2, 0.5, 1, 1);
      for (let i = -2; i <= 2; i++) e.push(new THREE.TorusGeometry(6.02, 0.09, 3, 10, PI), K.white, i * 4, 4.1, 0, PI / 2, 0, 0, 1, 0.5, 1);
      e.box(10, 2.8, 0.12, 0, 0.6, dd / 2 + 0.02, K.glass); for (let i = 0; i <= 5; i++) e.box(0.12, 2.8, 0.18, -5 + i * 2, 0.6, dd / 2 + 0.03, K.white);
      doorF(e, 0, dd / 2 + 0.06, 2.0, 2.4, '#2b63d9');
      for (const s of [-1, 1]) { e.box(0.08, 1.8, 0.08, s * 0.7, 4.6, dd / 2 + 0.6, K.ink); e.push(new THREE.TorusGeometry(0.42, 0.09, 4, 12), '#d9a441', s * 0.7, 4.3, dd / 2 + 0.6); }
      e.box(2.2, 0.12, 0.12, 0, 6.4, dd / 2 + 0.6, K.ink);
      sign(e, 'NHÀ THI ĐẤU', 4.6, 0.65, 0, 3.6, dd / 2 + 0.12, 0, '#8a3b2e', '#fff', '#f2c14e');
    });
    collide(cx - w / 2 - 0.2, cz - dd / 2 - 0.2, cx + w / 2 + 0.2, cz + dd / 2 + 0.2, 7);
    for (const s of [-1, 1]) planter(d, cx + s * 3, cz - dd / 2 - 1.2, s > 0 ? K.yellow : '#ff8ac2');
  });

  // --- Đấu trường online: tròn kiểu sân e-sport, màn hình lớn phát sáng, viền neon ---
  const an = rect('arena');
  if (an) measure(e, 'arena', () => {
    pave(an.x0 + 0.3, an.z0 + 0.3, an.x1 - 0.3, an.z1 - 0.3, '#d6d3e3');
    const cx = an.cx, cz = an.cz - 1.2, r = 6.8;
    e.group(cx, Y, cz, 0, () => {
      e.cyl(r + 0.3, r + 0.4, 0.5, 0, 0, 0, K.stoneD, 16); e.cyl(r, r, 5.2, 0, 0.5, 0, '#3b3566', 16); e.cyl(r + 0.5, r + 0.3, 1.0, 0, 5.7, 0, '#5b5390', 16);
      e.push(new THREE.SphereGeometry(r - 0.2, 16, 4, 0, 2 * PI, 0, PI / 2), '#8f86d8', 0, 6.6, 0, 0, 0, 0, 1, 0.35, 1);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI; e.box(0.3, 5.2, 0.3, Math.sin(a) * (r + 0.05), 0.5, Math.cos(a) * (r + 0.05), '#5b5390', a); }
      glow(e, l => {
        l.push(new THREE.TorusGeometry(r + 0.55, 0.08, 3, 24), '#5af0ff', 0, 6.2, 0, 0, PI / 2); l.push(new THREE.TorusGeometry(r + 0.42, 0.08, 3, 24), '#ff6ad5', 0, 0.75, 0, 0, PI / 2);
        // màn hình lớn mặt nam: khung màu + "VS"
        l.box(7.6, 3.4, 0.1, 0, 7.1, r + 0.65, '#1a2a6a'); l.box(3.4, 3.0, 0.12, -1.9, 7.3, r + 0.68, '#2b63d9'); l.box(3.4, 3.0, 0.12, 1.9, 7.3, r + 0.68, '#e8453c');
        l.box(0.9, 0.9, 0.14, -1.9, 8.3, r + 0.7, '#ffd23f'); l.box(0.9, 0.9, 0.14, 1.9, 8.3, r + 0.7, '#5af0ff'); l.box(2.2, 0.5, 0.14, -1.9, 7.6, r + 0.7, K.white); l.box(2.2, 0.5, 0.14, 1.9, 7.6, r + 0.7, K.white);
      });
      e.box(8.0, 3.8, 0.3, 0, 6.9, r + 0.45, '#2b2633');
      for (const s of [-1, 1]) e.box(0.4, 7, 0.4, s * 3.9, 0, r + 0.45, '#2b2633');
      sign(e, 'VS', 1.2, 0.8, 0, 8.8, r + 0.75, 0, '#ffd23f', '#2b2633', '#2b2633');
      e.box(3.0, 2.6, 0.2, 0, 0.5, r - 0.02, '#1b1626'); glow(e, l => l.box(3.2, 0.14, 0.1, 0, 3.15, r + 0.1, '#5af0ff'));
      sign(e, 'ĐẤU TRƯỜNG ONLINE', 6.5, 0.8, 0, 4.1, r + 0.3, 0, '#2b2633', '#5af0ff', '#ff6ad5');
    });
    collide(cx - r - 0.4, cz - r - 0.4, cx + r + 0.4, cz + r + 0.8, 8);
    for (const s of [-1, 1]) { e.cyl(0.1, 0.12, 4, cx + s * 9, Y, an.z1 - 2, K.ink, 6); glow(e, l => l.box(0.8, 2.6, 0.08, cx + s * 9 + 0.45, Y + 1.3, an.z1 - 2, s > 0 ? '#ff6ad5' : '#5af0ff')); }
  });

  // --- Trường đua Rubik Kart: đường nhựa vòng chữ nhật bo góc, vạch trắng, kerb đỏ-trắng, chồng lốp, cổng xuất phát ô cờ,
  //     khán đài trong sân, cờ đuôi nheo, 5 xe kart (kit) đỗ ở khu pit ---
  const ka = rect('kart');
  if (ka) measure(e, 'kart', () => {
    lawn(ka.x0 + 0.3, ka.z0 + 0.3, ka.x1 - 0.3, ka.z1 - 0.3, '#7cc25e');
    const x0 = ka.x0 + 4.5, x1 = ka.x1 - 4.5, z0 = ka.z0 + 4.2, z1 = ka.z1 - 4.2, rc = 6, tw = 5.2, ASP = '#5b5f66';
    // 4 đoạn thẳng + 4 góc bo
    G.box(x1 - x0 - 2 * rc, 0.04, tw, (x0 + x1) / 2, Y, z0, ASP); G.box(x1 - x0 - 2 * rc, 0.04, tw, (x0 + x1) / 2, Y, z1, ASP);
    G.box(tw, 0.04, z1 - z0 - 2 * rc, x0, Y, (z0 + z1) / 2, ASP); G.box(tw, 0.04, z1 - z0 - 2 * rc, x1, Y, (z0 + z1) / 2, ASP);
    const corners = [[x1 - rc, z0 + rc, 0], [x0 + rc, z0 + rc, PI / 2], [x0 + rc, z1 - rc, PI], [x1 - rc, z1 - rc, 3 * PI / 2]];
    for (const [cx, cz, t0] of corners) {
      ring(G, rc - tw / 2, rc + tw / 2, cx, Y + 0.042, cz, ASP, t0, PI / 2, 10);
      for (let i = 0; i < 8; i++) { const ta = t0 + i * PI / 16; ring(e, rc + tw / 2, rc + tw / 2 + 0.45, cx, Y + 0.06, cz, i % 2 ? K.white : K.red, ta, PI / 16, 2); ring(e, rc - tw / 2 - 0.45, rc - tw / 2, cx, Y + 0.06, cz, i % 2 ? K.red : K.white, ta, PI / 16, 2); }
    }
    // vạch giữa đứt + mép trắng
    for (let x = x0 + rc + 1; x < x1 - rc; x += 2.4) { d.box(1.2, 0.012, 0.14, x, Y + 0.05, z0, K.white); d.box(1.2, 0.012, 0.14, x, Y + 0.05, z1, K.white); }
    for (let z = z0 + rc + 1; z < z1 - rc; z += 2.4) { d.box(0.14, 0.012, 1.2, x0, Y + 0.05, z, K.white); d.box(0.14, 0.012, 1.2, x1, Y + 0.05, z, K.white); }
    for (const s of [-1, 1]) { G.box(x1 - x0 - 2 * rc, 0.05, 0.18, (x0 + x1) / 2, Y + 0.01, z0 + s * (tw / 2 - 0.2), K.white); G.box(x1 - x0 - 2 * rc, 0.05, 0.18, (x0 + x1) / 2, Y + 0.01, z1 + s * (tw / 2 - 0.2), K.white); G.box(0.18, 0.05, z1 - z0 - 2 * rc, x0 + s * (tw / 2 - 0.2), Y + 0.01, (z0 + z1) / 2, K.white); G.box(0.18, 0.05, z1 - z0 - 2 * rc, x1 + s * (tw / 2 - 0.2), Y + 0.01, (z0 + z1) / 2, K.white); }
    // vạch xuất phát ô cờ trên đoạn nam (gần Anh Tốc) + cổng
    const [hx] = at(9720, 690), sx = hx - 4;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 8; j++) G.box(0.6, 0.06, tw / 8, sx - 0.3 + i * 0.6, Y + 0.01, z1 - tw / 2 + tw / 8 * (j + 0.5), (i + j) % 2 ? K.white : '#2b2633');
    e.group(sx, Y, z1, PI / 2, () => {
      for (const s of [-1, 1]) { e.box(0.5, 5, 0.5, s * (tw / 2 + 0.8), 0, 0, '#2b2633'); e.box(0.9, 0.4, 0.9, s * (tw / 2 + 0.8), 0, 0, K.red); }
      e.box(tw + 2.4, 1.2, 0.5, 0, 5, 0, K.red); sign(e, 'RUBIK KART', 5.2, 0.9, 0, 5.6, 0.27, 0, '#2b2633', '#ffd23f', '#ffffff'); sign(e, 'RUBIK KART', 5.2, 0.9, 0, 5.6, -0.27, PI, '#2b2633', '#ffd23f', '#ffffff');
      glow(e, l => { for (let i = 0; i < 5; i++) l.ball(0.18, -1.6 + i * 0.8, 4.75, 0.3, i < 2 ? '#e8453c' : i < 4 ? '#ffd23f' : '#5af07a'); });
    });
    for (const s of [-1, 1]) collide(sx - 0.3, z1 + s * (tw / 2 + 0.8) - 0.3, sx + 0.3, z1 + s * (tw / 2 + 0.8) + 0.3, 5);
    // chồng lốp ở 4 góc ngoài
    for (const [cx, cz, t0] of corners) for (let i = 0; i <= 4; i++) { const a = t0 + i * PI / 8, rr = rc + tw / 2 + 1.4, x = cx + Math.cos(a) * rr, z = cz - Math.sin(a) * rr; for (let k = 0; k < 2; k++) e.cyl(0.42, 0.42, 0.3, x, Y + k * 0.3, z, k ? K.red : '#2b2633', 6); }
    // khán đài nhỏ trong sân (nhìn về đoạn nam) + mái che
    const gx = (x0 + x1) / 2 - 6, gz = (z0 + z1) / 2 + 1.5;
    e.group(gx, Y, gz, 0, () => { const SEAT = ['#e8453c', '#2b63d9', '#f5c518', '#2f9e44']; for (let i = 0; i < 3; i++) { e.box(14, 0.5 + i * 0.5, 0.9, 0, 0, 0.9 - i * 0.9, K.stone); for (let j = 0; j < 7; j++) e.box(1.8, 0.2, 0.45, -6 + j * 2, 0.5 + i * 0.5, 0.95 - i * 0.9, SEAT[(i + j) % 4]); } for (const s of [-1, 1]) e.box(0.2, 3.6, 0.2, s * 6.8, 0, -1.6, K.white); e.box(14.6, 0.2, 3.4, 0, 3.6, -0.3, K.white, 0, -0.1); });
    collide(gx - 7, gz - 1.7, gx + 7, gz + 1.4, 3.8);
    // cờ đuôi nheo quanh sân + cờ ô vuông
    for (let i = 0; i < 8; i++) { const x = x0 + 6 + i * (x1 - x0 - 12) / 7; for (const z of [ka.z0 + 0.8]) { e.cyl(0.05, 0.05, 3.2, x, Y, z, K.white, 4); e.push(new THREE.ConeGeometry(0.4, 1.2, 3).rotateZ(PI / 2), ['#e8453c', '#f5c518', '#2b63d9', '#2f9e44'][i % 4], x + 0.6, Y + 2.8, z, 0, 0, 0, 1, 1, 0.2); } }
    for (const x of [sx - 4, sx - 7]) { const z = z1 + tw / 2 + 1.2; e.cyl(0.05, 0.05, 3.4, x, Y, z, K.white, 4); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) e.box(0.4, 0.4, 0.04, x + 0.25 + i * 0.4, Y + 2.7 + j * 0.4, z, (i + j) % 2 ? K.white : '#2b2633'); }
    // khu pit + 5 xe kart (kit, nướng thành vài mesh)
    const pz = gz - 5.5; pave(gx - 7, pz - 1.8, gx + 9, pz + 1.8, '#8a8f99'); for (let i = 0; i < 6; i++) d.box(0.1, 0.012, 3.4, gx - 7 + i * 3.2, Y + 0.04, pz, K.yellow);
    ['kart_a', 'kart_b', 'kart_c', 'kart_d', 'kart_e'].forEach((n, i) => bakeKit(scene, n, sz => [[gx - 5.4 + i * 3.2, Y + 0.02, pz, 2.2 / Math.max(sz.z, sz.x, 0.01), PI + (i - 2) * 0.08]], out, true, /character/));
    // bãi cỏ trong sân: cây + bụi
    for (const [x, z] of [[x0 + 9, z0 + 6], [x1 - 9, z0 + 6], [x1 - 10, z1 - 7]]) tree(x, z, 'leaf', 0.9);
    for (let i = 0; i < 8; i++) bush(d, x1 - 16 + i * 1.6, (z0 + z1) / 2 + 2, 0.6);
  });

  // ================= XUẤT RIÊNG: nước, khối phát sáng, bảng chữ =================
  const wm = W.mesh(toon('#ffffff', { vertexColors: true, transparent: true, opacity: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), false);
  if (wm) { wm.castShadow = false; scene.add(wm); out.push(wm); }
  const gm = L.mesh(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), false);
  if (gm) { gm.castShadow = false; scene.add(gm); out.push(gm); }
  const sm = atlas.mesh(); if (sm) { scene.add(sm); out.push(sm); }
  return { meshes: out };
}
