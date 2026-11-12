// ================= EXT23 (v18): round minimap top-right, big map with click-to-guide route, keyboard zoom, compact HUD, mission tracker =================
let GUIDE = null;
const BM = {cx:W/2, cy:0, z:.1, drag:null, moved:false};
const RM_SPAN = 2600;
function rmLayers(g, x0, y0, x1, y1){
  g.fillStyle = S().sea; g.fillRect(x0, Math.max(y0, 880), x1 - x0, y1 - Math.max(y0, 880));
  if(y0 < NY){ const gr = g.createLinearGradient(0, Y0, 0, NY); gr.addColorStop(0, '#000006'); gr.addColorStop(.2, '#0b0b2e'); gr.addColorStop(.55, '#1e3f9a'); gr.addColorStop(.85, '#4f8ee0'); gr.addColorStop(1, SKYST ? rgb(SKYST.hor) : '#9fd4ff'); g.fillStyle = gr; g.fillRect(x0, Math.max(Y0, y0), x1 - x0, Math.min(NY, y1) - Math.max(Y0, y0)); }
  if(groundCache) g.drawImage(groundCache, 0, 0); if(northCache) g.drawImage(northCache, 0, NY); g.fillStyle = S().sand; g.fillRect(0, 790, W, 80);
}
function rmGuide(g, lw){
  if(!GUIDE) return; const pts = guidePts(); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = 'rgba(10,15,34,.85)'; g.lineWidth = lw*1.8; g.setLineDash([]); g.stroke(); g.strokeStyle = '#ffd23f'; g.lineWidth = lw; g.setLineDash([lw*2.5, lw*1.2]); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#ef4b4b'; g.beginPath(); g.arc(GUIDE.x, GUIDE.y, lw*3, 0, Math.PI*2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(GUIDE.x, GUIDE.y, lw*1.2, 0, Math.PI*2); g.fill();
}
// round minimap: a local view around the player, rendered into the existing #mini canvas
function rmRender(){
  const r = miniCv.getBoundingClientRect(); if(!r.width) return true; const dpr = Math.min(2, window.devicePixelRatio || 1);
  if(miniCv.width !== Math.round(r.width*dpr) || miniCv.height !== Math.round(r.height*dpr)){ miniCv.width = Math.round(r.width*dpr); miniCv.height = Math.round(r.height*dpr); }
  const me = PLAYER && PLAYER.visible ? PLAYER : null, cx = me ? me.x : cam.x, cy = me ? me.y : cam.y, k = r.width/RM_SPAN, g = miniCtx;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0a0f22'; g.fillRect(0, 0, miniCv.width, miniCv.height);
  g.setTransform(dpr*k, 0, 0, dpr*k, dpr*(r.width/2 - cx*k), dpr*(r.height/2 - cy*k));
  rmLayers(g, cx - RM_SPAN, cy - RM_SPAN, cx + RM_SPAN, cy + RM_SPAN);
  agents.forEach(a => { if(!a.visible || a === me) return; g.fillStyle = a.student ? a.bag : '#ffffff'; g.fillRect(a.x - 18, a.y - 18, 36, 36); });
  (ONLINE.peers || []).forEach(p => { const pr = p.presence || {}; if(pr.x == null) return; g.fillStyle = '#26c6da'; g.beginPath(); g.arc(+pr.x, +pr.y, 34, 0, Math.PI*2); g.fill(); });
  rmGuide(g, 3.2/k);
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2/k; g.strokeRect(cam.x - cw/cam.z/2, cam.y - ch/cam.z/2, cw/cam.z, ch/cam.z);
  g.setTransform(dpr, 0, 0, dpr, 0, 0); const mx = r.width/2, my = r.height/2, d = me ? me.dir : 1;
  g.fillStyle = '#ffd23f'; g.strokeStyle = '#0a0f22'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx + 9*d, my); g.lineTo(mx - 6*d, my - 7); g.lineTo(mx - 3*d, my); g.lineTo(mx - 6*d, my + 7); g.closePath(); g.fill(); g.stroke();
  g.font = 'bold 13px VT323, monospace'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('B', mx, 14); g.textAlign = 'left';
  if(GUIDE){ const dx = GUIDE.x - cx, dy = GUIDE.y - cy, dd = Math.hypot(dx, dy); if(dd*k > r.width/2 - 8){ const a = Math.atan2(dy, dx), R0 = r.width/2 - 12; g.fillStyle = '#ef4b4b'; g.beginPath(); g.arc(mx + Math.cos(a)*R0, my + Math.sin(a)*R0, 6, 0, Math.PI*2); g.fill(); } }
  return true;
}
// ---------- big map: drag to pan, wheel to zoom, click to set a guided route ----------
function openBigMap(){ showModal('mBigMap'); const cv = $('#bmCv'); BM.z = cv.width/W; BM.cx = W/2; BM.cy = PLAYER && PLAYER.visible ? Math.max(-2600, Math.min(2600, PLAYER.y)) : 0; bmDraw(); bmDestList(); }
function bmToWorld(e){ const cv = $('#bmCv'), b = cv.getBoundingClientRect(), sx = (e.clientX - b.left)*cv.width/b.width, sy = (e.clientY - b.top)*cv.height/b.height; return [BM.cx + (sx - cv.width/2)/BM.z, BM.cy + (sy - cv.height/2)/BM.z]; }
function bmClamp(){ const cv = $('#bmCv'); BM.z = Math.max(cv.width/W*.9, Math.min(1.2, BM.z)); const hw = cv.width/2/BM.z, hh = cv.height/2/BM.z; BM.cx = Math.max(Math.min(hw, W/2), Math.min(W - Math.min(hw, W/2), BM.cx)); BM.cy = Math.max(Y0 + Math.min(hh, (H - Y0)/2), Math.min(H - Math.min(hh, (H - Y0)/2), BM.cy)); }
function bmDraw(){
  const cv = $('#bmCv'); if(!cv || cv.closest('.modal').hidden) return; bmClamp(); const g = cv.getContext('2d'), z = BM.z;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0a0f22'; g.fillRect(0, 0, cv.width, cv.height);
  g.setTransform(z, 0, 0, z, cv.width/2 - BM.cx*z, cv.height/2 - BM.cy*z); rmLayers(g, 0, Y0, W, H);
  // sky & ocean layer names
  g.font = `${Math.round(16/z)}px VT323, monospace`; g.fillStyle = 'rgba(255,255,255,.7)';
  (typeof SKYL !== 'undefined' ? SKYL : []).forEach(l => g.fillText('☁ ' + l.n, 60, l.y1 - 30));
  (typeof OCEAN !== 'undefined' ? OCEAN : []).forEach(o => g.fillText('🌊 ' + o.n, 60, o.y0 + 60/z));
  // region names (only the specific places)
  if(z > .07){ g.font = `${Math.round(13/z)}px VT323, monospace`; Object.values(R).forEach(r => { if(!r || !r.name || r.w*r.h > 1.6e6) return; const tw = g.measureText(r.name).width; g.fillStyle = 'rgba(10,15,34,.72)'; g.fillRect(r.x + r.w/2 - tw/2 - 3/z, r.y + r.h/2 - 12/z, tw + 6/z, 16/z); g.fillStyle = '#fff8e1'; g.fillText(r.name, r.x + r.w/2 - tw/2, r.y + r.h/2); }); }
  (ONLINE.peers || []).forEach(p => { const pr = p.presence || {}; if(pr.x == null) return; g.fillStyle = '#26c6da'; g.beginPath(); g.arc(+pr.x, +pr.y, 8/z, 0, Math.PI*2); g.fill(); g.font = `${Math.round(13/z)}px VT323, monospace`; g.fillText(String(pr.n || '').slice(0, 14), +pr.x + 10/z, +pr.y); });
  rmGuide(g, 6/z);
  if(PLAYER && PLAYER.visible){ g.fillStyle = '#ffd23f'; g.strokeStyle = '#0a0f22'; g.lineWidth = 3/z; g.beginPath(); g.arc(PLAYER.x, PLAYER.y, 9/z, 0, Math.PI*2); g.fill(); g.stroke(); g.font = `${Math.round(15/z)}px VT323, monospace`; g.fillStyle = '#ffd23f'; g.fillText('Bạn', PLAYER.x + 12/z, PLAYER.y - 8/z); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(10,15,34,.8)'; g.fillRect(8, 8, 330, 26); g.fillStyle = '#fff'; g.font = '17px VT323, monospace'; g.fillText('Lăn chuột: phóng to · Kéo: di chuyển · Bấm: chỉ đường', 14, 26);
}
function bmDestList(){ const box = $('#bmDests'); if(!box || box.childElementCount) return; DESTS.forEach(d => { if(d[0] === 'guide') return; const b = el('button', {type:'button'}, d[1]); b.onclick = () => setGuide(d[2], d[3], d[1]); box.appendChild(b); }); }
function guidePts(){ const me = PLAYER && PLAYER.visible ? [PLAYER.x, PLAYER.y] : [cam.x, cam.y]; return [me].concat(GUIDE.pts || [[GUIDE.x, GUIDE.y]]); }
const onLand = (x, y) => y > NY + 20 && y < 1010;
function placeName(x, y){ let best = null; Object.values(R).forEach(r => { if(r && r.name && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h && (!best || r.w*r.h < best.w*best.h)) best = r; }); if(best && best.w*best.h < 4e6) return best.name; if(y < NY) { const l = typeof skyLayerAt === 'function' && skyLayerAt(y); return l ? l.n : 'Bầu trời'; } if(y > 1010){ const o = typeof oceanAt === 'function' && oceanAt(y); return o ? o.n : 'Biển'; } return 'Điểm đã chọn'; }
function setGuide(x, y, name){
  x = Math.max(10, Math.min(W - 10, x)); y = Math.max(Y0 + 40, Math.min(H - 20, y)); name = name || placeName(x, y);
  let pts = null, how = '';
  if(PLAYER && PLAYER.visible && !PLAYER.v16fly && !PLAYER.boat && onLand(PLAYER.x, PLAYER.y) && onLand(x, y)){ try { pts = planPath({x:PLAYER.x, y:PLAYER.y}, regionAt(x, y), [x, y]).map(p => [p[0], p[1]]); if(!pts.length || Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - y) > 5) pts.push([x, y]); } catch(e){ pts = null; } }
  if(!pts) pts = [[x, y]];
  if(y < NY) how = ' Bấm "🎈 Bay lên trời" rồi bay theo đường vàng.'; else if(y > 1010) how = ' Hãy lên thuyền (hoặc bay khinh khí cầu) để ra biển.';
  GUIDE = {x, y, pts, name}; toast(`Đường tới ${name} đã hiện màu vàng trên bản đồ.${how}`); $('#bmGo').disabled = !(onLand(x, y) && PLAYER && PLAYER.visible); $('#bmInfo').textContent = 'Đích: ' + name; bmDraw(); try { mprog('map'); } catch(e){}
}
function guideWalk(){ if(!GUIDE) return; let D = DESTS.find(d => d[0] === 'guide'); if(!D){ D = ['guide', '', 0, 0]; DESTS.push(D); } D[1] = GUIDE.name; D[2] = GUIDE.x; D[3] = GUIDE.y; hideModal(); autoWalk('guide'); }
function guideUpdate(){ if(!GUIDE || !PLAYER || !PLAYER.visible) return; const pts = GUIDE.pts; while(pts.length > 1 && Math.hypot(pts[0][0] - PLAYER.x, pts[0][1] - PLAYER.y) < 50) pts.shift();
  if(Math.hypot(GUIDE.x - PLAYER.x, GUIDE.y - PLAYER.y) < 60){ toast(`Đã tới ${GUIDE.name}!`); blipSfx(1320); GUIDE = null; } }
// world overlay: animated dashed route + target pin
function drawGuideWorld(){ if(!GUIDE) return; const pts = guidePts(), off = -(realT*40) % 30, lw = Math.max(6, 7/cam.z);
  ctx.save(); ctx.strokeStyle = 'rgba(10,15,34,.6)'; ctx.lineWidth = lw + 3; ctx.setLineDash([lw*3, lw*2]); ctx.lineDashOffset = off; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([]); const pulse = 1 + .25*Math.sin(realT*5);
  ctx.strokeStyle = '#ef4b4b'; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(GUIDE.x, GUIDE.y, 18*pulse, 0, Math.PI*2); ctx.stroke(); circ(GUIDE.x, GUIDE.y - 22, 9, '#ef4b4b'); tri(GUIDE.x - 8, GUIDE.y - 18, GUIDE.x + 8, GUIDE.y - 18, GUIDE.x, GUIDE.y - 4, '#ef4b4b'); circ(GUIDE.x, GUIDE.y - 22, 3.5, '#fff');
  ctx.restore(); plate(GUIDE.name, GUIDE.x, GUIDE.y - 46); }
// ---------- mission tracker on the right ----------
function trackRender(){ const box = $('#mtrackList'); if(!box) return; const left = MISSIONS.filter(m => !mstate[m.id + '_done']), done = MISSIONS.length - left.length; $('#mtrackN').textContent = `${done}/${MISSIONS.length}`;
  const html = left.slice(0, document.body.classList.contains('v32phone') ? 999 : 6).map(m => { const p = m.goal ? Math.min(1, (mstate[m.id] || 0)/m.goal) : 0; return `<li><span>${m.t.replace(/[<>&]/g, '')}</span>${m.goal ? `<i><b style="width:${Math.round(p*100)}%"></b></i><small>${Math.floor(mstate[m.id] || 0)}/${m.goal}</small>` : ''}</li>`; }).join('') || '<li>Bạn đã hoàn thành mọi nhiệm vụ!</li>';
  if(box.innerHTML !== html) box.innerHTML = html; }
// ---------- keyboard zoom & map key ----------
function v18Key(e){ const tg = e.target && e.target.tagName; if(openModal || tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return;
  if(e.code === 'Equal' || e.code === 'NumpadAdd' || e.key === '+'){ zoomAt(1.15, cw/2, ch/2); e.preventDefault(); }
  else if(e.code === 'Minus' || e.code === 'NumpadSubtract' || e.key === '-'){ zoomAt(.87, cw/2, ch/2); e.preventDefault(); }
  else if(e.code === 'KeyM'){ openBigMap(); e.preventDefault(); } }
function v18Init(){
  const cv = $('#bmCv');
  cv.addEventListener('wheel', e => { e.preventDefault(); const [wx, wy] = bmToWorld(e); BM.z *= e.deltaY < 0 ? 1.18 : .85; bmClamp(); const [nx, ny] = bmToWorld(e); BM.cx += wx - nx; BM.cy += wy - ny; bmDraw(); }, {passive:false});
  cv.addEventListener('pointerdown', e => { BM.drag = [e.clientX, e.clientY, BM.cx, BM.cy]; BM.moved = false; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if(!BM.drag) return; const b = cv.getBoundingClientRect(), dx = (e.clientX - BM.drag[0])*cv.width/b.width, dy = (e.clientY - BM.drag[1])*cv.height/b.height; if(Math.abs(dx) + Math.abs(dy) > 6) BM.moved = true; if(BM.moved){ BM.cx = BM.drag[2] - dx/BM.z; BM.cy = BM.drag[3] - dy/BM.z; bmDraw(); } });
  cv.addEventListener('pointerup', e => { const was = BM.drag; BM.drag = null; if(was && !BM.moved){ const [x, y] = bmToWorld(e); setGuide(x, y); } });
  $('#bmGo').onclick = guideWalk; $('#bmClear').onclick = () => { GUIDE = null; $('#bmInfo').textContent = 'Chưa chọn điểm đến'; bmDraw(); };
  $('#mtrackHead').onclick = () => { renderMissions(); showModal('mMissions'); };
  $('#mtrackFold').onclick = e => { e.stopPropagation(); const l = $('#mtrackList'), h = !l.hidden; l.hidden = h; $('#mtrackFold').textContent = h ? '▸' : '▾'; try { localStorage.setItem('truong-mtrack-fold', h ? '1' : ''); } catch(err){} };
  try { if(localStorage.getItem('truong-mtrack-fold')){ $('#mtrackList').hidden = true; $('#mtrackFold').textContent = '▸'; } } catch(e){}
  
  const ct = $('#camToggle'); if(ct && ct.getAttribute('aria-expanded') === 'true') ct.click();
  setInterval(() => { trackRender(); guideUpdate(); if(!$('#mBigMap').hidden) bmDraw(); }, 500); trackRender();
}
// ---------- open world: walk anywhere and the world follows — north edge lifts you into the sky, the shore puts you on a boat ----------
const OW = {prevY:null, cool:0};
function openWorldTick(dt){
  const c = agents.find(a => a.controlled); OW.cool = Math.max(0, OW.cool - dt); if(!c || !c.isPlayer || paused) { OW.prevY = null; return; }
  const moving = keys.up || keys.down || keys.left || keys.right; if(moving && !followCam && !openModal){ followCam = true; select(c, false); }
  if(OW.cool > 0){ OW.prevY = c.y; return; }
  if(!c.v16fly && !c.boat && !c.inSub && keys.up && c.y < NY + 30){ OW.cool = 1.5; flyToggle(); toast('Bạn đi tới mép trời: khinh khí cầu cất cánh! Cứ bay lên để khám phá 5 tầng trời.'); }
  else if(c.v16fly && !c.glide && OW.prevY != null && OW.prevY < NY + 30 && c.y >= NY + 30 && c.y < 860 && canMove(c.x, c.y, c.x, c.y)){ OW.cool = 1.5; flyLand(); }
  else if(!c.v16fly && !c.boat && !c.inSub && keys.down && c.y > 960){ OW.cool = 1.5; boardBoat(); if(c.boat){ c.boat.h = Math.PI/2; c.boat.v = 60; } }
  else if(c.boat && c.y < 918 && Math.sin(c.boat.h) < -.3 && c.boat.v > 10){ OW.cool = 1.5; leaveBoat(c); toast('Cập bờ! Tiếp tục đi bộ khám phá.'); }
  OW.prevY = c.y;
}

