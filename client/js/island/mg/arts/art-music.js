// art-music.js — XƯỞNG MỸ THUẬT & ÂM NHẠC 3D (key 'art-music').
//  🎨 Tô tượng: tượng thạch cao low-poly (nhà, cây, mặt trời) — chạm từng mặt bằng cọ hoặc đổ màu cả phần.
//     Pha màu thật kiểu hoạ sĩ (hệ Đỏ–Vàng–Lam, trộn trong bát): nhiệm vụ "pha màu cam để tô mái nhà"…
//  🏺 Nặn đất sét: khối đất trên bàn xoay, kéo để nặn lồi / ấn lõm / vuốt mịn.
//  🎹 Âm nhạc: đàn piano, đàn bầu, trống — phím nhảy lên theo nốt; "Chơi theo nhịp" bài tự soạn (âm giai ngũ cung,
//     không bản ghi có bản quyền); "Học nốt": đọc nốt trên khuông nhạc rồi bấm đúng phím.
// Bố cục theo φ: 3 trạm trên vòng tròn bán kính 13 (Fibonacci), phím rộng 0,55 ≈ 1/φ², nốt bay 1,618 s (φ).
import * as THREE from 'three';
import { createStage, orbit, mesh, smoothOutline, T, play, midiHz, NOTE_VI, labelSprite, store, PHI } from './stage.js';
import { loadHero, emote } from '../../characters.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- Pha màu: nội suy RYB → RGB (mô hình màu vẽ của Gossett & Chen) ----------
const RYB = [[1, 1, 1], [1, 0, 0], [1, 1, 0], [1, 0.5, 0], [0.163, 0.373, 0.6], [0.5, 0, 0.5], [0, 0.66, 0.2], [0.2, 0.094, 0]];
function ryb(r, y, b) {
  const L = (a, c, t) => a + (c - a) * t, out = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const c = k => RYB[k][i];   // chỉ số: bit r=1, y=2, b=4
    const x0 = L(L(c(0), c(1), r), L(c(2), c(3), r), y), x1 = L(L(c(4), c(5), r), L(c(6), c(7), r), y);
    out[i] = L(x0, x1, b);
  }
  return out;
}
const NAMED = [['Trắng', [1, 1, 1]], ['Đỏ', [1, 0, 0]], ['Vàng', [1, 1, 0]], ['Lam', RYB[4]], ['Cam', [1, 0.5, 0]], ['Tím', [0.5, 0, 0.5]], ['Xanh lá', [0, 0.66, 0.2]], ['Nâu', [0.2, 0.094, 0]],
  ['Hồng', [1, 0.45, 0.45]], ['Vàng nhạt', [1, 1, 0.55]], ['Xanh da trời', [0.55, 0.69, 0.8]], ['Tím nhạt', [0.75, 0.45, 0.75]], ['Xanh lá nhạt', [0.5, 0.83, 0.6]], ['Cam nhạt', [1, 0.72, 0.45]], ['Xám nâu', [0.6, 0.55, 0.5]]];
const _c = new THREE.Color(), lin = c => { _c.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace); return [_c.r, _c.g, _c.b]; }, srgb = (r, g, b) => { _c.setRGB(r, g, b); const o = {}; _c.getRGB(o, THREE.SRGBColorSpace); return [o.r, o.g, o.b]; };
const nameOf = rgb => { let best = null, bd = 9; for (const [n, c] of NAMED) { const d = (c[0] - rgb[0]) ** 2 + (c[1] - rgb[1]) ** 2 + (c[2] - rgb[2]) ** 2; if (d < bd) { bd = d; best = n; } } return best; };
function mixColor(m) {   // m = {r, y, b, w} số giọt mỗi màu
  const s = m.r + m.y + m.b, mx = Math.max(m.r, m.y, m.b); if (!s && !m.w) return null;
  let c = s ? ryb(m.r / mx, m.y / mx, m.b / mx) : [1, 1, 1];
  const wf = m.w / (s + m.w) * 0.9; return c.map(v => v + (1 - v) * wf);
}
const MISSIONS = [
  { part: 'roof', name: 'Cam', hint: 'Đỏ + Vàng' }, { part: 'crown', name: 'Xanh lá', hint: 'Vàng + Lam' }, { part: 'door', name: 'Tím', hint: 'Đỏ + Lam' },
  { part: 'trunk', name: 'Nâu', hint: 'Đỏ + Vàng + Lam (bằng nhau)' }, { part: 'sun', name: 'Vàng', hint: 'chỉ Vàng' }, { part: 'wall', name: 'Hồng', hint: 'Đỏ + Trắng' },
  { part: 'sky', name: 'Xanh da trời', hint: 'Lam + Trắng' },
];
const PART_VI = { roof: 'mái nhà', wall: 'tường', door: 'cửa', trunk: 'thân cây', crown: 'tán cây', sun: 'mặt trời', sky: 'đám mây' };

// ---------- Âm nhạc ----------
const WHITE = [60, 62, 64, 65, 67, 69, 71, 72], BLACK = [[61, 0], [63, 1], [66, 3], [68, 4], [70, 5]];   // Đô4 … Đô5; phím đen sau phím trắng thứ i
const viName = m => { const i = [0, 2, 4, 5, 7, 9, 11].indexOf((m - 60 + 120) % 12); return i < 0 ? '♯' : NOTE_VI[i] + (m >= 72 ? '⁵' : ''); };
// Bài tự soạn (âm giai ngũ cung Đô–Rê–Mi–Sol–La, nhịp 2/4): [nốt midi, số phách]
const SONGS = {
  'Cánh diều tuổi thơ': [[67, 1], [69, 1], [72, 1], [69, 1], [67, 1], [64, 1], [67, 2], [64, 1], [67, 1], [69, 1], [67, 1], [64, 1], [62, 1], [60, 2], [62, 1], [64, 1], [67, 1], [64, 1], [62, 1], [60, 1], [62, 2], [64, 1], [67, 1], [69, 1], [72, 1], [69, 1], [67, 1], [72, 2]],
  'Ru em bên sông': [[60, 2], [62, 1], [64, 1], [67, 2], [64, 2], [62, 1], [64, 1], [62, 1], [60, 1], [62, 4], [64, 2], [67, 1], [69, 1], [67, 2], [64, 2], [62, 1], [60, 1], [62, 1], [64, 1], [60, 4]],
};
const DRUM_SONG = [[0, 1], [1, 0.5], [1, 0.5], [0, 1], [1, 1], [0, 0.5], [0, 0.5], [1, 1], [0, 1], [1, 1]];   // 0 trống cái "tùng", 1 trống con "cắc"
const BAU = [60, 62, 64, 67, 69, 72];   // đàn bầu: 6 điểm bồi âm trên dây

export function startArtMusic(ctx, opts = {}) {
  const S = createStage(ctx, { title: '🎨 Xưởng Mỹ thuật & Âm nhạc', bg: '#f3e2c4', fog: ['#f3e2c4', 30, 70], onExit: opts.onExit, api: opts.api });
  const { scene } = S, prog = store.get('artmusic', { stars: 0, mission: 0, songs: {}, notes: 0 });
  const save = () => store.set('artmusic', prog);
  const starTxt = () => S.setScore(`⭐ ${prog.stars}`); starTxt();

  // ---------- Xưởng: sàn gỗ tròn, tường vòng cung, cửa sổ, 3 trạm cách nhau 2π/3 trên vòng R = 13 ----------
  const R = 13, ST = { paint: 0, clay: 1, music: 2 }, ang = k => -Math.PI / 2 + k * 2 * Math.PI / 3, stPos = k => new THREE.Vector3(Math.cos(ang(k)) * R * 0.62, 0, Math.sin(ang(k)) * R * 0.62);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(R + 3, R + 3, 0.4, 34), T('#c9965f')); floor.position.y = -0.14; scene.add(floor);   // mặt sàn cao 6 cm: che vệt đường/lối đi của thế giới bên dưới
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(R / PHI, R / PHI, 0.05, 34), T('#d8584a')); rug.position.y = 0.085; scene.add(rug);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 3, R + 3, 8, 34, 1, true), T('#f6ead2', { side: THREE.BackSide })); wall.position.y = 4; scene.add(wall);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2, w = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6 * PHI), T('#9fd4f0')); w.position.set(Math.cos(a) * (R + 2.9), 4, Math.sin(a) * (R + 2.9)); w.lookAt(0, 4, 0); scene.add(w); }
  const signs = [], sign = (t, k) => { const sp = labelSprite(t, { size: 0.8 }); sp.position.copy(stPos(k)).setY(6.2); scene.add(sp); signs[k] = sp; };
  sign('🎨 Tô tượng & pha màu', ST.paint); sign('🏺 Nặn đất sét', ST.clay); sign('🎹 Góc âm nhạc', ST.music);

  // bạn nhỏ (nhân vật của người chơi) làm "trợ giảng", reo lên khi làm đúng
  let hero = null; const heroSt = {};
  loadHero(ctx.heroKind || 'student-male-a', 1.35).then(h => { if (!h || S.disposed) return; hero = h; scene.add(h.model); h.anim.play(h.set.idle); placeHero(); });
  const cheer = () => { if (hero) emote(hero, heroSt, 'cheer'); };

  // ================== 🎨 TÔ TƯỢNG ==================
  const P0 = stPos(ST.paint), paint = new THREE.Group(); paint.position.copy(P0); scene.add(paint);
  const BASE = [0.93, 0.91, 0.86];
  const ped = mesh(new THREE.CylinderGeometry(3.4, 3.7, 0.8, 8), '#b9a58c'); ped.position.y = 0.4; paint.add(ped);
  const parts = {};
  const addPart = (key, geo, x, y, z, ry = 0, quad = true) => {
    if (geo.index) geo = geo.toNonIndexed(); const n = geo.attributes.position.count, col = new Float32Array(n * 3); const bl = lin(BASE); for (let i = 0; i < n; i++) col.set(bl, i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, T('#ffffff', { vertexColors: true })); smoothOutline(m); m.position.set(x, y, z); m.rotation.y = ry; m.userData.part = key; m.userData.quad = quad; paint.add(m); parts[key] = m; return m;
  };
  addPart('wall', new THREE.BoxGeometry(2.6, 1.6, 1.6, 3, 2, 2), -0.6, 1.6, 0);
  addPart('roof', new THREE.ConeGeometry(2.2, 1.3, 4, 1), -0.6, 3.05, 0, Math.PI / 4, false);
  addPart('door', new THREE.BoxGeometry(0.6, 1.0, 0.12, 1, 2, 1), -0.6, 1.3, 0.82);
  addPart('trunk', new THREE.CylinderGeometry(0.16, 0.24, 1.4, 6, 2), 1.9, 1.5, 0.2);
  addPart('crown', new THREE.IcosahedronGeometry(0.85, 1), 1.9, 2.75, 0.2, 0, false);
  addPart('sun', new THREE.IcosahedronGeometry(0.5, 1), 1.3, 4.7, -0.6, 0, false);
  addPart('sky', new THREE.DodecahedronGeometry(0.42, 1).scale(1.8, 0.8, 1), -2.0, 4.4, -0.4, 0, false);
  const partList = Object.values(parts);
  // bảng màu 3D: 4 hũ (Đỏ, Vàng, Lam, Trắng) + bát pha màu
  const tbl = mesh(new THREE.BoxGeometry(4.2, 0.2, 1.3), '#8a5a34'); tbl.position.set(0, 1.0, 3.9); paint.add(tbl);
  for (const [x, z] of [[-1.9, -0.5], [1.9, -0.5], [-1.9, 0.5], [1.9, 0.5]]) { const lg = mesh(new THREE.BoxGeometry(0.15, 1, 0.15), '#6b4226', { outline: false }); lg.position.set(x, 0.5, 3.9 + z); paint.add(lg); }
  const POTS = [['r', '#e0261c', 'Đỏ'], ['y', '#f7d21e', 'Vàng'], ['b', '#2a5f99', 'Lam'], ['w', '#ffffff', 'Trắng']], pots = [];
  POTS.forEach(([k, c, n], i) => {
    const g = new THREE.Group(); g.position.set(-1.6 + i * 0.75, 1.1, 3.9); const jar = mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.4, 8), '#e9e4da'); jar.position.y = 0.2; const top = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8), c, { outline: false }); top.position.y = 0.41;
    g.add(jar, top); g.userData.pot = k; g.userData.name = n; paint.add(g); pots.push(g);
  });
  const bowl = mesh(new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#e9e4da'); bowl.position.set(1.55, 1.52, 3.9); bowl.material = T('#e9e4da', { side: THREE.DoubleSide }); paint.add(bowl);
  const paintTop = new THREE.Mesh(new THREE.CircleGeometry(0.38, 12).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: '#ffffff' })); paintTop.material.userData.own = true; paintTop.position.set(1.55, 1.32, 3.9); paintTop.visible = false; paint.add(paintTop); bowl.userData.bowl = true;
  const mix = { r: 0, y: 0, b: 0, w: 0 }; let cur = null, curName = null, tool = 'brush';

  // ================== 🏺 NẶN ĐẤT SÉT ==================
  const P1 = stPos(ST.clay), clayG = new THREE.Group(); clayG.position.copy(P1); scene.add(clayG);
  const wheel = mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.9, 13), '#8a5a34'); wheel.position.y = 0.45; clayG.add(wheel);
  const plate = mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 21), '#cfc6b8', { outline: false }); plate.position.y = 0.95; clayG.add(plate);
  let clayGeo = mergeVertices(new THREE.IcosahedronGeometry(1, 3).deleteAttribute('normal').deleteAttribute('uv')); clayGeo.computeVertexNormals();
  const clay = new THREE.Mesh(clayGeo, T('#c8794e', { unique: true })); clay.material.userData.own = true; clay.position.y = 2.0; clay.scale.set(1, PHI / 1.3, 1); clayG.add(clay);
  let clayTool = 'pull', claySpin = 0.3, normT = 0;
  const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _l = new THREE.Vector3();
  function sculpt(hit, k) {
    clay.worldToLocal(_l.copy(hit.point)); const pos = clayGeo.attributes.position, nor = clayGeo.attributes.normal, rad = 0.55;
    if (clayTool === 'smooth') { // kéo mỗi đỉnh gần về bán kính trung bình quanh đó
      let avg = 0, c = 0; for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i); if (_v.distanceTo(_l) < rad) { avg += _v.length(); c++; } }
      avg /= c || 1; for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i); const d = _v.distanceTo(_l); if (d < rad) { const len = _v.length(); _v.multiplyScalar(1 + (avg / len - 1) * 0.3 * (1 - d / rad)); pos.setXYZ(i, _v.x, _v.y, _v.z); } }
    } else for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i); const d = _v.distanceTo(_l); if (d > rad) continue;
      const f = Math.cos(d / rad * Math.PI / 2) ** 2 * k * (clayTool === 'pull' ? 1 : -1); _n.fromBufferAttribute(nor, i);
      _v.addScaledVector(_n, f); const len = _v.length(); if (len < 0.25) _v.setLength(0.25); if (len > 2.6) _v.setLength(2.6); pos.setXYZ(i, _v.x, _v.y, _v.z);
    }
    pos.needsUpdate = true; normT = 0.08;
  }

  // ================== 🎹 GÓC ÂM NHẠC ==================
  const P2 = stPos(ST.music), mus = new THREE.Group(); mus.position.copy(P2); mus.rotation.y = Math.atan2(-Math.cos(ang(ST.music)), -Math.sin(ang(ST.music))); scene.add(mus);
  const pads = [];   // {obj, play(), base y, name, lane}
  const note = (pad) => { pad.t = 0.25; pad.play(); fly(pad); };
  // nốt nhạc "♪" nhảy lên từ phím
  const flyPool = Array.from({ length: 8 }, () => { const sp = labelSprite('♪', { size: 0.5, bg: 'rgba(0,0,0,0)', fg: '#7a3ad6' }); sp.visible = false; scene.add(sp); return { sp, t: 0 }; });
  let flyI = 0; const _w = new THREE.Vector3();
  function fly(pad) { const f = flyPool[flyI++ % flyPool.length]; S.local(pad.obj.getWorldPosition(_w)); f.sp.position.copy(_w).add(new THREE.Vector3(0, 0.4, 0)); f.sp.visible = true; f.t = 1; f.vx = (Math.random() - 0.5) * 0.8; }
  // piano
  const piano = new THREE.Group(); mus.add(piano);
  const body = mesh(new THREE.BoxGeometry(5.2, 0.9, 2.6), '#2a2230'); body.position.set(0, 0.95, -0.3); piano.add(body);
  const back = mesh(new THREE.BoxGeometry(5.2, 1.6, 0.4), '#2a2230'); back.position.set(0, 2.0, -1.4); piano.add(back);
  const KW = 0.55, KG = 0.06, x0 = -(8 * (KW + KG)) / 2 + (KW + KG) / 2;
  WHITE.forEach((m, i) => { const k = mesh(new THREE.BoxGeometry(KW, 0.22, 2.0), '#fbf8f0'); k.position.set(x0 + i * (KW + KG), 1.5, 0.2); piano.add(k); const lb = labelSprite(viName(m), { size: 0.36 }); lb.position.set(0, 0.25, 0.75); k.add(lb); pads.push({ obj: k, by: 1.5, midi: m, inst: 'piano', play: () => play('piano', midiHz(m), 0.7) }); });
  BLACK.forEach(([m, i]) => { const k = mesh(new THREE.BoxGeometry(0.32, 0.22, 1.25), '#1a1620'); k.position.set(x0 + (i + 0.5) * (KW + KG), 1.72, -0.2); piano.add(k); pads.push({ obj: k, by: 1.72, midi: m, inst: 'piano', play: () => play('piano', midiHz(m), 0.7) }); });
  const KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK']; pads.filter(p => p.inst === 'piano').slice(0, 8).forEach((p, i) => p.code = KEYS[i]);
  // khuông nhạc (học nốt)
  const stC = document.createElement('canvas'); stC.width = 512; stC.height = 256; const stTex = new THREE.CanvasTexture(stC); stTex.colorSpace = THREE.SRGBColorSpace;
  const staff = new THREE.Mesh(new THREE.PlaneGeometry(2.6 * PHI, 2.6), new THREE.MeshBasicMaterial({ map: stTex })); staff.material.userData.own = true; staff.position.set(0, 3.55, -1.6); staff.scale.setScalar(0.8); piano.add(staff);
  function drawStaff(m, msg) {
    const k = stC.getContext('2d'); k.fillStyle = '#fff6df'; k.fillRect(0, 0, 512, 256); k.strokeStyle = '#3b2a1e'; k.lineWidth = 3;
    const gap = 21, top = 70; for (let i = 0; i < 5; i++) { k.beginPath(); k.moveTo(30, top + i * gap); k.lineTo(482, top + i * gap); k.stroke(); }
    k.fillStyle = '#3b2a1e'; k.font = '120px serif'; k.fillText('𝄞', 34, top + 4 * gap + 20);
    if (m) { const step = { 60: 0, 62: 1, 64: 2, 65: 3, 67: 4, 69: 5, 71: 6, 72: 7 }[m], y = top + 4 * gap + gap - step * gap / 2, x = 300;
      if (step === 0) { k.beginPath(); k.moveTo(x - 30, y); k.lineTo(x + 30, y); k.stroke(); }
      k.beginPath(); k.ellipse(x, y, 15, 11, -0.35, 0, Math.PI * 2); k.fill(); k.beginPath(); k.moveTo(x + 13, y); k.lineTo(x + 13, y - 70); k.stroke(); }
    k.font = '800 26px system-ui'; k.fillText(msg || 'Khuông nhạc · khoá Sol', 30, 236); stTex.needsUpdate = true;
  }
  drawStaff(null);
  // đàn bầu
  const bau = new THREE.Group(); bau.position.set(0, 0, 0); bau.visible = false; mus.add(bau);
  const bb = mesh(new THREE.BoxGeometry(5.6, 0.4, 0.8), '#a8673a'); bb.position.y = 1.2; bau.add(bb);
  const gourd = mesh(new THREE.SphereGeometry(0.4, 8, 6), '#e0b46a'); gourd.position.set(2.4, 1.85, 0); bau.add(gourd);
  const rod = mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 6), '#5a3a20'); rod.position.set(2.4, 2.4, 0); rod.rotation.z = 0.25; bau.add(rod);
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 5.2, 4).rotateZ(Math.PI / 2), T('#e8e0d0')); str.position.set(0.1, 1.55, 0); bau.add(str);
  BAU.forEach((m, i) => { const d = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8), '#f7d21e'); d.position.set(-2.3 + i * 0.8, 1.44, 0.25); bau.add(d); const lb = labelSprite(viName(m), { size: 0.34 }); lb.position.set(0, 0.35, 0.3); d.add(lb); pads.push({ obj: d, by: 1.44, midi: m, inst: 'bau', code: KEYS[i], play: () => { play('bau', midiHz(m), 0.9); rod.rotation.z = 0.25 + 0.15; } }); });
  // trống
  const drums = new THREE.Group(); drums.visible = false; mus.add(drums);
  [[-1.1, 1.3, 1.0, 'drum', 'Trống cái · tùng'], [1.3, 0.75, 1.3, 'tom', 'Trống con · cắc']].forEach(([x, r, h, kind, n], i) => {
    const d = new THREE.Group(); d.position.set(x, 0, 0.2); const side = mesh(new THREE.CylinderGeometry(r, r * 0.9, h, 13), '#c8282a'); side.position.y = h / 2 + 0.3; const skin = mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.97, 0.06, 13), '#f2e3c4', { outline: false }); skin.position.y = h + 0.33;
    d.add(side, skin); drums.add(d); const lb = labelSprite(n, { size: 0.42 }); lb.position.set(0, h + 1, 0); d.add(lb);
    pads.push({ obj: d, by: 0, inst: 'drum', lane: i, code: KEYS[i], name: n, play: () => play(kind, 0, 0.4, 0.8) });
  });
  let inst = 'piano';
  const instPads = () => pads.filter(p => p.inst === inst);
  // chế độ nhịp: nốt bay về phím, chạm đúng lúc
  const rhythm = { on: false, notes: [], t: 0, score: 0, hits: 0, total: 0, song: null };
  const nPool = Array.from({ length: 13 }, () => { const sp = labelSprite('●', { size: 0.5, bg: 'rgba(122,58,214,.9)' }); sp.visible = false; scene.add(sp); return sp; });
  const TRAVEL = PHI;   // giây bay
  function startSong(name) {
    const beat = inst === 'drum' ? 0.5 : 0.55, seq = inst === 'drum' ? DRUM_SONG.concat(DRUM_SONG) : SONGS[name]; let t = 2;
    rhythm.notes = []; for (const [m, b] of seq) { const pad = inst === 'drum' ? instPads()[m] : instPads().find(p => p.midi === m); if (pad) rhythm.notes.push({ pad, at: t, sp: null, done: false }); t += b * beat; }
    Object.assign(rhythm, { on: true, t: 0, score: 0, hits: 0, total: rhythm.notes.length, song: name, end: t + 1 });
    S.tip(`🎵 <b>${name}</b> — chạm ${inst === 'drum' ? 'mặt trống' : 'phím'} đúng lúc nốt tím bay tới!`, 3000);
  }
  function rhythmTick(dt) {
    if (!rhythm.on) return; rhythm.t += dt; let pi = 0;
    for (const n of rhythm.notes) {
      if (n.done) continue; const lt = n.at - rhythm.t;
      if (lt < -0.25) { n.done = true; continue; }
      if (lt > TRAVEL) continue;
      const sp = nPool[pi++ % nPool.length]; sp.visible = true; S.local(n.pad.obj.getWorldPosition(_w)); const toward = new THREE.Vector3(0, 0, -1).applyQuaternion(mus.quaternion);
      sp.position.copy(_w).addScaledVector(toward, Math.max(0, lt) / TRAVEL * 5).setY(_w.y + 0.5 + Math.max(0, lt) * 1.2);
      // tự phát mẫu khi chưa ai chạm? không — để bé tự chơi
    }
    for (; pi < nPool.length; pi++) nPool[pi].visible = false;
    if (rhythm.t > rhythm.end) {
      rhythm.on = false; nPool.forEach(s => s.visible = false); const pct = Math.round(rhythm.hits / rhythm.total * 100), st = pct >= 90 ? 3 : pct >= 62 ? 2 : pct >= 38 ? 1 : 0;
      const k = inst + ':' + rhythm.song, old = prog.songs[k] || 0; if (st > old) { prog.stars += st - old; prog.songs[k] = st; save(); starTxt(); }
      if (st >= 2) { cheer(); play('ok'); }
      S.card(`<h3>🎶 ${rhythm.song}</h3><p>Trúng ${rhythm.hits}/${rhythm.total} nốt (${pct}%) ${'⭐'.repeat(st) || '— thử lại nhé!'}</p><p style="font-size:13px;opacity:.8">Bài tự soạn theo âm giai ngũ cung Đô–Rê–Mi–Sol–La, âm giai quen thuộc của dân ca Việt Nam.</p>`, [{ label: '🔁 Chơi lại', fn: () => startSong(rhythm.song) }, { label: 'Đóng' }]);
    }
  }
  function tapPad(pad) {
    note(pad); if (hero && Math.random() < 0.2) emote(hero, heroSt, 'interact');
    if (rhythm.on) { let best = null, bd = 0.24; for (const n of rhythm.notes) if (!n.done && n.pad === pad && Math.abs(n.at - rhythm.t) < bd) { bd = Math.abs(n.at - rhythm.t); best = n; } if (best) { best.done = true; rhythm.hits++; S.tip(bd < 0.1 ? '✨ Tuyệt!' : '👍 Tốt', 600); } }
    if (learn.on && pad.inst === 'piano' && pad.midi) {
      if (pad.midi === learn.m) { learn.ok++; prog.notes++; if (prog.notes % 5 === 0) { prog.stars++; starTxt(); } save(); play('ok'); cheer(); S.tip(`✅ Đúng rồi! Đó là nốt <b>${viName(learn.m)}</b>`, 1400); setTimeout(nextLearn, 900); }
      else { play('bad'); S.tip(`Chưa đúng — nốt đó là ${viName(pad.midi)}. Nhìn kỹ vị trí trên khuông nhé!`, 1800); }
    }
  }
  const learn = { on: false, m: 60, ok: 0 };
  function nextLearn() { if (!learn.on) return; let m; do m = WHITE[Math.floor(Math.random() * 8)]; while (m === learn.m); learn.m = m; drawStaff(m, `Nốt này tên gì? Bấm đúng phím!`); }

  // ---------- Camera & chuyển trạm ----------
  const cam = orbit(S, P0.clone().setY(2.4), { r: 10, yaw: ang(ST.paint) + Math.PI / 2 + Math.PI, pitch: 0.38, rMin: 4, rMax: 16 });
  let station = -1, first = true; const camGoal = { target: new THREE.Vector3(), r: 10, yaw: 0, pitch: 0.4 };
  function placeHero() { if (!hero) return; const p = stPos(station < 0 ? 0 : station), a = ang(station < 0 ? 0 : station), side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)); hero.model.position.copy(p).addScaledVector(side, 4.2).addScaledVector(p.clone().normalize(), 1.2); hero.model.lookAt(S.scene.localToWorld(new THREE.Vector3())); }
  function go(k) {
    station = k; const p = stPos(k), a = ang(k); S.closeCard(); rhythm.on = false; nPool.forEach(s => s.visible = false); learn.on = false; drawStaff(null);
    camGoal.target.copy(p).setY(k === ST.music ? 1.9 : k === ST.clay ? 1.4 : 1.6); camGoal.r = k === ST.music ? 8.5 : k === ST.clay ? 6.5 : 10.5; camGoal.pitch = k === ST.music ? 0.52 : 0.36;
    // camera đứng phía tâm xưởng nhìn ra trạm
    camGoal.yaw = Math.atan2(-Math.cos(a), -Math.sin(a));
    if (first) { first = false; cam.yaw = camGoal.yaw; cam.target.copy(camGoal.target); cam.pitch = camGoal.pitch; }
    while (camGoal.yaw - cam.yaw > Math.PI) camGoal.yaw -= Math.PI * 2; while (camGoal.yaw - cam.yaw < -Math.PI) camGoal.yaw += Math.PI * 2;
    signs.forEach((sp, i) => sp.visible = i !== k); placeHero(); buildBar();
  }
  S.onTick(dt => {
    // camera bay mượt
    const k = 1 - Math.exp(-dt * 4); cam.target.lerp(camGoal.target, k); cam.yaw += (camGoal.yaw - cam.yaw) * k; cam.r += (camGoal.r * S.fit() - cam.r) * k; cam.pitch += (camGoal.pitch - cam.pitch) * k; cam.apply();
    if (hero) { hero.anim.update(dt); if (!(heroSt.oneShot && heroSt.oneShot.until > performance.now())) hero.anim.play(hero.set.idle, 0.3); }
    // phím nảy, nốt bay
    for (const p of pads) { if (p.t > 0) p.t = Math.max(0, p.t - dt); const d = p.t > 0 ? Math.sin(p.t / 0.25 * Math.PI) : 0; if (p.inst === 'drum') p.obj.scale.setScalar(1 + d * 0.06); else p.obj.position.y = p.by - d * 0.1 + (p.inst === 'bau' ? d * 0.25 : d * 0.05); }
    rod.rotation.z += (0.25 - rod.rotation.z) * k;
    for (const f of flyPool) if (f.t > 0) { f.t -= dt * 0.8; f.sp.position.y += dt * 2; f.sp.position.x += f.vx * dt; f.sp.material.opacity = f.t; if (f.t <= 0) f.sp.visible = false; }
    rhythmTick(dt);
    // đất sét xoay, tính lại pháp tuyến (thưa)
    clay.rotation.y += claySpin * dt; if (normT > 0 && (normT -= dt) <= 0) clayGeo.computeVertexNormals();
    pots.forEach(p => { if (p.userData.t > 0) { p.userData.t -= dt; p.position.y = 1.1 + Math.sin(p.userData.t * 12) * 0.08 * p.userData.t * 3; } });
    const pt = performance.now() / 1000; parts.sun.rotation.y = pt * 0.3; parts.sky.position.x = -2.0 + Math.sin(pt * 0.5) * 0.2;
  });

  // ---------- Chạm ----------
  let dragMode = null;
  function paintFace(hit) {
    const m = hit.object; if (!m.userData.part || !cur) return false; const col = m.geometry.attributes.color, cl = lin(cur);
    if (tool === 'fill') { for (let i = 0; i < col.count; i++) col.setXYZ(i, ...cl); }
    else { const f = hit.faceIndex; for (let j = 0; j < 3; j++) col.setXYZ(f * 3 + j, ...cl); const pf = f ^ 1; if (m.userData.quad && pf * 3 + 2 < col.count) for (let j = 0; j < 3; j++) col.setXYZ(pf * 3 + j, ...cl); }   // tô cả mặt tứ giác (2 tam giác liền nhau)
    col.needsUpdate = true; checkMission(); return true;
  }
  function partColorShare(m, name) { const col = m.geometry.attributes.color; let c = 0; for (let i = 0; i < col.count; i += 3) if (nameOf(srgb(col.getX(i), col.getY(i), col.getZ(i))) === name) c++; return c / (col.count / 3); }
  function checkMission() {
    const M = MISSIONS[prog.mission % MISSIONS.length]; if (!M || partColorShare(parts[M.part], M.name) < 1 / PHI) return;   // tô ≥ 61,8% (1/φ) là đạt
    prog.mission++; prog.stars++; save(); starTxt(); play('ok'); cheer();
    S.card(`<h3>🎉 Đúng màu ${M.name}!</h3><p>Em đã tô ${PART_VI[M.part]} màu <b>${M.name}</b> (${M.hint}).</p>${prog.mission % MISSIONS.length === 0 ? '<p>Em đã hoàn thành cả bức tượng! ⭐ Hoạ sĩ nhí!</p>' : ''}`, [{ label: '➡️ Nhiệm vụ tiếp', fn: missionTip }]);
  }
  function missionTip() { const M = MISSIONS[prog.mission % MISSIONS.length]; S.tip(`🎯 Pha màu <b>${M.name}</b> rồi tô <b>${PART_VI[M.part]}</b> · gợi ý: ${M.hint}`, 6000); }
  function updMix() {
    cur = mixColor(mix); curName = cur ? nameOf(cur) : null; paintTop.visible = !!cur; if (cur) paintTop.material.color.setRGB(...cur, THREE.SRGBColorSpace);
    if (sw) { sw.style.background = cur ? `rgb(${cur.map(v => Math.round(v * 255))})` : 'transparent'; swN.textContent = curName ? `${curName} (${['r', 'y', 'b', 'w'].filter(k => mix[k]).map(k => ({ r: 'Đỏ', y: 'Vàng', b: 'Lam', w: 'Trắng' })[k] + '×' + mix[k]).join(' + ')})` : 'Bát trống — chạm hũ màu'; }
  }
  S.onDown = e => {
    dragMode = 'cam';
    if (station === ST.paint) {
      const hit = S.pick([...partList, ...pots, bowl], e); if (!hit) return; let o = hit.object; while (o && !o.userData.pot && !o.userData.part && !o.userData.bowl) o = o.parent;
      if (o && o.userData.pot) { const k = o.userData.pot; if (mix.r + mix.y + mix.b + mix.w >= 8) { S.tip('Bát đầy rồi — bấm 🫗 Đổ bát để pha lại'); return; } mix[k]++; o.userData.t = 0.25; play('pop', 500 + 'rybw'.indexOf(k) * 120); updMix(); dragMode = null; return; }
      if (o && o.userData.bowl) { dragMode = null; return; }
      if (o && o.userData.part) { if (!cur) { S.tip('Chạm hũ màu để lấy màu vào bát trước nhé 🎨'); return; } paintFace(hit); play('pop', 900, 0.05, 0.12); dragMode = 'paint'; }
    } else if (station === ST.clay) { const hit = S.pick([clay], e); if (hit) { sculpt(hit, 0.06); dragMode = 'clay'; claySpin = 0; } }
    else if (station === ST.music) { const hit = S.pick(instPads().map(p => p.obj), e); if (hit) { let o = hit.object; const pad = instPads().find(p => { let q = o; while (q) { if (q === p.obj) return true; q = q.parent; } return false; }); if (pad) { tapPad(pad); dragMode = null; } } }
  };
  S.onDrag = (dx, dy, e) => {
    if (dragMode === 'paint' && tool === 'brush') { const hit = S.pick(partList, e); if (hit) paintFace(hit); return; }
    if (dragMode === 'clay') { const hit = S.pick([clay], e); if (hit) sculpt(hit, 0.025); return; }
    if (dragMode === 'cam') { camGoal.yaw -= dx * 0.008; camGoal.pitch = Math.max(0.05, Math.min(1.2, camGoal.pitch + dy * 0.006)); }
  };
  S.onUp = () => { if (dragMode === 'clay') claySpin = 0.3; dragMode = null; };
  S.onPinch = k => { camGoal.r = Math.max(4, Math.min(16, camGoal.r / k)); };
  S.onWheel = d => { camGoal.r = Math.max(4, Math.min(16, camGoal.r * (d > 0 ? 1.08 : 0.92))); };
  S.onKey = e => { if (station !== ST.music) return; const p = instPads().find(q => q.code === e.code); if (p) tapPad(p); };

  // ---------- Thanh nút ----------
  let sw = null, swN = null;
  function buildBar() {
    S.clearBar(); sw = null;
    const tabs = [['🎨 Tô tượng', ST.paint], ['🏺 Nặn đất', ST.clay], ['🎹 Âm nhạc', ST.music]];
    S.tabs.innerHTML = ''; for (const [l, k] of tabs) { const b = S.button(l, () => go(k), S.tabs); if (k === station) b.classList.add('on'); }
    if (station === ST.paint) {
      sw = document.createElement('div'); sw.className = 'sw'; sw.style.pointerEvents = 'none'; swN = document.createElement('div'); swN.className = 'sc'; S.bar.append(sw, swN);
      const b1 = S.button('🖌 Cọ', b => { tool = 'brush'; b.classList.add('on'); b2.classList.remove('on'); }), b2 = S.button('🪣 Đổ màu', b => { tool = 'fill'; b.classList.add('on'); b1.classList.remove('on'); }); b1.classList.add('on'); tool = 'brush';
      S.button('🫗 Đổ bát', () => { Object.assign(mix, { r: 0, y: 0, b: 0, w: 0 }); updMix(); });
      S.button('🎯 Nhiệm vụ', missionTip);
      S.button('🧽 Xoá tượng', () => { for (const m of partList) { const c = m.geometry.attributes.color; const bl = lin(BASE); for (let i = 0; i < c.count; i++) c.setXYZ(i, ...bl); c.needsUpdate = true; } });
      updMix(); missionTip();
    } else if (station === ST.clay) {
      const set = (t, b) => { clayTool = t; [...S.bar.querySelectorAll('.ct')].forEach(x => x.classList.toggle('on', x === b)); };
      [['⬆️ Nặn lồi', 'pull'], ['⬇️ Ấn lõm', 'push'], ['〰️ Vuốt mịn', 'smooth']].forEach(([l, t]) => { const b = S.button(l, b => set(t, b)); b.classList.add('ct'); if (t === clayTool) b.classList.add('on'); });
      S.button('🎨 Đổi màu đất', () => { const c = ['#c8794e', '#9a6b4a', '#e6d2b0', '#7fb2d6', '#e58aa8', '#8cc06a'], i = (c.indexOf('#' + clay.material.color.getHexString()) + 1) % c.length; clay.material.color.set(c[i]); });
      S.button('🔄 Nhào lại', () => { clayGeo.dispose(); clayGeo = mergeVertices(new THREE.IcosahedronGeometry(1, 3).deleteAttribute('normal').deleteAttribute('uv')); clayGeo.computeVertexNormals(); clay.geometry = clayGeo; });
      S.tip('🏺 Kéo trên khối đất để nặn · kéo ra ngoài để xoay nhìn. Thử nặn quả lê, cái bình, chú ốc sên!', 5000);
    } else {
      const sel = (i, b) => { inst = i; piano.visible = i === 'piano'; bau.visible = i === 'bau'; drums.visible = i === 'drum'; rhythm.on = false; nPool.forEach(s => s.visible = false); learn.on = false; drawStaff(null); [...S.bar.querySelectorAll('.it')].forEach(x => x.classList.toggle('on', x === b)); };
      [['🎹 Piano', 'piano'], ['🪕 Đàn bầu', 'bau'], ['🥁 Trống', 'drum']].forEach(([l, i]) => { const b = S.button(l, b => sel(i, b)); b.classList.add('it'); if (i === inst) b.classList.add('on'); });
      S.button('🎵 Chơi theo nhịp', () => { learn.on = false; if (inst === 'drum') return startSong('Trống hội làng'); const names = Object.keys(SONGS); S.card('<h3>Chọn bài (tự soạn)</h3>', names.map(n => ({ label: `${n} ${'⭐'.repeat(prog.songs[inst + ':' + n] || 0)}`, fn: () => startSong(n) }))); });
      S.button('📖 Học nốt', () => { if (inst !== 'piano') sel('piano', S.bar.querySelector('.it')); rhythm.on = false; learn.on = true; learn.m = 0; nextLearn(); S.tip('Nhìn nốt trên khuông nhạc, bấm phím đúng tên. Mẹo: Đô nằm dưới khuông, có gạch ngang riêng!', 5000); });
      S.tip('🎹 Chạm phím (máy tính: phím A S D F G H J K). Đô Rê Mi Fa Sol La Si Đô!', 4000);
    }
  }
  go(ST.paint);
  return { update: S.update, dispose: S.dispose, _dbg: { S, parts, pots, pads, go } };
}
