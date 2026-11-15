// geo.js — Hàm dựng mesh low poly dùng chung cho phương tiện & thú cưỡi: mỗi phần tô 1 màu (vertex color) rồi gộp thành 1 geometry.
import * as THREE from 'three';
import { toon } from './style.js';
import { mergeGeos } from './terrain.js';

export const colorMat = toon('#ffffff', { vertexColors: true });
const c3 = new THREE.Color();

export function paint(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo; c3.set(color);
  const col = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < col.length; i += 3) col.set([c3.r, c3.g, c3.b], i);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g;
}
export const at = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => geo.rotateX(rx).rotateY(ry).rotateZ(rz).translate(x, y, z);
export const box = (w, h, d, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => paint(at(new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz), color);
export function tube(a, b, r, color, seg = 6) { // ống nối 2 điểm
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  return paint(g, color);
}
export function mesh(parts, mat = colorMat) { const m = new THREE.Mesh(mergeGeos(parts), mat); m.castShadow = true; m.receiveShadow = true; return m; }
export const tris = o => { let n = 0; o.traverse(m => { if (m.isMesh && !m.userData.outline) n += m.geometry.attributes.position.count / 3; }); return n; };
// Biểu tượng SVG (khinh khí cầu, phượng hoàng) cho nút & nhãn
export const ICON = {
  balloon: '<svg viewBox="0 0 24 24" width="1.15em" height="1.15em" style="vertical-align:-0.2em"><path d="M12 1.5C7.3 1.5 4 5 4 9.2c0 3.3 2.6 6.3 5 8.2h6c2.4-1.9 5-4.9 5-8.2C20 5 16.7 1.5 12 1.5z" fill="#e8453c"/><path d="M12 1.5c-2 0-3.4 3.4-3.4 7.7 0 3.3 1.2 6.3 2.2 8.2h2.4c1-1.9 2.2-4.9 2.2-8.2 0-4.3-1.4-7.7-3.4-7.7z" fill="#f2c14e"/><path d="M9 17.4l1 2.6M15 17.4l-1 2.6" stroke="#5c4630" stroke-width="1"/><rect x="9.6" y="19.8" width="4.8" height="3" rx=".6" fill="#a8763e"/></svg>',
  phoenix: '<svg viewBox="0 0 24 24" width="1.15em" height="1.15em" style="vertical-align:-0.2em"><path d="M12 13c-3-4-7-5-10-4 3 1 5 3 6 6-2 0-4 1-5 3 3-1 5 0 7 1l2 4 2-4c2-1 4-2 7-1-1-2-3-3-5-3 1-3 3-5 6-6-3-1-7 0-10 4z" fill="#f08a24"/><circle cx="12" cy="9" r="2" fill="#e8453c"/><path d="M12 7l-1-3 1 1 1-2v3z" fill="#f2c14e"/></svg>',
};
