// zone-school.js — KHU TRƯỜNG RUBIK (khu mẫu trưng bày): lớp học kiểu trường Việt Nam (tường vàng kem, mái ngói đỏ-cam,
// hành lang cột, cửa sổ chớp xanh), cổng trường cổ kính, quảng trường trước cổng, chốt bảo vệ, sân chào cờ có vạch trò chơi,
// ghế đá, bồn cây phượng, đèn sân, xe bán kem, sân chơi (xích đu, cầu trượt, bập bênh), sân bóng.
// Gọi từ town-buildings.js. Hiệu năng: mọi khối gộp vào vài Batch (1 draw call/Batch), mái mỗi lớp 1 mesh riêng để mờ dần
// khi người chơi vào trong; cây phượng InstancedMesh; chi tiết nhỏ vào DetailGrid (chỉ hiện gần người chơi).
// Va chạm tường lớp/cửa mini game do school-town.js lo; ở đây chỉ thêm cột hành lang, cổng, cầu trượt vào ctx.boxes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { toon } from './style.js';
import { BLOCKS, PHI } from './layout.js';
import { Batch } from './decor.js';
import { placeKit } from './kit.js';
import { buildGate } from './sample/gate.js';
import { buildPlaza } from './sample/plaza.js';
import { PAL, shade } from './sample/palette.js';
import { FC, cbox, wallBody, archWindow, blindArch, roundPier, vine, arcadeBays, arcadeFront, column, pediment, oculus, fanlight, rubikRelief, gableRoof, hipRoofPlus, bellTower } from './sample/facade.js';

// bảng màu chuẩn (docs/style-guide.md §1, sample/palette.js) — không pha màu mới trong file khu
const PH = n => PAL[n].hex, SH = (n, k) => '#' + shade(n, k).getHexString();
const C = {
  trim: PH('stoneCreamL'), plinth: PH('stoneWarm'), roof: PH('roof'), roof2: PH('roofL'), ridge: PH('roofD'), fascia: PH('stoneCreamL'),
  shutter: PH('shutter'), glass: PH('glass'), floor: PH('stoneWarmL'), door: PH('wood'), step: PH('stoneWarmL'), stone: PH('stoneWarm'), stone2: PH('stoneWarmD'),
  walk: PH('stoneWarmL'), curb: PH('stoneWarmD'), cement: SH('stoneWarmL', 1.146), paint: PH('stoneCreamL'), iron: PH('iron'), gold: PH('brass'), lantern: PH('lampGlow'),
  wood: PH('wood'), woodD: PH('woodD'), leaf: PH('leaf'), leafD: PH('leafD'), grass: PH('grass'), board: SH('shutterD', 0.85), pot: SH('roof', 1.146),
  R: PH('rubikR'), G: PH('rubikG'), B: PH('rubikB'), Yl: PH('rubikY'), O: PH('rubikO'), W: PH('rubikW'), ink: PH('ink'),
  fl: ['flowerRed', 'flowerPink', 'flowerYellow', 'flowerWhite'].map(PH),
};
const ROOM = {
  rubik:     { wall: PH('stoneCream'), acc: '#d9542b', sign: ['LỚP RUBIK', '#c4452f'] },
  chess:     { wall: PH('stoneCream'), acc: '#3b4a6b', sign: ['KHU CỜ VUA', '#2f3b59'] },
  music:     { wall: PH('stoneCream'), acc: '#8f4f8a', sign: ['KHU ÂM NHẠC', '#6b3a8a'] },
  hall:      { wall: PH('stoneCream'), acc: '#b9502f', sign: ['HỘI TRƯỜNG LỚN', '#b5432f'] },
  office:    { wall: PH('stoneCream'), acc: '#4f6f94', sign: ['VĂN PHÒNG', '#3d4f6b'], flat: true },
  elec:      { wall: PH('stoneCream'), acc: '#2f7f6f', sign: ['LỚP LẮP RÁP ĐIỆN', '#2f5f6b'] },
  rubikyard: { wall: PH('stoneCream'), acc: '#d9542b', sign: ['KHU CHƠI RUBIK', '#d9542b'], yard: true },
};
const FACE = { t: Math.PI, b: 0, l: -Math.PI / 2, r: Math.PI / 2 };
const _v = new THREE.Vector3(), _o = new THREE.Object3D();

// viền mảnh màu nâu tím (thay viền đen dày) — chỉ cho khối kiến trúc
const softOutline = new THREE.MeshBasicMaterial({ color: '#4a3548', side: THREE.BackSide });
softOutline.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.022;'); };
const outline = m => { const e = new THREE.Mesh(m.geometry, softOutline); e.raycast = () => {}; e.castShadow = false; m.add(e); return m; };

// "AO giả": tối dần về chân tường theo độ cao (tô màu đỉnh, không tốn gì lúc chạy)
function fakeAO(b, y0) {
  for (const g of b.geos) {
    const p = g.attributes.position, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { const k = 0.8 + 0.2 * Math.min(1, Math.max(0, (p.getY(i) - y0) / 2.4)); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }
  }
}
// KHỐI RUBIK GIỐNG THẬT (dùng chung mọi khu): 26 khối con vát góc (44 tam giác/khối) thân đen + 54 miếng dán nhỏ hơn mặt (lõm trong viền vát)
// ≈ 1.250 tam giác (lite: 1 lõi + miếng dán ≈ 120). Gốc (x, y, z) = tâm khối; s = cạnh; tilt = đứng trên 1 góc. Có thể gọi cho Batch hoặc DetailGrid.
let cubieGeo = null;
export function rubikCube(b, x, y, z, s, ry = 0, tilt = false, lite = false) {   // lite: khối con hộp thường (≈ 420 tam giác) cho biểu tượng nhỏ
  if (!cubieGeo) { const h = 0.5, a = 0.41, pts = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(new THREE.Vector3(sx * h, sy * a, sz * a), new THREE.Vector3(sx * a, sy * h, sz * a), new THREE.Vector3(sx * a, sy * a, sz * h)); cubieGeo = new ConvexGeometry(pts); }
  const pre = b.pre; _o.position.set(x, y, z); _o.rotation.set(tilt ? 0.615 : 0, ry, tilt ? Math.PI / 4 : 0, 'YXZ'); _o.scale.set(1, 1, 1); _o.updateMatrix();
  b.pre = pre ? pre.clone().multiply(_o.matrix) : _o.matrix.clone();
  const q = s / 3, f = q * 0.5 + 0.004;
  if (lite) b.box(s * 0.99, s * 0.99, s * 0.99, 0, -s * 0.495, 0, '#17151d');
  // màu mặt: +z đỏ, -z cam, +x xanh dương, -x xanh lá, +y trắng, -y vàng (tráo vài ô cho trông như đang xoay dở)
  const FC = { pz: '#e8392f', nz: '#ff8a1f', px: '#2b63d9', nx: '#2f9e44', py: '#ffffff', ny: '#f5c518' }, ALT = Object.values(FC);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    if (!i && !j && !k) continue;
    const cx = i * q, cy = j * q, cz = k * q; if (!lite) b.push(cubieGeo.clone(), '#17151d', cx, cy, cz, 0, 0, 0, q * 0.98, q * 0.98, q * 0.98);
    const mix = (i * 7 + j * 3 + k * 5 + 21) % 5 === 0;
    const st = (key, px, py, pz, ryy, rxx) => b.plane(q * 0.8, q * 0.8, cx + px, cy + py, cz + pz, mix ? ALT[(i + j + k + 9) % 6] : FC[key], ryy, rxx);
    if (k === 1) st('pz', 0, 0, f, 0, 0); if (k === -1) st('nz', 0, 0, -f, Math.PI, 0);
    if (i === 1) st('px', f, 0, 0, Math.PI / 2, 0); if (i === -1) st('nx', -f, 0, 0, -Math.PI / 2, 0);
    if (j === 1) st('py', 0, f, 0, 0, -Math.PI / 2); if (j === -1) st('ny', 0, -f, 0, 0, Math.PI / 2);
  }
  b.pre = pre;
}

export function buildSchoolZone(a) {
  const { ctx, RS, env, D, atlas, signAt, measure, budget, X3, Z3, DG, nearDoor, inRoom, rnd, chessPiece } = a, addFoot = a.addFoot || (() => {});
  const { scene } = ctx, { P, S, Y, H, T, gap } = env, R = RS.R, low = !!ctx.lowEnd;
  const SB = new Batch('school'), GB = new Batch('gate'), GR = new Batch('school-ground');
  const roofs = [], meshes = [], kits = {}, phuong = [];
  const kit = (name, x, y, z, s = 1, ry = 0) => (kits[name] = kits[name] || []).push([x, y, z, s, ry]);
  const col = (x, z, r = 0.25, top = Y + H) => ctx.boxes.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, top });

  // đèn sân: cột sắt đen, đèn lồng phát sáng (glow), mũ đèn
  const lampPost = (b, x, z, y = Y) => {
    b.cyl(0.26, 0.32, 0.35, x, y, z, C.stone2, 6); b.cyl(0.06, 0.08, 3.1, x, y + 0.35, z, C.iron, 6);
    b.box(0.42, 0.06, 0.42, x, y + 3.35, z, C.iron); b.hip(0.62, 0.32, 0.62, x, y + 3.95, z, C.iron); b.ball(0.07, x, y + 4.32, z, C.gold);
    for (const s of [-1, 1]) for (const t of [-1, 1]) b.box(0.04, 0.6, 0.04, x + s * 0.18, y + 3.4, z + t * 0.18, C.iron);
    DG.follow(null).glow(() => DG.box(0.3, 0.52, 0.3, x, y + 3.42, z, C.lantern));
  };
  const stoneBench = (b, x, z, ry) => b.group(x, Y, z, ry, () => { cbox(b, 1.9, 0.12, 0.6, 0, 0.38, 0, C.trim, 0.04); for (const s of [-1, 1]) { cbox(b, 0.24, 0.38, 0.5, s * 0.59, 0, 0, C.stone, 0.03); b.box(0.3, 0.04, 0.56, s * 0.59, 0, 0, C.stone2); } });   // ghế đá vát: dài 1,9 ≈ 0,6·π, chân cách 1,18 = 1,9/φ

  // ================= LỚP HỌC =================
  // TỶ LỆ VÀNG: mặt tiền cao HV = tường + diềm trán; mái cao HV/φ; vòm hành lang cao/rộng = φ, vòm cửa chính rộng = φ·nhịp thường;
  // cửa sổ: thân cao φ·rộng + vòm bán nguyệt, khoảng cách φ² (tường dài φ³)
  const HV = H + 0.6, ARCH_R = (HV - 0.3) / (2 * PHI), ARCH_YS = HV - 0.3 - ARCH_R, BAY = 2 * ARCH_R + 0.44, DOORBAY = BAY * PHI;
  const WIN_W = 0.95, WIN_H = WIN_W * PHI + WIN_W / 2;
  // đoạn tường (đúng khối va chạm): chân đá, gờ ngang, diềm trán + phào; mặt ngoài: cửa sổ vòm cuốn (lớp) hoặc vòm mù + dây leo (sân chơi)
  function wallSeg(b, st, ax, az, bx, bz, ry, opts = {}) {
    const len = Math.hypot(bx - ax, bz - az); if (len < 0.2) return;
    b.group((ax + bx) / 2, Y, (az + bz) / 2, ry, () => {
      wallBody(b, len, H, HV, T);
      const z = T / 2, d = DG.follow(b), k0 = Math.round(len * 7); GR.pre = b.pre;
      if (opts.yard) {
        const sp = PHI * PHI, n = Math.floor((len - 1.0) / sp);
        for (let i = 0; i < n; i++) { const u = -len / 2 + (len - (n - 1) * sp) / 2 + i * sp; blindArch(b, GR, u, z, 1.2, 1.2 * PHI + 0.6, 0.85); if ((i + k0) % 3 === 0) vine(d, u + sp / 2, z + 0.06, HV - 0.6, i + k0); }
      } else {
        const sp = len > 20 ? PHI ** 3 : PHI * PHI, n = Math.floor((len - 1.4) / sp);
        for (let i = 0; i < n; i++) { const u = -len / 2 + (len - (n - 1) * sp) / 2 + i * sp; archWindow(b, GR, d, u, 1.0, z, WIN_W, WIN_H, (i + k0) % 2 ? 0 : 1 + ((i + k0) % 5)); }
      }
      GR.pre = null;
    });
  }
  function musicNote(b, x, y, z, s, c) {
    for (const dx of [-0.5, 0.5]) { b.cyl(0.32 * s, 0.32 * s, 0.16 * s, x + dx * s, y, z, c, 8, 0, Math.PI / 2, 0.45); b.box(0.09 * s, 1.5 * s, 0.09 * s, x + dx * s + 0.27 * s, y, z, c); }
    b.box(1.1 * s, 0.22 * s, 0.1 * s, x + 0.27 * s, y + 1.3 * s, z, c, 0, 0, 0.18);
  }
  function classroom(id, r) {
    const st = ROOM[id] || ROOM.office, b = SB;
    const ax = X3(r.x), az = Z3(r.y), bx = X3(r.x + r.w), bz = Z3(r.y + r.h), cx = (ax + bx) / 2, cz = (az + bz) / 2;
    const side = r.side || 'b', dx = r.dw ? X3(r.dw[0]) : cx, dz = r.dw ? Z3(r.dw[1]) : cz;
    const sides = { t: [ax, az, bx, az], b: [ax, bz, bx, bz], l: [ax, az, ax, bz], r: [bx, az, bx, bz] };
    for (const s of ['t', 'b', 'l', 'r']) {
      const [px, pz, qx, qz] = sides[s], horiz = s === 't' || s === 'b', ry = FACE[s];
      const opts = { yard: st.yard };
      if (s !== side) wallSeg(b, st, px, pz, qx, qz, ry, opts);
      else if (horiz) { wallSeg(b, st, px, pz, dx - gap, qz, ry, opts); wallSeg(b, st, dx + gap, pz, qx, qz, ry, opts); }
      else { wallSeg(b, st, px, pz, qx, dz - gap, ry, opts); wallSeg(b, st, px, dz + gap, qx, qz, ry, opts); }
    }
    [[ax, az], [bx, az], [ax, bz], [bx, bz]].forEach(([x, z], k) => {   // trụ góc bo tròn + dây leo 2 góc
      b.group(x, Y, z, 0, () => roundPier(b, 0, 0, HV));
      if ((k + id.length) % 2) { const nx = x < cx ? -1 : 1, nz = z < cz ? -1 : 1; DG.follow(null); DG.pre = null; vine(DG, x + nx * 0.42, z + nz * 0.42, HV - 0.4, k, 0, nz, Y); }
    });
    // sàn trong lớp (gạch men) — thấy khi mái mờ đi
    GR.box(bx - ax - 0.2, 0.04, bz - az - 0.2, cx, Y, cz, st.yard ? C.cement : C.floor);

    const big = id === 'hall', VD = 2.2;   // VD: độ sâu hành lang
    addFoot(ax - 1.5 - (side === 'l' ? VD + 1 : 0), az - 1.5 - (side === 't' ? VD + 1 : 0), bx + 1.5 + (side === 'r' ? VD + 1 : 0), bz + 1.5 + (side === 'b' ? VD + 1 : 0));
    const ox = side === 'l' ? ax : side === 'r' ? bx : dx, oz = side === 't' ? az : side === 'b' ? bz : dz;
    const faceL = side === 't' || side === 'b' ? bx - ax : bz - az, du = side === 't' ? -(dx - cx) : side === 'b' ? dx - cx : side === 'l' ? dz - cz : -(dz - cz);
    // HÀNH LANG VÒM CUỐN dọc mặt tiền (gốc cục bộ = giữa mặt tiền, +z ra ngoài): nhịp đều ~BAY, vòm cửa chính rộng φ·BAY
    const mx = side === 'l' ? ax : side === 'r' ? bx : cx, mz = side === 't' ? az : side === 'b' ? bz : cz;
    if (!st.yard) b.group(mx, Y, mz, FACE[side], () => {
      GR.pre = b.pre; GR.box(faceL + 1.0, 0.08, VD + 0.3, 0, 0, VD / 2 + 0.15, C.step); GR.box(faceL + 1.1, 0.06, 0.2, 0, 0.12, VD + 0.3, C.curb);
      const xs = arcadeBays(faceL, du, BAY, DOORBAY, big ? 1 : 0), d = DG.follow(b);
      arcadeFront(b, GR, xs, ARCH_YS, HV - 0.24, ARCH_R, 0.22, 0.32, VD);
      const span = xs[xs.length - 1] - xs[0] + 0.44;
      cbox(b, span + 0.16, 0.1, 0.5, (xs[0] + xs[xs.length - 1]) / 2, HV - 0.24, VD, FC.trim, 0.03); cbox(b, span + 0.36, 0.14, 0.62, (xs[0] + xs[xs.length - 1]) / 2, HV - 0.14, VD, FC.trim, 0.04);
      xs.forEach((u, i) => {
        column(b, u, VD, ARCH_YS); _v.set(u, 0, VD).applyMatrix4(b.pre); col(_v.x, _v.z, 0.22);
        if ((i + id.length) % 3 === 0 && Math.abs(u - du) > DOORBAY / 2 + 0.1) vine(d, u, VD + 0.24, ARCH_YS - 0.2, i);
      });
      for (const e of [-1, 1]) b.group(xs[e < 0 ? 0 : xs.length - 1], 0, VD / 2, Math.PI / 2, () => { GR.pre = b.pre; arcadeFront(b, GR, [-VD / 2 + 0.2, VD / 2], ARCH_YS, HV - 0.24, ARCH_R, 0.22, 0.3, 0); });   // vòm đầu hồi hành lang
      GR.pre = null;
    });
    // CỬA CHÍNH (khung đá, ô kính quạt) + TRÁN TƯỜNG (bảng tên trên attic, biểu tượng lớp ở tam giác)
    b.group(ox, Y, oz, FACE[side], () => {
      const d = DG.follow(b); GR.pre = b.pre;
      for (let i = 0; i < 3; i++) { const dd = 0.38 * (3 - i); cbox(b, 2 * gap + 0.6 + (2 - i) * 0.38, 0.05 * (i + 1), dd, 0, 0, (st.yard ? 0 : VD + 0.2) + dd / 2, i ? C.stone : C.stone2, 0.03); }   // 3 bậc thềm, sâu 0,15·φ² ≈ 0,38 m/bậc
      if (st.yard) {   // cổng vòm khu sân chơi: 2 trụ bo tròn + vòm + bảng tên (không cánh cổng sắt)
        const px = gap + 0.42;
        for (const s of [-1, 1]) { b.group(s * px, 0, 0, 0, () => roundPier(b, 0, 0, HV + 0.9, 0.42)); cbox(b, 0.7, 0.3, 0.7, s * px, HV + 0.9, 0, FC.stone, 0.06); b.ball(0.3, s * px, HV + 1.45, 0, FC.stone); }
        arcadeFront(b, GR, [-px, px], H - 0.2, HV + 0.9, 1.05, 0.42, 0.5, 0);
        cbox(b, 2 * px + 0.9, 0.16, 0.66, 0, HV + 0.9, 0, FC.trim, 0.04);
        signAt(b, atlas.sign(st.sign[0], st.sign[1]), 3.2, 0.4, 0, HV + 0.6, 0.29);
        for (const s of [-1, 1]) vine(d, s * (px + 0.5), 0.3, HV + 0.3, s + 3, 0, 1);
        GR.pre = null; return;
      }
      for (const s of [-1, 1]) { cbox(b, 0.32, 2.8, T + 0.26, s * (gap + 0.02), 0, 0, FC.trim, 0.04); b.box(0.08, 2.6, 1.3, s * (gap - 0.12), 0.05, -0.8, FC.door); }
      cbox(b, 2 * gap + 0.74, 0.16, T + 0.3, 0, 2.75, 0, FC.trim, 0.04);
      b.box(2 * gap, HV - 2.91, T, 0, 2.91, 0, FC.wall);
      fanlight(b, GR, d, 2.91, T / 2, gap - 0.3, 0.62);
      const PW = big ? DOORBAY + 2 * BAY + 0.6 : DOORBAY + 0.5, attic = big ? 1.0 : 0.62;
      const pd = pediment(b, PW, HV, VD, big ? 6.5 : 4.2, attic, id !== 'chess');
      signAt(b, atlas.sign(st.sign[0], st.sign[1]), big ? 5.0 : 3.3, big ? 0.62 : 0.42, 0, HV + attic / 2 + 0.03, pd.zf + 0.04);
      const ty = pd.y1 + pd.hp * 0.4, tz = pd.zf;
      if (id === 'rubik') oculus(b, GR, 0, ty, tz, Math.min(0.36, pd.hp * 0.3));
      else if (id === 'chess') chessPiece(b, 'k', 0, VD - 0.2, 0.55, 'w', pd.y1 + pd.hp + 0.05);
      else if (id === 'music') musicNote(b, -0.15, ty - 0.25, tz + 0.02, 0.36, C.ink);
      else if (id === 'hall') rubikRelief(b, 0, ty, tz + 0.01, Math.min(1.1, pd.hp * 0.55));   // phù điêu Rubik duy nhất: trán toà chính
      else if (id === 'elec') { const by = ty - 0.3; b.box(0.18, 0.5, 0.08, 0.05, by + 0.28, tz, C.Yl, 0, 0, -0.45); b.box(0.18, 0.5, 0.08, -0.05, by - 0.08, tz, C.Yl, 0, 0, -0.45); b.box(0.36, 0.09, 0.09, 0, by + 0.21, tz, C.Yl); }
      else oculus(b, GR, 0, ty, tz, Math.min(0.36, pd.hp * 0.3));
      for (const s of [-1, 1]) { const u = s * (DOORBAY / 2 + 0.75); d.cyl(0.32, 0.24, 0.5, u, 0, VD + 0.9, C.pot, 8); d.ball(0.4, u, 0.78, VD + 0.9, C.leaf); d.ball(0.13, u + 0.15, 1.05, VD + 1.0, C.fl[1]); d.ball(0.13, u - 0.15, 1.0, VD + 0.8, C.fl[2]); d.ball(0.11, u, 1.12, VD + 0.75, C.fl[0]); }
      GR.pre = null;
    });
    // đồ bên trong
    if (!st.yard && id !== 'office') {
      const opp = { b: 't', t: 'b', l: 'r', r: 'l' }[side], [px, pz, qx, qz] = sides[opp], wl = (opp === 't' || opp === 'b' ? r.w : r.h) * S;
      b.group((px + qx) / 2, Y, (pz + qz) / 2, FACE[opp] + Math.PI, () => { b.box(Math.min(6, wl * 0.4), 1.5, 0.08, 0, 1.2, T / 2 + 0.05, C.board); b.box(Math.min(6.2, wl * 0.4 + 0.2), 0.1, 0.18, 0, 1.12, T / 2 + 0.1, C.wood); });
    }
    if (id === 'rubik' || id === 'elec') for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = cx - 2 + i * 4, z = cz - 1.6 + j * 2.6; b.box(1.8, 0.08, 0.7, x, Y + 0.72, z, C.wood); b.box(1.6, 0.72, 0.1, x, Y, z, C.woodD); b.box(1.6, 0.42, 0.4, x, Y, z + 0.7, id === 'rubik' ? C.B : C.shutter); }
    if (id === 'chess' && D.CHESS_T) for (const [x2, y2] of D.CHESS_T) { const x = X3(x2), z = Z3(y2); b.box(1.3, 0.08, 1.3, x, Y + 0.75, z, C.trim); b.box(0.66, 0.02, 0.66, x - 0.33, Y + 0.83, z - 0.33, C.ink); b.box(0.66, 0.02, 0.66, x + 0.33, Y + 0.83, z + 0.33, C.ink); b.box(0.2, 0.75, 0.2, x, Y, z, C.woodD); }
    if (id === 'music' && D.MUSIC_SPOTS) { const [x2, y2] = D.MUSIC_SPOTS.piano, x = X3(x2), z = Z3(y2); b.box(2.0, 1.0, 0.8, x, Y, z, C.ink); b.box(2.0, 0.06, 0.32, x, Y + 0.85, z + 0.5, C.W); b.box(0.8, 0.5, 0.4, x, Y, z + 1.0, C.woodD); }
    if (id === 'hall') { b.box(5, 0.6, (bz - az) * 0.6, bx - 2.8, Y, cz, C.wood); for (let i = 0; i < 4; i++) b.box(r.w * S * 0.45, 0.45, 0.5, cx - 1.5, Y, Z3(r.y + 300 + i * 68), C.roof); }
    // MÁI: mesh riêng mỗi lớp, mờ dần khi người chơi vào trong
    if (st.yard) return;
    const OV = 0.9, fx0 = ax - (side === 'l' ? VD + 0.6 : OV), fx1 = bx + (side === 'r' ? VD + 0.6 : OV), fz0 = az - (side === 't' ? VD + 0.6 : OV), fz1 = bz + (side === 'b' ? VD + 0.6 : OV);
    const rb = new Batch('roof-' + id), t0 = rb.tris;
    if (st.flat) {
      const gx0 = fx0 + 0.6, gx1 = fx1 - 0.6, gz0 = fz0 + 0.6, gz1 = fz1 - 0.6, gcx = (gx0 + gx1) / 2, gcz = (gz0 + gz1) / 2;   // sân thượng: tường chắn mái có phào, chậu cây
      rb.box(gx1 - gx0, 0.3, gz1 - gz0, gcx, Y + HV - 0.2, gcz, C.stone);
      for (const [w, d, x, z] of [[gx1 - gx0, 0.3, gcx, gz0], [gx1 - gx0, 0.3, gcx, gz1], [0.3, gz1 - gz0, gx0, gcz], [0.3, gz1 - gz0, gx1, gcz]]) { rb.box(w, 0.5, d, x, Y + HV, z, FC.wall); cbox(rb, w + 0.2, 0.12, d + 0.2, x, Y + HV + 0.5, z, FC.trim, 0.03); }
      for (const [x, z] of [[gx0 + 1, gz0 + 1], [gx1 - 1, gz0 + 1], [gx0 + 1, gz1 - 1], [gx1 - 1, gz1 - 1]]) { rb.cyl(0.4, 0.3, 0.5, x, Y + HV + 0.1, z, C.pot, 8); rb.ball(0.5, x, Y + HV + 0.85, z, C.leaf); }
    } else if (big) {   // toà chính: mái 4 mái + tháp chuông trên trục cổng trường
      const rr = hipRoofPlus(rb, fx0, fz0, fx1, fz1, Y + HV + 0.02, HV);
      const alongZ = fz1 - fz0 > fx1 - fx0, tx = alongZ ? rr.cx : (side === 't' || side === 'b' ? dx : rr.cx), tz = alongZ ? (side === 'l' || side === 'r' ? dz : rr.cz) : rr.cz;
      bellTower(rb, tx, Y + HV + 0.02 + HV, tz, 1.9, FACE[side]);
    } else gableRoof(rb, fx0, fz0, fx1, fz1, Y + HV + 0.02, HV / PHI, OV - T / 2 - 0.02, side === 't' || side === 'b');
    budget['roof-' + id] = Math.round(rb.tris - t0);
    roofs.push({ b: rb, x0: fx0 - 0.3, x1: fx1 + 0.3, z0: fz0 - 0.3, z1: fz1 + 0.3 });
  }
  for (const [id, r] of Object.entries(R)) if (r.walls && r.w && r.y + r.h > env.Y_MIN && r.y < env.Y_MAX) measure(SB, id, () => classroom(id, r));

  // ================= CỔNG TRƯỜNG (hướng tây) + QUẢNG TRƯỜNG + CHỐT BẢO VỆ =================
  if (RS.GATE) buildGate({ ctx, RS, D, GB, X3, Z3, Y, C, ROOM, DG, atlas, signAt, measure, rubikCube, addFoot, kit, rnd, lampPost, stoneBench, col, scene, meshes });
  buildPlaza({ ctx, env, addFoot });   // quảng trường tròn + tượng Rubik + bảng Toán: sample/plaza.js

  // ================= CỘT CỜ + SÂN CHÀO CỜ (sân xi măng kẻ vạch trò chơi) =================
  let flagAt = null;
  if (D.FLAG) {
    const b = SB, x = X3(D.FLAG[0]), z = Z3(D.FLAG[1]);
    b.cyl(1.5, 1.6, 0.25, x, Y, z, C.stone2, 8); b.cyl(1.1, 1.2, 0.25, x, Y + 0.25, z, C.stone, 8); b.cyl(0.7, 0.75, 0.25, x, Y + 0.5, z, C.trim, 8);
    b.cyl(0.05, 0.08, 8.3, x, Y + 0.75, z, C.W, 6); b.ball(0.15, x, Y + 9.1, z, C.gold);
    DG.follow(null); for (let i = 0; i < 8; i++) { const a2 = i / 8 * 6.283; DG.ball(0.2, x + Math.cos(a2) * 1.35, Y + 0.32, z + Math.sin(a2) * 1.35, [C.R, C.Yl][i % 2]); }
    flagAt = { x: x + 0.08, y: Y + 8.2, z, w: 1.9, h: 1.25 };
    col(x, z, 0.8, Y + 9);
  }
  if (R.attend) {   // sân xi măng: ô nhảy lò cò, ô ăn quan, vòng tròn
    const r = R.attend, x0 = X3(r.x), z0 = Z3(r.y), x1 = X3(r.x + r.w), z1 = Z3(r.y + r.h), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, d = DG.follow(null), py = Y + 0.065, line = (w, dd, x, z, c = C.paint) => d.box(w, 0.01, dd, x, py, z, c);
    GR.box(x1 - x0, 0.05, z1 - z0, cx, Y, cz, C.cement); addFoot(x0, z0, x1, z1); for (const [w, dd, x, z] of [[x1 - x0, 0.2, cx, z0], [x1 - x0, 0.2, cx, z1], [0.2, z1 - z0, x0, cz], [0.2, z1 - z0, x1, cz]]) GR.box(w, 0.09, dd, x, Y, z, C.curb);
    const hx = x0 + 3, hz = cz + 1, HC = [C.R, C.Yl, C.G, C.B];
    [[0, 0], [1, 0], [2, -0.5], [2, 0.5], [3, 0], [4, -0.5], [4, 0.5], [5, 0]].forEach(([i, j], k) => { line(0.95, 0.95, hx + i * 1.0, hz + j * 1.0); d.box(0.8, 0.012, 0.8, hx + i * 1.0, py + 0.005, hz + j * 1.0, HC[k % 4]); });
    d.push(new THREE.RingGeometry(1.0, 1.3, 7).rotateX(-Math.PI / 2), C.B, hx + 6.4, py + 0.008, hz);
    const ox = cx + 3.5, oz = cz - 0.5; line(5.2, 0.08, ox, oz - 1.0); line(5.2, 0.08, ox, oz + 1.0); line(5.2, 0.08, ox, oz); for (let i = 0; i <= 5; i++) line(0.08, 2.0, ox - 2.6 + i * 1.04, oz);
    for (const s of [-1, 1]) d.push(new THREE.RingGeometry(0.95, 1.05, 10, 1, s < 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), C.paint, ox + s * 2.6, py, oz);
    d.push(new THREE.RingGeometry(2.4, 2.55, 20).rotateX(-Math.PI / 2), C.paint, cx - 0.5, py, cz - 3.0);
  }

  // ================= SÂN TRƯỜNG: bồn cây phượng, ghế đá, đèn, lối đi, vỉa hè, bảng tin, thùng rác, xe kem, sân chơi =================
  for (const [x2, y2] of D.TREES || []) {
    const x = X3(x2), z = Z3(y2); if (nearDoor(x, z, 2.5)) continue;
    phuong.push([x, z, 1.05 + rnd() * 0.3]); addFoot(x - 1.4, z - 1.4, x + 1.4, z + 2.4);
    SB.cyl(1.25, 1.35, 0.45, x, Y, z, C.stone, 8); GR.cyl(1.08, 1.08, 0.04, x, Y + 0.43, z, C.woodD, 8);
    if (x2 < 1600) stoneBench(SB, x, z + 1.95, 0);
  }
  for (const [x2, y2] of [[120, 380], [380, 400], [1130, 370], [1640, 330], [1640, 450]]) if (!nearDoor(X3(x2), Z3(y2), 2) && !inRoom(x2, y2, 10)) { const x = X3(x2), z = Z3(y2); phuong.push([x, z, 0.95]); SB.cyl(1.0, 1.1, 0.4, x, Y, z, C.stone, 8); }
  for (const [x2, y2] of [[200, 435], [500, 435], [1100, 435], [870, 700], [1180, 735], [1640, 700]]) if (!nearDoor(X3(x2), Z3(y2), 1.6)) stoneBench(SB, X3(x2), Z3(y2), 0);
  for (const [x2, y2] of D.LAMPS || []) lampPost(SB, X3(x2), Z3(y2));
  {
    const d = DG.follow(null), walled = Object.values(R).filter(r => r.walls && r.w);
    for (const r of walled) {   // vỉa hè có bó vỉa quanh lớp
      const hx = r.x + r.w / 2, [ax, az] = P(r.x, r.y, hx), [bx, bz] = P(r.x + r.w, r.y + r.h, hx), m = 1.4;
      for (const [x0, z0, x1, z1] of [[ax - m, az - m, bx + m, az - 0.15], [ax - m, bz + 0.15, bx + m, bz + m], [ax - m, az, ax - 0.15, bz], [bx + 0.15, az, bx + m, bz]]) GR.box(x1 - x0, 0.06, z1 - z0, (x0 + x1) / 2, Y, (z0 + z1) / 2, C.walk);
      for (const [x0, z0, x1, z1] of [[ax - m, az - m, bx + m, az - m + 0.18], [ax - m, bz + m - 0.18, bx + m, bz + m], [ax - m, az - m, ax - m + 0.18, bz + m], [bx + m - 0.18, az - m, bx + m, bz + m]]) GR.box(x1 - x0, 0.12, z1 - z0, (x0 + x1) / 2, Y, (z0 + z1) / 2, C.curb);
      for (const [x, z] of [[ax - 1.0, az - 1.0], [bx + 1.0, az - 1.0], [ax - 1.0, bz + 1.0], [bx + 1.0, bz + 1.0]]) if (!nearDoor(x, z, 3)) kit('bush', x, Y, z, 0.9 + rnd() * 0.3, rnd() * 6);
    }
    if (RS.GATE) {   // lối đi lát gạch chính: từ cổng tới hội trường
      const [x0, z] = P(RS.GATE[0] + 40, RS.GATE[1]), [x1] = P(1150, RS.GATE[1]);
      GR.box(x1 - x0, 0.05, 3.2, (x0 + x1) / 2, Y, z, SH('stoneWarmL', 0.94)); for (const s of [-1, 1]) GR.box(x1 - x0, 0.09, 0.22, (x0 + x1) / 2, Y, z + s * 1.7, C.curb);
      for (let x = x0 + 0.6, k = 0; x < x1; x += 1.2, k++) d.box(0.55, 0.012, 3.0, x, Y + 0.05, z, k % 2 ? SH('stoneWarmL', 0.9) : C.walk);
    }
    const at = (x2, y2) => P(x2, y2);
    { const [x, z] = at(700, 455); d.group(x, Y, z, 0, () => { for (const s of [-1, 1]) d.box(0.12, 2.2, 0.12, s * 1.3, 0, 0, C.woodD); d.box(2.8, 1.4, 0.1, 0, 0.8, 0, C.wood); d.box(2.5, 1.15, 0.04, 0, 0.92, 0.06, C.trim); [C.Yl, C.B, C.fl[1], C.G, C.W].forEach((c, i) => d.box(0.42, 0.5, 0.02, -1.0 + i * 0.5, 1.15 + (i % 2) * 0.25, 0.09, c)); d.prism(3.0, 0.4, 0.5, 0, 2.2, 0, C.roof); }); signAt(d, atlas.sign('BẢNG TIN', C.board, '#fff', C.gold), 1.6, 0.22, x, Y + 2.05, z + 0.12); }
    { const [x, z] = at(470, 760); d.group(x, Y, z, 0.3, () => {   // xe bán kem
      d.box(2.2, 0.95, 1.1, 0, 0.4, 0, SH('shutter', 1.618)); d.box(2.24, 0.2, 1.14, 0, 1.35, 0, C.trim); d.box(2.24, 0.12, 1.14, 0, 0.4, 0, C.fl[1]);
      for (const s of [-1, 1]) d.cyl(0.36, 0.36, 0.14, s * 0.7, 0.36, 0.6, C.iron, 8, 0, Math.PI / 2);
      d.cyl(0.04, 0.04, 1.3, 0.7, 1.55, 0, C.woodD, 5); d.push(new THREE.ConeGeometry(1.4, 0.55, 8, 1, true), C.fl[1], 0.7, 3.0, 0); d.push(new THREE.ConeGeometry(1.42, 0.56, 8, 1, true).rotateY(Math.PI / 8).scale(1, 1, 1), C.trim, 0.7, 3.0, 0, 0, 0, 0, 0.6, 1.0, 0.6);
      d.cone(0.12, 0.3, -0.5, 1.55, 0.25, SH('wood', 1.618), 5); d.ball(0.16, -0.5, 1.95, 0.25, C.fl[1]); d.cone(0.12, 0.3, -0.1, 1.55, 0.25, SH('wood', 1.618), 5); d.ball(0.16, -0.1, 1.95, 0.25, C.trim);
      d.box(1.6, 0.3, 0.04, 0, 0.75, 0.57, C.Yl); });
    }
    for (const [x2, y2] of [[200, 435], [500, 435], [1100, 435], [860, 760]]) { const [x, z] = at(x2 + 70, y2); d.cyl(0.25, 0.22, 0.75, x, Y, z, C.shutter, 8); d.cyl(0.27, 0.27, 0.07, x, Y + 0.75, z, PH('shutterD'), 8); }
    // sân chơi: nền cao su, xích đu, cầu trượt, bập bênh
    { const [px, pz] = at(910, 830), b = SB;
      GR.box(11, 0.05, 5.4, px, Y, pz, SH('roof', 1.382)); addFoot(px - 5.6, pz - 2.8, px + 5.6, pz + 2.8); for (const s of [-1, 1]) GR.box(11.2, 0.12, 0.18, px, Y, pz + s * 2.75, C.curb);
      b.group(px - 3.2, Y, pz, 0, () => {   // xích đu 2 ghế
        for (const s of [-1, 1]) for (const t of [-1, 1]) b.box(0.12, 2.6, 0.12, s * 1.6, 0, t * 0.55, C.R, 0, t * 0.2);
        b.box(3.5, 0.12, 0.12, 0, 2.48, 0, C.Yl);
        for (const u of [-0.75, 0.75]) { for (const s of [-1, 1]) b.box(0.03, 1.8, 0.03, u + s * 0.25, 0.65, 0, PH('ironL')); b.box(0.6, 0.06, 0.3, u, 0.62, 0, C.B); }
      });
      b.group(px + 2.2, Y, pz, 0, () => {   // cầu trượt
        b.box(1.2, 1.6, 1.2, -0.6, 0, 0, C.Yl); b.box(1.3, 0.1, 1.3, -0.6, 1.6, 0, C.R);
        for (const s of [-1, 1]) b.box(0.06, 0.6, 1.2, -0.6 + s * 0.6, 1.7, 0, C.R);
        b.box(2.6, 0.08, 0.9, 1.0, 0.75, 0, C.B, 0, 0, -0.62); for (const s of [-1, 1]) b.box(2.6, 0.2, 0.06, 1.0, 0.82, s * 0.45, C.G, 0, 0, -0.62);
        for (let i = 0; i < 4; i++) b.box(0.9, 0.06, 0.25, -0.6, 0.35 + i * 0.4, -0.72 - i * 0.04, C.W);
      });
      b.group(px - 0.2, Y, pz + 1.8, 0, () => { b.box(0.3, 0.4, 0.3, 0, 0, 0, C.iron); b.box(3.0, 0.08, 0.32, 0, 0.42, 0, C.G, 0, 0, 0.12); for (const s of [-1, 1]) b.box(0.06, 0.3, 0.3, s * 1.3, 0.5 - s * 0.16, 0, C.R); });
      col(px + 1.6, pz, 0.7, Y + 1.7);
    }
  }

  // ================= SÂN BÓNG ĐÁ =================
  if (R.field) {
    const f = R.field, b = GR, x0 = X3(f.x + 20), x1 = X3(f.x + f.w - 20), z0 = Z3(f.y + 20), z1 = Z3(f.y + f.h - 20), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, L = x1 - x0, W = z1 - z0, ly = Y + 0.03;
    b.box(L + 2.4, 0.04, W + 2.4, cx, Y - 0.01, cz, SH('roof', 1.236)); addFoot(x0 - 1.2, z0 - 1.2, x1 + 1.2, z1 + 3.4);   // đường chạy quanh sân
    for (let i = 0; i < 10; i++) b.plane(L / 10, W, x0 + (i + 0.5) * L / 10, Y + 0.035, cz, i % 2 ? PH('grassD') : C.grass, 0, -Math.PI / 2);
    const line = (w, d, x, z) => b.box(w, 0.02, d, x, ly + 0.01, z, C.W);
    line(L, 0.12, cx, z0); line(L, 0.12, cx, z1); line(0.12, W, x0, cz); line(0.12, W, x1, cz); line(0.12, W, cx, cz);
    b.push(new THREE.RingGeometry(1.7, 1.82, 20).rotateX(-Math.PI / 2), C.W, cx, ly + 0.03, cz);
    for (const s of [-1, 1]) {
      const gx = s < 0 ? x0 : x1, g = SB; line(0.12, 6, gx - s * 3, cz); line(3, 0.12, gx - s * 1.5, cz - 3); line(3, 0.12, gx - s * 1.5, cz + 3);
      for (const v of [-1.8, 1.8]) { g.box(0.12, 1.75, 0.12, gx, Y, cz + v, C.W); g.box(0.06, 1.7, 0.06, gx + s * 1.0, Y, cz + v, C.W); g.box(1.0, 0.05, 0.05, gx + s * 0.5, Y + 1.7, cz + v, C.W); }
      g.box(0.12, 0.12, 3.72, gx, Y + 1.68, cz, C.W);
      DG.follow(null).plane(3.6, 1.7, gx + s * 1.0, Y + 0.85, cz, C.trim, Math.PI / 2); DG.plane(1.0, 1.7, gx + s * 0.5, Y + 0.85, cz - 1.8, C.trim); DG.plane(1.0, 1.7, gx + s * 0.5, Y + 0.85, cz + 1.8, C.trim, Math.PI);
    }
    for (let i = 0; i < 3; i++) {   // khán đài 3 bậc (cao 0,382 m · sâu 0,618 m mỗi bậc), ghế nhựa màu Rubik
      const zz = z1 + 1.6 + i * 0.618, n = Math.floor(L * 0.5 / 0.618);
      cbox(SB, L * 0.5, 0.382 * (i + 1), 0.618, cx, Y, zz, i % 2 ? C.stone : C.plinth, 0.05);
      for (let k = 0; k < n; k++) SB.box(0.42, 0.12, 0.38, cx - L * 0.25 + 0.309 + k * 0.618, Y + 0.382 * (i + 1), zz - 0.05, [C.R, C.Yl, C.B, C.G, C.O][(k + i * 2) % 5]);
    }
  }

  // ================= XUẤT RA SCENE =================
  const mat = toon(C.W, { vertexColors: true });
  fakeAO(SB, Y); fakeAO(GB, Y);
  for (const [bt, shadow, ol] of [[SB, true, true], [GB, true, true], [GR, false, false]]) { const m = bt.mesh(mat, shadow); if (!m) continue; if (ol) outline(m); scene.add(m); meshes.push(m); }
  for (const r of roofs) {
    fakeAO(r.b, Y + H - 2);
    r.mat = toon(C.W, { vertexColors: true, transparent: true, side: THREE.DoubleSide, unique: true });
    r.m = r.b.mesh(r.mat, true); r.m.name = 'school-' + r.b.name; scene.add(r.m); meshes.push(r.m); r.op = 1;
  }
  // cây phượng: thân + tán lá xanh + chùm hoa đỏ (InstancedMesh)
  if (phuong.length) {
    const g0 = g => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
    const trunk = mergeGeometries([new THREE.CylinderGeometry(0.16, 0.26, 2.0, 6).translate(0, 1.0, 0), new THREE.CylinderGeometry(0.08, 0.12, 1.4, 5).rotateZ(0.9).translate(0.6, 2.1, 0), new THREE.CylinderGeometry(0.08, 0.12, 1.4, 5).rotateZ(-0.9).translate(-0.6, 2.1, 0.1)].map(g0));
    const blob = (r, x, y, z, sy = 0.45) => new THREE.IcosahedronGeometry(r, 0).scale(1, sy, 1).translate(x, y, z);
    const green = mergeGeometries([blob(1.7, 0, 2.6, 0), blob(1.2, 1.3, 2.45, 0.4), blob(1.2, -1.3, 2.5, -0.3), blob(1.1, 0.2, 2.45, 1.3), blob(1.1, -0.2, 2.5, -1.3)].map(g0));
    const red = mergeGeometries([blob(1.4, 0.1, 3.05, 0, 0.4), blob(1.0, 1.25, 2.85, 0.5, 0.42), blob(1.0, -1.2, 2.9, -0.4, 0.42), blob(0.9, -0.3, 2.85, 1.25, 0.42), blob(0.9, 0.4, 2.9, -1.2, 0.42)].map(g0));
    for (const g of [green, red]) g.computeVertexNormals();
    const REDS = [C.R, PH('roofL'), PH('rubikR')];
    const mk = (geo, material, colOf) => {
      const im = new THREE.InstancedMesh(geo, material, phuong.length);
      phuong.forEach(([x, z, s], i) => { _o.position.set(x, Y + 0.4, z); _o.rotation.set(0, (x * 7 + z) % 6.28, 0); _o.scale.setScalar(s); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); if (colOf) im.setColorAt(i, new THREE.Color(colOf(i))); });
      im.name = 'school-phuong'; im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); meshes.push(im); return im;
    };
    mk(trunk, toon(C.woodD));
    mk(green, toon(C.W), i => [C.leaf, C.leafD, PH('grassD')][i % 3]);
    const rim = mk(red, toon(C.W), i => REDS[i % 3]);
    const ol = new THREE.InstancedMesh(red, softOutline, phuong.length); ol.instanceMatrix = rim.instanceMatrix; ol.frustumCulled = false; ol.raycast = () => {}; scene.add(ol); meshes.push(ol);
  }
  for (const [name, list] of Object.entries(kits)) placeKit(scene, name, list, { shadow: false }).then(l => l.forEach(m => { m.name = 'school-kit-' + name; }));

  // mái mờ dần khi người chơi ở trong lớp/hành lang (để camera luôn thấy nhân vật)
  function update(p, dt = 0.016) {
    for (const r of roofs) {
      const inside = p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1, tgt = inside ? 0 : 1;
      if (r.op === tgt) continue;
      r.op = Math.max(0, Math.min(1, r.op + (tgt - r.op > 0 ? 1 : -1) * dt * 3)); if (Math.abs(r.op - tgt) < 0.02) r.op = tgt;
      r.mat.opacity = r.op; r.mat.depthWrite = r.op > 0.98; r.mat.visible = r.op > 0.01;   // material.visible: không đụng m.visible (town-buildings dùng để ẩn vật ở xa) r.m.castShadow = r.op > 0.5;
    }
  }
  return { meshes, flagAt, update };
}
