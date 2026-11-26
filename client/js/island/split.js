// split.js — Chia khối gộp tĩnh lớn thành ô để camera CẮT ĐƯỢC (perf.js gọi).
// Vấn đề: nhiều khu gộp cả dãy nhà/đường/biển hiệu thành 1 lưới (1 draw call) bán kính 100–500 m → lúc nào cũng nằm trong
// khung hình nên GPU vẽ HẾT tam giác (cả phần sau lưng camera), cả ở pass bóng đổ (bóng chỉ phủ 34 m quanh người chơi).
// Điện thoại dọc: góc nhìn ngang chỉ ~27° → chia ô 89/144 m (Fibonacci) thì phần lớn ô nằm ngoài khung hình/vùng bóng → bỏ qua.
// Cách làm (không đổi gì ở file tạo ra lưới): lưới gốc giữ nguyên chỗ, vật liệu, visible (mọi file khác vẫn điều khiển được);
// hình học của nó nhường cho các lưới con (mỗi ô 1 con, cùng vật liệu) gắn làm con của nó. Nếu file khác sửa hình học gốc
// (đổi màu đỉnh, uv…) hoặc thay hình học → tự hoàn lại như cũ. Chia dần (nhiều khung, ≤ ngân sách ms/khung) → không khựng.
import * as THREE from 'three';

const MIN_R = 89, MIN_TRI = 5000, MIN_CELL = 1500;   // chỉ chia lưới bán kính ≥ 89 m, ≥ 5 000 tam giác, trung bình ≥ 1 500 tam giác/ô (đo: chia nhỏ hơn thì thêm lần vẽ nhiều hơn số tam giác bớt được)
const SKIP = /^(ground|seafloor|ocean|sky)|water/i;
const EMPTY = new THREE.BufferGeometry(); EMPTY.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3)); EMPTY.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0); EMPTY.boundingBox = new THREE.Box3();
const ver = g => { let s = g.index ? g.index.version : 0; for (const k in g.attributes) s += g.attributes[k].version; return s; };

export function canSplit(o) {
  if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.userData.noSplit || o.userData._sp || SKIP.test(o.name) || (o.parent && SKIP.test(o.parent.name))) return false;
  const g = o.geometry; if (!g || !g.attributes.position || Array.isArray(o.material) || g.groups.length > 1 || Object.keys(g.morphAttributes).length || g.drawRange.count !== Infinity || g.drawRange.start) return false;
  const n = (g.index ? g.index.count : g.attributes.position.count) / 3; if (n < MIN_TRI) return false;
  if (!g.boundingSphere) g.computeBoundingSphere();
  return g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() >= MIN_R;
}

// chia 1 lưới: generator (yield mỗi ~4 000 tam giác) → perf.js chạy dần theo ngân sách thời gian
export function* split(o) {
  const g = o.geometry, idx = g.index, pos = g.attributes.position, n = ((idx ? idx.count : pos.count) / 3) | 0, M = o.matrixWorld.elements;
  const v0 = ver(g), X = new Float32Array(n), Z = new Float32Array(n), vi = k => idx ? idx.getX(k) : k;
  for (let t = 0; t < n; t++) {
    let x = 0, z = 0; for (let k = 0; k < 3; k++) { const i = vi(t * 3 + k), px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i); x += M[0] * px + M[4] * py + M[8] * pz; z += M[2] * px + M[6] * py + M[10] * pz; }
    X[t] = x / 3 + M[12]; Z[t] = z / 3 + M[14];
    if ((t & 4095) === 4095) yield;
  }
  // cỡ ô nhỏ nhất (89 → 144 → 233 m) cho ≤ 6 ô: lưới thưa trải rộng (cột đèn khắp đảo…) không bị băm thành hàng chục lần vẽ vụn
  let C = 0, keys = null;
  for (const c of [89, 144, 233]) { const set = new Set(); for (let t = 0; t < n; t++) set.add(Math.floor(X[t] / c) * 4096 + Math.floor(Z[t] / c)); C = c; keys = set; if (set.size <= 6) break; yield; }
  if (keys.size < 2 || n / keys.size < MIN_CELL) { o.userData._sp = 'one'; return; }   // ít tam giác mỗi ô: chia không lợi (thêm lần vẽ)
  const cells = new Map();
  for (let t = 0; t < n; t++) { const key = Math.floor(X[t] / C) * 4096 + Math.floor(Z[t] / C); let a = cells.get(key); if (!a) cells.set(key, a = []); a.push(t); }
  if (cells.size < 2) { o.userData._sp = 'one'; return; }
  const kids = [];
  for (const tris of cells.values()) {
    const map = new Map(), order = [], I = [];
    for (const t of tris) for (let k = 0; k < 3; k++) { const i = vi(t * 3 + k); let j = map.get(i); if (j === undefined) { j = order.length; map.set(i, j); order.push(i); } I.push(j); }
    const cg = new THREE.BufferGeometry();
    for (const name in g.attributes) {
      const A = g.attributes[name], T = A.isInterleavedBufferAttribute ? A.data.array.constructor : A.array.constructor, s = A.itemSize, arr = new T(order.length * s);
      for (let j = 0; j < order.length; j++) for (let c = 0; c < s; c++) arr[j * s + c] = A.getComponent(order[j], c);
      cg.setAttribute(name, new THREE.BufferAttribute(arr, s, A.normalized));
    }
    cg.setIndex(order.length > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
    cg.computeBoundingSphere();
    const m = new THREE.Mesh(cg, o.material);
    Object.assign(m, { name: o.name, castShadow: o.castShadow, receiveShadow: o.receiveShadow, renderOrder: o.renderOrder, frustumCulled: o.frustumCulled, matrixAutoUpdate: false });
    m.customDepthMaterial = o.customDepthMaterial; m.customDistanceMaterial = o.customDistanceMaterial; m.onBeforeRender = o.onBeforeRender;
    m.layers.mask = o.userData._pm !== undefined && o.layers.mask === 0 ? o.userData._pm : o.layers.mask;
    for (const k in o.userData) if (k[0] !== '_') m.userData[k] = o.userData[k];
    m.userData._spKid = 1; kids.push(m);
    yield;
  }
  if (o.geometry !== g || ver(g) !== v0) return;   // file khác vừa đổi hình học trong lúc chia → bỏ, thử lại sau
  for (const m of kids) o.add(m);
  o.userData._sp = { g, v: v0, kids }; o.geometry = EMPTY;
}

// gọi thưa (mỗi lần quét): file khác thay/sửa hình học gốc → hoàn lại
export function check(o) {
  const s = o.userData._sp; if (!s || s === 'one') return;
  if (o.geometry === EMPTY && ver(s.g) === s.v) return;
  for (const m of s.kids) { o.remove(m); m.geometry.dispose(); }
  if (o.geometry === EMPTY) o.geometry = s.g;
  o.userData._sp = 'undo';   // không chia lại vật này nữa
}
