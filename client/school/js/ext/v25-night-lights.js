// ================= EXT30 (v25): time & night light — self-recovering falls, ×10 game clock, time-of-day buttons,
// brighter nights with cached light sprites, hand lanterns, bike headlights, night fishing fleet =================
var V25MK = 1; // movement factor so people walk at normal speed whatever the clock speed
const V25 = {mode:'x10', fps:60, fpsAcc:0, fpsN:0, fpsT:0, low:false, wslot:-1, dust:[], lastDay:-1, before:0, stopClock:false,
  n:0, LX:new Float32Array(160), LY:new Float32Array(160), LR:new Float32Array(160), LA:new Float32Array(160), LK:new Uint8Array(160), LT:new Float32Array(160)};
const V25_TIMES = [['tSang', '☀️ Sáng', 420, 'Sáng', 'Digit1'], ['tTrua', '🌞 Trưa', 720, 'Trưa', 'Digit2'], ['tChieu', '🌇 Chiều', 990, 'Chiều', 'Digit3'], ['tToi', '🌙 Tối', 1170, 'Tối', 'Digit4']];
const V25_MPS = {x1:1/60, x10:10/60, x30:30/60};
// ---------- 1. falls: one shared mechanism, real-time recovery ----------
function v25StandUp(a, quiet){
  if(!a) return; const was = a.fallen > clock || a.downUntil != null; a.fallen = 0; a.downUntil = null; a.downSince = null; a.shocked = 0;
  if(was){ a.getUpT = realT; a.planKey = null; if(!a.isPlayer) a.cur = null; if(V25.dust.length < 40) for(let k=0;k<6;k++) V25.dust.push({x:a.x + (Math.random() - .5)*18, y:a.y - 2, vx:(Math.random() - .5)*30, t:.6}); if(!quiet && a.isPlayer) toast('Đứng dậy rồi! Tiếp tục khám phá nào.'); }
}
function v25FallTick(){
  agents.forEach(a => { if(a.downUntil != null && realT >= a.downUntil) v25StandUp(a, true); else if(a.fallen > clock && a.downUntil == null){ a.downUntil = realT + 2 + Math.random()*2; a.downSince = realT; } });
}
function v25Watchdog(){ agents.forEach(a => { if(down(a) && (a.downSince == null || realT - a.downSince > 10)) v25StandUp(a, true); if(a.flying && a.flying.t > 8){ a.flying = null; a.lift = 0; a.y = Math.min(a.y, 760); v25StandUp(a, true); } }); }
// ---------- 2. game clock ×1 / ×10 / ×30 / stop ----------
function v25Weather(){
  if(!SETTINGS.weatherHourly) return; const slot = day*8 + Math.floor(clock/180); if(slot === V25.wslot) return; V25.wslot = slot;
  const wts = Object.assign({}, W_WEIGHTS[season]); ['songthan', 'dongdat', 'sieubao'].forEach(k => delete wts[k]); let tot = 0; for(const k in wts) tot += wts[k];
  let r = Math.random()*tot, choice = 'nang'; for(const k in wts){ r -= wts[k]; if(r <= 0){ choice = k; break; } } setWeather(choice, false); weatherUntil = 1e9;
}
function v25AfterSim(){
  if(!REALT.on) return; if(V25.mode === 'stop' && V25.stopClock){ clock = V25.before; return; }
  if(V25.mode !== 'x10' && V25.mode !== 'x30') return;
  if(clock >= 1440){ const keep = clock - 1440; agents.forEach(a => { if(a.isPlayer) return; if(a.id !== 'nam') hide(a); a.controlled = false; }); fade = 1; newDay(false); clock = keep; lastBrainMin = -1;
    if(SETTINGS.seasonDaily){ const s = SEASON_ORDER[((day % 4) + 4) % 4]; if(s !== season) setSeason(s, true); } }
  v25Weather();
}
function v25Mode(m){ V25.mode = m; SETTINGS.tscale = m; setSave(); REALT.on = true; SETTINGS.realtime = true; if(m === 'x1'){ clock = realMin(); lastBrainMin = -1; REALT.hour = -1; rtSync(); } V25.wslot = -1; updatePanel(); }
// ---------- 3. time of day buttons ----------
function v25SetTime(min, label){
  const f = $('#v25Fade'); if(f){ f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  setTimeout(() => {
    if(V25.mode === 'x1') v25Mode('x10'); clock = min; lastBrainMin = -1; agents.forEach(a => v25StandUp(a, true));
    try { runBrains(); lastBrainMin = Math.floor(clock); } catch(e){}
    agents.forEach(a => { if(!a.visible || a.isPlayer || a.controlled || !a.path || !a.path.length) return; const e = a.path[a.path.length - 1]; if(Math.hypot(e[0] - a.x, e[1] - a.y) > 350){ a.x = e[0]; a.y = e[1]; a.path.length = 0; } });
    V25.wslot = -1; v25Weather(); updatePanel(); toast(`Đã chuyển sang buổi ${label} – ${String(Math.floor(min/60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  }, 200);
}
// ---------- 4–8. light sprites (drawn once, reused) ----------
const SPR = {};
function v25Spr(){
  if(SPR.cut) return; const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return c; };
  const rad = (r, g, b, a) => mk(128, 128, x => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${r},${g},${b},${a})`); gr.addColorStop(.45, `rgba(${r},${g},${b},${a*.55})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); });
  SPR.cut = rad(255, 255, 255, 1); SPR.warm = rad(255, 178, 92, .5); SPR.cool = rad(190, 228, 255, .6); SPR.red = rad(255, 60, 60, .7); SPR.green = rad(60, 255, 120, .7);
  const cone = (r, g, b, a) => mk(256, 128, x => { const gr = x.createRadialGradient(0, 64, 0, 0, 64, 256); gr.addColorStop(0, `rgba(${r},${g},${b},${a})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; const t = Math.tan(20*Math.PI/180); x.beginPath(); x.moveTo(0, 60); x.lineTo(256, 64 - 256*t); x.lineTo(256, 64 + 256*t); x.lineTo(0, 68); x.closePath(); x.fill(); });
  SPR.cone = cone(255, 255, 255, 1); SPR.coneW = cone(255, 236, 180, .45);
  SPR.lantern = mk(12, 20, x => { x.fillStyle = '#2b2b2b'; x.fillRect(5, 0, 2, 3); x.fillRect(3, 2, 6, 2); x.fillRect(2, 4, 8, 2); x.fillStyle = '#ffd54f'; x.fillRect(3, 6, 6, 9); x.fillStyle = '#fff8e1'; x.fillRect(5, 8, 2, 4); x.fillStyle = '#2b2b2b'; x.fillRect(2, 6, 1, 9); x.fillRect(9, 6, 1, 9); x.fillRect(2, 15, 8, 3); x.fillStyle = '#5d4037'; x.fillRect(4, 18, 4, 2); });
  SPR.ground = mk(64, 20, x => { const gr = x.createRadialGradient(32, 10, 0, 32, 10, 32); gr.addColorStop(0, 'rgba(255,190,100,.5)'); gr.addColorStop(1, 'rgba(255,190,100,0)'); x.fillStyle = gr; x.save(); x.scale(1, .31); x.fillRect(0, 0, 64, 64); x.restore(); });
  SPR.dc = document.createElement('canvas'); SPR.dcx = SPR.dc.getContext('2d');
}
function v25Push(x, y, r, a, k){ if(V25.n >= 120) return; if(x < VB.x0 - 100 - r || x > VB.x1 + 100 + r || y < VB.y0 - 100 - r || y > VB.y1 + 100 + r) return; const i = V25.n++; V25.LX[i] = x; V25.LY[i] = y; V25.LR[i] = r; V25.LA[i] = a; V25.LK[i] = k; }
const v25Ramp = (t, on, off) => { if(t >= on) return Math.min(1, (t - on)/8); if(t < off) return Math.min(1, (off - t)/8); return 0; };
const v25LanternTime = () => clock >= 1095 || clock < 330;
function v25Holds(a){ return a.visible && !a.inSub && !a.boat && !a.flying && !a.v16fly && !a.cycling && !a.mount && !(a.task && a.task.startsWith('Ngủ') && !a.moving) && !indoor(a) && a.y < 880; }
function v25Riding(a){ return a.visible && !down(a) && !a.flying && (a.cycling || (a.bike && regionAt(a.x, a.y) === 'road') || (a.task && a.task.startsWith('Đạp xe quanh'))); }
function v25BikeAng(a){
  let tx = null, ty = null; if(a.isPlayer && a.controlled){ const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0); if(dx || dy){ tx = dx; ty = dy; } }
  else if(a.path && a.path.length){ tx = a.path[0][0] - a.x; ty = a.path[0][1] - a.y; }
  const target = tx !== null ? Math.atan2(ty, tx) : (a.hAng != null ? a.hAng : (a.dir < 0 ? Math.PI : 0)); if(a.hAng == null) a.hAng = target;
  let d = target - a.hAng; while(d > Math.PI) d -= 2*Math.PI; while(d < -Math.PI) d += 2*Math.PI; a.hAng += d*.15; return a.hAng;
}
function v25Collect(dk){
  V25.n = 0; const t = clock, lamp = v25Ramp(t, 1080, 330), lan = SETTINGS.lantern !== false && v25LanternTime(), fl = !V25.low;
  // bike headlights first (most important), then lanterns of nearby people
  if(v25LanternTime()) agents.forEach((a, i) => { if(!v25Riding(a)) return; v25Push(a.x + (a.dir < 0 ? -10 : 10), a.y - 18, 72*(1 + (fl ? .04*Math.sin(realT*7 + i) : 0)), 1, 1); });
  if(lan) agents.forEach((a, i) => { if(!v25Holds(a)) return; const r = 70*(1 + (fl ? .04*Math.sin(realT*7 + i*1.7) : 0)); v25Push(a.x + (down(a) ? a.dir*14 : a.dir*8), a.y - (down(a) ? 4 : 12), r, 1, 1); });
  if(lan) npcs.forEach((n, i) => { if(!npcShown(n) || n.y > 880) return; v25Push(n.x + 8, n.y - 12, 66*(1 + (fl ? .04*Math.sin(realT*6 + i) : 0)), 1, 1); });
  if(lamp > 0) LAMPS.forEach(([x, y], i) => { const on = v25Ramp(t, 1080 + (i*13) % 40, 330 - (i*11) % 25); if(on > 0) v25Push(x, y - 30, 120, on, 2); });
  if(lamp > 0){ ['rubik', 'chess', 'music', 'hall', 'office', 'elec'].forEach((k, i) => { const r = R[k]; if(!r) return; const on = v25Ramp(t, 1080 + i*5, 340); if(on > 0) v25Push(r.x + r.w/2, r.y + r.h/2, Math.max(r.w, r.h)*.62, on*.9, 3); });
    v25Push(GATE[0] + 14, GATE[1] - 20, 90, lamp, 2);
    students.forEach((s, i) => { if(s.visible || !s.home) return; const h = s.home, on = v25Ramp(t, 1084 + (i*7) % 50, 330 - (i*5) % 30); if(on > 0) v25Push(h.x + h.w/2, h.y + h.h*.6, 60, on, 4); });
    if(typeof HOUSES !== 'undefined') HOUSES.forEach((h, i) => { const on = v25Ramp(t, 1090 + (i*9) % 45, 320); if(on > 0) v25Push(h.x + h.w/2, h.y + h.h*.6, Math.max(50, h.w*.6), on, 4); });
    DALAT.forEach((h, i) => { const on = v25Ramp(t, 1086 + (i*11) % 45, 325); if(on > 0) v25Push(h.x + h.w/2, h.y + h.h*.55, 55, on, 4); }); }
  if(v25FleetVis() > 0) FLEET.forEach((b, i) => { if(i >= (V25.low ? 6 : FLEET.length) || !b.vis) return; v25Push(b.x, b.y - 30, 150, b.vis, 5); });
  ships.forEach(s => v25Push(s.x, s.y - 20, s.k === 'pirate' ? 90 : 110, 1, s.k === 'pirate' ? 6 : 5));
  if(sub && sub.state !== 'dock') v25Push(sub.x, sub.y, 90, 1, 5);
  if(PLAYER && PLAYER.boat) v25Push(PLAYER.x, PLAYER.y - 10, 120, 1, 5);
}
function v25Dark(d){
  if(typeof FEED !== 'undefined' && FEED) return false; v25Spr();
  const dk = Math.min(.42, d*.66); if(dk <= .01) return true;
  v25Collect(dk);
  const k = V25.low ? .5 : 1, DW = Math.max(1, Math.round(cvs.width*k)), DH = Math.max(1, Math.round(cvs.height*k));
  const dc = SPR.dc, x = SPR.dcx; if(dc.width !== DW || dc.height !== DH){ dc.width = DW; dc.height = DH; }
  const s = DPR*k*cam.z, ox = DPR*k*(cw/2 - cam.x*cam.z), oy = DPR*k*(ch/2 - cam.y*cam.z), nyS = Math.max(0, NY*s + oy);
  x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, DW, DH); x.fillStyle = `rgba(20,18,62,${dk})`; x.fillRect(0, nyS, DW, DH - nyS);
  x.globalCompositeOperation = 'destination-out';
  for(let i=0;i<V25.n;i++){ const sx = V25.LX[i]*s + ox, sy = V25.LY[i]*s + oy, r = V25.LR[i]*s; x.globalAlpha = Math.min(1, V25.LA[i]*(V25.LK[i] === 3 ? 1 : .95));
    if(V25.LK[i] === 9){ x.save(); x.translate(sx, sy); x.rotate(V25.LT[i]); x.drawImage(SPR.cone, 0, -r*.5, r, r); x.restore(); x.drawImage(SPR.cut, sx - 18*s, sy - 18*s, 36*s, 36*s); }
    else x.drawImage(SPR.cut, sx - r, sy - r, r*2, r*2); }
  // warm / cool halos go into the same small layer (cheap: no full-screen additive blending on the main canvas)
  x.globalCompositeOperation = 'source-over';
  for(let i=0;i<V25.n;i++){ const kd = V25.LK[i], sx = V25.LX[i]*s + ox, sy = V25.LY[i]*s + oy, r = V25.LR[i]*s; x.globalAlpha = Math.min(1, V25.LA[i]*dk*1.5);
    if(kd === 1){ x.drawImage(SPR.warm, sx - r*.7, sy - r*.7, r*1.4, r*1.4); x.drawImage(SPR.ground, sx - 26*s, sy + 6*s, 52*s, 16*s); }
    else if(kd === 4 || kd === 2){ x.drawImage(SPR.warm, sx - r*.55, sy - r*.55, r*1.1, r*1.1); }
    else if(kd === 9){ x.save(); x.translate(sx, sy); x.rotate(V25.LT[i]); x.drawImage(SPR.coneW, 0, -r*.5, r, r); x.restore(); }
    else if(kd === 5){ x.drawImage(SPR.cool, sx - r*.45, sy - r*.45, r*.9, r*.9); }
    else if(kd === 6){ x.drawImage(SPR.red, sx - r*.4, sy - r*.4, r*.8, r*.8); } }
  x.globalAlpha = 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = !V25.low; ctx.drawImage(dc, 0, 0, cvs.width, cvs.height); ctx.restore();
  v25FleetLights(dk); v25Lanterns(); v25BikeLights();
  return true;
}
function v25Lanterns(){
  if(SETTINGS.lantern === false || !v25LanternTime()) return; const put = (X, Y, sw) => { ctx.save(); ctx.translate(X, Y); ctx.rotate(sw); ctx.drawImage(SPR.lantern, -6, 0, 12, 20); ctx.restore(); };
  agents.forEach(a => { if(!v25Holds(a) || !inVB(a.x, a.y)) return; if(down(a)) put(a.x + a.dir*14, a.y - 14, 0); else put(a.x + a.dir*8, a.y - 22, a.moving ? Math.sin(a.walk*1.3)*.25 : Math.sin(realT*1.5 + a.idx)*.05); });
  npcs.forEach(n => { if(!npcShown(n) || n.y > 880 || !inVB(n.x, n.y)) return; put(n.x + 8, n.y - 22, Math.sin(realT*2 + n.idx)*.08); });
}
function v25BikeLights(){ if(!v25LanternTime()) return; agents.forEach(a => { if(!v25Riding(a) || !inVB(a.x, a.y)) return; ctx.save(); ctx.translate(a.x + (a.dir < 0 ? -10 : 10), a.y - 28); ctx.rotate(Math.sin(realT*6 + (a.idx || 0))*.12); ctx.drawImage(SPR.lantern, -5, 0, 10, 17); ctx.restore(); }); }
// ---------- 7. night fishing fleet ----------
const FLEET = []; (function(){ for(let i=0;i<16;i++){ const c = i % 2, bx = c ? 6400 : 3100; FLEET.push({hx:bx + (Math.sin(i*12.9898)*.5)*900, hy:(c ? 1330 : 1230) + (Math.cos(i*78.233)*.5)*160, x:0, y:0, vis:0, ph:i*.9, bulbs:3 + (i % 4), dx:(i % 3 - 1)*.6}); } })();
const FLEET_DOCK = [[1395, 975], [1460, 985], [1525, 978]];
function v25FleetVis(){ const t = clock; if(t >= 1140) return Math.min(1, (t - 1140)/20); if(t < 300) return 1; if(t < 340) return 1 - (t - 300)/40; return 0; }
function v25FleetUpdate(dt){
  const v = v25FleetVis(), back = clock >= 300 && clock < 340 ? (clock - 300)/40 : 0;
  FLEET.forEach((b, i) => { b.hx += b.dx*dt*6; if(b.hx < 600) b.dx = Math.abs(b.dx); if(b.hx > W - 600) b.dx = -Math.abs(b.dx);
    const d = FLEET_DOCK[i % 3]; b.x = b.hx + (d[0] - b.hx)*back; b.y = b.hy + (d[1] - b.hy)*back + Math.sin(realT*1.3 + b.ph)*3; b.vis = v; });
}
function v25BoatHull(x, y, tilt, small){ ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); const s = small ? .7 : 1; ctx.scale(s, s);
  rect('#3e2723', -30, -6, 60, 10); tri(-30, -6, -38, -12, -30, 4, '#3e2723'); rect('#5d4037', -24, -2, 48, 3); rect('#eceff1', 4, -18, 16, 12); rect('#263238', 7, -15, 4, 4); rect('#8d6e63', -2, -46, 2, 40); rect('#8d6e63', -22, -36, 44, 2); ctx.restore(); }
function v25FleetSprites(sp){
  const v = v25FleetVis(); if(VB.y1 < 900) return;
  if(v <= 0){ FLEET_DOCK.forEach(([x, y]) => { if(inVB(x, y)) sp.push({y, f:() => v25BoatHull(x, y + Math.sin(realT*1.5 + x)*1.5, 0, true)}); }); return; }
  FLEET.forEach((b, i) => { if(i >= (V25.low ? 6 : 16) || !inVB(b.x, b.y) || cam.z < .45) return; sp.push({y:b.y, f:() => { ctx.globalAlpha = b.vis; v25BoatHull(b.x, b.y, Math.sin(realT*1.3 + b.ph)*.05, false); ctx.globalAlpha = 1; }}); });
}
function v25FleetLights(dk){
  const v = v25FleetVis(); if(v <= 0) return; const far = cam.z < .45, low = V25.low;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  FLEET.forEach((b, i) => { if(i >= (low ? 6 : 16) || !inVB(b.x, b.y)) return; const a = b.vis;
    if(!low) for(let k=0;k<3;k++){ const w = 2 + k, h = 50 + k*28 + Math.sin(realT*2 + b.ph + k)*10; ctx.globalAlpha = a*(.22 - k*.05)*(1 + .3*Math.sin(realT*5 + k + b.ph)); ctx.fillStyle = '#d6ecff'; ctx.fillRect(b.x - 18 + k*14, b.y + 8, w, h); }
    if(far){ ctx.globalAlpha = a; ctx.drawImage(SPR.cool, b.x - 14, b.y - 44, 28, 28); return; }
    for(let k=0;k<b.bulbs;k++){ const bx = b.x - 20 + k*(40/(b.bulbs - 1 || 1)), by = b.y - 36; ctx.globalAlpha = a; ctx.drawImage(SPR.cool, bx - 10, by - 10, 20, 20); ctx.fillStyle = '#ffffff'; ctx.fillRect(bx - 1.5, by - 1.5, 3, 3); }
    ctx.globalAlpha = a*.9; ctx.drawImage(SPR.red, b.x - 36, b.y - 12, 12, 12); ctx.drawImage(SPR.green, b.x + 24, b.y - 12, 12, 12); ctx.drawImage(SPR.cut, b.x - 5, b.y - 54, 10, 10); });
  ctx.restore();
}
// ---------- sprite layer: stars over the dizzy, dust, "getting up" label ----------
function v25Sprites(sp){
  v25FleetSprites(sp);
  sp.push({y:1e9 - 1, f:() => {
    agents.forEach(a => { if(!down(a) || !a.visible || !inVB(a.x, a.y)) return; for(let k=0;k<3;k++){ const ang = realT*4 + k*2.09, sx = a.x + Math.cos(ang)*12, sy = a.y - 24 + Math.sin(ang)*4; rect('#ffd23f', sx - 2, sy - 2, 4, 4); rect('#fff59d', sx - 1, sy - 1, 2, 2); } });
    for(let i = V25.dust.length - 1; i >= 0; i--){ const p = V25.dust[i]; p.t -= 1/60; p.x += p.vx/60; if(p.t <= 0){ V25.dust.splice(i, 1); continue; } ctx.globalAlpha = p.t; circ(p.x, p.y - (.6 - p.t)*14, 3 + (.6 - p.t)*6, '#d7ccc8'); ctx.globalAlpha = 1; }
    if(PLAYER && PLAYER.visible && down(PLAYER)) plate('Đang đứng dậy… (bấm E để dậy ngay)', PLAYER.x, PLAYER.y - 52);
  }});
}
function v25Update(dtR){
  v25FallTick(); v25FleetUpdate(dtR);
  V25.fpsAcc += dtR; V25.fpsN++; if(V25.fpsAcc >= 2){ V25.fps = V25.fpsN/V25.fpsAcc; V25.fpsAcc = 0; V25.fpsN = 0; let sv = 'auto'; try { sv = (JSON.parse(localStorage.getItem('truong-mobile-v24') || '{}').saver) || 'auto'; } catch(e){} V25.low = sv === 'on' || V25.fps < 40; }
}
function v25Init(){
  V25.mode = SETTINGS.tscale || 'x10'; if(SETTINGS.lantern == null) SETTINGS.lantern = true;
  // wrap the clock driver: start from the real time, then run ×10 (or ×1 / ×30 / stop)
  const rt0 = rtStep;
  rtStep = function(dtR, ff){
    if(!REALT.on){ V25MK = 1; return rt0(dtR, ff); }
    if(V25.mode === 'x1'){ V25MK = RATE/V25_MPS.x1; V25.stopClock = false; return rt0(dtR, ff); }
    if(V25.mode === 'stop'){ V25MK = 1; V25.before = clock; V25.stopClock = true; return dtR*RATE; }
    V25.stopClock = false; const mps = V25_MPS[V25.mode] || V25_MPS.x10; V25MK = RATE/mps; return dtR*mps;
  };
  // stand-up controls: E key, touch E button, tapping your own character
  window.addEventListener('keydown', e => { if(e.code === 'KeyE' && !openModal && PLAYER && down(PLAYER)){ e.preventDefault(); e.stopImmediatePropagation(); v25StandUp(PLAYER); } }, true);
  const be = $('#mBtnE'); if(be) be.addEventListener('click', e => { if(PLAYER && down(PLAYER)){ e.stopImmediatePropagation(); v25StandUp(PLAYER); } }, true);
  cvs.addEventListener('pointerdown', e => { if(!PLAYER || !down(PLAYER)) return; const r = cvs.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top); if(Math.hypot(wx - PLAYER.x, wy - PLAYER.y) < 40) v25StandUp(PLAYER); }, true);
  setInterval(v25Watchdog, 5000);
  // time-of-day buttons: quick bar (phones: inside the "⋯ Thêm" sheet) + settings, keys 1–4
  const quick = $('#quick'), more = $('#mMore');
  V25_TIMES.forEach(([id, txt, min, label]) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'v25t'; b.textContent = txt; b.title = `${label} ${String(Math.floor(min/60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; b.onclick = () => v25SetTime(min, label); if(quick) quick.insertBefore(b, more || null); });
  document.addEventListener('keydown', e => { const tg = e.target && e.target.tagName; if(openModal || tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return; const t = V25_TIMES.find(x => x[4] === e.code); if(t){ e.preventDefault(); v25SetTime(t[2], t[3]); } });
  const fd = document.createElement('div'); fd.id = 'v25Fade'; stage.appendChild(fd);
  // settings rows: time speed, quick time buttons, lantern switch (the old "real clock" checkbox row is replaced by the speed menu)
  const real = $('#stReal'), row = real && real.closest('.strow');
  if(row){ row.hidden = true;
    const sp = document.createElement('label'); sp.className = 'strow'; sp.innerHTML = '<span>Tốc độ thời gian</span><select id="stTScale"><option value="x1">×1 (giờ thật)</option><option value="x10">×10 (mặc định)</option><option value="x30">×30</option><option value="stop">Dừng</option></select>'; row.after(sp);
    const tb = document.createElement('div'); tb.className = 'strow'; tb.innerHTML = '<span>Chuyển nhanh buổi</span><span class="v25set"></span>'; sp.after(tb);
    V25_TIMES.forEach(([id, txt, min, label]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.onclick = () => { v25SetTime(min, label); setTimeout(() => { try { renderSettings(); } catch(e){} }, 400); }; tb.querySelector('.v25set').appendChild(b); });
    const ln = document.createElement('label'); ln.className = 'strow'; ln.innerHTML = '<span>Đèn dầu ban đêm</span><input type="checkbox" id="stLantern">'; tb.after(ln);
    const ts = $('#stTScale'), lc = $('#stLantern'); ts.value = V25.mode; lc.checked = SETTINGS.lantern !== false;
    ts.onchange = () => v25Mode(ts.value); lc.onchange = () => { SETTINGS.lantern = lc.checked; setSave(); }; }
  REALT.on = true; if(V25.mode !== 'x1') V25.wslot = -1;
}
