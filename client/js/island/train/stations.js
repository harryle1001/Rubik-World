// train/stations.js — GA ĐI (bờ tây bắc đảo Rubik) và GA ĐẾN (cao nguyên Học viện) — greybox.
// Ga đi: sân ga 55 × 5 m phía đất liền + nền ga (sân trước) + nhà ga 34 × 13 m + tháp đồng hồ 21 m + mái vòm che sân ga.
// Ga đến: sân ga nhỏ 55 × 5 m phía lâu đài, mái che + cột đèn lồng.
import * as THREE from 'three';
import { Batch } from '../academy/geo.js';
import { matV, mat } from '../sample/palette.js';
import { at, nearest, LEN, S_A0, S_A1, S_A, S_B0, S_B1, S_B, YA, YB, PLAT_H, PLAT_W } from './route.js';

export const EDGE = 1.6;                                   // mép sân ga cách tim đường 1,6 m (toa rộng 2,6 m)
export const SIDE_A = -1, SIDE_B = 1;                      // ga đi: sân ga bên phải chiều đi (phía đất liền); ga đến: bên trái (phía lâu đài)
export const TERRACE_A = 21;                               // nền ga đi rộng tới 21 m tính từ tim đường
const RAMP = 0.382;                                        // dốc lối lên (1/φ²)

const _m = new THREE.Matrix4(), _r = new THREE.Matrix4();
function along(b, geo, col, s, lat, y) {
  const p = at(s), g = geo.toNonIndexed();
  _m.makeTranslation(p.x - p.tz * lat, y, p.z + p.tx * lat).multiply(_r.makeRotationY(Math.atan2(p.tx, p.tz)));
  g.applyMatrix4(_m); b.add(g, col); return b;
}
const box = (w, h, l) => new THREE.BoxGeometry(w, h, l);

export function buildStations(ctx) {
  const b = new Batch(), glow = new Batch();
  // ---------- GA ĐI ----------
  const topA = YA + PLAT_H;
  for (let s = S_A0; s < S_A1; s += 5) {
    const sm = Math.min(s + 2.5, S_A1 - 0.01), l = Math.min(5, S_A1 - s) + 0.03;
    along(b, box(PLAT_W, topA + 6, l), '#d6ccbb', sm, SIDE_A * (EDGE + PLAT_W / 2), (topA - 6) / 2);            // sân ga (khối đá tới đáy biển)
    along(b, box(0.4, 0.06, l), '#f2c443', sm, SIDE_A * (EDGE + 0.5), topA + 0.03);                              // vạch vàng an toàn
    along(b, box(TERRACE_A - EDGE - PLAT_W, topA + 6, l), '#bdb2a0', sm, SIDE_A * (EDGE + PLAT_W + (TERRACE_A - EDGE - PLAT_W) / 2), (topA - 6) / 2);   // nền ga
  }
  // nhà ga gạch 34 × 13 × 8,5 m + tháp đồng hồ 5 × 5 × 21 m
  const latH = SIDE_A * 13.6;
  along(b, box(11, 8.5, 34), '#a5573f', S_A, latH, topA + 4.25);
  along(b, box(12, 0.8, 35), '#93402a', S_A, latH, topA + 8.9);
  along(b, box(5, 21, 5), '#a5573f', S_A, latH, topA + 10.5);
  along(b, box(5.6, 1.2, 5.6), '#93402a', S_A, latH, topA + 21.6);
  along(b, box(3.2, 3.2, 5.1), '#f3efe6', S_A, latH, topA + 17);                                                   // mặt đồng hồ (2 phía)
  // mái vòm thép kính che sân ga + đường ray: 5 khung vòm + mặt kính
  const latC = SIDE_A * 1.9, spanW = 12;
  for (let k = 0; k <= 4; k++) {
    const s = S_A0 + 4 + k * (PLAT_L_ - 8) / 4;
    for (let j = 0; j < 8; j++) {
      const a0 = Math.PI * j / 8, a1 = Math.PI * (j + 1) / 8, x0 = Math.cos(a0) * spanW / 2, x1 = Math.cos(a1) * spanW / 2, y0 = Math.sin(a0) * 3.4, y1 = Math.sin(a1) * 3.4;
      const g = box(Math.hypot(x1 - x0, y1 - y0), 0.25, 0.3); g.rotateZ(Math.atan2(y1 - y0, x1 - x0));   // local +x = phía phải (−lat)
      along(b, g, '#3a3344', s, latC - (x0 + x1) / 2, topA + 5.2 + (y0 + y1) / 2);
    }
    for (const sd of [-1, 1]) along(b, box(0.3, 5.2, 0.3), '#3a3344', s, latC + sd * spanW / 2, topA + 2.6);
  }
  along(b, box(spanW + 0.6, 0.12, PLAT_L_ - 6), '#8fb9cc', S_A, latC, topA + 8.4);
  // ---------- GA ĐẾN ----------
  const topB = YB + PLAT_H;
  for (let s = S_B0; s < S_B1; s += 5) {
    const sm = Math.min(s + 2.5, S_B1 - 0.01), l = Math.min(5, S_B1 - s) + 0.03;
    along(b, box(PLAT_W, 2.2, l), '#d6ccbb', sm, SIDE_B * (EDGE + PLAT_W / 2), topB - 1.1);
    along(b, box(0.4, 0.06, l), '#f2c443', sm, SIDE_B * (EDGE + 0.5), topB + 0.03);
  }
  along(b, box(3.4, 3, 13), '#a8744a', S_B, SIDE_B * (EDGE + 3.4), topB + 1.5);                                   // mái chờ
  along(b, box(4.4, 0.4, 14.5), '#93402a', S_B, SIDE_B * (EDGE + 3.2), topB + 3.2);
  for (let k = 0; k < 6; k++) {
    const s = S_B0 + 3 + k * (PLAT_L_ - 6) / 5;
    along(b, box(0.16, 3, 0.16), '#3a3344', s, SIDE_B * (EDGE + PLAT_W - 0.4), topB + 1.5);
    along(glow, box(0.4, 0.55, 0.4), '#ffe3a0', s, SIDE_B * (EDGE + PLAT_W - 0.4), topB + 3.2);
  }
  const m = new THREE.Mesh(b.build(), matV()); m.castShadow = m.receiveShadow = true;
  const g = new THREE.Mesh(glow.build(), mat('lampGlow'));
  const group = new THREE.Group(); group.name = 'train-stations'; group.add(m, g); ctx.scene.add(group);
  return { group, topA, topB };
}
const PLAT_L_ = S_A1 - S_A0;

// Mặt đi của 2 ga (sân ga, nền ga, lối dốc ở 2 đầu) — null nếu ngoài ga
export function stationGround(x, z) {
  const pA = at(S_A), pB = at(S_B);
  if ((x - pA.x) ** 2 + (z - pA.z) ** 2 < 70 * 70) {
    const q = nearest(x, z, S_A0 - 34, S_A1 + 34), d = q.d * SIDE_A;
    if (d > EDGE && d < TERRACE_A + 8) {
      const top = YA + PLAT_H, over = Math.max(S_A0 - q.s, q.s - S_A1, d - TERRACE_A, 0);
      return top - over * RAMP;
    }
  }
  if ((x - pB.x) ** 2 + (z - pB.z) ** 2 < 70 * 70) {
    const q = nearest(x, z, S_B0 - 21, Math.min(LEN, S_B1 + 21)), d = q.d * SIDE_B;
    if (d > EDGE && d < EDGE + PLAT_W + 5) {
      const top = YB + PLAT_H, over = Math.max(S_B0 - q.s, q.s - S_B1, d - EDGE - PLAT_W, 0);
      return top - over * RAMP;
    }
  }
  return null;
}
