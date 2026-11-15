// zone-school.js — KHU TRƯỜNG RUBIK (khu mẫu trưng bày): lớp học kiểu trường Việt Nam (tường vàng kem, mái ngói đỏ-cam,
// hành lang cột, cửa sổ chớp xanh), cổng trường cổ kính, quảng trường trước cổng, chốt bảo vệ, sân chào cờ có vạch trò chơi,
// ghế đá, bồn cây phượng, đèn sân, xe bán kem, sân chơi (xích đu, cầu trượt, bập bênh), sân bóng.
// Gọi từ town-buildings.js. Hiệu năng: mọi khối gộp vào vài Batch (1 draw call/Batch), mái mỗi lớp 1 mesh riêng để mờ dần
// khi người chơi vào trong; cây phượng InstancedMesh; chi tiết nhỏ vào DetailGrid (chỉ hiện gần người chơi).
// Va chạm tường lớp/cửa mini game do school-town.js lo; ở đây chỉ thêm cột hành lang, cổng, cầu trượt vào ctx.boxes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { toon } from './style.js';
import { BLOCKS } from './layout.js';
import { Batch } from './decor.js';
import { placeKit } from './kit.js';

// bảng màu (docs/art-style.md)
const C = {
  trim: '#fff8ea', plinth: '#b9a78e', roof: '#d9683f', roof2: '#cc5d37', ridge: '#a9472b', fascia: '#f6ead2',
  shutter: '#4f9a7a', glass: '#86b9d2', floor: '#eadfc8', door: '#8a5a34', step: '#d8cfbf', stone: '#d8cfbf', stone2: '#a9a297',
  walk: '#e4ddcc', curb: '#b3ab9c', cement: '#d6d0c3', paint: '#fbf6ea', iron: '#3b3346', gold: '#e9b949', lantern: '#ffe08a',
};
const RUBIK_COL = ['#e8453c', '#4caf50', '#3d7be0', '#f5c518', '#ff8a1f', '#ffffff'];
const ROOM = {
  rubik:     { wall: '#f7e3a1', acc: '#d9542b', sign: ['LỚP RUBIK', '#c4452f'] },
  chess:     { wall: '#d3e3f2', acc: '#3b4a6b', sign: ['KHU CỜ VUA', '#2f3b59'] },
  music:     { wall: '#f6d3cc', acc: '#8f4f8a', sign: ['KHU ÂM NHẠC', '#6b3a8a'] },
  hall:      { wall: '#fbf1de', acc: '#b9502f', sign: ['HỘI TRƯỜNG LỚN', '#b5432f'] },
  office:    { wall: '#efe6d2', acc: '#4f6f94', sign: ['VĂN PHÒNG', '#3d4f6b'], flat: true },
  elec:      { wall: '#cfeadf', acc: '#2f7f6f', sign: ['LỚP LẮP RÁP ĐIỆN', '#2f5f6b'] },
  rubikyard: { wall: '#f7e3a1', acc: '#d9542b', sign: ['KHU CHƠI RUBIK', '#d9542b'], yard: true },
};
const FACE = { t: Math.PI, b: 0, l: -Math.PI / 2, r: Math.PI / 2 };
const _v = new THREE.Vector3(), _o = new THREE.Object3D();

// viền mảnh màu nâu tím (thay viền đen dày) — chỉ cho khối kiến trúc
const softOutline = new THREE.MeshBasicMaterial({ color: '#4a3548', side: THREE.BackSide });
softOutline.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.022;'); };
const outline = m => { const e = new THREE.Mesh(m.geometry, softOutline); e.raycast = () => {}; e.castShadow = false; m.add(e); return m; };

// "AO giả": tối dần về chân tường theo độ cao (tô màu đỉnh, không tốn gì lúc chạy)
function fakeAO(b, y0) {
  for (const g of b.geos) {
    const p = g.attributes.position, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { const k = 0.8 + 0.2 * Math.min(1, Math.max(0, (p.getY(i) - y0) / 2.4)); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }
  }
}
// mái 4 mái (mái ngói): chia mỗi mái thành các dải 2 màu xen kẽ → hàng ngói; diềm mái + bờ nóc
function hipRoof(b, x0, z0, x1, z1, y, h) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, alongX = w >= d, r = Math.abs(w - d) / 2;
  const R0 = alongX ? [cx - r, y + h, cz] : [cx, y + h, cz - r], R1 = alongX ? [cx + r, y + h, cz] : [cx, y + h, cz + r];
  const top = p => (alongX ? (p[0] < cx ? R0 : R1) : (p[2] < cz ? R0 : R1));
  const c = [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], N = 5, L = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * Math.pow(t, 1.6), P[2] + (Q[2] - P[2]) * t];   // mái cong kiểu ngói ta
  for (let e = 0; e < 4; e++) {
    const A = c[e], B = c[(e + 1) % 4], TA = top(A), TB = top(B);
    for (let i = 0; i < N; i++) {
      const a0 = L(A, TA, i / N), b0 = L(B, TB, i / N), b1 = L(B, TB, (i + 1) / N), a1 = L(A, TA, (i + 1) / N);
      let p = [...a0, ...b0, ...b1, ...a0, ...b1, ...a1];
      _v.set(b0[0] - a0[0], b0[1] - a0[1], b0[2] - a0[2]).cross(new THREE.Vector3(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]));
      if (_v.y < 0) p = [...a0, ...b1, ...b0, ...a0, ...a1, ...b1];
      if (TA === TB && i === N - 1) p = p.slice(0, 9);   // đỉnh tam giác của mái hồi
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      b.push(g, i % 2 ? C.roof2 : C.roof);
    }
  }
  b.box(w + 0.1, 0.24, 0.14, cx, y - 0.24, z0, C.fascia); b.box(w + 0.1, 0.24, 0.14, cx, y - 0.24, z1, C.fascia);
  b.box(0.14, 0.24, d + 0.1, x0, y - 0.24, cz, C.fascia); b.box(0.14, 0.24, d + 0.1, x1, y - 0.24, cz, C.fascia);
  if (r > 0.1) b.box(alongX ? 2 * r + 0.3 : 0.32, 0.18, alongX ? 0.32 : 2 * r + 0.3, cx, y + h - 0.1, cz, C.ridge);
  b.ball(0.22, R0[0], y + h + 0.05, R0[2], C.ridge); b.ball(0.22, R1[0], y + h + 0.05, R1[2], C.ridge);
}

// KHỐI RUBIK GIỐNG THẬT (dùng chung mọi khu): 26 khối con vát góc (44 tam giác/khối) thân đen + 54 miếng dán nhỏ hơn mặt (lõm trong viền vát)
// ≈ 1.250 tam giác (lite: 1 lõi + miếng dán ≈ 120). Gốc (x, y, z) = tâm khối; s = cạnh; tilt = đứng trên 1 góc. Có thể gọi cho Batch hoặc DetailGrid.
let cubieGeo = null;
export function rubikCube(b, x, y, z, s, ry = 0, tilt = false, lite = false) {   // lite: khối con hộp thường (≈ 420 tam giác) cho biểu tượng nhỏ
  if (!cubieGeo) { const h = 0.5, a = 0.41, pts = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(new THREE.Vector3(sx * h, sy * a, sz * a), new THREE.Vector3(sx * a, sy * h, sz * a), new THREE.Vector3(sx * a, sy * a, sz * h)); cubieGeo = new ConvexGeometry(pts); }
  const pre = b.pre; _o.position.set(x, y, z); _o.rotation.set(tilt ? 0.615 : 0, ry, tilt ? Math.PI / 4 : 0, 'YXZ'); _o.scale.set(1, 1, 1); _o.updateMatrix();
  b.pre = pre ? pre.clone().multiply(_o.matrix) : _o.matrix.clone();
  const q = s / 3, f = q * 0.5 + 0.004;
  if (lite) b.box(s * 0.99, s * 0.99, s * 0.99, 0, -s * 0.495, 0, '#17151d');
  // màu mặt: +z đỏ, -z cam, +x xanh dương, -x xanh lá, +y trắng, -y vàng (tráo vài ô cho trông như đang xoay dở)
  const FC = { pz: '#e8392f', nz: '#ff8a1f', px: '#2b63d9', nx: '#2f9e44', py: '#ffffff', ny: '#f5c518' }, ALT = Object.values(FC);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    if (!i && !j && !k) continue;
    const cx = i * q, cy = j * q, cz = k * q; if (!lite) b.push(cubieGeo.clone(), '#17151d', cx, cy, cz, 0, 0, 0, q * 0.98, q * 0.98, q * 0.98);
    const mix = (i * 7 + j * 3 + k * 5 + 21) % 5 === 0;
    const st = (key, px, py, pz, ryy, rxx) => b.plane(q * 0.8, q * 0.8, cx + px, cy + py, cz + pz, mix ? ALT[(i + j + k + 9) % 6] : FC[key], ryy, rxx);
    if (k === 1) st('pz', 0, 0, f, 0, 0); if (k === -1) st('nz', 0, 0, -f, Math.PI, 0);
    if (i === 1) st('px', f, 0, 0, Math.PI / 2, 0); if (i === -1) st('nx', -f, 0, 0, -Math.PI / 2, 0);
    if (j === 1) st('py', 0, f, 0, 0, -Math.PI / 2); if (j === -1) st('ny', 0, -f, 0, 0, Math.PI / 2);
  }
  b.pre = pre;
}

export function buildSchoolZone(a) {
  const { ctx, RS, env, D, atlas, signAt, measure, budget, X3, Z3, DG, nearDoor, inRoom, rnd, chessPiece } = a, addFoot = a.addFoot || (() => {});
  const { scene } = ctx, { P, S, Y, H, T, gap } = env, R = RS.R, low = !!ctx.lowEnd;
  const SB = new Batch('school'), GB = new Batch('gate'), GR = new Batch('school-ground');
  const roofs = [], meshes = [], kits = {}, phuong = [];
  const kit = (name, x, y, z, s = 1, ry = 0) => (kits[name] = kits[name] || []).push([x, y, z, s, ry]);
  const col = (x, z, r = 0.25, top = Y + H) => ctx.boxes.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, top });

  // đèn sân: cột sắt đen, đèn lồng phát sáng (glow), mũ đèn
  const lampPost = (b, x, z, y = Y) => {
    b.cyl(0.26, 0.32, 0.35, x, y, z, C.stone2, 6); b.cyl(0.06, 0.08, 3.1, x, y + 0.35, z, C.iron, 6);
    b.box(0.42, 0.06, 0.42, x, y + 3.35, z, C.iron); b.hip(0.62, 0.32, 0.62, x, y + 3.95, z, C.iron); b.ball(0.07, x, y + 4.32, z, C.gold);
    for (const s of [-1, 1]) for (const t of [-1, 1]) b.box(0.04, 0.6, 0.04, x + s * 0.18, y + 3.4, z + t * 0.18, C.iron);
    DG.follow(null).glow(() => DG.box(0.3, 0.52, 0.3, x, y + 3.42, z, C.lantern));
  };
  const stoneBench = (b, x, z, ry) => b.group(x, Y, z, ry, () => { b.box(1.9, 0.12, 0.6, 0, 0.4, 0, C.stone); b.box(1.96, 0.04, 0.66, 0, 0.36, 0, C.stone2); for (const s of [-1, 1]) b.box(0.22, 0.38, 0.5, s * 0.68, 0, 0, C.stone2); });

  // ================= LỚP HỌC =================
  // đoạn tường (đúng khối va chạm) + chân tường, gờ trên, cửa sổ chớp xanh phía ngoài
  function wallSeg(b, st, ax, az, bx, bz, ry, opts = {}) {
    const len = Math.hypot(bx - ax, bz - az); if (len < 0.2) return;
    b.group((ax + bx) / 2, Y, (az + bz) / 2, ry, () => {
      b.box(len, H, T, 0, 0, 0, st.wall);
      b.box(len + 0.04, 0.55, T + 0.12, 0, 0, 0, C.plinth);
      b.box(len + 0.1, 0.22, T + 0.22, 0, H - 0.22, 0, C.trim);
      if (opts.band) opts.band(len);
      if (opts.noWin) return;
      const sp = len > 20 ? 4.8 : 3.0, n = Math.floor((len - 1.4) / sp); if (n < 1) return;
      for (let i = 0; i < n; i++) {
        const u = -len / 2 + (len - (n - 1) * sp) / 2 + i * sp, z = T / 2;
        b.plane(1.32, 1.56, u, 1.78, z + 0.02, C.trim); b.plane(1.04, 1.28, u, 1.78, z + 0.03, C.glass);
        for (const s of [-1, 1]) b.plane(0.5, 1.36, u + s * 0.95, 1.78, z + 0.025, C.shutter);
        b.plane(1.5, 0.24, u, 1.0, z + 0.1, C.trim, 0, -1.1);
        const d = DG.follow(b), cc = ['#f6d6a8', '#fff3c4', '#cfe6f7'][(i + Math.round(len)) % 3];
        d.plane(0.3, 1.0, u - 0.34, 1.88, z + 0.035, cc); d.plane(0.3, 1.0, u + 0.34, 1.88, z + 0.035, cc);
        d.box(0.05, 1.28, 0.03, u, 1.14, z + 0.05, C.trim); d.box(1.04, 0.05, 0.03, u, 1.84, z + 0.05, C.trim);
        if (i % 2 === 0) { d.box(1.2, 0.24, 0.3, u, 0.7, z + 0.2, '#b9824f'); for (let k = -1; k <= 1; k++) d.ball(0.15, u + k * 0.36, 1.0, z + 0.2, ['#e85d8a', '#f5c518', '#e8453c'][(i + k + 3) % 3]); }
      }
    });
  }
  function musicNote(b, x, y, z, s, c) {
    for (const dx of [-0.5, 0.5]) { b.cyl(0.32 * s, 0.32 * s, 0.16 * s, x + dx * s, y, z, c, 8, 0, Math.PI / 2, 0.45); b.box(0.09 * s, 1.5 * s, 0.09 * s, x + dx * s + 0.27 * s, y, z, c); }
    b.box(1.1 * s, 0.22 * s, 0.1 * s, x + 0.27 * s, y + 1.3 * s, z, c, 0, 0, 0.18);
  }
  function classroom(id, r) {
    const st = ROOM[id] || ROOM.office, b = SB;
    const ax = X3(r.x), az = Z3(r.y), bx = X3(r.x + r.w), bz = Z3(r.y + r.h), cx = (ax + bx) / 2, cz = (az + bz) / 2;
    const side = r.side || 'b', dx = r.dw ? X3(r.dw[0]) : cx, dz = r.dw ? Z3(r.dw[1]) : cz;
    const sides = { t: [ax, az, bx, az], b: [ax, bz, bx, bz], l: [ax, az, ax, bz], r: [bx, az, bx, bz] };
    for (const s of ['t', 'b', 'l', 'r']) {
      const [px, pz, qx, qz] = sides[s], horiz = s === 't' || s === 'b', ry = FACE[s];
      const band = id === 'chess' && s === side ? len => { b.box(len, 0.36, T + 0.06, 0, 2.62, 0, '#ffffff'); for (let u = -len / 2 + 0.18; u < len / 2 - 0.18; u += 0.72) b.box(0.36, 0.36, T + 0.08, u, 2.62, 0, '#2b2633'); }
        : id === 'music' && s === side ? len => { b.box(len, 0.42, T + 0.06, 0, 2.6, 0, '#ffffff'); for (let u = -len / 2 + 0.3; u < len / 2 - 0.2; u += 0.42) if ((Math.round(u / 0.42) % 7 + 7) % 7 % 3 !== 2) b.box(0.18, 0.26, T + 0.1, u, 2.76, 0, '#2b2633'); }
        : id === 'rubikyard' ? len => { for (let u = -len / 2 + 0.5, k = 0; u < len / 2 - 0.3; u += 1.15, k++) b.box(0.62, 0.62, 0.62, u, H, 0, RUBIK_COL[(k + s.charCodeAt(0)) % 6]); } : null;
      const opts = { band, noWin: st.yard };
      if (s !== side) wallSeg(b, st, px, pz, qx, qz, ry, opts);
      else if (horiz) { wallSeg(b, st, px, pz, dx - gap, qz, ry, opts); wallSeg(b, st, dx + gap, pz, qx, qz, ry, opts); }
      else { wallSeg(b, st, px, pz, qx, dz - gap, ry, opts); wallSeg(b, st, px, dz + gap, qx, qz, ry, opts); }
    }
    for (const [x, z] of [[ax, az], [bx, az], [ax, bz], [bx, bz]]) b.box(0.56, H + 0.12, 0.56, x, Y, z, C.trim);   // trụ góc
    // sàn trong lớp (gạch men) — thấy khi mái mờ đi
    GR.box(bx - ax - 0.2, 0.04, bz - az - 0.2, cx, Y, cz, st.yard ? C.cement : C.floor);

    const big = id === 'hall', VD = 2.2;   // VD: độ sâu hành lang
    addFoot(ax - 1.5 - (side === 'l' ? VD + 1 : 0), az - 1.5 - (side === 't' ? VD + 1 : 0), bx + 1.5 + (side === 'r' ? VD + 1 : 0), bz + 1.5 + (side === 'b' ? VD + 1 : 0));
    const ox = side === 'l' ? ax : side === 'r' ? bx : dx, oz = side === 't' ? az : side === 'b' ? bz : dz;
    const faceL = side === 't' || side === 'b' ? bx - ax : bz - az, du = side === 't' ? -(dx - cx) : side === 'b' ? dx - cx : side === 'l' ? dz - cz : -(dz - cz);
    // hành lang cột dọc mặt tiền (gốc cục bộ = giữa mặt tiền, +z ra ngoài)
    const mx = side === 'l' ? ax : side === 'r' ? bx : cx, mz = side === 't' ? az : side === 'b' ? bz : cz;
    if (!st.yard) b.group(mx, Y, mz, FACE[side], () => {
      GR.pre = b.pre; GR.box(faceL + 1.0, 0.08, VD + 0.3, 0, 0, VD / 2 + 0.15, C.step); GR.box(faceL + 1.1, 0.06, 0.2, 0, 0.12, VD + 0.3, C.curb); GR.pre = null;
      const n = Math.max(2, Math.round(faceL / 3.2));
      for (let i = 0; i <= n; i++) {
        const u = -faceL / 2 + i * faceL / n; if (Math.abs(u - du) < gap + 0.7) continue;
        b.cyl(0.3, 0.34, 0.3, u, 0, VD, C.plinth, 6); b.cyl(0.17, 0.2, H - 0.3, u, 0.3, VD, C.trim, 6); b.cyl(0.28, 0.2, 0.18, u, H - 0.38, VD, st.acc, 6);
        const un = u + faceL / n; if (i < n && !big && Math.abs(un - du) >= gap + 0.7) b.push(new THREE.TorusGeometry(faceL / n / 2 - 0.15, 0.1, 3, 6, Math.PI), C.trim, (u + un) / 2, H - 0.95 - (faceL / n / 2 - 0.15) * 0.45, VD, 0, 0, 0, 1, 0.45, 1);
        _v.set(u, 0, VD).applyMatrix4(b.pre); col(_v.x, _v.z, 0.22);
      }
      if (!big) { b.box(faceL + 0.2, 0.5, 0.06, 0, H - 0.72, VD + 0.18, st.acc); }   // diềm hành lang màu riêng của lớp
    });
    // cửa + bảng tên + trán cửa + biểu tượng của lớp
    const pw = big ? 9 : 2 * gap + 1.6, pd = VD + 0.4;
    b.group(ox, Y, oz, FACE[side], () => {
      b.box(2 * gap, H - 2.75, T + 0.04, 0, 2.75, 0, C.trim);
      if (!st.yard) for (const s of [-1, 1]) b.box(0.08, 2.6, 1.3, s * (gap - 0.12), 0.05, -0.8, C.door);   // khu sân chơi: lối vào mở, không cánh cổng sắt
      b.box(2 * gap + 0.6, 0.12, 1.0, 0, 0, st.yard ? 0.5 : VD + 0.7, C.stone);
      if (st.yard) { for (const s of [-1, 1]) { b.box(0.7, H + 0.9, 0.7, s * (gap + 0.35), 0, 0, C.trim); b.box(0.9, 0.2, 0.9, s * (gap + 0.35), H + 0.9, 0, st.acc); } b.box(2 * gap + 1.4, 0.5, 0.4, 0, H + 0.4, 0, st.acc); signAt(b, atlas.sign(st.sign[0], st.sign[1]), 3.4, 0.42, 0, H + 0.65, 0.22); rubikCube(b, 0, H + 2.1, 0, 1.2, 0.5, true, true); return; }
      const gh = big ? 2.3 : 1.5, gy = H + 0.02;
      b.prism(pd + 0.5, gh, pw + 0.4, 0, gy, pd / 2 - 0.1, C.roof, Math.PI / 2);
      b.prism(pd + 0.1, gh * 0.75, pw - 0.6, 0, gy + 0.02, pd / 2 - 0.05, st.wall, Math.PI / 2);
      b.box(pw + 0.5, 0.2, 0.2, 0, gy - 0.2, pd - 0.08, C.fascia);
      signAt(b, atlas.sign(st.sign[0], st.sign[1]), big ? 5.0 : 3.3, big ? 0.62 : 0.42, 0, H - 0.47, VD + 0.23);
      const topY = gy + gh, tz = pd / 2 - 0.1;
      if (id === 'rubik') rubikCube(b, 0, topY + 0.9, tz, 1.4, 0.5, true, true);
      else if (id === 'chess') { chessPiece(b, 'k', -0.7, tz, 0.95, 'w', topY - 0.25); chessPiece(b, 'n', 0.8, tz, 0.8, 'b', topY - 0.35); }
      else if (id === 'music') musicNote(b, 0, topY + 0.15, tz, 0.85, '#2b2633');
      else if (id === 'hall') { b.cyl(0.75, 0.75, 0.14, 0, gy + 0.85, pd - 0.2, C.trim, 12, 0, Math.PI / 2); b.cyl(0.6, 0.6, 0.16, 0, gy + 0.85, pd - 0.17, '#2b2633', 12, 0, Math.PI / 2); b.box(0.06, 0.45, 0.04, 0, gy + 0.85, pd - 0.07, C.trim); b.box(0.32, 0.06, 0.04, 0.12, gy + 1.05, pd - 0.07, C.trim); b.ball(0.2, 0, topY + 0.15, tz, C.gold); }
      else if (id === 'elec') { const by = topY + 0.05; b.box(0.35, 1.0, 0.18, 0.1, by + 0.55, tz, '#f5c518', 0, 0, -0.45); b.box(0.35, 1.0, 0.18, -0.1, by - 0.15, tz, '#f5c518', 0, 0, -0.45); b.box(0.7, 0.18, 0.2, 0, by + 0.42, tz, '#f5c518'); }
      const d = DG.follow(b); for (const s of [-1, 1]) { const u = s * (gap + 1.2); d.cyl(0.32, 0.24, 0.5, u, 0, VD + 0.9, '#c9744a', 8); d.ball(0.4, u, 0.78, VD + 0.9, '#5aa04a'); d.ball(0.13, u + 0.15, 1.05, VD + 1.0, '#e85d8a'); d.ball(0.13, u - 0.15, 1.0, VD + 0.8, '#f5c518'); }
    });
    // đồ bên trong
    if (!st.yard && id !== 'office') {
      const opp = { b: 't', t: 'b', l: 'r', r: 'l' }[side], [px, pz, qx, qz] = sides[opp], wl = (opp === 't' || opp === 'b' ? r.w : r.h) * S;
      b.group((px + qx) / 2, Y, (pz + qz) / 2, FACE[opp] + Math.PI, () => { b.box(Math.min(6, wl * 0.4), 1.5, 0.08, 0, 1.2, T / 2 + 0.05, '#2f5d3f'); b.box(Math.min(6.2, wl * 0.4 + 0.2), 0.1, 0.18, 0, 1.12, T / 2 + 0.1, '#b9824f'); });
    }
    if (id === 'rubik' || id === 'elec') for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = cx - 2 + i * 4, z = cz - 1.6 + j * 2.6; b.box(1.8, 0.08, 0.7, x, Y + 0.72, z, '#c9955f'); b.box(1.6, 0.72, 0.1, x, Y, z, '#8a5a34'); b.box(1.6, 0.42, 0.4, x, Y, z + 0.7, id === 'rubik' ? '#3d7be0' : '#2f7f6f'); }
    if (id === 'chess' && D.CHESS_T) for (const [x2, y2] of D.CHESS_T) { const x = X3(x2), z = Z3(y2); b.box(1.3, 0.08, 1.3, x, Y + 0.75, z, '#f4efe4'); b.box(0.66, 0.02, 0.66, x - 0.33, Y + 0.83, z - 0.33, '#2b2633'); b.box(0.66, 0.02, 0.66, x + 0.33, Y + 0.83, z + 0.33, '#2b2633'); b.box(0.2, 0.75, 0.2, x, Y, z, '#5a3a22'); }
    if (id === 'music' && D.MUSIC_SPOTS) { const [x2, y2] = D.MUSIC_SPOTS.piano, x = X3(x2), z = Z3(y2); b.box(2.0, 1.0, 0.8, x, Y, z, '#1b1626'); b.box(2.0, 0.06, 0.32, x, Y + 0.85, z + 0.5, '#ffffff'); b.box(0.8, 0.5, 0.4, x, Y, z + 1.0, '#5a3a22'); }
    if (id === 'hall') { b.box(5, 0.6, (bz - az) * 0.6, bx - 2.8, Y, cz, '#b9824f'); for (let i = 0; i < 4; i++) b.box(r.w * S * 0.45, 0.45, 0.5, cx - 1.5, Y, Z3(r.y + 300 + i * 68), '#a0522d'); }
    // MÁI: mesh riêng mỗi lớp, mờ dần khi người chơi vào trong
    if (st.yard) return;
    const fx0 = ax - (side === 'l' ? VD + 0.5 : 0.6), fx1 = bx + (side === 'r' ? VD + 0.5 : 0.6), fz0 = az - (side === 't' ? VD + 0.5 : 0.6), fz1 = bz + (side === 'b' ? VD + 0.5 : 0.6);
    const rb = new Batch('roof-' + id), t0 = rb.tris;
    if (st.flat) {
      rb.box(fx1 - fx0, 0.3, fz1 - fz0, (fx0 + fx1) / 2, Y + H - 0.05, (fz0 + fz1) / 2, '#cfc6b4');
      for (const [w, d, x, z] of [[fx1 - fx0, 0.25, (fx0 + fx1) / 2, fz0], [fx1 - fx0, 0.25, (fx0 + fx1) / 2, fz1], [0.25, fz1 - fz0, fx0, (fz0 + fz1) / 2], [0.25, fz1 - fz0, fx1, (fz0 + fz1) / 2]]) rb.box(w, 0.6, d, x, Y + H + 0.25, z, C.trim);
      rb.box(1.6, 0.9, 1.2, (fx0 + fx1) / 2 + 3, Y + H + 0.25, (fz0 + fz1) / 2, '#a9b4c2'); rb.cyl(0.04, 0.05, 2.4, (fx0 + fx1) / 2 - 3, Y + H + 0.25, (fz0 + fz1) / 2, '#d9d9d9', 6);
    } else hipRoof(rb, fx0, fz0, fx1, fz1, Y + H + 0.02, Math.min(4.2, Math.max(2.2, Math.min(fx1 - fx0, fz1 - fz0) * 0.28)));
    budget['roof-' + id] = Math.round(rb.tris - t0);
    roofs.push({ b: rb, x0: fx0 - 0.3, x1: fx1 + 0.3, z0: fz0 - 0.3, z1: fz1 + 0.3 });
  }
  for (const [id, r] of Object.entries(R)) if (r.walls && r.w && r.y + r.h > env.Y_MIN && r.y < env.Y_MAX) measure(SB, id, () => classroom(id, r));

  // ================= CỔNG TRƯỜNG (hướng tây) + QUẢNG TRƯỜNG + CHỐT BẢO VỆ =================
  if (RS.GATE) {
    const b = GB, gx = X3(RS.GATE[0]), gz = Z3(RS.GATE[1]), stone = '#f1e8d6', stone2 = '#d9cdb2', roof = '#b9502f';
    measure(b, 'gate', () => b.group(gx, Y, gz, -Math.PI / 2, () => {
      for (let i = 0; i < 3; i++) b.box(10 - i * 1.3, 0.15, 2.8 - i * 0.55, 0, i * 0.15, 1.8 - i * 0.27, i % 2 ? stone2 : stone);   // bậc đá
      for (const s of [-1, 1]) {
        const x = s * 3.3;
        b.box(2.1, 0.8, 2.1, x, 0, 0, stone2); b.box(1.7, 5.4, 1.7, x, 0.8, 0, stone);
        b.box(1.9, 0.2, 1.9, x, 2.6, 0, stone2);                                                  // gờ giữa trụ
        b.box(2.05, 0.4, 2.05, x, 6.2, 0, stone2); b.box(1.7, 0.2, 1.7, x, 6.6, 0, C.gold);
        b.cyl(0.32, 0.48, 0.55, x, 6.8, 0, stone, 8); b.ball(0.42, x, 7.65, 0, C.gold);           // bình đá đỉnh trụ
        b.box(0.08, 0.9, 0.08, x, 3.3, 0.9, C.iron); b.box(0.5, 0.06, 0.5, x, 3.45, 1.15, C.iron); b.hip(0.62, 0.32, 0.62, x, 4.25, 1.15, C.iron);   // đèn lồng gắn trụ
        DG.glow(() => { DG.pre = b.pre; DG.box(0.4, 0.62, 0.4, x, 3.5, 1.15, C.lantern); DG.pre = null; });
      }
      b.push(new THREE.TorusGeometry(2.45, 0.36, 5, 16, Math.PI), stone, 0, 4.45, 0, 0, 0, 0, 1, 1, 2.2);    // vòm cung
      b.push(new THREE.TorusGeometry(2.1, 0.08, 4, 16, Math.PI), C.gold, 0, 4.45, 0.82);                    // chỉ vàng viền vòm
      b.box(0.5, 0.7, 0.5, 0, 6.55, 0.86, stone2);                                                          // đá khoá vòm
      b.box(8.8, 1.05, 2.0, 0, 6.2, 0, stone); b.box(9.3, 0.22, 2.25, 0, 7.25, 0, stone2);
      b.prism(2.2, 1.6, 8.6, 0, 7.47, 0, roof, 0); b.prism(1.9, 1.3, 7.2, 0, 7.5, 0.18, stone, 0);
      rubikCube(b, 0, 9.55, 0.3, 0.8, 0.6, true, true);
      signAt(b, atlas.sign('TRƯỜNG RUBIK', '#7a1f2b', '#ffe08a', C.gold), 6.2, 0.8, 0, 6.75, 1.02);
      signAt(b, atlas.sign('Học – Chơi – Khám phá', '#1f3b63', '#fff', C.gold), 3.4, 0.4, 0, 5.15, 1.0);
      for (const s of [-1, 1]) {   // không rào, không cổng sắt: trụ đèn đứng riêng, bình hoa đá, bồn hoa
        b.box(0.95, 3.0, 0.95, s * 12.6, 0, 0, stone); b.box(1.15, 0.25, 1.15, s * 12.6, 3.0, 0, stone2); b.hip(0.75, 0.42, 0.75, s * 12.6, 3.85, 0, C.iron);
        DG.glow(() => { DG.pre = b.pre; DG.box(0.42, 0.55, 0.42, s * 12.6, 3.25, 0, C.lantern); DG.pre = null; });
        b.box(1.5, 0.6, 1.5, s * 5.3, 0, 2.6, stone2); b.cyl(0.55, 0.38, 0.75, s * 5.3, 0.6, 2.6, stone, 8); b.ball(0.62, s * 5.3, 1.55, 2.6, '#5aa04a', 1, 0.75, 1);   // bình hoa đá lớn
        for (let i = 0; i < 4; i++) b.ball(0.16, s * 5.3 + Math.cos(i * 1.6) * 0.42, 1.85, 2.6 + Math.sin(i * 1.6) * 0.42, ['#e8453c', '#f5c518', '#ffffff', '#e85d8a'][i]);
        b.box(2.8, 0.42, 1.2, s * 8.2, 0, 2.0, stone2); for (let i = 0; i < 4; i++) b.ball(0.32, s * (7.2 + i * 0.65), 0.6, 2.0, '#5aa04a', 1, 0.7, 1);
      }
    }));
    // quảng trường: nền đá dịu, đường viền, hoa văn tròn trước cổng, lối đi chính
    { const A = BLOCKS[0].r, x0 = A[0] + 0.5, x1 = gx - 1.2, cxp = (x0 + x1) / 2, w = x1 - x0;
      GB.box(w, 0.04, 26, cxp, Y, gz, '#e6dcc4'); addFoot(x0, gz - 13, gx + 4, gz + 13);
      for (const s of [-1, 1]) GB.box(w, 0.06, 0.35, cxp, Y, gz + s * 12.8, '#c4b48f');
      GB.box(w, 0.05, 3.6, cxp, Y, gz, '#d6c39b'); for (const s of [-1, 1]) GB.box(w, 0.07, 0.25, cxp, Y, gz + s * 1.9, '#b89c6e');
      GB.push(new THREE.RingGeometry(3.2, 4.2, 24).rotateX(-Math.PI / 2), '#cdb68a', x1 - 6, Y + 0.07, gz); GB.push(new THREE.RingGeometry(1.0, 1.5, 16).rotateX(-Math.PI / 2), '#b89c6e', x1 - 6, Y + 0.075, gz);
      DG.follow(null); for (let x = x0 + 1, k = 0; x < x1; x += 2.4, k++) for (const s of [-1, 1]) DG.box(1.0, 0.012, 3.6, x, Y + 0.05, gz + s * 7.5, k % 2 ? '#d8cbaa' : '#e0d4b6');
      for (const s of [-1, 1]) { for (let x = x0 + 1.5; x < x1 - 0.5; x += 2.6) kit('bush', x, Y, gz + s * 11.8, 1.05 + rnd() * 0.2, rnd() * 6); lampPost(GB, x0 + 3, gz + s * 4.2); lampPost(GB, x1 - 2.5, gz + s * 4.2); stoneBench(GB, x1 - 9, gz + s * 9.5, 0); }
    }
    for (const s of [-1, 1]) { const z = gz - s * 3.3; ctx.boxes.push({ x0: gx - 0.9, x1: gx + 0.9, z0: z - 0.9, z1: z + 0.9, top: Y + 7.5 }); col(gx, gz - s * 12.6, 0.5, Y + 3); }
    if (D.BOOTH) { const x = X3(D.BOOTH[0]), z = Z3(D.BOOTH[1]), b = GB;   // chốt bảo vệ: nhà nhỏ tường kem, cửa sổ, mái ngói
      b.box(2.0, 0.3, 2.0, x, Y, z, C.plinth); b.box(1.8, 2.1, 1.8, x, Y + 0.3, z, ROOM.hall.wall); b.box(1.9, 0.18, 1.9, x, Y + 2.3, z, C.trim);
      b.plane(1.1, 0.75, x - 0.91, Y + 1.6, z, C.glass, -Math.PI / 2); b.plane(1.3, 0.95, x - 0.905, Y + 1.6, z, C.trim, -Math.PI / 2);
      b.hip(2.6, 0.9, 2.6, x, Y + 2.45, z, C.roof); signAt(b, atlas.sign('BẢO VỆ', '#3d4f6b'), 1.2, 0.2, x - 0.95, Y + 2.15, z, -Math.PI / 2); }
  }

  // ================= CỘT CỜ + SÂN CHÀO CỜ (sân xi măng kẻ vạch trò chơi) =================
  let flagAt = null;
  if (D.FLAG) {
    const b = SB, x = X3(D.FLAG[0]), z = Z3(D.FLAG[1]);
    b.cyl(1.5, 1.6, 0.25, x, Y, z, C.stone2, 8); b.cyl(1.1, 1.2, 0.25, x, Y + 0.25, z, C.stone, 8); b.cyl(0.7, 0.75, 0.25, x, Y + 0.5, z, C.trim, 8);
    b.cyl(0.05, 0.08, 8.3, x, Y + 0.75, z, '#eef0f2', 6); b.ball(0.15, x, Y + 9.1, z, C.gold);
    DG.follow(null); for (let i = 0; i < 8; i++) { const a2 = i / 8 * 6.283; DG.ball(0.2, x + Math.cos(a2) * 1.35, Y + 0.32, z + Math.sin(a2) * 1.35, ['#e8453c', '#f5c518'][i % 2]); }
    flagAt = { x: x + 0.08, y: Y + 8.2, z, w: 1.9, h: 1.25 };
    col(x, z, 0.8, Y + 9);
  }
  if (R.attend) {   // sân xi măng: ô nhảy lò cò, ô ăn quan, vòng tròn
    const r = R.attend, x0 = X3(r.x), z0 = Z3(r.y), x1 = X3(r.x + r.w), z1 = Z3(r.y + r.h), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, d = DG.follow(null), py = Y + 0.065, line = (w, dd, x, z, c = C.paint) => d.box(w, 0.01, dd, x, py, z, c);
    GR.box(x1 - x0, 0.05, z1 - z0, cx, Y, cz, C.cement); addFoot(x0, z0, x1, z1); for (const [w, dd, x, z] of [[x1 - x0, 0.2, cx, z0], [x1 - x0, 0.2, cx, z1], [0.2, z1 - z0, x0, cz], [0.2, z1 - z0, x1, cz]]) GR.box(w, 0.09, dd, x, Y, z, C.curb);
    const hx = x0 + 3, hz = cz + 1, HC = ['#f28b82', '#fbd06b', '#8fd0a8', '#8fb8ee'];
    [[0, 0], [1, 0], [2, -0.5], [2, 0.5], [3, 0], [4, -0.5], [4, 0.5], [5, 0]].forEach(([i, j], k) => { line(0.95, 0.95, hx + i * 1.0, hz + j * 1.0); d.box(0.8, 0.012, 0.8, hx + i * 1.0, py + 0.005, hz + j * 1.0, HC[k % 4]); });
    d.push(new THREE.RingGeometry(1.0, 1.3, 7).rotateX(-Math.PI / 2), '#8fb8ee', hx + 6.4, py + 0.008, hz);
    const ox = cx + 3.5, oz = cz - 0.5; line(5.2, 0.08, ox, oz - 1.0); line(5.2, 0.08, ox, oz + 1.0); line(5.2, 0.08, ox, oz); for (let i = 0; i <= 5; i++) line(0.08, 2.0, ox - 2.6 + i * 1.04, oz);
    for (const s of [-1, 1]) d.push(new THREE.RingGeometry(0.95, 1.05, 10, 1, s < 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), C.paint, ox + s * 2.6, py, oz);
    d.push(new THREE.RingGeometry(2.4, 2.55, 20).rotateX(-Math.PI / 2), C.paint, cx - 0.5, py, cz - 3.0);
  }

  // ================= SÂN TRƯỜNG: bồn cây phượng, ghế đá, đèn, lối đi, vỉa hè, bảng tin, thùng rác, xe kem, sân chơi =================
  for (const [x2, y2] of D.TREES || []) {
    const x = X3(x2), z = Z3(y2); if (nearDoor(x, z, 2.5)) continue;
    phuong.push([x, z, 1.05 + rnd() * 0.3]); addFoot(x - 1.4, z - 1.4, x + 1.4, z + 2.4);
    SB.cyl(1.25, 1.35, 0.45, x, Y, z, C.stone, 8); GR.cyl(1.08, 1.08, 0.04, x, Y + 0.43, z, '#7a5a3a', 8);
    if (x2 < 1600) stoneBench(SB, x, z + 1.95, 0);
  }
  for (const [x2, y2] of [[120, 380], [380, 400], [1130, 370], [1640, 330], [1640, 450]]) if (!nearDoor(X3(x2), Z3(y2), 2) && !inRoom(x2, y2, 10)) { const x = X3(x2), z = Z3(y2); phuong.push([x, z, 0.95]); SB.cyl(1.0, 1.1, 0.4, x, Y, z, C.stone, 8); }
  for (const [x2, y2] of [[200, 435], [500, 435], [1100, 435], [870, 700], [1180, 735], [1640, 700]]) if (!nearDoor(X3(x2), Z3(y2), 1.6)) stoneBench(SB, X3(x2), Z3(y2), 0);
  for (const [x2, y2] of D.LAMPS || []) lampPost(SB, X3(x2), Z3(y2));
  {
    const d = DG.follow(null), walled = Object.values(R).filter(r => r.walls && r.w);
    for (const r of walled) {   // vỉa hè có bó vỉa quanh lớp
      const hx = r.x + r.w / 2, [ax, az] = P(r.x, r.y, hx), [bx, bz] = P(r.x + r.w, r.y + r.h, hx), m = 1.4;
      for (const [x0, z0, x1, z1] of [[ax - m, az - m, bx + m, az - 0.15], [ax - m, bz + 0.15, bx + m, bz + m], [ax - m, az, ax - 0.15, bz], [bx + 0.15, az, bx + m, bz]]) GR.box(x1 - x0, 0.06, z1 - z0, (x0 + x1) / 2, Y, (z0 + z1) / 2, C.walk);
      for (const [x0, z0, x1, z1] of [[ax - m, az - m, bx + m, az - m + 0.18], [ax - m, bz + m - 0.18, bx + m, bz + m], [ax - m, az - m, ax - m + 0.18, bz + m], [bx + m - 0.18, az - m, bx + m, bz + m]]) GR.box(x1 - x0, 0.12, z1 - z0, (x0 + x1) / 2, Y, (z0 + z1) / 2, C.curb);
      for (const [x, z] of [[ax - 1.0, az - 1.0], [bx + 1.0, az - 1.0], [ax - 1.0, bz + 1.0], [bx + 1.0, bz + 1.0]]) if (!nearDoor(x, z, 3)) kit('bush', x, Y, z, 0.9 + rnd() * 0.3, rnd() * 6);
    }
    if (RS.GATE) {   // lối đi lát gạch chính: từ cổng tới hội trường
      const [x0, z] = P(RS.GATE[0] + 40, RS.GATE[1]), [x1] = P(1150, RS.GATE[1]);
      GR.box(x1 - x0, 0.05, 3.2, (x0 + x1) / 2, Y, z, '#dcc49b'); for (const s of [-1, 1]) GR.box(x1 - x0, 0.09, 0.22, (x0 + x1) / 2, Y, z + s * 1.7, '#b98d63');
      for (let x = x0 + 0.6, k = 0; x < x1; x += 1.2, k++) d.box(0.55, 0.012, 3.0, x, Y + 0.05, z, k % 2 ? '#d1b78c' : '#e5d0a9');
    }
    const at = (x2, y2) => P(x2, y2);
    { const [x, z] = at(700, 455); d.group(x, Y, z, 0, () => { for (const s of [-1, 1]) d.box(0.12, 2.2, 0.12, s * 1.3, 0, 0, '#8a5a34'); d.box(2.8, 1.4, 0.1, 0, 0.8, 0, '#b9824f'); d.box(2.5, 1.15, 0.04, 0, 0.92, 0.06, '#f4efe4'); ['#ffd23f', '#7fd0ff', '#ff8ac2', '#b6f09c', '#ffffff'].forEach((c, i) => d.box(0.42, 0.5, 0.02, -1.0 + i * 0.5, 1.15 + (i % 2) * 0.25, 0.09, c)); d.prism(3.0, 0.4, 0.5, 0, 2.2, 0, C.roof); }); signAt(d, atlas.sign('BẢNG TIN', '#2f5d3f', '#fff', C.gold), 1.6, 0.22, x, Y + 2.05, z + 0.12); }
    { const [x, z] = at(470, 760); d.group(x, Y, z, 0.3, () => {   // xe bán kem
      d.box(2.2, 0.95, 1.1, 0, 0.4, 0, '#bfe6d6'); d.box(2.24, 0.2, 1.14, 0, 1.35, 0, '#fbf1de'); d.box(2.24, 0.12, 1.14, 0, 0.4, 0, '#f6c7c0');
      for (const s of [-1, 1]) d.cyl(0.36, 0.36, 0.14, s * 0.7, 0.36, 0.6, '#3b3346', 8, 0, Math.PI / 2);
      d.cyl(0.04, 0.04, 1.3, 0.7, 1.55, 0, '#8a5a34', 5); d.push(new THREE.ConeGeometry(1.4, 0.55, 8, 1, true), '#f6c7c0', 0.7, 3.0, 0); d.push(new THREE.ConeGeometry(1.42, 0.56, 8, 1, true).rotateY(Math.PI / 8).scale(1, 1, 1), '#fff8ea', 0.7, 3.0, 0, 0, 0, 0, 0.6, 1.0, 0.6);
      d.cone(0.12, 0.3, -0.5, 1.55, 0.25, '#e8c391', 5); d.ball(0.16, -0.5, 1.95, 0.25, '#ff9ec4'); d.cone(0.12, 0.3, -0.1, 1.55, 0.25, '#e8c391', 5); d.ball(0.16, -0.1, 1.95, 0.25, '#fff3c4');
      d.box(1.6, 0.3, 0.04, 0, 0.75, 0.57, '#f5c518'); });
    }
    for (const [x2, y2] of [[200, 435], [500, 435], [1100, 435], [860, 760]]) { const [x, z] = at(x2 + 70, y2); d.cyl(0.25, 0.22, 0.75, x, Y, z, '#4f9a7a', 8); d.cyl(0.27, 0.27, 0.07, x, Y + 0.75, z, '#3f7a62', 8); }
    // sân chơi: nền cao su, xích đu, cầu trượt, bập bênh
    { const [px, pz] = at(910, 830), b = SB;
      GR.box(11, 0.05, 5.4, px, Y, pz, '#e8a27c'); addFoot(px - 5.6, pz - 2.8, px + 5.6, pz + 2.8); for (const s of [-1, 1]) GR.box(11.2, 0.12, 0.18, px, Y, pz + s * 2.75, C.curb);
      b.group(px - 3.2, Y, pz, 0, () => {   // xích đu 2 ghế
        for (const s of [-1, 1]) for (const t of [-1, 1]) b.box(0.12, 2.6, 0.12, s * 1.6, 0, t * 0.55, '#e8453c', 0, t * 0.2);
        b.box(3.5, 0.12, 0.12, 0, 2.48, 0, '#f5c518');
        for (const u of [-0.75, 0.75]) { for (const s of [-1, 1]) b.box(0.03, 1.8, 0.03, u + s * 0.25, 0.65, 0, '#9aa3ad'); b.box(0.6, 0.06, 0.3, u, 0.62, 0, '#3d7be0'); }
      });
      b.group(px + 2.2, Y, pz, 0, () => {   // cầu trượt
        b.box(1.2, 1.6, 1.2, -0.6, 0, 0, '#f5c518'); b.box(1.3, 0.1, 1.3, -0.6, 1.6, 0, '#e8453c');
        for (const s of [-1, 1]) b.box(0.06, 0.6, 1.2, -0.6 + s * 0.6, 1.7, 0, '#e8453c');
        b.box(2.6, 0.08, 0.9, 1.0, 0.75, 0, '#3d7be0', 0, 0, -0.62); for (const s of [-1, 1]) b.box(2.6, 0.2, 0.06, 1.0, 0.82, s * 0.45, '#4caf50', 0, 0, -0.62);
        for (let i = 0; i < 4; i++) b.box(0.9, 0.06, 0.25, -0.6, 0.35 + i * 0.4, -0.72 - i * 0.04, '#ffffff');
      });
      b.group(px - 0.2, Y, pz + 1.8, 0, () => { b.box(0.3, 0.4, 0.3, 0, 0, 0, '#3b3346'); b.box(3.0, 0.08, 0.32, 0, 0.42, 0, '#4caf50', 0, 0, 0.12); for (const s of [-1, 1]) b.box(0.06, 0.3, 0.3, s * 1.3, 0.5 - s * 0.16, 0, '#e8453c'); });
      col(px + 1.6, pz, 0.7, Y + 1.7);
    }
  }

  // ================= SÂN BÓNG ĐÁ =================
  if (R.field) {
    const f = R.field, b = GR, x0 = X3(f.x + 20), x1 = X3(f.x + f.w - 20), z0 = Z3(f.y + 20), z1 = Z3(f.y + f.h - 20), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, L = x1 - x0, W = z1 - z0, ly = Y + 0.03;
    b.box(L + 2.4, 0.04, W + 2.4, cx, Y - 0.01, cz, '#c97a5a'); addFoot(x0 - 1.2, z0 - 1.2, x1 + 1.2, z1 + 3.4);   // đường chạy quanh sân
    for (let i = 0; i < 10; i++) b.plane(L / 10, W, x0 + (i + 0.5) * L / 10, Y + 0.035, cz, i % 2 ? '#7cc45a' : '#8fcf6a', 0, -Math.PI / 2);
    const line = (w, d, x, z) => b.box(w, 0.02, d, x, ly + 0.01, z, '#ffffff');
    line(L, 0.12, cx, z0); line(L, 0.12, cx, z1); line(0.12, W, x0, cz); line(0.12, W, x1, cz); line(0.12, W, cx, cz);
    b.push(new THREE.RingGeometry(1.7, 1.82, 20).rotateX(-Math.PI / 2), '#ffffff', cx, ly + 0.03, cz);
    for (const s of [-1, 1]) {
      const gx = s < 0 ? x0 : x1, g = SB; line(0.12, 6, gx - s * 3, cz); line(3, 0.12, gx - s * 1.5, cz - 3); line(3, 0.12, gx - s * 1.5, cz + 3);
      for (const v of [-1.8, 1.8]) { g.box(0.12, 1.75, 0.12, gx, Y, cz + v, '#ffffff'); g.box(0.06, 1.7, 0.06, gx + s * 1.0, Y, cz + v, '#e6e6e6'); g.box(1.0, 0.05, 0.05, gx + s * 0.5, Y + 1.7, cz + v, '#e6e6e6'); }
      g.box(0.12, 0.12, 3.72, gx, Y + 1.68, cz, '#ffffff');
      DG.follow(null).plane(3.6, 1.7, gx + s * 1.0, Y + 0.85, cz, '#f4f4f4', Math.PI / 2); DG.plane(1.0, 1.7, gx + s * 0.5, Y + 0.85, cz - 1.8, '#f4f4f4'); DG.plane(1.0, 1.7, gx + s * 0.5, Y + 0.85, cz + 1.8, '#f4f4f4', Math.PI);
    }
    for (let i = 0; i < 2; i++) SB.box(L * 0.5, 0.4 + i * 0.4, 0.8, cx, Y, z1 + 1.8 + i * 0.8, i ? '#3d7be0' : '#f5c518');   // khán đài 2 bậc
  }

  // ================= XUẤT RA SCENE =================
  const mat = toon('#ffffff', { vertexColors: true });
  fakeAO(SB, Y); fakeAO(GB, Y);
  for (const [bt, shadow, ol] of [[SB, true, true], [GB, true, true], [GR, false, false]]) { const m = bt.mesh(mat, shadow); if (!m) continue; if (ol) outline(m); scene.add(m); meshes.push(m); }
  for (const r of roofs) {
    fakeAO(r.b, Y + H - 2);
    r.mat = toon('#ffffff', { vertexColors: true, transparent: true, side: THREE.DoubleSide, unique: true });
    r.m = r.b.mesh(r.mat, true); r.m.name = 'school-' + r.b.name; scene.add(r.m); meshes.push(r.m); r.op = 1;
  }
  // cây phượng: thân + tán lá xanh + chùm hoa đỏ (InstancedMesh)
  if (phuong.length) {
    const g0 = g => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
    const trunk = mergeGeometries([new THREE.CylinderGeometry(0.16, 0.26, 2.0, 6).translate(0, 1.0, 0), new THREE.CylinderGeometry(0.08, 0.12, 1.4, 5).rotateZ(0.9).translate(0.6, 2.1, 0), new THREE.CylinderGeometry(0.08, 0.12, 1.4, 5).rotateZ(-0.9).translate(-0.6, 2.1, 0.1)].map(g0));
    const blob = (r, x, y, z, sy = 0.45) => new THREE.IcosahedronGeometry(r, 0).scale(1, sy, 1).translate(x, y, z);
    const green = mergeGeometries([blob(1.7, 0, 2.6, 0), blob(1.2, 1.3, 2.45, 0.4), blob(1.2, -1.3, 2.5, -0.3), blob(1.1, 0.2, 2.45, 1.3), blob(1.1, -0.2, 2.5, -1.3)].map(g0));
    const red = mergeGeometries([blob(1.4, 0.1, 3.05, 0, 0.4), blob(1.0, 1.25, 2.85, 0.5, 0.42), blob(1.0, -1.2, 2.9, -0.4, 0.42), blob(0.9, -0.3, 2.85, 1.25, 0.42), blob(0.9, 0.4, 2.9, -1.2, 0.42)].map(g0));
    for (const g of [green, red]) g.computeVertexNormals();
    const REDS = ['#e8453c', '#ef5a35', '#e2382f'];
    const mk = (geo, material, colOf) => {
      const im = new THREE.InstancedMesh(geo, material, phuong.length);
      phuong.forEach(([x, z, s], i) => { _o.position.set(x, Y + 0.4, z); _o.rotation.set(0, (x * 7 + z) % 6.28, 0); _o.scale.setScalar(s); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); if (colOf) im.setColorAt(i, new THREE.Color(colOf(i))); });
      im.name = 'school-phuong'; im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); meshes.push(im); return im;
    };
    mk(trunk, toon('#8a6a52'));
    mk(green, toon('#ffffff'), i => ['#5a9e4a', '#4f9a4a', '#62a852'][i % 3]);
    const rim = mk(red, toon('#ffffff'), i => REDS[i % 3]);
    const ol = new THREE.InstancedMesh(red, softOutline, phuong.length); ol.instanceMatrix = rim.instanceMatrix; ol.frustumCulled = false; ol.raycast = () => {}; scene.add(ol); meshes.push(ol);
  }
  for (const [name, list] of Object.entries(kits)) placeKit(scene, name, list, { shadow: false }).then(l => l.forEach(m => { m.name = 'school-kit-' + name; }));

  // mái mờ dần khi người chơi ở trong lớp/hành lang (để camera luôn thấy nhân vật)
  function update(p, dt = 0.016) {
    for (const r of roofs) {
      const inside = p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1, tgt = inside ? 0 : 1;
      if (r.op === tgt) continue;
      r.op = Math.max(0, Math.min(1, r.op + (tgt - r.op > 0 ? 1 : -1) * dt * 3)); if (Math.abs(r.op - tgt) < 0.02) r.op = tgt;
      r.mat.opacity = r.op; r.mat.depthWrite = r.op > 0.98; r.mat.visible = r.op > 0.01;   // material.visible: không đụng m.visible (town-buildings dùng để ẩn vật ở xa) r.m.castShadow = r.op > 0.5;
    }
  }
  return { meshes, flagAt, update };
}
