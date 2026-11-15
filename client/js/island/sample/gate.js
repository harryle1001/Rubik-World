// sample/gate.js — CỔNG TRƯỜNG RUBIK (mẫu chuẩn) + quảng trường trước cổng + chốt bảo vệ.
// Tách từ zone-school.js; gọi 1 dòng: buildGate({...}) khi RS.GATE có.
import * as THREE from 'three';
import { BLOCKS } from '../layout.js';

export function buildGate(a) {
  const { ctx, RS, D, GB, X3, Z3, Y, C, ROOM, DG, atlas, signAt, measure, rubikCube, addFoot, kit, rnd, lampPost, stoneBench, col } = a;
  const b = GB, gx = X3(RS.GATE[0]), gz = Z3(RS.GATE[1]), stone = '#f1e8d6', stone2 = '#d9cdb2', roof = '#b9502f';
  measure(b, 'gate', () => b.group(gx, Y, gz, -Math.PI / 2, () => {
    for (let i = 0; i < 3; i++) b.box(10 - i * 1.3, 0.15, 2.8 - i * 0.55, 0, i * 0.15, 1.8 - i * 0.27, i % 2 ? stone2 : stone);   // bậc đá
    for (const s of [-1, 1]) {
      const x = s * 3.3;
      b.box(2.1, 0.8, 2.1, x, 0, 0, stone2); b.box(1.7, 5.4, 1.7, x, 0.8, 0, stone);
      b.box(1.9, 0.2, 1.9, x, 2.6, 0, stone2);                                                  // gờ giữa trụ
      b.box(2.05, 0.4, 2.05, x, 6.2, 0, stone2); b.box(1.7, 0.2, 1.7, x, 6.6, 0, C.gold);
      b.cyl(0.32, 0.48, 0.55, x, 6.8, 0, stone, 8); b.ball(0.42, x, 7.65, 0, C.gold);           // bình đá đỉnh trụ
      b.box(0.08, 0.9, 0.08, x, 3.3, 0.9, C.iron); b.box(0.5, 0.06, 0.5, x, 3.45, 1.15, C.iron); b.hip(0.62, 0.32, 0.62, x, 4.25, 1.15, C.iron);   // đèn lồng gắn trụ
      DG.glow(() => { DG.pre = b.pre; DG.box(0.4, 0.62, 0.4, x, 3.5, 1.15, C.lantern); DG.pre = null; });
    }
    b.push(new THREE.TorusGeometry(2.45, 0.36, 5, 16, Math.PI), stone, 0, 4.45, 0, 0, 0, 0, 1, 1, 2.2);    // vòm cung
    b.push(new THREE.TorusGeometry(2.1, 0.08, 4, 16, Math.PI), C.gold, 0, 4.45, 0.82);                    // chỉ vàng viền vòm
    b.box(0.5, 0.7, 0.5, 0, 6.55, 0.86, stone2);                                                          // đá khoá vòm
    b.box(8.8, 1.05, 2.0, 0, 6.2, 0, stone); b.box(9.3, 0.22, 2.25, 0, 7.25, 0, stone2);
    b.prism(2.2, 1.6, 8.6, 0, 7.47, 0, roof, 0); b.prism(1.9, 1.3, 7.2, 0, 7.5, 0.18, stone, 0);
    rubikCube(b, 0, 9.55, 0.3, 0.8, 0.6, true, true);
    signAt(b, atlas.sign('TRƯỜNG RUBIK', '#7a1f2b', '#ffe08a', C.gold), 6.2, 0.8, 0, 6.75, 1.02);
    signAt(b, atlas.sign('Học – Chơi – Khám phá', '#1f3b63', '#fff', C.gold), 3.4, 0.4, 0, 5.15, 1.0);
    for (const s of [-1, 1]) {   // không rào, không cổng sắt: trụ đèn đứng riêng, bình hoa đá, bồn hoa
      b.box(0.95, 3.0, 0.95, s * 12.6, 0, 0, stone); b.box(1.15, 0.25, 1.15, s * 12.6, 3.0, 0, stone2); b.hip(0.75, 0.42, 0.75, s * 12.6, 3.85, 0, C.iron);
      DG.glow(() => { DG.pre = b.pre; DG.box(0.42, 0.55, 0.42, s * 12.6, 3.25, 0, C.lantern); DG.pre = null; });
      b.box(1.5, 0.6, 1.5, s * 5.3, 0, 2.6, stone2); b.cyl(0.55, 0.38, 0.75, s * 5.3, 0.6, 2.6, stone, 8); b.ball(0.62, s * 5.3, 1.55, 2.6, '#5aa04a', 1, 0.75, 1);   // bình hoa đá lớn
      for (let i = 0; i < 4; i++) b.ball(0.16, s * 5.3 + Math.cos(i * 1.6) * 0.42, 1.85, 2.6 + Math.sin(i * 1.6) * 0.42, ['#e8453c', '#f5c518', '#ffffff', '#e85d8a'][i]);
      b.box(2.8, 0.42, 1.2, s * 8.2, 0, 2.0, stone2); for (let i = 0; i < 4; i++) b.ball(0.32, s * (7.2 + i * 0.65), 0.6, 2.0, '#5aa04a', 1, 0.7, 1);
    }
  }));
  // quảng trường: nền đá dịu, đường viền, hoa văn tròn trước cổng, lối đi chính
  { const A = BLOCKS[0].r, x0 = A[0] + 0.5, x1 = gx - 1.2, cxp = (x0 + x1) / 2, w = x1 - x0;
    GB.box(w, 0.04, 26, cxp, Y, gz, '#e6dcc4'); addFoot(x0, gz - 13, gx + 4, gz + 13);
    for (const s of [-1, 1]) GB.box(w, 0.06, 0.35, cxp, Y, gz + s * 12.8, '#c4b48f');
    GB.box(w, 0.05, 3.6, cxp, Y, gz, '#d6c39b'); for (const s of [-1, 1]) GB.box(w, 0.07, 0.25, cxp, Y, gz + s * 1.9, '#b89c6e');
    GB.push(new THREE.RingGeometry(3.2, 4.2, 24).rotateX(-Math.PI / 2), '#cdb68a', x1 - 6, Y + 0.07, gz); GB.push(new THREE.RingGeometry(1.0, 1.5, 16).rotateX(-Math.PI / 2), '#b89c6e', x1 - 6, Y + 0.075, gz);
    DG.follow(null); for (let x = x0 + 1, k = 0; x < x1; x += 2.4, k++) for (const s of [-1, 1]) DG.box(1.0, 0.012, 3.6, x, Y + 0.05, gz + s * 7.5, k % 2 ? '#d8cbaa' : '#e0d4b6');
    for (const s of [-1, 1]) { for (let x = x0 + 1.5; x < x1 - 0.5; x += 2.6) kit('bush', x, Y, gz + s * 11.8, 1.05 + rnd() * 0.2, rnd() * 6); lampPost(GB, x0 + 3, gz + s * 4.2); lampPost(GB, x1 - 2.5, gz + s * 4.2); stoneBench(GB, x1 - 9, gz + s * 9.5, 0); }
  }
  for (const s of [-1, 1]) { const z = gz - s * 3.3; ctx.boxes.push({ x0: gx - 0.9, x1: gx + 0.9, z0: z - 0.9, z1: z + 0.9, top: Y + 7.5 }); col(gx, gz - s * 12.6, 0.5, Y + 3); }
  if (D.BOOTH) { const x = X3(D.BOOTH[0]), z = Z3(D.BOOTH[1]), b = GB;   // chốt bảo vệ: nhà nhỏ tường kem, cửa sổ, mái ngói
    b.box(2.0, 0.3, 2.0, x, Y, z, C.plinth); b.box(1.8, 2.1, 1.8, x, Y + 0.3, z, ROOM.hall.wall); b.box(1.9, 0.18, 1.9, x, Y + 2.3, z, C.trim);
    b.plane(1.1, 0.75, x - 0.91, Y + 1.6, z, C.glass, -Math.PI / 2); b.plane(1.3, 0.95, x - 0.905, Y + 1.6, z, C.trim, -Math.PI / 2);
    b.hip(2.6, 0.9, 2.6, x, Y + 2.45, z, C.roof); signAt(b, atlas.sign('BẢO VỆ', '#3d4f6b'), 1.2, 0.2, x - 0.95, Y + 2.15, z, -Math.PI / 2); }
}
