// bikes.js — 20 kiểu xe đạp khắp thế giới (low poly, mỗi xe < 800 tam giác). Mỗi xe kèm một điều thú vị để học.
// Thêm kiểu xe: thêm 1 dòng vào BIKES (các cờ: step, basket, rack, child, drop, mtb, bmx, tandem, penny, cargo, xichlo, rickshaw, recumb, velo, uni, bamboo, fold, cruiser, guard).
import * as THREE from 'three';
import { CFG } from './config.js';
import { addOutline } from './style.js';
import { paint, at, box, tube, mesh, tris } from './geo.js';

export const BIKES = [
  { name: 'Xe đạp đi học', from: 'Việt Nam', color: '#3d8fd9', step: 1, basket: 1, rack: 1, fact: 'Ở Việt Nam, hàng triệu học sinh đạp xe đến trường mỗi ngày.' },
  { name: 'Xích lô', from: 'Việt Nam', color: '#2f6b4a', xichlo: 1, sp: 0.7, fact: 'Xích lô có ở Việt Nam từ khoảng năm 1939: người đạp ngồi sau, khách ngồi ghế phía trước.' },
  { name: 'Xe omafiets', from: 'Hà Lan', color: '#1f1f24', step: 1, rack: 1, guard: 1, upright: 1, fact: 'Hà Lan có khoảng 23 triệu xe đạp, nhiều hơn cả số dân (khoảng 18 triệu người).' },
  { name: 'Xe chở hàng bakfiets', from: 'Đan Mạch', color: '#d8452f', cargo: 1, sp: 0.85, fact: 'Ở Copenhagen (Đan Mạch), nhiều gia đình chở con đi học bằng xe đạp có thùng phía trước.' },
  { name: 'Xe mamachari', from: 'Nhật Bản', color: '#f2f2ee', step: 1, basket: 1, child: 1, fact: 'Mamachari nghĩa là "xe đạp của mẹ" ở Nhật Bản, có giỏ trước và ghế trẻ em phía sau.' },
  { name: 'Xe khung đen cổ điển', from: 'Trung Quốc', color: '#141418', rack: 1, guard: 1, fact: 'Trung Quốc từng được gọi là "vương quốc xe đạp" với hàng trăm triệu chiếc xe khung đen.' },
  { name: 'Xe đua đường trường', from: 'Pháp', color: '#f2c14e', drop: 1, thin: 1, sp: 1.25, fact: 'Tour de France (Pháp) là cuộc đua xe đạp nổi tiếng nhất thế giới, có từ năm 1903.' },
  { name: 'Xe leo núi', from: 'Mỹ', color: '#3fa36b', mtb: 1, sp: 1.05, fact: 'Xe đạp leo núi ra đời ở California (Mỹ) vào những năm 1970.' },
  { name: 'Xe BMX', from: 'Mỹ', color: '#9b4dd9', bmx: 1, sp: 0.95, fact: 'BMX trở thành môn thi đấu Olympic từ năm 2008.' },
  { name: 'Xe đạp đôi tandem', from: 'Anh', color: '#e8743c', tandem: 1, sp: 1.1, fact: 'Xe đạp đôi có hai người cùng đạp: người ngồi trước cầm lái, người sau đạp phụ.' },
  { name: 'Xe penny-farthing', from: 'Anh', color: '#2a2630', penny: 1, sp: 0.85, fact: 'Xe penny-farthing (Anh, những năm 1870) có bánh trước rất to vì bàn đạp gắn thẳng vào bánh.' },
  { name: 'Xe kéo rickshaw', from: 'Ấn Độ', color: '#2f7fd0', rickshaw: 1, sp: 0.7, fact: 'Xe kéo đạp (rickshaw) là phương tiện chở khách phổ biến ở Ấn Độ và Bangladesh.' },
  { name: 'Xe đạp nằm', from: 'Đức', color: '#e8453c', recumb: 1, sp: 1.15, fact: 'Xe đạp nằm giảm sức cản của gió, nên giữ nhiều kỷ lục tốc độ xe đạp.' },
  { name: 'Xe fat bike', from: 'Canada', color: '#f08a24', fat: 1, sp: 0.9, fact: 'Fat bike có lốp rất to để chạy trên tuyết và cát, phổ biến ở Canada và Alaska.' },
  { name: 'Xe đạp gấp', from: 'Anh', color: '#c8323a', fold: 1, sp: 0.9, fact: 'Xe đạp gấp có thể gập nhỏ để mang lên tàu điện, rất được ưa chuộng ở London (Anh).' },
  { name: 'Xe cruiser bãi biển', from: 'Mỹ', color: '#7fd0c8', cruiser: 1, step: 1, guard: 1, fact: 'Xe cruiser có lốp to, ghi đông rộng, hợp đạp chậm dọc bờ biển California (Mỹ).' },
  { name: 'Xe fixie', from: 'Mỹ', color: '#f04fa0', thin: 1, fixie: 1, sp: 1.15, fact: 'Xe fixie không có líp tự do: bánh quay thì bàn đạp quay, không ngừng đạp được.' },
  { name: 'Xe đạp tre', from: 'Ghana', color: '#c9a35a', bamboo: 1, rack: 1, fact: 'Ở Ghana (châu Phi), người ta làm khung xe đạp bằng tre: nhẹ, bền, thân thiện với môi trường.' },
  { name: 'Xe velomobile', from: 'Hà Lan', color: '#f2c14e', velo: 1, sp: 1.35, fact: 'Velomobile là xe đạp nằm có vỏ bọc khí động học, chạy được hơn 50 km/h.' },
  { name: 'Xe đạp một bánh', from: 'Trung Quốc', color: '#e8453c', uni: 1, sp: 0.6, fact: 'Xe đạp một bánh là tiết mục quen thuộc của xiếc: người đạp phải tự giữ thăng bằng.' },
];

const DARK = '#2a2630', METAL = '#c9c9cf';
function wheel(r, t, rim = DARK, spokes = METAL) {
  return mesh([paint(new THREE.TorusGeometry(r, t, 4, 14).rotateY(Math.PI / 2), rim), box(0.02, r * 1.9, 0.025, spokes), box(0.02, 0.025, r * 1.9, spokes), paint(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 6).rotateZ(Math.PI / 2), METAL)]);
}

export function makeBike(idx) {
  const S = BIKES[idx % BIKES.length], c = S.color, g = new THREE.Group(), parts = [], wheels = [];
  const T = (a, b, r = 0.033, col = c) => parts.push(S.bamboo && col === c ? tube(a, b, r * 1.25, col, 5) : tube(a, b, r, col));
  const addWheel = (x, r, z, t = 0.045) => { const w = wheel(r, S.fat ? 0.11 : S.mtb ? 0.065 : S.thin ? 0.03 : t, S.fixie ? '#20c0e0' : DARK); w.position.set(x, r, z); g.add(w); wheels.push({ m: w, r }); };
  let rF = S.bmx ? 0.27 : S.fold ? 0.22 : S.fat ? 0.36 : 0.34, rB = rF, zF = 0.56, zB = -0.52;
  let saddle = [0, 0.86, -0.26], bar = [0, 0.98, 0.45], crank = [0, rB, 0.02], mode = { seat: 0, seatZ: 0 }, trike = false;
  if (S.tandem) { zF = 0.7; zB = -1.05; saddle = [0, 0.86, 0.0]; bar = [0, 0.98, 0.6]; crank = [0, rB, 0.28]; }
  if (S.cargo) { zF = 1.35; bar = [0, 1.0, 0.5]; }
  if (S.penny) { rF = 0.78; rB = 0.2; zF = 0.25; zB = -0.75; saddle = [0, 1.66, 0.12]; bar = [0, 1.78, 0.4]; crank = [0, rF, zF]; }
  if (S.uni) { rF = 0.4; zF = 0; saddle = [0, 1.12, 0]; crank = [0, rF, 0]; }
  if (S.recumb || S.velo) { zF = 0.75; zB = -0.6; saddle = [0, 0.5, -0.2]; bar = [0, 0.62, 0.15]; crank = [0, 0.48, 0.85]; }
  if (S.xichlo) { zF = 0.75; zB = -0.75; saddle = [0, 1.0, -0.55]; bar = [0, 1.1, -0.2]; crank = [0, rB, -0.45]; trike = true; }
  if (S.rickshaw) { zF = 0.65; zB = -0.95; saddle = [0, 0.95, 0.05]; bar = [0, 1.06, 0.55]; crank = [0, rB, 0.3]; trike = true; }
  if (S.bmx) { saddle = [0, 0.7, -0.3]; bar = [0, 1.02, 0.38]; }
  if (S.fold) { saddle = [0, 0.92, -0.25]; bar = [0, 1.05, 0.4]; }
  if (S.drop || S.fixie) { saddle = [0, 0.92, -0.26]; bar = [0, 0.9, 0.48]; }
  if (S.cruiser) { bar = [0, 1.05, 0.35]; }
  if (S.upright) { bar = [0, 1.08, 0.38]; }

  // bánh xe
  if (S.uni) addWheel(0, rF, 0);
  else if (S.xichlo || S.velo) { addWheel(-0.42, rF, zF); addWheel(0.42, rF, zF); addWheel(0, rB, zB); trike = true; }
  else if (S.rickshaw) { addWheel(0, rF, zF); addWheel(-0.5, rB, zB); addWheel(0.5, rB, zB); }
  else { addWheel(0, rF, zF); addWheel(0, rB, zB); }
  if (S.cargo) wheels[0].m.scale.setScalar(0.75), wheels[0].m.position.y = rF * 0.75, wheels[0].r = rF * 0.75;

  const A = [0, rB, zB], F = [0, S.cargo ? rF * 0.75 : rF, zF], C = crank;
  const ST = [saddle[0], saddle[1] - 0.06, saddle[2] + 0.02], H = [0, bar[1] - 0.12, bar[2]];
  if (S.uni) T([0, rF, 0], ST, 0.035);
  else if (S.penny) { T([0.06, rF, zF], [0.06, rF + 0.85, zF - 0.05], 0.03, DARK); T([-0.06, rF, zF], [-0.06, rF + 0.85, zF - 0.05], 0.03, DARK); T([0, rF + 0.85, zF - 0.05], [0, rF + 0.5, zF - 0.6], 0.035, c); T([0, rF + 0.5, zF - 0.6], A, 0.035, c); }
  else if (S.recumb || S.velo) { T(A, [0, 0.38, -0.1], 0.04); T([0, 0.38, -0.1], C, 0.04); T([0, 0.38, -0.1], H, 0.03); T(H, F, 0.03); T([0, 0.38, -0.1], [0, 0.85, -0.45], 0.03); parts.push(box(0.36, 0.5, 0.06, DARK, 0, 0.72, -0.48, -0.45)); }
  else if (S.xichlo) { T(A, C, 0.035); T(C, ST, 0.035); T(ST, A, 0.03); T(ST, H, 0.035); T(C, [0, 0.55, 0.4], 0.04); T([0, 0.55, 0.4], [-0.42, F[1], zF], 0.035); T([0, 0.55, 0.4], [0.42, F[1], zF], 0.035);
    parts.push(box(0.95, 0.12, 0.6, '#c8323a', 0, 0.62, zF - 0.05), box(0.95, 0.55, 0.08, '#c8323a', 0, 0.9, zF - 0.33), box(0.06, 0.3, 0.55, '#c8323a', -0.46, 0.8, zF - 0.05), box(0.06, 0.3, 0.55, '#c8323a', 0.46, 0.8, zF - 0.05), paint(at(new THREE.CylinderGeometry(0.62, 0.62, 0.9, 8, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), 0, 1.25, zF - 0.1), '#2a2630')); }
  else {
    const step = S.step || S.cruiser;
    T(A, C, 0.03); T(C, ST); T(ST, A, 0.025); T(H, F, S.mtb ? 0.05 : 0.03);
    if (step) { T(C, [0, 0.55, 0.3], 0.04); T([0, 0.55, 0.3], H, 0.04); } else { T(C, H, 0.036); T(ST, H, 0.034); }
    if (S.tandem) { const S2 = [0, 0.82, -0.62], C2 = [0, rB, -0.45]; T(A, C2, 0.03); T(C2, S2); T(S2, ST, 0.034); T(C2, C, 0.034); parts.push(box(0.2, 0.06, 0.3, DARK, 0, 0.88, -0.66)); T([-0.22, 0.98, -0.3], [0.22, 0.98, -0.3], 0.022, METAL); T([0, 0.82, -0.36], [0, 0.98, -0.3], 0.025, c); }
    if (S.cargo) { parts.push(box(0.62, 0.42, 0.7, '#8a5a34', 0, 0.55, 0.85), box(0.66, 0.06, 0.74, '#6b4a2b', 0, 0.78, 0.85)); T(C, [0, 0.36, 0.5], 0.04); }
    if (S.fold) parts.push(box(0.1, 0.1, 0.1, METAL, 0, 0.6, 0.12));
  }
  if (S.bamboo) for (const [p, q] of [[C, ST], [C, H], [A, C]]) for (const t of [0.33, 0.66]) parts.push(paint(at(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 5), p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t), '#8a6a2a'));
  // yên + ghi đông
  if (!S.recumb && !S.velo) parts.push(box(S.cruiser ? 0.26 : 0.2, 0.06, 0.3, S.fixie ? '#20c0e0' : DARK, ...saddle));
  let steer = null, grips = null;
  if (!S.uni) {
    const bw = S.cruiser || S.upright ? 0.36 : S.bmx ? 0.34 : 0.3, by = bar[1] + 0.06, bz = bar[2] - 0.05, i0 = parts.length, up = S.upright || S.cruiser ? 0.06 : 0, bk = S.upright || S.cruiser ? 0.12 : 0;
    if (S.drop) { T([-0.2, by, bz], [0.2, by, bz], 0.022, METAL); for (const s of [-1, 1]) { T([s * 0.2, by, bz], [s * 0.2, by - 0.12, bz + 0.12], 0.022, METAL); T([s * 0.2, by - 0.12, bz + 0.12], [s * 0.2, by - 0.18, bz - 0.02], 0.022, METAL); } }
    else { T([-bw, by + (S.upright || S.cruiser ? 0.06 : 0), bz - (S.upright || S.cruiser ? 0.12 : 0)], [0, by, bz], 0.022, METAL); T([0, by, bz], [bw, by + (S.upright || S.cruiser ? 0.06 : 0), bz - (S.upright || S.cruiser ? 0.12 : 0)], 0.022, METAL); }
    if (S.bmx) T([0, by, bz], [0, by - 0.18, bz + 0.05], 0.03, METAL);
    parts.push(paint(at(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6).rotateX(Math.PI / 2), 0.2, by + 0.03, bz), '#f2c14e')); // chuông
    // ghi đông tách thành nhóm riêng xoay quanh cổ lái (rẽ thì tay lái xoay, tay bám theo); điểm nắm = tay cầm (trong hệ nhóm lái)
    const bm = mesh(parts.splice(i0)); bm.position.set(0, -by, -bz); steer = new THREE.Group(); steer.position.set(0, by, bz); steer.add(bm); g.add(steer);
    const gx = S.drop ? 0.2 : bw * 0.84, gy = S.drop ? 0 : up * 0.84, gz = S.drop ? 0.03 : -bk * 0.84;
    grips = [new THREE.Vector3(gx, gy, gz), new THREE.Vector3(-gx, gy, gz)];
  }
  if (S.basket) parts.push(box(0.4, 0.26, 0.3, '#d9b46a', 0, 0.84, zF + 0.16), box(0.42, 0.04, 0.32, '#b88a40', 0, 0.98, zF + 0.16));
  if (S.rack) parts.push(box(0.22, 0.03, 0.4, DARK, 0, 0.72, zB + 0.04));
  if (S.child) parts.push(box(0.32, 0.12, 0.34, '#3d8fd9', 0, 0.8, zB + 0.04), box(0.32, 0.36, 0.06, '#3d8fd9', 0, 0.98, zB - 0.12));
  if (S.guard) parts.push(box(0.05, 0.12, 0.5, c, 0.09, rB, C[2] - 0.25));
  if (S.cruiser || S.guard) for (const [r, z] of [[rF, zF], [rB, zB]]) parts.push(paint(at(new THREE.TorusGeometry(r + 0.06, 0.03, 3, 8, Math.PI * 0.9).rotateY(Math.PI / 2), 0, r, z, 0.15), c));
  if (S.bmx) for (const s of [-1, 1]) parts.push(paint(at(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 5).rotateZ(Math.PI / 2), s * 0.1, rB, zB), METAL));
  if (S.rickshaw) { parts.push(box(1.1, 0.1, 0.7, '#6b4a2b', 0, 0.62, zB), box(1.0, 0.45, 0.1, '#2f7fd0', 0, 0.9, zB - 0.3), paint(at(new THREE.CylinderGeometry(0.58, 0.58, 0.8, 8, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), 0, 1.25, zB - 0.05), '#e8453c')); T(C, [0, 0.62, zB + 0.35], 0.04); }
  if (S.velo) { const sh = new THREE.SphereGeometry(0.55, 10, 6); sh.scale(1, 0.75, 2.4); parts.push(paint(at(sh, 0, 0.55, 0.05), c)); }
  g.add(mesh(parts));
  const cr = new THREE.Group(); cr.position.set(...C); // đùi đĩa + bàn đạp
  cr.add(mesh([paint(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 8).rotateZ(Math.PI / 2), METAL), box(0.03, 0.03, 0.34, DARK, 0.08), box(0.03, 0.03, 0.34, DARK, -0.08), box(0.12, 0.03, 0.08, DARK, 0.15, 0, 0.17), box(0.12, 0.03, 0.08, DARK, -0.15, 0, -0.17)]));
  if (S.uni || S.penny) cr.scale.set(1.6, 1, 1);
  g.add(cr);
  addOutline(g);
  mode = { speed: CFG.player.run * 1.35 * (S.sp || 1), boost: 1.35, turn: S.uni ? 3.5 : trike ? 3.6 : 5, accel: 2.6, anim: S.recumb || S.velo ? 'sit' : 'drive', seat: saddle[1] - 0.44 - (S.recumb || S.velo ? 0.12 : 0), seatZ: saddle[2] + 0.04, camAdd: S.penny ? 2.5 : 1.5 };
  // tư thế lái (ride-pose.js): tay nắm ghi đông (xe 1 bánh: dang tay giữ thăng bằng) · chân bám bàn đạp · thân nghiêng tới
  const ride = { hand: steer || g, hands: grips || [new THREE.Vector3(0.62, saddle[1] + 0.3, 0.05), new THREE.Vector3(-0.62, saddle[1] + 0.3, 0.05)], foot: cr,
    feet: [new THREE.Vector3(0.15, 0.03, 0.17), new THREE.Vector3(-0.15, 0.03, -0.17)], ankle: new THREE.Vector3(0, 0.07, -0.04),
    lean: S.drop ? 0.5 : S.fixie ? 0.42 : S.bmx || S.mtb ? 0.3 : S.recumb || S.velo ? -0.15 : S.upright || S.cruiser || S.uni ? 0.06 : 0.18,
    gear: S.uni || S.penny ? 1 : S.bmx ? 2.2 : S.drop || S.fixie ? 3.2 : 2.6, fixed: !!(S.uni || S.penny || S.fixie), drive: S.uni || S.penny ? 0 : S.rickshaw ? 1 : wheels.length - 1, steer };
  if (!trike && !S.uni && wheels[0]) wheels[0].m.rotation.order = 'YXZ', ride.fork = wheels[0].m;   // bánh trước xoay theo tay lái
  return { type: 'bike', style: idx % BIKES.length, info: S, group: g, wheels, crank: cr, mode, ride, lean: !trike && !S.uni, tris: tris(g), r: 2.6, label: `🚲 Lên xe: ${S.name} (${S.from})` };
}
