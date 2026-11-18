// mg/board/rubik.js — PHÒNG RUBIK 3D: khối Rubik khổng lồ 3×3 như thật (26 viên bo góc + 54 miếng dán, chỉ 2 lần vẽ nhờ InstancedMesh),
// xoay bằng vuốt trên khối (vuốt ngoài khối = xoay camera) hoặc nút U R F L D B. 3 chế độ:
//   ⏱ Đua giờ: xáo 21 nước rồi bấm giờ (kỷ lục thấp nhất được lưu) · 📘 Công thức: 8 công thức của phương pháp tầng-theo-tầng,
//   làm theo từng bước có kiểm tra · 🧩 Tự do: xoay thoải mái, 💡 gợi ý nước tiếp theo để quay về khối hoàn chỉnh.
// Tỷ lệ: viên 1 m, khe 1/φ⁶ m; bệ cao 1/φ·φ² … ; camera cách khối 8 m (Fibonacci).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PHI } from '../../layout.js';

const COL = { U: '#f7f7f2', D: '#ffd23f', F: '#3fae4a', B: '#2f6fd6', R: '#d8322a', L: '#ff8a1f' };
const FACE_N = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };
// nước xoay: trục, lớp, số phần tư vòng (+ = ngược chiều kim đồng hồ quanh trục dương)
const BASE = { R: ['x', 1, -1], L: ['x', -1, 1], M: ['x', 0, 1], U: ['y', 1, -1], D: ['y', -1, 1], E: ['y', 0, 1], F: ['z', 1, -1], B: ['z', -1, 1], S: ['z', 0, -1] };
const NAME_VI = { R: 'mặt phải', L: 'mặt trái', U: 'mặt trên', D: 'mặt dưới', F: 'mặt trước', B: 'mặt sau', M: 'lớp giữa dọc', E: 'lớp giữa ngang', S: 'lớp giữa trước' };
export const parseAlg = s => s.trim().split(/\s+/).filter(Boolean);
export function toMove(n) { const b = BASE[n[0]]; if (!b) return null; let q = b[2]; if (n.includes("'")) q = -q; if (n.includes('2')) q = 2; return { ax: b[0], layer: b[1], q }; }
export function toNote(m) {
  for (const [k, [ax, l, q]] of Object.entries(BASE)) if (ax === m.ax && l === m.layer) return Math.abs(m.q) === 2 ? k + '2' : m.q === q ? k : k + "'";
  return '?';
}
const explain = n => { const k = n[0]; return `${NAME_VI[k] || k} ${n.includes('2') ? 'xoay nửa vòng (180°)' : n.includes("'") ? 'ngược chiều kim đồng hồ' : 'theo chiều kim đồng hồ'}`; };
// Phương pháp tầng-theo-tầng (người mới học): 7 bước + cú "sexy"
const FORMULAS = [
  ['Ký hiệu xoay', "Mỗi chữ cái là một mặt: U trên, D dưới, L trái, R phải, F trước, B sau. Chữ đơn = xoay 90° theo chiều kim đồng hồ khi nhìn thẳng vào mặt đó; thêm ' = ngược chiều.", "R U R' U'"],
  ['B1 · Dấu cộng trắng', 'Đưa 4 cạnh trắng lên quanh tâm trắng, màu thứ hai khớp tâm mặt bên. Cạnh nằm dưới đáy đúng chỗ → F2 để đưa lên.', 'F2'],
  ['B2 · Bốn góc trắng', 'Trắng xuống dưới. Đặt góc trắng ngay trên chỗ của nó (phải-trước), lặp "cú sexy" tới khi góc vào đúng.', "R U R' U'"],
  ['B3 · Tầng giữa → phải', 'Cạnh không có màu vàng ở tầng trên, xoay U cho màu trước khớp tâm trước. Cạnh cần sang phải:', "U R U' R' U' F' U F"],
  ['B3 · Tầng giữa → trái', 'Công thức đối xứng khi cạnh cần sang trái:', "U' L' U L U F U' F'"],
  ['B4 · Dấu cộng vàng', 'Vàng lên trên. Thấy chấm, chữ L (để ở trái-sau) hoặc đường ngang → làm tới khi có dấu cộng.', "F R U R' U' F'"],
  ['B5 · Cạnh vàng đúng chỗ', 'Xoay U cho 2 cạnh khớp tâm, đặt chúng ở sau và phải rồi làm:', "R U R' U R U2 R' U"],
  ['B6 · Góc vàng đúng chỗ', 'Góc đã đúng chỗ đặt ở phải-trước, làm tới khi đủ 4 góc:', "U R U' L' U R' U' L"],
  ['B7 · Xoay góc vàng', "Góc cần xoay ở phải-trước-trên. Lặp R' D' R D tới khi vàng lên trên, rồi U sang góc kế. Khối rối tạm thời là bình thường!", "R' D' R D R' D' R D"],
];

export function startRubik(ctx, { api, door }) {
  const { root, hud, me } = api, M = api.mat;
  const CUBE_Y = 1 + PHI;   // tâm khối cao 1 + φ m (bệ cao 1 m)
  // ---------- Sân khấu: nền tròn bán kính 8 m, bệ trụ, 4 khối Rubik nhỏ trang trí ----------
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(8, 8.3, 0.24, 48), M('#efe2c4')); floor.position.y = 0.12; floor.receiveShadow = true; root.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 0.13, 6, 64).rotateX(Math.PI / 2), M('#d8322a')); ring.position.y = 0.25; root.add(ring);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(PHI, PHI * 1.12, 1, 8), M('#5a3fa0')); ped.position.y = 0.74; ped.castShadow = ped.receiveShadow = true; root.add(ped);
  const cube = new THREE.Group(); cube.position.y = CUBE_Y; root.add(cube);
  // ---------- 26 viên: body (InstancedMesh) + 54 miếng dán (InstancedMesh, màu theo bản sao) ----------
  const body = new THREE.InstancedMesh(new RoundedBoxGeometry(0.97, 0.97, 0.97, 2, 0.13), M('#1d1b22'), 26); body.castShadow = true;
  const sh = new THREE.Shape(), r = 0.13, w = 0.4; sh.moveTo(-w + r, -w); sh.lineTo(w - r, -w); sh.quadraticCurveTo(w, -w, w, -w + r); sh.lineTo(w, w - r); sh.quadraticCurveTo(w, w, w - r, w); sh.lineTo(-w + r, w); sh.quadraticCurveTo(-w, w, -w, w - r); sh.lineTo(-w, -w + r); sh.quadraticCurveTo(-w, -w, -w + r, -w);
  const stick = new THREE.InstancedMesh(new THREE.ShapeGeometry(sh, 3), new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: M('#fff').gradientMap }), 54);
  cube.add(body, stick);
  const cubies = [], stickers = [];
  const reset = () => {
    cubies.length = stickers.length = 0; let si = 0;
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      if (!x && !y && !z) continue;
      const c = { pos: new THREE.Vector3(x, y, z), q: new THREE.Quaternion(), st: [] }; cubies.push(c);
      for (const [f, n] of Object.entries(FACE_N)) if ((n[0] && n[0] === x) || (n[1] && n[1] === y) || (n[2] && n[2] === z)) {
        const nv = new THREE.Vector3(...n), m = new THREE.Matrix4().lookAt(new THREE.Vector3(), nv.clone().negate(), Math.abs(n[1]) ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0));
        m.setPosition(nv.clone().multiplyScalar(0.488)); const s = { i: si++, c, n: nv, color: f, local: m }; c.st.push(s); stickers.push(s); stick.setColorAt(s.i, new THREE.Color(COL[f]));
      }
    }
    stick.instanceColor.needsUpdate = true; hist.length = 0; draw();
  };
  const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _s = new THREE.Vector3(1, 1, 1), _q = new THREE.Quaternion(), AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
  let anim = null;   // { m, t, dur, list }
  function draw() {
    cubies.forEach((c, i) => {
      _m.compose(c.pos, c.q, _s);
      if (anim && anim.list.has(c)) { _q.setFromAxisAngle(AX[anim.m.ax], anim.m.q * Math.PI / 2 * ease(anim.t / anim.dur)); _m.premultiply(_m2.makeRotationFromQuaternion(_q)); }
      body.setMatrixAt(i, _m); for (const s of c.st) stick.setMatrixAt(s.i, _m2.multiplyMatrices(_m, s.local));
    });
    body.instanceMatrix.needsUpdate = stick.instanceMatrix.needsUpdate = true; body.computeBoundingSphere(); stick.computeBoundingSphere();
  }
  const ease = t => t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
  const inLayer = m => new Set(cubies.filter(c => Math.round(c.pos[m.ax]) === m.layer));
  function bake(m) {
    _q.setFromAxisAngle(AX[m.ax], m.q * Math.PI / 2);
    for (const c of inLayer(m)) { c.pos.applyQuaternion(_q).round(); c.q.premultiply(_q).normalize(); }
  }
  function solved() {
    const by = {};
    for (const s of stickers) { const d = s.n.clone().applyQuaternion(s.c.q).round(), k = d.x + ',' + d.y + ',' + d.z; if (by[k] && by[k] !== s.color) return false; by[k] = s.color; }
    return true;
  }
  // ---------- Hàng đợi nước xoay ----------
  const queue = [], hist = [];
  const push = m => { const t = hist[hist.length - 1]; if (t && t.ax === m.ax && t.layer === m.layer) { let q = ((t.q + m.q) % 4 + 4) % 4; if (q === 3) q = -1; if (!q) hist.pop(); else t.q = q; } else hist.push({ ...m }); };
  const doMove = (m, o = {}) => queue.push({ m, dur: o.dur ?? 0.22, user: !!o.user, silent: !!o.silent });
  // ---------- Trạng thái chơi ----------
  let mode = null, tRun = 0, timing = false, moves = 0, hints = 0, F = null, done = false, emoteT = 0;
  const setMoves = v => { moves = v; hud.score(v); };
  function onUserMove(m) {
    const n = toNote(m);
    if (mode === 'race' && !timing && !done) { timing = true; tRun = 0; hud.msg('⏱ Bắt đầu tính giờ!', 1200); }
    setMoves(moves + 1);
    if (emoteT <= 0) { me.emote('interact'); emoteT = 1.3; }
    if (mode === 'formula' && F) {
      const want = F.expect[F.pos];
      let ok = n === want;
      if (!ok && want.includes('2') && n[0] === want[0]) {   // 180° = 2 lần 90° cùng chiều
        if (!F.half) { F.half = n; hud.msg(`Đúng mặt! Xoay thêm 1 lần ${n} nữa để đủ ${want} (180°)`, 2200); return; }
        ok = F.half === n;
      }
      if (ok) {
        F.half = false; F.pos++; renderF();
        if (F.pos >= F.expect.length) { hud.msg(`🎉 Hoàn thành công thức <b>${F.name}</b>!`, 3000); coach && coach.say('Giỏi lắm!'); fans.forEach(f => f.emote('cheer')); me.emote('cheer'); F.done = true; F.stars++; hud.score(F.stars); api.saveBest(F.stars); }
        else hud.msg(`✔ ${n} — tiếp theo: <b>${F.expect[F.pos]}</b> (${explain(F.expect[F.pos])})`, 0);
      } else { F.half = false; hud.msg(`✖ Chưa đúng: cần <b>${want}</b> (${explain(want)}). Khối tự quay lại nhé.`, 2600); const inv = { ...m, q: -m.q }; setTimeout(() => doMove(inv, { silent: true }), 260); coach && coach.say('Thử lại nào!'); }
    }
  }
  function finishCheck() {
    if (done || !solved()) return;
    if (mode === 'race' && timing) {
      done = true; timing = false; const t = Math.round((tRun + hints * 5) * 10) / 10;
      me.emote('cheer'); fans.forEach(f => f.emote('cheer')); coach && coach.say('Tuyệt vời!');
      setTimeout(() => api.end({ score: t, lowerBetter: true, title: '🧊 Giải xong khối Rubik!', text: `${moves} nước xoay${hints ? ` · ${hints} gợi ý (+${hints * 5} giây)` : ''}. Mỗi nước xoay là một phép quay 90° quanh trục — khối có hơn 43 tỉ tỉ trạng thái!` }), 1200);
    } else if (mode === 'free' && moves > 0) { hud.msg('🎉 Khối đã hoàn chỉnh!', 2500); me.emote('cheer'); fans.forEach(f => f.emote('cheer')); }
  }
  // ---------- Chế độ ----------
  const panel = document.createElement('div');
  panel.style.cssText = 'position:absolute;right:max(8px,env(safe-area-inset-right));top:calc(max(8px,env(safe-area-inset-top)) + 55px);width:min(42vw,233px);max-height:55vh;overflow:auto;padding:8px;border-radius:13px;background:#1b1626d8;color:#fff;font:600 13px/1.4 system-ui;pointer-events:auto';
  panel.hidden = true; hud.bar.parentElement.appendChild(panel);
  // bảng công thức (bên phải) đang mở → dòng hướng dẫn dời sang phần màn hình còn lại, không bị che
  const msgEl = hud.bar.parentElement.querySelector('.mg-msg'), PW = 'min(42vw,233px)';
  const showPanel = v => { panel.hidden = !v; msgEl.style.left = v ? `calc((100vw - ${PW} - 8px) / 2)` : ''; msgEl.style.maxWidth = v ? `calc(100vw - ${PW} - 32px)` : ''; };
  function renderF() {
    if (!F) return;
    panel.innerHTML = `<b style="color:#ffd36e">${F.name}</b><div style="margin:5px 0;opacity:.85">${F.desc}</div><div>${F.expect.map((n, k) => `<span style="display:inline-block;margin:2px;padding:2px 6px;border-radius:8px;background:${k < F.pos ? '#3fae4a' : k === F.pos ? '#f0a23a' : '#ffffff22'};color:${k === F.pos ? '#2a1a0a' : '#fff'};font-weight:800">${n}</span>`).join('')}</div>`
      + '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">' + FORMULAS.map(([t], i) => `<button data-i="${i}" style="flex:1 1 45%;border:0;border-radius:8px;padding:5px;background:${t === F.name ? '#f0a23a' : '#ffffff1f'};color:${t === F.name ? '#2a1a0a' : '#fff'};font:700 11px system-ui">${t}</button>`).join('') + '</div>';
    panel.querySelectorAll('button').forEach(b => b.onclick = () => pickFormula(+b.dataset.i));
  }
  function pickFormula(i) {
    const [name, desc, alg] = FORMULAS[i], ex = parseAlg(alg);
    queue.length = 0; anim = null; reset();
    for (const n of ex.slice().reverse()) { const m = toMove(n); bake({ ...m, q: -m.q }); } draw();   // dựng sẵn tình huống: làm đúng công thức là khối hoàn chỉnh
    F = { name, desc, expect: ex, pos: 0, stars: F ? F.stars : 0, half: false };
    renderF(); showPanel(true);
    hud.msg(`Công thức <b>${name}</b>: ${ex.join(' ')} — bước đầu: <b>${ex[0]}</b> (${explain(ex[0])})`, 0);
    coach && coach.say(i ? 'Làm theo từng bước nhé!' : 'Học ký hiệu trước nha!');
  }
  function scramble() {
    reset(); let last = ''; const faces = 'URFDLB';
    for (let i = 0; i < 21; i++) { let f; do f = faces[(Math.random() * 6) | 0]; while (BASE[f][0] === (BASE[last] || [])[0]); last = f; const m = toMove(f + (Math.random() < 0.5 ? "'" : '')); doMove(m, { dur: 0.07 }); }
  }
  function setMode(md) {
    mode = md; done = false; timing = false; tRun = 0; hints = 0; setMoves(0); showPanel(false); F = md === 'formula' ? F : null;
    modeBtns.forEach(b => b.classList.toggle('on', b.dataset.m === md));
    hud.time(md === 'race' ? 0 : null);
    if (md === 'race') { scramble(); hud.msg('Đang xáo khối… Đồng hồ chạy khi bạn xoay lớp đầu tiên. Vuốt trên khối để xoay lớp, vuốt ra ngoài để xoay camera.', 5000); coach && coach.say('Cố lên nhé!'); api.showBest(true); }
    else if (md === 'formula') { pickFormula(F ? FORMULAS.findIndex(f => f[0] === F.name) : 0); }
    else { queue.length = 0; anim = null; reset(); hud.msg('Tự do xoay! Bấm 💡 để xem nước tiếp theo đưa khối về hoàn chỉnh.', 3500); }
  }
  // ---------- HUD: chế độ + nút xoay ----------
  const modeBtns = [['race', '⏱ Đua giờ'], ['formula', '📘 Công thức'], ['free', '🧩 Tự do']].map(([m, t]) => { const b = hud.button(t, () => setMode(m)); b.dataset.m = m; return b; });
  let prime = false; const faceBtns = [];
  for (const f of 'URFLDB') faceBtns.push(hud.button(f, () => { if (queue.length < 3) doMove(toMove(f + (prime ? "'" : '')), { user: true }); }, 'sm'));
  const pb = hud.button("′", b => { prime = !prime; b.classList.toggle('on', prime); faceBtns.forEach((x, i) => x.textContent = 'URFLDB'[i] + (prime ? "'" : '')); }, 'sm');
  pb.title = 'Ngược chiều kim đồng hồ';
  hud.button('💡', () => {
    if (mode === 'formula' && F) { if (F.pos < F.expect.length) hud.msg(`Nước tiếp theo: <b>${F.expect[F.pos]}</b> — ${explain(F.expect[F.pos])}`, 3000); return; }
    const t = hist[hist.length - 1]; if (!t) { hud.msg('Khối đang hoàn chỉnh rồi!', 2000); return; }
    const n = toNote({ ...t, q: t.q === 2 ? 2 : -t.q }); if (mode === 'race' && timing) hints++;
    hud.msg(`💡 Gợi ý: <b>${n}</b> — ${explain(n)}${mode === 'race' ? ' (+5 giây)' : ''}`, 3000);
  }, 'sm');
  // ---------- Vuốt trên khối ----------
  let drag = null;
  const tmpV = new THREE.Vector3(), tmpW = new THREE.Vector3();
  const screenOf = v => { tmpW.copy(v).applyMatrix4(cube.matrixWorld).project(ctx.camera); return new THREE.Vector2(tmpW.x, -tmpW.y); };
  const game = {
    down(e) {
      const h = api.pick(e, [body]); if (!h || h.instanceId == null) return false;
      const c = cubies[h.instanceId], n = h.face.normal.clone().applyQuaternion(c.q), a = ['x', 'y', 'z'].reduce((b, k) => Math.abs(n[k]) > Math.abs(n[b]) ? k : b, 'x');
      const nn = new THREE.Vector3(); nn[a] = Math.sign(n[a]); drag = { c, n: nn, x: e.clientX, y: e.clientY, used: false }; return true;
    },
    move(e) {
      if (!drag || drag.used) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) < 12) return;
      drag.used = true; let best = null, bd = 0;
      for (const k of ['x', 'y', 'z']) {
        if (drag.n[k]) continue; const t = new THREE.Vector3(); t[k] = 1;
        const p0 = screenOf(drag.c.pos), p1 = screenOf(tmpV.copy(drag.c.pos).add(t)), sd = p1.sub(p0); sd.x *= innerWidth; sd.y *= innerHeight; const d = (dx * sd.x + dy * sd.y) / (sd.length() || 1);
        if (Math.abs(d) > Math.abs(bd)) { bd = d; best = t; }
      }
      if (!best) return;
      const axis = new THREE.Vector3().crossVectors(drag.n, best.multiplyScalar(Math.sign(bd))), ax = ['x', 'y', 'z'].find(k => Math.abs(axis[k]) > 0.5), sg = Math.sign(axis[ax]);
      if (queue.length < 3) doMove({ ax, layer: Math.round(drag.c.pos[ax]), q: sg }, { user: true });
    },
    up() { drag = null; },
    key(e) { const f = e.key.toUpperCase(); if ('URFLDBMES'.includes(f) && f.length === 1 && !e.ctrlKey && !e.metaKey && queue.length < 3) doMove(toMove(f + (e.shiftKey ? "'" : '')), { user: true }); },
    update(dt) {
      emoteT -= dt;
      if (timing) { tRun += dt; hud.time(tRun); }
      if (!anim && queue.length) { const j = queue.shift(); anim = { m: j.m, t: 0, dur: j.dur, list: inLayer(j.m), user: j.user, silent: j.silent }; if (j.dur > 0.1) api.sfx('ui'); }
      if (anim) {
        anim.t += dt; if (anim.t >= anim.dur) { const a = anim; anim = null; bake(a.m); push(a.m); draw(); if (a.user) onUserMove(a.m); if (!a.silent) finishCheck(); }
        else draw();
      }
      cube.rotation.y = Math.sin(performance.now() / 4000) * 0.04;   // khẽ lắc lư cho sống động
    },
    dispose() { panel.remove(); showPanel(false); },
  };
  // ---------- Người chơi & bạn bè ----------
  me.place(0, 3.4, Math.PI); me.face(0, 0);
  let coach = null; const fans = [];
  api.actor('student-male-e', { name: 'Bạn Minh' }).then(a => { if (!a) return; coach = a; a.place(-3.6, 1.6, 0); a.face(0, 0); a.say('Chào bạn! Thử giải khối nào!', 3000); });
  api.actor('student-female-a', { name: 'Cô Lan', look: { role: 'teacher', aodai: true, shirt: '#e88aa8' }, height: 1.62 }).then(a => { if (!a) return; fans.push(a); a.place(3.8, 1.2, 0); a.face(0, 0); });
  api.actor('student-female-c', {}).then(a => { if (!a) return; fans.push(a); a.place(2.6, -3.4, 0); a.face(0, 0); });
  api.cam.x = 0; api.cam.y = CUBE_Y - 0.4; api.cam.z = 0; api.cam.yaw = 0.42; api.cam.pitch = 0.5; api.cam.dist = innerHeight < 500 ? 10 : 8; api.orbit = true;   // màn ngang thấp: lùi camera để khối không bị thanh nút che
  reset();
  setMode(/Công thức|Cô Lan/.test(door && door.d ? door.d.n : '') ? 'formula' : 'race');
  return game;
}
