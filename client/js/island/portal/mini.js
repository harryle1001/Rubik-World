// portal/mini.js — Lớp "Đảo Rubik – Mini" cho cổng game (chỉ nạp trong bản build-portal.sh; bản đầy đủ không dùng file này).
// • Chơi một mình, không server, không đăng nhập (tự vào chế độ khách, tiến độ lưu localStorage 'mini.story').
// • Chương 1 "Khối Rubik Tri Thức": khối Rubik trên quảng trường vỡ thành 7 mảnh bay vào 7 mini game → hoàn thành đủ 7 → màn kết thúc
//   (nút "Chơi bản đầy đủ" chỉ khi cổng cho phép link ngoài). Mini game khác: khoá 🔒, chỉ có ở bản đầy đủ.
// • SDK (portal.js): tải xong → gameLoadingFinished + gameplayStart; quảng cáo giữa màn CHỈ khi bấm Chơi lại/Thoát ở thẻ kết quả
//   (không bao giờ giữa lúc học); 💡 Gợi ý có thưởng (tuỳ chọn) trong mini game; tự tắt tiếng khi quảng cáo / mất focus / ẩn tab.
// • Song ngữ: tiếng Việt + bộ chữ tiếng Anh cơ bản (i18n.js), nút 🌐 đổi ngôn ngữ.
// Kích thước theo φ: bo 13/21, đệm 13/21, chữ 13/16/21, thẻ rộng 377 (Fibonacci).
import * as THREE from 'three';
import { portal } from './portal.js';
import { LANG, tr, startI18n, setLang } from './i18n.js';
import { doorKey } from '../mg/host.js';
import { TOWN_Y } from '../layout.js';
portal.loadingStart();

const EN = LANG === 'en', T = (vi, en) => EN ? en : vi;
// 7 mảnh = 7 mini game có màn kết thúc (api.end). Gợi ý: mẹo học tập, mở bằng quảng cáo có thưởng (nếu cổng có).
export const GAMES = [
  { k: 'rubik', ic: '🧊', c: '#e8443a', vi: 'Phòng Rubik 3D', en: 'Rubik 3D Room', hv: 'Giải từng tầng: tầng trên → tầng giữa → tầng cuối. Mỗi lần xoay chỉ đổi 1 mặt.', he: 'Solve layer by layer: top → middle → last. Each turn changes only one face.' },
  { k: 'caro', ic: '❌', c: '#f0a23a', vi: 'Cờ caro khổng lồ', en: 'Giant Tic-tac-toe', hv: 'Chặn ngay khi đối thủ có 3 quân liền nhau không bị chặn hai đầu.', he: 'Block as soon as the opponent has 3 in a row that is open at both ends.' },
  { k: 'chess', ic: '♟️', c: '#f4d35e', vi: 'Cờ vua khổng lồ', en: 'Giant Chess', hv: 'Khai cuộc: đưa tốt giữa lên, ra mã và tượng, nhập thành sớm để vua an toàn.', he: 'Opening: push a center pawn, develop knights and bishops, castle early.' },
  { k: 'reader', ic: '🎤', c: '#3d8f4a', vi: 'Hội trường danh nhân', en: 'Hall of Great People', hv: 'Nghe kỹ năm sinh và việc làm lớn nhất của danh nhân — câu hỏi thường hỏi về hai ý đó.', he: 'Listen for the birth year and the greatest deed — the questions usually ask about those.' },
  { k: 'academy', ic: '🔌', c: '#3a7bd5', vi: 'Lắp mạch điện', en: 'Build a Circuit', hv: 'Dòng điện cần một vòng kín: pin → dây → bóng đèn → dây → quay về pin.', he: 'Current needs a closed loop: battery → wire → bulb → wire → back to battery.' },
  { k: 'garden', ic: '🌱', c: '#8bc34a', vi: 'Khu vườn của em', en: 'My Garden', hv: 'Cây cần đủ 4 thứ: nước, ánh sáng, đất tốt và không khí.', he: 'Plants need 4 things: water, sunlight, good soil and air.' },
  { k: 'balloon', ic: '🎈', c: '#9b59b6', vi: 'Đua khinh khí cầu', en: 'Balloon Race', hv: 'Khí nóng nhẹ hơn khí lạnh nên bóng bay lên; thả bớt lửa để hạ xuống.', he: 'Hot air is lighter than cold air, so the balloon rises; less flame to descend.' },
];
const KEYS = new Set(GAMES.map(g => g.k)), SKEY = 'mini.story';
const load = () => { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } };

export function createMini(ctx) {
  const st = Object.assign({ got: {}, intro: false, done: false }, load());
  const save = () => { try { localStorage.setItem(SKEY, JSON.stringify(st)); } catch (e) {} };
  const n = () => GAMES.filter(g => st.got[g.k]).length;
  const css = document.createElement('style');
  css.textContent = `#accChip,#accBox,a.dlc[href]{display:none!important}
#miniChip{order:0;padding:5px 13px;border-radius:13px;border:2px solid #ffd36e;background:#1b1626cc;color:#fff;font:800 13px/1.3 system-ui;cursor:pointer;white-space:nowrap}
#miniChip b{color:#ffd36e}body.mg-on #miniChip,body.rs-modal #miniChip{display:none}
#miniBox{position:fixed;inset:0;z-index:41;display:grid;place-items:center;background:#0a1222c4;padding:13px}
#miniBox .card{width:min(100%,377px);max-height:89vh;overflow:auto;box-sizing:border-box;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:21px;border-top:8px solid #f0a23a;box-shadow:0 13px 34px #0008;font:16px/1.5 system-ui}
#miniBox h3{margin:0 0 8px;font-size:21px}#miniBox p{margin:0 0 13px;font-size:15px}#miniBox small{opacity:.7;font-size:13px}
#miniBox .cube{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin:13px 0}#miniBox .cube i{aspect-ratio:1;border-radius:8px;background:#e4d7bd;display:grid;place-items:center;font-style:normal;font-size:16px}
#miniBox .g{display:grid;gap:8px}#miniBox button{min-height:44px;padding:10px 13px;border-radius:13px;border:2px solid transparent;background:#efe3cc;color:#3a2a1a;font:700 15px system-ui;text-align:left;cursor:pointer;touch-action:manipulation}
#miniBox button.ok{background:#d9f0d0}#miniBox button.pri{background:#f0a23a;text-align:center;width:100%;margin-top:13px;font-weight:800}
#miniBox .row{display:flex;gap:8px}#miniBox .row button{flex:1;text-align:center}
#miniHint{position:fixed;left:50%;top:21%;transform:translateX(-50%);z-index:42;width:min(90vw,377px);background:#fff8ec;color:#3a2a1a;border-radius:13px;padding:13px 21px;border-left:8px solid #f4d35e;font:600 15px/1.5 system-ui;box-shadow:0 8px 21px #0007}`;
  document.head.appendChild(css);

  // ---------- chế độ khách, không link ngoài ----------
  if (ctx.account && !ctx.account.profile) ctx.account.playGuest();
  document.querySelectorAll('a.dlc').forEach(a => a.removeAttribute('href'));

  // ---------- khoá mini game ngoài 7 mảnh ----------
  const mg = ctx.mg, start0 = mg.start.bind(mg);
  const locked = () => ctx.toast(T('🔒 Mini game này có trong <b>bản đầy đủ</b> của Đảo Rubik. Bản Mini có 7 thử thách — mở 🧩 để xem!', '🔒 This mini game is in the <b>full version</b>. The Mini edition has 7 challenges — open 🧩 to see them!'));
  mg.start = (key, door, o) => { if (!KEYS.has(key)) { locked(); return false; } return start0(key, door, o); };
  if (ctx.school && ctx.school.enter) { const en = ctx.school.enter; ctx.school.enter = q => { const k = doorKey(ctx, q.d); if (k && ctx.miniGames[k] && !KEYS.has(k)) return locked(); return en(q); }; }   // cửa game bị khoá: báo ngay, bỏ phần chủ trò giới thiệu
  if (ctx.playMini) { const pm = ctx.playMini; ctx.playMini = (key, o) => KEYS.has(key) ? pm(key, o) : (locked(), null); }
  // menu 🎮 Mini game → bảng chương truyện
  const bMenu = document.getElementById('bMenu'); if (bMenu) { bMenu.textContent = '🧩 ' + T('Chương 1 · 7 thử thách', 'Chapter 1 · 7 challenges'); bMenu.onclick = () => panel(); }

  // ---------- hoàn thành 1 game (thẻ kết quả hiện) → nhận mảnh ----------
  let ended = false;
  const card = document.querySelector('#mgHud .mg-card');
  if (card) new MutationObserver(() => {
    if (card.hidden || !mg.active) return; ended = true; const k = mg.key; if (!KEYS.has(k) || st.got[k]) return;
    st.got[k] = Date.now(); save(); chip(); const g = GAMES.find(x => x.k === k);
    card.querySelector('p')?.insertAdjacentHTML('beforeend', `<br>🧩 <b>${T('Nhận mảnh Rubik', 'Rubik piece found')} ${n()}/7</b> ${g.ic}`);
    if (n() === 7 && !st.done) { st.done = true; save(); setTimeout(() => { if (!mg.active) ending(); else pendingEnd = true; }, 600); }
  }).observe(card, { attributes: true, attributeFilter: ['hidden'] });
  let pendingEnd = false;
  // giữa các màn: bấm Chơi lại / Thoát sau thẻ kết quả → quảng cáo giữa màn (cổng tự giới hạn tần suất)
  const wrapBreak = name => { const f = mg[name].bind(mg); mg[name] = async (...a) => { if (ended) { ended = false; await portal.commercialBreak(); } const r = f(...a); if (name === 'exit' && pendingEnd) { pendingEnd = false; setTimeout(ending, 800); } return r; }; };
  wrapBreak('restart'); wrapBreak('exit');
  const s0 = mg.start; mg.start = (...a) => { ended = false; const r = s0(...a); if (r !== false) setTimeout(hintBtn, 300); return r; };

  // ---------- 💡 Gợi ý có thưởng trong mini game (chỉ khi cổng hỗ trợ) ----------
  function hintBtn() {
    const bar = document.querySelector('#mgHud .mg-bar'), g = GAMES.find(x => x.k === mg.key); if (!bar || !g || !portal.rewardedOk || bar.querySelector('.mini-hint')) return;
    const b = document.createElement('button'); b.className = 'sm mini-hint'; b.textContent = '💡🎬'; b.title = T('Xem quảng cáo để nhận gợi ý', 'Watch an ad for a hint');
    b.onclick = async () => { b.disabled = true; const ok = await portal.rewardedBreak(); b.disabled = false; if (ok) showHint(g); };
    bar.appendChild(b);
  }
  function showHint(g) { let h = document.getElementById('miniHint'); if (!h) { h = document.createElement('div'); h.id = 'miniHint'; document.body.appendChild(h); } h.innerHTML = `💡 ${EN ? g.he : g.hv}`; h.hidden = false; clearTimeout(h._t); h._t = setTimeout(() => h.hidden = true, 8000); }

  // ---------- HUD: chip 🧩 n/7 ----------
  const row = document.getElementById('chipRow') || document.body;
  const ch = document.createElement('div'); ch.id = 'miniChip'; ch.setAttribute('role', 'button'); ch.tabIndex = 0; ch.onclick = () => panel(); ch.onkeydown = e => { if (e.key === 'Enter') panel(); };
  row.prepend(ch);
  function chip() { ch.innerHTML = `🧩 ${T('Mảnh Rubik', 'Rubik pieces')} <b>${n()}/7</b>`; }
  chip();

  // ---------- bảng (cốt truyện / danh sách thử thách / kết thúc) ----------
  const box = document.createElement('div'); box.id = 'miniBox'; box.hidden = true; box.setAttribute('data-noi18n', ''); document.body.appendChild(box);
  const close = () => { box.hidden = true; ctx.player.frozen = false; portal.gameplayStart(); };
  const show = html => { box.innerHTML = `<div class="card">${html}</div>`; box.hidden = false; ctx.player.frozen = true; portal.gameplayStop(); };
  const cube = () => `<div class="cube">${GAMES.map(g => `<i style="${st.got[g.k] ? `background:${g.c}` : ''}">${st.got[g.k] ? g.ic : '?'}</i>`).join('')}</div>`;
  const langBtn = `<button data-a="lang">🌐 ${EN ? 'Tiếng Việt' : 'English'}</button>`;
  function intro() {
    show(`<h3>📜 ${T('Chương 1 · Khối Rubik Tri Thức', 'Chapter 1 · The Rubik Cube of Knowledge')}</h3>
<p>${T('Đêm qua một cơn gió lớn thổi qua Đảo Rubik. <b>Khối Rubik Tri Thức</b> trên quảng trường vỡ thành <b>7 mảnh</b>, bay vào 7 phòng thử thách quanh trường!',
  'Last night a great wind swept over Rubik Island. The <b>Rubik Cube of Knowledge</b> on the plaza broke into <b>7 pieces</b> that flew into 7 challenge rooms around the school!')}</p>
<p>${T('Thầy Hiệu trưởng nhờ em: hoàn thành mỗi thử thách để nhận lại 1 mảnh. Đủ 7 mảnh, khối Rubik sẽ sáng trở lại.', 'The Headmaster needs your help: finish each challenge to win back a piece. With all 7, the cube will shine again.')}</p>
${cube()}<div class="row">${langBtn}<button class="pri" data-a="list" style="margin:0">▶ ${T('Bắt đầu', 'Start')}</button></div>`);
    st.intro = true; save();
  }
  function panel() {
    if (mg.active) return;
    show(`<h3>🧩 ${T('Chương 1 · 7 thử thách', 'Chapter 1 · 7 challenges')}</h3><small>${T('Chạm một thử thách để tới đó và chơi.', 'Tap a challenge to go there and play.')}</small>${cube()}
<div class="g">${GAMES.map(g => `<button data-k="${g.k}" class="${st.got[g.k] ? 'ok' : ''}">${g.ic} ${EN ? g.en : g.vi} ${st.got[g.k] ? '✅' : ''}</button>`).join('')}</div>
<div class="row" style="margin-top:13px">${langBtn}<button data-a="story">📜 ${T('Cốt truyện', 'Story')}</button></div><button class="pri" data-a="x">${T('Khám phá đảo', 'Explore the island')}</button>`);
  }
  function ending() {
    const full = portal.canLink ? `<button class="pri" data-a="full">🌍 ${T('Chơi bản đầy đủ', 'Play the full version')}</button>` : `<p><small>${T('Bản đầy đủ có hơn 30 mini game, Học viện Pha Lê, tàu hoả, lặn biển và chơi cùng bạn bè. Tìm "Đảo Rubik" để chơi!', 'The full version has 30+ mini games, the Crystal Academy, a steam train, diving and playing with friends. Search for "Rubik Island"!')}</small></p>`;
    show(`<h3>🎉 ${T('Hoàn thành Chương 1!', 'Chapter 1 complete!')}</h3>${cube()}
<p>${T('Khối Rubik Tri Thức đã sáng trở lại. Cảm ơn em đã giúp Trường Rubik! Chương 2 — <b>Học viện Pha Lê</b> bên kia biển — đang chờ em.', 'The Rubik Cube of Knowledge shines again. Thank you for saving Rubik School! Chapter 2 — the <b>Crystal Academy</b> across the sea — is waiting for you.')}</p>
${full}<button class="pri" data-a="x" style="background:#efe3cc">${T('Tiếp tục khám phá', 'Keep exploring')}</button>`);
    ctx.sfx && ctx.sfx('win');
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a, k = b.dataset.k;
    if (a === 'lang') return setLang(EN ? 'vi' : 'en');
    if (a === 'list') return panel(); if (a === 'story') return intro(); if (a === 'full') { portal.openFull(); return; }
    if (a === 'x') return close();
    if (k) { close(); const sc = ctx.school, q = mg.doorOf && mg.doorOf(k);
      if (q && sc && sc.enter) { ctx.player.teleport(q.x, q.z + 1.5); ctx.player.pos.y = TOWN_Y; setTimeout(() => sc.enter(q), 300); } else mg.start(k, null); }
  });

  // ---------- âm thanh: tắt khi quảng cáo / mất focus / ẩn tab ----------
  let adOn = false;
  const ac = () => { try { return THREE.AudioContext.getContext(); } catch (e) { return null; } };
  const sync = () => { const c = ac(); if (!c) return; const want = !adOn && !document.hidden && document.hasFocus(); if (want && c.state === 'suspended' && ctx.audio && ctx.audio.on) c.resume().catch(() => {}); else if (!want && c.state === 'running') c.suspend().catch(() => {}); };
  portal.onPause(on => { adOn = on; sync(); });
  addEventListener('blur', sync); addEventListener('focus', sync); document.addEventListener('visibilitychange', sync);

  // ---------- tải xong → báo cổng, bắt đầu chơi, mở cốt truyện lần đầu ----------
  const wait = setInterval(() => {
    if (ctx.loading.veil) return; clearInterval(wait);
    portal.loadingFinished(); portal.gameplayStart(); sync();
    if (!st.intro) setTimeout(() => { if (!mg.active && box.hidden) intro(); }, 2100);
  }, 250);
  startI18n();
  window.__mini = { st, panel, intro, ending, GAMES };
  return { panel, ending };
}
export { tr };
