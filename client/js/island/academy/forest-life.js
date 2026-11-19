// academy/forest-life.js — SINH VẬT PHÉP THUẬT DỄ THƯƠNG trong Rừng Phép Thuật (cắm vào forest.js qua plug):
//  🦄 Kỳ Lân Con   — hươu Quaternius CC0 (animal-deer, có animation) tô trắng hồng + sừng xoắn gắn xương Head.
//  🦊 Cáo Chín Đuôi — cáo Quaternius CC0 (animal-fox) + 8 đuôi phụ xoè quạt gắn xương Tail1 (1 lưới gộp).
//  🔥 Chim Lửa     — chim nhỏ lông đỏ cam, vệt tàn lửa (Points) — bay vòng trên hồ.
//  🐉 Rồng Con     — con của Rồng Mây Lành (dùng lại đốt thân/đầu ở creatures.js, thu nhỏ 0,45), lượn quanh cổ thụ.
// Lại gần ≤ 6 m: nút "Cho ăn" (mỗi loài một món); cho ăn 3 lần → kết bạn: thẻ bách khoa vào Sổ sinh vật (sinh học thật) + câu đố
// (đúng +13 năng lượng phép); bạn thân đi theo em trong rừng. Lưu tiến độ ở localStorage 'academy.forestFriends'.
// Hiệu năng: ≈ 9 draw call; chỉ cập nhật khi cách hồ < 144 m.
import * as THREE from 'three';
import { loadAnimated, animator } from '../models.js';
import { matV } from '../sample/palette.js';
import { Batch } from './geo.js';
import { dragonSeg, dragonHead } from './creatures.js';
import { FOREST, lakeAt, toWorld, toLocal, forestDist } from './plan.js';
import { glowTex, GATE_PATH } from './forest.js';

const FL = FOREST.lake, PI = Math.PI, NEAR = 6, KEY = 'academy.forestFriends';
const Q = (q, choices, explain) => ({ q, choices, a: 0, explain });   // đáp án đúng đứng đầu (magic.ask tự xáo)
export const CARDS = {
  unicorn: { id: 'forest-unicorn', icon: '🦄', name: 'Kỳ Lân Con', food: '🍎 táo đỏ', short: 'Kỳ Lân Con',
    fact: 'Kỳ lân là con vật tưởng tượng, nhưng họ hàng ngoài đời của nó — <b>ngựa con</b> — đứng dậy và chạy được chỉ khoảng 1 giờ sau khi sinh! Sừng <b>tê giác</b> thật được làm từ <b>keratin</b>, cùng chất với móng tay của em.',
    q: Q('Sừng tê giác được làm từ chất gì?', ['Keratin (giống móng tay)', 'Xương', 'Đá vôi', 'Ngà voi'], 'Sừng tê giác là <b>keratin</b> ép chặt — cùng chất với tóc và móng tay.') },
  fox: { id: 'forest-fox', icon: '🦊', name: 'Cáo Chín Đuôi', food: '🫐 quả mọng', short: 'Cáo Chín Đuôi',
    fact: 'Cáo thật chỉ có <b>một</b> đuôi rậm: khi ngủ, cáo cuộn đuôi che mũi cho ấm; khi chạy, đuôi giúp <b>giữ thăng bằng</b>. Tai cáo thính đến mức nghe được chuột cựa dưới lớp tuyết dày. Cáo thuộc <b>họ Chó</b>.',
    q: Q('Cáo dùng chiếc đuôi rậm để làm gì?', ['Giữ ấm và giữ thăng bằng', 'Để bơi nhanh', 'Để thở', 'Để đào hang'], 'Đuôi cáo vừa là <b>chăn ấm</b> khi ngủ, vừa giúp <b>giữ thăng bằng</b> khi chạy, rẽ gấp.') },
  firebird: { id: 'forest-firebird', icon: '🔥', name: 'Chim Lửa', food: '🌻 hạt hướng dương', short: 'Chim Lửa',
    fact: 'Lông đỏ cam rực của nhiều loài chim có được nhờ sắc tố <b>carotenoid</b> lấy từ thức ăn — chim <b>hồng hạc</b> hồng vì ăn tảo và tôm nhỏ. Chim có <b>xương rỗng</b> nên nhẹ, dễ bay.',
    q: Q('Vì sao chim hồng hạc có lông màu hồng?', ['Vì ăn tảo và tôm nhỏ có sắc tố', 'Vì bị cháy nắng', 'Vì tắm bùn hồng', 'Vì lạnh quá'], 'Sắc tố <b>carotenoid</b> trong tảo, tôm nhỏ nhuộm hồng bộ lông của hồng hạc.') },
  dragon: { id: 'forest-dragon', icon: '🐉', name: 'Rồng Con', food: '💧 giọt sương ngọc', short: 'Rồng Con',
    fact: 'Ngoài đời có "rồng" thật: <b>rồng Komodo</b> (Indonesia) là thằn lằn lớn nhất thế giới, dài tới 3 m. Ở rừng Việt Nam có <b>thằn lằn bay</b> (Draco) — xoè màng da giữa các xương sườn để lượn từ cây này sang cây khác.',
    q: Q('Thằn lằn bay (Draco) lượn được nhờ bộ phận nào?', ['Màng da căng giữa các xương sườn', 'Lông vũ', 'Cánh như chim', 'Đuôi xoay như cánh quạt'], 'Draco xoè <b>màng da</b> giữa các xương sườn kéo dài — như chiếc dù lượn.') },
};
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };

export function createLife(ctx, forest, magic) {
  const { player } = ctx, H = forest.H, st = load(), [lx, lz] = toWorld(FL.u, FL.v);
  let A = null, sinceFeed = 0;
  const o = new THREE.Object3D(), v3 = new THREE.Vector3();
  const ground = (x, z) => { const [u, v] = toLocal(x, z); return H(u, v); };
  const inForest = (x, z) => { const [u, v] = toLocal(x, z); const r = Math.hypot(u - FL.u, v - FL.v); return forestDist(u, v) < -21 && r > FL.ring - 1; };

  // thú có xương (Quaternius): bọc tải + màu + phụ kiện gắn xương
  function walker(name, size, tint, extra) {
    const W = { root: new THREE.Group(), anim: null, ready: false, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), rot: 0, wait: 2, bone: null, acc: null, accSize: 0 };
    loadAnimated(name, true).then(g => {
      if (!g || !A) return; const m = g.scene; W.root.add(m);
      m.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(m), h = box.max.y - box.min.y || 1; m.scale.setScalar(size / h); m.position.y = -box.min.y * size / h;
      m.traverse(q => { if (q.isMesh) { q.castShadow = true; if (tint) { q.material = q.material.clone(); q.material.color.lerp(new THREE.Color(tint[0]), tint[1]); if (tint[2]) { q.material.emissive = new THREE.Color(tint[2]); q.material.emissiveIntensity = tint[3] || 0.12; } } } });
      W.anim = animator(m, g.animations, n => n.split('|').pop()); W.anim.play('Idle', 0);
      if (extra) { const [boneName, geo, accSize, dir] = extra(); m.traverse(q => { if (q.isBone && q.name === boneName && !W.bone) W.bone = q; }); if (W.bone) { W.acc = new THREE.Mesh(geo, matV()); W.acc.castShadow = true; W.bone.add(W.acc); W.accSize = accSize; W.accDir = new THREE.Vector3(...dir).normalize(); } }
      W.ready = true;
    });
    return W;
  }
  function build(F) {
    ctx.dexAdd && ctx.dexAdd(Object.values(CARDS).map(c => ({ id: c.id, name: c.name, icon: c.icon, fact: c.fact })));
    const g = new THREE.Group(); g.name = 'forest-life'; F.group.add(g); A = { g };
    // 🦄 kỳ lân con trên bãi cỏ phía nam hồ
    A.unicorn = walker('animal-deer', 1.3, ['#fff4fb', 0.9, '#ffd9ef', 0.55], () => {
      const b = new Batch(); for (let k = 0; k < 5; k++) b.add(new THREE.CylinderGeometry(0.11 - k * 0.02, 0.13 - k * 0.02, 0.2, 6), k % 2 ? '#ffe08a' : '#ffd1ec', 0, 0.1 + k * 0.18, 0, k * 0.5);
      b.add(new THREE.ConeGeometry(0.04, 0.2, 6), '#fff6d0', 0, 1.0, 0); return ['Head', b.build(), 0.42, [0, 0.85, 0.55]];
    });
    // 🦊 cáo chín đuôi gần đường mòn
    A.fox = walker('animal-fox', 0.8, ['#ffb070', 0.25, '#ff8a3a'], () => {
      const b = new Batch(); for (let k = 0; k < 8; k++) { const a = (k - 3.5) * 0.26; b.add(new THREE.ConeGeometry(0.16, 1.1, 6), k % 2 ? '#e8823a' : '#f29a4a', -Math.sin(a) * 0.55, Math.cos(a) * 0.55, 0, 0, 0, a); b.add(new THREE.ConeGeometry(0.1, 0.3, 6), '#fff6ee', -Math.sin(a) * 1.18, Math.cos(a) * 1.18, 0, 0, 0, a); }
      return ['Tail1', b.build(), 0.55, [0, 0.75, -0.65]];
    });
    for (const [W, at] of [[A.unicorn, lakeAt(0.6, FL.ring + 13)], [A.fox, GATE_PATH[2]]]) { const [x, z] = toWorld(at[0] + 5, at[1]); W.pos.set(x, ground(x, z), z); W.tgt.copy(W.pos); g.add(W.root); }
    // 🔥 chim lửa: thân + 2 cánh (InstancedMesh 2 bản: trái/phải) + tàn lửa
    const bb = new Batch(); bb.add(new THREE.OctahedronGeometry(0.35, 0), '#e8452e', 0, 0, 0, 0, 0, 0, 0.8, 0.8, 1.4); bb.add(new THREE.OctahedronGeometry(0.22, 0), '#f27a2e', 0, 0.18, 0.45);
    bb.add(new THREE.ConeGeometry(0.06, 0.2, 4), '#f2c443', 0, 0.16, 0.72, 0, PI / 2); for (let k = 0; k < 3; k++) bb.add(new THREE.ConeGeometry(0.07, 1.2, 4), k === 1 ? '#f2c443' : '#e8452e', (k - 1) * 0.15, 0, -0.95, 0, -PI / 2 + 0.2, (k - 1) * 0.3);
    bb.add(new THREE.ConeGeometry(0.05, 0.3, 4), '#f2c443', 0, 0.42, 0.4, 0, -0.4);
    const birdM = new THREE.MeshToonMaterial({ vertexColors: true, emissive: new THREE.Color('#ff5a1a'), emissiveIntensity: 0.25 });
    A.bird = new THREE.Mesh(bb.build(), birdM); A.bird.castShadow = true; g.add(A.bird);
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.3, 1.1, 0, -0.1, 0, 0, -0.35], 3)); wg.computeVertexNormals();
    A.wings = new THREE.InstancedMesh(wg, new THREE.MeshBasicMaterial({ color: '#ff9a3a', side: THREE.DoubleSide }), 2); A.wings.frustumCulled = false; g.add(A.wings);
    const NE = 21; A.ember = { p: new Float32Array(NE * 3), life: new Float32Array(NE), k: 0 }; const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(A.ember.p, 3)); A.ember.g = eg;
    A.emberPts = new THREE.Points(eg, new THREE.PointsMaterial({ size: 0.5, map: glowTex, color: '#ffb35a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); A.emberPts.frustumCulled = false; g.add(A.emberPts);
    A.birdPos = new THREE.Vector3(lx, 13, lz); A.birdPerch = 0;
    // 🐉 rồng con: 13 đốt (InstancedMesh) + đầu
    const NS = 13, sc = 0.45; A.dSeg = new THREE.InstancedMesh(dragonSeg(), matV(), NS); A.dSeg.frustumCulled = false; A.dSeg.castShadow = true; g.add(A.dSeg);
    A.dHead = new THREE.Mesh(dragonHead(), matV()); A.dHead.castShadow = true; A.dHead.scale.setScalar(sc * 1.15); g.add(A.dHead); A.dSc = sc;
    const gi = forest.giants.length ? forest.giants : [[lx + 55, 0, lz, 34]]; A.dTree = gi[1 % gi.length];
    A.dragonPos = new THREE.Vector3();
  }
  function unbuild() { if (!A) return; A.g.parent && A.g.parent.remove(A.g); A = null; }

  // ---------- cho ăn / kết bạn ----------
  function feed(key, pos) {
    const C = CARDS[key], n = (st[key] || 0) + 1; st[key] = n; save(st); sinceFeed = 0;
    magic.burst && magic.burst(pos.clone().setY(pos.y + 1), new THREE.Vector3(0, 1, 0), '#ffd1ec', 13, 3, 1);
    ctx.sfx && ctx.sfx('ok');
    if (n < 3) ctx.toast(`${C.icon} <b>${C.name}</b> ăn ngon lành ${C.food}! Tình bạn: ${'💗'.repeat(n)}${'🤍'.repeat(3 - n)}`, 3500);
    else if (n === 3) {
      ctx.discover && ctx.discover({ id: C.id, name: C.name, icon: C.icon, fact: C.fact });
      ctx.toast(`${C.icon} <b>${C.name}</b> đã thành <b>bạn thân</b> của em! Thẻ bách khoa mới trong 📗 Sổ sinh vật.`, 5000);
      ctx.forestEvent && ctx.forestEvent('friend-' + key);
      setTimeout(() => magic.ask && magic.ask(C.q, () => { magic.setMana(magic.mana + 13); ctx.toast(`${C.icon} Đúng rồi! <b>+13 năng lượng phép</b>.`, 3000); }, `${C.icon} Câu đố của ${C.name}`), 1200);
    } else ctx.toast(`${C.icon} <b>${C.name}</b> dụi đầu vào tay em. ${C.fact}`, 6500);
  }
  const friend = k => (st[k] || 0) >= 3;
  function offerNear(key, pos) {
    if (player.vehicle) return; const p = player.pos;
    if (Math.abs(p.x - pos.x) > NEAR || Math.abs(p.z - pos.z) > NEAR || p.distanceTo(pos) > NEAR + 2) return;
    const C = CARDS[key]; ctx.offer(friend(key) ? `${C.icon} Chơi với ${C.name}` : `${C.icon} Cho ${C.name} ăn ${C.food}`, () => feed(key, pos), 7);
  }

  // ---------- di chuyển ----------
  function stepWalker(W, key, dt, home, homeR) {
    if (!W.ready) return; const p = player.pos;
    const fr = friend(key) && inForest(p.x, p.z) && p.distanceTo(W.pos) < 34;
    W.wait -= dt;
    if (fr && p.distanceTo(W.pos) > 4) W.tgt.set(p.x - Math.sin(player.cam.yaw) * 2.5, 0, p.z - Math.cos(player.cam.yaw) * 2.5);
    else if (W.wait < 0 && W.pos.distanceTo(W.tgt) < 0.6) { W.wait = 3 + Math.random() * 5; for (let k = 0; k < 8; k++) { const a = Math.random() * PI * 2, r = Math.random() * homeR, x = home[0] + Math.cos(a) * r, z = home[1] + Math.sin(a) * r; if (inForest(x, z) && ground(x, z) > 1.2) { W.tgt.set(x, 0, z); break; } } }
    const dx = W.tgt.x - W.pos.x, dz = W.tgt.z - W.pos.z, d = Math.hypot(dx, dz), run = fr && d > 8, sp = d > 0.4 && W.wait < 0 || fr && d > 0.4 ? (run ? 3.4 : 1.3) : 0;
    if (sp) { W.pos.x += dx / d * sp * dt; W.pos.z += dz / d * sp * dt; const ty = Math.atan2(dx, dz); W.rot += Math.atan2(Math.sin(ty - W.rot), Math.cos(ty - W.rot)) * Math.min(1, dt * 5); }
    W.pos.y = ground(W.pos.x, W.pos.z); W.root.position.copy(W.pos); W.root.rotation.y = W.rot;
    W.anim.play(sp ? (run ? 'Gallop' : 'Walk') : (W.wait > 2 ? 'Eating' : 'Idle')); W.anim.update(dt);
    if (W.acc && W.accSize) {   // lần đầu: cỡ + hướng phụ kiện theo hệ thế giới (không phụ thuộc trục xương của model)
      W.root.updateMatrixWorld(true); W.bone.getWorldScale(v3); W.acc.scale.setScalar(W.accSize / (v3.x || 1)); W.accSize = 0;
      const qb = W.bone.getWorldQuaternion(new THREE.Quaternion()), want = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), W.accDir.clone().applyQuaternion(W.root.quaternion));
      W.acc.quaternion.copy(qb.invert().multiply(want));
    }
    offerNear(key, W.pos);
  }

  function update(dt, t, F, d) {
    if (!A || d > 55) return;
    const n = ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0; sinceFeed += dt;
    stepWalker(A.unicorn, 'unicorn', dt, toWorld(...lakeAt(0.6, FL.ring + 13)), 21);
    stepWalker(A.fox, 'fox', dt, toWorld(GATE_PATH[2][0] + 5, GATE_PATH[2][1]), 21);
    // chim lửa: bay hình số 8 trên hồ; bạn thân thì bay vòng quanh em
    const p = player.pos, fb = friend('firebird') && inForest(p.x, p.z);
    const a = t * 0.34, tx = fb ? p.x + Math.cos(t * 0.9) * 3.4 : lx + Math.sin(a) * 21, tz = fb ? p.z + Math.sin(t * 0.9) * 3.4 : lz + Math.sin(a * 2) * 13, ty = fb ? p.y + 3 : 8 + Math.sin(t * 0.7) * 2;
    const bp = A.birdPos, ox = bp.x, oz = bp.z; bp.x += (tx - bp.x) * Math.min(1, dt * 1.3); bp.y += (ty - bp.y) * Math.min(1, dt * 1.3); bp.z += (tz - bp.z) * Math.min(1, dt * 1.3);
    const yaw = Math.atan2(bp.x - ox, bp.z - oz); A.bird.position.copy(bp); A.bird.rotation.set(0, yaw, Math.sin(t * 2) * 0.2); A.bird.material.emissiveIntensity = 0.25 + 0.6 * n;
    const flap = Math.sin(t * 11) * 0.7;
    for (const s of [0, 1]) { o.position.copy(bp); o.rotation.set(0, yaw, 0); o.updateMatrix(); const m = o.matrix.clone(); o.position.set(0, 0.05, 0); o.rotation.set(0, 0, s ? PI - flap : flap); o.scale.set(1, 1, 1); o.updateMatrix(); A.wings.setMatrixAt(s, m.multiply(o.matrix)); }
    A.wings.instanceMatrix.needsUpdate = true;
    const E = A.ember; E.life.forEach((l, i) => { E.life[i] = l - dt; if (E.life[i] < 0) { E.life[i] = 0.6 + Math.random() * 0.6; E.p.set([bp.x + (Math.random() - 0.5) * 0.4, bp.y, bp.z + (Math.random() - 0.5) * 0.4], i * 3); } else E.p[i * 3 + 1] -= dt * 0.8; });
    E.g.attributes.position.needsUpdate = true;
    offerNear('firebird', bp);
    // rồng con: lượn xoắn quanh cổ thụ; bạn thân thì lượn quanh em
    const fd = friend('dragon') && inForest(p.x, p.z), T = A.dTree, cx = fd ? p.x : T[0], cz = fd ? p.z : T[2], R = fd ? 5.5 : 8 + T[3] * 0.08, cy = fd ? p.y + 4 : T[1] + T[3] * 0.35;
    const at = (tt, out) => { const da = tt * (fd ? 0.8 : 0.42); return out.set(cx + Math.cos(da) * R, cy + Math.sin(tt * 0.9) * 2.6, cz + Math.sin(da) * R); };
    at(t, A.dragonPos); const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), lag = 1.55 * A.dSc / Math.max(1, R * (fd ? 0.8 : 0.42));
    for (let k = 0; k < 13; k++) {
      at(t - (k + 1) * lag, P0); at(t - k * lag, P1); o.position.copy(P0); o.position.y += Math.sin(t * 3 - k * 0.6) * 0.15; o.lookAt(P1);
      o.scale.setScalar(A.dSc * (1 - k / 13 * 0.55)); o.updateMatrix(); A.dSeg.setMatrixAt(k, o.matrix);
    }
    A.dSeg.instanceMatrix.needsUpdate = true;
    at(t + lag * 0.3, P1); A.dHead.position.copy(A.dragonPos); A.dHead.lookAt(P1);
    offerNear('dragon', A.dragonPos);
  }
  return { build, unbuild, update, feed, get A() { return A; }, friends: st };
}
