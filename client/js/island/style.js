// style.js — Phong cách vẽ kiểu Zelda: MeshToonMaterial 4 bậc sáng mềm + viền mảnh nâu tím (inverted hull).
import * as THREE from 'three';
import { CFG } from './config.js';

// Dải sáng nhiều bậc (CFG.toon.steps), lọc Nearest để ra các mảng màu rõ ràng
const steps = CFG.toon.steps.map(v => Math.round(v * 255));
export const gradientMap = new THREE.DataTexture(new Uint8Array(steps), steps.length, 1, THREE.RedFormat);
gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter; gradientMap.needsUpdate = true;

const cache = new Map();
// Vật liệu toon dùng chung theo màu (đỡ tạo nhiều vật liệu)
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.unique && cache.has(key)) return cache.get(key);
  const o = Object.assign({ color, gradientMap }, opts); delete o.unique;
  const m = new THREE.MeshToonMaterial(o); cache.set(key, m); return m;
}

// Viền: vẽ lại mặt sau, đẩy đỉnh theo pháp tuyến ra ngoài
export const outlineMat = new THREE.MeshBasicMaterial({ color: CFG.outline.color, side: THREE.BackSide });
// độ dày theo khoảng cách tới camera (chuẩn CFG.outline.ref m): gần không thô, xa không mất nét; kẹp trong [1/φ, φ²]
outlineMat.onBeforeCompile = sh => {
  sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float oD = -(modelViewMatrix * vec4(transformed, 1.)).z;
    transformed += normalize(normal) * ${CFG.outline.thickness.toFixed(3)} * clamp(oD / ${CFG.outline.ref.toFixed(1)}, 0.618, 2.618);`);
};
export function addOutline(root) {
  const list = []; root.traverse(o => { if (o.isMesh && !o.userData.outline) list.push(o); });
  for (const o of list) {
    if (!o.visible) continue;
    let e;
    if (o.isSkinnedMesh) { e = new THREE.SkinnedMesh(o.geometry, outlineMat); e.bind(o.skeleton, o.bindMatrix); e.position.copy(o.position); e.quaternion.copy(o.quaternion); e.scale.copy(o.scale); o.parent.add(e); } // nhân vật có xương: viền cùng chuyển động
    else { e = new THREE.Mesh(o.geometry, outlineMat); o.add(e); }
    e.userData.outline = true; e.castShadow = false; e.frustumCulled = false; e.raycast = () => {};
  }
}

// Chuyển mọi vật liệu của model (GLTF) sang toon, giữ màu/texture gốc
export function toonify(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material; o.material = new THREE.MeshToonMaterial({ name: m.name, color: m.color || 0xffffff, map: m.map || null, gradientMap, vertexColors: !!o.geometry.attributes.color });
    o.castShadow = o.receiveShadow = true;
  });
  return root;
}
