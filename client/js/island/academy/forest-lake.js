// academy/forest-lake.js — HỒ TRONG RỪNG PHÉP THUẬT (cắm vào forest.js qua plug): bến nhỏ + thuyền dạo quanh hồ, cầu treo ra đảo nhỏ,
// thác nước 21 m + suối + cầu gỗ, sen (Kenney CC0 plant_lily + hoa sen dựng khối), cá phát sáng (Kenney CC0 fish), Rùa Thần (rua.glb),
// mặt hồ phản chiếu sao/trăng ban đêm, Thuỷ cung nhỏ dưới đáy (lặn bằng dive.js).
// Góc θ quanh tâm hồ (plan.js lakeAt): 0 nam (cầu treo) · π/2 đông (đường mòn) · −π/2 tây (thác) · π bắc (bến) · 2,4 (thuỷ cung).
import * as THREE from 'three';
import { CFG } from '../config.js';
import { matV } from '../sample/palette.js';
import { scatterModel, loadModel } from '../models.js';
import { Batch } from './geo.js';
import { FOREST, CLIFF, lakeAt, toWorld, toLocal } from './plan.js';
import { glowTex } from './forest.js';

const FL = FOREST.lake, M = CFG.isMobile, PI = Math.PI, GA = PI * (3 - Math.sqrt(5));
export const SPOTS = {
  dock: { th: PI, r0: FL.ring - FL.rw, r1: FL.r - 8, y: 0.9, w: 1.3 },     // bến gỗ chìa ra hồ
  rope: { r0: FL.ring - FL.rw + 0.5, r1: 5, y: 1.9, sag: 0.9, w: 1.1 },   // cầu treo θ = 0 (dọc +u)
  plank: { y: 1.9, w: 1.6, hl: 5 },                                       // cầu gỗ qua suối (θ = −π/2, dọc u)
  palace: { th: 2.4, r: 18 },
  boatR: 21, boatLap: 34,
};
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// mặt đi thêm (bến, cầu treo, cầu gỗ) theo toạ độ cục bộ; null nếu ngoài
export function lakeDeckY(u, v) {
  const du = u - FL.u, dv = v - FL.v, S = SPOTS;
  if (Math.abs(dv) < S.rope.w && du > S.rope.r1 - 0.5 && du < S.rope.r0 + 0.5) { const k = (du - S.rope.r1) / (S.rope.r0 - S.rope.r1); return S.rope.y - S.rope.sag * Math.sin(PI * Math.min(1, Math.max(0, k))); }
  if (Math.abs(dv) < S.dock.w && -du > S.dock.r1 && -du < S.dock.r0 + 0.5) return S.dock.y;
  if (Math.abs(du) < S.plank.w && Math.abs(-dv - FL.ring) < S.plank.hl) return S.plank.y + 0.25 * Math.cos(PI * (-dv - FL.ring) / (2 * S.plank.hl));
  return null;
}

// bản sao kit có hoạt hoạ: N bản, trả về { ims, base } — đặt ma trận i = T_i × base
async function kitAnim(group, name, n) {
  const ims = await scatterModel(group, 'kit/' + name, Array.from({ length: n }, () => [0, 0, 0, 1, 0]));
  const base = ims.map(im => { const m = new THREE.Matrix4(); im.getMatrixAt(0, m); im.frustumCulled = false; return m; });
  return { ims, base };
}

export function createLake(ctx, forest) {
  const { player, camera } = ctx, H = forest.H, night = () => (ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0);
  const W0 = toWorld(0, 0), [lx, lz] = toWorld(FL.u, FL.v);
  let G = null, ride = null, seenTurtle = false, seenPalace = false;
  // mặt đi: nối vào chuỗi groundExtra
  const prev = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    let h = prev ? prev(x, z, y) : -99;
    if (G && Math.abs(x - lx) < FL.ring + 2 && Math.abs(z - lz) < FL.ring + 2) { const [u, v] = toLocal(x, z), q = lakeDeckY(u, v); if (q !== null && (y === undefined || y > q - 2.5)) h = Math.max(h, q); }
    return h;
  };

  function build(F) {
    const group = new THREE.Group(); group.name = 'forest-lake'; F.group.add(group);
    const b = new Batch(), wood = '#a8744a', woodD = '#6e4a30', rope = '#c9b28a', S = SPOTS;
    // bến gỗ (θ = π, chìa về −u) + cọc
    const D = S.dock; b.box(-D.w, D.w, D.y - 0.25, D.y, -D.r0 - 0.5, -D.r1, wood);
    for (let r = D.r1; r <= D.r0; r += 2.6) for (const s of [-1, 1]) b.cyl(s * (D.w - 0.1), -3, -r, 0.13, D.y + 2.9, woodD, 6);
    // cầu treo (θ = 0, dọc +u): ván + 2 dây tay vịn võng theo + trụ đầu cầu
    const R = S.rope, yR = k => R.y - R.sag * Math.sin(PI * k), L = R.r0 - R.r1;
    for (let k = 0; k < 34; k++) { const t = (k + 0.5) / 34, u = R.r1 + t * L; b.box(-R.w, R.w, yR(t) - 0.12, yR(t), u - L / 34 * 0.42, u + L / 34 * 0.42, k % 2 ? wood : '#b88456'); }
    for (const sd of [-1, 1]) {
      for (let k = 0; k < 21; k++) { const t0 = k / 21, t1 = (k + 1) / 21, ua = R.r1 + t0 * L, ub = R.r1 + t1 * L, ya = yR(t0) + 1.05 - 0.35 * Math.sin(PI * t0), yb = yR(t1) + 1.05 - 0.35 * Math.sin(PI * t1);
        b.add(new THREE.BoxGeometry(0.07, 0.07, Math.hypot(ub - ua, yb - ya)), rope, sd * (R.w + 0.05), (ya + yb) / 2, (ua + ub) / 2, 0, -Math.atan2(yb - ya, ub - ua));
        if (k % 3 === 0) b.box(sd * (R.w + 0.05) - 0.03, sd * (R.w + 0.05) + 0.03, yR(t0), ya, ua - 0.03, ua + 0.03, rope); }
      for (const u of [R.r1 - 0.4, R.r0 + 0.4]) b.cyl(sd * (R.w + 0.15), 0.8, u, 0.16, 2.6, woodD, 6);
    }
    // cầu gỗ cong qua suối chân thác (θ = −π/2)
    const P = S.plank; for (let k = 0; k < 13; k++) { const t = (k + 0.5) / 13, v = -FL.ring - P.hl + t * 2 * P.hl, y = P.y + 0.25 * Math.cos(PI * (t * 2 - 1) / 2); b.box(v - 0.4, v + 0.4, y - 0.15, y, -P.w, P.w, wood); }
    for (const s of [-1, 1]) b.box(-FL.ring - P.hl, -FL.ring + P.hl, P.y + 0.9, P.y + 1.0, s * P.w - 0.05, s * P.w + 0.05, woodD);
    // đảo nhỏ: miếu đá nhỏ (bí mật ở forest-secrets.js) + đèn đá
    b.box(-1.4, 1.4, 1.5, 2.0, -1.4, 1.4, '#9a958c'); b.box(-1.0, 1.0, 2.0, 3.6, -1.0, 1.0, '#c9c2b4'); b.gable(-1.5, 1.5, -1.3, 1.3, 3.6, 1.1, '#2f6f6a');
    b.box(-0.45, 0.45, 2.0, 3.2, 0.98, 1.06, '#5a3d2a');
    // thuỷ cung dưới đáy (θ = 2,4): nền, 4 cột đỏ, mái 2 tầng ngói lam, nóc vàng
    const [pu, pv] = [Math.cos(S.palace.th) * S.palace.r, Math.sin(S.palace.th) * S.palace.r], py = FL.bed;
    b.box(pv - 5, pv + 5, py - 0.5, py + 0.4, pu - 4, pu + 4, '#c9c2b4');
    for (const a of [-1, 1]) for (const c of [-1, 1]) b.cyl(pv + a * 3.4, py + 0.4, pu + c * 2.6, 0.3, 2.2, '#b8423a', 8);
    b.box(pv - 2.6, pv + 2.6, py + 0.4, py + 2.2, pu - 1.8, pu + 1.8, '#e8dcc0'); b.box(pv - 0.6, pv + 0.6, py + 0.4, py + 1.8, pu + 1.78, pu + 1.86, '#5a3d2a');
    b.gable(pv - 4.6, pv + 4.6, pu - 3.6, pu + 3.6, py + 2.75, 1.0, '#2f8f8a'); b.box(pv - 4.6, pv + 4.6, py + 2.6, py + 2.75, pu - 3.6, pu + 3.6, '#b8423a');
    b.gable(pv - 2.6, pv + 2.6, pu - 2.0, pu + 2.0, py + 3.95, 0.7, '#2f8f8a'); b.box(pv - 1.6, pv + 1.6, py + 3.55, py + 3.95, pu - 1.2, pu + 1.2, '#b8423a');
    b.box(pv - 2.7, pv + 2.7, py + 4.62, py + 4.75, pu - 0.1, pu + 0.1, '#f2c443');
    const deck = new THREE.Mesh(b.build(), matV()); deck.castShadow = deck.receiveShadow = true; deck.position.set(W0[0] + FL.v, 0, W0[1] + FL.u); group.add(deck);
    // ngọc phát sáng trong thuỷ cung + ngọc trên miếu
    const gb = new Batch(); gb.add(new THREE.OctahedronGeometry(0.5, 1), '#aef6ff', pv, py + 1.2, pu); gb.add(new THREE.OctahedronGeometry(0.28, 0), '#ffe08a', 0, 3.25, 1.2);
    const gem = new THREE.Mesh(gb.build(), new THREE.MeshBasicMaterial({ vertexColors: true })); gem.position.copy(deck.position); group.add(gem);
    // thác nước: tấm nước chảy (texture sọc cuộn) từ mép vách xuống suối + bụi nước
    const wc = document.createElement('canvas'); wc.width = 32; wc.height = 128; const wg = wc.getContext('2d');
    for (let y = 0; y < 128; y += 2) for (let x = 0; x < 32; x += 2) { const k = 0.55 + 0.45 * Math.sin(x * 0.9 + Math.sin(y * 0.21) * 2) * Math.sin(y * 0.5 + x); wg.fillStyle = `rgba(${200 + k * 55 | 0},${235 + k * 20 | 0},255,${0.55 + k * 0.4})`; wg.fillRect(x, y, 2, 2); }
    const wTex = new THREE.CanvasTexture(wc); wTex.wrapS = wTex.wrapT = THREE.RepeatWrapping; wTex.repeat.set(1, 3);
    const [fu, fv] = lakeAt(CLIFF.th, CLIFF.r - CLIFF.cr + 0.6), fall = new THREE.Mesh(new THREE.PlaneGeometry(4.2, CLIFF.top + 1.2), new THREE.MeshBasicMaterial({ map: wTex, transparent: true, opacity: 0.88, depthWrite: false, side: THREE.DoubleSide }));
    const [fx, fz] = toWorld(fu, fv); fall.position.set(fx + 1.2, CLIFF.top / 2 - 0.2, fz); fall.rotation.set(0, PI / 2, -0.19); group.add(fall);
    const NS = 34, spray = new Float32Array(NS * 3), sprayS = Array.from({ length: NS }, (_, i) => [Math.random() * 6.28, 0.5 + Math.random()]);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(spray, 3));
    const sp = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.3, map: glowTex, color: '#eaf8ff', transparent: true, opacity: 0.55, depthWrite: false })); sp.frustumCulled = false; group.add(sp);
    // hoa sen (dựng khối: 8 cánh hồng + đài vàng) 1 InstancedMesh + lá súng Kenney CC0
    const lb = new Batch(); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; lb.add(new THREE.OctahedronGeometry(0.22, 0), k % 2 ? '#f2a6c4' : '#ffc6da', Math.cos(a) * 0.17, 0.2, Math.sin(a) * 0.17, -a, 0, 0.75, 0.6, 1.4, 1); }
    lb.add(new THREE.CylinderGeometry(0.1, 0.08, 0.1, 6), '#f2c443', 0, 0.3, 0);
    const lotusA = [], pads = [], s0 = forest.rnd;
    for (let k = 0; k < (M ? 21 : 34); k++) { const a = k * GA, r = 13 + (k * 7 % 13) + 3 * Math.sin(k), [u, v] = lakeAt(a, r); if (Math.abs(Math.sin(a)) < 0.12 || Math.abs(a % (2 * PI) - PI) < 0.3) continue; const [x, z] = toWorld(u, v); pads.push([x, 0.16, z, 8 + (k % 5), k * 1.3]); if (k % 2 === 0) lotusA.push([x + 0.3, z + 0.2, 1.2 + (k % 3) * 0.3]); }
    scatterModel(group, 'kit/plant_lily', pads).then(ims => ims.forEach(im => { im.castShadow = false; }));
    const lotus = new THREE.InstancedMesh(lb.build(), matV(), lotusA.length), o = new THREE.Object3D();
    lotusA.forEach(([x, z, s], i) => { o.position.set(x, 0.12, z); o.rotation.set(0, i, 0); o.scale.setScalar(s); o.updateMatrix(); lotus.setMatrixAt(i, o.matrix); }); lotus.computeBoundingSphere(); group.add(lotus);
    // cá phát sáng (Kenney CC0 fish): bơi vòng dưới mặt nước; đêm có quầng sáng nổi trên mặt hồ
    const NFISH = M ? 13 : 21, fish = Array.from({ length: NFISH }, (_, i) => ({ r: 9 + (i * 5) % 21, a: i * GA, sp: (0.13 + (i % 5) * 0.03) * (i % 2 ? 1 : -1), y: -0.5 - (i % 4) * 0.7 }));
    const fishGlow = new Float32Array(NFISH * 3), fgg = new THREE.BufferGeometry(); fgg.setAttribute('position', new THREE.BufferAttribute(fishGlow, 3));
    const fishPts = new THREE.Points(fgg, new THREE.PointsMaterial({ size: 1.6, map: glowTex, color: '#7ff0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); fishPts.frustumCulled = false; group.add(fishPts);
    // sao + trăng phản chiếu trên mặt hồ (đêm)
    const NSTAR = M ? 89 : 144, stars = new Float32Array(NSTAR * 3), stS = [];
    for (let i = 0; i < NSTAR; i++) { const a = Math.random() * PI * 2, r = 7 + Math.sqrt(Math.random()) * (FL.r - 9); stars.set([lx + Math.sin(a) * r, 0.09, lz + Math.cos(a) * r], i * 3); stS.push(Math.random() * 6.28); }
    const stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    const starPts = new THREE.Points(stg, new THREE.PointsMaterial({ size: 0.42, map: glowTex, color: '#fff8e0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); starPts.frustumCulled = false; group.add(starPts);
    const moonRef = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: glowTex, color: '#fff3c8', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); group.add(moonRef);
    G = { group, deck, gem, fall, wTex, spray, sprayS, sg, fish, fishGlow, fgg, fishPts, starPts, stS, moonRef, fishK: null, turtle: null, boat: null, palace: toWorld(FL.u + pu, FL.v + pv), shrine: toWorld(FL.u, FL.v) };
    kitAnim(group, 'fish', NFISH).then(k => { if (!G) return; G.fishK = k; for (const im of k.ims) { const m = im.material.clone(); m.emissive = new THREE.Color('#38d9ff'); m.emissiveIntensity = 0.4; im.material = m; im.castShadow = false; } });
    loadModel('rua').then(m => { if (!G || !m) return; m.scale.setScalar(2.6); m.traverse(q => { if (q.isMesh) q.castShadow = true; }); G.turtle = m; group.add(m); });
    loadModel('kit/boat_row_small').then(m => { if (!G || !m) return; m.scale.setScalar(1.8); G.boat = m; group.add(m); placeBoat(0, PI); });
  }
  function unbuild() { if (!G) return; if (ride) endRide(); G.group.parent && G.group.parent.remove(G.group); G = null; }

  // ---------- thuyền dạo quanh hồ ----------
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  function placeBoat(a, idleAt) {
    if (!G || !G.boat) return;
    const r = idleAt !== undefined ? FL.r - 9.5 : SPOTS.boatR, th = idleAt !== undefined ? idleAt + 0.08 : a, [u, v] = lakeAt(th, r), [x, z] = toWorld(u, v), t = performance.now() / 1000;
    G.boat.position.set(x, 0.05 + Math.sin(t * 1.3) * 0.04, z); G.boat.rotation.set(Math.sin(t * 1.1) * 0.03, idleAt !== undefined ? 0 : -th, 0);
  }
  function startRide() {
    if (ride || player.vehicle) return;
    ride = { t: 0, said: 0 }; player.vehicle = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 999, anim: 'sit', seat: 0, seatZ: 0, camAdd: 0, ferry: true };
    camPos.copy(camera.position); ctx.toast('🛶 Thuyền nhỏ chở em một vòng quanh hồ — nhìn xuống nước tìm <b>cá phát sáng</b> và <b>Rùa Thần</b> nhé!', 4500);
  }
  function endRide() { ride = null; player.vehicle = null; const [u, v] = lakeAt(PI, FL.ring); const [x, z] = toWorld(u, v); player.teleport(x, z, 1.8); }
  const FACTS = ['🪷 <b>Sen</b> mọc từ bùn mà hoa vẫn sạch: mặt lá có lớp sáp và gai siêu nhỏ làm nước lăn tròn, cuốn bụi đi — gọi là <b>hiệu ứng lá sen</b>.',
    '🐟 Cá thở bằng <b>mang</b>: nước chảy qua mang, ô-xi hoà tan trong nước thấm vào máu. Một số loài cá biển sâu tự <b>phát sáng</b> nhờ vi khuẩn sống trong cơ thể.',
    '💧 Thác nước là chỗ dòng chảy gặp <b>lớp đá cứng</b>: đá mềm phía dưới bị bào mòn nhanh hơn nên tạo thành bậc dốc đứng.'];

  function update(dt, t, F, d) {
    if (!G) return;
    const n = night(), near = d < 34;
    G.wTex.offset.y = (G.wTex.offset.y + dt * 1.3) % 1;
    G.gem.material.color.setScalar(0.75 + 0.25 * Math.sin(t * 2));
    if (!near) return;
    // bụi nước chân thác
    const [bu, bv] = lakeAt(CLIFF.th, CLIFF.r - CLIFF.cr - 1.5), [bx, bz] = toWorld(bu, bv);
    for (let i = 0; i < G.sprayS.length; i++) { const [ph, sp] = G.sprayS[i], k = (t * sp * 0.6 + ph) % 1; G.spray.set([bx + Math.sin(ph * 3) * 2.2 * k, 0.3 + k * 2.6, bz + Math.cos(ph * 5) * 1.6 * k], i * 3); }
    G.sg.attributes.position.needsUpdate = true;
    // cá
    const o = new THREE.Object3D(), m4 = new THREE.Matrix4();
    G.fish.forEach((f, i) => {
      f.a += f.sp * dt; const x = lx + Math.sin(f.a) * f.r, z = lz + Math.cos(f.a) * f.r;
      o.position.set(x, f.y + Math.sin(t * 2 + i) * 0.15, z); o.rotation.set(0, f.a + (f.sp > 0 ? PI / 2 : -PI / 2), 0); o.scale.setScalar(2.1); o.updateMatrix();
      if (G.fishK) G.fishK.ims.forEach((im, j) => im.setMatrixAt(i, m4.multiplyMatrices(o.matrix, G.fishK.base[j])));
      G.fishGlow.set([x, 0.12, z], i * 3);
    });
    if (G.fishK) for (const im of G.fishK.ims) { im.instanceMatrix.needsUpdate = true; im.material.emissiveIntensity = 0.4 + 1.2 * n; }
    G.fgg.attributes.position.needsUpdate = true; G.fishPts.material.opacity = 0.15 + 0.7 * n;
    // Rùa Thần: bơi chậm quanh đảo nhỏ, mỗi 34 s ngoi lên thở cạnh cầu treo
    if (G.turtle) {
      const ph = (t % 34) / 34, up = sm(0.62, 0.72, ph) * (1 - sm(0.9, 0.98, ph)), a = t * 0.05, r = 13 + 3 * Math.sin(t * 0.07);
      const x = lx + Math.sin(a) * r, z = lz + Math.cos(a) * r; G.turtle.position.set(x, -2.2 + up * 2.05, z); G.turtle.rotation.set(0, a + PI / 2, 0);
      const pd = Math.hypot(player.pos.x - x, player.pos.z - z);
      if (pd < 8 && !seenTurtle) { seenTurtle = true; ctx.forestEvent && ctx.forestEvent('turtle'); ctx.toast('🐢 <b>Rùa Thần</b> ngoi lên chào em! Truyền thuyết <b>Hồ Gươm</b>: thắng giặc Minh xong, vua <b>Lê Lợi</b> dạo thuyền trên hồ Tả Vọng, Rùa Vàng nổi lên đòi lại <b>gươm thần</b> — hồ từ đó mang tên Hồ Hoàn Kiếm.', 8000); }
    }
    // mặt hồ đêm: sao lấp lánh + vệt trăng (điểm phản xạ theo hướng trăng nhìn từ camera)
    const sm2 = G.starPts.material; sm2.opacity = n * (0.75 + 0.25 * Math.sin(t * 3));
    const mu = ctx.sky && ctx.sky.U && ctx.sky.U.uMoon && ctx.sky.U.uMoon.value, mr = G.moonRef;
    if (mu && n > 0.3 && mu.y > 0.05 && camera.position.y > 0.3) {
      const hz = Math.hypot(mu.x, mu.z) || 1, dist = camera.position.y / Math.max(0.12, mu.y / hz);
      let x = camera.position.x + mu.x / hz * dist, z = camera.position.z + mu.z / hz * dist; const dx = x - lx, dz = z - lz, dd = Math.hypot(dx, dz);
      if (dd > FL.r - 6) { x = lx + dx / dd * (FL.r - 6); z = lz + dz / dd * (FL.r - 6); }
      mr.position.set(x, 0.1, z); mr.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z); mr.scale.set(3.4, 1, 8 + 5 * Math.sin(t * 1.7) * 0.2); mr.material.opacity = (n - 0.3) * 1.2 * (0.8 + 0.2 * Math.sin(t * 4));
    } else mr.material.opacity = 0;
    // thuyền + thuỷ cung
    if (ride) {
      ride.t += dt; const a = PI + ride.t / SPOTS.boatLap * PI * 2; placeBoat(a);
      const bp = G.boat ? G.boat.position : null;
      if (bp) {
        player.pos.set(bp.x, bp.y + 0.45, bp.z); player.root.position.copy(player.pos); player.root.rotation.set(0, -a + PI / 2, 0);
        const fx = Math.cos(a + PI / 2), fz = -Math.sin(a + PI / 2); camPos.lerp(new THREE.Vector3(bp.x - fx * 8 + (lx - bp.x) * -0.2, 4.2, bp.z - fz * 8 + (lz - bp.z) * -0.2), Math.min(1, dt * 2)); camera.position.copy(camPos); camLook.set(bp.x + fx * 13, 0.6, bp.z + fz * 13); camera.lookAt(camLook);
      }
      const k = Math.floor(ride.t / 9); if (k >= 1 && k <= FACTS.length && ride.said < k) { ride.said = k; ctx.toast(FACTS[k - 1], 6500); }
      if (ride.t >= SPOTS.boatLap) { endRide(); ctx.forestEvent && ctx.forestEvent('boat'); ctx.toast('🛶 Đã về bến. Hồ có cả một <b>thuỷ cung</b> dưới đáy đấy — xuống nước, bấm <b>Q</b> / 🤿 để lặn!', 5000); }
      return;
    }
    placeBoat(0, PI);
    const p = player.pos, [u, v] = toLocal(p.x, p.z);
    if (!player.vehicle && Math.hypot(u - (FL.u - FL.ring + 4), v - FL.v) < 4.2) ctx.offer('🛶 Đi thuyền một vòng quanh hồ', startRide, 8);
    if (!seenPalace && Math.hypot(p.x - G.palace[0], p.z - G.palace[1]) < 8 && p.y < -1.6) { seenPalace = true; ctx.forestEvent && ctx.forestEvent('palace'); ctx.toast('🏯 Em lặn tới <b>Thuỷ cung</b> nhỏ dưới đáy hồ! 🔬 Càng xuống sâu, nước càng nén mạnh: cứ <b>10 m</b> nước thì áp suất tăng thêm khoảng <b>1 lần áp suất không khí</b>.', 7500); }
  }
  return { build, unbuild, update, ride: startRide, get G() { return G; } };
}
