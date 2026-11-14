// models.js — Nạp model Blender (.glb) từ client/assets/models/ bằng GLTFLoader (+ Draco, Meshopt).
// Quy trình làm model: xem docs/blender-glb.md
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
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

// Nạp model có xương + animation (nhân vật, thú). Mỗi lần gọi trả về 1 bản sao riêng và danh sách animation.
const animCache = new Map();
export function loadAnimated(name) {
  if (!animCache.has(name)) animCache.set(name, new Promise(res => loader.load(`/assets/models/${name}.glb`, g => { toonify(g.scene); res(g); }, undefined, e => { console.warn('Thiếu model', name, e?.message); res(null); })));
  return animCache.get(name).then(g => {
    if (!g) return null;
    const scene = cloneSkinned(g.scene); scene.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
    return { scene, animations: g.animations };
  });
}

// Bộ điều khiển animation: play('Idle') tự chuyển mượt (crossfade) từ animation đang chạy
export function animator(scene, clips, rename = n => n) {
  const mixer = new THREE.AnimationMixer(scene), actions = {}; let cur = null;
  for (const c of clips) actions[rename(c.name)] = mixer.clipAction(c);
  return {
    mixer, actions,
    has: n => !!actions[n],
    play(n, fade = 0.2, once = false) {
      const a = actions[n]; if (!a || a === cur) return a;
      a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once; a.enabled = true; a.setEffectiveWeight(1);
      if (cur) a.crossFadeFrom(cur, fade, false); a.play(); cur = a; return a;
    },
    get current() { return cur; },
    update: dt => mixer.update(dt),
  };
}
