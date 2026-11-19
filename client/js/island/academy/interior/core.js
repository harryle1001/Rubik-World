// academy/interior/core.js — LÕI LUÔN HIỆN của nội thất (thấy được xuyên nhiều tầng nên không tải theo tầng):
//  · 2 tháp cầu thang xoắn (21 bậc / vòng / tầng, cột giữa, ô cửa mỗi tầng, chiếu nghỉ đỉnh)
//  · GIẾNG CẦU THANG TRUNG TÂM 21 × 21: 4 nhịp cầu thang bay (dài 21 m, rộng 3,4 m, 25 bậc) xoay 90° theo nhịp 13 s
//    (đứng yên 10 s, xoay 3 s) quanh trục giữa giếng → đầu nhịp nối hành lang khác nhau mỗi lần; người đứng trên được chở theo,
//    lan can 2 bên giữ không rơi; ban công quanh giếng có cổng phép chỉ mở khi đầu nhịp áp sát.
//  · "bóng tầng" (sàn + tường hành lang vòng) cho các tầng chưa tải → nhìn xuống/lên giếng không thấy khoảng trống.
// Nhịp tính theo đồng hồ thật (Date.now) → mọi người chơi thấy cầu thang xoay cùng lúc.
import * as THREE from 'three';
import { Batch } from '../geo.js';
import { FH, TOWERS, SHAFT_DEF as SD, ZERO } from './plan.js';
import { yOf, CEIL, DOOR_H, RAIL_TOP } from './build.js';

const TAU = Math.PI * 2, NSTEP = 21, NFL = 25;
const C = { wall: '#a39d94', wallD: '#7f7a73', trim: '#8a847a', wood: '#6e4a30', woodL: '#a8744a', crystal: '#8fd3e8', ceil: '#5e5850', floor: '#8d857a', rail: '#8f897f' };
const smooth = t => t * t * (3 - 2 * t);
const tri = b => { const m = ((b % 8) + 8) % 8; return m < 4 ? m : 8 - m; };   // 0 1 2 3 4 3 2 1 … → xoay thuận 4 nhịp rồi ngược 4 nhịp
const wrap01 = v => v - Math.floor(v);

// ---------- tháp xoắn: độ cao mặt đỡ ----------
// h = y(k0) + 8·(n + f), f = phần vòng tính từ góc cửa; nhánh n = 0..(k1−k0−1) là các vòng bậc; nhánh cuối = chiếu nghỉ đỉnh (nửa vòng đầu)
export function towerY(T, x, z, y) {
  const [x0, z0, x1, z1] = T.rect; if (x < x0 || x > x1 || z < z0 || z > z1) return null;
  const dx = x - T.c[0], dz = z - T.c[1]; if (dx * dx + dz * dz < 0.81) return null;   // cột giữa
  const f = wrap01((Math.atan2(dx, dz) - T.door) / TAU), fs = (Math.floor(f * NSTEP) + 1) / NSTEP, y0 = yOf(T.k0), lim = y + 1.0; let best = null;
  for (let n = 0; n < T.k1 - T.k0; n++) { const h = y0 + FH * (n + fs); if (h <= lim && (best === null || h > best)) best = h; }
  if (f < 0.5 && yOf(T.k1) <= lim) best = Math.max(best ?? -1e9, yOf(T.k1));
  return best;
}

export function buildCore(opt) {
  const g = new THREE.Group(); g.name = 'academy-interior-core';
  const stone = new Batch(), glow = new Batch(), boxesK = {};
  const solid = (k, x0, x1, z0, z1, top) => (boxesK[k] = boxesK[k] || []).push({ x0, x1, z0, z1, top });
  // ---------- tháp xoắn ----------
  for (const T of TOWERS) {
    const [x0, z0, x1, z1] = T.rect, [cx, cz] = T.c, yb = yOf(T.k0), yt = yOf(T.k1), dSide = Math.round(Math.sin(T.door)) > 0 ? 'e' : 'w';
    stone.box(x0, x1, yb - 0.4, yb, z0, z1, C.floor); stone.box(x0, x1, yt + CEIL, yt + FH, z0, z1, C.ceil);
    stone.cyl(cx, yb, cz, 0.9, yt + FH - yb, C.trim, 10);
    for (const [qx, qz] of [[x0, z0], [x1 - 1.6, z0], [x0, z1 - 1.6], [x1 - 1.6, z1 - 1.6]]) { stone.box(qx, qx + 1.6, yb, yt + FH, qz, qz + 1.6, C.wallD); for (let k = T.k0; k <= T.k1; k++) solid(k, qx, qx + 1.6, qz, qz + 1.6, yOf(k) + CEIL); }
    for (let k = T.k0; k <= T.k1; k++) {
      const y = yOf(k); solid(k, cx - 0.9, cx + 0.9, cz - 0.9, cz + 0.9, y + CEIL);
      // tường 4 mặt (dày 0,5, giữa đường lưới) — ô cửa 3 × 4,6 m phía hành lang (trừ đỉnh tháp chính)
      const door = k < T.k1 || T.id === 'twW';
      for (const [ax, L, side] of [['x', z0, 'n'], ['x', z1, 's'], ['z', x0, 'w'], ['z', x1, 'e']]) {
        const pts = ax === 'x' ? [x0, x1] : [z0, z1], gap = door && side === dSide ? [cz - 1.5, cz + 1.5] : null;
        const seg = (p0, p1, y0, y1) => ax === 'x' ? stone.box(p0 - 0.25, p1 + 0.25, y0, y1, L - 0.25, L + 0.25, C.wallD) : stone.box(L - 0.25, L + 0.25, y0, y1, p0 - 0.25, p1 + 0.25, C.wallD);
        if (gap) { seg(pts[0], gap[0], y, y + FH); seg(gap[1], pts[1], y, y + FH); seg(gap[0], gap[1], y + DOOR_H, y + FH); }
        else seg(pts[0], pts[1], y, y + FH);
        if (!gap && side !== (dSide === 'e' ? 'w' : 'e')) { const m = (pts[0] + pts[1]) / 2, o = L + (side === 'n' || side === 'w' ? 0.27 : -0.27); if (ax === 'x') glow.box(m - 0.25, m + 0.25, y + 3, y + 5.2, o - 0.02, o + 0.02, '#9fd0ff'); else glow.box(o - 0.02, o + 0.02, y + 3, y + 5.2, m - 0.25, m + 0.25, '#9fd0ff'); }
      }
      glow.add(new THREE.ConeGeometry(0.13, 0.36, 5), '#ffc35a', cx + 0.95, y + 3.6, cz); glow.add(new THREE.ConeGeometry(0.13, 0.36, 5), '#ffc35a', cx - 0.95, y + 3.6, cz);
    }
    // bậc xoắn: hình quạt bán kính 4,4 m, dày 0,6 m
    for (let n = 0; n < (T.k1 - T.k0) * NSTEP; n++) {
      const top = yb + (n + 1) * FH / NSTEP, a0 = T.door + (n % NSTEP) * TAU / NSTEP;
      stone.add(new THREE.CylinderGeometry(4.4, 4.4, 0.6, 3, 1, false, a0, TAU / NSTEP), n % 2 ? C.trim : C.wall, cx, top - 0.3, cz);
    }
    // chiếu nghỉ đỉnh: nửa vòng tính từ góc cửa
    stone.add(new THREE.CylinderGeometry(4.6, 4.6, 0.4, 12, 1, false, T.door, Math.PI), C.floor, cx, yt - 0.2, cz);
  }
  // ---------- giếng cầu thang trung tâm ----------
  const [sx0, sz0, sx1, sz1] = SD.rect, [cx, cz] = ZERO, HL = SD.hl, HW = SD.hw;
  stone.box(sx0, sx1, yOf(SD.k1) + CEIL, yOf(SD.k1) + FH, sz0, sz1, C.ceil);                                           // vòm trần giếng
  for (let i = 0; i < 13; i++) { const a = i / 13 * TAU, r = 3 + (i % 3) * 2.2; glow.add(new THREE.OctahedronGeometry(0.35 + (i % 2) * 0.2), i % 2 ? '#bfe9ff' : '#e6d0ff', cx + Math.sin(a) * r, yOf(SD.k1) + CEIL - 1.2 - (i % 4) * 0.5, cz + Math.cos(a) * r); }
  glow.add(new THREE.OctahedronGeometry(1.3), '#dff4ff', cx, yOf(SD.k1) + CEIL - 2.6, cz);                           // pha lê lớn treo giữa giếng
  // lan can ban công (tầng có giếng là lỗ: k0+1..k1): 2 đoạn cố định + 1 cổng phép giữa mỗi cạnh
  const GH = 1.9, gates = [];
  for (let k = SD.k0 + 1; k <= SD.k1; k++) {
    const y = yOf(k);
    for (let s = 0; s < 4; s++) {
      // s: 0 đông (x = sx1) · 1 nam (z = sz1) · 2 tây · 3 bắc
      const ax = s % 2 ? 'x' : 'z', L = s === 0 ? sx1 : s === 1 ? sz1 : s === 2 ? sx0 : sz0, mid = ax === 'x' ? cx : cz, lo = ax === 'x' ? sx0 : sz0, hi = ax === 'x' ? sx1 : sz1;
      const bx = (p0, p1, y0, y1, col, e) => ax === 'x' ? stone.box(p0, p1, y0, y1, L - e, L + e, col) : stone.box(L - e, L + e, y0, y1, p0, p1, col);
      const sb = (p0, p1, top) => ax === 'x' ? solid(k, p0, p1, L - 0.15, L + 0.15, top) : solid(k, L - 0.15, L + 0.15, p0, p1, top);
      for (const [p0, p1] of [[lo, mid - GH], [mid + GH, hi]]) { bx(p0, p1, y, y + 1.0, C.rail, 0.15); bx(p0, p1, y + 1.0, y + 1.12, C.woodL, 0.2); sb(p0, p1, y + RAIL_TOP); }
      for (const p of [mid - GH, mid + GH]) { const [px, pz] = ax === 'x' ? [p, L] : [L, p]; stone.box(px - 0.22, px + 0.22, y, y + 1.6, pz - 0.22, pz + 0.22, C.wallD); glow.add(new THREE.OctahedronGeometry(0.2), '#9fe6ff', px, y + 1.85, pz); }
      const box = ax === 'x' ? { x0: mid - GH, x1: mid + GH, z0: L - 0.15, z1: L + 0.15, top: y + RAIL_TOP } : { x0: L - 0.15, x1: L + 0.15, z0: mid - GH, z1: mid + GH, top: y + RAIL_TOP };
      (boxesK[k] = boxesK[k] || []).push(box); gates.push({ k, s, box, top: box.top, ax, L, mid, y });
    }
  }
  // cổng phép (màng sáng) — instancing, ẩn khi mở
  const gateIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(GH * 2, 1.1), new THREE.MeshBasicMaterial({ color: '#7fd8ff', transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false }), gates.length);
  gateIM.frustumCulled = false; gateIM.userData.noCamOcc = true;
  // bóng tầng: sàn hành lang vòng + 4 tường ngoài của vòng (mỗi tầng 1 mesh, ẩn khi tầng đó đã tải)
  const proxies = {};
  for (let k = SD.k0; k <= SD.k1; k++) {
    const b = new Batch(), y = yOf(k), [rx0, rz0, rx1, rz1] = [29, 12, 60, 43];
    if (k === SD.k0) b.box(rx0, rx1, y - 0.4, y, rz0, rz1, C.floor);
    else { b.box(rx0, rx1, y - 0.4, y, rz0, sz0, C.floor); b.box(rx0, rx1, y - 0.4, y, sz1, rz1, C.floor); b.box(rx0, sx0, y - 0.4, y, sz0, sz1, C.floor); b.box(sx1, rx1, y - 0.4, y, sz0, sz1, C.floor); }
    b.box(rx0, rx1, y, y + FH - 0.4, rz0 - 0.25, rz0 + 0.25, C.wall); b.box(rx0, rx1, y, y + FH - 0.4, rz1 - 0.25, rz1 + 0.25, C.wall);
    b.box(rx0 - 0.25, rx0 + 0.25, y, y + FH - 0.4, rz0, rz1, C.wall); b.box(rx1 - 0.25, rx1 + 0.25, y, y + FH - 0.4, rz0, rz1, C.wall);
    if (k === SD.k1) b.box(rx0, rx1, y + CEIL, y + FH, rz0, rz1, C.ceil);
    const m = new THREE.Mesh(b.build(), opt.stoneMat); m.matrixAutoUpdate = false; m.name = 'academy-proxy-' + k; proxies[k] = m; g.add(m);
  }
  // nhịp cầu thang bay (toạ độ riêng: dọc +z từ −HL tới +HL, ngang ±HW; gốc = tâm giếng, y = sàn tầng chân)
  const flights = [];
  for (let k = SD.k0; k < SD.k1; k++) {
    const b = new Batch(), t = 2 * HL / NFL, rise = FH / NFL;
    for (let i = 0; i < NFL; i++) { const z0 = -HL + i * t, top = (i + 1) * rise; b.box(-HW + 0.12, HW - 0.12, top - 0.3, top, z0, z0 + t + 0.02, i % 2 ? C.trim : C.wall); }
    const ang = Math.atan2(FH, 2 * HL), Lg = Math.hypot(FH, 2 * HL);
    for (const s of [-1, 1]) {
      b.add(new THREE.BoxGeometry(0.24, 0.55, Lg), C.crystal, s * (HW - 0.12), FH / 2 - 0.35, 0, 0, -ang);                 // dầm pha lê
      b.add(new THREE.BoxGeometry(0.12, 0.12, Lg), C.woodL, s * (HW - 0.1), FH / 2 + 1.05, 0, 0, -ang);                     // tay vịn
      for (let i = 1; i < NFL; i += 3) b.cyl(s * (HW - 0.1), (i + 1) * rise, -HL + (i + 0.5) * t, 0.05, 1.0, C.wood, 5);
    }
    const m = new THREE.Mesh(b.build(), opt.stoneMat); m.name = 'academy-flight-' + k; m.position.set(cx, yOf(k), cz);
    flights.push({ k, mesh: m, ang: 0 }); g.add(m);
  }
  const ms = new THREE.Mesh(stone.build(), opt.stoneMat), mg = new THREE.Mesh(glow.build(), opt.glowMat);
  for (const m of [ms, mg]) { m.matrixAutoUpdate = false; g.add(m); }
  g.add(gateIM);

  // ---------- nhịp xoay ----------
  const angleAt = (k, T) => { const b = Math.floor(T / SD.beat), ph = T - b * SD.beat, still = SD.beat - SD.turn, m0 = tri(b), m1 = tri(b + 1);
    const m = ph < still ? m0 : m0 + (m1 - m0) * smooth((ph - still) / SD.turn); return { a: (k + m) * Math.PI / 2, docked: ph < still, ph, still, b }; };
  const o = new THREE.Object3D();
  // mặt nhịp: toạ độ cục bộ (t dọc, s ngang) của điểm (x, z) mặt bằng
  const local = (F, x, z) => { const dx = x - cx, dz = z - cz, sa = Math.sin(F.ang), ca = Math.cos(F.ang); return [dx * sa + dz * ca, dx * ca - dz * sa]; };
  const flightY = (F, t) => yOf(F.k) + (Math.min(NFL - 1, Math.floor((t + HL) / (2 * HL) * NFL)) + 1) * FH / NFL;
  let state = { docked: true, ph: 0, still: 10 };
  return {
    group: g, boxesK, proxies, flights, gates,
    /** cập nhật góc nhịp, cổng; T = giây đồng hồ thật */
    update(T) {
      for (const F of flights) { const s = angleAt(F.k, T); F.prev = F.ang; F.ang = s.a; F.mesh.rotation.y = s.a; state = s; }
      gates.forEach((G, i) => {
        // cổng mở khi có đầu nhịp áp sát: nhịp G.k (đầu thấp hướng −d) hoặc nhịp G.k−1 (đầu cao hướng +d)
        let open = false;
        if (state.docked) for (const F of flights) {
          const dir = Math.round(F.ang / (Math.PI / 2)), dx = Math.round(Math.sin(F.ang)), dz = Math.round(Math.cos(F.ang)); void dir;
          const sideOf = (vx, vz) => vx > 0 ? 0 : vz > 0 ? 1 : vx < 0 ? 2 : 3;
          if (F.k === G.k && sideOf(-dx, -dz) === G.s) open = true;
          if (F.k === G.k - 1 && sideOf(dx, dz) === G.s) open = true;
        }
        G.box.top = open ? -1e9 : G.top; G.open = open;
        const [px, pz] = G.ax === 'x' ? [G.mid, G.L] : [G.L, G.mid];
        o.position.set(px, G.y + 0.6, pz); o.rotation.set(0, G.ax === 'x' ? 0 : Math.PI / 2, 0); o.scale.setScalar(open ? 0.001 : 1); o.updateMatrix(); gateIM.setMatrixAt(i, o.matrix);
      });
      gateIM.instanceMatrix.needsUpdate = true;
      return state;
    },
    /** mặt đỡ cao nhất ≤ y + 1 trong tháp xoắn + nhịp cầu thang (null nếu không có) */
    support(x, z, y) {
      let best = null; const lim = y + 1.0;
      for (const T of TOWERS) { const h = towerY(T, x, z, y); if (h !== null && (best === null || h > best)) best = h; }
      if (x > sx0 - 1 && x < sx1 + 1 && z > sz0 - 1 && z < sz1 + 1) for (const F of flights) {
        const [t, s] = local(F, x, z); if (Math.abs(s) > HW || t < -HL || t > HL) continue;
        const h = flightY(F, t); if (h <= lim && (best === null || h > best)) best = h;
      }
      return best;
    },
    /** người chơi đang đứng trên nhịp nào? → chở theo khi xoay, giữ trong lan can */
    carry(p, setYaw) {
      for (const F of flights) {
        if (F.prev === undefined) continue;
        const sa = Math.sin(F.prev), ca = Math.cos(F.prev), dx = p.x - cx, dz = p.z - cz, t = dx * sa + dz * ca, s = dx * ca - dz * sa;
        if (Math.abs(s) > HW + 0.6 || t < -HL - 0.05 || t > HL + 0.05) continue;
        const h = flightY(F, Math.max(-HL, Math.min(HL, t))); if (p.y < h - 0.6 || p.y > h + 2.4) continue;
        const d = F.ang - F.prev, docked = state.docked;
        let tt = t, ss = Math.max(-(HW - 0.4), Math.min(HW - 0.4, s));
        if (!docked) tt = Math.max(-HL + 0.4, Math.min(HL - 0.4, t));
        const na = Math.sin(F.ang), nc = Math.cos(F.ang);
        p.x = cx + tt * na + ss * nc; p.z = cz + tt * nc - ss * na;
        if (Math.abs(d) > 1e-6 && setYaw) setYaw(d);
        return F;
      }
      return null;
    },
    inShaft: (x, z) => x > sx0 && x < sx1 && z > sz0 && z < sz1,
    get state() { return state; },
  };
}
