// academy/kit.js — BỘ MÔ-ĐUN LÂU ĐÀI (greybox): dãy nhà (tường + mái hai dốc + ô cửa sổ), tháp tròn + mái nón nhọn, khối chồng lớp,
// tháp góc nhỏ, tường thành răng cưa, tháp canh, cầu / cầu cạn nhiều nhịp vòm. Bước (d) chỉ cần thay hình trong file này.
// Toạ độ cục bộ (plan.js): u = +z, v = +x; mesh: x = v, z = u, y tuyệt đối.
// Gộp: khối → Batch (1 geometry tô màu đỉnh / nhóm vật liệu); mô-đun lặp nhiều lần giống hệt (răng cưa, nhịp vòm) → instancing.
import * as THREE from 'three';
import { PHI } from './plan.js';

export const COL = { wall: '#9f9a92', wallD: '#7f7a73', roof: '#3f4a56', roofG: '#4f6f66', wood: '#6e4a30', woodL: '#a8744a', floor: '#8d857a', pave: '#b3aca0' };
const lerp = (a, b, t) => a + (b - a) * t;

// ô cửa sổ nhọn Gothic: thân 1,2 × 3 m + chóp tháp 4 mặt; dẹt theo pháp tuyến tường
const PYR_U = new THREE.ConeGeometry(0.85, 0.95, 4).rotateY(Math.PI / 4).scale(1, 1, 0.14), PYR_V = new THREE.ConeGeometry(0.85, 0.95, 4).rotateY(Math.PI / 4).scale(0.14, 1, 1);

/** Nhịp vòm bán nguyệt: tấm rộng S, cao H, dày t; lòng vòm rộng S − 2p (trụ 2p), đỉnh lòng vòm thấp hơn mặt trên 1,2 m. Gốc = giữa đáy. */
export function archGeo(S, H, p, t) {
  const a = S / 2 - p, ys = Math.max(0.5, H - 1.2 - a), sh = new THREE.Shape();
  sh.moveTo(-S / 2, 0); sh.lineTo(-a, 0); sh.lineTo(-a, ys); sh.absarc(0, ys, a, Math.PI, 0, true); sh.lineTo(a, 0); sh.lineTo(S / 2, 0); sh.lineTo(S / 2, H); sh.lineTo(-S / 2, H); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 8 }); g.translate(0, 0, -t / 2); g.deleteAttribute('uv'); return g;
}
export const ARCH = { S: 13, H: 9, p: 1.3 };
export const MERLON = new THREE.BoxGeometry(1.05, 1.3, 0.6);
export const ARCH_GEO = archGeo(ARCH.S, ARCH.H, ARCH.p, 5.4);   // cầu rộng 5 m (w 2,5) + gờ 0,2 m mỗi bên

/**
 * Tạo bộ dựng mô-đun trên các batch B = { wall, roof, glow, glass, win, det }.
 * opt: { far (bóng xa: bớt chi tiết), Y (mặt cao nguyên), ground(u, v) (độ cao đất, cho chân trụ cầu) }
 * Trả về các hàm dựng + kết quả chung: boxes (va chạm cục bộ), tips (chóp tháp cắm cờ), decks (mặt đi trên cao), inst (ma trận instancing).
 */
export function makeKit(B, { far = false, Y, ground }) {
  const { wall, roof } = B, win = B.win, det = far ? null : B.det, seg = far ? 6 : 10;
  const boxes = [], tips = [], decks = [], inst = { merlon: [], arch: [] };
  const solid = (u0, u1, v0, v1, top) => { if (!far) boxes.push({ u0, u1, v0, v1, top }); };
  // cửa sổ trên mặt tường: axis 'u' = mặt vuông góc trục u (tường chạy dọc v)
  const winAt = (axis, fixed, side, a, y0, w = 1.2, hh = 3) => {
    if (!win) return; const f = fixed + side * (far ? 0.6 : 0.1);
    if (axis === 'u') { win.box(a - w / 2, a + w / 2, y0, y0 + hh, f - 0.07, f + 0.07, '#ffffff'); win.add(PYR_U, '#ffffff', a, y0 + hh + 0.47, f); }
    else { win.box(f - 0.07, f + 0.07, y0, y0 + hh, a - w / 2, a + w / 2, '#ffffff'); win.add(PYR_V, '#ffffff', f, y0 + hh + 0.47, a); }
  };
  // instancing (gần) hoặc gộp vào khối (bóng xa)
  const put = (kind, geo, col, x, y, z, ry = 0, rx = 0, rz = 0, sx = 1) => { if (far) wall.add(geo, col, x, y, z, ry, rx, rz, sx); else inst[kind].push([x, y, z, rx, ry, rz, sx]); };

  /** Dãy nhà dọc trục u hoặc v, có các khoảng hở (cửa) [a, b] dọc chiều dài, cao cửa dh; outer = ±1: mặt ngoài có trụ chống */
  const range = (u0, u1, v0, v1, h, rh, gaps = [], dh = 8, outer = 0) => {
    const alongV = v1 - v0 > u1 - u0, a0 = alongV ? v0 : u0, a1 = alongV ? v1 : u1;
    // cửa sổ 2 mặt dài: 2 hàng (dãy cao 21 m) / 1 hàng (13 m); cách nhau 4,2 m (bóng xa: 8,4 m, 1 hàng)
    const rows = far ? [Y + 4] : h > 15 ? [Y + 3.4, Y + 11] : [Y + 4.2], stp = far ? 8.4 : 4.2;
    for (let a = a0 + 8; a <= a1 - 8; a += stp) {
      if (gaps.some(([g0, g1]) => a > g0 - 1.6 && a < g1 + 1.6)) continue;
      for (const y of rows) { if (alongV) { winAt('u', u0, -1, a, y); winAt('u', u1, 1, a, y); } else { winAt('v', v0, -1, a, y); winAt('v', v1, 1, a, y); } }
    }
    if (det) {
      det.box(v0 - 0.4, v1 + 0.4, Y - 1, Y + 1.4, u0 - 0.4, u1 + 0.4, '#6f7466');                                   // chân tường rêu
      if (outer) for (let a = a0 + 6.3; a <= a1 - 6; a += 8.4) {                                                     // trụ chống + tháp nhọn nhỏ
        if (gaps.some(([g0, g1]) => a > g0 - 1 && a < g1 + 1)) continue;
        if (alongV) { const f = outer > 0 ? u1 : u0; det.box(a - 0.5, a + 0.5, Y - 2, Y + 15, Math.min(f, f + outer * 1.2), Math.max(f, f + outer * 1.2), COL.wallD); det.cone(a, Y + 15, f + outer * 0.6, 0.55, 2.6, COL.roof); }
        else { const f = outer > 0 ? v1 : v0; det.box(Math.min(f, f + outer * 1.2), Math.max(f, f + outer * 1.2), Y - 2, Y + 15, a - 0.5, a + 0.5, COL.wallD); det.cone(f + outer * 0.6, Y + 15, a, 0.55, 2.6, COL.roof); }
      }
      const c = alongV ? (u0 + u1) / 2 : (v0 + v1) / 2;                                                              // tháp nhọn dọc nóc mái (34 m/chiếc)
      for (let a = a0 + 21; a <= a1 - 21; a += 34) {
        if (gaps.some(([g0, g1]) => a > g0 - 3 && a < g1 + 3)) continue;
        if (alongV) { det.cyl(a, Y + h - 1, c, 1.3, rh + 2.4, COL.wall, 8); det.cone(a, Y + h + rh + 1.4, c, 1.6, 6.5, COL.roof, 8); }
        else { det.cyl(c, Y + h - 1, a, 1.3, rh + 2.4, COL.wall, 8); det.cone(c, Y + h + rh + 1.4, a, 1.6, 6.5, COL.roof, 8); }
      }
    }
    const seg2 = (a, b, y0, y1) => alongV ? wall.box(a, b, y0, y1, u0, u1, COL.wall) : wall.box(v0, v1, y0, y1, a, b, COL.wall);
    let s = a0;
    for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) {
      if (g0 > s) { seg2(s, g0, Y, Y + h); solid(...(alongV ? [u0, u1, s, g0] : [s, g0, v0, v1]), Y + h); }
      seg2(g0, g1, Y + dh, Y + h); s = g1;                                                   // lanh tô trên cửa (không va chạm)
    }
    if (a1 > s) { seg2(s, a1, Y, Y + h); solid(...(alongV ? [u0, u1, s, a1] : [s, a1, v0, v1]), Y + h); }
    roof.gable(v0 - 0.6, v1 + 0.6, u0 - 0.6, u1 + 0.6, Y + h, rh, COL.roof);
    if (!far) wall.box(v0 - 0.3, v1 + 0.3, Y + h - 0.6, Y + h, u0 - 0.3, u1 + 0.3, COL.wallD);   // gờ mái
  };

  /** Tháp tròn cao h trên mặt Y, mái nón nhọn cao rh; y0 = chân tháp (mặc định Y − 3) */
  const tower = (u, v, r, h, rh, col = COL.roof, flag = true, y0 = Y - 3) => {
    wall.cyl(v, y0, u, r, Y + h - y0, COL.wall, seg, r * 0.94);
    if (!far) for (let y = Y + 8; y < Y + h - 5; y += 8.4) { const R = r * 0.97 + 0.02; winAt('u', u + R, 1, v, y, 1, 2.6); winAt('u', u - R, -1, v, y, 1, 2.6); winAt('v', v + R, 1, u, y, 1, 2.6); winAt('v', v - R, -1, u, y, 1, 2.6); }
    else winAt('u', u + r, 1, v, Y + h * 0.6, 1.4, 3.4);
    if (flag) tips.push([v, Y + h + rh, u]);
    if (det) det.cyl(v, Y + h + rh - 0.4, u, 0.06, 4.2, COL.wood, 5);                                                 // cột cờ
    if (!far) wall.cyl(v, Y + h - 1.2, u, r * 1.08, 1.2, COL.wallD, seg);                                            // gờ đỉnh
    roof.cone(v, Y + h, u, r * 1.12, rh, col, seg);
    solid(u - r, u + r, v - r, v + r, Y + h);
  };

  /** Khối chồng lớp trên nóc dãy nhà: thân từ Y+19 tới top, mái hai dốc rh, 1 hàng cửa sổ */
  const mass = (u0, u1, v0, v1, top, rh) => {
    wall.box(v0, v1, Y + 19, Y + top, u0, u1, COL.wall);
    if (!far) wall.box(v0 - 0.3, v1 + 0.3, Y + top - 0.6, Y + top, u0 - 0.3, u1 + 0.3, COL.wallD);
    roof.gable(v0 - 0.6, v1 + 0.6, u0 - 0.6, u1 + 0.6, Y + top, rh, COL.roof);
    const alongV = v1 - v0 > u1 - u0, a0 = alongV ? v0 : u0, a1 = alongV ? v1 : u1, y = Y + top - 7;
    for (let a = a0 + 3; a <= a1 - 3; a += far ? 8.4 : 4.2) { if (alongV) { winAt('u', u0, -1, a, y); winAt('u', u1, 1, a, y); } else { winAt('v', v0, -1, a, y); winAt('v', v1, 1, a, y); } }
  };

  /** Tháp góc nhỏ trên nóc (không va chạm — ở trên mái) */
  const turret = (u, v, r, top) => {
    wall.cyl(v, Y + 17, u, r, top - 17, COL.wall, far ? 6 : 8, r * 0.94);
    roof.cone(v, Y + top, u, r * 1.15, r * PHI ** 3, COL.roof, far ? 6 : 8);
    if (!far) winAt('u', u + r, 1, v, Y + top - 6, 0.9, 2.2);
  };

  /** Răng cưa dọc đỉnh tường: từ a0 tới a1 (trục 'v' = tường chạy dọc v tại u = f), bỏ các khe gaps */
  const merlons = (axis, a0, a1, f, y, gaps = []) => {
    if (far) return;
    for (let a = a0 + 1.05; a < a1 - 0.5; a += 2.1) {
      if (gaps.some(([g0, g1]) => a > g0 - 0.6 && a < g1 + 0.6)) continue;
      if (axis === 'v') put('merlon', MERLON, COL.wallD, a, y + 0.65, f); else put('merlon', MERLON, COL.wallD, f, y + 0.65, a, Math.PI / 2);
    }
  };

  /** Tường thành chữ nhật quanh mép vách: front/back/west/east gaps theo trục chạy của từng cạnh */
  const curtain = ({ u0, u1, hv, h, t }, gaps) => {
    const run = (axis, a0, a1, f0, f1, gs, outer) => {
      let s = a0;
      for (const [g0, g1] of [...gs, [a1, a1]].sort((p, q) => p[0] - q[0])) {
        if (g0 > s) {
          if (axis === 'v') wall.box(s, g0, Y - 4, Y + h, f0, f1, COL.wallD); else wall.box(f0, f1, Y - 4, Y + h, s, g0, COL.wallD);
          if (axis === 'v') solid(f0, f1, s, g0, Y + h); else solid(s, g0, f0, f1, Y + h);
        }
        s = Math.max(s, g1);
      }
      merlons(axis, a0, a1, outer, Y + h, gs);
      if (!far) for (const [g0, g1] of gs) for (const g of [g0, g1]) if (axis === 'v') wall.box(g - 0.6, g + 0.6, Y - 1, Y + h + 2.1, f0 - 0.4, f1 + 0.4, COL.wall); else wall.box(f0 - 0.4, f1 + 0.4, Y - 1, Y + h + 2.1, g - 0.6, g + 0.6, COL.wall);   // trụ cổng
    };
    run('v', -hv, hv, u1 - t, u1, gaps.front, u1 - 0.3);
    run('v', -hv, hv, u0, u0 + t, gaps.back, u0 + 0.3);
    run('u', u0, u1, -hv, -hv + t, gaps.west, -hv + 0.3);
    run('u', u0, u1, hv - t, hv, gaps.east, hv - 0.3);
  };

  /** Tháp canh thấp trên tường thành: thân tròn, vành răng cưa, mái nón thấp */
  const watch = (u, v, r, h) => {
    wall.cyl(v, Y - 4, u, r, h + 4, COL.wallD, seg, r * 0.92);
    if (!far) { wall.cyl(v, Y + h - 1, u, r * 1.12, 1, COL.wall, seg); for (let k = 0; k < 13; k++) { const a = k / 13 * Math.PI * 2; put('merlon', MERLON, COL.wallD, v + Math.cos(a) * r * 1.02, Y + h + 0.65, u + Math.sin(a) * r * 1.02, -a + Math.PI / 2); } }
    roof.cone(v, Y + h + 1.3, u, r * 0.92, r * PHI, COL.roofG, seg);
    if (!far) { winAt('u', u + r, 1, v, Y + h - 5, 0.8, 1.9); winAt('u', u - r, -1, v, Y + h - 5, 0.8, 1.9); }
    solid(u - r, u + r, v - r, v + r, Y + h);
  };

  /** Hàng nhịp vòm + trụ dưới mặt cầu: trục 'v' (dọc v tại u = f) hoặc 'u'; mặt cầu cao y0 → y1 (đáy mặt cầu = y − 1,2) */
  const arches = (axis, a0, a1, f, y0, y1, w) => {
    const n = Math.max(1, Math.round(Math.abs(a1 - a0) / ARCH.S)), S = (a1 - a0) / n, ang = Math.atan((y1 - y0) / (a1 - a0));
    const P = (a, y) => axis === 'v' ? [a, y, f] : [f, y, a], gAt = a => axis === 'v' ? ground(f, a) : ground(a, f);
    for (let k = 0; k < n; k++) {
      const ac = a0 + (k + 0.5) * S, db = lerp(y0, y1, (k + 0.5) / n) - 1.2, g = Math.min(gAt(a0 + k * S), gAt(ac), gAt(a0 + (k + 1) * S));
      if (db - g < 0.5) continue;
      if (db - g > ARCH.H + 1) { const [x, y, z] = P(ac, db - ARCH.H); put('arch', ARCH_GEO, COL.wall, x, y, z, axis === 'v' ? 0 : Math.PI / 2, axis === 'v' ? 0 : -ang, axis === 'v' ? ang : 0, Math.abs(S) / ARCH.S / Math.cos(ang)); }
      else { const [x, y, z] = P(ac, 0), hs = Math.abs(S) / 2; if (axis === 'v') wall.box(x - hs, x + hs, g - 1, db, z - w, z + w, COL.wallD); else wall.box(x - w, x + w, g - 1, db, z - hs, z + hs, COL.wallD); }
    }
    for (let k = 0; k <= n; k++) {                                                          // trụ: từ đáy hồ / đất lên chân vòm
      const a = a0 + k * S, top = lerp(y0, y1, k / n) - 1.2 - ARCH.H + 0.6, g = gAt(a) - 2;
      if (top - g < 1) continue;
      const ap = ARCH.p, wp = w + 0.6;
      if (axis === 'v') { wall.box(a - ap, a + ap, g, top, f - wp, f + wp, COL.wallD); solid(f - wp, f + wp, a - ap, a + ap, top); }
      else { wall.box(f - wp, f + wp, g, top, a - ap, a + ap, COL.wallD); solid(a - ap, a + ap, f - wp, f + wp, top); }
    }
  };

  /** Cầu / cầu cạn đầy đủ: mặt cầu dốc đều y0 → y1, lan can 2 bên (va chạm theo từng nhịp), nhịp vòm + trụ; ghi vào decks */
  const arcade = (axis, a0, a1, f, y0, y1, w, rails = [-1, 1]) => {
    const len = Math.abs(a1 - a0), L = Math.hypot(len, y1 - y0), ang = Math.atan((y1 - y0) / (a1 - a0)), am = (a0 + a1) / 2, ym = (y0 + y1) / 2;
    const slab = (wd, h, off, yc, col) => axis === 'v'
      ? wall.add(new THREE.BoxGeometry(L, h, wd), col, am, yc, f + off, 0, 0, ang)
      : wall.add(new THREE.BoxGeometry(wd, h, L), col, f + off, yc, am, 0, -ang, 0);
    slab(2 * w, 1.2, 0, ym - 0.6 / Math.cos(ang), COL.wall);                                // mặt cầu
    if (!far) for (const s of rails) slab(0.5, 1.1, s * (w - 0.25), ym + 0.55, COL.wallD);  // lan can 1,1 m
    arches(axis, a0, a1, f, y0, y1, w);
    const lo = Math.min(a0, a1), hi = Math.max(a0, a1), yAt = a => lerp(y0, y1, (a - a0) / (a1 - a0));
    decks.push({ axis, a0: lo, a1: hi, f, w, y: yAt });
    if (!far) for (let a = lo; a < hi - 0.01; a += 8) { const b = Math.min(hi, a + 8), top = Math.max(yAt(a), yAt(b)) + 1.1; for (const s of rails) { const c = f + s * (w - 0.25); if (axis === 'v') solid(c - 0.25, c + 0.25, a, b, top); else solid(a, b, c - 0.25, c + 0.25, top); } }
  };

  return { solid, winAt, range, tower, mass, turret, curtain, watch, arches, arcade, merlons, boxes, tips, decks, inst, put };
}

/** độ cao mặt đi trên các cầu (null nếu không đứng trên cầu nào) */
export function deckAt(decks, u, v) {
  let h = null;
  for (const d of decks) {
    const a = d.axis === 'v' ? v : u, c = d.axis === 'v' ? u : v;
    if (Math.abs(c - d.f) < d.w && a > d.a0 - 0.5 && a < d.a1 + 0.5) { const y = d.y(Math.min(d.a1, Math.max(d.a0, a))); if (h === null || y > h) h = y; }
  }
  return h;
}

/** InstancedMesh từ danh sách [x, y, z, rx, ry, rz] (màu đỉnh col → dùng chung vật liệu đá vertexColors) */
export function instMesh(geo, col, list, material) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  const m = new THREE.InstancedMesh(g, material, Math.max(1, list.length)), o = new THREE.Object3D();
  list.forEach(([x, y, z, rx, ry, rz, sx = 1], i) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, 1, 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  m.count = list.length; m.castShadow = m.receiveShadow = true; m.computeBoundingSphere(); return m;
}
