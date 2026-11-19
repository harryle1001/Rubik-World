// academy/village-pieces.js — MẢNH XÂY NHÀ của Làng Phù Thuỷ Nhỏ (phép "Dựng Lên!").
// Chỉ ghép model CC0 có sẵn: Kenney Fantasy Town Kit (assets/models/alley: tường, cửa, cửa sổ, mái, cầu thang, khối đá, đèn lồng),
// Kenney Furniture/Fence/Nature Kit + KayKit (assets/models/kit: bàn, ghế, giá sách, ghế sofa, hàng rào, cây, bụi hoa) — xem CREDITS.txt.
// Mỗi model được "nướng" 1 lần thành lưới chỉ có vị trí + pháp tuyến + MÀU ĐỈNH (lấy mẫu màu bảng texture 128 px tại UV) →
// mọi mảnh của 1 lô gộp được thành 1 lưới = 1 draw call (lô ≤ 34 draw call kể cả bóng, biển tên, mảnh đang bay).
// Khối Rubik: hộp 6 màu chuẩn Rubik (không có model tương ứng).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadModel } from '../models.js';
import { VILLAGE } from './plan.js';

export const S = VILLAGE.S;                                    // 1 ô = 3,4 m (cao 1 tầng cũng 3,4 m)
export const LEVELS = 5;                                       // 5 tầng (Fibonacci)
export const MAX_PIECES = 377;                                 // tối đa mảnh / lô (Fibonacci)
export const RUBIK = ['#f4f4f4', '#ffd500', '#ff5800', '#c41e3a', '#0051ba', '#009e60'];   // trắng, vàng, cam, đỏ, lam, lục
// kind: cell (đặt giữa ô) | edge (cạnh ô: tường, cửa, rào). fit: unit (mô-đun 1×1 Kenney phóng S) | h (cao h m, giữ tỷ lệ) |
//   floor | stairs | tower | edgekit (model rào dài bất kỳ → dài đúng 1 cạnh ô). solid: floor/ramp/block (đi lên được), wall (chắn).
export const PIECES = [
  { id: 'floor', name: 'Nền', icon: '🟫', cat: 'nha', model: 'alley/planks', kind: 'cell', fit: 'floor', cost: 1, solid: 'floor' },
  { id: 'wall', name: 'Tường', icon: '🧱', cat: 'nha', model: 'alley/wall', kind: 'edge', fit: 'unit', cost: 1, solid: 'wall' },
  { id: 'wallw', name: 'Tường gỗ', icon: '🪵', cat: 'nha', model: 'alley/wall-wood', kind: 'edge', fit: 'unit', cost: 1, solid: 'wall' },
  { id: 'door', name: 'Cửa', icon: '🚪', cat: 'nha', model: 'alley/wall-door', kind: 'edge', fit: 'unit', cost: 1 },
  { id: 'window', name: 'Cửa sổ', icon: '🪟', cat: 'nha', model: 'alley/wall-window-glass', kind: 'edge', fit: 'unit', cost: 1, solid: 'wall' },
  { id: 'roof', name: 'Mái nhà', icon: '🔺', cat: 'nha', model: 'alley/roof-high', kind: 'cell', fit: 'unit', cost: 2, rot: true, big: true },
  { id: 'roofp', name: 'Mái nhọn', icon: '⛺', cat: 'nha', model: 'alley/roof-point', kind: 'cell', fit: 'unit', cost: 2, big: true },
  { id: 'stairs', name: 'Cầu thang', icon: '🪜', cat: 'nha', model: 'alley/stairs-stone', kind: 'cell', fit: 'stairs', cost: 2, rot: true, solid: 'ramp', big: true },
  { id: 'tower', name: 'Tháp', icon: '🗼', cat: 'nha', model: 'alley/wall-block', cap: 'alley/roof-point', kind: 'cell', fit: 'tower', cost: 5, solid: 'block', big: true },
  { id: 'fence', name: 'Hàng rào', icon: '🪧', cat: 'vuon', model: 'kit/fence_picket', kind: 'edge', fit: 'edgekit', cost: 1 },
  { id: 'tree', name: 'Cây', icon: '🌳', cat: 'vuon', model: 'kit/plant_tree_town', kind: 'cell', fit: 'h', h: 5.5, cost: 3, big: true },
  { id: 'bush', name: 'Bụi hoa', icon: '🌺', cat: 'vuon', model: 'kit/plant_bush_round', kind: 'cell', fit: 'h', h: 1.3, cost: 1 },
  { id: 'lamp', name: 'Đèn lồng', icon: '🏮', cat: 'vuon', model: 'alley/lantern', kind: 'cell', fit: 'h', h: 2.6, cost: 1 },
  { id: 'table', name: 'Bàn', icon: '🪑', cat: 'noi', model: 'kit/furn_table', kind: 'cell', fit: 'h', h: 0.85, cost: 1, rot: true },
  { id: 'chair', name: 'Ghế', icon: '💺', cat: 'noi', model: 'kit/furn_chair', kind: 'cell', fit: 'h', h: 1.05, cost: 1, rot: true },
  { id: 'shelf', name: 'Giá sách', icon: '📚', cat: 'noi', model: 'kit/furn_bookshelf_full', kind: 'cell', fit: 'h', h: 2.1, cost: 1, rot: true },
  { id: 'sofa', name: 'Sofa', icon: '🛋️', cat: 'noi', model: 'kit/furn_couch', kind: 'cell', fit: 'h', h: 0.9, cost: 1, rot: true },
  { id: 'cube', name: 'Khối Rubik', icon: '🧊', cat: 'rubik', kind: 'cell', fit: 'cube', cost: 1, solid: 'block', color: true },
];
export const BY_ID = Object.fromEntries(PIECES.map(p => [p.id, p]));
export const CATS = [['nha', '🏠 Nhà'], ['vuon', '🌳 Vườn'], ['noi', '🛋️ Nội thất'], ['rubik', '🧊 Rubik']];

// ---------- nướng model → lưới màu đỉnh ----------
const imgData = new WeakMap();
function sampler(tex) {
  const img = tex && tex.image; if (!img || !img.width) return null;
  if (!imgData.has(img)) {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    imgData.set(img, { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height });
  }
  const { d, w, h } = imgData.get(img), fy = tex.flipY;
  return (u, v, out) => {
    u -= Math.floor(u); v -= Math.floor(v); if (fy) v = 1 - v;
    const k = (Math.min(h - 1, Math.floor(v * h)) * w + Math.min(w - 1, Math.floor(u * w))) * 4;
    out.setRGB(d[k] / 255, d[k + 1] / 255, d[k + 2] / 255, THREE.SRGBColorSpace);
  };
}
function bake(root) {
  root.updateMatrixWorld(true); const parts = [], c = new THREE.Color(), cv = new THREE.Color();
  root.traverse(o => {
    if (!o.isMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material, g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of ['position', 'normal', 'uv', 'color']) {   // Meshopt lượng tử hoá (Int16 chuẩn hoá) → Float32, không thì phóng to bị kẹp trong [−1, 1]
      const a = g.attributes[k]; if (!a || a.array instanceof Float32Array && !a.isInterleavedBufferAttribute) continue;
      const f = new Float32Array(a.count * a.itemSize); for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) f[i * a.itemSize + c] = c === 0 ? a.getX(i) : c === 1 ? a.getY(i) : c === 2 ? a.getZ(i) : a.getW(i);
      g.setAttribute(k, new THREE.BufferAttribute(f, a.itemSize));
    }
    g.applyMatrix4(o.matrixWorld);
    const n = g.attributes.position.count, col = new Float32Array(n * 3), uv = g.attributes.uv, vc = g.attributes.color, smp = sampler(m.map);
    for (let i = 0; i < n; i++) {
      c.copy(m.color || c.setRGB(1, 1, 1));
      if (smp && uv) { smp(uv.getX(i), uv.getY(i), cv); c.multiply(cv); }
      if (vc) c.multiply(cv.setRGB(vc.getX(i), vc.getY(i), vc.getZ(i)));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); parts.push(g);
  });
  const g = parts.length > 1 ? mergeGeometries(parts) : parts[0]; g.computeBoundingBox(); return g;
}
const M = new THREE.Matrix4();
// đưa lưới về khung ô: gốc = tâm ô, y = 0 = mặt sàn tầng đó; mảnh cạnh nằm ở cạnh +x (x ≈ S/2), dài theo z
function fitGeo(p, g) {
  const b = g.boundingBox, sz = b.getSize(new THREE.Vector3()), ce = b.getCenter(new THREE.Vector3());
  const T = (x, y, z) => g.applyMatrix4(M.makeTranslation(x, y, z)), Sc = (x, y, z) => g.applyMatrix4(M.makeScale(x, y, z));
  if (p.fit === 'unit') { T(-ce.x * (p.kind === 'edge' ? 0 : 1), -b.min.y, -ce.z); Sc(S, S, S); if (p.kind === 'edge') { const bx = new THREE.Box3().setFromBufferAttribute(g.attributes.position); T(S / 2 - bx.max.x, 0, 0); } }
  else if (p.fit === 'floor') { T(-ce.x, -b.min.y, -ce.z); Sc(S / sz.x, 0.21 / sz.y, S / sz.z); }
  else if (p.fit === 'edgekit') {
    if (sz.x > sz.z) { g.applyMatrix4(M.makeRotationY(Math.PI / 2)); g.computeBoundingBox(); return fitGeo(p, g); }
    T(-ce.x, -b.min.y, -ce.z); const k = S / sz.z; Sc(k, Math.min(k, 1.3 / sz.y), k); T(S / 2 - sz.x * k / 2 - 0.05, 0, 0);
  } else if (p.fit === 'stairs') {   // bậc thang: phóng đủ 1 ô × 1 tầng; lật để phía cao ở +z
    T(-ce.x, -b.min.y, -ce.z); Sc(S / sz.x, S / sz.y, S / sz.z);
    const P = g.attributes.position; let hi = 0, lo = 0; for (let i = 0; i < P.count; i++) if (P.getY(i) > S * 0.8) (P.getZ(i) > 0 ? hi++ : lo++);
    if (lo > hi) g.applyMatrix4(M.makeRotationY(Math.PI));
  } else if (p.fit === 'tower') { T(-ce.x, -b.min.y, -ce.z); Sc(S * 0.62 / sz.x, S / sz.y, S * 0.62 / sz.z); }
  else if (p.fit === 'cap') { T(-ce.x, -b.min.y, -ce.z); Sc(S * 0.82 / sz.x, S * 0.62 / sz.y, S * 0.82 / sz.z); }
  else { const k = Math.min(p.h / sz.y, S * 0.92 / Math.max(sz.x, sz.z)); T(-ce.x, -b.min.y, -ce.z); Sc(k, k, k); }
  g.computeBoundingBox(); g.computeBoundingSphere(); return g;
}
const geoCache = new Map();
/** Lưới chuẩn của mảnh (Promise). tower trả { body, cap } */
export function pieceGeo(id) {
  if (geoCache.has(id)) return geoCache.get(id);
  const p = BY_ID[id];
  const job = p.fit === 'cube'
    ? Promise.resolve((() => { const g = new THREE.BoxGeometry(S * 0.96, S * 0.96, S * 0.96).toNonIndexed().translate(0, S * 0.48, 0); g.deleteAttribute('uv'); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); g.computeBoundingBox(); return g; })())
    : Promise.all([loadModel(p.model), p.cap ? loadModel(p.cap) : null]).then(([a, b]) => {
      if (!a) return null; const body = fitGeo(p, bake(a));
      if (!b) return body; const cap = fitGeo({ fit: 'cap' }, bake(b)); cap.translate(0, S, 0); cap.computeBoundingBox(); return { body, cap };
    });
  geoCache.set(id, job); return job;
}
export const loadAll = () => Promise.all(PIECES.map(p => pieceGeo(p.id)));

// ---------- 1 mảnh = [id, i, j, k, r, c]: ô (i theo trục x/v, j theo trục z/u), tầng k, hướng r (0 +z, 1 +x, 2 −z, 3 −x), màu c ----------
export const edgeDir = r => [[0, 1], [1, 0], [0, -1], [-1, 0]][r & 3];
const _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
/** ma trận đặt mảnh trong khung lô (gốc lô = góc ô 0,0 ở mặt nền) */
export function pieceMatrix(pc, out = new THREE.Matrix4()) {
  const [id, i, j, k, r] = pc, p = BY_ID[id];
  let a = 0;
  if (p.kind === 'edge') { const [dx, dz] = edgeDir(r); a = Math.atan2(-dz, dx); }   // +x → (dx, dz)
  else if (p.rot) a = -r * Math.PI / 2 + Math.PI;                                  // r 0: mặt chính nhìn ra +z
  _p.set((i + 0.5) * S, k * S, (j + 0.5) * S); _q.setFromAxisAngle(Y, a);
  return out.compose(_p, _q, _s);
}
const _c = new THREE.Color();
/** gộp danh sách mảnh → 1 BufferGeometry (đồng bộ: lưới mảnh phải nạp xong) — trả null nếu rỗng */
export function mergeLot(list, geos) {
  const parts = [], has = new Set(list.filter(p => p[0] === 'tower').map(p => p[1] + ',' + p[2] + ',' + p[3]));
  for (const pc of list) {
    const G = geos[pc[0]]; if (!G) continue; const m = pieceMatrix(pc, M.clone());
    const add = src => {
      const g = src.clone().applyMatrix4(m);
      if (BY_ID[pc[0]].color) { _c.set(RUBIK[pc[5] | 0]); const C = g.attributes.color; for (let n = 0; n < C.count; n++) C.setXYZ(n, _c.r, _c.g, _c.b); }
      parts.push(g);
    };
    if (G.body) { add(G.body); if (!has.has(pc[1] + ',' + pc[2] + ',' + (pc[3] + 1))) add(G.cap); } else add(G);
  }
  if (!parts.length) return null;
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
}
/** hộp bao (khung lô) của 1 mảnh — dùng để chạm chọn khi xoá */
export function pieceBox(pc, geos, out = new THREE.Box3()) {
  const G = geos[pc[0]]; if (!G) return out.makeEmpty();
  const b = (G.body || G).boundingBox; out.copy(b); if (G.body) out.union(G.cap.boundingBox);
  return out.applyMatrix4(pieceMatrix(pc, M));
}
