// shots.js — Trò "trả lời để sút/ném" chơi ngay trong thế giới (mg/host.js), dùng model CC0 có sẵn (sport_goal, sport_hoop, bóng).
//   ⚽ football  : sút phạt đền 11 m — bảng trên khung thành có 3 đáp án ứng với 3 góc; chọn đúng → thủ môn bay nhầm hướng, VÀO!
//   🏀 basketball: trả lời đúng mới được 1 quả bóng, rồi canh lực ném (thanh lực chạy qua lại, bấm khi ở vùng xanh).
// Tỷ lệ vàng: sân 21 m (Fibonacci), bóng bay 1/φ s, 10 quả / 55 s.
import * as THREE from 'three';
import { PHI, rnd, pick, batch, crowd } from './kit.js';
import { quiz, askBar, board } from '../quiz.js';
import { prop, tweens } from '../props.js';

const arc = (o, a, b, h, k) => o.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + Math.sin(Math.PI * k) * h, a.z + (b.z - a.z) * k);

// ======================= ⚽ BÓNG ĐÁ: SÚT PHẠT ĐỀN =======================
function startFootball(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx, tw = tweens(), GZ = -8, SPOT = new THREE.Vector3(0, 0.21, GZ + 11), N = 10;
  // sân cỏ sọc + vạch vôi (1 khối gộp)
  { const b = batch(); for (let i = 0; i < 8; i++) b.add(new THREE.PlaneGeometry(21, 21 / 8).rotateX(-Math.PI / 2), i % 2 ? '#5fae4e' : '#69b956', 0, 0.03, -10.5 + (i + 0.5) * 21 / 8 + 2.5);
    const W = (w, d, x, z) => b.add(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), '#f4f4ee', x, 0.045, z);
    W(16.5, 0.12, 0, GZ); W(0.12, 5.5, -8.25, GZ + 2.75); W(0.12, 5.5, 8.25, GZ + 2.75); W(16.5, 0.12, 0, GZ + 5.5); b.add(new THREE.CircleGeometry(0.15, 10).rotateX(-Math.PI / 2), '#f4f4ee', 0, 0.05, SPOT.z);
    root.add(b.mesh()); }
  prop(root, 'sport_goal', { size: 7.3, z: GZ + 0.16 });   // model 5 × 1,3 m → ×1,46: rộng 7,3 m, xà ngang 1,86 m
  const cr = crowd(root, { z: GZ - 4.5, len: 13, rows: 3 });
  const { mesh: bd, draw } = board(6.4); bd.position.set(0, 3.2, GZ - 0.8); root.add(bd);
  let ball = null; prop(root, 'sport_ball_soccer', { size: 0.42 }).then(o => { if (!o) return; ball = o; ball.position.copy(SPOT).setY(0); });
  let keeper = null; api.actor('student-male-c', { name: 'Thủ môn', look: { role: 'student', shirt: '#f2b134', pants: '#2a2f4a' } }).then(a => { if (!a) return; keeper = a; a.place(0, GZ + 0.4, 0); a.say('Sút đi, thầy bắt hết!', 2200); });
  me.place(-0.9, SPOT.z + 1.8, Math.PI); me.face(0, GZ);
  api.cam.x = 0; api.cam.y = 1.2; api.cam.z = GZ + 7.5; api.cam.yaw = 0; api.cam.pitch = 0.4; api.cam.dist = innerWidth < innerHeight ? 13 : 12;
  const S = { n: 0, goals: 0, streak: 0, score: 0, busy: false, Q: null, ask: null, over: false, live: true };
  const info = () => { hud.info(`⚽ ${S.goals}/${S.n} · còn ${N - S.n}`); hud.score(S.score); };
  const CORNER = [new THREE.Vector3(-2.5, 1.35, GZ - 0.4), new THREE.Vector3(0, 1.55, GZ - 0.4), new THREE.Vector3(2.5, 1.35, GZ - 0.4)];
  function next() {
    if (S.over) return; if (S.n >= N) return end();
    S.Q = quiz(S.n % 3 === 2 ? 'mix' : 'math', 1 + Math.min(2, Math.floor(S.goals / 3))); draw(S.Q); S.busy = false;
    S.ask = askBar(api, S.Q, (ok, c) => shoot(S.Q.choices.indexOf(c), ok));
    hud.msg(`❓ ${S.Q.q} — chọn góc có đáp án đúng!`, 2600); info();
  }
  async function shoot(i, ok) {
    if (S.busy || S.over || i < 0) return; S.busy = true; hud.clearBar(); draw(S.Q, i); S.n++;
    await me.walkTo(-0.25, SPOT.z + 0.55, { speed: 4.2 }); if (!S.live) return; me.emote('use'); sfx('jump');
    const dive = ok ? pick([0, 1, 2].filter(k => k !== i)) : i, kx = [-2.1, 0, 2.1][dive], from = ball ? ball.position.clone() : SPOT.clone(), to = CORNER[i].clone();
    if (keeper) { keeper.walkTo(kx, GZ + 0.4, { speed: 9 }); keeper.emote(dive === 1 ? 'pickup' : 'hit'); }
    if (!ok) to.set(kx * 0.9, 1.0, GZ + 0.6);
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

// ======================= 🏀 BÓNG RỔ: TRẢ LỜI ĐỂ CÓ BÓNG, CANH LỰC ĐỂ NÉM =======================
function startBasketball(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx, tw = tweens(), HZ = -4.5, RIM = new THREE.Vector3(0, 3.05, HZ + 0.28), TIME = 55;
  // sân gỗ + vạch (1 khối gộp): vạch 3 điểm bán kính 6,75 m, vùng cấm 4,9 × 5,8 m
  { const b = batch(); for (let i = 0; i < 13; i++) b.add(new THREE.PlaneGeometry(1, 15).rotateX(-Math.PI / 2), i % 2 ? '#d9a466' : '#cf9a5c', -6.5 + i + 0.5, 0.03, HZ + 7);
    const W = (g, x, z) => b.add(g.rotateX(-Math.PI / 2), '#fbf6ea', x, 0.045, z);
    W(new THREE.RingGeometry(6.69, 6.81, 34, 1, Math.PI, Math.PI), 0, RIM.z); W(new THREE.PlaneGeometry(4.9, 0.1), 0, RIM.z + 5.8 - 0.3); W(new THREE.PlaneGeometry(0.1, 5.8), -2.45, RIM.z + 2.6); W(new THREE.PlaneGeometry(0.1, 5.8), 2.45, RIM.z + 2.6);
    root.add(b.mesh()); }
  prop(root, 'sport_hoop', { size: 3.82, fit: 'h', z: HZ, ry: Math.PI });   // model đúng kích thước thật: vành rổ cao 3,05 m
  const { mesh: bd, draw } = board(4.2); bd.position.set(0, 4.75, HZ - 0.4); root.add(bd);
  let ball = null; prop(root, 'sport_ball_basket', { size: 0.24 }).then(o => { if (o) { ball = o; ball.visible = false; } });
  const SPOTS = [[0, 3.2, 2], [-3.2, 3.6, 2], [3.2, 3.6, 2], [0, 7.2, 3], [-5.2, 5.4, 3], [5.2, 5.4, 3]];
  const S = { t: TIME, score: 0, made: 0, tries: 0, balls: 0, phase: 'ask', spot: 0, p: 0, ph: 0, over: false, live: true, ask: null, Q: null };
  const sp = () => SPOTS[S.spot], pos = () => [sp()[0], RIM.z + sp()[1]];
  me.place(...pos(), Math.PI); me.face(RIM.x, RIM.z);
  api.cam.x = 0; api.cam.y = 1.8; api.cam.z = RIM.z + 3.4; api.cam.yaw = 0; api.cam.pitch = 0.3; api.cam.dist = innerWidth < innerHeight ? 11 : 9.5;
  const info = () => { hud.info(`🏀 ${S.made}/${S.tries} · bóng ${S.balls}`); hud.score(S.score); };
  function ask() {
    if (S.over) return; S.phase = 'ask'; S.Q = quiz(S.tries % 3 === 2 ? 'mix' : 'math', 1 + Math.min(2, Math.floor(S.made / 3))); draw(S.Q);
    S.ask = askBar(api, S.Q, ok => { if (ok) { S.balls++; sfx('ok'); hud.msg(`✅ ${S.Q.why} · Được 1 quả bóng! Canh lực rồi bấm <b>Ném</b>`, 2200); aim(); } else { sfx('land'); me.emote('no'); hud.msg(`❌ ${S.Q.why}`, 2200); setTimeout(() => S.live && ask(), 900); } info(); });
  }
  let meter = null;
  function aim() {
    S.phase = 'aim'; S.ph = Math.random() * 6; hud.clearBar(); if (ball) { ball.visible = true; ball.position.set(me.pos.x + 0.25, 1.35, me.pos.z - 0.3); }
    const z = sp()[2] === 3 ? 0.13 : 0.21; S.zone = z;
    meter = document.createElement('div'); meter.style.cssText = 'position:relative;width:min(70vw,233px);height:34px;border-radius:17px;background:#1b1626d0;border:2px solid #fff8;overflow:hidden;pointer-events:none';
    meter.innerHTML = `<i style="position:absolute;left:${(0.5 - z / 2) * 100}%;width:${z * 100}%;top:0;bottom:0;background:#3fa36b"></i><b style="position:absolute;top:2px;bottom:2px;width:6px;margin-left:-3px;border-radius:3px;background:#ffd36e;left:50%"></b>`;
    hud.bar.appendChild(meter); hud.button('🏀 Ném!', throwBall, 'on');
  }
  async function throwBall() {
    if (S.phase !== 'aim' || S.over) return; S.phase = 'fly'; hud.clearBar(); meter = null; S.balls--; S.tries++;
    const off = S.p - 0.5, ok = Math.abs(off) <= S.zone / 2, pts = sp()[2];
    me.emote('use'); sfx('jump');
    const from = ball ? ball.position.clone() : new THREE.Vector3(), to = RIM.clone(); if (!ok) to.x += Math.sign(off || 1) * 0.32, to.z += 0.05;
    await tw(1 / PHI + sp()[1] * 0.03, k => { if (ball) { arc(ball, from, to, 1.6 + sp()[1] * 0.12, k); ball.rotation.x -= 0.25; } });
    if (!S.live) return;
    if (ok) { S.made++; S.score += pts * 5; sfx('ok'); me.emote('cheer'); hud.msg(`🏀 VÀO RỔ! +${pts} điểm${pts === 3 ? ' (ngoài vạch 6,75 m)' : ''}`, 1600);
      await tw(0.4, k => { if (ball) ball.position.set(RIM.x, RIM.y - k * 2.6, RIM.z); }); }
    else { sfx('land'); hud.msg(off < 0 ? '😅 Hơi nhẹ tay — bóng bật vành!' : '😅 Mạnh quá — bóng bật bảng!', 1600);
      const d = Math.sign(off || 1); await tw(0.6, k => { if (ball) ball.position.set(to.x + d * k * 1.8, RIM.y + Math.sin(Math.PI * k) * 0.8 - k * 2.4, to.z + k * 1.4); }); }
    if (!S.live) return; if (ball) ball.visible = false; info();
    S.spot = (S.spot + 1 + Math.floor(Math.random() * (SPOTS.length - 1))) % SPOTS.length; await me.walkTo(...pos(), { speed: 4 }); if (!S.live) return; me.face(RIM.x, RIM.z);
    if (S.balls > 0) aim(); else ask();
  }
  function end() {
    S.over = true; hud.clearBar(); hud.time(0);
    api.end({ score: S.score, title: S.made >= 6 ? '🏆 Xạ thủ bóng rổ!' : '🏀 Hết giờ!', text: `Ném vào ${S.made}/${S.tries} quả<br>Vành rổ cao 3,05 m. Ném từ ngoài vạch 6,75 m được 3 điểm. Bí quyết: khuỵu gối, đẩy bóng bằng cả chân lẫn tay!` });
  }
  hud.msg('🏀 Trả lời đúng để <b>có bóng</b>, rồi canh vạch vàng vào vùng xanh và bấm <b>Ném</b>!', 3200); info(); setTimeout(() => S.live && ask(), 1400);
  return {
    tap(e) { if (S.phase === 'aim') return throwBall(); if (S.phase === 'ask' && S.ask && !S.ask.done) { const h = api.pick(e, [bd]); if (h && h.uv && h.uv.y < 0.55) S.ask.answer(Math.min(2, Math.floor(h.uv.x * 3))); } },
    key(e) { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); throwBall(); } else if (S.ask && /^Digit[123]$/.test(e.code)) S.ask.answer(+e.code.slice(5) - 1); },
    update(dt) {
      tw.update(dt); if (S.over) return;
      S.t -= dt; hud.time(Math.max(0, S.t)); if (S.t <= 0 && S.phase !== 'fly') return end();
      if (S.phase === 'aim') { S.ph += dt * (sp()[2] === 3 ? 3.4 : 2.6); S.p = (Math.sin(S.ph) + 1) / 2; if (meter) meter.lastChild.style.left = (S.p * 100).toFixed(1) + '%'; }
    },
    dispose() { S.live = false; S.over = true; tw.clear(); },
  };
}

export const shots = {
  football: { name: '⚽ Bóng đá mini', radius: 13, start: startFootball },
  basketball: { name: '🏀 Bóng rổ tính nhẩm', radius: 13, start: startBasketball },
};
