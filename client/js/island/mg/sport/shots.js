// shots.js — Trò "trả lời để sút/ném" chơi ngay trong thế giới (mg/host.js), dùng model CC0 có sẵn (sport_goal, sport_hoop, bóng).
//   ⚽ football  : sút phạt đền 11 m — bảng trên khung thành có 3 đáp án ứng với 3 góc; chọn đúng → thủ môn bay nhầm hướng, VÀO!
//   🏀 basketball: trả lời đúng mới được 1 quả bóng, rồi canh lực ném (thanh lực chạy qua lại, bấm khi ở vùng xanh).
// Tỷ lệ vàng: sân 21 m (Fibonacci), bóng bay 1/φ s, 10 quả / 55 s.
import * as THREE from 'three';
import { PHI, rnd, pick, batch, crowd } from './kit.js';
import { quiz, askBar, board } from '../quiz.js';
import { prop } from '../props.js';

function tweens() {
  const list = []; const t = (dur, fn) => new Promise(res => list.push({ t: 0, dur, fn, res }));
  t.update = dt => { for (let i = list.length - 1; i >= 0; i--) { const w = list[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.fn(k); if (k >= 1) { list.splice(i, 1); w.res(); } } };
  t.clear = () => { list.length = 0; }; return t;
}
const arc = (o, a, b, h, k) => o.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + Math.sin(Math.PI * k) * h, a.z + (b.z - a.z) * k);

// ======================= ⚽ BÓNG ĐÁ: SÚT PHẠT ĐỀN =======================
function startFootball(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx, tw = tweens(), GZ = -8, SPOT = new THREE.Vector3(0, 0.21, GZ + 11), N = 10;
  // sân cỏ sọc + vạch vôi (1 khối gộp)
  { const b = batch(); for (let i = 0; i < 8; i++) b.add(new THREE.PlaneGeometry(21, 21 / 8).rotateX(-Math.PI / 2), i % 2 ? '#5fae4e' : '#69b956', 0, 0.03, -10.5 + (i + 0.5) * 21 / 8 + 2.5);
    const W = (w, d, x, z) => b.add(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), '#f4f4ee', x, 0.045, z);
    W(16.5, 0.12, 0, GZ); W(0.12, 5.5, -8.25, GZ + 2.75); W(0.12, 5.5, 8.25, GZ + 2.75); W(16.5, 0.12, 0, GZ + 5.5); b.add(new THREE.CircleGeometry(0.15, 10).rotateX(-Math.PI / 2), '#f4f4ee', 0, 0.05, SPOT.z);
    root.add(b.mesh()); }
  prop(root, 'sport_goal', { size: 6.2, z: GZ - 0.6 });
  const cr = crowd(root, { z: GZ - 4.5, len: 13, rows: 3 });
  const { mesh: bd, draw } = board(6.4); bd.position.set(0, 3.9, GZ - 0.4); root.add(bd);
  let ball = null; prop(root, 'sport_ball_soccer', { size: 0.42 }).then(o => { if (!o) return; ball = o; ball.position.copy(SPOT).setY(0); });
  let keeper = null; api.actor('student-male-c', { name: 'Thủ môn', look: { role: 'student', shirt: '#f2b134', pants: '#2a2f4a' } }).then(a => { if (!a) return; keeper = a; a.place(0, GZ + 0.4, 0); a.say('Sút đi, thầy bắt hết!', 2200); });
  me.place(-0.9, SPOT.z + 1.8, Math.PI); me.face(0, GZ);
  api.cam.x = 0; api.cam.y = 1.2; api.cam.z = GZ + 7.5; api.cam.yaw = 0; api.cam.pitch = 0.4; api.cam.dist = innerWidth < innerHeight ? 13 : 12;
  const S = { n: 0, goals: 0, streak: 0, score: 0, busy: false, Q: null, ask: null, over: false, live: true };
  const info = () => { hud.info(`⚽ ${S.goals}/${S.n} · còn ${N - S.n}`); hud.score(S.score); };
  const CORNER = [new THREE.Vector3(-2.3, 1.7, GZ - 0.3), new THREE.Vector3(0, 2.0, GZ - 0.3), new THREE.Vector3(2.3, 1.7, GZ - 0.3)];
  function next() {
    if (S.over) return; if (S.n >= N) return end();
    S.Q = quiz(S.n % 3 === 2 ? 'mix' : 'math', 1 + Math.min(2, Math.floor(S.goals / 3))); draw(S.Q); S.busy = false;
    S.ask = askBar(api, S.Q, (ok, c) => shoot(S.Q.choices.indexOf(c), ok));
    hud.msg(`❓ ${S.Q.q} — chọn góc có đáp án đúng!`, 2600); info();
  }
  async function shoot(i, ok) {
    if (S.busy || S.over || i < 0) return; S.busy = true; hud.clearBar(); draw(S.Q, i); S.n++;
    await me.walkTo(-0.25, SPOT.z + 0.55, { speed: 4.2 }); if (!S.live) return; me.emote('use'); sfx('jump');
    const dive = ok ? pick([0, 1, 2].filter(k => k !== i)) : i, kx = [-1.9, 0, 1.9][dive], from = ball ? ball.position.clone() : SPOT.clone(), to = CORNER[i].clone();
    if (keeper) { keeper.walkTo(kx, GZ + 0.4, { speed: 9 }); keeper.emote(dive === 1 ? 'pickup' : 'hit'); }
    if (!ok) to.set(kx * 0.9, 1.1, GZ + 0.5);
    await tw(1 / PHI, k => { if (ball) { arc(ball, from, to, ok ? 0.8 : 0.5, k); ball.rotation.x -= 0.35; } });
    if (!S.live) return;
    if (ok) { S.goals++; S.streak++; const p = 10 * Math.min(S.streak, 3); S.score += p; sfx('ok'); cr.excite(1); me.emote('cheer'); hud.msg(`⚽ VÀOOO! ${S.Q.why} · +${p}${S.streak > 1 ? ` (chuỗi ×${Math.min(S.streak, 3)})` : ''}`, 2000);
      await tw(0.4, k => { if (ball) ball.position.z = to.z - k * 0.8, ball.position.y = to.y * (1 - k); }); }
    else { S.streak = 0; sfx('land'); me.emote('no'); if (keeper) keeper.say('Bắt được rồi!', 1500); hud.msg(`🧤 Thủ môn bắt gọn! ${S.Q.why}`, 2600);
      await tw(0.5, k => { if (ball) ball.position.set(to.x, 1.1 * (1 - k), to.z + k * 1.6); }); }
    info(); await tw(0.9, () => {}); if (!S.live) return;
    if (ball) ball.position.copy(SPOT).setY(0); if (keeper) keeper.place(0, GZ + 0.4, 0); me.place(-0.9, SPOT.z + 1.8, Math.PI); me.face(0, GZ);
    next();
  }
  function end() {
    S.over = true; hud.clearBar(); const b = S.goals >= 8 ? 30 : S.goals >= 5 ? 10 : 0; S.score += b;
    api.end({ score: S.score, title: S.goals >= 8 ? '🏆 Vua phạt đền!' : S.goals >= 5 ? '⚽ Sút tốt lắm!' : '💪 Tập thêm nhé!', text: `Ghi ${S.goals}/${N} bàn${b ? ` · thưởng +${b}` : ''}<br>Chấm phạt đền cách khung thành 11 m. Khung thành thật rộng 7,32 m, cao 2,44 m — sút vào góc cao là khó bắt nhất!` });
  }
  setTimeout(() => S.live && next(), 1200); info(); hud.msg('⚽ Sút phạt đền: trả lời đúng để <b>ghi bàn</b>!', 2400);
  return {
    tap(e) { if (S.busy || S.over || !S.ask || S.ask.done) return; const h = api.pick(e, [bd]); if (h && h.uv && h.uv.y < 0.55) S.ask.answer(Math.min(2, Math.floor(h.uv.x * 3))); },
    key(e) { if (S.ask && /^Digit[123]$/.test(e.code)) S.ask.answer(+e.code.slice(5) - 1); },
    update(dt) { tw.update(dt); cr.update(dt); },
    dispose() { S.live = false; S.over = true; tw.clear(); },
  };
}

export const shots = {
  football: { name: '⚽ Bóng đá mini', radius: 13, start: startFootball },
};
