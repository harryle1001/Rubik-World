// lighthouse/build.js — DỰNG HÌNH đảo đá + tháp hải đăng (ngoài + trong) + bến gỗ, nhà người gác đèn, vườn rau, dây phơi, thuyền con.
// Toạ độ cục bộ (x = e, z = n — xem plan.js). Khối gộp tô màu đỉnh (Batch) → ít draw call; model CC0 lấy từ kho kit (placeKit, instancing).
// Chỉ gọi khi người chơi lại gần (index.js); dispose() trả lại bộ nhớ khi đi xa.
import * as THREE from 'three';
import { CFG } from '../config.js';
import { Batch } from '../academy/geo.js';
import { mat, matV, PAL } from '../sample/palette.js';
import { toon } from '../style.js';
import { placeKit } from '../kit.js';
import { scatterModel } from '../models.js';
import { PHI } from '../layout.js';
import { T, Y0, FLOORS, rOut, rIn, isleH, PIER, STAIR, CRAG, edgeR, stepAngle, smooth } from './plan.js';

const TAU = Math.PI * 2, HEX = k => PAL[k].hex;
const RED = HEX('rubikR'), WHITE = HEX('stoneCreamL'), STONE = HEX('stoneWarm'), STONE_D = HEX('stoneWarmD'), STONE_L = HEX('stoneWarmL');
const WOOD = HEX('wood'), WOOD_D = HEX('woodD'), IRON = HEX('iron'), IRON_L = HEX('ironL'), BRASS = HEX('brass'), PLASTER = HEX('plaster');
export const FIB_STEPS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

/** đảo mặt (để nhìn từ bên trong tháp) */
function flip(g) {
  g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position.array, nr = g.attributes.normal.array;
  for (let i = 0; i < p.length; i += 9) for (let k = 0; k < 3; k++) { const a = p[i + 3 + k]; p[i + 3 + k] = p[i + 6 + k]; p[i + 6 + k] = a; const b = nr[i + 3 + k]; nr[i + 3 + k] = nr[i + 6 + k]; nr[i + 6 + k] = b; }
  for (let i = 0; i < nr.length; i++) nr[i] = -nr[i];
  return g;
}
/** hình nêm vành khăn [r0, r1] × góc [a0, a1] × [y0, y1] (góc theo atan2(z, x)): mặt trên, mặt dưới, mặt đứng phía a0 */
function wedge(b, r0, r1, a0, a1, y0, y1, col, seg = 1, riser = true) {
  const P = [], q = (A, B, Cc, Dd) => P.push(...A, ...B, ...Cc, ...A, ...Cc, ...Dd), pt = (r, a, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
  for (let s = 0; s < seg; s++) {
    const u = a0 + (a1 - a0) * s / seg, v = a0 + (a1 - a0) * (s + 1) / seg;
    q(pt(r0, u, y1), pt(r0, v, y1), pt(r1, v, y1), pt(r1, u, y1));   // trên
    q(pt(r0, u, y0), pt(r1, u, y0), pt(r1, v, y0), pt(r0, v, y0));   // dưới
    q(pt(r0, v, y0), pt(r0, v, y1), pt(r0, u, y1), pt(r0, u, y0));   // mép trong
  }
  if (riser) q(pt(r0, a0, y0), pt(r0, a0, y1), pt(r1, a0, y1), pt(r1, a0, y0));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  return b.add(g, col);
}
const cylAt = (b, th, r, y0, rad, h, col, seg = 6) => b.cyl(Math.cos(th) * r, y0, Math.sin(th) * r, rad, h, col, seg);
/** hộp đặt theo toạ độ cực, trục dài hướng tâm */
const boxAt = (b, th, r, y, w, h, d, col) => b.add(new THREE.BoxGeometry(w, h, d), col, Math.cos(th) * r, y, Math.sin(th) * r, -th);

// ---------- ĐẢO ĐÁ ----------
function isleGeo() {
  const st = CFG.isMobile ? 3 : 2.4, R = 48, n = Math.ceil(2 * R / st), w = n + 1, H = new Float32Array(w * w), P = [], Cc = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) H[j * w + i] = isleH(-R + i * st, -R + j * st);
  const rock = new THREE.Color('#8d8790'), rockD = new THREE.Color('#5f5a66'), rockL = new THREE.Color('#aaa4a6'), grass = PAL.grass.color, grassD = PAL.grassD.color, sand = PAL.stoneCreamD.color, moss = new THREE.Color('#6f7f5a'), c = new THREE.Color();
  const tri = (a, b2, d) => {
    const [ax, ay, az] = a, [bx, by, bz] = b2, [dx, dy, dz] = d, nx = (by - ay) * (dz - az) - (bz - az) * (dy - ay), ny = (bz - az) * (dx - ax) - (bx - ax) * (dz - az), nz = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
    const up = ny / (Math.hypot(nx, ny, nz) || 1), h = (ay + by + dy) / 3, e = (ax + bx + dx) / 3, nn = (az + bz + dz) / 3, r = Math.hypot(e, nn), k = Math.sin(e * 1.7 + nn * 2.3) * 0.5 + 0.5;
    if (h < 0.35) c.copy(rockD).lerp(rock, k * 0.3);
    else if (e > 19 && Math.abs(nn) < 8 && h < 2.2 && up > 0.8) c.copy(sand);
    else if (up > 0.93 && h > 4.3 && r < 27 && Math.hypot(e - CRAG.e, nn - CRAG.n) > CRAG.r) c.copy(grass).lerp(grassD, k * 0.6);
    else { c.copy(rock).lerp(rockL, Math.max(0, up - 0.5) * 1.2 * k).lerp(rockD, up < 0.6 ? 0.45 : 0); if (h < 1.6 && k > 0.6) c.lerp(moss, 0.35); }
    P.push(...a, ...b2, ...d); for (let q = 0; q < 3; q++) Cc.push(c.r, c.g, c.b);
  };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * w + i, h0 = H[a], h1 = H[a + 1], h2 = H[a + w], h3 = H[a + w + 1]; if (Math.max(h0, h1, h2, h3) < -5.2) continue;
    const x0 = -R + i * st, z0 = -R + j * st, A = [x0, h0, z0], B = [x0 + st, h1, z0], D = [x0, h2, z0 + st], F = [x0 + st, h3, z0 + st];
    tri(A, D, B); tri(B, D, F);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}

// ---------- THÁP: mặt ngoài + tường trong (1 khối, che camera) ----------
function shellGeo() {
  const b = new Batch(), D = T.DECK, g0 = Math.asin(T.DOOR_W / 2 / T.R0), SEG = 34;
  const fl = (geo, col) => b.add(flip(geo), col);
  const band = (y0, y1, col, gap, r = rOut) => b.add(new THREE.CylinderGeometry(r(y1), r(y0), y1 - y0, gap ? SEG - 1 : SEG, 1, true, gap ? Math.PI / 2 + g0 : 0, gap ? TAU - 2 * g0 : TAU), col, 0, (y0 + y1) / 2, 0);
  let y = 0; T.BANDS.forEach((h, i) => { const col = i % 2 ? WHITE : RED; if (!i) { band(0, T.DOOR_H, col, true); band(T.DOOR_H, h, col); } else band(y, y + h, col); y += h; });   // sọc 8·5·5·3·3·2 m
  b.add(new THREE.CylinderGeometry(T.R0 + 0.2, T.R0 + 0.35, 0.55, SEG - 1, 1, false, Math.PI / 2 + g0 * 1.25, TAU - 2.5 * g0), STONE, 0, 0.27, 0);   // chân đế đá
  // khung cửa đá + mái hiên nhỏ + cánh gỗ mở vào trong
  const jx = T.R0 - T.WALL - 0.05, jw = T.WALL + 0.5, hw = T.DOOR_W / 2;
  for (const s of [-1, 1]) b.box(jx, jx + jw, 0, T.DOOR_H, s * hw - (s < 0 ? 0.22 : 0), s * hw + (s > 0 ? 0.22 : 0), STONE_L);
  b.box(jx, jx + jw + 0.1, T.DOOR_H, T.DOOR_H + 0.42, -hw - 0.3, hw + 0.3, STONE_L);
  b.gable(jx + jw - 0.5, jx + jw + 0.55, -hw - 0.5, hw + 0.5, T.DOOR_H + 0.42, 0.62, HEX('roofD'));
  b.add(new THREE.BoxGeometry(0.08, T.DOOR_H - 0.1, T.DOOR_W - 0.1), WOOD, jx - 0.55, (T.DOOR_H - 0.1) / 2, -hw - 0.42, 1.25);
  b.box(jx + jw, jx + jw + 0.9, -0.02, 0.1, -hw - 0.35, hw + 0.35, STONE);   // bậc thềm
  // ban công tròn: công-xon + sàn + lan can 21 trụ
  const RG = T.R1 + T.GAL;
  b.add(new THREE.CylinderGeometry(RG, T.R1 + 0.15, 1.3, SEG), HEX('stoneCreamD'), 0, D - 0.25 - 0.65, 0);
  b.add(new THREE.CylinderGeometry(RG + 0.08, RG + 0.08, 0.25, SEG), IRON_L, 0, D - 0.125, 0);
  for (let k = 0; k < 21; k++) cylAt(b, k / 21 * TAU, RG - 0.1, D, 0.045, 1.15, IRON, 5);
  for (const h of [0.6, 1.15]) b.add(new THREE.TorusGeometry(RG - 0.1, 0.045, 4, SEG).rotateX(Math.PI / 2), IRON, 0, D + h, 0);
  // buồng đèn: chân tường đỏ (hở cửa ra ban công), 13 song kính, vành trên, mái chóp, quả cầu thông gió, cột thu lôi → 34 m
  const gd = 0.3;
  b.add(new THREE.CylinderGeometry(T.R1, T.R1, 0.95, SEG - 2, 1, true, Math.PI / 2 - T.GA + gd, TAU - 2 * gd), RED, 0, D + 0.475, 0);
  fl(new THREE.CylinderGeometry(T.R1 - T.WALL, T.R1 - T.WALL, 0.95, SEG - 2, 1, true, Math.PI / 2 - T.GA + gd, TAU - 2 * gd).translate(0, D + 0.475, 0), PLASTER);
  for (const s of [-1, 1]) boxAt(b, T.GA + s * gd, T.R1 - T.WALL / 2, D + 1.1, T.WALL + 0.1, 2.2, 0.12, IRON);   // khung cửa ban công
  boxAt(b, T.GA, T.R1 - T.WALL / 2, D + 2.25, T.WALL + 0.1, 0.12, 1.7, IRON);
  for (let k = 0; k < 13; k++) { const a = T.GA + gd + (k + 0.5) / 13 * (TAU - 2 * gd); cylAt(b, a, T.R1 - 0.08, D + 0.95, 0.05, T.LANT - 0.95, IRON, 4); }
  b.add(new THREE.TorusGeometry(T.R1 - 0.08, 0.06, 4, SEG).rotateX(Math.PI / 2), IRON, 0, D + 0.95 + (T.LANT - 0.95) / PHI, 0);
  b.add(new THREE.CylinderGeometry(T.R1 + 0.35, T.R1 + 0.35, 0.22, SEG), IRON_L, 0, D + T.LANT + 0.02, 0);
  b.add(new THREE.ConeGeometry(T.R1 + 0.3, 2.08, 13), RED, 0, D + T.LANT + 1.04 + 0.1, 0);
  fl(new THREE.ConeGeometry(T.R1 + 0.05, 1.9, 13, 1, true).translate(0, D + T.LANT + 0.95, 0), IRON_L);
  b.add(new THREE.SphereGeometry(0.32, 8, 6), BRASS, 0, D + T.LANT + 2.3, 0); b.cyl(0, D + T.LANT + 2.5, 0, 0.03, T.H - D - T.LANT - 2.5, IRON, 4);
  // khung cửa sổ (3 ô mỗi tầng, lệch khỏi phía cửa)
  for (const w of WINDOWS) { const r = rOut(w.y) + 0.02; boxAt(b, w.th, r, w.y - 0.66, 0.16, 0.1, 1.0, STONE_L); boxAt(b, w.th, r, w.y + 0.66, 0.16, 0.1, 1.0, STONE_L); }
  return b.build();
}
function liningGeo() {   // tường trong trát vôi + chân tường sơn xanh (mesh riêng: vật liệu "trong nhà" được nâng sáng)
  const b = new Batch(), g0 = Math.asin(T.DOOR_W / 2 / T.R0), SEG = 34, fl = (geo, col) => b.add(flip(geo), col);
  const inner = (y0, y1, col, gap) => fl(new THREE.CylinderGeometry(rIn(y1), rIn(y0), y1 - y0, gap ? SEG - 1 : SEG, 1, true, gap ? Math.PI / 2 + g0 * 1.1 : 0, gap ? TAU - 2.2 * g0 : TAU).translate(0, (y0 + y1) / 2, 0), col);
  inner(0, 1.0, HEX('shutter'), true); inner(1.0, T.DOOR_H, PLASTER, true); inner(T.DOOR_H, T.DECK - 0.25, PLASTER, false);
  return b.build();
}
export const WINDOWS = []; for (let k = 0; k < 4; k++) for (const th of [Math.PI / 2, Math.PI, -Math.PI / 2]) WINDOWS.push({ th: th + k * 0.5, y: (k ? FLOORS[k] : 1.2) + 2.0 });
function windowGeos() {
  const out = new Batch(), inn = new Batch();
  for (const w of WINDOWS) { boxAt(out, w.th, rOut(w.y) + 0.01, w.y, 0.1, 1.13, 0.7, '#ffffff'); boxAt(inn, w.th, rIn(w.y) - 0.09, w.y, 0.24, 1.13, 0.7, '#ffffff'); }
  return [out.build(), inn.build()];
}

// ---------- THÁP: cầu thang 144 bậc, sàn các tầng, lan can, đồ gỗ dựng tay (1 khối, không che camera) ----------
const landing = i => FLOORS.some((f, k) => Math.abs((i + 1) * T.RISE - f) <= 0.75 + (k ? 0 : 0.2));   // bậc sát sàn: hở lan can
function innerGeo() {
  const b = new Batch(), D = T.DECK;
  b.add(new THREE.CylinderGeometry(rIn(0), rIn(0), 0.3, 34), STONE_L, 0, -0.15, 0);                    // nền đá tầng trệt
  wedge(b, 0, 1.9, 0, TAU, 0.0, 0.02, HEX('rubikR'), 21, false); wedge(b, 1.9, 2.1, 0, TAU, 0.0, 0.025, HEX('stoneCreamD'), 21, false);   // thảm tròn
  for (let i = 0; i < T.STEPS; i++) {                                                                   // 144 bậc gỗ + cốn + tay vịn phía trong
    const top = (i + 1) * T.RISE, ri = rIn(top), rs = ri - T.SW, a0 = T.A0 + i * T.DTH, a1 = a0 + T.DTH * 1.02, fib = FIB_STEPS.includes(i + 1);
    wedge(b, rs, ri, a0, a1, top - 0.07, top, fib ? BRASS : i % 2 ? WOOD : '#b98356');
    wedge(b, ri - 0.1, ri, a0, a1, top - T.RISE - 0.16, top - 0.07, WOOD_D, 1, false);
    if (!landing(i)) { wedge(b, rs, rs + 0.07, a0, a1, top + 0.98, top + 1.05, WOOD_D, 1, false); if (i % 2) cylAt(b, a0 + T.DTH / 2, rs + 0.035, top, 0.03, 1.0, IRON, 4); }
  }
  FLOORS.forEach((f, k) => {                                                                            // sàn gỗ tròn các tầng + lan can (hở ở chiếu nghỉ)
    if (!k) return; const rd = rIn(f) - T.SW - 0.03, g0 = T.A0 + 3.6 * T.DTH, g1 = T.A0 - 4.6 * T.DTH + TAU;
    b.add(new THREE.CylinderGeometry(rd, rd, 0.2, 34), k % 2 ? '#b98356' : WOOD, 0, f - 0.1, 0);
    for (const s of [-1, 1]) b.box(-rd * 0.9, rd * 0.9, f - 0.42, f - 0.2, s * rd * 0.42 - 0.1, s * rd * 0.42 + 0.1, WOOD_D);   // 2 dầm đỡ gác vào tường
    wedge(b, rd - 0.06, rd, g0, g1, f + 0.98, f + 1.05, WOOD_D, 21, false); wedge(b, rd - 0.05, rd - 0.01, g0, g1, f + 0.5, f + 0.54, WOOD_D, 21, false);
    for (let q = 0; q <= 13; q++) cylAt(b, g0 + (g1 - g0) * q / 13, rd - 0.03, f, 0.03, 1.0, IRON, 4);
  });
  for (const k of [1, 2, 3]) for (const s of [-1, 1]) for (const z of [-1, 1]) {                          // dầm kéo dài tới tường (dưới gầm sàn)
    const f = FLOORS[k], rd = rIn(f) - T.SW, zz = z * rd * 0.42, xe = Math.sqrt(Math.max(0, rIn(f) ** 2 - zz * zz)); b.box(s > 0 ? rd * 0.85 : -xe, s > 0 ? xe : -rd * 0.85, f - 0.42, f - 0.24, zz - 0.09, zz + 0.09, WOOD_D);
  }
  // buồng đèn: sàn (hở ô cầu thang), lan can ô cầu thang, bệ thấu kính, trục truyền từ phòng máy
  const ri = T.R1 - T.WALL, aEnd = T.A0 + T.STEPS * T.DTH;
  b.add(new THREE.CylinderGeometry(ri - T.SW, ri - T.SW, 0.2, 34), IRON_L, 0, D - 0.1, 0);
  wedge(b, ri - T.SW, ri, aEnd, aEnd + (20 * T.DTH), D - 0.2, D, IRON_L, 13, true);
  boxAt(b, aEnd + 20 * T.DTH, ri - T.SW / 2, D + 0.55, T.SW, 1.1, 0.07, IRON); wedge(b, ri - T.SW - 0.06, ri - T.SW, aEnd - 14 * T.DTH, aEnd - 3 * T.DTH, D + 0.98, D + 1.05, IRON, 8, false);
  b.cyl(0, D, 0, 0.95, 0.9, IRON, 13, 0.8); b.add(new THREE.CylinderGeometry(0.86, 0.86, 0.08, 13), BRASS, 0, D + 0.92, 0);
  b.cyl(0, FLOORS[3] + 1.5, 0, 0.07, D - FLOORS[3] - 1.5, IRON_L, 6);
  // phòng máy (tầng 3): bệ máy, trống cuộn dây, quả nặng treo, bình dầu, tay quay
  const f3 = FLOORS[3]; b.box(-0.55, 0.55, f3, f3 + 0.5, -0.5, 0.5, IRON); b.box(-0.45, 0.45, f3 + 0.5, f3 + 1.5, -0.12, 0.12, IRON_L);
  b.add(new THREE.CylinderGeometry(0.28, 0.28, 0.6, 10).rotateZ(Math.PI / 2), BRASS, 0, f3 + 0.8, 0.42); b.cyl(-1.25, f3, 0.6, 0.3, 0.75, HEX('rubikR'), 8); b.cyl(-1.25, f3 + 0.75, 0.6, 0.1, 0.12, BRASS, 6);
  b.cyl(0.9, f3 - 2.6, -0.9, 0.012, 2.6 + 3.2, IRON, 3); b.cyl(0.9, f3 - 3.1, -0.9, 0.13, 0.42, BRASS, 8);
  // phòng bản đồ (tầng 2): ống nhòm trên giá 3 chân, cuộn hải đồ
  const f2 = FLOORS[2]; for (let q = 0; q < 3; q++) b.add(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 4), WOOD_D, -1.25 + Math.cos(q * 2.09) * 0.22, f2 + 0.62, -1.0 + Math.sin(q * 2.09) * 0.22, 0, Math.sin(q * 2.09) * 0.33, -Math.cos(q * 2.09) * 0.33);
  b.add(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 8).rotateZ(1.2), BRASS, -1.25, f2 + 1.32, -1.0, 0.6);
  for (let q = 0; q < 3; q++) b.add(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6).rotateX(Math.PI / 2), q % 2 ? HEX('stoneCreamL') : HEX('stoneCreamD'), 1.2 + q * 0.09, f2 + 0.05 + (q === 1 ? 0.07 : 0), 1.1, 0.4);
  // phòng ở (tầng 1): giường gỗ + chăn, bếp lò nhỏ + ống khói, thảm
  const f1 = FLOORS[1]; b.box(-2.1, -0.2, f1 + 0.25, f1 + 0.4, 1.0, 1.9, WOOD_D); for (const [x, z] of [[-2.05, 1.05], [-0.25, 1.05], [-2.05, 1.85], [-0.25, 1.85]]) b.cyl(x, f1, z, 0.05, 0.3, WOOD_D, 4);
  b.box(-2.05, -0.3, f1 + 0.4, f1 + 0.52, 1.03, 1.87, HEX('stoneCreamL')); b.box(-1.5, -0.3, f1 + 0.5, f1 + 0.57, 1.03, 1.87, HEX('shutter')); b.box(-2.0, -1.65, f1 + 0.52, f1 + 0.62, 1.2, 1.7, WHITE); b.box(-2.15, -2.07, f1 + 0.25, f1 + 0.95, 1.0, 1.9, WOOD);
  b.cyl(1.7, f1, -1.3, 0.3, 0.7, IRON, 8); b.cyl(1.7, f1 + 0.7, -1.3, 0.07, 2.4, IRON, 5); b.box(1.5, 1.9, f1 + 0.2, f1 + 0.45, -1.02, -0.98, HEX('lampGlow'));
  wedge(b, 0, 1.1, 0, TAU, f1, f1 + 0.02, HEX('shutter'), 13, false);
  // tầng trệt: móc áo mưa vàng, cuộn dây thừng, phao cứu sinh treo tường
  b.box(-0.02, 0.02, 1.5, 1.56, -3.9, -3.3, WOOD_D); b.box(-0.25, 0.25, 0.75, 1.5, -3.85, -3.75, HEX('flowerYellow'));
  b.add(new THREE.TorusGeometry(0.34, 0.11, 6, 13), WHITE, -3.1, 1.5, 2.55, -0.88); b.add(new THREE.TorusGeometry(0.34, 0.115, 6, 4, 0.8), RED, -3.1, 1.5, 2.55, -0.88);
  b.add(new THREE.TorusGeometry(0.3, 0.08, 5, 10).rotateX(Math.PI / 2), HEX('stoneCreamD'), 2.3, 0.08, 2.4); b.add(new THREE.TorusGeometry(0.26, 0.08, 5, 10).rotateX(Math.PI / 2), HEX('stoneCreamD'), 2.3, 0.22, 2.4);
  return b.build();
}

// ---------- THẤU KÍNH FRESNEL (xoay): thân kính nhiều nấc lăng kính + khung đồng ----------
function lensGeos() {
  const pts = [], h = 1.9, N = 13;
  for (let k = 0; k <= N; k++) { const t = k / N, bulge = 0.5 + 0.3 * Math.sin(t * Math.PI), y = t * h; pts.push(new THREE.Vector2(bulge + 0.07, y)); if (k < N) pts.push(new THREE.Vector2(bulge - 0.02 + 0.3 * (Math.sin((t + 0.5 / N) * Math.PI) - Math.sin(t * Math.PI)), y + h / N * 0.92)); }
  const glass = new THREE.LatheGeometry(pts, 13);
  const b = new Batch();
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.add(new THREE.CylinderGeometry(0.02, 0.02, h, 4), BRASS, Math.cos(a) * 0.86, h / 2, Math.sin(a) * 0.86); }
  for (const y of [0, h]) b.add(new THREE.TorusGeometry(0.86, 0.035, 4, 13).rotateX(Math.PI / 2), BRASS, 0, y, 0);
  b.add(new THREE.ConeGeometry(0.86, 0.35, 13), BRASS, 0, h + 0.17, 0);
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 13).rotateZ(Math.PI / 2), '#f7efdc', s * 0.9, h / 2, 0);   // 2 "mắt bò" phát chùm sáng
  return [glass, b.build()];
}

// ---------- BẾN GỖ, BẬC ĐÁ, VƯỜN RAU, DÂY PHƠI, ĐỒ LẶT VẶT (1 khối) ----------
export const HOUSE = { e: 5.5, n: -11.5, ry: Math.PI };          // nhà người gác đèn (mặt tiền quay về phía tháp)
export const GARDEN = { e: 4, n: 11.5 };
export const LINE = { e0: 12.5, e1: 17.5, n: -5.2 };            // dây phơi
function propsGeo() {
  const b = new Batch(), P = PIER, S = STAIR;
  for (let x = P.e0; x < P.e1 - 0.01; x += 0.5) b.box(x + 0.02, x + 0.48, P.y - 0.12, P.y, -P.hw, P.hw, (x * 2 | 0) % 3 ? WOOD : '#b98356');   // ván sàn
  for (const s of [-1, 1]) b.box(P.e0, P.e1, P.y - 0.3, P.y - 0.12, s * (P.hw - 0.25) - 0.08, s * (P.hw - 0.25) + 0.08, WOOD_D);
  for (let x = P.e0 + 1; x <= P.e1; x += 5) for (const s of [-1, 1]) b.cyl(x, -6, s * (P.hw - 0.12), 0.16, 6 + P.y + (x > P.e1 - 6 ? 1.0 : 0.25), WOOD_D, 6);   // cọc (2 cọc cuối cao: buộc thuyền)
  b.add(new THREE.TorusGeometry(0.2, 0.05, 4, 8).rotateX(Math.PI / 2), HEX('stoneCreamD'), P.e1 - 0.6, P.y + 0.8, P.hw - 0.12);                 // vòng dây thừng
  for (let k = 0; k < S.n; k++) { const x1 = S.e1 - k * S.tread, y = P.y + (k + 1) * S.rise; b.box(x1 - S.tread - 0.03, x1, y - S.rise - 0.5, y, -S.hw, S.hw, k % 2 ? STONE : STONE_L); }   // 21 bậc đá
  for (const s of [-1, 1]) for (let k = 0; k <= 3; k++) { const x = S.e1 - k * 3.1, y = P.y + Math.min(S.n, Math.ceil(k * 3.1 / S.tread)) * S.rise; b.cyl(x, y - 0.4, s * (S.hw + 0.2), 0.07, 1.5, WOOD_D, 5); }   // cọc dây vịn
  for (let k = 0; k < 13; k++) { const a = k * 2.4, x = 6.2 + k * 0.72, z = Math.sin(k * 1.9) * 0.35; b.add(new THREE.CylinderGeometry(0.5, 0.55, 0.07, 7), k % 2 ? STONE : STONE_L, x, Y0 + 0.035, z, a); }   // lối đá lát từ cửa tháp ra bậc
  // vườn rau: 3 luống đất viền đá + cọc giàn
  const G = GARDEN;
  for (let k = 0; k < 3; k++) { const z = G.n - 1.6 + k * 1.6; b.box(G.e - 2.6, G.e + 2.6, Y0, Y0 + 0.18, z - 0.5, z + 0.5, '#6e4a30'); for (const s of [-1, 1]) b.box(G.e - 2.7, G.e + 2.7, Y0, Y0 + 0.24, z + s * 0.55 - 0.06, z + s * 0.55 + 0.06, STONE); }
  for (let k = 0; k < 5; k++) { const x = G.e - 2.2 + k * 1.1; b.cyl(x, Y0, G.n + 1.6, 0.025, 1.3, WOOD_D, 4); if (k < 4) b.box(x, x + 1.1, Y0 + 1.22, Y0 + 1.26, G.n + 1.58, G.n + 1.62, WOOD_D); }
  b.cyl(G.e + 3.4, Y0, G.n - 0.4, 0.2, 0.42, IRON_L, 8, 0.24); b.add(new THREE.TorusGeometry(0.16, 0.02, 4, 8, Math.PI), IRON_L, G.e + 3.4, Y0 + 0.42, G.n - 0.4);   // xô tưới
  // dây phơi: 2 cọc chữ T + 2 dây
  for (const x of [LINE.e0, LINE.e1]) { b.cyl(x, Y0, LINE.n, 0.05, 2.1, WOOD_D, 5); b.box(x - 0.04, x + 0.04, Y0 + 2.02, Y0 + 2.1, LINE.n - 0.5, LINE.n + 0.5, WOOD_D); }
  for (const s of [-0.4, 0.4]) b.box(LINE.e0, LINE.e1, Y0 + 2.06, Y0 + 2.075, LINE.n + s - 0.008, LINE.n + s + 0.008, HEX('stoneCreamL'));
  // ghế băng trước tháp, cột treo chuông sương mù, thước thuỷ triều ở bến (vạch 0,5 m đỏ–trắng)
  b.box(6.6, 8.4, Y0 + 0.42, Y0 + 0.5, 2.2, 2.75, WOOD); for (const x of [6.75, 8.25]) b.box(x - 0.05, x + 0.05, Y0, Y0 + 0.42, 2.25, 2.7, WOOD_D); b.box(6.6, 8.4, Y0 + 0.5, Y0 + 0.95, 2.72, 2.78, WOOD);
  b.cyl(9.5, Y0, -2.6, 0.07, 2.4, WOOD_D, 5); b.box(9.5, 10.1, Y0 + 2.3, Y0 + 2.38, -2.64, -2.56, WOOD_D); b.add(new THREE.CylinderGeometry(0.1, 0.2, 0.3, 8), BRASS, 10.0, Y0 + 2.08, -2.6);
  for (let k = 0; k < 8; k++) b.box(P.e1 - 2.06, P.e1 - 1.94, -1.4 + k * 0.5, -0.9 + k * 0.5, -P.hw - 0.3, -P.hw - 0.18, k % 2 ? WHITE : RED);
  return b.build();
}
function clothGeo() {   // quần áo trên dây (đung đưa theo gió)
  const b = new Batch(), cols = [HEX('rubikB'), WHITE, HEX('flowerYellow'), HEX('rubikR'), HEX('shutter'), WHITE, HEX('flowerPink')];
  cols.forEach((c, i) => { const x = -2.1 + i * 0.7, w = i % 3 === 1 ? 0.6 : 0.42, h = i % 2 ? 0.75 : 0.55; b.box(x - w / 2, x + w / 2, -h, 0, -0.012, 0.012, c); if (i % 3 === 0) { b.box(x - w / 2 - 0.16, x - w / 2, -0.2, 0, -0.012, 0.012, c); b.box(x + w / 2, x + w / 2 + 0.16, -0.2, 0, -0.012, 0.012, c); } });
  return b.build();
}

// ---------- BỌT SÓNG quanh chân đá (1 draw call): dải bám theo đường mép nước + vòng quanh từng mỏm đá ngầm ----------
export const SKERRIES = [[-41, -12, 1.5, 0.4], [-37, 24, 1.2, 2.1], [-22, -36, 1.7, 4.0], [3, -42, 1.1, 1.0], [-8, 43, 1.4, 5.2], [30, 33, 1.0, 3.3], [34, -30, 1.3, 0.2], [-47, 6, 0.9, 2.8]];   // [e, n, cỡ, xoay]
function foamGeo() {
  const P = [], UV = [], I = [], ring = (cx, cz, rf, seg, w0, w1, phase) => {
    const base = P.length / 3;
    for (let k = 0; k <= seg; k++) { const a = k / seg * TAU, r = rf(a), ca = Math.cos(a), sa = Math.sin(a); P.push(cx + ca * (r - w0), 0, cz + sa * (r - w0), cx + ca * (r + w1), 0, cz + sa * (r + w1)); UV.push(k / seg * Math.round(seg / 3) + phase, 0, k / seg * Math.round(seg / 3) + phase, 1); }
    for (let k = 0; k < seg; k++) { const a = base + k * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  };
  const shore = a => { let r = edgeR(a) + 6; const ca = Math.cos(a), sa = Math.sin(a); while (r > 8 && isleH(ca * r, sa * r) < 0.05) r -= 0.4; return r; };   // bán kính mép nước theo từng hướng
  ring(0, 0, shore, 89, 1.2, 4.2, 0);
  SKERRIES.forEach(([e, n, s], i) => ring(e, n, () => 2.0 * s, 13, 0.5, 1.9, i * 0.37));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 60); return g;
}
function foamMat() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uLight: { value: 1 } }]),
    vertexShader: `varying vec2 vUv;\n#include <fog_pars_vertex>\nvoid main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}`,
    fragmentShader: `uniform float uT, uLight; varying vec2 vUv;\n#include <fog_pars_fragment>
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        float v = vUv.y, n = noise(vec2(vUv.x * 3.1, uT * 0.35)), n2 = noise(vec2(vUv.x * 9.0 + 5., v * 3. - uT * 0.5));
        float surge = 0.5 + 0.5 * sin(uT * 0.9 + vUv.x * 1.3);                                   // sóng vỗ vào rồi rút ra (chu kỳ ≈ 7 s)
        float lace = smoothstep(0.34, 0.0, abs(v - (0.18 + 0.2 * surge + 0.16 * n)));           // viền bọt chính bám chân đá
        float wash = smoothstep(0.75, 0.1, v) * smoothstep(0.35, 0.75, n2) * (0.35 + 0.65 * surge);   // bọt loang
        float line2 = smoothstep(0.08, 0.0, abs(v - fract(0.25 + uT * 0.11 + n * 0.25))) * (1. - v) * 0.7;   // gợn sóng chạy vào bờ
        float a = clamp(lace * (0.6 + 0.4 * n2) + wash + line2, 0., 1.) * smoothstep(1.0, 0.8, v) * smoothstep(0.0, 0.04, v);
        gl_FragColor = vec4(vec3(1.0, 1.0, 0.98) * uLight, a * 0.9);\n#include <fog_fragment>\n}`,
  });
}

// ---------- BẢNG SỐ BẬC FIBONACCI + HẢI ĐỒ (canvas 512 px, 2 draw call) ----------
function plaqueMesh() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const k = cv.getContext('2d');
  k.fillStyle = '#f7efdc'; k.fillRect(0, 0, 512, 128); k.font = '900 30px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle';
  FIB_STEPS.forEach((n, i) => { const x = (i % 8) * 64, y = (i / 8 | 0) * 64; k.fillStyle = '#d4a24a'; k.fillRect(x + 3, y + 3, 58, 58); k.fillStyle = '#3d2b3f'; k.fillText(n, x + 32, y + 34, 54); });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const P = [], UV = [], I = [];
  FIB_STEPS.forEach((n, i) => {   // tấm đồng 0,38 m gắn tường ngang tầm mắt cạnh bậc Fibonacci
    const top = n * T.RISE, a = stepAngle(n - 1), r = rIn(top + 1.5) - 0.03, y = top + 1.5, hw = 0.19, ta = [-Math.sin(a), Math.cos(a)], c = [Math.cos(a) * r, Math.sin(a) * r], b0 = P.length / 3;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.push(c[0] + ta[0] * hw * sx, y + hw * sy, c[1] + ta[1] * hw * sx);
    const u0 = (i % 8) / 8, v0 = 1 - ((i / 8 | 0) + 1) / 2; UV.push(u0, v0, u0 + 0.125, v0, u0 + 0.125, v0 + 0.5, u0, v0 + 0.5); I.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex }));
}
function chartMesh(chart) {   // hải đồ trên bàn phòng bản đồ: đảo Rubik, Học viện, hải đăng, hoa gió 8 hướng, vòng hải lý
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const k = cv.getContext('2d');
  k.fillStyle = '#efe3c8'; k.fillRect(0, 0, 512, 512); k.strokeStyle = '#b9a47a'; k.lineWidth = 1; for (let i = 0; i <= 8; i++) { k.beginPath(); k.moveTo(i * 64, 0); k.lineTo(i * 64, 512); k.moveTo(0, i * 64); k.lineTo(512, i * 64); k.stroke(); }
  const S = 512 / 1500, X = x => 256 + x * S + 60, Z = z => 256 + z * S - 40;
  k.fillStyle = '#9cc7a0'; k.strokeStyle = '#3d2b3f'; k.lineWidth = 2; k.beginPath(); k.arc(X(0), Z(0), 305 * S, 0, TAU); k.fill(); k.stroke();
  k.font = '900 15px system-ui'; k.textAlign = 'center'; k.fillStyle = '#3d2b3f'; k.fillText('ĐẢO RUBIK', X(0), Z(0) + 5);
  for (const m of chart.marks) { k.fillStyle = m.c; k.beginPath(); k.arc(X(m.x), Z(m.z), m.r * S + 3, 0, TAU); k.fill(); k.stroke(); k.fillStyle = '#3d2b3f'; k.font = '900 13px system-ui'; k.fillText(m.n, X(m.x), Z(m.z) + (m.z > 0 ? 24 : -12)); }
  const L = chart.marks[0]; k.setLineDash([6, 5]); k.strokeStyle = '#c45a3a'; for (const r of [233, 463]) { k.beginPath(); k.arc(X(L.x), Z(L.z), r * S, 0, TAU); k.stroke(); } k.setLineDash([]);
  k.fillStyle = '#c45a3a'; k.font = '700 11px system-ui'; k.fillText('¼ hải lý (463 m)', X(L.x) + 60, Z(L.z) - 463 * S - 4);
  k.save(); k.translate(70, 78); k.strokeStyle = '#3d2b3f'; k.fillStyle = '#3d2b3f';
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 26 : 44; k.beginPath(); k.moveTo(0, 0); k.lineTo(Math.sin(a - 0.2) * 9, -Math.cos(a - 0.2) * 9); k.lineTo(Math.sin(a) * r, -Math.cos(a) * r); k.lineTo(Math.sin(a + 0.2) * 9, -Math.cos(a + 0.2) * 9); k.closePath(); i ? k.stroke() : (k.fillStyle = '#c45a3a', k.fill()); }
  k.fillStyle = '#3d2b3f'; k.font = '900 15px system-ui'; k.fillText('B', 0, -50); k.fillText('N', 0, 62); k.fillText('Đ', 56, 5); k.fillText('T', -56, 5); k.restore();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(0, FLOORS[2] + 0.535, 0); m.rotation.y = chart.rot; return m;
}

// vật liệu "trong nhà": cộng thêm màu × uLift (đèn dầu trong tháp) → trong tháp không tối om dù tường che hết nắng
export const LIFT = { value: 0.3 };
function lifted(m, key) { const prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); sh.uniforms.uLift = LIFT; sh.fragmentShader = 'uniform float uLift;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * uLift;'); }; m.customProgramCacheKey = () => 'lh-int-' + key; return m; }
/** dựng toàn bộ; trả về nhóm + các phần cần cập nhật */
export function buildLighthouse(ctx, chart) {
  const g = new THREE.Group(); g.name = 'lighthouse';
  const add = (m, name, { cast = true, occ = true, parent = g } = {}) => { m.name = name; m.castShadow = cast; m.receiveShadow = true; if (!occ) m.userData.noCamOcc = true; parent.add(m); return m; };
  add(new THREE.Mesh(isleGeo(), matV()), 'lighthouse-isle-rock', { cast: false });
  add(new THREE.Mesh(propsGeo(), matV()), 'lighthouse-props', { occ: false });
  const tower = new THREE.Group(); tower.position.y = Y0; g.add(tower);
  // vỏ tháp + lớp trát KHÔNG chặn camera: camera giữ nguyên khoảng cách, khi ra ngoài tường thì vỏ được ẩn (index.js) → nhìn "cắt lớp" như nhà búp bê
  const shell = add(new THREE.Mesh(shellGeo(), matV()), 'lighthouse-shell', { parent: tower, occ: false });
  const inMat = lifted(toon('#ffffff', { vertexColors: true, unique: true }), 'v'), kitMats = new Map(), kitMat = m => { if (!kitMats.has(m)) kitMats.set(m, lifted(m.clone(), 'kit')); return kitMats.get(m); };
  shell.receiveShadow = false;   // thân tròn tự đổ bóng lên mình → sọc răng cưa; không nhận bóng cho sạch
  add(new THREE.Mesh(liningGeo(), inMat), 'lighthouse-lining', { cast: false, occ: false, parent: tower }).receiveShadow = false;
  add(new THREE.Mesh(innerGeo(), inMat), 'lighthouse-inner', { cast: false, occ: false, parent: tower }).receiveShadow = false;
  const [wo, wi] = windowGeos();
  const winOut = new THREE.MeshBasicMaterial({ color: '#2a3440' }), winIn = new THREE.MeshBasicMaterial({ color: '#bfe3f2' });
  add(new THREE.Mesh(wo, winOut), 'lighthouse-win-out', { cast: false, occ: false, parent: tower }); add(new THREE.Mesh(wi, winIn), 'lighthouse-win-in', { cast: false, occ: false, parent: tower });
  const glassM = new THREE.MeshBasicMaterial({ color: '#cfeef2', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const gd = 0.3, glass = add(new THREE.Mesh(new THREE.CylinderGeometry(T.R1 - 0.08, T.R1 - 0.08, T.LANT - 0.95, 26, 1, true, Math.PI / 2 - T.GA + gd, TAU - 2 * gd), glassM), 'lighthouse-glass', { cast: false, occ: false, parent: tower });
  glass.position.y = T.DECK + 0.95 + (T.LANT - 0.95) / 2; glass.renderOrder = 3;
  // thấu kính xoay
  const [lg, lf] = lensGeos(), lens = new THREE.Group(); lens.position.y = T.DECK + 0.96; tower.add(lens);
  const lensM = toon('#bfeee6', { transparent: true, opacity: 0.62, emissive: '#ffe9b0', emissiveIntensity: 0.15, side: THREE.DoubleSide, unique: true });
  add(new THREE.Mesh(lg, lensM), 'lighthouse-lens', { cast: false, occ: false, parent: lens }); add(new THREE.Mesh(lf, matV()), 'lighthouse-lens-frame', { cast: false, occ: false, parent: lens });
  const lamp = add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3c4' })), 'lighthouse-lamp', { cast: false, occ: false, parent: lens }); lamp.position.y = 0.95;
  add(plaqueMesh(), 'lighthouse-plaques', { cast: false, occ: false, parent: tower });
  { // biển tên trên cửa (canvas 512 × 128)
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const k = cv.getContext('2d');
    k.fillStyle = '#1f2a44'; k.fillRect(0, 0, 512, 128); k.strokeStyle = '#d4a24a'; k.lineWidth = 8; k.strokeRect(8, 8, 496, 112); k.textAlign = 'center'; k.textBaseline = 'middle';
    k.fillStyle = '#f7efdc'; k.font = '900 44px system-ui'; k.fillText('HẢI ĐĂNG MŨI SÓNG', 256, 50, 470); k.fillStyle = '#d4a24a'; k.font = '700 26px system-ui'; k.fillText('cao 34 m · 144 bậc · chớp 6,5 giây', 256, 94, 470);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const sign = add(new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.525).rotateY(Math.PI / 2), toon('#ffffff', { map: tex, unique: true })), 'lighthouse-sign', { cast: false, occ: false, parent: tower }); sign.position.set(rOut(T.DOOR_H + 1.5) + 0.06, T.DOOR_H + 1.5, 0); sign.rotation.z = Math.atan((T.R0 - T.R1) / T.DECK);
  }
  add(chartMesh(chart), 'lighthouse-chart', { cast: false, occ: false, parent: tower });
  // quần áo phơi
  const cloth = add(new THREE.Mesh(clothGeo(), matV()), 'lighthouse-cloth', { occ: false }); cloth.material = toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide }); cloth.position.set((LINE.e0 + LINE.e1) / 2, Y0 + 2.06, LINE.n + 0.4);
  // bọt sóng
  const foam = new THREE.Mesh(foamGeo(), foamMat()); foam.name = 'lighthouse-foam-water'; foam.renderOrder = 2; foam.frustumCulled = false; g.add(foam);

  // ----- model CC0 (kit): đá, nhà, thuyền con, thùng, phao, đèn, rau, đồ gỗ -----
  const hY = (e, n) => isleH(e, n), kit = (name, list, shadow = true) => placeKit(g, name, list, { shadow }).then(ms => { for (const m of ms) m.userData.noCamOcc = true; return ms; });
  kit('rock_shore_a', SKERRIES.filter((_, i) => i % 3 === 0).map(([e, n, s, r]) => [e, -1.0, n, s, r]).concat([[-24, 1.2, 14, 1.3, 1], [22, -0.6, -19, 0.9, 2]]));
  kit('rock_shore_b', SKERRIES.filter((_, i) => i % 3 === 1).map(([e, n, s, r]) => [e, -1.2, n, s, r]).concat([[-14, 4.2, 12, 1.25, 0.6], [-27, 0.2, -6, 1.1, 4]]));
  kit('rock_shore_c', SKERRIES.filter((_, i) => i % 3 === 2).map(([e, n, s, r]) => [e, -0.8, n, s, r]).concat([[-21, 5.2, 4, 1.5, 2.2], [12, 0.3, 27, 1.2, 5], [9, 0.2, -29, 1.0, 3]]));
  kit('rock_wide', [[-16, hY(-16, -9) - 0.2, -9, 2.2, 0.5], [16.5, hY(16.5, 6) - 0.25, 6, 1.6, 2], [-9, hY(-9, 19) - 0.2, 19, 2.0, 4], [19, hY(19, -8) - 0.3, -8, 1.8, 1.2], [-3, hY(-3, -21) - 0.2, -21, 2.4, 3]], false);
  kit('house_suburb_a_warm', [[HOUSE.e, Y0 - 0.02, HOUSE.n, 6.2, HOUSE.ry]]);
  kit('boat_row', [[30, hY(30, 6.5) + 0.1, 6.5, 1.5, 0.5]]);                                             // thuyền con kéo lên bãi cát cạnh bến
  kit('boat_row_small', [[PIER.e1 - 5, -0.12, PIER.hw + 1.5, 1.4, 0.06]]);                               // thuyền con buộc ở bến
  kit('barrels', [[PIER.e0 + 2.2, PIER.y, -0.9, 2.6, 0.4], [8.6, Y0, -6.6, 2.6, 2.1]], false);
  kit('crate', [[PIER.e0 + 4.6, PIER.y, 0.85, 1.25, 0.3], [PIER.e1 - 3.4, PIER.y, -0.8, 1.25, 1.2]], false);
  kit('prop_buoy', [[52, -0.45, 9, 1.3, 0], [52, -0.45, -9, 1.3, 1]], false);                            // 2 phao tiêu đánh dấu luồng vào bến
  kit('prop_lantern', [[PIER.e1 - 0.4, PIER.y, -PIER.hw + 0.25, 1.35, 0], [S_TOP[0], Y0, S_TOP[1], 1.35, 0], [S_TOP[0], Y0, -S_TOP[1], 1.35, 0], [PIER.e0 + 0.6, PIER.y, PIER.hw - 0.25, 1.35, 0]], false);
  kit('prop_crate_carrots', [[GARDEN.e + 3.6, Y0, GARDEN.n + 1.2, 0.42, 0.3]], false);
  kit('prop_crate_tomatoes', [[GARDEN.e + 3.5, Y0, GARDEN.n - 1.6, 0.42, 1.1]], false);
  const veg = []; for (let k = 0; k < 3; k++) for (let i = 0; i < 8; i++) veg.push([GARDEN.e - 2.3 + i * 0.66, Y0 + 0.16, GARDEN.n - 1.6 + k * 1.6, 1.5 + ((i * 7 + k * 3) % 5) * 0.16, i * 1.3 + k]);
  kit('plant_bush_small', veg, false);
  const bg = []; for (let k = 0; k < 21; k++) { const a = k * 2.399, r = 17.5 + (k % 5) * 1.5, e = Math.cos(a) * r, n = Math.sin(a) * r; if ((Math.abs(n) > 4 || e < 14) && Math.hypot(e - CRAG.e, n - CRAG.n) > CRAG.r + 1 && Math.hypot(e - HOUSE.e, n - HOUSE.n) > 6.5) bg.push([e, hY(e, n) - 0.03, n, 1 + (k % 3) * 0.3, k]); }
  kit('plant_beach_grass', bg, false);
  // đồ gỗ trong tháp (đặt trong nhóm tháp: y tính từ nền tháp)
  const tk = (name, list) => placeKit(tower, name, list, { shadow: false }).then(ms => { for (const m of ms) { m.userData.noCamOcc = true; m.receiveShadow = false; if (!Array.isArray(m.material)) m.material = kitMat(m.material); } });
  tk('furn_table_small', [[-2.0, 0, -1.8, 0.85, 0.5], [1.5, FLOORS[1], 1.4, 0.8, 0.3]]);
  tk('furn_chair_wood', [[-1.2, 0, -2.3, 0.9, -1.0], [0.75, FLOORS[1], 1.75, 0.85, 1.9], [1.45, FLOORS[2], -0.4, 0.85, -1.7]]);
  tk('furn_cabinet', [[0.1, FLOORS[1], -2.05, 0.75, 0]]);
  tk('furn_table_round', [[0, FLOORS[2], 0, 0.52, 0]]);
  tk('furn_bookshelf_full', [[-0.3, FLOORS[2], 1.75, 0.8, Math.PI]]);
  tk('barrels', [[2.6, 0, -1.7, 2.4, 1.0]]);
  tk('chest', [[-2.3, 0, 1.3, 0.8, 2.2]]);
  tk('prop_lantern_hanging', [[0, FLOORS[1] - 0.95, 0, 1.2, 0], [0, FLOORS[2] - 0.95, 0, 1.2, 0], [0, FLOORS[3] - 0.95, 0, 1.2, 0]]);
  // rùa biển nằm phơi trên đá thấp + bãi cát cạnh bến
  scatterModel(g, 'rua', [[27.5, hY(27.5, -6) + 0.02, -6, 1.5, 2.2], [-26.5, 2.75, 13.2, 1.3, 0.8], [-13.2, 6.3, 11.4, 1.1, 4.1]]).then(ms => { for (const m of ms) { m.castShadow = false; m.userData.noCamOcc = true; } });

  const dispose = () => { g.traverse(o => { if (o.isMesh && !o.isInstancedMesh) { o.geometry.dispose(); const m = o.material; if (m && m.map) { m.map.dispose(); m.dispose(); } } }); foam.material.dispose(); lensM.dispose(); inMat.dispose(); for (const m of kitMats.values()) m.dispose(); g.removeFromParent(); };
  return { group: g, tower, shell, lens, lensM, lamp, winOut, winIn, glassM, foam, cloth, dispose };
}
const S_TOP = [STAIR.e0 - 0.5, STAIR.hw + 0.55];
