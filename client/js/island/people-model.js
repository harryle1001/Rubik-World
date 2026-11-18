// people-model.js — Dựng nhân vật học sinh / thầy cô / người dân kiểu "Zelda toon" bằng khối low-poly,
// gắn cứng từng khối vào xương của bộ KayKit Adventurers (CC0) để dùng lại 14 animation của KayKit.
// - Chân/tay được kéo dài (dáng cân đối hơn KayKit chibi), sửa lại các track vị trí của animation cho khớp.
// - Mỗi nhân vật = 1 SkinnedMesh (thân + chi tiết nhỏ mắt, miệng, khuy… gộp 1 lưới, vật liệu toon màu theo đỉnh) + 1 viền chỉ theo hình thân.
// - Geometry dùng chung theo kiểu trang phục (cache); ≤ 3.000 tam giác/nhân vật.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { gradientMap } from './style.js';

export const RIG = 'hero-rogue-rig'; // chỉ xương + animation (rút từ hero-rogue.glb bằng tools/strip-rig.mjs: 2 MB → 0,5 MB, qua mạng 0,9 → 0,12 MB)
const DEFORM = ['hips', 'spine', 'chest', 'head', 'upperarml', 'lowerarml', 'wristl', 'handl', 'upperarmr', 'lowerarmr', 'wristr', 'handr', 'upperlegl', 'lowerlegl', 'footl', 'toesl', 'upperlegr', 'lowerlegr', 'footr', 'toesr'];
const BI = Object.fromEntries(DEFORM.map((n, i) => [n, i]));
const LEG = 0.374, ARM_DOWN = 0.6, ARM_CLIPS = /^(Idle|Walking_A|Running_A|Jump_|Sit_Floor|Hit_A|Dodge)/;                               // đùi + cẳng chân (theo trục đứng) của KayKit
// Tỷ lệ cơ thể theo φ (1,618): trẻ em hông ≈ 0,4 chiều cao (≈ 1/φ² + đầu to dễ thương), người lớn hông ≈ 0,47; đầu trẻ ≈ 1/4, người lớn ≈ 1/φ³ ≈ 0,236 chiều cao
export const BUILD = { kid: { KL: 1.9, KA: 1.18, HS: 0.94, SW: 1 }, adult: { KL: 2.1, KA: 1.26, HS: 0.8, SW: 1.08 } };
export const MAT = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
// Vật liệu chi tiết (mắt, miệng…): chớp mắt bằng shader — đỉnh của mắt (thuộc tính blink = tâm mắt theo y) co về tâm theo uBlink.
// Mỗi người 1 vật liệu (cùng 1 chương trình shader, chỉ khác giá trị uBlink): mat.userData.blink.value = 0..1
const DSH = '#include <begin_vertex>\n  if (blink > 0.0) transformed.y = blink + (transformed.y - blink) * uBlink;\n  else if (blink < 0.0) { transformed.y = -blink + (transformed.y + blink) * uBlink; transformed.z -= (1.0 - uBlink) * 0.03; }';
export function detailMat() {
  const m = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }), u = { value: 1 }; m.userData.blink = u;
  m.onBeforeCompile = sh => { sh.uniforms.uBlink = u; sh.vertexShader = 'attribute float blink;\nuniform float uBlink;\n' + sh.vertexShader.replace('#include <begin_vertex>', DSH); };
  m.customProgramCacheKey = () => 'person-detail'; return m;
}

// ---------- Xương + animation ----------
// Kéo dài chân/tay trên bộ xương (tư thế gốc) của 1 bản sao
export function stretchRig(model, B) {
  const g = n => model.getObjectByName(n);
  for (const s of 'lr') { g('lowerleg' + s).position.multiplyScalar(B.KL); g('foot' + s).position.multiplyScalar(B.KL); g('lowerarm' + s).position.multiplyScalar(B.KA); g('wrist' + s).position.multiplyScalar(B.KA); }
  g('hips').position.y += LEG * (B.KL - 1);
  model.updateMatrixWorld(true);
}
// Animation đã sửa theo dáng mới (cache theo dáng). Thêm: Sit_Chair (ngồi ghế), Head_No (lắc đầu)
const clipCache = new Map();
export function rigClips(clips, B, model) {
  const key = B.KL + ':' + B.KA; if (clipCache.has(key)) return clipCache.get(key);
  // hạ tay sát người hơn (KayKit thân to nên tay dang rộng): xoay quanh trục trước-sau của thế giới, quy về trục riêng của xương vai
  const arm = {}; for (const s of 'lr') { const b = model.getObjectByName('upperarm' + s), ax = new THREE.Vector3(0, 0, 1).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()); arm[s] = new THREE.Quaternion().setFromAxisAngle(ax, (s === 'l' ? -1 : 1) * ARM_DOWN); }
  const out = clips.map(c0 => {
    const c = c0.clone(); c.name = c0.name.split('|').pop();
    for (const t of c.tracks) {
      const [n, p] = t.name.split('.');
      if (p === 'quaternion' && /^upperarm[lr]$/.test(n) && ARM_CLIPS.test(c.name)) mapQuat(t, q => q.multiply(arm[n.slice(-1)]));
      if (p !== 'position') continue; const v = t.values;
      const k = /^(lowerleg|foot)[lr]$/.test(n) ? B.KL : /^(lowerarm|wrist)[lr]$/.test(n) ? B.KA : 0;
      if (k) for (let i = 0; i < v.length; i++) v[i] *= k;
      else if (n === 'hips') for (let i = 1; i < v.length; i += 3) v[i] += LEG * (B.KL - 1) * Math.min(1.05, Math.max(0, (v[i] - 0.05) / 0.35));
    }
    return c;
  });
  const by = n => out.find(c => c.name === n);
  const idle = by('Idle');
  if (idle) out.push(chairSit(idle, model));
  if (idle) out.push(headNo(idle));
  clipCache.set(key, out); return out;
}
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _x = new THREE.Vector3(1, 0, 0), _y = new THREE.Vector3(0, 1, 0);
const mapQuat = (t, f) => { const v = t.values; for (let i = 0; i < v.length; i += 4) { _q.fromArray(v, i); f(_q, i / 4); _q.toArray(v, i); } };
// Ngồi ghế: lấy dáng ngồi bệt, gập gối 90° cho cẳng chân thả xuống, nâng hông lên mặt ghế (hông ở độ cao gối)
// Ngồi ghế (dựng từ dáng đứng): đùi nằm ngang ra trước, cẳng chân thả thẳng xuống (xoay quanh trục ngang của thế giới,
// quy về trục riêng của từng xương ở tư thế gốc). Mặt ghế = gốc toạ độ model (y = 0): đặt model ở độ cao mặt ghế là ngồi vừa.
const SEAT = 0.1;
function chairSit(src, model) {
  const c = src.clone(), W = new THREE.Quaternion(); c.name = 'Sit_Chair';
  const pose = (n, ang) => { const b = model.getObjectByName(n); b.getWorldQuaternion(W); const ax = _x.clone().applyQuaternion(W.invert()); return b.quaternion.clone().multiply(_q2.setFromAxisAngle(ax, ang)); };
  const fix = {}; for (const s of 'lr') { fix['upperleg' + s] = pose('upperleg' + s, -Math.PI / 2); fix['lowerleg' + s] = pose('lowerleg' + s, Math.PI / 2); fix['foot' + s] = model.getObjectByName('foot' + s).quaternion.clone(); }
  for (const t of c.tracks) {
    const [n, p] = t.name.split('.');
    if (p === 'quaternion' && fix[n]) mapQuat(t, q => q.copy(fix[n]));
    if (p === 'position' && n === 'hips') for (let i = 1; i < t.values.length; i += 3) t.values[i] = SEAT - 0.114 + (t.values[i] - t.values[1]) * 0.3;
  }
  return c;
}
// Lắc đầu "không": dáng đứng yên + đầu quay trái phải
function headNo(src) {
  const c = src.clone(); c.name = 'Head_No';
  const t = c.tracks.find(t => t.name === 'head.quaternion');
  if (t) mapQuat(t, (q, i) => { const a = t.times[i] / c.duration; q.multiply(_q2.setFromAxisAngle(_y, Math.sin(a * Math.PI * 4) * 0.45 * Math.sin(a * Math.PI))); });
  return c;
}

// ---------- Khối hình cơ bản ----------
const col = new THREE.Color();
function prep(geo, color, bone, eyeY = 0) {
  geo.deleteAttribute('uv'); if (geo.attributes.uv1) geo.deleteAttribute('uv1');
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const n = geo.attributes.position.count, c = new Uint8Array(n * 3), si = new Uint16Array(n * 4), sw = new Uint8Array(n * 4);
  col.set(color); const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
  for (let i = 0; i < n; i++) { c[i * 3] = r; c[i * 3 + 1] = g; c[i * 3 + 2] = b; si[i * 4] = bone; sw[i * 4] = 255; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3, true));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4, true));
  geo.setAttribute('blink', new THREE.BufferAttribute(new Float32Array(n).fill(eyeY), 1));
  if (!geo.index) geo.setIndex([...Array(n).keys()]);
  return geo;
}
const ell = (rx, ry, rz, w = 8, h = 6) => new THREE.SphereGeometry(1, w, h).scale(rx, ry, rz);
// hộp bo góc (mềm, viền liền mạch)
function rbox(w, h, d, r = 0.3, seg = 2) {
  let g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const p = g.attributes.position, v = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); q.set(Math.sign(v.x) * Math.min(Math.abs(v.x), 0.5 - r), Math.sign(v.y) * Math.min(Math.abs(v.y), 0.5 - r), Math.sign(v.z) * Math.min(Math.abs(v.z), 0.5 - r));
    v.sub(q); if (v.lengthSq() > 1e-9) v.setLength(r); q.add(v); p.setXYZ(i, q.x, q.y, q.z);
  }
  g.computeVertexNormals(); return g.scale(w, h, d);
}
const capsule = (r, len, cs = 1, rad = 6) => new THREE.CapsuleGeometry(r, Math.max(0.001, len), cs, rad);
const box = (w, h, d) => rbox(w, h, d, 0.25, 1); // khối nhỏ (chi tiết): 12 tam giác
const M = new THREE.Matrix4(), E = new THREE.Euler(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
const at = (x, y, z, rx = 0, ry = 0, rz = 0) => M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(1, 1, 1));
// đặt khối dọc theo đoạn a→b (trục Y của khối)
const along = (a, b, t = 0.5) => M.compose(V.copy(a).lerp(b, t), Q.setFromUnitVectors(_y, b.clone().sub(a).normalize()), S.set(1, 1, 1));

// ---------- Dựng 1 nhân vật ----------
// look: { gender:'m'|'f', adult, skin, hair, hairStyle, shirt, pants, skirt, dress, tee, stripe, shorts, aodai, longSleeve, belt, shoes, sole, bag, scarf, acc, accColor, glasses, sun, cap, brim, hat, hatStyle, tie, prop, propColor }
export function buildPerson(J, look) {
  const L = look, B = L.adult ? BUILD.adult : BUILD.kid, HS = B.HS;
  const body = [], det = [];
  const add = (geo, bone, color, m, detail, eyeY) => { geo.applyMatrix4(m); (detail ? det : body).push(prep(geo, color, BI[bone], eyeY)); };
  const skin = L.skin || '#f3c9a2', hair = L.hair || '#231915', shirt = L.shirt || '#f7f7f2', pants = L.pants || '#1f2a5a';
  const skinD = new THREE.Color(skin).offsetHSL(0, 0.05, -0.08).getStyle();
  // --- đầu ---
  const hj = J.head, Hc = new THREE.Vector3(hj.x, hj.y + 0.265 * HS, hj.z + 0.02), hr = new THREE.Vector3(0.255, 0.27, 0.245).multiplyScalar(HS);
  const zs = (x, y) => Hc.z + hr.z * Math.sqrt(Math.max(0, 1 - ((x - Hc.x) / hr.x) ** 2 - ((y - Hc.y) / hr.y) ** 2)); // mặt trước của đầu
  add(ell(hr.x, hr.y, hr.z, 12, 9), 'head', skin, at(Hc.x, Hc.y, Hc.z));
  for (const k of [-1, 1]) add(ell(0.04 * HS, 0.06 * HS, 0.035 * HS, 6, 4), 'head', skin, at(Hc.x + k * hr.x * 0.96, Hc.y - 0.035 * HS, Hc.z - 0.01));
  // mắt to dễ thương (mắt nâu đen + 2 đốm sáng), lông mày, mũi, miệng cười, má hồng
  const ey = Hc.y - 0.035 * HS;
  for (const k of [-1, 1]) {
    const ex = Hc.x + k * 0.1 * HS, ez = zs(ex, ey), ry = Math.asin(k * 0.1 * HS / hr.x) * 0.9;
    if (L.sun) add(ell(0.075 * HS, 0.05 * HS, 0.02, 8, 4), 'head', '#1a1a22', at(ex, ey + 0.005, ez + 0.012, 0, ry, 0), true);
    else {
      add(ell(0.043 * HS, 0.062 * HS, 0.02, 8, 5), 'head', '#2a1a1e', at(ex, ey, ez - 0.006, 0, ry, 0), true, ey);
      add(ell(0.017 * HS, 0.02 * HS, 0.01, 5, 3), 'head', '#ffffff', at(ex + k * 0.012 * HS, ey + 0.024 * HS, ez + 0.01, 0, ry, 0), true, -ey);
      add(ell(0.008 * HS, 0.009 * HS, 0.006, 4, 2), 'head', '#ffffff', at(ex - k * 0.014 * HS, ey - 0.026 * HS, ez + 0.009, 0, ry, 0), true, -ey);
      add(ell(0.036 * HS, 0.018 * HS, 0.006, 6, 3), 'head', '#f39a9a', at(Hc.x + k * 0.17 * HS, ey - 0.07 * HS, zs(Hc.x + k * 0.17 * HS, ey - 0.07 * HS) - 0.005, 0, ry * 1.6, 0), true);
    }
    add(box(0.07 * HS, 0.016 * HS, 0.018), 'head', hair, at(ex, ey + 0.095 * HS, zs(ex, ey + 0.095 * HS) - 0.002, 0, ry, -k * 0.12), true);
  }
  add(ell(0.02 * HS, 0.016 * HS, 0.014, 5, 3), 'head', skinD, at(Hc.x, Hc.y - 0.085 * HS, zs(Hc.x, Hc.y - 0.085 * HS)), true);
  add(new THREE.TorusGeometry(0.03 * HS, 0.008, 3, 8, Math.PI).scale(1, 0.8, 0.5), 'head', '#8c3b3b', at(Hc.x, Hc.y - 0.125 * HS, zs(Hc.x, Hc.y - 0.13 * HS) - 0.002, 0, 0, Math.PI), true);
  if (L.glasses && !L.sun) for (const k of [-1, 1]) {
    const ex = Hc.x + k * 0.1 * HS, ez = zs(ex, ey) + 0.012;
    add(new THREE.TorusGeometry(0.05 * HS, 0.009, 3, 10), 'head', '#2b2433', at(ex, ey, ez, 0, Math.asin(k * 0.1 * HS / hr.x) * 0.9, 0), true);
    if (k > 0) add(box(0.06 * HS, 0.01, 0.01), 'head', '#2b2433', at(Hc.x, ey + 0.01, zs(Hc.x, ey) + 0.008), true);
  }
  // --- tóc (mảng khối) ---
  hairOf(L, add, Hc, hr, HS, hair, zs);
  // --- mũ ---
  if (L.cap) {
    const g = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.42).scale(hr.x * 1.12, hr.y * 1.05, hr.z * 1.12);
    add(g, 'head', L.cap, at(Hc.x, Hc.y + 0.05 * HS, Hc.z - 0.01, -0.12));
    add(rbox(0.34 * HS, 0.03, 0.2 * HS, 0.4), 'head', L.brim || L.cap, at(Hc.x, Hc.y + 0.12 * HS, Hc.z + hr.z * 0.95, 0.15));
    add(ell(0.035 * HS, 0.04 * HS, 0.01, 6, 3), 'head', '#ffd23f', at(Hc.x, Hc.y + 0.2 * HS, zs(Hc.x, Hc.y + 0.18 * HS) + 0.05), true);
  } else if (L.hat) {
    if (L.hatStyle === 'nonla') add(new THREE.ConeGeometry(0.46 * HS, 0.26 * HS, 14, 1), 'head', L.hat, at(Hc.x, Hc.y + hr.y + 0.06 * HS, Hc.z - 0.02));
    else { add(new THREE.CylinderGeometry(hr.x * 0.82, hr.x * 0.95, 0.14 * HS, 12), 'head', L.hat, at(Hc.x, Hc.y + hr.y * 0.92, Hc.z - 0.02)); add(new THREE.CylinderGeometry(0.42 * HS, 0.44 * HS, 0.025, 14), 'head', L.hat, at(Hc.x, Hc.y + hr.y * 0.72, Hc.z - 0.02)); add(new THREE.CylinderGeometry(hr.x * 0.96, hr.x * 0.96, 0.04 * HS, 12, 1, true), 'head', '#c0392b', at(Hc.x, Hc.y + hr.y * 0.8, Hc.z - 0.02), true); }
  }
  // --- cổ + thân ---
  const ua = J.upperarml, sy = ua.y, sp = J.spine, ch = J.chest, ulg = J.upperlegl;
  add(new THREE.CylinderGeometry(0.06, 0.068, 0.16, 8), 'chest', skin, at(hj.x, hj.y - 0.02, hj.z));
  const top = L.aodai ? L.shirt : shirt;
  const SW = L.gender === 'f' ? 1 : B.SW; // vai nam giới người lớn rộng hơn
  add(rbox(0.44 * SW, 0.34, 0.27, 0.11), 'chest', top, at(ch.x, sy - 0.1, ch.z));
  add(rbox(0.4, 0.28, 0.25, 0.1), 'spine', top, at(sp.x, sp.y + 0.09, sp.z));
  if (L.dress) add(pleats(0.23, 0.37, 0.5, 16), 'hips', shirt, at(J.hips.x, ulg.y - 0.15, J.hips.z)); // váy liền: chân váy dài tới gối, cùng màu áo
  else if (L.skirt) add(pleats(0.24, 0.34, 0.32, 16), 'hips', pants, at(J.hips.x, ulg.y - 0.07, J.hips.z));
  else add(rbox(0.46, 0.22, 0.27, 0.1), 'hips', L.aodai ? '#f4f1ea' : pants, at(J.hips.x, ulg.y + 0.02, J.hips.z));
  if (L.belt) { add(rbox(0.47, 0.05, 0.28, 0.4), 'hips', L.belt, at(J.hips.x, ulg.y + 0.105, J.hips.z)); add(box(0.07, 0.045, 0.02), 'hips', '#e0b84a', at(J.hips.x, ulg.y + 0.105, J.hips.z + 0.142), true); }
  if (L.aodai) { // áo dài: 2 vạt trước/sau dài quá gối, cổ cao
    for (const z of [0.13, -0.13]) add(new THREE.CylinderGeometry(0.19, 0.23, 0.62, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.12), 'hips', L.shirt, at(J.hips.x, ulg.y - 0.24, J.hips.z + z, z > 0 ? -0.06 : 0.06));
    add(new THREE.CylinderGeometry(0.075, 0.08, 0.07, 10), 'chest', L.shirt, at(hj.x, hj.y - 0.015, hj.z));
  } else if (L.tee || L.dress) { // áo thun / váy liền: cổ tròn + 1 sọc ngang
    add(new THREE.TorusGeometry(0.085, 0.018, 3, 10).rotateX(Math.PI / 2), 'chest', new THREE.Color(shirt).offsetHSL(0, 0, -0.12).getStyle(), at(hj.x, sy + 0.05, hj.z + 0.015));
    if (L.stripe) add(rbox(0.452 * SW, 0.06, 0.282, 0.03), 'chest', L.stripe, at(ch.x, sy - 0.15, ch.z), true);
  } else {
    // cổ áo sơ mi + khuy + túi ngực
    for (const k of [-1, 1]) add(new THREE.ConeGeometry(0.06, 0.1, 3).rotateX(Math.PI).scale(1, 1, 0.3), 'chest', shirt, at(ch.x + k * 0.065, sy + 0.025, ch.z + 0.112, 0.35, 0, k * 0.55));
    for (let i = 0; i < 3; i++) add(ell(0.012, 0.012, 0.006, 5, 3), 'chest', '#c9ced8', at(ch.x, sy - 0.13 - i * 0.075, ch.z + 0.136), true);
    add(box(0.09, 0.085, 0.01), 'chest', new THREE.Color(shirt).offsetHSL(0, 0, -0.05).getStyle(), at(ch.x + 0.085, sy - 0.14, ch.z + 0.136), true);
  }
  if (L.scarf) { // học sinh: bảng tên trên ngực phải + phù hiệu trường (xanh, viền vàng) trên tay áo trái
    add(box(0.1, 0.035, 0.008), 'chest', '#ffffff', at(ch.x - 0.085, sy - 0.13, ch.z + 0.139), true);
    add(box(0.07, 0.008, 0.009), 'chest', '#2b6cb0', at(ch.x - 0.085, sy - 0.13, ch.z + 0.141), true);
    const a = J.upperarml, e = J.lowerarml, m = a.clone().lerp(e, 0.3);
    add(ell(0.04, 0.04, 0.012, 6, 3).rotateX(Math.PI / 2), 'upperarml', '#ffd23f', at(m.x, m.y, m.z + 0.08), true);
    add(ell(0.03, 0.03, 0.012, 6, 3).rotateX(Math.PI / 2), 'upperarml', '#2b6cb0', at(m.x, m.y + 0.003, m.z + 0.084), true);
  }
  if (L.tie) add(new THREE.ConeGeometry(0.035, 0.24, 4).rotateX(Math.PI).scale(1, 1, 0.3), 'chest', L.tie, at(ch.x, sy - 0.1, ch.z + 0.142), true);
  // khăn quàng đỏ: vòng cổ + nút + 2 vạt
  if (L.scarf) {
    add(new THREE.TorusGeometry(0.115, 0.03, 4, 10).rotateX(Math.PI / 2), 'chest', L.scarf, at(hj.x, sy + 0.04, hj.z + 0.01));
    add(ell(0.045, 0.04, 0.032, 6, 4), 'chest', '#b81c22', at(ch.x, sy, ch.z + 0.142));
    for (const k of [-1, 1]) add(new THREE.ConeGeometry(0.045, k < 0 ? 0.2 : 0.16, 3).rotateX(Math.PI).scale(1, 1, 0.3), 'chest', L.scarf, at(ch.x + k * 0.03, sy - (k < 0 ? 0.11 : 0.09), ch.z + 0.15, 0.08, 0, k * 0.22), true);
  }
  // --- tay ---
  for (const s of 'lr') {
    const a = J['upperarm' + s], e = J['lowerarm' + s], w = J['wrist' + s], h = J['hand' + s], d = e.clone().sub(a).normalize(), k = s === 'l' ? 1 : -1;
    const long = L.longSleeve || L.aodai;
    add(capsule(0.083, a.distanceTo(e) * (long ? 1 : 0.55), 2), 'upperarm' + s, top, along(a.clone().addScaledVector(d, -0.02), long ? e : a.clone().lerp(e, 0.6)));
    if (!long) add(capsule(0.058, a.distanceTo(e) * 0.8), 'upperarm' + s, skin, along(a, e));
    add(capsule(long ? 0.068 : 0.056, e.distanceTo(w) * 0.85), 'lowerarm' + s, long ? top : skin, along(e, w));
    const hd = h.clone().sub(w).normalize(), hc = h.clone().addScaledVector(hd, 0.01);
    add(ell(0.075, 0.048, 0.062, 7, 5), 'hand' + s, skin, M.compose(hc, Q.setFromUnitVectors(_x, hd.clone().multiplyScalar(k)), S.set(1, 1, 1)));
    add(ell(0.032, 0.026, 0.036, 5, 4), 'hand' + s, skin, at(w.x + k * 0.05, w.y + 0.005, w.z + 0.058));
  }
  // --- chân ---
  for (const s of 'lr') {
    const a = J['upperleg' + s], kn = J['lowerleg' + s], an = J['foot' + s], bare = L.skirt || L.dress, shin = bare || L.shorts;
    const lc = bare ? skin : (L.aodai ? '#f4f1ea' : pants), r1 = bare ? 0.07 : 0.1, r2 = shin ? 0.062 : 0.088;
    add(capsule(r1, a.distanceTo(kn) * 0.9), 'upperleg' + s, lc, along(a, kn));
    add(capsule(r2, kn.distanceTo(an) * 0.88), 'lowerleg' + s, shin ? skin : lc, along(kn, an)); // quần đùi: cẳng chân trần
    add(new THREE.CylinderGeometry(0.072, 0.07, bare ? 0.16 : 0.06, 8), 'lowerleg' + s, '#f4f4f0', at(an.x, an.y + (bare ? 0.09 : 0.045), an.z));
    const shoe = L.shoes || '#2a2630';
    add(rbox(0.16, 0.12, 0.3, 0.06), 'foot' + s, shoe, at(an.x, 0.07, an.z + 0.06));
    add(box(0.168, 0.035, 0.31), 'foot' + s, L.sole || '#e9e4da', at(an.x, 0.018, an.z + 0.06));
  }
  // --- ba lô ---
  if (L.bag) {
    const bc = new THREE.Color(L.bag), bz = ch.z - 0.215, by = ch.y + 0.0;
    add(rbox(0.36, 0.42, 0.16, 0.08), 'chest', L.bag, at(ch.x, by, bz));
    add(rbox(0.37, 0.14, 0.18, 0.08), 'chest', bc.clone().offsetHSL(0, 0, -0.12).getStyle(), at(ch.x, by + 0.16, bz + 0.005));
    add(rbox(0.26, 0.15, 0.06, 0.2, 1), 'chest', bc.clone().offsetHSL(0, 0, 0.08).getStyle(), at(ch.x, by - 0.09, bz - 0.09));
    add(box(0.08, 0.04, 0.02), 'chest', '#ffd23f', at(ch.x, by + 0.1, bz - 0.09), true);
    for (const k of [-1, 1]) {
      add(box(0.045, 0.3, 0.02), 'chest', '#2b2b38', at(ch.x + k * 0.155, sy - 0.17, ch.z + 0.136), true);
      add(box(0.05, 0.03, 0.3), 'chest', '#2b2b38', at(ch.x + k * 0.155, sy + 0.065, ch.z - 0.01), true);
    }
  }
  // --- vật cầm tay (tay phải: x âm) ---
  const hr_ = J.handr, wr = J.wristr;
  if (L.prop === 'book') { add(rbox(0.06, 0.26, 0.2, 0.15), 'handr', L.propColor || '#c0392b', at(hr_.x - 0.02, hr_.y - 0.06, hr_.z + 0.04, 0, 0, Math.PI / 2)); add(box(0.063, 0.24, 0.18), 'handr', '#fff7e0', at(hr_.x - 0.02, hr_.y - 0.06, hr_.z + 0.05, 0, 0, Math.PI / 2), true); }
  else if (L.prop === 'clip') { add(rbox(0.03, 0.28, 0.21, 0.15), 'handr', '#8a5a34', at(hr_.x - 0.02, hr_.y - 0.05, hr_.z + 0.04, 0, 0, Math.PI / 2)); add(box(0.033, 0.22, 0.17), 'handr', '#ffffff', at(hr_.x - 0.02, hr_.y - 0.05, hr_.z + 0.045, 0, 0, Math.PI / 2), true); }
  else if (L.prop === 'cam') { add(rbox(0.18, 0.13, 0.26, 0.15), 'handr', '#2a2a33', at(hr_.x, hr_.y - 0.09, hr_.z + 0.06)); add(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8).rotateX(Math.PI / 2), 'handr', '#7fd1ff', at(hr_.x, hr_.y - 0.09, hr_.z + 0.2), true); }
  else if (L.prop === 'rod') { const d = new THREE.Vector3(0.7, 0, 0.71); add(new THREE.CylinderGeometry(0.012, 0.022, 1.7, 4), 'handr', '#6b4a2b', along(hr_.clone().addScaledVector(d, -0.15), hr_.clone().addScaledVector(d, 1.55))); } // tay buông: cần chĩa ra trước, chếch lên
  const geoB = mergeGeometries(body), geoD = det.length ? mergeGeometries(det) : null;
  geoB.computeBoundingBox(); geoB.computeBoundingSphere();
  // hình vẽ = thân + chi tiết gộp 1 lưới (1 draw call/người thay vì 2); viền chỉ dùng hình thân (mắt, miệng không viền)
  const geoA = geoD ? mergeGeometries([geoB, geoD]) : geoB; geoA.computeBoundingSphere();
  return { body: geoB, all: geoA, tris: geoA.index.count / 3, top: geoB.boundingBox.max.y };
}

// váy xếp ly: hình nón cụt, bán kính đỉnh so le tạo nếp
function pleats(rt, rb, h, n) {
  const g = new THREE.CylinderGeometry(rt, rb, h, n, 1, false), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x), r = Math.hypot(v.x, v.z); if (r < 1e-4) continue; const seg = Math.round((a / (Math.PI * 2)) * n); if (seg % 2 && v.y < 0) { p.setX(i, v.x * 0.9); p.setZ(i, v.z * 0.9); } }
  g.deleteAttribute('normal'); return g;
}

// Kiểu tóc: chỏm tóc ôm đầu (lệch ra sau) + mảng mái + đuôi/búi tuỳ kiểu
function hairOf(L, add, Hc, hr, HS, hair, zs) {
  const st = L.hairStyle || (L.gender === 'f' ? 'pony' : 'short');
  const cap = (theta, tilt, sx = 1.08) => add(new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI * theta).scale(hr.x * sx, hr.y * 1.06, hr.z * 1.1), 'head', hair, at(Hc.x, Hc.y + 0.03 * HS, Hc.z - 0.035 * HS, tilt));
  const bang = (x, len, rz, w = 0.065) => { const y = Hc.y + 0.15 * HS; add(new THREE.ConeGeometry(w * HS, len * HS, 4).rotateX(Math.PI).scale(1, 1, 0.45), 'head', hair, at(x, y - len * HS * 0.35, zs(x, y - len * HS * 0.3) + 0.005, -0.35, 0, rz)); };
  add(ell(hr.x * 0.94, 0.15 * HS, 0.17 * HS, 8, 5), 'head', hair, at(Hc.x, Hc.y - 0.1 * HS, Hc.z - 0.1 * HS)); // tóc sau gáy
  if (L.cap) { cap(0.55, -0.5); return; } // đội mũ: chỉ cần tóc sau gáy
  if (st === 'bob' || st === 'long' || st === 'bun' || st === 'pony' || st === 'twin') {
    cap(0.5, -0.32);
    // tóc hai bên + sau gáy, chừa khoảng trống phía trước mặt
    const gap = 0.75, len = st === 'long' ? 0.95 : st === 'bob' ? 0.72 : 0.62;
    add(new THREE.SphereGeometry(1, 10, 6, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, Math.PI * 0.3, Math.PI * len - Math.PI * 0.3).scale(hr.x * 1.1, hr.y * 1.12, hr.z * 1.12), 'head', hair, at(Hc.x, Hc.y + 0.01 * HS, Hc.z - 0.02 * HS));
    if (st === 'long') add(ell(0.23 * HS, 0.3 * HS, 0.1 * HS, 8, 6), 'head', hair, at(Hc.x, Hc.y - 0.22 * HS, Hc.z - 0.19 * HS, 0.12));
    for (const [x, l, r] of [[-0.13, 0.15, 0.25], [-0.045, 0.17, 0.08], [0.045, 0.16, -0.05], [0.13, 0.14, -0.22]]) bang(Hc.x + x * HS, l, r, 0.07);
  } else {
    cap(st === 'buzz' ? 0.48 : 0.52, -0.38);
    if (st === 'spiky') for (const [x, y, z, rx, rz] of [[0, 0.27, 0.02, -0.4, 0], [-0.12, 0.24, 0.0, -0.3, 0.45], [0.12, 0.24, 0.0, -0.3, -0.45], [-0.07, 0.25, -0.13, -1.1, 0.25], [0.07, 0.25, -0.13, -1.1, -0.25], [0, 0.2, -0.22, -1.6, 0]]) add(new THREE.ConeGeometry(0.07 * HS, 0.16 * HS, 4), 'head', hair, at(Hc.x + x * HS, Hc.y + y * HS, Hc.z + z * HS, rx, 0, rz));
    if (st === 'short' || st === 'spiky') for (const [x, l, r] of [[-0.12, 0.13, 0.5], [-0.035, 0.16, 0.35], [0.05, 0.14, 0.25], [0.13, 0.1, 0.1]]) bang(Hc.x + x * HS, l, r);
    else if (st === 'side') { bang(Hc.x - 0.1 * HS, 0.12, 0.9, 0.09); bang(Hc.x, 0.12, 0.8, 0.09); bang(Hc.x + 0.1 * HS, 0.09, 0.6, 0.08); }
    else if (st === 'buzz') bang(Hc.x, 0.07, 0, 0.12);
  }
  const tie = L.accColor || '#ff5a8a';
  if (st === 'pony') { add(ell(0.075 * HS, 0.2 * HS, 0.075 * HS, 8, 6), 'head', hair, at(Hc.x, Hc.y - 0.02 * HS, Hc.z - hr.z - 0.09 * HS, 0.35)); add(new THREE.TorusGeometry(0.045 * HS, 0.02 * HS, 4, 8).rotateX(Math.PI / 2), 'head', tie, at(Hc.x, Hc.y + 0.12 * HS, Hc.z - hr.z - 0.04 * HS, 0.6)); }
  if (st === 'twin') for (const k of [-1, 1]) { add(ell(0.065 * HS, 0.17 * HS, 0.065 * HS, 8, 6), 'head', hair, at(Hc.x + k * (hr.x + 0.05 * HS), Hc.y - 0.12 * HS, Hc.z - 0.06 * HS, 0, 0, k * 0.15)); add(ell(0.04 * HS, 0.035 * HS, 0.04 * HS, 6, 4), 'head', tie, at(Hc.x + k * (hr.x + 0.035 * HS), Hc.y + 0.02 * HS, Hc.z - 0.06 * HS)); }
  if (st === 'bun') add(ell(0.11 * HS, 0.1 * HS, 0.1 * HS, 8, 6), 'head', hair, at(Hc.x, Hc.y + 0.08 * HS, Hc.z - hr.z - 0.04 * HS));
  if (L.acc === 'bow') { const c = L.accColor || '#ff5a8a'; for (const k of [-1, 1]) add(new THREE.ConeGeometry(0.05 * HS, 0.1 * HS, 4).rotateZ(k * Math.PI / 2), 'head', c, at(Hc.x + 0.14 * HS + k * 0.05 * HS, Hc.y + 0.2 * HS, Hc.z + 0.02, 0, 0, 0)); add(ell(0.025 * HS, 0.025 * HS, 0.025 * HS, 5, 3), 'head', c, at(Hc.x + 0.14 * HS, Hc.y + 0.2 * HS, Hc.z + 0.02)); }
  else if (L.acc === 'clip') add(box(0.09 * HS, 0.025 * HS, 0.03), 'head', L.accColor || '#ffd23f', at(Hc.x - 0.12 * HS, Hc.y + 0.17 * HS, zs(Hc.x - 0.12 * HS, Hc.y + 0.17 * HS) + 0.035, -0.4, 0, 0.3), true);
}

// Khớp xương (toạ độ model, tư thế gốc) của 1 bản sao đã kéo dài
export function jointsOf(model) {
  const J = {}; for (const n of DEFORM) { const b = model.getObjectByName(n); J[n] = b ? b.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(); } return J;
}
// Gắn geometry vào bộ xương của bản sao
// Trả về { body, outlineGeo }: body vẽ cả chi tiết (vật liệu chớp mắt riêng mỗi người, chung 1 chương trình shader);
// addOutline (style.js) dựng viền từ body.geometry → tạm gán hình thân trước khi gọi addOutline rồi trả lại (loadHero lo việc này).
export function skinTo(model, G) {
  const bones = DEFORM.map(n => model.getObjectByName(n)), skel = new THREE.Skeleton(bones);
  const m = new THREE.SkinnedMesh(G.all, detailMat()); m.name = 'person-body'; m.bind(skel, new THREE.Matrix4()); m.frustumCulled = false; m.castShadow = true; model.add(m);
  return { body: m };
}
