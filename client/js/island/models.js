// models.js — Nạp model Blender (.glb) từ client/assets/models/ bằng GLTFLoader (+ Draco, Meshopt).
// Quy trình làm model: xem docs/blender-glb.md
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { toonify, gradientMap } from './style.js';

const draco = new DRACOLoader().setDecoderPath('/lib/three/examples/jsm/libs/draco/gltf/');
const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();

// Nạp 1 model (có cache). Trả về scene của model đã chuyển sang vật liệu toon, hoặc null nếu thiếu file.
export function loadModel(name) {
  if (!cache.has(name)) cache.set(name, new Promise(res => loader.load(`/assets/models/${name}.glb`, g => res(toonify(g.scene)), undefined, e => { console.warn('Thiếu model', name, e?.message); res(null); })));
  return cache.get(name).then(m => m && m.clone());
}

// Rải nhiều bản sao 1 model bằng InstancedMesh (mỗi phần/vật liệu của model = 1 InstancedMesh).
// cell > 0: chia theo ô cell×cell m (vd. 55, Fibonacci) → camera cắt bỏ ô ngoài khung hình, perf.js ẩn ô xa (chỉ số instance
// khi đó tính trong từng ô — đừng dùng khi cần setColorAt/getMatrixAt theo chỉ số của cả danh sách).
// userData.itemR = bán kính 1 vật lớn nhất trong mesh (perf.js dùng để ẩn vật nhỏ ở xa, tắt bóng vật < 1 m).
export async function scatterModel(scene, name, transforms, cell = 0) {
  const src = await loadModel(name); if (!src || !transforms.length) return [];
  src.updateMatrixWorld(true);
  const groups = new Map();
  for (const t of transforms) { const k = cell ? Math.floor(t[0] / cell) + ',' + Math.floor(t[2] / cell) : 0; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); }
  const out = [], o = new THREE.Object3D(), parts = [];
  src.traverse(m => { if (m.isMesh) parts.push(m); });
  for (const mesh of bakeParts(name, parts)) {
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
    const r0 = mesh.geometry.boundingSphere.radius * mesh.matrixWorld.getMaxScaleOnAxis();
    for (const list of groups.values()) {
      const im = new THREE.InstancedMesh(mesh.geometry, mesh.material, list.length); let sMax = 0;
      list.forEach(([x, y, z, s, ry], i) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.setScalar(s); o.updateMatrix(); im.setMatrixAt(i, o.matrix.clone().multiply(mesh.matrixWorld)); sMax = Math.max(sMax, s); });
      im.castShadow = im.receiveShadow = true; im.userData.itemR = r0 * sMax; im.computeBoundingSphere(); scene.add(im); out.push(im);
    }
  }
  return out;
}

// Gộp mọi phần của model (thân + tán, bánh + thùng xe…) thành 1 lưới, màu vật liệu nướng vào màu đỉnh → 1 InstancedMesh
// = 1 draw call / ô (trước: 1 draw call cho MỖI vật liệu, cả ở pass bóng). Chỉ gộp khi các phần không có texture,
// không trong suốt, không phát sáng, cùng mặt vẽ → hình ảnh y hệt (toon nhân màu vật liệu × màu đỉnh như nhau).
const baked = new Map();
function bakeParts(name, parts) {
  if (parts.length < 2) return parts;
  if (baked.has(name)) return baked.get(name);
  const m0 = parts[0].material, ok = parts.every(p => { const m = p.material; return !Array.isArray(m) && m.isMeshToonMaterial && !m.map && !m.transparent && !m.alphaTest && m.side === m0.side && (!m.emissive || m.emissive.getHex() === 0) && p.geometry.attributes.position; });
  if (!ok) { baked.set(name, parts); return parts; }
  let nV = 0, nI = 0; for (const p of parts) { const g = p.geometry; nV += g.attributes.position.count; nI += g.index ? g.index.count : g.attributes.position.count; }
  const P = new Float32Array(nV * 3), N = new Float32Array(nV * 3), C = new Float32Array(nV * 3), I = new Uint32Array(nI), v = new THREE.Vector3(), nm = new THREE.Matrix3();
  let vo = 0, io = 0;
  for (const p of parts) {
    const g = p.geometry, pa = g.attributes.position, na = g.attributes.normal, ca = g.attributes.color, col = p.material.color; p.updateWorldMatrix(true, false); nm.getNormalMatrix(p.matrixWorld);
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(p.matrixWorld); P.set([v.x, v.y, v.z], (vo + i) * 3);
      if (na) { v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.set([v.x, v.y, v.z], (vo + i) * 3); }
      C.set(ca ? [col.r * ca.getX(i), col.g * ca.getY(i), col.b * ca.getZ(i)] : [col.r, col.g, col.b], (vo + i) * 3);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) I[io + i] = g.index.getX(i) + vo; else for (let i = 0; i < pa.count; i++) I[io + i] = i + vo;
    vo += pa.count; io += g.index ? g.index.count : pa.count;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3)); geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); geo.setIndex(new THREE.BufferAttribute(I, 1));
  if (parts.some(p => !p.geometry.attributes.normal)) geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ name: 'baked-' + name, color: 0xffffff, vertexColors: true, gradientMap, side: m0.side }));
  const out = [mesh]; baked.set(name, out); return out;
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
