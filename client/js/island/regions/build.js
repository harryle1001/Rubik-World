// regions/build.js — DỰNG HÌNH 4 VÙNG MỚI (greybox gộp khối: 1 draw call / nhóm + model CC0 kit/*.glb qua instancing).
// Mỗi vùng 2 tầng chi tiết (LOD theo chunk, regions/index.js gọi):
//   t1(): mặt đất + công trình chính + biển tên (dựng khi cách mép vùng < 377 m) → { group, boxes, update }
//   t2(group): cây, đá, san hô, đồ vật nhỏ (dựng khi cách mép < 144 m; model CC0 Quaternius/Kenney/KayKit)
import * as THREE from 'three';
import { Batch } from '../academy/geo.js';
import { matV, mat } from '../sample/palette.js';
import { placeKit } from '../kit.js';
import { scatterModel } from '../models.js';
import { CFG } from '../config.js';
import { fbm } from '../terrain.js';
import { PEAK, SNOW_Y, TERRACE, ISLETS, REEF_Y, FUT_Y, FUT_RW } from './plan.js';

const C = new THREE.Color(), C2 = new THREE.Color();
const glowM = () => new THREE.MeshBasicMaterial({ vertexColors: true });
let seed = 21; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- mặt đất vùng: lưới vuông tô màu đỉnh theo độ cao/độ dốc ----------
function ground(R, color, seg) {
  const S = 2 * (R.R + 34), n = seg || (CFG.isMobile ? 72 : 104), g = new THREE.PlaneGeometry(S, S, n, n); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), v = p.getZ(i), h = R.h(u, v), sl = Math.hypot(R.h(u + 1.5, v) - R.h(u - 1.5, v), R.h(u, v + 1.5) - R.h(u, v - 1.5)) / 3;
    p.setY(i, h); color(C, h, u, v, sl); col.set([C.r, C.g, C.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, matV()); m.receiveShadow = true; m.name = 'region-ground-' + R.id; return m;
}
const sandOrSea = (c, h) => h < -0.4 ? c.set('#3f8fa0').lerp(C2.set('#24546e'), Math.min(1, (-0.4 - h) / 7)) : h < 1.3 ? c.set('#ead9a6') : null;

// biển tên (chữ trên nền tím than, viền bo tròn) — 1 sprite
export function sign(text, w = 8.1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
  k.font = 'bold 40px system-ui'; k.fillStyle = 'rgba(27,22,38,.8)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill();
  k.fillStyle = '#ffe3a0'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 49, 460);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false })); sp.scale.set(w, w * 0.185, 1); return sp;
}
const meshes = (g, b, glow) => { const m = new THREE.Mesh(b.build(), matV()); m.castShadow = m.receiveShadow = true; g.add(m); if (glow && glow.list.length) g.add(new THREE.Mesh(glow.build(), glowM())); return m; };
// hộp va chạm (toạ độ thế giới) cho người đi bộ + máy bay leo qua (aircraft.js roofAt)
const boxW = (R, u0, u1, v0, v1, top) => ({ x0: R.c[0] + u0, x1: R.c[0] + u1, z0: R.c[1] + v0, z1: R.c[1] + v1, top });
// rải model kit trên mặt đất vùng: n điểm thoả ok(u, v, h)
function spots(R, n, ok, r0 = 0, r1 = R.R, tries = 40) {
  const out = [];
  for (let i = 0; i < n * tries && out.length < n; i++) { const a = rnd() * 6.283, r = r0 + Math.sqrt(rnd()) * (r1 - r0), u = Math.cos(a) * r, v = Math.sin(a) * r, h = R.h(u, v); if (ok(u, v, h)) out.push([u, h, v, 0.8 + rnd() * 0.5, rnd() * 6.28]); }
  return out;
}

// ======================= 🏔️ NÚI TUYẾT & ĐÀI KHÍ TƯỢNG =======================
function snow(R) {
  const t1 = () => {
    const g = new THREE.Group(), b = new Batch(), glow = new Batch(), Y = PEAK, boxes = [];
    g.add(ground(R, (c, h, u, v, sl) => {
      if (sandOrSea(c, h)) return;
      const sn = SNOW_Y + (fbm(u * 0.05, v * 0.05) - 0.5) * 8;
      if (h > sn && sl < 1.1) return c.set('#f4f7fa').lerp(C2.set('#d6e4ee'), Math.min(1, sl));
      if (sl > 0.75 || h > 13) return c.set('#9a9286').lerp(C2.set('#7fbf5e'), Math.max(0, 1 - h / 21) * (1 - Math.min(1, sl)));
      c.set('#7fbf5e').lerp(C2.set('#5a9a48'), fbm(u * 0.08, v * 0.08));
    }));
    // đỉnh: sân bê tông r 8 + nhà đài 8 × 5 × 3,4 m (8/5 ≈ φ) + vòm ra-đa + lều khí tượng chớp trắng + thùng đo mưa
    b.cyl(0, Y - 0.6, 0, 8, 0.75, '#bdb2a0', 21);
    b.box(-6.5, 1.5, Y, Y + 3.4, -8, -3, '#efe3c8'); b.box(-6.8, 1.8, Y + 3.4, Y + 3.7, -8.3, -2.7, '#948a7b');
    b.box(-3.2, -1.6, Y, Y + 2.1, -3.02, -2.9, '#6e4a30'); for (const x of [-5.6, 0]) b.box(x, x + 1.3, Y + 1.2, Y + 2.5, -3.0, -2.92, '#8fb9cc');
    b.cyl(-4, Y + 3.7, -5.5, 0.5, 2.6, '#d9c8a6', 8); b.add(new THREE.SphereGeometry(1.6, 13, 8, 0, 6.29, 0, 1.75), '#f7efdc', -4, Y + 6.3, -5.5);   // tháp + vòm ra-đa
    for (const [x, z] of [[3.2, 2.6], [4.4, 2.6], [3.2, 3.6], [4.4, 3.6]]) b.box(x - 0.05, x + 0.05, Y, Y + 1.2, z - 0.05, z + 0.05, '#f3ead6');
    b.box(2.9, 4.7, Y + 1.2, Y + 2.1, 2.3, 3.9, '#f7efdc'); b.gable(2.8, 4.8, 2.2, 4.0, Y + 2.1, 0.4, '#d9c8a6');   // lều khí tượng (nhiệt kế, ẩm kế)
    b.cyl(-2, Y, 4, 0.25, 0.9, '#5a5266', 8);                                                                           // thùng đo mưa
    b.cyl(5.5, Y, -2, 0.12, 8, '#5a5266', 6);                                                                           // cột gió 8 m
    b.box(5.5, 7.2, Y + 7.6, Y + 7.7, -2.05, -1.95, '#c45a3a');                                                         // cánh hướng gió
    boxes.push(boxW(R, -6.8, 1.8, -8.3, -2.7, Y + 3.7));
    // cáp treo: ga chân núi (gần điểm 🌡️) → đỉnh; dây cáp + ca-bin chạy
    const A = [34, 1.6, 118], Bt = [8, Y, 6];
    b.box(A[0] - 3, A[0] + 3, A[1], A[1] + 4.2, A[2] - 2.5, A[2] + 2.5, '#efe3c8'); b.gable(A[0] - 3.4, A[0] + 3.4, A[2] - 2.9, A[2] + 2.9, A[1] + 4.2, 1.6, '#c45a3a');
    boxes.push(boxW(R, A[0] - 3, A[0] + 3, A[2] - 2.5, A[2] + 2.5, A[1] + 5.8));
    const cab = new THREE.Vector3(A[0], A[1] + 5, A[2]), cbt = new THREE.Vector3(Bt[0], Bt[1] + 3.4, Bt[2]), L = cab.distanceTo(cbt);
    const wire = new THREE.CylinderGeometry(0.05, 0.05, L, 4); wire.rotateX(Math.PI / 2); wire.lookAt(new THREE.Vector3().subVectors(cbt, cab));
    b.add(wire, '#3a3344', (cab.x + cbt.x) / 2, (cab.y + cbt.y) / 2, (cab.z + cbt.z) / 2);
    b.cyl(Bt[0], Y, Bt[2], 0.3, 4, '#5a5266', 6);
    // người tuyết (3) quanh đường tuyết
    for (const [u, v] of [[-34, 52], [40, -38], [-48, -30]]) { const h = R.h(u, v); b.add(new THREE.SphereGeometry(0.8, 8, 6), '#f7efdc', u, h + 0.6, v); b.add(new THREE.SphereGeometry(0.55, 8, 6), '#f7efdc', u, h + 1.7, v); b.add(new THREE.ConeGeometry(0.08, 0.35, 5), '#e07a2e', u, h + 1.75, v + 0.6, 0, Math.PI / 2); }
    meshes(g, b, glow);
    // phong kế (chong chóng đo gió): 3 tay + 3 chén, quay theo gió
    const an = new Batch(); for (let k = 0; k < 3; k++) { const a = k * 2.094; an.add(new THREE.BoxGeometry(0.06, 0.06, 0.9), '#3a3344', Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45, a); an.add(new THREE.SphereGeometry(0.16, 6, 4, 0, 6.29, 0, 1.6), '#f7efdc', Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9, a, 0, Math.PI / 2); }
    const cups = new THREE.Mesh(an.build(), matV()); cups.position.set(5.5, Y + 8.2, -2); g.add(cups);
    const cabin = new THREE.Mesh(new Batch().box(-0.9, 0.9, -1.6, 0, -0.7, 0.7, '#c45a3a').box(-0.92, 0.92, -1.2, -0.5, -0.72, 0.72, '#8fb9cc').cyl(0, 0, 0, 0.05, 0.9, '#3a3344', 4).build(), matV()); g.add(cabin);
    const sp = sign('🏔️ Núi Tuyết · Đài khí tượng'); sp.position.set(0, 7, R.R - 6); g.add(sp);
    const sp2 = sign('🚡 Cáp treo lên đỉnh', 5.3); sp2.position.set(A[0], A[1] + 7.4, A[2]); g.add(sp2);
    let ct = 0;
    return { group: g, boxes, cable: { A: [A[0], A[2]], top: [Bt[0] - 3, Bt[2] + 1] }, update(dt, t, wind) {
      cups.rotation.y += dt * (2 + wind * 13);
      ct = (ct + dt / 21) % 2; const k = ct < 1 ? ct : 2 - ct; cabin.position.lerpVectors(cab, cbt, k);
    } };
  };
  const t2 = g => [
    placeKit(g, 'qn_pine_a', spots(R, 55, (u, v, h) => h > 2 && h < 26 && Math.hypot(u - 34, v - 118) > 8, 21)),
    placeKit(g, 'tree_pine_tall', spots(R, 21, (u, v, h) => h > 1.8 && h < 13, 55)),
    placeKit(g, 'rock_large', spots(R, 13, (u, v, h) => h > 13 && h < 45, 13), { shadow: false }),
  ];
  return { t1, t2 };
}

// ======================= 🏮 LÀNG CỔ VIỆT NAM =======================
function village(R) {
  const t1 = () => {
    const g = new THREE.Group(), b = new Batch(), glow = new Batch(), boxes = [], Y = 1.6;
    g.add(ground(R, (c, h, u, v, sl) => {
      if (Math.hypot(u - 34, v - 34) < 9 && h < 1.4) return c.set('#4f8a7a');                 // ao làng
      if (sandOrSea(c, h)) return;
      if (h > Y + 0.5) { const k = Math.floor((h - Y) / TERRACE); return sl > 0.25 ? c.set('#8a6a3e') : c.set(k % 2 ? '#9fd06a' : '#a9d8c6'); }   // bờ ruộng · ruộng lúa / ruộng nước
      if (Math.abs(u - 34) < 11 && v > -16 && v < -4) return c.set('#c9a27a');              // sân đình lát gạch
      c.set('#86c25c').lerp(C2.set('#6aa84f'), fbm(u * 0.07, v * 0.07));
    }, CFG.isMobile ? 96 : 128));
    // ĐÌNH LÀNG 13 × 8 m: nền đá 3 bậc, 4 × 3 cột gỗ lim, mái ngói 2 tầng, 4 đầu đao cong
    const D = [34, -34], du = 6.5, dv = 4;
    for (let s = 0; s < 3; s++) b.box(D[0] - du - 1.6 + s * 0.4, D[0] + du + 1.6 - s * 0.4, Y + s * 0.15, Y + (s + 1) * 0.15, D[1] - dv - 1.6 + s * 0.4, D[1] + dv + 1.6 - s * 0.4, '#bdb2a0');
    const fy = Y + 0.45;
    for (const x of [-6, -2, 2, 6]) for (const z of [-3.5, 0, 3.5]) b.cyl(D[0] + x, fy, D[1] + z, 0.25, 3.4, '#7a3f22', 8);
    b.box(D[0] - du, D[0] + du, fy, fy + 3.2, D[1] - dv, D[1] - dv + 0.25, '#93402a');           // vách sau
    b.box(D[0] - du - 0.6, D[0] + du + 0.6, fy + 3.4, fy + 3.7, D[1] - dv - 0.6, D[1] + dv + 0.6, '#6e4a30');
    b.gable(D[0] - du - 1.4, D[0] + du + 1.4, D[1] - dv - 1.6, D[1] + dv + 1.6, fy + 3.7, 2.4, '#b4452e');
    b.gable(D[0] - du + 1.2, D[0] + du - 1.2, D[1] - dv + 0.2, D[1] + dv - 0.2, fy + 5.2, 2.6, '#c45a3a');
    b.box(D[0] - du + 1, D[0] + du - 1, fy + 7.7, fy + 8.0, D[1] - 0.15, D[1] + 0.15, '#93402a');    // bờ nóc
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(new THREE.ConeGeometry(0.22, 1.6, 5), '#93402a', D[0] + sx * (du + 1.4), fy + 4.3, D[1] + sz * (dv + 1.6), 0, sz * 0.7, -sx * 0.7);   // đầu đao cong vút
    for (const x of [-4, 4]) { b.cyl(D[0] + x, fy + 2.4, D[1] + dv + 0.2, 0.02, 0.5, '#3a3344', 4); glow.add(new THREE.SphereGeometry(0.42, 8, 6), '#e0503e', D[0] + x, fy + 2.2, D[1] + dv + 0.2); }   // đèn lồng đỏ
    boxes.push(boxW(R, D[0] - du, D[0] + du, D[1] - dv, D[1] - dv + 0.3, fy + 6));
    // trống đồng Đông Sơn trên bệ đá (điểm 🥁)
    b.box(60.5, 63.5, Y, Y + 0.6, 8.5, 11.5, '#948a7b'); b.cyl(62, Y + 0.6, 10, 1.3, 0.9, '#8a6a2e', 21, 1.4); b.cyl(62, Y + 1.5, 10, 1.45, 0.06, '#d4a24a', 21);
    b.add(new THREE.CircleGeometry(0.4, 12), '#f2c443', 62, Y + 1.57, 10, 0, -Math.PI / 2);
    for (let k = 0; k < 8; k++) b.add(new THREE.BoxGeometry(0.08, 0.02, 0.45), '#f2c443', 62 + Math.cos(k * 0.785) * 0.62, Y + 1.57, 10 + Math.sin(k * 0.785) * 0.62, -k * 0.785);
    // giếng làng: thành giếng tròn + mái 4 trụ
    const Wl = [13, 8]; b.cyl(Wl[0], Y, Wl[1], 1.3, 0.8, '#bdb2a0', 13); b.cyl(Wl[0], Y + 0.79, Wl[1], 1.0, 0.03, '#2c6455', 13);
    for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) b.cyl(Wl[0] + x, Y, Wl[1] + z, 0.1, 2.6, '#6e4a30', 6);
    b.gable(Wl[0] - 1.7, Wl[0] + 1.7, Wl[1] - 1.7, Wl[1] + 1.7, Y + 2.6, 1.1, '#b4452e');
    // cổng làng: đặt đúng hướng cầu tới (về phía đảo chính)
    const dl = Math.hypot(...R.c), gd = [-R.c[0] / dl, -R.c[1] / dl], G = [gd[0] * 118, gd[1] * 118], gr = Math.atan2(-gd[1], gd[0]);
    { const gb = new Batch(); for (const s of [-1, 1]) gb.box(-1, 1, 0, 4.2, s * 3.4 - 1, s * 3.4 + 1, '#d9c8a6'); gb.box(-1.3, 1.3, 4.2, 5.2, -4.8, 4.8, '#efe3c8'); gb.gable(-1.6, 1.6, -5.2, 5.2, 5.2, 1.2, '#b4452e');
      b.list.push(gb.build().rotateY(gr).translate(G[0], Y, G[1]));
      for (const s of [-1, 1]) { const px = G[0] - gd[1] * s * 3.4, pz = G[1] + gd[0] * s * 3.4; boxes.push(boxW(R, px - 1.1, px + 1.1, pz - 1.1, pz + 1.1, Y + 4.2)); } }
    // nhà tranh vách đất (7), mái rơm
    for (const [u, v, r] of [[55, 47, 0.1], [76, 55, -0.2], [97, 40, 0.3], [21, 55, 0], [42, 76, 0.2], [80, -47, -0.1], [97, -21, 0.4]]) {
      const hb = new Batch(); hb.box(-4, 4, 0, 2.6, -2.5, 2.5, '#d9c8a6'); hb.box(-0.6, 0.6, 0, 1.9, 2.5, 2.56, '#6e4a30'); hb.gable(-4.6, 4.6, -3.1, 3.1, 2.6, 2.1, '#c9a458');
      hb.box(-4.2, 4.2, 0, 0.3, -2.7, 2.7, '#948a7b'); b.list.push(hb.build().rotateY(r).translate(u, Y, v));
      const cr = Math.cos(r), sr = Math.sin(r), ex = Math.abs(4 * cr) + Math.abs(2.5 * sr), ez = Math.abs(4 * sr) + Math.abs(2.5 * cr); boxes.push(boxW(R, u - ex, u + ex, v - ez, v + ez, Y + 4.4));
    }
    // lũy tre quanh làng: các khóm tre (thân mảnh, lá ngọn)
    for (let k = 0; k < (CFG.isMobile ? 34 : 55); k++) {
      const a = k / (CFG.isMobile ? 34 : 55) * 6.283, r = 125 + Math.sin(k * 2.3) * 4, u = Math.cos(a) * r, v = Math.sin(a) * r;
      if (u < -13 || Math.abs(Math.atan2(v, u) - Math.atan2(gd[1], gd[0])) < 0.13) continue; const h = R.h(u, v); if (h < 1.3) continue;
      for (let i = 0; i < 5; i++) { const x = u + Math.cos(i * 1.3) * 0.7, z = v + Math.sin(i * 1.3) * 0.7, hh = 6 + (i % 3) * 1.6; b.cyl(x, h, z, 0.07, hh, '#7fae4a', 5); b.add(new THREE.ConeGeometry(0.9, 2.6, 5), '#5a9a48', x, h + hh, z, 0, Math.PI); }
    }
    meshes(g, b, glow);
    const sp = sign('🏮 Làng Cổ Việt Nam'); sp.position.set(G[0], Y + 8, G[1]); g.add(sp);
    const sp2 = sign('⛩️ Đình làng', 4.2); sp2.position.set(D[0], Y + 11.5, D[1]); g.add(sp2);
    placeKit(g, 'tree_fat', [[13, Y, -21, 3.4, 0.6]]);   // cây đa đầu làng
    return { group: g, boxes, update() {} };
  };
  const t2 = g => [
    placeKit(g, 'farm_hay_round', [[70, 1.6, -8, 1.3, 0.3], [74, 1.6, -11, 1.2, 1.1], [48, 1.6, 21, 1.3, 2]], { shadow: false }),
    placeKit(g, 'plant_lily', spots(R, 13, (u, v, h) => Math.hypot(u - 34, v - 34) < 6, 0), { shadow: false }),
    placeKit(g, 'qn_tree_c', spots(R, 21, (u, v, h) => h > 1.5 && h < 1.8 && u > 8 && Math.hypot(u - 34, v + 34) > 13 && Math.hypot(u - 34, v - 34) > 13 && Math.abs(v) > 8, 13, 110)),
    placeKit(g, 'fence_wood', [[30, 1.6, 26, 1, 0], [38, 1.6, 26, 1, 0], [26, 1.6, 30, 1, 1.57]], { shadow: false }),
  ];
  return { t1, t2 };
}

// ======================= 🪸 QUẦN ĐẢO SAN HÔ =======================
function coral(R) {
  const t1 = () => {
    const g = new THREE.Group(), b = new Batch(), glow = new Batch(), boxes = [];
    g.add(ground(R, (c, h, u, v) => {
      if (h > 0.3) return c.set('#f0dfae').lerp(C2.set('#e2cc8e'), fbm(u * 0.1, v * 0.1) * 0.6);
      if (h > REEF_Y - 1.2) { const k = fbm(u * 0.11 + 5, v * 0.11); return c.set(k > 0.58 ? '#e88a7a' : k > 0.45 ? '#c9b26a' : '#52b8b0'); }   // thềm rạn: san hô hồng, cát vàng, nước ngọc
      c.set('#2f8aa0').lerp(C2.set('#1f4f6e'), Math.min(1, (REEF_Y - 1.2 - h) / 5));
    }));
    // hải đăng sọc đỏ trắng 13 m trên đảo chính
    const Lh = [-13, -13], hy = R.h(...Lh);
    for (let k = 0; k < 5; k++) b.cyl(Lh[0], hy + k * 2.6, Lh[1], 1.6 - k * 0.16, 2.6, k % 2 ? '#f7efdc' : '#d8433a', 13, 1.6 - (k + 1) * 0.16);
    b.cyl(Lh[0], hy + 13, Lh[1], 1.2, 0.3, '#3a3344', 13); b.cone(Lh[0], hy + 15.2, Lh[1], 1.1, 1.3, '#d8433a', 13);
    glow.cyl(Lh[0], hy + 13.3, Lh[1], 0.8, 1.9, '#ffe3a0', 8);
    boxes.push(boxW(R, Lh[0] - 1.6, Lh[0] + 1.6, Lh[1] - 1.6, Lh[1] + 1.6, hy + 16.5));
    // trạm nghiên cứu biển nhà sàn (điểm 🔬) + chảo vệ tinh
    const S0 = [8, 21], sy = R.h(...S0);
    for (const [x, z] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) b.cyl(S0[0] + x, sy - 1, S0[1] + z, 0.15, 2.6, '#6e4a30', 6);
    b.box(S0[0] - 3.6, S0[0] + 3.6, sy + 1.4, sy + 1.6, S0[1] - 2.6, S0[1] + 2.6, '#a8744a'); b.box(S0[0] - 2.8, S0[0] + 2.8, sy + 1.6, sy + 4.2, S0[1] - 2, S0[1] + 2, '#f3ead6');
    b.box(S0[0] - 1.6, S0[0] - 0.4, sy + 2.4, sy + 3.5, S0[1] + 2, S0[1] + 2.06, '#8fb9cc'); b.box(S0[0] + 0.6, S0[0] + 1.8, sy + 2.4, sy + 3.5, S0[1] + 2, S0[1] + 2.06, '#8fb9cc');
    b.gable(S0[0] - 3.2, S0[0] + 3.2, S0[1] - 2.4, S0[1] + 2.4, sy + 4.2, 1.4, '#3f8a73');
    b.add(new THREE.SphereGeometry(0.8, 10, 6, 0, 6.29, 0, 1.2), '#f7efdc', S0[0] + 2, sy + 6.1, S0[1], 0, -0.6);
    boxes.push(boxW(R, S0[0] - 2.8, S0[0] + 2.8, S0[1] - 2, S0[1] + 2, sy + 5.6));
    // phao đánh dấu điểm lặn (cá hề, hải quỳ) + hải quỳ dưới đáy
    const Dv = [30, -58]; b.cyl(Dv[0], -0.4, Dv[1], 0.6, 0.9, '#f2c443', 8); b.cyl(Dv[0], 0.5, Dv[1], 0.05, 1.6, '#3a3344', 4); b.box(Dv[0], Dv[0] + 0.8, 1.5, 2.0, Dv[1] - 0.02, Dv[1] + 0.02, '#d8433a');
    for (let k = 0; k < 8; k++) { const x = Dv[0] + Math.cos(k * 0.8) * 1.6, z = Dv[1] + Math.sin(k * 0.8) * 1.6, h = R.h(x, z); b.cyl(x, h, z, 0.35, 0.5, '#ee93a8', 8); for (let i = 0; i < 6; i++) b.cyl(x + Math.cos(i) * 0.25, h + 0.5, z + Math.sin(i) * 0.25, 0.05, 0.45, '#f6b8c8', 4); }
    // cá hề (cam sọc trắng): đàn nhỏ quanh hải quỳ, bơi vòng
    const fish = new Batch(); fish.add(new THREE.SphereGeometry(0.16, 6, 4), '#f08a2a', 0, 0, 0, 0, 0, 0, 1, 1, 1.7); fish.box(-0.02, 0.02, -0.12, 0.12, 0.05, 0.1, '#f7efdc'); fish.add(new THREE.ConeGeometry(0.1, 0.18, 4), '#f08a2a', 0, 0, -0.32, 0, -Math.PI / 2);
    const NF = 13, fm = new THREE.InstancedMesh(fish.build(), matV(), NF); fm.frustumCulled = false; g.add(fm);
    meshes(g, b, glow);
    const sp = sign('🪸 Quần đảo San Hô'); sp.position.set(-4, 7, -36); g.add(sp);
    const o = new THREE.Object3D();
    return { group: g, boxes, update(dt, t) {
      for (let i = 0; i < NF; i++) { const a = t * (0.5 + (i % 3) * 0.13) + i * 0.48, r = 1.2 + (i % 4) * 0.5; o.position.set(Dv[0] + Math.cos(a) * r, REEF_Y + 0.9 + Math.sin(t + i) * 0.2, Dv[1] + Math.sin(a) * r); o.rotation.set(0, -a, 0); o.updateMatrix(); fm.setMatrixAt(i, o.matrix); }
      fm.instanceMatrix.needsUpdate = true;
    } };
  };
  const onIslet = (u, v, m) => ISLETS.some(([iu, iv, r]) => Math.hypot(u - iu, v - iv) < r - m);
  const t2 = g => [
    scatterModel(g, 'san-ho', spots(R, CFG.isMobile ? 55 : 89, (u, v, h) => h < REEF_Y + 0.6 && h > REEF_Y - 1.4, 21, 140).map(q => (q[3] *= 1.3, q))),
    placeKit(g, 'plant_palm_tall', spots(R, 21, (u, v, h) => h > 1 && onIslet(u, v, 3), 0, 89)),
    placeKit(g, 'plant_palm_bend', spots(R, 13, (u, v, h) => h > 0.8 && onIslet(u, v, 2), 0, 89)),
    scatterModel(g, 'rua', [[-60, R.h(-60, 36), 36, 0.8, 1], [-66, R.h(-66, 46), 46, 0.7, 2.6], [38, R.h(38, 60), 60, 0.8, 4]]),
    placeKit(g, 'prop_beach_umbrella', [[13, R.h(13, -8), -8, 1, 0], [-8, R.h(-8, 13), 13, 1, 1]], { shadow: false }),
    placeKit(g, 'fish', spots(R, 21, (u, v, h) => h < REEF_Y, 21, 130).map(q => (q[1] = REEF_Y + 0.8 + rnd(), q)), { shadow: false }),
  ];
  return { t1, t2 };
}

// ======================= 🌆 THÀNH PHỐ TƯƠNG LAI =======================
export const TURBINES = [[-130, 89], [-130, 34], [-130, -21], [130, 110], [89, 130], [34, 130]];   // [u, v] ven kè biển
function future(R) {
  const t1 = () => {
    const g = new THREE.Group(), b = new Batch(), glow = new Batch(), boxes = [], Y = FUT_Y;
    g.add(ground(R, (c, h, u, v) => {
      if (h < Y - 0.2) return sandOrSea(c, h) || c.set('#9aa3ad');
      if (Math.abs(v - FUT_RW.v) < FUT_RW.hw + 5 && Math.abs(u) < FUT_RW.hl + 8) return c.set('#9aa3ad');
      if (Math.hypot(u + 21, v - 89) < 21 || Math.hypot(u - 55, v + 34) < 13) return c.set('#7fbf5e');   // công viên xanh
      c.set(((Math.floor(u / 8) + Math.floor(v / 8)) & 1) ? '#d6dbe0' : '#c9cfd6');
    }));
    // đường băng 233 × 13 m + vạch sơn
    const rv = FUT_RW.v; b.box(-FUT_RW.hl, FUT_RW.hl, Y, Y + 0.05, rv - FUT_RW.hw, rv + FUT_RW.hw, '#4a4e57');
    for (let x = -FUT_RW.hl + 13; x < FUT_RW.hl - 8; x += 13) b.box(x, x + 5, Y + 0.05, Y + 0.07, rv - 0.25, rv + 0.25, '#f3efe6');
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) b.box(s * (FUT_RW.hl - 6) - 2, s * (FUT_RW.hl - 6) + 2, Y + 0.05, Y + 0.07, rv - 5 + i * 2.5, rv - 4.2 + i * 2.5, '#f3efe6');
    for (let x = -FUT_RW.hl; x <= FUT_RW.hl; x += 21) for (const s of [-1, 1]) glow.box(x - 0.2, x + 0.2, Y, Y + 0.3, rv + s * (FUT_RW.hw + 0.4) - 0.2, rv + s * (FUT_RW.hw + 0.4) + 0.2, '#7fd0ff');
    // tháp kính: cao 21 · 34 · 55 m (Fibonacci), vườn trên mái, dải đèn xanh
    for (const [u, v, w, d, h] of [[-55, -55, 13, 13, 55], [-21, -76, 13, 8, 34], [21, -55, 8, 13, 34], [55, -80, 13, 13, 55], [89, -34, 13, 8, 34], [-100, -40, 13, 13, 21], [110, 8, 8, 13, 21], [-89, 0, 8, 8, 34]]) {
      b.box(u - w / 2, u + w / 2, Y, Y + h, v - d / 2, v + d / 2, '#8fb9cc');
      for (let y = 3.4; y < h; y += 3.4) b.box(u - w / 2 - 0.08, u + w / 2 + 0.08, Y + y - 0.15, Y + y, v - d / 2 - 0.08, v + d / 2 + 0.08, '#f3efe6');
      b.box(u - w / 2 + 0.6, u + w / 2 - 0.6, Y + h, Y + h + 0.6, v - d / 2 + 0.6, v + d / 2 - 0.6, '#5a9a48');
      glow.box(u - w / 2 - 0.1, u - w / 2 + 0.25, Y, Y + h, v + d / 2 - 0.25, v + d / 2 + 0.1, '#7fd0ff');
      boxes.push(boxW(R, u - w / 2, u + w / 2, v - d / 2, v + d / 2, Y + h + 0.6));
    }
    // vòm khoa học (cung thiên văn) r 8
    b.add(new THREE.SphereGeometry(8, 21, 8, 0, 6.29, 0, 1.571), '#f7efdc', 55, Y, 89); boxes.push(boxW(R, 49, 61, 83, 95, Y + 8));
    // cánh đồng pin mặt trời 8 × 5 tấm nghiêng 31,7° (atan 1/φ) hướng nam
    for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { const u = -120 + i * 4.4, v = -89 + j * 5.5; b.add(new THREE.BoxGeometry(3.8, 0.08, 2.4), '#2c4a7a', u, Y + 1.2, v, 0, -0.553); b.cyl(u, Y, v, 0.06, 1.1, '#5a5266', 4); }
    // trạm năng lượng (điểm ⚡): kiốt + màn hình + khối pin lưu trữ
    b.box(-3, 3, Y, Y + 3.4, 31, 37, '#efe3c8'); b.box(-3.4, 3.4, Y + 3.4, Y + 3.7, 30.6, 37.4, '#5a9a48'); glow.box(-2, 2, Y + 1, Y + 2.6, 36.99, 37.05, '#7fd0ff');
    for (let i = 0; i < 4; i++) { b.box(5 + i * 1.6, 6.2 + i * 1.6, Y, Y + 2.1, 32, 36, '#3f8a73'); glow.box(5.3 + i * 1.6, 5.9 + i * 1.6, Y + 1.6, Y + 1.8, 36, 36.03, '#7fe08a'); }
    boxes.push(boxW(R, -3, 3, 31, 37, Y + 3.7));
    // nhà máy tái chế (điểm ♻️) + 3 thùng phân loại
    b.box(-89, -63, Y, Y + 8, 55, 68, '#d6ccbb'); b.box(-90, -62, Y + 8, Y + 8.4, 54, 69, '#3f8a73'); b.cyl(-66, Y + 8.4, 60, 0.9, 5, '#bdb2a0', 8);
    boxes.push(boxW(R, -89, -63, 55, 68, Y + 13.4));
    [['#3d6fb0', -82], ['#f2c443', -76], ['#5a9a48', -70]].forEach(([c, u]) => { b.box(u - 1, u + 1, Y, Y + 1.6, 48, 50, c); b.box(u - 1.1, u + 1.1, Y + 1.6, Y + 1.8, 47.9, 50.1, '#3a3344'); });
    // tàu đệm từ: vòng ray trên cao r 34 quanh công viên, trụ mỗi 13 m (π·2·34/13 ≈ 16 trụ)
    const MC = [89 - 34, 55], MR = 34, MY = Y + 6.8, NS = 34;
    for (let k = 0; k < NS; k++) { const a0 = k / NS * 6.283, a1 = (k + 1) / NS * 6.283, x0 = MC[0] + Math.cos(a0) * MR, z0 = MC[1] + Math.sin(a0) * MR, x1 = MC[0] + Math.cos(a1) * MR, z1 = MC[1] + Math.sin(a1) * MR;
      b.add(new THREE.BoxGeometry(1.2, 0.5, Math.hypot(x1 - x0, z1 - z0) + 0.1), '#d6dbe0', (x0 + x1) / 2, MY, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0)); if (k % 2 === 0) b.cyl(x0, Y, z0, 0.35, MY - Y - 0.25, '#bdb2a0', 8); }
    for (let k = 0; k < 89; k += 1) { const a = k / 89 * 6.283; glow.box(MC[0] + Math.cos(a) * MR - 0.12, MC[0] + Math.cos(a) * MR + 0.12, MY + 0.25, MY + 0.32, MC[1] + Math.sin(a) * MR - 0.12, MC[1] + Math.sin(a) * MR + 0.12, '#7fd0ff'); }
    const pb = new Batch(); pb.box(-0.9, 0.9, 0, 1.8, -4, 4, '#f7efdc'); pb.add(new THREE.SphereGeometry(0.9, 8, 6, 0, 6.29, 0, 1.571), '#f7efdc', 0, 0.9, 4, 0, Math.PI / 2); pb.add(new THREE.SphereGeometry(0.9, 8, 6, 0, 6.29, 0, 1.571), '#f7efdc', 0, 0.9, -4, 0, -Math.PI / 2);
    pb.box(-0.92, 0.92, 0.9, 1.5, -3.6, 3.6, '#2c6455'); pb.box(-0.93, 0.93, 0.15, 0.3, -4, 4, '#3d6fb0');
    const pod = new THREE.Mesh(pb.build(), matV()); pod.castShadow = true; g.add(pod);
    // tuabin gió: trụ 34 m + thân máy; rô-to 3 cánh (instancing, 1 draw call) quay theo gió
    for (const [u, v] of TURBINES) { b.cyl(u, Y, v, 0.8, 34, '#f3efe6', 8, 0.45); b.box(u - 0.7, u + 0.7, Y + 33.4, Y + 35, v - 2.2, v + 1.2, '#f3efe6'); boxes.push(boxW(R, u - 1.5, u + 1.5, v - 1.5, v + 1.5, Y + 34 + 13)); }
    const rb = new Batch(); for (let k = 0; k < 3; k++) rb.add(new THREE.BoxGeometry(0.45, 13, 0.15), '#f7efdc', Math.sin(k * 2.094) * 6.5, Math.cos(k * 2.094) * 6.5, 0, 0, 0, -k * 2.094); rb.add(new THREE.ConeGeometry(0.6, 1.4, 8), '#f3efe6', 0, 0, 0.6, 0, Math.PI / 2);
    const rotor = new THREE.InstancedMesh(rb.build(), matV(), TURBINES.length); rotor.castShadow = true; rotor.frustumCulled = false; g.add(rotor);
    meshes(g, b, glow);
    const sp = sign('🌆 Thành phố Tương lai'); sp.position.set(-R.R + 13, 8, 0); g.add(sp);
    const sp2 = sign('⚡ Năng lượng sạch', 5.3); sp2.position.set(0, Y + 6, 34); g.add(sp2);
    const o = new THREE.Object3D(); let spin = 0, pa = 0;
    return { group: g, boxes, update(dt, t, wind) {
      spin += dt * (0.4 + wind * 1.6);
      TURBINES.forEach(([u, v], i) => { o.position.set(u, Y + 34.2, v + 1.6); o.rotation.set(0, 0.3, spin + i); o.updateMatrix(); rotor.setMatrixAt(i, o.matrix); }); rotor.instanceMatrix.needsUpdate = true;
      pa += dt * 0.42; pod.position.set(MC[0] + Math.cos(pa) * MR, MY + 0.3, MC[1] + Math.sin(pa) * MR); pod.rotation.y = -pa;
    } };
  };
  const t2 = g => [
    placeKit(g, 'plant_tree_town', spots(R, 34, (u, v, h) => (Math.hypot(u + 21, v - 89) < 18 || Math.hypot(u - 55, v + 34) < 11), 0, 130)),
    placeKit(g, 'prop_streetlight', [-34, 0, 34, 68].map((u, i) => [u, FUT_Y, 13, 1, Math.PI / 2])),
    placeKit(g, 'sedan', [[-13, FUT_Y, 21, 1, 1.57], [-8, FUT_Y, 21, 1, 1.57], [21, FUT_Y, -21, 1, 0]]),
    placeKit(g, 'prop_bench_park', [[-21, FUT_Y, 72, 1, 0], [-30, FUT_Y, 89, 1, 1.57]], { shadow: false }),
  ];
  return { t1, t2 };
}

export const BUILDERS = { snow, village, coral, future };
