// utils.js — Hàm dùng chung cho mọi file: số ngẫu nhiên có seed, noise địa hình,
// gộp nhiều hình khối thành 1 lưới (Mesher = ít draw call, chạy mượt trên điện thoại),
// vật liệu lay theo gió. Ít khi cần sửa file này.
import * as THREE from 'three';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function hash(x, y) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * noise2(x * f + i * 17.3, y * f - i * 9.1); n += a; a *= 0.5; f *= 2.03; } return s / n; }

// Khoảng cách từ điểm tới đoạn thẳng; t = vị trí chiếu (0..1)
export function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1);
  const cx = ax + dx * t, cz = az + dz * t;
  return { d: Math.hypot(px - cx, pz - cz), t };
}

// ---------- Mesher: gom nhiều khối có màu thành 1 geometry ----------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
export class Mesher {
  constructor() { this.parts = []; }
  // o: { p:[x,y,z], r:[rx,ry,rz], s:[sx,sy,sz] | số, top: màu đỉnh (chuyển màu mượt theo chiều cao), m: Matrix4 }
  add(geo, color, o = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.deleteAttribute('uv'); g.deleteAttribute('normal');
    const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s == null ? [1, 1, 1] : typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s;
    const pos = g.attributes.position, n = pos.count;
    const col = new Float32Array(n * 3);
    _c1.set(color); _c2.set(o.top || color);
    let y0 = Infinity, y1 = -Infinity;
    if (o.top) for (let i = 0; i < n; i++) { const y = pos.getY(i); if (y < y0) y0 = y; if (y > y1) y1 = y; }
    for (let i = 0; i < n; i++) {
      const t = o.top ? (pos.getY(i) - y0) / (y1 - y0 || 1) : 0;
      col[i * 3] = _c1.r + (_c2.r - _c1.r) * t; col[i * 3 + 1] = _c1.g + (_c2.g - _c1.g) * t; col[i * 3 + 2] = _c1.b + (_c2.b - _c1.b) * t;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.applyMatrix4(o.m || _m.compose(_p.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2])), _s.set(s[0], s[1], s[2])));
    this.parts.push(g);
    return this;
  }
  geometry() {
    let n = 0; for (const g of this.parts) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
    for (const g of this.parts) { P.set(g.attributes.position.array, o); C.set(g.attributes.color.array, o); o += g.attributes.position.array.length; g.dispose(); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
    geo.computeVertexNormals(); geo.computeBoundingSphere(); geo.computeBoundingBox();
    this.parts = [];
    return geo;
  }
  get empty() { return this.parts.length === 0; }
}

// Lăng trụ tam giác (mái nhà dốc 2 bên): rộng w (trục x), cao h, dài d (trục z), đáy ở y=0
export function prismGeo(w, h, d) {
  const x = w / 2, z = d / 2;
  const v = [
    -x, 0, z, x, 0, z, 0, h, z, x, 0, -z, -x, 0, -z, 0, h, -z,             // 2 đầu hồi
    -x, 0, z, 0, h, z, 0, h, -z, -x, 0, z, 0, h, -z, -x, 0, -z,            // mái trái
    x, 0, z, x, 0, -z, 0, h, -z, x, 0, z, 0, h, -z, 0, h, z,               // mái phải
    -x, 0, z, -x, 0, -z, x, 0, -z, -x, 0, z, x, 0, -z, x, 0, z,            // đáy
  ];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); return g;
}
// Nêm (mái nghiêng 1 phía): khối 1x1x1 cao dần từ +z (thấp) tới -z (cao)
export function wedgeGeo(w = 1, h = 1, d = 1) {
  const x = w / 2, z = d / 2;
  const v = [
    -x, 0, z, x, 0, z, x, h, -z, -x, 0, z, x, h, -z, -x, h, -z,  // mặt dốc
    -x, 0, -z, -x, h, -z, x, h, -z, -x, 0, -z, x, h, -z, x, 0, -z, // lưng
    -x, 0, z, -x, h, -z, -x, 0, -z,  x, 0, z, x, 0, -z, x, h, -z,  // 2 cạnh
    -x, 0, z, -x, 0, -z, x, 0, -z, -x, 0, z, x, 0, -z, x, 0, z,   // đáy
  ];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); return g;
}

// ---------- Uniform dùng chung: thời gian & sức gió (để cây cỏ lay) ----------
export const U = { uTime: { value: 0 }, uWind: { value: 1 } };

// Vật liệu low poly flat shading, có lay gió theo chiều cao (amp = biên độ, h = độ cao bắt đầu lay)
export function windMaterial(opts, amp = 0.15, h0 = 0) {
  const m = new THREE.MeshLambertMaterial(Object.assign({ flatShading: true, vertexColors: true }, opts));
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uWind = U.uWind;
    sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
      #else
        vec2 ip = (modelMatrix * vec4(0.,0.,0.,1.)).xz;
      #endif
      float hh = max(position.y - ${h0.toFixed(2)}, 0.0);
      float sw = sin(uTime * 1.7 + ip.x * 0.31 + ip.y * 0.23) * 0.65 + sin(uTime * 3.3 + ip.x * 0.9 - ip.y * 0.4) * 0.25;
      transformed.x += sw * uWind * ${amp.toFixed(3)} * hh;
      transformed.z += sw * uWind * ${(amp * 0.6).toFixed(3)} * hh;`);
  };
  m.customProgramCacheKey = () => 'wind' + amp + '_' + h0;
  return m;
}

export const flatMat = (opts = {}) => new THREE.MeshLambertMaterial(Object.assign({ flatShading: true, vertexColors: true }, opts));

// Chữ trên canvas → texture (biển chỉ đường, bảng tên)
export function textTexture(text, { w = 256, h = 64, bg = '#6b4a2b', fg = '#fff6df', font = 'bold 30px system-ui, sans-serif', arrow = 0 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2, w - 24);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
