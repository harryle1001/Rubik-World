// glider.js — DIỀU LƯỢN RUBIK (thiết kế riêng: diều sáo Việt Nam hình trăng khuyết, khung tre, 6 múi vải màu Rubik, mặt trống đồng, sáo tre, 2 đuôi lụa).
// - Rơi từ trên cao (> 5 m hoặc > 1 s) → diều TỰ BUNG; bấm Nhảy giữa không trung để bung/thu.
// - Lượn: ⬅➡ rẽ · ⬆ chúc xuống tăng tốc · ⬇ ngẩng lên giảm tốc; cột khí nóng (lửa trại, ống khói, vách đón gió — có hạt bay lên) nâng người lên; gió weather.js đẩy trôi nhẹ.
// - Thử thách: 3 bệ lượn với 3 · 5 · 8 vòng (Fibonacci), kỷ lục quãng lượn xa (localStorage), điểm lượn trên bản đồ M, thẻ kiến thức lực nâng / lực cản / trọng lực.
// - Nút đỏ khi lái máy bay (phím X / U): nhảy ra → rơi tự do 1 s → bung diều; máy bay tự lái về đường băng (aircraft.eject).
//   Thay cho dù tròn parachute.js cũ (đã gộp vào đây): giữ thử thách "đáp trúng đích" ở các bãi ctx.chuteTargets (vòng 13 · 8 · 3 m → 1–3 ⭐) và ctx.chute.active.
// Tự chứa: ocean.js gọi createGlider(ctx) và glider.update(dt, t) SAU player.update/aircraft.update. player.js chỉ hỏi self.glide { on, steer, sink, camAdd }.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from './config.js';
import { PHI, FIB, TEMPLE_C } from './layout.js';
import { gradientMap } from './style.js';
import { T, damp, ease, wrapAngle } from './motion.js';
import { ridePose, rideReset } from './ride-pose.js';
import { CHIMNEYS } from './decor.js';
import { WIND } from './terrain.js';
import { toWorld as acW } from './academy/plan.js';
import { Batch } from './academy/geo.js';
import { matV } from './sample/palette.js';

const COL6 = ['#1fa55a', '#ff8a1f', '#f4f1e6', '#ffd21f', '#e23b3b', '#2372e0'];   // lục · cam · trắng | vàng · đỏ · lam (6 mặt Rubik)
const BAMBOO = '#c8a45c', BAMBOO_D = '#8a6a3a';
// Bay: tốc độ ngẩng 5 · bay bằng 8 · chúc 13 m/s (Fibonacci); rơi 1/φ · 8/φ⁴ ≈ 1,17 · φ³ ≈ 4,2 m/s
const V_FLARE = 5, V_CRUISE = 8, V_DIVE = 13, S_FLARE = 1 / PHI, S_CRUISE = 8 / PHI ** 4, S_DIVE = PHI ** 3;
const TURN = 1.3, STAM_T = 55, OPEN_H = 5, OPEN_T = 1, CAM_ADD = 3;            // xoay 1,3 rad/s · thể lực 55 s · tự bung khi cao > 5 m hoặc rơi > 1 s · camera lùi 3 m
const TILT = 1.0, PIVOT = new THREE.Vector3(0, 1.0, 0.8);                       // thân chúi 1 rad (nằm sấp dưới diều); tâm nghiêng/chúc
const RING_R = PHI ** 2, RING_GAP = 21, RING_DROP = S_CRUISE / V_CRUISE * 1.06;   // vòng bán kính φ² m, cách 21 m, hạ theo đúng dốc lượn bay bằng (≈ 0,155 m mỗi mét)
const T_RINGS = [13, 8, 3], T_KEY = 'rs.chute.best';                              // bãi đáp trúng đích (nhảy khỏi máy bay): bán kính Fibonacci 13 · 8 · 3 m
const lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const FACT = {
  open: '🪁 <b>Trọng lực</b> kéo em rơi xuống, nhưng cánh diều hứng không khí tạo ra <b>lực nâng</b> đỡ em lại → em lượn đi thật êm.',
  dive: '⬇️ Chúc mũi xuống: <b>trọng lực</b> kéo mạnh hơn → bay nhanh hơn, nhưng mất độ cao nhanh hơn.',
  flare: '⬆️ Ngẩng mũi lên: cánh đón nhiều gió hơn → <b>lực cản</b> tăng → bay chậm lại và rơi chậm hơn.',
  thermal: '🔥 Không khí nóng nhẹ hơn nên <b>bốc lên cao</b>. Chim đại bàng và diều lượn nương theo cột khí nóng để lên cao mà không tốn sức!',
  ridge: '🍃 Gió gặp vách đá thì bị đẩy <b>vọt lên trên</b>. Người lượn dù tìm vách đón gió để được nâng lên.',
  wind: '🍃 Gió thổi ngang đang đẩy diều trôi theo: bay <b>xuôi gió</b> thì nhanh, <b>ngược gió</b> thì chậm.',
  stall: '🧱 Vướng vật cản: diều mất tốc độ nên <b>mất lực nâng</b> và tụt xuống. Rẽ sang hướng trống để bay tiếp!',
  tired: '😮‍💨 Hết sức giữ diều: diều hạ nhanh hơn. Tìm <b>cột khí nóng</b> để nghỉ, hoặc tiếp đất rồi bay tiếp nhé!',
};

// ---------- hình: khối cơ bản gộp + màu theo đỉnh ----------
const _c = new THREE.Color();
function tint(g, col) { g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv'); _c.set(col); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
const _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _q = new THREE.Quaternion();
function stick(a, b, r, col, seg = 5) {   // thanh tre nối a → b
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(), g = new THREE.CylinderGeometry(r, r, L, seg, 1);
  g.applyQuaternion(_q.setFromUnitVectors(_up, _d.normalize())); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); return tint(g, col);
}
const SPAN = 2.1, NS = 12;   // nửa sải cánh 2,1 m (Fibonacci 21; sải 4,2 m), 12 đốt = 6 múi × 2
const st = s => ({ x: s * SPAN, le: 0.6 - 0.42 * s * s, te: -0.85 + 0.87 * s * s, y: 0.42 * s * s });   // trăng khuyết: giữa rộng 1,45 m, mút cánh vểnh lên 0,42 m
const vmat = (opts = {}) => new THREE.MeshToonMaterial(Object.assign({ color: '#ffffff', gradientMap, vertexColors: true }, opts));

function drumTexture() {   // mặt trống đồng: ngôi sao 14 cánh + các vành hoa văn (vẽ canvas 128 px)
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), m = S / 2;
  g.fillStyle = '#7a5a2a'; g.beginPath(); g.arc(m, m, m, 0, 7); g.fill();
  g.strokeStyle = '#e8c56a'; g.fillStyle = '#e8c56a';
  for (const [r, w] of [[61, 3], [50, 1.5], [38, 1.5], [27, 2]]) { g.lineWidth = w; g.beginPath(); g.arc(m, m, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 21; i++) { const a = i / 21 * 6.283; g.beginPath(); g.arc(m + Math.cos(a) * 55.5, m + Math.sin(a) * 55.5, 2.2, 0, 7); g.fill(); }              // vành chấm (21)
  g.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; g.save(); g.translate(m + Math.cos(a) * 44, m + Math.sin(a) * 44); g.rotate(a + 1.57); g.beginPath(); g.moveTo(-6, 2); g.lineTo(0, -3); g.lineTo(6, 2); g.moveTo(0, -3); g.lineTo(0, 4); g.stroke(); g.restore(); }   // 8 cánh chim cách điệu
  for (let i = 0; i < 13; i++) { const a = i / 13 * 6.283; g.beginPath(); g.arc(m + Math.cos(a) * 32.5, m + Math.sin(a) * 32.5, 1.6, 0, 7); g.fill(); }
  g.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283 - 1.571, r = i % 2 ? 9 : 25; g[i ? 'lineTo' : 'moveTo'](m + Math.cos(a) * r, m + Math.sin(a) * r); } g.closePath(); g.fillStyle = '#ffd97a'; g.fill();   // sao 14 cánh
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function buildKite() {
  const g = new THREE.Group(); g.name = 'rubik-kite';
  // vải: 12 đốt × 2 hàng (mép trước – giữa phồng – mép sau), mỗi múi 1 màu Rubik
  const pos = [], col = [], flut = [];   // flut: [chỉ số đỉnh, y gốc, độ rung (0 mép trước … 1 mép sau), pha]
  const P = (i, j) => { const q = st(i / NS * 2 - 1), z = j === 0 ? q.le : j === 1 ? (q.le + q.te) / 2 : q.te; return [q.x, q.y + (j === 1 ? 0.09 * (1 - (i / NS * 2 - 1) ** 2) : 0), z]; };
  for (let i = 0; i < NS; i++) {
    _c.set(COL6[Math.floor(i / 2)]);
    for (let j = 0; j < 2; j++) for (const [ii, jj] of [[i, j], [i, j + 1], [i + 1, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]]) {
      const p = P(ii, jj); flut.push([pos.length / 3, p[1], jj / 2, p[0] * 2.6 + p[2] * 3]); pos.push(p[0], p[1], p[2]); col.push(_c.r, _c.g, _c.b);
    }
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); wg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3)); wg.computeVertexNormals();
  const wing = new THREE.Mesh(wg, vmat({ side: THREE.DoubleSide })); wing.castShadow = true; g.add(wing);
  // khung tre: cần mép trước, 7 nan, sống giữa, thanh ngang + 2 thanh chống chữ A, 3 ống sáo, dây đai
  const B = [], bar = [0, -0.78, 0.42];
  for (let i = 0; i < NS; i++) { const a = P(i, 0), b = P(i + 1, 0); B.push(stick([a[0], a[1] - 0.01, a[2] + 0.02], [b[0], b[1] - 0.01, b[2] + 0.02], 0.028, BAMBOO)); }
  for (let i = 0; i <= NS; i += 2) { const a = P(i, 0), b = P(i, 2); B.push(stick([a[0], a[1] - 0.015, a[2]], [b[0], b[1] - 0.015, b[2]], 0.016, BAMBOO_D, 4)); }
  B.push(stick([0, -0.02, 0.74], [0, -0.02, -1.02], 0.026, BAMBOO));
  B.push(stick([-0.44, bar[1], bar[2]], [0.44, bar[1], bar[2]], 0.026, BAMBOO, 6));
  for (const s of [-1, 1]) { B.push(stick([s * 0.4, bar[1], bar[2]], [0, -0.02, 0.3], 0.02, BAMBOO)); B.push(tint(new THREE.SphereGeometry(0.04, 6, 4).translate(s * 0.44, bar[1], bar[2]), '#e23b3b')); }
  [[0.5, 0.045, 0.16], [0.36, 0.036, 0.07], [0.24, 0.028, -0.005]].forEach(([L, r, z]) => B.push(stick([-L / 2, 0.15, z], [L / 2, 0.15, z], r, i3(z), 6)));   // sáo diều 3 ống
  B.push(stick([0, -0.02, -0.1], [0, -0.7, -0.32], 0.008, '#6b4a2b', 3));   // dây đai treo người
  function i3(z) { return z > 0.1 ? '#b88a44' : z > 0 ? '#c8a45c' : '#d8b874'; }
  const frame = new THREE.Mesh(mergeGeometries(B), vmat()); frame.castShadow = true; g.add(frame);
  // mặt trống đồng giữa lưng diều
  const drum = new THREE.Mesh(new THREE.CircleGeometry(0.42, 21).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ map: drumTexture(), gradientMap, side: THREE.DoubleSide }));
  drum.position.set(0, 0.105, -0.12); g.add(drum);
  const hand = new THREE.Object3D(); hand.position.set(bar[0], bar[1], bar[2]); g.add(hand);
  return { g, wing, wg, flut, hand, tips: [new THREE.Vector3(SPAN, 0.42, 0.1), new THREE.Vector3(-SPAN, 0.42, 0.1)], tails: [new THREE.Vector3(0.35, 0, -0.75), new THREE.Vector3(-0.35, 0, -0.75)] };
}

export function createGlider(ctx) {
  const { scene, terrain, player } = ctx, W = CFG.island.waterLevel, mobile = CFG.isMobile, hasTouch = matchMedia('(pointer:coarse)').matches;
  // mặt đỡ bên dưới (đất, sàn, mặt nước, nóc nhà thấp hơn chân)
  const floorAt = (x, z, y) => {
    let h = Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, y) : -99, W);
    if (ctx.grid) for (const b of ctx.grid.near(x, z).boxes) if (b.top <= y + 0.6 && b.top > h && x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) h = b.top;
    return h;
  };
  const roofAt = (x, z) => { let h = Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 999) : -99, W); if (ctx.grid) for (const b of ctx.grid.near(x, z).boxes) if (b.top > h && x > b.x0 - 2 && x < b.x1 + 2 && z > b.z0 - 2 && z < b.z1 + 2) h = b.top; return h; };

  // ---------- diều + khung treo ----------
  const K = buildKite(), rig = new THREE.Group(); rig.position.copy(PIVOT); rig.visible = false; player.root.add(rig);
  K.g.position.set(0, 0.78, 0.2); K.g.rotation.x = -0.12; rig.add(K.g);                 // mũi diều ngóc nhẹ (góc tấn)
  const foot = new THREE.Object3D(); foot.position.set(0, -PIVOT.y + 0.1, -PIVOT.z - 0.12); rig.add(foot);
  const RIDE = { hand: K.hand, hands: [new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(-0.3, 0, 0)], foot, feet: [new THREE.Vector3(0.13, 0, 0), new THREE.Vector3(-0.13, 0, 0)], lean: -0.3 };

  // ---------- đuôi lụa (2) + khăn quàng đỏ (1): dải băng trong hệ thế giới, 1 draw call ----------
  const RB = [{ n: 8, L: 1.7, w: 0.05, col: '#e23b3b' }, { n: 8, L: 1.7, w: 0.05, col: '#ffd21f' }, { n: 6, L: 0.95, w: 0.07, col: '#e53935' }];
  const rbN = RB.reduce((a, r) => a + (r.n + 1) * 2, 0), rbP = new Float32Array(rbN * 3), rbC = new Float32Array(rbN * 3), rbNm = new Float32Array(rbN * 3), rbI = [];
  { let o = 0; for (const r of RB) { r.o = o; _c.set(r.col); for (let k = 0; k <= r.n; k++) for (let s = 0; s < 2; s++) { const i = o + k * 2 + s; rbC.set([_c.r, _c.g, _c.b], i * 3); rbNm[i * 3 + 1] = 1; } for (let k = 0; k < r.n; k++) { const a = o + k * 2; rbI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } o += (r.n + 1) * 2; } }
  const rbG = new THREE.BufferGeometry(); rbG.setAttribute('position', new THREE.BufferAttribute(rbP, 3)); rbG.setAttribute('color', new THREE.BufferAttribute(rbC, 3)); rbG.setAttribute('normal', new THREE.BufferAttribute(rbNm, 3)); rbG.setIndex(rbI);
  const ribbons = new THREE.Mesh(rbG, vmat({ side: THREE.DoubleSide })); ribbons.frustumCulled = false; ribbons.visible = false; ribbons.userData.noCamOcc = true; scene.add(ribbons);   // noCamOcc: cam-occlude.js không coi dải lụa là vật che camera
  // ---------- vệt gió đầu cánh: 2 dải mờ dần (cộng sáng) ----------
  const TN = 21, trP = new Float32Array(2 * TN * 2 * 3), trC = new Float32Array(2 * TN * 2 * 3), trI = [], hist = [[], []];
  for (let s = 0; s < 2; s++) for (let k = 0; k < TN - 1; k++) { const a = (s * TN + k) * 2; trI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  for (let s = 0; s < 2; s++) for (let k = 0; k < TN; k++) hist[s].push(new THREE.Vector3());
  const trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(trP, 3)); trG.setAttribute('color', new THREE.BufferAttribute(trC, 3)); trG.setIndex(trI);
  const trails = new THREE.Mesh(trG, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); trails.frustumCulled = false; trails.visible = false; scene.add(trails);

  // ---------- cột khí nóng ----------
  const thermals = [];   // { x, z, y0, top, r, pow, kind: 'fire' | 'chim' | 'ridge' }
  const addThermal = (x, z, kind, r, pow, rise, y0) => { y0 = y0 ?? Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 999) : -99, W); const t = { x, z, y0, top: y0 + rise, r, pow, kind }; thermals.push(t); return t; };
  const [TX, TZ] = TEMPLE_C, U8 = Math.SQRT1_2, camp = (u, v) => [TX + u * U8 + v * U8, TZ - u * U8 + v * U8], FIRE0 = camp(11, 15);   // lửa trại khu cắm trại cạnh Đền Tri Thức (ocean.js đặt prop-campfire ở đây)
  addThermal(FIRE0[0], FIRE0[1], 'fire', 5, 5, 34);
  let nFire = 0, nChim = 0;
  const syncThermals = () => {   // lửa trại/ống khói được thêm dần khi thị trấn dựng xong
    const F = ctx.fires || []; for (; nFire < F.length; nFire++) addThermal(F[nFire][0], F[nFire][1], 'fire', 5, 5, 34);
    for (; nChim < CHIMNEYS.length; nChim++) { const c = CHIMNEYS[nChim]; addThermal(c.x, c.z, 'chim', 3.4, 4, 21, c.y); }
  };
  const TH = { lift: 0, kind: null, t: null };
  const thermalAt = P => {
    let best = 0, kind = null, bt = null;
    for (const t of thermals) { const dx = P.x - t.x, dz = P.z - t.z, d2 = dx * dx + dz * dz; if (d2 >= t.r * t.r || P.y < t.y0 - 1 || P.y > t.top) continue; const l = t.pow * Math.sqrt(1 - d2 / (t.r * t.r)) * clamp((t.top - P.y) / 8, 0, 1); if (l > best) { best = l; kind = t.kind; bt = t; } }
    TH.lift = best; TH.kind = kind; TH.t = bt; return TH;
  };
  // hạt bay lên báo hiệu cột khí: 5 cột gần nhất, mỗi cột 1/5 số hạt
  const PN = mobile ? 55 : 89, SLOTS = 5, pP = new Float32Array(PN * 3), pA = new Float32Array(PN), pC = new Float32Array(PN * 3), pSeed = new Float32Array(PN * 3), slot = new Array(SLOTS).fill(null);
  for (let i = 0; i < PN * 3; i++) pSeed[i] = Math.random();
  const pG = new THREE.BufferGeometry(); pG.setAttribute('position', new THREE.BufferAttribute(pP, 3)); pG.setAttribute('a', new THREE.BufferAttribute(pA, 1)); pG.setAttribute('color', new THREE.BufferAttribute(pC, 3));
  const motes = new THREE.Points(pG, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexColors: true,
    vertexShader: 'attribute float a; varying float vA; varying vec3 vC; void main(){ vA = a; vC = color; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = min(34., (0.5 + a) * 150. / -mv.z) * step(0.004, a); }',
    fragmentShader: 'varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(vC, smoothstep(.5,.12,d)*vA); }' }));
  motes.frustumCulled = false; motes.visible = false; scene.add(motes);
  const MC = { fire: new THREE.Color('#ffc27a'), chim: new THREE.Color('#f0ece0'), ridge: new THREE.Color('#a8e0ff') };
  let slotT = 0;
  function updateMotes(dt, t, P, flying) {
    if ((slotT -= dt) <= 0) {
      slotT = 0.5; const near = [];
      for (const th of thermals) { if (th.kind === 'chim' && !flying) continue; const d = Math.hypot(th.x - P.x, th.z - P.z); if (d < 144) near.push([d, th]); }
      near.sort((a, b) => a[0] - b[0]); for (let s = 0; s < SLOTS; s++) slot[s] = near[s] ? near[s][1] : null;
      motes.visible = !!slot[0];
    }
    if (!motes.visible) return;
    for (let i = 0; i < PN; i++) {
      const th = slot[i % SLOTS]; if (!th) { pA[i] = 0; continue; }
      const u = (pSeed[i * 3] + t * (0.09 + pSeed[i * 3 + 1] * 0.06)) % 1, H = th.top - th.y0, a = pSeed[i * 3 + 2] * 6.283 + t * 0.7 + u * 3, r = th.r * (0.25 + 0.6 * pSeed[i * 3 + 1]) * (0.7 + u * 0.5);
      pP[i * 3] = th.x + Math.cos(a) * r; pP[i * 3 + 1] = th.y0 + 0.6 + u * H * 0.9; pP[i * 3 + 2] = th.z + Math.sin(a) * r;
      pA[i] = Math.min(1, u * 8) * (1 - u) * (th.kind === 'ridge' ? 0.75 : 0.6); const c = MC[th.kind]; pC[i * 3] = c.r; pC[i * 3 + 1] = c.g; pC[i * 3 + 2] = c.b;
    }
    pG.attributes.position.needsUpdate = pG.attributes.a.needsUpdate = pG.attributes.color.needsUpdate = true;
  }

  // ---------- bệ lượn + đường vòng 3 · 5 · 8 ----------
  const [cx3, cz3] = acW(49, 40);   // mép vách cao nguyên Học viện Pha Lê (55 m), nhìn ra hồ
  const COURSES = [
    { name: 'Bệ lượn Lửa Trại', n: FIB[3], x: camp(15.5, 10.5)[0], z: camp(15.5, 10.5)[1], lift: FIRE0 },   // 3 vòng: nhảy vào cột khí lửa trại (khu cắm trại cạnh đền) để lên cao
    { name: 'Bệ lượn Đồi Gió', n: FIB[4], x: 80, z: -192, ridge: 34, off: 5 },                          // 5 vòng: đồi phía bắc, luồng gió vách nâng lên
    { name: 'Bệ lượn Vách Pha Lê', n: FIB[5], x: cx3, z: cz3, dir: 0, cliff: true },           // 8 vòng: lao khỏi vách 55 m ra hồ
  ];
  const rings = [], dummy = new THREE.Object3D();
  function layCourse(c, ci) {
    if (c.off) { let bh = -99, bx = c.x, bz = c.z; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, x = c.x + Math.cos(a) * c.off, z = c.z + Math.sin(a) * c.off, h = terrain.heightAt(x, z); if (h > bh) { bh = h; bx = x; bz = z; } } c.x = bx; c.z = bz; }   // đỉnh đồi đã có vật khác (khối Rubik vàng): dời bệ sang sườn cao nhất cách 5 m
    c.y = Math.max(terrain.heightAt(c.x, c.z), ctx.groundExtra ? ctx.groundExtra(c.x, c.z, 999) : -99); c.rings = [];
    let y0 = c.y - 1, sx = c.x, sz = c.z, r0 = 3;   // r0: quãng bay đầu chưa hạ độ cao (còn trong cột khí / vừa rời mép vách)
    if (c.ridge) { const t = addThermal(c.x, c.z, 'ridge', 8, 5, c.ridge); y0 = t.top - 2; r0 = t.r; }
    if (c.lift) { sx = c.lift[0]; sz = c.lift[1]; y0 = Math.max(terrain.heightAt(sx, sz), W) + 34 - 2; r0 = 5; }
    const cost = d => { let m = -99; for (let k = 1; k <= c.n + 2; k++) m = Math.max(m, roofAt(sx + Math.sin(d) * k * RING_GAP, sz + Math.cos(d) * k * RING_GAP) + k * RING_GAP * RING_DROP); return m + (roofAt(sx + Math.sin(d) * (c.n + 2) * RING_GAP, sz + Math.cos(d) * (c.n + 2) * RING_GAP) <= W + 0.1 ? 3 : 0); };
    if (c.dir === undefined) { let bd = 0, bc = 1e9; for (let i = 0; i < 16; i++) { const d = i / 16 * Math.PI * 2, s = cost(d); if (s < bc) { bc = s; bd = d; } } c.dir = bd; }
    const fx = Math.sin(c.dir), fz = Math.cos(c.dir);
    if (c.cliff) addThermal(c.x + fx * 13, c.z + fz * 13, 'ridge', 8, 3.4, c.y + 13 - W, W);   // gió dội vách: nâng nhẹ ngay trước mép
    for (let k = 0; k < c.n; k++) {
      const d = (k + 1) * RING_GAP, off = Math.sin(k * 1.2) * 5 * Math.min(1, k / 2), x = sx + fx * d + fz * off, z = sz + fz * d - fx * off;
      const R = { x, z, y: Math.max(y0 - Math.max(0, d - r0) * RING_DROP, roofAt(x, z) + RING_R + 3), nx: fx, nz: fz, ry: c.dir, ci, k, side: 0 }; c.rings.push(R); rings.push(R);
    }
    try { c.best = +localStorage.getItem('rs.glide.c' + ci) || 0; } catch (e) { c.best = 0; }
  }
  let ringMesh = null, padMesh = null, laid = false;
  function layAll() {
    laid = true; COURSES.forEach(layCourse);
    ringMesh = new THREE.InstancedMesh(new THREE.TorusGeometry(RING_R, 0.16, 6, 21), new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap, emissive: '#ffffff', emissiveIntensity: 0.08 }), rings.length);
    ringMesh.frustumCulled = false; ringMesh.visible = false; ringMesh.userData.noCamOcc = true; scene.add(ringMesh);
    rings.forEach((R, i) => ringMesh.setColorAt(i, _c.set(COL6[[4, 1, 3, 0, 5, 2][R.k % 6]]))); ringMesh.instanceColor.needsUpdate = true;
    // bệ: 6 ô lục giác màu Rubik quanh mâm đá + cột tre treo diều con (gộp 1 mesh cho cả 3 bệ)
    const G = [];
    for (const c of COURSES) {
      G.push(tint(new THREE.CylinderGeometry(1.7, 1.9, 0.16, 6).translate(c.x, c.y + 0.08, c.z), '#cfc6b4'));
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.52; G.push(tint(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 6).translate(c.x + Math.cos(a) * 1.1, c.y + 0.19, c.z + Math.sin(a) * 1.1), COL6[i])); }
      const px = c.x - Math.sin(c.dir) * 2.4 + Math.cos(c.dir) * 1.2, pz = c.z - Math.cos(c.dir) * 2.4 - Math.sin(c.dir) * 1.2, py = Math.max(terrain.heightAt(px, pz), ctx.groundExtra ? ctx.groundExtra(px, pz, 999) : -99);
      G.push(stick([px, py, pz], [px, py + 3.4, pz], 0.06, BAMBOO, 6));
      const mini = K.wg.clone().scale(0.4, 0.4, 0.4).rotateX(-0.5).rotateY(c.dir).translate(px, py + 3.5, pz); mini.deleteAttribute('normal'); mini.computeVertexNormals(); G.push(mini);
      (ctx.colliders || []).push({ x: px, z: pz, r: 0.15, h: 4 });
    }
    padMesh = new THREE.Mesh(mergeGeometries(G.map(g => { g.deleteAttribute('normal'); g.computeVertexNormals(); return g; })), vmat({ side: THREE.DoubleSide })); padMesh.castShadow = true; padMesh.receiveShadow = true; padMesh.name = 'glide-pads'; scene.add(padMesh);
  }
  let run = null, ringT = 0;   // run: { ci, next, t0 }
  function drawRings(t, P) {
    let any = false;
    rings.forEach((R, i) => {
      const c = COURSES[R.ci], nearC = (c.x - P.x) ** 2 + (c.z - P.z) ** 2 < 377 * 377, done = run && run.ci === R.ci && R.k < run.next, nxt = run ? run.ci === R.ci && R.k === run.next : R.k === 0;
      const s = !nearC || done ? 0 : nxt ? 1 + Math.sin(t * PHI * 2) * 0.08 : 0.9; any = any || s > 0;
      dummy.position.set(R.x, R.y, R.z); dummy.rotation.set(0, R.ry, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); ringMesh.setMatrixAt(i, dummy.matrix);
    });
    ringMesh.instanceMatrix.needsUpdate = true; ringMesh.visible = any;
  }
  function checkRings(P, t) {
    for (const R of rings) {
      const active = run ? run.ci === R.ci && R.k === run.next : R.k === 0; if (!active) { R.side = 0; continue; }
      const dx = P.x - R.x, dy = P.y + 0.8 - R.y, dz = P.z - R.z, side = dx * R.nx + dz * R.nz, prev = R.side; R.side = side;
      if (!(prev < 0 && side >= 0 && Math.hypot(dx - R.nx * side, dy, dz - R.nz * side) < RING_R + 0.4)) continue;
      const c = COURSES[R.ci]; if (!run) run = { ci: R.ci, next: 0, t0: t };
      run.next++; ctx.sfx && ctx.sfx('coin');
      if (run.next < c.n) ctx.toast(`⭕ Qua vòng <b>${run.next}/${c.n}</b> — ${c.name}!`, 2200);
      else {
        const sec = t - run.t0; if (!c.best || sec < c.best) { c.best = sec; try { localStorage.setItem('rs.glide.c' + R.ci, sec.toFixed(1)); } catch (e) {} }
        ctx.toast(`🏆 Lượn xuyên đủ <b>${c.n} vòng</b> ${c.name} trong <b>${sec.toFixed(1)} s</b> ⭐⭐⭐ · kỷ lục ${c.best.toFixed(1)} s<br>💡 3, 5, 8 là ba số Fibonacci liền nhau: 3 + 5 = <b>8</b>.`, 7000);
        G.done = (G.done || 0) + 1; run = null; for (const q of rings) q.side = 0;
      }
      return;
    }
  }

  // ---------- kỷ lục quãng lượn ----------
  let top = []; try { top = JSON.parse(localStorage.getItem('rs.glide.top') || '[]'); if (!Array.isArray(top)) top = []; } catch (e) { top = []; }
  const saveTop = (d, h) => { top.push({ d: Math.round(d), h: Math.round(h) }); top.sort((a, b) => b.d - a.d); top = top.slice(0, 5); try { localStorage.setItem('rs.glide.top', JSON.stringify(top)); } catch (e) {} };
  const board = () => ctx.toast('📋 <b>Kỷ lục lượn xa</b><br>' + (top.length ? top.map((r, i) => `${['🥇', '🥈', '🥉', '4.', '5.'][i]} <b>${r.d} m</b> (cao nhất ${r.h} m)`).join('<br>') : 'Chưa có — bung diều và lượn thật xa nào!') +
    '<br>' + COURSES.map(c => `⭕ ${c.n} vòng: ${c.best ? c.best.toFixed(1) + ' s' : '—'}`).join(' · '), 8000);

  // ---------- giao diện: thanh thể lực + nút đỏ nhảy khỏi máy bay ----------
  const css = document.createElement('style');
  css.textContent = `#glHud{position:fixed;left:50%;top:calc(max(12px,env(safe-area-inset-top)) + 89px);transform:translate(-50%,-8px);z-index:26;display:flex;align-items:center;gap:8px;padding:5px 13px 5px 8px;border-radius:16px;background:#0f1a2acc;color:#f7ecd0;font:700 13px system-ui;white-space:nowrap;opacity:0;transition:opacity .4s,transform .4s;pointer-events:none}
#glHud.on{opacity:1;transform:translate(-50%,0)}@media (max-width:700px){#glHud{top:calc(max(12px,env(safe-area-inset-top)) + 204px)}}#glHud i{display:block;width:55px;height:8px;border-radius:5px;background:#ffffff26;overflow:hidden}#glHud b{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#ffd21f,#52d273);transform-origin:left}
#glHud.low b{background:linear-gradient(90deg,#ff6b4a,#ffb84a)}body.rs-modal #glHud,body.rs-modal #bEject{display:none}
#bEject{position:fixed;z-index:27;right:calc(max(16px,env(safe-area-inset-right)) + 97px);bottom:max(18px,env(safe-area-inset-bottom));width:84px;height:84px;border-radius:50%;border:3px solid #fff;background:radial-gradient(circle at 38% 30%,#ff7a6b,#d81e1e 62%,#a01212);color:#fff;font:800 13px/1.15 system-ui;box-shadow:0 5px 13px #0006;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer}
#bEject span{display:block;font-size:26px;line-height:1}@media (pointer:fine){#bEject{right:auto;left:max(21px,env(safe-area-inset-left));bottom:89px}}`;
  document.head.appendChild(css);
  const hud = document.createElement('div'); hud.id = 'glHud'; hud.innerHTML = '<span>🪁</span><i><b></b></i><span class="t"></span>'; document.body.appendChild(hud);
  const hudBar = hud.querySelector('b'), hudTxt = hud.querySelector('.t');
  const bEject = document.createElement('button'); bEject.id = 'bEject'; bEject.hidden = true; bEject.title = 'Nhảy khỏi máy bay, bung diều lượn (X / U)'; bEject.innerHTML = '<span>🪁</span>Nhảy ra' + (hasTouch ? '' : ' (X)'); document.body.appendChild(bEject);
  // bãi đáp trúng đích (regions/ ghi ctx.chuteTargets): vòng đỏ trắng 13 · 8 · 3 m + cột sáng, chỉ hiện khi đang rơi/lượn sau khi nhảy khỏi máy bay
  const H0 = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 999) : -99);
  let targets = [], tMesh = null, tBest = 0; try { tBest = +localStorage.getItem(T_KEY) || 0; } catch (e) {}
  function buildTargets() {
    targets = (ctx.chuteTargets || []).map(t => ({ ...t, y: Math.max(H0(t.p[0], t.p[1]), W) })); if (!targets.length) return;
    const b = new Batch(), beam = new Batch();
    for (const t of targets) { T_RINGS.forEach((r, i) => b.add(new THREE.CircleGeometry(r, 34), i % 2 ? '#f3efe6' : '#d8433a', t.p[0], t.y + 0.06 + i * 0.02, t.p[1], 0, -Math.PI / 2)); beam.cyl(t.p[0], t.y, t.p[1], 0.8, 89, '#ffe3a0', 8); }
    tMesh = new THREE.Group(); tMesh.name = 'chute-targets'; tMesh.userData.noCamOcc = true;
    tMesh.add(new THREE.Mesh(b.build(), matV()), new THREE.Mesh(beam.build(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false })));
    tMesh.visible = false; scene.add(tMesh);
  }
  const nearestT = (x, z) => { let b = null; for (const t of targets) { const d = Math.hypot(t.p[0] - x, t.p[1] - z); if (!b || d < b.d) b = { t, d }; } return b; };
  const eject = () => {
    const A = ctx.aircraft, o = A && A.eject && A.phase === 'fly' ? A.eject() : null; if (!o) return;   // aircraft.js: máy bay bật lái tự động về đường băng gần nhất
    const fx = Math.sin(o.yaw), fz = Math.cos(o.yaw);
    player.vehicle = null; player.root.quaternion.identity(); player.root.rotation.set(0, o.yaw, 0);
    player.teleport(o.x, o.z, o.y - 1.3); player.setRot(o.yaw); player.cam.yaw = o.yaw + Math.PI; player.vel.set(fx * o.spd * 0.5, 0, fz * o.spd * 0.5); player.vy = 1;
    G.manual = false; G.fromPlane = true; G.lastDist = 0; if (!tMesh) buildTargets(); if (tMesh) tMesh.visible = true;
    const nt = nearestT(o.x, o.z);
    ctx.toast(`🪁 <b>Nhảy!</b> Rơi tự do… diều <b>tự bung</b> sau 1 giây (hoặc bấm ${hasTouch ? '<b>🪁 Bung</b>' : '<b>Space</b>'}).${nt ? `<br>🎯 Bãi đáp gần nhất: <b>${nt.t.name}</b> · cách ${Math.round(nt.d)} m — lượn về cột sáng vàng, trúng tâm 3 m được ⭐⭐⭐` : ''}`, 6000);
    ctx.sfx && ctx.sfx('jump');
  };
  // tiếp đất sau khi nhảy khỏi máy bay: chấm đáp trúng đích
  function landPlane() {
    G.fromPlane = false; if (tMesh) tMesh.visible = false;
    const P = player.pos, d = G.lastDist || 0;
    if (P.y <= W + 0.4 && terrain.heightAt(P.x, P.z) < W) { ctx.toast(`🌊 Đáp xuống biển sau khi lượn <b>${Math.round(d)} m</b>! Bơi vào bờ nhé (nút 🤿 để lặn).`, 4000); return; }
    player.emote && player.emote('cheer');
    const nt = nearestT(P.x, P.z);
    if (nt && nt.d <= T_RINGS[0]) {
      const st = nt.d <= T_RINGS[2] ? 3 : nt.d <= T_RINGS[1] ? 2 : 1;
      if (st > tBest) { tBest = st; try { localStorage.setItem(T_KEY, st); } catch (e) {} }
      ctx.reward && ctx.reward(st, `Lượn diều đáp trúng đích ${nt.t.name}`);
      ctx.toast(`🎯 Đáp cách tâm <b>${nt.d.toFixed(1)} m</b> ở ${nt.t.name} ${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}<br>💡 Cánh diều tạo <b>lực nâng</b> và <b>lực cản</b> chống lại trọng lực → rơi chậm từ ~120 km/h xuống còn ~4 km/h.`, 7000);
    } else ctx.toast(`🪁 Tiếp đất an toàn sau khi lượn <b>${Math.round(d)} m</b>!${nt ? ` Bãi đáp gần nhất: <b>${nt.t.name}</b> (cách ${Math.round(nt.d)} m) — lần sau nhắm vòng đỏ trắng để nhận ⭐.` : ''}`, 5500);
  }
  bEject.addEventListener('pointerdown', e => { e.preventDefault(); eject(); });
  addEventListener('keydown', e => { if ((e.code === 'KeyX' || e.code === 'KeyU') && !e.repeat) eject(); });
  const bJump = document.getElementById('bJump'); let jumpLb = '';
  const setJump = s => { if (bJump && jumpLb !== s) { jumpLb = s; bJump.textContent = s || 'Nhảy'; } };

  // ---------- tiếng gió + tiếng sáo diều (WebAudio, tạo khi bung lần đầu) ----------
  let snd = null;
  function initSound() {
    const L = ctx.audio && ctx.audio.listener; if (!L || !ctx.audio.on || L.context.state !== 'running') return;
    const ac = L.context, buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0); let b = 0; for (let i = 0; i < d.length; i++) { b = b * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = b * 6; }
    const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = buf; src.loop = true; fl.type = 'bandpass'; fl.frequency.value = 500; fl.Q.value = 0.6; g.gain.value = 0; src.connect(fl).connect(g).connect(L.getInput()); src.start();
    const fg = ac.createGain(); fg.gain.value = 0; fg.connect(L.getInput()); const os = [];
    for (const [f, v] of [[392, 1], [588, 0.5], [784, 0.25]]) { const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.value = f; og.gain.value = v; o.connect(og).connect(fg); o.start(); os.push([o, f]); }   // sáo 3 ống: Son – Rê – Son (quãng 5)
    snd = { ac, g, fl, fg, os };
  }
  function updateSound(t) {
    if (!snd) return; const now = snd.ac.currentTime, k = G.k, s = G.v / V_DIVE;
    snd.g.gain.setTargetAtTime(k * (0.05 + s * s * 0.32), now, 0.15); snd.fl.frequency.setTargetAtTime(380 + G.v * 70 + Math.sin(t * 1.3) * 60, now, 0.2);
    snd.fg.gain.setTargetAtTime(k * Math.max(0, s - 0.45) * 0.035 * (0.75 + 0.25 * Math.sin(t * 5)), now, 0.2);
    for (const [o, f] of snd.os) o.frequency.setTargetAtTime(f * (0.94 + s * 0.1), now, 0.3);
  }

  // ---------- trạng thái bay ----------
  const told = new Set(), fact = k => { if (told.has(k)) return; told.add(k); ctx.toast(FACT[k], 6500); };
  const G = { on: false, k: 0, v: V_CRUISE, ix: 0, iz: 0, bank: 0, pitch: 0, stam: 1, manual: false, camAdd: 0, lift: 0, hov: 1, dist: 0, maxH: 0, flights: 0, best: top[0] ? top[0].d : 0, fromPlane: false };
  const bankSt = { v: 0 }, pitchSt = { v: 0 }, kSt = { v: 0 }, camSt = { v: 0 }, open0 = new THREE.Vector3(), wind = new THREE.Vector2();
  const lastP = new THREE.Vector3(); let stallT = 0;
  let airT = 0, fallT = 0, openT = 0, hudT = 0, wasOn = false, padT = 0, windT = 0, diveT = 0, flareT = 0;
  // player.js gọi mỗi khung khi đang lượn: đặt vận tốc ngang + trả hướng mới
  G.steer = (dt, ix, iz, rot, vel, cam) => {
    G.ix = ix; G.iz = iz;
    const vT = iz < 0 ? lerp(V_CRUISE, V_DIVE, -iz) : lerp(V_CRUISE, V_FLARE, iz);
    G.v += (vT - G.v) * ease(G.v < vT ? 0.9 : 1.3, dt);                               // tăng tốc từ từ khi chúc, hãm nhanh hơn khi ngẩng
    rot = wrapAngle(rot - ix * TURN * (1.15 - 0.3 * G.v / V_DIVE) * dt);              // bay chậm thì rẽ gắt hơn
    const w = ctx.weather ? ctx.weather.cur.w : 0, gu = WIND.uGust.value; wind.set(gu.x, gu.y).multiplyScalar(w * 3 * (1 + gu.z * 0.5));   // gió đẩy trôi tối đa ~3 m/s (ảnh hưởng nhẹ)
    // trong cột khí: diều chậm lại, được hút nhẹ vào tâm cột → bốc thẳng lên, xoay chọn hướng rồi lượn ra ở đỉnh cột; đẩy tới (chúc mũi) để rời cột sớm
    const th = TH.t, f = th && G.lift > 0.3 && iz > -0.3 ? 1 - 0.8 * Math.min(1, G.lift / 2) : 1; G.hov += (f - G.hov) * ease(3, dt);
    vel.x = (Math.sin(rot) * G.v + wind.x) * G.hov; vel.z = (Math.cos(rot) * G.v + wind.y) * G.hov;
    if (th && G.hov < 0.95) { vel.x += (th.x - player.pos.x) * (1 - G.hov) * 0.9; vel.z += (th.z - player.pos.z) * (1 - G.hov) * 0.9; }
    if (performance.now() - cam.drag > 1500) cam.yaw += wrapAngle(rot + Math.PI - cam.yaw) * ease(2, dt);   // camera tự về sau lưng khi không kéo
    return rot;
  };
  // tốc độ rơi mới: lực nâng cánh – trọng lực + cột khí; đổi tốc độ dư lấy độ cao khi ngẩng mũi
  G.sink = (dt, vy) => {
    const iz = G.iz, sink = (iz < 0 ? lerp(S_CRUISE, S_DIVE, -iz) : lerp(S_CRUISE, S_FLARE, iz)) * (G.stam <= 0 ? PHI ** 2 : 1);
    const zoom = iz > 0 ? Math.max(0, G.v - lerp(V_CRUISE, V_FLARE, iz)) * 0.6 * iz : 0;
    const want = -sink + zoom + (player.pos.y < W + 144 ? G.lift : 0) - (G.stall ? 2 : 0);   // vướng tường: mất tốc độ → mất lực nâng → tụt nhanh hơn
    return vy + (want - vy) * ease(vy < want ? 3 : 2, dt);
  };
  player.glide = G;

  function open() {
    if (G.on) return; G.on = true; openT = 0; G.hov = 1; G.stall = false; stallT = 0; G.flights++; G.dist = 0; G.maxH = player.pos.y;
    G.v = clamp(Math.hypot(player.vel.x, player.vel.z), V_FLARE, V_DIVE); open0.copy(player.pos); rig.visible = ribbons.visible = trails.visible = true;
    for (const h of hist) for (const p of h) p.set(0, -999, 0);
    if (!snd) initSound(); ctx.sfx && ctx.sfx('jump');
    if (!told.has('ctl')) { told.add('ctl'); ctx.toast(hasTouch ? '🪁 <b>Diều Lượn Rubik</b> đã bung! Joystick: ⬅➡ rẽ · ⬆ chúc xuống tăng tốc · ⬇ ngẩng lên bay chậm · nút <b>🪁 Thu</b> để gập diều' : '🪁 <b>Diều Lượn Rubik</b> đã bung! <b>A/D</b> rẽ · <b>W</b> chúc xuống tăng tốc · <b>S</b> ngẩng lên bay chậm · <b>Space</b> gập/bung diều', 6500); setTimeout(() => G.on && fact('open'), 7000); }
  }
  function close(landed) {
    if (!G.on) return; G.on = false; rideReset(player.hero);
    const d = Math.hypot(player.pos.x - open0.x, player.pos.z - open0.z), h = G.maxH - Math.min(player.pos.y, open0.y);
    if (landed) {
      const inWater = player.pos.y <= W + 0.4 && terrain.heightAt(player.pos.x, player.pos.z) < W;
      if (run) { const c = COURSES[run.ci]; ctx.toast(`⭕ ${c.name}: qua <b>${run.next}/${c.n}</b> vòng. Quay lại bệ 🪁 thử lần nữa nhé!`, 3500); run = null; for (const q of rings) q.side = 0; }
      else if (d >= 21) {
        const rec = d > G.best; if (rec) G.best = d; saveTop(d, G.maxH - W);
        if (!G.fromPlane) ctx.toast(`🪁 ${inWater ? 'Đáp xuống nước' : 'Tiếp đất êm'}! Quãng lượn <b>${Math.round(d)} m</b>, hạ ${Math.round(Math.max(0, h))} m${rec ? ' · 🏅 <b>kỷ lục mới!</b>' : ` · kỷ lục ${Math.round(G.best)} m`}<br>💡 Cứ hạ 1 m, diều lượn xa khoảng <b>${(d / Math.max(1, h)).toFixed(1)} m</b> — gọi là <b>tỉ số lượn</b>.`, 6500);
      }
      G.lastDist = d;
    }
  }

  // ---------- mỗi khung hình ----------
  const _v = new THREE.Vector3(), _f = new THREE.Vector3(), _s = new THREE.Vector3(), _a = new THREE.Vector3(), _e = new THREE.Euler(0, 0, 0, 'ZXY'), _qq = new THREE.Quaternion(), _qx = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
  function pose(dt, t) {
    const hero = player.hero, k = G.k, sp = G.v / V_DIVE, w = ctx.weather ? ctx.weather.cur.w : 0, shake = (0.012 + w * 0.03 + sp * 0.012) * k;
    G.bank = damp(G.bank, G.on ? G.ix * 0.42 : 0, bankSt, T.soft, dt); G.pitch = damp(G.pitch, G.on ? -G.iz * (G.iz < 0 ? 0.32 : 0.26) : 0, pitchSt, T.soft, dt);
    _e.set((G.pitch + Math.sin(t * 7.3) * shake) * k, 0, (G.bank + Math.sin(t * 5.1 + 1) * shake * 1.6) * k); rig.quaternion.setFromEuler(_e);
    rig.scale.set(Math.max(0.02, k), Math.max(0.3, k), Math.max(0.3, 0.3 + 0.7 * k));          // bung/gập: xoè theo sải cánh
    if (hero) {
      const m = hero.model; m.quaternion.copy(rig.quaternion).multiply(_qx.setFromAxisAngle(X, TILT * k));
      _v.copy(PIVOT).applyQuaternion(rig.quaternion); m.position.x += PIVOT.x - _v.x; m.position.y += PIVOT.y - _v.y; m.position.z += PIVOT.z - _v.z;
      if (k > 0.5) ridePose(hero, player.root, RIDE);
    }
    // vải rung theo gió (mép sau rung mạnh nhất)
    const p = K.wg.attributes.position, amp = (0.012 + sp * 0.03 + w * 0.03); for (const [i, y0, wgt, ph] of K.flut) if (wgt) p.setY(i, y0 + Math.sin(t * (9 + sp * 8) + ph) * amp * wgt); p.needsUpdate = true;
    // đuôi lụa + khăn quàng: bay ngược hướng chuyển động, uốn sóng
    player.root.updateMatrixWorld(true);
    _f.set(player.vel.x, player.vy * 0.5, player.vel.z); if (_f.lengthSq() < 1) _f.set(Math.sin(player.rot), 0, Math.cos(player.rot)); _f.normalize();
    _s.set(_f.z, 0, -_f.x).normalize();
    const headBone = hero && hero.head && hero.head.parent ? hero.head : null;   // KayKit lẫn VRM đều có hero.head
    RB.forEach((r, ri) => {
      if (ri < 2) K.g.localToWorld(_a.copy(K.tails[ri])); else if (headBone) { headBone.getWorldPosition(_a); _a.y -= 0.12; _a.addScaledVector(_f, -0.1); } else player.root.localToWorld(_a.set(0, 1.0, 1.1));
      const seg = r.L / r.n * (0.4 + 0.6 * k), A = (0.5 + sp) * k;
      for (let j = 0; j <= r.n; j++) {
        const wob = Math.sin(t * (8 + ri) - j * 0.9 + ri * 2) * 0.035 * j * A, bob = Math.sin(t * (6.5 + ri) - j * 1.1) * 0.03 * j * A - 0.012 * j * j * (1 - sp), wd = r.w * (1 - j / r.n * 0.5) * Math.max(0.05, k), o = (r.o + j * 2) * 3;
        const x = _a.x - _f.x * seg * j + _s.x * wob, y = _a.y - _f.y * seg * j + bob, z = _a.z - _f.z * seg * j + _s.z * wob;
        rbP[o] = x + _s.x * wd; rbP[o + 1] = y; rbP[o + 2] = z + _s.z * wd; rbP[o + 3] = x - _s.x * wd; rbP[o + 4] = y + 0.01; rbP[o + 5] = z - _s.z * wd;
      }
    });
    rbG.attributes.position.needsUpdate = true;
    // vệt gió đầu cánh: lấy mẫu theo quãng đường (0,25 m), đậm khi bay nhanh / nghiêng cánh
    const inten = k * clamp((G.v - 6.5) / 6.5 + Math.abs(G.bank) * 0.9, 0, 1) * 0.55;
    for (let s = 0; s < 2; s++) {
      K.g.localToWorld(_a.copy(K.tips[s])); const H = hist[s];
      if (H[0].y < -900) for (const q of H) q.copy(_a); else if (H[1].distanceToSquared(_a) > 0.0625) { const last = H.pop(); H.unshift(last); } H[0].copy(_a);
      for (let j = 0; j < TN; j++) { const q = H[j], f = 1 - j / (TN - 1), wd = 0.05 * (0.4 + f), o = (s * TN + j) * 6, c = inten * f * f;
        trP[o] = q.x + _s.x * wd; trP[o + 1] = q.y; trP[o + 2] = q.z + _s.z * wd; trP[o + 3] = q.x - _s.x * wd; trP[o + 4] = q.y; trP[o + 5] = q.z - _s.z * wd; trC[o] = trC[o + 1] = trC[o + 2] = trC[o + 3] = trC[o + 4] = trC[o + 5] = c; }
    }
    trG.attributes.position.needsUpdate = trG.attributes.color.needsUpdate = true;
  }

  let clock = 0;
  function update(dt) {
    const t = (clock += dt), pl = player, P = pl.pos, V = pl.vehicle, D = ctx.dive, A = ctx.aircraft;
    if (!laid && ctx.school && ctx.school.ready) layAll();
    syncThermals();
    const swim = D && D.swimming, busy = !!V || swim || (ctx.mg && ctx.mg.active), air = !pl.grounded && !V && !swim;
    if (air) { airT += dt; if (pl.vy < -0.5) fallT += dt; } else { airT = fallT = 0; G.manual = false; }
    const h = air ? P.y - floorAt(P.x, P.z, P.y) : 0;
    if (air || G.on) thermalAt(P); else TH.lift = 0;
    G.lift = TH.lift;
    if (!G.on) {
      const can = air && !busy && airT > 0.25 && h > (TH.lift > 1 ? 0.8 : 1.2);
      if (can && (pl.airJump || (!G.manual && pl.vy < -1 && (fallT > OPEN_T || (!G.fromPlane && (h > OPEN_H || TH.lift > 1)))))) open();
    } else {
      openT += dt;
      const act = Math.hypot(P.x - lastP.x, P.z - lastP.z) / Math.max(dt, 1e-3); stallT = G.hov > 0.9 && act < G.v * 0.4 ? stallT + dt : 0; G.stall = stallT > 0.35; if (G.stall) fact('stall');
      if (pl.grounded || busy) close(pl.grounded || swim);
      else if (pl.airJump && openT > 0.3) { close(false); G.manual = true; }
    }
    pl.airJump = false; lastP.copy(P);
    if (G.fromPlane && !air && !G.on) landPlane();   // chạm đất/nước (kể cả khi đã gập diều) sau cú nhảy khỏi máy bay
    G.k = damp(G.k, G.on ? 1 : 0, kSt, G.on ? T.quick : T.fast, dt); if (!G.on && G.k < 0.02) G.k = 0;
    G.camAdd = damp(G.camAdd, G.on ? CAM_ADD : 0, camSt, T.slow, dt);
    if (G.on) {
      G.maxH = Math.max(G.maxH, P.y); G.dist = Math.hypot(P.x - open0.x, P.z - open0.z);
      G.stam = clamp(G.stam + (TH.lift > 1 ? dt / 8 : -dt / STAM_T), 0, 1);
      if (TH.lift > 1) fact(TH.kind === 'ridge' ? 'ridge' : 'thermal');
      if (G.stam <= 0) fact('tired');
      if (G.iz < -0.6) { if ((diveT += dt) > 1.5) fact('dive'); } else diveT = 0;
      if (G.iz > 0.6) { if ((flareT += dt) > 1.5) fact('flare'); } else flareT = 0;
      if (wind.lengthSq() > 2.5 && (windT += dt) > 3) fact('wind');
      if (laid) checkRings(P, t);
    } else if (pl.grounded) G.stam = Math.min(1, G.stam + dt / 3);
    if (G.k > 0) pose(dt, t); else if (wasOn) { rig.visible = ribbons.visible = trails.visible = false; }
    wasOn = G.k > 0;
    updateMotes(dt, t, P, G.on || (A && A.flying));
    if (laid && (ringMesh.visible || (ringT -= dt) <= 0)) { ringT = 0.5; drawRings(t, P); }
    updateSound(t);
    // HUD (ghi DOM 5 lần/giây) + nhãn nút Nhảy + nút đỏ
    if ((hudT -= dt) <= 0) {
      hudT = 0.2; const show = G.on;
      hud.classList.toggle('on', show);
      if (show) { hudBar.style.transform = `scaleX(${G.stam.toFixed(2)})`; hud.classList.toggle('low', G.stam < 0.21); const s = `⛰ ${Math.round(P.y - floorAt(P.x, P.z, P.y))} m · ${Math.round(Math.hypot(pl.vel.x, pl.vel.z) * 3.6)} km/h · 📏 ${Math.round(G.dist)} m${run ? ` · ⭕ ${run.next}/${COURSES[run.ci].n}` : ''}`; if (hudTxt.textContent !== s) hudTxt.textContent = s; }
      setJump(G.on ? '🪁 Thu' : air && !busy && h > 1.2 && airT > 0.25 ? '🪁 Bung' : '');
      const ap = A && A.plane && A.plane.group.position, ej = !!(A && A.phase === 'fly' && ap && ap.y - Math.max(terrain.heightAt(ap.x, ap.z), W) > 21); if (bEject.hidden === ej) bEject.hidden = !ej;   // chỉ cho nhảy khi máy bay cao hơn 21 m
    }
    // gần bệ lượn: lời chào 1 lần + bảng kỷ lục
    if (laid && pl.grounded && !V && (padT -= dt) <= 0) {
      padT = 0.25;
      for (const c of COURSES) {
        const d = Math.hypot(c.x - P.x, c.z - P.z); if (d > 21 || Math.abs(c.y - P.y) > 8) continue;
        if (!c.hi) { c.hi = true; ctx.toast(`🪁 <b>${c.name}</b>: ${c.cliff ? 'chạy lao khỏi mép vách, diều tự bung' : c.lift ? 'nhảy vào <b>cột khí nóng</b> của lửa trại (bấm Nhảy), diều bung và bốc em lên cao' : 'đứng trên bệ rồi <b>Nhảy</b>: luồng gió vách bốc diều lên cao'} → lượn xuyên <b>${c.n} vòng</b> màu Rubik!`, 6500); }
        if (d < 5) G.nearPad = c;
      }
    }
    if (G.nearPad) { if (pl.grounded && !V && Math.hypot(G.nearPad.x - P.x, G.nearPad.z - P.z) < 5) ctx.offer('📋 Kỷ lục lượn', board, 2); else G.nearPad = null; }
  }

  const self = { update, open, close, eject, board, G, thermals, courses: COURSES, rings, get on() { return G.on; }, get laid() { return laid; }, get run() { return run; },
    spots: () => laid ? COURSES.map(c => ({ n: c.name + ' · ' + c.n + ' vòng', x: c.x, z: c.z, ic: '🪁' })) : [],
    get tris() { return { kite: 48 + Math.round(K.g.children[1].geometry.attributes.position.count / 3) + 21, ribbons: rbI.length / 3, trails: trI.length / 3 }; } };
  ctx.glider = self;
  ctx.chute = { update() {}, press: eject, open, get active() { return G.fromPlane; }, get phase() { return !G.fromPlane ? 'none' : G.on ? 'canopy' : 'free'; }, get targets() { return targets; } };   // tên cũ của parachute.js (regions/ hỏi ctx.chute.active)
  return self;
}
