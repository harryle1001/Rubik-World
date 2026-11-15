// animals.js — Thú trên đảo (Quaternius, CC0, có animation): hươu, cáo, chó, mèo, ếch, cua.
// Tự đi lang thang, đứng ăn cỏ, chạy ra xa khi người chơi lại gần. Bấm vào thú để học một điều thú vị.
// Thêm loài: thêm 1 dòng vào SPECIES. Số lượng mỗi loài: n.
import * as THREE from 'three';
import { loadAnimated, animator } from './models.js';
import { addOutline } from './style.js';

const clean = n => n.split('|').pop(); // 'AnimalArmature|...|Walk' → 'Walk'
const SPECIES = [
  { id: 'animal-deer', name: 'Hươu', n: 3, size: 1.5, speed: 1.6, shy: 9, beach: false, walk: 'Walk', run: 'Gallop', idle: ['Idle_2', 'Eating', 'Idle_Headlow'], fact: 'Hươu đực rụng sừng mỗi năm rồi mọc sừng mới.' },
  { id: 'animal-fox', name: 'Cáo', n: 2, size: 0.8, speed: 1.8, shy: 8, beach: false, walk: 'Walk', run: 'Gallop', idle: ['Idle', 'Idle_2', 'Eating'], fact: 'Cáo nghe được tiếng chuột kêu dưới lớp đất dày.' },
  { id: 'animal-shiba', name: 'Chó Shiba', n: 2, size: 0.7, speed: 2.0, shy: 0, beach: false, walk: 'Walk', run: 'Gallop', idle: ['Idle', 'Idle_2'], fact: 'Chó nhận ra chủ nhờ mũi: khứu giác của chó nhạy hơn người hàng nghìn lần.' },
  { id: 'animal-cat', name: 'Mèo', n: 2, size: 0.55, speed: 1.4, shy: 0, beach: false, walk: 'Walk', run: 'Run', idle: ['Idle', 'Idle_Eating'], fact: 'Mèo ngủ khoảng 12–16 tiếng mỗi ngày.' },
  { id: 'animal-frog', name: 'Ếch', n: 3, size: 0.35, speed: 1.2, shy: 3, beach: true, walk: 'Frog_Jump', run: 'Frog_Jump', idle: ['Frog_Idle'], fact: 'Ếch thở được bằng da, và nòng nọc thở bằng mang.' },
  { id: 'animal-crab', name: 'Cua', n: 4, size: 0.45, speed: 0.9, shy: 4, beach: true, walk: 'Walk', run: 'Walk', idle: ['Idle', 'Dance'], fact: 'Cua có bộ xương ở bên ngoài cơ thể, gọi là bộ xương ngoài.' },
];

export function createAnimals(ctx) {
  const { scene, terrain } = ctx; const list = []; const v = new THREE.Vector3();
  const land = beach => { for (let k = 0; k < 60; k++) { const a = Math.random() * 6.283, r = beach ? 45 + Math.random() * 30 : 12 + Math.random() * 50, x = Math.cos(a) * r, z = Math.sin(a) * r, h = terrain.heightAt(x, z); if (beach ? h > 0.2 && h < 1.4 : h > 1.6 && terrain.slopeAt(x, z) < 0.7) return [x, z]; } return [0, 12]; };
  const ok = (a, x, z) => { const h = terrain.heightAt(x, z); return a.beach ? h > 0.15 && h < 2.2 : h > 1.2 && terrain.slopeAt(x, z) < 0.9; };

  for (const S of SPECIES) loadAnimated(S.id).then(g0 => {
    if (!g0) return;
    for (let i = 0; i < S.n; i++) (i === 0 ? Promise.resolve(g0) : loadAnimated(S.id)).then(g => {
      const root = new THREE.Group(), model = g.scene; root.add(model);
      model.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(model); const h = box.max.y - box.min.y || 1; model.scale.setScalar(S.size / h); model.position.y = -box.min.y * S.size / h;
      model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.animal = S; } });
      addOutline(model);
      const [x, z] = land(S.beach); root.position.set(x, terrain.heightAt(x, z), z); scene.add(root);
      const anim = animator(model, g.animations, clean);
      const A = { S, root, anim, target: null, wait: Math.random() * 4, rot: Math.random() * 6.28, fleeing: false };
      anim.play(S.idle[0], 0); list.push(A);
    });
  });

  // bấm vào thú → hiện điều thú vị
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  ctx.renderer.domElement.addEventListener('pointerup', e => {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, ctx.camera); ray.far = 25;
    const hit = ray.intersectObjects(list.map(a => a.root), true).find(h => h.object.userData.animal);
    if (hit) { const S = hit.object.userData.animal; ctx.toast(`<b>${S.name}</b><br>${S.fact}`, 4500); ctx.sfx && ctx.sfx('ui'); }
  });

  function update(dt) {
    const p = ctx.player.pos;
    for (const A of list) {
      if (A.ridden) continue; // đang được cưỡi (mounts.js điều khiển)
      const d = A.root.position.distanceTo(p);
      if (d > 70) { A.root.visible = false; continue; } A.root.visible = true; // ở xa: không cập nhật (LOD)
      if (A.S.shy && d < A.S.shy && ctx.player.speed > 3 && !A.fleeing) { // đi chậm lại gần thì thú không sợ (để cưỡi) // chạy ra xa người chơi
        v.subVectors(A.root.position, p).setY(0).normalize().multiplyScalar(10).add(A.root.position);
        if (ok(A.S, v.x, v.z)) { A.target = v.clone(); A.fleeing = true; A.wait = 0; }
      }
      if (!A.target) {
        if ((A.wait -= dt) <= 0) {
          const a = Math.random() * 6.283, r = 4 + Math.random() * 8, tx = A.root.position.x + Math.cos(a) * r, tz = A.root.position.z + Math.sin(a) * r;
          if (ok(A.S, tx, tz)) A.target = new THREE.Vector3(tx, 0, tz); else A.wait = 0.5;
        }
        A.anim.play(A.S.idle[Math.floor((A.wait * 7) % A.S.idle.length)] || A.S.idle[0], 0.4);
      } else {
        const dx = A.target.x - A.root.position.x, dz = A.target.z - A.root.position.z, L = Math.hypot(dx, dz);
        const sp = A.S.speed * (A.fleeing ? 2.6 : 1);
        if (L < 0.4) { A.target = null; A.fleeing = false; A.wait = 2 + Math.random() * 6; }
        else {
          const want = Math.atan2(dx, dz); let dr = want - A.rot; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); A.rot += dr * Math.min(1, dt * 5);
          const step = Math.min(L, sp * dt); A.root.position.x += Math.sin(A.rot) * step; A.root.position.z += Math.cos(A.rot) * step;
          A.anim.play(A.fleeing ? A.S.run : A.S.walk, 0.25);
        }
      }
      A.root.position.y = terrain.heightAt(A.root.position.x, A.root.position.z); A.root.rotation.y = A.rot;
      A.anim.update(dt);
    }
  }
  return { update, list };
}
