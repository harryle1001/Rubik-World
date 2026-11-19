// classes/shape.js — LỚP BIẾN HÌNH (Toán hình học lớp 2–6): biến KHỐI LẬP PHƯƠNG thành khối khác theo mô tả (mặt, đỉnh, đáy),
// vẽ nửa còn lại của hình ĐỐI XỨNG qua trục, biến tấm thảm vuông thành hình chữ nhật CÙNG DIỆN TÍCH rồi so CHU VI.
// Lưới sàn 8 × 8 ô = 1 InstancedMesh (1 draw call, đổi màu từng ô). 6 lượt + 1 câu hỏi cuối.
import * as THREE from 'three';
import { room, teacher, ask, finish, cleanup, wait } from './common.js';

const G = 8, CELL = 0.6, GZ = 0.4;
const SOLIDS = {
  cube: { n: '🧊 Lập phương', g: () => new THREE.BoxGeometry(1.2, 1.2, 1.2), c: '#e0503e' },
  sphere: { n: '⚪ Hình cầu', g: () => new THREE.SphereGeometry(0.75, 21, 13), c: '#3d8fd9' },
  cyl: { n: '🛢️ Hình trụ', g: () => new THREE.CylinderGeometry(0.6, 0.6, 1.3, 21), c: '#f2c443' },
  cone: { n: '🍦 Hình nón', g: () => new THREE.ConeGeometry(0.72, 1.45, 21), c: '#a78bfa' },
  pyr: { n: '🔺 Hình chóp', g: () => new THREE.ConeGeometry(0.9, 1.3, 4).rotateY(Math.PI / 4), c: '#ff9a3a' },
  box: { n: '📦 Hộp chữ nhật', g: () => new THREE.BoxGeometry(1.7, 0.85, 0.85), c: '#4f9a4a' },
};
// hình đối xứng: các ô sáng ở NỬA TRÁI (cột 0–3), hàng 0–7; em tô nửa phải
const SYM = [
  { n: 'Trái tim', cells: [[2, 1], [3, 2], [1, 1], [0, 2], [0, 3], [1, 4], [2, 5], [3, 6], [3, 3]] },
  { n: 'Ngôi nhà', cells: [[3, 0], [2, 1], [1, 2], [0, 3], [1, 3], [1, 4], [1, 5], [1, 6], [3, 6], [3, 5]] },
];
const ROUNDS = [
  { k: 'solid', want: 'cone', q: 'Biến khối lập phương thành khối có <b>1 đỉnh nhọn</b> và <b>đáy là hình tròn</b>.', fact: 'Hình nón: 1 đáy tròn, 1 đỉnh. Cây kem ốc quế, nón lá có dạng hình nón.' },
  { k: 'sym', i: 0 },
  { k: 'solid', want: 'pyr', q: 'Biến thành khối có <b>5 mặt</b>: 1 đáy hình vuông và 4 mặt tam giác.', fact: 'Hình chóp tứ giác có 5 mặt, 8 cạnh, 5 đỉnh — như Kim tự tháp Ai Cập.' },
  { k: 'sym', i: 1 },
  { k: 'area' }, { k: 'peri' },
];
const QEND = { q: 'Khối lập phương có bao nhiêu CẠNH?', choices: ['12', '6', '8', '4'], a: 0, explain: 'Lập phương có <b>6 mặt</b> vuông, <b>12 cạnh</b>, <b>8 đỉnh</b> — như con xúc xắc, khối Rubik.' };

export function startShape(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat;
  const R = room(api, { rug: '#7a3c5a', desks: 2 });
  const portrait = innerWidth < innerHeight;
  Object.assign(api.cam, { x: 0, y: 0.4, z: -0.9, yaw: 0, pitch: 0.98, dist: portrait ? 15 : 11.5 });
  me.place(-2.9, 3.6, Math.PI); me.face(0, 0);
  teacher(api, 'student-male-a', 'Thầy Phương Khối', { shirt: '#7a5cd6', pants: '#2a2f4a', glasses: true },
    ['Chào các em! Lớp Biến Hình — phép thuật của hình học.', 'Muốn biến khối, phải biết nó có mấy mặt, mấy đỉnh, mấy cạnh.', 'Muốn biến hình đối xứng, hãy soi qua trục như soi gương!'], [3.6, -3.4]);
  // bệ + khối đang biến
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.9, 8).translate(0, 0.57, 0), M('#9f9a92')); ped.position.set(0, 0, -3.6); root.add(ped);
  const holder = new THREE.Group(); holder.position.set(0, 1.85, -3.6); root.add(holder);
  let solid = null, morph = 0, grow = 1, next = null;
  const setSolid = k => { next = k; morph = 1; };
  const putSolid = k => { if (solid) { holder.remove(solid); solid.geometry.dispose(); } solid = new THREE.Mesh(SOLIDS[k].g(), M(SOLIDS[k].c)); solid.castShadow = true; holder.add(solid); };
  putSolid('cube');
  // lưới 8 × 8 (1 InstancedMesh) + trục đối xứng
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL * 0.92, 0.08, CELL * 0.92), new THREE.MeshLambertMaterial(), G * G); root.add(tiles);
  const o = new THREE.Object3D(), cellC = (c, r) => [(c - (G - 1) / 2) * CELL, (r - (G - 1) / 2) * CELL + GZ];
  for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) { const [x, z] = cellC(c, r); o.position.set(x, 0.17, z); o.updateMatrix(); tiles.setMatrixAt(r * G + c, o.matrix); }
  const axis = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, G * CELL + 0.3), new THREE.MeshBasicMaterial({ color: '#ffd36e' })); axis.position.set(0, 0.24, GZ); root.add(axis);
  const state = new Array(G * G).fill(0);   // 0 trống · 1 hình mẫu · 2 em tô · 3 thảm
  const COLS = ['#3a3550', '#ff7aa8', '#7fd3ff', '#d9a441'];
  const paint = () => { const c = new THREE.Color(); state.forEach((s, i) => tiles.setColorAt(i, c.set(COLS[s]))); tiles.instanceColor.needsUpdate = true; };
  const clear = () => { state.fill(0); paint(); };
  paint();
  let ri = 0, score = 0, tries = 0, busy = false, time = 0, done = false, cur = null;
  function load() {
    cur = ROUNDS[ri]; tries = 0; busy = false; hud.clearBar(); clear(); axis.visible = cur.k === 'sym'; hud.info(`Lượt <b>${ri + 1}</b>/6`);
    if (cur.k === 'solid') {
      R.board(`Lượt ${ri + 1}/6 · Biến khối`, 'Đọc mô tả, chọn khối đúng'); setSolid('cube'); hud.msg('🔷 ' + cur.q, 0);
      for (const k of Object.keys(SOLIDS).filter(k => k !== 'cube')) hud.button(SOLIDS[k].n, () => pickSolid(k), 'sm');
    } else if (cur.k === 'sym') {
      const S = SYM[cur.i]; for (const [c, r] of S.cells) state[r * G + c] = 1; paint();
      R.board(`Lượt ${ri + 1}/6 · Đối xứng: ${S.n}`, 'Chạm ô bên PHẢI trục vàng để vẽ nửa còn lại');
      hud.msg('🪞 Soi hình hồng qua <b>trục vàng</b>: mỗi ô bên trái có 1 ô bên phải cách trục đúng bằng thế.', 0);
      hud.button('🧽 Xoá', () => { for (let i = 0; i < state.length; i++) if (state[i] === 2) state[i] = 0; paint(); }, 'sm'); hud.button('✅ Xong', checkSym, 'on');
    } else if (cur.k === 'area') {
      for (let r = 2; r < 6; r++) for (let c = 2; c < 6; c++) state[r * G + c] = 3; paint();
      R.board(`Lượt ${ri + 1}/6 · Diện tích`, 'Thảm vuông 4 × 4 (mỗi ô 1 m²)');
      quiz({ q: 'Biến thảm vuông 4 m × 4 m thành hình chữ nhật <b>cùng diện tích</b>, rộng 2 m. Dài bao nhiêu?', choices: ['8 m', '6 m', '4 m', '16 m'], a: 0, explain: 'Diện tích = 4 × 4 = 16 m². Rộng 2 m → dài = 16 : 2 = <b>8 m</b>.' }, () => { clear(); for (let r = 3; r < 5; r++) for (let c = 0; c < 8; c++) state[r * G + c] = 3; paint(); });
    } else {
      for (let r = 3; r < 5; r++) for (let c = 0; c < 8; c++) state[r * G + c] = 3; paint();
      R.board(`Lượt ${ri + 1}/6 · Chu vi`, 'Thảm mới 8 m × 2 m');
      quiz({ q: 'Thảm cũ 4 × 4 có chu vi 16 m. Thảm mới 8 m × 2 m có chu vi bao nhiêu?', choices: ['20 m', '16 m', '10 m', '32 m'], a: 0, explain: 'Chu vi = (8 + 2) × 2 = <b>20 m</b>. Cùng diện tích 16 m² nhưng chu vi khác nhau!' });
    }
  }
  async function quiz(q, after) { busy = true; await wait(1200); if (!root.parent) return; const ok = await ask(api, q); if (!root.parent) return; if (ok) { score += 21; hud.score(score); } else score += 5; if (after) { after(); api.sfx('open'); await wait(1600); } nextRound(); }
  async function pickSolid(k) {
    if (busy) return; if (k !== cur.want) { tries++; api.sfx('ui'); me.emote('no'); hud.msg(`❌ ${SOLIDS[k].n} chưa khớp mô tả. ${cur.q}`, 0); return; }
    busy = true; setSolid(k); me.emote('cheer'); api.sfx('win'); const pts = tries ? 8 : 21; score += pts; hud.score(score); hud.msg(`✨ Biến hình thành công! +${pts}<br>${cur.fact}`, 4200); await wait(4400); if (root.parent) nextRound();
  }
  async function checkSym() {
    if (busy) return; const S = SYM[cur.i]; let miss = 0, extra = 0;
    const want = new Set(S.cells.map(([c, r]) => r * G + (G - 1 - c)));
    for (let i = 0; i < state.length; i++) { if (want.has(i) && state[i] !== 2) miss++; if (!want.has(i) && state[i] === 2) extra++; }
    if (miss || extra) { tries++; api.sfx('ui'); me.emote('no'); hud.msg(`❌ Còn thiếu ${miss} ô, thừa ${extra} ô. Đếm khoảng cách từ trục vàng sang mỗi bên nhé!`, 3400); return; }
    busy = true; api.sfx('win'); me.emote('cheer'); const pts = tries ? 8 : 21; score += pts; hud.score(score);
    hud.msg(`🪞 Hình <b>${S.n}</b> đối xứng hoàn hảo! +${pts}<br>Hai nửa trùng khít khi gập theo trục.`, 3600); await wait(3800); if (root.parent) nextRound();
  }
  async function nextRound() {
    if (++ri < ROUNDS.length) return load();
    busy = true; hud.clearBar(); hud.msg('', 0); setSolid('cube');
    if (await ask(api, QEND)) { score += 13; hud.score(score); } if (!root.parent) return;
    done = true; finish(ctx, api, { score, max: 139, title: 'Lớp Biến Hình', text: `Khối, đối xứng, diện tích và chu vi — xong trong ${Math.floor(time / 60)} phút ${Math.floor(time % 60)} giây!` });
  }
  hud.score(0); load();
  return {
    tap(e) {
      if (busy || done || !cur || cur.k !== 'sym') return; const h = api.pick(e, [tiles]); if (!h || h.instanceId == null) return;
      const i = h.instanceId, c = i % G; if (c < G / 2) return hud.msg('👉 Hãy tô ở nửa <b>bên phải</b> trục vàng.', 2000);
      state[i] = state[i] === 2 ? 0 : 2; paint(); api.sfx('ui');
    },
    update(dt, t) {
      if (!done) { time += dt; hud.time(time); }
      holder.rotation.y += dt * 0.6; holder.position.y = 1.85 + Math.sin(t * 2) * 0.06;
      if (morph > 0) { morph -= dt * 2.6; if (morph <= 0) { morph = 0; if (next) { putSolid(next); next = null; } grow = 0.01; } holder.scale.setScalar(Math.max(0.01, morph)); }
      else if (grow < 1) { grow = Math.min(1, grow + dt * 2.6); holder.scale.setScalar(grow); }
    },
    dispose() { cleanup(); },
  };
}
