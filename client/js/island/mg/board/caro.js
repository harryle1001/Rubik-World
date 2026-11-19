// mg/board/caro.js — CỜ CARO KHỔNG LỒ ngay trong thế giới (khoá 'caro', cửa "Cờ caro"): bàn 13 × 13 ô vẽ trên sân, mỗi ô 1 m,
// em cầm quân X (đỏ), bạn Nhi cầm quân O (xanh). Ai có 5 quân liền nhau (ngang, dọc, chéo) trước là thắng.
// Học: 💡 gợi ý chỉ nước chặn/tấn công và giải thích ("chặn 4 của Nhi", "tạo 3 mở hai đầu"); nước vừa đi có vòng sáng.
// Tỷ lệ vàng: bàn 13 (Fibonacci), quân X cao 0,618 m, O vòng tròn π, nảy 0,382 s (1/φ²), camera 21 m.
import * as THREE from 'three';
import { PHI } from '../../layout.js';
import { quickQuiz } from '../quick-quiz.js';

const N = 13, CELL = 1, TOP = 0.12, H = N * CELL / 2;
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const cellPos = (i, j) => [(i - (N - 1) / 2) * CELL, (j - (N - 1) / 2) * CELL];

// Điểm của 1 ô cho 1 bên: cộng theo chuỗi dài và số đầu mở ở 4 hướng
function lineInfo(B, i, j, who) {
  const out = [];
  for (const [dx, dy] of DIRS) {
    let n = 1, open = 0;
    for (const s of [1, -1]) { let x = i + dx * s, y = j + dy * s; while (x >= 0 && y >= 0 && x < N && y < N && B[x][y] === who) { n++; x += dx * s; y += dy * s; } if (x >= 0 && y >= 0 && x < N && y < N && !B[x][y]) open++; }
    out.push([n, open]);
  }
  return out;
}
const VAL = (n, open) => n >= 5 ? 1e6 : !open ? 0 : n === 4 ? (open === 2 ? 5e4 : 6e3) : n === 3 ? (open === 2 ? 4e3 : 400) : n === 2 ? (open === 2 ? 200 : 30) : open * 5;
function scoreCell(B, i, j, who) { let s = 0; for (const [n, o] of lineInfo(B, i, j, who)) s += VAL(n, o); return s; }
function bestMove(B, me, foe, noise = 0) {
  let best = null, bv = -1;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (B[i][j]) continue;
    let near = false; for (let a = -2; a <= 2 && !near; a++) for (let b = -2; b <= 2; b++) { const x = i + a, y = j + b; if (x >= 0 && y >= 0 && x < N && y < N && B[x][y]) { near = true; break; } }
    if (!near) continue;
    const atk = scoreCell(B, i, j, me), def = scoreCell(B, i, j, foe), v = atk * 1.1 + def + Math.random() * noise;
    if (v > bv) { bv = v; best = { i, j, atk, def }; }
  }
  return best || { i: (N - 1) / 2, j: (N - 1) / 2, atk: 0, def: 0 };
}
function fiveFrom(B, i, j, who) {
  for (const [dx, dy] of DIRS) {
    const cells = [[i, j]];
    for (const s of [1, -1]) { let x = i + dx * s, y = j + dy * s; while (x >= 0 && y >= 0 && x < N && y < N && B[x][y] === who) { cells.push([x, y]); x += dx * s; y += dy * s; } }
    if (cells.length >= 5) return cells;
  }
  return null;
}

// nhiễu của AI: Dễ hay bỏ sót hàng 3 mở (trẻ thắng được), Vừa chặn gần đủ, Khó không nhiễu + ưu tiên tấn công
const NOISE = { easy: 4500, medium: 300, hard: 0 };
export function startCaro(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat, sfx = api.sfx;
  let level = (() => { try { return localStorage.getItem('mg.caro.level') || 'easy'; } catch (e) { return 'easy'; } })();
  // ---------- Bàn cờ vẽ trên sân ----------
  const base = new THREE.Mesh(new THREE.BoxGeometry(N * CELL + 1.2, 0.1, N * CELL + 1.2), M('#e9dcbc')); base.position.y = 0.05; base.receiveShadow = true; root.add(base);
  const lines = []; for (let k = 0; k < N; k++) { const p = (k - (N - 1) / 2) * CELL; lines.push(-H + 0.5, TOP - 0.01, p, H - 0.5, TOP - 0.01, p, p, TOP - 0.01, -H + 0.5, p, TOP - 0.01, H - 0.5); }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)); root.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#7a5a2e' }))); }
  const rim = new THREE.Mesh(new THREE.BoxGeometry(N * CELL + 1.6, 0.2, N * CELL + 1.6), M('#8a5a34')); rim.position.y = -0.04; root.add(rim);   // mặt viền thấp hơn mặt bàn (tránh z-fighting)
  // ---------- Quân (instancing: tối đa 85 quân mỗi bên) ----------
  const xg = new THREE.BoxGeometry(0.78, 0.16, 0.16); const xParts = [xg.clone().rotateY(Math.PI / 4), xg.clone().rotateY(-Math.PI / 4)];
  const xGeo = new THREE.BufferGeometry(); { const a = xParts.map(g => g.toNonIndexed()); const pos = [], nor = []; for (const g of a) { pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); } xGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); xGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); xGeo.translate(0, 0.08, 0); }
  const oGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 21).rotateX(Math.PI / 2).translate(0, 0.08, 0);
  const X = new THREE.InstancedMesh(xGeo, M('#e8453c'), 85), O = new THREE.InstancedMesh(oGeo, M('#3d8fd9'), 85); X.count = O.count = 0; X.castShadow = O.castShadow = true; X.frustumCulled = O.frustumCulled = false; root.add(X, O);
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 21).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd36e', transparent: true, opacity: 0.9, depthWrite: false })); mark.position.y = TOP + 0.02; mark.visible = false; root.add(mark);
  const hintM = mark.clone(); hintM.material = new THREE.MeshBasicMaterial({ color: '#7ee07a', transparent: true, opacity: 0.9, depthWrite: false }); root.add(hintM);
  const winLine = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.12), new THREE.MeshBasicMaterial({ color: '#ffd36e' })); winLine.visible = false; root.add(winLine);
  const _o = new THREE.Object3D(), drops = [];

  let secShown = -1, B = [], turn = 'x', over = false, busy = false, moves = 0, t0 = 0;
  function put(i, j, who) {
    B[i][j] = who; moves++; const I = who === 'x' ? X : O, k = I.count++; const [x, z] = cellPos(i, j);
    drops.push({ I, k, x, z, t: 0 }); mark.position.x = x; mark.position.z = z; mark.visible = true; hintM.visible = false; sfx('land');
  }
  function reset() {
    B = Array.from({ length: N }, () => Array(N).fill(null)); X.count = O.count = 0; drops.length = 0; turn = 'x'; over = false; busy = false; moves = 0; t0 = performance.now() / 1000;
    mark.visible = hintM.visible = winLine.visible = false; hud.score(0); hud.msg('Em cầm quân <b>X đỏ</b>, đi trước. Chạm vào một giao điểm trên bàn. Ai xếp được <b>5 quân liền nhau</b> trước là thắng!', 4500);
  }
  function showWin(cells) {
    cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const [a, b] = [cells[0], cells[cells.length - 1]], [x0, z0] = cellPos(...a), [x1, z1] = cellPos(...b);
    winLine.scale.x = Math.hypot(x1 - x0, z1 - z0) + 0.8; winLine.position.set((x0 + x1) / 2, TOP + 0.35, (z0 + z1) / 2); winLine.rotation.y = -Math.atan2(z1 - z0, x1 - x0); winLine.visible = true;
  }
  function finish(win, cells) {
    over = true; if (cells) showWin(cells); const t = Math.round(performance.now() / 1000 - t0);
    if (win) { me.emote('cheer'); lan && lan.emote('no'); lan && lan.say('Em giỏi quá!'); } else if (win === false) { lan && lan.emote('cheer'); me.emote('no'); }
    setTimeout(() => api.end(win ? { score: Math.max(13, 200 - moves * 3) + ({ medium: 55, hard: 144 }[level] || 0), title: '🎉 5 quân liền — Em thắng!', text: `Thắng sau ${Math.ceil(moves / 2)} nước, ${Math.floor(t / 60)} phút ${t % 60} giây. Mẹo: luôn chặn khi đối thủ có 3 quân mở hai đầu!` }
      : win === false ? { score: null, save: false, title: 'Bạn Nhi thắng ván này', text: 'Không sao! Hãy để ý: khi đối thủ có 3 quân liền mà hai đầu còn trống, phải chặn ngay — nếu để thành 4 mở thì không chặn kịp.' }
        : { score: 34, title: '🤝 Hoà cờ', text: 'Bàn đã kín mà chưa ai có 5 quân. Hoà cũng đẹp!' }), 1600);
  }
  function play(i, j) {
    if (over || busy || turn !== 'x' || B[i][j]) return;
    put(i, j, 'x'); me.emote('interact');
    const w = fiveFrom(B, i, j, 'x'); if (w) return finish(true, w);
    if (moves >= N * N) return finish(null);
    turn = 'o'; busy = true;
    if (lan && Math.random() < 0.4) lan.say(['Hừm…', 'Để mình nghĩ…', 'À ha!'][(Math.random() * 3) | 0], 1200);
    setTimeout(() => {
      if (over) return; const m = bestMove(B, 'o', 'x', NOISE[level] ?? NOISE.easy);
      put(m.i, m.j, 'o'); if (m.def >= 4e3 && Math.random() < 0.7) hud.msg('Nhi vừa <b>chặn</b> hàng của em!', 1800);
      const w2 = fiveFrom(B, m.i, m.j, 'o'); if (w2) return finish(false, w2);
      if (moves >= N * N) return finish(null);
      const thr = lineInfo(B, m.i, m.j, 'o').some(([n, o]) => (n === 3 && o === 2) || n === 4);
      if (thr) hud.msg('⚠️ Nhi đang có hàng nguy hiểm — <b>chặn</b> ngay!', 2200);
      turn = 'x'; busy = false;
    }, 700);
  }
  // ---------- Chạm ô ----------
  const plane = new THREE.Plane(), _p = new THREE.Vector3();
  function cellAt(e) {
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), root.localToWorld(new THREE.Vector3(0, TOP, 0)));
    if (!api.ray(e).ray.intersectPlane(plane, _p)) return null; root.worldToLocal(_p);
    const i = Math.round(_p.x / CELL + (N - 1) / 2), j = Math.round(_p.z / CELL + (N - 1) / 2); return i >= 0 && j >= 0 && i < N && j < N ? [i, j] : null;
  }
  // ---------- HUD ----------
  [['easy', '🙂 Dễ'], ['medium', '🤔 Vừa'], ['hard', '🔥 Khó']].forEach(([lv, t]) => { const b = hud.button(t, () => { if (level === lv) return; level = lv; try { localStorage.setItem('mg.caro.level', lv); } catch (e) {} api.restart(); }); b.classList.toggle('on', level === lv); });
  hud.button('💡 Gợi ý', async () => {
    if (over || busy || turn !== 'x') return; busy = true; const ok = await quickQuiz(api, ['toan'], '💡 Trả lời đúng để mở gợi ý'); busy = false; if (!ok || over) return; const m = bestMove(B, 'x', 'o', 0); const [x, z] = cellPos(m.i, m.j); hintM.position.set(x, TOP + 0.03, z); hintM.visible = true;
    hud.msg(m.def >= 5e4 ? '💡 Nhi sắp có 5 — <b>chặn ngay</b> ô sáng xanh!' : m.atk >= 5e4 ? '💡 Đi ô sáng xanh là em có <b>4 mở</b> — gần thắng rồi!' : m.def >= 4e3 ? '💡 Chặn hàng 3 mở của Nhi ở ô sáng xanh.' : m.atk >= 4e3 ? '💡 Ô sáng xanh tạo <b>3 mở hai đầu</b> cho em.' : '💡 Đi gần quân của mình để nối dài hàng.', 3500);
  });
  hud.button('🔁 Ván mới', () => api.restart());
  // ---------- Nhân vật ----------
  me.place(0, H + 1.6, Math.PI); me.face(0, 0);
  let lan = null;
  api.actor('student-female-b', { name: 'Nhi', look: { role: 'student', shirt: '#3d8fd9', pants: '#2a2f4a' } }).then(a => { if (!a) return; lan = a; a.place(0, -H - 1.6, 0); a.face(0, 0); a.say('Chơi caro với mình nhé!', 2600); });
  const port = innerWidth < innerHeight;
  api.cam.x = 0; api.cam.y = 0; api.cam.z = port ? 0 : 1.5; api.cam.yaw = 0; api.cam.pitch = port ? 1.25 : 1.0; api.cam.dist = port ? 22 : 21; api.orbit = true;
  reset();
  return {
    tap(e) { const c = cellAt(e); if (c) play(c[0], c[1]); },
    update(dt) {
      for (let k = drops.length - 1; k >= 0; k--) { const d = drops[k]; d.t += dt; const u = Math.min(1, d.t / (1 / (PHI * PHI))), y = TOP + (1 - u) * 2.2 + Math.sin(Math.PI * Math.min(1, u * 1.3)) * 0.2 * (1 - u);
        _o.position.set(d.x, y, d.z); _o.rotation.set(0, d.I === X ? 0 : u * Math.PI, 0); _o.scale.setScalar(0.6 + 0.4 * u); _o.updateMatrix(); d.I.setMatrixAt(d.k, _o.matrix); d.I.instanceMatrix.needsUpdate = true; if (u >= 1) drops.splice(k, 1); }
      if (!over && t0) { const s = performance.now() / 1000 - t0 | 0; if (s !== secShown) hud.time(secShown = s); }
      if (mark.visible) mark.material.opacity = 0.6 + Math.sin(performance.now() / 260) * 0.3;
    },
    dispose() { over = true; },
  };
}
