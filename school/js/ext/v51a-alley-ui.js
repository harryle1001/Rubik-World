// ================= v51a · GIAO DIỆN PHỐ: mở/đóng cảnh, cảm ứng, 10 cửa hàng, túi đồ, 2 mini game (Giao Thư Cú, Tìm Đồ Thất Lạc), cổng nối Học viện & trường =================
function v51aEl(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
function v51aEsc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]); }
function v51aBuild(){
  if(V51A.root) return V51A.root; const st = document.getElementById('stage') || document.body, r = v51aEl('div', '', ''); r.id = 'v51a'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', 'Phố Cầu Vồng Phép Thuật');
  r.innerHTML = '<canvas id="v51aCv"></canvas><div class="v50top"><button type="button" class="v50ib" id="v51aBack" aria-label="Rời phố">✕</button><div class="v50tt"><b>🌈 Phố Cầu Vồng Phép Thuật</b><small>Rainbow Spell Lane</small></div>' +
    '<div class="v50tr"><button type="button" class="v50ib" id="v51aBag" aria-label="Túi đồ">🎒</button><button type="button" class="v50ib" id="v51aHelp" aria-label="Hướng dẫn">?</button></div></div>' +
    '<div id="v51aQ" hidden><span></span><button type="button" class="v50ib" id="v51aQx" aria-label="Dừng mini game">✕</button></div><button type="button" id="v51aAct" hidden></button><div id="v51aPan" hidden></div>';
  st.appendChild(r); V51A.root = r; V51AW.cv = r.querySelector('#v51aCv'); V51AW.g = V51AW.cv.getContext('2d', {alpha:false});
  r.querySelector('#v51aBack').onclick = () => v51aClose(); r.querySelector('#v51aBag').onclick = () => v51aBagPanel(); r.querySelector('#v51aHelp').onclick = () => v51aHelpPanel();
  r.querySelector('#v51aAct').onclick = () => { if(V51AW.near) v51aSpot(V51AW.near); }; r.querySelector('#v51aQx').onclick = () => { V51A.quest = null; v51aQHud(); };
  v51aInput(V51AW.cv); addEventListener('resize', v51aResize); return r;
}
function v51aResize(){ if(!V51A.open || !V51AW.cv) return; const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; V51AW.dpr = dpr; V51AW.W = W; V51AW.H = H;
  V51AW.cv.width = Math.round(W*dpr); V51AW.cv.height = Math.round(H*dpr); V51AW.z = Math.max(.6, Math.min(1.3, H > W ? H/700 : H/540, W/300)); }
function v51aOpen(from){
  v51aBuild(); v51aLayout(); if(!V51AW.npc.length) v51aMakeLife(); V51A.open = true; V51A.root.hidden = false; document.body.classList.add('v51aon');
  const m = V51AW.me, x = from === 'academy' ? 150 : 2460; m.x = x; m.y = v51aCy(x) - 20; m.dir = from === 'academy' ? 1 : -1; V51AW.cam.x = x; V51AW.cam.y = v51aCy(x) - 70; V51AW.tr.fill(0); V51AW.hint = 6; V51AW.near = null; v51aActBtn(null);
  v51aResize(); v50PClear(); v50BClear(); V51AW.lt = 0; if(!V51AW.raf) V51AW.raf = requestAnimationFrame(v51aFrame); v50Snd('whoosh');
  try { v50Burst(m.x, m.y - 30, V50_WANDS[11], true); } catch(e){}
  const st = v51aState(), got = v51aBank(); setTimeout(() => { if(!V51A.open) return; if(!st.seen){ st.seen = true; v51aSave(); v51aSay('🌈 Chào mừng tới Phố Cầu Vồng Phép Thuật! Lại gần tiệm rồi bấm nút vàng để vào.'); } else if(got > 0) v51aSay('🐷 Heo đất sinh lãi: +$' + got + ' (vào ngân hàng xem nhé)'); }, 900);
}
function v51aClose(){ V51A.open = false; V51A.quest = null; v51aQHud(); if(V51A.root) V51A.root.hidden = true; document.body.classList.remove('v51aon'); v51aPanel(null); V51AW.keys = {}; V51AW.joy = null; if(V51AW.raf){ cancelAnimationFrame(V51AW.raf); V51AW.raf = 0; } }
function v51aFrame(now){
  if(!V51A.open){ V51AW.raf = 0; return; } V51AW.raf = requestAnimationFrame(v51aFrame);
  const dt = Math.min(.05, Math.max(.001, (now - (V51AW.lt || now))/1000)); V51AW.lt = now; V51AW.fa.push(dt); if(V51AW.fa.length > 40) V51AW.fa.shift();
  V51AW.fps = 1/(V51AW.fa.reduce((a, b) => a + b, 0)/V51AW.fa.length); V50.q = V51AW.fps < 40 || (typeof v26Saver === 'function' && v26Saver()) ? .5 : 1;
  try { v51aUpdate(dt); v51aDraw(dt); } catch(e){ console.warn('v51a draw', e); }
}
function v51aActBtn(s){ const b = document.getElementById('v51aAct'); if(!b) return; if(!s){ b.hidden = true; return; } b.hidden = false; b.innerHTML = '<span>' + s.ic + '</span> ' + v51aEsc(s.vi) + ' <small>' + v51aEsc(s.en) + '</small>'; }
function v51aSpot(s){
  if(s.id === 'home'){ v51aClose(); v51aSay('🌀 Đã về Trường Rubik.'); return; }
  if(s.id === 'academy'){ v51aClose(); try { v50Open(); V50W.me.x = 960; V50W.me.y = 930; V50W.cam.x = 960; } catch(e){ console.warn(e); } return; }
  if(s.id === 'balloon') return v51aBuyBalloon(); if(s.id === 'post') return v51aQIntro('owl'); if(s.id === 'lost') return v51aQIntro('hunt'); if(s.id === 'clock') return v51aClockPanel();
  const f = {wand:v51aWandShop, robe:v51aRobeShop, book:v51aBookShop, brew:v51aBrewShop, pet:v51aPetShop, candy:v51aCandyShop, broom:v51aBroomShop, toy:v51aToyShop, ice:v51aIceShop, bank:v51aBankPanel}[s.id]; if(f) f();
}
// ---------- cảm ứng: kéo = đi, chạm = vào tiệm / nhặt đồ / phóng phép ----------
function v51aToWorld(x, y){ return [V51AW.cam.x + (x - V51AW.W/2)/V51AW.z, V51AW.cam.y + (y - V51AW.H/2)/V51AW.z]; }
function v51aInput(cv){
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => { if(!V51A.open) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch(err){} V51AW.joy = {id:e.pointerId, x0:e.offsetX, y0:e.offsetY, on:false, vx:0, vy:0, t:performance.now()}; });
  cv.addEventListener('pointermove', e => { const j = V51AW.joy; if(!j || j.id !== e.pointerId) return; const dx = e.offsetX - j.x0, dy = e.offsetY - j.y0, d = Math.hypot(dx, dy); if(!j.on && d > 14) j.on = true; if(j.on){ const k = Math.min(1, d/40)/(d || 1); j.vx = dx*k; j.vy = dy*k; } });
  cv.addEventListener('pointerup', e => { const j = V51AW.joy; if(!j || j.id !== e.pointerId) return; V51AW.joy = null; if(j.on || performance.now() - j.t > 500) return; v51aTap(e.offsetX, e.offsetY); });
  cv.addEventListener('pointercancel', () => { V51AW.joy = null; });
  addEventListener('keydown', e => { if(!V51A.open) return; if(e.key === 'Escape'){ const p = document.getElementById('v51aPan'); if(p && !p.hidden) v51aPanel(null); else v51aClose(); return; } V51AW.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true; if(/^Arrow/.test(e.key)) e.preventDefault(); }, true);
  addEventListener('keyup', e => { V51AW.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; }, true);
}
function v51aTap(x, y){
  const [wx, wy] = v51aToWorld(x, y), m = V51AW.me, q = V51A.quest;
  if(q && q.id === 'hunt'){ for(const it of q.items){ if(!it.got && Math.hypot(wx - it.x, wy - it.y) < 26){ it.got = true; q.found++; v50Snd('ok'); v50Burst(it.x, it.y, V50_WANDS[11], false); v51aSay('🔍 Tìm thấy ' + it.ic + ' ' + it.vi + ' · ' + it.en + '!'); if(q.found >= q.items.length) v51aQEnd(); return; } } }
  for(const c of V51AW.cats){ const a = V51AW.tips[c.i]; if(a && c.j < 0 && Math.hypot(wx - a[0], wy - a[1] + 6) < 22){ c.meow = 2; v50Snd('pop'); return; } }
  for(const s of V51AW.spots){ if(Math.hypot(wx - s.x, (wy - s.y)*.8) < s.r + 30 && Math.hypot(m.x - s.x, m.y - s.y) < s.r + 150){ v51aSpot(s); return; } }
  for(const a of V51AW.npc){ if(Math.hypot(wx - a.x, wy - a.y + 18) < 18){ a.say = V51A_LINES[Math.floor(Math.random()*V51A_LINES.length)]; a.sayT = 3; a.wait = 3; a.moving = false; a.dir = m.x < a.x ? -1 : 1; v50Snd('pop'); return; } }
  const hx = m.x + 9*m.dir, hy = m.y - 24; m.dir = wx < m.x ? -1 : 1; if(Math.hypot(wx - hx, wy - hy) > 520) return;
  v50Cast(hx, hy, wx, wy, null, (tx, ty) => { V51AW.strings.forEach((S, k) => { if(S.flag) return; for(let j = 1; j <= S.n; j++){ const p = v51aStrPt(S, j/(S.n + 1), performance.now()/1000); if(Math.hypot(tx - p[0], ty - p[1]) < 60) V51AW.lanLit[(k*5 + j) % 64] = 1; } }); });
}
// ---------- bảng ----------
function v51aPanel(html, cls){ const p = document.getElementById('v51aPan'); if(!p) return null; if(html == null){ p.hidden = true; p.innerHTML = ''; return null; } p.className = cls || ''; p.innerHTML = '<div class="v50card"><button type="button" class="v50ib v50x" aria-label="Đóng">✕</button>' + html + '</div>'; p.hidden = false;
  p.querySelector('.v50x').onclick = () => v51aPanel(null); p.onclick = e => { if(e.target === p) v51aPanel(null); }; V51AW.joy = null; return p; }
function v51aHead(id){ const s = V51A_SHOPS.find(x => x.id === id); return '<h2>' + s.ic + ' ' + s.vi + ' <small>' + s.en + ' · 💰 $' + v51aMoney() + ' · Level ' + v51aLv() + '</small></h2>'; }
function v51aBtn(i, inner, cls){ return '<button type="button" data-i="' + i + '" class="' + (cls || '') + '">' + inner + '</button>'; }
function v51aPrice(own, lock, lvl, $){ return own ? '' : lock ? '🔒 Level ' + lvl : $ ? '$' + $ : 'Miễn phí'; }
// 1. Tiệm đũa — dùng chung kho đũa với Tiệm Đũa Học viện (v50)
function v51aWandShop(){
  const s = v50State(), lv = v51aLv(); let h = v51aHead('wand') + '<p class="v50note">🔗 Cùng kho đũa với 🪄 Tiệm Đũa ở Học viện. Phép chỉ để luyện tập và làm điều tốt ✨</p><div class="v50grid v50wands">';
  V50_WANDS.forEach((w, i) => { const own = s.own.includes(i), lock = lv < w.lvl; h += v51aBtn(i, '<canvas width="48" height="48"></canvas><b>' + w.vi + '</b><small>' + w.en + '</small><i style="color:' + (w.fx === 'rainbow' ? '#ffd23f' : w.c) + '">● ' + w.pw + '</i><em>' + (s.wand === i ? '✓ Đang cầm' : own ? 'Cầm đũa này' : v51aPrice(own, lock, w.lvl, w.$)) + '</em>', (s.wand === i ? 'on ' : '') + (lock && !own ? 'lock' : '')); });
  const p = v51aPanel(h + '</div>'); p.querySelectorAll('[data-i]').forEach(b => { const i = +b.dataset.i, w = V50_WANDS[i]; v50DrawWand(b.querySelector('canvas').getContext('2d'), i, 0, 0, 48);
    b.onclick = () => { if(s.own.includes(i)){ s.wand = i; v50Save(); v50Snd('ok'); return v51aWandShop(); } if(lv < w.lvl) return v51aSay('🔒 Lên Level ' + w.lvl + ' để mở ' + w.vi + '.'); if(!v51aPay(w.$)) return; s.own.push(i); s.wand = i; v50Save(); v51aSay('🪄 Đã có ' + w.vi + '! ' + w.pw + '.'); v51aWandShop(); }; });
}
// 2. Áo choàng đặc biệt (màu mới cho tủ áo v50) + kiểu áo
function v51aRobeShop(){
  const s = v50State(), st = v51aState(); let h = v51aHead('robe') + '<div class="v50prev"><canvas id="v51aRP" width="120" height="150"></canvas></div><h3>Vải dệt mây · màu đặc biệt</h3><div class="v50grid">';
  V51A_ROBES.forEach((r, i) => { const own = st.robes.includes(i), on = s.robe.c === 12 + i; h += v51aBtn(i, '<span class="v51asw" style="background:' + r[0] + '"></span><b>Áo ' + r[1] + '</b><small>' + r[2] + ' Robe</small><em>' + (on ? '✓ Đang mặc' : own ? 'Mặc áo này' : '$' + r[3]) + '</em>', on ? 'on' : ''); });
  h += '</div><h3>Kiểu áo</h3><div class="v50grid v50sty">'; V50_ROBE_STY.forEach((c, i) => { h += '<button type="button" data-s="' + i + '" class="' + (s.robe.s === i ? 'on' : '') + '">' + c[2] + ' ' + c[1] + '</button>'; });
  const p = v51aPanel(h + '</div><p class="v50note">🧥 Màu thường và nhà của em chọn ở Tủ Áo Choàng trong Học viện.</p>');
  p.querySelectorAll('[data-i]').forEach(b => { const i = +b.dataset.i, r = V51A_ROBES[i]; b.onclick = () => { if(!st.robes.includes(i)){ if(!v51aPay(r[3])) return; st.robes.push(i); v51aSave(); v51aSay('🧥 Đã may Áo ' + r[1] + '!'); } s.robe.c = 12 + i; s.wear = true; v50Save(); v50MeLook(); v50Snd('ok'); v51aRobeShop(); }; });
  p.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { s.robe.s = +b.dataset.s; v50Save(); v50MeLook(); v51aRobeShop(); });
  const g = p.querySelector('#v51aRP').getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(3.4, 0, 0, 3.4, 60, 138); v50MeLook(); v50Person(g, 0, 0, Object.assign({}, V51AW.me, {moving:false, dir:1}), 0);
}
// 3. Sách phép: bài học + câu hỏi
function v51aBookShop(){
  const st = v51aState(); let h = v51aHead('book') + '<p class="v50note">📖 Mỗi cuốn là một bài học ngắn. Đọc xong trả lời đúng được +EXP.</p><div class="v50grid">';
  V51A_BOOKS.forEach((b, i) => { const own = st.books.includes(i); h += v51aBtn(i, '<span class="v51aic">' + b.ic + '</span><b>' + b.vi + '</b><small>' + b.en + '</small><em>' + (own ? (st.read[i] ? '✓ Đã học · Đọc lại' : '📖 Đọc ngay') : '$' + b.$) + '</em>', own ? 'on' : ''); });
  const p = v51aPanel(h + '</div>'); p.querySelectorAll('[data-i]').forEach(b => { const i = +b.dataset.i; b.onclick = () => { if(!st.books.includes(i)){ if(!v51aPay(V51A_BOOKS[i].$)) return; st.books.push(i); v51aSave(); } v51aRead(i); }; });
}
function v51aRead(i){
  const b = V51A_BOOKS[i], st = v51aState(), ord = [0, 1, 2].sort(() => Math.random() - .5); let h = '<h2>' + b.ic + ' ' + b.vi + ' <small>' + b.en + '</small></h2><ul class="v50how">' + b.txt.map(t => '<li>✨ ' + v51aEsc(t) + '</li>').join('') + '</ul><h3>❓ ' + v51aEsc(b.q) + '</h3><div class="v50grid">';
  ord.forEach(k => { h += '<button type="button" data-a="' + k + '"><b>' + v51aEsc(b.a[k]) + '</b></button>'; }); const p = v51aPanel(h + '</div><button type="button" class="v50wide" id="v51aBk">↩ Về kệ sách</button>');
  p.querySelector('#v51aBk').onclick = () => v51aBookShop();
  p.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { const ok = +x.dataset.a === b.ok; x.classList.add(ok ? 'on' : 'lock'); if(!ok){ v50Snd('bad'); v51aSay('🤔 Chưa đúng, đọc lại một chút nhé!'); return; } v50Snd('ok');
    if(!st.read[i]){ st.read[i] = 1; v51aSave(); try { if(typeof PROF !== 'undefined' && PROF) reward(15, 0, 'Sách phép', true); } catch(e){} v51aSay('🎓 Đúng rồi! +15 EXP'); } else v51aSay('🎓 Chính xác!'); });
}
// 4. Vạc & thảo mộc: mua vạc, mua nguyên liệu, pha 2 món thành thuốc vui
function v51aBrewShop(sel){
  const st = v51aState(); sel = sel || []; let h = v51aHead('brew');
  if(!st.cauld) h += '<p class="v50note">Em cần một chiếc vạc để pha chế.</p><button type="button" class="v50wide" id="v51aCd">🫕 Mua Vạc Đồng · $30</button>';
  h += '<h3>Thảo mộc & nguyên liệu (chạm để mua 1)</h3><div class="v50grid">'; V51A_ING.forEach((g, i) => { h += v51aBtn(i, '<span class="v51aic">' + g.ic + '</span><b>' + g.vi + ' ×' + (st.ing[g.id] || 0) + '</b><small>' + g.en + ' · ' + g.fact + '</small><em>+1 · $' + g.$ + '</em>'); });
  h += '</div>'; if(st.cauld){ h += '<h3>🫕 Chọn 2 nguyên liệu để pha</h3><div class="v51achips">'; V51A_ING.forEach(g => { if(st.ing[g.id]) h += '<button type="button" data-g="' + g.id + '" class="' + (sel.includes(g.id) ? 'on' : '') + '">' + g.ic + ' ' + g.vi + '</button>'; }); h += '</div><button type="button" class="v50wide" id="v51aMix"' + (sel.length === 2 ? '' : ' disabled') + '>🔥 Khuấy vạc</button>'; }
  h += '<h3>📜 Sổ công thức</h3><ul class="v50how">'; const rc = st.rec || {}; Object.keys(V51A_POTS).forEach(k => { const P = V51A_POTS[k], [a, b] = k.split('+').map(id => V51A_ING.find(g => g.id === id)); h += '<li>' + P.ic + ' <b>' + P.vi + '</b>: ' + (rc[P.id] ? a.ic + ' ' + a.vi + ' + ' + b.ic + ' ' + b.vi : '❔ + ❔ (gợi ý: ' + a.ic + ' + …)') + ' · ' + P.d + '</li>'; });
  const p = v51aPanel(h + '</ul>'); const cd = p.querySelector('#v51aCd'); if(cd) cd.onclick = () => { if(!v51aPay(30)) return; st.cauld = true; v51aSave(); v51aBrewShop(); };
  p.querySelectorAll('[data-i]').forEach(b => { const g = V51A_ING[+b.dataset.i]; b.onclick = () => { if(!v51aPay(g.$)) return; st.ing[g.id] = (st.ing[g.id] || 0) + 1; v51aSave(); v51aBrewShop(sel); }; });
  p.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const id = b.dataset.g, k = sel.indexOf(id); if(k >= 0) sel.splice(k, 1); else { if(sel.length >= 2) sel.shift(); sel.push(id); } v51aBrewShop(sel); });
  const mx = p.querySelector('#v51aMix'); if(mx) mx.onclick = () => { const [a, b] = sel; if(!(st.ing[a] > 0 && st.ing[b] > 0) || a === b) return; st.ing[a]--; st.ing[b]--; const P = V51A_POTS[a + '+' + b] || V51A_POTS[b + '+' + a];
    if(P){ st.pot[P.id] = (st.pot[P.id] || 0) + 1; st.rec = st.rec || {}; st.rec[P.id] = 1; v51aSave(); v50Snd('ok'); v51aSay('⚗️ Pha thành công ' + P.ic + ' ' + P.vi + '! Mở túi 🎒 để uống.'); }
    else { v51aSave(); v50Snd('bad'); v51aSay('🟤 Nước màu nâu… chưa thành thuốc. Xem gợi ý trong Sổ công thức nhé!'); } v51aBrewShop(); };
}
// 5. Cú & thú phép: mua, dắt theo
function v51aPetShop(){
  const st = v51aState(), lv = v51aLv(); let h = v51aHead('pet') + '<p class="v50note">🐾 Thú cưng đi theo em trong phố và ở trường. Cú của em còn giúp chuyển thư ở 🦉 Bưu Cục Cú!</p><div class="v50grid">';
  V51A_PETS.forEach((p, i) => { const own = st.pets.includes(i), lock = lv < p.lvl; h += v51aBtn(i, '<canvas width="72" height="60"></canvas><b>' + p.vi + '</b><small>' + p.en + '</small><em>' + (st.pet === i ? '✓ Đang đi cùng' : own ? 'Dắt theo' : v51aPrice(own, lock, p.lvl, p.$)) + '</em>', (st.pet === i ? 'on ' : '') + (lock && !own ? 'lock' : '')); });
  h += '</div>'; if(st.pet >= 0) h += '<button type="button" class="v50wide" id="v51aPh">🏠 Cho thú cưng về nhà nghỉ</button>';
  const P = v51aPanel(h); P.querySelectorAll('[data-i]').forEach(b => { const i = +b.dataset.i, p = V51A_PETS[i], g = b.querySelector('canvas').getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(2.4, 0, 0, 2.4, 36, p.fly ? 46 : 52); v51aDrawPet(g, i, 0, 0, 0, 1, false);
    b.onclick = () => { if(!st.pets.includes(i)){ if(lv < p.lvl) return v51aSay('🔒 Lên Level ' + p.lvl + ' để nhận nuôi ' + p.vi + '.'); if(!v51aPay(p.$)) return; st.pets.push(i); } st.pet = i; v51aSave(); v50Snd('ok'); v51aSay('🐾 ' + p.vi + ' đi cùng em! ' + p.say); v51aPetShop(); }; });
  const ph = P.querySelector('#v51aPh'); if(ph) ph.onclick = () => { st.pet = -1; v51aSave(); v51aPetShop(); };
}
// 6. Kẹo phép (ăn ngay hoặc cất túi)
function v51aCandyShop(){
  const st = v51aState(); let h = v51aHead('candy') + '<p class="v50note">🪥 Kẹo vui nhưng nhớ đánh răng sau khi ăn nhé!</p><div class="v50grid">';
  V51A_CANDY.forEach((c, i) => { h += v51aBtn(i, '<span class="v51aic">' + c.ic + '</span><b>' + c.vi + ' ×' + (st.candy[c.id] || 0) + '</b><small>' + c.en + ' · ' + c.d + '</small><em>Mua 1 · $' + c.$ + '</em>'); });
  h += '</div><h3>Ăn ngay</h3><div class="v51achips">'; V51A_CANDY.forEach(c => { if(st.candy[c.id]) h += '<button type="button" data-e="' + c.id + '">' + c.ic + ' ' + c.vi + '</button>'; });
  const p = v51aPanel(h + '</div>'); p.querySelectorAll('[data-i]').forEach(b => { const c = V51A_CANDY[+b.dataset.i]; b.onclick = () => { if(!v51aPay(c.$)) return; st.candy[c.id] = (st.candy[c.id] || 0) + 1; v51aSave(); v51aCandyShop(); }; });
  p.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { v51aEat(b.dataset.e); v51aCandyShop(); });
}
function v51aEat(id){ const st = v51aState(), c = V51A_CANDY.find(x => x.id === id); if(!c || !st.candy[id]) return; st.candy[id]--; v51aSave(); v51aFx(c.fx, c.sec); v50Snd('pop'); v51aSay(c.ic + ' ' + c.d + '! 🪥 Nhớ đánh răng nhé.'); }
function v51aDrink(id){ const st = v51aState(), P = Object.values(V51A_POTS).find(x => x.id === id); if(!P || !st.pot[id]) return; st.pot[id]--; v51aSave(); v51aFx(P.fx, P.sec); v50Snd('ok'); v51aSay(P.ic + ' ' + P.vi + ': ' + P.d + '.'); }
// 7. Chổi bay (dùng ở mini game Bay Chổi Qua Vòng của Học viện)
function v51aBroomShop(){
  const st = v51aState(), lv = v51aLv(); let h = v51aHead('broom') + '<p class="v50note">🧹 Chổi đang chọn sẽ dùng ở mini game <b>Bay Chổi Qua Vòng</b> (Sân Bay Chổi trong Học viện): hút sao xa hơn, thêm điểm mỗi vòng.</p><div class="v50grid">';
  V51A_BROOMS.forEach((b, i) => { const own = st.brooms.includes(i), lock = lv < b.lvl; h += v51aBtn(i, '<canvas width="96" height="40"></canvas><b>' + b.vi + '</b><small>' + b.en + ' · 🧲 ×' + b.mag + ' · +' + b.bon + '/vòng</small><em>' + (st.broom === i ? '✓ Đang dùng' : own ? 'Chọn chổi này' : v51aPrice(own, lock, b.lvl, b.$)) + '</em>', (st.broom === i ? 'on ' : '') + (lock && !own ? 'lock' : '')); });
  const p = v51aPanel(h + '</div>'); p.querySelectorAll('[data-i]').forEach(x => { const i = +x.dataset.i, b = V51A_BROOMS[i], g = x.querySelector('canvas').getContext('2d'); g.imageSmoothingEnabled = false; v51aDrawBroom(g, i, 62, 20, 2, 0);
    x.onclick = () => { if(!st.brooms.includes(i)){ if(lv < b.lvl) return v51aSay('🔒 Lên Level ' + b.lvl + ' để mua ' + b.vi + '.'); if(!v51aPay(b.$)) return; st.brooms.push(i); } st.broom = i; v51aSave(); v50Snd('ok'); v51aSay('🧹 Chọn ' + b.vi + '. Bay thử ở Sân Bay Chổi trong Học viện nhé!'); v51aBroomShop(); }; });
}
// 8. Đồ chơi Rubik phép (bay lơ lửng cạnh vai)
function v51aToyShop(){
  const st = v51aState(), lv = v51aLv(); let h = v51aHead('toy') + '<p class="v50note">🧊 Đồ chơi Rubik phép bay lơ lửng cạnh vai em, tự đổi màu.</p><div class="v50grid">';
  V51A_TOYS.forEach((o, i) => { const own = st.toys.includes(i), lock = lv < o.lvl; h += v51aBtn(i, '<canvas width="60" height="60"></canvas><b>' + o.vi + '</b><small>' + o.en + '</small><em>' + (st.toy === i ? '✓ Đang mang' : own ? 'Mang theo' : v51aPrice(own, lock, o.lvl, o.$)) + '</em>', (st.toy === i ? 'on ' : '') + (lock && !own ? 'lock' : '')); });
  h += '</div>'; if(st.toy >= 0) h += '<button type="button" class="v50wide" id="v51aTh">📦 Cất đồ chơi</button>';
  const p = v51aPanel(h); p.querySelectorAll('[data-i]').forEach(x => { const i = +x.dataset.i, o = V51A_TOYS[i]; v51aDrawToy(x.querySelector('canvas').getContext('2d'), i, 30, 30, 0, 2.2);
    x.onclick = () => { if(!st.toys.includes(i)){ if(lv < o.lvl) return v51aSay('🔒 Lên Level ' + o.lvl + '.'); if(!v51aPay(o.$)) return; st.toys.push(i); } st.toy = i; v51aSave(); v50Snd('ok'); v51aToyShop(); }; });
  const th = p.querySelector('#v51aTh'); if(th) th.onclick = () => { st.toy = -1; v51aSave(); v51aToyShop(); };
}
// 9. Xe kem: chọn tối đa 3 viên, tính nhẩm tổng tiền được giảm $1
function v51aIceShop(sel){
  sel = sel || []; let tot = 0; sel.forEach(i => tot += V51A_ICE[i][3]); let h = v51aHead('ice') + '<p class="v50note">🍨 Chọn tối đa 3 viên kem. Tính nhẩm đúng tổng tiền được giảm $1!</p><div class="v50grid">';
  V51A_ICE.forEach((f, i) => { const n = sel.filter(k => k === i).length; h += v51aBtn(i, '<span class="v51aic">' + f[0] + '</span><b>' + f[1] + (n ? ' ×' + n : '') + '</b><small>' + f[2] + '</small><em>$' + f[3] + '</em>', n ? 'on' : ''); });
  h += '</div><p class="v51acone">' + (sel.length ? sel.map(i => V51A_ICE[i][0]).join(' ') : '🍦 Chưa chọn viên nào') + '</p>';
  if(sel.length){ const ans = [tot, tot + 1, Math.max(1, tot - 2)].filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - .5); h += '<h3>🧮 ' + sel.map(i => '$' + V51A_ICE[i][3]).join(' + ') + ' = ?</h3><div class="v51achips">' + ans.map(a => '<button type="button" data-a="' + a + '">$' + a + '</button>').join('') + '</div><button type="button" class="v50ib v51aclr" id="v51aIc">↺</button>'; }
  const p = v51aPanel(h); p.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { if(sel.length >= 3) sel.shift(); sel.push(+b.dataset.i); v51aIceShop(sel); });
  const c = p.querySelector('#v51aIc'); if(c) c.onclick = () => v51aIceShop([]);
  p.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const ok = +b.dataset.a === tot, price = ok ? Math.max(1, tot - 1) : tot; if(!v51aPay(price)) return; V51A.cone = {c:sel.map(i => V51A_ICE[i][4]), t:60}; if(sel.includes(5)) v51aFx('cloud', 30);
    v51aSay(ok ? '🎉 Tính đúng! Kem chỉ còn $' + price + '. Ngon miệng nhé 🍦' : '🧮 Tổng đúng là $' + tot + '. Lần sau thử lại nhé! Kem của em đây 🍦'); v51aPanel(null); });
}
// 10. Ngân hàng heo đất: gửi tiền nhận lãi kép mỗi ngày
function v51aBankPanel(){
  const got = v51aBank(), st = v51aState(), b = st.bank, mo = v51aMoney(); let h = v51aHead('bank');
  h += '<div class="v51abank"><div><small>Ví của em</small><b>$' + mo + '</b></div><div><small>🐷 Heo đất</small><b>$' + b.bal + '</b></div><div><small>Tổng lãi đã nhận</small><b>+$' + b.earned + '</b></div></div>' + (got ? '<p class="v50note">🎉 Lãi mới hôm nay: +$' + got + '</p>' : '');
  h += '<h3>Gửi vào</h3><div class="v51achips"><button type="button" data-m="10">+$10</button><button type="button" data-m="50">+$50</button><button type="button" data-m="all">Gửi hết</button></div><h3>Rút ra</h3><div class="v51achips"><button type="button" data-m="-10">−$10</button><button type="button" data-m="-50">−$50</button><button type="button" data-m="-all">Rút hết</button></div>';
  h += '<h3>📈 Nếu để yên trong heo đất</h3><table class="v51atbl"><tr><th>Sau</th><th>Số tiền</th></tr>' + [1, 7, 30].map(d => '<tr><td>' + d + ' ngày</td><td>$' + v51aProj(b.bal, d) + '</td></tr>').join('') + '</table>';
  h += '<ul class="v50how"><li>🐷 Mỗi ngày heo đất cộng thêm <b>2%</b> tiền lãi.</li><li>🔁 <b>Lãi kép</b>: ngày mai em được lãi cả trên phần lãi hôm nay!</li><li>⏳ Kiên nhẫn để dành = tiền tự lớn lên. (Lãi tính trên tối đa $2000.)</li></ul>';
  const p = v51aPanel(h); p.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { const v = x.dataset.m, n = v === 'all' ? v51aMoney() : v === '-all' ? -b.bal : +v; if(v51aBankMove(n)) v51aBankPanel(); });
}
function v51aBuyBalloon(){ if(!v51aPay(2)) return; V51A.bal = {c:V51A_BALC[Math.floor(Math.random()*6)], t:180}; v51aSay('🎈 Bóng bay của em! Giữ chặt dây nhé.'); }
function v51aClockPanel(){ const c = typeof clock === 'number' ? clock : 720, hh = Math.floor(c/60), mm = Math.floor(c % 60);
  v51aPanel('<h2>🕰️ Tháp Đồng Hồ Cầu Vồng <small>Rainbow Clock Tower</small></h2><p class="v51acone">' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + '</p><ul class="v50how"><li>📐 Tháp đứng đúng điểm vàng của phố: 2618 ÷ 1,618 = 1618 bước.</li><li>🕛 Mặt đồng hồ đặt ở độ cao chiều cao ÷ φ, vạch giờ tô 6 màu Rubik.</li><li>🌙 Khi trời tối, đèn lồng cả phố tự sáng ấm.</li></ul>'); }
// ---------- túi đồ ----------
function v51aBagPanel(){
  const st = v51aState(); let h = '<h2>🎒 Túi đồ <small>My Bag · 💰 $' + v51aMoney() + '</small></h2><h3>⚗️ Thuốc</h3><div class="v51achips">'; let n = 0;
  Object.values(V51A_POTS).forEach(P => { if(st.pot[P.id]){ n++; h += '<button type="button" data-d="' + P.id + '">' + P.ic + ' ' + P.vi + ' ×' + st.pot[P.id] + '</button>'; } }); if(!n) h += '<span class="v50note">Chưa có · pha ở ⚗️ Vạc & Thảo Mộc</span>';
  h += '</div><h3>🍬 Kẹo</h3><div class="v51achips">'; n = 0; V51A_CANDY.forEach(c => { if(st.candy[c.id]){ n++; h += '<button type="button" data-e="' + c.id + '">' + c.ic + ' ' + c.vi + ' ×' + st.candy[c.id] + '</button>'; } }); if(!n) h += '<span class="v50note">Chưa có</span>';
  h += '</div><h3>🐾 Thú cưng</h3><div class="v51achips">' + (st.pets.length ? st.pets.map(i => '<button type="button" data-p="' + i + '" class="' + (st.pet === i ? 'on' : '') + '">' + V51A_PETS[i].vi + '</button>').join('') : '<span class="v50note">Chưa có</span>') + '</div>';
  h += '<h3>🧊 Đồ chơi</h3><div class="v51achips">' + (st.toys.length ? st.toys.map(i => '<button type="button" data-t="' + i + '" class="' + (st.toy === i ? 'on' : '') + '">' + V51A_TOYS[i].vi + '</button>').join('') : '<span class="v50note">Chưa có</span>') + '</div>';
  h += '<h3>🧹 Chổi</h3><div class="v51achips">' + st.brooms.map(i => '<button type="button" data-b="' + i + '" class="' + (st.broom === i ? 'on' : '') + '">' + V51A_BROOMS[i].vi + '</button>').join('') + '</div>';
  h += '<h3>📚 Sách</h3><div class="v51achips">' + (st.books.length ? st.books.map(i => '<button type="button" data-k="' + i + '">' + V51A_BOOKS[i].ic + ' ' + V51A_BOOKS[i].vi + '</button>').join('') : '<span class="v50note">Chưa có</span>') + '</div>';
  const p = v51aPanel(h); p.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { v51aDrink(b.dataset.d); v51aBagPanel(); }); p.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { v51aEat(b.dataset.e); v51aBagPanel(); });
  p.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const i = +b.dataset.p; st.pet = st.pet === i ? -1 : i; v51aSave(); v51aBagPanel(); }); p.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const i = +b.dataset.t; st.toy = st.toy === i ? -1 : i; v51aSave(); v51aBagPanel(); });
  p.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { st.broom = +b.dataset.b; v51aSave(); v51aBagPanel(); }); p.querySelectorAll('[data-k]').forEach(b => b.onclick = () => v51aRead(+b.dataset.k));
}
function v51aHelpPanel(){ v51aPanel('<h2>❓ Hướng dẫn <small>How to play</small></h2><ul class="v50how"><li>👆 <b>Kéo</b> ngón tay để đi dọc phố.</li><li>🏷️ Lại gần tiệm, bấm <b>nút vàng</b> (hoặc chạm vào tiệm) để mua sắm bằng $ trong game.</li><li>🎒 Đồ đã mua nằm trong túi: thú cưng đi theo, chổi dùng ở Sân Bay Chổi, thuốc & kẹo tạo hiệu ứng vui.</li><li>🦉 <b>Bưu Cục Cú</b> và 🔍 <b>Quầy Đồ Thất Lạc</b> là 2 mini game.</li><li>🐷 Gửi tiền vào ngân hàng heo đất để nhận lãi mỗi ngày.</li><li>✨ Chạm lên phố để phóng phép thắp đèn lồng; chạm mèo trên mái, chạm người phố để chào.</li><li>🏰 Cổng bên trái về Học viện · 🌀 cổng bên phải về Trường Rubik.</li></ul>'); }
// ---------- mini game 1: Giao Thư Cú · mini game 2: Tìm Đồ Thất Lạc ----------
const V51A_LOST = [['🗝️', 'Chìa khóa bạc', 'Silver key'], ['🧩', 'Mảnh Rubik', 'Rubik piece'], ['📜', 'Cuộn giấy cổ', 'Old scroll'], ['🧦', 'Chiếc tất len', 'Wool sock'], ['🔮', 'Quả cầu pha lê', 'Crystal ball'], ['🪶', 'Lông cú', 'Owl feather'], ['⏰', 'Đồng hồ nhỏ', 'Little clock'], ['🧸', 'Gấu bông', 'Teddy bear'], ['🎀', 'Chiếc nơ', 'Ribbon'], ['🪀', 'Con yo-yo', 'Yo-yo']];
function v51aQIntro(id){
  const st = v51aState(), best = st.best[id] || 0, owl = id === 'owl';
  const h = owl ? '<h2>🦉 Giao Thư Cú <small>Owl Post · Kỷ lục: ' + best + '</small></h2><ul class="v50how"><li>✉️ Cú mang 5 lá thư. Đọc địa chỉ trên thư (tiếng Việt + tiếng Anh).</li><li>🏃 Đi tới đúng cửa tiệm đó: thư tự giao.</li><li>⏱ 100 giây. Mũi tên vàng chỉ đường nếu em cần.</li></ul>'
    : '<h2>🔍 Tìm Đồ Thất Lạc <small>Lost & Found · Kỷ lục: ' + best + '</small></h2><ul class="v50how"><li>👀 Dân phố đánh rơi 6 món đồ quanh phố: trên bệ cửa, mái quầy, cạnh đài phun…</li><li>✨ Đồ lấp lánh nhẹ mỗi vài giây. <b>Chạm</b> vào để nhặt.</li><li>📖 Học tên đồ vật bằng tiếng Anh. ⏱ 120 giây.</li></ul>';
  const p = v51aPanel(h + '<button type="button" class="v50wide v50again" id="v51aGo">▶ Bắt đầu</button>'); p.querySelector('#v51aGo').onclick = () => { v51aPanel(null); v51aQStart(id); };
}
function v51aQStart(id){
  const m = V51AW.me; v50Snd('whoosh');
  if(id === 'owl'){ V51A.quest = {id, left:100, n:0, N:5, score:0, tgt:null, last:null}; v51aNextLetter(); }
  else { const W = V51AW.win.filter(w => w[3] === 0 && w[1] > 300), C = []; for(let i = 0; i < 40 && W.length; i++){ const w = W[Math.floor(Math.random()*W.length)]; C.push([w[0], w[1] + 10]); }
    V51AW.stalls.forEach(s => C.push([s.x + (Math.random() - .5)*30, s.base - 82])); const f = v51aFount(); C.push([f[0] + 30, f[1] - 14], [f[0] - 36, f[1] - 8]); const ct = v51aCart(); C.push([ct[0] - 26, ct[1] - 74]); V51AW.tips.forEach((t, i) => { if(i % 4 === 1) C.push([t[0], t[1] + 14]); });
    C.sort(() => Math.random() - .5); const pick = []; for(const c of C){ if(pick.length >= 6) break; if(pick.every(p => Math.abs(p[0] - c[0]) > 150)) pick.push(c); } const L = V51A_LOST.slice().sort(() => Math.random() - .5);
    V51A.quest = {id, left:120, found:0, items:pick.map((p, i) => ({x:p[0], y:p[1], got:false, ic:L[i][0], vi:L[i][1], en:L[i][2], ph:Math.random()*3}))}; }
  v51aQHud();
}
function v51aNextLetter(){ const q = V51A.quest, S = V51AW.spots.filter(s => s.b && V51A_SHOPS.some(x => x.id === s.id) && s !== q.last); q.tgt = S[Math.floor(Math.random()*S.length)]; q.last = q.tgt; v51aSay('✉️ Thư gửi: ' + q.tgt.ic + ' ' + q.tgt.vi + ' · ' + q.tgt.en); }
function v51aQuestTick(dt){
  const q = V51A.quest; if(!q) return; if(document.getElementById('v51aPan') && !document.getElementById('v51aPan').hidden) return; q.left -= dt; q.hud = (q.hud || 0) - dt; if(q.hud <= 0){ q.hud = .25; v51aQHud(); }
  if(q.left <= 0) return v51aQEnd();
  if(q.id === 'owl' && q.tgt){ const m = V51AW.me; if(Math.hypot(m.x - q.tgt.x, m.y - q.tgt.y) < 60){ q.n++; q.score += 20 + Math.ceil(q.left/10); v50Snd('ok'); v50Burst(q.tgt.x, q.tgt.y - 40, V50_WANDS[0], false); if(q.n >= q.N) return v51aQEnd(); v51aNextLetter(); } }
}
function v51aQHud(){ const b = document.getElementById('v51aQ'); if(!b) return; const q = V51A.quest; if(!q){ b.hidden = true; return; } b.hidden = false;
  b.querySelector('span').textContent = q.id === 'owl' ? '🦉 ' + q.n + '/' + q.N + ' → ' + (q.tgt ? q.tgt.ic + ' ' + q.tgt.vi : '') + ' · ⏱ ' + Math.max(0, Math.ceil(q.left)) + 's' : '🔍 ' + q.items.map(i => i.got ? '✅' : i.ic).join(' ') + ' · ⏱ ' + Math.max(0, Math.ceil(q.left)) + 's'; }
function v51aQEnd(){
  const q = V51A.quest; if(!q) return; V51A.quest = null; v51aQHud(); const st = v51aState(), owl = q.id === 'owl';
  const perf = owl ? (q.n/q.N)*(.6 + .4*Math.max(0, q.left)/100) : (q.found/q.items.length)*(.6 + .4*Math.max(0, q.left)/120), score = owl ? q.score : q.found*20 + Math.max(0, Math.ceil(q.left));
  const r = v50Reward('v51a' + q.id, perf, owl ? 'Giao Thư Cú' : 'Tìm Đồ Thất Lạc'), rec = score > (st.best[q.id] || 0); if(rec){ st.best[q.id] = score; v51aSave(); } const stars = perf >= .85 ? 3 : perf >= .5 ? 2 : perf > .1 ? 1 : 0; v50Snd(stars >= 2 ? 'ok' : 'pop');
  const p = v51aPanel('<div class="v50end"><h2>' + (stars >= 2 ? '🎉 Tuyệt vời!' : '👍 Cố lên nhé!') + '</h2><div class="v50stars">' + '★'.repeat(stars) + '<span>' + '★'.repeat(3 - stars) + '</span></div><p class="v50big">' + score + ' điểm</p><p>' + (owl ? '✉️ Giao ' + q.n + '/' + q.N + ' thư' : '🔍 Tìm được ' + q.found + '/' + q.items.length + ' món') + '</p><p>+' + r.exp + ' EXP · +$' + r.money + (rec ? ' · 🏆 Kỷ lục mới!' : ' · Kỷ lục: ' + (st.best[q.id] || 0)) + '</p>' +
    (owl ? '' : '<ul class="v50how">' + q.items.map(i => '<li>' + i.ic + ' ' + i.vi + ' = <b>' + i.en + '</b>' + (i.got ? ' ✅' : '') + '</li>').join('') + '</ul>') + '<button type="button" class="v50wide v50again" id="v51aAgain">▶ Play again</button></div>');
  p.querySelector('#v51aAgain').onclick = () => { v51aPanel(null); v51aQStart(q.id); };
  if(stars >= 2) for(let i = 0; i < 3; i++) setTimeout(() => { if(V51A.open) v50Burst(V51AW.me.x + (i - 1)*60, V51AW.me.y - 80, V50_WANDS[11], true); }, i*220);
}
function v51aHuntDraw(g, t){ const q = V51A.quest; if(!q || q.id !== 'hunt') return; g.font = "16px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  q.items.forEach(it => { if(it.got) return; const u = ((t + it.ph) % 2.6)/2.6; g.globalAlpha = .85; g.fillText(it.ic, it.x, it.y); if(u < .3){ g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - u/.3)*.9; g.drawImage(v50Shape('star', '#fff3b0'), it.x + 4, it.y - 14, 12, 12); g.drawImage(v50Glow('#fff3b0'), it.x - 14, it.y - 14, 28, 28); g.globalCompositeOperation = 'source-over'; } g.globalAlpha = 1; }); }
function v51aQuestDraw(g, W, H, t, z, cam){
  const q = V51A.quest; if(!q || q.id !== 'owl' || !q.tgt) return; const m = V51AW.me, px = (m.x - cam.x)*z + W/2, py = (m.y - cam.y)*z + H/2;
  // cú mang thư bay trên đầu
  const st = v51aState(), oi = st.pet >= 0 && V51A_PETS[st.pet].k === 'owl' ? st.pet : 1; g.save(); g.translate(px - 18*z, py - 78*z + Math.sin(t*4)*3); g.scale(z*1.3, z*1.3); v51aDrawPet(g, oi, 0, 0, t, 1, true); g.fillStyle = '#fff6dc'; g.fillRect(-4, 1, 9, 6); g.fillStyle = '#c23a3a'; g.fillRect(0, 3, 2, 2); g.restore();
  const tx = (q.tgt.x - cam.x)*z + W/2, ty = (q.tgt.y - cam.y)*z + H/2 - 100*z;
  if(tx > 20 && tx < W - 20){ const y = ty + Math.sin(t*5)*6; g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(tx - 14, y - 14); g.lineTo(tx + 14, y - 14); g.lineTo(tx, y + 6); g.closePath(); g.fill(); g.strokeStyle = '#1a1430'; g.lineWidth = 2; g.stroke(); g.font = '22px sans-serif'; g.textAlign = 'center'; g.fillText('✉️', tx, y - 30); }
  else { const r = tx < 20, ex = r ? 26 : W - 26, ey = Math.max(90, Math.min(H - 90, ty + 100*z)); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(ex + (r ? -14 : 14), ey); g.lineTo(ex + (r ? 10 : -10), ey - 16); g.lineTo(ex + (r ? 10 : -10), ey + 16); g.closePath(); g.fill(); g.strokeStyle = '#1a1430'; g.lineWidth = 2; g.stroke(); }
}
// ---------- cổng vào: trong Học viện + ở trường chính ----------
function v51aGateAt(){ const P = typeof v50PortalAt === 'function' ? v50PortalAt() : null; return P ? [P[0] - 104, P[1] + 4] : null; }
function v51aGateDraw(VBn){
  const P = v51aGateAt(); if(!P || P[0] < VBn.x0 - 80 || P[0] > VBn.x1 + 80 || P[1] < VBn.y0 - 120 || P[1] > VBn.y1 + 80) return; const t = performance.now()/1000, x = P[0], y = P[1];
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 30, 7, 0, 0, 7); ctx.fill();
  for(let k = 0; k < 6; k++){ ctx.strokeStyle = V51A_RUBIK[k]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 44, 30 - k*3, Math.PI, 0); ctx.stroke(); } ctx.fillStyle = '#7d7a90'; ctx.fillRect(x - 32, y - 44, 7, 44); ctx.fillRect(x + 25, y - 44, 7, 44);
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 22, y - 22, 3, 22); ctx.fillStyle = '#f27db3'; ctx.fillRect(x - 28, y - 28, 15, 9); ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x - 13, y - 16, 2, 2);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 + .2*Math.sin(t*2); ctx.drawImage(v50Glow('#ffd23f'), x - 24, y - 50, 48, 48); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if(typeof cam !== 'undefined' && cam.z >= .45){ const fs = 17/Math.max(.8, cam.z), ly = y - 84 - fs; ctx.font = "800 " + fs.toFixed(1) + "px Nunito, 'Be Vietnam Pro', sans-serif"; const s = '🌈 Phố Cầu Vồng', w = ctx.measureText(s).width + fs; ctx.fillStyle = 'rgba(11,16,32,.75)'; ctx.fillRect(x - w/2, ly - fs*.8, w, fs*1.6); ctx.fillStyle = '#ffe9a8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, ly); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
}
function v51aGateTick(){
  let on = false; if(!V51A.open && !V50.open && typeof V46 !== 'undefined' && V46.on && !V46.sky && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible){ const P = v51aGateAt(); if(P){ const pp = v46Pos(PLAYER), d = Math.hypot(pp[0] - P[0], pp[1] - (P[1] - 10)), P2 = v50PortalAt(), d2 = P2 ? Math.hypot(pp[0] - P2[0], pp[1] - (P2[1] - 10)) : 1e9; on = d < 80 && d <= d2; } }
  let b = document.getElementById('v51aEnter'); if(!b){ if(!on) return; b = v51aEl('button', '', '🌈 Vào Phố Cầu Vồng <small>Rainbow Spell Lane</small>'); b.type = 'button'; b.id = 'v51aEnter'; b.onclick = () => v51aOpen('home'); (document.getElementById('stage') || document.body).appendChild(b); } b.hidden = !on;
  const e = document.getElementById('v50Enter'); if(on && e) e.hidden = true;
}
function v51aAcadGate(g, z){ // vẽ cổng phố trong Học viện (toạ độ thế giới v50)
  const x = 960, y = 984, t = performance.now()/1000; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y, 34, 7, 0, 0, 7); g.fill(); g.fillStyle = '#8a8698'; g.fillRect(x - 34, y - 50, 8, 50); g.fillRect(x + 26, y - 50, 8, 50);
  for(let k = 0; k < 6; k++){ g.strokeStyle = V51A_RUBIK[k]; g.lineWidth = 3; g.beginPath(); g.arc(x, y - 50, 31 - k*3, Math.PI, 0); g.stroke(); }
  g.save(); g.beginPath(); g.rect(x - 26, y - 50, 52, 50); g.clip(); g.globalCompositeOperation = 'lighter'; for(let k = 0; k < 3; k++){ g.strokeStyle = ['#ff8fc4', '#ffd23f', '#7fd3ff'][k]; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y - 24, 8 + k*6, 12 + k*6, t*(k % 2 ? 1 : -1), 0, 5); g.stroke(); } g.restore();
}
// ---------- khởi động ----------
function v51aInit(){
  // màu áo đặc biệt nối vào tủ áo v50 (chỉ số 12+)
  V51A_ROBES.forEach(r => V50_ROBE_COLS.push([r[0], r[1]]));
  if(typeof v50Wardrobe === 'function'){ const w0 = v50Wardrobe; v50Wardrobe = function(){ const r = w0.apply(this, arguments); try { const st = v51aState(); document.querySelectorAll('#v50Pan [data-c]').forEach(b => { const i = +b.dataset.c; if(i >= 12 && !st.robes.includes(i - 12)) b.remove(); }); } catch(e){} return r; }; }
  // cổng trong Học viện
  V50_SPOTS.push({id:'alley', x:960, y:962, r:40, ic:'🌈', vi:'Phố Cầu Vồng Phép Thuật', en:'Rainbow Spell Lane'});
  if(typeof v50Spot === 'function'){ const s0 = v50Spot; v50Spot = function(s){ if(s && s.id === 'alley'){ v50Close(); v51aOpen('academy'); return; } return s0.apply(this, arguments); }; }
  if(typeof v50Draw === 'function'){ const d0 = v50Draw; v50Draw = function(dt){ d0(dt); try { const g = V50W.g, z = V50W.z, W = V50W.W, H = V50W.H, c = V50W.cam; g.setTransform(V50W.dpr*z, 0, 0, V50W.dpr*z, V50W.dpr*(W/2 - c.x*z), V50W.dpr*(H/2 - c.y*z)); v51aAcadGate(g, z); g.setTransform(V50W.dpr, 0, 0, V50W.dpr, 0, 0); } catch(e){} }; }
  // chổi mua ở phố dùng trong mini game Bay Chổi Qua Vòng
  const BR = typeof V50_GAMES !== 'undefined' && V50_GAMES.broom; if(BR){ const u0 = BR.update; BR.help.push('🧹 Chổi mua ở 🌈 Phố Cầu Vồng hút sao từ xa hơn và cộng thêm điểm mỗi vòng.');
    BR.update = function(G, dt){ const S = G.st, B = V51A_BROOMS[v51aState().broom] || V51A_BROOMS[0], px = V50G.W*.28; if(S.stars) S.stars.forEach(s => { if(!s.got && Math.hypot(s.x - px, s.y - S.y) < 34*B.mag) s.y += (S.y - s.y)*Math.min(1, dt*8); });
      const p0 = S.pass || 0; u0.call(this, G, dt); if(S.pass > p0) G.score += B.bon; if(B.tr && Math.random() < .5*V50.q) v50P(px - 34, S.y + 6, -90 - Math.random()*40, (Math.random() - .5)*20, .6, 6, v50Glow(v51aBroomCol(B.tr, 0)), 0); };
    BR.draw = function(G, g, W, H){ const S = G.st, night = G.mode === 1, t = performance.now()/1000; v50GSky(g, W, H, night, S.dist);
      const mt = v50Mountains(); g.globalAlpha = .9; const mw = mt.width*(H*.55/mt.height); g.drawImage(mt, -((S.dist*.15) % mw), H*.45, mw, H*.55); g.drawImage(mt, mw - ((S.dist*.15) % mw), H*.45, mw, H*.55); g.globalAlpha = 1;
      const cl = v50CloudImg(); g.globalAlpha = night ? .3 : .85; for(let i = 0; i < 5; i++){ const x = W - ((S.dist*(.3 + i*.08) + i*300) % (W + 200)); g.drawImage(cl, x, 40 + i*H*.12, 140, 52); } g.globalAlpha = 1;
      S.rings.forEach(o => { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 10; g.beginPath(); g.ellipse(o.x + 3, o.y + 3, o.r*.45, o.r, 0, 0, 7); g.stroke(); g.strokeStyle = o.done ? 'rgba(255,255,255,.4)' : o.c; g.lineWidth = 8; g.beginPath(); g.ellipse(o.x, o.y, o.r*.45, o.r, 0, 0, 7); g.stroke();
        if(night){ g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35; g.drawImage(v50Glow(o.c), o.x - o.r, o.y - o.r*1.2, o.r*2, o.r*2.4); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } });
      S.stars.forEach(s => { g.drawImage(v50Shape('star', '#ffd23f'), s.x - 12, s.y - 12 + Math.sin(t*4 + s.x)*3, 24, 24); });
      const px = W*.28, py = S.y, tilt = Math.max(-.4, Math.min(.4, S.vy/400)); g.save(); g.translate(px, py); g.rotate(tilt); g.scale(2, 2); v51aDrawBroom(g, v51aState().broom, 0, 0, 1, t); v50MeLook(); v50Person(g, 0, 1, Object.assign({}, V50W.me, {moving:false, dir:1}), t); g.restore(); }; }
  // thú cưng + đồ chơi đi theo ở trường chính
  const db0 = drawBody; drawBody = function(a, swim){ db0(a, swim); try { if(a === PLAYER && !swim && !a.lion){ const st = v51aState(), t = performance.now()/1000, d = a.dir < 0 ? -1 : 1; if(st.pet >= 0){ const p = V51A_PETS[st.pet]; v51aDrawPet(ctx, st.pet, -16*d, p.fly ? -40 : 2, t, d, a.moving); } if(st.toy >= 0) v51aDrawToy(ctx, st.toy, 15*d, -46, t, 1); } } catch(e){} };
  // khi ở trong phố: không vẽ trường chính, nhân vật chính đứng yên, chặn toast lạ
  const t0 = toast; toast = function(m){ if(V51A.open && !V51A.say) return; return t0.apply(this, arguments); };
  const r0 = render; render = function(dt){ if(V51A.open) return; return r0(dt); };
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){ if(V51A.open && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.controlled && ox === PLAYER.x && oy === PLAYER.y) return false; return cm0(ox, oy, nx, ny); };
  if(typeof v47wWorld === 'function'){ const w0 = v47wWorld; v47wWorld = function(VBn){ w0(VBn); try { v51aGateDraw(VBn); } catch(e){ console.warn('v51a gate', e); } }; }
  setInterval(() => { try { v51aGateTick(); } catch(e){} }, 250);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v51a = {V51A, V51AW, v51aOpen, v51aClose, v51aState, v51aGateAt, v51aQStart, v51aSpot};
}
