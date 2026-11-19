// vrm/vrm-hair.js — Ghép KIỂU TÓC giữa các mẫu VRoid CC0 (mọi mẫu cùng khung đầu: xương tóc "HairJoint-*" con của xương head).
// Mẫu cho tóc được nạp 1 lần → "bộ tóc" (lưới tóc + cây xương tóc + thông số SpringBone) gắn vào 1 khung = xương đầu;
// mỗi nhân vật nhân bản bộ tóc (SkeletonUtils.clone), canh theo tâm 2 mắt và tỉ lệ khoảng cách mắt, gắn vào đầu mẫu thân,
// bỏ tóc gốc + lò xo tóc gốc, tạo lại lò xo tóc (va chạm với collider đầu/thân của mẫu thân). Màu tóc vẫn đổi bằng litFactor.
import * as THREE from 'three';
import { clone as cloneSk } from 'three/addons/utils/SkeletonUtils.js';
import { VRMSpringBoneJoint } from '../../vendor/three-vrm.module.min.js';
import { loadVrm } from './vrm-core.js';

// kiểu tóc (id = mẫu cho tóc) · g: hợp nữ/nam/cả hai
export const HAIRS = {
  shino: { name: 'Dài thẳng', g: 'f' }, victoria: { name: 'Buộc lệch', g: 'f' }, vivi: { name: 'Bob búi', g: 'f' }, shibu: { name: 'Ngắn kẹp', g: 'fm' },
  dshibu: { name: 'Bob mái bằng', g: 'f' }, vita: { name: 'Tém xù', g: 'fm', drop: /HAIR_03/ },   // drop: lớp tai mèo (HairSample Female: tai dính liền tóc → không dùng)
  'hair-m': { name: 'Nam tém', g: 'm' }, fumiriya: { name: 'Nam mái dài', g: 'm' },
};
const isHairRoot = o => /^HairJoint/.test(o.name);
const eyeMid = (H, V) => { const l = H.getRawBoneNode('leftEye'), r = H.getRawBoneNode('rightEye'); if (!l || !r) return null; const a = l.getWorldPosition(new THREE.Vector3()), b = r.getWorldPosition(V); return { c: a.clone().add(b).multiplyScalar(0.5), d: a.distanceTo(b) }; };

const kits = new Map();
function kit(id, set) {
  const key = id + set; if (kits.has(key)) return kits.get(key);
  const p = loadVrm(id, set).then(({ vrm }) => {
    vrm.humanoid.update(); vrm.scene.updateMatrixWorld(true);
    const head = vrm.humanoid.getRawBoneNode('head'), K = new THREE.Bone(); K.name = 'hairkit-' + id;
    head.matrixWorld.decompose(K.position, K.quaternion, K.scale); K.updateMatrixWorld(true);
    const hair = new Set(); for (const r of head.children.filter(isHairRoot)) r.traverse(o => hair.add(o));
    const meshes = [], drop = (HAIRS[id] || {}).drop; vrm.scene.traverse(o => { if (o.isSkinnedMesh && o.userData.vrmKind === 'hair' && !(drop && drop.test([].concat(o.material)[0].name))) meshes.push(o); });
    const binds = meshes.map(m => {   // xương ngoài cây tóc (đầu, cổ…) → khung K; nghịch đảo nghỉ tính lại cho đúng vị trí cũ
      const sk = m.skeleton, nb = sk.bones.map(b => hair.has(b) ? b : K);
      const inv = sk.bones.map((b, i) => new THREE.Matrix4().copy(nb[i].matrixWorld).invert().multiply(b.matrixWorld).multiply(sk.boneInverses[i]));
      return { m, nb, inv, bind: m.bindMatrix.clone() };
    });
    for (const r of head.children.filter(isHairRoot)) K.attach(r);
    for (const b of binds) { b.m.removeFromParent(); K.add(b.m); b.m.bind(new THREE.Skeleton(b.nb, b.inv), b.bind); }
    const e = eyeMid(vrm.humanoid, new THREE.Vector3()), eye = e ? K.worldToLocal(e.c.clone()) : new THREE.Vector3(0, 0.07, 0.05);
    const joints = [...vrm.springBoneManager.joints].filter(j => hair.has(j.bone)).map(j => ({ b: j.bone.name, c: j.child && j.child.name, s: { ...j.settings, gravityDir: j.settings.gravityDir.clone() } }));
    return { K, eye, eyeD: e ? e.d : 0.042, joints };
  });
  kits.set(key, p); return p;
}

/** Thay tóc của vrm (đang nghỉ, model gốc toạ độ 0, tỉ lệ 1) bằng kiểu tóc id. Gọi TRƯỚC khi đổi màu tóc và may đồng phục. */
export async function setHairStyle(vrm, id, set = 'mobile') {
  const k = await kit(id, set), H = vrm.humanoid, head = H.getRawBoneNode('head');
  vrm.humanoid.update(); vrm.scene.updateMatrixWorld(true);
  // bỏ tóc gốc (lưới + lò xo); giữ xương (khung xương chung của thân có thể còn trỏ tới)
  const old = []; vrm.scene.traverse(o => { if (o.isMesh && o.userData.vrmKind === 'hair') old.push(o); });
  for (const o of old) { o.removeFromParent(); o.geometry.dispose(); }
  const SBM = vrm.springBoneManager;
  for (const j of [...SBM.joints]) { let p = j.bone; while (p && p !== head && !isHairRoot(p)) p = p.parent; if (p && isHairRoot(p)) SBM.deleteJoint(j); }
  // nhân bản bộ tóc, canh theo tâm mắt + tỉ lệ khoảng cách mắt
  const C = cloneSk(k.K); C.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); o.frustumCulled = false; } });
  const e = eyeMid(H, new THREE.Vector3()), s = e ? e.d / k.eyeD : 1, eyeL = e ? head.worldToLocal(e.c.clone()) : new THREE.Vector3(0, 0.07, 0.05);
  C.position.copy(eyeL).sub(k.eye.clone().multiplyScalar(s)); C.quaternion.identity(); C.scale.setScalar(s);
  head.add(C); C.updateMatrixWorld(true);
  const groups = SBM.colliderGroups;
  for (const j of k.joints) { const b = C.getObjectByName(j.b); if (!b) continue; SBM.addJoint(new VRMSpringBoneJoint(b, j.c ? C.getObjectByName(j.c) : null, { ...j.s, hitRadius: j.s.hitRadius * s }, groups)); }
  return C;
}
