// ================= v52w · 5/5 LAPTOP & TÚI ĐỒ: đồ mua ở TTTM lưu trong hồ sơ; laptop / máy tính bảng / điện thoại mở ra được =================
// Màn hình máy là một menu nhỏ: mini game Gõ phím nhanh, Toán nhanh, Thành tích, Kho trò chơi, Trường Tin học (nếu nhánh v51t có hàm mở bài học).
const V52WD = {root:null, open:false, kind:'laptop', trial:false, game:null, tm:0};
const V52WD_WORDS = ['cat', 'sun', 'tree', 'book', 'cube', 'star', 'moon', 'fish', 'bird', 'rain', 'snow', 'wind', 'river', 'ocean', 'cloud', 'apple', 'happy', 'school', 'friend', 'garden', 'planet', 'rocket', 'island', 'bridge', 'forest', 'mountain', 'music', 'piano', 'water', 'light'];
function v52wBagN(){ const b = (PROF && PROF.v52bag) || {}; return Object.keys(b).reduce((s, k) => s + (b[k] || 0), 0); }
function v52wHasDev(){ const b = (PROF && PROF.v52bag) || {}; return ['laptop', 'tablet', 'phone'].find(k => b[k] > 0) || null; }
function v52wBagHtml(){
  const b = (PROF && PROF.v52bag) || {}, ids = Object.keys(b).filter(k => b[k] > 0);
  if(!ids.length) return '<p class="v52money">🎒 Túi còn trống. Vào 🛍️ TTTM Cầu Vồng để mua laptop, sách, đồ chơi…</p>';
  let h = '<div class="v52grid">'; ids.forEach(id => { const it = V52WM_ITEMS.find(i => i.id === id); if(!it) return; h += `<div class="v52item"><canvas data-ic="${id}" width="56" height="56"></canvas><b>${v52wsEsc(it.n)}</b><span class="v52pr">× ${b[id]}</span>${it.dev ? `<button type="button" data-open="${id}">▶ Mở máy</button>` : ''}</div>`; });
  return h + '</div>';
}
function v52wBagWire(p){ if(!p) return; p.querySelectorAll('canvas[data-ic]').forEach(c => { const it = V52WM_ITEMS.find(i => i.id === c.dataset.ic); if(it) c.getContext('2d').drawImage(v52wmItemIcon(it, 56), 0, 0); });
  p.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { v52wsPanel(null); v52wDevice(b.dataset.open); }); }
function v52wBagPanel(){ const p = v52wsPanel('<h2>🎒 Túi đồ của bạn</h2>' + v52wBagHtml(), 'v52shop'); v52wBagWire(p); }
// ---------- device overlay ----------
function v52wDevBuild(){
  if(V52WD.root) return V52WD.root; const r = v52wsEl('div'); r.id = 'v52wdev'; r.hidden = true; r.setAttribute('role', 'dialog');
  r.innerHTML = '<div class="v52wdframe"><div class="v52wdscreen"><div class="v52wdbar"><b id="v52dT">💻 Rubik Book</b><span id="v52dClock"></span><button type="button" id="v52dX" aria-label="Tắt máy">✕</button></div><div class="v52wdbody" id="v52dBody"></div></div><div class="v52wdbase"></div></div>';
  (document.getElementById('stage') || document.body).appendChild(r); V52WD.root = r;
  r.querySelector('#v52dX').onclick = () => { if(V52WD.app){ v52wDevHome(); return; } v52wDevClose(); };
  r.addEventListener('keydown', e => { e.stopPropagation(); if(e.key === 'Escape'){ if(V52WD.app) v52wDevHome(); else v52wDevClose(); } });
  return r;
}
function v52wDevice(kind, trial){
  if(!trial && !PROF){ try { openLogin(); } catch(e){} return; } v52wDevBuild(); V52WD.kind = kind || v52wHasDev() || 'laptop'; V52WD.trial = !!trial; V52WD.open = true; V52WD.root.hidden = false;
  V52WD.root.dataset.k = V52WD.kind; document.body.classList.add('v52wdevon');
  document.getElementById('v52dT').textContent = {laptop:'💻 Rubik Book 14"', tablet:'📱 Lá Phong Tab', phone:'📱 Sóng Biển'}[V52WD.kind] + (V52WD.trial ? ' · máy trưng bày' : ''); v52wDevHome();
  clearInterval(V52WD.tm); V52WD.tm = setInterval(() => { const c = document.getElementById('v52dClock'); if(c) try { c.textContent = fmt(clock); } catch(e){} }, 1000);
}
function v52wDevClose(){ V52WD.open = false; V52WD.app = null; if(V52WD.game) V52WD.game.stop(); V52WD.game = null; clearInterval(V52WD.tm); if(V52WD.root) V52WD.root.hidden = true; document.body.classList.remove('v52wdevon'); }
function v52wTinHoc(){   // Trường Tin học (nhánh v51t) — gọi qua typeof, không lỗi khi chưa gộp
  if(typeof v51tOpenLesson === 'function') return () => v51tOpenLesson();
  if(typeof v51tOpen === 'function') return () => v51tOpen();
  if(typeof v51tOpenSchool === 'function') return () => v51tOpenSchool();
  if(typeof v51tLesson === 'function') return () => v51tLesson();
  return null;
}
function v52wDevHome(){
  V52WD.app = null; if(V52WD.game){ V52WD.game.stop(); V52WD.game = null; } const tin = v52wTinHoc(), body = document.getElementById('v52dBody'); if(!body) return;
  const apps = [['type', '⌨️', 'Gõ phím nhanh'], ['math', '🧮', 'Toán nhanh'], ['ach', '🏆', 'Thành tích'], ['bag', '🎒', 'Túi đồ'], ['games', '🎮', 'Kho trò chơi'], ['tin', '🖥️', tin ? 'Trường Tin học' : 'Trường Tin học (sắp mở)']];
  body.innerHTML = '<div class="v52wdhello">Xin chào, <b>' + v52wsEsc(PROF ? PROF.name : 'bạn') + '</b>! ' + (V52WD.trial ? 'Đây là máy trưng bày: chơi thử miễn phí, không nhận thưởng.' : 'Chọn một ứng dụng:') + '</div><div class="v52wdapps">' +
    apps.map(a => `<button type="button" data-app="${a[0]}"${a[0] === 'tin' && !tin ? ' class="dim"' : ''}><span>${a[1]}</span>${a[2]}</button>`).join('') + '</div>';
  body.querySelectorAll('[data-app]').forEach(b => b.onclick = () => v52wDevApp(b.dataset.app));
}
function v52wDevApp(id){
  const body = document.getElementById('v52dBody'); if(!body) return; V52WD.app = id;
  if(id === 'games'){ v52wDevClose(); if(typeof v52wsClose === 'function' && V52WS.open) v52wsClose(); const m = document.getElementById('hMenu'); if(m) m.click(); return; }
  if(id === 'tin'){ const f = v52wTinHoc(); if(f){ v52wDevClose(); if(V52WS.open) v52wsClose(); try { f(); } catch(e){ console.warn('v52w tin', e); } return; } body.innerHTML = '<div class="v52wdapp"><h3>🖥️ Trường Tin học</h3><p>Trường Tin học đang được xây ở trên đảo. Khi khai trương, ứng dụng này sẽ mở thẳng bài học lập trình!</p><button type="button" class="v52wdback">← Màn hình chính</button></div>'; body.querySelector('.v52wdback').onclick = v52wDevHome; return; }
  if(id === 'bag'){ body.innerHTML = '<div class="v52wdapp"><h3>🎒 Túi đồ</h3>' + v52wBagHtml() + '<button type="button" class="v52wdback">← Màn hình chính</button></div>'; v52wBagWire(body); body.querySelector('.v52wdback').onclick = v52wDevHome; return; }
  if(id === 'ach'){ const P = PROF || {level:1, exp:0, money:0, stats:{games:0}}, best = (PROF && PROF.v52best) || {};
    body.innerHTML = `<div class="v52wdapp"><h3>🏆 Thành tích</h3><div class="v52wdstats"><div><b>${P.level}</b>Level</div><div><b>${P.exp}</b>EXP</div><div><b>$${P.money}</b>Tiền</div><div><b>${(P.stats && P.stats.games) || 0}</b>Lượt chơi</div><div><b>${v52wBagN()}</b>Món đồ</div><div><b>${best.type || 0}</b>Gõ phím (từ)</div><div><b>${best.math || 0}</b>Toán nhanh (câu)</div></div><button type="button" class="v52wdback">← Màn hình chính</button></div>`;
    body.querySelector('.v52wdback').onclick = v52wDevHome; return; }
  if(id === 'type' || id === 'math') v52wMini(id);
}
// payout: $1–$20, half from the 11th run of a game in a day
function v52wPay(id, score, perRun){
  if(V52WD.trial || !PROF) return 'Máy trưng bày: chơi thử không nhận thưởng.';
  const today = new Date().toDateString(); PROF.v52wday = PROF.v52wday && PROF.v52wday.d === today ? PROF.v52wday : {d:today, n:{}}; const n = (PROF.v52wday.n[id] = (PROF.v52wday.n[id] || 0) + 1);
  let m = Math.max(1, Math.min(20, Math.round(score*perRun))); if(n > 10) m = Math.max(1, Math.floor(m/2));
  PROF.v52best = PROF.v52best || {}; const rec = score > (PROF.v52best[id] || 0); if(rec) PROF.v52best[id] = score;
  reward(Math.min(40, score*2), m, id === 'type' ? 'Gõ phím nhanh trên laptop' : 'Toán nhanh trên laptop'); return `+$${m}` + (n > 10 ? ' (từ lượt 11 trong ngày thưởng một nửa)' : '') + (rec ? ' · 🎉 Kỷ lục mới!' : '');
}
function v52wMini(id){
  const body = document.getElementById('v52dBody'), D = 45; let score = 0, left = D, q = null, run = true;
  body.innerHTML = `<div class="v52wdapp v52wdgame"><div class="v52wdhud"><b id="v52gS">0</b> điểm · ⏱ <b id="v52gT">${D}</b>s</div><div class="v52wdq" id="v52gQ"></div><div id="v52gA"></div><button type="button" class="v52wdback">← Thoát</button></div>`;
  const Q = body.querySelector('#v52gQ'), Ans = body.querySelector('#v52gA'), S = body.querySelector('#v52gS'), T = body.querySelector('#v52gT');
  body.querySelector('.v52wdback').onclick = () => { run = false; v52wDevHome(); };
  const next = () => { if(id === 'type'){ q = V52WD_WORDS[Math.floor(Math.random()*V52WD_WORDS.length)]; Q.textContent = q; const inp = Ans.querySelector('input'); if(inp){ inp.value = ''; inp.focus(); } }
    else { const op = ['+', '−', '×'][Math.floor(Math.random()*3)]; let a = 2 + Math.floor(Math.random()*(op === '×' ? 9 : 40)), b = 2 + Math.floor(Math.random()*(op === '×' ? 9 : 30)); if(op === '−' && b > a){ const t = a; a = b; b = t; }
      const r = op === '+' ? a + b : op === '−' ? a - b : a*b, ch = [r]; while(ch.length < 4){ const w = r + Math.round((Math.random() - .5)*12) || r + ch.length; if(!ch.includes(w) && w >= 0) ch.push(w); } ch.sort(() => Math.random() - .5); q = r;
      Q.textContent = `${a} ${op} ${b} = ?`; Ans.innerHTML = ch.map(c => `<button type="button" class="v52wdch" data-v="${c}">${c}</button>`).join('');
      Ans.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { if(!run) return; if(+b.dataset.v === q){ score++; S.textContent = score; try { blipSfx(1400); } catch(e){} } else { b.classList.add('bad'); try { blipSfx(300); } catch(e){} } setTimeout(next, 120); }); } };
  if(id === 'type'){ Ans.innerHTML = '<input id="v52gIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ từ ở trên rồi Enter">'; const inp = Ans.querySelector('input');
    inp.addEventListener('keydown', e => { e.stopPropagation(); if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if(inp.value.trim().toLowerCase() === q){ score++; S.textContent = score; try { blipSfx(1400); } catch(e){} next(); } else { inp.classList.add('bad'); setTimeout(() => inp.classList.remove('bad'), 300); } } });
    inp.addEventListener('input', () => { if(inp.value.trim().toLowerCase() === q){ score++; S.textContent = score; try { blipSfx(1400); } catch(e){} next(); } }); }
  next(); const tick = setInterval(() => { if(!run || !V52WD.open){ clearInterval(tick); return; } left--; T.textContent = left; if(left <= 0){ clearInterval(tick); run = false; const msg = v52wPay(id, score, id === 'type' ? .8 : .7);
      body.innerHTML = `<div class="v52wdapp"><h3>${id === 'type' ? '⌨️ Gõ phím nhanh' : '🧮 Toán nhanh'}</h3><p class="v52wdbig">${score} ${id === 'type' ? 'từ' : 'câu đúng'}</p><p>${v52wsEsc(msg)}</p><button type="button" class="v52wdagain">Play again</button><button type="button" class="v52wdback">← Màn hình chính</button></div>`;
      body.querySelector('.v52wdagain').onclick = () => v52wMini(id); body.querySelector('.v52wdback').onclick = v52wDevHome; } }, 1000);
  V52WD.game = {stop:() => { run = false; clearInterval(tick); }};
}
// ---------- nút 💻 trên thanh nhanh (hiện khi đã có máy) + túi đồ trong hồ sơ ----------
function v52wDevBtn(){ const q = document.getElementById('quick'); if(!q) return; let b = document.getElementById('v52DevB');
  if(!b){ b = v52wsEl('button', '', '💻 Laptop'); b.id = 'v52DevB'; b.type = 'button'; b.title = 'Mở laptop / máy tính bảng'; b.onclick = () => v52wDevice(v52wHasDev()); const ref = document.getElementById('hHome'); q.insertBefore(b, ref ? ref.nextSibling : null); }
  const k = v52wHasDev(); b.hidden = !k; if(k) b.textContent = k === 'laptop' ? '💻 Laptop' : k === 'tablet' ? '📱 Máy tính bảng' : '📱 Điện thoại'; }
function v52wDevInit(){
  v52wDevBtn(); setInterval(v52wDevBtn, 4000);
  const op0 = openProfile; openProfile = function(){ const r = op0.apply(this, arguments); try { const inv = document.getElementById('pfInv'), n = v52wBagN(); if(inv && n){ const box = v52wsEl('div', 'v52pf'); box.innerHTML = '<b>🛍️ Đồ mua ở TTTM Cầu Vồng</b>' + v52wBagHtml(); inv.appendChild(box); v52wBagWire(box); } } catch(e){} return r; };
}
