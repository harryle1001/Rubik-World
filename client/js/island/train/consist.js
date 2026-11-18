// train/consist.js — ĐOÀN TÀU PHA LÊ: đầu máy hơi nước xanh lục đậm viền đồng thau + toa than + 4 toa khách gỗ.
// Thiết kế nguyên bản: nồi hơi xanh lục 3 đai đồng, ống khói loe, vòm hơi đồng, pha lê lam trên cửa buồng khói,
// biển tên "TÀU PHA LÊ" trên toa than; toa gỗ tếch, cửa sổ ấm (cao : rộng ≈ φ), ghế đôi 2 bên lối đi, đèn trần.
// Draw call: đầu máy 1 + đèn 1 + toa than 1 + biển tên 1 + toa khách (instancing) 1 + kính sáng 1 + bánh xe 1 + thanh truyền 1 + khói 1 = 9.
import * as THREE from 'three';
import { Batch } from '../academy/geo.js';
import { matV, mat } from '../sample/palette.js';
import { toon } from '../style.js';
import { at, LEN } from './route.js';

// chiều dài thân (m) — đầu máy 10,5 · toa than 5 · toa khách 8 (Fibonacci) · khoảng nối 0,8
export const CARS = [{ kind: 'loco', len: 10.5 }, { kind: 'tender', len: 5 }, ...[0, 1, 2, 3].map(i => ({ kind: 'coach', len: 8, i }))];
export const GAP = 0.8, FLOOR = 1.1, WIDTH = 2.6, ROOF = 3.3;
let off = 0; for (const c of CARS) { c.off = off + c.len / 2; off += c.len + GAP; }   // c.off: tâm toa cách đầu tàu (m)
export const TRAIN_LEN = off - GAP;
const G = '#2c6455', GD = '#1f463c', K = '#2a2630', KL = '#3a3344', B = '#d4a24a', TEAK = '#8a5a3a', TEAKD = '#6e4a30', CREAM = '#efe3c8', WOOD = '#a8744a';
export const WIN = { n: 5, w: 0.9, y0: 1.95, y1: 2.95, z: k => -3.2 + k * 1.6 };   // cửa sổ toa: 0,9 × 1,0 m … tâm cách 1,6 m
// bánh xe: [z, bán kính] theo toa (hai bên x = ±0.72)
const WHEELS = {
  loco: { drive: [1.5, -0.2, -1.9], dr: 0.78, pony: [[3.9, 0.42]] },
  tender: [[1.6, 0.42], [0, 0.42], [-1.6, 0.42]],
  coach: [[3.3, 0.42], [1.9, 0.42], [-1.9, 0.42], [-3.3, 0.42]],
};
const CYL = { z: 3.9, y: 1.05, x: 1.18 };                 // xi lanh hơi (đầu pít-tông)
// Batch nhận toạ độ đầu–cuối theo thứ tự bất kỳ (2 bên s = ±1 viết chung một dòng)
class Batch2 extends Batch { box(x0, x1, y0, y1, z0, z1, c) { return super.box(Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1), Math.min(z0, z1), Math.max(z0, z1), c); } }

function locoGeo() {
  const b = new Batch2(), cyl = (r, l, col, x, y, z, seg = 14) => b.add(new THREE.CylinderGeometry(r, r, l, seg), col, x, y, z, 0, Math.PI / 2);
  b.box(-1.15, 1.15, 0.62, 1.12, -5.2, 5.0, K);                                   // khung gầm
  b.box(-1.3, 1.3, 0.78, 1.32, 5.0, 5.3, '#93402a');                               // dầm đỡ trước + 2 giảm chấn đồng
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 8), B, s * 0.85, 1.05, 5.45, 0, Math.PI / 2);
  b.add(new THREE.ConeGeometry(0.9, 0.7, 4, 1), K, 0, 0.55, 5.45, Math.PI / 4, Math.PI / 2 + 0.6);   // gạt đá (mũi tàu)
  for (const s of [-1, 1]) b.box(s * 1.08, s * 1.32, 1.18, 1.26, -1.6, 4.7, K);     // sàn chạy 2 bên
  cyl(0.95, 5.6, G, 0, 2.15, 1.2);                                                 // nồi hơi
  for (const z of [-1.0, 0.9, 2.8]) cyl(0.985, 0.12, B, 0, 2.15, z);               // 3 đai đồng
  cyl(1.0, 1.0, K, 0, 2.15, 4.4); cyl(1.04, 0.08, B, 0, 2.15, 4.92);              // buồng khói + vành đồng
  b.add(new THREE.CylinderGeometry(0.45, 0.3, 0.55, 12), K, 0, 3.4, 4.2); b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12), K, 0, 3.4 + 0.2, 4.2);   // ống khói loe
  b.add(new THREE.CylinderGeometry(0.5, 0.45, 0.16, 12), B, 0, 3.98, 4.2);
  b.add(new THREE.SphereGeometry(0.42, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), B, 0, 3.05, 1.6);   // vòm hơi đồng
  b.add(new THREE.SphereGeometry(0.38, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), G, 0, 3.05, 0.1);   // vòm cát
  b.cyl(0.3, 3.05, -0.9, 0.06, 0.5, B, 6);                                          // còi hơi
  for (const s of [-1, 1]) {                                                        // xi lanh hơi 2 bên
    cyl(0.36, 1.2, G, s * CYL.x, CYL.y, CYL.z); for (const dz of [-0.62, 0.62]) cyl(0.39, 0.08, B, s * CYL.x, CYL.y, CYL.z + dz);
  }
  // buồng lái: vách trước, 2 vách hông có cửa sổ, mái cong
  b.box(-1.3, 1.3, 1.12, 3.5, -1.75, -1.55, G);
  for (const s of [-1, 1]) {
    b.box(s * 1.2, s * 1.3, 1.12, 2.25, -5.2, -1.55, G); b.box(s * 1.2, s * 1.3, 3.05, 3.5, -5.2, -1.55, G);
    b.box(s * 1.2, s * 1.3, 2.25, 3.05, -2.2, -1.55, G); b.box(s * 1.2, s * 1.3, 2.25, 3.05, -5.2, -4.5, G);
    b.box(s * 1.31, s * 1.33, 2.2, 2.28, -4.5, -2.2, B); b.box(s * 1.31, s * 1.33, 2.98, 3.06, -4.5, -2.2, B);   // khung cửa đồng
    b.box(s * 1.18, s * 1.3, 1.62, 2.0, -1.55, 4.6, GD);                            // ốp hông nồi hơi (trên bánh xe)
  }
  b.box(-1.45, 1.45, 3.5, 3.62, -5.4, -1.4, KL); b.box(-1.15, 1.15, 3.62, 3.74, -5.3, -1.5, KL);   // mái
  b.box(-0.9, 0.9, 1.12, 2.4, -1.75, -0.6, '#4a4450');                             // hộp lửa (trong buồng lái thấy được)
  // mặt trước buồng khói: đĩa đen + vòng đồng + pha lê
  b.add(new THREE.CylinderGeometry(0.72, 0.72, 0.06, 14), KL, 0, 2.15, 4.96, 0, Math.PI / 2);
  b.add(new THREE.TorusGeometry(0.72, 0.05, 4, 14), B, 0, 2.15, 4.99);
  b.add(new THREE.OctahedronGeometry(0.3), '#9fe8ff', 0, 2.15, 5.08, Math.PI / 4);
  return b.build();
}
function locoGlow() {   // đèn pha trước + đèn buồng lái
  const b = new Batch2(); b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 8), '#ffe3a0', 0, 3.0, 4.95, 0, Math.PI / 2);
  b.box(-0.25, 0.25, 3.2, 3.35, -3.6, -3.3, '#ffe3a0'); return b.build();
}
function tenderGeo() {
  const b = new Batch2();
  b.box(-1.15, 1.15, 0.62, 1.12, -2.5, 2.5, K);
  b.box(-1.25, 1.25, 1.12, 2.7, -2.4, 2.4, G); b.box(-1.3, 1.3, 2.7, 2.82, -2.45, 2.45, B);
  for (const s of [-1, 1]) b.box(s * 1.26, s * 1.28, 1.25, 2.55, -2.3, 2.3, GD);   // ô viền tối (chỗ biển tên)
  b.box(-1.0, 1.0, 2.7, 3.15, -2.2, 1.4, '#1c1a20');                                // than
  b.box(-1.25, 1.25, 2.82, 3.3, 1.4, 2.4, G);                                       // thùng nước
  return b.build();
}
function coachGeo() {
  const b = new Batch2(), L = 4;
  b.box(-1.1, 1.1, 0.55, FLOOR - 0.12, -L + 0.3, L - 0.3, K);                       // khung gầm
  for (const z of [-2.6, 2.6]) b.box(-0.95, 0.95, 0.3, 0.62, z - 1.0, z + 1.0, KL);  // giá chuyển hướng
  b.box(-1.3, 1.3, FLOOR - 0.12, FLOOR, -L, L, TEAKD);                              // sàn
  b.box(-1.28, 1.28, FLOOR, FLOOR + 0.01, -L + 0.1, L - 0.1, '#7a5a44');            // mặt sàn (thảm)
  for (const s of [-1, 1]) {
    const x0 = s * 1.18, x1 = s * 1.3;
    b.box(x0, x1, FLOOR, WIN.y0, -L, L, TEAK);                                       // ván dưới cửa sổ
    b.box(x0, x1, WIN.y1, ROOF, -L, L, TEAK);                                        // ván trên
    for (let k = 0; k <= WIN.n; k++) { const za = k === 0 ? -L : WIN.z(k - 1) + WIN.w / 2, zb = k === WIN.n ? L : WIN.z(k) - WIN.w / 2; b.box(x0, x1, WIN.y0, WIN.y1, za, zb, TEAK); }   // trụ giữa cửa sổ
    b.box(s * 1.3, s * 1.33, WIN.y1 + 0.06, WIN.y1 + 0.14, -L, L, B);                // nẹp đồng dưới mái
    b.box(s * 1.3, s * 1.33, WIN.y0 - 0.1, WIN.y0, -L, L, TEAKD);                     // bệ cửa sổ
    b.box(s * 1.31, s * 1.34, 1.3, 1.36, -L + 0.2, L - 0.2, CREAM);                  // chỉ kem
  }
  // 2 vách đầu toa có cửa thông 0,9 × 2,1 m (đi lại giữa các toa)
  for (const z of [-L, L]) {
    const z0 = z - 0.06, z1 = z + 0.06;
    for (const s of [-1, 1]) b.box(s * 0.45, s * 1.3, FLOOR, ROOF, z0, z1, TEAK);
    b.box(-0.45, 0.45, FLOOR + 2.1, ROOF, z0, z1, TEAK);
    b.box(-0.55, 0.55, FLOOR, FLOOR + 2.1, z + Math.sign(z) * 0.2, z + Math.sign(z) * 0.4, '#1c1a20');   // ống xếp nối toa (vải)
    b.box(-0.55, 0.55, FLOOR + 2.1, FLOOR + 2.3, z + Math.sign(z) * 0.06, z + Math.sign(z) * 0.4, '#1c1a20');
    for (const s of [-1, 1]) b.box(s * 0.55, s * 0.62, FLOOR, FLOOR + 2.3, z + Math.sign(z) * 0.06, z + Math.sign(z) * 0.4, '#1c1a20');
  }
  // mái cong (3 mảnh) + mặt trong trần màu kem
  b.box(-0.8, 0.8, ROOF + 0.32, ROOF + 0.42, -L - 0.1, L + 0.1, KL);
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.75, 0.1, 2 * L + 0.2), KL, s * 1.08, ROOF + 0.2, 0, 0, 0, -s * 0.4);
  b.box(-1.18, 1.18, ROOF - 0.04, ROOF + 0.02, -L + 0.06, L - 0.06, CREAM);
  // ghế đôi 2 bên lối đi (lối đi 0,9 m), 5 hàng theo cửa sổ, quay về phía đầu toa
  for (let k = 0; k < WIN.n; k++) {
    const z = WIN.z(k) - 0.15;
    for (const s of [-1, 1]) {
      b.box(s * 0.45, s * 1.15, FLOOR + 0.4, FLOOR + 0.52, z - 0.25, z + 0.25, '#2c6455');   // đệm ngồi xanh
      b.box(s * 0.45, s * 1.15, FLOOR, FLOOR + 0.4, z - 0.2, z + 0.15, TEAKD);
      b.box(s * 0.45, s * 1.15, FLOOR + 0.52, FLOOR + 1.25, z - 0.32, z - 0.2, '#2c6455');  // lưng ghế
      b.box(s * 0.45, s * 1.15, FLOOR + 1.25, FLOOR + 1.32, z - 0.34, z - 0.18, WOOD);
    }
  }
  for (const s of [-1, 1]) b.box(s * 0.7, s * 1.17, ROOF - 0.3, ROOF - 0.26, -L + 0.3, L - 0.3, TEAKD);   // giá để hành lý (trên cửa sổ, cao hơn tầm mắt)
  return b.build();
}
function coachGlow() {   // kính cửa sổ sáng ấm (nhìn từ ngoài) — ẩn khi camera ở trong toa
  const b = new Batch2();
  for (const s of [-1, 1]) for (let k = 0; k < WIN.n; k++) b.box(s * 1.24 - 0.01, s * 1.24 + 0.01, WIN.y0, WIN.y1, WIN.z(k) - WIN.w / 2, WIN.z(k) + WIN.w / 2, '#ffe3a0');
  return b.build();
}
function coachLamps() { const b = new Batch2(); for (const z of [-2.4, 0, 2.4]) b.box(-0.18, 0.18, ROOF - 0.12, ROOF - 0.04, z - 0.18, z + 0.18, '#ffe3a0'); return b.build(); }
function wheelGeo() {   // bánh xe đơn vị (bán kính 1, dày 0,14): vành sắt, 8 nan xanh, trục đồng — trục quay = trục x
  const b = new Batch2();
  b.add(new THREE.TorusGeometry(0.9, 0.1, 4, 16), K, 0, 0, 0, Math.PI / 2);
  b.add(new THREE.CylinderGeometry(1, 1, 0.06, 16), KL, -0.05, 0, 0, 0, 0, Math.PI / 2);
  for (let k = 0; k < 4; k++) b.add(new THREE.BoxGeometry(0.1, 1.7, 0.1), G, 0.02, 0, 0, 0, k * Math.PI / 4);
  b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 8), B, 0.03, 0, 0, 0, 0, Math.PI / 2);
  b.box(0.06, 0.12, 0.42, 0.62, -0.06, 0.06, B);   // chốt tay quay
  return b.build();
}
function plateTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const k = c.getContext('2d');
  k.fillStyle = '#1f463c'; k.fillRect(0, 0, 512, 128); k.strokeStyle = '#d4a24a'; k.lineWidth = 6; k.strokeRect(10, 10, 492, 108);
  k.font = 'bold 62px Georgia, serif'; k.fillStyle = '#e8c27a'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('TÀU PHA LÊ', 256, 68, 470);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function createConsist(ctx) {
  const group = new THREE.Group(); group.name = 'train-consist';
  const mv = matV(), mg = mat('lampGlow');
  const mk = (geo, m, shadow = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = shadow; o.receiveShadow = true; return o; };
  const cars = CARS.map(c => { const o = new THREE.Group(); group.add(o); return { ...c, o, roll: 0 }; });
  const loco = cars[0], tender = cars[1], coaches = cars.filter(c => c.kind === 'coach');
  loco.o.add(mk(locoGeo(), mv), mk(locoGlow(), mg, false));
  tender.o.add(mk(tenderGeo(), mv));
  { const pm = new THREE.MeshBasicMaterial({ map: plateTex(), toneMapped: true }), pg = new THREE.PlaneGeometry(3.2, 0.8);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(pg, pm); p.position.set(s * 1.295, 1.9, 0); p.rotation.y = s * Math.PI / 2; tender.o.add(p); } }
  // toa khách: instancing (thân + kính sáng + đèn trần)
  const NC = coaches.length;
  const coachI = new THREE.InstancedMesh(coachGeo(), mv, NC); coachI.castShadow = true; coachI.receiveShadow = false;   // không nhận bóng: trong toa sáng, không tối om dưới mái
  const glowI = new THREE.InstancedMesh(coachGlow(), mg, NC), lampI = new THREE.InstancedMesh(coachLamps(), mg, NC);
  // bánh xe + thanh truyền (instancing, ma trận thế giới cập nhật mỗi khung hình)
  const wl = []; for (const c of cars) { const W = c.kind === 'loco' ? [...WHEELS.loco.drive.map(z => [z, WHEELS.loco.dr, 1]), ...WHEELS.loco.pony] : WHEELS[c.kind]; for (const [z, r, drive] of W) for (const s of [-1, 1]) wl.push({ c, z, r, s, drive: !!drive }); }
  const wheelI = new THREE.InstancedMesh(wheelGeo(), mv, wl.length); wheelI.castShadow = true;
  const rodI = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), toon(B, { emissive: '#d4a24a', emissiveIntensity: 0.146 }), 6);
  for (const o of [coachI, glowI, lampI, wheelI, rodI]) { o.frustumCulled = false; group.add(o); }
  ctx.scene.add(group);

  // ---------- khói hơi nước: 55 cụm (pool), bay lên, nở to, nhạt dần ----------
  const SM = 55, smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), toon('#f2efe8', { transparent: true, opacity: 0.82, depthWrite: false }), SM);
  smoke.frustumCulled = false; smoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(smoke);
  const puffs = Array.from({ length: SM }, () => ({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), r0: 0.5, r1: 3, spin: 0 }));
  let pi = 0;
  const emit = (pos, vel, r0, r1, life) => { const q = puffs[pi = (pi + 1) % SM]; q.p.copy(pos); q.v.copy(vel); q.r0 = r0; q.r1 = r1; q.max = q.life = life; q.spin = Math.random() * 6; };

  const pF = {}, pR = {}, M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const st = { angle: 0, speed: 0, sHead: 0, dir: 1, hideGlow: -1, t: 0, chuff: 0 };
  // sHead: vị trí đầu tàu trên tuyến; dir: +1 chạy về phía s tăng (đi Học viện), −1 về đảo chính
  function place(sHead, dir) {
    st.sHead = sHead; st.dir = dir;
    for (const c of cars) {
      const sc = sHead - dir * c.off, h = c.len * 0.32;
      at(Math.min(LEN, Math.max(0, sc + dir * h)), pF); at(Math.min(LEN, Math.max(0, sc - dir * h)), pR);
      const dx = pF.x - pR.x, dz = pF.z - pR.z, dy = pF.y - pR.y, l = Math.hypot(dx, dz) || 1;
      c.yaw = Math.atan2(dx, dz); const dy0 = c.prevYaw === undefined ? 0 : c.yaw - c.prevYaw; c.curv = Math.atan2(Math.sin(dy0), Math.cos(dy0)); c.prevYaw = c.yaw;
      c.o.position.set((pF.x + pR.x) / 2, (pF.y + pR.y) / 2, (pF.z + pR.z) / 2);
      c.o.rotation.set(-Math.atan2(dy, l), c.yaw, c.roll, 'YXZ');
      c.s = sc;
    }
    group.updateMatrixWorld(true);
    coaches.forEach((c, i) => { coachI.setMatrixAt(i, c.o.matrixWorld); glowI.setMatrixAt(i, i === st.hideGlow ? ZERO : c.o.matrixWorld); lampI.setMatrixAt(i, c.o.matrixWorld); });
    coachI.instanceMatrix.needsUpdate = glowI.instanceMatrix.needsUpdate = lampI.instanceMatrix.needsUpdate = true;
    posWheels();
  }
  function posWheels() {
    const a = st.angle;
    wl.forEach((w, i) => {
      const rot = a * (WHEELS.loco.dr / w.r) + (w.s > 0 ? Math.PI / 2 : 0);   // 2 bên lệch 90° (tay quay vuông góc)
      M.compose(V3.set(w.s * 0.72, w.r + 0.02, w.z), Q.setFromEuler(E.set(rot, w.s > 0 ? 0 : Math.PI, 0)), S3.set(1, w.r, w.r));
      wheelI.setMatrixAt(i, M2.multiplyMatrices(w.c.o.matrixWorld, M));
    });
    wheelI.instanceMatrix.needsUpdate = true;
    // thanh nối (nối 3 bánh dẫn động) + tay biên (từ bánh giữa tới con trượt) + cần pít-tông, mỗi bên 1 bộ
    const L = loco.o.matrixWorld, cr = 0.52 * WHEELS.loco.dr, dr = WHEELS.loco.dr; let k = 0;
    for (const s of [-1, 1]) {
      const ang = a + (s > 0 ? Math.PI / 2 : 0), py = Math.cos(ang) * cr, pz = Math.sin(ang) * cr;   // chốt tay quay theo đúng góc quay bánh
      const x = s * 0.9, d = WHEELS.loco.drive;
      M.compose(V3.set(x, dr + py, (d[0] + d[2]) / 2 + pz), Q.identity(), S3.set(0.08, 0.14, d[0] - d[2] + 0.4)); rodI.setMatrixAt(k++, M2.multiplyMatrices(L, M));
      const pin = { z: d[1] + pz, y: dr + py }, Lr = 3.0, cy = CYL.y, chz = pin.z + Math.sqrt(Math.max(0.1, Lr * Lr - (cy - pin.y) ** 2));
      M.compose(V3.set(x + s * 0.06, (pin.y + cy) / 2, (pin.z + chz) / 2), Q.setFromEuler(E.set(-Math.atan2(cy - pin.y, chz - pin.z), 0, 0)), S3.set(0.07, 0.16, Lr)); rodI.setMatrixAt(k++, M2.multiplyMatrices(L, M));
      M.compose(V3.set(s * CYL.x, cy, (chz + CYL.z) / 2), Q.identity(), S3.set(0.06, 0.06, Math.max(0.1, CYL.z - chz))); rodI.setMatrixAt(k++, M2.multiplyMatrices(L, M));
    }
    rodI.instanceMatrix.needsUpdate = true;
  }
  const chim = new THREE.Vector3(), up = new THREE.Vector3();
  // mỗi khung hình: bánh quay theo quãng đường, toa lắc nhẹ, khói theo nhịp xình xịch (4 nhát / vòng bánh)
  function animate(dt, speed, onChuff) {
    st.t += dt; st.speed = speed;
    const da = speed * dt / WHEELS.loco.dr; st.angle += da;
    const k = Math.min(1, speed / 8);
    cars.forEach((c, i) => { c.roll = Math.sin(st.t * 2.1 + i * 1.3) * 0.012 * k + Math.sin(st.t * 5.3 + i) * 0.004 * k - (c.curv || 0) * speed * 0.9; });
    // nhịp hơi: 4 lần mỗi vòng bánh dẫn động
    const q = Math.floor(st.angle / (Math.PI / 2)); if (q !== st.chuff) { st.chuff = q; if (speed > 0.2) { onChuff && onChuff(speed); puff(speed, true); } }
    st.idle = (st.idle || 0) + dt; if (speed < 0.2 && st.idle > 0.7) { st.idle = 0; puff(0, false); }
    // khói
    for (let i = 0; i < SM; i++) {
      const q = puffs[i];
      if (q.life <= 0) { smoke.setMatrixAt(i, ZERO); continue; }
      q.life -= dt; const t = 1 - q.life / q.max; q.v.y *= 1 - dt * 0.35; q.v.x *= 1 - dt * 0.6; q.v.z *= 1 - dt * 0.6; q.p.addScaledVector(q.v, dt);
      const r = (q.r0 + (q.r1 - q.r0) * Math.sqrt(t)) * (t > 0.7 ? 1 - (t - 0.7) / 0.3 * 0.85 : 1);
      M.compose(q.p, Q.setFromEuler(E.set(q.spin, q.spin * 0.7 + t, 0)), S3.set(r, r * 0.86, r)); smoke.setMatrixAt(i, M);
    }
    smoke.instanceMatrix.needsUpdate = true;
  }
  function puff(speed, big) {
    chim.set(0, 4.1, 4.2).applyMatrix4(loco.o.matrixWorld);
    const fx = Math.sin(loco.yaw) * st.dir, fz = Math.cos(loco.yaw) * st.dir;
    up.set((Math.random() - 0.5) * 0.6 - fx * 0, big ? 3.4 + speed * 0.25 : 1.4, (Math.random() - 0.5) * 0.6);
    emit(chim, up, big ? 0.42 : 0.26, big ? 1.9 + speed * 0.1 : 1.1, big ? 3.4 : 2.6);
    if (big && speed < 4) for (const s of [-1, 1]) { chim.set(s * 1.5, 0.9, CYL.z + 0.6).applyMatrix4(loco.o.matrixWorld); up.set(s * Math.cos(loco.yaw) * 2.6, 0.6, -s * Math.sin(loco.yaw) * 2.6); emit(chim, up, 0.35, 1.6, 1.6); }   // xả hơi ở xi lanh khi khởi động
  }
  // camera ở trong toa i → ẩn kính sáng của toa đó (nhìn xuyên cửa sổ ra ngoài)
  const setHideGlow = i => { if (st.hideGlow === i) return; st.hideGlow = i; coaches.forEach((c, k) => glowI.setMatrixAt(k, k === i ? ZERO : c.o.matrixWorld)); glowI.instanceMatrix.needsUpdate = true; };
  return { group, cars, coaches, place, animate, setHideGlow, state: st, smoke };
}
