// sample/facade.js — BỘ DỰNG MẶT TIỀN HỌC VIỆN ĐÔNG DƯƠNG (mẫu chuẩn cổng trường + quảng trường)
// Tường vàng kem, chân tường đá, gờ ngang, góc bo tròn; cửa sổ vòm cuốn có khung, bậu, cửa chớp xanh; hành lang vòm cuốn
// nhịp đều (vòm cửa chính rộng gấp φ vòm thường, mỗi vòm cao/rộng = φ); trán tường (pediment) có diềm; mái ngói cong có đầu hồi,
// bờ nóc tròn, đầu đao cong nhẹ; tháp chuông nhỏ; dây leo, bồn hoa cửa sổ.
// Mọi hàm đẩy hình vào Batch có sẵn (không tạo mesh mới → không tăng draw call). Quy ước tham số batch:
//   b = khối chính (đổ bóng + viền), g = chi tiết phẳng không đổ bóng (Batch nền), d = DetailGrid (chỉ hiện gần người chơi).
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { PHI } from '../layout.js';

export const FC = {
  wall: '#f2d8a0', frieze: '#f7e6bf', trim: '#fff6e2', stone: '#c9b796', stone2: '#ab9a7c',
  shutter: '#3f8d6b', louver: '#2e6f53', glass: '#83b4cc', glassDk: '#5d8fa9', door: '#7e5232',
  roof: '#cf5a33', roof2: '#bf4f2c', ridge: '#9a3b23', vine: '#4e8c3e', vine2: '#6aa84f', vine3: '#3f7a35',
  gold: '#e3b54a', bell: '#c9963a', dark: '#3a3040',
};
const _o = new THREE.Object3D(), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Vector3();

// pháp tuyến mượt cho khối cong (trụ, xuyến): tính trên hình có chỉ số rồi chép sang bản tam giác rời của Batch
export function pushSmooth(b, geo, col, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const src = geo.clone();
  _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz, 'YXZ'); _o.scale.set(sx, sy, sz); _o.updateMatrix();
  _m.copy(_o.matrix); if (b.pre) _m.premultiply(b.pre); src.applyMatrix4(_m); src.computeVertexNormals();
  const n = (src.index ? src.toNonIndexed() : src).attributes.normal;
  const g = b.make(geo, col, x, y, z, ry, rx, rz, sx, sy, sz); g.setAttribute('normal', n); b.store(g); return b;
}
export const scyl = (b, rt, rb, h, x, y0, z, col, seg = 10) => pushSmooth(b, new THREE.CylinderGeometry(rt, rb, h, seg), col, x, y0 + h / 2, z);

// hộp vát cạnh (chamfer c): 26 mặt, bắt sáng ở mép → khối mềm, không sắc cạnh
const chamCache = new Map();
export function chamferGeo(w, h, d, c = 0.04) {
  const k = [w, h, d, c].map(v => v.toFixed(3)).join(); let g = chamCache.get(k);
  if (!g) {
    c = Math.min(c, w / 3, h / 3, d / 3); const X = w / 2, Y = h / 2, Z = d / 2, pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(new THREE.Vector3(sx * X, sy * (Y - c), sz * (Z - c)), new THREE.Vector3(sx * (X - c), sy * Y, sz * (Z - c)), new THREE.Vector3(sx * (X - c), sy * (Y - c), sz * Z));
    g = new ConvexGeometry(pts); chamCache.set(k, g);
  }
  return g.clone();
}
export const cbox = (b, w, h, d, x, y0, z, col, c = 0.04, ry = 0) => b.push(chamferGeo(w, h, d, c), col, x, y0 + h / 2, z, ry);

// thanh nối 2 điểm (toạ độ cục bộ của nhóm hiện tại): diềm mái dốc, gờ trán tường
export function seg(b, P, Q, t, h, col) {
  _p.set(...P); _q.set(...Q); const L = _p.distanceTo(_q); if (L < 1e-3) return;
  const g = new THREE.BoxGeometry(t, h, L + 0.02); _o.position.copy(_p).add(_q).multiplyScalar(0.5); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.lookAt(_q); _o.updateMatrix();
  g.applyMatrix4(_o.matrix); b.push(g, col);
}

// ---------- hình vòm ----------
const archCache = new Map();
function archShape(w, h, rise = w / 2) {   // chữ nhật đáy y=0 + nửa elip trên, tổng cao h
  const s = new THREE.Shape(), r = w / 2; s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - rise); s.absellipse(0, h - rise, r, rise, 0, Math.PI, false); s.lineTo(-r, 0); return s;
}
const archGeo = (w, h, rise) => { const k = [w, h, rise].join(); let g = archCache.get(k); if (!g) { g = new THREE.ShapeGeometry(archShape(w, h, rise), 7); archCache.set(k, g); } return g.clone(); };
function ringGeo(w, h, rise, t) {   // khung vòm (viền dày t quanh cửa vòm)
  const o = archShape(w + 2 * t, h + 2 * t, rise + t); o.holes.push(new THREE.Path(archShape(w, h, rise).getPoints(7).map(p => new THREE.Vector2(p.x, p.y + t)).reverse()));
  return new THREE.ShapeGeometry(o, 7).translate(0, -t, 0);
}

// CỬA SỔ VÒM CUỐN: khung + kính + song chia ô + đá khoá + bậu + 2 cánh chớp mở; w rộng, h cao (h/w = φ²... tuỳ người gọi)
// gốc: u (ngang tường), y0 (bậu), z (mặt ngoài tường)
export function archWindow(b, g, d, u, y0, z, w, h, flowers = 0) {
  const r = w / 2;
  b.push(ringGeo(w, h, r, 0.11), FC.trim, u, y0, z + 0.025);                         // khung vòm
  g.push(archGeo(w, h, r), FC.glass, u, y0, z + 0.02);                               // kính
  g.push(archGeo(w * 0.62, (h - r) * 0.9 + r * 0.62, r * 0.62), FC.glassDk, u, y0 + 0.06, z + 0.022);   // bóng tối trong phòng
  d.box(0.05, h - 0.04, 0.03, u, y0, z + 0.03, FC.trim); d.box(w, 0.05, 0.03, u, y0 + h - r, z + 0.03, FC.trim);   // song chia ô
  cbox(b, 0.2, 0.3, 0.1, u, y0 + h - 0.16, z + 0.04, FC.trim, 0.03);                 // đá khoá
  cbox(b, w + 0.4, 0.1, 0.22, u, y0 - 0.1, z + 0.08, FC.trim, 0.03);                 // bậu
  b.box(w + 0.2, 0.06, 0.12, u, y0 - 0.16, z + 0.05, FC.stone);
  const sh = h - r * 0.72, sw = r * 0.96;
  for (const s of [-1, 1]) {                                                          // cửa chớp mở 2 bên
    const x = u + s * (r + 0.11 + sw / 2);
    g.plane(sw, sh, x, y0 + sh / 2, z + 0.03, FC.shutter);
    for (let i = 1; i < 6; i++) d.plane(sw * 0.8, 0.035, x, y0 + i * sh / 6, z + 0.035, FC.louver);
  }
  if (flowers) {                                                                      // bồn hoa dưới bậu
    d.box(w + 0.3, 0.22, 0.26, u, y0 - 0.42, z + 0.14, '#b9824f');
    for (let k = -2; k <= 2; k++) d.ball(0.12, u + k * w / 4.4, y0 - 0.16, z + 0.16, ['#e85d8a', '#f5c518', '#ffffff', '#e8453c', '#f28fb5'][(k + 2 + flowers) % 5]);
    for (const s of [-1, 1]) d.ball(0.14, u + s * (w / 2 + 0.05), y0 - 0.38, z + 0.25, FC.vine2, 0.8, 1.6, 0.8);
  }
}

// ĐOẠN TƯỜNG học viện (gốc = giữa đoạn, +z ra ngoài): chân đá, thân vàng kem, gờ ngang ngang bậu, diềm trán + phào mái
export function wallBody(b, len, H, HV, T, wall = FC.wall) {
  b.box(len, HV, T, 0, 0, 0, wall);
  cbox(b, len + 0.04, 0.55, T + 0.16, 0, 0, 0, FC.stone, 0.05);                       // chân tường đá
  b.box(len + 0.02, 0.06, T + 0.18, 0, 0.55, 0, FC.stone2);
  b.box(len, 0.08, T + 0.1, 0, 0.92, 0, FC.trim);                                     // gờ ngang (ngang bậu cửa)
  b.box(len, HV - H, T + 0.04, 0, H, 0, FC.frieze);                                   // diềm trán (frieze)
  b.box(len + 0.06, 0.08, T + 0.14, 0, H, 0, FC.trim);
  cbox(b, len + 0.14, 0.1, T + 0.22, 0, HV - 0.2, 0, FC.trim, 0.03);                 // phào mái 2 bậc
  cbox(b, len + 0.3, 0.14, T + 0.38, 0, HV - 0.12, 0, FC.trim, 0.04);
}

// cửa vòm mù (tường rào sân chơi): ô lõm vòm + gờ
export function blindArch(b, g, u, z, w, h, y0 = 0.7) {
  g.push(archGeo(w, h, w / 2), '#e9cd92', u, y0, z + 0.015);
  b.push(ringGeo(w, h, w / 2, 0.09), FC.trim, u, y0, z + 0.02);
}

// trụ góc bo tròn (thay hộp vuông)
export function roundPier(b, x, z, HV, r = 0.36) {
  cbox(b, 2 * r + 0.16, 0.55, 2 * r + 0.16, x, 0, z, FC.stone, 0.06);
  scyl(b, r, r, HV - 0.55, x, 0.55, z, FC.trim, 12);
  cbox(b, 2 * r + 0.24, 0.16, 2 * r + 0.24, x, HV - 0.16, z, FC.trim, 0.05);
}

// dây leo bám trụ/tường: chuỗi lá dẹt leo dần lên (DetailGrid, không đổ bóng)
export function vine(d, x, z, h, s = 1, nx = 0, nz = 1, y0 = 0) {
  const n = Math.max(4, Math.round(h / 0.21));   // lá nhỏ dẹt áp sát tường, lượn hình sin, thưa dần lên cao
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), w = Math.sin(i * 0.9 + s * 5) * 0.2 * (0.6 + t), r = (0.11 + 0.04 * Math.sin(i * 1.7 + s)) * (1 - t * 0.4);
    d.ball(r, x + nz * w + nx * 0.04, y0 + 0.2 + t * h, z - nx * w + nz * 0.04, [FC.vine, FC.vine2, FC.vine3][(i + s) % 3], 1 + Math.abs(nz) * 0.5, 0.9, 1 + Math.abs(nx) * 0.5);
    if (i % 4 === 2) d.ball(0.05, x + nz * (w + 0.1) + nx * 0.1, y0 + 0.24 + t * h, z - nx * (w + 0.1) + nz * 0.1, ['#f28fb5', '#ffffff', '#e8453c'][(i + s) % 3]);   // hoa giấy
  }
}

// ---------- HÀNH LANG VÒM CUỐN ----------
// Tính mốc cột: vòm cửa rộng Wd (= φ·nhịp thường), các nhịp còn lại chia đều ~B. Trả về mảng x (cục bộ, tâm mặt tiền = 0).
export function arcadeBays(L, du, B, Wd, extra = 0) {
  let a = du - Wd / 2 - extra * B, c = du + Wd / 2 + extra * B; const xs = [];
  const fill = (x0, x1) => { const len = x1 - x0, n = Math.max(1, Math.round(len / B)); for (let i = 0; i <= n; i++) xs.push(x0 + i * len / n); };
  if (a + L / 2 < 0.9) a = -L / 2; else fill(-L / 2, a);
  if (L / 2 - c < 0.9) c = L / 2; else fill(c, L / 2);
  for (let i = 0; i <= extra; i++) xs.push(a + i * B, c - i * B);
  return [...new Set(xs.map(v => +v.toFixed(3)))].sort((p, q) => p - q);
}
// mặt vòm liền 1 khối (đùn có vát mép) từ xs: chân vòm ys, đỉnh khối top, độ vồng rise, nửa bề rộng mũ cột cw
export function arcadeFront(b, xs, ys, top, rise, cw, depth, z, col = FC.wall, ring = FC.trim) {
  const s = new THREE.Shape(), n = xs.length - 1;
  s.moveTo(xs[0] - cw, ys); s.lineTo(xs[0] - cw, top); s.lineTo(xs[n] + cw, top); s.lineTo(xs[n] + cw, ys);
  for (let i = n; i > 0; i--) {
    s.lineTo(xs[i] - cw, ys);
    const c = (xs[i - 1] + xs[i]) / 2, rx = (xs[i] - xs[i - 1]) / 2 - cw;
    s.absellipse(c, ys, rx, Math.min(rise, top - ys - 0.18), 0, Math.PI, false);
    s.lineTo(xs[i - 1] - cw, ys);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, curveSegments: 9, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
  b.push(g.translate(0, 0, -depth / 2), col, 0, 0, z);
  for (let i = 1; i <= n; i++) {                                                      // vành vòm trắng (archivolt)
    const c = (xs[i - 1] + xs[i]) / 2, rx = (xs[i] - xs[i - 1]) / 2 - cw, ry = Math.min(rise, top - ys - 0.18), t = 0.12, a = new THREE.Shape();
    a.moveTo(rx + t, 0); a.absellipse(0, 0, rx + t, ry + t, 0, Math.PI, false); a.lineTo(-rx, 0); a.absellipse(0, 0, rx, ry, Math.PI, 0, true); a.lineTo(rx + t, 0);
    b.push(new THREE.ShapeGeometry(a, 9), ring, c, ys, z + depth / 2 + 0.035);
  }
}
// cột tròn: đế vát, thân thon (pháp tuyến mượt), mũ cột loe + tấm đỉnh
export function column(b, x, z, ys) {
  cbox(b, 0.56, 0.3, 0.56, x, 0, z, FC.stone, 0.05);
  scyl(b, 0.17, 0.205, ys - 0.5, x, 0.3, z, FC.trim, 10);
  scyl(b, 0.27, 0.18, 0.12, x, ys - 0.32, z, FC.trim, 10);
  cbox(b, 0.5, 0.14, 0.5, x, ys - 0.2, z, FC.trim, 0.03);
}

// TRÁN TƯỜNG (pediment) trên vòm cửa: bệ attic + tam giác + diềm dốc, lùi vào mái depth m. Trả về {base, apex, zf} để gắn biển/biểu tượng.
export function pediment(b, W, y, z, depth, attic, finial = true, wall = FC.wall) {
  const hp = W / 2 / (PHI * PHI);                                                     // độ dốc ≈ 21° (tg = 1/φ²)
  cbox(b, W, attic, depth, 0, y, z - depth / 2 + 0.25, wall, 0.05);
  cbox(b, W + 0.24, 0.12, depth + 0.1, 0, y + attic - 0.06, z - depth / 2 + 0.3, FC.trim, 0.04);
  const y1 = y + attic + 0.06;
  b.prism(depth, hp, W - 0.1, 0, y1, z - depth / 2 + 0.22, wall, Math.PI / 2);        // mặt tam giác
  b.prism(depth, hp + 0.2, W + 0.5, 0, y1 - 0.04, z - depth / 2 + 0.17, FC.roof, Math.PI / 2);   // mái che trán (mặt trước lùi sau tam giác)
  for (const s of [-1, 1]) seg(b, [s * (W / 2 + 0.2), y1 + 0.02, z + 0.28], [0, y1 + hp + 0.2, z + 0.28], 0.16, 0.16, FC.trim);   // diềm dốc
  b.box(W + 0.3, 0.1, 0.16, 0, y1 - 0.02, z + 0.28, FC.trim);
  if (finial) b.ball(0.16, 0, y1 + hp + 0.38, z + 0.2, FC.gold);
  return { y1, hp, zf: z + 0.24 };
}
// cửa sổ tròn (ô thoáng) — đầu hồi / trán tường
export function oculus(b, g, x, y, z, r, ry = 0) {
  g.push(new THREE.CircleGeometry(r, 12), FC.glass, x, y, z, ry);
  b.push(new THREE.RingGeometry(r, r + 0.1, 12), FC.trim, x + Math.sin(ry) * 0.012, y, z + Math.cos(ry) * 0.012, ry);
  if (!ry) { g.box(r * 2, 0.04, 0.02, x, y - 0.02, z + 0.01, FC.trim); g.box(0.04, r * 2, 0.02, x, y - r, z + 0.01, FC.trim); }
}
// ô kính quạt bán nguyệt trên cửa chính (gốc: giữa chân quạt)
export function fanlight(b, g, d, y, z, rx, rise) {
  const s = new THREE.Shape(); s.moveTo(rx, 0); s.absellipse(0, 0, rx, rise, 0, Math.PI, false); s.lineTo(rx, 0);
  g.push(new THREE.ShapeGeometry(s, 9), FC.glass, 0, y, z + 0.01);
  const t = 0.11, a = new THREE.Shape(); a.moveTo(rx + t, 0); a.absellipse(0, 0, rx + t, rise + t, 0, Math.PI, false); a.lineTo(-rx, 0); a.absellipse(0, 0, rx, rise, Math.PI, 0, true); a.lineTo(rx + t, 0);
  b.push(new THREE.ShapeGeometry(a, 9), FC.trim, 0, y, z + 0.02);
  for (let k = 1; k < 4; k++) { const an = k * Math.PI / 4; d.push(new THREE.PlaneGeometry(0.04, 1), FC.trim, Math.cos(an) * rx / 2, y + Math.sin(an) * rise / 2, z + 0.025, 0, 0, an - Math.PI / 2, 1, Math.hypot(Math.cos(an) * rx, Math.sin(an) * rise), 1); }
  cbox(b, 0.22, 0.34, 0.12, 0, y + rise - 0.06, z + 0.06, FC.trim, 0.03);
}
// phù điêu Rubik 3×3 (mặt khối Rubik nổi trên tấm đá có khung)
export function rubikRelief(b, x, y, z, s) {
  cbox(b, s + 0.24, s + 0.24, 0.12, x, y - (s + 0.24) / 2, z, FC.trim, 0.04);
  b.box(s, s, 0.08, x, y - s / 2, z + 0.06, '#1f1b26');
  const q = s / 3, C = ['#e8392f', '#ffffff', '#2b63d9', '#f5c518', '#e8392f', '#2f9e44', '#ff8a1f', '#2b63d9', '#ffffff'];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cbox(b, q * 0.84, q * 0.84, 0.06, x + (i - 1) * q, y + (j - 1) * q - q * 0.42, z + 0.1, C[i * 3 + j], 0.02);
}

// ---------- MÁI ----------
const curve = t => Math.pow(t, 1.6);   // mái cong: thoải ở chân, dốc lên nóc (ngói ta)
function slopeTris(b, A, B, C, D, col) {   // tứ giác ABCD (theo thứ tự), pháp tuyến hướng lên
  let p = [...A, ...B, ...C, ...A, ...C, ...D];
  _p.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]).cross(_q.set(D[0] - A[0], D[1] - A[1], D[2] - A[2]));
  if (_p.y < 0) p = [...A, ...C, ...B, ...A, ...D, ...C];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); b.push(g, col);
}
// đầu đao: mũi ngói cong vểnh nhẹ ở góc mái
function eaveTip(b, x, y, z, ax, az) {
  const a = Math.atan2(ax, az);
  b.push(new THREE.ConeGeometry(0.13, 0.62, 5), FC.ridge, x + ax * 0.12, y + 0.14, z + az * 0.12, a, 1.05, 0);
  b.ball(0.09, x + ax * 0.36, y + 0.36, z + az * 0.36, FC.ridge);
}

// MÁI 2 MÁI CÓ ĐẦU HỒI (gốc x0..x1, z0..z1 = mép mái; y = chân mái; h = cao nóc; gx/gz = lùi đầu hồi so với mép mái 2 đầu)
// front: { s: +1|-1, inset } cho biết mặt tiền ở phía nào (để đầu hồi không phủ ra hành lang)
export function gableRoof(rb, x0, z0, x1, z1, y, h, ov = 0.9, alongX = null, N = 8) {
  const w = x1 - x0, dd = z1 - z0, along = alongX ?? w >= dd, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const Lx = (along ? w : dd) / 2, Dz = (along ? dd : w) / 2;
  rb.group(cx, y, cz, along ? 0 : Math.PI / 2, () => {
    const pt = (x, s, t) => [x, h * curve(t), s * Dz * (1 - t)];
    for (const s of [-1, 1]) {
      for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N; slopeTris(rb, pt(-Lx, s, t0), pt(Lx, s, t0), pt(Lx, s, t1), pt(-Lx, s, t1), i % 2 ? FC.roof2 : FC.roof); }
      rb.box(2 * Lx + 0.06, 0.26, 0.16, 0, -0.24, s * Dz, FC.trim);                  // diềm mái (fascia)
      rb.box(2 * Lx, 0.08, 0.3, 0, -0.04, s * (Dz - 0.1), FC.roof2);
      for (const e of [-1, 1]) eaveTip(rb, e * Lx, 0, s * Dz, e * 0.7, s * 0.7);
    }
    pushSmooth(rb, new THREE.CylinderGeometry(0.15, 0.15, 2 * Lx + 0.2, 8), FC.ridge, 0, h + 0.04, 0, 0, 0, Math.PI / 2);   // bờ nóc tròn
    for (const e of [-1, 1]) {
      const gx = e * (Lx - ov), P = [];
      // đầu hồi: tam giác tường theo đường cong mái, có phào chân + ô thoáng tròn
      const t0 = ov / Dz, tt = k => t0 + (1 - t0) * k / N; for (let k = 0; k <= N; k++) P.push(pt(gx, -1, tt(k))); for (let k = N - 1; k >= 0; k--) P.push(pt(gx, 1, tt(k)));
      const sh = new THREE.Shape(P.map(p => new THREE.Vector2(p[2] * (e > 0 ? -1 : 1), p[1] - 0.06)));
      rb.push(new THREE.ShapeGeometry(sh), FC.wall, gx, 0, 0, e * Math.PI / 2);
      rb.box(0.34, 0.14, 2 * Dz - 2 * ov + 0.2, gx + e * 0.06, -0.04, 0, FC.trim);
      oculus(rb, rb, gx + e * 0.03, h * 0.42, 0, Math.min(0.42, h * 0.16), e * Math.PI / 2);
      for (const s of [-1, 1]) for (let k = 0; k < N; k++) seg(rb, (q => [e * (Lx + 0.04), q[1] - 0.05, q[2]])(pt(0, s, k / N)), (q => [e * (Lx + 0.04), q[1] - 0.05, q[2]])(pt(0, s, (k + 1) / N)), 0.18, 0.2, FC.ridge);   // ngói bìa đầu hồi (sát mép mái)
      rb.ball(0.2, e * (Lx + 0.12), h + 0.1, 0, FC.ridge); rb.push(new THREE.ConeGeometry(0.1, 0.5, 5), FC.ridge, e * (Lx + 0.22), h + 0.32, 0, 0, 0, -e * 0.6);   // đầu nóc vểnh
    }
  });
}

// MÁI 4 MÁI (toà chính): cong, nhiều hàng ngói, bờ nóc tròn, đầu đao 4 góc, diềm mái
export function hipRoofPlus(b, x0, z0, x1, z1, y, h, N = 8) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, alongX = w >= d, r = Math.abs(w - d) / 2;
  const R0 = alongX ? [cx - r, y + h, cz] : [cx, y + h, cz - r], R1 = alongX ? [cx + r, y + h, cz] : [cx, y + h, cz + r];
  const top = p => (alongX ? (p[0] < cx ? R0 : R1) : (p[2] < cz ? R0 : R1));
  const c = [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], L = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * curve(t), P[2] + (Q[2] - P[2]) * t];
  for (let e = 0; e < 4; e++) {
    const A = c[e], B = c[(e + 1) % 4], TA = top(A), TB = top(B);
    for (let i = 0; i < N; i++) {
      const a0 = L(A, TA, i / N), b0 = L(B, TB, i / N), b1 = L(B, TB, (i + 1) / N), a1 = L(A, TA, (i + 1) / N);
      if (TA === TB && i === N - 1) { const g = new THREE.BufferGeometry(); let p = [...a0, ...b0, ...b1]; _p.set(b0[0] - a0[0], 0, b0[2] - a0[2]).cross(_q.set(b1[0] - a0[0], b1[1] - a0[1], b1[2] - a0[2])); if (_p.y < 0) p = [...a0, ...b1, ...b0]; g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); b.push(g, i % 2 ? FC.roof2 : FC.roof); }
      else slopeTris(b, a0, b0, b1, a1, i % 2 ? FC.roof2 : FC.roof);
    }
    for (let k = 0; k < N; k++) { const P = L(A, TA, k / N), Q = L(A, TA, (k + 1) / N); seg(b, [P[0], P[1] + 0.07, P[2]], [Q[0], Q[1] + 0.07, Q[2]], 0.2, 0.16, FC.ridge); }   // bờ dải (hip) theo đường cong
    eaveTip(b, A[0], y, A[2], Math.sign(A[0] - cx) * 0.7, Math.sign(A[2] - cz) * 0.7);
  }
  b.box(w + 0.1, 0.26, 0.16, cx, y - 0.24, z0, FC.trim); b.box(w + 0.1, 0.26, 0.16, cx, y - 0.24, z1, FC.trim);
  b.box(0.16, 0.26, d + 0.1, x0, y - 0.24, cz, FC.trim); b.box(0.16, 0.26, d + 0.1, x1, y - 0.24, cz, FC.trim);
  if (r > 0.1) pushSmooth(b, new THREE.CylinderGeometry(0.16, 0.16, 2 * r + 0.3, 8), FC.ridge, cx, y + h + 0.04, cz, 0, alongX ? 0 : Math.PI / 2, alongX ? Math.PI / 2 : 0);
  for (const R of [R0, R1]) b.ball(0.24, R[0], y + h + 0.08, R[2], FC.ridge);
  return { R0, R1, cx, cz };
}

// THÁP CHUÔNG nhỏ trên nóc toà chính (gốc x, yb = cao độ nóc, z; ry: mặt có đồng hồ quay về hướng ry)
export function bellTower(b, x, yb, z, a, ry, clock = true) {
  b.group(x, yb, z, ry, () => {
    const h1 = a * 0.8, h2 = a * PHI * 0.62, y2 = h1 + 0.14;
    cbox(b, a + 0.3, 0.2, a + 0.3, 0, -1.3, 0, FC.stone, 0.05);
    cbox(b, a, h1 + 1.3, a, 0, -1.3, 0, FC.wall, 0.06);                               // thân (chìm vào mái 1,3 m)
    for (const s of [-1, 1]) for (const t of [-1, 1]) scyl(b, 0.13, 0.13, h1 + h2 + 1.3, s * a / 2, -1.3, t * a / 2, FC.trim, 8);   // góc bo
    cbox(b, a + 0.26, 0.14, a + 0.26, 0, h1, 0, FC.trim, 0.04);
    if (clock) {                                                                      // mặt đồng hồ hướng +z (cổng trường)
      pushSmooth(b, new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16), FC.trim, 0, h1 * 0.5, a / 2 + 0.03, 0, Math.PI / 2, 0);
      b.push(new THREE.CircleGeometry(0.34, 16), '#fffaf0', 0, h1 * 0.5, a / 2 + 0.075);
      b.box(0.05, 0.26, 0.02, 0, h1 * 0.5 - 0.02, a / 2 + 0.085, FC.dark); b.box(0.2, 0.05, 0.02, 0.08, h1 * 0.5 - 0.02, a / 2 + 0.085, FC.dark, 0, 0, 0.5);
    }
    b.box(a - 0.06, h2, a - 0.06, 0, y2, 0, FC.frieze);                               // tầng chuông
    for (let k = 0; k < 4; k++) { const ang = k * Math.PI / 2, ow = a * 0.46; b.push(archGeo(ow, h2 * 0.78, ow / 2), FC.dark, Math.sin(ang) * (a / 2 - 0.02), y2 + h2 * 0.1, Math.cos(ang) * (a / 2 - 0.02), ang); b.push(ringGeo(ow, h2 * 0.78, ow / 2, 0.07), FC.trim, Math.sin(ang) * (a / 2 - 0.01), y2 + h2 * 0.1, Math.cos(ang) * (a / 2 - 0.01), ang); }
    pushSmooth(b, new THREE.SphereGeometry(a * 0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), FC.bell, 0, y2 + h2 * 0.42, 0, 0, 0, 0, 1, 1.5, 1);   // quả chuông
    const y3 = y2 + h2;
    cbox(b, a + 0.2, 0.12, a + 0.2, 0, y3, 0, FC.trim, 0.04); cbox(b, a + 0.46, 0.14, a + 0.46, 0, y3 + 0.12, 0, FC.trim, 0.04);
    const rh = a * PHI * 0.72;                                                        // mái chóp cong 4 mái
    const rg = new THREE.ConeGeometry(Math.SQRT1_2 * (a + 0.6), rh, 4, 4).rotateY(Math.PI / 4), p = rg.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + rh / 2) / rh, k = 1 - Math.pow(t, 0.62) + 0.0; if (t < 1) { const f = (1 - t) > 0 ? k / (1 - t) : 1; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); } }
    b.push(rg, FC.roof, 0, y3 + 0.26 + rh / 2);
    for (const s of [-1, 1]) for (const t of [-1, 1]) eaveTip(b, s * (a + 0.6) / 2, y3 + 0.26, t * (a + 0.6) / 2, s * 0.7, t * 0.7);
    scyl(b, 0.05, 0.07, 0.7, 0, y3 + 0.2 + rh, 0, FC.gold, 6); b.ball(0.16, 0, y3 + 0.5 + rh, 0, FC.gold);
  });
}
