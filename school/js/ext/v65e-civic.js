// ================= v65e · 3/4 TRƯỜNG TIN HỌC · TRẠM CỨU HỎA · ĐỒN CẢNH SÁT · THÁP RUBIK 81 =================
// Thay hàm sprite/nền của v51t + v53c (cùng khổ canvas, cùng điểm neo ox/oy và các mốc đèn/màn hình động) → lớp động cũ vẫn khớp.
// Tháp Rubik 81: thiết kế gốc của game — tháp 6 tầng mái ngói 6 màu Rubik, đỉnh là khối Rubik 3×3 (không phỏng theo toà nhà có thật).
const v65eCR = (g, ox, oy) => (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(ox + Math.round(x), oy + Math.round(y), Math.round(w), Math.round(h)); };

// ---------- 1. Trường Tin học (v51t): sảnh mái xanh ngọc + cánh 3 tầng phòng máy ----------
function v65eTechSpr(se){
  const key = 'b' + se; if(V51T.spr[key]) return V51T.spr[key]; const G = v51tGeo(), P = V51T_PHI, bw = G.bw, bh = G.bh, main = G.main, ox = 12, oy = 74, rH = Math.round(bh/P**4);
  const [c, g] = v65eCv(bw + 24, bh + oy + 6), R = v65eCR(g, ox, oy), X = x => ox + x, Y = y => oy + y;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(X(6), Y(bh - 2), bw, 10);
  // cánh phải: 3 tầng, cửa sổ đúng chỗ màn hình chạy code (v51tWorld)
  const wx0 = main + 10, ww = bw - main - 20, fl = (bh - rH - 22)/3;
  v65eRoof(g, 12, X(main - 4), Y(-16), 6, 2, '#2f6fb5'); v65eWall(g, X(main), Y(48), bw - main, bh - 48, 'blue');
  for(let f = 0; f < 3; f++){ const y = rH + 6 + f*fl; if(f) R('#9fb0c8', main + 2, y + 2, bw - main - 4, 3);
    for(let k = 0; k < 3; k++){ const w = ww/3 - 8, x = wx0 + k*(ww/3) + 4, h = Math.min(fl - 16, w*P); v65eWin(g, X(x), Y(y + 6), w, h, {gl:'#5aa9c8', gl2:'#9fdcef', plain:true});
      R('#2a3048', x + w/2 - 9, y + 6 + h - 16, 18, 12); R('#5ff0ff', x + w/2 - 7, y + 6 + h - 14, 14, 8); R('#1d2235', x + w/2 - 1, y + 6 + h - 4, 2, 4); } }
  for(let i = 0; i < 6; i++) R(V51T_RUBIK[i], main + 10 + i*((bw - main - 20)/6), bh - 18, (bw - main - 20)/6 - 2, 6);
  // pin mặt trời trên mái cánh + ăng-ten (đèn nháy, sóng wifi vẽ động ở cùng chỗ)
  for(let k = 0; k < 2; k++){ const x = main + 22 + k*60, y = -4; R(V65E_O, x - 2, y - 2, 46, 24); R('#22305a', x, y, 42, 20); for(let a = 1; a < 4; a++) R('#3d5596', x + a*10.5, y, 1, 20); R('#3d5596', x, y + 10, 42, 1); if(se === 'dong') R('#f2f6fa', x - 1, y - 3, 44, 4); }
  const ax = main + (bw - main)/2 + 50; R(V65E_O, ax - 3, -70, 6, 60); R('#8d93a6', ax - 1, -69, 2, 58); for(let i = 0; i < 5; i++) R('#8d93a6', ax - 6 + (i % 2)*8, -64 + i*11, 4, 2);
  R(V65E_O, ax - 41, -22, 6, 14); g.fillStyle = V65E_O; g.beginPath(); g.ellipse(X(ax - 38), Y(-22), 16, 11, -.5, 0, 7); g.fill(); g.fillStyle = '#e8ecf3'; g.beginPath(); g.ellipse(X(ax - 38), Y(-22), 13, 8, -.5, 0, 7); g.fill();
  // gian chính: mái xanh ngọc, tường trắng, vách kính sảnh khung gỗ, cửa kính trượt
  v65eRoof(g, 12, X(5), Y(-40), 9, 3, '#18a3a3'); v65eWall(g, X(0), Y(54), main, bh - 54, 'white');
  v65eCube(g, X(main/2 - 15), Y(-30), 10, 4);
  v65ePlaque(g, X(main/2), Y(60), '💻 Tin học Rubik', '#1b2440', 18);
  const gx0 = 14, gx1 = main - 14, gy0 = rH + 60, cols = 5, cw = (gx1 - gx0)/cols;
  for(let i = 0; i < cols; i++) v65eWin(g, X(gx0 + i*cw + 4), Y(gy0), cw - 8, 50, {gl:'#7fd8f0', gl2:'#d4f6ff', fr:'#e9eef5'});
  for(let i = 0; i < cols; i++){ if(i === 2) continue; const x = gx0 + i*cw + 4; v65eWin(g, X(x), Y(gy0 + 70), cw - 8, 54, {gl:'#7fd8f0', gl2:'#d4f6ff', fr:'#e9eef5'}); R('#26324a', x + cw/2 - 13, gy0 + 104, 18, 12); R('#5ff0ff', x + cw/2 - 11, gy0 + 106, 14, 8); }
  const dw = G.dw, dh = Math.round(bh/P/P), dx = main/2 - dw/2, dy = bh - 10 - dh;
  R('#2fbf71', dx - 22, dy - 14, dw + 44, 8); R(V65E_O, dx - 22, dy - 6, dw + 44, 3); v65eDoor(g, X(dx), Y(dy), dw, dh, {glass:true, col:'#e9eef5', col2:'#d6dbe6'});
  [dx - 30, dx + dw + 30].forEach(x => v65ePot(g, X(x), Y(bh - 6)));
  c.ox = ox; c.oy = oy; V51T.spr[key] = c; return c;
}
function v65eTechGlow(){
  if(V51T.spr.glow) return V51T.spr.glow; const b = v51tSprite('ha'), G = v51tGeo(), P = V51T_PHI, bw = G.bw, bh = G.bh, main = G.main, rH = Math.round(bh/P**4);
  const [c, g] = v65eCv(b.width, b.height), R = v65eCR(g, b.ox, b.oy), gx0 = 14, gx1 = main - 14, gy0 = rH + 60, cw = (gx1 - gx0)/5;
  for(let i = 0; i < 5; i++){ R('rgba(120,220,255,.5)', gx0 + i*cw + 6, gy0 + 2, cw - 12, 46); if(i !== 2) R('rgba(120,220,255,.5)', gx0 + i*cw + 6, gy0 + 72, cw - 12, 50); }
  R('rgba(255,227,110,.55)', main/2 - 80, 60, 160, 30);
  const wx0 = main + 10, ww = bw - main - 20, fl = (bh - rH - 22)/3;
  for(let f = 0; f < 3; f++){ const y = rH + 6 + f*fl; for(let k = 0; k < 3; k++){ const w = ww/3 - 8, x = wx0 + k*(ww/3) + 4, h = Math.min(fl - 16, w*P); R('rgba(90,200,255,.55)', x + 2, y + 8, w - 4, h - 4); R('rgba(170,255,255,1)', x + w/2 - 7, y + 6 + h - 14, 14, 8); } }
  const dw = G.dw, dh = Math.round(bh/P/P); R('rgba(255,240,190,.75)', main/2 - dw/2, bh - 10 - dh, dw, dh);
  V51T.spr.glow = c; return c;
}
function v65eTechGround(g, thumb){
  const G = v51tGeo(), dong = v65eDong(), P = V51T_PHI, f = G.front, y = G.yard;
  v65eR(g, V65E_O, f.x0 - 10, G.gy - 8, f.x1 - f.x0 + 20, f.y1 - G.gy + 10); v65ePave(g, f.x0 - 8, G.gy - 6, f.x1 - f.x0 + 16, f.y1 - G.gy + 6, 'slab');
  const pw = Math.round(G.dw*P); v65eR(g, V65E_O, G.door[0] - pw/2 - 2, G.gy, pw + 4, G.y1 - G.gy + 30); v65ePave(g, G.door[0] - pw/2, G.gy, pw, G.y1 - G.gy + 30, 'cob');
  // sân robot: thảm cao su có viền gỗ, đường dò line, ô sạc
  v65eR(g, V65E_O, y.x0 + 2, y.y0 + 2, y.x1 - y.x0 - 4, y.y1 - y.y0 - 4); v65eR(g, '#8a5a35', y.x0 + 4, y.y0 + 4, y.x1 - y.x0 - 8, y.y1 - y.y0 - 8);
  v65eR(g, dong ? '#bcd3dd' : '#3aa6a0', y.x0 + 10, y.y0 + 10, y.x1 - y.x0 - 20, y.y1 - y.y0 - 20);
  if(!thumb){ g.fillStyle = 'rgba(255,255,255,.08)'; for(let yy = y.y0 + 10; yy < y.y1 - 10; yy += 30) for(let xx = y.x0 + 10 + ((yy - y.y0)/30 % 2)*30; xx < y.x1 - 40; xx += 60) g.fillRect(xx, yy, 30, 30); }
  const T = G.track; g.strokeStyle = V65E_O; g.lineWidth = 10; g.beginPath(); if(g.roundRect) g.roundRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 46); else g.rect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0); g.stroke();
  g.strokeStyle = '#34373e'; g.lineWidth = 7; g.stroke(); g.strokeStyle = '#f4f4f4'; g.lineWidth = 2; g.setLineDash([10, 10]); g.stroke(); g.setLineDash([]);
  for(let i = 0; i < 4; i++){ g.fillStyle = i % 2 ? '#1b2235' : '#f4f4f4'; g.fillRect(T.x0 - 8 + i*4, (T.y0 + T.y1)/2 - 2, 4, 14); }
  const by = T.y1 + 26; for(let i = 0; i < 6; i++) v65eBox(g, V51T_RUBIK[i], y.x0 + 30 + (i % 3)*26, by + Math.floor(i/3)*26, 22, 22);
  v65eBox(g, '#ffd23f', y.x1 - 90, by, 54, 48); v65eR(g, '#1b2235', y.x1 - 84, by + 6, 42, 36); g.fillStyle = '#ffd23f'; g.font = "800 22px Nunito, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚡', y.x1 - 63, by + 25); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  if(thumb) return;
  // cây, ghế, giá xe đạp gỗ trên quảng trường
  v65eTree(g, f.x0 + 34, f.y1 - 34, 'tree', 1); v65eTree(g, f.x1 - 40, f.y1 - 34, 'tree', 2);
  v65eR(g, V65E_O, f.x0 + 86, f.y1 - 42, 76, 20); v65eR(g, '#9a6236', f.x0 + 88, f.y1 - 40, 72, 16); for(let i = 0; i < 5; i++) v65eR(g, '#5b3b26', f.x0 + 92 + i*14, f.y1 - 38, 4, 12);
  v65eBench(g, f.x1 - 120, f.y1 - 20);
}

// ---------- 2. Trạm cứu hỏa (v53c): gara mái ngói đỏ, cánh văn phòng, tháp phơi vòi có đèn ----------
function v65eFireSpr(se){
  const key = 'fs' + se; if(V53C.spr[key]) return V53C.spr[key]; const G = v53cGeo('fire'), P = V53C_PHI, bw = G.bw, bh = G.bh, ox = 12, oy = 214;
  const [c, g] = v65eCv(bw + 24, bh + oy + 8), R = v65eCR(g, ox, oy), X = x => ox + x, Y = y => oy + y;
  const main = Math.round(bw/P), tw = Math.round(bh/P**3), th = Math.round(bh*P), tx = bw - tw - 4;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(X(6), Y(bh - 2), bw, 10);
  // tháp phơi vòi (sau): gạch đỏ, cửa sổ nhỏ, mái chóp NA
  v65eWall(g, X(tx), Y(bh - th + 20), tw, th - 20, 'brick'); for(let y = bh - th + 40; y < bh - 40; y += 40) v65eWin(g, X(tx + tw/2 - 8), Y(y), 16, 20, {sill:false});
  v65eRoof(g, 12, X(tx - 4), Y(bh - th - 40), 2, 2, '#b8432f');
  // cánh văn phòng 2 tầng
  v65eRoof(g, 0, X(main - 4), Y(34), 3, 2, null); v65eWall(g, X(main), Y(98), tx - main, bh - 98, 'cream');
  for(let f = 0; f < 2; f++) v65eWin(g, X(main + 12), Y(110 + f*58), 26, 32, {box:f === 0}); for(let f = 0; f < 2; f++) v65eWin(g, X(main + 52), Y(110 + f*58), 26, 32, {box:f === 0});
  // gara chính: mái ngói đỏ, tường gạch, 2 cửa cuốn (đúng chỗ cũ)
  v65eRoof(g, 12, X(6), Y(4), 7, 2, null); v65eWall(g, X(0), Y(68), main, bh - 68, 'brick');
  const dw = Math.round((main - 40)/2.2), dh = Math.min(bh - Math.round(bh/P**4) - 52, Math.round(dw*P*.95));
  for(let i = 0; i < 2; i++){ const x = 14 + i*(dw + Math.round(dw*.2) + 6), y = bh - 8 - dh;
    R(V65E_O, x - 8, y - 18, dw + 16, dh + 18); R('#f2ede4', x - 6, y - 16, dw + 12, dh + 16); R('#c8221b', x - 6, y - 16, dw + 12, 8); R('#fff', x + dw/2 - 10, y - 14, 20, 4);
    R(V65E_O, x - 2, y - 2, dw + 4, dh + 2); R('#e9e4da', x, y, dw, dh); for(let k = 0; k < dh; k += 8){ R('#c9c2b4', x, y + k + 6, dw, 2); } R('#7fc8e8', x + 8, y + 14, dw - 16, 14); R(V65E_O, x + 8, y + 20, dw - 16, 2); R('#ffd23f', x + 4, y + dh - 4, dw - 8, 4); }
  v65ePlaque(g, X(main/2), Y(24), '🚒 Cứu hỏa 114', '#7a1f17', 18);
  R('#ffd23f', main + 8, bh - 56, 30, 4); v65eDoor(g, X(main + 10), Y(bh - 50), 30, 42, {col:'#c8221b', col2:'#e8453c'});
  c.ox = ox; c.oy = oy; c.tw = tw; c.th = th + 2; V53C.spr[key] = c; return c;
}

// ---------- 3. Đồn cảnh sát: mái xanh lam, sảnh cột trắng, đèn hiệu trên nóc (vẽ động đúng chỗ cũ) ----------
function v65ePoliceSpr(se){
  const key = 'ps' + se; if(V53C.spr[key]) return V53C.spr[key]; const G = v53cGeo('police'), P = V53C_PHI, bw = G.bw, bh = G.bh, ox = 12, oy = 70;
  const [c, g] = v65eCv(bw + 24, bh + oy + 8), R = v65eCR(g, ox, oy), X = x => ox + x, Y = y => oy + y, mid = Math.round(bw/P/P), mx = (bw - mid)/2;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(X(6), Y(bh - 2), bw, 10);
  v65eRoof(g, 12, X(0), Y(-18), 12, 3, '#2b4c9b'); v65eWall(g, X(0), Y(76), bw, bh - 76, 'blue');
  R('#1d2c55', 0, 76, bw, 6); R('#ffffff', 0, 82, bw, 3);
  for(const sx of [0, mx + mid]) for(let f = 0; f < 2; f++) for(let k = 0; k < 2; k++){ const w = Math.round(mx/2 - 22), x = sx + 14 + k*(mx/2), y = 100 + f*66; v65eWin(g, X(x), Y(y), w, 40, {fr:'#1d2c55', gl:'#9cd4f2', gl2:'#e2f6ff', box:f === 0}); }
  // sảnh giữa nhô ra: mái riêng + 4 cột + cửa kính + bậc
  v65eRoof(g, 12, X(mx - 8), Y(-34), Math.ceil((mid + 16)/32), 3, '#1d2c55'); v65eWall(g, X(mx), Y(66), mid, bh - 66, 'white');
  R(V65E_O, bw/2 - 30, 13, 60, 14); R('#2b2430', bw/2 - 28, 15, 56, 10);   // hộp đèn hiệu (đèn sáng vẽ động)
  v65ePlaque(g, X(bw/2), Y(72), '🚓 Cảnh sát 113', '#1d2c55', 18);
  for(let i = 0; i < 4; i++){ const x = mx + 8 + i*((mid - 22)/3); R(V65E_O, x - 2, 108, 14, bh - 118); R('#fbf8f1', x, 110, 10, bh - 122); R('#d6d0c2', x + 7, 110, 3, bh - 122); }
  const dw = Math.round(mid/P/P), dh = Math.round(dw*P); v65eDoor(g, X(bw/2 - dw/2), Y(bh - 10 - dh), dw, dh, {glass:true, col:'#e9eef5', col2:'#d6dbe6'});
  v65eSteps(g, X(bw/2), Y(bh - 8), dw + 16, 2);
  [mx - 18, mx + mid + 18].forEach(x => v65ePot(g, X(x), Y(bh - 4)));
  c.ox = ox; c.oy = oy; V53C.spr[key] = c; return c;
}

// ---------- 4. Tháp Rubik 81 (thiết kế gốc): bục mái vàng + 6 tầng mái ngói 6 màu + vương miện khối Rubik ----------
function v65eTowerTiers(){
  const G = v53cGeo('tower81'), n = 6, W = [], crown = 110; let s = 0;
  for(let i = 0; i < n; i++){ W.push(Math.round(G.tw*Math.pow(V53C_PHI, -i/3))); s += W[W.length - 1]; }
  let y = 0; return W.map((w, i) => { const h = Math.round(w/s*(G.th - crown)), t = {i, w, h, y0:y, y1:y + h}; y += h; return t; });   // y tính từ chân tháp lên
}
function v65eTowerSpr(se){
  const key = 'tw' + se; if(V53C.spr[key]) return V53C.spr[key]; const G = v53cGeo('tower81'), P = V53C_PHI, W = G.W, bh = G.bh, pod = Math.round(bh/P), spire = Math.round(G.th/P**4);
  const ox = 12, oy = G.th + spire + 30, [c, g] = v65eCv(W + 24, oy + bh + 8), cx = ox + W/2, base = oy + bh - pod, R = v65eCR(g, ox, oy);
  const T = v65eTowerTiers(), tint = ['#e8453c', '#ff8a2b', '#ffd23f', '#2fbf71', '#3d7bff', '#7b4fd0'];
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ox + 6, oy + bh - 2, W, 10);
  // thân tháp: từng tầng tường đá kem, lưới cửa sổ (đèn đêm khớp lưới), cột góc, dải sàn; mái ngói tầng trên đè lên
  T.forEach(t => { const x = cx - t.w/2, y = base - t.y1, h = t.h;
    v65eWall(g, x, y, t.w, h, 'cream'); v65eR(g, '#b9a37c', x, y, 10, h); v65eR(g, '#b9a37c', x + t.w - 10, y, 10, h);
    for(let yy = y + 30; yy < y + h - 18; yy += 24) for(let xx = x + 16; xx < x + t.w - 22; xx += 16){ v65eR(g, V65E_O, xx - 1, yy - 1, 10, 14); v65eR(g, '#5a7fa8', xx, yy, 8, 12); v65eR(g, '#a8d4f0', xx + 1, yy + 1, 2, 5); }
    if(t.i === 2){ const fy = y + Math.round(h/2) - 10; v65eR(g, V65E_O, x - 2, fy - 2, t.w + 4, 22); v65eR(g, '#20324f', x, fy, t.w, 18); for(let xx = x + 4; xx < x + t.w - 6; xx += 8) v65eR(g, '#ffd98a', xx, fy + 4, 5, 10); } });
  T.slice().reverse().forEach(t => { const rw = Math.ceil((t.w + 36)/32), x = cx - rw*16; v65eRoof(g, 12, x, base - t.y1 - 26, rw, 1, tint[t.i], .5); });
  // vương miện: khối Rubik 3×3 lớn có mặt bên tối hơn + đài quan sát kính
  const top = base - G.th, cs = 34, cw3 = cs*3; v65eR(g, V65E_O, cx - 60, top + 96, 120, 16); v65eR(g, '#bfefff', cx - 58, top + 98, 116, 12);
  v65eCube(g, cx - cw3/2, top + 4, cs, 4); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cx + cs/2, top + 4, cs, cw3 - 1);
  // chóp ăng-ten (cao th/φ⁴), đèn chớp vẽ động ở đỉnh
  v65eR(g, V65E_O, cx - 4, top - spire, 8, spire + 6); v65eR(g, '#c9d2de', cx - 2, top - spire, 4, spire + 6); for(let y = top - spire + 12; y < top; y += 20) v65eR(g, '#8d97a6', cx - 7, y, 14, 3);
  // bục đế: mái ngói vàng, tường trắng, cửa kính giữa, biển tên, dải 6 màu
  v65eRoof(g, 12, ox + 3, oy + bh - pod - 64, 15, 2, '#d4a52c'); v65eWall(g, ox, oy + bh - pod, W, pod, 'white');
  for(let x = 14; x < W - 30; x += 40){ if(Math.abs(x + 12 - W/2) < 70) continue; v65eWin(g, ox + x, oy + bh - pod + 24, 24, 34, {fr:'#c9a24a', gl:'#7fb6dc', gl2:'#d4f0ff', box:true}); }
  const dw = Math.round(pod/P), dhh = Math.round(pod - 34); v65eDoor(g, cx - dw/2, oy + bh - 6 - dhh, dw, dhh, {glass:true, col:'#e8ecf3', col2:'#c7cfdc'});
  v65ePlaque(g, cx, oy + bh - pod - 46, '🏙️ Tháp Rubik 81', '#3a2a00', 18);
  for(let i = 0; i < 6; i++) R(V65E_RUBIK[i], W/2 - 48 + i*16, bh - 8, 14, 4);
  c.ox = ox; c.oy = oy; c.base = base - oy; c.pod = pod; c.spire = spire; V53C.spr[key] = c; return c;
}
function v65eTowerGlow(){
  if(V53C.spr.twg) return V53C.spr.twg; const b = v53cTowerSpr('ha'), G = v53cGeo('tower81'), [c, g] = v65eCv(b.width, b.height), cx = b.ox + G.W/2, base = b.oy + b.base;
  v65eTowerTiers().forEach(t => { const x = cx - t.w/2, y = base - t.y1; for(let yy = y + 30, n = 0; yy < y + t.h - 18; yy += 24, n++) for(let xx = x + 16; xx < x + t.w - 22; xx += 16){ const h = Math.sin(xx*12.9898 + n*78.233 + t.i*7)*43758.5453, q = h - Math.floor(h); if(q < .5) continue;
    g.fillStyle = q > .85 ? 'rgba(255,214,140,.75)' : 'rgba(255,190,110,.5)'; g.fillRect(Math.round(xx), Math.round(yy), 8, 12); } });
  g.fillStyle = 'rgba(160,240,255,.95)'; g.fillRect(cx - 58, base - G.th + 98, 116, 12);
  g.fillStyle = 'rgba(255,220,150,.35)'; for(let x = 14; x < G.W - 30; x += 40){ if(Math.abs(x + 12 - G.W/2) < 70) continue; g.fillRect(b.ox + x, b.oy + G.bh - b.pod + 24, 24, 34); }
  V53C.spr.twg = c; return c;
}

// ---------- 5. nền: sân lát đá NA, bãi đỗ, sân tập, quảng trường tháp (cùng chỗ các vật cũ) ----------
function v65eCivicGround(g, id, thumb){
  const G = v53cGeo(id), dong = v65eDong(), P = V53C_PHI;
  if(id === 'tower81'){
    const x0 = G.x0 - 10, y0 = G.gy - 6, w = G.x1 - G.x0 + 20, h = G.y1 - G.gy + 16; v65eR(g, V65E_O, x0 - 2, y0 - 2, w + 4, h + 4); v65ePave(g, x0, y0, w, h, 'orn');
    const sx = G.cx, sy = G.gy + (G.y1 - G.gy)/2 + 6;
    if(!thumb){ g.strokeStyle = 'rgba(122,74,40,.55)'; g.lineWidth = 4; g.beginPath(); for(let a = 0; a < 4.2*Math.PI; a += .08){ const r = 3*Math.pow(P, a/(Math.PI/2)); if(r > 70) break; const x = sx + Math.cos(a)*r, y = sy + Math.sin(a)*r*.6; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    g.fillStyle = V65E_O; g.beginPath(); g.ellipse(sx, sy, 38, 24, 0, 0, 7); g.fill(); g.fillStyle = '#d9d4c7'; g.beginPath(); g.ellipse(sx, sy, 35, 21, 0, 0, 7); g.fill(); g.fillStyle = dong ? '#d8eef6' : '#5ec7e6'; g.beginPath(); g.ellipse(sx, sy + 1, 28, 15, 0, 0, 7); g.fill();
    v65eR(g, V65E_O, G.door[0] - 42, G.gy, 84, G.y1 - G.gy + 34); v65ePave(g, G.door[0] - 40, G.gy, 80, G.y1 - G.gy + 34, 'cob');
    if(!thumb) for(const px of [G.x0 + 40, G.x1 - 40]) v65eTree(g, px, G.y1 - 30, 'tree', px > G.cx ? 2 : 0);
    if(!thumb) for(const px of [G.x0 + 110, G.x1 - 110]) v65eLamp(g, px, G.y1 - 20);
    return;
  }
  const fire = id === 'fire', ap = {x0:G.x0 - 6, y0:G.gy - 4, x1:G.x1 + 6, y1:G.y1 + 6};
  v65eR(g, V65E_O, ap.x0 - 2, ap.y0 - 2, ap.x1 - ap.x0 + 4, ap.y1 - ap.y0 + 4); v65ePave(g, ap.x0, ap.y0, ap.x1 - ap.x0, ap.y1 - ap.y0, fire ? 'slab' : 'grey');
  // vườn nhỏ bên hông (khối cỏ NA + cây)
  { const s = G.side, x = s.x0 + 14, y = G.y0 + 8, wT = Math.floor((s.x1 - s.x0 - 28)/32), hT = Math.max(2, Math.floor((G.gy - G.y0 - 12)/32)); v64sNine(g, 'FL', 0, dong ? 12 : 6, x, y, wT, hT);
    if(!thumb){ if(!dong){ const fl = [[0, 11], [3, 11], [6, 11], [1, 11]]; for(let j = 0; j < hT - 1; j++) for(let k = 0; k < wT; k++) if((j + k) % 2 === 0) v64sT(g, 'N', fl[(j + k) % 4][0], fl[(j + k) % 4][1], x + k*32 + 4, y + j*32 + 4, 1, 1, 1.5); }
      v65eTree(g, x + 40, y + hT*32 - 6, 'tree', 0); v65eTree(g, x + wT*32 - 40, y + hT*32 - 10, 'pine', 1); v65eBush(g, x + wT*16, y + hT*32 - 4, 3); v65eBench(g, x + wT*16, y + 40); } }
  v65eR(g, V65E_O, G.door[0] - 46, G.y1 - 10, 92, 46); v65ePave(g, G.door[0] - 44, G.y1 - 10, 88, 46, 'cob');
  if(fire){
    g.fillStyle = '#e8372c'; for(let i = 0; i < 2; i++) g.fillRect(G.x0 + 14 + i*96, G.gy + 2, 84, 4);
    g.fillStyle = '#ffd23f'; for(let x = G.x0 + 10; x < G.x0 + G.bw - 10; x += 26) g.fillRect(x, G.y1 - 18, 14, 5);
    const sx = G.side.x0 + 40, sy = G.gy + 50; v65eR(g, V65E_O, sx - 9, sy - 20, 18, 24); v65eR(g, '#c8221b', sx - 7, sy - 18, 14, 20); v65eR(g, V65E_O, sx - 13, sy - 14, 26, 9); v65eR(g, '#c8221b', sx - 11, sy - 12, 22, 5); v65eR(g, '#ffd23f', sx - 4, sy - 22, 8, 4);
    for(let i = 0; i < 4; i++){ const x = G.side.x0 + 90 + i*28, y = G.gy + 96; g.fillStyle = V65E_O; g.beginPath(); g.moveTo(x, y - 21); g.lineTo(x - 9, y + 1); g.lineTo(x + 9, y + 1); g.fill(); g.fillStyle = '#ff8a1e'; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x - 7, y); g.lineTo(x + 7, y); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 4, y - 9, 8, 3); }
    g.strokeStyle = V65E_O; g.lineWidth = 5; g.beginPath(); g.arc(G.side.x1 - 50, G.gy + 46, 16, 0, 7); g.stroke(); g.strokeStyle = '#f4f4f4'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.arc(G.side.x1 - 50, G.gy + 46, 9, 0, 7); g.stroke();
  } else {
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 3; for(let i = 0; i < 4; i++){ const x = G.side.x0 + 20 + i*52; g.beginPath(); g.moveTo(x, G.gy + 20); g.lineTo(x, G.gy + 110); g.stroke(); }
    v65eR(g, '#3a3d45', G.x0 + 20, G.y1 - 54, G.bw - 40, 40); g.fillStyle = '#f4f4f4'; for(let x = G.x0 + 30; x < G.x0 + G.bw - 30; x += 22) g.fillRect(x, G.y1 - 50, 12, 32);
    const fx = G.side.x1 - 28, fy = G.y0 + 30; v65eR(g, V65E_O, fx - 12, fy + 118, 24, 12); v65eR(g, '#9aa1b2', fx - 10, fy + 120, 20, 8);
  }
  if(!thumb){ v65eLamp(g, G.door[0] - 56, G.y1 - 2); v65eLamp(g, G.door[0] + 56, G.y1 - 2); }
}

function v65eCivicInit(){
  if(typeof v51tSprite === 'function'){
    const s0 = v51tSprite; v51tSprite = function(se){ return V65E.ok ? v65eTechSpr(se) : s0(se); };
    const gl0 = v51tGlowSprite; v51tGlowSprite = function(){ return V65E.ok ? v65eTechGlow() : gl0(); };
    const gr0 = v51tGround; v51tGround = function(g, thumb){ if(!V65E.ok) return gr0(g, thumb); try { v65eTechGround(g, thumb); } catch(e){ console.warn('v65e tech ground', e); gr0(g, thumb); } };
  }
  if(typeof v53cFireSpr === 'function'){
    const f0 = v53cFireSpr; v53cFireSpr = function(se){ return V65E.ok ? v65eFireSpr(se) : f0(se); };
    const p0 = v53cPoliceSpr; v53cPoliceSpr = function(se){ return V65E.ok ? v65ePoliceSpr(se) : p0(se); };
    const t0 = v53cTowerSpr; v53cTowerSpr = function(se){ return V65E.ok ? v65eTowerSpr(se) : t0(se); };
    const tg0 = v53cTowerGlow; v53cTowerGlow = function(){ return V65E.ok ? v65eTowerGlow() : tg0(); };
    const tc0 = v53cTowerCols; v53cTowerCols = function(){ return V65E.ok ? [] : tc0(); };   // dải LED dọc cột không còn (tháp mới không có cột)
    const g0 = v53cGround; v53cGround = function(g, id, thumb){ if(!V65E.ok) return g0(g, id, thumb); try { v65eCivicGround(g, id, thumb); } catch(e){ console.warn('v65e civic ground', e); g0(g, id, thumb); } };
  }
}
