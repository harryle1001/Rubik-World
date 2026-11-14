// ================= EXT24 (v19): the Royal Library — a European aristocratic palace (Baroque) with French parterre, plus an illustrated reading hall =================
const LIBX = {wins:[], lamps:[], flags:[], seats:[]};
function libCol(x, y, h, cap){ // Corinthian column with gilded capital
  const g = ctx.createLinearGradient(x - 7, 0, x + 7, 0); g.addColorStop(0, '#d9d2c3'); g.addColorStop(.45, '#fffdf6'); g.addColorStop(1, '#bfb6a3'); ctx.fillStyle = g; ctx.fillRect(x - 6, y, 12, h);
  for(let k=-4;k<=4;k+=4) rect('rgba(150,140,120,.35)', x + k, y + 4, 1, h - 8);
  rect(cap || '#d4a52c', x - 9, y - 6, 18, 6); rect('#f2d06b', x - 8, y - 6, 16, 2); circ(x - 7, y - 3, 2.4, '#b8860b'); circ(x + 7, y - 3, 2.4, '#b8860b'); rect('#e8e0cf', x - 9, y + h, 18, 5); rect('#cfc6b4', x - 10, y + h + 5, 20, 3);
}
function libArchWin(x, y, w, h, glass){ // arched stained-glass window with keystone and molding
  rect('#f7efdd', x - 4, y - 2, w + 8, h + 6); ctx.fillStyle = '#f7efdd'; ctx.beginPath(); ctx.arc(x + w/2, y, w/2 + 4, Math.PI, 0); ctx.fill();
  const g = ctx.createLinearGradient(0, y - w/2, 0, y + h); g.addColorStop(0, glass[0]); g.addColorStop(.5, glass[1]); g.addColorStop(1, glass[2]); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.beginPath(); ctx.arc(x + w/2, y, w/2, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#3e2f1c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w/2, y - w/2); ctx.lineTo(x + w/2, y + h); for(let k=1;k<4;k++){ ctx.moveTo(x, y + k*h/4); ctx.lineTo(x + w, y + k*h/4); } ctx.stroke();
  ctx.beginPath(); ctx.arc(x + w/2, y, w/4, Math.PI, 0); ctx.stroke(); rect('#e3c46a', x + w/2 - 3, y - w/2 - 6, 6, 7); rect('#cdbf9f', x - 6, y + h + 2, w + 12, 4);
  LIBX.wins.push([x + w/2, y + h/2, w, h]);
}
function libStatue(x, y, s){ s = s || 1; rect('#cfc6b4', x - 9*s, y - 2, 18*s, 10); rect('#e8e0cf', x - 7*s, y - 6, 14*s, 5); rect('#f4f1ea', x - 4*s, y - 24*s, 8*s, 18*s); circ(x, y - 28*s, 4*s, '#f4f1ea'); rect('#f4f1ea', x + 3*s, y - 22*s, 7*s, 2*s); rect('#e0dbd0', x - 4*s, y - 12*s, 8*s, 2*s); }
function libUrn(x, y){ rect('#e8e0cf', x - 4, y - 4, 8, 4); ctx.fillStyle = '#efe7d6'; ctx.beginPath(); ctx.ellipse(x, y - 9, 6, 6, 0, 0, Math.PI*2); ctx.fill(); rect('#d4a52c', x - 5, y - 14, 10, 2); circ(x - 3, y - 17, 3, '#2e7d32'); circ(x + 3, y - 17, 3, '#388e3c'); circ(x, y - 19, 3, '#e91e63'); }
function libCypress(x, y, h){ ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 2, 9, 3, 0, 0, Math.PI*2); ctx.fill(); rect('#5d4037', x - 1, y - 6, 3, 8); ctx.fillStyle = '#1b5e20'; ctx.beginPath(); ctx.ellipse(x, y - h/2 - 4, 8, h/2, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.ellipse(x - 2, y - h/2 - 6, 4, h/2 - 6, 0, 0, Math.PI*2); ctx.fill(); }
function libTopiary(x, y){ rect('#8d6e63', x - 5, y - 3, 10, 5); ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.arc(x, y - 10, 7, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 21, 5, 0, Math.PI*2); ctx.fill(); circ(x - 2, y - 12, 2, '#43a047'); }
function libLion(x, y, f){ rect('#cfc6b4', x - 16, y - 2, 32, 10); rect('#e8e0cf', x - 14, y - 6, 28, 5); ctx.fillStyle = '#d4a52c'; ctx.beginPath(); ctx.ellipse(x, y - 14, 12, 7, 0, 0, Math.PI*2); ctx.fill(); circ(x + 9*f, y - 22, 7, '#c99a22'); circ(x + 10*f, y - 22, 4.5, '#e2b53a'); rect('#3e2f1c', x + 12*f, y - 24, 1.5, 1.5); rect('#d4a52c', x - 13*f - 1, y - 18, 3, 6); }
function libTowers(){ (LIBX.towers || []).forEach(([tx, ty, tw, dong]) => {
    ctx.fillStyle = dong ? '#e0e0e0' : '#00897b'; ctx.beginPath(); ctx.ellipse(tx, ty + 22, tw/2 + 2, 30, 0, Math.PI, 0); ctx.fill(); for(let a = -2; a <= 2; a++){ ctx.strokeStyle = '#d4a52c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx + a*12, ty + 22); ctx.quadraticCurveTo(tx + a*6, ty, tx, ty - 8); ctx.stroke(); }
    rect('#d4a52c', tx - 2, ty - 26, 4, 18); circ(tx, ty - 28, 4, '#ffd54f'); }); }
function libDomes(){ if(!LIBX.dome) return; const {cx, domeY, dong} = LIBX.dome;
  const dg = ctx.createRadialGradient(cx - 30, domeY - 40, 10, cx, domeY + 10, 120); dg.addColorStop(0, dong ? '#ffffff' : '#80cbc4'); dg.addColorStop(.6, dong ? '#e0e0e0' : '#00897b'); dg.addColorStop(1, dong ? '#bdbdbd' : '#00574b');
  rect('#efe3c8', cx - 92, domeY + 6, 184, 40); for(let k=0;k<8;k++){ libCol(cx - 80 + k*23, domeY + 12, 30, '#d4a52c'); } // drum with colonnade
  ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(cx, domeY + 8, 100, 74, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#e2b53a'; ctx.lineWidth = 2; for(let a = -4; a <= 4; a++){ ctx.beginPath(); ctx.moveTo(cx + a*22, domeY + 8); ctx.quadraticCurveTo(cx + a*13, domeY - 50, cx, domeY - 64); ctx.stroke(); }
  for(let a = -3; a <= 3; a++){ if(!a) continue; circ(cx + a*26, domeY - 6 + Math.abs(a)*3, 4, '#fff8e1'); circ(cx + a*26, domeY - 6 + Math.abs(a)*3, 2.5, '#5c6bc0'); }
  rect('#efe3c8', cx - 16, domeY - 82, 32, 20); for(let k=0;k<4;k++) rect('#d8c7a1', cx - 13 + k*8, domeY - 80, 3, 16); ctx.fillStyle = '#e2b53a'; ctx.beginPath(); ctx.ellipse(cx, domeY - 82, 18, 10, 0, Math.PI, 0); ctx.fill(); rect('#e2b53a', cx - 1.5, domeY - 110, 3, 22); circ(cx, domeY - 112, 5, '#ffd54f'); rect('#e2b53a', cx - 6, domeY - 102, 12, 2);
}
function drawGrandLibrary(r, dong){
  LIBX.wins = []; LIBX.lamps = []; LIBX.flags = []; LIBX.seats = []; LIBX.towers = [];
  const X = r.x, Y = r.y, Wd = r.w, Hd = r.h, cx = X + Wd/2;
  // grounds: striped royal lawn
  for(let y = Y - 20; y < Y + Hd + 20; y += 16) rect(dong ? ((y/16) % 2 ? '#e7eef0' : '#dfe8ea') : ((y/16) % 2 ? '#7fb35a' : '#76aa52'), X - 20, y, Wd + 40, 16);
  // ---- palace roof: mansard slate with copper trim, dormers, chimneys ----
  const bx0 = X + 40, bx1 = X + Wd - 40, roofY = Y + 18, facY = Y + 64, facB = Y + 238;
  ctx.fillStyle = dong ? '#cfd8dc' : '#4a5d73'; ctx.beginPath(); ctx.moveTo(bx0 - 6, facY); ctx.lineTo(bx0 + 22, roofY); ctx.lineTo(bx1 - 22, roofY); ctx.lineTo(bx1 + 6, facY); ctx.closePath(); ctx.fill();
  for(let x = bx0 + 24; x < bx1 - 24; x += 10) rect(dong ? '#b0bec5' : '#3d4f63', x, roofY + 2, 1, facY - roofY - 2);
  rect('#4db6ac', bx0 + 22, roofY - 3, bx1 - bx0 - 44, 4); rect(dong ? '#fafafa' : '#26a69a', bx0 - 6, facY - 4, bx1 - bx0 + 12, 4);
  for(let x = bx0 + 70; x < bx1 - 60; x += 92){ if(Math.abs(x - cx) < 150) continue; rect('#efe3c8', x - 10, roofY + 14, 20, 26); ctx.fillStyle = '#efe3c8'; ctx.beginPath(); ctx.arc(x, roofY + 14, 10, Math.PI, 0); ctx.fill(); rect('#1a237e', x - 6, roofY + 14, 12, 22); ctx.fillStyle = '#1a237e'; ctx.beginPath(); ctx.arc(x, roofY + 14, 6, Math.PI, 0); ctx.fill(); rect('#d4a52c', x - 1, roofY - 2, 2, 6); }
  [[bx0 + 150, 0], [bx1 - 150, 0]].forEach(([x]) => { rect('#8d6e63', x - 6, roofY - 14, 12, 20); rect('#6d4c41', x - 8, roofY - 16, 16, 4); });
  // ---- façade: limestone with rusticated ground floor ----
  const lime = ctx.createLinearGradient(0, facY, 0, facB); lime.addColorStop(0, '#f6ecd6'); lime.addColorStop(1, '#e6d6b4'); ctx.fillStyle = lime; ctx.fillRect(bx0, facY, bx1 - bx0, facB - facY);
  for(let y = facB - 52; y < facB; y += 9){ rect('rgba(150,125,85,.35)', bx0, y, bx1 - bx0, 1); for(let x = bx0 + ((y/9) % 2)*14; x < bx1; x += 28) rect('rgba(150,125,85,.3)', x, y, 1, 9); }
  rect('#d8c7a1', bx0, facB - 56, bx1 - bx0, 4); // string course
  // cornice with dentils + balustrade
  rect('#efe3c8', bx0 - 8, facY - 2, bx1 - bx0 + 16, 8); for(let x = bx0 - 6; x < bx1 + 6; x += 6) rect('#d8c7a1', x, facY + 6, 3, 3);
  for(let x = bx0; x < bx1; x += 8){ rect('#f4ecdb', x + 2, facY - 14, 4, 12); } rect('#efe3c8', bx0 - 4, facY - 16, bx1 - bx0 + 8, 3);
  for(let x = bx0 + 20; x < bx1 - 10; x += 120){ if(Math.abs(x - cx) < 140) continue; libStatue(x, facY - 16, .8); }
  for(let x = bx0 + 80; x < bx1 - 40; x += 120){ if(Math.abs(x - cx) < 140) continue; libUrn(x, facY - 16); }
  // wings: two floors of arched stained windows between pilasters
  const glass = [['#283593','#3949ab','#5c6bc0'], ['#b71c1c','#e53935','#ffb300'], ['#1b5e20','#43a047','#ffd54f'], ['#4a148c','#7b1fa2','#ce93d8']];
  for(let x = bx0 + 26, i = 0; x < bx1 - 40; x += 58, i++){ if(Math.abs(x + 15 - cx) < 150) continue; libArchWin(x, facY + 34, 30, 46, glass[i % 4]); libArchWin(x, facB - 44, 30, 30, glass[(i + 2) % 4]);
    rect('#ead9b6', x - 12, facY + 12, 6, facB - facY - 60); rect('#d4a52c', x - 13, facY + 12, 8, 3); }
  // corner towers with domes + clock
  [bx0 - 10, bx1 + 10].forEach((tx, k) => { const tw = 64, ty = Y - 6; const tg = ctx.createLinearGradient(tx - tw/2, 0, tx + tw/2, 0); tg.addColorStop(0, '#e6d6b4'); tg.addColorStop(.5, '#fbf3e1'); tg.addColorStop(1, '#d9c69d'); ctx.fillStyle = tg; ctx.fillRect(tx - tw/2, ty + 20, tw, facB - ty - 20);
    LIBX.towers = (LIBX.towers || []).concat([[tx, ty, tw, dong]]); LIBX.flags.push([tx, ty - 26, k]);
    rect('#efe3c8', tx - tw/2 - 3, ty + 20, tw + 6, 5); libArchWin(tx - 11, facY + 60, 22, 40, glass[(k + 1) % 4]); libArchWin(tx - 11, facB - 44, 22, 30, glass[k*2 % 4]);
    if(k === 0){ circ(tx, facY + 26, 17, '#d4a52c'); circ(tx, facY + 26, 14, '#fffdf2'); ctx.strokeStyle = '#3e2f1c'; ctx.lineWidth = 1; for(let h = 0; h < 12; h++){ const a = h/12*Math.PI*2; ctx.beginPath(); ctx.moveTo(tx + Math.cos(a)*11, facY + 26 + Math.sin(a)*11); ctx.lineTo(tx + Math.cos(a)*13, facY + 26 + Math.sin(a)*13); ctx.stroke(); } LIBX.clock = [tx, facY + 26]; }
    else { circ(tx, facY + 26, 16, '#d4a52c'); ctx.font = '14px Bungee, sans-serif'; ctx.fillStyle = '#3e2f1c'; ctx.textAlign = 'center'; ctx.fillText('M', tx, facY + 31); ctx.textAlign = 'left'; } });
  libTowers();
  // ---- central pavilion: dome, drum, pediment, Corinthian portico, rose window, grand doors ----
  const pw = 250, px0 = cx - pw/2, domeY = Y + 6;
  LIBX.dome = {cx, domeY, dong}; libDomes();
  ctx.fillStyle = lime; ctx.fillRect(px0, facY - 4, pw, facB - facY + 4); rect('#efe3c8', px0 - 8, facY - 8, pw + 16, 8);
  ctx.fillStyle = '#f7efdd'; ctx.beginPath(); ctx.moveTo(px0 - 10, facY + 34); ctx.lineTo(cx, facY - 22); ctx.lineTo(px0 + pw + 10, facY + 34); ctx.closePath(); ctx.fill(); // pediment
  ctx.strokeStyle = '#d8c7a1'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#e9dcbc'; ctx.beginPath(); ctx.moveTo(px0 + 14, facY + 28); ctx.lineTo(cx, facY - 10); ctx.lineTo(px0 + pw - 14, facY + 28); ctx.closePath(); ctx.fill();
  rect('#d4a52c', cx - 18, facY + 6, 36, 14); rect('#fff8e1', cx - 16, facY + 8, 15, 10); rect('#fff8e1', cx + 1, facY + 8, 15, 10); rect('#3e2f1c', cx - 1, facY + 6, 2, 14); // open book relief
  ctx.strokeStyle = '#7cb342'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, facY + 13, 26, Math.PI*.15, Math.PI*.85); ctx.stroke(); for(let k=0;k<6;k++){ const a = Math.PI*(.2 + k*.12); circ(cx + Math.cos(a)*26, facY + 13 + Math.sin(a)*26, 2.5, '#9ccc65'); }
  libStatue(px0 - 4, facY - 4, .9); libStatue(px0 + pw + 4, facY - 4, .9); libStatue(cx, facY - 24, 1);
  rect('#2a1c10', cx - 104, facY + 36, 208, 14); ctx.font = '12px VT323, monospace'; ctx.fillStyle = '#ffd54f'; ctx.textAlign = 'center'; ctx.fillText('BIBLIOTHECA REGIA · THƯ VIỆN HOÀNG GIA', cx, facY + 47); ctx.textAlign = 'left';
  circ(cx, facY + 82, 27, '#d4a52c'); const rg = ctx.createRadialGradient(cx, facY + 82, 2, cx, facY + 82, 24); rg.addColorStop(0, '#fff59d'); rg.addColorStop(.35, '#e53935'); rg.addColorStop(.7, '#3949ab'); rg.addColorStop(1, '#1a237e'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, facY + 82, 24, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#d4a52c'; ctx.lineWidth = 1.2; for(let k=0;k<12;k++){ const a = k/12*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx, facY + 82); ctx.lineTo(cx + Math.cos(a)*24, facY + 82 + Math.sin(a)*24); ctx.stroke(); } LIBX.wins.push([cx, facY + 82, 48, 48]);
  for(let k=0;k<6;k++){ const x = px0 + 20 + k*42; libCol(x, facY + 56, facB - facY - 60); }
  rect('#3e2723', cx - 26, facB - 66, 52, 66); ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(cx, facB - 66, 26, Math.PI, 0); ctx.fill(); rect('#5d4037', cx - 22, facB - 62, 21, 60); rect('#5d4037', cx + 1, facB - 62, 21, 60);
  for(let k=0;k<3;k++){ rect('#d4a52c', cx - 20, facB - 52 + k*18, 17, 2); rect('#d4a52c', cx + 3, facB - 52 + k*18, 17, 2); } circ(cx - 4, facB - 30, 2, '#ffd54f'); circ(cx + 4, facB - 30, 2, '#ffd54f'); LIBX.wins.push([cx, facB - 34, 52, 66]);
  // ---- grand marble staircase with balustrades and golden lions ----
  for(let k=0;k<7;k++){ const w = 170 + k*16; rect(k % 2 ? '#f4f1ea' : '#e6e0d3', cx - w/2, facB + k*7, w, 7); rect('rgba(120,110,90,.25)', cx - w/2, facB + k*7 + 6, w, 1); }
  [-1, 1].forEach(s => { for(let k=0;k<7;k++) rect('#efe7d6', cx + s*(85 + k*8) - 3, facB + k*7 - 6, 6, 8); libLion(cx + s*150, facB + 50, -s); });
  // ---- French parterre garden ----
  const gY = facB + 60, gB = Y + Hd - 44, fy = (gY + gB)/2 + 6;
  rect(dong ? '#f5f5f5' : '#e8dcc0', cx - 26, gY - 6, 52, gB - gY + 50); rect(dong ? '#f5f5f5' : '#e8dcc0', X + 30, fy - 16, Wd - 60, 32);
  for(let x = X + 30; x < X + Wd - 30; x += 18) rect('rgba(160,140,100,.25)', x, fy - 16, 1, 32);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { const qx = cx + sx*(Wd/4 + 2), qy = sy < 0 ? (gY + fy - 16)/2 : (fy + 16 + gB)/2, qw = Wd/2 - 120, qh = sy < 0 ? fy - 16 - gY - 10 : gB - fy - 26;
    rect(dong ? '#eceff1' : '#558b2f', qx - qw/2, qy - qh/2, qw, qh); rect(dong ? '#e0e0e0' : '#e8dcc0', qx - qw/2 + 6, qy - qh/2 + 6, qw - 12, qh - 12);
    ctx.strokeStyle = dong ? '#cfd8dc' : '#33691e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(qx, qy, qw/2 - 18, qh/2 - 14, 0, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qx - qw/2 + 12, qy); ctx.quadraticCurveTo(qx, qy - qh/2 + 12, qx + qw/2 - 12, qy); ctx.quadraticCurveTo(qx, qy + qh/2 - 12, qx - qw/2 + 12, qy); ctx.stroke();
    if(!dong) for(let k=0;k<26;k++){ const a = k/26*Math.PI*2; circ(qx + Math.cos(a)*(qw/2 - 30), qy + Math.sin(a)*(qh/2 - 24), 2.4, ['#e91e63','#f06292','#ffeb3b','#ab47bc'][k % 4]); }
    libTopiary(qx - qw/2 + 4, qy - qh/2 + 6); libTopiary(qx + qw/2 - 4, qy - qh/2 + 6); libTopiary(qx - qw/2 + 4, qy + qh/2); libTopiary(qx + qw/2 - 4, qy + qh/2); circ(qx, qy, 6, '#cfc6b4'); });
  // central fountain basin (water drawn live in sprites)
  ctx.fillStyle = '#e6e0d3'; ctx.beginPath(); ctx.ellipse(cx, fy, 74, 38, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = dong ? '#cfe3ec' : '#4fc3f7'; ctx.beginPath(); ctx.ellipse(cx, fy, 64, 31, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#efe7d6'; ctx.beginPath(); ctx.ellipse(cx, fy - 8, 30, 14, 0, 0, Math.PI*2); ctx.fill(); rect('#e6e0d3', cx - 5, fy - 26, 10, 20); ctx.fillStyle = '#f4f1ea'; ctx.beginPath(); ctx.ellipse(cx, fy - 26, 14, 6, 0, 0, Math.PI*2); ctx.fill(); LIBX.fountain = [cx, fy];
  // reading pavilions (rotundas) left & right
  [[X + 120, 'TRUYỆN TRANH'], [X + Wd - 120, 'ĐỌC NGOÀI TRỜI']].forEach(([gx, label], k) => { const gy = fy + 6; ctx.fillStyle = '#e6e0d3'; ctx.beginPath(); ctx.ellipse(gx, gy, 62, 30, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#f4f1ea'; ctx.beginPath(); ctx.ellipse(gx, gy, 56, 26, 0, 0, Math.PI*2); ctx.fill();
    for(let a = 0; a < 8; a++){ const ang = a/8*Math.PI*2, x = gx + Math.cos(ang)*48, y = gy + Math.sin(ang)*22; if(Math.sin(ang) > -.2) libCol(x, y - 52, 52); }
    ctx.fillStyle = dong ? '#eeeeee' : '#00897b'; ctx.beginPath(); ctx.ellipse(gx, gy - 56, 56, 30, 0, Math.PI, 0); ctx.fill(); rect('#efe3c8', gx - 58, gy - 58, 116, 6); rect('#e2b53a', gx - 1, gy - 98, 2, 14); circ(gx, gy - 99, 3, '#ffd54f');
    for(let a = 0; a < 8; a++){ const ang = a/8*Math.PI*2; if(Math.sin(ang) <= -.2) continue; } plate(label, gx, gy + 32);
    for(let b=0;b<3;b++){ rect('#6d4c2e', gx - 30 + b*22, gy - 6, 16, 6); rect(['#ef4b4b','#3d7bff','#ffd23f'][b], gx - 28 + b*22, gy - 12, 12, 6); }
    LIBX.seats.push([gx - 30, gy + 4, 1], [gx + 30, gy + 4, -1]); });
  // statues along the promenade, benches, lamp posts, cypress alleys
  [[cx - 70, gY + 16], [cx + 70, gY + 16], [cx - 70, gB - 10], [cx + 70, gB - 10]].forEach(([x, y]) => libStatue(x, y, .9));
  for(let k=0;k<5;k++){ const y = gY + 4 + k*((gB - gY)/4); LIBX.lamps.push([cx - 36, y], [cx + 36, y]); }
  [[X + 300, fy + 20], [X + Wd - 300, fy + 20], [X + 300, fy - 26], [X + Wd - 300, fy - 26]].forEach(([x, y], k) => { rect('#5d4037', x - 18, y, 36, 5); rect('#3e2723', x - 18, y - 8, 36, 3); rect('#3e2723', x - 16, y + 5, 3, 5); rect('#3e2723', x + 13, y + 5, 3, 5); LIBX.seats.push([x - 8, y + 2, 1]); });
  for(let y = Y + 260; y < Y + Hd - 40; y += 46){ libCypress(X + 14, y, 46); libCypress(X + Wd - 14, y, 46); }
  // wrought-iron fence + gilded gate
  const fY = Y + Hd - 12; for(let x = X; x <= X + Wd; x += 8){ if(Math.abs(x - cx) < 56) continue; rect('#212121', x, fY - 22, 2, 24); tri(x - 2, fY - 22, x + 4, fY - 22, x + 1, fY - 28, '#d4a52c'); }
  rect('#212121', X, fY - 14, Wd/2 - 56, 2); rect('#212121', cx + 56, fY - 14, Wd/2 - 56, 2); rect('#212121', X, fY - 2, Wd, 3);
  [cx - 60, cx + 60].forEach(x => { rect('#efe3c8', x - 10, fY - 54, 20, 56); rect('#d8c7a1', x - 12, fY - 58, 24, 5); libUrn(x, fY - 58); });
  ctx.strokeStyle = '#212121'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, fY - 30, 50, Math.PI, 0); ctx.stroke(); for(let k=-4;k<=4;k++){ ctx.beginPath(); ctx.moveTo(cx + k*11, fY); ctx.lineTo(cx + k*11, fY - 30 - Math.sqrt(Math.max(0, 2500 - (k*11)**2))*.95); ctx.stroke(); }
  circ(cx, fY - 70, 12, '#d4a52c'); circ(cx, fY - 70, 8, '#1a237e'); rect('#ffd54f', cx - 4, fY - 73, 8, 6);
  plate('THƯ VIỆN TRI THỨC · BẤM E Ở CỔNG ĐỂ ĐỌC SÁCH', cx, fY + 4);
}
// ---------- living details: fountain jets, flags, glowing windows & lamps at night, pigeons, readers ----------
function librarySprites(sp){
  const r = R.library; if(!r || VB.x1 < r.x - 40 || VB.x0 > r.x + r.w + 40 || VB.y1 < r.y - 140 || VB.y0 > r.y + r.h + 20) return;
  const t = realT, night = SKYST ? SKYST.night : 0;
  sp.push({y:r.y - 200, f:() => {
    libTowers(); libDomes();
    LIBX.flags.forEach(([x, y, k]) => { ctx.fillStyle = k ? '#c62828' : '#1a237e'; ctx.beginPath(); ctx.moveTo(x + 2, y); for(let i=0;i<=6;i++) ctx.lineTo(x + 2 + i*5, y + Math.sin(t*5 + i*.8)*2.5); for(let i=6;i>=0;i--) ctx.lineTo(x + 2 + i*5, y + 12 + Math.sin(t*5 + i*.8)*2.5); ctx.fill(); rect('#ffd54f', x + 10, y + 4 + Math.sin(t*5 + 1.6)*2.5, 6, 4); });
    if(LIBX.clock){ const [x, y] = LIBX.clock, m = (clock % 60)/60*Math.PI*2 - Math.PI/2, h = ((clock/60) % 12)/12*Math.PI*2 - Math.PI/2; ctx.strokeStyle = '#3e2f1c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(h)*7, y + Math.sin(h)*7); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(m)*11, y + Math.sin(m)*11); ctx.stroke(); }
    if(night > .25) LIBX.wins.forEach(([x, y, w, h]) => { ctx.globalAlpha = night*(.35 + .1*Math.sin(t*2 + x)); ctx.fillStyle = '#ffcc80'; ctx.beginPath(); ctx.ellipse(x, y, w*.9, h*.75, 0, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; });
  }});
  if(LIBX.fountain){ const [fx, fy] = LIBX.fountain; sp.push({y:fy + 30, f:() => { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; for(let k=0;k<3;k++){ const rr = ((t*18 + k*20) % 60); ctx.beginPath(); ctx.ellipse(fx, fy, rr + 6, (rr + 6)*.48, 0, 0, Math.PI*2); ctx.stroke(); }
    for(let k=0;k<14;k++){ const a = k/14*Math.PI*2, ph = (t*1.6 + k*.13) % 1, x = fx + Math.cos(a)*ph*44, y = fy - 30 - Math.sin(ph*Math.PI)*34 + Math.sin(a)*ph*16; ctx.fillStyle = `rgba(225,245,254,${.9 - ph*.5})`; ctx.fillRect(x - 1, y - 1, 3, 3); }
    ctx.fillStyle = 'rgba(225,245,254,.85)'; ctx.fillRect(fx - 1.5, fy - 66 - Math.sin(t*6)*3, 3, 40); }}); }
  LIBX.lamps.forEach(([x, y]) => { if(!inVB(x, y)) return; sp.push({y, f:() => { rect('#212121', x - 1.5, y - 34, 3, 34); rect('#212121', x - 5, y - 2, 10, 3); rect('#212121', x - 6, y - 44, 12, 3); rect('#212121', x - 5, y - 41, 10, 9); ctx.fillStyle = night > .25 ? '#ffe082' : '#fff8e1'; ctx.fillRect(x - 3.5, y - 40, 7, 7); rect('#d4a52c', x - 2, y - 48, 4, 4);
    if(night > .25){ ctx.globalAlpha = .25*night + .05*Math.sin(t*7 + x); ctx.fillStyle = '#ffcc80'; ctx.beginPath(); ctx.arc(x, y - 36, 22, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; } }}); });
  const day = isDay() && !isStorm();
  if(day) LIBX.seats.forEach(([x, y, d], i) => { if(!inVB(x, y)) return; const f = fakeAt(70 + i, x, y, d, {icon:'paper'}); sp.push({y, f:() => { bodyAt(f); rect(['#ef4b4b','#3d7bff','#2fbf71','#ffd23f'][i % 4], x + d*4 - 4, y - 16, 8, 6); rect('#fff8e1', x + d*4 - 3, y - 15, 6, 4); }}); });
  if(day){ const P = [[r.x + r.w/2 - 40, r.y + r.h - 70], [r.x + r.w/2 + 30, r.y + r.h - 64], [r.x + r.w/2 - 10, r.y + r.h - 90]]; P.forEach(([x0, y0], i) => { const ph = t*1.2 + i*2, x = x0 + Math.sin(ph*.5)*20, y = y0 + Math.cos(ph*.4)*8, peck = Math.max(0, Math.sin(ph*3))*2; sp.push({y, f:() => { ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.ellipse(x, y - 4, 5, 3.5, 0, 0, Math.PI*2); ctx.fill(); circ(x + 4, y - 7 + peck, 2.4, '#607d8b'); rect('#ffb74d', x + 6, y - 7 + peck, 2, 1); rect('#ec407a', x + 2, y - 5, 2, 1); }}); }); }
}
// ---------- the grand reading hall (shown at the top of the library window) ----------
const LH = {run:false, t:0};
function drawLibraryHall(){
  const cv = $('#libHall'); if(!cv) return; const g = cv.getContext('2d'), Wc = 1100, Hc = 300; g.setTransform(cv.width/Wc, 0, 0, cv.height/Hc, 0, 0); const t = LH.t, vx = Wc/2, vy = 132;
  const wall = g.createLinearGradient(0, 0, 0, Hc); wall.addColorStop(0, '#2b1a10'); wall.addColorStop(1, '#4e342e'); g.fillStyle = wall; g.fillRect(0, 0, Wc, Hc);
  // painted barrel-vault ceiling with gilded coffers and a sky fresco
  g.fillStyle = '#3e2723'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Wc, 0); g.lineTo(vx + 120, vy - 40); g.lineTo(vx - 120, vy - 40); g.fill();
  const sky = g.createLinearGradient(0, 0, 0, 90); sky.addColorStop(0, '#5c8fd6'); sky.addColorStop(1, '#bcd8f5'); g.fillStyle = sky; g.beginPath(); g.moveTo(220, 0); g.lineTo(880, 0); g.lineTo(vx + 80, vy - 52); g.lineTo(vx - 80, vy - 52); g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)'; [[380, 22, 26], [420, 18, 20], [640, 30, 24], [680, 26, 18], [520, 54, 14]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  g.fillStyle = '#ffe0b2'; g.beginPath(); g.arc(560, 40, 8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(548, 42); g.lineTo(536, 34); g.lineTo(552, 38); g.fill(); g.beginPath(); g.moveTo(572, 42); g.lineTo(584, 34); g.lineTo(568, 38); g.fill();
  g.strokeStyle = '#d4a52c'; g.lineWidth = 4; g.beginPath(); g.moveTo(220, 0); g.lineTo(vx - 80, vy - 52); g.lineTo(vx + 80, vy - 52); g.lineTo(880, 0); g.stroke();
  for(let k=0;k<7;k++){ const u = k/7; g.lineWidth = 2; g.beginPath(); g.moveTo(u*220, 0); g.lineTo(vx - 120 + u*40, vy - 40); g.moveTo(Wc - u*220, 0); g.lineTo(vx + 120 - u*40, vy - 40); g.stroke(); }
  // end wall: tall stained-glass window, light rays
  g.fillStyle = '#4e342e'; g.fillRect(vx - 120, vy - 40, 240, 120); const sw = g.createLinearGradient(0, vy - 36, 0, vy + 70); sw.addColorStop(0, '#fff59d'); sw.addColorStop(.3, '#4fc3f7'); sw.addColorStop(.6, '#7e57c2'); sw.addColorStop(1, '#e53935'); g.fillStyle = sw; g.fillRect(vx - 26, vy - 18, 52, 86); g.beginPath(); g.arc(vx, vy - 18, 26, Math.PI, 0); g.fill();
  g.strokeStyle = '#d4a52c'; g.lineWidth = 2; g.strokeRect(vx - 26, vy - 18, 52, 86); g.beginPath(); g.moveTo(vx, vy - 44); g.lineTo(vx, vy + 68); g.moveTo(vx - 26, vy + 20); g.lineTo(vx + 26, vy + 20); g.stroke();
  g.fillStyle = `rgba(255,236,179,${.12 + .04*Math.sin(t)})`; g.beginPath(); g.moveTo(vx - 26, vy - 18); g.lineTo(vx + 26, vy - 18); g.lineTo(vx + 260, Hc); g.lineTo(vx - 160, Hc); g.fill();
  // two-storey galleries of bookshelves on both sides, in perspective
  const side = s => { for(let tier=0; tier<2; tier++){ const y0 = tier ? 128 : 26, y1 = tier ? 262 : 118, iy0 = tier ? vy + 6 : vy - 36, iy1 = tier ? vy + 70 : vy + 2;
      const ox = s < 0 ? 0 : Wc, ix = vx + s*120; for(let k=0;k<10;k++){ const u0 = k/10, u1 = (k + 1)/10, xa = ox + (ix - ox)*u0, xb = ox + (ix - ox)*u1, ya0 = y0 + (iy0 - y0)*u0, ya1 = y1 + (iy1 - y1)*u0, yb0 = y0 + (iy0 - y0)*u1, yb1 = y1 + (iy1 - y1)*u1;
        g.fillStyle = '#5d4037'; g.beginPath(); g.moveTo(xa, ya0); g.lineTo(xb, yb0); g.lineTo(xb, yb1); g.lineTo(xa, ya1); g.fill();
        const rows = 5; for(let r=0;r<rows;r++){ const f0 = (r + .1)/rows, f1 = (r + .9)/rows; for(let b=0;b<6;b++){ const v0 = b/6, v1 = (b + .8)/6, x0 = xa + (xb - xa)*v0, x1 = xa + (xb - xa)*v1, top0 = ya0 + (ya1 - ya0)*f0 + (yb0 - ya0)*v0, bot0 = ya0 + (ya1 - ya0)*f1 + (yb0 - ya0)*v0;
          g.fillStyle = ['#8e1b1b','#1a3d7c','#2e5e1e','#b8860b','#5b2c6f','#a0522d','#00695c'][(k*7 + r*3 + b + tier) % 7]; g.fillRect(Math.min(x0, x1), top0, Math.abs(x1 - x0), bot0 - top0); } }
        g.strokeStyle = '#d4a52c'; g.lineWidth = 1; g.beginPath(); g.moveTo(xa, ya0); g.lineTo(xa, ya1); g.stroke(); }
      g.strokeStyle = '#3e2723'; g.lineWidth = 6; g.beginPath(); g.moveTo(ox, y1 + 4); g.lineTo(ix, iy1 + 2); g.stroke(); g.strokeStyle = '#d4a52c'; g.lineWidth = 2; g.beginPath(); g.moveTo(ox, y1); g.lineTo(ix, iy1); g.stroke();
      if(tier === 0) for(let k=0;k<9;k++){ const u = (k + .5)/10, x = ox + (ix - ox)*u, y = y1 + (iy1 - y1)*u; g.fillStyle = '#d4a52c'; g.fillRect(x - 1, y - 10*(1 - u*.6), 2, 10*(1 - u*.6)); } }
    const lx = s < 0 ? 170 : Wc - 170; g.strokeStyle = '#8d6e4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(lx, 130); g.lineTo(lx + s*-18, 262); g.moveTo(lx + 18, 130); g.lineTo(lx + 18 + s*-18, 262); g.stroke(); for(let k=0;k<8;k++){ g.beginPath(); g.moveTo(lx + s*-k*2.2, 140 + k*16); g.lineTo(lx + 18 + s*-k*2.2, 140 + k*16); g.stroke(); } };
  side(-1); side(1);
  // marble checkerboard floor in perspective
  for(let r=0;r<8;r++){ const ya = vy + 70 + Math.pow(r/8, 1.6)*(Hc - vy - 70), yb = vy + 70 + Math.pow((r + 1)/8, 1.6)*(Hc - vy - 70); for(let c=-8;c<8;c++){ const sa = (ya - vy)/(Hc - vy), sb = (yb - vy)/(Hc - vy), xa0 = vx + c*70*sa, xa1 = vx + (c + 1)*70*sa, xb0 = vx + c*70*sb, xb1 = vx + (c + 1)*70*sb;
    g.fillStyle = (r + c) % 2 ? '#e8e0d0' : '#3e2f28'; g.beginPath(); g.moveTo(xa0, ya); g.lineTo(xa1, ya); g.lineTo(xb1, yb); g.lineTo(xb0, yb); g.fill(); } }
  // long reading tables with green banker's lamps
  for(let k=0;k<3;k++){ const y = 190 + k*36, w = 120 + k*70, s = .6 + k*.25; g.fillStyle = '#5d4037'; g.fillRect(vx - w/2, y, w, 8*s); g.fillStyle = '#3e2723'; g.fillRect(vx - w/2 + 4, y + 8*s, 4*s, 18*s); g.fillRect(vx + w/2 - 8, y + 8*s, 4*s, 18*s);
    for(let l=-1;l<=1;l+=2){ const lx = vx + l*w/4; g.fillStyle = '#1b5e20'; g.beginPath(); g.ellipse(lx, y - 8*s, 10*s, 5*s, 0, Math.PI, 0); g.fill(); g.fillStyle = `rgba(255,236,179,${.35 + .1*Math.sin(t*3 + k)})`; g.beginPath(); g.ellipse(lx, y + 2, 22*s, 6*s, 0, 0, 7); g.fill(); g.fillStyle = '#d4a52c'; g.fillRect(lx - 1, y - 8*s, 2, 8*s); } }
  // crystal chandeliers
  [[vx - 230, 60, 1], [vx, 70, .8], [vx + 230, 60, 1]].forEach(([x, y, s]) => { g.strokeStyle = '#d4a52c'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y - 18*s); g.stroke(); g.fillStyle = `rgba(255,224,130,${.18 + .06*Math.sin(t*2 + x)})`; g.beginPath(); g.arc(x, y, 46*s, 0, 7); g.fill();
    g.strokeStyle = '#d4a52c'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 30*s, 8*s, 0, 0, Math.PI); g.stroke(); for(let k=0;k<7;k++){ const a = Math.PI*(k/6), cx2 = x + Math.cos(a)*30*s, cy2 = y + Math.sin(a)*8*s; g.fillStyle = '#fff8e1'; g.fillRect(cx2 - 1.5, cy2 - 10*s, 3, 8*s); g.fillStyle = '#ffca28'; g.beginPath(); g.arc(cx2, cy2 - 12*s, 2.2 + Math.sin(t*9 + k)*.5, 0, 7); g.fill(); g.fillStyle = '#e1f5fe'; g.beginPath(); g.arc(cx2, cy2 + 5*s, 2, 0, 7); g.fill(); } });
  // gilded frame and title
  g.strokeStyle = '#d4a52c'; g.lineWidth = 6; g.strokeRect(3, 3, Wc - 6, Hc - 6); g.strokeStyle = '#8d6e1f'; g.lineWidth = 2; g.strokeRect(9, 9, Wc - 18, Hc - 18);
  g.fillStyle = 'rgba(20,10,4,.7)'; g.fillRect(Wc/2 - 220, Hc - 40, 440, 30); g.font = '22px Bungee, sans-serif'; g.fillStyle = '#ffd54f'; g.textAlign = 'center'; g.fillText('ĐẠI SẢNH ĐỌC SÁCH HOÀNG GIA', Wc/2, Hc - 17); g.textAlign = 'left';
}
function libHallLoop(){ if(!LH.run) return; if($('#mLib').hidden){ LH.run = false; return; } LH.t += .03; drawLibraryHall(); setTimeout(() => requestAnimationFrame(libHallLoop), 80); }
function v19Init(){
  const lib = $('#mLib'); if(lib && !$('#libHall')){ const cv = el('canvas', {id:'libHall', width:1100, height:300}); cv.className = 'libhall'; cv.setAttribute('aria-label', 'Đại sảnh đọc sách hoàng gia: giá sách hai tầng, đèn chùm pha lê, trần vẽ bích họa'); lib.querySelector('.mhead').after(cv); }
  new MutationObserver(() => { if(!$('#mLib').hidden && !LH.run){ LH.run = true; libHallLoop(); } }).observe($('#mLib'), {attributes:true, attributeFilter:['hidden']});
}

