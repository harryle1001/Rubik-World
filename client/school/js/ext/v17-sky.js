// ================= EXT22 (v17): the sky grows as tall as the ocean (land in the middle) — 5 sky layers + flying =================
const SKYL = [
  {y0:-2700, y1:-1400, n:'Tầng mây', alt:'1–3 km'},
  {y0:-4000, y1:-2700, n:'Tầng máy bay', alt:'3–12 km'},
  {y0:-5300, y1:-4000, n:'Tầng bình lưu & cực quang', alt:'12–100 km'},
  {y0:-6600, y1:-5300, n:'Quỹ đạo vệ tinh', alt:'400–36.000 km'},
  {y0:Y0,    y1:-6600, n:'Vũ trụ bao la', alt:'tới Mặt Trăng và các hành tinh'}
];
const skyLayerAt = y => SKYL.find(l => y >= l.y0 && y < l.y1) || null;
const SKY = {t:0, planes:[], balloons:[], sats:[], para:[], comet:{x:0, y:-7000, v:180}, layer:null, glideT:0};
const h01 = (a, b) => { let h = (a*374761393 + b*668265263) | 0; h = (h ^ (h >>> 13))*1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
const lerpC = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v)*k));
function skyInit(){
  SKY.planes = [0, 1, 2, 3].map(i => ({x:h01(i, 1)*W, y:-2800 - i*300, v:(120 + i*30)*(i % 2 ? -1 : 1), c:['#eceff1','#ffd23f','#ef4b4b','#3d7bff'][i]}));
  SKY.balloons = [0, 1, 2, 3, 4, 5].map(i => ({x:h01(i, 2)*W, y:-1700 - h01(i, 3)*900, v:8 + i*3, c:[['#ef4b4b','#ffd23f'], ['#3d7bff','#fff'], ['#2fbf71','#ffd23f'], ['#ff8a2b','#b06bff'], ['#ef4b4b','#fff'], ['#26c6da','#ff6f91']][i]}));
  SKY.para = [0, 1, 2].map(i => ({x:h01(i, 4)*W, y:-3300 - i*220, v:40 + i*10, c:['#ff6f91','#2fbf71','#ffd23f'][i]}));
  SKY.sats = Array.from({length:8}, (_, i) => ({x:h01(i, 5)*W, y:-5450 - h01(i, 6)*1000, v:(40 + h01(i, 7)*60)*(i % 2 ? -1 : 1)}));
}
const SKY_OBJ = {
  iss:{x:2600, y:-5950, n:'Trạm vũ trụ quốc tế ISS', f:'ISS bay quanh Trái Đất mỗi 90 phút, phi hành gia thấy 16 lần bình minh mỗi ngày!'},
  hubble:{x:7000, y:-5700, n:'Kính thiên văn Hubble', f:'Hubble chụp được những thiên hà cách xa hàng tỉ năm ánh sáng.'},
  moon:{x:5200, y:-7250, n:'Mặt Trăng', f:'Mặt Trăng cách Trái Đất khoảng 384.000 km và luôn quay một mặt về phía chúng ta.'},
  mars:{x:8600, y:-7000, n:'Sao Hỏa', f:'Sao Hỏa đỏ vì đất chứa nhiều gỉ sắt. Một ngày ở đó dài 24 giờ 37 phút.'},
  saturn:{x:1500, y:-7150, n:'Sao Thổ', f:'Vành đai Sao Thổ làm từ hàng tỉ mảnh băng và đá, rộng gần 280.000 km.'},
  jupiter:{x:9700, y:-7500, n:'Sao Mộc', f:'Sao Mộc lớn tới mức chứa vừa hơn 1.300 Trái Đất.'},
  aurora:{x:5000, y:-4650, n:'Cực quang', f:'Cực quang là ánh sáng khi gió Mặt Trời va vào bầu khí quyển gần hai cực.'},
  rainbow:{x:6000, y:-2150, n:'Cầu vồng', f:'Cầu vồng có 7 màu: đỏ, cam, vàng, lục, lam, chàm, tím, do ánh nắng xuyên qua giọt mưa.'},
  blimp:{x:3400, y:-3500, n:'Khí cầu Trường Rubik', f:'Khí cầu bay nhờ khí heli nhẹ hơn không khí.'}
};
function skyFact(k){ const o = SKY_OBJ[k]; toast(`${o.n}: ${o.f}`); if(!PROF) return; PROF.skyseen = PROF.skyseen || {}; const day = new Date().toDateString(); if(PROF.skyseen[k] !== day){ PROF.skyseen[k] = day; reward(6, 4, 'Khám phá ' + o.n, true); saveProfile(); } if(k === 'moon') setTimeout(openScope, 1200); }
function skyDoors(d){ Object.keys(SKY_OBJ).forEach(k => { const o = SKY_OBJ[k]; d.push({x:o.x, y:o.y + 20, n:'Khám phá: ' + o.n, f:() => skyFact(k)}); }); }

// ---------- drawing the tall sky band (only the visible part) ----------
function drawSkyBand(dt){
  if(typeof FEED !== 'undefined' && FEED) return; if(VB.y0 > SY0) return; if(!SKY.planes.length) skyInit();
  SKY.t += dt || 0; const t = realT, x0 = Math.max(0, VB.x0), x1 = Math.min(W, VB.x1), yA = Math.max(Y0, VB.y0), yB = Math.min(SY0, VB.y1); if(x1 <= x0 || yB <= yA) return;
  const night = SKYST ? SKYST.night : 0, base = SKYST ? SKYST.top : [80, 150, 230];
  const stops = [[SY0, base], [-2700, lerpC([40, 110, 210], [10, 20, 60], night)], [-4000, lerpC([20, 70, 170], [6, 12, 40], night)], [-5300, lerpC([12, 28, 90], [4, 6, 24], night)], [-6600, [6, 6, 26]], [Y0, [0, 0, 6]]];
  const g = ctx.createLinearGradient(0, Y0, 0, SY0); stops.slice().reverse().forEach(([y, c]) => g.addColorStop((y - Y0)/(SY0 - Y0), `rgb(${c[0]},${c[1]},${c[2]})`));
  ctx.fillStyle = g; ctx.fillRect(x0, yA, x1 - x0, yB - yA);
  // stars: brighter the higher you fly
  const C = 160; for(let cy = Math.floor(yA/C)*C; cy < yB; cy += C) { const vis = Math.min(1, Math.max(0, (-cy - 3600)/2600) + night*.8); if(vis < .03) continue;
    for(let cx = Math.floor(x0/C)*C; cx < x1; cx += C) for(let k=0;k<3;k++){ const r = h01(cx + k*7, cy), sx = cx + h01(cx, cy + k)*C, sy = cy + h01(cx + k, cy + 3)*C; ctx.globalAlpha = vis*(.4 + .6*Math.abs(Math.sin(t*(1 + r*2) + r*20))); rect(r > .9 ? '#ffe082' : r > .8 ? '#90caf9' : '#ffffff', sx, sy, r > .85 ? 3 : 2, r > .85 ? 3 : 2); } }
  ctx.globalAlpha = 1;
  // layer labels
  SKYL.forEach(l => { if(l.y1 < yA - 60 || l.y1 - 60 > yB) return; for(let x = 300; x < W; x += 2400) if(x > x0 - 300 && x < x1 + 300){ ctx.globalAlpha = .55; ctx.font = '28px Bungee, sans-serif'; ctx.fillStyle = '#ffffff'; ctx.fillText(l.n.toUpperCase(), x, l.y1 - 40); ctx.font = '18px VT323, monospace'; ctx.fillText('Độ cao ' + l.alt, x, l.y1 - 16); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(x0, l.y1, x1 - x0, 2); } });
  const inV = (x, y, m) => x > VB.x0 - m && x < VB.x1 + m && y > VB.y0 - m && y < VB.y1 + m, wrap = o => { if(o.x > W + 200) o.x = -200; if(o.x < -200) o.x = W + 200; };
  // cloud banks (layer 1)
  if(yB > -2900){ const CX = 520, CY = 260; for(let cy = Math.floor(Math.max(yA, -2700)/CY)*CY; cy < Math.min(yB, SY0); cy += CY) for(let cx = Math.floor(x0/CX)*CX - CX; cx < x1 + CX; cx += CX){ const r = h01(cx, cy); if(r < .45) continue; const bx = cx + ((t*10*(.5 + r)) % CX), by = cy + r*CY*.6; ctx.globalAlpha = night > .5 ? .25 : .8; ctx.fillStyle = night > .5 ? '#7986cb' : '#ffffff';
      [[0, 0, 60], [50, -16, 46], [-50, -8, 42], [95, 6, 34], [-95, 8, 30]].forEach(([a, b, rr]) => { ctx.beginPath(); ctx.arc(bx + a*(.7 + r), by + b, rr*(.7 + r*.6), 0, Math.PI*2); ctx.fill(); }); } ctx.globalAlpha = 1; }
  // rainbow
  const rb = SKY_OBJ.rainbow; if(inV(rb.x, rb.y, 400) && night < .5){ ['#ef5350','#ffa726','#ffee58','#66bb6a','#42a5f5','#3f51b5','#ab47bc'].forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = .55; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(rb.x, rb.y + 260, 300 - i*12, Math.PI, 2*Math.PI); ctx.stroke(); }); ctx.globalAlpha = 1; }
  // hot-air balloons
  SKY.balloons.forEach(b => { b.x += b.v*(dt || 0); wrap(b); const y = b.y + Math.sin(t*.6 + b.x*.01)*12; if(!inV(b.x, y, 80)) return; for(let k=0;k<6;k++){ ctx.fillStyle = b.c[k % 2]; ctx.beginPath(); ctx.ellipse(b.x, y, 34*(1 - Math.abs(k - 2.5)/4), 42, 0, 0, Math.PI*2); ctx.fill(); }
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x - 20, y + 30); ctx.lineTo(b.x - 8, y + 58); ctx.moveTo(b.x + 20, y + 30); ctx.lineTo(b.x + 8, y + 58); ctx.stroke(); rect('#8d6e4a', b.x - 10, y + 56, 20, 14); });
  // planes with contrails, paragliders, the school blimp
  SKY.planes.forEach(p => { p.x += p.v*(dt || 0); wrap(p); if(!inV(p.x, p.y, 600)) return; const d = p.v < 0 ? -1 : 1; ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x - d*30, p.y); ctx.lineTo(p.x - d*520, p.y + 4); ctx.stroke();
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(d, 1); rect(p.c, -30, -5, 60, 10); tri(30, -5, 40, 0, 30, 5, p.c); tri(-6, 0, -18, 26, 6, 0, '#90a4ae'); tri(-6, 0, -18, -26, 6, 0, '#b0bec5'); tri(-30, -5, -38, -18, -22, -5, p.c); for(let k=0;k<5;k++) rect('#263238', -16 + k*8, -3, 4, 3); ctx.restore(); });
  SKY.para.forEach(p => { p.x += p.v*(dt || 0); wrap(p); const y = p.y + Math.sin(t + p.x*.01)*20; if(!inV(p.x, y, 80)) return; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(p.x, y - 40, 40, 12, 0, Math.PI, 2*Math.PI); ctx.fill(); ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x - 38, y - 40); ctx.lineTo(p.x, y); ctx.lineTo(p.x + 38, y - 40); ctx.stroke(); rect('#3d7bff', p.x - 3, y - 4, 6, 10); circ(p.x, y - 6, 3, '#f2c9a0'); });
  const bl = SKY_OBJ.blimp, blx = bl.x + Math.sin(t*.2)*120; if(inV(blx, bl.y, 200)){ ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.ellipse(blx, bl.y, 110, 34, 0, 0, Math.PI*2); ctx.fill(); tri(blx - 100, bl.y, blx - 130, bl.y - 26, blx - 130, bl.y + 26, '#ef4b4b'); rect('#455a64', blx - 20, bl.y + 30, 40, 12); ctx.font = '18px Bungee, sans-serif'; ctx.fillStyle = '#3d7bff'; ctx.fillText('TRƯỜNG RUBIK', blx - 72, bl.y + 7); }
  // aurora ribbons (layer 3)
  if(yB > -5400 && yA < -3900){ for(let k=0;k<3;k++){ ctx.globalAlpha = .28 + .1*Math.sin(t + k); ctx.strokeStyle = ['#69f0ae','#b388ff','#18ffff'][k]; ctx.lineWidth = 34 - k*8; ctx.beginPath(); for(let x = x0 - 40; x <= x1 + 40; x += 40){ const y = -4650 + k*70 + Math.sin(x*.002 + t*.6 + k)*90 + Math.sin(x*.0007 - t*.3)*60; if(x <= x0 - 40) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); } ctx.globalAlpha = 1;
    const wx = 8200, wy = -4300 + Math.sin(t*.4)*60; if(inV(wx, wy, 100)){ circ(wx, wy, 26, '#fafafa'); ctx.strokeStyle = '#bdbdbd'; ctx.beginPath(); ctx.moveTo(wx, wy + 26); ctx.lineTo(wx, wy + 70); ctx.stroke(); rect('#ff7043', wx - 6, wy + 70, 12, 10); ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#fff'; ctx.fillText('Bóng thám không', wx - 50, wy - 34); } }
  // orbit: satellites, ISS, Hubble, an astronaut
  SKY.sats.forEach(s => { s.x += s.v*(dt || 0); wrap(s); if(!inV(s.x, s.y, 40)) return; rect('#cfd8dc', s.x - 4, s.y - 4, 8, 8); rect('#1565c0', s.x - 20, s.y - 3, 14, 6); rect('#1565c0', s.x + 6, s.y - 3, 14, 6); if(Math.floor(t*2 + s.x) % 2) rect('#ff5252', s.x - 1, s.y - 7, 2, 2); });
  const is = SKY_OBJ.iss; if(inV(is.x, is.y, 200)){ rect('#b0bec5', is.x - 70, is.y - 4, 140, 8); for(let k=-3;k<=3;k++){ if(!k) continue; rect('#1a237e', is.x + k*22 - 8, is.y - 34, 16, 26); rect('#1a237e', is.x + k*22 - 8, is.y + 8, 16, 26); } rect('#eceff1', is.x - 18, is.y - 10, 36, 20); circ(is.x, is.y, 8, '#cfd8dc');
    const ax = is.x + 90 + Math.sin(t*.7)*20, ay = is.y + 40 + Math.cos(t*.5)*14; circ(ax, ay - 10, 7, '#fafafa'); rect('#fafafa', ax - 6, ay - 4, 12, 14); rect('#ffb300', ax - 4, ay - 12, 8, 4); ctx.strokeStyle = '#eceff1'; ctx.beginPath(); ctx.moveTo(ax - 6, ay); ctx.quadraticCurveTo(ax - 40, ay - 10, is.x + 70, is.y); ctx.stroke(); plate('TRẠM VŨ TRỤ ISS', is.x, is.y - 50); }
  const hb = SKY_OBJ.hubble; if(inV(hb.x, hb.y, 120)){ ctx.save(); ctx.translate(hb.x, hb.y); ctx.rotate(-.3); rect('#cfd8dc', -30, -12, 60, 24); rect('#263238', 30, -10, 8, 20); rect('#1565c0', -14, -44, 12, 32); rect('#1565c0', -14, 12, 12, 32); ctx.restore(); plate('KÍNH HUBBLE', hb.x, hb.y - 56); }
  // deep space: moon, planets, a comet
  const mo = SKY_OBJ.moon; if(inV(mo.x, mo.y, 200)){ const gm = ctx.createRadialGradient(mo.x - 40, mo.y - 40, 20, mo.x, mo.y, 160); gm.addColorStop(0, '#fafafa'); gm.addColorStop(1, '#9e9e9e'); ctx.fillStyle = gm; ctx.beginPath(); ctx.arc(mo.x, mo.y, 150, 0, Math.PI*2); ctx.fill(); [[-50, -30, 24], [40, 20, 30], [-10, 60, 16], [70, -60, 14], [-80, 50, 12]].forEach(([a, b, r]) => circ(mo.x + a, mo.y + b, r, '#8d8d8d')); plate('MẶT TRĂNG', mo.x, mo.y - 170); }
  const pl = (o, r, c1, c2) => { if(!inV(o.x, o.y, r + 60)) return; const gp = ctx.createRadialGradient(o.x - r*.3, o.y - r*.3, r*.1, o.x, o.y, r); gp.addColorStop(0, c1); gp.addColorStop(1, c2); ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI*2); ctx.fill(); };
  pl(SKY_OBJ.mars, 50, '#ff8a65', '#8d2b0b'); pl(SKY_OBJ.jupiter, 90, '#ffe0b2', '#a1662f'); const ju = SKY_OBJ.jupiter; if(inV(ju.x, ju.y, 160)){ for(let k=-3;k<=3;k++){ ctx.globalAlpha = .25; rect('#6d4c2e', ju.x - Math.sqrt(8100 - (k*22)**2), ju.y + k*22 - 4, 2*Math.sqrt(8100 - (k*22)**2), 7); } ctx.globalAlpha = 1; circ(ju.x + 30, ju.y + 30, 12, '#bf360c'); }
  const sa = SKY_OBJ.saturn; if(inV(sa.x, sa.y, 200)){ ctx.strokeStyle = 'rgba(230,207,143,.9)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(sa.x, sa.y, 130, 30, -.25, Math.PI, 2*Math.PI); ctx.stroke(); pl(sa, 70, '#fff3c4', '#b8925a'); ctx.beginPath(); ctx.ellipse(sa.x, sa.y, 130, 30, -.25, 0, Math.PI); ctx.stroke(); }
  ['mars', 'jupiter', 'saturn'].forEach(k => { const o = SKY_OBJ[k]; if(inV(o.x, o.y, 200)) plate(o.n.toUpperCase(), o.x, o.y - (k === 'mars' ? 70 : 110)); });
  const cm = SKY.comet; cm.x += cm.v*(dt || 0); if(cm.x > W + 400) cm.x = -400; if(inV(cm.x, cm.y, 500)){ const gc = ctx.createLinearGradient(cm.x, 0, cm.x - 380, 0); gc.addColorStop(0, 'rgba(224,247,250,.9)'); gc.addColorStop(1, 'rgba(224,247,250,0)'); ctx.fillStyle = gc; ctx.beginPath(); ctx.moveTo(cm.x, cm.y - 10); ctx.lineTo(cm.x - 380, cm.y - 40); ctx.lineTo(cm.x - 380, cm.y + 30); ctx.lineTo(cm.x, cm.y + 10); ctx.fill(); circ(cm.x, cm.y, 10, '#ffffff'); }
}

// ---------- flying: hot-air balloon for the player ----------
function drawFlyer(a){
  const x = Math.round(a.x), y = Math.round(a.y), bob = Math.sin(realT*2)*3, c = (PROF && PROF.colors && PROF.colors.balloon) || ['#ef4b4b','#ffd23f'];
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y + 26, 16, 4, 0, 0, Math.PI*2); ctx.fill();
  const by = y - 70 + bob; for(let k=0;k<6;k++){ ctx.fillStyle = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#ff8a2b','#ffffff'][k]; ctx.beginPath(); ctx.ellipse(x, by, 30*(1 - Math.abs(k - 2.5)/4), 36, 0, 0, Math.PI*2); ctx.fill(); }
  if(a.moving && Math.floor(realT*6) % 2){ circ(x, by + 40, 4, '#ffb300'); circ(x, by + 38, 2, '#fff59d'); }
  ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 18, by + 26); ctx.lineTo(x - 9, y - 10 + bob); ctx.moveTo(x + 18, by + 26); ctx.lineTo(x + 9, y - 10 + bob); ctx.stroke();
  ctx.save(); ctx.translate(x, y - 2 + bob); const sx = a.x, sy = a.y, sm = a.moving; a.x = 0; a.y = 0; a.moving = false; try { drawBody(a, false); } catch(e){} a.x = sx; a.y = sy; a.moving = sm; ctx.restore();
  rect('#8d6e4a', x - 11, y - 8 + bob, 22, 12); rect('#6d4c2e', x - 11, y - 8 + bob, 22, 2);
}
function flyToggle(){
  if(!PROF){ openLogin(); return; } const P = PLAYER; if(!P || !P.visible){ toast('Hãy vào nhân vật của bạn trước đã.'); return; }
  if(P.v16fly){ flyLand(); return; }
  if(P.boat){ toast('Hãy lên bờ trước khi bay nhé.'); return; } if(P.inSub || P.flying){ toast('Chưa bay được lúc này.'); return; }
  try { cancelAuto(); } catch(e){} P.cycling = false; P.mount && typeof dismount === 'function' && dismount(P); P.v16fly = true; P.glide = false; select(P, false); if(!P.controlled) setControl(true); followCam = true;
  toast('Khinh khí cầu cất cánh! Dùng phím mũi tên bay lên trời. Bấm "Hạ cánh" khi muốn về mặt đất.'); flyBtn(); blipSfx(990);
}
function flyLand(){ const P = PLAYER; if(canMove(P.x, P.y, P.x, P.y)){ P.v16fly = false; P.glide = false; toast('Hạ cánh an toàn!'); flyBtn(); SKY.layer = null; return; }
  P.glide = true; toast(P.y < NY + 20 ? 'Đang hạ độ cao xuống đất liền…' : 'Đang bay về bờ để hạ cánh…'); }
function flyBtn(){ const b = $('#hFly'); if(b){ b.textContent = PLAYER && PLAYER.v16fly ? '🪂 Hạ cánh' : '🎈 Bay lên trời'; b.setAttribute('aria-pressed', !!(PLAYER && PLAYER.v16fly)); } }
function v16FlyMove(c, dt){
  if(c.glide){ const ty = c.y < NY + 20 ? NY + 80 : 850, d = ty - c.y; c.moving = true; c.y += Math.sign(d)*Math.min(Math.abs(d), 900*dt); if(Math.abs(d) < 4 || canMove(c.x, c.y, c.x, c.y)){ if(canMove(c.x, c.y, c.x, c.y)){ c.v16fly = false; c.glide = false; toast('Hạ cánh an toàn!'); flyBtn(); SKY.layer = null; } else { c.x += 8; } } return; }
  const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0); c.moving = !!(dx || dy);
  if(c.moving){ const L = Math.hypot(dx, dy), sp = c.y < -2700 ? 720 : 480; c.x = Math.max(10, Math.min(W - 10, c.x + dx/L*sp*dt)); c.y = Math.max(Y0 + 60, Math.min(H - 30, c.y + dy/L*sp*dt)); if(dx) c.dir = dx < 0 ? -1 : 1; c.walk += dt*6; }
  const L = skyLayerAt(c.y); if(L !== SKY.layer){ SKY.layer = L; if(L){ toast(`Bạn đang ở: ${L.n} · độ cao ${L.alt}`); try { mprog('sky'); } catch(e){} } }
}
function v17Init(){ skyInit(); const b = $('#hFly'); if(b) b.onclick = flyToggle; flyBtn(); }

