// ================= EXT12: DEEP-SEA FISHING FROM THE BOAT =================
function boatZoneOK(c, ny){
  const z = c.boat && c.boat.item ? c.boat.item.zone : 1, oz = oceanAt(ny);
  if(oz.z <= z) return true;
  if(realT - (c.boat.warn || 0) > 3){ c.boat.warn = realT; toast(`${oz.n} cần thuyền hạng ${oz.z}. ${c.boat.item.n || 'Thuyền này'} chỉ đi được tới vùng hạng ${z}.`); }
  return false;
}
// species: n, zone, depth[min,max] m, weight kg, rarity 0-3, $/kg, colour, shape, flags
const SPECIES = [
  ['Cá bống biển', 1, [2, 20], [.1, .6], 0, 8, '#a1887f', 'fish'], ['Cá rô biển', 1, [5, 25], [.3, 2], 0, 6, '#8d6e63', 'fish'], ['Cá thu', 1, [8, 30], [1, 6], 1, 5, '#90a4ae', 'fish'],
  ['Cá đuối nhỏ', 1, [15, 30], [2, 10], 1, 4, '#6d4c41', 'ray'], ['Mực ống', 1, [5, 30], [.3, 1.5], 1, 12, '#f8bbd0', 'squid', 'night'], ['Cua xanh', 1, [20, 30], [.3, 1.2], 0, 15, '#1565c0', 'crab'],
  ['Cá hề', 2, [3, 25], [.1, .3], 0, 30, '#ff7043', 'fish'], ['Cá mú đỏ', 2, [15, 60], [2, 25], 1, 7, '#e53935', 'fish', 'shrimp'], ['Cá bò hòm', 2, [5, 40], [.3, 1.5], 1, 18, '#ffd23f', 'fish'],
  ['Cá ngừ vây vàng', 2, [20, 60], [10, 60], 2, 9, '#ffca28', 'fish'], ['Bạch tuộc', 2, [10, 60], [1, 12], 1, 9, '#ef9a9a', 'squid'], ['Cá mặt trăng', 2, [30, 60], [40, 200], 2, 3, '#b0bec5', 'sunfish'],
  ['Cá ngừ đại dương', 3, [30, 150], [40, 300], 2, 10, '#455a64', 'fish', 'squid'], ['Cá kiếm', 3, [50, 150], [50, 400], 3, 9, '#37474f', 'sword', 'squid'], ['Cá cờ xanh', 3, [20, 120], [60, 500], 3, 8, '#1e88e5', 'sword'],
  ['Cá mập đầu búa', 3, [40, 150], [80, 450], 3, 4, '#78909c', 'shark'], ['Cá nóc', 3, [10, 80], [.5, 3], 1, 14, '#c0ca33', 'puffer'], ['Cá thu ngàng', 3, [20, 100], [8, 40], 1, 7, '#4fc3f7', 'fish'],
  ['Cá cần câu', 4, [150, 400], [1, 20], 2, 20, '#3e2723', 'angler', 'glow'], ['Cá rồng đen', 4, [200, 400], [.2, 2], 2, 60, '#212121', 'eel', 'glow'], ['Cá mắt ống', 4, [150, 350], [.2, 1], 2, 80, '#4dd0e1', 'fish', 'glow'],
  ['Cá chình miệng túi', 4, [250, 400], [1, 8], 2, 25, '#263238', 'eel'], ['Mực khổng lồ', 4, [250, 400], [100, 500], 3, 6, '#c62828', 'squid', 'glow'], ['Sứa phát sáng', 4, [100, 300], [.2, 2], 1, 30, '#ea80fc', 'jelly'],
  ['Cá tuyết', 5, [20, 200], [3, 30], 1, 8, '#a1887f', 'fish'], ['Cá hồi bạc', 5, [10, 120], [2, 15], 1, 12, '#ef9a9a', 'fish'], ['Cá băng trong suốt', 5, [50, 250], [.3, 2], 2, 50, '#e0f7fa', 'fish'],
  ['Cua hoàng đế', 5, [100, 250], [2, 10], 2, 30, '#d84315', 'crab'], ['Cá mập Greenland', 5, [150, 250], [200, 700], 3, 5, '#546e7a', 'shark']
].map(([n, z, d, w, r, v, col, shape, f1]) => ({n, z, d, w, r, v, col, shape, lure:['shrimp','glow','squid'].includes(f1) ? f1 : null, night:f1 === 'night'}));
const RARITY = ['Thường', 'Hiếm', 'Quý', 'Huyền thoại'], RCOL = ['#b0bec5', '#4fc3f7', '#b06bff', '#ffd23f'];
const ZONE_DEPTH = [0, 30, 60, 150, 400, 250];
var DF = null;
function openDeepFish(){
  const c = agents.find(a => a.controlled);
  if(!c || !c.boat){ toast('Hãy lên thuyền và chạy ra biển rồi bấm "Câu cá trên tàu".'); return; }
  if(!lvlOK('deepfish', 'Câu cá biển sâu')) return;
  const oz = oceanAt(c.y); showModal('mFishDeep');
  const rod = PROF.equip.rod ? ITEM[PROF.equip.rod] : null, lure = PROF.equip.lure || null;
  DF = {zone:oz.z, zn:oz.n, maxD:ZONE_DEPTH[oz.z], rodT:rod ? rod.t : 1, rodN:rod ? rod.n : 'Cần câu tre', lure, lureN:lure ? ITEM[lure].n : 'Mồi giun', sonar:has('g_sonar'), light:has('g_light'), crane:has('g_crane'), fridge:has('g_fridge'),
    phase:'idle', pow:0, pd:1, lx:400, ld:0, lvy:0, camD:0, fish:[], hook:null, T:0, S:1, dist:0, slack:0, run:0, bite:0, msg:'', msgT:0, shake:0, snow:[], card:null, last:performance.now(), raf:0, night:SKYST && SKYST.night > .4};
  for(let i=0;i<60;i++) DF.snow.push({x:Math.random()*800, y:Math.random()*450, s:.3 + Math.random()});
  dfSpawn(); $('#dfZone').textContent = `${oz.n} · sâu tối đa ${DF.maxD} m · ${DF.rodN} · ${DF.lureN}${DF.sonar ? ' · có sonar' : ''}`; dfDex();
  cancelAnimationFrame(DF.raf); DF.raf = requestAnimationFrame(dfLoop);
}
function dfSpawn(){
  const pool = SPECIES.filter(s => s.z === DF.zone && (!s.night || DF.night));
  DF.fish = [];
  for(let i=0;i<14;i++){ const weights = pool.map(s => [8, 4, 1.6, .5][s.r]*(s.lure && s.lure === lureType() ? 3 : 1)); let r = Math.random()*weights.reduce((a, b) => a + b, 0), sp = pool[0]; for(let k=0;k<pool.length;k++){ r -= weights[k]; if(r <= 0){ sp = pool[k]; break; } }
    const d = sp.d[0] + Math.random()*(Math.min(sp.d[1], DF.maxD) - sp.d[0]); DF.fish.push({sp, x:Math.random()*800, d:Math.max(1, d), vx:(Math.random() < .5 ? -1 : 1)*(20 + Math.random()*30), w:+(sp.w[0] + Math.pow(Math.random(), 2.2)*(sp.w[1] - sp.w[0])).toFixed(2), ph:Math.random()*6, int:0}); }
}
const lureType = () => DF.lure === 'lure2' ? 'shrimp' : DF.lure === 'lure3' ? 'glow' : DF.lure === 'lure4' ? 'squid' : 'worm';
const dPx = 6; // pixels per metre at camera
function dfLoop(now){
  if(!openModal || openModal.id !== 'mFishDeep' || !DF){ if(DF) DF.raf = 0; return; }
  const dt = Math.min(.05, (now - DF.last)/1000); DF.last = now; dfUpdate(dt); dfDraw(); ARC.prev = Object.assign({}, ARC.code); DF.raf = requestAnimationFrame(dfLoop);
}
const dfHold = () => !!(DF.hold || ARC.code.Space);
function dfUpdate(dt){
  const F = DF; F.msgT -= dt; F.shake = Math.max(0, F.shake - dt*3);
  F.fish.forEach(f => { if(f === F.hook) return; f.ph += dt; f.x += f.vx*dt*(1 - f.int*.6); if(f.x < -40){ f.x = -40; f.vx *= -1; } if(f.x > 840){ f.x = 840; f.vx *= -1; } f.d += Math.sin(f.ph*.7)*dt*1.5;
    if(F.phase === 'sink' || F.phase === 'wait'){ const dx = F.lx - f.x, dd = F.ld - f.d, dist = Math.hypot(dx/dPx, dd), likes = !f.sp.lure || f.sp.lure === lureType(), sight = (F.light && F.night ? 14 : 9) + (lureType() === 'glow' && F.zone >= 4 ? 10 : 0);
      if(dist < sight && likes){ f.int = Math.min(1, f.int + dt*.6); f.vx = Math.sign(dx || 1)*Math.min(60, Math.abs(dx) + 10); f.d += Math.sign(dd)*Math.min(Math.abs(dd), 6*dt); if(dist < 1.6 && !F.bite && Math.random() < dt*1.5){ F.bite = .9; F.biter = f; F.phase = 'bite'; F.msg = 'CÁ CẮN CÂU! Bấm ngay!'; F.msgT = .9; blipSfx(1760); } } else f.int = Math.max(0, f.int - dt*.3); } });
  F.snow.forEach(p => { p.y -= p.s*8*dt; p.x += Math.sin(realT + p.y)*dt*4; if(p.y < 0){ p.y = 450; p.x = Math.random()*800; } });
  if(F.phase === 'idle'){ F.ld = 0; F.lx = 400; if(dfHold()){ F.pow += F.pd*dt*1.2; if(F.pow > 1 || F.pow < 0){ F.pd *= -1; F.pow = clampV(F.pow, 0, 1); } F.charging = true; } else if(F.charging){ F.charging = false; F.phase = 'cast'; F.ct = 0; F.lx0 = 400; F.lx1 = 400 + 120 + F.pow*300; try { sfx(); tone(AC.currentTime, 600, .2, .06, 'sine'); } catch(e){} } }
  else if(F.phase === 'cast'){ F.ct += dt*1.6; F.lx = F.lx0 + (F.lx1 - F.lx0)*Math.min(1, F.ct); F.ld = -Math.sin(Math.min(1, F.ct)*Math.PI)*6; if(F.ct >= 1){ F.phase = 'sink'; F.ld = 0; kickSfx(.4); } }
  else if(F.phase === 'sink' || F.phase === 'wait'){ const down = ARC.code.ArrowDown || ARC.code.KeyS || ARC.code.Down; if(dfHold()){ F.ld = Math.max(0, F.ld - 12*dt); F.lx += (400 - F.lx)*dt*.3; if(F.ld <= 0.2 && F.lx < 430){ F.phase = 'idle'; } } else { F.ld = Math.min(F.maxD, F.ld + (down ? 22 : 9)*dt); }
    if(pressed('ArrowUp') || pressed('KeyW') || pressed('Up')){ F.ld = Math.max(0, F.ld - 1.5); F.fish.forEach(f => { if(Math.abs(f.x - F.lx) < 160 && Math.abs(f.d - F.ld) < 25) f.int = Math.min(1, f.int + .2); }); } }
  else if(F.phase === 'bite'){ F.bite -= dt; if(F.biter){ F.biter.x += (F.lx - F.biter.x)*dt*6; F.biter.d += (F.ld - F.biter.d)*dt*6; } if(pressed('Space') || F.tap){ F.tap = false; F.hook = F.biter; F.phase = 'fight'; F.T = 30; F.S = 1; F.dist = F.ld + Math.abs(F.lx - 400)/dPx; F.shake = 1; F.msg = 'Dính câu! Giữ để kéo, thả khi dây quá căng'; F.msgT = 2; kickSfx(1); } else if(F.bite <= 0){ F.phase = 'sink'; F.biter.int = 0; F.biter.vx *= -2; F.biter = null; F.msg = 'Cá nhả mồi mất rồi…'; F.msgT = 1.2; } }
  else if(F.phase === 'fight'){ const f = F.hook, pf = Math.min(2.6, Math.pow(f.w, .55)/(5*F.rodT)), reel = dfHold();
    F.run -= dt; if(F.run <= 0){ F.running = Math.random() < .45 + .2*F.S; F.run = .6 + Math.random()*1.6; }
    const runSp = F.running ? (2 + pf*4)*F.S : 0;
    if(reel){ F.dist -= (6 + (F.crane && f.w > 20 ? 3 : 0))*dt*(1 - .5*F.S*Math.min(1, pf)); F.T += ((F.running ? 70 : 28)*pf*F.S + 12 - 18)*dt*2.2; }
    else { F.T -= 55*dt; }
    F.dist += runSp*dt*(reel ? .5 : 1); F.T = clampV(F.T, 0, 120);
    F.S = Math.max(0, F.S - dt*(reel && F.T > 25 ? .09 : .025)/Math.max(.6, Math.sqrt(pf)));
    if(F.T < 6 && F.running){ F.slack += dt; } else F.slack = Math.max(0, F.slack - dt);
    F.ld = clampV(F.dist*.75, 0, F.maxD); F.lx = 400 + Math.sin(realT*1.3)*Math.min(300, F.dist*4); f.x = F.lx; f.d = F.ld;
    if(Math.random() < dt*.8 && reel) try { sfx(); woodKnock(AC.currentTime, 3000, .05, .02); } catch(e){}
    if(F.T >= 100){ F.phase = 'sink'; F.hook = null; F.T = 0; F.msg = `Đứt dây! ${f.sp.n} quá khỏe. Thử cần câu mạnh hơn nhé.`; F.msgT = 2.5; F.fish.splice(F.fish.indexOf(f), 1); kickSfx(1); }
    else if(F.slack > 3){ F.phase = 'sink'; F.hook = null; F.msg = 'Dây chùng quá lâu, cá thoát mất!'; F.msgT = 2; F.fish.splice(F.fish.indexOf(f), 1); }
    else if(F.dist <= 1.5){ dfLand(f); } }
  else if(F.phase === 'card'){ if(pressed('Space')) dfNext(); }
  F.camD += ((F.phase === 'idle' || F.phase === 'cast' ? 0 : Math.max(0, F.ld - 22)) - F.camD)*Math.min(1, dt*3);
  F.tap = false;
}
function dfLand(f){
  const F = DF; F.phase = 'card'; F.fish.splice(F.fish.indexOf(f), 1); F.hook = null;
  const value = Math.max(2, Math.round(f.w*f.sp.v*(F.fridge ? 1.25 : 1))), exp = [12, 25, 60, 150][f.sp.r] + Math.round(Math.min(80, f.w/4));
  const dex = PROF.fish[f.sp.n] || {n:0, best:0}, newSp = !dex.n, rec = f.w > dex.best; dex.n++; dex.best = Math.max(dex.best, f.w); PROF.fish[f.sp.n] = dex; PROF.stats.catches++;
  F.card = {f, value, exp, newSp, rec}; reward(exp, value, `Câu được ${f.sp.n} ${f.w} kg`); mprog('deepfish'); if(f.sp.r >= 2) mprog('bigfish'); if(f.sp.r === 3) confetti();
  cheerSfx(); dfDex(); if(F.fish.length < 6) dfSpawn();
}
function dfNext(){ if(!DF) return; DF.card = null; DF.phase = 'idle'; DF.pow = 0; }
function deepClose(){ if(DF){ cancelAnimationFrame(DF.raf); DF = null; } }
function drawSea2(c, f, x, y, sc){
  const s = f.sp, L = Math.min(150, 14 + Math.pow(f.w, .45)*9)*sc, H2 = L*(s.shape === 'sunfish' ? .9 : s.shape === 'ray' ? .5 : .38), dir = f.vx < 0 ? -1 : 1, glow = s.lure === 'glow';
  c.save(); c.translate(x, y); c.scale(dir, 1);
  if(glow){ c.fillStyle = 'rgba(118,255,3,.15)'; c.beginPath(); c.arc(0, 0, L*.8, 0, 7); c.fill(); }
  c.fillStyle = s.col;
  if(s.shape === 'squid'){ c.beginPath(); c.ellipse(-L*.1, 0, L*.45, H2*.6, 0, 0, 7); c.fill(); for(let k=0;k<6;k++){ c.fillRect(L*.3, -H2*.4 + k*H2*.16, L*.5 + Math.sin(realT*6 + k)*4, 2); } }
  else if(s.shape === 'jelly'){ c.globalAlpha = .7; c.beginPath(); c.arc(0, 0, L*.4, Math.PI, 0); c.fill(); for(let k=0;k<5;k++) c.fillRect(-L*.3 + k*L*.15, 0, 2, L*.5 + Math.sin(realT*3 + k)*6); c.globalAlpha = 1; }
  else if(s.shape === 'crab'){ c.fillRect(-L*.35, -H2*.3, L*.7, H2*.6); for(let k=0;k<3;k++){ c.fillRect(-L*.5, -2 + k*5, L*.15, 2); c.fillRect(L*.35, -2 + k*5, L*.15, 2); } c.fillRect(L*.3, -H2*.6, L*.2, H2*.3); }
  else if(s.shape === 'ray'){ c.beginPath(); c.moveTo(L*.5, 0); c.lineTo(0, -H2); c.lineTo(-L*.4, 0); c.lineTo(0, H2); c.closePath(); c.fill(); c.fillRect(-L, -1, L*.6, 2); }
  else if(s.shape === 'eel'){ c.lineWidth = H2*.5; c.strokeStyle = s.col; c.beginPath(); for(let k=0;k<=10;k++){ const xx = L*.5 - k*L*.1, yy = Math.sin(realT*5 + k*.7)*H2*.4; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  else { c.beginPath(); c.ellipse(0, 0, L*.5, H2*.5, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-L*.45, 0); c.lineTo(-L*.75, -H2*.5 + Math.sin(realT*8)*3); c.lineTo(-L*.75, H2*.5 + Math.sin(realT*8)*3); c.closePath(); c.fill();
    if(s.shape === 'sword'){ c.fillRect(L*.45, -1.5, L*.5, 3); c.beginPath(); c.moveTo(-L*.1, -H2*.45); c.lineTo(L*.1, -H2*1.1); c.lineTo(L*.2, -H2*.45); c.fill(); }
    if(s.shape === 'shark'){ c.beginPath(); c.moveTo(-L*.05, -H2*.45); c.lineTo(L*.08, -H2*1.1); c.lineTo(L*.2, -H2*.45); c.fill(); if(s.n.includes('búa')) c.fillRect(L*.42, -H2*.5, L*.08, H2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-L*.3, H2*.1, L*.6, H2*.25); }
    if(s.shape === 'angler'){ c.strokeStyle = s.col; c.lineWidth = 2; c.beginPath(); c.moveTo(L*.2, -H2*.4); c.quadraticCurveTo(L*.5, -H2*1.4, L*.65, -H2*.6); c.stroke(); c.fillStyle = '#ccff90'; c.beginPath(); c.arc(L*.65, -H2*.6, 4 + Math.sin(realT*4)*1.5, 0, 7); c.fill(); c.fillStyle = '#fff'; for(let k=0;k<4;k++) c.fillRect(L*.3 + k*4, H2*.1, 2, 4); }
    if(s.shape === 'puffer'){ c.fillStyle = 'rgba(0,0,0,.25)'; for(let k=0;k<8;k++) c.fillRect(Math.cos(k)*L*.4, Math.sin(k)*H2*.45, 2, 2); }
    if(s.n === 'Cá hề'){ c.fillStyle = '#fff'; c.fillRect(-L*.1, -H2*.45, L*.08, H2*.9); c.fillRect(L*.2, -H2*.4, L*.06, H2*.8); } }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(L*.32, -H2*.1, Math.max(2, L*.04), 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(L*.33, -H2*.1, Math.max(1, L*.02), 0, 7); c.fill();
  c.restore();
}
function dfDraw(){
  const F = DF, cv = $('#dfCv'), c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0);
  if(F.shake > 0) c.translate((Math.random() - .5)*8*F.shake, (Math.random() - .5)*8*F.shake);
  const surf = 90 - F.camD*dPx, depthCol = d => { const k = Math.min(1, d/Math.max(60, F.maxD)); const base = F.zone === 5 ? [120, 190, 220] : [30, 140, 200]; return `rgb(${Math.round(base[0]*(1 - k)*.9 + 4)},${Math.round(base[1]*(1 - k*.92) + 6)},${Math.round(base[2]*(1 - k*.85) + 18)})`; };
  const sky = c.createLinearGradient(0, surf - 90, 0, surf); sky.addColorStop(0, F.night ? '#0b1030' : '#6fb7ff'); sky.addColorStop(1, F.night ? '#26305a' : '#d9f0ff'); c.fillStyle = sky; c.fillRect(0, 0, 800, Math.max(0, surf));
  const wg = c.createLinearGradient(0, Math.max(0, surf), 0, 450); wg.addColorStop(0, depthCol(F.camD)); wg.addColorStop(1, depthCol(F.camD + 360/dPx)); c.fillStyle = wg; c.fillRect(0, Math.max(0, surf), 800, 450);
  if(surf > -20){ c.fillStyle = 'rgba(255,255,255,.08)'; for(let k=0;k<6;k++){ c.beginPath(); c.moveTo(80 + k*130 + Math.sin(realT + k)*20, surf); c.lineTo(40 + k*130, surf + 300); c.lineTo(120 + k*130, surf + 300); c.closePath(); c.fill(); } c.fillStyle = 'rgba(255,255,255,.6)'; for(let x=0;x<800;x+=8) c.fillRect(x, surf + Math.sin(x*.04 + realT*2)*3, 8, 2); }
  const bottom = 90 + (F.maxD - F.camD)*dPx; if(bottom < 470){ c.fillStyle = F.zone === 2 ? '#d7b98a' : F.zone >= 4 ? '#1a1a1a' : '#b0a080'; c.beginPath(); c.moveTo(0, 450); for(let x=0;x<=800;x+=20) c.lineTo(x, bottom + Math.sin(x*.02)*10); c.lineTo(800, 450); c.fill(); if(F.zone === 2) for(let k=0;k<14;k++){ c.fillStyle = ['#ff6f61','#ffb3c6','#ffd23f','#b06bff','#4dd0e1'][k%5]; c.fillRect(30 + k*55, bottom - 20 - (k%3)*10, 10, 24 + (k%3)*10); } }
  F.snow.forEach(p => { c.fillStyle = F.zone >= 4 ? 'rgba(200,255,200,.35)' : 'rgba(255,255,255,.25)'; c.fillRect(p.x, p.y, 2*p.s, 2*p.s); });
  F.fish.forEach(f => { const y = 90 + (f.d - F.camD)*dPx; if(y < surf - 10 || y > 470) return; const near = Math.hypot(f.x - F.lx, y - (90 + (F.ld - F.camD)*dPx)) < 90; if(!F.sonar && !near && f !== F.hook && f !== F.biter){ c.globalAlpha = .18; } drawSea2(c, f, f.x, y, 1); c.globalAlpha = 1; if(F.sonar && f.sp.r >= 2 && f !== F.hook){ c.strokeStyle = RCOL[f.sp.r]; c.lineWidth = 1; c.beginPath(); c.arc(f.x, y, 26, 0, 7); c.stroke(); } });
  const by = surf - 6; if(by > -60){ c.save(); c.translate(400, by); withCtx(c, () => { ctx.save(); ctx.scale(2.2, 2.2); const z = PLAYER && PLAYER.boat ? PLAYER.boat.item : ITEM.boat2; drawBoatModel(0, 0, z, PROF ? SHOP.filter(i => i.cat === 'bgear' && has(i.id)).map(i => i.id) : [], 1); ctx.translate(-10, -6); if(PLAYER) drawBody(Object.assign({}, PLAYER, {dir:1, moving:false}), true); ctx.restore(); }); c.restore(); }
  const tipX = 400 + 48, tipY = by - 40, ly = 90 + (F.ld - F.camD)*dPx;
  c.strokeStyle = '#6d4c2e'; c.lineWidth = 3; c.beginPath(); c.moveTo(400 + 20, by - 18); c.lineTo(tipX, tipY + (F.phase === 'fight' ? F.T*.12 : 0)); c.stroke();
  if(F.phase !== 'idle'){ c.strokeStyle = F.T > 85 ? '#ef4b4b' : 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tipX, tipY); if(F.phase === 'fight') c.lineTo(F.lx, ly); else c.quadraticCurveTo((tipX + F.lx)/2, Math.max(tipY, surf) + 20, F.lx, ly); c.stroke(); }
  c.fillStyle = lureType() === 'glow' ? '#76ff03' : lureType() === 'squid' ? '#ab47bc' : lureType() === 'shrimp' ? '#ff8a65' : '#c2185b'; c.beginPath(); c.arc(F.lx, ly, 4, 0, 7); c.fill();
  c.fillStyle = 'rgba(10,15,34,.75)'; c.fillRect(752, 40, 40, 360); for(let m=0;m<=F.maxD;m+=Math.max(10, F.maxD/8)){ const yy = 40 + m/F.maxD*360; c.fillStyle = '#8ea0d6'; c.fillRect(752, yy, 8, 1); c.font = '12px VT323, monospace'; c.fillText(Math.round(m) + '', 762, yy + 4); } c.fillStyle = '#ffd23f'; c.fillRect(748, 40 + F.ld/F.maxD*360 - 2, 44, 4);
  hud(c, `${F.zn} · mồi ở độ sâu ${F.ld.toFixed(1)} m`, F.phase === 'fight' ? `${F.hook.sp.n}?` : `${F.rodN}`);
  if(F.phase === 'idle'){ centerText(c, F.charging ? 'Thả ra để quăng!' : 'Giữ để lấy đà quăng câu', 150, 22, '#fff'); c.fillStyle = 'rgba(10,15,34,.8)'; c.fillRect(300, 170, 200, 14); c.fillStyle = '#ffd23f'; c.fillRect(302, 172, F.pow*196, 10); }
  if(F.phase === 'sink' || F.phase === 'wait'){ c.font = '18px VT323, monospace'; c.fillStyle = '#fff'; c.fillText('Giữ: thu dây · Xuống: thả nhanh · Lên: giật mồi nhử cá', 16, 434); }
  if(F.phase === 'bite'){ centerText(c, '! BẤM NGAY !', 200, 40, '#ff8a2b'); }
  if(F.phase === 'fight'){ const f = F.hook; c.fillStyle = 'rgba(10,15,34,.8)'; c.fillRect(16, 46, 260, 64); c.font = '17px VT323, monospace'; c.fillStyle = '#fff'; c.fillText('Độ căng dây', 24, 64); c.fillText('Sức cá', 24, 92);
    c.fillStyle = '#263238'; c.fillRect(110, 54, 156, 12); c.fillStyle = F.T > 85 ? '#ef4b4b' : F.T > 60 ? '#ff8a2b' : '#2fbf71'; c.fillRect(110, 54, Math.min(1, F.T/100)*156, 12); c.fillStyle = '#263238'; c.fillRect(110, 82, 156, 12); c.fillStyle = '#4fc3f7'; c.fillRect(110, 82, F.S*156, 12);
    c.font = '18px VT323, monospace'; c.fillStyle = '#fff'; c.fillText(`Dây còn ${F.dist.toFixed(1)} m ${F.running ? '· CÁ ĐANG VÙNG CHẠY!' : ''}`, 16, 130); }
  if(F.msgT > 0) centerText(c, F.msg, 120, 22, '#ffd23f');
  if(F.card){ const k = F.card, f = k.f; c.fillStyle = 'rgba(5,8,20,.82)'; c.fillRect(0, 0, 800, 450); c.fillStyle = '#141b3a'; c.fillRect(180, 50, 440, 350); c.strokeStyle = RCOL[f.sp.r]; c.lineWidth = 4; c.strokeRect(180, 50, 440, 350);
    c.save(); c.translate(400, 170); c.scale(1 + Math.sin(realT*3)*.03, 1 + Math.sin(realT*3)*.03); drawSea2(c, Object.assign({}, f, {vx:1}), 0, 0, Math.min(1.4, 140/Math.max(60, 14 + Math.pow(f.w, .45)*9))); c.restore();
    c.textAlign = 'center'; c.font = '26px Bungee, sans-serif'; c.fillStyle = RCOL[f.sp.r]; c.fillText(f.sp.n, 400, 270); c.font = '22px VT323, monospace'; c.fillStyle = '#fff'; c.fillText(`${f.w} kg · ${RARITY[f.sp.r]} ${'★'.repeat(f.sp.r + 1)}`, 400, 300);
    c.fillStyle = '#ffd23f'; c.fillText(`+$${k.value} · +${k.exp} EXP${k.newSp ? ' · LOÀI MỚI!' : k.rec ? ' · KỶ LỤC MỚI!' : ''}`, 400, 330); c.fillStyle = '#8ea0d6'; c.fillText('Bấm Space hoặc "Câu tiếp" để thả câu lại', 400, 370); c.textAlign = 'left'; }
}
function dfDex(){ const box = $('#dfDex'); if(!box || !PROF) return; box.innerHTML = ''; const zs = SPECIES.filter(s => s.z === DF.zone); zs.forEach(s => { const d = PROF.fish[s.n]; const li = el('li'); li.textContent = d ? `${s.n} · ${d.n} con · kỷ lục ${d.best} kg` : `??? (${RARITY[s.r]})`; li.style.color = d ? RCOL[s.r] : ''; box.appendChild(li); }); $('#dfCount').textContent = `${zs.filter(s => PROF.fish[s.n]).length}/${zs.length} loài ở vùng này · tổng ${Object.keys(PROF.fish).length}/${SPECIES.length} loài`; }
function ext12Init(){
  const cv = $('#dfCv'); cv.width = 800; cv.height = 450;
  cv.addEventListener('pointerdown', e => { e.preventDefault(); if(!DF) return; DF.hold = true; if(DF.phase === 'bite') DF.tap = true; if(DF.phase === 'card') dfNext(); });
  ['pointerup','pointercancel','pointerleave'].forEach(ev => cv.addEventListener(ev, () => { if(DF) DF.hold = false; }));
  $('#dfNext').onclick = dfNext; $('#hFish').onclick = openDeepFish;
}

