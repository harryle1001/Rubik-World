// story/journal.js — TIẾN TRÌNH NGƯỜI CHƠI: XP & cấp độ (dùng profile.level/exp của tài khoản), cây kỹ năng nhỏ, danh hiệu,
// 📔 SỔ TAY PHIÊU LƯU (6 trang): Nhiệm vụ · Bí mật · Sinh vật · Kiến thức · Kỹ năng · Danh hiệu.
// XP: đúng 1 câu +5 (ôn lại câu từng sai +8, sai vẫn +1 vì đã cố gắng) · xong nhiệm vụ +13 · xong chương 21 → 610 (Fibonacci).
// Mỗi lần lên cấp +1 điểm kỹ năng; kỹ năng có 3 bậc, mở ở cấp 2 · 3 · 5. Hiệu lực áp lại mỗi 0,5 s (nhẹ).
import { CFG } from '../config.js';
import { SKILLS, SKILL_LV, TITLES_EXTRA } from './data.js';
import { SPECIES } from '../sea-data.js';
import { FAUNA_INFO } from '../fauna.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const RUN0 = CFG.player.run, G0 = CFG.player.gravity;
const PCT = [0, 0.08, 0.13, 0.21], GLIDE = [1, 1.6, 2.6, 4.2], LUNG = [21, 34, 55, 89], MANA = [0, 8, 13, 21];

export function createJournal(ctx, { S, save, CHAPTERS, say }) {
  const acc = () => ctx.account, prof = () => acc() && acc().profile;
  const tier = id => (S().skills || {})[id] | 0;
  const spent = () => Object.values(S().skills || {}).reduce((a, b) => a + b, 0);
  const points = () => { const p = prof(); return p ? Math.max(0, p.level - 1 - spent()) : 0; };

  function addXP(n, why) {
    const p = prof(); if (!p || !n) return; const L0 = p.level; acc().addExp(n);
    if (p.level > L0) { ctx.sfx && ctx.sfx('open'); ctx.player.emote && ctx.player.emote('cheer'); setTimeout(() => ctx.toast(`⬆️ <b>Lên cấp ${p.level}!</b> +${p.level - L0} điểm kỹ năng 🌟 — mở 📔 Sổ tay › Kỹ năng.`, 6000), 1200); }
  }
  function giveTitle(name) {
    const s = S(); s.titles = s.titles || []; if (s.titles.includes(name)) return; s.titles.push(name); s.title = name; save();
    setTimeout(() => ctx.toast(`🏅 Danh hiệu mới: <b>${esc(name)}</b>`, 5000), 2400);
  }
  function onAnswer({ ok, review }) {
    addXP(ok ? (review ? 8 : 5) : 1);
    if (ok && review) { S().revOk = (S().revOk | 0) + 1; save(); }
    if (ok && tier('mana') && ctx.magic && ctx.magic.hasWand) ctx.magic.setMana(ctx.magic.mana + MANA[tier('mana')]);
    if (ctx.learn) { const L = ctx.learn.stats(); for (const T of TITLES_EXTRA) if (T.test(L, S())) giveTitle(T.n); }
  }

  // ---------- hiệu lực kỹ năng ----------
  let held = false;
  addEventListener('keydown', e => { if (e.code === 'Space') held = true; }); addEventListener('keyup', e => { if (e.code === 'Space') held = false; });
  const bj = document.getElementById('bJump'); if (bj) { bj.addEventListener('pointerdown', () => held = true); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) bj.addEventListener(ev, () => held = false); }
  let slow = 0;
  function update(dt) {
    const pl = ctx.player, gl = tier('glide');
    CFG.player.gravity = gl && held && !pl.grounded && !pl.vehicle && !(ctx.dive && ctx.dive.swimming) ? G0 / GLIDE[gl] : G0;
    if ((slow -= dt) > 0) return; slow = 0.5;
    CFG.player.run = RUN0 * (1 + PCT[tier('run')]);
    if (ctx.dive) ctx.dive.maxOxygen = Math.max(21, LUNG[tier('lung')]);
    const v = pl.vehicle; if (v && v.speed) { if (v._b0 == null) v._b0 = v.speed; v.speed = v._b0 * (1 + PCT[tier('ride')]); }
    if (el && !el.hidden && !document.body.classList.contains('rs-modal')) document.body.classList.add('rs-modal');
  }

  // ---------- 📔 Sổ tay ----------
  const css = document.createElement('style'); css.textContent = `
#stBook{position:fixed;inset:0;z-index:38;display:flex;align-items:center;justify-content:center;background:#0006;font:14px/1.45 system-ui}
#stBook .bk{box-sizing:border-box;width:min(610px,calc(100vw - 16px));max-height:calc(100dvh - 26px);display:flex;flex-direction:column;background:#fff8e8;color:#3a2a1a;border:3px solid #a8784a;border-radius:21px;box-shadow:0 13px 34px #0008;overflow:hidden}
#stBook header{display:flex;align-items:center;gap:8px;padding:8px 13px;background:#f3e3c3}#stBook header b{font-size:16px}#stBook header .who{flex:1;min-width:0}
#stBook header .xp{height:8px;border-radius:5px;background:#e2cfa6;overflow:hidden;margin-top:3px}#stBook header .xp u{display:block;height:100%;background:linear-gradient(90deg,#f0a23a,#ffd23f)}
#stBook button{cursor:pointer;font-family:system-ui;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
#stBook .x{width:44px;height:44px;border-radius:50%;border:0;background:#e8dcc6;font-size:18px;font-weight:800;color:#5a4a3a;flex:none}
#stBook nav{display:flex;gap:3px;padding:5px 8px;overflow-x:auto;scrollbar-width:none;border-bottom:2px solid #e2cfa6}#stBook nav button{flex:none;min-height:44px;border:0;border-radius:13px;padding:0 10px;background:transparent;font-weight:800;font-size:13px;color:#7a5a2e}#stBook nav button.on{background:#f0a23a;color:#2a1a0a}
#stBook main{overflow:auto;padding:8px 13px 13px}#stBook h4{margin:8px 0 5px;font-size:15px}
#stBook .ch{border-radius:13px;background:#f6ead2;padding:8px;margin:5px 0}#stBook .ch.cur{background:#ffe9b8;border:2px solid #f0a23a}#stBook .ch.lock{opacity:.55}
#stBook .ch ol{margin:5px 0 0;padding-left:21px}#stBook .ch li.ok{color:#3fa36b}#stBook .ch li.now{font-weight:800}
#stBook .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(89px,1fr));gap:5px}#stBook .grid div{background:#f6ead2;border-radius:13px;padding:5px;text-align:center;font-size:12px}#stBook .grid div i{display:block;font-style:normal;font-size:26px}#stBook .grid .no{opacity:.45}
#stBook .row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #e9dcc0}#stBook .row span{flex:1}#stBook .row .bar{width:89px;height:8px;border-radius:5px;background:#e2cfa6;overflow:hidden}#stBook .row .bar u{display:block;height:100%;background:#3fa36b}
#stBook .sk{display:flex;align-items:center;gap:8px;padding:8px;margin:5px 0;border-radius:13px;background:#f6ead2}#stBook .sk i{font-style:normal;font-size:26px}#stBook .sk span{flex:1}#stBook .sk small{display:block;opacity:.75}
#stBook .pri{min-height:44px;border:0;border-radius:21px;padding:0 13px;background:#f0a23a;color:#2a1a0a;font-weight:800;font-size:14px}#stBook .pri:disabled{background:#e2cfa6;color:#8a7a62}
#stBook .tt{display:inline-block;margin:3px;padding:5px 10px;border-radius:13px;background:#f6ead2;border:2px solid transparent;font-weight:700}#stBook .tt.on{border-color:#f0a23a;background:#ffe9b8}`;
  document.head.appendChild(css);
  let el = null, tab = 'quest';
  const TABS = [['quest', '📜 Nhiệm vụ'], ['egg', '🔎 Bí mật'], ['bio', '🐾 Sinh vật'], ['know', '🧠 Kiến thức'], ['skill', '🌟 Kỹ năng'], ['title', '🏅 Danh hiệu']];
  function page() {
    const s = S();
    if (tab === 'quest') return `<h4>🧩 Khối Rubik Pha Lê · ${Math.min(8, s.ch)}/8 mảnh</h4>` + CHAPTERS.map((C, k) => {
      const st = k < s.ch ? 'done' : k === s.ch ? 'cur' : 'lock';
      if (st === 'lock') return `<div class="ch lock">🔒 <b>Chương ${C.id}</b> · ???</div>`;
      return `<div class="ch ${st}">${st === 'done' ? '✅' : C.icon} <b>Chương ${C.id}: ${esc(C.name)}</b> · ${esc(C.region)} · <small>${esc(C.subj)}</small>
        ${st === 'cur' ? `<ol>${C.tasks.map((T, i) => `<li class="${i < s.ti ? 'ok' : i === s.ti ? 'now' : ''}">${i < s.ti ? '✓ ' : ''}${esc(T.text)}</li>`).join('')}<li class="${s.ti >= C.tasks.length ? 'now' : ''}">✨ Nhặt ${esc(C.name)}</li></ol>
        <button class="pri" data-replay style="margin-top:5px">🎬 Xem lại đoạn mở đầu</button>` : ''}</div>`;
    }).join('');
    if (tab === 'egg') { const f = ctx.eggs ? Object.keys(ctx.eggs.found || {}).length : 0, tr = ls('island.treasure', {}); return `<h4>🔎 Bí mật đã tìm: ${f}/21</h4><p>21 bí mật giấu khắp đảo: khối Rubik vàng, số π, hoa Fibonacci, cá voi… Sổ bí mật có gợi ý cho từng cái.</p><button class="pri" data-eggs>📖 Mở Sổ bí mật</button><h4>🧰 Kho báu đáy biển: ${Object.keys(tr || {}).length ? Object.keys(tr).length : 0}/13 rương</h4>`; }
    if (tab === 'bio') { const sea = ls('island.sealife', {}), dex = ls('island.dex', {}), land = Object.values(FAUNA_INFO); const all = [...SPECIES.map(x => ({ id: x.id, n: x.name, i: x.icon, ok: sea[x.id] || dex[x.id] })), ...land.map(x => ({ id: x.id, n: x.name, i: '🐾', ok: dex[x.id] }))]; const k = all.filter(x => x.ok).length;
      return `<h4>🐾 Sinh vật đã gặp: ${k}/${all.length}</h4><div class="grid">${all.map(x => `<div class="${x.ok ? '' : 'no'}"><i>${x.ok ? x.i : '❓'}</i>${x.ok ? esc(x.n) : '???'}</div>`).join('')}</div><p><small>Lặn biển bấm E cạnh sinh vật để ghi Bách khoa biển; trên bờ lại gần con vật (bản đồ 🗺️ › Sổ sinh vật).</small></p>`; }
    if (tab === 'know') { if (!ctx.learn) return ''; const L = ctx.learn.stats(); return `<h4>🧠 Kiến thức · Lớp ${ctx.learn.grade || '?'} <button class="pri" data-grade style="min-height:34px">✎ Đổi lớp</button></h4>
      ${Object.entries(ctx.learn.SUBJ).map(([k, v]) => { const x = L[k]; return `<div class="row">${v.i}<span><b>${v.n}</b><br><small>${x.n} câu · đúng ${x.n ? Math.round(x.ok / x.n * 100) : 0} % · đang ở mức lớp ${x.lv}</small></span><div class="bar"><u style="width:${x.n ? x.ok / x.n * 100 : 0}%"></u></div></div>`; }).join('')}
      <p>🧠 Đã nhớ chắc: <b>${L.known}</b> câu · 🔁 Cần ôn lại: <b>${L.review}</b> câu</p><p><small>Câu em trả lời sai sẽ được hỏi lại sau 1 phút, rồi 5 · 34 · 233 phút… (dãy Fibonacci) cho tới khi nhớ chắc.</small></p>
      <button class="pri" data-review>📚 Ôn tập 5 câu (+XP)</button>`; }
    if (tab === 'skill') { const p = prof(); return `<h4>🌟 Điểm kỹ năng: ${points()} <small>(cấp ${p ? p.level : 1} · mỗi lần lên cấp +1 điểm)</small></h4>` + SKILLS.map(K => { const t = tier(K.id), need = SKILL_LV[t], can = t < 3 && points() > 0 && p && p.level >= need;
      return `<div class="sk"><i>${K.i}</i><span><b>${K.n}</b> ${'●'.repeat(t)}${'○'.repeat(3 - t)}<small>Hiện tại: ${K.d(t)}${t < 3 ? `<br>Bậc ${t + 1}: ${K.d(t + 1)} · cần cấp ${need}` : '<br>Đã tối đa!'}</small></span><button class="pri" data-sk="${K.id}" ${can ? '' : 'disabled'}>＋</button></div>`; }).join(''); }
    if (tab === 'title') { const T = s.titles || []; return `<h4>🏅 Danh hiệu: ${T.length}</h4>${T.length ? T.map(n => `<button class="tt ${n === s.title ? 'on' : ''}" data-tt="${esc(n)}">🏅 ${esc(n)}</button>`).join('') : '<p>Hoàn thành chương truyện để nhận danh hiệu đầu tiên!</p>'}<h4>Còn có thể nhận</h4>${[...CHAPTERS.map(C => ({ n: C.title, d: `Hoàn thành chương ${C.id}` })), ...TITLES_EXTRA.map(x => ({ n: x.n, d: x.d }))].filter(x => !T.includes(x.n)).map(x => `<div class="row">🔒<span><b>${esc(x.n)}</b> · <small>${esc(x.d)}</small></span></div>`).join('')}`; }
    return '';
  }
  function render() {
    if (!el) return; const p = prof() || { level: 1, exp: 0, name: 'Em' }, need = acc() ? acc().needExp(p.level) : 100;
    el.innerHTML = `<div class="bk"><header><span style="font-size:34px">📔</span><div class="who"><b>${esc(p.name)}</b> · Cấp ${p.level}${S().title ? ` · 🏅 ${esc(S().title)}` : ''}<div class="xp"><u style="width:${Math.min(100, p.exp / need * 100)}%"></u></div><small>${p.exp}/${need} XP tới cấp ${p.level + 1}</small></div><button class="x" aria-label="Đóng">✕</button></header>
      <nav>${TABS.map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</nav><main>${page()}</main></div>`;
  }
  function open(t) {
    if (t) tab = t; if (!el) { el = document.createElement('div'); el.id = 'stBook'; document.body.appendChild(el); el.onclick = click; }
    el.hidden = false; ctx.player.frozen = true; document.body.classList.add('rs-modal'); render(); ctx.sfx && ctx.sfx('ui');
  }
  function close() { if (!el || el.hidden) return; el.hidden = true; document.body.classList.remove('rs-modal'); ctx.player.frozen = false; }
  function click(e) {
    const b = e.target.closest('button'); if (e.target === el) return close(); if (!b) return;
    if (b.classList.contains('x')) return close();
    if (b.dataset.t) { tab = b.dataset.t; render(); return; }
    if (b.dataset.sk) { const id = b.dataset.sk, t = tier(id), p = prof(); if (t < 3 && points() > 0 && p && p.level >= SKILL_LV[t]) { S().skills = S().skills || {}; S().skills[id] = t + 1; save(); slow = 0; ctx.sfx && ctx.sfx('win'); const K = SKILLS.find(k => k.id === id); ctx.toast(`${K.i} <b>${K.n}</b> bậc ${t + 1}: ${K.d(t + 1)}`, 4000); } render(); return; }
    if (b.dataset.tt) { S().title = b.dataset.tt; save(); render(); return; }
    if (b.dataset.eggs !== undefined) { close(); ctx.eggs && ctx.eggs.openBook && ctx.eggs.openBook(); return; }
    if (b.dataset.grade !== undefined) { close(); ctx.learn.chooseGrade(() => open('know')); return; }
    if (b.dataset.review !== undefined) { close(); ctx.learn.askSet({ s: ['toan', 'tv', 'kh', 'lsdl', 'ta'], n: 5, need: 3, title: '📔 Ôn tập', ava: '🧠' }).then(r => ctx.toast(`🧠 Ôn tập xong: đúng ${r.n}/5 câu!`, 4000)); return; }
    if (b.dataset.replay !== undefined) { close(); const C = CHAPTERS[S().ch]; if (C) say(C.intro, { cine: true }); }
  }
  addEventListener('keydown', e => { if (e.code === 'KeyJ' && !e.repeat && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) { if (el && !el.hidden) close(); else if (!ctx.player.frozen) open(); } else if (e.code === 'Escape' && el && !el.hidden) close(); });
  return { addXP, giveTitle, onAnswer, open, close, update, points, get isOpen() { return !!(el && !el.hidden); } };
}
