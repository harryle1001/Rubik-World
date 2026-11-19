// vrm/vrm-hero.js — Nhân vật VRM dùng chung giao diện với người chibi (characters.js: loadHero):
//   { model, anim{play,has,update,actions,current}, set, height, outlines, head, outlineOn, tris, happyUntil }
// → driveHero/drivePlayer/emote/actorLod/stepAnim/lookAtTarget chạy nguyên như cũ.
// Chế độ cập nhật (LOD): hero.vrmMode = 'full' (SpringBone + biểu cảm) | 'lite' (chỉ xương chính).
// Bí danh xương kiểu KayKit (head, chest, handr, lowerarmr, upperlegl/r) để các phần cũ (đũa, mũ, đạp xe…) dùng tiếp.
import * as THREE from 'three';
import { loadVrm, tint, hideParts, outlineMats, BASES } from './vrm-core.js';
import { vrmClips, kaykitRest } from './vrm-anim.js';
import { dressVrm } from './vrm-outfit.js';

export const NAMES = { idle: 'Idle', walk: 'Walking_A', run: 'Running_A', jump: 'Jump_Idle', cheer: 'Cheer', interact: 'Interact', pickup: 'PickUp', sit: 'Sit_Chair', floor: 'Sit_Floor_Idle', no: 'Head_No', hit: 'Hit_A', use: 'Use_Item' };
export const HAIR = ['#2a2230', '#4a3226', '#7a5236', '#9c4a32', '#d9b46a', '#3a4a78', '#e8a0b8', '#c8ccd8'];
export const EYES = ['#6a4630', '#2a2a36', '#3a78c8', '#3f9a5a', '#8a5ac8', '#d89a3a'];
export const SKINS = ['#ffffff', '#f1dccb', '#d9b496'];   // nhân màu da gốc (sáng · vừa · ngăm)
// Bộ đồ mặc định theo vai: học sinh Học viện (phù thuỷ) · học sinh Trường Rubik (khăn quàng đỏ) · thầy cô
export function outfitFor(look) {
  const L = look || {};
  if (L.role === 'teacher') return { house: 'teacher', robe: L.robe !== false, hood: false, scarf: false, tie: false, hat: !!L.hat, glasses: L.glasses || 'none', wand: !!L.wand };
  if (L.outfit === 'school') return { house: 'school', robe: false, scarf: true, tie: false, hat: false, glasses: L.glasses || 'none', wand: false };
  return { house: L.house || 'long', robe: true, hood: true, scarf: L.scarf !== false, tie: L.tie !== false, hat: !!L.hat, glasses: L.glasses || 'none', wand: !!L.wand };
}

const _q = new THREE.Quaternion(), _qa = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
/**
 * look: { base:'shino'|'shibu'|'hair-m'|'fumiriya', hair, eye, skin(0..2), glasses, hat, house, role, outfit, wand }
 * opt: { set:'full'|'mobile', height }
 */
export async function loadVrmHero(look = {}, opt = {}) {
  const base = BASES[look.base] ? look.base : 'shino', set = opt.set || 'mobile';
  const t0 = performance.now();
  const { vrm, tris: bodyTris, prims } = await loadVrm(base, set);
  const model = new THREE.Group(); model.name = 'vrm-' + base; model.add(vrm.scene);
  tint(vrm, { hair: look.hair, eye: look.eye, skin: SKINS[look.skin | 0] });
  const out = outfitFor(look), fit = dressVrm(vrm, model, out);
  if (out.robe || out.scarf) hideParts(vrm, ['neck']);   // nơ cổ gốc → thay bằng cà vạt / khăn
  // cỡ: chiều cao tự nhiên của mẫu (đỉnh tóc) → height mong muốn
  const nat = Math.max(fit.headTop, 1.2), height = opt.height || nat; model.userData.k = height / nat;
  vrm.scene.scale.setScalar(1); model.scale.setScalar(1);
  const { clips, statics } = await vrmClips(vrm, base + set);
  for (const [b, q] of statics) b.quaternion.copy(q);
  // khung bọc ngoài để code cũ đặt vị trí/xoay/scale (model) mà không đè phép xoay 180° của VRM 0.x
  const outer = new THREE.Group(); outer.name = 'vrm-hero'; outer.add(model); model.scale.setScalar(height / nat);
  outer.updateMatrixWorld(true); if (vrm.springBoneManager) vrm.springBoneManager.setInitState();
  const mixer = new THREE.AnimationMixer(vrm.scene), actions = {}; let cur = null;
  for (const c of clips) actions[c.name] = mixer.clipAction(c);
  for (const [k, v] of Object.entries({ ...NAMES, drive: NAMES.sit })) if (!actions[k] && actions[v]) actions[k] = actions[v];
  // bí danh xương KayKit: hướng như KayKit lúc nghỉ, gắn vào xương thật của VRM
  const S0 = await kaykitRest(), H = vrm.humanoid, alias = {};
  for (const [kay, vb] of [['head', 'head'], ['chest', 'upperChest'], ['handr', 'rightHand'], ['handl', 'leftHand'], ['lowerarmr', 'rightLowerArm'], ['upperlegl', 'leftUpperLeg'], ['upperlegr', 'rightUpperLeg']]) {
    const b = H.getRawBoneNode(vb) || H.getRawBoneNode('chest'); if (!b) continue;
    const o = new THREE.Object3D(); o.name = kay; b.add(o);
    const kw = S0.model.getObjectByName(kay); if (kw) o.quaternion.copy(b.getWorldQuaternion(_q).invert().multiply(kw.getWorldQuaternion(_qa)));
    alias[kay] = o;
  }
  // đạp xe (vehicles.js gọi L.rotateX(a) mỗi khung lên xương đùi KayKit) → xoay xương đùi thật quanh trục X của KayKit;
  // xương thật được chép lại từ xương chuẩn hoá ở mỗi lần cập nhật nên không cộng dồn
  for (const [k, vb] of [['upperlegl', 'leftUpperLeg'], ['upperlegr', 'rightUpperLeg']]) { const o = alias[k], b = H.getRawBoneNode(vb); if (o && b) { const ax = X.clone().applyQuaternion(o.quaternion); o.rotateX = a => { b.rotateOnAxis(ax, a); return o; }; } }
  const exprs = vrm.expressionManager;
  const hero = {
    vrm, model: outer, set: NAMES, height, outlines: [...outlineMats(vrm), ...fit.outlines], head: H.getRawBoneNode('head'), outlineOn: true,
    tris: bodyTris + fit.tris, prims, happyUntil: 0, vrmMode: 'full', look: { ...look, base }, fit, isVrm: true, loadMs: 0,
    setHouse: id => fit.setHouse(id),
    setLook(L) { tint(vrm, { hair: L.hair, eye: L.eye, skin: SKINS[L.skin | 0] }); if (L.house) fit.setHouse(L.house); Object.assign(hero.look, L); },
    dispose() { outer.removeFromParent(); mixer.stopAllAction(); vrm.scene.traverse(o => { if (o.isMesh) { o.geometry.dispose(); } }); for (const me of fit.group) me.geometry.dispose(); },
  };
  // chi tiết nhỏ chỉ cần khi ở gần (LOD 'lite': ẩn ánh mắt, kẻ mắt, đũa → bớt 3 lần vẽ/người)
  const detail = []; vrm.scene.traverse(o => { if (o.isMesh && /EyeHighlight|FaceEyeline/.test([].concat(o.material)[0].name)) detail.push(o); });
  hero.setLod = mode => { if (hero.vrmMode === mode) return; hero.vrmMode = mode; const near = mode === 'full'; for (const o of detail) o.visible = near; if (fit.parts.wand) fit.parts.wand.visible = near && hero.wandOn !== false; };
  hero.setWand = on => { hero.wandOn = !!on; fit.setWand(on && hero.vrmMode === 'full'); };
  let blinkT = 1 + Math.random() * 3, t = 0;
  hero.anim = {
    mixer, actions, has: n => !!actions[n], get current() { return cur; },
    play(n, fade = 0.2, once = false) {
      const a = actions[n]; if (!a || a === cur) return a;
      a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once; a.enabled = true; a.setEffectiveWeight(1);
      if (cur) a.crossFadeFrom(cur, fade, false); a.play(); cur = a; return a;
    },
    update(dt) {
      mixer.update(dt); t += dt;
      if (hero.vrmMode === 'full') {
        if (exprs) {   // chớp mắt 2–5 s/lần · mắt cười khi reo/chào
          const happy = performance.now() < hero.happyUntil; let b = 0;
          if (!happy && t > blinkT) { const k = (t - blinkT) / 0.14; if (k >= 1) { t = 0; blinkT = 2 + Math.random() * 3; } else b = 1 - Math.abs(k * 2 - 1); }
          exprs.setValue('blink', b); exprs.setValue('happy', happy ? 0.8 : 0);
        }
        vrm.update(dt);
      } else { vrm.humanoid.update(); if (exprs && exprs.getValue('blink')) { exprs.setValue('blink', 0); exprs.update(); } }
    },
  };
  hero.anim.play('Idle', 0); hero.anim.update(0);
  hero.loadMs = Math.round(performance.now() - t0);
  return hero;
}
export { BASES };
