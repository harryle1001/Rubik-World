// ================= v70f · CẢM GIÁC & KHÔNG KHÍ 2/4: ánh sáng & hiệu ứng thế giới =================
// Bọc v46Lighting (đảo tròn, góc nhìn trên xuống): TRƯỚC lớp tối → vũng nước mưa, lấp lánh mặt biển, bụi, gợn nước (bị tối theo đêm);
// SAU lớp tối → quầng sáng ấm Cây thần kỳ / Tháp Rubik 81 (giữ thiết kế tháp), tia nắng sớm, nắng vàng chiều, tia chớp xa, pháo hoa ngày lễ, lá/hoa/tuyết bay gần, viền tối đêm.
// Bóng đổ mềm theo giờ: bọc v53vDrawPerson (vẽ bóng dài trước khi vẽ người). Hạt dùng mảng cấp sẵn (không tạo đối tượng mỗi khung).
const V70F_N = 360;
const V70F_P = {x:new Float32Array(V70F_N), y:new Float32Array(V70F_N), vx:new Float32Array(V70F_N), vy:new Float32Array(V70F_N), t:new Float32Array(V70F_N), T:new Float32Array(V70F_N),
  s:new Float32Array(V70F_N), k:new Uint8Array(V70F_N), c:new Uint8Array(V70F_N), i:0};
const V70F_COL = ['#e9dcb4', '#cfc6b6', '#c7d79a', '#ffffff', '#ffd23f', '#ff6b6b', '#7fd0ff', '#9dff8a', '#ffb3e6', '#ffffff', '#b98a5e'];
const V70F_X = {spr:{}, ppx:null, ppy:null, dustT:0, ripT:0, lt:{a:0, next:6, x:.5, bolt:null, boom:0}, fw:{next:1.5, on:false}, near:[], nearOn:-1, sunK:0, t:0};
const V70F_RAIN = new Set(['mua', 'muaphun', 'bao', 'loc', 'sieubao', 'samset', 'muada']);
const V70F_STORM = new Set(['bao', 'loc', 'sieubao', 'samset', 'muada']);
const v70fH = (i, j) => { const h = Math.sin(i*127.1 + j*311.7)*43758.5453; return h - Math.floor(h); };

function v70fAdd(k, x, y, vx, vy, life, s, c){ const P = V70F_P, i = P.i; P.i = (i + 1) % V70F_N; P.k[i] = k; P.x[i] = x; P.y[i] = y; P.vx[i] = vx; P.vy[i] = vy; P.t[i] = life; P.T[i] = life; P.s[i] = s; P.c[i] = c; }
function v70fMk(w, h, f){ const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; }
function v70fSpr(){
  const S = V70F_X.spr; if(S.glow) return S;
  const rad = (r, g, b, a) => v70fMk(128, 128, x => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${r},${g},${b},${a})`); gr.addColorStop(.38, `rgba(${r},${g},${b},${a*.45})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); });
  S.glow = rad(255, 196, 110, 1); S.cool = rad(170, 210, 255, 1); S.gold = rad(255, 228, 140, 1); S.white = rad(255, 255, 255, 1);
  S.ray = v70fMk(64, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,240,200,.55)'); g.addColorStop(.6, 'rgba(255,236,190,.18)'); g.addColorStop(1, 'rgba(255,236,190,0)'); x.fillStyle = g;
    const gx = x.createLinearGradient(0, 0, w, 0); x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.5, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gx; x.fillRect(0, 0, w, h); });
  S.vig = v70fMk(256, 256, x => { const g = x.createRadialGradient(128, 128, 60, 128, 128, 182); g.addColorStop(0, 'rgba(6,8,26,0)'); g.addColorStop(1, 'rgba(6,8,26,1)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
  S.leaf = ['#e0832d', '#c9502a', '#f2b33d'].map(c => v70fMk(14, 10, x => { x.fillStyle = c; x.beginPath(); x.ellipse(7, 5, 6, 3.4, .5, 0, Math.PI*2); x.fill(); x.strokeStyle = 'rgba(80,30,10,.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(2, 8); x.lineTo(12, 2); x.stroke(); }));
  S.petal = ['#ffc4dd', '#ff9ac2', '#fff0f6'].map(c => v70fMk(12, 10, x => { x.fillStyle = c; x.beginPath(); x.ellipse(6, 5, 5, 3, .3, 0, Math.PI*2); x.fill(); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(4, 3, 2, 2); }));
  S.flake = [v70fMk(12, 12, x => { x.strokeStyle = '#fff'; x.lineWidth = 1.4; for(let k = 0; k < 3; k++){ const a = k*Math.PI/3; x.beginPath(); x.moveTo(6 - Math.cos(a)*5, 6 - Math.sin(a)*5); x.lineTo(6 + Math.cos(a)*5, 6 + Math.sin(a)*5); x.stroke(); } })];
  S.mote = [v70fMk(8, 8, x => { const g = x.createRadialGradient(4, 4, 0, 4, 4, 4); g.addColorStop(0, 'rgba(255,250,210,.95)'); g.addColorStop(1, 'rgba(255,250,210,0)'); x.fillStyle = g; x.fillRect(0, 0, 8, 8); })];
  return S;
}

// ---------- mặt đất dưới chân (dùng chung cho bụi + tiếng bước chân) ----------
function v70fSurf(P){
  if(!P) return 'grass'; if(P.boat || P.inSub) return 'water';
  const snow = season === 'dong' || weather === 'tuyet' || weather === 'baotuyet';
  try { if(!v46Raw(P.x)){ if(indoor(P)) return 'wood'; const rg = regionAt(P.x, P.y); if(rg === 'beach') return 'sand'; if(rg === 'road' || rg === 'yard' || rg === 'plaza' || rg === 'shopst' || rg === 'pstreet') return snow ? 'snow' : 'stone'; return snow ? 'snow' : 'grass'; } } catch(e){}
  const p = v46Pos(P), L = V46L, d = Math.hypot(p[0] - L.CX, p[1] - L.CY);
  if(d > L.ISLAND - 30) return 'water'; if(d > L.GRASS) return 'sand'; if(snow) return 'snow';
  try { const cx = Math.floor(p[0]/100), cy = Math.floor(p[1]/100); for(let gx = cx - 1; gx <= cx + 1; gx++) for(let gy = cy - 1; gy <= cy + 1; gy++){ const c = V46R.cell[gx + ',' + gy]; if(c) for(const j of c){ const n = V46R.nodes[j]; if((n[0] - p[0])**2 + (n[1] - p[1])**2 < 2600) return 'stone'; } } } catch(e){}
  return 'grass';
}

// ---------- sinh hạt quanh người chơi: bụi khi đi/chạy/đạp xe, gợn nước khi đi thuyền, toé nước khi đi dưới mưa ----------
function v70fEmit(dt){
  const P = typeof PLAYER !== 'undefined' ? PLAYER : null, q = V70F.q; if(!P || !P.visible || P.v16fly || P.flying || q === 0){ V70F_X.ppx = null; return; }
  const p = v46Pos(P), px = p[0], py = p[1];
  if(V70F_X.ppx == null){ V70F_X.ppx = px; V70F_X.ppy = py; return; }
  const vx = (px - V70F_X.ppx)/Math.max(dt, 1e-3), vy = (py - V70F_X.ppy)/Math.max(dt, 1e-3), sp = Math.hypot(vx, vy); V70F_X.ppx = px; V70F_X.ppy = py;
  if(sp < 25 || sp > 3000) return;
  if(P.boat){ V70F_X.ripT -= dt; if(V70F_X.ripT <= 0){ V70F_X.ripT = q === 2 ? .09 : .16; const ux = vx/sp, uy = vy/sp;
      v70fAdd(2, px - ux*26 + (Math.random() - .5)*8, py - uy*20 + 4, 0, 0, 1.3, 10, 9); if(q === 2) v70fAdd(3, px - ux*18, py + 2, -ux*30 + (Math.random() - .5)*40, -30, .45, 2, 9); } return; }
  const fast = P.cycling || P.mount || sp > 175; V70F_X.dustT -= dt; if(V70F_X.dustT > 0) return;
  V70F_X.dustT = fast ? (q === 2 ? .045 : .07) : (q === 2 ? .17 : .26);
  const sf = v70fSurf(P); V70F_X.surf = sf; if(sf === 'wood' || sf === 'water') return;
  const wet = V70F_RAIN.has(weather) && sf !== 'snow', c = sf === 'sand' ? 0 : sf === 'stone' ? 1 : sf === 'snow' ? 3 : 2, ux = vx/sp, uy = vy/sp, n = fast ? 2 : 1;
  for(let k = 0; k < n; k++){ const ox = (Math.random() - .5)*10, oy = (Math.random() - .5)*4;
    if(wet) v70fAdd(3, px + ox, py + oy, -ux*20 + (Math.random() - .5)*50, -40 - Math.random()*40, .4, 1.6, 6);
    else v70fAdd(1, px - ux*8 + ox, py + oy, -ux*(fast ? 34 : 14) + (Math.random() - .5)*16, -8 - Math.random()*10, fast ? .75 : .55, fast ? 4 : 3, c); }
}
function v70fDrawP(dt, glowPass){
  const P = V70F_P, g = ctx;
  for(let i = 0; i < V70F_N; i++){ if(P.t[i] <= 0) continue; const k = P.k[i], add = k >= 4; if(add !== glowPass) continue;
    P.t[i] -= dt; if(P.t[i] <= 0) continue; const u = 1 - P.t[i]/P.T[i];
    P.x[i] += P.vx[i]*dt; P.y[i] += P.vy[i]*dt;
    if(k === 1){ P.vx[i] *= .94; P.vy[i] *= .94; g.globalAlpha = .42*(1 - u); g.fillStyle = V70F_COL[P.c[i]]; const r = P.s[i]*(1 + u*1.6); g.beginPath(); g.arc(P.x[i], P.y[i], r, 0, 6.283); g.fill(); }
    else if(k === 2){ g.globalAlpha = .5*(1 - u); g.strokeStyle = '#eaf6ff'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(P.x[i], P.y[i], P.s[i]*(.5 + u*2.2), P.s[i]*(.22 + u*.9), 0, 0, 6.283); g.stroke(); }
    else if(k === 3){ P.vy[i] += 260*dt; g.globalAlpha = .7*(1 - u); g.fillStyle = V70F_COL[P.c[i]] || '#dff'; g.fillRect(P.x[i] - 1, P.y[i] - 1, P.s[i] + 1, P.s[i] + 1); }
    else if(k === 4){ P.vy[i] += 300*dt; g.globalAlpha = 1; g.fillStyle = '#ffe9b0'; g.fillRect(P.x[i] - 2, P.y[i] - 2, 4, 6); g.globalAlpha = .5; g.fillRect(P.x[i] - 1, P.y[i] + 4, 2, 10);
      if(P.t[i] < dt*1.5 || P.vy[i] > -30){ P.t[i] = 0; v70fBurst(P.x[i], P.y[i], P.c[i]); } }
    else if(k === 5){ P.vy[i] += 70*dt; P.vx[i] *= .985; P.vy[i] *= .985; const a = (1 - u)*(u > .7 ? (Math.sin(P.t[i]*40) > 0 ? 1 : .4) : 1); g.globalAlpha = a; g.fillStyle = V70F_COL[P.c[i]];
      const s = P.s[i]; g.fillRect(P.x[i] - s/2, P.y[i] - s/2, s, s); g.globalAlpha = a*.35; g.fillRect(P.x[i] - P.vx[i]*.05 - s/4, P.y[i] - P.vy[i]*.05 - s/4, s/2, s/2); }
    else if(k === 6){ g.globalAlpha = .55*(1 - u); const r = P.s[i]*(.6 + u*.6), sp = V70F_X.spr.gold; g.drawImage(sp, P.x[i] - r, P.y[i] - r, r*2, r*2); }
  }
  g.globalAlpha = 1;
}

// ---------- vũng nước khi mưa (lưới cố định theo toạ độ thế giới) + vòng gợn hạt mưa ----------
function v70fPuddles(VBn){
  const q = V70F.q, rain = V70F_RAIN.has(weather) && !(season === 'dong' && weather === 'mua'); if(!rain || q === 0) return;
  const g = ctx, C = 210, L = V46L, R2 = (L.ISLAND - 80)**2, i0 = Math.floor(VBn.x0/C), i1 = Math.floor(VBn.x1/C), j0 = Math.floor(VBn.y0/C), j1 = Math.floor(VBn.y1/C);
  if((i1 - i0)*(j1 - j0) > 900) return; const lim = q === 2 ? .2 : .12, t = realT;
  g.fillStyle = 'rgba(30,40,70,.07)'; g.fillRect(VBn.x0, VBn.y0, VBn.x1 - VBn.x0, VBn.y1 - VBn.y0);   // đất ướt sẫm lại
  for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){ const h = v70fH(i, j); if(h > lim) continue;
    const x = i*C + v70fH(j, i)*C, y = j*C + v70fH(i + 7, j)*C; if((x - L.CX)**2 + (y - L.CY)**2 > R2) continue;
    const w = 22 + h/lim*30, hh = w*.34;
    g.fillStyle = 'rgba(70,96,140,.34)'; g.beginPath(); g.ellipse(x, y, w, hh, 0, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(210,230,255,.22)'; g.beginPath(); g.ellipse(x - w*.25, y - hh*.3, w*.42, hh*.3, 0, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(225,240,255,.55)'; g.lineWidth = 1.2;
    for(let r = 0; r < (q === 2 ? 2 : 1); r++){ const ph = (t*1.3 + h*17 + r*.5) % 1, ox = (v70fH(i + r, j + Math.floor(t*1.3 + h*17)) - .5)*w, oy = (v70fH(j, i + r + Math.floor(t*1.3)) - .5)*hh;
      g.globalAlpha = 1 - ph; g.beginPath(); g.ellipse(x + ox*.8, y + oy*.6, 2 + ph*9, 1 + ph*3.4, 0, 0, 6.283); g.stroke(); }
    g.globalAlpha = 1; }
}
// ---------- lấp lánh mặt nước (biển quanh đảo): ban ngày ánh nắng, ban đêm ánh trăng xanh ----------
function v70fGlints(VBn){
  const q = V70F.q; if(q === 0) return; const g = ctx, L = V46L, C = q === 2 ? 70 : 100, R2 = (L.ISLAND + 60)**2, i0 = Math.floor(VBn.x0/C), i1 = Math.floor(VBn.x1/C), j0 = Math.floor(VBn.y0/C), j1 = Math.floor(VBn.y1/C);
  if((i1 - i0)*(j1 - j0) > 1400) return; const d = lightLevel(), cloudy = V70F_RAIN.has(weather) || weather === 'suongmu' || weather === 'may';
  const col = d > .45 ? 'rgba(200,225,255,' : 'rgba(255,252,230,', base = cloudy ? .35 : 1, t = realT;
  for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){ const x = i*C + v70fH(i, j)*C, y = j*C + v70fH(j, i)*C; if((x - L.CX)**2 + (y - L.CY)**2 < R2) continue;
    const s = Math.sin(t*(1.4 + v70fH(i + 3, j)*2.2) + v70fH(i, j + 5)*40); if(s < .72) continue; const a = (s - .72)/.28*base, w = 3 + v70fH(j + 2, i)*6;
    g.fillStyle = col + (a*.85).toFixed(2) + ')'; g.fillRect(x - w, y, w*2, 1.6); g.fillRect(x - .8, y - w*.45, 1.6, w*.9 + 1.6); }
}

// ---------- quầng sáng ấm các điểm nhấn ban đêm (sau lớp tối, cộng sáng) ----------
function v70fLandmarks(VBn, d){
  if(d < .08 || V70F.q === 0) return; const S = v70fSpr(), g = ctx, k = Math.min(1, (d - .08)/.3), pu = .92 + .08*Math.sin(realT*1.7);
  const put = (spr, x, y, r, a) => { if(x + r < VBn.x0 || x - r > VBn.x1 || y + r < VBn.y0 || y - r > VBn.y1) return; g.globalAlpha = a; g.drawImage(spr, x - r, y - r, r*2, r*2); };
  g.save(); g.globalCompositeOperation = 'lighter';
  try { if(typeof v66tGeo === 'function' && V46L.zones.v66t){ const G = v66tGeo(); put(S.glow, G.bx, G.by - G.H*.55, G.CW*.62, .34*k*pu); put(S.gold, G.bx, G.by - 30, G.RP*1.1, .22*k); } } catch(e){}
  try { if(typeof v53cGeo === 'function' && V46L.zones.tower81){ const G = v53cGeo('tower81'), tx = G.cx, ty = G.gy;
    put(S.cool, tx, ty - G.th*.55, G.th*.45, .26*k); put(S.glow, tx, ty - G.th - 40, 150, .5*k*(.85 + .15*Math.sin(realT*3))); put(S.glow, tx, ty, G.W*.42, .2*k); } } catch(e){}
  // quầng ấm dưới đèn đường của đảo (v46 đặt sẵn vị trí đèn) — chỉ mức Cao, tối đa 40 đèn trong khung
  if(V70F.q === 2 && typeof V46T === 'object' && V46T.lamps){ let n = 0; for(const [x, y] of V46T.lamps){ if(x < VBn.x0 - 120 || x > VBn.x1 + 120 || y < VBn.y0 - 120 || y > VBn.y1 + 120) continue; put(S.glow, x, y - 44, 90, .16*k*(.95 + .05*Math.sin(realT*5 + x))); if(++n > 40) break; } }
  g.restore(); g.globalAlpha = 1;
}

// ---------- tia nắng sáng sớm (5:30–8:30), nắng vàng chiều (17:00–18:30), viền tối ban đêm — vẽ theo màn hình ----------
function v70fSky(d){
  const q = V70F.q, S = v70fSpr(), g = ctx, t = clock, clear = !V70F_RAIN.has(weather) && weather !== 'suongmu' && weather !== 'tuyet' && weather !== 'baotuyet';
  g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if(q === 2 && clear && t >= 330 && t <= 510){ const a = Math.min(1, (t - 330)/30, (510 - t)/50)*.55; g.globalCompositeOperation = 'lighter';
    for(let k = 0; k < 5; k++){ const x = cw*(.08 + k*.21) + Math.sin(realT*.13 + k*2.1)*cw*.03, w = cw*(.07 + .05*v70fH(k, 3)), al = a*(.55 + .45*Math.sin(realT*.4 + k*1.7));
      g.save(); g.translate(x, -ch*.05); g.rotate(-.5); g.globalAlpha = al; g.drawImage(S.ray, -w/2, 0, w, ch*1.6); g.restore(); }
    g.globalCompositeOperation = 'source-over'; }
  if(q >= 1 && clear && t >= 1010 && t <= 1110){ const a = Math.min(1, (t - 1010)/30, (1110 - t)/30); const gr = g.createLinearGradient(cw, 0, 0, ch);
    gr.addColorStop(0, `rgba(255,170,80,${.2*a})`); gr.addColorStop(.62, `rgba(255,140,90,${.06*a})`); gr.addColorStop(1, 'rgba(255,120,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch); }
  if(q >= 1 && d > .15){ g.globalAlpha = Math.min(.55, (d - .15)*1.1); g.drawImage(S.vig, -cw*.12, -ch*.12, cw*1.24, ch*1.24); g.globalAlpha = 1; }
  g.restore();
}

// ---------- tia chớp xa khi mưa bão (không đánh trúng ai), tiếng sấm trễ theo khoảng cách ----------
function v70fLightning(dt){
  const L = V70F_X.lt; L.a = Math.max(0, L.a - dt*2.6);
  if(V70F_STORM.has(weather) || weather === 'mua'){ L.next -= dt; if(L.next <= 0){ L.next = (weather === 'mua' ? 14 : 6) + Math.random()*10; L.a = 1; L.x = .1 + Math.random()*.8;
      const seg = [[0, 0]]; for(let k = 1; k < 7; k++) seg.push([seg[k - 1][0] + (Math.random() - .5)*.05, k/6]); L.bolt = seg; L.far = .4 + Math.random()*.6; v70fShake(.08);
      try { if(typeof v70fThunder === 'function') setTimeout(() => v70fThunder(L.far), 500 + L.far*2200); } catch(e){} } }
  if(L.a <= 0 || V70F.q === 0 || v70fRM()) return; const g = ctx, S = v70fSpr();
  g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.globalCompositeOperation = 'lighter';
  const fl = L.a*(L.a > .7 ? 1 : .55 + .45*Math.sin(L.a*60));
  g.globalAlpha = fl*.35*(1.2 - L.far*.6); g.drawImage(S.cool, cw*L.x - cw*.6, -ch*.55, cw*1.2, ch*.95);
  if(L.bolt && L.a > .45){ g.globalAlpha = fl*.75; g.strokeStyle = '#eef4ff'; g.lineWidth = 2.2; g.beginPath(); const hh = ch*(.16 + (1 - L.far)*.14);
    L.bolt.forEach(([bx, by], k) => { const X = cw*(L.x + bx), Y = by*hh; k ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); }
  g.restore(); g.globalAlpha = 1;
}

// ---------- pháo hoa ngày lễ (buổi tối) hoặc khi có lễ hội trong game ----------
const V70F_HOL = {'1/1':'Năm mới', '14/2':'Valentine', '8/3':'Quốc tế Phụ nữ', '30/4':'Giải phóng miền Nam', '1/5':'Quốc tế Lao động', '1/6':'Quốc tế Thiếu nhi', '2/9':'Quốc khánh', '20/10':'Phụ nữ Việt Nam', '20/11':'Nhà giáo Việt Nam', '24/12':'Giáng sinh', '25/12':'Giáng sinh', '31/12':'Đón năm mới',
  '17/2/2026':'Tết Nguyên đán', '18/2/2026':'Tết Nguyên đán', '6/2/2027':'Tết Nguyên đán', '7/2/2027':'Tết Nguyên đán', '26/1/2028':'Tết Nguyên đán', '25/9/2026':'Trung thu', '15/9/2027':'Trung thu'};
function v70fToday(){ let d; if(typeof REALT !== 'undefined' && REALT.on) d = new Date(); else d = new Date(2026, 0, 5 + ((typeof day === 'number' ? day : 1) - 1)); return [d.getDate(), d.getMonth() + 1, d.getFullYear()]; }
function v70fHoliday(){ const [d, m, y] = v70fToday(); return V70F_HOL[d + '/' + m + '/' + y] || V70F_HOL[d + '/' + m] || null; }
function v70fFwOn(){ if(V70F.fwForce) return true; const night = clock >= 1110 || clock < 60; if(!night || V70F_RAIN.has(weather)) return false; return !!(festival || v70fHoliday()); }
function v70fBurst(x, y, c){ const n = V70F.q === 2 ? 44 : 26, sp = 120 + Math.random()*80, ring = Math.random() < .35;
  v70fAdd(6, x, y, 0, 0, .5, 150, c); for(let k = 0; k < n; k++){ const a = k/n*6.283 + Math.random()*.2, v = ring ? sp : sp*(.35 + Math.random()*.65); v70fAdd(5, x, y, Math.cos(a)*v, Math.sin(a)*v*.8, 1.3 + Math.random()*.6, 4.5 + Math.random()*2.5, c); }
  if(V70F.q === 2) for(let k = 0; k < 8; k++){ const a = Math.random()*6.283; v70fAdd(5, x, y, Math.cos(a)*40, Math.sin(a)*40, 1.6, 2, 9); }
  try { if(typeof v70fPop === 'function') v70fPop(); } catch(e){} }
function v70fFireworks(dt, VBn){
  const F = V70F_X.fw; if(V70F.q === 0 || !v70fFwOn()){ F.on = false; return; }
  if(!F.on){ F.on = true; F.next = .4; const h = v70fHoliday(); if(h && F.told !== h + day){ F.told = h + day; try { toast('🎆 Pháo hoa mừng ngày ' + h + '!'); } catch(e){} } }
  F.next -= dt; if(F.next > 0) return; F.next = (V70F.q === 2 ? .7 : 1.2) + Math.random()*1.1;
  const W = cw/cam.z, H = ch/cam.z, X0 = cam.x - W/2, Y0v = cam.y - H/2, x = X0 + W*(.15 + Math.random()*.7), y0 = Y0v + H*1.02, ty = Y0v + H*(.22 + Math.random()*.22), vy = -Math.sqrt(2*300*(y0 - ty));
  v70fAdd(4, x, y0, (Math.random() - .5)*40, Math.max(-1400, vy), 3, 3, 4 + Math.floor(Math.random()*5));
}

// ---------- lá / hoa / tuyết / bụi nắng bay GẦN màn hình (mức Vừa: 5, Cao: 11) ----------
function v70fNear(dt){
  const q = V70F.q, S = v70fSpr(), want = q === 2 ? 11 : q === 1 ? 5 : 0, se = season, N = V70F_X.near;
  const kind = (weather === 'tuyet' || weather === 'baotuyet' || se === 'dong') ? 'flake' : se === 'thu' ? 'leaf' : se === 'xuan' ? 'petal' : 'mote';
  if(V70F_RAIN.has(weather) && kind !== 'flake') return; const wind = (WEATHERS[weather] && WEATHERS[weather].wind) || 0;
  while(N.length < want) N.push({x:Math.random(), y:Math.random(), z:.6 + Math.random()*.9, ph:Math.random()*7, r:Math.random()*6, i:N.length % 3});
  const g = ctx; g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  for(let k = 0; k < want; k++){ const n = N[k], sp = kind === 'mote' ? .012 : .04;
    n.y += dt*sp*n.z*(kind === 'mote' ? -.6 : 1); n.x += dt*(.012 + wind*.05)*n.z + Math.sin(realT*.9 + n.ph)*dt*.02; n.r += dt*(1 + n.z);
    if(n.y > 1.08) { n.y = -.08; n.x = Math.random(); } if(n.y < -.08){ n.y = 1.05; n.x = Math.random(); } if(n.x > 1.08) n.x = -.06;
    const arr = S[kind], im = arr[n.i % arr.length], s = n.z*(kind === 'mote' ? 1.6 : 1.5);
    g.globalAlpha = kind === 'mote' ? .45 + .35*Math.sin(realT*2 + n.ph) : .85;
    g.save(); g.translate(n.x*cw, n.y*ch); g.rotate(kind === 'mote' ? 0 : Math.sin(n.r)*1.2); g.scale(s, kind === 'leaf' || kind === 'petal' ? s*Math.abs(Math.cos(n.r*.7)) + .2 : s); g.drawImage(im, -im.width/2, -im.height/2); g.restore(); }
  g.restore(); g.globalAlpha = 1;
}

// ---------- bóng đổ mềm theo giờ: dài về phía Tây buổi sáng, ngắn buổi trưa, dài về phía Đông buổi chiều ----------
function v70fSunVec(){ const t = clock; if(t < 360 || t > 1110) return null; const u = (t - 360)/750, el = Math.sin(u*Math.PI); const clear = !V70F_RAIN.has(weather) && weather !== 'suongmu' && weather !== 'may';
  return {dx:-Math.cos(u*Math.PI), L:6 + (1 - el)*26, a:(clear ? .17 : .07)*Math.min(1, (t - 360)/40, (1110 - t)/40)}; }
function v70fShadowHook(){
  if(typeof v53vDrawPerson !== 'function') return; const d0 = v53vDrawPerson;
  v53vDrawPerson = function(a, dp0){
    if(V70F.on && V70F.q >= 1 && a && a.visible && !a.inSub && !a.boat && !a.flying && !a.v16fly && V70F_X.sun){ const S = V70F_X.sun, m = ctx.getTransform();
      if(Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6){ const L = S.L; ctx.fillStyle = `rgba(14,10,28,${S.a})`; ctx.beginPath(); ctx.ellipse(a.x + S.dx*L*.55, a.y + 1, 5 + L*.55, 2.6 + L*.04, S.dx*.08, 0, 6.283); ctx.fill(); } }
    return d0.apply(this, arguments); };
}

// ---------- móc vào khung hình ----------
function v70fFxInit(){
  v70fSpr(); v70fShadowHook();
  if(typeof spawnParticles === 'function'){ const s0 = spawnParticles; spawnParticles = function(dt){ return s0(V70F.q === 0 ? dt*.45 : dt); }; }   // Thấp: bớt hạt mưa/lá có sẵn
  if(typeof v46Lighting === 'function'){ const L0 = v46Lighting; v46Lighting = function(VBn){
    if(!V70F.on || (typeof FEED !== 'undefined' && FEED)) return L0(VBn);
    const t = performance.now(), dt = Math.min(.1, V70F_X.t ? (t - V70F_X.t)/1000 : .016); V70F_X.t = t;
    const run = !(typeof paused !== 'undefined' && paused), d = lightLevel(); V70F_X.sun = v70fSunVec();
    try { v70fPuddles(VBn); v70fGlints(VBn); if(run) v70fEmit(dt); v70fDrawP(run ? dt : 0, false); } catch(e){ if(!V70F.stat.e1){ V70F.stat.e1 = 1; console.warn('v70f under', e); } }
    L0(VBn);
    try { v70fLandmarks(VBn, d); if(run) v70fFireworks(dt, VBn); ctx.save(); ctx.globalCompositeOperation = 'lighter'; v70fDrawP(run ? dt : 0, true); ctx.restore(); v70fSky(d); v70fNear(run ? dt : 0); v70fLightning(run ? dt : 0); }
    catch(e){ if(!V70F.stat.e2){ V70F.stat.e2 = 1; console.warn('v70f over', e); } }
    V70F.stat.ms = performance.now() - t; }; }
  if(typeof v25Dark === 'function'){ const k0 = v25Dark; v25Dark = function(d){ const r = k0.apply(this, arguments);   // đêm sâu hơn: phủ lại lớp tối có lỗ sáng (đèn vẫn sáng)
    if(r && V70F.on && V70F.q >= 1 && d > .2 && SPR.dc && !(typeof FEED !== 'undefined' && FEED)){ ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = (V70F.q === 2 ? .6 : .45)*Math.min(1, (d - .2)/.3); ctx.imageSmoothingEnabled = true; ctx.drawImage(SPR.dc, 0, 0, cvs.width, cvs.height); ctx.restore(); }
    return r; }; }
  if(typeof strike === 'function'){ const k0 = strike; strike = function(){ const r = k0.apply(this, arguments); v70fShake(.35); return r; }; }
}
