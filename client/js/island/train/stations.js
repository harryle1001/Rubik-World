// train/stations.js — GA ĐI (bờ tây bắc đảo Rubik) và GA ĐẾN (cao nguyên Học viện).
// Ga đi: sân ga 55 × 5 m + nền ga; nhà ga gạch 34 × 11 m (34/21 ≈ φ) có cửa sổ vòm, phào đá kem, mái ngói;
// tháp đồng hồ 21 m — mặt đồng hồ chạy theo GIỜ TRONG GAME (tập xem giờ kim); mái vòm thép kính che sân ga + ray,
// đèn treo, ghế chờ, xe đẩy hành lý, biển tên + bảng giờ tàu; học sinh đứng/ngồi chờ tàu.
// Ga đến: sân ga 55 × 5 m, mái chờ gỗ, 6 cột đèn lồng, biển chỉ đường (lâu đài · bến thuyền đèn lồng).
// Draw call mỗi ga: khối gộp 1 + đèn 1 + biển chữ 1 (+ đồng hồ 1 ở ga đi).
import * as THREE from 'three';
import { Batch } from '../academy/geo.js';
import { matV, mat } from '../sample/palette.js';
import { loadHero } from '../characters.js';
import { at, nearest, LEN, S_A0, S_A1, S_A, S_B0, S_B1, S_B, YA, YB, PLAT_H, PLAT_W, PHI } from './route.js';

export const EDGE = 1.6;                                   // mép sân ga cách tim đường 1,6 m (toa rộng 2,6 m)
export const SIDE_A = -1, SIDE_B = 1;                      // ga đi: sân ga bên phải chiều đi (phía đất liền); ga đến: bên trái (phía lâu đài)
export const TERRACE_A = 21;                               // nền ga đi rộng tới 21 m tính từ tim đường
const RAMP = 0.382;                                        // dốc lối lên (1/φ²)
const PLAT_L_ = S_A1 - S_A0;
const BRICK = '#a5573f', BRICKD = '#8a4634', CREAM = '#efe3c8', CREAMD = '#d9c8a6', WARM = '#bdb2a0', ROOF = '#93402a', IRON = '#3a3344', WOOD = '#a8744a', WOODD = '#6e4a30', GLASS = '#8fb9cc', BRASS = '#d4a24a';

const _m = new THREE.Matrix4(), _r = new THREE.Matrix4();
// đặt khối theo tuyến: tâm ở s, lệch ngang lat (+ trái chiều đi), cao y; trục z cục bộ = hướng tuyến, x cục bộ = phía phải (−lat)
function along(b, geo, col, s, lat, y, ry = 0) {
  const p = at(s), g = geo.index ? geo.toNonIndexed() : geo;
  if (ry) g.rotateY(ry);
  _m.makeTranslation(p.x - p.tz * lat, y, p.z + p.tx * lat).multiply(_r.makeRotationY(Math.atan2(p.tx, p.tz)));
  g.applyMatrix4(_m); b.add(g, col); return b;
}
const box = (w, h, l) => new THREE.BoxGeometry(w, h, l);
const toWorld = (s, lat) => { const p = at(s); return [p.x - p.tz * lat, p.z + p.tx * lat, Math.atan2(p.tx, p.tz)]; };

// ---------- chữ trên biển (1 canvas cho cả ga → 1 draw call) ----------
function signTex(lines) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128 * lines.length; const k = c.getContext('2d');
  lines.forEach(([txt, bg, fg, font], i) => {
    const y = i * 128; k.fillStyle = bg; k.fillRect(0, y, 512, 128); k.strokeStyle = BRASS; k.lineWidth = 6; k.strokeRect(8, y + 8, 496, 112);
    k.fillStyle = fg; k.font = font || 'bold 54px Georgia, serif'; k.textAlign = 'center'; k.textBaseline = 'middle';
    String(txt).split('\n').forEach((t, j, a) => k.fillText(t, 256, y + 64 + (j - (a.length - 1) / 2) * 40, 480));
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// tấm biển: hàng thứ i của canvas (n hàng), rộng w, cao h, đặt theo tuyến, quay mặt về phía face (+1 trái / −1 phải / 0 dọc tuyến)
function signQuad(list, n) {
  const pos = [], uv = [];
  for (const { i, w, h, s, lat, y, face, mirror } of list) {
    const p = at(s), [x, z] = toWorld(s, lat), m = mirror ? -1 : 1, nx = (face ? -p.tz * face : p.tx) * m, nz = (face ? p.tx * face : p.tz) * m;   // pháp tuyến mặt biển (mặt sau: đảo chiều)
    const rx = nz, rz = -nx, v0 = 1 - (i + 1) / n, v1 = 1 - i / n;                                                // hướng chữ chạy (bên phải người xem)
    const P = (a, b) => [x + rx * a * w / 2, y + b * h / 2, z + rz * a * w / 2];
    pos.push(...P(-1, -1), ...P(1, -1), ...P(1, 1), ...P(-1, -1), ...P(1, 1), ...P(-1, 1));
    uv.push(0, v0, 1, v0, 1, v1, 0, v0, 1, v1, 0, v1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// ---------- đồ vật nhỏ ----------
function bench(b, s, lat, y, ry) {   // ghế chờ 1,6 m: chân sắt, mặt + tựa gỗ
  const g = new Batch();
  g.box(-0.8, 0.8, 0.42, 0.48, -0.22, 0.22, WOOD); g.box(-0.8, 0.8, 0.55, 0.9, -0.26, -0.2, WOOD);
  for (const x of [-0.65, 0.65]) g.box(x - 0.04, x + 0.04, 0, 0.9, -0.24, 0.2, IRON);
  along(b, g.build(), '#ffffff', s, lat, y, ry); return b;
}
function cart(b, s, lat, y, ry) {    // xe đẩy hành lý: sàn gỗ, 4 bánh, tay đẩy sắt, chồng va li màu
  const g = new Batch();
  g.box(-0.55, 0.55, 0.3, 0.38, -0.9, 0.9, WOODD); for (const x of [-0.45, 0.45]) for (const z of [-0.7, 0.7]) g.cyl(x, 0, z, 0.15, 0.3, IRON, 6);
  g.box(-0.5, 0.5, 0.38, 1.1, 0.88, 0.92, IRON);
  [['#2c6455', 0.9, 0.42], ['#c45a3a', 0.8, 0.36], ['#d4a24a', 0.6, 0.3], ['#6e4a30', 0.7, 0.28]].reduce((y0, [c, w, h], k) => { const z = -0.45 + (k % 2) * 0.5; g.box(-w / 2, w / 2, y0, y0 + h, z - 0.38, z + 0.38, c); return k % 2 ? y0 + h : y0; }, 0.38);
  along(b, g.build(), '#ffffff', s, lat, y, ry); return b;
}
// Batch.add tô 1 màu cho cả khối → dùng màu đỉnh có sẵn: thêm thẳng hình (đã tô) vào batch
const keepColor = b => { const add = b.add.bind(b); b.add = (geo, col, ...r) => { if (col === '#ffffff' && geo.attributes.color) { const g = geo.clone(); b.list.push(g); return b; } return add(geo, col, ...r); }; return b; };

export function buildStations(ctx) {
  const b = keepColor(new Batch()), glow = new Batch(), group = new THREE.Group(); group.name = 'train-stations';
  const topA = YA + PLAT_H, colliders = ctx.colliders;
  // ================= GA ĐI =================
  for (let s = S_A0; s < S_A1; s += 5) {
    const sm = Math.min(s + 2.5, S_A1 - 0.01), l = Math.min(5, S_A1 - s) + 0.03;
    along(b, box(PLAT_W, topA + 6, l), '#d6ccbb', sm, SIDE_A * (EDGE + PLAT_W / 2), (topA - 6) / 2);            // sân ga (khối đá tới đáy biển)
    along(b, box(0.3, 0.12, l), CREAMD, sm, SIDE_A * (EDGE + 0.12), topA - 0.04);                                // gờ mép sân ga
    along(b, box(0.4, 0.04, l), '#f2c443', sm, SIDE_A * (EDGE + 0.55), topA + 0.02);                             // vạch vàng an toàn
    along(b, box(TERRACE_A - EDGE - PLAT_W, topA + 6, l), WARM, sm, SIDE_A * (EDGE + PLAT_W + (TERRACE_A - EDGE - PLAT_W) / 2), (topA - 6) / 2);   // nền ga
  }
  // nhà ga: tâm cách tim đường 13,6 m, dài 34 m (dọc tuyến), sâu 11 m, tường gạch 7 m
  const latH = SIDE_A * 13.6, HL = 34, HD = 11, HW = 7;
  along(b, box(HD + 0.6, 0.7, HL + 0.6), WARM, S_A, latH, topA + 0.35);                                         // bệ đá
  along(b, box(HD, HW - 0.7, HL), BRICK, S_A, latH, topA + 0.7 + (HW - 0.7) / 2);                               // tường gạch
  along(b, box(HD + 0.5, 0.45, HL + 0.5), CREAM, S_A, latH, topA + HW + 0.2);                                    // phào đỉnh tường
  along(b, box(HD + 0.2, 0.2, HL + 0.2), CREAMD, S_A, latH, topA + 3.3);                                         // gờ giữa
  { const g = new Batch(); g.gable(-HD / 2 - 0.6, HD / 2 + 0.6, -HL / 2 - 0.6, HL / 2 + 0.6, 0, (HD + 1.2) / 2 / PHI, ROOF); along(b, g.build(), ROOF, S_A, latH, topA + HW + 0.42); }   // mái dốc atan(1/φ)
  // cửa sổ vòm 2 tầng × 2 mặt (cao : rộng = φ), cửa đi vòm ở giữa
  for (const side of [-1, 1]) {
    const faceLat = latH + side * (HD / 2 + 0.03);
    for (let k = -6; k <= 6; k++) {
      const s = S_A + k * 2.6, door = k === 0, w = door ? 1.6 : 1.0, h = door ? 2.6 : 1.618;
      for (const fl of door ? [0] : [0, 1]) {
        const y0 = topA + 0.7 + (door ? 0 : 0.9 + fl * 3.2);
        along(b, box(0.12, h, w), door ? WOODD : GLASS, s, faceLat, y0 + h / 2);
        along(b, new THREE.CylinderGeometry(w / 2, w / 2, 0.12, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), door ? WOODD : GLASS, s, faceLat, y0 + h);
        along(b, box(0.16, 0.12, w + 0.3), CREAM, s, faceLat, y0 - 0.06);                                       // bậu cửa
        along(b, new THREE.TorusGeometry(w / 2 + 0.06, 0.09, 4, 10, Math.PI).rotateY(Math.PI / 2), CREAM, s, faceLat, y0 + h);   // vành vòm
      }
    }
  }
  // tháp đồng hồ 5 × 5 × 21 m ở giữa, mái chóp + quả cầu đồng
  along(b, box(5, 21 - HW, 5), BRICK, S_A, latH, topA + HW + (21 - HW) / 2);
  for (const y of [HW + 4.5, 19.2]) along(b, box(5.5, 0.45, 5.5), CREAM, S_A, latH, topA + y);
  along(b, new THREE.ConeGeometry(4.0, 6.5, 4).rotateY(Math.PI / 4), ROOF, S_A, latH, topA + 21 + 3.25);
  along(b, new THREE.SphereGeometry(0.42, 8, 6), BRASS, S_A, latH, topA + 27.7);
  for (const side of [-1, 1]) along(b, new THREE.CylinderGeometry(1.75, 1.75, 0.2, 20).rotateZ(Math.PI / 2), CREAM, S_A, latH + side * 2.5, topA + 16.4);   // khung tròn đồng hồ
  for (const [s, l] of [[S_A - HL / 2 - 0.6, 2], [S_A + HL / 2 + 0.6, 2]]) for (let k = -2; k <= 2; k++) { const [x, z] = toWorld(s, latH + k * 2.2); colliders.push({ x, z, r: 1.4 }); }
  for (let k = -8; k <= 8; k++) for (const side of [-1, 1]) { const [x, z] = toWorld(S_A + k * 2, latH + side * (HD / 2 - 0.9)); colliders.push({ x, z, r: 1.3 }); }
  // mái vòm thép kính che sân ga + ray: 11 khung vòm (5,5 m/khung), mặt kính 4 mảnh xấp xỉ cung tròn
  const latC = SIDE_A * 2.2, spanW = 12.4, R0 = 3.6, Y0 = topA + 5.4;
  const arcPt = a => [Math.cos(a) * spanW / 2, Math.sin(a) * R0];
  for (let k = 0; k <= 10; k++) {
    const s = S_A0 + 1.5 + k * (PLAT_L_ - 3) / 10;
    for (let j = 0; j < 10; j++) {
      const [x0, y0] = arcPt(Math.PI * j / 10), [x1, y1] = arcPt(Math.PI * (j + 1) / 10);
      const g = box(Math.hypot(x1 - x0, y1 - y0) + 0.04, 0.22, 0.22); g.rotateZ(Math.atan2(y1 - y0, x1 - x0));
      along(b, g, IRON, s, latC - (x0 + x1) / 2, Y0 + (y0 + y1) / 2);
    }
    for (const sd of [-1, 1]) {
      along(b, box(0.26, Y0 - topA, 0.26), IRON, s, latC + sd * spanW / 2, topA + (Y0 - topA) / 2);
      along(b, box(0.5, 0.3, 0.5), IRON, s, latC + sd * spanW / 2, topA + 0.15);
      const [cx, cz] = toWorld(s, latC + sd * spanW / 2); colliders.push({ x: cx, z: cz, r: 0.3 });
    }
    // đèn treo dưới vòm (mỗi khung)
    along(b, box(0.04, 1.4, 0.04), IRON, s, latC, Y0 + R0 - 0.9);
    along(glow, new THREE.SphereGeometry(0.26, 8, 6), '#ffe3a0', s, latC + SIDE_A * 1.2, Y0 + R0 - 1.9);
    along(b, new THREE.ConeGeometry(0.34, 0.24, 8), IRON, s, latC + SIDE_A * 1.2, Y0 + R0 - 1.65);
  }
  for (let j = 0; j < 4; j++) {   // mặt kính + xà dọc
    const [x0, y0] = arcPt(Math.PI * j / 4), [x1, y1] = arcPt(Math.PI * (j + 1) / 4);
    const g = box(Math.hypot(x1 - x0, y1 - y0) + 0.05, 0.06, PLAT_L_ - 2); g.rotateZ(Math.atan2(y1 - y0, x1 - x0));
    along(b, g, GLASS, S_A, latC - (x0 + x1) / 2, Y0 + (y0 + y1) / 2 + 0.16);
    const r = box(0.16, 0.16, PLAT_L_ - 2); along(b, r, IRON, S_A, latC - x0, Y0 + y0 + 0.08);
  }
  // ghế chờ, xe đẩy hành lý
  const benchesA = [S_A - 18, S_A - 6, S_A + 6, S_A + 18];
  for (const s of benchesA) { bench(b, s, SIDE_A * (EDGE + 3.9), topA, Math.PI / 2 * SIDE_A); const [x, z] = toWorld(s, SIDE_A * (EDGE + 3.9)); colliders.push({ x, z, r: 0.5 }); }
  for (const s of [S_A - 12, S_A + 23]) { cart(b, s, SIDE_A * (EDGE + 3.2), topA, 0.3); const [x, z] = toWorld(s, SIDE_A * (EDGE + 3.2)); colliders.push({ x, z, r: 0.8 }); }
  // biển tên + bảng giờ tàu
  const signs = [
    ['GA ĐẢO RUBIK', '#1f463c', '#f2dca6'],
    ['GA HỌC VIỆN PHA LÊ', '#1f463c', '#f2dca6', 'bold 46px Georgia, serif'],
    ['🚂 TÀU PHA LÊ\nkhởi hành mỗi giờ tròn (giờ trong game)', '#2a2630', '#f7ecd0', 'bold 30px system-ui'],
    ['↑ Lâu đài Học viện\n↓ Bến thuyền đèn lồng (men mép cao nguyên)', '#2a2630', '#f7ecd0', 'bold 28px system-ui'],
  ];
  const tex = signTex(signs), quads = [];
  for (const s of [S_A - 13, S_A + 13]) quads.push({ i: 0, w: 4.2, h: 1.05, s, lat: SIDE_A * (EDGE + 2.5), y: topA + 3.6, face: 0 });   // biển treo dưới mái vòm
  quads.push({ i: 0, w: 8, h: 2, s: S_A, lat: latH + SIDE_A * (HD / 2 + 0.08), y: topA + HW - 1.0, face: SIDE_A });   // biển lớn phía đất liền
  quads.push({ i: 2, w: 3.4, h: 0.85, s: S_A + 4.5, lat: latH - SIDE_A * (HD / 2 + 0.08), y: topA + 2.4, face: -SIDE_A });   // bảng giờ tàu phía sân ga
  for (const s of [S_A - 13, S_A + 13]) { along(b, box(0.05, 1.3, 0.05), IRON, s - 1.6, SIDE_A * (EDGE + 2.5), topA + 4.8); along(b, box(0.05, 1.3, 0.05), IRON, s + 1.6, SIDE_A * (EDGE + 2.5), topA + 4.8); }
  // mặt sau tấm biển treo: quay ngược để đọc được từ 2 phía
  const back = () => quads.filter(q => q.face === 0 && !q.mirror).map(q => ({ ...q, s: q.s - 0.03, mirror: true }));
  // ================= GA ĐẾN =================
  const topB = YB + PLAT_H;
  for (let s = S_B0; s < S_B1; s += 5) {
    const sm = Math.min(s + 2.5, S_B1 - 0.01), l = Math.min(5, S_B1 - s) + 0.03;
    along(b, box(PLAT_W, 2.2, l), '#d6ccbb', sm, SIDE_B * (EDGE + PLAT_W / 2), topB - 1.1);
    along(b, box(0.3, 0.12, l), CREAMD, sm, SIDE_B * (EDGE + 0.12), topB - 0.04);
    along(b, box(0.4, 0.04, l), '#f2c443', sm, SIDE_B * (EDGE + 0.55), topB + 0.02);
  }
  // mái chờ gỗ 13 m: 4 cột, mái dốc về phía sau, ghế
  for (const ds of [-6, -2, 2, 6]) along(b, box(0.2, 2.9, 0.2), WOODD, S_B + ds, SIDE_B * (EDGE + 4.4), topB + 1.45);
  along(b, box(0.15, 2.4, 13), WOOD, S_B, SIDE_B * (EDGE + 4.7), topB + 1.2);
  { const g = box(3.6, 0.18, 14); g.rotateZ(-SIDE_B * 0.24); along(b, g, ROOF, S_B, SIDE_B * (EDGE + 3.3), topB + 3.05); }
  for (const ds of [-4, 0, 4]) bench(b, S_B + ds, SIDE_B * (EDGE + 4.1), topB, Math.PI / 2 * SIDE_B);
  // 6 cột đèn lồng: cột sắt 3 m, cần treo, đèn lồng 6 cạnh (thân sáng + nắp/đáy sắt)
  for (let k = 0; k < 6; k++) {
    const s = S_B0 + 3 + k * (PLAT_L_ - 6) / 5, lat = SIDE_B * (EDGE + PLAT_W - 0.45);
    along(b, box(0.14, 3.2, 0.14), IRON, s, lat, topB + 1.6); along(b, box(0.06, 0.06, 0.7), IRON, s + 0.0, lat, topB + 3.15, Math.PI / 2);
    const ll = lat - SIDE_B * 0.55;
    along(glow, new THREE.CylinderGeometry(0.2, 0.24, 0.5, 6), '#ffe3a0', s, ll, topB + 2.6);
    along(b, new THREE.ConeGeometry(0.3, 0.2, 6), IRON, s, ll, topB + 2.95); along(b, new THREE.CylinderGeometry(0.15, 0.2, 0.08, 6), IRON, s, ll, topB + 2.33);
  }
  quads.push({ i: 1, w: 5.2, h: 1.0, s: S_B, lat: SIDE_B * (EDGE + 4.62), y: topB + 2.0, face: -SIDE_B });
  { const s = S_B1 + 6, lat = SIDE_B * (EDGE + 3); along(b, box(0.14, 2.6, 0.14), WOODD, s, lat, topB - 0.9 + 1.3); quads.push({ i: 3, w: 3.6, h: 0.9, s, lat, y: topB + 0.9, face: 0 }); }
  // ---------- dựng ----------
  const m = new THREE.Mesh(b.build(), matV()); m.castShadow = m.receiveShadow = true;
  const g = new THREE.Mesh(glow.build(), mat('lampGlow'));
  const sg = new THREE.Mesh(signQuad([...quads, ...back()], signs.length), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  group.add(m, g, sg);
  // đồng hồ tháp: 2 mặt, vẽ kim theo giờ trong game (vẽ lại mỗi phút game, chỉ khi ở gần)
  const cc = document.createElement('canvas'); cc.width = cc.height = 256; const ck = cc.getContext('2d'), ctex = new THREE.CanvasTexture(cc); ctex.colorSpace = THREE.SRGBColorSpace;
  const drawClock = h => {
    ck.fillStyle = '#f7efdc'; ck.beginPath(); ck.arc(128, 128, 124, 0, 7); ck.fill(); ck.strokeStyle = '#2a2630'; ck.lineWidth = 6; ck.stroke();
    ck.fillStyle = '#2a2630'; ck.font = 'bold 30px Georgia, serif'; ck.textAlign = 'center'; ck.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; ck.fillText(String(i), 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); }
    const hand = (a, l, w, c) => { ck.strokeStyle = c; ck.lineWidth = w; ck.lineCap = 'round'; ck.beginPath(); ck.moveTo(128, 128); ck.lineTo(128 + Math.sin(a) * l, 128 - Math.cos(a) * l); ck.stroke(); };
    hand((h % 12) / 12 * Math.PI * 2, 58, 9, '#2a2630'); hand((h % 1) * Math.PI * 2, 86, 5, '#2a2630'); ck.fillStyle = BRASS; ck.beginPath(); ck.arc(128, 128, 9, 0, 7); ck.fill();
    ctex.needsUpdate = true;
  };
  drawClock(10.5);
  const cpos = [];
  for (const side of [-1, 1]) {
    const p = at(S_A), [x, z] = toWorld(S_A, latH + side * 2.62), nx = -p.tz * side, nz = p.tx * side, rx = nz, rz = -nx, R = 1.6, y = topA + 16.4;
    const P = (a, c) => [x + rx * a * R, y + c * R, z + rz * a * R];
    cpos.push(...P(-1, -1), ...P(1, -1), ...P(1, 1), ...P(-1, -1), ...P(1, 1), ...P(-1, 1));
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cpos, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
  const clock = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ map: ctex, transparent: true, alphaTest: 0.5 })); group.add(clock);
  ctx.scene.add(group);

  // ---------- học sinh chờ tàu ----------
  const crowd = [];
  const people = [
    ['A', S_A - 18.3, SIDE_A * (EDGE + 3.9), 'student-female-c', '#ff5a8a', 'sit'], ['A', S_A - 17.3, SIDE_A * (EDGE + 3.9), 'student-male-a', '#2b6cb0', 'sit'],
    ['A', S_A - 2, SIDE_A * (EDGE + 2.2), 'student-male-d', '#ffd23f', 'idle'], ['A', S_A + 0.8, SIDE_A * (EDGE + 2.5), 'student-female-e', '#7fd1ff', 'idle'],
    ['A', S_A + 9, SIDE_A * (EDGE + 2.0), 'student-male-f', '#b06bff', 'idle'],
    ['B', S_B - 0.4, SIDE_B * (EDGE + 4.1), 'student-female-f', '#ff8a2b', 'sit'], ['B', S_B + 9, SIDE_B * (EDGE + 2.2), 'student-male-b', '#e0564a', 'idle'],
  ];
  for (const [stn, s, lat, kind, bag, pose] of people) loadHero(kind, 1.48 + Math.random() * 0.1, { role: 'student', bag }).then(h => {
    if (!h) return; const top = stn === 'A' ? topA : topB, side = stn === 'A' ? SIDE_A : SIDE_B, p = at(s), [x, z] = toWorld(s, lat - side * (pose === 'sit' ? 0.12 : 0));
    h.model.position.set(x, top + (pose === 'sit' ? 0.02 : 0), z); h.model.rotation.y = Math.atan2(side * p.tz, -side * p.tx) + (pose === 'sit' ? 0 : (Math.random() - 0.5) * 0.9);   // quay mặt ra đường ray
    ctx.scene.add(h.model); h.anim.play(pose, 0); h.anim.update(0); crowd.push({ h, x, z });
  });
  const cam = new THREE.Vector3(); let lastMin = -1;
  function update(dt) {
    ctx.camera.getWorldPosition(cam);
    for (const c of crowd) if ((c.x - cam.x) ** 2 + (c.z - cam.z) ** 2 < 89 * 89) c.h.anim.update(dt);
    const pA = at(S_A); if ((pA.x - cam.x) ** 2 + (pA.z - cam.z) ** 2 < 144 * 144) { const h = ctx.sky.state.hour, mnt = Math.floor(h * 60); if (mnt !== lastMin) { lastMin = mnt; drawClock(h); } }
  }
  // vẫy tay khi tàu chạy qua
  const cheer = stn => { for (const c of crowd) if (Math.random() < 0.8) c.h.anim.play('Cheer', 0.2, true); };
  return { group, topA, topB, update, cheer, crowd };
}

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
