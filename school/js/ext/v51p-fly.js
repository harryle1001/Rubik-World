// ================= v51p · MÁY BAY 2/3: lên/xuống máy bay, điều khiển (cảm ứng + phím), vật lý, camera, mây, khói, tiếng động cơ =================
const V51P_K = {ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', Space:'tu', KeyE:'tu', ShiftLeft:'tu', ShiftRight:'tu', KeyQ:'td', KeyX:'td', ControlLeft:'td'};
const v51pClamp = (v, a, b) => v < a ? a : v > b ? b : v;
const v51pProj = P => [P.x, P.y - P.alt*.22];   // vị trí vẽ máy bay: càng cao càng "nổi" lên
function v51pMsg(t, sec){ const m = document.getElementById('v51pMsg'); if(!m) return; m.textContent = t; m.hidden = false; V51P.msgT = realT + (sec || 3.2); }
function v51pNearAirport(){
  if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return false; const p = v46Pos(PLAYER), C = v51pC(), A = V51P_AP;
  return p[0] > C[0] + A.rx0 - 260 && p[0] < C[0] + A.rx1 + 260 && p[1] > C[1] + 4560 && p[1] < C[1] + 5120;
}
// ---------- lên máy bay ----------
function v51pBoard(id, air){
  const pl = v51pPlane(id || v51pState().sel); if(!v51pUnlocked(pl)){ toast('🔒 ' + pl.vi + ' mở ở Level ' + pl.lv + ' hoặc mua $' + pl.cost + ' trong Hangar.'); return false; }
  const Pl = typeof PLAYER !== 'undefined' ? PLAYER : null;
  if(!Pl || !Pl.visible){ toast('✈️ Hãy đăng nhập và vào thế giới trước khi lái máy bay nhé!'); return false; }
  if(Pl.v16fly){ toast('🎈 Bạn đang bay khinh khí cầu. Hạ cánh rồi mới lên máy bay nhé!'); return false; }
  if(typeof V50 !== 'undefined' && V50.open) return false;
  if(!air && !v51pNearAirport()){ v51pGuideOn(); toast('✈️ Máy bay đậu ở Sân bay Rubik (bờ biển phía nam đảo). Mũi tên vàng sẽ chỉ đường!'); return false; }
  try { if(Pl.boat) leaveBoat(Pl); } catch(e){} try { if(Pl.cycling) toggleBike(); } catch(e){} try { if(Pl.mount && typeof dismount === 'function') dismount(Pl, true); } catch(e){}
  try { cancelAuto(); } catch(e){}
  const C = v51pC(), A = V51P_AP, s = v51pState(); s.sel = pl.id; s.flights = (s.flights || 0) + 1; v51pSave();
  const P = V51P.P = {pl, x:C[0] + A.rx0 + 70, y:C[1] + A.ry, hdg:0, alt:0, vs:0, spd:0, bank:0, spin:0, ground:true, bn:Math.floor(Math.random()*9), tOff:0, emit:0, wob:0};
  if(pl.hover){ P.x = C[0] + A.taxi; P.y = C[1] + A.ry - 4; P.hdg = -Math.PI/2; }
  if(air){ P.x = air[0]; P.y = air[1]; P.hdg = air[2] || 0; P.alt = air[3] || 280; P.spd = pl.hover ? 60 : pl.vmax*.65; P.ground = false; P.tOff = realT - 30; }
  V51P.on = true; V51P.thr = air ? .6 : 0; V51P.k = {}; V51P.stick.x = V51P.stick.y = 0; V51P.guide = null; V51P.fc = followCam; followCam = false;
  V51P.cz = cam.z; cam.x = P.x; cam.y = P.y; document.body.classList.add('v51pOn'); v51pHudBuild(); v51pHudShow(true); v51pSndStart();
  v51pMsg(air ? '✈️ Đang bay! Kéo ← → để rẽ, ↑ ↓ để lên/xuống.' : (pl.hover ? '🚁 Đẩy cần GA lên rồi kéo ↑ để cất cánh thẳng đứng.' : '🛫 Đẩy cần GA lên hết, chạy trên đường băng, đủ tốc độ thì kéo ↑ để cất cánh!'), 5);
  return true;
}
// ---------- xuống máy bay ----------
function v51pCanExit(){ const P = V51P.P; if(!P || !P.ground || P.spd > 30) return false; const C = v51pC(); return Math.hypot(P.x - C[0], P.y - C[1]) < V46L.ISLAND - 60; }
function v51pExit(force){
  const P = V51P.P; if(!V51P.on) return; if(!force && !v51pCanExit()){ v51pMsg(P && !P.ground ? '🛬 Hạ cánh và dừng hẳn trên đảo rồi mới xuống nhé!' : '⏹️ Giảm GA để máy bay dừng hẳn trên đảo đã.'); return; }
  if(V51P.mg) v51pMgEnd(true);
  const C = v51pC(), A = V51P_AP, Pl = PLAYER; let x = P.x, y = P.y + 46;
  if(force || !v46Walk(x, y) || v46ZoneNew(x, y)){ x = C[0] + A.taxi + 60; y = C[1] + A.hangar[1] + A.hangar[3] + 40; }
  if(Pl){ Pl.x = x + V46E; Pl.y = y; Pl._z = null; Pl.v46t = null; Pl._lx = Pl.x; Pl._ly = Pl.y; Pl.moving = false; }
  V51P.on = false; V51P.P = null; V51P.k = {}; v51pSndStop(); v51pHudShow(false); document.body.classList.remove('v51pOn');
  followCam = V51P.fc !== false; cam.z = Math.max(.6, Math.min(1.4, V51P.cz || 1)); cam.x = x; cam.y = y; try { clampCam(); } catch(e){}
  try { select(PLAYER, true); if(!PLAYER.controlled) setControl(true); followCam = true; } catch(e){}
  if(!force) toast('👋 Đã xuống máy bay. Máy bay về đậu trong Hangar.');
}
// ---------- bàn phím (chỉ chặn khi đang lái) ----------
function v51pKey(e, on){
  const t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  const k = V51P_K[e.code]; if(!V51P.on){ return; }
  if(e.code === 'Escape' && on){ if(!document.getElementById('v51pPanel').hidden) v51pPanel(null); else if(V51P.mg) v51pMgEnd(true); else v51pExit(); e.preventDefault(); e.stopPropagation(); return; }
  if(!k) return; V51P.k[k] = on; e.preventDefault(); e.stopPropagation();
}
// ---------- vật lý ----------
function v51pTick(dt){
  const P = V51P.P; if(!P || dt <= 0) return; const pl = P.pl, k = V51P.k, st = V51P.stick;
  if(typeof V50 !== 'undefined' && V50.open){ P.spd = 0; return; }
  const turn = v51pClamp((k.right ? 1 : 0) - (k.left ? 1 : 0) + st.x, -1, 1), climb = v51pClamp((k.up ? 1 : 0) - (k.down ? 1 : 0) - st.y, -1, 1);
  if(k.tu) V51P.thr = Math.min(1, V51P.thr + dt*.7); if(k.td) V51P.thr = Math.max(0, V51P.thr - dt*.7);
  const thr = V51P.thr, surf = v51pSurface(P.x, P.y), W = (typeof WEATHERS !== 'undefined' && WEATHERS[weather]) ? WEATHERS[weather].wind || 0 : 0;
  V51P.windA = (V51P.windA || 0) + (Math.sin(realT*.03)*.6 + .4 - (V51P.windA || 0))*dt*.05;
  const air = P.alt > 0;
  if(pl.hover){
    const tgt = thr*pl.vmax*(air ? 1 : .25); P.spd += v51pClamp(tgt - P.spd, -pl.acc*1.5*dt, pl.acc*dt);
    if(!air && climb > .2){ P.alt = 1; P.vs = 30; P.ground = false; P.tOff = realT; v51pMsg('🚁 Cất cánh thẳng đứng!'); v51pBeep('up'); }
    if(P.alt > 0){ P.vs += (climb*pl.climb - P.vs)*Math.min(1, dt*2.5); P.alt += P.vs*dt; }
  } else {
    const roll = surf === 'runway' || (pl.water && surf === 'water'); let tgt = thr*pl.vmax; if(!air && !roll) tgt = Math.min(tgt, 45);
    P.spd += v51pClamp(tgt - P.spd, -(air ? .6 : 1.6)*pl.acc*dt, pl.acc*dt); if(!air && thr < .05) P.spd = Math.max(0, P.spd - 60*dt);
    if(!air && roll && P.spd >= pl.vr && (climb > .15 || P.spd > pl.vr*1.3)){ P.alt = 1; P.vs = 45; P.ground = false; P.tOff = realT; v51pMsg('🛫 Cất cánh! Kéo ↑ để lên cao, giữ GA vừa phải.'); v51pBeep('up'); }
    if(P.alt > 0){ const lift = v51pClamp((P.spd - pl.vr*.7)/(pl.vr*.5), 0, 1), vsT = climb*pl.climb*lift + (thr < .35 ? -pl.sink*(1 - thr/.35) : 0) - (1 - lift)*70 + (climb < -.1 ? climb*40 : 0);
      P.vs += (vsT - P.vs)*Math.min(1, dt*2.2); P.alt += P.vs*dt; }
  }
  const AM = typeof V57P_ALTMAX === 'number' ? V57P_ALTMAX : 1100; if(P.alt > AM){ P.alt = AM; P.vs = Math.min(P.vs, 0); }
  // rẽ: trên đất rẽ chậm theo tốc độ; trực thăng rẽ tại chỗ
  const g = P.alt <= 0, rate = pl.turn*turn*(pl.hover ? 1 : g ? .55*Math.min(1, P.spd/50) : 1);
  P.hdg += rate*dt; P.bank += ((g ? 0 : turn) - P.bank)*Math.min(1, dt*4);
  // gió: máy bay trôi và lắc nhẹ (an toàn, không mất lái)
  const wx = Math.cos(V51P.windA*6.283)*W*28, wy = Math.sin(V51P.windA*6.283)*W*28;
  P.x += Math.cos(P.hdg)*P.spd*dt + (g ? 0 : wx*dt); P.y += Math.sin(P.hdg)*P.spd*dt + (g ? 0 : wy*dt);
  P.wob = g ? 0 : Math.sin(realT*3.1)*W*.09 + Math.sin(realT*7.3)*W*.04;
  // v57p: bay tự do khắp thế giới (rìa thế giới quay đầu nhẹ trong v57p)
  // chạm đất
  if(air && P.alt <= 0) v51pTouch(surf);
  if(P.alt < 0) P.alt = 0;
  P.ground = P.alt <= 0;
  // khói
  P.spin += dt*(6 + thr*40 + (pl.hover && !P.ground ? 30 : 0));
  const sky = V51P.mg && V51P.mg.id === 'sky', every = sky ? .03 : .06;
  if(P.alt > 12 && (P.spd > 40 || sky) && (P.emit -= dt) <= 0){ P.emit = every; v51pPuffAdd(P.x - Math.cos(P.hdg)*24, P.y - Math.sin(P.hdg)*24, P.alt, sky ? 26 : 2.2, sky); }
  // bóng nước khi lướt nước (thủy phi cơ)
  if(P.ground && surf === 'water' && P.spd > 40 && Math.random() < dt*20) v51pPuffAdd(P.x - Math.cos(P.hdg)*20, P.y - Math.sin(P.hdg)*20, 0, .8, false);
  if(typeof v51pMgTick === 'function') v51pMgTick(dt);
  v51pSndTick();
  if(realT > V51P.msgT){ const m = document.getElementById('v51pMsg'); if(m && !m.hidden) m.hidden = true; }
}
function v51pTouch(surf){
  const P = V51P.P, pl = P.pl, sp = -P.vs, ok = pl.hover ? surf !== 'water' : (surf === 'runway' || (pl.water && surf === 'water'));
  if(!ok){ P.alt = 6; P.vs = Math.max(0, P.vs); return; }   // v57p: không có đường băng → lướt êm sát mặt đất, không hiện chữ
  if(sp > 150){ P.alt = 2; P.vs = sp*.45; P.spd *= .85; v51pBeep('bounce'); v51pMsg('🏀 Bịch! Hạ cánh hơi mạnh nên máy bay nảy lên. Lần sau kéo ↓ nhẹ hơn nhé!', 3.5); return; }
  P.alt = 0; P.vs = 0; P.ground = true; v51pBeep(sp < 70 ? 'ok' : 'land');
  if(surf === 'water') for(let i = 0; i < 10; i++) v51pPuffAdd(P.x + (Math.random() - .5)*40, P.y + (Math.random() - .5)*30, 0, 1, false);
  const flew = realT - (P.tOff || realT);
  if(sp < 70 && flew > 12 && !V51P.mg){ const r = v51pReward('land', .35 + (1 - sp/70)*.4, 'Hạ cánh mềm'); const s = v51pState(); s.lands = (s.lands || 0) + 1; v51pSave(); v51pMsg('🪶 Hạ cánh mềm như bông! +$' + r.money + ' · +' + r.exp + ' EXP', 4); }
  else v51pMsg(sp < 70 ? '🛬 Hạ cánh mềm! Giảm GA để dừng lại.' : '🛬 Hạ cánh an toàn. Lần sau hạ nhẹ hơn để được thưởng!', 3.5);
  const isl = v51pIslAt(P.x, P.y); if(isl && typeof v51pIslLanded === 'function') v51pIslLanded(isl);
}
// ---------- khói (pool cố định) ----------
function v51pPuffAdd(x, y, alt, life, sky){
  const S0 = V51P.smoke; let p = null; if(S0.length < 520) { p = {}; S0.push(p); } else { let o = 0; for(let i = 1; i < S0.length; i++) if(S0[i].t0 < S0[o].t0) o = i; p = S0[o]; }
  p.x = x; p.y = y; p.alt = alt; p.t0 = realT; p.life = life; p.sky = sky;
}
function v51pDrawSmoke(VBn){
  const img = v51pPuff(), S0 = V51P.smoke; if(!S0.length) return; ctx.save();
  for(let i = 0; i < S0.length; i++){ const p = S0[i], a = (realT - p.t0)/p.life; if(a >= 1 || a < 0) continue; const x = p.x, y = p.y - p.alt*.22; if(x < VBn.x0 - 60 || x > VBn.x1 + 60 || y < VBn.y0 - 60 || y > VBn.y1 + 60) continue;
    const r = p.sky ? 22 + a*14 : 7 + a*18; ctx.globalAlpha = p.sky ? (1 - a*a)*.9 : (1 - a)*.55; ctx.drawImage(img, x - r, y - r, r*2, r*2); }
  ctx.restore();
}
// ---------- mây trôi (lưới cố định theo ô, không tạo object mới) ----------
function v51pHash(i, j, s){ const h = Math.sin(i*127.1 + j*311.7 + s*74.7)*43758.5453; return h - Math.floor(h); }
function v51pDrawClouds(VBn, alpha){
  if(alpha <= .02) return; const img = v51pCloud(), S0 = 1150, rainy = /mua|bao|loc|samset|suongmu/.test(weather || ''), th = rainy ? .7 : .42, drift = realT*14;
  ctx.save(); ctx.globalAlpha = alpha; if(rainy) ctx.globalAlpha = alpha*.9;
  for(let j = Math.floor((VBn.y0 - 300)/S0); j*S0 < VBn.y1 + 300; j++) for(let i = Math.floor((VBn.x0 - 500 - drift)/S0); i*S0 + drift < VBn.x1 + 300; i++){
    if(v51pHash(i, j, 1) > th) continue; const sc = 1.6 + v51pHash(i, j, 2)*2.4, x = i*S0 + v51pHash(i, j, 3)*700 + drift, y = j*S0 + v51pHash(i, j, 4)*700 - 132;
    ctx.drawImage(img, x, y, 220*sc, 110*sc); }
  ctx.restore();
}
// ---------- mưa / tuyết trên màn hình khi đang bay ----------
function v51pDrawRain(dt){
  const w = weather || '', snow = /tuyet/.test(w), rain = /mua|bao|loc|samset/.test(w); if(!snow && !rain) return;
  const R0 = V51P.rain, n = (typeof v26Low === 'function' && v26Low()) ? 40 : 80; while(R0.length < n) R0.push({x:Math.random()*cw, y:Math.random()*ch, v:.6 + Math.random()*.6});
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = snow ? 'rgba(255,255,255,.85)' : 'rgba(200,220,255,.5)';
  const P = V51P.P, sx = P ? -Math.cos(P.hdg)*P.spd*.4 : 0;
  for(let i = 0; i < n; i++){ const r = R0[i]; r.y += (snow ? 80 : 620)*r.v*dt; r.x += (sx + (snow ? Math.sin(realT + i)*20 : -60))*dt; if(r.y > ch) { r.y -= ch; r.x = Math.random()*cw; } if(r.x < 0) r.x += cw; if(r.x > cw) r.x -= cw;
    if(snow) ctx.fillRect(r.x, r.y, 3, 3); else ctx.fillRect(r.x, r.y, 1.5, 14); }
}
// ---------- lớp vẽ trên cùng: gọi sau v46Render ----------
function v51pOverlay(dt){
  const VBn = V46.VBn; if(!VBn) return; ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z)), Math.round(DPR*(ch/2 - cam.y*cam.z))); ctx.imageSmoothingEnabled = false;
  const dark = Math.max(0, (typeof lightLevel === 'function' ? lightLevel() : 0) - .05);
  try { v51pDrawApLive(VBn, dark); } catch(e){}
  if(!V51P.on){ v51pDrawSmoke(VBn); v51pDrawGuide(VBn); return; }
  const P = V51P.P, pl = P.pl, D = v51pProj(P), sc = 1.3*(1 + P.alt/650), cl = Math.min(1, P.alt/260);
  if(typeof v51pMgDraw === 'function') v51pMgDraw(VBn, 0);
  ctx.globalAlpha = Math.max(.12, .32 - P.alt/2600); v51pDrawCraft(pl, P.x + P.alt*.18, P.y + P.alt*.05, P.hdg, P.bank, 1.25*(1 - Math.min(.3, P.alt/3000)), 0, true); ctx.globalAlpha = 1;
  if(P.alt >= 520) v51pDrawClouds(VBn, .85*cl);
  v51pDrawSmoke(VBn);
  v51pDrawCraft(pl, D[0], D[1], P.hdg + P.wob, P.bank, sc, P.spin, false);
  if(dark > .05){ ctx.globalAlpha = Math.min(.55, dark*.7); v51pDrawCraft(pl, D[0], D[1], P.hdg + P.wob, P.bank, sc, 0, true); ctx.globalAlpha = 1; }
  // đèn nháy cánh: đỏ trái, xanh phải, trắng nháy đuôi (luôn bật, rõ hơn khi trời tối)
  const ca = Math.cos(P.hdg), sa = Math.sin(P.hdg), wl = 26*sc*(1 - Math.abs(P.bank)*.28), lx = -sa*wl, ly = ca*wl, k = .45 + Math.min(.55, dark*1.5);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; const q = 14*Math.max(1, sc*.8);
  ctx.drawImage(v51pGlow('rgba(255,60,50,1)'), D[0] - lx - q/2, D[1] - ly - q/2, q, q); ctx.drawImage(v51pGlow('rgba(60,255,110,1)'), D[0] + lx - q/2, D[1] + ly - q/2, q, q);
  if((realT*1.3) % 1 < .12){ ctx.globalAlpha = 1; ctx.drawImage(v51pGlow('rgba(255,255,255,1)'), D[0] - ca*28*sc - q, D[1] - sa*28*sc - q, q*2, q*2); }
  if(dark > .3 && !pl.hover){ ctx.globalAlpha = Math.min(.5, dark*.6); const L = 90*sc; ctx.drawImage(v51pGlow('rgba(255,245,200,1)'), D[0] + ca*L - L*.6, D[1] + sa*L - L*.6, L*1.2, L*1.2); }
  ctx.restore();
  if(P.alt < 520) v51pDrawClouds(VBn, .5*cl);
  if(typeof v51pMgDraw === 'function') v51pMgDraw(VBn, 1);
  v51pDrawRain(dt);
}
// mũi tên vàng chỉ đường tới sân bay (khi đang đi bộ)
function v51pGuideOn(){ V51P.guide = realT + 90; }
function v51pDrawGuide(){
  if(!V51P.guide || realT > V51P.guide || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return; if(v51pNearAirport()){ V51P.guide = null; toast('✈️ Tới Sân bay rồi! Bấm nút Máy bay để lên.'); return; }
  const C = v51pC(), tx = C[0] + V51P_AP.taxi, ty = C[1] + V51P_AP.hangar[1] + 150, p = v46Pos(PLAYER), a = Math.atan2(ty - p[1], tx - p[0]);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const r = Math.min(cw, ch)*.36, x = cw/2 + Math.cos(a)*r, y = ch/2 + Math.sin(a)*r;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1d2238'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-12, -16); ctx.lineTo(-4, 0); ctx.lineTo(-12, 16); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
  ctx.font = '800 16px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#1d2238'; ctx.fillRect(x - 46, y + 22, 92, 24); ctx.fillStyle = '#ffd23f'; ctx.fillText('✈️ ' + Math.round(Math.hypot(tx - p[0], ty - p[1])/10) + ' m', x, y + 39);
}
// ---------- camera: kéo xa dần theo độ cao ----------
function v51pCam(dt){
  const P = V51P.P; if(!P) return; const D = v51pProj(P), small = Math.min(cw, ch) < 520, base = small ? .78 : 1, zT = Math.max(small ? .24 : .3, base*(1 - .72*Math.min(1, P.alt/950)) - P.spd/3000), k = Math.min(1, dt*3);
  const tx = D[0] + Math.cos(P.hdg)*P.spd*.45, ty = D[1] + Math.sin(P.hdg)*P.spd*.45;
  cam.x += (tx - cam.x)*k; cam.y += (ty - cam.y)*k; cam.z += (zT - cam.z)*Math.min(1, dt*1.4);
}
// ---------- âm thanh: động cơ WebAudio (không dùng file) ----------
function v51pVol(){ return (typeof V39S !== 'undefined' && V39S.vol) ? V39S.vol.sfx : .8; }
function v51pSndStart(){
  try { if(v51pVol() <= 0 || typeof ensureAC !== 'function') return; ensureAC(); if(!AC) return; v51pSndStop(true); const t = AC.currentTime, out = typeof v39Bus === 'function' ? v39Bus() : AC.destination;
    const o1 = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), am = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = 0; am.gain.value = 1; lfo.frequency.value = 11; lg.gain.value = V51P.P && V51P.P.pl.hover ? .5 : .08;
    o1.connect(f); o2.connect(f); f.connect(am); am.connect(g); g.connect(out); lfo.connect(lg); lg.connect(am.gain); o1.start(t); o2.start(t); lfo.start(t);
    V51P.snd = {o1, o2, f, g, lfo};
  } catch(e){ V51P.snd = null; }
}
function v51pSndTick(){
  const s = V51P.snd, P = V51P.P; if(!s || !P || !AC) return; const t = AC.currentTime, thr = V51P.thr, mute = document.hidden || (typeof V50 !== 'undefined' && V50.open);
  const f = (P.pl.hover ? 38 : 48) + thr*60 + P.spd*.06; s.o1.frequency.setTargetAtTime(f, t, .15); s.o2.frequency.setTargetAtTime(f*1.5, t, .15); s.f.frequency.setTargetAtTime(300 + thr*700, t, .2);
  s.g.gain.setTargetAtTime(mute ? 0 : .035*v51pVol()*(.45 + thr*.55), t, .15);
}
function v51pSndStop(now){ const s = V51P.snd; if(!s) return; V51P.snd = null; try { const t = AC.currentTime; s.g.gain.setTargetAtTime(0, t, .08); [s.o1, s.o2, s.lfo].forEach(o => o.stop(t + (now ? .05 : .4))); } catch(e){} }
function v51pBeep(k){
  try { if(v51pVol() <= 0 || typeof ensureAC !== 'function') return; ensureAC(); const t = AC.currentTime, out = typeof v39Bus === 'function' ? v39Bus() : AC.destination;
    const N = {up:[330, 660, .35, 'triangle'], ok:[660, 990, .3, 'sine'], land:[440, 330, .25, 'sine'], bad:[300, 200, .25, 'sine'], bounce:[220, 440, .18, 'square'], ring:[880, 1320, .18, 'sine'], drop:[520, 260, .3, 'triangle'], win:[523, 1046, .5, 'triangle']}[k] || [600, 800, .2, 'sine'];
    const o = AC.createOscillator(), g = AC.createGain(); o.type = N[3]; o.frequency.setValueAtTime(N[0], t); o.frequency.exponentialRampToValueAtTime(N[1], t + N[2]);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08*v51pVol(), t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + N[2] + .05); o.connect(g); g.connect(out); o.start(t); o.stop(t + N[2] + .08);
  } catch(e){}
}
// ---------- HUD khi bay (DOM, cập nhật 4 lần/giây) ----------
function v51pHudBuild(){
  if(document.getElementById('v51pHud')) return; const st = document.getElementById('stage') || document.body, h = document.createElement('div'); h.id = 'v51pHud'; h.hidden = true;
  h.innerHTML = '<div id="v51pPad" aria-label="Kéo để lái"><div id="v51pKnob"></div></div>' +
    '<div class="v51pTop"><button type="button" class="v51pIb" id="v51pX" aria-label="Xuống máy bay">✕</button><div id="v51pStat"></div><button type="button" class="v51pIb" id="v51pGm" aria-label="Mini game bay">🎯</button><button type="button" class="v51pIb" id="v51pHelp" aria-label="Hướng dẫn">?</button></div>' +
    '<div id="v51pMg" hidden></div><div id="v51pMsg" hidden></div>' +
    '<div id="v51pThr" aria-label="Cần ga"><div class="v51pTrk"><div id="v51pThrF"></div><div id="v51pThrK"></div></div><b>GA</b></div>' +
    '<button type="button" id="v51pAct" hidden></button>';
  st.appendChild(h);
  h.querySelector('#v51pX').onclick = () => { if(V51P.mg) v51pMgEnd(true); else v51pExit(); };
  h.querySelector('#v51pGm').onclick = () => v51pPanel('games'); h.querySelector('#v51pHelp').onclick = () => v51pPanel('help');
  h.querySelector('#v51pAct').onclick = () => { const a = V51P.act; if(a) a.f(); };
  // cần lái ảo: chạm và kéo ở bất kỳ đâu trên màn hình
  const pad = h.querySelector('#v51pPad'), knob = h.querySelector('#v51pKnob'); let pid = null, ox = 0, oy = 0;
  pad.addEventListener('pointerdown', e => { if(pid !== null) return; pid = e.pointerId; ox = e.clientX; oy = e.clientY; try { pad.setPointerCapture(pid); } catch(er){} knob.style.cssText = 'display:block;left:' + ox + 'px;top:' + oy + 'px'; e.preventDefault(); });
  pad.addEventListener('pointermove', e => { if(e.pointerId !== pid) return; const R = Math.min(90, Math.min(innerWidth, innerHeight)*.16), dx = v51pClamp((e.clientX - ox)/R, -1, 1), dy = v51pClamp((e.clientY - oy)/R, -1, 1);
    V51P.stick.x = Math.abs(dx) < .12 ? 0 : dx; V51P.stick.y = Math.abs(dy) < .12 ? 0 : dy; knob.style.transform = 'translate(' + (dx*R) + 'px,' + (dy*R) + 'px)'; });
  const up = e => { if(e.pointerId !== pid) return; pid = null; V51P.stick.x = V51P.stick.y = 0; knob.style.display = 'none'; knob.style.transform = ''; };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
  const thr = h.querySelector('#v51pThr .v51pTrk'); let tid = null; const setT = e => { const r = thr.getBoundingClientRect(); V51P.thr = v51pClamp(1 - (e.clientY - r.top)/r.height, 0, 1); v51pHudThr(); };
  thr.addEventListener('pointerdown', e => { tid = e.pointerId; try { thr.setPointerCapture(tid); } catch(er){} setT(e); e.preventDefault(); e.stopPropagation(); });
  thr.addEventListener('pointermove', e => { if(e.pointerId === tid) setT(e); }); thr.addEventListener('pointerup', () => { tid = null; }); thr.addEventListener('pointercancel', () => { tid = null; });
}
function v51pHudShow(on){ const h = document.getElementById('v51pHud'); if(h) h.hidden = !on; if(!on){ const p = document.getElementById('v51pPanel'); if(p && V51P.panelK !== 'hangar') v51pPanel(null); } if(on) v51pHud(true); }
function v51pHudThr(){ const f = document.getElementById('v51pThrF'), k = document.getElementById('v51pThrK'); if(!f) return; const p = Math.round(V51P.thr*100); f.style.height = p + '%'; k.style.bottom = 'calc(' + p + '% - 14px)'; }
function v51pHud(force){
  if(!V51P.on) return; const P = V51P.P; if(!P) return; v51pHudThr();
  const s = '<b>' + (P.pl.hover ? '🚁' : '✈️') + ' ' + P.pl.vi + '</b><span>⛰️ ' + Math.round(P.alt*.6) + ' m</span><span>💨 ' + Math.round(P.spd*.8) + ' km/h</span>';
  const e = document.getElementById('v51pStat'); if(e && (force || e._s !== s)){ e._s = s; e.innerHTML = s; }
  // nút ngữ cảnh: xuống máy bay / vào học viện
  let a = null; const isl = P.ground ? v51pIslAt(P.x, P.y) : null;
  if(isl && isl.magic && P.spd < 30) a = {t:'🌀 Vào Học viện Phép thuật', f:() => { if(typeof v50Open === 'function'){ V51P.thr = 0; v50Open(); } }};
  else if(V51P.mg && V51P.mg.done) a = {t:'🔁 Play again', f:() => v51pMgStart(V51P.mg.id)};
  else if(v51pCanExit() && !V51P.mg) a = {t:'👋 Xuống máy bay', f:() => v51pExit()};
  V51P.act = a; const b = document.getElementById('v51pAct'); if(b){ const t = a ? a.t : ''; if(b._t !== t){ b._t = t; b.textContent = t; b.hidden = !a; } }
}
