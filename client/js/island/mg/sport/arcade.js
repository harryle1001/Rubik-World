// arcade.js — PHÒNG ARCADE 3D (khoá 'arcade', cửa "Game 2 người / Đấu online"): chơi ngay trong thế giới qua khung mg/host.js.
//   🏀 Ném rổ phép tính: 3 rổ cao 3,05 m mang 3 đáp án — chạm rổ đúng để ném (bóng bay parabol thật), chuỗi đúng nhân điểm.
//   🔨 Đập khối số: 3 × 3 khối Rubik trồi lên mang số — chỉ đập số theo luật (chẵn, bội của 3, số nguyên tố); luật đổi sau mỗi 13 giây.
// Bạn Nam (NPC) đấu cùng: điểm của bạn ấy tăng dần để có cảm giác thi đấu 2 người, không cần mạng (an toàn cho trẻ em).
// Tỷ lệ vàng: khu chơi bán kính 8 m, rổ cách nhau φ³ ≈ 4,2 m, lượt 55 s / 34 s (Fibonacci), khối cách nhau φ² ≈ 2,6 m, bóng bay 0,618 s.
import * as THREE from 'three';
import { PHI, rnd, pick, mathQ, textSprite } from './kit.js';

const RIM = 3.05, GAP = PHI ** 3, ROUND = { hoop: 55, whack: 34 };
const RULES = [
  { t: 'số CHẴN', f: n => n % 2 === 0, why: n => `${n} chia 2 dư 1 → số lẻ` },
  { t: 'BỘI của 3', f: n => n % 3 === 0, why: n => `${n} không chia hết cho 3` },
  { t: 'số NGUYÊN TỐ', f: n => n > 1 && [2, 3, 5, 7].every(p => n === p || n % p), why: n => n < 2 ? `${n} không phải số nguyên tố` : `${n} = ${[2, 3, 5, 7].find(p => n % p === 0)} × ${n / [2, 3, 5, 7].find(p => n % p === 0)}` },
  { t: 'số > 50', f: n => n > 50, why: n => `${n} ≤ 50` },
];
for (const r of RULES) r.ok = Array.from({ length: 99 }, (_, i) => i + 1).filter(r.f);   // tính sẵn 1 lần (trước: tạo mảng 99 số mỗi lần khối trồi lên)

function startArcade(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat, sfx = api.sfx;
  const disposers = [];
  // ---------- Sàn arcade: thảm tròn + viền đèn (π: đèn xếp đều quanh vòng) ----------
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 0.12, 34), M('#b97a46')); floor.position.y = 0.06; floor.receiveShadow = true; root.add(floor);
  const ring = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd36e' }), 34); root.add(ring);
  { const o = new THREE.Object3D(); for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2; o.position.set(Math.cos(a) * 8.2, 0.2, Math.sin(a) * 8.2); o.updateMatrix(); ring.setMatrixAt(i, o.matrix); } }
  let secShown = -1, mode = null, G = null, score = 0, foe = 0, t = 0, over = false, combo = 0;
  const group = new THREE.Group(); root.add(group);
  const clearMode = () => { for (const o of [...group.children]) { group.remove(o); o.traverse(m => { if (m.geometry && !m.geometry.userData.shared) m.geometry.dispose(); if (m.material && !m.material.userData.shared) { m.material.map && m.material.map.dispose(); m.material.dispose(); } }); } };
  const tweens = []; const tween = (dur, fn) => new Promise(res => tweens.push({ t: 0, dur, fn, res }));

  // ---------- Nhân vật ----------
  me.place(0, 3.8, Math.PI); me.face(0, -6);
  let nam = null;
  api.actor('student-male-b', { name: 'Nam', look: { role: 'student', shirt: '#3d8fd9', pants: '#2a2f4a' } }).then(a => { if (!a) return; nam = a; a.place(-2.6, 3.8, Math.PI); a.face(0, -6); a.say('Thi xem ai giỏi tính nhẩm hơn nhé!', 3000); });
  const foeTick = dt => { if (!G || over) return; G.foeT -= dt; if (G.foeT <= 0) { G.foeT = rnd(2.6, 4.2); foe += mode === 'hoop' ? 10 : 5; if (nam && Math.random() < 0.3) nam.emote('cheer'); showScore(); } };
  const showScore = () => hud.score(`${score} · Nam ${foe}`);
  api.cam.x = 0; api.cam.y = 1.6; api.cam.z = -1; api.cam.yaw = 0; api.cam.pitch = 0.42; api.cam.dist = innerWidth < innerHeight ? 17 : 15;

  // ---------- 🏀 NÉM RỔ PHÉP TÍNH ----------
  function setupHoop() {
    const hoops = [-1, 0, 1].map(i => {
      const g = new THREE.Group(); g.position.set(i * GAP, 0, -5.5); group.add(g);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, RIM + 0.9, 8), M('#5d6b7d')); pole.position.set(0, (RIM + 0.9) / 2, -0.7); g.add(pole);
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.08), M('#f4f1ea')); board.position.set(0, RIM + 0.45, -0.5); board.castShadow = true; g.add(board);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.025, 6, 16).rotateX(Math.PI / 2), M('#e8622c')); rim.position.set(0, RIM, -0.18); g.add(rim);
      const net = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.15, 0.4, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.7 })); net.position.set(0, RIM - 0.2, -0.18); g.add(net);
      const lab = textSprite('?', { size: 0.9, font: 'bold 80px system-ui' }); lab.position.set(0, RIM + 1.55, -0.5); g.add(lab);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 1.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(0, RIM + 0.2, -0.3); hit.userData.i = i + 1; g.add(hit);
      return { g, rim, lab, hit, net };
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12 * PHI, 14, 10), M('#e8762c')); ball.castShadow = true; group.add(ball);
    const qLab = textSprite('', { size: 1.3, font: 'bold 72px system-ui', w: 512, bg: 'rgba(27,22,38,.85)', color: '#ffd36e' }); qLab.position.set(0, RIM + 3.1, -6); group.add(qLab);
    G = { hoops, ball, qLab, q: null, busy: false, foeT: 3, level: 1 };
    const rest = () => ball.position.set(0.45, 1.25, 3.4);
    rest(); G.rest = rest;
    nextQ();
  }
  function nextQ() {
    G.level = 1 + Math.min(2, Math.floor(score / 60));
    G.q = mathQ(G.level); G.q.choices.forEach((c, i) => G.hoops[i].lab.userData.set(String(c)));
    G.qLab.userData.set(`${G.q.q} = ?`); G.busy = false;
  }
  async function shoot(i) {
    if (G.busy || over) return; G.busy = true;
    const h = G.hoops[i], ok = G.q.choices[i] === G.q.a, b = G.ball, from = b.position.clone(), to = new THREE.Vector3(h.g.position.x, RIM + 0.05, -5.68);
    me.emote('use'); sfx('jump');
    const peak = RIM + 2.4, dur = 1 / PHI;
    await tween(dur, k => { b.position.set(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k + Math.sin(Math.PI * k) * (peak - Math.max(from.y, to.y)), from.z + (to.z - from.z) * k); b.rotation.x -= 0.3; });
    if (ok) {
      combo++; const pts = 10 * Math.min(combo, 5); score += pts; showScore(); sfx(combo > 2 ? 'coin' : 'ok'); me.emote('cheer');
      hud.msg(`✅ ${G.q.q} = <b>${G.q.a}</b> · +${pts}${combo > 1 ? ` (chuỗi ×${Math.min(combo, 5)})` : ''}`, 1600);
      await tween(0.35, k => { b.position.y = RIM - k * 1.2; h.net.scale.y = 1 + Math.sin(Math.PI * k) * 0.4; });
    } else {
      combo = 0; sfx('bad'); me.emote('no');
      hud.msg(`❌ ${G.q.q} = <b>${G.q.a}</b>, không phải ${G.q.choices[i]}`, 2200);
      const v = new THREE.Vector3(rnd(-1, 1), 0, 1.6); await tween(0.5, k => { b.position.set(to.x + v.x * k, RIM + Math.sin(Math.PI * k) * 0.8 - k * 1.6, to.z + v.z * k); });
    }
    G.rest(); nextQ();
  }

  // ---------- 🔨 ĐẬP KHỐI SỐ ----------
  const RUBIK = ['#e8453c', '#3d8fd9', '#3fa36b', '#f2b134', '#ff8a3d', '#f4f1ea'];
  function setupWhack() {
    const S = PHI * PHI, cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = (c - 1) * S, z = (r - 1) * S - 1.6;
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.3, 16), M('#3a3150')); pad.position.set(x, 0.15, z); group.add(pad);
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), M(RUBIK[(r * 3 + c) % 6])); cube.castShadow = true; cube.position.set(x, -0.7, z); cube.userData.i = cells.length; group.add(cube);
      const lab = textSprite('', { size: 0.8, font: 'bold 84px system-ui', w: 128, h: 128, bg: 'rgba(27,22,38,.82)' }); lab.visible = false; group.add(lab);
      cells.push({ x, z, cube, lab, n: 0, up: 0, life: 0, hit: false });
    }
    const ruleLab = textSprite('', { size: 1.2, font: 'bold 64px system-ui', w: 640, bg: 'rgba(27,22,38,.88)', color: '#ffd36e' }); ruleLab.position.set(0, 4.2, -5.5); group.add(ruleLab);
    G = { cells, ruleLab, rule: null, ruleT: 0, spawnT: 0.6, foeT: 3 };
    newRule();
  }
  function newRule() {
    const prev = G.rule; do G.rule = pick(RULES); while (G.rule === prev);
    G.ruleT = 13; G.ruleLab.userData.set(`🔨 Đập ${G.rule.t}`); hud.msg(`Luật mới: chỉ đập <b>${G.rule.t}</b>!`, 2000); sfx('ui');
  }
  function whackUpdate(dt) {
    if ((G.ruleT -= dt) <= 0) newRule();
    if ((G.spawnT -= dt) <= 0) {
      G.spawnT = rnd(0.45, 0.9) / (1 + score / 200);
      const free = G.cells.filter(c => c.up <= 0.01 && c.life <= 0); if (free.length) {
        const c = pick(free); c.n = Math.random() < 0.5 ? pick(G.rule.ok) : Math.floor(rnd(1, 100));
        c.life = rnd(1.4, 2.2); c.hit = false; c.lab.userData.set(String(c.n)); c.lab.visible = true;
      }
    }
    for (const c of G.cells) {
      c.life -= dt; const want = c.life > 0 && !c.hit ? 1 : 0; c.up += (want - c.up) * (1 - Math.exp(-dt * 13));
      c.cube.position.y = -0.7 + c.up * 1.35; c.cube.rotation.y += c.hit ? dt * 13 : 0;
      c.lab.position.set(c.x, c.cube.position.y + 1.15, c.z); c.lab.visible = c.up > 0.3;
    }
  }
  function whack(i) {
    const c = G.cells[i]; if (!c || c.hit || c.up < 0.5 || over) return;
    c.hit = true; c.life = 0.25;
    if (G.rule.f(c.n)) { combo++; const pts = 5 * Math.min(combo, 5); score += pts; showScore(); sfx('ok'); hud.msg(`✅ ${c.n} đúng là ${G.rule.t} · +${pts}`, 1100); }
    else { combo = 0; score = Math.max(0, score - 3); showScore(); sfx('bad'); hud.msg(`❌ ${G.rule.why(c.n)} · −3`, 1800); me.emote('no'); }
  }

  // ---------- Chọn trò / kết thúc ----------
  function begin(m) {
    clearMode(); mode = m; score = 0; foe = 0; combo = 0; over = false; t = ROUND[m]; tweens.length = 0;
    hud.clearBar(); bar();
    if (m === 'hoop') { setupHoop(); hud.msg('Chạm vào <b>rổ</b> có đáp án đúng để ném bóng!', 3500); }
    else { setupWhack(); }
    showScore(); if (nam) nam.say(m === 'hoop' ? 'Ném nào!' : 'Đập nhanh lên!', 1600);
  }
  function finish() {
    over = true; const win = score >= foe;
    if (win) me.emote('cheer'); else if (nam) nam.emote('cheer');
    api.end({ score, title: win ? '🏆 Bạn thắng Nam!' : '😅 Nam thắng sát nút', text: (mode === 'hoop' ? 'Tính nhẩm nhanh giúp em học Toán tốt hơn: thuộc bảng cửu chương là “vũ khí bí mật”!' : 'Số nguyên tố chỉ chia hết cho 1 và chính nó: 2, 3, 5, 7, 11, 13… Số 2 là số nguyên tố chẵn duy nhất!') + `<br>Bạn ${score} · Nam ${foe}` });
  }
  function bar() {
    hud.clearBar();
    [['hoop', '🏀 Ném rổ phép tính'], ['whack', '🔨 Đập khối số']].forEach(([m, l]) => { const b = hud.button(l, () => begin(m)); b.classList.toggle('on', mode === m); });
  }
  bar(); hud.msg('Chọn trò chơi ở dưới: <b>Ném rổ</b> hoặc <b>Đập khối số</b>', 0);

  const objs = () => mode === 'hoop' ? G.hoops.map(h => h.hit) : G.cells.map(c => c.cube);
  return {
    tap(e) {
      if (!G || over) return; const h = api.pick(e, objs()); if (!h) return;
      if (mode === 'hoop') shoot(h.object.userData.i); else whack(h.object.userData.i);
    },
    key(e) { if (!G || over || mode !== 'hoop') return; const i = { Digit1: 0, Digit2: 1, Digit3: 2, ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2 }[e.code]; if (i != null) shoot(i); },
    update(dt) {
      for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.fn(k); if (k >= 1) { tweens.splice(i, 1); w.res(); } }
      if (!G || over) return;
      t -= dt; if ((Math.max(0, t) | 0) !== secShown) hud.time(secShown = Math.max(0, t) | 0); foeTick(dt);
      if (mode === 'whack') whackUpdate(dt);
      if (t <= 0) finish();
    },
    dispose() { over = true; tweens.length = 0; disposers.forEach(f => f()); },
  };
}

export const arcade = {
  arcade: { name: '🕹️ Phòng Arcade', radius: 8, start: startArcade },
};
