// sample/house-kit.js — BỘ TẠO NHÀ THEO MÔ-ĐUN (từ bộ mẫu cổng trường + quảng trường, docs/style-guide.md).
// Một ngôi nhà = chân tường đá + 1–3 tầng (gờ tầng, cửa sổ chớp) + cửa đi + ban công + mái; tuỳ chọn cửa hàng có biển.
//   Mái (5):      gable 2 mái · hip 4 mái · flat mái bằng tường chắn · mansard mái gãy · shed 1 mái
//   Cửa đi (3):   single đơn 2,1×0,8 · double đôi 2,6×1,6 · arch vòm cuốn (π)
//   Ban công (4): none · rail lan can sắt · loggia lô gia lõm có cột · wrap ban công chạy suốt mặt tiền
// Tỷ lệ φ: cao tầng 3,4 m ≈ 2φ + 1/φ; cửa sổ cao:rộng = φ, tâm cách = rộng·φ²; dốc mái atan(1/φ) ≈ 31,7°; phào dày 1/φ⁵ tầng.
// Màu: chỉ lấy từ palette.js (PAL). Không tạo mesh: mọi khối đẩy vào Batch của người gọi → gộp theo khu, không thêm draw call.
// Dùng: buildHouse(b, { w: 13, dep: 8, floors: 2, roof: 'hip', door: 'double', balcony: 'rail' }, { d: DetailGrid, signAt })
//   gốc = giữa chân mặt tiền, +z = mặt tiền (hướng ra đường), nhà chiếm z ∈ [-dep, 0]. Trả về { H } (đỉnh cao nhất, để va chạm).
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { PAL } from './palette.js';
import { PHI } from '../layout.js';
import { CHIMNEYS } from '../decor.js';

export const ROOFS = ['gable', 'hip', 'flat', 'mansard', 'shed'];
export const DOORS = ['single', 'double', 'arch'];
export const BALCONIES = ['none', 'rail', 'loggia', 'wrap'];
export const FH = 3.4;                        // cao tầng chuẩn (style-guide mục 3)
const C = n => PAL[n].hex;                    // tên bảng màu → hex (Batch tô màu đỉnh)

// ---------- hình mái: bao lồi các điểm (mặt phẳng, đổ bóng phẳng), cache theo kích thước ----------
const cache = new Map();
function convex(key, pts) {
  let g = cache.get(key);
  if (!g) { g = new ConvexGeometry(pts.map(p => new THREE.Vector3(...p))); cache.set(key, g); }
  return g.clone();
}
const k3 = (...a) => a.map(v => v.toFixed(2)).join();
// 2 mái: nóc dọc trục x
const gableGeo = (w, d, h) => convex('g' + k3(w, d, h), [[-w / 2, 0, d / 2], [w / 2, 0, d / 2], [-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [-w / 2, h, 0], [w / 2, h, 0]]);
// 4 mái: nóc ngắn hơn chiều dài đúng 1 chiều sâu (dốc 4 phía bằng nhau)
function hipGeo(w, d, h) {
  const r = Math.max(0.01, (w - d) / 2);
  return convex('h' + k3(w, d, h), [[-w / 2, 0, d / 2], [w / 2, 0, d / 2], [-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [-r, h, 0], [r, h, 0]]);
}
// 1 mái: thấp ở mặt tiền, cao ở sau
const shedGeo = (w, d, h) => convex('s' + k3(w, d, h), [[-w / 2, 0, d / 2], [w / 2, 0, d / 2], [-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [-w / 2, h, -d / 2], [w / 2, h, -d / 2]]);
// mái gãy: thân dốc (frustum) cao h, thu vào a mỗi bên
const frustumGeo = (w, d, h, a) => convex('f' + k3(w, d, h, a), [[-w / 2, 0, d / 2], [w / 2, 0, d / 2], [-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [-w / 2 + a, h, d / 2 - a], [w / 2 - a, h, d / 2 - a], [-w / 2 + a, h, -d / 2 + a], [w / 2 - a, h, -d / 2 + a]]);

// ---------- vòm (π): chữ nhật + nửa hình tròn, mặt phẳng ----------
function archGeo(w, h) {
  const s = new THREE.Shape(), r = w / 2; s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
  return new THREE.ShapeGeometry(s, 6);
}

// ---------- tham số mặc định (mọi kích thước tính từ φ) ----------
export function houseDefaults(o = {}) {
  const w = o.w || 13, dep = o.dep || w / PHI;
  return Object.assign({
    w, dep, floors: 2, roof: 'gable', door: 'single', balcony: 'none', shop: null, chim: false,
    fh: w < 7 ? FH / Math.sqrt(PHI) * 1.06 : FH,   // nhà phố hẹp: tầng thấp hơn φ^½ để giữ tỷ lệ mặt tiền
    wall: 'stoneCream', trim: 'stoneCreamL', base: 'stoneWarm', roofCol: 'roof', shutter: 'shutter', seed: 0,
  }, o);
}

/** Dựng 1 ngôi nhà vào Batch b (toạ độ cục bộ của nhóm hiện tại). opt: { d: DetailGrid|null, signAt(b, text, w, h, x, y, z, shop) } */
export function buildHouse(b, o, opt = {}) {
  o = houseDefaults(o);
  const { w, dep, floors, fh } = o, g = b, zc = -dep / 2;   // g: khối phẳng (cùng batch b để theo nhóm cục bộ)
  const plinth = fh / PHI ** 4 + 0.05;           // chân tường ≈ 0,55 m
  const band = fh / PHI ** 5;                    // gờ tầng / phào ≈ 0,31 m
  const Hw = plinth + floors * fh;               // đỉnh tường
  const wall = C(o.wall), trim = C(o.trim);
  // THÂN NHÀ: chân đá + thân + gờ mỗi tầng
  b.box(w + 0.16, plinth, dep + 0.16, 0, 0, zc, C(o.base));
  b.box(w, Hw - plinth, dep, 0, plinth, zc, wall);
  for (let f = 1; f <= floors; f++) b.box(w + 0.14, band * (f === floors ? 1 : 0.62), dep + 0.14, 0, plinth + f * fh - band * (f === floors ? 1 : 0.62), zc, trim);

  // CỬA HÀNG (tầng trệt): mặt kính rộng w/φ, cửa bên phải, biển hiệu, mái hiên sọc
  const shop = o.shop, acc = shop ? C(shop.acc || 'rubikR') : null;
  let doorU = 0;
  if (shop) {
    const sw = Math.min(w / PHI, w - 2.4), su = -w / 2 + 0.6 + sw / 2; doorU = Math.min(w / 2 - 1.1, su + sw / 2 + 1.0);
    b.box(sw + 0.24, 2.3, 0.1, su, plinth + 0.25, 0.05, C('woodD'));                       // khung tủ kính
    g.plane(sw, 2.06, su, plinth + 0.37 + 1.03, 0.11, C('glass'));
    const sy = plinth + fh - band * 0.62 - 0.75;                                            // băng biển hiệu dưới gờ tầng
    b.box(w * 0.86, 0.68, 0.16, 0, sy, 0.08, acc);
    if (shop.sign && opt.signAt) opt.signAt(b, shop.sign, Math.min(w * 0.8, 6), 0.52, 0, sy + 0.34, 0.17, shop);
    const aw = w * 0.86, n = Math.max(3, Math.round(aw / 0.62)), ay = sy - 0.12;          // mái hiên sọc, nghiêng 1/φ³ rad
    for (let i = 0; i < n; i++) b.box(aw / n, 0.07, 1.3, -aw / 2 + (i + 0.5) * aw / n, ay, 0.62, i % 2 ? C('flowerWhite') : acc, 0, -1 / PHI ** 3);
  }
  // CỬA ĐI
  const dW = { single: 1.0, double: 1.6, arch: 1.2 }[o.door] || 1.0, dH = { single: 2.3, double: 2.6, arch: 2.75 }[o.door] || 2.3;
  if (o.door === 'arch') {
    g.push(archGeo(dW + 0.32, dH + 0.16), trim, doorU, plinth - 0.02, 0.04);
    g.push(archGeo(dW, dH), C('wood'), doorU, plinth, 0.07);
  } else {
    b.box(dW + 0.3, dH + 0.15, 0.08, doorU, plinth - 0.02, 0.04, trim);
    b.box(dW, dH, 0.1, doorU, plinth, 0.06, C(shop ? 'woodD' : 'wood'));
    if (o.door === 'single' && !shop) b.prism(dW + 0.9, 0.42, 1.0, doorU, plinth + dH + 0.3, 0.45, C('roofD'));   // mái che nhỏ
  }
  for (let i = 0; i < 3 && plinth > 0.3; i++) b.box(dW + 0.6 - i * 0.12, plinth / 3, 0.38 * (3 - i), doorU, i * plinth / 3, 0.19 * (3 - i), C('stoneWarm'));   // 3 bậc thềm

  // CỬA SỔ: cao:rộng = φ, tâm cách = rộng·φ²; tầng có ban công → cửa sổ giữa thành cửa ban công
  const ww = w < 7 ? 0.8 : 0.9, wh = ww * PHI, step = ww * PHI * PHI;
  const n = Math.max(1, Math.floor((w - 1.0) / step)), us = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step);
  const balcF = f => o.balcony !== 'none' && f >= 1;
  const win = (u, y, z, ry = 0, tall = false) => {
    const h = tall ? 2.2 : wh;
    b.group(u, y, z, ry, () => {
      b.box(ww + 0.18, h + 0.18, 0.06, 0, -0.09, 0.03, trim);
      g.plane(ww, h, 0, h / 2, 0.075, C('glass'));
      for (const s of [-1, 1]) g.plane(ww / 2, h, s * (ww * 0.75 + 0.1), h / 2, 0.07, C(o.shutter));
    });
  };
  for (let f = 0; f < floors; f++) {
    const y0 = plinth + f * fh + (f === 0 ? 0.9 : 0.75);
    for (const u of us) {
      if (f === 0 && (shop || Math.abs(u - doorU) < dW / 2 + ww)) continue;
      const tall = balcF(f) && Math.abs(u) < step / 2;
      win(u, tall ? plinth + f * fh + 0.05 : y0, 0, 0, tall);
    }
    if (dep > 4) for (const s of [-1, 1]) win(s * w / 2, y0, zc, s * Math.PI / 2);   // 1 cửa sổ mỗi bên hồi
  }

  // BAN CÔNG (các tầng trên)
  for (let f = 1; f < floors && o.balcony !== 'none'; f++) {
    const y = plinth + f * fh, iron = C('iron');
    if (o.balcony === 'rail') {
      const bw = Math.min(w / PHI, step * 1.6), bd = 1.0;
      b.box(bw, 0.16, bd, 0, y - 0.16, bd / 2, trim);
      b.box(bw, 0.06, 0.06, 0, y + 0.95, bd - 0.03, iron); b.box(bw, 0.05, 0.05, 0, y + 0.12, bd - 0.03, iron);
      for (let u = -bw / 2; u <= bw / 2 + 1e-3; u += bw / 6) b.box(0.05, 0.85, 0.05, u, y + 0.12, bd - 0.03, iron);
      for (const s of [-1, 1]) b.box(0.05, 0.9, bd, s * bw / 2, y + 0.06, bd / 2, iron);
    } else if (o.balcony === 'loggia') {
      const bw = Math.min(w / PHI, w - 2), bd = 1.1;
      b.box(bw + 0.4, 0.2, bd, 0, y - 0.2, bd / 2, trim);
      b.box(bw + 0.4, 1.0, 0.18, 0, y, bd - 0.09, wall); b.box(bw + 0.5, 0.1, 0.26, 0, y + 1.0, bd - 0.09, trim);   // lan can xây đặc
      for (const s of [-1, 1]) b.cyl(0.13, 0.15, fh - 0.2, s * (bw / 2 + 0.05), y, bd - 0.14, trim, 8);
      b.box(bw + 0.5, 0.26, bd + 0.1, 0, y + fh - 0.46, bd / 2, trim);                     // xà đỡ trên
    } else if (o.balcony === 'wrap') {
      const bw = w + 0.3, bd = 1.2;
      b.box(bw, 0.18, bd, 0, y - 0.18, bd / 2 - 0.02, trim);
      b.box(bw, 0.06, 0.06, 0, y + 0.95, bd - 0.05, iron); b.box(bw, 0.05, 0.05, 0, y + 0.12, bd - 0.05, iron);
      for (let u = -bw / 2; u <= bw / 2 + 1e-3; u += bw / Math.round(bw / 0.9)) b.box(0.05, 0.85, 0.05, u, y + 0.12, bd - 0.05, iron);
      for (const s of [-1, 1]) b.box(0.05, 0.9, bd, s * bw / 2, y + 0.06, bd / 2, iron);
      for (let u = -bw / 2 + 0.5; u < bw / 2; u += step) b.box(0.14, 0.42, 0.7, u, y - 0.6, 0.35, trim, 0, 0.5);   // con-xon
    }
  }

  // MÁI: dốc atan(1/φ), đua mái ov
  const ov = 0.45, RW = w + 2 * ov, RD = dep + 2 * ov, roof = C(o.roofCol), roofD = C('roofD');
  let H = Hw;
  if (o.roof === 'gable') {
    const h = RD / 2 / PHI; b.push(gableGeo(RW, RD, h), roof, 0, Hw, zc); b.box(RW + 0.1, 0.16, 0.26, 0, Hw + h - 0.08, zc, roofD); H += h;
  } else if (o.roof === 'hip') {
    const h = RD / 2 / PHI; b.push(hipGeo(RW, RD, h), roof, 0, Hw, zc); H += h;
  } else if (o.roof === 'shed') {
    const h = RD / PHI / PHI; b.push(shedGeo(RW, RD, h), roof, 0, Hw, zc); H += h;
  } else if (o.roof === 'mansard') {
    const h1 = fh * 0.8, a = h1 / PHI ** 2, h2 = (RD - 2 * a) / 2 / PHI / PHI;            // thân dốc (gần đứng) + đỉnh 4 mái thoải
    b.push(frustumGeo(RW, RD, h1, a), roof, 0, Hw, zc); b.push(hipGeo(RW - 2 * a, RD - 2 * a, h2), roofD, 0, Hw + h1, zc);
    for (const u of us.length > 1 ? [us[0], us[us.length - 1]] : us) {                     // cửa sổ mái (dormer)
      b.box(1.0, 1.1, 0.9, u, Hw + 0.2, ov - a * 0.55, wall); b.prism(1.3, 0.5, 1.2, u, Hw + 1.3, ov - a * 0.55, roof, Math.PI / 2);
      g.plane(0.6, 0.75, u, Hw + 0.75, ov - a * 0.55 + 0.46, C('glass'));
    }
    H += h1 + h2;
  } else {   // flat: sàn mái + tường chắn mái + phào
    b.box(w + 0.3, 0.2, dep + 0.3, 0, Hw, zc, trim);
    for (const [u, v, L, ry] of [[0, 0.05, w + 0.3, 0], [0, -dep - 0.05, w + 0.3, 0], [-w / 2 - 0.05, zc, dep, Math.PI / 2], [w / 2 + 0.05, zc, dep, Math.PI / 2]]) b.box(L, 0.7, 0.2, u, Hw + 0.2, v, wall, ry);
    b.box(w * 0.3, 1.6, dep * 0.3, -w * 0.2, Hw + 0.2, zc - dep * 0.1, wall);             // tum cầu thang
    b.box(w * 0.3 + 0.3, 0.16, dep * 0.3 + 0.3, -w * 0.2, Hw + 1.8, zc - dep * 0.1, trim);
    H += 2;
  }
  if (o.chim && o.roof !== 'flat') {   // ống khói (khói bếp: ambience.js đọc CHIMNEYS)
    const cx = w * 0.236, cz = zc - dep * 0.12, ch = (H - Hw) + 0.8;
    b.box(0.6, ch, 0.6, cx, Hw, cz, C('roofD')); b.box(0.78, 0.14, 0.78, cx, Hw + ch, cz, C('stoneWarmD'));
    if (b.pre) CHIMNEYS.push(new THREE.Vector3(cx, Hw + ch + 0.14, cz).applyMatrix4(b.pre));
  }
  return { H };
}

// ---------- BIẾN THỂ: chọn tổ hợp theo hạt giống (giữ đủ 1–3 tầng, 5 mái, 3 cửa, 4 ban công) ----------
const WALLS = ['stoneCream', 'stoneCream', 'plaster', 'stoneCreamL', 'stoneCream'];   // đá kem chủ đạo 1/φ
const ACCS = ['rubikR', 'shutter', 'rubikB', 'rubikO', 'rubikG'];
export function houseVariant(seed, o = {}) {
  let s = (seed * 2654435761 >>> 0) || 1; const r = n => (s = (s * 16807) % 2147483647) % n;
  const v = { floors: 1 + r(3), roof: ROOFS[r(5)], door: DOORS[r(3)], balcony: BALCONIES[r(4)], wall: WALLS[r(WALLS.length)], chim: r(3) === 0 };
  if (v.floors === 1) v.balcony = 'none';
  if (o.shop) o.shop = Object.assign({ acc: ACCS[seed % ACCS.length] }, o.shop);
  return Object.assign(v, o);
}
// 13 kiểu nhà học sinh (RS.HOUSES[].k) → tổ hợp kit (giữ "tính cách" cũ bằng số tầng/mái/ban công)
export const LOT_PRESET = {
  bietthu:     { floors: 2, roof: 'hip', door: 'double', balcony: 'rail', chim: true },
  nhaong:      { floors: 3, roof: 'flat', door: 'single', balcony: 'loggia' },
  nhago:       { floors: 1, roof: 'gable', door: 'single', wall: 'stoneCreamD', chim: true },
  nhatron:     { floors: 1, roof: 'hip', door: 'arch', wall: 'plaster' },
  resort:      { floors: 2, roof: 'flat', door: 'double', balcony: 'wrap', wall: 'plaster' },
  nhat:        { floors: 1, roof: 'hip', door: 'double', wall: 'stoneCreamL' },
  laudai:      { floors: 3, roof: 'mansard', door: 'arch', balcony: 'rail' },
  nhasan:      { floors: 2, roof: 'gable', door: 'single', balcony: 'wrap', wall: 'stoneCreamD' },
  nhakinh:     { floors: 2, roof: 'shed', door: 'double', balcony: 'rail', wall: 'stoneCreamL' },
  diatrunghai: { floors: 2, roof: 'flat', door: 'arch', balcony: 'loggia', wall: 'plaster' },
  thai:        { floors: 1, roof: 'gable', door: 'arch', chim: true },
  container:   { floors: 2, roof: 'shed', door: 'single', balcony: 'rail' },
  villa:       { floors: 3, roof: 'mansard', door: 'double', balcony: 'wrap', wall: 'plaster', chim: true },
};
