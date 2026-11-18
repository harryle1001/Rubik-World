// ================= v52w · 2/4 SỰ SỐNG VÙNG MỚI: TTTM, nhà làng, phố đi bộ (đài phun nước, nghệ sĩ, xe đẩy, đèn dây), người qua lại, cửa vào, đèn đêm, bản đồ =================
// Vật động được xếp theo y cùng người đi trên đảo/đất liền: gom ở v46DrawGround, xả dần trong v46DrawRaw, phần còn lại trước v47wWorld.
const V52W_WEEKEND = () => { try { return dow() >= 5; } catch(e){ return false; } };
const V52W_PEDC = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1', '#6d4c41', '#ec407a', '#5c6bc0'];
function v52wPeds(){
  if(V52W.peds) return V52W.peds; const r = v52wRnd, mk = (i, o) => Object.assign({o:r(), sp:14 + r()*16, c:V52W_PEDC[i % 10], hair:['#1a1a1a', '#3a2418', '#6d4c2e', '#c58c4a'][i % 4], skin:['#f5d1ad', '#eab98c', '#c98e60'][i % 3], ph:r()*6}, o);
  V52W.peds = {street:Array.from({length:40}, (_, i) => mk(i, {lane:(i*.618) % 1})), village:Array.from({length:8}, (_, i) => mk(i + 3, {row:i % 3})), farm:Array.from({length:6}, (_, i) => mk(i + 5, {f:i})), beach:Array.from({length:12}, (_, i) => mk(i + 7, {u:i}))};
  return V52W.peds;
}
// ---------- TTTM: sprite tĩnh (ngày + lớp cửa kính sáng ban đêm), mái nhìn từ trên + mặt tiền kính ----------
function v52wMallSpr(){
  const k = season; if(V52W.mallSpr && V52W.mallSpr.k === k) return V52W.mallSpr; const M = V52W.A.mall, W = Math.round(M.x1 - M.x0), H = Math.round(M.y1 - M.y0), P = V52W_PHI;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }, [day, g] = mk(), [nite, n] = mk();
  const roofH = Math.round(H/P), fH = H - roofH, dong = season === 'dong';
  g.fillStyle = '#8b9299'; g.fillRect(0, 0, W, roofH); g.fillStyle = dong ? '#f4f7f9' : '#d6dbe0'; g.fillRect(8, 8, W - 16, roofH - 12);
  g.fillStyle = 'rgba(0,0,0,.06)'; for(let x = 20; x < W - 20; x += 40) g.fillRect(x, 10, 2, roofH - 16);
  // skylight dome (golden ellipse) + HVAC boxes
  const dx = W/2, dy = roofH/2; g.fillStyle = '#5d7d99'; g.beginPath(); g.ellipse(dx, dy, W/P/P/P*1.4 + 6, roofH/P/P + 6, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#8fc3e8'; g.beginPath(); g.ellipse(dx, dy, W/P/P/P*1.4, roofH/P/P, 0, 0, Math.PI*2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; for(let i = -4; i <= 4; i++){ g.beginPath(); g.moveTo(dx + i*36, dy - roofH/P/P); g.lineTo(dx + i*36, dy + roofH/P/P); g.stroke(); } g.beginPath(); g.ellipse(dx, dy, W/P/P/P*.7, roofH/P/P/2, 0, 0, Math.PI*2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(dx - 60, dy - 30, 70, 18, -.2, 0, Math.PI*2); g.fill();
  [[70, 50], [150, 50], [W - 220, 60], [W - 120, 60], [90, roofH - 110], [W - 160, roofH - 100]].forEach(([x, y]) => { g.fillStyle = '#9ea7ad'; g.fillRect(x, y, 64, 44); g.fillStyle = '#7b858c'; g.fillRect(x + 6, y + 6, 22, 22); g.fillRect(x + 36, y + 6, 22, 22); g.fillStyle = '#b0b8bd'; g.fillRect(x, y, 64, 5); });
  g.fillStyle = '#2e7d32'; for(let i = 0; i < 9; i++){ g.beginPath(); g.arc(30 + i*20, roofH - 26, 9, 0, Math.PI*2); g.fill(); g.beginPath(); g.arc(W - 30 - i*20, roofH - 26, 9, 0, Math.PI*2); g.fill(); }   // roof garden edge
  // facade: three glass floors
  g.fillStyle = '#37474f'; g.fillRect(0, roofH, W, fH); const fl = (fH - 30)/3;
  for(let f = 0; f < 3; f++){ const y = roofH + 8 + f*fl; g.fillStyle = f % 2 ? '#4f86b0' : '#5a95c2'; g.fillRect(10, y, W - 20, fl - 8); g.fillStyle = 'rgba(255,255,255,.16)'; for(let x = 14; x < W - 20; x += 46){ g.fillRect(x, y, 2, fl - 8); } g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(10, y, W - 20, 4);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(40 + f*80, y + fl - 8); g.lineTo(120 + f*80, y); g.lineTo(170 + f*80, y); g.lineTo(90 + f*80, y + fl - 8); g.fill(); }
  // rainbow sign band (golden width W/φ)
  const sw = Math.round(W/P), sx = Math.round((W - sw)/2), sy = roofH - 6; g.fillStyle = '#263238'; g.fillRect(sx - 6, sy - 4, sw + 12, 40); ['#ef5350', '#ffa726', '#ffee58', '#66bb6a', '#42a5f5', '#7e57c2'].forEach((c, i) => { g.fillStyle = c; g.fillRect(sx + i*sw/6, sy, sw/6 + 1, 6); });
  g.font = "800 22px 'Be Vietnam Pro', Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('TTTM CẦU VỒNG · RAINBOW MALL', W/2, sy + 21);
  // entrance canopy (W/φ³) + glass doors
  const cw = Math.round(W/P**3), cx = Math.round((W - cw)/2); g.fillStyle = '#263238'; g.fillRect(cx - 10, H - 92, cw + 20, 18); g.fillStyle = '#ffca28'; g.fillRect(cx - 10, H - 76, cw + 20, 4);
  g.fillStyle = '#b3e5fc'; g.fillRect(cx + 14, H - 70, cw - 28, 70); g.fillStyle = '#455a64'; g.fillRect(W/2 - 2, H - 70, 4, 70); g.fillRect(cx + 14, H - 70, 4, 70); g.fillRect(cx + cw - 18, H - 70, 4, 70);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx + 24, H - 66, 16, 60);
  // banners + planters at the foot of the facade
  [[60, '#ef5350'], [W - 92, '#42a5f5']].forEach(([x, c]) => { g.fillStyle = c; g.fillRect(x, roofH + 30, 32, 120); g.fillStyle = '#fff'; g.font = "800 15px 'Be Vietnam Pro', sans-serif"; g.fillText('SALE', x + 16, roofH + 90); });
  // night: lit windows + glowing sign
  for(let f = 0; f < 3; f++){ const y = roofH + 8 + f*fl; for(let x = 14; x < W - 30; x += 46){ n.fillStyle = ((x*7 + f*13) % 5) ? 'rgba(255,236,170,.75)' : 'rgba(200,230,255,.7)'; n.fillRect(x + 3, y + 6, 40, fl - 20); } }
  n.fillStyle = 'rgba(255,255,255,.9)'; n.font = "800 22px 'Be Vietnam Pro', Nunito, sans-serif"; n.textAlign = 'center'; n.textBaseline = 'middle'; n.fillText('TTTM CẦU VỒNG · RAINBOW MALL', W/2, sy + 21);
  n.fillStyle = 'rgba(255,240,190,.85)'; n.fillRect(cx + 14, H - 70, cw - 28, 70); n.fillStyle = 'rgba(140,200,255,.55)'; n.beginPath(); n.ellipse(dx, dy, W/P/P/P*1.4, roofH/P/P, 0, 0, Math.PI*2); n.fill();
  return (V52W.mallSpr = {k, day, nite, W, H});
}
// ---------- vật động: gom theo khung, vẽ theo y ----------
function v52wSp(y, k, o){ const p = V52W.pool, i = V52W.sp.length; let s = p[i]; if(!s){ s = p[i] = {y:0, k:'', o:null}; } s.y = y; s.k = k; s.o = o; V52W.sp.push(s); }
function v52wIn(VBn, x0, y0, x1, y1){ return x1 > VBn.x0 && x0 < VBn.x1 && y1 > VBn.y0 && y0 < VBn.y1; }
function v52wCollect(VBn){
  V52W.sp.length = 0; V52W.spi = 0; if(!V52W.on || cam.z < .2 || !V52W.A) return; const A = V52W.A, M = A.mall, St = A.street;
  if(v52wIn(VBn, M.x0, M.y0, M.x1, M.y1 + 40)) v52wSp(M.y1, 'mall', M);
  V52W.houses.forEach(h => { if(v52wIn(VBn, h.x - 120, h.y - 220, h.x + 120, h.y + 40)) v52wSp(h.y, 'house', h); });
  if(v52wIn(VBn, St.x0 - 60, St.y0 - 80, St.x1 + 60, St.y1 + 60)){
    v52wSp(A.fountain.y + 4, 'fount', A.fountain); A.planters.forEach(p => { if(v52wIn(VBn, p.x - 40, p.y - 90, p.x + 40, p.y + 10)) v52wSp(p.y + 4, 'plant', p); });
    A.carts.forEach(c => v52wSp(c.y + 4, 'cart', c)); const wk = V52W_WEEKEND(); A.acts.forEach(a => { if(!a.wk || wk) v52wSp(a.y, 'act', a); });
    if(cam.z > .3){ const P = v52wPeds().street, n = wk ? 40 : 18, Lh = St.y1 - St.y0 - 40; for(let i = 0; i < n; i++){ const p = P[i]; let u = (p.o*Lh*2 + realT*p.sp) % (2*Lh), dir = 1; if(u > Lh){ u = 2*Lh - u; dir = -1; }
      p.x = St.x0 + 40 + p.lane*(St.x1 - St.x0 - 80); p.y = St.y0 + 20 + u; if(Math.hypot(p.x - A.fountain.x, p.y - A.fountain.y) < A.fountain.r + 22) p.x += p.x < A.fountain.x ? -(A.fountain.r - Math.abs(p.x - A.fountain.x) + 26) : (A.fountain.r - Math.abs(p.x - A.fountain.x) + 26); p.dir = dir; v52wSp(p.y, 'ped', p); } }
    if(v52wDark() > 0) v52wSp(1e8, 'bulbs', St); }
  const Vc = A.village; if(cam.z > .3 && v52wIn(VBn, Vc.x - 700, Vc.y - 600, Vc.x + 700, Vc.y + 600)){ const P = v52wPeds().village; P.forEach((p, i) => { const L = 900, u = (p.o*L*2 + realT*p.sp*.8) % (2*L), x = Vc.x - 450 + (u > L ? 2*L - u : u), y = Vc.y + (p.row - 1)*330 + 74; p.x = x; p.y = y + (i % 2 ? 8 : -6); p.dir = u > L ? -1 : 1; v52wSp(p.y, 'ped', p); });
    v52wSp(A.well.y + 6, 'well', A.well); v52wSp(A.banyan.y, 'banyan', A.banyan); }
  if(cam.z > .3) v52wPeds().farm.forEach((p, i) => { const f = V52W.fields[(i*7) % Math.max(1, V52W.fields.length)]; if(!f) return; p.x = f.x0 + 60 + (i*37 % 180); p.y = f.y0 + 60 + (i*23 % 80); p.farm = 1; if(v52wIn(VBn, p.x - 40, p.y - 40, p.x + 40, p.y + 10)) v52wSp(p.y, 'ped', p); });
  V52W.mills.forEach(m => { if(v52wIn(VBn, m.x - 120, m.y - 260, m.x + 120, m.y + 20)) v52wSp(m.y, 'mill', m); });
  const C = A.camp; if(v52wIn(VBn, C.x - 300, C.y - 300, C.x + 300, C.y + 200)){ V52W.tents.forEach(t => v52wSp(t.y, 'tent', t)); v52wSp(C.y + 22, 'fire', C); }
  if(v52wIn(VBn, A.peak.x - 120, A.peak.y - 200, A.peak.x + 120, A.peak.y + 40)) v52wSp(A.peak.y, 'peak', A.peak);
  if(v52wIn(VBn, A.guard[0] - 60, A.guard[1] - 160, A.guard[0] + 60, A.guard[1] + 20)) v52wSp(A.guard[1], 'guard', A.guard);
  if(v52wIn(VBn, A.dive[0] - 60, A.dive[1] - 80, A.dive[0] + 60, A.dive[1] + 40)) v52wSp(A.dive[1], 'buoy', A.dive);
  if(cam.z > .3) v52wPeds().beach.forEach((p, i) => { const u = V52W.umb[(i*5) % Math.max(1, V52W.umb.length)]; if(!u) return; p.x = u.x + 26 + (i % 3)*8; p.y = u.y + 18 + (i % 2)*10 + Math.sin(realT*.4 + i)*6; if(v52wIn(VBn, p.x - 30, p.y - 40, p.x + 30, p.y + 10)) v52wSp(p.y, 'ped', p); });
  if(cam.z < .55) v52wSp(1e8 + 1, 'labels', null);
  V52W.sp.sort((a, b) => a.y - b.y);
}
function v52wFlush(y){ const sp = V52W.sp; while(V52W.spi < sp.length && sp[V52W.spi].y <= y){ const s = sp[V52W.spi++]; try { v52wDrawSp(s); } catch(e){ if(!V52W.msg.sp){ V52W.msg.sp = 1; console.warn('v52w sprite', s.k, e); } } } }
function v52wDark(){ try { return lightLevel(); } catch(e){ return 0; } }
function v52wNightK(off){ return v25Ramp(clock, 1075 + (off % 30), 335 - (off % 20)); }
function v52wPerson(g, x, y, p, walk, extra){
  const t = walk ? realT*1.1 + p.ph : 0, st = walk ? Math.sin(t*9)*3 : 0; x = Math.round(x); y = Math.round(y); const d = p.dir || 1;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x - 6, y - 1, 12, 3);
  if(p.farm){ const b = Math.sin(realT*2 + p.ph)*2; g.fillStyle = '#5d4037'; g.fillRect(x - 4, y - 9, 3, 9); g.fillRect(x + 1, y - 9, 3, 9); g.fillStyle = p.c; g.fillRect(x - 6, y - 19 + b, 13, 10); g.fillStyle = p.skin; g.fillRect(x + d*5 - 3, y - 18 + b, 7, 7);
    g.fillStyle = '#e8c86a'; g.beginPath(); g.moveTo(x + d*5 - 9, y - 18 + b); g.lineTo(x + d*5 + 9, y - 18 + b); g.lineTo(x + d*5, y - 26 + b); g.fill(); return; }
  g.fillStyle = '#37474f'; g.fillRect(x - 4, y - 10 + Math.max(0, st), 3, 10 - Math.max(0, st)); g.fillRect(x + 1, y - 10 + Math.max(0, -st), 3, 10 - Math.max(0, -st));
  g.fillStyle = p.c; g.fillRect(x - 5, y - 22, 10, 13); g.fillStyle = p.skin; g.fillRect(x - 4, y - 30, 8, 8); g.fillStyle = p.hair; g.fillRect(x - 4, y - 31, 8, 3); g.fillRect(x + (d < 0 ? 2 : -4), y - 29, 2, 3);
}
function v52wDrawSp(s){
  const g = ctx, o = s.o, t = realT, se = S();
  switch(s.k){
    case 'mall': { const sp = v52wMallSpr(), lit = v52wNightK(7); g.drawImage(sp.day, Math.round(o.x0), Math.round(o.y0)); if(lit > 0){ const ga = g.globalAlpha; g.globalAlpha = lit; g.drawImage(sp.nite, Math.round(o.x0), Math.round(o.y0)); g.globalAlpha = ga; }
      const near = PLAYER && v52wNearMe(V52W.A.mallDoor[0], V52W.A.mallDoor[1], 70); if(near){ g.font = "800 16px 'Be Vietnam Pro', Nunito, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#ffd23f'; g.fillText('🛍️ Vào TTTM Cầu Vồng', o.cx, o.y1 + 40); g.textAlign = 'left'; } break; }
    case 'house': { const lit = v48mNightK(o.i + 3); v48mDrawHouse(g, o.st, o.a, o.col, false, o.x, o.y, o.flip, lit); if(PLAYER && v52wNearMe(o.x, o.y + 10, 60)){ g.font = "700 15px 'Be Vietnam Pro', Nunito, sans-serif"; g.textAlign = 'center'; const tw = g.measureText(o.name).width + 14; g.fillStyle = '#ffd23f'; g.fillRect(o.x - tw/2, o.y - o.F.gy + o.F.top - 24, tw, 20); g.fillStyle = '#1a1206'; g.fillText(o.name, o.x, o.y - o.F.gy + o.F.top - 9); g.textAlign = 'left'; } break; }
    case 'fount': { const x = o.x, y = o.y, n = (RM.matches ? 6 : 14); g.fillStyle = '#eceff1'; g.fillRect(x - 6, y - 40, 12, 40); g.fillStyle = '#cfd8dc'; g.fillRect(x - 16, y - 46, 32, 8);
      if(season !== 'dong' || weather !== 'baotuyet'){ g.fillStyle = 'rgba(225,245,255,.85)'; for(let i = 0; i < n; i++){ const a = i/n*Math.PI*2, ph = ((t*.9 + i*.13) % 1), r = 8 + ph*(o.r - 26), h = Math.sin(ph*Math.PI)*58; g.fillRect(Math.round(x + Math.cos(a)*r) - 2, Math.round(y - 46 - h + Math.sin(a)*r*.45 + 46*ph) - 2, 4, 4); }
        g.fillStyle = 'rgba(255,255,255,.7)'; const h2 = 40 + Math.sin(t*3)*6; g.fillRect(x - 3, y - 46 - h2, 6, h2); g.fillRect(x - 7, y - 50 - h2, 14, 6); }
      break; }
    case 'plant': { const x = o.x, y = o.y; v46Tree(g, {x, y:y - 6, k:2, s:1.05, c:.4}, se); if(season === 'ha' || season === 'xuan'){ g.fillStyle = '#ef5350'; for(let k = 0; k < 6; k++) g.fillRect(x - 12 + (k*9) % 26, y - 26 - (k*7) % 14, 4, 4); } break; }
    case 'cart': { const x = o.x, y = o.y; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - 34, y - 2, 68, 6); g.fillStyle = '#795548'; g.fillRect(x - 30, y - 30, 60, 26); g.fillStyle = '#a1887f'; g.fillRect(x - 30, y - 30, 60, 5);
      g.fillStyle = '#424242'; g.beginPath(); g.arc(x - 20, y - 2, 6, 0, Math.PI*2); g.arc(x + 20, y - 2, 6, 0, Math.PI*2); g.fill(); g.fillStyle = '#5d4037'; g.fillRect(x - 28, y - 64, 3, 36); g.fillRect(x + 25, y - 64, 3, 36);
      for(let k = 0; k < 6; k++){ g.fillStyle = k % 2 ? '#fff8e1' : '#ef5350'; g.fillRect(x - 34 + k*11.4, y - 72, 12, 10); }
      g.font = '20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.fillText(o.ic, x, y - 34); g.textAlign = 'left';
      v52wPerson(g, x + 40, y - 4, {c:'#ffffff', skin:'#eab98c', hair:'#1a1a1a', dir:-1, ph:0}, false); break; }
    case 'act': v52wAct(g, o, t); break;
    case 'ped': v52wPerson(g, o.x, o.y, o, !o.farm); break;
    case 'bulbs': { const k = v52wDark(); if(k <= 0) break; const L = o.lights; for(let i = 0; i + 3 < L.length; i += 2){ const a = L[i], b = L[i + 3]; g.strokeStyle = 'rgba(60,50,40,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(a[0], a[1] - 60); g.quadraticCurveTo((a[0] + b[0])/2, (a[1] + b[1])/2 - 34, b[0], b[1] - 60); g.stroke();
        for(let j = 1; j < 8; j++){ const u = j/8, x = a[0] + (b[0] - a[0])*u, y = a[1] - 60 + (b[1] - a[1])*u + Math.sin(u*Math.PI)*26 - 0; const c = ['#ffd54f', '#ff8a65', '#81d4fa', '#aed581', '#f48fb1'][(i + j) % 5], fl = .7 + .3*Math.sin(t*3 + i + j*1.7); g.globalAlpha = Math.min(1, k*1.6)*fl; g.fillStyle = c; g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); } }
      g.globalAlpha = 1; L.forEach(p => { g.fillStyle = '#4e342e'; g.fillRect(p[0] - 2, p[1] - 62, 4, 62); }); break; }
    case 'well': { const x = o.x, y = o.y; g.fillStyle = '#9e9e9e'; g.beginPath(); g.ellipse(x, y - 6, 26, 12, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#37474f'; g.beginPath(); g.ellipse(x, y - 8, 17, 7, 0, 0, Math.PI*2); g.fill();
      g.fillStyle = '#6d4c2e'; g.fillRect(x - 24, y - 52, 4, 46); g.fillRect(x + 20, y - 52, 4, 46); g.fillStyle = '#8d3b2a'; g.beginPath(); g.moveTo(x - 32, y - 50); g.lineTo(x + 32, y - 50); g.lineTo(x, y - 70); g.fill(); break; }
    case 'banyan': { const x = o.x, y = o.y, dong = season === 'dong'; g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(x, y + 2, 90, 22, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#5d4037'; g.fillRect(x - 12, y - 60, 24, 60); g.fillRect(x - 30, y - 30, 6, 30); g.fillRect(x + 26, y - 34, 5, 34);
      g.fillStyle = dong ? '#e1e8ec' : '#2e6b34'; g.beginPath(); g.arc(x - 40, y - 82, 44, 0, Math.PI*2); g.arc(x + 40, y - 82, 44, 0, Math.PI*2); g.arc(x, y - 108, 52, 0, Math.PI*2); g.fill(); g.fillStyle = dong ? '#f6f9fb' : '#3f8a44'; g.beginPath(); g.arc(x - 20, y - 112, 26, 0, Math.PI*2); g.arc(x + 30, y - 96, 22, 0, Math.PI*2); g.fill(); break; }
    case 'mill': { const x = o.x, y = o.y; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - 26, y - 2, 52, 6); g.fillStyle = '#eceff1'; g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x + 22, y); g.lineTo(x + 12, y - 150); g.lineTo(x - 12, y - 150); g.fill(); g.fillStyle = '#b0bec5'; g.fillRect(x - 6, y - 30, 12, 30);
      const w = WEATHERS[weather], sp = .6 + (w && w.wind ? w.wind*2 : 0), a0 = RM.matches ? 0 : t*sp; g.save(); g.translate(x, y - 150); g.rotate(a0); g.fillStyle = '#fafafa'; for(let k = 0; k < 3; k++){ g.rotate(Math.PI*2/3); g.fillRect(-4, -96, 8, 92); g.fillStyle = '#e0e0e0'; g.fillRect(4, -92, 16, 70); g.fillStyle = '#fafafa'; } g.restore(); g.fillStyle = '#90a4ae'; g.beginPath(); g.arc(x, y - 150, 8, 0, Math.PI*2); g.fill(); break; }
    case 'tent': { const x = o.x, y = o.y; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - 46, y - 2, 92, 6); g.fillStyle = o.c; g.beginPath(); g.moveTo(x - 44, y); g.lineTo(x + 44, y); g.lineTo(x, y - 62); g.fill(); g.fillStyle = shade(o.c, -.3); g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x + 10, y); g.lineTo(x, y - 40); g.fill(); break; }
    case 'fire': { const x = o.x, y = o.y; g.fillStyle = '#5d4037'; g.fillRect(x - 14, y - 4, 28, 6); const n = RM.matches ? 3 : 6; for(let k = 0; k < n; k++){ const h = 14 + Math.abs(Math.sin(t*7 + k*1.3))*16; g.fillStyle = k % 2 ? '#ff7043' : '#ffca28'; g.fillRect(x - 10 + k*4, y - 4 - h, 5, h); }
      g.fillStyle = 'rgba(255,255,255,.25)'; for(let k = 0; k < 3; k++){ const u = (t*.5 + k/3) % 1; g.fillRect(x - 4 + Math.sin(u*9)*6, y - 40 - u*60, 5, 5); } break; }
    case 'peak': { const x = o.x, y = o.y; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - 50, y - 2, 100, 8); g.fillStyle = '#6d4c2e'; [-40, 36].forEach(d => g.fillRect(x + d, y - 70, 6, 70)); g.fillStyle = '#a0522d'; g.beginPath(); g.moveTo(x - 60, y - 66); g.lineTo(x + 62, y - 66); g.lineTo(x, y - 112); g.fill();
      g.fillStyle = '#8d6e4a'; g.fillRect(x - 46, y - 24, 94, 8); g.fillStyle = '#ef5350'; g.fillRect(x + 54, y - 150, 30, 18); g.fillStyle = '#5d4037'; g.fillRect(x + 52, y - 150, 3, 80); break; }
    case 'guard': { const x = o[0], y = o[1]; g.fillStyle = '#fff'; g.fillRect(x - 22, y - 90, 4, 90); g.fillRect(x + 18, y - 90, 4, 90); g.fillStyle = '#ef5350'; g.fillRect(x - 28, y - 112, 56, 26); g.fillStyle = '#fff'; g.fillRect(x - 6, y - 106, 12, 14); g.fillRect(x - 12, y - 100, 24, 3);
      g.fillStyle = '#ffca28'; g.fillRect(x - 32, y - 120, 64, 8); break; }
    case 'buoy': { const x = o[0], y = o[1] + Math.sin(t*1.6)*3; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 20, y + 4, 40, 3); g.fillStyle = '#ff7043'; g.beginPath(); g.arc(x, y - 4, 12, 0, Math.PI*2); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 12, y - 6, 24, 4);
      g.fillStyle = '#5d4037'; g.fillRect(x - 1, y - 46, 3, 40); g.fillStyle = '#e53935'; g.fillRect(x + 2, y - 46, 26, 18); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + 2, y - 46); g.lineTo(x + 28, y - 28); g.lineTo(x + 24, y - 28); g.lineTo(x + 2, y - 42); g.fill(); break; }
    case 'labels': { const A = V52W.A, L = [[A.mall.cx, A.mall.y0 - 60, '🛍️ TTTM Cầu Vồng'], [A.street.cx, A.street.y0 + 500, '🚶 Phố đi bộ Hoa Phượng'], [A.village.x, A.village.y - 520, '🏡 Làng Gió Xanh'], [A.camp.x, A.camp.y - 260, '🏕️ Rừng Thông Reo'], [A.peak.x, A.peak.y - 520, '⛰️ Đồi Mây'], [A.guard[0], A.guard[1] - 260, '🏖️ Bãi Cát Vàng']];
      const fl = V52W_L.flowers, F = v52wP(fl.a, fl.r - 520), rv = V52W.river[45]; L.push([F[0], F[1], '🌷 Cánh đồng hoa Gió'], [rv[0], rv[1], '🏞️ Sông Bạc']); const f0 = V52W.fields[0]; if(f0) L.push([f0.x0 + 150, f0.y0 - 60, '🌾 Đồng lúa Vàng']);
      const fs = Math.round(Math.min(64, 15/cam.z)); g.font = `800 ${fs}px 'Be Vietnam Pro', Nunito, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      L.forEach(([x, y, n]) => { const w = g.measureText(n).width + fs; g.fillStyle = 'rgba(10,15,34,.72)'; g.fillRect(x - w/2, y - fs*.75, w, fs*1.5); g.fillStyle = '#fff'; g.fillText(n, x, y); }); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; break; }
  }
}
function v52wAct(g, o, t){
  const x = o.x, y = o.y, p = {c:{guitar:'#7e57c2', juggle:'#ef6c00', paint:'#26a69a', mime:'#212121', violin:'#c62828'}[o.k], skin:'#f5d1ad', hair:'#3a2418', dir:-1, ph:0};
  // listeners (more on weekends)
  const nl = V52W_WEEKEND() ? 5 : 2; for(let k = 0; k < nl; k++){ const a = Math.PI*.15 + k*.55; v52wPerson(g, x + Math.cos(a)*70, y + 20 + Math.sin(a)*22, {c:V52W_PEDC[(k*3 + o.y) % 10 | 0] || '#1e88e5', skin:['#f5d1ad', '#eab98c', '#c98e60'][k % 3], hair:'#1a1a1a', dir:-1, ph:k}, false); }
  v52wPerson(g, x, y, p, false);
  if(o.k === 'guitar'){ g.fillStyle = '#8d6e4a'; g.beginPath(); g.ellipse(x - 2, y - 12, 8, 6, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#5d4037'; g.fillRect(x + 4, y - 22, 14, 3); }
  if(o.k === 'violin'){ g.fillStyle = '#8d3b2a'; g.fillRect(x - 10, y - 24, 9, 6); g.fillStyle = '#d7ccc8'; g.save(); g.translate(x - 2, y - 26); g.rotate(Math.sin(t*6)*.5); g.fillRect(0, -1, 22, 2); g.restore(); }
  if(o.k === 'juggle'){ for(let k = 0; k < 3; k++){ const a = t*4 + k*2.1; g.fillStyle = ['#ef5350', '#ffee58', '#42a5f5'][k]; g.fillRect(Math.round(x + Math.cos(a)*12) - 3, Math.round(y - 46 - Math.abs(Math.sin(a))*20) - 3, 6, 6); } }
  if(o.k === 'paint'){ g.fillStyle = '#6d4c2e'; g.fillRect(x - 40, y - 46, 3, 46); g.fillRect(x - 24, y - 46, 3, 46); g.fillStyle = '#fff8e1'; g.fillRect(x - 46, y - 60, 30, 26); g.fillStyle = '#ffb74d'; g.fillRect(x - 40, y - 54, 10, 8); g.fillStyle = '#4fc3f7'; g.fillRect(x - 32, y - 46, 12, 6); }
  if(o.k === 'mime'){ g.fillStyle = '#fff'; g.fillRect(x - 4, y - 30, 8, 8); g.fillStyle = '#212121'; g.fillRect(x - 5, y - 33, 10, 3); const w = Math.sin(t*2)*6; g.fillStyle = '#fff'; g.fillRect(x + 6, y - 26 + w, 4, 4); g.fillRect(x - 10, y - 26 - w, 4, 4); }
  if(o.k !== 'paint' && o.k !== 'mime' && !RM.matches){ g.font = "700 16px 'Be Vietnam Pro', sans-serif"; g.fillStyle = 'rgba(255,255,255,.9)'; for(let k = 0; k < 2; k++){ const u = (t*.6 + k*.5) % 1; g.globalAlpha = 1 - u; g.fillText(k ? '♫' : '♪', x + 10 + Math.sin(u*6)*8, y - 40 - u*40); } g.globalAlpha = 1; }
  g.fillStyle = '#5d4037'; g.fillRect(x + 14, y - 6, 18, 8); g.fillStyle = '#ffd23f'; g.fillRect(x + 18, y - 5, 4, 3);
}
function v52wNearMe(x, y, r){ if(!PLAYER || !PLAYER.visible) return false; const p = v46Pos(PLAYER); return Math.hypot(p[0] - x, p[1] - y) < r; }

// ---------- cửa / tương tác (điểm tính theo toạ độ thô: x + V46E) ----------
function v52wMoney(n, why){ if(!PROF){ try { openLogin(); } catch(e){} return false; } if(PROF.money < n){ toast(`💸 Cần $${n} (bạn có $${PROF.money}).`); return false; } PROF.money -= n; try { saveProfile(); renderProfHud(); } catch(e){} return true; }
function v52wDoors(){
  const A = V52W.A, D = [], E = V46E, add = (x, y, n, f) => D.push({x:x + E, y, n, f});
  add(A.mallDoor[0], A.mallDoor[1] + 8, 'TTTM Cầu Vồng · 3 tầng mua sắm', () => { if(typeof v52wMallOpen === 'function') v52wMallOpen(); });
  V52W.houses.forEach(h => add(h.x, h.y + 14, h.name + ' · vào nhà', () => { if(typeof v52wVillageHouse === 'function') v52wVillageHouse(h); }));
  A.carts.forEach(c => add(c.x, c.y + 26, `${c.ic} ${c.n} · $${c.p}`, () => { if(!v52wMoney(c.p)) return; reward(4, 0, null, true); toast(`${c.ic} Ngon quá! Bạn mua ${c.n.toLowerCase()} ($${c.p}).`); try { blipSfx(1300); } catch(e){} }));
  A.acts.forEach(a => add(a.x, a.y + 30, `${a.n} · tặng $1`, () => { if(a.wk && !V52W_WEEKEND()){ toast('🎭 Nghệ sĩ này chỉ biểu diễn vào cuối tuần (Thứ 7, Chủ nhật).'); return; } if(!v52wMoney(1)) return; activity('v52act' + a.k, 6); toast({guitar:'🎸 Đàn guitar có 6 dây. Dây càng ngắn, nốt càng cao!', violin:'🎻 Violin có 4 dây, kéo vĩ làm dây rung tạo ra âm thanh.', juggle:'🤹 Tung 3 quả bóng: luôn ném quả mới khi quả cũ lên tới đỉnh.', paint:'🎨 Ba màu cơ bản: đỏ, vàng, lam. Trộn chúng ra mọi màu khác!', mime:'🤐 Kịch câm kể chuyện chỉ bằng cử chỉ và nét mặt.'}[a.k] || '👏 Cảm ơn bạn!'); }));
  add(A.fountain.x, A.fountain.y + A.fountain.r + 22, 'Đài phun nước · thả xu ước ($1)', () => { if(!v52wMoney(1)) return; activity('v52wish', 5); toast('⛲ Bạn thả một đồng xu và ước điều tốt lành. Đài phun nước dùng bơm để đẩy nước lên rồi rơi xuống theo đường cong parabol!'); });
  add(A.camp.x, A.camp.y + 54, 'Lửa trại · ngồi nghỉ', () => { activity('v52camp', 8); toast('🏕️ Ngồi bên lửa trại thật ấm. Mẹo cắm trại: dựng lều ở chỗ cao, xa suối và luôn dập tắt lửa trước khi ngủ.'); });
  add(A.peak.x, A.peak.y + 20, 'Đỉnh Đồi Mây · ngắm cảnh', () => { activity('v52peak', 10); toast('⛰️ Lên tới đỉnh Đồi Mây! Càng lên cao, không khí càng loãng và mát hơn. Leo núi nhớ mang nước và đi giày bám tốt.'); try { cam.z = Math.max(.25, cam.z*.6); clampCam(); } catch(e){} });
  add(A.diveShore[0], A.diveShore[1], 'Điểm lặn biển · ngắm san hô', () => { activity('v52wdive', 10); toast('🤿 Lặn biển: luôn lặn cùng bạn, cân bằng tai khi xuống sâu, không chạm vào san hô vì san hô là sinh vật sống!'); });
  add(A.guard[0], A.guard[1] + 16, 'Chòi cứu hộ · an toàn bơi', () => toast('🛟 Chỉ bơi ở nơi có cờ xanh và người cứu hộ. Cờ đỏ nghĩa là sóng lớn, không xuống nước nhé!'));
  add(A.well.x, A.well.y + 30, 'Giếng làng', () => { activity('v52well', 4); toast('🪣 Giếng làng lấy nước ngầm dưới đất. Nước mưa thấm qua đất đá nên được lọc sạch dần.'); });
  V52W.mills.forEach((m, i) => add(m.x, m.y + 26, 'Cối xay gió', () => { activity('v52mill' + i, 5); toast('🌬️ Cối xay gió biến sức gió thành chuyển động quay. Ngày nay tua-bin gió tạo ra điện sạch!'); }));
  if(V52W.fields[0]){ const f = V52W.fields[0]; add(f.x0 + 150, f.y1 + 18, 'Đồng lúa · hỏi bác nông dân', () => { activity('v52rice', 5); toast({xuan:'🌱 Mùa xuân cấy lúa: mạ non cắm xuống ruộng ngập nước.', ha:'🌾 Mùa hè lúa lớn, cần nhiều nước và nắng.', thu:'🌾 Mùa thu lúa chín vàng, bà con gặt lúa về phơi.', dong:'🪵 Mùa đông ruộng nghỉ, cày ải để đất tơi xốp cho vụ sau.'}[season] || '🌾 Hạt gạo làm ra từ cây lúa.'); }); }
  const rv = V52W.river[60]; if(rv) add(rv[0] + 70, rv[1], 'Sông Bạc · bờ sông', () => toast('🏞️ Sông chảy từ chỗ cao xuống chỗ thấp và đổ ra biển. Nước sông là nước ngọt, nước biển là nước mặn.'));
  V52W.doors = D;
}
// ---------- đèn đêm ----------
function v52wLights(){
  const A = V52W.A, E = V46E, k = v52wDark(); if(k <= 0) return; const on = v52wNightK(5), V = V46.VBn || VB;
  if(on > 0){ const S0 = A.street; if(S0.x1 > V.x0 - 200 && S0.x0 < V.x1 + 200 && S0.y1 > V.y0 - 200 && S0.y0 < V.y1 + 200) S0.lights.forEach((p, i) => { if(i % 3 === 0) v25Push(p[0] + E, p[1] - 60, 70, on, 4); });
    const M = A.mall; if(M.x1 > V.x0 && M.x0 < V.x1 && M.y1 > V.y0 - 200 && M.y0 < V.y1 + 200){ v25Push(M.cx + E, M.y1 - 30, 170, on, 4); [.2, .8].forEach(f => v25Push(M.x0 + (M.x1 - M.x0)*f + E, M.y1 - 120, 110, on*.8, 2)); }
    V52W.houses.forEach(h => { const l = v48mNightK(h.i + 3); if(l > 0) v25Push(h.x + E, h.y - 50, 52, l, 4); });
    v25Push(A.peak.x + E, A.peak.y - 60, 60, on, 4); }
  v25Push(A.camp.x + E, A.camp.y + 10, 120*(1 + .06*Math.sin(realT*9)), Math.min(1, k*1.8), 4);
}
// bulbs glow on top of the night tint (string lights over the street, mall sign, village windows stay from the sprites)
function v52wGlow(VBn){
  const k = v52wDark(), on = v52wNightK(5); if(k <= .05 || on <= 0 || cam.z < .25) return; const S0 = V52W.A.street, L = S0.lights, g = ctx, t = realT;
  if(S0.x1 < VBn.x0 || S0.x0 > VBn.x1 || S0.y1 < VBn.y0 - 100 || S0.y0 > VBn.y1 + 100) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for(let i = 0; i + 3 < L.length; i += 2){ const a = L[i], b = L[i + 3]; if(Math.max(a[1], b[1]) < VBn.y0 - 80 || Math.min(a[1], b[1]) > VBn.y1 + 80) continue;
    for(let j = 1; j < 8; j++){ const u = j/8, x = Math.round(a[0] + (b[0] - a[0])*u), y = Math.round(a[1] - 60 + (b[1] - a[1])*u + Math.sin(u*Math.PI)*26), fl = .65 + .35*Math.sin(t*3 + i + j*1.7);
      g.globalAlpha = Math.min(1, k*1.4)*on*fl*.3; g.fillStyle = ['#ffd54f', '#ff8a65', '#81d4fa', '#aed581', '#f48fb1'][(i + j) % 5]; g.fillRect(x - 5, y - 5, 10, 10); g.globalAlpha = Math.min(1, k*1.4)*on*fl; g.fillRect(x - 3, y - 3, 6, 6); } }
  g.restore();
}
// ---------- bản đồ lớn: thêm địa điểm vùng mới ----------
function v52wPlaces(){
  const A = V52W.A, E = V46E, P = [], add = (k, name, x, y, ic, desc, cat, dx, dy) => P.push({k:'v52' + k, name, x, y, ox:(dx || x) + E, oy:dy || y, door:[(dx || x) + E, (dy || y)], ic, desc, cat, r:true});
  add('mall', 'TTTM Cầu Vồng', A.mall.cx, A.mall.y0 + 300, '🛍️', 'Điện máy, thời trang, đồ chơi, sách, rạp phim, ẩm thực', 'shop', A.mallDoor[0], A.mallDoor[1] + 10);
  add('street', 'Phố đi bộ Hoa Phượng', A.street.cx, A.street.y0 + 700, '🚶', 'Đài phun nước, nghệ sĩ đường phố, xe đẩy đồ ăn', 'shop', A.street.cx - 120, A.street.y1 - 30);
  add('village', 'Làng Gió Xanh', A.village.x, A.village.y, '🏡', 'Nhà dân mở cửa đón khách, giếng làng, cây đa', 'home', A.village.x, A.village.y + 404);
  if(V52W.fields[0]){ const f = V52W.fields[0]; add('rice', 'Đồng lúa Vàng', f.x0 + 150, f.y0 + 92, '🌾', 'Ruộng lúa đổi màu theo mùa', 'nature', f.x0 + 150, f.y1 + 20); }
  const rv = V52W.river[60]; if(rv) add('river', 'Sông Bạc', rv[0], rv[1], '🏞️', 'Dòng sông uốn khúc ra biển', 'water', rv[0] + 70, rv[1]);
  add('camp', 'Rừng Thông Reo · cắm trại', A.camp.x, A.camp.y, '🏕️', 'Lều trại, lửa trại giữa rừng thông', 'nature', A.camp.x, A.camp.y + 90);
  add('hill', 'Đồi Mây · leo núi', A.peak.x, A.peak.y, '⛰️', 'Đường mòn xoắn ốc lên đỉnh đồi', 'nature', A.peak.x, A.peak.y + 20);
  add('beach', 'Bãi Cát Vàng · lặn biển', A.guard[0], A.guard[1], '🏖️', 'Ô dù, chòi cứu hộ, điểm lặn ngắm san hô', 'water', A.diveShore[0], A.diveShore[1]);
  const fl = V52W_L.flowers, F = v52wP(fl.a, fl.r); add('flowers', 'Cánh đồng hoa Gió', F[0], F[1], '🌷', 'Hoa đổi màu theo mùa, cối xay gió', 'nature', V52W.mills[0] ? V52W.mills[0].x : F[0], V52W.mills[0] ? V52W.mills[0].y + 30 : F[1]);
  V52W.bridges.slice(0, 2).forEach((b, i) => { const p = b.P[Math.floor(b.P.length*.4)]; add('br' + i, b.name, p[0], p[1], '🌉', 'Cầu nối đảo với đất liền', 'world'); });
  V52W.places = P; return P;
}
// ---------- init (gọi từ extFinalInit, sau v50Init) ----------
function v52wInit(){
  if(typeof V46 === 'undefined' || !V46.ready) return;
  V52W.on = true; V52W.isle = null; v52wBuild(); v52wDecoTrim(); v52wDoors(); v52wPlaces();
  V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; V46RC.clear(); if(typeof MAP !== 'undefined') MAP.places46 = null;
  V46T.lamps = (V46T.lamps || []).concat(V52W.lamps);
  // static paint: island as before (without my lines), then the mainland + my roads and bridges on top
  const p0 = v46Paint; v46Paint = function(g, x0, y0, w, h, lod){ const keep = V46R.lines; if(V52W.on && V52W.isle) V46R.lines = V52W.isle; try { p0(g, x0, y0, w, h, lod); } finally { V46R.lines = keep; } if(V52W.on) try { v52wPaint(g, x0, y0, w, h, lod); } catch(e){ if(!V52W.msg.paint){ V52W.msg.paint = 1; console.warn('v52w paint', e); } } };
  // dynamic layer sorted with people
  const dg0 = v46DrawGround; v46DrawGround = function(VBn){ dg0(VBn); try { v52wCollect(VBn); } catch(e){ V52W.sp.length = 0; } };
  const dr0 = v46DrawRaw; v46DrawRaw = function(a){ if(V52W.spi < V52W.sp.length){ const p = v46Pos(a); v52wFlush(p[1]); } return dr0(a); };
  const ww0 = v47wWorld; v47wWorld = function(VBn){ v52wFlush(1e9); return ww0(VBn); };
  // island roads rebuilt (map arrange) → rebuild my lands on top of the new island layout
  const rd0 = v46Roads; v46Roads = function(){ rd0(); V52W.isle = null; if(V52W.on){ try { v52wBuild(); v52wDoors(); v52wPlaces(); } catch(e){ console.warn('v52w rebuild', e); } } };
  const de0 = v46Deco; v46Deco = function(){ de0(); if(V52W.on){ v52wDecoTrim(); V46T.lamps = (V46T.lamps || []).concat(V52W.lamps); } };
  // doors, lights, map places
  const d36 = v36Doors; v36Doors = function(d){ d36(d); if(V52W.on && !V46.sky) V52W.doors.forEach(x => d.push(x)); };
  const lt0 = v46Lighting; v46Lighting = function(VBn){ lt0(VBn); if(V52W.on && V52W.A) try { v52wGlow(VBn); } catch(e){} };
  const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); if(V52W.on && V46.on && !V46.sky) try { v52wLights(); } catch(e){} };
  const mp0 = mapPlaces; mapPlaces = function(){ const P = mp0(); if(V46.on && V52W.on && P && !P.v52w){ V52W.places.forEach(p => P.push(p)); P.v52w = 1; } return P; };
  // boats stay in the channel between the island and the mainland
  const sea0 = v47wSea; v47wSea = function(x, y){ if(!sea0(x, y)) return false; if(!V52W.on) return true; const [r, a] = v52wPolar(x, y); return r < v52wRin(a) - 40; };
  // pedestrian street: no bikes
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){ const ok = cm0(ox, oy, nx, ny); if(!ok || !V52W.on || !PLAYER || !PLAYER.cycling || !v46Raw(nx)) return ok;
    if(Math.abs(PLAYER.x - ox) > 2 || Math.abs(PLAYER.y - oy) > 2) return ok;
    if(v52wInStreet(nx - V46E, ny) && !v52wInStreet(ox - V46E, oy)){ const now = performance.now(); if(now - (V52W.msg.bike || 0) > 4000){ V52W.msg.bike = now; toast('🚶 Phố đi bộ: dắt xe nhé! Bấm "Đạp xe" để xuống xe rồi đi bộ vào phố.'); } return false; } return ok; };
  try { v52wsInit(); } catch(e){ console.warn('v52w scene', e); } try { v52wDevInit(); } catch(e){ console.warn('v52w dev', e); }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v52w = {V52W, V52W_L, v52wPolar, v52wMainWalk, v52wRin, v52wRout};
}
function v52wDecoTrim(){ if(!V52W.bridges.length || !V46T.deco) return; V46T.deco = V46T.deco.filter(t => { if(t.k === 9) return true; for(const b of V52W.bridges){ if(t.x < b.bx0 - 60 || t.x > b.bx1 + 60 || t.y < b.by0 - 60 || t.y > b.by1 + 80) continue; const P = b.P; for(let i = 1; i < P.length; i++) if(v52wSegD(t.x, t.y, P[i - 1][0], P[i - 1][1], P[i][0], P[i][1]) < 64) return false; } return true; });
  if(V46T.lamps) V46T.lamps = V46T.lamps.filter(([x, y]) => !V52W.bridges.some(b => b.P.some(p => Math.hypot(p[0] - x, p[1] - y) < 40 && Math.hypot(p[0] - V46L.CX, p[1] - V46L.CY) > V46L.ISLAND - 200))); }
