// ================= EXT49 (v44 · Session 1+2): full-screen mini games with a slim top bar (mode icons · ⏸ · ? · ✕),
// "Play again" only at the end, a blurred live copy of the game as the background; easy-to-read fonts; movement by
// dragging only (no tap-to-walk), no fences, balloons only at the Balloon Field, cleaner HUD and fewer words on the map =================
const V44 = {lamp:null};
// ---------- 1. readable fonts on every canvas (VT323 pixel text → Nunito ExtraBold) ----------
(function(){ const P = CanvasRenderingContext2D.prototype, d = Object.getOwnPropertyDescriptor(P, 'font'); if(!d || !d.set) return; const cache = new Map();
  const conv = v => { let o = cache.get(v); if(o) return o; o = v.replace(/^(?:bold\s+)?(\d+(?:\.\d+)?)px\s+VT323(?:\s*,\s*monospace)?$/, (m, n) => `800 ${Math.max(9, Math.round(n*.86))}px Nunito, system-ui, sans-serif`); if(cache.size < 600) cache.set(v, o); return o; };
  Object.defineProperty(P, 'font', {configurable:true, get:d.get, set(v){ d.set.call(this, conv(String(v))); }}); })();
// ---------- 2. mini games: full screen ----------
const V44_ICONS = [[/hoàng hôn|sunset/i, '🌇'], [/đêm|night/i, '🌙'], [/ngày|day|sáng/i, '☀️'], [/dễ|easy/i, '🟢'], [/vừa|thường|normal/i, '🟡'], [/khó|hard/i, '🔴'], [/2 người|hai người|2p|đôi/i, '👥'], [/máy|solo|1 người|ai\b/i, '🤖'], [/tự do|free/i, '🕊️'], [/đua|race|thi/i, '🏁'], [/luyện|practice|tập/i, '🎯'], [/tuyết|snow/i, '❄️'], [/biển|sea/i, '🌊']];
const v44Icon = t => { for(const [re, ic] of V44_ICONS) if(re.test(t)) return ic; return t.trim().slice(0, 2); };
function v44ArcUI(){
  const m = $('#mArcade'); if(!m || m.querySelector('#v44Bar')) return;
  const bar = document.createElement('div'); bar.id = 'v44Bar'; bar.innerHTML = '<div class="v44modes"></div><div class="v44r"><button type="button" class="v44b" data-k="pause" aria-label="Pause">⏸</button><button type="button" class="v44b" data-k="help" aria-label="How to play">?</button><button type="button" class="v44b" data-k="close" aria-label="Close">✕</button></div>';
  const bg = document.createElement('canvas'); bg.id = 'v44Bg'; bg.width = 160; bg.height = 90; bg.setAttribute('aria-hidden', 'true');
  const again = document.createElement('button'); again.type = 'button'; again.id = 'v44Again'; again.hidden = true; again.textContent = '↻ Play again';
  const help = document.createElement('div'); help.id = 'v44Help'; help.hidden = true; help.setAttribute('role', 'dialog');
  const rot = document.createElement('div'); rot.id = 'v44Rot'; rot.hidden = true; rot.textContent = '📱↻ Xoay ngang để chơi to hơn';
  const wrap = m.querySelector('.arcwrap'); wrap.prepend(bg); m.appendChild(bar); wrap.appendChild(again); m.appendChild(help); m.appendChild(rot);
  bar.querySelector('[data-k=pause]').onclick = () => { $('#arcPause').click(); bar.querySelector('[data-k=pause]').textContent = ARC.paused ? '▶' : '⏸'; };
  bar.querySelector('[data-k=help]').onclick = () => { help.hidden = !help.hidden; if(!help.hidden){ help.innerHTML = '<b></b><p></p><p class="v44tip"></p>'; help.querySelector('b').textContent = ARC.g ? ARC.g.title : 'Mini game'; help.querySelector('p').textContent = ARC.g ? ARC.g.help : ''; help.querySelector('.v44tip').textContent = MOB.touch ? '👆 Vuốt để di chuyển · Chạm để nhảy/sút · Giữ để lấy lực · Chạm 2 ngón = chiêu B' : '⌨️ Phím mũi tên / WASD · Space = nhảy, sút · X = chiêu B'; } };
  help.onclick = () => { help.hidden = true; };
  bar.querySelector('[data-k=close]').onclick = () => hideModal();
  again.onclick = () => { again.hidden = true; arcNew(); bar.querySelector('[data-k=pause]').textContent = '⏸'; };
}
function v44Modes(){ const box = $('#v44Bar .v44modes'); if(!box) return; box.innerHTML = ''; $('#arcOpts').querySelectorAll('button').forEach((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v44b v44mode'; b.textContent = v44Icon(o.textContent); b.title = o.textContent; b.setAttribute('aria-label', o.textContent); b.setAttribute('aria-pressed', o.getAttribute('aria-pressed')); b.onclick = () => { o.click(); v44Modes(); $('#v44Again').hidden = true; }; box.appendChild(b); }); box.hidden = box.childElementCount < 2; }
function v44Fit(){ const cv = $('#arcCv'); if(!cv) return; const W = innerWidth, H = innerHeight, port = H > W, side = !port && MOB.touch, top = side ? 0 : 64, sideW = side ? 116 : 0, s = Math.min((W - sideW)/AW, (H - top)/AH); document.body.classList.toggle('v44side', side); cv.style.width = Math.floor(AW*s) + 'px'; cv.style.height = Math.floor(AH*s) + 'px'; const r = $('#v44Rot'); if(r){ if(port && MOB.touch && !V44.rotSeen){ V44.rotSeen = 1; r.hidden = false; clearTimeout(V44.rotT); V44.rotT = setTimeout(() => { r.hidden = true; }, 3200); } else if(!port) r.hidden = true; } }
function v44ArcTick(){ if(!openModal || openModal.id !== 'mArcade'){ V44.raf = 0; return; }
  const bg = $('#v44Bg'), cv = $('#arcCv'); if(bg && cv){ try { bg.getContext('2d').drawImage(cv, 0, 0, 160, 90); } catch(e){} }
  const a = $('#v44Again'); if(a){ const over = !!(ARC.s && ARC.s.over); if(a.hidden === over) a.hidden = !over; }
  V44.raf = requestAnimationFrame(v44ArcTick); }
function v44Arcade(){
  v44ArcUI(); const oa = openArcade; openArcade = function(id, opt){ const r = oa.apply(this, arguments); document.body.classList.add('v44arc'); v44Modes(); v44Fit(); $('#v44Again').hidden = true; $('#v44Help').hidden = true; $('#v44Bar [data-k=pause]').textContent = '⏸'; cancelAnimationFrame(V44.raf); V44.raf = requestAnimationFrame(v44ArcTick); return r; };
  const hb = hideModal; hideModal = function(){ const r = hb.apply(this, arguments); setTimeout(() => { if(!openModal || openModal.id !== 'mArcade') document.body.classList.remove('v44arc'); }, 0); return r; };
  addEventListener('resize', () => { if(document.body.classList.contains('v44arc')) v44Fit(); });
  // the end-of-game card no longer says 'press "Chơi lại"' — the Play again button appears instead
  const ov = overlay; overlay = function(c, t1, t2){ return ov.call(this, c, t1, String(t2 == null ? '' : t2).replace(/\s*·?\s*Bấm "Chơi lại"/g, '') || ' '); };
  // hot-air balloon: slower, calmer, smoother (everything at 60% speed)
  if(GAMES.balloon){ const bu = GAMES.balloon.update; GAMES.balloon.update = function(s, dt){ return bu.call(this, s, dt*.6); }; }
}
// every other game window: full screen on every device, instructions only behind "?"
const V44_FS = /^(mArcade|mHouse|mChess|mRubik|mFish|mFishDeep|mCaro|mGo|mPaint|mLab|mOly|mMusic|mFarm|mZen|mSudoku|mMemory|mMath|mOAQ|mMissile|mObs|mGarden|mScope|mC4|mWatch|mChessLearn|mLib|mAcad|mHall|mKart|mLobby)$/;
function v44Windows(){
  try { v38Guide = function(){}; } catch(e){}
  try { const mg = mghShow; mghShow = function(id){ try { const s = JSON.parse(localStorage.getItem(MGH_SEEN) || '{}'); s[id] = 1; localStorage.setItem(MGH_SEEN, JSON.stringify(s)); } catch(e){} return mg.apply(this, arguments); }; } catch(e){}
  const sm = showModal; showModal = function(id){ const r = sm.apply(this, arguments); if(V44_FS.test(id)){ document.body.classList.add('v44fs'); const m = $('#' + id); if(m && id !== 'mArcade' && !m.querySelector('.v44q') && m.querySelector('.legend')){ const h = m.querySelector('.mhead'), x = h && h.querySelector('.mclose'); if(h){ const q = document.createElement('button'); q.type = 'button'; q.className = 'v44q'; q.textContent = '?'; q.setAttribute('aria-label', 'Hướng dẫn'); q.onclick = () => m.classList.toggle('v44help'); h.insertBefore(q, x); } } } return r; };
  const hb = hideModal; hideModal = function(){ const r = hb.apply(this, arguments); setTimeout(() => { if(!document.querySelector('.modal:not([hidden])')) document.body.classList.remove('v44fs'); document.querySelectorAll('.modal.v44help').forEach(m => m.classList.remove('v44help')); }, 0); return r; };
}
// ---------- 3. world: drag to move only, open paths, balloons at the Balloon Field ----------
function v44World(){
  // tap: only uses a door/person right next to you; never walks you somewhere
  v32Tap = function(wx, wy){ if(!PLAYER || !PLAYER.visible){ openLogin(); return; } if(down(PLAYER)){ v25StandUp(PLAYER); return; }
    const d = v32Target(wx, wy); if(d && Math.hypot(d.x - PLAYER.x, d.y - PLAYER.y) < 120){ try { d.f(); } catch(e){} } };
  // no fences: the school yard opens onto every road; buildings keep their walls and doors
  canMove = function(ox, oy, nx, ny){
    if(!gateOK(ox, oy, nx, ny)) return false; if(nx < 4 || nx > W - 4 || ny < NY + 20) return false; if(ny > (onPier(nx, ny) ? 978 : 1010)) return false;
    for(const id of ['rubik', 'chess', 'music', 'hall', 'office', 'elec']){ const r = R[id]; if(inside(r, ox, oy) !== inside(r, nx, ny) && dist(nx, ny, r.dw[0], r.dw[1]) > 26) return false; }
    return true; };
  // bikes stay on land (no more riding over the sea)
  const eu = extUpdate; extUpdate = function(dt){ eu(dt); const P = PLAYER; if(P && P.cycling && !P.boat && P.y > 878){ P.y = 870; P._gx = P._gy = 0; } };
  // fewer words: no arrow+label toward wildlife, short name tags only
  try { drawWevGuide = function(){}; } catch(e){}
  v36Sprites = function(sp){ for(const h of V36.hosts){ if(!inVB(h.x, h.y)) continue; sp.push({y:h.y, f:() => { const P = PLAYER; if(P && P.visible) h.dir = P.x < h.x ? -1 : 1; drawPerson(h);
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const bob = Math.sin(realT*3 + h.idx)*2;
      if(v36Near(h, 130)){ ctx.font = '15px VT323, monospace'; const t = h.name, w = ctx.measureText(t).width + 14; ctx.fillStyle = 'rgba(15,21,48,.86)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(h.x - w/2, h.y - 64, w, 18, 9) : ctx.rect(h.x - w/2, h.y - 64, w, 18); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(t, h.x, h.y - 55); }
      else { ctx.font = '18px VT323, monospace'; ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#0a0f22'; ctx.lineWidth = 3; ctx.strokeText('!', h.x, h.y - 58 + bob); ctx.fillText('!', h.x, h.y - 58 + bob); }
      ctx.restore(); }}); } };
  // academy: each pad opens its game straight away (no in-between menu)
  const vd = v36Doors; v36Doors = function(d){ vd(d); const r = R.academy; if(r){
      [['Sudoku', () => { showModal('mSudoku'); if(!SDK.g) sdkNew(1); else sdkDraw(); }], ['Toán nhanh', () => openMath('solo')], ['Lật thẻ nhớ', () => { showModal('mMemory'); memNew(); }]].forEach(([n, f], k) => d.push({x:r.x + 140 + k*180, y:r.y + 350, n:n + ' · chơi ngay', f}));
      d.push({x:r.x + 160, y:r.y + 200, n:'Phòng Rubik · chơi ngay', f:() => openLab('3')}, {x:r.x + 496, y:r.y + 200, n:'Học cờ vua · chơi ngay', f:() => openChessSchool(0)}); }
    const b = R.bpad; if(b) d.push({x:b.x + b.w/2, y:b.y + b.h - 18, n:'Bay khinh khí cầu', f:() => flyToggle()}); };
  // hot-air balloons only from the Balloon Field — balloons stand in a ring there
  const ft = flyToggle; flyToggle = function(){ const P = PLAYER, b = R.bpad; if(P && !P.v16fly && b && !(P.x > b.x - 90 && P.x < b.x + b.w + 90 && P.y > b.y - 90 && P.y < b.y + b.h + 120)){ toast('🎈 Ra Khu khinh khí cầu để bay nhé!'); return; } return ft.apply(this, arguments); };
  const es = extSprites; extSprites = function(sp){ es(sp); const b = R.bpad; if(!b || !inVB(b.x + b.w/2, b.y + b.h/2)) return; const cx = b.x + b.w/2, cy = b.y + b.h/2 + 6, cs = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#b06bff', '#ff6f91', '#00bcd4'];
    for(let i=0;i<8;i++){ const a = i/8*Math.PI*2, x = cx + Math.cos(a)*230, y = cy + Math.sin(a)*52; sp.push({y, f:() => v44Balloon(x, y, cs[i], i)}); } };
}
function v44Balloon(x, y, c, i){ const by = y - 58 + Math.sin(realT*1.2 + i)*3; ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 14, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, by, 20, 24, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 3, by - 23, 6, 46); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(x - 7, by - 8, 5, 9, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 12, by + 18); ctx.lineTo(x - 5, y - 10); ctx.moveTo(x + 12, by + 18); ctx.lineTo(x + 5, y - 10); ctx.stroke(); rect('#8d6e4a', x - 6, y - 10, 12, 9); rect('#6d4c2e', x - 6, y - 10, 12, 2); }
// ---------- 4. HUD: menu under the profile card, no Coach / Boat / Fly buttons, oil-lamp button ----------
function v44Hud(){
  const place = () => { const p = $('#prof'); if(!p) return; const r = p.getBoundingClientRect(), s = $('#stage').getBoundingClientRect(); if(r.height) document.documentElement.style.setProperty('--v44mt', Math.round(r.bottom - s.top + 10) + 'px'); };
  place(); setInterval(place, 700); addEventListener('resize', place);
  const lamp = document.createElement('button'); lamp.type = 'button'; lamp.id = 'v44Lamp'; lamp.className = 'v41b'; lamp.setAttribute('aria-label', 'Cầm hoặc cất đèn dầu'); lamp.innerHTML = '<span class="ic">🏮</span><small>Lamp</small>';
  const sync = () => { const on = SETTINGS.lantern !== false; lamp.classList.toggle('on', on); lamp.setAttribute('aria-pressed', on); lamp.querySelector('small').textContent = on ? 'Lamp on' : 'Lamp'; };
  lamp.onclick = e => { e.stopPropagation(); SETTINGS.lantern = SETTINGS.lantern === false; try { setSave(); } catch(err){} sync(); toast(SETTINGS.lantern ? '🏮 Đã cầm đèn dầu (sáng khi trời tối)' : 'Đã cất đèn dầu'); };
  const add = () => { const col = $('#v41Col'); if(!col){ setTimeout(add, 500); return; } col.prepend(lamp); sync(); };
  add();
  setInterval(() => { const P = PLAYER, f = $('#v41Fly'), b = $('#v41Boat'); if(f) f.hidden = !(P && P.v16fly); if(b) b.hidden = !(P && P.boat); }, 300);
}
function v44Init(){ v44Arcade(); v44Windows(); v44World(); v44Hud(); }
