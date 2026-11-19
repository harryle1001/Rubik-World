// academy/practice.js — LỚP THỰC HÀNH PHÉP NGOÀI TRỜI (Sân Bắc, nửa tây) + đồ phù thủy cho NPC.
//  🪶 Lớp Bay Lơ Lửng: cô giáo + 5 học sinh vẫy đũa, sách/lông vũ bay lên hạ xuống trước mặt, tia sáng từ đũa (InstancedMesh).
//  🧪 Lớp Pha Chế: thầy giáo + 4 học sinh khuấy 4 vạc sủi bọt đổi màu, bong bóng bay lên (InstancedMesh).
//  Tham gia: đứng gần → câu hỏi Khoa học / Toán → vật của em bay lên / vạc đổi màu + giải thích khoa học; thưởng điểm nhà.
//  Điện thoại: mỗi lớp 3 học sinh. Đồ phù thủy: mũ + áo choàng model CC0 (KayKit, alley/wiz-*.glb) gắn xương như wear.js.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV, mat } from '../sample/palette.js';
import { loadHero, STUDENTS } from '../characters.js';
import { loadModel } from '../models.js';
import { CFG } from '../config.js';

const PI = Math.PI, HOUSE_COL = ['#c8302c', '#3a6fc4', '#3f8a4c', '#7a4fb0'];
const MOUNT = { hat: ['head', 'alley/wiz-hat', [0, 0.2, -0.01], 0.42, [-0.12, 0, 0]], cape: ['chest', 'alley/wiz-cape', [0, 0.32, -0.3], [0.62, 0.46, 0.5], [0.1, 0, 0]] };
/** Gắn mũ (và áo choàng nếu capeCol) lên NPC loadHero */
export async function dressWizard(hero, hatCol, capeCol) {
  for (const [slot, col] of [['hat', hatCol], ['cape', capeCol]]) {
    if (!col) continue; const [bn, file, p, s, r] = MOUNT[slot], bone = hero.model.getObjectByName(bn), src = await loadModel(file); if (!bone || !src) continue;
    const g = new THREE.Group(); g.add(src); g.position.fromArray(p); g.rotation.set(...r); Array.isArray(s) ? g.scale.fromArray(s) : g.scale.setScalar(s);
    src.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set(col); } }); bone.add(g);
  }
}

export function createPractice(ctx, magic, { Y, toWorld, toLocal }) {
  const MOB = CFG.isMobile, NS = MOB ? 3 : 5, NB = MOB ? 3 : 4;
  const A = { u: -134, v: -28, name: 'Lớp Bay Lơ Lửng' }, Bc = { u: -152, v: -28, name: 'Lớp Pha Chế ngoài trời' };
  let G = null, npcs = [], books = null, sparks = null, bubbles = null, brew = null, mine = 0, brewHue = 0;
  const W = (u, v) => toWorld(u, v);
  function npc(kind, h, look, u, v, face, hat, cape, clip) {
    const n = { u, v, face, hero: null, clip }; npcs.push(n);
    loadHero(kind, h, look).then(hero => { if (!hero || !G) return; n.hero = hero; hero.npc = true; const [x, z] = W(u, v); hero.model.position.set(x, Y, z); hero.model.rotation.y = face; G.add(hero.model); hero.anim.play(hero.set[clip] || hero.set.idle, 0); dressWizard(hero, hat, cape); });
  }
  function build() {
    if (G) return; G = new THREE.Group(); G.name = 'academy-practice';
    const b = new Batch(), gl = new Batch();
    // A: vòng tập (thảm đá) + cô giáo + học sinh hình cung
    { const [x, z] = W(A.u, A.v); b.add(new THREE.CircleGeometry(5.5, 21).rotateX(-PI / 2), '#9a8f80', x, Y + 0.06, z); gl.add(new THREE.RingGeometry(5.2, 5.5, 34).rotateX(-PI / 2), '#9fe6ff', x, Y + 0.08, z); }
    npc('student-female-b', 1.68, { role: 'teacher', shirt: '#3a3f6b', pants: '#2a2433', skirt: true }, A.u - 4.2, A.v, 0, '#3a3f6b', '#3a3f6b', 'interact');   // cô giáo nhìn về +u
    for (let i = 0; i < NS; i++) { const a = (i / (NS - 1) - 0.5) * 1.6, u = A.u + Math.cos(a) * 2.6, v = A.v + Math.sin(a) * 3.4; npc(STUDENTS[(i * 3 + 1) % STUDENTS.length], 1.36, null, u, v, PI, HOUSE_COL[i % 4], HOUSE_COL[i % 4], i % 2 ? 'use' : 'interact'); }
    books = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.07, 0.46), new THREE.MeshToonMaterial({ color: '#ffffff' }), NS + 1); const bc = new THREE.Color();
    for (let i = 0; i <= NS; i++) books.setColorAt(i, bc.set(['#c84a3a', '#3a6fc4', '#e0b040', '#3f8a4c', '#8a4fb0', '#ffffff'][i % 6])); books.frustumCulled = false; G.add(books);
    sparks = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.05), mat('lampGlow'), NS * 5); sparks.frustumCulled = false; G.add(sparks);
    // B: 4 vạc (thân sắt + mặt thuốc phát sáng) + thầy giáo
    for (let i = 0; i < NB; i++) { const v = Bc.v - 6 + i * 4, [x, z] = W(Bc.u, v); b.cyl(x, Y, z, 0.55, 0.25, '#2a2a30', 8); b.add(new THREE.CylinderGeometry(0.75, 0.55, 0.9, 10), '#34343c', x, Y + 0.7, z); b.add(new THREE.ConeGeometry(0.32, 0.3, 6), '#ff8a3a', x, Y + 0.15, z); }
    brew = new THREE.InstancedMesh(new THREE.CircleGeometry(0.62, 12).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), NB); brew.frustumCulled = false; G.add(brew);
    { const o = new THREE.Object3D(); for (let i = 0; i < NB; i++) { const [x, z] = W(Bc.u, Bc.v - 6 + i * 4); o.position.set(x, Y + 1.12, z); o.updateMatrix(); brew.setMatrixAt(i, o.matrix); } }
    bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: '#d8ffe8', transparent: true, opacity: 0.7, toneMapped: false }), NB * 6); bubbles.frustumCulled = false; G.add(bubbles);
    npc('student-male-a', 1.72, { role: 'teacher', old: true, shirt: '#2f5a4a', pants: '#2a2a30', glasses: true }, Bc.u + 3.4, Bc.v, PI, '#2f5a4a', '#2f5a4a', 'interact');
    for (let i = 0; i < NB; i++) npc(STUDENTS[(i * 5 + 2) % STUDENTS.length], 1.36, null, Bc.u - 1.3, Bc.v - 6 + i * 4, 0, HOUSE_COL[(i + 1) % 4], HOUSE_COL[(i + 1) % 4], 'use');
    // biển lớp (2 bảng gỗ nhỏ)
    for (const C of [A, Bc]) { const [x, z] = W(C.u + 6.5, C.v + 4.5); b.cyl(x, Y, z, 0.08, 2.2, '#6e4a30', 5); b.box(x - 0.9, x + 0.9, Y + 1.6, Y + 2.3, z - 0.05, z + 0.05, '#4a3020'); }
    const m = new THREE.Mesh(b.build(), matV()); m.castShadow = true; m.matrixAutoUpdate = false; G.add(m);
    G.add(new THREE.Mesh(gl.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
    ctx.scene.add(G);
    for (const n of npcs) { const [x, z] = W(n.u, n.v); ctx.colliders.push({ x, z, r: 0.35, practice: 1 }); }
  }
  function unbuild() { if (!G) return; ctx.scene.remove(G); G = null; npcs = []; for (let i = ctx.colliders.length - 1; i >= 0; i--) if (ctx.colliders[i].practice) ctx.colliders.splice(i, 1); }
  const o = new THREE.Object3D(), col = new THREE.Color();
  function update(dt, t) {
    if (!G) return; const cam = ctx.camera.position, [cu, cv] = toLocal(cam.x, cam.z), near = Math.hypot(cu - A.u, cv - A.v) < 144 && cam.y < 600; G.visible = near; if (!near) return;
    const live = Math.hypot(cu - A.u, cv - A.v) < 55;
    for (const n of npcs) if (n.hero && live) n.hero.anim.update(dt);
    if (!live) return;
    // sách bay: học sinh i (vật thứ NS = của người chơi khi tham gia)
    for (let i = 0; i <= NS; i++) {
      const a = (i / Math.max(1, NS - 1) - 0.5) * 1.6, u = i < NS ? A.u + Math.cos(a) * 1.3 : A.u, v = i < NS ? A.v + Math.sin(a) * 1.8 : A.v;
      const lift = i < NS ? 1.4 + (Math.sin(t * 1.1 + i * 1.7) * 0.5 + 0.5) * 1.6 : 1 + Math.min(1, mine) * 2.6, [x, z] = W(u, v);
      o.position.set(x, Y + lift, z); o.rotation.set(Math.sin(t * 2 + i) * 0.3, t * 0.8 + i, Math.cos(t * 1.7 + i) * 0.3); o.scale.setScalar(i < NS || mine > 0 ? 1 : 0.001); o.updateMatrix(); books.setMatrixAt(i, o.matrix);
      if (i < NS) for (let k = 0; k < 5; k++) { const f = (t * 1.3 + k / 5 + i * 0.13) % 1, su = A.u + Math.cos(a) * 2.6, sv = A.v + Math.sin(a) * 3.4, [sx, sz] = W(su + (u - su) * f, sv + (v - sv) * f);
        o.position.set(sx, Y + 1.15 + (lift - 1.15) * f + Math.sin(f * PI) * 0.4, sz); o.rotation.set(0, 0, 0); o.scale.setScalar(1 - f * 0.6); o.updateMatrix(); sparks.setMatrixAt(i * 5 + k, o.matrix); }
    }
    books.instanceMatrix.needsUpdate = sparks.instanceMatrix.needsUpdate = true; mine = Math.max(0, mine - dt * 0.05);
    // vạc: màu đổi chậm, bong bóng
    for (let i = 0; i < NB; i++) { brew.setColorAt(i, col.setHSL((t * 0.05 + i * 0.25 + brewHue) % 1, 0.8, 0.6)); const [x, z] = W(Bc.u, Bc.v - 6 + i * 4);
      for (let k = 0; k < 6; k++) { const f = (t * 0.7 + k / 6 + i * 0.3) % 1; o.position.set(x + Math.sin(k * 2.3 + t) * 0.35, Y + 1.15 + f * 1.6, z + Math.cos(k * 1.9 + t) * 0.35); o.rotation.set(0, 0, 0); o.scale.setScalar(0.6 + f); o.updateMatrix(); bubbles.setMatrixAt(i * 6 + k, o.matrix); } }
    brew.instanceColor.needsUpdate = bubbles.instanceMatrix.needsUpdate = true;
    // tham gia
    const p = ctx.player.pos, [u, v] = toLocal(p.x, p.z); if (Math.abs(p.y - Y) > 2 || ctx.player.vehicle) return;
    if (Math.hypot(u - A.u, v - A.v) < 5.5) ctx.offer('🪶 Tập phép Bay Lơ Lửng', () => magic.ask('khoahoc', () => { mine = 1; ctx.sfx && ctx.sfx('magic'); ctx.houses && ctx.houses.addPoints(3, A.name); ctx.toast('🪶 Cuốn sách của em <b>bay lên</b>! 🔬 Ngoài đời, vật rơi xuống vì <b>trọng lực</b> (Trái Đất hút). Muốn nâng lên phải có <b>lực nâng</b> lớn hơn — như cánh máy bay, khinh khí cầu. +3 điểm nhà', 7000); }, '🪶 Cô giáo hỏi trước khi cho em tập'), 8);
    else if (Math.hypot(u - Bc.u, v - Bc.v) < 6) ctx.offer('🧪 Pha thuốc đổi màu', () => magic.ask('toan', () => { brewHue += 0.37; ctx.sfx && ctx.sfx('magic'); ctx.houses && ctx.houses.addPoints(3, Bc.name); ctx.toast('🧪 Vạc thuốc <b>đổi màu</b> lấp lánh! 🔬 Nước bắp cải tím cũng đổi màu: gặp <b>chanh (axit)</b> thành hồng, gặp <b>xà phòng (bazơ)</b> thành xanh. +3 điểm nhà', 7000); }, '🧪 Thầy hỏi: đong đúng mới pha được'), 8);
  }
  return { build, unbuild, update };
}
