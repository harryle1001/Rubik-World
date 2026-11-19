// vrm/vrm-anim.js — Chuyển 14 animation KayKit (người chibi đang dùng) sang xương humanoid chuẩn hoá của VRM.
// Công thức retarget (như ví dụ Mixamo của three-vrm): q_vrm = R_cha(nghỉ, thế giới) · q_local · R_xương(nghỉ, thế giới)⁻¹
// → độ xoay so với tư thế nghỉ (T-pose) trong hệ thế giới; xương chuẩn hoá VRM nghỉ = đơn vị nên gán thẳng.
// VRM 0.x quay mặt ngược (−Z) → đảo dấu x, z của quaternion và vị trí hông. Hông: vị trí × (cao hông VRM / cao hông KayKit).
import * as THREE from 'three';
import { loadAnimated } from '../models.js';
import { RIG, rigClips } from '../people-model.js';

const MAP = { hips: 'hips', spine: 'spine', chest: 'chest', head: 'head',
  upperarml: 'leftUpperArm', lowerarml: 'leftLowerArm', wristl: 'leftHand', upperarmr: 'rightUpperArm', lowerarmr: 'rightLowerArm', wristr: 'rightHand',
  upperlegl: 'leftUpperLeg', lowerlegl: 'leftLowerLeg', footl: 'leftFoot', toesl: 'leftToes', upperlegr: 'rightUpperLeg', lowerlegr: 'rightLowerLeg', footr: 'rightFoot', toesr: 'rightToes' };
// tay VRoid thon hơn KayKit: hạ tay thêm cho sát người (rad, quanh trục trước–sau); chân không đổi
const ARM_IN = 0.16, ARM_CLIPS = /^(Idle|Walking_A|Running_A|Jump_|Sit_|Hit_A|Head_No)/;
const B1 = { KL: 1, KA: 1 };   // giữ nguyên tỷ lệ KayKit (không kéo dài chân/tay như người chibi)

let srcP = null;
function source() {   // xương + clip KayKit (đã thêm Sit_Chair, Head_No) và tư thế nghỉ thế giới của từng xương
  return srcP || (srcP = loadAnimated(RIG).then(g => {
    const model = g.scene; model.updateMatrixWorld(true);
    const clips = rigClips(g.animations, B1, model), rest = {};
    for (const n of Object.keys(MAP)) { const b = model.getObjectByName(n); rest[n] = { w: b.getWorldQuaternion(new THREE.Quaternion()), p: b.parent.getWorldQuaternion(new THREE.Quaternion()), q: b.quaternion.clone(), pos: b.position.clone() }; }
    const hipsY = model.getObjectByName('hips').getWorldPosition(new THREE.Vector3()).y;
    return { clips, rest, hipsY, model };
  }));
}
export const kaykitRest = () => source();

const cache = new Map(), _q = new THREE.Quaternion(), _qz = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1);
// clips đã chuyển cho 1 mẫu VRM (cache theo mẫu: tên xương chuẩn hoá + cao hông giống nhau giữa các bản sao)
export async function vrmClips(vrm, key) {
  if (cache.has(key)) return cache.get(key);
  const S = await source(), H = vrm.humanoid, v0 = vrm.meta.metaVersion === '0';
  const node = n => H.getNormalizedBoneNode(MAP[n]), hips = node('hips');
  const k = hips.position.y / S.hipsY, hx0 = hips.position.x, hz0 = hips.position.z;
  const conv = (n, q) => { q.premultiply(S.rest[n].p).multiply(_q.copy(S.rest[n].w).invert()); if (v0) { q.x = -q.x; q.z = -q.z; } return q; };
  const poseOf = new Map(S.clips.pose.map(([n, p, v]) => [n + '.' + p, v]));
  const statics = [];   // xương không có track ở mọi clip: đặt 1 lần
  for (const n of Object.keys(MAP)) { const b = node(n); if (!b) continue; const v = poseOf.get(n + '.quaternion'); statics.push([b, conv(n, v ? new THREE.Quaternion().fromArray(v) : S.rest[n].q.clone())]); }
  const out = S.clips.map(c => {
    const tracks = [];
    for (const t of c.tracks) {
      const [n, p] = t.name.split('.'), b = MAP[n] && node(n); if (!b) continue;
      if (p === 'quaternion') {
        const v = t.values.slice(), arm = ARM_CLIPS.test(c.name) && /^upperarm/.test(n);
        if (arm) _qz.setFromAxisAngle(Z, (n.endsWith('l') ? -1 : 1) * ARM_IN);   // hạ tay trong hệ thế giới (trước khi đảo VRM0)
        for (let i = 0; i < v.length; i += 4) { const q = new THREE.Quaternion().fromArray(v, i); q.premultiply(S.rest[n].p).multiply(_q.copy(S.rest[n].w).invert()); if (arm) q.premultiply(_qz); if (v0) { q.x = -q.x; q.z = -q.z; } q.toArray(v, i); }
        tracks.push(new THREE.QuaternionKeyframeTrack(b.name + '.quaternion', t.times, v));
      } else if (p === 'position' && n === 'hips') {
        const v = t.values.slice();
        for (let i = 0; i < v.length; i += 3) { const x = (v[i] - S.rest.hips.pos.x) * k, z = (v[i + 2] - S.rest.hips.pos.z) * k; v[i] = hx0 + (v0 ? -x : x); v[i + 1] *= k; v[i + 2] = hz0 + (v0 ? -z : z); }
        tracks.push(new THREE.VectorKeyframeTrack(b.name + '.position', t.times, v));
      }
    }
    return new THREE.AnimationClip(c.name, c.duration, tracks);
  });
  // tay không có track ở clip nào nhưng cần hạ cho sát người (đã gộp vào statics nếu cần)
  const res = { clips: out, statics }; cache.set(key, res); return res;
}
