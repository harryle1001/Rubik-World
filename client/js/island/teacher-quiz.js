// teacher-quiz.js — Thầy cô & người dân hỏi đố theo môn khi lại gần bấm E / nút "Nói chuyện".
//   KHÔNG mở màn hình riêng: câu đố là BONG BÓNG THOẠI nổi trên đầu NPC (bám theo vị trí 3D mỗi khung hình),
//   chọn đáp án ngay tại chỗ (chạm / phím 1–4, Enter = câu khác). Nhân vật không bị khoá; đi xa > 6,5 m là bong bóng tự đóng.
//   Ngân hàng câu hỏi: data/quiz-bank.json (lớp 1–9 · Toán, Tiếng Việt, Khoa học, Lịch sử – Địa lý; đáp án đúng ở c[a], hiện thì xáo).
//   Lớp của em lưu 'island.grade' (hỏi 1 lần, đổi bằng nút "Lớp n"). Câu đã hỏi lưu 'island.tq.seen' → không lặp tới khi hết câu.
//   Trả lời đúng: +1 🪙 (island.inventory) và báo bảng nhiệm vụ: ctx.questEvent('quiz').
//   Người gần nhất do town-people.js đặt vào ctx.nearNpc (≤ 2,6 m). Môn của mỗi người cố định theo tên.
// φ: bong bóng rộng 377 px (Fibonacci), chữ 13/15/21, bo 21, nút cao 44 (≈ 55/φ^½), lề 8/13, đuôi 13.
import * as THREE from 'three';
import { emote } from './characters.js';

const SUBJ = ['toan', 'tv', 'kh', 'lsdl'], GRADE = 'island.grade', SEEN = 'island.tq.seen', INV = 'island.inventory';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createTeacherQuiz(ctx) {
  let bank = null; const ready = fetch(new URL('./data/quiz-bank.json', import.meta.url)).then(r => r.json()).then(b => (bank = b)).catch(() => null);
  const css = document.createElement('style'); css.textContent = `
#tQuiz{position:fixed;left:0;top:0;z-index:27;box-sizing:border-box;width:min(377px,calc(100vw - 26px));background:#fffaf0f2;color:#3a2a1a;border-radius:21px;padding:8px 13px 13px;font:14px/1.45 system-ui;text-align:center;box-shadow:0 8px 21px #0005;border:2px solid #f0a23a;will-change:transform}
#tQuiz::after{content:'';position:absolute;left:var(--tail,50%);bottom:-13px;margin-left:-13px;border:13px solid transparent;border-bottom:0;border-top-color:#f0a23a}
#tQuiz .who{display:flex;align-items:center;gap:5px;text-align:left;font-size:13px}#tQuiz .who b{font-size:14px}#tQuiz .who span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tQuiz button{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;font-family:system-ui}
#tQuiz .chip{padding:3px 8px;border-radius:13px;border:0;background:#f3e3c3;font-weight:700;font-size:12px;color:#5a3a12;min-height:30px}
#tQuiz .x{width:30px;height:30px;border-radius:50%;border:0;background:#e8dcc6;font-weight:800;color:#5a4a3a}
#tQuiz h3{font-size:16px;line-height:1.35;margin:5px 0 8px}
#tQuiz .ch{display:grid;grid-template-columns:1fr 1fr;gap:5px}
#tQuiz .ch button{min-height:44px;padding:5px 8px;border-radius:13px;border:2px solid transparent;background:#f1e6cf;font-weight:700;font-size:14px;line-height:1.25;color:#3a2a1a}
#tQuiz .ch button i{font-style:normal;opacity:.5;margin-right:3px}
#tQuiz .ch button.ok{background:#c9efc9;border-color:#3fa36b}#tQuiz .ch button.bad{background:#ffd0c8;border-color:#d2553f}
#tQuiz .ex{margin:8px 0 0;font-size:13px;line-height:1.45}#tQuiz .row{display:grid;grid-template-columns:1.618fr 1fr;gap:5px;margin-top:8px}
#tQuiz .row button{min-height:44px;border-radius:21px;border:0;font-weight:800;font-size:14px;background:#f0a23a;color:#2a1a0a}#tQuiz .row .bye{background:#e8dcc6;color:#5a4a3a}
#tQuiz .grades{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin:5px 0 0}#tQuiz .grades button{min-height:44px;border-radius:8px;border:2px solid #e2cfa6;background:#fff;font-weight:800;font-size:16px;color:#5a3a12;padding:0}
#tQuiz .grades button.on{background:#f0a23a;border-color:#c97c18}
body.rs-modal #tQuiz,body.mg-on #tQuiz{display:none}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'tQuiz'; el.hidden = true; document.body.appendChild(el);
  let who = null, cur = null, answered = false;
  const close = () => { el.hidden = true; who = null; cur = null; };

  addEventListener('keydown', e => {
    if (el.hidden || e.repeat) return;
    if (e.code === 'Escape') return close();
    const n = '1234'.indexOf(e.key); if (n >= 0 && cur && !answered) { el.querySelector(`[data-k="${n}"]`)?.click(); return; }
    const g = '123456789'.indexOf(e.key); if (g >= 0 && el.querySelector('[data-g]')) { el.querySelector(`[data-g="${g + 1}"]`).click(); return; }
    if (e.code === 'Enter' && answered) ask();
  });

  const give = n => { const v = load(INV, {}); v.xu = v.xu || { icon: '🪙', n: 0 }; v.xu.n += n; save(INV, v); ctx.questEvent && ctx.questEvent('coins'); };
  const subjName = (s, g) => { const S = bank.subjects[s]; return (g <= 3 && S.name13) || (g >= 6 && S.name69) || S.name; };
  function pick(g, s) {   // câu chưa hỏi của lớp g môn s; hết thì xoá dấu đã hỏi của nhóm đó
    const list = bank.grades[g]?.[s] || [], seen = load(SEEN, {}), key = g + s; let used = seen[key] || [];
    let idx = list.map((_, i) => i).filter(i => !used.includes(i)); if (!idx.length) { used = []; idx = list.map((_, i) => i); }
    const i = idx[(Math.random() * idx.length) | 0]; used.push(i); seen[key] = used; save(SEEN, seen);
    const q = list[i], order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    return { q: q.q, c: order.map(k => q.c[k]), a: order.indexOf(q.a), e: q.e };
  }
  function head(g) {
    const t = who.role === 'teacher', nm = who.name.split('·')[0].trim(), title = t && !/^(Cô|Thầy|Chú|Bác) /.test(nm) ? (who.female ? 'Cô' : 'Thầy') : '';
    const ava = t ? (who.female ? '👩‍🏫' : '👨‍🏫') : who.role === 'student' ? (who.female ? '👧' : '👦') : (who.female ? '👩' : '👨');
    return `<div class="who">${ava}<span><b>${esc(title ? title + ' ' + nm : nm)}</b> · ${bank.subjects[who.subj].icon} ${subjName(who.subj, g || 4)}</span>${g ? `<button class="chip" data-grade>Lớp ${g} ✎</button>` : ''}<button class="x" aria-label="Đóng">✕</button></div>`;
  }
  const bindHead = () => { el.querySelector('.x').onclick = close; const c = el.querySelector('[data-grade]'); if (c) c.onclick = () => chooseGrade(ask); };
  function chooseGrade(then) {
    const g0 = load(GRADE, 0); cur = null;
    el.innerHTML = `${head(0)}<h3>🎒 Em học lớp mấy? Thầy cô đố đúng bài lớp em nhé!</h3><div class="grades">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => `<button data-g="${g}" class="${g === g0 ? 'on' : ''}">${g}</button>`).join('')}</div>`;
    bindHead(); el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { save(GRADE, +b.dataset.g); ctx.sfx && ctx.sfx('ui'); then(); });
  }
  function ask() {
    const g = load(GRADE, 0); if (!g) return chooseGrade(ask);
    const q = cur = pick(g, who.subj); answered = false;
    el.innerHTML = `${head(g)}<h3>${esc(q.q)}</h3><div class="ch">${q.c.map((t, k) => `<button data-k="${k}"><i>${k + 1}</i>${esc(t)}</button>`).join('')}</div>`;
    bindHead();
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      if (answered) return; answered = true;
      const k = +b.dataset.k, ok = k === q.a;
      el.querySelectorAll('[data-k]').forEach((x, j) => { x.disabled = true; if (j === q.a) x.className = 'ok'; else if (j === k) x.className = 'bad'; });
      el.insertAdjacentHTML('beforeend', `<p class="ex">${ok ? `✅ <b>Chính xác!</b> +1 🪙 ${esc(q.e)}` : `💡 <b>Chưa đúng.</b> Đáp án: <b>${esc(q.c[q.a])}</b>. ${esc(q.e)}`}</p><div class="row"><button class="more">❓ Câu khác</button><button class="bye">👋 Tạm biệt</button></div>`);
      el.querySelector('.more').onclick = ask; el.querySelector('.bye').onclick = close;
      if (ok) { give(1); ctx.questEvent && ctx.questEvent('quiz'); ctx.sfx && ctx.sfx('ok'); ctx.player.emote && ctx.player.emote('cheer'); if (who.e?.hero) emote(who.e.hero, who.e.st, 'cheer'); }
      else { ctx.sfx && ctx.sfx('ui'); if (who.e?.hero) emote(who.e.hero, who.e.st, 'no'); }
    });
  }
  async function talk(n) {
    who = { ...n, subj: SUBJ[hash(n.name) % 4] }; el.hidden = false; ctx.sfx && ctx.sfx('ui'); ctx.player.emote && ctx.player.emote('interact');
    if (!bank) { el.innerHTML = '<h3>⏳ Để thầy cô nghĩ câu đố nhé…</h3>'; await ready; }
    if (!who) return;
    if (!bank) { el.innerHTML = '<h3>Chưa nghĩ ra câu đố, lát nữa quay lại nhé!</h3>'; setTimeout(close, 2618); return; }
    ask();
  }
  ctx.teacherQuiz = { talk, open: () => !el.hidden, close };

  // ---------- Bám bong bóng theo đầu NPC (chiếu toạ độ 3D → màn hình) ----------
  const v = new THREE.Vector3();
  function place() {
    const m = who.e?.hero?.model, p = ctx.player.pos;
    if (m) v.set(m.position.x, m.position.y + (who.e.a?._look3d?.h || 1.7) + 0.34, m.position.z); else v.set(p.x, p.y + 2.2, p.z);
    if (m && Math.hypot(m.position.x - p.x, m.position.z - p.z) > 6.5) { ctx.toast && ctx.toast('👋 Tạm biệt! Lại gần và bấm <b>E</b> để đố tiếp nhé.', 2000); return close(); }
    v.project(ctx.camera);
    const W = innerWidth, H = innerHeight, w = el.offsetWidth, h = el.offsetHeight, ax = (v.x + 1) / 2 * W, ay = (1 - v.y) / 2 * H;
    const x = Math.max(13, Math.min(W - w - 13, ax - w / 2)), top = Math.max(55, Math.min(H - h - 89, ay - h - 13));   // tránh hàng nút trên (55) và nút dưới (89)
    el.style.transform = `translate(${Math.round(x)}px,${Math.round(top)}px)`;
    el.style.setProperty('--tail', Math.max(21, Math.min(w - 21, ax - x)) + 'px');
  }

  return {
    update() {
      if (!el.hidden && who) { place(); if (who) ctx.offer('👋 Tạm biệt', close, 9); return; }   // đang đố: nút E/hành động = đóng bong bóng (không mở nhầm cửa gần đó)
      const n = ctx.nearNpc; if (!n || ctx.player.vehicle || ctx.player.frozen) return;
      const nm = n.name.split('·')[0].trim();
      ctx.offer(n.role === 'teacher' ? `📚 Đố vui với ${/^(Cô|Thầy) /.test(nm) ? nm : (n.female ? 'cô ' : 'thầy ') + nm}` : `💬 Nói chuyện với ${nm}`, () => talk(n), n.d < 1.618 ? 3 : 1);   // đứng sát (< φ m) → ưu tiên hơn cửa nhà gần đó
    },
  };
}
