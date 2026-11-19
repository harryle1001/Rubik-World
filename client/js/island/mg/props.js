// mg/props.js — Đặt model CC0 có sẵn (client/assets/models/kit/*.glb) vào khu chơi mini game.
// prop(parent, 'sport_hoop', { size, x, y, z, ry, fit:'h'|'max' }) → Promise<Object3D|null>. Geometry/vật liệu dùng chung cache
// → đánh dấu shared để host không dispose khi thoát. anim(name, h) → { scene, anim } thú có animation (Quaternius).
import * as THREE from 'three';
import { loadModel, loadAnimated, animator } from '../models.js';
import { KIT } from '../kit.js';

const share = o => { o.traverse(m => { if (m.geometry) m.geometry.userData.shared = true; for (const x of [].concat(m.material || [])) x.userData.shared = true; }); return o; };
export async function prop(parent, name, { size = 1, x = 0, y = 0, z = 0, ry = 0, fit = 'max', shadow = true, skip = null } = {}) {
  const m = await loadModel(KIT + name); if (!m) return null;
  if (skip) { const rm = []; m.traverse(o => o.isMesh && skip.test(o.name) && rm.push(o)); for (const o of rm) o.removeFromParent(); }   // bỏ phần thừa (vd người lái có sẵn trong xe kart)
  const b = new THREE.Box3().setFromObject(m), s = b.getSize(new THREE.Vector3());
  const k = size / Math.max(fit === 'h' ? s.y : Math.max(s.x, s.y, s.z), 1e-3); m.scale.multiplyScalar(k);
  const g = new THREE.Group(); m.position.y -= b.min.y * k; g.add(m); g.position.set(x, y, z); g.rotation.y = ry;
  m.traverse(o => { if (o.isMesh) { o.castShadow = shadow; o.receiveShadow = true; } });
  parent.add(share(g)); return g;
}
const clean = n => n.split('|').pop();
export async function anim(parent, name, height = 1) {
  const g = await loadAnimated(name, true); if (!g) return null;
  g.scene.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g.scene), k = height / Math.max(b.max.y - b.min.y, 1e-3); g.scene.scale.multiplyScalar(k); g.scene.position.y = -b.min.y * k;
  const w = new THREE.Group(); w.add(g.scene); parent.add(share(w));
  g.scene.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { obj: w, anim: animator(g.scene, g.animations, clean) };
}
