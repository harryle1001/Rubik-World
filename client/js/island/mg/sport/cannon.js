// cannon.js — PHÁO NƯỚC BẮN BIA (khoá 'missile', cửa "Tàu hải quân / Hầm tên lửa"): đứng trên boong tàu, bắn bóng nước vào 3 tấm bia mang 3 đáp án.
// Chạm bia đúng (hoặc nút đáp án) → pháo xoay nòng, bóng nước bay parabol, trúng bia → tung bọt nước. Bia dời xa dần (13 → 21 → 34 m, Fibonacci).
// Thân thiện trẻ em: không vũ khí thật, chỉ là pháo nước như công viên nước. Model CC0: prop_cannon, target, prop_buoy_flag.
import * as THREE from 'three';
import { PHI, rnd, batch, textSprite } from './kit.js';
import { quiz, askBar } from '../quiz.js';
import { prop } from '../props.js';

const TIME = 55;
function startCannon(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx, list = [];
  const tw = (dur, fn) => new Promise(res => list.push({ t: 0, dur, fn, res }));
  // boong tàu (1 khối gộp) + mặt nước giả dưới bia
  { const b = batch(); b.box(8, 0.5, 6, 0, 0, 5, '#9b6b3e'); for (let i = 0; i < 9; i++) b.box(0.06, 0.02, 6, -4 + i, 0.5, 5, '#7a5230');
    for (const s of [-1, 1]) b.box(0.15, 0.9, 6, s * 4, 0.5, 5, '#e8e2d4'); b.box(8, 0.9, 0.15, 0, 0.5, 8, '#e8e2d4');
    b.add(new THREE.CircleGeometry(21, 34).rotateX(-Math.PI / 2), '#4fa3c9', 0, 0.04, -14); root.add(b.mesh()); }
  let gun = null; prop(root, 'prop_cannon', { size: 2.2, y: 0.5, z: 3.2, ry: Math.PI }).then(o => { if (o) gun = o; });
  me.place(1.6, 4.6, Math.PI); me.face(0, -10);
  // 3 bia trên phao: bia (model target) + nhãn đáp án
  const T = [-1, 0, 1].map(i => { const g = new THREE.Group(); root.add(g); prop(g, 'target', { size: 2.6, y: 0.9, ry: Math.PI / 2 }); prop(g, 'prop_buoy_flag', { size: 1.6, x: 1.6 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), api.mat('#e8e2d4')); pole.position.y = 0.6; g.add(pole);
    const lab = textSprite('?', { size: 1.1, w: 320, font: 'bold 72px system-ui' }); lab.position.y = 4.1; g.add(lab); return { g, lab, i: i + 1, x: i * 6.5, z: -13 }; });
  const water = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshBasicMaterial({ color: '#7fd3ff' })); water.visible = false; root.add(water);
  const splash = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#dff6ff', transparent: true, opacity: 0.8 })); splash.visible = false; root.add(splash);
  const qLab = textSprite('', { size: 1.3, w: 640, font: 'bold 60px system-ui', bg: 'rgba(27,22,38,.9)', color: '#ffd36e' }); qLab.position.set(0, 5.6, -15); root.add(qLab);
  api.cam.x = 0; api.cam.y = 1.5; api.cam.z = -4; api.cam.yaw = 0.15; api.cam.pitch = 0.45; api.cam.dist = innerWidth < innerHeight ? 23 : 17;
  const S = { t: TIME, score: 0, hit: 0, n: 0, streak: 0, busy: false, over: false, live: true, Q: null, ask: null, dist: 13 };
  const info = () => { hud.info(`🎯 ${S.hit}/${S.n} · bia ${S.dist} m`); hud.score(S.score); };
  function layout() { T.forEach((t, k) => { t.z = -S.dist + rnd(-1.5, 1.5); t.x = (k - 1) * (innerWidth < innerHeight ? 4.4 : 5.5) + rnd(-0.4, 0.4); t.g.position.set(t.x, 0, t.z); t.g.rotation.y = 0; }); }
  function next() {
    if (S.over) return; S.dist = S.hit >= 6 ? 34 : S.hit >= 3 ? 21 : 13; layout();
    S.Q = quiz(S.n % 3 === 2 ? 'mix' : 'math', 1 + Math.min(2, Math.floor(S.hit / 3))); qLab.userData.set(S.Q.q); qLab.position.z = -S.dist - 2;
    S.Q.choices.forEach((c, i) => T[i].lab.userData.set(c)); S.busy = false; info();
    S.ask = askBar(api, S.Q, (ok, c) => fire(S.Q.choices.indexOf(c), ok));
  }
  async function fire(i, ok) {
    if (S.busy || S.over || i < 0) return; S.busy = true; hud.clearBar(); S.n++;
    const t = T[i], muzzle = new THREE.Vector3(0, 1.6, 2.2), to = new THREE.Vector3(t.x, 2.1, t.z + 0.1), yaw = Math.atan2(t.x, -(t.z - 3.2));
    if (gun) await tw(0.25, k => { gun.rotation.y = Math.PI - yaw * k; }); me.emote('use'); sfx('kick');
    water.visible = true; const d = muzzle.distanceTo(to), h = d * 0.25;
    await tw(0.5 + d / 34, k => { water.position.set(muzzle.x + (to.x - muzzle.x) * k, muzzle.y + (to.y - muzzle.y) * k + Math.sin(Math.PI * k) * h, muzzle.z + (to.z - muzzle.z) * k); });
    if (!S.live) return; water.visible = false; splash.visible = true; splash.position.copy(to); sfx('splash');
    tw(0.6, k => { splash.scale.setScalar(0.3 + k * 1.6); splash.material.opacity = 0.8 * (1 - k); }).then(() => splash.visible = false);
    if (ok) { S.hit++; S.streak++; const p = 10 * Math.min(S.streak, 3) + (S.dist > 13 ? 5 : 0); S.score += p; sfx('ok'); me.emote('cheer'); hud.msg(`🎯 Trúng! ${S.Q.why} · +${p}`, 1800); await tw(0.6, k => { t.g.rotation.y = k * Math.PI * 2; }); }
    else { S.streak = 0; sfx('land'); me.emote('no'); hud.msg(`💦 Trượt rồi! ${S.Q.why}`, 2400); await tw(0.9, () => {}); }
    if (!S.live) return; info(); next();
  }
  function end() {
    S.over = true; hud.clearBar(); hud.time(0);
    api.end({ score: S.score, title: S.hit >= 8 ? '🏆 Xạ thủ pháo nước!' : '🎯 Hết giờ!', text: `Trúng ${S.hit}/${S.n} bia<br>Bóng nước bay theo đường cong parabol vì trọng lực kéo xuống. Không có gió, bắn chếch 45° thì bay xa nhất!` });
  }
  hud.msg('🎯 Chạm vào <b>bia có đáp án đúng</b> để bắn bóng nước!', 2600); info(); setTimeout(() => S.live && next(), 1000);
  return {
    tap(e) { if (S.busy || S.over || !S.ask) return; const h = api.pick(e, T.map(t => t.g)); if (!h) return; for (let o = h.object; o; o = o.parent) { const k = T.findIndex(t => t.g === o); if (k >= 0) return S.ask.answer(k); } },
    key(e) { if (S.ask && /^Digit[123]$/.test(e.code)) S.ask.answer(+e.code.slice(5) - 1); },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) { const w = list[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.fn(k); if (k >= 1) { list.splice(i, 1); w.res(); } }
      if (S.over) return; S.t -= dt; hud.time(Math.max(0, S.t)); if (S.t <= 0 && !S.busy) end();
    },
    dispose() { S.live = false; S.over = true; list.length = 0; },
  };
}
export const cannon = { missile: { name: '🎯 Pháo nước bắn bia', radius: 21, start: startCannon } };
