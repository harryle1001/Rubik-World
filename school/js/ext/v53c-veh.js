// ================= v53c · THÀNH PHỐ AN TOÀN 3/6: xe cứu hỏa & xe cảnh sát tự chạy theo đường, sự cố cháy nhỏ, lính cứu hỏa phun nước =================
// Một xe cứu hỏa + một xe cảnh sát. Người chơi lái thì AI tắt (cùng một chiếc xe). Mọi đám cháy đều nhỏ, không lan, không ai bị thương.
const V53C_VEH = {fire:{vi:'Xe cứu hỏa', ic:'🚒', vmax:270, go:420, back:220}, police:{vi:'Xe cảnh sát', ic:'🚓', vmax:300, go:380, back:150}};
const V53C_HELP = [['🚸', 'Giúp các bạn qua đường'], ['🧒', 'Giúp bé lạc tìm mẹ'], ['🎒', 'Trả đồ rơi cho người mất'], ['🚦', 'Điều tiết giao thông'], ['👵', 'Giúp bà xách đồ'], ['🐶', 'Tìm cún đi lạc']];

// ---------- 1. tạo xe ----------
function v53cVehInit(){
  for(const id of ['fire', 'police']){ const G = v53cGeo(id); V53C.veh[id] = {id, x:G.park[0], y:G.park[1], hdg:Math.PI/2, spd:0, st:'home', path:null, pi:0, wait:3 + Math.random()*6, lights:false, siren:false, crew:[], help:null, tgt:null}; }
}
function v53cHome(v){ const G = v53cGeo(v.id); return G.park; }
// đi theo đường tới điểm b (toạ độ mới)
function v53cGoTo(v, b, st){
  let P = null; try { P = v46Route([v.x, v.y], b); } catch(e){} if(!P || P.length < 2) P = [[v.x, v.y], b];
  const G = v53cGeo(v.id); if(Math.hypot(v.x - G.park[0], v.y - G.park[1]) < 40) P.splice(1, 0, G.exit);   // ra khỏi sân trước
  if(st === 'back') P.splice(P.length - 1, 0, G.exit);
  v.path = P; v.pi = 1; v.st = st;
}
// ---------- 2. AI mỗi khung hình ----------
function v53cVehTick(dt){
  for(const id in V53C.veh){ const v = V53C.veh[id], me = V53C.mode === 'drive' && V53C.drv === id, S = V53C_VEH[id];
    if(!me){
      if(v.st === 'go' || v.st === 'back' || v.st === 'patrol'){ const p = v.path && v.path[v.pi];
        if(!p){ if(v.st === 'back'){ v.st = 'home'; const G = v53cGeo(id); v.x = G.park[0]; v.y = G.park[1]; v.hdg = Math.PI/2; v.spd = 0; v.lights = false; v.siren = false; v.wait = 6 + Math.random()*8; }
          else if(v.st === 'patrol'){ v.st = 'help'; v.wait = 7; v.spd = 0; v.help = V53C_HELP[Math.floor(Math.random()*V53C_HELP.length)]; }
          else if(id === 'police'){ v.st = 'scene'; v.spd = 0; v.help = ['🚧', 'Giữ an toàn khu vực']; }
          else { v.st = 'work'; v.spd = 0; } }
        else { const dx = p[0] - v.x, dy = p[1] - v.y, d = Math.hypot(dx, dy), vm = v.st === 'go' ? S.go : v.st === 'back' ? S.back : S.back;
          const a = Math.atan2(dy, dx); let da = Math.atan2(Math.sin(a - v.hdg), Math.cos(a - v.hdg)); v.hdg += Math.max(-4*dt, Math.min(4*dt, da));
          const turnSlow = 1 - Math.min(.6, Math.abs(da)/2), tgt = vm*turnSlow*(v.pi >= v.path.length - 1 ? Math.min(1, d/120 + .25) : 1); v.spd += Math.max(-300*dt, Math.min(200*dt, tgt - v.spd));
          const s = Math.min(d, v.spd*dt); v.x += Math.cos(v.hdg)*s; v.y += Math.sin(v.hdg)*s; if(d < 14 + v.spd*.15 || (d < 90 && Math.abs(da) > 1.7)) v.pi++; } }
      else if(v.st === 'home'){ if(id === 'police' && (v.wait -= dt) <= 0) v53cPatrol(v); }
      else if(v.st === 'help'){ if((v.wait -= dt) <= 0){ v.help = null; v53cPatrol(v); } }
      else if(v.st === 'scene'){ const f = V53C.fires.find(q => !q.out); if(!f){ v.help = null; v.lights = false; v53cGoTo(v, v53cHome(v), 'back'); } }
    }
    // xe cứu hỏa: gần đám cháy & dừng → đội phun nước
    if(id === 'fire') v53cCrewTick(v, dt, me);
  }
  // còi: âm lượng theo khoảng cách tới camera
  for(const id in V53C.veh){ const v = V53C.veh[id], d = Math.hypot(v.x - cam.x, v.y - cam.y), vol = v.siren ? Math.max(0, 1 - d/2200)*(V53C.mode === 'drive' && V53C.drv === id ? .7 : 1) : 0; v53cSiren(id, v.siren && vol > 0, vol); }
}
function v53cPatrol(v){
  const N = V46R.nodes; if(!N || !N.length) return; let b = null;
  for(let k = 0; k < 8; k++){ const n = N[Math.floor(Math.random()*N.length)]; if(Math.hypot(n[0] - v.x, n[1] - v.y) > 900 && Math.hypot(n[0] - V46L.CX, n[1] - V46L.CY) < V46L.GRASS - 200){ b = n; break; } }
  if(!b) b = N[Math.floor(Math.random()*N.length)]; v.lights = true; v.siren = false; v53cGoTo(v, [b[0], b[1]], 'patrol');
}
// ---------- 3. sự cố cháy ----------
function v53cFireAt(k, x, y){
  const f = {k, x, y, hp:1, t0:realT, out:0, emit:0, id:Math.random()}; V53C.fires.push(f); if(V53C.fires.length > 3) V53C.fires.shift(); return f;
}
function v53cSpawnFire(kind){
  if(V53C.fires.some(f => !f.out)) return null; let x = 0, y = 0, k = kind || (Math.random() < .55 ? 'kitchen' : 'forest');
  if(k === 'kitchen'){ const Z = ['houses', 'pstreet', 'shopst', 'hall2p', 'plaza'].map(id => V46.ZI[id]).filter(Boolean); if(!Z.length) k = 'forest'; else { const z = Z[Math.floor(Math.random()*Z.length)], n = z.n; x = (n.x0 + n.x1)/2 + (Math.random() - .5)*(n.x1 - n.x0)*.5; y = n.y1 + 10; } }
  if(k === 'forest'){ const T = (V46T.deco || []).filter(t => { const r = Math.hypot(t.x - V46L.CX, t.y - V46L.CY); return r > 1200 && r < V46L.GRASS - 200; }); if(!T.length) return null; const t = T[Math.floor(Math.random()*T.length)]; x = t.x; y = t.y + 8; }
  const f = v53cFireAt(k, x, y); v53cDispatch(f);
  const where = k === 'kitchen' ? 'Một căn bếp bốc khói' : 'Một đám cỏ khô gần gốc cây bắt lửa nhỏ';
  toast('🚨 ' + where + '! Xe cứu hỏa 🚒 đang tới. Nhớ: thấy cháy hãy tránh xa, báo người lớn và gọi 114.');
  return f;
}
function v53cDispatch(f){
  const v = V53C.veh.fire, me = V53C.mode === 'drive' && V53C.drv === 'fire';
  if(!me && v){ const a = Math.atan2(f.y - V46L.CY, f.x - V46L.CX), tx = f.x - Math.cos(a)*90, ty = f.y - Math.sin(a)*90 + 40; v.lights = v.siren = true; v.crew = []; v53cGoTo(v, [tx, ty], 'go'); v.tgt = f; }
  const p = V53C.veh.police; if(p && !(V53C.mode === 'drive' && V53C.drv === 'police') && p.st !== 'go'){ p.lights = true; p.siren = false; p.help = null; v53cGoTo(p, [f.x + 170, f.y + 70], 'go'); }
}
function v53cCrewTick(v, dt, me){
  const f = V53C.fires.find(q => !q.out), near = f && Math.hypot(v.x - f.x, v.y - f.y) < 190 && Math.abs(v.spd) < 25;
  if(near){ if(v.crew.length < 2){ v.crew = [0, 1].map(i => ({x:v.x, y:v.y + 10, i})); v.st = me ? v.st : 'work'; if(me) v53cMsg('🧑‍🚒 Đội cứu hỏa xuống xe kéo vòi! Bấm 💦 để cùng dập lửa.', 4); }
    v.crew.forEach(c => { const a = Math.atan2(f.y - v.y, f.x - v.x), tx = f.x - Math.cos(a)*(70 + c.i*14) + (c.i ? 26 : -26)*Math.sin(a), ty = f.y - Math.sin(a)*(70 + c.i*14) - (c.i ? 26 : -26)*Math.cos(a) + 6;
      const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy); c.mv = d > 3; if(d > 3){ const s = Math.min(d, 70*dt); c.x += dx/d*s; c.y += dy/d*s; } c.dir = f.x < c.x ? -1 : 1; c.walk = (c.walk || 0) + dt*6;
      if(!c.mv){ c.sp = (c.sp || 0) - dt; if(c.sp <= 0){ c.sp = .045; v53cDrop(c.x + c.dir*10, c.y - 18, f.x + (Math.random() - .5)*30, f.y - 10 - Math.random()*14); } } });
    if(v.crew.every(c => !c.mv)){ f.hp -= dt/(f.k === 'plane' ? 10 : 14); if(Math.random() < dt*3) v53cSnd('spray', .5); }
    if(f.hp <= 0) v53cFireOut(f, false);
  } else if(v.crew.length && !f){ v.crew.forEach(c => { const dx = v.x - c.x, dy = v.y - c.y, d = Math.hypot(dx, dy); c.mv = d > 4; if(d > 4){ const s = Math.min(d, 80*dt); c.x += dx/d*s; c.y += dy/d*s; c.dir = dx < 0 ? -1 : 1; c.walk += dt*6; } });
    if(v.crew.every(c => !c.mv)){ v.crew = []; if(!me){ v.siren = false; v53cGoTo(v, v53cHome(v), 'back'); } } }
  else if(!f && v.st === 'work' && !me){ v.crew = []; v.siren = false; v53cGoTo(v, v53cHome(v), 'back'); }
}
function v53cFireOut(f, byPlayer){
  if(f.out) return; f.out = realT; f.hp = 0; const s = v53cState(); s.fires = (s.fires || 0) + 1; v53cSave();
  const v = V53C.veh.fire; if(v){ v.siren = false; } toast(byPlayer ? '💦 Bạn đã cùng đội cứu hỏa dập tắt đám cháy! Không ai bị thương.' : '✅ Đội cứu hỏa đã dập tắt đám cháy nhỏ. Mọi người đều an toàn!');
}
// giọt nước (pool cố định)
function v53cDrop(x, y, tx, ty){
  const D = V53C.drops; let p = null; if(D.length < 160){ p = {}; D.push(p); } else { let o = 0; for(let i = 1; i < D.length; i++) if(D[i].t0 < D[o].t0) o = i; p = D[o]; }
  p.x = x; p.y = y; p.tx = tx; p.ty = ty; p.t0 = realT; p.life = .55 + Math.random()*.1;
}
function v53cPuffAdd(x, y, dark, r){
  const S = V53C.puffs; let p = null; if(S.length < 140){ p = {}; S.push(p); } else { let o = 0; for(let i = 1; i < S.length; i++) if(S[i].t0 < S[o].t0) o = i; p = S[o]; }
  p.x = x + (Math.random() - .5)*10; p.y = y; p.t0 = realT; p.life = 2.6 + Math.random(); p.dark = dark; p.r = r || 1; p.vx = (Math.random() - .5)*14 + 10; p.vy = -38 - Math.random()*14; return p;
}
function v53cFireTick(dt){
  for(const f of V53C.fires){ const live = !f.out, k = live ? f.hp : Math.max(0, 1 - (realT - f.out)/6); if(k <= 0) continue;
    if((f.emit -= dt) <= 0){ f.emit = live ? (f.k === 'kitchen' ? .16 : .22) : .4; v53cPuffAdd(f.x, f.y - 16, live && f.k !== 'kitchen', .8 + k*.6); }
    // cháy nhỏ không lan: tự tắt sau 3 phút nếu chưa ai tới (an toàn)
    if(live && realT - f.t0 > 180) v53cFireOut(f, false); }
  V53C.fires = V53C.fires.filter(f => !f.out || realT - f.out < 8);
}
// ---------- 4. vẽ ----------
function v53cVehDraw(VBn){
  const t = realT;
  for(const id in V53C.veh){ const v = V53C.veh[id]; if(v.x < VBn.x0 - 80 || v.x > VBn.x1 + 80 || v.y < VBn.y0 - 80 || v.y > VBn.y1 + 80) continue;
    const img = v53cCarSpr(id); ctx.save(); ctx.translate(Math.round(v.x), Math.round(v.y)); ctx.rotate(v.hdg); ctx.scale(1.3, 1.3); ctx.drawImage(img, -img.width/2, -img.height/2);
    if(v.lights){ const ph = Math.floor(t*(id === 'police' ? 6 : 5)) % 2, bx = id === 'fire' ? img.width/2 - 21 : -2, by = img.height/2;
      ctx.fillStyle = ph ? '#ff3030' : '#3a6fd8'; ctx.fillRect(bx, -by + 6, 3, by - 6); ctx.fillStyle = ph ? '#3a6fd8' : '#ff3030'; ctx.fillRect(bx, 0, 3, by - 6);
      if(id === 'police'){ ctx.fillStyle = ph ? '#ff3030' : '#204fd8'; ctx.fillRect(-2, -11, 4, 10); ctx.fillStyle = ph ? '#204fd8' : '#ff3030'; ctx.fillRect(-2, 1, 4, 10); } }
    ctx.restore();
    if(v.lights){ const ph = Math.floor(t*(id === 'police' ? 6 : 5)) % 2; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.drawImage(v53cGlow(ph ? 'rgba(255,50,40,1)' : 'rgba(60,110,255,1)'), v.x - 26, v.y - 26, 52, 52); ctx.restore(); }
    // bong bóng việc tốt của xe cảnh sát + một bạn nhỏ cạnh xe
    if(v.help && cam.z > .3){ if(v.st === 'help'){ const kx = v.x + 34, ky = v.y + 30, K = v.kid || (v.kid = v51tRandKid(Math.floor(Math.random()*16))); K.dir = -1; v51tKid(ctx, kx, ky, K, t); v53cCrew(ctx, v.x - 30, v.y + 30, 'police', 1, 0, false, t); }
      v53cBubble(v.x, v.y - 40, v.help[0] + ' ' + v.help[1]); }
    if(v.crew && v.crew.length) v.crew.forEach(c => v53cCrew(ctx, c.x, c.y, 'fire', c.dir || 1, c.walk, c.mv, t));
    if(v.crew && v.crew.length){ const f = V53C.fires.find(q => !q.out); if(f){ ctx.strokeStyle = '#e8e8ee'; ctx.lineWidth = 2; ctx.beginPath(); v.crew.forEach(c => { ctx.moveTo(v.x, v.y); ctx.quadraticCurveTo((v.x + c.x)/2, Math.max(v.y, c.y) + 16, c.x + (c.dir || 1)*8, c.y - 14); }); ctx.stroke(); } }
  }
}
function v53cBubble(x, y, s){
  const fs = 16/Math.max(.7, cam.z); ctx.font = '800 ' + fs.toFixed(1) + 'px Nunito, sans-serif'; const w = ctx.measureText(s).width + fs*1.1;
  ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fillRect(x - w/2, y - fs*1.4, w, fs*1.6); ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.beginPath(); ctx.moveTo(x - 6, y + fs*.2); ctx.lineTo(x + 6, y + fs*.2); ctx.lineTo(x, y + fs*.7); ctx.fill();
  ctx.fillStyle = '#1d2238'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y - fs*.6); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function v53cFireDraw(VBn){
  const t = realT;
  for(const f of V53C.fires){ if(f.x < VBn.x0 - 200 || f.x > VBn.x1 + 200 || f.y < VBn.y0 - 300 || f.y > VBn.y1 + 100) continue; if(f.k === 'plane') continue;
    const live = !f.out; if(live){ const n = f.k === 'kitchen' ? 2 : 3, sc = .7 + f.hp*.8;
      if(f.k === 'kitchen'){ ctx.fillStyle = '#6b4a3a'; ctx.fillRect(f.x - 26, f.y - 30, 52, 30); ctx.fillStyle = '#3a2a22'; ctx.fillRect(f.x - 14, f.y - 22, 28, 16); ctx.fillStyle = '#8a8f9c'; ctx.fillRect(f.x - 20, f.y - 36, 40, 6); }
      for(let i = 0; i < n; i++){ const fr = Math.floor(t*10 + i*1.7) % 4, img = v53cFlameSpr(fr), ox = (i - (n - 1)/2)*16; ctx.drawImage(img, f.x + ox - 12*sc, f.y - (f.k === 'kitchen' ? 34 : 4) - 32*sc, 24*sc, 32*sc); } } }
  // khói
  const S = V53C.puffs; ctx.save();
  for(let i = 0; i < S.length; i++){ const p = S[i], a = (t - p.t0)/p.life; if(a < 0 || a >= 1) continue; const x = p.x + p.vx*(t - p.t0), y = p.y + p.vy*(t - p.t0); if(x < VBn.x0 - 60 || x > VBn.x1 + 60 || y < VBn.y0 - 60 || y > VBn.y1 + 60) continue;
    const r = (10 + a*30)*p.r; ctx.globalAlpha = (1 - a)*.7; ctx.drawImage(v53cPuffSpr(p.dark), x - r, y - r, r*2, r*2); }
  // tia nước
  ctx.globalAlpha = .9; ctx.fillStyle = '#9fdcff'; const D = V53C.drops;
  for(let i = 0; i < D.length; i++){ const p = D[i], a = (t - p.t0)/p.life; if(a < 0 || a >= 1) continue; const x = p.x + (p.tx - p.x)*a, y = p.y + (p.ty - p.y)*a - Math.sin(a*Math.PI)*36; ctx.fillRect(x - 2, y - 2, 4, 4); }
  ctx.restore();
}
// ban đêm: đèn pha xe + đèn hiệu sáng hơn
function v53cNightFx(VBn){
  const dk = typeof lightLevel === 'function' ? lightLevel() : 0; if(dk < .12) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(const id in V53C.veh){ const v = V53C.veh[id]; if(v.x < VBn.x0 - 120 || v.x > VBn.x1 + 120 || v.y < VBn.y0 - 120 || v.y > VBn.y1 + 120) continue;
    if(v.st !== 'home' || V53C.drv === id){ ctx.globalAlpha = Math.min(.5, dk*.7); const L = 70; ctx.drawImage(v53cGlow('rgba(255,245,200,1)'), v.x + Math.cos(v.hdg)*L - 44, v.y + Math.sin(v.hdg)*L - 44, 88, 88); }
    if(v.lights){ const ph = Math.floor(realT*5) % 2; ctx.globalAlpha = Math.min(.9, dk*1.2); ctx.drawImage(v53cGlow(ph ? 'rgba(255,50,40,1)' : 'rgba(60,110,255,1)'), v.x - 50, v.y - 50, 100, 100); } }
  for(const f of V53C.fires){ if(f.out || f.k === 'plane') continue; ctx.globalAlpha = Math.min(.8, dk)*f.hp; ctx.drawImage(v53cGlow('rgba(255,140,40,1)'), f.x - 90, f.y - 110, 180, 180); }
  ctx.restore();
}
// ---------- 5. lịch sự cố ngẫu nhiên (hiếm; tắt được trong Cài đặt) ----------
function v53cIncTick(){
  if(!v53cSet().inc || typeof PLAYER === 'undefined' || !PLAYER || (typeof V50 !== 'undefined' && V50.open)) return;
  if(V53C.fires.some(f => !f.out)) return; if(realT - (V53C.lastInc || 0) < 360) return;
  if(Math.random() < 1/900){ V53C.lastInc = realT; v53cSpawnFire(); }
}
