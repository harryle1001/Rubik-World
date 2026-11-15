// sample/gate.js — CỔNG TRƯỜNG RUBIK (mẫu chuẩn) + quảng trường trước cổng + chốt bảo vệ.
// Tách từ zone-school.js; gọi 1 dòng: buildGate({...}) khi RS.GATE có.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BLOCKS, PHI } from '../layout.js';
import { Batch, GLOW_MATS } from '../decor.js';
import { toon, gradientMap } from '../style.js';
import { PAL } from './palette.js';

const softOutline = new THREE.MeshBasicMaterial({ color: '#4a3548', side: THREE.BackSide });
softOutline.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.022;'); };

export function buildGate(a) {
  const { ctx, scene, meshes, RS, D, GB, X3, Z3, Y, C, ROOM, DG, atlas, signAt, measure, rubikCube, addFoot, kit, rnd, lampPost, stoneBench, col } = a;
  const gx = X3(RS.GATE[0]), gz = Z3(RS.GATE[1]);
  measure(GB, 'gate', () => { const r = archGate({ ctx, scene, meshes, gx, gz, Y, rubikCube }); GB.tris += r.tris; });
  // quảng trường: nền đá dịu, đường viền, hoa văn tròn trước cổng, lối đi chính
  { const A = BLOCKS[0].r, x0 = A[0] + 0.5, x1 = gx - 1.2, cxp = (x0 + x1) / 2, w = x1 - x0;
    GB.box(w, 0.04, 26, cxp, Y, gz, '#e6dcc4'); addFoot(x0, gz - 13, gx + 4, gz + 13);
    for (const s of [-1, 1]) GB.box(w, 0.06, 0.35, cxp, Y, gz + s * 12.8, '#c4b48f');
    GB.box(w, 0.05, 3.6, cxp, Y, gz, '#d6c39b'); for (const s of [-1, 1]) GB.box(w, 0.07, 0.25, cxp, Y, gz + s * 1.9, '#b89c6e');
    GB.push(new THREE.RingGeometry(3.2, 4.2, 24).rotateX(-Math.PI / 2), '#cdb68a', x1 - 6, Y + 0.07, gz); GB.push(new THREE.RingGeometry(1.0, 1.5, 16).rotateX(-Math.PI / 2), '#b89c6e', x1 - 6, Y + 0.075, gz);
    DG.follow(null); for (let x = x0 + 1, k = 0; x < x1; x += 2.4, k++) for (const s of [-1, 1]) DG.box(1.0, 0.012, 3.6, x, Y + 0.05, gz + s * 7.5, k % 2 ? '#d8cbaa' : '#e0d4b6');
    for (const s of [-1, 1]) { for (let x = x0 + 1.5; x < x1 - 0.5; x += 2.6) kit('bush', x, Y, gz + s * 11.8, 1.05 + rnd() * 0.2, rnd() * 6); lampPost(GB, x0 + 3, gz + s * 4.2);   // cột đèn sát cổng bỏ: cổng có đèn lồng riêng, bậc thềm quạt chiếm chỗ stoneBench(GB, x1 - 9, gz + s * 9.5, 0); }
  }
  if (D.BOOTH) { const x = X3(D.BOOTH[0]), z = Z3(D.BOOTH[1]), b = GB;   // chốt bảo vệ: nhà nhỏ tường kem, cửa sổ, mái ngói
    b.box(2.0, 0.3, 2.0, x, Y, z, C.plinth); b.box(1.8, 2.1, 1.8, x, Y + 0.3, z, ROOM.hall.wall); b.box(1.9, 0.18, 1.9, x, Y + 2.3, z, C.trim);
    b.plane(1.1, 0.75, x - 0.91, Y + 1.6, z, C.glass, -Math.PI / 2); b.plane(1.3, 0.95, x - 0.905, Y + 1.6, z, C.trim, -Math.PI / 2);
    b.hip(2.6, 0.9, 2.6, x, Y + 2.45, z, C.roof); signAt(b, atlas.sign('BẢO VỆ', '#3d4f6b'), 1.2, 0.2, x - 0.95, Y + 2.15, z, -Math.PI / 2); }
}

// ======================= CỔNG VÒM (khải hoàn môn đá cổ) =======================
// Toạ độ cục bộ: x ngang cổng, y lên, +z hướng ra quảng trường (tây). Mọi kích thước suy từ người lớn HU và φ, π:
//   vòm giữa: đỉnh vòm = HU·φ³ ≈ 7,2 m (≥ φ² người lớn), rộng = đỉnh/φ (rộng:cao = 1:φ), bán nguyệt bán kính = rộng/2 (π)
//   trụ giữa = vòm/φ, khám hai bên = vòm/φ, trụ ngoài = trụ giữa/φ; thân giữa cao ≈ rộng thân giữa; cánh = thân/φ.
// Gộp: thân đá + mái (1 mesh đổ bóng + 1 viền), chi tiết nhỏ (1 mesh, không bóng), biển chữ (1), đèn phát sáng (1) = 5 draw call.
const HU = 1.7, A = HU * PHI ** 3 / PHI, R = A / 2, HS = HU * PHI ** 3 - R, P1 = A / PHI, A2 = A / PHI, P2 = P1 / PHI;
const W = A + 2 * P1 + 2 * A2 + 2 * P2, XC = A / 2 + P1, HB = A + 2 * P1, HW = HB / PHI, DEP = R, Z0 = R / PHI ** 2;
const ET = HS + R + 0.65, PL = HU / PHI ** 2, SW = HB / PHI ** 0.6, SH = SW / 4;   // ET: gờ đầu cột; PL: đế; biển tên SW×SH (tỷ lệ 4:1 như canvas)
const H_ = n => PAL[n].hex;   // màu từ bảng chuẩn sample/palette.js
const G = {
  stone: H_('stoneCream'), stone2: H_('stoneCreamD'), light: H_('stoneCreamL'), niche: H_('stoneWarm'), relief: H_('plaster'), gold: H_('brass'),
  roof: H_('roof'), roof2: H_('roofL'), ridge: H_('roofD'), soffit: H_('woodD'), moss: H_('leaf'), moss2: H_('leafD'), ivy: H_('leafD'), ivy2: H_('leaf'),
  red: H_('flowerRed'), glow: H_('lampGlow'), glowR: H_('rubikO'), iron: H_('iron'),
};
const _w = new THREE.Vector3();
// trụ có rãnh (12 rãnh lõm hình sin, bóng toon tách từng rãnh)
function fluted(r, h, n = 12) {
  const g = new THREE.CylinderGeometry(r, r, h, n * 4, 1, true), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), f = ((Math.atan2(x, z) / (2 * Math.PI)) * n % 1 + 1) % 1, k = 1 - 0.11 * Math.sin(Math.PI * f); p.setX(i, x * k); p.setZ(i, z * k); }
  return g;
}
const rbox = (b, w, h, d, x, y0, z, col, rad = 0.08) => b.push(new RoundedBoxGeometry(w, h, d, 2, Math.min(rad, w / 2, h / 2, d / 2) * 0.99), col, x, y0 + h / 2, z);
// cột: đế vuông bo + gờ tròn, thân rãnh, cổ cột, đầu cột loe + bàn đá bo
function column(b, x, y0, z, r, h) {
  rbox(b, r * 2.9, r * 0.9, r * 2.9, x, y0, z, G.stone2, r * 0.25);
  b.push(new THREE.TorusGeometry(r * 1.12, r * 0.22, 6, 20).rotateX(Math.PI / 2), G.light, x, y0 + r * 1.05, z);
  b.push(fluted(r, h - r * 2.7), G.light, x, y0 + r * 1.05 + (h - r * 2.7) / 2, z);
  b.push(new THREE.TorusGeometry(r * 1.02, r * 0.12, 5, 20).rotateX(Math.PI / 2), G.stone2, x, y0 + h - r * 1.6, z);
  b.cyl(r * 1.45, r, r * 0.8, x, y0 + h - r * 1.6, z, G.light, 20);
  rbox(b, r * 3.1, r * 0.55, r * 3.1, x, y0 + h - r * 0.8, z, G.stone2, r * 0.2);
}
// mái cong ngói: 4 mái lõm (cao dần ^φ), góc đầu đao vểnh, mặt dưới gỗ; bờ nóc + bờ góc ống cong cuộn đầu
function curvedRoof(b, x0, y0, z0, a, d, h, lift, skip = -1) {
  const rr = Math.max(0, a - d), R0 = [x0 - rr, z0], R1 = [x0 + rr, z0], C4 = [[x0 - a, z0 - d], [x0 + a, z0 - d], [x0 + a, z0 + d], [x0 - a, z0 + d]];
  const top = c => (c[0] < x0 ? R0 : R1), N = 7, M = 12, pt = (A_, B_, LA, LB, t, s) => {
    const TA = top(A_), TB = top(B_), ex = A_[0] + (B_[0] - A_[0]) * s, ez = A_[1] + (B_[1] - A_[1]) * s, rx = TA[0] + (TB[0] - TA[0]) * s, rz = TA[1] + (TB[1] - TA[1]) * s;
    return [ex + (rx - ex) * t, y0 + h * t ** PHI + (LA * (1 - s) ** 4 + LB * s ** 4) * (1 - t) ** 2, ez + (rz - ez) * t];
  };
  const hips = [];
  for (let e = 0; e < 4; e++) {
    const A_ = C4[e], B_ = C4[(e + 1) % 4], LA = lift[e], LB = lift[(e + 1) % 4];
    hips.push(Array.from({ length: N + 1 }, (_, i) => pt(A_, B_, LA, LB, i / N, 0)));
    if (e === skip) continue;
    for (let i = 0; i < N; i++) {
      const up = [], dn = [];
      for (let j = 0; j < M; j++) {
        const a0 = pt(A_, B_, LA, LB, i / N, j / M), b0 = pt(A_, B_, LA, LB, i / N, (j + 1) / M), a1 = pt(A_, B_, LA, LB, (i + 1) / N, j / M), b1 = pt(A_, B_, LA, LB, (i + 1) / N, (j + 1) / M);
        _w.set(b0[0] - a0[0], b0[1] - a0[1], b0[2] - a0[2]).cross(new THREE.Vector3(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]));
        const q = _w.y >= 0 ? [a0, b0, b1, a0, b1, a1] : [a0, b1, b0, a0, a1, b1];
        up.push(...q.flat()); dn.push(...[q[0], q[2], q[1], q[3], q[5], q[4]].flat());
        if (i === 0) { const lo = q => [q[0], q[1] - 0.16, q[2]], f = [a0, b0, lo(b0), a0, lo(b0), lo(a0)]; b.push(geo(f), G.ridge); b.push(geo([f[0], f[2], f[1], f[3], f[5], f[4]]), G.ridge); }   // diềm gỗ mép mái
      }
      b.push(geo(up), i % 2 ? G.roof2 : G.roof); b.push(geo(dn), G.soffit);
    }
  }
  const tube = (pts, r) => b.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), pts.length * 3, r, 6), G.ridge);
  for (let e = 0; e < 4; e++) {
    if (!lift[e]) continue;
    const c = C4[e], h0 = hips[e][0], ox = Math.sign(c[0] - x0) * 0.3, oz = Math.sign(c[1] - z0) * 0.3;
    tube([[h0[0] + ox, h0[1] + 0.32, h0[2] + oz], [h0[0] + ox * 0.45, h0[1] + 0.1, h0[2] + oz * 0.45], ...hips[e].map(p => [p[0], p[1] + 0.08, p[2]])], 0.13);
  }
  const yr = y0 + h + 0.1; tube([[R0[0] - 0.55, yr + 0.36, z0], [R0[0] - 0.22, yr + 0.08, z0], [x0, yr, z0], [R1[0] + 0.22, yr + 0.08, z0], [R1[0] + 0.55, yr + 0.36, z0]], 0.17);
}
function geo(arr) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr.flat ? arr.flat() : arr, 3)); return g; }
// hình vòm (chữ nhật + bán nguyệt) cho khám/lòng vòm
function archShape(w, hs) { const s = new THREE.Shape(), r = w / 2; s.moveTo(-r, 0); s.lineTo(-r, hs); s.absarc(0, hs, r, Math.PI, 0, true); s.lineTo(r, 0); s.closePath(); return s; }
// biển tên chữ nổi: canvas 2048×1024 (2 hàng: tên trước, khẩu hiệu sau), chữ vàng có bóng đổ + viền sáng (khắc nổi)
function nameTexture(renderer) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const k = c.getContext('2d');
  const row = (y, text, size) => {
    const gr = k.createLinearGradient(0, y, 0, y + 512); gr.addColorStop(0, '#8a2431'); gr.addColorStop(1, '#5e1520');
    k.fillStyle = '#c99a45'; k.beginPath(); k.roundRect(0, y, 2048, 512, 60); k.fill();
    k.fillStyle = gr; k.beginPath(); k.roundRect(34, y + 34, 1980, 444, 40); k.fill();
    k.strokeStyle = '#e8c372'; k.lineWidth = 8; k.beginPath(); k.roundRect(62, y + 62, 1924, 388, 28); k.stroke();
    k.font = `bold ${size}px Georgia, "Times New Roman", "Noto Serif", serif`; k.textAlign = 'center'; k.textBaseline = 'middle';
    const cy = y + 262, mw = 1780;
    k.fillStyle = '#2a070c'; k.fillText(text, 1024 + 7, cy + 9, mw);
    k.fillStyle = '#fff1c2'; k.fillText(text, 1024 - 3, cy - 4, mw);
    const g2 = k.createLinearGradient(0, cy - size / 2, 0, cy + size / 2); g2.addColorStop(0, '#ffe7a3'); g2.addColorStop(0.55, '#e3b04f'); g2.addColorStop(1, '#b07a27');
    k.fillStyle = g2; k.fillText(text, 1024, cy, mw);
    for (const s of [-1, 1]) { k.fillStyle = '#e3b04f'; k.beginPath(); k.arc(1024 + s * 930, cy, 16, 0, Math.PI * 2); k.fill(); }
  };
  row(0, 'TRƯỜNG RUBIK', 250); row(512, 'HỌC · CHƠI · KHÁM PHÁ', 170);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8; return t;
}

function archGate({ ctx, scene, meshes, gx, gz, Y, rubikCube }) {
  const M = new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(gx, Y, gz).multiply(new THREE.Matrix4().makeTranslation(0, 0, Z0));
  const B = new Batch('gate-arch'), Dt = new Batch('gate-detail'), L = new Batch('gate-glow'); L.glowMode = true;   // L: sổ LIGHTS (quầng đèn đêm)
  for (const x of [B, Dt, L]) x.pre = M;
  const F = DEP / 2;   // mặt trước z = +F, mặt sau z = -F

  // ---- THÂN ĐÁ: 1 khối đùn bo cạnh, khoét vòm giữa (bậc cao giữa, hai cánh thấp) ----
  const bev = 0.14, sh = new THREE.Shape(), r0 = R - bev, xa = A / 2 - bev;
  sh.moveTo(-W / 2 + bev, 0); sh.lineTo(-xa, 0); sh.lineTo(-xa, HS); sh.absarc(0, HS, r0, Math.PI, 0, true); sh.lineTo(xa, 0); sh.lineTo(W / 2 - bev, 0);
  sh.lineTo(W / 2 - bev, HW - bev); sh.lineTo(XC - bev, HW - bev); sh.lineTo(XC - bev, HB - bev); sh.lineTo(-XC + bev, HB - bev); sh.lineTo(-XC + bev, HW - bev); sh.lineTo(-W / 2 + bev, HW - bev); sh.closePath();
  B.push(new THREE.ExtrudeGeometry(sh, { depth: DEP - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 28 }).translate(0, 0, -(DEP - 2 * bev) / 2), G.stone);

  for (const sz of [1, -1]) {   // mặt trước (sz=1) & sau (sz=-1)
    const fz = sz * F, out = sz > 0 ? 0 : Math.PI;
    // đế chân trụ bo tròn (chừa lòng vòm)
    for (const s of [-1, 1]) rbox(B, W / 2 - A / 2 + 0.3, PL, 0.9, s * (A / 2 + (W / 2 - A / 2) / 2 + 0.15), 0, fz + sz * 0.2, G.stone2, 0.14);
    // vòm giữa: gờ viền bán nguyệt + chỉ vàng + đá khoá
    B.push(new THREE.TorusGeometry(R + 0.2, 0.2, 8, 36, Math.PI), G.light, 0, HS, fz + sz * 0.02);
    Dt.push(new THREE.TorusGeometry(R + 0.47, 0.06, 4, 36, Math.PI), G.gold, 0, HS, fz + sz * 0.08);
    for (const s of [-1, 1]) { rbox(B, 0.5, 0.36, 0.42, s * (R + 0.2), HS - 0.36, fz, G.stone2, 0.1); rbox(B, 0.36, HS - 0.6, 0.18, s * (R + 0.2), 0.6, fz + sz * 0.02, G.light, 0.08); }   // đá chân vòm + gờ dọc
    B.push(new THREE.CylinderGeometry(0.42, 0.3, 0.86, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.6), G.light, 0, HS + R + 0.15, fz + sz * 0.12);   // đá khoá
    // cột rãnh: 2 cột lớn ở trụ giữa, 2 cột nhỏ ở trụ ngoài
    for (const s of [-1, 1]) { column(B, s * (A / 2 + P1 / 2), PL, fz + sz * 0.22, 0.34, ET - PL); column(B, s * (W / 2 - P2 / 2), PL, fz + sz * 0.2, 0.24, HW - 0.82 - PL); }
    // khám vòm hai bên (lõm giả: nền tối + gờ viền nổi) + huy chương phù điêu
    for (const s of [-1, 1]) {
      const nx = s * (XC + A2 / 2), nh = (HU * PHI ** 3) / PHI - A2 / 2;
      B.push(new THREE.ShapeGeometry(archShape(A2 - 0.5, nh - 0.6), 12), G.niche, nx, 0.6, fz + sz * 0.012, out);
      B.push(new THREE.TorusGeometry(A2 / 2 - 0.15, 0.14, 6, 24, Math.PI), G.light, nx, 0.6 + nh - 0.6, fz + sz * 0.03);
      for (const t of [-1, 1]) rbox(B, 0.24, nh - 0.6, 0.18, nx + t * (A2 / 2 - 0.15), 0.6, fz + sz * 0.03, G.light, 0.07);
      const my = 0.6 + (nh - 0.6) * 0.85, mz = fz + sz * 0.05;
      Dt.push(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 24).rotateX(Math.PI / 2), G.relief, nx, my, mz);
      Dt.push(new THREE.TorusGeometry(0.64, 0.07, 5, 24), G.gold, nx, my, mz + sz * 0.04);
      Dt.group(nx, my, mz + sz * 0.06, out, () => {
        if (s < 0) { for (const t of [-1, 1]) Dt.box(0.4, 0.52, 0.06, t * 0.2, -0.26, 0.06, G.light, -t * 0.35); Dt.box(0.05, 0.54, 0.05, 0, -0.27, 0.02, G.stone2); }   // sách mở
        else for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) rbox(Dt, 0.21, 0.21, 0.07, i * 0.25, j * 0.25 - 0.105, 0.02, (i + j) % 2 ? G.light : G.stone2, 0.03);   // khối Rubik khắc nổi
      });
      // vòng nguyệt quế dưới huy chương (lá dẹt theo đường cong)
      for (let i = 0; i <= 12; i++) { const t = i / 12, ang = Math.PI * (1.15 + 0.7 * t); Dt.push(new THREE.IcosahedronGeometry(0.1, 0), i % 2 ? G.relief : G.light, nx + Math.cos(ang) * 0.8, my + Math.sin(ang) * 0.8, mz, 0, 0, ang + Math.PI / 2 + (i % 2 ? 0.5 : -0.5), 1.7, 0.75, 0.45); }
    }
    // phù điêu lá nguyệt quế ở hai bên vòm (mi vòm)
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const t = i / 8, ang = Math.PI * (s > 0 ? 0.08 + 0.24 * t : 0.92 - 0.24 * t), rr = R + 0.85; Dt.push(new THREE.IcosahedronGeometry(0.12, 0), i % 2 ? G.relief : G.light, Math.cos(ang) * rr, HS + Math.sin(ang) * rr, fz + sz * 0.03, 0, 0, ang + Math.PI / 2 + (i % 2 ? 0.45 : -0.45), 1.8, 0.75, 0.45); }
    // gờ ngang: diềm cánh + đầu thân giữa, hàng răng cưa (dentil), gờ dưới biển tên
    for (const s of [-1, 1]) {
      const cx = s * (XC + (W / 2 - XC) / 2), cw = W / 2 - XC + 0.4;
      rbox(B, cw, 0.3, 0.34, cx, HW - 0.82, fz + sz * 0.1, G.stone2, 0.1);
      for (let x = -cw / 2 + 0.25; x < cw / 2 - 0.1; x += 0.36) Dt.box(0.18, 0.18, 0.12, cx + x, HW - 0.5, fz + sz * 0.1, G.light);
    }
    rbox(B, HB + 0.35, 0.32, 0.4, 0, ET, fz + sz * 0.1, G.stone2, 0.1);
    for (let x = -HB / 2 + 0.1; x < HB / 2; x += 0.38) Dt.box(0.2, 0.2, 0.14, x, ET + 0.32, fz + sz * 0.1, G.light);
    // khung biển tên vàng (bo) — chữ ở mesh riêng
    rbox(B, SW + 0.26, SH + 0.26, 0.2, 0, (ET + 0.52 + HB - 0.32) / 2 - SH / 2 - 0.13, fz + sz * 0.02, G.gold, 0.1);
    // dây leo + rêu ở chân trụ
    for (const s of [-1, 1]) for (const [x0, h0, n] of [[s * (W / 2 - 0.12), 3.0, 17], [s * (A / 2 + 0.05), 2.1, 11], [s * (XC + 0.1), 2.5, 14]]) {
      for (let k = 0; k < n; k++) { const y = 0.3 + k * h0 / n, x = x0 + Math.sin(k * 1.3 + x0) * 0.16, sc = 1 - k / n * 0.55; Dt.push(new THREE.IcosahedronGeometry(0.17 * sc, 0), k % 3 ? G.ivy : G.ivy2, x, y, fz + sz * 0.2, k, 0, 0, 1.3, 0.9, 0.6); }
    }
    for (let x = -W / 2 + 0.2; x < W / 2; x += 0.55) if (Math.abs(x) > A / 2 + 0.2 && Math.sin(x * 2.7) > -0.3) Dt.push(new THREE.IcosahedronGeometry(0.2, 0), (x * 7 | 0) % 2 ? G.moss : G.moss2, x, PL + 0.02, fz + sz * 0.55, x, 0, 0, 1.4, 0.35, 0.8);
    // đèn lồng đỏ hai bên vòm (giá sắt gắn trụ giữa)
    for (const s of [-1, 1]) {
      const lx = s * (XC + A2 / 2), ly = HW - 1.85, lz = fz + sz * 0.95;
      Dt.box(0.07, 0.07, 0.8, lx, ly + 1.0, fz + sz * 0.55, G.iron); Dt.box(0.03, 0.42, 0.03, lx, ly + 0.6, lz, G.iron);
      L.push(new THREE.SphereGeometry(0.34, 10, 6), G.red, lx, ly + 0.25, lz, 0, 0, 0, 1, 1.18, 1);
      L.push(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 10), G.glowR, lx, ly + 0.25, lz);
      Dt.cyl(0.2, 0.2, 0.07, lx, ly + 0.62, lz, G.gold, 10); Dt.cyl(0.2, 0.2, 0.07, lx, ly - 0.17, lz, G.gold, 10); Dt.cone(0.06, 0.3, lx, ly - 0.47, lz, G.red, 6);
    }
  }
  // biển tên chữ nổi (trước: TRƯỜNG RUBIK, sau: HỌC · CHƠI · KHÁM PHÁ)
  { const sw = SW, sy = (ET + 0.52 + HB - 0.32) / 2, g = [];
    for (const [sz, v0] of [[1, 0.5], [-1, 0]]) { const p = new THREE.PlaneGeometry(sw, SH), uv = p.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * 0.5); if (sz < 0) p.rotateY(Math.PI); p.translate(0, sy, sz * (F + 0.14)); g.push(p); }
    const m = new THREE.Mesh(mergeGeometries(g).applyMatrix4(M), new THREE.MeshToonMaterial({ map: nameTexture(ctx.renderer), gradientMap, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.name = 'gate-sign'; scene.add(m); meshes.push(m); }
  // mái cong: mái lớn thân giữa, 2 mái cánh (bỏ mái hồi sát thân giữa)
  rbox(B, HB + 0.5, 0.32, DEP + 0.55, 0, HB - 0.32, 0, G.stone2, 0.12);   // gờ mái
  for (const s of [-1, 1]) rbox(B, W / 2 - XC + 0.5, 0.3, DEP + 0.45, s * (XC + (W / 2 - XC) / 2 + 0.25), HW - 0.3, 0, G.stone2, 0.1);
  const ov = P2 / PHI;
  curvedRoof(B, 0, HB - 0.02, 0, HB / 2 + ov, F + ov, HU, [0.42, 0.42, 0.42, 0.42]);
  for (const s of [-1, 1]) { const cx = s * (XC + (W / 2 - XC) / 2), a = (W / 2 - XC) / 2 + ov * 0.8; curvedRoof(B, cx - s * 0.2, HW - 0.02, 0, a + 0.2, F + ov * 0.8, HU / PHI, s > 0 ? [0, 0.3, 0.3, 0] : [0.3, 0, 0, 0.3], s > 0 ? 3 : 1); }
  rubikCube(B, 0, HB + HU + 0.95, 0, 0.95, 0.6, true, true);   // khối Rubik đá quý trên nóc
  Dt.ball(0.16, 0, HB + HU + 0.2, 0, G.gold);
  // bậc thềm thoải hình quạt mở ra quảng trường (3 bậc thấp, bán kính theo φ); nền lòng vòm
  const ST = 0.1, RS3 = [A / 2 * PHI ** 2, A / 2 * PHI, A / 2 + 0.4];
  RS3.forEach((r, i) => { B.push(new THREE.CylinderGeometry(r, r + 0.06, ST, 48, 1, false, -Math.PI / 2, Math.PI), i % 2 ? G.stone2 : G.light, 0, ST * (i + 0.5), F - 0.02); });
  [A / 2 + 0.8, A / 2 + 0.4].forEach((r, i) => B.push(new THREE.CylinderGeometry(r, r + 0.06, ST, 40, 1, false, Math.PI / 2, Math.PI), i % 2 ? G.light : G.stone2, 0, ST * (i + 0.5), -F + 0.02));
  rbox(B, A + 0.1, ST * 3, DEP + 0.1, 0, 0, 0, G.light, 0.04);

  // ---- XUẤT: 5 draw call ----
  const mat = toon('#ffffff', { vertexColors: true });
  for (const g of B.geos) { const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { _w.fromBufferAttribute(p, i); const k = 0.78 + 0.22 * Math.min(1, Math.max(0, (_w.y - Y) / (HU * PHI))); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); } }   // AO giả chân tường
  const body = B.mesh(mat, true); body.name = 'gate-body';
  const ol = new THREE.Mesh(body.geometry, softOutline); ol.raycast = () => {}; ol.castShadow = false; body.add(ol);
  const det = Dt.mesh(mat, false); det.name = 'gate-detail';
  const gm = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }); GLOW_MATS.push(gm);
  const glow = L.mesh(gm, false); glow.name = 'gate-glow'; glow.receiveShadow = false;
  for (const m of [body, det, glow]) { scene.add(m); meshes.push(m); }

  // ---- VA CHẠM: chỉ trụ (lối giữa mở hoàn toàn) + bậc thềm bước lên được ----
  const wb = (lx0, lx1, lz0, lz1, top) => { const p = [[lx0, lz0], [lx1, lz1]].map(([x, z]) => _w.set(x, 0, z).applyMatrix4(M).clone()); ctx.boxes.push({ x0: Math.min(p[0].x, p[1].x), x1: Math.max(p[0].x, p[1].x), z0: Math.min(p[0].z, p[1].z), z1: Math.max(p[0].z, p[1].z), top }); };
  for (const s of [-1, 1]) wb(s * (A / 2 + 0.05), s * (W / 2 + 0.15), -F - 0.7, F + 0.7, Y + HB);
  RS3.forEach((r, i) => wb(-r * 0.8, r * 0.8, F, F + r * 0.6, Y + ST * (i + 1)));
  wb(-A / 2, A / 2, -F, F, Y + ST * 3); wb(-A / 2, A / 2, -F - 1.0, -F, Y + ST * 2); wb(-A / 2 - 0.3, A / 2 + 0.3, -F - 2.4, -F - 1.0, Y + ST);
  return { tris: Math.round(B.tris + Dt.tris + L.tris) };
}
