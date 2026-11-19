// social.js — Chơi cùng bạn AN TOÀN: 😊 biểu cảm + câu nói có sẵn (không gõ chữ), 👥 bạn bè bằng mã 6 ký tự (cả hai đồng ý),
// nhóm đi cùng, lời mời (nhóm / đến chỗ bạn / mini game / lên tàu / đua chổi), chặn & báo cáo, công cụ chủ game,
// bảng điểm 4 nhà + sự kiện cuối tuần + xếp hạng, vào lớp bằng mã & nhiệm vụ học, giới hạn giờ chơi của phụ huynh.
// Kích thước theo φ: bo 13/21, đệm 8/13/21, chữ 13/16/21; 8 biểu cảm, 13 câu mẫu (Fibonacci). Server: server/online.js
import { getToken } from './data/account.js';

const HOUSE = { long: ['🐉', 'Long', '#c8302c'], phung: ['🦚', 'Phụng', '#3a6fc4'], lan: ['🦄', 'Lân', '#3f8a4c'], quy: ['🐢', 'Quy', '#7a4fb0'] };
const INV = [['party', '👥 Vào nhóm'], ['come', '📍 Đến chỗ mình'], ['mg', '🎮 Mini game'], ['ship', '🚂 Lên tàu'], ['broom', '🧹 Đua chổi']];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createSocial(ctx) {
  const net = ctx.net, acc = ctx.account;
  const css = document.createElement('style');
  css.textContent = `.soChip{padding:5px 13px;border-radius:13px;border:2px solid #fff5;background:#1b1626aa;color:#fff;font:700 13px/1.3 system-ui;cursor:pointer}
.soChip b{color:#ffd36e}#soSay{position:fixed;z-index:39;left:50%;transform:translateX(-50%);bottom:calc(max(13px,env(safe-area-inset-bottom)) + 89px);width:min(calc(100vw - 26px),377px);box-sizing:border-box;background:#fff8ecf2;border-radius:21px;padding:13px;box-shadow:0 8px 21px #0007}
#soSay .em{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin-bottom:8px}#soSay .em button{font-size:24px;padding:5px 0;border:0;border-radius:13px;background:#efe3cc;cursor:pointer}
#soSay .ph{display:flex;flex-wrap:wrap;gap:5px}#soSay .ph button{flex:1 1 40%;padding:8px;border:0;border-radius:13px;background:#efe3cc;color:#3a2a1a;font:700 13px system-ui;cursor:pointer}
#soBox{position:fixed;inset:0;z-index:40;display:grid;place-items:center;background:#0a1222b3;padding:13px}
#soBox .card{width:min(100%,420px);max-height:calc(100vh - 34px);overflow:auto;box-sizing:border-box;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:21px;border-top:8px solid #3fb8a8;box-shadow:0 13px 34px #0008;font:16px/1.5 system-ui}
#soBox h3{margin:0 0 8px;font-size:21px}#soBox h4{margin:13px 0 5px;font-size:16px}#soBox p,#soBox small{font-size:13px;opacity:.8;margin:0 0 8px}
#soBox .tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:13px}#soBox .tabs button{flex:1;padding:8px 5px;border-radius:13px;border:0;background:#efe3cc;font:800 13px system-ui;color:#3a2a1a;cursor:pointer}#soBox .tabs button.on{background:#3fb8a8;color:#fff}
#soBox .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #0001}#soBox .row .nm{flex:1 1 34%;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis}
#soBox button.b{padding:8px 13px;border-radius:13px;border:0;background:#efe3cc;color:#3a2a1a;font:800 13px system-ui;cursor:pointer}#soBox button.pri{background:#f0a23a}#soBox button.red{background:#f3c7bd}
#soBox input,#soBox select{padding:8px 13px;border-radius:13px;border:2px solid #d9c6a3;font:600 16px system-ui;background:#fff;color:#3a2a1a;min-width:0;flex:1}
#soBox .code{font:900 34px/1.2 ui-monospace,monospace;letter-spacing:5px;text-align:center;background:#fff;border-radius:13px;padding:8px;margin:5px 0 8px}
#soBox .bar{height:21px;border-radius:8px;background:#efe3cc;overflow:hidden;margin:3px 0 8px}#soBox .bar i{display:block;height:100%}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#bbb;margin-right:5px}.dot.on{background:#3d8f4a}
#soInv{position:fixed;z-index:41;left:50%;top:calc(max(13px,env(safe-area-inset-top)) + 89px);transform:translateX(-50%);width:min(calc(100vw - 26px),340px);box-sizing:border-box;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:13px 21px;border-top:5px solid #f0a23a;box-shadow:0 8px 21px #0008;font:700 16px/1.45 system-ui}
#soInv .r{display:flex;gap:8px;margin-top:8px}#soInv button{flex:1;padding:8px;border:0;border-radius:13px;font:800 15px system-ui;background:#efe3cc;cursor:pointer}#soInv button.pri{background:#f0a23a}
#soLock{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:#0a1222f2;color:#fff;text-align:center;padding:21px;font:700 21px/1.5 system-ui}#soLock small{display:block;font-size:13px;opacity:.75;margin-top:13px}
body.rs-modal .soChip,body.mg-on .soChip{display:none}`;
  document.head.appendChild(css);
  const row = document.getElementById('chipRow');
  const mk = (html, order, title) => { const c = document.createElement('div'); c.className = 'soChip'; c.innerHTML = html; c.style.order = order; c.title = title; c.setAttribute('role', 'button'); c.tabIndex = 0; (row || document.body).appendChild(c); return c; };
  const chipF = mk('👥', 2, 'Bạn bè · Nhóm · Sự kiện · Lớp'), chipS = mk('😊', 3, 'Biểu cảm & câu nói có sẵn');
  const box = document.createElement('div'); box.id = 'soBox'; box.hidden = true; document.body.appendChild(box);
  const say = document.createElement('div'); say.id = 'soSay'; say.hidden = true; document.body.appendChild(say);
  const inv = document.createElement('div'); inv.id = 'soInv'; inv.hidden = true; document.body.appendChild(inv);
  for (const el of [box, say, inv]) { el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { el.hidden = true; unfreeze(); } }); el.addEventListener('keyup', e => e.stopPropagation()); }
  const toast = t => ctx.toast && ctx.toast(t);
  const unfreeze = () => { if (box.hidden) ctx.player.frozen = false; };
  let tab = 'f', friends = { list: [], reqs: [] }, party = null, reports = [], info = null;
  const lists = () => (net.info || { phrases: [], emotes: [], reasons: [] });

  // ---------- 😊 biểu cảm + câu nói mẫu ----------
  const renderSay = () => { const L = lists(); say.innerHTML = `<div class="em">${L.emotes.map((e, i) => `<button data-t="e" data-i="${i}">${e}</button>`).join('')}</div><div class="ph">${L.phrases.map((p, i) => `<button data-t="p" data-i="${i}">${esc(p)}</button>`).join('')}</div>`; };
  chipS.onclick = () => { if (!net.connected) return toast('⚪ Chưa nối mạng — biểu cảm chỉ dùng khi chơi online.'); renderSay(); say.hidden = !say.hidden; };
  say.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; net.emit('say', { t: b.dataset.t, i: +b.dataset.i }); say.hidden = true; });
  net.on('say', d => { const L = lists(), t = d.t === 'e' ? L.emotes[d.i] : L.phrases[d.i]; if (t) net.bubble(d.id, t, d.t === 'e'); });

  // ---------- kết nối, phần thưởng, giới hạn giờ, chủ game ----------
  let tok = getToken(); acc.onChange(() => { const t = getToken(); if (t !== tok) { tok = t; net.reconnect(); } });
  net.onHello(d => { info = d; if (d.limit) checkLimit(d.limit); });
  net.on('toast', toast);
  net.on('friends', f => { friends = f; const n = (f.reqs || []).length; chipF.innerHTML = n ? `👥 <b>${n}</b>` : '👥'; if (!box.hidden && tab === 'f') render(); });
  net.on('party', p => { party = p; if (!box.hidden) render(); });
  net.on('reports', r => { reports = r; if (!box.hidden && tab === 'a') render(); });
  net.on('reward', r => { if (r.coins) acc.addCoins && acc.addCoins(r.coins); if (r.house) acc.addHousePts && acc.addHousePts(r.house); toast(`🎁 ${esc(r.why)}: +${r.coins} đồng vàng${r.house && acc.house ? ` · +${r.house} điểm nhà` : ''}`); ctx.sfx && ctx.sfx('ok'); });
  net.on('goGate', () => { toast('🏝️ Chủ game đưa em về cổng trường.'); document.getElementById('bSchool')?.click(); });
  const day = () => new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
  function lock(html) { let el = document.getElementById('soLock'); if (!el) { el = document.createElement('div'); el.id = 'soLock'; document.body.appendChild(el); } el.innerHTML = html; ctx.player.frozen = true; }
  function checkLimit(l) {
    if (l.limitMin > 0 && l.usedMin >= l.limitMin) return timeup(l);
    try { localStorage.removeItem('island.lockDay'); } catch (e) {} document.getElementById('soLock')?.remove();
    if (l.limitMin > 0) toast(`⏰ Hôm nay em còn ${l.limitMin - l.usedMin} phút chơi (bố mẹ đặt).`);
  }
  function timeup(l) { try { localStorage.setItem('island.lockDay', day()); } catch (e) {} lock(`⏰ Hết giờ chơi hôm nay rồi!<br>Em đã chơi ${l.limitMin} phút theo giờ bố mẹ đặt.<br>Mai mình gặp lại nhé 🌙<small>Phụ huynh có thể đổi giới hạn ở trang /teacher → Phụ huynh.</small>`); }
  net.on('limit', checkLimit);
  net.on('timeup', timeup);
  net.on('banned', () => { acc.expired && acc.expired(); lock('🔒 Tài khoản đang bị khoá.<br><small>Hãy hỏi thầy cô hoặc chủ game.</small>'); });
  try { if (localStorage.getItem('island.lockDay') === day()) lock('⏰ Hết giờ chơi hôm nay rồi! Mai mình gặp lại nhé 🌙<small>Đang kiểm tra với máy chủ…</small>'); } catch (e) {}
  // học tập → server (thống kê theo môn cho giáo viên, phụ huynh, nhiệm vụ học)
  addEventListener('rw-learn', e => net.emit('learn', e.detail));

  // ---------- lời mời ----------
  net.on('invite', d => {
    inv.innerHTML = `📨 <b>${esc(d.from)}</b> mời em ${esc(d.label)}!<div class="r"><button class="pri" data-y>Đồng ý</button><button data-n>Để sau</button></div>`; inv.hidden = false;
    clearTimeout(inv._t); inv._t = setTimeout(() => (inv.hidden = true), 21000);
    inv.querySelector('[data-y]').onclick = () => { inv.hidden = true; if (d.kind === 'party') net.emit('party', { op: 'join', pid: d.pid }); goNear(d.sid, d); };
    inv.querySelector('[data-n]').onclick = () => { inv.hidden = true; };
    ctx.sfx && ctx.sfx('ok');
  });
  function goNear(sid, fb) {   // đi cùng: dịch chuyển tới cạnh bạn (vị trí mới nhất nhận qua mạng)
    const o = net.others.get(sid), p = o ? o.h.root.position : fb; if (!p) return toast('Bạn ấy đang ở xa, chưa thấy vị trí.');
    if (ctx.player.vehicle) return toast('🚲 Xuống xe trước rồi mới đến chỗ bạn nhé.');
    if (ctx.warpReady && !ctx.warpReady()) return; ctx.player.teleport(p.x + 1.3, p.z + 1.3, p.y); ctx.player.snapCamera && ctx.player.snapCamera(); toast(`📍 Đã đến cạnh ${esc(o ? o.name : 'bạn')}!`);
  }

  // ---------- bảng 👥 ----------
  const open = () => { box.hidden = false; say.hidden = true; ctx.player.frozen = true; render(); if (tab === 'e') loadEvents(); if (tab === 'c') loadTasks(); };
  chipF.onclick = open; chipF.onkeydown = chipS.onkeydown = e => { if (e.key === 'Enter') e.target.click(); };
  const close = () => { box.hidden = true; ctx.player.frozen = false; };
  let evData = null, taskData = null;
  async function loadEvents() { const r = await acc.api('/events'); evData = r.status === 200 ? r : null; if (!box.hidden && tab === 'e') render(); }
  async function loadTasks() { if (!acc.cloud) return; const r = await acc.api('/tasks'); taskData = r.tasks || []; if (!box.hidden && tab === 'c') render(); }
  const needAcc = () => `<p>👤 Hãy <b>đăng nhập tài khoản</b> (chip 👤) để dùng phần này. Chơi khách vẫn được dạo đảo và dùng biểu cảm.</p>`;
  const offline = () => !net.connected ? '<p>⚪ Chưa nối được máy chủ — các tính năng online sẽ bật khi có mạng.</p>' : '';
  function render() {
    const me = net.info && net.info.me, admin = me && me.admin;
    const T = [['f', '👥 Bạn bè'], ['g', '🧭 Nhóm'], ['e', '🏆 Sự kiện'], ['c', '🏫 Lớp'], ['a', '🛡️']];
    let h = `<div class="card"><div class="tabs">${T.map(([k, t]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}</div>${offline()}`;
    if (tab === 'f') {
      if (!acc.cloud) h += needAcc();
      else {
        h += `<p>Mã bạn bè của em — đọc cho bạn cùng lớp để kết bạn:</p><div class="code">${esc(friends.code || (acc.user && acc.user.code) || '······')}</div>
          <div class="row"><input id="soCode" maxlength="6" placeholder="Nhập mã của bạn" autocomplete="off" style="text-transform:uppercase;letter-spacing:3px"><button class="b pri" data-a="add">Kết bạn</button></div>`;
        if ((friends.reqs || []).length) h += `<h4>📨 Lời mời kết bạn</h4>` + friends.reqs.map(f => `<div class="row"><span class="nm">${esc(f.name)}</span><button class="b pri" data-a="acc" data-u="${f.uid}">Đồng ý</button><button class="b" data-a="dec" data-u="${f.uid}">Từ chối</button></div>`).join('');
        h += `<h4>🤝 Bạn bè (${(friends.list || []).length})</h4>` + ((friends.list || []).map(f => `<div class="row"><span class="nm"><span class="dot ${f.online ? 'on' : ''}"></span>${esc(f.name)}</span>${f.online ? `<button class="b" data-a="go" data-s="${f.sid}">📍 Đến</button><select data-u="${f.uid}" data-a="inv"><option value="">📨 Mời…</option>${INV.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>` : '<small>vắng</small>'}<button class="b red" data-a="rm" data-u="${f.uid}" title="Huỷ kết bạn">✖</button></div>`).join('') || '<p>Chưa có bạn nào. Hãy trao mã cho nhau nhé!</p>');
      }
      const near = [...net.others.entries()];
      h += `<h4>🏝️ Trên đảo (${near.length})</h4><p>Nếu ai làm em không vui: bấm 🚫 Chặn (hai bạn không thấy nhau nữa) hoặc 🛡️ Báo cáo cho chủ game.</p>` + (near.map(([sid, o]) => `<div class="row"><span class="nm">${esc(o.name)}</span><button class="b" data-a="go" data-s="${sid}">📍</button><button class="b" data-a="blk" data-s="${sid}">🚫 Chặn</button><select data-a="rep" data-s="${sid}"><option value="">🛡️ Báo cáo…</option>${lists().reasons.map((r, i) => `<option value="${i}">${esc(r)}</option>`).join('')}</select></div>`).join('') || '<p>Chưa có ai khác trên đảo.</p>');
    } else if (tab === 'g') {
      if (!acc.cloud) h += needAcc();
      else if (!party) h += `<p>🧭 Chưa có nhóm. Ở mục 👥 Bạn bè, chọn <b>📨 Mời… → 👥 Vào nhóm</b> để lập nhóm (tối đa 8 bạn). Cả nhóm có thể cùng đến chỗ nhau, rủ chơi mini game, lên tàu, đua chổi.</p>`;
      else {
        const lead = party.members.find(m => m.uid === party.leader);
        h += `<h4>🧭 Nhóm của em (${party.members.length}/8)</h4>` + party.members.map(m => `<div class="row"><span class="nm">${m.uid === party.leader ? '⭐ ' : ''}${esc(m.name)}</span>${m.sid !== (me && me.id) ? `<button class="b" data-a="go" data-s="${m.sid}">📍 Đến</button>` : '<small>em</small>'}</div>`).join('');
        h += `<h4>📨 Rủ cả nhóm</h4><div class="row">${INV.filter(([k]) => k !== 'party').map(([k, t]) => `<button class="b" data-a="pinv" data-k="${k}">${t}</button>`).join('')}</div>
          <div class="row">${lead && lead.sid !== (me && me.id) ? `<button class="b pri" data-a="go" data-s="${lead.sid}">⭐ Đi theo trưởng nhóm</button>` : ''}<button class="b red" data-a="leave">Rời nhóm</button></div>`;
      }
    } else if (tab === 'e') {
      if (!evData) h += '<p>⏳ Đang tải bảng điểm…</p>';
      else {
        const H = evData.houses, max = Math.max(1, ...Object.values(H)), ev = evData.event;
        h += `<h4>🏰 Điểm 4 nhà Tứ Linh tuần này</h4><small>Cộng từ điểm nhà của mọi học sinh trong trường (đổi mới mỗi thứ Hai).</small>` + Object.entries(H).sort((a, b) => b[1] - a[1]).map(([k, n], i) => `<div>${i === 0 && n ? '👑 ' : ''}${HOUSE[k][0]} <b>Nhà ${HOUSE[k][1]}</b> — ${n}</div><div class="bar"><i style="width:${Math.round(100 * n / max)}%;background:${HOUSE[k][2]}"></i></div>`).join('');
        h += `<h4>🎪 Sự kiện</h4>` + (ev.kind === 'treasure' ? `<p>🧰 <b>Săn kho báu</b> đang diễn ra! Tìm 13 rương phát sáng trên đảo (còn ${ev.n - ev.claimed.length}). Vòng mới lúc ${new Date(ev.ends).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}.</p>`
          : ev.kind === 'race' ? `<p>🧹 <b>Giải bay chổi</b> hôm nay! Đến <b>vòng xuất phát</b> phát sáng gần cổng trường, bay qua 8 vòng theo thứ tự.</p>` : `<p>📅 Thứ Bảy: 🧰 săn kho báu · Chủ nhật: 🧹 giải bay chổi. Hẹn em cuối tuần!</p>`);
        const tbl = (t, L, f) => L.length ? `<h4>${t}</h4>` + L.map((x, i) => `<div class="row"><span class="nm">${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} ${x.house ? HOUSE[x.house][0] + ' ' : ''}${esc(x.name)}</span><b>${f(x)}</b></div>`).join('') : '';
        h += tbl('🧹 Bay chổi nhanh nhất hôm nay', evData.race, x => (x.ms / 1000).toFixed(1) + ' s') + tbl('🧰 Thợ săn kho báu tuần', evData.hunters, x => x.pts + ' điểm') + tbl('⭐ Bảng xếp hạng cấp độ', evData.top, x => 'Lv ' + x.level);
      }
    } else if (tab === 'c') {
      if (!acc.cloud) h += needAcc();
      else {
        const cl = (acc.user && acc.user.classes) || [];
        h += `<h4>🏫 Lớp của em</h4>${cl.map(c => `<div class="row"><span class="nm">📘 ${esc(c.name)}</span></div>`).join('') || '<p>Chưa vào lớp nào.</p>'}
          <div class="row"><input id="soCls" maxlength="6" placeholder="Mã lớp thầy cô đưa" style="text-transform:uppercase;letter-spacing:3px"><button class="b pri" data-a="join">Vào lớp</button></div>
          <h4>📚 Nhiệm vụ học</h4>` + (taskData == null ? '<p>⏳ Đang tải…</p>' : taskData.map(t => `<div>${t.done >= t.n ? '✅' : '📖'} <b>${esc(t.title)}</b> <small>· ${esc(t.cls)} · ${t.subject === '*' ? 'mọi môn' : esc(t.subject)} · ${t.kind === 'ok' ? 'trả lời đúng' : 'làm'} ${t.n} câu</small></div><div class="bar"><i style="width:${Math.round(100 * t.done / t.n)}%;background:#3fb8a8"></i></div>`).join('') || '<p>Chưa có nhiệm vụ. Trả lời câu đố trong game (đền, thầy cô, mini game…) là được tính vào tiến độ học!</p>');
      }
    } else if (tab === 'a') {
      if (!admin) h += `<h4>🛡️ Chủ game</h4><p>Chỉ dành cho chủ game (mã ADMIN_KEY trên máy chủ).</p><div class="row"><input id="soKey" type="password" placeholder="Mã chủ game" autocomplete="off"><button class="b pri" data-a="key">Vào</button></div>`;
      else {
        const all = [...net.others.entries()];
        h += `<h4>🛡️ Công cụ chủ game</h4><div class="row"><button class="b" data-a="hide" data-on="1">👻 Tàng hình</button><button class="b" data-a="hide" data-on="0">👀 Hiện hình</button></div>
          <div class="row"><button class="b" data-a="evk" data-k="treasure">🧰 Mở săn kho báu</button><button class="b" data-a="evk" data-k="race">🧹 Mở bay chổi</button><button class="b" data-a="evk" data-k="">⏹ Theo lịch</button></div>
          <h4>Người chơi (${all.length})</h4>` + all.map(([sid, o]) => `<div class="row"><span class="nm">${esc(o.name)}</span><button class="b" data-a="go" data-s="${sid}">📍</button><button class="b" data-a="gate" data-s="${sid}">🏝️ Về cổng</button><button class="b red" data-a="ban" data-s="${sid}">🔒 Khoá</button></div>`).join('')
          + `<div class="row"><input id="soUnban" placeholder="Tên cần mở khoá"><button class="b" data-a="unban">🔓 Mở khoá</button></div><h4>📋 Báo cáo <button class="b" data-a="reps">↻</button></h4>`
          + (reports.map(r => `<div class="row"><span class="nm">${esc(r.target)} <small>— ${esc(r.reason)} · bởi ${esc(r.from)} · ${new Date(r.at).toLocaleString('vi')}</small></span><button class="b" data-a="clr" data-id="${r.id}">✔ Xong</button></div>`).join('') || '<p>Không có báo cáo.</p>');
      }
    }
    box.innerHTML = h + `<div class="row" style="border:0;justify-content:flex-end"><button class="b pri" data-a="close">Đóng</button></div></div>`;
  }
  box.addEventListener('click', async e => {
    if (e.target === box) return close();
    const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a, v = id => (box.querySelector(id) || {}).value || '';
    if (b.dataset.tab) { tab = b.dataset.tab; render(); if (tab === 'e') loadEvents(); if (tab === 'c') loadTasks(); if (tab === 'a' && net.info?.me?.admin) net.emit('admin', { op: 'reports' }); return; }
    if (a === 'close') return close();
    if (a === 'add') return net.emit('friend', { op: 'add', code: v('#soCode') });
    if (a === 'acc' || a === 'dec' || a === 'rm') { if (a === 'rm' && !confirm('Huỷ kết bạn với bạn này?')) return; return net.emit('friend', { op: { acc: 'accept', dec: 'decline', rm: 'remove' }[a], uid: b.dataset.u }); }
    if (a === 'go') { close(); return goNear(b.dataset.s); }
    if (a === 'blk') { if (!confirm('Chặn bạn này? Hai bạn sẽ không thấy nhau và không nhận lời mời của nhau.')) return; net.emit('block', { sid: b.dataset.s }); setTimeout(render, 300); return; }
    if (a === 'pinv') return net.emit('invite', { to: 'party', kind: b.dataset.k });
    if (a === 'leave') return net.emit('party', { op: 'leave' });
    if (a === 'join') { const r = await acc.api('/class/join', { code: v('#soCls') }); if (r.error) return toast('🏫 ' + r.error); acc.user = r.user; toast('🏫 Đã vào lớp!'); taskData = null; render(); return loadTasks(); }
    if (a === 'key') { net.adminKey = v('#soKey').trim(); net.reconnect(); setTimeout(() => { render(); if (net.info?.me?.admin) net.emit('admin', { op: 'reports' }); }, 1200); return; }
    if (a === 'hide') return net.emit('admin', { op: 'hide', on: b.dataset.on === '1' });
    if (a === 'evk') return net.emit('admin', { op: 'event', kind: b.dataset.k });
    if (a === 'gate') return net.emit('admin', { op: 'gate', sid: b.dataset.s });
    if (a === 'ban') { if (confirm('Khoá tài khoản này?')) net.emit('admin', { op: 'ban', sid: b.dataset.s }); return; }
    if (a === 'unban') return net.emit('admin', { op: 'unban', name: v('#soUnban') });
    if (a === 'reps') return net.emit('admin', { op: 'reports' });
    if (a === 'clr') { net.emit('admin', { op: 'clearReport', id: b.dataset.id }); reports = reports.filter(r => r.id !== b.dataset.id); return render(); }
  });
  box.addEventListener('change', e => {
    const s = e.target; if (s.tagName !== 'SELECT' || !s.value) return;
    if (s.dataset.a === 'inv') net.emit('invite', { to: s.dataset.u, kind: s.value });
    if (s.dataset.a === 'rep' && confirm('Gửi báo cáo cho chủ game?')) net.emit('report', { sid: s.dataset.s, reason: +s.value });
    s.value = '';
  });
  return { open };
}
