// ================= v60t · GÓC NHÌN THỨ 3 SAU LƯNG 1/2: vẽ phối cảnh khi đi bộ / đạp xe (mặt đất mode-7, trời, billboard, nhân vật nhìn từ sau) =================
// Tái dùng của v57p: v57pCv, v57pSkyImg, v57pSm, v57pHash, v57pBox, v51pGlow, v51pCloud, v51pDrawRain. Tên toàn cục tiền tố v60t / V60T.
// Vẽ vào buffer độ phân giải thấp (1/q màn hình) rồi phóng lên, imageSmoothing tắt. Mặt đất: 5 tầng (gần → xa);
// tầng gần lấy ảnh nền riêng 1 px/đơn vị (ô V46 vẽ lại không có cây/đèn + zone cache toà nhà), tầng xa lấy ảnh toàn cảnh đảo.
const V60T_M = {B:null, g:null, BB:null, bg:null, L:[], q:2, bw:0, bh:0, NG:null, ngg:null, ngX:-1e9, ngY:-1e9, ngx0:0, ngy0:0, ngT:-1e9, ngDirty:true, T:new Map(), tb:0, zb:0,
  ovRef:null, deco:null, decoSrc:null, grid:null, gridSrc:null, boxes:null, items:[], pool:[], cnt:0, stars:null, doors:[], doorsN:[], doorsT:-1e9, lampS:[], C:null,
  slow:false, slowT:0, fpsN:0, fpsT:0, fps:60, seaC:'#12548c'};
const V60T_NG = 1536, V60T_TS = 1024, V60T_GC = 512, V60T_CAP = 150;

function v60tSetup(){
  const M = V60T_M, q = Math.max(2, Math.ceil(Math.max(cw, ch)/560)) + (M.slow ? 1 : 0), bw = Math.ceil(cw/q), bh = Math.ceil(ch/q);
  if(!M.B || M.B.width !== bw || M.B.height !== bh){ [M.B, M.g] = v57pCv(bw, bh); [M.BB, M.bg] = v57pCv(bw, bh); }
  M.q = q; M.bw = bw; M.bh = bh;
  if(!M.L.length) for(let i = 0; i < 5; i++){ const [c, g] = v57pCv(256, 192); M.L.push({c, g, za:0, zb:0, kx:0, ky:0, hw:0}); }
  if(!M.stars){ M.stars = []; for(let i = 0; i < 140; i++) M.stars.push([v57pHash(i, 3, 6)*Math.PI*2, .03 + Math.pow(v57pHash(i, 5, 7), 1.6)*1.05, .35 + v57pHash(i, 7, 8)*.65]); }
  for(let i = M.pool.length; i < 320; i++) M.pool.push({z:0, t:0, r:null, x:0, y:0, a:0, i:0});
  // ảnh nền đổi (mùa / thời tiết làm lại cache) → bỏ ô riêng
  const ov = v46Overview(); if(M.ovRef !== ov){ M.ovRef = ov; M.T.clear(); M.ngDirty = true; try { M.seaC = S().sea2 || '#12548c'; } catch(e){} }
  if(M.decoSrc !== V46T.deco){ M.decoSrc = V46T.deco; M.deco = V46T.deco.filter(t => t.k >= 3 && t.k !== 8); M.T.clear(); M.ngDirty = true; }
}
function v60tItem(z, t, r, x, y, a, i){ const M = V60T_M; if(M.cnt >= M.pool.length) return; const o = M.pool[M.cnt++]; o.z = z; o.t = t; o.r = r; o.x = x; o.y = y; o.a = a || 0; o.i = i || 0; M.items.push(o); }

// ---------- ô nền riêng: như ô V46 lod 0 nhưng không vẽ cây/đèn (chúng đứng dậy thành billboard) ----------
function v60tTile(i, j){
  const M = V60T_M, k = i + ',' + j; let c = M.T.get(k); if(c) return c;
  if(M.tb <= 0) return null; M.tb--;
  c = document.createElement('canvas'); c.width = c.height = V60T_TS; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(1, 0, 0, 1, -i*V60T_TS, -j*V60T_TS);
  const prev = ctx, dk = V46T.deco; ctx = g; V46T.deco = M.deco || dk;
  try { v46Paint(g, i*V60T_TS, j*V60T_TS, V60T_TS, V60T_TS, 0); } catch(e){ console.warn('v60t tile', e); } finally { ctx = prev; V46T.deco = dk; }
  M.T.set(k, c); while(M.T.size > 12) M.T.delete(M.T.keys().next().value); return c;
}
// ảnh nền gần (1536×1536 đơn vị, 1 px/đơn vị) quanh nhân vật: ô nền + zone cache (toà nhà, phòng học)
function v60tNG(px, py){
  const M = V60T_M, N = V60T_NG;
  if(!M.NG){ [M.NG, M.ngg] = v57pCv(N, N); }
  if(Math.hypot(px - M.ngX, py - M.ngY) < N*.2 && !M.ngDirty && realT - M.ngT < 9) return;
  try { v46CheckCaches(); } catch(e){}
  const first = M.ngX < -1e8; M.tb = first ? 4 : 1; M.zb = first ? 2 : 1; M.ngDirty = false; M.ngT = realT; M.ngX = px; M.ngY = py;
  const g = M.ngg, x0 = Math.round(px - N/2), y0 = Math.round(py - N/2), x1 = x0 + N, y1 = y0 + N; M.ngx0 = x0; M.ngy0 = y0;
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.globalAlpha = 1; g.fillStyle = M.seaC; g.fillRect(0, 0, N, N);
  g.setTransform(1, 0, 0, 1, -x0, -y0);
  const ov = v46Overview(), s = V46T.OVS, ax = Math.max(0, x0), ay = Math.max(0, y0), bx = Math.min(V46L.W, x1), by = Math.min(V46L.H, y1);
  if(bx > ax && by > ay) g.drawImage(ov, ax*s, ay*s, (bx - ax)*s, (by - ay)*s, ax, ay, bx - ax, by - ay);
  for(let j = Math.floor(ay/V60T_TS); j*V60T_TS < by; j++) for(let i = Math.floor(ax/V60T_TS); i*V60T_TS < bx; i++){ const t = v60tTile(i, j); if(t) g.drawImage(t, i*V60T_TS, j*V60T_TS); else M.ngDirty = true; }
  for(const z of V46.Z){ if(z.flip) continue; const n = z.n; if(n.x1 < x0 || n.x0 > x1 || n.y1 < y0 || n.y0 > y1) continue;
    let c = V46ZC[z.id]; if(!c){ if(M.zb-- > 0){ try { c = v46ZoneCache(z); } catch(e){} } else { M.ngDirty = true; continue; } } if(!c) continue;
    g.save(); v46ClipZone(g, z, 0); g.translate(z.d[0], z.d[1]); g.drawImage(c.cv, z.e.x0, z.e.y0); g.restore(); }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
// ---------- lưới tra nhanh vật đứng: cây V46 (deco), đèn đường, cây trong khu cũ ----------
function v60tGrid(){
  const M = V60T_M; if(M.grid && M.gridSrc === V46T.deco) return M.grid;
  const G = new Map(), put = o => { const k = Math.floor(o.x/V60T_GC)*4096 + Math.floor(o.y/V60T_GC); let a = G.get(k); if(!a) G.set(k, a = []); a.push(o); };
  V46T.deco.forEach(t => { if(t.k < 3) put({t:1, x:t.x, y:t.y, r:t}); else if(t.k === 8) put({t:2, x:t.x, y:t.y, r:t}); });
  const zt = (arr, forest) => (arr || []).forEach((t, i) => { const z = v46ZoneOld(t[0], t[1]); if(!z || z.flip) return; const p = v46N(z, t[0], t[1]); put({t:3, x:p[0], y:p[1], r:t, i, pine:forest && t[2] === 'pine'}); });
  try { zt(TREES, false); zt(FOREST_TREES, true); } catch(e){}
  M.grid = G; M.gridSrc = V46T.deco; return G;
}
// ---------- khối nhà đứng: phòng học trường, nhà phố, cổng trường, sân bay + tháp v57p ----------
function v60tBoxes(){
  const M = V60T_M; if(M.boxes) return M.boxes; const B = [];
  const add = (id, rr, h, roof, w1, w2) => { const z = V46.ZI[id]; if(!z || z.flip || !rr || !rr.w) return; B.push([rr.x + z.d[0], rr.y + z.d[1], rr.x + rr.w + z.d[0], rr.y + rr.h + z.d[1], h, roof, w1, w2, 0, id]); };
  try { add('rubik', R.rubik, 64, '#c4583f', '#f3e6cc', '#e2d0ae'); add('chess', R.chess, 64, '#3f6fc4', '#f1ead8', '#ddd2b8'); add('music', R.music, 64, '#8e4fc4', '#f4e9d6', '#e0d2b6');
    add('hall', R.hall, 92, '#b8433a', '#f6efe0', '#e4d8bf'); add('office', R.office, 58, '#4f8a5a', '#efe8d6', '#dcd2ba'); add('elec', R.elec, 64, '#d08a2a', '#f2e8d4', '#ded2b6'); } catch(e){}
  try { const z = V46.ZI.houses; if(z) HOUSES.forEach((h, i) => B.push([h.x + z.d[0], h.y + z.d[1], h.x + h.w + z.d[0], h.y + h.h + z.d[1], 46 + (i % 3)*10, ['#c4583f', '#5a7fb8', '#7a5a3a', '#4f8a5a'][i % 4], '#f4ead6', '#e0d4bb', 0, 'h' + i])); } catch(e){}
  try { const G = v46Gate(); B.push([G[0] - 92, G[1] - 12, G[0] - 74, G[1], 70, '#8a4a36', '#7a3b2a', '#6a3022', 0, 'g'], [G[0] + 74, G[1] - 12, G[0] + 92, G[1], 70, '#8a4a36', '#7a3b2a', '#6a3022', 0, 'g'], [G[0] - 104, G[1] - 11, G[0] + 104, G[1] - 1, 28, '#c25a3f', '#b0472f', '#9c3c27', 66, 'g']); } catch(e){}
  try { if(typeof V57P !== 'undefined' && V57P.boxes) V57P.boxes.forEach(b => B.push(b)); } catch(e){}
  M.boxes = B; return B;
}

// ---------- nhân vật nhìn từ sau lưng (toạ độ cục bộ, chân ở y=0, cao ~35, giống drawBody) ----------
function v60tBack(g, a, mv, walk, ride){
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const ph = mv ? Math.floor(walk*1.5) % 6 : 0, lA = mv ? [0, 1, 2, 2, 1, 0][ph] : 0, lB = mv ? [2, 1, 0, 0, 1, 2][ph] : 0, aw = mv ? [1, 1, 0, -1, -1, 0][ph] : 0;
  const pants = a.pants || '#33507a', shirt = a.shirt || '#ef4b4b', skin = a.skin || '#f1c9a5', hair = a.hair || '#2a1d14';
  let by = mv && (ph === 1 || ph === 4) ? -1 : 0;
  if(ride){
    // xe đạp nhìn từ sau: bánh sau (mỏng), chắn bùn, yên, ghi đông phía trước
    const col = a.bag || shirt, pd = mv ? Math.sin(walk*1.1)*3 : 0;
    R('#2a2a30', -9, -24, 18, 2); R('#1d1d22', -11, -25, 3, 3); R('#1d1d22', 8, -25, 3, 3);   // ghi đông
    R('#1d1d22', -2, -14, 4, 14); R('#55555f', -1, -13, 2, 12); R('#9aa0aa', -1, -8, 2, 2);  // bánh sau + nan
    R(col, -2, -16, 4, 4); R('rgba(0,0,0,.25)', -2, -13, 4, 1); R('#ff4a3a', -1, -11, 2, 2);  // chắn bùn + đèn hậu
    R('#2a2a30', -3, -18, 6, 2);                                                              // yên
    R(pants, -6, -16, 4, 8 + pd); R(pants, 2, -16, 4, 8 - pd); R('#222', -6, -9 + pd, 4, 2); R('#222', 2, -9 - pd, 4, 2);
    by = -8;
  } else if(a.skirt){ R(pants, -6, -12, 12, 9); R('#222', -5, -3, 4, 3); R('#222', 1, -3, 4, 3); }
  else { R(pants, -5, -10, 4, 8 - lA); R(pants, 1, -10, 4, 8 - lB); R('#222', -5, -2 - lA, 4, 2); R('#222', 1, -2 - lB, 4, 2); }
  // tay hai bên (đạp xe: đưa ra trước nắm ghi đông)
  if(ride){ R(skin, -8, -20 + by, 2, 6); R(skin, 6, -20 + by, 2, 6); }
  else { R(skin, -8, -20 + by - aw, 2, 8); R(skin, 6, -20 + by + aw, 2, 8); }
  // lưng áo
  R(shirt, -6, -21 + by, 12, 12); if(a.aodai) R(shirt, -6, -21 + by, 12, 16);
  R('rgba(0,0,0,.14)', -6, -10 + by, 12, 1); R('rgba(0,0,0,.08)', 0, -20 + by, 1, 10); R('rgba(255,255,255,.12)', -6, -21 + by, 12, 1);
  // ba lô học sinh
  if(a.student && a.bag){ R(a.bag, -5, -20 + by, 10, 9); R('rgba(0,0,0,.22)', -5, -13 + by, 10, 2); R('rgba(255,255,255,.25)', -3, -18 + by, 6, 2); R('#2a2a30', -5, -21 + by, 1, 3); R('#2a2a30', 4, -21 + by, 1, 3); }
  // áo choàng v50 (nếu đang mặc)
  try { if(a === PLAYER && typeof v50State === 'function'){ const s = v50State(); if(s.wear && (s.house >= 0 || s.own.length > 1 || s.robe.c !== 1)){
    const col = (V50_ROBE_COLS[s.robe.c] || V50_ROBE_COLS[1])[0], sw = mv ? Math.sin(walk*1.6)*1.4 : 0, sty = s.robe.s, L = sty === 3 ? 11 : ride ? 12 : 19, dk = 'rgba(0,0,0,.24)';
    R(col, -7, -22 + by, 14, 3); g.fillStyle = col; g.beginPath(); g.moveTo(-7, -20 + by); g.lineTo(7, -20 + by); g.lineTo(8 + sw, -20 + by + L); g.lineTo(-8 + sw, -20 + by + L); g.closePath(); g.fill();
    R(dk, -3 + sw*.5, -18 + by, 1, L - 2); R(dk, 2 + sw*.5, -18 + by, 1, L - 2); R(dk, -8 + sw, -21 + by + L, 16, 1);
    if(sty === 1){ R(col, -5, -27 + by, 10, 6); R(dk, -5, -22 + by, 10, 1); }
    if(sty === 2){ R('#ffd23f', -8 + sw, -22 + by + L, 16, 1); } } } } catch(e){}
  // cổ + đầu nhìn từ sau: tóc phủ kín, tai hai bên
  R(skin, -2, -23 + by, 4, 2); R(skin, -6, -29 + by, 1, 3); R(skin, 5, -29 + by, 1, 3);
  R(hair, -5, -33 + by, 10, 11); R(hair, -6, -32 + by, 12, 8); R('rgba(255,255,255,.14)', -3, -32 + by, 4, 1); R('rgba(0,0,0,.12)', -5, -23 + by, 10, 1);
  if(a.long){ R(hair, -6, -25 + by, 12, 6); R(hair, -5, -19 + by, 10, 2); }
  if(a.cap){ R(a.cap, -6, -35 + by, 12, 4); R(a.cap, -6, -31 + by, 12, 2); R('#e8e8e8', -1, -30 + by, 2, 1); }
}

// ---------- vẽ một khung hình góc sau lưng ----------
function v60tFrame(dt){
  const P = PLAYER, M = V60T_M; v60tSetup(); const g = M.g, bg = M.bg, bw = M.bw, bh = M.bh, q = M.q;
  const p = v46Pos(P), px = p[0], py = p[1], ride = !!P.cycling;
  let dh = V60T.hdg - V60T.ch; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); if(Math.abs(dh) > 2.6) V60T.ch = V60T.hdg; else V60T.ch += dh*Math.min(1, dt*5.5);
  const hdg = V60T.ch, portrait = bh > bw*1.2, F = Math.sqrt(bw*bh)*.74, yh = Math.round(bh*.382), chS = bh*(portrait ? .2 : .3), D = 36*F/chS*(ride ? 1.12 : 1), H = (portrait ? .4 : .42)*bh*D/F;
  const fx = Math.cos(hdg), fy = Math.sin(hdg), rx = -fy, ry = fx, cX = px - fx*D, cY = py - fy*D;
  M.C = {cX, cY, fx, fy, rx, ry, F, yh, H, bw, bh, q, D};
  const dark = Math.max(0, (typeof lightLevel === 'function' ? lightLevel() : 0) - .05), night = v57pSm(.2, .5, dark), w = weather || '';
  // 1) bầu trời + sao + mặt trời / mặt trăng
  const sky = v57pSkyImg(), SM = V57P_M; g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(sky, 0, 0, 1, 64, 0, 0, bw, yh + 2);
  const fov = Math.atan(bw/2/F) + .15;
  if(night > .02){ g.fillStyle = '#fff'; for(const s of M.stars){ let r = s[0] - hdg; r = Math.atan2(Math.sin(r), Math.cos(r)); if(Math.abs(r) > fov) continue; const y = yh - Math.tan(s[1])*F*.7; if(y < 0 || y > yh - 3) continue; g.globalAlpha = night*s[2]*(.75 + .25*Math.sin(realT*2 + s[0]*9))*(/mua|bao|suongmu/.test(w) ? .25 : 1); g.fillRect(Math.round(bw/2 + Math.tan(r)*F), Math.round(y), 1, 1); } g.globalAlpha = 1; }
  const t = typeof clock === 'number' ? clock : 720, sa = (t - 360)/720*Math.PI, se = Math.sin(sa)*.75, day = se > -.1;
  { const az = day ? sa : sa + Math.PI, el = day ? se : -se; let r = az - hdg; r = Math.atan2(Math.sin(r), Math.cos(r)); if(Math.abs(r) < fov && el > -.05){ const x = bw/2 + Math.tan(r)*F, y = yh - Math.tan(Math.max(.03, el))*F*.55, rad = Math.max(3, bw*.026);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = day ? .55 : .3; g.drawImage(v51pGlow(day ? 'rgba(255,220,150,1)' : 'rgba(200,215,255,1)'), x - rad*4, y - rad*4, rad*8, rad*8); g.globalCompositeOperation = 'source-over';
      g.globalAlpha = /mua|bao|suongmu/.test(w) ? .35 : 1; g.fillStyle = day ? '#fff4c8' : '#e8eefc'; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); if(!day){ g.fillStyle = SM.hor || '#1b2550'; g.globalAlpha *= .55; g.beginPath(); g.arc(x + rad*.45, y - rad*.2, rad*.9, 0, 7); g.fill(); } g.globalAlpha = 1; } }
  // mây trên trời: lưới cố định, trôi chậm
  { const CL = 2400, rainy = /mua|bao|loc|samset|suongmu/.test(w), th = rainy ? .7 : .4, cxm = px + fx*9000, cym = py + fy*9000; let n = 0;
    for(let i = Math.floor((cxm - 9000)/CL); i <= Math.floor((cxm + 9000)/CL); i++) for(let j = Math.floor((cym - 9000)/CL); j <= Math.floor((cym + 9000)/CL); j++){
      if(v57pHash(i, j, 21) > th || n > 18) continue; const x = i*CL + v57pHash(i, j, 22)*CL*.8 + realT*10, y = j*CL + v57pHash(i, j, 23)*CL*.8, dx = x - cX, dy = y - cY, z = dx*fx + dy*fy; if(z < 2500 || z > 18000) continue;
      const sx = bw/2 + (dx*rx + dy*ry)*F/z, alt = 1300 + v57pHash(i, j, 24)*900, sy = yh + (H - alt)*F/z, ww = 1500*F/z, hh = ww*.45; if(sx + ww/2 < 0 || sx - ww/2 > bw || sy - hh > yh) continue;
      g.globalAlpha = Math.min(1, (z - 2500)/2500)*(rainy ? .95 : .8)*(1 - night*.5); g.drawImage(v51pCloud(), sx - ww/2, sy - hh*.6, ww, hh); n++; }
    g.globalAlpha = 1; }
  // 2) mặt đất: 5 tầng, mỗi tầng xoay ảnh nền theo hướng nhìn một lần rồi chiếu từng dải ngang
  v60tNG(px, py);
  const ov = v46Overview(), s = V46T.OVS, zMin = H*F/Math.max(1, bh - yh), zFar = 34000;
  let za = zMin, nT = 0;
  for(let k = 0; k < 5 && za < zFar; k++){ const T = M.L[k], zb = Math.min(zFar, za*(k === 0 ? 3 : 4)), hw = bw/2*zb/F*1.03, kx = 256/(2*hw), ky = 192/(zb - za), Lg = T.g;
    T.za = za; T.zb = zb; T.hw = hw; T.kx = kx; T.ky = ky; Lg.setTransform(1, 0, 0, 1, 0, 0); Lg.globalAlpha = 1; Lg.fillStyle = M.seaC; Lg.fillRect(0, 0, 256, 192);
    const e = kx*(hw - rx*cX - ry*cY), f = ky*(zb + fx*cX + fy*cY); Lg.imageSmoothingEnabled = false;
    if(za < V60T_NG*.5){ Lg.setTransform(kx*rx/s, -ky*fx/s, kx*ry/s, -ky*fy/s, e, f); Lg.drawImage(ov, 0, 0); Lg.setTransform(kx*rx, -ky*fx, kx*ry, -ky*fy, e, f); Lg.drawImage(M.NG, M.ngx0, M.ngy0); }
    else { Lg.setTransform(kx*rx/s, -ky*fx/s, kx*ry/s, -ky*fy/s, e, f); Lg.drawImage(ov, 0, 0); }
    za = zb; nT = k + 1; }
  const zEnd = M.L[nT - 1].zb, y0 = Math.max(0, yh + 1);
  for(let y = y0, ti = 0; y < bh; y++){ const z = H*F/(y + .5 - yh); if(z >= zEnd) continue; let T = M.L[ti]; if(z >= T.zb || z < T.za){ for(ti = 0; ti < nT; ti++) if(z >= M.L[ti].za && z < M.L[ti].zb) break; if(ti >= nT){ ti = 0; continue; } T = M.L[ti]; }
    const hw = bw/2*z/F; g.drawImage(T.c, T.kx*(T.hw - hw), Math.min(191, T.ky*(T.zb - z)), T.kx*2*hw, 1, 0, y, bw, 1); }
  // màu mùa + tuyết + đêm phủ lên mặt đất
  const gy0 = yh + 1, gh = bh - gy0;
  try { g.fillStyle = S().tint; g.fillRect(0, gy0, bw, gh); } catch(e){}
  if(/tuyet/.test(w)){ g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, gy0, bw, gh); }
  if(dark > .05){ g.fillStyle = 'rgba(8,12,34,' + Math.min(.62, dark*1.05).toFixed(3) + ')'; g.fillRect(0, gy0, bw, gh); }
  // sương xa chân trời
  g.drawImage(SM.fog, 0, 0, 1, 32, 0, yh - 2, bw, Math.max(6, bh*.07));
  // 3) chỉ đường v59g (dấu chân + gió) trên mặt đất phối cảnh
  try { v60tGuide(g, M.C); } catch(e){}
  // 4) vật đứng: cây, đèn, khối nhà, người, NPC, người chơi online, chính mình — xa vẽ trước, vào lớp riêng để phủ đêm đúng chỗ
  M.items.length = 0; M.cnt = 0; M.lampS.length = 0;
  const see = (x, y, far, pad) => { const dx = x - cX, dy = y - cY, z = dx*fx + dy*fy; return z > 14 && z < far && Math.abs(dx*rx + dy*ry) < z*bw/2/F + pad ? z : 0; };
  const G = v60tGrid(), RG = 2000, gx0 = Math.floor((cX + fx*RG*.5 - RG*.6)/V60T_GC), gx1 = Math.floor((cX + fx*RG*.5 + RG*.6)/V60T_GC), gy0c = Math.floor((cY + fy*RG*.5 - RG*.6)/V60T_GC), gy1 = Math.floor((cY + fy*RG*.5 + RG*.6)/V60T_GC);
  for(let i = gx0; i <= gx1; i++) for(let j = gy0c; j <= gy1; j++){ const a = G.get(i*4096 + j); if(!a) continue; for(const o of a){ const z = see(o.x, o.y, RG, 70); if(z) v60tItem(z, o.t, o.r, o.x, o.y, o.pine ? 1 : 0, o.i); } }
  for(const b of v60tBoxes()){ if(b[9] && R[b[9]] && P._z === b[9] && !v46Raw(P.x)) continue; const z = see((b[0] + b[2])/2, (b[1] + b[3])/2, 9000, Math.max(b[2] - b[0], b[3] - b[1])); if(!z) continue; let zm = 1e9; for(let c = 0; c < 4; c++){ const zc = (b[c === 1 || c === 2 ? 2 : 0] - cX)*fx + (b[c > 1 ? 3 : 1] - cY)*fy; if(zc < zm) zm = zc; } if(zm > 48) v60tItem(z, 7, b); }
  for(const a of agents){ if(a === P || !a.visible || a.inSub) continue; const q2 = v46Pos(a), z = see(q2[0], q2[1], 1500, 40); if(z) v60tItem(z, 4, a, q2[0], q2[1]); }
  try { for(const n of npcs){ if(!npcShown(n)) continue; const zn = v46ZoneOld(n.x, n.y); if(!zn || zn.flip) continue; const q2 = v46N(zn, n.x, n.y), z = see(q2[0], q2[1], 1500, 40); if(z) v60tItem(z, 5, n, q2[0], q2[1]); } } catch(e){}
  try { const pe = (typeof ONLINE !== 'undefined' && ONLINE.peers) || []; for(const o of pe){ const pr = o.presence; if(!pr || pr.x == null) continue; const q2 = v46Raw(+pr.x) ? [+pr.x - V46E, +pr.y] : v46ToNew(+pr.x, +pr.y), z = see(q2[0], q2[1], 1500, 40); if(z) v60tItem(z, 6, o, q2[0], q2[1]); } } catch(e){}
  v60tItem((px - cX)*fx + (py - cY)*fy, 0, P, px, py);
  M.items.sort((a, b) => a.z - b.z); const it = M.items, st = it.length > V60T_CAP*(M.slow ? .6 : 1) ? Math.floor(V60T_CAP*(M.slow ? .6 : 1)) : it.length;
  bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalAlpha = 1; bg.globalCompositeOperation = 'source-over'; bg.clearRect(0, 0, bw, bh); bg.imageSmoothingEnabled = false;
  const prev = ctx; ctx = bg; let se2 = null; try { se2 = S(); } catch(e){}
  try { for(let n = st - 1; n >= 0; n--) v60tDrawItem(bg, it[n], M.C, se2, dt, dark); }
  finally { ctx = prev; bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalAlpha = 1; }
  if(dark > .05){ bg.globalCompositeOperation = 'source-atop'; bg.fillStyle = 'rgba(8,12,34,' + Math.min(.55, dark*.95).toFixed(3) + ')'; bg.fillRect(0, 0, bw, bh); bg.globalCompositeOperation = 'source-over'; }
  if(/suongmu/.test(w)){ bg.globalCompositeOperation = 'source-atop'; bg.globalAlpha = .28; bg.fillStyle = SM.hor || '#cfd6de'; bg.fillRect(0, 0, bw, bh); bg.globalAlpha = 1; bg.globalCompositeOperation = 'source-over'; }
  g.drawImage(M.BB, 0, 0);
  // 5) đêm: bật đèn đường (quầng sáng + vũng sáng dưới chân đèn)
  if(dark > .05){ const k = Math.min(1, dark*2.2), gl = v51pGlow('rgba(255,236,170,1)'); g.globalCompositeOperation = 'lighter';
    for(const l of M.lampS){ const r = Math.max(2, l[2]*14); g.globalAlpha = k*.9; g.drawImage(gl, l[0] - r, l[1] - r, r*2, r*2); g.globalAlpha = k*.35; g.drawImage(gl, l[0] - r*2.4, l[3] - r*.7, r*4.8, r*1.4); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if(/suongmu/.test(w)){ g.globalAlpha = .5; g.drawImage(SM.fog, 0, 0, 1, 32, 0, yh - 3, bw, bh*.62); g.globalAlpha = 1; }
  // 6) phóng buffer lên màn hình
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.drawImage(M.B, 0, 0, bw*q*DPR, bh*q*DPR); ctx.restore();
  // 7) thời tiết + chớp + chấm sáng ở cửa / điểm mini game gần
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  try { v51pDrawRain(dt); } catch(e){}
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  try { v60tDoors(M.C); } catch(e){}
  if(typeof flash === 'number' && flash > 0){ ctx.fillStyle = 'rgba(235,240,255,' + (flash*.3).toFixed(3) + ')'; ctx.fillRect(0, 0, cw, ch); }
  if(typeof fade === 'number' && fade > 0){ ctx.fillStyle = 'rgba(5,8,20,' + fade.toFixed(3) + ')'; ctx.fillRect(0, 0, cw, ch); }
  // FPS: thấp thì giảm độ phân giải + bớt billboard
  M.fpsN++; M.fpsT += dt; if(M.fpsT >= 1){ M.fps = M.fpsN/M.fpsT; M.fpsN = 0; M.fpsT = 0; }
  if(M.fps < 40 && !M.slow && realT > M.slowT){ M.slow = true; M.slowT = realT + 8; } else if(M.slow && M.fps > 57 && realT > M.slowT){ M.slow = false; M.slowT = realT + 8; }
}
// ---------- vẽ một vật đứng ----------
function v60tDrawItem(g, o, C, se, dt, dark){
  const z = o.z, k = C.F/z, sx = C.bw/2 + ((o.x - C.cX)*C.rx + (o.y - C.cY)*C.ry)*k, sy = C.yh + C.H*k;
  if(o.t === 7){ g.globalAlpha = 1 - v57pSm(6500, 9000, z); v60tBox(g, o.r, C, dark); g.globalAlpha = 1; return; }
  if(sx < -80*k - 4 || sx > C.bw + 80*k + 4 || sy - 90*k > C.bh) return;
  if(o.t !== 0 && z < C.D*.6) return;   // sát camera: bỏ, khỏi che màn hình
  g.globalAlpha = o.t === 0 ? 1 : (1 - v57pSm(1500, 2000, z))*(z < C.D*.92 ? .42 : 1);   // vật chắn giữa camera và nhân vật: mờ đi
  if(o.t === 1){ g.setTransform(k, 0, 0, k, sx - k*o.x, sy - k*o.y); if(k < .12){ g.fillStyle = o.r.k === 1 ? '#2f7d4a' : (se && se.leaf) || '#4cae49'; g.fillRect(o.x - 12, o.y - 40*(o.r.s || 1), 24, 34*(o.r.s || 1)); } else v46Tree(g, o.r, se || {}); }
  else if(o.t === 2){ g.setTransform(k, 0, 0, k, sx - k*o.x, sy - k*o.y); const x = o.x, y = o.y; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - 5, y - 1, 12, 4); g.fillStyle = '#3a3f4f'; g.fillRect(x - 2, y - 40, 4, 40); g.fillRect(x - 6, y - 2, 12, 3);
    g.fillStyle = '#2b2f3a'; g.fillRect(x - 7, y - 48, 14, 9); g.fillStyle = dark > .1 ? '#fff3c4' : '#ffe39a'; g.fillRect(x - 5, y - 46, 10, 5); if(dark > .05 && V60T_M.lampS.length < 80) V60T_M.lampS.push([sx, sy - 44*k, k, sy]); }
  else if(o.t === 3){ const tr = o.r; g.setTransform(k, 0, 0, k, sx - k*tr[0], sy - k*tr[1]); if(o.a) drawPine(tr[0], tr[1], o.i); else drawTree(tr, o.i); }
  else if(o.t === 4){ const a = o.r; if(v46Raw(a.x)){ const ox = a.x, oy = a.y; a.x = 1605; a.y = 400; g.setTransform(k, 0, 0, k, sx - k*1605, sy - k*400); try { drawPerson(a); } finally { a.x = ox; a.y = oy; } } else { g.setTransform(k, 0, 0, k, sx - k*a.x, sy - k*a.y); drawPerson(a); } }
  else if(o.t === 5){ const n = o.r; g.setTransform(k, 0, 0, k, sx - k*n.x, sy - k*n.y); drawNpc(n); }
  else if(o.t === 6){ const pr = o.r.presence, cp = {peer:o.r.peer, presence:Object.assign({}, pr, {x:1605, y:400})}, keep = ONLINE.peers, vb = VB, sp = []; ONLINE.peers = [cp]; VB = {x0:1400, y0:200, x1:1800, y1:600};
    try { onlineSprites(sp); } finally { ONLINE.peers = keep; VB = vb; } g.setTransform(k, 0, 0, k, sx - k*1605, sy - k*400); sp.forEach(s2 => { try { s2.f(); } catch(e){} }); }
  else if(o.t === 0){ const a = o.r, ride = !!a.cycling, mv = !!(a.moving || V60T.mv), sq = C.H/Math.hypot(z, C.H), lean = Math.max(-.12, Math.min(.12, V60T.turn*(ride ? .14 : .06)));
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = .3; g.fillStyle = '#000'; g.beginPath(); g.ellipse(sx, sy, (ride ? 9 : 10)*k, (ride ? 16 : 10)*k*sq, 0, 0, 7); g.fill(); g.globalAlpha = 1;
    const c = Math.cos(lean), sn = Math.sin(lean); g.setTransform(k*c, k*sn, -k*sn, k*c, sx, sy); v60tBack(g, a, mv, a.walk || V60T.walk || 0, ride); }
  g.globalAlpha = 1;
}
// khối nhà: tường + mái như v57pBox, thêm hàng cửa sổ (sáng đèn ban đêm) và viền mái
function v60tBox(g, b, C, dark){
  const cs = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]], z0 = b[8] || 0, h = b[4], P = [];
  for(const c of cs){ const dx = c[0] - C.cX, dy = c[1] - C.cY, z = dx*C.fx + dy*C.fy; if(z < 25) return; const k = C.F/z; P.push([C.bw/2 + (dx*C.rx + dy*C.ry)*k, C.yh + (C.H - z0)*k, C.yh + (C.H - z0 - h)*k, z]); }
  g.setTransform(1, 0, 0, 1, 0, 0); const top = () => { g.fillStyle = b[5]; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[2]) : g.moveTo(p[0], p[2])); g.closePath(); g.fill(); };
  if(C.H < z0 + h) top();
  const W = [0, 1, 2, 3].map(i => [i, (P[i][3] + P[(i + 1) % 4][3])/2]).sort((a, c) => c[1] - a[1]), win = dark > .12 ? 'rgba(255,214,120,.95)' : 'rgba(70,110,150,.75)';
  for(const [i] of W){ const p = P[i], q = P[(i + 1) % 4];
    g.fillStyle = i % 2 ? b[6] : b[7]; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.lineTo(q[0], q[2]); g.lineTo(p[0], p[2]); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; const L = (u, v) => [p[0] + (q[0] - p[0])*u, p[1] + (q[1] - p[1])*u + ((p[2] + (q[2] - p[2])*u) - (p[1] + (q[1] - p[1])*u))*v];
    { const a = L(0, .92), c = L(1, .92), d = L(1, 1), e = L(0, 1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.lineTo(e[0], e[1]); g.closePath(); g.fill(); }
    const len = Math.hypot(cs[(i + 1) % 4][0] - cs[i][0], cs[(i + 1) % 4][1] - cs[i][1]), nc = Math.min(10, Math.floor(len/46)), nr = Math.max(1, Math.min(4, Math.floor(h/30))), px = Math.abs(q[0] - p[0]);
    if(nc < 1 || px < nc*3 || b[9] === 'g') continue; g.fillStyle = win;
    for(let cI = 0; cI < nc; cI++) for(let rI = 0; rI < nr; rI++){ const u0 = (cI + .3)/nc, u1 = (cI + .7)/nc, v0 = (rI + .35)/(nr + .3), v1 = (rI + .75)/(nr + .3);
      const a = L(u0, v0), c = L(u1, v0), d = L(u1, v1), e = L(u0, v1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.lineTo(e[0], e[1]); g.closePath(); g.fill(); } }
  if(C.H >= z0 + h){ top(); g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[2]) : g.moveTo(p[0], p[2])); g.closePath(); g.stroke(); }
}
// ---------- dấu chân + gió v59g chiếu lên mặt đất phối cảnh ----------
function v60tPj(C, x, y){ const dx = x - C.cX, dy = y - C.cY, z = dx*C.fx + dy*C.fy; if(z < 12) return null; return [C.bw/2 + (dx*C.rx + dy*C.ry)*C.F/z, C.yh + C.H*C.F/z, z]; }
function v60tGuide(g, C){
  if(typeof GUIDE === 'undefined' || !GUIDE || typeof v46GuideRoute !== 'function') return; const pts = v46GuideRoute(); if(!pts || pts.length < 2) return;
  const to = pts[pts.length - 1], tap = typeof V58T !== 'undefined' && V58T.tap;
  if(!tap){ const wave = (realT*5) % (V59G.MAX + 14), col = season === 'dong' ? 'rgba(120,140,160,.8)' : 'rgba(92,64,38,.85)'; g.fillStyle = col;
    v59gWalk(pts, V59G.STEP, (x, y, ux, uy, i) => { if(i === 0 || i > V59G.MAX) return; const sd = i % 2 ? 1 : -1, cx = x - uy*sd*6, cy = y + ux*sd*6, a = v60tPj(C, cx, cy); if(!a || a[2] > 2200) return;
      const b = v60tPj(C, cx + ux, cy + uy), c = v60tPj(C, cx - uy, cy + ux); if(!b || !c) return; const fade = 1 - i/V59G.MAX, lit = Math.max(0, 1 - Math.abs(i - wave)/7);
      g.setTransform((b[0] - a[0])*1.6, (b[1] - a[1])*1.6, (c[0] - a[0])*1.6, (c[1] - a[1])*1.6, a[0], a[1]); g.globalAlpha = Math.min(1, .6*fade + .4*lit*fade + .15);
      g.beginPath(); g.ellipse(1.5, 0, 4.6, 2.9, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-4.6, 0, 2.2, 2.1, 0, 0, 7); g.fill(); });
    // gió: làn trắng mảnh trôi dọc lộ trình
    g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = '#fff'; g.lineWidth = 1; let tot = 0; const segs = []; for(let k = 1; k < pts.length; k++){ const L = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); segs.push([pts[k - 1], pts[k], L, tot]); tot += L; }
    const at = d => { for(const [a, b, L, t0] of segs) if(d <= t0 + L){ const u = L ? (d - t0)/L : 0; return [a[0] + (b[0] - a[0])*u, a[1] + (b[1] - a[1])*u, (b[0] - a[0])/(L || 1), (b[1] - a[1])/(L || 1)]; } return null; };
    const span = Math.min(700, tot); if(span > 60) for(let wv = 0; wv < 4; wv++){ const ph = (realT*.22 + wv*.25) % 1, q = at(ph*span); if(!q) continue; const [x, y, ux, uy] = q, off = (wv % 2 ? 1 : -1)*(10 + wv*5), len = 46, nx = -uy, ny = ux;
      const A = v60tPj(C, x + nx*off - ux*len, y + ny*off - uy*len), B = v60tPj(C, x + nx*(off + 8), y + ny*(off + 8)), E = v60tPj(C, x + nx*off + ux*len*.6, y + ny*off + uy*len*.6); if(!A || !B || !E) continue;
      g.globalAlpha = Math.sin(ph*Math.PI)*.5; g.beginPath(); g.moveTo(A[0], A[1]); g.quadraticCurveTo(B[0], B[1], E[0], E[1]); g.stroke(); } }
  const d = v60tPj(C, to[0], to[1]); if(d){ const k = C.F/d[2], sq = C.H/Math.hypot(d[2], C.H), pl = 1 + .12*Math.sin(realT*2.4); g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = .45; g.fillStyle = '#fff4d2'; g.beginPath(); g.ellipse(d[0], d[1], Math.max(3, 30*k*pl), Math.max(1.5, 30*k*sq*pl), 0, 0, 7); g.fill();
    g.globalAlpha = .9; g.fillRect(Math.round(d[0]) - 1, Math.round(d[1] - Math.max(6, 60*k)), 2, Math.max(6, 60*k)); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
}
// ---------- cửa / điểm mini game ở gần: chấm sáng nhẹ (chạm vào để mở), lưu toạ độ màn hình cho v60tTap ----------
function v60tDoors(C){
  const M = V60T_M, P = PLAYER;
  if(realT - M.doorsT > .5){ M.doorsT = realT; M.doorsN.length = 0; try { const pp = v46Pos(P); for(const d of DOORS()){ const n = v46ToNew(d.x, d.y); if(Math.hypot(n[0] - pp[0], n[1] - pp[1]) < 900) M.doorsN.push([d, n[0], n[1]]); } } catch(e){} }
  M.doors.length = 0; const q = C.q;
  for(const [d, x, y] of M.doorsN){ const a = v60tPj(C, x, y); if(!a || a[2] > 900) continue; const sx = a[0]*q, sy = a[1]*q, k = C.F/a[2]*q; if(sx < -20 || sx > cw + 20 || sy < 0 || sy > ch + 20) continue;
    M.doors.push([d, sx, sy - 14*k]); const near = d === NEAR_DOOR, pl = 1 + .18*Math.sin(realT*4 + x*.01), r = Math.max(5, 15*k)*pl;
    ctx.globalAlpha = near ? .85 : .55; ctx.fillStyle = 'rgba(255,233,168,.4)'; ctx.beginPath(); ctx.ellipse(sx, sy, r, r*.42, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff6d6'; ctx.beginPath(); ctx.arc(sx, sy - 14*k, Math.max(2.5, 3.2*k), 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
