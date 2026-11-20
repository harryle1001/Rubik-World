// academy/broom.js — SÂN BAY CHỔI (thiết kế nguyên bản): sân cỏ bầu dục trên bậc đá nhô khỏi vách phía đông, nhìn xuống hồ.
//  · Sân 68 × 42 m (bán trục 34 × 21, tỉ lệ ≈ φ), vạch trắng, 4 khán đài tháp màu 4 nhà + cờ KayKit, cầu đá 6 m nối mép cao nguyên.
//  · Mini game "Bay chổi luyện tập": cưỡi chổi (chổi tập của trường nếu chưa mua) bay qua 8 vòng sáng; vòng 3 và 6 là "vòng câu hỏi":
//    chổi lơ lửng chờ em trả lời (Toán / Khoa học). Về đích: điểm theo thời gian + câu đúng → đồng vàng + điểm nhà.
//  · Điều khiển: cần gạt/WASD lái · ⬆ (Space) lên · ⬇ (C) xuống. Chổi = player.vehicle (fly) như khinh khí cầu.
// Draw call: sân + khán đài 1 · vòng 1 (instancing) · mũi tên 1 · cờ 4 · chổi 1.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV, mat } from '../sample/palette.js';
import { placeKit } from '../kit.js';
import { loadModel } from '../models.js';
import { C } from './plan.js';
import { loadHero, STUDENTS } from '../characters.js';
import { dressWizard } from './practice.js';
import { CFG } from '../config.js';

const PI = Math.PI, AU = 21, AV = 34, PU = 82, PV = 80;   // tâm sân (u, v), bán trục
const HC = ['#c8302c', '#3a6fc4', '#3f8a4c', '#c9a24a'], BAN = ['red', 'blue', 'green', 'yellow'];
// 8 vòng: [u, v, cao trên sân, hướng (rad quanh trục đứng)] — vòng quanh sân, lên xuống theo dãy 5 · 8 · 13 · 21
const RINGS = [[82, 52, 5, PI / 2], [96, 66, 8, PI / 4], [100, 88, 13, 0], [88, 108, 8, -PI / 4], [70, 104, 13, -PI / 2], [62, 86, 21, PI], [68, 62, 13, PI * 0.75], [82, 80, 8, PI / 2]];
const QUIZ = new Set([2, 5]), R = 2.6;

export function createBroom(ctx, magic, { Y, toWorld, toLocal }) {
  const { player } = ctx;
  let G = null, rings = null, arrow = null, boxes = [];
  const inPitch = (u, v) => ((u - PU) / AU) ** 2 + ((v - PV) / AV) ** 2 < 1;
  const onBridge = (u, v) => u > 54 && u < PU - AU + 1.5 && Math.abs(v - PV) < 2.1;
  // mặt đi: sân + cầu (chỉ khi người ở gần độ cao sân → không ảnh hưởng dốc đá bên dưới)
  const prev = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    const h = prev ? prev(x, z, y) : -99; if (!G || (y !== undefined && y < Y - 3)) return h;
    const [u, v] = toLocal(x, z); return inPitch(u, v) || onBridge(u, v) ? Math.max(h, Y) : h;
  };
  function build() {
    if (G) return;
    G = new THREE.Group(); G.name = 'academy-broom-pitch'; G.position.set(C[0], 0, C[1]);
    const b = new Batch(), N = 34;
    // bậc đá: đĩa elip dày 3 m + chân côn nhỏ dần vào vách; cỏ + vạch
    const ell = (r0, h, y, col, sx = AV, sz = AU) => b.add(new THREE.CylinderGeometry(r0, r0 * 0.9, h, N), col, PV, y, PU, 0, 0, 0, sx, 1, sz);
    ell(1.02, 3, Y - 1.55, '#7f7a73'); b.add(new THREE.ConeGeometry(1, 1, N), '#6f6a62', PV, Y - 13, PU, 0, PI, 0, AV * 0.95, 21, AU * 0.95);
    ell(1, 0.06, Y + 0.02, '#5f9a4a');
    for (const [k, w] of [[0.94, 0.25], [0.3, 0.2]]) b.add(new THREE.RingGeometry(1 - w / (k * AU), 1, 48).rotateX(-PI / 2), '#f3efe6', PV, Y + 0.07, PU, 0, 0, 0, AV * k, 1, AU * k);
    b.box(PV - 0.12, PV + 0.12, Y + 0.05, Y + 0.08, PU - AU * 0.92, PU + AU * 0.92, '#f3efe6');
    // lan can thấp quanh mép + va chạm (24 đoạn)
    for (let i = 0; i < 24; i++) {
      const a0 = i / 24 * 2 * PI, a1 = (i + 1) / 24 * 2 * PI, u0 = PU + Math.cos(a0) * AU, v0 = PV + Math.sin(a0) * AV, u1 = PU + Math.cos(a1) * AU, v1 = PV + Math.sin(a1) * AV;
      if (Math.abs(u0 - (PU - AU)) < 2 && Math.abs(v0 - PV) < 9) continue;   // chỗ nối cầu
      const L = Math.hypot(u1 - u0, v1 - v0), ry = Math.atan2(v1 - v0, u1 - u0);
      b.add(new THREE.BoxGeometry(0.5, 1.1, L + 0.3), '#9f9a92', (v0 + v1) / 2, Y + 0.55, (u0 + u1) / 2, ry);
      const [x0, z0] = toWorld(Math.min(u0, u1) - 0.3, Math.min(v0, v1) - 0.3), [x1, z1] = toWorld(Math.max(u0, u1) + 0.3, Math.max(v0, v1) + 0.3);
      boxes.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), top: Y + 1.1 });
    }
    // cầu đá + lan can
    b.box(PV - 2.1, PV + 2.1, Y - 1.2, Y, 54, PU - AU + 1.5, '#7f7a73'); for (const s of [-1, 1]) b.box(PV + s * 2.1 - 0.2, PV + s * 2.1 + 0.2, Y, Y + 1.1, 54, PU - AU + 1.5, '#9f9a92');
    // 4 khán đài tháp màu nhà (đường kính 8, cao 13, mái nón φ)
    const kit = {};
    [[PU - 13, PV - 30], [PU + 13, PV - 30], [PU - 13, PV + 30], [PU + 13, PV + 30]].forEach(([u, v], i) => {
      b.cyl(v, Y, u, 3.4, 8, '#9f9a92', 12); b.cyl(v, Y + 8, u, 3.9, 0.5, HC[i], 12); b.cone(v, Y + 8.5, u, 4.2, 4.2 * 1.618, HC[i], 12);
      b.cyl(v, Y + 4.6, u, 4.6, 0.3, '#a8744a', 16); b.cyl(v, Y + 4.9, u, 4.6, 0.9, '#6e4a30', 16, 4.6);   // ban công khán đài (sàn gỗ + lan can)
      (kit['kk_banner_patternA_' + BAN[i]] = []).push([v, Y + 4.6, u + Math.sign(PU - u) * 3.45, 1.1, u < PU ? 0 : PI]);
      const [x, z] = toWorld(u, v); ctx.colliders.push({ x, z, r: 3.6, broom: 1 });
    });
    const m = new THREE.Mesh(b.build(), matV()); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; G.add(m);
    for (const [n, l] of Object.entries(kit)) placeKit(G, n, l);
    // vòng bay: 1 InstancedMesh
    rings = new THREE.InstancedMesh(new THREE.TorusGeometry(R, 0.22, 6, 21), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), RINGS.length);
    const o = new THREE.Object3D();
    RINGS.forEach(([u, v, h, ry], i) => { o.position.set(v, Y + h, u); o.rotation.set(0, ry, 0); o.updateMatrix(); rings.setMatrixAt(i, o.matrix); });
    rings.computeBoundingSphere(); G.add(rings); paint(-1);   // cắt theo khung nhìn
    arrow = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 4), mat('lampGlow')); arrow.rotation.x = PI; arrow.visible = false; G.add(arrow);
    buildMatch();
    ctx.scene.add(G); (ctx.boxes = ctx.boxes || []).push(...boxes);
  }
  const col = new THREE.Color();
  function paint(next) { RINGS.forEach((_, i) => rings.setColorAt(i, col.set(i < next ? '#ffd25a' : i === next ? (QUIZ.has(i) ? '#e6b0ff' : '#7ad0ff') : next < 0 ? (QUIZ.has(i) ? '#b89adf' : '#9fc6e6') : '#5a6a80'))); rings.instanceColor.needsUpdate = true; }
  function unbuild() {
    if (!G) return; if (run) stop(false);
    ctx.scene.remove(G); G.traverse(o => { if (o.isMesh && !o.isInstancedMesh) o.geometry.dispose(); }); G = null;
    for (const x of boxes) { const i = ctx.boxes.indexOf(x); if (i >= 0) ctx.boxes.splice(i, 1); } boxes = [];
    for (let i = ctx.colliders.length - 1; i >= 0; i--) if (ctx.colliders[i].broom) ctx.colliders.splice(i, 1);
  }

  // ---------- mini game ----------
  let run = null, ui = null, broomM = null;
  const keys = new Set();
  addEventListener('keydown', e => { if (run && (e.code === 'Space' || e.code === 'KeyC')) { keys.add(e.code); e.preventDefault(); } }, true);
  addEventListener('keyup', e => keys.delete(e.code));
  function hud() {
    if (!ui) {
      ui = document.createElement('div'); ui.id = 'brHud';
      ui.innerHTML = `<style>#brHud{position:fixed;top:89px;left:50%;transform:translateX(-50%);z-index:30;font:700 15px system-ui;color:#fff3d0;background:rgba(27,22,38,.8);padding:8px 13px;border-radius:13px;text-align:center}
#brBtns{position:fixed;left:13px;top:38%;z-index:30;display:flex;flex-direction:column;gap:8px}#brBtns button{width:55px;height:55px;border-radius:50%;border:0;font-size:21px;background:rgba(27,22,38,.8);color:#fff}</style><span></span>`;
      document.body.appendChild(ui);
      const bt = document.createElement('div'); bt.id = 'brBtns'; bt.innerHTML = '<button data-k="Space">⬆</button><button data-k="KeyC">⬇</button><button data-x>🛬</button>'; document.body.appendChild(bt); ui.btns = bt;
      for (const el of bt.querySelectorAll('[data-k]')) { const k = el.dataset.k; el.onpointerdown = e => { e.preventDefault(); keys.add(k); }; el.onpointerup = el.onpointerleave = el.onpointercancel = () => keys.delete(k); }
      bt.querySelector('[data-x]').onclick = () => stop(false);
    }
    ui.hidden = ui.btns.hidden = !run;
  }
  function start() {
    if (run || player.vehicle) return;
    const [x, z] = toWorld(PU, PV);
    run = { i: 0, t0: performance.now(), q: 0, ok: 0, wait: false, prev: null, up: 2.6 };
    player.teleport(x, z, Y + 1.5);
    player.vehicle = { speed: 9.5, turn: 1.9, accel: 1.1, fly: true, lift: 4, maxAlt: Y + 34, anim: 'sit', seat: 0.3, seatZ: 0, camAdd: 3 };
    if (!broomM) loadModel('alley/broom').then(mdl => { if (!mdl) return; broomM = mdl; mdl.scale.setScalar(1.3); if (run) player.root.add(mdl); });   // chổi nằm dọc +z (hướng bay)
    else player.root.add(broomM);
    paint(0); hud(); ctx.sfx && ctx.sfx('magic');
    const own = ctx.wear && ctx.wear.eq && ctx.wear.eq.broom;
    ctx.toast(`🧹 ${own ? 'Chổi của em' : 'Chổi tập của trường'} đã sẵn sàng! Bay qua <b>8 vòng sáng</b> theo mũi tên. Vòng <b style="color:#e6b0ff">tím</b> = câu hỏi. ⬆ Space lên · ⬇ C xuống.`, 6500);
  }
  function stop(done) {
    if (!run) return; const r = run; run = null; keys.clear();
    if (broomM && broomM.parent) broomM.parent.remove(broomM);
    player.vehicle = null; player.frozen = false; arrow.visible = false; paint(-1); hud();
    const [x, z] = toWorld(PU - 6, PV); player.teleport(x, z, Y + 0.2);
    if (!done) return ctx.toast('🛬 Hạ cánh. Lại gần giữa sân để bay lại nhé!', 4000);
    const sec = (performance.now() - r.t0) / 1000 - r.q, pts = Math.max(1, Math.round(13 - sec / 13)) + r.ok * 3, coins = 3 + r.ok * 2;
    ctx.account && ctx.account.addCoins(coins); ctx.houses && ctx.houses.addPoints(pts, 'Bay chổi luyện tập');
    ctx.sfx && ctx.sfx('coin');
    ctx.toast(`🏁 Về đích sau <b>${sec.toFixed(1)} giây</b>, đúng <b>${r.ok}/2</b> câu hỏi! +${coins} 🪙 · +${pts} điểm nhà. 🔬 Chổi nghiêng về trước thì lao tới — giống <b>lực đẩy</b> của cánh quạt máy bay.`, 7000);
  }
  function update(dt, t) {
    if (!G) return;
    const cam = ctx.camera.position, [cu, cv] = toLocal(cam.x, cam.z); G.visible = cam.y < 600 && (Math.hypot(cu - PU, cv - PV) < 77 || (cam.y > Y + 21 && Math.hypot(cu - PU, cv - PV) < 233));   // trong sân lâu đài: tường che → không vẽ
    if (G.visible) matchUpdate(dt, t);
    const p = player.pos, [u, v] = toLocal(p.x, p.z);
    if (!run) { if (G.visible && inPitch(u, v) && Math.abs(p.y - Y) < 2 && !player.vehicle) ctx.offer('🧹 Bay chổi qua 8 vòng sáng', start, 8.5); return; }
    // lên / xuống
    const V = player.vehicle; if (!V) { run = null; hud(); return; }
    run.up -= dt; V.lift = run.wait ? 0 : keys.has('Space') || run.up > 0 ? 5.5 : keys.has('KeyC') ? -5.5 : 0;   // cất cánh 2,6 s đầu
    if (p.y < Y + 0.6) p.y = Y + 0.6;
    ui.firstChild.nextSibling.textContent = `🧹 Vòng ${run.i}/${RINGS.length} · ⏱ ${((performance.now() - run.t0) / 1000 - run.q).toFixed(0)} s`;
    if (broomM) { broomM.position.set(0, 0.42, 0.15); }
    const [ru, rv, rh, ry] = RINGS[run.i], ry0 = Y + rh;
    arrow.visible = true; arrow.position.set(rv, ry0 + R + 1.6 + Math.sin(t * 4) * 0.3, ru); arrow.rotation.y = t * 2;
    // qua vòng: khoảng cách tới tâm < R và cắt mặt phẳng vòng (pháp tuyến theo ry)
    const nx = Math.sin(ry), nz = Math.cos(ry), dx = v - rv, dz = u - ru, dy = p.y + 1 - ry0, side = dx * nx + dz * nz;
    if (run.prev !== null && Math.sign(side) !== Math.sign(run.prev) && Math.hypot(dx, dz, dy) < R + 0.6) {
      const k = run.i++; paint(run.i); ctx.sfx && ctx.sfx(QUIZ.has(k) ? 'magic' : 'coin');
      if (run.i >= RINGS.length) return stop(true);
      if (QUIZ.has(k)) {
        run.wait = true; player.frozen = true; const tq = performance.now();
        const resume = ok => { if (!run) return; run.wait = false; player.frozen = false; run.q += (performance.now() - tq) / 1000; if (ok) run.ok++; };
        magic.ask(k === 2 ? 'toan' : 'khoahoc', () => resume(true), '🧹 Vòng câu hỏi — trả lời để bay tiếp');
        const chk = setInterval(() => { if (!document.querySelector('#mgCard,#rwQ:not([hidden])')) { clearInterval(chk); if (run && run.wait) resume(false); } }, 300);
      } else ctx.toast(`✨ Qua vòng ${run.i}/${RINGS.length}!`, 1500);
      run.prev = null; return;
    }
    run.prev = Math.hypot(dx, dz, dy) < R * 3 ? side : null;
    if (Math.hypot(u - PU, v - PV) > 144) { ctx.toast('🧭 Bay xa sân quá — chổi tự đưa em về!', 3000); stop(false); }
  }
  // ---------- trận "Truyền Bóng Pha Lê" (v3): 2 đội NPC bay chổi, bóng bay giữa các cầu thủ, ghi điểm khi đưa bóng tới Sao Đích ----------
  // Giờ thi đấu 15:00–17:30 (và mọi lúc nếu chưa có ai bay). Nhà Long (đỏ) gặp Nhà Phụng (xanh). Điện thoại 4 cầu thủ.
  let M = null;
  function buildMatch() {
    const n = CFG.isMobile ? 4 : 6, fl = [];
    for (let i = 0; i < n; i++) {
      const f = { i, team: i % 2, hero: null, br: null, ph: i * 1.05, r: 9 + (i % 3) * 5, h: 4 + (i % 3) * 3.4 }; fl.push(f);
      loadHero(STUDENTS[(i * 7) % STUDENTS.length], 1.36).then(h => { if (!h || !G) return; f.hero = h; h.npc = true; G.add(h.model); h.anim.play(h.set.sit || h.set.idle, 0); dressWizard(h, f.team ? '#3a6fc4' : '#c8302c', CFG.isMobile ? null : (f.team ? '#3a6fc4' : '#c8302c'));
        loadModel('alley/broom').then(m => { if (m && G) { m.scale.setScalar(1.3); m.position.set(0, 0.42 / h.model.scale.y, 0.15 / h.model.scale.y); m.scale.multiplyScalar(1 / h.model.scale.y); h.model.add(m); } }); });
    }
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshBasicMaterial({ color: '#bff4ff', toneMapped: false })); G.add(ball);
    const stars = []; for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.OctahedronGeometry(1.3), new THREE.MeshBasicMaterial({ color: s < 0 ? '#ff6a5a' : '#6ab0ff', toneMapped: false })); st.position.set(PV + s * (AV - 4), Y + 9, PU); G.add(st); stars.push(st); }
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 2.1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide })); board.position.set(PV, Y + 12, PU - AU - 1); G.add(board);
    M = { fl, ball, stars, cv, tex, board, score: [0, 0], holder: 0, next: 0, from: new THREE.Vector3(), t0: 0, fly: 0, goal: -1, on: false, drawn: '' };
  }
  function drawBoard() {
    const g = M.cv.getContext('2d'), s = `${M.score[0]}-${M.score[1]}`; if (M.drawn === s) return; M.drawn = s;
    g.fillStyle = '#2b2238'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#d9b45a'; g.lineWidth = 6; g.strokeRect(4, 4, 504, 120);
    g.font = 'bold 40px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff8a7a'; g.fillText('🐉 Long ' + M.score[0], 130, 64); g.fillStyle = '#fff3d0'; g.fillText('–', 256, 64); g.fillStyle = '#8ac0ff'; g.fillText(M.score[1] + ' Phụng 🦚', 382, 64); M.tex.needsUpdate = true;
  }
  const fpos = (f, t, out) => { const a = t * (0.45 + f.i * 0.03) * (f.team ? 1 : -1) + f.ph; return out.set(PV + Math.sin(a) * (AV - 8) * (0.5 + 0.5 * Math.cos(a * 0.5 + f.i)), Y + f.h + Math.sin(t * 0.9 + f.i) * 1.6, PU + Math.cos(a) * (AU - 6) * 0.8); };
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  function matchUpdate(dt, t) {
    if (!M) return; const hr = ctx.sky && ctx.sky.state ? ctx.sky.state.hour : 10, cp = ctx.camera.position, [cu2, cv2] = toLocal(cp.x, cp.z), on = !run && hr >= 8 && hr < 20 && Math.hypot(cu2 - PU, cv2 - PV) < 77;   // ban ngày, chỉ vẽ cầu thủ khi camera trong 77 m
    if (on !== M.on) { M.on = on; for (const f of M.fl) if (f.hero) f.hero.model.visible = on; M.ball.visible = on; for (const s of M.stars) s.visible = on; }
    if (!on) return;
    for (const f of M.fl) { if (!f.hero) continue; fpos(f, t, tmp); fpos(f, t + 0.1, tmp2); f.hero.model.position.copy(tmp); f.hero.model.rotation.y = Math.atan2(tmp2.x - tmp.x, tmp2.z - tmp.z); f.hero.anim.update(dt); }
    for (const s of M.stars) s.rotation.y = t * 1.3;
    // bóng: bay từ người giữ tới người kế tiếp (0,9 s); đôi khi lao tới Sao Đích → ghi điểm
    if (t > M.next) {
      const h = M.fl[M.holder]; fpos(h, t, M.from); M.t0 = t; M.fly = 0.9;
      if (Math.random() < 0.22) { M.goal = h.team; } else { M.goal = -1; M.holder = (M.holder + 1 + Math.floor(Math.random() * (M.fl.length - 1))) % M.fl.length; }
      M.next = t + 1.6 + Math.random() * 1.2;
    }
    const k = Math.min(1, (t - M.t0) / M.fly); const to = M.goal >= 0 ? tmp.copy(M.stars[M.goal ? 0 : 1].position) : fpos(M.fl[M.holder], t, tmp);
    M.ball.position.lerpVectors(M.from, to, k); M.ball.position.y += Math.sin(k * Math.PI) * 2.6;
    if (M.goal >= 0 && k >= 1) { M.score[M.goal]++; const p = player.pos, [u, v] = toLocal(p.x, p.z); if (Math.hypot(u - PU, v - PV) < 55) { ctx.sfx && ctx.sfx('coin'); ctx.toast(`🏆 <b>${M.goal ? 'Nhà Phụng' : 'Nhà Long'}</b> ghi điểm! Tỉ số ${M.score[0]} – ${M.score[1]}.`, 3000); } M.goal = -1; M.from.copy(M.ball.position); M.t0 = t; }
    drawBoard();
  }
  return { build, unbuild, update, start, stop, get running() { return !!run; }, PITCH: { u: PU, v: PV } };
}
