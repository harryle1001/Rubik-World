// school-interior.js — TOÀ HỌC TẬP 3 TẦNG của Trường Rubik: đi qua cửa Văn phòng (mặt tiền giữ nguyên) là vào bên trong.
// Kỹ thuật "phòng trong túi": nội thất dựng ở vùng biển xa (ngoài tầm nhìn 296 m của đảo) → khi ở trong, đảo tự bị cắt khỏi
// khung hình (camera.far) nên chỉ vẽ đúng tầng đang đứng. Dựng LẦN ĐẦU khi bước vào cửa (không tốn gì lúc vào game), ra thì ẩn.
// - 3 tầng (cao φ²+φ⁻¹ ≈ 3,4 m/tầng), mỗi tầng 52 × 21 m: hành lang giữa rộng 5 m, phòng 13 × 8 m (13/8 ≈ φ) hai bên.
// - Cầu thang gấp khúc ở cuối hành lang: vế lên (làn A) tới chiếu nghỉ +1,7 m, bước sang làn B là sang tầng trên (đổi vị trí
//   liền mạch, cùng độ cao) — mỗi tầng là 1 bản riêng đặt cách nhau 144 m (Fibonacci), không cần va chạm theo độ cao.
// - Đồ đạc: model CC0 có sẵn trong kit/ (KayKit Furniture Bits; bàn ghế học sinh, nhạc cụ, xe đạp từ OpenGameArt CC0 — CREDITS.txt) qua placeKit
//   (1 draw call/loại/tầng); khối tự dựng (bục, giường, quầy, máy tính…) gộp vào 1 Batch/tầng; mọi chữ/bản đồ/tranh: 1 atlas/tầng.
// - Tường "cắt" quanh nhân vật (shader bỏ phần tường giữa camera và người chơi) → nhìn xuyên vào phòng như nhà búp bê, không trần.
// - Tiết học (lessons.js): roomAt()/boardOf() cho phòng trong toà; thầy cô đứng bảng, 13 bạn ngồi bàn khi đến tiết của phòng đó.
import * as THREE from 'three';
import { Batch } from './decor.js';
import { toon, gradientMap } from './style.js';
import { placeKit } from './kit.js';
import { loadHero, driveHero, STUDENTS, actorLod, stepAnim } from './characters.js';
import { PHI, TOWN_Y, to3 } from './layout.js';
import { PAL, shade } from './sample/palette.js';
import { LESSON } from './data/talk.js';
import { STAFF_DEF } from './data/people.js';

const PH = n => PAL[n].hex, SH = (n, k) => '#' + shade(n, k).getHexString();
const OX = 700, OZ = 700, GAP = 144, Y0 = TOWN_Y, FH = 3.4, W = 52, D = 21, WH = 3.0, T = 0.2;   // gốc túi, khoảng cách tầng, kích thước
const CZ0 = 8, CZ1 = 13;                                                     // hành lang z 8 → 13
const SX0 = 43.6, STEP = 0.28, RISE = 0.17, NSTEP = 10, RUN = STEP * NSTEP, LAND = 1.6, SX1 = SX0 + RUN + LAND;   // cầu thang
const LA = [8.2, 10.4], LB = [10.6, 12.8], MIDZ = 10.5;                   // làn A (lên), làn B (xuống)
const NF = 3, FLOOR_NAME = ['Tầng 1 · Sảnh, căng tin, thể chất', 'Tầng 2 · Các lớp học', 'Tầng 3 · Năng khiếu'];
const C = {
  wall: PH('stoneCream'), wallL: PH('stoneCreamL'), base: PH('stoneWarmD'), tile: PH('stoneWarmL'), tile2: PH('stoneWarm'), wood: PH('wood'), woodD: PH('woodD'),
  glass: PH('glass'), shutter: PH('shutter'), ink: PH('ink'), brass: PH('brass'), lamp: PH('lampGlow'), leaf: PH('leaf'), roof: PH('roof'), plaster: PH('plaster'),
  R: PH('rubikR'), G: PH('rubikG'), B: PH('rubikB'), Y: PH('rubikY'), O: PH('rubikO'), Wt: PH('rubikW'), board: SH('shutterD', 0.85), iron: PH('iron'), ironL: PH('ironL'),
  floorWood: SH('wood', 1.236), floorGym: SH('wood', 1.382), mint: '#cfe3d6',
};
// PHÒNG (toạ độ cục bộ của tầng: x 0 → 52 dọc hành lang, z 0 → 21; n = phía bắc z 0–8, s = phía nam z 13–21)
export const ROOMS = [
  { id: 'yte', f: 0, x0: 0, x1: 13, s: 'n', name: 'Phòng y tế', k: 'nurse' },
  { id: 'hieutruong', f: 0, x0: 13, x1: 26, s: 'n', name: 'Phòng Hiệu trưởng', k: 'principal' },
  { id: 'cangtin', f: 0, x0: 26, x1: 52, s: 'n', name: 'Căng tin', k: 'canteen' },
  { id: 'theduc', f: 0, x0: 0, x1: 26, s: 's', name: 'Nhà thể chất', k: 'gym' },
  { id: 'thuvien', f: 0, x0: 26, x1: 52, s: 's', name: 'Thư viện', k: 'library' },
  { id: 'p5a', f: 1, x0: 0, x1: 13, s: 'n', name: 'Lớp 5A', k: 'class' },
  { id: 'p5b', f: 1, x0: 13, x1: 26, s: 'n', name: 'Lớp 5B', k: 'class', geo: true },
  { id: 'plab', f: 1, x0: 26, x1: 39, s: 'n', name: 'Phòng thí nghiệm', k: 'lab' },
  { id: 'p4a', f: 1, x0: 39, x1: 52, s: 'n', name: 'Lớp 4A', k: 'class' },
  { id: 'p3a', f: 1, x0: 0, x1: 13, s: 's', name: 'Lớp 3A', k: 'class' },
  { id: 'p2a', f: 1, x0: 13, x1: 26, s: 's', name: 'Lớp 2A', k: 'class' },
  { id: 'p1a', f: 1, x0: 26, x1: 39, s: 's', name: 'Lớp 1A', k: 'class' },
  { id: 'pgv', f: 1, x0: 39, x1: 52, s: 's', name: 'Phòng giáo viên', k: 'staff' },
  { id: 'nhac', f: 2, x0: 0, x1: 26, s: 'n', name: 'Phòng âm nhạc', k: 'music' },
  { id: 'clb', f: 2, x0: 26, x1: 52, s: 'n', name: 'CLB Rubik & Cờ vua', k: 'club' },
  { id: 'mythuat', f: 2, x0: 0, x1: 26, s: 's', name: 'Phòng mỹ thuật', k: 'art' },
  { id: 'maytinh', f: 2, x0: 26, x1: 52, s: 's', name: 'Phòng máy tính', k: 'computer' },
];
for (const r of ROOMS) { r.z0 = r.s === 'n' ? 0 : CZ1; r.z1 = r.s === 'n' ? CZ0 : D; r.dx = r.x0 + 2.2; }   // cửa phòng: gần đầu phòng
const fx = f => OX + f * GAP, fy = f => Y0 + f * FH;

// ---------- Atlas chữ/tranh: 1 canvas 1024² mỗi tầng, xếp hàng ----------
function makeAtlas() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); let cx = 0, cy = 0, rh = 0;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const geos = [];
  return {
    // vẽ ô w×h px bằng draw(g, w, h) rồi đặt tấm phẳng rộng pw (m) tại (x,y,z) cục bộ, xoay ry
    add(w, h, draw, pw, x, y, z, ry = 0) {
      if (cx + w > 1024) { cx = 0; cy += rh; rh = 0; } if (cy + h > 1024) return;
      g.save(); g.translate(cx, cy); g.beginPath(); g.rect(0, 0, w, h); g.clip(); draw(g, w, h); g.restore();
      const pg = new THREE.PlaneGeometry(pw, pw * h / w), uv = pg.attributes.uv, u0 = cx / 1024, u1 = (cx + w) / 1024, v0 = 1 - (cy + h) / 1024, v1 = 1 - cy / 1024;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0);
      pg.rotateY(ry).translate(x, y, z); geos.push(pg); cx += w; rh = Math.max(rh, h);
    },
    mesh() { if (!geos.length) return null; const m = new THREE.Mesh(mergeGeos(geos), new THREE.MeshToonMaterial({ map: tex, gradientMap })); m.name = 'school-interior-text'; return m; },
  };
}
function mergeGeos(list) {   // gộp tấm phẳng (position/normal/uv) — tránh import thêm
  let n = 0; for (const g of list) n += g.index.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
  for (const g of list) { const I = g.index, p = g.attributes.position, q = g.attributes.normal, u = g.attributes.uv; for (let i = 0; i < I.count; i++, o++) { const k = I.getX(i); P.set([p.getX(k), p.getY(k), p.getZ(k)], o * 3); N.set([q.getX(k), q.getY(k), q.getZ(k)], o * 3); U.set([u.getX(k), u.getY(k)], o * 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); return g;
}
const plate = (txt, bg = '#3d2b3f', fg = '#f7efdc', font = 'bold 52px system-ui') => (g, w, h) => {
  g.fillStyle = PH('brass'); g.fillRect(0, 0, w, h); g.fillStyle = bg; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2, w - 24);
};
const chalk = (lines, title) => (g, w, h) => {
  g.fillStyle = '#24463a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a8784a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = '#f4f1e6'; g.textAlign = 'left'; g.font = 'bold 30px system-ui'; if (title) g.fillText(title, 24, 44);
  g.font = '26px system-ui'; lines.forEach((l, i) => g.fillText(l, 24, 88 + i * 34, w - 40));
};
// Bản đồ Việt Nam giản lược (kinh độ 101–117, vĩ độ 7–24) + Hoàng Sa, Trường Sa
const VN = [[102.1, 22.4], [103, 22.8], [104, 22.8], [105.3, 23.3], [106.5, 22.9], [106.7, 22.4], [107.9, 21.5], [106.7, 20.8], [106.1, 20], [105.8, 19.2], [106.4, 18.1], [107.1, 17], [108.2, 16.1], [108.9, 15.3], [109.2, 13.8], [109.4, 12.6], [109.2, 11.6], [108.4, 11.1], [107.2, 10.4], [106.7, 10.4], [106.8, 9.6], [105.1, 8.6], [104.8, 9], [105, 9.9], [104.5, 10.4], [105.1, 10.9], [106.2, 11], [106.4, 11.8], [107.5, 12.3], [107.6, 13.5], [107.5, 14.5], [107.4, 15.4], [106.6, 16.4], [105.6, 17.8], [105.1, 18.6], [103.9, 19.3], [104.6, 20.3], [103.2, 20.8], [102.8, 21.7]];
const vnMap = (g, w, h) => {
  const X = lo => (lo - 100.5) / 17 * w, Y = la => (24.5 - la) / 18 * h;
  g.fillStyle = '#9fd0e8'; g.fillRect(0, 0, w, h); g.strokeStyle = PH('woodD'); g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  g.fillStyle = '#f2d98a'; g.strokeStyle = '#7a5a2a'; g.lineWidth = 2; g.beginPath(); VN.forEach(([lo, la], i) => (i ? g.lineTo : g.moveTo).call(g, X(lo), Y(la))); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#7fbf5e'; g.beginPath(); g.arc(X(105.5), Y(21.5), 9, 0, 7); g.arc(X(108), Y(12.5), 8, 0, 7); g.fill();
  const dot = (lo, la, t, c = '#d8433a') => { g.fillStyle = c; g.beginPath(); g.arc(X(lo), Y(la), 4, 0, 7); g.fill(); g.fillStyle = PH('ink'); g.font = 'bold 13px system-ui'; g.fillText(t, X(lo) + 6, Y(la) + 4); };
  g.textAlign = 'left'; dot(105.85, 21.03, 'Hà Nội'); dot(107.6, 16.46, 'Huế', '#3d2b3f'); dot(108.2, 16.05, 'Đà Nẵng', '#3d2b3f'); dot(106.7, 10.8, 'TP.HCM');
  g.fillStyle = '#c45a3a'; for (const [lo, la] of [[111.6, 16.5], [112, 16.2], [112.3, 16.7], [113.8, 10], [114.3, 9.6], [114.8, 10.3], [115.2, 9.2]]) { g.beginPath(); g.arc(X(lo), Y(la), 2.5, 0, 7); g.fill(); }
  g.fillStyle = PH('ink'); g.font = 'bold 13px system-ui'; g.fillText('QĐ Hoàng Sa', X(110.6), Y(17.4)); g.fillText('QĐ Trường Sa', X(112.6), Y(11)); g.font = 'italic 14px system-ui'; g.fillText('Biển Đông', X(110.5), Y(14));
  g.font = 'bold 20px system-ui'; g.textAlign = 'center'; g.fillText('BẢN ĐỒ VIỆT NAM', w / 2, 26);
};
const poster = (bg, title, sub, icon) => (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = '#fff8'; g.fillRect(8, 8, w - 16, h - 16); g.fillStyle = PH('ink'); g.textAlign = 'center'; g.font = '64px system-ui'; g.fillText(icon, w / 2, h * 0.42); g.font = 'bold 22px system-ui'; g.fillText(title, w / 2, h * 0.68, w - 20); g.font = '16px system-ui'; g.fillText(sub, w / 2, h * 0.84, w - 20); };
const drawing = seed => (g, w, h) => {   // tranh thiếu nhi: trời, núi, nắng, nhà (màu Rubik)
  const r = k => ((Math.sin(seed * 9.1 + k * 7.7) + 1) / 2);
  g.fillStyle = '#f6f1e6'; g.fillRect(0, 0, w, h); g.fillStyle = ['#9fd0e8', '#f7d38a', '#c9e7b9'][seed % 3]; g.fillRect(10, 10, w - 20, h * 0.55);
  g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(w * (0.2 + 0.6 * r(1)), h * 0.25, 16, 0, 7); g.fill();
  g.fillStyle = ['#4f9a4a', '#2b63d9', '#8f4f8a'][seed % 3]; g.beginPath(); g.moveTo(10, h * 0.65); g.lineTo(w * 0.35, h * (0.25 + 0.2 * r(2))); g.lineTo(w * 0.7, h * 0.65); g.fill();
  g.fillStyle = '#7fbf5e'; g.fillRect(10, h * 0.62, w - 20, h * 0.3); g.fillStyle = '#d8433a'; g.fillRect(w * 0.6, h * 0.5, 40, 30); g.beginPath(); g.moveTo(w * 0.6 - 6, h * 0.5); g.lineTo(w * 0.6 + 20, h * 0.38); g.lineTo(w * 0.6 + 46, h * 0.5); g.fill();
};

// ---------- Vật liệu tường "cắt" quanh nhân vật ----------
function cutawayMat(U) {
  const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uP; uniform vec3 uC; varying vec3 vWP;')
      .replace('void main() {', 'void main() {\n  vec3 sd = uP - uC; float st = clamp(dot(vWP - uC, sd) / dot(sd, sd), 0.0, 1.0);\n  if (st < 0.96 && length(vWP - (uC + sd * st)) < 2.618 && vWP.y > uP.y - 0.9) discard;');
  };
  m.customProgramCacheKey = () => 'school-cutaway';
  return m;
}

export function createSchoolInterior(ctx) {
  const { scene } = ctx; ctx.boxes = ctx.boxes || []; ctx.decks = ctx.decks || [];
  const U = { uP: { value: new THREE.Vector3(0, -999, 0) }, uC: { value: new THREE.Vector3() } };
  const floors = [], wallMat = cutawayMat(U), vmat = toon('#ffffff', { vertexColors: true });
  let built = false, cur = -1, entry = null, msgT = 0; let staged = null;   // dàn cảnh cho clip mở đầu (intro.js)
  // cửa vào: cửa Văn phòng (bản đồ trường, mặt bắc) → toạ độ 3D lấy lúc trường dựng xong
  let door = null; const doorOut = () => { if (door) return door; const S = ctx.school, r = S && S.ready && S.RS && S.RS.R && S.RS.R.office; if (!r || !r.dw) return null; return (door = to3(r.dw[0], r.dw[1])); };

  // ===================== DỰNG 1 TẦNG =====================
  function buildFloor(f) {
    const g = new THREE.Group(); g.name = 'school-interior-' + f; g.position.set(fx(f), fy(f), OZ); g.visible = false; scene.add(g);
    const WB = new Batch('si-wall' + f), FB = new Batch('si-floor' + f), DB = new Batch('si-deco' + f), A = makeAtlas(), kits = {};
    const kit = (n, x, z, s = 1, ry = 0, y = 0) => (kits[n] = kits[n] || []).push([x, y, z, s, ry]);
    const X = x => fx(f) + x, Z = z => OZ + z, Yf = fy(f);
    const box = (x0, z0, x1, z1, top = WH) => ctx.boxes.push({ x0: X(x0), x1: X(x1), z0: Z(z0), z1: Z(z1), top: Yf + top });
    const deck = (x0, z0, x1, z1, y = 0) => ctx.decks.push({ x0: X(x0), x1: X(x1), z0: Z(z0), z1: Z(z1), y: Yf + y });
    const solid = (x, z, w, d, h) => box(x - w / 2, z - d / 2, x + w / 2, z + d / 2, h);
    // --- tường: chân đá sẫm 0,15 m, thân kem, gờ trên; va chạm đúng khối ---
    const wall = (x0, z0, x1, z1, gaps = []) => {   // tường thẳng (dọc x hoặc z) chừa các khe [a, b]
      const alongX = Math.abs(z1 - z0) < 1e-3, a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1, pts = [a0];
      for (const [a, b] of gaps.sort((p, q) => p[0] - q[0])) pts.push(a, b); pts.push(a1);
      for (let i = 0; i < pts.length; i += 2) {
        const s = pts[i], e = pts[i + 1]; if (e - s < 0.05) continue; const m = (s + e) / 2, L = e - s;
        if (alongX) { WB.box(L, WH, T, m, 0, z0, C.wall); WB.box(L + 0.02, 0.15, T + 0.04, m, 0, z0, C.base); WB.box(L + 0.02, 0.08, T + 0.06, m, WH - 0.08, z0, C.wallL); box(s, z0 - T / 2, e, z0 + T / 2); }
        else { WB.box(T, WH, L, x0, 0, m, C.wall); WB.box(T + 0.04, 0.15, L + 0.02, x0, 0, m, C.base); WB.box(T + 0.06, 0.08, L + 0.02, x0, WH - 0.08, m, C.wallL); box(x0 - T / 2, s, x0 + T / 2, e); }
      }
      for (const [a, b] of gaps) {   // khung cửa + dầm trên khe
        const m = (a + b) / 2, L = b - a;
        if (alongX) { WB.box(L, WH - 2.2, T, m, 2.2, z0, C.wall); for (const s of [a, b]) WB.box(0.1, 2.2, T + 0.08, s, 0, z0, C.woodD); WB.box(L + 0.2, 0.1, T + 0.08, m, 2.15, z0, C.woodD); }
        else { WB.box(T, WH - 2.2, L, x0, 2.2, m, C.wall); for (const s of [a, b]) WB.box(T + 0.08, 2.2, 0.1, x0, 0, s, C.woodD); WB.box(T + 0.08, 0.1, L + 0.2, x0, 2.15, m, C.woodD); }
      }
    };
    // tường ngoài + cửa sổ (kính sáng nhẹ, khung chớp xanh)
    wall(0, 0, W, 0); wall(0, D, W, D); wall(W, 0, W, D); wall(0, 0, 0, D, f === 0 ? [[9.4, 11.6]] : []);
    for (let x = 2.1; x < W - 1; x += PHI * PHI) for (const [z, s] of [[0.11, 1], [D - 0.11, -1]]) { DB.box(1.0, 1.3, 0.04, x, 1.0, z, C.glass); DB.box(1.12, 0.06, 0.08, x, 0.97, z, C.wallL); DB.box(0.06, 1.3, 0.06, x, 1.0, z + s * 0.02, C.shutter); for (const u of [-0.53, 0.53]) DB.box(0.05, 1.36, 0.08, x + u, 0.97, z, C.shutter); }
    // tường hành lang: khe cửa mỗi phòng (rộng 1,4 m ≈ 0,8·φ²/... cửa đôi); căng tin/thư viện/thể chất thêm cửa thứ 2
    const mine = ROOMS.filter(r => r.f === f), gapN = [], gapS = [];
    for (const r of mine) { const gs = r.s === 'n' ? gapN : gapS; gs.push([r.dx - 0.7, r.dx + 0.7]); if (r.x1 - r.x0 > 20) gs.push([r.x1 - 3.6, r.x1 - 2.2]); }
    wall(0, CZ0, W, CZ0, gapN); wall(0, CZ1, W, CZ1, gapS);
    for (const r of mine) if (r.x0 > 0) wall(r.x0, r.z0, r.x0, r.z1);
    // sàn: tấm sàn chung + mặt sàn theo phòng; hành lang gạch caro 2 màu (ô 1 m)
    if (f) { for (const [a, b, c, d] of [[0, 0, SX0, D], [SX1, 0, W, D], [SX0, 0, SX1, MIDZ], [SX0, LB[1], SX1, D]]) FB.box(c - a, 0.3, d - b, (a + c) / 2, -0.3, (b + d) / 2, C.base); }
    else FB.box(W, 0.3, D, W / 2, -0.3, D / 2, C.base);
    for (let x = 0; x < W; x++) for (let z = CZ0; z < CZ1; z++) if (!(x >= SX0 && x < SX1 && z >= LA[0] - 0.2)) FB.box(0.98, 0.02, 0.98, x + 0.5, 0, z + 0.5, (x + z) % 2 ? C.tile : C.tile2);
    for (const r of mine) {
      const col = { class: C.floorWood, library: C.floorWood, music: C.floorWood, club: C.floorWood, principal: C.floorWood, staff: C.floorWood, gym: C.floorGym, canteen: C.tile, nurse: C.mint, lab: C.tile, computer: SH('stoneWarmL', 0.9), art: C.tile }[r.k] || C.tile;
      FB.box(r.x1 - r.x0 - 0.2, 0.02, r.z1 - r.z0 - 0.2, (r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2, col);
      // biển tên phòng trên cửa, phía hành lang
      const zz = r.s === 'n' ? CZ0 + T / 2 + 0.02 : CZ1 - T / 2 - 0.02, ry = r.s === 'n' ? 0 : Math.PI;
      A.add(256, 64, plate(r.name, C.ink, '#f7efdc', 'bold 30px system-ui'), 1.6, r.dx, 2.5, zz, ry);
      furnish(r);
    }
    // sàn để đi (decks): cả tầng trừ ô cầu thang; sảnh ngoài cửa chính (tầng 1)
    deck(0, 0, SX0, D); deck(SX1, 0, W, D); deck(SX0, 0, SX1, LA[0] - 0.2); deck(SX0, LB[1] + 0.2, SX1, D);
    if (f === 0) { deck(-5, CZ0, 0, CZ1); FB.box(5, 0.3, 5, -2.5, -0.3, 10.5, C.tile2); A.add(256, 64, plate('TOÀ HỌC TẬP', C.R), 2.4, 0.13, 2.6, 10.5, Math.PI / 2); A.add(256, 64, plate('⬅ Ra sân trường', '#2c6455'), 1.4, 0.13, 2.6, 7.3 + 1.5, Math.PI / 2); }
    stairs(f, WB, FB, DB, A, kit, deck, box);
    // biển tầng trong hành lang
    A.add(512, 64, plate(FLOOR_NAME[f], '#2c6455', '#f7efdc', 'bold 34px system-ui'), 4.2, 6, 2.55, CZ0 + T / 2 + 0.02);
    // hành lang: chậu cây, ghế chờ, bảng tin, bình nước uống
    for (const x of [3.4, 16.4, 29.4]) { kit('furn_cactus_pot', x + 4.2, CZ1 - 0.6, 0.62); }
    kit('prop_bench', 21, CZ1 - 0.5, 1.2, Math.PI);
    DB.box(1.6, 1.0, 0.06, 34, 1.2, CZ1 - T / 2 - 0.04, C.wood); A.add(256, 160, poster('#f2c443', 'BẢNG TIN', 'Tuần này: Hội thi Rubik', '📌'), 1.4, 34, 1.7, CZ1 - T / 2 - 0.08, Math.PI);
    DB.cyl(0.22, 0.22, 0.9, 38.5, 0, CZ1 - 0.5, C.Wt, 8); DB.cyl(0.2, 0.2, 0.42, 38.5, 0.9, CZ1 - 0.5, C.glass, 8); solid(38.5, CZ1 - 0.5, 0.5, 0.5, 1.4);
    // void: hộp tối bao quanh tầng (che trời/biển, không cần trần)
    const vg = new THREE.Mesh(new THREE.BoxGeometry(W + 55, 21 + (f ? 2 : 0), D + 55), new THREE.MeshBasicMaterial({ color: '#3a3140', side: THREE.BackSide, fog: false }));
    vg.position.set(W / 2, 10.5 - 0.35 - (f ? 1 : 0), D / 2); vg.name = 'school-interior-void'; vg.userData.noCamOcc = true; g.add(vg);
    // xuất
    const add = (m, shadow, cut) => { if (!m) return; m.castShadow = shadow; m.receiveShadow = true; m.userData.noCamOcc = !!cut; g.add(m); };
    add(WB.mesh(wallMat, true), true, true); add(FB.mesh(vmat, false), false); add(DB.mesh(vmat, false), false); add(A.mesh(), false, true);
    const ready = Promise.all(Object.entries(kits).map(([n, l]) => placeKit(g, n, l, { shadow: false }).then(ms => ms.forEach(m => { m.userData.noCamOcc = true; m.receiveShadow = true; })))).catch(() => {});
    return { g, ready, seats: g.userData.seats || [] };

    // ===================== ĐỒ ĐẠC THEO LOẠI PHÒNG =====================
    function furnish(r) {
      const { x0, x1, z0, z1 } = r, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, wz = r.s === 'n' ? z0 + 0.12 : z1 - 0.12, wry = r.s === 'n' ? 0 : Math.PI;   // wz: tường ngoài (cửa sổ)
      const back = r.s === 'n' ? 1 : -1;   // hướng từ tường ngoài vào hành lang (z)
      const pics = (n, y = 1.7) => { for (let i = 0; i < n; i++) A.add(128, 128, drawing(i + r.id.length * 3 + f), 0.7, x0 + 2 + i * 1.3 * PHI, y, r.s === 'n' ? CZ0 - T / 2 - 0.02 : CZ1 + T / 2 + 0.02, r.s === 'n' ? Math.PI : 0); };
      if (r.k === 'class') {
        // bảng đen trên tường đầu lớp (x0), bục giảng, bàn cô; 4 dãy × 2 cột bàn đôi (16 chỗ), học sinh nhìn về −x
        const bx = x0 + 0.13; DB.box(0.06, 1.3, 3.4, bx, 0.95, cz, C.woodD); DB.box(0.08, 0.06, 3.5, bx + 0.05, 0.92, cz, C.wood);
        const subj = r.id === 'p5a' ? ['Toán: 3/5 + 1/5 = ?', '13 × 8 = 104', 'φ ≈ 1,618 · π ≈ 3,14'] : r.geo ? ['Địa lý: Việt Nam có', '63 tỉnh thành, bờ biển', 'dài 3.260 km.'] : r.id === 'p1a' ? ['Tập viết: a ă â b c', 'Bé đi học vui lắm!'] : ['Tiếng Việt:', 'Tìm từ chỉ sự vật', 'trong câu ca dao.'];
        A.add(512, 192, chalk(subj, r.name), 3.2, bx + 0.05, 1.6, cz, Math.PI / 2);
        FB.box(2.4, 0.15, 5, x0 + 1.4, 0, cz, C.woodD); solid(x0 + 1.4, cz, 2.4, 5, 0.15);
        kit('furn_table_small', x0 + 2.0, cz + 1.6, 0.8, Math.PI / 2, 0.15); kit('furn_chair_wood', x0 + 1.3, cz + 1.6, 0.66, Math.PI / 2, 0.15); kit('furn_book_set', x0 + 2.0, cz + 1.6, 0.5, 0.3, 0.95);
        r.board = [x0 + 0.5, 2.3, cz]; r.teach = [x0 + 1.6, cz - 0.4]; r.seats = [];
        for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
          const x = x0 + 4.4 + i * 2.1, z = cz + s * 1.75;
          kit('school_desk', x, z, 1, Math.PI / 2); solid(x, z, 0.55, 1.56, 0.75);
          for (const u of [-0.4, 0.4]) { kit('school_chair', x + 0.62, z + u, 1, -Math.PI / 2); r.seats.push([x + 0.62, z + u]); }
        }
        kit('furn_bookshelf_small', x1 - 0.5, z0 + 1.0 + (r.s === 'n' ? 5.4 : 0), 0.9, -Math.PI / 2); solid(x1 - 0.5, z0 + 1.0 + (r.s === 'n' ? 5.4 : 0), 0.6, 1, 1);
        kit('furn_cabinet', x1 - 0.55, cz + (r.s === 'n' ? -2.3 : 2.3), 0.7, -Math.PI / 2); solid(x1 - 0.55, cz + (r.s === 'n' ? -2.3 : 2.3), 0.8, 1.5, 0.75);
        if (r.geo) {   // bản đồ Việt Nam + quả địa cầu
          A.add(256, 320, vnMap, 1.9, x1 - 0.14, 1.45, cz - 0.2, -Math.PI / 2);
          const gx = x1 - 0.55, gz = cz + (r.s === 'n' ? -2.3 : 2.3);
          DB.cyl(0.14, 0.18, 0.05, gx, 0.75, gz, C.woodD, 8); DB.cyl(0.02, 0.02, 0.2, gx, 0.8, gz, C.brass, 5);
          DB.push(new THREE.SphereGeometry(0.26, 12, 8), C.B, gx, 1.22, gz, 0, 0, 0.41); DB.push(new THREE.TorusGeometry(0.29, 0.015, 4, 16, Math.PI), C.brass, gx, 1.22, gz, Math.PI / 2, 0, 0.41);
          for (const [a, b, s] of [[0.5, 0.3, 0.13], [2.3, -0.2, 0.11], [4, 0.5, 0.1], [5.2, -0.4, 0.09]]) DB.push(new THREE.IcosahedronGeometry(s, 0), C.G, gx + Math.cos(a) * 0.2, 1.22 + b * 0.4, gz + Math.sin(a) * 0.2, 0, 0, 0, 1, 0.55, 1);
        } else A.add(256, 320, poster('#c9e7b9', 'Năm điều Bác Hồ dạy', 'Yêu Tổ quốc, yêu đồng bào…', '⭐'), 1.3, x1 - 0.14, 1.55, cz - 0.2, -Math.PI / 2);
        A.add(128, 128, poster('#ffd23f', '', '', '🇻🇳'), 0.5, x0 + 0.14, 2.6, cz, Math.PI / 2);
        pics(4);
      } else if (r.k === 'lab') {
        // bàn thí nghiệm dài có bồn rửa, ống nghiệm, kính hiển vi; tủ hoá chất; bảng tuần hoàn
        const bx = x0 + 0.13; DB.box(0.06, 1.2, 3.0, bx, 1.0, cz, C.woodD); A.add(512, 192, chalk(['Nước sôi ở 100°C', 'Cây xanh nhả khí ôxi', 'Nam châm hút sắt'], 'Khoa học'), 2.8, bx + 0.05, 1.6, cz, Math.PI / 2);
        r.board = [x0 + 0.5, 2.3, cz]; r.teach = [x0 + 1.4, cz - 0.4]; r.seats = [];
        for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
          const x = x0 + 4.0 + i * 2.8, z = cz + s * 1.7;
          DB.box(0.9, 0.86, 2.2, x, 0, z, C.wallL); DB.box(1.0, 0.06, 2.3, x, 0.86, z, C.ink); DB.box(0.4, 0.05, 0.4, x, 0.9, z - 0.6, SH('glass', 0.7)); DB.cyl(0.02, 0.02, 0.3, x - 0.1, 0.92, z - 0.6, C.ironL, 5);
          for (let k = 0; k < 4; k++) DB.cyl(0.03, 0.03, 0.18, x + 0.2, 0.92, z + 0.1 + k * 0.1, [C.R, C.G, C.B, C.Y][k], 6);
          DB.box(0.12, 0.05, 0.16, x - 0.1, 0.92, z + 0.6, C.iron); DB.cyl(0.03, 0.04, 0.3, x - 0.1, 0.97, z + 0.6, C.iron, 6); DB.cyl(0.05, 0.05, 0.1, x - 0.1, 1.24, z + 0.6, C.iron, 6);
          solid(x, z, 1.0, 2.3, 0.9);
          for (const u of [-0.55, 0.55]) { kit('furn_stool', x + 0.8, z + u, 0.6); r.seats.push([x + 0.8, z + u, 0.32]); }
        }
        kit('furn_cabinet', x1 - 0.55, cz, 0.75, -Math.PI / 2); solid(x1 - 0.55, cz, 0.8, 1.5, 0.8);
        A.add(384, 256, (g, w, h) => { g.fillStyle = '#f6f1e6'; g.fillRect(0, 0, w, h); const cs = ['#d8433a', '#f2c443', '#7fbf5e', '#9fd0e8', '#b9905e']; for (let i = 0; i < 18; i++) for (let j = 0; j < 7; j++) if (j > 0 || i === 0 || i === 17) { g.fillStyle = cs[(i + j) % 5]; g.fillRect(8 + i * 20.5, 40 + j * 30, 18, 26); } g.fillStyle = PH('ink'); g.font = 'bold 22px system-ui'; g.textAlign = 'center'; g.fillText('BẢNG TUẦN HOÀN', w / 2, 28); }, 1.8, x1 - 0.14, 1.7, cz + (r.s === 'n' ? -2.4 : 2.4), -Math.PI / 2);
        DB.box(0.6, 1.8, 0.5, x1 - 0.5, 0, wz + back * 0.4, C.wallL); DB.box(0.5, 1.6, 0.04, x1 - 0.5, 0.1, wz + back * 0.66, C.glass);
      } else if (r.k === 'computer') {
        // 3 dãy bàn máy tính quay vào tường, màn chiếu
        A.add(512, 256, chalk(['Tin học: gõ 10 ngón', 'Lập trình kéo thả: lặp lại 4 lần → vẽ hình vuông'], 'Phòng máy tính'), 3.0, x0 + 0.14, 1.7, cz, Math.PI / 2);
        for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
          const x = x0 + 3.5 + i * 5.5, z = cz + s * 2.0;
          kit('furn_table_long', x, z, 0.75, 0); solid(x, z, 2.25, 1.5, 0.75);
          for (const u of [-0.65, 0.65]) {
            DB.box(0.56, 0.36, 0.04, x + u, 0.84, z - s * 0.35, C.ink); DB.box(0.5, 0.3, 0.02, x + u, 0.87, z - s * 0.33 + s * 0.02 * 0, SH('glass', 1.1)); DB.box(0.08, 0.1, 0.08, x + u, 0.75, z - s * 0.38, C.iron); DB.box(0.42, 0.02, 0.14, x + u, 0.76, z - s * 0.05, SH('stoneWarmL', 1.05));
            kit('furn_chair', x + u, z + s * 0.75, 0.6, s > 0 ? Math.PI : 0);
          }
        }
        DB.box(0.5, 0.5, 0.5, x1 - 0.5, 0, wz + back * 0.5, C.iron); DB.box(0.3, 0.02, 0.4, x1 - 0.5, 0.5, wz + back * 0.5, C.lamp);
      } else if (r.k === 'music') {
        // đàn piano, bộ trống, ghi-ta, kèn; ghế xếp vòng cung quay về đàn; khuông nhạc trên bảng
        A.add(512, 192, (g, w, h) => { chalk([], 'Âm nhạc: Quốc ca Việt Nam')(g, w, h); g.strokeStyle = '#f4f1e6'; g.lineWidth = 2; for (let s = 0; s < 2; s++) for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(24, 70 + s * 60 + i * 9); g.lineTo(w - 24, 70 + s * 60 + i * 9); g.stroke(); } g.font = '30px serif'; g.fillStyle = '#f4f1e6'; for (let i = 0; i < 12; i++) g.fillText('♪♩♫'[i % 3], 60 + i * 36, 96 + (i % 2) * 60 - (i * 7 % 13)); }, 3.2, x0 + 0.14, 1.6, cz, Math.PI / 2);
        const px = x0 + 2.0, pz = cz - 1.6;
        DB.box(1.5, 1.2, 0.6, px, 0, pz, C.ink); DB.box(1.5, 0.08, 0.32, px, 0.7, pz + 0.45, C.ink); DB.box(1.4, 0.03, 0.22, px, 0.78, pz + 0.48, C.Wt); for (let i = 0; i < 10; i++) DB.box(0.05, 0.02, 0.12, px - 0.6 + i * 0.13, 0.81, pz + 0.43, C.ink); DB.box(0.7, 0.45, 0.35, px, 0, pz + 0.95, C.woodD); solid(px, pz, 1.6, 0.7, 1.2);
        kit('music_drums', x0 + 2.2, cz + 2.0, 0.8, Math.PI / 2); solid(x0 + 2.2, cz + 2.0, 1.1, 1.5, 1);
        kit('music_guitar_classic', x1 - 0.4, wz + back * 0.6, 1.2, -Math.PI / 2, 0.6); kit('music_guitar_classic', x1 - 0.4, wz + back * 1.2, 1.2, -Math.PI / 2, 0.6);
        DB.box(0.5, 0.6, 1.8, x1 - 0.4, 0, wz + back * 0.9, C.woodD);
        kit('music_trumpet', x1 - 0.4, cz, 1.4, -Math.PI / 2, 0.75); kit('furn_table_small', x1 - 0.5, cz, 0.75);
        r.board = [x0 + 0.5, 2.3, cz]; r.teach = [x0 + 2.0, cz - 0.4]; r.seats = [];
        for (let i = 0; i < 13; i++) { const a = -0.9 + i * 0.15, rr = 6 + (i % 2) * 1.6, x = x0 + 1.5 + Math.cos(a) * rr, z = cz + Math.sin(a) * rr * 0.55; kit('furn_chair_wood_b', x, z, 0.6, Math.PI / 2 - a * 0.6); r.seats.push([x, z, 0.42]); }
        pics(3);
      } else if (r.k === 'art') {
        // giá vẽ, bàn màu, tranh học sinh treo kín tường, tượng thạch cao
        A.add(512, 192, chalk(['Vẽ tranh: Ngôi trường của em', 'Màu cơ bản: đỏ, vàng, lam'], 'Mỹ thuật'), 3.0, x0 + 0.14, 1.6, cz, Math.PI / 2);
        for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
          const x = x0 + 4 + i * 4.5, z = cz + s * 1.6;
          for (const [u, v] of [[0.38, 0.12], [-0.38, 0.12], [0, -0.3]]) DB.box(0.05, 1.6, 0.05, x + u, 0, z + v, C.wood, 0, u ? 0.1 * Math.sign(-v) : -0.25, -u * 0.15);
          DB.box(0.9, 0.04, 0.12, x, 0.8, z + 0.1, C.wood); DB.box(0.8, 0.62, 0.03, x, 0.85, z + 0.14, '#f6f1e6');
          A.add(128, 96, drawing(i * 2 + s + 9), 0.72, x, 1.16, z + 0.16 + (s < 0 ? 0 : 0), 0);
          kit('furn_stool', x, z - s * 0.7 + (s < 0 ? 0 : 0), 0.6);
        }
        kit('furn_table_long', cx + 6, wz + back * 1.3, 0.75); solid(cx + 6, wz + back * 1.3, 2.25, 1.5, 0.75);
        for (let k = 0; k < 6; k++) DB.cyl(0.06, 0.06, 0.12, cx + 5.3 + k * 0.28, 0.75, wz + back * 1.3, [C.R, C.O, C.Y, C.G, C.B, '#8f4f8a'][k], 6);
        DB.cyl(0.25, 0.3, 1.0, x0 + 2, 0, wz + back * 0.7, C.wallL, 8); DB.ball(0.22, x0 + 2, 1.25, wz + back * 0.7, C.wallL, 0.8, 1.1, 0.9);
        for (let i = 0; i < 8; i++) A.add(128, 96, drawing(i + 20), 0.9, x0 + 2.5 + i * 2.6, 1.9, r.s === 'n' ? CZ0 - T / 2 - 0.02 : CZ1 + T / 2 + 0.02, r.s === 'n' ? Math.PI : 0);
        r.board = [x0 + 0.5, 2.3, cz]; r.teach = [x0 + 1.6, cz]; r.seats = [];
      } else if (r.k === 'library') {
        // kệ sách dọc tường, bàn đọc tròn, thảm góc truyện tranh, quầy thủ thư
        for (let i = 0; i < 6; i++) { const x = x0 + 2.2 + i * 2.15; kit('furn_bookshelf_full', x, wz + back * 0.3, 1, wry, 0.1); kit('furn_bookshelf_full', x, wz + back * 0.3, 1, wry, 1.05); kit('furn_bookshelf', x, wz + back * 0.3, 1, wry, 1.95); DB.box(2.0, 2.5, 0.5, x, 0, wz + back * 0.3, C.woodD); }
        box(x0, Math.min(wz, wz + back * 0.6), x0 + 13.4, Math.max(wz, wz + back * 0.6), 2.5);
        for (let i = 0; i < 3; i++) { const x = x0 + 4 + i * 5, z = cz - back * 0.8; kit('furn_table_round', x, z, 0.55); solid(x, z, 1.5, 1.5, 0.6); for (let a = 0; a < 4; a++) kit('furn_chair_wood', x + Math.cos(a * Math.PI / 2) * 1.2, z + Math.sin(a * Math.PI / 2) * 1.2, 0.6, -a * Math.PI / 2 - Math.PI / 2); for (let k = 0; k < 2; k++) kit('furn_book_set', x - 0.3 + k * 0.6, z, 0.4, k * 1.3, 0.55); }
        kit('furn_rug', x1 - 5, cz, 1.2); for (let i = 0; i < 4; i++) kit('furn_armchair', x1 - 6.5 + i * 1.3, cz + back * 1.4, 0.55, back > 0 ? Math.PI : 0);
        kit('furn_shelf_big', x1 - 0.4, cz - back * 1.5, 1, -Math.PI / 2, 1.2); kit('furn_book_set', x1 - 2.5, cz - 0.5, 0.6, 0.4, 0);
        DB.box(2.4, 1.0, 0.7, x1 - 2.3, 0, z0 + (r.s === 'n' ? 1.5 : D - z0 - 1.5 + z0 - z0), C.wood);
        A.add(256, 64, plate('📚 Đọc sách mỗi ngày', '#2c6455', '#f7efdc', 'bold 26px system-ui'), 2.6, x1 - 0.14, 2.4, cz, -Math.PI / 2);
        kit('furn_lamp', x1 - 1, wz + back * 0.6, 0.7);
      } else if (r.k === 'canteen') {
        // quầy chia cơm, bàn ăn dài + ghế đẩu, khay, tủ lạnh, bồn rửa tay
        const qx = x1 - 6.5; DB.box(8, 0.95, 0.8, qx, 0, wz + back * 1.4, C.wallL); DB.box(8.1, 0.06, 0.9, qx, 0.95, wz + back * 1.4, SH('stoneWarm', 1.1));
        for (let k = 0; k < 6; k++) { DB.box(0.9, 0.12, 0.55, qx - 3.2 + k * 1.28, 1.0, wz + back * 1.4, C.ironL); DB.box(0.8, 0.04, 0.45, qx - 3.2 + k * 1.28, 1.1, wz + back * 1.4, [C.Y, C.G, C.O, '#f6f1e6', C.R, C.G][k]); }
        box(qx - 4, Math.min(wz + back * 1.0, wz + back * 1.8), qx + 4, Math.max(wz + back * 1.0, wz + back * 1.8), 1.0);
        DB.box(0.9, 2.0, 0.7, x1 - 0.6, 0, wz + back * 0.5, C.Wt); DB.box(0.04, 0.5, 0.04, x1 - 1.0, 1.2, wz + back * 0.88, C.iron);
        r.seats = [];
        for (let i = 0; i < 5; i++) for (const s of [0, 1]) {
          const x = x0 + 3 + i * 4.0, z = s ? cz + 1.3 : cz - 1.9; if (x > qx - 4.5 && !s) continue;
          kit('furn_kitchen_table', x, z, 0.7); solid(x, z, 1.4, 1.4, 0.7);
          for (const [u, v] of [[-0.95, 0], [0.95, 0]]) { kit('furn_stool', x + u, z + v, 0.6); r.seats.push([x + u, z + v, 0.32, u > 0 ? -Math.PI / 2 : Math.PI / 2]); }
          DB.box(0.36, 0.02, 0.26, x - 0.3, 0.7, z, C.ironL); DB.box(0.36, 0.02, 0.26, x + 0.3, 0.7, z + 0.2, C.ironL);
        }
        for (let k = 0; k < 3; k++) { DB.box(0.6, 0.85, 0.45, x0 + 1 + k * 0.8, 0, CZ0 - 0.4, C.Wt); DB.cyl(0.02, 0.02, 0.2, x0 + 1 + k * 0.8, 0.85, CZ0 - 0.35, C.ironL, 5); }
        A.add(512, 128, plate('🍚 Ăn chậm, nhai kỹ · Rửa tay trước khi ăn', '#2c6455', '#f7efdc', 'bold 30px system-ui'), 4.4, qx, 2.3, wz + back * 0.02, wry);
        A.add(256, 160, poster('#f7d38a', 'Thực đơn hôm nay', 'Cơm · canh rau · cá kho · chuối', '🍱'), 1.4, x0 + 0.14, 1.6, cz, Math.PI / 2);
      } else if (r.k === 'nurse') {
        for (let i = 0; i < 2; i++) { const x = x0 + 6 + i * 3.4, z = wz + back * 1.1; DB.box(0.9, 0.45, 2.0, x, 0, z, C.Wt); DB.box(0.95, 0.12, 2.05, x, 0.45, z, '#f6f1e6'); DB.box(0.7, 0.1, 0.4, x, 0.57, z - back * 0.75, C.Wt); DB.box(0.9, 0.04, 1.1, x, 0.58, z + back * 0.3, SH('glass', 1.1)); DB.box(0.05, 1.8, 0.05, x - 0.5, 0, z + back * 1.1, C.ironL); solid(x, z, 1, 2.1, 0.6); }
        kit('furn_table', x0 + 2.2, cz + back * 1.2, 0.6); kit('furn_chair', x0 + 1.4, cz + back * 1.2, 0.6, Math.PI / 2); solid(x0 + 2.2, cz + back * 1.2, 1.2, 1.2, 0.6);
        kit('furn_cabinet', x1 - 0.55, cz, 0.7, -Math.PI / 2); DB.box(0.4, 0.4, 0.04, x1 - 0.12, 1.4, cz, C.Wt); DB.box(0.24, 0.08, 0.05, x1 - 0.13, 1.56, cz, C.R); DB.box(0.08, 0.24, 0.05, x1 - 0.13, 1.48, cz, C.R);
        A.add(256, 160, poster('#cfe3d6', 'Rửa tay 6 bước', 'Phòng bệnh cho cả lớp', '🧼'), 1.3, x0 + 0.14, 1.6, cz, Math.PI / 2);
        DB.box(0.5, 1.6, 0.05, x0 + 4, 0, cz - back * 0.2, C.Wt); DB.box(0.05, 1.6, 0.4, x0 + 4.2, 0, cz - back * 0.2, C.Wt);
      } else if (r.k === 'principal') {
        kit('furn_table_long', cx, wz + back * 2.2, 0.75, 0); solid(cx, wz + back * 2.2, 2.25, 1.5, 0.75); kit('furn_armchair', cx, wz + back * 1.0, 0.55, r.s === 'n' ? 0 : Math.PI);
        kit('furn_couch', cx + 2.5, cz + back * 1.6, 0.6, r.s === 'n' ? Math.PI : 0); kit('furn_table_low', cx + 2.5, cz + back * 0.4, 0.6); solid(cx + 2.5, cz + back * 1.6, 1.8, 1, 0.75);
        for (let i = 0; i < 3; i++) { kit('furn_bookshelf_full', x0 + 1.3 + i * 2.1 + 6.5, wz + back * 0.3, 1, wry, 0.1); kit('furn_bookshelf_full', x0 + 7.8 + i * 2.1, wz + back * 0.3, 1, wry, 1.0); }
        for (let i = 0; i < 4; i++) kit('prop_trophy', x0 + 1.0 + i * 0.6, x0 === 13 ? wz + back * 0.4 : wz, 0.6, 0, 1.0);
        DB.box(3, 1.0, 0.5, x0 + 2.2, 0, wz + back * 0.35, C.woodD);
        A.add(256, 160, poster('#f7efdc', 'Học để biết · để làm', 'để chung sống · để tự khẳng định', '🎓'), 1.5, x0 + 0.14, 1.7, cz, Math.PI / 2);
        A.add(256, 64, plate('HIỆU TRƯỞNG', C.R), 1.1, cx, 0.9, wz + back * 2.98, wry);
        kit('furn_cactus_pot', x1 - 0.6, z0 + 0.8 + (r.s === 'n' ? 0 : 0), 0.7);
      } else if (r.k === 'staff') {
        kit('furn_table_long', cx - 1.6, cz, 0.75); kit('furn_table_long', cx + 0.7, cz, 0.75); solid(cx - 0.45, cz, 4.5, 1.5, 0.75);
        for (let i = 0; i < 6; i++) kit('furn_chair_wood', cx - 2.6 + (i % 3) * 1.6, cz + (i < 3 ? -1.0 : 1.0), 0.6, i < 3 ? 0 : Math.PI);
        kit('furn_cabinet', x1 - 0.55, cz, 0.75, -Math.PI / 2); for (let i = 0; i < 3; i++) kit('furn_book_set', cx - 2 + i * 1.6, cz, 0.45, i, 0.75);
        A.add(512, 192, chalk(['Thứ 2: chào cờ 7h00', 'Thứ 5: họp tổ chuyên môn', 'Thứ 7: Hội thi Rubik'], 'Lịch công tác'), 2.8, x0 + 0.14, 1.6, cz, Math.PI / 2);
      } else if (r.k === 'club') {
        for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
          const x = x0 + 4 + i * 5.6, z = cz + s * 1.7; kit('furn_table_small', x, z, 1.0); solid(x, z, 1, 1, 1);
          if ((i + s) % 2) { DB.box(0.62, 0.02, 0.62, x, 1.0, z, '#f6f1e6'); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if ((a + b) % 2) DB.box(0.15, 0.022, 0.15, x - 0.23 + a * 0.155, 1.0, z - 0.23 + b * 0.155, C.ink); DB.cyl(0.03, 0.04, 0.12, x - 0.1, 1.02, z, C.ink, 6); DB.cyl(0.03, 0.04, 0.12, x + 0.15, 1.02, z + 0.1, C.Wt, 6); }
          else for (let k = 0; k < 3; k++) { const c = [C.R, C.G, C.B, C.Y, C.O, C.Wt]; for (let a = 0; a < 3; a++) DB.box(0.07, 0.07, 0.07, x - 0.25 + k * 0.25 + (a % 2) * 0.072, 1.0 + Math.floor(a / 2) * 0.072, z - 0.1 + a * 0.03, c[(k + a + i) % 6]); }
          for (const u of [-0.8, 0.8]) kit('furn_stool', x + u, z, 0.6);
        }
        A.add(512, 192, chalk(['Kỷ lục lớp: 0:34 giây', 'Công thức: R U R′ U′', 'Cờ vua: kiểm soát trung tâm'], 'CLB Rubik & Cờ vua'), 3.0, x0 + 0.14, 1.6, cz, Math.PI / 2);
        kit('prop_trophy', x1 - 0.5, cz, 1.0, -Math.PI / 2, 0.75); kit('furn_table_small', x1 - 0.5, cz, 0.75);
      } else if (r.k === 'gym') {
        // sàn gỗ kẻ vạch bóng rổ mini, rổ hai đầu, nệm, ghế băng, kệ bóng
        const L = x1 - x0 - 2, Wd = z1 - z0 - 1.4, ly = 0.025;
        for (const [w, d, x, z] of [[L, 0.06, cx, z0 + 0.7], [L, 0.06, cx, z1 - 0.7], [0.06, Wd, x0 + 1, cz], [0.06, Wd, x1 - 1, cz], [0.06, Wd, cx, cz]]) FB.box(w, 0.01, d, x, ly, z, C.Wt);
        FB.push(new THREE.RingGeometry(1.1, 1.17, 24).rotateX(-Math.PI / 2), C.Wt, cx, ly + 0.01, cz);
        for (const s of [-1, 1]) { const hx = s < 0 ? x0 + 0.5 : x1 - 0.5; kit('sport_hoop', hx, cz, 0.8, s < 0 ? Math.PI / 2 : -Math.PI / 2); solid(hx, cz, 0.6, 1.2, 3); FB.push(new THREE.RingGeometry(1.8, 1.86, 16, 1, s < 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), C.Wt, hx, ly + 0.01, cz); }
        kit('sport_bench', cx - 4, wz + back * 0.6, 0.8); kit('sport_bench', cx + 4, wz + back * 0.6, 0.8);
        for (let i = 0; i < 3; i++) DB.box(1.0, 0.12, 2.0, x0 + 3 + i * 1.1, 0, CZ1 + 1.4 + (r.s === 's' ? 0 : -6), [C.B, C.R, C.B][i]);
        for (let i = 0; i < 5; i++) kit('sport_ball_basket', x1 - 3 + (i % 3) * 0.26, wz + back * 0.4, 1, 0, 0.12 + Math.floor(i / 3) * 0.25);
        DB.box(1.0, 0.6, 0.5, x1 - 2.75, 0, wz + back * 0.4, C.woodD);
        A.add(256, 64, plate('NHÀ THỂ CHẤT', C.B), 2.2, x0 + 0.14, 2.5, cz, Math.PI / 2);
        r.seats = [];
      }
    }
  }

  // ===================== CẦU THANG GẤP KHÚC =====================
  function stairs(f, WB, FB, DB, A, kit, deck, box) {
    const top = f === NF - 1, bottom = f === 0, wA = LA[1] - LA[0], wB = LB[1] - LB[0], mA = (LA[0] + LA[1]) / 2, mB = (LB[0] + LB[1]) / 2;
    for (let i = 0; i < NSTEP; i++) {
      const x = SX0 + (i + 0.5) * STEP;
      if (!top) { const y = (i + 1) * RISE; DB.box(STEP, y, wA, x, 0, mA, i % 2 ? C.tile : C.tile2); DB.box(STEP, 0.03, wA, x, y, mA, C.woodD); deck(x - STEP / 2, LA[0], x + STEP / 2, MIDZ, y); }
      if (!bottom) { const y = -(i + 1) * RISE; DB.box(STEP, 0.2, wB, x, y - 0.2, mB, i % 2 ? C.tile : C.tile2); DB.box(STEP, 0.03, wB, x, y, mB, C.woodD); deck(x - STEP / 2, MIDZ, x + STEP / 2, LB[1], y); }
    }
    const lx = SX0 + RUN + LAND / 2;
    if (!top) { DB.box(LAND, 1.7, wA + 0.1, lx, 0, mA, C.tile2); deck(SX0 + RUN, LA[0], SX1, MIDZ, 1.7); }
    if (!bottom) { DB.box(LAND, 0.2, wB + 0.1, lx, -1.9, mB, C.tile2); deck(SX0 + RUN, MIDZ, SX1, LB[1], -1.7); for (const [z, d] of [[LB[1] + 0.1, 0.2]]) DB.box(SX1 - SX0, 1.9, d, (SX0 + SX1) / 2, -1.9, z, C.wall); DB.box(0.2, 1.9, wB + 0.4, SX1 + 0.1, -1.9, mB, C.wall); DB.box(SX1 - SX0, 1.9, 0.2, (SX0 + SX1) / 2, -1.9, MIDZ, C.wall); }
    // lan can giữa 2 làn (dọc vế thang) + tay vịn; đầu tầng trên cùng chặn làn A, tầng 1 chặn làn B (kho dưới gầm)
    for (let x = SX0; x <= SX0 + RUN + 0.01; x += RUN / 4) DB.box(0.05, 1.0, 0.05, x, -1.0, MIDZ, C.iron);
    DB.box(RUN, 0.06, 0.08, SX0 + RUN / 2, 0.95, MIDZ, C.wood, 0, 0, 0); DB.box(RUN + 0.1, 0.4, 0.1, SX0 + RUN / 2, -0.4, MIDZ, C.iron);
    box(SX0, MIDZ - 0.08, SX0 + RUN, MIDZ + 0.08, 9);
    box(SX1, LA[0] - 0.2, SX1 + 0.3, LB[1] + 0.2, 9);   // tường cuối chiếu nghỉ
    WB.box(0.2, WH + 1.7, LB[1] - LA[0] + 0.4, SX1 + 0.1, -1.7, MIDZ, C.wall);
    if (top) { DB.box(RUN + LAND, 1.0, wA, SX0 + (RUN + LAND) / 2, 0, mA, C.woodD); box(SX0, LA[0], SX1, MIDZ - 0.08, 1.0); A.add(256, 64, plate('Sân thượng · sắp mở', C.ink), 1.6, SX0 - 0.02, 1.4, mA, -Math.PI / 2); }
    else A.add(256, 64, plate('⬆ Lên tầng ' + (f + 2), '#2c6455'), 1.6, SX0 - 0.02, 2.5, mA, -Math.PI / 2);
    if (bottom) { FB.box(RUN + LAND, 0.02, wB, SX0 + (RUN + LAND) / 2, 0, mB, C.tile); deck(SX0, MIDZ, SX1, LB[1], 0); kit('furn_cabinet', SX0 + 1.5, mB, 0.7, Math.PI / 2); kit('furn_cabinet', SX0 + 3.0, mB, 0.7, Math.PI / 2); box(SX0 + 0.8, LB[0], SX1, LB[1], 1.4); }
    else A.add(256, 64, plate('⬇ Xuống tầng ' + f, '#2c6455'), 1.6, SX0 - 0.02, 2.5, mB, -Math.PI / 2);
  }

  // ===================== HỌC SINH & THẦY CÔ TRONG TIẾT =====================
  const crew = { heroes: [], loading: false, room: null, mode: null };
  async function ensureCrew(n) {
    if (crew.loading || crew.heroes.length >= n) return; crew.loading = true;
    try {
      while (crew.heroes.length < n) {
        const i = crew.heroes.length, kind = i === 0 ? 'student-female-c' : STUDENTS[(i * 5) % STUDENTS.length];
        const h = await loadHero(kind, i === 0 ? 1.62 : 1.25, i === 0 ? { role: 'teacher' } : null); if (!h) break;
        h.npc = true; h.model.visible = false; scene.add(h.model); crew.heroes.push({ h, st: {} });
      }
    } finally { crew.loading = false; }
  }
  const teacherLook = name => { const s = STAFF_DEF.find(t => t.name === name); return s ? { role: 'teacher', shirt: s.shirt, pants: s.pants, aodai: !!s.aodai, skirt: !!s.skirt } : { role: 'teacher' }; };
  let teacherName = null;
  async function setTeacher(name) {
    if (teacherName === name || !crew.heroes[0]) return; teacherName = name;
    const h = await loadHero('student-female-c', 1.62, teacherLook(name)); if (!h) return;
    const old = crew.heroes[0].h; scene.remove(old.model); h.npc = true; scene.add(h.model); crew.heroes[0] = { h, st: {} }; placeCrew(crew.room, crew.mode);
  }
  function placeCrew(room, mode) {
    crew.room = room; crew.mode = mode;
    crew.heroes.forEach((e, i) => { e.h.model.visible = false; e.seat = null; });
    if (!room) return;
    const yb = fy(room.f), seats = room.seats || [];
    if (mode === 'lesson' && room.teach) {
      const t = crew.heroes[0]; if (t) { t.h.model.position.set(fx(room.f) + room.teach[0], yb + (room.k === 'class' ? 0.15 : 0), OZ + room.teach[1]); t.h.model.rotation.y = Math.PI / 2; t.h.model.visible = true; t.sit = false; }
    }
    // chừa ghế gần cửa cho người chơi; học sinh ngồi theo thứ tự còn lại
    const order = seats.map((s, i) => [s, i]).sort((a, b) => (a[0][0] - room.dx) ** 2 + (a[0][1] - (room.s === 'n' ? CZ0 : CZ1)) ** 2 - ((b[0][0] - room.dx) ** 2 + (b[0][1] - (room.s === 'n' ? CZ0 : CZ1)) ** 2)).slice(2);
    for (let i = 1; i < crew.heroes.length && i - 1 < order.length; i++) {
      const [s] = order[i - 1], e = crew.heroes[i]; e.sit = true;
      e.h.model.position.set(fx(room.f) + s[0], yb + (s[2] ?? 0.42) - 0.0, OZ + s[1]); e.h.model.rotation.y = s[3] ?? -Math.PI / 2; e.h.model.visible = true;
    }
  }
  const DV = { speed: 0, grounded: true, sitting: false };
  function updateCrew(dt) {   // LOD như người ngoài thị trấn: viền/bóng/animation thưa dần theo khoảng cách (characters.js)
    const p = ctx.player.pos;
    for (const e of crew.heroes) if (e.h.model.visible) {
      const m = e.h.model, dist = Math.hypot(m.position.x - p.x, m.position.z - p.z);
      DV.sitting = e.sit ? 'sit' : false; driveHero(e.h, DV); stepAnim(e.h.anim, e.an || (e.an = {}), dist, dt); actorLod(e.h, m, dist);
    }
  }

  // ===================== VÀO / RA / ĐỔI TẦNG =====================
  // dựng TỪNG TẦNG khi cần (bước qua cửa: tầng 1; các tầng còn lại dựng sẵn lúc rảnh, mỗi tầng 1 lượt → không khựng khi lên thang)
  function ensure(f) {
    if (floors[f]) return floors[f];
    const t0 = performance.now(); floors[f] = buildFloor(f); built = true;
    console.info('[SI] dựng tầng', f + 1, Math.round(performance.now() - t0), 'ms'); return floors[f];
  }
  const idle = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 600));
  function prebuild() { for (let f = 0; f < NF; f++) if (!floors[f]) { idle(() => { ensure(f); prebuild(); }); return; } }
  function show(f) { if (f >= 0) ensure(f); cur = f; floors.forEach((F, i) => { if (F) F.g.visible = i === f; }); ctx.indoor = f >= 0 ? { name: 'Toà học tập', floor: f } : null; }
  function enter() {
    ensure(0); const p = ctx.player; entry = doorOut();
    p.teleport(fx(0) - 1.5, OZ + MIDZ, fy(0)); p.cam.yaw = -Math.PI / 2; p.cam.pitch = Math.max(p.cam.pitch, 0.62); show(0);
    prebuild();
    ctx.toast && ctx.toast('🏫 <b>Toà học tập</b> · ' + FLOOR_NAME[0] + '<br><small>Cầu thang cuối hành lang lên tầng 2, 3.</small>', 3500); ctx.sfx && ctx.sfx('open');
  }
  function exit() {
    const p = ctx.player, e = entry || doorOut(); show(-1); placeCrew(null);
    if (e) { p.teleport(e[0], e[1] - 1.8, TOWN_Y); p.cam.yaw = 0; }
  }
  const inPocket = p => p.x > OX - 30 && p.x < fx(NF - 1) + W + 30 && p.z > OZ - 30 && p.z < OZ + D + 30;
  const floorOf = x => Math.max(0, Math.min(NF - 1, Math.round((x - OX - W / 2) / GAP)));
  function roomAt(x, z, y) {   // id phòng trong toà (hoặc 'corridor'), undefined nếu không ở trong toà
    if (!(x > OX - 30 && x < fx(NF - 1) + W + 30 && z > OZ - 30 && z < OZ + D + 30)) return undefined;
    const f = floorOf(x), lx = x - fx(f), lz = z - OZ;
    for (const r of ROOMS) if (r.f === f && lx > r.x0 && lx < r.x1 && lz > r.z0 && lz < r.z1) return r.id;
    return 'corridor';
  }
  function boardOf(id) { const r = ROOMS.find(q => q.id === id); if (!r) return null; const b = r.board || [r.x0 + 0.5, 2.3, (r.z0 + r.z1) / 2]; return new THREE.Vector3(fx(r.f) + b[0], fy(r.f) + b[1], OZ + b[2]); }

  let tick = 0, wantN = 0;
  function update(dt) {
    const p = ctx.player.pos;
    if (staged) { U.uP.value.set(p.x, p.y + 1.0, p.z); U.uC.value.copy(ctx.camera.position); updateCrew(dt); return; }
    if (cur < 0) {   // ngoài trời: bước qua cửa Văn phòng (mặt bắc) → vào toà
      const d = doorOut(); if (!d || ctx.player.vehicle) return;
      const dxp = p.x - d[0], dzp = p.z - d[1];
      if (Math.abs(dxp) < 1.2 && dzp > 0.1 && dzp < 1.6 && Math.abs(p.y - TOWN_Y) < 1.5) enter();
      else if (Math.abs(dxp) < 3 && dzp > -4 && dzp < 0.1) ctx.offer && ctx.offer('🏫 Vào Toà học tập (3 tầng)', enter, 1);
      return;
    }
    if (!inPocket(p)) { show(-1); placeCrew(null); return; }   // bị dịch chuyển đi nơi khác (bản đồ, nút Đến trường…)
    const f = floorOf(p.x), lx = p.x - fx(f), lz = p.z - OZ, yb = fy(f);
    if (f !== cur) show(f);
    // cầu thang: chiếu nghỉ làn A (+1,7) ↔ chiếu nghỉ làn B tầng trên (−1,7) — cùng độ cao, đổi bản tầng liền mạch
    if (lx > SX0 + RUN - 0.05 && lx < SX1 + 0.2) {
      if (lz > MIDZ && p.y > yb + 0.8 && f < NF - 1) { ctx.player.teleport(p.x + GAP, Math.max(p.z, OZ + MIDZ + 0.45), p.y); ctx.player.snapCamera(); show(f + 1); msg(f + 1); }
      else if (lz < MIDZ && p.y < yb - 0.8 && f > 0) { ctx.player.teleport(p.x - GAP, Math.min(p.z, OZ + MIDZ - 0.45), p.y); ctx.player.snapCamera(); show(f - 1); msg(f - 1); }
    }
    if (f === 0 && lx < -2.6) { exit(); return; }
    // tường cắt quanh nhân vật
    U.uP.value.set(p.x, p.y + 1.0, p.z); U.uC.value.copy(ctx.camera.position);
    // người trong toà: theo tiết học
    if ((tick -= dt) <= 0) {
      tick = 0.5;
      const c = ctx.lessons && ctx.lessons.now(), L = c && c.subj && LESSON[c.subj], room = L && ROOMS.find(r => r.id === L.room);
      const lunch = c && c.m >= 660 && c.m < 780, want = room && room.f === cur ? [room, 'lesson'] : lunch && cur === 0 ? [ROOMS.find(r => r.id === 'cangtin'), 'lunch'] : [null, null];
      wantN = want[0] ? 14 : 0; if (wantN) ensureCrew(wantN);
      if (L && L.teacher && want[1] === 'lesson') setTeacher(L.teacher);
      if (want[0] !== crew.room || want[1] !== crew.mode || crew.n !== crew.heroes.length) { crew.n = crew.heroes.length; placeCrew(want[0], want[1]); }
    }
    updateCrew(dt);
  }
  function msg(f) { if ((msgT = performance.now()) && ctx.toast) ctx.toast('🏫 ' + FLOOR_NAME[f], 2200); }

  // clip mở đầu: dựng 1 phòng có học sinh ngồi (không theo thời khoá biểu); stage(null) trả về bình thường
  async function stage(id, n = 8) {
    const room = id && ROOMS.find(r => r.id === id);
    if (!room) { staged = null; placeCrew(null); show(-1); return null; }
    staged = room; show(room.f); await ensureCrew(n); if (staged === room) placeCrew(room, 'intro');
    return { room, X: x => fx(room.f) + x, Y: fy(room.f), Z: z => OZ + z };
  }
  return { update, roomAt, boardOf, enter, exit, stage, ROOMS, get floor() { return cur; }, get built() { return built; }, floors };
}
