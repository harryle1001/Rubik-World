// sea/fleet.js — ĐỘI TÀU THUYỀN chạy trên biển theo tuyến (site.js):
//   thuyền thúng · ghe đánh cá Việt Nam có mắt thuyền (dựng bằng code: không có model CC0) · thuyền buồm · ca nô · tàu chở hàng ·
//   tàu du lịch · phà 3 bến (model Kenney Watercraft Kit CC0, InstancedMesh: mỗi loại 1 draw call).
//   Nhấp nhô + nghiêng theo ĐÚNG sóng Gerstner của mặt biển (terrain.waveHeight), sóng đuôi tàu (bọt chữ V bám mặt sóng, 1 draw call),
//   đèn hành trình ban đêm (đỏ mạn trái · xanh mạn phải · trắng cột — 1 draw call), còi tàu (Web Audio), giông bão → thuyền về bến.
//   Tàu khuất sau sương (xa hơn scene.fog.far) thì ẩn; loại nào không còn chiếc nào trong tầm → tắt hẳn draw call.
import * as THREE from 'three';
import { placeKit } from '../kit.js';
import { CFG } from '../config.js';
import { Batch } from '../academy/geo.js';
import { matV } from '../sample/palette.js';
import { PHI, BAY, toW, lane, GROUNDS, BERTHS, CHANNEL, LOOPS, FERRY_PATH, FERRY_STOPS, STOPS, PIER_V, CAGES, SEAWEED, THUNG_V } from './site.js';

const TAU = Math.PI * 2, MOB = CFG.isMobile;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// ---------- Đường đi: Catmull-Rom lấy mẫu đều 2 m ----------
export function makePath(pts, closed = false) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal', 0.5);
  c.arcLengthDivisions = (closed ? pts.length : pts.length - 1) * 21; const Ls = c.getLengths(), sAt = i => Ls[i * 21];   // quãng đường tại điểm gốc thứ i
  const L = c.getLength(), n = Math.max(2, Math.ceil(L / 2)), P = c.getSpacedPoints(n), X = new Float32Array(n + 1), Z = new Float32Array(n + 1);
  P.forEach((p, i) => { X[i] = p.x; Z[i] = p.z; });
  // quãng đường tại từng điểm gốc (để biết bến nằm ở đâu trên đường)
  const at = (s, out) => { s = closed ? ((s % L) + L) % L : Math.min(L, Math.max(0, s)); const f = s / L * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; out[0] = X[i] + (X[i + 1] - X[i]) * k; out[1] = Z[i] + (Z[i + 1] - Z[i]) * k; return out; };
  const sOf = (x, z) => { let b = 0, bd = 1e9; for (let i = 0; i <= n; i++) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < bd) { bd = d; b = i; } } return b / n * L; };
  return { L, at, sOf, sAt, closed };
}

// ---------- Hình dựng bằng code: thuyền thúng & ghe có mắt ----------
function hull(L, B, H, y0, col, { bow = 0.36, lift = 0.5, stern = 0.72, keel = 1 / PHI } = {}) {
  // hộp L×H×B nắn lại: đáy hẹp 1/φ, mũi (z > 0) vuốt nhọn + cong lên, đuôi thu nhỏ
  const g = new THREE.BoxGeometry(B, H, L, 2, 1, 8), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i); const z = p.getZ(i), t = z / L + 0.5;
    if (y < 0) x *= keel;
    if (t > 1 - bow) { const k = (t - (1 - bow)) / bow; x *= 1 - 0.96 * k * k; y += lift * k * k; }
    if (t < 0.2) { const k = 1 - t / 0.2; x *= 1 - (1 - stern) * k; y += lift * 0.3 * k * k; }
    p.setXYZ(i, x, y + y0 + H / 2, z);
  }
  g.computeVertexNormals(); return [g, col];
}
function gheGeo() {
  // ghe gỗ miền Trung dài 8 m (Fibonacci), rộng 8/φ² ≈ 3 m: thân xanh lam, đáy đỏ, viền trắng, MẮT THUYỀN hai bên mũi, ca-bin phía lái, cờ đỏ sao vàng
  const b = new Batch(), L = 8, B = 3;
  b.add(...hull(L, B * 0.92, 0.7, -0.5, '#b33a2e'));                       // đáy đỏ (sơn chống hà)
  b.add(...hull(L, B, 0.75, 0.15, '#1f6fb5'));                             // mạn xanh lam
  b.add(...hull(L * 1.005, B * 1.03, 0.12, 0.88, '#f4efe2'));              // viền mạn trắng
  b.add(...hull(L * 0.93, B * 0.86, 0.08, 0.72, '#b8895a'));               // sàn gỗ
  for (const s of [-1, 1]) {                                               // mắt thuyền: tròng trắng + con ngươi đen, hơi xếch về mũi
    const zx = 2.62, x = s * 0.83, ry = s * (Math.PI / 2 - 0.5);
    b.add(new THREE.CircleGeometry(0.38, 10).scale(1.25, 0.82, 1), '#fbfaf2', x, 0.72, zx, ry, 0, 0);
    b.add(new THREE.CircleGeometry(0.17, 8), '#16181d', x + s * 0.012, 0.72, zx + 0.08, ry, 0, 0);
  }
  b.box(-1.0, 1.0, 0.8, 2.15, -3.3, -1.3, '#f4efe2');                      // ca-bin
  b.box(-1.03, 1.03, 1.35, 1.85, -1.34, -1.26, '#2a4a66');                 // kính trước
  for (const s of [-1, 1]) b.box(s * 1.0 - 0.02, s * 1.0 + 0.02, 1.35, 1.85, -3.0, -1.6, '#2a4a66');
  b.box(-1.2, 1.2, 2.15, 2.27, -3.5, -1.05, '#1f6fb5');                    // mái
  b.cyl(0, 2.27, -2.2, 0.05, 2.1, '#6e4a30', 5);                           // cột cờ
  b.box(0.03, 0.75, 3.85, 4.33, -2.22, -2.18, '#d8232a');                  // cờ đỏ
  b.add(new THREE.CircleGeometry(0.12, 5), '#ffd23f', 0.39, 4.09, -2.17); b.add(new THREE.CircleGeometry(0.12, 5), '#ffd23f', 0.39, 4.09, -2.23, Math.PI);
  b.cyl(0, 0.8, 1.2, 0.07, 3.0, '#6e4a30', 5);                             // cột cẩu lưới giữa thuyền
  b.add(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 4), '#6e4a30', 0, 3.2, 0.4, 0, 1.15, 0);   // cần chéo
  for (const [x, z, c] of [[-0.55, 0.3, '#c9a15a'], [0.5, 0.0, '#c9a15a'], [0, 2.0, '#3d8fd9']]) b.cyl(x, 0.78, z, 0.34, 0.3, c, 8, 0.4);   // sọt cá, thùng
  b.add(new THREE.SphereGeometry(0.42, 6, 4), '#2f6b4a', -0.55, 1.0, -0.75, 0, 0, 0, 1.2, 0.5, 1);   // đống lưới
  for (const z of [-0.6, 0.6, 1.8]) for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(0.2, 0.08, 4, 8), '#22262b', s * 1.52, 0.55, z, Math.PI / 2);   // lốp chống va
  return b.build();
}
function thungGeo() {
  // thuyền thúng đan tre trét dầu rái: nửa cầu đường kính 2 m (≈ 1,3·φ), có mái chèo
  const b = new Batch(), prof = Array.from({ length: 6 }, (_, i) => { const a = i / 5 * Math.PI / 2; return new THREE.Vector2(Math.sin(a) * 1.0, -Math.cos(a) * 0.55); });
  const out = new THREE.LatheGeometry(prof, 12); b.add(out, '#6b4a2c', 0, 0.5, 0);
  const inn = new THREE.LatheGeometry(prof, 12).scale(-0.95, 0.95, 0.95); inn.computeVertexNormals(); b.add(inn, '#a37a48', 0, 0.5, 0);
  b.add(new THREE.TorusGeometry(1.0, 0.055, 4, 12), '#c9a15a', 0, 0.5, 0, 0, Math.PI / 2);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 4), '#c8955a', 0.3, 0.75, 0.45, 0.5, 1.2, 0); b.box(0.86, 1.12, 1.0, 1.04, 0.72, 1.08, '#c8955a');   // mái chèo gác mép
  b.add(new THREE.SphereGeometry(0.3, 6, 4), '#2f6b4a', -0.35, 0.15, -0.2, 0, 0, 0, 1.2, 0.45, 1);    // lưới
  return b.build();
}

// ---------- Loại tàu: model, tỷ lệ, dài (m), mớn nước, tốc độ (m/s), đèn (toạ độ cục bộ theo m), bề rộng bọt đuôi ----------
// flip: model có mũi quay về −z. lights: [x, y, z, 'w'|'r'|'g'|'y']
const WIN = (n, x, y, z0, z1) => Array.from({ length: n }, (_, i) => [x, y, z0 + (z1 - z0) * i / (n - 1), 'y']);
const KIND = {
  liner: { model: 'boat_liner', flip: 1, s: 3, len: 45, dy: -0.3, sp: 6.5, wake: 6, horn: [98, 123], name: 'Tàu du lịch',
    lights: [[0, 24, 6, 'w'], [-6, 8, 5, 'r'], [6, 8, 5, 'g'], [0, 12, -20, 'w'], ...WIN(MOB ? 5 : 8, -6.6, 6.2, -15, 15), ...WIN(MOB ? 5 : 8, 6.6, 6.2, -15, 15), ...WIN(MOB ? 3 : 5, -5.6, 10.5, -10, 10), ...WIN(MOB ? 3 : 5, 5.6, 10.5, -10, 10)] },
  cargo: { model: 'boat_cargo', flip: 1, s: 4.2, len: 44, dy: -0.4, sp: 4.6, wake: 7, horn: [73, 110], name: 'Tàu chở hàng',
    lights: [[0, 15, -16, 'w'], [-7.5, 7, -14, 'r'], [7.5, 7, -14, 'g'], [0, 8, 20, 'w'], [0, 12, -18, 'y']] },
  ferry: { model: 'boat_ferry', flip: 1, s: 2.1, len: 22, dy: -0.2, sp: 8, wake: 4, horn: [147, 185], name: 'Phà',
    lights: [[0, 6.2, -7, 'w'], [-3.8, 3.2, -6, 'r'], [3.8, 3.2, -6, 'g'], [-3.6, 2.6, 6, 'y'], [3.6, 2.6, 6, 'y'], [0, 4.4, -7.5, 'y']] },
  sailA: { model: 'boat_sail_a', flip: 1, s: 2, len: 7.5, dy: -0.12, sp: 3.4, wake: 1.3, name: 'Thuyền buồm', lights: [[0, 9.3, 0, 'w'], [-1.2, 1.2, 1, 'r'], [1.2, 1.2, 1, 'g']] },
  sailB: { model: 'boat_sail_b', flip: 1, s: 2, len: 8, dy: -0.12, sp: 3.0, wake: 1.3, name: 'Thuyền buồm', lights: [[0, 8.8, 0, 'w'], [-1.2, 1.2, 1, 'r'], [1.2, 1.2, 1, 'g']] },
  speed: { model: 'boat_speed_a', flip: 1, s: 2, len: 6.7, dy: -0.1, sp: 13, wake: 2.4, bow: 0.1, name: 'Ca nô', lights: [[0, 2.6, -1, 'w'], [-1.3, 1.4, 1.5, 'r'], [1.3, 1.4, 1.5, 'g']] },
  ghe: { geo: gheGeo, s: 1, len: 8, dy: 0.42, sp: 4.2, wake: 1.8, name: 'Ghe đánh cá',
    lights: [[0, 4.4, -2.2, 'w'], [-1.3, 1.5, -1.3, 'r'], [1.3, 1.5, -1.3, 'g'], [0, 2.6, 0.2, 'y'], [0, 2.9, 1.2, 'y'], [0, 3.3, 2.2, 'y'], [0, 2.5, -2.3, 'y']] },
  buoyR: { model: 'prop_buoy', s: 1.3, len: 1.2, dy: -0.75, sp: 0, wake: 0, name: 'Phao tiêu', lights: [[0, 1.7, 0, 'r']] },
  buoyG: { model: 'prop_buoy_flag', s: 1.3, len: 1.2, dy: -0.75, sp: 0, wake: 0, name: 'Phao cờ', lights: [[0, 1.7, 0, 'g']] },
  thung: { geo: thungGeo, s: 1, len: 2, dy: -0.1, sp: 1.1, wake: 0, name: 'Thuyền thúng', lights: [[0, 1.0, 0, 'y']] },
};
const LCOL = { w: [1, 0.97, 0.88], r: [1, 0.16, 0.12], g: [0.2, 1, 0.42], y: [1, 0.78, 0.36] };

export function createFleet(ctx) {
  const { scene, terrain, camera } = ctx, waveH = terrain.waveHeight;
  const vessels = [], byKind = {};
  const add = (kind, o) => { const K = KIND[kind], v = Object.assign({ kind, K, x: 0, z: 0, y: 0, h: 0, sp: 0, pitch: 0, roll: 0, vis: false, d: 1e9, wakeT: Math.random(), mat: new THREE.Matrix4(), s: 0, ph: vessels.length * 2.399 }, o); v.i = (byKind[kind] = byKind[kind] || []).push(v) - 1; vessels.push(v); return v; };

  // ----- đội hình -----
  const laneIn = makePath(lane(0)), laneOut = makePath(lane(47).reverse());           // tàu du lịch vòng trong, tàu hàng vòng ngoài ngược chiều
  add('liner', { mode: 'lane', path: laneIn, s: laneIn.L * 0.33 });
  add('cargo', { mode: 'lane', path: laneOut, s: laneOut.L * 0.5 });
  if (!MOB) add('cargo', { mode: 'lane', path: laneOut, s: laneOut.L * 0.02 });
  const ferryPath = makePath(FERRY_PATH, true);
  const stopS = FERRY_STOPS.map(({ i }) => ferryPath.sAt(i));
  const ferry = add('ferry', { mode: 'ferry', path: ferryPath, s: stopS[0], k: 0, dwell: 13, state: 'dock', warp: 1, stops: FERRY_STOPS.map((q, j) => ({ s: stopS[j], stop: STOPS[q.stop] })) });
  const loop = (kind, pts, f, sp) => { const path = makePath(pts, true); return add(kind, { mode: 'loop', path, s: path.L * f, spK: sp || 1 }); };
  loop('sailA', LOOPS.sailNE, 0.1); loop('sailB', LOOPS.sailS, 0.4); if (!MOB) loop('sailA', LOOPS.sailE, 0.7, 0.8);
  loop('speed', LOOPS.speedV, 0.2); loop('speed', LOOPS.speedS, 0.6, 0.85);
  const NG = MOB ? 4 : 5;
  for (let i = 0; i < NG; i++) {
    const B = BERTHS[i], sd = Math.sign(B.dv), via = Math.abs(B.dv) < 6 ? [toW(B.u + 8, PIER_V + B.dv * 2.2), toW(31, PIER_V + sd * 15), toW(47, PIER_V + sd * 16.5)] : [toW(B.u + 14, PIER_V + B.dv)];   // men cầu tàu → vòng ngoài đầu chữ T (và phà đang đậu) → cửa luồng
    add('ghe', { mode: 'fish', path: makePath([B.p, ...via, CHANNEL, GROUNDS[i]]), berth: B, out0: 4.6 + i * 0.21, in0: 16.3 + i * 0.3, th: i * 1.7, r: 0 });
  }
  const NT = MOB ? 4 : 5;
  for (let i = 0; i < NT; i++) {   // thuyền thúng: bãi cát ⇄ quanh lồng bè / ven vịnh
    const vb = THUNG_V[i], beach = toW(BAYSHORE(vb) - 1.2, vb), c = i < 2 ? toW(34 + i * 6, CAGES.v + 8 - i * 20) : toW(24 + i * 6, [-34, -30, 2, 14, 24][i]);
    add('thung', { mode: 'thung', path: makePath([beach, toW(BAYSHORE(vb) + 9, vb), c]), out0: 5 + i * 0.3, in0: 17.2 + i * 0.2, a: 3 + i, b: 2 + (i % 3), w: 0.11 + i * 0.013, beachTilt: 0.16 });
  }
  // phao tiêu 2 bên luồng vào cầu tàu (đỏ bên trái, xanh bên phải khi từ biển vào) + phao cờ đánh dấu lồng bè, giàn rong
  for (const [k, u, v] of [['buoyR', 112, PIER_V - 13], ['buoyG', 112, PIER_V + 13], ['buoyR', 144, PIER_V - 13], ['buoyG', 144, PIER_V + 13], ['buoyG', CAGES.u + 13, CAGES.v - 9], ['buoyG', SEAWEED.u + 14, SEAWEED.v + 12]]) { const [x, z] = toW(u, v); add(k, { mode: 'hold', x, z, h: u }); }
  function BAYSHORE(v) { let u = -30; while (u < 60 && terrain.heightAt(...toW(u, v)) > 0) u += 0.5; return u; }

  // ----- lưới: mỗi loại 1 InstancedMesh (model kit: placeKit; ghe/thúng: geometry tự dựng) -----
  const parts = {};   // kind → [{ im, local }]
  const _o = new THREE.Object3D(), _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const kind in byKind) {
    const K = KIND[kind], n = byKind[kind].length; parts[kind] = [];
    const reg = (im, local) => { im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.name = 'sea-' + kind; for (let i = 0; i < n; i++) im.setMatrixAt(i, ZERO); im.instanceMatrix.needsUpdate = true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parts[kind].push({ im, local }); };
    if (K.geo) { const im = new THREE.InstancedMesh(K.geo(), matV().clone(), n); scene.add(im); reg(im, new THREE.Matrix4()); }
    else placeKit(scene, K.model, Array.from({ length: n }, () => [0, 0, 0, K.s, K.flip ? Math.PI : 0]), { shadow: false }).then(ims => {
      _o.position.set(0, 0, 0); _o.rotation.set(0, K.flip ? Math.PI : 0, 0); _o.scale.setScalar(K.s); _o.updateMatrix(); _inv.copy(_o.matrix).invert();
      for (const im of ims) { im.getMatrixAt(0, _m); const local = new THREE.Matrix4().makeScale(K.s, K.s, K.s); if (K.flip) local.multiply(new THREE.Matrix4().makeRotationY(Math.PI)); local.multiply(_inv.clone().multiply(_m)); reg(im, local); }
    });
  }

  // ----- đèn đêm: 1 Points cho cả đội -----
  let NL = 0; for (const v of vessels) { v.l0 = NL; NL += v.K.lights.length; }
  const lg = new THREE.BufferGeometry(), lp = new Float32Array(NL * 3), lc = new Float32Array(NL * 3), ls = new Float32Array(NL);
  for (const v of vessels) v.K.lights.forEach((q, j) => { lc.set(LCOL[q[3]], (v.l0 + j) * 3); ls[v.l0 + j] = (q[3] === 'y' ? 0.9 : 1.25) * Math.min(2.2, 0.8 + v.K.len / 34); });
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3)); lg.setAttribute('sz', new THREE.BufferAttribute(ls, 1));
  const LU = { uOn: { value: 0 }, uPx: { value: 1 } };
  const lights = new THREE.Points(lg, new THREE.ShaderMaterial({ uniforms: LU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute vec3 color; attribute float sz; uniform float uPx; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(sz * uPx * 1.1 / -mv.z, 2.5, 34.); }',
    fragmentShader: 'uniform float uOn; varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = smoothstep(1., .0, d); gl_FragColor = vec4(vC * (a * a * 1.4 + smoothstep(.35, 0., d)) * uOn, 1.); }' }));
  lights.frustumCulled = false; lights.visible = false; lights.name = 'sea-lights'; lights.renderOrder = 4; scene.add(lights);

  // ----- sóng đuôi tàu: bọt trắng dạng tấm bám đúng mặt sóng (dùng lại uniform sóng của ocean-water.js), 1 draw call -----
  const WN = MOB ? 144 : 377, WU = terrain.water.mat.uniforms;
  const wq = new THREE.PlaneGeometry(1, 1, 2, 2).rotateX(-Math.PI / 2), wgeo = new THREE.InstancedBufferGeometry(); wgeo.index = wq.index; wgeo.setAttribute('position', wq.attributes.position); wgeo.setAttribute('uv', wq.attributes.uv);
  const wA = new Float32Array(WN * 4), wB = new Float32Array(WN * 4); for (let i = 0; i < WN; i++) wB[i * 4] = -99;   // A: x, z, vx, vz · B: t0, cỡ đầu, tốc độ nở, tuổi thọ
  const aA = new THREE.InstancedBufferAttribute(wA, 4), aB = new THREE.InstancedBufferAttribute(wB, 4); aA.setUsage(THREE.DynamicDrawUsage); aB.setUsage(THREE.DynamicDrawUsage);
  wgeo.setAttribute('aA', aA); wgeo.setAttribute('aB', aB); wgeo.instanceCount = WN;
  const wake = new THREE.Mesh(wgeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uLight: { value: 1 } }]),
    vertexShader: `uniform highp float uTime; uniform float uWaveN, uAmp; uniform vec4 uWA[5], uWB[5]; uniform sampler2D uH; uniform vec2 uMin, uSize;
      attribute vec4 aA, aB; varying vec2 vUv; varying float vK;
#include <fog_pars_vertex>
      float depthAt(vec2 p){ vec2 uv = (p - uMin) / uSize; if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return 8.; return max(0., 8. - texture2D(uH, uv).r * 255. / 12.); }
      void main(){
        float age = uTime - aB.x, k = clamp(age / aB.w, 0., 1.); vK = age < 0. ? 1. : k; vUv = uv;
        float sz = aB.y + aB.z * age; vec2 c = aA.xy + aA.zw * (1. - exp(-age * 0.6)) / 0.6;
        vec3 w = vec3(c.x + position.x * sz, 0.04, c.y + position.z * sz); vec2 p = w.xz;
        float att = (0.12 + 0.88 * smoothstep(0.3, 13., depthAt(p))) * uAmp;
        for (int i = 0; i < 5; i++) { if (float(i) >= uWaveN) break; vec4 a = uWA[i], b = uWB[i]; float A = a.w * att, f = a.z * dot(a.xy, p) - b.x * uTime + b.z, QA = b.y * A; w += vec3(QA * a.x * cos(f), A * sin(f), QA * a.y * cos(f)); }
        vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
      }`,
    fragmentShader: `uniform float uLight; varying vec2 vUv; varying float vK;
#include <fog_pars_fragment>
      void main(){ vec2 q = vUv - .5; float d = length(q) * 2.; float n = sin(q.x * 31. + vK * 5.) * sin(q.y * 27. - vK * 3.) * .5 + .5;
        float a = smoothstep(1., .35, d) * (1. - vK) * (1. - vK) * (.55 + .45 * n) * smoothstep(0., .06, vK + .02); if (a < .01) discard;
        gl_FragColor = vec4(vec3(.96, .99, 1.) * uLight, a * .8);
#include <fog_fragment>
      }` }));
  for (const k of ['uTime', 'uWaveN', 'uAmp', 'uWA', 'uWB', 'uH', 'uMin', 'uSize']) wake.material.uniforms[k] = WU[k];
  wake.frustumCulled = false; wake.renderOrder = 2; wake.name = 'sea-wake'; scene.add(wake);
  let wi = 0, wDirty = false;
  function puff(x, z, vx, vz, size, grow, life) { const i = wi++ % WN, o = i * 4; wA[o] = x; wA[o + 1] = z; wA[o + 2] = vx; wA[o + 3] = vz; wB[o] = WU.uTime.value; wB[o + 1] = size; wB[o + 2] = grow; wB[o + 3] = life; wDirty = true; }
  // bọt chữ V phía sau 1 thân tàu (dùng chung cho thuyền người chơi lái: pilot.js)
  function emitWake(x, z, h, sp, width, len) {
    const fx = Math.sin(h), fz = Math.cos(h), rx = fz, rz = -fx, bx = x - fx * len * 0.46, bz = z - fz * len * 0.46, lat = sp * 0.34, life = Math.min(8, 2.2 + width * 0.8);
    puff(bx, bz, -fx * sp * 0.08, -fz * sp * 0.08, width * 0.9, width * 0.22, life);                                              // bọt chân vịt
    for (const s of [-1, 1]) puff(bx + rx * s * width * 0.4, bz + rz * s * width * 0.4, rx * s * lat, rz * s * lat, width * 0.55, width * 0.3, life * 0.8);   // 2 vệt chéo
  }

  // ----- còi tàu (tổng hợp) -----
  function horn(v, blasts = 1) {
    const A = ctx.audio; if (!A || !A.on || !v.K.horn) return; const ac = A.listener.context; if (ac.state !== 'running') return;
    const vol = 0.22 * Math.min(1, 55 / Math.max(55, v.d)); if (vol < 0.02) return;
    for (let b = 0; b < blasts; b++) {
      const t = ac.currentTime + 0.05 + b * 1.1, dur = blasts > 1 ? 0.7 : 1.9, g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.12); g.gain.setValueAtTime(vol, t + dur - 0.25); g.gain.linearRampToValueAtTime(0, t + dur);
      for (const hz of v.K.horn) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz; o.connect(f); o.start(t); o.stop(t + dur + 0.05); }
      f.connect(g).connect(A.listener.getInput());
    }
  }

  // ----- chuyển động -----
  const P = [0, 0], P2 = [0, 0], st = { storm: 0, night: 0, hour: 12 };
  const outNow = v => !st.stormy && st.hour >= v.out0 && st.hour < v.in0;
  const along = (v, target, dt, vmax) => {   // đi dọc đường về phía target (m), giảm tốc khi sắp tới
    const d = target - v.s, ad = Math.abs(d); if (ad < 0.02) { v.s = target; return 0; }
    const sp = Math.min(vmax, 0.35 + ad * 0.35), step = Math.min(ad, sp * dt); v.s += Math.sign(d) * step; return sp;
  };
  function move(v, dt, t) {
    const K = v.K, px = v.x, pz = v.z; let face = null; P[0] = px; P[1] = pz;   // mode lạ ('hold'): đứng yên tại chỗ (gỡ lỗi / thuyền neo)
    if (v.mode === 'lane') { v.s += K.sp * dt; if (v.s > v.path.L) { v.s = 0; v.snap = true; } v.path.at(v.s, P); }
    else if (v.mode === 'loop') {
      // giông: chạy tới điểm neo (s = 0) rồi dừng tránh gió
      const L = v.path.L, rem = L - (v.s % L); v.go = st.stormy ? Math.min(1, rem / 21) * (rem < 1.5 ? 0 : 1) : 1; if (st.stormy && v.halt) v.go = 0; if (st.stormy && rem < 1.5) v.halt = true; if (!st.stormy) v.halt = false;
      v.cur = (v.cur ?? 1) + (v.go - (v.cur ?? 1)) * Math.min(1, dt * 0.8); v.s += K.sp * (v.spK || 1) * v.cur * dt; v.path.at(v.s, P);
    } else if (v.mode === 'fish') {
      const want = outNow(v), L = v.path.L; along(v, want ? L : 0, dt, K.sp);
      const atG = v.s >= L - 0.01; v.r += ((atG && want ? 13 : 0) - v.r) * Math.min(1, dt * 0.25);   // tới ngư trường: lượn vòng 13 m kéo lưới
      if (v.r > 0.2) v.th += dt * 1.0 / 13; v.working = v.r > 8;
      v.path.at(v.s, P); P[0] += Math.cos(v.th) * v.r; P[1] += Math.sin(v.th) * v.r;
      if (v.s < 0.5) face = BAY.ry + (v.berth.dv > 0 ? 0.12 : -0.12);
    } else if (v.mode === 'thung') {
      const want = outNow(v), L = v.path.L; along(v, want ? L : 0, dt, K.sp); const k = Math.max(0, (v.s - (L - 8)) / 8);
      v.path.at(v.s, P); P[0] += Math.sin(t * v.w + v.ph) * v.a * k; P[1] += Math.sin(t * v.w * 1.618 + v.ph * 2) * v.b * k; v.beached = v.s < 1.5; v.working = k > 0.9;
      if (v.working) face = v.h + dt * 0.25 * Math.sin(t * 0.3 + v.ph);   // thúng xoay lắc nhè nhẹ khi thả lưới
    } else if (v.mode === 'ferry') {
      // vòng kín: đậu 21 s (Fibonacci) ở mỗi bến rồi chạy tới bến kế; warp > 1 khi người chơi bấm "⏭ Tới bến"
      const L = v.path.L, n = v.stops.length;
      if (v.state === 'dock') { v.dwell -= dt * v.warp; if (v.dwell <= 0 && !v.hold) { v.k = (v.k + 1) % n; v.state = 'sail'; horn(v, 2); v.onLeave && v.onLeave(v); } }
      else {
        let rem = v.stops[v.k].s - v.s; if (rem < -1) rem += L; rem = Math.max(0, rem);
        const tgt = Math.min(K.sp, 0.5 + rem * 0.22), step = Math.min(rem, tgt * dt * v.warp); v.s = (v.s + step) % L; v.cruise = tgt;
        if (rem - step < 0.03) { v.s = v.stops[v.k].s; v.state = 'dock'; v.dwell = 21; v.warp = 1; v.onArrive && v.onArrive(v); }
      }
      v.at = v.stops[v.k].stop; v.path.at(v.s, P);
      if (v.state === 'dock') { v.path.at(v.s + 1.5, P2); face = Math.atan2(P2[0] - P[0], P2[1] - P[1]); }
    }
    v.x = P[0]; v.z = P[1];
    if (!v.path) return;
    if (v.snap || v.first === undefined) { v.first = 0; v.snap = false; v.path.at(v.s + 1, P); v.h = Math.atan2(P[0] - v.x, P[1] - v.z) || 0; v.sp = 0; return; }
    const dx = v.x - px, dz = v.z - pz, inst = Math.hypot(dx, dz) / Math.max(dt, 1e-3); v.sp += (inst - v.sp) * Math.min(1, dt * 4);
    if (face !== null) v.h += wrap(face - v.h) * Math.min(1, dt * 1.2);
    else if (inst > 0.25) v.h += wrap(Math.atan2(dx, dz) - v.h) * Math.min(1, dt * (K.len > 30 ? 0.9 : 2.2));
  }
  const _e = new THREE.Euler(0, 0, 0, 'YXZ'), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s1 = new THREE.Vector3(1, 1, 1), _v = new THREE.Vector3();
  function pose(v, dt, t, full) {
    const K = v.K, fx = Math.sin(v.h), fz = Math.cos(v.h), a = K.len * 0.32, bw = Math.max(0.5, K.len * 0.14);
    if (v.beached) { v.y += (terrain.heightAt(v.x, v.z) + 0.05 - v.y) * Math.min(1, dt * 3); v.pitch += (0 - v.pitch) * 0.1; v.roll += (v.beachTilt - v.roll) * 0.1; }
    else if (full) {
      const yb = waveH(v.x + fx * a, v.z + fz * a), ys = waveH(v.x - fx * a, v.z - fz * a), yl = waveH(v.x + fz * bw, v.z - fx * bw), yr = waveH(v.x - fz * bw, v.z + fx * bw);
      const kI = 1 / (1 + K.len / 34), tp = -Math.atan2(yb - ys, 2 * a) * (0.5 + kI) - (K.bow ? K.bow * Math.min(1, v.sp / K.sp) : 0), tr = Math.atan2(yl - yr, 2 * bw) * kI * 1.3 + Math.sin(t * 0.9 + v.ph) * 0.02;
      const e = Math.min(1, dt * (2 + 6 * kI)); v.pitch += (tp - v.pitch) * e; v.roll += (tr - v.roll) * e; v.y += ((yb + ys + yl + yr) / 4 - v.y) * Math.min(1, dt * 6);
    } else v.y += (waveH(v.x, v.z) - v.y) * Math.min(1, dt * 4);
    _e.set(v.pitch, v.h, v.roll); _q.setFromEuler(_e); v.mat.compose(_p.set(v.x, v.y + K.dy, v.z), _q, _s1);
  }

  let first = true, hornT = 34, uiT = 0;
  function update(dt, t) {
    const W = ctx.weather, S = ctx.sky.state; st.hour = S.hour; st.night = S.night;
    st.stormy = W && (W.type === 'storm' || (W.cur && W.cur.r > 0.55 && W.cur.w > 0.5));
    if (first) {   // lúc vào game: đặt mỗi thuyền đúng chỗ theo giờ (không phải nhìn cả đội chạy ra)
      first = false;
      for (const v of vessels) if (v.mode === 'fish' || v.mode === 'thung') { if (outNow(v)) { v.s = v.path.L; if (v.mode === 'fish') v.r = 13; } }
    }
    const cx = camera.position.x, cz = camera.position.z, far = Math.min(camera.far, scene.fog ? scene.fog.far : 300);
    const anyVis = {};
    for (const v of vessels) {
      move(v, dt, t);
      v.d = Math.hypot(v.x - cx, v.z - cz); v.vis = v.d < far + v.K.len;
      if (!v.vis) continue;
      anyVis[v.kind] = true; pose(v, dt, t, v.d < 144 || v.K.len > 30);
      // bọt đuôi
      if (v.K.wake && v.sp > 0.6 && v.d < 233 && (v.wakeT -= dt) <= 0) { v.wakeT = Math.max(0.16, v.K.wake * 0.45 / v.sp) * (MOB ? 1.6 : 1); emitWake(v.x, v.z, v.h, v.sp, v.K.wake, v.K.len); }
    }
    for (const kind in parts) {
      const on = !!anyVis[kind], list = byKind[kind];
      for (const p of parts[kind]) {
        if (p.im.visible !== on) p.im.visible = on; if (!on) continue;
        for (const v of list) { if (v.vis) { _m.multiplyMatrices(v.mat, p.local); p.im.setMatrixAt(v.i, _m); } else p.im.setMatrixAt(v.i, ZERO); }
        p.im.instanceMatrix.needsUpdate = true;
      }
    }
    if (wDirty) { aA.needsUpdate = true; aB.needsUpdate = true; wDirty = false; }
    wake.material.uniforms.uLight.value = 0.35 + 0.65 * (1 - st.night);
    // đèn: bật dần lúc chạng vạng / trời giông tối
    const on = Math.min(1, Math.max(st.night * 1.6, st.stormy ? 0.7 : 0, S.hour > 17.6 || S.hour < 5.9 ? 0.75 : 0));
    LU.uOn.value += (on - LU.uOn.value) * Math.min(1, dt * 0.8); lights.visible = LU.uOn.value > 0.02;
    if (lights.visible) {
      LU.uPx.value = ctx.renderer.getDrawingBufferSize(_v2).y * 0.5;
      for (const v of vessels) { const L = v.K.lights, lit = v.vis && !(v.mode === 'thung' && !v.working); for (let j = 0; j < L.length; j++) { const o = (v.l0 + j) * 3; if (!lit) { lp[o + 1] = -999; continue; } _v.set(L[j][0], L[j][1], L[j][2]).applyMatrix4(v.mat); lp[o] = _v.x; lp[o + 1] = _v.y; lp[o + 2] = _v.z; } }
      lg.attributes.position.needsUpdate = true;
    }
    // còi: tàu lớn đi ngang gần người chơi
    if ((hornT -= dt) <= 0) { hornT = 34 + Math.random() * 55; let b = null; for (const v of vessels) if (v.mode === 'lane' && v.vis && v.d < 233 && (!b || v.d < b.d)) b = v; if (b) horn(b, 1); }
  }
  const _v2 = new THREE.Vector2();
  // điểm trên boong (toạ độ cục bộ m) → thế giới
  const deckPoint = (v, x, y, z, out = new THREE.Vector3()) => out.set(x, y, z).applyMatrix4(v.mat);
  return { update, vessels, byKind, ferry, KIND, emitWake, puff, horn, deckPoint, parts, lights, wake, get stormy() { return st.stormy; } };
}
