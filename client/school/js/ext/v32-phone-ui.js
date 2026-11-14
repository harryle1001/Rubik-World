// ================= EXT37 (v32): clean phone play screen, tap a building to go in, A* navigation, fast tourist map,
// no-scroll grid Menu, canvas logo, control hints for mini games =================
const V32 = {phone:false, idleT:0, walk:null, nav:null, navT:0, logo:null, joyFloat:false, menuOpen:false, mapOpen:false};
const v32Phone = () => MOB.touch && Math.min(innerWidth, innerHeight) <= 900;
// ---------- 6. logo (drawn once, reused as image) ----------
function v32Logo(){
  if(V32.logo) return V32.logo; const c = document.createElement('canvas'), W0 = 720, H0 = 260; c.width = W0; c.height = H0; const g = c.getContext('2d');
  const col = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b'];
  const cx = 130, cy = 140, s = 26, iso = (x, y, z) => [cx + (x - y)*s*.87, cy + (x + y)*s*.5 - z*s];
  const face = (pts, fill) => { g.fillStyle = fill; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.strokeStyle = '#0a0f22'; g.lineWidth = 3; g.stroke(); };
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, cy + 92, 90, 18, 0, 0, Math.PI*2); g.fill();
  for(let i=0;i<3;i++) for(let j=0;j<3;j++){ face([iso(i, j, 3), iso(i + 1, j, 3), iso(i + 1, j + 1, 3), iso(i, j + 1, 3)], col[(i + j*2) % 6]); // top
    face([iso(3, i, 3 - j), iso(3, i + 1, 3 - j), iso(3, i + 1, 2 - j), iso(3, i, 2 - j)], col[(i + j + 2) % 6]); // right
    face([iso(i, 3, 3 - j), iso(i + 1, 3, 3 - j), iso(i + 1, 3, 2 - j), iso(i, 3, 2 - j)], col[(i*2 + j + 4) % 6]); } // left
  const [rx, ry] = iso(1.5, 1.5, 3); g.fillStyle = '#b71c1c'; g.beginPath(); g.moveTo(rx - 34, ry - 4); g.lineTo(rx, ry - 34); g.lineTo(rx + 34, ry - 4); g.closePath(); g.fill(); g.strokeStyle = '#0a0f22'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#fff8e1'; g.fillRect(rx - 22, ry - 6, 44, 12); g.strokeRect(rx - 22, ry - 6, 44, 12); g.fillStyle = '#5d4037'; g.fillRect(rx - 4, ry - 4, 8, 10); g.fillStyle = '#0a0f22'; g.fillRect(rx - 1, ry - 58, 2, 26); g.fillStyle = '#ef4b4b'; g.fillRect(rx + 1, ry - 58, 16, 10);
  g.textBaseline = 'middle'; g.font = '46px Bungee, "Arial Black", sans-serif';
  [['THE RUBIK', 104], ['SCHOOL', 164]].forEach(([t, y], k) => { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillText(t, 262, y + 6); g.lineWidth = 9; g.strokeStyle = '#0a0f22'; g.strokeText(t, 256, y); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 4; g.fillStyle = k ? '#E8C27A' : '#F7F5EF'; g.fillText(t, 256, y); g.shadowColor = 'transparent'; });
  V32.logo = c.toDataURL('image/png'); return V32.logo;
}
// ---------- 4. A* navigation on a walkable grid built once from the game's own movement rules ----------
const NAVG = {C:24, x0:0, y0:-530, y1:1000, cols:0, rows:0, ok:null, g:null, f:null, from:null, heap:null, closed:null};
function navBuild(){
  if(NAVG.ok) return; NAVG.cols = Math.ceil(W/NAVG.C); NAVG.rows = Math.ceil((NAVG.y1 - NAVG.y0)/NAVG.C); const n = NAVG.cols*NAVG.rows;
  NAVG.ok = new Uint8Array(n); NAVG.g = new Float32Array(n); NAVG.f = new Float32Array(n); NAVG.from = new Int32Array(n); NAVG.closed = new Uint8Array(n); NAVG.heap = new Int32Array(n*4);
  for(let j=0;j<NAVG.rows;j++) for(let i=0;i<NAVG.cols;i++){ const x = i*NAVG.C + NAVG.C/2, y = NAVG.y0 + j*NAVG.C + NAVG.C/2; NAVG.ok[j*NAVG.cols + i] = canMove(x, y, x, y) ? 1 : 0; }
}
const navXY = k => [(k % NAVG.cols)*NAVG.C + NAVG.C/2, NAVG.y0 + Math.floor(k/NAVG.cols)*NAVG.C + NAVG.C/2];
const onLandBand = (x, y) => y > NY + 20 && y < 1005 && x > 4 && x < W - 4;
function navCell(x, y){ let i = Math.max(0, Math.min(NAVG.cols - 1, Math.floor(x/NAVG.C))), j = Math.max(0, Math.min(NAVG.rows - 1, Math.floor((y - NAVG.y0)/NAVG.C)));
  for(let r=0;r<6;r++) for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ const ii = i + di, jj = j + dj; if(ii < 0 || jj < 0 || ii >= NAVG.cols || jj >= NAVG.rows) continue; if(NAVG.ok[jj*NAVG.cols + ii]) return jj*NAVG.cols + ii; } return -1; }
function navLine(ax, ay, bx, by){ const d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d/12)); let px = ax, py = ay; for(let k=1;k<=n;k++){ const x = ax + (bx - ax)*k/n, y = ay + (by - ay)*k/n; if(!canMove(px, py, x, y)) return false; px = x; py = y; } return true; }
function navFind(sx, sy, tx, ty){
  if(!onLandBand(sx, sy) || !onLandBand(tx, ty)) return [[tx, ty]];
  navBuild(); const s = navCell(sx, sy), t = navCell(tx, ty); if(s < 0 || t < 0) return [[tx, ty]];
  const {cols, g, f, from, closed, heap} = NAVG, n = cols*NAVG.rows; g.fill(1e9); closed.fill(0); let hn = 0; const [txc, tyc] = navXY(t);
  const push = k => { let i = hn++; heap[i] = k; while(i > 0){ const p = (i - 1) >> 1; if(f[heap[p]] <= f[heap[i]]) break; const tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp; i = p; } };
  const pop = () => { const top = heap[0]; heap[0] = heap[--hn]; let i = 0; for(;;){ const l = i*2 + 1, r = l + 1; let m = i; if(l < hn && f[heap[l]] < f[heap[m]]) m = l; if(r < hn && f[heap[r]] < f[heap[m]]) m = r; if(m === i) break; const tmp = heap[m]; heap[m] = heap[i]; heap[i] = tmp; i = m; } return top; };
  g[s] = 0; f[s] = Math.hypot(txc - sx, tyc - sy); from[s] = -1; push(s); let found = false, it = 0;
  while(hn && it++ < 60000){ const k = pop(); if(closed[k]) continue; closed[k] = 1; if(k === t){ found = true; break; } const [kx, ky] = navXY(k), ki = k % cols, kj = (k - ki)/cols;
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ if(!di && !dj) continue; const ii = ki + di, jj = kj + dj; if(ii < 0 || jj < 0 || ii >= cols || jj >= NAVG.rows) continue; const q = jj*cols + ii; if(!NAVG.ok[q] || closed[q]) continue;
      const [qx, qy] = navXY(q); if(!canMove(kx, ky, qx, qy)) continue; const road = (qy > 680 && qy < 736) ? .6 : 1, ng = g[k] + Math.hypot(di, dj)*NAVG.C*road;
      if(ng < g[q] && hn < heap.length - 8){ g[q] = ng; from[q] = k; f[q] = ng + Math.hypot(txc - qx, tyc - qy)*.6; push(q); } } }
  if(!found) return [[tx, ty]];
  const raw = []; for(let k = t; k >= 0; k = from[k]) raw.push(navXY(k)); raw.reverse(); raw.push([tx, ty]);
  const out = []; let ax = sx, ay = sy, i = 0; // string pulling: skip points we can see past
  while(i < raw.length){ let j = raw.length - 1; while(j > i && !navLine(ax, ay, raw[j][0], raw[j][1])) j--; out.push(raw[j]); ax = raw[j][0]; ay = raw[j][1]; i = j + 1; }
  return out;
}
// one navigation system for the map, events, "Tự đi tới…" and taps
function v32Nav(x, y, name, walk, onArrive){
  const me = PLAYER && PLAYER.visible ? PLAYER : null; const pts = me ? navFind(me.x, me.y, x, y) : [[x, y]];
  GUIDE = {x, y, pts, name: name || placeName(x, y)}; V32.nav = {x, y, name:GUIDE.name, onArrive, t:realT};
  if(walk && me) v32Walk(pts, x, y, GUIDE.name); try { mprog('map'); } catch(e){}
}
function v32Walk(pts, x, y, name){
  const P = PLAYER; if(!P) return; if(P.boat) leaveBoat(P); if(P.mount) dismount(P, true); if(P.v16fly) return;
  P.controlled = false; P.planKey = 'auto'; P.queue = []; P.cur = null; P.path = pts.map(p => [p[0], p[1]]); P.speed = P.cycling ? 170 : 95;
  P.autoDest = ['v32', name, x, y]; select(P, false); followCam = true; V32.walk = {x, y, name};
}
function v32NavTick(){
  const N = V32.nav; if(!N || !GUIDE || !PLAYER || !PLAYER.visible) { $('#v32Nav').hidden = true; $('#v32Arrow').hidden = true; return; }
  const P = PLAYER, pts = GUIDE.pts; while(pts.length > 1 && Math.hypot(pts[0][0] - P.x, pts[0][1] - P.y) < 30) pts.shift();
  const dT = Math.hypot(N.x - P.x, N.y - P.y);
  if(dT < 46){ const cb = N.onArrive; toast(`Đã tới ${N.name} 🎉`); blipSfx(1320); GUIDE = null; V32.nav = null; V32.walk = null; $('#v32Nav').hidden = true; $('#v32Arrow').hidden = true; if(cb) setTimeout(cb, 120); return; }
  // off the route by more than 3 cells: find the way again
  if(realT - N.t > 1.2 && pts.length && onLandBand(P.x, P.y)){ const a = pts[0], dseg = Math.hypot(a[0] - P.x, a[1] - P.y); if(dseg > 3*NAVG.C*4 && !V32.walk){ N.t = realT; GUIDE.pts = navFind(P.x, P.y, N.x, N.y); } }
  // instruction card
  let total = 0, px = P.x, py = P.y; pts.forEach(([x, y]) => { total += Math.hypot(x - px, y - py); px = x; py = y; });
  const p0 = pts[0], p1 = pts[1]; let turn = '↑ Đi thẳng', dm = Math.round(Math.hypot(p0[0] - P.x, p0[1] - P.y)/8);
  if(p1){ const ax = p0[0] - P.x, ay = p0[1] - P.y, bx = p1[0] - p0[0], by = p1[1] - p0[1], cr = ax*by - ay*bx, ang = Math.abs(Math.atan2(cr, ax*bx + ay*by)); if(ang > .5) turn = cr > 0 ? '↱ Rẽ phải' : '↰ Rẽ trái'; }
  else turn = '◎ Điểm đến';
  const mins = Math.max(1, Math.round(total/140/60)); const el = $('#v32Nav'); el.hidden = false; el.querySelector('b').textContent = `${turn}${p1 ? ' sau ' + dm + 'm' : ' ' + dm + 'm'}`; el.querySelector('span').textContent = `${N.name} · ${Math.round(total/8)}m · ${mins} phút`;
  // compass arrow on the screen edge when the destination is off-screen
  const sx = (N.x - cam.x)*cam.z + cw/2, sy = (N.y - cam.y)*cam.z + ch/2, ar = $('#v32Arrow');
  if(sx < 20 || sx > cw - 20 || sy < 20 || sy > ch - 20){ const a = Math.atan2(sy - ch/2, sx - cw/2), R0 = Math.min(cw, ch)/2 - 40; ar.hidden = false; ar.style.left = (cw/2 + Math.cos(a)*Math.min(cw/2 - 34, R0*1.6) ) + 'px'; ar.style.top = Math.max(110, Math.min(ch - 40, ch/2 + Math.sin(a)*Math.min(ch/2 - 34, R0*1.6))) + 'px'; ar.style.transform = `translate(-50%,-50%) rotate(${a}rad)`; }
  else ar.hidden = true;
}
// ---------- 2. tap the map: walk there, or walk to a building's door and go in ----------
function v32Target(wx, wy){
  const doors = DOORS(); let best = null, bd = 80; doors.forEach(d => { const dd = Math.hypot(d.x - wx, d.y - wy); if(dd < bd){ bd = dd; best = d; } }); if(best) return best;
  for(const h of HOUSES) if(wx >= h.x && wx <= h.x + h.w && wy >= h.y && wy <= h.y + h.h){ const d = doors.find(q => Math.abs(q.x - (h.x + h.w/2)) < 4 && Math.abs(q.y - (h.y + h.h + 6)) < 8); if(d) return d; }
  for(const k in R){ const r = R[k]; if(!r || !r.w || r.w*r.h > 1.6e6 || wx < r.x || wx > r.x + r.w || wy < r.y || wy > r.y + r.h) continue; const ref = r.dout || [r.x + r.w/2, r.y + r.h]; let bb = null, b2 = 260; doors.forEach(d => { const dd = Math.hypot(d.x - ref[0], d.y - ref[1]); if(dd < b2){ b2 = dd; bb = d; } }); if(bb) return bb; }
  return null;
}
function v32Tap(wx, wy){
  if(!PLAYER || !PLAYER.visible){ openLogin(); return; } if(down(PLAYER)){ v25StandUp(PLAYER); return; }
  const d = v32Target(wx, wy);
  if(d){ const nm = d.n.split('·')[0].trim(); V32.door = d; v32Nav(d.x, d.y, nm, true, () => { try { d.f(); } catch(e){} V32.door = null; }); }
  else { V32.door = null; v32Nav(wx, wy, 'Điểm đã chọn', true); }
}
function v32TapInit(){
  let st = null; cvs.addEventListener('pointerdown', e => { if(!V32.phone || e.pointerType === 'mouse') return; st = {x:e.clientX, y:e.clientY, t:performance.now(), id:e.pointerId}; v32Wake(); }, true);
  cvs.addEventListener('pointermove', e => { if(st && e.pointerId === st.id && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 10) st = null; }, true);
  cvs.addEventListener('pointerup', e => { if(!st || e.pointerId !== st.id) return; const ok = performance.now() - st.t < 250; st = null; if(!ok || MOB.pins.size > 1) return; const r = cvs.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top);
    const hot = HOTSPOTS.concat(XHOT).find(h => inside(h.r, wx, wy)); if(hot){ if(!PLAYER || !PLAYER.visible){ hot.f(wx, wy); return; } V32.door = {x:wx, y:wy, n:placeName(wx, wy)}; v32Nav(wx, wy, V32.door.n, true, () => { V32.door = null; hot.f(wx, wy); }); return; } v32Tap(wx, wy); }, true);
}
// world labels: destination building + "Chạm để vào" over a nearby door
function v32Sprites(sp){
  if(!V32.phone) return; sp.push({y:1e9 - 2, f:() => {
    if(V32.door && V32.nav){ const d = V32.door; plate(d.n.split('·')[0].trim() + ' · Đang đi tới…', d.x, d.y - 70 - Math.abs(Math.sin(realT*3))*6); }
    if(typeof NEAR_DOOR !== 'undefined' && NEAR_DOOR && !V32.nav){ const d = NEAR_DOOR, y = d.y - 58 - Math.sin(realT*4)*3; plate('👆 Chạm để vào', d.x, y); }
  }});
}
// ---------- 1. clean phone screen: icon buttons, small joystick, explore fade ----------
function v32Wake(){ V32.idleT = 0; stage.classList.remove('v32idle'); }
function v32Sheet(which){ const m = $('#mtrack'), l = $('#mlog'); const tgt = which === 'm' ? m : l, other = which === 'm' ? l : m; if(other) other.classList.remove('v32sheet'); if(tgt) tgt.classList.toggle('v32sheet'); if(tgt && tgt.classList.contains('v32sheet')){ const ol = tgt.querySelector('ol'); if(ol) ol.hidden = false; } }
function v32Ui(){
  const add = (id, cls, html, f, parent) => { if($('#' + id)) return $('#' + id); const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = cls; b.innerHTML = html; b.onclick = e => { e.stopPropagation(); v32Wake(); f(); }; (parent || stage).appendChild(b); return b; };
  add('v32MenuBtn', 'v32ic v32menu', '☰', () => v32MenuToggle());
  add('v32MisBtn', 'v32ic v32mis', '📜<i id="v32MisN"></i>', () => v32Sheet('m'));
  add('v32LogBtn', 'v32ic v32log', '📓', () => v32Sheet('l'));
  const nav = document.createElement('div'); nav.id = 'v32Nav'; nav.hidden = true; nav.innerHTML = '<b></b><span></span><button type="button" aria-label="Huỷ chỉ đường">✕</button>'; stage.appendChild(nav);
  nav.querySelector('button').onclick = () => { GUIDE = null; V32.nav = null; V32.walk = null; V32.door = null; nav.hidden = true; $('#v32Arrow').hidden = true; if(PLAYER){ PLAYER.path = []; PLAYER.autoDest = null; } };
  const ar = document.createElement('div'); ar.id = 'v32Arrow'; ar.hidden = true; ar.textContent = '➤'; stage.appendChild(ar);
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, v32Wake, true));
}
// floating joystick: touch anywhere on the left half of the map
function v32JoyInit(){
  const pad = $('#mJoy'); if(!pad) return;
  cvs.addEventListener('pointerdown', e => { if(!V32.joyFloat || !V32.phone || e.pointerType === 'mouse' || e.clientX > innerWidth/2) return; const sr = stage.getBoundingClientRect();
    pad.style.left = (e.clientX - sr.left - pad.offsetWidth/2) + 'px'; pad.style.top = (e.clientY - sr.top - pad.offsetHeight/2) + 'px'; pad.style.bottom = 'auto'; pad.classList.add('float');
    e.stopImmediatePropagation(); e.preventDefault(); pad.dispatchEvent(new PointerEvent('pointerdown', {pointerId:e.pointerId, pointerType:e.pointerType, clientX:e.clientX, clientY:e.clientY, bubbles:true, cancelable:true})); }, true);
}
// ---------- 5. full-screen Menu: everything on one screen, sub pages with ← back ----------
const V32_GAMES_SEC = ['Trò chơi và nhiệm vụ', 'Khu vui chơi và mini game'];
function v32Icon(emoji, bg){ const k = emoji + bg; v32Icon.c = v32Icon.c || {}; if(v32Icon.c[k]) return v32Icon.c[k]; const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect ? g.roundRect(6, 10, 84, 84, 24) : g.rect(6, 10, 84, 84); g.fill(); g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 84, 84, 24) : g.rect(4, 4, 84, 84); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.roundRect ? g.roundRect(10, 8, 72, 30, 14) : g.rect(10, 8, 72, 30); g.fill(); g.font = '50px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 46, 50);
  return (v32Icon.c[k] = c.toDataURL()); }
const btnEmoji = t => { const m = String(t).match(/\p{Extended_Pictographic}/u); return m ? m[0] : null; };
function v32Items(){
  const B = id => () => { const b = $('#' + id); if(b) b.click(); };
  const items = [
    ['🎮', 'Mini game', '#7e57c2', 'games'], ['🗺️', 'Bản đồ', '#2e7d32', () => openBigMap()], ['🎪', 'Sự kiện', '#ef6c00', 'events'], ['🕒', 'Thời gian', '#1565c0', 'time'],
    ['🍂', 'Mùa & thời tiết', '#8d6e63', 'season'], ['🛍️', 'Cửa hàng', '#ad1457', () => openShop()], ['🏠', 'Nhà tôi', '#00838f', B('hHome')], ['🏪', 'Chợ', '#6a1b9a', B('hMarket')],
    ['📜', 'Nhiệm vụ', '#5d4037', () => { renderMissions(); showModal('mMissions'); }], ['🏆', 'Xếp hạng', '#f9a825', () => openLobby()], ['🚲', 'Đạp xe', '#43a047', () => toggleBike()], ['⛵', 'Lên thuyền', '#0277bd', () => boardBoat()],
    ['🎈', 'Bay', '#e53935', () => flyToggle()], ['🚀', 'Bắn hải tặc', '#c62828', () => { const d = DOORS().find(q => q.f === openMissile); if(d) v32Nav(d.x, d.y, 'Tàu hải quân', true, openMissile); else openMissile(); }], ['👤', 'Hồ sơ', '#455a64', () => openProfile()], ['🌐', 'Online', '#283593', () => openLobby()], ['⚙️', 'Cài đặt', '#37474f', () => openSettings()]];
  if(OWNER.is) items.push(['🛠️', 'Chủ game', '#b71c1c', 'owner']);
  return items;
}
function v32SubItems(kind){
  const fromButtons = sel => [...document.querySelectorAll(sel)].filter(b => b.id !== 'mMore' && b.offsetParent !== undefined).map(b => [btnEmoji(b.textContent) || '•', b.textContent.replace(/\p{Extended_Pictographic}/gu, '').trim().slice(0, 18), '#3949ab', () => b.click(), b.getAttribute('aria-pressed') === 'true']);
  if(kind === 'games'){ const icons = {openChess:'♟️', openRubik:'🧊', openFish:'🎣', openMissions:'📜', skyBtn:'🌌', immersiveBtn:'🎬', xPiano:'🎹', xGuitar:'🎸', xTables:'♞', xCaro:'⭕', xGo:'⚫', xPaint:'🎨', xFoot:'⚽', xBasket:'🏀', xSkate:'🛹', xPatin:'⛸️', xSki:'⛷️', xBalloon:'🎈', xBbq:'🍢', wLib:'📚', wZen:'🧘', wOly:'🏅', wKart:'🏎️', wAcad:'🎓', wHall:'🎮', wLobby:'🌐', xShop:'🛍️', wMall:'🏬', wHome:'🏠', wMyShop:'🏪', wMarket:'🧺', wGoEast:'🧭', wSea:'🌊', xFarm:'🌾', xRace:'🐎', boatBtn:'⛵', dismountBtn:'⬇️', xSports:'🏟️'};
    return [...document.querySelectorAll(V32_GAMES_SEC.map(l => `section[aria-label="${l}"] button[id]`).join(','))].filter(b => icons[b.id]).map(b => [icons[b.id], b.textContent.trim().slice(0, 16), '#5e35b1', () => b.click()]); }
  if(kind === 'events'){ const ev = [['concert', '🎤', 'hall'], ['festBtn', '🏮', 'plaza'], ['picnicBtn', '🧺', 'forest'], ['truckBtn', '🚚', 'road'], ['subBtn', '🚤', 'sub'], ['pirateBtn', '🏴‍☠️', 'sea'], ['fightBtn', '💥', 'yard'], ['nextDay', '🌅', null]];
    return ev.filter(([id]) => $('#' + id)).map(([id, ic, where]) => { const b = $('#' + id); return [ic, b.textContent.trim().slice(0, 18), '#ef6c00', () => { b.click(); v32MenuToggle(false); const p = v32EventPlace(where); if(p) setTimeout(() => v32Nav(p[0], p[1], b.textContent.trim(), false), 300); }]; }); }
  if(kind === 'time'){ const it = V25_TIMES.map(([id, txt, min, label]) => [txt.split(' ')[0], label + ' ' + String(Math.floor(min/60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'), '#1565c0', () => { v25SetTime(min, label); v32MenuToggle(false); }]);
    it.push(['⏩', '+30 phút', '#0277bd', () => v32Skip(30)], ['⏩', '+60 phút', '#0277bd', () => v32Skip(60)]);
    [['x1', '×1 giờ thật'], ['x10', '×10'], ['x30', '×30'], ['stop', 'Dừng']].forEach(([m, t]) => it.push([m === 'stop' ? '⏸️' : '⏱️', t, V25.mode === m ? '#f9a825' : '#37474f', () => { v25Mode(m); v32Sub('time'); }]));
    return it; }
  if(kind === 'season') return fromButtons('#seasons button').map(x => (x[2] = '#8d6e63', x[0] = v35IcName(x[1]) || x[0], x)).concat(fromButtons('#weathers button').map(x => (x[2] = '#0277bd', x[0] = v35IcName(x[1]) || x[0], x)));
  if(kind === 'owner'){ const it = v32SubItems('events'); it.push(['📋', 'Bảng đầy đủ', '#b71c1c', () => { v32MenuToggle(false); v32OwnerPanel(); }]); return it; }
  return [];
}
function v32EventPlace(w){ if(w === 'hall') return [R.hall.x + R.hall.w/2, R.hall.y + R.hall.h + 10]; if(w === 'plaza') return [R.plaza.x + R.plaza.w/2, R.plaza.y + R.plaza.h - 20]; if(w === 'forest') return [R.forest.x + 300, R.forest.y + 300];
  if(w === 'road') return [2680, 708]; if(w === 'sub') return [PIER_END[0], PIER_END[1] - 20]; if(w === 'sea') return [LIGHTHOUSE[0], 870]; if(w === 'yard') return [460, 400]; return null; }
function v32Skip(m){ const big = $('#v32Big'); big.textContent = `⏩ +${m} phút`; big.classList.remove('go'); void big.offsetWidth; big.classList.add('go'); v32MenuToggle(false);
  let left = m; const step = () => { const d = Math.min(left, 4); left -= d; clock += d; if(clock >= 1440){ const keep = clock - 1440; newDay(false); clock = keep; } updatePanel(); if(left > 0) requestAnimationFrame(step); else { lastBrainMin = -1; try { runBrains(); } catch(e){} agents.forEach(a => { if(!a.visible || a.isPlayer || !a.path || !a.path.length) return; const e = a.path[a.path.length - 1]; if(Math.hypot(e[0] - a.x, e[1] - a.y) > 350){ a.x = e[0]; a.y = e[1]; a.path.length = 0; } }); } }; step(); }
function v32Grid(box, items){ box.textContent = ''; const n = items.length, w = box.clientWidth || innerWidth, h = box.clientHeight || innerHeight*.7;
  let best = 3, bs = 0; for(let c=3;c<=9;c++){ const r = Math.ceil(n/c), s = Math.min(w/c, h/r); if(s > bs){ bs = s; best = c; } } box.style.gridTemplateColumns = `repeat(${best},1fr)`; box.style.gridTemplateRows = `repeat(${Math.ceil(n/best)},1fr)`;
  items.forEach(([ic, name, bg, f, on]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v32tile' + (on ? ' on' : ''); const img = document.createElement('img'); img.alt = ''; img.src = v32Icon(ic, bg); const t = document.createElement('span'); t.textContent = name; b.appendChild(img); b.appendChild(t);
    b.onclick = () => { if(typeof f === 'string') v32Sub(f); else { v32MenuToggle(false); setTimeout(f, 60); } }; box.appendChild(b); }); }
function v32Chips(){ const c = $('#v32Chips'); if(!c) return; const ic = {xuan:'🌸', ha:'☀️', thu:'🍂', dong:'❄️'}[season] || '';
  c.innerHTML = ''; [[`${ic} ${SEASONS[season].name}`, 'season'], [WEATHERS[weather].name, 'season'], [`🕒 ${String(Math.floor(clock/60) % 24).padStart(2, '0')}:${String(Math.floor(clock % 60)).padStart(2, '0')} · ×${V25.mode === 'stop' ? '0' : V25.mode.slice(1)}`, 'time']].forEach(([t, k]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v32chip'; b.textContent = t; b.onclick = () => v32Sub(k); c.appendChild(b); }); }
function v32Sub(kind){ const titles = {games:'🎮 Mini game', events:'🎪 Sự kiện', time:'🕒 Thời gian', season:'🍂 Mùa & thời tiết', owner:'🛠️ Chủ game'}; $('#v32Back').hidden = false; $('#v32Title').textContent = titles[kind] || ''; v32Grid($('#v32Grid'), v32SubItems(kind)); }
function v32Home(){ $('#v32Back').hidden = true; $('#v32Title').textContent = ''; v32Chips(); v32Grid($('#v32Grid'), v32Items()); }
function v32MenuToggle(on){ const m = $('#v32Menu'); V32.menuOpen = on == null ? !V32.menuOpen : on; m.hidden = !V32.menuOpen; if(V32.menuOpen){ m.classList.remove('in'); void m.offsetWidth; m.classList.add('in'); requestAnimationFrame(v32Home); } }
function v32MenuInit(){
  const m = document.createElement('div'); m.id = 'v32Menu'; m.hidden = true; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Menu');
  m.innerHTML = '<div class="v32mh"><button type="button" id="v32Back" hidden aria-label="Quay lại">←</button><img id="v32LogoImg" alt="The Rubik School"><button type="button" id="v32Close" aria-label="Đóng menu">✕</button></div><div id="v32Chips"></div><h3 id="v32Title"></h3><div id="v32Grid"></div>';
  document.body.appendChild(m); $('#v32LogoImg').src = v32Logo(); $('#v32Close').onclick = () => v32MenuToggle(false); $('#v32Back').onclick = v32Home;
  let sy = null; m.addEventListener('pointerdown', e => { if(e.target.closest('.v32tile')) return; sy = e.clientY; }); m.addEventListener('pointerup', e => { if(sy != null && e.clientY - sy > 90) v32MenuToggle(false); sy = null; });
  window.addEventListener('keydown', e => { if(V32.menuOpen && e.key === 'Escape'){ e.stopImmediatePropagation(); v32MenuToggle(false); } }, true);
  window.addEventListener('resize', () => { if(V32.menuOpen) requestAnimationFrame(() => { const t = $('#v32Title').textContent; if(!t) v32Home(); }); });
}
function v32OwnerPanel(){ let o = $('#v32Owner'); if(!o){ o = document.createElement('div'); o.className = 'modal'; o.id = 'v32Owner'; o.hidden = true; o.innerHTML = '<div class="mbox wide"><div class="mhead"><h2>🛠️ Bảng chủ game</h2><button class="mclose" data-close aria-label="Đóng">×</button></div><div class="menubody" id="v32OwnerBody"></div></div>'; document.body.appendChild(o);
    o.querySelector('[data-close]').onclick = () => hideModal(); ['Sự kiện', 'Nhân vật', 'Quan sát nhân vật', 'Sổ theo dõi'].forEach(l => { const s = document.querySelector(`section[aria-label="${l}"]`); if(s){ s.hidden = false; $('#v32OwnerBody').appendChild(s); } }); ['#tabAtt', '#tabRep'].forEach(q => { const e = $(q); if(e) e.hidden = false; }); }
  showModal('v32Owner'); }
// ---------- 3. fast tourist map: land drawn once into an offscreen image, live layer on top ----------
const MAP = {img:null, imgSeason:null, k:.2, y0:-700, y1:1060, cx:0, cy:0, z:.1, vx:0, vy:0, drag:null, pins:new Map(), pinch:0, sel:null, raf:0, places:null};
const MAP_COL = {school:'#ffcc80', world:'#ce93d8', nature:'#a5d6a7', sport:'#90caf9', shop:'#f48fb1', home:'#ffe082', water:'#64b5f6'};
const MAP_INFO = {rubik:['🧊', 'Lớp học xoay Rubik với thầy cô'], chess:['♟️', 'Học và thi đấu cờ vua'], music:['🎹', 'Phòng nhạc: piano, guitar, hát'], hall:['🎭', 'Hội trường: biểu diễn, Người Thầy Ánh Sáng'], elec:['🔌', 'Lắp ráp điện tử'], office:['🏫', 'Văn phòng ban giám hiệu'], rubikyard:['🧩', 'Sân chơi Rubik'], attend:['📋', 'Khu điểm danh buổi sáng'], field:['⚽', 'Sân bóng đá'],
  giantchess:['♞', 'Bàn cờ khổng lồ'], rubikpark:['🧊', 'Công viên Rubik'], pond:['🎣', 'Hồ câu cá'], flowerfield:['🌼', 'Cánh đồng hoa'], bpad:['🎈', 'Khinh khí cầu'], skate:['🛹', 'Sân trượt ván'], patin:['⛸️', 'Sân patin'], basket:['🏀', 'Sân bóng rổ'], ski:['⛷️', 'Đồi trượt tuyết'], art:['🎨', 'Xưởng vẽ'], farm:['🌾', 'Nông trại thả tự do'],
  garden:['🌷', 'Vườn hoa'], picnic:['🧺', 'Khu picnic'], lotus:['🪷', 'Đầm sen'], lake:['🐟', 'Hồ cá Koi'], library:['📚', 'Thư viện Hoàng gia: đọc sách nhận thưởng'], zen:['🧘', 'Vườn thiền tĩnh tâm'], stadium:['🏟️', 'Sân vận động Olympic'], pool:['🏊', 'Hồ bơi 5 làn'], archery:['🏹', 'Trường bắn cung'], gym:['🤸', 'Nhà thi đấu thể dục'],
  arena:['🌐', 'Đấu trường online'], kart:['🏎️', 'Đường đua Rubik Kart'], academy:['🎓', 'Học viện trí tuệ'], shopst:['🛍️', 'Phố mua sắm'], hall2p:['🎮', 'Nhà game 2 người'], plaza:['🏮', 'Quảng trường lễ hội · cờ Ikigai'], botanic:['🔭', 'Vườn bách thảo & kính viễn vọng'], pstreet:['🏘️', 'Phố nhà người chơi']};
const MAP_CAT = k => ({rubik:'school', chess:'school', music:'school', hall:'school', elec:'school', office:'school', rubikyard:'school', attend:'school', field:'sport', skate:'sport', patin:'sport', basket:'sport', ski:'sport', stadium:'sport', pool:'sport', archery:'sport', gym:'sport', arena:'sport', kart:'sport', shopst:'shop', pstreet:'home', pond:'water', lake:'water', lotus:'water', library:'world', zen:'world', academy:'world', hall2p:'world', plaza:'world', botanic:'world'}[k] || 'nature');
function mapPlaces(){
  if(MAP.places) return MAP.places; const P = [];
  for(const k in R){ const r = R[k]; if(!r || !r.name || !r.w || r.w*r.h > 1.6e6) continue; const inf = MAP_INFO[k] || ['📍', r.name]; P.push({k, name:r.name, x:r.x + r.w/2, y:r.y + r.h/2, r, ic:inf[0], desc:inf[1], cat:MAP_CAT(k), door:r.dout ? [r.dout[0], r.dout[1]] : null}); }
  P.push({k:'beach', name:'Bãi biển & bến tàu', x:1320, y:860, ic:'⚓', desc:'Lên thuyền, câu cá, tàu ngầm', cat:'water'}, {k:'navy', name:'Hầm tên lửa · tàu hải quân', x:V16_BASE.navy[0], y:V16_BASE.navy[1] - 100, ic:'🚀', desc:'Bắn tên lửa vào tàu hải tặc', cat:'world'},
    {k:'gardenbuy', name:'Khu vườn mở bán', x:V16_GARDEN_GATE[0], y:V16_GARDEN_GATE[1], ic:'🥕', desc:'Gieo hạt, tưới, thu hoạch', cat:'nature'}, {k:'gate', name:'Cổng trường', x:GATE[0], y:GATE[1], ic:'🏫', desc:'Lối vào trường', cat:'school'});
  HOUSES.forEach(h => P.push({k:'h' + h.name, name:h.name, x:h.x + h.w/2, y:h.y + h.h/2, r:h, ic:'🏠', desc:'Nhà để tham quan nội thất', cat:'home', small:true}));
  return (MAP.places = P);
}
function mapBake(){
  if(MAP.img && MAP.imgSeason === season) return; const k = MAP.k, c = MAP.img || document.createElement('canvas'); c.width = Math.round(W*k); c.height = Math.round((MAP.y1 - MAP.y0)*k); const g = c.getContext('2d');
  const s = S(), dong = season === 'dong'; g.setTransform(k, 0, 0, k, 0, -MAP.y0*k);
  g.fillStyle = dong ? '#e3eef3' : '#9ccc65'; g.fillRect(0, NY, W, 880 - NY); g.fillStyle = '#7fb3e8'; g.fillRect(0, MAP.y0, W, NY - MAP.y0);
  g.fillStyle = '#42a5f5'; g.fillRect(0, 880, W, MAP.y1 - 880); g.fillStyle = '#ffe0a3'; g.fillRect(0, 790, W, 95);
  g.fillStyle = '#fff3d6'; g.fillRect(0, 686, W, 44); g.fillRect(2196, 0, 48, 720); g.fillRect(1126, -40, 48, 740); g.fillRect(0, -40, W, 40);
  mapPlaces().forEach(p => { if(!p.r) return; const r = p.r, rad = Math.min(60, Math.min(r.w, r.h)*.18); g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.roundRect ? g.roundRect(r.x + 10, r.y + 14, r.w, r.h, rad) : g.rect(r.x + 10, r.y + 14, r.w, r.h); g.fill();
    g.fillStyle = MAP_COL[p.cat]; g.beginPath(); g.roundRect ? g.roundRect(r.x, r.y, r.w, r.h, rad) : g.rect(r.x, r.y, r.w, r.h); g.fill(); g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke(); });
  ISLANDS.forEach(i => { g.fillStyle = '#ffe0a3'; g.beginPath(); g.ellipse(i.x, i.y, i.r*1.25, i.r, 0, 0, Math.PI*2); g.fill(); });
  MAP.img = c; MAP.imgSeason = season;
}
function mapDraw(){
  if(!V32.mapOpen) return; const cv = $('#v32MapCv'), g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), Wc = cv.clientWidth, Hc = cv.clientHeight;
  if(cv.width !== Math.round(Wc*dpr) || cv.height !== Math.round(Hc*dpr)){ cv.width = Math.round(Wc*dpr); cv.height = Math.round(Hc*dpr); }
  if(!MAP.drag && MAP.pins.size === 0 && (Math.abs(MAP.vx) > .01 || Math.abs(MAP.vy) > .01)){ MAP.cx -= MAP.vx/MAP.z; MAP.cy -= MAP.vy/MAP.z; MAP.vx *= .92; MAP.vy *= .92; }
  MAP.z = Math.max(Wc/W*.9, Math.min(2, MAP.z)); MAP.cx = Math.max(0, Math.min(W, MAP.cx)); MAP.cy = Math.max(Y0, Math.min(H, MAP.cy));
  const z = MAP.z, ox = Wc/2 - MAP.cx*z, oy = Hc/2 - MAP.cy*z;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#0b1a3a'; g.fillRect(0, 0, Wc, Hc);
  g.fillStyle = '#1e88e5'; g.fillRect(0, oy + 880*z, Wc, Hc); g.fillStyle = '#123'; g.fillRect(0, 0, Wc, Math.max(0, oy + MAP.y0*z));
  g.imageSmoothingEnabled = true; g.drawImage(MAP.img, ox, oy + MAP.y0*z, W*z, (MAP.y1 - MAP.y0)*z);
  // labels: big area names when zoomed out, building names when zoomed in
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if(z < .07){ [['TRƯỜNG HỌC', 1100, 350], ['ĐỒI THÔNG & CÔNG VIÊN', 3200, -300], ['THẾ GIỚI MỚI', 7800, 100], ['BÃI BIỂN', 1500, 840], ['ĐẠI DƯƠNG', 5200, 1500], ['BẦU TRỜI', 5200, -1500]].forEach(([t, x, y]) => { g.font = '16px Bungee, sans-serif'; g.lineWidth = 4; g.strokeStyle = '#0a0f22'; g.strokeText(t, ox + x*z, oy + y*z); g.fillStyle = '#fff'; g.fillText(t, ox + x*z, oy + y*z); }); }
  mapPlaces().forEach(p => { const x = ox + p.x*z, y = oy + p.y*z; if(x < -60 || x > Wc + 60 || y < -40 || y > Hc + 40) return; if(p.small && z < .16) return; if(z < .07 && !p.r) return;
    g.font = (z < .07 ? 14 : 20) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillText(p.ic, x, y - (z >= .07 ? 10 : 0));
    if(z >= .07){ g.font = '15px VT323, monospace'; const tw = g.measureText(p.name).width + 10; g.fillStyle = 'rgba(10,15,34,.78)'; g.fillRect(x - tw/2, y + 4, tw, 17); g.fillStyle = MAP.sel === p ? '#ffd23f' : '#fff'; g.fillText(p.name, x, y + 13); } });
  if(GUIDE && GUIDE.pts){ g.strokeStyle = '#ffd23f'; g.lineWidth = 4; g.setLineDash([8, 6]); g.lineDashOffset = -(realT*30) % 14; g.beginPath(); if(PLAYER) g.moveTo(ox + PLAYER.x*z, oy + PLAYER.y*z); GUIDE.pts.forEach(([x, y]) => g.lineTo(ox + x*z, oy + y*z)); g.stroke(); g.setLineDash([]); g.fillStyle = '#ef4b4b'; g.beginPath(); g.arc(ox + GUIDE.x*z, oy + GUIDE.y*z - Math.abs(Math.sin(realT*4))*6, 7, 0, Math.PI*2); g.fill(); }
  if(fight){ const x = ox + fight.x*z, y = oy + fight.y*z, a = .5 + .5*Math.sin(realT*6); g.globalAlpha = a; g.font = '20px sans-serif'; g.fillText('💥', x, y); g.globalAlpha = 1; }
  (ONLINE.peers || []).forEach(p => { const pr = p.presence || {}; if(pr.x == null) return; g.fillStyle = '#26c6da'; g.beginPath(); g.arc(ox + pr.x*z, oy + pr.y*z, 5, 0, Math.PI*2); g.fill(); });
  if(PLAYER && PLAYER.visible){ const x = ox + PLAYER.x*z, y = oy + PLAYER.y*z, pr = (realT*1.2) % 1; g.strokeStyle = `rgba(66,165,245,${1 - pr})`; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 8 + pr*18, 0, Math.PI*2); g.stroke();
    g.fillStyle = '#1e88e5'; g.beginPath(); g.arc(x, y, 8, 0, Math.PI*2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); const d = PLAYER.dir || 1; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + d*16, y); g.lineTo(x + d*8, y - 6); g.lineTo(x + d*8, y + 6); g.fill(); }
  MAP.raf = requestAnimationFrame(mapDraw);
}
function mapToWorld(cx, cy){ const cv = $('#v32MapCv'), r = cv.getBoundingClientRect(); return [MAP.cx + (cx - r.left - r.width/2)/MAP.z, MAP.cy + (cy - r.top - r.height/2)/MAP.z]; }
function mapCard(p){ MAP.sel = p; const c = $('#v32MapCard'); c.hidden = false; const d = PLAYER ? Math.round(Math.hypot(p.x - PLAYER.x, p.y - PLAYER.y)/8) : 0;
  c.querySelector('b').textContent = `${p.ic} ${p.name}`; c.querySelector('span').textContent = `${p.desc || ''} · cách ${d}m`; }
function mapGo(walk){ const p = MAP.sel; if(!p) return; v32MapClose(); const tx = p.door ? p.door[0] : p.x, ty = p.door ? p.door[1] + 12 : (p.r ? p.r.y + p.r.h + 10 : p.y); v32Nav(tx, ty, p.name, walk); }
function mapList(q){ const box = $('#v32MapList'); box.textContent = ''; const groups = {school:'🏫 Trường học', world:'✨ Thế giới mới', sport:'🏅 Thể thao', nature:'🌳 Thiên nhiên', water:'🌊 Nước & biển', shop:'🛍️ Mua sắm', home:'🏠 Nhà ở'}; const ql = (q || '').toLowerCase();
  Object.keys(groups).forEach(cat => { const list = mapPlaces().filter(p => p.cat === cat && (!ql || p.name.toLowerCase().includes(ql))).map(p => [p, PLAYER ? Math.hypot(p.x - PLAYER.x, p.y - PLAYER.y) : 0]).sort((a, b) => a[1] - b[1]); if(!list.length) return;
    const h = document.createElement('h4'); h.textContent = groups[cat]; box.appendChild(h); list.forEach(([p, d]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = `${p.ic} ${p.name} · ${Math.round(d/8)}m`; b.onclick = () => { MAP.cx = p.x; MAP.cy = p.y; MAP.z = Math.max(MAP.z, .2); mapCard(p); box.hidden = true; }; box.appendChild(b); }); }); }
function v32MapOpen(){
  mapBake(); const m = $('#v32Map'); m.hidden = false; V32.mapOpen = true; const cv = $('#v32MapCv'); MAP.z = cv.clientWidth/W*2.2; if(PLAYER && PLAYER.visible){ MAP.cx = PLAYER.x; MAP.cy = PLAYER.y; } else { MAP.cx = W/2; MAP.cy = 300; }
  $('#v32MapCard').hidden = true; $('#v32MapList').hidden = true; cancelAnimationFrame(MAP.raf); MAP.raf = requestAnimationFrame(mapDraw);
}
function v32MapClose(){ $('#v32Map').hidden = true; V32.mapOpen = false; cancelAnimationFrame(MAP.raf); }
function v32MapInit(){
  const m = document.createElement('div'); m.id = 'v32Map'; m.hidden = true; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Bản đồ');
  m.innerHTML = '<canvas id="v32MapCv" aria-label="Bản đồ: kéo để di chuyển, chụm để phóng to, chạm một địa điểm"></canvas><div class="v32mtop"><input id="v32MapQ" placeholder="🔎 Tìm địa điểm…" autocomplete="off"><button type="button" id="v32MapListBtn">☰ Địa điểm</button><button type="button" id="v32MapClose" aria-label="Đóng bản đồ">✕</button></div><div id="v32MapList" hidden></div><button type="button" id="v32MapMe">📍 Vị trí của tôi</button><div id="v32MapCard" hidden><b></b><span></span><div class="row"><button type="button" class="primary" id="v32MapNav">🧭 Chỉ đường</button><button type="button" id="v32MapWalk">🚶 Tự đi tới</button></div></div>';
  document.body.appendChild(m); const cv = $('#v32MapCv');
  $('#v32MapClose').onclick = v32MapClose; $('#v32MapMe').onclick = () => { if(PLAYER){ MAP.cx = PLAYER.x; MAP.cy = PLAYER.y; MAP.z = Math.max(MAP.z, .22); } };
  $('#v32MapListBtn').onclick = () => { const l = $('#v32MapList'); l.hidden = !l.hidden; if(!l.hidden) mapList($('#v32MapQ').value); };
  $('#v32MapQ').oninput = e => { const l = $('#v32MapList'); l.hidden = false; mapList(e.target.value); };
  $('#v32MapNav').onclick = () => mapGo(false); $('#v32MapWalk').onclick = () => mapGo(true);
  cv.addEventListener('wheel', e => { e.preventDefault(); const [wx, wy] = mapToWorld(e.clientX, e.clientY); MAP.z *= e.deltaY < 0 ? 1.15 : .87; const [nx, ny] = mapToWorld(e.clientX, e.clientY); MAP.cx += wx - nx; MAP.cy += wy - ny; }, {passive:false});
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); MAP.pins.set(e.pointerId, [e.clientX, e.clientY]); MAP.vx = MAP.vy = 0; if(MAP.pins.size === 1) MAP.drag = {x:e.clientX, y:e.clientY, t:performance.now(), moved:false, lx:e.clientX, ly:e.clientY}; else { const p = [...MAP.pins.values()]; MAP.pinch = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]); MAP.drag = null; } });
  cv.addEventListener('pointermove', e => { if(!MAP.pins.has(e.pointerId)) return; MAP.pins.set(e.pointerId, [e.clientX, e.clientY]);
    if(MAP.pins.size === 2){ const p = [...MAP.pins.values()], d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]); if(MAP.pinch){ const mx = (p[0][0] + p[1][0])/2, my = (p[0][1] + p[1][1])/2, [wx, wy] = mapToWorld(mx, my); MAP.z *= d/MAP.pinch; const [nx, ny] = mapToWorld(mx, my); MAP.cx += wx - nx; MAP.cy += wy - ny; } MAP.pinch = d; return; }
    const dr = MAP.drag; if(!dr) return; const dx = e.clientX - dr.lx, dy = e.clientY - dr.ly; if(Math.hypot(e.clientX - dr.x, e.clientY - dr.y) > 8) dr.moved = true; MAP.cx -= dx/MAP.z; MAP.cy -= dy/MAP.z; MAP.vx = dx; MAP.vy = dy; dr.lx = e.clientX; dr.ly = e.clientY; });
  const up = e => { MAP.pins.delete(e.pointerId); if(MAP.pins.size < 2) MAP.pinch = 0; const dr = MAP.drag; MAP.drag = null; if(!dr || dr.moved) return;
    const [wx, wy] = mapToWorld(e.clientX, e.clientY); let best = null, bd = 30/MAP.z; mapPlaces().forEach(p => { if(p.small && MAP.z < .16) return; const d = Math.hypot(p.x - wx, p.y - wy); if(d < bd){ bd = d; best = p; } });
    if(!best) best = {name:placeName(wx, wy), x:wx, y:wy, ic:'📍', desc:'Điểm bạn chọn'}; mapCard(best); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  window.addEventListener('keydown', e => { if(V32.mapOpen && e.key === 'Escape'){ e.stopImmediatePropagation(); v32MapClose(); } }, true);
}
// ---------- 7. control hints for mini games (PlayStation style) ----------
const MGH = {
  mChess:{name:'Cờ vua', touch:[['👆', 'Chạm quân rồi chạm ô để đi']], keys:[['🖱', 'Bấm hoặc kéo quân']], steps:[['.cboard', 'Chạm vào một quân cờ của bạn để chọn'], ['.cboard', 'Chạm vào ô có chấm để đi quân']]},
  mRubik:{name:'Rubik 3D', touch:[['✋', 'Kéo: xoay khối'], ['👆', 'Nút bên dưới: xoay mặt']], keys:[['R U F', 'Xoay mặt'], ['Shift', 'Ngược chiều'], ['Space', 'Xáo/giải']], steps:[['#rubikCv', 'Kéo trên khối để xoay góc nhìn'], ['.rmoves', 'Chạm một nút để xoay một mặt']]},
  mFish:{name:'Câu cá', touch:[['👆', 'Chạm: thả câu'], ['✋', 'Giữ: kéo dây']], keys:[['Space', 'Thả câu / giữ để kéo']], steps:[['#fishCv', 'Chạm vào mặt nước để thả câu'], ['#fishCv', 'Khi cá cắn, giữ để kéo dây']]},
  mMusic:{name:'Âm nhạc', touch:[['👆', 'Chạm phím đàn'], ['✋', 'Kéo ngang để cuộn']], keys:[['A–L', 'Phím trắng'], ['W–P', 'Phím đen']], steps:[['#pkeys', 'Chạm một phím đàn để nghe']]},
  mArcade:{name:'Mini game', touch:[['🕹', 'Nút trong khung game'], ['👆', 'Chạm: nhảy / hành động']], keys:[['← →', 'Di chuyển'], ['Space', 'Nhảy / hành động'], ['X', 'Kỹ năng']], steps:[['#arcCv', 'Dùng nút bên dưới hoặc phím mũi tên để điều khiển']]},
  mCaro:{name:'Cờ caro', touch:[['👆', 'Chạm ô để đánh']], keys:[['🖱', 'Bấm ô để đánh']], steps:[['#caroCv', 'Chạm một ô trống để đặt quân']]},
  mGo:{name:'Cờ vây', touch:[['👆', 'Chạm giao điểm để đặt quân']], keys:[['🖱', 'Bấm giao điểm']], steps:[['#goCv', 'Chạm một giao điểm để đặt quân']]},
  mC4:{name:'Connect 4', touch:[['👆', 'Chạm cột để thả quân']], keys:[['🖱', 'Bấm cột']], steps:[['#c4Cv', 'Chạm vào một cột để thả quân']]},
  mPaint:{name:'Vẽ tranh', touch:[['✋', 'Kéo để vẽ'], ['🎨', 'Chạm màu để đổi']], keys:[['🖱', 'Giữ chuột để vẽ']], steps:[['.ppal', 'Chọn một màu'], ['#paintCv', 'Kéo trên giấy để vẽ']]},
  mLab:{name:'Rubik Lab', touch:[['✋', 'Kéo: xoay'], ['👆', 'Nút: xoay mặt']], keys:[['R U F L D B', 'Xoay mặt'], ['Space', 'Bắt đầu / dừng giờ']], steps:[['#labCv', 'Kéo để xoay khối'], ['#labMoves', 'Chạm nút để xoay mặt']]},
  mSudoku:{name:'Sudoku', touch:[['👆', 'Chạm ô rồi chạm số']], keys:[['1–9', 'Điền số'], ['⌫', 'Xoá']], steps:[['.sdkgrid', 'Chạm một ô trống'], ['.sdkpad', 'Chạm số để điền']]},
  mMemory:{name:'Lật thẻ', touch:[['👆', 'Chạm 2 thẻ để lật']], keys:[['🖱', 'Bấm thẻ']], steps:[['.memgrid', 'Chạm hai thẻ để tìm cặp giống nhau']]},
  mMath:{name:'Tính nhẩm', touch:[['👆', 'Chạm đáp án đúng']], keys:[['1–4', 'Chọn đáp án']], steps:[]},
  mOAQ:{name:'Ô ăn quan', touch:[['👆', 'Chạm ô để rải quân']], keys:[['🖱', 'Bấm ô']], steps:[['#oqCv', 'Chạm một ô bên bạn để rải quân']]},
  mFishDeep:{name:'Câu cá biển sâu', touch:[['👆', 'Chạm: thả câu'], ['✋', 'Giữ: kéo']], keys:[['Space', 'Thả / kéo'], ['← →', 'Di chuyển']], steps:[]},
  mZen:{name:'Thiền', touch:[['👆', 'Chạm để bắt đầu thở']], keys:[['Space', 'Bắt đầu']], steps:[]}
};
const MGH_SEEN = 'truong-mgh-seen';
function mghKey(k){ return {'🖱':'🖱', Space:'Space', '⌫':'⌫'}[k] || k; }
function mghShow(id){
  const H = MGH[id], m = $('#' + id); if(!H || !m) return; const box = m.querySelector('.mbox'); if(!box) return; let bar = box.querySelector('.mgh');
  if(!bar){ bar = document.createElement('div'); bar.className = 'mgh'; box.appendChild(bar); const q = document.createElement('button'); q.type = 'button'; q.className = 'mghq'; q.textContent = '?'; q.setAttribute('aria-label', 'Xem gợi ý điều khiển'); q.onclick = () => { mghBar(bar, H); mghTour(id, true); }; box.appendChild(q); }
  mghBar(bar, H); let seen = {}; try { seen = JSON.parse(localStorage.getItem(MGH_SEEN) || '{}'); } catch(e){} if(!seen[id] && H.steps.length) setTimeout(() => mghTour(id, false), 500);
}
function mghBar(bar, H){ const list = MOB.touch ? H.touch : H.keys; bar.textContent = ''; list.forEach(([k, t]) => { const s = document.createElement('span'); const kk = document.createElement('kbd'); kk.textContent = mghKey(k); s.appendChild(kk); s.appendChild(document.createTextNode(' ' + t)); bar.appendChild(s); });
  bar.classList.remove('fade'); void bar.offsetWidth; clearTimeout(bar._t); bar._t = setTimeout(() => bar.classList.add('fade'), 5000); }
function mghTour(id, force){
  const H = MGH[id]; if(!H || !H.steps.length) return; const m = $('#' + id); let i = 0, tip = m.querySelector('.mghtour'); if(!tip){ tip = document.createElement('div'); tip.className = 'mghtour'; m.appendChild(tip); }
  const done = () => { tip.hidden = true; try { const s = JSON.parse(localStorage.getItem(MGH_SEEN) || '{}'); s[id] = 1; localStorage.setItem(MGH_SEEN, JSON.stringify(s)); } catch(e){} };
  const step = () => { if(i >= H.steps.length || m.hidden){ done(); return; } const [sel, text] = H.steps[i], t = m.querySelector(sel); if(!t){ i++; step(); return; } const r = t.getBoundingClientRect();
    tip.hidden = false; tip.innerHTML = `<div class="hand" style="left:${r.left + r.width/2}px;top:${r.top + r.height/2}px">👆</div><div class="card" style="top:${Math.min(innerHeight - 140, r.bottom + 10)}px"><b>Bước ${i + 1}/${H.steps.length}</b><p></p><button type="button">Bỏ qua</button></div>`;
    tip.querySelector('p').textContent = text; tip.querySelector('button').onclick = done;
    const go = () => { t.removeEventListener('pointerdown', go, true); i++; setTimeout(step, 350); }; t.addEventListener('pointerdown', go, true); };
  step();
}
// ---------- glue ----------
function v32Tick(){
  V32.phone = v32Phone(); document.body.classList.toggle('v32phone', V32.phone);
  V32.idleT += .25; if(V32.phone && V32.idleT > 6 && !V32.nav) stage.classList.add('v32idle');
  const n = $('#v32MisN'); if(n){ const left = MISSIONS.filter(m => !mstate[m.id + '_done']).length; n.textContent = left > 99 ? '99+' : left; }
}
function v32Init(){
  V32.phone = v32Phone(); try { V32.joyFloat = !!JSON.parse(localStorage.getItem('truong-v32') || '{}').joyFloat; } catch(e){}
  const logo = v32Logo(); try { document.fonts && document.fonts.load('46px Bungee').then(() => { V32.logo = null; const src = v32Logo(); const im = $('#v32LogoImg'); if(im) im.src = src; document.querySelectorAll('.v32logo').forEach(i => i.src = src); setFav(src); }); } catch(e){}
  const setFav = src => { let l = document.querySelector('link[rel="icon"]'); if(!l){ l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); } const c = document.createElement('canvas'); c.width = c.height = 64; const im = new Image(); im.onload = () => { c.getContext('2d').drawImage(im, 0, 0, 260, 260, 0, 0, 64, 64); l.href = c.toDataURL(); }; im.src = src; };
  setFav(logo);
  const lg = $('#mLogin .mbox'); if(lg && !lg.querySelector('.v32logo')){ const im = document.createElement('img'); im.className = 'v32logo'; im.alt = 'The Rubik School'; im.src = logo; lg.insertBefore(im, lg.firstChild); }
  v32Ui(); v32JoyInit(); v32TapInit(); v32MenuInit(); v32MapInit();
  const big = document.createElement('div'); big.id = 'v32Big'; stage.appendChild(big);
  openBigMap = v32MapOpen; setGuide = (x, y, name) => v32Nav(x, y, name, false);
  guideUpdate = () => {}; // replaced by v32NavTick
  // "Tự đi tới…" list uses the same navigation
  const dest = $('#hDest'); if(dest) dest.addEventListener('change', e => { const D = DESTS.find(d => d[0] === dest.value); if(D){ e.stopImmediatePropagation(); dest.value = ''; v32Nav(D[2], D[3], D[1], true); } }, true);
  const ham = $('#hMenu'); if(ham) ham.onclick = () => v32MenuToggle(); const adm = $('#hAdmin'); if(adm) adm.onclick = () => v32OwnerPanel();
  // the old owner side panel is replaced by the "🛠 Chủ game" page in the Menu
  consoleApply = function(){ const app = document.querySelector('.app'); if(app) app.classList.add('noconsole'); const b = $('#hAdmin'); if(b){ b.hidden = !OWNER.is; b.textContent = '🛠 Chủ game'; } setTimeout(() => window.dispatchEvent(new Event('resize')), 30); };
  consoleApply();
  // settings: floating joystick
  const host = $('#stJoy'); if(host){ const row = document.createElement('label'); row.className = 'strow'; row.innerHTML = '<span>Joystick nổi (máy tính bảng; điện thoại dùng vuốt)</span><input type="checkbox" id="stJoyFloat">'; host.closest('.strow').after(row); const c = $('#stJoyFloat'); c.checked = V32.joyFloat; c.onchange = () => { V32.joyFloat = c.checked; try { localStorage.setItem('truong-v32', JSON.stringify({joyFloat:V32.joyFloat})); } catch(e){} const p = $('#mJoy'); if(p && !c.checked){ p.style.left = p.style.top = p.style.bottom = ''; p.classList.remove('float'); } }; }
  // control hints whenever a mini game window opens
  Object.keys(MGH).forEach(id => { const m = $('#' + id); if(m) new MutationObserver(() => { if(!m.hidden) mghShow(id); }).observe(m, {attributes:true, attributeFilter:['hidden']}); });
  setInterval(v32Tick, 250); setInterval(v32NavTick, 200);
}
