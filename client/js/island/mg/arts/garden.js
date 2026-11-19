// garden.js — KHU VƯỜN CỦA EM (khoá 'garden', cửa "Khu vườn mở bán"): 9 luống rau ngay trong thế giới, model CC0 farm_* (Kenney/Quaternius).
// Luống sáng vòng vàng là luống cần chăm → em đi tới, trả lời câu hỏi về cây: đúng → tưới nước / bón phân, cây lớn 1 bậc (3 bậc thì thu hoạch).
// 89 giây (Fibonacci): thu hoạch được càng nhiều càng giỏi. Kiến thức: rễ, lá, quang hợp, nảy mầm, thụ phấn.
import * as THREE from 'three';
import { PHI, batch, pick, rnd } from '../sport/kit.js';
import { askBar } from '../quiz.js';
import { prop, tweens } from '../props.js';

const TIME = 89, GAP = PHI * PHI;
const SEEDS = [{ n: 'cà rốt', m: 'farm_carrot', h: 1.3 }, { n: 'bí ngô', m: 'farm_pumpkin', h: 1.1 }, { n: 'ngô', m: 'farm_corn', h: 2.1 }, { n: 'lúa mì', m: 'farm_wheat', h: 1.6 }];
const T = (q, a, w1, w2, why) => ({ q, a, w: [w1, w2], why });
const QS = [
  T('Rễ cây có nhiệm vụ gì?', 'hút nước', 'làm hoa', 'bắt sâu', 'Rễ hút nước và chất khoáng từ đất nuôi cây.'),
  T('Lá cây xanh nhờ chất gì?', 'diệp lục', 'muối', 'đường', 'Diệp lục giúp lá hấp thụ ánh sáng để quang hợp.'),
  T('Cây cần gì để quang hợp?', 'ánh sáng', 'bóng tối', 'tiếng nhạc', 'Cây dùng ánh sáng + nước + khí CO₂ để tạo chất dinh dưỡng.'),
  T('Cà rốt ta ăn phần nào?', 'rễ củ', 'lá', 'hoa', 'Củ cà rốt là phần rễ phình to chứa chất dinh dưỡng.'),
  T('Hạt nảy mầm cần gì?', 'nước và độ ấm', 'nước đá', 'bóng tối hoàn toàn', 'Hạt cần nước, không khí và nhiệt độ ấm vừa phải để nảy mầm.'),
  T('Con vật nào giúp hoa thụ phấn?', 'con ong', 'con cá', 'con giun', 'Ong bay từ hoa này sang hoa khác mang theo phấn hoa.'),
  T('Bón phân giúp cây…?', 'thêm chất dinh dưỡng', 'bớt nước', 'đổi màu', 'Phân bón cung cấp đạm, lân, kali giúp cây lớn nhanh.'),
  T('Ban ngày lá cây nhả ra khí gì?', 'ô-xy', 'khói', 'hơi muối', 'Quang hợp nhả khí ô-xy — trồng cây giúp không khí trong lành.'),
  T('Tưới cây lúc nào tốt nhất?', 'sáng sớm', 'giữa trưa nắng gắt', 'nửa đêm', 'Sáng sớm trời mát, nước ít bay hơi, cây hút được nhiều.'),
  T('Bí ngô là phần nào của cây?', 'quả', 'rễ', 'thân', 'Bí ngô là quả, bên trong có nhiều hạt.'),
  T('Giun đất có ích vì…?', 'làm đất tơi xốp', 'ăn lá non', 'làm hỏng rễ', 'Giun đào đất giúp không khí và nước thấm xuống rễ.'),
  T('Cây ngô cao nhờ bộ phận nào lớn lên?', 'thân', 'hạt', 'râu ngô', 'Thân cây vươn cao đưa lá ra ánh sáng.'),
];
export function startGarden(ctx, { api }) {
  const { root, hud, me } = api, sfx = api.sfx, tw = tweens();
  // nền đất vườn + 9 luống (1 khối gộp) + hàng rào (kit, instancing)
  { const b = batch(); b.add(new THREE.CircleGeometry(7.6, 34).rotateX(-Math.PI / 2), '#8bbf5e', 0, 0.03, -1);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) b.box(2, 0.24, 2, (c - 1) * GAP, 0, (r - 1) * GAP - 1, '#6b4426');
    b.box(0.9, 0.05, 2.6, 0, 0, 3.4, '#c9b48a'); root.add(b.mesh()); }
  prop(root, 'prop_signpost', { size: 2.2, x: -1.6, z: 3.6, shadow: false }); prop(root, 'farm_hay_bale', { size: 1.2, x: 5.4, z: 1.8, ry: 0.4, shadow: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.45, 34).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd36e', transparent: true, opacity: 0.9 })); ring.position.y = 0.3; root.add(ring);
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: '#7fd3ff' }), 21); drops.count = 0; drops.frustumCulled = false; root.add(drops);
  const P = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) P.push({ x: (c - 1) * GAP, z: (r - 1) * GAP - 1, g: null, seed: null, st: 0 });
  const plant = (p, seed) => { if (p.g) { root.remove(p.g); } p.seed = seed; p.st = 0; p.g = new THREE.Group(); p.g.position.set(p.x, 0.24, p.z); p.g.scale.setScalar(0.45); root.add(p.g); prop(p.g, seed.m, { size: seed.h, fit: 'h', shadow: false, ry: rnd(0, 6) }); };
  P.forEach(p => plant(p, pick(SEEDS)));
  me.place(0, 4.2, Math.PI);
  api.cam.x = 0; api.cam.y = 0.6; api.cam.z = -0.4; api.cam.yaw = 0; api.cam.pitch = 0.62; api.cam.dist = innerWidth < innerHeight ? 14.5 : 11.5;
  const S = { t: TIME, score: 0, right: 0, wrong: 0, harvest: 0, cur: -1, busy: false, over: false, live: true, ask: null, used: [] };
  const info = () => { hud.info(`🧺 ${S.harvest} lần thu hoạch`); hud.score(S.score); };
  async function next() {
    if (S.over) return; S.busy = true;
    let i; do i = Math.floor(rnd(0, 9)); while (i === S.cur); S.cur = i; const p = P[i];
    ring.position.set(p.x, 0.3, p.z);
    await me.walkTo(p.x + 0.2, p.z + 1.45, { speed: 4.2 }); if (!S.live || S.over) return; me.face(p.x, p.z);
    if (p.st >= 3) { // chín → thu hoạch
      me.emote('pickup'); sfx('ok'); S.harvest++; S.score += 20; hud.msg(`🧺 Thu hoạch <b>${p.seed.n}</b>! +20`, 1600); info();
      await tw(0.5, k => p.g.scale.setScalar(1 - k * 0.9)); if (!S.live) return; plant(p, pick(SEEDS)); await tw(0.3, () => {}); return next();
    }
    if (S.used.length >= QS.length) S.used = []; let q; do q = pick(QS); while (S.used.includes(q)); S.used.push(q);
    const Q = { q: q.q, a: q.a, choices: [q.a, ...q.w].sort(() => Math.random() - 0.5) };
    hud.msg(`🌱 Luống <b>${p.seed.n}</b> · ${q.q}`, 0); S.busy = false;
    S.ask = askBar(api, Q, async ok => {
      S.busy = true; hud.msg(ok ? `✅ ${q.why}` : `❌ ${q.why}`, ok ? 2000 : 2800);
      if (ok) { S.right++; S.score += 5; me.emote('use'); sfx('splash'); await water(p); if (!S.live) return; p.st++; const to = [0.45, 0.7, 0.9, 1.15][p.st]; const from = p.g.scale.x; await tw(0.6, k => p.g.scale.setScalar(from + (to - from) * k)); if (p.st >= 3) hud.msg(`🌟 ${p.seed.n} đã chín — lần sau tới luống này để thu hoạch!`, 1800); }
      else { S.wrong++; sfx('land'); me.emote('no'); await tw(1.2, () => {}); }
      if (!S.live) return; info(); next();
    });
  }
  async function water(p) { const D = Array.from({ length: 21 }, () => [rnd(-0.7, 0.7), rnd(1.6, 2.4), rnd(-0.7, 0.7)]), o = new THREE.Object3D();
    drops.count = 21; await tw(0.9, k => { D.forEach((d, j) => { o.position.set(p.x + d[0], Math.max(0.3, d[1] - k * 2.6 - j * 0.02), p.z + d[2]); o.updateMatrix(); drops.setMatrixAt(j, o.matrix); }); drops.instanceMatrix.needsUpdate = true; }); drops.count = 0; }
  function end() {
    S.over = true; hud.clearBar(); hud.msg('', 0); hud.time(0);
    api.end({ score: S.score, title: S.harvest >= 4 ? '🧑‍🌾 Nhà nông chăm chỉ!' : '🌱 Hết giờ làm vườn', text: `Thu hoạch ${S.harvest} lần · đúng ${S.right}/${S.right + S.wrong} câu<br>Cây cần đủ 4 thứ: nước, ánh sáng, không khí và đất màu. Chăm cây đều đặn mỗi ngày là cây lớn nhanh!` });
  }
  hud.msg('🌱 Đi tới luống <b>sáng vòng vàng</b>, trả lời đúng để tưới cây — cây lớn 3 bậc thì thu hoạch!', 2800); info(); setTimeout(() => S.live && next(), 1500);
  return {
    key(e) { if (S.ask && !S.ask.done && /^Digit[123]$/.test(e.code)) S.ask.answer(+e.code.slice(5) - 1); },
    update(dt, t) { tw.update(dt); ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.35; if (S.over) return; S.t -= dt; hud.time(Math.max(0, S.t)); if (S.t <= 0) end(); },
    dispose() { S.live = false; S.over = true; tw.clear(); },
  };
}
