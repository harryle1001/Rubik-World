// lighthouse/keeper.js — ÔNG BẢY GÁC ĐÈN: kể chuyện biển + 5 nhiệm vụ học mà chơi (bảng DOM, không tốn WebGL).
//   🔦 Dẫn tàu về bến (xoay chùm đèn theo 8 hướng la bàn) · 🔍 Ánh sáng & thấu kính Fresnel · 📡 Mã Morse bằng đèn ·
//   🧭 La bàn & hải lý · 🌙 Thuỷ triều theo trăng thật (sky.state.moonPhase).
// Kích thước theo Fibonacci/φ: bảng rộng ≤ 377 px, bo 21, đệm 13/21, chữ 16 · 16φ ≈ 21 (tiêu đề), nút cao 55.
// api (index.js): { aim(bearing|null), flash(on), dirToMain, distMain, tide() } — điều khiển đèn thật trên tháp trong lúc chơi.
import { PHI } from '../layout.js';
import { qcard } from '../quiz-ui.js';

const LS = 'lighthouse.v1';
export const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };
export const save = v => { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {} };
export const DIR8 = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'], DIR8S = ['B', 'ĐB', 'Đ', 'ĐN', 'N', 'TN', 'T', 'TB'];
export const dirName = b => DIR8[((Math.round(b / (Math.PI / 4)) % 8) + 8) % 8];   // b: phương vị (0 = Bắc, quay theo chiều kim đồng hồ)

const STORIES = [
  '⛈️ <b>Đêm bão năm ấy</b>, sóng cao hơn nóc nhà. Một tàu cá mất phương hướng, bỗng thấy ánh đèn <b>chớp đều mỗi 6 giây rưỡi</b>. Thuyền trưởng reo lên: «Mũi Sóng đây rồi!» Mỗi ngọn hải đăng có một <b>nhịp chớp riêng</b>, như chữ ký bằng ánh sáng, nên người đi biển nhìn nhịp chớp là biết mình đang ở đâu.',
  '🏛️ Ngọn hải đăng nổi tiếng nhất thời cổ là <b>Pharos</b> ở thành Alexandria (Ai Cập), một trong <b>7 kỳ quan thế giới cổ đại</b>. Người xưa đốt lửa trên đỉnh tháp và dùng gương đồng hắt sáng ra biển. Hơn hai nghìn năm rồi, con người vẫn dùng ánh sáng để dẫn đường cho nhau.',
  '🇻🇳 Nước mình có bờ biển dài hơn <b>3 260 km</b> với gần một trăm ngọn hải đăng. <b>Hải đăng Kê Gà</b> (Bình Thuận) xây bằng đá hoa cương từ năm 1899, là một trong những ngọn đèn biển cổ nhất. <b>Mũi Đại Lãnh</b> (Phú Yên) là nơi đón ánh bình minh sớm nhất trên đất liền Việt Nam.',
  '🐢 Thấy mấy chú <b>rùa biển</b> nằm trên đá không? Rùa là động vật <b>biến nhiệt</b>: thân nhiệt đổi theo môi trường, nên chúng phơi nắng để sưởi ấm. Còn <b>hải âu</b> uống được cả nước mặn, vì có tuyến đặc biệt gần mắt giúp thải bớt muối ra ngoài.',
  '🌊 Cháu hỏi vì sao sóng vỗ vào đá lại <b>trắng xoá</b>? Sóng đập mạnh cuốn không khí vào nước, tạo ra hàng triệu <b>bong bóng li ti</b>. Bong bóng hắt ánh sáng đi mọi phía (tán xạ) nên mắt ta thấy màu trắng, giống như mây và bọt xà phòng vậy.',
];
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', G: '--.', H: '....', I: '..', N: '-.', O: '---', S: '...', T: '-', U: '..-' };
const WORDS = [['SOS', 'tín hiệu cấp cứu quốc tế'], ['BIEN', '«biển»'], ['TAU', '«tàu»']];
const SHIPS = ['Hải Âu', 'Sóng Bạc', 'Sao Mai', 'Cá Chuồn', 'Bình Minh'];
const PHASES = [[0.03, 'Trăng non (không trăng)', '🌑'], [0.22, 'Trăng lưỡi liềm đầu tháng', '🌒'], [0.28, 'Bán nguyệt đầu tháng', '🌓'], [0.47, 'Trăng khuyết đầu tháng', '🌔'], [0.53, 'Trăng tròn', '🌕'], [0.72, 'Trăng khuyết cuối tháng', '🌖'], [0.78, 'Bán nguyệt cuối tháng', '🌗'], [0.97, 'Trăng lưỡi liềm cuối tháng', '🌘'], [1.01, 'Trăng non (không trăng)', '🌑']];
export const moonInfo = p => { const q = PHASES.find(x => p < x[0]), spring = Math.abs(Math.cos(p * Math.PI * 2)); return { name: q[1], icon: q[2], spring, kind: spring > 0.7 ? 'triều cường' : spring < 0.3 ? 'triều kém' : 'triều trung bình' }; };

const CSS = `
#lhP{position:fixed;inset:0;z-index:41;display:flex;align-items:center;justify-content:center;background:#0a1220a8;padding:13px;box-sizing:border-box}
#lhP .c{position:relative;width:min(100%,377px);max-height:calc(100dvh - 26px);overflow:auto;box-sizing:border-box;padding:21px 21px 13px;border-radius:21px;background:linear-gradient(160deg,#fbf4e2,#efe3c8);color:#3d2b3f;font:500 16px/1.5 system-ui;box-shadow:0 13px 34px #0009,inset 0 0 0 2px #d4a24a}
#lhP h3{margin:0 34px 8px 0;font:900 21px/1.25 system-ui;color:#93402a}
#lhP .x{position:absolute;right:8px;top:8px;width:44px;height:44px;border:0;border-radius:50%;background:#3d2b3f14;font:900 18px system-ui;color:#3d2b3f}
#lhP .b{margin:0 0 13px}
#lhP .a{display:grid;gap:8px}
#lhP .a.two{grid-template-columns:1fr 1fr}
#lhP button.k{min-height:55px;padding:8px 13px;border:0;border-radius:13px;background:#fff;box-shadow:0 2px 0 #c9b98f,inset 0 0 0 1.5px #d9c8a6;font:700 16px/1.25 system-ui;color:#3d2b3f;text-align:left;touch-action:manipulation}
#lhP button.k.p{background:#c45a3a;color:#fff;box-shadow:0 2px 0 #93402a;text-align:center}
#lhP button.k.ok{background:#dff0d2;box-shadow:0 2px 0 #9cc77f,inset 0 0 0 1.5px #9cc77f}
#lhP button.k.no{background:#f7d6cf}
#lhP button.k.c2{text-align:center}
#lhP button.k small{display:block;font-weight:500;opacity:.75}
#lhP canvas{display:block;width:100%;aspect-ratio:1;border-radius:13px;background:#0d1b2e;touch-action:none;margin-bottom:8px}
#lhP .ms{font:900 26px/1.3 ui-monospace,monospace;letter-spacing:3px;text-align:center;margin:5px 0}
#lhP .ms i{font-style:normal;opacity:.3}#lhP .ms b{color:#c45a3a}
#lhP .bulb{width:89px;height:89px;margin:8px auto;border-radius:50%;background:#5a5266;box-shadow:inset 0 0 0 5px #3a3344;transition:background .05s,box-shadow .05s}
#lhP .bulb.on{background:#fff3c4;box-shadow:0 0 34px 13px #ffe3a0,inset 0 0 0 5px #d4a24a}
#lhP .tb{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;font:600 13px ui-monospace,monospace;margin:8px 0}
#lhP .tb span{background:#fff8;border-radius:5px;padding:2px 5px;white-space:nowrap}
#lhChip{position:fixed;left:50%;transform:translateX(-50%);top:calc(max(12px,env(safe-area-inset-top)) + 97px);z-index:26;padding:5px 13px;border-radius:21px;background:#1b1626d9;color:#f7ecd0;font:700 14px system-ui;white-space:nowrap;pointer-events:none;max-width:92vw;overflow:hidden;text-overflow:ellipsis}
#lhChip b{color:#ffd98a}
@media (max-width:609px){#lhChip{top:calc(max(12px,env(safe-area-inset-top)) + 204px)}}
`;

export function createKeeper(ctx, api) {
  const st = Object.assign({ done: {}, story: 0, best: 0 }, load());
  const css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
  const root = document.createElement('div'); root.id = 'lhP'; root.hidden = true;
  root.innerHTML = '<div class="c"><button class="x" aria-label="Đóng">✕</button><h3></h3><div class="b"></div><div class="a"></div></div>';
  document.body.appendChild(root);
  const $ = q => root.querySelector(q), H = $('h3'), B = $('.b'), A = $('.a');
  const chip = document.createElement('div'); chip.id = 'lhChip'; chip.hidden = true; document.body.appendChild(chip);
  let open = false, frozenBefore = false, cleanup = null, tick = null;
  const sfx = k => ctx.sfx && ctx.sfx(k);
  function show(on) {
    if (on === open) return; open = on; root.hidden = !on;
    if (on) { frozenBefore = ctx.player.frozen; ctx.player.frozen = true; document.body.classList.add('rs-modal'); }
    else { ctx.player.frozen = false; document.body.classList.remove('rs-modal'); stop(); api.aim(null); api.flash(null); }
  }
  function stop() { if (cleanup) { cleanup(); cleanup = null; } tick = null; }
  $('.x').onclick = () => show(false);
  root.addEventListener('pointerdown', e => { if (e.target === root) show(false); });
  addEventListener('keydown', e => { if (open && e.code === 'Escape') show(false); });
  /** vẽ 1 màn: tiêu đề, nội dung HTML, danh sách nút [{ t, f, cls }] */
  function page(title, html, btns, two) {
    stop(); H.innerHTML = title; B.innerHTML = html; A.className = 'a' + (two ? ' two' : ''); A.innerHTML = '';
    for (const q of btns) { const b = document.createElement('button'); b.className = 'k ' + (q.cls || ''); b.innerHTML = q.t; b.onclick = () => { sfx('ui'); q.f(b); }; A.appendChild(b); }
    show(true); $('.c').scrollTop = 0;
  }
  const finish = (id, stars, note) => { const first = !st.done[id]; st.done[id] = (st.done[id] || 0) + 1; save(st); if (first && ctx.reward) ctx.reward(stars, note); sfx(first ? 'win' : 'ok'); api.onDone && api.onDone(id, first); return first; };
  const TASKS = [['ship', '🔦 Dẫn tàu về bến', 'xoay đèn theo 8 hướng la bàn'], ['lens', '🔍 Ánh sáng & thấu kính', 'vì sao đèn chiếu xa thế?'], ['morse', '📡 Mã Morse bằng đèn', 'gửi tín hiệu chớp – tắt'], ['nav', '🧭 La bàn & hải lý', 'phương hướng trên biển'], ['tide', '🌙 Thuỷ triều theo trăng', 'trăng hôm nay, nước hôm nay']];
  const doneAll = () => TASKS.every(q => st.done[q[0]]);

  // ---------- menu chính ----------
  function menu(hello) {
    const n = TASKS.filter(q => st.done[q[0]]).length;
    page('👴 Ông Bảy gác đèn', hello || (n ? `«Cháu lại ra thăm ông đấy à! Đã xong <b>${n}/5</b> việc của người gác đèn${doneAll() ? ' — cháu là <b>Người gác đèn nhí</b> rồi đó' : ''}.»` : '«Chào cháu! Ông là <b>Bảy</b>, gác ngọn đèn Mũi Sóng này đã 34 năm. Tháp cao <b>34 m</b>, lên đỉnh phải leo đúng <b>144 bậc</b>. Cháu muốn nghe chuyện biển hay giúp ông một tay?»'),
      [{ t: `📖 Nghe chuyện biển <small>${st.story % STORIES.length + 1}/${STORIES.length}</small>`, f: story }, ...TASKS.map(([id, t, sub]) => ({ t: `${t}${st.done[id] ? ' ✔' : ''} <small>${sub}</small>`, cls: st.done[id] ? 'ok' : '', f: () => RUN[id]() }))]);
  }
  function story() { const s = STORIES[st.story % STORIES.length]; st.story++; save(st); page('📖 Chuyện biển của ông Bảy', s, [{ t: 'Kể nữa đi ông!', cls: 'p', f: story }, { t: '⬅ Quay lại', cls: 'c2', f: () => menu() }], true); }
  /** chuỗi câu hỏi trắc nghiệm: qs = [{ q, o: [..], a: chỉ số đúng, why }] → xong gọi end() */
  function quiz(title, qs, end, i = 0) {
    if (i >= qs.length) return end();
    const Q = qs[i], order = Q.o.map((t, k) => [t, k]).sort(() => Math.random() - 0.5);
    show(false);   // khung câu hỏi chung (quiz-ui.js): câu hỏi ngay trên đáp án, ✕/Esc thoát không mất gì
    qcard({ ava: '👴', title, chip: `${i + 1}/${qs.length}`, q: (Q.pre || '') + Q.q, choices: order.map(o => o[0]), a: order.findIndex(o => o[1] === Q.a), explain: Q.why, retry: true,
      next: i + 1 < qs.length ? 'Câu tiếp ➜' : 'Xong ➜', lock: ctx.player, onPick: ok => { sfx(ok === false ? 'bad' : 'ok'); } })
      .then(r => { if (r) quiz(title, qs, end, i + 1); });
  }
  const reward = (id, stars, note, text) => { const first = finish(id, stars, note); page('🎉 Hoàn thành!', text + (first ? `<br><br>⭐ <b>+${stars} sao</b>` : '') + (first && doneAll() ? '<br><br>🏅 Cháu đã làm đủ 5 việc: ông phong cháu là <b>Người gác đèn nhí</b>!' : ''), [{ t: '⬅ Về gặp ông Bảy', cls: 'p', f: () => menu() }]); };

  // ---------- 🔍 thấu kính ----------
  function lens() {
    page('🔍 Ánh sáng & thấu kính Fresnel', '<canvas width="377" height="233" style="aspect-ratio:377/233;background:#10233c"></canvas>«Ngọn đèn toả sáng <b>mọi phía</b> nên càng xa càng yếu. <b>Thấu kính</b> bẻ các tia sáng lại thành một <b>chùm song song</b>, nhờ thế đèn chiếu xa hàng chục cây số. Năm 1822, ông <b>Fresnel</b> nghĩ ra cách cắt thấu kính dày thành nhiều <b>vành lăng kính mỏng</b> xếp bậc thang: nhẹ hơn rất nhiều mà vẫn gom sáng tốt.»',
      [{ t: 'Cháu hiểu rồi, hỏi cháu đi ông! ➜', cls: 'p', f: () => quiz('🔍 Thấu kính', [
        { q: 'Ánh sáng truyền trong không khí theo đường nào?', o: ['Đường thẳng', 'Đường cong', 'Đường gấp khúc'], a: 0, why: 'Ánh sáng truyền theo <b>đường thẳng</b>, vì vậy mới có bóng đổ sắc nét sau vật chắn.' },
        { q: 'Thấu kính Fresnel làm gì với ánh đèn?', o: ['Gom các tia thành chùm song song chiếu xa', 'Đổi màu ánh sáng', 'Làm ngọn đèn nóng hơn'], a: 0, why: 'Tia sáng đi qua kính bị <b>bẻ hướng (khúc xạ)</b> và gom lại thành chùm song song.' },
        { q: 'Vì sao thấu kính Fresnel có nhiều vành bậc thang?', o: ['Để mỏng, nhẹ mà vẫn bẻ tia sáng như thấu kính dày', 'Để trang trí cho đẹp', 'Để chắn gió biển'], a: 0, why: 'Chỉ <b>bề mặt cong</b> mới bẻ tia sáng, phần thuỷ tinh dày bên trong không cần → cắt bỏ đi cho nhẹ.' },
      ], () => reward('lens', 1, 'Hải đăng: ánh sáng & thấu kính Fresnel', 'Lần tới leo lên buồng đèn, cháu nhìn kỹ các <b>vành kính xếp bậc</b> quanh ngọn đèn nhé: đó chính là thấu kính Fresnel.')) }, { t: '⬅ Quay lại', cls: 'c2', f: () => menu() }]);
    const cv = B.querySelector('canvas'), g = cv.getContext('2d'); let t = 0;
    const draw = () => {
      t += 0.016; g.clearRect(0, 0, 377, 233); const lx = 70, ly = 116, kx = 178;
      g.lineWidth = 2;
      for (let i = -4; i <= 4; i++) {   // tia từ đèn toả ra → qua kính thành song song
        const y = ly + i * 21, ph = (t * 0.6 + i * 0.07) % 1; g.strokeStyle = '#ffe3a0'; g.globalAlpha = 0.85;
        g.beginPath(); g.moveTo(lx, ly); g.lineTo(kx, y); g.lineTo(377, y); g.stroke();
        const d1 = Math.hypot(kx - lx, y - ly), L = d1 + 377 - kx, s = ph * L, px = s < d1 ? lx + (kx - lx) * s / d1 : kx + s - d1, py = s < d1 ? ly + (y - ly) * s / d1 : y;
        g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 3, 0, 7); g.fill();
      }
      for (let i = 3; i < 8; i++) { const a = i * 0.7 + 0.35; g.strokeStyle = '#ffe3a055'; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx - Math.cos(a - 2.6) * 55, ly + Math.sin(a - 2.6) * 55); g.stroke(); }
      g.fillStyle = '#bfeee6'; g.strokeStyle = '#d4a24a';   // thấu kính Fresnel: mắt bò ở giữa + các vành lăng kính
      g.beginPath(); g.ellipse(kx, ly, 9, 26, 0, 0, 7); g.fill(); g.stroke();
      for (const s of [-1, 1]) for (let i = 1; i <= 3; i++) { const y0 = ly + s * (26 + (i - 1) * 21), y1 = y0 + s * 19; g.beginPath(); g.moveTo(kx - 5, y0); g.lineTo(kx + 7, y0); g.lineTo(kx - 5, y1); g.closePath(); g.fill(); g.stroke(); }
      g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(lx, ly, 9 + Math.sin(t * 5) * 1.5, 0, 7); g.fill();
      g.fillStyle = '#f7ecd0'; g.font = '700 13px system-ui'; g.textAlign = 'center'; g.fillText('đèn', lx, ly + 30); g.fillText('thấu kính Fresnel', kx, 226); g.fillText('chùm sáng song song ➜', 300, 20);
    };
    const id = setInterval(draw, 33); draw(); cleanup = () => clearInterval(id);
  }

  // ---------- 🧭 la bàn & hải lý ----------
  function nav() {
    const main = dirName(api.dirToMain), others = DIR8.filter(d => d !== main).sort(() => Math.random() - 0.5).slice(0, 2);
    page('🧭 La bàn & hải lý', `«Trên biển không có đường, không có biển chỉ lối. Người đi biển dùng <b>la bàn</b>: kim nam châm luôn chỉ hướng <b>Bắc</b>. Quay mặt về Bắc thì tay phải là <b>Đông</b>, tay trái là <b>Tây</b>, sau lưng là <b>Nam</b>. Khoảng cách trên biển đo bằng <b>hải lý</b>: 1 hải lý = <b>1 852 m</b>. Tàu đi 1 hải lý mỗi giờ là chạy <b>1 hải lý/giờ</b> (1 nút).»<br><small>Gợi ý: lên ban công đỉnh tháp, dòng chữ phía trên màn hình cho biết cháu đang nhìn về hướng nào.</small>`,
      [{ t: 'Hỏi cháu đi ông! ➜', cls: 'p', f: () => quiz('🧭 La bàn & hải lý', [
        { q: 'Một hải lý dài bao nhiêu mét?', o: ['1 852 m', '1 000 m', '1 609 m'], a: 0, why: '1 hải lý = <b>1 852 m</b>, đúng bằng 1 phút cung vĩ độ trên mặt đất nên rất tiện khi đo trên hải đồ.' },
        { q: 'Buổi sáng Mặt Trời mọc ở hướng nào?', o: ['Đông', 'Tây', 'Bắc'], a: 0, why: 'Mặt Trời <b>mọc đằng Đông, lặn đằng Tây</b>. Không có la bàn, người đi biển nhìn Mặt Trời và sao để định hướng.' },
        { q: 'Đứng ở hải đăng nhìn về đảo Rubik là nhìn về hướng nào?', o: [main, ...others], a: 0, why: `Đảo Rubik nằm ở hướng <b>${main}</b> của hải đăng, cách khoảng <b>${Math.round(api.distMain)} m</b> ≈ ${(api.distMain / 1852).toFixed(2).replace('.', ',')} hải lý.` },
        { q: 'Tàu chạy 10 hải lý/giờ. Sau 3 giờ tàu đi được bao xa?', o: ['30 hải lý', '13 hải lý', '3 hải lý'], a: 0, why: 'Quãng đường = vận tốc × thời gian = 10 × 3 = <b>30 hải lý</b> (khoảng 55,6 km).' },
      ], () => reward('nav', 1, 'Hải đăng: la bàn & hải lý', 'Giờ cháu đã biết xem hướng như một thuỷ thủ. Thử lên <b>phòng bản đồ</b> (tầng 2) xem tấm hải đồ nhé!')) }, { t: '⬅ Quay lại', cls: 'c2', f: () => menu() }]);
  }

  // ---------- 🌙 thuỷ triều ----------
  function tide() {
    const p = ctx.sky.state.moonPhase, M = moonInfo(p), T = api.tide(), lit = Math.round((1 - Math.cos(p * Math.PI * 2)) / 2 * 100);
    const kinds = ['triều cường', 'triều trung bình', 'triều kém'];
    page('🌙 Thuỷ triều theo trăng', `<div style="font-size:55px;text-align:center;line-height:1.1">${M.icon}</div>«Hôm nay là <b>${M.name}</b> (phần sáng ${lit}%). <b>Mặt Trăng hút nước biển</b> về phía nó nên mỗi ngày nước lên rồi lại xuống: đó là <b>thuỷ triều</b>. Lúc <b>trăng non</b> và <b>trăng tròn</b>, Mặt Trời – Trái Đất – Mặt Trăng <b>thẳng hàng</b>, hai lực hút cộng lại → nước lên xuống mạnh nhất (<b>triều cường</b>). Lúc <b>bán nguyệt</b>, hai lực hút vuông góc nhau → nước lên xuống ít (<b>triều kém</b>).»<br><small>📏 Thước thuỷ triều ở bến lúc này: nước ${T.level >= 0 ? 'cao hơn' : 'thấp hơn'} mực trung bình <b>${Math.abs(T.level).toFixed(1).replace('.', ',')} m</b>, đang ${T.rising ? 'lên' : 'xuống'}.</small>`,
      [{ t: 'Hỏi cháu đi ông! ➜', cls: 'p', f: () => quiz('🌙 Thuỷ triều', [
        { q: 'Thuỷ triều chủ yếu do đâu mà có?', o: ['Lực hút của Mặt Trăng (và Mặt Trời)', 'Gió thổi mạnh', 'Cá voi quẫy đuôi'], a: 0, why: '<b>Mặt Trăng</b> ở gần Trái Đất nên lực hút của nó kéo nước biển phồng lên; Mặt Trời cũng góp một phần.' },
        { q: `Hôm nay ${M.name.toLowerCase()} ${M.icon}. Nước biển mấy ngày này lên xuống thế nào?`, o: kinds.map(k => k[0].toUpperCase() + k.slice(1) + (k === 'triều cường' ? ' (lên xuống mạnh)' : k === 'triều kém' ? ' (lên xuống ít)' : '')), a: kinds.indexOf(M.kind), why: `Trăng đang ở pha <b>${M.name.toLowerCase()}</b> → <b>${M.kind}</b>. Trăng non/trăng tròn: triều cường; bán nguyệt: triều kém.` },
        { q: 'Khoảng bao lâu thì trăng tròn lại một lần?', o: ['Khoảng 29,5 ngày', 'Khoảng 7 ngày', 'Khoảng 365 ngày'], a: 0, why: 'Một <b>tuần trăng</b> dài khoảng <b>29,5 ngày</b>: vì thế tháng âm lịch có 29 hoặc 30 ngày, và rằm luôn là trăng tròn.' },
      ], () => reward('tide', 1, 'Hải đăng: thuỷ triều theo trăng', `Người gác đèn ngày nào cũng ghi <b>mực nước</b> và <b>pha trăng</b> vào sổ. Hôm nay: ${M.icon} ${M.name} → ${M.kind}.`)) }, { t: '⬅ Quay lại', cls: 'c2', f: () => menu() }]);
  }

  // ---------- 📡 Morse ----------
  function morse(wi = 0, li = 0) {
    const [word, mean] = WORDS[wi]; let seq = '', downAt = 0, timer = 0;
    const view = () => `<div class="ms">${[...word].map((ch, i) => i < li ? `<b>${ch}</b>` : i === li ? `<u>${ch}</u>` : `<i>${ch}</i>`).join('')}</div><div class="ms" style="font-size:21px;min-height:28px">${[...word].map((ch, i) => i < li ? MORSE[ch] : i === li ? `<b>${seq || '?'}</b>` : '').join(' ').replace(/\./g, '•').replace(/-/g, '—')}</div>`;
    page('📡 Mã Morse bằng đèn', `«Tàu ở xa không nghe được tiếng gọi, ta nói chuyện bằng <b>ánh đèn</b>: chớp ngắn là <b>chấm •</b>, chớp dài là <b>gạch —</b>. Hãy gửi chữ <b>${word}</b> (${mean}).»<div id="lhMs">${view()}</div><div class="bulb"></div><div class="tb">${Object.entries(MORSE).map(([k, v]) => `<span>${k} ${v.replace(/\./g, '•').replace(/-/g, '—')}</span>`).join('')}</div>`,
      [{ t: '• Chấm', cls: 'c2', f: () => sym('.') }, { t: '— Gạch', cls: 'c2', f: () => sym('-') }, { t: '💡 Giữ để chớp (ngắn = chấm, dài = gạch)', cls: 'p', f: () => {} }, { t: '⬅ Quay lại', cls: 'c2', f: () => menu() }], true);
    const bulb = B.querySelector('.bulb'), ms = B.querySelector('#lhMs'), hold = A.children[2]; hold.style.gridColumn = A.children[3].style.gridColumn = '1 / -1';
    const light = on => { bulb.classList.toggle('on', on); api.flash(on); };
    const blink = len => { light(true); clearTimeout(timer); timer = setTimeout(() => light(false), len); };
    function sym(c) {
      const want = MORSE[word[li]]; blink(c === '.' ? 160 : 480);
      if (want[seq.length] !== c) { seq = ''; sfx('bad'); ms.innerHTML = view(); ctx.toast && ctx.toast(`💡 Chưa đúng: chữ <b>${word[li]}</b> là <b>${want.replace(/\./g, '•').replace(/-/g, '—')}</b>. Gửi lại chữ này nhé!`, 5000); return; }
      seq += c; ctx.note && ctx.note(c === '.' ? 880 : 660, 0.08, c === '.' ? 0.15 : 0.4);
      if (seq === want) { li++; seq = ''; sfx('ok'); if (li >= word.length) { clearTimeout(timer); light(false); return wi + 1 < WORDS.length ? page('📡 Mã Morse', `✅ Tàu đã nhận được chữ <b>${word}</b> (${mean}) và chớp đèn trả lời!`, [{ t: 'Gửi chữ tiếp theo ➜', cls: 'p', f: () => morse(wi + 1) }]) : reward('morse', 2, 'Hải đăng: gửi tín hiệu Morse bằng đèn', '«Tuyệt lắm! Mã Morse ra đời từ năm 1838. <b>SOS</b> (• • • — — — • • •) là tín hiệu cấp cứu mà mọi con tàu trên thế giới đều hiểu.»'); }
      }
      ms.innerHTML = view();
    }
    const dn = e => { e.preventDefault(); downAt = performance.now(); light(true); clearTimeout(timer); }, up = () => { if (!downAt) return; const d = performance.now() - downAt; downAt = 0; light(false); sym(d < 300 ? '.' : '-'); };
    hold.addEventListener('pointerdown', dn); hold.addEventListener('pointerup', up); hold.addEventListener('pointerleave', up); hold.onclick = null;
    cleanup = () => { clearTimeout(timer); api.flash(null); };
  }

  // ---------- 🔦 dẫn tàu về bến ----------
  function ship() {
    const N = 3; let n = 0, beam = 0, target = null, turn = 0, cur = null, t0 = performance.now(), hintT = 0, over = false;
    page('🔦 Dẫn tàu về bến', `<div id="lhMsg" style="min-height:3em"></div><canvas width="466" height="466"></canvas>`,
      [{ t: '⟲ Xoay trái', cls: 'c2', f: () => {} }, { t: 'Xoay phải ⟳', cls: 'c2', f: () => {} }, { t: '⬅ Thôi, để lúc khác', cls: 'c2', f: () => menu() }], true);
    A.children[2].style.gridColumn = '1 / -1';
    const cv = B.querySelector('canvas'), g = cv.getContext('2d'), msg = B.querySelector('#lhMsg'), W = 466, R = 200, cx = W / 2, cy = W / 2;
    const used = [];
    const next = () => { let d; do d = Math.floor(Math.random() * 8); while (used.includes(d)); used.push(d); cur = { d, b: d * Math.PI / 4, r: 0.86, lit: 0, home: false, name: SHIPS[n % SHIPS.length] }; hintT = 0; msg.innerHTML = `🚢 Tàu <b>${cur.name}</b> gọi: «Trời tối quá! Chúng tôi đang ở hướng <b>${DIR8[d].toUpperCase()}</b> của hải đăng.» <small>(${n + 1}/${N}) Chạm vào la bàn hoặc bấm nút để xoay chùm đèn.</small>`; };
    next();
    const hold = (b, s) => { b.onclick = null; b.addEventListener('pointerdown', e => { e.preventDefault(); turn = s; target = null; }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { if (turn === s) turn = 0; }); };
    hold(A.children[0], -1); hold(A.children[1], 1);
    const aimAt = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W - cx, y = (e.clientY - r.top) / r.height * W - cy; if (Math.hypot(x, y) > 21) target = Math.atan2(x, -y); };
    let drag = false; cv.addEventListener('pointerdown', e => { drag = true; aimAt(e); }); cv.addEventListener('pointermove', e => { if (drag) aimAt(e); }); const upf = () => { drag = false; }; addEventListener('pointerup', upf);
    const key = e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') turn = e.type === 'keydown' ? -1 : 0; if (e.code === 'ArrowRight' || e.code === 'KeyD') turn = e.type === 'keydown' ? 1 : 0; if (e.type === 'keydown' && turn) target = null; };
    addEventListener('keydown', key); addEventListener('keyup', key);
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    let last = performance.now();
    const frame = () => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (target != null) { const d = wrap(target - beam), s = Math.sign(d) * Math.min(Math.abs(d), dt * PHI * 1.2); beam += s; if (Math.abs(d) < 0.01) target = null; } else beam += turn * dt * PHI;
      beam = wrap(beam); api.aim(beam);
      if (cur && !over) {
        const off = Math.abs(wrap(cur.b - beam)), on = off < 0.21;
        if (!cur.home) { cur.lit = Math.max(0, Math.min(1, cur.lit + (on ? dt / PHI : -dt * 0.5))); hintT += dt; if (cur.lit >= 1) { cur.home = true; sfx('ok'); msg.innerHTML = `✨ Tàu <b>${cur.name}</b>: «Thấy đèn rồi! Cảm ơn hải đăng, chúng tôi đang theo ánh đèn về bến.»`; } }
        else { cur.r -= dt * 0.34; if (cur.r <= 0.1) { n++; if (n >= N) { over = true; const sec = Math.round((now - t0) / 1000); if (!st.best || sec < st.best) { st.best = sec; save(st); } setTimeout(() => reward('ship', 2, 'Hải đăng: dẫn 3 con tàu về bến', `«Cả <b>${N} con tàu</b> đã về bến an toàn sau <b>${sec} giây</b> (kỷ lục của cháu: ${st.best} giây). La bàn có <b>8 hướng</b>: Bắc, Đông Bắc, Đông, Đông Nam, Nam, Tây Nam, Tây, Tây Bắc, mỗi hướng cách nhau <b>45°</b>.»`), 400); } else next(); } }
      }
      // vẽ: biển đêm, vòng la bàn 8 hướng, chùm đèn, tàu
      g.fillStyle = '#0d1b2e'; g.fillRect(0, 0, W, W);
      g.strokeStyle = '#2b4a6b'; g.lineWidth = 1; for (const r of [R * 0.382, R * 0.618, R]) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
      const gr = g.createRadialGradient(cx, cy, 8, cx, cy, R * 1.08); gr.addColorStop(0, '#fff3c4ee'); gr.addColorStop(1, '#fff3c400');
      g.fillStyle = gr; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R * 1.08, beam - Math.PI / 2 - 0.2, beam - Math.PI / 2 + 0.2); g.closePath(); g.fill();
      g.font = '900 21px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = cx + Math.sin(a) * (R + 21), y = cy - Math.cos(a) * (R + 21), hint = cur && !cur.home && hintT > 13 && i === cur.d && (now / 300 | 0) % 2; g.fillStyle = hint ? '#ffd23f' : i ? '#9fb6cc' : '#ef6b5a'; g.fillText(DIR8S[i], x, y); g.strokeStyle = '#2b4a6b'; g.beginPath(); g.moveTo(cx + Math.sin(a) * R * 0.2, cy - Math.cos(a) * R * 0.2); g.lineTo(cx + Math.sin(a) * R, cy - Math.cos(a) * R); g.stroke(); }
      if (cur && !over) { const x = cx + Math.sin(cur.b) * R * cur.r, y = cy - Math.cos(cur.b) * R * cur.r, vis = cur.home ? 1 : cur.lit;
        if (vis > 0.02) { g.globalAlpha = Math.min(1, 0.25 + vis); g.font = '34px system-ui'; g.fillText('🚢', x, y); g.globalAlpha = 1; if (!cur.home) { g.strokeStyle = '#ffd98a'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 26, -Math.PI / 2, -Math.PI / 2 + cur.lit * Math.PI * 2); g.stroke(); } } }
      g.font = '26px system-ui'; g.fillText('⚓', cx + 26, cy + 21); g.fillStyle = '#c45a3a'; g.beginPath(); g.arc(cx, cy, 13, 0, 7); g.fill(); g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill();
    };
    const id = setInterval(frame, 33); frame();
    cleanup = () => { clearInterval(id); removeEventListener('keydown', key); removeEventListener('keyup', key); removeEventListener('pointerup', upf); api.aim(null); };
  }
  const RUN = { ship, lens, morse: () => morse(0), nav, tide };

  return {
    note: (title, html, btn = 'Đã hiểu') => page(title, html, [{ t: btn, cls: 'p', f: () => show(false) }]),
    open: hello => menu(hello), run: id => RUN[id] && RUN[id](), get isOpen() { return open; }, state: st, doneAll, save: () => save(st),
    chip: html => { const h = !html; if (chip.hidden !== h) chip.hidden = h; if (html && chip._h !== html) { chip._h = html; chip.innerHTML = html; } },
  };
}
