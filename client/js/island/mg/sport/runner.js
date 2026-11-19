// runner.js — ĐƯỜNG ĐUA 3 LÀN dùng chung (trượt ván, patin, trượt tuyết, Rubik Kart, đua thú) — chơi ngay trong thế giới (mg/host.js).
// Kiểu "máy chạy bộ": nhân vật đứng ở z = 0, đường + vật trang trí trôi về phía camera → khu chơi gọn (bán kính 34 m), ít draw call.
//   lane  : cổng đáp án mỗi 55 m — lái vào làn có đáp án đúng → tăng tốc (sai: chậm lại + lời giải).
//   button: (đua thú) không lái, câu hỏi hiện ở 3 nút dưới — đúng thì thú của em bứt tốc.
// Vật cản (nón, cây thông, lốp xe): đổi làn hoặc bật nhảy để tránh. Về đích 610 m (Fibonacci) ≈ 1 phút, xếp hạng với 2 bạn NPC.
// Điều khiển: chạm nửa trái/phải màn hình (hoặc ◀ ▶, A/D, mũi tên) đổi làn · vuốt lên / ⤴ / Space nhảy.
import * as THREE from 'three';
import { PHI, clamp, rnd, pick, batch, textSprite } from './kit.js';
import { quiz, askBar, board } from '../quiz.js';
import { prop, anim } from '../props.js';
import { placeKit } from '../../kit.js';

const LANE = PHI * PHI, GATE = 55, NEAR = 13, FAR = -55, KIDS = ['student-male-b', 'student-female-a', 'student-male-d', 'student-female-c'];

export function runner(ctx, api, C) {
  C = Object.assign({ goal: 610, topic: 'math', speed: 8, boost: 5, jump: true, mode: 'lane', ground: '#9aa3ad', side: '#7fbf6a', line: '#ffffff',
    obst: 'cone', obstColor: '#ff8a3d', decor: [], ride: null, rideSize: 1, sit: false, rivals: 2, fact: '', title: '' }, C);
  const { root, hud, me } = api, sfx = api.sfx, M = api.mat;
  // Đường đua đặt trên CẦU CẠN cao H = 13 m (Fibonacci): đường dài 68 m không bao giờ đè lên nhà/cây của thế giới mở, khu chơi dưới đất chỉ cần bán kính 13 m
  // Host tìm được hành lang đất trống (api.onGround, xem host findRect) → đường chạy sát đất trên nền đắp; không có thì lùi về cầu cạn
  const H = C.lift ?? (api.onGround ? 0 : 13), world = new THREE.Group(); world.position.y = H; root.add(world);
  // ---------- Đường + lề + dầm cầu + trụ (1 khối gộp) + vạch làn trôi (InstancedMesh) ----------
  { const b = batch(), W = LANE * 3 + 1, L = NEAR - FAR + 21, zc = (NEAR + FAR) / 2 - 8, SW = 6.8;
    b.add(new THREE.PlaneGeometry(W, L).rotateX(-Math.PI / 2), C.ground, 0, 0.03, zc);
    for (const s of [-1, 1]) { b.add(new THREE.PlaneGeometry(SW, L).rotateX(-Math.PI / 2), C.side, s * (W / 2 + SW / 2), 0.02, zc); b.box(0.3, 0.25, L, s * W / 2, 0, zc, C.line); b.box(0.2, 0.9, L, s * (W / 2 + SW), 0, zc, '#e8e2d4'); }
    if (H) b.box(W + SW * 2 + 0.4, 0.9, L, 0, -0.9, zc, '#b9b2a6'); else b.box(W + SW * 2 + 0.4, 2.7, L, 0, -2.7, zc, '#a99f8a');   // nền đắp che chỗ đất trũng
    if (H) for (const z of [NEAR - 2, -8, FAR + 21]) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.8, 1.1, H, 10), '#cfc8bb', s * (W / 2 + 2), -H / 2 - 0.9, z);
    world.add(b.mesh()); }
  const stripes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.02, 1.6), new THREE.MeshBasicMaterial({ color: C.line }), 2 * 21);
  { const o = new THREE.Object3D(); let k = 0; for (const x of [-LANE / 2, LANE / 2]) for (let i = 0; i < 21; i++) { o.position.set(x, 0.05, NEAR - i * 4); o.updateMatrix(); stripes.setMatrixAt(k++, o.matrix); } }
  const scroll = new THREE.Group(); scroll.add(stripes); world.add(scroll);
  const deco = new THREE.Group(); world.add(deco);   // trang trí hai bên, lặp chu kỳ 34 m
  C.decor.forEach(([name, size, gap = 8], j) => { const T = []; for (let z = NEAR + 34; z > FAR - 34; z -= 34 / Math.round(34 / gap)) for (const s of [-1, 1]) T.push([s * (LANE * 1.5 + 2.6 + (j * 2.2) + rnd(0, 1.3)), 0, z + rnd(-1, 1) + j * 3, size, rnd(0, 6.28)]); placeDecor(name, T); });
  function placeDecor(name, T) { placeKit(deco, name, T, { shadow: false }); }
  // ---------- Vạch đích ----------
  const finish = new THREE.Group(); { const b = batch(); for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) b.box(LANE * 3 / 8, 0.02, 0.6, -LANE * 1.5 + (i + 0.5) * LANE * 3 / 8, 0.04, j * 0.6, (i + j) % 2 ? '#222' : '#fff'); b.box(0.3, 4.2, 0.3, -LANE * 1.6, 0, 0, '#e8453c'); b.box(0.3, 4.2, 0.3, LANE * 1.6, 0, 0, '#e8453c'); b.box(LANE * 3.4, 0.7, 0.3, 0, 4.2, 0, '#e8453c'); finish.add(b.mesh()); }
  const flab = textSprite('🏁 ĐÍCH', { size: 0.6, w: 256 }); flab.position.set(0, 4.55, 0.2); finish.add(flab); finish.visible = false; world.add(finish);
  // ---------- Vật cản: 1 InstancedMesh (đặt lại ma trận mỗi khung) ----------
  const OG = { cone: () => new THREE.ConeGeometry(0.32, 0.8, 8).translate(0, 0.4, 0), pine: () => new THREE.ConeGeometry(0.9, 2.6, 7).translate(0, 1.3, 0), tyre: () => new THREE.TorusGeometry(0.42, 0.2, 6, 12).rotateX(Math.PI / 2).translate(0, 0.2, 0), hay: () => new THREE.BoxGeometry(1.2, 0.7, 0.7).translate(0, 0.35, 0) };
  const NOB = 13, obs = [], om = C.obst ? new THREE.InstancedMesh(OG[C.obst](), M(C.obstColor), NOB) : null;
  if (om) { om.castShadow = true; om.frustumCulled = false; world.add(om); }
  // ---------- Cổng đáp án: 1 cổng dùng lại, chữ (câu hỏi + 3 đáp án) vẽ chung 1 canvas → 2 draw call ----------
  const gates = [0].map(() => {
    const g = new THREE.Group(), b = batch(); b.box(0.3, 4, 0.3, -LANE * 1.6, 0, 0, '#3d8fd9'); b.box(0.3, 4, 0.3, LANE * 1.6, 0, 0, '#3d8fd9');
    g.add(b.mesh()); const { mesh: bd, draw } = board(LANE * 3.4); bd.position.set(0, 4 + 0.6, 0); g.add(bd);
    g.visible = false; world.add(g); return { g, draw, s: 0, Q: null, done: true };
  });
  // ---------- Nhân vật, xe, bạn đua ----------
  const S = { live: true, count: 3, d: 0, v: 0, lane: 1, x: 0, y: 0, vy: 0, boostT: 0, slowT: 0, t: 0, score: 0, right: 0, wrong: 0, over: false, nextGate: 34, nextOb: 21, started: false, asked: null };
  const laneX = i => (i - 1) * LANE;
  me.place(0, 0, Math.PI); me.faceTo = Math.PI; if (C.sit) me.sit('sit');
  let ride = null, rideA = null;
  if (C.ride && /^animal-/.test(C.ride)) anim(world, C.ride, C.rideSize).then(r => { if (!r || !S.live) return; ride = r.obj; rideA = r.anim; rideA.play('Gallop'); });
  else if (C.ride === 'ski') { const b = batch(); for (const x of [-0.16, 0.16]) b.box(0.1, 0.05, 1.7, x, 0, 0, '#e8453c'); ride = b.mesh(); world.add(ride); }
  else if (C.ride) prop(world, C.ride, { size: C.rideSize, skip: C.skip }).then(r => { if (r && S.live) ride = r; });
  const rivals = [];
  for (let i = 0; i < C.rivals; i++) {
    const R = { lane: i === 0 ? 0 : 2, d: 0, v: 0, base: C.speed * [0.97, 1.03][i % 2], a: null, ride: null, rideA: null, name: ['Nam', 'Lan', 'Minh'][i] }, rr = C.rivalRides ? C.rivalRides[i] : C.ride;
    rivals.push(R);
    api.actor(KIDS[i], { name: R.name, look: { role: 'student', shirt: ['#e8453c', '#3fa36b'][i], pants: '#2a2f4a' } }).then(a => { if (!a || !S.live) return; R.a = a; a.place(laneX(R.lane), 0, Math.PI); a.pos.y = H; if (C.sit) a.sit('sit'); a.say(pick(['Đua nào!', 'Cố lên!', 'Tớ sẽ thắng!']), 2000); });
    if (rr && /^animal-/.test(rr)) anim(world, rr, C.rideSize).then(r => { if (!r || !S.live) return; R.ride = r.obj; R.rideA = r.anim; r.anim.play('Gallop'); });
    else if (rr === 'ski') { const b = batch(); for (const x of [-0.16, 0.16]) b.box(0.1, 0.05, 1.7, x, 0, 0, '#3d8fd9'); R.ride = b.mesh(); world.add(R.ride); }
    else if (rr) prop(world, rr, { size: C.rideSize, skip: C.skip }).then(r => { if (r && S.live) R.ride = r; });
  }
  api.cam.x = 0; api.cam.y = H + 1.6; api.cam.z = -3.4; api.cam.yaw = 0; api.cam.pitch = 0.48; api.cam.dist = 11;

  // ---------- Điều khiển ----------
  const steer = k => { if (S.over || C.mode !== 'lane') return; S.lane = clamp(S.lane + k, 0, 2); sfx('ui'); };
  const jump = () => { if (S.over || !C.jump || S.y > 0.05) return; S.vy = 7.2; sfx('jump'); me.emote('use'); };
  function bar() {
    hud.clearBar();
    if (C.mode === 'lane') { hud.button('◀', () => steer(-1)); if (C.jump) hud.button('⤴ Nhảy', jump); hud.button('▶', () => steer(1)); }
  }
  const info = () => { const rank = 1 + rivals.filter(r => r.d > S.d).length; hud.info(`🏁 ${Math.min(C.goal, Math.round(S.d))}m · Hạng ${rank}`); hud.score(S.score); return rank; };

  // ---------- Câu hỏi ----------
  function arm(G, s) {
    G.s = s; G.Q = quiz(C.topic, 1 + Math.min(2, Math.floor(S.right / 3))); G.done = false; G.g.visible = C.mode === 'lane';
    G.draw(G.Q);
    if (C.mode === 'button') { S.asked = askBar(api, G.Q, (ok, c) => judge(G, ok, c)); hud.msg(`❓ ${G.Q.q}`, 0); }
    else hud.msg(`❓ ${G.Q.q} → lái vào làn đúng!`, 2600);
  }
  function judge(G, ok, pickTxt) {
    G.done = true;
    if (ok) { S.right++; S.score += 10 * (S.boostT > 0 ? 2 : 1); S.boostT = 2.6; sfx('ok'); me.emote('cheer'); hud.msg(`✅ ${G.Q.why} · Tăng tốc!`, 1800); }
    else { S.wrong++; S.slowT = 1.6; sfx('land'); me.emote('no'); hud.msg(`❌ ${pickTxt ? `Không phải “${pickTxt}”. ` : ''}${G.Q.why}`, 2600); }
    if (C.mode === 'button') hud.clearBar();
  }

  // ---------- Vật cản ----------
  const _o = new THREE.Object3D();
  function spawnOb() {
    const s = S.nextOb; S.nextOb += rnd(11, 19);
    if (!om || Math.abs(((s - 34) % GATE + GATE) % GATE) < 7 || s > C.goal - 13) return;   // không đặt sát cổng / đích
    obs.push({ s, lane: Math.floor(rnd(0, 3)), hit: false }); if (Math.random() < 0.3) obs.push({ s: s + 0.01, lane: Math.floor(rnd(0, 3)), hit: false });
  }

  function finishRace() {
    S.over = true; const rank = info(); hud.clearBar(); hud.msg('', 0);
    const bonus = [0, 50, 30, 15][rank] || 0; S.score += bonus; hud.score(S.score);
    if (rank === 1) me.emote('cheer');
    api.end({ score: S.score, title: rank === 1 ? '🥇 Về nhất!' : rank === 2 ? '🥈 Về nhì!' : '🥉 Về đích!', text: `Đúng ${S.right}/${S.right + S.wrong} câu · thưởng hạng +${bonus}<br>${C.fact}` });
  }

  bar(); hud.msg(C.title, 3200);
  return {
    down(e) { if (S.over) return false; S.px = e.clientX; S.py = e.clientY; S.pt = performance.now(); return true; },
    up(e) {
      if (S.over || S.px == null) return; const dx = e.clientX - S.px, dy = e.clientY - S.py; S.px = null;
      if (dy < -34 && Math.abs(dy) > Math.abs(dx)) return jump();
      if (Math.abs(dx) > 34) return steer(Math.sign(dx));
      if (C.mode === 'lane') steer(e.clientX < innerWidth / 2 ? -1 : 1); else jump();
    },
    key(e) {
      const c = e.code;
      if (c === 'ArrowLeft' || c === 'KeyA') steer(-1); else if (c === 'ArrowRight' || c === 'KeyD') steer(1);
      else if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') { e.preventDefault(); jump(); }
      else if (C.mode === 'button' && S.asked && /^Digit[123]$/.test(c)) S.asked.answer(+c.slice(5) - 1);
    },
    update(dt) {
      if (rideA) rideA.update(dt * (S.v / C.speed)); for (const R of rivals) if (R.rideA) R.rideA.update(dt * (R.v / C.speed));
      if (S.over) { S.v = Math.max(0, S.v - dt * 6); }
      else {
        if (S.count <= 0) { S.t += dt; hud.time(S.t); }
        if (S.count > 0) { const c0 = Math.ceil(S.count); S.count -= dt; const c1 = Math.ceil(S.count); if (c1 !== c0 || S.t === 0) { hud.msg(c1 > 0 ? `<b style="font-size:34px">${c1}</b>` : '<b style="font-size:34px">XUẤT PHÁT!</b>', 900); sfx(c1 > 0 ? 'ui' : 'ok'); } S.t = 0.001; }
        const want = S.count > 0 ? 0 : C.speed * (S.boostT > 0 ? 1 + C.boost / C.speed : 1) * (S.slowT > 0 ? 0.55 : 1);
        S.boostT -= dt; S.slowT -= dt; S.v += (want - S.v) * (1 - Math.exp(-dt * 2.2));
      }
      S.d += S.v * dt;
      // nhảy
      if (S.y > 0 || S.vy > 0) { S.vy -= 21 * dt; S.y = Math.max(0, S.y + S.vy * dt); if (S.y === 0) S.vy = 0; }
      S.x += (laneX(S.lane) - S.x) * (1 - Math.exp(-dt * 13));
      me.pos.set(S.x, H + S.y + (C.sit ? C.seat || 0.25 : C.rideH || 0), 0); me.yaw = Math.PI - (laneX(S.lane) - S.x) * 0.12; me.faceTo = null;
      if (ride) { ride.position.set(S.x, S.y, 0); ride.rotation.y = me.yaw; }
      // trôi đường
      scroll.position.z = S.d % 4; deco.position.z = S.d % 34;
      // bạn đua: bám đuổi (nhanh hơn khi bị bỏ xa, chậm lại khi dẫn xa) → cuộc đua luôn hấp dẫn
      for (const R of rivals) {
        if (!S.over || R.d < C.goal) { const gap = S.d - R.d, w = S.count > 0 ? 0 : R.base * (1 + clamp(gap / 89, -0.12, 0.16)); R.v += (w - R.v) * (1 - Math.exp(-dt * 1.5)); R.d += R.v * dt; }
        const z = -(R.d - S.d), x = laneX(R.lane), vis = z < NEAR + 4 && z > FAR;
        if (R.a) { R.a.pos.set(x, H + (C.sit ? C.seat || 0.25 : C.rideH || 0), z); R.a.yaw = Math.PI; R.a.model.visible = vis; }
        if (R.ride) { R.ride.position.set(x, 0, z); R.ride.rotation.y = Math.PI; R.ride.visible = vis; }
      }
      if (S.over) return;
      // cổng
      if (S.d - FAR > S.nextGate && S.nextGate < C.goal - 21) { const G = gates.find(g => g.done && !g.g.visible); if (G) { G.pending = S.nextGate; G.g.visible = C.mode === 'lane'; G.s = S.nextGate; S.nextGate += GATE; G.armed = false; } }
      for (const G of gates) {
        if (G.pending == null) continue; const z = -(G.s - S.d); G.g.position.z = z;
        if (!G.armed && S.count <= 0 && z > (C.mode === 'lane' ? -50 : -34)) { G.armed = true; arm(G, G.s); }
        if (G.armed && !G.done && z > 0) { if (C.mode === 'lane') judge(G, G.Q.choices[S.lane] === G.Q.a, G.Q.choices[S.lane]); else { if (S.asked) S.asked.answer(-1); judge(G, false, null); } }
        if (z > 4) { G.g.visible = false; G.pending = null; G.done = true; }
      }
      // vật cản
      while (S.nextOb < S.d + 60) spawnOb();
      let k = 0;
      for (let i = obs.length - 1; i >= 0; i--) {
        const o = obs[i], z = -(o.s - S.d);
        if (z > NEAR) { obs.splice(i, 1); continue; }
        if (!o.hit && Math.abs(z) < 0.7 && Math.abs(laneX(o.lane) - S.x) < 0.9 && S.y < 0.55) { o.hit = true; S.slowT = 1.3; S.v *= 0.45; sfx('land'); me.emote('hit'); hud.msg(C.jump ? '💥 Ối! Nhảy (vuốt lên) hoặc đổi làn để tránh' : '💥 Ối! Đổi làn để tránh vật cản', 1500); }
        if (om && k < NOB && z > FAR - 4) { _o.position.set(laneX(o.lane), 0, z); _o.rotation.set(o.hit ? 1.3 : 0, 0, 0); _o.scale.setScalar(1); _o.updateMatrix(); om.setMatrixAt(k++, _o.matrix); }
      }
      if (om) { om.count = k; om.instanceMatrix.needsUpdate = true; }
      // đích
      const fz = -(C.goal - S.d); finish.visible = fz > FAR; finish.position.z = fz;
      info();
      if (S.d >= C.goal) finishRace();
    },
    dispose() { S.live = false; S.over = true; },
  };
}
