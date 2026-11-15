// sample/plaza.js — QUẢNG TRƯỜNG MẪU TRƯỚC CỔNG TRƯỜNG (khu mẫu chuẩn để nhân phong cách ra các khu khác)
// Bố cục theo π và φ: sân tròn bán kính R = 13 m (Fibonacci), tâm nằm trên trục cổng.
//   • tâm: TƯỢNG RUBIK 3×3 thật (27 khối con bo góc + 54 miếng dán lõm nhẹ), tầng trên xoay ¼ vòng mỗi φ³ ≈ 4,24 s
//   • nền: khảm hướng dương (góc vàng 137,5°, lộ 13 & 21 vòng xoắn Fibonacci) → vòng đồng R/φ² → xoắn ốc vàng → vòng R/φ
//   • 8 đèn cổ điển cao φ³ ≈ 4,24 m cách đều 2π/8; 4 ghế đá cong nhìn về tượng; 2 cây đa cổ thụ có bồn tròn trên vòng R/φ
//   • viền đá + bậc thềm thấp + bồn hoa hình lưỡi liềm chuyển dần ra bãi cỏ; lối đi toả ra theo góc vàng; không rào chắn
//   • bảng "Thị trấn xây bằng Toán" đứng thẳng ở mép bắc, quay về tâm (không che cổng)
// Hiệu năng: 8 draw call (nền · khối đá · viền khối · cây hoa · đèn phát sáng · thân Rubik · miếng dán · chữ); chi tiết nhỏ không đổ bóng.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Batch, GLOW_MATS } from '../decor.js';
import { toon, gradientMap } from '../style.js';
import { PHI, PI, FIB, GATE3, BLOCKS, LOT_W, LOT_L, HOUSE_W, HOUSE_D, HOUSE_V1, RING_ROAD_R, ROAD_W, ZONES_N, LOTS_N } from '../layout.js';

const GA = PI * (3 - Math.sqrt(5));          // góc vàng ≈ 137,5°
const R = FIB[6];                             // 13 m (Fibonacci)
// tâm quảng trường: trên trục cổng, mép đông chạm bậc cổng (bậc cổng nhô ~3 m)
export const PLAZA = { x: GATE3[0] - 3 - R, z: GATE3[1], R };
const C = {
  grout: '#cbbd9e', pave: '#ebe2cf', pave2: '#e3d7bf', pave3: '#ddcfb2', border: '#c2b291', step: '#d6cab0',
  gold: '#d9b373', gold3: '#cfa462', gold2: '#b98a49', bronze: '#9b7340', mosaic: '#efe5cf', stone: '#ebe3d2', stone2: '#d2c7b1',
  iron: '#2e2935', lantern: '#ffe28a', bark: '#6d5641', soil: '#6a4e36', bed: '#5f8a3e', leaf: ['#4f9a4a', '#5fae55', '#478d44', '#6bb85c'],
  flower: ['#e8453c', '#f5c518', '#ffffff', '#e85d8a', '#9b59d0', '#ff8a1f'],
};
// màu chuẩn Rubik: +y trắng, -y vàng, +x đỏ, -x cam, +z xanh lá, -z xanh dương
const RUBIK = { py: '#f4f4ee', ny: '#ffd21f', px: '#d3242c', nx: '#ff6a13', pz: '#15a04f', nz: '#1f5fd1' };

// ---------- hình học phụ ----------
// hình vành khuyên (sector) nằm ngang, mặt hướng lên; a: góc theo (cos a, sin a) trên mặt x–z
function annulus(r0, r1, a0, a1, y, n) {
  n = n || Math.max(2, Math.ceil((a1 - a0) * r1 / 0.45)); const p = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    const A = [r0 * c0, y, r0 * s0], B = [r1 * c0, y, r1 * s0], Cc = [r1 * c1, y, r1 * s1], D = [r0 * c1, y, r0 * s1];
    p.push(...A, ...Cc, ...B, ...A, ...D, ...Cc);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
}
// dải xoắn: pts = [[r, a, w], ...] → dải phẳng rộng w dọc đường cong
function ribbon(pts, y) {
  const p = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ra, aa, wa] = pts[i], [rb, ab, wb] = pts[i + 1], q = (r, a) => [r * Math.cos(a), y, r * Math.sin(a)];
    const A = q(ra - wa / 2, aa), B = q(ra + wa / 2, aa), Cc = q(rb + wb / 2, ab), D = q(rb - wb / 2, ab);
    p.push(...A, ...Cc, ...B, ...A, ...D, ...Cc);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
}
// tiện tròn (LatheGeometry) từ biên dạng [[r, y], ...]; a0..a1 = cung (mặc định cả vòng)
const lathe = (pts, seg = 32, a0 = 0, a1 = 2 * PI) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, PI / 2 - a1, a1 - a0);

export function buildPlaza({ ctx, env, addFoot = () => {} }) {
  const { scene } = ctx, Y = env.Y, hgt = (x, z) => ctx.terrain ? ctx.terrain.heightAt(x, z) : Y - 0.15, { x: cx, z: cz } = PLAZA, low = !!ctx.lowEnd;
  const G = new Batch('plaza-ground'), S = new Batch('plaza-stone'), F = new Batch('plaza-flora'), L = new Batch('plaza-glow');
  const TREE_A = [PI * 0.58, -PI * 0.52], nearTree = (x, z, m) => TREE_A.some(a => Math.hypot(x - cx - (R + PHI * PHI) * Math.cos(a), z - cz - (R + PHI * PHI) * Math.sin(a)) < m);
  const at = (r, a) => [cx + r * Math.cos(a), cz + r * Math.sin(a)];
  let seed = 1618; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const yP = Y + 0.06;                                   // mặt sân lát
  const R1 = R / PHI, R2 = R / PHI / PHI, R3 = R / PHI ** 3;   // 8,03 · 4,97 · 3,07 m
  const A = BLOCKS[0].r;
  // đường hướng tâm phía tây (z = 0, rộng ROAD_W) đi qua mép tây-nam sân; lối đi đối xứng ở góc +GA
  const roadZ = 0, pathA = GA, pathW = ROAD_W / PHI;
  const onRoad = (x, z, m = 0) => x < A[0] + 1 && Math.abs(z - roadZ) < ROAD_W / 2 + m;
  const onPath = (x, z, m = 0) => { const dx = x - cx, dz = z - cz, u = dx * Math.cos(pathA) + dz * Math.sin(pathA), v = -dx * Math.sin(pathA) + dz * Math.cos(pathA); return u > R && Math.abs(v) < pathW / 2 + m; };

  // ================= NỀN: viền, bậc thềm, mạch lát =================
  // bậc thềm thấp + gờ viền bo tròn (tiện tròn) → không cạnh cụt
  S.push(lathe([[R + 0.95, Y - 0.32], [R + 0.66, Y - 0.06], [R + 0.62, Y - 0.04], [R + 0.02, Y - 0.04], [R, Y - 0.02]], 96), C.step, cx, 0, cz);
  G.push(lathe([[R + 0.01, Y - 0.03], [R, Y + 0.07], [R - 0.08, Y + 0.1], [R - 0.5, Y + 0.1], [R - 0.56, yP - 0.01]], 96), C.border, cx, 0, cz);
  G.push(new THREE.CircleGeometry(R - 0.5, 96).rotateX(-PI / 2), C.grout, cx, yP - 0.004, cz);
  // vành gạch đồng tâm (mạch lát lộ màu vữa), 2 vùng: R/φ² → R/φ và R/φ → R
  const inArm = () => false;
  const courses = (r0, r1) => { const n = Math.max(1, Math.round((r1 - r0) / (1 / PHI))), w = (r1 - r0) / n;
    for (let i = 0; i < n; i++) { const ra = r0 + i * w + 0.025, rb = r0 + (i + 1) * w - 0.025, m = Math.max(8, Math.round(2 * PI * (ra + rb) / 2 / (w * PHI))), off = (i % 2) * PI / m;
      for (let j = 0; j < m; j++) { const a0 = off + j * 2 * PI / m, a1 = a0 + 2 * PI / m - 0.05 / ((ra + rb) / 2), k = rnd(), arm = inArm((ra + rb) / 2, (a0 + a1) / 2); G.push(annulus(ra, rb, a0, a1, 0, 2), arm ? (k < 0.5 ? C.gold : C.gold3) : k < 0.45 ? C.pave : k < 0.85 ? C.pave2 : C.pave3, cx, yP, cz); } } };
  courses(R2 + 0.32, R1 - 0.2); courses(R1 + 0.2, R - 0.56);
  // vòng đồng R/φ² và vòng đá sẫm R/φ (ghế và cây đứng trên vòng này)
  G.push(annulus(R2, R2 + 0.32, 0, 2 * PI, 0, 96), C.bronze, cx, yP + 0.002, cz);
  G.push(annulus(R1 - 0.2, R1 + 0.2, 0, 2 * PI, 0, 96), C.border, cx, yP + 0.002, cz);
  // khảm hướng dương trong vòng R/φ²: hạt thứ i ở r = c√i, góc i·137,5° — tô đậm 2 họ vòng xoắn 13 và 21 (Fibonacci)
  { const c = 0.29, i0 = Math.ceil((2.5 / c) ** 2), i1 = Math.floor(((R2 - 0.08) / c) ** 2);
    G.push(new THREE.CircleGeometry(R2, 64).rotateX(-PI / 2), C.grout, cx, yP - 0.002, cz);
    for (let i = i0; i <= i1; i++) { const r = c * Math.sqrt(i), a = i * GA, col = i % 21 === 0 ? C.gold : i % 13 === 0 ? C.bronze : (i % 2 ? C.mosaic : C.pave2);
      G.push(new THREE.CircleGeometry(c * 0.46, 6).rotateX(-PI / 2), col, cx + r * Math.cos(a), yP + 0.001, cz + r * Math.sin(a), a); } }

  // xoắn ốc vàng khảm đá: r = r0·φ^(2θ/π) (mỗi ¼ vòng lớn gấp φ) — 2 nhánh đối xứng từ vòng R/φ² nở dần ra mép sân, viền chỉ đồng
  for (const a0 of [PI * 0.62, PI * 1.62]) { const r0 = R2 + 0.32, th1 = PI / 2 * Math.log((R - 0.75) / r0) / Math.log(PHI), mid = [], eL = [], eR = [];
    for (let i = 0; i <= 120; i++) { const t = th1 * i / 120, r = r0 * PHI ** (2 * t / PI), f = Math.min(1, Math.sqrt(t / 0.9)), w = 0.11 * r * f, a = a0 + t;
      mid.push([r, a, w]); eL.push([r - w / 2, a, 0.06 * f]); eR.push([r + w / 2, a, 0.06 * f]); }
    G.push(ribbon(mid, 0), C.gold, cx, yP + 0.004, cz); G.push(ribbon(eL, 0), C.bronze, cx, yP + 0.006, cz); G.push(ribbon(eR, 0), C.bronze, cx, yP + 0.006, cz); }

  // ================= LỐI ĐI TOẢ RA (góc vàng) =================
  { const dx = Math.cos(pathA), dz = Math.sin(pathA), b = cx * dx + cz * dz, rr = RING_ROAD_R - ROAD_W / 2 + 0.3, t1 = -b + Math.sqrt(b * b - (cx * cx + cz * cz - rr * rr)), ry = Math.atan2(dx, dz);
    for (let t = R + 0.5, k = 0; t < t1; t += 0.62, k++) G.box(pathW, 0.06, 0.56, cx + dx * (t + 0.28), Y - 0.02, cz + dz * (t + 0.28), k % 2 ? C.pave2 : C.pave, ry);
    for (const s of [-1, 1]) G.box(0.22, 0.1, t1 - R - 0.4, cx + dx * (R + 0.4 + t1) / 2 - dz * s * (pathW / 2 + 0.11), Y - 0.04, cz + dz * (R + 0.4 + t1) / 2 + dx * s * (pathW / 2 + 0.11), C.border, ry);
    addFoot(Math.min(cx + dx * R, cx + dx * t1) - 2, Math.min(cz + dz * R, cz + dz * t1) - 2, Math.max(cx + dx * R, cx + dx * t1) + 2, Math.max(cz + dz * R, cz + dz * t1) + 2); }

  // ================= BỒN HOA LƯỠI LIỀM: chuyển mềm từ bậc thềm ra bãi cỏ =================
  { const r0 = R + 0.7, W = PHI * PHI;   // bề rộng bồn ≈ φ² = 2,6 m
    for (let a = PI * 0.38; a < PI * 1.62; a += 0.035) {
      const [x, z] = at(r0 + 1, a + 0.0175); if (x > A[0] - 0.2 || onRoad(x, z, 0.8) || onPath(x, z, 0.9)) continue;
      const edge = Math.min(1, (A[0] - 0.2 - x) / 3), w = W * (0.62 + 0.38 * Math.sin(a * 5) * 0.5 + 0.19) * edge;
      F.push(annulus(r0, r0 + w, a, a + 0.036, 0, 1), C.bed, cx, Math.max(hgt(x, z), Y - 0.12) + 0.03, cz);
      const n = Math.round(w * 3.2); for (let i = 0; i < n; i++) { const rr = r0 + 0.2 + rnd() * (w - 0.3), aa = a + rnd() * 0.035, [fx, fz] = at(rr, aa), band = Math.floor((a * 8 / PI) % 5); if (nearTree(fx, fz, 1.85)) continue;
        if (rnd() < 0.3) F.ball(0.22 + rnd() * 0.16, fx, Y + 0.12, fz, C.leaf[(i + band) % 4], 1.2, 0.8, 1.2);
        else F.ball(0.11 + rnd() * 0.05, fx, Y + 0.22 + rnd() * 0.12, fz, C.flower[(band + (rnd() < 0.2 ? 2 : 0)) % 6]); }
      // hoa thưa dần ra bãi cỏ
      for (let i = 0; i < 2; i++) { const rr = r0 + w + Math.pow(rnd(), 2) * 5, [fx, fz] = at(rr, a + rnd() * 0.035); if (rnd() < 0.5 && !onRoad(fx, fz, 0.5) && !onPath(fx, fz, 0.5)) F.ball(0.09, fx, hgt(fx, fz) + 0.05, fz, C.flower[(i + Math.floor(a * 3)) % 6]); }
    }
  }

  // ================= TƯỢNG RUBIK: bệ đá + khối 3×3 =================
  const s = PHI * PHI, q = s / 3;                         // cạnh khối φ² ≈ 2,62 m
  const pedH = 1.02, cubeY = yP + pedH + s / 2 + 0.03;
  S.push(lathe([[R3 - 0.07, yP - 0.08], [R3 - 0.07, yP + 0.2], [R3 - 0.12, yP + 0.24], [2.6, yP + 0.24]], 64), C.stone2, cx, 0, cz);   // bậc đế (bán kính R/φ³)
  S.push(lathe([[2.6, yP + 0.23], [2.56, yP + 0.32], [2.3, yP + 0.38], [2.0, yP + 0.46], [2.0, yP + 0.82], [2.1, yP + 0.88], [2.2, yP + 0.96], [2.2, yP + 1.02], [0, yP + 1.02]], 48), C.stone, cx, 0, cz);
  S.push(new THREE.TorusGeometry(2.02, 0.04, 4, 48).rotateX(PI / 2), C.gold, cx, yP + 0.74, cz);
  L.push(new THREE.TorusGeometry(R3 - 0.1, 0.035, 3, 64).rotateX(PI / 2), C.lantern, cx, yP + 0.25, cz);      // vòng sáng chân bệ (đêm)
  { const a = PI, [px, pz] = at(2.04, a); S.box(1.5, 0.24, 0.1, px, yP + 0.5, pz, C.bronze, -a - PI / 2 + PI); }   // bảng đồng (chữ ở atlas)
  ctx.colliders.push({ x: cx, z: cz, r: R3 });

  // khối con bo góc (InstancedMesh, 1 draw call) + miếng dán lõm nhẹ (1 draw call, màu theo instance)
  const cubeGroup = new THREE.Object3D(); cubeGroup.position.set(cx, cubeY, cz); cubeGroup.rotation.y = PI / 4; cubeGroup.updateMatrix();
  const cubieGeo = new RoundedBoxGeometry(q * 0.97, q * 0.97, q * 0.97, 3, q * 0.12);
  const body = new THREE.InstancedMesh(cubieGeo, new THREE.MeshPhongMaterial({ color: '#141218', specular: '#4a4a55', shininess: 70 }), 27);
  // miếng dán: vuông bo góc, tâm lõm vào trong (pháp tuyến nghiêng về tâm để bóng đổ nhẹ trong lòng)
  const stickerGeo = (() => { const sz = q * 0.82, rc = sz * 0.2, N = 8, ring = [];
    for (let c = 0; c < 4; c++) { const ox = (c === 0 || c === 3 ? 1 : -1) * (sz / 2 - rc), oy = (c < 2 ? 1 : -1) * (sz / 2 - rc); for (let i = 0; i <= N; i++) { const t = (c * PI / 2) + i / N * PI / 2; ring.push([ox + Math.cos(t) * rc, oy + Math.sin(t) * rc]); } }
    const pos = [], nor = [], dep = 0.006, tilt = 0.32, pushV = (x, y, k) => { const d = Math.hypot(x, y) || 1; pos.push(x, y, -dep * (1 - k)); nor.push(-x / d * tilt * k, -y / d * tilt * k, 1); };
    for (let i = 0; i < ring.length; i++) { const [ax, ay] = ring[i], [bx, by] = ring[(i + 1) % ring.length];
      pushV(0, 0, 0); pushV(ax * 0.62, ay * 0.62, 0.62); pushV(bx * 0.62, by * 0.62, 0.62);
      pushV(ax * 0.62, ay * 0.62, 0.62); pushV(ax, ay, 1); pushV(bx, by, 1); pushV(ax * 0.62, ay * 0.62, 0.62); pushV(bx, by, 1); pushV(bx * 0.62, by * 0.62, 0.62); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.normalizeNormals(); return g; })();
  const FACES = [['px', [1, 0, 0], [0, PI / 2, 0]], ['nx', [-1, 0, 0], [0, -PI / 2, 0]], ['py', [0, 1, 0], [-PI / 2, 0, 0]], ['ny', [0, -1, 0], [PI / 2, 0, 0]], ['pz', [0, 0, 1], [0, 0, 0]], ['nz', [0, 0, -1], [0, PI, 0]]];
  const cubies = [], stickers = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    cubies.push({ p: new THREE.Vector3(i * q, j * q, k * q), top: j === 1 });
    for (const [key, n, rot] of FACES) if ((n[0] && n[0] === i) || (n[1] && n[1] === j) || (n[2] && n[2] === k)) stickers.push({ key, top: j === 1, p: new THREE.Vector3(i * q + n[0] * (q * 0.485 + 0.012), j * q + n[1] * (q * 0.485 + 0.012), k * q + n[2] * (q * 0.485 + 0.012)), e: new THREE.Euler(...rot) });
  }
  const stick = new THREE.InstancedMesh(stickerGeo, new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap }), stickers.length);
  stick.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.24;'); };   // nhựa dán luôn tươi màu (kể cả lúc chiều tối)
  const _c = new THREE.Color(); stickers.forEach((st, i) => stick.setColorAt(i, _c.set(RUBIK[st.key])));
  const _o = new THREE.Object3D(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0);
  function pose(th) {   // th: góc xoay tầng trên
    _q.setFromAxisAngle(UP, th);
    cubies.forEach((c, i) => { _o.position.copy(c.p); _o.quaternion.identity(); _o.scale.setScalar(1); if (c.top) { _o.position.applyQuaternion(_q); _o.quaternion.copy(_q); } _o.updateMatrix(); body.setMatrixAt(i, _m.multiplyMatrices(cubeGroup.matrix, _o.matrix)); });
    stickers.forEach((st, i) => { _o.position.copy(st.p); _o.quaternion.setFromEuler(st.e); _o.scale.setScalar(1); if (st.top) { _o.position.applyQuaternion(_q); _o.quaternion.premultiply(_q); } _o.updateMatrix(); stick.setMatrixAt(i, _m.multiplyMatrices(cubeGroup.matrix, _o.matrix)); });
    body.instanceMatrix.needsUpdate = stick.instanceMatrix.needsUpdate = true;
  }
  pose(0);
  for (const m of [body, stick]) { m.computeBoundingSphere(); m.receiveShadow = true; scene.add(m); }
  body.castShadow = true; stick.castShadow = false; body.name = 'plaza-rubik'; stick.name = 'plaza-rubik-stickers';
  // xoay ¼ vòng trong φ giây, nghỉ φ² giây → chu kỳ φ³ ≈ 4,24 s (chỉ tính khi tượng đang được vẽ)
  let lastT = -1, lastTh = 0;
  body.onBeforeRender = () => { const t = performance.now() / 1000; if (t === lastT) return; lastT = t;
    const T = PHI ** 3, n = Math.floor(t / T), u = Math.min(1, (t - n * T) / PHI), e = u * u * (3 - 2 * u), th = (n + e) * PI / 2;
    if (Math.abs(th - lastTh) > 1e-4) { lastTh = th; pose(th); } };

  // ================= 8 ĐÈN CỔ ĐIỂN (cách đều 2π/8, cao φ³) =================
  const lampAt = (x, z) => {
    S.push(lathe([[0.3, 0], [0.3, 0.16], [0.22, 0.24], [0.17, 0.46], [0.11, 0.62], [0.09, 0.72], [0, 0.72]], 8), C.iron, x, Y, z);
    S.cyl(0.055, 0.075, 2.62, x, Y + 0.72, z, C.iron, 8);
    for (const y of [0.74, 2.0, 3.3]) S.cyl(0.1, 0.1, 0.07, x, Y + y, z, C.gold, 8);
    S.box(0.44, 0.05, 0.44, x, Y + 3.37, z, C.iron);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.box(0.035, 0.6, 0.035, x + sx * 0.19, Y + 3.42, z + sz * 0.19, C.iron);
    S.box(0.5, 0.05, 0.5, x, Y + 4.0, z, C.iron); S.hip(0.66, 0.3, 0.66, x, Y + 4.05, z, C.iron); S.ball(0.07, x, Y + 4.4, z, C.gold);
    L.box(0.32, 0.56, 0.32, x, Y + 3.43, z, C.lantern);
    ctx.colliders.push({ x, z, r: 0.3 });
  };
  for (let k = 0; k < FIB[5]; k++) { const [x, z] = at(R - 1.0, PI / 8 + k * PI / 4); lampAt(x, z); }

  // ================= 4 GHẾ ĐÁ CONG (trên vòng R/φ² + 1,3, nhìn về tượng) =================
  for (const a of [PI * 0.23, -PI * 0.23, PI * 0.77, -PI * 0.77]) {
    const rb = R2 + 1.45, half = 1.7 / rb;   // cung dài ≈ 3,4 m
    S.push(lathe([[rb - 0.3, 0.4], [rb + 0.3, 0.4], [rb + 0.3, 0.52], [rb - 0.3, 0.52], [rb - 0.3, 0.4]], 12, a - half, a + half), C.stone, cx, yP, cz);
    for (const t of [-0.8, 0, 0.8]) { const aa = a + half * t, [x, z] = at(rb, aa); S.box(0.46, 0.4, 0.2, x, yP, z, C.stone2, -aa); ctx.colliders.push({ x, z, r: 0.35 }); }
    for (const t of [-1, 1]) { const aa = a + t * half, [x, z] = at(rb, aa); S.box(0.62, 0.14, 0.08, x, yP + 0.4, z, C.stone2, -aa); }   // bịt 2 đầu ghế
  }

  // ================= 2 CÂY ĐA CỔ THỤ (bồn tròn ở mép bắc & nam, cách tâm R + φ² — tán che mép sân, không chắn tầm nhìn vào cổng) =================
  for (const a of TREE_A) {
    const [x, z] = at(R + PHI * PHI, a), sc = a > 0 ? 1 : 0.92;
    S.push(lathe([[1.7, -0.02], [1.7, 0.4], [1.62, 0.48], [1.42, 0.48], [1.42, 0.36]], 32), C.stone, x, yP, z);
    G.push(new THREE.CircleGeometry(1.42, 24).rotateX(-PI / 2), C.soil, x, yP + 0.37, z);
    for (let i = 0; i < 13; i++) { const r = 0.9 + rnd() * 0.45, aa = i * GA; F.ball(0.13, x + Math.cos(aa) * r, yP + 0.42, z + Math.sin(aa) * r, i % 3 ? C.leaf[i % 4] : C.flower[i % 6], 1.3, 0.6, 1.3); }
    S.push(lathe([[0.82 * sc, 0.3], [0.62 * sc, 0.5], [0.48 * sc, 1.0], [0.42 * sc, 2.3], [0.3 * sc, 2.9], [0, 3.0]], 9), C.bark, x, yP, z);
    for (let i = 0; i < 5; i++) { const aa = a + i * 2 * PI / 5 + 0.3; S.cyl(0.1, 0.24, 1.2, x + Math.cos(aa) * 0.8, yP - 0.1, z + Math.sin(aa) * 0.8, C.bark, 5, PI / 2 - aa, -1.0, 0); }   // rễ nổi
    for (let i = 0; i < 3; i++) { const aa = a + 0.5 + i * 2 * PI / 3, L2 = 2.6 * sc; S.push(new THREE.CylinderGeometry(0.16, 0.26, L2, 6).translate(0, L2 / 2, 0), C.bark, x, yP + 2.2, z, -aa + PI / 2, 0.75, 0); }
    // tán rộng: 1 + 8 cụm lá xếp theo góc vàng (Fibonacci)
    S.push(new THREE.IcosahedronGeometry(2.4 * sc, 1), C.leaf[0], x, yP + 5.6 * sc, z, 0, 0, 0, 1.3, 0.62, 1.3);
    for (let i = 1; i <= 8; i++) { const r = 3.2 * sc * Math.sqrt(i / 8), aa = a + i * GA, rad = (1.5 + rnd() * 0.5) * sc;
      S.push(new THREE.IcosahedronGeometry(rad, 1), C.leaf[i % 4], x + Math.cos(aa) * r, yP + (4.7 + 0.5 * Math.sin(i * 2.1)) * sc, z + Math.sin(aa) * r, rnd() * 3, 0, 0, 1.25, 0.7, 1.25); }
    ctx.colliders.push({ x, z, r: 1.7 });
  }

  // ================= BẢNG "THỊ TRẤN XÂY BẰNG TOÁN" (mép bắc, đứng thẳng, quay về tâm) =================
  const atlasC = document.createElement('canvas'); atlasC.width = 1024; atlasC.height = 768; const k = atlasC.getContext('2d');
  { k.fillStyle = '#fff6df'; k.fillRect(0, 0, 1024, 640); k.strokeStyle = '#7a5a2e'; k.lineWidth = 14; k.strokeRect(7, 7, 1010, 626); k.strokeStyle = '#c9974f'; k.lineWidth = 3; k.strokeRect(24, 24, 976, 592);
    k.fillStyle = '#7a1f2b'; k.font = 'bold 50px system-ui'; k.textAlign = 'center'; k.fillText('Thị trấn của chúng mình xây bằng Toán!', 512, 84);
    k.textAlign = 'left'; const line = (t, x, y, f = '29px system-ui', col = '#3b2a1e') => { k.font = f; k.fillStyle = col; k.fillText(t, x, y, 450); };
    line('φ  Tỷ lệ vàng ≈ 1,618', 44, 150, 'bold 40px system-ui', '#b5432f');
    ['Dãy Fibonacci: 1, 1, 2, 3, 5, 8, 13, 21…', 'mỗi số = tổng 2 số liền trước.', 'Lấy số sau chia số trước → gần 1,618.', `Mỗi lô đất: ${LOT_W} m × ${LOT_L} m (34 : 21 ≈ φ)`, `Ngôi nhà: ${HOUSE_W.toFixed(0)} m × ${HOUSE_D.toFixed(0)} m (13 : 8 ≈ φ)`, `Quảng trường: bán kính ${R} m, có 8 cột đèn.`].forEach((t, i) => line(t, 44, 202 + i * 48));
    line('π  Số Pi ≈ 3,14', 540, 150, 'bold 40px system-ui', '#2b63d9');
    ['Chu vi hình tròn = π × đường kính.', `Đường vòng quanh trường: bán kính ${RING_ROAD_R} m`, `→ dài 2 × π × ${RING_ROAD_R} ≈ ${Math.round(2 * PI * RING_ROAD_R)} m.`, `${ZONES_N} khu vui chơi cách đều 2π/${ZONES_N} = 45°.`, `${LOTS_N} lô đất cách đều 2π/${LOTS_N} = 22,5°.`, 'Vòng quanh quảng trường dài ≈ 82 m!'].forEach((t, i) => line(t, 540, 202 + i * 48));
    k.strokeStyle = '#e9b949'; k.lineWidth = 5; k.beginPath(); for (let t = 0; t < 12.6; t += 0.05) { const r = 3 * Math.pow(PHI, t * 2 / PI); const x = 300 + Math.cos(t) * r, y = 568 - Math.sin(t) * r * 0.9; t ? k.lineTo(x, y) : k.moveTo(x, y); if (r > 62) break; } k.stroke();
    k.strokeStyle = '#2b63d9'; k.beginPath(); k.arc(770, 566, 50, 0, PI * 2); k.stroke(); k.beginPath(); k.moveTo(720, 566); k.lineTo(820, 566); k.stroke(); k.fillStyle = '#2b63d9'; k.font = 'bold 26px system-ui'; k.fillText('d', 762, 558);
    // bảng đồng chân tượng (dải dưới atlas)
    k.fillStyle = '#8a6434'; k.fillRect(0, 640, 1024, 128); k.strokeStyle = '#e8c27a'; k.lineWidth = 6; k.strokeRect(8, 648, 1008, 112);
    k.fillStyle = '#fff1c9'; k.textAlign = 'center'; k.font = 'bold 44px system-ui'; k.fillText('KHỐI RUBIK 3 × 3', 512, 698); k.font = '28px system-ui'; k.fillText('43 tỉ tỉ cách xếp — chỉ 1 cách đúng!', 512, 744); }
  const tex = new THREE.CanvasTexture(atlasC); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const boardA = PI * 0.36, [bx, bz] = at(R + 0.25, boardA), bry = Math.atan2(cx - bx, cz - bz);   // mặt bảng quay về tâm
  const W = 4.85, Hh = W / PHI, by = Y + 1.05 + Hh / 2;   // khung 4,85 × 3 m (tỷ lệ φ)
  S.group(bx, Y, bz, bry, () => {
    S.box(W + 0.36, Hh + 0.36, 0.16, 0, 1.05 - 0.18, -0.02, '#7a5432');                         // khung gỗ
    S.box(W + 0.5, 0.12, 0.3, 0, 1.05 + Hh + 0.16, -0.02, C.gold2);                              // gờ trên
    S.prism(W + 1.0, 0.62, 0.9, 0, 1.05 + Hh + 0.28, -0.02, '#b9502f');                          // mái ngói nhỏ
    for (const sx of [-1, 1]) { S.box(0.42, 0.3, 0.42, sx * (W / 2 + 0.3), -0.05, -0.02, C.stone2); S.box(0.26, 1.05 + Hh + 0.3, 0.26, sx * (W / 2 + 0.3), 0.2, -0.02, '#6b4a2b'); S.ball(0.12, sx * (W / 2 + 0.3), 1.05 + Hh + 0.62, -0.02, C.gold); }
    S.box(W * 0.62, 0.42, 0.5, 0, -0.05, 0.7, C.stone2);                                          // bậc đá nhỏ để đứng đọc
  });
  ctx.colliders.push({ x: bx + Math.cos(bry) * (W / 2 + 0.3), z: bz - Math.sin(bry) * (W / 2 + 0.3), r: 0.35 }, { x: bx - Math.cos(bry) * (W / 2 + 0.3), z: bz + Math.sin(bry) * (W / 2 + 0.3), r: 0.35 });
  // 2 tấm chữ (bảng + bảng đồng chân tượng) chung 1 texture → 1 draw call
  const textGeo = (() => { const mk = (w, h, v0, v1, x, y, z, ry) => { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * (v1 - v0)); g.rotateY(ry).translate(x, y, z); return g; };
    const [px, pz] = at(2.1, PI);
    return [mk(W, Hh, 128 / 768, 1, bx + Math.sin(bry) * 0.07, by, bz + Math.cos(bry) * 0.07, bry), mk(1.4, 0.175, 0, 128 / 768, px, yP + 0.62, pz, -PI / 2)]; })();
  const textMesh = new THREE.Mesh(mergeTwo(textGeo), new THREE.MeshToonMaterial({ map: tex, gradientMap }));
  textMesh.name = 'plaza-text'; textMesh.receiveShadow = true; scene.add(textMesh);
  const info = `<b>φ – Tỷ lệ vàng ≈ 1,618</b><br>Dãy Fibonacci 1, 1, 2, 3, 5, 8, 13, 21… (mỗi số bằng tổng 2 số liền trước). Chia số sau cho số trước: 21 : 13 ≈ 1,615 — càng về sau càng gần φ. Mỗi lô đất ở đây rộng ${LOT_W} m, sâu ${LOT_L} m; ngôi nhà ${HOUSE_W.toFixed(0)} × ${HOUSE_D.toFixed(0)} m.<br><br><b>Quảng trường trước cổng</b><br>Bán kính ${R} m (số Fibonacci). Hoa văn giữa sân xếp theo góc vàng 137,5° như hạt hoa hướng dương: đếm thử sẽ thấy 13 và 21 vòng xoắn! Tượng Rubik cạnh φ² ≈ 2,62 m, mỗi ¼ vòng xoay mất φ³ ≈ 4,24 giây.<br><br><b>π – Số Pi ≈ 3,14</b><br>Chu vi hình tròn = π × đường kính. Đường vòng quanh trường có bán kính ${RING_ROAD_R} m nên dài khoảng ${Math.round(2 * PI * RING_ROAD_R)} m. ${ZONES_N} khu vui chơi xếp đều trên vòng tròn, mỗi khu cách nhau 2π/${ZONES_N} = 45°.`;
  env.infoBoard = { x: bx, z: bz, html: info };

  // ================= GỘP THÀNH MESH =================
  const mat = toon('#ffffff', { vertexColors: true }), glow = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }); GLOW_MATS.push(glow);
  const meshes = [body, stick, textMesh];
  const add = (b, m, shadow) => { const me = b.mesh(m, shadow); if (!me) return null; me.name = b.name; scene.add(me); meshes.push(me); return me; };
  add(G, mat, false); const st = add(S, mat, true); add(F, mat, false); add(L, glow, false);
  if (st && !low) { const ol = new THREE.MeshBasicMaterial({ color: '#4a3548', side: THREE.BackSide }); ol.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.022;'); }; const e = new THREE.Mesh(st.geometry, ol); e.raycast = () => {}; e.castShadow = false; e.name = 'plaza-outline'; st.add(e); meshes.push(e); }
  addFoot(cx - R - 4, cz - R - 4, cx + R + 1, cz + R + 4);
  ctx.plaza = { meshes, PLAZA, drawCalls: meshes.length };
  return { meshes };
}
function mergeTwo([a, b]) { const g = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'uv']) { const A = a.attributes[k].array, B = b.attributes[k].array, out = new Float32Array(A.length + B.length); out.set(A); out.set(B, A.length); g.setAttribute(k, new THREE.BufferAttribute(out, a.attributes[k].itemSize)); } const ia = a.index.array, ib = b.index.array, idx = []; for (const i of ia) idx.push(i); for (const i of ib) idx.push(i + a.attributes.position.count); g.setIndex(idx); return g; }
