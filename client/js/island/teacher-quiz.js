// teacher-quiz.js — Thầy cô & người dân hỏi đố theo môn khi lại gần bấm E / nút "Nói chuyện".
//   Ngân hàng câu hỏi: data/quiz-bank.json (lớp 1–9 · Toán, Tiếng Việt, Khoa học, Lịch sử – Địa lý; đáp án đúng ở c[a], hiện thì xáo).
//   Lớp của em lưu 'island.grade' (hỏi 1 lần, đổi được trong bảng). Câu đã hỏi lưu 'island.tq.seen' → không lặp tới khi hết câu.
//   Trả lời đúng: +1 🪙 (island.inventory, như treasure.js) và báo bảng nhiệm vụ: ctx.questEvent('quiz').
//   Người gần nhất do town-people.js đặt vào ctx.nearNpc (≤ 2,6 m). Môn của mỗi người cố định theo tên.
// φ: chữ 13 → 21 → 34 px, bo 21, nút cao 55 (Fibonacci), khung rộng tối đa 610 px (377·φ).
import { emote } from './characters.js';

const SUBJ = ['toan', 'tv', 'kh', 'lsdl'], GRADE = 'island.grade', SEEN = 'island.tq.seen', INV = 'island.inventory';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createTeacherQuiz(ctx) {
  let bank = null; const ready = fetch(new URL('./data/quiz-bank.json', import.meta.url)).then(r => r.json()).then(b => (bank = b)).catch(() => null);
  const css = document.createElement('style'); css.textContent = `
#tQuiz{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#1a2a1fcc;padding:13px}
#tQuiz .card{box-sizing:border-box;width:min(100%,610px);max-height:calc(100% - 26px);overflow:auto;background:#fffaf0;color:#3a2a1a;border-radius:21px;padding:13px 21px 21px;border-top:8px solid #f0a23a;font:15px/1.5 system-ui;text-align:center;box-shadow:0 13px 34px #0006}
#tQuiz .who{display:flex;align-items:center;gap:8px;text-align:left;margin-bottom:8px}#tQuiz .ava{font-size:34px;line-height:1}
#tQuiz .who b{display:block;font-size:17px}#tQuiz .who small{opacity:.7;font-size:13px}
#tQuiz .chip{margin-left:auto;padding:5px 13px;border-radius:21px;border:0;background:#f3e3c3;font:700 13px system-ui;color:#5a3a12;min-height:34px}
#tQuiz h3{font-size:21px;line-height:1.35;margin:8px 0 13px}#tQuiz .say{margin:5px 0 13px;font-size:15px}
#tQuiz .ch{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#tQuiz button{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
#tQuiz .ch button{min-height:55px;padding:8px 13px;border-radius:13px;border:2px solid transparent;background:#f1e6cf;font:700 16px/1.3 system-ui;color:#3a2a1a}
#tQuiz .ch button.ok{background:#c9efc9;border-color:#3fa36b}#tQuiz .ch button.bad{background:#ffd0c8;border-color:#d2553f}
#tQuiz .ex{min-height:21px;margin:13px 0 0;font-size:15px}#tQuiz .row{display:grid;grid-template-columns:1.618fr 1fr;gap:8px;margin-top:13px}
#tQuiz .row button,#tQuiz .go{min-height:55px;border-radius:34px;border:0;font:800 16px system-ui;background:#f0a23a;color:#2a1a0a}#tQuiz .row .bye{background:#e8dcc6;color:#5a4a3a}
#tQuiz .grades{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:13px 0}#tQuiz .grades button{min-height:55px;border-radius:13px;border:2px solid #e2cfa6;background:#fff;font:800 21px system-ui;color:#5a3a12}
#tQuiz .grades button.on{background:#f0a23a;border-color:#c97c18}
@media(max-width:420px){#tQuiz .ch{grid-template-columns:1fr}#tQuiz h3{font-size:19px}#tQuiz .card{padding:13px 13px 21px}}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'tQuiz'; el.hidden = true; document.body.appendChild(el);
  const close = () => { el.hidden = true; ctx.player.frozen = false; };
  addEventListener('keydown', e => { if (!el.hidden && e.code === 'Escape') close(); });

  const give = n => { const v = load(INV, {}); v.xu = v.xu || { icon: '🪙', n: 0 }; v.xu.n += n; save(INV, v); ctx.questEvent && ctx.questEvent('coins'); };
  const subjName = (s, g) => { const S = bank.subjects[s]; return (g <= 3 && S.name13) || (g >= 6 && S.name69) || S.name; };
  function pick(g, s) {   // câu chưa hỏi của lớp g môn s; hết thì xoá dấu đã hỏi của nhóm đó
    const list = bank.grades[g]?.[s] || [], seen = load(SEEN, {}), key = g + s; let used = seen[key] || [];
    let idx = list.map((_, i) => i).filter(i => !used.includes(i)); if (!idx.length) { used = []; idx = list.map((_, i) => i); }
    const i = idx[(Math.random() * idx.length) | 0]; used.push(i); seen[key] = used; save(SEEN, seen);
    const q = list[i], order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    return { q: q.q, c: order.map(k => q.c[k]), a: order.indexOf(q.a), e: q.e };
  }

  let who = null;
  function head(g) {
    const t = who.role === 'teacher', nm = who.name.split('·')[0].trim(), title = t && !/^(Cô|Thầy|Chú|Bác) /.test(nm) ? (who.female ? 'Cô' : 'Thầy') : '';
    const ava = t ? (who.female ? '👩‍🏫' : '👨‍🏫') : who.role === 'student' ? (who.female ? '👧' : '👦') : (who.female ? '👩' : '👨');
    return `<div class="who"><span class="ava">${ava}</span><span><b>${esc(title ? title + ' ' + nm : nm)}</b><small>${bank.subjects[who.subj].icon} Đố vui môn ${subjName(who.subj, g)}</small></span><button class="chip" data-grade>Lớp ${g} ✎</button></div>`;
  }
  function chooseGrade(then) {
    const g0 = load(GRADE, 0);
    el.innerHTML = `<div class="card"><h3>🎒 Em đang học lớp mấy?</h3><p class="say">Thầy cô sẽ đố đúng bài của lớp em nhé!</p><div class="grades">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => `<button data-g="${g}" class="${g === g0 ? 'on' : ''}">${g}</button>`).join('')}</div></div>`;
    el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { save(GRADE, +b.dataset.g); ctx.sfx && ctx.sfx('ui'); then(); });
  }
  function ask() {
    const g = load(GRADE, 0); if (!g) return chooseGrade(ask);
    const q = pick(g, who.subj);
    el.innerHTML = `<div class="card">${head(g)}<h3>${esc(q.q)}</h3><div class="ch">${q.c.map((t, k) => `<button data-k="${k}">${esc(t)}</button>`).join('')}</div><p class="ex">Chọn một đáp án nhé!</p></div>`;
    el.querySelector('[data-grade]').onclick = () => chooseGrade(ask);
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === q.a;
      el.querySelectorAll('[data-k]').forEach((x, j) => { x.disabled = true; if (j === q.a) x.className = 'ok'; else if (j === k) x.className = 'bad'; });
      el.querySelector('.ex').innerHTML = ok ? `✅ <b>Chính xác!</b> +1 🪙 ${esc(q.e)}` : `💡 <b>Chưa đúng rồi.</b> Đáp án: <b>${esc(q.c[q.a])}</b>. ${esc(q.e)}`;
      el.querySelector('.card').insertAdjacentHTML('beforeend', `<div class="row"><button class="more">❓ Câu khác</button><button class="bye">👋 Tạm biệt</button></div>`);
      el.querySelector('.more').onclick = ask; el.querySelector('.bye').onclick = close;
      if (ok) { give(1); ctx.questEvent && ctx.questEvent('quiz'); ctx.sfx && ctx.sfx('ok'); ctx.player.emote && ctx.player.emote('cheer'); if (who.e?.hero) emote(who.e.hero, who.e.st, 'cheer'); }
      else { ctx.sfx && ctx.sfx('ui'); if (who.e?.hero) emote(who.e.hero, who.e.st, 'no'); }
    });
  }
  async function talk(n) {
    who = { ...n, subj: SUBJ[hash(n.name) % 4] }; ctx.player.frozen = true; el.hidden = false; ctx.sfx && ctx.sfx('ui');
    if (!bank) { el.innerHTML = '<div class="card"><h3>⏳ Đang mở sổ câu đố…</h3></div>'; await ready; }
    if (!bank) { el.innerHTML = '<div class="card"><h3>Chưa tải được câu đố, thử lại sau nhé!</h3><button class="go">Đóng</button></div>'; el.querySelector('.go').onclick = close; return; }
    ask();
  }
  ctx.teacherQuiz = { talk, open: () => !el.hidden };

  return {
    update() {
      const n = ctx.nearNpc; if (!n || !el.hidden || ctx.player.vehicle) return;
      const nm = n.name.split('·')[0].trim();
      ctx.offer(n.role === 'teacher' ? `📚 Đố vui với ${/^(Cô|Thầy) /.test(nm) ? nm : (n.female ? 'cô ' : 'thầy ') + nm}` : `💬 Nói chuyện với ${nm}`, () => talk(n), 1);
    },
  };
}
