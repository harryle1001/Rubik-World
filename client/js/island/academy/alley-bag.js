// academy/alley-bag.js — 🎒 TÚI ĐỒ: mọi món mua ở Phố Phép Thuật đều dùng được.
// Đũa (đổi lõi → đổi màu phép), áo choàng/mũ/chổi (mặc/cởi), thú cưng (gọi/cất), sách cũ (mở câu đố mới, lần đầu đúng +3 xu),
// pháo hoa hoá học (bắn màu theo kim loại thật), nhạc cụ (chơi giai điệu ngũ cung), la bàn (kim chỉ Bắc trên màn hình), đồng hồ bỏ túi.
import * as THREE from 'three';
import { CAPES, HATS, BROOMS, PETS } from './wear.js';
import { CORES } from './magic.js';
import { SHOP_TALK } from './alley-shops.js';

// pháo hoa: màu ngọn lửa thật của muối kim loại (thí nghiệm thử màu ngọn lửa)
export const FIREWORKS = [
  { id: 'fw-na', name: 'Pháo Natri', col: '#ffc531', fact: 'Muối <b>natri</b> cho lửa vàng cam — như khi rắc muối ăn vào bếp ga.' },
  { id: 'fw-cu', name: 'Pháo Đồng', col: '#3ee07a', fact: 'Muối <b>đồng</b> cho lửa xanh lục.' },
  { id: 'fw-sr', name: 'Pháo Stronti', col: '#ff3b4e', fact: 'Muối <b>stronti</b> cho lửa đỏ thắm.' },
  { id: 'fw-k', name: 'Pháo Kali', col: '#b07cff', fact: 'Muối <b>kali</b> cho lửa tím nhạt.' },
];
// nhạc cụ: mỗi cây 1 giai điệu ngũ cung (nửa cung so với Đô 262 Hz) + âm sắc
export const INSTRUMENTS = [
  { id: 'ins-sao', name: '🪈 Sáo trúc', tune: [12, 14, 16, 19, 21, 19, 16, 14, 12], dur: 0.5, vol: 0.09, fact: 'Sáo kêu nhờ <b>cột không khí</b> trong ống rung; bịt lỗ làm cột khí dài ra → tiếng trầm hơn.' },
  { id: 'ins-bau', name: '🪕 Đàn bầu nhỏ', tune: [7, 9, 12, 9, 7, 4, 2, 0], dur: 0.9, vol: 0.1, fact: '<b>Đàn bầu</b> chỉ một dây; người chơi chạm nhẹ “điểm nút” để tạo <b>bồi âm</b> trong vắt.' },
  { id: 'ins-trong', name: '🥁 Trống cơm', tune: [-12, -12, -5, -12, -12, -5, -7, -12], dur: 0.32, vol: 0.14, fact: 'Mặt <b>trống cơm</b> xưa được dán cơm nắm để chỉnh độ căng — căng hơn thì tiếng cao hơn.' },
];
export const GADGETS = [
  { id: 'compass', name: '🧭 La bàn phép', price: 13, shop: 'map' },
  { id: 'vnmap', name: '🗺️ Bản đồ Việt Nam', price: 8, shop: 'map' },
  { id: 'watch', name: '⌚ Đồng hồ bỏ túi', price: 13, shop: 'clock' },
];

const CSS = `#alBagBtn{position:fixed;right:12px;top:calc(env(safe-area-inset-top) + 68px);z-index:26;width:42px;height:42px;border-radius:50%;border:1px solid #fff5;background:#1b1626cc;color:#fff;font-size:21px;line-height:40px;text-align:center;padding:0;box-shadow:0 3px 13px #0005}
#alBag{position:fixed;right:12px;top:calc(env(safe-area-inset-top) + 118px);z-index:27;width:min(88vw,340px);max-height:min(62vh,520px);overflow:auto;background:#141022f2;color:#f7ecd0;border:1px solid #ffe3a066;border-radius:16px;padding:11px 13px;font:600 13px/1.45 system-ui;box-shadow:0 8px 34px #0007}
#alBag h4{margin:0 0 6px;font:800 15px Georgia,serif;color:#ffe3a0}#alBag .sec{margin:8px 0 2px;color:#c9b98f;font:700 12px system-ui;letter-spacing:.05em;text-transform:uppercase}
#alBag .it{display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid #ffffff14}#alBag .it span{flex:1}#alBag i{width:16px;height:16px;border-radius:50%;flex:none;border:1px solid #fff6}
#alBag button{border:1px solid #fff4;background:#2a2340;color:#fff;border-radius:10px;padding:6px 9px;font:700 12px system-ui;min-height:32px}#alBag button.on{background:#2c6455}
#alCompass{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 8px);transform:translateX(-50%);z-index:25;width:55px;height:55px;border-radius:50%;background:#1b1626cc;border:2px solid #d4a24a;pointer-events:none}
#alCompass b{position:absolute;left:50%;top:50%;width:4px;height:42px;margin:-21px 0 0 -2px;background:linear-gradient(#ff4b4b 50%,#f3f3f3 50%);border-radius:2px}#alCompass s{position:absolute;left:0;right:0;top:-1px;text-align:center;font:800 10px system-ui;color:#ffe3a0;text-decoration:none}`;

export function createBag(ctx, magic) {
  let btn = null, el = null, compass = null, playing = false;
  const W = () => ctx.wear;
  const st = (() => { try { return JSON.parse(localStorage.getItem('academy.bagx')) || {}; } catch (e) { return {}; } })();   // { solved: [], compass: bool }
  const save = () => { try { localStorage.setItem('academy.bagx', JSON.stringify(st)); } catch (e) {} };
  st.solved = st.solved || [];
  const css = () => { if (!document.getElementById('alBagCss')) { const s = document.createElement('style'); s.id = 'alBagCss'; s.textContent = CSS; document.head.appendChild(s); } };
  function ensureBtn() {
    if (btn || !W()) return; css();
    btn = document.createElement('button'); btn.id = 'alBagBtn'; btn.title = 'Túi đồ'; btn.textContent = '🎒';
    btn.onclick = () => { ctx.sfx && ctx.sfx('ui'); el ? close() : open(); }; document.body.appendChild(btn);
  }
  const close = () => { if (el) { el.remove(); el = null; } };
  const has = id => W().own(id);

  // ---------- hành động ----------
  function firework(f) {
    if (W().count(f.id) <= 0) return;
    W().addItem(f.id, -1); close();
    const p = ctx.player.pos, up = new THREE.Vector3(0, 1, 0);
    magic.burst(p.clone().setY(p.y + 1.4), up, f.col, 13, 13, 0.08);             // vệt bay lên
    setTimeout(() => { magic.burst(p.clone().setY(p.y + 9), up, f.col, 55, 6, 1); ctx.sfx && ctx.sfx('magic'); }, 650);   // nở bung
    ctx.toast(`🎆 ${f.name}: ${f.fact}`, 5000);
  }
  function play(ins) {
    if (playing || !ctx.note) return; playing = true; close();
    ins.tune.forEach((n, i) => setTimeout(() => { ctx.note(262 * 2 ** (n / 12), ins.vol, ins.dur * 1.6); if (i === ins.tune.length - 1) playing = false; }, i * ins.dur * 1000 * 0.62));
    const p = ctx.player.pos; magic.burst(p.clone().setY(p.y + 1.6), new THREE.Vector3(0, 1, 0), '#ffe3a0', 13, 2, 1);
    ctx.toast(`${ins.name} 🎶 ${ins.fact}`, 5000);
  }
  function setCompass(on) {
    st.compass = on; save();
    if (on && !compass) { compass = document.createElement('div'); compass.id = 'alCompass'; compass.innerHTML = '<s>B</s><b></b>'; document.body.appendChild(compass); css(); }
    if (!on && compass) { compass.remove(); compass = null; }
  }
  function puzzle(i) {
    const b = SHOP_TALK.oldbook.books[i]; close();
    magic.ask(b[2], () => {
      if (!st.solved.includes(i)) { st.solved.push(i); save(); ctx.account && ctx.account.addCoins(3); ctx.toast(`📜 Giải xong <b>${b[0]}</b>! +3 🪙`, 3500); }
      else ctx.toast(`📜 Đúng rồi! Em đã thuộc <b>${b[0]}</b>.`, 2500);
    }, `📜 ${b[0]} — câu đố mới`);
  }
  function clockQuiz() {
    close();
    const h = ctx.sky && ctx.sky.state ? ctx.sky.state.hour : 12, hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 5) * 5;
    const fmt = (H, M) => `${H} giờ${M ? ' ' + M + ' phút' : ''}`, ok = fmt(hh, mm);
    const wrong = [fmt((hh + 1) % 24, mm), fmt(hh, (mm + 30) % 60), fmt((hh + 11) % 24, mm)].filter(x => x !== ok);
    magic.ask({ icon: '⌚', q: `Đồng hồ bỏ túi: kim ngắn gần số <b>${hh % 12 || 12}</b>, kim dài chỉ số <b>${mm / 5 || 12}</b>${hh >= 12 ? ' (buổi chiều/tối)' : ' (buổi sáng)'}. Bây giờ là mấy giờ?`, choices: [ok, ...wrong.slice(0, 3)], a: 0, explain: `Kim dài ở số ${mm / 5 || 12} = ${mm} phút → <b>${ok}</b>.` }, () => { magic.setMana(magic.mana + 8); ctx.toast('⌚ Đọc giờ giỏi lắm! +8 năng lượng phép', 2500); }, '⌚ Đọc giờ trên đồng hồ bỏ túi');
  }

  function open() {
    close(); css(); const w = W(); if (!w) return;
    const eq = w.eq, rows = [];
    const sec = t => rows.push(`<div class="sec">${t}</div>`);
    const row = (label, btns, col) => rows.push(`<div class="it">${col ? `<i style="background:${col}"></i>` : ''}<span>${label}</span>${btns}</div>`);
    const B = (act, t, on) => `<button data-a="${act}" class="${on ? 'on' : ''}">${t}</button>`;
    if (magic.hasWand) { sec('🪄 Đũa phép'); const c = CORES.find(x => x.id === magic.wand.core); row(`Lõi pha lê ${c.name} — màu phép`, B('spell', '✨ Thử'), c.col); }
    const wear = [...CAPES.map(x => ['cape', x]), ...HATS.map(x => ['hat', x]), ...BROOMS.map(x => ['broom', x]), ...PETS.map(x => ['pet', x])].filter(([, x]) => has(x.id));
    if (wear.length) { sec('🧥 Đồ mặc & thú cưng'); wear.forEach(([sl, x]) => row(x.name, B(`eq:${sl}:${x.id}`, eq[sl] === x.id ? '✔ Đang dùng' : sl === 'pet' ? 'Gọi' : 'Mặc', eq[sl] === x.id), x.col)); }
    const fws = FIREWORKS.filter(f => w.count(f.id) > 0), ins = INSTRUMENTS.filter(x => has(x.id)), gad = GADGETS.filter(x => has(x.id));
    if (fws.length) { sec('🎆 Pháo hoa phép'); fws.forEach(f => row(`${f.name} ×${w.count(f.id)}`, B(`fw:${f.id}`, 'Bắn'), f.col)); }
    if (ins.length) { sec('🎻 Nhạc cụ'); ins.forEach(x => row(x.name, B(`ins:${x.id}`, 'Chơi'))); }
    if (gad.length) { sec('🧰 Đồ dùng'); gad.forEach(x => row(x.name, x.id === 'compass' ? B('compass', st.compass ? '✔ Đang bật' : 'Bật', st.compass) : x.id === 'watch' ? B('watch', 'Xem giờ') : B('vnmap', 'Xem'))); }
    const books = SHOP_TALK.book.books.map((b, i) => [i, b]).filter(([i]) => has('book' + i)), olds = SHOP_TALK.oldbook.books.map((b, i) => [i, b]).filter(([i]) => has('old' + i));
    if (books.length || olds.length) { sec('📚 Sách'); books.forEach(([i, b]) => row(`📖 ${b[0]}`, B(`read:${i}`, 'Đọc'))); olds.forEach(([i, b]) => row(`📜 ${b[0]}${st.solved.includes(i) ? ' ✔' : ''}`, B(`puz:${i}`, 'Giải đố'))); }
    if (rows.length === 0) rows.push('<p>Túi còn trống — ghé các tiệm ở Phố Phép Thuật nhé! Mỗi món mua bằng xu + 1 câu đố.</p>');
    el = document.createElement('div'); el.id = 'alBag';
    el.innerHTML = `<h4>🎒 Túi đồ</h4>${rows.join('')}<div style="text-align:right;margin-top:8px"><button data-a="x">Đóng</button></div>`;
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; ctx.sfx && ctx.sfx('ui');
      const [k, a1, a2] = b.dataset.a.split(':');
      if (k === 'x') return close();
      if (k === 'spell') { close(); const p = ctx.player.pos; magic.burst(p.clone().setY(p.y + 1.3), new THREE.Vector3(0, 1, 0), CORES.find(x => x.id === magic.wand.core).col, 34, 4, 1); return; }
      if (k === 'eq') { w.equip(a1, eq[a1] === a2 ? null : a2); return open(); }
      if (k === 'fw') return firework(FIREWORKS.find(f => f.id === a1));
      if (k === 'ins') return play(INSTRUMENTS.find(x => x.id === a1));
      if (k === 'compass') { setCompass(!st.compass); return open(); }
      if (k === 'watch') return clockQuiz();
      if (k === 'vnmap') { close(); return ctx.toast('🗺️ Việt Nam: 63 tỉnh thành, dài ≈ 1.650 km từ Bắc vào Nam, chỗ hẹp nhất ở Quảng Bình chỉ ≈ 50 km. Hai đồng bằng lớn: sông Hồng và sông Cửu Long.', 8000); }
      if (k === 'read') { close(); const bk = SHOP_TALK.book.books[+a1]; return ctx.toast(`📖 <b>${bk[0]}</b><br>${bk[1]}`, 9000); }
      if (k === 'puz') return puzzle(+a1);
    };
    document.body.appendChild(el);
  }
  if (st.compass) setTimeout(() => setCompass(true), 0);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); if (e.code === 'KeyI' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) el ? close() : open(); });
  function update() {
    if (!btn) ensureBtn();
    if (compass && ctx.player.cam) compass.firstElementChild.nextElementSibling.style.transform = `rotate(${(ctx.player.cam.yaw * 180 / Math.PI - 180).toFixed(1)}deg)`;
  }
  return { open, close, update, get isOpen() { return !!el; } };
}
