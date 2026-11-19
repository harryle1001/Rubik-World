// ================= v65d · 3/3 PHỐ NHÀ & CỬA HÀNG NGƯỜI CHƠI + CHỢ: nhà NA theo kiểu lô (giữ nguyên dữ liệu STREET), quầy chợ, người đi chợ NA =================
// Nhà của bạn, cửa hàng của bạn, nhà/cửa hàng bạn khác đăng: vẫn lấy từ STREET (tên, loại, màu) như cũ — chỉ đổi cách vẽ.
const V65D_PST = {vn:{sty:12}, jp:{sty:0, roof:'rgba(40,52,74,.55)'}, eu:{sty:8, chim:1}, mod:{sty:4, glass:1}, wood:{sty:0, roof:'rgba(96,58,30,.45)', wall:'rgba(120,72,36,.35)'}};
// một lô: canvas 195 × 208, chân nhà ở y = 196 (tương ứng gy = P.y + P.h - 6)
function v65dPlotSpr(i, s){
  const st = v48mPlotStyle(i), shop = s.kind === 'shop' || s.kind === 'pshop', col = s.col || '#90caf9', key = ['pl', st, shop ? 1 : 0, col, s.own ? 1 : 0, season].join('|');
  return v65dCv(key, 195, 208, g => {
    const C = V65D_PST[st] || V65D_PST.vn, W = 160, x = 18, y = 36, gy = 196;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 6, gy - 6, W - 12, 8);
    if(C.chim) v65dChimney(g, x + W - 44, y - 12);
    const S = v65dHouse(g, C.sty, x, y, 5, 3, 2, [2], 2);
    if(C.roof) v65dTint(g, x, y, W, S.wallY - y, C.roof); if(C.wall) v65dTint(g, x, S.wallY, W, gy - S.wallY, C.wall);
    v65dSnow(g, x, y, W, S.wallY - y);
    if(C.glass){ g.fillStyle = V65D_K; g.fillRect(x + 14, S.wallY + 6, W - 28, 22); g.fillStyle = '#8fd3ef'; g.fillRect(x + 16, S.wallY + 8, W - 32, 18); g.fillStyle = 'rgba(255,255,255,.5)'; for(let k = 0; k < 4; k++) g.fillRect(x + 22 + k*32, S.wallY + 10, 8, 14); }
    if(st === 'jp') [x + 40, x + W - 50].forEach(lx => { g.fillStyle = V65D_K; g.fillRect(lx, S.wallY + 36, 12, 16); g.fillStyle = '#e0473f'; g.fillRect(lx + 1, S.wallY + 37, 10, 14); g.fillStyle = '#ffd27a'; g.fillRect(lx + 4, S.wallY + 41, 4, 6); });
    if(st === 'eu' || st === 'vn') for(const k of [0, 1, 3, 4]) v65dFlowerBox(g, x + k*32 + 7, S.wallY + 56, i + k);
    if(shop){ v65dAwning(g, x + 6, S.wallY + 32, W - 12, col, 14); g.font = '18px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🛒', x + W/2, S.wallY + 14); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
    if(s.own){ const fx = x + W - 34, fy = y + 6; g.fillStyle = V65D_K; g.fillRect(fx - 2, fy, 4, 40); g.fillRect(fx + 1, fy - 1, 26, 18); g.fillStyle = col; g.fillRect(fx + 2, fy, 24, 16); g.fillStyle = '#fff6e0'; g.font = "900 16px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', fx + 14, fy + 9); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
    for(const bx of [4, 172]){ if(v64sDong()) v64sT(g, 'N', 1, 12, bx, gy - 30, 1, 1, 2); else v64sT(g, 'N', (i + bx) % 2, 10, bx, gy - 30, 1, 1, 2); }
  });
}
function v65dStreetSprites(sp){
  const r = R.pstreet; if(VB.x1 < r.x || VB.x0 > r.x + r.w || VB.y0 > r.y + r.h || VB.y1 < r.y) return;
  PLOTS.forEach((P, i) => { const s = STREET[i]; if(!s) return; sp.push({y:P.y + P.h - 6, f:() => {
    const x = P.x, gy = P.y + P.h - 6, cv = v65dPlotSpr(i, s), st = v48mPlotStyle(i);
    let behind = false; try { behind = PLAYER && PLAYER.y < gy - 6 && PLAYER.y > gy - 150 && PLAYER.x > x + 24 && PLAYER.x < x + P.w - 24; } catch(e){}
    if(behind) ctx.globalAlpha = .5; ctx.drawImage(cv, x, gy - 196, 195, 208); ctx.globalAlpha = 1;
    const near = PLAYER && Math.hypot(PLAYER.x - (x + P.w/2), PLAYER.y - (P.y + P.h + 4)) < 40, t = (s.name || '').slice(0, 26);
    ctx.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; const tw = ctx.measureText(t).width + 20, ty = gy - 196 + (s.own ? 2 : 8);
    ctx.fillStyle = V65D_O; ctx.fillRect(x + P.w/2 - tw/2 - 2, ty - 2, tw + 4, 28); ctx.fillStyle = near ? '#ffd23f' : '#b97a45'; ctx.fillRect(x + P.w/2 - tw/2, ty, tw, 24); ctx.fillStyle = near ? '#fff3a0' : '#d99a5c'; ctx.fillRect(x + P.w/2 - tw/2, ty, tw, 4);
    ctx.fillStyle = near ? '#2b1a10' : '#fff6e0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x + P.w/2, ty + 13); ctx.textBaseline = 'alphabetic';
    if(near){ ctx.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,26,16,.85)'; const h = 'Vào nhà · ' + V48M_STN[st]; ctx.strokeText(h, x + P.w/2, P.y + P.h + 28); ctx.fillStyle = '#ffd23f'; ctx.fillText(h, x + P.w/2, P.y + P.h + 28); }
    ctx.textAlign = 'left'; }}); });
}
function v65dFarHouses(g, tiny){
  const z = V46.ZI.pstreet; if(!z || typeof PLOTS === 'undefined') return;
  PLOTS.forEach((P, i) => { const s = (typeof STREET !== 'undefined' && STREET[i]) || {col:['#90caf9', '#ce93d8', '#ffcc80', '#a5d6a7'][i % 4]}, x = P.x + z.d[0], gy = P.y + P.h - 6 + z.d[1];
    if(tiny){ g.fillStyle = '#c9603f'; g.fillRect(x + 18, gy - 160, 160, 96); g.fillStyle = '#e6c79a'; g.fillRect(x + 18, gy - 64, 160, 64); return; }
    try { g.drawImage(v65dPlotSpr(i, s), x, gy - 196, 195, 208); } catch(e){} });
}
// quầy chợ ngoài phố (dải dưới phố người chơi) + người đi chợ dùng nhân vật NA
function v65dPed(g, x, y, p, t){
  const i = V47W.ped.indexOf(p), name = V64S_KIDS[(i*5 + 3) % V64S_KIDS.length], im = v64sChar(name); if(!im) return V65D.ped0(g, x, y, p, t);
  const dx = p._lx == null ? 0 : x - p._lx; p._lx = x; if(Math.abs(dx) > .05 && Math.abs(dx) < 40) p._f = dx < 0 ? 2 : 3; const f = p._f == null ? 0 : p._f, fr = Math.abs(dx) > .05 ? Math.floor(t*6) % 4 : 0;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(x) - 9, Math.round(y) - 3, 18, 4); g.drawImage(im, f*16, fr*16, 16, 16, Math.round(x) - 16, Math.round(y) - 31, 32, 32);
}
function v65dStreetInit(){
  const ss0 = streetSprites; streetSprites = function(sp){ if(!V65D.on) return ss0(sp); try { v65dStreetSprites(sp); } catch(e){ console.warn('v65d street', e); ss0(sp); } };
  const fh0 = v47wFarHouses; v47wFarHouses = function(g, tiny){ if(!V65D.on) return fh0(g, tiny); v65dFarHouses(g, tiny); };
  const st0 = v47wStall; v47wStall = function(g, s){ if(!V65D.on) return st0(g, s); v65dStall(g, s.x, s.y + 4, s.c, V47W.stalls.indexOf(s)*2); };
  V65D.ped0 = v47wPed; v47wPed = function(g, x, y, p, t){ if(!V65D.on) return V65D.ped0(g, x, y, p, t); try { v65dPed(g, x, y, p, t); } catch(e){ V65D.ped0(g, x, y, p, t); } };
  // dải chợ: nền đá lát NA thay màu phẳng (chép lại v47wStreet, chỉ đổi nền)
  const sw0 = v47wStreet; v47wStreet = function(VBn){
    if(!V65D.on) return sw0(VBn); const B = v47wBand(); if(!B || B.x1 < VBn.x0 - 200 || B.x0 > VBn.x1 + 200 || B.y1 < VBn.y0 - 400 || B.y0 > VBn.y1 + 400) return;
    if(cam.z < .3) v47wFarHouses(ctx, cam.z < .12);
    ctx.save(); ctx.imageSmoothingEnabled = false; v65dPave(ctx, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, cam.z < .3 ? 2 : 0); ctx.restore();
    if(cam.z < .12) return;
    const sp = V47W.stalls.map(s => ({y:s.y, f:() => v47wStall(ctx, s)})), L = B.x1 - B.x0 - 40;
    V47W.ped.forEach((p, i) => { let u = (p.o*L*2 + realT*p.sp) % (2*L); if(u > L) u = 2*L - u;
      const y = p.lane === 3 ? V47W.stalls[i % 5].y + 26 : B.y0 + 84 + p.lane*26, x = p.lane === 3 ? V47W.stalls[i % 5].x + Math.sin(realT*.7 + i)*14 : B.x0 + 20 + u;
      sp.push({y, f:() => v47wPed(ctx, x, y, p, p.lane === 3 ? 0 : realT + i)}); });
    sp.sort((a, b) => a.y - b.y).forEach(s => { try { s.f(); } catch(e){} });
  };
}
V65D_GROUND.pstreet = (g, z, lod) => {
  const n = z.nr; [-304, -69].forEach(a => v65dPave(g, n.x0 + 10, a + z.d[1], n.x1 - n.x0 - 20, 26, lod));
  PLOTS.forEach((P, i) => { const [x, y] = v65dN(z, P.x + P.w/2, P.y + P.h - 6); if(lod === 2) return; g.fillStyle = '#4a3428'; g.fillRect(x - 24, y - 2, 48, 6); g.fillStyle = v64sPat(g, 'FI', 5, 8, 2); g.fillRect(x - 22, y - 1, 44, 4); });
  if(lod === 2) return; for(let i = 0; i < 3; i++) for(const row of [-306, -71]){ const [x, y] = v65dN(z, 8760 + (i + 1)*215 - 10, row); v64sProp(g, {k:'bush', x, y:y - 2, i:i + row}, lod); }
};
// quảng trường: bỏ vòng quay cũ (vẽ lại kiểu NA), công viên Ikigai đã nướng vào nền
function v65dPlazaInit(){
  const es0 = eastSprites; eastSprites = function(sp){ if(!V65D.on) return es0(sp); const P = R.plaza; R.plaza = {x:-1e7, y:-1e7, w:1, h:1}; try { return es0(sp); } finally { R.plaza = P; } };
  const pk0 = v16DrawPark; v16DrawPark = function(){ if(!V65D.on || !V46.on) return pk0(); };
}
