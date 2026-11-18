// ================= v57p · MÁY BAY 2/2: góc nhìn thứ 3 bám đuôi (mặt đất phối cảnh kiểu mode-7), bay cao tới hành tinh, bay khắp biển, gắn vào v51p =================
const V57P_M = {B:null, g:null, L:[], q:2, sky:null, skyK:'', fog:null, fogK:'', stars:null, rear:{}, items:[], pool:[], hdg:0, pitch:0, cnt:0, wq:0, seaN:0};
const v57pSm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); };
function v57pHash(i, j, s){ const h = Math.sin(i*127.1 + j*311.7 + s*74.7)*43758.5453; return h - Math.floor(h); }
function v57pHex(c){ return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
function v57pMixC(a, b, k){ return a.map((v, i) => Math.round(v + (b[i] - v)*k)); }

// ---------- bầu trời theo giờ + thời tiết (gradient 1×64 vẽ lại khi đổi màu) ----------
const V57P_SKY = [[0, '#070b1e', '#1b2550'], [300, '#0b1030', '#26305e'], [355, '#33407a', '#f39a6b'], [420, '#4f86d0', '#ffd6a0'], [480, '#3d8be0', '#bfe3ff'], [1000, '#3d8be0', '#c6e6ff'],
  [1060, '#4a5aa8', '#ffb072'], [1110, '#2a2f6a', '#ff7a50'], [1170, '#0d1236', '#2a2a60'], [1440, '#070b1e', '#1b2550']];
function v57pSkyCols(){
  const t = ((typeof clock === 'number' ? clock : 720) % 1440 + 1440) % 1440; let i = 0; while(i < V57P_SKY.length - 2 && V57P_SKY[i + 1][0] <= t) i++;
  const a = V57P_SKY[i], b = V57P_SKY[i + 1], k = (t - a[0])/Math.max(1, b[0] - a[0]); let top = v57pMixC(v57pHex(a[1]), v57pHex(b[1]), k), hor = v57pMixC(v57pHex(a[2]), v57pHex(b[2]), k);
  const w = weather || ''; if(/mua|bao|loc|samset|tuyet/.test(w)){ top = v57pMixC(top, [110, 120, 136], .55); hor = v57pMixC(hor, [168, 176, 188], .55); } if(/suongmu/.test(w)) hor = v57pMixC(hor, [205, 211, 218], .7);
  return [top, hor];
}
function v57pSkyImg(){
  const M = V57P_M, [top, hor] = v57pSkyCols(), key = top.join() + hor.join(); if(M.sky && M.skyK === key) return M.sky;
  if(!M.sky){ [M.sky] = v57pCv(1, 64); [M.fog] = v57pCv(1, 32); } const g = M.sky.getContext('2d'), f = M.fog.getContext('2d');
  for(let i = 0; i < 64; i++){ const c = v57pMixC(top, hor, Math.pow(i/63, 1.7)); g.fillStyle = 'rgb(' + c + ')'; g.fillRect(0, i, 1, 1); }
  f.clearRect(0, 0, 1, 32); for(let i = 0; i < 32; i++){ f.fillStyle = 'rgba(' + hor + ',' + (1 - i/31).toFixed(3) + ')'; f.fillRect(0, i, 1, 1); }
  M.skyK = key; M.hor = 'rgb(' + hor + ')'; return M.sky;
}
// ---------- sprite máy bay nhìn từ phía sau (tự vẽ, cache theo loại) ----------
function v57pRear(kind){
  const M = V57P_M; if(M.rear[kind]) return M.rear[kind]; const [c, g] = v57pCv(160, 100);
  const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); }, E = (col, x, y, rx, ry) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
  const pal = {trainer:['#f4f6fb', '#2f7ad8', '#ef4b4b'], seaplane:['#e8453c', '#f4f6fb', '#1d3557'], biplane:['#c0392b', '#d6b06a', '#922b21'], banner:['#ffd23f', '#f08c1e', '#1d3557'], sport:['#f7f9fc', '#dfe4ec', '#1f6fd1'], heli:['#ffb020', '#e08a10', '#3b3b46']}[kind] || ['#f4f6fb', '#2f7ad8', '#ef4b4b'];
  const [body, wing, trim] = pal;
  if(kind === 'heli'){
    R(body, 76, 58, 8, 38); E(trim, 80, 94, 7, 7); E(body, 80, 56, 26, 21); E('rgba(0,0,0,.18)', 80, 64, 24, 12); E('#6fc3ff', 80, 50, 14, 8); R('#3b3b46', 77, 30, 6, 10);
    R('#3b3b46', 46, 82, 68, 4); R('#3b3b46', 58, 72, 4, 12); R('#3b3b46', 98, 72, 4, 12);
  } else {
    E('rgba(225,230,240,.35)', 80, 56, 30, 30);
    const wys = kind === 'biplane' ? [38, 62] : kind === 'sport' ? [62] : kind === 'seaplane' ? [46] : [44];
    if(kind === 'seaplane'){ R('#5a6676', 54, 58, 3, 26); R('#5a6676', 103, 58, 3, 26); E('#dfe6ee', 55, 86, 10, 7); E('#dfe6ee', 105, 86, 10, 7); E('rgba(0,0,0,.2)', 55, 89, 9, 3); E('rgba(0,0,0,.2)', 105, 89, 9, 3); }
    else { R('#3b3b46', 66, 62, 3, 14); R('#3b3b46', 91, 62, 3, 14); R('#2c2c36', 63, 74, 8, 10); R('#2c2c36', 89, 74, 8, 10); }
    if(kind === 'biplane'){ R('#6a4422', 36, 40, 3, 24); R('#6a4422', 121, 40, 3, 24); }
    for(const wy of wys){ R(wing, 4, wy, 152, 9); R(trim, 4, wy, 12, 9); R(trim, 144, wy, 12, 9); R('rgba(0,0,0,.22)', 4, wy + 7, 152, 2); }
    E(body, 80, 56, 15, 15); E('rgba(0,0,0,.14)', 80, 61, 14, 9); R(wing, 50, 48, 60, 6); R('rgba(0,0,0,.18)', 50, 52, 60, 2);
    R(body, 77, 18, 6, 36); R(trim, 77, 18, 6, 9); if(kind === 'sport'){ R(wing, 62, 16, 36, 4); R(trim, 62, 16, 6, 4); R(trim, 92, 16, 6, 4); }
    E('#3b3b46', 80, 63, 4, 3);
  }
  M.rear[kind] = c; return c;
}
// ---------- khung buffer độ phân giải thấp + 4 tầng mặt đất ----------
function v57pM7Setup(){
  const M = V57P_M, q = Math.max(2, Math.ceil(Math.max(cw, ch)/480)) + (M.slow ? 1 : 0), bw = Math.ceil(cw/q), bh = Math.ceil(ch/q);
  if(!M.B || M.B.width !== bw || M.B.height !== bh){ [M.B, M.g] = v57pCv(bw, bh); } M.q = q; M.bw = bw; M.bh = bh;
  if(!M.L.length) for(let i = 0; i < 4; i++){ const [c, g] = v57pCv(256, 192); M.L.push({c, g, za:0, zb:0, kx:0, ky:0, hw:0}); }
  if(!M.stars){ M.stars = []; for(let i = 0; i < 150; i++) M.stars.push([v57pHash(i, 3, 1)*Math.PI*2, .04 + Math.pow(v57pHash(i, 5, 2), 1.6)*1.1, .35 + v57pHash(i, 7, 3)*.65]); }
  for(let i = M.pool.length; i < 160; i++) M.pool.push({z:0, t:0, r:null, x:0, y:0, a:0, s:0});
}
function v57pItem(z, t, r, x, y, a){ const M = V57P_M; if(M.cnt >= M.pool.length) return; const o = M.pool[M.cnt++]; o.z = z; o.t = t; o.r = r; o.x = x; o.y = y; o.a = a || 0; M.items.push(o); }
// ---------- vẽ một khung hình góc thứ 3 (alpha k để hoà dần với góc nhìn hành tinh khi bay rất cao) ----------
function v57pM7(dt, kA){
  const P = V51P.P; if(!P) return; const M = V57P_M; v57pM7Setup(); const g = M.g, bw = M.bw, bh = M.bh, q = M.q;
  let dh = P.hdg - M.hdg; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); if(Math.abs(dh) > 2.5) M.hdg = P.hdg; else M.hdg += dh*Math.min(1, dt*2.6);
  M.pitch += (Math.max(-.07, Math.min(.07, (P.vs || 0)/900)) - M.pitch)*Math.min(1, dt*2);
  const F = Math.max(bw, bh)*.62, yh = bh*(.34 + M.pitch), D = 300 + (P.spd || 0)*.3, h0 = bh*.36*D/F, H = (P.alt || 0) + h0;
  const fx = Math.cos(M.hdg), fy = Math.sin(M.hdg), rx = -fy, ry = fx, cX = P.x - fx*D, cY = P.y - fy*D;
  const dark = Math.max(0, (typeof lightLevel === 'function' ? lightLevel() : 0) - .05), night = v57pSm(.2, .5, dark);
  // 1) bầu trời + sao + mặt trời / mặt trăng
  const sky = v57pSkyImg(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(sky, 0, 0, 1, 64, 0, Math.min(0, yh - bh*.9), bw, Math.max(yh, bh*.9) + 2);
  const fov = Math.atan(bw/2/F) + .15;
  if(night > .02){ g.fillStyle = '#fff'; for(const s of M.stars){ let r = s[0] - M.hdg; r = Math.atan2(Math.sin(r), Math.cos(r)); if(Math.abs(r) > fov) continue; const y = yh - Math.tan(s[1])*F; if(y < 0 || y > yh - 2) continue; g.globalAlpha = night*s[2]*(.75 + .25*Math.sin(realT*2 + s[0]*9)); g.fillRect(Math.round(bw/2 + Math.tan(r)*F), Math.round(y), 1, 1); } g.globalAlpha = 1; }
  const t = typeof clock === 'number' ? clock : 720, sa = (t - 360)/720*Math.PI, se = Math.sin(sa)*.75, day = se > -.1;
  { const az = day ? sa : sa + Math.PI, el = day ? se : -se; let r = az - M.hdg; r = Math.atan2(Math.sin(r), Math.cos(r)); if(Math.abs(r) < fov && el > -.05){ const x = bw/2 + Math.tan(r)*F, y = yh - Math.tan(Math.max(.02, el))*F*.8, rad = Math.max(3, bw*.022);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = day ? .55 : .3; g.drawImage(v51pGlow(day ? 'rgba(255,220,150,1)' : 'rgba(200,215,255,1)'), x - rad*4, y - rad*4, rad*8, rad*8); g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1; g.fillStyle = day ? '#fff4c8' : '#e8eefc'; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); if(!day){ g.fillStyle = M.hor || '#1b2550'; g.globalAlpha = .55; g.beginPath(); g.arc(x + rad*.45, y - rad*.2, rad*.9, 0, 7); g.fill(); g.globalAlpha = 1; } } }
  // 2) mặt đất: 4 tầng (gần → xa), mỗi tầng xoay ảnh toàn cảnh đảo theo mũi máy bay một lần, rồi chiếu từng dải ngang
  const ov = v46Overview(), s = V46T.OVS, zMin = H*F/Math.max(1, bh - yh), zFar = Math.min(150000, Math.max(26000, H*55)), seaC = '#12548c';
  let za = zMin, nT = 0;
  for(let k = 0; k < 4 && za < zFar; k++){ const T = M.L[k], zb = Math.min(zFar, za*(k === 0 ? 3.2 : 4.2)), hw = bw/2*zb/F*1.03, kx = 256/(2*hw), ky = 192/(zb - za), Lg = T.g;
    T.za = za; T.zb = zb; T.hw = hw; T.kx = kx; T.ky = ky; Lg.setTransform(1, 0, 0, 1, 0, 0); Lg.fillStyle = seaC; Lg.fillRect(0, 0, 256, 192);
    const e = kx*(hw - rx*cX - ry*cY), f = ky*(zb + fx*cX + fy*cY);
    Lg.setTransform(kx*rx/s, -ky*fx/s, kx*ry/s, -ky*fy/s, e, f); Lg.imageSmoothingEnabled = false; Lg.drawImage(ov, 0, 0);
    if(typeof V55S !== 'undefined' && V55S.isl){ Lg.setTransform(kx*rx, -ky*fx, kx*ry, -ky*fy, e, f); const lim = zb*1.6;
      for(const isl of V55S.isl){ const dx = isl.x - cX, dy = isl.y - cY; if(Math.abs(dx) > lim || Math.abs(dy) > lim) continue; const z = dx*fx + dy*fy; if(z < za - isl.r || z > zb + isl.r) continue;
        if(isl.x > 0 && isl.y > 0 && isl.x < V46L.W && isl.y < V46L.H) continue; Lg.fillStyle = '#5fb8d8'; Lg.beginPath(); Lg.arc(isl.x, isl.y, isl.r*1.25, 0, 7); Lg.fill(); if(isl.k === 'reef') continue;
        Lg.fillStyle = '#f0deb0'; Lg.beginPath(); Lg.arc(isl.x, isl.y, isl.r, 0, 7); Lg.fill(); Lg.fillStyle = '#5cb84a'; Lg.beginPath(); Lg.arc(isl.x, isl.y, isl.r*.78, 0, 7); Lg.fill(); } }
    za = zb; nT = k + 1; }
  const zEnd = M.L[nT - 1].zb, y0 = Math.max(0, Math.floor(yh) + 1);
  for(let y = y0, ti = 0; y < bh; y++){ const z = H*F/(y + .5 - yh); if(z >= zEnd) continue; while(ti < nT - 1 && z < M.L[ti].za) ti++; let T = M.L[ti]; if(z >= T.zb || z < T.za){ for(ti = 0; ti < nT; ti++) if(z >= M.L[ti].za && z < M.L[ti].zb) break; if(ti >= nT){ ti = 0; continue; } T = M.L[ti]; }
    const hw = bw/2*z/F; g.drawImage(T.c, T.kx*(T.hw - hw), Math.min(191, T.ky*(T.zb - z)), T.kx*2*hw, 1, 0, y, bw, 1); }
  // sương xa chân trời (che chỗ quá xa)
  const fogH = Math.max(6, H*F/zEnd*2.2 + bh*.06); g.drawImage(M.fog, 0, 0, 1, 32, 0, yh - 3, bw, fogH);
  if(/suongmu/.test(weather || '')){ g.globalAlpha = .45; g.drawImage(M.fog, 0, 0, 1, 32, 0, yh - 3, bw, bh*.5); g.globalAlpha = 1; }
  // biển lấp lánh (ban ngày, gần máy bay)
  if(night < .5){ const C = 220, nearZ = 260, farZ = Math.min(3200, 2600 + H*2); let budget = 40; g.fillStyle = '#ffffff';
    const lat = bw/2/F*farZ, xs = [cX + fx*nearZ - rx*lat*.3, cX + fx*nearZ + rx*lat*.3, cX + fx*farZ - rx*lat, cX + fx*farZ + rx*lat], ys = [cY + fy*nearZ - ry*lat*.3, cY + fy*nearZ + ry*lat*.3, cY + fy*farZ - ry*lat, cY + fy*farZ + ry*lat];
    const i0 = Math.floor(Math.min(...xs)/C), i1 = Math.floor(Math.max(...xs)/C), j0 = Math.floor(Math.min(...ys)/C), j1 = Math.floor(Math.max(...ys)/C);
    if((i1 - i0)*(j1 - j0) < 1600) for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){ const key = i*100003 + j; let w = V57P.zW.get(key);
      if(w === undefined){ if(budget-- <= 0) continue; let sf = 'land'; try { sf = v51pSurface(i*C + 110, j*C + 110); } catch(e){} w = sf === 'water'; if(V57P.zW.size > 30000) V57P.zW.clear(); V57P.zW.set(key, w); }
      if(!w) continue; const ph = v57pHash(i, j, 9), tw = v57pHash(i, j, Math.floor(realT*1.6 + ph*9)); if(tw < .78) continue;
      const x = i*C + v57pHash(i, j, 4)*C, yy = j*C + v57pHash(i, j, 5)*C, dx = x - cX, dy = yy - cY, z = dx*fx + dy*fy; if(z < nearZ || z > farZ) continue;
      const sx = bw/2 + (dx*rx + dy*ry)*F/z, sy = yh + H*F/z; if(sx < 0 || sx > bw || sy > bh) continue; g.globalAlpha = (tw - .78)*4*(1 - night*2); const sz = z < 900 ? 2 : 1; g.fillRect(Math.round(sx), Math.round(sy), sz, 1); }
    g.globalAlpha = 1; }
  // 3) đêm: phủ tối mặt đất rồi bật đèn (sân bay + đèn đường đất liền)
  if(dark > .05){ g.fillStyle = 'rgba(8,12,34,' + Math.min(.62, dark*1.05).toFixed(3) + ')'; g.fillRect(0, Math.max(0, yh), bw, bh - Math.max(0, yh));
    const k = Math.min(1, dark*2.2), A = V57P.A, gw = [v51pGlow('rgba(255,240,190,1)'), v51pGlow('rgba(80,255,120,1)'), v51pGlow('rgba(255,70,60,1)'), v51pGlow('rgba(90,150,255,1)'), v51pGlow('rgba(255,200,90,1)'), v51pGlow('rgba(255,250,220,1)')];
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; let n = 0;
    const lamp = (x, y, ty) => { const dx = x - cX, dy = y - cY, z = dx*fx + dy*fy; if(z < 40 || z > 9000) return; const sx = bw/2 + (dx*rx + dy*ry)*F/z; if(sx < -4 || sx > bw + 4) return; const sy = yh + H*F/z; if(sy > bh + 4) return;
      const r = Math.max(1.5, Math.min(9, 60/z*F*.1))*(ty === 5 ? 2.2 : 1); g.drawImage(gw[ty], sx - r, sy - r, r*2, r*2); n++; };
    if(A) for(const l of A.lights){ lamp(l[0], l[1], l[2]); if(n > 420) break; }
    if(typeof V52W !== 'undefined' && V52W.lamps) for(const l of V52W.lamps){ lamp(l[0], l[1], 0); if(n > 560) break; }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
  // 4) vật có chiều cao: nhà ga / hangar / tháp, máy bay NPC, xe kéo, mây — sắp theo khoảng cách (xa vẽ trước)
  M.items.length = 0; M.cnt = 0; const A = V57P.A, see = (x, y) => { const dx = x - cX, dy = y - cY, z = dx*fx + dy*fy; return z > 30 && z < 16000 && Math.abs(dx*rx + dy*ry) < z*bw/F + 600 ? z : 0; };
  if(A){ const t2 = A.term, boxes = V57P.boxes; for(const b of boxes){ const z = see((b[0] + b[2])/2, (b[1] + b[3])/2); if(z) v57pItem(z, 1, b); }
    for(const p of V57P.parked){ const z = see(p.s.x, p.s.y); if(z && z < 9000) v57pItem(z, 2, p, p.s.x, p.s.y, p.s.hdg); }
    for(const v of V57P.tugs){ const z = see(v.x, v.y); if(z && z < 4000) v57pItem(z, 3, v, v.x, v.y, v.hdg); } }
  for(const n of V57P.npc){ const z = see(n.x, n.y); if(z && z < 14000) v57pItem(z, 4, n, n.x, n.y, n.hdg); }
  // mây: lưới cố định theo ô, hai tầng độ cao
  const CL = 1700, cxm = cX + fx*7000, cym = cY + fy*7000, rainy = /mua|bao|loc|samset|suongmu/.test(weather || ''), th = rainy ? .62 : .36;
  for(let i = Math.floor((cxm - 8500)/CL); i <= Math.floor((cxm + 8500)/CL); i++) for(let j = Math.floor((cym - 8500)/CL); j <= Math.floor((cym + 8500)/CL); j++){
    if(v57pHash(i, j, 11) > th) continue; const x = i*CL + v57pHash(i, j, 12)*CL*.8 + realT*12, y = j*CL + v57pHash(i, j, 13)*CL*.8, z = see(x, y); if(!z || z > 15000) continue; v57pItem(z, 5, null, x, y, (v57pHash(i, j, 14) < .6 ? 900 : 2300) + v57pHash(i, j, 15)*500); }
  M.items.sort((a, b) => b.z - a.z);
  const prev = ctx; ctx = g;
  try { for(const it of M.items){
    if(it.t === 1) v57pBox(g, it.r, cX, cY, fx, fy, rx, ry, F, yh, H, bw);
    else if(it.t === 5){ const z = it.z, sx = bw/2 + ((it.x - cX)*rx + (it.y - cY)*ry)*F/z, sy = yh + (H - it.a)*F/z, w = 880*F/z, h = w*.5; if(sx + w/2 < 0 || sx - w/2 > bw || sy + h < 0 || sy - h > bh) continue;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = Math.min(1, (z - 60)/700)*(rainy ? .95 : .85)*(1 - night*.45); g.drawImage(v51pCloud(), sx - w/2, sy - h*.6, w, h); g.globalAlpha = 1; }
    else { const alt = it.t === 4 ? it.r.alt : 0, z = it.z, hr = H - alt, sx = bw/2 + ((it.x - cX)*rx + (it.y - cY)*ry)*F/z, sy = yh + hr*F/z; if(sx < -60 || sx > bw + 60 || sy < -60 || sy > bh + 60) continue;
      const sq = Math.max(.12, Math.min(1, Math.abs(hr)/Math.hypot(z, hr))), kk = F/z, th0 = -M.hdg - Math.PI/2, c = Math.cos(th0), sn = Math.sin(th0), a = kk*c, cc = -kk*sn, b = sq*kk*sn, d = sq*kk*c;
      g.setTransform(a, b, cc, d, sx - (a*it.x + cc*it.y), sy - (b*it.x + d*it.y));
      if(it.t === 3) v57pDrawTug(it.r); else v57pDrawPlane(it.r, it.x, it.y, it.a, it.r.sc || 1.3, false);
      if(it.t === 4 && dark > .1 && (realT*1.1 + it.r.off) % 1 < .12){ g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.drawImage(v51pGlow('rgba(255,255,255,1)'), sx - 4, sy - 4, 8, 8); g.globalCompositeOperation = 'source-over'; } } }
  } finally { ctx = prev; g.setTransform(1, 0, 0, 1, 0, 0); }
  // 5) phóng buffer lên màn hình (nghiêng nhẹ theo cánh), vẽ bóng + máy bay to ở giữa phía dưới
  const roll = (P.bank || 0)*.13, W = cw*DPR, Hh = ch*DPR; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = kA;
  ctx.translate(W/2, Hh/2); ctx.rotate(roll); const zs = 1 + Math.abs(roll)*.9; ctx.scale(zs, zs); ctx.drawImage(M.B, -W/2, -Hh/2, W, Hh); ctx.restore();
  ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = kA;
  const rel = Math.atan2(Math.sin(P.hdg - M.hdg), Math.cos(P.hdg - M.hdg)), px = cw/2 + Math.sin(rel)*cw*.12, py = (yh + h0*F/D)*q, span = 78*F/D*q*1.25, sc = span/160;
  if(P.alt < 700){ const gy = (yh + H*F/D)*q; if(gy < ch + 40){ ctx.globalAlpha = kA*.3*(1 - P.alt/700); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(px, gy, span*.4*(h0/H), span*.045*(h0/H), 0, 0, 7); ctx.fill(); ctx.globalAlpha = kA; } }
  ctx.translate(px, py); ctx.rotate(-(P.bank || 0)*.55 + rel*.3); ctx.scale(sc, sc*(1 - Math.abs(P.bank || 0)*.12));
  ctx.drawImage(v57pRear(P.pl.kind), -80, -56);
  if(P.pl.hover){ const w = 150*Math.abs(Math.cos(P.spin*1.7)), w2 = 150*Math.abs(Math.sin(P.spin*1.7)); ctx.fillStyle = 'rgba(40,40,50,.7)'; ctx.fillRect(-w/2, 27, w, 4); ctx.fillStyle = 'rgba(40,40,50,.35)'; ctx.fillRect(-w2/2, 26, w2, 6); }
  else { ctx.fillStyle = 'rgba(230,235,245,' + (.18 + .12*Math.sin(P.spin*9)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill(); }
  if(P.alt > 12 && (P.spd || 0) > 60 && !P.pl.hover){ ctx.globalAlpha = kA*.35; ctx.fillStyle = '#fff'; for(const sx of [-70, 70]) ctx.fillRect(sx - 1, -4, 2, 20 + Math.random()*12); ctx.globalAlpha = kA; }
  const k2 = .45 + Math.min(.55, dark*1.5); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = kA*k2; ctx.drawImage(v51pGlow('rgba(255,60,50,1)'), -86, -4, 22, 22); ctx.drawImage(v51pGlow('rgba(60,255,110,1)'), 64, -4, 22, 22);
  if((realT*1.3) % 1 < .12){ ctx.globalAlpha = kA; ctx.drawImage(v51pGlow('rgba(255,255,255,1)'), -14, 8, 28, 28); }
  ctx.restore();
  // FPS: thấp quá thì giảm độ phân giải buffer
  if(V51P.fps && V51P.fps < 38 && !M.slow && realT > (M.slowT || 0)){ M.slow = true; M.slowT = realT + 8; } else if(M.slow && V51P.fps > 57 && realT > (M.slowT || 0)){ M.slow = false; M.slowT = realT + 8; }
}
// hộp 3D đơn giản: [x0, y0, x1, y1, cao, màu mái, màu tường 1, màu tường 2, đáy]
function v57pBox(g, b, cX, cY, fx, fy, rx, ry, F, yh, H, bw){
  const cs = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]], z0 = b[8] || 0, P = [];
  for(const c of cs){ const dx = c[0] - cX, dy = c[1] - cY, z = dx*fx + dy*fy; if(z < 25) return; const sx = bw/2 + (dx*rx + dy*ry)*F/z; P.push([sx, yh + (H - z0)*F/z, yh + (H - z0 - b[4])*F/z, z]); }
  g.setTransform(1, 0, 0, 1, 0, 0); const W = [0, 1, 2, 3].map(i => [i, (P[i][3] + P[(i + 1) % 4][3])/2]).sort((a, c) => c[1] - a[1]);
  const top = () => { g.fillStyle = b[5]; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[2]) : g.moveTo(p[0], p[2])); g.closePath(); g.fill(); };
  if(H < z0 + b[4]) top();
  for(const [i] of W){ const p = P[i], q = P[(i + 1) % 4]; g.fillStyle = i % 2 ? b[6] : b[7]; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.lineTo(q[0], q[2]); g.lineTo(p[0], p[2]); g.closePath(); g.fill(); }
  if(H >= z0 + b[4]) top();
}

// ---------- camera góc trên xuống: lùi dần theo độ cao, rất cao → góc nhìn hành tinh v56p ----------
function v57pCam(dt){
  const P = V51P.P; if(!P || V57P.camT === realT) return; V57P.camT = realT;
  const D = v51pProj(P), small = Math.min(cw, ch) < 520, base = small ? .78 : 1, zLo = small ? .24 : .3, a = P.alt;
  let zT = Math.max(zLo, base*(1 - .72*Math.min(1, a/950)) - P.spd/3000);
  if(a > 950){ let fz = .02; try { if(typeof v56pZFit === 'function'){ v56pCheck(); fz = v56pZFit()*.9; } } catch(e){} const k = v57pSm(0, 1, (a - 950)/(V57P_ALTMAX*.86 - 950)); zT = Math.exp(Math.log(zLo) + (Math.log(Math.min(zLo, fz)) - Math.log(zLo))*k); }
  const tx = D[0] + Math.cos(P.hdg)*P.spd*.45, ty = D[1] + Math.sin(P.hdg)*P.spd*.45, kk = Math.min(1, dt*3);
  cam.x += (tx - cam.x)*kk; cam.y += (ty - cam.y)*kk; cam.z = Math.exp(Math.log(cam.z) + (Math.log(zT) - Math.log(cam.z))*Math.min(1, dt*1.4));
}
// ---------- đổi góc nhìn ----------
function v57pSetView(v, quiet){
  V57P.view = v === 'chase' ? 'chase' : 'top'; try { localStorage.setItem('truong-v57p-view', V57P.view); } catch(e){}
  document.body.classList.toggle('v57pChase', V57P.view === 'chase' && V51P.on); const b = document.getElementById('v57pView'); if(b){ b.textContent = V57P.view === 'chase' ? '🗺️' : '🎥'; b.setAttribute('aria-label', V57P.view === 'chase' ? 'Góc nhìn từ trên xuống' : 'Góc nhìn sau đuôi'); }
  if(!quiet && V51P.on) v51pMsg(V57P.view === 'chase' ? '🎥 Góc nhìn sau đuôi · kéo ← → rẽ, ↑ ↓ lên xuống' : '🗺️ Góc nhìn từ trên xuống', 2.2);
  if(V51P.P) V57P_M.hdg = V51P.P.hdg;
}

// ---------- init: gắn vào v51p / v53c / v46 ----------
function v57pInit(){
  if(typeof V46 === 'undefined' || !V46.on || typeof V51P === 'undefined') return;
  V57P.A = v57pBuild(); V57P.on = true; v57pTrim(); v57pNpcBuild();
  const A = V57P.A;
  // hộp 3D cho góc thứ 3: nhà ga, hangar, tháp (thân + cabin kính), bồn nhiên liệu, toà tháp thành phố v53c
  const t = A.term; V57P.boxes = [[t[0], t[1], t[2], t[3], 70, '#e3e6ec', '#8fb4d4', '#a9c4dc'], ...A.hangars.map(h => [h[0], h[1], h[0] + h[2], h[1] + h[3], 110, '#8b99a8', '#6f7d8c', '#7d8b9a']),
    [A.tower[0] - 34, A.tower[1] - 34, A.tower[0] + 34, A.tower[1] + 34, 230, '#d9d4c7', '#c8c1b2', '#b8b1a2'], [A.tower[0] - 46, A.tower[1] - 46, A.tower[0] + 46, A.tower[1] + 46, 52, '#2b5f86', '#5fb0e0', '#4c9bd0', 230],
    ...A.tanks.map(p => [p[0] - 40, p[1] - 40, p[0] + 40, p[1] + 40, 60, '#eef0f3', '#d9dde3', '#c9ced8'])];
  try { const tw = V53C.geo.tower81; if(tw) V57P.boxes.push([tw.b.x0 + tw.b.x1/2 - tw.b.x0/2 - 120, tw.b.y0, tw.b.x0/2 + tw.b.x1/2 + 120, tw.b.y0 + 240, 900, '#9ec8e8', '#5f8fbf', '#6fa0d0']); } catch(e){}
  try { const s = v53cSet(); if(!s.v57){ s.inc = false; s.v57 = 1; v53cSetSave(); } } catch(e){}
  try { V57P.view = localStorage.getItem('truong-v57p-view') === 'chase' ? 'chase' : 'top'; } catch(e){}
  // mặt đất máy bay: đường băng mới
  const sf0 = v51pSurface; v51pSurface = function(x, y){ return v57pOnRunway(x, y) ? 'runway' : sf0(x, y); };
  const na0 = v51pNearAirport; v51pNearAirport = function(){ if(na0()) return true; if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return false; const p = v46Pos(PLAYER); return v57pNear(p[0], p[1]); };
  const ce0 = v51pCanExit; v51pCanExit = function(){ if(ce0()) return true; const P = V51P.P; return !!P && P.ground && P.spd <= 30 && v57pInAp(P.x, P.y, 300); };
  try { const nr0 = v53cNearRunway; v53cNearRunway = function(x, y){ const b = nr0(x, y); let best = b, bd = Math.hypot(b[0] - x, b[1] - y); for(const r of A.rw){ const d = Math.hypot(r.cx - x, r.cy - y); if(d < bd){ bd = d; best = [r.cx, r.cy, 'Sân bay Quốc tế Rubik']; } } return best; }; } catch(e){}
  // lên máy bay ở sân bay mới: xuất phát ở ô đỗ số 1 (trực thăng: bãi H; thủy phi cơ: cầu tàu)
  const bd0 = v51pBoard; v51pBoard = function(id, air){
    const p = (!air && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible) ? v46Pos(PLAYER) : null, atNew = !!p && v57pNear(p[0], p[1]);
    const r = bd0.apply(this, arguments); V57P_M.hdg = V51P.P ? V51P.P.hdg : 0;
    if(r && atNew && V51P.P){ const P = V51P.P, s = A.stands[0];
      if(P.pl.hover){ P.x = A.heli[1][0]; P.y = A.heli[1][1]; P.hdg = -Math.PI/2; v51pMsg('🚁 Bãi trực thăng H · đẩy GA rồi kéo ↑ để cất cánh thẳng đứng.', 4.5); }
      else if(P.pl.water){ P.x = A.dock.x0 - 60; P.y = A.dock.y; P.hdg = Math.PI; v51pMsg('🛶 Cầu tàu thủy phi cơ · đẩy GA, lướt trên mặt nước rồi cất cánh!', 4.5); }
      else { P.x = s.x; P.y = s.y; P.hdg = Math.PI; v51pMsg('🛫 Ô đỗ số 1 của bạn · lăn ra đường lăn, vào đường băng dài 36L rồi cất cánh!', 5); }
      cam.x = P.x; cam.y = P.y; V57P_M.hdg = P.hdg; }
    if(r) v57pSetView(V57P.view, true); return r; };
  const ex0 = v51pExit; v51pExit = function(force){
    const P = V51P.P, at = V51P.on && P && !force && v57pInAp(P.x, P.y, 300), px = P ? P.x : 0, py = P ? P.y : 0, r = ex0.apply(this, arguments);
    if(at && !V51P.on && typeof PLAYER !== 'undefined' && PLAYER){ let x = px, y = py + 70; let sf = 'land'; try { sf = v51pSurface(x, y); } catch(e){}
      if(v57pSolid(x, y) || sf === 'water'){ if(sf === 'water'){ x = A.dock.x1 - 40; y = A.dock.y + 60; } else { x = A.stands[0].x + 150; y = A.stands[0].y + 40; } }
      PLAYER.x = x + V46E; PLAYER.y = y; PLAYER._z = null; PLAYER.v46t = null; PLAYER._lx = PLAYER.x; PLAYER._ly = PLAYER.y; cam.x = x; cam.y = y; }
    document.body.classList.remove('v57pChase'); return r; };
  // rìa thế giới: quay đầu nhẹ nhàng (không chữ)
  const tk0 = v51pTick; v51pTick = function(dt){ tk0(dt); const P = V51P.P; if(!P) return;
    const X0 = typeof V55S !== 'undefined' ? V55S.X0 : 0, Y0 = typeof V55S !== 'undefined' ? V55S.Y0 : 0, X1 = typeof V55S !== 'undefined' ? V55S.X1 : V46L.W, Y1 = typeof V55S !== 'undefined' ? V55S.Y1 : V46L.H, m = 1600;
    const out = Math.max(X0 + m - P.x, P.x - (X1 - m), Y0 + m - P.y, P.y - (Y1 - m));
    if(out > 0){ const want = Math.atan2(V46L.CY - P.y, V46L.CX - P.x); let d = want - P.hdg; d = Math.atan2(Math.sin(d), Math.cos(d)); const rate = (.35 + Math.min(1, out/m))*dt; P.hdg += Math.max(-rate, Math.min(rate, d)); P.bank += (Math.sign(d)*.6 - P.bank)*Math.min(1, dt*2); }
    P.x = Math.max(X0 + 120, Math.min(X1 - 120, P.x)); P.y = Math.max(Y0 + 120, Math.min(Y1 - 120, P.y)); };
  v51pCam = v57pCam;
  // mây v51p: khi nhìn rất xa thì để mây hành tinh v56p lo (khỏi lặp hàng nghìn ô)
  const dc0 = v51pDrawClouds; v51pDrawClouds = function(VBn, a){ if(cam.z < .14) return; return dc0(VBn, a); };
  // vẽ: nền sân bay ngay sau bờ biển; lớp động trước máy bay người chơi
  const sh0 = v46Shore; v46Shore = function(VBn){ sh0(VBn); try { v57pDrawGround(VBn); } catch(e){ console.warn('v57p ground', e); } };
  const ov0 = v51pOverlay; v51pOverlay = function(dt){
    const VBn = V46.VBn; if(VBn){ try { ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z)), Math.round(DPR*(ch/2 - cam.y*cam.z))); ctx.imageSmoothingEnabled = false;
      v57pDrawLive(VBn, Math.max(0, (typeof lightLevel === 'function' ? lightLevel() : 0) - .05)); } catch(e){ console.warn('v57p live', e); } }
    ov0(dt);
    // rất cao (góc nhìn hành tinh): vòng sáng đánh dấu máy bay của mình
    if(V51P.on && V51P.P && cam.z < .2 && VBn){ const P = V51P.P, D = v51pProj(P), r = 16/cam.z; ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z)), Math.round(DPR*(ch/2 - cam.y*cam.z)));
      ctx.strokeStyle = 'rgba(255,210,63,' + (.6 + .4*Math.sin(realT*4)).toFixed(2) + ')'; ctx.lineWidth = 3/cam.z; ctx.beginPath(); ctx.arc(D[0], D[1], r, 0, 7); ctx.stroke();
      ctx.save(); ctx.translate(D[0], D[1]); ctx.rotate(P.hdg); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(10/cam.z, 0); ctx.lineTo(-7/cam.z, -6/cam.z); ctx.lineTo(-3/cam.z, 0); ctx.lineTo(-7/cam.z, 6/cam.z); ctx.closePath(); ctx.fill(); ctx.restore(); } };
  // mũi tên chỉ đường: tới sân bay gần nhất
  v51pDrawGuide = function(){
    if(!V51P.guide || realT > V51P.guide || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return; if(v51pNearAirport()){ V51P.guide = null; toast('✈️ Tới Sân bay rồi! Bấm nút Máy bay để lên.'); return; }
    const C = v51pC(), p = v46Pos(PLAYER), s = A.stands[0], o = [C[0] + V51P_AP.taxi, C[1] + V51P_AP.hangar[1] + 150], n = [s.x + 150, s.y], useN = Math.hypot(n[0] - p[0], n[1] - p[1]) < Math.hypot(o[0] - p[0], o[1] - p[1]) * 1.4, tx = useN ? n[0] : o[0], ty = useN ? n[1] : o[1], a = Math.atan2(ty - p[1], tx - p[0]);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const r = Math.min(cw, ch)*.36, x = cw/2 + Math.cos(a)*r, y = ch/2 + Math.sin(a)*r;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1d2238'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-12, -16); ctx.lineTo(-4, 0); ctx.lineTo(-12, 16); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
    ctx.font = '800 16px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#1d2238'; ctx.fillRect(x - 50, y + 22, 100, 24); ctx.fillStyle = '#ffd23f'; ctx.fillText('✈️ ' + Math.round(Math.hypot(tx - p[0], ty - p[1])/10) + ' m', x, y + 39); };
  // bản đồ toàn cảnh + bản đồ lớn
  const ovf = v46Overview; v46Overview = function(){ const c = ovf(); if(c && !c.v57p){ c.v57p = 1; try { const g = c.getContext('2d'), s = V46T.OVS, lo = v57pLo(); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(lo, A.bb[0]*s, A.bb[1]*s, lo.width/V57P.loS*s, lo.height/V57P.loS*s); g.restore(); } catch(e){} } return c; };
  if(typeof mapPlaces === 'function'){ const mp0 = mapPlaces; mapPlaces = function(){ const P = mp0(); if(!V46.on || !Array.isArray(P) || P.some(p => p.k === 'v57pAp')) return P; const s = A.stands[0], d = [s.x + 150, s.y + 40];
      P.push({k:'v57pAp', name:'Sân bay Quốc tế Rubik', x:(A.term[0] + A.term[2])/2, y:(A.term[1] + A.term[3])/2, ox:d[0] + V46E, oy:d[1], door:[d[0] + V46E, d[1]], ic:'✈️', desc:'4 đường băng, 12 ô đỗ, tháp điều khiển, trực thăng, thủy phi cơ', cat:'world', r:true}); return P; };
    try { if(typeof MAP !== 'undefined'){ MAP.places = null; MAP.places46 = null; } } catch(e){} }
  // không đi xuyên nhà ga, hangar, tháp, bồn
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){ if(V57P.on && v46Raw(nx) && v57pSolid(nx - V46E, ny)) return false; return cm0(ox, oy, nx, ny); };
  // đèn khoét sáng màn đêm (v25)
  if(typeof v25Collect === 'function'){ const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); try { const on = v25Ramp(clock, 1080, 330); if(on <= 0 || V46.sky) return; const t = A.term;
      for(let y = t[1] + 150; y < t[3]; y += 450) v25Push((t[0] + t[2])/2 + V46E, y, 260, on*.9, 2); for(let i = 0; i < 6; i++){ v25Push(A.apron[0] + 30 + V46E, A.apron[1] + 100 + i*400, 220, on*.8, 2); v25Push(A.apron[2] - 30 + V46E, A.apron[1] + 100 + i*400, 220, on*.8, 2); }
      v25Push(A.tower[0] + V46E, A.tower[1], 140, on, 2); for(const h of A.hangars) v25Push(h[0] + h[2]/2 + V46E, h[1] - 20, 200, on*.8, 2); } catch(e){} }; }
  // máy bay NPC chạy mọi lúc (rẻ: 6 chiếc + 3 xe)
  const eu0 = extUpdate; extUpdate = function(dtR){ try { if(V57P.on) v57pNpcTick(Math.min(.1, dtR || 0)); } catch(e){} return eu0(dtR); };
  // nút đổi góc nhìn trong thanh trên khi lái + phím V
  const hb0 = v51pHudBuild; v51pHudBuild = function(){ hb0(); const gm = document.getElementById('v51pGm'); if(gm && !document.getElementById('v57pView')){ const b = document.createElement('button'); b.type = 'button'; b.id = 'v57pView'; b.className = 'v51pIb'; b.onclick = e => { e.stopPropagation(); v57pSetView(V57P.view === 'chase' ? 'top' : 'chase'); }; gm.parentNode.insertBefore(b, gm); } v57pSetView(V57P.view, true); };
  addEventListener('keydown', e => { if(!V51P.on || e.code !== 'KeyV' || e.repeat) return; const t2 = e.target; if(t2 && (t2.tagName === 'INPUT' || t2.tagName === 'TEXTAREA')) return; v57pSetView(V57P.view === 'chase' ? 'top' : 'chase'); e.preventDefault(); }, true);
  // khung hình: góc thứ 3 thay toàn bộ cảnh 2D (rất cao thì hoà sang góc nhìn hành tinh)
  const r0 = render; render = function(dt){
    if(!V51P.on || !V46.on || V46.sky || !V51P.P) return r0(dt);
    try { v57pCam(dt); } catch(e){}
    const P = V51P.P, chase = V57P.view === 'chase' && !V51P.mg && !(typeof V50 !== 'undefined' && V50.open) && !(typeof openModal !== 'undefined' && openModal);
    document.body.classList.toggle('v57pChase', !!chase);
    if(!chase) return r0(dt);
    const k = 1 - v57pSm(4000, 4900, P.alt); if(k < 1) r0(dt); else v51pFps(dt);
    if(k > 0) try { v57pM7(dt, k); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); v51pDrawRain(dt); } catch(e){ console.warn('v57p m7', e); V57P.view = 'top'; }
  };
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v57p = {V57P, V57P_M, v57pOverlap, v57pSetView};
}
