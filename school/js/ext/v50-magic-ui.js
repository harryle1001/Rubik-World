// ================= v50 · GIAO DIỆN HỌC VIỆN: cổng phép trong Đại sảnh, mở/đóng cảnh, cảm ứng, tủ áo choàng, cửa hàng đũa =================
function v50Say(m){ V50.say = 1; try { toast(m); } finally { V50.say = 0; } }
function v50El(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
function v50Esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]); }
// ---------- khung cảnh (DOM) ----------
function v50Build(){
  if(V50.root) return V50.root; const st = document.getElementById('stage') || document.body, r = v50El('div', '', ''); r.id = 'v50'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', 'Học viện Phép thuật Rubik');
  r.innerHTML = '<canvas id="v50Cv"></canvas>' +
    '<div class="v50top"><button type="button" class="v50ib" id="v50Back" aria-label="Về trường">✕</button><div class="v50tt"><span id="v50Crest"></span><b>Học viện Phép thuật Rubik</b><small>Rubik Spellcraft Academy</small></div>' +
    '<div class="v50tr"><button type="button" class="v50ib" id="v50Robe" aria-label="Tủ áo choàng">🧥</button><button type="button" class="v50ib" id="v50WandB" aria-label="Đũa phép"><canvas width="48" height="48"></canvas></button><button type="button" class="v50ib" id="v50Help" aria-label="Hướng dẫn">?</button></div></div>' +
    '<button type="button" id="v50Act" hidden></button><div id="v50Pan" hidden></div>' +
    '<div id="v50G" hidden><canvas id="v50GCv"></canvas><div class="v50gbar"><div class="v50gl"></div><div class="v50gm" id="v50GStat"></div><div class="v50gr"><button type="button" class="v50ib" id="v50GHelp" aria-label="Hướng dẫn">?</button><button type="button" class="v50ib" id="v50GX" aria-label="Thoát">✕</button></div></div>' +
    '<div id="v50GHow" hidden></div><div id="v50GEnd" hidden></div></div>';
  st.appendChild(r); V50.root = r; V50W.cv = r.querySelector('#v50Cv'); V50W.g = V50W.cv.getContext('2d', {alpha:false});
  r.querySelector('#v50Back').onclick = () => { if(V50W.room === 'hall'){ V50W.room = 'out'; v50Top(); return; } v50Close(); };
  r.querySelector('#v50Robe').onclick = () => v50Wardrobe(); r.querySelector('#v50WandB').onclick = () => v50Shop(); r.querySelector('#v50Help').onclick = () => v50HelpPanel();
  r.querySelector('#v50Act').onclick = () => { if(V50W.near) v50Spot(V50W.near); };
  v50Input(V50W.cv); addEventListener('resize', v50Resize); return r;
}
function v50Top(){ const s = v50State(), cr = document.getElementById('v50Crest'); if(cr){ cr.innerHTML = ''; if(s.house >= 0){ const c = v50Crest(s.house, 26); c.style.cssText = 'width:26px;height:auto;vertical-align:middle'; cr.appendChild(c); } }
  const b = document.querySelector('#v50WandB canvas'); if(b){ const g = b.getContext('2d'); g.clearRect(0, 0, 48, 48); v50DrawWand(g, s.wand, 4, 4, 40); }
  const bk = document.getElementById('v50Back'); if(bk){ bk.textContent = V50W.room === 'hall' ? '↩' : '✕'; bk.setAttribute('aria-label', V50W.room === 'hall' ? 'Ra sân' : 'Về trường'); } }
function v50Resize(){ if(!V50.open || !V50W.cv) return; const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; V50W.dpr = dpr; V50W.W = W; V50W.H = H;
  V50W.cv.width = Math.round(W*dpr); V50W.cv.height = Math.round(H*dpr); V50W.z = Math.max(.6, Math.min(1.15, Math.min(W/560, H/640))); if(V50.game && typeof v50GResize === 'function') v50GResize(); }
function v50Open(){
  v50Build(); v50MeLook(); if(!V50W.npc.length) v50MakeNpcs(); V50.open = true; V50.root.hidden = false; document.body.classList.add('v50on'); V50W.room = 'out'; V50W.me.x = 780; V50W.me.y = 930; V50W.cam.x = 800; V50W.cam.y = 760; V50W.hint = 6; V50W.near = null; v50ActBtn(null);
  v50Resize(); v50Top(); v50PClear(); v50BClear(); V50W.lt = 0; if(!V50W.raf) V50W.raf = requestAnimationFrame(v50Frame); v50Snd('whoosh');
  try { v50Burst(V50W.me.x, V50W.me.y - 30, V50_WANDS[11], true); } catch(e){}
  if(v50State().house < 0) setTimeout(() => { if(V50.open && !V50.game) v50Say('🏰 Chào mừng tới Học viện Phép thuật Rubik! Vào 🕯️ Đại Sảnh để chọn nhà nhé.'); }, 900);
}
function v50Close(){ if(V50.game) v50GClose(true); V50.open = false; if(V50.root) V50.root.hidden = true; document.body.classList.remove('v50on'); v50Panel(null); V50W.keys = {}; if(V50W.raf){ cancelAnimationFrame(V50W.raf); V50W.raf = 0; } }
function v50ActBtn(s){ const b = document.getElementById('v50Act'); if(!b) return; if(!s || V50.game){ b.hidden = true; return; } b.hidden = false; b.innerHTML = '<span>' + s.ic + '</span> ' + v50Esc(s.vi) + ' <small>' + v50Esc(s.en) + '</small>'; }
function v50Spot(s){
  if(s.id === 'portal'){ v50Close(); v50Say('🌀 Đã về Đại sảnh Trường Rubik.'); return; }
  if(s.id === 'hall'){ V50W.room = 'hall'; v50Top(); v50ActBtn(null); V50W.near = null; return; }
  if(s.id === 'shop') return v50Shop(); if(s.id === 'wardrobe') return v50Wardrobe();
  const map = {library:'runes', potion:'potion', stars:'stars', duel:'duel', sigil:'sigil', broom:'broom', creature:'creature'}; if(map[s.id]) v50GOpen(map[s.id]);
}
// ---------- cảm ứng: kéo = đi (cần ảo), chạm = phóng phép / vào khu ----------
function v50ToWorld(x, y){ return [V50W.cam.x + (x - V50W.W/2)/V50W.z, V50W.cam.y + (y - V50W.H/2)/V50W.z]; }
function v50Input(cv){
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => { if(!V50.open || V50.game) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch(err){} V50W.joy = {id:e.pointerId, x0:e.offsetX, y0:e.offsetY, on:false, vx:0, vy:0, t:performance.now()}; });
  cv.addEventListener('pointermove', e => { const j = V50W.joy; if(!j || j.id !== e.pointerId) return; const dx = e.offsetX - j.x0, dy = e.offsetY - j.y0, d = Math.hypot(dx, dy); if(!j.on && d > 14) j.on = true; if(j.on){ const k = Math.min(1, d/40)/(d || 1); j.vx = dx*k; j.vy = dy*k; } });
  const up = e => { const j = V50W.joy; if(!j || j.id !== e.pointerId) return; V50W.joy = null; if(j.on || performance.now() - j.t > 500) return; v50Tap(e.offsetX, e.offsetY); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { V50W.joy = null; });
  addEventListener('keydown', e => { if(!V50.open || V50.game) return; if(e.key === 'Escape'){ v50Close(); return; } V50W.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true; if(/^Arrow/.test(e.key)) e.preventDefault(); }, true);
  addEventListener('keyup', e => { V50W.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; }, true);
}
function v50Tap(x, y){
  if(V50W.room === 'hall'){ const W = V50W.W, H = V50W.H, Hg = v50HallGeo(W, H), by = Hg.by, bw = Hg.bw;
    if(y > by - 10 && y < by + Hg.bh + 10){ const i = Math.floor(x/(W/6)); if(i >= 0 && i < 6 && Math.abs(x - (i + .5)*W/6) < bw){ v50PickHouse(i); return; } }
    v50Burst(x, y, v50Wand(), false); return; }
  const [wx, wy] = v50ToWorld(x, y), m = V50W.me;
  for(const s of V50_SPOTS){ if(Math.hypot(wx - s.x, (wy - s.y)*1.2) < s.r && Math.hypot(m.x - s.x, m.y - s.y) < s.r + 110){ v50Spot(s); return; } }
  const hx = m.x + 9*m.dir, hy = m.y - 24; m.dir = wx < m.x ? -1 : 1; if(Math.hypot(wx - hx, wy - hy) > 520) return;
  v50Cast(hx, hy, wx, wy, null, (tx, ty, w) => {
    V50W.dum.forEach(d => { if(Math.hypot(tx - d.x, ty - (d.y - 20)) < 30){ d.wob = 1; d.hits++; } });
    V50W.lan.forEach(l => { if(Math.hypot(tx - l.x, ty - (l.y - 36)) < 34){ l.lit = 1; if(w.fx === 'fire' || w.fx === 'sun') l.lit = 1.4; } });
  });
}
// ---------- bảng (tủ áo, cửa hàng đũa, hướng dẫn) ----------
function v50Panel(html, cls){ const p = document.getElementById('v50Pan'); if(!p) return null; if(html == null){ p.hidden = true; p.innerHTML = ''; return null; } p.className = cls || ''; p.innerHTML = '<div class="v50card"><button type="button" class="v50ib v50x" aria-label="Đóng">✕</button>' + html + '</div>'; p.hidden = false; p.querySelector('.v50x').onclick = () => v50Panel(null); p.onclick = e => { if(e.target === p) v50Panel(null); }; return p; }
function v50PickHouse(i){ const s = v50State(); s.house = i; if(s.robe.c === 1 && i >= 0) s.robe.c = 6 + i; v50Save(); v50MeLook(); v50Top(); const h = V50_HOUSES[i]; v50Say('🎉 Em thuộc ' + h.vi + ' (' + h.en + ') · ' + h.virtue); v50Burst(V50W.W/2, V50W.H*.4, Object.assign({}, V50_WANDS[11]), true); v50Snd('ok'); if(document.querySelector('#v50Pan .v50robe')) v50Wardrobe(); }
function v50Wardrobe(){
  const s = v50State(); let h = '<h2>🧥 Tủ Áo Choàng <small>Robe Wardrobe</small></h2><div class="v50prev"><canvas id="v50RPrev" width="120" height="150"></canvas></div><h3>Nhà của em</h3><div class="v50grid v50houses">';
  V50_HOUSES.forEach((H, i) => { h += '<button type="button" data-h="' + i + '" class="' + (s.house === i ? 'on' : '') + '"><span class="crest"></span><b>' + H.vi + '</b><small>' + H.en + ' · ' + H.virtue + '</small></button>'; });
  h += '</div><button type="button" class="v50wide" id="v50Dice">🎲 Để khối Rubik chọn nhà giúp em</button><h3>Màu áo</h3><div class="v50sw">';
  V50_ROBE_COLS.forEach((c, i) => { h += '<button type="button" data-c="' + i + '" aria-label="' + c[1] + '" class="' + (s.robe.c === i ? 'on' : '') + '" style="background:' + c[0] + '"></button>'; });
  h += '</div><h3>Kiểu áo</h3><div class="v50grid v50sty">'; V50_ROBE_STY.forEach((c, i) => { h += '<button type="button" data-s="' + i + '" class="' + (s.robe.s === i ? 'on' : '') + '">' + c[2] + ' ' + c[1] + '</button>'; });
  h += '</div><label class="v50chk"><input type="checkbox" id="v50Wear"' + (s.wear ? ' checked' : '') + '> Mặc áo choàng cả khi ở trường chính</label>';
  const p = v50Panel(h, 'v50robe'); if(!p) return; p.querySelectorAll('[data-h]').forEach(b => { const i = +b.dataset.h, c = v50Crest(i, 34); b.querySelector('.crest').appendChild(c); b.onclick = () => v50PickHouse(i); });
  p.querySelector('#v50Dice').onclick = () => { let k = 0; const spin = () => { if(++k < 14){ p.querySelectorAll('[data-h]').forEach((b, i) => b.classList.toggle('on', i === k % 6)); setTimeout(spin, 60 + k*14); } else v50PickHouse(Math.floor(Math.random()*6)); }; spin(); };
  p.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { s.robe.c = +b.dataset.c; v50Save(); v50MeLook(); v50Wardrobe(); });
  p.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { s.robe.s = +b.dataset.s; v50Save(); v50MeLook(); v50Wardrobe(); });
  p.querySelector('#v50Wear').onchange = e => { s.wear = e.target.checked; v50Save(); };
  const cv = p.querySelector('#v50RPrev'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(3.4, 0, 0, 3.4, 60, 138); const m = V50W.me; v50MeLook(); v50Person(g, 0, 0, Object.assign({}, m, {moving:false, dir:1}), 0);
}
function v50Shop(){
  const s = v50State(), lv = (typeof PROF !== 'undefined' && PROF) ? PROF.level : 1, money = (typeof PROF !== 'undefined' && PROF) ? PROF.money : 0;
  let h = '<h2>🪄 Tiệm Đũa <small>Wand Shop · $' + money + ' · Level ' + lv + '</small></h2><p class="v50note">Mỗi cây đũa có một màu phép riêng. Phép chỉ để luyện tập và làm điều tốt ✨</p><div class="v50grid v50wands">';
  V50_WANDS.forEach((w, i) => { const own = s.own.includes(i), lock = lv < w.lvl, eq = s.wand === i;
    h += '<button type="button" data-w="' + i + '" class="' + (eq ? 'on ' : '') + (lock && !own ? 'lock' : '') + '"><canvas width="48" height="48"></canvas><b>' + w.vi + '</b><small>' + w.en + '</small><i style="color:' + (w.fx === 'rainbow' ? '#ffd23f' : w.c) + '">● ' + w.pw + '</i><em>' + (eq ? '✓ Đang cầm' : own ? 'Cầm đũa này' : lock ? '🔒 Level ' + w.lvl : (w.$ ? '$' + w.$ : 'Miễn phí')) + '</em></button>'; });
  h += '</div>'; const p = v50Panel(h, 'v50shop'); if(!p) return;
  p.querySelectorAll('[data-w]').forEach(b => { const i = +b.dataset.w, w = V50_WANDS[i]; v50DrawWand(b.querySelector('canvas').getContext('2d'), i, 0, 0, 48);
    b.onclick = () => { if(s.own.includes(i)){ s.wand = i; v50Save(); v50MeLook(); v50Top(); v50Snd('ok'); v50Shop(); return; }
      if(lv < w.lvl){ v50Say('🔒 Lên Level ' + w.lvl + ' để mở ' + w.vi + '.'); return; }
      if(typeof PROF === 'undefined' || !PROF){ if(typeof loginNudge === 'function') loginNudge(); v50Say('Đăng nhập để mua đũa nhé!'); return; }
      if(PROF.money < w.$){ v50Say('💰 Cần $' + w.$ + ' (em đang có $' + PROF.money + '). Chơi mini game để kiếm thêm!'); return; }
      PROF.money -= w.$; s.own.push(i); s.wand = i; try { renderProfHud(); } catch(e){} v50Save(); v50MeLook(); v50Top(); v50Snd('buy'); v50Say('🪄 Đã có ' + w.vi + '! ' + w.pw + '.'); v50Shop(); }; });
}
function v50HelpPanel(){ v50Panel('<h2>❓ Hướng dẫn <small>How to play</small></h2><ul class="v50how"><li>👆 <b>Kéo</b> ngón tay để đi lại.</li><li>✨ <b>Chạm</b> vào đâu đó để phóng phép bằng đũa đang cầm (thử bắn hình nộm 🎯 và thắp đèn 🏮).</li><li>🏷️ Lại gần một khu rồi bấm nút vàng để vào: 7 mini game, Tiệm Đũa, Tủ Áo Choàng.</li><li>🕯️ Vào Đại Sảnh để chọn 1 trong 6 nhà màu Rubik.</li><li>🌀 Cổng xanh ở cuối đường để về trường chính.</li><li>💛 Phép thuật ở đây chỉ để luyện tập và làm điều tốt – không bao giờ dùng để làm đau ai.</li></ul>'); }

// ---------- cổng phép trong Đại sảnh (thế giới chính) ----------
function v50PortalAt(){ const H = typeof v48cHall === 'function' ? v48cHall() : null; if(!H) return null; return [H.n.x1 - 34, H.door[1] - 60]; }
function v50PortalDraw(VBn){
  const P = v50PortalAt(); if(!P || P[0] < VBn.x0 - 80 || P[0] > VBn.x1 + 80 || P[1] < VBn.y0 - 120 || P[1] > VBn.y1 + 80) return; const t = realT, x = P[0], y = P[1];
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 26, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a8698'; ctx.fillRect(x - 24, y - 64, 7, 64); ctx.fillRect(x + 17, y - 64, 7, 64); ctx.beginPath(); ctx.arc(x, y - 64, 24, Math.PI, 0); ctx.lineTo(x + 17, y - 64); ctx.arc(x, y - 64, 17, 0, Math.PI, true); ctx.closePath(); ctx.fill();
  for(let i = 0; i < 6; i++){ ctx.fillStyle = V50_RUBIK[i]; const a = Math.PI + i/5*Math.PI; ctx.fillRect(x + Math.cos(a)*20.5 - 2, y - 64 + Math.sin(a)*20.5 - 2, 4, 4); }
  ctx.save(); ctx.beginPath(); ctx.rect(x - 17, y - 64, 34, 64); ctx.arc(x, y - 64, 17, Math.PI, 0); ctx.clip(); ctx.fillStyle = '#2a1a5a'; ctx.fillRect(x - 17, y - 82, 34, 82);
  ctx.globalCompositeOperation = 'lighter'; for(let k = 0; k < 4; k++){ ctx.strokeStyle = ['#7a6bff', '#e45bd8', '#3da5ff', '#ffd23f'][k]; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, y - 40, 6 + k*4 + Math.sin(t*2 + k)*1.5, 12 + k*7, t*(k % 2 ? 1 : -1)*.8, 0, 5); ctx.stroke(); } ctx.globalCompositeOperation = 'source-over'; ctx.restore();
  if(Math.random() < .3) for(let i = 0; i < 1; i++){ /* lấp lánh nhẹ */ ctx.fillStyle = '#fff'; ctx.fillRect(x - 15 + Math.random()*30, y - 75 + Math.random()*70, 2, 2); }
  if(cam.z >= .45){ const fs = 17/Math.max(.8, cam.z), ly = y - 96 - fs; ctx.font = "800 " + fs.toFixed(1) + "px Nunito, 'Be Vietnam Pro', sans-serif"; const s = '🌀 Học viện Phép thuật', w = ctx.measureText(s).width + fs; ctx.fillStyle = 'rgba(11,16,32,.75)'; ctx.fillRect(x - w/2, ly - fs*.8, w, fs*1.6); ctx.fillStyle = '#ffe9a8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, ly); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
}
function v50PortalTick(){
  if(V50.open || typeof V46 === 'undefined' || !V46.on || V46.sky || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) { v50PBtn(false); return; } const P = v50PortalAt(); if(!P){ v50PBtn(false); return; }
  const pp = v46Pos(PLAYER), d = Math.hypot(pp[0] - P[0], pp[1] - (P[1] - 10)); v50PBtn(d < 90);
}
function v50PBtn(on){ let b = document.getElementById('v50Enter'); if(!b){ if(!on) return; b = v50El('button', '', '🌀 Vào Học viện Phép thuật <small>Spellcraft Academy</small>'); b.type = 'button'; b.id = 'v50Enter'; b.onclick = () => v50Open(); (document.getElementById('stage') || document.body).appendChild(b); } b.hidden = !on; }

// ---------- khởi động ----------
function v50Init(){
  v50WandImg();
  // vẽ cổng phép sau lâu đài v48
  if(typeof v47wWorld === 'function'){ const w0 = v47wWorld; v47wWorld = function(VBn){ w0(VBn); try { v50PortalDraw(VBn); } catch(e){ console.warn('v50 portal', e); } }; }
  // áo choàng trên người chơi ở trường chính
  const db0 = drawBody; drawBody = function(a, swim){ db0(a, swim); try { if(a === PLAYER && !swim && !a.lion){ const s = v50State(); if(s.wear && (s.house >= 0 || s.own.length > 1 || s.robe.c !== 1)){ const h = s.house >= 0 ? V50_HOUSES[s.house] : null; v50Robe(ctx, (V50_ROBE_COLS[s.robe.c] || V50_ROBE_COLS[1])[0], s.robe.s, h ? h.c : null, a.dir, a.moving, a.walk || 0); } } } catch(e){} };
  // khi ở trong Học viện: không vẽ trường chính (tiết kiệm pin), nhân vật chính đứng yên
  const t0 = toast; toast = function(m){ if(V50.open && !V50.say) return; return t0.apply(this, arguments); };
  const r0 = render; render = function(dt){ if(V50.open) return; return r0(dt); };
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){ if(V50.open && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.controlled && ox === PLAYER.x && oy === PLAYER.y) return false; return cm0(ox, oy, nx, ny); };
  setInterval(() => { try { v50PortalTick(); } catch(e){} }, 250);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v50 = {V50, V50W, v50Open, v50Close, v50GOpen, v50State, v50PortalAt};
}
