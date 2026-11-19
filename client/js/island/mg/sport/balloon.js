// balloon.js — ĐUA KHINH KHÍ CẦU (khoá 'balloon'): 3 khinh khí cầu bay thật lên trời ngay trên khu chơi, ai chạm 144 m (Fibonacci) trước thắng.
// Trả lời đúng → bật lửa đốt 2,6 s (khí nóng nhẹ hơn → bay vọt lên); sai → khí nguội dần, khí cầu chùng xuống. Mốc độ cao kèm điều thú vị.
// Mỗi khí cầu = 1 khối gộp (8 múi vải 2 màu + giỏ + dây) + 1 ngọn lửa → 6 draw call cho cả 3 chiếc.
import * as THREE from 'three';
import { PHI, clamp, rnd, batch } from './kit.js';
import { quiz, askBar } from '../quiz.js';

const GOAL = 144, MILE = [[21, 'Cao bằng toà nhà 7 tầng!'], [55, 'Không khí càng lên cao càng loãng và lạnh hơn.'], [89, 'Chim đại bàng thường bay lượn ở độ cao này.'], [121, 'Sắp tới đích — nhìn xuống thấy cả hòn đảo!']];
function makeBalloon(c1, c2) {
  const b = batch(), N = 8;
  for (let i = 0; i < N; i++) { const g = new THREE.SphereGeometry(3, 4, 12, i * 2 * Math.PI / N, 2 * Math.PI / N); g.scale(1, 1.18, 1); b.add(g, i % 2 ? c1 : c2, 0, 7.4, 0); }
  b.add(new THREE.CylinderGeometry(0.9, 0.35, 1.6, 8, 1, true), c2, 0, 4.1, 0);
  b.box(1.3, 0.9, 1.3, 0, 0, 0, '#8a5a32'); b.box(1.42, 0.12, 1.42, 0, 0.9, 0, '#5d3a1e');
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) b.add(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 4), '#3a2a1e', x * 0.9, 2.2, z * 0.9, 0, 1, 1, 1, z * 0.25, -x * 0.25);
  const g = new THREE.Group(); g.add(b.mesh());
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 7), new THREE.MeshBasicMaterial({ color: '#ffb340', transparent: true, opacity: 0.9 })); fl.position.y = 3.4; fl.visible = false; g.add(fl);
  return { g, fl };
}
function startBalloon(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx;
  const pad = batch(); pad.add(new THREE.CylinderGeometry(9, 9, 0.12, 34), '#e9dcc0', 0, 0.06, 0); for (let i = 0; i < 3; i++) pad.add(new THREE.CircleGeometry(1.6, 16).rotateX(-Math.PI / 2), '#e8453c', (i - 1) * 5.5, 0.13, 0); root.add(pad.mesh());
  const COL = [['#e8453c', '#ffd36e'], ['#3d8fd9', '#f4f1ea'], ['#3fa36b', '#f2b134']];
  const B = COL.map((c, i) => { const o = makeBalloon(...c); o.g.position.set((i - 1) * 5.5, 0, 0); root.add(o.g); return { ...o, x: (i - 1) * 5.5, y: 0, v: 0, burn: 0, a: null, me: i === 1, name: ['Nam', '', 'Lan'][i], done: false, rate: [0.98, 0, 1.04][i] }; });
  const P = B[1];
  me.place(P.x, 0, Math.PI); me.face(P.x, -10);
  ['student-male-b', null, 'student-female-a'].forEach((k, i) => k && api.actor(k, { name: B[i].name, look: { role: 'student', shirt: COL[i][0], pants: '#2a2f4a' } }).then(a => { if (!a) return; B[i].a = a; a.place(B[i].x, 0, Math.PI); a.say('Bay thôi!', 1800); }));
  api.cam.x = P.x; api.cam.y = 4; api.cam.z = 0; api.cam.yaw = 0.35; api.cam.pitch = 0.18; api.cam.dist = 21;
  const S = { t: 0, over: false, live: true, phase: 'wait', ask: null, Q: null, right: 0, wrong: 0, mile: 0, order: [], qT: 1.5 };
  const info = () => { const rank = 1 + B.filter(b => b !== P && b.y > P.y).length; hud.info(`🎈 ${Math.round(P.y)}/${GOAL} m · Hạng ${rank}`); hud.score(S.right * 10); };
  function ask() {
    if (S.over) return; S.Q = quiz(S.right % 2 ? 'science' : 'math', 1 + Math.min(2, Math.floor(S.right / 3)));
    hud.msg(`❓ ${S.Q.q}`, 0);
    S.ask = askBar(api, S.Q, ok => {
      if (ok) { S.right++; P.burn = 2.6; sfx('ok'); me.emote('cheer'); hud.msg(`🔥 ${S.Q.why} · Bật lửa đốt — khí nóng bay lên!`, 2200); }
      else { S.wrong++; P.burn = 0; P.v = Math.min(P.v, 0); sfx('land'); me.emote('no'); hud.msg(`❄️ ${S.Q.why} · Khí nguội, khí cầu chùng xuống`, 2600); }
      S.ask = null; S.qT = ok ? 1.6 : 2.4; info();
    });
  }
  function finish() {
    S.over = true; hud.clearBar(); const rank = S.order.indexOf(P) + 1 || 3, sc = S.right * 10 + [0, 50, 30, 15][rank];
    if (rank === 1) me.emote('cheer');
    api.end({ score: sc, title: rank === 1 ? '🥇 Chạm mây đầu tiên!' : rank === 2 ? '🥈 Về nhì!' : '🥉 Về ba!', text: `Đúng ${S.right}/${S.right + S.wrong} câu<br>Khinh khí cầu bay được vì không khí nóng trong bóng nhẹ hơn không khí lạnh bên ngoài. Năm 1783, anh em Montgolfier (Pháp) bay chuyến khinh khí cầu có người đầu tiên.` });
  }
  hud.msg('🎈 Trả lời đúng để <b>bật lửa</b> — khí nóng bay lên! Ai chạm 144 m trước sẽ thắng.', 3000); info();
  return {
    key(e) { if (S.ask && /^Digit[123]$/.test(e.code)) S.ask.answer(+e.code.slice(5) - 1); },
    update(dt, t) {
      if (!S.over) { S.t += dt; hud.time(S.t); if (!S.ask && (S.qT -= dt) <= 0) ask(); }
      for (const b of B) {
        if (b !== P && !S.over && !b.done) { b.burnT = (b.burnT ?? rnd(1, 3)) - dt; if (b.burnT <= 0) { const gap = P.y - b.y; b.burn = Math.random() < 0.72 + clamp(gap / 89, -0.25, 0.2) ? 2.6 : 0; b.burnT = rnd(3.2, 4.6) / b.rate; } }
        const acc = b.burn > 0 ? 3.4 : -0.9; b.burn -= dt; b.v = clamp(b.v + acc * dt, -1.2, 5.5); if (b.y <= 0 && b.v < 0) b.v = 0;
        if (!b.done) b.y = Math.max(0, b.y + b.v * dt); if (b.y >= GOAL && !b.done) { b.done = true; b.y = GOAL; S.order.push(b); if (b.a) b.a.emote('cheer'); }
        const sway = Math.sin(t * 0.8 + b.x) * 0.06 * Math.min(1, b.y / 8);
        b.g.position.set(b.x + Math.sin(t * 0.3 + b.x) * Math.min(2, b.y / 21), b.y, 0); b.g.rotation.z = sway; b.fl.visible = b.burn > 0; if (b.fl.visible) b.fl.scale.set(1, 0.8 + Math.random() * 0.5, 1);
        const A = b === P ? me : b.a; if (A) { A.pos.set(b.g.position.x, b.y + 0.12, 0); A.yaw = Math.PI; }
      }
      if (P.burn > 0 && Math.random() < dt * 6) sfx('jump');
      api.cam.x = P.g.position.x; api.cam.y = P.y + 4; api.cam.pitch = 0.18 + Math.min(0.32, P.y / 377);
      if (S.mile < MILE.length && P.y >= MILE[S.mile][0]) { hud.msg(`📏 ${MILE[S.mile][0]} m: ${MILE[S.mile][1]}`, 2200); S.mile++; }
      if (!S.over) { info(); if (P.done || S.order.length >= 2) { if (!P.done) S.order.push(P); finish(); } }
    },
    dispose() { S.live = false; S.over = true; },
  };
}
export const balloon = { balloon: { name: '🎈 Đua khinh khí cầu', radius: 13, start: startBalloon } };
