// zone-zen.js — RỪNG THIỀN quanh Đền Tri Thức (khu I): rừng tre lay gió, phong lá đỏ, thông; lối đá rêu uốn lượn có bậc,
// đèn đá tōrō, cổng gỗ (không rào), suối + thác thấp + hồ sen có cầu cong đỏ, vườn đá cát cào, đình mái cong có chuông gió,
// chuông đồng (E: rung), 5 chỗ ngồi thiền (E: câu nói hay + hơi thở), sương mỏng, đom đóm, lá rơi.
// Toạ độ thiết kế: (u, v) trong khung của đền (gốc TEMPLE_C, +v hướng về Trường Rubik, xoay π/4 giống temple.js).
// Tỷ lệ vàng: tre mọc theo xoắn ốc hướng dương (góc vàng 137,5°), khoảng cách đèn/bậc/cụm theo Fibonacci, mái đình cao = cột/φ.
// Hiệu năng: tre = InstancedMesh chia ô 34 m (chỉ bật trong ~60 m), chi tiết nhỏ = DetailGrid, nước = 1 mesh shader,
// sương + hơi thở = 1 InstancedMesh billboard, đom đóm = 1 Points; phong/thông/đá dùng chung InstancedMesh của terrain (0 draw call thêm).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, addOutline } from './style.js';
import { TEMPLE_C, PHI, FIB, blocked } from './layout.js';
import { Batch, DetailGrid, detailMats } from './decor.js';
import { NATURE } from './terrain.js';

const ROT = Math.PI / 4, CR = Math.cos(ROT), SR = Math.sin(ROT), [TX, TZ] = TEMPLE_C;
const GOLD = Math.PI * (3 - Math.sqrt(5));            // góc vàng ≈ 137,5°
const W = (u, v) => [TX + u * CR + v * SR, TZ - u * SR + v * CR];       // (u,v) → thế giới
const L = (x, z) => { const dx = x - TX, dz = z - TZ; return [dx * CR - dz * SR, dx * SR + dz * CR]; };   // thế giới → (u,v)
const FRAME = new THREE.Matrix4().makeRotationY(ROT).setPosition(TX, 0, TZ);

// ---------- Bố cục (u, v) ----------
// Địa hình: sân đền phẳng (cao 3 m) trong bán kính 14 m, đồi tây (~10 m), đồi đông (~7 m), phía sau đền dốc xuống biển.
const PATH = [[-5, 13], [-10, 13.5], [-15, 13], [-20, 16], [-26, 20], [-33, 19], [-36, 12], [-33, 4], [-30, -1], [-25, -8], [-19, -13], [-12, -18], [-5, -19],
  [0, -17.5], [6, -18], [13, -17], [19, -13], [22, -7], [21, -2], [20, 3], [16, 8], [10, 12], [5, 13]];   // lối đá vòng quanh đền: đồi tây → sau đền → đồi đông
const SPURS = [[[13, 2.5], [14, 5], [16, 8]], [[13, -14.5], [13, -16.8]]];   // 2 nhánh nối 2 đầu cầu với lối chính
const POND = { u: 13, v: -6, ru: 4.6, rv: 7 };                                // hồ sen trên bãi phẳng phía đông đền (7/4,6 ≈ φ − 0,1)
const BRIDGE = [[13, -14], [13, 2]];                                          // cầu cong bắc qua hồ theo chiều dài
const STREAM = [[25.5, -2], [22.5, -3], [19.5, -3.5], [17, -4]];              // suối từ chân thác trên đồi đông chảy xuống hồ
const FALL = { u: 27, v: -1.6, h: 2 };                                        // thác thấp (cao 2 m — Fibonacci)
const GARDEN = { u: -12.5, v: 4, r: 5 };                                      // vườn đá cát cào (bán kính 5 — Fibonacci), phủ theo mặt đất
const PAV = { u: -30, v: 15, r: 3.2 };                                        // đình nghỉ lục giác trên đỉnh đồi tây (ngắm biển)
const BELL = { u: -11, v: -13 };                                              // chuông đồng sau đền
const BANYAN = L(-150, -126);                                                 // cây đa (easter-eggs.js) — chừa chỗ
const SEATS = [   // 5 chỗ ngồi thiền: [u, v, hướng nhìn tới (u, v)]
  [-12.5, 10.5, -12.5, 4], [-30, 15, -40, 20], [0, -21, 0, -40], [24, -6.5, 25.5, -2], [9, -14, 13, -6]];
const QUOTES = [
  'Có công mài sắt, có ngày nên kim.',
  'Nước chảy đá mòn — kiên nhẫn từng chút sẽ làm nên điều lớn.',
  'Cây tre vươn cao nhờ từng đốt nhỏ. Kiến thức cũng lớn lên từng ngày như thế.',
  'Sai không đáng sợ. Đáng sợ là không dám thử lại.',
  'Không có việc gì khó, chỉ sợ lòng không bền.',
  'Mỗi ngày tiến bộ một chút, một năm em sẽ đi rất xa.',
  'Hít thở thật sâu — bình tĩnh giúp em nghĩ ra lời giải.',
  'Muốn biết phải hỏi, muốn giỏi phải học.',
  'Đọc một trang sách mỗi ngày là gieo một hạt giống tốt.',
  'Đi một ngày đàng, học một sàng khôn.',
  'Lắng nghe nhiều hơn, em sẽ hiểu nhiều hơn.',
  'Thất bại là mẹ thành công.',
  'Hôm nay cố gắng hơn hôm qua một chút là đã giỏi rồi.',
];

// đường cong mượt qua các điểm (u,v) → mảng điểm cách đều ~step m
function curve(pts, step) {
  const c = new THREE.CatmullRomCurve3(pts.map(([u, v]) => new THREE.Vector3(u, 0, v)), false, 'centripetal');
  const n = Math.max(2, Math.round(c.getLength() / step));
  return c.getSpacedPoints(n).map(p => [p.x, p.z]);
}
const segDist = (pts, u, v) => { let d = 1e9; for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((u - ax) * dx + (v - az) * dz) / l2)); d = Math.min(d, Math.hypot(u - ax - dx * t, v - az - dz * t)); } return d; };

export function buildZen({ ctx, low = false }) {
  const { scene, terrain } = ctx, Hw = (x, z) => terrain.heightAt(x, z), H = (u, v) => Hw(...W(u, v));
  let seed = 233; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const root = new THREE.Group(); root.name = 'zen'; scene.add(root);
  const budget = {}, B = new Batch('zen'), G = new Batch('zen-ground'), DG = new DetailGrid('zen-detail', 34);
  const mine = c => { c.zen = 1; ctx.colliders.push(c); };
  const colAt = (u, v, r) => { const [x, z] = W(u, v); mine({ x, z, r }); };
  const measure = (name, fn) => { const t0 = B.tris + G.tris + DG.tris; fn(); budget[name] = Math.round(B.tris + G.tris + DG.tris - t0); };
  const inFrame = fn => { B.group(TX, 0, TZ, ROT, fn); };
  const inFrameDG = fn => DG.group(TX, 0, TZ, ROT, fn);
  const inFrameG = fn => G.group(TX, 0, TZ, ROT, fn);
  const path = curve([...PATH], 0.5), spurs = SPURS.map(p => curve(p, 0.5)), stream = curve(STREAM, 0.5);

  // vùng chừa trống (không trồng tre/cây, dọn cây tự nhiên trùng lối đi)
  function zenBlocked(u, v, m = 0) {
    if (((u - POND.u) / (POND.ru + 1 + m)) ** 2 + ((v - POND.v) / (POND.rv + 1 + m)) ** 2 < 1) return true;
    if (Math.hypot(u - GARDEN.u, v - GARDEN.v) < GARDEN.r + 1 + m) return true;
    if (Math.hypot(u - PAV.u, v - PAV.v) < PAV.r + 1 + m) return true;
    if (Math.hypot(u - BELL.u, v - BELL.v) < 2.2 + m) return true;
    if (Math.hypot(u - FALL.u, v - FALL.v) < 3.2 + m) return true;
    for (const s of SEATS) if (Math.hypot(u - s[0], v - s[1]) < 1.6 + m) return true;
    return segDist(path, u, v) < 1.3 + m || spurs.some(p => segDist(p, u, v) < 1.3 + m) || segDist(BRIDGE, u, v) < 1.2 + m || segDist(stream, u, v) < 1.2 + m;
  }

  // ================= LỐI ĐÁ RÊU (bậc theo Fibonacci) =================
  const stones = [];   // [u, y0, v, r, dày, ry, màu]
  measure('lối đá', () => {
    const SZ = [1, 1 / Math.sqrt(PHI), Math.sqrt(PHI)], walk = (pts, k0) => {
      let acc = 0, prevY = null, k = k0;
      for (let i = 1; i < pts.length; i++) {
        acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        const gap = 0.55 + 0.21 * SZ[k % 3]; if (acc < gap) continue; acc = 0; k++;
        const [u, v] = pts[i], tu = pts[Math.min(i + 1, pts.length - 1)][0] - pts[i - 1][0], tv = pts[Math.min(i + 1, pts.length - 1)][1] - pts[i - 1][1], tl = Math.hypot(tu, tv) || 1;
        const side = (k % 2 ? 1 : -1) * 0.22, su = u - tv / tl * side, sv = v + tu / tl * side, y = H(su, sv);
        if (POND.ru && ((su - POND.u) / POND.ru) ** 2 + ((sv - POND.v) / POND.rv) ** 2 < 1.05) continue;   // không lát đá trong hồ (đi qua cầu)
        const step = prevY !== null && Math.abs(y - prevY) > 0.21;   // dốc → bậc đá dày hơn
        const moss = FIB.includes(k % 21);                           // đá rêu ở vị trí Fibonacci
        stones.push([su, step ? Math.min(y, prevY) - 0.05 : y - 0.06, sv, 0.42 * SZ[k % 3], step ? Math.abs(y - prevY) + 0.16 : 0.16, Math.atan2(tu, tv), moss ? '#8fae6a' : ['#b7b0a2', '#a9a297', '#c4bcae'][k % 3], step]);
        prevY = y;
      }
    };
    walk(path, 0); spurs.forEach((p, i) => walk(p, 5 + i));
    // đá cuội băng qua suối (bước đá)
    for (const s of stones) if (segDist(stream, s[0], s[2]) < 0.9) { s[4] += 0.12; s[6] = '#9aa58a'; }
    budget._stones = stones.length;
  });
  const stoneIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 0.9, 1, 7).translate(0, 0.5, 0), toon('#ffffff'), stones.length);
  { const o = new THREE.Object3D(), c = new THREE.Color();
    stones.forEach(([u, y, v, r, h, ry, col, step], i) => { const [x, z] = W(u, v); o.position.set(x, y, z); o.rotation.set(0, ry + ROT, 0); o.scale.set(step ? r * 1.25 : r, h, r * (step ? 0.75 : 0.85)); o.updateMatrix(); stoneIM.setMatrixAt(i, o.matrix); stoneIM.setColorAt(i, c.set(col)); });
    stoneIM.receiveShadow = true; stoneIM.castShadow = false; stoneIM.computeBoundingSphere(); stoneIM.name = 'zen-stones'; root.add(stoneIM); }

  // ================= ĐÈN ĐÁ TŌRŌ (cách nhau 13 m — Fibonacci) =================
  const lanterns = [];
  { let acc = 0, k = 0; const all = path;
    for (let i = 1; i < all.length; i++) { acc += Math.hypot(all[i][0] - all[i - 1][0], all[i][1] - all[i - 1][1]); if (acc < 13 || i > all.length - 4) continue; acc = 0; k++;
      const [u, v] = all[i], tu = all[i + 1][0] - all[i - 1][0], tv = all[i + 1][1] - all[i - 1][1], tl = Math.hypot(tu, tv) || 1, s = (k % 2 ? 1.5 : -1.5);
      const lu = u - tv / tl * s, lv = v + tu / tl * s; if (((lu - POND.u) / POND.ru) ** 2 + ((lv - POND.v) / POND.rv) ** 2 < 1.2) continue; lanterns.push([lu, lv]); }
    lanterns.push([BRIDGE[0][0] - 1.6, BRIDGE[0][1] - 1], [BRIDGE[1][0] - 1.6, BRIDGE[1][1] + 1]); }
  measure('đèn tōrō', () => inFrameDG(() => {
    const st = '#c9c2b2', st2 = '#b3ab9b';
    for (const [u, v] of lanterns) {
      const y = H(u, v) - 0.05;
      DG.cyl(0.3, 0.36, 0.18, u, y, v, st2, 6); DG.cyl(0.11, 0.13, 0.62, u, y + 0.18, v, st, 6); DG.cyl(0.3, 0.26, 0.1, u, y + 0.8, v, st2, 6);
      DG.glow(() => DG.box(0.3, 0.28, 0.3, u, y + 0.9, v, '#ffd36e', Math.PI / 4));
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) DG.box(a ? 0.06 : 0.36, 0.3, b ? 0.06 : 0.36, u + a * 0.17, y + 0.89, v + b * 0.17, st);
      DG.cone(0.45, 0.3, u, y + 1.18, v, st2, 6); DG.ball(0.09, u, y + 1.55, v, st);
      colAt(u, v, 0.35);
    }
  }));

  // ================= CỔNG GỖ ĐƠN GIẢN (không rào) =================
  measure('cổng gỗ', () => {
    for (const [pts, i] of [[path, 9], [path, path.length - 10]]) {
      const [u, v] = pts[i], [au, av] = pts[i - 2], [bu, bv] = pts[i + 2], ry = Math.atan2(bu - au, bv - av) + Math.PI / 2, y = H(u, v) - 0.1, wood = '#8a5a34', dark = '#6e4428';
      inFrame(() => B.group(u, 0, v, ry, () => {
        for (const s of [-1, 1]) { B.cyl(0.15, 0.18, 3.4, 0, y, s * 1.6, wood, 7); B.cyl(0.24, 0.24, 0.3, 0, y, s * 1.6, '#b3ab9b', 7); }
        B.box(0.2, 0.2, 3.9, 0, y + 2.55, 0, dark);
        for (const s of [-1, 1]) B.box(0.3, 0.24, 2.6, 0, y + 3.32 + 0.06, s * 1.15, wood, 0, -s * 0.07);   // xà trên hơi cong lên 2 đầu
        B.box(0.12, 0.5, 0.3, 0, y + 2.75, 0, dark);
      }));
      for (const s of [-1, 1]) { const ca = Math.cos(ry), sa = Math.sin(ry); colAt(u + s * 1.6 * sa, v + s * 1.6 * ca, 0.3); }
    }
  });

  // ================= VƯỜN ĐÁ CÁT CÀO (vòng đồng tâm quanh tảng đá) — cát phủ theo mặt đất, không xây bệ =================
  const drape = (g, off) => { g = g.toNonIndexed(); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)) + off); return g; };
  measure('vườn đá cát', () => {
    const { u, v, r } = GARDEN, hy = (du, dv) => H(u + du, v + dv);
    inFrameG(() => {
      G.push(drape(new THREE.RingGeometry(0.01, r, 28, 5).rotateX(-Math.PI / 2).translate(u, 0, v), 0.13), '#efe4cc');
      const ring = (cu, cv, rr) => G.push(drape(new THREE.RingGeometry(rr - 0.045, rr + 0.045, Math.max(12, Math.round(rr * 6))).rotateX(-Math.PI / 2).translate(cu, 0, cv), 0.145), '#d6c6a4');
      for (let k = 1; k <= 8; k++) { const rr = 1.3 + k * 0.42; if (rr < r - 0.25) ring(u, v, rr); }
      for (const [du, dv, sc] of [[-r * 0.5, r * 0.32, 0.62], [r * 0.38, -r * 0.45, 0.38]]) for (let k = 1; k <= 3; k++) ring(u + du, v + dv, sc * 1.2 + k * 0.3);
    });
    inFrame(() => {   // 3 tảng đá: cỡ giảm theo φ
      B.push(new THREE.DodecahedronGeometry(1, 0), '#9e978a', u, hy(0, 0) + 0.35, v, 0.4, 0.2, 0, 1.1, 0.75, 0.9);
      B.push(new THREE.DodecahedronGeometry(1 / PHI, 0), '#8f8a7e', u - r * 0.5, hy(-r * 0.5, r * 0.32) + 0.22, v + r * 0.32, 1.2, 0.1, 0, 1, 0.8, 1.1);
      B.push(new THREE.DodecahedronGeometry(1 / PHI / PHI, 0), '#a9a297', u + r * 0.38, hy(r * 0.38, -r * 0.45) + 0.14, v - r * 0.45, 2.1, 0, 0.2, 1, 0.75, 1);
      for (let a = 0; a < Math.PI * 2; a += 0.42) { const du = Math.cos(a) * (r + 0.15), dv = Math.sin(a) * (r + 0.15); B.ball(0.26, u + du, hy(du, dv) + 0.06, v + dv, a % 0.84 < 0.42 ? '#a9a297' : '#8fae6a', 1.3, 0.55, 1); }
    });
    for (const [du, dv, sc] of [[0, 0, 1.1], [-r * 0.5, r * 0.32, 0.7]]) colAt(u + du, v + dv, sc);
  });

  // ================= ĐÌNH NGHỈ LỤC GIÁC MÁI CONG + CHUÔNG GIÓ =================
  const pavY = (() => { let m = -1e9, n = 1e9; for (let a = 0; a < 6.28; a += 0.7) { const h = H(PAV.u + Math.cos(a) * PAV.r, PAV.v + Math.sin(a) * PAV.r); m = Math.max(m, h); n = Math.min(n, h); } return { top: Math.max(m, H(PAV.u, PAV.v)) + 0.35, low: n }; })();
  const roofGeo = (R, h, up) => {   // mái lục giác cong: mặt lõm (y = h·s^1,6), góc mái vểnh lên
    const g = new THREE.ConeGeometry(R, h, 12, 4, true).toNonIndexed(), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i), s = Math.min(1, Math.max(0, (y + h / 2) / h)), a = Math.atan2(z, x), rr = Math.hypot(x, z);
      const seg = ((a % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3), hex = Math.cos(Math.PI / 6) / Math.cos(seg - Math.PI / 6);   // ép về hình lục giác
      const corner = Math.pow(Math.abs(Math.cos(3 * a)), 6) * (1 - s);   // gần góc → vểnh
      p.setXYZ(i, x * hex * (1 + corner * 0.12), h * Math.pow(s, 1.6) - h / 2 + corner * up, z * hex * (1 + corner * 0.12)); void rr;
    }
    g.computeVertexNormals(); return g;
  };
  const chimeAt = W(PAV.u, PAV.v + PAV.r * 0.86);
  measure('đình nghỉ', () => {
    const { u, v, r } = PAV, y = pavY.top, post = 2.6, roofH = post / PHI;   // mái cao = cột/φ
    inFrame(() => {
      B.cyl(r + 0.2, r + 0.35, y - pavY.low + 0.3, u, pavY.low - 0.3, v, '#b3ab9b', 6);
      B.cyl(r, r, 0.08, u, y - 0.04, v, '#b9824f', 6);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6, pu = u + Math.cos(a) * (r - 0.4), pv = v + Math.sin(a) * (r - 0.4); B.cyl(0.13, 0.15, post, pu, y, pv, '#b5452f', 7); B.cyl(0.2, 0.2, 0.14, pu, y, pv, '#8f8676', 7); }
      for (let i = 0; i < 6; i++) { const a0 = i * Math.PI / 3 + Math.PI / 6, a1 = a0 + Math.PI / 3, ru = r - 0.4; const mu = u + (Math.cos(a0) + Math.cos(a1)) / 2 * ru, mv = v + (Math.sin(a0) + Math.sin(a1)) / 2 * ru; B.box(0.16, 0.22, ru, mu, y + post - 0.25, mv, '#8a3a26', -(a0 + a1) / 2); }
      B.push(roofGeo(r + 1.1, roofH, 0.42), '#9c4a33', u, y + post + roofH / 2 - 0.05, v, Math.PI / 6);
      B.push(roofGeo(1.0, 0.7, 0.18), '#9c4a33', u, y + post + roofH + 0.18, v, Math.PI / 6);
      B.cyl(r + 1.0, r + 1.0, 0.1, u, y + post - 0.06, v, '#8a3a26', 6, Math.PI / 6); B.cyl(0.95, 0.95, 0.08, u, y + post + roofH + 0.02, v, '#8a3a26', 6, Math.PI / 6);   // trần che mặt dưới mái
      B.cyl(0.55, 0.55, 0.3, u, y + post + roofH - 0.25, v, '#8a3a26', 6);
      B.ball(0.16, u, y + post + roofH + 0.62, v, '#f2c14e');
      B.cyl(0.42, 0.48, 0.38, u + 1.4, y, v + 1.2, '#8f8676', 7); B.cyl(0.42, 0.48, 0.38, u - 1.2, y, v - 1.4, '#8f8676', 7);   // đôn đá ngồi
    });
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; colAt(u + Math.cos(a) * (r - 0.4), v + Math.sin(a) * (r - 0.4), 0.3); }
    const [x, z] = W(u, v); for (const [hx, hz] of [[0.92, 0.38], [0.38, 0.92], [0.7, 0.7]]) ctx.decks.push({ x0: x - r * hx, x1: x + r * hx, z0: z - r * hz, z1: z + r * hz, y });
  });
  // chuông gió: 5 ống dài theo Fibonacci, treo dưới mái — lắc nhẹ theo gió
  const chimes = new THREE.Group(); chimes.position.set(chimeAt[0], pavY.top + 2.6 - 0.1, chimeAt[1]); root.add(chimes);
  { const cb = new Batch('chime'); cb.cyl(0.2, 0.2, 0.04, 0, -0.04, 0, '#8a5a34', 8);
    [3, 5, 8, 13, 21].forEach((f, i) => { const a = i * Math.PI * 2 / 5, l = 0.12 + f * 0.022; cb.cyl(0.003, 0.003, 0.12, Math.cos(a) * 0.14, -0.16, Math.sin(a) * 0.14, '#5a4632', 3); cb.cyl(0.028, 0.028, l, Math.cos(a) * 0.14, -0.16 - l, Math.sin(a) * 0.14, '#d9c27a', 6); });
    cb.cyl(0.07, 0.07, 0.02, 0, -0.42, 0, '#8a5a34', 6); cb.box(0.1, 0.16, 0.005, 0, -0.62, 0, '#e8453c');
    const m = cb.mesh(toon('#ffffff', { vertexColors: true }), false); chimes.add(m); budget['chuông gió'] = Math.round(cb.tris); }

  // ================= CHUÔNG ĐỒNG (E: rung) =================
  const bellY = H(BELL.u, BELL.v) - 0.05, [bellX, bellZ] = W(BELL.u, BELL.v);
  measure('tháp chuông', () => inFrame(() => B.group(BELL.u, 0, BELL.v, 0, () => {
    const y = bellY;
    B.box(2.6, 0.2, 1.4, 0, y, 0, '#b3ab9b');
    for (const s of [-1, 1]) { B.cyl(0.12, 0.14, 3.2, s * 1.1, y + 0.2, 0, '#8a5a34', 7); }
    B.box(2.8, 0.2, 0.22, 0, y + 3.1, 0, '#6e4428');
    B.prism(3.1, 0.62, 1.5, 0, y + 3.3, 0, '#9c4a33');
  })));
  const bellPivot = new THREE.Group(); bellPivot.position.set(bellX, bellY + 3.05, bellZ); bellPivot.rotation.order = 'YXZ'; bellPivot.rotation.y = ROT; root.add(bellPivot);
  { const prof = [[0, 0], [0.42, 0], [0.46, 0.08], [0.4, 0.3], [0.33, 0.7], [0.3, 0.95], [0.22, 1.05], [0, 1.08]].map(([x, y]) => new THREE.Vector2(x, y));
    const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 10), toon('#b8873a', { side: THREE.DoubleSide })); bell.position.y = -1.2; bell.castShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 4, 8), toon('#6e4428')); ring.position.y = -0.1; bellPivot.add(bell, ring); addOutline(bell);
    budget['chuông đồng'] = 10 * 7 * 2; }
  for (const s of [-1, 1]) colAt(BELL.u + s * 1.1, BELL.v, 0.3);

  // ================= SUỐI + THÁC + HỒ SEN + CẦU CONG ĐỎ =================
  const pondY = (() => { let m = 1e9; for (let a = 0; a < 6.28; a += 0.3) m = Math.min(m, H(POND.u + Math.cos(a) * POND.ru, POND.v + Math.sin(a) * POND.rv)); return Math.max(m, H(POND.u, POND.v)) + 0.22; })();   // mép đất cao hơn tự thành bờ
  const pondLow = (() => { let n = 1e9; for (let a = 0; a < 6.28; a += 0.3) n = Math.min(n, H(POND.u + Math.cos(a) * POND.ru, POND.v + Math.sin(a) * POND.rv)); return n; })();
  // mực nước suối: không thấp hơn đất, luôn chảy xuống phía hồ
  const sY = new Array(stream.length); for (let i = stream.length - 1; i >= 0; i--) sY[i] = Math.max(H(...stream[i]) + 0.1, i === stream.length - 1 ? pondY : sY[i + 1]);
  const fallTop = sY[0] + FALL.h;
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uDeep: { value: new THREE.Color('#2f8c9a') }, uShallow: { value: new THREE.Color('#5fc8bd') } }]),
    vertexShader: `attribute float aFlow; varying vec2 vUv; varying float vFlow; #include <fog_pars_vertex>
      void main(){ vUv = uv; vFlow = aFlow; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; #include <fog_vertex> }`.replace(/#include <(\w+)>/g, '\n#include <$1>\n'),
    fragmentShader: `uniform float uTime; uniform vec3 uDeep, uShallow; varying vec2 vUv; varying float vFlow; #include <fog_pars_fragment>
      void main(){
        float f = vFlow, still = 1. - step(0.01, f);
        float n = sin(vUv.x * 9. + sin(vUv.y * 1.7) * 2.) * 0.5;
        float s = sin((vUv.y - uTime * (0.6 + f * 1.4)) * 5.6 + n * 2.);
        float streak = smoothstep(0.7, 1., s) * (0.2 + 0.45 * min(f, 1.)) * (1. - still);
        float r = length(vUv - 0.5) * 2.;
        float ring = smoothstep(0.82, 1., sin(r * 17. - uTime * 1.3)) * still * 0.18 * (1. - r);
        float edge = smoothstep(0.35, 0.5, abs(vUv.x - 0.5)) * (1. - still) * 0.25;
        vec3 col = mix(uDeep, uShallow, 0.45 + 0.25 * sin(vUv.x * 3. + uTime * 0.3) + 0.3 * still * r);
        float foam = step(1.5, f) * (0.35 + 0.4 * smoothstep(0.3, 1., sin((vUv.y - uTime * 3.2) * 9. + n * 3.)));
        col = mix(col, vec3(0.96, 1., 1.), clamp(streak + ring + edge + foam, 0., 1.));
        gl_FragColor = vec4(col, 0.8 + 0.15 * (streak + foam));
        #include <fog_fragment>
      }`.replace(/#include <(\w+)>/g, '\n#include <$1>\n'),
  });
  measure('suối, thác, hồ sen', () => {
    const geos = [], put = (g, flow) => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); g.setAttribute('aFlow', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(flow), 1)); g.applyMatrix4(FRAME); geos.push(g); };
    // hồ: elip
    put(new THREE.CircleGeometry(1, 36).rotateX(-Math.PI / 2).scale(POND.ru, 1, POND.rv).translate(POND.u, pondY, POND.v), 0);
    // suối: dải nước theo đường cong, rộng 1,3 m (thu hẹp ở đầu nguồn)
    { const P = [], UV = []; let d = 0;
      for (let i = 1; i < stream.length; i++) {
        const q = [stream[i - 1], stream[i]], ys = [sY[i - 1], sY[i]], seg = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]);
        const tang = j => { const a = stream[Math.max(0, i - 1 + j - 1)], b = stream[Math.min(stream.length - 1, i - 1 + j + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l]; };
        const wv = j => 0.45 + 0.2 * Math.min(1, (i - 1 + j) / 8);
        const pt = (j, s) => { const [nu, nv] = tang(j), w = wv(j) * s; return [q[j][0] + nu * w, ys[j], q[j][1] + nv * w]; };
        const a = pt(0, -1), b = pt(0, 1), c = pt(1, -1), e = pt(1, 1), d1 = d + seg;
        P.push(...a, ...c, ...b, ...b, ...c, ...e); UV.push(0, d / 2, 0, d1 / 2, 1, d / 2, 1, d / 2, 0, d1 / 2, 1, d1 / 2); d = d1;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); put(g, 1);
    }
    // thác: tấm nước dựng đứng, hơi cong
    { const [u0, v0] = stream[0], [u1, v1] = stream[2], l = Math.hypot(u1 - u0, v1 - v0), du = (u1 - u0) / l, dv = (v1 - v0) / l;
      const g = new THREE.PlaneGeometry(1.0, FALL.h + 0.1, 1, 4), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), s = (y + (FALL.h + 0.1) / 2) / (FALL.h + 0.1); p.setXYZ(i, x, y, (1 - s) * (1 - s) * 0.5); }
      g.rotateY(Math.atan2(du, dv)).translate(u0 - du * 0.25, sY[0] + (FALL.h + 0.1) / 2 - 0.05, v0 - dv * 0.25); g.computeVertexNormals(); put(g, 2.5);
      // vũng bọt chân thác
      put(new THREE.CircleGeometry(0.9, 12).rotateX(-Math.PI / 2).translate(u0, sY[0] + 0.03, v0), 2.5);
    }
    const wm = new THREE.Mesh(mergeGeometries(geos), waterMat); wm.name = 'zen-water'; wm.renderOrder = 2; root.add(wm);
    budget._water = Math.round(wm.geometry.attributes.position.count / 3);
    // bờ hồ (vách đá thấp), đáy hồ, gờ thác
    inFrame(() => {
      B.push(new THREE.CylinderGeometry(1, 1, 1, 36, 1, true), '#a9a297', POND.u, (pondY + 0.1 + pondLow - 0.4) / 2, POND.v, 0, 0, 0, POND.ru + 0.05, pondY + 0.1 - pondLow + 0.4, POND.rv + 0.05);
      const [u0, v0] = stream[0], [u1, v1] = stream[2], l = Math.hypot(u1 - u0, v1 - v0), du = (u1 - u0) / l, dv = (v1 - v0) / l, ry = Math.atan2(du, dv);
      B.box(2.6, 0.35, 1.4, u0 - du * 0.9, fallTop - 0.3, v0 - dv * 0.9, '#8f8a7e', ry);
      B.box(3.4, fallTop - sY[0] + 0.4, 1.6, u0 - du * 1.5, sY[0] - 0.4, v0 - dv * 1.5, '#9e978a', ry);
    });
    inFrameG(() => G.push(new THREE.CircleGeometry(1, 30).rotateX(-Math.PI / 2), '#3d7f7a', POND.u, pondY - 0.38, POND.v, 0, 0, 0, POND.ru, 1, POND.rv));
    // đá cuội + rêu ven suối và quanh hồ, lá sen + hoa sen
    inFrameDG(() => {
      for (let i = 2; i < stream.length; i += 3) for (const s of [-1, 1]) { const [u, v] = stream[i], [a, b] = stream[Math.min(i + 1, stream.length - 1)], tl = Math.hypot(a - u, b - v) || 1, w = 0.75 + rnd() * 0.25; DG.ball(0.16 + rnd() * 0.12, u + (b - v) / tl * w * s, sY[i] - 0.02, v - (a - u) / tl * w * s, rnd() < 0.38 ? '#8fae6a' : '#b7b0a2', 1.2, 0.6, 1); }
      for (let a = 0; a < 6.28; a += 0.55) { const ru = POND.ru + 0.25, rv = POND.rv + 0.25; DG.ball(0.24 + rnd() * 0.14, POND.u + Math.cos(a) * ru, pondY + 0.06, POND.v + Math.sin(a) * rv, rnd() < 0.4 ? '#7fa65a' : '#a9a297', 1.3, 0.55, 1); }
      for (let k = 0; k < 21; k++) {   // lá sen theo xoắn ốc vàng trong hồ
        const r = Math.sqrt((k + 0.5) / 21), a = k * GOLD, u = POND.u + Math.cos(a) * r * (POND.ru - 1), v = POND.v + Math.sin(a) * r * (POND.rv - 1);
        if (segDist(BRIDGE, u, v) < 1.3) continue;
        const s = 0.35 + rnd() * 0.3; DG.cyl(s, s, 0.03, u, pondY + 0.02, v, k % 3 ? '#4f9a3a' : '#5faa4e', 8);
        if (k % 3 === 0) { DG.cone(0.16, 0.3, u, pondY + 0.05, v, '#f6a6c0', 5); DG.cone(0.1, 0.34, u, pondY + 0.08, v, '#ffd1e0', 5, 0.6); DG.ball(0.05, u, pondY + 0.3, v, '#f5c518'); }
      }
    });
    // va chạm quanh hồ (chừa 2 đầu cầu)
    for (let a = 0; a < 6.28; a += 0.16) { const u = POND.u + Math.cos(a) * POND.ru, v = POND.v + Math.sin(a) * POND.rv; if (BRIDGE.some(([bu, bv]) => Math.hypot(u - bu, v - bv) < 1.4)) continue; colAt(u, v, 0.45); }
  });
  // cầu cong đỏ (vòm) — đi được nhờ ctx.decks
  measure('cầu cong đỏ', () => {
    const [[ua, va], [ub, vb]] = BRIDGE, span = Math.hypot(ub - ua, vb - va), du = (ub - ua) / span, dv = (vb - va) / span, nu = -dv, nv = du, ry = Math.atan2(-dv, du);
    const ya = H(ua, va) + 0.12, yb = H(ub, vb) + 0.12, N = 13, wHalf = 0.8;
    const rise = Math.max(span / Math.pow(PHI, 5), pondY + 0.6 - (ya + yb) / 2);   // vòm cao = nhịp/φ⁵ ≈ 1,4 m
    const Y = t => ya + (yb - ya) * t + rise * Math.sin(Math.PI * t), P = t => [ua + du * span * t, va + dv * span * t];
    inFrame(() => {
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N, y0 = Y(t0), y1 = Y(t1), [mu, mv] = P((t0 + t1) / 2), seg = span / N, len = Math.hypot(seg, y1 - y0), pitch = Math.atan2(y1 - y0, seg);
        B.box(len + 0.04, 0.12, wHalf * 2, mu, (y0 + y1) / 2 - 0.12, mv, '#b9824f', ry, 0, pitch);
        for (const s of [-1, 1]) B.box(len + 0.02, 0.08, 0.1, mu + nu * s * wHalf, (y0 + y1) / 2 + 0.78, mv + nv * s * wHalf, '#d9553a', ry, 0, pitch);
        if (i % 2 === 0 || i === N - 1) { const tt = i === N - 1 ? t1 : t0, [pu, pv] = P(tt); for (const s of [-1, 1]) B.box(0.12, 0.9, 0.12, pu + nu * s * wHalf, Y(tt) - 0.1, pv + nv * s * wHalf, '#d9553a', ry); }
        const [x, z] = W(mu, mv); ctx.decks.push({ x0: x - 0.62, x1: x + 0.62, z0: z - 0.62, z1: z + 0.62, y: (y0 + y1) / 2 - 0.02 });
      }
      for (const t of [0.25, 0.5, 0.75]) { const [pu, pv] = P(t); B.cyl(0.12, 0.14, Y(t) - pondY + 0.6, pu, pondY - 0.6, pv, '#a9442f', 6); }   // trụ đỡ
    });
    for (let i = 0; i <= N; i += 2) for (const s of [-1, 1]) { const [pu, pv] = P(i / N); colAt(pu + nu * s * (wHalf + 0.15), pv + nv * s * (wHalf + 0.15), 0.18); }
  });

  // ================= CHỖ NGỒI THIỀN (đá phẳng + bồ đoàn) =================
  const seats = SEATS.map(([u, v, lu, lv], i) => {
    const y = i === 1 ? pavY.top : H(u, v);
    inFrameDG(() => { if (i !== 1) DG.cyl(0.62, 0.7, 0.2, u, y - 0.08, v, '#b7b0a2', 7); DG.cyl(0.34, 0.36, 0.14, u, y + 0.12, v, ['#c96f4a', '#7e9c6b', '#d9a441', '#7a8fb3', '#b5452f'][i], 8); });
    const [x, z] = W(u, v), [fx, fz] = W(lu, lv); return { x, z, y, face: Math.atan2(fx - x, fz - z) };
  });
  budget['chỗ ngồi thiền'] = 5 * 52;

  // ================= TRE, PHONG LÁ ĐỎ, THÔNG =================
  // cây tre: thân 8 m có đốt + 8 chùm lá xoè theo góc vàng (≈ 150 tam giác)
  const bambooGeo = (() => {
    const b = new Batch('bamboo');
    b.cyl(0.06, 0.085, 8, 0, 0, 0, '#7fae4a', 5);
    for (let k = 1; k <= 5; k++) b.push(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 5, 1, true), '#5e8a36', 0, k * 1.3, 0);
    for (let k = 0; k < 8; k++) { const a = k * GOLD, y = 4.6 + k * 0.45, l = 1.1 - k * 0.06; b.push(new THREE.OctahedronGeometry(1, 0), k % 2 ? '#6fb85a' : '#8fcf6a', Math.cos(a) * l * 0.7, y, Math.sin(a) * l * 0.7, -a, 0, -0.35, l, 0.1, 0.32); }
    const g = mergeGeometries(b.geos); budget['cây tre (1 cây)'] = Math.round(b.tris); return g;
  })();
  const bambooMat = toon('#ffffff', { vertexColors: true, unique: true }), windU = { value: 0 };
  bambooMat.onBeforeCompile = sh => {
    sh.uniforms.uWind = windU;
    sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = instanceMatrix[3].xyz;
      #else
        vec3 ip = vec3(0.);
      #endif
      float kk = max(position.y, 0.) / 8.; kk *= kk; float ph = ip.x * 0.37 + ip.z * 0.23;
      transformed.x += (sin(uWind * 1.3 + ph) + 0.4 * sin(uWind * 3.1 + ph * 2.)) * 0.22 * kk;
      transformed.z += cos(uWind * 1.1 + ph * 1.3) * 0.16 * kk;`);
  };
  bambooMat.customProgramCacheKey = () => 'zen-bamboo';
  const bamboo = [], bambooCells = [];
  { // cụm tre theo xoắn ốc hướng dương (Vogel): r = r0 + k·√i, θ = i·góc vàng
    const N = low ? 34 : 55, per = low ? 5 : 8, o = new THREE.Object3D(), Wl = 0.5;
    for (let i = 0; i < N * 3 && bamboo.length < N * per; i++) {
      const r = 16 + 40 * Math.sqrt(i / (N * 3)), a = i * GOLD + 0.3, u = Math.cos(a) * r, v = Math.sin(a) * r;
      const [x, z] = W(u, v), h = Hw(x, z);
      if (v > 0 && Math.abs(u) < 9) continue;                    // giữ sân trước & đường vào đền
      if (h < 1.6 || zenBlocked(u, v, 1.4) || blocked(x, z, 1.5) || Math.hypot(u - BANYAN[0], v - BANYAN[1]) < 10) continue;
      if (rnd() < 0.18) continue;                                // chừa khoảng thưa cho tán nhiều lớp
      for (let j = 0; j < per; j++) {
        const rr = 0.25 + 0.75 * Math.sqrt((j + 0.5) / per), aa = j * GOLD + i, uu = u + Math.cos(aa) * rr, vv = v + Math.sin(aa) * rr, [bx, bz] = W(uu, vv);
        const s = 0.85 + rnd() * 0.3, hs = (0.7 + rnd() * 0.45);
        o.position.set(bx, Hw(bx, bz) - 0.1, bz); o.rotation.set((rnd() - 0.5) * 0.12, rnd() * 6.28, (rnd() - 0.5) * 0.12); o.scale.set(s, s * hs, s); o.updateMatrix();
        bamboo.push({ m: o.matrix.clone(), x: bx, z: bz, c: new THREE.Color().setHSL(0.24 + rnd() * 0.06, 0.45, 0.48 + rnd() * 0.14) });
      }
      mine({ x, z, r: 0.75 });
    }
    const cells = new Map(), C = 55;   // ô 55 m (Fibonacci) → ít mesh hơn
    for (const q of bamboo) { const k = Math.floor(q.x / C) + ',' + Math.floor(q.z / C); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(q); }
    for (const list of cells.values()) {
      const im = new THREE.InstancedMesh(bambooGeo, bambooMat, list.length); let cx = 0, cz = 0;
      list.forEach((q, i) => { im.setMatrixAt(i, q.m); im.setColorAt(i, q.c); cx += q.x; cz += q.z; });
      im.castShadow = false; im.receiveShadow = true; im.computeBoundingSphere(); im.name = 'zen-bamboo';   // không đổ bóng: bớt 1 draw call/ô im.visible = false; root.add(im);
      bambooCells.push({ im, x: cx / list.length, z: cz / list.length });
    }
    void Wl;
  }
  budget._bamboo = bamboo.length;
  // phong lá đỏ + thông: thêm vào InstancedMesh cây của terrain (không tốn draw call)
  const treeItems = { round: [], fat: [], pine: [], pineTall: [] };
  { const MAPLE = ['#d9583a', '#e8763f', '#c95a3a', '#f09a4a', '#e26a44'], nM = low ? 13 : 21, nP = low ? 13 : 21;
    let placed = 0;
    for (let i = 0; i < 400 && placed < nM + nP; i++) {
      const maple = placed < nM, r = maple ? 12 + 26 * Math.sqrt(rnd()) : 30 + 28 * Math.sqrt(rnd()), a = rnd() * 6.283, u = Math.cos(a) * r, v = Math.sin(a) * r, [x, z] = W(u, v), h = Hw(x, z);
      if (v > 0 && Math.abs(u) < 10) continue;
      if (h < 1.6 || zenBlocked(u, v, 2.2) || blocked(x, z, 2) || Math.hypot(u - BANYAN[0], v - BANYAN[1]) < 10) continue;
      if (bamboo.some(q => Math.hypot(q.x - x, q.z - z) < 2.2)) continue;
      if (maple) (placed % 2 ? treeItems.round : treeItems.fat).push([x, h - 0.08, z, (placed % 2 ? 3.4 : 3.6) + rnd() * 0.9, rnd() * 6.28, MAPLE[placed % MAPLE.length]]);
      else (placed % 2 ? treeItems.pine : treeItems.pineTall).push([x, h - 0.08, z, 3.6 + rnd() * 1.2, rnd() * 6.28]);
      mine({ x, z, r: 0.35 }); placed++;
    }
    // đá rêu lớn quanh thác
    treeItems.rockL = [[...W(FALL.u + 1.6, FALL.v - 0.6)], [...W(FALL.u - 1.8, FALL.v - 0.2)], [...W(FALL.u, FALL.v - 1.6)]].map(([x, z], i) => [x, Hw(x, z) + 0.2, z, [3.4, 2.8, 3.8][i], i * 2.1, '#a9a297']);
    treeItems.rockT = [[...W(FALL.u + 2.2, FALL.v + 0.6)], [...W(FALL.u - 2.3, FALL.v + 0.8)]].map(([x, z], i) => [x, Hw(x, z) - 0.1, z, [2.4, 2.0][i], i * 1.7, '#b9b0a1']);
    for (const [x, z] of [W(FALL.u + 1.6, FALL.v - 0.6), W(FALL.u - 1.8, FALL.v - 0.2), W(FALL.u + 2.2, FALL.v + 0.6), W(FALL.u - 2.3, FALL.v + 0.8)]) mine({ x, z, r: 1.1 });
  }

  // ================= SƯƠNG MỎNG + HƠI THỞ (1 InstancedMesh billboard, alpha theo instanceColor.r) =================
  const MIST_N = low ? 8 : 13, PUFF = 3;
  const mistMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uOpacity: { value: 0.3 }, uColor: { value: new THREE.Color('#eef3f0') } }]),
    vertexShader: `uniform float uTime; varying vec2 vUv; varying float vA; #include <fog_pars_vertex>
      void main(){ vUv = uv; vA = instanceColor.r; vec3 c = instanceMatrix[3].xyz; float ph = c.x * 0.13 + c.z * 0.07;
        c.x += sin(uTime * 0.11 + ph) * 1.6; c.z += cos(uTime * 0.09 + ph) * 1.6;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.); mvPosition.xy += position.xy * vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
        gl_Position = projectionMatrix * mvPosition; #include <fog_vertex> }`.replace(/#include <(\w+)>/g, '\n#include <$1>\n'),
    fragmentShader: `uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv; varying float vA; #include <fog_pars_fragment>
      void main(){ vec2 p = vUv * 2. - 1.; float d = length(p * vec2(1., 1.25)); float a = smoothstep(1., 0.1, d); a *= a * vA * uOpacity;
        if (a < 0.004) discard; gl_FragColor = vec4(uColor, a); #include <fog_fragment> }`.replace(/#include <(\w+)>/g, '\n#include <$1>\n'),
  });
  const mist = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mistMat, MIST_N + PUFF); mist.frustumCulled = false; mist.renderOrder = 3; mist.name = 'zen-mist'; root.add(mist);
  { const o = new THREE.Object3D(), c = new THREE.Color();
    for (let i = 0; i < MIST_N; i++) { const r = 18 + 30 * Math.sqrt((i + 0.5) / MIST_N), a = i * GOLD * 2 + 1, u = Math.cos(a) * r, v = Math.sin(a) * r, [x, z] = W(u, v); o.position.set(x, Hw(x, z) + 1.2 + rnd() * 1.4, z); o.scale.set(8 + rnd() * 5, (8 + rnd() * 5) / PHI / PHI, 1); o.updateMatrix(); mist.setMatrixAt(i, o.matrix); mist.setColorAt(i, c.setRGB(0.5 + rnd() * 0.5, 0, 0)); }
    for (let i = 0; i < PUFF; i++) { o.position.set(0, -999, 0); o.scale.set(0.01, 0.01, 1); o.updateMatrix(); mist.setMatrixAt(MIST_N + i, o.matrix); mist.setColorAt(MIST_N + i, c.setRGB(0, 0, 0)); } }
  const puffs = Array.from({ length: PUFF }, () => ({ t: -1, x: 0, y: 0, z: 0 }));

  // ================= ĐOM ĐÓM (Points, bay trên GPU) =================
  const FF = low ? 34 : 55, ffPos = new Float32Array(FF * 3), ffPh = new Float32Array(FF);
  for (let i = 0; i < FF; i++) { const r = 8 + 40 * Math.sqrt((i + 0.5) / FF), a = i * GOLD, [x, z] = W(Math.cos(a) * r, Math.sin(a) * r); ffPos.set([x, Hw(x, z) + 0.5 + rnd() * 2, z], i * 3); ffPh[i] = rnd() * 6.28; }
  const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3)); ffGeo.setAttribute('aPh', new THREE.BufferAttribute(ffPh, 1));
  const ffMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    vertexShader: `uniform float uTime, uNight; attribute float aPh; varying float vA;
      void main(){ vec3 p = position; p.x += sin(uTime * 0.5 + aPh) * 1.4; p.z += cos(uTime * 0.37 + aPh * 1.7) * 1.4; p.y += sin(uTime * 0.8 + aPh * 2.3) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; vA = uNight * (0.35 + 0.65 * max(0., sin(uTime * 2.1 + aPh * 3.))); gl_PointSize = 170. / -mv.z; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0., d) * vA; gl_FragColor = vec4(vec3(1., 0.95, 0.5) * a, a); }` });
  const fireflies = new THREE.Points(ffGeo, ffMat); fireflies.frustumCulled = false; fireflies.name = 'zen-fireflies'; root.add(fireflies);

  // ================= LÁ RƠI (phong đỏ/vàng, rơi quanh người chơi khi ở trong rừng) =================
  const LEAF_N = low ? 21 : 34, leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.11, 0.08, 0, 0, 0, 0, 0.11, 0, 0, -0.11, 0, 0, 0.11, -0.08, 0, 0], 3)); leafGeo.computeVertexNormals();
  const leaves = new THREE.InstancedMesh(leafGeo, toon('#ffffff', { side: THREE.DoubleSide }), LEAF_N); leaves.frustumCulled = false; leaves.name = 'zen-leaves'; root.add(leaves);
  const leafSt = Array.from({ length: LEAF_N }, (_, i) => ({ x: 0, y: -999, z: 0, ph: rnd() * 6.28, v: 0.5 + rnd() * 0.4, col: ['#d9452f', '#e8663a', '#f2b33d', '#c8402e', '#8fcf6a'][i % 5] }));
  leafSt.forEach((q, i) => leaves.setColorAt(i, new THREE.Color(q.col)));

  // ================= XUẤT RA SCENE =================
  const mat = toon('#ffffff', { vertexColors: true });
  const mb = B.mesh(mat, true); if (mb) { mb.name = 'zen-arch'; addOutline(mb); root.add(mb); }
  const mg = G.mesh(mat, false); if (mg) { mg.name = 'zen-ground'; mg.castShadow = false; mg.receiveShadow = true; root.add(mg); }
  { const [b2, g2] = detailMats(); DG.build(root, b2, g2); }
  // âm thanh: suối róc rách, thác, chim (ngày), dế (đêm)
  if (ctx.addSoundZone) {
    const S = (file, u, v, o) => { const [x, z] = W(u, v); ctx.addSoundZone(Object.assign({ file, x, y: H(u, v) + 1, z, ref: 6, vol: 0.7 }, o)); };
    S('amb-river', FALL.u, FALL.v + 1, { ref: 5, vol: 0.9 }); S('amb-river', STREAM[3][0], STREAM[3][1], { ref: 4, vol: 0.5 });
    S('amb-birds2', -30, -20, { ref: 8, when: 'day' }); S('amb-birds', 10, -40, { ref: 8, when: 'day' }); S('amb-crickets', -10, -30, { ref: 8, vol: 0.5, when: 'night' });
  }

  // ================= TƯƠNG TÁC + CẬP NHẬT =================
  let swing = 0, swingV = 0, quoteI = 0; try { quoteI = +(localStorage.getItem('island.zenQuote') || 0); } catch (e) {}
  function ringBell() {
    swingV += 1.6; ctx.sfx && ctx.sfx('bell');
    if (ctx.ambienceSfx) ctx.ambienceSfx('bell', bellX, bellY + 2.5, bellZ);
    ctx.toast('🔔 <b>Boong…</b> <small>Tiếng chuông lan xa trong rừng tre.</small>', 2500);
  }
  function meditate(s) {
    const p = ctx.player; if (p.pos) { p.pos.x = s.x; p.pos.z = s.z; }
    p.setRot && p.setRot(s.face);
    p.emote && p.emote('floor');
    const q = QUOTES[quoteI % QUOTES.length]; quoteI++; try { localStorage.setItem('island.zenQuote', quoteI); } catch (e) {}
    ctx.toast(`🧘 <b>${q}</b><br><small>Hít vào… thở ra… (${quoteI % QUOTES.length || QUOTES.length}/${QUOTES.length})</small>`, 6500);
    puffs.forEach((f, i) => { f.t = -i * 1.6; f.x = s.x + Math.sin(s.face) * 0.35; f.y = s.y + 1.05; f.z = s.z + Math.cos(s.face) * 0.35; });
  }

  let first = true, upT = 0, near = false;
  const o = new THREE.Object3D(), c = new THREE.Color();
  function cleanup() {   // dọn cây/đá tự nhiên (terrain + thị trấn) mọc trùng lối đi, hồ, vườn; rồi thêm phong/thông/đá của rừng thiền
    let n = 0;
    for (const kind of Object.keys(NATURE)) {
      const set = terrain.nature.add(kind, []); if (!set || !set.items) continue;
      const m0 = NATURE[kind].type === 'tree' || NATURE[kind].type === 'pine' ? 1.6 : 0.6, before = set.items.length;
      const keep = set.items.filter(q => { const x = q.m.elements[12], z = q.m.elements[14]; if (Math.hypot(x - TX, z - TZ) > 70) return true; const [u, v] = L(x, z); return !zenBlocked(u, v, m0); });
      set.items.length = 0; set.items.push(...keep);   // sửa tại chỗ (terrain giữ tham chiếu mảng)
      if (set.items.length !== before) { n += before - set.items.length; set.relayout && set.relayout(set.last); }
    }
    for (let i = ctx.colliders.length - 1; i >= 0; i--) { const q = ctx.colliders[i]; if (q.zen || Math.hypot(q.x - TX, q.z - TZ) < 13 || Math.hypot(q.x - TX, q.z - TZ) > 70) continue; const [u, v] = L(q.x, q.z); if (zenBlocked(u, v, 0.3)) { ctx.colliders.splice(i, 1); n++; } }
    for (const k of Object.keys(treeItems)) if (treeItems[k].length) terrain.nature.add(k, treeItems[k]);
    console.info('[zen] dọn', n, 'cây/đá tự nhiên trùng lối đi · tam giác:', budget);
  }
  function update(p, t, dt = 0.016) {
    if (first) { first = false; cleanup(); }
    if ((upT -= dt) <= 0) {
      upT = 0.3; const d = Math.hypot(p.x - TX, p.z - TZ); near = d < 150; root.visible = near;
      if (near) { DG.update(p, 60); for (const q of bambooCells) q.im.visible = Math.hypot(q.x - p.x, q.z - p.z) < 60 + 38; }
    }
    if (!near) return;
    const night = (ctx.sky && ctx.sky.state.night) || 0, hour = ctx.sky ? ctx.sky.state.hour : 12;
    windU.value = t; waterMat.uniforms.uTime.value = t; mistMat.uniforms.uTime.value = t;
    mistMat.uniforms.uOpacity.value = 0.22 + 0.25 * Math.max(0, 1 - Math.abs(hour - 6.5) / 2.5) + 0.12 * night;   // sương dày lúc sáng sớm
    ffMat.uniforms.uTime.value = t; ffMat.uniforms.uNight.value = Math.min(1, night * 1.6); fireflies.visible = night > 0.05;
    mistMat.uniforms.uColor.value.setRGB(0.93, 0.95, 0.94).multiplyScalar(1 - night * 0.78);   // sương tối dần theo đêm
    // chuông đồng: con lắc tắt dần; chuông gió lay theo gió
    swingV += (-swing * 9 - swingV * 0.9) * dt; swing += swingV * dt; bellPivot.rotation.x = swing * 0.35;
    chimes.rotation.z = Math.sin(t * 1.7) * 0.06 + swing * 0.1; chimes.rotation.x = Math.cos(t * 1.3) * 0.05;
    // hơi thở: 3 làn sương nhỏ nối nhau bay lên rồi tan
    let pc = false;
    puffs.forEach((f, i) => { if (f.t > 4.2) return; f.t += dt; const k = Math.max(0, f.t) / 2.6, on = f.t > 0 && k < 1; o.position.set(f.x, on ? f.y + k * 0.7 : -999, f.z); const s = 0.25 + k * 0.9; o.scale.set(s, s, 1); o.updateMatrix(); mist.setMatrixAt(MIST_N + i, o.matrix); mist.setColorAt(MIST_N + i, c.setRGB(on ? (1 - k) * 2.2 : 0, 0, 0)); pc = true; });
    if (pc) { mist.instanceMatrix.needsUpdate = true; mist.instanceColor.needsUpdate = true; }
    // lá rơi quanh người chơi (khi ở trong rừng)
    const inForest = Math.hypot(p.x - TX, p.z - TZ) < 62;
    for (let i = 0; i < LEAF_N; i++) {
      const q = leafSt[i];
      if (q.y < Hw(q.x, q.z) + 0.05) { if (!inForest) { q.y = -999; } else { q.x = p.x + (rnd() - 0.5) * 26; q.z = p.z + (rnd() - 0.5) * 26; q.y = Hw(q.x, q.z) + 4 + rnd() * 5; } }
      else { q.y -= q.v * dt; q.x += Math.sin(t * 1.3 + q.ph) * 0.6 * dt + 0.15 * dt; q.z += Math.cos(t * 0.9 + q.ph) * 0.4 * dt; }
      o.position.set(q.x, q.y, q.z); o.rotation.set(Math.sin(t * 2.1 + q.ph) * 0.9, t * 0.7 + q.ph, Math.cos(t * 1.7 + q.ph) * 0.6); o.scale.setScalar(1.2); o.updateMatrix(); leaves.setMatrixAt(i, o.matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;
    // nút hành động
    if (ctx.offer && !ctx.player.frozen) {
      if (Math.hypot(p.x - bellX, p.z - bellZ) < 2.6) ctx.offer('🔔 Rung chuông', ringBell, 1);
      for (const s of seats) if (Math.hypot(p.x - s.x, p.z - s.z) < 1.8) ctx.offer('🧘 Ngồi thiền', () => meditate(s), 1);
    }
  }
  console.info('[zen] tam giác mỗi công trình:', budget);
  return (ctx.zen = { update, root, budget, seats, bell: { x: bellX, z: bellZ } });   // ctx.zen: gỡ lỗi (__island.zen)
}
