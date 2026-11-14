// models.js — Nạp model Blender (.glb) từ client/assets/models/ bằng GLTFLoader (+ Draco, Meshopt).
// Quy trình làm model: xem docs/blender-glb.md
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { toonify } from './style.js';

const draco = new DRACOLoader().setDecoderPath('/lib/three/examples/jsm/libs/draco/gltf/');
const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();

// Nạp 1 model (có cache). Trả về scene của model đã chuyển sang vật liệu toon, hoặc null nếu thiếu file.
export function loadModel(name) {
  if (!cache.has(name)) cache.set(name, new Promise(res => loader.load(`/assets/models/${name}.glb`, g => res(toonify(g.scene)), undefined, e => { console.warn('Thiếu model', name, e?.message); res(null); })));
  return cache.get(name).then(m => m && m.clone());
}

// Rải nhiều bản sao 1 model bằng InstancedMesh (mỗi phần/vật liệu của model = 1 InstancedMesh)
export async function scatterModel(scene, name, transforms) {
  const src = await loadModel(name); if (!src || !transforms.length) return [];
  src.updateMatrixWorld(true);
  const out = [], o = new THREE.Object3D();
  src.traverse(mesh => {
    if (!mesh.isMesh) return;
    const im = new THREE.InstancedMesh(mesh.geometry, mesh.material, transforms.length);
    transforms.forEach(([x, y, z, s, ry], i) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.setScalar(s); o.updateMatrix(); im.setMatrixAt(i, o.matrix.clone().multiply(mesh.matrixWorld)); });
    im.castShadow = im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); out.push(im);
  });
  return out;
}
