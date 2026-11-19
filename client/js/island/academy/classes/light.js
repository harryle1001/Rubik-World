// classes/light.js — LỚP BÙA CHÚ ÁNH SÁNG (Vật lý lớp 3–7: ánh sáng truyền thẳng, phản xạ ở gương, tán sắc qua lăng kính, khúc xạ qua tấm kính).
// Lưới 5 × 5 ô (1,3 m) trên sàn lớp. Pha lê bên trái phát tia sáng; chạm vào gương để xoay "/" ↔ "\" dẫn tia tới CỔNG RUNE.
//  Màn 1–3: gương phẳng (góc tới = góc phản xạ) · Màn 4: lăng kính tách ánh sáng trắng: tia ĐỎ lệch ít đi thẳng, tia LAM lệch nhiều rẽ phải
//  Màn 5: tấm kính dày làm tia lệch sang làn bên rồi ra song song tia cũ (khúc xạ). Xen 3 câu hỏi; điểm tối đa 144 (Fibonacci).
import * as THREE from 'three';
import { room, teacher, ask, finish, cleanup, prop, wait, PHI } from './common.js';

const N = 5, S = 1.3, Z0 = -0.6, COL = { w: '#fffbe6', r: '#ff4a3a', b: '#4a8bff' };
// ô: '/' '\' gương xoay được · 'X' đá · 'P' lăng kính · 'G' tấm kính · gate: ô ngoài lưới + màu cần
const LEVELS = [
  { t: 'Gương phẳng', src: 2, cells: { '2,2': '\\', '1,4': '/' }, gates: [[2, -1, 'w']], min: 1 },
  { t: 'Hai lần phản xạ', src: 0, cells: { '3,0': '/', '3,4': '/', '1,2': '\\', '4,1': 'X' }, gates: [[5, 4, 'w']], min: 2 },
  { t: 'Đường vòng', src: 1, cells: { '4,1': '/', '4,3': '\\', '0,3': '/', '2,2': 'X', '2,4': '/' }, gates: [[0, -1, 'w']], min: 3 },
  { t: 'Lăng kính — tán sắc', src: 2, cells: { '1,2': 'P', '4,2': '\\', '1,4': '\\', '2,0': 'X' }, gates: [[4, -1, 'r'], [-1, 4, 'b']], min: 2 },
  { t: 'Tấm kính — khúc xạ', src: 1, cells: { '1,1': 'G', '3,2': '\\', '3,0': '/', '2,1': 'X', '0,3': '/' }, gates: [[-1, 0, 'w']], min: 2 },
];
const QUIZ = [
  { q: 'Tia sáng chiếu vào gương phẳng. Góc phản xạ so với góc tới thế nào?', choices: ['Bằng nhau', 'Lớn gấp đôi', 'Luôn bằng 90°', 'Nhỏ hơn'], a: 0, explain: 'Định luật phản xạ: <b>góc phản xạ bằng góc tới</b>.' },
  { q: 'Ánh sáng trắng đi qua lăng kính bị tách thành mấy màu chính?', choices: ['7 màu', '2 màu', '3 màu', 'Không đổi màu'], a: 0, explain: '<b>Tán sắc</b>: đỏ, cam, vàng, lục, lam, chàm, tím — như cầu vồng. Tia đỏ lệch ít nhất, tia tím lệch nhiều nhất.' },
  { q: 'Vì sao chiếc thìa trong cốc nước trông như bị gãy?', choices: ['Ánh sáng bị khúc xạ khi đi từ nước ra không khí', 'Nước làm cong thìa', 'Do bóng của thìa', 'Do mắt mỏi'], a: 0, explain: 'Ánh sáng đổi hướng khi đi qua mặt phân cách hai môi trường — gọi là <b>khúc xạ</b>.' },
];
const QAFTER = { 1: 0, 3: 1, 4: 2 };   // sau màn nào hỏi câu nào

export function startLight(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat;
  const R = room(api, { rug: '#3c4a7a' }); R.board('✨ Bùa Chú Ánh Sáng', 'Dẫn tia sáng tới cổng rune');
  const portrait = innerWidth < innerHeight;
  Object.assign(api.cam, { x: 0, y: 0, z: Z0 + 0.3, yaw: 0, pitch: 1.05, dist: portrait ? 17 : 14 });
  me.place(0, 4.6, Math.PI); me.face(0, 0);
  teacher(api, 'student-male-c', 'Thầy Quang Minh', { shirt: '#f2c443', pants: '#3a3550', glasses: true },
    ['Chào các em! Đây là lớp Bùa Chú Ánh Sáng.', 'Ánh sáng đi thẳng; gặp gương thì phản xạ — góc tới bằng góc phản xạ.', 'Chạm vào gương để xoay, dẫn tia sáng tới cổng!'], [-4.6, -3.6]);
  // sàn lưới (canvas)
  { const c = document.createElement('canvas'); c.width = c.height = 320; const k = c.getContext('2d'); k.fillStyle = '#1d2238'; k.fillRect(0, 0, 320, 320); k.strokeStyle = '#8fa3ff66'; k.lineWidth = 3;
    for (let i = 0; i <= N; i++) { k.beginPath(); k.moveTo(i * 64, 0); k.lineTo(i * 64, 320); k.stroke(); k.beginPath(); k.moveTo(0, i * 64); k.lineTo(320, i * 64); k.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const f = new THREE.Mesh(new THREE.PlaneGeometry(N * S, N * S).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t })); f.position.set(0, 0.14, Z0); root.add(f); }
  const cx = c => (c - (N - 1) / 2) * S, cz = r => (r - (N - 1) / 2) * S + Z0, at = (c, r) => new THREE.Vector3(cx(c), 0.67, cz(r));
  // nguồn sáng: pha lê trên bệ
  const src = new THREE.Group(); src.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.5, 8).translate(0, 0.25, 0), M('#6b6478')));
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), new THREE.MeshBasicMaterial({ color: '#cfe8ff' })); gem.scale.y = PHI; gem.position.y = 0.88; src.add(gem); root.add(src);
  // tia sáng: bể 21 đoạn hộp mảnh
  const beamGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5), beamMat = {}; for (const k in COL) beamMat[k] = new THREE.MeshBasicMaterial({ color: COL[k], transparent: true, opacity: 0.9, depthWrite: false });
  const beams = []; for (let i = 0; i < 21; i++) { const m = new THREE.Mesh(beamGeo, beamMat.w); m.visible = false; m.renderOrder = 3; root.add(m); beams.push(m); }
  const lvlG = new THREE.Group(); root.add(lvlG);
  let L = null, grid = null, mirrors = [], gates = [], taps = 0, score = 0, li = 0, busy = false, time = 0, done = false;

  function build(i) {
    L = LEVELS[i]; grid = {}; mirrors = []; gates = []; taps = 0; busy = false;
    for (const o of [...lvlG.children]) { lvlG.remove(o); o.traverse(q => { if (q.geometry && !q.geometry.userData.shared) q.geometry.dispose(); }); }
    src.position.set(cx(-1), 0.12, cz(L.src));
    for (const [k, v] of Object.entries(L.cells)) {
      const [c, r] = k.split(',').map(Number); grid[k] = v; const p = at(c, r);
      if (v === '/' || v === '\\') {
        const g = new THREE.Group(); g.position.set(p.x, 0.12, p.z); g.add(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.9, 0.12).translate(0, 0.55, 0), M('#c9a86a')));
        const face = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.75), new THREE.MeshBasicMaterial({ color: '#dff3ff', side: THREE.DoubleSide })); face.position.set(0, 0.55, 0.07); g.add(face);
        g.rotation.y = v === '/' ? Math.PI / 4 : -Math.PI / 4; g.userData = { k, rot: g.rotation.y }; lvlG.add(g); mirrors.push(g);
      } else if (v === 'X') prop(api, 'rock_small', p.x, 0.12, p.z, 1.1, c * 1.3, lvlG);
      else if (v === 'P') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 3).translate(0, 0.62, 0), new THREE.MeshLambertMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.6 })); m.position.set(p.x, 0.12, p.z); m.rotation.y = Math.PI / 2; lvlG.add(m); }
      else if (v === 'G') { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 1.1).translate(0, 0.57, 0), new THREE.MeshLambertMaterial({ color: '#a8e6ff', transparent: true, opacity: 0.5 })); m.position.set(p.x, 0.12, p.z); m.rotation.y = 0.5; lvlG.add(m); }
    }
    for (const [c, r, col] of L.gates) {   // cổng rune: 2 cột + xà, ô cửa đổi màu khi đúng tia
      const g = new THREE.Group(), p = at(c, r); g.position.set(p.x, 0.12, p.z); g.rotation.y = c < 0 || c >= N ? Math.PI / 2 : 0;
      for (const s of [-0.62, 0.62]) g.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.6, 0.22).translate(s, 0.8, 0), M('#7f7a73')));
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.24, 0.3).translate(0, 1.7, 0), M('#7f7a73')));
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), new THREE.MeshBasicMaterial({ color: '#2a2f4a', side: THREE.DoubleSide })); pane.position.y = 0.8; g.add(pane);
      const rune = new THREE.Mesh(new THREE.CircleGeometry(0.22, 13), new THREE.MeshBasicMaterial({ color: COL[col], side: THREE.DoubleSide })); rune.position.y = 1.7; rune.position.z = 0.16; g.add(rune);
      lvlG.add(g); gates.push({ c, r, col, pane, lit: false });
    }
    R.board(`Màn ${i + 1}/5 · ${L.t}`, L.gates.length > 1 ? 'Cần thắp sáng CẢ HAI cổng (đúng màu)' : 'Chạm gương để xoay  /  ↔  \\');
    hud.info(`Màn <b>${i + 1}</b>/5`); trace();
  }
  // dò tia: trả các đoạn [điểm đầu, điểm cuối, màu], đánh dấu cổng sáng
  function trace() {
    let n = 0; for (const g of gates) g.lit = false;
    const seg = (a, b, col) => { if (n >= beams.length) return; const m = beams[n++], d = b.clone().sub(a); m.visible = true; m.material = beamMat[col]; m.position.copy(a); m.scale.set(0.09, 0.09, Math.max(0.01, d.length())); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()); };
    const stack = [[-1, L.src, 1, 0, 'w', at(-1, L.src)]]; let steps = 0;
    while (stack.length && steps++ < 34) {
      let [c, r, dx, dz, col, a] = stack.pop();
      for (let k = 0; k < 34; k++) {
        const nc = c + dx, nr = r + dz, p = at(nc, nr);
        if (nc < 0 || nr < 0 || nc >= N || nr >= N) {
          const g = gates.find(q => q.c === nc && q.r === nr); if (g && g.col === col) g.lit = true;
          seg(a, g ? p : at(c + dx * 0.9, r + dz * 0.9), col); break;
        }
        const v = grid[nc + ',' + nr]; c = nc; r = nr;
        if (!v) continue;
        if (v === 'X') { seg(a, at(c - dx * 0.35, r - dz * 0.35), col); break; }
        seg(a, p, col); a = p;
        if (v === '/') { [dx, dz] = [-dz, -dx]; continue; }
        if (v === '\\') { [dx, dz] = [dz, dx]; continue; }
        if (v === 'P') { if (col === 'w') { stack.push([c, r, dx, dz, 'r', p], [c, r, -dz, dx, 'b', p]); break; } continue; }
        if (v === 'G') { const sc = c - dz, sr = r + dx, q = at(sc, sr); seg(p, q, col); a = q; c = sc; r = sr; continue; }   // lệch sang làn bên phải rồi đi tiếp song song
      }
    }
    for (let i = n; i < beams.length; i++) beams[i].visible = false;
    for (const g of gates) g.pane.material.color.set(g.lit ? COL[g.col] : '#2a2f4a');
    if (!busy && gates.every(g => g.lit)) win();
  }
  async function win() {
    busy = true; api.sfx('win'); me.emote('cheer');
    const pts = Math.max(8, 21 - Math.max(0, taps - L.min) * 3); score += pts; hud.score(score);
    hud.msg(`🌟 Cổng mở! +${pts} điểm${taps > L.min ? ` (dùng ${taps} lần xoay, ít nhất là ${L.min})` : ' — số lần xoay ít nhất!'}`, 2600);
    await wait(2200); if (!root.parent) return;
    if (QAFTER[li] != null) { if (await ask(api, QUIZ[QAFTER[li]])) { score += 13; hud.score(score); } if (!root.parent) return; }
    if (++li < LEVELS.length) build(li);
    else { done = true; finish(ctx, api, { score, max: 144, title: 'Bùa Chú Ánh Sáng', text: `Thời gian ${Math.floor(time / 60)} phút ${Math.floor(time % 60)} giây. Em đã điều khiển ánh sáng như một nhà vật lý!` }); }
  }
  hud.score(0); build(0);
  return {
    tap(e) {
      if (busy || done) return; const h = api.pick(e, mirrors); if (!h) return;
      let g = h.object; while (g && !mirrors.includes(g)) g = g.parent; if (!g) return;
      const k = g.userData.k; grid[k] = grid[k] === '/' ? '\\' : '/'; g.userData.rot = grid[k] === '/' ? Math.PI / 4 : -Math.PI / 4; taps++; api.sfx('ui'); me.emote('use'); trace();
    },
    update(dt, t) {
      if (!done) { time += dt; hud.time(time); }
      gem.rotation.y = t * 1.3;
      for (const g of mirrors) g.rotation.y += (g.userData.rot - g.rotation.y) * (1 - Math.exp(-dt * 13));
    },
    dispose() { cleanup(); },
  };
}
