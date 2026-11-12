// ================= EXT31 (v26): smoothness — adaptive resolution, area-based updates (off-screen work runs ~4×/s),
// cheaper daytime lighting; phone menu sheet at the top, bigger and grouped; area title when you arrive somewhere =================
var V26F = 0, V26ON = false;
const V26 = {fr:0, acc:{}, hiN:0, dpr:0, native:1, levels:[2, 1.5, 1.25, 1], li:0, area:null, areaT:0};
const v26Vis = (x, y, w, h, m) => VB.x1 > x - m && VB.x0 < x + w + m && VB.y1 > y - m && VB.y0 < y + h + m;
// off-screen people update 4×/s with the time they missed (like loading only the area you are in)
function v26Agent(a, dt){
  if(a.controlled || !a.visible || inVB(a.x, a.y) || Math.abs(a.x - cam.x) < 900){ if(a._v26){ dt += a._v26; a._v26 = 0; } updateAgent(a, dt); return; }
  a._v26 = (a._v26 || 0) + dt; if(((V26.fr + (a.idx || 0)) & 3) === 0){ const d = a._v26; a._v26 = 0; updateAgent(a, d); }
}
function v26Slow(key, fn, dtR, r){ // run every frame when on screen, otherwise every 4th frame with the summed time
  if(!r || v26Vis(r.x, r.y, r.w, r.h, 300)){ const d = (V26.acc[key] || 0) + dtR; V26.acc[key] = 0; fn(d); return; }
  V26.acc[key] = (V26.acc[key] || 0) + dtR; if((V26.fr & 3) === 0){ const d = Math.min(1, V26.acc[key]); V26.acc[key] = 0; fn(d); }
}
function v26Beam(a){ if(a <= .075 && weather !== 'suongmu' && !isStorm()) return false; const lx = LIGHTHOUSE[0]; return VB.x0 < lx + 1400 && VB.x1 > lx - 1400; }
// adaptive resolution: keep 60 fps by lowering the canvas pixel density a step when the device struggles
function v26Res(){
  const f = V25.fps || 60; if(V26.native <= 1) return; let li = V26.li;
  if(f < 50 && li < V26.levels.length - 1) li++; else if(f > 58){ if(++V26.hiN >= 12 && li > 0){ li--; V26.hiN = 0; } } else V26.hiN = 0;
  if(li === V26.li) return; V26.li = li; V26.dpr = Math.min(V26.native, V26.levels[li]); try { resize(); } catch(e){}
}
// area title card: shows the name of the area you just walked into
function v26AreaName(x, y){ let best = null; for(const k in R){ const r = R[k]; if(r && r.name && r.w && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h && (!best || r.w*r.h < best.w*best.h)) best = r; }
  if(best && best.w*best.h < 4e6) return best.name; if(y < NY) return typeof skyLayerAt === 'function' && skyLayerAt(y) ? skyLayerAt(y).n : 'Bầu trời'; if(y > 1010){ const o = typeof oceanAt === 'function' && oceanAt(y); return o ? o.n : 'Biển'; } return null; }
function v26Area(){
  if(!PLAYER || !PLAYER.visible) return; const n = v26AreaName(PLAYER.x, PLAYER.y); if(!V26.started){ V26.started = true; V26.area = n; return; } if(!n || n === V26.area) return; V26.area = n;
  const b = $('#v26Area'); if(!b) return; b.querySelector('b').textContent = n; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
function v26Update(){ V26.fr++; if((V26.fr & 15) === 0) v26Area(); if((V26.fr & 127) === 0) v26Res(); }
// phone menu sheet: grouped sections, opened at the top of the screen
const V26_GROUPS = [['🚶 Đi lại', ['hMe', 'hBike', 'hBoat', 'hFly', 'hSchool', 'hWhere', 'hDest']], ['🛍 Mua sắm & nhà', ['hMarket', 'hChal']], ['🕒 Thời gian', ['tSang', 'tTrua', 'tChieu', 'tToi']], ['⚙ Hệ thống', ['hSet', 'hOnline', 'hSound', 'hAdmin', 'ambName']]];
function v26Groups(){
  const q = $('#quick'), more = $('#mMore'); if(!q || !MOB.touch || q.querySelector('.qgrp')) return;
  V26_GROUPS.forEach(([title, ids]) => { const g = document.createElement('div'); g.className = 'qgrp'; const h = document.createElement('h4'); h.textContent = title; g.appendChild(h); const box = document.createElement('div'); box.className = 'qrow'; g.appendChild(box);
    ids.forEach(id => { const e = $('#' + id); if(e && e.parentNode === q) box.appendChild(e); }); if(box.childElementCount) q.insertBefore(g, more || null); });
  const rest = [...q.children].filter(e => !e.classList.contains('qgrp') && !e.classList.contains('mkeep') && e.id !== 'mMore');
  if(rest.length){ const g = document.createElement('div'); g.className = 'qgrp'; g.innerHTML = '<h4>✨ Khác</h4><div class="qrow"></div>'; rest.forEach(e => g.lastChild.appendChild(e)); q.insertBefore(g, more || null); }
}
function v26Init(){
  V26ON = true; V26.native = Math.min(2, window.devicePixelRatio || 1); V26.dpr = V26.native;
  try { Object.defineProperty(window, 'devicePixelRatio', {configurable:true, get(){ return V26.dpr || 1; }}); } catch(e){}
  const a = document.createElement('div'); a.id = 'v26Area'; a.setAttribute('role', 'status'); a.innerHTML = '<small>Bạn đã đến</small><b></b>'; stage.appendChild(a);
  v26Groups();
}
