// learn.js — NGÂN HÀNG CÂU HỎI CHUNG + HỌC THÍCH ỨNG (dùng cho MỌI nơi: cốt truyện, thầy cô, phép thuật, đền, mini game).
// Gộp: data/quiz-bank.json (lớp 1–9 × Toán/Tiếng Việt/Khoa học/Sử–Địa), quiz-data.js (khoa học, biển, toán tự sinh),
//      mg/quiz.js (từ vựng tiếng Anh, khoa học, địa lý) + câu mới bên dưới (Tiếng Anh lớp 1–9, chuyện Rồng–Tiên, cây cối, biển).
// Mỗi câu: { id, s: môn, g: lớp, tag?, q, c: [ĐÚNG, sai…], e: giải thích } (đáp án được xáo khi hiện).
// Thích ứng (lưu trong TÀI KHOẢN: profile.learn):
//  · độ khó = lớp của em ± 1 theo tỉ lệ đúng 8 câu gần nhất của môn đó (≥ 80 % → khó hơn, < 50 % → dễ hơn)
//  · lặp lại ngắt quãng (hộp Leitner): đúng → lên hộp, hẹn ôn sau 1 · 5 · 34 · 233 · 1597 phút (Fibonacci); sai → về hộp 0, hỏi lại sau 1 phút
//  · câu đến hạn ôn được ưu tiên (xác suất 1/φ ≈ 62 %) → câu sai được nhắc lại cho tới khi nhớ.
// API: ctx.learn = { pick(s, o), record(item, ok), ask(o) → Promise<bool>, askSet(o) → Promise<{ok, n}>, grade, stats(), SUBJ }
import { SUBJECTS, setProvider } from './quiz-data.js';
import { BANK, setQuizProvider } from './mg/quiz.js';

export const SUBJ = {
  toan: { n: 'Toán', i: '➗' }, tv: { n: 'Tiếng Việt', i: '📖' }, kh: { n: 'Khoa học', i: '🔬' }, lsdl: { n: 'Sử – Địa', i: '🌏' }, ta: { n: 'Tiếng Anh', i: '🔤' },
};
const X = (s, g, tag, q, a, w1, w2, w3, e) => ({ s, g, tag, q, c: [a, w1, w2, w3].filter(v => v != null), e });
const EXTRA = [
  // Tiếng Anh lớp 1–9 (bám SGK Tiếng Anh GDPT 2018: chào hỏi, gia đình, trường lớp, thời gian, so sánh, thì…)
  X('ta', 1, 0, '“Hello” nghĩa là gì?', 'Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi', 'Hello = xin chào; goodbye = tạm biệt.'),
  X('ta', 1, 0, '“One, two, …” số tiếp theo là?', 'three', 'four', 'ten', 'zero', 'one 1, two 2, three 3.'),
  X('ta', 2, 0, '“mother” là ai?', 'mẹ', 'bố', 'chị', 'bà', 'mother = mẹ, father = bố.'),
  X('ta', 2, 0, 'Màu “yellow” là màu gì?', 'vàng', 'đỏ', 'tím', 'trắng', 'yellow = vàng.'),
  X('ta', 3, 0, '“How old are you?” hỏi về điều gì?', 'tuổi', 'tên', 'quê', 'sở thích', 'How old…? = bao nhiêu tuổi?'),
  X('ta', 3, 0, 'Chọn từ đúng: “This ___ my pen.”', 'is', 'are', 'am', 'be', 'Một vật (this) đi với is.'),
  X('ta', 4, 0, '“What time is it?” — “It’s seven o’clock.” Mấy giờ?', '7 giờ', '11 giờ', '7 giờ rưỡi', '17 phút', 'o’clock = giờ đúng.'),
  X('ta', 4, 0, 'Thứ Hai tiếng Anh là?', 'Monday', 'Sunday', 'Friday', 'Tuesday', 'Monday thứ Hai, Tuesday thứ Ba…'),
  X('ta', 5, 0, '“I ___ to school every day.”', 'go', 'goes', 'going', 'went', 'Chủ ngữ I ở hiện tại đơn: go.'),
  X('ta', 5, 0, '“bigger” là dạng so sánh của?', 'big', 'bag', 'beg', 'bug', 'big → bigger → the biggest.'),
  X('ta', 6, 0, '“She ___ reading a book now.”', 'is', 'are', 'am', 'do', 'Hiện tại tiếp diễn: she is + V-ing.'),
  X('ta', 6, 0, 'Số nhiều của “child” là?', 'children', 'childs', 'childes', 'childen', 'child → children (bất quy tắc).'),
  X('ta', 7, 0, 'Quá khứ của “go” là?', 'went', 'goed', 'gone', 'goes', 'go – went – gone.'),
  X('ta', 7, 0, '“There isn’t ___ milk in the fridge.”', 'any', 'some', 'a', 'many', 'Câu phủ định với danh từ không đếm được: any.'),
  X('ta', 8, 0, '“If it rains, we ___ at home.”', 'will stay', 'stayed', 'stay will', 'staying', 'Câu điều kiện loại 1: If + hiện tại, will + V.'),
  X('ta', 8, 0, '“environment” nghĩa là?', 'môi trường', 'giải trí', 'thiết bị', 'kinh tế', 'Bảo vệ môi trường = protect the environment.'),
  X('ta', 9, 0, '“The bridge ___ in 2010.” (bị động)', 'was built', 'built', 'is build', 'was build', 'Bị động quá khứ: was/were + V3.'),
  X('ta', 9, 0, '“I wish I ___ fly.”', 'could', 'can', 'will', 'am', 'Câu ước ở hiện tại: wish + quá khứ (could).'),
  // Sử – Địa: chuyện Rồng – Tiên, nước Văn Lang (chương Thung lũng Rồng)
  X('lsdl', 3, 'rong', 'Truyền thuyết “Con Rồng cháu Tiên” kể về Lạc Long Quân và ai?', 'Âu Cơ', 'Mị Nương', 'Tấm', 'Hằng Nga', 'Lạc Long Quân (giống Rồng) và Âu Cơ (giống Tiên) — tổ tiên người Việt.'),
  X('lsdl', 3, 'rong', 'Âu Cơ sinh ra một bọc có bao nhiêu trứng?', '100', '50', '10', '1000', 'Bọc 100 trứng nở 100 người con — vì thế người Việt gọi nhau là “đồng bào”.'),
  X('lsdl', 4, 'rong', '50 người con theo mẹ Âu Cơ lên đâu?', 'Núi', 'Biển', 'Sông', 'Đảo', '50 con theo cha xuống biển, 50 con theo mẹ lên núi.'),
  X('lsdl', 4, 'rong', 'Ngày Giỗ Tổ Hùng Vương là ngày nào âm lịch?', '10/3', '15/8', '1/1', '5/5', '“Dù ai đi ngược về xuôi, nhớ ngày Giỗ Tổ mùng mười tháng ba.”'),
  X('lsdl', 5, 'rong', 'Đền Hùng nằm ở tỉnh nào?', 'Phú Thọ', 'Nghệ An', 'Huế', 'Cà Mau', 'Đền Hùng trên núi Nghĩa Lĩnh, Phú Thọ.'),
  X('lsdl', 5, 'rong', 'Vịnh Hạ Long có tên gắn với hình ảnh gì?', 'Rồng đáp xuống', 'Rùa nổi lên', 'Cá chép hoá rồng', 'Chim bay về', '“Hạ Long” nghĩa là nơi rồng hạ xuống, nhả ngọc thành đảo đá.'),
  X('lsdl', 6, 'rong', 'Kinh đô của nước Văn Lang là?', 'Phong Châu', 'Cổ Loa', 'Hoa Lư', 'Thăng Long', 'Các vua Hùng đóng đô ở Phong Châu (Phú Thọ).'),
  X('lsdl', 7, 'rong', 'Vua Lý Thái Tổ dời đô về Thăng Long năm nào?', '1010', '938', '1225', '1802', 'Năm 1010 vua thấy rồng bay lên nên đặt tên Thăng Long (rồng bay lên).'),
  X('lsdl', 8, 'rong', 'Dãy núi dài nhất Việt Nam (như sống lưng rồng) là?', 'Trường Sơn', 'Hoàng Liên Sơn', 'Bạch Mã', 'Tam Đảo', 'Trường Sơn dài khoảng 1 100 km dọc miền Trung.'),
  X('lsdl', 9, 'rong', 'Đồng bằng sông Cửu Long được đặt tên theo gì?', '9 cửa sông đổ ra biển', '9 ngọn núi', '9 con rồng đá', '9 tỉnh', 'Sông Mê Kông chia nhiều nhánh, xưa có 9 cửa ra biển → “Cửu Long” (9 rồng).'),
  // Khoa học: cây cối, ánh sáng (chương Rừng Phép Thuật)
  X('kh', 2, 'cay', 'Cây cần gì để sống?', 'Nước, ánh sáng, không khí', 'Chỉ cần đất', 'Chỉ cần nước', 'Bóng tối', 'Cây cần nước, ánh sáng, không khí và chất khoáng.'),
  X('kh', 3, 'cay', 'Lá cây có màu xanh nhờ chất gì?', 'Diệp lục', 'Muối', 'Đường', 'Sắt', 'Diệp lục giúp lá hấp thụ ánh sáng để quang hợp.'),
  X('kh', 4, 'cay', 'Ánh sáng trắng đi qua lăng kính tách thành mấy màu?', '7', '3', '5', '9', 'Đỏ, cam, vàng, lục, lam, chàm, tím — giống cầu vồng.'),
  X('kh', 5, 'cay', 'Hoa giúp cây làm gì?', 'Sinh sản (tạo quả, hạt)', 'Hút nước', 'Thở', 'Đứng vững', 'Hoa thụ phấn → kết quả → hạt mọc thành cây mới.'),
  X('kh', 6, 'cay', 'Quang hợp tạo ra chất nào nuôi cây?', 'Tinh bột (đường)', 'Muối ăn', 'Đạm', 'Mỡ', 'Nước + CO₂ + ánh sáng → tinh bột + O₂.'),
  X('kh', 7, 'cay', 'Vì sao lá cây chuyển vàng vào mùa thu ở xứ lạnh?', 'Diệp lục bị phân huỷ', 'Lá bị sơn', 'Cây uống ít nước ngọt', 'Gió thổi màu', 'Hết diệp lục xanh, sắc vàng – cam có sẵn trong lá lộ ra.'),
  X('kh', 8, 'cay', 'Màu của vật ta thấy là ánh sáng mà vật…', 'phản xạ lại', 'hấp thụ hết', 'tự phát ra', 'làm nóng', 'Lá xanh vì phản xạ ánh sáng xanh lục, hấp thụ các màu khác.'),
  X('kh', 9, 'cay', 'Trộn ánh sáng đỏ, lục, lam với nhau được ánh sáng gì?', 'Trắng', 'Đen', 'Nâu', 'Tím', 'Ba màu cơ bản của ánh sáng (RGB) trộn đủ thành trắng — màn hình cũng làm thế.'),
  // Khoa học biển lớp cao hơn (chương Biển)
  X('kh', 6, 'bien', 'Khi lặn càng sâu, áp suất nước…', 'càng tăng', 'càng giảm', 'không đổi', 'bằng 0', 'Cứ sâu thêm khoảng 10 m, áp suất tăng thêm 1 atm.'),
  X('kh', 7, 'bien', 'San hô là…', 'động vật', 'đá', 'cây', 'nấm', 'San hô là động vật nhỏ sống thành tập đoàn, xây khung đá vôi.'),
  X('kh', 8, 'bien', 'Thuỷ triều chủ yếu do lực hút của…', 'Mặt Trăng', 'Sao Hoả', 'gió', 'cá voi', 'Mặt Trăng (và Mặt Trời) hút nước biển tạo triều lên xuống.'),
];

const pickR = a => a[(Math.random() * a.length) | 0], ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0);
// Toán tự sinh theo lớp (số liệu ngẫu nhiên, 4 đáp án gần nhau)
function genMath(g) {
  let q, a, e;
  if (g <= 1) { const x = ri(2, 9), y = ri(1, 9); if (Math.random() < 0.5) { q = `${x} + ${y} = ?`; a = x + y; } else { q = `${x + y} − ${y} = ?`; a = x; } e = `${q.replace('?', a)}`; }
  else if (g === 2) { const x = ri(12, 60), y = ri(5, 35); q = `${x} + ${y} = ?`; a = x + y; e = `Cộng hàng đơn vị trước rồi hàng chục: ${a}.`; }
  else if (g === 3) { const x = ri(2, 9), y = ri(2, 9); q = `${x} × ${y} = ?`; a = x * y; e = `Bảng nhân ${x}: ${x} × ${y} = ${a}.`; }
  else if (g === 4) { const y = ri(3, 9), a0 = ri(12, 99); q = `${a0 * y} : ${y} = ?`; a = a0; e = `Thử lại: ${a0} × ${y} = ${a0 * y}.`; }
  else if (g === 5) { const x = ri(11, 49) / 10, y = ri(11, 49) / 10; q = `${String(x).replace('.', ',')} + ${String(y).replace('.', ',')} = ?`; a = Math.round((x + y) * 10) / 10; e = 'Cộng số thập phân: thẳng hàng dấu phẩy.'; }
  else if (g === 6) { const b = ri(2, 5), n = ri(2, 3); q = `${b}${n === 2 ? '²' : '³'} = ?`; a = b ** n; e = `${b}${n === 2 ? '²' : '³'} = ${Array(n).fill(b).join(' × ')} = ${a}.`; }
  else if (g === 7) { const x = ri(-9, -2), y = ri(3, 12); q = `(${x}) + ${y} = ?`; a = x + y; e = `Cộng số nguyên khác dấu: ${y} − ${-x} = ${a}.`; }
  else if (g === 8) { const x = ri(2, 6); q = `Với x = ${x}: (x + 1)² = ?`; a = (x + 1) ** 2; e = `(${x} + 1)² = ${x + 1}² = ${a}.`; }
  else { const r = ri(4, 15); q = `√${r * r} = ?`; a = r; e = `${r} × ${r} = ${r * r} nên √${r * r} = ${r}.`; }
  const s = new Set([a]); while (s.size < 4) { const d = a + ri(-6, 6) * (Number.isInteger(a) ? 1 : 0.1); const v = Math.round(d * 10) / 10; if (v !== a && (g >= 7 || v >= 0)) s.add(v); }
  const f = v => String(v).replace('.', ',');
  return { id: 'gen', s: 'toan', g, q, c: [...s].map(f), e };
}

// ---------- gộp ngân hàng ----------
const ITEMS = [];
const add = (it, id) => { it.id = id; ITEMS.push(it); };
EXTRA.forEach((it, i) => add(it, 'x' + i));
SUBJECTS.khoahoc.questions.forEach((q, i) => add({ s: 'kh', g: 4, q: q.q, c: [q.choices[q.a], ...q.choices.filter((_, k) => k !== q.a)], e: q.explain }, 'qk' + i));
SUBJECTS.bien.questions.forEach((q, i) => add({ s: 'kh', g: 4, tag: 'bien', q: q.q, c: [q.choices[q.a], ...q.choices.filter((_, k) => k !== q.a)], e: q.explain, hint: q.hint }, 'qb' + i));
BANK.vocab.forEach((t, i) => add({ s: 'ta', g: i < 9 ? 1 : 2, q: t.q, c: [t.a, ...t.wrong], e: t.why || `Đáp án: ${t.a}` }, 'mv' + i));
BANK.science.forEach((t, i) => add({ s: 'kh', g: 4, q: t.q, c: [t.a, ...t.wrong], e: t.why || `Đáp án: ${t.a}` }, 'ms' + i));
BANK.geo.forEach((t, i) => add({ s: 'lsdl', g: 4, q: t.q, c: [t.a, ...t.wrong], e: t.why || `Đáp án: ${t.a}` }, 'mg' + i));
const ready = fetch(new URL('./data/quiz-bank.json', import.meta.url)).then(r => r.json()).then(b => {
  for (const [g, subs] of Object.entries(b.grades)) for (const [s, list] of Object.entries(subs))
    list.forEach((q, i) => add({ s, g: +g, q: q.q, c: [q.c[q.a], ...q.c.filter((_, k) => k !== q.a)], e: q.e }, `b${g}${s}${i}`));
}).catch(() => {});

const BOX = [1, 5, 34, 233, 1597].map(m => m * 60000);   // khoảng ôn (ms), Fibonacci phút
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const loadLS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };

export function createLearn(ctx) {
  // dữ liệu học: trong tài khoản (profile.learn); chưa đăng nhập → bộ nhớ máy 'island.learn'
  const local = loadLS('island.learn', null) || { g: 0, st: {}, rc: {}, sb: {} };
  const L = () => { const p = ctx.account && ctx.account.profile; if (!p) return local; if (!p.learn) p.learn = JSON.parse(JSON.stringify(local)); const d = p.learn; d.st = d.st || {}; d.rc = d.rc || {}; d.sb = d.sb || {}; return d; };
  const persist = () => { if (ctx.account && ctx.account.profile) ctx.account.save(); else try { localStorage.setItem('island.learn', JSON.stringify(local)); } catch (e) {} };
  const grade = () => +(localStorage.getItem('island.grade') || 0) || L().g || 0;   // 'island.grade' dùng chung với thầy cô (teacher-quiz.js)
  ctx.account && ctx.account.onChange(() => { const g = L().g; if (g) try { localStorage.setItem('island.grade', g); } catch (e) {} });
  const setGrade = g => { L().g = g; try { localStorage.setItem('island.grade', g); } catch (e) {} persist(); };
  const acc = s => { const r = L().rc[s] || ''; return r.length < 3 ? null : [...r].filter(c => c === '1').length / r.length; };
  const target = s => { const a = acc(s), g = grade() || 3; return Math.max(1, Math.min(9, g + (a == null ? 0 : a >= 0.8 ? 1 : a < 0.5 ? -1 : 0))); };
  let lastId = null;

  function pick(s, o = {}) {
    const tg = o.grade || target(s), now = Date.now(), st = L().st;
    const pool = ITEMS.filter(x => (!s || x.s === s) && (!o.tag || x.tag === o.tag) && x.id !== lastId && (!o.maxC || x.c.length <= o.maxC + 1));
    // 1) câu đến hạn ôn (ưu tiên câu từng sai), gần lớp mục tiêu
    const due = pool.filter(x => st[x.id] && st[x.id][1] <= now && Math.abs(x.g - tg) <= 2);
    if (due.length && Math.random() < 0.618) { due.sort((a, b) => st[a.id][0] - st[b.id][0] || st[a.id][1] - st[b.id][1]); return mark(due[0], true); }
    // 2) toán: 38 % tự sinh theo lớp
    if (s === 'toan' && !o.tag && (Math.random() < 0.382 || !pool.length)) return mark(genMath(tg));
    // 3) câu chưa gặp / ít gặp, gần lớp mục tiêu nhất
    let best = null, bs = 1e9;
    for (const x of pool) { const r = st[x.id], sc = Math.abs(x.g - tg) * 2 + (r ? 3 + r[0] : 0) + Math.random() * 1.5 + (r && r[1] > now ? 5 : 0); if (sc < bs) { bs = sc; best = x; } }
    return mark(best || genMath(tg));
  }
  const mark = (x, review = false) => { lastId = x.id; return Object.assign({}, x, { review }); };
  function record(x, ok) {
    if (!x) return; const D = L(), now = Date.now();
    if (x.id && x.id !== 'gen') { const r = D.st[x.id] || [0, 0, 0, 0]; r[0] = ok ? Math.min(4, r[0] + (r[2] ? 1 : 2)) : 0; r[1] = now + BOX[r[0]]; r[2]++; r[3] += ok ? 1 : 0; D.st[x.id] = r; }
    D.rc[x.s] = ((D.rc[x.s] || '') + (ok ? 1 : 0)).slice(-8);
    const b = D.sb[x.s] || [0, 0]; b[0]++; b[1] += ok ? 1 : 0; D.sb[x.s] = b;
    persist(); dispatchEvent(new CustomEvent('learn:answer', { detail: { item: x, ok, review: x.review } }));
  }
  // định dạng cho quiz-data.js ({q, choices, a, explain}) và mg/quiz.js ({q, a: chuỗi, choices, why})
  const shuffled = x => { const c = x.c.slice(), o = c.map((_, i) => i).sort(() => Math.random() - 0.5); return { ch: o.map(i => c[i]), a: o.indexOf(0) }; };
  const KEYMAP = { toan: ['toan'], khoahoc: ['kh'], tienganh: ['ta'] };
  setProvider(key => { const m = KEYMAP[key]; if (!m) return null; const x = pick(m[0]), s = shuffled(x); return { q: x.q, choices: s.ch, a: s.a, explain: x.e, subject: SUBJ[x.s].n, icon: SUBJ[x.s].i, done: ok => record(x, ok) }; });
  const TOPIC = { vocab: 'ta', science: 'kh', geo: 'lsdl' };
  setQuizProvider(topic => { const s = TOPIC[topic]; if (!s) return null; const x = pick(s, { maxC: 2 }); const c = x.c.slice(0, 3), a = c[0]; return { q: x.q, a, choices: c.sort(() => Math.random() - 0.5), why: x.e, done: ok => record(x, ok) }; });

  // ---------- thẻ câu hỏi (dùng chung cho cốt truyện) ----------
  const css = document.createElement('style'); css.textContent = `
#lnCard{position:fixed;left:50%;bottom:max(21px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:41;box-sizing:border-box;width:min(377px,calc(100vw - 26px));background:#fffaf0f5;color:#3a2a1a;border-radius:21px;padding:13px;font:14px/1.45 system-ui;box-shadow:0 8px 34px #0006;border:2px solid #f0a23a}
#lnCard .hd{display:flex;align-items:center;gap:5px;font-size:13px}#lnCard .hd span{flex:1}#lnCard .hd .rv{background:#ffe2a8;border-radius:8px;padding:0 5px;font-size:11px;font-weight:800}
#lnCard button{cursor:pointer;font-family:system-ui;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
#lnCard .gr{border:0;border-radius:13px;background:#f3e3c3;font-weight:800;font-size:12px;min-height:30px;padding:0 8px;color:#5a3a12}
#lnCard h3{font-size:16px;line-height:1.35;margin:8px 0}#lnCard .dots{font-size:11px;letter-spacing:3px;opacity:.6}
#lnCard .ch{display:grid;grid-template-columns:1fr 1fr;gap:5px}#lnCard .ch button{min-height:44px;padding:5px 8px;border-radius:13px;border:2px solid transparent;background:#f1e6cf;font-weight:700;font-size:14px;color:#3a2a1a}
#lnCard .ch button.ok{background:#c9efc9;border-color:#3fa36b}#lnCard .ch button.bad{background:#ffd0c8;border-color:#d2553f}
#lnCard .ex{margin:8px 0 0;font-size:13px}#lnCard .nx{display:block;width:100%;min-height:44px;margin-top:8px;border:0;border-radius:21px;background:#f0a23a;color:#2a1a0a;font-weight:800;font-size:15px}
#lnCard .gs{display:grid;grid-template-columns:repeat(9,1fr);gap:3px}#lnCard .gs button{min-height:44px;border-radius:8px;border:2px solid #e2cfa6;background:#fff;font-weight:800;font-size:16px;padding:0;color:#5a3a12}`;
  document.head.appendChild(css);
  let card = null, keyFn = null, frz = false;
  addEventListener('keydown', e => { if (!card || !keyFn) return; if (/^[1-9]$/.test(e.key) || e.code === 'Enter') { e.stopImmediatePropagation(); keyFn(e); } }, true);
  const open = () => { if (!card) { card = document.createElement('div'); card.id = 'lnCard'; document.body.appendChild(card); frz = ctx.player.frozen; } ctx.player.frozen = true; return card; };
  const close = () => { if (card) { card.remove(); card = null; keyFn = null; ctx.player.frozen = frz; } };
  function chooseGrade(then) {
    const c = open(), g0 = grade();
    c.innerHTML = `<div class="hd">🎒<span><b>Em học lớp mấy?</b> Câu hỏi sẽ vừa sức em.</span></div><div class="gs">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => `<button data-g="${g}" style="${g === g0 ? 'background:#f0a23a' : ''}">${g}</button>`).join('')}</div>`;
    const go = g => { setGrade(g); ctx.sfx && ctx.sfx('ui'); then(); };
    c.querySelectorAll('[data-g]').forEach(b => b.onclick = () => go(+b.dataset.g)); keyFn = e => /^[1-9]$/.test(e.key) && go(+e.key);
  }
  // askSet: n câu liên tiếp, cần đúng need câu (mặc định: n câu, cần ⌈n/φ⌉)
  function askSet(o = {}) {
    const n = o.n || 1, need = o.need || Math.ceil(n / 1.618);
    return new Promise(res => ready.then(() => {
      let i = 0, right = 0;
      const step = () => {
        if (i >= n) { close(); return res({ ok: right >= need, n: right }); }
        const subj = [].concat(o.s || 'toan'), s = subj[i % subj.length], x = pick(s, { tag: o.tag }), sh = shuffled(x), c = open();
        c.innerHTML = `<div class="hd">${o.ava || SUBJ[x.s].i}<span><b>${esc(o.title || 'Câu hỏi')}</b> · ${SUBJ[x.s].n}${x.review ? ' <i class="rv">🔁 ôn lại</i>' : ''}</span><button class="gr" data-gr>Lớp ${grade() || '?'} ✎</button></div>
          ${n > 1 ? `<div class="dots">${Array.from({ length: n }, (_, k) => k < i ? '●' : k === i ? '◉' : '○').join('')} · cần đúng ${need}/${n}</div>` : ''}
          <h3>${esc(x.q)}</h3><div class="ch">${sh.ch.map((t, k) => `<button data-k="${k}">${k + 1}. ${esc(t)}</button>`).join('')}</div>`;
        c.dataset.a = sh.a;   // (kiểm thử tự động)
        c.querySelector('[data-gr]').onclick = () => chooseGrade(step);
        const answer = k => {
          if (c.dataset.done) return; c.dataset.done = 1; const ok = k === sh.a; if (ok) right++;
          c.querySelectorAll('[data-k]').forEach((b, j) => { b.disabled = true; if (j === sh.a) b.className = 'ok'; else if (j === k) b.className = 'bad'; });
          record(x, ok); ctx.sfx && ctx.sfx(ok ? 'ok' : 'bad'); if (ok && ctx.player.emote) ctx.player.emote('cheer');
          c.insertAdjacentHTML('beforeend', `<p class="ex">${ok ? '✅ <b>Chính xác!</b> ' : `💡 <b>Chưa đúng.</b> Đáp án: <b>${esc(x.c[0])}</b>. `}${esc(x.e || '')}${ok ? '' : '<br><small>🔁 Câu này sẽ được hỏi lại để em nhớ lâu.</small>'}</p><button class="nx">${i + 1 < n ? 'Câu tiếp ▶' : 'Xong ▶'}</button>`);
          const nx = () => { delete c.dataset.done; i++; step(); }; c.querySelector('.nx').onclick = nx; keyFn = e => e.code === 'Enter' && nx();
        };
        c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => answer(+b.dataset.k)); keyFn = e => { const k = +e.key - 1; if (k >= 0 && k < sh.ch.length) answer(k); };
      };
      grade() ? step() : chooseGrade(step);
    }));
  }
  const ask = o => askSet(Object.assign({ n: 1, need: 1 }, o)).then(r => r.ok);
  function stats() { const D = L(), out = {}; for (const s in SUBJ) { const b = D.sb[s] || [0, 0]; out[s] = { n: b[0], ok: b[1], acc: acc(s), lv: target(s) }; } out.review = Object.values(D.st).filter(r => r[0] === 0).length; out.known = Object.values(D.st).filter(r => r[0] >= 3).length; return out; }
  return ctx.learn = { pick, record, ask, askSet, chooseGrade: f => chooseGrade(() => { close(); f && f(); }), stats, SUBJ, ready, get grade() { return grade(); }, set grade(g) { setGrade(g); }, update() { if (card && !ctx.player.frozen) ctx.player.frozen = true; } };
}
