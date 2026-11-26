// vehicles.js — Hệ thống cưỡi/đi phương tiện dùng chung: 🚲 20 kiểu xe đạp (bikes.js), ⛵ thuyền chèo, khinh khí cầu,
// và thú cưỡi / phượng hoàng (mounts.js đăng ký qua ctx.vehicles.register).
// Phím: E tương tác (lên/xuống mọi thứ) · X xe đạp (B/I: 🎒 cặp sách) · V đổi kiểu xe · R chuông · T khinh khí cầu (F: đũa phép Học viện Pha Lê) · H huýt sáo gọi thú cưỡi (mounts.js)
//       Shift chạy nhanh · khi bay: Space lên, C/Ctrl xuống. Điện thoại: các nút cạnh Chạy/Nhảy.
import * as THREE from 'three';
import { BLOCKS } from './layout.js';
import { CFG } from './config.js';
import { addOutline } from './style.js';
import { mergeGeos } from './terrain.js';
import { colorMat, paint, at, tube, mesh, tris, ICON } from './geo.js';
import { makeBike, BIKES } from './bikes.js';
import { ridePose, rideReset, cadence } from './ride-pose.js';
import { T, damp, wrapAngle } from './motion.js';

const W = CFG.island.waterLevel, P = CFG.player;
const c3 = new THREE.Color();

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
  return { type: 'boat', group: g, oars, body, tris: tris(g), r: 3.5, label: '⛵ Lên thuyền' };
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
  return { type: 'balloon', group: g, flame, tris: tris(g), r: 3.5, label: ICON.balloon + ' Lên khinh khí cầu' };
}

export function createVehicles(ctx) {
  const { scene, terrain } = ctx, pl = ctx.player;
  const sup = (x, z, y = 9) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, y) : -99);
  // nóc hộp (mái nhà, bậc cao) ngay dưới chân — sup() chỉ tính địa hình + sàn thị trấn
  const boxTop = (x, z, y) => { let t = -99; for (const b of (ctx.grid ? ctx.grid.near(x, z).boxes : ctx.boxes || [])) if (b.top <= y + 0.6 && b.top > t && x > b.x0 - 0.15 && x < b.x1 + 0.15 && z > b.z0 - 0.15 && z < b.z1 + 0.15) t = b.top; return t; };
  const supB = (x, z, y) => Math.max(sup(x, z, y + 1), boxTop(x, z, y));
  const isWater = (x, z) => sup(x, z) < W - 0.3 && sup(x + 0.9, z) < W - 0.2 && sup(x - 0.9, z) < W - 0.2 && sup(x, z + 0.9) < W - 0.2 && sup(x, z - 0.9) < W - 0.2;
  const waterY = (x, z, t = clock) => W - 0.02 + Math.sin(t * 1.6 + x * 0.35) * 0.06 + Math.sin(t * 1.1 + z * 0.42) * 0.05;
  let clock = 0;
  const all = [];
  const register = v => { if (!all.includes(v)) all.push(v); if (!v.group.parent) scene.add(v.group); return v; };
  const park = (v, x, z, ry) => { v.group.position.set(x, v.type === 'boat' ? waterY(x, z) : sup(x, z), z); v.group.rotation.set(0, ry, 0); return register(v); };
  const BOAT_MODE = { speed: 5.2, boost: 1.4, turn: 1.8, accel: 0.9, water: true, anim: 'sit', seat: -0.05, seatZ: -0.35, camAdd: 2.5, waterY: (x, z) => waterY(x, z) };
  const BALLOON_MODE = { speed: 6.5, turn: 1.2, accel: 0.6, fly: true, climb: 4, lift: 0, maxAlt: 75, anim: 'idle', seat: 0.12, seatZ: 0, camAdd: 9 };
  const boat = c => Object.assign(makeBoat(c), { mode: BOAT_MODE });
  const balloon = () => Object.assign(makeBalloon(), { mode: BALLOON_MODE, takeoff: 2.2 });

  // Bãi xe thế giới: 20 kiểu xe xếp vòng cung phía nam bãi xuất phát
  for (let i = 0, k = 0; i < BIKES.length && k < 60; k++) {
    const a = 0.15 * Math.PI + k * 0.042, x = Math.cos(a) * 15.5, z = 10 + Math.sin(a) * 15.5;
    if (terrain.heightAt(x, z) < 1.3 || terrain.slopeAt(x, z) > 0.6 || ctx.colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 0.8)) continue;
    park(makeBike(i++), x, z, -a);
  }
  // Thuyền đỗ ở bờ đảo: bờ nam gần bãi xuất phát và bờ bắc cạnh cầu
  const shoreBoat = (x, z, dx, dz) => { for (let k = 0; k < 140; k++, x += dx, z += dz) if (isWater(x, z) && sup(x, z) < W - 0.8) return park(boat(k % 2 ? '#3d8fd9' : '#d8452f'), x, z, Math.atan2(dx, dz) + Math.PI / 2); };
  shoreBoat(4, 10, 0, 1); shoreBoat(-7, -20, 0, -1); shoreBoat(7, -20, 0, -1);
  // Trước cổng trường + bãi biển thị trấn: đặt khi thị trấn nạp xong
  let townDone = false;
  function placeTown() {
    const gate = ctx.school && ctx.school.gate; if (!gate) return; townDone = true;
    const free = (x, z) => ctx.groundExtra(x, z, 9) > 0.9 && [[0, 0], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]].every(([a, b]) => ctx.groundExtra(x + a, z + b, 9) > 0.9) && !(ctx.boxes || []).some(b => x > b.x0 - 1 && x < b.x1 + 1 && z > b.z0 - 1 && z < b.z1 + 1);
    let nb = 0; // 2 xe dựng sát mép quảng trường trước cổng (để quảng trường thoáng), chỉ đặt chỗ có nền thị trấn và không vướng tường
    for (const dz of [7.6, 6.4, 5.2, 4]) for (const dx of [8.6, 7.4, -7.4, 6.2, -6.2, 5, -5]) { const x = gate[0] + dx, z = gate[1] + dz; if (nb < 2 && free(x, z) && all.every(v => Math.hypot(v.group.position.x - x, v.group.position.z - z) > 1.1)) park(makeBike([0, 15][nb++]), x, z, Math.PI / 2 * Math.sign(dx)); }
    let n = 0; // thuyền ở mép bãi cát của thị trấn
    for (let x = BLOCKS[0].r[0] + 10; x < BLOCKS[0].r[2] && n < 3; x += 3) for (const [z, dz] of [[BLOCKS[0].r[3] - 1, 1]]) {   // bãi biển phía nam trường (layout.js)
      if (n >= 3 || ctx.groundExtra(x, z - dz * 2, 9) < 0.9 || (ctx.surfaceAt && ctx.surfaceAt(x, z - dz * 2, 9) !== 'sand')) continue;
      let wz = z; for (let k = 0; k < 10 && !isWater(x, wz); k++) wz += dz;
      if (isWater(x, wz) && all.every(v => Math.hypot(v.group.position.x - x, v.group.position.z - wz) > 30)) { park(boat(n % 2 ? '#3d8fd9' : '#d8452f'), x, wz + dz * 1.2, Math.PI / 2); n++; }
    }
  }

  // ---------- Lên / xuống ----------
  const leanSt = { v: 0 }, rollSt = { v: 0 }, pitchSt = { v: 0 }; let lastSp = 0, roll = 0, pitch = 0;
  let cur = null, mine = { bike: null, boat: null, balloon: null }, lean = 0, rowT = 0, wakeT = 0, bellT = 0, lift = 0, takeoff = 0, burnT = 0;
  let myStyle = +(localStorage.getItem('island.bike') || 0);
  const ui = id => document.getElementById(id);
  function dimUI() { for (const [id, k] of [['bBike', 'bike'], ['bBalloon', 'balloon']]) { const r = why(k), b = ui(id); b.classList.toggle('off', !!r); b.title = r ? r.replace(/^\S+ /, '') : k === 'bike' ? 'Xe đạp (X)' : 'Khinh khí cầu (T)'; } }
  function setUI() {
    const t = cur && cur.type, fly = cur && cur.mode.fly;
    ui('bBike').textContent = t === 'bike' ? '🚶' : '🚲'; ui('bBalloon').innerHTML = t === 'balloon' ? '🚶' : ICON.balloon;
    dimUI(); ui('bBell').hidden = ui('bStyle').hidden = t !== 'bike'; ui('bUp').hidden = ui('bDown').hidden = !fly;
    ui('bJump').hidden = !!t; ui('bRun').hidden = !!t && !cur.mode.boost; ui('bRun').textContent = t ? 'Nhanh' : 'Chạy';
  }
  const say = (v, txt, ms = 3500) => ctx.toast(txt, ms);
  function mount(v) {
    if (cur || pl.frozen) return;
    cur = v; lastRot = null; lastSp = 0; cad = steer = vy = 0; update.py = undefined; lean = roll = pitch = 0; leanSt.v = rollSt.v = pitchSt.v = 0; const g = v.group, x = g.position.x, z = g.position.z, r = g.rotation.y;
    if (v.type === 'boat') pl.teleport(x, z, waterY(x, z));
    else pl.teleport(x, z, v.mode.fly ? Math.max(g.position.y, supB(x, z, g.position.y)) : supB(x, z, g.position.y));   // trên mái: không tụt vào nhà
    if (g.parent) g.parent.remove(g); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.visible = true; pl.root.add(g);
    pl.vehicle = Object.assign({}, v.mode); pl.setRot(r); lift = 0; takeoff = v.takeoff || 0;
    v.onMount && v.onMount();
    if (v.type === 'balloon') { ctx.sfx('burner'); say(v, `${ICON.balloon} Bay lên ngắm toàn cảnh! <b>Space/⬆</b> lên · <b>C/⬇</b> xuống · chạm đất bấm <b>E</b> để rời`, 4500); }
    else if (v.type === 'bike') { ctx.sfx('bell'); myStyle = v.style; try { localStorage.setItem('island.bike', myStyle); } catch (e) {} say(v, `🚲 <b>${v.info.name}</b> (${v.info.from})<br>${v.info.fact}<br><small><b>Shift</b> nhanh · <b>V</b> đổi xe · <b>R</b> chuông · <b>E</b> xuống</small>`, 5500); }
    else if (v.type === 'boat') { ctx.sfx('splash'); say(v, v.hello || '⛵ Chèo thuyền ra biển! Cập bờ rồi bấm <b>E</b> để lên bờ', v.hello ? 7000 : 3500); }   // v.hello: thuyền buồm / ca nô (sea/pilot.js)
    else if (v.hello) say(v, v.hello, 5500);
    setUI();
  }
  function dismount(land) {
    if (!cur) return; const v = cur, g = v.group;
    if (v.mode.fly && !(pl.grounded && sup(pl.pos.x, pl.pos.z, pl.pos.y) > W)) { ctx.toast('Hạ xuống chạm đất rồi mới xuống nhé (C/⬇)', 2200); return; }
    cur = null; pl.root.remove(g); pl.root.rotation.z = pl.root.rotation.x = 0; pl.vehicle = null; rideReset(pl.hero);
    const r = pl.rot, p = pl.pos;
    g.rotation.set(0, r, 0); scene.add(g);
    if (v.type === 'boat') { g.position.set(p.x, waterY(p.x, p.z), p.z); pl.teleport(land[0], land[1], sup(land[0], land[1], 9)); ctx.sfx('splash'); }
    else if (v.type === 'bike') g.position.set(p.x + Math.cos(r) * 0.9, supB(p.x, p.z, p.y), p.z - Math.sin(r) * 0.9);
    else { g.position.set(p.x, p.y, p.z); const sx = p.x + Math.cos(r) * (v.side || 1.4), sz = p.z - Math.sin(r) * (v.side || 1.4); pl.teleport(sx, sz, supB(sx, sz, p.y)); }
    v.onDismount && v.onDismount();
    setUI();
  }
  // vật gần nhất có thể cưỡi (trong bán kính v.r của nó)
  const nearestAny = () => { let best = null, bd = 1e9; for (const v of all) if (v !== cur && v.group.parent === scene && v.group.visible !== false) { const d = Math.hypot(v.group.position.x - pl.pos.x, v.group.position.z - pl.pos.z); if (d < (v.r || 2.6) && d < bd && Math.abs(v.group.position.y - pl.pos.y) < 3) { bd = d; best = v; } } return best; };
  const nearest = (type, R) => { let best = null, bd = R; for (const v of all) if (v.type === type && v !== cur && v.group.parent === scene) { const d = Math.hypot(v.group.position.x - pl.pos.x, v.group.position.z - pl.pos.z); if (d < bd && Math.abs(v.group.position.y - pl.pos.y) < 3) { bd = d; best = v; } } return best; };
  const onLand = () => sup(pl.pos.x, pl.pos.z, pl.pos.y) > W - 0.3;
  const bring = v => { register(v); if (v.group.parent) v.group.parent.remove(v.group); v.group.position.copy(pl.pos); v.group.rotation.set(0, pl.rot, 0); scene.add(v.group); return v; };
  // lý do không lên xe/khinh khí cầu được lúc này (null = được) → nút mờ + tooltip, bấm thì báo
  const why = type => cur ? (cur.type === type ? null : '🚶 Xuống phương tiện đang đi trước đã') : pl.vehicle ? '🚶 Xuống phương tiện đang đi trước đã' : pl.frozen ? '⏳ Đang bận' : (ctx.dive && ctx.dive.swimming) || !onLand() ? '🌊 Đang ở dưới nước — lên bờ rồi mới đi ' + (type === 'bike' ? 'xe đạp' : 'khinh khí cầu') : null;
  const deny = type => { const r = why(type); if (r) ctx.toast(r, 2200); return !!r; };
  // 🔒 phương tiện cần mở khoá ở 🛒 Cửa hàng (economy/): xe đạp đi học tặng sẵn; xe/khinh khí cầu đặt sẵn ngoài đường vẫn đi thử được
  const owns = id => !ctx.eco || ctx.eco.owns(id);
  function toggleBike(style) {
    if (Number.isInteger(style) && !owns('bike-' + style)) return ctx.eco.locked('bike-' + style);   // chưa mở khoá: mời ra 🛒 trước
    if (cur && cur.type === 'bike') return dismount();
    if (deny('bike') || !pl.grounded) return;
    if (Number.isInteger(style)) myStyle = style;
    let v = Number.isInteger(style) ? null : nearest('bike', 4);
    if (!v) { if (!owns('bike-' + myStyle)) myStyle = 0; if (!mine.bike || mine.bike.style !== myStyle) mine.bike = makeBike(myStyle); v = bring(mine.bike); }
    mount(v);
  }
  function nextStyle(d = 1) { // đổi sang kiểu xe khác ngay khi đang đạp
    if (!cur || cur.type !== 'bike') return;
    let ns = cur.style; for (let k = 0; k < BIKES.length; k++) { ns = (ns + d + BIKES.length) % BIKES.length; if (owns('bike-' + ns)) break; }
    if (ns === cur.style) return ctx.toast('🔒 Mở khoá thêm kiểu xe đạp ở <b>🛒 Cửa hàng</b> (nút 🎒 → 🛒)', 3000);
    const old = cur, nb = makeBike(ns); pl.root.remove(old.group); all.splice(all.indexOf(old), 1);
    if (mine.bike === old) mine.bike = null; register(nb); scene.remove(nb.group); cur = null; pl.vehicle = null;
    nb.group.position.copy(pl.pos); nb.group.rotation.set(0, pl.rot, 0); scene.add(nb.group); mount(nb);
  }
  function toggleBalloon() {
    if (cur && cur.type === 'balloon') return dismount();
    if (deny('balloon')) return;
    if (!pl.grounded) return ctx.toast(`${ICON.balloon} Đứng vững trên mặt đất rồi bấm lại để thả khinh khí cầu nhé!`, 2200);   // trước đây bấm không phản hồi gì
    if (!owns('ride-balloon') && !nearest('balloon', 6)) return ctx.eco.locked('ride-balloon');
    if (pl.pos.y > 0.9 && Math.max(ctx.groundExtra ? ctx.groundExtra(pl.pos.x, pl.pos.z, pl.pos.y) : -99, boxTop(pl.pos.x, pl.pos.z, pl.pos.y)) > pl.pos.y - 0.3 && (ctx.boxes || []).some(b => pl.pos.x > b.x0 - 3 && pl.pos.x < b.x1 + 3 && pl.pos.z > b.z0 - 3 && pl.pos.z < b.z1 + 3 && b.top > pl.pos.y + 1)) { ctx.toast(`${ICON.balloon} Chỗ này chật quá, ra chỗ trống để thả khinh khí cầu!`, 2200); return; }
    const v = nearest('balloon', 6) || bring(mine.balloon || (mine.balloon = balloon()));
    mount(v);
  }
  function ring() { if (cur && cur.type === 'bike' && bellT <= 0) { bellT = 0.5; ctx.sfx('bell'); } }
  function findAround(test, r0, r1) {
    for (let r = r0; r <= r1; r += 0.75) for (let k = 0; k < 12; k++) { const a = pl.rot + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 6; const x = pl.pos.x + Math.sin(a) * r, z = pl.pos.z + Math.cos(a) * r; if (test(x, z)) return [x, z]; }
    return null;
  }
  const landOK = (x, z) => { const h = sup(x, z, 9); return h > W + 0.15 && h < W + 3.2 && !(ctx.boxes || []).some(b => x > b.x0 - 0.4 && x < b.x1 + 0.4 && z > b.z0 - 0.4 && z < b.z1 + 0.4 && b.top > h + 0.5); };
  function boardBoatAt(pt) {
    let v = nearest('boat', 7);
    if (!v) { v = register(mine.boat || (mine.boat = boat('#3fa36b'))); if (v.group.parent) v.group.parent.remove(v.group); v.group.position.set(pt[0], 0, pt[1]); v.group.rotation.set(0, Math.atan2(pt[0] - pl.pos.x, pt[1] - pl.pos.z), 0); scene.add(v.group); }
    mount(v);
  }

  // phím tắt + nút
  const blocked = () => ctx.freeCam || ctx.mapOpen || document.body.classList.contains('rs-modal');
  addEventListener('keydown', e => {
    if (e.repeat || blocked()) return;
    // T khinh khí cầu (F dành cho đũa phép — academy/magic.js; H huýt sáo gọi thú cưỡi — mounts.js)
    if (e.code === 'KeyX') toggleBike(); else if (e.code === 'KeyT') toggleBalloon(); else if (e.code === 'KeyR') ring(); else if (e.code === 'KeyV') nextStyle(e.shiftKey ? -1 : 1);
  });
  const tap = (id, fn) => ui(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  tap('bBike', toggleBike); tap('bBalloon', toggleBalloon); tap('bBell', ring); tap('bStyle', () => nextStyle(1));
  const held = { up: false, down: false };
  for (const [id, k] of [['bUp', 'up'], ['bDown', 'down']]) { const b = ui(id); b.addEventListener('pointerdown', e => { e.preventDefault(); held[k] = true; }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { held[k] = false; }); }
  const keys = new Set(); addEventListener('keydown', e => keys.add(e.code)); addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());

  // ---------- Vệt nước sau thuyền ----------
  const NW = 60, wg = new THREE.BufferGeometry(), wp = new Float32Array(NW * 3), wl = new Float32Array(NW);
  wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); wg.setAttribute('life', new THREE.BufferAttribute(wl, 1));
  const wake = new THREE.Points(wg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    vertexShader: 'attribute float life; varying float vL; void main(){ vL = life; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (1.6-life) * 300. / -mv.z * step(0.001, life); }',
    fragmentShader: 'varying float vL; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(1.,1.,1., smoothstep(.5,.3,d)*smoothstep(.15,.3,d)*vL*0.8); }' }));
  wake.frustumCulled = false; scene.add(wake); let wi = 0;

  let scanT = 0, edge = null, landPt = null, cullT = 0, lastRot = null, splashT = 0, cad = 0, vy = 0, steer = 0; const vySt = { v: 0 }, steerSt = { v: 0 };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const BALLOON_RIDE = { hand: pl.root, hands: [V3(0.4, 1.3, 0.42), V3(-0.4, 1.3, 0.42)] };
  const reins = M => { const y = M.seat || 0, z = M.seatZ || 0; return { hand: pl.root, hands: [V3(0.12, y + 0.38, z + 0.36), V3(-0.12, y + 0.38, z + 0.36)], foot: pl.root, feet: [V3(0.3, y - 0.42, z + 0.12), V3(-0.3, y - 0.42, z + 0.12)], lean: 0.15 }; };
  const boardEdge = () => edge && boardBoatAt(edge), goLand = () => landPt && dismount(landPt);   // tạo 1 lần, không tạo hàm mới mỗi khung
  function update(dt) {
    clock += dt; if (!townDone) placeTown();
    bellT -= dt;
    const p = pl.pos, V = pl.vehicle;
    if ((cullT -= dt) <= 0) { cullT = 0.5; for (const v of all) if (v !== cur && v.group.parent === scene) v.group.visible = Math.hypot(v.group.position.x - p.x, v.group.position.z - p.z) < (v.far || 50); }
    for (const v of all) if (v !== cur && v.type === 'boat' && v.group.visible) { const g = v.group; g.position.y = waterY(g.position.x, g.position.z); g.rotation.z = Math.sin(clock * 1.3 + g.position.x) * 0.04; g.rotation.x = Math.sin(clock * 1.7 + g.position.z) * 0.03; }
    for (let i = 0; i < NW; i++) if (wl[i] > 0) wl[i] = Math.max(0, wl[i] - dt * 0.55);
    wg.attributes.life.needsUpdate = true;

    if (!cur) {
      if (pl.frozen) return;
      const v = nearestAny(); if (v) { if (v.offer) v.offer(); else ctx.offer(v.label, () => v.type === 'balloon' ? toggleBalloon() : mount(v), 3); } // thú cưỡi tự quyết định nhãn (thuần phục / cưỡi)
      if ((scanT -= dt) <= 0) { dimUI(); scanT = 0.25; edge = onLand() && p.y < W + 3.5 && pl.grounded ? findAround(isWater, 1.5, 4.5) : null; }
      if (edge) ctx.offer('⛵ Lên thuyền', boardEdge, 1);
      return;
    }
    const sp = pl.speed, M = cur.mode;
    // Shift / nút Nhanh: tăng tốc
    const fast = keys.has('ShiftLeft') || keys.has('ShiftRight') || pl.input.run;
    V.speed = M.speed * (fast && M.boost ? M.boost : 1);
    // bay: Space/⬆ lên, C/Ctrl/⬇ xuống
    if (M.fly) {
      const up = keys.has('Space') || held.up, down = keys.has('KeyC') || keys.has('ControlLeft') || keys.has('KeyQ') || held.down;
      takeoff -= dt; const want = takeoff > 0 ? M.climb * 0.9 : up ? M.climb : down ? -M.climb : 0; lift += (want - lift) * Math.min(1, dt * 3); V.lift = lift;
      ctx.altitude = Math.round(p.y);
    }
    // nghiêng khi rẽ
    const wr = lastRot === null ? 0 : wrapAngle(pl.rot - lastRot) / Math.max(dt, 1e-3), acc = (sp - lastSp) / Math.max(dt, 1e-3); // tốc độ rẽ (rad/s), gia tốc
    lastRot = pl.rot; lastSp = sp;
    lean = damp(lean, THREE.MathUtils.clamp(-wr * sp * 0.035, -0.4, 0.4), leanSt, T.quick, dt); // nghiêng vào cua (lò xo)
    if (cur.type === 'bike') {
      for (const w of cur.wheels) w.m.rotation.x += sp * dt / w.r;
      // nhịp đạp khớp bánh dẫn (ride-pose.js: quãng đường / (chu vi × tỉ số líp), ≤ 1,5 vòng/s); líp tự do: thả ga / xuống dốc thì ngừng đạp
      const Rd = cur.ride, dy = (p.y - (update.py ?? p.y)) / Math.max(dt, 1e-3); update.py = p.y; vy = damp(vy, dy, vySt, T.soft, dt);
      const coast = !Rd.fixed && ((pl.mag ?? 1) < 0.05 || (vy < -1.2 && sp > 2));
      cad += ((coast || sp < 0.05 ? 0 : cadence(sp, cur.wheels[Rd.drive].r, Rd.gear)) - cad) * Math.min(1, dt * (Rd.fixed ? 8 : 2.6)); cur.crank.rotation.x += cad * 2 * Math.PI * dt;
      steer = damp(steer, THREE.MathUtils.clamp(wr * 0.09, -0.45, 0.45), steerSt, T.quick, dt); if (Rd.steer) Rd.steer.rotation.y = steer; if (Rd.fork) Rd.fork.rotation.y = steer;
      pl.root.rotation.z = cur.lean ? lean : 0;
      pitch = damp(pitch, THREE.MathUtils.clamp(-acc * 0.012, -0.06, 0.04), pitchSt, T.soft, dt); pl.root.rotation.x = pitch; // phanh: chúi đầu xe nhẹ
      ridePose(pl.hero, pl.root, Rd);   // tay nắm ghi đông, chân bám bàn đạp, thân nghiêng
      ctx.offer('🚶 Xuống xe', dismount, 0.5);
      if (pl.hitWater) { pl.hitWater = false; if (clock > (update.waterT ?? 0)) { update.waterT = clock + 3; ctx.toast('🌊 Xe không chạy dưới nước — đi thuyền ⛵ hoặc xuống xe bơi nhé!', 2600); } } // player.js chặn ở mép nước + bật lùi
    } else if (cur.type === 'boat') {
      rowT += dt * (0.8 + Math.min(1, sp / 3) * 2.2) * (sp > 0.3 ? 1 : 0.25);
      for (let i = 0; i < cur.oars.length; i++) { const o = cur.oars[i], s = i ? 1 : -1; o.rotation.y = s * Math.sin(rowT * 2) * 0.55; o.rotation.z = s * (Math.cos(rowT * 2) * 0.18 - 0.05); }
      if (cur.oars.length && sp > 0.6 && Math.sin(rowT * 2) > 0.95 && splashT < clock) { splashT = clock + 0.5; ctx.sfx('splash'); }
      // dập dềnh + nghiêng ra ngoài khi rẽ + ngóc mũi khi tăng tốc (lò xo, không giật)
      roll = damp(roll, THREE.MathUtils.clamp(wr * sp * 0.025, -0.12, 0.12), rollSt, T.soft, dt); pitch = damp(pitch, THREE.MathUtils.clamp(-acc * 0.04, -0.08, 0.06), pitchSt, T.slow, dt);
      pl.root.rotation.z = Math.sin(clock * 1.3 + p.x) * 0.05 + roll; pl.root.rotation.x = Math.sin(clock * 1.7 + p.z) * 0.035 + pitch;
      if (sp > 0.5 && (wakeT -= dt) <= 0) { wakeT = 0.07; const i = wi++ % NW, r = pl.rot; wp[i * 3] = p.x - Math.sin(r) * 1.6 + (Math.random() - 0.5) * 0.5; wp[i * 3 + 1] = W + 0.05; wp[i * 3 + 2] = p.z - Math.cos(r) * 1.6 + (Math.random() - 0.5) * 0.5; wl[i] = 1; wg.attributes.position.needsUpdate = true; }
      if ((scanT -= dt) <= 0) { scanT = 0.25; landPt = findAround(landOK, 1.2, 3.6); }
      cur.tick && cur.tick(dt, sp);   // thuyền buồm theo gió, ca nô (sea/pilot.js): tốc độ, nghiêng theo sóng thật
      if (landPt) ctx.offer('🏝️ Lên bờ', goLand, 4);
    } else if (cur.type === 'balloon') {
      const burning = lift > 0.5; cur.flame.visible = burning || Math.random() < 0.05; cur.flame.scale.set(1, (burning ? 1 : 0.4) * (0.8 + Math.random() * 0.4), 1);
      if (burning && (burnT -= dt) <= 0) { burnT = 0.9; ctx.sfx('burner'); }
      roll = damp(roll, THREE.MathUtils.clamp(wr * 0.05, -0.06, 0.06), rollSt, T.lazy, dt); pitch = damp(pitch, THREE.MathUtils.clamp(-acc * 0.03, -0.05, 0.05), pitchSt, T.lazy, dt); // giỏ treo đung đưa theo quán tính
      pl.root.rotation.z = Math.sin(clock * 0.7) * 0.03 + (pl.speed / 6.5) * 0.02 + roll; pl.root.rotation.x = Math.sin(clock * 0.5) * 0.02 + pitch;
      ridePose(pl.hero, pl.root, BALLOON_RIDE);   // hai tay nắm dây treo giỏ phía trước
      if (pl.grounded && sup(p.x, p.z, p.y) > W) ctx.offer(ICON.balloon + ' Rời khinh khí cầu', dismount, 4);
    } else {
      cur.tick && cur.tick(dt, sp, { lean, lift, clock, fast, grounded: pl.grounded });
      ridePose(pl.hero, pl.root, cur.ride || (cur.ride = reins(M)));   // thú cưỡi: tay cầm cương, chân đặt bàn đạp yên (dạng chân hai bên)
      if (!M.fly || (pl.grounded && sup(p.x, p.z, p.y) > W)) ctx.offer(cur.bye || '🚶 Xuống', dismount, M.fly ? 4 : 0.5);
    }
  }
  // xuống ngay (dịch chuyển 🏫): để phương tiện tại chỗ (bay → hạ xuống mặt đất/nước bên dưới), không kiểm tra đã chạm đất
  function forceOff() { if (!cur) return; const v = cur, g = v.group, p = pl.pos; cur = null; pl.root.remove(g); pl.root.rotation.z = pl.root.rotation.x = 0; pl.vehicle = null; rideReset(pl.hero);
    g.rotation.set(0, pl.rot, 0); g.position.set(p.x, v.type === 'boat' ? waterY(p.x, p.z) : Math.max(supB(p.x, p.z, p.y), W), p.z); scene.add(g); v.onDismount && v.onDismount(); setUI(); }
  const self = { update, all, register, get current() { return cur; }, get riding() { return cur && cur.type; }, mount, dismount, forceOff, toggleBike, toggleBalloon, nextStyle, sup, setUI, keys, held,
    get tris() { return { bike: BIKES.map((b, i) => makeBike(i).tris), boat: makeBoat('#fff').tris, balloon: makeBalloon().tris }; } };
  ctx.vehicles = self;
  setUI();
  return self;
}
