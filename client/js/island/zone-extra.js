// zone-extra.js — 4 KHU VEN BIỂN (layout.js: EXTRA) + bãi biển chung, phong cách "đảo cozy" low-poly.
//   E Làng nổi (khu nghỉ sinh thái trên biển) · F Công viên Safari · G Học viện Hoa Phượng · H Resort Biển Xanh
//   Bãi biển: cầu gỗ ngắn có đèn lồng, đá bờ, cỏ biển, cây dừa, thuyền neo (model kit, nhấp nhô).
// Thế giới mở: không hàng rào/cổng/lan can — chia vùng bằng suối, bụi cây, đá. Kiến trúc mềm: vòm, mái cong, góc bo.
// Tối ưu: khối dựng bằng code gộp 1 Batch/khu (1 draw call + viền); chi tiết nhỏ vào DetailGrid (chỉ hiện gần);
//         model kit rải bằng InstancedMesh chia ô 70 m (còn bị cắt khi ngoài khung nhìn).
import * as THREE from 'three';
import { Batch } from './decor.js';
import { placeKit } from './kit.js';
import { PHI } from './layout.js';

const WOOD = '#b9824f', WOOD2 = '#a8743f', WOOD_D = '#8a5a34', POST = '#6b4a2b', SAND = '#f3d6a8', GRASS = '#8fcf6a', LAMP = '#ffd36e';

// Vài model kit gốc tô ngọc lam/hồng cam → đổi sang bảng màu docs/art-style.md (vật liệu riêng, không ảnh hưởng chỗ khác)
const KIT_COL = {
  tree_palm: { '70e6d6': '#4fae47', f2be9e: '#a8774a' }, tree_fat: { '70e6d6': '#5aa04a', f2be9e: '#8a6a45' }, tree_oak: { '70e6d6': '#6cb84f', f2be9e: '#8a6a45' },
  bush: { '73eddd': '#4f9a3a' }, bush_large: { '73eddd': '#5aa04a' }, log: { f2be9e: '#8a5a34', fbedde: '#d9b98a' },
  rock_large: { f2be9e: '#bdb6aa', '73eddd': '#7cc45a' }, rock_small: { f2be9e: '#c9c2b4', '73eddd': '#7cc45a' }, rock_tall: { f2be9e: '#b3ab9e', '73eddd': '#6fb85a' },
};
const recolored = new Map();
export function placeKitCells(scene, name, list, cell = 70, opts) {
  const m = new Map();
  for (const t of list) { const k = Math.floor(t[0] / cell) + ',' + Math.floor(t[2] / cell); if (!m.has(k)) m.set(k, []); m.get(k).push(t); }
  const map = KIT_COL[name];
  return Promise.all([...m.values()].map(l => placeKit(scene, name, l, opts).then(ims => {
    if (map) for (const im of ims) { const hex = im.material.color.getHexString(), key = name + hex; if (!map[hex]) continue; if (!recolored.has(key)) { const mt = im.material.clone(); mt.color.set(map[hex]); recolored.set(key, mt); } im.material = recolored.get(key); }
    return ims;
  }))).then(a => a.flat());
}
// đường cong mượt qua các điểm [x,z] → n+1 điểm cách đều
const curve = (pts, n) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.5).getSpacedPoints(n).map(v => [v.x, v.z]);
const line = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
const nrm = (P, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
const distTo = (P, x, z) => { let d = 1e9; for (const [a, b] of P) d = Math.min(d, Math.hypot(a - x, b - z)); return d; };
// mái cong lõm (kiểu đình Việt, bo mềm): tiện quay 4 cạnh (vuông) hoặc 8 cạnh (bát giác)
const ROOF_PROFILE = [[1.1, -0.06], [1.0, 0.0], [0.72, 0.2], [0.48, 0.45], [0.27, 0.72], [0.1, 0.94], [0.0, 1.0]].map(([r, y]) => new THREE.Vector2(r, y));
const roofGeo = seg => new THREE.LatheGeometry(ROOF_PROFILE, seg, seg === 4 ? Math.PI / 4 : Math.PI / seg);
const DOME_PROFILE = Array.from({ length: 6 }, (_, i) => { const a = i / 5 * Math.PI / 2; return new THREE.Vector2(Math.cos(a) * 1.04, Math.sin(a)); });

export function buildExtraZones(ctx, k) {
  const { B, ZR, Y, DG, atlas, signAt, measure, trees, rnd, low, palmAt, addFoot, addFootC } = k;
  const kits = [], boats = [];                         // kits: [tên model, [x,y,z,s,ry], đổ bóng] · boats: [x, z, ry, tên, s]
  const kit = (name, x, y, z, s, ry = rnd() * 6.28, shadow = false) => kits.push([name, [x, y, z, s, ry], shadow]);
  const boat = (x, z, ry, name = ['boat_sail_a', 'boat_sail_b', 'boat_row'][boats.length % 3]) => boats.push([x, z, ry, name, name === 'boat_row' ? 1.7 : 1.3]);
  const G0 = B.ground;                                // mặt phẳng (cỏ, cát, đường, nước): không viền, không đổ bóng
  const tri = (a, b, c, pos) => { const ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]); pos.push(...a, ...(ny < 0 ? c : b), ...(ny < 0 ? b : c)); };
  const ribbon = (b, P, w, y, col) => {               // dải phẳng theo đường cong (đường mòn, suối, bờ)
    const pos = [], L = P.map((p, i) => { const n = nrm(P, i); return [[p[0] + n[0] * w / 2, y, p[1] + n[1] * w / 2], [p[0] - n[0] * w / 2, y, p[1] - n[1] * w / 2]]; });
    for (let i = 0; i < L.length - 1; i++) { tri(L[i][0], L[i][1], L[i + 1][0], pos); tri(L[i][1], L[i + 1][1], L[i + 1][0], pos); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); b.push(g, col);
  };
  const flat = (b, geo, col, x, y, z, sx = 1, sz = 1, ry = 0) => b.push(geo.clone().rotateX(-Math.PI / 2), col, x, y, z, ry, 0, 0, sx, 1, sz);
  const disc = (b, r, x, y, z, col, seg = 16, sx = 1, sz = 1) => flat(b, new THREE.CircleGeometry(r, seg), col, x, y, z, sx, sz);
  const rrect = (b, x0, z0, x1, z1, r, col, y = Y + 0.008) => { const w = (x1 - x0) / 2, d = (z1 - z0) / 2, s = new THREE.Shape(); s.moveTo(-w + r, -d); s.lineTo(w - r, -d); s.quadraticCurveTo(w, -d, w, -d + r); s.lineTo(w, d - r); s.quadraticCurveTo(w, d, w - r, d); s.lineTo(-w + r, d); s.quadraticCurveTo(-w, d, -w, d - r); s.lineTo(-w, -d + r); s.quadraticCurveTo(-w, -d, -w + r, -d); flat(b, new THREE.ShapeGeometry(s, 4), col, (x0 + x1) / 2, y, (z0 + z1) / 2); };
  const roof = (b, w, d, h, x, y0, z, col, seg = 4, ry = 0) => { const s = seg === 4 ? Math.SQRT2 / 2 : 1; b.push(roofGeo(seg), col, x, y0, z, ry, 0, 0, w / 2 / s, h, d / 2 / s); };
  const domeTop = (b, r, h, x, y0, z, col, seg = 12) => b.push(new THREE.LatheGeometry(DOME_PROFILE, seg), col, x, y0, z, 0, 0, 0, r, h, r);
  // đèn cột gỗ có lồng đèn (lồng đèn phát sáng nằm trong DetailGrid)
  const lampPost = (b, x, z, y, ry = 0) => {
    const c = Math.cos(ry), s = Math.sin(ry), lx = x + s * 0.6, lz = z + c * 0.6;
    b.cyl(0.08, 0.1, 2.5, x, y, z, POST, 6); b.cyl(0.16, 0.18, 0.14, x, y, z, POST, 6); b.box(0.07, 0.07, 0.7, x + s * 0.3, y + 2.4, z + c * 0.3, POST, ry);
    roof(b, 0.5, 0.5, 0.24, lx, y + 2.26, lz, POST); b.cyl(0.18, 0.18, 0.06, lx, y + 1.68, lz, POST, 6);
    DG.glow(() => DG.cyl(0.15, 0.15, 0.52, lx, y + 1.74, lz, LAMP, 6));
  };
  // lối gỗ đi được (thẳng hoặc cong): ván, cọc xuống nước, đèn cột — không lan can
  const walkway = (b, pts, w, y, { lampEvery = 0, posts = true, col = WOOD } = {}) => {
    const len = pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0), n = Math.max(2, Math.ceil(len / 1.1));
    const P = pts.length > 2 ? curve(pts, n) : line(pts[0], pts[1], n);
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az), [nx, nz] = nrm(P, i);
      b.box(w, 0.16, L + 0.06, (ax + bx) / 2, y - 0.16, (az + bz) / 2, i % 2 ? col : WOOD2, ry);
      DG.box(w + 0.02, 0.02, 0.05, ax, y, az, WOOD_D, ry);
      if (posts && i % 3 === 0) for (const s of [-1, 1]) b.cyl(0.11, 0.11, y + 2.4, ax + nx * s * (w / 2 - 0.1), -2.2, az + nz * s * (w / 2 - 0.1), POST, 5);
      if (lampEvery && i % lampEvery === Math.floor(lampEvery / 2)) { const s = (i / lampEvery | 0) % 2 ? 1 : -1; lampPost(b, ax + nx * s * (w / 2 + 0.12), az + nz * s * (w / 2 + 0.12), y - 0.16, Math.atan2(-nx * s, -nz * s)); }
      ctx.decks.push({ x0: Math.min(ax, bx) - w / 2 - 0.1, x1: Math.max(ax, bx) + w / 2 + 0.1, z0: Math.min(az, bz) - w / 2 - 0.1, z1: Math.max(az, bz) + w / 2 + 0.1, y });
    }
    return P;
  };
  // sàn gỗ tròn (bến, hiên nhà vòm)
  const platform = (b, x, z, r, y, col = WOOD) => {
    b.cyl(r, r, 0.3, x, y - 0.3, z, col, 16); b.cyl(r + 0.12, r + 0.12, 0.14, x, y - 0.44, z, WOOD_D, 16);
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; b.cyl(0.13, 0.13, y + 1.8, x + Math.cos(a) * (r - 0.3), -2.2, z + Math.sin(a) * (r - 0.3), POST, 5); }
    for (let u = -r + 0.9; u < r - 0.4; u += 0.9) DG.box(0.05, 0.02, Math.sqrt(r * r - u * u) * 2 - 0.3, x + u, y, z, WOOD_D);
    for (const [hx, hz] of [[0.92, 0.38], [0.38, 0.92], [0.7, 0.7]]) ctx.decks.push({ x0: x - r * hx, x1: x + r * hx, z0: z - r * hz, z1: z + r * hz, y });
  };
  // nhà mái vòm trắng có mảng kính phía trước (mặt tiền = +z cục bộ)
  const domeHome = (b, x, z, y, r, ry, glass = '#8fd3ea') => { addFootC(x, z, r); b.group(x, y, z, ry, () => {
    b.cyl(r * 1.02, r * 1.02, 0.35, 0, 0, 0, '#d9cdb8', 16);
    b.push(new THREE.SphereGeometry(r, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2), '#f6f8f8', 0, 0.35, 0, 0, 0, 0, 1, 0.82, 1);
    b.push(new THREE.SphereGeometry(r * 1.015, 8, 4, Math.PI / 2 - 0.85, 1.7, 0.6, 0.95), glass, 0, 0.35, 0, 0, 0, 0, 1, 0.82, 1);
    for (const a of [-0.45, 0, 0.45]) b.box(0.08, r * 0.62, 0.08, Math.sin(a) * r * 0.86, 0.5, Math.cos(a) * r * 0.86, '#ffffff', a, -0.35);
    domeTop(b, r * 0.24, 0.3, 0, 0.25 + r * 0.82, 0, '#bfe9f6', 10);
    b.push(new THREE.CircleGeometry(0.55, 8, 0, Math.PI), '#7a4f2e', 0, 1.7, r * 0.99); b.box(1.1, 1.7, 0.12, 0, 0.35, r * 0.985, '#7a4f2e');
  }); };
  // khối nhà bo góc (trụ tròn ở 4 góc), viền tầng, cửa sổ vòm, mái ngói cong
  const blk = (b, x, z, w, d, h, o = {}) => {
    const WH = o.wall || '#fbf1de', OR = o.roof || '#d9683f', fl = Math.max(1, Math.floor((h - 0.45) / 2.6)), fh = (h - 0.45) / fl, cr = 0.45;
    b.box(w + 0.4, 0.45, d + 0.4, x, Y, z, '#d8cfbf'); b.box(w, h - 0.45, d, x, Y + 0.45, z, WH);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.cyl(cr, cr, h - 0.45, x + sx * (w / 2 - cr * 0.6), Y + 0.45, z + sz * (d / 2 - cr * 0.6), '#ffffff', 8);
    for (let f = 1; f < fl; f++) b.box(w + 0.12, 0.14, d + 0.12, x, Y + 0.45 + f * fh - 0.07, z, '#ffffff');
    b.box(w + 0.3, 0.28, d + 0.3, x, Y + h - 0.28, z, '#ffffff');
    roof(b, w + 1.6, d + 1.6, Math.min(w, d) / (PHI * PHI) + 0.6, x, Y + h, z, OR);
    for (let f = 0; f < fl; f++) {
      const wy = Y + 0.45 + f * fh + fh * 0.2;
      const win = (px, pz, ry, ox, oz) => { b.plane(1.0, 1.15, px, wy + 0.55, pz, '#ffffff', ry); b.push(new THREE.CircleGeometry(0.5, 6, 0, Math.PI), '#ffffff', px, wy + 1.12, pz, ry); DG.plane(0.74, 0.95, px + ox, wy + 0.55, pz + oz, '#5f9cc8', ry); DG.push(new THREE.CircleGeometry(0.37, 6, 0, Math.PI), '#5f9cc8', px + ox, wy + 1.02, pz + oz, ry); };
      for (let u = -w / 2 + 1.3; u < w / 2 - 0.9; u += 2.1) for (const s of [-1, 1]) win(x + u, z + s * (d / 2 + 0.02), s < 0 ? Math.PI : 0, 0, s * 0.012);
      for (let v = -d / 2 + 1.3; v < d / 2 - 0.9; v += 2.1) for (const s of [-1, 1]) win(x + s * (w / 2 + 0.02), z + v, s * Math.PI / 2, s * 0.012, 0);
    }
    ctx.boxes.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, top: Y + h });
  };

  // ================= E. LÀNG NỔI: khu nghỉ sinh thái trên biển =================
  if (ZR.E) {
    const b = B.E = new Batch('E'), [x0, z0, x1, z1] = ZR.E, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y = 1.1;
    const l = Math.hypot(cx, cz), ux = -cx / l, uz = -cz / l, rx = -uz, rz = ux;          // u: hướng về đảo, r: ngang
    const W = (a, f) => [cx + rx * a + ux * f, cz + rz * a + uz * f];                       // a: ngang, f: tiến về đảo
    const faceIsland = Math.atan2(ux, uz);
    measure(b, 'village', () => {
      platform(b, cx, cz, 9.5, y, '#c08a52'); domeHome(b, cx - ux * 0.5, cz - uz * 0.5, y, 6.6, faceIsland);
      signAt(b, atlas.sign('LÀNG NỔI TRÊN BIỂN', '#1d5c7a', '#fff', '#ffd36e'), 4.4, 0.55, cx + ux * 6.15, y + 2.6, cz + uz * 6.15, faceIsland);
      for (const s of [-1, 1]) { const [px, pz] = W(s * 6.5, -5.5); b.cyl(0.7, 0.55, 0.6, px, y, pz, '#d9cdb8', 10); kit('plant_palm_bend', px, y + 0.55, pz, 1.0, rnd() * 6, true); }
      // 6 biệt thự vòm quanh sảnh, nối bằng lối gỗ cong
      [[-25, 12], [25, 12], [-31, -9], [31, -9], [-15, -25], [15, -25]].forEach(([a, f], i) => {
        const [vx, vz] = W(a, f), d = Math.hypot(vx - cx, vz - cz), dx = (vx - cx) / d, dz = (vz - cz) / d, s = i % 2 ? 1 : -1;
        platform(b, vx, vz, 5.2, y); domeHome(b, vx - dx * 0.6, vz - dz * 0.6, y, 3.6, Math.atan2(-dx, -dz) + s * 0.5, i % 3 ? '#8fd3ea' : '#9fe0d0');
        const p0 = [cx + dx * 9.2, cz + dz * 9.2], p2 = [vx - dx * 5, vz - dz * 5], p1 = [(p0[0] + p2[0]) / 2 - dz * 3.5 * s, (p0[1] + p2[1]) / 2 + dx * 3.5 * s];
        walkway(b, [p0, p1, p2], 2.2, y, { lampEvery: 7 });
        const tx = vx + dx * 3.2 - dz * 1.8 * s, tz = vz + dz * 3.2 + dx * 1.8 * s, tr = Math.atan2(dx, dz);
        for (const o of [-0.6, 0.6]) { DG.box(0.6, 0.25, 1.7, tx + Math.cos(tr) * o, y, tz - Math.sin(tr) * o, '#ffffff', tr); DG.box(0.55, 0.06, 0.9, tx + Math.cos(tr) * o, y + 0.27, tz - Math.sin(tr) * o, ['#7fd0e8', '#f6c7c0', '#f7e3a1'][i % 3], tr); }
        kit('prop_beach_umbrella', tx, y, tz, 0.9, rnd() * 6);
        kit('bush_large', vx - dz * 3.6 * s, y, vz + dx * 3.6 * s, 5, rnd() * 6);
        kit('prop_swim_ring', vx + dx * 5.4, 0.05, vz + dz * 5.4, 0.9, rnd() * 6);
      });
      // bến thuyền hướng về đảo: cầu chính + 2 nhánh, thuyền neo, phao cứu sinh
      const pe = W(0, 40); walkway(b, [W(0, 9.3), pe], 3, y, { lampEvery: 6 });
      for (const [f, s] of [[30, 1], [37, -1]]) {
        const a0 = W(s * 1.5, f), a1 = W(s * 10, f); walkway(b, [a0, a1], 1.8, y);
        const [bx, bz] = W(s * 6, f + 2.4 * s); boat(bx, bz, Math.atan2(rx, rz));
      }
      for (const s of [-1, 1]) { const [px, pz] = W(s * 1.62, 22); b.push(new THREE.TorusGeometry(0.34, 0.1, 6, 12), '#ff7a3a', px, y + 0.55, pz, faceIsland + Math.PI / 2); }
      // thuyền buồm neo ngoài khơi + phao tiêu
      for (const [a, f, r] of [[-48, 20, 0.4], [50, 10, 2.2], [8, -46, 1.2], [-42, -40, 4.0], [30, 44, 5.0]]) { const [bx, bz] = W(a, f); boat(bx, bz, r); }
      for (let i = 0; i < 12; i++) { const t = i / 12 * 6.28, [bx, bz] = W(Math.cos(t) * 48, Math.sin(t) * 40); if (Math.abs(Math.cos(t) * 48) < 6 && Math.sin(t) > 0) continue; kit(i % 3 ? 'prop_buoy' : 'prop_buoy_flag', bx, -0.5, bz, 0.8, rnd() * 6); }
      for (const [a, f, c] of [[-5, 26, '#f5c518'], [4.5, 24, '#e8453c'], [-12, 3, '#46b8d8']]) { const [kx, kz] = W(a, f); DG.ball(0.5, kx, 0.12, kz, c, 0.9, 0.35, 3.2); }
      // đảo nhỏ có cây dừa, đá
      for (const [a, f, r] of [[-56, -10, 6], [52, 28, 5], [46, -34, 4.5]]) {
        const [ix, iz] = W(a, f);
        b.cyl(r * 1.05, r * 1.25, 3.4, ix, -3.2, iz, '#e8c391', 14);
        b.push(new THREE.SphereGeometry(r, 14, 4, 0, Math.PI * 2, 0, Math.PI / 2), SAND, ix, 0.15, iz, 0, 0, 0, 1, 0.9 / r, 1);
        b.push(new THREE.SphereGeometry(r * 0.66, 12, 3, 0, Math.PI * 2, 0, Math.PI / 2), GRASS, ix + 0.4, 0.5, iz - 0.3, 0, 0, 0, 1, 0.7 / r, 1);
        for (let j = 0; j < (r > 5 ? 3 : 2); j++) kit(j % 2 ? 'plant_palm_straight' : 'plant_palm_bend', ix + (rnd() - 0.5) * r * 0.8, 1.0, iz + (rnd() - 0.5) * r * 0.8, 0.9 + rnd() * 0.3, rnd() * 6, true);
        for (let j = 0; j < 3; j++) { const t = rnd() * 6.28; kit(['rock_shore_a', 'rock_shore_b', 'rock_shore_c'][j], ix + Math.cos(t) * r * 0.95, -0.4, iz + Math.sin(t) * r * 0.95, 0.4 + rnd() * 0.3); }
        kit('plant_beach_grass', ix - 1, 0.95, iz + 1, 1.6);
      }
    });
  }

  // ================= F. CÔNG VIÊN SAFARI (không hàng rào: suối, đá, bụi cây chia vùng) =================
  if (ZR.F) {
    const b = B.F = new Batch('F'), [x0, z0, x1, z1] = ZR.F, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, P = (a, c) => [cx + a, cz + c];
    measure(b, 'safari', () => {
      rrect(G0, x0, z0, x1, z1, 13, '#9fd062');
      for (const [a, c, rx, rz, col] of [[-30, -36, 18, 11, '#c9d77a'], [36, 12, 15, 12, '#bfd26f'], [-26, 2, 13, 10, '#c9d77a'], [8, 40, 18, 7, '#b8cc68']]) disc(G0, 1, cx + a, Y + 0.012, cz + c, col, 12, rx, rz);
      // đường mòn cong từ lối vào phía bắc (giáp đường từ trường) vòng quanh khu
      const trail = curve([[0, -52], [-6, -37], [8, -23], [22, -9], [12, 9], [-10, 17], [-30, 13], [-42, -1], [-40, -19], [-28, -31]].map(([a, c]) => P(a, c)), 80);
      ribbon(G0, trail, 4.2, Y + 0.02, '#cdb27e'); ribbon(G0, trail, 3.2, Y + 0.035, '#e6d2a4');
      trail.forEach(([x, z], i) => { if (i % 3) return; const [nx, nz] = nrm(trail, i), s = i % 2 ? 1 : -1; DG.push(new THREE.DodecahedronGeometry(0.18 + rnd() * 0.12, 0), '#b5aea3', x + nx * s * 2.2, Y + 0.06, z + nz * s * 2.2, rnd() * 6, 0, 0, 1.3, 0.6, 1); });
      // suối uốn lượn ngang khu (ranh giới tự nhiên), bờ cát, đá
      const creek = curve([[-57, 39], [-30, 33], [-14, 23], [0, 15], [14, 23], [34, 33], [57, 29]].map(([a, c]) => P(a, c)), 70);
      ribbon(G0, creek, 5.4, Y + 0.025, '#d9c79a'); ribbon(G0, creek, 3.8, Y + 0.04, '#5fc8d8'); ribbon(G0, creek, 1.6, Y + 0.045, '#8fe0ea');
      creek.forEach(([x, z], i) => { if (i % 2) return; const [nx, nz] = nrm(creek, i), s = (i / 2) % 2 ? 1 : -1; kit(i % 6 ? 'rock_small' : 'rock_large', x + nx * s * (2.2 + rnd() * 0.6), Y - 0.05, z + nz * s * (2.2 + rnd() * 0.6), 2.5 + rnd() * 2); });
      // cầu gỗ vòm nơi đường mòn cắt suối
      let bi = 0, bd = 1e9; trail.forEach(([x, z], i) => { const d = distTo(creek, x, z); if (d < bd) { bd = d; bi = i; } });
      { const [bx, bz] = trail[bi], [tx, tz] = trail[Math.min(bi + 1, trail.length - 1)], ry = Math.atan2(tx - bx, tz - bz);
        b.group(bx, Y, bz, ry, () => { for (let i = 0; i < 9; i++) { const u = -3.6 + i * 0.9, h = 0.15 + Math.cos(u / 3.6 * Math.PI / 2) * 0.45; b.box(3.0, 0.16, 0.86, 0, h, u, i % 2 ? WOOD : WOOD2, 0, -Math.sin(u / 3.6 * Math.PI / 2) * 0.12); } for (const s of [-1, 1]) for (const u of [-3.4, 3.4]) b.cyl(0.13, 0.15, 0.7, s * 1.4, -0.2, u, POST, 6); });
        ctx.decks.push({ x0: bx - 3.4, x1: bx + 3.4, z0: bz - 3.4, z1: bz + 3.4, y: Y + 0.45 }); }
      // vũng nước cho voi uống
      const [px, pz] = P(34, -30);
      disc(G0, 1, px, Y + 0.02, pz, '#d9c79a', 16, 11, 8); disc(G0, 1, px, Y + 0.04, pz, '#5fc8d8', 16, 9, 6.2); disc(G0, 1, px - 1, Y + 0.045, pz - 1, '#8fe0ea', 12, 5, 3);
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; kit(i % 3 ? 'rock_small' : 'rock_large', px + Math.cos(a) * 10, Y - 0.05, pz + Math.sin(a) * 7.2, 2.5 + rnd() * 2); }
      for (let i = 0; i < 16; i++) { const a = rnd() * 6.28; for (let j = 0; j < 3; j++) DG.cone(0.06, 0.8 + rnd() * 0.5, px + Math.cos(a) * 9.6 + (j - 1) * 0.15, Y, pz + Math.sin(a) * 6.8, j % 2 ? '#6f9f3a' : '#8fbf4a', 3); }
      addFoot(px - 11, pz - 8, px + 11, pz + 8);
      const clearOf = (x, z, m = 4.5) => distTo(trail, x, z) > m && distTo(creek, x, z) > m - 0.5 && Math.hypot((x - px) / 12, (z - pz) / 9) > 1;
      // ---- thú dựng bằng khối bo tròn ----
      const giraffe = (x, z, ry) => b.group(x, Y, z, ry, () => {
        const C = '#f0c35c', S2 = '#a8652e';
        for (const [u, v] of [[-0.28, -0.55], [0.28, -0.55], [-0.28, 0.55], [0.28, 0.55]]) { b.cyl(0.08, 0.11, 1.75, u, 0, v, '#e9b956', 5); b.cyl(0.1, 0.1, 0.12, u, 0, v, '#5a3a22', 5); }
        b.ball(0.62, 0, 2.0, 0, C, 0.85, 0.72, 1.4);
        b.cyl(0.13, 0.24, 2.1, 0, 2.15, 0.78, C, 6, 0, 0.42);
        b.ball(0.22, 0, 4.25, 1.38, C, 1, 1, 1.7); b.ball(0.13, 0, 4.18, 1.72, '#e0b04e', 1, 0.9, 1.2);
        for (const s of [-1, 1]) { b.cyl(0.035, 0.035, 0.26, s * 0.08, 4.38, 1.26, '#6b4a2b', 4); b.ball(0.05, s * 0.08, 4.66, 1.26, '#4a3020'); b.box(0.2, 0.06, 0.08, s * 0.24, 4.38, 1.2, C, s * 0.3); }
        b.box(0.05, 1.7, 0.14, 0, 2.6, 0.62, '#9a5b2e', 0, 0.42);
        for (let i = 0; i < 7; i++) { const s = i % 2 ? 1 : -1, v = -0.8 + i * 0.26; b.ball(0.12, s * 0.5, 1.95 + ((i * 7) % 3) * 0.12, v, S2, 0.4, 1, 1); }
        for (let i = 0; i < 3; i++) for (const s of [-1, 1]) b.ball(0.08, s * 0.13, 2.6 + i * 0.45, 0.9 + i * 0.2, S2, 0.6, 1, 1);
        b.cyl(0.03, 0.03, 0.8, 0, 1.5, -0.88, '#9a5b2e', 4, 0, -0.2);
      });
      const zebra = (x, z, ry) => b.group(x, Y, z, ry, () => {
        const Wt = '#fafafa', K = '#2b2633';
        for (const [u, v] of [[-0.2, -0.45], [0.2, -0.45], [-0.2, 0.45], [0.2, 0.45]]) { b.cyl(0.06, 0.07, 0.75, u, 0.05, v, Wt, 5); b.cyl(0.075, 0.075, 0.12, u, 0, v, K, 5); b.cyl(0.072, 0.072, 0.08, u, 0.4, v, K, 5); }
        for (let i = 0; i < 7; i++) { const t = i / 6, r = 0.3 + Math.sin(t * Math.PI) * 0.06; b.cyl(r, r, 0.19, 0, 0.885, -0.57 + i * 0.19, i % 2 ? K : Wt, 8, 0, Math.PI / 2); }
        for (let i = 0; i < 3; i++) b.cyl(0.15 - i * 0.01, 0.18 - i * 0.01, 0.2, 0, 1.12 + i * 0.16, 0.62 + i * 0.1, i % 2 ? K : Wt, 6, 0, 0.55);
        b.box(0.22, 0.24, 0.5, 0, 1.55, 0.95, Wt, 0, 0.5); b.box(0.2, 0.2, 0.18, 0, 1.38, 1.18, K, 0, 0.5);
        b.box(0.05, 0.16, 0.55, 0, 1.45, 0.75, K, 0, 0.55); for (const s of [-1, 1]) b.cone(0.06, 0.22, s * 0.08, 1.78, 0.82, Wt, 4);
        b.cyl(0.025, 0.025, 0.6, 0, 0.6, -0.68, K, 4, 0, -0.25);
      });
      const elephant = (x, z, ry) => b.group(x, Y, z, ry, () => {
        const C = '#a9b0b8', C2 = '#9aa0a8';
        for (const [u, v] of [[-0.48, -0.65], [0.48, -0.65], [-0.48, 0.65], [0.48, 0.65]]) { b.cyl(0.24, 0.27, 1.25, u, 0, v, C2, 7); b.cyl(0.28, 0.28, 0.08, u, 0, v, '#e9e2d2', 7); }
        b.ball(1, 0, 1.8, 0, C, 0.95, 0.82, 1.3); b.ball(0.62, 0, 2.15, 1.35, C);
        for (const s of [-1, 1]) { b.cyl(0.58, 0.58, 0.07, s * 0.55, 2.1, 1.12, C2, 9, s * 0.35, 0, Math.PI / 2); b.push(new THREE.ConeGeometry(0.06, 0.55, 5), '#fbf6ea', s * 0.28, 1.6, 1.98, 0, 1.2); }
        b.cyl(0.2, 0.24, 0.65, 0, 1.55, 1.78, C, 7, 0, 0.35); b.cyl(0.15, 0.19, 0.6, 0, 0.98, 1.98, C, 7, 0, 0.12); b.cyl(0.12, 0.14, 0.4, 0, 0.6, 2.1, C2, 7, 0, -0.35);
        for (const s of [-1, 1]) b.ball(0.06, s * 0.36, 2.35, 1.82, '#2b2633');
        b.cyl(0.04, 0.04, 0.8, 0, 1.3, -1.25, C2, 4, 0, -0.3);
      });
      const deer = (x, z, ry) => b.group(x, Y, z, ry, () => {
        const C = '#c98a52', stag = rnd() < 0.35;
        for (const [u, v] of [[-0.16, -0.38], [0.16, -0.38], [-0.16, 0.38], [0.16, 0.38]]) b.cyl(0.04, 0.05, 0.75, u, 0, v, '#a8703f', 5);
        b.ball(0.4, 0, 0.92, 0, C, 0.6, 0.6, 1.25); b.ball(0.16, 0, 0.9, -0.48, '#fbf1de', 0.8, 0.8, 0.5);
        b.cyl(0.08, 0.12, 0.5, 0, 1.0, 0.42, C, 6, 0, 0.5); b.ball(0.14, 0, 1.45, 0.62, C, 0.9, 0.9, 1.5); b.ball(0.05, 0, 1.42, 0.83, '#2b2633');
        for (const s of [-1, 1]) { b.box(0.06, 0.16, 0.04, s * 0.13, 1.5, 0.55, C, 0, 0, s * 0.8); if (stag) { b.cyl(0.02, 0.025, 0.35, s * 0.07, 1.55, 0.58, '#7a5230', 4, 0, 0, -s * 0.4); b.cyl(0.015, 0.02, 0.18, s * 0.17, 1.78, 0.6, '#7a5230', 4, 0, 0.5, -s * 0.2); } }
        for (let i = 0; i < 4; i++) b.ball(0.035, (i % 2 - 0.5) * 0.3, 1.08 + (i % 2) * 0.06, -0.25 + i * 0.13, '#fbf1de');
      });
      const acacia = (x, z, s) => b.group(x, Y, z, rnd() * 6.28, () => {
        b.cyl(0.14 * s, 0.24 * s, 2.6 * s, 0, 0, 0, '#8a6a45', 6, 0, 0.12); b.cyl(0.08 * s, 0.12 * s, 1.5 * s, 0.5 * s, 2.0 * s, 0.1 * s, '#8a6a45', 5, 0, 0, -0.7); b.cyl(0.08 * s, 0.12 * s, 1.4 * s, -0.45 * s, 2.1 * s, 0.3 * s, '#8a6a45', 5, 0, 0.3, 0.6);
        b.ball(1, 0.2 * s, 3.25 * s, 0.25 * s, '#6aa443', 3.2 * s, 0.5 * s, 2.7 * s); b.ball(1, -0.4 * s, 3.6 * s, 0.1 * s, '#7cb84f', 2.2 * s, 0.42 * s, 2 * s);
      });
      const herd = (fn, n, hx, hz, r) => { let c = 0; for (let i = 0; i < n * 8 && c < n; i++) { const x = hx + (rnd() - 0.5) * r * 2, z = hz + (rnd() - 0.5) * r * 2; if (clearOf(x, z, 4)) { fn(x, z, rnd() * 6.28); c++; } } };
      herd(giraffe, 4, ...P(-30, -40), 9); herd(zebra, 7, ...P(36, 10), 9); herd(elephant, 3, ...P(42, -14), 8); herd(deer, low ? 4 : 7, ...P(-24, 42), 9); herd(deer, 3, ...P(-4, 40), 5);
      for (const [a, c, s] of [[-44, -40, 1.1], [-18, -44, 1.3], [20, -42, 0.9], [46, -44, 1.1], [-48, 10, 1.2], [30, -2, 1.0], [-4, 32, 1.0], [26, 44, 1.1], [48, 40, 1.0]]) if (clearOf(cx + a, cz + c, 3)) acacia(cx + a, cz + c, s);
      // ---- chòi lá tròn mái cong + bếp lửa trại ----
      const hut = (x, z, r, ry) => { addFootC(x, z, r + 0.4); b.group(x, Y, z, ry, () => {
        b.cyl(r + 0.25, r + 0.35, 0.3, 0, 0, 0, '#bfb4a2', 12); b.cyl(r, r, 2.0, 0, 0.3, 0, '#ecd6a6', 12);
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.2; b.cyl(0.08, 0.08, 2.1, Math.cos(a) * r, 0.3, Math.sin(a) * r, '#8a6a45', 5); }
        b.push(new THREE.CircleGeometry(0.48, 8, 0, Math.PI), '#6b4a2b', 0, 1.9, r + 0.02); b.box(0.96, 1.6, 0.1, 0, 0.3, r + 0.02, '#6b4a2b');
        roof(b, r * 3.0, r * 3.0, r * PHI * 0.62, 0, 2.15, 0, '#c99a52', 12); b.cyl(r * 1.52, r * 1.45, 0.18, 0, 2.05, 0, '#b5873f', 12); b.cyl(0.05, 0.08, 0.6, 0, 4.45, 0, '#6b4a2b', 5);
        ctx.boxes.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, top: Y + 2.4 });
      }); };
      const [fx, fz] = P(-19, 0);
      for (const [a, c, r] of [[-20, -6, 2.4], [-12, 5, 2.8], [-27, 5, 2.2]]) hut(cx + a, cz + c, r, Math.atan2(fx - cx - a, fz - cz - c));
      kit('camp_fire_stones', fx, Y, fz, 3.2, 0); for (let i = 0; i < 3; i++) b.cone(0.35 - i * 0.08, 0.9 - i * 0.2, fx + (i - 1) * 0.25, Y + 0.05, fz + (i % 2) * 0.2, i % 2 ? '#ffd36e' : '#f28c38', 5);
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + 0.4; kit('log', fx + Math.cos(a) * 2.4, Y, fz + Math.sin(a) * 2.4, 2.2, a + Math.PI / 2); }
      // ---- chòi quan sát (mái cong) ----
      const [wx, wz] = P(44, 26);
      b.group(wx, Y, wz, 0.3, () => {
        for (const [u, v] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) b.cyl(0.14, 0.18, 6.1, u, 0, v, '#8a6a45', 6);
        b.cyl(2.0, 2.0, 0.25, 0, 3.9, 0, WOOD, 12); roof(b, 5.6, 5.6, 1.7, 0, 6.05, 0, '#c99a52', 8);
        for (const s of [-0.35, 0.35]) b.cyl(0.05, 0.05, 4.4, s, 1.8, 2.3, WOOD_D, 5, 0, -0.32); for (let i = 0; i < 9; i++) b.box(0.75, 0.06, 0.08, 0, 0.3 + i * 0.45, 2.55 - i * 0.15, WOOD_D);
      });
      ctx.boxes.push({ x0: wx - 1.6, x1: wx + 1.6, z0: wz - 1.6, z1: wz + 1.6, top: Y + 4.15 }); addFootC(wx, wz, 2.2);
      // ---- lối vào phía bắc: bảng tên trên 2 cột (không cổng), đá lớn, dừa ----
      const [gx, gz] = P(5.5, -49);
      for (const s of [-1, 1]) b.cyl(0.18, 0.22, 2.6, gx + s * 2.4, Y, gz, '#7a5233', 7);
      b.box(5.4, 1.0, 0.2, gx, Y + 1.7, gz, '#8a5a34'); roof(b, 5.8, 0.9, 0.5, gx, Y + 2.7, gz, '#c99a52');
      signAt(b, atlas.sign('CÔNG VIÊN SAFARI', '#3f6b2a', '#fff', '#e8c45a'), 5.0, 0.6, gx, Y + 2.2, gz - 0.12, Math.PI);
      for (const s of [-1, 1]) { const [rx, rz] = P(s * 9, -47); kit('rock_tall', rx, Y, rz, 2.2, rnd() * 6, true); kit('plant_palm_bend', rx + s * 3, Y, rz + 2, 1.1, rnd() * 6, true); }
      // ---- cây: dừa, tán rộng, bụi; vành bụi + đá ven mép (thay hàng rào) ----
      for (let i = 0, c = 0; i < 160 && c < (low ? 18 : 30); i++) {
        const x = x0 + 5 + rnd() * (x1 - x0 - 10), z = z0 + 5 + rnd() * (z1 - z0 - 10); if (!clearOf(x, z, 5) || Math.hypot(x - fx, z - fz) < 12) continue; c++;
        if (c % 3 === 0) palmAt(x, z, Y, 1.0); else if (c % 3 === 1) kit(c % 2 ? 'tree_fat' : 'tree_oak', x, Y, z, 4.2 + rnd() * 1.4, rnd() * 6, true); else kit(c % 2 ? 'bush_large' : 'bush', x, Y, z, 6 + rnd() * 3);
      }
      let c2 = 0; for (let t = 0; t < 1; t += low ? 0.025 : 0.016) {
        const a = t * 6.28, x = cx + Math.cos(a) * (x1 - x0) * 0.47, z = cz + Math.sin(a) * (z1 - z0) * 0.47; if (Math.abs(x - cx) < 8 && z < cz || !clearOf(x, z, 3)) continue;
        if (rnd() < 0.72) kit('bush_large', x + (rnd() - 0.5) * 3, Y - 0.05, z + (rnd() - 0.5) * 3, 6 + rnd() * 4); else kit(['rock_shore_a', 'rock_shore_c'][c2++ % 2], x, Y - 0.4, z, 0.3 + rnd() * 0.2);
      }
    });
  }

  // ================= G. HỌC VIỆN HOA PHƯỢNG (lối vào góc đông bắc, tòa chính phía nam nhìn ra sân phun nước) =================
  if (ZR.G) {
    const b = B.G = new Batch('G'), [x0, z0, x1, z1] = ZR.G, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, OR = '#d9683f';
    const fish = (x, z, ry, s = 1) => { addFootC(x, z, 1.6 * s); b.group(x, Y, z, ry, () => {
      const C = '#4f9a4a'; b.cyl(0.9 * s, 1.0 * s, 0.5 * s, 0, 0, 0, '#3f8a3a', 10); b.cyl(0.12 * s, 0.16 * s, 0.6 * s, 0, 0.5 * s, 0, '#6b4a2b', 5);
      b.ball(1, 0, 1.55 * s, 0.25 * s, C, 0.55 * s, 0.85 * s, 1.35 * s);
      b.push(new THREE.ConeGeometry(0.8, 1.1, 5), C, 0, 1.6 * s, -1.55 * s, 0, Math.PI / 2, 0, 0.22 * s, s, s);
      b.push(new THREE.ConeGeometry(0.45, 0.8, 5), C, 0, 2.45 * s, 0.1 * s, 0, -0.5, 0, 0.18 * s, s, s);
      for (const t of [-1, 1]) b.ball(0.11 * s, t * 0.48 * s, 1.75 * s, 1.15 * s, '#ffffff');
    }); };
    measure(b, 'academy', () => {
      rrect(G0, x0, z0, x1, z1, 10, GRASS);
      // tòa chính đối xứng (mặt tiền hướng bắc) + sảnh cột mái cong
      const mz = cz + 13;
      for (const s of [-1, 1]) blk(b, cx + s * 12.5, mz + 7, 13, 11, 7.0);
      blk(b, cx, mz, 19, 9, 7.0);
      const pz = mz - 4.5;
      b.box(10, 0.35, 4.2, cx, Y, pz - 2.1, '#e2dccc'); for (let i = 0; i < 3; i++) b.box(10, 0.15 - i * 0.04, 0.5, cx, Y, pz - 4.45 - i * 0.45, '#d8cfbf');
      for (const u of [-3.9, -1.3, 1.3, 3.9]) { b.cyl(0.26, 0.3, 4.0, cx + u, Y + 0.35, pz - 3.7, '#ffffff', 10); b.cyl(0.36, 0.3, 0.2, cx + u, Y + 4.25, pz - 3.7, '#ffffff', 10); }
      b.box(9.6, 0.5, 4.4, cx, Y + 4.4, pz - 2.0, '#ffffff'); roof(b, 10.8, 5.4, 1.5, cx, Y + 4.9, pz - 2.0, OR);
      signAt(b, atlas.sign('HỌC VIỆN HOA PHƯỢNG', '#8a2b1e', '#fff3c4', '#e9b949'), 5.6, 0.55, cx, Y + 4.65, pz - 4.23, Math.PI);
      b.cyl(1.1, 1.1, 1.2, cx, Y + 7.0, mz, '#ffffff', 12); domeTop(b, 1.25, 1.4, cx, Y + 8.2, mz, OR, 12); b.cyl(0.04, 0.04, 1.4, cx, Y + 9.5, mz, POST, 4);
      // sân phun nước bát giác 2 tầng, trục lát gạch bắc–nam, đường ngang đông–tây
      const fz = cz - 8;
      G0.box(8, 0.04, mz - 9 - z0, cx, Y + 0.01, (z0 + mz - 9) / 2, '#ece4d2'); for (const s of [-1, 1]) G0.box(0.3, 0.06, mz - 9 - z0, cx + s * 4.1, Y + 0.01, (z0 + mz - 9) / 2, '#c9b79a');
      G0.box(x1 - (x0 + 26) - 4, 0.04, 5, (x1 - 4 + x0 + 26) / 2, Y + 0.012, fz, '#ece4d2');
      for (let z = z0 + 1; z < mz - 9; z += 1.2) DG.box(7.8, 0.012, 0.05, cx, Y + 0.05, z, '#d6cbb4');
      disc(G0, 7.5, cx, Y + 0.014, fz, '#e9e2d2', 24); disc(G0, 6.2, cx, Y + 0.018, fz, '#d8cfbf', 24);
      b.cyl(3.6, 3.8, 0.6, cx, Y, fz, '#e2dccc', 16); disc(b, 3.25, cx, Y + 0.5, fz, '#6fd3ec', 16);
      b.cyl(0.4, 0.6, 1.5, cx, Y, fz, '#e2dccc', 10); b.cyl(1.5, 0.5, 0.35, cx, Y + 1.4, fz, '#e2dccc', 12); disc(b, 1.35, cx, Y + 1.74, fz, '#8fe0f2', 12);
      b.cyl(0.18, 0.28, 0.7, cx, Y + 1.74, fz, '#e2dccc', 8); b.cyl(0.7, 0.25, 0.22, cx, Y + 2.4, fz, '#e2dccc', 10);
      b.cone(0.18, 1.0, cx, Y + 2.6, fz, '#cdf3fb', 6); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; b.cone(0.1, 0.6, cx + Math.cos(a) * 1.1, Y + 1.76, fz + Math.sin(a) * 1.1, '#cdf3fb', 4); }
      ctx.boxes.push({ x0: cx - 3.6, x1: cx + 3.6, z0: fz - 3.6, z1: fz + 3.6, top: Y + 0.6 }); addFootC(cx, fz, 7.5);
      for (const [dx, dz, ry] of [[-11.5, -4, 2.5], [11.5, -4, -2.5], [-11.5, 4.5, 0.6], [11.5, 4.5, -0.6]]) fish(cx + dx, fz + dz, ry, 0.9);
      // hàng phượng đỏ dọc trục, dọc đường ngang, bìa bắc; bụi tròn thấp dọc trục
      for (let z = z0 + 4; z < fz - 9; z += 5) for (const s of [-1, 1]) { trees.push([cx + s * 7.8, z, 'phuong', 1.25]); DG.ball(0.7, cx + s * 5.4, Y + 0.45, z + 2.5, '#5aa04a', 1, 0.7, 1.4); }
      for (let x = x0 + 30; x < x1 - 5; x += 8) if (Math.abs(x - cx) > 15) for (const s of [-1, 1]) trees.push([x, fz + s * 3.6, 'phuong', 1.1]);
      for (let i = 0; i < 16; i++) { const x = x0 + 4 + i * (x1 - x0 - 8) / 15; if (Math.abs(x - cx) > 12 && x < x1 - 14) trees.push([x, z0 + 2.5, i % 2 ? 'phuong' : 'leaf', 1.15]); }
      for (let z = fz + 9; z < mz - 9; z += 6) for (const s of [-1, 1]) { const lx = cx + s * 4.4; b.cyl(0.07, 0.1, 3.0, lx, Y, z, '#f4f1e8', 6); DG.glow(() => DG.ball(0.24, lx, Y + 3.2, z, '#fff3c4')); }
      // lối vào từ góc đông bắc (đường từ trường) uốn về sân trước
      const entry = curve([[x1 - 1, z0 + 1.5], [x1 - 14, z0 + 7], [cx + 26, z0 + 9], [cx + 5, z0 + 7]], 34);
      ribbon(G0, entry, 5, Y + 0.016, '#ece4d2'); ribbon(G0, entry, 5.6, Y + 0.012, '#c9b79a');
      // khu tây: 2 sân tennis (không lồng rào) + nhà nội trú dài
      for (let i = 0; i < 2; i++) {
        const tx = x0 + 8 + i * 10, tz = cz - 18;
        G0.box(9, 0.03, 16.5, tx, Y + 0.01, tz, '#5aa86a'); G0.box(6.2, 0.04, 12, tx, Y + 0.015, tz, '#3f8fc8');
        for (const [w, d, ox, oz] of [[6.2, 0.08, 0, -5.96], [6.2, 0.08, 0, 5.96], [0.08, 12, -3.06, 0], [0.08, 12, 3.06, 0], [0.08, 12, -2.3, 0], [0.08, 12, 2.3, 0], [4.6, 0.08, 0, -3.2], [4.6, 0.08, 0, 3.2], [0.08, 6.4, 0, 0]]) G0.box(w, 0.05, d, tx + ox, Y + 0.02, tz + oz, '#ffffff');
        b.box(6.8, 0.9, 0.04, tx, Y, tz, '#2b2633'); b.box(6.8, 0.08, 0.06, tx, Y + 0.88, tz, '#ffffff'); for (const s of [-1, 1]) b.cyl(0.05, 0.05, 1.05, tx + s * 3.45, Y, tz, '#ffffff', 5);
        addFoot(tx - 4.5, tz - 8.25, tx + 4.5, tz + 8.25);
      }
      kit('prop_bench', x0 + 13, Y, cz - 7.5, 1.6, 0); kit('prop_bench', x0 + 13, Y, cz - 28.5, 1.6, Math.PI);
      blk(b, x0 + 14, cz + 16, 20, 8, 5.2);
      // khu đông: thư viện tròn mái vòm + vườn tròn có bồn hoa
      { const lx = x1 - 18, lz = cz - 14, r = 6; addFootC(lx, lz, r + 1);
        b.cyl(r + 0.4, r + 0.5, 0.45, lx, Y, lz, '#d8cfbf', 20); b.cyl(r, r, 4.2, lx, Y + 0.45, lz, '#fbf1de', 20); b.cyl(r + 0.2, r + 0.2, 0.3, lx, Y + 4.4, lz, '#ffffff', 20);
        for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; b.cyl(0.2, 0.22, 4.2, lx + Math.cos(a) * (r + 0.05), Y + 0.45, lz + Math.sin(a) * (r + 0.05), '#ffffff', 6); DG.plane(1.0, 2.4, lx + Math.cos(a + 0.26) * (r + 0.03), Y + 1.4, lz + Math.sin(a + 0.26) * (r + 0.03), '#5f9cc8', Math.PI / 2 - a - 0.26); }
        domeTop(b, r + 0.3, 3.6, lx, Y + 4.7, lz, OR, 16); domeTop(b, 0.8, 0.8, lx, Y + 8.2, lz, '#fff3c4', 10);
        ctx.boxes.push({ x0: lx - r, x1: lx + r, z0: lz - r, z1: lz + r, top: Y + 4.7 }); }
      { const gx = x1 - 18, gz = cz + 14; disc(G0, 7, gx, Y + 0.012, gz, '#bfe39a', 24); disc(G0, 2, gx, Y + 0.016, gz, '#e9e2d2', 12); addFootC(gx, gz, 2.5);
        for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; b.ball(0.65, gx + Math.cos(a) * 4.8, Y + 0.4, gz + Math.sin(a) * 4.8, '#4f9a4a', 1, 0.8, 1); DG.ball(0.2, gx + Math.cos(a) * 4.8, Y + 0.95, gz + Math.sin(a) * 4.8, ['#e85d8a', '#f5c518', '#e8453c'][i % 3]); }
        trees.push([gx, gz, 'phuong', 1.4]); }
      // dãy biệt thự mái cam phía nam (giáp tòa chính hai bên), bụi hoa trước nhà thay hàng rào
      for (let x = x0 + 8; x < x1 - 4; x += 12.5) {
        if (Math.abs(x - cx) < 24) continue; const vz = z1 - 6.5;
        blk(b, x, vz, 7.5, 6, 4.6); b.box(2.4, 0.15, 1.6, x, Y + 2.3, vz - 3.7, '#ffffff'); for (const s of [-1, 1]) b.cyl(0.09, 0.09, 2.3, x + s * 1.05, Y, vz - 4.4, '#ffffff', 6);
        for (const s of [-1, 1]) { kit('bush_large', x + s * 3.4, Y, vz - 5.4, 6); DG.ball(0.18, x + s * 3.4, Y + 1.05, vz - 5.4, ['#e85d8a', '#f5c518'][(x | 0) % 2 ? 0 : 1]); }
      }
    });
  }

  // ================= H. RESORT BIỂN XANH (lối vào phía đông, biển phía tây) =================
  if (ZR.H) {
    const b = B.H = new Batch('H'), [x0, z0, x1, z1] = ZR.H, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, sandX = x0 + 32;
    const lounger = (x, z, ry, towel) => { DG.box(0.65, 0.25, 1.8, x, Y, z, '#ffffff', ry); DG.box(0.62, 0.55, 0.12, x - Math.sin(ry) * 0.8, Y + 0.3, z - Math.cos(ry) * 0.8, '#ffffff', ry, -0.6); DG.box(0.5, 0.04, 1.2, x, Y + 0.26, z, towel, ry); };
    const gazebo = (x, z, r, roofC = '#6f4e33') => {
      addFootC(x, z, r + 0.5);
      b.cyl(r, r, 0.4, x, Y, z, WOOD, 16); for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * 6.28; b.cyl(0.11, 0.11, 2.5, x + Math.cos(a) * (r - 0.3), Y + 0.4, z + Math.sin(a) * (r - 0.3), '#f4f1e8', 6); }
      roof(b, (r + 0.9) * 2, (r + 0.9) * 2, (r + 0.9) / PHI, x, Y + 2.85, z, roofC, 8); domeTop(b, 0.3, 0.4, x, Y + 5.12, z, '#f5c518', 8);
      b.cyl(1.0, 1.0, 0.08, x, Y + 0.85, z, '#ffffff', 12); b.cyl(0.08, 0.08, 0.45, x, Y + 0.4, z, '#ffffff', 5);
      ctx.boxes.push({ x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6, top: Y + 0.95 });
    };
    measure(b, 'resort', () => {
      rrect(G0, sandX - 2, z0, x1, z1, 8, GRASS); rrect(G0, x0, z0, sandX, z1, 6, SAND, Y + 0.012);
      for (let z = z0 + 2; z < z1 - 1; z += 2.4) G0.box(1.6, 0.03, 2.2, sandX - 0.8 + Math.sin(z) * 0.6, Y + 0.016, z, '#e8c391');
      // ---- khách sạn bậc thang kính (đầu bo tròn), mỗi bậc một dải cây xanh; mặt tiền nhìn ra biển (tây) ----
      const hx = x1 - 9;
      b.group(hx, Y, cz, -Math.PI / 2, () => {
        for (let i = 0; i < 5; i++) {
          const w = 34 - i * 2.4, d = 11 - i * 1.8, y0 = i * 2.9, zc = d / 2;
          b.box(w, 2.9, d, 0, y0, zc, '#ffffff'); for (const s of [-1, 1]) b.cyl(d / 2, d / 2, 2.9, s * w / 2, y0, zc, '#ffffff', 14);
          b.box(w + 0.3, 0.22, d + 0.3, 0, y0 + 2.75, zc, '#eef3f6'); for (const s of [-1, 1]) b.cyl(d / 2 + 0.15, d / 2 + 0.15, 0.22, s * w / 2, y0 + 2.75, zc, '#eef3f6', 14);
          b.plane(w - 0.6, 2.1, 0, y0 + 1.4, d + 0.02, i % 2 ? '#8fd0ea' : '#7fc4e8');
          for (const s of [-1, 1]) b.push(new THREE.CylinderGeometry(d / 2 + 0.02, d / 2 + 0.02, 2.1, 10, 1, true, s > 0 ? 0 : Math.PI, Math.PI), '#a9dcf2', s * w / 2, y0 + 1.4, zc);
          b.box(w - 0.4, 0.5, 0.5, 0, y0 + 2.9, d - 0.25, '#e2dccc'); b.box(w - 0.6, 0.14, 0.42, 0, y0 + 3.36, d - 0.25, '#6fb85a');
        }
        b.box(24, 0.15, 2.2, 0, 14.6, 1.6, '#f4f1e8'); for (let u = -11; u <= 11; u += 2.75) b.cyl(0.08, 0.08, 1.8, u, 14.5, 2.6, '#f4f1e8', 6);
        for (let u = -11; u <= 11; u += 1.375) b.box(0.12, 0.12, 2.4, u, 16.3, 1.8, '#f4f1e8');
        b.box(8, 0.25, 3.5, 0, 2.9, 12.6, '#ffffff'); for (const s of [-1, 1]) b.cyl(0.14, 0.14, 2.9, s * 3.6, 0, 13.9, '#ffffff', 8);
      });
      for (let i = 0; i < 5; i++) { const w = 34 - i * 2.4, d = 11 - i * 1.8; for (let u = -w / 2 + 0.4; u <= w / 2 - 0.4; u += 2) DG.box(0.06, 2.1, 0.12, hx - d - 0.05, Y + i * 2.9 + 0.35, cz + u, '#ffffff'); for (let u = -w / 2 + 1; u < w / 2 - 0.5; u += 1.6) DG.ball(0.32, hx - d + 0.25, Y + i * 2.9 + 3.55, cz + u, ((u * 7 + i) | 0) % 3 === 0 ? '#e85d8a' : '#5aa04a', 1, 0.8, 1); }
      signAt(b, atlas.sign('RESORT BIỂN XANH', '#1d5c7a', '#fff', '#ffd36e'), 5.6, 0.6, hx - 14.36, Y + 3.45, cz, -Math.PI / 2);
      ctx.boxes.push({ x0: hx - 11, x1: hx, z0: cz - 22.5, z1: cz + 22.5, top: Y + 14.5 });
      // sảnh đón khách tròn phía đông (giáp đường từ trường)
      { const lx = x1 - 2.2, lz = cz; b.cyl(3.6, 3.6, 3.2, lx - 2, Y, lz, '#f4f6f8', 16); domeTop(b, 3.8, 2.2, lx - 2, Y + 3.2, lz, '#6fb85a', 16); b.push(new THREE.CylinderGeometry(3.62, 3.62, 2.2, 10, 1, true, 0.4, 2.3), '#8fd0ea', lx - 2, Y + 1.5, lz); }
      // ---- hồ bơi uốn lượn (Bezier) + đảo nhỏ có dừa + chòi bên hồ ----
      const sh = new THREE.Shape(); sh.moveTo(-17, 0); sh.bezierCurveTo(-17, -5, -9, -6.5, -4, -3.5); sh.bezierCurveTo(0, -1, 5, -6.5, 11, -5.5); sh.bezierCurveTo(17.5, -4.5, 18.5, 3, 12, 4.2); sh.bezierCurveTo(6, 5.5, 3, 2, -2, 4.2); sh.bezierCurveTo(-7, 6.5, -17, 5, -17, 0);
      const pg = new THREE.ShapeGeometry(sh, 12), px = hx - 34, pz = cz;
      flat(G0, pg, '#efe6d6', px, Y + 0.02, pz, 1.18, 1.35, Math.PI / 2); flat(G0, pg, '#ffffff', px, Y + 0.035, pz, 1.04, 1.06, Math.PI / 2); flat(G0, pg, '#5fd8e6', px, Y + 0.05, pz, 1, 1, Math.PI / 2); flat(G0, pg, '#86e6ef', px - 1, Y + 0.055, pz, 0.6, 0.45, Math.PI / 2);
      addFoot(px - 8.8, pz - 21.8, px + 8.8, pz + 21.8);
      disc(b, 1.6, px - 3.6, Y + 0.08, pz - 5, SAND, 12); kit('plant_palm_bend', px - 3.6, Y, pz - 5, 0.9, 1, true);
      G0.box(7.2, 0.03, 38, px - 11.2, Y + 0.014, pz, '#ead9b8'); for (let z = pz - 18.4; z < pz + 18.5; z += 2.6) G0.box(7.2, 0.02, 0.06, px - 11.2, Y + 0.03, z, '#d8c49e');   // sàn cát lát quanh hồ: ghế & dù không đứng trên cỏ
      for (let i = 0; i < 9; i++) lounger(px - 10.5, pz - 16 + i * 4, Math.PI / 2, ['#7fd0e8', '#f6c7c0', '#f7e3a1'][i % 3]);
      for (let i = 0; i < 4; i++) kit('prop_beach_umbrella', px - 12, Y, pz - 14 + i * 9.5, 0.8, rnd() * 6);
      gazebo(px + 6, pz + 26, 2.6, '#3f8f9a');
      // ---- bãi biển: chòi bát giác mái cong, dù, ghế nằm, lưới bóng chuyền ----
      gazebo(x0 + 8, z0 + 8, 3.6); gazebo(x0 + 8, z1 - 8, 3.6);
      for (let i = 0; i < 8; i++) { const uz = z0 + 18 + i * 3.4 + (i > 3 ? 4 : 0), ux = x0 + 12 + (i % 2) * 8; kit('prop_beach_umbrella', ux, Y, uz, 1.0, rnd() * 6); lounger(ux + 0.6, uz - 1.1, -Math.PI / 2 + 0.15, '#7fd0e8'); lounger(ux + 0.6, uz + 1.1, -Math.PI / 2 - 0.15, '#f7e3a1'); }
      kit('sport_net', x0 + 24, Y, z1 - 6, 1.3, 0);
      for (let i = 0; i < 18; i++) kit('plant_beach_grass', x0 + 2 + rnd() * 26, Y, z0 + 2 + rnd() * (z1 - z0 - 4), 1.3 + rnd(), rnd() * 6);
      // ---- biệt thự mái ngói (model kit) hai bên, quay vào hồ ----
      const HS = ['house_suburb_a_warm', 'house_suburb_c_warm', 'house_suburb_h_warm', 'house_suburb_i_warm'];
      let hi = 0; for (let x = sandX + 6; x < hx - 13; x += 12) for (const s of [-1, 1]) { const z = cz + s * (z1 - z0) * 0.41; kit(HS[hi++ % 4], x, Y, z, 5.6, s < 0 ? 0 : Math.PI, true); ctx.boxes.push({ x0: x - 3.6, x1: x + 3.6, z0: z - 2.9, z1: z + 2.9, top: Y + 4.5 }); kit('bush_large', x + 4.6, Y, z, 5); }
      for (let i = 0; i < 14; i++) palmAt(sandX - 3 + rnd() * 5, z0 + 3 + rnd() * (z1 - z0 - 6), Y, 1.1);
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) palmAt(px + 12 + i * 6, cz + s * 25.5, Y, 0.95);
      // ---- bến thuyền nhỏ phía tây (qua gò bờ biển) ----
      let sx = 0; for (let x = x0; x > x0 - 50; x -= 0.5) if (ctx.terrain.heightAt(x, cz + 6) < 0.6) { sx = x + 1.5; break; }
      if (sx) {
        const hz = cz + 6; for (let x = x0 + 0.5; x > sx; x -= 1.1) b.box(0.8, 0.14, 2.6, x, ctx.terrain.heightAt(x, hz) - 0.04, hz, '#c9a06a');
        walkway(b, [[sx, hz], [sx - 22, hz]], 2.6, 1.3, { lampEvery: 8 }); walkway(b, [[sx - 18, hz + 1.3], [sx - 18, hz + 8]], 1.8, 1.3);
        boat(sx - 20.5, hz + 5, 0, 'boat_sail_a'); boat(sx - 10, hz - 4, Math.PI / 2 + 0.2, 'boat_row');
        platform(b, sx - 8, hz - 3.4, 2.4, 1.3); b.cyl(1.7, 1.7, 2.0, sx - 8, 1.3, hz - 3.4, '#bfe6d6', 12); roof(b, 4.6, 4.6, 1.3, sx - 8, 3.3, hz - 3.4, '#d9683f', 8);
      }
    });
  }

  // ================= BÃI BIỂN CHUNG: cầu gỗ ngắn có đèn lồng, đá bờ, cỏ biển =================
  {
    const H = (x, z) => ctx.terrain.heightAt(x, z), inZone = (x, z, m) => k.ALL.some(r => x > r[0] - m && x < r[2] + m && z > r[1] - m && z < r[3] + m);
    const b = B.beach = new Batch('beach');
    let made = 0;
    for (let j = 0; j < 16 && made < (low ? 3 : 5); j++) {
      const a = j / 16 * 6.28 + 0.2, ux = Math.cos(a), uz = Math.sin(a); let prev = 2, sx = null, sz = 0;
      for (let r = 150; r < 340; r += 0.5) { const x = ux * r, z = uz * r, h = H(x, z); if (prev > 0.5 && h < 0.15) { sx = x - ux * 3; sz = z - uz * 3; break; } prev = h; }
      if (sx === null || H(sx, sz) > 1.6 || inZone(sx, sz, 14) || inZone(sx + ux * 14, sz + uz * 14, 8)) continue;
      const y = Math.max(1.0, H(sx, sz) + 0.25), ex = sx + ux * 14, ez = sz + uz * 14;
      walkway(b, [[sx, sz], [ex, ez]], 2.2, y, { lampEvery: 4 });
      for (const s of [-1, 1]) { b.cyl(0.13, 0.13, y + 3.2, ex - uz * s * 1.05, -2, ez + ux * s * 1.05, POST, 6); DG.glow(() => DG.cyl(0.16, 0.16, 0.42, ex - uz * s * 1.05, y + 1.75, ez + ux * s * 1.05, LAMP, 6)); }
      boat(ex + uz * 2.8, ez - ux * 2.8, Math.atan2(ux, uz), ['boat_row', 'boat_sail_b', 'boat_row', 'boat_sail_a', 'boat_row'][made]);
      kit('prop_swim_ring', sx + ux * 6 - uz * 1.2, y + 0.02, sz + uz * 6 + ux * 1.2, 0.8, rnd() * 6);
      made++;
    }
    for (let i = 0, c = 0; i < 1500 && c < (low ? 30 : 60); i++) {
      const a = rnd() * 6.28, r = 230 + rnd() * 100, x = Math.cos(a) * r, z = Math.sin(a) * r, h = H(x, z); if (h < -0.8 || h > 0.7 || inZone(x, z, 3)) continue; c++;
      kit(['rock_shore_a', 'rock_shore_b', 'rock_shore_c'][c % 3], x, h - 0.3, z, 0.35 + rnd() * 0.45, rnd() * 6.28, c % 4 === 0);
    }
    for (let i = 0, c = 0; i < 1500 && c < (low ? 40 : 90); i++) {
      const a = rnd() * 6.28, r = 220 + rnd() * 100, x = Math.cos(a) * r, z = Math.sin(a) * r, h = H(x, z); if (h < 0.5 || h > 2.2 || inZone(x, z, 2)) continue; c++;
      kit('plant_beach_grass', x, h - 0.05, z, 1.2 + rnd() * 0.8);
    }
  }

  // cây/bụi/dừa của 4 khu → hệ thiên nhiên chung (terrain.nature: model CC0 Quaternius, LOD, lọc theo hướng camera); k = đổi tỷ lệ model cũ → mới
  const NAT = { tree_fat: ['fat', 1], tree_oak: ['oak', 1], bush_large: ['bush', 1], bush: ['bush', 1], plant_palm_straight: ['palm', 2.6], plant_palm_bend: ['palmB', 2.6] }, nat = {};
  for (let i = kits.length - 1; i >= 0; i--) { const [name, t] = kits[i], m = NAT[name]; if (!m) continue; (nat[m[0]] ||= []).push([t[0], t[1], t[2], t[3] * m[1], t[4]]); kits.splice(i, 1); }
  const byName = new Map();
  for (const [name, t, sh] of kits) { const key = name + (sh ? '|s' : ''); if (!byName.has(key)) byName.set(key, []); byName.get(key).push(t); }
  return {
    boats,
    place: scene => { for (const k of Object.keys(nat)) ctx.terrain.nature.add(k, nat[k]); return Promise.all([...byName].map(([key, list]) => placeKitCells(scene, key.split('|')[0], list, 70, { shadow: key.endsWith('|s') }))); },
  };
}

// Cây dừa: model CC0 Quaternius (2 dáng) qua terrain.nature — instancing + LOD gần/xa + lọc theo hướng camera; cao ~4,4 m × s (trước ~5,5 m, quá to)
export function placePalms(terrain, palms) {
  const L = [[], []]; palms.forEach((q, i) => L[i % 3 === 0 ? 0 : 1].push([q.x, q.y, q.z, q.s * 3.2, q.ry]));
  terrain.nature.add('palm', L[0]); terrain.nature.add('palmB', L[1]);
}

// Thuyền neo (model kit): nhấp nhô + lắc nhẹ bằng cách cập nhật ma trận instance mỗi khung
export function buildBoats(scene, list) {
  const parts = [], o = new THREE.Object3D(), inv = new THREE.Matrix4(), m = new THREE.Matrix4();
  const byName = new Map(); list.forEach(q => { if (!byName.has(q[3])) byName.set(q[3], []); byName.get(q[3]).push(q); });
  for (const [name, L] of byName) placeKit(scene, name, L.map(([x, z, ry, , s]) => [x, -0.05, z, s, ry])).then(ims => {
    for (const im of ims) {
      im.frustumCulled = false; im.getMatrixAt(0, m); const [x, z, ry, , s] = L[0];
      o.position.set(x, -0.05, z); o.rotation.set(0, ry, 0); o.scale.setScalar(s); o.updateMatrix(); inv.copy(o.matrix).invert();
      parts.push({ im, L, local: inv.clone().multiply(m) });       // ma trận riêng của phần model (bỏ vị trí đặt)
    }
  });
  return { update(t) {
    for (const p of parts) {
      p.L.forEach(([x, z, ry, , s], i) => { const k = i + x * 0.13; o.position.set(x, -0.05 + Math.sin(t * 1.4 + k) * 0.08, z); o.rotation.set(Math.sin(t * 0.9 + k) * 0.03, ry, Math.sin(t * 1.1 + k * 2) * 0.05); o.scale.setScalar(s); o.updateMatrix(); m.multiplyMatrices(o.matrix, p.local); p.im.setMatrixAt(i, m); });
      p.im.instanceMatrix.needsUpdate = true;
    }
  } };
}
