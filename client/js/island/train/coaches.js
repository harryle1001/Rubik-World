// train/coaches.js — BỐ TRÍ NỘI THẤT 4 KIỂU TOA (toạ độ cục bộ toa: x ngang ±1,5 m, z dọc ±6,5 m, +z = phía đầu máy).
// Mỗi kiểu trả về: geo (khối gộp, 1 draw call / kiểu, instancing theo toa), kit (model CC0 KayKit/Kenney: [tên, x, y, z, tỉ lệ, xoay]),
// seats (ghế: x, z, ry = hướng mặt người ngồi, y = nâng thêm, t = chỗ đặt ly), walk (hình chữ nhật đi được — tâm người),
// air (khoảng trống cho camera), doors (cửa kéo khoang). Tỷ lệ: khoang 2,2 m (≈ φ·1,36), khoảng ghế 0,63 m, bàn cao 0,72 m.
//  compart · toa khoang riêng: 5 khoang × 6 ghế (2 băng đối diện), cửa kéo kính, giá hành lý, bàn nhỏ cạnh cửa sổ + đèn bàn
//  open    · toa ghế mở: 5 cụm ghế đôi đối diện × 2 bên lối đi giữa (40 ghế), bàn giữa mỗi cụm
//  dining  · toa ăn uống: quầy bar 4 ghế cao, 8 bàn đôi có đèn bàn, kệ lọ kẹo
//  obs     · toa ngắm cảnh (cuối tàu): mái kính, 8 ghế bành quay ra cửa sổ, sofa nhìn ra đuôi tàu, thảm, sách
import * as THREE from 'three';
import { Batch } from '../academy/geo.js';
import { FLOOR, IN, ROOF, CL } from './consist.js';

const L = CL / 2, TEAK = '#8a5a3a', TEAKD = '#6e4a30', BRASS = '#d4a24a', CREAM = '#efe3c8', GREEN = '#2c6455', GREEND = '#1f463c', RED = '#8e3b3b', PLUM = '#5b3f6b', GLASS = '#cfe8f0';
const DOOR = 0.42, VEST = [L - 0.9, L - 0.1];                // nửa bề rộng lối cửa thông (tâm người), tiền sảnh 2 đầu toa
export const GAPZ = L + 0.4;                                // tâm khe nối toa (đổi toa khi |z| vượt)
const PHI = 1.618;

function benchTo(b, x0, x1, zc, face, col, seatD = 0.5, backH = 1.2) {   // băng ghế nệm: mặt ngồi tại zc, quay mặt theo face (±1 trục z)
  const zb = zc - face * seatD / 2, zf = zc + face * seatD / 2;
  b.box(x0, x1, FLOOR, FLOOR + 0.36, Math.min(zb, zf) + 0.04, Math.max(zb, zf) - 0.04, TEAKD);                    // chân ghế gỗ
  b.box(x0, x1, FLOOR + 0.36, FLOOR + 0.48, Math.min(zb, zf), Math.max(zb, zf), col);                             // đệm ngồi
  const z0 = zb - face * 0.14, z1 = zb;                                                                            // lưng ghế
  b.box(x0, x1, FLOOR + 0.48, FLOOR + backH, Math.min(z0, z1), Math.max(z0, z1), col);
  b.box(x0, x1, FLOOR + backH, FLOOR + backH + 0.07, Math.min(z0, z1) - 0.01, Math.max(z0, z1) + 0.01, TEAK);     // viền gỗ đỉnh lưng
}
function tableAt(b, x0, x1, z0, z1, top = FLOOR + 0.72) {   // bàn gỗ gắn vách + chân đồng
  b.box(x0, x1, top - 0.05, top, z0, z1, TEAK); b.box(x0, x1, top, top + 0.01, z0 + 0.02, z1 - 0.02, CREAM);
  b.box((x0 + x1) / 2 - 0.03, (x0 + x1) / 2 + 0.03, FLOOR, top - 0.05, (z0 + z1) / 2 - 0.03, (z0 + z1) / 2 + 0.03, BRASS);
}
function rack(b, x0, x1, z0, z1, y = ROOF - 0.72) {        // giá hành lý: khung đồng + lưới
  b.box(x0, x1, y, y + 0.03, z0, z1, '#3a3344'); for (const z of [z0, z1]) b.box(x0, x1, y + 0.03, y + 0.07, z - 0.015, z + 0.015, BRASS);
}
function bag(b, x, z, y, w, h, d, col) { b.box(x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2, col); b.box(x - 0.06, x + 0.06, y + h, y + h + 0.04, z - 0.015, z + 0.015, '#2a2630'); }
const vestWalk = (front, rear) => [front && [-1.36, 1.36, VEST[0], VEST[1]], rear && [-1.36, 1.36, -VEST[1], -VEST[0]], front && [-DOOR, DOOR, VEST[0], GAPZ + 0.05], rear && [-DOOR, DOOR, -GAPZ - 0.05, -VEST[0]]].filter(Boolean);

// ---------- toa khoang riêng ----------
function compart() {
  const b = new Batch(), kit = [], seats = [], walk = [], air = [[0.6, IN, -L + 0.1, L - 0.1], [-IN, IN, VEST[0] - 0.4, L - 0.1], [-IN, IN, -L + 0.1, -VEST[0] + 0.4]], doors = [];
  const XW = 0.5, ZC = [-4.4, -2.2, 0, 2.2, 4.4], H = 1.1;   // vách hành lang x = 0,5…0,6; khoang dài 2,2 m
  // vách hành lang: chân gỗ, khung kính (kính không vẽ — nhìn xuyên), cửa ở giữa mỗi khoang
  for (const zc of ZC) {
    for (const [z0, z1] of [[zc - H, zc - 0.38], [zc + 0.38, zc + H]]) {
      b.box(XW, XW + 0.1, FLOOR, FLOOR + 0.9, z0, z1, TEAK); b.box(XW, XW + 0.1, FLOOR + 2.05, ROOF, z0, z1, CREAM);
      b.box(XW, XW + 0.1, FLOOR + 0.9, FLOOR + 2.05, z0, z0 + 0.08, TEAKD); b.box(XW, XW + 0.1, FLOOR + 0.9, FLOOR + 2.05, z1 - 0.08, z1, TEAKD);
      b.box(XW - 0.01, XW + 0.11, FLOOR + 0.88, FLOOR + 0.92, z0, z1, BRASS);
    }
    b.box(XW, XW + 0.1, FLOOR + 2.05, ROOF, zc - 0.38, zc + 0.38, TEAK);                                            // lanh tô cửa
    doors.push({ x: XW + 0.13, z: zc, w: 0.76, open: 0.7 });
    // 2 băng ghế 3 chỗ đối diện, bàn nhỏ cạnh cửa sổ, đèn bàn, giá hành lý + vali
    for (const f of [-1, 1]) {
      const zs = zc + f * 0.8; benchTo(b, -IN, XW - 0.02, zs, -f, f > 0 ? GREEN : GREEND, 0.52, 1.25);
      for (const [k, x] of [-1.13, -0.5, 0.13].entries()) seats.push({ x, z: zc + f * 0.74, ry: f > 0 ? Math.PI : 0, room: [-1.1, 0.68, zc - 0.42, zc + 0.42], t: k === 0 ? { x: -1.24, y: FLOOR + 0.73, z: zc + f * 0.15 } : null });
      rack(b, -IN, XW - 0.02, Math.min(zc + f * 0.72, zc + f * 1.08), Math.max(zc + f * 0.72, zc + f * 1.08));
      if ((zc * 7 + f * 3) % 2 === 0 || f > 0) bag(b, -0.9 + (zc % 3) * 0.2, zc + f * 0.9, ROOF - 0.69, 0.55, 0.3, 0.3, [RED, '#c8763a', PLUM, '#2b6cb0'][(Math.abs(zc) * 5 + (f > 0 ? 1 : 0)) % 4]);
    }
    tableAt(b, -IN, -1.12, zc - 0.24, zc + 0.24);
    kit.push(['kk_lamp_table', -1.4, FLOOR + 0.93, zc, 0.4, 0]);
    b.box(-1.42, -1.38, FLOOR + 0.73, FLOOR + 0.93, zc - 0.02, zc + 0.02, BRASS);                                    // thân đèn bàn
    walk.push([-0.98, XW + 0.2, zc - 0.3, zc + 0.3]);                                                               // chỗ để chân giữa 2 băng ghế
    air.push([-IN, XW, zc - H + 0.06, zc + H - 0.06]);
  }
  for (const z of [-5.5, -3.3, -1.1, 1.1, 3.3, 5.5]) b.box(-IN, XW, FLOOR, ROOF, z - 0.04, z + 0.04, TEAK);        // vách ngăn khoang
  for (const zc of ZC) b.box(-IN + 0.01, XW - 0.01, ROOF - 0.05, ROOF - 0.03, zc - 0.12, zc + 0.12, '#ffe3a0');     // đèn trần khoang
  b.box(XW + 0.1, IN, FLOOR + 0.01, FLOOR + 0.015, -L + 0.9, L - 0.9, RED);                                         // thảm đỏ hành lang
  for (const z of [-3.3, 1.1, 5.0]) b.box(IN - 0.04, IN, FLOOR + 1.0, FLOOR + 1.04, z - 0.4, z + 0.4, BRASS);        // tay vịn hành lang
  walk.push([0.72, 1.36, -L + 0.15, L - 0.15], ...vestWalk(true, true));
  return { b, kit, seats, walk, air, doors, path: [[1.04, L - 0.5], [1.04, -L + 0.5]], hall: 1.04 };
}
// ---------- toa ghế mở ----------
function open() {
  const b = new Batch(), kit = [], seats = [], ZC = [-4.6, -2.3, 0, 2.3, 4.6];
  for (const zc of ZC) for (const s of [-1, 1]) {
    for (const f of [-1, 1]) {
      benchTo(b, s > 0 ? 0.44 : -IN, s > 0 ? IN : -0.44, zc + f * 0.82, -f, (zc / 2.3 + (s > 0 ? 1 : 0)) % 2 ? GREEN : '#355e7a', 0.5, 1.22);
      for (const [k, x] of [0.7, 1.22].entries()) seats.push({ x: s * x, z: zc + f * 0.76, ry: f > 0 ? Math.PI : 0, t: { x: s * (k ? 1.25 : 0.78), y: FLOOR + 0.73, z: zc + f * 0.14 } });
    }
    tableAt(b, s > 0 ? 0.56 : -IN, s > 0 ? IN : -0.56, zc - 0.28, zc + 0.28);
    if ((zc / 2.3 + s) % 2 === 0) kit.push(['kk_books', s * 1.28, FLOOR + 0.73, zc - 0.05, 0.5, s * PHI]);
    rack(b, s > 0 ? 0.62 : -IN, s > 0 ? IN : -0.62, zc - 0.7, zc + 0.7);
    if ((zc / 2.3 + s * 2) % 3 !== 0) bag(b, s * 1.05, zc + 0.2 * s, ROOF - 0.69, 0.5, 0.28, 0.32, [RED, PLUM, '#c8763a'][(zc / 2.3 + 3 + s) % 3 | 0]);
  }
  b.box(-0.4, 0.4, FLOOR + 0.01, FLOOR + 0.015, -L + 0.9, L - 0.9, RED);                                            // thảm lối đi
  return { b, kit, seats, walk: [[-0.36, 0.36, -L + 0.15, L - 0.15], ...vestWalk(true, true)], air: [[-IN, IN, -L + 0.1, L - 0.1]], doors: [], path: [[0, L - 0.5], [0, -L + 0.5]], hall: 0 };
}
// ---------- toa ăn uống ----------
function dining() {
  const b = new Batch(), kit = [], seats = [];
  // quầy bar dọc vách phải (x > 0), z 1,2 … 5,2: thân gỗ, mặt quầy đồng–kem, tay vịn chân đồng; 4 ghế cao quay vào quầy
  b.box(0.98, IN, FLOOR, FLOOR + 1.02, 1.2, 5.2, TEAK); b.box(0.92, IN, FLOOR + 1.02, FLOOR + 1.08, 1.15, 5.25, CREAM);
  b.box(0.92, 0.95, FLOOR + 0.18, FLOOR + 0.22, 1.2, 5.2, BRASS);
  for (let k = 0; k < 4; k++) { const z = 1.7 + k * 1.0; kit.push(['kk_stool', 0.62, FLOOR, z, 0.42, 0]); seats.push({ x: 0.62, z, ry: Math.PI / 2, y: 0.24, t: { x: 1.15, y: FLOOR + 1.08, z: z + 0.15 } }); }
  for (const [k, z] of [1.5, 2.4, 3.3, 4.2, 4.9].entries()) kit.push([['kk_jar_a', 'kk_jar_b', 'kk_jar_c'][k % 3], 1.32, FLOOR + 1.08, z, 1.1, k]);
  kit.push(['kk_menu', 1.15, FLOOR + 1.08, 2.85, 0.9, -Math.PI / 2], ['kk_counter_deco', 1.27, FLOOR + 1.08, 5.0, 0.28, -Math.PI / 2]);
  // bàn đôi 2 bên lối đi: 3 bên phải phía sau quầy, 4 bên trái; mỗi bàn 2 ghế đối diện, đèn bàn
  const T = [...[-4.9, -2.6, -0.3].map(z => [1, z]), ...[-4.9, -2.6, -0.3, 2.9].map(z => [-1, z])];
  for (const [s, z] of T) {
    kit.push(['kk_table_small', s * 1.1, FLOOR, z, 1, 0], ['kk_lamp_table', s * 1.28, FLOOR + 0.7, z, 0.5, 0], ['kk_plate', s * 1.0, FLOOR + 0.7, z + 0.2, 1, 0], ['kk_plate', s * 1.0, FLOOR + 0.7, z - 0.2, 1, 0]);
    b.box(s * 1.3 - 0.02, s * 1.3 + 0.02, FLOOR + 0.7, FLOOR + 0.84, z - 0.02, z + 0.02, BRASS);
    for (const f of [-1, 1]) { kit.push(['kk_chair', s * 1.05, FLOOR, z + f * 0.62, 0.9, f > 0 ? Math.PI : 0]); seats.push({ x: s * 1.05, z: z + f * 0.6, ry: f > 0 ? Math.PI : 0, y: 0.02, t: { x: s * 0.98, y: FLOOR + 0.71, z: z + f * 0.2 } }); }
  }
  kit.push(['kk_shelf', -1.3, FLOOR + 1.55, 5.45, 0.5, Math.PI / 2], ['kk_jar_a', -1.3, FLOOR + 1.6, 5.3, 1.1, 0], ['kk_jar_c', -1.3, FLOOR + 1.6, 5.6, 1.1, 0]);
  b.box(-0.42, 0.42, FLOOR + 0.01, FLOOR + 0.015, -L + 0.9, L - 0.9, '#6b2f3a');                                    // thảm lối đi
  return { b, kit, seats, walk: [[-0.38, 0.38, -L + 0.15, L - 0.15], ...vestWalk(true, true)], air: [[-IN, IN, -L + 0.1, L - 0.1]], doors: [], path: [[0, L - 0.5], [0, -L + 0.5]], hall: 0, bar: { x: 0.2, z: 3.2 } };
}
// ---------- toa ngắm cảnh (cuối tàu) ----------
function obs() {
  const b = new Batch(), kit = [], seats = [];
  for (const z of [-3.9, -1.3, 1.3, 3.9]) for (const s of [-1, 1]) {
    kit.push(['kk_armchair', s * 0.98, FLOOR, z, 0.82, s * Math.PI / 2]); seats.push({ x: s * 0.96, z, ry: s * Math.PI / 2, y: 0.05, t: { x: s * 1.2, y: FLOOR + 0.42, z: z + 0.62 } });
    kit.push(['kk_table_small', s * 1.2, FLOOR, z + 0.65, 0.6, 0]);
    if ((z + s) % 2) kit.push(['kk_books', s * 1.24, FLOOR + 0.42, z + 0.75, 0.45, s]);
  }
  kit.push(['kk_couch', 0, FLOOR, -5.55, 0.82, 0], ['kk_pillow', -0.45, FLOOR + 0.4, -5.7, 0.4, 0.3], ['kk_pillow', 0.5, FLOOR + 0.4, -5.7, 0.4, -0.2]);
  for (const x of [-0.42, 0.42]) seats.push({ x, z: -5.5, ry: 0, y: 0.04, t: null });
  b.box(-0.8, 0.8, FLOOR + 0.01, FLOOR + 0.02, -4.8, 4.8, '#7a3f52'); b.box(-0.7, 0.7, FLOOR + 0.02, FLOOR + 0.025, -4.7, 4.7, '#c99a5b');   // thảm dài
  for (const z of [-2.6, 0, 2.6]) b.box(-0.04, 0.04, ROOF + 0.3, ROOF + 0.45, z - 0.04, z + 0.04, BRASS);
  return { b, kit, seats, walk: [[-0.4, 0.4, -4.95, L - 0.15], [-1.36, 1.36, VEST[0], VEST[1]], [-DOOR, DOOR, VEST[0], GAPZ + 0.05]], air: [[-IN, IN, -L + 0.1, L - 0.1]], doors: [], path: [[0, L - 0.5], [0, -4.6]], hall: 0, sky: true };
}
// ---------- buồng lái đầu máy (tham quan) ----------
export const CAB = { walk: [[-0.95, 0.95, -4.85, -2.05]], air: [[-1.15, 1.15, -5.9, -1.75]], floor: 1.12, stand: { x: 0.35, z: -4.3 }, driver: { x: -0.62, z: -2.5 }, stoker: { x: 0.62, z: -2.35 } };

const MAKERS = { compart, open, dining, obs };
const cache = {};
export function layout(type) {
  if (!cache[type]) { const r = MAKERS[type](); r.geo = r.b.build(); delete r.b; cache[type] = r; }
  return cache[type];
}
// điểm (x, z) có nằm trong hợp các hình chữ nhật không
export const inRects = (R, x, z, m = 0) => R.some(r => x >= r[0] - m && x <= r[1] + m && z >= r[2] - m && z <= r[3] + m);
// cửa kéo khoang: tấm gỗ khung đồng + kính (đơn vị: rộng w, cao 2 m; trục z = hướng trượt)
export function doorGeo() {
  const b = new Batch(), w = 0.76;
  b.box(-0.03, 0.03, 0, 2.0, -w / 2, w / 2, TEAK);
  b.box(-0.035, 0.035, 0.95, 1.85, -w / 2 + 0.1, w / 2 - 0.1, '#6f97a3');
  b.box(-0.04, 0.04, 1.0, 1.04, -0.06, 0.06, BRASS);
  return b.build();
}
export const glassMat = () => new THREE.MeshBasicMaterial({ color: GLASS, transparent: true, opacity: 0.38 });
