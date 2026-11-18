// academy/geo.js — gom khối greybox (hộp, trụ, nón, mái hai dốc) thành 1 geometry tô màu đỉnh → 1 draw call / nhóm.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();

export class Batch {
  constructor() { this.list = []; }
  /** thêm geometry đã có, tô màu col, đặt tại (x,y,z), xoay (rx,ry,rz), tỷ lệ (sx,sy,sz) */
  add(geo, col, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(_m.compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)));
    _c.set(col); const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); this.list.push(g); return this;
  }
  /** hộp theo khoảng [x0,x1]×[y0,y1]×[z0,z1] */
  box(x0, x1, y0, y1, z0, z1, col) { return this.add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), col, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); }
  cyl(x, y0, z, r, h, col, seg = 8, rTop = r) { return this.add(new THREE.CylinderGeometry(rTop, r, h, seg), col, x, y0 + h / 2, z); }
  cone(x, y0, z, r, h, col, seg = 8) { return this.add(new THREE.ConeGeometry(r, h, seg), col, x, y0 + h / 2, z); }
  /** mái hai dốc trên khung [x0,x1]×[z0,z1] ở cao độ y, cao h; nóc chạy theo cạnh dài */
  gable(x0, x1, z0, z1, y, h, col) {
    const alongX = x1 - x0 >= z1 - z0, g = new THREE.BufferGeometry(), P = [];
    const q = (a, b, c) => P.push(...a, ...b, ...c);
    if (alongX) {
      const zm = (z0 + z1) / 2, A = [x0, y, z0], B = [x1, y, z0], Cc = [x1, y, z1], D = [x0, y, z1], E = [x0, y + h, zm], Fh = [x1, y + h, zm];
      q(A, E, B); q(B, E, Fh); q(Cc, Fh, D); q(D, Fh, E); q(A, D, E); q(B, Fh, Cc);
    } else {
      const xm = (x0 + x1) / 2, A = [x0, y, z0], B = [x1, y, z0], Cc = [x1, y, z1], D = [x0, y, z1], E = [xm, y + h, z0], Fh = [xm, y + h, z1];
      q(A, Fh, E); q(A, D, Fh); q(B, E, Fh); q(B, Fh, Cc); q(A, E, B); q(D, Cc, Fh);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
    return this.add(g, col);
  }
  build() { if (!this.list.length) return new THREE.BufferGeometry(); const g = mergeGeometries(this.list); g.computeBoundingSphere(); this.list = []; return g; }
}
