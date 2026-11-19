// classes/brew.js — LỚP PHA CHẾ (Hoá học AN TOÀN lớp 3–7 + phân số): pha 5 "thuốc" theo công thức trên bảng.
// Mỗi lần chạm 1 lọ = rót ⅛ cốc → học phân số bằng nhau (½ = 4/8, ¾ = 6/8, ¼ = 2/8) và tỉ lệ (3 : 1).
// Kiến thức thật: trộn màu (vàng + lam → lục), dung dịch (muối tan khi khuấy), đường tan nhanh hơn trong nước ấm,
// nước hoa đậu biếc là CHẤT CHỈ THỊ: gặp nước chanh (axit) đổi từ lam sang tím hồng. Nguyên liệu thảo dược lấy từ Nhà kính (herb.js).
import * as THREE from 'three';
import { room, teacher, ask, finish, cleanup, prop, wait, label } from './common.js';

export const BAG = 'academy.herbs.bag';   // túi nguyên liệu thu hoạch ở nhà kính: { mint, sun, jade }
const bag = () => { try { return JSON.parse(localStorage.getItem(BAG)) || {}; } catch (e) { return {}; } };
const saveBag = b => { try { localStorage.setItem(BAG, JSON.stringify(b)); } catch (e) {} };
// lỏng: rót ⅛ cốc / lần · rắn: 1 thìa / lần
const ING = {
  water: { n: '💧 Nước suối', c: '#cfe8ff' }, turmeric: { n: '🟡 Nước nghệ', c: '#f2c443' }, pea: { n: '🔵 Nước đậu biếc', c: '#3d5fe0' },
  lemon: { n: '🍋 Nước chanh', c: '#f6f1a0' }, salt: { n: '🧂 Muối', c: '#ffffff', solid: true }, sugar: { n: '🍬 Đường', c: '#fff4e0', solid: true },
  mint: { n: '🌿 Bạc Hà Sương', c: '#5fcf6a', herb: true }, sun: { n: '🌻 Hoa Mặt Trời', c: '#ff9a3a', herb: true },
};
const RECIPES = [
  { n: 'Thuốc Lá Xanh', parts: { turmeric: 4, pea: 4 }, line: '½ cốc nước nghệ + ½ cốc nước đậu biếc', tip: '½ cốc = <b>4/8</b> cốc = 4 lần rót.', fact: '🎨 Vàng + lam = <b>lục</b>! Trộn màu là trộn chất tạo màu (sắc tố).', deco: ['water', 'lemon'] },
  { n: 'Nước Biển Mini', parts: { water: 6, salt: 1 }, stir: true, line: '¾ cốc nước suối + 1 thìa muối, khuấy tan', tip: '¾ cốc = <b>6/8</b> cốc.', fact: '🧂 Muối <b>tan</b> trong nước tạo thành <b>dung dịch</b> nước muối — muối vẫn còn đó dù không nhìn thấy!', deco: ['sugar', 'pea'] },
  { n: 'Thuốc Đổi Màu', parts: { pea: 5, lemon: 1 }, line: '⅝ cốc nước đậu biếc + ⅛ cốc nước chanh', tip: 'Rót đậu biếc 5 lần, chanh 1 lần.', fact: '🔮 Nước đậu biếc là <b>chất chỉ thị</b>: gặp <b>axit</b> trong chanh thì đổi sang tím hồng.', deco: ['water', 'turmeric'] },
  { n: 'Siro Mặt Trời', parts: { water: 3, sun: 2, sugar: 1 }, heat: true, stir: true, line: '⅜ cốc nước + ¼ cốc Hoa Mặt Trời + 1 thìa đường, đun ấm rồi khuấy', tip: '¼ cốc = <b>2/8</b> cốc. Đun trước rồi mới khuấy.', fact: '🔥 Đường <b>tan nhanh hơn trong nước ấm</b> vì các hạt nước chuyển động nhanh hơn.', deco: ['salt', 'mint'] },
  { n: 'Thuốc Sương Bạc Hà', parts: { water: 6, mint: 2 }, line: 'Nước : Bạc Hà Sương = 3 : 1, đầy đúng 1 cốc', tip: '3 phần + 1 phần = 4 phần = 8/8 cốc → mỗi phần 2/8.', fact: '⚖️ <b>Tỉ lệ 3 : 1</b>: cứ 3 phần nước thì 1 phần bạc hà; 6/8 và 2/8 giữ đúng tỉ lệ đó.', deco: ['lemon', 'turmeric'] },
];
const QUIZ = {
  1: { q: 'Hoà muối vào nước rồi khuấy, muối đi đâu?', choices: ['Tan vào nước thành dung dịch', 'Biến mất hoàn toàn', 'Bay lên trời', 'Chìm xuống thành đá'], a: 0, explain: 'Muối <b>tan</b>: các hạt muối nhỏ trộn đều giữa các hạt nước. Đun cạn nước sẽ thấy muối trở lại!' },
  2: { q: 'Nước chanh có vị chua vì chứa chất gì?', choices: ['Axit', 'Muối ăn', 'Đường', 'Dầu'], a: 0, explain: 'Chanh chứa <b>axit xitric</b>. Chất chỉ thị giúp nhận ra axit qua màu sắc.' },
  4: { q: '⅜ cốc + ¼ cốc bằng bao nhiêu?', choices: ['⅝ cốc', '4/12 cốc', '½ cốc', '¾ cốc'], a: 0, explain: '¼ = 2/8, nên 3/8 + 2/8 = <b>5/8</b>.' },
};
const frac = n => ({ 0: '0', 2: '¼', 4: '½', 6: '¾', 8: '1' })[n] || `${n}/8`;

export function startBrew(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat;
  const R = room(api, { rug: '#2f6b4a', desks: 2 });
  const portrait = innerWidth < innerHeight;
  Object.assign(api.cam, { x: 0, y: 0.9, z: -1.2, yaw: 0, pitch: 0.62, dist: portrait ? 12 : 9.5 });
  me.place(0, 2.4, Math.PI); me.face(0, -1.5);
  teacher(api, 'student-female-a', 'Cô Hương Thảo', { shirt: '#5fae7a', aodai: true },
    ['Chào các em! Lớp Pha Chế an toàn bắt đầu.', 'Mỗi lần rót là ⅛ cốc: ½ cốc bằng 4 lần rót đấy.', 'Nhớ nhé: không nếm, không ngửi trực tiếp, luôn có người lớn bên cạnh!'], [-3.6, -2.6]);
  // vạc: thân + miệng + chất lỏng (mức + màu) + lửa
  const C0 = new THREE.Vector3(0, 0.12, -1.8), cau = new THREE.Group(); cau.position.copy(C0); root.add(cau);
  cau.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 21, 13, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.68).translate(0, 0.95, 0), M('#2f2a33')));
  cau.add(new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.08, 6, 21).rotateX(Math.PI / 2).translate(0, 1.72, 0), M('#4a4450')));
  const liq = new THREE.Mesh(new THREE.CircleGeometry(0.74, 21).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#334' })); liq.position.y = 1.0; cau.add(liq);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 7).translate(0, 0.4, 0), new THREE.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.85 })); fire.visible = false; cau.add(fire);
  const grains = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: '#fff' })); grains.visible = false; cau.add(grains);
  const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 5).translate(0, 0.6, 0), M('#a8744a')); const piv = new THREE.Group(); cau.add(piv); spoon.position.set(0.35, 1.0, 0); spoon.rotation.z = -0.35; piv.add(spoon);
  // ống đong 8 vạch (⅛ cốc) cạnh vạc
  const tube = new THREE.Group(); tube.position.set(1.6, 0.12, -1.6); root.add(tube);
  tube.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.7, 13, 1, true).translate(0, 0.85, 0), new THREE.MeshLambertMaterial({ color: '#dff3ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })));
  for (let i = 1; i <= 8; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(i % 4 ? 0.12 : 0.24, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: '#3b2a1e' })); t.position.set(0, 0.05 + i * 0.2, 0.23); tube.add(t); }
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 13).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#334' })); fill.position.y = 0.05; fill.scale.y = 0.001; tube.add(fill);
  const tl = label('Ống đong ⅛ cốc', 2.2); tl.position.set(0, 2.2, 0); tube.add(tl);
  prop(api, 'prop_workbench', -1.9, 0.12, -1.9, 3, 0); prop(api, 'prop_crate_bottles', -2.2, 1.05, -1.9, 0.8, 0.4); prop(api, 'furn_shelf_big', 3.2, 0.12, -3.6, 1, -0.5);

  let ri = 0, mix = {}, heated = false, stirred = false, score = 0, tries = 0, busy = false, time = 0, done = false, stirT = 0;
  const herbLent = {};
  function mixColor() {
    let r = 0, g = 0, b = 0, n = 0; const c = new THREE.Color();
    for (const [k, q] of Object.entries(mix)) { if (ING[k].solid) continue; c.set(ING[k].c); r += Math.log(c.r + 0.02) * q; g += Math.log(c.g + 0.02) * q; b += Math.log(c.b + 0.02) * q; n += q; }
    if (!n) return null; c.setRGB(Math.exp(r / n), Math.exp(g / n), Math.exp(b / n));   // trộn kiểu sắc tố: trung bình nhân → vàng + lam ra lục
    { const h = {}; c.getHSL(h); c.setHSL(h.h, Math.min(1, h.s * 2.6), Math.min(h.l, 0.42)); }        // sắc tố trộn bị xỉn → tăng độ bão hoà cho dễ nhìn
    if (mix.pea && mix.lemon) c.lerp(new THREE.Color('#c04fb8'), 0.75);                  // chất chỉ thị gặp axit
    return c;
  }
  function show() {
    const tot = Object.entries(mix).reduce((s, [k, q]) => s + (ING[k].solid ? 0 : q), 0), c = mixColor();
    liq.material.color.copy(c || new THREE.Color('#2a2530')); fill.material.color.copy(c || new THREE.Color('#2a2530'));
    liq.position.y = 1.0 + Math.min(8, tot) * 0.07; fill.scale.y = Math.max(0.001, Math.min(8, tot) * 0.2);
    const solid = Object.keys(mix).some(k => ING[k].solid); grains.visible = solid && !stirred; grains.position.y = liq.position.y + 0.05;
    const list = Object.entries(mix).map(([k, q]) => `${ING[k].n.split(' ')[0]} ${ING[k].solid ? q + ' thìa' : frac(q)}`).join(' · ');
    hud.msg(list ? `Trong vạc: ${list}${heated ? ' · 🔥 ấm' : ''}${solid ? (stirred ? ' · ✅ đã tan' : ' · chưa tan') : ''}` : 'Vạc đang trống — chạm lọ để rót ⅛ cốc.', 0);
  }
  function bar() {
    hud.clearBar(); const r = RECIPES[ri], keys = [...Object.keys(r.parts), ...r.deco].sort(() => Math.random() - 0.5);
    for (const k of keys) hud.button(ING[k].n + (ING[k].herb ? ` (${bag()[k] || 0})` : ''), () => pour(k), 'sm');
    hud.button('🔥 Đun', () => { if (busy) return; heated = !heated; fire.visible = heated; api.sfx('ui'); show(); }, 'sm');
    hud.button('🌀 Khuấy', () => { if (busy) return; stirT = 1.3; me.emote('use'); const s = Object.keys(mix).some(k => ING[k].solid);
      if (s && mix.sugar && !heated) hud.msg('🍬 Đường tan <b>rất chậm</b> trong nước lạnh… thử <b>🔥 Đun</b> ấm rồi khuấy lại!', 3400); else { stirred = true; setTimeout(show, 900); } }, 'sm');
    hud.button('🗑️ Đổ', () => { if (busy) return; mix = {}; heated = stirred = false; fire.visible = false; show(); }, 'sm');
    hud.button('✅ Xong', check, 'on');
  }
  function pour(k) {
    if (busy) return; const tot = Object.entries(mix).reduce((s, [q, n]) => s + (ING[q].solid ? 0 : n), 0);
    if (!ING[k].solid && tot >= 8) return hud.msg('⚠️ Vạc đã đầy 1 cốc rồi!', 2000);
    if (ING[k].herb && !mix[k]) { const b = bag(); if (b[k] > 0) { b[k]--; saveBag(b); herbLent[k] = false; } else herbLent[k] = true; }
    mix[k] = (mix[k] || 0) + 1; if (ING[k].solid) stirred = false; api.sfx('ui'); me.emote('pickup'); show();
  }
  function load() {
    const r = RECIPES[ri]; mix = {}; heated = stirred = false; fire.visible = false; tries = 0;
    R.board(`Công thức ${ri + 1}/5 · ${r.n}`, r.line); hud.info(`Công thức <b>${ri + 1}</b>/5`); bar(); show();
  }
  async function check() {
    if (busy || done) return; const r = RECIPES[ri]; const errs = [];
    for (const [k, q] of Object.entries(r.parts)) if ((mix[k] || 0) !== q) errs.push(`${ING[k].n}: cần ${ING[k].solid ? q + ' thìa' : frac(q) + ' cốc'}, đang có ${ING[k].solid ? (mix[k] || 0) + ' thìa' : frac(mix[k] || 0)}`);
    for (const k of Object.keys(mix)) if (!r.parts[k]) errs.push(`${ING[k].n} không có trong công thức`);
    if (r.heat && !heated) errs.push('chưa đun ấm');
    if (r.stir && !stirred) errs.push('chưa khuấy tan');
    if (errs.length) { tries++; api.sfx('ui'); me.emote('no'); hud.msg(`❌ Chưa đúng: ${errs.slice(0, 2).join('; ')}.<br>💡 ${r.tip}`, 5000); return; }
    busy = true; const herbs = Object.keys(r.parts).filter(k => ING[k].herb), own = herbs.length && herbs.every(k => herbLent[k] === false);
    const pts = Math.max(8, 21 - tries * 5) + (own ? 5 : 0); score += pts; hud.score(score); api.sfx('win'); me.emote('cheer');
    hud.msg(`✨ <b>${r.n}</b> thành công! +${pts}${own ? ' (có thảo dược nhà kính của em: +5)' : herbs.length ? ' — cô cho mượn lọ mẫu; trồng ở 🌱 Nhà kính để có thảo dược riêng!' : ''}<br>${r.fact}`, 5200);
    await wait(5400); if (!root.parent) return;
    if (QUIZ[ri]) { hud.msg('', 0); if (await ask(api, QUIZ[ri])) { score += 13; hud.score(score); } if (!root.parent) return; }
    busy = false;
    if (++ri < RECIPES.length) load();
    else { done = true; hud.clearBar(); finish(ctx, api, { score, max: 144, title: 'Lớp Pha Chế', text: `Em đã pha đúng 5 công thức trong ${Math.floor(time / 60)} phút ${Math.floor(time % 60)} giây.` }); }
  }
  hud.score(0); load();
  return {
    update(dt, t) {
      if (!done) { time += dt; hud.time(time); }
      if (heated) { fire.scale.set(1 + Math.sin(t * 13) * 0.1, 1 + Math.sin(t * 21) * 0.15, 1); liq.position.y += Math.sin(t * 8) * 0.002; }
      if (stirT > 0) { stirT -= dt; piv.rotation.y += dt * 8; }
      if (grains.visible) grains.rotation.y += dt;
    },
    dispose() { cleanup(); },
  };
}
