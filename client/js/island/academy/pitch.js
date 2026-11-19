// academy/pitch.js — SÂN BAY CHỔI trên hồ phía đông lâu đài + môn thể thao nguyên bản "SĂN CẦU VÀNG" + chế độ luyện bay vòng.
// Luật (nguyên bản, dễ cho học sinh): 2 đội theo Nhà Tứ Linh, mỗi đội 4 người: 2 Tiền Đạo · 1 Giữ Vòng · 1 Thợ Săn Vàng.
//   🏐 Bóng Pha Lê ném qua 3 vòng gôn cuối sân đối phương: vòng thấp 2 điểm, vòng giữa (cao nhất) 3 điểm.
//   ✨ Cầu Vàng có cánh thức dậy sau 34 s, bay né rất nhanh, thỉnh thoảng mỏi cánh chậm lại — ai chạm được: đội đó THẮNG VÁN + 13 điểm.
//   ⏱ Trận 3 hoặc 5 phút; giữa hiệp có 1 câu hỏi nhanh: đúng → chổi tăng tốc 21 s. Hết giờ chưa ai bắt Cầu Vàng: đội nhiều điểm thắng.
//   Thắng/hoà/thua đều cộng điểm Nhà (ctx.houses.addPoints). Có server (ctx.net): nhiều người cùng trận (người vào trước làm chủ trận).
// Kích thước theo Fibonacci: sân 110 × 42 m (55 / 21 ≈ φ²) · vòng gôn r 2,6 m, cao 21 / 34 / 21 m · 3 tháp khán đài cao 21 m.
// Khung cắm (index.js): create(ctx, magic, { toWorld, toLocal, L, Y }) → { build(), unbuild(), update(dt, t) }.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV } from '../sample/palette.js';
import { HOUSES, HOUSE } from './houses-data.js';
import { loadHero, STUDENTS } from '../characters.js';
import { makeBroomMesh, makeCape, holdPose } from '../brooms.js';
import { CFG } from '../config.js';

export const PITCH = { u: -34, v: 172, hl: 55, hw: 21, hoopR: 2.6, hoopX: [-8, 0, 8], hoopY: [21, 34, 21], pts: [2, 3, 2], top: 89 };
const W = CFG.island.waterLevel, R_PICK = 2.6, SPD = 13, PHI = 1.618;
const RINGS = 13, RING_R = 3.4;

export function create(ctx, magic, { toWorld }) {
  const { scene, player: pl } = ctx;
  const [OX, OZ] = toWorld(PITCH.u, PITCH.v);            // gốc sân (thế giới): x = ngang sân, z = dọc sân
  const L2W = (x, y, z, out = new THREE.Vector3()) => out.set(OX + x, y, OZ + z);
  const inPitch = (x, z, m = 13) => ((x - OX) / (PITCH.hw + m)) ** 2 + ((z - OZ) / (PITCH.hl + m)) ** 2 < 1;
  const hoopPos = (end, i) => L2W(PITCH.hoopX[i], W + PITCH.hoopY[i], end * PITCH.hl);   // end = +1 (nam) / −1 (bắc)
  let G = null, board = null, boardC = null;

  // ---------- sân (greybox gộp: 1 mesh tô màu đỉnh + 1 mesh phát sáng) ----------
  function build() {
    const b = new Batch(), gl = new Batch(), stone = '#8d8496', wood = '#6e4a30';
    for (const end of [-1, 1]) PITCH.hoopX.forEach((x, i) => {
      const y = W + PITCH.hoopY[i], z = end * PITCH.hl;
      b.cyl(x, -3.5, z, 0.42, y - PITCH.hoopR + 3.5, stone, 8, 0.3);                      // cột đá từ đáy hồ
      b.add(new THREE.TorusGeometry(PITCH.hoopR, 0.24, 6, 21), '#d4a24a', x, y, z);          // vòng gôn vàng φ
      gl.add(new THREE.TorusGeometry(PITCH.hoopR - 0.3, 0.06, 4, 21), end < 0 ? '#9fe6ff' : '#ffb8e0', x, y, z);
    });
    for (const z of [-34, 0, 34]) {                                                          // 3 tháp khán đài phía đông (bờ hồ)
      const x = PITCH.hw + 13;
      b.cyl(x, -3.5, z, 2.6, 24.5, stone, 8, 2.1); b.cyl(x, 21, z, 4.2, 0.6, wood, 8);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; b.cyl(x + Math.cos(a) * 3.9, 21.6, z + Math.sin(a) * 3.9, 0.08, 1.1, wood, 4); }
      b.cone(x, 25.5, z, 4.6, 6.8, '#4f3a6e', 8);
      HOUSES.forEach((h, k) => { const a = k * Math.PI / 2 + Math.PI / 4; b.add(new THREE.BoxGeometry(1.3, 3.4, 0.08), h.col, x + Math.cos(a) * 2.7, 18.5, z + Math.sin(a) * 2.7, -a + Math.PI / 2); });
    }
    for (let k = 0; k < 34; k++) {                                                           // phao đèn viền sân
      const a = k / 34 * Math.PI * 2, x = Math.sin(a) * (PITCH.hw + 3), z = Math.cos(a) * (PITCH.hl + 8);
      b.cyl(x, W - 0.4, z, 0.4, 0.7, '#3a3344', 6); gl.box(x - 0.2, x + 0.2, W + 0.3, W + 0.75, z - 0.2, z + 0.2, '#ffe3a0');
    }
    G = new THREE.Group(); G.name = 'academy-pitch'; G.position.set(OX, 0, OZ);
    const m1 = new THREE.Mesh(b.build(), matV()); m1.castShadow = m1.receiveShadow = true;
    const m2 = new THREE.Mesh(gl.build(), new THREE.MeshBasicMaterial({ vertexColors: true }));
    boardC = document.createElement('canvas'); boardC.width = 512; boardC.height = 128;
    board = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(boardC), depthWrite: false })); board.scale.set(21, 5.25, 1); board.position.set(0, W + 55, 0);
    G.add(m1, m2, board); for (const m of G.children) { m.updateMatrix(); m.matrixAutoUpdate = false; }
    scene.add(G); drawBoard();
  }
  function unbuild() { if (!G) return; if (M) endMatch(true); if (R) endRings(true); scene.remove(G); G.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); } }); G = null; }
  function drawBoard() {
    if (!boardC) return; const k = boardC.getContext('2d'); k.clearRect(0, 0, 512, 128);
    k.fillStyle = 'rgba(20,16,34,.86)'; k.beginPath(); k.roundRect(4, 4, 504, 120, 26); k.fill(); k.textAlign = 'center'; k.textBaseline = 'middle';
    if (M) { const [a, b] = M.teams; k.font = 'bold 30px system-ui'; k.fillStyle = a.h.col2; k.fillText(`${a.h.icon} ${a.score}`, 128, 64); k.fillStyle = b.h.col2; k.fillText(`${b.score} ${b.h.icon}`, 384, 64); k.fillStyle = '#ffe3a0'; k.font = 'bold 26px system-ui'; k.fillText(clock(M.left), 256, 64); }
    else { k.font = 'bold 34px system-ui'; k.fillStyle = '#ffe3a0'; k.fillText('🧹 Sân Bay Chổi · Săn Cầu Vàng', 256, 64, 480); }
    board.material.map.needsUpdate = true;
  }
  const clock = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

  // ---------- HUD ----------
  const css = document.createElement('style');
  css.textContent = `#skHud{position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:27;background:#1b1626dd;color:#fff;border-radius:21px;padding:6px 13px;font:600 14px system-ui;text-align:center;min-width:233px;max-width:92vw;box-shadow:0 3px 13px #0006}
@media (max-width:600px){#skHud{top:calc(max(10px,env(safe-area-inset-top)) + 172px);min-width:0;width:max-content;font-size:13px}}
#skHud .sc{display:flex;gap:13px;justify-content:center;align-items:center;font-size:21px}#skHud .t{color:#ffe3a0;font-size:17px}#skHud small{display:block;opacity:.85;font-weight:500;margin-top:2px}
#skHud button{margin-top:5px;border:0;border-radius:13px;padding:4px 10px;background:#ffffff26;color:#fff;font:600 13px system-ui}
#skMenu{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;background:#1b1626f2;color:#fff;border-radius:21px;padding:16px 18px;width:min(377px,92vw);font:15px/1.45 system-ui;box-shadow:0 8px 34px #000a}
#skMenu h3{margin:0 0 6px;font-size:19px;color:#ffe3a0}#skMenu .row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}#skMenu button{flex:1 1 30%;border:2px solid #fff3;border-radius:13px;padding:8px 6px;background:#ffffff14;color:#fff;font:600 14px system-ui;cursor:pointer}
#skMenu button.on{border-color:#ffe3a0;background:#ffe3a033}#skMenu .go{background:#3d8f4a;border-color:#3d8f4a;flex-basis:100%;font-size:16px}#skMenu small{opacity:.8}`;
  document.head.appendChild(css);
  let hud = null;
  const hudShow = html => { if (!hud) { hud = document.createElement('div'); hud.id = 'skHud'; document.body.appendChild(hud); hud.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); if (b.dataset.k === 'quit') { M ? endMatch(false, true) : R && endRings(true); } }); } hud.innerHTML = html; };
  const hudHide = () => { if (hud) { hud.remove(); hud = null; } };

  // ---------- menu chọn chế độ ----------
  let menu = null; const pick = { role: 'att', min: 3 };
  function openMenu() {
    if (menu || M || R) return;
    menu = document.createElement('div'); menu.id = 'skMenu';
    const my = HOUSE[myHouse()] || null;
    const draw = () => { menu.innerHTML = `<h3>🏆 Săn Cầu Vàng</h3><small>Ném 🏐 <b>Bóng Pha Lê</b> qua vòng gôn đối phương (vòng thấp 2 điểm, vòng giữa 3 điểm). Ai chạm được ✨ <b>Cầu Vàng</b> có cánh: đội đó <b>thắng ván</b>! ${my ? `Em thi đấu cho <b>${my.icon} ${my.name}</b>.` : 'Em chưa có nhà — hãy dự Lễ chọn nhà ở Đại sảnh để cộng điểm nhà!'}</small>
      <div class="row">${[['att', '🏐 Tiền Đạo'], ['keep', '🛡️ Giữ Vòng'], ['hunt', '✨ Thợ Săn Vàng']].map(([k, n]) => `<button data-r="${k}" class="${pick.role === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="row">${[3, 5].map(n => `<button data-m="${n}" class="${pick.min === n ? 'on' : ''}">⏱ ${n} phút</button>`).join('')}</div>
      <div class="row"><button class="go" data-go>🧹 Vào trận!</button><button data-ring>🎯 Luyện bay vòng</button><button data-x>Đóng</button></div>`; };
    draw(); document.body.appendChild(menu); pl.frozen = true;
    menu.onclick = e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.r) { pick.role = b.dataset.r; draw(); } else if (b.dataset.m) { pick.min = +b.dataset.m; draw(); }
      else { closeMenu(); if (b.dataset.go !== undefined) startMatch(pick.role, pick.min * 60); else if (b.dataset.ring !== undefined) startRings(); } };
  }
  const closeMenu = () => { if (menu) { menu.remove(); menu = null; pl.frozen = false; } };
  const myHouse = () => (ctx.houses && ctx.houses.houseId && ctx.houses.houseId()) || null;

  // lên chổi thi đấu (tốc độ đều nhau cho công bằng)
  let saved = null;
  function onBroom() {
    const V = ctx.vehicles; if (V.riding !== 'broom') { if (V.current) V.dismount(); if (V.current) return null; const v = ctx.brooms.make('broom'); v.temp = true; v.group.position.copy(pl.pos); V.register(v); V.mount(v); }
    const v = V.current; if (!v || v.type !== 'broom') return null; saved = { v, speed: v.mode.speed, boost: v.mode.boost }; v.mode.speed = SPD; v.mode.boost = PHI; return v;
  }
  const offBroom = () => { if (saved) { saved.v.mode.speed = saved.speed; saved.v.mode.boost = saved.boost; saved = null; } };

  // ---------- người chơi trong trận (NPC / người thật) ----------
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  async function makeNPC(team, role, i) {
    const h = team.h, g = new THREE.Group(), broom = makeBroomMesh('broom'); g.add(broom);
    const kind = STUDENTS[(i * 5 + HOUSES.indexOf(h)) % STUDENTS.length];
    const r = { team, role, g, pos: g.position, vel: new THREE.Vector3(), rot: 0, npc: true, cd: 0, name: ['Minh', 'Lan', 'Huy', 'Mai', 'Tuấn', 'Ngọc', 'Khoa', 'Vy'][i % 8] };
    const hero = await loadHero(kind, 1.5, { shirt: h.col, pants: '#2a2633' });
    if (hero) {
      hero.model.position.set(0, 0.87, 0.02); g.add(hero.model); hero.anim.play('drive', 0); hero.anim.update(0.6);
      g.updateMatrixWorld(true); holdPose(hero.model, g); r.hero = hero;
      const chest = hero.model.getObjectByName('chest'), head = hero.model.getObjectByName('head'), c = makeCape(h.col, 0.4, 0.66);
      g.updateMatrixWorld(true); const hp = head ? g.worldToLocal(head.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(0, 2, 0);
      c.position.set(0, hp.y - 0.1, hp.z - 0.16); g.add(c); g.updateMatrixWorld(true); if (chest) chest.attach(c); r.cape = c;
    }
    scene.add(g); return r;
  }
  const spot = (r, out) => {   // vị trí xuất phát / đứng chờ theo vai
    const e = r.team.end; const k = r.team.list.indexOf(r);
    if (r.role === 'keep') return L2W(0, W + 26, e * (PITCH.hl - 6), out);
    if (r.role === 'hunt') return L2W(e * 8, W + 47, e * 21, out);
    return L2W(k % 2 ? 9 : -9, W + 26, e * 21, out);
  };

  // ---------- TRẬN ĐẤU ----------
  let M = null;
  const ballMesh = () => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshToonMaterial({ color: '#bff2ff', emissive: '#4fb8e8', emissiveIntensity: 0.55 })); m.castShadow = true; return m; };
  function goldMesh() {
    const g = new THREE.Group(), gold = new THREE.MeshToonMaterial({ color: '#ffd23f', emissive: '#c88a10', emissiveIntensity: 0.6 });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), gold));
    const wing = new THREE.PlaneGeometry(0.62, 0.26).translate(0.33, 0, 0), wm = new THREE.MeshBasicMaterial({ color: '#fff8e0', side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const wl = new THREE.Mesh(wing, wm), wr = new THREE.Mesh(wing, wm); wr.rotation.y = Math.PI; g.add(wl, wr); g.userData.w = [wl, wr];
    return g;
  }
  const SLOTS = ['att', 'att', 'keep', 'hunt'];   // chỉ số người i = đội·4 + vị trí
  async function startMatch(role, secs) {
    if (M) return;
    if (!G) return ctx.toast('🧹 Lại gần Sân Bay Chổi (hồ phía đông lâu đài) để thi đấu nhé!', 3000);
    if (!onBroom()) return;
    M = { loading: true, riders: [] }; ctx.mgActive = true; hudShow('⏳ Các bạn đang lên chổi…');
    const room = await net.join(); if (!M) return;
    let cfg = room.cfg, myIdx;
    if (cfg) myIdx = cfg.who.indexOf(net.id);
    else {
      const hid = myHouse() || 'long', rivals = HOUSES.filter(h => h.id !== hid), rh = rivals[Math.floor(Math.random() * rivals.length)];
      myIdx = SLOTS.indexOf(role); cfg = { h: [hid, rh.id], dur: secs, who: [0, 0, 0, 0, 0, 0, 0, 0] }; cfg.who[myIdx] = net.id || 'me';
    }
    const teams = cfg.h.map((id, k) => ({ h: HOUSE[id], end: k ? 1 : -1, score: 0, list: [] }));   // đội 0 giữ vòng phía bắc, tấn công phía nam
    Object.assign(M, { cfg, teams, left: cfg.dur, dur: cfg.dur, t: 0, half: false, boostT: 0, gold: null, goldOn: false, ball: { mesh: ballMesh(), owner: null, vel: new THREE.Vector3(), free: true, from: null, cd: 0 }, riders: [], me: null, paused: false, stats: { goals: 0, catch: false }, kick: 0 });
    for (let i = 0; i < 8; i++) {
      const T = teams[i >> 2], s = SLOTS[i & 3], w = cfg.who[i]; let r;
      if (i === myIdx) { r = { team: T, role: s, pos: pl.pos, vel: pl.vel, me: true, cd: 0, name: 'Em' }; M.me = r; }
      else if (w) r = { team: T, role: s, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: 0, remote: w, cd: 0, name: remoteName(w) };
      else { r = await makeNPC(T, s, i); if (!M) { scene.remove(r.g); return; } }
      r.i = i; T.list.push(r); M.riders.push(r);
    }
    scene.add(M.ball.mesh); M.gold = goldMesh(); M.gold.visible = false; scene.add(M.gold); M.goldPos = M.gold.position; M.goldVel = new THREE.Vector3(); M.goldTgt = new THREE.Vector3(); M.goldTire = 8;
    if (!net.client) kickoff(); M.loading = false; drawBoard(); net.sync();
    const mt = M.me.team, op = teams[mt === teams[0] ? 1 : 0];
    ctx.toast(`🏆 <b>Săn Cầu Vàng</b>: ${mt.h.icon} ${mt.h.name} gặp ${op.h.icon} ${op.h.name}${net.client ? ' (cùng các bạn trên mạng)' : ''}! Bay tới 🏐 để bắt bóng, bấm <b>E / 🏐 Ném</b> để ném qua vòng gôn ${goalDir(mt)}.`, 7000);
  }
  const goalDir = T => T.end < 0 ? 'phía nam (viền hồng)' : 'phía bắc (viền xanh)';
  const remoteName = id => { const o = ctx.net && ctx.net.others.get(id); return o ? o.name : 'Bạn'; };
  function kickoff() {
    M.kick++;
    for (const r of M.riders) { if (r.remote) continue; if (r.me) { spot(r, tmp); pl.teleport(tmp.x, tmp.z, tmp.y); pl.setRot(r.team.end < 0 ? 0 : Math.PI); pl.vel.set(0, 0, 0); pl.cam.yaw = r.team.end < 0 ? Math.PI : 0; } else { spot(r, r.pos); r.vel.set(0, 0, 0); } }
    const B = M.ball; B.owner = null; B.free = true; B.from = null; L2W(0, W + 30, 0, B.mesh.position); B.vel.set((Math.random() - 0.5) * 2, 6, (Math.random() - 0.5) * 2); B.cd = 0.8;
  }
  function endMatch(silent, quit) {
    if (!M) return; const m = M; M = null; ctx.mgActive = false; offBroom(); net.leave(); if (!m.teams) { hudHide(); return; }
    for (const r of m.riders) if (r.rb) r.rb.removeFromParent();
    for (const r of m.riders) if (!r.me && r.g) { scene.remove(r.g); r.g.traverse(o => { if (o.isMesh && o.geometry && o.userData.U) { o.geometry.dispose(); o.material.dispose(); } }); }
    scene.remove(m.ball.mesh); m.ball.mesh.geometry.dispose(); scene.remove(m.gold); hudHide(); drawBoard();
    if (silent) return;
    const mi = m.teams.indexOf(m.me.team), a = m.teams[mi], b = m.teams[1 - mi], win = m.winner === mi || (m.winner == null && a.score > b.score), draw = m.winner == null && a.score === b.score;
    if (quit) return ctx.toast('🏳️ Em đã rời trận. Lần sau quay lại nhé!', 2600);
    const pts = (win ? 34 : draw ? 13 : 8) + m.stats.goals * 3 + (m.stats.catch ? 21 : 0);
    ctx.houses && myHouse() && ctx.houses.addPoints(pts, 'Săn Cầu Vàng');
    ctx.account && ctx.account.addCoins && ctx.account.addCoins(win ? 8 : 3);
    ctx.sfx && ctx.sfx(win ? 'win' : 'ok');
    ctx.toast(`${win ? '🏆 THẮNG!' : draw ? '🤝 Hoà!' : '💪 Thua sát nút!'} ${a.h.icon} <b>${a.score}</b> – <b>${b.score}</b> ${b.h.icon}${m.goldBy != null ? `<br>✨ Cầu Vàng bị ${m.goldBy === mi ? 'đội em' : 'đội bạn'} bắt!` : ''}<br>${myHouse() ? `+${pts} điểm nhà` : 'Dự Lễ chọn nhà để cộng điểm nhà'} · +${win ? 8 : 3} 🪙 · em ghi ${m.stats.goals} bàn`, 8000);
  }

  // điều khiển rider NPC: bay về điểm đích, giới hạn tốc độ, quay mặt theo hướng bay
  function steer(r, target, spd, dt) {
    tmp2.copy(target).sub(r.pos); const d = tmp2.length();
    if (d > 0.01) tmp2.multiplyScalar(Math.min(spd, d * 2) / d); r.vel.lerp(tmp2, Math.min(1, dt * 2.2));
    r.pos.addScaledVector(r.vel, dt); r.pos.y = Math.max(W + 3, Math.min(W + PITCH.top - 13, r.pos.y));
    const hs = Math.hypot(r.vel.x, r.vel.z); if (hs > 0.5) { const want = Math.atan2(r.vel.x, r.vel.z); r.rot += (((want - r.rot + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 4); }
    r.g.rotation.set(THREE.MathUtils.clamp(-r.vel.y * 0.04, -0.3, 0.3), r.rot, 0);
  }
  const posOf = r => r.me ? pl.pos : r.remote ? r.pos : r.pos;
  function throwBall(r, dir, sp = 28) {
    const B = M.ball; B.owner = null; B.free = true; B.from = r; B.cd = 0.5; B.vel.copy(dir).normalize().multiplyScalar(sp); ctx.sfx && r.me && ctx.sfx('swoosh');
  }
  function aimFor(r) {   // hướng ném: vòng gôn đối phương gần hướng nhìn nhất (hỗ trợ ngắm cho học sinh) → đồng đội phía trước → thẳng trước mặt
    const p = posOf(r), fx = r.me ? Math.sin(pl.rot) : Math.sin(r.rot), fz = r.me ? Math.cos(pl.rot) : Math.cos(r.rot), end = -r.team.end;
    let best = null, bs = 0.5;
    for (let i = 0; i < 3; i++) { const h = hoopPos(end, i), dx = h.x - p.x, dz = h.z - p.z, d = Math.hypot(dx, dz), s = (dx * fx + dz * fz) / (d || 1); if (d < 40 && s > bs) { bs = s; best = h; } }
    if (best) return best.sub(p);
    for (const o of r.team.list) if (o !== r) { const q = posOf(o), dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz), s = (dx * fx + dz * fz) / (d || 1); if (d < 34 && s > 0.85) return tmp.copy(q).sub(p).add(new THREE.Vector3(0, 0.4, 0)).clone(); }
    return new THREE.Vector3(fx, 0.12, fz);
  }
  function score(T, i, by) {
    T.score += PITCH.pts[i]; ctx.sfx && ctx.sfx('coin');
    if (by) by.goals = (by.goals | 0) + 1; if (by && by.me) M.stats.goals++;
    const txt = `🏐 VÀO! ${T.h.icon} <b>${T.h.name}</b> +${PITCH.pts[i]} (${by ? by.name : ''}${i === 1 ? ' · vòng giữa!' : ''})`; ctx.toast(txt, 2600); net.ev(txt.replace('(Em', '(' + (ctx.playerName || 'Bạn')), by ? by.i : -1);
    drawBoard(); kickoff();
  }
  function caughtGold(r) {
    M.winner = M.teams.indexOf(r.team); M.goldBy = M.winner; M.goldRider = r.i; r.team.score += 13; if (r.me) M.stats.catch = true;
    const txt = `✨ ${r.name} đã chạm được <b>Cầu Vàng</b>! ${r.team.h.icon} ${r.team.h.name} thắng ván!`; ctx.toast(txt, 3500); net.ev(txt.replace('Em đã', (ctx.playerName || 'Bạn') + ' đã'), r.i, true); drawBoard(); M.ending = 2.6; net.send(1);
  }

  function stepMatch(dt, t) {
    const m = M; if (!m || m.loading) return;
    if (m.ending !== undefined) { if ((m.ending -= dt) <= 0) endMatch(); return; }
    if (m.paused) { if (!document.getElementById('mgCard')) m.paused = false; else return; }
    for (const r of m.riders) if (r.remote) { const o = ctx.net && ctx.net.others.get(r.remote); if (o) { r.pos.copy(o.h.root.position); if (!r.rb || r.rb.parent !== o.h.root) { r.rb = makeBroomMesh('broom'); r.rb.position.y = -0.85; o.h.root.add(r.rb); } } }   // bạn trên mạng: thêm chổi dưới chân
    if (net.client) { net.follow(dt, t); if (M) hudTick(dt, t); return; }   // khách: hiển thị theo chủ trận
    m.t += dt; m.left -= dt;
    // giữa hiệp: câu hỏi nhanh → tăng tốc
    if (!m.half && m.left <= m.dur / 2) { m.half = true; m.paused = !net.on; ctx.toast('⏸️ <b>Giữa hiệp!</b> Trả lời nhanh để chổi được tăng tốc ⚡', 3000);
      magic.ask([['toan', 'khoahoc', 'bien'][Math.floor(Math.random() * 3)]], () => { m.boostT = 21; ctx.toast('⚡ Chổi tăng tốc 21 giây!', 2200); }, '⚡ Câu hỏi giữa hiệp — đúng thì chổi tăng tốc'); }
    if (m.left <= 0) { M.winner = null; net.send(1, true); return endMatch(); }
    if (saved) { m.boostT -= dt; saved.v.mode.speed = SPD * (m.boostT > 0 ? PHI : 1); }
    // giữ người chơi trong sân (đẩy nhẹ về)
    const p = pl.pos; if (!inPitch(p.x, p.z, 21)) { pl.vel.x += (OX - p.x) * dt * 0.8; pl.vel.z += (OZ - p.z) * dt * 0.8; if (!m.warn || t > m.warn) { m.warn = t + 4; ctx.toast('↩️ Ra ngoài sân rồi — bay vào lại nhé!', 1800); } }
    const B = m.ball, bp = B.mesh.position;
    // ---------- Cầu Vàng ----------
    if (!m.goldOn && m.t > 34) { m.goldOn = true; m.gold.visible = true; L2W(0, W + 40, 0, m.goldPos); ctx.toast('✨ <b>Cầu Vàng</b> đã thức dậy! Thợ Săn Vàng ơi, đuổi theo đốm vàng có cánh!', 3500); ctx.sfx && ctx.sfx('magic'); }
    if (m.goldOn) {
      let near = null, nd = 1e9; for (const r of m.riders) if (r.role === 'hunt' || r.me) { const d = posOf(r).distanceTo(m.goldPos); if (d < nd) { nd = d; near = r; } }
      m.goldTire -= dt; const tired = m.goldTire < 0; if (m.goldTire < -2.6) m.goldTire = 5 + Math.random() * 8;
      if (m.goldPos.distanceTo(m.goldTgt) < 3 || Math.random() < dt * 0.4) L2W((Math.random() - 0.5) * PITCH.hw * 1.8, W + 8 + Math.random() * 55, (Math.random() - 0.5) * PITCH.hl * 1.8, m.goldTgt);
      tmp.copy(m.goldTgt).sub(m.goldPos).normalize();
      if (near && nd < 13 && !tired) { tmp2.copy(m.goldPos).sub(posOf(near)).normalize(); tmp.addScaledVector(tmp2, 1.6).add(tmp2.set(Math.sin(t * 7), Math.cos(t * 5) * 0.5, Math.cos(t * 7)).multiplyScalar(0.8)).normalize(); }
      const gs = tired ? 5 : near && nd < 13 ? 16 : 9; m.goldVel.lerp(tmp.multiplyScalar(gs), Math.min(1, dt * 3)); m.goldPos.addScaledVector(m.goldVel, dt);
      m.goldPos.y = Math.max(W + 5, Math.min(W + 70, m.goldPos.y)); if (!inPitch(m.goldPos.x, m.goldPos.z, 5)) m.goldVel.multiplyScalar(-1);
      const [wl, wr] = m.gold.userData.w, f = Math.sin(t * (tired ? 13 : 34)) * 0.9; wl.rotation.z = f; wr.rotation.z = -f; m.gold.rotation.y = Math.atan2(m.goldVel.x, m.goldVel.z);
      for (const r of m.riders) { const d = posOf(r).distanceTo(m.goldPos); if (r.me && d < R_PICK + 0.4) return caughtGold(r); if (r.npc && r.role === 'hunt' && d < 1.6 && tired && Math.random() < dt * 0.9) return caughtGold(r); }
    }
    // ---------- bóng ----------
    B.cd -= dt;
    if (B.owner) { const o = posOf(B.owner), ro = B.owner.me ? pl.rot : B.owner.rot; bp.set(o.x + Math.sin(ro) * 0.9, o.y + 1.1, o.z + Math.cos(ro) * 0.9); }
    else {
      const y0 = bp.y, z0 = bp.z; B.vel.y -= 3.4 * dt; B.vel.multiplyScalar(Math.exp(-dt * 0.35)); bp.addScaledVector(B.vel, dt);
      for (const end of [-1, 1]) { const zp = OZ + end * PITCH.hl; if ((z0 - zp) * (bp.z - zp) < 0) for (let i = 0; i < 3; i++) { const h = hoopPos(end, i); if (Math.hypot(bp.x - h.x, (y0 + bp.y) / 2 - h.y) < PITCH.hoopR) return score(m.teams[end > 0 ? 0 : 1], i, B.from); } }
      if (bp.y < W + 0.6) { bp.y = W + 0.6; B.vel.set(B.vel.x * 0.3, 7, B.vel.z * 0.3); }   // chạm mặt hồ: bóng pha lê nảy lên (phép nổi)
      if (!inPitch(bp.x, bp.z, 8)) { B.vel.x += (OX - bp.x) * dt; B.vel.z += (OZ - bp.z) * dt; }
      if (B.cd <= 0) for (const r of m.riders) { if (r === B.from && B.cd > -0.4) continue; const d = posOf(r).distanceTo(bp); if (d < (r.me ? R_PICK : 2.1) && (r.me || r.role !== 'hunt')) { if (r.npc && r.role === 'keep' && B.from && Math.random() < 0.45) { B.cd = 0.4; B.vel.multiplyScalar(-0.4); break; } B.owner = r; B.from = null; if (r.me) { ctx.sfx && ctx.sfx('pickup'); ctx.toast('🏐 Em bắt được Bóng Pha Lê! Bay về vòng gôn ' + goalDir(r.team) + ' rồi bấm <b>E / 🏐 Ném</b>', 2600); } break; } }
    }
    B.mesh.rotation.y += dt * 2;
    // cướp bóng: đối thủ áp sát người cầm bóng
    if (B.owner) { const o = B.owner, op = posOf(o); for (const r of m.riders) if (r.npc && r.team !== o.team && r.role !== 'hunt' && posOf(r).distanceTo(op) < 2.2 && Math.random() < dt * (o.me ? 0.42 : 0.9)) { B.owner = r; ctx.sfx && ctx.sfx('no'); if (o.me) ctx.toast(`😮 ${r.name} (${r.team.h.icon}) cướp bóng!`, 1800); else if (o.remote) net.ev(`😮 ${r.name} (${r.team.h.icon}) cướp bóng!`, -1); break; } }
    // ---------- NPC ----------
    for (const r of m.riders) if (r.npc) {
      const T = r.team, opp = m.teams[T === m.teams[0] ? 1 : 0], end = -T.end;
      if (r.role === 'hunt') { if (m.goldOn) steer(r, tmp.copy(m.goldPos).addScaledVector(m.goldVel, 0.4), 12, dt); else steer(r, spot(r, tmp).add(tmp2.set(Math.sin(t * 0.5 + T.end) * 8, Math.sin(t * 0.7) * 4, 0)), 6, dt); continue; }
      if (r.role === 'keep') { const h = L2W(0, W + 26, T.end * (PITCH.hl - 4), tmp); const kx = THREE.MathUtils.clamp(bp.x - OX, -11, 11), ky = THREE.MathUtils.clamp(bp.y, W + 17, W + 37); h.x = OX + kx; h.y = ky; steer(r, h, 11, dt); continue; }
      if (B.owner === r) {   // tiền đạo cầm bóng: bay tới vòng gôn, gần thì ném
        const i = r.aim ?? (r.aim = Math.random() < 0.38 ? 1 : Math.random() < 0.5 ? 0 : 2), h = hoopPos(end, i), d = h.distanceTo(r.pos);
        steer(r, tmp.copy(h).add(tmp2.set(0, 0, -end * 13)), 11, dt);
        if (d < 21 && (r.cd -= dt) < 0) { r.aim = null; const err = tmp2.set((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 6, 0); throwBall(r, h.clone().add(err).sub(r.pos), 26); }
        continue;
      }
      r.cd = 0.6;
      const carrier = B.owner, mineTeam = carrier && carrier.team === T;
      const chaser = T.list.filter(x => x.role === 'att' && x.npc).sort((a, b) => a.pos.distanceTo(bp) - b.pos.distanceTo(bp))[0] === r || !T.list.some(x => x.role === 'att' && x.npc && x !== r);
      if (!carrier || !mineTeam) { if (chaser || carrier) steer(r, carrier ? tmp.copy(posOf(carrier)) : bp, carrier ? 11.5 : 12, dt); else steer(r, L2W((r.pos.x - OX > 0 ? 9 : -9), W + 24, end * 13, tmp), 9, dt); }
      else steer(r, L2W(T.list.indexOf(r) % 2 ? 11 : -11, W + 25, end * (PITCH.hl - 21), tmp), 11, dt);   // đồng đội cầm bóng: chạy chỗ phía trước
    }
    hudTick(dt, t); net.send(dt);
  }
  function hudTick(dt, t) {
    if (!M) return; const m = M, B = m.ball, bp = B.mesh.position, p = pl.pos;
    // ---------- người chơi cầm bóng: nút ném ----------
    if (B.owner && B.owner.me) ctx.offer('🏐 Ném bóng', () => { if (M && M.ball.owner === M.me) { if (net.client) net.act('throw', aimFor(M.me).normalize().toArray()); else throwBall(M.me, aimFor(M.me), 30); } }, 9);
    // HUD
    if ((m.hudT = (m.hudT || 0) - dt) <= 0) { m.hudT = 0.25; const [a, b] = m.teams, gd = m.goldOn ? Math.round(p.distanceTo(m.goldPos)) : null;
      hudShow(`<div class="sc"><span style="color:${a.h.col2}">${a.h.icon} ${a.score}</span><span class="t">⏱ ${clock(m.left)}</span><span style="color:${b.h.col2}">${b.score} ${b.h.icon}</span></div><small>${B.owner && B.owner.me ? `🏐 Em đang cầm bóng → vòng gôn ${goalDir(m.me.team)}` : B.owner ? `🏐 ${B.owner.name} (${B.owner.team.h.icon}) cầm bóng · cách ${Math.round(p.distanceTo(bp))} m` : `🏐 bóng tự do · cách ${Math.round(p.distanceTo(bp))} m`}${gd != null ? ` · ✨ Cầu Vàng ${gd} m` : ' · ✨ Cầu Vàng chưa thức'}${m.boostT > 0 ? ' · ⚡ tăng tốc' : ''}</small><button data-k="quit">🏳️ Rời trận</button>`); }
    if ((m.boardT = (m.boardT || 0) - dt) <= 0) { m.boardT = 1; drawBoard(); }
  }

  // ---------- LUYỆN BAY VÒNG: 13 vòng quanh sân, bay qua theo thứ tự, tính giờ ----------
  let R = null;
  function startRings() {
    if (!G) return; if (!onBroom()) return;
    const pts = []; for (let k = 0; k < RINGS; k++) { const a = k / RINGS * Math.PI * 2, x = Math.sin(a * 2) * (PITCH.hw - 4), z = Math.cos(a) * (PITCH.hl - 8); pts.push(L2W(x, W + 13 + 21 * (0.5 + 0.5 * Math.sin(a * 3)), z)); }
    const geo = new THREE.TorusGeometry(RING_R, 0.2, 5, 21), im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0.55 }), RINGS), o = new THREE.Object3D();
    pts.forEach((q, i) => { const n = pts[(i + 1) % RINGS]; o.position.copy(q); o.lookAt(n); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.frustumCulled = false; scene.add(im);
    const cur = new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.5, 6, 21), new THREE.MeshBasicMaterial({ color: '#3dff8a' })); scene.add(cur);
    R = { pts, im, cur, i: 0, t: 0, best: +(localStorage.getItem('sk.ring.best') || 0) };
    const s = pts[RINGS - 1]; pl.teleport(s.x, s.z, s.y); pl.cam.yaw = Math.PI; ctx.mgActive = true;
    ctx.toast('🎯 <b>Luyện bay vòng</b>: bay qua 13 vòng theo thứ tự (vòng <b style="color:#7dffb0">xanh</b> là vòng tiếp theo). Nhanh nhất có thể!', 5000);
  }
  function endRings(quit) {
    if (!R) return; scene.remove(R.im, R.cur); R.im.geometry.dispose(); R.cur.geometry.dispose(); const r = R; R = null; ctx.mgActive = false; offBroom(); hudHide();
    if (quit) return;
    const tm = r.t.toFixed(1), rec = !r.best || r.t < r.best; if (rec) try { localStorage.setItem('sk.ring.best', r.t.toFixed(2)); } catch (e) {}
    ctx.houses && myHouse() && ctx.houses.addPoints(5, 'Luyện bay vòng'); ctx.sfx && ctx.sfx('win');
    ctx.toast(`🎯 Xong 13 vòng trong <b>${tm} s</b>${rec ? ' — 🏅 kỷ lục mới!' : ` (kỷ lục ${r.best.toFixed(1)} s)`}${myHouse() ? ' · +5 điểm nhà' : ''}`, 6000);
  }
  function stepRings(dt) {
    const r = R; r.t += dt; const q = r.pts[r.i], n = r.pts[(r.i + 1) % RINGS];
    r.cur.position.copy(q); r.cur.lookAt(n); r.cur.scale.setScalar(1 + Math.sin(r.t * 5) * 0.08);   // vòng tiếp theo: xanh, phập phồng
    if (r.hid !== r.i) { r.hid = r.i; const z = new THREE.Matrix4().makeScale(0, 0, 0); r.pts.forEach((q2, k) => { if (k <= r.i) r.im.setMatrixAt(k, z); }); r.im.instanceMatrix.needsUpdate = true; }   // vòng đã qua + vòng hiện tại (vẽ riêng màu xanh) ẩn khỏi lưới vàng
    if (pl.pos.distanceTo(q) < RING_R + 0.6) { ctx.sfx && ctx.sfx('coin'); if (++r.i >= RINGS) return endRings(); }
    if ((r.hudT = (r.hudT || 0) - dt) <= 0) { r.hudT = 0.2; hudShow(`<div class="sc"><span>🎯 ${r.i}/${RINGS}</span><span class="t">⏱ ${r.t.toFixed(1)} s</span></div><small>${r.best ? `Kỷ lục: ${r.best.toFixed(1)} s · ` : ''}vòng tiếp: ${Math.round(pl.pos.distanceTo(q))} m</small><button data-k="quit">✖ Dừng</button>`); }
  }

  // ---------- nhiều người chơi (net.js + server/index.js 'sk*'): người vào trước làm chủ trận ----------
  // gói trạng thái (chủ → khách, 10 lần/s): c cấu hình · s điểm · l giờ · k lượt giao bóng · b bóng [x,y,z,chủ] · g Cầu Vàng · r 8 người [x,y,z,góc] · w kết quả · e sự kiện
  const net = (() => {
    let sock = null, inited = false, room = null, last = null, sendT = 0, seq = 0, evq = null, seen = 0, actT = 0, waitCfg = null;
    const S = () => ctx.net && ctx.net.connected && ctx.net.sock;
    const round = v => Math.round(v * 100) / 100;
    function init() {
      if (inited || !(sock = S())) return; inited = true;
      sock.on('skRoom', d => { room = d; if (!M || M.loading) return; if (d.host === sock.id) { if (N.client) promote(); assign(d.ids); } });
      sock.on('skState', d => { if (waitCfg && d.c && d.c.who.includes(sock.id)) { const f = waitCfg; waitCfg = null; f(d.c); } if (M && N.client) last = d; });
      sock.on('skAct', d => { if (!M || N.client || M.loading) return; const r = M.riders.find(x => x.remote === d.id); if (!r) return; const B = M.ball;
        if (d.a === 'throw' && B.owner === r && d.d) throwBall(r, tmp.fromArray(d.d), 30);
        else if (d.a === 'pick' && !B.owner && B.cd <= 0 && r.pos.distanceTo(B.mesh.position) < R_PICK + 2) { B.owner = r; B.from = null; }
        else if (d.a === 'gold' && M.goldOn && M.ending === undefined && r.pos.distanceTo(M.goldPos) < 6) caughtGold(r); });
    }
    // chủ trận: người mới vào → thay 1 NPC (ưu tiên Tiền Đạo) ở đội ít người thật hơn; người rời → NPC thay lại
    async function assign(ids) {
      const who = M.cfg.who, me = sock.id;
      for (const r of M.riders) if (r.remote && !ids.includes(r.remote)) { who[r.i] = 0; await toNPC(r); }
      for (const id of ids) {
        if (id === me || who.includes(id)) continue;
        const hum = k => M.teams[k].list.filter(r => r.me || r.remote).length, k = hum(0) <= hum(1) ? 0 : 1;
        const r = M.teams[k].list.filter(r => r.npc).sort((a, b) => (a.role === 'att' ? 0 : a.role === 'keep' ? 1 : 2) - (b.role === 'att' ? 0 : b.role === 'keep' ? 1 : 2))[0]; if (!r) continue;
        r.npc = false; r.remote = id; r.name = remoteName(id); if (r.g) r.g.visible = false; who[r.i] = id; if (M.ball.owner === r) M.ball.owner = null;
        ctx.toast(`👋 <b>${r.name}</b> vào trận cho ${r.team.h.icon} ${r.team.h.name}!`, 2600);
      }
    }
    async function toNPC(r) {
      r.remote = null; r.name = 'Bạn NPC';
      if (!r.g) { const n = await makeNPC(r.team, r.role, r.i); if (!M) { scene.remove(n.g); return; } n.pos.copy(r.pos); Object.assign(r, { g: n.g, pos: n.g.position, hero: n.hero, cape: n.cape, rot: 0 }); }
      r.g.visible = true; r.npc = true;
    }
    function promote() {   // chủ trận rời đi → em làm chủ, tiếp tục mô phỏng từ trạng thái cuối
      N.client = false; if (last) { M.t = M.dur - last.l; M.goldOn = !!last.g[3]; M.gold.visible = M.goldOn; }
      ctx.toast('📡 Em trở thành chủ trận (bạn chủ cũ đã rời).', 2600);
    }
    const N = {
      client: false, get on() { return !!(room && room.ids && room.ids.length > 1); }, get id() { return sock && sock.id; },
      // vào phòng: có chủ khác → chờ chủ xếp chỗ (≤ 6 s) rồi theo cấu hình của chủ; không → tự làm chủ
      join() {
        init(); if (!sock) return Promise.resolve({});
        room = null; last = null; seen = 0; sock.emit('skJoin');
        return new Promise(res => {
          const t0 = performance.now(); let done = false; const fin = v => { if (!done) { done = true; res(v); } };
          const tick = () => {
            if (done) return;
            if (room && room.host === sock.id) { N.client = false; waitCfg = null; return fin({}); }
            if (room && room.host && !N.client) { N.client = true; waitCfg = c => fin({ cfg: JSON.parse(JSON.stringify(c)) }); }
            if (performance.now() - t0 > 6000) { waitCfg = null; if (N.client) { N.client = false; sock.emit('skLeave'); room = null; } return fin({}); }
            setTimeout(tick, 120);
          };
          tick();
        });
      },
      sync() { if (sock && room && room.host === sock.id) assign(room.ids); },
      leave() { if (sock && room) sock.emit('skLeave'); room = null; N.client = false; last = null; waitCfg = null; },
      ev(txt) { evq = (evq || []).concat([[++seq, txt]]).slice(-3); },   // 3 sự kiện gần nhất (khách không lỡ khi 2 việc xảy ra liền nhau)
      act(a, d) { if (sock && performance.now() - actT > 250) { actT = performance.now(); sock.emit('skAct', { a, d }); } },
      send(dt, fin) {
        if (!sock || !N.on || N.client || !M || M.loading) return;
        if (!fin && (sendT += dt) < 0.1) return; sendT = 0;
        const B = M.ball, b = B.mesh.position, g = M.goldPos;
        sock.emit('skState', { c: M.cfg, s: M.teams.map(T => T.score), l: round(M.left), k: M.kick, b: [round(b.x), round(b.y), round(b.z), B.owner ? B.owner.i : -1], g: [round(g.x), round(g.y), round(g.z), M.goldOn ? 1 : 0],
          r: M.riders.map(r => { const p = posOf(r); return [round(p.x), round(p.y), round(p.z), round(r.me ? pl.rot : r.rot || 0)]; }), w: M.ending !== undefined || fin ? (M.winner ?? 2) : -1, e: evq, gs: M.riders.map(r => r.goals | 0), gr: M.goldRider ?? -1 });
      },
      // khách: bám theo trạng thái của chủ (nội suy mượt), gửi hành động của mình
      follow(dt) {
        const d = last; if (!d) return; const m = M, k = Math.min(1, dt * 10);
        m.teams[0].score = d.s[0]; m.teams[1].score = d.s[1]; m.left = d.l;
        if (d.k !== m.kick) { m.kick = d.k; spot(m.me, tmp); pl.teleport(tmp.x, tmp.z, tmp.y); pl.vel.set(0, 0, 0); }
        if (d.e) for (const [q, txt] of d.e) if (q > seen) { seen = q; ctx.toast(txt, 2600); ctx.sfx && ctx.sfx('coin'); }
        m.stats.goals = d.gs ? d.gs[m.me.i] | 0 : 0; m.stats.catch = d.gr === m.me.i;
        const B = m.ball; B.mesh.position.lerp(tmp.set(d.b[0], d.b[1], d.b[2]), d.b[3] === m.me.i ? 1 : k); B.owner = d.b[3] >= 0 ? m.riders[d.b[3]] : null; B.mesh.rotation.y += dt * 2;
        if (B.owner === m.me) { const ro = pl.rot; B.mesh.position.set(pl.pos.x + Math.sin(ro) * 0.9, pl.pos.y + 1.1, pl.pos.z + Math.cos(ro) * 0.9); }
        m.goldOn = !!d.g[3]; m.gold.visible = m.goldOn; m.goldPos.lerp(tmp.set(d.g[0], d.g[1], d.g[2]), k);
        d.r.forEach((q, i) => { const r = m.riders[i]; if (!r || r.me || r.remote || !r.g) return; r.pos.lerp(tmp.set(q[0], q[1], q[2]), k); r.rot = q[3]; r.g.rotation.y = q[3]; });
        const p = pl.pos;
        if (!B.owner && p.distanceTo(B.mesh.position) < R_PICK) N.act('pick');
        if (m.goldOn && p.distanceTo(m.goldPos) < R_PICK + 0.4) N.act('gold');
        if (!m.half && m.left <= m.dur / 2) { m.half = true; magic.ask([['toan', 'khoahoc', 'bien'][Math.floor(Math.random() * 3)]], () => { m.boostT = 21; ctx.toast('⚡ Chổi tăng tốc 21 giây!', 2200); }, '⚡ Câu hỏi giữa hiệp — đúng thì chổi tăng tốc'); }
        if (saved) { m.boostT -= dt; saved.v.mode.speed = SPD * (m.boostT > 0 ? PHI : 1); }
        if (d.w >= 0) { m.winner = d.w === 2 ? null : d.w; if (d.w !== 2) m.goldBy = d.w; last = null; endMatch(); }
      },
    };
    return N;
  })();

  // ---------- mỗi khung ----------
  const rack = toWorld(13, 0);
  function update(dt, t) {
    if (M) stepMatch(dt, t); else if (R) stepRings(dt);
    if (M || R || menu || pl.frozen) return;
    const p = pl.pos, nearPitch = G && inPitch(p.x, p.z, 21), nearRack = Math.hypot(p.x - rack[0], p.z - rack[1]) < 26 && Math.abs(p.y - 55) < 8;
    if (nearPitch || nearRack) ctx.offer('🏆 Săn Cầu Vàng / 🎯 Luyện bay', () => { if (nearRack && !nearPitch) { if (!onBroom()) return; offBroom(); const s = L2W(0, W + 26, -21); pl.teleport(s.x, s.z, s.y); } openMenu(); }, 6);
  }
  ctx.pitch = { start: startMatch, rings: startRings, get match() { return M; }, get practice() { return R; }, end: endMatch, PITCH, origin: [OX, OZ] };
  return { build, unbuild, update };
}
