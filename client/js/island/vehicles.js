// vehicles.js — Phương tiện của học sinh: 🚲 xe đạp, ⛵ thuyền chèo, 🎈 khinh khí cầu (low poly toon, gộp geometry).
// Phím: B lên/xuống xe đạp · R chuông xe · E lên thuyền khi ra mép nước / lên bờ · F khinh khí cầu (Space bay lên, Shift/C hạ xuống).
// Điện thoại: nút 🚲 🎈 🔔 ⬆ ⬇ cạnh nút Chạy/Nhảy; lên xe/thuyền đỗ sẵn bằng nút hành động chung (ctx.offer).
import * as THREE from 'three';
import { BLOCKS } from './layout.js';
import { CFG } from './config.js';
import { toon, addOutline } from './style.js';
import { mergeGeos } from './terrain.js';

const W = CFG.island.waterLevel, P = CFG.player;
const colorMat = toon('#ffffff', { vertexColors: true });
const c3 = new THREE.Color();

// ---------- Dựng mesh: mỗi phần tô 1 màu (vertex color) rồi gộp thành 1 geometry ----------
function paint(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo; c3.set(color);
  const col = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < col.length; i += 3) col.set([c3.r, c3.g, c3.b], i);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g;
}
const at = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => geo.rotateX(rx).rotateY(ry).rotateZ(rz).translate(x, y, z);
function tube(a, b, r, color, seg = 6) { // ống nối 2 điểm
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  return paint(g, color);
}
function mesh(parts, mat = colorMat) { const m = new THREE.Mesh(mergeGeos(parts), mat); m.castShadow = true; m.receiveShadow = true; return m; }
const tris = o => { let n = 0; o.traverse(m => { if (m.isMesh && !m.userData.outline) n += m.geometry.attributes.position.count / 3; }); return n; };

// ---------- 🚲 Xe đạp (có giỏ trước, kiểu xe đi học) ----------
const WR = 0.34;
function makeBike(color) {
  const g = new THREE.Group(), dark = '#2a2630', zF = 0.56, zB = -0.52;
  const wheel = () => { const p = [paint(new THREE.TorusGeometry(WR, 0.045, 4, 14).rotateY(Math.PI / 2), dark), paint(new THREE.BoxGeometry(0.02, WR * 1.9, 0.025), '#c9c9cf'), paint(new THREE.BoxGeometry(0.02, 0.025, WR * 1.9), '#c9c9cf'), paint(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 6).rotateZ(Math.PI / 2), '#c9c9cf')]; return mesh(p); };
  const wf = wheel(), wb = wheel(); wf.position.set(0, WR, zF); wb.position.set(0, WR, zB); g.add(wf, wb);
  const seat = [0, 0.86, -0.26], head = [0, 0.98, 0.45], crank = [0, WR, 0.02];
  const frame = [
    tube([0, WR, zB], crank, 0.03, color), tube(crank, [0, 0.8, -0.22], 0.035, color), tube([0, 0.8, -0.22], [0, 0.86, 0.4], 0.035, color),
    tube(crank, [0, 0.86, 0.4], 0.035, color), tube([0, 0.8, -0.22], [0, WR, zB], 0.025, color), tube([0, 0.98, 0.45], [0, WR, zF], 0.03, color),
    paint(at(new THREE.BoxGeometry(0.2, 0.06, 0.3), ...seat), dark),                                                  // yên
    tube([-0.3, head[1] + 0.06, head[2] - 0.05], [0.3, head[1] + 0.06, head[2] - 0.05], 0.025, '#c9c9cf'),           // ghi đông
    paint(at(new THREE.BoxGeometry(0.08, 0.08, 0.08), -0.3, head[1] + 0.06, head[2] - 0.05), dark), paint(at(new THREE.BoxGeometry(0.08, 0.08, 0.08), 0.3, head[1] + 0.06, head[2] - 0.05), dark),
    paint(at(new THREE.BoxGeometry(0.4, 0.26, 0.3), 0, 0.84, 0.72), '#d9b46a'), paint(at(new THREE.BoxGeometry(0.42, 0.04, 0.32), 0, 0.98, 0.72), '#b88a40'), // giỏ mây
    paint(at(new THREE.BoxGeometry(0.22, 0.03, 0.4), 0, 0.72, -0.48), dark),                                          // baga
    paint(at(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6).rotateX(Math.PI / 2), 0.22, head[1] + 0.09, head[2] - 0.05), '#f2c14e'), // chuông
  ];
  g.add(mesh(frame));
  const cr = new THREE.Group(); cr.position.set(...crank);
  cr.add(mesh([paint(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 8).rotateZ(Math.PI / 2), '#c9c9cf'), paint(at(new THREE.BoxGeometry(0.03, 0.03, 0.34), 0.08, 0, 0), dark),
    paint(at(new THREE.BoxGeometry(0.03, 0.03, 0.34), -0.08, 0, 0), dark), paint(at(new THREE.BoxGeometry(0.12, 0.03, 0.08), 0.15, 0, 0.17), dark), paint(at(new THREE.BoxGeometry(0.12, 0.03, 0.08), -0.15, 0, -0.17), dark)]));
  g.add(cr); addOutline(g);
  return { type: 'bike', group: g, wheels: [wf, wb], crank: cr, tris: tris(g) };
}

// ---------- ⛵ Thuyền chèo gỗ ----------
function makeBoat(color) {
  const g = new THREE.Group(), L = 3.2, B = 1.25;
  const hull = new THREE.BoxGeometry(B, 0.5, L, 1, 2, 8), p = hull.attributes.position;
  for (let i = 0; i < p.count; i++) { // vuốt nhọn 2 đầu, đáy hẹp, mũi/đuôi cong lên
    const z = p.getZ(i), t = Math.abs(z) / (L / 2), y = p.getY(i), w = Math.pow(Math.max(0, 1 - t * t), 0.7) * (y < 0 ? 0.62 : 1);
    p.setX(i, p.getX(i) * Math.max(0.04, w)); p.setY(i, y + t * t * 0.22 * (y > 0 ? 1 : 0.6));
  }
  hull.computeVertexNormals();
  const h = paint(hull, color), col = h.attributes.color, n = h.attributes.normal, deck = new THREE.Color('#7a5232'), white = new THREE.Color('#f4efe4');
  for (let i = 0; i < col.count; i++) { if (n.getY(i) > 0.7) col.setXYZ(i, deck.r, deck.g, deck.b); else if (h.attributes.position.getY(i) > 0.1 && n.getY(i) > -0.3) col.setXYZ(i, white.r, white.g, white.b); }
  const rimL = [], rim = (s) => { for (let k = 0; k < 6; k++) { const z0 = -L / 2 + 0.25 + k * (L - 0.5) / 6, z1 = z0 + (L - 0.5) / 6; const wx = z => s * B / 2 * Math.pow(Math.max(0, 1 - (2 * z / L) ** 2), 0.7) + s * 0.02, yy = z => 0.27 + (2 * z / L) ** 2 * 0.22; rimL.push(tube([wx(z0), yy(z0), z0], [wx(z1), yy(z1), z1], 0.04, '#5c3a22', 4)); } };
  rim(-1); rim(1);
  const parts = [h, ...rimL, paint(at(new THREE.BoxGeometry(B * 0.9, 0.06, 0.32), 0, 0.12, -0.35), '#a87445'), paint(at(new THREE.BoxGeometry(0.5, 0.06, 0.3), 0, 0.14, 1.0), '#a87445'),
    // cột buồm + cánh buồm tam giác (kiểu thuyền buồm nhỏ)
    tube([0, 0.1, 0.55], [0, 2.9, 0.55], 0.045, '#8a5a34', 5), paint(at(new THREE.ConeGeometry(1, 2.3, 3).scale(0.05, 1, 0.82), 0, 1.55, 0.05), '#f4efe4'), paint(at(new THREE.ConeGeometry(1, 0.5, 3).scale(0.055, 1, 0.82 * 0.22), 0, 2.48, 0.39), color)];
  const body = mesh(parts); body.position.y = -0.18; g.add(body);
  const oars = [-1, 1].map(s => { // mái chèo xoay quanh cọc chèo
    const pv = new THREE.Group(); pv.position.set(s * 0.62, 0.12, 0.05);
    const o = mesh([tube([0, 0, 0], [s * 1.3, -0.35, 0], 0.03, '#c8955a', 5), paint(at(new THREE.BoxGeometry(0.35, 0.03, 0.16), s * 1.42, -0.39, 0, 0, 0, s * 0.26), '#c8955a'), tube([0, 0, 0], [-s * 0.45, 0.1, 0], 0.035, '#c8955a', 5)]);
    pv.add(o); g.add(pv); return pv;
  });
  addOutline(g);
  return { type: 'boat', group: g, oars, body, tris: tris(g) };
}

// ---------- 🎈 Khinh khí cầu ----------
function makeBalloon() {
  const g = new THREE.Group(), R = 2.6, cy = 5.4, cols = ['#e8453c', '#f2c14e', '#3d8fd9', '#f2c14e'];
  const env = new THREE.SphereGeometry(R, 12, 10).toNonIndexed(), p = env.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0) { const t = Math.min(1, -y / R), f = 1 - t * t * 0.78; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); p.setY(i, y * 1.25); } }
  env.computeVertexNormals(); env.translate(0, cy, 0);
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i += 3) { const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3; c3.set(cols[Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI * 2) * 12) % 4]); for (let k = 0; k < 3; k++) col.set([c3.r, c3.g, c3.b], (i + k) * 3); }
  env.setAttribute('color', new THREE.BufferAttribute(col, 3)); env.deleteAttribute('uv');
  const mouthY = cy - R * 1.25 + 0.05, ropes = [];
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; ropes.push(tube([Math.cos(a) * 0.62, 0.85, Math.sin(a) * 0.62], [Math.cos(a) * R * 0.3, mouthY, Math.sin(a) * R * 0.3], 0.025, '#5c4630', 3)); }
  const basket = [paint(new THREE.CylinderGeometry(0.75, 0.62, 0.85, 8, 1, true).translate(0, 0.43, 0), '#a8763e'), paint(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 8).translate(0, 0.04, 0), '#7a5232'),
    paint(new THREE.TorusGeometry(0.76, 0.06, 3, 8).rotateX(Math.PI / 2).translate(0, 0.86, 0), '#6b4a2b'), paint(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 6).translate(0, mouthY - 0.6, 0), '#55555f'),
    tube([0, mouthY - 0.45, 0], [0, 0.86, 0.0], 0.02, '#55555f', 3)];
  const m = new THREE.Mesh(mergeGeos([env, ...ropes, ...basket]), new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: colorMat.gradientMap, side: THREE.DoubleSide }));
  m.castShadow = true; g.add(m); addOutline(g);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 6).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: '#ffb02e', transparent: true, opacity: 0.9 }));
  flame.position.y = mouthY - 0.35; flame.userData.outline = true; g.add(flame);
  return { type: 'balloon', group: g, flame, tris: tris(g) };
}

export function createVehicles(ctx) {
  const { scene, terrain } = ctx, pl = ctx.player;
  const sup = (x, z, y = 9) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, y) : -99);
  const isWater = (x, z) => sup(x, z) < W - 0.3 && sup(x + 0.9, z) < W - 0.2 && sup(x - 0.9, z) < W - 0.2 && sup(x, z + 0.9) < W - 0.2 && sup(x, z - 0.9) < W - 0.2;
  const waterY = (x, z, t = clock) => W - 0.02 + Math.sin(t * 1.6 + x * 0.35) * 0.06 + Math.sin(t * 1.1 + z * 0.42) * 0.05;
  let clock = 0;
  const all = [];
  const park = (v, x, z, ry) => { v.group.position.set(x, v.type === 'boat' ? waterY(x, z) : sup(x, z), z); v.group.rotation.set(0, ry, 0); scene.add(v.group); if (!all.includes(v)) all.push(v); return v; };

  // Xe đỗ ở bãi xuất phát (cạnh khu cắm trại)
  const BIKE_COLORS = ['#3d8fd9', '#e8453c', '#3fa36b', '#f08fb0', '#f2a23a'];
  [[-6, 13.5], [-7, 14.6], [-8, 15.7]].forEach(([x, z], i) => park(makeBike(BIKE_COLORS[i]), x, z, 0.5));
  // Thuyền đỗ ở bờ đảo: bờ nam gần bãi xuất phát và bờ bắc cạnh cầu
  const shoreBoat = (x, z, dx, dz) => { for (let k = 0; k < 140; k++, x += dx, z += dz) if (isWater(x, z) && sup(x, z) < W - 0.8) return park(makeBoat(k % 2 ? '#3d8fd9' : '#d8452f'), x, z, Math.atan2(dx, dz) + Math.PI / 2); };
  shoreBoat(4, 10, 0, 1); shoreBoat(-7, -20, 0, -1); shoreBoat(7, -20, 0, -1);
  // Trước cổng trường + bãi biển thị trấn: đặt khi thị trấn nạp xong
  let townDone = false;
  function placeTown() {
    const gate = ctx.school && ctx.school.gate; if (!gate) return; townDone = true;
    const free = (x, z) => ctx.groundExtra(x, z, 9) > 0.9 && [[0, 0], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]].every(([a, b]) => ctx.groundExtra(x + a, z + b, 9) > 0.9) && !(ctx.boxes || []).some(b => x > b.x0 - 1 && x < b.x1 + 1 && z > b.z0 - 1 && z < b.z1 + 1);
    let nb = 0; // 4 xe dựng trước cổng, chỉ đặt chỗ có nền thị trấn và không vướng tường
    for (const dz of [4, 5.2, 6.4, 7.6]) for (const dx of [5, -5, 6.2, -6.2, 7.4, -7.4, 8.6]) { const x = gate[0] + dx, z = gate[1] + dz; if (nb < 4 && free(x, z) && all.every(v => Math.hypot(v.group.position.x - x, v.group.position.z - z) > 1.1)) park(makeBike(BIKE_COLORS[(++nb) % 5]), x, z, Math.PI / 2 * Math.sign(dx)); }
    let n = 0; // thuyền ở mép bãi cát của thị trấn
    for (let x = BLOCKS[0].r[0] + 10; x < BLOCKS[0].r[2] && n < 3; x += 3) for (const [z, dz] of [[BLOCKS[0].r[3] - 1, 1]]) {   // bãi biển phía nam trường (layout.js)
      if (n >= 3 || ctx.groundExtra(x, z - dz * 2, 9) < 0.9 || (ctx.surfaceAt && ctx.surfaceAt(x, z - dz * 2, 9) !== 'sand')) continue;
      let wz = z; for (let k = 0; k < 10 && !isWater(x, wz); k++) wz += dz;
      if (isWater(x, wz) && all.every(v => Math.hypot(v.group.position.x - x, v.group.position.z - wz) > 30)) { park(makeBoat(n % 2 ? '#3d8fd9' : '#d8452f'), x, wz + dz * 1.2, Math.PI / 2); n++; }
    }
  }

  // ---------- Đi phương tiện ----------
  let cur = null, mine = { bike: null, boat: null, balloon: null }, spin = 0, lean = 0, rowT = 0, wakeT = 0, bellT = 0, lift = 0, takeoff = 0, burnT = 0;
  const MODES = {
    bike: { speed: P.run * 1.35, turn: 5, accel: 2.6, anim: 'drive', seat: 0.42, seatZ: -0.22, camAdd: 1.5 },        // ~2.2 lần đi bộ
    boat: { speed: 5.2, turn: 1.8, accel: 0.9, water: true, anim: 'sit', seat: -0.05, seatZ: -0.35, camAdd: 2.5, waterY: (x, z) => waterY(x, z) },
    balloon: { speed: 6.5, turn: 1.2, accel: 0.6, fly: true, lift: 0, maxAlt: 75, anim: 'idle', seat: 0.12, seatZ: 0, camAdd: 9 },
  };
  const ui = id => document.getElementById(id);
  function setUI() {
    const t = cur && cur.type;
    ui('bBike').textContent = t === 'bike' ? '🚶' : '🚲'; ui('bBalloon').textContent = t === 'balloon' ? '🚶' : '🎈';
    ui('bBell').hidden = t !== 'bike'; ui('bUp').hidden = ui('bDown').hidden = t !== 'balloon'; ui('bRun').hidden = ui('bJump').hidden = !!t;
  }
  function mount(v) {
    if (cur || pl.frozen) return;
    cur = v; const g = v.group;
    if (v.type === 'boat') pl.teleport(g.position.x, g.position.z, waterY(g.position.x, g.position.z));
    else pl.teleport(g.position.x, g.position.z, sup(g.position.x, g.position.z, g.position.y + 1));
    // quay người theo hướng xe
    const r = g.rotation.y; scene.remove(g); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); pl.root.add(g);
    pl.vehicle = Object.assign({}, MODES[v.type]); pl.setRot && pl.setRot(r);
    if (v.type === 'balloon') { takeoff = 2.2; ctx.sfx('burner'); ctx.toast('🎈 Bay lên ngắm toàn cảnh! <b>Space/⬆</b> lên · <b>Shift/⬇</b> xuống · <b>F</b> rời khi đã chạm đất', 4000); }
    else if (v.type === 'bike') { ctx.sfx('bell'); ctx.toast('🚲 Đạp xe nhanh gấp đôi! <b>B</b> xuống xe · <b>R</b> bấm chuông', 3000); }
    else { ctx.sfx('splash'); ctx.toast('⛵ Chèo thuyền ra biển! Cập bờ rồi bấm <b>E</b> để lên bờ', 3000); }
    setUI();
  }
  function dismount(land) {
    if (!cur) return; const v = cur, g = v.group; cur = null;
    pl.root.remove(g); pl.root.rotation.z = pl.root.rotation.x = 0; pl.vehicle = null;
    const r = pl.rot, p = pl.pos;
    if (v.type === 'boat') { g.position.set(p.x, waterY(p.x, p.z), p.z); g.rotation.set(0, r, 0); scene.add(g); pl.teleport(land[0], land[1], sup(land[0], land[1], 9)); ctx.sfx('splash'); }
    else if (v.type === 'bike') { g.position.set(p.x + Math.cos(r) * 0.9, sup(p.x, p.z, p.y + 1), p.z - Math.sin(r) * 0.9); g.rotation.set(0, r, 0); scene.add(g); }
    else { g.position.set(p.x, p.y, p.z); g.rotation.set(0, r, 0); scene.add(g); pl.teleport(p.x + Math.cos(r) * 1.4, p.z - Math.sin(r) * 1.4, sup(p.x, p.z, p.y + 1)); }
    v.flame && (v.flame.scale.setScalar(0.4));
    setUI();
  }
  const nearest = (type, r) => { let best = null, bd = r; for (const v of all) if (v.type === type && v !== cur) { const d = Math.hypot(v.group.position.x - pl.pos.x, v.group.position.z - pl.pos.z); if (d < bd && Math.abs(v.group.position.y - pl.pos.y) < 3) { bd = d; best = v; } } return best; };
  const onLand = () => sup(pl.pos.x, pl.pos.z, pl.pos.y) > W - 0.3;
  function toggleBike() {
    if (cur && cur.type === 'bike') return dismount();
    if (cur || !onLand() || !pl.grounded) return;
    let v = nearest('bike', 4);
    if (!v) { v = mine.bike || (mine.bike = makeBike(BIKE_COLORS[(ctx.hue / 72 | 0) % 5])); all.includes(v) || all.push(v); v.group.parent && v.group.parent.remove(v.group); v.group.position.set(pl.pos.x, pl.pos.y, pl.pos.z); v.group.rotation.set(0, pl.rot, 0); }
    mount(v);
  }
  function toggleBalloon() {
    if (cur && cur.type === 'balloon') { if (pl.grounded) dismount(); else ctx.toast('🎈 Hạ xuống chạm đất rồi mới rời khinh khí cầu nhé (Shift/⬇)', 2200); return; }
    if (cur || !onLand() || !pl.grounded) return;
    if (pl.pos.y > 0.9 && ctx.groundExtra && ctx.groundExtra(pl.pos.x, pl.pos.z, pl.pos.y) > pl.pos.y - 0.3 && (ctx.boxes || []).some(b => pl.pos.x > b.x0 - 3 && pl.pos.x < b.x1 + 3 && pl.pos.z > b.z0 - 3 && pl.pos.z < b.z1 + 3 && b.top > pl.pos.y + 1)) { ctx.toast('🎈 Chỗ này chật quá, ra chỗ trống để thả khinh khí cầu!', 2200); return; }
    let v = nearest('balloon', 6) || mine.balloon || (mine.balloon = makeBalloon()); all.includes(v) || all.push(v);
    if (v.group.parent) v.group.parent.remove(v.group); v.group.position.copy(pl.pos); v.group.rotation.set(0, pl.rot, 0);
    mount(v);
  }
  function ring() { if (cur && cur.type === 'bike' && bellT <= 0) { bellT = 0.5; ctx.sfx('bell'); } }
  // điểm mặt nước gần nhất quanh người chơi (để lên thuyền) / điểm đất gần nhất quanh thuyền (để lên bờ)
  function findAround(test, r0, r1) {
    for (let r = r0; r <= r1; r += 0.75) for (let k = 0; k < 12; k++) { const a = pl.rot + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 6; const x = pl.pos.x + Math.sin(a) * r, z = pl.pos.z + Math.cos(a) * r; if (test(x, z)) return [x, z]; }
    return null;
  }
  const landOK = (x, z) => { const h = sup(x, z, 9); return h > W + 0.15 && h < W + 3.2 && !(ctx.boxes || []).some(b => x > b.x0 - 0.4 && x < b.x1 + 0.4 && z > b.z0 - 0.4 && z < b.z1 + 0.4 && b.top > h + 0.5); };
  function boardBoatAt(pt) {
    let v = nearest('boat', 7);
    if (!v) { v = mine.boat || (mine.boat = makeBoat('#3fa36b')); all.includes(v) || all.push(v); if (v.group.parent) v.group.parent.remove(v.group); v.group.position.set(pt[0], 0, pt[1]); v.group.rotation.set(0, Math.atan2(pt[0] - pl.pos.x, pt[1] - pl.pos.z), 0); scene.add(v.group); }
    mount(v);
  }

  // phím tắt + nút
  addEventListener('keydown', e => {
    if (e.repeat || ctx.freeCam || document.body.classList.contains('rs-modal')) return;
    if (e.code === 'KeyB') toggleBike(); else if (e.code === 'KeyF') toggleBalloon(); else if (e.code === 'KeyR') ring();
  });
  const tap = (id, fn) => ui(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  tap('bBike', toggleBike); tap('bBalloon', toggleBalloon); tap('bBell', ring);
  const held = { up: false, down: false };
  for (const [id, k] of [['bUp', 'up'], ['bDown', 'down']]) { const b = ui(id); b.addEventListener('pointerdown', e => { e.preventDefault(); held[k] = true; }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { held[k] = false; }); }
  const keys = new Set(); addEventListener('keydown', e => keys.add(e.code)); addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
  setUI();

  // ---------- Vệt nước sau thuyền ----------
  const NW = 60, wg = new THREE.BufferGeometry(), wp = new Float32Array(NW * 3), wl = new Float32Array(NW);
  wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); wg.setAttribute('life', new THREE.BufferAttribute(wl, 1));
  const wake = new THREE.Points(wg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    vertexShader: 'attribute float life; varying float vL; void main(){ vL = life; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (1.6-life) * 300. / -mv.z * step(0.001, life); }',
    fragmentShader: 'varying float vL; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(1.,1.,1., smoothstep(.5,.3,d)*smoothstep(.15,.3,d)*vL*0.8); }' }));
  wake.frustumCulled = false; scene.add(wake); let wi = 0;

  let scanT = 0, edge = null, landPt = null;
  function update(dt) {
    clock += dt; if (!townDone) placeTown();
    bellT -= dt;
    // thuyền đang đỗ dập dềnh
    for (const v of all) if (v !== cur && v.type === 'boat') { const g = v.group; g.position.y = waterY(g.position.x, g.position.z); g.rotation.z = Math.sin(clock * 1.3 + g.position.x) * 0.04; g.rotation.x = Math.sin(clock * 1.7 + g.position.z) * 0.03; }
    for (let i = 0; i < NW; i++) if (wl[i] > 0) wl[i] = Math.max(0, wl[i] - dt * 0.55);
    wg.attributes.life.needsUpdate = true;
    const p = pl.pos, V = pl.vehicle;

    if (!cur) {
      if (pl.frozen) return;
      const b = nearest('bike', 2.6); if (b) ctx.offer('🚲 Lên xe', () => mount(b), 3);
      const bl = nearest('balloon', 3.5); if (bl) ctx.offer('🎈 Lên khinh khí cầu', toggleBalloon, 3);
      if ((scanT -= dt) <= 0) { scanT = 0.25; edge = onLand() && p.y < W + 3.5 && pl.grounded ? findAround(isWater, 1.5, 4.5) : null; }
      if (edge) { const e = edge; ctx.offer('⛵ Lên thuyền', () => boardBoatAt(e), 1); }
      return;
    }
    const g = cur.group, sp = pl.speed;
    if (cur.type === 'bike') {
      spin += sp * dt / WR; for (const w of cur.wheels) w.rotation.x = spin; cur.crank.rotation.x = spin * 0.55;
      // nghiêng khi rẽ: theo tốc độ quay của hướng đi
      const turn = (pl.rot - (update.lastRot ?? pl.rot)); update.lastRot = pl.rot;
      const want = THREE.MathUtils.clamp(-Math.atan2(Math.sin(turn), Math.cos(turn)) / Math.max(dt, 1e-3) * sp * 0.035, -0.4, 0.4);
      lean += (want - lean) * Math.min(1, dt * 6); pl.root.rotation.z = lean;
      const hero = pl.hero; if (hero) { const L = (hero.model.getObjectByName('leg-left') || hero.model.getObjectByName('upperlegl')), R = (hero.model.getObjectByName('leg-right') || hero.model.getObjectByName('upperlegr')), a = spin * 0.55; if (L && R) { L.rotateX(Math.sin(a) * 0.55 - 0.25); R.rotateX(-Math.sin(a) * 0.55 - 0.25); } }
      ctx.offer('🚶 Xuống xe', dismount, 0.5);
      if (!onLand()) { /* xe không xuống nước: player.js đã chặn */ }
    } else if (cur.type === 'boat') {
      rowT += dt * (0.8 + Math.min(1, sp / 3) * 2.2) * (sp > 0.3 ? 1 : 0.25);
      cur.oars.forEach((o, i) => { const s = i ? 1 : -1; o.rotation.y = s * Math.sin(rowT * 2) * 0.55; o.rotation.z = s * (Math.cos(rowT * 2) * 0.18 - 0.05); });
      if (sp > 0.6 && Math.sin(rowT * 2) > 0.95 && (update.splashT ?? 0) < clock) { update.splashT = clock + 0.5; ctx.sfx('splash'); }
      pl.root.rotation.z = Math.sin(clock * 1.3 + p.x) * 0.05; pl.root.rotation.x = Math.sin(clock * 1.7 + p.z) * 0.035;
      if (sp > 0.5 && (wakeT -= dt) <= 0) { wakeT = 0.07; const i = wi++ % NW, r = pl.rot; wp.set([p.x - Math.sin(r) * 1.6 + (Math.random() - 0.5) * 0.5, W + 0.05, p.z - Math.cos(r) * 1.6 + (Math.random() - 0.5) * 0.5], i * 3); wl[i] = 1; wg.attributes.position.needsUpdate = true; }
      if ((scanT -= dt) <= 0) { scanT = 0.25; landPt = findAround(landOK, 1.2, 3.6); }
      if (landPt) { const L = landPt; ctx.offer('🏝️ Lên bờ', () => dismount(L), 4); }
    } else { // balloon
      const up = keys.has('Space') || held.up, down = keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyC') || held.down;
      takeoff -= dt; const want = takeoff > 0 ? 3.5 : up ? 4 : down ? -3.5 : 0; lift += (want - lift) * Math.min(1, dt * 3); V.lift = lift;
      const burning = want > 0; cur.flame.visible = burning || Math.random() < 0.05; cur.flame.scale.set(1, (burning ? 1 : 0.4) * (0.8 + Math.random() * 0.4), 1);
      if (burning && (burnT -= dt) <= 0) { burnT = 0.9; ctx.sfx('burner'); }
      pl.root.rotation.z = Math.sin(clock * 0.7) * 0.03 + (pl.speed / 6.5) * 0.02; pl.root.rotation.x = Math.sin(clock * 0.5) * 0.02;
      if (pl.grounded && sup(p.x, p.z, p.y) > W) ctx.offer('🎈 Rời khinh khí cầu', toggleBalloon, 4);
      ctx.altitude = Math.round(p.y);
    }
  }
  const self = { update, all, get riding() { return cur && cur.type; }, mount, dismount, toggleBike, toggleBalloon, get tris() { return { bike: makeBike('#fff').tris, boat: makeBoat('#fff').tris, balloon: makeBalloon().tris }; } };
  ctx.vehicles = self;
  return self;
}
