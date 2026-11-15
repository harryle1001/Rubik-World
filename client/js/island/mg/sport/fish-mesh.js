// fish-mesh.js — Dựng cá low-poly theo thông số loài (fish-data.js): thân, đuôi, vây, mắt, hoa văn tô theo đỉnh → 1 mesh / loài (cache geometry).
// Trục: đầu cá hướng +Z, dài 1 đơn vị (nhân với chiều dài thật). Vật liệu toon dùng chung (vmat) → các con cá cùng 1 vật liệu.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { vmat, paint, PHI } from './kit.js';

const _a = new THREE.Color(), _b = new THREE.Color(), _x = new THREE.Color();
const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
// tỉ lệ thân theo dáng: [cao, dày, thuôn đuôi, dài]
const BODY = { fish: [0.34, 0.17, 0.62, 1], deep: [0.5, 0.15, 0.6, 1], long: [0.2, 0.14, 0.55, 1.1], eel: [0.09, 0.08, 0.3, 1.25], flat: [0.08, 0.56, 0.4, 1], ray: [0.07, 1.25, 0.2, 0.7], squid: [0.18, 0.18, 0.1, 1], round: [0.78, 0.13, 0.15, 0.8], sail: [0.2, 0.12, 0.6, 1.1], wing: [0.2, 0.14, 0.6, 1] };

function body(sp) {
  const [H, W, tap, L] = BODY[sp.shape] || BODY.fish;
  const g = new THREE.SphereGeometry(0.5, 12, 8).toNonIndexed(); g.rotateX(Math.PI / 2); // trục cực theo Z
  const p = g.attributes.position, c = new Float32Array(p.count * 3), [top, belly, acc] = sp.col;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = z < 0 ? -z / 0.5 : 0, k = 1 - t * tap, hk = sp.shape === 'squid' ? 1 - Math.max(0, z / 0.5) * 0.85 : z > 0.25 ? 1 - (z - 0.25) * 0.9 : 1; // thuôn về đuôi, đầu tròn (mực: nhọn phía trước)
    x *= W * 2 * k * hk; y *= H * 2 * k * hk; z *= L; if (sp.shape === 'ray') x *= 1 - Math.abs(z) * 1.1;
    p.setXYZ(i, x, y, z);
    // màu: lưng → bụng, rồi hoa văn
    const yn = y / (H + 1e-4); _x.set(top).lerp(_b.set(belly), Math.min(1, Math.max(0, 0.5 - yn * 1.6)));
    if (sp.pat === 'band' && Math.sin(z * 23) > 0.55 && yn > -0.3) _x.lerp(_a.set(acc), 0.75);
    if (sp.pat === 'stripe' && Math.abs(yn - 0.12) < 0.09) _x.lerp(_a.set(acc), 0.7);
    if (sp.pat === 'spot' && hash(Math.round(x * 14), Math.round(y * 14), Math.round(z * 14)) > 0.78 && yn > -0.35) _x.lerp(_a.set(acc), 0.85);
    if (sp.pat === 'koi' && hash(Math.round(x * 6), Math.round(y * 5), Math.round(z * 5)) > 0.5 && yn > -0.2) _x.set(hash(Math.round(z * 3), 1, 2) > 0.6 ? '#ff9a2b' : acc);
    c.set([_x.r, _x.g, _x.b], i * 3);
  }
  g.deleteAttribute('uv'); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); return g;
}
const tri = (pts, color) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.computeVertexNormals(); return paint(g, color); };
// vây mỏng 2 mặt (tam giác + mặt sau)
const fin = (a, b, c, color) => tri([a, b, c, a, c, b], color);

const cache = new Map();
export function fishGeo(sp) {
  if (cache.has(sp.id)) return cache.get(sp.id);
  const [H, W, , L] = BODY[sp.shape] || BODY.fish, [top, , acc] = sp.col, fins = [];
  const finCol = sp.shape === 'wing' || sp.shape === 'sail' ? acc : sp.id === 'ngu' ? acc : top, tz = -0.5 * L;
  if (sp.shape === 'squid') {
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = 0.05; fins.push(paint(new THREE.ConeGeometry(0.025, 0.42, 3).rotateX(-Math.PI / 2).translate(Math.cos(a) * r, Math.sin(a) * r, -0.68), acc)); }
    fins.push(fin([0, 0, 0.5], [0.16, 0, 0.22], [0, 0, 0.3], top), fin([0, 0, 0.5], [-0.16, 0, 0.22], [0, 0, 0.3], top));
  } else if (sp.shape === 'ray') {
    fins.push(paint(new THREE.ConeGeometry(0.012, 0.9, 3).rotateX(-Math.PI / 2).translate(0, 0, tz - 0.45), top));
  } else if (sp.shape === 'flat') {
    fins.push(fin([0, 0, tz + 0.04], [0.16, 0, tz - 0.16], [-0.16, 0, tz - 0.16], finCol));
  } else {
    const th = sp.shape === 'round' ? H * 0.9 : H * (sp.shape === 'eel' ? 0.8 : 0.9);
    if (sp.shape === 'round') fins.push(fin([0, H * 0.9, tz + 0.18], [0, H * 1.25, tz - 0.02], [0, H * 0.5, tz + 0.05], finCol), fin([0, -H * 0.9, tz + 0.18], [0, -H * 1.25, tz - 0.02], [0, -H * 0.5, tz + 0.05], finCol), fin([0, H * 0.5, tz + 0.06], [0, -H * 0.5, tz + 0.06], [0, 0, tz - 0.06], finCol));
    else fins.push(fin([0, 0, tz + 0.06], [0, th, tz - 0.2], [0, -th, tz - 0.2], finCol), fin([0, 0, tz + 0.06], [0, th * 0.35, tz - 0.12], [0, -th * 0.35, tz - 0.12], finCol)); // đuôi chẻ
    if (sp.shape === 'sail') fins.push(fin([0, H * 0.8, 0.3], [0, H * 3.2, 0.05], [0, H * 0.8, -0.35], acc), paint(new THREE.ConeGeometry(0.02, 0.4, 4).rotateX(Math.PI / 2).translate(0, 0, 0.5 * L + 0.18), top));
    else if (sp.shape !== 'eel' && sp.shape !== 'round') fins.push(fin([0, H * 0.85, 0.12], [0, H * (sp.shape === 'deep' ? 1.45 : 1.35), -0.08], [0, H * 0.75, -0.22], finCol));
    if (sp.shape === 'wing') for (const s of [1, -1]) fins.push(fin([s * W, 0, 0.18], [s * 0.62, 0.02, -0.05], [s * W, 0, -0.18], acc));
    else if (sp.shape !== 'eel') for (const s of [1, -1]) fins.push(fin([s * W * 0.9, -H * 0.3, 0.2], [s * W * 1.9, -H * 0.75, 0.04], [s * W * 0.9, -H * 0.5, 0.04], finCol));
    if (/tre|lang|bong|chep/.test(sp.id)) for (const s of [1, -1]) fins.push(paint(new THREE.ConeGeometry(0.008, sp.id === 'lang-cham' ? 0.5 : 0.22, 3).rotateX(Math.PI / 2 + 0.5).translate(s * 0.05, -H * 0.2, 0.5 * L + 0.04), '#2a2016')); // râu
  }
  // mắt
  const ez = sp.shape === 'squid' ? 0.05 : 0.5 * L * 0.62, ey = sp.shape === 'flat' ? H * 0.9 : H * 0.18, ex = sp.shape === 'flat' ? 0.06 : W * 0.86;
  for (const s of (sp.shape === 'flat' ? [1, 0.2] : [1, -1])) { fins.push(paint(new THREE.IcosahedronGeometry(Math.max(0.035, H * 0.12), 0).translate(s * ex, ey, ez), '#ffffff')); fins.push(paint(new THREE.IcosahedronGeometry(Math.max(0.02, H * 0.07), 0).translate(s * (ex + 0.012 * Math.sign(s)), ey, ez + 0.01), '#1a1418')); }
  const geo = mergeGeometries([body(sp), ...fins.map(g => { g.deleteAttribute('uv'); return g; })]);
  geo.computeBoundingSphere(); cache.set(sp.id, geo); return geo;
}
// 1 con cá (Mesh) cỡ L mét; userData.swim(t) quẫy đuôi bằng cách lắc thân
export function makeFish(sp, Lm) {
  const m = new THREE.Mesh(fishGeo(sp), vmat); m.scale.setScalar(Lm); m.castShadow = true;
  const ph = Math.random() * 6.28;
  m.userData.wag = (t, amp = 1) => { m.rotation.z = sp.shape === 'ray' ? Math.sin(t * 3 + ph) * 0.2 * amp : 0; return Math.sin(t * (sp.shape === 'eel' ? 6 : 9) + ph) * 0.22 * amp; };
  return m;
}
export const tris = sp => fishGeo(sp).attributes.position.count / 3;
export { PHI };
