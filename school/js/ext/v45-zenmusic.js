// ================= v45 (Session 6): Zen temple, open-air painters' meadow, music corners, student opera,
// and calm background music for every zone (made live with Web Audio, fades out as you walk away).
// Everything is drawn relative to its zone (R.zen, R.art, R.music, R.hall), so it moves with the zone. =================
const V45 = {PHI:1.618, vol:.5, ac:null, out:null, wet:null, th:{}, cur:'', timer:null, ck:0, cache:{}, op0:0, opBpm:66, started:false};
try { const v = parseFloat(localStorage.getItem('truong-bgm-v45')); if(v >= 0 && v <= 1) V45.vol = v; } catch(e){}
const v45H = (a, b) => { let h = (a*73856093) ^ (b*19349663); h = (h ^ (h >>> 13))*1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
const v45Vis = (r, m) => r && VB.x0 < r.x + r.w + (m || 0) && VB.x1 > r.x - (m || 0) && VB.y0 < r.y + r.h + (m || 0) && VB.y1 > r.y - (m || 0);
function v45Sit(id, x, y, dir, extra){ const f = fakeAt(id, x, y, dir, Object.assign({icon:null, moving:false}, extra || {})); ctx.save(); ctx.translate(Math.round(x), Math.round(y)); rect(f.pants, -8, -6, 16, 6); ctx.translate(0, 4); f.moving = false; drawBody(f, false); ctx.restore(); return f; }
function v45Cv(w, h, k){ const c = document.createElement('canvas'); c.width = Math.ceil(w*k); c.height = Math.ceil(h*k); const g = c.getContext('2d'); g.scale(k, k); g.imageSmoothingEnabled = false; return [c, g]; }

// ---------- 1. Zen garden: Buddhist temple (own design) ----------
function v45TempleCanvas(){
  if(V45.cache.temple) return V45.cache.temple; const [cv, c] = v45Cv(260, 190, 2); c.translate(130, 186);
  const R_ = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const poly = (col, pts) => { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); };
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, -2, 128, 10, 0, 0, 7); c.fill();
  // stone platform (two tiers) + front steps
  R_('#a39782', -118, -16, 236, 16); R_('#c9bea6', -118, -16, 236, 3); R_('#b6aa93', -104, -26, 208, 10); R_('#d8cfb8', -104, -26, 208, 2);
  for(let k=0;k<4;k++){ R_(k % 2 ? '#cfc4ac' : '#bdb19a', -30 + k, -16 + k*4, 60 - k*2, 4); }
  // lower hall
  R_('#f1e3c4', -84, -74, 168, 48); R_('#8a7a62', -84, -28, 168, 2);
  [-84, -62, 56, 78].forEach(x => { R_('#a8322b', x, -74, 6, 48); R_('#c9483e', x + 1, -74, 2, 48); });
  [[-52, -64], [26, -64]].forEach(([x, y]) => { R_('#7a3b2a', x, y, 26, 26); c.strokeStyle = '#d9b26a'; c.lineWidth = 1; for(let k=1;k<4;k++){ c.beginPath(); c.moveTo(x + k*6.5, y); c.lineTo(x + k*6.5, y + 26); c.moveTo(x, y + k*6.5); c.lineTo(x + 26, y + k*6.5); c.stroke(); } });
  R_('#a8322b', -24, -68, 48, 42); R_('#2b1a12', -20, -64, 40, 38);
  const gl = c.createRadialGradient(0, -44, 2, 0, -44, 26); gl.addColorStop(0, 'rgba(255,214,120,.9)'); gl.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = gl; c.fillRect(-20, -64, 40, 38);
  // seated Buddha inside the door
  c.fillStyle = '#e0b84a'; c.beginPath(); c.ellipse(0, -31, 15, 4, 0, 0, 7); c.fill();
  poly('#d4a032', [[-11, -32], [11, -32], [6, -47], [-6, -47]]); c.fillStyle = '#e8bd4c'; c.beginPath(); c.ellipse(0, -35, 12, 4, 0, 0, 7); c.fill();
  c.beginPath(); c.arc(0, -51, 5, 0, 7); c.fill(); c.beginPath(); c.arc(0, -57, 2.2, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,240,190,.75)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, -51, 9, 0, 7); c.stroke();
  R_('#2b1a12', -22, -77, 44, 8); c.fillStyle = '#e8c35a'; c.font = 'bold 6px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('TĨNH TÂM', 0, -71);
  // lower roof with lifted eaves
  const roof = (y0, half, rise, tip) => { poly('#2e5450', [[-half - 18, y0 - tip], [-half, y0], [half, y0], [half + 18, y0 - tip], [half - 26, y0 - rise], [-half + 26, y0 - rise]]);
    c.strokeStyle = '#244340'; c.lineWidth = 1; for(let x = -half + 4; x < half; x += 6){ c.beginPath(); c.moveTo(x, y0 - 1); c.lineTo(x + (x < 0 ? 4 : -4)*(rise/30), y0 - rise + 2); c.stroke(); }
    c.strokeStyle = '#c9a24a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-half - 18, y0 - tip); c.quadraticCurveTo(-half - 4, y0 + 1, -half + 8, y0); c.lineTo(half - 8, y0); c.quadraticCurveTo(half + 4, y0 + 1, half + 18, y0 - tip); c.stroke();
    R_('#c9a24a', -half + 24, y0 - rise - 3, 2*half - 48, 4); c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(-half + 22, y0 - rise - 3, 3, 0, 7); c.arc(half - 22, y0 - rise - 3, 3, 0, 7); c.fill(); };
  roof(-74, 96, 30, 10);
  // upper hall (height = lower/φ) and roof
  R_('#f1e3c4', -50, -135, 100, 31); [-50, -32, 27, 45].forEach(x => { R_('#a8322b', x, -135, 5, 31); }); R_('#7a3b2a', -12, -130, 24, 18);
  c.strokeStyle = '#d9b26a'; c.lineWidth = 1; for(let k=1;k<3;k++){ c.beginPath(); c.moveTo(-12 + k*8, -130); c.lineTo(-12 + k*8, -112); c.stroke(); }
  roof(-133, 58, 22, 8);
  // golden finial
  R_('#c9a24a', -2, -176, 4, 20); c.fillStyle = '#e2b445'; [[-161, 4.5], [-169, 3.5], [-176, 2.5]].forEach(([y, r]) => { c.beginPath(); c.arc(0, y, r, 0, 7); c.fill(); });
  poly('#ffd54f', [[-2, -178], [2, -178], [0, -186]]);
  // hanging lanterns at the eave tips
  [[-114, -84], [114, -84]].forEach(([x, y]) => { c.strokeStyle = '#5a3a1e'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6); c.stroke(); R_('#c62828', x - 3, y + 6, 6, 7); R_('#ffd54f', x - 3, y + 6, 6, 1); });
  V45.cache.temple = cv; return cv;
}
function v45ZenGround(){
  const r = R.zen; if(!v45Vis(r)) return; const cx = r.x + r.w/V45.PHI;
  // cover the old shed with raked sand
  rect('#e9e2cf', cx - 92, r.y + 1, 184, 116); ctx.strokeStyle = 'rgba(160,140,110,.5)'; ctx.lineWidth = 1.5;
  for(let k=0;k<6;k++){ const y = r.y + 20 + k*22; ctx.beginPath(); ctx.moveTo(cx - 92, y); for(let x = cx - 92; x <= cx + 92; x += 20) ctx.lineTo(x, y + Math.sin(x*.02 + k)*3); ctx.stroke(); }
  // stone path from the temple steps
  for(let k=0;k<5;k++){ const y = r.y + 160 + k*15; ctx.fillStyle = k % 2 ? '#c8bfae' : '#bdb3a0'; ctx.beginPath(); ctx.ellipse(cx + (k % 2 ? 6 : -6), y, 11, 5, 0, 0, 7); ctx.fill(); }
  // meditation mats
  V45_ZEN_SIT.forEach(([dx, dy]) => { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(r.x + dx, r.y + dy + 2, 15, 6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.ellipse(r.x + dx, r.y + dy, 14, 5, 0, 0, 7); ctx.fill(); });
}
const V45_ZEN_SIT = [[90, 236], [470, 330], [96, 420], [214, 520], [300, 512], [480, 430], [250, 190], [392, 190]];
function v45ZenSprites(sp){
  const r = R.zen; if(!v45Vis(r, 60)) return; const t = realT, cx = r.x + r.w/V45.PHI, by = r.y + 152, night = !isDay();
  sp.push({y:by, f:() => { const cv = V45.cache.temple || v45TempleCanvas(); ctx.drawImage(cv, cx - 130, by - 186, 260, 190);
    const p = (Math.sin(t*.9) + 1)/2, g = ctx.createRadialGradient(cx, by - 51, 2, cx, by - 51, 22 + p*6); g.addColorStop(0, `rgba(255,236,170,${.35 + p*.25})`); g.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 30, by - 80, 60, 60); }});
  // stone lanterns
  [-138, 138].forEach(dx => { const x = cx + dx, y = by + 4; if(x < r.x + 10 || x > r.x + r.w - 10) return; sp.push({y, f:() => { rect('#9e9686', x - 9, y - 4, 18, 4); rect('#b3ab9a', x - 3, y - 22, 6, 18); rect('#8f8776', x - 8, y - 32, 16, 10); rect(night ? '#ffcf66' : '#5d5648', x - 4, y - 30, 8, 6); tri(x - 11, y - 32, x + 11, y - 32, x, y - 42, '#7d7566');
    if(night){ const g = ctx.createRadialGradient(x, y - 27, 1, x, y - 27, 26); g.addColorStop(0, 'rgba(255,214,120,.5)'); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 26, y - 53, 52, 52); } }}); });
  // incense burner with slow smoke
  const ix = cx, iy = by + 30; sp.push({y:iy, f:() => { ctx.fillStyle = '#6d5a3a'; ctx.beginPath(); ctx.ellipse(ix, iy - 6, 10, 6, 0, 0, 7); ctx.fill(); rect('#8a7148', ix - 10, iy - 9, 20, 3); rect('#5a4a30', ix - 7, iy - 1, 3, 3); rect('#5a4a30', ix + 4, iy - 1, 3, 3);
    ctx.strokeStyle = 'rgba(235,235,235,.45)'; ctx.lineWidth = 1.4; for(let k=0;k<3;k++){ ctx.beginPath(); for(let s=0;s<10;s++){ const yy = iy - 12 - s*4, xx = ix - 3 + k*3 + Math.sin(t*1.1 + s*.5 + k*2)*(s*.6); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } }});
  // more people meditating quietly (one monk in a saffron robe)
  V45_ZEN_SIT.forEach(([dx, dy], i) => { const x = r.x + dx, y = r.y + dy; if(!inVB(x, y)) return; const br = (Math.sin(t*.6 + i*1.3) + 1)/2;
    sp.push({y, f:() => { ctx.fillStyle = `rgba(255,236,179,${.1 + br*.18})`; ctx.beginPath(); ctx.arc(x, y - 14, 14 + br*7, 0, 7); ctx.fill(); v45Sit(300 + i, x, y, dx < r.w/2 ? 1 : -1, i === 7 ? {shirt:'#e07b1f', pants:'#c96a12'} : null); }}); });
  // drifting petals / fireflies at night
  sp.push({y:r.y + r.h + 1, f:() => { for(let i=0;i<10;i++){ const u = ((t*.018 + i*.1) % 1), x = r.x + ((i*137 + t*12) % r.w), y = r.y + u*r.h, s = Math.sin(t*2 + i);
    if(night){ ctx.fillStyle = `rgba(255,245,160,${.4 + .4*s})`; ctx.fillRect(x, y, 2, 2); } else { ctx.fillStyle = i % 2 ? '#f8bbd0' : '#fce4ec'; ctx.fillRect(x + s*4, y, 3, 2); } } }});
}

// ---------- 2. Painters' meadow: open to nature, many students painting ----------
function v45ArtCanvas(){
  const key = 'art' + season; if(V45.cache[key]) return V45.cache[key]; const r = R.art, s = S(), dong = season === 'dong';
  const pad = 40, [cv, c] = v45Cv(r.w + pad*2, r.h + pad*2, 1); c.translate(pad, pad);
  // soft-edged meadow that melts into the land around it
  for(let k=0;k<4;k++){ c.globalAlpha = .25 + k*.25; c.fillStyle = dong ? '#eef3f5' : s.grass; c.beginPath(); c.ellipse(r.w/2, r.h/2, r.w/2 + pad - k*10, r.h/2 + pad - k*10, 0, 0, 7); c.fill(); }
  c.globalAlpha = 1; c.fillStyle = dong ? '#eef3f5' : s.grass; c.fillRect(6, 6, r.w - 12, r.h - 12);
  for(let i=0;i<220;i++){ const x = v45H(i, 7)*r.w, y = v45H(i, 13)*r.h; c.fillStyle = dong ? '#dfe7ea' : (s.grass2 || '#6a9a3a'); c.fillRect(x, y, 2, 4); }
  // winding dirt path (bottom → top)
  c.strokeStyle = dong ? '#d6dde0' : '#c9ad7a'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(r.w*.5, r.h + pad); c.bezierCurveTo(r.w*.2, r.h*.75, r.w*.8, r.h*.45, r.w*.38, -pad); c.stroke();
  c.strokeStyle = dong ? '#e5ebee' : '#d9bf8c'; c.lineWidth = 8; c.stroke();
  // wildflowers and stones
  if(!dong) for(let i=0;i<90;i++){ const x = v45H(i, 31)*r.w, y = v45H(i, 37)*r.h; c.fillStyle = ['#ff6f91', '#ffd23f', '#ffffff', '#ba68c8', '#ff8a65', '#4fc3f7'][i % 6]; c.fillRect(x, y, 3, 3); c.fillStyle = '#3e7d32'; c.fillRect(x + 1, y + 3, 1, 3); }
  [[.12, .42], [.86, .6], [.7, .1]].forEach(([u, v]) => { c.fillStyle = '#9e9e9e'; c.beginPath(); c.ellipse(u*r.w, v*r.h, 9, 6, 0, 0, 7); c.fill(); c.fillStyle = '#bdbdbd'; c.beginPath(); c.ellipse(u*r.w - 2, v*r.h - 2, 5, 3, 0, 0, 7); c.fill(); });
  V45.cache[key] = cv; return cv;
}
const V45_EASELS = [[.18, .14], [.5, .1], [.82, .18], [.3, .34], [.7, .36], [.12, .56], [.88, .82], [.38, .9], [.62, .9]];
function v45Painting(i){ const k = 'pt' + i; if(V45.cache[k]) return V45.cache[k]; const [cv, c] = v45Cv(30, 22, 1), h = v45H(i, 99);
  const sky = ['#bfe3ff', '#ffd9a8', '#d1c4e9', '#b2ebf2'][i % 4]; c.fillStyle = sky; c.fillRect(0, 0, 30, 22);
  c.fillStyle = '#ffd54f'; c.beginPath(); c.arc(6 + h*18, 6, 3, 0, 7); c.fill(); c.fillStyle = ['#81c784', '#66bb6a', '#9ccc65'][i % 3]; c.beginPath(); c.moveTo(0, 22); c.quadraticCurveTo(10, 8 + h*6, 30, 14); c.lineTo(30, 22); c.fill();
  if(i % 3 === 0){ c.fillStyle = '#4fc3f7'; c.fillRect(0, 18, 30, 4); } else { c.fillStyle = '#2e7d32'; c.fillRect(20, 9, 4, 8); c.fillStyle = '#5d4037'; c.fillRect(21, 16, 2, 3); }
  V45.cache[k] = cv; return cv; }
function v45ArtGround(){ const r = R.art; if(!v45Vis(r, 40)) return; ctx.drawImage(v45ArtCanvas(), r.x - 40, r.y - 40); plate('GÓC HỌA SĨ · BẤM ĐỂ VẼ TRANH', r.x + r.w/2, r.y + r.h - 40); }
function v45ArtSprites(sp){
  const r = R.art; if(!v45Vis(r, 60)) return; const t = realT, day = isDay(), dong = season === 'dong', s = S();
  V45_EASELS.forEach(([u, v], i) => { const ex = r.x + u*r.w, ey = r.y + v*r.h; if(!inVB(ex, ey)) return; const side = u < .5 ? 1 : -1;
    sp.push({y:ey, f:() => { ctx.strokeStyle = '#6d4c2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex, ey - 34); ctx.lineTo(ex - 10, ey); ctx.moveTo(ex, ey - 34); ctx.lineTo(ex + 10, ey); ctx.moveTo(ex, ey - 30); ctx.lineTo(ex, ey - 2); ctx.stroke();
      rect('#fff', ex - 16, ey - 38, 32, 24); ctx.drawImage(v45Painting(i), ex - 15, ey - 37); rect('#5a3418', ex - 17, ey - 15, 34, 2); }});
    if(day) sp.push({y:ey + 8, f:() => { const px = ex + side*18, py = ey + 8; rect('#8d6e4a', px - 5, py - 2, 10, 3); v45Sit(320 + i, px, py, -side, {cap:i % 3 ? null : '#c62828'}); const k = Math.sin(t*4 + i)*3; rect('#6d4c2e', px - side*9, py - 22 + k, 2, 7); rect(['#ef4b4b', '#3d7bff', '#2fbf71', '#ffd23f'][i % 4], px - side*9, py - 23 + k, 2, 2); }}); });
  // trees, a parasol and butterflies make it feel like a meadow
  [[-.06, .02], [1.05, .3], [-.04, .78], [1.04, .98]].forEach(([u, v], i) => { const x = r.x + u*r.w, y = r.y + v*r.h; if(!inVB(x, y)) return;
    sp.push({y, f:() => { rect('#6d4c2e', x - 3, y - 26, 6, 26); const c1 = dong ? '#dfe7ea' : s.leaf, c2 = dong ? '#ffffff' : s.leaf2; circ(x, y - 38, 20, c1); circ(x - 10, y - 30, 13, c1); circ(x + 11, y - 32, 13, c1); circ(x - 6, y - 44, 8, c2); }}); });
  const px = r.x + r.w*.62, py = r.y + r.h*.62; sp.push({y:py, f:() => { rect('#eeeeee', px - 1, py - 40, 2, 40); ctx.fillStyle = '#ef4b4b'; ctx.beginPath(); ctx.moveTo(px - 26, py - 36); ctx.quadraticCurveTo(px, py - 56, px + 26, py - 36); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(px - 9, py - 39); ctx.quadraticCurveTo(px, py - 54, px + 9, py - 39); ctx.fill(); rect('#c9ad7a', px - 14, py - 2, 28, 4); }});
  if(day && !dong) sp.push({y:r.y + r.h, f:() => { for(let i=0;i<3;i++){ const x = r.x + r.w*(.3 + .2*i) + Math.sin(t*.7 + i*2)*40, y = r.y + r.h*(.3 + .2*i) + Math.cos(t*.6 + i)*30, w = Math.sin(t*12 + i)*3; ctx.fillStyle = ['#ffd23f', '#ff6f91', '#4fc3f7'][i]; ctx.fillRect(x - 5, y - w, 4, 4); ctx.fillRect(x + 1, y + w, 4, 4); } }});
}

// ---------- 3. Music room: five instrument corners (golden split) ----------
const V45_INSTR = [{k:'piano', n:'PIANO', u:.19, v:.62}, {k:'violin', n:'VIOLIN', u:.47, v:.66}, {k:'flute', n:'SÁO', u:.79, v:.66}, {k:'trumpet', n:'TRUMPET', u:.47, v:.89}, {k:'sax', n:'SAXOPHONE', u:.79, v:.89}];
function v45InstrPos(i){ const r = R.music, d = V45_INSTR[i]; return [r.x + d.u*r.w, r.y + d.v*r.h]; }
function v45DrawInstr(k, x, y, dir, t){
  const s = dir, hy = y - 13;
  if(k === 'violin'){ rect('#8d4a1f', x + s*3, hy - 6, 8*s, 5); rect('#3e2723', x + s*10, hy - 5, 6*s, 2); const b = Math.sin(t*5)*6; ctx.strokeStyle = '#eeeeee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + s*(2 + b), hy + 2); ctx.lineTo(x + s*(14 + b), hy - 8); ctx.stroke(); }
  else if(k === 'cello'){ rect('#7b3f17', x + s*6 - 4, hy - 4, 9, 14); rect('#3e2723', x + s*6 - 1, hy - 14, 2, 12); const b = Math.sin(t*3)*4; ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + s*(-2) + b, hy + 2); ctx.lineTo(x + s*14 + b, hy + 4); ctx.stroke(); }
  else if(k === 'flute'){ rect('#cfd8dc', x + s*2, hy - 6, 16*s, 2); rect('#90a4ae', x + s*8, hy - 6, 1, 2); }
  else if(k === 'trumpet'){ rect('#e0b84a', x + s*3, hy - 5, 12*s, 3); ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.moveTo(x + s*15, hy - 8); ctx.lineTo(x + s*15, hy + 1); ctx.lineTo(x + s*19, hy + 3); ctx.lineTo(x + s*19, hy - 10); ctx.fill(); }
  else if(k === 'sax'){ ctx.strokeStyle = '#e0b84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + s*3, hy - 8); ctx.lineTo(x + s*6, hy + 4); ctx.quadraticCurveTo(x + s*9, hy + 9, x + s*12, hy + 2); ctx.stroke(); circ(x + s*12, hy + 1, 3, '#ffd54f'); }
  else if(k === 'horn'){ ctx.strokeStyle = '#e0b84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + s*7, hy, 5, 0, 7); ctx.stroke(); circ(x + s*12, hy + 3, 3, '#ffd54f'); }
  else if(k === 'timpani'){ ctx.fillStyle = '#b87333'; ctx.beginPath(); ctx.ellipse(x + s*14, y - 6, 9, 6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f5ecd7'; ctx.beginPath(); ctx.ellipse(x + s*14, y - 10, 9, 3, 0, 0, 7); ctx.fill(); }
}
function v45MusicRoom(){
  const r = R.music; if(!v45Vis(r, 20)) return;
  V45_INSTR.forEach((d, i) => { if(i === 0) return; const [x, y] = v45InstrPos(i); ctx.fillStyle = ['#5c4b8a', '#3f6e8a', '#8a5a3f', '#7a3f6e'][i - 1]; ctx.beginPath(); ctx.ellipse(x, y - 2, 30, 12, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y - 2, 26, 9, 0, 0, 7); ctx.stroke(); });
  ctx.font = 'bold 9px Nunito, sans-serif'; ctx.textAlign = 'center'; V45_INSTR.forEach((d, i) => { const [x, y] = v45InstrPos(i); const ly = i === 0 ? r.y + r.h*.45 + 16 : y + 16; ctx.fillStyle = 'rgba(20,16,40,.75)'; const w = ctx.measureText(d.n).width + 8; ctx.fillRect(x - w/2, ly - 9, w, 12); ctx.fillStyle = '#ffe082'; ctx.fillText(d.n, x, ly); }); ctx.textAlign = 'left';
}
function v45MusicSprites(sp){
  const r = R.music; if(!v45Vis(r, 30)) return; const t = realT;
  V45_INSTR.forEach((d, i) => { let [x, y] = v45InstrPos(i); if(i === 0){ x = r.x + r.w*.19; y = r.y + r.h*.45; } const dir = i === 0 ? 1 : (i % 2 ? 1 : -1), bob = Math.sin(t*2.6 + i)*1;
    sp.push({y, f:() => { if(i === 0){ rect('#2a2a2a', x - 14, y - 4, 28, 5); } v45Sit(340 + i, x, y + bob, dir); if(i){ v45DrawInstr(d.k, x, y + bob, dir, t); }
      else { const k = Math.sin(t*8)*1.5; rect('#f2c9a0', x - 6, y - 26 + k, 3, 3); rect('#f2c9a0', x + 3, y - 26 - k, 3, 3); }
      if(V45.th.room && V45.th.room.w > .05 && Math.sin(t*1.7 + i*1.9) > .6){ ctx.fillStyle = 'rgba(255,224,130,.85)'; ctx.font = '12px Nunito, sans-serif'; ctx.fillText('♪', x + 8 + Math.sin(t*3 + i)*3, y - 34 - ((t*14 + i*9) % 16)); } }}); });
}

// ---------- 4. Opera stage in the Great Hall: student orchestra, conductor and audience ----------
function v45OperaSprites(sp){
  const r = R.hall; if(!v45Vis(r, 30)) return; const t = realT, cx = r.x + r.w/2, beat = v45OpBeat();
  if(!(typeof concert !== 'undefined' && concert)){
    const seats = [];
    [['violin', 7, 52, 106], ['cello', 4, 94, 132], ['flute', 2, 36, 128], ['horn', 2, 70, 148], ['timpani', 1, 0, 158]].forEach(([k, n, rad, dy]) => {
      for(let j=0;j<n;j++){ const a = n === 1 ? Math.PI/2 : Math.PI*(.15 + .7*j/(n - 1)); seats.push([k, cx + Math.cos(a)*rad*(k === 'timpani' ? 0 : 1) + (k === 'timpani' ? 128 : 0), r.y + dy + Math.sin(a)*12]); } });
    // seated players are drawn once into a cached layer (cheap on phones); instruments stay animated
    const oc = V45.cache.orch || (V45.cache.orch = v45Layer(r.w, 170, () => seats.forEach(([k, x, y], i) => { const lx = x - r.x, ly = y - r.y - 20; rect('#3e2723', lx - 6, ly - 2, 12, 3); v45Sit(360 + i, lx, ly, x < cx ? 1 : -1, {shirt:'#212121', pants:'#111'}); })));
    sp.push({y:r.y + 160, f:() => { ctx.drawImage(oc, r.x, r.y + 20); seats.forEach(([k, x, y], i) => v45DrawInstr(k, x, y + 4, x < cx ? 1 : -1, t + i*.3)); }});
    // conductor on a podium, baton follows the music beat
    const py = r.y + 190; sp.push({y:py, f:() => { rect('#5d4037', cx - 14, py - 4, 28, 7); rect('#795548', cx - 14, py - 4, 28, 2); const f = fakeAt(380, cx, py - 4, 1, {icon:null, moving:false, shirt:'#111', pants:'#111'}); bodyAt(f);
      const ph = beat % 1, sw = Math.sin(ph*Math.PI*2), bx = cx + 4 + sw*10, byy = py - 26 - Math.abs(Math.cos(ph*Math.PI))*8; rect('#f2c9a0', bx - 1, byy, 3, 3); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx + 1, byy); ctx.lineTo(bx + 8 + sw*5, byy - 10); ctx.stroke(); rect('#f2c9a0', cx - 9 - sw*3, py - 24, 3, 3); }});
    // floating notes above the orchestra while the music plays
    if(V45.th.opera && V45.th.opera.w > .03) sp.push({y:r.y + 200, f:() => { ctx.font = '13px Nunito, sans-serif'; for(let i=0;i<5;i++){ const u = (t*.35 + i*.2) % 1; ctx.fillStyle = `rgba(255,236,150,${1 - u})`; ctx.fillText(i % 2 ? '♪' : '♫', cx - 80 + i*40 + Math.sin(t + i)*6, r.y + 120 - u*40); } }});
  }
  // student audience on the benches (same grid as the hall seats)
  for(let row=0; row<5; row++){ const y = r.y + 210 + row*68 + 6; if(y < VB.y0 - 10 || y - 50 > VB.y1) continue;
    const lc = V45.cache['aud' + row] || (V45.cache['aud' + row] = v45Layer(r.w, 50, () => { for(let c=0; c<4; c++) for(let s=0;s<2;s++){ if(v45H(row*4 + c, s) < .25) continue; const lx = 46 + c*84 + 14 + s*24; v45Sit(400 + row*8 + c*2 + s, lx, 44, lx < r.w/2 ? 1 : -1); } }));
    sp.push({y, f:() => { ctx.drawImage(lc, r.x, y - 44); const k = Math.floor(t*.5) % 8, x = r.x + 60 + ((row*3 + k)*53) % (r.w - 120); if(Math.sin(t*1.6 + row) > .8){ ctx.fillStyle = '#ffd54f'; ctx.font = '10px Nunito, sans-serif'; ctx.fillText('♥', x, y - 38); } }}); }
}
function v45Layer(w, h, fn){ const [cv, g] = v45Cv(w, h, 1); withCtx(g, fn); return cv; }
function v45OpBeat(){ if(V45.ac && V45.op0 && V45.th.opera && V45.th.opera.w > .01) return (V45.ac.currentTime - V45.op0)*V45.opBpm/60; return realT*V45.opBpm/60; }

// ---------- 5. Background music engine (Web Audio, original pieces, CC0) ----------
const V45_LITE = (() => { try { return matchMedia('(pointer:coarse)').matches; } catch(e){ return false; } })();
const v45M = m => 440*Math.pow(2, (m - 69)/12);
function v45Env(o, out, t, a, d, v){ const g = V45.ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); o.connect(g); g.connect(out); return g; }
function v45Note(kind, m, t, d, v, out){
  if(!out) return;
  const A = V45.ac, o = A.createOscillator(); let src = o, extra = [];
  if(kind === 'pluck' || kind === 'koto'){ o.type = 'triangle'; o.frequency.setValueAtTime(v45M(m)*(kind === 'koto' ? 1.01 : 1), t); if(kind === 'koto') o.frequency.exponentialRampToValueAtTime(v45M(m), t + .08); v45Env(o, out, t, .005, d, v); }
  else if(kind === 'box'){ o.type = 'sine'; o.frequency.value = v45M(m); v45Env(o, out, t, .004, d, v); const o2 = A.createOscillator(); o2.frequency.value = v45M(m)*4; v45Env(o2, out, t, .002, d*.3, v*.25); extra.push(o2); }
  else if(kind === 'epiano'){ o.type = 'sine'; o.frequency.value = v45M(m); v45Env(o, out, t, .01, d, v); const o2 = A.createOscillator(); o2.type = 'triangle'; o2.frequency.value = v45M(m)*2; v45Env(o2, out, t, .01, d*.4, v*.18); extra.push(o2); }
  else if(kind === 'bowl'){ o.type = 'sine'; o.frequency.value = v45M(m); v45Env(o, out, t, .02, d, v); [2.71, 5.1].forEach((k, i) => { const p = A.createOscillator(); p.frequency.value = v45M(m)*k; v45Env(p, out, t, .02, d*(.6 - i*.2), v*.3/(i + 1)); extra.push(p); }); }
  else { // sustained voices: bowed, flute, brass, sax, pad
    const lp = A.createBiquadFilter(); lp.type = kind === 'sax' ? 'bandpass' : 'lowpass'; lp.frequency.value = {bowed:1700, flute:2600, brass:1300, sax:1100, pad:900}[kind] || 1500; lp.Q.value = kind === 'sax' ? 1.2 : .7;
    o.type = kind === 'flute' ? 'sine' : kind === 'brass' ? 'square' : 'sawtooth'; o.frequency.value = v45M(m); if(kind === 'pad' && !V45_LITE){ o.detune.value = -7; const o2 = A.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = v45M(m); o2.detune.value = 7; o2.connect(lp); extra.push(o2); }
    if(!V45_LITE && kind !== 'pad' && kind !== 'brass'){ const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = 5.2; lg.gain.value = v45M(m)*.006; l.connect(lg); lg.connect(o.frequency); extra.push(l); }
    o.connect(lp); const g = A.createGain(), at = kind === 'pad' ? Math.min(.9, d*.4) : kind === 'brass' ? .05 : .09; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at); g.gain.setValueAtTime(v, t + Math.max(at, d - .15)); g.gain.exponentialRampToValueAtTime(.0001, t + d + .25); lp.connect(g); g.connect(out); src = null; }
  const end = t + d + .35; o.start(t); o.stop(end); extra.forEach(x => { x.start(t); x.stop(end); });
}
function v45Thump(m, t, v, out){ const o = V45.ac.createOscillator(); o.frequency.setValueAtTime(v45M(m), t); o.frequency.exponentialRampToValueAtTime(v45M(m)*.7, t + .4); v45Env(o, out, t, .005, .6, v); o.start(t); o.stop(t + .7); }
const V45_CH = {Fmaj7:[53, 57, 60, 64], Em7:[52, 55, 59, 62], Dm7:[50, 53, 57, 60], Cmaj7:[48, 52, 55, 59], C:[48, 52, 55], Am:[45, 48, 52], F:[41, 45, 48], G:[43, 47, 50], Dm:[50, 53, 57], Bb:[46, 50, 53], Fo:[53, 57, 60], Co:[48, 52, 55]};
const V45_PENT = [72, 74, 76, 79, 81, 84];
// a theme = tempo + a function that plays one step (eighth note unless noted)
const V45_THEMES = {
  world:{n:'Giai điệu thong thả', bpm:66, step(i, t, o, e){ const bar = Math.floor(i/8) % 4, ch = V45_CH[['Fmaj7', 'Em7', 'Dm7', 'Cmaj7'][bar]];
    if(i % 8 === 0) ch.forEach((m, k) => v45Note('epiano', m, t + k*.03, e*7, .045, o)); if(i % 8 === 4) v45Note('epiano', ch[0] - 12, t, e*3, .05, o);
    if(Math.random() < .28 && i % 2 === 0) v45Note('epiano', V45_PENT[Math.floor(Math.random()*5)], t, e*2.5, .05, o); }},
  zen:{n:'Thiền: chuông và đàn tranh', bpm:48, step(i, t, o, e){ const P = [62, 65, 67, 69, 72, 74, 77];
    if(i % 16 === 0){ v45Note('pad', 38, t, e*16, .03, o); v45Note('pad', 45, t, e*16, .025, o); }
    if(i % 32 === 8) v45Note('bowl', 62, t, 9, .06, o);
    if(i % 2 === 0 && Math.random() < .3){ const m = P[Math.floor(Math.random()*P.length)]; v45Note('koto', m, t, 2.4, .07, o); if(Math.random() < .3) v45Note('koto', m + 5, t + e*.5, 2, .04, o); } }},
  art:{n:'Họa sĩ: hộp nhạc', bpm:168, step(i, t, o, e){ const MEL = [67, 71, 74, 72, 71, 69, 67, 69, 71, 69, 0, 0, 71, 74, 79, 78, 76, 74, 72, 71, 69, 67, 0, 0], BASS = [43, 48, 43, 50, 43, 50, 48, 43];
    const k = i % 24, m = MEL[k]; if(m) v45Note('box', m + 12, t, 1.2, .06, o); if(k % 3 === 0) v45Note('pluck', BASS[k/3], t, e*2.5, .05, o); }},
  room:{n:'Phòng nhạc: hoà tấu nhỏ', bpm:84, voices:['piano', 'violin', 'flute', 'trumpet', 'sax'], step(i, t, o, e){ const bar = Math.floor(i/8) % 4, ch = V45_CH[['C', 'Am', 'F', 'G'][bar]], k = i % 8;
    v45Note('pluck', ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + 12, t, e*1.6, .06, o.piano);
    const VI = [76, 0, 0, 0, 74, 0, 72, 0, 72, 0, 0, 0, 76, 0, 74, 0, 72, 0, 0, 0, 69, 0, 71, 0, 74, 0, 0, 0, 0, 0, 0, 0]; const vm = VI[i % 32]; if(vm) v45Note('bowed', vm, t, e*(vm === 74 && i % 32 === 24 ? 7 : 3.6), .05, o.violin);
    if(bar % 2 === 1 && k % 2 === 0 && Math.random() < .6) v45Note('flute', V45_PENT[(i/2 + bar) % 5 | 0] + 12, t, e*1.8, .035, o.flute);
    if(bar === 3 && (k === 0 || k === 3 || k === 6)) v45Note('brass', [67, 71, 74][k/3], t, e*2.2, .03, o.trumpet);
    if(k % 2 === 0) v45Note('sax', ch[0] + [0, 4, 7, 9][k/2] - 12, t, e*1.8, .05, o.sax); }},
  opera:{n:'Sân khấu opera: dàn nhạc học sinh', bpm:66, step(i, t, o, e){ const bar = Math.floor(i/8) % 4, ch = V45_CH[['Dm', 'Bb', 'Fo', 'Co'][bar]], k = i % 8;
    if(k === 0){ ch.forEach(m => v45Note('pad', m, t, e*8, .028, o)); v45Note('bowed', ch[0] - 12, t, e*7.5, .04, o); v45Thump(ch[0] - 24, t, .12, o); }
    if(k === 4) v45Thump(ch[0] - 24, t, .07, o);
    const ML = [74, 0, 0, 76, 77, 0, 76, 74, 74, 0, 0, 0, 72, 0, 70, 0, 69, 0, 0, 72, 77, 0, 76, 72, 72, 0, 0, 0, 0, 0, 0, 0], m = ML[i % 32]; if(m) v45Note('bowed', m + (Math.floor(i/32) % 2 ? 12 : 0), t, e*2.6, .06, o);
    if(k === 0 && bar % 2 === 0) v45Note('brass', ch[2], t + e*2, e*4, .022, o); }},
  library:{n:'Thư viện: đàn hạc', bpm:60, step(i, t, o, e){ const ch = V45_CH[['Am', 'F', 'C', 'G'][Math.floor(i/8) % 4]], k = i % 8; v45Note('pluck', ch[k % 3] + 12 + (k > 3 ? 12 : 0), t, e*3, .04, o); }},
  garden:{n:'Vườn hoa: sáo trúc', bpm:70, step(i, t, o, e){ const P = [67, 69, 72, 74, 76, 79]; if(i % 16 === 0) [55, 62].forEach(m => v45Note('pad', m, t, e*15, .02, o));
    if(i % 2 === 0 && Math.random() < .35) v45Note('flute', P[Math.floor(Math.random()*P.length)], t, e*(1.5 + Math.random()*2), .04, o); }}
};
function v45Sources(px, py){
  const rd = (r) => r ? Math.hypot(Math.max(r.x - px, 0, px - r.x - r.w), Math.max(r.y - py, 0, py - r.y - r.h)) : 1e9, fall = (d, a, b) => d <= a ? 1 : d >= b ? 0 : Math.pow(1 - (d - a)/(b - a), 2);
  const w = {zen:fall(rd(R.zen), 0, 520), art:fall(rd(R.art), 0, 420), library:fall(rd(R.library), 0, 360)*.7, garden:Math.max(fall(rd(R.lotus), 0, 380), fall(rd(R.garden), 0, 380), fall(rd(R.botanic), 0, 380))*.8};
  const h = R.hall; w.opera = h ? fall(Math.hypot(px - (h.x + h.w/2), py - (h.y + 150)), 120, 720) : 0;
  const rv = {}; let room = 0; if(R.music) V45_INSTR.forEach((d, i) => { const [x, y] = v45InstrPos(i), v = fall(Math.hypot(px - x, py - y), 50, 380); rv[d.k] = v; room = Math.max(room, v); });
  w.room = room; let mx = 0; for(const k in w) mx = Math.max(mx, w[k]); w.world = .55*(1 - mx); return {w, rv};
}
function v45Ensure(){
  if(V45.ac) return true; try { ensureAC(); } catch(e){ return false; } if(typeof AC === 'undefined' || !AC) return false; const A = V45.ac = AC;
  V45.out = A.createGain(); V45.out.gain.value = 0; V45.out.connect(A.destination);
  const dl = A.createDelay(1), fb = A.createGain(), lp = A.createBiquadFilter(), wet = A.createGain(); dl.delayTime.value = .27; fb.gain.value = .33; lp.type = 'lowpass'; lp.frequency.value = 2400; wet.gain.value = .32;
  V45.wet = A.createGain(); V45.wet.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(V45.out);
  for(const k in V45_THEMES){ const T = V45_THEMES[k], g = A.createGain(); g.gain.value = 0; g.connect(V45.out); if(!V45_LITE) g.connect(V45.wet); const th = {g, w:0, i:0, next:0, on:false};
    if(T.voices){ th.v = {}; T.voices.forEach(n => { const vg = A.createGain(); vg.gain.value = 0; vg.connect(g); th.v[n] = vg; }); } V45.th[k] = th; }
  V45.timer = setInterval(v45Sched, 90); return true;
}
function v45Sched(){
  const A = V45.ac; if(!A || A.state !== 'running' || document.hidden) return; const now = A.currentTime;
  const top = Object.keys(V45.th).sort((a, b) => V45.th[b].w - V45.th[a].w).slice(0, V45_LITE ? 1 : 2);
  for(const k in V45.th){ const th = V45.th[k], T = V45_THEMES[k]; if(th.w < .03 || !top.includes(k)){ th.on = false; continue; }
    const e = 60/T.bpm/2; if(!th.on){ th.on = true; th.i = 0; th.next = now + .1; if(k === 'opera') V45.op0 = th.next; }
    let n = 0; while(th.next < now + .35 && n++ < 8){ try { T.step(th.i, th.next, th.v ? th.vo : th.g, e); } catch(err){} th.next += e; th.i++; } }
}
function v45Update(dt){
  V45.ck -= dt; if(V45.ck > 0) return; V45.ck = .25;
  const ambOn = typeof AMB === 'undefined' || (AMB.on && AMB.started); if(!ambOn && !V45.ac) return; if(!v45Ensure()) return; const A = V45.ac, now = A.currentTime;
  const p = PLAYER && PLAYER.visible ? PLAYER : cam, {w, rv} = v45Sources(p.x, p.y);
  let duck = 1; if(typeof musicOn !== 'undefined' && musicOn) duck *= .3; if(typeof openModal !== 'undefined' && openModal && openModal.id !== 'mZen') duck *= .4;
  V45.out.gain.setTargetAtTime(ambOn && !document.hidden ? V45.vol*duck : 0, now, .6);
  let best = '', bw = 0; for(const k in V45.th){ const th = V45.th[k]; th.w = w[k] || 0; th.g.gain.setTargetAtTime(th.w, now, .8); if(th.v){ th.vo = {}; for(const n in th.v){ th.v[n].gain.setTargetAtTime(rv[n] || 0, now, .5); th.vo[n] = (rv[n] || 0) > .04 ? th.v[n] : null; } } if(th.w > bw){ bw = th.w; best = k; } }
  if(best !== V45.cur){ V45.cur = best; const b = $('#v45Now'); if(b) b.textContent = '🎵 ' + V45_THEMES[best].n; }
}
function v45SettingsUi(){
  const sec = document.querySelector('#mSet .stsec'); if(!sec || $('#v45Row')) return; const d = document.createElement('div'); d.className = 'strow'; d.id = 'v45Row';
  d.innerHTML = '<span>🎵 Nhạc nền theo từng khu <small id="v45Now"></small></span><span><input type="range" id="v45Bgm" min="0" max="1" step="0.05" aria-label="Âm lượng nhạc nền"> <b id="v45BgmN"></b></span>';
  const h = sec.querySelector('h3'); h && h.nextSibling ? sec.insertBefore(d, h.nextSibling) : sec.appendChild(d);
  const s = $('#v45Bgm'), n = $('#v45BgmN'); s.value = V45.vol; n.textContent = Math.round(V45.vol*100) + '%'; if(V45.cur) $('#v45Now').textContent = '🎵 ' + V45_THEMES[V45.cur].n;
  s.oninput = () => { V45.vol = +s.value; n.textContent = Math.round(V45.vol*100) + '%'; try { localStorage.setItem('truong-bgm-v45', String(V45.vol)); } catch(e){} V45.ck = 0; };
}

// ---------- init: wrap the old hooks from here, no edits in older files ----------
function v45ZenMusicInit(){
  const ai = SOFT_ZONES.indexOf('art'); if(ai >= 0) SOFT_ZONES.splice(ai, 1);
  const vs = v20Soft; v20Soft = function(){ vs.apply(this, arguments); if(typeof FEED !== 'undefined' && FEED) return; try { v45ZenGround(); } catch(e){} try { v45ArtGround(); } catch(e){} };
  const vr = v20Rooms; v20Rooms = function(){ vr.apply(this, arguments); if(typeof FEED !== 'undefined' && FEED) return; try { v45MusicRoom(); } catch(e){} };
  const es = extSprites; extSprites = function(sp){ es(sp); try { v45ZenSprites(sp); v45ArtSprites(sp); v45MusicSprites(sp); v45OperaSprites(sp); } catch(e){} };
  const au = ambUpdate; ambUpdate = function(dt){ au.apply(this, arguments); try { v45Update(dt); } catch(e){} };
  const sm = showModal; showModal = function(id){ const r = sm.apply(this, arguments); if(id === 'mSet') setTimeout(v45SettingsUi, 0); return r; };
}
