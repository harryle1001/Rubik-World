// ================= v65d · 2/3 BỐ CỤC & HÌNH CÁC KHU: Đà Lạt, khu nhà học sinh, phố mua sắm, nhà game 2 người, quảng trường =================
// Toạ độ toà nhà = toạ độ đảo (mới). Vị trí nhà/quầy lấy đúng từ dữ liệu cũ (DALAT, HOUSES, R.*) qua độ dời z.d của khu.
const V65D_EMO = {Homestay:'🏡', 'Cà phê':'☕', 'Tiệm hoa':'💐', 'Tiệm bánh':'🥐', 'Nhà nghỉ':'🛏️'};
const v65dN = (z, x, y) => [x + z.d[0], y + z.d[1]];
// bảng tên nhỏ (Nunito 16px) — tên chủ nhà
function v65dPlaque(g, cx, y, t){ g.font = "800 16px Nunito, 'Be Vietnam Pro', sans-serif"; const w = Math.ceil(g.measureText(t).width) + 14;
  g.fillStyle = 'rgba(43,26,16,.92)'; g.fillRect(Math.round(cx - w/2), y, w, 22); g.fillStyle = '#d99a5c'; g.fillRect(Math.round(cx - w/2), y, w, 2);
  g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, cx, y + 12); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
// hộp hoa dưới cửa sổ (Đà Lạt: cẩm tú cầu, dã quỳ…)
function v65dFlowerBox(g, x, y, i){
  g.fillStyle = V65D_O; g.fillRect(x - 1, y - 1, 20, 8); g.fillStyle = '#8a5a35'; g.fillRect(x, y, 18, 6);
  if(v64sDong()){ g.fillStyle = '#ffffff'; g.fillRect(x, y - 3, 18, 3); return; }
  const C = v64sThu() ? ['#ff8a2b', '#ffd23f', '#e0473f'] : ['#b06bff', '#3d7bff', '#ff8fc4', '#ffd23f'];
  for(let k = 0; k < 4; k++){ g.fillStyle = '#2f7d4a'; g.fillRect(x + 1 + k*4, y - 3, 3, 3); g.fillStyle = C[(i + k) % C.length]; g.fillRect(x + 1 + k*4, y - 6, 4, 4); }
}
function v65dChimney(g, x, y){ g.fillStyle = V65D_O; g.fillRect(x - 1, y - 1, 16, 30); g.fillStyle = '#b5523b'; g.fillRect(x + 1, y + 1, 12, 26); g.fillStyle = '#d97a5a'; g.fillRect(x + 1, y + 1, 12, 4); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 1, y + 12, 12, 2); }

// ---------- 1. PHỐ NHÀ ĐÀ LẠT: dãy nhà mái ngói, hộp hoa, thông Đà Lạt, đèn ven lối đá ----------
V65D_LAY.dalat = z => {
  const n = z.n, L = [], laneY = n.y1 - 40, base = laneY - 2;
  DALAT.forEach((h, i) => { const cx = h.x + h.w/2 + z.d[0]; if(cx < n.x0 + 50 || cx > n.x1 - 50) return;
    const wT = h.w > 104 ? 4 : 3, sty = [0, 12, 8, 4][i % 4], W = wT*32, x = Math.round(cx - W/2) - 10, H = 12 + 96;
    L.push({id:'dl' + i, x, y:base - H, w:W + 20, h:H + 6, base, cx, draw:g => {
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(14, H - 4, W - 8, 8);
      if(h.chim) v65dChimney(g, 10 + Math.round(W*.68), 4);
      const S = v65dHouse(g, sty, 10, 12, wT, 2, 1, [Math.floor(wT/2)], 2); v65dSnow(g, 10, 12, W, S.wallY - 12);
      for(let k = 0; k < wT; k++) if(k !== Math.floor(wT/2)) v65dFlowerBox(g, 10 + k*32 + 7, S.wallY + 24, i + k);
      if(h.chim && v64sDong()){ g.fillStyle = '#ffffff'; g.fillRect(10 + Math.round(W*.68), 3, 14, 4); }
      if(h.sign) v64sBoard(g, 10 + W/2, S.wallY - 30, (V65D_EMO[h.sign] || '🏠') + ' ' + h.sign);
      else { g.fillStyle = V65D_O; g.fillRect(10 + W/2 - 12, S.wallY - 22, 24, 18); g.fillStyle = '#e8c27a'; g.fillRect(10 + W/2 - 10, S.wallY - 20, 20, 14); g.fillStyle = '#6b3a2a'; g.font = "800 16px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), 10 + W/2, S.wallY - 12); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
    }}); });
  // khe giữa các nhà: thông Đà Lạt, đèn, bồn cẩm tú cầu (nướng vào nền)
  const P = []; L.sort((a, b) => a.x - b.x);
  for(let i = 0; i <= L.length; i++){ const a = i ? L[i - 1].x + L[i - 1].w - 10 : n.x0 + 20, b = i < L.length ? L[i].x + 10 : n.x1 - 20, gap = b - a, cx = (a + b)/2;
    if(gap > 70) P.push({k:'pine', x:cx, y:base - 4, i}); else if(gap > 26) P.push({k:i % 2 ? 'bush' : 'pine', x:cx, y:base - 6, i});
    if(i % 2 === 0 && gap > 18) P.push({k:'lamp', x:cx + (gap > 70 ? 30 : 0), y:laneY - 2}); }
  V65D.dalP = P; V65D.dalLane = [n.x0 + 16, laneY, n.x1 - n.x0 - 32, 30];
  return L;
};
V65D_GROUND.dalat = (g, z, lod) => {
  const ln = V65D.dalLane; if(ln) v65dPave(g, ln[0], ln[1], ln[2], ln[3], lod);
  if(lod === 2) return; for(const p of V65D.dalP || []) v64sProp(g, p, lod);
};

// ---------- 2. KHU NHÀ HỌC SINH: 13 nhà, mỗi nhà một kiến trúc (giữ đúng khung nền cũ) ----------
// vừa khung (X, Y, W, H): nhà NA tỷ lệ 1.5, đáy trùng đáy khung
function v65dFit(g, sty, X, Y, W, H, rT){
  const s = 1.5, t = 24, wT = Math.max(2, Math.round(W/t)); rT = rT || (H >= 84 ? 2 : 1);
  const rH = (rT === 2 ? 32 : 24)*s, wl = Math.max(1, Math.round((H - rH)/t)), tot = rH + wl*t, x = Math.round(X + (W - wT*t)/2), y = Math.round(Y + H - tot);
  const S = v65dHouse(g, sty, x, y, wT, rT, wl, [Math.floor(wT/2)], s); v65dSnow(g, x, y, wT*t, rH); return {x, y, w:wT*t, h:tot, wallY:S.wallY, rH};
}
function v65dWholeFit(g, k, X, Y, W, H){ const q = V65D_WHOLE[k], s = Math.min(W/q[2], (H + 8)/q[3]), w = q[2]*s, h = q[3]*s, x = Math.round(X + (W - w)/2), y = Math.round(Y + H - h); v65dWhole(g, k, x, y, s); v65dSnow(g, x, y, w, h*.5); return {x, y, w, h}; }
const V65D_HK = {
  bietthu:(g, X, Y, W, H) => { const F = v65dFit(g, 12, X, Y, W, H); const cx = F.x + F.w/2; [cx - 22, cx + 16].forEach(px => { g.fillStyle = V65D_K; g.fillRect(px - 1, F.wallY - 1, 8, F.y + F.h - F.wallY + 1); g.fillStyle = '#f4efe6'; g.fillRect(px, F.wallY, 6, F.y + F.h - F.wallY); }); g.fillStyle = '#ffd23f'; g.fillRect(F.x + 4, F.wallY - 3, F.w - 8, 3); },
  nhaong:(g, X, Y, W, H) => { const F = v65dFit(g, 4, X, Y, W, H, 1); g.fillStyle = V65D_K; g.fillRect(F.x + 2, F.wallY + 20, F.w - 4, 3); for(let k = 0; k < 3; k++) v65dFlowerBox(g, F.x + 4 + k*14, F.wallY + 18, k); },
  nhago:(g, X, Y, W, H) => v65dWholeFit(g, 'wood', X, Y, W, H),
  nhatron:(g, X, Y, W, H) => v65dWholeFit(g, 'round', X, Y, W, H),
  resort:(g, X, Y, W, H) => { v65dFit(g, 8, X, Y, 96, H); const px = X + 104, pw = W - 108, py = Y + H - 60;
    g.fillStyle = '#c9c2b4'; g.fillRect(px - 4, py - 4, pw + 8, 62); g.fillStyle = V65D_K; g.strokeStyle = V65D_K; g.lineWidth = 2; g.strokeRect(px - 4, py - 4, pw + 8, 62);
    g.fillStyle = v64sDong() ? '#d8eef6' : '#5ec7e6'; g.fillRect(px + 4, py + 4, pw - 8, 46); g.fillStyle = 'rgba(255,255,255,.55)'; for(let k = 0; k < 4; k++) g.fillRect(px + 10 + k*22, py + 12 + (k % 2)*16, 12, 3);
    const ux = px + pw - 18, uy = py - 30; g.fillStyle = V65D_K; g.fillRect(ux - 1, uy, 3, 30); for(let k = 0; k < 4; k++){ g.fillStyle = k % 2 ? '#fff6e0' : '#ef4b4b'; g.beginPath(); g.moveTo(ux, uy - 12); g.lineTo(ux - 20 + k*10, uy); g.lineTo(ux - 10 + k*10, uy); g.fill(); } },
  nhat:(g, X, Y, W, H) => { const F = v65dWholeFit(g, 'market', X, Y, W, H); [F.x + 6, F.x + F.w - 14].forEach(lx => { g.fillStyle = V65D_K; g.fillRect(lx, F.y + F.h*.45, 10, 13); g.fillStyle = '#e0473f'; g.fillRect(lx + 1, F.y + F.h*.45 + 1, 8, 11); g.fillStyle = '#ffd27a'; g.fillRect(lx + 3, F.y + F.h*.45 + 4, 4, 5); }); },
  laudai:(g, X, Y, W, H) => { const F = v65dFit(g, 4, X + 14, Y + 18, W - 28, H - 18, 1);
    [X + 2, X + W - 20].forEach((tx, k) => { const ty = Y + 14, th = H - 14; g.fillStyle = V65D_K; g.fillRect(tx - 1, ty - 1, 20, th + 1); g.fillStyle = '#c9c2b4'; g.fillRect(tx + 1, ty + 1, 16, th - 1); g.fillStyle = 'rgba(90,70,50,.25)'; for(let yy = ty + 10; yy < ty + th; yy += 12) g.fillRect(tx + 1, yy, 16, 2);
      g.fillStyle = '#ffd27a'; g.fillRect(tx + 6, ty + 18, 6, 9); g.fillStyle = V65D_K; g.beginPath(); g.moveTo(tx - 4, ty + 2); g.lineTo(tx + 9, ty - 22); g.lineTo(tx + 22, ty + 2); g.fill();
      g.fillStyle = v64sDong() ? '#ffffff' : '#3d7bff'; g.beginPath(); g.moveTo(tx - 1, ty); g.lineTo(tx + 9, ty - 18); g.lineTo(tx + 19, ty); g.fill(); if(k){ g.fillStyle = V65D_K; g.fillRect(tx + 8, ty - 34, 2, 14); g.fillStyle = '#ef4b4b'; g.fillRect(tx + 10, ty - 34, 10, 6); } }); },
  nhasan:(g, X, Y, W, H) => { const F = v65dFit(g, 0, X, Y, W, H - 22, 2), by = Y + H;
    for(const px of [F.x + 6, F.x + F.w/2 - 3, F.x + F.w - 12]){ g.fillStyle = V65D_O; g.fillRect(px - 1, F.y + F.h - 2, 8, by - F.y - F.h + 2); g.fillStyle = '#9a6236'; g.fillRect(px + 1, F.y + F.h, 4, by - F.y - F.h - 1); }
    const lx = F.x + F.w/2 + 10; g.strokeStyle = V65D_O; g.lineWidth = 3; g.beginPath(); g.moveTo(lx, F.y + F.h); g.lineTo(lx + 12, by); g.moveTo(lx + 10, F.y + F.h); g.lineTo(lx + 22, by); g.stroke(); for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(lx + k*3, F.y + F.h + k*5.5); g.lineTo(lx + 10 + k*3, F.y + F.h + k*5.5); g.stroke(); } },
  nhakinh:(g, X, Y, W, H) => { const x = X + 2, y = Y + 14, w = W - 4, h = H - 14;
    g.fillStyle = V65D_K; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = '#e9eef2'; g.fillRect(x, y, w, h); g.fillStyle = '#7a8a96'; g.fillRect(x, y, w, 8);
    for(let j = 0; j < 2; j++) for(let i = 0; i < 3; i++){ const gx = x + 5 + i*(w - 10)/3, gy = y + 12 + j*(h - 16)/2, gw = (w - 10)/3 - 4, gh = (h - 16)/2 - 4; g.fillStyle = '#8fd3ef'; g.fillRect(gx, gy, gw, gh); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(gx + 3, gy + gh - 3); g.lineTo(gx + gw*.5, gy + 3); g.lineTo(gx + gw*.7, gy + 3); g.lineTo(gx + 8, gy + gh - 3); g.fill(); }
    g.fillStyle = '#3d4a63'; g.fillRect(x + 6, y - 10, w*.45, 8); g.fillStyle = '#7fb2ff'; for(let k = 0; k < 3; k++) g.fillRect(x + 7 + k*(w*.15), y - 9, w*.13, 6); if(v64sDong()){ g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - 4, w + 4, 5); } },
  diatrunghai:(g, X, Y, W, H) => { const F = v65dFit(g, 4, X, Y, W, H); v65dTint(g, F.x, F.y, F.w, F.rH, v64sDong() ? 'rgba(255,255,255,.4)' : 'rgba(40,110,220,.5)'); g.fillStyle = '#f4efe6'; g.fillRect(F.x + 4, F.wallY, F.w - 8, 3); },
  thai:(g, X, Y, W, H) => { const F = v65dFit(g, 12, X, Y, W, H); v65dTint(g, F.x, F.y, F.w, F.rH, 'rgba(255,190,40,.22)');
    [F.x + 2, F.x + F.w - 2].forEach((px, k) => { g.fillStyle = V65D_K; g.beginPath(); g.moveTo(px, F.y + 8); g.lineTo(px + (k ? 8 : -8), F.y - 12); g.lineTo(px + (k ? -3 : 3), F.y + 10); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(px, F.y + 6); g.lineTo(px + (k ? 6 : -6), F.y - 8); g.lineTo(px + (k ? -1 : 1), F.y + 8); g.fill(); }); },
  container:(g, X, Y, W, H) => { const box = (x, y, w, h, c) => { g.fillStyle = V65D_K; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = c; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; for(let k = x + 4; k < x + w - 2; k += 6) g.fillRect(k, y + 3, 2, h - 6); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x, y, w, 3); if(v64sDong()){ g.fillStyle = '#ffffff'; g.fillRect(x, y - 2, w, 4); } };
    const hh = Math.round((H - 6)/2); box(X + 2, Y + H - hh, W/2 - 3, hh - 2, '#e8743a'); box(X + W/2 + 1, Y + H - hh, W/2 - 3, hh - 2, '#3d7bff'); box(X + 10, Y + H - 2*hh + 2, W - 20, hh - 4, '#2fbf71');
    g.fillStyle = '#8fd3ef'; g.fillRect(X + 22, Y + H - 2*hh + 10, 18, 10); g.fillRect(X + W - 40, Y + H - 2*hh + 10, 18, 10); g.fillStyle = V65D_O; g.fillRect(X + W/2 - 8, Y + H - hh + 6, 16, hh - 10); },
  villa:(g, X, Y, W, H) => { const F = v65dFit(g, 4, X, Y, W, H); g.fillStyle = V65D_K; g.fillRect(F.x + 10, F.y + F.h - 30, 52, 30); g.fillStyle = '#c9c2b4'; g.fillRect(F.x + 12, F.y + F.h - 28, 48, 28); g.fillStyle = 'rgba(0,0,0,.18)'; for(let k = 0; k < 5; k++) g.fillRect(F.x + 12, F.y + F.h - 26 + k*5, 48, 2);
    g.fillStyle = '#8fd3ef'; g.fillRect(F.x + F.w - 70, F.wallY + 6, 56, 14); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(F.x + F.w - 66, F.wallY + 8, 10, 10); }
};
V65D_LAY.houses = z => {
  const L = [];
  const lv = [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1];   // nhãn so le cao/thấp → nhà sát nhau không chồng chữ
  HOUSES.forEach((h, i) => { const [x, y] = v65dN(z, h.x, h.y), f = V65D_HK[h.k]; if(!f) return;
    const nm = 'Nhà ' + ((typeof students !== 'undefined' && students[i] && students[i].name) || h.name), CW = Math.max(h.w + 24, 176), ox = Math.round((CW - h.w)/2), top = 66;
    L.push({id:'hs' + i, x:x - ox, y:y - top, w:CW, h:h.h + top + 4, base:y + h.h, draw:g => { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(ox + 4, top + h.h - 6, h.w - 8, 8); f(g, ox, top, h.w, h.h);
      v65dPlaque(g, CW/2, lv[i] ? top + Math.min(26, h.h*.3) : top - 26, nm); }}); });
  return L;
};
V65D_GROUND.houses = (g, z, lod) => {
  const n = z.nr; [[148, 176], [298, 332], [432, 472], [612, 632]].forEach(([a, b]) => v65dPave(g, n.x0 - 6, a + z.d[1], n.x1 - n.x0 + 12, b - a, lod));
  // sân chơi nhỏ (chỗ cũ): cát + cầu trượt + xích đu
  const [px, py] = v65dN(z, 2560, 546), w = 62, h = 60, dong = v64sDong();
  g.fillStyle = '#4a3428'; g.fillRect(px - 2, py - 2, w + 4, h + 4); g.fillStyle = dong ? '#eef3f5' : '#efc58a'; g.fillRect(px, py, w, h); if(lod === 2) return;
  g.fillStyle = V65D_K; g.fillRect(px + 8, py + 10, 4, 40); g.fillStyle = '#ffd23f'; g.fillRect(px + 9, py + 11, 2, 38); g.fillStyle = '#ef4b4b'; g.beginPath(); g.moveTo(px + 11, py + 12); g.lineTo(px + 40, py + 48); g.lineTo(px + 40, py + 54); g.lineTo(px + 11, py + 20); g.fill();
  g.strokeStyle = '#3d7bff'; g.lineWidth = 3; g.beginPath(); g.moveTo(px + 44, py + 52); g.lineTo(px + 50, py + 14); g.lineTo(px + 58, py + 52); g.stroke(); g.fillStyle = '#2fbf71'; g.fillRect(px + 46, py + 38, 10, 4);
};

// ---------- 3. PHỐ MUA SẮM: 5 cửa hàng mái ngói + mái hiên sọc, phố lát đá, dây cờ, quầy chợ ----------
const V65D_SHOPS = [['🚲', 'Xe đạp', '#3d7bff', 12], ['🐾', 'Thú cưng', '#ff8a2b', 0], ['👕', 'Thời trang', '#ff6f91', 4], ['💍', 'Trang sức', '#ffd23f', 8], ['🎣', 'Đồ câu cá', '#2fbf71', 12]];
V65D_LAY.shopst = z => {
  const r = R.shopst, L = [], base = r.y + 292 + z.d[1];
  V65D_SHOPS.forEach(([ic, nm, col, sty], k) => { const cx = r.x + 20 + k*176 + 75 + z.d[0], W = 160, x = Math.round(cx - W/2) - 4, H = 10 + 128;
    L.push({id:'sh' + k, x, y:base - H, w:W + 8, h:H + 6, base, draw:g => {
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(8, H - 4, W - 8, 8);
      const S = v65dHouse(g, sty, 4, 10, 5, 2, 2, [2], 2); v65dSnow(g, 4, 10, W, S.wallY - 10);
      v65dAwning(g, 8, S.wallY + 30, W - 8, col, 14);
      for(const wx of [20, W - 44]){ g.fillStyle = V65D_K; g.fillRect(wx + 2, S.wallY + 52, 26, 8); g.fillStyle = col; g.fillRect(wx + 3, S.wallY + 53, 24, 6); }
      v64sBoard(g, 4 + W/2, S.wallY - 32, ic + ' ' + nm);
    }}); });
  [0, 1, 3, 4].forEach((k, j) => { const cx = r.x + 20 + k*176 + 75 + z.d[0], sb = r.y + r.h - 4 + z.d[1], col = V65D_SHOPS[k][2];
    L.push({id:'st' + k, x:cx - 62, y:sb - 100, w:124, h:104, base:sb, draw:g => v65dStall(g, 62, 100, col, j*3)}); });
  return L;
};
V65D_GROUND.shopst = (g, z, lod) => {
  const r = R.shopst, [x, y] = v65dN(z, r.x, r.y + 300); v65dPave(g, x - 10, y, r.w + 20, 120, lod, ['FI', 13, 13]);
  g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x - 10, y, r.w + 20, 120); g.fillStyle = 'rgba(255,240,210,.45)'; g.fillRect(x - 10, y + 4, r.w + 20, 3); g.fillRect(x - 10, y + 113, r.w + 20, 3);
  if(lod === 2) return; const lamps = [];
  for(let k = 0; k <= 5; k++){ const lx = x + 10 + k*176 - 8; lamps.push(lx); g.drawImage(v64sLampSpr(), lx - 12, y - 58); }
  for(let k = 0; k < 5; k++) v65dBunting(g, lamps[k], y - 52, lamps[k + 1], y - 52, 16);
  v64sSign(g, x + 30, y + 196, '🛍️ Phố mua sắm');
};

// ---------- 4. NHÀ GAME 2 NGƯỜI: sảnh trong nhà (sàn đá, tường gạch, mái ngói), 6 tủ máy game 2 cần điều khiển ----------
function v65dArcade(g, w, h, k){
  const cols = ['#ef4b4b', '#26c6da', '#ffd23f', '#2fbf71', '#ff8a2b', '#b06bff'], c = cols[k % 6], x = 8, y = 6, bw = w - 16, bh = h - 12;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 2, h - 8, bw - 4, 8);
  g.fillStyle = V65D_K; g.fillRect(x - 2, y - 2, bw + 4, bh + 4);
  g.fillStyle = c; g.fillRect(x, y, bw, bh); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, 6, bh); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + bw - 6, y, 6, bh);
  g.fillStyle = V65D_K; g.fillRect(x + 8, y + 6, bw - 16, 14); g.fillStyle = '#fff6e0'; g.fillRect(x + 10, y + 8, bw - 20, 10);
  g.fillStyle = c; g.font = "900 16px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(['RUBIK', 'CỜ', 'ĐUA', 'BÓNG', 'TOÁN', 'NHẠC'][k % 6], x + bw/2, y + 14);
  const sy = y + 26, sw = bw - 20, sh = 44; g.fillStyle = V65D_K; g.fillRect(x + 8, sy - 2, sw + 4, sh + 4); g.fillStyle = '#10142a'; g.fillRect(x + 10, sy, sw, sh);
  const G = (px, py, pw, ph, pc) => { g.fillStyle = pc; g.fillRect(x + 10 + px, sy + py, pw, ph); };
  if(k % 6 === 0){ for(let i = 0; i < 9; i++) G(sw/2 - 15 + (i % 3)*10, 7 + Math.floor(i/3)*10, 9, 9, cols[(i*4) % 6]); }
  else if(k % 6 === 1){ for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++) G(sw/2 - 16 + i*8, 6 + j*8, 8, 8, (i + j) % 2 ? '#739552' : '#ebecd0'); }
  else if(k % 6 === 2){ G(0, sh/2 - 1, sw, 2, '#ffd23f'); G(14, 10, 12, 7, '#ef4b4b'); G(sw - 30, 26, 12, 7, '#3d7bff'); }
  else if(k % 6 === 3){ G(6, 12, 4, 18, '#ffffff'); G(sw - 10, 16, 4, 18, '#ffffff'); G(sw/2 - 3, 20, 6, 6, '#ffd23f'); G(sw/2 - 1, 2, 2, sh - 4, 'rgba(255,255,255,.3)'); }
  else if(k % 6 === 4){ g.fillStyle = '#2fbf71'; g.fillText('7×8=?', x + 10 + sw/2, sy + sh/2 + 1); }
  else { for(let i = 0; i < 6; i++) G(8 + i*((sw - 16)/6), sh - 10 - (i*7 % 22), (sw - 16)/6 - 2, 10 + (i*7 % 22), cols[i]); }
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 10, sy, sw, 6);
  const py = sy + sh + 6; g.fillStyle = V65D_K; g.fillRect(x - 4, py - 2, bw + 8, 22); g.fillStyle = '#3e3550'; g.fillRect(x - 2, py, bw + 4, 18);
  [[x + 14, '#ef4b4b'], [x + bw - 30, '#3d7bff']].forEach(([jx, jc]) => { g.fillStyle = V65D_K; g.fillRect(jx + 2, py - 6, 3, 10); g.fillStyle = jc; g.beginPath(); g.arc(jx + 3.5, py - 7, 4.5, 0, 7); g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(jx + 10, py + 5, 5, 5); g.fillStyle = '#ffffff'; g.fillRect(jx + 17, py + 5, 5, 5); });
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + bw/2 - 8, y + bh - 16, 16, 12); g.fillStyle = '#ffd23f'; g.fillRect(x + bw/2 - 2, y + bh - 13, 4, 6);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
V65D_LAY.hall2p = z => {
  const r = R.hall2p, L = [];
  for(let k = 0; k < 6; k++){ const [x, y] = v65dN(z, r.x + 60 + (k % 3)*210, r.y + 110 + Math.floor(k/3)*150);
    L.push({id:'ar' + k, x:x + 7, y:y - 12, w:96, h:128, base:y + 112, draw:g => v65dArcade(g, 96, 128, k)}); }
  return L;
};
V65D_GROUND.hall2p = (g, z, lod) => {
  const r = R.hall2p, [x0, y0] = v65dN(z, r.x, r.y + 40), w = r.w, h = r.h - 80, t = 12, cx = x0 + w/2, door = 104;
  g.fillStyle = lod < 2 ? v64sPat(g, 'FI', 12, 8, 2) : '#8c9a80'; g.fillRect(x0, y0, w, h); g.fillStyle = 'rgba(90,60,140,.28)'; g.fillRect(x0, y0, w, h);
  if(lod < 2){ g.fillStyle = '#7a1f2a'; g.fillRect(cx - 34, y0 + 70, 68, h - 70); g.fillStyle = '#c0392b'; g.fillRect(cx - 30, y0 + 70, 60, h - 70); g.fillStyle = '#ffd23f'; g.fillRect(cx - 26, y0 + 70, 3, h - 70); g.fillRect(cx + 23, y0 + 70, 3, h - 70); }
  // mái ngói phía sau tường trên + bảng tên
  if(lod < 2){ g.save(); g.beginPath(); g.rect(x0 - 30, y0 - 80, w + 60, 80 - t/2); g.clip(); const wT = Math.round((w + 32)/32); v64sHouse(g, 12, cx - wT*16, y0 - 64, wT, 2, 0, []); if(v64sDong()){ g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(cx - wT*16 + 8, y0 - 62, wT*32 - 16, 14); } g.restore(); }
  const pat = lod < 2 ? v64sPat(g, 'H', 6, 2, 1) : '#b5523b', bar = (x, y, bw, bh) => { g.fillStyle = V65D_O; g.fillRect(x - 1, y - 1, bw + 2, bh + 2); g.fillStyle = pat; g.fillRect(x, y, bw, bh); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x, y, bw, 2); };
  bar(x0 - t/2, y0 - t/2, w + t, t); bar(x0 - t/2, y0, t, h); bar(x0 + w - t/2, y0, t, h);
  bar(x0 - t/2, y0 + h - t/2, w/2 - door/2 + t/2, t); bar(cx + door/2, y0 + h - t/2, w/2 - door/2 + t/2, t);
  if(lod === 2) return;
  [cx - door/2 - 6, cx + door/2 - 2].forEach(px => { g.fillStyle = V65D_O; g.fillRect(px, y0 + h - 22, 8, 30); g.fillStyle = '#8a5a35'; g.fillRect(px + 2, y0 + h - 20, 4, 26); });
  v64sBoard(g, cx, y0 - 46, '🎮 NHÀ GAME 2 NGƯỜI', true);
  for(const [px, py] of [[x0 + 14, y0 + 14], [x0 + w - 46, y0 + 14], [x0 + 14, y0 + h - 76], [x0 + w - 46, y0 + h - 76]]) v64sP(g, 'E', 0, 120, 16, 24, px, py + 12, 2);
  [[x0 + 150, '🧩'], [x0 + w - 190, '♟️']].forEach(([px, ic]) => { g.fillStyle = V65D_O; g.fillRect(px - 2, y0 + 8, 44, 34); g.fillStyle = '#fff6e0'; g.fillRect(px, y0 + 10, 40, 30); g.font = '20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ic, px + 20, y0 + 26); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; });
  v64sSign(g, cx - door/2 - 90, y0 + h + 56, '🎮 Chạm để chơi');
};

// ---------- 5. QUẢNG TRƯỜNG LỄ HỘI: đá lát hoa văn, cờ phướn, quầy ăn, vòng quay kiểu NA; công viên cờ Ikigai bằng cỏ & hoa ----------
V65D_LAY.plaza = z => {
  const r = R.plaza, L = [], [cx, cy] = v65dN(z, r.x + 660, r.y + 220), base = r.y + 460 + z.d[1];
  L.push({id:'wheel', dyn:true, x:cx - 190, y:cy - 190, w:380, h:base - cy + 196, base, live:(g, ox, oy) => v65dWheel(g, cx + ox, cy + oy, base + oy)});
  const sb = r.y + r.h - 6 + z.d[1];
  [[r.x + 470, '#ef4b4b', 0], [r.x + 860, '#2fbf71', 4]].forEach(([sx, col, v], k) => { const x = sx + z.d[0]; L.push({id:'ps' + k, x:x - 62, y:sb - 100, w:124, h:104, base:sb, draw:g => v65dStall(g, 62, 100, col, v)}); });
  return L;
};
function v65dWheel(g, cx, cy, base){
  const R0 = 150, t = realT*.15, cols = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#ff8a2b', '#b06bff'];
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(cx, base, 90, 12, 0, 0, 7); g.fill();
  const leg = (x1, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(cx - x1, base); g.lineTo(cx, cy); g.lineTo(cx + x1, base); g.stroke(); };
  leg(70, 14, V65D_O); leg(70, 8, '#9a6236'); g.strokeStyle = V65D_O; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 44, base - 60); g.lineTo(cx + 44, base - 60); g.stroke();
  g.lineWidth = 7; g.strokeStyle = V65D_K; g.beginPath(); g.arc(cx, cy, R0, 0, 7); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#f4efe6'; g.beginPath(); g.arc(cx, cy, R0, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(244,239,230,.85)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R0*.62, 0, 7); g.stroke();
  for(let k = 0; k < 12; k++){ const a = t + k*Math.PI/6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a)*R0, cy + Math.sin(a)*R0); g.stroke(); }
  for(let k = 0; k < 12; k++){ const a = t + k*Math.PI/6, px = Math.round(cx + Math.cos(a)*R0), py = Math.round(cy + Math.sin(a)*R0);
    g.fillStyle = V65D_K; g.fillRect(px - 1, py, 3, 6); g.fillRect(px - 12, py + 5, 24, 20); g.fillStyle = cols[k % 6]; g.fillRect(px - 10, py + 7, 20, 16); g.fillStyle = '#fff6e0'; g.fillRect(px - 7, py + 11, 14, 6); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(px - 10, py + 7, 20, 3); }
  g.fillStyle = V65D_K; g.beginPath(); g.arc(cx, cy, 13, 0, 7); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(cx, cy, 10, 0, 7); g.fill(); g.fillStyle = '#ef4b4b'; g.fillRect(cx - 3, cy - 3, 6, 6);
}
V65D_GROUND.plaza = (g, z, lod) => {
  const r = R.plaza, P = V16_PARK, [x0, y0] = v65dN(z, P.x + P.w + 14, r.y - 20), x1 = r.x + r.w + 30 + z.d[0], y1 = r.y + r.h + 20 + z.d[1], dong = v64sDong();
  v65dPave(g, x0, y0, x1 - x0, y1 - y0, lod, ['FI', 17, 1]);
  const [cx, cy] = v65dN(z, r.x + 660, r.y + 400), ring = (rr, f) => { g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fillStyle = f; g.fill(); };
  ring(132, '#4a3428'); ring(126, lod < 2 ? v64sPat(g, 'FI', 1, 13, 2) : '#e8c27a'); ring(126/V64S_PHI + 6, '#4a3428'); ring(126/V64S_PHI, lod < 2 ? v64sPat(g, 'FI', 5, 8, 2) : '#e6a066'); if(dong) ring(126, 'rgba(255,255,255,.35)');
  // công viên Ikigai: 4 vòng hoa giao nhau (yêu thích · giỏi · thế giới cần · được trả công)
  const [px, py] = v65dN(z, P.x, P.y), pcx = px + P.w/2, pcy = py + P.h/2, R0 = Math.min(P.w, P.h)*.27;
  g.strokeStyle = '#4a3428'; g.lineWidth = 3; v64sRound(g, px + 4, py + 4, P.w - 8, P.h - 8, 30); g.stroke();
  const C = [['#ff8a80', -1, -1, 'YÊU THÍCH'], ['#82b1ff', 1, -1, 'GIỎI'], ['#b9f6ca', -1, 1, 'THẾ GIỚI CẦN'], ['#ffe57f', 1, 1, 'ĐƯỢC TRẢ CÔNG']];
  C.forEach(([c, sx, sy]) => { g.beginPath(); g.arc(pcx + sx*R0*.55, pcy + sy*R0*.55, R0, 0, 7); g.fillStyle = lod < 2 ? v64sPat(g, 'FL', 1, dong ? 13 : 7, 2) : '#4f8a3a'; g.fill(); });
  C.forEach(([c, sx, sy]) => { g.globalAlpha = dong ? .25 : .4; g.beginPath(); g.arc(pcx + sx*R0*.55, pcy + sy*R0*.55, R0, 0, 7); g.fillStyle = c; g.fill(); g.globalAlpha = 1; g.strokeStyle = V65D_K; g.lineWidth = 2; g.stroke(); });
  if(lod === 2) return;
  if(!dong) for(let i = 0; i < 28; i++){ const a = i*2.39996, rr = R0*.3 + (i*37 % 100)/100*R0*1.1, fx = pcx + Math.cos(a)*rr, fy = pcy + Math.sin(a)*rr*.95; if(Math.hypot(fx - pcx, fy - pcy) > 24) v64sT(g, 'N', [0, 3, 6][i % 3], 11, fx - 8, fy - 8, 1, 1, 1); }
  g.font = "900 16px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = 'rgba(43,26,16,.85)'; g.fillStyle = '#fff6e0';
  C.forEach(([, sx, sy, tx]) => { const lx = pcx + sx*R0*.78, ly = pcy + sy*R0*1.02; g.strokeText(tx, lx, ly); g.fillText(tx, lx, ly); }); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  v64sBoard(g, pcx, pcy - R0*.62, '☯ IKIGAI', true);
  for(let k = 0; k < 4; k++) v64sProp(g, {k:'tree', x:px + 50 + k*96, y:py + 50, i:0}, lod);
  v64sSign(g, px + 40, py + P.h - 6, '🌸 Công viên cờ Ikigai');
  for(let k = 0; k < 6; k++) v65dBanner(g, x0 + 22 + k*((x1 - x0 - 50)/5), y0 + 100, k);
  v65dBunting(g, x0 + 22, y0 + 14, x1 - 28, y0 + 14, 22);
};
