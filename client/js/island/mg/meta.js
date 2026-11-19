// mg/meta.js — LỚP CHUNG CHO MỌI MINI GAME 3D (gắn vào host.js, game không phải sửa gì):
//   🎚️ cấp độ Dễ/Vừa/Khó (api.level 1–3, api.lv 'easy'|'medium'|'hard'; cờ vua/caro/vây dùng nút riêng, chung khoá 'mg.<key>.level')
//   🏆 bảng xếp hạng: máy này (localStorage 'mg.lb.<key>') + toàn trường (server /island 'mgScore'/'mgTop' nếu có mạng)
//   🏅 13 huy hiệu (Fibonacci) · 📋 3 nhiệm vụ mini game mỗi ngày · 🪙 xu + 🏰 điểm nhà Tứ Linh mỗi ván
//   🤝 2 người: bạn khác (net.js) lại gần người đang chơi → "✋ Chơi cùng" → chủ khu đồng ý → cùng chơi, đấu điểm trực tiếp
//      (game hỗ trợ lượt đi chung như cờ caro dùng api.peer: send(d) / on(fn) / host)
//   Câu hỏi học tập theo lớp 1–9: quiz.js / quick-quiz.js đọc QZ (lớp từ 'island.grade', cấp độ đẩy ±1 lớp).
// φ: 13 huy hiệu, 3 nhiệm vụ, thưởng 3·5·8·13·21, bán kính mời chơi 8 m, thẻ bo 21/13.
import { QZ } from './quiz.js';
import { createSigns } from './signs.js';

const LV = ['easy', 'medium', 'hard'], LVN = ['🟢 Dễ', '🟡 Vừa', '🔴 Khó'], OWN_LV = new Set(['chess', 'caro', 'go']);
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const rng = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GROUP = { board: ['chess', 'caro', 'go', 'rubik'], sport: ['olympics', 'football', 'basketball', 'skate', 'patin', 'ski', 'kart', 'animal-race', 'balloon', 'arcade', 'missile', 'fishing', 'fishing-boat'] };
export const BADGES = [
  ['first', '🎮', 'Lần đầu chơi', 'Chơi xong 1 ván mini game'], ['g5', '🧭', 'Nhà thám hiểm', 'Chơi 5 mini game khác nhau'], ['g13', '🗺️', 'Đi khắp trường', 'Chơi 13 mini game khác nhau'],
  ['p34', '⭐', 'Chăm chỉ', 'Chơi xong 34 ván'], ['rec', '🏆', 'Phá kỷ lục', 'Lập kỷ lục mới lần đầu'], ['hard', '🔥', 'Dũng cảm', 'Chơi xong 1 ván mức Khó'],
  ['q21', '🧠', 'Thông thái', 'Trả lời đúng 21 câu trong mini game'], ['q89', '🎓', 'Học giả', 'Trả lời đúng 89 câu trong mini game'], ['duo', '🤝', 'Bạn đồng hành', 'Chơi cùng 1 bạn'],
  ['board', '♟️', 'Kỳ thủ', 'Chơi đủ cờ vua, caro, cờ vây, Rubik'], ['sport', '🏅', 'Vận động viên', 'Chơi 5 trò thể thao'], ['arts', '🎨', 'Nghệ sĩ', 'Chơi 5 trò nghệ thuật & tri thức'],
  ['daily3', '📅', 'Đều đặn', 'Xong nhiệm vụ mini game 3 ngày'],
];
const CSS = `#mgHud .mg-lv{border:0;border-radius:13px;padding:3px 8px;background:#ffffff26;color:#fff;font:800 13px system-ui;cursor:pointer}
#mgHud .mg-duo{padding:3px 8px;border-radius:13px;background:#3d8fd9;font:800 13px system-ui}
#mgHud .mg-card .meta{margin:8px 0 0;font:600 13px/1.5 system-ui;text-align:left;background:#f3e6c9;border-radius:13px;padding:8px 13px}
#mgHud .mg-card .meta b{color:#c0662a}#mgHud .mg-card ol{margin:5px 0;padding-left:21px;text-align:left;font:600 14px/1.6 system-ui}
#mgHud .mg-card .tabs{display:flex;gap:5px;justify-content:center;margin:5px 0}#mgHud .mg-card .tabs button{min-height:34px;padding:3px 13px;font-size:13px}
.mgBadges{display:grid;grid-template-columns:repeat(auto-fill,minmax(89px,1fr));gap:5px;margin:8px 0}.mgBadges div{padding:5px;border-radius:13px;background:#efe3cc;font:700 11px/1.3 system-ui;text-align:center}
.mgBadges div b{display:block;font-size:21px}.mgBadges div.off{opacity:.35;filter:grayscale(1)}
#mgJoin{position:fixed;left:50%;bottom:calc(max(13px,env(safe-area-inset-bottom)) + 70px);transform:translateX(-50%);z-index:41;width:min(92vw,340px);padding:13px;border-radius:21px;background:#fff6df;color:#3b2a1e;
  border:3px solid #3d8fd9;font:700 15px/1.45 system-ui;text-align:center;box-shadow:0 8px 34px #0006}#mgJoin button{min-height:44px;margin:8px 4px 0;padding:8px 13px;border-radius:13px;border:2px solid #7a5a2e;background:#efe3cc;font:800 15px system-ui}
#mgJoin button.pri{background:#3fa36b;color:#fff;border-color:#2b7a4c}`;

export function createMeta(ctx, host, $) {
  { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
  const P = load('mg.meta', { plays: 0, games: {}, q: 0, badges: {}, dailyDone: 0 });   // tiến độ chung của máy này
  const keep = () => save('mg.meta', P);
  const me = () => (ctx.account && ctx.account.profile && ctx.account.profile.name) || ctx.playerName || 'Em';
  const gname = k => ((ctx.miniGames[k] && ctx.miniGames[k].name) || k);
  let cur = null;   // { key, api, peer, peerScore }

  // ---------- Thưởng: xu + điểm nhà ----------
  function pay(coins, house, why) {
    let s = '';
    if (coins && ctx.account && ctx.account.addCoins && ctx.account.addCoins(coins)) s += ` · 🪙 +${coins} xu`;
    if (house && ctx.houses && ctx.houses.addPoints) { try { ctx.houses.addPoints(house, why); s += ` · 🏰 +${house} điểm nhà`; } catch (e) {} }
    return s;
  }
  // ---------- Huy hiệu ----------
  function badge(id) {
    if (P.badges[id]) return ''; const b = BADGES.find(x => x[0] === id); if (!b) return '';
    P.badges[id] = Date.now(); keep(); ctx.sfx && ctx.sfx('win');
    const r = pay(5, 3, 'huy hiệu ' + b[2]); ctx.toast && ctx.toast(`🏅 Huy hiệu mới: <b>${b[1]} ${b[2]}</b><br>${b[3]}${r}`, 4200);
    return `<br>🏅 Huy hiệu mới: <b>${b[1]} ${b[2]}</b>`;
  }
  function checkBadges(extra = {}) {
    const played = Object.keys(P.games), has = k => P.games[k];
    const conds = { first: P.plays >= 1, g5: played.length >= 5, g13: played.length >= 13, p34: P.plays >= 34, rec: extra.nb, hard: extra.hard, q21: P.q >= 21, q89: P.q >= 89, duo: extra.duo,
      board: GROUP.board.every(has), sport: GROUP.sport.filter(has).length >= 5, arts: played.filter(k => !GROUP.board.includes(k) && !GROUP.sport.includes(k)).length >= 5, daily3: P.dailyDone >= 3 };
    let out = ''; for (const [id, ok] of Object.entries(conds)) if (ok) out += badge(id); return out;
  }
  // ---------- Nhiệm vụ mini game hằng ngày (giống nhau với mọi người trong 1 ngày) ----------
  function daily() {
    let D = load('mg.daily', null); const day = today();
    if (D && D.day === day) return D;
    const keys = [...new Set(Object.keys(ctx.miniGames).filter(k => ctx.miniGames[k].group !== 'academy' && host.doorOf(k)).map(k => ctx.miniGames[k]))].map(g => Object.keys(ctx.miniGames).find(k => ctx.miniGames[k] === g && host.doorOf(k)));
    const r = rng([...day].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 13)), pick = a => a[Math.floor(r() * a.length)];
    const g1 = pick(keys) || 'caro';
    D = { day, done: false, list: [
      { id: 'play', k: g1, need: 1, n: 0, t: `Chơi 1 ván ${gname(g1)}` },
      { id: 'quiz', need: 5, n: 0, t: 'Trả lời đúng 5 câu hỏi trong mini game' },
      pick([{ id: 'many', need: 3, n: 0, t: 'Chơi 3 mini game khác nhau', seen: [] }, { id: 'lv2', need: 1, n: 0, t: 'Chơi xong 1 ván mức Vừa hoặc Khó' }]),
    ] };
    save('mg.daily', D); return D;
  }
  function dailyStep(fn) {
    const D = daily(); let msg = '';
    for (const q of D.list) { if (q.n >= q.need) continue; if (fn(q)) { q.n = Math.min(q.need, q.n + 1); if (q.n >= q.need) msg += `<br>📋 Xong nhiệm vụ: <b>${q.t}</b>${pay(8, 5, 'nhiệm vụ mini game')}`; } }
    if (!D.done && D.list.every(q => q.n >= q.need)) { D.done = true; P.dailyDone++; keep(); msg += `<br>🎉 Xong cả 3 nhiệm vụ hôm nay!${pay(21, 8, 'nhiệm vụ mini game')}`; }
    save('mg.daily', D); return msg;
  }
  const dailyHtml = () => { const D = daily(); return `<div class="meta">📋 <b>Nhiệm vụ mini game hôm nay</b>${D.list.map(q => `<br>${q.n >= q.need ? '✅' : '⬜'} ${esc(q.t)} (${q.n}/${q.need})`).join('')}${D.done ? '<br>🎉 Đã xong hôm nay!' : '<br>Thưởng: 🪙 8 xu + 🏰 5 điểm nhà mỗi việc, xong cả 3 thêm 21 xu'}</div>`; };
  const badgesHtml = () => `<div class="mgBadges">${BADGES.map(b => `<div class="${P.badges[b[0]] ? '' : 'off'}" title="${esc(b[3])}"><b>${b[1]}</b>${esc(b[2])}</div>`).join('')}</div>`;

  // ---------- Bảng xếp hạng ----------
  const fmt = (v, lb) => lb ? `${Math.floor(v / 60)}:${(v % 60).toFixed(1).padStart(4, '0')}` : v;
  function lbAdd(key, s, lb) {
    const L = load('mg.lb.' + key, []), e = { n: me(), s, t: Date.now() }; L.push(e); L.sort((a, b) => lb ? a.s - b.s : b.s - a.s); L.length = Math.min(L.length, 8); save('mg.lb.' + key, L);
    if (ctx.net && ctx.net.emit) ctx.net.emit('mgScore', { k: key, s, lb });
    return L.indexOf(e) + 1;
  }
  const school = {};   // bảng toàn trường (server trả về)
  function lbHtml(key, lb, tab) {
    const L = tab === 'school' ? school[key] : load('mg.lb.' + key, []);
    if (tab === 'school' && !(ctx.net && ctx.net.connected)) return '<p>Chưa kết nối máy chủ — bảng toàn trường cần mạng.</p>';
    if (!L || !L.length) return '<p>Chưa có ai — hãy là người đầu tiên!</p>';
    return `<ol>${L.slice(0, 8).map(e => `<li>${esc(e.n)} — <b>${fmt(e.s, lb)}</b></li>`).join('')}</ol>`;
  }
  function showBoard(key, lb, back) {
    const card = $('.mg-card'); let tab = 'local';
    const draw = () => {
      card.innerHTML = `<h3>🏆 ${esc(gname(key))}</h3><div class="tabs"><button data-t="local" class="${tab === 'local' ? 'pri' : ''}">📱 Máy này</button><button data-t="school" class="${tab === 'school' ? 'pri' : ''}">🏫 Toàn trường</button><button data-t="badge" class="${tab === 'badge' ? 'pri' : ''}">🏅 Huy hiệu</button></div>`
        + (tab === 'badge' ? badgesHtml() + dailyHtml() : lbHtml(key, lb, tab)) + '<div><button class="pri" data-t="back">↩ Quay lại</button></div>';
      card.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); const t = b.dataset.t; if (t === 'back') return back(); tab = t; if (t === 'school' && ctx.net && ctx.net.emit) ctx.net.emit('mgTop', key); draw(); });
    };
    if (ctx.net && ctx.net.on) ctx.net.on('mgTop', d => { if (d && d.k) { school[d.k] = d.list; if (!card.hidden && tab === 'school') draw(); } });
    draw(); card.hidden = false;
  }

  // ---------- 2 người chơi (net.js) ----------
  const net = () => ctx.net && ctx.net.connected ? ctx.net : null;
  const send = (to, type, d) => { const n = net(); if (n) n.emit('mgTo', { to, type, d }); };
  let joinEl = null, pending = null, offerT = 0, signs, near = null;   // pending: lời mời đã gửi / đã được chấp nhận (chờ vào game)
  function prompt(html, yes, no) {
    if (!joinEl) { joinEl = document.createElement('div'); joinEl.id = 'mgJoin'; document.body.appendChild(joinEl); }
    joinEl.innerHTML = html + (yes ? '<div><button class="pri">✓ Đồng ý</button><button>✕ Không</button></div>' : '');
    joinEl.hidden = false; clearTimeout(joinEl._t); joinEl._t = setTimeout(() => { joinEl.hidden = true; no && no(); }, yes ? 21000 : 3400);   // trẻ cần thời gian đọc: lời mời chờ 21 s
    if (yes) { const [a, b] = joinEl.querySelectorAll('button'); a.onclick = () => { joinEl.hidden = true; clearTimeout(joinEl._t); yes(); }; b.onclick = () => { joinEl.hidden = true; clearTimeout(joinEl._t); no && no(); }; }
  }
  function onMsg(m) {
    if (!m || !m.type) return;
    if (m.type === 'join') {   // có bạn xin vào khu mình đang chơi
      if (!cur || cur.peer) return send(m.from, 'no', { busy: 1 });
      prompt(`🤝 <b>${esc(m.name)}</b> muốn chơi ${esc(gname(cur.key))} cùng em!`, () => { if (!cur) return; const d = cur.api.door; send(m.from, 'ok', { k: cur.key, x: d ? d.x : null, z: d ? d.z : null, a: cur.api.anchor.map(v => +v.toFixed(3)) }); setPeer({ id: m.from, name: m.name, host: true }); }, () => send(m.from, 'no', {}));   // a: khu chơi của chủ → bạn vào đúng chỗ
    } else if (m.type === 'ok' && pending && pending.to === m.from && m.d) {
      const q = ctx.school && ctx.school.doors && m.d.x != null ? ctx.school.doors.reduce((b, q) => Math.hypot(q.x - m.d.x, q.z - m.d.z) < (b ? Math.hypot(b.x - m.d.x, b.z - m.d.z) : 1) ? q : b, null) : null;
      pending = { to: m.from, name: m.name, key: m.d.k, go: true }; host.start(m.d.k, q || host.doorOf(m.d.k), Array.isArray(m.d.a) && m.d.a.length === 4 ? { spot: m.d.a } : {});
    } else if (m.type === 'no') { if (pending && pending.to === m.from) { pending = null; prompt(`${esc(m.name)} ${m.d && m.d.busy ? 'đang chơi cùng bạn khác' : 'chưa muốn chơi cùng lúc này'}.`); } }
    else if (cur && cur.peer && cur.peer.id === m.from) {
      if (m.type === 'sc') { cur.peerScore = m.d && m.d.s; duoChip(); }
      else if (m.type === 'end') { cur.peerScore = m.d && m.d.s; cur.peerDone = true; duoChip(); ctx.toast && ctx.toast(`🤝 ${esc(m.name)} đã xong: <b>${cur.peerScore ?? '—'}</b>`, 3000); }
      else if (m.type === 'bye') { ctx.toast && ctx.toast(`👋 ${esc(m.name)} đã rời khu chơi`, 2600); cur.peer = null; cur.api.peer = null; duoChip(); }
      else if (m.type === 'g') for (const f of cur.peerFns) f(m.d);
    }
  }
  function setPeer(p) {
    if (!cur) return; cur.peer = p; cur.peerScore = null; cur.peerFns = [];
    cur.api.peer = { ...p, send: d => send(p.id, 'g', d), on: fn => cur.peerFns.push(fn) };
    if (cur.api.onPeer) cur.api.onPeer(cur.api.peer); duoChip(); badge('duo');
    ctx.toast && ctx.toast(`🤝 Đang chơi cùng <b>${esc(p.name)}</b> — ai nhiều điểm hơn?`, 3000);
  }
  function duoChip() { let c = $('.mg-duo'); if (!c) { c = document.createElement('span'); c.className = 'mg-duo'; $('.mg-top').insertBefore(c, $('.mg-x')); } c.hidden = !(cur && cur.peer); if (cur && cur.peer) c.textContent = `🤝 ${cur.peer.name}: ${cur.peerScore ?? 0}`; }
  let hooked = false;
  function hookNet() { const n = ctx.net; if (hooked || !n || !n.on) return; hooked = true; n.on('mgFrom', onMsg); }

  // ---------- Vòng đời 1 phiên chơi (host.js gọi) ----------
  const M = {
    start(api, G) {
      hookNet();
      const key = api.key, own = OWN_LV.has(key); let raw = 'easy'; try { raw = localStorage.getItem('mg.' + key + '.level') || 'easy'; } catch (e) {}
      let lv = Math.max(0, LV.indexOf(raw));   // chung khoá với nút Dễ/Vừa/Khó của cờ vua, caro, cờ vây
      api.level = lv + 1; api.lv = LV[lv];
      QZ.lv = api.level; QZ.grade = +load('island.grade', 0) || 0;
      // chip cấp độ (game cờ có nút Dễ/Vừa/Khó riêng → chỉ đọc chung khoá)
      let chip = $('.mg-lv'); if (!chip) { chip = document.createElement('button'); chip.className = 'mg-lv'; chip.type = 'button'; $('.mg-top').insertBefore(chip, $('.mg-x')); }
      chip.hidden = own || G.inPlace; chip.textContent = LVN[lv];
      chip.onclick = e => { e.stopPropagation(); lv = (lv + 1) % 3; try { localStorage.setItem('mg.' + key + '.level', LV[lv]); } catch (er) {} ctx.toast && ctx.toast(`Cấp độ: <b>${LVN[lv]}</b>`, 1600); host.restart(); };
      api.onQuiz = ok => { if (!ok) return; P.q++; keep(); const m = dailyStep(q => q.id === 'quiz'); if (m) ctx.toast && ctx.toast(m.replace(/^<br>/, ''), 3200); checkBadges(); };
      const keepPeer = cur && cur.key === key && cur.peer ? cur : null;   // chơi lại: giữ bạn chơi cùng
      cur = { key, api, peer: null, peerFns: [] };
      if (keepPeer) setPeer(keepPeer.peer);
      else if (pending && pending.go && pending.key === key) { setPeer({ id: pending.to, name: pending.name, host: false }); pending = null; }
      duoChip();
      // gửi điểm cho bạn chơi cùng khi đổi
      const sc = api.hud.score; let last = null; api.hud.score = v => { sc(v); if (cur && cur.peer && v !== last && v != null) { last = v; send(cur.peer.id, 'sc', { s: v }); } };
      const n = net(); if (n) n.emit('mg', { k: key, t: gname(key).replace(/^\P{L}+/u, '') });
    },
    end(api, { score, lowerBetter, nb, card }) {
      if (!cur || cur.api !== api || cur.ended) return; cur.ended = true;
      const key = api.key; P.plays++; P.games[key] = (P.games[key] || 0) + 1; keep();
      let html = '';
      if (score != null) { const rank = lbAdd(key, score, lowerBetter); if (rank) html += `<br>📱 Hạng <b>${rank}</b> trên máy này`; }
      html += pay(api.level + (nb ? 2 : 0), api.level, 'mini game ' + gname(key)).replace(/^ · /, '<br>');
      const D = daily(); html += dailyStep(q => (q.id === 'play' && q.k === key) || (q.id === 'lv2' && api.level >= 2) || (q.id === 'many' && !q.seen.includes(key) && q.seen.push(key)));
      html += checkBadges({ nb, hard: api.level === 3, duo: !!cur.peer });
      if (cur.peer) { send(cur.peer.id, 'end', { s: score }); if (cur.peerScore != null && score != null) { const w = lowerBetter ? score < cur.peerScore : score > cur.peerScore, tie = score === cur.peerScore; html += `<br>🤝 Em <b>${score}</b> – ${esc(cur.peer.name)} <b>${cur.peerScore}</b>: ${tie ? 'hoà!' : w ? 'em thắng! 🎉' : 'bạn thắng — lần sau nhé!'}`; } }
      void D;
      const p = card.querySelector('p'); if (p && html) p.insertAdjacentHTML('beforeend', html);
      const b = document.createElement('button'); b.textContent = '🏆 Xếp hạng'; b.onclick = e => { e.stopPropagation(); const saved = card.innerHTML, btns = [...card.querySelectorAll('button')].map(x => x.onclick); showBoard(key, lowerBetter, () => { card.innerHTML = saved; card.querySelectorAll('button').forEach((x, i) => x.onclick = btns[i]); }); };
      card.appendChild(b);
    },
    exit(restarting) {
      if (!cur) return;
      if (!restarting) { if (cur.peer) send(cur.peer.id, 'bye', {}); const n = net(); if (n) n.emit('mg', null); cur = null; QZ.lv = 1; }
      else cur.ended = false;
    },
    // ngoài khu chơi: lại gần bạn đang chơi → nút "✋ Chơi cùng"
    update(dt) {
      if (signs === undefined && ctx.school && ctx.school.ready && ctx.terrain) { signs = null; try { signs = createSigns(ctx, host); } catch (e) { console.warn('[mg] biển', e); } }
      if (signs) signs.update(dt);
      if (ctx.mgActive) return;
      if ((offerT -= dt) <= 0) { offerT = 0.25; near = null; const n = net(); if (n && n.others) { hookNet(); const p = ctx.player.pos;   // dò bạn đang chơi trong 8 m (nhịp 1/4 s)
        for (const [id, o] of n.others) { if (!o.mg) continue; const r = o.h.root.position; if (Math.hypot(r.x - p.x, r.z - p.z) <= 8) { near = { id, o, label: `✋ Chơi cùng ${o.name} · ${o.mg.t}` }; break; } } } }
      if (near && ctx.offer) { const { id, o } = near; ctx.offer(near.label, () => { pending = { to: id, name: o.name }; send(id, 'join', {}); prompt(`Đã gửi lời mời tới <b>${esc(o.name)}</b>…`); }, 7); }   // offer phải gọi mỗi khung
    },
    menuHtml: () => dailyHtml() + `<details style="margin:8px 0 13px"><summary style="cursor:pointer;font-weight:800">🏅 Huy hiệu mini game (${Object.keys(P.badges).length}/${BADGES.length})</summary>${badgesHtml()}</details>`,
    get state() { return P; }, daily, badge,
  };
  ctx.mgMeta = M;
  return M;
}
