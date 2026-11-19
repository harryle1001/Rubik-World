// ride-pose.js — Tư thế khi lái/cưỡi: IK 2 khớp (vai–khuỷu–cổ tay, hông–gối–cổ chân) đặt tay đúng ghi đông / dây / cương,
// bàn chân bám bàn đạp theo vòng đạp, thân nghiêng tới. Chạy SAU animation (mixer) mỗi khung — dùng chung người chơi và NPC.
// R = { hand: Object3D, hands: [V3, V3] (toạ độ trong hand), foot: Object3D | null, feet: [V3, V3], lean (rad), ankle: V3 (lệch cổ chân so với bàn đạp) }
// ref: Object3D chung của người + xe (trục x = ngang, z = trước) — dùng để chọn tay/chân trái phải và hướng khuỷu/gối.
import * as THREE from 'three';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3(), _m = new THREE.Vector3();
const _u = new THREE.Vector3(), _v = new THREE.Vector3(), _t = new THREE.Vector3(), _pole = new THREE.Vector3(), _l = new THREE.Vector3();
const _q = new THREE.Quaternion(), _bw = new THREE.Quaternion(), _pw = new THREE.Quaternion(), _rq = new THREE.Quaternion();
const ELBOW = new THREE.Vector3(0.5, -1, -0.618), KNEE = new THREE.Vector3(0.15, 0.382, 1);   // hướng khuỷu (ra ngoài, xuống, ra sau) · gối (ra trước, hơi lên)

// xoay xương trong hệ thế giới sao cho hướng `from` trùng `to`
function turn(bone, from, to) {
  if (from.lengthSq() < 1e-10 || to.lengthSq() < 1e-10) return;
  _q.setFromUnitVectors(from.normalize(), to.normalize());
  bone.getWorldQuaternion(_bw); bone.parent.getWorldQuaternion(_pw);
  bone.quaternion.copy(_pw.invert().multiply(_q.multiply(_bw)));
  bone.updateMatrixWorld(true);
}
// IK 2 khớp: A (gốc) – B (khớp giữa) – C (đầu mút) với tới điểm T (thế giới); pole: hướng khớp giữa (thế giới)
function solve(A, B, C, T, pole) {
  A.getWorldPosition(_a); B.getWorldPosition(_b); C.getWorldPosition(_c);
  const l1 = _a.distanceTo(_b), l2 = _b.distanceTo(_c); _d.subVectors(T, _a); let d = _d.length(); if (d < 1e-4) return;
  _d.divideScalar(d); d = THREE.MathUtils.clamp(d, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.999);
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  _n.copy(pole).addScaledVector(_d, -pole.dot(_d)); if (_n.lengthSq() < 1e-8) _n.set(0, 1, 0).addScaledVector(_d, -_d.y); _n.normalize();
  _m.copy(_a).addScaledVector(_d, x).addScaledVector(_n, h);
  turn(A, _u.subVectors(_b, _a), _v.subVectors(_m, _a));
  B.getWorldPosition(_b); C.getWorldPosition(_c); _t.copy(_a).addScaledVector(_d, d);
  turn(B, _u.subVectors(_c, _b), _v.subVectors(_t, _b));
}

const RIG = new WeakMap();
function rigOf(model) {
  let r = RIG.get(model); if (r) return r;
  const g = n => model.getObjectByName(n), side = s => ({ arm: [g('upperarm' + s), g('lowerarm' + s), g('wrist' + s)], leg: [g('upperleg' + s), g('lowerleg' + s), g('foot' + s)] });
  r = { l: side('l'), r: side('r'), spine: g('spine') };
  r.ok = [...r.l.arm, ...r.l.leg, ...r.r.arm, ...r.r.leg].every(Boolean);
  r.bones = [r.spine, ...r.l.arm, ...r.l.leg, ...r.r.arm, ...r.r.leg].filter(Boolean); r.pre = r.bones.map(b => b.quaternion.clone()); r.post = r.bones.map(() => new THREE.Quaternion(2, 0, 0, 0));
  RIG.set(model, r); return r;
}

// mục tiêu cùng phía (theo x trong ref) với xương gốc → T (thế giới); trả về dấu phía (+1 / -1)
function pick(ref, bone, obj, pts, T) {
  ref.worldToLocal(bone.getWorldPosition(_l)); const sg = _l.x < 0 ? -1 : 1;
  obj.localToWorld(T.copy(pts[0].x * sg >= 0 ? pts[0] : pts[1])); return sg;
}
const T = new THREE.Vector3();

export function ridePose(hero, ref, R) {
  if (!hero || !R) return; const rig = rigOf(hero.model); if (!rig.ok) return;
  // xương không có track animation (mixer không ghi đè) → trả về tư thế trước khi IK, tránh cộng dồn mỗi khung
  const B = rig.bones; for (let i = 0; i < B.length; i++) { const q = B[i].quaternion; if (q.equals(rig.post[i])) q.copy(rig.pre[i]); else rig.pre[i].copy(q); }
  ref.updateMatrixWorld(true); ref.getWorldQuaternion(_rq);
  if (R.lean && rig.spine) {   // nghiêng thân quanh trục ngang của xe
    const s = rig.spine; _u.set(1, 0, 0).applyQuaternion(_rq); _q.setFromAxisAngle(_u, R.lean);
    s.getWorldQuaternion(_bw); s.parent.getWorldQuaternion(_pw); s.quaternion.copy(_pw.invert().multiply(_q.multiply(_bw))); s.updateMatrixWorld(true);
  }
  for (const k of ['l', 'r']) {
    const S = rig[k];
    if (R.foot && R.feet) {
      const sg = pick(ref, S.leg[0], R.foot, R.feet, T); if (R.ankle) T.add(_u.copy(R.ankle).applyQuaternion(_rq));
      solve(S.leg[0], S.leg[1], S.leg[2], T, _pole.set(KNEE.x * sg, KNEE.y, KNEE.z).applyQuaternion(_rq));
    }
    if (R.hand && R.hands) {
      const sg = pick(ref, S.arm[0], R.hand, R.hands, T);
      solve(S.arm[0], S.arm[1], S.arm[2], T, _pole.set(ELBOW.x * sg, ELBOW.y, ELBOW.z).applyQuaternion(_rq));
    }
  }
  for (let i = 0; i < B.length; i++) rig.post[i].copy(B[i].quaternion);
}

// xuống xe: trả xương không có animation về tư thế cũ (vd. thân hết nghiêng)
export function rideReset(hero) {
  const rig = hero && RIG.get(hero.model); if (!rig) return;
  for (let i = 0; i < rig.bones.length; i++) { const q = rig.bones[i].quaternion; if (q.equals(rig.post[i])) q.copy(rig.pre[i]); rig.post[i].set(2, 0, 0, 0); }
}

// nhịp đạp (vòng/giây) khớp tốc độ bánh: vòng đạp = quãng đường / (chu vi bánh × tỉ số líp), tối đa ~1,5 vòng/s
export const CAD_MAX = 1.5;
export function cadence(speed, r, gear) { return Math.min(CAD_MAX, speed / (2 * Math.PI * r * gear)); }
