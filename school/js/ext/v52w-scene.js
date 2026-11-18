// ================= v52w · 3/4 ĐI TRONG NHÀ: khung cảnh trong nhà dùng chung (kéo để đi, chạm để tương tác) =================
// Tái dùng hệ thống nhà cũ: dữ liệu phòng ROOM (tường, sàn, đồ nội thất mallItem/drawDecor/drawWallFloor, demoRoom) + nhân vật drawBody.
// Nhà phố người chơi (enterPlot), nhà dân làng mới và "Đi vào nhà" từ bảng trang trí đều mở ở đây; TTTM dùng cùng khung (v52w-mall.js).
const V52WS = {open:false, root:null, cv:null, g:null, W:0, H:0, dpr:1, z:1, cam:{x:0, y:0}, me:{x:0, y:0, dir:1, moving:false, walk:0}, sc:null, keys:{}, joy:null, tap:null,
  raf:0, lt:0, near:null, npcs:[], bg:null, bgKey:'', fps:60, fa:[], ride:null, sp:[], hint:0};
function v52wsEl(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
function v52wsEsc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]); }
function v52wsBuild(){
  if(V52WS.root) return V52WS.root; const st = document.getElementById('stage') || document.body, r = v52wsEl('div'); r.id = 'v52s'; r.hidden = true; r.setAttribute('role', 'dialog');
  r.innerHTML = '<canvas id="v52wsCv"></canvas><div class="v52top"><button type="button" class="v52ib" id="v52wsX" aria-label="Ra ngoài">✕</button><div class="v52tt"><b id="v52wsT"></b><small id="v52wsSub"></small></div>' +
    '<div class="v52tr" id="v52wsBtns"><button type="button" class="v52ib" id="v52wsBag" aria-label="Túi đồ">🎒</button><button type="button" class="v52ib" id="v52wsHelp" aria-label="Hướng dẫn">?</button></div></div>' +
    '<button type="button" id="v52wsAct" hidden></button><div id="v52wsPan" hidden></div><div id="v52wsFade"></div>';
  st.appendChild(r); V52WS.root = r; V52WS.cv = r.querySelector('#v52wsCv'); V52WS.g = V52WS.cv.getContext('2d', {alpha:false});
  r.querySelector('#v52wsX').onclick = () => { if(!r.querySelector('#v52wsPan').hidden){ v52wsPanel(null); return; } v52wsClose(); };
  r.querySelector('#v52wsAct').onclick = () => { if(V52WS.near) v52wsUse(V52WS.near); };
  r.querySelector('#v52wsHelp').onclick = () => v52wsPanel('<h2>🚶 Đi trong nhà</h2><p>👆 <b>Kéo</b> trên màn hình để đi (cần ảo).</p><p>👉 <b>Chạm</b> vào người hoặc đồ vật để tới gần và tương tác.</p><p>🟡 Nút vàng ở dưới hiện khi đứng gần chỗ dùng được.</p><p>⌨️ Máy tính: phím mũi tên / WASD, <b>E</b> để dùng, <b>Esc</b> để ra.</p>');
  r.querySelector('#v52wsBag').onclick = () => { if(typeof v52wBagPanel === 'function') v52wBagPanel(); };
  v52wsInput(V52WS.cv); addEventListener('resize', v52wsResize); return r;
}
function v52wsResize(){ if(!V52WS.open) return; const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; V52WS.dpr = dpr; V52WS.W = W; V52WS.H = H;
  V52WS.cv.width = Math.round(W*dpr); V52WS.cv.height = Math.round(H*dpr); const sc = V52WS.sc; if(!sc) return;
  V52WS.z = Math.max(sc.zmin || .9, Math.min(sc.zmax || 1.7, Math.min(W/sc.w, (H - 60)/sc.h)*1.02)); }
// open a scene object: {id, title, sub, w, h, start:[x,y], bg(g), sprites(push), walk(x,y), spots:[{x,y,r,ic,n,f}], npcs:[], tick(dt), over(g), onClose}
function v52wsOpen(sc){
  v52wsBuild(); if(V52WS.open && V52WS.sc && V52WS.sc.onClose) try { V52WS.sc.onClose(); } catch(e){}
  V52WS.sc = sc; V52WS.bg = null; V52WS.near = null; V52WS.ride = null; V52WS.tap = null; V52WS.joy = null; V52WS.keys = {}; V52WS.npcs = sc.npcs || [];
  const m = V52WS.me; m.x = sc.start[0]; m.y = sc.start[1]; m.dir = 1; m.moving = false; V52WS.cam.x = m.x; V52WS.cam.y = m.y;
  document.getElementById('v52wsT').textContent = sc.title || ''; document.getElementById('v52wsSub').textContent = sc.sub || '';
  const ex = document.getElementById('v52wsBtns'); ex.querySelectorAll('.v52x').forEach(b => b.remove()); (sc.btns || []).forEach(b => { const e = v52wsEl('button', 'v52ib v52x', b.ic); e.type = 'button'; e.setAttribute('aria-label', b.n); e.title = b.n; e.onclick = b.f; ex.insertBefore(e, ex.firstChild); });
  V52WS.open = true; V52WS.root.hidden = false; document.body.classList.add('v52on'); v52wsPanel(null); v52wsResize(); v52wsActBtn(null);
  try { keys.up = keys.down = keys.left = keys.right = false; } catch(e){}
  const f = document.getElementById('v52wsFade'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  V52WS.hint = 5; V52WS.lt = 0; if(!V52WS.raf) V52WS.raf = requestAnimationFrame(v52wsFrame);
  try { blipSfx(990); } catch(e){}
}
function v52wsClose(){ const sc = V52WS.sc; V52WS.open = false; if(V52WS.root) V52WS.root.hidden = true; document.body.classList.remove('v52on'); v52wsPanel(null); V52WS.keys = {}; V52WS.joy = null;
  if(V52WS.raf){ cancelAnimationFrame(V52WS.raf); V52WS.raf = 0; } V52WS.sc = null; V52WS.bg = null; if(sc && sc.onClose) try { sc.onClose(); } catch(e){} }
function v52wsPanel(html, cls){ const p = document.getElementById('v52wsPan'); if(!p) return null; if(html == null){ p.hidden = true; p.innerHTML = ''; return null; }
  p.className = cls || ''; p.innerHTML = '<div class="v52card"><button type="button" class="v52ib v52px" aria-label="Đóng">✕</button>' + html + '</div>'; p.hidden = false;
  p.querySelector('.v52px').onclick = () => v52wsPanel(null); p.onclick = e => { if(e.target === p) v52wsPanel(null); }; return p; }
function v52wsActBtn(s){ const b = document.getElementById('v52wsAct'); if(!b) return; if(!s || V52WS.ride){ b.hidden = true; return; } b.hidden = false; b.innerHTML = '<span>' + s.ic + '</span> ' + v52wsEsc(s.n); }
function v52wsUse(s){ if(!s || !s.f) return; V52WS.tap = null; try { s.f(s); } catch(e){ console.warn('v52s use', e); } }
// ---------- input: drag = joystick, tap = walk there / use ----------
function v52wsToWorld(x, y){ return [V52WS.cam.x + (x - V52WS.W/2)/V52WS.z, V52WS.cam.y + (y - V52WS.H/2)/V52WS.z]; }
function v52wsInput(cv){
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => { if(!V52WS.open || V52WS.ride) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch(err){} V52WS.joy = {id:e.pointerId, x0:e.offsetX, y0:e.offsetY, x:e.offsetX, y:e.offsetY, on:false, vx:0, vy:0, t:performance.now()}; V52WS.tap = null; });
  cv.addEventListener('pointermove', e => { const j = V52WS.joy; if(!j || j.id !== e.pointerId) return; j.x = e.offsetX; j.y = e.offsetY; const dx = e.offsetX - j.x0, dy = e.offsetY - j.y0, d = Math.hypot(dx, dy); if(!j.on && d > 14) j.on = true; if(j.on){ const k = Math.min(1, d/44)/(d || 1); j.vx = dx*k; j.vy = dy*k; } });
  const up = e => { const j = V52WS.joy; if(!j || j.id !== e.pointerId) return; V52WS.joy = null; if(j.on || performance.now() - j.t > 450) return; v52wsTapAt(e.offsetX, e.offsetY); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { V52WS.joy = null; });
  const K = {ArrowLeft:'l', a:'l', ArrowRight:'r', d:'r', ArrowUp:'u', w:'u', ArrowDown:'dn', s:'dn'};
  addEventListener('keydown', e => { if(!V52WS.open) return; const tag = (e.target && e.target.tagName) || ''; if(tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; e.stopImmediatePropagation();
    if(k === 'Escape'){ e.preventDefault(); if(!document.getElementById('v52wsPan').hidden) v52wsPanel(null); else v52wsClose(); return; }
    if((k === 'e' || k === 'Enter') && V52WS.near){ e.preventDefault(); v52wsUse(V52WS.near); return; }
    if(K[k]){ V52WS.keys[K[k]] = true; V52WS.tap = null; e.preventDefault(); } }, true);
  addEventListener('keyup', e => { if(!V52WS.open) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if(K[k]) V52WS.keys[K[k]] = false; e.stopImmediatePropagation(); }, true);
}
function v52wsTapAt(sx, sy){
  const [wx, wy] = v52wsToWorld(sx, sy), sc = V52WS.sc, m = V52WS.me; if(!sc) return;
  let best = null, bd = 64; (sc.spots || []).concat(V52WS.npcs.filter(n => n.talk).map(n => n.spot)).forEach(s => { if(!s) return; const d = Math.hypot(s.x - wx, s.y - 20 - wy); if(d < bd){ bd = d; best = s; } });
  if(best){ if(Math.hypot(best.x - m.x, best.y - m.y) < (best.r || 60)) v52wsUse(best); else V52WS.tap = {x:best.x, y:best.y + 6, s:best, stuck:0}; return; }
  V52WS.tap = {x:wx, y:wy, s:null, stuck:0};
}
// ---------- loop ----------
function v52wsFrame(now){
  V52WS.raf = 0; if(!V52WS.open) return; V52WS.raf = requestAnimationFrame(v52wsFrame);
  const dt = V52WS.lt ? Math.min(.05, (now - V52WS.lt)/1000) : .016; V52WS.lt = now; V52WS.fa.push(dt); if(V52WS.fa.length > 30) V52WS.fa.shift(); V52WS.fps = Math.round(V52WS.fa.length/V52WS.fa.reduce((a, b) => a + b, 0));
  try { v52wsStep(dt); } catch(e){ console.warn('v52s step', e); }
  try { v52wsDraw(dt); } catch(e){ console.warn('v52s draw', e); }
}
function v52wsWalk(x, y){ const sc = V52WS.sc; return !sc || !sc.walk || sc.walk(x, y); }
function v52wsStep(dt){
  const sc = V52WS.sc, m = V52WS.me; if(!sc) return; if(V52WS.hint > 0) V52WS.hint -= dt;
  if(V52WS.ride){ const R = V52WS.ride; R.t += dt; const u = Math.min(1, R.t/R.dur), e = u*u*(3 - 2*u); m.x = R.a[0] + (R.b[0] - R.a[0])*e; m.y = R.a[1] + (R.b[1] - R.a[1])*e; m.moving = false; if(u >= 1){ V52WS.ride = null; if(R.done) R.done(); } }
  else {
    let vx = 0, vy = 0; const K = V52WS.keys, j = V52WS.joy;
    if(j && j.on){ vx = j.vx; vy = j.vy; } else if(K.l || K.r || K.u || K.dn){ vx = (K.r ? 1 : 0) - (K.l ? 1 : 0); vy = (K.dn ? 1 : 0) - (K.u ? 1 : 0); const l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l; }
    else if(V52WS.tap){ const T = V52WS.tap, dx = T.x - m.x, dy = T.y - m.y, d = Math.hypot(dx, dy); if(d < 8 || T.stuck > .6){ const s = T.s; V52WS.tap = null; if(s && Math.hypot(s.x - m.x, s.y - m.y) < (s.r || 60) + 30) v52wsUse(s); } else { vx = dx/d; vy = dy/d; } }
    const sp = (sc.speed || 190)*dt, px = m.x, py = m.y; m.moving = !!(vx || vy);
    if(m.moving){ const nx = m.x + vx*sp, ny = m.y + vy*sp; if(v52wsWalk(nx, m.y)) m.x = nx; if(v52wsWalk(m.x, ny)) m.y = ny; if(Math.abs(vx) > .15) m.dir = vx < 0 ? -1 : 1; m.walk += dt*7*(sc.walkK || 1);
      if(V52WS.tap && Math.hypot(m.x - px, m.y - py) < sp*.2) V52WS.tap.stuck += dt; }
  }
  // npcs
  V52WS.npcs.forEach(n => v52wsNpcStep(n, dt));
  if(sc.tick) sc.tick(dt);
  // nearest usable spot
  let best = null, bd = 1e9; (sc.spots || []).forEach(s => { if(s.hide && s.hide()) return; const d = Math.hypot(s.x - m.x, s.y - m.y); if(d < (s.r || 60) && d < bd){ bd = d; best = s; } });
  V52WS.npcs.forEach(n => { if(!n.talk) return; const d = Math.hypot(n.x - m.x, n.y - m.y); if(d < 70 && d < bd){ bd = d; best = n.spot; } });
  if(best !== V52WS.near){ V52WS.near = best; v52wsActBtn(best); if(best) try { blipSfx(1500); } catch(e){} }
  // camera follows, clamped to the scene
  const z = V52WS.z, vw = V52WS.W/z, vh = (V52WS.H - 50)/z; let cx = m.x, cy = m.y - 30;
  cx = vw >= sc.w ? sc.w/2 : Math.max(vw/2, Math.min(sc.w - vw/2, cx)); cy = vh >= sc.h ? sc.h/2 - 25/z : Math.max(vh/2 - 50/z, Math.min(sc.h - vh/2, cy));
  V52WS.cam.x += (cx - V52WS.cam.x)*Math.min(1, dt*8); V52WS.cam.y += (cy - V52WS.cam.y)*Math.min(1, dt*8);
}
function v52wsNpcStep(n, dt){
  if(n.still){ n.moving = false; if(n.face) n.dir = V52WS.me.x < n.x ? -1 : 1; return; }
  if(n.pause > 0){ n.pause -= dt; n.moving = false; return; }
  if(!n.tgt){ const sc = V52WS.sc, W = n.area || [20, 20, sc.w - 20, sc.h - 20]; for(let k = 0; k < 12; k++){ const x = W[0] + Math.random()*(W[2] - W[0]), y = W[1] + Math.random()*(W[3] - W[1]); if(v52wsWalk(x, y)){ n.tgt = [x, y]; break; } } if(!n.tgt){ n.pause = 1; return; } }
  const dx = n.tgt[0] - n.x, dy = n.tgt[1] - n.y, d = Math.hypot(dx, dy), sp = (n.sp || 60)*dt;
  if(d < 6){ n.tgt = null; n.pause = 1 + Math.random()*3; n.moving = false; return; }
  const nx = n.x + dx/d*sp, ny = n.y + dy/d*sp; if(v52wsWalk(nx, ny) && Math.hypot(nx - V52WS.me.x, ny - V52WS.me.y) > 18){ n.x = nx; n.y = ny; n.moving = true; n.walk = (n.walk || 0) + dt*7; n.dir = dx < 0 ? -1 : 1; } else { n.tgt = null; n.pause = .4; n.moving = false; }
  if(n.spot){ n.spot.x = n.x; n.spot.y = n.y; }
}
// person drawn with the game's own body painter
function v52wsBody(g, a, x, y, sc, dir, moving, walk){
  withCtx(g, () => { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(sc, sc); const od = a.dir, om = a.moving, ow = a.walk; a.dir = dir; a.moving = moving; a.walk = walk;
    try { drawBody(a, false); } catch(e){ rect('#3d7bff', -6, -20, 12, 18); circ(0, -26, 6, '#f2c9a0'); } a.dir = od; a.moving = om; a.walk = ow; ctx.restore(); });
}
function v52wsDraw(dt){
  const g = V52WS.g, sc = V52WS.sc, dpr = V52WS.dpr, z = V52WS.z, W = V52WS.W, H = V52WS.H; if(!sc) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = sc.void || '#111522'; g.fillRect(0, 0, W, H); g.imageSmoothingEnabled = false;
  const ox = Math.round(W/2 - V52WS.cam.x*z), oy = Math.round(H/2 - V52WS.cam.y*z); g.setTransform(dpr*z, 0, 0, dpr*z, dpr*ox, dpr*oy);
  const key = sc.id + '|' + (sc.bgKey ? sc.bgKey() : ''); if(!V52WS.bg || V52WS.bgKey !== key){ const c = V52WS.bg && V52WS.bg.width === sc.w && V52WS.bg.height === sc.h ? V52WS.bg : document.createElement('canvas'); c.width = sc.w; c.height = sc.h; const bg = c.getContext('2d'); bg.imageSmoothingEnabled = false; bg.clearRect(0, 0, sc.w, sc.h); try { sc.bg(bg); } catch(e){ console.warn('v52s bg', e); } V52WS.bg = c; V52WS.bgKey = key; }
  g.drawImage(V52WS.bg, 0, 0);
  if(sc.under) try { sc.under(g, realT); } catch(e){}
  const sp = V52WS.sp; sp.length = 0; if(sc.sprites) try { sc.sprites(sp); } catch(e){}
  V52WS.npcs.forEach(n => sp.push({y:n.y, n}));
  const m = V52WS.me; sp.push({y:m.y, me:1});
  sp.sort((a, b) => a.y - b.y);
  const P = typeof PLAYER !== 'undefined' && PLAYER ? PLAYER : null, bs = sc.body || 2;
  for(const s of sp){ try { if(s.me){ if(P) v52wsBody(g, P, m.x, m.y, bs, m.dir, m.moving, m.walk); else { g.fillStyle = '#3d7bff'; g.fillRect(m.x - 10, m.y - 40, 20, 40); } }
    else if(s.n){ const n = s.n; v52wsBody(g, n.a, n.x, n.y, n.bs || bs, n.dir || 1, !!n.moving, n.walk || 0); if(n.prop) n.prop(g, n); }
    else if(s.f) s.f(g); } catch(e){} }
  // tap target ring, npc names when close, bubble
  if(V52WS.tap){ g.strokeStyle = 'rgba(255,210,63,.9)'; g.lineWidth = 3/z; g.beginPath(); g.ellipse(V52WS.tap.x, V52WS.tap.y, 14, 6, 0, 0, Math.PI*2); g.stroke(); }
  g.font = "700 15px Nunito, 'Be Vietnam Pro', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  V52WS.npcs.forEach(n => { if(!n.name || Math.hypot(n.x - m.x, n.y - m.y) > 150) return; const tw = g.measureText(n.name).width + 14, y = n.y - (n.bs || bs)*40 - 14; g.fillStyle = 'rgba(42,28,16,.88)'; g.fillRect(n.x - tw/2, y - 11, tw, 22); g.fillStyle = '#fff'; g.fillText(n.name, n.x, y); });
  const B = V52WS.bub; if(B && performance.now() < B.t){ const x = B.n ? B.n.x : m.x, y = (B.n ? B.n.y : m.y) - bs*40 - 40; g.font = "700 16px Nunito, sans-serif"; const words = B.text.split(' '), lines = []; let cur = '';
    words.forEach(w => { if(g.measureText(cur + ' ' + w).width > 260){ lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur);
    const w = Math.max(...lines.map(l => g.measureText(l).width)) + 22, h = lines.length*21 + 12, x0 = Math.max(V52WS.cam.x - W/2/z + 6, Math.min(V52WS.cam.x + W/2/z - w - 6, x - w/2)), y0 = y - h;
    g.fillStyle = '#fffdf5'; g.strokeStyle = '#3e2723'; g.lineWidth = 2; g.beginPath(); g.rect(x0, y0, w, h); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - 7, y0 + h); g.lineTo(x + 7, y0 + h); g.lineTo(x, y0 + h + 9); g.fill();
    g.fillStyle = '#3e2723'; lines.forEach((l, i) => g.fillText(l, x0 + w/2, y0 + 17 + i*21)); }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  if(sc.over) try { sc.over(g, realT); } catch(e){}
  // screen-space: joystick + hint
  g.setTransform(dpr, 0, 0, dpr, 0, 0); const j = V52WS.joy;
  if(j && j.on){ g.globalAlpha = .35; g.fillStyle = '#fff'; g.beginPath(); g.arc(j.x0, j.y0, 44, 0, Math.PI*2); g.fill(); g.globalAlpha = .8; g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(j.x0 + j.vx*44, j.y0 + j.vy*44, 20, 0, Math.PI*2); g.fill(); g.globalAlpha = 1; }
  if(V52WS.hint > 0){ g.globalAlpha = Math.min(1, V52WS.hint); g.font = "800 16px Nunito, sans-serif"; g.textAlign = 'center'; const t = (typeof MOB !== 'undefined' && MOB.touch) ? '👆 Kéo để đi · chạm để tương tác' : '⌨️ Mũi tên / WASD để đi · E để dùng · Esc để ra'; const tw = g.measureText(t).width + 26;
    g.fillStyle = 'rgba(10,15,34,.75)'; g.fillRect(W/2 - tw/2, H - 130, tw, 36); g.fillStyle = '#fff'; g.fillText(t, W/2, H - 106); g.textAlign = 'left'; g.globalAlpha = 1; }
}
function v52wsSay(text, n, ms){ V52WS.bub = {text, n:n || null, t:performance.now() + (ms || 4200)}; }
function v52wsNpc(name, k, x, y, o){ const a = mkAgent(Object.assign({}, STAFF_DEF[k % STAFF_DEF.length], {id:'v52n' + k, name}), k % 7, !!(o && o.student));
  if(o && o.shirt) a.shirt = o.shirt; const n = Object.assign({a, name, x, y, dir:-1, moving:false, walk:0, pause:Math.random()*2}, o || {});
  if(n.talk){ n.spot = {x, y, r:70, ic:'💬', n:'Nói chuyện với ' + name, f:() => { const L = typeof n.talk === 'function' ? n.talk() : n.talk; n.ti = ((n.ti == null ? -1 : n.ti) + 1) % L.length; v52wsSay(L[n.ti], n); n.pause = 2.5; n.tgt = null; }}; }
  return n; }

// ---------- nhà từ dữ liệu ROOM (tường, sàn, đồ nội thất) ----------
function v52wsRoomScene(o){
  const D = o.data || {wall:null, floor:null, items:[]}, T = RT, W = RC*T, Hr = RR*T, H = Hr + 70, top = RWALL*T, door = W/2;
  const items = (D.items || []).map(p => ({p, it:mallItem(p[0])})).filter(x => x.it), furn = items.filter(x => !['wall', 'floor', 'ceil'].includes(x.it.cat));
  const foot = furn.map(x => ({x0:x.p[1]*T + 4, y0:Math.max(top, x.p[2]*T + (x.it.d > 1 ? 10 : 6)), x1:(x.p[1] + x.it.w)*T - 4, y1:(x.p[2] + x.it.d)*T - 2}));
  const label = (o.owner || '').toUpperCase();
  const free = (x, y) => !foot.some(f => x > f.x0 - 8 && x < f.x1 + 8 && y > f.y0 - 4 && y < f.y1 + 10);
  const walk = (x, y) => { if(y > Hr - 8){ return Math.abs(x - door) < 34 && y < H - 6; } if(x < 18 || x > W - 18 || y < top + 22) return false; return free(x, y); };
  const spot = r => { for(let k = 0; k < 60; k++){ const x = 60 + r()*(W - 120), y = top + 60 + r()*(Hr - top - 120); if(walk(x, y) && Math.hypot(x - door, y - Hr) > 120) return [x, y]; } return [W*.3, top + 90]; };
  const rr = v52wRndS(o.seed || 7);
  const sc = {id:'room:' + (o.key || o.title), title:o.title, sub:o.sub || '🚪 Đi xuống cửa dưới để ra ngoài', w:W, h:H, start:[door, Hr + 30], body:1.9, zmin:.95, zmax:1.9, void:'#2a1d14', speed:170,
    btns:o.btns || [], walk,
    bg:g => { try { drawWallFloor(g, D.wall, D.floor, W, Hr, T, RWALL); } catch(e){ g.fillStyle = '#efe2c6'; g.fillRect(0, 0, W, top); g.fillStyle = '#a1887f'; g.fillRect(0, top, W, Hr - top); }
      const dd = x => { try { drawDecor(g, Object.assign({}, x.it, {label}), x.p[1]*T, x.p[2]*T, T, !!x.p[3]); } catch(e){} };
      items.filter(x => x.it.cat === 'wall').forEach(dd); items.filter(x => x.it.cat === 'floor').forEach(dd);
      // threshold + porch
      g.fillStyle = '#3e2723'; g.fillRect(0, Hr - 6, W, 6); g.fillStyle = '#8d6e4a'; g.fillRect(door - 40, Hr - 6, 80, 8); g.fillStyle = '#6d4c2e'; g.fillRect(door - 44, Hr, 88, H - Hr);
      g.fillStyle = '#a1887f'; for(let y = Hr + 6; y < H; y += 14) g.fillRect(door - 40, y, 80, 6); g.fillStyle = '#c62828'; g.fillRect(door - 30, Hr + 8, 60, 22);
      g.font = "800 14px Nunito, sans-serif"; g.fillStyle = '#fff8e1'; g.textAlign = 'center'; g.fillText('CỬA RA', door, Hr + 24); g.textAlign = 'left';
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, Hr, door - 44, H - Hr); g.fillRect(door + 44, Hr, W - door - 44, H - Hr); },
    sprites:sp => { furn.forEach(x => sp.push({y:(x.p[2] + x.it.d)*T - 2, f:g => { try { drawDecor(g, Object.assign({}, x.it, {label}), x.p[1]*T, x.p[2]*T, T, !!x.p[3]); } catch(e){} }})); items.filter(x => x.it.cat === 'ceil').forEach(x => sp.push({y:1e6, f:g => { try { drawDecor(g, Object.assign({}, x.it, {label}), x.p[1]*T, x.p[2]*T, T, !!x.p[3]); } catch(e){} }})); },
    spots:[{x:door, y:Hr + 44, r:46, ic:'🚪', n:'Ra ngoài', f:() => v52wsClose()}].concat(o.spots || []),
    npcs:[], onClose:o.onClose};
  (o.people || []).forEach((p, i) => { const [x, y] = spot(rr); sc.npcs.push(v52wsNpc(p.name, p.k != null ? p.k : i + 2, x, y, {talk:p.talk, area:[40, top + 40, W - 40, Hr - 30], sp:34, still:p.still, face:true})); });
  if(!items.length) sc.sub = '🏠 Phòng còn trống · bấm 🛠 để trang trí';
  return sc;
}
function v52wRndS(s){ s = (s >>> 0) % 2147483646 + 1; return () => (s = (s*16807) % 2147483647)/2147483647; }
const V52WS_TALK = ['Chào cháu! Vào chơi, cứ tự nhiên như ở nhà nhé.', 'Mỗi ngày đọc 10 trang sách, một năm được cả chục cuốn đấy!', 'Cháu có biết? Cây xanh hút khí CO₂ và nhả ra khí O₂ cho chúng ta thở.', 'Nhớ uống đủ nước: khoảng 6–8 cốc mỗi ngày.', 'Một khối Rubik 3×3 có hơn 43 tỷ tỷ cách xáo trộn!', 'Đi ra ngoài nhớ chào hỏi lễ phép nhé cháu.', 'Ở làng mình, ai cũng giúp nhau gặt lúa vào mùa thu.', 'Trái Đất quay quanh Mặt Trời hết khoảng 365 ngày, đó là một năm.'];
// nhà phố người chơi: bước vào và đi lại bên trong (thay cho mở bảng)
function v52wPlotScene(i){
  const s = STREET[i]; if(!s) return false; const own = s.kind === 'home' || s.kind === 'shop';
  if(own && !PROF){ try { openLogin(); } catch(e){} return true; }
  let data = null, title = s.name, btns = [], spots = [], people = [];
  if(s.kind === 'home'){ data = homeData(); btns.push({ic:'🛠', n:'Trang trí nhà', f:() => { v52wsClose(); openRoom('home'); }}); people.push({name:'Mẹ', k:3, talk:['Con về rồi à? Rửa tay rồi nghỉ ngơi nhé!', 'Vào TTTM Cầu Vồng mua đồ trang trí cho phòng con đi.', 'Con giỏi lắm, hôm nay học được gì mới?']}); }
  else if(s.kind === 'shop'){ data = shopData(); btns.push({ic:'🛠', n:'Sắp xếp cửa hàng', f:() => { v52wsClose(); openRoom('shop'); }}); }
  else if(s.kind === 'pshop'){ const d = s.data; data = {name:d.n || d.o, wall:d.wall || null, floor:d.floor || null, items:parseJ(d.items, [])};
    spots.push({x:RC*RT - 110, y:RWALL*RT + 70, r:80, ic:'🛒', n:'Xem hàng của ' + (d.o || 'chủ quán'), f:() => { v52wsClose(); visitShop(d, data); }}); people.push({name:d.o || 'Chủ quán', k:5, still:true, talk:['Chào bạn! Bấm 🛒 để xem hàng nhé.']}); }
  else if(s.kind === 'phome'){ const d = s.data; data = {name:d.o, wall:d.wall || null, floor:d.floor || null, items:parseJ(d.items, [])}; }
  else { data = Object.assign({name:s.owner}, demoRoom(s.seed)); people.push({name:s.owner, k:(s.seed || 1) % 9, talk:V52WS_TALK}); }
  v52wsOpen(v52wsRoomScene({key:'plot' + i + s.kind, title:'🏠 ' + title, data, owner:s.owner || (PROF && PROF.name), btns, spots, people, seed:i*97 + 3}));
  try { mprog('visit'); } catch(e){}
  return true;
}
// nhà dân ở làng Gió Xanh
function v52wVillageHouse(h){
  let data = null; try { data = Object.assign({name:h.name}, demoRoom(h.seed)); } catch(e){ data = {wall:null, floor:null, items:[]}; }
  const owner = h.name.replace(/^Nhà /, ''), r = v52wRndS(h.seed), people = [{name:owner, k:h.i + 1, talk:V52WS_TALK.slice(Math.floor(r()*3)).concat(V52WS_TALK.slice(0, 2))}];
  if(r() < .6) people.push({name:['Bé Na', 'Bé Bin', 'Bé Su', 'Bé Tôm'][h.i % 4], k:h.i + 5, talk:['Anh/chị chơi Rubik với em không?', 'Em mới học bảng cửu chương 7 đó!', 'Nhà em có con mèo tên Mướp.']});
  v52wsOpen(v52wsRoomScene({key:'vh' + h.i, title:'🏡 ' + h.name, sub:'Làng Gió Xanh · 🚪 ra cửa dưới', data, owner, people, seed:h.seed}));
  try { mprog('visit'); } catch(e){}
}
function v52wsInit(){
  // phố người chơi: bước vào nhà thay vì mở bảng
  const ep0 = enterPlot; enterPlot = function(i){ try { if(v52wPlotScene(i)) return; } catch(e){ console.warn('v52w plot', e); } return ep0(i); };
  // bảng trang trí nhà: thêm nút "Đi vào nhà"
  const head = document.querySelector('#mRoom .mhead'); if(head && !document.getElementById('v52wsWalkBtn')){ const b = v52wsEl('button', '', '🚶 Đi vào nhà'); b.type = 'button'; b.id = 'v52wsWalkBtn'; b.className = 'v52walkbtn';
    b.onclick = () => { const D = ROOM.data; if(!D) return; const t = ($('#roomT') && $('#roomT').textContent) || 'Ngôi nhà'; try { hideModal(); } catch(e){ const m = $("#mRoom"); if(m) m.hidden = true; }
      v52wsOpen(v52wsRoomScene({key:'room-' + ROOM.mode + t, title:'🏠 ' + t, data:D, owner:ROOM.owner || (PROF && PROF.name), btns:ROOM.readonly ? [] : [{ic:'🛠', n:'Trang trí', f:() => { v52wsClose(); openRoom(ROOM.mode === 'shop' ? 'shop' : 'home'); }}]})); };
    const cl = head.querySelector('.mclose'); head.insertBefore(b, cl); }
  // world is hidden behind the scene: skip drawing it
  const cov0 = v39Covered; v39Covered = function(){ return V52WS.open || cov0(); };
}
