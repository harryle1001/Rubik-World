// animals.js — Thú trên đảo (Quaternius, CC0, có animation): hươu, cáo, chó, mèo, ếch, cua. Chim, bướm, cá theo đàn: fauna.js.
// Tự đi lang thang, đứng ăn cỏ, chạy ra xa khi người chơi lại gần. Bấm vào thú để học một điều thú vị.
// Thêm loài: thêm 1 dòng vào SPECIES. Số lượng mỗi loài: n.
import * as THREE from 'three';
import { loadAnimated, animator } from './models.js';
import { addOutline, outlineMat } from './style.js';
import { createFauna } from './fauna.js';
import { T, damp, dampAngle } from './motion.js';
import { TEMPLE_C, ISLAND_R, blocked } from './layout.js';

const clean = n => n.split('|').pop(); // 'AnimalArmature|...|Walk' → 'Walk'
export const SPECIES = [
  { id: 'animal-deer', name: 'Hươu', n: 3, size: 1.5, speed: 1.6, shy: 9, beach: false, walk: 'Walk', run: 'Gallop', idle: ['Idle_2', 'Eating', 'Idle_Headlow'], fact: 'Hươu đực rụng sừng mỗi năm rồi mọc sừng mới.' },
  { id: 'animal-fox', name: 'Cáo', n: 2, size: 0.8, speed: 1.8, shy: 8, beach: false, walk: 'Walk', run: 'Gallop', idle: ['Idle', 'Idle_2', 'Eating'], fact: 'Cáo nghe được tiếng chuột kêu dưới lớp đất dày.' },
  { id: 'animal-shiba', name: 'Chó Shiba', n: 2, size: 0.7, speed: 2.0, shy: 0, beach: false, walk: 'Walk', run: 'Gallop', idle: ['Idle', 'Idle_2'], fact: 'Chó nhận ra chủ nhờ mũi: khứu giác của chó nhạy hơn người hàng nghìn lần.' },
  { id: 'animal-cat', name: 'Mèo', n: 2, size: 0.55, speed: 1.4, shy: 0, beach: false, walk: 'Walk', run: 'Run', idle: ['Idle', 'Idle_Eating'], fact: 'Mèo ngủ khoảng 12–16 tiếng mỗi ngày.' },
  { id: 'animal-frog', name: 'Ếch', n: 3, size: 0.35, speed: 1.2, shy: 3, beach: true, walk: 'Frog_Jump', run: 'Frog_Jump', idle: ['Frog_Idle'], fact: 'Ếch thở được bằng da, và nòng nọc thở bằng mang.' },
  { id: 'animal-crab', name: 'Cua', n: 4, size: 0.45, speed: 0.9, shy: 4, beach: true, walk: 'Walk', run: 'Walk', idle: ['Idle', 'Dance'], fact: 'Cua có bộ xương ở bên ngoài cơ thể, gọi là bộ xương ngoài.' },
];

export function createAnimals(ctx) {
  const { scene, terrain } = ctx; const list = []; const v = new THREE.Vector3();
  const land = beach => { for (let k = 0; k < 60; k++) { const a = Math.random() * 6.283, r = beach ? ISLAND_R * (0.7 + Math.random() * 0.35) : 18 + Math.random() * 55, x = (beach ? 0 : TEMPLE_C[0]) + Math.cos(a) * r, z = (beach ? 0 : TEMPLE_C[1]) + Math.sin(a) * r, h = terrain.heightAt(x, z); if (!blocked(x, z, 1) && (beach ? h > 0.2 && h < 1.4 : h > 1.6 && terrain.slopeAt(x, z) < 0.7)) return [x, z]; } return [TEMPLE_C[0] + 20, TEMPLE_C[1] + 20]; };   // thú rừng quanh đền (khu I), cua/ếch ven biển
  const ok = (a, x, z) => { const h = terrain.heightAt(x, z); return a.beach ? h > 0.15 && h < 2.2 : h > 1.2 && terrain.slopeAt(x, z) < 0.9; };

  for (const S of SPECIES) loadAnimated(S.id).then(g0 => {
    if (!g0) return;
    for (let i = 0; i < S.n; i++) (i === 0 ? Promise.resolve(g0) : loadAnimated(S.id)).then(g => {
      const root = new THREE.Group(), model = g.scene; root.add(model);
      model.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(model); const h = box.max.y - box.min.y || 1; model.scale.setScalar(S.size / h); model.position.y = -box.min.y * S.size / h;
      model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.animal = S; } });
      addOutline(model); const outlines = []; model.traverse(o => { if (o.userData.outline && o.material === outlineMat) outlines.push(o); });
      const [x, z] = land(S.beach); root.position.set(x, terrain.heightAt(x, z), z); scene.add(root);
      const anim = animator(model, g.animations, clean);
      const A = { S, root, anim, target: null, tgt: new THREE.Vector3(), wait: Math.random() * 4, rot: Math.random() * 6.28, fleeing: false, outlines, outlineOn: true, far: 0, tick: i, sp: 0, kr: { v: 0 }, ks: { v: 0 }, idle: S.idle[0] };
      anim.play(S.idle[0], 0); list.push(A);
    });
  });

  // bấm vào thú → hiện điều thú vị
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  ctx.renderer.domElement.addEventListener('pointerup', e => {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, ctx.camera); ray.far = 25;
    const hit = ray.intersectObjects(list.map(a => a.root), true).find(h => h.object.userData.animal);
    if (hit) { const S = hit.object.userData.animal; ctx.toast(`<b>${S.name}</b><br>${S.fact}`, 4500); ctx.sfx && ctx.sfx("ui"); ctx.discover && ctx.discover(S); }
  });

  const fauna = createFauna(ctx); // chim, bướm, cá (InstancedMesh)
  let perfMs = 0, perfN = 0; ctx.perfAnimals = () => perfN ? perfMs / perfN : 0;
  function update(dt) {
    const t0 = performance.now(), p = ctx.player.pos;
    fauna.update(dt, t0 / 1000);
    for (const A of list) { // tránh nhau: đẩy nhẹ hướng đi khỏi con khác quá gần (tính thưa: chỉ con đang đi)
      A.ax = A.az = 0; if (!A.target) continue;
      for (const B of list) { if (B === A) continue; const ex = A.root.position.x - B.root.position.x, ez = A.root.position.z - B.root.position.z, d2 = ex * ex + ez * ez, R = (A.S.size + B.S.size) * 0.8; if (d2 < R * R && d2 > 1e-6) { const k = (R - Math.sqrt(d2)) / R; A.ax += ex * k; A.az += ez * k; } }
    }
    for (const A of list) {
      const d = A.root.position.distanceTo(p);
      if (d > 70) { A.root.visible = false; continue; } A.root.visible = true; // ở xa: không cập nhật (LOD)
      const on = d < 18; if (A.outlineOn !== on) { A.outlineOn = on; for (const o of A.outlines) o.visible = on; } // viền chỉ cho thú gần
      // để ý người chơi: đứng lại, quay nhìn khi người chơi tới gần (trước khi bỏ chạy)
      if (!A.target && !A.fleeing && d < (A.S.shy || 4) * 1.8) A.rot = dampAngle(A.rot, Math.atan2(p.x - A.root.position.x, p.z - A.root.position.z), A.kr, T.slow, dt, 3);
      if (A.S.shy && d < A.S.shy && !A.fleeing) { // chạy ra xa người chơi
        v.subVectors(A.root.position, p).setY(0).normalize().multiplyScalar(10).add(A.root.position);
        if (ok(A.S, v.x, v.z)) { A.target = A.tgt.copy(v); A.fleeing = true; A.wait = 0; }
      }
      if (!A.target) {
        if ((A.wait -= dt) <= 0) {
          const a = Math.random() * 6.283, r = 4 + Math.random() * 8, tx = A.root.position.x + Math.cos(a) * r, tz = A.root.position.z + Math.sin(a) * r;
          if (ok(A.S, tx, tz)) A.target = A.tgt.set(tx, 0, tz); else A.wait = 0.5;
        }
        A.sp = damp(A.sp, 0, A.ks, T.soft, dt); // dừng có quán tính: trôi nốt vài bước rồi đứng
        if (A.sp > 0.05) { A.root.position.x += Math.sin(A.rot) * A.sp * dt; A.root.position.z += Math.cos(A.rot) * A.sp * dt; const act = A.anim.play(A.S.walk, 0.3); if (act) act.timeScale = Math.max(0.4, A.sp / A.S.speed); }
        else A.anim.play(A.idle, 0.4); // dáng đứng chọn 1 lần mỗi lần dừng (trước đây đổi liên tục mỗi khung hình)
      } else {
        const dx = A.target.x - A.root.position.x, dz = A.target.z - A.root.position.z, L = Math.hypot(dx, dz);
        // lái mượt: quay đầu bằng lò xo (giới hạn tốc độ quay) → đi theo đường cong; chậm lại khi phải rẽ gắt hoặc sắp tới nơi
        const want = Math.atan2(dx + A.ax * 2, dz + A.az * 2), dr = Math.atan2(Math.sin(want - A.rot), Math.cos(want - A.rot));
        A.rot = dampAngle(A.rot, want, A.kr, A.fleeing ? T.quick : T.soft, dt, A.fleeing ? 6 : 3);
        const base = A.S.speed * (A.fleeing ? 2.6 : 1), spT = base * Math.max(0.2, Math.cos(dr)) * Math.min(1, 0.3 + L / 2);
        A.sp = damp(A.sp, spT, A.ks, T.slow, dt); const sp = A.sp; // tăng/giảm tốc mượt
        A.root.position.x += Math.sin(A.rot) * sp * dt; A.root.position.z += Math.cos(A.rot) * sp * dt; // tới nơi vẫn trôi tiếp (không khựng 1 khung)
        if (L < 0.4) { A.target = null; A.fleeing = false; A.wait = 2 + Math.random() * 6; A.idle = A.S.idle[(Math.random() * A.S.idle.length) | 0]; }
        else {
          const act = A.anim.play(A.fleeing ? A.S.run : A.S.walk, 0.3); if (act) act.timeScale = Math.max(0.4, Math.min(1.8, sp / base)); // chân khớp tốc độ
        }
      }
      A.root.position.y = terrain.heightAt(A.root.position.x, A.root.position.z); A.root.rotation.y = A.rot;
      if (d < 35) { A.anim.update(dt + A.far); A.far = 0; } else { A.far += dt; if (++A.tick % 3 === 0) { A.anim.update(A.far); A.far = 0; } } // xa: 1/3 khung hình
    }
    perfMs += performance.now() - t0; perfN++; if (perfN > 600) { perfMs /= 2; perfN /= 2; }
  }
  return { update, list, get flocks() { return fauna.markers(); } };
}
