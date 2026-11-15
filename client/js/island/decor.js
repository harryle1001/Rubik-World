// decor.js — Công cụ dựng chi tiết nhẹ cho điện thoại:
//   Batch       gom khối tô màu theo đỉnh → 1 mesh (1 draw call)
//   DetailGrid  chi tiết nhỏ (rèm, chậu hoa, cỏ, bụi, đá, đèn…) chia theo ô 40 m, mỗi ô 2 mesh (thường + phát sáng),
//               chỉ hiện các ô trong ~60 m quanh người chơi, không đổ bóng
//   createLife  bướm, chim hải âu, lá cờ bay (InstancedMesh, cập nhật nhẹ mỗi khung)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, gradientMap } from './style.js';

const _o = new THREE.Object3D(), _m = new THREE.Matrix4(), _c = new THREE.Color(), _v = new THREE.Vector3(), _b = new THREE.Box3();
// Sổ ghi vị trí đèn & ống khói khi dựng (ambience.js dùng: quầng sáng đèn ban đêm, khói bếp)
export const LIGHTS = [], CHIMNEYS = [], GLOW_MATS = [];
const LAMP_COLS = new Set(['#ffd36e', '#ffe9a8', '#fff3c4', '#ffe28a']), CHIM_COL = '#9a5b3e';
function note(g, col, glow) {
  if (!(glow || LAMP_COLS.has(col) || col === CHIM_COL)) return;
  g.computeBoundingBox(); _b.copy(g.boundingBox); const sx = _b.max.x - _b.min.x, sy = _b.max.y - _b.min.y, sz = _b.max.z - _b.min.z;
  if (col === CHIM_COL) { if (sy > 1.2 && sy < 1.6 && sx < 0.6 && sz < 0.6) CHIMNEYS.push(new THREE.Vector3((_b.min.x + _b.max.x) / 2, _b.max.y, (_b.min.z + _b.max.z) / 2)); return; }
  if (Math.max(sx, sy, sz) < 0.8) LIGHTS.push(_b.getCenter(new THREE.Vector3()));   // khối nhỏ màu vàng ấm = bóng đèn
}

export class Batch {
  constructor(name) { this.name = name; this.geos = []; this.pre = null; this.tris = 0; }
  // biến đổi + tô màu 1 geometry (toạ độ cục bộ theo nhóm hiện tại)
  make(g, col, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz, 'YXZ'); _o.scale.set(sx, sy, sz); _o.updateMatrix();
    _m.copy(_o.matrix); if (this.pre) _m.premultiply(this.pre); g.applyMatrix4(_m); g.computeVertexNormals();
    _c.set(col); const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); this.tris += n / 3; if (typeof col === 'string') note(g, col.toLowerCase(), this.glowMode); return g;
  }
  store(g) { this.geos.push(g); }
  push(...a) { this.store(this.make(...a)); return this; }
  // khối hộp: y0 = đáy
  box(w, h, d, x, y0, z, col, ry = 0, rx = 0, rz = 0) { return this.push(new THREE.BoxGeometry(w, h, d), col, x, y0 + h / 2, z, ry, rx, rz); }
  cyl(rt, rb, h, x, y0, z, col, seg = 8, ry = 0, rx = 0, rz = 0) { return this.push(new THREE.CylinderGeometry(rt, rb, h, seg), col, x, y0 + h / 2, z, ry, rx, rz); }
  cone(r, h, x, y0, z, col, seg = 6, ry = 0) { return this.push(new THREE.ConeGeometry(r, h, seg), col, x, y0 + h / 2, z, ry); }
  ball(r, x, y, z, col, sx = 1, sy = 1, sz = 1) { return this.push(new THREE.IcosahedronGeometry(r, 0), col, x, y, z, 0, 0, 0, sx, sy, sz); }
  plane(w, h, x, y, z, col, ry = 0, rx = 0) { return this.push(new THREE.PlaneGeometry(w, h), col, x, y, z, ry, rx); }
  prism(w, h, d, x, y0, z, col, ry = 0) { return this.push(prismGeo(w, h, d), col, x, y0, z, ry); }   // mái 2 mái, đỉnh dọc trục x
  hip(w, h, d, x, y0, z, col, ry = 0) { return this.push(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4), col, x, y0 + h / 2, z, ry, 0, 0, w, h, d); }
  // nhóm: lệnh trong fn dùng toạ độ cục bộ (gốc x,y,z, xoay ry; +z cục bộ = mặt tiền)
  group(x, y, z, ry, fn) {
    const old = this.pre; _o.position.set(x, y, z); _o.rotation.set(0, ry, 0); _o.scale.set(1, 1, 1); _o.updateMatrix();
    this.pre = old ? old.clone().multiply(_o.matrix) : _o.matrix.clone(); fn(); this.pre = old; return this;
  }
  mesh(mat, shadow = true) {
    if (!this.geos.length) return null;
    const m = new THREE.Mesh(mergeGeometries(this.geos), mat); this.geos.length = 0;
    m.castShadow = shadow; m.receiveShadow = true; m.name = 'town-' + this.name; return m;
  }
}
export function prismGeo(w, h, d) {
  const x = w / 2, z = d / 2, p = [
    -x, 0, z, -x, h, 0, -x, 0, -z, x, 0, -z, x, h, 0, x, 0, z,
    -x, 0, z, x, 0, z, x, h, 0, -x, 0, z, x, h, 0, -x, h, 0,
    x, 0, -z, -x, 0, -z, -x, h, 0, x, 0, -z, -x, h, 0, x, h, 0,
    -x, 0, -z, x, 0, -z, x, 0, z, -x, 0, -z, x, 0, z, -x, 0, z];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
}

// ---------- Chi tiết theo ô, bật/tắt theo khoảng cách ----------
export class DetailGrid extends Batch {
  constructor(name = 'detail', cell = 40) { super(name); this.cell = cell; this.cells = new Map(); this.glowMode = false; this.list = []; }
  follow(b) { this.pre = b ? b.pre : null; return this; }      // dùng chung nhóm cục bộ của 1 batch khác
  glow(fn) { const o = this.glowMode; this.glowMode = true; fn(); this.glowMode = o; return this; }   // các khối phát sáng (đèn, cửa sổ đêm)
  store(g) {
    g.computeBoundingBox(); g.boundingBox.getCenter(_v);
    const k = Math.floor(_v.x / this.cell) + ',' + Math.floor(_v.z / this.cell);
    let c = this.cells.get(k); if (!c) { c = { base: [], glow: [], x: (Math.floor(_v.x / this.cell) + 0.5) * this.cell, z: (Math.floor(_v.z / this.cell) + 0.5) * this.cell }; this.cells.set(k, c); }
    (this.glowMode ? c.glow : c.base).push(g);
  }
  build(scene, matBase, matGlow) {
    for (const c of this.cells.values()) {
      const grp = new THREE.Group(); grp.name = 'detail-cell'; grp.visible = false;
      if (c.base.length) { const m = new THREE.Mesh(mergeGeometries(c.base), matBase); m.receiveShadow = true; grp.add(m); }
      if (c.glow.length) grp.add(new THREE.Mesh(mergeGeometries(c.glow), matGlow));
      scene.add(grp); this.list.push({ grp, x: c.x, z: c.z });
    }
    this.cells.clear(); return this;
  }
  // chi tiết thường hiện trong radius/√φ + nửa ô (~75 m); khối phát sáng (đèn đêm) giữ tầm xa cũ để không "tắt" đột ngột
  update(p, radius = 60) {
    const r = radius + this.cell * 0.7, rb = radius * 0.786 + this.cell * 0.7;
    for (const q of this.list) { const d = Math.hypot(q.x - p.x, q.z - p.z); q.grp.visible = d < r; const b = q.grp.children[0]; if (b && b.receiveShadow) b.visible = d < rb; }
  }
}
// vật liệu cho chi tiết: toon tô màu đỉnh + phát sáng (không cần đèn thật)
export const detailMats = () => { const g = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }); GLOW_MATS.push(g); return [toon('#ffffff', { vertexColors: true }), g]; };   // GLOW_MATS: ambience.js làm sáng dần khi tối

// ---------- Sự sống: bướm (theo vườn hoa), chim hải âu (theo biển), lá cờ bay ----------
export function createLife(scene, { butterflies = [], gulls = [], flag = null }) {
  const out = { update() {} }, parts = [];
  // bướm: 2 cánh (2 tam giác), vỗ cánh bằng cách đổi tỷ lệ trục x
  if (butterflies.length) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.32, 0.05, 0.12, 0.26, 0, -0.2, 0, 0, 0, -0.26, 0, -0.2, -0.32, 0.05, 0.12], 3)); g.computeVertexNormals();
    const im = new THREE.InstancedMesh(g, new THREE.MeshToonMaterial({ gradientMap, side: THREE.DoubleSide }), butterflies.length);
    const COL = ['#ffd23f', '#ff8ac2', '#ffffff', '#7fd0ff', '#ff9f43'];
    butterflies.forEach((b, i) => { b.ph = Math.random() * 6; b.col = COL[i % COL.length]; im.setColorAt(i, _c.set(b.col)); });
    im.frustumCulled = false; scene.add(im);
    parts.push((t, p) => {
      for (let i = 0; i < butterflies.length; i++) {
        const b = butterflies[i], a = t * 0.6 + b.ph, flap = 0.25 + Math.abs(Math.sin(t * 14 + b.ph)) * 0.9;
        _o.position.set(b.x + Math.sin(a) * 2.2, b.y + 0.7 + Math.sin(t * 2 + b.ph) * 0.35, b.z + Math.cos(a * 1.3) * 2.2);
        _o.rotation.set(0, a + Math.PI / 2, 0); _o.scale.set(flap, 1, 1); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    });
  }
  // hải âu: hình chữ V bay vòng tròn trên biển
  if (gulls.length) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, 0.9, 0.18, -0.1, 0, 0, -0.2, 0, 0, 0.25, 0, 0, -0.2, -0.9, 0.18, -0.1], 3)); g.computeVertexNormals();
    const im = new THREE.InstancedMesh(g, toon('#ffffff', { side: THREE.DoubleSide }), gulls.length); im.frustumCulled = false; scene.add(im);
    parts.push(t => {
      for (let i = 0; i < gulls.length; i++) {
        const q = gulls[i], a = t * q.v + q.ph, flap = 1 + Math.sin(t * 6 + q.ph) * 0.35;
        _o.position.set(q.x + Math.cos(a) * q.r, q.y + Math.sin(t + q.ph) * 1.5, q.z + Math.sin(a) * q.r); _o.rotation.set(0, -a, Math.sin(t * 6 + q.ph) * 0.15); _o.scale.set(1.4, flap * 1.4, 1.4); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    });
  }
  // lá cờ: tấm 8×5 ô, sóng dọc theo chiều ngang (đỉnh gắn cột đứng yên)
  if (flag) {
    const geo = new THREE.PlaneGeometry(flag.w, flag.h, 8, 5).translate(flag.w / 2, 0, 0), base = geo.attributes.position.array.slice();
    const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: flag.tex, gradientMap, side: THREE.DoubleSide })); m.position.set(flag.x, flag.y, flag.z); m.rotation.y = flag.ry || 0; scene.add(m);
    parts.push(t => { const a = geo.attributes.position; for (let i = 0; i < a.count; i++) { const x = base[i * 3]; a.setZ(i, Math.sin(x * 2.4 - t * 4) * 0.12 * x); } a.needsUpdate = true; });
  }
  let near = true;
  out.update = (t, p) => { for (const f of parts) f(t, p); };
  return out;
}
