// ================= EXT38 (v33): grand observatory campus (giant telescope, radio dish, solar tower, planetarium, refractor, stargazing deck),
// each building with its own telescope view; smoother movement; bikes carry an oil lamp =================
const OBS = {};
function obsPlan(r){ const X = r.x, Y = r.y; return {
  giant:{x:X + 360, y:Y + 200, n:'Đại kính thiên văn', mode:'planet'},
  radio:{x:X + 120, y:Y + 330, n:'Kính thiên văn vô tuyến', mode:'radio'},
  solar:{x:X + 620, y:Y + 150, n:'Tháp quan sát Mặt Trời', mode:'sun'},
  dome:{x:X + 590, y:Y + 360, n:'Cung thiên văn', mode:'sky'},
  refr:{x:X + 110, y:Y + 110, n:'Tháp kính khúc xạ cổ', mode:'moon'},
  deck:{x:X + 360, y:Y + 410, n:'Sân ngắm sao', mode:'deck'}}; }
function drawObservatory(r, dong){
  const X = r.x, Y = r.y, Wd = r.w, Hd = r.h, P = obsPlan(r); OBS.P = P;
  rect(dong ? '#e8eef0' : '#7cb342', X, Y, Wd, Hd); for(let k=0;k<70;k++) rect(dong ? '#dfe7ea' : '#6ea83c', X + (k*137) % Wd, Y + (k*71) % Hd, 4, 5);
  // stone paths connecting every building
  ctx.strokeStyle = dong ? '#f5f5f5' : '#e6dcc4'; ctx.lineWidth = 18; ctx.lineCap = 'round';
  [['giant', 'radio'], ['giant', 'solar'], ['giant', 'dome'], ['giant', 'refr'], ['giant', 'deck'], ['deck', 'dome'], ['deck', 'radio']].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y + 40); ctx.lineTo(P[b].x, P[b].y + 40); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(P.deck.x, P.deck.y + 40); ctx.lineTo(P.deck.x, Y + Hd); ctx.stroke(); ctx.lineCap = 'butt';
  // giant telescope: stone drum, white dome with an open slit (the tube is drawn live)
  const g = P.giant; ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(g.x + 10, g.y + 64, 140, 26, 0, 0, Math.PI*2); ctx.fill();
  rect('#cfc6b4', g.x - 120, g.y - 10, 240, 72); for(let k=0;k<6;k++) rect('#b8ae99', g.x - 120, g.y + k*12 - 8, 240, 1); for(let k=0;k<8;k++){ rect('#efe7d6', g.x - 112 + k*30, g.y + 8, 14, 26); circ(g.x - 105 + k*30, g.y + 8, 7, '#efe7d6'); rect('#1a237e', g.x - 109 + k*30, g.y + 12, 8, 20); }
  const dg = ctx.createLinearGradient(g.x - 120, 0, g.x + 120, 0); dg.addColorStop(0, '#cfd8dc'); dg.addColorStop(.45, '#ffffff'); dg.addColorStop(1, '#b0bec5');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(g.x, g.y - 10, 124, 112, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2; for(let a = -3; a <= 3; a++){ ctx.beginPath(); ctx.moveTo(g.x + a*36, g.y - 10); ctx.quadraticCurveTo(g.x + a*18, g.y - 110, g.x, g.y - 122); ctx.stroke(); }
  ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.moveTo(g.x - 18, g.y - 10); ctx.lineTo(g.x - 14, g.y - 118); ctx.lineTo(g.x + 14, g.y - 118); ctx.lineTo(g.x + 18, g.y - 10); ctx.closePath(); ctx.fill();
  rect('#d4a52c', g.x - 126, g.y - 14, 252, 6); rect('#5d4037', g.x - 14, g.y + 30, 28, 32); plate('ĐẠI KÍNH THIÊN VĂN', g.x, g.y + 66);
  // radio telescope: lattice pedestal (dish drawn live so it can turn)
  const rd = P.radio; rect('#90a4ae', rd.x - 40, rd.y + 30, 80, 16); ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rd.x - 30, rd.y + 30); ctx.lineTo(rd.x, rd.y - 30); ctx.lineTo(rd.x + 30, rd.y + 30); ctx.moveTo(rd.x - 15, rd.y); ctx.lineTo(rd.x + 15, rd.y); ctx.stroke(); plate('KÍNH VÔ TUYẾN', rd.x, rd.y + 52);
  // solar tower: tall tower, heliostat mirrors on the ground
  const so = P.solar; rect('#eceff1', so.x - 16, so.y - 120, 32, 170); for(let k=0;k<6;k++) rect('#cfd8dc', so.x - 16, so.y - 110 + k*26, 32, 3); rect('#ffb300', so.x - 22, so.y - 132, 44, 14); rect('#5d4037', so.x - 8, so.y + 26, 16, 24);
  for(let k=0;k<6;k++){ const mx = so.x - 70 + (k % 3)*70, my = so.y + 70 + Math.floor(k/3)*28; rect('#607d8b', mx - 2, my, 4, 10); rect('#81d4fa', mx - 12, my - 8, 24, 10); rect('#e1f5fe', mx - 10, my - 7, 8, 3); }
  plate('THÁP MẶT TRỜI', so.x, so.y + 120);
  // planetarium: low dome with a star pattern
  const dm = P.dome; ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(dm.x + 8, dm.y + 44, 100, 18, 0, 0, Math.PI*2); ctx.fill(); rect('#d7ccc8', dm.x - 92, dm.y, 184, 44);
  ctx.fillStyle = '#283593'; ctx.beginPath(); ctx.ellipse(dm.x, dm.y, 96, 66, 0, Math.PI, 0); ctx.fill(); for(let k=0;k<22;k++){ const a = Math.PI + (k*0.613) % Math.PI, rr = 18 + (k*29) % 60; circ(dm.x + Math.cos(a)*rr*1.4, dm.y + Math.sin(a)*rr*.9, k % 5 ? 1.5 : 2.5, '#fff59d'); }
  rect('#5d4037', dm.x - 16, dm.y + 10, 32, 34); plate('CUNG THIÊN VĂN', dm.x, dm.y + 56);
  // old refractor tower: brick tower with a brass refractor on top
  const rf = P.refr; rect('#a1887f', rf.x - 34, rf.y - 60, 68, 110); for(let k=0;k<9;k++) for(let j=0;j<4;j++) rect('#8d6e63', rf.x - 34 + ((k % 2)*8) + j*17, rf.y - 56 + k*12, 14, 1); ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.moveTo(rf.x - 40, rf.y - 60); ctx.lineTo(rf.x, rf.y - 92); ctx.lineTo(rf.x + 40, rf.y - 60); ctx.closePath(); ctx.fill();
  rect('#5d4037', rf.x - 10, rf.y + 18, 20, 32); plate('KÍNH KHÚC XẠ CỔ', rf.x, rf.y + 62);
  // stargazing deck: wooden platform with small telescopes on tripods
  const dk = P.deck; rect('#8d6e4a', dk.x - 110, dk.y - 6, 220, 46); for(let k=0;k<11;k++) rect('#6d4c2e', dk.x - 110 + k*20, dk.y - 6, 2, 46);
  for(let k=0;k<4;k++){ const tx = dk.x - 80 + k*54, ty = dk.y + 18; ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ty - 12); ctx.lineTo(tx - 8, ty + 6); ctx.moveTo(tx, ty - 12); ctx.lineTo(tx + 8, ty + 6); ctx.stroke(); ctx.save(); ctx.translate(tx, ty - 14); ctx.rotate(-.7 + k*.2); rect(['#eceff1','#ef5350','#42a5f5','#ffd23f'][k], -3, -16, 6, 20); ctx.restore(); }
  plate('SÂN NGẮM SAO', dk.x, dk.y + 44);
  // gardens: hedges and flowers kept from the botanic garden
  for(let k=0;k<12;k++){ const x = X + 30 + k*60, y = Y + Hd - 18; circ(x, y, 12, dong ? '#cfd8dc' : '#2e7d32'); if(!dong) circ(x + 4, y - 6, 3, ['#ff6f91','#ffd23f','#fff','#ba68c8'][k % 4]); }
  plate('ĐÀI THIÊN VĂN QUỐC GIA · VƯỜN BÁCH THẢO', X + Wd/2, Y + 6);
}
function v33Sprites(sp){
  const r = R.botanic, P = OBS.P; if(!P || VB.x1 < r.x - 60 || VB.x0 > r.x + r.w + 60 || VB.y1 < r.y - 160 || VB.y0 > r.y + r.h) return; const t = realT, night = SKYST ? SKYST.night : 0;
  sp.push({y:P.giant.y - 5, f:() => { const g = P.giant, a = -1.0 + Math.sin(t*.07)*.35; ctx.save(); ctx.translate(g.x, g.y - 30); ctx.rotate(a);
    rect('#eceff1', -8, -150, 30, 150); rect('#b0bec5', 14, -150, 8, 150); rect('#263238', -10, -158, 34, 10); rect('#d4a52c', -10, -60, 34, 6); rect('#d4a52c', -10, -110, 34, 4); ctx.restore(); circ(g.x, g.y - 30, 12, '#546e7a'); }});
  sp.push({y:P.radio.y + 20, f:() => { const rd = P.radio, a = Math.sin(t*.25)*.5; ctx.save(); ctx.translate(rd.x, rd.y - 34); ctx.rotate(a); ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.ellipse(0, 0, 58, 22, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-50, -4); ctx.lineTo(0, -46); ctx.lineTo(50, -4); ctx.stroke(); circ(0, -48, 4, '#ef5350'); ctx.restore(); }});
  sp.push({y:P.solar.y + 40, f:() => { const so = P.solar; if(night < .4){ const gl = .5 + .5*Math.sin(t*3); ctx.globalAlpha = .5 + gl*.4; circ(so.x, so.y - 126, 10 + gl*4, '#fff59d'); ctx.globalAlpha = 1; } if(Math.floor(t*1.5) % 2) circ(so.x, so.y - 134, 3, '#ff1744'); }});
  if(night > .3) sp.push({y:P.dome.y - 70, f:() => { const dm = P.dome; for(let k=0;k<10;k++){ ctx.globalAlpha = .3 + .7*Math.abs(Math.sin(t*2 + k)); circ(dm.x - 60 + k*14, dm.y - 80 - (k % 3)*10, 1.5, '#fff'); } ctx.globalAlpha = 1; }});
  sp.push({y:P.refr.y - 40, f:() => { const rf = P.refr; ctx.save(); ctx.translate(rf.x, rf.y - 92); ctx.rotate(-.6 + Math.sin(t*.1)*.15); rect('#d4a52c', -3, -36, 7, 40); rect('#8d6e1f', -4, -40, 9, 6); ctx.restore(); }});
}
// one window for every telescope, each with its own view
const OBV = {run:false, mode:'planet', t:0};
function openObs(mode, name){ if(mode === 'planet'){ openScope(); return; } OBV.mode = mode; showModal('mObs'); $('#mObsT').textContent = name; $('#obsInfo').textContent = {radio:'Kính vô tuyến nghe "tiếng nói" của vũ trụ: sóng radio từ sao xung, thiên hà và tàn dư Vụ Nổ Lớn.', sun:'Kính Mặt Trời có kính lọc đặc biệt: thấy vết đen, tai lửa và bề mặt sôi sục. Đừng bao giờ nhìn thẳng Mặt Trời bằng mắt thường!', sky:'Cung thiên văn chiếu bầu trời sao lên mái vòm: tìm chòm Bắc Đẩu, Thiên Hậu, Lạp Hộ.', moon:'Kính khúc xạ cổ cho thấy Mặt Trăng thật rõ: biển đá tối, miệng hố va chạm và dãy núi.', deck:'Sân ngắm sao: kính nhỏ cho mọi người, ngắm Sao Mộc và 4 vệ tinh lớn của nó.'}[mode] || '';
  if(!OBV.run){ OBV.run = true; requestAnimationFrame(obsLoop); } if(PROF){ PROF.obsSeen = PROF.obsSeen || {}; const d = new Date().toDateString(); if(PROF.obsSeen[mode] !== d){ PROF.obsSeen[mode] = d; reward(4, 3, 'Khám phá ' + name, true); saveProfile(); } } }
function obsLoop(){ const m = $('#mObs'); if(!m || m.hidden){ OBV.run = false; return; } OBV.t += 1/60; const cv = $('#obsCv'), g = cv.getContext('2d'), Wc = 900, Hc = 480, t = OBV.t; g.setTransform(cv.width/Wc, 0, 0, cv.height/Hc, 0, 0); g.fillStyle = '#03040c'; g.fillRect(0, 0, Wc, Hc);
  for(let i=0;i<160;i++){ g.fillStyle = `rgba(255,255,255,${.25 + .75*Math.abs(Math.sin(t + i))})`; g.fillRect((i*137) % Wc, (i*71) % Hc, 1.5, 1.5); }
  const M = OBV.mode;
  if(M === 'radio'){ g.strokeStyle = '#69f0ae'; g.lineWidth = 2; for(let row=0; row<4; row++){ g.beginPath(); for(let x=0;x<Wc;x+=4){ const y = 90 + row*100 + Math.sin(x*.03 + t*3 + row)*12*(1 + row*.4) + (Math.sin((x + t*120)*.15) > .97 ? -40 : 0); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    g.fillStyle = '#69f0ae'; g.font = '22px VT323, monospace'; ['Sao xung PSR B1919+21', 'Thiên hà Tiên Nữ', 'Bức xạ nền vũ trụ', 'Mặt Trời (radio)'].forEach((n, i) => g.fillText(n, 12, 60 + i*100)); }
  else if(M === 'sun'){ const gr = g.createRadialGradient(450, 240, 20, 450, 240, 200); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(.6, '#ffb300'); gr.addColorStop(1, '#e65100'); g.fillStyle = gr; g.beginPath(); g.arc(450, 240, 190, 0, Math.PI*2); g.fill();
    for(let k=0;k<5;k++){ g.fillStyle = 'rgba(60,20,0,.7)'; g.beginPath(); g.arc(380 + k*40 + Math.sin(t*.1 + k)*6, 200 + (k % 3)*40, 6 + (k % 2)*5, 0, Math.PI*2); g.fill(); }
    g.strokeStyle = 'rgba(255,87,34,.85)'; g.lineWidth = 6; for(let k=0;k<3;k++){ const a = k*2.1 + t*.05; g.beginPath(); g.arc(450 + Math.cos(a)*190, 240 + Math.sin(a)*190, 30 + 10*Math.sin(t*2 + k), a + Math.PI*.6, a + Math.PI*1.4); g.stroke(); } }
  else if(M === 'sky'){ g.save(); g.translate(450, 470); g.rotate(t*.04); [[[-160,-260],[-120,-250],[-90,-240],[-60,-245],[-40,-210],[-80,-200],[-60,-170]], [[60,-330],[90,-300],[120,-320],[150,-290],[180,-310]], [[-260,-120],[-230,-150],[-200,-110],[-240,-80],[-210,-60]]].forEach(c => { g.strokeStyle = 'rgba(144,202,249,.6)'; g.lineWidth = 1.5; g.beginPath(); c.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); c.forEach(([x, y]) => { g.fillStyle = '#fff59d'; g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI*2); g.fill(); }); }); g.restore();
    g.fillStyle = '#90caf9'; g.font = '22px VT323, monospace'; g.fillText('Bắc Đẩu · Thiên Hậu · Lạp Hộ (bầu trời quay chậm)', 12, 30); }
  else if(M === 'moon'){ const gr = g.createRadialGradient(400, 200, 30, 450, 240, 210); gr.addColorStop(0, '#fafafa'); gr.addColorStop(1, '#757575'); g.fillStyle = gr; g.beginPath(); g.arc(450, 240, 200, 0, Math.PI*2); g.fill();
    [[380, 180, 50], [520, 280, 40], [440, 330, 26], [540, 160, 22], [360, 290, 18]].forEach(([x, y, rr]) => { g.fillStyle = 'rgba(90,90,90,.55)'; g.beginPath(); g.arc(x, y, rr, 0, Math.PI*2); g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke(); }); }
  else { g.fillStyle = '#d9a066'; g.beginPath(); g.arc(450, 240, 60, 0, Math.PI*2); g.fill(); for(let k=-2;k<=2;k++){ g.fillStyle = 'rgba(120,70,30,.35)'; g.fillRect(392, 240 + k*18 - 4, 116, 8); }
    ['Io', 'Europa', 'Ganymede', 'Callisto'].forEach((n, k) => { const a = t*(.6/(k + 1)) + k, x = 450 + Math.cos(a)*(110 + k*60), y = 240 + Math.sin(a)*12; g.fillStyle = '#eceff1'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI*2); g.fill(); g.fillStyle = '#cfd8dc'; g.font = '18px VT323, monospace'; g.fillText(n, x - 14, y - 12); }); }
  requestAnimationFrame(obsLoop); }
function v33Doors(d){ const P = OBS.P; if(!P) return; Object.values(P).forEach(o => d.push({x:o.x, y:o.y + 48, n:o.n + ' · ngắm', f:() => openObs(o.mode, o.n)})); }
// bikes: an oil lamp on the handlebar (no headlight), only when it is dark
function v33Init(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mObs'; m.hidden = true; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML = '<div class="mbox wide"><div class="mhead"><h2 id="mObsT">Đài thiên văn</h2><button class="mclose" data-close aria-label="Đóng">×</button></div><canvas id="obsCv" class="v16cv" width="900" height="480" aria-label="Hình ảnh qua kính thiên văn"></canvas><p class="now" id="obsInfo"></p></div>';
  document.body.appendChild(m); m.querySelector('[data-close]').onclick = () => hideModal();
}
