// classes/herb.js — NHÀ KÍNH THẢO DƯỢC (Sinh học lớp 3–6: quang hợp, vòng đời cây). 3 nhà kính mái vòm, mỗi nhà 5 chậu.
// Cây LỚN THEO THỜI GIAN THẬT (cả khi em rời game): chỉ lớn khi CÓ NƯỚC (tưới giữ ẩm 13 phút) và CÓ ÁNH SÁNG (mở mái che).
// Vòng đời: 🌰 hạt → 🌱 nảy mầm (1') → 🌿 cây con (2') → 🪴 trưởng thành (3') → 🌸 ra hoa (5') → 🍃 thu hoạch (8') — mốc Fibonacci.
// Trong buổi học: chạm bong bóng CO₂ bay vào → cây quang hợp nhanh hơn (CO₂ + nước + ánh sáng → chất dinh dưỡng + O₂).
// Thu hoạch → túi nguyên liệu (brew.js BAG) dùng ở Lớp Pha Chế.
import * as THREE from 'three';
import { teacher, ask, finish, cleanup, wait, label } from './common.js';
import { BAG } from './brew.js';

const KEY = 'academy.herbs.domes', WET = 13 * 60e3, STAGE = [0, 1, 2, 3, 5, 8];
const STAGE_N = ['🌰 hạt', '🌱 nảy mầm', '🌿 cây con', '🪴 trưởng thành', '🌸 ra hoa', '🍃 chín'];
const SEEDS = { mint: { n: '🌿 Bạc Hà Sương', c: '#5fcf6a', f: '#dff7ff' }, sun: { n: '🌻 Hoa Mặt Trời', c: '#4f9a4a', f: '#ff9a3a' }, jade: { n: '💎 Rễ Ngọc', c: '#3a8a7a', f: '#3ac0b0' } };
const load = () => { let d; try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} if (!d || d.length !== 3) d = [0, 1, 2].map(() => ({ light: false, pots: [0, 1, 2, 3, 4].map(() => ({ s: null, g: 0, t: 0, w: 0 })) })); return d; };
const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
function grow(p, light, now) {   // cộng dồn phút "đủ nước + đủ sáng" từ lần cập nhật trước
  if (!p.s) return; if (light) p.g += Math.max(0, (Math.min(now, p.w + WET) - Math.max(p.t, p.w)) / 60e3); p.t = now;
}
const stage = g => STAGE.filter(s => g >= s).length - 1;
export function domeStatus(i) {
  const d = load(), D = d[i], now = Date.now(); let n = 0, ripe = 0; for (const p of D.pots) { if (!p.s) continue; const q = { ...p }; grow(q, D.light, now); n++; if (stage(q.g) >= 5) ripe++; }
  return n ? `${n} cây${ripe ? ` · ${ripe} chín 🍃` : ''}` : 'trống';
}
const QUIZ = [
  { q: 'Cây làm ra chất dinh dưỡng (quang hợp) cần những gì?', choices: ['Ánh sáng, nước, khí CO₂', 'Chỉ cần đất', 'Bóng tối và muối', 'Chỉ cần gió'], a: 0, explain: 'Lá dùng <b>ánh sáng</b> biến <b>nước + CO₂</b> thành chất dinh dưỡng và nhả <b>khí O₂</b>.' },
  { q: 'Thứ tự vòng đời của cây có hoa là gì?', choices: ['Hạt → nảy mầm → cây con → ra hoa → quả, hạt', 'Hoa → hạt → lá → rễ', 'Cây con → hạt → hoa', 'Quả → lá → hạt → rễ'], a: 0, explain: 'Hạt nảy mầm, lớn thành cây, <b>ra hoa → kết quả → có hạt mới</b>: vòng đời khép kín.' },
];

export function startHerb(ctx, { api, door, world }) {
  const { root, hud, me } = api, M = api.mat, di = (door && door.dome) || 0, portrait = innerWidth < innerHeight;
  root.position.y += 0.3;   // sàn nhà kính (bệ đá) cao 0,3 m
  if (world) world.g.visible = false;   // vòm thế giới chắn camera (cam-occlude) → ẩn khi chơi, dựng vòm riêng không chắn
  { const glass = new THREE.Mesh(new THREE.SphereGeometry(5, 21, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })); root.add(glass);
    const rib = new THREE.Mesh(new THREE.TorusGeometry(5, 0.07, 4, 21, Math.PI), M('#e8eef7')); for (let k = 0; k < 4; k++) { const r = rib.clone(); r.rotation.y = (k + 0.5) * Math.PI / 4; root.add(r); }
    const base = new THREE.Mesh(new THREE.CircleGeometry(5.2, 34).rotateX(-Math.PI / 2), M('#b3aca0')); base.position.y = 0.01; root.add(base); }
  Object.assign(api.cam, { x: 0, y: 0.5, z: 0, yaw: 0, pitch: 0.92, dist: portrait ? 12 : 9.5 });
  me.place(0, 2.6, Math.PI); me.face(0, 0);
  teacher(api, 'student-male-e', 'Bác Lục Diệp', { shirt: '#4f9a4a', pants: '#6e4a30' },
    ['Chào cháu! Đây là Nhà kính ' + (di + 1) + '.', 'Cây cần nước, ánh sáng và khí CO₂ để quang hợp — thiếu một thứ là không lớn.', 'Gieo hạt, tưới nước, mở mái che, rồi bắt bong bóng CO₂ cho cây nhé!'], [-2.6, -1.6]);
  const data = load(), D = data[di]; const now0 = Date.now(); for (const p of D.pots) grow(p, D.light, now0);
  // 5 chậu xếp cung tròn (góc vàng) + cây
  const pots = D.pots.map((p, i) => {
    const a = Math.PI * (0.18 + i * 0.16), x = Math.cos(a) * 2.9, z = -Math.sin(a) * 2.9 + 0.9, g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.5, 10).translate(0, 0.25, 0), M('#a5552e')));
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 10).translate(0, 0.49, 0), new THREE.MeshLambertMaterial({ color: '#7a5a3a' })); g.add(soil);
    const plant = new THREE.Group(); plant.position.y = 0.5; g.add(plant);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1, 5).translate(0, 0.5, 0), M('#357040')); plant.add(stem);
    const leaves = []; for (let k = 0; k < 4; k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4).scale(1, 0.35, 0.6), new THREE.MeshLambertMaterial({ color: '#4f9a4a' })); lf.position.set(Math.cos(k * 1.57) * 0.18, 0.35 + k * 0.17, Math.sin(k * 1.57) * 0.18); plant.add(lf); leaves.push(lf); }
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), new THREE.MeshLambertMaterial({ color: '#fff' })); fl.position.y = 1.08; plant.add(fl);
    const seed = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), M('#6e4a30')); seed.position.y = 0.53; g.add(seed);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.3, 8).translate(0, 0.65, 0), new THREE.MeshBasicMaterial({ visible: false })); hit.userData.i = i; g.add(hit);
    const tag = label('', 2.1, '#fff'); tag.position.y = 2.0; g.add(tag);
    return { p, g, soil, plant, stem, leaves, fl, seed, hit, tag, st: -2 };
  });
  // mái che (bán cầu tối) khi đóng · tia nắng khi mở
  const shade = new THREE.Mesh(new THREE.SphereGeometry(4.9, 21, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#1d2238', transparent: true, opacity: 0.55, side: THREE.BackSide, depthWrite: false })); root.add(shade);
  const sunCone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6, 21, 1, true).translate(0, 3, 0), new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); root.add(sunCone);
  // bong bóng: O₂ bay lên từ cây đang quang hợp · CO₂ trôi vào, chạm để "cho cây hút"
  const bubG = new THREE.SphereGeometry(0.14, 8, 6), o2 = [], co2 = [];
  const o2Mat = new THREE.MeshBasicMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.7 });
  for (let i = 0; i < 13; i++) { const m = new THREE.Mesh(bubG, o2Mat); m.visible = false; root.add(m); o2.push({ m, t: 0 }); }
  const co2Tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d'); k.fillStyle = '#9aa3b5cc'; k.beginPath(); k.arc(64, 64, 58, 0, 7); k.fill(); k.strokeStyle = '#fff'; k.lineWidth = 5; k.stroke(); k.fillStyle = '#fff'; k.font = 'bold 40px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('CO₂', 64, 66); return new THREE.CanvasTexture(c); })();
  let tool = null, score = 0, time = 180, done = false, caught = 0, lit = false, quizI = 0, spawn = 0;
  const wet = p => Date.now() < p.w + WET;
  function show() {
    const now = Date.now();
    for (const P of pots) {
      grow(P.p, D.light, now); const s = P.p.s ? stage(P.p.g) : -1, S = P.p.s && SEEDS[P.p.s];
      P.soil.material.color.set(P.p.s && wet(P.p) ? '#4a3424' : '#9a7a52'); P.seed.visible = s === 0; P.plant.visible = s > 0;
      if (s > 0) { const k = [0, 0.35, 0.6, 0.85, 1, 1.1][s]; P.plant.scale.setScalar(k); P.leaves.forEach((l, j) => { l.visible = j < s + 1; l.material.color.set(S.c); }); P.fl.visible = s >= 4; P.fl.material.color.set(S.f); P.fl.scale.setScalar(s >= 5 ? 1.5 : 1); }
      const txt = P.p.s ? `${STAGE_N[s]}${s < 5 ? (wet(P.p) ? ' 💧' : ' 🥀 khô') : ''}` : 'chậu trống';
      if (P.tag.userData.t !== txt) { P.tag.userData.t = txt; const n = label(txt, 2.1, '#fff'); P.tag.material.map.dispose(); P.tag.material.map = n.material.map; }
    }
    shade.visible = !D.light; sunCone.visible = D.light; save(data);
    const any = pots.some(P => P.p.s);
    hud.info(`☀️ ${D.light ? 'Mở' : 'Đóng'} · 🫧 ${caught}`);
    if (!any) hud.msg('🌰 Chọn một loại hạt ở dưới rồi chạm vào chậu để <b>gieo</b>.', 0);
  }
  function bar() {
    hud.clearBar();
    for (const [k, s] of Object.entries(SEEDS)) hud.button(s.n, b => setTool('seed:' + k, b), 'sm');
    hud.button('💧 Tưới', b => setTool('water', b), 'sm'); hud.button('✂️ Hái', b => setTool('cut', b), 'sm');
    hud.button(D.light ? '🌥️ Đóng mái' : '☀️ Mở mái', b => { D.light = !D.light; b.innerHTML = D.light ? '🌥️ Đóng mái' : '☀️ Mở mái'; for (const P of pots) P.p.t = Date.now(); if (D.light && !lit) { lit = true; score += 2; hud.score(score); } api.sfx('open'); hud.msg(D.light ? '☀️ Ánh sáng tràn vào — lá bắt đầu <b>quang hợp</b>!' : '🌥️ Thiếu ánh sáng, cây <b>ngừng quang hợp</b> và không lớn.', 3000); show(); }, 'sm');
    hud.button('🏁 Xong', end, 'on');
  }
  function setTool(t, b) { tool = t; for (const x of hud.bar.querySelectorAll('button')) x.classList.toggle('on', x === b || x.textContent === '🏁 Xong'); api.sfx('ui'); }
  async function act(P) {
    const p = P.p;
    if (!tool) return hud.msg('👇 Chọn dụng cụ (hạt / 💧 / ✂️) ở dưới trước.', 2200);
    if (tool.startsWith('seed:')) { if (p.s) return hud.msg('🪴 Chậu này đã có cây.', 1800); p.s = tool.slice(5); p.g = 0; p.t = Date.now(); p.w = 0; score += 2; me.emote('pickup'); api.sfx('ok'); hud.msg(`🌰 Đã gieo ${SEEDS[p.s].n}. Giờ hãy <b>tưới nước</b>!`, 2400); }
    else if (tool === 'water') { if (!p.s) return hud.msg('Chậu trống, gieo hạt trước nhé.', 1800); if (wet(p) && Date.now() - p.w < 60e3) return hud.msg('💧 Đất còn ẩm, tưới quá nhiều làm úng rễ!', 2400); grow(p, D.light, Date.now()); p.w = Date.now(); score += 1; me.emote('use'); api.sfx('ok'); }
    else if (tool === 'cut') {
      if (!p.s) return; const s = stage(p.g); if (s < 5) return hud.msg(`⏳ ${STAGE_N[s]} — chưa thu hoạch được (cần ${(STAGE[5] - p.g).toFixed(1)} phút đủ nước + nắng nữa).`, 3000);
      let b; try { b = JSON.parse(localStorage.getItem(BAG)) || {}; } catch (e) { b = {}; } b[p.s] = (b[p.s] || 0) + 2; try { localStorage.setItem(BAG, JSON.stringify(b)); } catch (e) {}
      hud.msg(`✂️ Thu hoạch 2 ${SEEDS[p.s].n}! Dùng ở 🧪 Lớp Pha Chế.`, 3000); p.s = null; p.g = 0; score += 5; api.sfx('win'); me.emote('cheer'); show(); hud.score(score);
      if (quizI < QUIZ.length) { const ok = await ask(api, QUIZ[quizI++]); if (ok) { score += 5; hud.score(score); } }
    }
    hud.score(score); show();
  }
  function end() {
    if (done) return; done = true; hud.clearBar(); show();
    const ripe = pots.filter(P => P.p.s && stage(P.p.g) >= 5).length, growing = pots.filter(P => P.p.s).length;
    finish(ctx, api, { score: Math.min(34, score), max: 34, title: 'Nhà kính Thảo Dược', text: `${growing} chậu đang lớn${ripe ? `, ${ripe} chậu đã chín` : ''}. Cây vẫn lớn khi em đi vắng (nếu còn ẩm và có nắng) — quay lại thu hoạch nhé!` });
  }
  hud.score(0); bar(); show();
  let tShow = 0;
  return {
    tap(e) {
      if (done) return;
      const c = api.pick(e, co2.map(b => b.m)), h0 = api.pick(e, pots.map(P => P.hit));
      if (c && (!h0 || c.distance < h0.distance)) { const b = co2.find(q => q.m === c.object); root.remove(b.m); co2.splice(co2.indexOf(b), 1);
        const ok = pots.filter(P => P.p.s && wet(P.p) && D.light && stage(P.p.g) < 5); caught++; api.sfx('ok');
        if (ok.length) { for (const P of ok) P.p.g += 0.34; if (caught <= 13) { score += 1; hud.score(score); } hud.msg(`🫧 Cây hút CO₂ → quang hợp nhanh hơn! (${ok.length} chậu lớn thêm)`, 1600); }
        else hud.msg('🫧 Bắt được CO₂, nhưng chưa cây nào quang hợp được: cần <b>cây + đất ẩm + ánh sáng</b>.', 2400); show(); return; }
      if (h0) act(pots[h0.object.userData.i]);
    },
    update(dt, t) {
      if (!done) { time -= dt; hud.time(Math.max(0, time)); if (time <= 0) end(); }
      if ((tShow -= dt) < 0) { tShow = 2; show(); }
      // CO₂ trôi vào từ ngoài vòm
      if (!done && (spawn -= dt) < 0 && co2.length < 5) { spawn = 2.2; const a = Math.random() * 6.28, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: co2Tex, transparent: true })); m.scale.setScalar(0.8); m.position.set(Math.cos(a) * 4.2, 1 + Math.random() * 1.5, Math.sin(a) * 4.2); root.add(m); co2.push({ m, a, t: 0 }); }
      for (const b of co2) { b.t += dt; b.m.position.x *= 1 - dt * 0.08; b.m.position.z *= 1 - dt * 0.08; b.m.position.y += Math.sin(t * 2 + b.a) * dt * 0.2; }
      // O₂ từ cây đang quang hợp
      const ps = pots.filter(P => P.p.s && wet(P.p) && D.light && stage(P.p.g) > 0);
      for (const b of o2) { if (b.t <= 0 && ps.length && Math.random() < dt) { const P = ps[(Math.random() * ps.length) | 0]; b.m.position.set(P.g.position.x, 1.2, P.g.position.z); b.t = 2; b.m.visible = true; } if (b.t > 0) { b.t -= dt; b.m.position.y += dt * 0.8; if (b.t <= 0) b.m.visible = false; } }
      sunCone.material.opacity = 0.14 + Math.sin(t) * 0.04;
    },
    dispose() { cleanup(); save(data); co2Tex.dispose(); if (world) world.g.visible = true; },
  };
}
