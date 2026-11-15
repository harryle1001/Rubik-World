// yard-life.js — Học sinh chơi trò dân gian trên bãi cỏ trước cổng trường (ban ngày, trời không mưa):
//   nhảy dây (2 bạn quay dây, 1 bạn nhảy đúng nhịp dây chạm đất) · đá cầu (2 bạn đá qua lại, quả cầu bay đường parabol).
// Dùng nhân vật có sẵn (characters.js: loadHero) — chỉ gọi API, không sửa file nhân vật. Tắt viền để bớt draw call,
// chỉ cập nhật animation khi người chơi ở gần (≤ 55 m). Nhịp quay dây & khoảng cách theo φ.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadHero, STUDENTS, setOutline } from './characters.js';
import { PHI, SPAWN, roadDist, houseAt } from './layout.js';

const NEAR = 55, KID_H = 1.45;
const ROPE_W = 2 * Math.PI / (PHI * 0.55);   // dây quay ~1,1 vòng/giây
const FACT = {
  rope: '🪢 Nhảy dây: chân đạp đất xuống thì đất đẩy ngược ta lên — lực và phản lực (định luật 3 Newton)!',
  cau: '🏸 Quả cầu luôn rơi chúc đế xuống: đế nặng ở dưới, chùm lông nhẹ phía trên cản gió nên cầu rơi chậm và thẳng.',
};

export function createYardLife(ctx, fact) {
  const { scene, terrain } = ctx;
  const groundY = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 5) : -99);
  // chọn chỗ trống trên bãi cỏ cạnh lối vào (tránh đường, nhà, vật cản)
  const free = (x, z) => roadDist(x, z) > 4.5 && !houseAt(x, z, 1) && !ctx.colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 2.4);
  const spot = (dx, dz) => { for (let k = 0; k < 13; k++) { const x = SPAWN[0] + dx - k * 1.3, z = SPAWN[1] + dz * (1 + k * 0.08); if (free(x, z)) return [x, z]; } return [SPAWN[0] + dx, SPAWN[1] + dz]; };
  const R = spot(-13, 8.5), C = spot(-13, -8.5);
  const root = new THREE.Group(); root.name = 'yard-life'; scene.add(root);
  const kids = [];
  const add = (i, x, z, face) => loadHero(STUDENTS[i % STUDENTS.length], KID_H).then(h => {
    if (!h) return; setOutline(h, false); h.model.position.set(x, groundY(x, z), z); h.model.rotation.y = face; h.y0 = h.model.position.y;
    h.model.traverse(o => { if (o.isMesh) o.castShadow = false; }); /* không đổ bóng: bớt 1 lượt vẽ mỗi bạn */ root.add(h.model); h.anim.play(h.set.idle); kids.push(h); return h;
  });
  // ---- nhảy dây: trục dây theo hướng x', 2 bạn quay ở 2 đầu, 1 bạn nhảy ở giữa ----
  const ax = new THREE.Vector3(Math.cos(0.4), 0, Math.sin(0.4)), side = new THREE.Vector3(-ax.z, 0, ax.x), HALF = PHI;   // 2 đầu dây cách nhau 2φ ≈ 3,2 m
  const A = new THREE.Vector3(R[0], 0, R[1]).addScaledVector(ax, -HALF), B = new THREE.Vector3(R[0], 0, R[1]).addScaledVector(ax, HALF);
  const rope = { a: null, b: null, j: null, th: 0, rest: 0, n: 0 };
  const faceTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
  add(1, A.x, A.z, faceTo(A, B)).then(h => rope.a = h); add(4, B.x, B.z, faceTo(B, A)).then(h => rope.b = h);
  add(7, R[0], R[1], Math.atan2(side.x, side.z)).then(h => { rope.j = h; if (h) h.anim.play(h.set.jump); });
  for (const p of [A, B]) ctx.colliders.push({ x: p.x, z: p.z, r: 0.4 }); ctx.colliders.push({ x: R[0], z: R[1], r: 0.4 });
  const NP = 21, rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  const ropeLine = new THREE.Line(rg, new THREE.LineBasicMaterial({ color: '#d9542b' })); ropeLine.frustumCulled = false; root.add(ropeLine);
  // ---- đá cầu: 2 bạn cách nhau 3,4 m (≈ 2φ + 0,2), quả cầu bay qua lại ----
  const cx = new THREE.Vector3(1, 0, 0.3).normalize(), D = new THREE.Vector3(C[0], 0, C[1]).addScaledVector(cx, -1.7), E = new THREE.Vector3(C[0], 0, C[1]).addScaledVector(cx, 1.7);
  const cau = { d: null, e: null, t: 0, dir: 1, hits: 0 };
  add(2, D.x, D.z, faceTo(D, E)).then(h => cau.d = h); add(9, E.x, E.z, faceTo(E, D)).then(h => cau.e = h);
  for (const p of [D, E]) ctx.colliders.push({ x: p.x, z: p.z, r: 0.4 });
  const shuttle = (() => {   // đế tròn đỏ + chùm lông trắng (gộp 1 mesh, màu theo đỉnh)
    const col = (g, c) => { g = g.toNonIndexed(); g.deleteAttribute('uv'); const n = g.attributes.position.count, a = new Float32Array(n * 3), k = new THREE.Color(c); for (let i = 0; i < n; i++) a.set([k.r, k.g, k.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
    const g = mergeGeometries([col(new THREE.ConeGeometry(0.09, 0.16, 6, 1, true).translate(0, 0.1, 0), '#ffffff'), col(new THREE.SphereGeometry(0.045, 6, 4), '#e8392f')]);
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.scale.setScalar(PHI); root.add(m); return m;
  })();
  // reo hò 1 lần rồi quay về động tác cũ
  const cheer = (k, back) => { if (!k || !k.anim.play(k.set.cheer, 0.15, true)) return; k.backT = PHI; k.back = back; };
  const _p = new THREE.Vector3(), _q = new THREE.Vector3();
  let vis = false;
  function update(dt, t, day, W) {
    const p = ctx.player.pos, h = ctx.sky.state.hour, d = Math.min(Math.hypot(R[0] - p.x, R[1] - p.z), Math.hypot(C[0] - p.x, C[1] - p.z));
    const want = day > 0.6 && h > 6.5 && h < 18 && W.r < 0.25 && d < NEAR * 1.6 && (ctx.qualityLevel || 0) < 3;
    if (want !== vis) { vis = want; root.visible = want; }
    if (!vis) return;
    const animate = d < NEAR;
    for (const k of kids) { if (animate) k.anim.update(dt); if (k.backT > 0 && (k.backT -= dt) <= 0) k.anim.play(k.back || k.set.idle, 0.25); }

    // dây: góc th; dây chạm đất khi th = π → bạn ở giữa đang ở đỉnh cú nhảy
    if (rope.rest > 0) rope.rest -= dt;
    else { const prev = rope.th; rope.th = (rope.th + ROPE_W * dt) % (Math.PI * 2); if (rope.th < prev && ++rope.n % 21 === 0 && rope.j) { rope.rest = PHI * 1.5; cheer(rope.j, rope.j.set.jump); } }  // 21 lần nhảy (Fibonacci) → nghỉ, reo hò
    const th = rope.th, lift = rope.rest > 0 ? 0 : 0.34 * Math.pow(Math.max(0, -Math.cos(th)), 0.6);
    if (rope.j) rope.j.model.position.y = rope.j.y0 + lift;
    const hy = (rope.a ? rope.a.y0 : groundY(A.x, A.z)) + 0.82, arr = rg.attributes.position.array;
    for (let i = 0; i < NP; i++) {
      const s = i / (NP - 1), r = Math.sin(Math.PI * s) * 0.78, a = rope.rest > 0 ? Math.PI : th;
      _p.lerpVectors(A, B, s); _p.y = hy; _p.y += Math.cos(a) * r; _p.addScaledVector(side, Math.sin(a) * r);
      arr.set([_p.x, _p.y, _p.z], i * 3);
    }
    rg.attributes.position.needsUpdate = true;

    // đá cầu: bay parabol 1,25 s, đỉnh 2,6 m; tới chân bạn nào thì bạn đó nhún đá lại
    cau.t += dt / 1.25;
    if (cau.t >= 1) { cau.t -= 1; cau.dir *= -1; const k = cau.dir > 0 ? cau.d : cau.e; if (k) k.kick = 0.25; if (++cau.hits % 13 === 0) cheer(cau.dir > 0 ? cau.e : cau.d); }
    const from = cau.dir > 0 ? D : E, to = cau.dir > 0 ? E : D, s = cau.t, gy = (cau.d ? cau.d.y0 : groundY(C[0], C[1]));
    _q.lerpVectors(from, to, s); shuttle.position.set(_q.x, gy + 0.45 + 4 * 2.15 * s * (1 - s), _q.z);
    shuttle.rotation.set(0, 0, 0); shuttle.rotation.x = s < 0.5 ? Math.PI * (0.5 - s) * 0.6 : 0;   // lên thì nghiêng, rơi thì chúc đế xuống
    for (const k of [cau.d, cau.e]) if (k) { if (k.kick > 0) k.kick -= dt; k.model.position.y = k.y0 + Math.max(0, Math.sin(Math.max(0, k.kick) / 0.25 * Math.PI)) * 0.18; }

    if (d < 10) fact(Math.hypot(R[0] - p.x, R[1] - p.z) < Math.hypot(C[0] - p.x, C[1] - p.z) ? 'rope' : 'cau', Math.hypot(R[0] - p.x, R[1] - p.z) < Math.hypot(C[0] - p.x, C[1] - p.z) ? FACT.rope : FACT.cau);
  }
  return { update, root, spots: { rope: R, cau: C }, kids };
}
