// academy/flyers.js — THÚ BAY CƯỠI ĐƯỢC ở Bãi Thú Bay (cửa Thung Lũng Rồng): 🐴 Ngựa có cánh (Pegasus, thần thoại Hy Lạp) ·
// 🕊️ Chim Lạc khổng lồ (trống đồng Đông Sơn) · 🔥 Phượng Hoàng (tứ linh) · 🐉 Rồng Lửa lớn.
// Làm quen: 🙇 cúi chào → thú chào lại → 🍎 chọn đúng thức ăn (kiến thức động vật thật) → thành bạn (lưu máy).
// Cưỡi: điều khiển như phượng hoàng/chổi (vehicles.js mode.fly): Space/⬆ lên · C/⬇ xuống · Shift lao nhanh; tay cầm cương,
// cánh vỗ nhanh khi lên/tăng tốc, xoè lượn khi hạ; bay vòng quanh lâu đài → "wow" + thưởng.
// Gọi: huýt sáo H (mounts.js — thú bay tự bay tới), nút 🪽 trong cột phương tiện, phép "Gọi Bạn Bay!" (nếu có ctx.spells).
// Hiệu năng: ẩn khi cách người chơi > 377 m (trừ khi đang được gọi/cưỡi); hoạt ảnh đứng yên 1/3 khung khi > 89 m.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV } from '../sample/palette.js';
import { toon } from '../style.js';
import { quad, phoenix } from '../mounts.js';
import { birdBody, birdWing } from './creatures.js';
import { makeWyrm, poseWyrm } from './dragons.js';
import { VALLEY, VALLEY_GATE, PLAT, toWorld } from './plan.js';

const KEY = 'academy.flyers', HIDE = 377, PI = Math.PI;
const wingMat = toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide });

// ---------- model ----------
function pegasusWing(s) {   // cánh lông vũ: 5 dải lông trắng, chóp vàng nhạt; gốc ở vai, xoè theo +x·s
  const b = new Batch();
  for (let k = 0; k < 5; k++) b.add(new THREE.BoxGeometry(0.62, 0.05, 0.95 - k * 0.12), ['#fbfaf6', '#f4f1ea', '#ece6da', '#f6e7b8', '#f2d98a'][k], s * (0.3 + k * 0.5), k * 0.04, -k * 0.13, s * -0.12 * k);
  return b.build();
}
function makePegasus() {
  const m = quad({ len: 1.7, leg: 1.0, bw: 0.55, bh: 0.6, neck: [0.8, 0.55], head: [0.3, 0.32, 0.6], col: '#f7f5ef', col2: '#d9d2c4', mane: '#f2d98a', ears: [0.1, 0.2], tail: 0.85, hoof: '#c9a85a' });
  m.wings = [-1, 1].map(s => { const W = new THREE.Group(); W.position.set(s * 0.26, 1.55, 0.35); W.add(new THREE.Mesh(pegasusWing(s), wingMat)); m.body.add(W); return W; });
  m.group.scale.setScalar(1.618); m.S = 1.618; m.bit = new THREE.Vector3(0, 2.05, 1.55); return m;
}
function makeChimLac() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const b = new THREE.Mesh(birdBody(), matV()); b.castShadow = true; b.position.y = 1.5; body.add(b);
  const wings = [-1, 1].map(s => { const W = new THREE.Group(); W.position.set(s * 0.2, 1.62, 0.1); const w = new THREE.Mesh(birdWing(), wingMat); w.scale.x = s; W.add(w); body.add(W); return W; });
  g.scale.setScalar(3.4); return { group: g, body, wings, legs: [], S: 3.4, back: 1.9, bit: new THREE.Vector3(0, 2.25, 1.85) };
}
function makePhoenix() { const m = phoenix(); m.group.scale.setScalar(1.618); m.S = 1.618; m.bit = new THREE.Vector3(0, 2.1, 1.35); return m; }
function makeDragon() { const w = makeWyrm('fire', 2.2); w.S = 2.2; w.back = 2.25; w.bit = new THREE.Vector3(0, 2.45, 1.5); w.wyrm = true; w.legs = []; return w; }

const DEF = {
  pegasus: { name: 'Ngựa có cánh', emoji: '🐴', make: makePegasus, speed: 19, tune: [0, 4, 7, 11, 14],
    myth: 'Thần thoại Hy Lạp kể về <b>Pegasus</b> — chú ngựa trắng có cánh; nơi móng Pegasus gõ xuống đất, một dòng suối trong trào lên.',
    food: ['Cỏ khô và táo', 'Thịt nướng', 'Kẹo mút'], why: 'Ngựa là thú <b>ăn cỏ</b>: răng hàm phẳng nghiền cỏ, ruột rất dài để tiêu hoá chất xơ.' },
  chimlac: { name: 'Chim Lạc khổng lồ', emoji: '🕊️', make: makeChimLac, speed: 21, tune: [12, 7, 9, 4, 7],
    myth: '<b>Chim Lạc</b> là hình chim khắc trên <b>trống đồng Đông Sơn</b> hơn 2.000 năm trước — biểu tượng của người Lạc Việt.',
    food: ['Cá nhỏ và tôm tép', 'Cỏ khô', 'Hạt sỏi'], why: 'Chim Lạc mỏ dài, cổ dài, chân cao như <b>cò, diệc</b> — loài chim lội nước bắt cá, tôm.' },
  phoenix: { name: 'Phượng Hoàng', emoji: '🔥', make: makePhoenix, speed: 22, tune: [0, 7, 12, 16, 19, 24],
    myth: '<b>Phượng hoàng</b> (Phụng) là một trong Tứ linh Long – Lân – Quy – Phụng, tượng trưng cho điều tốt lành và hoà bình.',
    food: ['Hạt trúc và nước suối ngọt', 'Thịt sống', 'Bánh kẹo'], why: 'Sách cổ kể phượng hoàng "không phải hạt trúc không ăn, không phải suối ngọt không uống". Ngoài đời, chim ăn hạt có <b>mỏ khoẻ</b> để tách vỏ.' },
  dragon: { name: 'Rồng Lửa lớn', emoji: '🐉', make: makeDragon, speed: 24, tune: [-5, 0, 3, 7, 12],
    myth: '<b>Rồng Lửa lớn</b> là "chị cả" hiền hậu của Thung Lũng Rồng — thích chở các bạn nhỏ bay ngắm trời.',
    food: ['Cá nướng thơm', 'Cỏ khô', 'Sỏi đá'], why: 'Họ hàng ngoài đời của rồng là <b>bò sát ăn thịt</b> như rồng Komodo, cá sấu — chúng ăn cá, thịt.' },
};

export function createFlyers(ctx, magic) {
  const { player: pl, terrain } = ctx, V = ctx.vehicles, sup = V.sup;
  let st; try { st = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { st = {}; } st.bond = st.bond || []; st.wow = st.wow || 0;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const castle = toWorld(PLAT.u, 0); let clock = 0, linked = false;
  const list = Object.entries(DEF).map(([key, D], i) => {
    const m = D.make(), th = VALLEY_GATE + (i - 1.5) * 0.3, [x, z] = toWorld(VALLEY.u + Math.cos(th) * 42, VALLEY.v + Math.sin(th) * 42);
    m.group.position.set(x, terrain.heightAt(x, z), z); m.group.rotation.y = VALLEY_GATE + PI;
    const S = m.S, back = (m.back || 1.7) * S;
    // dây cương: 2 đoạn từ tay người cưỡi tới hàm thú (toạ độ trong nhóm, chia tỷ lệ)
    const hy = (back + 0.85) / S, hz = 0.42 / S, rg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.2 / S, hy, hz), m.bit.clone().add(new THREE.Vector3(-0.12, 0, 0)), new THREE.Vector3(0.2 / S, hy, hz), m.bit.clone().add(new THREE.Vector3(0.12, 0, 0))]);
    const reins = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#5a3a22' })); reins.visible = false; m.group.add(reins);
    const F = { type: 'flyer', key, id: 'flyer-' + key, name: D.name, emoji: D.emoji, tune: D.tune, D, M: m, group: m.group, home: [x, z], r: 2.2 * S, side: 1.2 * S, fly: true, phase: Math.random() * 6, reins, greet: false, cool: 0, bow: 0, ride: null,
      bye: `🚶 Xuống ${D.name}`,
      hello: `${D.emoji} Bay cùng <b>${D.name}</b>! <b>Space/⬆</b> bay lên · <b>C/⬇</b> hạ xuống · <b>Shift</b> lao nhanh · chạm đất bấm <b>E</b> để xuống.<br><small>Thử bay một vòng quanh lâu đài nhé! 🏰</small>`,
      mode: { speed: D.speed, boost: 1.7, turn: 2.2, accel: 1.4, fly: true, climb: 9, lift: 0, maxAlt: 144, anim: 'drive', seat: back - 0.15, seatZ: 0.05, camAdd: 3 + S * 1.3 }, takeoff: 1.2 };
    F.flap = (air, sp, dt) => pose(F, dt, air, air ? 8 : 2, 0.6, sp);
    F.tick = (dt, sp, s) => {
      const air = !s.grounded; pose(F, dt, air, air ? (s.lift > 1 ? 9 : s.fast ? 7.5 : 3 + sp * 0.18) : 2 + sp * 0.4, air ? (s.lift > 1 ? 0.85 : s.lift < -1 ? 0.1 : 0.5) : 0, sp);
      pl.root.rotation.z = s.lean * 1.2; pl.root.rotation.x = THREE.MathUtils.clamp(-(pl.vy || 0) * 0.04, -0.35, 0.35);
      wow(F, dt);
    };
    F.onMount = () => { reins.visible = true; F.call = null; F.ride = { a: null, sum: 0, said: false }; ctx.bestiary && ctx.bestiary.see(key); };
    F.onDismount = () => { reins.visible = false; F.ride = null; pose(F, 0, false, 2, 0, 0); F.home = [F.group.position.x, F.group.position.z]; };
    F.offer = () => offer(F);
    V.register(F); return F;
  });
  const bonded = F => st.bond.includes(F.key);

  // ---------- tư thế ----------
  function pose(F, dt, air, rate, amp, sp) {
    const m = F.M; F.phase += dt * rate;
    if (m.wyrm) { poseWyrm(m, dt, air, rate, amp || 0.5); return; }
    const f = air ? Math.sin(F.phase) * amp : 0, fold = F.key === 'phoenix' ? 1.1 : 0.9;
    m.wings[0].rotation.set(0, air ? 0 : -0.7, air ? f : fold); m.wings[1].rotation.set(0, air ? 0 : 0.7, air ? -f : -fold);
    if (F.key === 'chimlac') { m.wings[0].rotation.z = air ? -f : 1.2; m.wings[1].rotation.z = air ? f : -1.2; }
    m.body.position.y = air ? -Math.sin(F.phase) * 0.08 : Math.abs(Math.cos(F.phase)) * Math.min(0.1, sp * 0.01);
    const a = Math.min(0.7, sp * 0.09), s = Math.sin(F.phase);
    if (m.legs.length === 4) { if (air) for (const L of m.legs) L.rotation.x = 0.9 * (L === m.legs[0] || L === m.legs[1] ? -1 : 1); else { m.legs[0].rotation.x = m.legs[3].rotation.x = s * a; m.legs[1].rotation.x = m.legs[2].rotation.x = -s * a; } }
    else if (m.legs.length === 2) for (const L of m.legs) L.rotation.x = air ? 0.9 : s * a;
    m.body.rotation.x = F.bow > 0 ? Math.sin(Math.min(1, F.bow) * PI) * 0.35 : 0;   // cúi chào lại
  }
  // ---------- "wow": bay quanh lâu đài ----------
  function wow(F, dt) {
    const R = F.ride, p = pl.pos, dx = p.x - castle[0], dz = p.z - castle[1], d = Math.hypot(dx, dz);
    if (d > 233 || p.y < PLAT.y + 13) { R.a = null; return; }
    const a = Math.atan2(dx, dz); if (R.a !== null) { let da = a - R.a; da = Math.atan2(Math.sin(da), Math.cos(da)); R.sum += da; } R.a = a;
    if (!R.said) { R.said = true; ctx.toast(`✨ <b>Wow!</b> Lâu đài Học viện Pha Lê hiện ra dưới cánh ${F.name}! Bay trọn <b>một vòng</b> quanh lâu đài nhé.`, 4000); ctx.sfx && ctx.sfx('ok'); }
    if (Math.abs(R.sum) > 2 * PI) {
      R.sum = 0; st.wow++; save(); ctx.sfx && ctx.sfx('win'); pl.emote && pl.emote('cheer');
      magic && magic.setMana && magic.setMana(magic.mana + 21);
      ctx.toast(`🏰🎉 Em đã cưỡi <b>${F.name}</b> bay trọn một vòng quanh lâu đài! (+21 năng lượng phép · lần thứ ${st.wow})<br><small>Biết không? Chu vi đường tròn = 2 × π × bán kính — vòng em vừa bay dài khoảng <b>${Math.round(2 * PI * d)} m</b>.</small>`, 7000);
      ctx.dragons && ctx.dragons.fx && (() => { for (let k = 0; k < 34; k++) ctx.dragons.fx.emit(p.x, p.y + 2, p.z, (Math.random() - .5) * 8, Math.random() * 6, (Math.random() - .5) * 8, ['#ffe08a', '#ff9ab0', '#9fe6ff'][k % 3], 1.2, 2); })();
    }
  }

  // ---------- làm quen ----------
  function offer(F) {
    if (bonded(F)) return ctx.offer(`${F.emoji} Cưỡi ${F.name}`, () => { F.call = null; V.mount(F); }, 7);
    if (F.cool > clock) return ctx.offer(`⏳ ${F.name} đang suy nghĩ…`, () => ctx.toast('Đợi chút rồi thử lại nhé! 🙂', 1600), 7);
    if (!F.greet) return ctx.offer(`🙇 Cúi chào ${F.name}`, () => {
      pl.emote && pl.emote('interact'); F.bow = 1.6; ctx.bestiary && ctx.bestiary.see(F.key);
      setTimeout(() => { F.greet = true; ctx.toast(`${F.emoji} <b>${F.name}</b> cúi đầu chào lại em! ${F.D.myth}<br><small>Giờ hãy mời bạn ấy một món ăn đúng sở thích nhé.</small>`, 6500); }, 900);
    }, 7);
    ctx.offer(`🍎 Cho ${F.name} ăn`, () => feed(F), 7);
  }
  function feed(F) {
    const ch = F.D.food.map((t, i) => ({ t, ok: i === 0 })).sort(() => Math.random() - 0.5);
    const card = document.createElement('div'); card.id = 'mgCard';
    card.innerHTML = `<h4>🍎 ${F.name} thích ăn gì?</h4><div class="ch">${ch.map((c, i) => `<button data-i="${i}">${c.t}</button>`).join('')}</div><div style="text-align:right;margin-top:6px"><button data-x>Đóng</button></div>`;
    document.getElementById('mgCard')?.remove(); document.body.appendChild(card);
    card.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; if (b.dataset.x !== undefined) return card.remove();
      const c = ch[+b.dataset.i]; if (!c || card.dataset.done) return; card.dataset.done = 1;
      b.classList.add(c.ok ? 'ok' : 'no'); card.querySelectorAll('[data-i]').forEach((x, i) => ch[i].ok && x.classList.add('ok'));
      card.insertAdjacentHTML('beforeend', `<div style="margin-top:6px">${c.ok ? '✅ Ngon quá! ' : '💡 '}${F.D.why}</div>`); ctx.sfx && ctx.sfx(c.ok ? 'coin' : 'no');
      setTimeout(() => {
        card.remove();
        if (c.ok) { st.bond.push(F.key); save(); link(); ctx.whistle && ctx.whistle(F.tune); ctx.sfx && ctx.sfx('win'); pl.emote && pl.emote('cheer'); ctx.toast(`🎉 <b>${F.name}</b> đã là bạn bay của em! Bấm <b>E</b> để cưỡi.<br>Ở xa thì <b>huýt sáo (H)</b> hoặc bấm nút <b>🪽</b> để gọi — đây là giai điệu riêng của bạn ấy.`, 6500); }
        else { F.cool = clock + 8; }
      }, c.ok ? 1500 : 3200);
    };
  }

  // ---------- gọi: nối vào huýt sáo của mounts.js + nút 🪽 + phép ----------
  function link() {
    const Mo = ctx.mounts; if (!Mo) return; linked = true;
    for (const F of list) { if (!Mo.beasts.includes(F)) Mo.beasts.push(F); if (bonded(F)) Mo.tamed.add(F.id); }
  }
  function callMenu() {
    const mine = list.filter(bonded), el = document.getElementById('whistle');
    if (!mine.length) return ctx.toast('🪽 Em chưa có bạn bay nào. Tới <b>Bãi Thú Bay</b> ở cửa <b>Thung Lũng Rồng</b> (cạnh Rừng Phép Thuật, đảo Học viện) để làm quen nhé!', 5000);
    if (!ctx.mounts) return;
    if (mine.length === 1) return ctx.mounts.call(mine[0]);
    el.innerHTML = '<div>🪽 Gọi bạn bay…</div>' + mine.map((F, i) => `<button data-i="${i}"><span>${F.emoji}</span>${F.name}</button>`).join('');
    el.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); ctx.mounts.call(mine[+b.dataset.i]); });
    el.hidden = false;
  }
  { const bar = document.querySelector('.vbtns'), w = document.getElementById('bWhistle');
    if (bar) { const b = document.createElement('button'); b.id = 'bFlyer'; b.title = 'Gọi bạn bay (thú bay đã làm quen)'; b.textContent = '🪽'; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); callMenu(); }); bar.insertBefore(b, w ? w.nextSibling : null); } }
  const spell = { id: 'goi-ban-bay', name: 'Gọi Bạn Bay!', icon: '🪽', desc: 'Gọi thú bay đã làm quen bay tới', cast: callMenu };
  let spelled = false;

  // ---------- mỗi khung ----------
  let skip = 0;
  function update(dt) {
    clock += dt;
    if (!linked && ctx.mounts) link();
    if (!spelled && ctx.spells) { const r = ctx.spells.register || ctx.spells.add; if (typeof r === 'function') { spelled = true; try { r.call(ctx.spells, spell); } catch (e) {} } }   // nhánh spells-core: phép "Gọi Bạn Bay!"
    const cur = V.current, far = (skip = (skip + 1) % 3) !== 0;
    for (const F of list) {
      if (F === cur) continue;
      const g = F.group, d = Math.hypot(g.position.x - pl.pos.x, g.position.z - pl.pos.z);
      g.visible = !!F.call || d < HIDE;
      if (F.bow > 0) F.bow = Math.max(0, F.bow - dt);
      if (F.call || !g.visible || (d > 89 && far)) continue;
      pose(F, dt * (d > 89 ? 3 : 1), false, 2, 0, 0);
      g.position.y = sup(g.position.x, g.position.z);
    }
  }
  return { update, list, callMenu, spell, state: st };
}
