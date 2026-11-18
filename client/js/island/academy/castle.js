// academy/castle.js — LÂU ĐÀI HỌC VIỆN PHA LÊ (greybox đúng tỷ lệ): 4 dãy bao, 3 sân trong, đại sảnh vào được (bàn dài, nến bay),
// thư viện, nhà kính, sân luyện đũa, tháp thiên văn 89 m có ban công, 8 tháp phụ, cầu đá có mái 89 m sang Tháp Gió.
// Toạ độ cục bộ (plan.js): u = +z (nam, mặt tiền), v = +x (đông); mesh: x = v, z = u, y tuyệt đối.
// Va chạm: hộp thẳng trục (ctx.boxes); mặt đi trên cao (cầu, ban công): deckY(u, v).
import * as THREE from 'three';
import { Batch } from './geo.js';
import { PLAT, toWorld } from './plan.js';
import { mat, matV } from '../sample/palette.js';
import { CFG } from '../config.js';
import { toon } from '../style.js';

const Y = PLAT.y, PHI = 1.618;
// ---------- mặt bằng (m) ----------
export const L = {
  box: { u0: -106, u1: 38, hv: 116.5 },                     // khung 144 × 233 (233/144 ≈ φ)
  H: 21, T: 8,                                               // cao dãy nhà, dày dãy
  gate: 5.5,                                                 // nửa bề rộng cổng chính (11 m)
  pass: 5,                                                   // nửa bề rộng lối giữa các sân
  hall: { u0: -89, u1: -55, v0: -10.5, v1: 10.5, h: 21, door: 3 },   // đại sảnh 34 × 21 × 21
  library: { u0: -98, u1: -85, v0: 55, v1: 89, h: 21 },              // thư viện 13 × 34
  green: { u0: -21, u1: 0, v0: 68, v1: 81 },                         // nhà kính 21 × 13
  yard: { u: -8, v: -74, r: 21 },                                    // sân luyện đũa (tròn r 21)
  astro: { u: -80, v: -74, r: 8, h1: 55, r2: 6, h: 89, roof: 21, deck: 10.5 },   // tháp thiên văn
  bridge: { u: -55, w: 2.5, v0: -116.5, v1: -205.5, tower: [-55, -211, 6.5] },  // cầu có mái 89 m + Tháp Gió
};
// 8 tháp phụ: [u, v, r, cao thân, cao mái] — mái nón nhọn cao r·φ³
const TW = [
  [38, -116.5, 6.5, 55], [38, 116.5, 6.5, 55], [-106, -116.5, 6.5, 55], [-106, 116.5, 6.5, 55],
  [38, -12, 5, 34], [38, 12, 5, 34], [-34, -116.5, 5, 34], [-34, 116.5, 5, 34],
].map(t => [...t, t[2] * PHI ** 3]);

const C_WALL = '#9f9a92', C_WALL_D = '#7f7a73', C_ROOF = '#3f4a56', C_ROOF_G = '#4f6f66', C_WOOD = '#6e4a30', C_WOOD_L = '#a8744a', C_FLOOR = '#8d857a', C_PAVE = '#b3aca0';

/** Dựng toàn bộ hình lâu đài vào các batch. far = true: chỉ khối ngoài (bóng xa). Trả về danh sách hộp va chạm cục bộ. */
function layout(B, far = false) {
  const { wall, roof, glow, glass } = B, boxes = [], seg = far ? 6 : 10;
  const solid = (u0, u1, v0, v1, top) => boxes.push({ u0, u1, v0, v1, top });
  // dãy nhà dọc trục u hoặc v, có các khoảng hở (cửa) [a, b] dọc chiều dài, cao cửa dh
  const range = (u0, u1, v0, v1, h, rh, gaps = [], dh = 8) => {
    const alongV = v1 - v0 > u1 - u0, a0 = alongV ? v0 : u0, a1 = alongV ? v1 : u1;
    const seg2 = (a, b, y0, y1) => alongV ? wall.box(a, b, y0, y1, u0, u1, C_WALL) : wall.box(v0, v1, y0, y1, a, b, C_WALL);
    let s = a0;
    for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) {
      if (g0 > s) { seg2(s, g0, Y, Y + h); if (!far) solid(...(alongV ? [u0, u1, s, g0] : [s, g0, v0, v1]), Y + h); }
      seg2(g0, g1, Y + dh, Y + h); s = g1;                                                   // lanh tô trên cửa (không va chạm)
    }
    if (a1 > s) { seg2(s, a1, Y, Y + h); if (!far) solid(...(alongV ? [u0, u1, s, a1] : [s, a1, v0, v1]), Y + h); }
    roof.gable(v0 - 0.6, v1 + 0.6, u0 - 0.6, u1 + 0.6, Y + h, rh, C_ROOF);
    if (!far) wall.box(v0 - 0.3, v1 + 0.3, Y + h - 0.6, Y + h, u0 - 0.3, u1 + 0.3, C_WALL_D);   // gờ mái
  };
  const tower = (u, v, r, h, rh, col = C_ROOF) => {
    wall.cyl(v, Y - 3, u, r, h + 3, C_WALL, seg, r * 0.94);
    if (!far) wall.cyl(v, Y + h - 1.2, u, r * 1.08, 1.2, C_WALL_D, seg);                           // gờ đỉnh
    roof.cone(v, Y + h, u, r * 1.12, rh, col, seg);
    if (!far) solid(u - r, u + r, v - r, v + r, Y + h);
  };
  const { box: X, H, T } = L;
  // --- 4 dãy bao quanh ---
  range(X.u1 - T, X.u1, -X.hv, X.hv, H, 8, [[-L.gate, L.gate]], 13);                                 // mặt tiền + cổng 11 × 13 m
  range(X.u0, X.u0 + T, -X.hv, X.hv, H, 8);                                                          // dãy sau
  range(X.u0, X.u1, -X.hv, -X.hv + T, H, 8, [[L.bridge.u - 3.5, L.bridge.u + 3.5]]);                 // dãy tây (cửa ra cầu)
  range(X.u0, X.u1, X.hv - T, X.hv, H, 8);                                                           // dãy đông
  // --- 2 dãy ngăn 3 sân (lối qua giữa) ---
  range(X.u0 + T, X.u1 - T, -40, -32, 13, 5, [[-L.pass, L.pass]]);
  range(X.u0 + T, X.u1 - T, 32, 40, 13, 5, [[-L.pass, L.pass]]);
  // --- tháp ---
  for (const [u, v, r, h, rh] of TW) tower(u, v, r, h, rh, h > 40 ? C_ROOF : C_ROOF_G);
  // tháp thiên văn: thân dưới r 8 tới 55 m, ban công r 10,5, thân trên r 6 tới 89 m, mái nón 21 m
  const A = L.astro;
  wall.cyl(A.v, Y - 3, A.u, A.r, A.h1 + 3, C_WALL, seg, A.r * 0.95);
  wall.cyl(A.v, Y + A.h1 - 0.5, A.u, A.deck, 0.8, C_WALL_D, seg + 6);
  if (!far) for (let k = 0; k < 21; k++) { const a = k / 21 * Math.PI * 2; wall.box(A.v + Math.cos(a) * 10.1 - 0.25, A.v + Math.cos(a) * 10.1 + 0.25, Y + A.h1 + 0.3, Y + A.h1 + 1.4, A.u + Math.sin(a) * 10.1 - 0.25, A.u + Math.sin(a) * 10.1 + 0.25, C_WALL_D); }
  wall.cyl(A.v, Y + A.h1, A.u, A.r2, A.h - A.h1, C_WALL, seg, A.r2 * 0.92);
  roof.cone(A.v, Y + A.h, A.u, A.r2 * 1.25, A.roof, C_ROOF, seg);
  if (!far) { solid(A.u - A.r, A.u + A.r, A.v - A.r, A.v + A.r, Y + A.h1); solid(A.u - A.r2, A.u + A.r2, A.v - A.r2, A.v + A.r2, Y + A.h); }
  // --- đại sảnh 34 × 21 × 21, mái dốc cao 13 ---
  const Hh = L.hall, t = 1.6;
  wall.box(Hh.v0, Hh.v1, Y, Y + Hh.h, Hh.u0, Hh.u0 + t, C_WALL);                                     // tường sau
  wall.box(Hh.v0, Hh.v0 + t, Y, Y + Hh.h, Hh.u0, Hh.u1, C_WALL); wall.box(Hh.v1 - t, Hh.v1, Y, Y + Hh.h, Hh.u0, Hh.u1, C_WALL);
  wall.box(Hh.v0, -Hh.door, Y, Y + Hh.h, Hh.u1 - t, Hh.u1, C_WALL); wall.box(Hh.door, Hh.v1, Y, Y + Hh.h, Hh.u1 - t, Hh.u1, C_WALL);
  wall.box(-Hh.door, Hh.door, Y + 8, Y + Hh.h, Hh.u1 - t, Hh.u1, C_WALL);                              // lanh tô cửa 6 × 8 m
  roof.gable(Hh.v0 - 0.8, Hh.v1 + 0.8, Hh.u0 - 0.8, Hh.u1 + 0.8, Y + Hh.h, 13, C_ROOF);
  if (!far) {
    solid(Hh.u0, Hh.u0 + t, Hh.v0, Hh.v1, Y + Hh.h); solid(Hh.u0, Hh.u1, Hh.v0, Hh.v0 + t, Y + Hh.h); solid(Hh.u0, Hh.u1, Hh.v1 - t, Hh.v1, Y + Hh.h);
    solid(Hh.u1 - t, Hh.u1, Hh.v0, -Hh.door, Y + Hh.h); solid(Hh.u1 - t, Hh.u1, Hh.door, Hh.v1, Y + Hh.h);
    wall.box(Hh.v0 + t, Hh.v1 - t, Y, Y + 0.12, Hh.u0 + t, Hh.u1 - t, C_FLOOR);                           // sàn
    // 4 bàn dài + ghế băng (dọc u), bàn giáo viên ngang ở cuối
    for (const v of [-6.5, -2.2, 2.2, 6.5]) {
      wall.box(v - 0.55, v + 0.55, Y + 0.7, Y + 0.8, Hh.u0 + 8, Hh.u1 - 4, C_WOOD_L); wall.box(v - 0.4, v + 0.4, Y, Y + 0.7, Hh.u0 + 8, Hh.u1 - 4, C_WOOD);
      for (const s of [-1, 1]) wall.box(v + s * 1.0 - 0.2, v + s * 1.0 + 0.2, Y, Y + 0.45, Hh.u0 + 8, Hh.u1 - 4, C_WOOD);
      solid(Hh.u0 + 8, Hh.u1 - 4, v - 0.55, v + 0.55, Y + 0.8);
    }
    wall.box(-6, 6, Y, Y + 0.6, Hh.u0 + 2, Hh.u0 + 5, '#9a9286'); wall.box(-5, 5, Y + 0.6, Y + 1.4, Hh.u0 + 2.6, Hh.u0 + 4, C_WOOD_L);   // bục + bàn giáo viên
    solid(Hh.u0 + 2, Hh.u0 + 5, -6, 6, Y + 1.4);
    for (const v of [Hh.v0 + t, Hh.v1 - t]) for (let u = Hh.u0 + 5; u < Hh.u1 - 3; u += 5.5) glow.box(v - 0.08, v + 0.08, Y + 6, Y + 15, u - 0.9, u + 0.9, '#ffe3a0');   // cửa sổ cao (ánh vàng)
  }
  // --- thư viện 13 × 34 × 21 ---
  const Lb = L.library;
  range(Lb.u0, Lb.u1, Lb.v0, Lb.v1, Lb.h, 8, far ? [] : [[69, 75]], 6);
  if (!far) for (let v = Lb.v0 + 3; v < Lb.v1 - 2; v += 4) glow.box(v - 0.8, v + 0.8, Y + 7, Y + 16, Lb.u1 + 0.02, Lb.u1 + 0.1, '#ffe3a0');
  // --- nhà kính 21 × 13: tường thấp + vòm kính bán trụ ---
  const G = L.green, gc = (G.v0 + G.v1) / 2, gr = (G.v1 - G.v0) / 2;
  wall.box(G.v0, G.v1, Y, Y + 1.5, G.u0, G.u1, C_PAVE);
  glass.add(new THREE.CylinderGeometry(gr, gr, G.u1 - G.u0, 12, 1, true, -Math.PI / 2, Math.PI), '#9fd9c4', gc, Y + 1.5, (G.u0 + G.u1) / 2, 0, -Math.PI / 2);
  if (!far) { solid(G.u0, G.u1, G.v0, G.v0 + 0.6, Y + 6); solid(G.u0, G.u1, G.v1 - 0.6, G.v1, Y + 6); solid(G.u0, G.u0 + 0.6, G.v0, G.v1, Y + 6); solid(G.u1 - 0.6, G.u1, G.v0, gc - 2, Y + 6); solid(G.u1 - 0.6, G.u1, gc + 2, G.v1, Y + 6); }
  // --- cầu đá có mái 89 m + Tháp Gió ---
  const Bg = L.bridge, bu = Bg.u, w = Bg.w;
  wall.box(Bg.v1, Bg.v0, Y - 1.2, Y, bu - w, bu + w, C_WALL);                                                     // mặt cầu
  for (const s of [-1, 1]) wall.box(Bg.v1, Bg.v0, Y, Y + 1.1, bu + s * w - 0.25, bu + s * w + 0.25, C_WALL_D);       // lan can
  for (let v = Bg.v0 - 8; v > Bg.v1 + 3; v -= 13) {                                                                  // trụ vòm xuống đáy hồ
    wall.box(v - 1.6, v + 1.6, -4, Y - 1.2, bu - w - 0.6, bu + w + 0.6, C_WALL_D);
    if (!far) for (const s of [-1, 1]) wall.box(v - 0.3, v + 0.3, Y + 1.1, Y + 5, bu + s * w - 0.3, bu + s * w + 0.3, C_WOOD);   // cột mái
  }
  roof.gable(Bg.v1, Bg.v0, bu - w - 0.8, bu + w + 0.8, Y + 5, 3.1, C_ROOF_G);
  if (!far) wall.box(Bg.v1, Bg.v0, Y + 4.85, Y + 5, bu - w - 0.6, bu + w + 0.6, C_WOOD);   // trần gỗ dưới mái
  const [tu, tv, tr] = Bg.tower; tower(tu, tv, tr, 21, tr * PHI ** 3, C_ROOF_G);
  wall.cyl(tv, -4, tu, tr * 1.05, Y + 1, C_WALL_D, seg);                                                                 // chân Tháp Gió từ đất lên
  if (!far) for (const s of [-1, 1]) solid(bu + s * w - 0.25, bu + s * w + 0.25, Bg.v1 + 6, Bg.v0, Y + 1.1);
  // --- sân luyện đũa: vòng lát + 5 bia tập ---
  if (!far) {
    const Yd = L.yard;
    wall.add(new THREE.RingGeometry(Yd.r - 1.3, Yd.r, 34).rotateX(-Math.PI / 2), C_PAVE, Yd.v, Y + 0.06, Yd.u);
    wall.add(new THREE.CircleGeometry(3.4, 21).rotateX(-Math.PI / 2), '#c9a86a', Yd.v, Y + 0.07, Yd.u);
    for (let k = 0; k < 5; k++) { const a = Math.PI + (k - 2) * 0.5, bv = Yd.v + Math.sin(a) * 13, bu2 = Yd.u + Math.cos(a) * 13; wall.cyl(bv, Y, bu2, 0.12, 1.6, C_WOOD, 6); wall.add(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 13), k % 2 ? '#d8433a' : '#f3efe6', bv, Y + 1.9, bu2, 0, Math.PI / 2); }
  }
  return boxes;
}

/** Bóng xa / khối đơn giản: gộp tất cả thành 1 geometry tô màu đỉnh */
export function castleFarGeo() {
  const b = new Batch(), B = { wall: b, roof: b, glow: b, glass: b };
  layout(B, true); return b.build();
}

/** Lâu đài gần: trả về { group, boxes (thế giới), deckY(u,v), update(dt, t, playerPos) } */
export function buildCastle(ctx) {
  const B = { wall: new Batch(), roof: null, glow: new Batch(), glass: new Batch() }; B.roof = B.wall;
  const local = layout(B);
  const g = new THREE.Group(); g.name = 'academy-castle';
  const add = (geo, m, shadow) => { const o = new THREE.Mesh(geo, m); o.castShadow = shadow; o.receiveShadow = true; o.matrixAutoUpdate = false; g.add(o); return o; };
  add(B.wall.build(), matV(), true);
  add(B.glow.build(), mat('lampGlow'), false);
  add(B.glass.build(), new THREE.MeshToonMaterial({ color: '#9fd9c4', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }), false);
  // nến bay trong đại sảnh: 89 cây (Fibonacci), lơ lửng 6–10 m, nhấp nhô
  const Hh = L.hall, N = CFG.isMobile ? 55 : 89, cw = new THREE.CylinderGeometry(0.07, 0.08, 0.34, 6), fl = new THREE.ConeGeometry(0.06, 0.16, 6);
  const wax = new THREE.InstancedMesh(cw, toon('#f6f1e6'), N), flame = new THREE.InstancedMesh(fl, mat('lampGlow'), N);
  const cand = []; let s = 89; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) cand.push({ v: Hh.v0 + 2 + rnd() * (Hh.v1 - Hh.v0 - 4), u: Hh.u0 + 3 + rnd() * (Hh.u1 - Hh.u0 - 6), y: Y + 6 + rnd() * 4, ph: rnd() * 6.28 });
  for (const m of [wax, flame]) { m.frustumCulled = false; g.add(m); }
  const o = new THREE.Object3D();
  const placeCandles = t => {
    cand.forEach((c, i) => { const y = c.y + Math.sin(t * 0.9 + c.ph) * 0.25; o.position.set(c.v, y, c.u); o.updateMatrix(); wax.setMatrixAt(i, o.matrix); o.position.y = y + 0.25; o.updateMatrix(); flame.setMatrixAt(i, o.matrix); });
    wax.instanceMatrix.needsUpdate = flame.instanceMatrix.needsUpdate = true;
  };
  placeCandles(0);
  // hộp va chạm → toạ độ thế giới
  const boxes = local.map(b => { const [x0, z0] = toWorld(b.u0, b.v0), [x1, z1] = toWorld(b.u1, b.v1); return { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), top: b.top }; });
  const A = L.astro, Bg = L.bridge;
  const deckY = (u, v) => {
    if (Math.abs(u - Bg.u) < Bg.w && v < Bg.v0 + 1 && v > Bg.v1 - 1) return Y;                       // mặt cầu
    const d = Math.hypot(u - A.u, v - A.v); if (d < A.deck - 0.2 && d > A.r2) return Y + A.h1;         // ban công tháp thiên văn
    return null;
  };
  let near = false;
  const hc = toWorld((Hh.u0 + Hh.u1) / 2, 0);
  return {
    group: g, boxes, deckY, L,
    update(dt, t, p) { near = Math.hypot(p.x - hc[0], p.z - hc[1]) < 55; wax.visible = flame.visible = near; if (near) placeCandles(t); },
  };
}
