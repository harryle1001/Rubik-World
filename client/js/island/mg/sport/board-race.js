// mg/sport/board-race.js — ĐUA VÁN BẠC: chơi NGAY TRONG thế giới mở (inPlace, mg/host.js lo HUD/kỷ lục/thoát).
// 3 đường đua: 🌊 Ven biển Bạc (vòng quanh đảo sát mặt nước) · ⛰ Hẻm Đá Bạc (hẻm núi đá giữa biển tây nam, 2 vòng) · ☁️ Vòng Mây Pha Lê
// (quanh hào nước rồi xoắn lên trên mây quanh Học viện). Cổng sáng cách nhau 55 m, đường tăng tốc, đá cản, 3 "cổng kiến thức"
// (bay qua cổng có đáp án đúng → tăng tốc), 3–4 NPC bám đường có AI (né đá, ăn tăng tốc, dây chun theo người chơi).
// Có server: thấy ván + tiến độ của bạn khác trên cùng đường (net.js 'sb'); không có: đua với NPC.
// Draw call thêm khi đua: cổng 1 + tăng tốc 1 + đá 1 + vách/mây 1 + cổng đố 1 + 3 nhãn + cổng xuất phát 2 + mỗi NPC (ván 2 + vệt 1 + người).
import * as THREE from 'three';
import { PHI, ACADEMY } from '../../layout.js';
import { CFG } from '../../config.js';
import { quiz } from '../quiz.js';
import { kidKinds, sportLook } from './kit.js';
import { BOARD_COLORS, cupPoints } from '../../silver-board.js';

const W = CFG.island.waterLevel, GAP = 55, RING_R = 4.2, STANCE = -1.1, CROUCH = 0.13;   // STANCE/CROUCH: như silver-board.js
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (r, dt) => 1 - Math.exp(-r * dt), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const fmt = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const CUP = ['', '🥇', '🥈', '🥉'];
const Tq = (q, a, w1, w2, why) => ({ q, a, choices: [a, w1, w2].sort(() => Math.random() - 0.5), why });
// câu hỏi vật lý gắn với chính tấm ván: quán tính · lực hướng tâm · phản xạ ánh sáng
const PHYS = [
  () => Tq('Thả ga, ván vẫn trôi tiếp là do?', 'quán tính', 'trọng lực', 'ma sát', 'Quán tính: vật giữ nguyên chuyển động khi không có lực cản.'),
  () => Tq('Cua gấp, ván nghiêng về phía nào?', 'vào trong', 'ra ngoài', 'không nghiêng', 'Nghiêng vào trong để có lực hướng tâm kéo về tâm vòng cua.'),
  () => Tq('Gương phẳng: góc phản xạ … góc tới', 'bằng', 'lớn hơn', 'nhỏ hơn', 'Định luật phản xạ: góc phản xạ = góc tới.'),
  () => Tq('Cua càng nhanh, lực hướng tâm cần càng…', 'lớn', 'nhỏ', 'không đổi', 'F = m·v²/r: tốc độ gấp đôi thì lực gấp bốn.'),
  () => Tq('Mặt ván bạc soi được mây vì nó…', 'nhẵn bóng', 'màu xám', 'rất nặng', 'Mặt nhẵn phản xạ ánh sáng đều như gương.'),
  () => Tq('Xe phanh gấp, người ngả về…', 'phía trước', 'phía sau', 'bên trái', 'Do quán tính, người vẫn muốn chuyển động tiếp về phía trước.'),
];

// ---------- 3 đường đua: điểm khống chế [x, y, z] trong toạ độ thế giới ----------
const TRACKS = {
  coast: { name: '🌊 Ven biển Bạc', hint: 'lướt sát mặt biển quanh đảo', laps: 1, closed: true, rock: '#a9b9cc',
    pts(ctx) {
      const N = 34, rr = [], out = [];
      for (let k = 0; k < N; k++) { const th = k / N * 6.2832, ux = Math.cos(th), uz = Math.sin(th); let rs = 89; for (let r = 89; r <= 377; r += 5) if (ctx.terrain.heightAt(ux * r, uz * r) > W + 0.3) rs = r; rr.push(rs + 30); }
      for (let j = 0; j < N; j++) { const k = (j + 9) % N, a = rr[(k + N - 1) % N], b = rr[k], c = rr[(k + 1) % N], r = (Math.max(a, b, c) + a + b + c) / 4, th = k / N * 6.2832; out.push([Math.cos(th) * r, W + 1.3 + (j % 8 === 5 ? 3.4 : 0), Math.sin(th) * r]); }
      return out;
    } },
  canyon: { name: '⛰ Hẻm Đá Bạc', hint: 'luồn giữa hai vách đá · 2 vòng', laps: 2, closed: true, wall: 9.5, rock: '#b9bfd6',
    pts: () => [[-262, 96], [-300, 122], [-350, 110], [-400, 140], [-440, 190], [-420, 245], [-365, 262], [-320, 230], [-335, 185], [-290, 160]].map(([x, z], k) => [x, W + 2.2 + 2.2 * (1 + Math.sin(k * 1.9)), z]) },
  cloud: { name: '☁️ Vòng Mây Pha Lê', hint: 'quanh Học viện, xoắn lên trên mây', laps: 1, closed: false, clouds: true, rock: '#c3b8ea',
    pts: () => { const [cx, cz] = ACADEMY.c; return [[-15, 2, 200], [-15, 2, 130], [40, 2.5, 95], [140, 3, 88], [180, 3, 40], [180, 3, -70], [140, 4, -150], [0, 4, -156], [-130, 4, -153], [-178, 5, -90], [-178, 8, 40], [-120, 14, 95], [-40, 26, 110], [60, 44, 90], [140, 64, 30], [150, 80, -40], [90, 90, -120], [0, 94, -140], [-90, 92, -120], [-150, 86, -40], [-130, 72, 50], [-60, 50, 110], [-15, 24, 150], [-15, 4, 215]].map(([dx, y, dz]) => [cx + dx, W + y, cz + dz]); } },
};
const ORDER = ['coast', 'canyon', 'cloud'];

function start(ctx, { api, track: want }) {
  const board = ctx.silverBoard, P = board.pos, mobile = CFG.isMobile, root = api.root; root.position.set(0, 0, 0); root.rotation.set(0, 0, 0);
  if (!board.riding && !board.summon(true)) { setTimeout(() => api.exit(), 0); return { update() {}, dispose() {} }; }
  const home = { x: P.x, y: P.y, z: P.z, yaw: board.yaw };
  ctx.camera.far = Math.max(ctx.camera.far, 500); ctx.camera.updateProjectionMatrix();   // đua giữa thế giới mở: giữ tầm nhìn đầy đủ (host cắt còn 233 m làm thủng vòm trời)
  let state = 'lobby', tr = null, id = '', X, Y, Z, n = 0, L = 0, ds = 3, total = 0, t = 0, cd = 0, loadT = 0, idx = 0, sAbs = 0, prevS = 0, offT = 0, wallT = 0, emitT = 0, hudT = 0, pen = 0, hits = 0, combo = 0, right = 0, place = 1, auto = false, result = null, msgT = 0;
  let gates = [], pads = [], rocks = [], qz = [], qi = 0, curQ = null, rivals = [], rings, padIM, rockIM, wallIM, cloudIM, qIM, labels = [], startG = null;
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), e3 = new THREE.Euler(0, 0, 0, 'YXZ'), col = new THREE.Color(), col2 = new THREE.Color('#4ff0ff'), o3 = { x: 0, y: 0, z: 0, yaw: 0, tx: 0, tz: 1 };
  const grade = load('island.grade', 0) || 3, level = grade <= 2 ? 1 : grade <= 4 ? 2 : 3;
  const best = load('sb.best', {}), cups = load('sb.cups', {});

  // ---------- đường đua: lấy mẫu spline mỗi ~3 m ----------
  // vị trí tại quãng s (m, tính trong 1 vòng), lệch ngang lat (m, + = bên phải): ghi vào o3 { x, y, z, yaw, tx, tz }
  function at(s, lat = 0, o = o3) {
    let f = s / ds; if (tr.closed) f = ((f % n) + n) % n; else f = clamp(f, 0, n - 1.001);
    const i = Math.floor(f), j = tr.closed ? (i + 1) % n : i + 1, u = f - i, tx = X[j] - X[i], tz = Z[j] - Z[i], l = Math.hypot(tx, tz) || 1;
    o.tx = tx / l; o.tz = tz / l; o.yaw = Math.atan2(tx, tz);
    o.x = X[i] + tx * u - o.tz * lat; o.y = Y[i] + (Y[j] - Y[i]) * u; o.z = Z[i] + tz * u + o.tx * lat; return o;
  }
  function sample() {
    const curve = new THREE.CatmullRomCurve3(tr.pts(ctx).map(p => new THREE.Vector3(p[0], p[1], p[2])), tr.closed, 'centripetal');
    L = curve.getLength(); n = Math.round(L / 3); const pts = curve.getSpacedPoints(tr.closed ? n : n - 1); ds = L / (tr.closed ? n : n - 1);
    X = new Float32Array(n); Y = new Float32Array(n); Z = new Float32Array(n);
    for (let i = 0; i < n; i++) { X[i] = pts[i].x; Y[i] = pts[i].y; Z[i] = pts[i].z; }
    total = L * tr.laps;
  }
  // nâng đường lên trên đất/nóc nhà (sau khi vùng đó đã dựng xong) rồi làm mượt → NPC và trợ độ cao không bao giờ xuyên vật
  function clearance() {
    const need = new Float32Array(n), a = new Float32Array(n), ix = i => tr.closed ? (i + n) % n : clamp(i, 0, n - 1);
    for (let i = 0; i < n; i++) need[i] = Math.max(Y[i], board.floorAt(X[i], Z[i]) + 1.6);
    for (let i = 0; i < n; i++) { let m = 0; for (let k = -5; k <= 5; k++) m = Math.max(m, need[ix(i + k)]); a[i] = m; }
    for (let i = 0; i < n; i++) { let s = 0; for (let k = -5; k <= 5; k++) s += a[ix(i + k)]; Y[i] = Math.max(s / 11, need[i]); }
  }

  // ---------- dựng cổng, đường tăng tốc, đá, vách, mây, cổng kiến thức ----------
  const basic = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
  function setIM(im, i, x, y, z, yaw, sx, sy, sz, rx = 0) { e3.set(rx, yaw, 0); q4.setFromEuler(e3); m4.compose(v3.set(x, y, z), q4, s3.set(sx, sy, sz)); im.setMatrixAt(i, m4); }
  function build() {
    const rnd = (i, k = 1) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
    // cổng kiến thức ở 30 % · 55 % · 80 % vòng (đường nhiều vòng: mỗi vòng 1–2 cổng)
    qz = (tr.laps > 1 ? [0.45, 0.85] : [0.3, 0.55, 0.8]).map(f => ({ s: Math.round(f * L / GAP) * GAP + GAP / 2, done: -1 }));
    gates = []; pads = []; rocks = [];
    for (let s = 34, i = 0; s < L - 21; s += GAP, i++) {
      if (qz.some(q => Math.abs(q.s - s) < GAP * 0.9)) continue;
      const lo = (rnd(i) - 0.5) * (tr.wall ? 7 : 9); at(s, lo); gates.push({ s, lo, x: o3.x, y: o3.y, z: o3.z, yaw: o3.yaw, lap: -1 });
      if (i % 3 === 1) pads.push({ s: s + GAP * 0.5, lo: (rnd(i, 2) - 0.5) * 8, lap: -1 });
      else if (i % 3 === 2) rocks.push({ s: s + GAP * 0.5, lo: (rnd(i, 3) < 0.5 ? -1 : 1) * (1.5 + rnd(i, 4) * 3), r: 1 + rnd(i, 5) * 0.6, cool: 0 });
    }
    rings = new THREE.InstancedMesh(new THREE.TorusGeometry(RING_R, 0.24, 6, 21), basic('#ffffff'), gates.length); rings.frustumCulled = false;
    gates.forEach((g, i) => { setIM(rings, i, g.x, g.y, g.z, g.yaw, 1, 1, 1); rings.setColorAt(i, col.set('#ffd24a')); }); root.add(rings);
    // đường tăng tốc: 3 mũi tên chữ V nằm ngang, chỉ theo hướng đua
    const sh = new THREE.Shape(); sh.moveTo(0, 1.3); sh.lineTo(1.6, -0.5); sh.lineTo(1.6, -1.3); sh.lineTo(0, 0.4); sh.lineTo(-1.6, -1.3); sh.lineTo(-1.6, -0.5); sh.closePath();
    padIM = new THREE.InstancedMesh(new THREE.ShapeGeometry(sh).rotateX(Math.PI / 2), basic('#4ff0ff', { side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false }), Math.max(1, pads.length * 3)); padIM.frustumCulled = false;
    pads.forEach((p, i) => { for (let k = 0; k < 3; k++) { at(p.s + k * 2.6, p.lo); if (!k) { p.x = o3.x; p.y = o3.y; p.z = o3.z; } setIM(padIM, i * 3 + k, o3.x, o3.y - 0.3, o3.z, o3.yaw, 1, 1, 1); } }); padIM.count = pads.length * 3; root.add(padIM);
    // đá cản lơ lửng (đụng → chậm lại)
    rockIM = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), api.mat(tr.rock), Math.max(1, rocks.length)); rockIM.frustumCulled = false; rockIM.castShadow = true;
    rocks.forEach((r, i) => { at(r.s, r.lo); r.x = o3.x; r.y = o3.y - 0.2; r.z = o3.z; setIM(rockIM, i, r.x, r.y, r.z, i * 2.4, r.r, r.r * 1.25, r.r, i); }); rockIM.count = rocks.length; root.add(rockIM);
    // vách hẻm núi: chóp đá 6 cạnh hai bên đường, cao 8–21 m
    if (tr.wall) {
      const N = Math.floor(L / 6.5) * 2; wallIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.36, 1, 1, 6).translate(0, 0.5, 0), api.mat('#ffffff'), N); wallIM.frustumCulled = false;
      for (let i = 0; i < N; i++) { const sd = i % 2 ? 1 : -1, s = (i >> 1) * 6.5 + sd; at(s, sd * (tr.wall + 2.6 + rnd(i, 6) * 3)); const h = 8 + rnd(i, 7) * 13, w = 2.6 + rnd(i, 8) * 1.6; setIM(wallIM, i, o3.x, -6, o3.z, i, w, h + 6, w, 0); wallIM.setColorAt(i, col.setHSL(0.6, 0.16, 0.66 + rnd(i, 9) * 0.16)); }
      root.add(wallIM);
    }
    if (tr.clouds) {   // cụm mây quanh đoạn trên cao
      const N = mobile ? 34 : 55; cloudIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), basic('#ffffff', { transparent: true, opacity: 0.86, depthWrite: false }), N); cloudIM.frustumCulled = false;
      for (let i = 0; i < N; i++) { const s = L * (0.5 + 0.45 * i / N), sd = i % 2 ? 1 : -1; at(s, sd * (13 + rnd(i, 10) * 21)); const w = 5 + rnd(i, 11) * 8; setIM(cloudIM, i, o3.x, o3.y - 3 + (rnd(i, 12) - 0.5) * 10, o3.z, i, w, w * 0.45, w * 0.8); }
      root.add(cloudIM);
    }
    // cổng kiến thức: 3 vòng đỏ / vàng / lam + 3 nhãn đáp án (dùng lại cho cả 3 lần)
    qIM = new THREE.InstancedMesh(new THREE.TorusGeometry(3.4, 0.3, 6, 21), basic('#ffffff'), 3); qIM.frustumCulled = false; qIM.visible = false; root.add(qIM);
    ['#ff6b5e', '#ffd24a', '#5aa8ff'].forEach((c, i) => qIM.setColorAt(i, col.set(c)));
    labels = [0, 1, 2].map(i => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false })); sp.scale.set(7.5, 2.8, 1); sp.visible = false; sp.userData.c = c; root.add(sp); return sp; });
    // cổng xuất phát / đích: vòm nửa vòng + băng chữ
    at(0); startG = new THREE.Group(); startG.position.set(o3.x, Math.max(o3.y - 2, board.floorAt(o3.x, o3.z)), o3.z); startG.rotation.y = o3.yaw;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(7, 0.45, 6, 21, Math.PI), api.mat('#dfe6ee')); startG.add(arch);
    const bc = document.createElement('canvas'); bc.width = 512; bc.height = 96; const k = bc.getContext('2d'); k.fillStyle = '#1b1626'; k.fillRect(0, 0, 512, 96); for (let i = 0; i < 16; i++) { k.fillStyle = i % 2 ? '#fff' : '#1b1626'; k.fillRect(i * 32, 0, 32, 14); k.fillStyle = i % 2 ? '#1b1626' : '#fff'; k.fillRect(i * 32, 82, 32, 14); }
    k.fillStyle = '#ffe3a0'; k.font = 'bold 50px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('🏁 ' + tr.name.replace(/^\S+ /, ''), 256, 50, 490);
    const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace; const ban = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.7), basic('#fff', { map: bt, side: THREE.DoubleSide })); ban.position.y = 7.9; startG.add(ban); root.add(startG);
  }

  // ---------- NPC: bám đường, né đá, ăn tăng tốc, dây chun theo người chơi ----------
  const NAMES = ['Sao Băng', 'Gió Bấc', 'Sóng Xanh', 'Mây Tím', 'Chớp Vàng'], NCOL = ['#ff6b5e', '#3fe0b8', '#ffd24a', '#a98bff', '#5aa8ff'];
  function makeRivals() {
    const N = mobile ? 3 : 4, diff = level === 1 ? 0.9 : level === 2 ? 0.96 : 1;
    for (let i = 0; i < N; i++) {
      const g = board.makeBoard(NCOL[i]); g.rotation.order = 'YXZ'; const ref = new THREE.Object3D(); ref.rotation.y = STANCE; g.add(ref); root.add(g);
      const tl = board.makeTrail(); root.add(tl.mesh);
      const r = { name: NAMES[i], col: new THREE.Color(NCOL[i]), g, ref, tl, s: -4 - i * 3.4, lo: (i - (N - 1) / 2) * 3.2, loT: 0, v: 0, base: (20.5 + i) * diff, kick: 0, fin: 0, yaw: 0, roll: 0, actor: null, gi: 0, hold: 0 };
      r.loT = r.lo; rivals.push(r);
      api.actor(kidKinds[(i * 3 + 1) % kidKinds.length], { look: sportLook(i), name: r.name }).then(a => { if (a) r.actor = a; });
    }
  }
  function rivalUpdate(r, dt) {
    if (state === 'race' || (state === 'done' && !r.fin)) {
      const d = sAbs - r.s, rub = clamp(d / 144, -0.13, 0.16); r.kick = Math.max(0, r.kick - dt); r.hold = Math.max(0, r.hold - dt);
      const vt = r.hold > 0 ? r.base * 0.55 : r.base * (1 + rub) * (r.kick > 0 ? 1.4 : 1); r.v += (vt - r.v) * ease(r.kick > 0 ? 2 : 0.9, dt);
      const ps = ((r.s % L) + L) % L; r.s += r.v * dt; const cs = ((r.s % L) + L) % L, cross = gs => ps <= cs ? gs > ps && gs <= cs : gs > ps || gs <= cs;
      for (const g of gates) if (cross(((g.s - 30) % L + L) % L)) r.loT = g.lo + (Math.sin(r.s * 0.7 + r.base) * 1.6);
      for (const k of rocks) if (cross(((k.s - 26) % L + L) % L) && Math.abs(k.lo - r.loT) < 3) r.loT = k.lo + (k.lo > 0 ? -1 : 1) * 3.6;
      for (const p of pads) if (cross(p.s) && Math.sin(r.s + r.base * 7) > -0.2) r.kick = 1.6;
      for (const q of qz) if (cross(q.s)) { if (Math.sin(r.s * 1.3 + r.base * 5) > -0.3) r.kick = 2.6; else r.hold = 1.2; }
      if (tr.wall) r.loT = clamp(r.loT, -tr.wall + 2.5, tr.wall - 2.5);
      if (!r.fin && r.s >= total) { r.fin = t; }
    } else if (r.fin) { r.v *= 1 - ease(0.8, dt); r.s += r.v * dt; }
    r.lo += (r.loT - r.lo) * ease(1.3, dt);
    at(tr.closed ? r.s : Math.max(0, r.s), r.lo); if (!tr.closed && r.s < 0) { o3.x += o3.tx * r.s; o3.z += o3.tz * r.s; }
    const dy = wrap(o3.yaw - r.yaw); r.yaw += dy * ease(8, dt); r.roll += (clamp(-dy / Math.max(dt, 1e-3) * 0.5, -0.6, 0.6) - r.roll) * ease(3, dt);
    const bob = Math.sin(t * 2 + r.base * 9) * 0.12; r.g.position.set(o3.x, o3.y + bob, o3.z); r.g.rotation.set(0, r.yaw, r.roll); r.g.updateMatrixWorld(true);
    r.tl.feed(o3.x - o3.tx * 1.15, o3.y + bob + 0.02, o3.z - o3.tz * 1.15, -o3.tz, o3.tx, 0.22, r.col, 0.12 + 0.45 * Math.min(1, r.v / 30), 0, dt);
    const a = r.actor; if (a && a.hero) { a.model.position.copy(r.g.position); a.model.quaternion.copy(r.g.quaternion); const m = a.hero.model; m.position.set(0, 0.07 - CROUCH, 0); m.rotation.set(0, STANCE, 0); board.pose(a.hero, r.ref, 0.12 + Math.abs(r.roll) * 0.3, r.roll * 1.6); }
  }

  const note = (h, ms) => { if (!curQ) api.hud.msg(h, ms); };   // thông báo phụ: không đè lên câu hỏi đang hiện
  // ---------- cổng kiến thức ----------
  function showQuiz(q) {
    const kind = qi % 3; curQ = kind === 0 ? quiz('math', level) : kind === 1 ? quiz('vocab', level) : grade >= 3 ? PHYS[Math.floor(Math.random() * PHYS.length)]() : quiz('science', level); qi++;
    curQ.q0 = q; q.lanes = [-7, 0, 7];
    curQ.choices.forEach((c, i) => {
      at(q.s, q.lanes[i]); o3.y = Math.max(o3.y, board.floorAt(o3.x, o3.z) + 3); q.y = o3.y; setIM(qIM, i, o3.x, o3.y, o3.z, o3.yaw, 1, 1, 1);
      const sp = labels[i], cv = sp.userData.c, k = cv.getContext('2d'); k.clearRect(0, 0, 256, 96); k.fillStyle = ['#c8302c', '#b98a12', '#2a62b8'][i]; k.beginPath(); k.roundRect(4, 4, 248, 88, 26); k.fill(); k.strokeStyle = '#fff'; k.lineWidth = 5; k.stroke();
      k.fillStyle = '#fff'; k.font = 'bold 46px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(c, 128, 50, 236); sp.material.map.needsUpdate = true; sp.position.set(o3.x, o3.y + 5.2, o3.z); sp.visible = true;
    });
    qIM.instanceMatrix.needsUpdate = true; qIM.visible = true;
    api.hud.msg(`🧠 <b>${curQ.q}</b><br><small>Bay qua cổng có đáp án đúng để tăng tốc!</small>`, 0); api.sfx('open');
  }
  function answerQuiz(lat, y) {
    const q = curQ.q0; let pick = -1; for (let i = 0; i < 3; i++) if (Math.abs(lat - q.lanes[i]) < 3.6) pick = i;
    qIM.visible = false; labels.forEach(l => { l.visible = false; });
    if (pick < 0) { api.hud.msg(`🧠 Bỏ lỡ cổng kiến thức · ${curQ.why}`, 3400); combo = 0; }
    else if (curQ.choices[pick] === curQ.a) { right++; board.kick(3.4); api.hud.msg(`✅ <b>Đúng!</b> ${curQ.why} · ⚡ tăng tốc!`, 3400); api.sfx('win'); }
    else { board.slow(0.6); api.hud.msg(`❌ Chưa đúng. ${curQ.why}`, 3800); api.sfx('no'); }
    curQ = null; msgT = 3.4;
  }

  // ---------- sảnh chọn đường + bảng kỷ lục ----------
  function lobby() {
    state = 'lobby'; board.S.hold = true; api.hud.clearBar(); api.hud.time(null); api.hud.info(`🏆 Cúp: ${cupPoints()} điểm`);
    api.hud.msg(`🏁 <b>Đua ván bạc</b> — chọn đường đua. Bay qua <b>cổng sáng</b>, lấy <b>mũi tên tăng tốc</b>, né <b>đá</b>, vào <b>cổng có đáp án đúng</b>!<br><small>Về nhất 🥇 3 · nhì 🥈 2 · ba 🥉 1 điểm cúp → mở màu viền ván mới.</small>`, 0);
    for (const k of ORDER) { const T = TRACKS[k]; api.hud.button(`${T.name}<br><small>${best[k] ? '🏆 ' + fmt(best[k]) : T.hint}${cups[k] ? ' ' + CUP[cups[k]] : ''}</small>`, () => choose(k), k === (want || 'coast') ? 'pri' : ''); }
    const cb = api.hud.button(`🎨 ${board.color.name}`, b => { b.innerHTML = `🎨 ${board.nextColor().name}`; const nx = BOARD_COLORS.find(c => cupPoints() < c.need); if (nx) api.hud.msg(`🔒 Màu <b>${nx.name}</b> cần ${nx.need} điểm cúp (em có ${cupPoints()}).`, 3000); }, 'sm'); cb.title = 'Đổi màu viền ván';
  }
  function choose(k) {
    if (state !== 'lobby' || !TRACKS[k]) return; id = k; tr = TRACKS[k]; state = 'load'; loadT = 0; api.hud.clearBar(); api.hud.title(tr.name);
    api.hud.msg(`${tr.name} · đang bay tới vạch xuất phát…`, 0); sample();
    at(0); board.S.free = true; board.S.hold = true; board.S.noBoost = true; board.place(o3.x, Math.max(o3.y, board.floorAt(o3.x, o3.z) + 1), o3.z, o3.yaw);
  }
  function ready() {
    clearance(); build(); makeRivals(); at(0); board.place(o3.x, o3.y, o3.z, o3.yaw);
    idx = 0; sAbs = prevS = 0; t = 0; pen = hits = combo = right = 0; qi = 0; state = 'count'; cd = 3.6;
    board.S.onTrick = () => { if (state === 'race') { board.kick(0.8); note('✨ Nhào lộn đẹp! ⚡ +tăng tốc', 1300); } };
    if (!matchMedia('(pointer:coarse)').matches) { api.hud.button('🔄 Lộn vòng (Q)', () => board.trick('flip'), 'sm'); api.hud.button('🌀 Xoay 360° (Z)', () => board.trick('spin'), 'sm'); }   // điện thoại: đã có nút 🔄 🌀 ở cụm điều khiển ván
  }

  // ---------- người chơi: tiến độ, cổng, tăng tốc, đá, vách, lạc đường ----------
  function playerUpdate(dt) {
    // mẫu gần nhất quanh chỉ số cũ
    let bi = idx, bd = 1e9; for (let k = -3; k <= 13; k++) { let i = idx + k; if (tr.closed) i = (i + n) % n; else if (i < 0 || i >= n) continue; const d = (X[i] - P.x) ** 2 + (Z[i] - P.z) ** 2 + (Y[i] - P.y) ** 2 * 0.25; if (d < bd) { bd = d; bi = i; } }
    let di = bi - idx; if (tr.closed) { if (di < -n / 2) di += n; if (di > n / 2) di -= n; } idx = bi;
    at(bi * ds); const along = (P.x - o3.x) * o3.tx + (P.z - o3.z) * o3.tz, lat = -(P.x - o3.x) * o3.tz + (P.z - o3.z) * o3.tx;
    sAbs = Math.max(sAbs - 34, Math.min(total + 21, sAbs + di * ds)); const sNow = sAbs + along * 0;   // sAbs tính theo mẫu; along chỉ dùng cho lệch ngang
    const ps = ((prevS % L) + L) % L, cs = ((sNow % L) + L) % L, fwd = sNow > prevS, cross = gs => fwd && (ps <= cs ? gs > ps && gs <= cs : gs > ps || gs <= cs), lap = Math.floor(sNow / L);
    if (fwd) {
      for (let i = 0; i < gates.length; i++) { const g = gates[i]; if (g.lap >= lap || !cross(g.s)) continue; g.lap = lap;
        if (Math.hypot(lat - g.lo, P.y - g.y) < RING_R + 0.5) { hits++; combo++; board.kick(0.5 + Math.min(combo, 5) * 0.1); api.sfx('coin'); setIM(rings, i, g.x, g.y, g.z, g.yaw, 0, 0, 0); }
        else { pen += 1.5; combo = 0; if (msgT <= 0) note('⭕ Trượt cổng: +1,5 giây', 1200); rings.setColorAt(i, col.set('#7a7f8c')); rings.instanceColor.needsUpdate = true; }
        rings.instanceMatrix.needsUpdate = true; }
      for (const p of pads) if (p.lap < lap && cross(p.s) && Math.abs(lat - p.lo) < 3.4 && Math.abs(P.y - p.y) < 4) { p.lap = lap; board.kick(2.1); api.sfx('ok'); if (msgT <= 0) note('⚡ Tăng tốc!', 1000); }
      if (curQ && cross(curQ.q0.s)) answerQuiz(lat, P.y);
      for (const q of qz) if (!curQ && q.done < lap && cross(((q.s - 150) % L + L) % L)) { q.done = lap; showQuiz(q); }
      if (lap > Math.floor(prevS / L) && lap < tr.laps) { for (let i = 0; i < gates.length; i++) { const g = gates[i]; setIM(rings, i, g.x, g.y, g.z, g.yaw, 1, 1, 1); rings.setColorAt(i, col.set('#ffd24a')); } rings.instanceMatrix.needsUpdate = rings.instanceColor.needsUpdate = true; note(`🔁 Vòng ${lap + 1}/${tr.laps}`, 2000); }
    }
    prevS = Math.max(prevS, sNow);
    for (const r of rocks) { r.cool -= dt; if (r.cool <= 0 && (r.x - P.x) ** 2 + (r.y - P.y) ** 2 + (r.z - P.z) ** 2 < (r.r + 0.9) ** 2) { r.cool = 2; board.slow(0.45); combo = 0; api.sfx('hit'); note('💥 Đụng đá! Quán tính bị mất — tăng tốc lại nào.', 1600); const sd = lat > r.lo ? 1 : -1; P.x += -o3.tz * sd * 1.2; P.z += o3.tx * sd * 1.2; } }
    if (tr.wall && Math.abs(lat) > tr.wall) { const k = (Math.abs(lat) - tr.wall) * Math.sign(lat); P.x += o3.tz * k; P.z -= o3.tx * k; board.slow(1 - ease(1.2, dt)); if ((wallT -= dt) <= 0) { wallT = 2.5; note('⛰ Sát vách đá! Giữ ván giữa hẻm.', 1300); } }
    // lạc khỏi đường > 3 s → đưa về đường
    offT = Math.hypot(P.x - o3.x, P.z - o3.z) > 45 || Math.abs(P.y - o3.y) > 34 ? offT + dt : 0;
    if (offT > 3) { offT = 0; board.place(o3.x, o3.y, o3.z, o3.yaw); pen += 2; api.hud.msg('🧭 Lạc đường đua: quay về đường (+2 giây)', 2000); }
    // trợ độ cao + trợ lái nhẹ: nhìn trước theo tốc độ, hướng về cổng kế
    const look = 8 + board.speed * 0.5; at(bi * ds + look); board.S.assistY = o3.y;
    let tl = 0, best = 1e9; for (const g of gates) { if (g.lap >= lap) continue; const d = ((g.s - cs) % L + L) % L; if (d < best && d < 80) { best = d; tl = g.lo; } }
    if (curQ) { const d = ((curQ.q0.s - cs) % L + L) % L; if (d < 100) tl = auto ? curQ.q0.lanes[curQ.choices.indexOf(curQ.a)] : lat; }
    at(bi * ds + Math.max(13, look), clamp(tl, -8, 8)); const aim = Math.atan2(o3.x - P.x, o3.z - P.z); board.S.steer = aim; autoAim = aim;
    if (sNow >= total) finish();
  }
  let autoAim = 0;

  function finish() {
    state = 'done'; board.S.hold = true; board.S.steer = null; const tt = +(t + pen).toFixed(1);
    place = 1 + rivals.filter(r => r.fin && r.fin <= tt).length + [...board.remote.values()].filter(r => r.k === id && r.f && r.f <= tt).length;
    const nb = !best[id] || tt < best[id]; if (nb) { best[id] = tt; save('sb.best', best); }
    const p0 = cupPoints(); if (place <= 3 && (!cups[id] || place < cups[id])) { cups[id] = place; save('sb.cups', cups); }
    const p1 = cupPoints(), un = BOARD_COLORS.filter(c => c.need > p0 && c.need <= p1).map(c => c.name);
    if (place === 1 && ctx.houses && ctx.houses.houseId && ctx.houses.houseId()) ctx.houses.addPoints(5, 'Về nhất đua ván bạc');
    result = { track: id, time: tt, place, gates: hits, total: gates.length * tr.laps, quiz: right, penalty: pen, cup: CUP[place] || '' };
    const fact = ['🧊 <b>Quán tính</b>: thả ga ván vẫn trôi — vật giữ nguyên chuyển động khi không có lực cản.', '🌀 <b>Lực hướng tâm</b>: cua càng nhanh càng phải nghiêng nhiều, vì F = m·v²/r.', '🪞 <b>Phản xạ</b>: mặt ván nhẵn nên góc phản xạ = góc tới, soi rõ cả bầu trời.'][Math.floor(Math.random() * 3)];
    api.end({ score: tt, lowerBetter: true, save: false, title: `${CUP[place] || '🏁'} Về thứ ${place}/${rivals.length + 1} · ${tr.name.replace(/^\S+ /, '')}`,
      text: `⭕ Cổng ${hits}/${result.total} · 🧠 Đúng ${right}/${qz.length * tr.laps}${pen ? ` · phạt +${pen.toFixed(1)} s` : ''}<br>${nb ? '🎉 <b>Kỷ lục mới của đường này!</b>' : '🏆 Kỷ lục: <b>' + fmt(best[id]) + '</b>'}${un.length ? `<br>🎨 Mở khoá màu ván: <b>${un.join(', ')}</b> (chạm 🎨 để đổi)` : ''}<br><small>${fact}</small>` });
    ctx.net && ctx.net.emit && ctx.net.emit('sb', { on: 1, k: id, p: 1, f: tt });
  }

  function update(dt) {
    msgT -= dt;
    if (state === 'load') { loadT += dt; at(0); board.S.assistY = Math.max(o3.y, board.floorAt(o3.x, o3.z) + 1); if (loadT > (id === 'cloud' ? 2.6 : 1.3)) ready(); }
    else if (state === 'count') {
      const c0 = Math.ceil(cd - 0.6); cd -= dt; const c1 = Math.ceil(cd - 0.6); at(0); board.S.assistY = o3.y;
      if (c1 !== c0 || cd + dt >= 3.6) { api.hud.msg(c1 > 0 ? `<b style="font-size:34px">${c1}</b>` : '<b style="font-size:34px">🏁 XUẤT PHÁT!</b>', 1000); api.sfx(c1 > 0 ? 'open' : 'win'); }
      if (cd <= 0.6) { state = 'race'; board.S.hold = false; board.kick(0.8); }
    } else if (state === 'race') {
      t += dt; playerUpdate(dt);
      if ((hudT -= dt) <= 0 && state === 'race') {
        hudT = 0.25; const my = sAbs; place = 1 + rivals.filter(r => r.s > my).length + [...board.remote.values()].filter(r => r.k === id && (r.p || 0) * total > my).length;
        api.hud.time(t + pen); api.hud.info(`🏁 Hạng <b>${place}</b>/${rivals.length + 1} · ⭕ ${hits}${tr.laps > 1 ? ` · 🔁 ${Math.min(tr.laps, Math.floor(sAbs / L) + 1)}/${tr.laps}` : ''}`);
        // vòng kế tiếp nhấp nháy trắng
        const pulse = 0.5 + 0.5 * Math.sin(t * 8), lap = Math.floor(sAbs / L); let nx = -1, bd = 1e9; const cs = ((sAbs % L) + L) % L;
        for (let i = 0; i < gates.length; i++) { const g = gates[i]; if (g.lap >= lap) continue; const d = ((g.s - cs) % L + L) % L; if (d < bd) { bd = d; nx = i; } rings.setColorAt(i, col.set('#ffd24a')); }
        if (nx >= 0) rings.setColorAt(nx, col.set('#ffffff').lerp(col2, pulse * 0.6)); if (rings.instanceColor) rings.instanceColor.needsUpdate = true;
      }
      if ((emitT -= dt) <= 0) { emitT = 0.3; ctx.net && ctx.net.emit && ctx.net.emit('sb', { on: 1, k: id, p: clamp(sAbs / total, 0, 1) }); }
    } else if (state === 'done') t += dt;
    if (tr && rings) { for (const r of rivals) rivalUpdate(r, dt); padIM.material.opacity = 0.6 + 0.3 * Math.sin(t * 6); }
    board.apply();   // host vừa ghi đè tư thế nhân vật (actor) → đặt lại tư thế lướt ván
  }
  function dispose() {
    const S = board.S; S.hold = S.free = S.noBoost = false; S.assistY = S.steer = S.auto = S.onTrick = null;
    if (board.riding) board.place(home.x, home.y, home.z, home.yaw);
    ctx.net && ctx.net.emit && ctx.net.emit('sb', { on: 1, k: '' }); ctx.boardRace = null;
  }
  // tự lái (kiểm thử / xem thử): bám điểm ngắm của trợ lái, thỉnh thoảng nhào lộn
  function autopilot(on) {
    auto = on; let tk = 3;
    board.S.auto = on ? dt => { if (state !== 'race') return null; const d = wrap(autoAim - board.yaw); if ((tk -= dt) <= 0) { tk = 8; board.trick(Math.random() < 0.5 ? 'flip' : 'spin'); } return { x: -clamp(d * 2.2, -1, 1), z: -1 }; } : null;
  }
  ctx.boardRace = { choose, autopilot, get state() { return state; }, get progress() { return total ? sAbs / total : 0; }, get quizOn() { return !!curQ; }, get result() { return result; }, get rivals() { return rivals; } };
  lobby(); if (want && TRACKS[want]) choose(want);
  return { update, dispose, key(e) { if (state === 'lobby' && /^Digit[1-3]$/.test(e.code)) choose(ORDER[+e.code.slice(5) - 1]); } };
}

export const boardRace = { 'board-race': { name: '🏄 Đua ván bạc', inPlace: true, lowerBetter: true, start } };
