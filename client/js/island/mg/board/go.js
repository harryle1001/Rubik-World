// mg/board/go.js — CỜ VÂY 9 × 9 ngay trong thế giới (khoá 'go', cửa "Cờ vây"): bàn gỗ lớn trên sân, quân đá đen/trắng dẹt to bằng bánh xe.
// Em cầm quân ĐEN (đi trước), ông Sáu cầm TRẮNG. Luật cho người mới: đặt quân trên giao điểm; nhóm quân hết "khí" (giao điểm trống kề bên) thì bị bắt;
// không được tự sát; cấm lặp lại thế cờ ngay trước (luật cướp/ko). Cả hai "Bỏ lượt" liên tiếp → đếm điểm kiểu Trung Quốc (quân + đất) + 6,5 komi cho Trắng.
// Học: 💡 hiện số khí của nhóm vừa chạm, cảnh báo "Atari!" khi nhóm chỉ còn 1 khí.
// Tỷ lệ vàng: bàn 9 ô × φ m ≈ 13 m (Fibonacci), quân dẹt cao 1/φ³, điểm sao (hoshi) 5 điểm, camera 21 m.
import * as THREE from 'three';
import { PHI } from '../../layout.js';
import { quickQuiz } from '../quick-quiz.js';

const N = 9, C = PHI, TOP = 0.42, KOMI = 6.5;
const pos = (i, j) => [(i - (N - 1) / 2) * C, (j - (N - 1) / 2) * C];
const nb = (i, j) => [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]].filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N);
function group(B, i, j) {
  const who = B[i][j], seen = new Set([i * N + j]), st = [[i, j]], libs = new Set();
  while (st.length) { const [x, y] = st.pop(); for (const [a, b] of nb(x, y)) { const k = a * N + b; if (!B[a][b]) libs.add(k); else if (B[a][b] === who && !seen.has(k)) { seen.add(k); st.push([a, b]); } } }
  return { stones: [...seen].map(k => [Math.floor(k / N), k % N]), libs };
}
const key = B => B.map(r => r.map(v => v || '.').join('')).join('/');
// Thử đặt quân: trả về { B, captured } hoặc null nếu phạm luật
function tryMove(B, i, j, who, prevKey) {
  if (B[i][j]) return null;
  const nB = B.map(r => r.slice()), foe = who === 'b' ? 'w' : 'b'; nB[i][j] = who; let captured = [];
  for (const [a, b] of nb(i, j)) if (nB[a][b] === foe) { const g = group(nB, a, b); if (!g.libs.size) { for (const [x, y] of g.stones) nB[x][y] = null; captured = captured.concat(g.stones); } }
  if (!group(nB, i, j).libs.size) return null;            // tự sát
  if (prevKey && key(nB) === prevKey) return null;         // cướp (ko)
  return { B: nB, captured };
}
function score(B) {
  let b = 0, w = 0; const seen = new Set();
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (B[i][j] === 'b') b++; else if (B[i][j] === 'w') w++;
    else if (!seen.has(i * N + j)) {   // vùng trống: thuộc bên nào nếu chỉ chạm quân bên đó
      const st = [[i, j]], area = []; const touch = new Set(); seen.add(i * N + j);
      while (st.length) { const [x, y] = st.pop(); area.push(1); for (const [a, c] of nb(x, y)) { if (B[a][c]) touch.add(B[a][c]); else if (!seen.has(a * N + c)) { seen.add(a * N + c); st.push([a, c]); } } }
      if (touch.size === 1) { if (touch.has('b')) b += area.length; else w += area.length; }
    }
  }
  return { b, w: w + KOMI };
}
// AI đơn giản cho người mới: ưu tiên bắt quân, cứu nhóm bị atari, tránh tự đặt vào atari, chiếm điểm sao / gần quân
function aiMove(B, prevKey, level, who = 'w') {
  const foe = who === 'w' ? 'b' : 'w';
  let best = null, bv = -1e9;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const r = tryMove(B, i, j, who, prevKey); if (!r) continue;
    let v = r.captured.length * 30;
    const me = group(r.B, i, j); if (me.libs.size === 1) v -= 40; else v += Math.min(me.libs.size, 4) * 2;
    for (const [a, b] of nb(i, j)) { if (B[a][b] === who && group(B, a, b).libs.size === 1) v += 25; if (B[a][b] === foe) { const g = group(r.B, a, b); if (g.libs.size === 1) v += 12; v += 3; } }
    const edge = Math.min(i, j, N - 1 - i, N - 1 - j); v += edge === 0 ? -6 : edge === 2 ? 4 : 0;
    // không lấp mắt của chính mình
    if (nb(i, j).every(([a, b]) => B[a][b] === who)) v -= 30;
    v += Math.random() * ({ easy: 34, medium: 8, hard: 0 }[level] ?? 34);   // Dễ: hay đi lạc, trẻ dễ bắt quân
    if (v > bv) { bv = v; best = { i, j, r, v }; }
  }
  return best && best.v > -20 ? best : null;   // không còn nước tốt → bỏ lượt
}

export function startGo(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat, sfx = api.sfx;
  let level = (() => { try { return localStorage.getItem('mg.go.level') || 'easy'; } catch (e) { return 'easy'; } })();
  // ---------- Bàn gỗ ----------
  const S = (N - 1) * C + 2.4;
  const board = new THREE.Mesh(new THREE.BoxGeometry(S, 0.4, S), M('#d9a95e')); board.position.y = 0.2; board.castShadow = board.receiveShadow = true; root.add(board);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), M('#8a5a34')); leg.position.set(x * (S / 2 - 0.5), 0.01, z * (S / 2 - 0.5)); root.add(leg); }
  { const L = (N - 1) * C / 2, v = []; for (let k = 0; k < N; k++) { const p = (k - (N - 1) / 2) * C; v.push(-L, TOP + 0.005, p, L, TOP + 0.005, p, p, TOP + 0.005, -L, p, TOP + 0.005, L); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); root.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#3b2a1e' }))); }
  const hoshi = new THREE.InstancedMesh(new THREE.CircleGeometry(0.13, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#3b2a1e' }), 5);
  { const o = new THREE.Object3D(); [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]].forEach(([i, j], k) => { const [x, z] = pos(i, j); o.position.set(x, TOP + 0.01, z); o.updateMatrix(); hoshi.setMatrixAt(k, o.matrix); }); root.add(hoshi); }
  // ---------- Quân đá (instancing) ----------
  const sg = new THREE.SphereGeometry(0.62, 18, 10).scale(1, 1 / (PHI ** 3) / 0.62 * 1.2, 1).translate(0, 0.15, 0);
  const Bk = new THREE.InstancedMesh(sg, M('#25222c'), N * N), Wt = new THREE.InstancedMesh(sg, M('#f4f1ea'), N * N);
  Bk.castShadow = Wt.castShadow = true; Bk.frustumCulled = Wt.frustumCulled = false; root.add(Bk, Wt);
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.28, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8453c', depthWrite: false })); mark.visible = false; root.add(mark);
  const libM = new THREE.InstancedMesh(new THREE.CircleGeometry(0.22, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7ee07a', transparent: true, opacity: 0.85, depthWrite: false }), N * N); libM.count = 0; libM.frustumCulled = false; root.add(libM);
  const _o = new THREE.Object3D();

  let secShown = -1, B, prevKey = null, turn = 'b', over = false, busy = false, passes = 0, capB = 0, capW = 0, t0 = 0, lastMv = null;
  function draw() {
    let nb_ = 0, nw = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const v = B[i][j]; if (!v) continue; const [x, z] = pos(i, j); _o.position.set(x, TOP, z); _o.rotation.set(0, 0, 0); _o.scale.setScalar(1); _o.updateMatrix(); (v === 'b' ? Bk : Wt).setMatrixAt(v === 'b' ? nb_++ : nw++, _o.matrix); }
    Bk.count = nb_; Wt.count = nw; Bk.instanceMatrix.needsUpdate = Wt.instanceMatrix.needsUpdate = true;
    if (lastMv) { const [x, z] = pos(...lastMv); mark.position.set(x, TOP + 0.33, z); mark.visible = true; } else mark.visible = false;
    hud.score(capB);
  }
  function showLibs(i, j) {
    const g = group(B, i, j); let k = 0; for (const q of g.libs) { const [x, z] = pos(Math.floor(q / N), q % N); _o.position.set(x, TOP + 0.02, z); _o.scale.setScalar(1); _o.updateMatrix(); libM.setMatrixAt(k++, _o.matrix); } libM.count = k; libM.instanceMatrix.needsUpdate = true;
    return g;
  }
  function reset() {
    B = Array.from({ length: N }, () => Array(N).fill(null)); prevKey = null; turn = 'b'; over = false; busy = false; passes = 0; capB = capW = 0; lastMv = null; libM.count = 0; t0 = performance.now() / 1000; draw();
    hud.msg('Em cầm quân <b>đen</b>. Đặt quân lên giao điểm. Vây kín một nhóm quân trắng (hết <b>khí</b>) là bắt được! Chạm quân bất kỳ để xem khí.', 5000);
  }
  function afterMove(who, r, i, j) {
    prevKey = key(B); B = r.B; lastMv = [i, j]; passes = 0; sfx('land');
    if (r.captured.length) { if (who === 'b') { capB += r.captured.length; me.emote('cheer'); hud.msg(`🎉 Bắt được <b>${r.captured.length}</b> quân trắng!`, 2200); sfx('ok'); } else { capW += r.captured.length; ba && ba.emote('cheer'); hud.msg(`Ông Sáu bắt <b>${r.captured.length}</b> quân đen. Nhớ giữ nhiều khí cho nhóm quân nhé!`, 2600); } }
    draw();
    // cảnh báo atari cho em
    if (who === 'w') for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (B[a][b] === 'b') { const g = group(B, a, b); if (g.libs.size === 1) { hud.msg('⚠️ <b>Atari!</b> Một nhóm quân đen của em chỉ còn <b>1 khí</b> — nối thêm quân để cứu!', 2800); showLibs(a, b); return; } }
  }
  function aiTurn() {
    if (over) return; busy = true;
    setTimeout(() => {
      if (over) return; const m = aiMove(B, prevKey, level);
      if (!m) { passes++; ba && ba.say('Ông bỏ lượt.', 1800); hud.msg('Ông Sáu <b>bỏ lượt</b>. Nếu em cũng bỏ lượt thì ván cờ kết thúc và đếm điểm.', 3000); if (passes >= 2) return finish(); }
      else { ba && ba.emote('interact'); afterMove('w', m.r, m.i, m.j); }
      turn = 'b'; busy = false;
    }, 650);
  }
  function play(i, j) {
    if (over || busy || turn !== 'b') return;
    if (B[i][j]) { const g = showLibs(i, j); hud.msg(`Nhóm ${g.stones.length} quân ${B[i][j] === 'b' ? 'đen' : 'trắng'} có <b>${g.libs.size} khí</b> (chấm xanh).${g.libs.size === 1 ? ' Chỉ còn 1 khí: <b>Atari!</b>' : ''}`, 2600); sfx('ui'); return; }
    const r = tryMove(B, i, j, 'b', prevKey);
    if (!r) { hud.msg(B[i][j] ? '' : 'Không đặt được: quân đó sẽ <b>hết khí</b> ngay (tự sát) hoặc lặp lại thế cờ cũ (luật cướp).', 2800); sfx('land'); return; }
    libM.count = 0; me.emote('interact'); afterMove('b', r, i, j); turn = 'w'; aiTurn();
  }
  function pass() { if (over || busy || turn !== 'b') return; passes++; hud.msg('Em bỏ lượt.', 1500); if (passes >= 2) return finish(); turn = 'w'; aiTurn(); }
  function finish() {
    over = true; const s = score(B), win = s.b > s.w, t = Math.round(performance.now() / 1000 - t0);
    if (win) { me.emote('cheer'); ba && ba.say('Cháu giỏi lắm!'); } else ba && ba.emote('cheer');
    api.end({ score: win ? Math.round((s.b - s.w) * 10 + capB * 5 + ({ medium: 89, hard: 144 }[level] || 34)) : null, save: win, title: win ? '⚫ Đen thắng — Em thắng!' : '⚪ Trắng thắng ván này',
      text: `Đếm điểm: Đen ${s.b} · Trắng ${s.w} (đã cộng ${KOMI} điểm bù cho Trắng vì đi sau). Bắt được ${capB} quân, ${Math.floor(t / 60)} phút ${t % 60} giây. Cờ vây là trò chơi chiếm đất cổ nhất thế giới — hơn 2.500 năm!` });
  }
  // ---------- Chạm ----------
  const plane = new THREE.Plane(), _p = new THREE.Vector3();
  function ptAt(e) {
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), root.localToWorld(new THREE.Vector3(0, TOP, 0)));
    if (!api.ray(e).ray.intersectPlane(plane, _p)) return null; root.worldToLocal(_p);
    const i = Math.round(_p.x / C + (N - 1) / 2), j = Math.round(_p.z / C + (N - 1) / 2); return i >= 0 && j >= 0 && i < N && j < N ? [i, j] : null;
  }
  // ---------- HUD ----------
  [['easy', '🙂 Dễ'], ['medium', '🤔 Vừa'], ['hard', '🔥 Khó']].forEach(([lv, t]) => { const b = hud.button(t, () => { if (level === lv) return; level = lv; try { localStorage.setItem('mg.go.level', lv); } catch (e) {} api.restart(); }); b.classList.toggle('on', level === lv); });
  hud.button('💡', async () => {   // gợi ý: trả lời đúng câu hỏi → chấm sáng nước nên đi
    if (over || busy || turn !== 'b') return; busy = true; const ok = await quickQuiz(api, ['toan', 'khoahoc'], '💡 Trả lời đúng để mở gợi ý'); busy = false; if (!ok || over) return;
    const m = aiMove(B, prevKey, 'hard', 'b'); if (!m) { hud.msg('💡 Không còn nước tốt — em nên <b>Bỏ lượt</b> để đếm điểm.', 3000); return; }
    const [x, z] = pos(m.i, m.j); _o.position.set(x, TOP + 0.02, z); _o.scale.setScalar(1.6); _o.updateMatrix(); libM.setMatrixAt(0, _o.matrix); libM.count = 1; libM.instanceMatrix.needsUpdate = true;
    hud.msg(m.r.captured.length ? `💡 Đặt ở chấm xanh để <b>bắt ${m.r.captured.length} quân</b>!` : '💡 Thử đặt ở chấm xanh: giữ nhiều khí, vây đất rộng.', 3000);
  }, 'sm');
  hud.button('✋ Bỏ lượt', pass);
  hud.button('🧮 Đếm thử', () => { if (!B) return; const s = score(B); hud.msg(`Nếu dừng bây giờ: Đen <b>${s.b}</b> · Trắng <b>${s.w}</b> (gồm quân trên bàn + đất vây kín + ${KOMI} bù).`, 3500); });
  // ---------- Nhân vật ----------
  me.place(0, S / 2 + 1.3, Math.PI); me.face(0, 0);
  let ba = null;
  api.actor('student-male-c', { name: 'Ông Sáu', height: 1.62, look: { role: 'adult', shirt: '#6b8f71', pants: '#3b3b3b', glasses: true } }).then(a => { if (!a) return; ba = a; a.place(0, -S / 2 - 1.3, 0); a.face(0, 0); a.sit('floor'); a.say('Cờ vây: vây đất, bắt quân. Thử nhé!', 3000); });
  const port = innerWidth < innerHeight;
  api.cam.x = 0; api.cam.y = 0; api.cam.z = port ? 0 : 1; api.cam.yaw = 0; api.cam.pitch = port ? 1.25 : 1.0; api.cam.dist = port ? 22 : 21; api.orbit = true;
  reset();
  return {
    tap(e) { const p = ptAt(e); if (p) play(p[0], p[1]); },
    update() { if (!over && t0) { const s = performance.now() / 1000 - t0 | 0; if (s !== secShown) hud.time(secShown = s); } if (mark.visible) mark.material.color.setHSL(0.0, 0.7, 0.5 + Math.sin(performance.now() / 300) * 0.1); },
    dispose() { over = true; },
  };
}
