// kit.js — Bộ model CC0 dùng chung (client/assets/models/kit/*.glb, xem CREDITS.txt).
// Dùng: placeKit(scene, 'tree_oak', [[x, y, z, scale, rotY], ...]) → InstancedMesh (1 draw call / phần của model).
//       kitSize('building_a') → kích thước hộp bao (để căn tỷ lệ).
// Quy tắc: vật lặp lại luôn dùng placeKit (instancing); vật nhỏ không đổ bóng (shadow=false); xem docs/art-style.md.
import * as THREE from 'three';
import { loadModel, scatterModel } from './models.js';

export const KIT = 'kit/';
const sizes = new Map();
export async function kitSize(name) {
  if (!sizes.has(name)) { const m = await loadModel(KIT + name); sizes.set(name, m ? new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3()) : new THREE.Vector3(1, 1, 1)); }
  return sizes.get(name);
}
export async function placeKit(scene, name, transforms, { shadow = true } = {}) {
  const list = await scatterModel(scene, KIT + name, transforms);
  for (const im of list) { im.castShadow = shadow; im.name = 'kit-' + name; }
  return list;
}
