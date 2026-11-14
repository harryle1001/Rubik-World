// ================= EXT17: GO TO SCHOOL, AUTO-WALK, LOCATE PLAYERS, ONLINE AVATARS =================
const DESTS = [
  ['school', 'Trường học (điểm danh)', 950, 520], ['rubik', 'Lớp Rubik', 220, 210], ['hall', 'Hội trường lớn', 1300, 330], ['chess', 'Khu cờ vua', 565, 250], ['music', 'Phòng nhạc', 930, 250],
  ['field', 'Sân bóng đá', 1900, 520], ['beach', 'Bãi biển', 900, 840], ['park', 'Công viên trí tuệ', 760, -200], ['lake', 'Hồ cá Koi & cắm trại', 3600, 560], ['dalat', 'Phố Đà Lạt', 3400, 640],
  ['farm', 'Nông trại', 4720, -80], ['sports', 'Khu thể thao (trượt ván, patin)', 2980, -80], ['library', 'Thư viện Tri Thức', 5800, 640], ['zen', 'Vườn thiền', 6640, 640], ['stadium', 'Sân vận động Olympic', 7430, 660],
  ['kart', 'Trường đua Rubik Kart', 9720, 672], ['pstreet', 'Phố nhà & cửa hàng người chơi', 9288, -48], ['academy', 'Học viện trí tuệ', 5650, -40], ['shopst', 'Phố mua sắm', 6500, -40], ['marina', 'Bến du thuyền', 6000, 790]
];
var PING = null, LEARN_T = 0;
function grantStarter(){ if(!PROF) return; if(!PROF.inv.bike1 && !PROF.equip.bike){ PROF.inv.bike1 = Date.now(); PROF.equip.bike = 'bike1'; toast('Nhà trường tặng bạn một chiếc Xe đạp mini! Bấm "Đạp xe" để đi khắp nơi.'); saveProfile(); } }
function autoWalk(id){
  if(!PLAYER || !PLAYER.visible){ openLogin(); return; }
  const D = DESTS.find(d => d[0] === id); if(!D) return;
  const lock = LOCKS.find(z => inside(z.r, D[2], D[3]) && PROF && PROF.level < z.lvl); if(lock){ toast(`${lock.name} cần Level ${lock.lvl}.`); return; }
  if(PLAYER.boat) leaveBoat(PLAYER); if(PLAYER.mount) dismount(PLAYER, true);
  PLAYER.controlled = false; PLAYER.planKey = 'auto'; PLAYER.queue = []; PLAYER.cur = null;
  PLAYER.path = planPath(PLAYER, regionAt(D[2], D[3]), [D[2], D[3]]); PLAYER.speed = PLAYER.cycling ? 170 : 95;
  PLAYER.autoDest = D; PLAYER.task = (PLAYER.cycling ? 'Đạp xe tới ' : 'Đang đi tới ') + D[1];
  select(PLAYER, false); followCam = true; if(cam.z < .6) cam.z = .8; clampCam();
  $('#dpad').hidden = false; $('#hint').textContent = `${PROF.name} đang tự đi tới ${D[1]} · bấm phím mũi tên để tự điều khiển`;
  toast(`${PROF.name} đang ${PLAYER.cycling ? 'đạp xe' : 'đi bộ'} tới ${D[1]}…`); updatePanel();
}
function cancelAuto(){ if(PLAYER && PLAYER.autoDest){ PLAYER.autoDest = null; PLAYER.path = []; PLAYER.planKey = null; } }
function takeKeys(){
  if(!PLAYER || !PLAYER.visible || PLAYER.inSub || openModal) return false;
  cancelAuto(); select(PLAYER, false); setControl(true); return agents.some(a => a.controlled);
}
function updateAuto(dt){
  if(!PLAYER || !PLAYER.visible) return;
  if((keys.up || keys.down || keys.left || keys.right) && !agents.some(a => a.controlled) && !openModal) takeKeys();
  if(PLAYER.autoDest && !PLAYER.controlled && !PLAYER.path.length && !PLAYER.flying){ const D = PLAYER.autoDest; PLAYER.autoDest = null; PLAYER.planKey = null; PLAYER.task = 'Đang ở ' + D[1]; select(PLAYER, false); setControl(true); toast(`Đã tới ${D[1]}!`); locateAgent(PLAYER, true); }
  if(!PROF) return;
  const rg = regionAt(PLAYER.x, PLAYER.y), atSchool = ['attend','rubik','hall','elec','chess','music','office','yard','rubikyard'].includes(rg) && PLAYER.x < 1572 && PLAYER.y > 30;
  if(atSchool && isDay() && PROF.attDay !== day){ PROF.attDay = day; reward(30, 10, 'Đi học, được cô Mic điểm danh'); log('event', `Cô Mic điểm danh: ${PROF.name} có mặt ở trường hôm nay.`, 'mic'); toast(`Cô Mic: "${PROF.name} có mặt!" +$10`); mprog('school'); saveProfile(); }
  if(['rubik','hall','elec'].includes(rg) && isDay()){ LEARN_T += dt; if(LEARN_T > 40){ LEARN_T = 0; reward(15, 0, 'Học bài trên lớp', true); floatText('Học bài +15 EXP', '#7cf29c'); mprog('learn'); } }
}
function locateAgent(a, quiet){
  if(!a || !a.visible){ toast('Người này chưa có mặt trên bản đồ.'); return; }
  followCam = a === PLAYER && a.controlled; cam.x = a.x; cam.y = a.y - 20; if(cam.z < .9) cam.z = 1.1; clampCam();
  PING = {x:a.x, y:a.y, t:4, a};
  if(!quiet) toast(`${a.name} đang ở ${whereText(a)}${a.cycling ? ' · đang đạp xe' : ''}`);
  updatePanel();
}
function locatePeer(p){
  const pr = p.presence || {}; if(pr.x == null){ toast(`${String(pr.n || 'Bạn ấy')} chưa vào bản đồ.`); return; }
  followCam = false; cam.x = +pr.x; cam.y = +pr.y - 20; if(cam.z < .9) cam.z = 1.1; clampCam(); PING = {x:+pr.x, y:+pr.y, t:4, peer:p.peer};
  toast(`${String(pr.n || 'Người chơi').slice(0, 20)} đang ở ${R[pr.rg] ? R[pr.rg].name : 'ngoài bản đồ'}`); if(openModal) hideModal(); updatePanel();
}
function drawPing(){
  if(!PING) return; PING.t -= .016; if(PING.t <= 0){ PING = null; return; }
  if(PING.a){ PING.x = PING.a.x; PING.y = PING.a.y; } if(PING.peer && OPOS[PING.peer]){ PING.x = OPOS[PING.peer].x; PING.y = OPOS[PING.peer].y; }
  for(let k=0;k<3;k++){ const r = ((realT*40 + k*18) % 54) + 6; ctx.strokeStyle = `rgba(255,210,63,${1 - r/60})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(PING.x, PING.y, r*1.4, r*.6, 0, 0, Math.PI*2); ctx.stroke(); }
  const b = Math.sin(realT*6)*4; ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(PING.x, PING.y - 50 + b); ctx.lineTo(PING.x - 8, PING.y - 64 + b); ctx.lineTo(PING.x + 8, PING.y - 64 + b); ctx.closePath(); ctx.fill();
}
// ---------- online avatars ----------
var OPOS = {}, lastPos = '';
const compactLook = () => { const L = lookWithEquip(); return {s:L.skin, hs:L.hs, hc:L.hc, sh:L.shirt, p:L.pants, sk:L.skirt ? 1 : 0, gl:L.glasses ? 1 : 0, o:L.outfit || '', h:L.hat || ''}; };
function posPresence(){
  if(!ONLINE.room || !PLAYER || !PLAYER.visible || !PROF) return;
  const x = Math.round(PLAYER.x), y = Math.round(PLAYER.y), key = `${x >> 3},${y >> 3},${PLAYER.cycling ? 1 : 0},${PLAYER.boat ? 1 : 0},${PLAYER.dir}`;
  if(key === lastPos) return; lastPos = key;
  ONLINE.room.presence({x, y, rg:regionAt(x, y), cy:PLAYER.cycling ? 1 : 0, bt:PLAYER.boat ? 1 : 0, d:PLAYER.dir, lk:compactLook(), n:PROF.name, l:PROF.level}).catch(() => {});
}
function onlineSprites(sp){
  (ONLINE.peers || []).forEach(p => { const pr = p.presence || {}; if(pr.x == null || pr.lk == null) return;
    const o = OPOS[p.peer] = OPOS[p.peer] || {x:+pr.x, y:+pr.y, walk:0}; const dx = +pr.x - o.x, dy = +pr.y - o.y, d = Math.hypot(dx, dy); if(d > 600){ o.x = +pr.x; o.y = +pr.y; } else { o.x += dx*.12; o.y += dy*.12; } o.moving = d > 2; if(o.moving) o.walk += .3;
    if(!inVB(o.x, o.y)) return;
    sp.push({y:o.y, f:() => { const lk = pr.lk || {}, f = lookFor(1); applyLook(f, {skin:+lk.s || 0, hs:String(lk.hs || 'short'), hc:+lk.hc || 0, shirt:String(lk.sh || '#3d7bff').slice(0, 9), pants:String(lk.p || '#24356b').slice(0, 9), skirt:!!lk.sk, glasses:!!lk.gl, outfit:String(lk.o || ''), hat:String(lk.h || '')});
      f.dir = pr.d < 0 ? -1 : 1; f.moving = o.moving; f.walk = o.walk; f.name = String(pr.n || 'Bạn').slice(0, 20);
      ctx.save(); ctx.translate(Math.round(o.x), Math.round(o.y)); if(pr.cy){ drawFancyBike(0, 0, ITEM.bike1, [], o.walk); ctx.translate(-1, -8); f.moving = false; } drawBody(f, !!pr.bt); ctx.restore();
      ctx.font = '13px VT323, monospace'; const t = `${f.name} · Lv ${+pr.l || 1}`, w = ctx.measureText(t).width + 8; ctx.fillStyle = 'rgba(10,15,34,.75)'; ctx.fillRect(o.x - w/2, o.y - 56, w, 13); ctx.fillStyle = '#26c6da'; ctx.textAlign = 'center'; ctx.fillText(t, o.x, o.y - 46); ctx.textAlign = 'left'; }}); });
}
function renderOnlineRoster(){
  const r = $('#roster'); if(!r) return; let box = $('#onlineRoster');
  if(!box){ box = el('div', {id:'onlineRoster'}); const anchor = PLAYER && PLAYER.btn ? PLAYER.btn.nextSibling : r.firstChild; r.insertBefore(box, anchor); }
  box.innerHTML = ''; const ps = (ONLINE.peers || []).filter(p => p.presence && p.presence.n);
  if(!ps.length) return; box.appendChild(el('h3', {}, 'Người chơi online'));
  ps.forEach(p => { const pr = p.presence, b = el('button', {type:'button', className:'who'}); b.innerHTML = '<span class="n"><span class="dot" style="background:#26c6da"></span><b></b></span><span class="t"></span>'; b.querySelector('b').textContent = `${String(pr.n).slice(0, 20)} · Lv ${+pr.l || 0}`; b.querySelector('.t').textContent = R[pr.rg] ? R[pr.rg].name : 'Chưa vào bản đồ'; b.onclick = () => locatePeer(p); box.appendChild(b); });
}
function miniExtra(g, k){
  (ONLINE.peers || []).forEach(p => { const pr = p.presence || {}; if(pr.x == null) return; g.fillStyle = '#26c6da'; g.fillRect(+pr.x - 40, +pr.y - 40, 80, 80); });
  if(PLAYER && PLAYER.visible){ g.fillStyle = '#fff'; g.fillRect(PLAYER.x - 70, PLAYER.y - 70, 140, 140); g.fillStyle = '#ffd23f'; g.fillRect(PLAYER.x - 50, PLAYER.y - 50, 100, 100); }
  if(PING){ g.strokeStyle = '#ffd23f'; g.lineWidth = 30; g.beginPath(); g.arc(PING.x, PING.y, 160 + Math.sin(realT*6)*40, 0, Math.PI*2); g.stroke(); }
}
function ext17Init(){
  const sel = $('#hDest'); DESTS.forEach(d => sel.appendChild(el('option', {value:d[0]}, d[1]))); sel.onchange = () => { if(sel.value){ autoWalk(sel.value); sel.value = ''; } };
  $('#hSchool').onclick = () => autoWalk('school');
  $('#hWhere').onclick = () => PLAYER ? locateAgent(PLAYER) : openLogin();
  setInterval(posPresence, 1000);
}

