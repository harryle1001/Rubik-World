// train/interior.js — VẼ NỘI THẤT TOA theo mức chi tiết: chỉ toa có camera ± 1 toa (camera ngoài tàu: không vẽ — kính sáng che).
// - Khối gộp mỗi kiểu toa: 1 InstancedMesh / kiểu (4 kiểu → ≤ 4 draw call); model CC0: 1 InstancedMesh / model, chỉ ghi ma trận toa đang hiện.
// - Cửa kéo khoang tự mở khi có người tới gần (≤ 1,6 m). Kính cửa sổ sáng của các toa đang vẽ nội thất bị ẩn (nhìn xuyên ra ngoài).
// - Học sinh NPC ngồi sẵn ~1/φ³ số ghế (cố định theo chỉ số ghế) — dùng chung 21 nhân vật (Fibonacci), gắn vào toa đang hiện, không viền.
// - Buồng lái: bác lái tàu + chú đốt lò (chỉ hiện khi camera trong vòng 34 m).
import * as THREE from 'three';
import { matV } from '../sample/palette.js';
import { loadModel } from '../models.js';
import { loadHero, setOutline, STUDENTS } from '../characters.js';
import { FLOOR, HW, ROOF, CL } from './consist.js';
import { layout, doorGeo, CAB } from './coaches.js';

const POOL = 21, NPC_RATE = { compart: 6, open: 9, dining: 5, obs: 2 };   // số ghế có NPC mỗi kiểu toa
const BAGS = ['#ff8a2b', '#2b6cb0', '#ffd23f', '#e0564a', '#7fd1ff', '#b06bff', '#ff5a8a', '#2c6455'];
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

export function createInterior(ctx, consist) {
  const { camera } = ctx, cars = consist.cars, coaches = consist.coaches, group = consist.group, mv = matV();
  // ---------- ghế: id = chỉ số toa × 64 + chỉ số ghế ----------
  const seats = [];
  coaches.forEach((c, ci) => { c.L = layout(c.type); c.L.seats.forEach((s, k) => seats.push({ ...s, id: cars.indexOf(c) * 64 + k, car: cars.indexOf(c), ci, k, npc: false })); });
  const byId = new Map(seats.map(s => [s.id, s]));
  // NPC: rải đều, bỏ ghế cạnh cửa sổ đầu tiên mỗi khoang (luôn còn chỗ trống cho người chơi)
  coaches.forEach((c, ci) => { const list = seats.filter(s => s.ci === ci), n = NPC_RATE[c.type]; for (let j = 0; j < n; j++) list[Math.floor(((j + 0.5) / n) * list.length * 0.999 + ci * 3) % list.length].npc = true; });
  const npcSeats = seats.filter(s => s.npc);
  npcSeats.forEach((s, i) => { s.look = STUDENTS[(i * 5 + s.ci) % STUDENTS.length]; s.bag = BAGS[(i * 3 + s.k) % BAGS.length]; });

  // ---------- khối gộp theo kiểu toa ----------
  const types = [...new Set(coaches.map(c => c.type))], typeI = {};
  for (const t of types) { const n = coaches.filter(c => c.type === t).length, im = new THREE.InstancedMesh(layout(t).geo, mv, n); im.frustumCulled = false; im.count = 0; im.receiveShadow = false; group.add(im); typeI[t] = im; }   // không nhận bóng mái (trong toa sáng đèn)
  // ---------- model CC0 (instancing, nạp bất đồng bộ) ----------
  const kitRows = new Map(); const _o = new THREE.Object3D();
  coaches.forEach((c, ci) => { for (const [n, x, y, z, s, ry] of c.L.kit) { if (!kitRows.has(n)) kitRows.set(n, []); _o.position.set(x, y, z); _o.rotation.set(0, ry, 0); _o.scale.setScalar(s); _o.updateMatrix(); kitRows.get(n).push({ ci, m: _o.matrix.clone() }); } });
  const kitI = [];
  for (const [n, rows] of kitRows) loadModel('kit/' + n).then(src => {
    if (!src) return; src.updateMatrixWorld(true);
    src.traverse(m => { if (!m.isMesh) return; const im = new THREE.InstancedMesh(m.geometry, m.material, rows.length); im.frustumCulled = false; im.count = 0; im.castShadow = false; im.receiveShadow = false; group.add(im); kitI.push({ im, rows, part: m.matrixWorld.clone() }); dirty = true; });
  });
  // ---------- cửa kéo khoang ----------
  const doors = []; coaches.forEach((c, ci) => c.L.doors.forEach(d => doors.push({ ...d, ci, k: 0 })));
  const doorI = new THREE.InstancedMesh(doorGeo(), mv, Math.max(1, doors.length)); doorI.frustumCulled = false; doorI.count = 0; group.add(doorI);

  // ---------- toa có camera ----------
  const inv = new THREE.Matrix4(), v = new THREE.Vector3();
  const localOf = (o, p, out) => out.copy(p).applyMatrix4(inv.copy(o.matrixWorld).invert());
  function cameraCar() {   // chỉ số trong coaches (−1: ngoài tàu); 'cab' khi trong buồng lái
    for (let i = 0; i < coaches.length; i++) { localOf(coaches[i].o, camera.position, v); if (Math.abs(v.x) < HW + 0.05 && Math.abs(v.z) < CL / 2 + 0.45 && v.y > FLOOR - 0.2 && v.y < ROOF + 0.6) return i; }
    localOf(cars[0].o, camera.position, v); if (v.x > -1.4 && v.x < 1.4 && v.z > -5.4 && v.z < -1.5 && v.y > 0.9 && v.y < 3.8) return 'cab';
    return -1;
  }
  let vis = [], visKey = '', dirty = true;
  const M = new THREE.Matrix4(), M2 = new THREE.Matrix4();
  function writeMatrices() {
    for (const t of types) { const im = typeI[t]; let n = 0; for (const ci of vis) if (coaches[ci].type === t) im.setMatrixAt(n++, coaches[ci].o.matrixWorld); im.count = n; im.instanceMatrix.needsUpdate = true; }
    for (const { im, rows, part } of kitI) { let n = 0; for (const r of rows) if (vis.includes(r.ci)) im.setMatrixAt(n++, M.multiplyMatrices(coaches[r.ci].o.matrixWorld, r.m).multiply(part)); im.count = n; im.instanceMatrix.needsUpdate = true; }
    let n = 0; for (const d of doors) if (vis.includes(d.ci)) { M2.makeTranslation(d.x, FLOOR, d.z + d.k * d.open); doorI.setMatrixAt(n++, M.multiplyMatrices(coaches[d.ci].o.matrixWorld, M2)); } doorI.count = n; doorI.instanceMatrix.needsUpdate = true;
  }

  // ---------- học sinh NPC (pool) ----------
  const pool = []; let loading = false;
  function loadPool() {
    if (loading) return; loading = true; let i = 0;
    const next = () => { if (i >= POOL) return; const k = i++; loadHero(STUDENTS[(k * 7) % STUDENTS.length], 1.5, { role: 'student', bag: BAGS[k % BAGS.length] }).then(h => { if (h) { setOutline(h, false); h.model.visible = false; h.anim.play('sit', 0); h.anim.update(0.01); pool.push({ h, seat: null }); } setTimeout(next, 34); }); };
    next();
  }
  function assignNpc() {
    const want = npcSeats.filter(s => vis.includes(s.ci)).sort((a, b) => vis.indexOf(a.ci) - vis.indexOf(b.ci)).slice(0, pool.length);
    for (const p of pool) if (p.seat && !want.includes(p.seat)) { p.seat = null; p.h.model.visible = false; }
    for (const s of want) {
      if (pool.some(p => p.seat === s)) continue;
      const p = pool.find(p => !p.seat); if (!p) break;
      p.seat = s; const o = cars[s.car].o; o.add(p.h.model); p.h.model.visible = true;
      p.h.model.position.set(s.x - Math.sin(s.ry) * 0.0, FLOOR + 0.02 + (s.y || 0), s.z); p.h.model.rotation.set(0, s.ry, 0);
    }
  }
  // bác lái tàu + chú đốt lò (người lớn, đồng phục)
  const crew = [];
  [[CAB.driver, { role: 'adult', shirt: '#2c3e50', pants: '#2a2630', hat: '#1f463c' }, 0, 'b'], [CAB.stoker, { role: 'adult', shirt: '#7a5a44', pants: '#3a3344', hat: null }, -Math.PI / 2, 'd']].forEach(([p, look, ry, v]) =>
    loadHero('student-male-' + v, 1.7, look).then(h => { if (!h) return; h.model.position.set(p.x, CAB.floor, p.z); h.model.rotation.y = ry; cars[0].o.add(h.model); h.anim.play('idle', 0); crew.push(h); }));

  const lp = new THREE.Vector3();
  let camCar = -1, animT = 0;
  // gọi mỗi khung hình SAU khi camera đã đặt; who: [{ car, x, z }] người đứng gần cửa (mở cửa kéo)
  function update(dt, who = []) {
    camCar = cameraCar();
    const ci = typeof camCar === 'number' ? camCar : -1;
    const nv = ci < 0 ? [] : [ci, ci - 1, ci + 1].filter(i => i >= 0 && i < coaches.length), key = nv.join();
    if (key !== visKey) { vis = nv; visKey = key; dirty = true; consist.setHideGlow(vis); if (vis.length) loadPool(); assignNpc(); }
    if (pool.length && vis.length && pool.filter(p => p.seat).length < Math.min(pool.length, npcSeats.filter(s => vis.includes(s.ci)).length)) assignNpc();
    // cửa kéo: mở khi có người trong vòng 1,6 m
    for (const d of doors) {
      if (!vis.includes(d.ci)) continue;
      const near = who.some(w => w.car === cars.indexOf(coaches[d.ci]) && Math.abs(w.z - d.z) < 1.6 && Math.abs(w.x - d.x) < 1.4), k = Math.max(0, Math.min(1, d.k + (near ? dt : -dt) * 2.6));
      if (k !== d.k) { d.k = k; dirty = true; }
    }
    if (vis.length && (dirty || consist.state.moved)) writeMatrices();
    dirty = false; consist.state.moved = false;
    // hoạt hình (thưa: 1/3 khung hình) — NPC toa camera + tổ lái khi gần
    if ((animT += dt) > 0.05) {
      for (const p of pool) if (p.seat && p.seat.ci === ci) p.h.anim.update(animT);
      cars[0].o.getWorldPosition(lp); const nearLoco = lp.distanceToSquared(camera.position) < 34 * 34;
      for (const h of crew) { h.model.visible = nearLoco; if (nearLoco) h.anim.update(animT); }
      animT = 0;
    }
  }
  const occupiedByNpc = id => { const s = byId.get(id); return !!(s && s.npc); };
  return { update, seats, byId, occupiedByNpc, get camCar() { return camCar; }, get visible() { return vis; }, crew };
}
