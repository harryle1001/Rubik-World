// academy/castle.js — LÂU ĐÀI HỌC VIỆN PHA LÊ (greybox đúng tỷ lệ): 4 dãy bao, 3 sân trong, đại sảnh vào được (bàn dài, nến bay),
// thư viện, nhà kính, sân luyện đũa, tháp thiên văn 89 m có ban công, 8 tháp phụ, cầu đá có mái 89 m sang Tháp Gió.
// Toạ độ cục bộ (plan.js): u = +z (nam, mặt tiền), v = +x (đông); mesh: x = v, z = u, y tuyệt đối.
// Va chạm: hộp thẳng trục (ctx.boxes); mặt đi trên cao (cầu, ban công): deckY(u, v).
import * as THREE from 'three';
import { Batch } from './geo.js';
import { PLAT, toWorld, heightLocal, CASTLE_L, TOWERS, WATCH, VIA } from './plan.js';
import { makeKit, deckAt, instMesh, COL, MERLON, ARCH_GEO } from './kit.js';
import { mat, matV } from '../sample/palette.js';
import { CFG } from '../config.js';
import { toon } from '../style.js';

const Y = PLAT.y, PHI = 1.618;
export const L = CASTLE_L;   // mặt bằng (m): plan.js
const C_WALL = COL.wall, C_WALL_D = COL.wallD, C_ROOF = COL.roof, C_ROOF_G = COL.roofG, C_WOOD = COL.wood, C_WOOD_L = COL.woodL, C_FLOOR = COL.floor, C_PAVE = COL.pave;
const ground = (u, v) => { const [x, z] = toWorld(u, v); return heightLocal(u, v, x, z); };

/** Dựng toàn bộ hình lâu đài vào các batch. far = true: chỉ khối ngoài (bóng xa). Trả về hộp va chạm cục bộ, chóp tháp, mặt cầu, instancing. */
function layout(B, far = false) {
  const { glow, glass } = B, wall = B.wall, roof = B.roof, win = B.win, seg = far ? 6 : 10;
  const K = makeKit(B, { far, Y, ground }), { boxes, tips, solid, winAt, range, tower } = K;
  const { box: X, H, T } = L;
  // --- 4 dãy bao quanh ---
  range(X.u1 - T, X.u1, -X.hv, X.hv, H, 8, [[-L.gate, L.gate]], 13, 1);                              // mặt tiền + cổng 11 × 13 m
  range(X.u0, X.u0 + T, -X.hv, X.hv, H, 8, [[-L.back, L.back]], 8, -1);                              // dãy sau + cổng sau 8 × 8 m
  range(X.u0, X.u1, -X.hv, -X.hv + T, H, 8, [[L.bridge.u - 3.5, L.bridge.u + 3.5]], 8, -1);          // dãy tây (cửa ra cầu)
  range(X.u0, X.u1, X.hv - T, X.hv, H, 8, [], 8, 1);                                                  // dãy đông
  // --- 2 dãy ngăn 3 sân (lối qua giữa) ---
  range(X.u0 + T, X.u1 - T, -40, -32, 13, 5, [[-L.pass, L.pass]]);
  range(X.u0 + T, X.u1 - T, 32, 40, 13, 5, [[-L.pass, L.pass]]);
  // --- tháp ---
  for (const [u, v, r, h, rh] of TOWERS) tower(u, v, r, h, rh, h > 40 ? C_ROOF : C_ROOF_G, h > 30 || Math.abs(v) < 20);
  // --- khối mái chồng lớp + tháp góc nhỏ trên nóc → bóng mái nhiều cấp ---
  for (const m of L.masses) K.mass(...m);
  for (const t of L.turrets) K.turret(...t);
  // --- tường thành + 8 tháp canh quanh mép vách ---
  const Cw = L.curtain, Bg0 = L.bridge;
  K.curtain(Cw, { front: [[-L.gate, L.gate]], back: [[-L.back, L.back]], west: [[Bg0.u - Bg0.w - 1, Bg0.u + Bg0.w + 1]], east: [] });
  for (const [u, v] of WATCH.at) K.watch(u, v, WATCH.r, WATCH.h);
  // --- cầu cạn nhiều nhịp vòm: đường băng → cổng sau (nhánh A dọc v, nhánh B dọc u) ---
  const vw = VIA.w, yA0 = ground(VIA.uA, VIA.vA0) + 0.3, sl = (Y - yA0) / (-vw - VIA.vA0 + VIA.uB1 - VIA.uA - vw), yC = yA0 + (-vw - VIA.vA0) * sl;
  K.arcade('v', VIA.vA0, -vw, VIA.uA, yA0, yC, vw);                 // nhánh A
  K.arcade('v', -vw, vw, VIA.uA, yC, yC, vw);                       // chiếu nghỉ ở góc
  K.arcade('u', VIA.uA + vw, VIA.uB1 + 1, 0, yC, Y + sl, vw);       // nhánh B → mép vách, cổng sau
  // tháp thiên văn: thân dưới r 8 tới 55 m, ban công r 10,5, thân trên r 6 tới 89 m, mái nón 21 m
  const A = L.astro;
  wall.cyl(A.v, Y - 3, A.u, A.r, A.h1 + 3, C_WALL, seg, A.r * 0.95);
  wall.cyl(A.v, Y + A.h1 - 0.5, A.u, A.deck, 0.8, C_WALL_D, seg + 6);
  if (!far) for (let k = 0; k < 21; k++) { const a = k / 21 * Math.PI * 2; wall.box(A.v + Math.cos(a) * 10.1 - 0.25, A.v + Math.cos(a) * 10.1 + 0.25, Y + A.h1 + 0.3, Y + A.h1 + 1.4, A.u + Math.sin(a) * 10.1 - 0.25, A.u + Math.sin(a) * 10.1 + 0.25, C_WALL_D); }
  wall.cyl(A.v, Y + A.h1, A.u, A.r2, A.h - A.h1, C_WALL, seg, A.r2 * 0.92);
  roof.cone(A.v, Y + A.h, A.u, A.r2 * 1.25, A.roof, C_ROOF, seg); tips.push([A.v, Y + A.h + A.roof, A.u]);
  for (let y = Y + 8; y < Y + A.h - 4; y += 8.4) { const R = (y < Y + A.h1 ? A.r : A.r2) * 0.97 + 0.02; if (far && y % 3 > 1) continue; winAt('u', A.u + R, 1, A.v, y, 1, 2.6); winAt('u', A.u - R, -1, A.v, y, 1, 2.6); winAt('v', A.v + R, 1, A.u, y, 1, 2.6); winAt('v', A.v - R, -1, A.u, y, 1, 2.6); }
  if (det) det.cyl(A.v, Y + A.h + A.roof - 0.4, A.u, 0.07, 5, C_WOOD, 5);
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
    for (const v of [Hh.v0 + t, Hh.v1 - t]) for (let u = Hh.u0 + 5; u < Hh.u1 - 3; u += 5.5) (win || glow).box(v - 0.08, v + 0.08, Y + 6, Y + 15, u - 0.9, u + 0.9, '#ffffff');   // cửa sổ cao
  }
  // --- thư viện 13 × 34 × 21 ---
  const Lb = L.library, lt = 1.2, lc = (Lb.v0 + Lb.v1) / 2;
  // thư viện rỗng (vào được, trong tối — nơi luyện phép "Sáng lên"): tường 1,2 m, cửa 5 × 6 m ở mặt trước
  for (const [a0, a1, b0, b1] of [[Lb.u0, Lb.u0 + lt, Lb.v0, Lb.v1], [Lb.u0, Lb.u1, Lb.v0, Lb.v0 + lt], [Lb.u0, Lb.u1, Lb.v1 - lt, Lb.v1], [Lb.u1 - lt, Lb.u1, Lb.v0, lc - 2.5], [Lb.u1 - lt, Lb.u1, lc + 2.5, Lb.v1]]) {
    wall.box(b0, b1, Y, Y + Lb.h, a0, a1, C_WALL); if (!far) solid(a0, a1, b0, b1, Y + Lb.h);
  }
  wall.box(lc - 2.5, lc + 2.5, Y + 6, Y + Lb.h, Lb.u1 - lt, Lb.u1, C_WALL);
  roof.gable(Lb.v0 - 0.6, Lb.v1 + 0.6, Lb.u0 - 0.6, Lb.u1 + 0.6, Y + Lb.h, 8, C_ROOF);
  if (!far) {
    wall.box(Lb.v0 + lt, Lb.v1 - lt, Y + Lb.h - 1, Y + Lb.h - 0.8, Lb.u0 + lt, Lb.u1 - lt, C_WOOD);              // trần gỗ (giữ bóng tối bên trong)
    for (const [v0, v1] of [[Lb.v0 + lt, Lb.v0 + lt + 0.8], [Lb.v1 - lt - 0.8, Lb.v1 - lt]]) {                   // kệ sách 2 bên
      wall.box(v0, v1, Y, Y + 5, Lb.u0 + 2, Lb.u1 - 2, C_WOOD);
      for (let y = 0.8; y < 5; y += 1.05) wall.box(v0 - 0.02, v1 + 0.02, Y + y, Y + y + 0.6, Lb.u0 + 2.2, Lb.u1 - 2.2, ['#7a3b2e', '#2e5a4a', '#3d4f7a', '#8a6a2e'][Math.round(y) % 4]);
      solid(Lb.u0 + 2, Lb.u1 - 2, v0, v1, Y + 5);
    }
    wall.box(Lb.v0 + 3, Lb.v1 - 3, Y, Y + 3.4, Lb.u0 + lt, Lb.u0 + lt + 0.8, C_WOOD); solid(Lb.u0 + lt, Lb.u0 + lt + 0.8, Lb.v0 + 3, Lb.v1 - 3, Y + 3.4);
  }
  if (!far) for (let v = Lb.v0 + 3; v < Lb.v1 - 2; v += 4) if (Math.abs(v - (Lb.v0 + Lb.v1) / 2) > 3.5) win.box(v - 0.8, v + 0.8, Y + 7, Y + 16, Lb.u1 + 0.02, Lb.u1 + 0.1, '#ffffff');
  // --- nhà kính 21 × 13: tường thấp + vòm kính bán trụ ---
  const G = L.green, gc = (G.v0 + G.v1) / 2, gr = (G.v1 - G.v0) / 2;
  wall.box(G.v0, G.v1, Y, Y + 1.5, G.u0, G.u1, C_PAVE);
  glass.add(new THREE.CylinderGeometry(gr, gr, G.u1 - G.u0, 12, 1, true, -Math.PI / 2, Math.PI), '#9fd9c4', gc, Y + 1.5, (G.u0 + G.u1) / 2, 0, -Math.PI / 2);
  if (!far) { solid(G.u0, G.u1, G.v0, G.v0 + 0.6, Y + 6); solid(G.u0, G.u1, G.v1 - 0.6, G.v1, Y + 6); solid(G.u0, G.u0 + 0.6, G.v0, G.v1, Y + 6); solid(G.u1 - 0.6, G.u1, G.v0, gc - 2, Y + 6); solid(G.u1 - 0.6, G.u1, gc + 2, G.v1, Y + 6); }
  // --- cầu đá có mái 89 m + Tháp Gió ---
  const Bg = L.bridge, bu = Bg.u, w = Bg.w;
  wall.box(Bg.v1, Bg.v0, Y - 1.2, Y, bu - w, bu + w, C_WALL);                                                     // mặt cầu
  for (const s of [-1, 1]) wall.box(Bg.v1, Bg.v0, Y, Y + 1.1, bu + s * w - 0.25, bu + s * w + 0.25, C_WALL_D);       // lan can
  K.arches('v', Bg.v1 + 6.5, Bg.v0, bu, Y, Y, w);                                                                    // nhịp vòm + trụ xuống đáy hồ
  if (!far) for (let v = Bg.v0 - 8; v > Bg.v1 + 3; v -= 13) for (const s of [-1, 1]) wall.box(v - 0.3, v + 0.3, Y + 1.1, Y + 5, bu + s * w - 0.3, bu + s * w + 0.3, C_WOOD);   // cột mái
  roof.gable(Bg.v1, Bg.v0, bu - w - 0.8, bu + w + 0.8, Y + 5, 3.1, C_ROOF_G);
  if (!far) wall.box(Bg.v1, Bg.v0, Y + 4.85, Y + 5, bu - w - 0.6, bu + w + 0.6, C_WOOD);   // trần gỗ dưới mái
  const [tu, tv, tr] = Bg.tower; tower(tu, tv, tr, 21, tr * PHI ** 3, C_ROOF_G, true);
  wall.cyl(tv, -4, tu, tr * 1.05, Y + 1, C_WALL_D, seg);                                                                 // chân Tháp Gió từ đáy hồ lên
  if (!far) for (const s of [-1, 1]) solid(bu + s * w - 0.25, bu + s * w + 0.25, Bg.v1 + 6, Bg.v0, Y + 1.1);
  // --- sân luyện đũa: vòng lát + 5 bia tập ---
  if (!far) {
    const Yd = L.yard;
    wall.add(new THREE.RingGeometry(Yd.r - 1.3, Yd.r, 34).rotateX(-Math.PI / 2), C_PAVE, Yd.v, Y + 0.06, Yd.u);
    wall.add(new THREE.CircleGeometry(3.4, 21).rotateX(-Math.PI / 2), '#c9a86a', Yd.v, Y + 0.07, Yd.u);
    for (let k = 0; k < 5; k++) { const a = Math.PI + (k - 2) * 0.5, bv = Yd.v + Math.sin(a) * 13, bu2 = Yd.u + Math.cos(a) * 13; wall.cyl(bv, Y, bu2, 0.12, 1.6, C_WOOD, 6); wall.add(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 13), k % 2 ? '#d8433a' : '#f3efe6', bv, Y + 1.9, bu2, 0, Math.PI / 2); }
  }
  return { boxes, tips, decks: K.decks, inst: K.inst };
}

/** Bóng xa: khối (1 geometry tô màu đỉnh) + ô cửa sổ (để sáng ban đêm) */
export function castleFarGeo() {
  const b = new Batch(), w = new Batch(), B = { wall: b, roof: b, glow: b, glass: b, win: w };
  layout(B, true); return { geo: b.build(), win: w.build() };
}

// ---------- vật liệu đá: A = toon thuần · B = toon + vân đá/rêu (canvas 512, chiếu tam diện theo toạ độ thế giới) ----------
export function stoneTexture() {
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); let s = 21;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#8c8880'; g.fillRect(0, 0, N, N);
  const rowH = 32;   // 16 hàng đá / 512 px; viên dài 55–89 px (Fibonacci), so le
  for (let y = 0; y < N; y += rowH) {
    let x = (y / rowH) % 2 ? -34 : 0;
    while (x < N) {
      const w = 55 + r() * 34, k = 118 + r() * 34 | 0, mo = r() < 0.18;
      g.fillStyle = `rgb(${k},${k - 3},${k - 9})`; g.fillRect(x + 2, y + 2, w - 3, rowH - 3);
      for (let i = 0; i < 21; i++) { const q = k - 21 + r() * 34 | 0; g.fillStyle = `rgba(${q},${q},${q - 6},.35)`; g.fillRect(x + 2 + r() * (w - 8), y + 2 + r() * (rowH - 8), 2 + r() * 8, 2 + r() * 5); }
      if (mo) { g.fillStyle = 'rgba(86,112,70,.45)'; g.fillRect(x + 2, y + rowH - 9, w - 3, 7); }
      x += w;
    }
  }
  for (let i = 0; i < 89; i++) { g.fillStyle = `rgba(70,96,60,${0.08 + r() * 0.14})`; g.beginPath(); g.arc(r() * N, r() * N, 4 + r() * 21, 0, 6.29); g.fill(); }   // vệt rêu loang
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let _tex = null;
export function stoneMaterial(look) {
  const m = toon('#ffffff', { vertexColors: true, unique: true });
  if (look !== 'b') return m;
  const U = { uStone: { value: _tex || (_tex = stoneTexture()) } };
  m.onBeforeCompile = sh => {
    sh.uniforms.uStone = U.uStone;
    sh.vertexShader = 'varying vec3 vSW; varying vec3 vSN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vSW = (modelMatrix * vec4(transformed, 1.0)).xyz; vSN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'uniform sampler2D uStone; varying vec3 vSW; varying vec3 vSN;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      { vec3 n = abs(vSN); n /= (n.x + n.y + n.z); float k = 0.19;   // 1 viên đá ~ 0,33 m cao
        vec3 t = texture2D(uStone, vSW.zy * k).rgb * n.x + texture2D(uStone, vSW.xz * k).rgb * n.y + texture2D(uStone, vSW.xy * k).rgb * n.z;
        vec3 c = diffuseColor.rgb; float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
        diffuseColor.rgb = mix(c, c * t * 1.72, 1.0 - smoothstep(0.07, 0.16, sat)); }`);
  };
  m.customProgramCacheKey = () => 'academy-stone-b';
  return m;
}
export const lookChoice = () => { let v = new URLSearchParams(location.search).get('castle'); try { if (v) localStorage.setItem('academy.look', v); else v = localStorage.getItem('academy.look'); } catch (e) {} return v === 'b' ? 'b' : 'a'; };

/** Lâu đài gần: trả về { group, boxes (thế giới), deckY(u,v), update(dt, t, playerPos) } */
export function buildCastle(ctx) {
  const B = { wall: new Batch(), roof: null, glow: new Batch(), glass: new Batch(), win: new Batch(), det: new Batch() }; B.roof = B.wall;
  const { boxes: local, tips, decks, inst } = layout(B), look = lookChoice(), stone = stoneMaterial(look);
  const g = new THREE.Group(); g.name = 'academy-castle';
  const add = (geo, m, shadow) => { const o = new THREE.Mesh(geo, m); o.castShadow = shadow; o.receiveShadow = true; o.matrixAutoUpdate = false; g.add(o); return o; };
  add(B.wall.build(), stone, true);
  const detail = add(B.det.build(), stone, true);
  const merl = instMesh(MERLON, C_WALL_D, inst.merlon, stone), arch = instMesh(ARCH_GEO, C_WALL, inst.arch, stone);   // răng cưa · nhịp vòm (instancing)
  g.add(merl, arch);
  add(B.glow.build(), mat('lampGlow'), false);
  const winMat = new THREE.MeshBasicMaterial({ color: '#2a3440' }), DAY = new THREE.Color('#2a3440'), NIGHT = new THREE.Color('#ffd98a');
  add(B.win.build(), winMat, false);
  add(B.glass.build(), new THREE.MeshToonMaterial({ color: '#9fd9c4', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }), false);
  // cờ đuôi nheo trên chóp tháp lớn
  const pen = new THREE.BufferGeometry(); pen.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.9, 0, 2.6, -0.45, 0], 3)); pen.computeVertexNormals();
  const flags = new THREE.InstancedMesh(pen, new THREE.MeshToonMaterial({ color: '#ffffff', side: THREE.DoubleSide }), tips.length);
  const fc = new THREE.Color(); tips.forEach((t, i) => flags.setColorAt(i, fc.set(['#c9302c', '#d4a24a', '#3d5a9a'][i % 3])));
  flags.frustumCulled = false; g.add(flags);
  const placeFlags = t => { tips.forEach(([x, y, z], i) => { o.position.set(x, y + 3.7, z); o.rotation.set(0, 0.6 + Math.sin(t * 1.3 + i) * 0.4, 0); o.scale.set(1 + Math.sin(t * 5 + i * 2) * 0.08, 1, 1); o.updateMatrix(); flags.setMatrixAt(i, o.matrix); }); flags.instanceMatrix.needsUpdate = true; };
  // nến bay trong đại sảnh: 89 cây (Fibonacci), lơ lửng 6–10 m, nhấp nhô
  const Hh = L.hall, N = CFG.isMobile ? 55 : 89, cw = new THREE.CylinderGeometry(0.07, 0.08, 0.34, 6), fl = new THREE.ConeGeometry(0.06, 0.16, 6);
  const wax = new THREE.InstancedMesh(cw, toon('#f6f1e6'), N), flame = new THREE.InstancedMesh(fl, mat('lampGlow'), N);
  const cand = []; let s = 89; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) cand.push({ v: Hh.v0 + 2 + rnd() * (Hh.v1 - Hh.v0 - 4), u: Hh.u0 + 3 + rnd() * (Hh.u1 - Hh.u0 - 6), y: Y + 6 + rnd() * 4, ph: rnd() * 6.28 });
  for (const m of [wax, flame]) { m.frustumCulled = false; g.add(m); }
  const o = new THREE.Object3D();
  const placeCandles = t => {
    o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
    cand.forEach((c, i) => { const y = c.y + Math.sin(t * 0.9 + c.ph) * 0.25; o.position.set(c.v, y, c.u); o.updateMatrix(); wax.setMatrixAt(i, o.matrix); o.position.y = y + 0.25; o.updateMatrix(); flame.setMatrixAt(i, o.matrix); });
    wax.instanceMatrix.needsUpdate = flame.instanceMatrix.needsUpdate = true;
  };
  placeFlags(0); placeCandles(0);
  // hộp va chạm → toạ độ thế giới
  const boxes = local.map(b => { const [x0, z0] = toWorld(b.u0, b.v0), [x1, z1] = toWorld(b.u1, b.v1); return { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), top: b.top }; });
  const A = L.astro, Bg = L.bridge;
  const deckY = (u, v) => {
    if (Math.abs(u - Bg.u) < Bg.w && v < Bg.v0 + 1 && v > Bg.v1 - 1) return Y;                       // mặt cầu có mái
    const d = Math.hypot(u - A.u, v - A.v); if (d < A.deck - 0.2 && d > A.r2) return Y + A.h1;         // ban công tháp thiên văn
    return deckAt(decks, u, v);                                                                        // cầu cạn nhiều nhịp vòm
  };
  const hc = toWorld((Hh.u0 + Hh.u1) / 2, 0), [bx0, bz0] = toWorld(L.box.u0, -L.box.hv), [bx1, bz1] = toWorld(L.box.u1, L.box.hv), cam = ctx.camera.position;
  return {
    group: g, boxes, deckY, L, look,
    update(dt, t, p) {
      const near = Math.hypot(p.x - hc[0], p.z - hc[1]) < 55; wax.visible = flame.visible = near; if (near) placeCandles(t);
      const dBox = Math.hypot(Math.max(bx0 - cam.x, 0, cam.x - bx1), Math.max(bz0 - cam.z, 0, cam.z - bz1));
      detail.visible = flags.visible = merl.visible = dBox < 144;                                                         // LOD: chi tiết chỉ trong 144 m
      if (flags.visible) placeFlags(t);
      const n = ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0; winMat.color.copy(DAY).lerp(NIGHT, Math.min(1, Math.max(0, (n - 0.12) / 0.5)));
    },
  };
}
