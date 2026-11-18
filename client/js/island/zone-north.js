// zone-north.js — KHU PHÍA BẮC & PHÍA ĐÔNG TRƯỜNG: nhà ở học sinh (13 kiểu), phố Đà Lạt, công viên trí tuệ
// (bàn cờ khổng lồ, tượng đài Rubik, hồ câu), cánh đồng hoa, vườn hoa Đà Lạt, rừng thông + đồi thông + thác nước,
// hồ cá Koi + lều trại + khu picnic, đầm sen, nông trại. Gọi 1 lần từ town-buildings.js (buildNorth).
// Tối ưu điện thoại: khối dựng bằng code gộp vào Batch theo khu (mỗi khu 1 mesh + viền), chi tiết nhỏ vào DetailGrid
// (chỉ hiện trong ~60 m), cây/bụi/hàng rào/lều dùng model kit CC0 bằng InstancedMesh chia ô 80 m (khuất thì bị cắt).
import * as THREE from 'three';
import { Batch } from './decor.js';
import { placeKit } from './kit.js';
import { toon, addOutline } from './style.js';
import { HOUSE_LOTS, lotToWorld, HOUSE_W, HOUSE_D, HOUSE_V1, PHI } from './layout.js';

// Hằng số của bản đồ 2D (client/school/js/core/world.js). Game 2D chạy trong IIFE nên win.eval không đọc được → sao lại ở đây.
const LAKE = { cx: 3930, cy: 330, rx: 300, ry: 150 }, LOTUS = { cx: 4540, cy: 325, rx: 150, ry: 100 };
const GBOARD = { x: 200, y: -470, s: 48 }, POND = { cx: 1300, cy: -290, rx: 210, ry: 120 }, RMON = { x: 820, y: -300 };
const FOREST_GATES = [2790, 3420, 4060, 4760];
function northData(D) {
  const TENTS = [], DALAT = [];
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.2; TENTS.push([LAKE.cx + Math.cos(a) * (LAKE.rx + 46), LAKE.cy + Math.sin(a) * (LAKE.ry + 40), ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#b06bff'][i % 6]]); }
  const pal = ['#f7d774', '#a8e6cf', '#ffd3e0', '#cdb4f7', '#ffe5b4', '#b5e2fa', '#f9c0a0', '#d0f0c0'], roofs = ['#8e3b2f', '#3f5f8a', '#4a6b3a', '#6b3a5a', '#2f4f4f', '#9c4a1a'];
  const signs = ['Homestay', 'Cà phê', '', 'Tiệm hoa', '', 'Tiệm bánh', '', 'Nhà nghỉ', ''];
  for (let x = 2652, i = 0; x < 5120;) {
    const w = 84 + (i * 37) % 48, h = 62 + (i * 23) % 24, g = FOREST_GATES.find(gg => x < gg + 26 && x + w > gg - 26);
    if (g) { x = g + 28; continue; }
    DALAT.push({ x, y: 684 - h - 4, w, h, wall: pal[i % pal.length], roof: roofs[(i * 3) % roofs.length], style: i % 4, sign: signs[i % signs.length], chim: i % 3 === 0, idx: i });
    x += w + 24 + (i * 13) % 26; i++;
  }
  return Object.assign({ LAKE, LOTUS, GBOARD, POND, RMON, FOREST_GATES, TENTS, DALAT }, ...Object.entries(D || {}).filter(([, v]) => v).map(([k, v]) => ({ [k]: v })));
}

// ================= NHÀ Ở (dùng chung: nhà học sinh, phố Đà Lạt, biệt thự resort) =================
let _DG = null;
const CURT = ['#f6d6a8', '#f2b6c6', '#cfe6f7', '#fff3c4', '#d8f0c8'];
export const KIND = {
  bietthu:     { wall: '#fbf1de', roof: '#b9502f', trim: '#ffffff', floors: 2, roofT: 'hip', chim: true, balcony: true, porch: 'col' },
  nhaong:      { wall: '#f7e3a1', roof: '#d9683f', trim: '#ffffff', floors: 3, roofT: 'flat', balcony: true, roofGarden: true },
  nhago:       { wall: '#b9824f', roof: '#6b4a2b', trim: '#f0dcb4', floors: 1, roofT: 'gable', chim: true, logs: true, porch: 'wood' },
  nhatron:     { wall: '#fbf1de', roof: '#e8453c', trim: '#ffffff', floors: 1, roofT: 'mush' },
  resort:      { wall: '#f7fbff', roof: '#46c3d6', trim: '#ffffff', floors: 2, roofT: 'pool', awning: '#46c3d6' },
  nhat:        { wall: '#f4ead2', roof: '#4a4f5c', trim: '#7a4a2a', floors: 1, roofT: 'hip', eave: 1.0, shoji: true, porch: 'engawa' },
  laudai:      { wall: '#e2dacb', roof: '#4a6fc4', trim: '#c9bfae', floors: 2, roofT: 'castle' },
  nhasan:      { wall: '#b9824f', roof: '#d4b06a', trim: '#7a5230', floors: 1, roofT: 'gable', stilt: true, steep: 2.2, horns: true },
  nhakinh:     { wall: '#ffffff', roof: '#d8cfbf', trim: '#ffffff', floors: 2, roofT: 'flat', glass: true, solar: true },
  diatrunghai: { wall: '#ffffff', roof: '#2b6fd9', trim: '#2b6fd9', floors: 2, roofT: 'dome', bloom: true },
  thai:        { wall: '#f7e3c0', roof: '#d9683f', trim: '#a8452a', floors: 1, roofT: 'gable', steep: 2.6, layers: true, horns: true, gold: true },
  container:   { wall: '#e8453c', roof: '#3d7fd9', trim: '#ffffff', floors: 2, roofT: 'container' },
  villa:       { wall: '#f6f4ee', roof: '#e8dcc2', trim: '#3a3540', floors: 2, roofT: 'flat', glass: true, balcony: true, wood: true, terrace: true },
};
// nhà kiểu chung: gốc ở giữa mặt tiền dưới đất, +z = mặt tiền (hướng ra lối đi), w ngang, d sâu
export function house(b, w, d, o) {
  const DG = _DG, fh = o.fh || 1.9, base = o.stilt ? 1.1 : 0, Hh = base + fh * o.floors, zc = -d / 2, win = o.glass ? '#8fd3f0' : '#4f86b8', dk = new THREE.Color(o.roof).offsetHSL(0, 0, -0.12).getStyle();
  const det = fn => { if (DG) { DG.follow(b); fn(DG); } };
  if (o.stilt) for (const u of [-w / 2 + 0.3, 0, w / 2 - 0.3]) for (const v of [-d + 0.3, -0.3]) b.box(0.24, base, 0.24, u, 0, v, o.trim);
  if (o.roofT === 'mush') {   // nhà tròn mái nấm: thân trụ, mũ nấm đỏ chấm trắng, cửa vòm, cửa sổ tròn, ống khói nhỏ
    const r = Math.min(w, d) / 2 - 0.05; b.cyl(r * 0.88, r, fh * 1.25, 0, 0, zc, o.wall, 10); b.cyl(r + 0.08, r + 0.12, 0.3, 0, 0, zc, '#d8cfbf', 10);
    b.push(new THREE.SphereGeometry(r * 1.4, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), o.roof, 0, fh * 1.2, zc, 0, 0, 0, 1, 0.78, 1);
    b.cyl(r * 1.38, r * 1.3, 0.18, 0, fh * 1.12, zc, '#f4ead2', 12);
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, q = i % 2 ? 0.55 : 0.85; b.ball(0.26, Math.cos(a) * r * q * 1.1, fh * 1.2 + (1 - q * q) * r * 1.0 + 0.15, zc + Math.sin(a) * r * q * 1.1, '#ffffff', 1, 0.45, 1); }
    b.box(0.95, 1.55, 0.12, 0, 0, zc + r * 0.95, '#8a5a34'); b.cyl(0.48, 0.48, 0.12, 0, 1.55, zc + r * 0.95, '#8a5a34', 8, 0, Math.PI / 2);
    for (const s of [-1, 1]) { b.cyl(0.32, 0.32, 0.08, s * r * 0.62, 1.25, zc + r * 0.78, '#ffffff', 8, s * 0.7, Math.PI / 2); b.cyl(0.24, 0.24, 0.1, s * r * 0.62, 1.25, zc + r * 0.79, win, 8, s * 0.7, Math.PI / 2); }
    b.cyl(0.14, 0.16, 1.0, r * 0.5, fh * 1.2 + 0.6, zc - r * 0.3, '#8a5a34', 6);
    det(q => { for (let i = 0; i < 9; i++) { const a = Math.PI * 0.15 + i * 0.09 * Math.PI; q.ball(0.18, Math.cos(a) * (r + 0.35), 0.2, zc + Math.sin(a) * (r + 0.35), ['#e85d8a', '#f5c518', '#ffffff'][i % 3], 1, 0.8, 1); } });
    return;
  }
  if (o.roofT === 'container') {   // 2 container xếp lệch, gân tôn, cầu thang ngoài, sàn gỗ
    b.box(w, fh, d, 0, 0, zc, o.wall); b.box(w * 0.9, fh, d * 0.85, -w * 0.05, fh, zc - d * 0.07, o.roof);
    for (let u = -w / 2 + 0.2; u < w / 2; u += 0.35) b.box(0.08, fh * 0.9, 0.05, u, fh * 0.05, 0.02, '#b8322b');
    for (let u = -w * 0.5 + 0.2; u < w * 0.4; u += 0.35) b.box(0.08, fh * 0.9, 0.05, u, fh * 1.05, -d * 0.07 + 0.03, '#2f62ad');
    b.box(1.0, 1.7, 0.08, w * 0.25, 0, 0.04, '#2b2633'); b.box(w * 0.4, 0.9, 0.06, -w * 0.15, fh + 0.5, -d * 0.07 + 0.03, '#8fd3f0');
    b.box(w * 0.35, 0.9, 0.06, -w * 0.22, 0.6, 0.04, '#8fd3f0'); b.box(w + 0.2, 0.12, 0.5, 0, fh * 2, zc, '#2b2633');
    for (let i = 0; i < 6; i++) b.box(0.7, 0.08, 0.28, w / 2 + 0.4, i * 0.32, zc + d * 0.3 - i * 0.28, '#7a7f88');   // cầu thang thép
    b.box(0.05, fh * 1.1, 0.05, w / 2 + 0.75, 0, zc + d * 0.3, '#3a3540');
    det(q => { q.box(w * 0.6, 0.1, 0.9, -w * 0.15, 0, 0.5, '#b9824f'); q.cyl(0.25, 0.2, 0.4, -w / 2 + 0.4, 0, 0.5, '#e8f1f4', 8); q.ball(0.35, -w / 2 + 0.4, 0.65, 0.5, '#4f9a4a'); });
    return;
  }
  // thân nhà + chân tường đá + trụ góc
  b.box(w, Hh - base, d, 0, base, zc, o.wall);
  b.box(w + 0.12, 0.32, d + 0.12, 0, base, zc, '#d8cfbf');
  if (!o.glass && o.roofT !== 'castle') for (const u of [-w / 2, w / 2]) for (const v of [0, -d]) b.cyl(0.16, 0.16, Hh - base - 0.32, u, base + 0.32, v, o.trim, 8);   // góc bo tròn
  if (o.floors > 1 && !o.glass) b.box(w + 0.1, 0.14, d + 0.1, 0, base + fh - 0.07, zc, o.trim);   // gờ tầng
  if (o.logs) for (let y = 0.55; y < Hh - 0.1; y += 0.32) b.box(w + 0.04, 0.07, d + 0.04, 0, y, zc, '#8a5a34');   // vân gỗ súc
  if (o.wood) { b.box(w * 0.32, Hh - 0.3, 0.06, w * 0.34, 0.3, 0.03, '#b9824f'); for (let u = w * 0.2; u < w * 0.5; u += 0.18) b.box(0.03, Hh - 0.3, 0.08, u, 0.3, 0.04, '#8a5a34'); }
  // cửa chính có khung + mái che nhỏ + bậc
  const dc = o.glass ? '#3a3540' : o.roofT === 'castle' ? '#7a4a2a' : '#8a5a34';
  b.box(1.22, 1.95, 0.08, 0, base + 0.02, 0.03, o.trim); b.box(1.0, 1.78, 0.1, 0, base + 0.05, 0.05, dc);
  if (o.roofT === 'castle') b.cyl(0.5, 0.5, 0.1, 0, base + 1.83, 0.05, dc, 8, 0, Math.PI / 2);
  if (!o.porch && !o.glass && o.roofT !== 'castle') b.push(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 10, 1, false, 0, Math.PI), dk, 0, base + 2.1, 0.45, 0, 0, Math.PI / 2, 0.45, 1, 0.75);   // mái hiên cong
  b.box(1.4, 0.12, 0.7, 0, 0, 0.35, '#d8cfbf');
  if (o.stilt) for (let i = 0; i < 4; i++) b.box(1.0, 0.08, 0.3, 0, base - 0.25 - i * 0.27, 0.3 + i * 0.3, o.trim);
  det(q => { q.box(0.06, 0.06, 0.06, 0.38, base + 0.95, 0.12, '#f2c14e'); });
  // cửa sổ mặt tiền + 2 bên, mỗi tầng
  for (let f = 0; f < o.floors; f++) {
    const y = base + f * fh + 0.7, n = Math.max(1, Math.floor((w - 0.4) / 1.5));
    for (let i = 0; i < n; i++) {
      const u = -w / 2 + (i + 0.5) * w / n; if (f === 0 && Math.abs(u) < 0.85) continue;
      if (o.glass) { b.plane(w / n - 0.2, 1.35, u, y + 0.55, 0.05, win); b.box(0.08, 1.45, 0.08, u + (w / n) / 2 - 0.05, y - 0.15, 0.06, o.trim); continue; }
      b.box(0.9, 1.05, 0.06, u, y, 0.03, o.trim); b.plane(0.7, 0.85, u, y + 0.52, 0.07, win);
      if (o.shoji) { b.box(0.03, 0.85, 0.02, u, y + 0.1, 0.08, o.trim); b.box(0.7, 0.03, 0.02, u, y + 0.5, 0.08, o.trim); }
      det(q => { for (const s of [-1, 1]) q.plane(0.2, 0.8, u + s * 0.25, y + 0.52, 0.075, CURT[(f + i) % CURT.length]); if (f > 0 || !o.balcony) { q.box(0.85, 0.16, 0.22, u, y - 0.12, 0.13, '#8a5a34'); q.ball(0.13, u - 0.22, y + 0.09, 0.14, '#e85d8a'); q.ball(0.13, u + 0.22, y + 0.09, 0.14, '#f5c518'); q.ball(0.11, u, y + 0.08, 0.15, '#4f9a4a'); } });
      if (!o.glass && o.roofT !== 'castle' && !o.shoji) for (const s of [-1, 1]) b.box(0.28, 1.0, 0.05, u + s * 0.6, y + 0.02, 0.05, o.trim === '#2b6fd9' ? '#2b6fd9' : '#5f9a6b');   // cửa chớp
    }
    for (const s of [-1, 1]) if (d > 2.4) { b.box(0.06, 1.0, 0.85, s * (w / 2 + 0.03), y, zc, o.trim); b.plane(0.7, 0.8, s * (w / 2 + 0.07), y + 0.5, zc, win, s * Math.PI / 2); }
  }
  // ban công (mỗi tầng trên) + chậu hoa
  if (o.balcony && o.floors > 1) for (let f = 1; f < (o.roofT === 'flat' && !o.glass ? o.floors : 2); f++) {
    const bw = Math.min(w - 0.4, 3.2), by = base + fh * f;
    b.box(bw, 0.12, 0.8, 0, by, 0.4, o.trim); for (let u = -bw / 2; u <= bw / 2 + 0.01; u += 0.4) b.box(0.06, 0.6, 0.06, u, by + 0.12, 0.76, o.trim); b.box(bw, 0.08, 0.1, 0, by + 0.7, 0.76, o.trim);
    det(q => { q.box(0.5, 0.25, 0.25, bw / 2 - 0.4, by + 0.12, 0.55, '#d9683f'); q.ball(0.3, bw / 2 - 0.4, by + 0.5, 0.55, '#e85d8a'); q.ball(0.22, -bw / 2 + 0.35, by + 0.82, 0.78, '#4f9a4a', 1.6, 0.6, 1); });
  }
  // hiên: cột kiểu biệt thự / hiên gỗ / hiên engawa kiểu Nhật
  if (o.porch === 'col') { for (const s of [-1, 1]) { b.cyl(0.14, 0.17, 2.3, s * 0.95, 0, 1.1, '#ffffff', 8); b.box(0.36, 0.14, 0.36, s * 0.95, 0, 1.1, '#d8cfbf'); } b.box(2.4, 0.18, 1.4, 0, 2.3, 0.6, '#ffffff'); b.prism(1.5, 0.6, 2.5, 0, 2.48, 0.6, o.roof, Math.PI / 2); }
  if (o.porch === 'wood') { b.box(w, 0.16, 1.3, 0, 0, 0.65, '#a8743f'); for (const s of [-1, 1]) b.box(0.14, 2.1, 0.14, s * (w / 2 - 0.15), 0.16, 1.2, '#7a5230'); b.box(w + 0.3, 0.1, 1.6, 0, 2.2, 0.6, o.roof, 0, 0.25); for (const s of [-1, 1]) b.box(w / 2 - 0.8, 0.08, 0.06, s * (w / 4 + 0.4), 0.75, 1.25, '#7a5230'); }
  if (o.porch === 'engawa') { b.box(w + 0.4, 0.22, 1.0, 0, 0, 0.5, '#9a6a3e'); for (const s of [-1, 0, 1]) b.box(0.12, 2.1, 0.12, s * (w / 2), 0.22, 0.95, '#5a3a22'); }
  if (o.awning) { b.box(w * 0.7, 0.08, 1.1, 0, 2.35, 0.5, o.awning, 0, -0.18); det(q => { for (let u = -w * 0.35 + 0.15; u < w * 0.35; u += 0.6) q.box(0.3, 0.09, 1.12, u, 2.36, 0.5, '#ffffff', 0, -0.18); }); }
  // mái
  const top = Hh, ov = o.eave || 0.4;
  if (o.roofT === 'gable') {
    const st = o.steep || 1.6; b.prism(w + 2 * ov, st, d + 2 * ov, 0, top, zc, o.roof); b.box(w + 2 * ov + 0.1, 0.14, 0.22, 0, top + st - 0.06, zc, dk);
    b.prism(w + 2 * ov + 0.02, 0.12, d + 2 * ov + 0.04, 0, top - 0.05, zc, dk);   // diềm mái
    if (o.layers) { b.prism(w * 0.62, st * 0.7, d * 0.62, 0, top + st * 0.65, zc, o.roof); b.box(w * 0.62 + 0.1, 0.12, 0.18, 0, top + st * 1.33, zc, o.gold ? '#e9b949' : dk); }
    if (o.horns) for (const s of [-1, 1]) { const hy = top + st * (o.layers ? 1.35 : 1); b.box(0.1, 0.9, 0.1, s * (w / 2 + ov * 0.9), hy - 0.2, zc + 0.25, o.gold ? '#e9b949' : '#5a3a22', 0, 0.5 * s, 0); b.box(0.1, 0.9, 0.1, s * (w / 2 + ov * 0.9), hy - 0.2, zc - 0.25, o.gold ? '#e9b949' : '#5a3a22', 0, -0.5 * s, 0); }
    if (o.gold) b.box(w + 0.06, 0.12, d + 0.06, 0, top - 0.12, zc, '#e9b949');
  } else if (o.roofT === 'hip') {
    b.hip(w + 2 * ov, o.eave ? 1.3 : 1.7, d + 2 * ov, 0, top, zc, o.roof); b.box(w + 2 * ov, 0.1, d + 2 * ov, 0, top - 0.04, zc, dk);
    if (o.eave) { b.hip(w * 0.55, 0.9, d * 0.55, 0, top + 1.05, zc, o.roof); det(q => { q.cyl(0.18, 0.22, 0.7, w / 2 + 0.9, 0, 0.9, '#c9c1b2', 6); q.box(0.45, 0.35, 0.45, w / 2 + 0.9, 0.7, 0.9, '#d8cfbf'); q.hip(0.6, 0.3, 0.6, w / 2 + 0.9, 1.05, 0.9, '#a9a297'); for (let i = 0; i < 4; i++) q.cyl(0.05, 0.06, 2.4 + i * 0.3, -w / 2 - 0.5 - (i % 2) * 0.3, 0, 0.6 - i * 0.35, '#6fb85a', 5); }); }   // đèn đá + khóm trúc
    else if (o.floors > 1) { b.box(1.0, 0.8, 0.8, -w * 0.25, top + 0.25, -0.3, o.wall); b.prism(1.0, 0.5, 1.15, -w * 0.25, top + 1.05, -0.3, o.roof, Math.PI / 2); b.plane(0.5, 0.45, -w * 0.25, top + 0.6, 0.11, win); }   // cửa sổ mái
  } else if (o.roofT === 'flat' || o.roofT === 'pool') {
    b.box(w + 0.3, 0.22, d + 0.3, 0, top, zc, o.roof);
    for (const [u, v, L, ry] of [[0, 0.1, w, 0], [0, -d - 0.1, w, 0], [-w / 2 - 0.1, zc, d, Math.PI / 2], [w / 2 + 0.1, zc, d, Math.PI / 2]]) b.box(L + 0.2, 0.5, 0.12, u, top + 0.22, v, o.glass ? '#bfe6f2' : o.trim, ry);
    if (o.roofT === 'pool') { b.box(w * 0.66, 0.06, d * 0.6, -w * 0.1, top + 0.25, zc, '#46e3c6'); for (let i = 0; i < 3; i++) b.box(0.5, 0.1, 1.2, w * 0.33, top + 0.25, zc - 1.2 + i * 1.2, '#ffffff', 0, 0.15); b.cyl(0.04, 0.04, 1.4, w * 0.36, top + 0.22, zc + d * 0.3, '#ffffff', 5); b.cone(0.85, 0.4, w * 0.36, top + 1.5, zc + d * 0.3, '#f5c518', 8); }
    if (o.solar) { b.box(w * 0.9, 0.04, d * 0.9, 0, top + 0.22, zc, '#9fd36e'); } if (o.solar) for (const s of [-1, 1]) { b.box(w * 0.38, 0.06, d * 0.4, s * w * 0.22, top + 0.45, zc, '#2f4f8a', 0, -0.35); b.box(0.05, 0.3, 0.05, s * w * 0.22, top + 0.22, zc - d * 0.12, '#a9a297'); }
    if (o.roofGarden) { b.box(w - 0.3, 0.3, d * 0.5, 0, top + 0.22, zc - d * 0.15, '#8a5a34'); det(q => { for (let u = -w / 2 + 0.4; u < w / 2 - 0.2; u += 0.5) q.ball(0.26, u, top + 0.62, zc - d * 0.15, ['#4f9a4a', '#6fb85a'][(u * 4 | 0) & 1]); for (const s of [-1, 1]) q.box(0.05, 1.4, 0.05, s * (w / 2 - 0.2), top + 0.22, zc + d * 0.2, '#7a5230'); q.box(w - 0.3, 0.06, 0.6, 0, top + 1.6, zc + d * 0.1, '#7a5230'); }); }
    if (o.wood && o.floors > 1) b.box(w * 0.55, 0.25, 1.1, -w * 0.2, base + fh * 2 - 0.1, 0.4, '#4a4f5a');   // tầng trên đua ra (villa)
    if (o.terrace) {   // sân thượng: sàn gỗ, bể bơi nhỏ, ghế nằm, dù, chậu cây
      b.box(w * 0.55, 0.06, d * 0.7, w * 0.18, top + 0.22, zc, '#b9824f'); b.box(w * 0.32, 0.07, d * 0.5, -w * 0.25, top + 0.22, zc, '#46e3c6');
      for (let i = 0; i < 2; i++) b.box(0.55, 0.12, 1.3, w * 0.1 + i * 0.8, top + 0.28, zc + 0.3, '#ffffff', 0, 0.12);
      b.cyl(0.03, 0.03, 1.5, w * 0.35, top + 0.28, zc - 0.5, '#ffffff', 4); b.cone(0.9, 0.35, w * 0.35, top + 1.7, zc - 0.5, '#e8453c', 8);
      det(q => { for (let i = 0; i < 4; i++) { q.cyl(0.22, 0.18, 0.4, -w / 2 + 0.4 + i * (w - 0.8) / 3, top + 0.22, -d + 0.4, '#e8f1f4', 7); q.ball(0.32, -w / 2 + 0.4 + i * (w - 0.8) / 3, top + 0.8, -d + 0.4, '#4f9a4a'); } });
    }
  } else if (o.roofT === 'dome') {
    b.box(w + 0.2, 0.2, d + 0.2, 0, top, zc, '#ffffff'); for (let u = -w / 2; u <= w / 2 + 0.01; u += w / 4) b.box(0.25, 0.35, 0.25, u, top + 0.2, 0, '#ffffff');
    b.cyl(Math.min(w, d) * 0.26, Math.min(w, d) * 0.26, 0.5, w * 0.15, top + 0.2, zc, '#ffffff', 10);
    b.push(new THREE.SphereGeometry(Math.min(w, d) * 0.28, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), o.roof, w * 0.15, top + 0.7, zc); b.ball(0.12, w * 0.15, top + 0.75 + Math.min(w, d) * 0.28, zc, '#e9b949');
    det(q => { for (let i = 0; i < 14; i++) q.ball(0.22 + (i % 3) * 0.06, -w / 2 + 0.15 + (i % 3) * 0.12, 0.6 + i * 0.22, (i * 0.37) % 1.2 - 0.6 + zc * 0.2, ['#e85d8a', '#f27fb0', '#d94f86'][i % 3], 0.6, 1, 1); });   // hoa giấy leo tường
  } else if (o.roofT === 'castle') {
    for (let u = -w / 2; u <= w / 2 + 0.01; u += 0.6) b.box(0.3, 0.4, 0.3, u, top, 0, o.trim);
    for (let v = -d; v <= 0.01; v += 0.6) for (const s of [-1, 1]) b.box(0.3, 0.4, 0.3, s * w / 2, top, v, o.trim);
    b.box(w + 0.1, 0.12, d + 0.1, 0, top - 0.1, zc, o.trim);
    for (const [u, v] of [[-w / 2, 0], [w / 2, 0], [-w / 2, -d], [w / 2, -d]]) { b.cyl(0.55, 0.6, top + 1.2, u, 0, v, o.wall, 8); b.cone(0.78, 1.6, u, top + 1.2, v, o.roof, 8); b.cyl(0.02, 0.02, 0.6, u, top + 2.7, v, '#3a3540', 4); b.box(0.35, 0.22, 0.02, u + 0.17, top + 3.05, v, '#e8453c'); b.box(0.2, 0.45, 0.06, u, top * 0.6, v + 0.57, '#4a3f55'); }
    b.box(0.9, 1.1, 0.04, 0, top - 1.3, 0.06, '#e8453c'); b.box(0.5, 0.5, 0.05, 0, top - 1.0, 0.08, '#f5c518');   // cờ hiệu
  }
  if (o.chim) { b.box(0.5, 1.5, 0.5, w * 0.28, top + 0.2, zc - d * 0.15, o.logs ? '#a9a297' : '#9a5b3e'); b.box(0.62, 0.12, 0.62, w * 0.28, top + 1.7, zc - d * 0.15, '#7a6a5a'); }
}

// màu thay cho bộ kit (Kenney gốc: lá xanh ngọc, gỗ hồng cá hồi) — theo tên vật liệu, riêng từng model
const KIT_COL = {
  '*': { woodBark: '#8a5a34', woodBarkDark: '#7a5230', wood: '#b9824f', woodDark: '#8a5a34', woodInner: '#e8c391', grass: '#5aa04a', dirt: '#a9a297', stone: '#a9a297', colorRed: '#e8453c', woodBirch: '#f4ead2', leafsFall: '#f0a24a', leafsGreen: '#5aa64a', leafsDark: '#3f8a4f' },
  tree_pine_tall: { leafsDark: '#4a9655' }, tree_fat: { leafsGreen: '#6fb85a' }, tree_palm: { leafsGreen: '#5cb84a', woodBark: '#a8743f' },
  bush_large: { grass: '#4f9a4a' }, rock_large: { grass: '#6fb85a' }, log: { woodBark: '#7a5230' },
};
// ================= DỰNG KHU =================
// k: { ctx, RS, R, D, B, DG, atlas, signAt, measure, chessPiece, rubikCube, X3, Z3, Y, S, nearDoor, reg, rnd, low, pads, flowers, waters }
export function buildNorth(k) {
  const { ctx, RS, R, B, DG, atlas, signAt, X3, Z3, Y, S, nearDoor, reg, rnd, low, pads, flowers, waters } = k, scene = ctx.scene;
  const D = northData(k.D); _DG = DG;
  const nb = {}, measure = (b, name, fn) => { const t0 = b.tris; k.measure(b, name, fn); nb[name] = Math.round(b.tris - t0); };
  const P = (x2, y2) => [X3(x2), Z3(y2)];
  const [wfx, wfz] = P(3915, -470), nearFall = (x, z) => Math.hypot(x - wfx, z - wfz + 1) < 11;
  // batch theo khu (mỗi khu 1 mesh + viền → bị cắt khi khuất)
  B.homes = B.homes || new Batch('homes'); B.dalat = B.dalat || new Batch('dalat'); B.farm = B.farm || new Batch('farm');
  const NP = B.npark = new Batch('npark'), LK = B.lakes = new Batch('lakes'), HL = B.hills = new Batch('hills'), G = B.ground;
  const kit = {}, built = k.isBuilt || (() => false), addKit = (name, x, y, z, s, ry = 0, col) => { if (built(x, z, /^tree/.test(name) ? 1.2 : 0.4)) return; (kit[name] = kit[name] || []).push(col ? [x, y, z, s, ry, col] : [x, y, z, s, ry]); };
  const anim = [];
  const free = (x, z, r = 1.6) => !nearDoor(x, z, r);
  const streetLamp = (b, x, z, y = Y, h = 3.2) => { b.cyl(0.07, 0.1, h, x, y, z, '#2f3a3a', 6); b.cyl(0.18, 0.22, 0.3, x, y, z, '#2f3a3a', 6); b.box(0.36, 0.42, 0.36, x, y + h, z, '#fff3c4'); b.hip(0.55, 0.3, 0.55, x, y + h + 0.42, z, '#2f3a3a'); DG.follow(null).glow(() => DG.box(0.28, 0.34, 0.28, x, y + h + 0.04, z, '#ffe28a')); };
  const bench = (b, x, z, ry, y = Y) => b.group(x, y, z, ry, () => { b.box(1.7, 0.08, 0.5, 0, 0.42, 0, '#b9824f'); b.box(1.7, 0.36, 0.06, 0, 0.55, -0.24, '#b9824f', 0, -0.15); for (const s of [-1, 1]) b.box(0.08, 0.45, 0.5, s * 0.72, 0, 0, '#3a3540'); });
  const flowerBed = (b, x, z, w, d, cols, ry = 0) => b.group(x, Y, z, ry, () => { b.box(w + 0.3, 0.25, d + 0.3, 0, 0, 0, '#d8cfbf'); b.box(w, 0.28, d, 0, 0, 0, '#7a5230'); const q = DG.follow(b); for (let u = -w / 2 + 0.25; u < w / 2; u += 0.42) for (let v = -d / 2 + 0.25; v < d / 2; v += 0.42) q.ball(0.15, u, 0.38, v, cols[((u * 3 | 0) + (v * 3 | 0) + 9) % cols.length]); });
  // cánh cối xay (quay quanh trục z cục bộ): Lb = chiều dài cánh
  const blades = (x, y, z, ry, Lb, speed) => {
    const bl = new Batch('mill');
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, sn = Math.sin(a), cs = Math.cos(a);
      bl.box(0.18, Lb, 0.08, sn * Lb / 2, cs * Lb / 2 - Lb / 2, 0, '#7a5230', 0, 0, -a);
      bl.box(Lb * 0.22, Lb * 0.72, 0.03, sn * Lb * 0.6 + cs * Lb * 0.12, cs * Lb * 0.6 - sn * Lb * 0.12 - Lb * 0.36, 0.05, '#fbf1de', 0, 0, -a); }
    bl.cyl(0.22, 0.22, 0.35, 0, -0.175, 0, '#5a3a22', 8, 0, Math.PI / 2);
    const m = bl.mesh(toon('#ffffff', { vertexColors: true })); m.position.set(x, y, z); m.rotation.y = ry; addOutline(m); scene.add(m); anim.push(t => { m.rotation.z = t * speed; });
  };
  const FCOL = ['#e8453c', '#f5c518', '#e85d8a', '#9b6bd0', '#ffffff', '#ff8a2b'];

  // ---------- 1. NHÀ Ở HỌC SINH: mỗi nhà 1 lô quanh đường vòng (layout.js), nền HOUSE_W × HOUSE_D, tầng cao 1,9·φ^½ ----------
  // nhà hộp hiện đại → nhà CC0 (Kenney City Kit Suburban, docs/kit-catalog.md); mặt tiền vẫn ở HOUSE_V1, tâm nền giữa lô, quay ra đường như cũ
  const CC0_HOUSE = { nhakinh: ['house_suburb_p', 1.24, 1.0], villa: ['house_suburb_q', 1.24, 0.88], resort: ['house_suburb_n_warm', 1.78, 1.38] };
  for (const L of HOUSE_LOTS) {
    const h = L.house; if (!h) continue;
    const cc = CC0_HOUSE[h.k];
    if (cc) { const [x, z] = lotToWorld(L, 0, HOUSE_V1 - HOUSE_D / 2), s = Math.min(HOUSE_W * 0.9 / cc[1], HOUSE_D * 1.04 / cc[2]); (kit[cc[0]] ||= []).push([x, Y, z, s, L.ry]); continue; }
    const o = Object.assign({ k: h.k, fh: 1.9 * Math.sqrt(PHI) }, KIND[h.k] || KIND.nhago), [fx, fz] = lotToWorld(L, 0, HOUSE_V1);
    measure(B.homes, h.k, () => B.homes.group(fx, Y, fz, L.ry, () => house(B.homes, HOUSE_W, HOUSE_D, o)));
  }

  // ---------- 2. PHỐ ĐÀ LẠT ----------
  const DROOF = ['#b9502f', '#d9683f', '#4a6fa5', '#8a4a3a', '#5f8a5a', '#c4452f', '#6b5a8a'];
  const DSTYLE = [{ roofT: 'gable', floors: 2, balcony: true, steep: 2.0 }, { roofT: 'hip', floors: 2, chim: true }, { roofT: 'gable', floors: 1, steep: 2.4, chim: true, porch: 'wood' }, { roofT: 'gable', floors: 2, balcony: true, steep: 2.6 }];
  let sx0 = 1e9, sx1 = -1e9, front = 0;
  for (const h of D.DALAT) {
    const w = h.w * S, d = h.h * S, st = DSTYLE[h.style % 4], o = Object.assign({ wall: h.wall, roof: DROOF[h.idx % DROOF.length], trim: '#ffffff', chim: h.chim }, st), x = X3(h.x) + w / 2, z = Z3(h.y) + d;
    sx0 = Math.min(sx0, X3(h.x) - 2); sx1 = Math.max(sx1, X3(h.x) + w + 2); front = z;
    measure(B.dalat, 'dalat' + h.idx, () => B.dalat.group(x, Y, z, 0, () => {
      house(B.dalat, w, d, o);
      if (h.sign) {   // quán: mái hiên sọc + biển hiệu + đồ bày trước cửa
        const ac = ['#e8453c', '#2f9e44', '#2f62ad', '#d9683f'][h.idx % 4], b = B.dalat;
        b.box(w * 0.8, 0.08, 1.0, 0, 2.25, 0.5, ac, 0, -0.3); const q = DG.follow(b); for (let u = -w * 0.4 + 0.15; u < w * 0.4; u += 0.5) q.box(0.25, 0.09, 1.02, u, 2.26, 0.5, '#ffffff', 0, -0.3);
        signAt(b, atlas.sign(h.sign, '#3b2a1e', '#fff', '#f2c14e'), Math.min(3, w * 0.6), 0.4, 0, 2.95, 0.14);
        if (h.sign === 'Cà phê') for (const s of [-1, 1]) { q.cyl(0.32, 0.32, 0.05, s * 1.3, 0.7, 1.6, '#ffffff', 8); q.cyl(0.04, 0.04, 0.7, s * 1.3, 0, 1.6, '#3a3540', 5); for (const t of [-1, 1]) q.box(0.32, 0.45, 0.32, s * 1.3 + t * 0.55, 0, 1.6, '#8a5a34'); q.cyl(0.03, 0.03, 1.9, s * 1.3, 0.7, 1.6, '#ffffff', 4); q.cone(0.9, 0.35, s * 1.3, 2.5, 1.6, s < 0 ? '#e8453c' : '#f5c518', 8); }
        if (h.sign === 'Tiệm hoa') for (let i = 0; i < 6; i++) { const u = -1.6 + i * 0.64; q.cyl(0.2, 0.16, 0.35, u, 0, 1.0, '#a9a297', 7); q.ball(0.24, u, 0.5, 1.0, FCOL[i % 6]); q.ball(0.16, u + 0.1, 0.62, 1.05, FCOL[(i + 2) % 6]); }
        if (h.sign === 'Tiệm bánh') { q.box(1.6, 0.8, 0.5, -0.9, 0, 0.9, '#b9824f'); for (let i = 0; i < 4; i++) q.ball(0.13, -1.45 + i * 0.36, 0.86, 0.9, ['#e8b04a', '#f5d08a', '#c98a52'][i % 3], 1.3, 0.7, 1); }
        if (h.sign === 'Homestay' || h.sign === 'Nhà nghỉ') { q.box(0.1, 1.4, 0.1, w / 2 - 0.4, 0, 1.3, '#5a3a22'); q.box(0.9, 0.5, 0.06, w / 2 - 0.4, 1.0, 1.3, '#fbf1de'); }
      }
    }));
    ctx.boxes.push({ x0: X3(h.x), x1: X3(h.x) + w, z0: Z3(h.y), z1: Z3(h.y) + d, top: Y + 4 });
    addKit(h.idx % 2 ? 'tree_pine_tall' : 'tree_pine', x + (rnd() - 0.5) * w * 0.6, Y, Z3(h.y) - 1.8, 3.6 + rnd(), rnd() * 6);   // thông sau nhà
  }
  if (D.DALAT.length) {   // vỉa hè lát gạch + bó vỉa, đèn đường cổ, ghế, xe đạp, chậu hoa; cổng gỗ vào rừng thông
    const z0 = front + 0.05, z1 = front + 2.6, b = B.dalat;
    G.box(sx1 - sx0, 0.08, z1 - z0, (sx0 + sx1) / 2, Y, (z0 + z1) / 2, '#e8dcc2'); G.box(sx1 - sx0, 0.16, 0.25, (sx0 + sx1) / 2, Y, z1, '#a9a297');
    const q = DG.follow(null); for (let x = sx0 + 0.5; x < sx1; x += 1.2) q.box(0.05, 0.012, z1 - z0 - 0.3, x, Y + 0.08, (z0 + z1) / 2, '#d4c6a8');
    let i = 0;
    for (let x = sx0 + 4; x < sx1 - 2; x += 9, i++) {
      if (!free(x, z1 - 0.4, 1.2)) continue;
      streetLamp(b, x, z1 - 0.35);
      if (i % 3 === 1) bench(b, x + 2.5, z1 - 0.7, Math.PI);
      if (i % 3 === 2) q.group(x + 2.5, Y, z1 - 0.8, 0.1, () => { for (const s of [-1, 1]) { q.cyl(0.32, 0.32, 0.05, s * 0.5, 0.32, 0, '#3a3540', 10, 0, Math.PI / 2); q.cyl(0.08, 0.08, 0.06, s * 0.5, 0.32, 0, '#c9c1b2', 6, 0, Math.PI / 2); } q.box(1.0, 0.05, 0.05, 0, 0.55, 0, '#3d8fd9', 0, 0, 0.2); q.box(0.05, 0.5, 0.05, -0.2, 0.32, 0, '#3d8fd9', 0, 0, -0.3); q.box(0.05, 0.5, 0.05, 0.35, 0.35, 0, '#3d8fd9', 0, 0, 0.25); q.box(0.25, 0.06, 0.12, -0.25, 0.85, 0, '#3a3540'); q.box(0.06, 0.06, 0.45, 0.5, 0.95, 0, '#3a3540'); q.box(0.3, 0.2, 0.32, 0.62, 0.78, 0, '#c9a45c'); q.ball(0.12, 0.6, 0.95, 0.05, '#e85d8a'); q.ball(0.1, 0.66, 0.95, -0.06, '#f5c518'); });
      if (i % 3 === 0) for (const s of [-1, 1]) { q.cyl(0.26, 0.2, 0.42, x + s * 1.2, Y, z1 - 0.5, '#d9683f', 8); q.ball(0.3, x + s * 1.2, Y + 0.62, z1 - 0.5, FCOL[(i + s + 2) % 6]); }
    }
    for (const g of D.FOREST_GATES) { const x = X3(g), z = front - 1.2; b.group(x, Y, z, 0, () => { for (const s of [-1, 1]) { b.cyl(0.2, 0.24, 3.6, s * 1.4, 0, 0, '#8a5a34', 7); b.cyl(0.3, 0.3, 0.3, s * 1.4, 0, 0, '#a9a297', 7); } b.box(3.6, 0.3, 0.35, 0, 3.4, 0, '#7a5230'); b.prism(4.0, 0.7, 0.9, 0, 3.7, 0, '#4a6b3a'); }); signAt(b, atlas.sign('RỪNG THÔNG', '#3f6b2a', '#fff', '#e8c45a'), 2.4, 0.38, x, Y + 3.0, z + 0.2); }
  }

  // ---------- 3. CÔNG VIÊN TRÍ TUỆ: bàn cờ khổng lồ, tượng đài Rubik, hồ câu ----------
  if (D.GBOARD) {
    const g = D.GBOARD, s = g.s * S, n = 8, bx = X3(g.x), bz = Z3(g.y), L = s * n, cx = bx + L / 2, cz = bz + L / 2;
    measure(NP, 'giant-chess', () => {
      NP.box(L + 1.6, 0.14, L + 1.6, cx, Y, cz, '#d8cfbf'); NP.box(L + 0.6, 0.18, L + 0.6, cx, Y, cz, '#8a5a34');
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) NP.plane(s, s, bx + (i + 0.5) * s, Y + 0.19, bz + (j + 0.5) * s, (i + j) % 2 ? '#4a3f55' : '#fbf1de', 0, -Math.PI / 2);
      const PC = [['r', 0, 0, 'b'], ['k', 4, 0, 'b'], ['n', 6, 2, 'b'], ['p', 3, 3, 'b'], ['p', 5, 1, 'b'], ['q', 3, 6, 'w'], ['p', 4, 4, 'w'], ['p', 2, 5, 'w'], ['n', 5, 5, 'w'], ['k', 6, 7, 'w'], ['r', 0, 7, 'w']];
      for (const [kd, i, j, c] of PC) { const x = bx + (i + 0.5) * s, z = bz + (j + 0.5) * s, h = k.chessPiece(NP, kd, x, z, 1.15, c, Y + 0.19); ctx.boxes.push({ x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6, top: Y + 0.19 + h }); }
    });
    {   // khán đài bậc gỗ phía nam + ghế + đèn 4 góc
      for (let i = 0; i < 2; i++) NP.box(L * 0.6, 0.3, 0.7, cx, Y + i * 0.3, bz + L + 1.6 + i * 0.7, i ? '#b9824f' : '#d8cfbf');
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) streetLamp(NP, cx + u * (L / 2 + 1.2), cz + v * (L / 2 + 1.2));
      for (const s2 of [-1, 1]) { bench(NP, cx + s2 * (L / 2 + 1.9), cz - 3, s2 * Math.PI / 2 * -1); bench(NP, cx + s2 * (L / 2 + 1.9), cz + 3, s2 * Math.PI / 2 * -1); }
      signAt(NP, atlas.sign('CỜ VUA KHỔNG LỒ', '#4a3f55', '#fff', '#e9b949'), 3.4, 0.45, cx, Y + 0.9, bz - 1.25);
      for (const s2 of [-1, 1]) NP.box(0.12, 0.9, 0.12, cx + s2 * 1.5, Y, bz - 1.3, '#5a3a22');
    }
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; addKit(i % 3 ? 'tree_oak' : 'tree_autumn', cx + Math.cos(a) * (L / 2 + 5), Y, cz + Math.sin(a) * (L / 2 + 5), 3.6 + rnd(), rnd() * 6); }
  }
  if (D.RMON) {
    const [x, z] = P(D.RMON.x, D.RMON.y);
    measure(NP, 'rubik-statue', () => {
      // quảng trường tròn: vòng gạch 2 màu + tia lát đá
      for (let r = 9, i = 0; r > 3; r -= 1.5, i++) G.push(new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2), i % 2 ? '#e8dcc2' : '#d8c6a2', x, Y + 0.02 + i * 0.006, z);
      NP.cyl(3.4, 3.6, 0.3, x, Y, z, '#d8cfbf', 12); NP.box(3.2, 0.8, 3.2, x, Y + 0.3, z, '#e8dcc2'); NP.box(2.4, 0.6, 2.4, x, Y + 1.1, z, '#fbf1de');
      NP.box(3.25, 0.1, 3.25, x, Y + 1.08, z, '#e9b949');
      k.rubikCube(NP, x, Y + 1.7 + 2.6 * 0.87 + 0.05, z, 3.0, 0.3, true);
      signAt(NP, atlas.sign('TƯỢNG ĐÀI RUBIK', '#7a1f2b', '#ffe08a', '#e9b949'), 2.6, 0.38, x, Y + 0.72, z + 1.62);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; streetLamp(NP, x + Math.cos(a) * 7.6, z + Math.sin(a) * 7.6); bench(NP, x + Math.cos(a + 0.4) * 7.2, z + Math.sin(a + 0.4) * 7.2, -(a + 0.4) - Math.PI / 2); }
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; flowerBed(NP, x + Math.cos(a) * 5, z + Math.sin(a) * 5, 2.4, 0.9, i % 2 ? ['#e8453c', '#f5c518', '#ffffff'] : ['#e85d8a', '#9b6bd0', '#ffffff'], -a + Math.PI / 2); }
    });
    ctx.boxes.push({ x0: x - 1.6, x1: x + 1.6, z0: z - 1.6, z1: z + 1.6, top: Y + 1.7 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.2; if (free(x + Math.cos(a) * 11, z + Math.sin(a) * 11, 2)) addKit(i % 2 ? 'tree_fat' : 'tree_oak', x + Math.cos(a) * 11, Y, z + Math.sin(a) * 11, 3.8 + rnd(), rnd() * 6); }
  }

  // ---------- hồ nước dùng chung: mặt nước (town-buildings vẽ), bờ đá, sỏi, lá sen, lau sậy, cá Koi ----------
  const koiSets = [];
  const lake = (b, e, padN, flowerN, koiN) => {
    const [x, z] = P(e.cx, e.cy), rx = e.rx * S, rz = e.ry * S; waters.push([x, z, rx, rz]);
    G.push(new THREE.RingGeometry(1, 1.14, 32).rotateX(-Math.PI / 2), '#d8cfbf', x, Y + 0.025, z, 0, 0, 0, rx, 1, rz);
    G.push(new THREE.RingGeometry(1.14, 1.2, 32).rotateX(-Math.PI / 2), '#a9a297', x, Y + 0.03, z, 0, 0, 0, rx, 1, rz);
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + rnd() * 0.2; b.push(new THREE.DodecahedronGeometry(0.4, 0), rnd() < 0.5 ? '#a9a297' : '#c9c1b2', x + Math.cos(a) * rx * 1.1, Y + 0.08, z + Math.sin(a) * rz * 1.1, rnd() * 6, 0, 0, 0.8 + rnd() * 0.6, 0.5, 0.8 + rnd() * 0.5); }
    for (let i = 0; i < padN; i++) { const a = rnd() * Math.PI * 2, q = Math.sqrt(rnd()) * 0.85; pads.push([x + Math.cos(a) * rx * q, z + Math.sin(a) * rz * q, 0.45 + rnd() * 0.35]); if (i < flowerN) flowers.push(pads[pads.length - 1]); }
    const d = DG.follow(null);
    for (let i = 0; i < (low ? 20 : 34); i++) { const a = rnd() * 6.28, kk = 0.94 + rnd() * 0.08; const px = x + Math.cos(a) * rx * kk, pz = z + Math.sin(a) * rz * kk; if (!free(px, pz, 1.2)) continue; for (let j = 0; j < 3; j++) d.cone(0.06, 0.9 + rnd() * 0.5, px + (j - 1) * 0.15, Y, pz + (rnd() - 0.5) * 0.3, j % 2 ? '#6f9f3a' : '#8fbf4a', 3); if (i % 3 === 0) d.box(0.06, 0.22, 0.06, px, Y + 1.2, pz, '#7a5230'); }
    if (koiN) koiSets.push({ x, z, rx: rx * 0.75, rz: rz * 0.75, n: low ? Math.ceil(koiN / 2) : koiN });
  };
  if (D.POND) {
    lake(NP, D.POND, 10, 4, 10);
    const [x, z] = P(D.POND.cx, D.POND.cy), rz = D.POND.ry * S, rx = D.POND.rx * S;
    // cầu gỗ thẳng băng qua hồ (đi được) + bến câu nhỏ có mái
    const bx = x + rx * 0.35, y = Y + 0.35;
    if (free(bx, z - rz, 1.4) && free(bx, z + rz, 1.4)) {
      NP.box(1.8, 0.14, rz * 2 + 1.6, bx, y - 0.14, z, '#a8743f'); for (let v = -rz - 0.6; v < rz + 0.8; v += 0.5) NP.box(1.82, 0.03, 0.06, bx, y, z + v, '#8a5a34');
      for (const s of [-1, 1]) { NP.box(0.08, 0.06, rz * 2 + 1.6, bx + s * 0.86, y + 0.85, z, '#7a5230'); for (let v = -rz - 0.6; v <= rz + 0.8; v += 1.6) NP.box(0.1, 0.85, 0.1, bx + s * 0.86, y, z + v, '#7a5230'); for (let v = -rz + 1; v < rz; v += 2.4) NP.cyl(0.1, 0.1, 0.6, bx + s * 0.86, Y - 0.2, z + v, '#5a3a22', 6); }
      for (const s of [-1, 1]) NP.box(1.8, 0.18, 0.6, bx, Y, z + s * (rz + 1.0), '#a8743f', 0, s * 0.3);
      ctx.decks.push({ x0: bx - 0.9, x1: bx + 0.9, z0: z - rz - 0.7, z1: z + rz + 0.7, y });
    }
    const px = x - rx * 0.45, pz = z + rz;   // bến câu
    if (free(px, pz, 1.2)) { NP.box(2.2, 0.12, 3.0, px, Y + 0.18, pz - 1.2, '#a8743f'); for (const s of [-1, 1]) for (const v of [-2.5, 0]) NP.box(0.12, 2.1, 0.12, px + s * 1.0, Y + 0.18, pz + v, '#7a5230'); NP.prism(2.6, 0.7, 3.4, px, Y + 2.28, pz - 1.2, '#d9683f', Math.PI / 2); ctx.decks.push({ x0: px - 1.1, x1: px + 1.1, z0: pz - 2.7, z1: pz + 0.3, y: Y + 0.3 }); DG.follow(null).box(0.5, 0.4, 0.4, px + 0.5, Y + 0.3, pz - 0.5, '#3d8fd9'); }
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + 0.4, tx = x + Math.cos(a) * (rx + 4), tz = z + Math.sin(a) * (rz + 4); if (free(tx, tz, 2.5)) addKit(i % 2 ? 'tree_oak' : 'tree_autumn', tx, Y, tz, 3.8 + rnd(), rnd() * 6); }
  }
  for (const id of ['giantchess', 'rubikpark', 'pond']) { const r = R[id]; if (!r) continue; for (let i = 0; i < 14; i++) { const x2 = r.x + 15 + rnd() * (r.w - 30), y2 = r.y + 15 + rnd() * (r.h - 30), [x, z] = P(x2, y2); if (reg(x2, y2) === id && free(x, z, 3)) addKit(i % 2 ? 'bush_large' : 'bush', x, Y, z, 4.5, rnd() * 6); } }

  // ---------- 4. CÁNH ĐỒNG HOA (luống tulip sọc màu) + VƯỜN HOA ĐÀ LẠT ----------
  const fl = [];
  if (R.flowerfield) {
    const r = R.flowerfield, [x0, z0] = P(r.x + 40, r.y + 60), [x1, z1] = P(r.x + r.w - 40, r.y + r.h - 40), rowGap = low ? 2.0 : 1.5, step = low ? 0.8 : 0.55;
    let row = 0;
    for (let z = z0; z < z1; z += rowGap, row++) {
      const col = FCOL[row % FCOL.length];
      G.box(x1 - x0, 0.1, 0.9, (x0 + x1) / 2, Y, z, '#8a5a34'); G.box(x1 - x0 - 0.2, 0.42, 0.5, (x0 + x1) / 2, Y + 0.08, z, '#4f9a4a');
      for (let x = x0 + 0.3; x < x1; x += step) { if (!free(x, z, 1.6)) continue; fl.push([x + (rnd() - 0.5) * 0.15, z + (rnd() - 0.5) * 0.3, col, 0.9 + rnd() * 0.35]); }
    }
    // khung ảnh trái tim + chòi ngắm + cối xay gió nhỏ
    const hx = (x0 + x1) / 2, hz = z1 + 2.2;
    if (free(hx, hz, 2)) { NP.group(hx, Y, hz, 0, () => { NP.box(2.6, 0.12, 1.4, 0, 0, 0, '#b9824f'); for (let i = 0; i < 22; i++) { const t = i / 22 * Math.PI * 2, px = 16 * Math.sin(t) ** 3 / 16 * 1.2, py = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 * 1.2; NP.ball(0.2, px, 1.9 + py, 0, ['#e85d8a', '#f27fb0', '#ffffff'][i % 3]); } for (const s of [-1, 1]) NP.box(0.08, 1.2, 0.08, s * 0.55, 0.1, 0, '#7a5230'); }); signAt(NP, atlas.sign('CÁNH ĐỒNG HOA', '#8a2b4e', '#fff', '#f5c518'), 2.6, 0.36, hx, Y + 0.55, hz + 0.75); }
    const mx = x1 + 3, mz = (z0 + z1) / 2;
    if (free(mx, mz, 3)) {
      NP.cyl(1.1, 1.6, 5.0, mx, Y, mz, '#fbf1de', 8); NP.cone(1.6, 1.6, mx, Y + 5.0, mz, '#b9502f', 8); NP.box(0.8, 1.5, 0.1, mx - 1.45, Y, mz, '#8a5a34', Math.PI / 2);
      ctx.boxes.push({ x0: mx - 1.4, x1: mx + 1.4, z0: mz - 1.4, z1: mz + 1.4, top: Y + 6 });
      blades(mx - 1.75, Y + 4.5, mz, -Math.PI / 2, 2.6, 0.8);
    }
  }
  if (R.garden) {
    const r = R.garden, [x0, z0] = P(r.x + 20, r.y + 30), [x1, z1] = P(r.x + r.w - 20, r.y + r.h - 20), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    measure(LK, 'dalat-garden', () => {
      for (let i = 0; i < 3; i++) { const rr = 6 - i * 2; LK.cyl(rr + 0.25, rr + 0.25, 0.18, cx, Y, cz, '#d8cfbf', 20); LK.cyl(rr, rr, 0.22, cx, Y, cz, ['#7a5230', '#8a5a34', '#7a5230'][i], 20); }
      for (let i = 0; i < 3; i++) { const rr = 5.2 - i * 2, n = Math.floor(rr * 6); for (let j = 0; j < n; j++) { const a = j / n * 6.28; fl.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, FCOL[(i * 2 + (j % 2)) % 6], 1.0]); } }
      LK.cyl(0.5, 0.7, 0.9, cx, Y, cz, '#d8cfbf', 8); LK.ball(0.6, cx, Y + 1.3, cz, '#e85d8a');
      for (const s of [-1, 1]) { const ax = cx + s * 9; if (!free(ax, cz, 1.8)) continue; LK.group(ax, Y, cz, Math.PI / 2, () => { for (const t of [-1, 1]) LK.box(0.12, 2.4, 0.12, t * 0.9, 0, 0, '#ffffff'); LK.push(new THREE.TorusGeometry(0.9, 0.08, 4, 10, Math.PI), '#ffffff', 0, 2.4, 0); const q = DG.follow(LK); for (let i = 0; i < 9; i++) { const a = i / 8 * Math.PI; q.ball(0.18, Math.cos(a) * 0.9, 2.4 + Math.sin(a) * 0.9, 0, ['#e85d8a', '#ffffff', '#f27fb0'][i % 3]); } }); }
      for (let i = 0; i < 4; i++) bench(LK, cx + (i % 2 ? 7 : -7), cz + (i < 2 ? -4.5 : 4.5), i < 2 ? 0 : Math.PI);
      signAt(LK, atlas.sign('VƯỜN HOA ĐÀ LẠT', '#8a2b4e', '#fff', '#f5c518'), 3.0, 0.4, cx, Y + 1.1, z1 + 0.6);
      for (const s of [-1, 1]) LK.box(0.1, 1.0, 0.1, cx + s * 1.3, Y, z1 + 0.55, '#7a5230');
    });
    for (let x = x0; x < x1; x += 3) for (const z of [z0 - 1.2]) if (free(x, z, 2)) addKit('bush', x, Y, z, 4.4, rnd() * 6);
  }

  // ---------- 5. RỪNG THÔNG, ĐỒI THÔNG, THÁC NƯỚC ----------
  for (const [x2, y2, kd] of RS.FOREST_TREES || []) {
    if (low && rnd() < 0.35) continue; const [x, z] = P(x2, y2); if (!free(x, z, 2.5) || nearFall(x, z)) continue;
    if (kd === 'pine') addKit(rnd() < 0.35 ? 'tree_pine' : 'tree_pine_tall', x, Y, z, 3.6 + rnd() * 1.6, rnd() * 6);
    else addKit(['tree_oak', 'tree_fat', 'tree_fat', 'tree_autumn'][Math.floor(rnd() * 4)], x, Y, z, 3.6 + rnd() * 1.2, rnd() * 6);
  }
  if (R.hills) {
    const h = R.hills, st = low ? 70 : 48;
    for (let y2 = h.y + 30; y2 < h.y + h.h - 10; y2 += st) for (let x2 = h.x + 20; x2 < h.x + h.w; x2 += st) {
      const px = x2 + (rnd() - 0.5) * st * 0.8, py = y2 + (rnd() - 0.5) * st * 0.7, [x, z] = P(px, py); if (reg(px, py) !== 'hills' || !free(x, z, 3) || nearFall(x, z)) continue;
      addKit(rnd() < 0.3 ? 'tree_pine' : 'tree_pine_tall', x, Y, z, 3.8 + rnd() * 2.0, rnd() * 6);
      const r2 = rnd(), q = DG.follow(null); if (r2 < 0.15) q.push(new THREE.DodecahedronGeometry(0.7, 0), rnd() < 0.5 ? '#a9a297' : '#bdb6aa', x + 1.5, Y + 0.2, z + 1, rnd() * 6, 0, 0, 1.3, 0.7, 1); else if (r2 < 0.25) { q.cyl(0.35, 0.4, 0.45, x - 1.2, Y, z + 0.8, '#8a5a34', 7); q.cyl(0.33, 0.33, 0.02, x - 1.2, Y + 0.45, z + 0.8, '#e8c391', 7); } else if (r2 < 0.32) q.cyl(0.25, 0.25, 1.8, x + 1, Y + 0.25, z - 1, '#7a5230', 7, rnd() * 6, 0, Math.PI / 2); else if (r2 < 0.45) { q.cyl(0.05, 0.07, 0.25, x + 0.8, Y, z + 0.6, '#fbf1de', 5); q.push(new THREE.SphereGeometry(0.2, 6, 2, 0, 6.29, 0, Math.PI / 2), '#e8453c', x + 0.8, Y + 0.24, z + 0.6); }
    }
    // thác nước nhỏ: vách đá + dòng nước chảy (texture trượt) + hồ dưới chân thác
    const [wx, wz] = P(3915, -470);
    if (reg(3915, -470) === 'hills' && free(wx, wz, 4)) measure(HL, 'waterfall', () => {
      for (let i = 0; i < 14; i++) { const a = (i / 13) * Math.PI, rr = 4.2 + (i % 3) * 0.6; HL.push(new THREE.DodecahedronGeometry(1.6, 0), ['#a9a297', '#bdb6aa', '#948d84'][i % 3], wx + Math.cos(a) * rr, Y + 1.0 + (i % 4) * 1.1, wz - 1.5 - Math.sin(a) * rr * 0.5, i, 0, 0, 1.2, 1.3 + (i % 3) * 0.4, 1.0); }
      HL.box(5.0, 6.0, 3.0, wx, Y, wz - 3.6, '#a9a297'); for (let i = 0; i < 5; i++) HL.push(new THREE.DodecahedronGeometry(1.2, 0), '#948d84', wx - 2.4 + i * 1.2, Y + 6.0, wz - 3.2, i, 0, 0, 1, 0.6, 1);
      HL.push(new THREE.CircleGeometry(3.6, 16).rotateX(-Math.PI / 2), '#46c3d6', wx, Y + 0.06, wz + 1.2, 0, 0, 0, 1, 1, 0.7);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; HL.push(new THREE.DodecahedronGeometry(0.5, 0), '#bdb6aa', wx + Math.cos(a) * 3.7, Y + 0.12, wz + 1.2 + Math.sin(a) * 2.6, i, 0, 0, 1, 0.6, 1); }
      ctx.boxes.push({ x0: wx - 2.8, x1: wx + 2.8, z0: wz - 5.4, z1: wz - 1.6, top: Y + 6.5 });
    });
    if (reg(3915, -470) === 'hills') {
      const c = document.createElement('canvas'); c.width = 32; c.height = 128; const g2 = c.getContext('2d'); g2.fillStyle = '#7fd8ee'; g2.fillRect(0, 0, 32, 128);
      for (let i = 0; i < 40; i++) { g2.fillStyle = i % 3 ? '#e9fbff' : '#b6ecf8'; g2.fillRect((i * 7) % 32, (i * 37) % 128, 2 + (i % 3), 10 + (i * 13) % 24); }
      const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 1.5); tex.colorSpace = THREE.SRGBColorSpace;
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 6.2, 1, 4).translate(0, 3.1, 0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92 }));
      fall.position.set(wx, Y + 0.05, wz - 2.0); fall.rotation.x = -0.12; scene.add(fall);
      const foam = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.3, 10), new THREE.MeshBasicMaterial({ color: '#f2fdff', transparent: true, opacity: 0.8 })); foam.position.set(wx, Y + 0.12, wz - 1.6); foam.scale.z = 0.5; scene.add(foam);
      anim.push((t, p) => { if (Math.abs(p.x - wx) + Math.abs(p.z - wz) > 120) return; tex.offset.y = t * 1.2; foam.scale.y = 1 + Math.sin(t * 6) * 0.3; });
    }
  }

  // ---------- 6. HỒ KOI + LỀU TRẠI, KHU PICNIC, ĐẦM SEN ----------
  if (D.LAKE) {
    lake(LK, D.LAKE, 14, 3, 18);
    const [x, z] = P(D.LAKE.cx, D.LAKE.cy), rx = D.LAKE.rx * S, rz = D.LAKE.ry * S;
    // bến gỗ phía nam (đi được) + thuyền chèo + chòi lục giác phía bắc
    const dx = x + 3, y = Y + 0.3;
    if (free(dx, z + rz, 1.5)) { LK.box(2.0, 0.14, 5.0, dx, y - 0.14, z + rz - 1.6, '#a8743f'); for (let v = -2.3; v < 2.5; v += 0.5) LK.box(2.02, 0.03, 0.06, dx, y, z + rz - 1.6 + v, '#8a5a34'); for (const s of [-1, 1]) for (const v of [-2.3, 0, 2.3]) LK.cyl(0.1, 0.1, 0.9, dx + s * 0.95, Y - 0.4, z + rz - 1.6 + v, '#5a3a22', 6); ctx.decks.push({ x0: dx - 1, x1: dx + 1, z0: z + rz - 4.1, z1: z + rz + 0.9, y }); LK.group(dx + 2.2, Y + 0.06, z + rz - 3, 0.3, () => { LK.box(1.1, 0.35, 2.6, 0, 0, 0, '#d9683f'); LK.box(0.9, 0.06, 2.3, 0, 0.3, 0, '#b9824f'); LK.box(0.9, 0.08, 0.3, 0, 0.3, 0.2, '#8a5a34'); }); }
    const gx = x - rx * 0.2, gz = z - rz - 4.5;
    if (free(gx, gz, 3)) { LK.cyl(2.6, 2.6, 0.3, gx, Y, gz, '#d8cfbf', 6); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; LK.cyl(0.1, 0.12, 2.4, gx + Math.cos(a) * 2.2, Y + 0.3, gz + Math.sin(a) * 2.2, '#a8452a', 6); } LK.cone(3.2, 1.4, gx, Y + 2.7, gz, '#d9683f', 6); LK.cone(1.2, 0.8, gx, Y + 3.9, gz, '#b9502f', 6); LK.cyl(0.9, 0.9, 0.08, gx, Y + 0.7, gz, '#b9824f', 8); }
    // lều trại quanh hồ: lều kit + đống lửa + khúc gỗ ngồi + đèn lồng
    for (const [x2, y2, col] of D.TENTS) {
      const [tx, tz] = P(x2, y2); if (!free(tx, tz, 2)) continue; const face = Math.atan2(x - tx, z - tz);
      addKit('tent', tx, Y, tz, 3.0, face, col); const fx = tx + Math.sin(face) * 2.4, fz = tz + Math.cos(face) * 2.4;
      if (free(fx, fz, 1.2)) { addKit('campfire', fx, Y, fz, 2.2, 0); DG.cyl(0.2, 0.2, 1.4, fx + Math.cos(face) * 1.2, Y + 0.2, fz - Math.sin(face) * 1.2, '#7a5230', 6, face, 0, Math.PI / 2); DG.follow(null).glow(() => DG.cone(0.22, 0.5, fx, Y + 0.05, fz, '#ffb347', 5)); }
    }
  }
  if (R.picnic) {
    const r = R.picnic, [x0, z0] = P(r.x + 30, r.y + 30), [x1, z1] = P(r.x + r.w - 30, r.y + r.h - 30);
    measure(LK, 'picnic', () => { let i = 0; for (let x = x0; x <= x1; x += 4.2) for (let z = z0; z <= z1; z += 4.2, i++) { if (!free(x, z, 1.8)) continue; LK.group(x, Y, z, i * 0.4, () => { LK.box(1.8, 0.1, 0.8, 0, 0.72, 0, '#b9824f'); for (const s of [-1, 1]) { LK.box(1.8, 0.08, 0.3, 0, 0.42, s * 0.65, '#a8743f'); LK.box(0.1, 0.72, 1.4, s * 0.7, 0, 0, '#8a5a34'); } LK.cyl(0.03, 0.03, 2.2, 0, 0.72, 0, '#ffffff', 4); LK.cone(1.3, 0.5, 0, 2.6, 0, ['#e8453c', '#3d8fd9', '#f5c518'][i % 3], 8); const q = DG.follow(LK); q.box(0.9, 0.02, 0.5, 0, 0.82, 0, '#ffffff'); q.ball(0.12, -0.2, 0.9, 0, '#e8453c'); q.box(0.25, 0.2, 0.2, 0.3, 0.82, 0, '#c9a45c'); }); } });
  }
  if (D.LOTUS) {
    lake(LK, D.LOTUS, low ? 30 : 46, low ? 12 : 22, 0);
    const [x, z] = P(D.LOTUS.cx, D.LOTUS.cy), rx = D.LOTUS.rx * S, y = Y + 0.3;
    // cầu gỗ chữ chi qua đầm sen (đi được) + chòi nghỉ mái cong
    const segs = [[x - rx - 1, z - 1.5, x - rx * 0.3, z - 0.3], [x - rx * 0.3 - 1.2, z - 0.3, x - rx * 0.3, z + 2.2], [x - rx * 0.3 - 1.2, z + 1.0, x + rx * 0.4, z + 2.2], [x + rx * 0.4 - 1.2, z - 1.4, x + rx * 0.4, z + 2.2], [x + rx * 0.4 - 1.2, z - 1.4, x + rx + 1, z - 0.2]];
    if (segs.every(([a, b2, c, d2]) => free((a + c) / 2, (b2 + d2) / 2, 1))) measure(LK, 'lotus-bridge', () => {
      for (const [a, b2, c, d2] of segs) { LK.box(c - a, 0.14, d2 - b2, (a + c) / 2, y - 0.14, (b2 + d2) / 2, '#b9824f'); ctx.decks.push({ x0: a, x1: c, z0: b2, z1: d2, y }); for (const [u, v] of [[a, b2], [c, b2], [a, d2], [c, d2]]) { LK.box(0.1, 0.7, 0.1, u, y, v, '#a8452a'); LK.cyl(0.08, 0.08, 0.5, u, Y - 0.2, v, '#5a3a22', 5); } }
      const hx = x + rx + 3, hz = z - 0.8; LK.box(3.2, 0.3, 3.2, hx, Y, hz, '#d8cfbf'); for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) LK.cyl(0.1, 0.12, 2.3, hx + u * 1.3, Y + 0.3, hz + v * 1.3, '#a8452a', 6); LK.hip(4.2, 1.2, 4.2, hx, Y + 2.6, hz, '#b9502f'); for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) LK.cone(0.12, 0.6, hx + u * 2.0, Y + 2.45, hz + v * 2.0, '#e9b949', 4); LK.ball(0.2, hx, Y + 3.85, hz, '#e9b949');
    });
  }

  // ---------- 7. NÔNG TRẠI ----------
  if (R.farm) {
    const f = R.farm, b = B.farm, [fx0, fz0] = P(f.x, f.y), [fx1, fz1] = P(f.x + f.w, f.y + f.h), [bx, bz] = P(f.x + 100, f.y + 130);
    measure(b, 'barn', () => b.group(bx, Y, bz, 0, () => {   // chuồng đỏ mái 2 tầng dốc, viền trắng, cửa chữ X, gác cỏ, silo
      b.box(8, 3.2, 6, 0, 0, -3, '#c8443a'); b.box(8.1, 0.35, 6.1, 0, 0, -3, '#d8cfbf');
      for (const u of [-4, 4]) for (const v of [0, -6]) b.box(0.2, 3.2, 0.2, u, 0, v, '#fbf1de');
      b.prism(8.8, 1.2, 7.0, 0, 3.2, -3, '#6b4a2b'); b.prism(8.8 * 0.7, 1.6, 7.0 * 0.62, 0, 4.2, -3, '#5a3a22'); b.box(8.9, 0.12, 0.25, 0, 5.75, -3, '#3a3540');
      b.box(2.8, 2.7, 0.1, 0, 0, 0.02, '#fbf1de'); b.box(2.4, 2.4, 0.12, 0, 0.1, 0.05, '#9e3229'); for (const s of [-1, 1]) b.box(3.0, 0.14, 0.14, 0, 1.25, 0.1, '#fbf1de', 0, 0, s * 0.78);
      b.box(1.2, 1.0, 0.1, 0, 3.55, 0.45, '#fbf1de'); b.box(0.9, 0.75, 0.12, 0, 3.67, 0.48, '#9e3229'); b.box(1.3, 0.5, 0.6, 0, 3.4, 0.7, '#e8c45a');
      for (const s of [-1, 1]) { b.box(0.9, 0.8, 0.06, s * 2.6, 1.4, 0.03, '#fbf1de'); b.plane(0.7, 0.6, s * 2.6, 1.8, 0.07, '#4f86b8'); }
      b.cyl(1.3, 1.3, 6.5, 5.6, 0, -2.5, '#d8cfbf', 10); for (let y = 1; y < 6.4; y += 1.1) b.cyl(1.33, 1.33, 0.08, 5.6, y, -2.5, '#a9a297', 10); b.push(new THREE.SphereGeometry(1.35, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#3d7fd9', 5.6, 6.5, -2.5);
      for (let i = 0; i < 3; i++) b.cyl(0.55, 0.55, 1.1, -5 + i * 1.15, 0, 0.6, '#e8c45a', 8, 0, Math.PI / 2); b.cyl(0.55, 0.55, 1.1, -4.4, 1.0, 0.6, '#d9b44a', 8, 0, Math.PI / 2);
    }));
    ctx.boxes.push({ x0: bx - 4, x1: bx + 4, z0: bz - 6, z1: bz, top: Y + 4 }, { x0: bx + 4.3, x1: bx + 6.9, z0: bz - 3.8, z1: bz - 1.2, top: Y + 6.5 });
    addKit('tractor', bx - 7.5, Y, bz + 2.5, 1.5, 0.6); 
    // luống rau: đất vun + bắp cải, cà rốt, bí ngô, ngô; bù nhìn giữa ruộng
    const kinds = ['cabbage', 'carrot', 'pumpkin', 'corn', 'cabbage', 'tomato'];
    for (let r = 0; r < 6; r++) {
      const x0 = X3(f.x + 300), x1 = X3(f.x + 820), z = Z3(f.y + 70 + r * 58), kd = kinds[r]; if (!free((x0 + x1) / 2, z, 1)) continue;
      b.box(x1 - x0, 0.3, 1.3, (x0 + x1) / 2, Y, z, '#8a5a34'); b.box(x1 - x0 + 0.1, 0.06, 1.0, (x0 + x1) / 2, Y + 0.3, z, '#7a4a2a');
      const q = DG.follow(null);
      for (let x = x0 + 0.5, j = 0; x < x1 - 0.3; x += kd === 'pumpkin' ? 1.4 : 0.8, j++) {
        if (!free(x, z, 1.2)) continue;
        if (kd === 'pumpkin') { addKit('pumpkin', x, Y + 0.3, z, 2.0 + rnd() * 0.6, rnd() * 6); continue; }
        if (kd === 'carrot') { q.cone(0.12, 0.2, x, Y + 0.3, z, '#ff8a2b', 4); for (const s of [-1, 0, 1]) b.cone(0.1, 0.55, x + s * 0.1, Y + 0.42, z + s * 0.05, '#6fb85a', 3); continue; }
        if (kd === 'cabbage') { b.ball(0.3, x, Y + 0.48, z, j % 2 ? '#6fb85a' : '#8fcf6a', 1, 0.75, 1); q.ball(0.2, x + 0.05, Y + 0.6, z, '#b5e08a', 1, 0.7, 1); }
        else if (kd === 'corn') { b.cone(0.18, 1.6, x, Y + 0.3, z, '#6fb85a', 4); q.cone(0.12, 0.4, x + 0.12, Y + 1.0, z, '#f5c518', 4); }
        else if (kd === 'tomato') { b.box(0.05, 1.2, 0.05, x, Y + 0.3, z, '#8a5a34'); b.ball(0.38, x, Y + 0.85, z, '#4f9a4a', 1, 1.2, 1); q.ball(0.1, x + 0.2, Y + 0.75, z + 0.15, '#e8453c'); q.ball(0.1, x - 0.15, Y + 0.95, z + 0.1, '#e8453c'); }
        else q.cone(0.12, 0.4, x, Y + 0.3, z, '#6fb85a', 4);
      }
    }
    { const [sx, sz] = P(f.x + 560, f.y + 215); if (free(sx, sz, 1.5)) b.group(sx, Y, sz, 0.3, () => { b.box(0.12, 2.2, 0.12, 0, 0, 0, '#7a5230'); b.box(1.8, 0.1, 0.1, 0, 1.5, 0, '#7a5230'); b.box(0.8, 0.9, 0.4, 0, 1.0, 0, '#3d7fd9'); for (const s of [-1, 1]) b.box(0.7, 0.25, 0.25, s * 0.65, 1.45, 0, '#e8453c'); b.ball(0.32, 0, 2.15, 0, '#f3d6a8'); b.cone(0.6, 0.15, 0, 2.38, 0, '#e8c45a', 8); b.cone(0.3, 0.45, 0, 2.48, 0, '#e8c45a', 8); }); }
    // chuồng gà + gà, bãi cừu có máng nước
    const [cx, cz] = P(f.x + 240, f.y + 360);
    if (free(cx, cz, 3)) {
      b.group(cx, Y, cz, 0, () => { b.box(2.0, 1.2, 1.4, 0, 0.4, 0, '#c9a45c'); for (const u of [-0.9, 0.9]) for (const v of [-0.6, 0.6]) b.box(0.1, 0.4, 0.1, u, 0, v, '#7a5230'); b.prism(2.3, 0.7, 1.8, 0, 1.6, 0, '#b9502f'); b.box(0.12, 0.06, 0.9, 0.6, 0.2, 1.0, '#8a5a34', 0, 0.4); });
      for (let i = 0; i < (low ? 4 : 7); i++) { const a = rnd() * 6.28, r2 = 2 + rnd() * 2.5, hx = cx + Math.cos(a) * r2, hz = cz + Math.sin(a) * r2; b.group(hx, Y, hz, rnd() * 6, () => { const c = i % 3 ? '#ffffff' : '#c98a52'; b.pre.scale(new THREE.Vector3(1.5, 1.5, 1.5)); b.ball(0.24, 0, 0.32, 0, c, 1, 0.9, 1.25); b.ball(0.14, 0, 0.55, 0.22, c); b.cone(0.05, 0.12, 0, 0.53, 0.38, '#f5c518', 4); b.box(0.04, 0.1, 0.12, 0, 0.66, 0.22, '#e8453c'); b.cone(0.1, 0.22, 0, 0.36, -0.3, c, 4); for (const s of [-1, 1]) b.box(0.03, 0.2, 0.03, s * 0.08, 0, 0, '#f5c518'); }); }
    }
    const [shx, shz] = P(f.x + 140, f.y + 380);
    if (free(shx, shz, 3)) {
      b.box(2.4, 0.4, 0.6, shx + 2.5, Y, shz - 2.6, '#8a5a34'); b.box(2.2, 0.06, 0.45, shx + 2.5, Y + 0.38, shz - 2.6, '#46c3d6');
      for (let i = 0; i < (low ? 3 : 5); i++) { const hx = shx + (rnd() - 0.5) * 6, hz = shz + (rnd() - 0.5) * 4; b.group(hx, Y, hz, rnd() * 6, () => { b.ball(0.55, 0, 0.75, 0, '#fbf8f0', 1.1, 0.85, 1.3); for (let j = 0; j < 4; j++) b.ball(0.3, (j % 2 - 0.5) * 0.6, 1.05, (j < 2 ? -0.35 : 0.35), '#ffffff'); b.box(0.3, 0.32, 0.4, 0, 0.85, 0.7, '#3a3540'); for (const [u, v] of [[-0.25, -0.4], [0.25, -0.4], [-0.25, 0.4], [0.25, 0.4]]) b.box(0.1, 0.5, 0.1, u, 0, v, '#3a3540'); }); }
    }
    // hàng rào kit quanh trại, chừa cổng phía nam
    const gA = X3(4440), gB = X3(4800);
    // không rào: viền bằng cụm bụi cây thưa (thế giới mở) + cổng chào gỗ có mái lá
    const hedge = (ax, az, bx2, bz2) => { const L = Math.hypot(bx2 - ax, bz2 - az), n = Math.round(L / 3.2); for (let i = 0; i <= n; i++) { if (i % 5 === 4) continue; const t = i / n, x = ax + (bx2 - ax) * t, z = az + (bz2 - az) * t; if (free(x, z, 1.4)) addKit(i % 2 ? 'bush_large' : 'bush', x, Y, z, 4.2 + rnd(), rnd() * 6); } };
    hedge(fx0, fz0, fx1, fz0); hedge(fx0, fz0, fx0, fz1); hedge(fx1, fz0, fx1, fz1); hedge(fx0, fz1, gA - 1, fz1); hedge(gB + 1, fz1, fx1, fz1);
    for (const gx of [gA + 3, gB - 3]) b.cyl(0.18, 0.22, 2.6, gx, Y, fz1, '#6b4a2b', 7);
    b.box(gB - gA - 5.6, 0.3, 0.4, (gA + gB) / 2, Y + 2.6, fz1, '#6b4a2b'); b.prism(gB - gA - 5, 0.7, 1.2, (gA + gB) / 2, Y + 2.9, fz1, '#c9a45c');
    signAt(b, atlas.sign('NÔNG TRẠI', '#5a3a22', '#fff', '#e8c45a'), 3.2, 0.42, (gA + gB) / 2, Y + 2.2, fz1 + 0.22);
    // cối xay gió lớn góc đông bắc
    const [mx, mz] = P(f.x + f.w - 50, f.y + 60);
    if (free(mx, mz, 3)) {
      b.cyl(1.0, 1.7, 6.5, mx, Y, mz, '#fbf1de', 8); b.cyl(1.75, 1.75, 0.3, mx, Y, mz, '#a9a297', 8); b.cone(1.5, 1.8, mx, Y + 6.5, mz, '#b9502f', 8); b.box(0.9, 1.6, 0.1, mx, Y, mz + 1.62, '#8a5a34');
      ctx.boxes.push({ x0: mx - 1.6, x1: mx + 1.6, z0: mz - 1.6, z1: mz + 1.6, top: Y + 7 });
      blades(mx, Y + 5.9, mz + 1.75, 0, 3.4, -0.6);
    }
    { const q = DG.follow(null); for (let i = 0; i < 5; i++) q.box(0.7, 0.7, 0.7, bx - 4.9 - (i % 3) * 0.8, Y + (i > 2 ? 0.7 : 0), bz - 5.5, i % 2 ? '#b9824f' : '#a8743f', i * 0.3); }
  }

  if (typeof location !== 'undefined' && /debug/.test(location.search)) console.info('[zone-north] tam giác:', JSON.stringify(nb), 'kit:', Object.entries(kit).map(([n, l]) => n + ' ' + l.length).join(', '), '| hoa:', fl.length);
  // ---------- dựng instanced: model kit chia ô 80 m, hoa đồng (1 InstancedMesh / ô) ----------
  const SHADOW = { tree_oak: 1, tree_autumn: 1, tree_palm: 1, tent: 1, tractor: 1, house_suburb_p: 1, house_suburb_q: 1, house_suburb_n_warm: 1 }, _kc = new THREE.Color();
  // lọc lại lần cuối: nhà/vật cản đăng ký SAU khi trồng (vd. nhà nông trại) → bỏ cây/bụi trùng
  for (const [name, list] of Object.entries(kit)) { if (/^house_suburb/.test(name)) continue; const m = /^tree/.test(name) ? 1.2 : /^bush/.test(name) ? 0.9 : 0.4; for (let i = list.length - 1; i >= 0; i--) if (built(list[i][0], list[i][2], m)) list.splice(i, 1); }
  // cây/bụi → hệ thiên nhiên chung (terrain.nature: model CC0 Quaternius, 3 sắc, LOD gần/xa, lọc theo hướng camera); k: đổi tỷ lệ model cũ → mới
  const NAT = { tree_oak: ['oak', 1], tree_fat: ['fat', 1], tree_autumn: ['autumn', 1.22], tree_pine: ['pine', 1], tree_pine_tall: ['pineTall', 0.96], tree_palm: ['palm', 1], bush_large: ['bush', 1], bush: ['bush', 1] };
  for (const [name, m] of Object.entries(NAT)) if (kit[name]) { ctx.terrain.nature.add(m[0], kit[name].map(t => [t[0], t[1], t[2], t[3] * m[1], t[4]])); delete kit[name]; }
  for (const [name, list] of Object.entries(kit)) {
    const cells = new Map(); for (const t of list) { const key = Math.floor(t[0] / 160) + ',' + Math.floor(t[2] / 160); (cells.get(key) || cells.set(key, []).get(key)).push(t); }
    for (const l of cells.values()) placeKit(scene, name, l, { shadow: !!SHADOW[name] }).then(ims => { for (const im of ims) {   // tô lại màu kit theo bảng màu docs/art-style.md
      const mn = im.material.name, c = (KIT_COL[name] && KIT_COL[name][mn]) || KIT_COL['*'][mn]; if (!c && !l[0][5]) continue;
      im.material = im.material.clone(); if (c) im.material.color.set(c);
      if (l[0][5] && mn === 'colorRed') { im.material.color.set('#ffffff'); l.forEach((t, i) => im.setColorAt(i, _kc.set(t[5]))); }
    } });
  }
  if (fl.length) {
    const g = new THREE.ConeGeometry(0.19, 0.34, 5).rotateX(Math.PI).translate(0, 0.62, 0);   // bông tulip (chỉ phần hoa; lá = dải xanh của luống)
    const _o = new THREE.Object3D(), _c = new THREE.Color(), cells = new Map(); for (const q of fl) { const key = Math.floor(q[0] / 80) + ',' + Math.floor(q[1] / 80); (cells.get(key) || cells.set(key, []).get(key)).push(q); }
    const mB = toon('#ffffff');
    for (const l of cells.values()) {
      const im = new THREE.InstancedMesh(g, mB, l.length);
      l.forEach(([x, z, col, s], i) => { _o.position.set(x, Y, z); _o.rotation.set(0, x * 7, 0); _o.scale.setScalar(s); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); im.setColorAt(i, _c.set(col)); });
      im.computeBoundingSphere(); im.receiveShadow = true; scene.add(im);
    }
  }
  // cá Koi bơi vòng (1 InstancedMesh / hồ, chỉ cập nhật khi người chơi ở gần)
  if (koiSets.length) {
    const body = new THREE.IcosahedronGeometry(0.5, 0).scale(0.32, 0.2, 0.9), tail = new THREE.ConeGeometry(0.2, 0.35, 3).rotateX(-Math.PI / 2).scale(1, 0.4, 1).translate(0, 0, -0.55);
    for (const g of [body, tail]) g.deleteAttribute('uv');
    const geo = (() => { const a = body.toNonIndexed(), b = tail.toNonIndexed(); const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute([...a.attributes.position.array, ...b.attributes.position.array], 3)); m.computeVertexNormals(); return m; })();
    const _o = new THREE.Object3D(), _c = new THREE.Color(), mat = toon('#ffffff');
    for (const ks of koiSets) {
      const im = new THREE.InstancedMesh(geo, mat, ks.n), fish = [];
      for (let i = 0; i < ks.n; i++) { fish.push({ r: 0.3 + rnd() * 0.7, ph: rnd() * 6.28, v: (0.15 + rnd() * 0.2) * (i % 2 ? 1 : -1) }); im.setColorAt(i, _c.set(['#ff8a2b', '#ffffff', '#e8453c', '#f5c518'][i % 4])); }
      im.boundingSphere = new THREE.Sphere(new THREE.Vector3(ks.x, Y, ks.z), Math.max(ks.rx, ks.rz) + 1); scene.add(im);
      const upd = t => { for (let i = 0; i < ks.n; i++) { const q = fish[i], a = t * q.v + q.ph; _o.position.set(ks.x + Math.cos(a) * ks.rx * q.r, Y + 0.02, ks.z + Math.sin(a) * ks.rz * q.r); _o.rotation.set(0, Math.atan2(-Math.sin(a) * ks.rx * Math.sign(q.v), Math.cos(a) * ks.rz * Math.sign(q.v)) + Math.sin(t * 5 + i) * 0.15, 0); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); } im.instanceMatrix.needsUpdate = true; };
      upd(0); anim.push((t, p) => { if (Math.abs(p.x - ks.x) + Math.abs(p.z - ks.z) < 70) upd(t); });
    }
  }
  const pos = new THREE.Vector3();
  const plants = []; for (const [n, l] of Object.entries(kit)) if (/^tree|^bush/.test(n)) for (const [x, , z, sc] of l) plants.push([x, z, n.startsWith('bush') ? 0.15 * sc : 0.28 * sc, /pine/.test(n) ? 'pine' : n.startsWith('bush') ? 'bush' : 'leaf']);
  return { data: D, plants, update(p, t) { pos.copy(p); for (const f of anim) f(t, pos); } };
}
