// zone-destiny.js — RỪNG THIÊN ĐỊNH: khu rừng ẩn trên khối núi đá ngoài vịnh bắc (bố cục + độ cao: destiny-plan.js; dữ liệu + giao diện: destiny-ui.js).
// LỐI MÒN BÍ MẬT (≈ 233 m từ bia khắc sau Đền): bia khắc đá + đom đóm đêm + câu đố cụ Rùa → 13 đá bước qua lạch → khe đá phủ dây leo (chuông gió)
//   → ngã ba Mặt Trời (la bàn: đi hướng Đông) → bãi sương (đi theo 6 đèn đá / tiếng chim, lạc thì sương đưa về) → ngã ba Rêu (rêu mọc mặt Bắc: đi hướng Nam)
//   → trảng cổ thụ → cầu khỉ vượt vực → hang đom đóm.
// THUNG LŨNG: cây Thiên Định phát sáng (gửi lời ước — lưu tài khoản), 5 bia danh ngôn, hồ gương, thác 3 tầng, đền đá rêu phong, vườn đá thiền,
//   ghế thiền hít thở 1 phút, hươu trắng, công, bướm phát sáng, đom đóm, tia nắng xuyên tán, 8 bí mật nhỏ, cổng đá dịch chuyển về Đền Tri Thức.
// Hiệu năng: mọi thứ tĩnh gộp 2 lưới (có/không bóng) + DetailGrid ô 34 m; cây/đá/bụi đi chung InstancedMesh của terrain (LOD sẵn, 0 draw call thêm);
//   bụi rậm · đá lát · dây leo · sương · tia nắng · bướm · lụa ước = mỗi loại 1 InstancedMesh; đom đóm = 1 Points; cả khu ẩn khi ở xa > 190 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, addOutline } from './style.js';
import { Batch, DetailGrid, detailMats } from './decor.js';
import { NATURE } from './terrain.js';
import { loadAnimated, animator } from './models.js';
import { CFG } from './config.js';
import { TEMPLE_C } from './layout.js';
import * as P from './destiny-plan.js';
import { createDestinyState, createDestinyUI, signAtlas, CELL, QUOTES, SECRETS, SIGN, TITLE, TITLE2 } from './destiny-ui.js';

const PHI = P.PHI, FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55], GOLD = Math.PI * (3 - Math.sqrt(5)), TAU = Math.PI * 2;
const [OX, OZ] = P.O, CEN = [-150, -287];                 // tâm cả khu (để bật/tắt theo khoảng cách)
const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
const polyD = (pts, x, z) => { let d = 1e9; for (let i = 1; i < pts.length; i++) d = Math.min(d, segD(x, z, pts[i - 1], pts[i])); return d; };
const FOGLINE = [P.FOG.in, ...P.LANTERNS, P.FOG.out];

export function createDestiny(ctx) {
  const { scene, terrain } = ctx, low = CFG.isMobile, H = (x, z) => terrain.heightAt(x, z);
  let seed = 610; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const st = createDestinyState(ctx), ui = createDestinyUI(ctx, st);
  const root = new THREE.Group(); root.name = 'destiny'; root.visible = false; scene.add(root);
  const out = new THREE.Group(); out.name = 'destiny-out'; scene.add(out);          // manh mối + cổng đá ở Rừng Thiền (đảo chính)
  const B = new Batch('dest'), G = new Batch('dest-ground'), DG = new DetailGrid('dest-detail', 34), BO = new Batch('dest-out');
  const col = (x, z, r) => ctx.colliders.push({ x, z, r, dst: 1 });
  const rock = (b, x, y, z, sx, sy, sz, ry = 0, c = '#a39c8d', rx = 0.2) => b.push(new THREE.IcosahedronGeometry(1, 0), c, x, y, z, ry, rx, 0.13, sx, sy, sz);
  const moss = (b, x, y, z, s, sy = 0.32) => b.push(new THREE.IcosahedronGeometry(1, 0), ['#6f9a52', '#5d8a48', '#84ad5e'][Math.floor(rnd() * 3)], x, y, z, rnd() * 6, 0, 0, s, s * sy, s * (0.7 + rnd() * 0.5));
  const nat = {}; const N = (kind, x, z, s, tint, dy = -0.08) => (nat[kind] = nat[kind] || []).push([x, H(x, z) + dy, z, s, rnd() * 6.28, tint]);
  const budget = {};

  // ---------- biển chữ (1 texture, 1 lưới trong khu + 1 lưới ngoài đảo chính) ----------
  const atlas = signAtlas(), signs = [], signsOut = [];
  function sign(list, i, x, y, z, w, h, ry, rx = 0) {
    const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv, [u0, v0, du, dv] = CELL(i), k = 0.012;
    for (let j = 0; j < uv.count; j++) uv.setXY(j, u0 + k + uv.getX(j) * (du - 2 * k), v0 + k + uv.getY(j) * (dv - 2 * k));
    g.rotateX(rx); g.rotateY(ry); g.translate(x, y, z); list.push(g);
  }
  // đá lát / đá bước: [x, y đáy, z, bán kính, dày, xoay, màu]
  const stones = [];
  const pathStones = (pts, gap = 1.25, r = 0.46, skip = null) => { let acc = gap, k = 0;
    for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L;
      for (let d = gap - acc; d < L; d += gap) { k++; const s = (k % 2 ? 1 : -1) * 0.2, x = ax + tx * d - tz * s, z = az + tz * d + tx * s; if (skip && skip(x, z)) continue;
        stones.push([x, H(x, z) - 0.07, z, r * [1, 0.786, 1.272][k % 3], 0.16, Math.atan2(tx, tz) + rnd(), FIB.includes(k % 21) ? '#86a868' : ['#b3ac9c', '#a59e8f', '#c0b8a8'][k % 3]]); }
      acc = (acc + L) % gap; } };
  // đèn đá (tōrō) cao s lần
  const lantern = (x, z, s = 1) => { const y = H(x, z) - 0.05, st1 = '#c9c2b2', st2 = '#b3ab9b';
    DG.cyl(0.3 * s, 0.36 * s, 0.18 * s, x, y, z, st2, 6); DG.cyl(0.11 * s, 0.13 * s, 0.62 * s, x, y + 0.18 * s, z, st1, 6); DG.cyl(0.3 * s, 0.26 * s, 0.1 * s, x, y + 0.8 * s, z, st2, 6);
    DG.glow(() => DG.box(0.3 * s, 0.28 * s, 0.3 * s, x, y + 0.9 * s, z, '#ffd36e', Math.PI / 4));
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) DG.box((a ? 0.06 : 0.36) * s, 0.3 * s, (b ? 0.06 : 0.36) * s, x + a * 0.17 * s, y + 0.89 * s, z + b * 0.17 * s, st1);
    DG.cone(0.45 * s, 0.3 * s, x, y + 1.18 * s, z, st2, 6); DG.ball(0.09 * s, x, y + 1.55 * s, z, st1); col(x, z, 0.35 * s); };

  // =====================================================================================
  // A. LỐI MÒN BÍ MẬT
  // =====================================================================================
  // ----- A1. 13 đá bước qua lạch (Fibonacci) -----
  { const [a, b] = P.STONES, n = 13;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), x = a[0] + (b[0] - a[0]) * t + (i % 2 ? 0.16 : -0.16), z = a[1] + (b[1] - a[1]) * t, r = 0.86 * [1, 0.9, 1.1][i % 3], y = 0.34;
      stones.push([x, y - 0.9, z, r, 0.9, i * 1.3, i % 5 === 2 ? '#86a868' : '#aaa393']);
      ctx.decks.push({ x0: x - 0.82, x1: x + 0.82, z0: z - 0.82, z1: z + 0.82, y }); } }
  // ----- A2. cửa khe: 2 phiến đá + đá gác ngang + rèm dây leo + chuông gió -----
  const vines = [];   // [x, y đỉnh, z, dài, xoay]
  { const mx = P.RAMP.x, mz = P.RAMP.z0 + 0.3;
    rock(B, mx - 5.0, 3.6, mz, 2.3, 5.2, 2.5, 0.4, '#9c9586'); rock(B, mx + 5.0, 3.7, mz, 2.4, 5.4, 2.3, 2.1, '#a8a192'); rock(B, mx, 8.6, mz - 0.8, 6.4, 1.5, 2.4, 0.2, '#9a9384');
    rock(B, mx - 6.6, 1.2, mz + 1.4, 1.5, 1.6, 1.4, 1, '#aaa393'); rock(B, mx + 6.8, 1.0, mz + 1.2, 1.6, 1.4, 1.5, 3, '#9c9586');
    moss(B, mx - 4.6, 8.7, mz, 1.5); moss(B, mx + 4.4, 9, mz - 0.4, 1.7); moss(B, mx, 10, mz - 0.9, 2.6);
    col(mx - 5.0, mz, 2.1); col(mx + 5.0, mz, 2.1); col(mx - 6.6, mz + 1.4, 1.3); col(mx + 6.8, mz + 1.2, 1.3);
    for (let i = 0; i < 21; i++) vines.push([mx - 3.5 + i * 0.35, 7.7 + (i % 3) * 0.25, mz + 0.5 - (i % 2) * 0.4, 5.6 + (i % 5) * 0.34, i]);           // rèm thật (đi xuyên qua được)
    for (const dx of [14.5, -11.5]) for (let i = 0; i < 8; i++) vines.push([mx + dx + i * 0.4, 7.2 + (i % 3) * 0.3, P.PLAT.z1 + 1.15 - (i % 2) * 0.3, 4.4 + (i % 4) * 0.4, i + 30]);   // 2 mảng dây leo giả trên vách
    // chuông gió treo dưới đá gác: 5 ống dài theo φ
    for (let i = 0; i < 5; i++) B.cyl(0.03, 0.03, 0.34 * Math.pow(PHI, i / 3), mx + 1.6 + (i - 2) * 0.09, 6.4 - 0.34 * Math.pow(PHI, i / 3), mz + 1.0 + (i % 2) * 0.07, '#d9c68a', 5);
    B.cyl(0.012, 0.012, 1.1, mx + 1.6, 6.4, mz + 1.03, '#6e5a3c', 4); B.cyl(0.16, 0.16, 0.03, mx + 1.6, 6.4, mz + 1.03, '#8a6a44', 8);
  }
  // ----- A3. khe dốc: đá rêu làm bậc + dương xỉ hai bên -----
  pathStones([[P.RAMP.x, P.RAMP.z0 - 0.6], [P.RAMP.x, P.RAMP.z1], [P.F1[0], P.F1[1] + 2]], 1.1, 0.5);
  for (let i = 0; i < 8; i++) { const z = P.RAMP.z0 - 1.5 - i * 1.6, s = i % 2 ? 1 : -1; N('fern', P.RAMP.x + s * 2.7, z, 0.9 + rnd() * 0.5); }

  // ----- A4. tường rừng rậm: bụi rậm (InstancedMesh) + cây + đá, mỗi 2,1 m một vật cản -----
  const thick = [];   // [x, y, z, s, ry, màu]
  { const seen = [], put = (x, z) => { for (const q of seen) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < 1.6) return; seen.push([x, z]); };
    for (const [x0, z0, x1, z1] of P.WALLS) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.1)); for (let i = 0; i <= n; i++) put(x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n); }
    const TINT = ['#3f8a45', '#4f9a4a', '#357a4c', '#5a9f4c', '#2f7a52'], edge = (x, z) => P.platDist(x, z) > -2.4;
    seen.forEach(([x, z], i) => { col(x, z, 1.3);
      thick.push([x + (rnd() - 0.5) * 0.5, H(x, z) - 0.25, z + (rnd() - 0.5) * 0.5, 1.05 + rnd() * 0.4, rnd() * 6.28, TINT[i % 5]]);
      if (edge(x, z) && i % 3 === 0 && polyD(P.TRAIL, x, z) > 5.5) N(['round', 'fat', 'oak'][i % 3], x + (rnd() - 0.5), z + (rnd() - 0.5), 9 + rnd() * 4, TINT[(i + 2) % 5]);   // cây chỉ ở viền ngoài, xa lối đi (không che camera)
      else if (i % 4 === 1) N('fern', x + (rnd() - 0.5) * 1.6, z + (rnd() - 0.5) * 1.6, 1.2 + rnd() * 0.5);
      else if (i % 7 === 3) N('rockL', x, z, 2.2 + rnd(), '#a9a297', 0.1); });
    budget.wall = seen.length;
  }
  // ----- A5. rừng lấp chỗ trống trên cao nguyên (không mọc trên lối đi, thưa trong bãi sương) -----
  { const inFog = (x, z) => x > P.FOG.x0 && x < P.FOG.x1 && z > P.FOG.z0 - 9 && z < P.FOG.z1;
    let n = 0, tries = 0; const want = low ? 13 : 21;
    while (n < want && tries++ < 900) { const x = P.PLAT.x0 + 3 + rnd() * (P.PLAT.x1 - P.PLAT.x0 - 6), z = P.PLAT.z0 + 3 + rnd() * (P.PLAT.z1 - P.PLAT.z0 - 6);
      if (polyD(P.TRAIL, x, z) < 6.5 || (inFog(x, z) && polyD(FOGLINE, x, z) < 7.5) || P.MIST.some(m => Math.hypot(m[0] - x, m[1] - z) < 4) || Math.abs(x - P.RAMP.x) < 5 && z > P.RAMP.z1 - 2) continue;
      N(['oak', 'round'][n % 2], x, z, 21 + rnd() * 5, ['#3f8a45', '#357a4c', '#2f7a45'][n % 3]); col(x, z, 1.1); n++; }   // cổ thụ 21–26 m: tán thành mái rừng trên đầu
    for (let i = 0; i < (low ? 34 : 55); i++) { const x = P.PLAT.x0 + 3 + rnd() * (P.PLAT.x1 - P.PLAT.x0 - 6), z = P.PLAT.z0 + 3 + rnd() * (P.PLAT.z1 - P.PLAT.z0 - 6); if (polyD(P.TRAIL, x, z) < 1.3) continue; N(['fern', 'fern', 'bush', 'mushrooms', 'flowers'][i % 5], x, z, 0.8 + rnd() * 0.7, i % 5 === 4 ? '#c9a3ff' : undefined); } }

  // ----- A6. hai ngã ba đố hướng: biển đá + la bàn đá; ngã ba 2 có 4 thân cây rêu mặt Bắc -----
  const board = (i, x, z, ry) => { const y = H(x, z); rock(B, x, y + 0.9, z, 1.15, 1.3, 0.42, ry, '#b3ad9c', 0); sign(signs, i, x + Math.sin(ry) * 0.44, y + 1.15, z + Math.cos(ry) * 0.44, 1.5, 1.5, ry); col(x, z, 0.8); };
  const compass = (x, z) => { const y = H(x, z) + 0.05; G.cyl(1.42, 1.5, 0.1, x, y - 0.07, z, '#aaa491', 13); sign(signs, 2, x, y + 0.045, z, 2.6, 2.6, 0, -Math.PI / 2); };
  board(0, P.F1[0] + 2.5, P.F1[1] - 2.7, -2.4); compass(...P.F1);
  board(1, P.F2[0] - 2.6, P.F2[1] - 2.7, 2.4); compass(...P.F2);
  for (const [dx, dz] of [[2.9, 2.6], [-2.9, 2.6], [2.9, -3.1], [-1.2, -3.2]]) { const x = P.F2[0] + dx, z = P.F2[1] + dz, y = H(x, z);
    B.cyl(0.5, 0.66, 8.5, x, y - 0.2, z, '#6e5238', 8); col(x, z, 0.8); N('round', x, z, 19, '#357a4c');
    for (let k = 0; k < 8; k++) moss(B, x + (rnd() - 0.5) * 0.5, y + 0.4 + k * 0.62, z - 0.6, 0.4 + rnd() * 0.16, 0.9); }   // rêu chỉ ở mặt bắc (−z)
  // nhánh đúng có lối đá mờ; nhánh sai cũng có vài viên để không lộ đáp án
  pathStones([P.F1, [P.F1[0] + 4.4, P.F1[1]], P.FOG.in], 1.2); pathStones([P.F1, [P.F1[0], P.F1[1] - 7]], 1.2); pathStones([P.F1, [P.F1[0] - 7, P.F1[1]]], 1.2);
  pathStones([P.FOG.out, P.F2, [P.F2[0], P.F2[1] + 6], [-113, -299], [-119, -297], P.BRIDGE[0]], 1.2); pathStones([P.F2, [P.F2[0], P.F2[1] - 7]], 1.2); pathStones([P.F2, [P.F2[0] - 7.5, P.F2[1]]], 1.2);
  // ----- A7. bãi sương: 6 đèn đá dẫn đường + đá lát thưa -----
  for (const [x, z] of P.LANTERNS) lantern(x, z, 1.3);
  pathStones(FOGLINE, 2.1, 0.4);
  // ----- A8. trảng cổ thụ trước cầu: 3 cây khổng lồ, gốc cây có vòng năm (bí mật), khúc gỗ, nấm -----
  for (const [x, z, s] of [[-121.5, -301.5, 28], [-110.5, -293.5, 24], [-121, -286.5, 26]]) { N('oak', x, z, s, '#2f7a45'); col(x, z, 1.5); for (let k = 0; k < 5; k++) N('fern', x + Math.cos(k * GOLD) * 2.2, z + Math.sin(k * GOLD) * 2.2, 1.1); }
  const STUMP = [-116.5, -293.2];
  { const [x, z] = STUMP, y = H(x, z); B.cyl(0.95, 1.15, 0.7, x, y - 0.1, z, '#7a5a3c', 9); for (let k = 0; k < 4; k++) G.cyl(0.9 - k * 0.2, 0.9 - k * 0.2, 0.012, x, y + 0.6 + k * 0.006, z, k % 2 ? '#c9a77a' : '#b08a5c', 13); col(x, z, 1.1); N('mushrooms', x + 1.3, z + 0.4, 1.2); N('log', -112, -300.5, 2.4, undefined); col(-112, -300.5, 0.9); }

  // ----- A9. cầu khỉ: 2 thân tre để đi + tay vịn, chân chống chữ X cắm xuống vực -----
  { const [[ax, az], [bx]] = P.BRIDGE, L = ax - bx, n = 21, sag = 0.45, yA = P.PLAT.y, Y = t => yA - sag * Math.sin(Math.PI * t), bam = '#b7a14f', bamD = '#8f7d3a';
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, x = ax - L * (t0 + t1) / 2, y = (Y(t0) + Y(t1)) / 2, len = L / n + 0.03, pitch = Math.atan2(Y(t0) - Y(t1), L / n);
      for (const s of [-0.13, 0.13]) B.cyl(0.11, 0.11, len, x, y - 0.12 - len / 2, az + s, i % 2 ? bam : bamD, 6, 0, 0, Math.PI / 2 + pitch);
      B.cyl(0.05, 0.05, len, x, y + 0.98 - len / 2, az - 0.55, bamD, 5, 0, 0, Math.PI / 2 + pitch);       // tay vịn tre (bờ bắc)
      B.cyl(0.03, 0.03, len, x, y + 0.9 - len / 2, az + 0.55, '#7a6a4a', 4, 0, 0, Math.PI / 2 + pitch);   // dây thừng (bờ nam)
      ctx.decks.push({ x0: x - len / 2 - 0.05, x1: x + len / 2 + 0.05, z0: az - 0.42, z1: az + 0.42, y: y + 0.02 });
      if (i % 3 === 0) for (const s of [-0.55, 0.55]) B.cyl(0.04, 0.04, 1.1, x, y - 0.1, az + s, bamD, 5);
      for (const s of [-0.62, 0.62]) col(x, az + s, 0.2); }
    for (const t of [0.24, 0.5, 0.76]) { const x = ax - L * t, y = Y(t); for (const s of [-1, 1]) B.cyl(0.09, 0.11, 13.5, x, y - 12.4, az + s * 2.1, bam, 6, 0, -s * 0.31, 0); }   // chân chống chéo
    for (const x of [ax + 0.3, bx - 0.3]) for (const s of [-0.75, 0.75]) { B.cyl(0.1, 0.12, 1.7, x, yA - 0.2, az + s, bamD, 6); col(x, az + s, 0.28); }
    budget.bridge = n; }

  // ----- A10. hang đom đóm: ống đá xù xì nằm trong khe vách, đá tảng lấp phía trên -----
  let caveMesh;
  { const x0 = -139.4, x1 = -151, cz = P.CAVE.z, RN = 8, AN = 9, pos = [], cols = [], cA = new THREE.Color('#5e554a'), cB = new THREE.Color('#473f38'), cM = new THREE.Color('#566b45'), c = new THREE.Color();
    const fy = x => P.CAVE.y1 + (P.CAVE.y0 - P.CAVE.y1) * Math.max(0, Math.min(1, (x - P.CAVE.x1) / (P.CAVE.x0 - 2 - P.CAVE.x1)));
    const hsh = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
    const pt = (i, j) => { const x = x0 + (x1 - x0) * i / (RN - 1), a = Math.PI * j / (AN - 1), k = 1 + (hsh(i, j) - 0.5) * 0.3, e = (i === 0 || i === RN - 1) ? 1.12 : 1;
      return [x + (hsh(j, i) - 0.5) * 0.7, fy(x) - 0.4 + Math.sin(a) * 4.0 * k * e, cz + Math.cos(a) * 3.35 * k * e]; };
    for (let i = 0; i < RN - 1; i++) for (let j = 0; j < AN - 1; j++) { const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
      for (const tri of [[0, 1, 2], [0, 2, 3]]) { c.copy(cA).lerp(cB, hsh(i * 3 + tri[1], j * 5)).lerp(cM, j > 2 && j < 6 ? 0.25 * hsh(i, j + 9) : 0); for (const v of tri) { pos.push(...q[v]); cols.push(c.r, c.g, c.b); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
    caveMesh = new THREE.Mesh(g, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide, unique: true })); caveMesh.name = 'dest-cave'; caveMesh.castShadow = true; caveMesh.receiveShadow = true; root.add(caveMesh);
    for (let i = 0; i < 6; i++) { const xa = x0 + 0.6 + (x1 - x0 - 1.2) * i / 6, xb = x0 + 0.6 + (x1 - x0 - 1.2) * (i + 1) / 6, xm = (xa + xb) / 2, len = Math.hypot(xb - xa, fy(xb) - fy(xa)) + 0.12;
      G.box(len, 0.1, 6.9, xm, Math.max(fy(xm), H(xm, cz)) + 0.02, cz, i % 2 ? '#5b5349' : '#544c43', 0, 0, Math.atan2(fy(xb) - fy(xa), xb - xa));
      ctx.decks.push({ x0: xb - 0.1, x1: xa + 0.1, z0: cz - 3.1, z1: cz + 3.1, y: fy(xm) + 0.06 }); }   // nền đá tối (che cỏ) + mặt đi riêng: không phụ thuộc độ mịn lưới địa hình (điện thoại lưới 2,8 m)
    // đá tảng lấp khe phía trên ống + viền 2 miệng hang
    for (let i = 0; i < 6; i++) { const x = x0 - 1 - i * 2.0; rock(B, x, fy(x) + 5.4 + (i % 2) * 0.8, cz + (i % 3 - 1) * 1.9, 3.2 + (i % 2), 2.3, 4.3, i * 1.1, i % 2 ? '#9c9586' : '#8f887a'); moss(B, x, fy(x) + 7.6 + (i % 2) * 0.8, cz + (i % 3 - 1) * 1.2, 2.2); }
    for (const [x, e] of [[x0 + 0.2, 1], [x1 - 0.2, -1]]) { for (const s of [-1, 1]) { rock(B, x, fy(x) + 1.6, cz + s * 4.3, 1.5, 2.8, 1.7, s + e, '#958e80'); col(x, cz + s * 4.3, 1.4); } for (let i = 0; i < 5; i++) vines.push([x + e * 0.25, fy(x) + 4.1 - Math.abs(i - 2) * 0.35, cz - 2.2 + i * 1.1, 1.3 + (i % 3) * 0.5, i + 60]); }
    // nấm phát quang trong hang (bí mật) + vài cụm nhỏ
    DG.glow(() => { for (let i = 0; i < 8; i++) { const x = x0 - 1.5 - i * 1.25, s = i % 2 ? 1 : -1, z = cz + s * 2.5, y = fy(x) - 0.1; for (let k = 0; k < 3; k++) { DG.cyl(0.03, 0.04, 0.2 + k * 0.08, x + k * 0.2, y, z - s * k * 0.12, '#bff7e6', 5); DG.cone(0.13 + k * 0.03, 0.12, x + k * 0.2, y + 0.2 + k * 0.08, z - s * k * 0.12, '#7dffd0', 6); } } });
  }
  const pathBowl = [[P.CAVE.x1 - 0.5, P.CAVE.z], [-158, -293], [-167, -287], [OX + 6.8, OZ - 1.2]];

  // =====================================================================================
  // B. THUNG LŨNG THIÊN ĐỊNH
  // =====================================================================================
  // ----- B1. cây Thiên Định: thân + 5 rễ nổi + 5 cành (gộp, có viền), tán phát sáng (lưới riêng), 13 quả đèn -----
  const ty = H(OX, OZ), canopyGeo = new Batch('canopy');
  { const bark = '#7b5d44', barkD = '#644a36';
    B.cyl(1.35, 2.0, 8, OX, ty - 0.4, OZ, bark, 9); B.cyl(0.95, 1.35, 5.5, OX, ty + 7.5, OZ, barkD, 8);
    for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + 0.3; B.push(new THREE.ConeGeometry(0.7, 4.2, 5), k % 2 ? bark : barkD, OX + Math.cos(a) * 2.3, ty + 0.5, OZ + Math.sin(a) * 2.3, -a, 0, Math.PI / 2 - 0.42, 1, 1, 1.9);   // rễ nổi
      const b2 = k * TAU / 5 + 0.9, len = 6.5; B.cyl(0.3, 0.55, len, OX + Math.cos(b2) * 2.9, ty + 8.2, OZ + Math.sin(b2) * 2.9, barkD, 6, -b2, 0, -0.95); }                                                    // cành
    const LEAF = ['#4fae7a', '#62c08a', '#3f9a6c', '#7ad09a'];
    canopyGeo.ball(6.8, OX, ty + 17, OZ, LEAF[0], 1, 0.72, 1);
    for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + 0.9; canopyGeo.ball(4.9, OX + Math.cos(a) * 6.4, ty + 14.2 + (k % 2) * 0.8, OZ + Math.sin(a) * 6.4, LEAF[1 + k % 3], 1, 0.7, 1); }
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3; canopyGeo.ball(3.6, OX + Math.cos(a) * 3.4, ty + 20.3, OZ + Math.sin(a) * 3.4, LEAF[3], 1, 0.7, 1); }
    DG.glow(() => { for (let i = 0; i < 13; i++) { const a = i * GOLD, r = 2.6 + 6.2 * Math.sqrt((i + 0.5) / 13), x = OX + Math.cos(a) * r, z = OZ + Math.sin(a) * r, y = ty + 8.6 + (i % 3) * 0.7; DG.ball(0.24, x, y, z, '#fff3c4'); DG.ball(0.1, x, y - 0.3, z, '#ffe28a'); } });
    for (let i = 0; i < 13; i++) { const a = i * GOLD, r = 2.6 + 6.2 * Math.sqrt((i + 0.5) / 13); DG.cyl(0.012, 0.012, 1.6, OX + Math.cos(a) * r, ty + 8.8 + (i % 3) * 0.7, OZ + Math.sin(a) * r, '#6e5a3c', 3); }
    col(OX, OZ, 2.5);
  }
  const canopyMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#ffffff').gradientMap, emissive: new THREE.Color('#7dffc0'), emissiveIntensity: 0.3 });
  const canopy = canopyGeo.mesh(canopyMat, true); canopy.name = 'dest-canopy'; root.add(canopy);
  // bệ đá lời ước (phía đông gốc cây)
  const ALTAR = [OX + 5.4, OZ - 0.9];
  { const [x, z] = ALTAR, y = H(x, z); B.cyl(0.75, 0.9, 0.3, x, y - 0.05, z, '#b3ab9b', 8); B.cyl(0.5, 0.6, 0.75, x, y + 0.25, z, '#c9c2b2', 8); B.box(1.15, 0.12, 0.9, x + 0.05, y + 1.0, z, '#cfc8a6', 0, 0, -0.5);
    sign(signs, 9, x + 0.12, y + 1.14, z, 0.84, 0.84, Math.PI / 2, -1.07); col(x, z, 0.85); DG.glow(() => { for (const s of [-1, 1]) DG.ball(0.1, x - 0.2, y + 1.15, z + s * 0.62, '#ffe9a8'); }); }
  // 5 bia danh ngôn quanh cây (vòng 9,5 m, cách nhau 72°)
  const STELES = QUOTES.map((q, i) => { const a = (36 + 72 * i) * Math.PI / 180, x = OX + Math.cos(a) * 9.5, z = OZ + Math.sin(a) * 9.5, y = H(x, z), ry = Math.atan2(Math.cos(a), Math.sin(a));
    B.box(1.9, 0.3, 0.9, x, y - 0.08, z, '#a9a292', ry); B.box(1.55, 2.0, 0.34, x, y + 0.2, z, '#bdb6a5', ry); B.push(new THREE.CylinderGeometry(0.78, 0.78, 0.34, 9, 1, false, 0, Math.PI), '#bdb6a5', x, y + 2.2, z, ry, Math.PI / 2, Math.PI / 2);
    moss(B, x - Math.cos(a) * 0.1, y + 2.9, z - Math.sin(a) * 0.1, 0.6); sign(signs, 4 + i, x + Math.cos(a) * 0.18, y + 1.25, z + Math.sin(a) * 0.18, 1.45, 1.45, ry); col(x, z, 0.85);
    return { x: x + Math.cos(a) * 1.3, z: z + Math.sin(a) * 1.3, i }; });
  pathStones(pathBowl, 1.25, 0.48, (x, z) => STELES.some(s => Math.hypot(s.x - x, s.z - z) < 1.6));

  // ----- B2. hồ gương + thác 3 tầng -----
  const lakeU = { uTime: { value: 0 }, uSky: { value: new THREE.Color('#bfe6f5') }, uDeep: { value: new THREE.Color('#2f6f78') }, uGlow: { value: 0 } };
  const waterMat = new THREE.ShaderMaterial({ uniforms: lakeU, transparent: true, depthWrite: false,
    vertexShader: `attribute float aFall; varying vec3 vW; varying float vF; varying vec2 vUv; void main(){ vF = aFall; vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime, uGlow; uniform vec3 uSky, uDeep; varying vec3 vW; varying float vF; varying vec2 vUv;
      void main(){
        if (vF > 0.5) {   // màn thác: vệt trắng chảy xuống
          float s = sin(vUv.x * 34. + sin(vUv.y * 5. + uTime * 2.) * 1.3) * 0.5 + 0.5, f = fract(vUv.y * 2.6 + uTime * 1.3 + s * 0.35);
          float a = 0.55 + 0.4 * smoothstep(0.2, 0.9, s * f); a *= smoothstep(0., 0.12, vUv.x) * smoothstep(1., 0.88, vUv.x);
          gl_FragColor = vec4(mix(vec3(0.72, 0.9, 0.96), vec3(1.), s * f) * (0.55 + 0.45 * (1. - uGlow)) + uGlow * vec3(0.05, 0.16, 0.2), a); return; }
        vec3 V = normalize(cameraPosition - vW); float fr = pow(1. - max(V.y, 0.), 2.2);                 // mặt gương: nhìn xiên thấy trời, nhìn thẳng thấy đáy
        vec2 p = vW.xz; float rp = sin(length(p - vec2(${P.FALL.x.toFixed(1)}, ${(P.FALL.z + 2).toFixed(1)})) * 2.6 - uTime * 2.1) * exp(-length(p - vec2(${P.FALL.x.toFixed(1)}, ${(P.FALL.z + 2).toFixed(1)})) * 0.16);
        float tr = smoothstep(13., 3., length(p - vec2(${OX.toFixed(1)}, ${(OZ - 9).toFixed(1)})));                                   // bóng tán cây Thiên Định in trên mặt hồ
        vec3 c = mix(uDeep, uSky, clamp(fr + rp * 0.06, 0., 1.)); c = mix(c, c * vec3(0.55, 0.95, 0.78) + uGlow * vec3(0.1, 0.35, 0.25), tr * 0.55);
        c += rp * 0.05; gl_FragColor = vec4(c, 0.9); }` });
  { const parts = [], F = P.FALL, add = (g, fall) => { g = g.toNonIndexed(); g.setAttribute('aFall', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(fall), 1)); g.deleteAttribute('normal'); parts.push(g); };
    add(new THREE.CircleGeometry(P.LAKE.r + 0.6, 34).rotateX(-Math.PI / 2).translate(P.LAKE.x, P.LAKE.y, P.LAKE.z), 0);
    add(new THREE.CircleGeometry(3.7, 13).rotateX(-Math.PI / 2).translate(F.x, P.LAKE.y, F.z + 2.2), 0);
    // 3 màn nước: [rộng, y trên, z trên, y dưới, z dưới] — rộng dần theo φ^(1/2)
    const TIER = [[3.0, 15.5, F.z - 2.4, 12.0, F.z - 1.4], [3.8, 11.9, F.z - 0.9, 8.3, F.z - 0.1], [4.8, 8.1, F.z + 0.3, P.LAKE.y - 0.05, F.z + 1.2]];
    for (const [w, y0, z0, y1, z1] of TIER) { const g = new THREE.PlaneGeometry(w, 1, 1, 1), p = g.attributes.position; for (let i = 0; i < 4; i++) { const top = p.getY(i) > 0; p.setXYZ(i, F.x + p.getX(i), top ? y0 : y1, top ? z0 : z1); } add(g, 1); }
    const water = new THREE.Mesh(mergeGeometries(parts), waterMat); water.name = 'dest-water'; water.renderOrder = 2; root.add(water);
    // bậc đá 3 tầng + đá suối nguồn + đá quanh vực
    rock(B, F.x, 15.2, F.z - 3.2, 3.2, 1.3, 2.0, 0.3, '#958e80'); rock(B, F.x - 2.6, 15.6, F.z - 2.6, 1.6, 1.6, 1.5, 1.2, '#a39c8d'); rock(B, F.x + 2.7, 15.4, F.z - 2.7, 1.7, 1.5, 1.6, 2.2, '#9c9586');
    rock(B, F.x, 11.3, F.z - 1.5, 3.4, 0.9, 1.5, 0.1, '#8f887a'); rock(B, F.x - 3, 11.6, F.z - 1.2, 1.5, 1.6, 1.4, 2, '#a39c8d'); rock(B, F.x + 3.1, 11.4, F.z - 1.3, 1.6, 1.5, 1.4, 4, '#9c9586');
    rock(B, F.x, 7.7, F.z - 0.2, 3.9, 0.8, 1.4, 0.2, '#8f887a'); rock(B, F.x - 3.6, 7.6, F.z + 0.1, 1.7, 2.2, 1.5, 3, '#a39c8d'); rock(B, F.x + 3.7, 7.4, F.z + 0.2, 1.8, 2.1, 1.6, 5, '#9c9586');
    for (const [dx, y] of [[-2.8, 16.6], [2.9, 16.5], [-3.2, 12.6], [3.3, 12.4], [-3.8, 9.2], [3.9, 9]]) moss(B, F.x + dx, y, F.z - 1.4, 1.1);
    for (const s of [-1, 1]) { rock(B, F.x + s * 4.6, 5.2, F.z + 2.4, 1.2, 1.1, 1.3, s, '#aaa393'); col(F.x + s * 4.6, F.z + 2.4, 1.2); N('fern', F.x + s * 5.6, F.z + 3.4, 1.4); }
    for (let i = 0; i < 8; i++) { const s = i % 2 ? 1 : -1, k = i >> 1; rock(B, F.x + s * (5.6 + k * 1.7), 6.4 + k * 2.2 + (i % 3) * 0.4, F.z - 0.9 - k * 0.55, 1.5 + (i % 3) * 0.35, 1.2 + (k % 2) * 0.5, 1.2, i * 1.3, i % 3 ? '#9c9586' : '#8f887a'); moss(B, F.x + s * (5.6 + k * 1.7), 7.7 + k * 2.2, F.z - 0.7 - k * 0.55, 1.0); }
    for (let i = 0; i < 13; i++) { const s = i % 2 ? 1 : -1, d = 4.6 + (i >> 1) * 0.75; vines.push([F.x + s * d, 13.6 - (i % 4) * 0.5, F.z - 2.0 + (i % 3) * 0.2, 2.6 + (i % 5) * 0.7, i + 110]); }
    // lá sen + đoá sen phát sáng (bí mật)
    for (let i = 0; i < 8; i++) { const a = i * GOLD + 2.2, r = 4 + 5.5 * Math.sqrt((i + 0.5) / 8); DG.cyl(0.5 + (i % 3) * 0.12, 0.5 + (i % 3) * 0.12, 0.03, P.LAKE.x + Math.cos(a) * r, P.LAKE.y + 0.01, P.LAKE.z + Math.sin(a) * r, i % 2 ? '#5f9e55' : '#6fb060', 9); }
  }
  const LOTUS = [-175.6, -294.4];
  DG.cyl(0.62, 0.62, 0.03, LOTUS[0], P.LAKE.y + 0.01, LOTUS[1], '#6fb060', 9);
  DG.glow(() => { for (let k = 0; k < 8; k++) { const a = k * TAU / 8; DG.push(new THREE.ConeGeometry(0.11, 0.42, 4), k % 2 ? '#ffd9ec' : '#ffb7dc', LOTUS[0] + Math.cos(a) * 0.16, P.LAKE.y + 0.2, LOTUS[1] + Math.sin(a) * 0.16, -a, 0, -0.55); } DG.ball(0.09, LOTUS[0], P.LAKE.y + 0.22, LOTUS[1], '#fff3a8'); });

  // ----- B3. đền đá cổ rêu phong (phía tây, quay mặt về cây) -----
  const TEM = [-204, -281], temY = H(...TEM) + 0.55;
  B.group(TEM[0], 0, TEM[1], 0, () => { const y = temY, st1 = '#b9b2a1', st2 = '#a59e8e', st3 = '#8f897a';
    B.box(6.6, 0.3, 10, 0, y - 0.62, 0, st3); B.box(6.0, 0.37, 9.4, 0, y - 0.37, 0, st2);
    for (let k = 0; k < 3; k++) B.box(0.55, 0.19, 4.2 - k * 0.5, 3.3 + k * 0.5, y - 0.2 - k * 0.19, 0, k % 2 ? st2 : st1);                      // 3 bậc thềm (Fibonacci)
    const HT = [3.4, 3.4, 3.4, 1.3, 3.4, 2.1, 3.4, 3.4];
    [[-2.2, -3.7], [-2.2, -1.25], [-2.2, 1.25], [-2.2, 3.7], [2.2, -3.7], [2.2, -1.25], [2.2, 1.25], [2.2, 3.7]].forEach(([x, z], i) => { const h = HT[i];
      B.box(0.8, 0.22, 0.8, x, y, z, st3); B.cyl(0.3, 0.34, h, x, y + 0.22, z, i % 2 ? st1 : st2, 8); if (h > 3) B.box(0.82, 0.24, 0.82, x, y + 0.22 + h, z, st3); else moss(B, x, y + 0.3 + h, z, 0.42, 0.5);
      col(TEM[0] + x, TEM[1] + z, 0.42); });
    B.box(0.62, 0.42, 8.2, -2.2, y + 3.86, 0, st2); B.box(0.62, 0.42, 3.2, 2.2, y + 3.86, -2.5, st2); B.box(5.0, 0.4, 0.6, 0, y + 3.86, -3.7, st1);                // đà đá còn lại
    B.box(0.6, 0.42, 2.4, 2.9, y - 0.05, 2.2, st2, 0.5, 0, 0.12); B.cyl(0.3, 0.3, 1.2, 1.1, y + 0.3, 2.6, st1, 8, 0.7, Math.PI / 2);                               // đà gãy + đoạn cột đổ
    B.box(0.45, 2.7, 6.2, -2.75, y, 0, st2); B.box(0.5, 0.5, 2.2, -2.7, y + 2.7, 0, st3); B.box(1.1, 0.95, 1.8, -1.9, y, 0, st1);                                   // vách sau + bệ thờ
    rock(B, -1.9, y + 1.35, 0, 0.62, 0.42, 0.6, 0.3, st3, 0); rock(B, -1.9, y + 2.0, 0, 0.46, 0.34, 0.44, 1.2, st2, 0); rock(B, -1.9, y + 2.5, 0, 0.3, 0.24, 0.3, 2, st1, 0);   // đá chồng 3 tầng
    B.box(3.4, 0.22, 4.4, -1.1, y + 4.2, 1.6, st3, 0, 0, -0.22);                                                                                                  // mảng mái nghiêng
    for (const [x, yy, z, s] of [[-2.2, 4.4, -2.2, 1.2], [-2.2, 4.4, 1.6, 1.4], [2.2, 4.4, -2.6, 1], [0, 4.4, -3.7, 1.1], [-1.3, 4.7, 1.6, 1.5], [-2.7, 3.3, -2, 0.8], [2.6, 0.2, -4.2, 0.9], [-3, 0.1, 3.4, 1.1]]) moss(B, x, y + yy, z, s);
  });
  DG.glow(() => { for (const s of [-0.6, 0.6]) { DG.cyl(0.05, 0.06, 0.2, TEM[0] - 1.9, temY + 0.95, TEM[1] + s, '#fff3c4', 5); DG.ball(0.07, TEM[0] - 1.9, temY + 1.2, TEM[1] + s, '#ffd36e'); } });
  for (let k = 0; k < 6; k++) col(TEM[0] - 2.75, TEM[1] - 2.9 + k * 1.16, 0.5); col(TEM[0] - 1.9, TEM[1], 0.95);
  ctx.decks.push({ x0: TEM[0] - 3, x1: TEM[0] + 3, z0: TEM[1] - 4.7, z1: TEM[1] + 4.7, y: temY });
  for (let i = 0; i < 8; i++) vines.push([TEM[0] - 2.2 + (i % 2) * 0.35, temY + 3.85, TEM[1] - 3.2 + i * 0.9, 1.6 + (i % 3) * 0.6, i + 80]);
  // chuông gió cổ (bí mật) treo ở đà đá mặt tiền
  const CHIME = [TEM[0] + 2.2, TEM[1] - 2.5];
  for (let i = 0; i < 5; i++) B.cyl(0.035, 0.035, 0.3 * Math.pow(PHI, i / 3), CHIME[0] + 0.45, temY + 3.5 - 0.3 * Math.pow(PHI, i / 3), CHIME[1] + (i - 2) * 0.11, '#c9b06a', 5);
  B.cyl(0.19, 0.19, 0.03, CHIME[0] + 0.45, temY + 3.5, CHIME[1], '#7a5a3c', 8); B.cyl(0.012, 0.012, 0.36, CHIME[0] + 0.45, temY + 3.5, CHIME[1], '#6e5a3c', 4);
  // dấu chân hươu trắng (bí mật)
  const TRACKS = [-196.5, -272.5];
  for (let k = 0; k < 8; k++) { const x = TRACKS[0] + k * 0.55, z = TRACKS[1] + Math.sin(k * 1.3) * 0.25 + k * 0.3; for (const s of [-0.05, 0.05]) G.cyl(0.05, 0.05, 0.012, x + s, H(x, z) + 0.03, z, '#5a4a3a', 5); }

  // ----- B4. vườn đá thiền (phía nam): cát cào 5 vòng + xoắn ốc đá 1·1·2·3·5 -----
  const GAR = [-180, -256.8];
  { const [x, z] = GAR; let y = 0; for (let k = 0; k < 13; k++) y = Math.max(y, H(x + Math.cos(k * GOLD) * 5.5 * Math.sqrt(k / 13), z + Math.sin(k * GOLD) * 5.5 * Math.sqrt(k / 13))); y += 0.03;
    G.cyl(6.2, 6.3, 0.3, x, y - 0.24, z, '#e9e2cf', 21);
    for (const r of [1.5, 2.6, 3.7, 4.8, 5.7]) G.push(new THREE.TorusGeometry(r, 0.045, 4, 21), '#d6cdb6', x, y + 0.07, z, 0, Math.PI / 2);
    for (let k = 0; k < 13; k++) { const a = k * TAU / 13; rock(G, x + Math.cos(a) * 6.3, y + 0.05, z + Math.sin(a) * 6.3, 0.34, 0.24, 0.3, a, k % 2 ? '#a9a297' : '#b9b0a1', 0); }
    [1, 1, 2, 3, 5].forEach((n, k) => { const a = k * GOLD + 0.6, r = 0.8 + k * 1.02, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
      for (let j = 0; j < n; j++) { const b = j * GOLD, rr = n > 1 ? 0.42 + 0.1 * j : 0; rock(B, cx + Math.cos(b) * rr, y + 0.24 + (k === 0 ? 0.3 : 0), cz + Math.sin(b) * rr, 0.3 + (k === 0 ? 0.3 : 0), 0.36 + (k === 0 ? 0.4 : 0.05 * (j % 3)), 0.28 + (k === 0 ? 0.25 : 0), b, j % 2 ? '#8f887a' : '#a39c8d', 0); }
      if (k === 0) col(cx, cz, 0.6); }); }
  // ----- B5. ghế thiền bên hồ (nhìn về thác): bệ đá + bồ đoàn + 2 đèn đá -----
  const SEAT = { x: -172.8, z: -290.8 }; SEAT.y = H(SEAT.x, SEAT.z) + 0.34; SEAT.face = Math.atan2(P.FALL.x - SEAT.x, P.FALL.z - SEAT.z);
  B.cyl(1.05, 1.2, 0.26, SEAT.x, SEAT.y - 0.34, SEAT.z, '#b7b0a2', 8); DG.cyl(0.42, 0.45, 0.14, SEAT.x, SEAT.y - 0.1, SEAT.z, '#c96f4a', 9);
  ctx.decks.push({ x0: SEAT.x - 0.85, x1: SEAT.x + 0.85, z0: SEAT.z - 0.85, z1: SEAT.z + 0.85, y: SEAT.y - 0.08 });
  lantern(SEAT.x + 2.0, SEAT.z + 0.9, 1); lantern(SEAT.x - 1.2, SEAT.z + 2.0, 1);
  // ----- B6. cổng đá dịch chuyển: vòng đá đứng trên bệ, bên trong là xoáy sáng -----
  const gate = (b, sg, x, z, ry) => { const y = H(x, z); b.group(x, 0, z, ry, () => { b.box(4.6, 0.3, 1.5, 0, y - 0.1, 0, '#a59e8e'); b.box(3.6, 0.22, 1.1, 0, y + 0.2, 0, '#b9b2a1');
      b.push(new THREE.TorusGeometry(1.9, 0.34, 5, 13), '#aaa393', 0, y + 2.45, 0); for (const s of [-1, 1]) rock(b, s * 2.05, y + 0.75, 0, 0.6, 0.75, 0.6, s, '#9c9586', 0); });
    moss(b, x, y + 4.65, z, 0.9); sign(sg, 10, x + Math.cos(ry) * 2.9 + Math.sin(ry) * 0.5, y + 0.9, z - Math.sin(ry) * 2.9 + Math.cos(ry) * 0.5, 1.0, 1.0, ry, -0.25);
    for (const s of [-1, 1]) col(x + Math.cos(ry) * s * 2.05, z - Math.sin(ry) * s * 2.05, 0.7); return y + 2.45; };
  const PIN = { x: P.PORTAL_IN[0], z: P.PORTAL_IN[1], ry: Math.atan2(OX - P.PORTAL_IN[0], OZ - P.PORTAL_IN[1]) }, POUT = { x: P.PORTAL_OUT[0], z: P.PORTAL_OUT[1], ry: Math.atan2(TEMPLE_C[0] - P.PORTAL_OUT[0], TEMPLE_C[1] - P.PORTAL_OUT[1]) };
  PIN.y = gate(B, signs, PIN.x, PIN.z, PIN.ry); const BG = new Batch('dest-gate-out'), signsGate = []; POUT.y = gate(BG, signsGate, POUT.x, POUT.z, POUT.ry);
  const swirlMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; void main(){ vec2 p = vUv * 2. - 1.; float r = length(p), a = atan(p.y, p.x); float s = sin(a * 3. + r * 8.09 - uTime * 1.618) * 0.5 + 0.5; float k = smoothstep(1., 0.55, r) * (0.3 + 0.7 * s) + smoothstep(0.35, 0., r) * 0.6; gl_FragColor = vec4(vec3(0.5, 1., 0.82) * k, k); }` });
  const mkSwirl = (g, q) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1.62, 21), swirlMat); m.position.set(q.x, q.y, q.z); m.rotation.y = q.ry; m.name = 'dest-swirl'; g.add(m); return m; };
  mkSwirl(root, PIN); const swirlOut = mkSwirl(out, POUT);

  // ----- B7. cổ thụ khổng lồ quanh thung lũng (8), cây vừa, cây trên đỉnh vách (21), dương xỉ, nấm, hoa -----
  [4, 44, 66, 121, 153, 207, 238, -57].forEach((deg, i) => { const a = deg * Math.PI / 180, r = 28.6 + (i % 3) * 1.1, x = OX + Math.cos(a) * r, z = OZ + Math.sin(a) * r; N(i % 2 ? 'oak' : 'round', x, z, 24 + (i % 3) * 3, ['#2f7a45', '#357a4c', '#2a6e4a'][i % 3]); col(x, z, 1.6);
    for (let k = 0; k < 5; k++) N(k % 2 ? 'fern' : 'bush', x + Math.cos(k * GOLD + i) * 2.6, z + Math.sin(k * GOLD + i) * 2.6, 1.2 + rnd() * 0.5); });
  const keepOut = (x, z, m = 0) => Math.hypot(x - OX, z - OZ) < 11.5 + m || Math.hypot(x - P.LAKE.x, z - P.LAKE.z) < P.LAKE.r + 1.5 + m || Math.hypot(x - P.FALL.x, z - P.FALL.z - 2) < 5 + m || Math.hypot(x - GAR[0], z - GAR[1]) < 7 + m
    || (Math.abs(x - TEM[0]) < 4.5 + m && Math.abs(z - TEM[1]) < 6 + m) || Math.hypot(x - SEAT.x, z - SEAT.z) < 3.4 + m || Math.hypot(x - PIN.x, z - PIN.z) < 4 + m || polyD(pathBowl, x, z) < 2.4 + m || (x > P.CAVE.x1 - 4 && Math.abs(z - P.CAVE.z) < 5 + m);
  { let n = 0, tries = 0; while (n < (low ? 8 : 13) && tries++ < 400) { const a = rnd() * TAU, r = 13 + rnd() * 18, x = OX + Math.cos(a) * r, z = OZ + Math.sin(a) * r; if (keepOut(x, z, 1.5)) continue; N('birch', x, z, 12 + rnd() * 4, ['#8fc76a', '#7fbf6a', '#a3d07a'][n % 3]); col(x, z, 0.45); n++; }
    for (let i = 0; i < (low ? 34 : 55); i++) { const a = i * GOLD, r = 6 + 27 * Math.sqrt((i + 0.5) / 55), x = OX + Math.cos(a) * r, z = OZ + Math.sin(a) * r; if (keepOut(x, z, -0.6)) continue; N(['fern', 'flowers', 'fern', 'mushrooms', 'bush'][i % 5], x, z, 0.8 + rnd() * 0.7, i % 5 === 1 ? ['#f6f1e6', '#c9a3ff', '#9ad8ff'][i % 3] : undefined); }
    for (let i = 0; i < 34; i++) { const a = i * TAU / 34 + 0.1, r = 39.5 + (i % 2) * 1.6, x = OX + Math.cos(a) * r, z = OZ + Math.sin(a) * r; if (Math.abs(z - P.CAVE.z) < 7 && x > OX) continue; N(i % 3 ? 'round' : 'pine', x, z, 10 + rnd() * 5, '#357a4c'); }   // 34 cây trên đỉnh vách: che kín thung lũng
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.5, x = OX + Math.cos(a) * 33.6, z = OZ + Math.sin(a) * 33.6; if (keepOut(x, z, 1)) continue; N('rockL', x, z, 3 + rnd() * 1.5, '#a9a297', 0.2); col(x, z, 1.2); } }
  // tổ chim trên cành thấp (bí mật) — cây vừa cạnh lối vào
  const NEST = [-163.5, -279.5];
  { const [x, z] = NEST, y = H(x, z); B.cyl(0.22, 0.32, 3.4, x, y - 0.2, z, '#6e5238', 6); col(x, z, 0.45); N('birch', x, z, 11, '#8fc76a'); B.cyl(0.07, 0.1, 1.5, x + 0.6, y + 1.9, z, '#6e5238', 5, 0, 0, -1.1);
    DG.cyl(0.3, 0.2, 0.16, x + 1.25, y + 2.25, z, '#9a7a4c', 8); DG.glow(() => { for (let k = 0; k < 3; k++) DG.ball(0.075, x + 1.25 + Math.cos(k * 2.1) * 0.1, y + 2.4, z + Math.sin(k * 2.1) * 0.1, '#e9f6ff'); }); }

  // =====================================================================================
  // C. MANH MỐI Ở ĐẢO CHÍNH (bia khắc đá sau Đền) — lưới riêng, luôn có
  // =====================================================================================
  { const [x, z] = P.CARVING, y = H(x, z), ry = 2.5; rock(BO, x, y + 0.75, z, 1.2, 1.15, 0.5, ry, '#aaa493', 0); rock(BO, x - 0.9, y + 0.2, z + 0.5, 0.6, 0.4, 0.5, 1, '#9c9586', 0); moss(BO, x, y + 1.85, z, 0.7);
    sign(signsOut, 3, x + Math.sin(ry) * 0.52, y + 0.95, z + Math.cos(ry) * 0.52, 1.35, 1.35, ry); col(x, z, 1.0); }

  // =====================================================================================
  // D. LƯỚI INSTANCED: bụi rậm, đá lát, dây leo, sương, tia nắng, bướm, lụa ước, đom đóm
  // =====================================================================================
  const o = new THREE.Object3D(), c = new THREE.Color();
  // bụi rậm (3 khối cầu thấp, 60 tam giác)
  { const b = new Batch('thick'); b.ball(1.25, 0, 1.0, 0, '#4f8f4a', 1, 0.86, 1); b.ball(0.92, 0.85, 0.72, 0.3, '#427f42', 1, 0.85, 1); b.ball(0.88, -0.72, 0.78, -0.42, '#5a9a52', 1, 0.85, 1);
    const im = new THREE.InstancedMesh(mergeGeometries(b.geos), toon('#ffffff', { vertexColors: true }), thick.length);
    thick.forEach(([x, y, z, s, ry, tc], i) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(s, s * (0.52 + (i % 3) * 0.07), s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(tc).lerp(c.clone().set('#ffffff'), 0.6)); });
    im.castShadow = false; im.receiveShadow = true; im.computeBoundingSphere(); im.name = 'dest-thicket'; root.add(im); }
  { const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 0.9, 1, 7).translate(0, 0.5, 0), toon('#ffffff'), stones.length);
    stones.forEach(([x, y, z, r, h, ry, sc], i) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(r, h, r * 0.86); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(sc)); });
    im.castShadow = false; im.receiveShadow = true; im.computeBoundingSphere(); im.name = 'dest-stones'; root.add(im); budget.stones = stones.length; }
  // dây leo: thân mảnh + 8 lá so le (gốc ở đỉnh, rủ xuống −y dài 1 m → kéo dài theo tỷ lệ), lay theo gió
  const windU = { value: 0 };
  { const b = new Batch('vine'); b.box(0.035, 1, 0.035, 0, -1, 0, '#4a7a3c');
    for (let k = 0; k < 8; k++) b.push(new THREE.OctahedronGeometry(1, 0), k % 2 ? '#5fa04a' : '#79b85a', (k % 2 ? 0.11 : -0.11), -0.08 - k * 0.118, (k % 3 - 1) * 0.05, k, 0, 0.5, 0.15, 0.045, 0.085);
    const m = toon('#ffffff', { vertexColors: true, unique: true, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => { sh.uniforms.uWind = windU; sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = instanceMatrix[3].xyz; float kk = -position.y; kk *= kk; float ph = ip.x * 1.7 + ip.z * 0.9;
        transformed.x += sin(uWind * 1.1 + ph) * 0.05 * kk; transformed.z += (sin(uWind * 0.8 + ph * 1.3) + 0.3 * sin(uWind * 2.3 + ph)) * 0.05 * kk;
      #endif`); };
    m.customProgramCacheKey = () => 'dest-vine';
    const im = new THREE.InstancedMesh(mergeGeometries(b.geos), m, vines.length);
    vines.forEach(([x, y, z, len, k], i) => { o.position.set(x, y, z); o.rotation.set(0, k * 2.4, 0); o.scale.set(1.5, len, 1.5); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.setHSL(0.27 + (k % 5) * 0.012, 0.3, 0.72 + (k % 3) * 0.08)); });
    im.castShadow = false; im.computeBoundingSphere(); im.name = 'dest-vines'; root.add(im); budget.vines = vines.length; }
  // sương: bãi sương (13) + 4 cổng sương (×3) + hơi thác (3) + sương sớm thung lũng (5)
  const mistMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uOpacity: { value: 0.4 }, uColor: { value: new THREE.Color('#eef5f1') } }]),
    vertexShader: `uniform float uTime; varying vec2 vUv; varying float vA; #include <fog_pars_vertex>
      void main(){ vUv = uv; vA = instanceColor.r; vec3 c = instanceMatrix[3].xyz; float ph = c.x * 0.13 + c.z * 0.07;
        c.x += sin(uTime * 0.13 + ph) * 1.1; c.z += cos(uTime * 0.1 + ph) * 1.1;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.); mvPosition.xy += position.xy * vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
        gl_Position = projectionMatrix * mvPosition; #include <fog_vertex> }`.replace(/#include <(\w+)>/g, '\n#include <$1>\n'),
    fragmentShader: `uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv; varying float vA; #include <fog_pars_fragment>
      void main(){ vec2 p = vUv * 2. - 1.; float d = length(p * vec2(1., 1.25)); float a = smoothstep(1., 0.1, d); a *= a * vA * uOpacity;
        if (a < 0.004) discard; gl_FragColor = vec4(uColor, a); #include <fog_fragment> }`.replace(/#include <(\w+)>/g, '\n#include <$1>\n') });
  { const list = [];   // [x, y, z, rộng, cao, đậm]
    for (let i = 0; i < 13; i++) { const x = P.FOG.x0 + 3 + ((i * 7) % 13) / 13 * (P.FOG.x1 - P.FOG.x0 - 5), z = P.FOG.z0 + 2 + (i / 13) * (P.FOG.z1 - P.FOG.z0 - 3); list.push([x, P.PLAT.y + 1.3 + (i % 3) * 0.6, z, 9 + (i % 4) * 2, 4.2, 0.9]); }
    for (const m of P.MIST) for (let k = 0; k < 3; k++) list.push([m[0] + (k - 1) * 1.6, P.PLAT.y + 1.2 + k * 0.5, m[1] + (k % 2) * 0.8, 5, 3.6, 1.4]);
    for (let k = 0; k < 3; k++) list.push([P.FALL.x + (k - 1) * 1.8, P.LAKE.y + 0.9 + k * 0.3, P.FALL.z + 1.6 + k * 0.4, 4.5, 2.4, 0.8]);
    for (let k = 0; k < 5; k++) { const a = k * GOLD * 3 + 1; list.push([OX + Math.cos(a) * 20, P.BOWL.floor + 1.4, OZ + Math.sin(a) * 20, 12, 3.4, 0.5]); }
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mistMat, list.length);
    list.forEach(([x, y, z, w, h, a], i) => { o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.scale.set(w, h, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.setRGB(a, 0, 0)); });
    im.frustumCulled = false; im.renderOrder = 3; im.name = 'dest-mist'; root.add(im); }
  // tia nắng xuyên tán: 8 dải sáng (2 tấm chéo), nghiêng theo hướng nắng
  const RAY_N = low ? 5 : 8, rayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uA: { value: 0 }, uTime: { value: 0 }, uCol: { value: new THREE.Color('#fff2c0') } },
    vertexShader: `varying vec2 vUv; varying float vP; void main(){ vUv = uv; vP = instanceMatrix[3].x; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uA, uTime; uniform vec3 uCol; varying vec2 vUv; varying float vP; void main(){ float e = smoothstep(0., 0.5, vUv.x) * smoothstep(1., 0.5, vUv.x); float v = smoothstep(0., 0.25, vUv.y) * smoothstep(1., 0.55, vUv.y);
      float a = e * v * uA * (0.75 + 0.25 * sin(uTime * 0.7 + vP)); gl_FragColor = vec4(uCol * a, a); }` });
  const rays = new THREE.InstancedMesh(mergeGeometries([new THREE.PlaneGeometry(3.4, 1).translate(0, 0.5, 0), new THREE.PlaneGeometry(3.4, 1).translate(0, 0.5, 0).rotateY(Math.PI / 2)]), rayMat, RAY_N);
  rays.frustumCulled = false; rays.renderOrder = 4; rays.name = 'dest-rays'; root.add(rays);
  const RAYS = [[OX + 6, OZ + 5], [OX - 7, OZ + 3], [OX + 2, OZ - 8], [-196, -276], [-166, -296], [OX - 2, OZ + 15], [-163, -270], [-192, -290]].slice(0, RAY_N);
  // bướm phát sáng (13) quanh cây + hồ
  const BF_N = low ? 8 : 13, bfGeo = new THREE.BufferGeometry(); bfGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.32, 0.05, 0.12, 0.26, 0, -0.2, 0, 0, 0, -0.26, 0, -0.2, -0.32, 0.05, 0.12], 3));
  const bfly = new THREE.InstancedMesh(bfGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), BF_N); bfly.frustumCulled = false; bfly.name = 'dest-butterflies'; root.add(bfly);
  const BF = Array.from({ length: BF_N }, (_, i) => { const a = i * GOLD, r = 4 + 16 * Math.sqrt((i + 0.5) / BF_N); bfly.setColorAt(i, c.set(['#7dffe0', '#ffb7ec', '#bfe0ff', '#fff3a8'][i % 4])); return { x: OX + Math.cos(a) * r, z: OZ - 6 + Math.sin(a) * r, ph: i * 1.7 }; });
  // dải lụa ước trên cành thấp (13 đỏ/trắng + 1 vàng của người chơi)
  const RB_N = 14, ribbons = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.13, 0.62).translate(0, -0.31, 0), toon('#ffffff', { side: THREE.DoubleSide }), RB_N); ribbons.frustumCulled = false; ribbons.name = 'dest-ribbons'; root.add(ribbons);
  const RB = Array.from({ length: RB_N }, (_, i) => { const a = i * GOLD + 0.4, r = i === 13 ? 3.3 : 3 + (i % 4) * 0.9; ribbons.setColorAt(i, c.set(i === 13 ? '#ffd23f' : i % 3 ? '#d9452f' : '#fff6e6')); return { x: OX + Math.cos(a) * r, y: ty + 7.5 + (i % 3) * 0.25, z: OZ + Math.sin(a) * r, ph: i * 2.1 }; });
  // đom đóm (1 Points): loại 0 = thung lũng (đêm) · 1 = luôn sáng (hang, quanh cây) · 2 = dẫn đường (đêm, chạy dọc lối) · 3 = lấp lánh chỗ bí mật chưa tìm
  const SEC_POS = { lotus: [LOTUS[0], P.LAKE.y + 0.7, LOTUS[1]], nest: [NEST[0] + 1.25, H(...NEST) + 2.9, NEST[1]], shroom: [-145.5, 6.9, P.CAVE.z + 2.2], spiral: [GAR[0], H(...GAR) + 1.3, GAR[1]],
    fall: [P.FALL.x + 2.9, 6.1, P.FALL.z + 1.0], tracks: [TRACKS[0] + 2, H(...TRACKS) + 0.7, TRACKS[1] + 1], rings: [STUMP[0], H(...STUMP) + 1.3, STUMP[1]], chime: [CHIME[0] + 0.45, temY + 2.7, CHIME[1]] };
  const ffP = [], ffA = [];   // vị trí, (pha, loại, thứ tự)
  { const add = (x, y, z, k, n = 0) => { ffP.push(x, y, z); ffA.push(rnd() * 6.28, k, n); };
    for (let i = 0; i < (low ? 34 : 55); i++) { const a = i * GOLD, r = 5 + 27 * Math.sqrt((i + 0.5) / 55), x = OX + Math.cos(a) * r, z = OZ + Math.sin(a) * r; add(x, H(x, z) + 0.6 + rnd() * 2.4, z, 0); }
    for (let i = 0; i < 13; i++) { const x = -140.5 - i * 0.78; add(x, 6.2 + rnd() * 2.2 + (x + 150) * 0.27, P.CAVE.z + (rnd() - 0.5) * 3.6, 1); }
    for (let i = 0; i < 21; i++) { const a = i * GOLD, r = 3 + 6 * Math.sqrt(i / 21); add(OX + Math.cos(a) * r, ty + 2 + rnd() * 9, OZ + Math.sin(a) * r, 1); }
    let acc = 0, n = 0; for (let i = 1; i < P.GUIDE.length; i++) { const [ax, az] = P.GUIDE[i - 1], [bx, bz] = P.GUIDE[i], L = Math.hypot(bx - ax, bz - az); for (let d = 2.1 - acc; d < L; d += 2.1) { const x = ax + (bx - ax) * d / L, z = az + (bz - az) * d / L; add(x, Math.max(H(x, z), 0.2) + 1.1 + (n % 3) * 0.3, z, 2, n++); } acc = (acc + L) % 2.1; }
    SECRETS.forEach(([id], i) => add(...SEC_POS[id], 3, i)); }
  const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.Float32BufferAttribute(ffP, 3)); ffGeo.setAttribute('aD', new THREE.Float32BufferAttribute(ffA, 3));
  const ffMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, uPx: { value: 1 } },
    vertexShader: `uniform float uTime, uNight, uPx; attribute vec3 aD; varying float vA; varying vec3 vC;
      void main(){ vec3 p = position; float ph = aD.x, k = aD.y; float mv = k > 2.5 ? 0.12 : k > 1.5 ? 0.5 : 1.;
        p.x += sin(uTime * 0.5 + ph) * 1.2 * mv; p.z += cos(uTime * 0.37 + ph * 1.7) * 1.2 * mv; p.y += sin(uTime * 0.8 + ph * 2.3) * 0.45 * mv;
        float tw = 0.35 + 0.65 * max(0., sin(uTime * 2.1 + ph * 3.));
        if (k < 0.5) { vA = uNight * tw; vC = vec3(1., 0.95, 0.5); }
        else if (k < 1.5) { vA = (0.55 + 0.45 * uNight) * tw; vC = vec3(0.7, 1., 0.75); }
        else if (k < 2.5) { vA = uNight * (0.45 + 0.9 * pow(max(0., sin(uTime * 1.3 - aD.z * 0.55)), 3.)); vC = vec3(1., 0.92, 0.5); }   // sóng sáng chạy về phía cửa khe
        else { vA = 0.5 + 0.5 * sin(uTime * 3.4 + ph); vC = vec3(1., 1., 0.85); }
        vec4 mvp = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvp; gl_PointSize = uPx * (k > 2.5 ? 150. : k > 1.5 ? 340. : 190.) / -mvp.z; }`,
    fragmentShader: `varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0., d) * vA; gl_FragColor = vec4(vC * a, a); }` });
  const flies = new THREE.Points(ffGeo, ffMat); flies.frustumCulled = false; flies.name = 'dest-fireflies'; scene.add(flies);
  const secBase = ffP.length / 3 - SECRETS.length;
  const hideSpark = () => { const a = ffGeo.attributes.position; SECRETS.forEach(([id], i) => a.setY(secBase + i, st.S.secrets[id] ? -999 : SEC_POS[id][1])); a.needsUpdate = true; };
  hideSpark(); st.onSync = () => { hideSpark(); mapDirty(); };

  // ----- xuất lưới tĩnh -----
  const mat = toon('#ffffff', { vertexColors: true });
  { const m = B.mesh(mat, true); m.name = 'dest-arch'; addOutline(m); root.add(m); const g = G.mesh(mat, false); g.name = 'dest-ground'; g.castShadow = false; root.add(g);
    const [b2, g2] = detailMats(); DG.build(root, b2, g2);
    const sm = new THREE.MeshToonMaterial({ map: atlas, gradientMap: mat.gradientMap });
    const s1 = new THREE.Mesh(mergeGeometries(signs), sm); s1.name = 'dest-signs'; root.add(s1);
    const mo = BO.mesh(mat, true); mo.name = 'dest-carving'; out.add(mo); const s2 = new THREE.Mesh(mergeGeometries(signsOut), sm); s2.name = 'dest-signs-out'; out.add(s2);
    budget.tris = Math.round(B.tris + G.tris + DG.tris); }
  const gateOut = new THREE.Group(); gateOut.name = 'dest-gate-out'; out.add(gateOut);
  { const m = BG.mesh(mat, true); addOutline(m); gateOut.add(m); gateOut.add(new THREE.Mesh(mergeGeometries(signsGate), new THREE.MeshToonMaterial({ map: atlas, gradientMap: mat.gradientMap }))); gateOut.add(swirlOut); }

  // ----- sinh vật hiếm: hươu trắng (model CC0 có sẵn, nhuộm trắng) + công (khối cơ bản, đuôi xoè theo góc vàng) -----
  const deer = { root: null, anim: null, i: 0, wait: 3, x: -192, z: -268, rot: 0, pts: [[-192, -268], [-170, -266], [-164, -276], [-190, -262], [-198, -290]] };
  loadAnimated('animal-deer', true).then(g => { if (!g) return; const m = g.scene; m.updateMatrixWorld(true); { const bx = new THREE.Box3().setFromObject(m), hh = bx.max.y - bx.min.y || 1; m.scale.setScalar(1.62 / hh); }   // cao 1,62 m (φ)
    m.traverse(q => { if (q.isMesh) { q.material = q.material.clone(); q.material.color = new THREE.Color('#ffffff'); q.material.map = null; q.material.vertexColors = false; q.material.emissive = new THREE.Color('#bdb8ac'); q.material.emissiveIntensity = 0.55; q.castShadow = true; q.userData.animal = { name: 'Hươu trắng', fact: 'Hươu trắng rất hiếm: lông trắng do thiếu sắc tố. Hãy đứng yên, nó sẽ không bỏ chạy.' }; } });
    deer.root = m; deer.anim = animator(m, g.animations, n => n.split('|').pop()); deer.anim.play('Eating', 0); m.position.set(deer.x, H(deer.x, deer.z), deer.z); m.name = 'dest-deer'; root.add(m); });
  const PEA = { x: -197.5, z: -287, fan: 0 };
  const peacock = new THREE.Group(); peacock.name = 'dest-peacock';
  { const b = new Batch('pea'), t = new Batch('peatail'), blue = '#1f6fb8', teal = '#1f9a8a';
    b.ball(0.34, 0, 0.62, 0, blue, 0.8, 0.85, 1.25); b.cyl(0.07, 0.11, 0.55, 0, 0.8, 0.3, blue, 6, 0, 0.35); b.ball(0.12, 0, 1.42, 0.5, blue); b.push(new THREE.ConeGeometry(0.035, 0.16, 4), '#d9b56a', 0, 1.42, 0.66, 0, Math.PI / 2);
    for (let k = 0; k < 3; k++) { b.cyl(0.008, 0.008, 0.16, (k - 1) * 0.05, 1.5, 0.48, teal, 3); b.ball(0.028, (k - 1) * 0.05, 1.68, 0.48, '#3fd0c0'); }
    for (const s of [-0.1, 0.1]) b.cyl(0.02, 0.02, 0.42, s, 0, 0.02, '#8a7a5a', 4);
    for (let k = 0; k < 13; k++) { const a = (k - 6) / 6 * 1.25; t.push(new THREE.ConeGeometry(0.1, 1.5, 4), k % 2 ? '#2a9a6a' : '#23b58a', Math.sin(a) * 0.72, 0.72 * Math.cos(a), 0, 0, 0, -a, 1, 1, 0.25); t.ball(0.085, Math.sin(a) * 1.32, 1.32 * Math.cos(a), 0.03, '#2f58c8', 1, 1.3, 0.4); t.ball(0.04, Math.sin(a) * 1.32, 1.32 * Math.cos(a), 0.06, '#ffd23f', 1, 1.3, 0.4); }
    const body = b.mesh(mat, true); body.name = 'pea-body'; peacock.add(body); const tail = t.mesh(mat, false); tail.name = 'pea-tail'; tail.position.set(0, 0.62, -0.3); peacock.add(tail); peacock.userData.tail = tail;
    peacock.position.set(PEA.x, H(PEA.x, PEA.z), PEA.z); peacock.rotation.y = 1.1; peacock.scale.setScalar(1.3); root.add(peacock); col(PEA.x, PEA.z, 0.5); }

  // ----- âm thanh nền: thác, chim ở lối ra bãi sương (đi theo tiếng chim), dế đêm -----
  if (ctx.addSoundZone) {
    ctx.addSoundZone({ file: 'amb-river', x: P.FALL.x, y: 8, z: P.FALL.z + 1, ref: 7, vol: 1 });
    ctx.addSoundZone({ file: 'amb-birds2', x: P.FOG.out[0] - 1.5, y: P.PLAT.y + 3, z: P.FOG.out[1], ref: 4, vol: 1, when: 'day' });
    ctx.addSoundZone({ file: 'amb-birds', x: OX + 8, y: 14, z: OZ + 6, ref: 9, vol: 0.7, when: 'day' });
    ctx.addSoundZone({ file: 'amb-crickets', x: OX, y: 6, z: OZ + 12, ref: 10, vol: 0.5, when: 'night' });
  }
  // chuông gió: vài nốt ngũ cung ngẫu nhiên, to dần khi lại gần
  let chimeT = 2;
  const chimeAt = (px, pz, x, z, R) => { const d = Math.hypot(px - x, pz - z); if (d > R || !ctx.note) return; const v = 0.09 * (1 - d / R) ** 1.3; [784, 880, 1047, 1175, 1319].sort(() => rnd() - 0.5).slice(0, 2 + Math.floor(rnd() * 2)).forEach((f, i) => setTimeout(() => ctx.note(f, v, 1.6), i * (160 + rnd() * 240))); };

  // =====================================================================================
  // E. LOGIC: dọn cây tự nhiên, khám phá, cổng sương, bãi sương, nút hành động
  // =====================================================================================
  function firstFrame() {
    let n = 0;
    for (const kind of Object.keys(NATURE)) { const set = terrain.nature.add(kind, []); if (!set || !set.items) continue; const before = set.items.length;
      const keep = set.items.filter(q => { const x = q.m.elements[12], z = q.m.elements[14]; return !P.destinyAt(x, z, 2); });
      if (keep.length !== before) { set.items.length = 0; set.items.push(...keep); n += before - keep.length; set.relayout && set.relayout(set.last); } }
    for (let i = ctx.colliders.length - 1; i >= 0; i--) { const q = ctx.colliders[i]; if (!q.dst && P.destinyAt(q.x, q.z, 1)) { ctx.colliders.splice(i, 1); n++; } }
    for (const k of Object.keys(nat)) terrain.nature.add(k, nat[k]);
    console.info('[destiny] dọn', n, 'vật tự nhiên · lối mòn', Math.round(P.TRAIL_LEN), 'm ·', budget);
  }
  let mapDirty = () => { if (ctx.worldMap && ctx.worldMap.redraw) ctx.worldMap.redraw(); };
  const reward = n => { if (ctx.account && ctx.account.addCoins && ctx.account.profile) ctx.account.addCoins(n); };
  function discover() {
    const S = st.S; if (S.found) return; S.found = Date.now(); st.save(); mapDirty();
    ctx.sfx && ctx.sfx('win'); reward(21);
    ctx.toast(`🧭 <b>Em đã tìm ra RỪNG THIÊN ĐỊNH!</b><br>Danh hiệu mới: <b>${TITLE}</b> · +21 🪙<br><small>Khu rừng đã hiện trên bản đồ. Cổng đá 🌀 mở lối tắt về Đền Tri Thức.</small>`, 9000);
  }
  function findSecret(id) {
    const S = st.S, q = SECRETS.find(s => s[0] === id); if (!q || S.secrets[id]) return; S.secrets[id] = 1; st.save(); hideSpark(); const n = st.count();
    ctx.sfx && ctx.sfx(n >= 8 ? 'win' : 'ok'); reward(n >= 8 ? 34 : 5);
    ctx.toast(`${q[1]} <b>${q[2]}</b> <small>(bí mật ${n}/8)</small><br>${q[3]}${n >= 8 ? `<br>🌳 <b>Đủ 8 bí mật!</b> Danh hiệu: <b>${TITLE2}</b> · +34 🪙` : ''}`, 9000);
    if (id === 'chime') chimeAt(0, 0, 0, 0, 1);
  }
  const back = (x, z, face, msg) => ui.fade(() => { ctx.player.teleport(x, z); ctx.player.setRot && ctx.player.setRot(face); if (ctx.player.cam) ctx.player.cam.yaw = face + Math.PI; ctx.toast(msg, 6000); });
  const travel = (q, msg) => ui.fade(() => { const x = q.x + Math.sin(q.ry) * 2.6, z = q.z + Math.cos(q.ry) * 2.6; ctx.player.teleport(x, z); ctx.player.setRot && ctx.player.setRot(q.ry); if (ctx.player.cam) ctx.player.cam.yaw = q.ry + Math.PI; ctx.sfx && ctx.sfx('magic'); ctx.toast(msg, 5000); }, 520);
  function meditate() {
    const p = ctx.player; p.teleport(SEAT.x, SEAT.z, SEAT.y - 0.08); p.setRot && p.setRot(SEAT.face); p.emote && p.emote('floor'); if (p.cam) { p.cam.yaw = SEAT.face + Math.PI; p.cam.pitch = 0.3; }
    ui.breathe(ok => { if (!ok) return; reward(8); ctx.sfx && ctx.sfx('ok'); ctx.toast(`🧘 <b>Tuyệt lắm!</b> Em vừa tĩnh tâm trọn 1 phút (5 nhịp thở). +8 🪙<br><small>Khi hồi hộp trước giờ kiểm tra, hãy thở chậm như thế: hít 5 giây, thở 8 giây.</small>`, 8000); });
  }
  const readStele = s => { const S = st.S, [q, who] = QUOTES[s.i], first = !S.steles[s.i]; S.steles[s.i] = 1; if (first) st.save(); const n = QUOTES.filter((_, i) => S.steles[i]).length;
    ctx.toast(`📖 <b>“${q}”</b><br><small>— ${who} · bia ${n}/5${first && n === 5 ? ' · Em đã đọc đủ 5 bia đá! +13 🪙' : ''}</small>`, 8000); if (first && n === 5) { reward(13); ctx.sfx && ctx.sfx('ok'); } };

  let first = true, slowT = 0, near = false, nearOut = false, fogK = 0, fogT = 0, sitT = 0, sunA = -9;
  const D = (p, x, z) => Math.hypot(p.x - x, p.z - z);
  function update(dt, t) {
    const p = ctx.player.pos;
    if (first) { first = false; firstFrame(); }
    ui.update(dt);
    if ((slowT -= dt) <= 0) { slowT = 0.3;
      near = D(p, CEN[0], CEN[1]) < 190; root.visible = near;
      nearOut = D(p, P.CARVING[0], P.CARVING[1]) < 130 || D(p, POUT.x, POUT.z) < 130; out.visible = nearOut; gateOut.visible = !!st.S.found;
      if (near) DG.update(p, 60);
      const night = (ctx.sky && ctx.sky.state.night) || 0; flies.visible = (near || (nearOut && night > 0.05)) && D(p, -140, -250) < 170;
      // tia nắng nghiêng theo hướng mặt trời (đặt lại khi nắng xoay > 3°)
      if (near && ctx.sky) { const sd = ctx.sky.state.sunDir, a = Math.atan2(sd.x, sd.z) + sd.y; if (Math.abs(a - sunA) > 0.05) { sunA = a; const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion().setFromUnitVectors(up, sd.clone().normalize());
          RAYS.forEach(([x, z], i) => { o.position.set(x - sd.x * 2, H(x, z) - 0.5, z - sd.z * 2); o.quaternion.copy(q); o.scale.set(1 + (i % 3) * 0.5, 26 + (i % 2) * 8, 1 + (i % 3) * 0.5); o.updateMatrix(); rays.setMatrixAt(i, o.matrix); }); o.rotation.set(0, 0, 0); rays.instanceMatrix.needsUpdate = true; } }
    }
    if (!near && !nearOut) return;
    const sky = ctx.sky && ctx.sky.state, night = sky ? sky.night : 0, hour = sky ? sky.hour : 12;
    ffMat.uniforms.uTime.value = t; ffMat.uniforms.uNight.value = Math.min(1, night * 1.6); ffMat.uniforms.uPx.value = ctx.renderer.getPixelRatio() * (ctx.resScale || 1); swirlMat.uniforms.uTime.value = t;
    if (ctx.offer && !ctx.player.frozen && !ui.busy && nearOut) {
      if (D(p, P.CARVING[0], P.CARVING[1]) < 2.8) ctx.offer('🔎 Xem hình khắc đá', () => { st.S.clues.carve = 1; st.save(); ctx.toast('🪨 ' + SIGN.carve, 9000); }, 4);
      if (st.S.found && D(p, POUT.x, POUT.z) < 2.6) ctx.offer('🌀 Cổng đá: tới Rừng Thiên Định', () => travel(PIN, '🌀 Cổng đá đưa em tới <b>Rừng Thiên Định</b>.'), 4);
    }
    if (!near) return;
    // ----- hình ảnh động -----
    windU.value = t; lakeU.uTime.value = t; mistMat.uniforms.uTime.value = t; rayMat.uniforms.uTime.value = t;
    const dayK = Math.max(0, 1 - night * 1.6), low2 = Math.max(0, 1 - Math.abs(hour - 12) / 6.5);
    rayMat.uniforms.uA.value = 0.34 * dayK * (0.618 + 0.382 * (1 - low2)) * (ctx.weather && ctx.weather.cur ? 1 - 0.7 * Math.max(ctx.weather.cur.r || 0, ctx.weather.cur.f || 0) : 1);
    mistMat.uniforms.uOpacity.value = 0.34 + 0.2 * Math.max(0, 1 - Math.abs(hour - 6.5) / 2.5) + 0.1 * night; mistMat.uniforms.uColor.value.setRGB(0.93, 0.96, 0.94).multiplyScalar(1 - night * 0.72);
    canopyMat.emissiveIntensity = 0.3 + 0.45 * night + 0.06 * Math.sin(t * 1.3); lakeU.uGlow.value = night;
    if (ctx.scene.fog) lakeU.uSky.value.copy(ctx.scene.fog.color).lerp(c.set('#ffffff'), 0.25 * (1 - night));
    const inB = P.inBowl(p.x, p.z, 4);
    if (inB || D(p, OX, OZ) < 60) {
      for (let i = 0; i < BF_N; i++) { const b = BF[i], a = t * 0.5 + b.ph, flap = 0.25 + Math.abs(Math.sin(t * 13 + b.ph)) * 0.9; o.position.set(b.x + Math.sin(a) * 2.4, P.BOWL.floor + 1.3 + Math.sin(t * 1.7 + b.ph) * 0.6 + (i % 3), b.z + Math.cos(a * 1.3) * 2.4); o.rotation.set(0, a + Math.PI / 2, 0); o.scale.set(flap * 1.3, 1.3, 1.3); o.updateMatrix(); bfly.setMatrixAt(i, o.matrix); }
      bfly.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < RB_N; i++) { const r = RB[i]; o.position.set(r.x, i === 13 && !st.S.wish ? -99 : r.y, r.z); o.rotation.set(Math.sin(t * 1.4 + r.ph) * 0.3, r.ph, Math.cos(t * 1.1 + r.ph) * 0.25); o.scale.setScalar(1); o.updateMatrix(); ribbons.setMatrixAt(i, o.matrix); }
      ribbons.instanceMatrix.needsUpdate = true; o.rotation.set(0, 0, 0);
      // hươu trắng: thong thả đi giữa 5 điểm, dừng gặm cỏ
      if (deer.root) { const [gx, gz] = deer.pts[deer.i], dx = gx - deer.x, dz = gz - deer.z, d = Math.hypot(dx, dz);
        if (deer.wait > 0) { deer.wait -= dt; if (deer.wait <= 0) deer.anim.play('Walk', 0.4); }
        else if (d < 0.6) { deer.i = (deer.i + 1 + Math.floor(rnd() * 3)) % deer.pts.length; deer.wait = 5 + rnd() * 8; deer.anim.play(rnd() < 0.6 ? 'Eating' : 'Idle_2', 0.4); }
        else { const v = 1.25 * dt; deer.x += dx / d * v; deer.z += dz / d * v; let da = Math.atan2(dx, dz) - deer.rot; da = Math.atan2(Math.sin(da), Math.cos(da)); deer.rot += da * Math.min(1, dt * 3); }
        deer.root.position.set(deer.x, H(deer.x, deer.z), deer.z); deer.root.rotation.y = deer.rot; deer.anim.update(dt); }
      // công: xoè đuôi khi em lại gần (trong 8 m)
      PEA.fan += ((D(p, PEA.x, PEA.z) < 8 ? 1 : 0.16) - PEA.fan) * Math.min(1, dt * 1.6); const tl = peacock.userData.tail; tl.scale.set(0.25 + 0.75 * PEA.fan, 0.45 + 0.55 * PEA.fan, 1); tl.rotation.x = -1.25 + 1.1 * PEA.fan; peacock.rotation.y = 1.1 + Math.sin(t * 0.4) * 0.2;
    }
    // ----- chuông gió ở cửa khe + ở đền -----
    if ((chimeT -= dt) <= 0) { chimeT = 2.6 + rnd() * 4.2; chimeAt(p.x, p.z, P.RAMP.x + 1.6, P.RAMP.z0 + 1.3, 34); chimeAt(p.x, p.z, CHIME[0], CHIME[1], 21); }
    // ----- bãi sương: sương đặc dần khi vào bãi; đi lạc khỏi dãy đèn > 6,2 m → sương đưa về đầu bãi -----
    const inFog = p.x > P.FOG.x0 && p.x < P.FOG.x1 && p.z > P.FOG.z0 && p.z < P.FOG.z1 && p.y > 5;
    { const now = performance.now(), rdt = Math.min(0.25, (now - fogT) / 1000); fogT = now; fogK += ((inFog ? 1 : 0) - fogK) * Math.min(1, rdt * 1.618); }
    if (fogK > 0.01 && scene.fog) { scene.fog.near += (3 - scene.fog.near) * fogK; scene.fog.far += (21 - scene.fog.far) * fogK; scene.fog.color.lerp(c.setRGB(0.86, 0.9, 0.88).multiplyScalar(1 - night * 0.7), fogK * 0.8); }
    if (!ui.busy && !ctx.player.frozen) {
      if (inFog && polyD(FOGLINE, p.x, p.z) > 6.2) back(P.FOG.in[0], P.FOG.in[1], -Math.PI / 2, '🌫️ <b>Em lạc trong sương!</b> Sương mù đưa em về đầu bãi.<br><small>Hãy đi từ <b>đèn đá</b> này tới đèn đá kế tiếp, và lắng nghe <b>tiếng chim</b> ở lối ra.</small>');
      for (const m of P.MIST) if (D(p, m[0], m[1]) < 2.3 && p.y > 5) { const f1 = m[2] === P.F1[0]; back(m[2], m[3], m[4], f1 ? '🌫️ <b>Lối này dẫn vòng lại!</b><br><small>Mặt Trời mọc ở hướng <b>Đông</b>. Trên la bàn đá, kim đỏ chỉ <b>Bắc</b> — Đông nằm bên phải khi em nhìn về Bắc.</small>' : '🌫️ <b>Lối này dẫn vòng lại!</b><br><small>Rêu mọc dày ở mặt <b>Bắc</b> thân cây. Quay lưng về phía rêu là hướng <b>Nam</b>.</small>'); break; }
      // khám phá: đặt chân xuống đáy thung lũng
      if (!st.S.found && P.inBowl(p.x, p.z, -1.5) && p.y < 8.5) discover();
    }
    // ----- nút hành động -----
    if (ctx.offer && !ctx.player.frozen && !ui.busy) {
      if (D(p, P.F1[0] + 2.5, P.F1[1] - 2.7) < 2.6) ctx.offer('📜 Đọc biển đá', () => ctx.toast(`☀️ <b>${SIGN.f1[0]}</b><br>${SIGN.f1[1].replace(/\n/g, ' ')}`, 8000), 4);
      if (D(p, P.F2[0] - 2.6, P.F2[1] - 2.7) < 2.6) ctx.offer('📜 Đọc biển đá', () => ctx.toast(`🌿 <b>${SIGN.f2[0]}</b><br>${SIGN.f2[1].replace(/\n/g, ' ')}`, 8000), 4);
      if (inB) {
        if (D(p, ALTAR[0], ALTAR[1]) < 2.6) ctx.offer(st.S.wish ? '🌟 Lời ước của em' : '🌟 Gửi lời ước', ui.openWish, 5);
        if (D(p, SEAT.x, SEAT.z) < 2.1) ctx.offer('🧘 Ngồi thở 1 phút', meditate, 5);
        for (const s of STELES) if (D(p, s.x, s.z) < 1.9) ctx.offer('📖 Đọc bia đá', () => readStele(s), 4);
        if (D(p, PIN.x, PIN.z) < 2.6) ctx.offer('🌀 Cổng đá: về Đền Tri Thức', () => travel(POUT, '🌀 Cổng đá đưa em về <b>Đền Tri Thức</b>. Lần sau cứ bước qua cổng này để trở lại rừng.'), 4);
      }
      const S = st.S.secrets, sec = (id, x, z, r, label) => { if (!S[id] && D(p, x, z) < r) ctx.offer(label, () => findSecret(id), 4); };
      sec('lotus', LOTUS[0], LOTUS[1], 2.8, '🔎 Ngắm đoá sen sáng'); sec('nest', NEST[0] + 1, NEST[1], 2.4, '🔎 Nhìn tổ chim'); sec('shroom', -145.5, P.CAVE.z, 2.6, '🔎 Xem nấm phát sáng');
      sec('spiral', GAR[0], GAR[1], 3.4, '🔎 Đếm vòng đá'); sec('fall', P.FALL.x + 2.9, P.FALL.z + 1.6, 2.4, '🔎 Nhìn sau màn thác'); sec('tracks', TRACKS[0] + 2, TRACKS[1] + 1, 2.6, '🔎 Xem dấu chân lạ');
      sec('rings', STUMP[0], STUMP[1], 2.5, '🔎 Đếm vòng năm'); sec('chime', CHIME[0] + 0.6, CHIME[1], 2.4, '🔎 Nghe chuông gió');
    }
    if (ui.breathing && (sitT -= dt) <= 0) { sitT = 0.8; ctx.player.emote && ctx.player.emote('floor'); }
  }
  // bản đồ M: giấu cả khối núi khi chưa tìm ra; tìm ra rồi thì có tên địa danh
  const api = { update, root, st, ui, plan: P, budget, mapHide: (x, z, deck) => !st.S.found && (deck ? x > -232 && x < -78 && z < -240.5 : P.destinyAt(x, z, 2.5)),   // deck: đá bước, cầu khỉ… cũng không vẽ lên bản đồ
    places: () => st.S.found ? [{ n: 'RỪNG THIÊN ĐỊNH', x: OX, z: OZ - 8, big: 2 }, { n: 'Cây Thiên Định', x: OX, z: OZ, ic: '🌟' }, { n: 'Cổng đá', x: POUT.x, z: POUT.z, ic: '🌀' }] : [],
    discover, findSecret, seat: SEAT, altar: ALTAR, steles: STELES, portal: { in: PIN, out: POUT }, secrets: SEC_POS };
  return (ctx.destiny = api);
}
